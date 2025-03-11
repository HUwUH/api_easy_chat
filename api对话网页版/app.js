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

        const content = turndownService.turndown(message.querySelector('.content').innerHTML);
        messages.push({ role, content });
    });

    return messages;
}
//提交信息到后端（如果有cors限制）
function submitToBackend(type) { 
    alert(`提交到后端模型功能待实现`); 
}
// 辅助函数：创建消息模板
function createMessageTemplate(role,content) {
    return `
    <div class="message ${role}">
        <div class="message-actions">
            <button onclick="editMessage(this)">✏️</button>
            <button onclick="deleteMessage(this)">🗑️</button>
        </div>
        <div class="content">${content}</div>
    </div>
    <div class="insert-zone" onmouseover="showInsertButtons(this)" onmouseout="hideInsertButtons(this)">
        <div class="insert-buttons">
            <button onclick="addMessageAfter(this,'assistant')">AI</button>
            <button onclick="addMessageAfter(this,'system')">System</button>
            <button onclick="addMessageAfter(this,'user')">User</button>
        </div>
    </div>`;
}


//---------------------------历史管理-------------------------------------------
//保存当前对话
function saveCurrentHistory(){
    //保存历史到后端
    const current_message = collectCurrentMessage(true);
    const chat_id = Date.now();
    const auto_name = `chat-${new Date(chat_id+8*3600*1000)
        .toISOString().replace(/T/, ' ')
        .replace(/\..+/, '')
        .substring(0, 19)}`;

    const all_data = {
        id: chat_id,
        title: auto_name,
        createdAt: new Date(chat_id).toISOString(),
        messages: [...current_message],
    }
    const history = JSON.parse(localStorage.getItem('chatHistory')) || { chats: {} };
    history.chats[chat_id] = all_data;
    localStorage.setItem('chatHistory', JSON.stringify(history));
    //前端操作
    addHistoryItem(auto_name,chat_id);
    //保存当前温度、最大长度、apikey等共六个数据
    localStorage.setItem('Temperature', parseFloat(document.getElementById('temperature').value));
    localStorage.setItem('MaxTokens',parseInt(document.getElementById('maxTokens').value));
    localStorage.setItem('Url',document.getElementById('webUrl').value);
    localStorage.setItem('ApiKey',document.getElementById('apiKey').value);
    localStorage.setItem('GeneralModel',document.getElementById('generalModel').value);
    localStorage.setItem('ReasonModel',document.getElementById('reasoningModel').value);
}
//增添历史
function addHistoryItem(name, id) {
    const historyList = document.getElementById('historyList');
    
    // 使用模板字符串创建HTML
    const html = `
      <div class="history-item" data-id="${id}">
        <span class="history-title">${name}</span>
        <div class="history-actions">
            <button class="load-history-btn" onclick="loadChat('${id}')">📖</button>
            <button class="rename-history-btn" onclick="renameChat('${id}')">✏️</button>
            <button class="delete-history-btn" onclick="deleteChat('${id}')">🗑️</button>
        </div>
      </div>
    `;
  
    // 插入到列表顶部
    historyList.insertAdjacentHTML('afterbegin', html);
}
//初始化全部历史
function initAllHistorty() {
    //加载温度、最大长度、API Key 等数据
    const temperature = localStorage.getItem('Temperature');
    const maxTokens = localStorage.getItem('MaxTokens');
    const url = localStorage.getItem('Url');
    const apiKey = localStorage.getItem('ApiKey');
    const generalModel = localStorage.getItem('GeneralModel');
    const reasoningModel = localStorage.getItem('ReasonModel');
    if (temperature !== null) document.getElementById('temperature').value = temperature;
    if (maxTokens !== null) document.getElementById('maxTokens').value = maxTokens;
    if (url !== null) document.getElementById('webUrl').value = url;
    if (apiKey !== null) document.getElementById('apiKey').value = apiKey;
    if (generalModel !== null) document.getElementById('generalModel').value = generalModel;
    if (reasoningModel !== null) document.getElementById('reasoningModel').value = reasoningModel;

    //读取历史记录
    const history = JSON.parse(localStorage.getItem('chatHistory')) || { chats: {} };

    //将历史记录按照id排序（从最新到最旧）
    const sortedChats = Object.values(history.chats).sort((a, b) => a.id - b.id);

    //调用 addHistoryItem 生成历史记录
    sortedChats.forEach(chat => {
        addHistoryItem(chat.title, chat.id);
    });
}
//导出全部历史
function exportHistory() {
    // 读取聊天历史
    const history = JSON.parse(localStorage.getItem('chatHistory')) || { chats: {} };
    
    // 读取六项数据
    const settings = {
        Temperature: parseFloat(localStorage.getItem('Temperature')),
        MaxTokens: parseInt(localStorage.getItem('MaxTokens')),
        Url: localStorage.getItem('Url'),
        ApiKey: localStorage.getItem('ApiKey'),
        GeneralModel: localStorage.getItem('GeneralModel'),
        ReasonModel: localStorage.getItem('ReasonModel')
    };
    
    // 合并数据
    const exportData = {
        history,
        settings
    };
    
    // 转换为 JSON 字符串
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // 创建 Blob 对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chat_history_${new Date().toISOString().replace(/:/g, '-')}.json`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
//绑定导出按钮
document.getElementById("exportHistory").addEventListener("click", exportHistory);
//导入全部历史
function importHistory(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (importData.history && importData.settings) {
                // 替换历史记录
                localStorage.setItem('chatHistory', JSON.stringify(importData.history));
                
                // 替换设置项
                localStorage.setItem('Temperature', parseFloat(importData.settings.Temperature));
                localStorage.setItem('MaxTokens', parseInt(importData.settings.MaxTokens));
                localStorage.setItem('Url', importData.settings.Url);
                localStorage.setItem('ApiKey', importData.settings.ApiKey);
                localStorage.setItem('GeneralModel', importData.settings.GeneralModel);
                localStorage.setItem('ReasonModel', importData.settings.ReasonModel);
                
                alert("历史记录导入成功！");
                location.reload(); // 重新加载页面以应用更改
            } else {
                alert("无效的历史文件格式！");
            }
        } catch (error) {
            alert("文件解析失败！请确保上传的是正确的 JSON 文件。");
        }
    };
    reader.readAsText(file);
}
// 创建文件输入并绑定导入功能
document.getElementById("importHistory").addEventListener("click", function() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.addEventListener("change", importHistory);
    input.click();
});






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
    //初始化页面
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = `
        <div class="insert-zone" onmouseover="showInsertButtons(this)" onmouseout="hideInsertButtons(this)">
            <div class="insert-buttons">
                <button onclick="addMessageAfter(this,'assistant')">AI</button>
                <button onclick="addMessageAfter(this,'system')">System</button>
                <button onclick="addMessageAfter(this,'user')">User</button>
            </div>
        </div>`;
}
//重命名历史记录
function renameChat(id) {
    // 找到对应的历史项元素
    const historyItem = document.querySelector(`.history-item[data-id="${id}"]`);
    const titleSpan = historyItem.querySelector('.history-title');
    const originalTitle = titleSpan.textContent;

    // 将标题变为可编辑的输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalTitle;
    input.maxLength = 20; // 限制最大长度
    input.className = 'edit-title-input';
    titleSpan.replaceWith(input);
    input.focus(); // 自动聚焦

    // 保存修改的逻辑
    const saveEdit = () => {
        const newTitle = input.value.trim();
        // 检查合法性：非空且不超过 20 字
        if (newTitle === '' || newTitle.length > 20) {
            // 恢复原始标题
            input.replaceWith(titleSpan);
            titleSpan.textContent = originalTitle;
            return;
        }
        // 更新标题显示
        titleSpan.textContent = newTitle;
        input.replaceWith(titleSpan);
        //更新 localStorage 中的历史数据
        const history = JSON.parse(localStorage.getItem('chatHistory')) || { chats: {} };
        if (history.chats[id]) {
            history.chats[id].title = newTitle;
            localStorage.setItem('chatHistory', JSON.stringify(history));
        } else {
            alert("错误，未找到对应历史记录");
        }
    };

    // 监听 Enter 键和失焦事件
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
    input.addEventListener('blur', saveEdit);
}
//加载历史记录
function loadChat(id) {
    const isConfirmed = confirm("是否保存当前界面历史记录？");
    if (isConfirmed) saveCurrentHistory();
    //初始化页面
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = `
        <div class="insert-zone" onmouseover="showInsertButtons(this)" onmouseout="hideInsertButtons(this)">
            <div class="insert-buttons">
                <button onclick="addMessageAfter(this,'assistant')">AI</button>
                <button onclick="addMessageAfter(this,'system')">System</button>
                <button onclick="addMessageAfter(this,'user')">User</button>
            </div>
        </div>`;
    //获取历史消息
    const history = JSON.parse(localStorage.getItem('chatHistory')) || { chats: {} };
    const chatData = history.chats[id];
    if (!chatData) {
        alert("找不到该历史记录！");
        return;
    }
    //遍历消息并渲染到界面
    chatData.messages.forEach(msg => {
        // 解析 Markdown 内容为 HTML
        const parsedContent = marked.parse(msg.content);
        // 创建消息模板
        const messageHTML = createMessageTemplate(msg.role, parsedContent);
        // 插入到聊天容器末尾
        chatContainer.lastElementChild.insertAdjacentHTML('afterend', messageHTML);
    });

}
//删除历史记录
function deleteChat(id) {
    // 确认是否删除
    const isConfirmed = confirm("确定要删除这条历史记录吗？");
    if (!isConfirmed) return;

    // 从 localStorage 中删除记录
    const history = JSON.parse(localStorage.getItem('chatHistory')) || { chats: {} };
    if (history.chats[id]) {
        delete history.chats[id];
        localStorage.setItem('chatHistory', JSON.stringify(history));
    }

    // 从页面中删除对应的历史项元素
    const historyItem = document.querySelector(`.history-item[data-id="${id}"]`);
    if (historyItem) {
        historyItem.remove();
    }
}


//-----对话部分
//插入消息显示
function showInsertButtons(zone) {
    zone.querySelector('.insert-buttons').style.display = 'flex';
}
function hideInsertButtons(zone) {
    zone.querySelector('.insert-buttons').style.display = 'none';
}
//插入消息
function addMessageAfter(triggerElement,role,content=' ') {
    const template = createMessageTemplate(role,content);

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
    const oldText = turndownService.turndown(contentDiv.innerHTML);

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
        contentDiv.innerHTML = marked.parse(textarea.value) || " ";
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



        // 创建新的消息气泡
        const chatContainer = document.querySelector('.chat-container');
        const lastMessage = chatContainer.lastElementChild;
        // 根据模型类型插入模板
        const template = type === 'general' 
            ? createMessageTemplate('assistant','') 
            : createMessageTemplate('reasoning','') + createMessageTemplate('assistant','');
        lastMessage.insertAdjacentHTML('afterend', template);
        // 根据模型类型获取内容区域
        let reasoningContentDiv = null;
        let assistantContentDiv = null;
        if (type === 'reasoning') {
            const reasonMessage = lastMessage.nextElementSibling;
            const assistMessage = reasonMessage.nextElementSibling.nextElementSibling;
            reasoningContentDiv = reasonMessage.querySelector('.content');
            assistantContentDiv = assistMessage.querySelector('.content');
        } else {
            const assistMessage = lastMessage.nextElementSibling;
            assistantContentDiv = assistMessage.querySelector('.content');
        }



        // 发起请求
        const response = await fetch(url, requestOptions);

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 使用 ReadableStream 逐步接收流式数据
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';

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
                            let content = data.choices[0].delta.content;
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
        assistantContentDiv.innerHTML = marked.parse(assistantContentDiv.textContent)
        if(reasoningContentDiv!=null){
            reasoningContentDiv.innerHTML = marked.parse(reasoningContentDiv.textContent)
        }
    }catch (error) {
        console.error('错误:', error);
        alert('错误:', error);
    }
}







initAllHistorty();