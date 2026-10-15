$(document).on(":passagerender", function (ev) {smartphone.patchOnPassageRender(ev)});
smartphone.patchOnPassageRender = function (ev) {
    V.Phone = V.Phone || {};
    V.Phone.Owned = V.Phone.Owned || [];
    V.Phone.Album = V.Phone.Album || {};
    V.Phone.Yenotes = V.Phone.Yenotes || [];
    V.Phone.AlarmsToTrigger = V.Phone.AlarmsToTrigger || [];
    V.Phone.KnownContacts = V.Phone.KnownContacts || [];
    V.Phone.Settings = V.Phone.Settings || {};
    V.Phone.photography = V.Phone.photography || 0;
    V.Phone.CurrentApp = V.Phone.CurrentApp || "main";

    // 悉尼色播伴侣
    V.Phone.SydneySexLiveCompanion = V.Phone.SydneySexLiveCompanion ?? 0;
    // 关闭通知
    V.Phone.Settings.NotificationClose = V.Phone.Settings.NotificationClose || false;
    // 解锁APP
    V.Phone.LockedApps = V.Phone.LockedApps || [];
    // 美食屋
    V.Phone.RecipesLearning = V.Phone.RecipesLearning || {};
    // 增加自定义手机显示大小
    V.Phone.Settings.Scale = V.Phone.Settings.Scale ?? 1.0

    // 3.82 | 小黄书用户集成
    V.Phone.YenoteUsers = {
        // "识别ID": ["用户名", "头像"]
        // 此值将随着剧情的更改而修改，比如与某个Li成为恋人后，Ta可能改为 xxx超爱xxx 之类的
        "{PC}": ["{PC}", "{PC}"],
        "A": ["𝑨", "img/misc/icon/phone/avatar/A.png"],
        "Landry": ["BLACK MARKETEER", "img/misc/icon/phone/avatar/landry0.png"],
    }
    // 3.82 | NPC发文
    smartphone.yenoteNPCPost({
        id: "Landry-AD0",
        name: "Landry",
        msg: "回收旧手机、旧冰箱、旧空调、旧电脑，收旧洗衣机、旧电动车、摩托车、自行车、收报纸、废品",
        attract: 2.0,
    })
    smartphone.yenoteNPCPost({
        id: "A-Update382",
        name: "A",
        msg: "哈喽哈喽，感谢各位的支持呀！<br>给大家放一张之前没有用到的摄像图片当做福利啦！<br>如果你看不到的话，那就是没有使用最新的图包哦！",
        img: "img/photo/submission-1772783983529-h.png",
        price: 52,
        attract: 10.0,
    })

    // 3.84 | 变量优化
    if (window.modSC2DataManager.getModLoader().getModZip("DOLI") && V.Phone.Settings.Margin === undefined) {
        V.Phone.Settings.Margin = 85;
        document.documentElement.style.setProperty('--phone-margin', `${V.Phone.Settings.Margin}px`);
    }

    // 3.91 | NPC发帖可用评论
    V.Phone.Yenotes.find(y => y.id == "Landry-AD0").replies = [
        {
            condition: () => V.blackmoney > 0,
            text: "我这有点别人不要的东西你收吗？",
            reply: "来酒吧",
        },
        {
            condition: () => C.npc.Landry.init == 1 && C.npc.Landry.name_known == 1,
            text: "兰德里？",
            reply: "（你的评论已被删除）",
            replyCondition: () => Time.minute % 5 == 0,
            replyEffect: "<<set $Phone.LandryWarn to 1>>",
        },
        {
            text: "打广告怎么打到这里来了？",
            effect: "<<lstress>><<stress -5>>",
            minor: true,
        },
    ]
}

smartphone.patchTV = smartphone.patchTransferVariables = function(oldPath, newPath) {
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
        asi.log("SmartPhone", `Patch：变量转移成功: ${oldPath} -> ${newPath}`);
        return true;
    }
    
    return false;
};