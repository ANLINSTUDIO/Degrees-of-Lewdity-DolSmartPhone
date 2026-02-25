console.log("| [SmartPhone] DoL万能的智能手机 正在加载：main.js");


// ================== passage 注入 ==================
$(document).one(":passageinit", function () {
    PhoneMod.events_on_macro.forEach(function(event) {
        PhoneMod.onMacro(event.macro, PhoneMod[event.func])
    })
});
$(document).on(":passagerender", function (ev) {PhoneMod.onPassageRender(ev)});
PhoneMod.onPassageRender = function (ev) {
    PhoneMod.ev = ev
    V.Phone.open = false
    V.Phone.havingOrgasm = false
    delete V.Phone.yenotePosting

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
}
PhoneMod.eventsLoad = function() {
    PhoneMod.events.forEach(function(event) {
        if (V.passage === event.passage) {
        if (event.chance === undefined || Math.random() < event.chance) {
            if (event.goto === true) {
                new Wikifier(null, `<<goto "${event.event}">>`);
            } else {
                PhoneMod.eventsLoadInclude_(event.target, event.event, event.position, event.offset)
            }
            if (event.replace_target) {
                PhoneMod.eventsLoadInclude_(event.replace_target, event.replace_event, "replace", 0)
            }
    }}})
}
PhoneMod.eventsLoadInclude_ = function(data_passage, include, position, offset) {
    const $target = $(PhoneMod.ev.content).find(`a[data-passage="${data_passage}"]`);
    if ($target.length > 0) {
        const Div = document.createElement("div");
        Div.style.display = "inline";
        new Wikifier(Div, `<<include "${include}">>`);
        if (position === "replace") {
            $target.first().replaceWith(Div);
        } else{
            PhoneMod.eventsLoadInsert_($target, Div, position, offset ?? 0)
        }
    }
}
PhoneMod.eventsLoadInsert_ = function(target, insert_target, position, offset) {
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
                phone.classList.add("phone-disabled");
            }
        }
    }, 10)
}
PhoneMod.togglePhone = function(force=null) {
    const phone = document.getElementById("smart-phone-container");
    if (!phone) return;

    if (force === true) {
        phone.classList.add("phone-open");
        V.Phone.open = true
    }
    else if (force === false) {
        phone.classList.remove("phone-open");
        V.Phone.open = false
    } else {

        if (V.Phone.PhotoCurrent) {  // 在触发任务时点击
            phone.classList.remove("phone-open");
            V.Phone.open = false
            PhoneMod.photoFinish();
            PhoneMod.toggleApp("main", false);
            return;
        }

        if (PhoneMod.shouldUsePhone() || V.Phone.TakingPhotoWill) {
            phone.classList.toggle("phone-open");
            V.Phone.open = phone.classList.contains("phone-open");
        } else {
            phone.classList.remove("phone-open");
            V.Phone.open = false
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
    if (!PhoneMod.PhoneWaer(0.001)) return;
    V.Phone.CurrentApp = AppName;
    PhoneMod.PhoneUIInit(open);
    PhoneMod.appInit();
};
PhoneMod.appInit = function(togglePhone=false){
    const AppName = V.Phone.CurrentApp
    const app = PhoneMod.Apps[AppName]
    if (!V.Phone.AlarmTriggered && app) {
        if (app.guide) {
            PhoneMod.Guide.startTutorial(app.guide);
        }
        if (togglePhone) {
            if (app.toggle) {
                PhoneMod[app.toggle](V.Phone.open)
            }
        } else {
            if (app.init) {
                PhoneMod[app.init]()
            }
        }
    }
    if (V.Phone.MsgApp && V.Phone.open && V.Phone.MsgApp === AppName) {
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
    } else {
        console.log("SafeCloseError");
    }
};
PhoneMod.PhoneWaer = function(value) {
    PhoneMod.getUsingPhone().newness = round(PhoneMod.getUsingPhone().newness - value, 4);
    return PhoneMod.PhoneCheckNewness()
}
PhoneMod.PhoneCheckNewness = function () {
    if (PhoneMod.getUsingPhone().newness <= 0) {
        PhoneMod.getUsingPhone().newness = 0;
        if (!PhoneMod.changeUsingPhone()) {
            PhoneMod.PhoneSafeClose()
            PhoneMod.addStoryCaptionContent("<span class='red'>你当前使用的手机已经损坏，无法继续使用了。<br>你的口袋里没有另外一部能够使用的手机了。</span>"); 
            return false;
        } else {
            PhoneMod.addStoryCaptionContent("<span class='red'>你当前使用的手机已经损坏，无法继续使用了。<br>你从口袋里找到了另外一部能够使用的手机作为替换。</span>"); 
            return true;
        }
    }
    return true;
}


// =================== 弹窗信息 =====================
PhoneMod.msgSend = function (msg, app=null, func=null) {
    const phone_popup = document.querySelector(".phone-popup")
    if (phone_popup) {
        const phone_popup_content = phone_popup.querySelector(".phone-popup-content")
        new Wikifier(phone_popup_content, `${phone_popup_content.innerHTML? '<br>': ''}${msg}`);
        phone_popup.classList.add("active")
        V.Phone.MsgApp = app
        V.Phone.MsgFunc = func
    }
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
PhoneMod.DebugShowMsg = function(content) {
    const phoneDebugUI = document.getElementById("smart-phone-debug-container")
    if (phoneDebugUI) {
        const element = document.createElement("div")
        element.class = "red"
        element.innerHTML = content + "<br>"
        phoneDebugUI.insertAdjacentElement('afterbegin', element);
        phoneDebugUI.scrollTo(0, 0)
    }
}
PhoneMod.DebugExcuteJs = function() {
    setTimeout(() => {
        const input = document.getElementById("excute-js")
        if (input) {
            const command = input.value
            if (command) {
                PhoneMod.DebugShowMsg(eval(command))
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
            let path = "null"
            if (path_input && path_input.value) {
                path = `document.querySelector("${path_input.value}")`
            }
            if (command) {
                PhoneMod.DebugShowMsg(eval(`new wikifier(${path}, "${command}")`))
            }
        }
    }, 1)
}


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
    this.newBuy(price)
    this.newness = newness
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
  V.Phone.Owned.push(new PhoneMod.Phone().newBuy(price));
  PhoneMod.changeUsingPhone();
}
PhoneMod.BuySecondPhone = function(price, newness) { // 购买一部二手手机
  V.Phone.Owned.push(new PhoneMod.Phone().newBuySecond(price, newness));
  PhoneMod.changeUsingPhone();
}
PhoneMod.StolePhone = function() { // 盗窃一部手机
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
        PhoneMod.changeUsingPhone();
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
PhoneMod.changeUsingPhone = function(phone=null) { // 切换正在使用的手机
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
            new Wikifier(Li, `<<icon "phone/phones.png">> <span class="yellow">持有的手机</span>。可以出售给手机店。`);
            Div.appendChild(Li);
            
            V.Phone.Owned.forEach(function(phone) {
                const Li = document.createElement("li");
                let info = PhoneMod.getPhoneConditionInfo(phone.newness);
                new Wikifier(Li, `
                    <span style="margin-right: 50px"></span>
                    <<if $Phone.Using and "${phone.id}" eq $Phone.Using>>
                        <<icon "phone/phone.png">>
                        <span class='teal'>正在使用</span> | 
                    <<elseif ${phone.stolen && !phone.usable}>>
                        <<icon "phone/phone_forbid.png">>
                    <<else>>
                        <<icon "phone/phone_disabled.png">> 
                        <<if ${phone.newness > 0}>>
                            <<link "切换到">> <<run PhoneMod.phoneJournalChange("${phone.id}")>> <</link>> | 
                        <<else>>
                            <span class='red'>已损坏</span> |
                        <</if>>
                    <</if>>
                    一部
                    <span class='${info.color}'>${info.text}</span>
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
PhoneMod.phoneJournalChange = function(id) { // 日志中更新手机信息
    const phone = V.Phone.Owned.find(p => p.id === id);
    if (phone) {
        PhoneMod.changeUsingPhone(phone);
    }
    const Div = document.getElementById("phone-journal");
    if (Div) {
        Div.remove();
        PhoneMod.showPhoneJournal();
    }
}
