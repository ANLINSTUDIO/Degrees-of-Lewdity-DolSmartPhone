console.log("| [SmartPhone] DoL万能的智能手机 apps.js");

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
    V.Phone.AlarmsToTrigger = V.Phone.AlarmsToTrigger || []
    let shouldTrigger = false;

    // 如果闹钟正在触发、未被关闭而切换了Passage，则仍然需要响铃
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
            V.Phone.AlarmsToTrigger.push(alarm)
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
    if (V.Phone.AlarmsToTrigger && V.Phone.AlarmsToTrigger.length > 0) {
        V.Phone.AlarmTriggered = true;
        let alarm = V.Phone.AlarmsToTrigger.shift();
        V.Phone.AlarmCurrent = alarm;
        if (alarm.type === "once") alarm.active = false; // 一次性的关掉
        setTimeout(() => PhoneMod.togglePhone(true), 10);
    }
    return shouldTrigger;
};
PhoneMod.cancelAlarm = function() { // 关闭闹钟
    V.Phone.AlarmTriggered = false;
    V.Phone.AlarmCurrent = undefined;

    PhoneMod.togglePhone(false);
    PhoneMod.PhoneUIInit();
};
PhoneMod.deleteAlarm = function(index) { // 删除闹钟
    V.Phone.Alarms.pop(index);
    PhoneMod.PhoneUIInit(true, false);
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
    PhoneMod.PhoneUIInit(true, false);
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
        V.Phone.Settings.WallpaperPath = e.target.result;
        PhoneMod.PhoneUIInit(true, false);
    };
    reader.readAsDataURL(file);
}
PhoneMod.resetWallpaper = function() {
    V.Phone.Settings.WallpaperPath = undefined
    PhoneMod.PhoneUIInit(true, false);
}
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
    if (!PhoneMod.isContactKnown(name)) return null;
    return PhoneMod.Contacts.find(c => c.name === name);
};
// ==================== 相机实现 ====================
PhoneMod.initPhoto = function() {
    console.log("| [SmartPhone] 拍照！");
    
    setTimeout(() => {
        PhoneMod.PhotoDraw();
    }, 500)
}
PhoneMod.PhotoDraw = function() {
    // 获取原始画布
    const charSourceCanvas = document.querySelector(".mainCanvas");
    const bgSourceCanvas = document.getElementById("canvasSkybox").firstChild;
    
    // 获取目标画布
    const charCanvas = document.getElementById("char_canvas");
    const bgCanvas = document.getElementById("bg_canvas");
    
    // 获取上下文
    const charCtx = charCanvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    
    // 计算基础偏移
    const baseY = charSourceCanvas.height * 0.7;
    
    // 设置人物画布尺寸
    charCanvas.width = charSourceCanvas.width;
    charCanvas.height = baseY + charSourceCanvas.height;
    
    // 绘制人物
    charCtx.drawImage(charSourceCanvas, 0, baseY);
    
    // 设置背景画布
    const scaleFactor = 4;
    bgCanvas.width = charCanvas.width;
    bgCanvas.height = charCanvas.height;
    
    // 计算背景位置和尺寸
    const bgWidth = bgSourceCanvas.width * scaleFactor;
    const bgHeight = bgSourceCanvas.height * scaleFactor;
    const bgX = (bgCanvas.width - bgWidth) / 2;
    const bgY = -bgSourceCanvas.height * (scaleFactor - 1) + baseY;
    
    // 绘制背景
    bgCtx.drawImage(
        bgSourceCanvas, 
        0, 0, bgSourceCanvas.width, bgSourceCanvas.height,
        bgX, bgY, bgWidth, bgHeight
    );

    // 设置图片高度
    const resultCanvas = document.getElementById('result_canvas');
    const resultCtx = resultCanvas.getContext('2d');
    resultCanvas.width = charCanvas.width;
    resultCanvas.height = bgSourceCanvas.height * scaleFactor + bgY
    resultCtx.fillStyle = "white";
    resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height)

    setTimeout(PhoneMod.PhotoApplyFilter, 100)
}
PhoneMod.PhotoApplyFilter = function(filter="normal") {
    // 获取目标画布
    const charCanvas = document.getElementById("char_canvas");
    const bgCanvas = document.getElementById("bg_canvas");
    const resultCanvas = document.getElementById('result_canvas');
    
    // 获取上下文
    const resultCtx = resultCanvas.getContext('2d');

    resultCanvas.width = charCanvas.width;
    resultCtx.filter = PhoneMod.PhoneFilters[filter];
    resultCtx.drawImage(bgCanvas, 0, 0);
    resultCtx.drawImage(charCanvas, 0, 0);
};
PhoneMod.PhotoApplyGrain = function (intensity = 1) {  // 应用颗粒感
    const resultCanvas = document.getElementById('result_canvas');
    const resultCtx = resultCanvas.getContext('2d');
    const width = resultCanvas.width;
    const height = resultCanvas.height;
    
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = width;
    grainCanvas.height = height;
    const grainCtx = grainCanvas.getContext('2d');
    const imageData = grainCtx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const grain = Math.random() * 255 * intensity;
        data[i] = grain;     // R
        data[i + 1] = grain; // G
        data[i + 2] = grain; // B
        data[i + 3] = Math.random() * 0.3 * 255; // Alpha - 控制颗粒透明度
    }
    
    grainCtx.putImageData(imageData, 0, 0);
    
    // 使用混合模式叠加颗粒
    resultCtx.save();
    resultCtx.globalCompositeOperation = 'overlay';
    resultCtx.globalAlpha = 0.3;
    resultCtx.drawImage(grainCanvas, 0, 0);
    resultCtx.restore();
}
PhoneMod.PhotoApplyScratches = function() {  // 应用胶片划痕效果
    const resultCanvas = document.getElementById('result_canvas');
    const resultCtx = resultCanvas.getContext('2d');
    const width = resultCanvas.width;
    const height = resultCanvas.height;
    
    // 随机添加一些划痕
    resultCtx.save();
    resultCtx.globalAlpha = 0.1;
    resultCtx.strokeStyle = 'white';
    resultCtx.lineWidth = 1;
    
    for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.7) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            resultCtx.beginPath();
            resultCtx.moveTo(x, y);
            resultCtx.lineTo(x + 50, y + 30);
            resultCtx.stroke();
        }
    }
    
    resultCtx.restore();
};
PhoneMod.PhotoApplyVignette = function(intensity = 0.3) {  // 应用暗角效果
    const resultCanvas = document.getElementById('result_canvas');
    const resultCtx = resultCanvas.getContext('2d');
    const width = resultCanvas.width;
    const height = resultCanvas.height;
    
    // 创建径向渐变暗角
    const gradient = resultCtx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 1.5
    );
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
    
    resultCtx.fillStyle = gradient;
    resultCtx.globalCompositeOperation = 'multiply';
    resultCtx.fillRect(0, 0, width, height);
    resultCtx.globalCompositeOperation = 'source-over';
};
PhoneMod.PhotoCheckQuality = function() {
    let allure = 0
    const arousal_k = V.arousal / V.arousalmax  // 性奋
    const allure_k = V.allure / 8000  // 诱惑
    allure = arousal_k * 0.3 + allure_k * 0.7

    let quality = 0
    const photography_k = V.Phone.photography / 1000
    quality = photography_k * 0.8 + Math.random() * 0.2

    V.Phone.photoallure = allure
    V.Phone.photoquality = quality


    `提升诱惑的因素：
    服装：不同相关服装（例如项圈和贞操带增加1000点）会增加+0~1000
    裸装：上装、下装、内衣（上装）、内衣（下装）之中每有一处会增加+1000
    容貌：+~476/级（在容貌满级时增加3333点诱惑）
    任意转化：+500（除去狐化，它增加+750）
    头发长度：在满级时+250
    性相关声望：每种会在声名狼藉级别时+100，在满点时+200
    每种可见的体液（精液、粘液、花蜜）：+500 每种
    精液和/或粘液：+50玩家身上或体内每有一处
    血月期间：+2000诱惑
    耳中史莱姆信息素：当耳中史莱姆的成长度达到50后，+10每1成长

    倍乘诱惑的因素：
    夜晚：+50%
    赤裸上身（非男性）或赤裸下体：+20%
    同时赤裸上身（非男性）和下体：+40%`
}
PhoneMod.PhotoFlash = function(charCanvas, duration = 100) {
    return new Promise(resolve => {
        // 创建闪白层
        const flashCanvas = document.createElement('canvas');
        flashCanvas.width = charCanvas.width;
        flashCanvas.height = charCanvas.height;
        flashCanvas.style.position = 'absolute';
        flashCanvas.style.top = charCanvas.offsetTop + 'px';
        flashCanvas.style.left = charCanvas.offsetLeft + 'px';
        flashCanvas.style.pointerEvents = 'none';
        flashCanvas.style.transition = `opacity ${duration}ms ease-out`;
        
        const flashCtx = flashCanvas.getContext('2d');
        
        // 填充白色
        flashCtx.fillStyle = 'white';
        flashCtx.fillRect(0, 0, flashCanvas.width, flashCanvas.height);
        
        // 添加到DOM
        document.getElementById('photo').appendChild(flashCanvas);
        
        // 淡出效果
        requestAnimationFrame(() => {
            flashCanvas.style.opacity = '0';
        });
        
        // 移除元素
        setTimeout(() => {
            flashCanvas.remove();
            resolve();
        }, duration);
    });
};
PhoneMod.ToTakePhoto = function() {
    PhoneMod.toggleApp("photo")
}