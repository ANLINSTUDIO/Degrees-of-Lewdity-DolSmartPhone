AsAPI.log("SmartPhone", "正在加载：main.js");


// ================== passage 注入 ==================
$(document).one(":passageinit", function () {
    PhoneMod.events_on_macro.forEach(function(event) {
        AsAPI.onMacro(event.macro, PhoneMod[event.func])
    })
});
$(document).on(":passagerender", function (ev) {PhoneMod.onPassageRender(ev)});
PhoneMod.onPassageRender = function (ev) {
    PhoneMod.ev = ev

    const phoneDebugSwitchUI = document.createElement('div');
    phoneDebugSwitchUI.id = "smartphone_debug_switch"
    new Wikifier(phoneDebugSwitchUI, "<<smartphone_debug_switch>>");
    $(PhoneMod.ev.content).append(phoneDebugSwitchUI);

    PhoneMod.yenotesCheck()

    const phoneUI = document.createElement('div');
    phoneUI.id = "phone-wrapper";
    $(PhoneMod.ev.content).append(phoneUI);
    setTimeout(PhoneMod.PhoneUIInit, 10);
    PhoneMod.PhonePopupInit();

    setTimeout(PhoneMod.appInit, 100);
    PhoneMod.eventsLoad();

    PhoneMod.photoFinish();
    PhoneMod.photoCheck();  // 检测完成任务并执行拍照
    PhoneMod.ddCheck();

    PhoneMod.PhonePowerPass();
}
PhoneMod.eventsLoad = function() {
    PhoneMod.events.forEach(PhoneMod.eventsLoad_)
}
PhoneMod.eventsLoad_ = function(event_or_id) {  // 可以提供event或者eventid
    let event = event_or_id
    if (typeof(event_or_id) === "string") {
        event = PhoneMod.events.find(event_ => event_.eventid === event)
        if (!event) {
            AsAPI.error("SmartPhone", `没有找到次事件 ${event_or_id}，注入失败`);
        }
    }
    if (!event) return
    if (V.passage === event.passage || typeof(event_or_id) === "string") {
        let pass = null
        if (event.condition) {
            pass = PhoneMod[event.condition]()
        }
        if (pass === null) {
            if (event.chance) {
                pass = Math.random() < event.chance
            } else {
                pass = true
            }
        }
        if (pass) {
            let succeed = true
            if (event.goto === true) {
                new Wikifier(null, `<<goto "${event.event}">>`);
            } else {
                succeed = PhoneMod.eventsLoadInclude_(event.target, event.event, event.position, event.offset)
            }
            if (succeed) {
                if (event.s) {
                    PhoneMod.eventsLoad_(event.s)
                }
            } else {
                if (event.f) {
                    AsAPI.error("SmartPhone", `注入 ${event.event} 时没有找到目标 ${event.target}，尝试使用次事件 ${event.f}`);
                    PhoneMod.eventsLoad_(event.f)
                } else {
                    AsAPI.error("SmartPhone", `注入 ${event.event} 时没有找到目标 ${event.target}，注入失败`);
                }
            }
        }
    }
}
PhoneMod.eventsLoadInclude_ = function(target, include, position="after", offset=0) {
    let $target = $(PhoneMod.ev.content).find(`a[data-passage="${target}"]`);
    if ($target.length <= 0) return false

    const Div = document.createElement("div");
    Div.style.display = "inline";
    new Wikifier(Div, `<<include "${include}">>`);
    if (position === "replace") {
        $target.first().replaceWith(Div);
    } else{
        PhoneMod.eventsLoadInsert_($target, Div, position, offset)
    }
    return true
}
PhoneMod.eventsLoadInsert_ = function(target, insert_target, position="after", offset=0) {
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
        PhoneMod.dayPassed()
        return target.apply(thisArg, argumentsList);
    }
});
PhoneMod.dayPassed = function() {
    // 咖啡馆每天下降警戒
    if (V.Phone.StealPhoneAlertOceanBreeze) {
        V.Phone.StealPhoneAlertOceanBreeze -= 3
        if (V.Phone.StealPhoneAlertOceanBreeze <= 0) {
            delete V.Phone.StealPhoneAlertOceanBreeze
        }
    }

    PhoneMod.RefreshSecondPhone()  // 老冯二手店刷新货
}


// =================== 操控手机 =====================
PhoneMod.checkPhoneDisabled = function() {
    setTimeout(() => {
        const phone = document.getElementById("smart-phone-container");
        if (!phone) return;
        if (V.Phone.TakingPhotoWill) {  // 完成任务时显示手机
            phone.classList.remove("phone-disabled");
            PhoneMod.setPhoneBeating(true);
            PhoneMod.togglePhone(false);
        } else {
            if (PhoneMod.shouldUsePhone()) {
                phone.classList.remove("phone-disabled");
            } else {
                phone.classList.remove("phone-open");
                phone.classList.add("phone-disabled");
            }
        }
    }, 10)
}
PhoneMod.togglePhone = function(force=null) {
    if (!PhoneMod.PhoneConsumption(1) && V.passage !== "Start") return;
    const phone = document.getElementById("smart-phone-container");
    if (!phone) return;

    if (force === true) {
        phone.classList.add("phone-open");
        T.phoneopen = true
    }
    else if (force === false) {
        phone.classList.remove("phone-open");
        T.phoneopen = false
    } else {

        if (V.Phone.PhotoCurrent) {  // 在触发任务时点击
            phone.classList.remove("phone-open");
            T.phoneopen = false
            PhoneMod.photoFinish();
            PhoneMod.toggleApp("main", false);
            return;
        }

        if (PhoneMod.shouldUsePhone() || V.Phone.TakingPhotoWill) {
            phone.classList.toggle("phone-open");
            T.phoneopen = phone.classList.contains("phone-open");
        } else {
            phone.classList.remove("phone-open");
            T.phoneopen = false
        }
    }

    if (phone.classList.contains("phone-open")) {
        if (V.Phone.TakingPhotoWill) {
            PhoneMod.photoTake()
        }

        // 防止空手机
        const phoneContent = document.getElementById("phone-content")
        if (phoneContent) {
            if (!phoneContent.classList.contains("phone-content-open")) {
                PhoneMod.PhoneSafeOpen()
            }
        }
    }

    PhoneMod.appInit(true)
};
PhoneMod.toggleApp = function(AppName, open=true) {
    if (!PhoneMod.PhoneConsumption(1)) return;
    V.Phone.CurrentApp = AppName;
    PhoneMod.PhoneUIInit(open);
    PhoneMod.appInit();
};
PhoneMod.appInit = function(togglePhone=false) {
    const AppName = V.Phone.CurrentApp
    const app = PhoneMod.Apps[AppName]
    if (!V.Phone.AlarmTriggered && app) {
        if (app.guide) {
            PhoneMod.Guide.startTutorial(app.guide);
        }
        if (togglePhone) {
            if (app.toggle) {
                PhoneMod[app.toggle](T.phoneopen)
            }
        } else {
            if (app.init) {
                PhoneMod[app.init]()
            }
        }
    }
    if (V.Phone.MsgApp && T.phoneopen && V.Phone.MsgApp === AppName) {
        PhoneMod.msgClose()
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
        PhoneMod.togglePhone();
    }
});
$(document).on("mousedown", function(event) {
    if (event.button === 3 || event.button === 4) {
        event.preventDefault();  // 防止触发浏览器历史导航
        event.stopPropagation(); // 防止事件冒泡
        PhoneMod.togglePhone();
    }
});
PhoneMod.PhoneUIInit = function (open=false, reload=false) {
    if (!PhoneMod.shouldShowPhone()) return;

    PhoneMod.changeUsingPhone()

    PhoneMod.PhoneSafeClose(!reload);
    const phoneUI = document.getElementById('phone-wrapper');
    const app = PhoneMod.Apps[V.Phone.CurrentApp]
    if (app && ((app.disable && app.disable.includes(V.passage)) || (app.disableinevent && V.event))) {
        V.Phone.CurrentApp = "main"
    }
    if (V.passage === "Start") {
        new Wikifier(phoneUI, "<<smartphone_render_preview>>");
        if (V.passage === "Start") {
            if (!PhoneMod.getIsLatestVersion()) {
                PhoneMod.togglePhone(true)
            }
        }
    } else {
        PhoneMod.checkAlarms();
        new Wikifier(phoneUI, "<<smartphone_render>>");
        PhoneMod.PhoneSafeOpen(!reload);
        PhoneMod.checkPhoneDisabled();
    }

    if (open) {
        PhoneMod.togglePhone(true)
    }

    if (reload) {
        PhoneMod.appInit()
    }

    PhoneMod.PhoneLiftInit();
    PhoneMod.PhoneChargingInit();
};
PhoneMod.PhonePopupInit = function() {
    new Wikifier(PhoneMod.ev.content, "<<smartphone_popup>>");
}
PhoneMod.PhoneSafeOpen = function (anim=true) {
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
PhoneMod.PhoneSafeClose = function (anim=true) {
    const phoneContainerOld = document.getElementById("smart-phone-container")
    const phoneContentOld = document.getElementById("phone-content")
    if (phoneContainerOld) {
        document.getElementById("smart-phone-toolbar")?.remove();
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
PhoneMod.PhoneSafeCloseFinish = function () {
    const phoneContainerOld = document.getElementById("smart-phone-container-old") ?? document.getElementById("smart-phone-container-old-desktop")
    if (phoneContainerOld) {
        phoneContainerOld.remove()
    } else {
        AsAPI.error("SmartPhone", "SafeCloseFinishError");
    }
};
PhoneMod.PhoneScaleSettings = function() {
    const PhoneScale = T.PhoneScale
    AsAPI.reload();
    V.Phone.Settings.Scale = PhoneScale;
    document.documentElement.style.setProperty('--phone-scale', `${V.Phone.Settings.Scale}`);
};
PhoneMod.PhoneScaleSettingsReset = function() {
    V.Phone.Settings.Scale = 1;
    document.getElementById("numberslider-input-phonesettingsscale").value = V.Phone.Settings.Scale;
    document.getElementById("numberslider-value-phonesettingsscale").innerText = V.Phone.Settings.Scale;
    document.documentElement.style.removeProperty('--phone-scale');
};

// =================== 弹窗信息 =====================
PhoneMod.msgSend = function (msg, app=null, func=null) {
    if (PhoneMod.getUsingPhone()) {
        if (!V.Phone.Settings.NotificationClose) {
            if (V.Phone.msgLine.length > 0) PhoneMod.msgShowLine();
            const phone_popup = document.querySelector(".phone-popup")
            
            if (phone_popup) {
                const phone_popup_content = phone_popup.querySelector(".phone-popup-content")
                new Wikifier(phone_popup_content, `${phone_popup_content.innerHTML? '<br>': ''}${msg}`);
                phone_popup.classList.add("active")
                V.Phone.MsgApp = app
                V.Phone.MsgFunc = func
            }
        } else {
            V.Phone.msgLine = []
        }
    } else {
        V.Phone.msgLine.push(msg)
    }
}
PhoneMod.msgShowLine = function() {
    const msgLine = V.Phone.msgLine
    V.Phone.msgLine = []
    
    setTimeout(() => {
        msgLine.forEach(msg_ => {
            PhoneMod.msgSend(msg_)
        })
    }, 200)
}
PhoneMod.msgClose = function () {
    const phone_popup = document.querySelector(".phone-popup")
    if (phone_popup) {
        phone_popup.classList.remove("active")
        const phone_popup_content = phone_popup.querySelector(".phone-popup-content")
        setTimeout(() => {
            phone_popup_content.innerHTML = ""
        }, 200)
    }
    delete V.Phone.MsgApp
    delete V.Phone.MsgFunc
}
PhoneMod.msgClick = function (event) {
    event.stopPropagation()
    if (V.Phone.MsgFunc) V.Phone.MsgFunc()
    PhoneMod.msgClose()
}


// ==================== DEBUG ======================
PhoneMod.toggleDebug = function(reload = false) {
    const phoneDebugSwitchUIOld = document.getElementById("smart-phone-debug-switch")
    const phoneDebugUIOld = document.getElementById("smartphone_debug")
    if (phoneDebugUIOld) {
        phoneDebugSwitchUIOld.classList.remove("active")
        phoneDebugUIOld.remove()
        if (!reload) return
    }
    phoneDebugSwitchUIOld.classList.add("active")
    const phoneDebugUI = document.createElement('div');
    phoneDebugUI.id = "smartphone_debug"
    new Wikifier(phoneDebugUI, "<<smartphone_debug>>");
    $(PhoneMod.ev.content).append(phoneDebugUI);
    document.getElementById('excute-js').addEventListener('keydown', function(event) {
        event.stopImmediatePropagation();
    }, true);
}
PhoneMod.DebugShowMsg = function(content, prefix="", add=false) {
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
PhoneMod.DebugExcuteJs = function() {
    setTimeout(() => {
        const input = document.getElementById("excute-js")
        if (input) {
            const command = input.value
            if (command) {
                try {
                    PhoneMod.DebugShowMsg(eval(command), "JS")
                } catch (err) {
                    AsAPI.error("SmartPhone", err);
                    const msg = document.createElement("span")
                    msg.className = 'red';
                    const match = err.message.match(/^[\d.]+\s*出错\s*\(::\s*[^)]+\):\s*(.+?)Export$/);
                    msg.textContent = " " + (match ? match[1] : err.message);
                    PhoneMod.DebugShowMsg(msg, "JS", true)
                }
            }
        }
    }, 1)
}
PhoneMod.DebugExcuteSugerCube = function() {
    setTimeout(() => {
        const input = document.getElementById("excute-sugercube")
        const path_input = document.getElementById("excute-sugercube-path")
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
                    PhoneMod.DebugShowMsg(html, "SC")
                } catch (err) {
                    const msg = document.createElement("span")
                    msg.className = 'red';
                    const match = err.message.match(/^[\d.]+\s*出错\s*\(::\s*[^)]+\):\s*(.+?)Export$/);
                    msg.textContent = " " + (match ? match[1] : err.message);
                    PhoneMod.DebugShowMsg(msg, "SC", true)
                }
            }
        }
    }, 1)
}

// ================== 游戏内容 ==================
PhoneMod.Phone = class {
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
    this.setModel(PhoneMod.PhoneModelsMain[ PhoneMod.PhoneModelsMain.length * Math.random() << 0]);
  }
  setModel(model) {
    this.model = model
    this.id = this.generateId();
    this.newnessmax = this.info().newnessfactory
    this.newness = this.newnessmax
  }
  info() {
    return PhoneMod.getPhoneInfo(this.model)
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
PhoneMod.BuyPhone = function(model) { // 购买一部手机
    const phone = new PhoneMod.Phone().newBuy(model);
    V.Phone.Owned.push(phone);
    PhoneMod.changeUsingPhone();
    return phone;
}
PhoneMod.BuySecondPhone = function(model, newnessK) { // 购买一部二手手机
    const phone = new PhoneMod.Phone().newBuySecond(model, newnessK);
    V.Phone.Owned.push(phone);
    PhoneMod.changeUsingPhone();
    V.Phone.SecondPhoneShopGoods = V.Phone.SecondPhoneShopGoods.filter(item => !(item.model === model && item.newnessK === newnessK));
    return phone;
}
PhoneMod.RefreshSecondPhone = function() {
    delete V.Phone.SecondPhoneShopGoodsBought;
    V.Phone.SecondPhoneShopGoods = [];
    for (let index = 0; index < 4 + Math.random() * 3; index++) {
        const model = PhoneMod.PhoneModelsMain[ PhoneMod.PhoneModelsMain.length * Math.random() << 0]
        const newnessK = 0.4 + Math.random() * 0.5
        const model_info = PhoneMod.getPhoneInfo(model)
        const price = Math.round(model_info.price * newnessK)
        V.Phone.SecondPhoneShopGoods.push({model: model, newnessK: newnessK, price: price})
    };
}
PhoneMod.StolePhone = function() { // 盗窃一部手机
    const phone = new PhoneMod.Phone().newStolen();
    V.Phone.Owned.push(phone);
    return phone;
}
PhoneMod.effectsstealPhone = function () {
    if (Math.random() < 0.5) {
        PhoneMod.StolePhoneOnCombat()
    }
}
PhoneMod.StolePhoneOnCombat = function () {
    AsAPI.log("SmartPhone", "StolePhoneOnCombat");
}
PhoneMod.SellPhone = function(id, feng=false) { // 出售手机
    if (!V.Phone.Owned) return;
    const index = V.Phone.Owned.findIndex(p => p.id === id);
    if (index !== -1) {
        const moneyEarned = PhoneMod.getSellPhonePrice(id, feng) * 100;  // DoL中money单位是分，所以乘以100
        V.Phone.Owned.splice(index, 1);
        PhoneMod.changeUsingPhone();
        return moneyEarned;
    }
    return 0
}
PhoneMod.AppendPhone = function(phone) { // 删除手机
    V.Phone.Owned.push(phone);
    PhoneMod.changeUsingPhone();
}
PhoneMod.DeletePhone = function(id=null) { // 删除手机
    if (!V.Phone.Owned) return;
    if (!id) {
        id = V.Phone.Using
    }
    let phone = null
    const index = V.Phone.Owned.findIndex(p => p.id === id);
    if (index !== -1) {
        phone = V.Phone.Owned[index]
        V.Phone.Owned.splice(index, 1);
        PhoneMod.changeUsingPhone();
    }
    return phone
}
PhoneMod.changeUsingPhone = function(phone=undefined) { // 切换正在使用的手机
    if (phone === null || (V.Phone.Using === "null" && phone === undefined)) {
        V.Phone.Using = "null"
    } else {
        if (phone === undefined) {
            if (V.Phone.Using && V.Phone.Using !== "null") {
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
                for (var i = 0; i < V.Phone.Owned.length; i++) {
                    if (PhoneMod.isUsable(V.Phone.Owned[i], true)) {
                        V.Phone.Using = V.Phone.Owned[i].id;
                        break;
                    }
                }
            }
        } else {
            if (PhoneMod.isUsable(phone, true)) {
                V.Phone.Using = phone.id;
            } else {
                V.Phone.Using = null
            }
        }
        PhoneMod.msgShowLine();
    }
    return V.Phone.Using;
}
// === 手机电量与磨损 ====================================
PhoneMod.PhoneConsumption = function(value) {
    AsAPI.log("SmartPhone", `电量损耗: ${value}`);
    
    const phone = PhoneMod.getUsingPhone()
    if (phone && phone.newness > 0) {
        phone.newness = Math.round(phone.newness - value);
        if (phone.newness === 0) {
            phone.newness = -1
        }
        return PhoneMod.PhoneCheckNewness()
    }
    return false
}
PhoneMod.PhoneCharge = function(value, phone = null) {
    if (!phone) {phone = PhoneMod.getUsingPhone()}
    const newness = Math.round(phone.newness + value)
    const wear = Math.round(Math.max(newness - phone.newnessmax, 0) * PhoneMod.充电损害每度电比)
    PhoneMod.PhoneWaer(wear, phone)  // 损耗手机：过度充电
    phone.newness = Math.min(newness, phone.newnessmax);
    return wear
}
PhoneMod.PhoneWaer = function(value, phone = null, check = true) {
    if (!phone) {phone = PhoneMod.getUsingPhone()}
    if (value <= 0) return;
    phone.newnessmax = Math.max(Math.round(phone.newnessmax - value), 0);
    if (phone === PhoneMod.getUsingPhone()) {
        AsAPI.addStoryCaptionContent(`<span class="red">+${value}手机损耗</span>`); 
        if (check) {
            return PhoneMod.PhoneCheckNewness()
        } else {
            return null
        }
    } else {
        return null
    }
}
PhoneMod.PhoneCheckNewness = function () {
    const phone = PhoneMod.getUsingPhone()
    if (phone.newnessmax <= 0) {
        phone.newnessmax = 0;
        if (!PhoneMod.changeUsingPhone()) {
            PhoneMod.PhoneSafeClose()
            AsAPI.addStoryCaptionContent("<span class='red'>你当前使用的手机已经损坏，无法继续使用了。<br>你的口袋里没有另外一部能够使用的手机了。</span>"); 
            return false;
        } else {
            PhoneMod.PhoneUIInit()
            AsAPI.addStoryCaptionContent("<span class='red'>你当前使用的手机已经损坏，无法继续使用了。<br>你从口袋里找到了另外一部能够使用的手机作为替换。</span>"); 
            return true;
        }
    }
    if (phone.newness < 0) {
        phone.newness = 0;
        PhoneMod.PhoneWaer(50, null, false)  // 损耗手机：强制关机
        PhoneMod.changeUsingPhone()
        PhoneMod.PhoneUIInit()
        if (PhoneMod.getUsingPhone().newness === 0) {
            AsAPI.addStoryCaptionContent("<span class='red'>你当前使用的手机已经没电导致关机，无法继续使用了。<br>你的口袋里没有另外一部能够使用的手机了。</span>"); 
            return false;
        } else {
            AsAPI.addStoryCaptionContent("<span class='red'>你当前使用的手机已经没电导致关机，无法继续使用了。<br>你从口袋里找到了另外一部能够使用的手机作为替换。</span>"); 
            return true;
        }
    }
    return true;
}
PhoneMod.PhoneChargeUnguarded = function(position) {
    const phone = PhoneMod.getUsingPhone()
    V.Phone.Charger[position] = {
        phone: phone,
        date: Time.date,
        started: Time.date
    }
    V.Phone.Owned = V.Phone.Owned.filter(_phone => _phone !== phone)
    PhoneMod.changeUsingPhone()
}
PhoneMod.PhoneChargeUnguardedFinish = function(position) {
    const phone = V.Phone.Charger[position].phone
    V.Phone.Owned.push(phone)
    PhoneMod.changeUsingPhone(phone)
    delete V.Phone.Charger[position]
}
PhoneMod.isPhoneChargeUnguardedIn = function(position, apply=false) {
    if (Time === undefined) return;
    if (V.Phone.Charger.hasOwnProperty(position)) {
        if (apply) {
            const phone = V.Phone.Charger[position].phone
            
            const ageHours = (Time.date.timeStamp - V.Phone.Charger[position].date.timeStamp) / 3600; // 小时差
            const wear = PhoneMod.PhoneCharge(ageHours * PhoneMod.充电速度每小时, phone)
            
            V.Phone.Charger[position].date = Time.date
            
            const ageHoursFromStarted = (Time.date.timeStamp - V.Phone.Charger[position].started.timeStamp) / 3600; // 小时差
            const fromStartedText = AsAPI.getFriendlyTimeText(ageHoursFromStarted)

            var beenStolen = false;
            if (PhoneMod.手机充电中被盗地点.includes(position)) {
                if (position === "Library" && sydneySchedule() === undefined && T.sydney_location === "library") {
                } else {
                    beenStolen = Math.random() <= PhoneMod.手机充电中被盗概率;
                    if (beenStolen) delete V.Phone.Charger[position];
                }
            }

            return {phone: phone, hours: ageHours, fromStarted: ageHoursFromStarted, fromStartedText: fromStartedText, wear: wear, beenStolen: beenStolen}
        }
        
        return true
    }
    return false
}
PhoneMod.PhonePowerPass = function() {
    if (V.Phone.PowerPassLast) {
        const minutesPassed = (Time.date.timeStamp - V.Phone.PowerPassLast.timeStamp) / 60; // 分钟差
        AsAPI.log("SmartPhone", `自然电量损失: ${Time.date.timeStamp} - ${V.Phone.PowerPassLast.timeStamp} = ${minutesPassed * PhoneMod.自然电量损失每分钟}`);
        if (minutesPassed > 0) {
            PhoneMod.PhoneConsumption(minutesPassed * PhoneMod.自然电量损失每分钟);
        } else {
            return;
        }
        
        if (V.Phone.Charging && V.Phone.PowerBank.newness > 0) {
            const phone = PhoneMod.getUsingPhone();
            let chargingValue = minutesPassed * PhoneMod.充电宝充电每分钟;
            // 计算最低充电量（预计充电，手机剩余充电空间，充电宝剩余电量）
            chargingValue = Math.min(chargingValue, phone.newnessmax - phone.newness, V.Phone.PowerBank.newness);
            PhoneMod.PhoneCharge(chargingValue, phone);
            V.Phone.PowerBank.newness -= chargingValue;
            AsAPI.log("SmartPhone", `充电宝充电: ${chargingValue}`);
            if (V.Phone.PowerBank.newness <= 0) {
                PhoneMod.PhoneCharging(false, true);
            }
        }
    }
    V.Phone.PowerPassLast = Time.date;
}
// === 手机存放 ====================================
PhoneMod.PhoneStore = function(position, id) {
    const phone = PhoneMod.getPhone(id)
    V.Phone.Store[position] = V.Phone.Store[position] || {}
    V.Phone.Store[position][id] = phone
    V.Phone.Owned = V.Phone.Owned.filter(_phone => _phone !== phone)
    PhoneMod.changeUsingPhone()
}
PhoneMod.PhoneStoreFinish = function(position, id) {
    const phone = V.Phone.Store[position][id]
    V.Phone.Owned.push(phone)
    PhoneMod.changeUsingPhone(phone)
    delete V.Phone.Store[position][id]
    if (Object.keys(V.Phone.Store[position]).length === 0) {
        delete V.Phone.Store[position]
    }
}
PhoneMod.isPhoneStoreIn = function(position) {
    return V.Phone.Store.hasOwnProperty(position)
}
PhoneMod.getPhonesStoreIn = function(position) {
    return V.Phone.Store[position] ?? []
}
// === 手机抬起 ===================================
PhoneMod.PhoneLiftInit = function() {
    const phonescreenlocked = document.getElementById("smart-phone-container");
    const phonestoolbar = document.getElementById("smart-phone-toolbar");
    if (phonescreenlocked) {
        PhoneMod.startY = 0;
        const threshold = 50; // 滑动距离阈值
        const thresholdontrigger = 20; // 触发距离
        
        const start = function(event) {
            if (T.phoneopen) return;
            event.preventDefault();
            T.PhoneTool = false;
            T.PhoneDragging = true;
            PhoneMod.startY = event.touches ? event.touches[0].clientY : event.clientY;
            if (!event.touches) phonescreenlocked.style.transition = "none";
            phonestoolbar.style.transform = `translateY(calc(100% + 5px))`;
        };
        const move = function(event) {
            if (T.phoneopen) return;
            if (!T.PhoneDragging) return;
            event.preventDefault();
            PhoneMod.endY = event.touches ? event.touches[0].clientY : event.clientY;

            if (PhoneMod.startY - PhoneMod.endY > threshold) {
                phonescreenlocked.style.transform = `translateY(-${threshold+thresholdontrigger}px)`;
                if (!T.PhoneTool) {
                    T.PhoneTool = true;
                    phonestoolbar.style.transform = `translateY(80%)`;
                }
            } else {
                phonescreenlocked.style.transform = `translateY(${Math.min(0, PhoneMod.endY - PhoneMod.startY)}px)`;
                if (T.PhoneTool) {
                    T.PhoneTool = false;
                    phonestoolbar.style.transform = `translateY(calc(100% + 5px))`;
                }
            }
        };
        const end = function(event) {
            if (T.phoneopen) return;
            event.preventDefault();
            PhoneMod.endY = event.touches ? event.touches[0].clientY : event.clientY;
            T.PhoneDragging = false;
            phonescreenlocked.style.transition = "all 0.3s ease, background-color 0.4s ease";
            
            if (PhoneMod.startY - PhoneMod.endY > threshold) {
                phonestoolbar.style.transform = `translateY(0)`;
            } else {
                PhoneMod.togglePhone(true);
                phonescreenlocked.style.transform = `translateY(0px)`;
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
                phonescreenlocked.style.transition = "all 0.3s ease, background-color 0.4s ease";
                phonescreenlocked.style.transform = `translateY(0px)`;
                phonestoolbar.style.transform = `translateY(calc(100% + 20px))`;
            }
        }, false);
    }
}
// === 充电宝 =====================================
PhoneMod.GetPowerBank = function() {
    V.Phone.PowerBank = {
        newness: 10000,
        newnessmax: 10000
    }
}
PhoneMod.PowerBankChargeIn = function() {
    V.Phone.PowerBank.newness = V.Phone.PowerBank.newnessmax
}
PhoneMod.PhoneCharging = function(charging=true, batterysonly=false) {
    const line = document.getElementById("smart-phone-charge-line");
    const batterys = document.querySelectorAll("#battery");
    if (!(line && batterys)) return;
    if (charging) {
        if (batterysonly) {
            batterys.forEach(battery => battery.classList.add("battery_charge"));
            return;
        }
        V.Phone.Charging = true;
        line.classList.add("line-start")
        line.style.display = "block"
        line.style.transition = "transform 0.4s ease, opacity 0.4s ease"
        setTimeout(() => {
            line.classList.remove("line-start")
            setTimeout(() => {
                if (V.Phone.Charging) {
                    line.style.transition = "";
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
        line.style.transition = "transform 0.4s ease, opacity 0.4s ease"
        setTimeout(() => {
            line.classList.add("line-start")
            setTimeout(() => {
                if (!V.Phone.Charging) {
                    line.style.transition = "";
                    line.classList.remove("line-start")
                    line.style.display = "none"
                }
            }, 400)
        }, 10);
    }
}
PhoneMod.PhoneChargingInit = function() {
    const line = Array.prototype.slice.call(document.querySelectorAll("#smart-phone-charge-line"), -1)[0];
    const batterys = document.querySelectorAll("#battery");
    if (V.Phone.Charging) {
        if (V.Phone.PowerBank.newness > 0) {  // 充电宝有电才显示充电
            batterys.forEach(battery => battery.classList.add("battery_charge"))
        }
        line.style.display = "block"
    }
}
// === 日志 ==========================================
PhoneMod.showPhoneJournal = function() {  // 日志中显示手机信息
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
                <span style="margin-right: 20px"></span> <<link "全部关机">> <<run PhoneMod.phoneJournalChange(null)>> <</link>>
            `);
            Div.appendChild(Li);
            
            V.Phone.Owned.forEach(function(phone) {
                const Li = document.createElement("li");
                let info = PhoneMod.getPhoneConditionInfo(phone);
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
                        <<icon "phone/phone_forbid.png">>
                        <span class='red'>无法使用</span> | 
                    <<else>>
                        <<icon "phone/phone_disabled.png">> 
                        <<if ${phone.newnessmax > 0}>>
                            <<link "切换到">> <<run PhoneMod.phoneJournalChange("${phone.id}")>> <</link>> | 
                        <<elseif ${phone.newnessmax === 0}>>
                            <span class='red'>已损坏</span> |
                        <</if>>
                    <</if>>
                    <<if ${phone.newnessmax > 0}>>
                        <<if $Phone.Using and "${phone.id}" eq $Phone.Using and $Phone.Charging>>
                            <span style="background-color: green; border-radius: 3px;">[ ${PhoneMod.getPhoneBattery(phone)}% ]</span>
                        <<else>>
                            [ ${PhoneMod.getPhoneBattery(phone)}% ] 
                        <</if>>
                    <<else>>
                        [ --- ] 
                    <</if>>
                    一部${info.html}的 ${phone.model} ，官网售价为
                    <span class='gold'>£${Math.round(PhoneMod.getPhoneInfo(phone.model).price)}</span>。
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
                    <<icon "phone/power_bank.png">> <span class="yellow">持有充电宝</span> 
                    [ ${Math.round(V.Phone.PowerBank.newness / V.Phone.PowerBank.newnessmax * 100)}% ]
                    <<if ${V.Phone.PowerBank.newness > 0}>>
                        <<if ${PhoneMod.getUsingPhone() !== null}>>
                            <<if $Phone.Charging>>
                                <<link "停止为当前正在使用的手机充电">> <<run PhoneMod.PhoneCharging(false)>> <<run PhoneMod.phoneJournalChange()>> <</link>>
                            <<else>>
                                <<link "为当前正在使用的手机充电">> <<run PhoneMod.PhoneCharging(true)>> <<run PhoneMod.phoneJournalChange()>> <</link>>
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
        }}
};
PhoneMod.phoneJournalChange = function(id) { // 日志中更新手机信息
    if (id) {
        const phone = V.Phone.Owned.find(p => p.id === id);
        if (phone) {
            PhoneMod.changeUsingPhone(phone);
        }
        PhoneMod.PhoneUIInit();
    } else if (id === null) {
        PhoneMod.changeUsingPhone(null);
        PhoneMod.PhoneUIInit();
    }
    
    const Div = document.getElementById("phone-journal");
    if (Div) {
        Div.remove();
    }
    PhoneMod.showPhoneJournal();
}
PhoneMod.shutdown = function() { // 关机
    PhoneMod.confirm('确定要关机吗', '', () => {
        PhoneMod.togglePhone(false)
        PhoneMod.phoneJournalChange(null);
    })
}
// === 内容 ==========================================
PhoneMod.SchoolLockersSneakOnNPC = function(npc) {
    V.Phone.SchoolLockersSneakOnNPC = npc
}
PhoneMod.SchoolLockersSneakCondition = function() {
    switch (V.Phone.SchoolLockersSneakOnNPC) {
        case "Kylar":
            PhoneMod.eventsLoad_("School Lockers Sneak Kylar")
            break;
        case "Whitney":
            PhoneMod.eventsLoad_("School Lockers Sneak Whitney")
            break;
        case "Robin":
            PhoneMod.eventsLoad_("School Lockers Sneak Robin")
            break;
        case "Sydney":
            PhoneMod.eventsLoad_("School Lockers Sneak Sydney")
            break;
        default:
            return null;
    }
    delete V.Phone.SchoolLockersSneakOnNPC
    return false;
}