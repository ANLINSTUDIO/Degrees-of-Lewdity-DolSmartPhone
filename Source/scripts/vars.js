console.log("| [SmartPhone] DoL万能的智能手机 正在加载：vars.js");

PhoneMod.currentVersion = window.modSC2DataManager.getModLoader().getModZip("SmartPhone Alpha").modInfo.version
PhoneMod.latestVersion = null
PhoneMod.notice = ""

async function getLastedVersion() {
  console.log(`| [SmartPhone] 正在取求最新版本号`)
  try {
    const response = await fetch(`https://sb.alseece.top/2/value.php?key=DoL-SmartPhone-LastestVersion`, {
      mode: 'cors',  // 明确指定 cors 模式
      credentials: 'omit'  // 不发送凭据
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      console.error('| [SmartPhone] 获取最新版本失败:', data.error);
    } else {
      PhoneMod.latestVersion = data.value;
      if (V.passage === "Start") {
        PhoneMod.PhoneUIInit()
      }
    }
  } catch (error) {
    console.error('| [SmartPhone] 请求最新版本出错:', error);
  }
}
async function getNotice() {
  console.log(`| [SmartPhone] 正在取求公告`)
  try {
    const response = await fetch(`https://sb.alseece.top/2/value.php?key=DoL-SmartPhone-Notice`, {
      mode: 'cors',  // 明确指定 cors 模式
      credentials: 'omit'  // 不发送凭据
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      console.error('| [SmartPhone] 获取公告失败:', data.error);
    } else {
      PhoneMod.notice = data.value;
      console.log(`| [SmartPhone] 更新公告 =====\n${PhoneMod.notice}\n===============`)
      const observer = new MutationObserver((mutations) => {
        const phone_notice = document.getElementById("phone-notice");
        if (phone_notice) {
          setTimeout(() => {
            const phone_notice = document.getElementById("phone-notice");
            phone_notice.innerText = PhoneMod.notice;
          }, 1000)
          observer.disconnect(); // 找到后停止观察
        }
      });

      // 开始观察整个文档
      observer.observe(document.body, {
        childList: true,      // 监听子节点变化
        subtree: true         // 监听所有后代节点
      });
    }
  } catch (error) {
    console.error('| [SmartPhone] 请求公告出错:', error);
  }
};
getLastedVersion()
getNotice()


PhoneMod.热度衰减系数 = 0.1;  // 衰减系数 0.1 控制热度下降速度（可根据需求调整，如每天衰减一半则系数约为 0.03）。
PhoneMod.点赞概率百分之 = 50;
PhoneMod.评论概率百分之 = 5;
PhoneMod.打赏概率百分之 = 10;


PhoneMod.debugBlackVPhone = [
  "Settings", "ReturnWorn", "Album"
]


PhoneMod.extraUsePhoneAreas = [
  "Shopping Centre", "Shopping Centre Top", "Commercial rooftops",
  "Shopping Centre Phone Shop", "Second Phone Shop",
];

PhoneMod.events = [
    {passage: "Shopping Centre", target: "Supermarket", event: "Shopping Centre Phone Shop Link"},
    {passage: "Shopping Centre", target: "Supermarket Lock", event: "Shopping Centre Phone Shop Link Lock"},
    {passage: "Elk Street", target: "Nightingale Street", event: "Second Phone Shop Link", position: "before", offset: 4},
    {passage: "Bedroom", target: "Mirror", event: "Live Bedroom Link"},
    // 盗窃手机
    {passage: "School Lockers Sneak", target: "School Lockers", event: "School Lockers Steal Phone", chance: 0.1, position: "before"},
    {passage: "Spa Work Cute", target: "Spa Tired Keep", event: "Spa Tired Steal Phone Text", chance: 0.5, position: "before", 
        replace_target: "Spa Tired Steal", replace_event: "Spa Tired Steal Phone Link"},
    {passage: "Spa Work Sophisticated", target: "Spa Tired Keep", event: "Spa Tired Steal Phone Text", chance: 0.5, position: "before", 
        replace_target: "Spa Tired Steal", replace_event: "Spa Tired Steal Phone Link"},
    {passage: "Spa Tired Work", target: "Spa Tired Keep", event: "Spa Tired Steal Phone Text", chance: 0.5, position: "before", 
        replace_target: "Spa Tired Steal", replace_event: "Spa Tired Steal Phone Link"},
    {passage: "Spa Tired Grope", target: "Spa Tired Keep", event: "Spa Tired Steal Phone Text", chance: 0.5, position: "before", 
        replace_target: "Spa Tired Steal", replace_event: "Spa Tired Steal Phone Link"},
    {passage: "Pub Drink", target: "Pub Seduce", event: "Pub Drink Steal Phone Link", chance: 0.7, position: "before"},
    // 询问电话
    {passage: "Pub Landry", target: "Pub", event: "Landry AskTel Link", position: "before", offset: 1},
    {passage: "Tailor Shop", target: "Tailor Monthly Repair", event: "Tailor AskTel Link"},
];
PhoneMod.events_on_macro = [
    {macro: "journal", func: "showPhoneJournal"},
    {macro: "orgasm", func: "havingOrgasm"},
]
PhoneMod.phoneConditionLevels = [
    { threshold: 0.8, text: "崭新出厂", color: "green" },
    { threshold: 0.6, text: "略有磨损", color: "teal" },
    { threshold: 0.4, text: " 明显划痕", color: "blue" },
    { threshold: 0.2, text: "严重磨损", color: "purple" },
    { threshold: 0, text: "残破不堪", color: "pink" }
];
PhoneMod.Contacts = [
    {name: "兰德里", call: "Phone Call Landry"},
    {name: "惠特尼", call: "Phone Call Whitney"},
    {name: "艾利克斯", call: "Phone Call Alex"},
    {name: "艾弗里", call: "Phone Call Avery"},
    {name: "贝利", call: "Phone Call Bailey"},
    {name: "裁缝", call: "Phone Call Tailor"},
];
PhoneMod.Apps = {
    alarm: {display_name: "闹钟", icon: "img/misc/icon/birdTower/watch.png", app_widget: "phone_app_alarm", init: "initAlarm"},
    memo: {display_name: "备忘录", icon: "img/misc/icon/phone/app/memo.png", app_widget: "phone_app_memo", init: "initMemo", guide: PhoneMod.Guide.memo},
    shop: {display_name: "网购", icon: "img/misc/icon/shopping_centre.png", app_widget: "phone_app_shop", disable: ["Clothing Shop", "Forest Shop", "School Library Shop", "Adult Shop Store"]},

    photo: {display_name: "摄像", icon: "img/misc/icon/camera.png", app_widget: "phone_app_photo", guide: PhoneMod.Guide.photo},
    album: {display_name: "相册", icon: "img/misc/icon/phone/app/album.png", app_widget: "phone_app_album", init: "initAlbum", guide: PhoneMod.Guide.photo},
    yenote: {display_name: "小黄书", icon: "img/misc/icon/phone/app/yenote.png", app_widget: "phone_app_yenote", init: "initYenote", toggle: "toggleYenote", guide: PhoneMod.Guide.yenote},

    contacts: {display_name: "通讯录", icon: "img/misc/icon/assignment.png", app_widget: "phone_app_contacts", guide: PhoneMod.Guide.contacts},
    game: {display_name: "游戏", icon: "img/misc/icon/robin_controller.png", app_widget: "phone_app_game"},
    settings: {display_name: "设置", icon: "img/misc/icon/furniture/wallpaper_cow_girls.png", app_widget: "phone_app_settings"},
};
setup.LocationImages.phone = {
  folder: "phone",
  base: {default: {image: "base.png"}}
}
PhoneMod.PhonePhotos = {
    "6583d16f-7c3f-4f18-b980-c41f2be40241": {
        msg: "洗澡~洗澡~洗澡澡❤️",
        taskDesc: "在家里洗澡时<span class='pink'>自慰达到高潮</span>",
        risk: 1,
        fames: ["sex"],
        conditions: {
          passage: "Bath Masturbation",
          Phone_havingOrgasm: true
        },
        comments: {
          "洗完澡都是香香的哦": `<<llstress>><<stress -24>>`,
          "我愿意高价购买这位女士的洗澡水，有人与我竞价吗": "<<ltrauma>><<trauma -6>><<lcontrol>><<control -12>>",

          "洗澡还要发情，你真是没救了": "<<gstress>><<stress 12>><<gtrauma>><<trauma 12>>"
        }
    }, 
    "44a3e666-7253-40a7-911b-8e0da7a65f7c": {
        msg: "我又来咯~洗澡~洗澡~我又洗澡澡❤️",
        taskDesc: "在家里洗澡时<span class='pink'>自慰达到高潮</span>且<span class='teal'>上一次洗澡的文章得到了500的阅读量</span>",
        risk: 1,
        fames: ["sex"],
        conditions: {
          passage: "Bath Masturbation",
          Phone_havingOrgasm: true,
          _: () => {
            const yenote = V.Phone.Yenotes.find(item => item.id === "6583d16f-7c3f-4f18-b980-c41f2be40241")
            if (yenote) {
              return yenote.view >= 500
            }
            return false;
          },
        },
        comments: {
            "出浴美人！爱爱爱❤️": "<<llstress>><<stress -24>>",
            "上次没抢到，这次的洗澡水一定是我的！": "<<ltrauma>><<trauma -6>><<lcontrol>><<control -12>>",

            "你再发这种骚图我找人弄你": "<<gstress>><<stress 12>><<gtrauma>><<trauma 12>>",
        }
    },
    "31d15586-9bb9-432e-a336-bb52006f0304": {
        msg: "不想上学呀~想上你❤️",
        taskDesc: "穿着<span class='teal'>校服裙且不穿内裤</span>在<span class='gold'>学校</span>登上天台",
        risk: 20,
        fames: ["exhibitionism"],
        conditions: {
          passage: "School Roof",
          _: () => {
            return V.worn.lower.name === "school skirt" && V.worn.under_lower.name === "naked"
          },
        },
        comments: {
          "这是我们学校吗？": "<<garousal>><<arousal 100>>",
          "我出一块赌她没有穿内裤": "<<garousal>><<arousal 100>>",
          "就是这个校服最对味！": "<<llstress>><<stress -24>>",

          "婊子，不要在我的学校发骚": "<<gstress>><<stress 12>>",

          "逆天文案": "<<garousal>><<arousal 50>>"
        }
    },
    "07363819-aebb-4e32-be7e-240d665c7731": {
        msg: "哎呀哎呀，要被这么多人一起上了哦~",
        taskDesc: "在<span class='gold'>妓院</span>跳脱衣舞<span class='teal'>被观众群奸</span>",
        risk: 100,
        fames: ["exhibitionism", "prostitution", "sex"],
        conditions: {
          passage: "Brothel Dance Rape"
        },
        comments: {
          "我去，这是哪里？我也要去": "<<garousal>><<arousal 100>>",
          "不得了不得了，你一定是一个很欠肏的婊子": "<<garousal>><<arousal 100>><<gstress>><<stress 6>>"
        }
    },
    "4c5fcd71-92b5-4974-badd-6a1b2de9d8b6": {
        msg: "wataa",
        taskDesc: "在<span class='gold'>宅邸街</span>进行<span class='teal'>等级为2的露出活动</span>",
        risk: 60,
        fames: ["exhibitionism"],
        conditions: {
          passage: "Domus Street",
          exposed: 2
        },
        comments: {
          "尺度有点大啊！！😱 ": "<<garousal>><<arousal 100>>",
          "这么刺激吗": "<<garousal>><<arousal 100>><<lstress>><<stress -6>><<gcontrol>><<control 6>>"
        }
    },
}
PhoneMod.Comments = {
    "你真美~": `<<lstress>><<stress -12>>`,
    "每次看到好看的人都觉得和你有点神似，我想这世间但凡称得上美的人，都得有几分像你，不过她们又都只能像你，因为你的可爱她们学也学不来！": `<<llstress>><<stress -24>>`,
    "你是与众不同的可爱，表里如一的可爱": `<<lstress>><<stress -12>>`,
    "不知道为啥你要隔三差五发张自拍，要发就天天发，这是在拯救世界O(∩_∩)O": `<<llstress>><<stress -24>>`,
    "不要以为自己有几分姿色就了不起，像你这种人，我见一个爱一个": `<<lstress>><<stress -6>><<ltrauma>><<trauma -6>>`,
    "知道恐龙为什么灭绝吗？因为它们的前肢太短，无法为你的美貌鼓掌": `<<lstress>><<stress -6>><<ltrauma>><<trauma -6>>`,
    "你在我面前永远都闪闪发光，就像整个宇宙的星光都洒在你身上": `<<llstress>><<stress -24>>`,
    "我常常感到庆幸又快乐，因为我所生活的这个世界上，有像你这么好的人存在着": `<<llstress>><<stress -24>>`,
    "手如柔荑，肤如凝脂，领如蝤蛴，齿如瓠犀，螓首蛾眉，巧笑倩兮，美目盼兮": `<<llstress>><<stress -24>>`,
    "你的照片真棒，我不是在夸你的美貌，我只是在提醒你，多发点，我内存够用": `<<llstress>><<stress -24>>`,
    "你简直是大陆颜值的标杆，即使是后脑勺也是惊人的美貌，连风和阳光都会嫉妒吧": `<<llstress>><<stress -24>>`,
    "你的眼像是一望无际的星辰，一定是在你出生那天上帝把月亮捏碎了，放进了你的眼里": `<<llstress>><<stress -24>>`,
    "除了窒息我没有什么要表演的": `<<llstress>><<stress -24>><<ltrauma>><<trauma -6>>`,
    "看完照片后，我不敢轻易评论，我担心我庸俗不堪的语言会玷污了这世间少有的美感。但我还是评论了，我觉得如果不能在这样有美感的照片后面留下评论，那将会是一生的遗憾": `<<lstress>><<stress -12>>`,

    "这么小的奶子你敢发我都不敢看": `<<insecurity "breasts_small" 1>><<ginsecurity "breasts_small">>`,
    "你在勾引谁呢，臭婊子": `<<ggstress>><<stress 24>><<gtrauma>><<trauma 12>>`,
    "粉粉嫩嫩的小骚逼，给我吃两口": "<<gstress>><<stress 12>><<lcontrol>><<control -12>>",
    "你怎么这么骚啊，贱货": "<<gstress>><<stress 12>><<gtrauma>><<trauma 12>>",
    "别发骚了，等肏呢？": "<<gstress>><<stress 12>><<lcontrol>><<control -12>>",

    "牛逼": "<<garousal>><<arousal 100>>",
}
PhoneMod.NicknameGenerator = {
    // 前缀库
    prefixes: [
        '可爱的', '帅气的', '迷人的', '疯狂的', '安静的', '暴躁的',
        '忧郁的', '开心的', '神秘的', '单纯的', '傲娇的', '温柔的',
        '冷酷的', '热心的', '迷糊的', '精明的', '天真的', '成熟的'
    ],
    
    // 后缀库
    suffixes: [
        '酱', '君', '桑', '殿下', '大人', '同学', '前辈', '后辈',
        '喵', '汪', '嗷', '咩', '哞', '咕', '哒', '哟'
    ],
    
    // 特殊符号
    symbols: ['☆', '★', '❤', '♡', '✦', '✧', '※', '〆', '°', '‧'],
    
    // 数字组合
    numbers: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
              '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
};
PhoneMod.PhoneGameQuestions = {
  "Maths": [
    {
      "q": "若一个等差数列的首项为3，公差为4，则第10项是多少？",
      "a": "39",
      "w": ["43", "36", "40", "35", "42", "37", "41", "38", "44", "45"]
    },
    {
      "q": "在平面直角坐标系中，点(3, -4)到原点的距离是多少？",
      "a": "5",
      "w": ["7", "1", "25", "12", "4", "3", "√7", "√14", "6", "8"]
    },
    {
      "q": "函数 y = sin(x) 的最小正周期是多少？",
      "a": "2π",
      "w": ["π", "π/2", "4π", "3π", "2", "3.14", "1", "0", "π/4", "1.5π"]
    },
    {
      "q": "已知集合A={1,2,3}，B={2,3,4}，则A与B的交集是什么？",
      "a": "{2, 3}",
      "w": ["{1, 4}", "{1, 2, 3, 4}", "{2}", "{3}", "{ }", "{1}", "{4}", "{1, 2}", "{3, 4}", "{1, 3}"]
    },
    {
      "q": "抛掷两枚质地均匀的硬币，两枚都是正面向上的概率是多少？",
      "a": "1/4",
      "w": ["1/2", "1/3", "1/8", "2/3", "3/4", "1", "0", "1/6", "1/5", "2/5"]
    },
    {
      "q": "黄金分割比例（近似值）是多少？",
      "a": "0.618",
      "w": ["0.314", "0.732", "0.5", "0.8", "0.666", "0.414", "0.577", "0.707", "0.866", "0.912"]
    },
    {
      "q": "一个圆柱的底面半径为1，高为2，它的体积是多少？",
      "a": "2π",
      "w": ["π", "4π", "2", "4", "3π", "π/2", "1", "6", "8", "1.5π"]
    },
    {
      "q": "log10(1000) 的值是多少？",
      "a": "3",
      "w": ["2", "10", "100", "1", "0", "30", "5", "4", "1.5", "2.5"]
    },
    {
      "q": "三角形三内角之和在欧几里得几何中是多少度？",
      "a": "180°",
      "w": ["90°", "360°", "270°", "100°", "120°", "150°", "200°", "170°", "300°", "540°"]
    },
    {
      "q": "求导：f(x) = x²，则 f'(x) 是多少？",
      "a": "2x",
      "w": ["x", "2", "x²", "1", "0", "x³", "1/2 x", "2x²", "3x", "x/2"]
    }
  ],
  "History": [
    {
      "q": "中国历史上第一个大一统的封建王朝是？",
      "a": "秦朝",
      "w": ["汉朝", "唐朝", "周朝", "夏朝", "商朝", "宋朝", "明朝", "清朝", "隋朝", "元朝"]
    },
    {
      "q": "《马关条约》是在哪场战争后签订的？",
      "a": "甲午中日战争",
      "w": ["鸦片战争", "第二次鸦片战争", "八国联军侵华", "中法战争", "抗日战争", "抗美援朝", "军阀混战", "辛亥革命", "太平天国", "普法战争"]
    },
    {
      "q": "被誉为“欧洲文艺复兴发源地”的城市是？",
      "a": "佛罗伦萨",
      "w": ["罗马", "巴黎", "伦敦", "威尼斯", "米兰", "雅典", "马德里", "柏林", "维也纳", "那不勒斯"]
    },
    {
      "q": "提出“我思故我在”的著名哲学家是？",
      "a": "笛卡尔",
      "w": ["苏格拉底", "柏拉图", "亚里士多德", "康德", "黑格尔", "尼采", "卢梭", "伏尔泰", "孟德斯鸠", "培根"]
    },
    {
      "q": "中国科举制度正式废除是在哪一年？",
      "a": "1905年",
      "w": ["1900年", "1911年", "1898年", "1912年", "1919年", "1921年", "1840年", "1860年", "1908年", "1903年"]
    },
    {
      "q": "“工业革命”最早起源于哪个国家？",
      "a": "英国",
      "w": ["美国", "法国", "德国", "中国", "荷兰", "意大利", "日本", "俄国", "西班牙", "比利时"]
    },
    {
      "q": "签署《独立宣言》标志着哪个国家诞生？",
      "a": "美国",
      "w": ["法国", "英国", "加拿大", "澳大利亚", "德国", "巴西", "阿根廷", "墨西哥", "印度", "南非"]
    },
    {
      "q": "成吉思汗的本名是？",
      "a": "铁木真",
      "w": ["忽必烈", "托雷", "窝阔台", "术赤", "察合台", "努尔哈赤", "皇太极", "多尔衮", "冒顿", "完颜阿骨打"]
    },
    {
      "q": "“贞观之治”是指哪位皇帝在位期间的统治？",
      "a": "唐太宗",
      "w": ["唐玄宗", "唐高祖", "汉武帝", "汉高祖", "秦始皇", "明太祖", "康熙帝", "乾隆帝", "隋文帝", "武则天"]
    },
    {
      "q": "第一次世界大战的导火索是？",
      "a": "萨拉热窝事件",
      "w": ["珍珠港事件", "波士顿倾茶事件", "滑铁卢战役", "凡尔登战役", "慕尼黑阴谋", "诺曼底登陆", "斯大林格勒保卫战", "卢沟桥事变", "中途岛海战", "敦刻尔克大撤退"]
    }
  ],
  "English": [
    {
      "q": "“采菊东篱下，悠然见南山”是谁的诗句？",
      "a": "陶渊明",
      "w": ["李白", "杜甫", "白居易", "王维", "谢灵运", "苏轼", "辛弃疾", "李商隐", "杜牧", "孟浩然"]
    },
    {
      "q": "《三国演义》中，“过五关斩六将”的是谁？",
      "a": "关羽",
      "w": ["张飞", "赵云", "马超", "诸葛亮", "刘备", "吕布", "曹操", "孙权", "黄忠", "魏延"]
    },
    {
      "q": "成语“闻鸡起舞”的主人公是谁？",
      "a": "祖逖",
      "w": ["勾践", "项羽", "刘邦", "匡衡", "廉颇", "蔺相如", "苏秦", "张仪", "韩信", "岳飞"]
    },
    {
      "q": "下列哪个不属于“岁寒三友”？",
      "a": "菊",
      "w": ["松", "竹", "梅", "兰", "荷", "柳", "柏", "枫", "桃", "杏"]
    },
    {
      "q": "《红楼梦》中，葬花的人是？",
      "a": "林黛玉",
      "w": ["薛宝钗", "王熙凤", "贾元春", "史湘云", "贾探春", "晴雯", "袭人", "妙玉", "贾巧姐", "秦可卿"]
    },
    {
      "q": "“出淤泥而不染”赞美的是什么植物？",
      "a": "莲花",
      "w": ["梅花", "兰花", "菊花", "牡丹", "玫瑰", "水仙", "桂花", "桃花", "杜鹃", "海棠"]
    },
    {
      "q": "被称为“诗仙”的是？",
      "a": "李白",
      "w": ["杜甫", "王维", "白居易", "李贺", "李商隐", "苏轼", "贺知章", "孟浩然", "柳宗元", "刘禹锡"]
    },
    {
      "q": "成语“破釜沉舟”与哪场战役有关？",
      "a": "巨鹿之战",
      "w": ["官渡之战", "赤壁之战", "淝水之战", "长平之战", "牧野之战", "城濮之战", "夷陵之战", "虎牢关之战", "土木堡之变", "崖门海战"]
    },
    {
      "q": "《师说》的作者是？",
      "a": "韩愈",
      "w": ["柳宗元", "欧阳修", "苏轼", "曾巩", "王安石", "苏洵", "苏辙", "范仲淹", "司马光", "陆游"]
    },
    {
      "q": "“路漫漫其修远兮，吾将上下而求索”出自？",
      "a": "《离骚》",
      "w": ["《诗经》", "《论语》", "《九歌》", "《天问》", "《孟子》", "《史记》", "《左传》", "《战国策》", "《庄子》", "《老子》"]
    }
  ],
  "Science": [
    {
      "q": "地球大气中含量最高的气体是？",
      "a": "氮气",
      "w": ["氧气", "二氧化碳", "氩气", "氢气", "氦气", "臭氧", "一氧化碳", "甲烷", "水蒸气", "氖气"]
    },
    {
      "q": "被誉为“细胞的能量工厂”的是？",
      "a": "线粒体",
      "w": ["叶绿体", "细胞核", "高尔基体", "核糖体", "溶酶体", "内质网", "液泡", "细胞膜", "中心体", "细胞质"]
    },
    {
      "q": "光在真空中传播的速度约为多少？",
      "a": "30万公里/秒",
      "w": ["340米/秒", "15万公里/秒", "100万公里/秒", "3万公里/秒", "10万公里/秒", "50万公里/秒", "20万公里/秒", "80万公里/秒", "1亿米/秒", "5万公里/秒"]
    },
    {
      "q": "人体最大的器官是？",
      "a": "皮肤",
      "w": ["肝脏", "大脑", "肺", "小肠", "心脏", "肾脏", "胃", "脾脏", "大肠", "骨骼"]
    },
    {
      "q": "下列哪个属于化学变化？",
      "a": "铁生锈",
      "w": ["水结冰", "酒精挥发", "盐溶解", "玻璃破碎", "电灯发光", "干冰升华", "切水果", "磁化", "折断木棒", "水沸腾"]
    },
    {
      "q": "太阳系中体积最大的行星是？",
      "a": "木星",
      "w": ["土星", "海王星", "天王星", "地球", "火星", "金星", "水星", "冥王星", "太阳", "月球"]
    },
    {
      "q": "pH值等于7的溶液呈什么性？",
      "a": "中性",
      "w": ["酸性", "碱性", "强酸性", "强碱性", "弱酸性", "弱碱性", "腐蚀性", "挥发性", "还原性", "氧化性"]
    },
    {
      "q": "万有引力定律是谁提出的？",
      "a": "牛顿",
      "w": ["爱因斯坦", "伽利略", "霍金", "法拉第", "居里夫人", "特斯拉", "普朗克", "波尔", "达尔文", "阿基米德"]
    },
    {
      "q": "声音在下列哪种介质中传播速度最快？",
      "a": "钢轨",
      "w": ["空气", "水", "真空", "软木", "酒精", "海水", "塑料", "棉花", "橡胶", "煤油"]
    },
    {
      "q": "缺碘会导致哪种疾病？",
      "a": "大脖子病",
      "w": ["夜盲症", "坏血病", "佝偻病", "贫血", "糖尿病", "高血压", "脚气病", "白化病", "色盲", "哮喘"]
    }
  ]
}
PhoneMod.Fames = {
  bestiality:"人外" ,
  business:"商业" ,
  exhibitionism:"露出" ,
  good:"善良" ,
  impreg: "授孕" ,
  model:"模特" ,
  pimp:"皮条客" ,
  pregnancy:"怀孕" ,
  prostitution:"卖淫" ,
  rape:"强暴" ,
  scrap:"战斗" ,
  sex:"淫乱" ,
  social:"社交" ,
}