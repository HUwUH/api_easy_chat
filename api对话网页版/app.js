// -------------------------预先的函数定义-----------------------------
//收集对话信息，返回list(map(str,str))。
function collectCurrentMessage(includeReasoning = false) {
    const messages = [];
    const messageElements = document.querySelectorAll('.message');

    messageElements.forEach(message => {
        const role = message.classList.contains('system') ? 'system' :
                     message.classList.contains('user') ? 'user' :
                     message.classList.contains('assistant') ? 'assistant' :
                     'reasoning'; // 假设推理消息也有特定类名

        // 如果 excludeReasoning 为 true，跳过 reasoning 类型的消息
        if (!includeReasoning && role === 'reasoning') {
            return; // 跳过当前消息
        }

        const content = message.querySelector('.content').textContent;
        messages.push({ role, content });
    });

    return messages;
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
// 辅助函数：创建消息模板
function createMessageTemplate(role) {
    return `
    <div class="message ${role}">
        <div class="message-actions">
            <button onclick="editMessage(this)">✏️</button>
            <button onclick="deleteMessage(this)">🗑️</button>
        </div>
        <div class="content"></div>
    </div>
    <div class="insert-zone" onmouseover="showInsertButtons(this)" onmouseout="hideInsertButtons(this)">
        <div class="insert-buttons">
            <button onclick="addMessageAfter(this,'system', 'init')">System</button>
            <button onclick="addMessageAfter(this,'user', 'init')">User</button>
            <button onclick="addMessageAfter(this,'assistant', 'init')">AI</button>
        </div>
    </div>`;
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
function addMessageAfter(triggerElement,role) {
    const template = createMessageTemplate(role);

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
    try {
        // 获取从前端输入界面传来的各个参数
        const url = document.getElementById('webUrl').value;  // 从前端界面获取URL
        const api_key = document.getElementById('apiKey').value;  // 从前端界面获取API Key
        const modelname = type === 'general' ? document.getElementById('generalModel').value : document.getElementById('reasoningModel').value;  // 根据类型选择模型名称
        const max_token = parseInt(document.getElementById('maxTokens').value);  // 从前端界面获取最大token数
        const temperature = parseFloat(document.getElementById('temperature').value);  // 从前端界面获取温度

        // 获取当前对话消息
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
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${api_key}`  // 添加 Authorization 头部，使用 Bearer Token
            },
            body: JSON.stringify(requestPayload)
        };

        // 发起请求
        const response = await fetch(url, requestOptions);

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 创建新的消息气泡
        const chatContainer = document.querySelector('.chat-container');
        const lastMessage = chatContainer.lastElementChild;

        // 根据模型类型插入模板
        const template = type === 'general' ? createMessageTemplate('assistant') : createMessageTemplate('reasoning') + createMessageTemplate('assistant');
        lastMessage.insertAdjacentHTML('afterend', template);

        // 获取新插入的消息内容区域
        const reasoningContentDiv = type === 'reasoning' ? chatContainer.querySelector('.message.reasoning .content') : null;
        const assistantContentDiv = chatContainer.querySelector('.message.assistant .content');

        // 使用 ReadableStream 逐步接收流式数据
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        let jsonString = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                // 跳过空行和注释
                if (line.trim() === '' || line.startsWith(':') || line.startsWith("data: [DONE]")) 
                    continue;
                // 提取有效 JSON 数据
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.slice(6); // 去掉 "data: " 前缀
                        const data = JSON.parse(jsonStr);

                        // 处理流式数据
                        if (data.choices && data.choices[0].delta) {
                            let reasoningContent = null;
                            if (data.choices[0].delta.reasoning_content){
                                reasoningContent = data.choices[0].delta.reasoning_content;
                            }
                            const content = data.choices[0].delta.content;
                            // 更新推理内容
                            if (reasoningContent && reasoningContentDiv) {
                                reasoningContentDiv.textContent += reasoningContent;
                            }
                            // 更新普通内容
                            if (content && assistantContentDiv) {
                                assistantContentDiv.textContent += content;
                            }
                        }
                        result += chunk;
                    } catch (error) {
                        console.error('JSON 解析错误:', error);
                    }
                }
            }
        }
    }catch (error) {
        console.error('错误:', error);
        alert('错误:', error);
    }
}
