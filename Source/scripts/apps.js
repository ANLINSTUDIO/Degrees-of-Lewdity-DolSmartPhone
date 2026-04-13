console.log("| [SmartPhone] DoL万能的智能手机 apps.js");

// ==================== 闹钟实现 ====================
PhoneMod.initAlarm = function() {
    const phone_alarm_time = document.getElementById('phone-alarm-time')
    if (!phone_alarm_time) return

    if (typeof Time === 'undefined' || !Time.date) {
        phone_alarm_time.value = "00:00"
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
        phone_alarm_time.value = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m)
    }

    PhoneMod.toggleAlarmType("today");
};
PhoneMod.checkAlarms = function(offset=0) { // 闹钟检查
    // 如果闹钟正在触发、未被关闭而切换了Passage，则仍然需要响铃
    if (V.Phone.AlarmTriggered) {
        setTimeout(() => PhoneMod.togglePhone(true), 10);
    }
    
    if (!V.Phone.Alarms || V.Phone.Alarms.length === 0) return false;
    let now = PhoneMod.getAbsTime();
    if (offset > 0) {
        let date = new Date(now.year, now.month - 1, now.day, now.hour, now.minute);
        // 加一小时
        date.setMinutes(date.getMinutes() + offset);
        // 转换回 getAbsTime 格式
        now = {
            year: date.getFullYear(),
            month: date.getMonth() + 1,  // 加回1
            day: date.getDate(),
            weekDay: date.getDay(),  // 0-6, 0=周日
            hour: date.getHours(),
            minute: date.getMinutes()
        };
    }

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
                    if (alarmDateTime > lastCheck && alarmDateTime <= currentTime) {
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
    
    return V.Phone.AlarmTriggered;
};
PhoneMod.checkAlarmsInSleep = function() {
    const shouldTrigger = PhoneMod.checkAlarms(60)
    if (shouldTrigger) {
        let now = PhoneMod.getAbsTime();
        let alarm = V.Phone.AlarmCurrent;
        let nowDate = new Date(now.year, now.month - 1, now.day, now.hour, now.minute);
        let alarmDate = new Date(alarm.year, alarm.month - 1, alarm.day, alarm.hour, alarm.minute);
        let diffMinutes = Math.round((alarmDate - nowDate) / (1000 * 60));
        console.log(diffMinutes);
        
        new Wikifier(null, `<<pass ${diffMinutes}>>`)
    }
    return shouldTrigger
};
PhoneMod.checkAlarmsInSleepText = function() {
    if (!V.Phone.Alarms) {
        return ""
    }
    
    // 获取当前时间
    let now = PhoneMod.getAbsTime();
    let nowDate = new Date(now.year, now.month - 1, now.day, now.hour, now.minute);

    // 初始化变量
    let nearestAlarm = null;
    let minDiffMinutes = Infinity;

    // 遍历所有闹钟
    for (let i = 0; i < V.Phone.Alarms.length; i++) {
        let alarm = V.Phone.Alarms[i];
        if (!alarm.active) continue; // 只检查激活的闹钟
        
        let alarmDate = null;
        
        if (alarm.type === "once") {
            // 一次性闹钟
            alarmDate = new Date(alarm.year, alarm.month - 1, alarm.day, alarm.hour, alarm.minute);
        } else if (alarm.type === "weekly") {
            // 周期闹钟 - 需要计算下一个符合条件的日期
            // 获取本周的每一天
            for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
                let checkDate = new Date(nowDate);
                checkDate.setDate(nowDate.getDate() + dayOffset);
                let weekday = checkDate.getDay(); // 0-6, 0=周日
                
                // 转换 weekday 到你的系统格式（可能需要调整）
                // 假设你的 weekDays 中 0=周日,1=周一,...6=周六
                if (alarm.weekDays.includes(weekday)) {
                    let potentialAlarm = new Date(
                        checkDate.getFullYear(),
                        checkDate.getMonth(),
                        checkDate.getDate(),
                        alarm.hour,
                        alarm.minute
                    );
                    
                    // 只考虑未来的闹钟
                    if (potentialAlarm > nowDate) {
                        if (!alarmDate || potentialAlarm < alarmDate) {
                            alarmDate = potentialAlarm;
                        }
                    }
                }
            }
        }
        
        if (alarmDate && alarmDate > nowDate) {
            let diffMinutes = Math.round((alarmDate - nowDate) / (1000 * 60));
            if (diffMinutes < minDiffMinutes) {
                minDiffMinutes = diffMinutes;
                nearestAlarm = alarm;
            }
        }
    }

    // 判断结果
    if (nearestAlarm) {
        let hoursDiff = minDiffMinutes / 60;
        if (hoursDiff <= 8) {
            return `手机闹钟会在 <span class="def">${hoursDiff.toFixed(0)}小时</span> 后响起。<br><br>`;
        }
    }
    return ""
};
PhoneMod.cancelAlarm = function() { // 关闭闹钟
    V.Phone.AlarmTriggered = false;
    delete V.Phone.AlarmCurrent;

    PhoneMod.togglePhone(false);
    PhoneMod.PhoneUIInit();
};
PhoneMod.deleteAlarm = function(index) { // 删除闹钟
    V.Phone.Alarms.splice(index, 1);
    PhoneMod.PhoneUIInit(true, true);
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
    PhoneMod.PhoneUIInit(true, true);
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
        PhoneMod.PhoneUIInit(true, true);
    };
    reader.readAsDataURL(file);
}
PhoneMod.resetWallpaper = function() {
    delete V.Phone.Settings.WallpaperPath
    PhoneMod.PhoneUIInit(true, true);
}
// =================== 备忘录实现 ===================
PhoneMod.initMemo = function() {
    for (let taskId in V.Phone.Memos) {
        const memo = V.Phone.Memos[taskId]
        PhoneMod.addMemoTask(taskId, memo.text, memo.isImportant, memo.isFinished)
    }
    if (V.Phone.MemoEnableSort) memo_enable_sort.classList.add("active");
    PhoneMod.reorderTodoItems();
}
PhoneMod.addNewMemoTask = function() {
    const new_task_text = document.querySelector('#new_task_text');
    if (!new_task_text) return;
    if (new_task_text.classList.contains("active")) {
        new_task_text.classList.remove("active")
        if (new_task_text.value) {
            const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            V.Phone.Memos[taskId] = {text: new_task_text.value, isImportant: false, isFinished: false}
            PhoneMod.addMemoTask(taskId, new_task_text.value)
            new_task_text.value = ""
        }
    } else {
        new_task_text.classList.add("active")
        new_task_text.focus()
    }
    PhoneMod.reorderTodoItems();
}
PhoneMod.addMemoTask = function(taskId, text = "新任务", isImportant = false, isFinished = false) {
    const todoList = document.querySelector('.todo-list');
    if (!todoList) return;
    
    // 创建新的待办项
    const li = document.createElement('li');
    li.className = 'todo-item';
    
    // 使用模板字符串构建HTML
    li.innerHTML = `
        <input type="checkbox" id="${taskId}" onchange="PhoneMod.memoToggleFinished(event)" ${isFinished ? 'checked' : ''}>
        <label for="${taskId}">
            <span class="custom-checkbox">
                <svg class="checkmark-svg" viewBox="0 0 24 24">
                    <polyline points="5 12.5 10 17.5 19 6.5" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </span>
            <span class="todo-text">${text}</span>
            <span class="priority-dot ${isImportant ? '' : 'disabled'}" onclick="PhoneMod.memoTogglePriority(event)"></span>
        </label>
    `;
    
    $(todoList).prepend(li);
    
    return li;
};
PhoneMod.memoToggleFinished = function(event) {
    const checkbox = event.currentTarget;
    const taskId = checkbox.id;
    V.Phone.Memos[taskId].isFinished = checkbox.checked;
    PhoneMod.reorderTodoItems();
}
PhoneMod.memoTogglePriority = function(event) {
    event.stopPropagation();
    event.preventDefault();
    
    const dot = event.currentTarget;
    const todoItem = dot.closest('.todo-item'); // 获取父级待办项
    const checkbox = todoItem.querySelector('input[type="checkbox"]');
    const taskId = checkbox.id
    
    dot.style.transform = 'scale(0.9)';
    setTimeout(() => {
        dot.style.transform = '';
    }, 100);

    // 如果 checkbox 已被勾选，执行删除
    if (checkbox && checkbox.checked) {
        if (confirm('确定要删除这个待办项吗？')) {
            delete V.Phone.Memos[taskId]
            todoItem.style.transition = 'all 0.3s ease';
            todoItem.style.opacity = '0';
            todoItem.style.transform = 'translateX(20px)';
            setTimeout(() => {
                todoItem.remove();
            }, 300);
        }
    } else {
        // 否则正常切换重要状态
        dot.classList.toggle('disabled');
        V.Phone.Memos[taskId].isImportant = !dot.classList.contains("disabled")
    };
    PhoneMod.reorderTodoItems();
}
PhoneMod.memoToggleEnableSort = function() {
    const memo_enable_sort = document.getElementById('memo_enable_sort');
    if (!memo_enable_sort) return;

    if (V.Phone.MemoEnableSort) {
        V.Phone.MemoEnableSort = false
        memo_enable_sort.classList.remove("active")
    } else {
        V.Phone.MemoEnableSort = true
        memo_enable_sort.classList.add("active")
        PhoneMod.reorderTodoItems()
    }
}
PhoneMod.reorderTodoItems = function() {
    if (!V.Phone.MemoEnableSort) return;
    const todoList = document.querySelector('.todo-list');
    if (!todoList) return;
    
    const items = Array.from(todoList.children);
    
    // FLIP - 记录当前位置
    const positions = new Map();
    items.forEach(item => {
        const rect = item.getBoundingClientRect();
        positions.set(item, {
            top: rect.top,
            left: rect.left
        });
    });
    
    // 排序逻辑（不重建 DOM）
    const sortedItems = [...items].sort((a, b) => {
        const aDot = a.querySelector('.priority-dot');
        const bDot = b.querySelector('.priority-dot');
        const aChecked = a.querySelector('input[type="checkbox"]')?.checked || false;
        const bChecked = b.querySelector('input[type="checkbox"]')?.checked || false;
        
        const aImportant = aDot && !aDot.classList.contains('disabled');
        const bImportant = bDot && !bDot.classList.contains('disabled');
        
        const getWeight = (important, checked) => {
            if (important && !checked) return 3;
            if (important && checked) return 2;
            if (!important && !checked) return 1;
            return 0;
        };
        
        return getWeight(bImportant, bChecked) - getWeight(aImportant, aChecked);
    });
    
    // 检查顺序是否已正确
    let needsReorder = false;
    for (let i = 0; i < items.length; i++) {
        if (items[i] !== sortedItems[i]) {
            needsReorder = true;
            break;
        }
    }
    
    if (!needsReorder) return;
    
    // 使用 DOM 移动而不是重建
    sortedItems.forEach(item => {
        todoList.appendChild(item); // 如果元素已在列表中，appendChild 会移动它
    });
    
    // 动画：从旧位置平滑移动到新位置
    items.forEach(item => {
        const oldPos = positions.get(item);
        const newPos = item.getBoundingClientRect();
        
        const diff = {
            top: oldPos.top - newPos.top,
            left: oldPos.left - newPos.left
        };
        
        if (Math.abs(diff.top) > 1 || Math.abs(diff.left) > 1) {
            // 临时禁用过渡
            item.style.transition = 'none';
            item.style.transform = `translate(${diff.left}px, ${diff.top}px)`;
            
            // 强制重绘
            item.offsetHeight;
            
            // 播放动画
            item.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.1)';
            item.style.transform = '';
            
            const onTransitionEnd = () => {
                item.style.transition = '';
                item.removeEventListener('transitionend', onTransitionEnd);
            };
            item.addEventListener('transitionend', onTransitionEnd, { once: true });
        }
    });
};
// ==================== 电话实现 ====================
PhoneMod.isContactKnown = function(name) {
    return V.Phone.KnownContacts.includes(name);
};
PhoneMod.addContact = function(name) {
    if (!V.Phone.KnownContacts.includes(name)) {
        V.Phone.KnownContacts.push(name);
    }
};
PhoneMod.getContact = function(name) {
    if (!PhoneMod.isContactKnown(name)) return null;
    return PhoneMod.Contacts.find(c => c.name === name);
};
// ==================== 相机实现 ====================
PhoneMod.photoCheck = function() {
    if (PhoneMod.getUsingPhone()) {
        setTimeout(() => {
            delete V.Phone.TakingPhotoWill;
            for (let photo_path in PhoneMod.PhonePhotos) {
                if (V.Phone.Album.hasOwnProperty(photo_path)) continue;
                const photo = PhoneMod.PhonePhotos[photo_path];
                const result = Object.entries(photo.conditions).every(([key, expectedValue]) => {
                    if (key === "$") {
                        return expectedValue()
                    } else {
                        let obj = V
                        let not = false
                        if (key.endsWith("非")) {
                            not = true
                            key = key.slice(0, -1)
                        }
                        if (key.startsWith("$")) {
                            obj = V.Phone
                            key = key.slice(1)
                        } else if (key.startsWith("_")) {
                            obj = T
                            key = key.slice(1)
                        }
                        const actualValue = key.split('$').reduce((obj, prop) => obj?.[prop], obj);
                        // console.log(key, actualValue, expectedValue);
                        
                        if (not) {
                            return actualValue !== expectedValue
                        } else {
                            return actualValue === expectedValue
                        }
                    }
                });
                
                if (Object.keys(photo.conditions).length > 0 && result) {
                    PhoneMod.Guide.startTutorial("photo");
                    V.Phone.TakingPhotoWill = photo_path;
                    break
                }
            }

            PhoneMod.checkPhoneDisabled();
        }, 200)
    }
}
PhoneMod.photoTakeDebug = function(id) {
    let ids = []
    if (id) {
        ids.push(id)
    } else {
        ids = Object.keys(PhoneMod.PhonePhotos)
    }
    ids.forEach(id_ => {
        V.Phone.TakingPhotoWill = id_;
        PhoneMod.photoDesc();
        V.Phone.PhotoCurrent.facevariant = V.facevariant;
        V.Phone.Album[V.Phone.PhotoCurrentPath] = V.Phone.PhotoCurrent;
    })
}
PhoneMod.photoTake = function() {
    if (!V.Phone.TakingPhotoWill) return;
    if (V.player.gender === "m") {
        PhoneMod.msgSend("抱歉，目前还没有为男性主角设置额外的拍摄照片。")
    }
    PhoneMod.setPhoneBeating(false);
    PhoneMod.photoDesc();
    PhoneMod.toggleApp("photo");
}
PhoneMod.photoDesc = function() {
    const photo_path = V.Phone.TakingPhotoWill
    const photo_attr = PhoneMod.PhonePhotos[photo_path];
    delete V.Phone.TakingPhotoWill;

    let allure = 0
    const arousal_k = V.arousal / V.arousalmax  // 性奋
    const allure_k = V.allure / 8000  // 诱惑
    allure = arousal_k * 0.3 + allure_k * 0.7
    allure = Math.round(allure * 1000)

    let quality = 0
    const photography_k = V.Phone.photography / 1000
    quality = photography_k * 0.8 + Math.random() * 0.2
    quality *= PhoneMod.getPhoneInfo().photography
    quality  = Math.round(quality * 1000)

    let worn_text = ""
    const sidebar_look_description = document.getElementById("sidebar-look-description")
    if (sidebar_look_description) {
        worn_text = sidebar_look_description.innerHTML
    }

    let photo = {
        img: `img/photo/${photo_path}.png`,
        msg: photo_attr.msg,
        isUsed: false,
        onceUsed: false,
        allure: allure,  // 诱惑度
        quality: quality,   // 照片质量
        worn: V.worn,  // 保存当前穿戴，可以随机：“你的xxx很适合你”。如果是naked，那么可以说：“xxx真漂亮！”
        worn_text: worn_text,  // 获取衣物显示描述
        facevariant: V.facevariant,  // 保存当前表情，根据当前姿态有不同评论，例如高冷时“姐姐踩我！”
        havingOrgasm: V.Phone.havingOrgasm,  // 是否正在高潮
    };
    V.Phone.PhotoCurrentPath = photo_path;
    V.Phone.PhotoCurrent = photo;
};
PhoneMod.photoSubmit = function() {
    V.Phone.PhotoCurrent.facevariant = V.facevariant;
    V.Phone.Album[V.Phone.PhotoCurrentPath] = V.Phone.PhotoCurrent;
    PhoneMod.togglePhone();
    V.Phone.photography = Math.min(V.Phone.photography + 20, 1000)
    PhoneMod.msgSend("你稍微掌握了一点摄影的技巧")
}
PhoneMod.photoFinish = function() {
    delete V.Phone.PhotoCurrentPath;
    delete V.Phone.PhotoCurrent;
    delete V.Phone.TakingPhotoWill;
}
// =================== 相册实现 ====================
PhoneMod.photoDelete = function(photo_id) {
    if (confirm('确定要删除这个照片吗？（你可以重新完成此任务以获得更好质量的照片）')) {
        delete V.Phone.Album[photo_id]
        PhoneMod.PhoneUIInit(true, true);
    }
}
PhoneMod.initAlbum = function() {
    if (!PhoneMod.photoLoaded) {
        document.querySelector("#photononetip").style.display = ""
    }
    for (let taskId in PhoneMod.PhonePhotos) {
        PhoneMod.addAlbumTask(taskId)
    }
    PhoneMod.reorderTodoItems();
}
PhoneMod.photoError = function(element) {
    element.remove();
    const photononetip = document.querySelector("#photononetip");
    photononetip.style.display = "";
    if (PhoneMod.photoLoaded) {
        photononetip.innerHTML = "加载的图包模组可能<span class='gold'>未启用美化</span>或者装载的图包不是对应的版本；此种问题将导致某些甚至全部的摄像图像不可见。"
    } else {
        photononetip.innerHTML = "未装载摄像图包，将不会在游戏内显示任务具体照片。"
    };
}
PhoneMod.addAlbumTask = function(taskId) {
    const todoList = document.querySelector('.todo-list');
    if (!todoList) return;

    const task = PhoneMod.PhonePhotos[taskId]
    const photo = V.Phone.Album[taskId]
    const isFinished = taskId in V.Phone.Album
    if (!photo && task.hide) return
    
    // 创建新的待办项
    const li = document.createElement('li');
    li.className = 'todo-item';
    
    // 使用模板字符串构建HTML
    if (photo) {
        new Wikifier(li, `
            <input type="checkbox" id="${taskId}" ${isFinished ? 'checked' : ''} disabled>
            <label for="${taskId}">
                <span class="album-photo-star">${PhoneMod.getStarRating(task.risk)}</span>
                <span class="custom-checkbox">
                    <svg class="checkmark-svg" viewBox="0 0 24 24">
                        <polyline points="5 12.5 10 17.5 19 6.5" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <span class="todo-text">${task.taskDesc}</span>
            </label>
            <div class="album-photo-title">
                <div id="allurecaption" title="诱惑：${photo.allure}">
                    <div class=""> 诱惑：  
                        <<if ${photo.allure} gte 900>><span class="green">此人只应天上有，人间难得几回闻。</span>
                        <<elseif ${photo.allure} gte 800>><span class="teal">刚看这张照片的第一眼就已窒息。</span>
                        <<elseif ${photo.allure} gte 600>><span class="lblue">闭月羞花，沉鱼落雁。</span>
                        <<elseif ${photo.allure} gte 400>><span class="blue">简直是整条街最刚的芳心纵火犯。</span>
                        <<elseif ${photo.allure} gte 200>><span class="purple">你看起来非常诱惑。</span>
                        <<elseif ${photo.allure} gte 100>><span class="pink">看起来还不错。</span>
                        <<else>><span class="red">你就像一根没炸熟的油条。</span>
                        <</if>>
                    </div>
                    <div class="meter" style="z-index: 0;">
                        <<if ${photo.allure} gte 900>>
                            <<set _statColor to "greenbar">>
                        <<elseif ${photo.allure} gte 800>>
                            <<set _statColor to "tealbar">>
                        <<elseif ${photo.allure} gte 600>>
                            <<set _statColor to "lbluebar">>
                        <<elseif ${photo.allure} gte 400>>
                            <<set _statColor to "bluebar">>
                        <<elseif ${photo.allure} gte 200>>
                            <<set _statColor to "purplebar">>
                        <<elseif ${photo.allure} gte 100>>
                            <<set _statColor to "pinkbar">>
                        <<else>>
                            <<set _statColor to "redbar">>
                        <</if>>

                        <div @class="_statColor" style="width:${Math.round(photo.allure / 10)}%"></div>
                    </div>
                </div>
                <div id="allurecaption" title="质量：${photo.quality}">
                    <div class=""> 质量：  
                        <<if ${photo.quality} gte 900>><span class="green">简直是完美的艺术品。</span>
                        <<elseif ${photo.quality} gte 800>><span class="teal">每一个细节都呈现得非常真实。</span>
                        <<elseif ${photo.quality} gte 600>><span class="lblue">构图出色，栩栩如生。</span>
                        <<elseif ${photo.quality} gte 400>><span class="blue">自然地捕捉了美丽的瞬间。</span>
                        <<elseif ${photo.quality} gte 200>><span class="purple">这张照片看起来还行。</span>
                        <<elseif ${photo.quality} gte 100>><span class="pink">比较模糊，但依稀能见人影。</span>
                        <<else>><span class="red">还以为是五十年前的包浆老照片。</span>
                        <</if>>
                    </div>
                    <div class="meter" style="z-index: 0;">
                        <<if ${photo.quality} gte 900>>
                            <<set _statColor to "greenbar">>
                        <<elseif ${photo.quality} gte 800>>
                            <<set _statColor to "tealbar">>
                        <<elseif ${photo.quality} gte 600>>
                            <<set _statColor to "lbluebar">>
                        <<elseif ${photo.quality} gte 400>>
                            <<set _statColor to "bluebar">>
                        <<elseif ${photo.quality} gte 200>>
                            <<set _statColor to "purplebar">>
                        <<elseif ${photo.quality} gte 100>>
                            <<set _statColor to "pinkbar">>
                        <<else>>
                            <<set _statColor to "redbar">>
                        <</if>>

                        <div @class="_statColor" style="width:${Math.round(photo.quality / 10)}%"></div>
                    </div>
                </div>
                ${task.fames && task.fames.length > 0? `<div class="black">相关名声：${PhoneMod.getFamesFriendlyNames(task.fames)}</div>`: ''}
            </div>
            <div class="album-photo-content">
                <div class="album-photo-passage">
                    <span>${photo.msg}</span>
                    <br>
                    <p style="font-size:12px; color:#666;">
                        <<if ${photo.worn_text !== undefined}>>${photo.worn_text}<</if>>
                        你摆出${PhoneMod.getFaceVariant(photo.facevariant)}的表情
                        <<if ${photo.havingOrgasm}>>
                            ，<span class="pink">正在高潮！</span>
                        <<else>>
                            。
                        <</if>><br>
                    </p>
                    <<if ${photo.isUsed}>>
                        <p style="font-size:12px; color:#666;">已使用，请前往使用处删除</p>
                    <<else>>
                        <<link 删除>><<run PhoneMod.photoDelete('${taskId}')>><</link>>
                        <span style="margin-right: 30px"></span>
                        <<if ${photo.onceUsed}>>
                            <<link 再次发布>><<run PhoneMod.yenotePost('${taskId}')>><</link>>
                        <<else>>
                            <<link 发布>><<run PhoneMod.yenotePost('${taskId}')>><</link>>
                        <</if>>
                    <</if>>
                </div>
                <img class="album-photo-image" src='${(isFinished)? `img/photo/${taskId}.png`: "img/ui/phone/app/photo.png"}' onerror="javascript:PhoneMod.photoError(this)">
            </div>
        `);
    } else {
        new Wikifier(li, `
            <input type="checkbox" id="${taskId}" ${isFinished ? 'checked' : ''} disabled>
            <label for="${taskId}">
                <span class="album-photo-star">${PhoneMod.getStarRating(task.risk)}</span>
                <span class="custom-checkbox">
                    <svg class="checkmark-svg" viewBox="0 0 24 24">
                        <polyline points="5 12.5 10 17.5 19 6.5" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <span class="todo-text">${task.taskDesc}</span>
            </label>
            <div class="album-photo-title">
                ${task.fames && task.fames.length > 0? `<div>相关名声：${PhoneMod.getFamesFriendlyNames(task.fames)}</div>`: ''}
            </div>
            <div class="album-photo-content">
                <div style="font-size:12px; color:#666; flex-grow: 1">完成任务后可以拍摄照片并发布</div>
                <img class="album-photo-image" src="img/ui/phone/app/photo.png">
            </div>
        `);
    }
    
    todoList.appendChild(li)
    
    return li;
};
PhoneMod.getFamesFriendlyNames = function(fames) {
    let friendlyName = []
    fames.forEach(fame => {
        friendlyName.push(PhoneMod.Fames[fame])
    })
    return friendlyName.join("，")
}
PhoneMod.albumToggleFinished = function(event) {
    const checkbox = event.currentTarget;
    const taskId = checkbox.id;
    V.Phone.Memos[taskId].isFinished = checkbox.checked;
    PhoneMod.reorderTodoItems();
}
// =================== 小黄书实现 ===================
PhoneMod.YenoteLockedObserver = new IntersectionObserver((entries) => {PhoneMod.yenoteLockedObserver(entries)}, {
    threshold: 0.5,
});
PhoneMod.initYenote = function() {
    document.querySelectorAll('.note-image.locked').forEach(article => {
        PhoneMod.YenoteLockedObserver.observe(article);
    });
}
PhoneMod.yenoteLockedObserver = function(entries) {
    entries.forEach(entry => {
        const article = entry.target;
        if (entry.isIntersecting) {
            setTimeout(() => {
                article.classList.remove("locked")
            }, 500)
        } else {
            article.classList.add("locked")
        }
    });
}
PhoneMod.toggleYenote = function(open) {
    if (open) {
        V.Phone.Yenotes.forEach(yenote => {
            yenote.comments.forEach(comment => {
                if (!comment.already_read) {
                    comment.already_read = true
                    console.log(0, comment, comment.effect);
                    new Wikifier(document.getElementById(yenote.id+"*"+yenote.comments.indexOf(comment)), `<<print \`${comment.effect}\`>>`)
                }
            })
        })
    }
}
PhoneMod.yenotesCheck = function() {
    V.Phone.Yenotes.forEach(yenote => {
        const heat = PhoneMod.yenoteGetHeat(yenote)
        
        const viewInc = Math.floor(heat * (5 + 10 * Math.random()));       // 5~15 * heat
        let likeInc = 0;
        let commentInc = 0;
        
        for (let index = 0; index < viewInc; index++) {
            if (Math.random()*100 <= PhoneMod.点赞概率百分之) {
                likeInc += 1
            }
            if (Math.random()*100 <= PhoneMod.评论概率百分之) {
                commentInc += 1
            }
        }

        // console.log(`heat=${heat}, viewInc=${viewInc}, likeInc=${likeInc}, commentInc=${commentInc}`);

        yenote.fames.forEach(_fame => {  // 计算名声
            V.fame[_fame] = parseFloat((V.fame[_fame] + viewInc * 0.01 + likeInc * 0.05 + commentInc * 0.1).toFixed(2))
        })
        
        const oldHundredsview = Math.floor(yenote.view / 100);
        yenote.view += viewInc;
        const newHundredsview = Math.floor(yenote.view / 100);
        
        if (newHundredsview > oldHundredsview) {
            setTimeout(() => {
                PhoneMod.msgSend(`你的文章达到了<span class="gold">${yenote.view}</span>阅读量`, "yenote", () => {
                    if (PhoneMod.shouldUsePhone()){
                        PhoneMod.toggleApp('yenote')
                    }
                })
            })
        }

        if (yenote.price) {
            const earned = yenote.price * viewInc
            yenote.earned += earned
            new Wikifier(null, `<<money ${earned*100}>>`)
        }

        const oldHundredslike = Math.floor(yenote.like / 100);
        yenote.like += likeInc;
        const newHundredslike = Math.floor(yenote.like / 100);
        if (newHundredslike > oldHundredslike) {
            setTimeout(() => {
                PhoneMod.msgSend(`你的文章达到了<span class="gold">${yenote.like}</span>点赞量`, "yenote", () => {
                    if (PhoneMod.shouldUsePhone()){
                        PhoneMod.toggleApp('yenote')
                    }
                })
            })
        }
        if (!yenote.price) {  // 判定在每一位喜欢，百分之10的概率获得打赏
            for (let index = 0; index < likeInc; index++) {
                if (Math.random()*100 <= PhoneMod.打赏概率百分之) {
                    const earned = Math.max(Math.round((yenote.attract * 100) * Math.random()), 1)
                    yenote.earned += earned
                    new Wikifier(null, `<<money ${earned*100}>>`)
                    setTimeout(() => {
                        PhoneMod.msgSend(`你的文章收到了一笔<span class="gold">£${earned}</span>的打赏`, "yenote", () => {
                            if (PhoneMod.shouldUsePhone()){
                                PhoneMod.toggleApp('yenote')
                            }
                        })
                    }, 10);
                }
            }
        }

        if (commentInc > 0) {
            setTimeout(() => {
                PhoneMod.msgSend(`你的文章收到了${commentInc}条新的评论`, "yenote", () => {
                    if (PhoneMod.shouldUsePhone()){
                        PhoneMod.toggleApp('yenote')
                    }
                })
            }, 10);
            for (let i = 0; i < commentInc; i++) {
                yenote.comments.push(PhoneMod.yenoteGenerateRandomComment(yenote));
            }
        }
    })
}
PhoneMod.yenoteGetHeat = function (yenote) {
    const ageHours = (Time.date.timeStamp - yenote.date.timeStamp) / 3600; // 小时差
    const decayFactor = Math.exp(-PhoneMod.热度衰减系数 * ageHours);        // 衰减系数可调
    const baseHeat = yenote.attract * decayFactor;

    let fame = 0
    yenote.fames.forEach(_fame => {
        fame += V.fame[_fame] / 2000
    })
    let heat = baseHeat * Math.pow(3, fame);
    
    if (yenote.price && yenote.attract) {
        const priceRatio = Math.min(yenote.price / (yenote.attract * 100), 1); // 限制最大为1
        const priceFactor = 0.15 + 0.85 * Math.exp(-7 * priceRatio);
        heat *= priceFactor;
    }

    if (yenote.onceUsed) {
        heat *= 0.5
    }

    heat = Math.max(Math.min(heat, 1), 0);

    return heat
}
PhoneMod.yenoteRename = function() {
    if (confirm('确定要重命名？（这不会影响你之前发送过的文章）')) {
        delete V.Phone.yenoteUsername
        PhoneMod.PhoneUIInit(true, true);
    }
}
PhoneMod.generateNickname = function(style = 'random') {
    const generator = PhoneMod.NicknameGenerator;
    const baseNames = V.NPC_names_m.concat(V.NPC_names_f)
    const randomName = baseNames[Math.floor(Math.random() * baseNames.length)];
    
    switch(style) {
        case 'simple':      // 简单风格：直接随机名字
            return randomName;
            
        case 'prefix':      // 前缀风格：前缀+名字
            const prefix = generator.prefixes[Math.floor(Math.random() * generator.prefixes.length)];
            return prefix + randomName;
            
        case 'suffix':      // 后缀风格：名字+后缀
            const suffix = generator.suffixes[Math.floor(Math.random() * generator.suffixes.length)];
            return randomName + suffix;
            
        case 'full':         // 完整风格：前缀+名字+后缀
            const pre = generator.prefixes[Math.floor(Math.random() * generator.prefixes.length)];
            const suf = generator.suffixes[Math.floor(Math.random() * generator.suffixes.length)];
            return pre + randomName + suf;
            
        case 'symbol':       // 符号风格：名字+随机符号
            const symbol = generator.symbols[Math.floor(Math.random() * generator.symbols.length)];
            return randomName + ' ' + symbol;
            
        case 'number':       // 数字风格：名字+数字
            const num = generator.numbers[Math.floor(Math.random() * generator.numbers.length)];
            return randomName + num;
            
        case 'fancy':        // 花哨风格：符号+前缀+名字+后缀+数字
            const sym1 = generator.symbols[Math.floor(Math.random() * generator.symbols.length)];
            const sym2 = generator.symbols[Math.floor(Math.random() * generator.symbols.length)];
            const preF = generator.prefixes[Math.floor(Math.random() * generator.prefixes.length)];
            const sufF = generator.suffixes[Math.floor(Math.random() * generator.suffixes.length)];
            const numF = generator.numbers[Math.floor(Math.random() * generator.numbers.length)];
            return sym1 + preF + randomName + sufF + numF + sym2;
            
        default:            // 随机风格：随机选择以上任一风格
            const styles = ['simple', 'prefix', 'suffix', 'full', 'symbol', 'number', 'fancy'];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            return PhoneMod.generateNickname(randomStyle);
    }
};
PhoneMod.yenoteSetNewName = function() {
    const new_yenote_username = document.querySelector('#new_yenote_username');
    if (!new_yenote_username) return;
    if (new_yenote_username.value) {
        V.Phone.yenoteUsername = new_yenote_username.value
        PhoneMod.PhoneUIInit(true, true);
    } else {
        PhoneMod.msgSend("<span class='red'>色即是空的道理我也懂，但是名字还是不能为空。</span>")
    }
}
PhoneMod.yenotePost = function(photo_id) {
    const photo = V.Phone.Album[photo_id]
    const photo_base = PhoneMod.PhonePhotos[photo_id]
    if (photo.isUsed) return
    const attract = (photo_base.risk / 100) * 0.2 + (photo.allure / 1000) * 0.5 + (photo.quality / 1000) * 0.3
    V.Phone.yenotePosting = {
        id: photo_id,
        msg: photo.msg,
        img: photo.img,
        onceUsed: photo.onceUsed,
        attract: attract,
        price: 0,
        earned: 0,
        fames: photo_base.fames,
        date: Time.date
    }
    PhoneMod.toggleApp("yenote")
}
PhoneMod.yenoteChangePrice = function() {
    const range = document.getElementById('price_input');
    const price_text = document.getElementById('price_text');
    const price = parseInt(range.value)
    price_text.innerText = price === 0 ? "免费": `£${range.value}`
    V.Phone.yenotePosting.price = price
    
    const yenote_heat = document.getElementById('yenote_heat');
    yenote_heat.innerHTML = ""
    new Wikifier(yenote_heat, `
        <<set _percent to PhoneMod.yenoteGetHeat(_note) * 100>>
        <div>
            预计顶峰流量：<<print Math.round(_percent)>>%
        </div>
        <div class="meter">
            <<if _percent gte 90>>
                <<set _statColor to "greenbar">>
            <<elseif _percent gte 80>>
                <<set _statColor to "tealbar">>
            <<elseif _percent gte 60>>
                <<set _statColor to "lbluebar">>
            <<elseif _percent gte 40>>
                <<set _statColor to "bluebar">>
            <<elseif _percent gte 20>>
                <<set _statColor to "purplebar">>
            <<elseif _percent gte 10>>
                <<set _statColor to "pinkbar">>
            <<else>>
                <<set _statColor to "redbar">>
            <</if>>
            <div @class="_statColor" @style="'width:' + _percent + '%'"></div>
        </div>
        <<if _note.onceUsed>>
            <div class="red">因为再次发布，这篇文章的热度将会大幅下降</div>
        <</if>>
        <<if _note.price>>
            <div class="red">内容付费会使得热度呈指数下降</div>
        <</if>>`
    )
}
PhoneMod.yenotePostSubmit = function() {
    const photo = V.Phone.Album[V.Phone.yenotePosting.id]
    photo.isUsed = true
    V.Phone.Yenotes.unshift({
        ...V.Phone.yenotePosting,
        name: V.Phone.yenoteUsername,
        npc: false,
        view: 0,
        like: 0,
        comments: []
    })
    delete V.Phone.yenotePosting
    PhoneMod.PhoneUIInit(true, true)
}
PhoneMod.yenotePostCancel = function() {
    delete V.Phone.yenotePosting
    PhoneMod.PhoneUIInit(true, true)
}
PhoneMod.yenoteDelete = function(photo_id) {
    if (confirm('确定要删除这篇文章吗？\n（你可以再次发布这张照片，但是热度会大幅减少；你也可以从相册删除这张照片，从而去拍摄质量更好的照片，且不会导致热度下降）')) {
        const photo = V.Phone.Album[photo_id]
        photo.isUsed = false
        photo.onceUsed = true
        V.Phone.Yenotes = V.Phone.Yenotes.filter(yenote => yenote.id !== photo_id)
        PhoneMod.PhoneUIInit(true, true)
    }
}
PhoneMod.yenoteGenerateRandomComment = function(photo) {
    const photo_id = photo.id;
    const photoData = PhoneMod.PhonePhotos[photo_id];
    const photoThis = {...photo, ...V.Phone.Album[photo_id]};
    const commentPool = Object.assign({}, photoData.uncommon ? {} : PhoneMod.Comments);

    // 检测评论链
    const putChain = function(comment, value, commentPool_) {
        if (comment === "→") {
            const condition = value[0](photoThis);
            const comments = condition? value[1]: (value[2] ?? {});
            for (let index = 0; index < comments.length; index++) {
                const comment = comments[index];
                putChain(comment[0], comment[1], commentPool_)
            }
        } else {
            commentPool_.push([comment, value])
        }
    };
    const last_comment = photo.comments.at(-1)
    if (photoData.comments.hasOwnProperty("↓")) {
        for (let index = 0; index < photoData.comments["↓"].length; index++) {
            const commentChain = []
            const commentChainRaw = photoData.comments["↓"][index];
            for (let index = 0; index < commentChainRaw.length; index++) {
                const [comment, value] = commentChainRaw[index];
                putChain(comment, value, commentChain);
            }
            if (commentChain.length > 0) {
                if (PhoneMod.debug) console.log("跟评链", commentChain);
                if (last_comment) {
                    for (let index = 0; index < commentChain.length; index++) {
                        const commentR = commentChain[index];
                        if (last_comment.text === commentR[0] && index < commentChain.length - 1) {
                            const comment = commentChain[index + 1];
                            return {
                                name: PhoneMod.generateNickname(),
                                text: comment[0],
                                effect: comment[1],
                                already_read: false
                            };
                        }
                    }
                }
                commentPool[commentChain[0][0]] = commentChain[0][1]
            }
        }
    };
    
    // 遍历照片评论
    const putComments = function(comment, value, commentPool_) {
        if (comment === "→") {
            const condition = value[0](photoThis);
            const comments = condition ? value[1]: (value[2] ?? {});
            for (const comment in comments) {
                putComments(comment, comments[comment], commentPool_)
            }
        } else if (comment === "↓") {
            return;
        } else {
            commentPool_[comment] = value
        }
    }
    for (const comment in photoData.comments) {
        putComments(comment, photoData.comments[comment], commentPool)
    }
    
    if (PhoneMod.debug) console.log("评论池", commentPool);
    const randomKey = Object.keys(commentPool)[Math.floor(Math.random() * Object.keys(commentPool).length)];
    return {
        name: PhoneMod.generateNickname(),
        text: randomKey,
        effect: commentPool[randomKey],
        already_read: false
    };
};
PhoneMod.yenoteDebugComment = function(index) {
    const yenote = V.Phone.Yenotes[index];
    const comment = PhoneMod.yenoteGenerateRandomComment(yenote);
    yenote.comments.push(comment)
    return comment
};

// =================== 地图实现 ===================
PhoneMod.initMap = function() {
    (function() {
        const locations = [
            { name: "森林商店" },
            { name: "" },
            { name: "老教堂墓地、墓穴" },
            { name: "" },
            { name: "" },
            { name: "湖畔、湖中遗址", hasLakeRuins: true },
            { name: "湖畔、湖中遗址", hasLakeRuins: true },
            { name: "瀑布" },
            { name: "瀑布" },
            { name: "钓鱼岩" },
            { name: "营地" },
            { name: "狼穴、伊甸的小屋", hasEden: true },
            { name: "狼穴、伊甸的小屋", hasEden: true },
            { name: "狼穴、伊甸的小屋", hasEden: true },
            { name: "狼穴、伊甸的小屋", hasEden: true },
            { name: "狼穴、伊甸的小屋", hasEden: true },
            { name: "狼穴、伊甸的小屋", hasEden: true },
            { name: "狼穴、伊甸的小屋", hasEden: true },
            { name: "狼穴、伊甸的小屋", hasEden: true },
            { name: "狼穴、伊甸的小屋", hasEden: true },
            { name: "" }
        ];

        // ----- 2. 护理等级表 (tending 0-1000) -----
        const tendingLevels = [
            { requiredValue: 0, level: "None", color: 'red' },
            { requiredValue: 1, level: "F", color: 'pink' },
            { requiredValue: 100, level: "F+", color: 'pink' },
            { requiredValue: 200, level: "D", color: 'purple' },
            { requiredValue: 300, level: "D+", color: 'purple' },
            { requiredValue: 400, level: "C", color: 'blue' },
            { requiredValue: 500, level: "C+", color: 'blue' },
            { requiredValue: 600, level: "B", color: 'lblue' },
            { requiredValue: 700, level: "B+", color: 'lblue' },
            { requiredValue: 800, level: "A", color: 'teal' },
            { requiredValue: 900, level: "A+", color: 'teal' },
            { requiredValue: 1000, level: "S", color: 'green' }
        ];

        // 科学等级: 根据V.science/200 取整映射 0->D,1->C,2->B,3->A,4->A*
        function getScienceLevel(science) {
            let idx = Math.floor(science / 200);
            if (idx < 0) idx = 0;
            if (idx > 4) idx = 4;   // 最大A*对应4
            const map = [
                { level: 'D', color: 'purple' },   // 0
                { level: 'C', color: 'blue' },      // 1
                { level: 'B', color: 'lblue' },      // 2
                { level: 'A', color: 'teal' },       // 3
                { level: 'A*', color: 'green' }      // 4
            ];
            return map[idx];
        }

        // 护理等级查找
        function getTendingLevel(tending) {
            let best = tendingLevels[0];
            for (let i = tendingLevels.length - 1; i >= 0; i--) {
                if (tending >= tendingLevels[i].requiredValue) {
                    return tendingLevels[i];
                }
            }
            return best;
        }

        // ----- 古董生成 -----
        function getAntiques(index, loc) {
            let base = [];
            if (index >= 0 && index <= 4) base = ["苔藓遍布的森林箭头£20"];
            else if (index >= 5 && index <= 10) base = ["锈迹斑斑的森林匕首£40"];
            else if (index >= 11 && index <= 19) base = ["流光溢彩的森林宝石£100"];

            // 特殊湖中遗址特殊古董
            if (loc.hasLakeRuins) {
                base.push("磨损的银戒指£30", "精美的金项链£500", "金质贞操带£2000", "无暇的象牙项链£2000");
            }
            return [...new Set(base)];
        }

        // ----- 种子生成 + 收获/收集条件 -----
        function getSeeds(index, loc, tendingLevelObj, scienceLevelObj) {
            let seeds = [];
            // 基础范围
            if (index >= 0 && index <= 4) seeds.push({ name: "百合", harvest: "F+", collect: "C" });
            if (index >= 6 && index <= 11) seeds.push({ name: "红玫瑰", harvest: "D+", collect: "B" });
            if (index >= 11 && index <= 19) seeds.push({ name: "兰花", harvest: "D+", collect: "A" });

            // 附加上当前护理/科学是否满足 (用于显示颜色)
            return seeds.map(s => {
                const harvestReq = s.harvest;
                const collectReq = s.collect;
                // 解析护理需求: 比较等级字符串, 简易比较按顺序 None<F<F+<D<D+<C<C+<B<B+<A<A+<S
                const levelOrder = ["None","F","F+","D","D+","C","C+","B","B+","A","A+","S"];
                const harvestMet = levelOrder.indexOf(tendingLevelObj.level) >= levelOrder.indexOf(harvestReq);
                // 科学等级直接比较字母顺序 (D < C < B < A < A*)
                const scienceOrder = ["D","C","B","A","A*"];
                const collectMet = scienceOrder.indexOf(scienceLevelObj.level) >= scienceOrder.indexOf(collectReq);
                return {
                    name: s.name,
                    harvestReq,
                    collectReq,
                    harvestMet,
                    collectMet
                };
            });
        }

        // ----- 5. 野生动植物 (血月影响柠檬) -----
        function getWildlife(index, isBloodMoon, loc) {
            let items = [];
            if (index >= 0 && index <= 4) items = ["苹果", "普通蘑菇"];
            else if (index >= 6 && index <= 10) items = ["梨", "普通蘑菇"];
            else if (index >= 11 && index <= 19) {
                items = ["柠檬", "狼菇", "野蜂巢"];
                if (isBloodMoon) {
                    items = items.map(i => i === "柠檬" ? "血柠檬" : i);
                }
            }
            return [...new Set(items)];
        }

        // ----- 7. 构建标尺 -----
        function buildRuler() {
            const ruler = document.getElementById('rulerContainer');
            ruler.innerHTML = '';
            for (let i = 0; i <= 20; i++) {
                const cell = document.createElement('div');
                cell.className = 'ruler-cell';
                cell.textContent = i;
                ruler.appendChild(cell);
            }
        }

        // ----- 8. 主更新函数 -----
        function updateAll() {
            const forestSlider = document.getElementById('forestSlider');

            const forestVal = V.forest;
            const tendingVal = V.tending;
            const scienceVal = V.science;

            document.getElementById('forestVal').innerText = forestVal;

            // 计算深度索引 (0-20)
            let rawIndex = Math.floor(forestVal / 5);
            if (forestVal === 100) rawIndex = 20;
            const index = Math.min(20, Math.max(0, rawIndex));

            // 更新标尺激活
            const cells = document.querySelectorAll('.ruler-cell');
            cells.forEach((c, i) => {
                if (i === index) c.classList.add('active');
                else c.classList.remove('active');
            });

            // 当前地点对象
            const currentLoc = locations[index];

            // 护理/科学等级对象
            const tendingLvl = getTendingLevel(tendingVal);
            const scienceLvl = getScienceLevel(scienceVal);

            // 获取古董
            const antiques = getAntiques(index, currentLoc);

            // 获取种子（带条件）
            const seeds = getSeeds(index, currentLoc, tendingLvl, scienceLvl);

            // 获取野生动植物
            const wildlife = getWildlife(index, Weather.bloodMoon, currentLoc);

            // 渲染infoPanel
            let html = `
                <div class="location-title">
                    <h3>深度 ${index}</h3>
                </div>
                <div class="res-section">
                    <h3>附近地点</h3>
                    <div class="items-grid">
                        <span class="item">${currentLoc.name}</span>
                    </div>
                </div>
                <div class="res-section">
                    <h3>出现古董</h3>
                    <div class="items-grid">
                        ${antiques.map(a => `<span class="item">${a}</span>`).join('')}
                    </div>
                </div>
                <div class="res-section">
                    <h3>出现种子、野生动植物</h3>
                    <div class="items-grid">
                        ${seeds.map(s => {
                            return `<span class="item requirement">
                                ${s.name} 护理${s.harvestReq} 科学${s.collectReq}</span>
                            </span>`;
                        }).join('')}
                        ${wildlife.map(w => `<span class="item">${w}</span>`).join('')}
                    </div>
                </div>
            `;

            document.getElementById('infoPanel').innerHTML = html;
        }

        // 初始化
        buildRuler();
        updateAll();
    })();
}
// =================== DD实现 ===================
PhoneMod.ddBoardingPoints = {
    // 住宅区
    domus: { passage: 'Domus Street', name: '宅邸街 (家)', icon: 'domusicon', region: 'R' },
    barb: { passage: 'Barb Street', name: '倒钩街 (工作室)', icon: 'barbicon', region: 'R' },
    danube: { passage: 'Danube Street', name: '多瑙河街 (富人区)', icon: 'danubeicon', region: 'R' },
    wolf: { passage: 'Wolf Street', name: '狼街 (神殿)', icon: 'wolficon', region: 'R' },
    
    // 商业区
    high: { passage: 'High Street', name: '商业街 (购物中心)', icon: 'highicon', region: 'C' },
    connudatus: { passage: 'Connudatus Street', name: '康努达塔斯街 (会所)', icon: 'connudatusicon', region: 'C' },
    cliff: { passage: 'Cliff Street', name: '峭壁街 (咖啡馆)', icon: 'clifficon', region: 'C' },
    nightingale: { passage: 'Nightingale Street', name: '南丁格尔街 (医院)', icon: 'nightingaleicon', region: 'C' },
    starfish: { passage: 'Starfish Street', name: '海星街 (海滩)', icon: 'starfishicon', region: 'C' },
    oxford: { passage: 'Oxford Street', name: '牛津街 (学校)', icon: 'oxfordicon', region: 'C' },
    park: { passage: 'Park', name: '公园', icon: 'parkicon', region: 'C' },
    
    // 工业区
    elk: { passage: 'Elk Street', name: '麋鹿街', icon: 'elkicon', region: 'I' },
    mer: { passage: 'Mer Street', name: '梅尔街 (码头)', icon: 'mericon', region: 'I' },
    harvest: { passage: 'Harvest Street', name: '丰收街 (酒吧)', icon: 'harvesticon', region: 'I' },
    
    // 镇外
    barn: { passage: 'Farmland', name: '农场', icon: 'farmicon', region: 'O' },
    
    // 森林
    lakebus: { passage: 'Lake Bus', name: '湖边', icon: 'lakeicon', region: 'F' }
};
PhoneMod.ddRegionNames = {
    R: '住宅区',
    C: '商业区',
    I: '工业区',
    O: '镇外',
    F: '森林'
};
PhoneMod.getAllBoardingPoints = function() {
    const result = {};
    const current = PhoneMod.ddGetTheNearestBoardingPoint().name
    
    Object.entries(PhoneMod.ddBoardingPoints).forEach(([key, data]) => {
        const regionName = PhoneMod.ddRegionNames[data.region];
        if (!result[regionName]) {
            result[regionName] = [];
        }
        result[regionName].push({key: key, name: data.name, icon: data.icon, current: data.name === current});
    });

    return result;
}
PhoneMod.ddSetDestination = function(destination) {
    if (destination) {
        if (PhoneMod.ddBoardingPoints[destination]?.name !== PhoneMod.ddGetTheNearestBoardingPoint().name) {
            V.Phone.dd = destination
        } else {
            PhoneMod.ddCancel("起终点相距很近，建议步行前往")
        }
    } else {
        delete V.Phone.dd
    }
    PhoneMod.PhoneUIInit(true, true)
}
PhoneMod.ddGetDestinationName = function() {
    return PhoneMod.ddBoardingPoints[V.Phone.dd]?.name
}
PhoneMod.ddCalculateDistance = function() {
    const region1 = PhoneMod.ddGetTheNearestBoardingPoint()?.region;
    const region2 = PhoneMod.ddBoardingPoints[V.Phone.dd]?.region;
    
    if (!region1 || !region2) return 0;

    // 区域间距离矩阵（起步价为1，同一区域距离1）
    const dist = {
        R: { R: 1, C: 1, I: 2, O: 5, F: 3 },
        C: { R: 1, C: 1, I: 1, O: 4, F: 3 },
        I: { R: 2, C: 1, I: 1, O: 3, F: 4 },
        O: { R: 5, C: 4, I: 3, O: 1, F: 7 },
        F: { R: 3, C: 3, I: 4, O: 7, F: 1 }
    };

    const distance = dist[region1][region2];
    return distance;
}
PhoneMod.ddCalculateFare = function() {
    return PhoneMod.ddCalculateDistance() * PhoneMod.DD每距离费用;
}
PhoneMod.ddGetTheNearestBoardingPoint = function() {
    const key = Object.keys(PhoneMod.ddBoardingPoints).find(key => PhoneMod.ddBoardingPoints[key].passage === V.safePassage)
    return PhoneMod.ddBoardingPoints[key];
}
PhoneMod.ddSubmit = function() {
    V.Phone.ddstart = {passage: PhoneMod.ddGetTheNearestBoardingPoint()?.passage, time: Time.date}
    PhoneMod.reload()
}
PhoneMod.ddCancel = function(text="订单已取消") {
    if (V.Phone.ddstart) {
        const cost = Math.min(Math.max(Math.floor((PhoneMod.ddGetWaitTime() - PhoneMod.DD免费等待时间) / (PhoneMod.DD最大等待时间 - PhoneMod.DD免费等待时间 ) * PhoneMod.DD等待全额费用), 0), PhoneMod.DD等待全额费用)
        V.Phone.ddcost = cost
    }
    delete V.Phone.dd
    delete V.Phone.ddstart
    V.Phone.ddcanceled = text
    PhoneMod.reload(true)
}
PhoneMod.ddCancelChecked = function() {
    if (V.Phone.ddcost) new Wikifier(null, `<<money -${V.Phone.ddcost*100}>>`);
    delete V.Phone.ddcanceled;
    delete V.Phone.ddcost;
    PhoneMod.reload(true);
}
PhoneMod.ddFinish = function() {
    const pass = PhoneMod.ddCalculateDistance();
    const pass_text = AsAPI.getFriendlyTimeText(pass / 60, false);
    const cost = pass * PhoneMod.DD每距离费用;
    const destination =  PhoneMod.ddBoardingPoints[V.Phone.dd];
    delete V.Phone.dd;
    delete V.Phone.ddstart;
    return {pass: pass, pass_text: pass_text, cost: cost, name: destination?.name, passage: destination?.passage, icon: destination?.icon}
}
PhoneMod.ddIsSubmited = function() {
    return V.Phone.ddstart
}
PhoneMod.ddGetWaitTime = function() {
    const ageMin = (Time.date.timeStamp - V.Phone.ddstart.time.timeStamp) / 3600 * 60; // 小时差
    return ageMin
}
PhoneMod.ddCheck = function() {
    setTimeout(() => {
        if (PhoneMod.ddIsSubmited()) {
            if (PhoneMod.ddGetWaitTime() > PhoneMod.DD最大等待时间) {
                PhoneMod.ddCancel("等待时间过长，司机已取消您的订单。")
            } else if (V.passage === V.Phone.ddstart.passage) {
                const Div = document.createElement("div");
                Div.style.display = "inline";
                let text = "<<icon 'phone/app/DD.png'>>"
                
                if (V.event) {
                    text += '<span class="red">你需要先忙完当前的事情</span>'
                } else {
                    text += '<<link [[上车|DD seat]]>><</link>>'
                }
                text += ' | 你预定的DD司机正在这里等你。<br><br>'
                new Wikifier(Div, text);
                $(PhoneMod.ev.content).first().before(Div)
            }
        }
    }, 100)
}