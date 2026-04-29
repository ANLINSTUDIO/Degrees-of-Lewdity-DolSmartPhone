window.validArray = function(dict) {
    if (dict instanceof Object) {
        return dict && Object.keys(dict).length > 0
    } else {
        return dict && dict.length > 0
    }
}

window.AsAPI = {
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
        }, 10);
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
    // 当没有 event 时重新加载当前 passage
    reload: function() {
        if (!V.event) {
            Engine.play(passage());
            return true;
        }
        return false;
    },
    // 颜色打印
    log: function(title, content, title_color = 'green', content_color = 'white') {
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
        console.log(text, ...styles);
    },
    // 错误警告
    error: function(title, content) {
        this.log(title, content, 'yellow', 'red');
    }
}