(() => {
    window.PhoneMod = {};

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
                if (!window.modUtils.getMod('maplebirch')) {
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
                if (!!window.modUtils.getMod('SmartPhone Omega')) {
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