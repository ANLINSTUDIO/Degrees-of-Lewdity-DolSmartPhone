(() => {
    smartphone.of$dayPassed = function() {
        // // 咖啡馆每天下降警戒
        // if (V.Phone.StealPhoneAlertOceanBreeze) {
        //     V.Phone.StealPhoneAlertOceanBreeze -= 3
        //     if (V.Phone.StealPhoneAlertOceanBreeze <= 0) {
        //         delete V.Phone.StealPhoneAlertOceanBreeze
        //     }
        // }

        // smartphone.RefreshSecondPhone()  // 老冯二手店刷新货
    }

    smartphone.om$journal  = function() {
        as.warn("SmartPhone", "journal")
    }

    smartphone.om$effectssteal  = function() {
        as.warn("SmartPhone", "effectssteal")
    }

    smartphone.om$orgasm  = function() {
        as.warn("SmartPhone", "orgasm")
    }

    smartphone.om$make_recipe  = function() {
        as.warn("SmartPhone", "make_recipe")
    }

    


    // 【passageinit 注入】软修改宏功能
    $(document).one(":passageinit", function () {
        // 宏软注入
        smartphone.events_on_macro.forEach(event => {
            as.log("SmartPhone", "宏软注入: "+event.macro);
            as.onMacro(event.macro, smartphone[event.func]);
        })
    });

    // 【passagerender 注入】
    $(document).on(":passagerender", function (ev) {smartphone.onPassageRender(ev)});
    smartphone.onPassageRender = function (ev) {
        // 事件软注入
        smartphone.events.forEach(smartphone.eventsLoad_)
    }
    
    // 【注入函数】事件软注入
    smartphone.eventsLoad_ = function(event_or_id) {  // 可以提供event或者eventid
        let event = event_or_id
        if (typeof(event_or_id) === "string") {
            event = smartphone.events.find(event_ => event_.eventid === event)
            if (!event) {
                as.error("SmartPhone", `没有找到次事件 ${event_or_id}，注入失败`);
            }
        }
        if (!event) return
        if (V.passage === event.passage || typeof(event_or_id) === "string") {
            let pass = null
            if (event.condition) {
                pass = smartphone[event.condition]()
            }
            if (pass === null) {
                if (event.chance) {
                    if (Math.random() < event.chance) {
                        pass = true
                    } else {
                        pass = false
                    }
                } else {
                    pass = true
                }
            }
            if (pass) {
                let succeed = true
                if (event.goto === true) {
                    new Wikifier(null, `<<goto "${event.event}">>`);
                } else {
                    succeed = smartphone.eventsLoadInclude_(event.target, event.event, event.position, event.offset)
                }
                if (succeed) {
                    if (event.s) {
                        smartphone.eventsLoad_(event.s)
                    }
                } else {
                    if (event.f) {
                        as.warn("SmartPhone", `注入 ${event.event} 时没有找到目标 ${event.target}，尝试使用次事件 ${event.f}`);
                        smartphone.eventsLoad_(event.f)
                    } else {
                        as.error("SmartPhone", `注入 ${event.event} 时没有找到目标 ${event.target}，注入失败`);
                    }
                }
            }
        }
    }
    smartphone.eventsLoadInclude_ = function(target, include, position="after", offset=0) {
        let $target = $(smartphone.ev.content).find(`a[data-passage="${target}"]`);
        if ($target.length <= 0) return false

        const Div = document.createElement("div");
        Div.style.display = "inline";
        new Wikifier(Div, `<<${include}>>`);
        if (position === "replace") {
            $target.first().replaceWith(Div);
        } else{
            smartphone.eventsLoadInsert_($target, Div, position, offset)
        }
        return true
    }
    smartphone.eventsLoadInsert_ = function(target, insert_target, position="after", offset=0) {
        let insertTarget = target.first();
        if (position === "before") {
            // 遍历前两个兄弟节点
            for (let i = 0; i < offset; i++) {
                if (insertTarget.prev().length > 0) {
                    insertTarget = insertTarget.prev();
                } else {
                    break; // 如果没有足够的前一个兄弟节点，则跳出循环
                }
            }
            insertTarget.before(insert_target);
        } else {  //  默认向后 elif (position === "after")
            // 遍历后两个兄弟节点
            for (let i = 0; i < offset; i++) {
                if (insertTarget.next().length > 0) {
                    insertTarget = insertTarget.next();
                } else {
                    break; // 如果没有足够的后一个兄弟节点，则跳出循环
                }
            }
            insertTarget.after(insert_target);
        }
    }

    // ==============================================
    // 【工具】自动处理函数和宏的注入，请使用of$和om$来进行使用，请确保与原函数或宏重名。
    // (() => {
    //     let modnamespace = "smartphone";
    //     let modname = "SmartPhone";
    //     let modcolor = "green";
    //     $(document).one(":passageinit", function () {
    //         const ns = window[modnamespace];
    //         if (!ns || typeof ns !== 'object') {
    //             as.error(modname, `命名空间 ${modnamespace} 不存在，跳过注入`, modcolor);
    //             return;
    //         }
    //         const keys = Object.keys(ns);
    //         keys.forEach(key => {
    //             // 自动处理 of$ 前缀：绑定到全局同名函数
    //             if (key.startsWith('of$')) {
    //                 const funcName = key.slice(3);
    //                 eval(`${funcName} = as.onFunction(${funcName}, ${modnamespace}['of$${funcName}'])`);
    //                 as.log(modname, `已注入 onFunction: ${funcName}`, modcolor);
    //             }
    //             // 自动处理 om$ 前缀：使用 onMacro 注入宏
    //             else if (key.startsWith('om$')) {
    //                 const macroName = key.slice(3);
    //                 as.onMacro(macroName, ns[key]);
    //                 as.log(modname, `已注入 onMacro: ${macroName}`, modcolor);
    //             }
    //         });
    //         as.log(modname, `已自动完成所有函数和宏注入`, modcolor, "green");
    //     });
    // })();
})();