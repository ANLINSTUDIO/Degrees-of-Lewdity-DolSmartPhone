(() => {
    // [AsAPI] 定义AsAPI工具
    window.AsAPI = { ...window.AsAPI,  // inject
        // 用于在宏被调用后执行额外的函数
        onMacro: function(name, func) {
            let originalMacro = Macro.get(name);
            if (originalMacro) {
                let oldHandler = originalMacro.handler;
                Macro.delete(name);
                Macro.add(name, {
                    handler: function () {
                        oldHandler.apply(this, arguments);
                        setTimeout(func, 10);
                    }
                });
            }
        },
        // 当没有 event 时重新加载当前 passage
        reload: function() {
            if (!V.event) {
                Engine.play(passage());
                return true;
            }
            return false;
        },
    }
})();