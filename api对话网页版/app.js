// -------------------------预先的函数定义-----------------------------
//收集对话信息，返回list(map(str,str))。
function collectCurrentMessage(useReasoning){

}
//保存当前对话
function saveCurrentHistory(){
    //在对话历史中显示新的项目（id为时间戳，命名初始化为时间戳）

}
//更新源信息
function updateBasicinfo(){

}
//提交信息到后端（如果有cors限制）
function submitToBackend(type) { 
    alert(`提交到后端模型功能待实现`); 
}



// -------------------------前端函数定义-----------------------------
//-----侧边栏部分
//侧边栏显示
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const currentMargin = parseInt(sidebar.style.marginLeft) || 0;
    sidebar.style.marginLeft = currentMargin === 0 ? '-300px' : '0';
    document.getElementById('toggleSidebar').innerHTML = 
        currentMargin === 0 ? '▶' : '◀';
}
//开启新对话
function createNewChat() {
    //保存对话
    saveCurrentHistory();
    //更新元信息
    updateBasicinfo();
    //初始化页面
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = `
        <div class="insert-zone" onmouseover="showInsertButtons(this)" onmouseout="hideInsertButtons(this)">
            <div class="insert-buttons">
                <button onclick="addMessageAfter(this,'system', 'init')">System</button>
                <button onclick="addMessageAfter(this,'user', 'init')">User</button>
                <button onclick="addMessageAfter(this,'assistant', 'init')">AI</button>
            </div>
        </div>`;
}
//重命名历史记录
//加载历史记录
//删除历史记录



//-----对话部分
//插入消息显示
function showInsertButtons(zone) {
    zone.querySelector('.insert-buttons').style.display = 'flex';
}
function hideInsertButtons(zone) {
    zone.querySelector('.insert-buttons').style.display = 'none';
}
//插入消息
function addMessageAfter(triggerElement,role,content) {
    const template = `
    <div class="message ${role}">
        <div class="message-actions">
            <button onclick="editMessage(this)">✏️</button>
            <button onclick="deleteMessage(this)">🗑️</button>
        </div>
        <div class="content">新${content}消息</div>
    </div>
    <div class="insert-zone" onmouseover="showInsertButtons(this)" onmouseout="hideInsertButtons(this)">
        <div class="insert-buttons">
            <button onclick="addMessageAfter(this,'system', 'init')">System</button>
            <button onclick="addMessageAfter(this,'user', 'init')">User</button>
            <button onclick="addMessageAfter(this,'assistant', 'init')">AI</button>
        </div>
    </div>`;

    const insertZone = triggerElement.closest('.insert-zone');
    if (insertZone) {
        insertZone.insertAdjacentHTML('afterend', template);
    } else {
        console.error("找不到合适的插入位置");
    }
}
//删除消息
function deleteMessage(btn) {
    const message = btn.closest('.message');
    const insertZone = message.nextElementSibling;
    message.remove();
    insertZone?.remove();
}
//修改消息
function editMessage(btn) {
    const contentDiv = btn.closest('.message').querySelector('.content');

    // 获取当前文本内容
    const oldText = contentDiv.innerText;

    // 创建 <textarea> 替代文本内容
    const textarea = document.createElement("textarea");
    textarea.value = oldText;
    textarea.classList.add("edit-textarea"); // 可选：添加样式
    textarea.rows = Math.max(2, oldText.split("\n").length); // 自动调整行数

    // 监听 Enter + Shift 进行换行，Enter 直接提交
    textarea.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // 阻止默认换行
            saveEdit();
        }
    });

    // 失去焦点时自动保存
    textarea.addEventListener("blur", saveEdit);

    function saveEdit() {
        contentDiv.innerText = textarea.value.trim() || "（空消息）";
    }

    // 替换原有文本
    contentDiv.innerHTML = "";
    contentDiv.appendChild(textarea);
    textarea.focus(); // 让输入框自动获取焦点
}

//-----提交部分
//保存历史
function saveHistory(){
    saveCurrentHistory();
}
// 提交模型
async function submitToModel(type) {
    // 获取从前端输入界面传来的各个参数
    const url = document.getElementById('webUrl').value;  // 从前端界面获取URL
    const api_key = document.getElementById('apiKey').value;  // 从前端界面获取API Key
    const modelname = type === 'general' ? document.getElementById('generalModel').value : document.getElementById('reasoningModel').value;  // 根据类型选择模型名称
    const max_token = document.getElementById('maxTokens').value;  // 从前端界面获取最大token数
    const temperature = document.getElementById('temperature').value;  // 从前端界面获取温度

    // 获取当前对话消息（你可以自定义 collectCurrentMessage 函数来收集对话历史）
    const messages = collectCurrentMessage(false);

    // 构建请求体
    const requestPayload = {
        model: modelname,
        messages: messages,
        max_tokens: max_token,
        temperature: temperature,
        stream: true
    };

    // 构建请求头
    const all_message = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${api_key}`  // 添加 Authorization 头部，使用 Bearer Token
        },
        body: JSON.stringify(requestPayload)
    };

    // 发起请求
    const response = await fetch(url, all_message);

    // 使用 ReadableStream 逐步接收流式数据
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    // 逐步处理每个数据块
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        result += chunk;

        // 实时更新 UI（逐步显示AI回复）
        updateChatUI(chunk);
    }

    // 完成最下面的按钮模板
    const template = `
        <div class="insert-zone" onmouseover="showInsertButtons(this)" onmouseout="hideInsertButtons(this)">
            <div class="insert-buttons">
                <button onclick="addMessageAfter(this,'system', 'init')">System</button>
                <button onclick="addMessageAfter(this,'user', 'init')">User</button>
                <button onclick="addMessageAfter(this,'assistant', 'init')">AI</button>
            </div>
        </div>`;
    
    // 将按钮模板添加到UI
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.insertAdjacentHTML('beforeend', template);
}

// 更新聊天UI
function updateChatUI(content) {
    const chatContainer = document.getElementById('chatContainer');
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant';
    messageElement.innerText = content;
    chatContainer.appendChild(messageElement);
}
