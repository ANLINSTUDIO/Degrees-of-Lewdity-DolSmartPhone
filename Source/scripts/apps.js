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
PhoneMod.checkAlarms = function() { // 闹钟检查
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
    delete V.Phone.AlarmCurrent;

    PhoneMod.togglePhone(false);
    PhoneMod.PhoneUIInit();
};
PhoneMod.deleteAlarm = function(index) { // 删除闹钟
    V.Phone.Alarms.pop(index);
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
    setTimeout(() => {
        delete V.Phone.TakingPhotoWill;
        for (let photo_path in PhoneMod.PhonePhotos) {
            if (V.Phone.Album.hasOwnProperty(photo_path)) continue;
            const photo = PhoneMod.PhonePhotos[photo_path];
            const result = Object.entries(photo.conditions).every(([key, expectedValue]) => {
                if (key === "_") {
                    return expectedValue()
                } else {
                    let not = false
                    if (key.endsWith("非")) {
                        not = true
                        key = key.slice(0, -1)
                    }
                    const actualValue = key.split('$').reduce((obj, prop) => obj?.[prop], V);
                    // console.log(photo_path, actualValue, expectedValue);
                    if (not) {
                        return actualValue !== expectedValue
                    } else {
                        return actualValue === expectedValue
                    }
                }
            });
            if (result) {
                PhoneMod.Guide.startTutorial("photo");
                V.Phone.TakingPhotoWill = photo_path;
                break
            }
        }

        PhoneMod.checkPhoneDisabled();
    }, 200)
}
PhoneMod.photoTake = function() {
    if (!V.Phone.TakingPhotoWill) return;
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
    V.Phone.PhotoCurrent.facevariant = V.facevariant
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
    for (let taskId in PhoneMod.PhonePhotos) {
        PhoneMod.addAlbumTask(taskId)
    }
    PhoneMod.reorderTodoItems();
}
PhoneMod.addAlbumTask = function(taskId) {
    const todoList = document.querySelector('.todo-list');
    if (!todoList) return;

    const task = PhoneMod.PhonePhotos[taskId]
    const photo = V.Phone.Album[taskId]
    const isFinished = taskId in V.Phone.Album
    
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
                ${task.fames && task.fames.length > 0? `<div>相关名声：${PhoneMod.getFamesFriendlyNames(task.fames)}</div>`: ''}
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
                <img class="album-photo-image" src='${(isFinished)? `img/photo/${taskId}.png`: "img/ui/phone/app/photo.png"}'>
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
                yenote.comments.push(PhoneMod.yenoteGenerateRandomComment(yenote.id));
            }
        }
    })
}
PhoneMod.yenoteGetHeat = function (yenote) {
    const ageHours = (Time.date.timeStamp - yenote.date.timeStamp) / 3600; // 小时差
    const decayFactor = Math.exp(-PhoneMod.热度衰减系数 * ageHours);                         // 衰减系数可调
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
    V.Phone.Yenotes.push({
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
PhoneMod.yenoteGenerateRandomComment = function(photo_id) {
    const photo = PhoneMod.PhonePhotos[photo_id];
    // 合并全局评论和照片评论（照片评论覆盖同名键）
    const commentPool = Object.assign({}, PhoneMod.Comments, photo.comments || {});
    const keys = Object.keys(commentPool);
    if (keys.length === 0) return null; // 无评论

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return {
        name: PhoneMod.generateNickname(),
        text: randomKey,
        effect: commentPool[randomKey],
        already_read: false
    };
};