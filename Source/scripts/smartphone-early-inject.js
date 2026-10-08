(() => {
    window.smartphone = {};

    /* AsAPI: Start @early inject */
    window.AsAPI = { ...window.AsAPI,  // early inject
        // 用于检查对象或数组是否有效
        isvalid: function(dict) {
            if (dict instanceof Object) {
                return dict && Object.keys(dict).length > 0
            } else {
                return dict && dict.length > 0
            }
        },
        // 用于在故事字幕中添加内容
        addStoryCaptionContent: function(content) {
            setTimeout(() => {
                const container = document.getElementById("storyCaptionContent");
                if (container) {
                    // 插入在第一个位置
                    const newCaption = document.createElement("div");
                    newCaption.innerHTML = content + "<br>";
                    container.insertAdjacentElement('afterbegin', newCaption);
                }
                document.getElementById("ui-bar").classList.remove("stowed");
            });
        },
        // 用于加载远程数据并显示在元素中
        loadRemote: function() {
            queueMicrotask(() => { 
                document.querySelectorAll('[data-remote]').forEach(async element => {
                    try {
                    const response = await fetch(element.dataset.remote, {
                        mode: 'cors',
                        credentials: 'omit'
                    });
                    const data = await response.json();
                    if (!data.error) {
                        let content = data.value;
                        if (element.dataset.replace === 'true') {
                        content = content.replaceAll('\n', '<br>');
                        }
                        element.innerHTML = content;
                    }
                    } catch (error) {
                    element.innerHTML = element.dataset.error || '加载失败';
                    }
                });
            });
        },
        // 将小时数转换为友好的时间文本
        getFriendlyTimeText: function(ageHours, cn = true) {
            const hours = Math.floor(ageHours);
            let friendlyTimeText = ""
            if (hours) {
                friendlyTimeText += `${hours}${cn? '小时': ':'}`;
            } else {
                if (!cn) friendlyTimeText += `0:`;
            }
            const minutes = Math.round((ageHours - hours) * 60);
            if (minutes) {
                if (cn) {friendlyTimeText += `${minutes}分钟`}
                else {friendlyTimeText += `${minutes}`.padStart(2, '0')};
            } else {
                if (!cn) friendlyTimeText += `00`;
            }
            return friendlyTimeText
        },
        // 颜色打印
        log: function(title, content, title_color = 'green', content_color = 'white', func = 'log') {
            let text = "";
            const styles = [];
            if (title) {
                text += `%c ${title} %c`;
                styles.push(`background: ${title_color}; color: black; padding: 2px 4px; border-radius: 3px;`);
            }
            if (content) {
                text += ` ${content}`;
                styles.push(`color: ${content_color};`);
            }
            console[func](text, ...styles);
        },
        // 警告
        warn: function(title, content, title_color = 'green') { this.log(title, content, title_color, 'yellow', "warn") },
        // 错误
        error: function(title, content, title_color = 'green') { this.log(title, content, title_color, 'red', "error") },
        // Debug
        debug: function(title, content, title_color = 'yellow') { if (AsAPI.debugon) this.log(title, content, title_color, 'gray', "warn") },
        debugon: false,
        // 当没有 event 时重新加载当前 passage
        reload: function() {
            if (!V.event) {
                SugarCube.Engine.play(V.passage);
                return true;
            }
            return false;
        },
    }
    Object.defineProperty(window, 'asi', { get() { return window.AsAPI; }, configurable: true });
    /* AsAPI: End @early inject */

    
    // 创建等待用户响应的函数
    async function waitForUserResponse(alertConfig) {
        return new Promise((resolve) => {
            window.modSweetAlert2Mod.fire({
                ...alertConfig,
                willClose: () => {
                    resolve();
                }
            });
        });
    }
    window.modSC2DataManager.getAddonPluginManager().registerAddonPlugin(
        'smartphone',
        'SmartphoneModalert',
        {
            async afterInjectEarlyLoad() {
                if (!window.modSC2DataManager.getModLoader().getModZip("maplebirch")) {
                    await waitForUserResponse({
                        title: '需求秋枫白桦框架',
                        html: `
                            <div style="text-align: start;">
                                万能的智能手机从此版本开始部分依赖秋枫白桦框架，请确保安装其并将本模组置于框架下方。<br>
                                如果没有安装 maplebirch，部分功能不会失效，仅是NPC等功能无法正常使用；<br>
                                若你发现本模组的其他不依赖框架的功能失效，请尝试将本模组顺序提升。
                            </div>
                        `,
                        showCancelButton: false,
                        confirmButtonColor: '#1ea44a',
                        confirmButtonText: '了解',
                    });
                }
                if (!!window.modSC2DataManager.getModLoader().getModZip('SmartPhone Omega')) {
                    await waitForUserResponse({
                        title: '与 <span class="green">万能的智能手机 简化版</span> 不兼容',
                        html: `
                            <div style="text-align: start;">
                                （SmartPhone Alpha）<br>
                                本模组是万能的智能手机<span class="teal">完整版</span>，请勿与简化版一起加载。<br>
                                进入游戏后<span class="red">请务必仅选择保留两者之一</span>。
                            </div>
                        `,
                        showCancelButton: false,
                        confirmButtonColor: '#1ea44a',
                        confirmButtonText: '了解',
                    });
                }
            }
        },
    );
})();