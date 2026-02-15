console.log("| [SmartPhone] DoL万能的智能手机 正在加载：main.js");

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
        if (V.Phone.AlarmTriggered && !phone.classList.contains("phone-open")) PhoneMod.cancelAlarm();
    }
  }
};
PhoneMod.toggleApp = function(AppName, replay=true) {
    PhoneMod.getUsingPhone().newness = round(PhoneMod.getUsingPhone().newness - 0.01, 3);
    
    if (PhoneMod.getUsingPhone().newness <= 0) {
        PhoneMod.getUsingPhone().newness = 0;
        if (!PhoneMod.ChangeUsingPhone()) {
            Engine.play(passage()); 
            PhoneMod.addStoryCaptionContent("<span class='red'>你当前使用的手机已经损坏，无法继续使用了。<br>你的口袋里没有另外一部能够使用的手机了。</span>"); 
            return;
        } else {
            V.Phone.CurrentApp = AppName;
            if (replay) Engine.play(passage()); 
            PhoneMod.addStoryCaptionContent("<span class='red'>你当前使用的手机已经损坏，无法继续使用了。<br>你从口袋里找到了另外一部能够使用的手机作为替换。</span>"); 
        }
    } else {
        V.Phone.CurrentApp = AppName;
        if (replay) Engine.play(passage()); 
    }
    if (replay) PhoneMod.togglePhone(true);
};
$(document).on("keyup", function(event) { // 监听 Control 键
    if (event.key === "Control") {
        PhoneMod.togglePhone();
    }
});
PhoneMod.PhoneUIInit = function (ev) {
  if (!PhoneMod.shouldShowPhone()) return;

  PhoneMod.ChangeUsingPhone()

  const phoneUI = document.createElement('div');
  phoneUI.id = "phone-wrapper";
  $(ev.content).append(phoneUI);
  if (V.passage === "Start") {
    new Wikifier(phoneUI, "<<smartphone_render_preview>>");
  } else {
    const alarmTriggered = PhoneMod.checkAlarms();
    new Wikifier(phoneUI, "<<smartphone_render>>");
    setTimeout(() => {
        if (!alarmTriggered) PhoneMod.checkPhoneDisabled();
    }, 10);
  }
};


// ================== passage 注入 ==================
$(document).on(":passagerender", function (ev) {
    console.log(V);
    
    V.Phone = V.Phone || {}
    V.Phone.photography = V.Phone.photography || 0
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

    if (V.Phone.AlarmTriggered) {
        setTimeout(() => PhoneMod.togglePhone(true), 10);
    }
    
    if (!V.Phone.Alarms || V.Phone.Alarms.length === 0) return false;
    let now = PhoneMod.getAbsTime();

    if (!V.Phone.AlarmLastCheckTime) {
        V.Phone.AlarmLastCheckTime = {
            year: now.year,
            month: now.month,
            day: now.day,
            hour: now.hour,
            minute: now.minute
        };
    }

    // 遍历闹钟
    for (let i = 0; i < V.Phone.Alarms.length; i++) {
        const alarm = V.Phone.Alarms[i];
        if (!alarm.active) continue;
        
        let shouldTrigger = false;
        
        if (alarm.type === "once") {
            // 一次性闹钟：检查是否在V.Phone.AlarmLastCheckTime到now的时间段内
            const alarmDate = new Date(alarm.year, alarm.month - 1, alarm.day, alarm.hour, alarm.minute);
            const lastCheck = new Date(
                V.Phone.AlarmLastCheckTime.year, 
                V.Phone.AlarmLastCheckTime.month - 1, 
                V.Phone.AlarmLastCheckTime.day, 
                V.Phone.AlarmLastCheckTime.hour, 
                V.Phone.AlarmLastCheckTime.minute
            );
            const currentTime = new Date(now.year, now.month - 1, now.day, now.hour, now.minute);
            
            // 如果闹钟时间在上次检查时间和当前时间之间（包含边界）
            shouldTrigger = (alarmDate >= lastCheck && alarmDate <= currentTime);
            
        } else if (alarm.type === "weekly") {
            // 周期闹钟：需要检查是否跨越了周边界
            // 计算从上次检查到当前时间之间的所有闹钟时间
            const lastCheck = new Date(
                V.Phone.AlarmLastCheckTime.year, 
                V.Phone.AlarmLastCheckTime.month - 1, 
                V.Phone.AlarmLastCheckTime.day, 
                V.Phone.AlarmLastCheckTime.hour, 
                V.Phone.AlarmLastCheckTime.minute
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
            V.Phone.AlarmTriggered = true;
            V.Phone.AlarmCurrent = alarm;
            if (alarm.type === "once") alarm.active = false; // 一次性的关掉
            setTimeout(() => PhoneMod.togglePhone(true), 10);
            break; // 只触发一个闹钟，优先级按照数组顺序
        }
    }

    // 更新最后检查时间
    V.Phone.AlarmLastCheckTime = {
        year: now.year,
        month: now.month,
        day: now.day,
        hour: now.hour,
        minute: now.minute
    };
    return shouldTrigger
};
PhoneMod.cancelAlarm = function() { // 关闭闹钟
    V.Phone.AlarmTriggered = false;
    V.Phone.AlarmCurrent = undefined;

    const alarmTriggered = PhoneMod.checkAlarms();
    if (!alarmTriggered) PhoneMod.checkPhoneDisabled();
    Engine.play(passage()); 
};
PhoneMod.deleteAlarm = function(index) { // 删除闹钟
    V.Phone.Alarms.pop(index);
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
        if(!V.Phone.Alarms) V.Phone.Alarms = [];
        
        if(alarmType === 'date' | alarmType === 'today') {
            let d = "";
            if(alarmType === 'today') {
                d = PhoneMod.getDateString();
            } else {
                d = document.getElementById('phone-alarm-date-input').value; // YYYY-MM-DD
            };

            if(d) {
                const dateParts = d.split('-');
                V.Phone.Alarms.push({
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
            
            V.Phone.Alarms.push({
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
        V.Phone.SettingsWallpaperPath = e.target.result;
        Engine.play(passage())
    };
    reader.readAsDataURL(file);
}
PhoneMod.resetWallpaper = function() {
    V.Phone.SettingsWallpaperPath = undefined
    Engine.play(passage())
}
PhoneMod.toggleBlur = function(checked) {
    V.Phone.SettingsWallpaperBlur = checked;
};
PhoneMod.toggleDarken = function(checked) {
    V.Phone.SettingsWallpaperBlack = checked;
};
// ==================== 电话实现 ====================
PhoneMod.isContactKnown = function(name) {
    V.Phone.KnownContacts = V.Phone.KnownContacts || [];
    return V.Phone.KnownContacts.includes(name);
};
PhoneMod.addContact = function(name) {
    V.Phone.KnownContacts = V.Phone.KnownContacts || [];
    if (!V.Phone.KnownContacts.includes(name)) {
        V.Phone.KnownContacts.push(name);
    }
};
PhoneMod.getContact = function(name) {
    console.log(name);
    
    if (!PhoneMod.isContactKnown(name)) return null;
    return PhoneMod.Contacts.find(c => c.name === name);
};


// ================== 游戏内容 ==================
PhoneMod.Phone = class {
  constructor() {
    this.id = this.generateId();
    this.price = undefined;
    this.newness = 1;
    this.stolen = false;
    this.usable = false;
    this.second = false;
  }
  generateId(){
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    return uniqueId
  }
  return() {
    return {
        id: this.id,
        price: this.price,
        newness: this.newness,
        stolen: this.stolen,
        usable: this.usable,
        second: this.second
    }
  }
  generate() { // 生成一部手机
    this.price = Math.round(4000 + (Math.random() * 3000 - 3000 / 2));
    this.newness = Math.random();
  }
  newBuy(price) {
    this.price = price;
    this.usable = true
    return this.return();
  }
  newBuySecond(price, newness) {
    this.newBuy(price, newness)
    this.second = true
    return this.return();
  }
  newStolen() {
    this.stolen = true;
    this.generate()
    return this.return();
  }
}
PhoneMod.generatePassward = function() {
const chars = '0123456789';
let password = '';
for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
}
return password;
}

PhoneMod.BuyPhone = function(price) { // 购买一部手机
  V.Phone.Owned = V.Phone.Owned || []
  V.Phone.Owned.push(new PhoneMod.Phone().newBuy(price));
  PhoneMod.ChangeUsingPhone();
}
PhoneMod.BuySecondPhone = function(price, newness) { // 购买一部二手手机
  V.Phone.Owned = V.Phone.Owned || []
  V.Phone.Owned.push(new PhoneMod.Phone().newBuySecond(price, newness));
  PhoneMod.ChangeUsingPhone();
}
PhoneMod.StolePhone = function() { // 盗窃一部手机
  V.Phone.Owned = V.Phone.Owned || []
  V.Phone.Owned.push(new PhoneMod.Phone().newStolen());
}
PhoneMod.getSellPhonePrice = function(id, feng=false) { // 出售手机
    if (!V.Phone.Owned) return;
    const index = V.Phone.Owned.findIndex(p => p.id === id);
    if (index !== -1) {
        const phone = V.Phone.Owned[index];
        let price = phone.price;
        price *= phone.newness; // 根据新旧程度调整价格
        if (feng) price *= 0.9;
        price = round(price, 2)
        if (price <= 0) price = 1; // 最低售价为1
        return price;
    }
}
PhoneMod.isUsable = function(phone) { // 检查是否有可用的手机
    return phone && phone.usable && phone.newness > 0;
}
PhoneMod.SellPhone = function(id, feng=false) { // 出售手机
    console.log("Attempting to sell phone with id:", id);
    if (!V.Phone.Owned) return;
    const index = V.Phone.Owned.findIndex(p => p.id === id);
    if (index !== -1) {
        const moneyEarned = PhoneMod.getSellPhonePrice(id, feng) * 100;  // DoL中money单位是分，所以乘以100
        V.Phone.Owned.splice(index, 1);
        PhoneMod.ChangeUsingPhone();
        return moneyEarned;
    }
    return 0
}
PhoneMod.getUsingPhone = function() {
    if (!V.Phone.Using) return null;
    return PhoneMod.getPhone(V.Phone.Using);
}
PhoneMod.getPhone = function(id) {
    if (!V.Phone.Owned) return null;
    return V.Phone.Owned.find(p => p.id === id) || null;
}
PhoneMod.ChangeUsingPhone = function(phone=null) { // 切换正在使用的手机
    if (phone === null) {
        if (V.Phone.Using) {
            const PhoneUsing = V.Phone.Owned.find(p => p.id === V.Phone.Using)
            if (PhoneMod.isUsable(PhoneUsing)) return V.Phone.Using;
        }
        if (!V.Phone.Owned || V.Phone.Owned.length === 0) {
            V.Phone.Using = null;
        } else {
            V.Phone.Using = null
            for (var i = 0; i < V.Phone.Owned.length; i++) {
                if (PhoneMod.isUsable(V.Phone.Owned[i])) {
                    V.Phone.Using = V.Phone.Owned[i].id;
                    break;
                }
            }
        }
    } else {
        if (PhoneMod.isUsable(phone)) {
            V.Phone.Using = phone.id;
        } else {
            V.Phone.Using = null
        }
    }
    return V.Phone.Using;
}
PhoneMod.isCarryingStolenPhone = function(useableFilter=false) { // 检查是否携带盗窃来的手机
  if (!V.Phone.Owned) return false;
  for (let i = 0; i < V.Phone.Owned.length; i++) {
    if (V.Phone.Owned[i].stolen && (!useableFilter || !PhoneMod.isUsable(V.Phone.Owned[i]))) return true;
  }
  return false;
}

PhoneMod.ShowPhoneJournal = function() {  // 日志中显示手机信息
    if (V.Phone.Owned && V.Phone.Owned.length > 0) {
        const Uls = document.getElementsByClassName("journal carry")
        if (Uls.length > 0) {
            let Ul = Uls[0];
            if (Uls.length > 1) Ul = Uls[1];
            const Div = document.createElement("div");
            Div.id = "phone-journal";
            Ul.appendChild(Div);
            
            const Li = document.createElement("li");
            new Wikifier(Li, `<<icon "phone/phones.png">> <span class="yellow">持有的手机</span>。可以出售给手机店。`);
            Div.appendChild(Li);
            
            V.Phone.Owned.forEach(function(phone) {
                const Li = document.createElement("li");
                let info = PhoneMod.getPhoneConditionInfo(phone.newness);
                new Wikifier(Li, `
                    <span style="margin-right: 50px"></span>
                    <<if $Phone.PhoneUsing and "${phone.id}" eq $Phone.PhoneUsing>>
                        <<icon "phone/phone.png">>
                        <span class='teal'>正在使用</span> | 
                    <<elseif ${phone.stolen && !phone.usable}>>
                        <<icon "phone/phone_forbid.png">>
                    <<else>>
                        <<icon "phone/phone_disabled.png">> 
                        <<if ${phone.newness > 0}>>
                            <<link "切换到">> <<run PhoneMod.PhoneJournalChange("${phone.id}")>> <</link>> | 
                        <<else>>
                            <span class='red'>已损坏</span> |
                        <</if>>
                    <</if>>
                    一部
                    <span style='color: ${info.color}'>${info.text}</span>
                    的手机，官网售价为
                    <span class='gold'>£${Math.round(phone.price)}</span>。
                    <<if ${phone.stolen}>>
                        <span class='red'>盗窃得来</span>
                        <<if ${phone.usable}>>
                            <span class='yellow'>密码已重置</span>
                        <<else>>
                            <span class='red'>因为密码未知而无法使用</span>
                        <</if>>
                    <<else>>
                        <<if ${phone.second}>>
                            <span class='yellow'>地下手机店购买</span>
                        <<else>>
                            <span class='green'>官方渠道购买</span>
                        <</if>>
                    <</if>>`);
                Div.appendChild(Li)
            })
        }}
};
PhoneMod.PhoneJournalChange = function(id) { // 日志中更新手机信息
    const phone = V.Phone.Owned.find(p => p.id === id);
    if (phone) {
        PhoneMod.ChangeUsingPhone(phone);
    }
    const Div = document.getElementById("phone-journal");
    if (Div) {
        Div.remove();
        PhoneMod.ShowPhoneJournal();
    }
}