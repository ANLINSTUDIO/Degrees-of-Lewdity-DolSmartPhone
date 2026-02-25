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

    PhoneMod.patchTV("Phone.SettingsWallpaperPath", "Phone.Settings.WallpaperPath");
    PhoneMod.patchTV("Phone.SettingsWallpaperBlur", "Phone.Settings.WallpaperBlur");
    PhoneMod.patchTV("Phone.SettingsWallpaperBlack", "Phone.Settings.WallpaperBlack");
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