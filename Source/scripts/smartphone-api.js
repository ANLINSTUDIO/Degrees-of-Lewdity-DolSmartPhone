asi.log("SmartPhone", "正在加载：api.js");

/* AsAPI: Start @inject */
window.AsAPI = { ...window.AsAPI,  // inject
    // 【工具】注入游戏函数，在调用原函数后再执行指定的功能。
    onFunction: function(originalFn, afterFn) {
        return new Proxy(originalFn, {
            apply: function(target, thisArg, argumentsList) {
                // const result = target.apply(thisArg, argumentsList);
                afterFn(...argumentsList);
                return target.apply(thisArg, argumentsList);
            }
        });
    },
    // 【工具】注入游戏宏，在调用原宏后再执行指定的功能。
    onMacro: function(macroName, afterFn) {
        let originalMacro = Macro.get(macroName);
        if (originalMacro) {
            let oldHandler = originalMacro.handler;
            Macro.delete(macroName);
            Macro.add(macroName, {
                handler: function () {
                    oldHandler.apply(this, arguments);
                    afterFn.apply(this, arguments);
                }
            });
        }
    },
    // 【工具】自动处理函数和宏的注入，请使用of$和om$来进行使用，请确保与原函数或宏重名。
    autoinject(modnamespace, modname, modcolor = "green") {
        $(document).one(":passageinit", function () {
            asi.debug(modname, "开始自动注入函数和宏")
            const ns = window[modnamespace];
            if (!ns || typeof ns !== 'object') {
                asi.error(modname, `命名空间 ${modnamespace} 不存在，跳过注入`, modcolor);
                return;
            }
            asi.debug(modname, `命名空间 ${modnamespace} 检查通过，开始注入函数和宏` + ns);
            const keys = Object.keys(ns);
            keys.forEach(key => {
                asi.debug(modname, `检查 ${key} 是否需要注入`)
                // 自动处理 of$ 前缀：绑定到全局同名函数
                if (key.startsWith('of$')) {
                    const funcName = key.slice(3);
                    eval(`${funcName} = asi.onFunction(${funcName}, ${modnamespace}['of$${funcName}'])`);
                    asi.log(modname, `已注入 onFunction: ${funcName}`, modcolor);
                }
                // 自动处理 om$ 前缀：使用 onMacro 注入宏
                else if (key.startsWith('om$')) {
                    const macroName = key.slice(3);
                    asi.onMacro(macroName, ns[key]);
                    asi.log(modname, `已注入 onMacro: ${macroName}`, modcolor);
                }
            });
            asi.log(modname, `已自动完成所有函数和宏注入`, modcolor, "green");
        });
    },
}
/* AsAPI: End @inject */


// ==================== 这是提供给其他模块调用的API，工具函数 ====================
smartphone.actionsAdd = function(actionslot, actionName, actionColor, actionDefault=false) {  // 遭遇战选项增加API
  setTimeout(() => {
    const actions = document.querySelector(`#${actionslot}.radioControl`)
    if (actions) {
      const thirdChild = actions.children[2];  // 加载第二个子项的后面，因为第二个子项是第一个选项的位置，这个不会改变
      const newItem = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `radiobutton-${actionslot}`;
      newItem.appendChild(input);
      const span = document.createElement("span");
      span.classList.add(actionColor);
      span.textContent = ` ${actionName} `;
      newItem.appendChild(span);
      newItem.insertAdjacentHTML('beforeend', ' |&nbsp;');
      if (thirdChild) {
          actions.insertBefore(newItem, thirdChild);  // 在第三个子项之前插入，即第二个子项之后
      } else {
          actions.appendChild(newItem);  // 如果没有第三个子项，就追加到末尾
      }
      input.dataset.slot = actionslot;
      input.dataset.action = actionName;
      input.onclick = function() {
        V[this.dataset.slot] = this.dataset.action;
      }
      if (actionDefault) {
        input.checked = true;
        V[actionslot] = actionName;
      }
    }
  }, 10);
};
smartphone.reload = function(open=false) {
    if (asi.reload()) {
        if (open) {
            setTimeout(() => {
                if (smartphone.shouldUsePhone()) smartphone.togglePhone(true);
            }, 400);
        }
        return true;
    }
}

// ==================== 下面是关于手机使用的工具函数 ====================
smartphone.getIsLatestVersion = function() {
    asi.log("SmartPhone", `最新版本 ${smartphone.latestVersion}`);
    const isLatestVersion = smartphone.currentVersion === smartphone.latestVersion;
    return smartphone.latestVersion === null || isLatestVersion
};
smartphone.getAbsTime = function() {  // 获取当前时间的总分钟数（包括日期换算，用于精准闹钟对比）
    return {
        year: Time.date.year,
        day: Time.date.day,
        month: Time.date.month,
        weekDay: Time.date.weekDay,
        hour: Time.date.hour,
        minute: Time.date.minute
    };
};
smartphone.getTimeString = function() {
    if (typeof Time === 'undefined' || !Time.date) return "--:--";
    let h = Time.date.hour;
    let m = Time.date.minute;
    return h + ":" + (m < 10 ? "0" + m : m);
};
smartphone.getDateString = function() {
    if (typeof Time === 'undefined' || !Time.date) return "--------------";
    let m = Time.date.month;
    let d = Time.date.day;
    return Time.date.year + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
};
smartphone.shouldShowPhone = function() {  // 在某些页面不应当可以显示手机
    if (typeof V === 'undefined') return false;  // V是SugarCube的全局变量，包含了当前游戏状态的各种信息，如果没有定义，说明可能不在游戏环境中，不显示手机
    if (!V.passage) return false;  // 没有当前页面信息，不显示手机
    if (V.passage === "Start") return true;  // 在这些特定页面显示手机，如主菜单

    // 检查是否有可用的手机
    return smartphone.isCarryingUsablePhone()
};
smartphone.shouldUsePhone = function() { // 在某些页面不应当可以操控手机
    if (!V.passage) return false;  // 没有当前页面信息，不显示手机
    if (V.passage === "Start") return true;  // 在这些特定页面显示手机，如主菜单
    if (V.Phone.TakingPhotoWill) return true;  // 
    if (V.Phone.PhotoCurrent) return true;  // 
    if (V.Phone.AlarmTriggered) return true;  // 
    if (V.combat === 1) return false;  // 战斗中不可以操控手机
    if (V.Phone.ReturnPassage) {
        if (V.passage.startsWith("Phone ")) {
            V.location = "phone";
            return false;  // 如果正在从手机界面操作进入APP，不应当可以操控手机，避免重复打开手机界面
        } else {
            if (V.Phone.ReturnPassage !== V.passage) {  // 如果正在从手机界面操作进入APP，自动Back回去，避免重复打开手机界面（经反馈，多人出现没有成功PhoneBack的问题，这里通过检测段落名是否以Phone开头，自动Back）
                smartphone.PhoneBack();   // 经反馈，多人出现没有成功PhoneBack的问题，这里通过检测段落名是否以Phone开头，自动Back
            }
        }
    }
    if (V.Phone.Using === "null") return false;  // 关机
    const phone = smartphone.getPhone(V.Phone.Using)
    if (phone && phone.newness > 0) return true;  // 检查是否有可用的手机
    return false;
};
smartphone.PhoneTo = function() {
    if (!V.Phone.ReturnPassage) {
        V.Phone.ReturnPassage = V.passage;
        V.Phone.ReturnOutside = V.outside;
        V.Phone.ReturnLocation = V.location;
    }
    V.location = "phone";
}
smartphone.PhoneBack = function() {
    if (V.Phone.ReturnLocation) {
        const passage = V.Phone.ReturnPassage
        V.outside = V.Phone.ReturnOutside;
        V.location = V.Phone.ReturnLocation;
        delete V.Phone.ReturnPassage;
        delete V.Phone.ReturnOutside;
        delete V.Phone.ReturnLocation;
        return passage
    } 
    return V.safePassage  // 没有passage保存
}
smartphone.setPhoneBeating = function(shouldBeat) {
    const phoneContainer = document.getElementById('smart-phone-container');
    
    if (shouldBeat) {
        phoneContainer.classList.add('beating');
    } else {
        phoneContainer.classList.remove('beating');
    }
}
smartphone.getPhone = function(id) {
    if (!V.Phone.Owned) return null;
    return V.Phone.Owned.find(p => p.id === id) || null;
}
smartphone.generatePassward = function() {
    const chars = '0123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
smartphone.getPhoneInfo = function(id_or_model = null) {
    if (id_or_model === null) {
        id_or_model = smartphone.getUsingPhone().model
    }
    if (smartphone.PhoneModels.hasOwnProperty(id_or_model)) {
        return smartphone.PhoneModels[id_or_model]
    }
    const index = V.Phone.Owned.findIndex(p => p.id === id_or_model);
    if (index >= 0) {
        return smartphone.PhoneModels[V.Phone.Owned[index].model]
    }
    return null
}
smartphone.getPhoneConditionInfo = function(phone_or_condition) {
    let condition = -1
    if (typeof phone_or_condition === "number") {
        condition = phone_or_condition
    } else {
        if (phone_or_condition === undefined) {
            phone_or_condition = smartphone.getUsingPhone()
        }
        condition = Math.max(0, Math.min(1, phone_or_condition.newnessmax / smartphone.getPhoneInfo(phone_or_condition.model).newnessfactory)); // 限制在0-1范围内
    }

    let info = {
        text: "看不出情况",
        color: "#9E9E9E",
        value: condition,
        percentage: Math.round(condition * 100),
        percent_text: "看不出情况"
    }

    const percent = Math.round(condition*10)
    let percent_text = "看不出情况"
    if (percent === 10) { percent_text = "全新"} 
    else if (percent === 0) { percent_text = "全损"} 
    else {percent_text = percent+'成新'}
    info["percent_text"] = percent_text
    
    for (let level of smartphone.phoneConditionLevels) {
        if (condition >= level.threshold) {
            info["text"] = level.text
            info["color"] = level.color
            break
        }
    }

    info["html"] = `<span style="color: ${info["color"]}">${info["text"]}</span>`
    
    return info;
}
smartphone.getPhoneBattery = function(phone) {
    phone = phone ?? smartphone.getUsingPhone()
    if (phone && phone.newnessmax > 0 && phone.newness >= 0) {
        return Math.max(Math.round((phone.newness / phone.newnessmax) * 100), 1)
    } else {
        return null
    }
}
smartphone.getSellPhonePrice = function(id, feng=false) { // 出售手机
    if (!V.Phone.Owned) return;
    const index = V.Phone.Owned.findIndex(p => p.id === id);
    if (index !== -1) {
        const phone = V.Phone.Owned[index];
        let price = smartphone.getPhoneInfo(phone.model).price;
        if (feng) {
            price *= 0.8
        };
        if (phone.newnessmax != smartphone.getPhoneInfo(id).newnessfactory) {
            price *= phone.newnessmax / smartphone.getPhoneInfo(id).newnessfactory * 0.5; // 根据新旧程度调整价格
        };
        return Math.floor(Math.max(price, 1)); // 最低售价为1
    }
}
smartphone.getRepairPhonePrice = function(id) { // 出售手机
    if (!V.Phone.Owned) return;
    const index = V.Phone.Owned.findIndex(p => p.id === id);
    if (index !== -1) {
        const phone = V.Phone.Owned[index];
        const wear = smartphone.getPhoneInfo(id).newnessfactory - phone.newnessmax

        let price = smartphone.getPhoneInfo(phone.model).price;
        price *= wear / smartphone.getPhoneInfo(id).newnessfactory; // 根据新旧程度调整价格
        price = Math.floor(price)
        return Math.floor(Math.max(price, 5)); // 最低修复价为5
    }
}
smartphone.getUsingPhone = function(allow_shutdown=false) {  // 获取正在使用的手机
    if (!V.Phone.Using || V.Phone.Using === "null") {
        if (allow_shutdown) {
            return V.Phone.Owned.find(p => p.usable) || null;
        }
        return null;
    }
    return smartphone.getPhone(V.Phone.Using);
}
smartphone.isCarryingUsablePhone = function() { // 检查是否携带可用的（包括没电关机的）手机
    if (V.Phone && V.Phone.Owned && Array.isArray(V.Phone.Owned)) {
        return V.Phone.Owned.some(phone => phone.usable && phone.newnessmax > 0);
    }
    return false;
}
smartphone.isCarryingStolenPhone = function(useableFilter=false) { // 检查是否携带盗窃来的手机
  if (!V.Phone.Owned) return false;
  for (let i = 0; i < V.Phone.Owned.length; i++) {
    if (V.Phone.Owned[i].stolen && (!useableFilter || !smartphone.isUsable(V.Phone.Owned[i], true))) return true;
  }
  return false;
}
smartphone.isUsable = function(phone, allow_shutdown=false) { // 检查是否有可用的手机
    if (allow_shutdown) {
        return phone && phone.usable && phone.newnessmax > 0;
    }
    return phone && phone.usable && phone.newness > 0 && phone.newnessmax > 0;
}
smartphone.installApp = function(appid) {
    V.Phone.LockedApps.push(appid)
    return smartphone.Apps[appid];
}
smartphone.uninstallApp = function(appid) {
    if (smartphone.appIsInstalled(appid)) {
        V.Phone.LockedApps.filter(i => i != appid);
        return true
    } else {
        return false
    }
}
smartphone.appIsInstalled = function(appid) {
    if (V.Phone.LockedApps.includes(appid)) {
        return true
    } else {
        return false
    }
}
smartphone.confirm = function(title, msg, func) {
    T.dialog_func = func
    new Wikifier(document.querySelector("#smart-phone-container"), `<<phone_dialog ${JSON.stringify(title)} ${JSON.stringify(msg)}>>`)
}
smartphone.repairPhone = function(phone) {
    phone.newnessmax = smartphone.getPhoneInfo(phone.model).newnessfactory * 0.9
}

// ==================== 下面是关于玩家的工具函数 ====================
smartphone.AddClothToPlayer = function(cloth, color="black", type="face") {
    const item = setup.clothes[type].find(item => item.name === cloth);
    if (item) {
        const newItem = structuredClone(item);
        newItem.integrity = newItem.integrity_max;
        newItem.colour = color;
        if (V.worn[type].name === "naked") {
            V.worn[type] = newItem;
            return true;
        } else {
            V.wardrobe[type].push(newItem);
            return false;
        }
    }
}
smartphone.getFaceVariant = function(value) {
    return Object.keys(setup.faceVariantOptions.default).find(key => setup.faceVariantOptions.default[key] === value);
}
smartphone.shuffle = function(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
smartphone.getStarRating = function(value) {
    const fullStars = Math.floor(value / 20);
    const emptyStars = value % 20 > 0 ? 1 : 0;
    let stars = '★'.repeat(fullStars);
    if (emptyStars) {
        stars += '☆';
    }
    return stars;
}
smartphone.haveSexPhotoInPhone = function() {
    for (let photo in V.Phone.Album) {
        const task = smartphone.PhonePhotos[photo]
        for (let index = 0; index < task.fames.length; index++) {
            if (["bestiality", "exhibitionism", "impreg", "pimp", "pregnancy", "prostitution", "rape", "sex"].contains(task.fames[index])) {
                return true
            }
        }
    }
    return false
}
