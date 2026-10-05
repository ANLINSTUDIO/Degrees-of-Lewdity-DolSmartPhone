AsAPI.log("SmartPhone", "正在加载：main.js");


// NPC注入
if (window.maplebirch) {
    maplebirch.npc.add({
        nam: "Feng",
        gender: 'm',
        title: "Pickpocket",
        description: "Feng",
        type: "human",
        adult: 1,
        age: 32,
        insecurity: "skill",

        hairColour: "black",

        love: 0,
        lust: 0,
        
        init: 0,
    }, {
        love: { maxValue: 100 },
        loveAlias: ['Trust', '信任'],
        lust: { name: "欣赏", maxValue: 100, activeIcon : "img/ui/sym-confidence.png", inactiveIcon : undefined, iconOrientation : undefined }
    }, {
        "Feng": {
            CN: "老冯",
            EN: "Feng"
        },
        "Pickpocket": {
            CN: "扒手",
            EN: "Pickpocket"
        }
    });
}


// ================== passage 注入 ==================
$(document).one(":passageinit", function () {
    smartphone.events_on_macro.forEach(function(event) {
        AsAPI.onMacro(event.macro, smartphone[event.func])
    })
});
$(document).on(":passagerender", function (ev) {smartphone.onPassageRender(ev)});
smartphone.onPassageRender = function (ev) {
    smartphone.ev = ev;

    const phoneDebugSwitchUI = document.createElement('div');
    new Wikifier(phoneDebugSwitchUI, "<<smartphone_debug_switch>>");
    $(smartphone.ev.content).append(phoneDebugSwitchUI);

    smartphone.yenotesCheck();

    const phoneUI = document.createElement('div');
    phoneUI.id = "phone-wrapper";
    $(smartphone.ev.content).append(phoneUI);
    const phonerenderUI = document.createElement('div');
    phonerenderUI.id = "phone-render";
    phoneUI.appendChild(phonerenderUI);
    setTimeout(smartphone.PhoneUIInit, 10);
    setTimeout(smartphone.PhoneAddInit, 10);
    smartphone.PhonePopupInit();

    setTimeout(smartphone.appInit, 10);
    smartphone.eventsLoad();

    smartphone.photoFinish();
    smartphone.photoCheck();  // 检测完成任务并执行拍照
    smartphone.ddCheck();

    smartphone.PhonePowerPass();
}
smartphone.eventsLoad = function() {
    smartphone.events.forEach(smartphone.eventsLoad_)
}
smartphone.eventsLoad_ = function(event_or_id) {  // 可以提供event或者eventid
    let event = event_or_id
    if (typeof(event_or_id) === "string") {
        event = smartphone.events.find(event_ => event_.eventid === event)
        if (!event) {
            AsAPI.error("SmartPhone", `没有找到次事件 ${event_or_id}，注入失败`);
        }
    }
    if (!event) return
    if (V.passage === event.passage || typeof(event_or_id) === "string") {
        let pass = null
        if (event.condition) {
            pass = smartphone[event.condition]()
        }
        if (pass === null) {
            if (event.chance) {
                if (Math.random() < event.chance) {
                    pass = true
                } else {
                    pass = false
                }
            } else {
                pass = true
            }
        }
        if (pass) {
            let succeed = true
            if (event.goto === true) {
                new Wikifier(null, `<<goto "${event.event}">>`);
            } else {
                succeed = smartphone.eventsLoadInclude_(event.target, event.event, event.position, event.offset)
            }
            if (succeed) {
                if (event.s) {
                    smartphone.eventsLoad_(event.s)
                }
            } else {
                if (event.f) {
                    AsAPI.error("SmartPhone", `注入 ${event.event} 时没有找到目标 ${event.target}，尝试使用次事件 ${event.f}`);
                    smartphone.eventsLoad_(event.f)
                } else {
                    AsAPI.error("SmartPhone", `注入 ${event.event} 时没有找到目标 ${event.target}，注入失败`);
                }
            }
        }
    }
}
smartphone.eventsLoadInclude_ = function(target, include, position="after", offset=0) {
    let $target = $(smartphone.ev.content).find(`a[data-passage="${target}"]`);
    if ($target.length <= 0) return false

    const Div = document.createElement("div");
    Div.style.display = "inline";
    new Wikifier(Div, `<<${include}>>`);
    if (position === "replace") {
        $target.first().replaceWith(Div);
    } else{
        smartphone.eventsLoadInsert_($target, Div, position, offset)
    }
    return true
}
smartphone.eventsLoadInsert_ = function(target, insert_target, position="after", offset=0) {
    let insertTarget = target.first();
    if (position === "before") {
        // 遍历前两个兄弟节点
        for (let i = 0; i < offset; i++) {
            if (insertTarget.prev().length > 0) {
                insertTarget = insertTarget.prev();
            } else {
                break; // 如果没有足够的前一个兄弟节点，则跳出循环
            }
        }
        insertTarget.before(insert_target);
    } else {  //  默认向后 elif (position === "after")
        // 遍历后两个兄弟节点
        for (let i = 0; i < offset; i++) {
            if (insertTarget.next().length > 0) {
                insertTarget = insertTarget.next();
            } else {
                break; // 如果没有足够的后一个兄弟节点，则跳出循环
            }
        }
        insertTarget.after(insert_target);
    }
}

// ================== 原版函数注入 ==================
dayPassed = new Proxy(dayPassed, {
    apply: function(target, thisArg, argumentsList) {
        smartphone.dayPassed()
        return target.apply(thisArg, argumentsList);
    }
});
smartphone.dayPassed = function() {
    // 咖啡馆每天下降警戒
    if (V.Phone.StealPhoneAlertOceanBreeze) {
        V.Phone.StealPhoneAlertOceanBreeze -= 3
        if (V.Phone.StealPhoneAlertOceanBreeze <= 0) {
            delete V.Phone.StealPhoneAlertOceanBreeze
        }
    }

    smartphone.RefreshSecondPhone()  // 老冯二手店刷新货
}


// =================== 操控手机 =====================
smartphone.checkPhoneDisabled = function() {
    setTimeout(() => {
        const phone = document.getElementById("smart-phone-container");
        if (!phone) return;
        if (V.Phone.TakingPhotoWill) {  // 完成任务时显示手机
            phone.classList.remove("phone-disabled");
            smartphone.setPhoneBeating(true);
            smartphone.togglePhone(false);
        } else {
            if (smartphone.shouldUsePhone()) {
                phone.classList.remove("phone-disabled");
            } else {
                phone.classList.remove("phone-open");
                phone.classList.add("phone-disabled");
            }
        }
    }, 10)
}
smartphone.togglePhone = function(force=null) {
    if (!smartphone.PhoneConsumption(1) && V.passage !== "Start") return;
    const phone = document.getElementById("smart-phone-container");
    if (!phone) return;

    if (force === true) {
        if (smartphone.shouldUsePhone()) {
            phone.classList.add("phone-open");
            T.phoneopen = true
        }
    }
    else if (force === false) {
        phone.classList.remove("phone-open");
        T.phoneopen = false
    } else {

        if (V.Phone.PhotoCurrent) {  // 在触发任务时点击
            phone.classList.remove("phone-open");
            T.phoneopen = false
            smartphone.photoFinish();
            smartphone.toggleApp("main", false);
            return;
        }

        if (smartphone.shouldUsePhone() || V.Phone.TakingPhotoWill) {
            phone.classList.toggle("phone-open");
            T.phoneopen = phone.classList.contains("phone-open");
        } else {
            phone.classList.remove("phone-open");
            T.phoneopen = false
        }
    }

    if (phone.classList.contains("phone-open")) {
        if (V.Phone.TakingPhotoWill) {
            smartphone.photoTake()
        }

        // 防止空手机
        const phoneContent = document.getElementById("phone-content")
        if (phoneContent) {
            if (!phoneContent.classList.contains("phone-content-open")) {
                smartphone.PhoneSafeOpen()
            }
        }
    }

    smartphone.appInit(true)
};
smartphone.toggleApp = function(AppName, open=true) {
    if (!smartphone.PhoneConsumption(1)) return;
    V.Phone.CurrentApp = AppName;
    smartphone.PhoneUIInit(open);
    smartphone.appInit();
};
smartphone.appInit = function(togglePhone=false) {
    const AppName = V.Phone.CurrentApp
    const app = smartphone.Apps[AppName]
    if (!V.Phone.AlarmTriggered && app) {
        if (app.guide) {
            smartphone.Guide.startTutorial(app.guide);
        }
        if (togglePhone) {
            if (app.toggle) {
                smartphone[app.toggle](T.phoneopen)
            }
        } else {
            if (app.init) {
                smartphone[app.init]()
            }
        }
    }
    if (V.Phone.msgLine.length > 0) {
        V.Phone.msgLine.forEach(msg_ => {
            if (msg_.app && T.phoneopen && msg_.app === AppName) {
                smartphone.msgClose(msg_.id)
            }
        })
    }
};
$(document).on("keyup", function(event) { // 监听键
    const target = event.target;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable ||  // 可编辑的div等
                    target.tagName === 'SELECT';

    // 如果当前在输入框中，不触发空格切换
    if (isInput) {
        return; // 允许输入空格，不触发切换
    }

    if (event.key === " ") {
        smartphone.togglePhone();
    }
});
$(document).on("mousedown", function(event) {
    if (event.button === 3 || event.button === 4) {
        event.preventDefault();  // 防止触发浏览器历史导航
        event.stopPropagation(); // 防止事件冒泡
        smartphone.togglePhone();
    }
});
smartphone.PhoneUIInit = function (open=false, reload=false) {
    if (!smartphone.shouldShowPhone()) return;

    smartphone.changeUsingPhone()

    smartphone.PhoneSafeClose(!reload);
    const phonerenderUI = document.getElementById('phone-render');
    const app = smartphone.Apps[V.Phone.CurrentApp]
    if (app && ((app.disable && app.disable.includes(V.passage)) || (app.disableinevent && V.event))) {
        V.Phone.CurrentApp = "main"
    }
    if (V.passage === "Start") {
        new Wikifier(phonerenderUI, "<<smartphone_render_preview>>");
        if (!smartphone.getIsLatestVersion()) {
            smartphone.togglePhone(true)
        }
    } else {
        smartphone.checkAlarms();
        new Wikifier(phonerenderUI, "<<smartphone_render>>");
        smartphone.PhoneSafeOpen(!reload);
        smartphone.checkPhoneDisabled();
    }

    if (open) {
        smartphone.togglePhone(true)
    }

    if (reload) {
        smartphone.appInit()
    }

    smartphone.PhoneLiftInit();
    smartphone.PhoneChargingInit();
};
smartphone.PhoneAddInit = function (open=false, reload=false) {
    if (!smartphone.shouldShowPhone()) return;

    if (V.passage === "Start") {
    } else {
        const phoneUI = document.getElementById('phone-wrapper');
        new Wikifier(phoneUI, "<<smartphone_add>>");
    }

    smartphone.PhoneLiftInit();
    smartphone.PhoneChargingInit();
};
smartphone.PhonePopupInit = function() {
    V.Phone.msgLine = V.Phone.msgLine || [];
    if (V.Phone.msgLine.length > 0) {
        const msgLine = V.Phone.msgLine;
        V.Phone.msgLine = [];
        msgLine.forEach(msg_ => {
            if (msg_.confirmationrequired) {
                V.Phone.msgLine.push(msg_)
            }
        })
        smartphone.msgShowLine(false);
    }
}
smartphone.PhoneSafeOpen = function (anim=true) {
    const phone = document.getElementById("smart-phone-container");
    const phoneContent = document.getElementById("phone-content")
    if (phone && phoneContent) {
        if (anim) {
            if (V.Phone.CurrentApp !== "main") {
                phone.style.transition = "all 0.3s ease, background-color 0s ease";
                phone.style.backgroundColor = "transparent";
            }
            setTimeout(() => {
                if (V.Phone.CurrentApp === "main") {
                    phoneContent.classList.add("phone-content-desktop")
                } else {
                    phone.style.transition = "";
                    phone.style.backgroundColor = "";
                }
                phoneContent.classList.add("phone-content-open")
            }, 1)
        } else {
            phone.style.transition = "";
            if (V.Phone.CurrentApp === "main") {
                phoneContent.classList.add("phone-content-desktop")
            } else {
                phone.style.transition = "";
                phone.style.backgroundColor = "";
            }
            phoneContent.classList.add("phone-content-open")
        }
    }
};
smartphone.PhoneSafeClose = function (anim=true) {
    const phoneContainerOld = document.getElementById("smart-phone-container")
    const phoneContentOld = document.getElementById("phone-content")
    if (phoneContainerOld) {
        if (anim && phoneContainerOld && phoneContentOld && phoneContainerOld.classList.contains("phone-open")) {
            phoneContentOld.id = "phone-content-old"
            if (V.Phone.CurrentApp === "main") {
                phoneContainerOld.style.zIndex = 1
                phoneContentOld.classList.remove("phone-content-open")
                phoneContainerOld.id = "smart-phone-container-old"
            } else {
                phoneContainerOld.id = "smart-phone-container-old-desktop"
            }
            setTimeout(() => {
                phoneContainerOld.remove()
            }, 400)
        } else {
            phoneContainerOld.remove()
        }
    }
};
smartphone.PhoneSafeCloseFinish = function () {
    const phoneContainerOld = document.getElementById("smart-phone-container-old") ?? document.getElementById("smart-phone-container-old-desktop")
    if (phoneContainerOld) {
        phoneContainerOld.remove()
    } else {
        AsAPI.error("SmartPhone", "SafeCloseFinishError");
    }
};
smartphone.PhoneScaleSettings = function() {
    const PhoneScale = T.PhoneScale
    AsAPI.reload();
    V.Phone.Settings.Scale = PhoneScale;
    document.documentElement.style.setProperty('--phone-scale', `${V.Phone.Settings.Scale}`);
};
smartphone.PhoneScaleSettingsReset = function() {
    V.Phone.Settings.Scale = 1;
    document.getElementById("numberslider-input-phonesettingsscale").value = V.Phone.Settings.Scale;
    document.getElementById("numberslider-value-phonesettingsscale").innerText = V.Phone.Settings.Scale;
    document.documentElement.style.removeProperty('--phone-scale');
};
smartphone.PhoneMarginSettings = function() {
    const PhoneMargin = T.PhoneMargin
    AsAPI.reload();
    V.Phone.Settings.Margin = PhoneMargin;
    document.documentElement.style.setProperty('--phone-margin', `${V.Phone.Settings.Margin}px`);
};
smartphone.PhoneMarginSettingsReset = function() {
    V.Phone.Settings.Margin = 0;
    document.getElementById("numberslider-input-phonesettingsmargin").value = V.Phone.Settings.Margin;
    document.getElementById("numberslider-value-phonesettingsmargin").innerText = V.Phone.Settings.Margin;
    document.documentElement.style.removeProperty('--phone-margin');
};

// =================== 弹窗信息 =====================
smartphone.msgSend = function(msg_text, app=null, func=null, confirmationrequired=false) {
    setTimeout(() => {
        const msg = {id: new Date().getTime().toString(36) + '-' + Math.random().toString(36).substr(2, 9), msg: msg_text, app: app, func: func, confirmationrequired: confirmationrequired}
        V.Phone.msgLine.push(msg)
        if (smartphone.getUsingPhone()) {
            if (!V.Phone.Settings.NotificationClose) {
                smartphone.msgShow(msg)
                // const phone_popup = document.querySelector(".phone-popup")
                
                // if (phone_popup) {
                //     const phone_popup_content = phone_popup.querySelector(".phone-popup-content")
                //     new Wikifier(phone_popup_content, `${phone_popup_content.innerHTML? '<br>': ''}${msg}`);
                //     phone_popup.classList.add("active")
                //     V.Phone.MsgApp = app
                //     V.Phone.MsgFunc = func
                // }
            } else {
                V.Phone.msgLine = []
            }
        }
    }, 10)
}
smartphone.msgShowLine = function(anim=true) {
    if (smartphone.getUsingPhone()) {
        setTimeout(() => {
            V.Phone.msgLine.forEach(msg_ => {
                smartphone.msgShow(msg_, anim)
            })
        }, 10)
    }
}
smartphone.msgShow = function(msg, anim=true) {
    smartphone.msgPop(msg, anim)
}
smartphone.msgPop = function(msg, anim=true) {
    T.msg = msg;
    new Wikifier(document.querySelector("#phone-popup-container"), "<<smartphone_popup>>");
    const phone_popup = document.querySelector(`#phone-popup-${msg.id}`)
    if (phone_popup) {
        if (anim) {
            (function(id) { setTimeout(() => {
                phone_popup.classList.add("active")
            }, 100) })(msg.id)
        } else {
            phone_popup.classList.add("active")
        }
    }
}
smartphone.msgClick = function (e) {
    const functext = e.currentTarget.dataset.func
    if (functext && functext != "null") {
        const func = new Function('return (' + functext + ')')();
        func();
    }
    smartphone.msgClose(e.currentTarget.dataset.msg)
}
smartphone.msgCloseClick = function (e, fromclick=false) {
    if (!fromclick) {
        e.stopPropagation();
        e.preventDefault();
    }

    const phone_popup = fromclick ? e.currentTarget : e.currentTarget.parentElement
    if (phone_popup) {
        phone_popup.classList.remove("active")
        setTimeout(() => {
            phone_popup.remove()
        }, 200)
    }
    V.Phone.msgLine = V.Phone.msgLine.filter(msg_ => msg_.id !== e.currentTarget.dataset.msg)
}
smartphone.msgClose = function (id) {
    const phone_popup = document.querySelector(`#phone-popup-${id}`)
    if (phone_popup) {
        phone_popup.classList.remove("active")
        setTimeout(() => {
            phone_popup.remove()
        }, 200)
    }
    V.Phone.msgLine = V.Phone.msgLine.filter(msg_ => msg_.id !== id)
}


// ==================== DEBUG ======================
smartphone.toggleDebug = function(reload = false) {
    const phoneDebugSwitchUIOld = document.getElementById("smart-phone-debug-switch")
    const phoneDebugUIOld = document.getElementById("smartphone_debug")
    phoneDebugSwitchUIOld.style.right = '';
    phoneDebugSwitchUIOld.style.bottom = '';
    if (phoneDebugUIOld) {
        phoneDebugSwitchUIOld.classList.remove("active")
        phoneDebugUIOld.remove()
        if (!reload) return
    }
    phoneDebugSwitchUIOld.classList.add("active")
    const phoneDebugUI = document.createElement('div');
    phoneDebugUI.id = "smartphone_debug"
    new Wikifier(phoneDebugUI, "<<smartphone_debug>>");
    $(smartphone.ev.content).append(phoneDebugUI);
    document.getElementById('excute-js').addEventListener('keydown', function(event) {
        event.stopImmediatePropagation();
    }, true);
}
smartphone.DebugShowMsg = function(content, prefix="", add=false) {
    const phoneDebugUI = document.getElementById("smart-phone-debug-container")
    const smartphone_debug_msg = document.getElementById("smartphone_debug_msg")
    if (phoneDebugUI && smartphone_debug_msg) {
        const element = document.createElement("div")
        element.innerHTML = `<small style="color: gray">[${prefix}${prefix?":":""}${new Date().toLocaleTimeString()}]</small>`
        if (add) {
            element.appendChild(content)
        } else {
            const msg = document.createElement("span")
            msg.innerHTML = content
            element.appendChild(msg)
        }
        smartphone_debug_msg.appendChild(element);
    }
}
smartphone.DebugExcuteJs = function() {
    setTimeout(() => {
        const input = document.getElementById("excute-js")
        if (input) {
            const command = input.value
            if (command) {
                try {
                    smartphone.DebugShowMsg(eval(command), "JS")
                } catch (err) {
                    AsAPI.error("SmartPhone", err);
                    const msg = document.createElement("span")
                    msg.className = 'red';
                    const match = err.message.match(/^[\d.]+\s*出错\s*\(::\s*[^)]+\):\s*(.+?)Export$/);
                    msg.textContent = " " + (match ? match[1] : err.message);
                    smartphone.DebugShowMsg(msg, "JS", true)
                }
            }
        }
    }, 1)
}
smartphone.DebugExcuteSugarCube = function() {
    setTimeout(() => {
        const input = document.getElementById("excute-sugarcube")
        const path_input = document.getElementById("excute-sugarcube-path")
        if (input) {
            const command = input.value
            let path = "#smartphone_debug_msg"
            if (path_input && path_input.value) {
                path = JSON.stringify(path_input.value)
            }
            if (command) {
                try {
                    const tmp = new wikifier(document.querySelector(path), command)
                    let html = '';
                    Array.from(tmp.childNodes).slice(2, -1).forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                        html += node.textContent;  // 文本节点直接加内容
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                        html += node.outerHTML;     // 元素节点加 outerHTML
                        }
                    });
                    smartphone.DebugShowMsg(html, "SC")
                } catch (err) {
                    const msg = document.createElement("span")
                    msg.className = 'red';
                    const match = err.message.match(/^[\d.]+\s*出错\s*\(::\s*[^)]+\):\s*(.+?)Export$/);
                    msg.textContent = " " + (match ? match[1] : err.message);
                    smartphone.DebugShowMsg(msg, "SC", true)
                }
            }
        }
    }, 1)
}
smartphone.DebugDrag = function() {
    const elmnt = document.getElementById("smart-phone-debug-switch");
    if (!elmnt) return;

    let originalRight = null;
    let originalBottom = null;
    let startX = 0;
    let startY = 0;
    let startRight = 0;
    let startBottom = 0;
    let moveHandler = null;
    let upHandler = null;

    const target = document.getElementById(elmnt.id + "header") || elmnt;
    target.style.touchAction = 'none';
    target.addEventListener('pointerdown', dragPointerDown, { passive: false });

    function parsePx(value) {
        return value === '' || value === 'auto' || value === null ? NaN : parseFloat(value);
    }

    function getComputedRightBottom() {
        const cs = window.getComputedStyle(elmnt);
        let right = parsePx(cs.right);
        let bottom = parsePx(cs.bottom);

        if (isNaN(right)) {
            const parentWidth = (cs.position === 'fixed') ? window.innerWidth : (elmnt.offsetParent ? elmnt.offsetParent.clientWidth : document.documentElement.clientWidth);
            right = parentWidth - (elmnt.offsetLeft + elmnt.offsetWidth);
        }
        if (isNaN(bottom)) {
            const parentHeight = (cs.position === 'fixed') ? window.innerHeight : (elmnt.offsetParent ? elmnt.offsetParent.clientHeight : document.documentElement.clientHeight);
            bottom = parentHeight - (elmnt.offsetTop + elmnt.offsetHeight);
        }
        return { right, bottom };
    }

    function dragPointerDown(e) {
        e.preventDefault();
        const pos = getComputedRightBottom();
        originalRight = pos.right;
        originalBottom = pos.bottom;
        startX = e.clientX;
        startY = e.clientY;
        startRight = pos.right;
        startBottom = pos.bottom;

        moveHandler = elementPointerMove;
        upHandler = closePointerDrag;
        document.addEventListener('pointermove', moveHandler, { passive: false });
        document.addEventListener('pointerup', upHandler);

        try { elmnt.setPointerCapture(e.pointerId); } catch (err) {}
        elmnt.style.transition = 'none';
    }

    function elementPointerMove(e) {
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newRight = startRight - dx;
        const newBottom = startBottom - dy;
        elmnt.style.right = Math.round(newRight) + 'px';
        elmnt.style.bottom = Math.round(newBottom) + 'px';
        elmnt.style.top = '';
        elmnt.style.left = '';
        console.log(Math.sqrt(dx*dx + dy*dy));
    }

    function closePointerDrag(e) {
        document.removeEventListener('pointermove', moveHandler);
        document.removeEventListener('pointerup', upHandler);
        try { if (e && typeof e.pointerId !== 'undefined') elmnt.releasePointerCapture(e.pointerId); } catch (err) {}

        elmnt.style.transition = 'right 0.25s cubic-bezier(.22,.9,.34,1), bottom 0.25s cubic-bezier(.22,.9,.34,1)';
        if (originalRight !== null) elmnt.style.right = Math.round(originalRight) + 'px';
        if (originalBottom !== null) elmnt.style.bottom = Math.round(originalBottom) + 'px';

        function cleanup() {
            elmnt.style.transition = '';
            elmnt.removeEventListener('transitionend', cleanup);
        }
        elmnt.addEventListener('transitionend', cleanup);
    }
}

// ================== 游戏内容 ==================
smartphone.Phone = class {
  constructor() {
    this.id = this.generateId();
    this.model = "未知品牌"
    this.newnessmax = 0;  // 当前磨损，最大电量
    this.newness = 0;  // 电量
    this.stolen = false;
    this.usable = false;
    this.second = false;
  }
  generateId(){
    const uniqueId = this.model + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    return uniqueId
  }
  generateModel() {
    this.setModel(smartphone.PhoneModelsMain[ smartphone.PhoneModelsMain.length * Math.random() << 0]);
  }
  setModel(model) {
    this.model = model
    this.id = this.generateId();
    this.newnessmax = this.info().newnessfactory
    this.newness = this.newnessmax
  }
  info() {
    return smartphone.getPhoneInfo(this.model)
  }
  return() {
    return { ...this }
  }
  generate() { // 生成一部手机
    this.generateModel();
    this.newnessmax = Math.round(Math.random() * this.info().newnessfactory);
    this.newness = Math.round(Math.random() * this.newnessmax);
  }
  newBuy(model) {
    this.setModel(model);
    this.usable = true;
    return this.return();
  }
  newBuySecond(model, newnessK) {
    this.newBuy(model);
    this.newnessmax = Math.round(newnessK * this.info().newnessfactory);
    this.newness = this.newnessmax
    this.second = true;
    return this.return();
  }
  newStolen() {
    this.generate();
    this.stolen = true;
    return this.return();
  }
}
// === 手机控制 ==========================================
smartphone.BuyPhone = function(model) { // 购买一部手机
    const phone = new smartphone.Phone().newBuy(model);
    V.Phone.价格调整理赔.push(phone.id);  // 3.83 | 手机价格调整
    V.Phone.Owned.push(phone);
    smartphone.changeUsingPhone();
    return phone;
}
smartphone.BuySecondPhone = function(model, newnessK) { // 购买一部二手手机
    const phone = new smartphone.Phone().newBuySecond(model, newnessK);
    V.Phone.价格调整理赔.push(phone.id);  // 3.83 | 手机价格调整
    V.Phone.Owned.push(phone);
    smartphone.changeUsingPhone();
    V.Phone.SecondPhoneShopGoods = V.Phone.SecondPhoneShopGoods.filter(item => !(item.model === model && item.newnessK === newnessK));
    return phone;
}
smartphone.RefreshSecondPhone = function() {
    delete V.Phone.SecondPhoneShopGoodsBought;
    V.Phone.SecondPhoneShopGoods = [];
    for (let index = 0; index < 4 + Math.random() * 3; index++) {
        const model = smartphone.PhoneModelsMain[ smartphone.PhoneModelsMain.length * Math.random() << 0]
        const newnessK = 0.4 + Math.random() * 0.5
        const model_info = smartphone.getPhoneInfo(model)
        const price = Math.round(model_info.price * newnessK)
        V.Phone.SecondPhoneShopGoods.push({model: model, newnessK: newnessK, price: price})
    };
}
smartphone.StolePhone = function() { // 盗窃一部手机
    const phone = new smartphone.Phone().newStolen();
    V.Phone.价格调整理赔.push(phone.id);  // 3.83 | 手机价格调整
    V.Phone.Owned.push(phone);
    return phone;
}
smartphone.effectsstealPhone = function () {
    if (Math.random() < 0.5) {
        smartphone.StolePhoneOnCombat()
    }
}
smartphone.StolePhoneOnCombat = function () {
    AsAPI.log("SmartPhone", "StolePhoneOnCombat");
}
smartphone.SellPhone = function(id, feng=false) { // 出售手机
    if (!V.Phone.Owned) return;
    const index = V.Phone.Owned.findIndex(p => p.id === id);
    if (index !== -1) {
        const moneyEarned = smartphone.getSellPhonePrice(id, feng) * 100;  // DoL中money单位是分，所以乘以100
        V.Phone.Owned.splice(index, 1);
        smartphone.changeUsingPhone();
        return moneyEarned;
    }
    return 0
}
smartphone.AppendPhone = function(phone) { // 加入手机
    V.Phone.价格调整理赔.push(phone.id);  // 3.83 | 手机价格调整
    V.Phone.Owned.push(phone);
    smartphone.changeUsingPhone();
}
smartphone.DeletePhone = function(id=null) { // 删除手机
    if (!V.Phone.Owned) return;
    if (!id) {
        id = V.Phone.Using
    }
    let phone = null
    const index = V.Phone.Owned.findIndex(p => p.id === id);
    if (index !== -1) {
        phone = V.Phone.Owned[index]
        V.Phone.Owned.splice(index, 1);
        smartphone.changeUsingPhone();
    }
    return phone
}
smartphone.changeUsingPhone = function(phone=undefined) { // 切换正在使用的手机
    if (phone === null || (V.Phone.Using === "null" && phone === undefined)) {
        V.Phone.Using = "null"
    } else {
        if (phone === undefined) {
            if (V.Phone.Using && V.Phone.Using !== "null") {
                const PhoneUsing = V.Phone.Owned.find(p => p.id === V.Phone.Using)
                if (smartphone.isUsable(PhoneUsing)) return V.Phone.Using;
            }
            
            if (!V.Phone.Owned || V.Phone.Owned.length === 0) {
                V.Phone.Using = null;
            } else {
                V.Phone.Using = "null";
                for (var i = 0; i < V.Phone.Owned.length; i++) {
                    if (smartphone.isUsable(V.Phone.Owned[i])) {
                        V.Phone.Using = V.Phone.Owned[i].id;
                        break;
                    }
                }
            }
        } else {
            if (smartphone.isUsable(phone, true)) {
                V.Phone.Using = phone.id;
            } else {
                V.Phone.Using = null
            }
        }
        smartphone.msgShowLine();
    }
    return V.Phone.Using;
}
// === 手机电量与磨损 ====================================
smartphone.PhoneConsumption = function(value) {
    const phone = smartphone.getUsingPhone()
    if (phone && phone.newness > 0) {
        AsAPI.log("SmartPhone", `电量损耗: ${value}`);
        phone.newness = Math.round(phone.newness - value);
        if (phone.newness === 0) {
            phone.newness = -1
        }
        return smartphone.PhoneCheckNewness()
    }
    return false
}
smartphone.PhoneCharge = function(value, phone = null) {
    if (!phone) {phone = smartphone.getUsingPhone()}
    const newness = Math.round(phone.newness + value)
    const wear = Math.round(Math.max(newness - phone.newnessmax, 0) * smartphone.充电损害每度电比)
    smartphone.PhoneWaer(wear, phone)  // 损耗手机：过度充电
    phone.newness = Math.min(newness, phone.newnessmax);
    return wear
}
smartphone.PhoneWaer = function(value, phone = null, check = true) {
    if (!phone) {phone = smartphone.getUsingPhone()}
    if (value <= 0) return;
    phone.newnessmax = Math.max(Math.round(phone.newnessmax - value), 0);
    if (phone === smartphone.getUsingPhone()) {
        AsAPI.addStoryCaptionContent(`<span class="red">+${value}手机损耗</span>`); 
        if (check) {
            return smartphone.PhoneCheckNewness()
        } else {
            return null
        }
    } else {
        return null
    }
}
smartphone.PhoneCheckNewness = function () {
    const phone = smartphone.getUsingPhone()
    if (phone.newnessmax <= 0) {
        phone.newnessmax = 0;
        if (!smartphone.changeUsingPhone()) {
            smartphone.PhoneSafeClose()
            AsAPI.addStoryCaptionContent("<span class='red'>你当前使用的手机已经损坏，无法继续使用了。<br>你的口袋里没有另外一部能够使用的手机了。</span>"); 
            return false;
        } else {
            smartphone.PhoneUIInit()
            AsAPI.addStoryCaptionContent("<span class='red'>你当前使用的手机已经损坏，无法继续使用了。<br>你从口袋里找到了另外一部能够使用的手机作为替换。</span>"); 
            return true;
        }
    }
    if (phone.newness < 0) {
        phone.newness = 0;
        smartphone.PhoneWaer(50, null, false)  // 损耗手机：强制关机
        smartphone.changeUsingPhone()
        smartphone.PhoneUIInit()
        if (smartphone.getUsingPhone().newness === 0) {
            AsAPI.addStoryCaptionContent("<span class='red'>你当前使用的手机已经没电导致关机，无法继续使用了。<br>你的口袋里没有另外一部能够使用的手机了。</span>"); 
            return false;
        } else {
            AsAPI.addStoryCaptionContent("<span class='red'>你当前使用的手机已经没电导致关机，无法继续使用了。<br>你从口袋里找到了另外一部能够使用的手机作为替换。</span>"); 
            return true;
        }
    } else if (phone.newness / phone.newnessmax < 0.2) {
        if (!V.Phone.lowbatteryAlerted) {
            V.Phone.lowbatteryAlerted = true;
            setTimeout(() => {
                smartphone.msgSend("<span class='yellow'>手机电量不足，请及时充电。</span>", null, null, true);
            }, 0);
        }
    } else if (V.Phone.lowbatteryAlerted) {
        delete V.Phone.lowbatteryAlerted;
    }
    return true;
}
smartphone.PhoneChargeUnguarded = function(position) {
    const phone = smartphone.getUsingPhone()
    V.Phone.Charger[position] = {
        phone: phone,
        date: Time.date,
        started: Time.date
    }
    V.Phone.Owned = V.Phone.Owned.filter(_phone => _phone !== phone)
    smartphone.changeUsingPhone()
}
smartphone.PhoneChargeUnguardedFinish = function(position) {
    const phone = V.Phone.Charger[position].phone
    if (phone.id === "PowerBank") {
        const powerbank = V.Phone.Charger[position].phone
        V.Phone.PowerBank = {
            newness: powerbank.newness,
            newnessmax: powerbank.newnessmax,
        }
    } else {
        V.Phone.Owned.push(phone)
        smartphone.changeUsingPhone(phone)
    }
    delete V.Phone.Charger[position]
}
smartphone.isPhoneChargeUnguardedIn = function(position, apply=false) {
    if (Time === undefined) return;
    V.Phone.Charger = V.Phone.Charger || {};
    if (V.Phone.Charger.hasOwnProperty(position)) {
        if (apply) {
            const phone = V.Phone.Charger[position].phone;
            const ageHours = (Time.date.timeStamp - V.Phone.Charger[position].date.timeStamp) / 3600; // 小时差
            const charge_value = ageHours * smartphone.充电速度每小时;
            let wear = 0;

            if (phone.id === "PowerBank") {
                phone.newness = Math.min(phone.newness + charge_value * smartphone.充电宝充入倍数, phone.newnessmax)
                T.PowerBankCharging = true;
            } else {
                wear = smartphone.PhoneCharge(ageHours * smartphone.充电速度每小时, phone)
                T.PowerBankCharging = false;
            }
            
            V.Phone.Charger[position].date = Time.date
            
            const ageHoursFromStarted = (Time.date.timeStamp - V.Phone.Charger[position].started.timeStamp) / 3600; // 小时差
            const fromStartedText = AsAPI.getFriendlyTimeText(ageHoursFromStarted)

            var beenStolen = false;
            if (!smartphone.手机充电中安全地点.includes(position)) {
                if (position === "Library" && sydneySchedule() === undefined && T.sydney_location === "library") {
                } else {
                    beenStolen = Math.random() <= smartphone.手机充电中被盗概率;
                    if (beenStolen) delete V.Phone.Charger[position];
                }
            }

            return {phone: phone, hours: ageHours, fromStarted: ageHoursFromStarted, fromStartedText: fromStartedText, wear: wear, beenStolen: beenStolen}
        }
        
        return true
    }
    return false
}
smartphone.PhonePowerPass = function() {
    if (smartphone.getUsingPhone()) {
        if (V.Phone.PowerPassLast) {
            const minutesPassed = (Time.date.timeStamp - V.Phone.PowerPassLast.timeStamp) / 60; // 分钟差
            AsAPI.log("SmartPhone", `自然电量损失: ${Time.date.timeStamp} - ${V.Phone.PowerPassLast.timeStamp} = ${minutesPassed * smartphone.自然电量损失每分钟}`);
            if (minutesPassed > 0) {
                smartphone.PhoneConsumption(minutesPassed * smartphone.自然电量损失每分钟);
            } else {
                return;
            }
            
            if (V.Phone.Charging && V.Phone.PowerBank && V.Phone.PowerBank.newness > 0) {
                const phone = smartphone.getUsingPhone();
                if (phone) {
                    let chargingValue = minutesPassed * smartphone.充电宝充电每分钟;
                    // 计算最低充电量（预计充电，手机剩余充电空间，充电宝剩余电量）
                    chargingValue = Math.min(chargingValue, phone.newnessmax - phone.newness, V.Phone.PowerBank.newness);
                    smartphone.PhoneCharge(chargingValue, phone);
                    V.Phone.PowerBank.newness -= chargingValue;
                    AsAPI.log("SmartPhone", `充电宝充电: ${chargingValue}`);
                    if (V.Phone.PowerBank.newness <= 0) {
                        smartphone.PhoneCharging(false, true);
                    }
                }
            }
        }
    } else {
        V.Phone.Charging = false
    }
    V.Phone.PowerPassLast = Time.date;
}
// === 手机存放 ====================================
smartphone.PhoneStore = function(position, id) {
    V.Phone.Store = V.Phone.Store || {};
    const phone = smartphone.getPhone(id)
    V.Phone.Store[position] = V.Phone.Store[position] || {}
    V.Phone.Store[position][id] = phone
    V.Phone.Owned = V.Phone.Owned.filter(_phone => _phone !== phone)
    smartphone.changeUsingPhone()
}
smartphone.PhoneStoreFinish = function(position, id) {
    V.Phone.Store = V.Phone.Store || {};
    const phone = V.Phone.Store[position][id]
    V.Phone.Owned.push(phone)
    smartphone.changeUsingPhone(phone)
    delete V.Phone.Store[position][id]
    if (Object.keys(V.Phone.Store[position]).length === 0) {
        delete V.Phone.Store[position]
    }
}
smartphone.isPhoneStoreIn = function(position) {
    V.Phone.Store = V.Phone.Store || {};
    return V.Phone.Store.hasOwnProperty(position)
}
smartphone.getPhonesStoreIn = function(position) {
    V.Phone.Store = V.Phone.Store || {};
    return V.Phone.Store[position] ?? []
}
// === 手机抬起 ===================================
smartphone.PhoneLiftInit = function() {
    const phonescreenlocked = document.getElementById("smart-phone-container");
    const phonestoolbar = document.getElementById("smart-phone-toolbar");
    if (phonescreenlocked && phonestoolbar) {
        smartphone.startY = 0;
        const threshold = 50; // 滑动距离阈值
        const thresholdontrigger = 20; // 触发距离
        
        const start = function(event) {
            if (T.phoneopen) return;
            event.preventDefault();
            if (T.PhoneTool) {
                phonescreenlocked.style.transform = ``;
                phonestoolbar.style.transform = `translateY(calc(100% + 20px))`;
            } else {
                T.PhoneDragging = true;
                if (!event.touches) phonescreenlocked.style.transition = "none";
                phonestoolbar.style.transform = `translateY(calc(100% + 5px))`;
                smartphone.endY = smartphone.startY = event.touches ? event.touches[0].clientY : event.clientY;
                smartphone.PhoneLoadList();
            }
            T.PhoneTool = false;
        };
        const move = function(event) {
            if (T.phoneopen) return;
            if (!T.PhoneDragging) return;
            event.preventDefault();
            smartphone.endY = event.touches ? event.touches[0].clientY : event.clientY;

            if (smartphone.startY - smartphone.endY > threshold) {
                phonescreenlocked.style.transform = `translateY(-${threshold+thresholdontrigger}px)`;
                if (!T.PhoneTool) {
                    T.PhoneTool = true;
                    phonestoolbar.style.transform = `translateY(80%)`;
                }
            } else {
                phonescreenlocked.style.transform = `translateY(${Math.min(0, smartphone.endY - smartphone.startY)}px)`;
                if (T.PhoneTool) {
                    T.PhoneTool = false;
                    phonestoolbar.style.transform = `translateY(calc(100% + 5px))`;
                }
            }
        };
        const end = function(event) {
            if (T.phoneopen) return;
            if (!T.PhoneDragging) return;
            event.preventDefault();
            smartphone.endY = event.type !== "touchend" ? event.clientY : smartphone.endY;
            T.PhoneDragging = false;
            phonescreenlocked.style.transition = "all 0.3s ease, background-color 0.4s ease";
            
            if (smartphone.startY - smartphone.endY > threshold) {
                phonestoolbar.style.transform = `translateY(0)`;
            } else {
                if (smartphone.shouldUsePhone()) {
                    smartphone.togglePhone(true);
                }
                phonescreenlocked.style.transform = ``;
                phonestoolbar.style.transform = `translateY(calc(100% + 20px))`;
            }
        };
        phonescreenlocked.addEventListener('touchstart', start, false);
        phonescreenlocked.addEventListener('mousedown', start, false);
        phonescreenlocked.addEventListener('touchmove', move, false);
        phonescreenlocked.addEventListener('mousemove', move, false);
        phonescreenlocked.addEventListener('touchend', end, false);
        phonescreenlocked.addEventListener('mouseup', end, false);
        phonescreenlocked.addEventListener('mouseleave', function(event) {
            if (T.PhoneDragging) {
                T.PhoneDragging = false;
                T.PhoneTool = false;
                phonescreenlocked.style.transition = "all 0.3s ease, background-color 0.4s ease";
                phonescreenlocked.style.transform = ``;
                phonestoolbar.style.transform = `translateY(calc(100% + 20px))`;
            }
        }, false);
    }
}
smartphone.PhoneLoadList = function() {
    const phonestoolbar = document.getElementById("smart-phone-toolbar");
    if (V.Phone.Owned && V.Phone.Owned.length > 0 && phonestoolbar) {
        const Div = document.getElementById("smart-phone-list")
        if (Div) {
            Div.innerHTML = "";
        }
        V.Phone.Owned.forEach(function(phone) {
            if (!(phone.stolen && !phone.usable) && phone.id !== V.Phone.Using) {
                const DivC = document.createElement("div");
                DivC.className = "smart-phone-list-item";
                DivC.addEventListener("click", function() {
                    smartphone.PhoneCharging(false)
                    smartphone.changeUsingPhone(phone);
                    smartphone.PhoneUIInit();
                    T.PhoneDragging = false;
                    T.PhoneTool = false;
                    const phonescreenlocked = document.getElementById("smart-phone-container");
                    phonescreenlocked.style.transition = "all 0.6s ease";
                    phonescreenlocked.style.transform = `translateY(100%)`;
                    setTimeout(() => {
                        phonescreenlocked.style.transform = ``;
                        phonestoolbar.style.transform = `translateY(calc(100% + 20px))`;
                    }, 10);
                })
                let info = smartphone.getPhoneConditionInfo(phone);
                new Wikifier(DivC, `
                    <div class="smart-phone-toolbar-icon">
                        <<if $Phone.Using and "${phone.id}" eq $Phone.Using>>
                            <<icon "phone/phone.png">>
                        <<else>>
                            <<icon "phone/phone-disabled.png">>
                        <</if>>
                        <div class="smart-phone-toolbar-subtitle">
                            <<if ${phone.newnessmax > 0}>>
                                <<if $Phone.Using and "${phone.id}" eq $Phone.Using and $Phone.Charging>>
                                    <span style="background-color: green; border-radius: 3px;">&nbsp;${smartphone.getPhoneBattery(phone)}%&nbsp;</span>
                                <<else>>
                                    &nbsp;${smartphone.getPhoneBattery(phone)}%&nbsp;
                                <</if>>
                            <<else>>
                                &nbsp;---&nbsp;
                            <</if>>
                        </div>
                        <div class="smart-phone-toolbar-title">
                            ${phone.model}(${info.html})
                        </div>
                    </div>
                    `);
                Div.appendChild(DivC);
            }
        });
        Div.addEventListener('wheel', (event) => {
            event.preventDefault();
            Div.scrollLeft += event.deltaY;
        });
    }
}
// === 充电宝 =====================================
smartphone.GetPowerBank = function() {
    V.Phone.PowerBank = {
        newness: 10000,
        newnessmax: 10000
    }
}
smartphone.PowerBankChargeIn = function(position) {
    V.Phone.Charger[position] = {
        phone: {
            id: "PowerBank",
            newness: V.Phone.PowerBank.newness,
            newnessmax: V.Phone.PowerBank.newnessmax,
        },
        date: Time.date,
        started: Time.date
    }
    delete V.Phone.PowerBank
}
smartphone.PhoneCharging = function(charging=true, batterysonly=false) {
    if (smartphone.getUsingPhone()) {
        const lines = document.querySelectorAll("#smart-phone-charge-line");
        const batterys = document.querySelectorAll("#battery");
        if (!(lines && batterys)) return;
        if (charging) {
            if (batterysonly) {
                batterys.forEach(battery => battery.classList.add("battery_charge"));
                return;
            }
            V.Phone.Charging = true;
            lines.forEach(line => {
                line.classList.add("line-start")
                line.style.display = "block"
                line.style.transition = "transform 0.4s ease, opacity 0.4s ease"
            })
            setTimeout(() => {
                lines.forEach(line => line.classList.remove("line-start"))
                setTimeout(() => {
                    if (V.Phone.Charging) {
                        lines.forEach(line => line.style.transition = "")
                        if (V.Phone.PowerBank.newness > 0) {
                            batterys.forEach(battery => battery.classList.add("battery_charge"))
                        }
                    }
                }, 400)
            }, 10);
        } else {
            if (batterysonly) {
                batterys.forEach(battery => battery.classList.remove("battery_charge"));
                return;
            }
            V.Phone.Charging = false;
            batterys.forEach(battery => battery.classList.remove("battery_charge"))
            lines.forEach(line => line.style.transition = "transform 0.4s ease, opacity 0.4s ease")
            setTimeout(() => {
                lines.forEach(line => line.classList.add("line-start"))
                setTimeout(() => {
                    if (!V.Phone.Charging) {
                        lines.forEach(line => {
                            line.style.transition = "";
                            line.classList.remove("line-start")
                            line.style.display = "none"
                        })
                    }
                }, 400)
            }, 10);
        }
    }
}
smartphone.PhoneChargingInit = function() {
    const lines = document.querySelectorAll("#smart-phone-charge-line");
    const batterys = document.querySelectorAll("#battery");
    if (V.Phone.PowerBank && V.Phone.Using) {
        if (V.Phone.Charging) {
            if (V.Phone.PowerBank.newness > 0) {  // 充电宝有电才显示充电
                batterys.forEach(battery => battery.classList.add("battery_charge"))
            }
            lines.forEach(line => line.style.display = "block")
        }
    } else {
        V.Phone.Charging = false
    }
}
// === 日志 ==========================================
smartphone.showPhoneJournal = function() {  // 日志中显示手机信息
    if (V.Phone.Owned && V.Phone.Owned.length > 0) {
        const Uls = document.getElementsByClassName("journal carry")
        if (Uls.length > 0) {
            let Ul = Uls[0];
            if (Uls.length > 1) Ul = Uls[1];
            const Div = document.createElement("div");
            Div.id = "phone-journal";
            Ul.appendChild(Div);
            
            const Li = document.createElement("li");
            new Wikifier(Li, `
                <<icon "phone/phones.png">> <span class="yellow">持有的手机</span>。可以出售给手机店。
                <span style="margin-right: 20px"></span> <<link "全部关机">> <<run smartphone.phoneJournalChange(null)>> <</link>>
            `);
            Div.appendChild(Li);
            
            V.Phone.Owned.forEach(function(phone) {
                const Li = document.createElement("li");
                let info = smartphone.getPhoneConditionInfo(phone);
                new Wikifier(Li, `
                    <span style="margin-right: 20px"></span>
                    <<if $Phone.Using and "${phone.id}" eq $Phone.Using>>
                        <<icon "phone/phone.png">>
                        <<if ${phone.newness > 0}>>
                            <span class='teal'>正在使用</span> | 
                        <<else>>
                            <span class='red'>已经关机</span> |
                        <</if>>
                    <<elseif ${phone.stolen && !phone.usable}>>
                        <<icon "phone/phone-forbid.png">>
                        <span class='red'>无法使用</span> | 
                    <<else>>
                        <<icon "phone/phone-disabled.png">> 
                        <<if ${phone.newnessmax > 0}>>
                            <<link "切换到">> <<run smartphone.phoneJournalChange("${phone.id}")>> <</link>> | 
                        <<elseif ${phone.newnessmax === 0}>>
                            <span class='red'>已损坏</span> |
                        <</if>>
                    <</if>>
                    <<if ${phone.newnessmax > 0}>>
                        <<if $Phone.Using and "${phone.id}" eq $Phone.Using and $Phone.Charging>>
                            <span style="background-color: green; border-radius: 3px;">[ ${smartphone.getPhoneBattery(phone)}% ]</span>
                        <<else>>
                            [ ${smartphone.getPhoneBattery(phone)}% ] 
                        <</if>>
                    <<else>>
                        [ --- ] 
                    <</if>>
                    一部${info.html}的 ${phone.model} ，官网售价为
                    <span class='gold'>£${Math.round(smartphone.getPhoneInfo(phone.model).price)}</span>。
                    <<if ${phone.stolen}>>
                        <span class='red'>盗窃得来</span>
                        <<if ${phone.usable}>>
                            <span class='yellow'>密码已重置</span>
                        <<else>>
                            <span class='red'>密码未知</span>
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

            if (V.Phone.PowerBank) {
                const Li = document.createElement("li");
                new Wikifier(Li, `
                    <span style="margin-right: 20px"></span>
                    <<icon "phone/power-bank.png">> <span class="yellow">持有充电宝</span> 
                    [ ${Math.round(V.Phone.PowerBank.newness / V.Phone.PowerBank.newnessmax * 100)}% ]
                    <<if ${V.Phone.PowerBank.newness > 0}>>
                        <<if ${smartphone.getUsingPhone() !== null}>>
                            <<if $Phone.Charging>>
                                <<link "停止为手机充电">> <<run smartphone.PhoneCharging(false)>> <<run smartphone.phoneJournalChange()>> <</link>>
                            <<else>>
                                <<link "为当前正在使用的手机充电">> <<run smartphone.PhoneCharging(true)>> <<run smartphone.phoneJournalChange()>> <</link>>
                            <</if>>
                        <<else>>
                            <span class='teal'>选择使用一部手机，之后可以对其充电</span>
                        <</if>>
                    <<else>>
                        <span class='red'>已经没电</span>
                    <</if>>
                `);
                Div.appendChild(Li)
            }
        }
    }
};
smartphone.phoneJournalChange = function(id) { // 日志中更新手机信息
    if (id) {
        const phone = V.Phone.Owned.find(p => p.id === id);
        if (phone) {
            smartphone.changeUsingPhone(phone);
        }
        smartphone.PhoneUIInit();
    } else if (id === null) {
        smartphone.changeUsingPhone(null);
        smartphone.PhoneUIInit();
    }
    
    const Div = document.getElementById("phone-journal");
    if (Div) {
        Div.remove();
    }
    smartphone.showPhoneJournal();
}
smartphone.shutdown = function() { // 关机
    smartphone.confirm('确定要关机吗', '', () => {
        smartphone.togglePhone(false)
        smartphone.phoneJournalChange(null);
    })
}
// === 内容 ==========================================
smartphone.SchoolLockersSneakOnNPC = function(npc) {
    V.Phone.SchoolLockersSneakOnNPC = npc
}
smartphone.SchoolLockersSneakCondition = function() {
    switch (V.Phone.SchoolLockersSneakOnNPC) {
        case "Kylar":
            smartphone.eventsLoad_("SchoolLockersSneakKylar")
            break;
        case "Whitney":
            smartphone.eventsLoad_("SchoolLockersSneakWhitney")
            break;
        case "Robin":
            smartphone.eventsLoad_("SchoolLockersSneakRobin")
            break;
        case "Sydney":
            smartphone.eventsLoad_("SchoolLockersSneakSydney")
            break;
        default:
            return null;
    }
    delete V.Phone.SchoolLockersSneakOnNPC
    return false;
}