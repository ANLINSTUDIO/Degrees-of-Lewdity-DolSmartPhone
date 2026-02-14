window.PhoneMod = window.PhoneMod || {};

// ==================== 这是提供给其他模块调用的API，工具函数 ====================
PhoneMod.OnMacro = function(name, func) {
  let originalMacro = Macro.get(name);
    if (originalMacro) {
        let oldHandler = originalMacro.handler;
        Macro.delete(name);
        Macro.add(name, {
            handler: function () {
                oldHandler.apply(this, arguments);
                setTimeout(func, 50);
            }
        });
    }
}
PhoneMod.actionsAdd = function(actionslot, actionName, actionColor, actionDefault=false) {  // 遭遇战选项增加API
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
PhoneMod.addStoryCaptionContent = function(content) {
    setTimeout(() => {
        const container = document.getElementById("storyCaptionContent");
        if (container) {
            // 插入在第一个位置
            const newCaption = document.createElement("div");
            newCaption.innerHTML = content + "<br>";
            container.insertAdjacentElement('afterbegin', newCaption);
        }
        document.getElementById("ui-bar").classList.remove("stowed");
    }, 10);
}

// ==================== 下面是关于手机使用的工具函数 ====================
// 获取当前时间的总分钟数（包括日期换算，用于精准闹钟对比）
PhoneMod.getAbsTime = function() {
    return {
        year: Time.date.year,
        day: Time.date.day,
        month: Time.date.month,
        weekDay: Time.date.weekDay,
        hour: Time.date.hour,
        minute: Time.date.minute
    };
};
PhoneMod.getTimeString = function() {
    if (typeof Time === 'undefined' || !Time.date) return "--:--";
    let h = Time.date.hour;
    let m = Time.date.minute;
    return h + ":" + (m < 10 ? "0" + m : m);
};
PhoneMod.getDateString = function() {
    if (typeof Time === 'undefined' || !Time.date) return "--------------";
    let m = Time.date.month;
    let d = Time.date.day;
    return Time.date.year + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
};
PhoneMod.shouldShowPhone = function() {  // 在某些页面不应当可以显示手机
    if (typeof V === 'undefined') return false;  // V是SugarCube的全局变量，包含了当前游戏状态的各种信息，如果没有定义，说明可能不在游戏环境中，不显示手机
    if (!V.passage) return false;  // 没有当前页面信息，不显示手机
    if (V.passage === "Start") return true;  // 在这些特定页面显示手机，如主菜单

    // 检查是否有可用的手机
    if (!V.Phone.Owned || V.Phone.Owned.length < 1) return false;  // 没有手机，不显示

    return true;
};
PhoneMod.shouldUsePhone = function() { // 在某些页面不应当可以操控手机
    if (V.combat === 1) return false;  // 战斗中不可以操控手机
    if (V.event) return false;  // 活动中不可以操控手机
    if (V.Phone.ReturnPassage) return false;  // 如果正在从手机界面操作进入APP，不应当可以操控手机，避免重复打开手机界面
    let extraShowPhoneAreas = PhoneMod.extraShowPhoneAreas.slice();
    extraShowPhoneAreas.push(...setup.majorAreas);  // 主要区域也应该可以操控手机
    if (!extraShowPhoneAreas.includes(V.passage)) return false;  // 在非主要区域和额外指定区域操控手机可能会破坏存档

    if (V.Phone.Using) return true;  // 检查是否有可用的手机
    return false;
};
PhoneMod.PhoneTo =  function() {
    if (!V.Phone.ReturnPassage) {
        V.Phone.ReturnPassage = passage()
    }
}
PhoneMod.getPhoneConditionInfo = function(condition) {
    condition = Math.max(0, Math.min(1, condition)); // 限制在0-1范围内
    for (let level of PhoneMod.phoneConditionLevels) {
        if (condition >= level.threshold) {
            return {
                text: level.text,
                color: level.color,
                value: condition,
                percentage: Math.round(condition * 100)
            };
        }
    }
    
    return {
        text: "看不出情况",
        color: "#9E9E9E",
        value: condition,
        percentage: Math.round(condition * 100)
    };
}

PhoneMod.AddClothToPlayer = function(cloth, color="black") {
    const item = setup.clothes.face.find(item => item.name === cloth);
    if (item) {
        const newItem = structuredClone(item);
        newItem.integrity = newItem.integrity_max;
        newItem.colour = color;
        if (V.worn.face.name === "naked") {
            V.worn.face = newItem;
            return true;
        } else {
            V.wardrobe.face.push(newItem);
            return false;
        }
    }
}

PhoneMod.shuffle = function(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}