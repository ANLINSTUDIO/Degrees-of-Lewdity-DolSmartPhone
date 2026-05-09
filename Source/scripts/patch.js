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

    // 3.83 | 手机价格调整
    const PhoneModelsOri = {  // 手机品牌
        "斯达特3 限量型": {
            price: 4999,
            newnessfactory: 1000,
            photography: 1,
            desc: "拥有这一部手机，说明您是测试版就开始游玩的天选之人。感谢您的支持~❤"
        },
        "特斯特2 测试型": {
            price: 0,
            newnessfactory: 1000,
            photography: 1,
            desc: "内部测试机，此型号严禁外传，不知道你是从哪里搞来的"
        },
        "Neme 12": {
            price: 2999,
            newnessfactory: 600,
            photography: 0.6,
            desc: "性价比超高的实惠之选！"
        },
        "Neme 12 Pro": {
            price: 3599,
            newnessfactory: 1000,
            photography: 1,
            desc: "全新电池容量，更大，更实惠！拍摄更清晰！"
        },
        "Neme 12 Pro Max": {
            price: 4399,
            newnessfactory: 1400,
            photography: 1.4,
            desc: "8000mAh / 给用户提供了全方位的极致体验 / 摄影新科技，拍照更清晰！"
        },
        "Mimi 17": {
            price: 4799,
            newnessfactory: 1500,
            photography: 1.6,
            desc: "极具质感的小尺寸旗舰 / 第五代萧隆 8 至尊版移动平台，性能跨代 / 专业影像，定格光影 / 低功耗超级阳光屏，亮眼更护眼 / 多瑙河电池，续航超越想象 / 友商都是傻逼"
        },
        "Photographer 3": {
            price: 4999,
            newnessfactory: 500,
            photography: 3,
            desc: "专业摄像手机，捕捉每一刻艺术的瞬间"
        }
    };
    if (V.Phone.价格调整理赔 === undefined) {
        PhoneMod.RefreshSecondPhone();  // 刷新二手市场以更新价格
    }
    V.Phone.价格调整理赔 = V.Phone.价格调整理赔 ?? [];
    V.Phone.Owned.forEach(phone => {
        if (V.Phone.价格调整理赔.includes(phone.id)) return;  // 已经理赔过的手机不再理赔
        if (!phone.usable) return;  // 不可用的手机不理赔（包括未解锁的盗窃手机）
        const oldPrice = PhoneModelsOri[phone.model]?.price ?? 0;
        const newPrice = PhoneMod.getPhoneInfo(phone.model)?.price ?? 0;
        const relPrice = oldPrice - newPrice;
        if (relPrice) {
            setTimeout(() => {
                PhoneMod.msgSend(`尊敬的客户您好：您的手机<span class="teal">(${phone.id})</span>的市场价已经降价，<span class="purple">遇欲NDMT保险公司</span>依据规定对其进行合法理赔，预计<span class="gold">£${relPrice}</span>将会稍后汇款到您的账户。`);
            }, 10);
            Wikifier.wikifyEval(`<<money ${relPrice * 100}>>`);
        }
        V.Phone.价格调整理赔.push(phone.id);
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