AsAPI.log("SmartPhone", "正在加载：vars.js");


// === 版本 =======================================================
PhoneMod.currentVersion = window.modSC2DataManager.getModLoader().getModZip("SmartPhone Alpha").modInfo.version
PhoneMod.latestVersion = null
PhoneMod.notice = ""
PhoneMod.debug = 0

async function getLastedVersion() {
  AsAPI.log("SmartPhone", `正在取求最新版本号`)
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
      AsAPI.error("SmartPhone", '获取最新版本失败:'+data.error);
    } else {
      PhoneMod.latestVersion = data.value;
      if (V.passage === "Start") {
        PhoneMod.PhoneUIInit()
      }
    }
  } catch (error) {
    AsAPI.error("SmartPhone", '请求最新版本出错:'+error);
  }
}
getLastedVersion()


// === 注入 =======================================================
PhoneMod.events = [
    // {
    //   passage: "注入段落", 
    //   target: "定位锚点目标", 
    //   event: "注入事件", 
    //   position: "方向" => ["after"], "before", "replace",
    //   offset: "偏移",
    //   chance: "出现概率",
    //   condition: (额外条件) => true:一定触发、无视概率 | false:不触发、无视概率 | null:继承概率
    //   eventid: "通过定义eventid，可以在成功或失败时继续注入事件"
    //   s: "成功时注入的event"
    //   f: "失败时注入的event",
    //   goto: "直接替换当前段落",
    // }
    // 地点
    {passage: "Shopping Centre", target: "Supermarket", event: "Shopping Centre Phone Shop Link"},
    {passage: "Shopping Centre", target: "Supermarket Lock", event: "Shopping Centre Phone Shop Link Lock"},
    {passage: "Elk Street", target: "Trash", event: "Second Phone Shop Link"},
    {passage: "Elk Street", target: "Trash Gate Enter", event: "Second Phone Shop Link"},
    // 地点组
    {passage: "Bedroom", target: "Mirror", event: "Bedroom Corner"},
    // 直播
    // {passage: "Bedroom", target: "Mirror", event: "Live Bedroom Link"},
    // 盗窃手机
    {passage: "School Lockers Sneak", target: "School Lockers", event: "School Lockers Steal Phone", chance: 0.1, condition: "SchoolLockersSneakCondition", position: "before"},
    {eventid: "School Lockers Sneak Kylar", target: "School Lockers", event: "School Lockers Sneak Kylar", position: "before", offset: 3},
    {eventid: "School Lockers Sneak Whitney", target: "School Lockers", event: "School Lockers Sneak Whitney", position: "before", offset: 3},
    {eventid: "School Lockers Sneak Robin", target: "School Lockers", event: "School Lockers Sneak Robin", position: "before", offset: 3},
    {eventid: "School Lockers Sneak Sydney", target: "School Lockers", event: "School Lockers Sneak Sydney", position: "before", offset: 3},
    {passage: "Spa Work Cute", target: "Spa Tired Keep", event: "Spa Tired Steal Phone Text", chance: 0.5, position: "before", s: "Spa Tired Steal REPLACE"},
    {passage: "Spa Work Sophisticated", target: "Spa Tired Keep", event: "Spa Tired Steal Phone Text", chance: 0.5, position: "before", s: "Spa Tired Steal REPLACE"},
    {passage: "Spa Tired Work", target: "Spa Tired Keep", event: "Spa Tired Steal Phone Text", chance: 0.5, position: "before", s: "Spa Tired Steal REPLACE"},
    {passage: "Spa Tired Grope", target: "Spa Tired Keep", event: "Spa Tired Steal Phone Text", chance: 0.5, position: "before", s: "Spa Tired Steal REPLACE"},
    {eventid: "Spa Tired Steal REPLACE", target: "Spa Tired Steal", event: "Spa Tired Steal Phone Link"},
    {passage: "Pub Drink", target: "Pub Seduce", event: "Pub Drink Steal Phone Link", chance: 0.3, position: "before"},
    {passage: "Ocean Breeze", target: "Cliff Street", event: "Ocean Breeze Steal Phone Link", position: "before", offset: 1},
    // 询问电话
    {passage: "Pub Landry", target: "Pub", event: "Landry AskTel Link", position: "before", offset: 1},
    {passage: "Tailor Shop", target: "Tailor Monthly Repair", event: "Tailor AskTel Link"},
    // 充电
    {passage: "Ocean Breeze", target: "Cliff Street", event: "Ocean Breeze Charge Link", position: "before", offset: 1},
    // {passage: "Bedroom", target: "Live Bedroom", event: "Bedroom Charge Link", f:"Bedroom Charge NOLIVE"},
    // {eventid: "Bedroom Charge NOLIVE", target: "Mirror", event: "Bedroom Charge Link", offset: 1},
    {passage: "Library Rental Counter", target: "School Library", event: "Library Charge Link", position: "before", offset: 1},
    {passage: "Sydney Leighton Spank 4", target: "School Library", event: "Library Charge Link", position: "before", offset: 1},
    // 储存手机
    // {passage: "Bedroom", target: "Bed", event: "Bedroom Store Phone Link", position: "before", offset: 3},
    // 获取APP
    {passage: "Ocean Breeze Work", target: "Chef Help", event: "Chef Help Get NewWest 1", position: "before"},
    {passage: "Chef Work", target: "Chef Work 2", event: "Chef Help Get NewWest 2", position: "before"},
];
PhoneMod.events_on_macro = [
    {macro: "journal", func: "showPhoneJournal"},
    {macro: "effectssteal", func: "effectsstealPhone"},

    // 任务钩子
    {macro: "orgasm", func: "orgasm"},
    {macro: "make_recipe", func: "make_recipe"},
]


// === 内容 =======================================================
PhoneMod.PhonePhotos = {  // 摄像任务 
    // "任务ID 也是图片路径键": {
    //     msg: "发布时的文案",
    //     taskDesc: "对任务的简述",
    //     risk: int 任务难度或者稀有度,
    //     fames: ["相关名声"],
    //   [ hide: bool 未完成前是否隐藏,
    //   [ uncommon: bool 是否出现普通评论 (非自拍照片设为true),
    //     conditions: {
    //       // 完成条件，例如: 
    //       passage: "所处passage",
    //       var1: "var1为某值",
    //       var2非: "var2并非某值",
    //       $var3: "V.Phone.var3为某值",
    //       _var4: "T.var4为某值",
    //       $: () => {
    //         return "特殊完成条件函数，需要返回bool"
    //       },
    //     },
    //     comments: {
    //       "评论1": "影响1",  普通主评论
    //       "评论2": "影响2",  普通主评论
    //       "→": [() => {return "条件函数，需要返回bool"}, {
    //         "如果满足条件则可能出现这些评论": "影响",  条件主评论
    //       }, {
    //         "否则可能出现这些评论": "影响",  否条件主评论
    //       }]
    //       "→": [() => {return "条件函数，需要返回bool"}, {
    //         "也可以没有否则项": "影响",  跟评条件主评论
    //         "→": [() => {return "条件函数，需要返回bool"}, {
    //           "也可以嵌套": "影响",  跟评条件跟评论
    //         }]
    //       }]
    //       "↓" : [
    //         [
    //           ["评论链 首评", "影响"],  跟评主评论
    //           ["跟评1", "影响"],  跟评跟评论
    //           ["跟评2 跟的是跟评1", "影响"],  普通跟评论
    //         ],
    //         {
    //           ["评论链 首评", "影响"],  跟评主评论
    //           ["跟评1", "影响"],  跟评跟评论
    //           ["跟评2 跟的是跟评1", "影响"],  跟评跟评论
    //           ["→", [() => {return "条件函数，需要返回bool"}, [
    //             ["跟评3 跟的是跟评2", "影响"],  跟评条件跟评论
    //             ["跟评4 跟的是跟评3", "影响"],  普通跟评论
    //           ], [
    //             ["跟评5 跟的是跟评2", "影响"],  普通否条件跟评论
    //           ]]],
    //           // 条件之后的写法上不再允许有跟评，因为无法判断到底跟谁
    //         ]
    //         // 跟评的原理是下一次获取yenoteGenerateRandomComment时，如果最后一个评论处于跟评链内，
    //         // 则50%出现其跟评（如果还有），50%断开跟评链，所以一个跟评链不一定全部都会被连续返回，
    //         // 跟评链只能从首评开始，但是不一定从最后一个跟评结束；到了最后一个跟评则一定结束。
    //       ],
    //     }
    // },
    "6583d16f-7c3f-4f18-b980-c41f2be40241": {
        msg: "洗澡~洗澡~洗澡澡❤️",
        taskDesc: "在家里洗澡时<span class='pink'>自慰达到高潮</span>",
        risk: 1,
        fames: ["sex"],
        conditions: {
          passage: "Bath Masturbation",
          $havingOrgasm: true
        },
        comments: {
          "洗完澡都是香香的哦": `<<lstress>><<stress -1>>`,
          "这阿黑颜……顶爆了！": "<<ggarousal>><<arousal 100>><<gstress>><<stress 1>>",

          "洗澡还要发情，你真是没救了": "<<ggtrauma>><<trauma 10>><<ggstress>><<stress 3>>",

          "↓": [
            [
              ["我愿意出200高价购买这位女士的洗澡水，有人与我竞价吗", "<<garousal>><<arousal 30>>"],
              ["没钱还想吃好的？我出500", "<<ggarousal>><<arousal 100>><<gstress>><<stress 1>>"],
            ],
            [
              ["→", [()=>V.player.gender=="f"&&V.player.penisExist, [
                ["我去，下面那是根啥？", "<<garousal>><<arousal 30>>"],
                ["应该是八级甲吧",  "<<garousal>><<arousal 30>>"],
                ["我感觉不像", "<<ggarousal>><<arousal 100>>"],
                ["破案了，lz其实是扶她", "<<ggarousal>><<arousal 100>><<gstress>><<stress 1>>"],
                ["没我长", "<<insecurity 'penis_small' 1>><<ginsecurity 'penis_small'>>"],
              ]]]
            ],
            [
              ["想玩浴室play", "<<garousal>><<arousal 30>>"],
              ["加我一个", "<<garousal>><<arousal 30>>"],
              ["做的时候记得喊我名字", "<<ggarousal>><<arousal 100>>"],
            ],
            [
              ["身材管理方法发一个", "<<lstress>><<stress -1>>"],
              ["楼主拿刀砍出来的", "<<lstress>><<stress -1>>"],
              ["楼主腰比我脖子都细", "<<lstress>><<stress -1>>"],
              ["也就一般吧", "<<gstress>><<stress 1>>"],
            ],
            [
              ["→", [()=>V.player.gender=="f", [
                ["妹妹看看b", "<<garousal>><<arousal 30>>"],
                ["不准看我老婆",  "<<garousal>><<arousal 30>>"],
                ["那我更喜欢了", "<<ggarousal>><<arousal 100>>"],
                ["我去还有ntr", "<<ggarousal>><<arousal 100>><<gstress>><<stress 1>>"],
                ["还有人没看过这骚货的？", "<<gstress>><<stress 1>>"],
              ], [
                ["弟弟看看鸟", "<<garousal>><<arousal 30>>"],
                ["不准看我老公",  "<<garousal>><<arousal 30>>"],
                ["那我更喜欢了", "<<ggarousal>><<arousal 100>>"],
                ["我去还有ntr", "<<ggarousal>><<arousal 100>><<gstress>><<stress 1>>"],
                ["还有人没看过这骚货的？", "<<gstress>><<stress 1>>"],
              ]]]
            ],
          ],

          // "洗澡还要发情，你真是没救了": "<<gstress>><<stress 12>><<gtrauma>><<trauma 12>>",

          // "好想看你洗完澡湿哒哒的样子": "<<garousal>><<arousal 85>><<ltrauma>><<trauma -6>>",
          // "小骚货洗个澡都能高潮，绝了": "<<garousal>><<arousal 95>><<llstress>><<stress -18>><<lcontrol>><<control +8>>",
          // "浴室play懂的都懂，太会了宝贝": "<<garousal>><<arousal 80>><<lstress>><<stress -12>><<lllcontrol>><<control +15>>",
          // "高潮那一下腿软了吧？好可爱": "<<garousal>><<arousal 75>><<ltrauma>><<trauma -8>>",
          // "下次开语音让我听全程好吗": "<<garousal>><<arousal 85>><<llstress>><<stress -20>>",
          // "洗澡都能这么浪，日常很会玩吧": "<<garousal>><<arousal 80>><<lstress>><<stress -10>><<ltrauma>><<trauma -6>>",

          // // 负面 10条（贬低/厌恶，加压加创减控）
          // "恶心死了，洗个澡都能发骚": "<<gstress>><<stress 12>><<gtrauma>><<trauma 12>>",
          // "贱货一个，家里都管不住下边": "<<ggstress>><<stress 18>><<gtrauma>><<trauma 10>>",
          // "这么饥渴是没人要吗？真tm丢人": "<<gstress>><<stress 14>><<ggcontrol>><<control -12>>",
          // "录音发网上是想让谁看啊？臭婊": "<<gstress>><<stress 16>><<gtrauma>><<trauma 14>>",
          // "下贱到骨子里了，恶心巴拉": "<<ggstress>><<stress 20>>",
          // "洗澡都能高潮，平时得多空虚": "<<gstress>><<stress 12>><<gtrauma>><<trauma 8>><<gcontrol>><<control -10>>",
          // "这种货色也就敢躲浴室发浪": "<<gstress>><<stress 10>>",
          // "真他妈不要脸，删了吧恶心": "<<ggstress>><<stress 22>><<ggtrauma>><<trauma 16>>",
          // "婊里婊气的，活该单身一辈子": "<<gstress>><<stress 15>><<gcontrol>><<control -14>>",
          // "变态自慰狂，离我远点": "<<ggstress>><<stress 18>><<gtrauma>><<trauma 12>>",

          // // 中立 10条（惊讶/调侃/吃瓜，主要是 arousal，偶尔小波动）
          // "洗澡自慰也太常规操作了吧": "<<garousal>><<arousal 25>>",
          // "逆天，洗澡都能玩出花": "<<garousal>><<arousal 45>><<lcontrol>><<control -8>>",
          // "几分钟？报个时长兄弟们好奇": "<<garousal>><<arousal 30>>",
          // "水温多少度？太热了吧这么浪": "<<garousal>><<arousal 28>>",
          // "这属于隐藏技能点满了吧": "<<garousal>><<arousal 38>><<lstress>><<stress -4>>",
          // "浴室瓷砖应该很凉吧腿软不滑": "<<garousal>><<arousal 32>>",
          // "下次试试莲蓬头冲吗？升级版": "<<garousal>><<arousal 40>><<ltrauma>><<trauma -4>>"
        }
    }, 
    "44a3e666-7253-40a7-911b-8e0da7a65f7c": {
        msg: "我又来咯~洗澡~洗澡~我又洗澡澡❤️",
        taskDesc: "在家里洗澡时<span class='pink'>自慰达到高潮</span>且<span class='teal'>上一次洗澡的文章得到了500的阅读量</span>",
        risk: 1,
        fames: ["sex"],
        conditions: {
          passage: "Bath Masturbation",
          $havingOrgasm: true,
          $: () => {
            const yenote = V.Phone.Yenotes.find(item => item.id === "6583d16f-7c3f-4f18-b980-c41f2be40241")
            if (yenote) {
              return yenote.view >= 500
            }
            return false;
          },
        },
        comments: {
          "就是需要这样敬业的福利姬": "<<lstress>><<stress -1>>",
          "我下的任务": "<<garousal>><<arousal 30>>",
          "每日大赛没看到过": "<<garousal>><<arousal 30>>",
          "总有人觉得自己洗澡是一件大事": "",
          "炒冷饭无不无聊": "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>",
          "出浴美人！爱爱爱❤️": "<<llstress>><<stress -3>>",
          "上次没抢到，这次的洗澡水一定是我的！": "<<ltrauma>><<trauma -3>><<lcontrol>><<control -1>>",
          "你再发这种骚图我找人弄你": "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>",

          "↓": [
            [
              ["这次有没有喊我名字", "<<garousal>><<arousal 30>>"],
              ["我们玩的窒息play", "<<garousal>><<arousal 30>>"],
              ["念的太多了记不清了",, "<<garousal>><<arousal 30>>"],
              ["楼主不语只是一味地哦吼吼吼", "<<ggarousal>><<arousal 100>>"]
            ]
          ]
          

          // // 正面 10条（因为上篇爆了500阅读，这篇更被期待/夸爆，减压减创增控更明显一些）
          // "又来洗澡了？上篇直接把我干上天了😭💦": "<<garousal>><<arousal 100>><<lllstress>><<stress -30>>",
          // "连续洗澡高潮系列是吧？爱了爱了": "<<garousal>><<arousal 95>><<llstress>><<stress -24>><<ltrauma>><<trauma -10>>",
          // "上次那篇我反复看了好几遍，这次更期待": "<<garousal>><<arousal 90>><<lstress>><<stress -15>><<lllcontrol>><<control +18>>",
          // "小仙女又来发福利了，浴室女王yyds": "<<garousal>><<arousal 85>><<llstress>><<stress -20>>",
          // "你真的很会，冲啊继续浪": "<<garousal>><<arousal 100>><<ltrauma>><<trauma -12>>",
          // "这身材+这操作，上次就射爆了，这次准备好了": "<<garousal>><<arousal 98>>",
          // "连发洗澡高潮，姐妹你太懂了吧": "<<garousal>><<arousal 92>><<lstress>><<stress -18>><<lcontrol>><<control +12>>",
          // "浴室又湿又滑的样子我脑补了，啊啊啊": "<<garousal>><<arousal 88>><<llstress>><<stress -22>>",
          // "上篇热门不是白来的，继续保持": "<<garousal>><<arousal 80>><<ltrauma>><<trauma -8>><<control +10>>",
          // "洗澡澡❤️ x2，粉丝福利懂的都懂": "<<garousal>><<arousal 85>><<llstress>><<stress -25>>",

          // // 负面 10条（因为连发+上篇火了，嫉妒/厌恶更强烈，加压加创减控幅度更大）
          // "又来？上篇就够恶心了还连发，贱不贱啊": "<<gggstress>><<stress 30>><<ggtrauma>><<trauma 20>>",
          // "热门了就飘了？臭婊子真把自己当回事": "<<ggstress>><<stress 24>><<gtrauma>><<trauma 15>><<ggcontrol>><<control -20>>",
          // "天天洗澡发骚，现实里没人要吧这么饥渴": "<<ggstress>><<stress 22>><<ggtrauma>><<trauma 18>>",
          // "连着两篇浴室自慰，变态到没救了": "<<gstress>><<stress 18>><<gtrauma>><<trauma 14>>",
          // "上篇热门都是些什么垃圾在看，恶心": "<<ggstress>><<stress 26>>",
          // "又洗又高潮，活该一辈子躲浴室发浪": "<<gggstress>><<stress 28>><<gcontrol>><<control -18>>",
          // "贱货曝光狂，连发还带阅读量炫耀？": "<<gstress>><<stress 20>><<ggtrauma>><<trauma 16>>",
          // "这么不要脸的东西也配有粉丝？吐了": "<<ggstress>><<stress 25>>",
          // "上篇就看吐了，这次还敢来，滚远点": "<<ggstress>><<stress 22>><<gtrauma>><<trauma 12>><<gcontrol>><<control -15>>",
          // "婊子就是婊子，洗澡都能整成系列": "<<gstress>><<stress 16>><<ggcontrol>><<control -22>>",

          // // 中立 10条（惊讶/调侃/数据党/吃瓜，因为上篇火了，评论会带点“续集”“数据”元素）
          // "又是洗澡高潮，系列upupup": "<<garousal>><<arousal 38>><<lstress>><<stress -6>>",
          // "大家都很会冲嘛": "<<garousal>><<arousal 40>>",
          // "浴室连载是吧？下一集什么时候": "<<garousal>><<arousal 35>><<lcontrol>><<control -8>>",
          // "上篇我贡献了好几遍，这次继续支持": "<<garousal>><<arousal 42>>",
          // "洗澡澡x2，进度条拉满": "<<garousal>><<arousal 36>>",
          // "这算不算浴室主题挑战赛": "<<garousal>><<arousal 32>>",
          // "上篇火成这样，这次画面感更强了吧": "<<garousal>><<arousal 48>><<lstress>><<stress -8>>",
          // "数据党路过，阅读量继续涨啊": "<<garousal>><<arousal 40>>"
        }
    },
    "31d15586-9bb9-432e-a336-bb52006f0304": {
        msg: "不想上学呀~想上你❤️",
        taskDesc: "穿着<span class='teal'>校服裙且不穿内裤</span>在<span class='gold'>学校</span>登上天台",
        risk: 20,
        fames: ["exhibitionism"],
        conditions: {
          passage: "School Roof",
          $: () => {
            return V.worn.lower.name === "school skirt" && V.worn.under_lower.name === "naked"
          },
        },
        comments: {
          "这是我们学校吗？": "<<garousal>><<arousal 30>>",
          "我出一块赌她没有穿内裤": "<<garousal>><<arousal 30>>",
          "就是这个校服最对味！": "<<llstress>><<stress -3>>",
          "天呐是我最喜欢的校服！！！": "<<garousal>><<arousal 30>>",
          "一直想草一个女学生": "<<ggarousal>><<arousal 100>>",
          "JK爱好者是这样的": "",
          "真牛逼不会着凉吗？": "<<garousal>><<arousal 30>><<lstress>><<stress -1>>",

          "婊子，不要在我的学校发骚": "<<gstress>><<stress 1>>",

          "逆天文案": "<<garousal>><<arousal 30>>",

          "↓": [
            [
              ["楼主是学生我吃，cosplay吧", "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>"],
              ["想吃直说", "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>"],
              ["学生哪有这么骚的", "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>"],
              ["没上过学就别叫了，谁不知道女学生都是小婊子", "<<ggstress>><<stress 3>><<ggtrauma>><<trauma 10>>"]
            ], [
              ["不如女仆装", "<<garousal>><<arousal 30>>"],
              ["谁问你了", "<<lstress>><<stress -1>>"]
            ], [
              ["我下的任务", ""],
              ["我指使的", ""],
              ["我寻思着我养的狗应该只有我一个主人啊", "<<garousal>><<arousal 30>><<gstress>><<stress 1>>"]
            ]
          ]
          

          // // 正面 10条（夸暴露、色情、胆大，减压减创增控，强调刺激/可爱/会玩）
          // "这裙子一坐开，下面肯定是真空的吧？太他妈会了😈": "<<garousal>><<arousal 100>><<lllstress>><<stress -30>><<ltrauma>><<trauma -12>>",
          // "学校楼梯间玩这么大，心跳加速我替你了": "<<garousal>><<arousal 95>><<llstress>><<stress -24>>",
          // "校服+无内+随时被看到，纯度极高的暴露狂": "<<garousal>><<arousal 98>><<lllcontrol>><<control +20>>",
          // "腿张开一点点就全露了，救命好想冲上去": "<<garousal>><<arousal 100>>",
          // "这姿势坐着等被发现？小骚货胆子真肥": "<<garousal>><<arousal 90>><<lstress>><<stress -18>><<ltrauma>><<trauma -10>>",
          // "楼梯间play懂的都懂，姐妹你太懂氛围了": "<<garousal>><<arousal 85>><<llstress>><<stress -22>>",
          // "校服裙这么短，风一吹就走光了吧可爱死了": "<<garousal>><<arousal 88>><<lcontrol>><<control +15>>",
          // "随时有人上来看到下面，刺激拉满yyds": "<<garousal>><<arousal 92>>",
          // "不想上学想上你？这文案直接把我干硬了": "<<garousal>><<arousal 100>><<llstress>><<stress -25>>",
          // "这张图光看就湿了，学校暴露天花板": "<<garousal>><<arousal 96>><<ltrauma>><<trauma -8>>",

          // // 负面 10条（骂贱、变态、丢人、道德审判，加压加创减控，强调学校/未成年感更重）
          // "学校里发这种？贱到没边了，滚出校园": "<<gggstress>><<stress 30>><<ggtrauma>><<trauma 22>>",
          // "穿校服不穿内裤坐楼梯间，变态婊子一个": "<<ggstress>><<stress 28>><<ggcontrol>><<control -25>>",
          // "这么不要脸的东西也敢在学校拍？恶心死": "<<gggstress>><<stress 32>><<ggtrauma>><<trauma 20>>",
          // "装什么清纯校花，下面真空还敢坐台阶": "<<ggstress>><<stress 26>>",
          // "被看到就活该，贱货就该被全校围观": "<<ggstress>><<stress 24>><<gtrauma>><<trauma 18>>",
          // "学校是让你发骚的地方？真tm下贱": "<<gggstress>><<stress 30>><<gcontrol>><<control -20>>",
          // "这种货色拍出来发网上，父母知道得气死": "<<ggstress>><<stress 22>><<ggtrauma>><<trauma 16>>",
          // "暴露狂还带校服滤镜，恶心巴拉": "<<ggstress>><<stress 25>>",
          // "随时有人上来看到你逼？活该被轮": "<<gggstress>><<stress 28>><<ggcontrol>><<control -22>>",
          // "校服穿成这样，干脆退学去卖吧": "<<ggstress>><<stress 20>><<gtrauma>><<trauma 15>>",

          // // 中立 10条（吃瓜、猜测、调侃、氛围党，主要是arousal，偶尔小幅正负波动，强调“猜有没有穿”“随时被看到”）
          // "这裙子这么短，真的没穿内裤吗？赌五毛有": "<<garousal>><<arousal 45>>",
          // "楼梯间坐着这姿势，下一秒有人上来就完蛋": "<<garousal>><<arousal 40>><<lstress>><<stress -8>>",
          // "学校暴露经典场景，氛围拉满": "<<garousal>><<arousal 38>>",
          // "文案不想上学想上你，绝了哈哈哈": "<<garousal>><<arousal 35>><<lcontrol>><<control -6>>",
          // "光看腿就知道下面危险了，刺激": "<<garousal>><<arousal 42>>",
          // "有没有人上去过？好奇后续": "<<garousal>><<arousal 30>>",
          // "校服+楼梯间=标准本子剧情": "<<garousal>><<arousal 36>><<ltrauma>><<trauma -4>>",
          // "坐姿这么暧昧，肯定是真空的吧": "<<garousal>><<arousal 48>>",
          // "随时被看到的风险感，这张图懂的": "<<garousal>><<arousal 40>><<lstress>><<stress -6>>",
          // "赌一包辣条：她下面是光的": "<<garousal>><<arousal 44>>"
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
          "不得了不得了，你一定是一个很欠肏的婊子": "<<garousal>><<arousal 100>><<gstress>><<stress 6>>",
          "就喜欢被淫液布满的胴体，楼主真是人体艺术模范吧": "<<garousal>><<arousal 30>>",

          "↓": [
            [
              ["我就知道楼主会走上这条路", "<<gstress>><<stress 1>>"],
              ["本来就是干这个的吧", "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>"],
              ["贱货一个，出来卖都亏", "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>"]
            ], [
              ["早知道楼主这么容易被干我就不弯弯绕绕的了", "<<garousal>><<arousal 30>><<gstress>><<stress 1>>"],
              ["早都被我开发好了", "<<garousal>><<arousal 30>><<gstress>><<stress 1>>"],
              ["我知道楼主每天的行动路线，跟我一起蹲", "<<ggstress>><<stress 3>>"],
              ["早就在小巷里草了100遍了", "<<garousal>><<arousal 30>><<gstress>><<stress 1>>"]
            ], [
              ["楼主嘴里一次性至少要塞三根牛子才能满足", "<<ggarousal>><<arousal 100>>"],
              ["骗你的没这么少", "<<garousal>><<arousal 30>>"],
              ["骗你的下面也要三根", "<<garousal>><<arousal 30>>"],
              ["都被你们撑开了那我玩什么？", "<<lcontrol>><<control -1>>"],
              ["你自己对着照片导导得了", "<<ltrauma>><<trauma -3>>"]
            ], [
              ["看来普通的性爱已经无法满足这婊子了", "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>"],
              ["扣的不够狠导致的", "<<garousal>><<arousal 30>>"],
              ["都怪你这种小弔满足不了楼主", "<<garousal>><<arousal 30>>"],
              ["我去还有无能的丈夫", "<<ltrauma>><<trauma -3>>"],
              ["太精彩了", ""]
            ],  [
              ["楼主还有哪些部位没被用过？", "<<gstress>><<stress 1>>"],
              ["明知故问，早都开发好了", "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>"]
            ], [
              ["楼主要被灌成泡芙了吧", "<<ggarousal>><<arousal 100>>"],
              ["楼主一万杀死亿万精兵", "<<llstress>><<stress -3>><<ltrauma>><<trauma -3>>"],
              ["其实全是我射的", "<<gstress>><<stress 1>>"],
              ["fw才射这么点", "<<llstress>><<stress -3>>"]
            ]
          ]

          // // 正面 10条（狂热色情、夸浪、羡慕、推氛围，极高 arousal + 大幅减压减创增控，因为 risk 100 越极端越爽的心理）
          // "这么多人轮着上，爽到飞起吧？画面太他妈顶了😈💦": "<<garousal>><<lllarousal>><<arousal 100>><<lllstress>><<stress -40>><<ltrauma>><<trauma -20>><<lllcontrol>><<control +30>>",
          // "妓院群P天花板，姐妹你直接封神了": "<<garousal>><<arousal 100>><<llstress>><<stress -35>>",
          // "脱衣舞跳到被轮奸，流程完美，爱死这种堕落感": "<<garousal>><<arousal 98>><<lllcontrol>><<control +25>>",
          // "被一群人同时插满的感觉我替你高潮了": "<<garousal>><<arousal 100>><<llstress>><<stress -30>><<ltrauma>><<trauma -15>>",
          // "这才是真正的妓女play，风险100直接爆表yyds": "<<garousal>><<arousal 95>>",
          // "观众冲上去群奸那一刻我鸡巴硬爆，求后续": "<<garousal>><<arousal 100>><<llstress>><<stress -38>>",
          // "这么多人一起上你，骚穴肯定被干肿了吧好爽": "<<garousal>><<arousal 99>><<lcontrol>><<control +20>>",
          // "脱到全裸然后被轮，标准顶级暴露+群交": "<<garousal>><<arousal 96>><<llstress>><<stress -32>>",
          // "哎呀哎呀叫得真贱，爱了，继续被操": "<<garousal>><<arousal 100>><<ltrauma>><<trauma -18>>",
          // "妓院群奸现场直播感拉满，射了三发了": "<<garousal>><<arousal 97>><<llstress>><<stress -28>><<lllcontrol>><<control +28>>",

          // // 负面 10条（极端厌恶、道德审判、辱骂更重，因为 risk 100 + 群奸 + 妓院，攻击性拉满，加压加创减控也最狠）
          // "贱到这种地步，妓院里被轮奸还发出来炫？下贱畜生": "<<ggggstress>><<stress 40>><<gggtrauma>><<trauma 30>><<gggcontrol>><<control -35>>",
          // "被一群臭男人轮着操还叫得这么骚，活该烂逼": "<<gggstress>><<stress 35>><<ggtrauma>><<trauma 25>>",
          // "脱衣舞跳成群P婊子，真他妈不要脸到极点": "<<gggstress>><<stress 38>><<gggcontrol>><<control -30>>",
          // "这种垃圾货色也就配在妓院被轮，恶心透顶": "<<ggggstress>><<stress 42>>",
          // "被这么多人上还发帖，父母看到得自杀吧贱货": "<<gggstress>><<stress 36>><<ggtrauma>><<trauma 28>>",
          // "妓女都不如你下贱，被轮奸还这么开心？变态": "<<ggstress>><<stress 32>><<gggcontrol>><<control -32>>",
          // "一群人一起插你逼和嘴，活该得性病烂死": "<<gggstress>><<stress 40>><<ggtrauma>><<trauma 30>>",
          // "脱光了求操的母狗，滚去垃圾堆里发骚": "<<ggggstress>><<stress 45>><<gggcontrol>><<control -38>>",
          // "风险100的群奸婊，现实里就是街头拉客货": "<<gggstress>><<stress 34>>",
          // "这么多人轮你你还浪叫，彻底没救的烂婊": "<<ggstress>><<stress 30>><<ggtrauma>><<trauma 22>><<ggcontrol>><<control -28>>",

          // // 中立 10条（震惊、吃瓜、调侃、技术向、氛围分析，arousal 中高，偶尔小波动，强调“群”“多人”“妓院”“轮奸”规模）
          // "妓院群奸？这规模也太夸张了吧…": "<<garousal>><<arousal 60>>",
          // "脱衣舞直接转群P，剧情反转够狠": "<<garousal>><<arousal 55>><<lstress>><<stress -10>>",
          // "观众从看跳舞到冲上去轮，流程丝滑": "<<garousal>><<arousal 58>>",
          // "这么多人一起上，体力够吗姐妹？": "<<garousal>><<arousal 50>><<lcontrol>><<control -12>>",
          // "风险100不是白给的，这张图直接爆炸": "<<garousal>><<arousal 65>>",
          // "妓院设定+群奸，纯度拉满的本子既视感": "<<garousal>><<arousal 62>><<ltrauma>><<trauma -8>>",
          // "被轮的时候还在叫哎呀哎呀，太会演了": "<<garousal>><<arousal 57>>",
          // "多少人一起？目测至少七八个起": "<<garousal>><<arousal 52>>",
          // "从舞台跳舞到被按地上群插，氛围绝了": "<<garousal>><<arousal 60>><<lstress>><<stress -15>>",
          // "这属于终极暴露+多人play了吧，牛": "<<garousal>><<arousal 64>>"
        }
    },
    "4c5fcd71-92b5-4974-badd-6a1b2de9d8b6": {
        msg: "wataa",
        taskDesc: "在<span class='gold'>宅邸街</span>进行<span class='teal'>裸露下体或者全裸的露出活动</span>",
        risk: 60,
        fames: ["exhibitionism"],
        conditions: {
          passage: "Domus Street",
          exposed: 2
        },
        comments: {
          "尺度有点大啊！！😱 ": "<<garousal>><<arousal 100>>",
          "这么刺激吗": "<<garousal>><<arousal 100>><<lstress>><<stress -6>><<gcontrol>><<control 6>>",

          "↓": [
            [
              ['我下的任务', ''],
              ['我去还有露出挑战', "<<garousal>><<arousal 30>>"]
            ], [
              ['楼主下面这不塞个跳蛋？', "<<garousal>><<arousal 30>>"],
              ['一边走一边高潮……', "<<ggarousal>><<arousal 100>>"],
              ['在等路人的大基霸超她', "<<ggarousal>><<arousal 100>>"]
            ], [
              ["楼主真不怕被看光啊", "<<garousal>><<arousal 30>>"],
              ['楼主就是干这行的', "<<gtrauma>><<trauma 3>>"],
              ['早都被看光了不知道多少次', "<<gtrauma>><<trauma 3>>"]
            ]
          ]

          // // 正面 10条（狂热夸赞暴露程度、身材、胆量，risk 60 所以刺激感很强，减压减创增控幅度较大）
          // "直接全裸下半身在街上晃？胆子爆表了姐妹😈🔥": "<<garousal>><<lllarousal>><<arousal 100>><<lllstress>><<stress -35>><<ltrauma>><<trauma -18>><<lllcontrol>><<control +28>>",
          // "全裸走街，这他妈才是真·暴露狂": "<<garousal>><<arousal 98>><<llstress>><<stress -30>>",
          // "高级骚货认证": "<<garousal>><<arousal 95>><<lllcontrol>><<control +25>>",
          // "光看这张就知道逼都露出来了，好想上去摸一把": "<<garousal>><<arousal 100>><<llstress>><<stress -32>>",
          // "长得这么可爱，下面却全开，纯度拉满": "<<garousal>><<arousal 97>><<ltrauma>><<trauma -15>>",
          // "全裸在街上晃荡，随时被路人看到小穴，太刺激了": "<<garousal>><<arousal 96>><<llstress>><<stress -28>><<lcontrol>><<control +20>>",
          // "身材这么好还敢露下面，街上的风景被你抢光了": "<<garousal>><<arousal 92>>",
          // "几乎全裸走街头，风一吹就全看见了吧？爱了": "<<garousal>><<arousal 99>><<llstress>><<stress -34>>",
          // "这才是露出的正确打开方式": "<<garousal>><<arousal 94>><<ltrauma>><<trauma -12>>",
          // "全露下半身，画面感爆炸，射了": "<<garousal>><<arousal 100>><<llstress>><<stress -30>>",

          // // 负面 10条（极端辱骂、道德审判、厌恶拉满，因为 risk 60 + 几乎全裸/下体全露在公共街头，攻击更狠）
          // "下贱到骨子里的母狗": "<<gggstress>><<stress 35>><<gggtrauma>><<trauma 25>><<ggcontrol>><<control -30>>",
          // "真他妈不要脸的贱货": "<<ggggstress>><<stress 40>><<ggtrauma>><<trauma 28>>",
          // "高档街区玩这种变态暴露，活该被所有人指指点点": "<<gggstress>><<stress 38>><<gggcontrol>><<control -32>>",
          // "恶心死人的暴露狂": "<<ggstress>><<stress 32>><<ggtrauma>><<trauma 22>>",
          // "这种垃圾在街上晃荡逼，赶紧抓去警察局关起来": "<<ggggstress>><<stress 42>>",
          // "几乎全裸走街上，现实里就是拉客的婊子": "<<gggstress>><<stress 36>><<ggcontrol>><<control -28>>",
          // "露下面还这么嚣张，迟早被路人轮了活该": "<<ggstress>><<stress 34>><<gggtrauma>><<trauma 26>>",
          // "变态到在街上全露下体，父母生你出来干嘛？": "<<ggggstress>><<stress 45>><<ggtrauma>><<trauma 30>>",
          // "叫得再可爱也是街头露逼的贱种": "<<gggstress>><<stress 38>>",
          // "街上露出还发出来炫耀，彻底没救的烂货": "<<ggstress>><<stress 30>><<ggcontrol>><<control -25>>",

          // // 中立 10条（震惊、调侃、猜测、氛围吃瓜，arousal 中高，偶尔小幅正负，因为是街头暴露 + 等级2，评论会带“全露”“下体”“随时被看到”）
          // "这胆量": "<<garousal>><<arousal 65>>",
          // "街头本子即视感": "<<garousal>><<arousal 60>><<lstress>><<stress -12>>",
          // "高档街区玩这么大，路人看到不得疯？": "<<garousal>><<arousal 58>>",
          // "刺激过头了": "<<garousal>><<arousal 62>><<lcontrol>><<control -15>>",
          // "风吹一下就全看见了吧，风险感拉满": "<<garousal>><<arousal 68>>",
          // "街上这么优雅的地方被你搞成暴露现场": "<<garousal>><<arousal 55>><<ltrauma>><<trauma -10>>",
          // "下面露着还敢在街上晃，体力真好": "<<garousal>><<arousal 64>>",
          // "这张图光看姿势就知道下面危险了": "<<garousal>><<arousal 66>><<lstress>><<stress -10>>",
          // "下一秒会不会被围观": "<<garousal>><<arousal 60>>"
        }
    },
    "6596727a-7882-4665-acdc-5ad967f49360": {
        msg: "假如有一天我也戴上了颈手枷，你们会来帮我解开，还是来趁我没办法反抗狠狠地侵犯我呢？",
        taskDesc: "在<span class='gold'>峭壁街</span><span class='teal'>观察颈手枷</span>",
        risk: 1,
        fames: [],
        conditions: {
          passage: "Cliff Street Pillory"
        },
        comments: {
          "我会听话的": "<<garousal>><<arousal 100>>",
          "你猜呢？": "<<garousal>><<arousal 50>><<lstress>><<stress -6>>",

          // 正面 10条（色情幻想向、鼓励侵犯、夸性感/贱、推堕落感，risk低但带幻想，所以 arousal 高 + 减压减创增控，强调“想被侵犯”“求虐”反差）
          "当然是趁你动不了狠狠操你啊，小贱货戴上枷就该被轮": "<<garousal>><<lllarousal>><<arousal 100>><<llstress>><<stress -30>><<ltrauma>><<trauma -15>><<lllcontrol>><<control +25>>",
          "帮你解开？开什么玩笑，先把你操到哭着求饶再说": "<<garousal>><<arousal 98>><<llstress>><<stress -28>>",
          "这姿势戴枷太色了，嘴巴和下面都空着等用呢": "<<garousal>><<arousal 100>><<lllcontrol>><<control +22>>",
          "一脸不屑？等我过去就把你操到满脸精液求解开": "<<garousal>><<arousal 95>><<llstress>><<stress -32>>",
          "够轮好几轮了，姐妹你这是自愿求操吧": "<<garousal>><<arousal 97>><<ltrauma>><<trauma -12>>",
          "颈手枷play懂的都懂，先口爆再后入，标准流程": "<<garousal>><<arousal 96>><<llstress>><<stress -25>><<lcontrol>><<control +20>>",
          "这么性感被锁着，路人看了谁不想上去干一炮": "<<garousal>><<arousal 99>>",
          "不屑的表情最带感，操到你哭着叫主人解开": "<<garousal>><<arousal 94>><<llstress>><<stress -30>>",
          "帮解开是不可能的，侵犯到你腿软站不起来才对": "<<garousal>><<arousal 100>><<ltrauma>><<trauma -18>>",
          "戴枷的你就是公共肉便器，来人就操，爽翻天": "<<garousal>><<arousal 98>><<llstress>><<stress -35>>",

          // 负面 10条（道德审判、厌恶、辱骂，risk低所以攻击偏“贱”“丢人”“活该被看”，加压加创减控中等强度）
          "这么贱戴颈手枷还发出来问？活该被围观羞辱": "<<ggstress>><<stress 25>><<gtrauma>><<trauma 18>><<gcontrol>><<control -20>>",
          "一脸不屑？现实里就是欠操的婊子，被锁着还装": "<<ggstress>><<stress 22>><<ggtrauma>><<trauma 15>>",
          "被围观还问要不要侵犯，下贱到没救了": "<<gstress>><<stress 20>>",
          "公共颈手枷里发这种文案，真他妈不要脸": "<<ggstress>><<stress 24>><<gcontrol>><<control -18>>",
          "性感个屁，就是街头暴露狂，活该被嘲笑": "<<ggstress>><<stress 18>><<gtrauma>><<trauma 14>>",
          "戴枷还幻想被侵犯？变态到这种地步恶心": "<<gstress>><<stress 22>><<ggcontrol>><<control -22>>",
          "围观的人都在笑你，你还问侵犯？贱货本色": "<<ggstress>><<stress 20>>",
          "锁着让人看逼看奶，父母知道得多丢人": "<<ggstress>><<stress 26>><<gtrauma>><<trauma 16>>",
          "这种货色就该一直锁着，让全镇人吐口水": "<<gstress>><<stress 19>>",
          "不屑？等真被轮了你就知道哭了，婊子": "<<ggstress>><<stress 23>><<gcontrol>><<control -20>>",

          // 中立 10条（吃瓜、调侃、幻想分析、围观视角，arousal 中等，偶尔小幅波动，强调“9小时”“不屑表情”“围观”“会不会被侵犯”）
          "这时间够围观群众轮流玩了": "<<garousal>><<arousal 50>>",
          "一脸不屑被锁颈手枷，下一秒会不会被摸": "<<garousal>><<arousal 45>><<lstress>><<stress -8>>",
          "这姿势嘴巴正好对着路人高度，懂的都懂": "<<garousal>><<arousal 48>>",
          "帮解开还是侵犯？兄弟们选侵犯的举手": "<<garousal>><<arousal 52>><<lcontrol>><<control -10>>",
          "小镇公共颈手枷经典场景，氛围拉满": "<<garousal>><<arousal 55>>",
          "性感女孩被锁，围观群众已经在笑了": "<<garousal>><<arousal 42>><<ltrauma>><<trauma -6>>",
          "不屑的表情配上枷锁，反差萌有点带感": "<<garousal>><<arousal 46>>",
          "会不会真有人上去侵犯？好奇后续": "<<garousal>><<arousal 50>>",
          "这张图光看就知道她动不了，风险感不错": "<<garousal>><<arousal 44>><<lstress>><<stress -10>>",
          "问帮解开还是侵犯，答案不是明摆着吗": "<<garousal>><<arousal 48>>"
        }
    },
    "asdsds1z1-92b5-4974-badd-6a1b2de9d8b6": {
        msg: "超级可爱的狗狗们！下次大家在路边遇到也要好好善待没有家的狗狗哦~",
        taskDesc: "在<span class='gold'>海星街 流浪狗收容所</span><span class='teal'>给狗子喂食</span>",
        risk: 40,
        fames: ["good"],
        conditions: {
          passage: "Pound Work Feed",
        },
        comments: {
          "它们好可爱呀": "<<lstress>><<stress -6>>",
          "下面那只狗狗咋了？好可怜": "",
          "它们是流浪狗吗？": "",
          "这里好像是沙滩那边的狗狗收容所，我上次去看过。不过那里的工资好像不太多": "",
          "你们这些人真是的，难道只有我一个人关注到这位美丽的女士才是最可爱的吗？": "<<lstress>><<stress -6>><<ltrauma>><<trauma -6>>",
          "善良又开朗的女孩，我爱上了": "<<lstress>><<stress -6>><<ltrauma>><<trauma -6>>",

          // 正面 10条（温暖、感动、夸善良、鼓励爱心，fames["good"] 所以大幅减压减创增控，arousal 极低或无，突出治愈/正能量）
          "看到你喂狗狗的样子真的好暖心，谢谢你这么善良": "<<llstress>><<stress -30>><<ltrauma>><<trauma -15>><<lllcontrol>><<control +25>>",
          "这些小家伙吃得这么开心，肯定超级幸福！": "<<llstress>><<stress -28>><<ltrauma>><<trauma -12>>",
          "超级可爱+超级温柔，世界需要更多像你这样的人": "<<llstress>><<stress -32>><<lllcontrol>><<control +22>>",
          "流浪狗遇到你就是上辈子修来的福气，太感动了": "<<llstress>><<stress -35>>",
          "喂食的动作好温柔，小狗狗们尾巴都摇疯了": "<<llstress>><<stress -30>><<ltrauma>><<trauma -10>>",
          "这才是真正的爱心啊，姐妹你真的好棒！": "<<llstress>><<stress -25>><<lllcontrol>><<control +20>>",
          "看到狗狗们吃饱的样子，心都化了，谢谢分享": "<<llstress>><<stress -28>>",
          "善良到爆表，下次我也去收容所帮忙！": "<<llstress>><<stress -30>><<ltrauma>><<trauma -14>>",
          "超级治愈的一幕，生活因为你变美好了一点": "<<llstress>><<stress -32>>",
          "小狗狗们好幸运有你，愿所有流浪动物都遇见好人": "<<llstress>><<stress -35>><<lllcontrol>><<control +25>>",

          // 负面 10条（少量酸/阴阳/质疑动机、冷嘲热讽，因为 fames["good"] 但 risk 40 有一定曝光，攻击偏“作秀”“伪善”，加压加创减控中等）
          "又来收容所拍照发善心？作秀给谁看啊": "<<gstress>><<stress 20>><<gtrauma>><<trauma 12>><<gcontrol>><<control -15>>",
          "喂个狗就感动全世界？现实里你帮过几只": "<<gstress>><<stress 18>>",
          "这些狗狗吃饱了你开心了，伪善的爱心表演": "<<gstress>><<stress 22>><<gtrauma>><<trauma 10>>",
          "摆拍收容所也太刻意了吧": "<<gstress>><<stress 20>>",
          "善良？不过是想刷存在感罢了，恶心": "<<gstress>><<stress 15>><<gcontrol>><<control -12>>",
          "狗狗们可怜，你发帖更可怜，求关注": "<<gstress>><<stress 18>><<gtrauma>><<trauma 8>>",
          "下次遇到流浪狗你真会管？别光嘴上说": "<<gstress>><<stress 16>>",
          "收容所喂狗还带滤镜，假惺惺的善良": "<<gstress>><<stress 19>><<gcontrol>><<control -10>>",
          "感动自己感动别人，戏精本精": "<<gstress>><<stress 17>>",
          "这些狗狗要是知道你在发帖炫耀，会不会吐": "<<gstress>><<stress 20>><<gtrauma>><<trauma 11>>",

          // 中立 10条（惊讶、调侃、观察、鼓励或好奇，arousal 低，偶尔小幅正负波动，突出狗狗可爱/收容所氛围/呼吁善待）
          "小狗狗们吃得真香，好治愈的一幕": "<<lstress>><<stress -8>>",
          "海星街收容所的狗狗看起来都好乖啊": "",
          "喂食的姿势好温柔，狗狗尾巴摇成风扇了": "<<ltrauma>><<trauma -6>>",
          "下次路过我也试试喂喂看，感觉不错": "",
          "这些小家伙眼睛亮晶晶的，太可爱了": "<<lstress>><<stress -10>>",
          "喂狗也算冒险？哈哈保护动物不容易": "",
          "超级可爱的狗狗+超级可爱的你，画面满分": "<<lcontrol>><<control -5>>",
          "呼吁大家善待流浪狗，赞同！": "",
          "收容所日常好温馨，谢谢分享正能量": "<<lstress>><<stress -6>>",
          "狗狗们吃饱了会不会梦到你啊，哈哈": ""
        }
    },
    "as22s1s11-92b5-4974-badd-6sdsasz12a16": {
        msg: "感谢大家的多多支持~",
        taskDesc: "在<span class='gold'>康努达塔斯街</span><span class='teal'>租一个小摊并卖出你的商品</span>",
        risk: 40,
        fames: ["business"],
        conditions: {
          passage: "Stall Sell",
          stall_money非: 0
        },
        comments: {
          "摊位生意火爆啊！支持小老板继续冲，赚大钱！": "<<llstress>><<stress -30>><<ltrauma>><<trauma -15>><<lllcontrol>><<control +25>>",
          "这么快就卖光了？商业头脑太强了，佩服佩服": "<<llstress>><<stress -28>><<lllcontrol>><<control +22>>",
          "感谢支持的都是真爱粉，小摊越开越大吧": "<<llstress>><<stress -32>>",
          "看到你忙着招呼客人超有成就感，加油创业！": "<<llstress>><<stress -30>><<ltrauma>><<trauma -12>>",
          "商品卖得这么好，证明你真的很会经营": "<<llstress>><<stress -35>><<lllcontrol>><<control +28>>",
          "小摊位也能玩出花，支持你下次开大店！": "<<llstress>><<stress -25>><<ltrauma>><<trauma -10>>",
          "感谢大家？应该我们感谢你带来这么棒的商品": "<<llstress>><<stress -28>>",
          "生意兴隆财源广进，小老板前途无量": "<<llstress>><<stress -32>><<lllcontrol>><<control +25>>",
          "卖得这么快，下批货准备好了吗？继续支持": "<<llstress>><<stress -30>>",
          "从租摊到爆单，创业女孩太励志了！": "<<llstress>><<stress -35>><<ltrauma>><<trauma -18>>",

          // 负面 10条（酸成功、阴阳怪气、质疑质量/动机、嫉妒生意好，加压加创减控中等强度，偏商业黑/喷子风格）
          "卖得这么好？东西不会是地摊货吧，亏我买了": "<<gstress>><<stress 20>><<gtrauma>><<trauma 12>><<gcontrol>><<control -15>>",
          "感谢支持？不就是靠卖惨营销吗，恶心": "<<gstress>><<stress 18>>",
          "小摊生意火成这样，肯定刷单了吧假的": "<<gstress>><<stress 22>><<gtrauma>><<trauma 10>>",
          "商品也就那样，粉丝太多捧臭脚了": "<<gstress>><<stress 19>>",
          "租摊卖东西还发帖炫耀，求关注求同情？": "<<gstress>><<stress 16>><<gcontrol>><<control -12>>",
          "支持你？东西贵得离谱，纯割韭菜": "<<gstress>><<stress 20>><<gtrauma>><<trauma 8>>",
          "生意好就飘了？下次别涨价啊黑心老板": "<<gstress>><<stress 17>>",
          "感谢大家？感谢我们钱包吧，呵呵": "<<gstress>><<stress 21>><<gcontrol>><<control -10>>",
          "小摊位都能卖爆，背后肯定有猫腻": "<<gstress>><<stress 18>>",
          "创业？就是卖点破烂还想当女强人，笑死": "<<gstress>><<stress 23>><<gtrauma>><<trauma 14>>",

          // 中立 10条（惊讶销量、调侃生意、好奇商品、围观支持或建议，arousal 低，偶尔小幅正负，突出摊位/商品/感谢氛围）
          "小摊卖得这么快？什么商品这么受欢迎": "<<lstress>><<stress -8>>",
          "感谢支持的大家，场面好热闹啊": "",
          "租摊创业不容易，看到卖光超开心": "<<ltrauma>><<trauma -6>>",
          "下次摊位开在哪里？想去捧场看看": "",
          "生意这么好，商品肯定有独到之处": "<<lstress>><<stress -10>>",
          "从感谢大家看出来你很用心，加油": "",
          "小摊位也能这么多人围，氛围不错": "<<lcontrol>><<control -5>>",
          "卖出商品的感觉怎么样？成就感爆棚吧": "",
          "感谢支持的粉丝真多，摊主好人缘": "<<lstress>><<stress -6>>",
          "好奇你卖的是啥，下次发个商品照": ""
        }
    },
    "Sydney/7121c738-bc5a-41e1-bd2e-3bbbbce37cea": {
        msg: "好可爱的小悉尼~（拿着我的手机自拍不知道怎么删。那就只能发出来了ya~",
        taskDesc: "在学校图书馆柜台充电有几率完成",
        risk: 40,
        hide: true,
        uncommon: true,
        fames: [],
        conditions: {},
        comments: {
          "自拍都不会是铸币吗": "<<gstress>><<stress 1>>",
          "↓": [
            [
              ["这张脸长得真漂亮", "<<lstress>><<stress -1>><<ltrauma>><<trauma -3>>"],
              ["没楼主漂亮", "<<llstress>><<stress -3>><<lltrauma>><<trauma -10>>"],
              ["没我漂亮", ""],
              ["谁问你了？", ""],
              ["一般吧，这颜值都敢发出来？", ""]
            ], [
              ["美人归我了，楼主一边去", "<<lstress>><<stress -1>>"],
              ["不行别和我抢", ""],
              ["脑婆脑婆恰个v", "<<gcontrol>><<control 1>>"],
              ["这种烂货都有人要？", "<<ggstress>><<stress 3>>"]
            ], [
              ["是学生吗？看起来就很优秀", "<<llstress>><<stress -3>>"],
              ["我在学校见过这人", ""],
              ["一直想超一个学生", "<<ggstress>><<stress 3>>"],
              ["礼顿的狗罢了", "<<ggstress>><<stress 3>>"]
            ], [
              ["楼主和这人什么关系", ""],
              ["我先猜，肯定是情侣", "<<llstress>><<stress -3>><<lltrauma>><<trauma -10>>"],
              ["我先猜，肯定是炮友", "<<garousal>><<arousal 30>>"],
              ["真心住院天下有情人终成兄妹", ""]
            ], [
              ["啊啊啊啊啊啊宝宝你是一个香香软软可可爱爱中间忘了后面忘了总之啊啊啊啊啊啊", "<<lstress>><<stress -1>>"],
              ["啊啊啊啊啊啊宝宝你是一个宝宝", ""]
            ], [
              ["剧本罢了", "<<gstress>><<stress 1>>"],
              ["作秀真恶心", "<<gstress>><<stress 1>>"],
              ["那咋了？", ""]
            ], [
              ["我来给大家介绍一下，这是我们镇学校的傻逼图书管理员", "<<ggstress>><<stress 3>><<ggtrauma>><<trauma 10>>"],
              ["不喜欢就划走，叫什么叫", "<<lstress>><<stress -1>><<ltrauma>><<trauma -3>>"],
              ["仗着自己是教师子女，攀关系当的官而已", "<<gstress>><<stress 1>>"],
              ["我上次还被这傻逼用尺子打了", "<<ggstress>><<stress 3>>"]
            ], [
              ["上次还看到这人光着屁股被礼顿打", "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>"],
              ["我也想打，一听就很涩", "<<garousal>><<arousal 30>><<gstress>><<stress 1>>"],
              ["私底下早被调好了", "<<gstress>><<stress 1>>"],
              ["楼主和礼顿谁是牛头人", "<<gstress>><<stress 1>>"]
            ], [
              ["这么漂亮的脸不知道被衍射过几次", "<<ggarousal>><<arousal 100>><<gstress>><<stress 1>>"], 
              ["我干的", "<<garousal>><<arousal 30>>"],
              ["我也干了", "<<garousal>><<arousal 30>>"],
              ["想看被衍射版的，楼主gkd", "<<garousal>><<arousal 30>><<gstress>><<stress 1>>"]
            ]
          ]
        }
    },

    // 投稿
    "submission-1772804166165-662370930": {
        msg: "几步就能搞定的简单又美味的美食教程它来啦！昨天剩下的食材不要扔，裹上鸡蛋液，撒上面包糠，炸至金黄，隔壁小孩都馋哭了！ 当然，本贴所有收益都将用于改善孤儿的生活质量，所以还希望各位观众朋友们多多支持哦！",
        taskDesc: "在<span class='gold'>孤儿院厨房</span><span class='teal'>制作任意一种食物</span>",
        risk: 40,
        fames: ["social", "good", "business"],
        conditions: {
          $makingRecipe: true,
          passage: "Kitchen"
        },
        comments: {
          "看起来好好吃😍今天晚上回家我也试一下": "<<llstress>><<stress -30>>",
          "支持支持，希望孤儿们能得到更好的生活🙏": "<<llstress>><<stress -30>>",
          "我看是借着美食的名义发骚，这不是穿条围裙就来勾引人了吗？": "<<gstress>><<stress +15>><<garousal>><<arousal 30>>",

          "↓" : [
            [
              ["呵呵，不敢露脸，谁知道正脸是不是丑八怪啊",  "<<gstress>><<stress +15>>"],
              ["前面的是纯喷子吧😓虽然看不到正脸，但是小姐姐这么善良，一定很漂亮的❤️", "<<llstress>><<stress -30>>"],
              ["就是就是！", "<<llstress>><<stress -30>>"],
            ]
          ],
        }
    },
    "submission-1772794747373": {
        msg: "神明啊，您能感受到我的诚意吗",
        taskDesc: "在<span class='gold'>神殿</span><span class='teal'>为救赎祈祷</span>",
        risk: 20,
        fames: ["good"],
        conditions: {
          passage: "Temple Pray"
        },
        comments: {
          "神圣而又美丽呀": "<<lstress>><<stress -15>>",
          "嘿嘿，不知道那天为我净化的是不是你呢": "<<lstress>><<stress -15>>",
          "天使啊，可以赐我祝福吗": "<<lstress>><<stress -15>>",
          "要是能为我净化就好了": "<<lstress>><<stress -15>>",
          "这种亵渎起来最爽了": "<<gstress>><<stress 15>><<garousal>><<arousal 30>>",
          "看到你之后，我也想加入神殿了": "",
          "你简直就是我的偶像！": "<<lstress>><<stress -15>>",
        }
    },
    "submission-1772793749698": {
        msg: "真是恶心的流氓，活该！",
        taskDesc: "穿着<span class='gold'>高跟鞋</span>，<span class='teal'>打败强奸者</span>",
        risk: 60,
        fames: ["good"],
        conditions: {
          combat: 1,
          $:() => {
            return V.worn.feet.type.includes("heels") && V.enemyhealth <= 0
          }
        },
        comments: {
          "我靠，这也太猛了吧": "<<lstress>><<stress -15>>",
          "一看就很疼，咦咦咦": "<<lstress>><<stress -15>>",
          "看这些流氓被踩在脚下的感觉就是爽": "<<lstress>><<stress -15>>",
          "邪恶终究会被正义踩在脚下，嘿嘿": "<<lstress>><<stress -15>>",
          "这个样子，一定是被踢到那个了": "<<lstress>><<stress -15>><<garousal>><<arousal 30>>",
          "不行了，我出来了": "<<gstress>><<stress 15>><<garousal>><<arousal 30>>",
        }
    },
    "submission-1772783983529": {
        msg: "想看里面吗？可以的哦",
        taskDesc: "在床上<span class='pink'>自慰达到高潮</span>",
        risk: 1,
        fames: ["sex"],
        conditions: {
          passage: "Home Masturbation",
          $havingOrgasm: true
        },
        comments: {
          "粉粉的，好可爱呀": "<<lstress>><<stress -15>>",
          "真是个不要脸的东西": "<<gstress>><<stress 15>>",
          "臭母狗": "<<gstress>><<stress 30>><<garousal>><<arousal 30>>",
          "我打赌，这种东西根本不要钱": "<<gstress>><<stress 15>>",
          "有本事你来找我，看我不把你弄得下不了床": "<<garousal>><<arousal 30>>",
          "出门小心一点": "<<gstress>><<stress 15>><<garousal>><<arousal 30>>",
        }
    },
    "submission-1772723288215-73320694": {
        msg: "今天又是“充实”的一天，奶油面包新鲜出炉～",
        taskDesc: "穿<span class='teal'>女仆装</span>在咖啡馆制作奶油小面包",
        risk: 30,
        fames: ["exhibitionism" ,"business"],
        conditions: {
          passage: "Chef Work Masturbation",
          $: () => {
            return V.worn.upper.type.includes("maid") || V.worn.lower.type.includes("maid") || V.worn.head.type.includes("maid")
          },
        },
        comments: {
          "在哪!买爆!!!": "<<garousal>><<arousal 30>>",
          "111可以预约吗": "<<garousal>><<arousal 30>>",
          "就说怎么感觉……更好吃了": "<<garousal>><<arousal 30>>",
        }
    },
    "submission-1772762023345": {
        msg: "神明在注视着我，好兴奋～",
        taskDesc: "穿<span class='teal'>性感修女长袍</span>在神殿<span class='pink'>自慰达到高潮</span>",
        risk: 30,
        fames: ["exhibitionism" ,"sex"],
        conditions: {
          passage: "Temple Masturbation",
          $havingOrgasm: true,
          $: () => {
            return V.worn.upper.name === "sexy nun's habit" && V.worn.lower.name === "sexy nun's habit skirt"
          },
        },
        comments: {
        }
    },
    "submission-1772759964692-m": {
        msg: "给姐妹们看点好的",
        taskDesc: "在<span class='gold'>学校</span>偷拍男更衣室",
        risk: 20,
        fames: ["pimp" ,"social"],
        uncommon: true,
        conditions: {
          passage: "School Boy Changing Room",
          changingroomstate非: "empty",
        },
        comments: {
          "可以给我那个男生手机号": "",
          "这也太劲爆了吧": "",
        }
    },
    "submission-1772759964692-f": {
        msg: "给兄弟们看点好的",
        taskDesc: "在<span class='gold'>学校</span>偷拍女更衣室",
        risk: 20,
        fames: ["pimp" ,"social"],
        uncommon: true,
        conditions: {
          passage: "School Girl Changing Room",
          changingroomstate非: "empty",
        },
        comments: {
          "这也太劲爆了吧": "",
          "→": [() => V.player.gender === "f", {
            "姐妹你无敌了": "",
            "下次有本事去拍男更衣室啊姐姐": "",
          }],
          "↓": [
            [
              ["可以给我那个女生手机号吗？", ""],
              ["→", [(p) => p.quality > 400, [
                ["我去，我好像认识她", ""],
                ["快快快，我也要她电话号码，求你了哥", ""]
              ], [
                ["不行啊，太模糊了根本看不清", ""],
                ["楼主下次拍照能不能手别抖啊", ""]
              ]]],
            ],
            [
              ["→", [(p) => p.facevariant === "aloof", [
                ["好高冷的表情，爱了爱了", ""],
                ["不是，别人嫌弃你，你看不出来啊", ""],
                ["→", [(p) => p.quality < 100, [
                  ["算了算了，啥也看不到，你们也别吵了", ""]
                ]]],
              ]]],
            ],
          ]
        }
    },
    "submission-1772760217366": {
        msg: "今天拉个大的",
        taskDesc: "完成分娩",
        risk: 100,
        fames: ["pregnancy" ,"exhibitionism"],
        conditions: {
          _pregnancyBirth非: undefined,
        },
        comments: {
        }
    },
    "submission-1773407171580": {
        msg: "两只小鸟🐦",
        taskDesc: "静静欣赏孤儿院花园中的小鸟和罗宾",
        risk: 30,
        fames: ["good"],
        conditions: {
          passage: "Robin Bird Visit",
        },
        comments: {
          "@每日新鲜农产品 快来看迪士尼公主": "",
          "你不许观鸟😭👊🏻 你不许观鸟😭👊🏻 你不许观鸟😭👊🏻": "",
        }
    },
};
PhoneMod.Apps = {  // APP
    alarm: {display_name: "闹钟", icon: "img/misc/icon/birdTower/watch.png", app_widget: "phone_app_alarm", init: "initAlarm"},
    memo: {display_name: "备忘录", icon: "img/misc/icon/phone/app/memo.png", app_widget: "phone_app_memo", init: "initMemo", guide: "memo"},
    shop: {display_name: "网购", icon: "img/misc/icon/shopping_centre.png", app_widget: "phone_app_shop", disable: ["Clothing Shop", "Forest Shop", "School Library Shop", "Adult Shop Store"], disableinevent: true},

    photo: {display_name: "摄像", icon: "img/misc/icon/camera.png", app_widget: "phone_app_photo", guide: "photo"},
    album: {display_name: "相册", icon: "img/misc/icon/phone/app/album.png", app_widget: "phone_app_album", init: "initAlbum", guide: "photo"},
    yenote: {display_name: "小黄书", icon: "img/misc/icon/phone/app/yenote.png", app_widget: "phone_app_yenote", init: "initYenote", toggle: "toggleYenote", guide: "yenote"},

    contacts: {display_name: "通讯录", icon: "img/misc/icon/assignment.png", app_widget: "phone_app_contacts", guide: "contacts"},
    game: {display_name: "游戏", icon: "img/misc/icon/robin_controller.png", app_widget: "phone_app_game", disableinevent: true},
    settings: {display_name: "设置", icon: "img/misc/icon/furniture/wallpaper_cow_girls.png", app_widget: "phone_app_settings"},

    // map: {display_name: "地图", icon: "img/misc/icon/phone/app/map.png", app_widget: "phone_app_map", init: "initMap"},
    DD: {display_name: "DD打车", icon: "img/misc/icon/phone/app/DD.png", app_widget: "phone_app_DD"},
    newWest: {display_name: "美食屋", icon: "img/misc/icon/phone/app/newWest.png", app_widget: "phone_app_newWest", disableinevent: true, dlock: true},
};
PhoneMod.Contacts = [  // 联系人P
    {name: "兰德里", call: "Phone Call Landry"},
    {name: "惠特尼", call: "Phone Call Whitney"},
    {name: "艾利克斯", call: "Phone Call Alex"},
    {name: "艾弗里", call: "Phone Call Avery"},
    {name: "贝利", call: "Phone Call Bailey"},
    {name: "裁缝", call: "Phone Call Tailor"},
];
PhoneMod.PhoneModels = {  // 手机品牌
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
PhoneMod.PhoneModelsMain = [
  "Neme 12", "Neme 12 Pro", "Neme 12 Pro Max", "Mimi 17", "Photographer 3"
];


// === 常量 =======================================================
PhoneMod.热度衰减系数 = 0.1;  // 衰减系数 0.1 控制热度下降速度（可根据需求调整，如每天衰减一半则系数约为 0.03）。
PhoneMod.点赞概率百分之 = 50;
PhoneMod.评论概率百分之 = 5;
PhoneMod.打赏概率百分之 = 10;
PhoneMod.充电速度每小时 = 500;
PhoneMod.充电损害每度电比 = 0.01;
PhoneMod.DD免费等待时间 = 10;
PhoneMod.DD最大等待时间 = 30;
PhoneMod.DD等待全额费用 = 5;
PhoneMod.DD每距离费用 = 2;
PhoneMod.手机充电中被盗概率 = 0.2;
PhoneMod.手机充电中被盗地点 = ["OceanBreeze", "Library"];
PhoneMod.debugBlackVPhone = [  // Debugger中屏蔽的V.Phone变量（通常过长）
  "Settings", "ReturnWorn", "Album",
  "Yenotes" // 必须禁用，否则内部的effect会重新作用
]
PhoneMod.extraUsePhoneAreas = [  // 能够允许使用手机的额外区域
  "Shopping Centre", "Shopping Centre Top", "Commercial rooftops", "Shopping Centre Phone Shop",  // 购物商场：玩家可能刚买完手机
  "Second Phone Shop",  // 二手手机店：玩家可能刚买完手机
  "Ocean Breeze Charge", "Bedroom Charge",   // 充电区域
  "School Library",  // 图书馆充电区域
  "Bathroom",  // 刚拍完照要看看
  "Bed", "Sleep",  // 允许在床上关闭闹钟
];
PhoneMod.Comments = {  // 通用评论
    "你真美~": "<<lstress>><<stress -1>>",
    "每次看到好看的人都觉得和你有点神似，我想这世间但凡称得上美的人，都得有几分像你，不过她们又都只能像你，因为你的可爱她们学也学不来！": "<<llstress>><<stress -3>>",
    "你是与众不同的可爱，表里如一的可爱": "<<lstress>><<stress -1>>",
    "不知道为啥你要隔三差五发张自拍，要发就天天发，这是在拯救世界O(∩_∩)O": "<<llstress>><<stress -3>>",
    "不要以为自己有几分姿色就了不起，像你这种人，我见一个爱一个": "<<lstress>><<stress -1>><<ltrauma>><<trauma -3>>",
    "知道恐龙为什么灭绝吗？因为它们的前肢太短，无法为你的美貌鼓掌": "<<lstress>><<stress -1>><<ltrauma>><<trauma -3>>",
    "你在我面前永远都闪闪发光，就像整个宇宙的星光都洒在你身上": "<<llstress>><<stress -3>>",
    "我常常感到庆幸又快乐，因为我所生活的这个世界上，有像你这么好的人存在着": "<<llstress>><<stress -3>>",
    "手如柔荑，肤如凝脂，领如蝤蛴，齿如瓠犀，螓首蛾眉，巧笑倩兮，美目盼兮": "<<llstress>><<stress -3>>",
    "你的照片真棒，我不是在夸你的美貌，我只是在提醒你，多发点，我内存够用": "<<llstress>><<stress -3>>",
    "你简直是大陆颜值的标杆，即使是后脑勺也是惊人的美貌，连风和阳光都会嫉妒吧": "<<llstress>><<stress -3>>",
    "你的眼像是一望无际的星辰，一定是在你出生那天上帝把月亮捏碎了，放进了你的眼里": "<<llstress>><<stress -3>>",
    "除了窒息我没有什么要表演的": "<<llstress>><<stress -3>><<ltrauma>><<trauma -3>>",
    "看完照片后，我不敢轻易评论，我担心我庸俗不堪的语言会玷污了这世间少有的美感。但我还是评论了，我觉得如果不能在这样有美感的照片后面留下评论，那将会是一生的遗憾": "<<lstress>><<stress -1>>",

    "这么小的奶子你敢发我都不敢看": `<<insecurity "breasts_small" 1>><<ginsecurity "breasts_small">>`,
    "这么大的奶子就是出来卖的": `<<insecurity "breasts_big" 1>><<ginsecurity "breasts_big">>`,
    "你在勾引谁呢，臭婊子": "<<ggstress>><<stress 3>><<gtrauma>><<trauma 3>>",
    "粉粉嫩嫩的小骚逼，给我吃两口": "<<gstress>><<stress 1>><<lcontrol>><<control -1>>",
    "你怎么这么骚啊，贱货": "<<gstress>><<stress 1>><<gtrauma>><<trauma 3>>",
    "别发骚了，等肏呢？": "<<gstress>><<stress 1>><<lcontrol>><<control -1>>",

    "牛逼": "<<garousal>><<arousal 30>>",
    "6": "<<garousal>><<arousal 30>>",
}
PhoneMod.NicknameGenerator = {  // 网名库
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
PhoneMod.PhoneGameQuestions = {  // 小游戏题库
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
setup.LocationImages.phone = {  // 使用手机时的背景图
  folder: "phone",
  base: {default: {image: "base.png"}}
}
PhoneMod.phoneConditionLevels = [  // 手机磨损度
    { threshold: 0.8, text: "崭新出厂", color: "green" },
    { threshold: 0.6, text: "略有磨损", color: "teal" },
    { threshold: 0.4, text: "明显划痕", color: "blue" },
    { threshold: 0.2, text: "严重磨损", color: "purple" },
    { threshold: 0, text: "残破不堪", color: "red" }
];
PhoneMod.Fames = {  // 原版名声对应表
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