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
    V.Phone.SydneySexLiveCompanion = V.Phone.SydneySexLiveCompanion ?? 0;
    PhoneMod.patchTV("Phone.SydneySexPhoto", "Phone.SydneySexLiveCompanion");

    // 3.4 | 手机存储
    V.Phone.Store = V.Phone.Store || {};

    // 3.7 | 关闭通知
    V.Phone.Settings.NotificationClose = V.Phone.Settings.NotificationClose || false;

    // 3.8 | 解锁APP
    V.Phone.LockedApps = V.Phone.LockedApps || [];
    // 3.8 | 删除非主要区域和事件中不能使用手机的设定
    delete V.Phone.Settings.CanUsePhoneInAllAreas;
    delete V.Phone.Settings.CanUsePhoneInEvent;
    V.Phone.RecipesLearning = V.Phone.RecipesLearning || {};

    // 3.81 | 增加自定义手机显示大小
    V.Phone.Settings.Scale = V.Phone.Settings.Scale ?? 1.0

    // 3.82 | 小黄书用户集成
    V.Phone.YenoteUsers = {
        // "识别ID": ["用户名", "头像"]
        // 此值将随着剧情的更改而修改，比如与某个Li成为恋人后，Ta可能改为 xxx超爱xxx 之类的
        "{PC}": ["{PC}", "{PC}"],
        "A": ["𝑨", "img/misc/icon/phone/avatar/A.png"],
        "Landry": ["BLACK MARKETEER", "img/misc/icon/phone/avatar/landry0.png"],
    }
    // 3.82 | Landry发文
    PhoneMod.yenoteNPCPost({
        id: "Landry-AD0",
        name: "Landry",
        msg: "回收旧手机、旧冰箱、旧空调、旧电脑，收旧洗衣机、旧电动车、摩托车、自行车、收报纸、废品",
        attarct: 2.0,
    })
    PhoneMod.yenoteNPCPost({
        id: "A-Update382",
        name: "A",
        msg: "哈喽哈喽，感谢各位的支持呀！<br>给大家放一张之前没有用到的摄像图片当做福利啦！<br>如果你看不到的话，那就是没有使用最新的图包哦！",
        img: "img/photo/submission-1772783983529-h.png",
        price: 52,
        attarct: 10.0,
    })
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
        AsAPI.log("SmartPhone", `Patch：变量转移成功: ${oldPath} -> ${newPath}`);
        return true;
    }
    
    return false;
};