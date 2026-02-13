window.PhoneMod = window.PhoneMod || {};

// =================== 操控手机 =====================
PhoneMod.checkPhoneDisabled = function() {
  const phone = document.getElementById("smart-phone-container");
  if (!phone) return;
  if (PhoneMod.shouldUsePhone()) {
    phone.classList.remove("phone-disabled");
  } else {
    phone.classList.add("phone-disabled");
  }
}
PhoneMod.togglePhone = function(forceOpen) {
  const phone = document.getElementById("smart-phone-container");
  if (!phone) return;
  if (PhoneMod.shouldUsePhone()) {
    if (forceOpen === true) {
        phone.classList.add("phone-open");
    } else {
        phone.classList.toggle("phone-open");
        if (V.phoneAlarmTriggered && !phone.classList.contains("phone-open")) PhoneMod.cancelAlarm();
    }
  }
};
PhoneMod.toggleApp = function(AppName) {
    V.phoneApp = AppName;
    Engine.play(passage()); 
    PhoneMod.togglePhone(true);
};
$(document).on("keyup", function(event) { // 监听 Control 键
    if (event.key === "Control") {
        PhoneMod.togglePhone();
    }
});
PhoneMod.PhoneUIInit = function (ev) {
  if (!PhoneMod.shouldShowPhone()) return;

  const phoneUI = document.createElement('div');
  phoneUI.id = "phone-wrapper";
  $(ev.content).append(phoneUI);
  new Wikifier(phoneUI, "<<smartphone_render>>");

  setTimeout(() => {
    const alarmTriggered = PhoneMod.checkAlarms();
    if (!alarmTriggered) PhoneMod.checkPhoneDisabled();
  }, 10);
};


// ================== passage 注入 ==================
$(document).on(":passagerender", function (ev) {
  PhoneMod.PhoneUIInit(ev);
  PhoneMod.eventsLoad(ev);
});
$(document).one(":passageinit", function () {
  PhoneMod.OnMacro("journal", PhoneMod.ShowPhoneJournal)
});

PhoneMod.eventsLoad = function(ev) {
  PhoneMod.events.forEach(function(event) {
    if (V.passage === event.passage) {
      if (event.chance === undefined || Math.random() < event.chance) {
        const $target = $(ev.content).find(`a[data-passage="${event.target}"]`);
        if ($target.length > 0) {
            if (event.goto === true) {
              new Wikifier(null, `<<goto "${event.event}">>`);
            } else {
              const Div = document.createElement("div");
              Div.style.display = "inline";
              new Wikifier(Div, `<<include "${event.event}">>`);
              if (event.position === "replace") {
                $target.first().replaceWith(Div);
              } else if (event.position === "before") {
                $target.first().before(Div);
              } else {
                $target.first().after(Div);
              }
            }
        }
        if (event.replace_target) {
          const $replaceTarget = $(ev.content).find(`a[data-passage="${event.replace_target}"]`);
          if ($replaceTarget.length > 0) {
            const Div = document.createElement("div");
            Div.style.display = "inline";
            new Wikifier(Div, `<<include "${event.replace_event}">>`);
            $replaceTarget.first().replaceWith(Div);
          }
        }
  }}})
}


// ==================== 闹钟实现 ====================
PhoneMod.initAlarm = function() {
    setTimeout(() => {
        if (typeof Time === 'undefined' || !Time.date) {
            document.getElementById('phone-alarm-time').value = "00:00"
        } else {
            let h = Time.date.hour;
            let m = Time.date.minute;
            m += 1;
            if (m >= 60) {
                m = 0;
                h += 1;
                if (h >= 24) {
                    h = 0;
                }
            }
            document.getElementById('phone-alarm-time').value = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m)
        }

        PhoneMod.toggleAlarmType("today");

    }, 10);
};
PhoneMod.checkAlarms = function() { // 闹钟检查
    // 如果闹钟正在触发、未被关闭而切换了Passage，则仍然需要响铃
    let shouldTrigger = false;

    if (V.phoneAlarmTriggered) {
        setTimeout(() => PhoneMod.togglePhone(true), 10);
    }
    
    if (!V.phoneAlarms || V.phoneAlarms.length === 0) return false;
    let now = PhoneMod.getAbsTime();

    // 确保V.lastAlarmCheckTime存在
    if (!V.lastAlarmCheckTime) {
        V.lastAlarmCheckTime = {
            year: now.year,
            month: now.month,
            day: now.day,
            hour: now.hour,
            minute: now.minute
        };
    }

    // 遍历闹钟
    for (let i = 0; i < V.phoneAlarms.length; i++) {
        const alarm = V.phoneAlarms[i];
        if (!alarm.active) continue;
        
        let shouldTrigger = false;
        
        if (alarm.type === "once") {
            // 一次性闹钟：检查是否在V.lastAlarmCheckTime到now的时间段内
            const alarmDate = new Date(alarm.year, alarm.month - 1, alarm.day, alarm.hour, alarm.minute);
            const lastCheck = new Date(
                V.lastAlarmCheckTime.year, 
                V.lastAlarmCheckTime.month - 1, 
                V.lastAlarmCheckTime.day, 
                V.lastAlarmCheckTime.hour, 
                V.lastAlarmCheckTime.minute
            );
            const currentTime = new Date(now.year, now.month - 1, now.day, now.hour, now.minute);
            
            // 如果闹钟时间在上次检查时间和当前时间之间（包含边界）
            shouldTrigger = (alarmDate >= lastCheck && alarmDate <= currentTime);
            
        } else if (alarm.type === "weekly") {
            // 周期闹钟：需要检查是否跨越了周边界
            // 计算从上次检查到当前时间之间的所有闹钟时间
            const lastCheck = new Date(
                V.lastAlarmCheckTime.year, 
                V.lastAlarmCheckTime.month - 1, 
                V.lastAlarmCheckTime.day, 
                V.lastAlarmCheckTime.hour, 
                V.lastAlarmCheckTime.minute
            );
            const currentTime = new Date(now.year, now.month - 1, now.day, now.hour, now.minute);
            
            // 获取上次检查和当前时间的星期几
            const lastCheckWeekDay = lastCheck.getDay(); // 0-6, 0=周六
            const currentWeekDay = currentTime.getDay();
            
            // 计算从上次检查到当前时间经过了多少天
            const timeDiff = currentTime.getTime() - lastCheck.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
            
            // 检查这段时间内是否有闹钟应该触发
            for (let dayOffset = 0; dayOffset <= daysDiff; dayOffset++) {
                const checkDate = new Date(lastCheck);
                checkDate.setDate(lastCheck.getDate() + dayOffset);
                let weekday = checkDate.getDay() + 1;
                if (weekday > 6) weekday = 0;
                
                // 如果这天是闹钟设定的星期几
                if (alarm.weekDays.contains(weekday)) {
                    // 创建这天的闹钟时间
                    const alarmDateTime = new Date(
                        checkDate.getFullYear(),
                        checkDate.getMonth(),
                        checkDate.getDate(),
                        alarm.hour,
                        alarm.minute
                    );
                    
                    // 检查这个闹钟时间是否在检查时间范围内
                    if (alarmDateTime >= lastCheck && alarmDateTime <= currentTime) {
                        shouldTrigger = true;
                        break;
                    }
                }
            }
        }
        
        if (shouldTrigger) {
            V.phoneAlarmTriggered = true;
            V.phoneAlarmCurrent = alarm;
            if (alarm.type === "once") alarm.active = false; // 一次性的关掉
            setTimeout(() => PhoneMod.togglePhone(true), 10);
        }
    }

    // 更新最后检查时间
    V.lastAlarmCheckTime = {
        year: now.year,
        month: now.month,
        day: now.day,
        hour: now.hour,
        minute: now.minute
    };
    return shouldTrigger
};
PhoneMod.cancelAlarm = function() { // 关闭闹钟
    V.phoneAlarmTriggered = false;
    V.phoneAlarmCurrent = undefined;

    const alarmTriggered = PhoneMod.checkAlarms();
    if (!alarmTriggered) PhoneMod.checkPhoneDisabled();
};
PhoneMod.deleteAlarm = function(index) { // 删除闹钟
    V.phoneAlarms.pop(index);
    Engine.play(passage()); 
    PhoneMod.togglePhone(true);
};
PhoneMod.toggleAlarmType = function(type) {
    document.getElementById('weekly-input').style.display = 'none';
    document.getElementById('phone-alarm-date').style.display = 'none';
    if(type === 'date') {
        document.getElementById('phone-alarm-date-input').value = PhoneMod.getDateString();
        document.getElementById('phone-alarm-date').style.display = 'block';
    } else if(type === 'weekly') {
        document.querySelectorAll(`input[name="weekday"]`).forEach(checkbox => {
            if (parseInt(checkbox.value) === Time.date.weekDay) {
                checkbox.checked = "checked"
            } else {
                checkbox.checked = ""
            }
        });
        document.getElementById('weekly-input').style.display = 'block';
    }
}
PhoneMod.submitAlarm = function() {
    const t = document.getElementById('phone-alarm-time').value;
    const msg = document.getElementById('phone-alarm-msg').value;
    const alarmType = document.querySelector('input[name="alarm-type"]:checked').value;
    
    if(t) {
        const timeParts = t.split(':');
        if(!V.phoneAlarms) V.phoneAlarms = [];
        
        if(alarmType === 'date' | alarmType === 'today') {
            let d = "";
            if(alarmType === 'today') {
                d = PhoneMod.getDateString();
            } else {
                d = document.getElementById('phone-alarm-date-input').value; // YYYY-MM-DD
            };

            if(d) {
                const dateParts = d.split('-');
                V.phoneAlarms.push({
                    type: "once",
                    year: parseInt(dateParts[0]),  // 添加年份以便更精确
                    month: parseInt(dateParts[1]),
                    day: parseInt(dateParts[2]),
                    hour: parseInt(timeParts[0]),
                    minute: parseInt(timeParts[1]),
                    msg: msg,
                    active: true
                });
            }
        } else {
            // 星期模式
            const selectedWeekdays = [];
            document.querySelectorAll('input[name="weekday"]:checked').forEach(checkbox => {
                selectedWeekdays.push(parseInt(checkbox.value));
            });
            
            V.phoneAlarms.push({
                type: "weekly",
                weekDays: selectedWeekdays,
                hour: parseInt(timeParts[0]),
                minute: parseInt(timeParts[1]),
                msg: msg,
                active: true
            });
        }
    };
    PhoneMod.toggleApp('alarm')
}
PhoneMod.getAlarmDesc = function(alarm) {
    if (alarm.type === "once") {
        return `${alarm.year}-${alarm.month}-${alarm.day}`
    } else {
        const weekdays = ['周六', '周日', '周一', '周二', '周三', '周四', '周五'];
        return alarm.weekDays.map(day => weekdays[day]).join(' ');
    }
}
// ================== 手机游戏实现 ==================
PhoneMod.getGameQuestion = function(category) {
    const pool = PhoneMod.PhoneGameQuestions[category];
    const rawQ = pool[Math.floor(Math.random() * pool.length)];
    
    // 1. 从 10 个错误选项中随机抽 3 个
    let selectedWrongs = PhoneMod.shuffle([...rawQ.w]).slice(0, 3);
    
    // 2. 组合正确答案和抽出的错误答案
    let options = [
        { text: rawQ.a, isCorrect: true },
        ...selectedWrongs.map(text => ({ text: text, isCorrect: false }))
    ];
    
    // 3. 再次打乱这 4 个选项的显示顺序
    PhoneMod.shuffle(options);
    
    return {
        title: rawQ.q,
        options: options
    };
}
// ==================== 设置实现 ====================
PhoneMod.handleWallpaperUpload = function(input) {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    
    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('不支持的文件格式！请上传 JPG, PNG, GIF 或 WebP 格式的图片。');
        input.value = ''; // 清空选择
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        // 保存到SugarCube变量
        V.wallpaperPath = e.target.result;
        Engine.play(passage())
    };
    reader.readAsDataURL(file);
}
PhoneMod.resetWallpaper = function() {
    V.wallpaperPath = undefined
    Engine.play(passage())
}
PhoneMod.toggleBlur = function(checked) {
    V.wallpaperBlur = checked;
};
PhoneMod.toggleDarken = function(checked) {
    V.wallpaperBlack = checked;
};


// ================== 游戏内容 ==================
PhoneMod.Phone = class {
  constructor() {
    this.price = undefined;
    this.newness = undefined;
    this.stolen = false;
    this.usable = false
  }

  generate() { // 生成一部手机
    this.price = 4000 + (Math.random() * 3000 - 3000 / 2);
    this.newness = Math.random();
  }

  newBuy(price, newness) {
    this.price = price;
    this.newness = newness;
    this.usable = true
    return this
  }

  newStolen() {
    this.stolen = true;
    this.generate()
    return this
  }
}

PhoneMod.BuyPhone = function(price) { // 购买一部手机
  V.PhoneOwned = V.PhoneOwned || []
  V.PhoneOwned.push(new PhoneMod.Phone().newBuy(price, 1));
}
PhoneMod.BuySecondPhone = function(price, newness) { // 购买一部二手手机
  V.PhoneOwned = V.PhoneOwned || []
  V.PhoneOwned.push(new PhoneMod.Phone().newBuy(price, newness));
}
PhoneMod.StolePhone = function() { // 盗窃一部手机
  V.PhoneOwned = V.PhoneOwned || []
  V.PhoneOwned.push(new PhoneMod.Phone().newStolen());
}

PhoneMod.ShowPhoneJournal = function() {
  if (V.PhoneOwned) {
    const Uls = document.getElementsByClassName("journal carry")
    if (Uls.length > 0) {
      let Ul = Uls[0];
      if (Uls.length > 1) Ul = Uls[1];
      const Li = document.createElement("li");
      new Wikifier(Li, `<<icon "phone/phones.png">> <span class="yellow">持有的手机</span>。可以出售给手机店。`);
      Ul.appendChild(Li);
      V.PhoneOwned.forEach(function(phone) {
        const Li = document.createElement("li");
        let info = PhoneMod.getPhoneConditionInfo(phone.newness);
        new Wikifier(Li, `<span style="margin-right: 50px"></span><<icon "phone/phone.png">>
          一部
          <span style='color: ${info.color}'>${info.text}</span>
          的手机，官网售价为
          <span class='gold'>£${Math.round(phone.price)}</span>。
          <<if ${phone.stolen}>>
            <span class='red'>盗窃得来</span>
            <<if ${phone.usable}>>
              <span class='yellow'密码已重置</span>
            <<else>>
              <span class='red'>因为密码未知而无法使用</span>
            <</if>>
          <<else>>
            <span class='green'>官方渠道购买</span>
          <</if>>`);
        Ul.appendChild(Li)
      })
  }}
}; 