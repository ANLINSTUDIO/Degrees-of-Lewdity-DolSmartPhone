(function() {
    'use strict';

    // 名声数据
    const FAME_ITEMS = [
        {en:'bestiality',zh:'人外',pos:false},{en:'business',zh:'商业',pos:true},
        {en:'exhibitionism',zh:'露出',pos:false},{en:'good',zh:'善良',pos:true},
        {en:'impreg',zh:'授孕',pos:false},{en:'model',zh:'模特',pos:true},
        {en:'pimp',zh:'皮条客',pos:false},{en:'pregnancy',zh:'怀孕',pos:false},
        {en:'prostitution',zh:'卖淫',pos:false},{en:'rape',zh:'强暴',pos:false},
        {en:'scrap',zh:'战斗',pos:true},{en:'sex',zh:'淫乱',pos:false},
        {en:'social',zh:'社交',pos:true}
    ];
    const POSITIVE_FAMES = FAME_ITEMS.filter(f=>f.pos);
    const NEGATIVE_FAMES = FAME_ITEMS.filter(f=>!f.pos);

    let selectedFames = [];
    let conditions = [];
    let topLevelComments = [];
    let imageBase64 = null;

    const EFFECT_MAP = {
        '+ 性奋': '<<garousal>><<arousal 30>>',
        '++ 性奋': '<<ggarousal>><<arousal 100>>',
        '+++ 性奋': '<<gggarousal>><<arousal 300>>',
        '- 性奋': '<<larousal>><<arousal -30>>',
        '-- 性奋': '<<llarousal>><<arousal -100>>',
        '--- 性奋': '<<lllarousal>><<arousal -300>>',
        '+ 压力': '<<gstress>><<stress 1>>',
        '++ 压力': '<<ggstress>><<stress 3>>',
        '+++ 压力': '<<gggstress>><<stress 5>>',
        '- 压力': '<<lstress>><<stress -1>>',
        '-- 压力': '<<llstress>><<stress -3>>',
        '--- 压力': '<<lllstress>><<stress -5>>',
        '+ 创伤': '<<gtrauma>><<trauma 3>>',
        '++ 创伤': '<<ggtrauma>><<trauma 10>>',
        '+++ 创伤': '<<gggtrauma>><<trauma 20>>',
        '- 创伤': '<<ltrauma>><<trauma -3>>',
        '-- 创伤': '<<lltrauma>><<trauma -10>>',
        '--- 创伤': '<<llltrauma>><<trauma -20>>',
        '+ 自控': '<<gcontrol>><<control 1>>',
        '++ 自控': '<<ggcontrol>><<control 3>>',
        '+++ 自控': '<<gggcontrol>><<control 7>>',
        '- 自控': '<<lcontrol>><<control -1>>',
        '-- 自控': '<<llcontrol>><<control -3>>',
        '--- 自控': '<<lllcontrol>><<control -7>>',
        '阴茎小': '<<insecurity "penis_small" 1>><<ginsecurity "penis_small">>',
        '阴茎大': '<<insecurity "penis_big" 1>><<ginsecurity "penis_big">>',
        '胸部小': '<<insecurity "breasts_small" 1>><<ginsecurity "breasts_small">>',
        '胸部大': '<<insecurity "breasts_big" 1>><<ginsecurity "breasts_big">>',
        '怀孕': '<<insecurity "pregnancy" 1>><<ginsecurity "pregnancy">>',
    };
    const EFFECT_CATS = ['性奋','压力','创伤','自控'];
    const INSECURITY_TAGS = ['阴茎小','阴茎大','胸部小','胸部大','怀孕'];

    function codeFromTags(tags){ return (tags||[]).map(t=>EFFECT_MAP[t]||'').join(''); }

    // 反向映射：从效果代码字符串 -> 标签数组
    function tagsFromCode(codeStr) {
        if (!codeStr) return [];
        const tags = [];
        for (const [tag, effectCode] of Object.entries(EFFECT_MAP)) {
            if (codeStr.includes(effectCode)) {
                tags.push(tag);
                codeStr = codeStr.replace(effectCode, ''); // 避免重复匹配
            }
        }
        return tags;
    }

    function assignAliases(){
        let cnt=0;
        function walk(arr){ arr.forEach(n=>{ n.alias=++cnt; if(n.replies)walk(n.replies); if(n.elseNode)walk([n.elseNode]); }); }
        walk(topLevelComments);
    }

    // DOM 元素
    const famePositive = document.getElementById('famePositive');
    const fameNegative = document.getElementById('fameNegative');
    const famesHidden = document.getElementById('famesHidden');
    const riskSlider = document.getElementById('riskSlider');
    const riskInput = document.getElementById('riskInput');
    const condDiv = document.getElementById('conditionsList');
    const commentList = document.getElementById('commentList');
    const commentInput = document.getElementById('commentInput');
    const publishBtn = document.getElementById('publishBtn');
    const replyIndicator = document.getElementById('replyIndicator');
    const replyTargetName = document.getElementById('replyTargetName');
    const cancelReplyBtn = document.getElementById('cancelReplyBtn');
    const cancelReplyBtn2 = document.getElementById('cancelReplyBtn2');
    const outputPreview = document.getElementById('outputPreview');
    const effectBar = document.getElementById('effectBar');

    // 图像上传 DOM
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const imageRemoveBtn = document.getElementById('imageRemoveBtn');

    const editModal = document.getElementById('editModal');
    const editModalTitle = document.getElementById('editModalTitle');
    const editText = document.getElementById('editText');
    const editCond = document.getElementById('editCond');
    const editCondBlock = document.getElementById('editCondBlock');
    const editEnableElse = document.getElementById('editEnableElse');
    const editAutoFunc = document.getElementById('editAutoFunc');
    const editCondReadonly = document.getElementById('editCondReadonly');
    const readonlyCondText = document.getElementById('readonlyCondText');
    const editEffectPanel = document.getElementById('editEffectPanel');
    const editDeleteBtn = document.getElementById('editDeleteBtn');
    const editCancelBtn = document.getElementById('editCancelBtn');
    const editConfirmBtn = document.getElementById('editConfirmBtn');

    // 导入模态框
    const importModal = document.getElementById('importModal');
    const importJson = document.getElementById('importJson');
    const importConfirm = document.getElementById('importConfirm');
    const importCancel = document.getElementById('importCancel');

    // 自定义确认框
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');

    function customConfirm(message) {
        return new Promise((resolve) => {
            confirmMessage.textContent = message;
            confirmModal.style.display = 'flex';
            confirmOk.onclick = () => {
                confirmModal.style.display = 'none';
                resolve(true);
            };
            confirmCancel.onclick = () => {
                confirmModal.style.display = 'none';
                resolve(false);
            };
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    confirmModal.style.display = 'none';
                    resolve(false);
                }
            }, { once: true });
        });
    }

    let replyTarget = null;
    let editTarget = null;
    let editIsElse = false;
    let currentEditState = null;

    let currentEffects = { 性奋:null, 压力:null, 创伤:null, 自控:null, 不安:[] };

    riskSlider.addEventListener('input', ()=> riskInput.value = riskSlider.value);
    riskInput.addEventListener('input', ()=>{
        let v = parseInt(riskInput.value,10);
        if(isNaN(v)) v=1;
        v = Math.min(100, Math.max(1, v));
        riskSlider.value = v;
        riskInput.value = v;
    });

    // ---------- 图像上传 ----------
    imageUploadArea.addEventListener('click', (e) => {
        if (e.target.closest('.image-remove-btn')) return;
        if (imageBase64) return; // 已有图片时不触发选择
        imageInput.click();
    });

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('请选择图片文件');
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            imageBase64 = evt.target.result;
            imagePreview.src = imageBase64;
            imagePreview.style.display = 'block';
            imagePlaceholder.style.display = 'none';
            imageRemoveBtn.style.display = 'inline-flex';
            imageUploadArea.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    });

    imageRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        imageBase64 = null;
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        imagePlaceholder.style.display = 'flex';
        imageRemoveBtn.style.display = 'none';
        imageUploadArea.classList.remove('has-image');
        imageInput.value = '';
    });

    function renderFames(){
        famePositive.innerHTML = ''; fameNegative.innerHTML = '';
        const renderChip = (item) => {
            const chip = document.createElement('div');
            const cls = selectedFames.includes(item.en) ? (item.pos?'selected positive':'selected negative') : (item.pos?'positive':'negative');
            chip.className = `fame-chip ${cls}`;
            chip.textContent = item.zh;
            chip.addEventListener('click', ()=>{
                if(selectedFames.includes(item.en)) selectedFames = selectedFames.filter(f=>f!==item.en);
                else selectedFames.push(item.en);
                renderFames(); famesHidden.value = selectedFames.join(',');
            });
            return chip;
        };
        POSITIVE_FAMES.forEach(item => famePositive.appendChild(renderChip(item)));
        NEGATIVE_FAMES.forEach(item => fameNegative.appendChild(renderChip(item)));
        famesHidden.value = selectedFames.join(',');
    }
    renderFames();

    function renderConditions(){
        condDiv.innerHTML = '';
        conditions.forEach((c, idx) => {
            const row = document.createElement('div'); row.className = 'kv-row';
            row.innerHTML = `<input placeholder="键" value="${escapeHtml(c.key)}" data-idx="${idx}" class="ckey"><input placeholder="值" value="${escapeHtml(c.value)}" data-idx="${idx}" class="cval"><div class="icon-btn" data-rm="${idx}">✕</div>`;
            condDiv.appendChild(row);
        });
        document.querySelectorAll('.ckey').forEach(el => el.addEventListener('change', e => conditions[el.dataset.idx].key = e.target.value));
        document.querySelectorAll('.cval').forEach(el => el.addEventListener('change', e => conditions[el.dataset.idx].value = e.target.value));
        document.querySelectorAll('[data-rm]').forEach(el => el.addEventListener('click', e => {
            conditions.splice(parseInt(el.dataset.rm), 1);
            renderConditions();
        }));
    }
    document.getElementById('addConditionBtn').addEventListener('click', ()=>{
        conditions.push({key:'',value:''});
        renderConditions();
    });
    document.querySelectorAll('.quick-key-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            const rawValue = btn.dataset.value || '';
            const action = btn.dataset.action;
            const selectTarget = btn.dataset.select || '';

            // 处理 cursor 占位符，移除 |*| 作为实际值
            const value = rawValue.replace(/\|\*\|/g, '');

            conditions.push({ key, value });
            renderConditions();

            const rows = condDiv.querySelectorAll('.kv-row');
            const lastRow = rows[rows.length - 1];
            if (!lastRow) return;

            const ckeyInput = lastRow.querySelector('.ckey');
            const cvalInput = lastRow.querySelector('.cval');

            if (!action) return; // 无 action 则不执行聚焦

            if (action === 'select') {
                // 选中键输入框中的文本
                if (ckeyInput && selectTarget) {
                    ckeyInput.focus();
                    const val = ckeyInput.value;
                    const idx = val.indexOf(selectTarget);
                    if (idx !== -1) {
                        ckeyInput.setSelectionRange(idx, idx + selectTarget.length);
                    }
                }
            } else if (action === 'focus') {
                // 聚焦值输入框（默认在开头）
                if (cvalInput) cvalInput.focus();
            } else if (action === 'cursor') {
                // 聚焦值输入框，并将光标定位在占位符 |*| 的位置
                if (cvalInput) {
                    cvalInput.focus();
                    const cursorMark = '|*|';
                    const pos = rawValue.indexOf(cursorMark);
                    if (pos !== -1) {
                        // 实际插入时已去掉占位符，因此光标应为对应位置
                        // 需计算去除占位符后光标应处于的位置
                        const beforeCursor = rawValue.substring(0, pos).replace(/\|\*\|/g, '');
                        cvalInput.setSelectionRange(beforeCursor.length, beforeCursor.length);
                    } else {
                        cvalInput.setSelectionRange(value.length, value.length);
                    }
                }
            }
        });
    });
    renderConditions();

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c]);
    }

    function renderEffectBar(){
        effectBar.innerHTML = '';
        EFFECT_CATS.forEach(cat => {
            const val = currentEffects[cat];
            const btn = document.createElement('button');
            btn.className = `effect-cat-btn ${val?'has-value':''}`;
            btn.textContent = val || cat;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(val){ currentEffects[cat] = null; renderEffectBar(); closeSubPanel(); }
                else openSubPanel(cat, btn);
            });
            effectBar.appendChild(btn);
        });
        const inseBtn = document.createElement('button');
        inseBtn.className = `effect-cat-btn ${currentEffects.不安.length?'has-value':''}`;
        const inseList = currentEffects.不安.join(', ');
        inseBtn.textContent = inseList ? `不安感: ${inseList}` : '不安';
        inseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openSubPanel('不安', inseBtn);
        });
        effectBar.appendChild(inseBtn);
    }

    let activeSubPanel = null;
    function closeSubPanel(){
        if(activeSubPanel){ activeSubPanel.remove(); activeSubPanel = null; }
    }
    function openSubPanel(cat, anchor){
        closeSubPanel();
        const panel = document.createElement('div'); panel.className = 'sub-panel';
        let options = [];
        if(cat === '不安'){
            options = INSECURITY_TAGS;
        } else {
            options = ['+','++','+++','-','--','---'].map(l => l + ' ' + cat);
        }
        options.forEach(opt => {
            const span = document.createElement('span'); span.className = 'sub-option';
            if(cat === '不安' && currentEffects.不安.includes(opt)) span.classList.add('selected');
            if(cat !== '不安' && currentEffects[cat] === opt) span.classList.add('selected');
            span.textContent = opt;
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                if(cat === '不安'){
                    const arr = currentEffects.不安;
                    const idx = arr.indexOf(opt);
                    if(idx > -1) arr.splice(idx, 1); else arr.push(opt);
                } else {
                    currentEffects[cat] = currentEffects[cat] === opt ? null : opt;
                }
                renderEffectBar();
                closeSubPanel();
            });
            panel.appendChild(span);
        });
        anchor.parentNode.insertBefore(panel, anchor.nextSibling);
        activeSubPanel = panel;
        setTimeout(() => document.addEventListener('click', closeSubPanel, { once: true }), 10);
    }

    function getCurrentTags(){
        const tags = [];
        EFFECT_CATS.forEach(cat => { if(currentEffects[cat]) tags.push(currentEffects[cat]); });
        currentEffects.不安.forEach(t => tags.push(t));
        return tags;
    }
    function resetCurrentEffects(){
        currentEffects = { 性奋:null, 压力:null, 创伤:null, 自控:null, 不安:[] };
        renderEffectBar();
    }
    renderEffectBar();

    function renderAllComments(){
        assignAliases();
        commentList.innerHTML = '';
        if(topLevelComments.length === 0) {
            commentList.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-tertiary);">暂无评论</div>';
        } else {
            topLevelComments.forEach((n) => commentList.appendChild(renderNode(n, 0, null)));
        }
    }

    function renderNode(node, depth, parentAlias){
        const wrapper = document.createElement('div');
        const item = document.createElement('div');
        item.className = 'comment-item';
        item.style.marginLeft = depth > 0 ? `${depth * 1.6}rem` : '0';
        item.style.borderLeft = depth > 0 ? '2px solid var(--border-medium)' : 'none';
        item.style.paddingLeft = depth > 0 ? '1rem' : '0.5rem';

        const replyStr = parentAlias ? ` <span style="color:var(--accent);">回复 #${parentAlias}</span>` : '';
        const condHtml = node.condition ? `<span class="cond-tag">🔀 ${escapeHtml(node.condition)}</span>` : '';
        const effectBadges = node.effectsTags.map(t => `<span class="effect-badge">${escapeHtml(t)}</span>`).join('');
        item.innerHTML = `
            <div class="comment-avatar">#${node.alias}</div>
            <div class="comment-body">
                <div class="comment-author-row">
                    <span class="comment-author">#${node.alias}${replyStr} ${condHtml}</span>
                    <div class="comment-actions">
                        <button class="action-btn reply" data-action="reply">回复</button>
                        <button class="action-btn edit" data-action="edit">编辑</button>
                        <button class="action-btn delete-btn" data-action="delete">删除</button>
                    </div>
                </div>
                <div class="comment-text">${escapeHtml(node.text)} ${effectBadges}</div>
            </div>`;
        wrapper.appendChild(item);

        item.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            setReplyTarget(node);
        });
        item.querySelector('[data-action=reply]').addEventListener('click', (e) => { e.stopPropagation(); setReplyTarget(node); });
        item.querySelector('[data-action=edit]').addEventListener('click', (e) => { e.stopPropagation(); openEditModal(node, false); });
        item.querySelector('[data-action=delete]').addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmed = await customConfirm('确定删除此评论及所有关联吗？');
            if (confirmed) {
                removeNode(node);
                renderAllComments();
            }
        });

        if (node.replies) {
            node.replies.forEach(reply => {
                wrapper.appendChild(renderNode(reply, depth + 1, node.alias));
            });
        }

        if (node.elseNode) {
            const elseItem = document.createElement('div');
            elseItem.className = 'comment-item else-item';
            elseItem.style.marginLeft = depth > 0 ? `${depth * 1.6}rem` : '0';
            elseItem.style.borderLeft = '2px dashed var(--accent)';
            elseItem.style.paddingLeft = '1rem';
            const elseEffectBadges = node.elseNode.effectsTags.map(t => `<span class="effect-badge">${escapeHtml(t)}</span>`).join('');
            elseItem.innerHTML = `
                <div class="comment-avatar">#${node.elseNode.alias}</div>
                <div class="comment-body">
                    <div class="comment-author-row">
                        <span class="comment-author">#${node.elseNode.alias} <span style="color:var(--text-tertiary);">(否定)</span> <span class="cond-tag">🔀 ${escapeHtml(node.condition)}</span></span>
                        <div class="comment-actions">
                            <button class="action-btn reply" data-action="reply">回复</button>
                            <button class="action-btn edit" data-action="edit">编辑</button>
                            <button class="action-btn delete-btn" data-action="delete">删除</button>
                        </div>
                    </div>
                    <div class="comment-text">${escapeHtml(node.elseNode.text)} ${elseEffectBadges}</div>
                </div>`;
            elseItem.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                setReplyTarget(node.elseNode);
            });
            elseItem.querySelector('[data-action=reply]').addEventListener('click', (e) => { e.stopPropagation(); setReplyTarget(node.elseNode); });
            elseItem.querySelector('[data-action=edit]').addEventListener('click', (e) => { e.stopPropagation(); openEditModal(node.elseNode, true); });
            elseItem.querySelector('[data-action=delete]').addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmed = await customConfirm('确定删除此否则评论吗？');
                if (confirmed) {
                    node.condition = null;
                    node.elseNode = null;
                    renderAllComments();
                }
            });
            wrapper.appendChild(elseItem);

            if (node.elseNode.replies) {
                node.elseNode.replies.forEach(reply => {
                    wrapper.appendChild(renderNode(reply, depth + 1, node.elseNode.alias));
                });
            }
        }

        return wrapper;
    }

    function setReplyTarget(node){
        replyTarget = node;
        replyTargetName.textContent = '#' + node.alias + ' (' + (node.text || '').substring(0, 20) + '…)';
        replyIndicator.style.display = 'flex';
        cancelReplyBtn2.style.display = 'inline-flex';
        publishBtn.textContent = '↩️ 回复';
        commentInput.focus();
    }
    function clearReply(){
        replyTarget = null;
        replyIndicator.style.display = 'none';
        cancelReplyBtn2.style.display = 'none';
        publishBtn.textContent = '📝 发布';
    }
    cancelReplyBtn.addEventListener('click', clearReply);
    cancelReplyBtn2.addEventListener('click', clearReply);

    function publish(){
        const text = commentInput.value.trim();
        if (!text) return;
        const tags = getCurrentTags();
        const node = { id: 'n' + Date.now() + Math.random(), text, effectsTags: tags, condition: null, elseNode: null, replies: [] };
        if (replyTarget) {
            if (!replyTarget.replies) replyTarget.replies = [];
            replyTarget.replies.push(node);
            clearReply();
        } else {
            topLevelComments.push(node);
        }
        commentInput.value = '';
        resetCurrentEffects();
        renderAllComments();
    }
    publishBtn.addEventListener('click', publish);
    commentInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            publish();
        }
    });

    function renderEffectEditor(container, selectedTags){
        container.innerHTML = '';
        const state = { 性奋:null, 压力:null, 创伤:null, 自控:null, 不安:[] };
        selectedTags.forEach(t => {
            const cat = EFFECT_CATS.find(c => t.includes(c));
            if (cat) state[cat] = t;
            else if (INSECURITY_TAGS.includes(t)) state.不安.push(t);
        });
        function rebuild(){
            container.innerHTML = '';
            EFFECT_CATS.forEach(cat => {
                const wrap = document.createElement('div'); wrap.style.marginBottom = '6px';
                wrap.innerHTML = `<strong style="font-size:0.7rem;">${cat}</strong> `;
                ['+','++','+++','-','--','---'].forEach(lv => {
                    const tag = lv + ' ' + cat;
                    const btn = document.createElement('button');
                    btn.className = `action-btn ${state[cat] === tag ? 'selected' : ''}`;
                    btn.textContent = tag; btn.style.margin = '2px';
                    btn.addEventListener('click', () => {
                        state[cat] = state[cat] === tag ? null : tag;
                        rebuild();
                    });
                    wrap.appendChild(btn);
                });
                container.appendChild(wrap);
            });
            const inseWrap = document.createElement('div');
            inseWrap.innerHTML = '<strong style="font-size:0.7rem;">不安</strong> ';
            INSECURITY_TAGS.forEach(tag => {
                const btn = document.createElement('button');
                btn.className = `action-btn ${state.不安.includes(tag) ? 'selected' : ''}`;
                btn.textContent = tag; btn.style.margin = '2px';
                btn.addEventListener('click', () => {
                    const idx = state.不安.indexOf(tag);
                    if (idx > -1) state.不安.splice(idx, 1);
                    else state.不安.push(tag);
                    rebuild();
                });
                inseWrap.appendChild(btn);
            });
            container.appendChild(inseWrap);
        }
        rebuild();
        return state;
    }

    function stripFuncWrapper(cond) {
        if (!cond) return cond;
        const trimmed = cond.trim();
        const pattern = /^\(\)\s*=>\s*\{?\s*return\s+/;
        if (pattern.test(trimmed)) {
            const rest = trimmed.replace(pattern, '');
            // Remove trailing optional semicolon and closing brace
            let result = rest.replace(/\s*;?\s*\}\s*$/, '');
            // If the original had no braces, just strip the arrow prefix
            if (result === rest) {
                result = rest.replace(/\s*\}\s*$/, '');
            }
            return result.trim();
        }
        return cond;
    }

    function openEditModal(node, isElse){
        editTarget = node;
        editIsElse = isElse;
        editModalTitle.textContent = isElse ? '✏️ 编辑否条件评论' : '✏️ 编辑评论';
        editText.value = node.text || '';
        if (isElse) {
            editCondBlock.style.display = 'none';
            editCondReadonly.style.display = 'block';
            let parentCond = '';
            function findParent(arr, target){
                for (let n of arr) {
                    if (n.elseNode === target) { parentCond = n.condition || ''; return true; }
                    if (n.replies && findParent(n.replies, target)) return true;
                    if (n.elseNode && n.elseNode.replies && findParent(n.elseNode.replies, target)) return true;
                }
                return false;
            }
            findParent(topLevelComments, node);
            readonlyCondText.textContent = `此评论在条件“${parentCond || '未知'}”不成立时出现`;
        } else {
            editCondBlock.style.display = 'block';
            editCondReadonly.style.display = 'none';
            const rawCond = node.condition || '';
            editCond.value = stripFuncWrapper(rawCond);
            // 如果条件已经是函数格式，取消勾选"自动转为函数"
            editAutoFunc.checked = rawCond !== stripFuncWrapper(rawCond) ? false : (node.autoFunc !== false);
            editEnableElse.checked = !!node.elseNode;
        }
        currentEditState = renderEffectEditor(editEffectPanel, node.effectsTags || []);
        editModal.style.display = 'flex';
    }

    function getTagsFromState(state){
        if (!state) return [];
        const tags = [];
        EFFECT_CATS.forEach(c => { if (state[c]) tags.push(state[c]); });
        return tags.concat(state.不安);
    }

    editModal.addEventListener('click', e => { if (e.target === editModal) { editModal.style.display = 'none'; editTarget = null; } });
    editCancelBtn.addEventListener('click', () => { editModal.style.display = 'none'; editTarget = null; });
    editDeleteBtn.addEventListener('click', async () => {
        if (!editTarget) return;
        if (editIsElse) {
            let parent = null;
            function findParent(arr, target){
                for (let n of arr) {
                    if (n.elseNode === target) { parent = n; return true; }
                    if (n.replies && findParent(n.replies, target)) return true;
                    if (n.elseNode && n.elseNode.replies && findParent(n.elseNode.replies, target)) return true;
                }
                return false;
            }
            findParent(topLevelComments, editTarget);
            if (parent) {
                parent.condition = null;
                parent.elseNode = null;
            }
            editModal.style.display = 'none';
            editTarget = null;
            renderAllComments();
        } else {
            const confirmed = await customConfirm('确定删除此评论及所有关联？');
            if (confirmed) {
                removeNode(editTarget);
                editModal.style.display = 'none';
                editTarget = null;
                renderAllComments();
            }
        }
    });
    editConfirmBtn.addEventListener('click', () => {
        if (!editTarget) return;
        editTarget.text = editText.value.trim();
        const enableElse = editIsElse ? false : editEnableElse.checked;
        if (!editIsElse) {
            const condRaw = editCond.value.trim();
            editTarget.rawCond = condRaw;
            editTarget.autoFunc = editAutoFunc.checked;
            editTarget.condition = condRaw || null;
            if (editTarget.condition && enableElse) {
                if (!editTarget.elseNode) {
                    editTarget.elseNode = { id: 'n' + Date.now() + Math.random(), text: '', effectsTags: [], condition: null, elseNode: null, replies: [] };
                }
            } else {
                editTarget.elseNode = null;
            }
        }
        if (currentEditState) {
            editTarget.effectsTags = getTagsFromState(currentEditState);
        }
        editModal.style.display = 'none';
        const createdElse = !editIsElse && editTarget.elseNode && !editTarget.elseNode.text && enableElse;
        editTarget = null;
        renderAllComments();
        if (createdElse) {
            setTimeout(() => {
                const parent = findParentNode(topLevelComments, n => n.elseNode && !n.elseNode.text);
                if (parent && parent.elseNode) openEditModal(parent.elseNode, true);
            }, 50);
        }
    });

    function findParentNode(arr, predicate) {
        for (let n of arr) {
            if (predicate(n)) return n;
            if (n.replies) {
                const found = findParentNode(n.replies, predicate);
                if (found) return found;
            }
            if (n.elseNode) {
                const found = findParentNode([n.elseNode], predicate);
                if (found) return found;
            }
        }
        return null;
    }

    function removeNode(target) {
        function search(arr) {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] === target) { arr.splice(i, 1); return true; }
                if (arr[i].elseNode === target) { arr[i].elseNode = null; arr[i].condition = null; return true; }
                if (arr[i].replies && search(arr[i].replies)) return true;
                if (arr[i].elseNode && arr[i].elseNode.replies && search(arr[i].elseNode.replies)) return true;
            }
            return false;
        }
        search(topLevelComments);
    }

    // ---------- 导出 ----------
    function buildExport(){
        const msg = document.getElementById('taskMsg').value;
        const desc = document.getElementById('taskDesc').value;
        const risk = parseInt(riskInput.value, 10);
        const hide = document.getElementById('hideCheck').checked;
        const uncommon = document.getElementById('uncommonCheck').checked;
        const condObj = {};
        conditions.forEach(c => { if (c.key) condObj[c.key] = c.value; });

        function getExportCond(node) {
            const raw = node.rawCond || node.condition || '';
            if (!raw) return raw;
            if (node.autoFunc) {
                try { eval(raw)(); return raw; } catch(e) { return `() => { return ${raw} }`; }
            }
            return raw;
        }

        function buildNested(node){
            const code = codeFromTags(node.effectsTags);
            if (!node.condition) {
                const children = [];
                if (node.replies) {
                    node.replies.forEach(r => children.push(buildNested(r)));
                }
                return children.length ? [node.text, code, children] : [node.text, code];
            } else {
                const exportCond = getExportCond(node);
                const thenChildren = [];
                if (node.replies) node.replies.forEach(r => thenChildren.push(buildNested(r)));
                const thenEntry = thenChildren.length ? [node.text, code, thenChildren] : [node.text, code];
                if (node.elseNode) {
                    const elseCode = codeFromTags(node.elseNode.effectsTags);
                    const elseChildren = [];
                    if (node.elseNode.replies) node.elseNode.replies.forEach(r => elseChildren.push(buildNested(r)));
                    const elseEntry = elseChildren.length ? [node.elseNode.text, elseCode, elseChildren] : [node.elseNode.text, elseCode];
                    return [exportCond, thenEntry, elseEntry];
                } else {
                    return [exportCond, thenEntry];
                }
            }
        }

        const comments = topLevelComments.map(node => buildNested(node));

        const obj = { type: "task", msg, taskDesc: desc, risk, fames: selectedFames };
        if (imageBase64) obj.image = imageBase64;
        if (hide) obj.hide = true;
        if (uncommon) obj.uncommon = true;
        if (Object.keys(condObj).length) obj.conditions = condObj;
        if (comments.length) obj.comments = comments;
        return obj;
    }

    function showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    document.getElementById('exportBtn').addEventListener('click', () => {
        outputPreview.textContent = JSON.stringify(buildExport(), null, 2);
    });
    document.getElementById('downloadBtn').addEventListener('click', () => {
        const t = outputPreview.textContent;
        if (!t || !t.startsWith('{')) {
            showToast('请先点击"生成对象"');
            return;
        }
        const blob = new Blob([t], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = document.getElementById('taskDesc').value.trim() || `task_${Date.now()}`;
        a.download = `${filename}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ 文件已下载');
    });
    document.getElementById('copyBtn').addEventListener('click', () => {
        const t = outputPreview.textContent;
        if (t && t.startsWith('{')) {
            navigator.clipboard.writeText(t).then(() => showToast('✅ 已复制到剪贴板'));
        }
    });

    // ---------- 导入（反推） ----------
    function processImportJSON(jsonStr) {
        if (!jsonStr) {
            showToast('请粘贴 JSON 数据');
            return;
        }
        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            showToast('JSON 格式不正确: ' + e.message);
            return;
        }

        // 填充基础字段
        document.getElementById('taskMsg').value = data.msg || '';
        document.getElementById('taskDesc').value = data.taskDesc || '';
        const risk = data.risk || 50;
        riskInput.value = risk;
        riskSlider.value = risk;
        document.getElementById('hideCheck').checked = data.hide || false;
        document.getElementById('uncommonCheck').checked = data.uncommon || false;

        // 名声
        selectedFames = data.fames || [];
        renderFames();

        // 图像
        if (data.image) {
            imageBase64 = data.image;
            imagePreview.src = imageBase64;
            imagePreview.style.display = 'block';
            imagePlaceholder.style.display = 'none';
            imageRemoveBtn.style.display = 'inline-flex';
            imageUploadArea.classList.add('has-image');
        }

        // 条件
        conditions = [];
        if (data.conditions) {
            for (const [key, value] of Object.entries(data.conditions)) {
                conditions.push({ key, value });
            }
        }
        renderConditions();

        // 评论树反推
        topLevelComments = [];
        if (data.comments && Array.isArray(data.comments)) {
            function parseNested(node) {
                if (!Array.isArray(node) || node.length < 2) return null;
                // 判断是否为条件节点：第一项是条件字符串（不含文本内容），第二项是数组
                const isCondition = typeof node[0] === 'string' &&
                                    Array.isArray(node[1]) &&
                                    node[1].length >= 2 &&
                                    typeof node[1][0] === 'string';
                if (isCondition) {
                    const cond = node[0];
                    const thenNode = parseNested(node[1]);
                    const elseNode = node[2] ? parseNested(node[2]) : null;
                    if (thenNode) {
                        thenNode.condition = cond;
                        thenNode.rawCond = cond;
                        thenNode.autoFunc = false;
                        thenNode.elseNode = elseNode;
                    }
                    return thenNode;
                } else {
                    const text = node[0] || '';
                    const effectStr = node[1] || '';
                    const tags = tagsFromCode(effectStr);
                    const children = node[2] || [];
                    const obj = {
                        id: 'n' + Date.now() + Math.random(),
                        text,
                        effectsTags: tags,
                        condition: null,
                        elseNode: null,
                        replies: []
                    };
                    if (Array.isArray(children)) {
                        children.forEach(child => {
                            const childNode = parseNested(child);
                            if (childNode) obj.replies.push(childNode);
                        });
                    }
                    return obj;
                }
            }
            data.comments.forEach(item => {
                const root = parseNested(item);
                if (root) topLevelComments.push(root);
            });
        }

        renderAllComments();
        showToast('✅ 数据已填入表单');
    }
    function importData() {
        processImportJSON(importJson.value.trim());
        importModal.style.display = 'none';
    }

    document.getElementById('importBtn').addEventListener('click', () => {
        importModal.style.display = 'flex';
        importJson.value = '';
    });
    importCancel.addEventListener('click', () => {
        importModal.style.display = 'none';
    });
    importConfirm.addEventListener('click', importData);
    importModal.addEventListener('click', (e) => {
        if (e.target === importModal) importModal.style.display = 'none';
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (!files.length) return;
        const file = files[0];
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            showToast('请拖入 JSON 文件');
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            console.log(evt.target.result);
            
            processImportJSON(evt.target.result);
        };
        reader.readAsText(file);
    });

    renderAllComments();
})();