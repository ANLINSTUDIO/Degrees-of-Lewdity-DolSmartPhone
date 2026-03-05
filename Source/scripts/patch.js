window.PhoneMod = window.PhoneMod || {};

$(document).on(":passagerender", function (ev) {PhoneMod.patchOnPassageRender(ev)});
PhoneMod.patchOnPassageRender = function (ev) {
    V.Phone = V.Phone || {};
    V.Phone.Owned = V.Phone.Owned || [];
    V.Phone.Album = V.Phone.Album || {};
    V.Phone.Yenotes = V.Phone.Yenotes || [];
    V.Phone.AlarmsToTrigger = V.Phone.AlarmsToTrigger || [];
    V.Phone.KnownContacts = V.Phone.KnownContacts || [];
    V.Phone.Memos = V.Phone.Memos || {};
    V.Phone.Settings = V.Phone.Settings || {};
    V.Phone.photography = V.Phone.photography || 0;
    V.Phone.CurrentApp = V.Phone.CurrentApp || "main";
    V.Phone.Guide = V.Phone.Guide || [];

    // 2.95 | 设置变量迁移
    PhoneMod.patchTV("Phone.SettingsWallpaperPath", "Phone.Settings.WallpaperPath");
    PhoneMod.patchTV("Phone.SettingsWallpaperBlur", "Phone.Settings.WallpaperBlur");
    PhoneMod.patchTV("Phone.SettingsWallpaperBlack", "Phone.Settings.WallpaperBlack");

    // 3.2 | 手机更新型号、电池充电系统更新
    V.Phone.Owned.forEach(phone => {
        if (!phone.hasOwnProperty("newnessmax")) {
            phone.model = "斯达特3 限量型"
            phone.newnessmax = PhoneMod.PhoneModels["斯达特3 限量型"].newnessfactory;
            phone.newness = Math.round(phone.newness * phone.newnessmax)
        }
    });
    if (!V.Phone.SecondPhoneShopGoods) PhoneMod.RefreshSecondPhone();
    V.Phone.Charger = V.Phone.Charger || {};

    // 3.3 | 修复信息列队
    V.Phone.msgLine = V.Phone.msgLine || [];
    // 3.3 | 悉尼色播伴侣
    V.SydneySexLiveCompanion = 0
    if ("SydneySexPhoto" in V.Phone) V.Phone.SydneySexLiveCompanion = V.Phone.SydneySexPhoto  // 变量迁移

    // 3.4 | 手机存储
    V.Phone.Store = V.Phone.Store || {};

    // 3.7 | 关闭通知
    V.Phone.Settings.NotificationClose = V.Phone.Settings.NotificationClose || false;
}

PhoneMod.patchTV = PhoneMod.patchTransferVariables = function(oldPath, newPath) {
    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    };
    
    const setNestedValue = (obj, path, value) => {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    };
    
    const deleteNested = (obj, path) => {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => current?.[key], obj);
        if (target) {
            delete target[lastKey];
        }
    };
    
    // 从 V 对象开始查找
    const oldValue = getNestedValue(V, oldPath);
    
    if (oldValue !== undefined) {
        setNestedValue(V, newPath, oldValue);
        deleteNested(V, oldPath);
        console.log(`| [SmartPhone] Patch：变量转移成功: ${oldPath} -> ${newPath}`);
        return true;
    }
    
    return false;
};