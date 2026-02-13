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
    if (["Start", "Start2", "Main Menu", "Credits"].includes(V.passage)) return false;  // 在这些特定页面不显示手机，如主菜单

    // 检查是否有可用的手机
    if (!V.PhoneOwned || V.PhoneOwned.length < 1) return false;  // 没有手机，不显示

    return true;
};
PhoneMod.shouldUsePhone = function() { // 在某些页面不应当可以操控手机
    if (V.combat === 1) return false;  // 战斗中不可以操控手机
    if (V.event) return false;  // 活动中不可以操控手机
    if (V.phoneReturnPassage) return false;  // 如果正在从手机界面操作进入APP，不应当可以操控手机，避免重复打开手机界面
    if (!PhoneMod.extraShowPhoneAreas.includes(V.passage)) return false;  // 在非主要区域操控手机可能会破坏存档

    // 检查是否有可用的手机
    if (V.PhoneOwned) {
      for (var i = 0; i < V.PhoneOwned.length; i++) {
        if (V.PhoneOwned[i].usable) return true;
      }}
    return false;
};
PhoneMod.PhoneTo =  function() {
    if (!V.phoneReturnPassage) {
        V.phoneReturnPassage = passage()
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

PhoneMod.shuffle = function(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}