window.PhoneMod = {};
PhoneMod.PhonePhotos = {};
window.V = {};
V.Phone = {};
V.Phone.Album = {};

const player = { 
    fame: { exhibitionism: 120 }, 
    gender: "m", 
    penissize: 4, 
    breastsize: 3, 
    bellySize: () => 2 
};



PhoneMod.yenoteGenerateRandomComment = function(photo) {
    const photo_id = photo.id;
    const photoData = PhoneMod.PhonePhotos[photo_id];
    const photoThis = {...photo, ...V.Phone.Album[photo_id]};
    const commentPool = Object.assign({}, photoData.uncommon ? {} : PhoneMod.Comments);

    // 工具函数：判断节点是否为条件节点
    function isConditionNode(node) {
        return Array.isArray(node) &&
               node.length >= 2 &&
               typeof node[0] === 'string' &&
               Array.isArray(node[1]) &&
               node[1].length >= 2 &&
               typeof node[1][0] === 'string';
    }

    // 根据条件求值，返回选中的分支节点（或 null）
    function resolveCondition(node, photoThis) {
        const conditionText = node[0];
        const thenNode = node[1];
        const elseNode = node[2] || null;
        let conditionResult = false;
        try {
            // 将 conditionText 当作箭头函数表达式，用 (p) 包裹并立即执行
            const condFn = new Function('p', 'return (' + conditionText + ')(p)');
            conditionResult = condFn(photoThis);
        } catch (e) {
            console.warn('条件表达式执行出错:', conditionText, e);
        }
        return conditionResult ? thenNode : elseNode;
    }

    // 递归从评论树中提取所有“可用首评”——即最顶层可以被发布的评论（文本和效果）
    // 备用池：用于当没有跟评时随机返回
    function collectTopLevelEntries(node, collector) {
        if (isConditionNode(node)) {
            const resolved = resolveCondition(node, photoThis);
            if (resolved) collectTopLevelEntries(resolved, collector);
            return;
        }
        // 普通节点：文本、效果、子节点
        const text = node[0];
        const effect = node[1] || '';
        collector.set(text, effect);
        // 不继续往下深入，因为首评只需收集顶层
    }

    // 搜索 lastComment.text 在整个树中的位置
    // 如果找到匹配的节点，返回其父节点（虚假父节点引用）和节点本身，以便提取子节点
    function findNodeInTree(tree, targetText, path = []) {
        for (let node of tree) {
            if (isConditionNode(node)) {
                // 条件节点：只搜索其满足条件的分支
                const resolved = resolveCondition(node, photoThis);
                if (resolved) {
                    const found = findNodeInTree([resolved], targetText, path);
                    if (found) return found;
                }
                continue;
            }
            // 普通节点
            if (node[0] === targetText) {
                return { node, path };
            }
            if (node[2] && Array.isArray(node[2])) {
                const found = findNodeInTree(node[2], targetText, [...path, node]);
                if (found) return found;
            }
        }
        return null;
    }

    // 收集顶层所有可用首评到备用池
    const topLevelEntries = new Map(); // 文本 -> 效果
    if (photoData.comments && Array.isArray(photoData.comments)) {
        photoData.comments.forEach(node => collectTopLevelEntries(node, topLevelEntries));
    }

    // 合并通用评论
    for (let [text, effect] of Object.entries(commentPool)) {
        topLevelEntries.set(text, effect);
    }

    // 尝试跟评
    const lastComment = photo.comments && photo.comments.length ? photo.comments[photo.comments.length - 1] : null;
    if (lastComment && Math.random() < 0.5) {
        // 50% 概率继续跟评
        const found = photoData.comments ? findNodeInTree(photoData.comments, lastComment.text) : null;
        if (found && found.node[2] && Array.isArray(found.node[2]) && found.node[2].length > 0) {
            const children = found.node[2];
            // 筛选出条件满足的节点（条件节点需要求值）
            const validChildren = [];
            for (let child of children) {
                if (isConditionNode(child)) {
                    const resolved = resolveCondition(child, photoThis);
                    if (resolved) validChildren.push(resolved);
                } else {
                    validChildren.push(child);
                }
            }
            if (validChildren.length > 0) {
                // 随机选择一个子节点作为跟评
                const chosen = validChildren[Math.floor(Math.random() * validChildren.length)];
                return {
                    name: PhoneMod.generateNickname(),
                    text: chosen[0],
                    effect: chosen[1] || '',
                    already_read: false,
                    last_name: lastComment.name
                };
            }
        }
    }

    // 如果没有跟评或断开，从顶级池中随机返回
    const keys = Array.from(topLevelEntries.keys());
    if (keys.length === 0) return null;
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return {
        name: PhoneMod.generateNickname(),
        text: randomKey,
        effect: topLevelEntries.get(randomKey),
        already_read: false
    };
};



PhoneMod.generateNickname = () => "用户" + Math.floor(Math.random() * 1000);
debugYenoteComment = function() {
    const testData = JSON.parse(outputPreview.textContent);
    const times = 20;
    
    // 构造一个模拟的 photo 对象，yenoteGenerateRandomComment 会用到以下字段：
    //   photo.id, photo.comments（已发布的评论数组，每项含 name/text/effect）
    const photo_id = "debug_" + Date.now();
    const photo = {
        id: photo_id,
        comments: []   // 假设照片下还没有任何已发布评论
    };

    // 将测试数据写入 PhoneMod.PhonePhotos
    PhoneMod.PhonePhotos[photo_id] = testData;
    V.Phone.Album[photo_id] = {};

    // 模拟 photoThis（photo 合并 V.Phone.Album[photo_id]）
    const photoThis = { ...photo };

    V.player = player;

    console.log("===== 开始调试评论生成 =====");
    console.log("照片ID:", photo_id);
    console.log("原始嵌套数据:", JSON.stringify(testData.comments));

    const results = new Set();
    const lastNames = {}; // 模拟已发布评论的作者名

    for (let i = 0; i < times; i++) {
        try {
            const comment = PhoneMod.yenoteGenerateRandomComment(photo);
            if (comment) {
                const key = comment.text;
                results.add(key);
                lastNames[key] = comment.name;
                photo.comments.push(comment)
                console.log(`结果 ${i+1}:`, comment);
            } else {
                console.log(`结果 ${i+1}: null (无可用评论)`);
            }
        } catch (e) {
            console.error(`出错了 (第${i+1}次):`, e);
        }
    }

    console.log("===== 调试结束 =====");
    console.log("可能出现的评论文本集合:", Array.from(results));

    // 清理测试数据
    delete PhoneMod.PhonePhotos[photo_id];
    console.log(photo);
};
