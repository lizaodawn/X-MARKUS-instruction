/**
 * AIChatWidget
 * A reusable, self-contained AI chat component.
 * @version 1.4.7
 * @author yao
 *
 * =================================================================================
 * 使用方法 (How to Use)
 * =================================================================================
 *
 * 1. 在您的 HTML 檔案中加入必要的 Scripts 和一個容器 DIV：
 * <head>
 * <!-- 引入 Tailwind CSS (元件樣式所需) -->
 * <script src="https://cdn.tailwindcss.com"></script>
 * <!-- 引入 Showdown.js (Markdown 格式轉 HTML 所需) -->
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js"></script>
 * <!-- 引入此元件 JS 檔案 -->
 * <script src="AIChatWidget.js" defer></script>
 * </head>
 * <body>
 * <!-- 這是聊天室將會被渲染的地方 -->
 * <div id="my-chat-widget"></div>
 * </body>
 *
 * 2. 在您的 JavaScript 中建立 AIChatWidget 物件：
 *
 * // 等待 DOM 載入完成
 * document.addEventListener('DOMContentLoaded', () => {
 *
 * // --- 基本用法 (預設為英文) ---
 * const chatWidget = new AIChatWidget('my-chat-widget');
 *
 * // --- 客製化用法 (範例：建立一個繁體中文、藍色主題且預設縮小的聊天室) ---
 * const blueChatWidget = new AIChatWidget('another-chat-container', {
 * // 指定語言: 'en', 'zh-TW', 'zh-CN', 'ja', 'ko'
 * language: 'zh-TW',
 * // 是否啟用縮小功能 (預設為 true)
 * minimizable: true,
 * // 是否啟用全螢幕功能 (預設為 true)
 * fullscreenable: true,
 * // 初始狀態 ('normal' 或 'minimized')
 * initialState: 'minimized',
 * // 客製化警語
 * disclaimerText: "AI 回應僅供參考，不代表專業意見。",
 * // 客製化顏色
 * colors: {
 * primary: '#3b82f6',      // 主題色 (按鈕、重點)
 * background: '#f0f9ff',   // 聊天室背景
 * userBubble: '#dbeafe',   // 使用者對話框背景
 * userText: '#1e3a8a',     // 使用者對話框文字
 * aiBubble: '#eff6ff',      // AI 對話框背景
 * aiText: '#1d4ed8'        // AI 對話框文字
 * }
 * });
 *
 * });
 *
 * 3. 透過程式碼控制元件 (Public API Methods):
 *
 * const myWidget = new AIChatWidget('my-chat-widget');
 *
 * // 非同步發送問題並等待回覆
 * myWidget.ask("你好嗎？").then(response => {
 * console.log("AI 的回覆:", response);
 * });
 *
 * // 將文字填入輸入框 (但不送出)
 * myWidget.setInputText("幫我寫一首詩");
 *
 * // 更改聊天室標題
 * myWidget.setTitle("我的專屬助理");
 *
 * // 控制縮小/還原
 * myWidget.minimize();      // 縮小
 * myWidget.restore();       // 還原
 * myWidget.toggleMinimize(); // 切換狀態
 *
 * // 動態啟用或停用縮小功能
 * myWidget.enableMinimize(false); // 停用
 *
 * // --- 取得資料 ---
 * // 取得最後一則 AI 的回覆 (同步)
 * const lastReply = myWidget.getLastResponse();
 *
 * // 取得完整的對話歷史紀錄 (Array)
 * const history = myWidget.getHistory();
 *
 * =================================================================================
 *
 * @param {string} containerId - The ID of the DOM element to render the widget into.
 * @param {object} [options={}] - Optional configuration for the widget.
 * @param {string} [options.language='en'] - The language for the widget UI ('en', 'zh-TW', 'zh-CN', 'ja', 'ko').
 * @param {boolean} [options.minimizable=true] - Whether the minimize functionality is enabled.
 * @param {boolean} [options.fullscreenable=true] - Whether the fullscreen functionality is enabled.
 * @param {string} [options.initialState='normal'] - The initial state of the widget ('normal' or 'minimized').
 * @param {string} [options.disclaimerText] - Optional disclaimer text shown below the input.
 * @param {object} [options.colors] - Optional color theme settings.
 */
class AIChatWidget {
    constructor(containerId, options = {}) {
        this.originalContainer = document.getElementById(containerId);
        if (!this.originalContainer) {
            console.error(`AIChatWidget Error: Container with id "${containerId}" not found.`);
            return;
        }

        
        // --- Options & Theming ---
        
        const defaultColors = {
            primary: '#22c55e', // green-600
            background: '#f3f4f6', // gray-100
            userBubble: '#ebfbe8',
            userText: '#000000',
            aiBubble: '#ffffff',
            aiText: '#050505'
        };
        this.options = {
            colors: { ...defaultColors, ...(options.colors || {}) },
            minimizable: options.minimizable !== false, // default true
            fullscreenable: options.fullscreenable !== false, // default true
            initialState: options.initialState === 'minimized' ? 'minimized' : 'normal',
            language: options.language || 'en',
            disclaimerText: options.disclaimerText // Will use translation default if not provided
        };
        
        // Create the main widget container that will be moved around
        this.container = document.createElement('div');
        this.container.id = `widget-root-${containerId}`;
        this.originalContainer.appendChild(this.container);


        // --- State Management ---
        this.conversationHistory = [];
        this.lastAiResponse = null;
        this.isMaximized = false;


        // --- Icons ---
        this.iconMaximize = `<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
        this.iconRestoreFromMax = `<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`;


        // --- Initialize ---
        this._setupTranslations();
        this._injectCSS();
        this._renderHTML();
        this._initializeShowdown();
        this._queryDOMElements();
        this._attachEventListeners();

        // --- Final Setup ---
        this.loadInitialSettingsAndModels()
            .then(() => {
                this.setInitialMessage();
                this._updateModelWarning(); // Set initial warning
                this.checkAndDisplayKeyWarning();
                 if (this.options.minimizable && this.options.initialState === 'minimized') {
                    this.minimize();
                }
                this.container.style.visibility = 'visible';
            });
    }

    // =================================================================================
    // PUBLIC API METHODS
    // =================================================================================
    minimize() { this._toggleMinimize('minimize'); }
    restore() { this._toggleMinimize('restore'); }
    toggleMinimize() { this._toggleMinimize(); }

    /**
     * Sends a prompt to the AI programmatically and returns a promise that resolves with the AI's response.
     * @param {string} prompt - The question to ask the AI.
     * @returns {Promise<string>} A promise that resolves with the AI's response text.
     */
    ask(prompt) {
        return new Promise(async (resolve, reject) => {
            if (typeof prompt !== 'string' || !prompt.trim()) {
                const errorMsg = "Prompt must be a non-empty string.";
                console.error(errorMsg);
                return reject(new Error(errorMsg));
            }
            this.userInput.value = prompt;
            await this._handleSendMessage(resolve, reject);
        });
    }

    /**
     * Retrieves the last response from the AI.
     * @returns {string|null} The last AI response text, or null if there isn't one.
     */
    getLastResponse() {
        return this.lastAiResponse;
    }
    
    /**
     * Retrieves the entire conversation history.
     * @returns {Array<object>} The conversation history array.
     */
    getHistory() {
        return [...this.conversationHistory]; // Return a copy
    }

    /**
     * Sets the text content of the user input box without sending it.
     * @param {string} text - The text to place in the input box.
     */
    setInputText(text) {
        if (typeof text === 'string') {
            this.userInput.value = text;
            // Manually trigger the input event to handle textarea resizing
            this.userInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.userInput.focus();
        } else {
            console.error("setInputText Error: Input must be a string.");
        }
    }

    /**
     * Sets the title of the chat widget.
     * @param {string} newTitle - The new title text.
     */
    setTitle(newTitle) {
        if (typeof newTitle === 'string' && this.widgetTitle) {
            this.widgetTitle.textContent = newTitle;
        } else {
            console.error("setTitle Error: Title must be a string.");
        }
    }

    /**
     * Enables or disables the minimize functionality dynamically.
     * @param {boolean} enable - True to enable, false to disable.
     */
    enableMinimize(enable) {
        this.options.minimizable = !!enable;
        if (this.minimizeBtn) {
            this.minimizeBtn.style.display = enable ? 'block' : 'none';
        }
        if (!enable) {
            this.restore(); // Ensure it's not stuck minimized
        }
    }

        /**
         * 2. 將 _setupTranslations 和 _t 這兩個方法複製到您的 class 中。
         */
        _setupTranslations() {
            const translations = {
                'en': {
                    aiConversation: "AI Conversation",
                    minimize: "Minimize",
                    fullscreen: "Fullscreen",
                    restore: "Restore",
                    aiModelSettings: "AI Model Settings",
                    loadingSettings: "Loading settings...",
                    typeYourMessage: "Type your message here...",
                    send: "Send",
                    disclaimer: "AI can make mistakes.",
                    selectAiModel: "Select AI Model",
                    temperature: "Temperature",
                    precise: "Precise",
                    creative: "Creative",
                    enableOllama: "Enable Ollama",
                    ollamaRequires: `Requires <a href="https://ollama.com/download" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama</a> and the <a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama Chrome API</a> extension.`,
                    refreshLocalModels: "Refresh Local Models",
                    apiKeyManagement: "API Key Management",
                    apiKeyStorage: "Your keys will be stored securely in your local browser (obfuscated).",
                    getApiKey: "Get API Key",
                    clearAllSettings: "Clear All Settings",
                    saveAndClose: "Save & Close",
                    confirmAction: "Confirm Action",
                    confirmClear: "Are you sure you want to clear all settings? This action cannot be undone.",
                    cancel: "Cancel",
                    confirm: "Confirm",
                    you: "You",
                    copyContent: "Copy {format} Content",
                    downloadFile: "Download {format}",
                    copiedToClipboard: "{type} copied to clipboard!",
                    copyFailed: "Copy failed!",
                    settingsCleared: "All settings cleared. The page will now reload.",
                    settingsSaved: "Settings saved!",
                    initialGreeting: "Hello! Please click the settings icon in the top right to select a model and set up your API key.",
                    greetingWithModel: "Currently using the {modelName} model from {provider}. How can I help you?",
                    foundOllamaModels: "Found {count} Ollama models.",
                    noOllamaModels: "No local Ollama models found.",
                    ollamaConnectionFailed: 'Failed to connect. Is <a href="https://ollama.com/download" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama</a> running and the <a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Chrome Extension</a> installed?',
                    dataStaysLocal: "Your data stays on your computer.",
                    dataSentToCompany: "Your data will be sent to the AI company.",
                    keyNotSet: "Reminder: The required {keyName} is not set for this model.",
                    messageEmpty: "Message cannot be empty.",
                                        apiKeyNotSetError: "Please set and save your {keyName} in \"API Key Management\" first.",
                    customModels: "Custom Models",
                    addCustomModel: "Add Custom Model",
                    modelProvider: "Provider",
                    modelDisplayName: "Display Name",
                    modelId: "Model ID",
                    addModel: "Add",
                    deleteModel: "Delete",
                    noCustomModels: "No custom models added yet.",
                    modelAdded: "Custom model added!",
                    modelDeleted: "Custom model deleted!",
                    fillAllFields: "Please fill in all fields.",
                    selectProvider: "Select Provider",
                    browserAiDetecting: "Browser Built-in AI (detecting...)",
                    browserAiAvailable: "Browser Built-in AI",
                    browserAiAfterDownload: "Browser Built-in AI (needs download)",
                    browserAiNotSupported: "Browser Built-in AI (not supported)",
                },
                'zh-TW': {
                    aiConversation: "AI 對話",
                    minimize: "縮小",
                    fullscreen: "全螢幕",
                    restore: "還原",
                    aiModelSettings: "AI 模型設定",
                    loadingSettings: "正在載入設定...",
                    typeYourMessage: "在這裡輸入您的訊息...",
                    send: "傳送",
                    disclaimer: "AI 可能會犯錯。",
                    selectAiModel: "選擇 AI 模型",
                    temperature: "溫度",
                    precise: "精確",
                    creative: "創意",
                    enableOllama: "啟用 Ollama",
                    ollamaRequires: `需要 <a href="https://ollama.com/download" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama</a> 以及 <a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama Chrome API</a> 擴充功能。`,
                    refreshLocalModels: "重新整理本機模型",
                    apiKeyManagement: "API 金鑰管理",
                    apiKeyStorage: "您的金鑰將會以混淆形式安全地儲存在您的本機瀏覽器中。",
                    getApiKey: "取得 API 金鑰",
                    clearAllSettings: "清除所有設定",
                    saveAndClose: "儲存並關閉",
                    confirmAction: "確認操作",
                    confirmClear: "您確定要清除所有設定嗎？此操作無法復原。",
                    cancel: "取消",
                    confirm: "確認",
                    you: "您",
                    copyContent: "複製 {format} 內容",
                    downloadFile: "下載 {format}",
                    copiedToClipboard: "{type} 已複製到剪貼簿！",
                    copyFailed: "複製失敗！",
                    settingsCleared: "所有設定已清除，頁面即將重新載入。",
                    settingsSaved: "設定已儲存！",
                    initialGreeting: "您好！請點擊右上角的設定圖示來選擇模型並設定您的 API 金鑰。",
                    greetingWithModel: "目前使用 {provider} 的 {modelName} 模型。請問有什麼可以幫助您的嗎？",
                    foundOllamaModels: "找到 {count} 個 Ollama 模型。",
                    noOllamaModels: "找不到任何本機 Ollama 模型。",
                    ollamaConnectionFailed: '連線失敗。Ollama 是否正在運行，且 <a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Chrome 擴充功能</a> 已安裝？',
                    dataStaysLocal: "您的資料會保留在您的電腦上。",
                    dataSentToCompany: "您的資料將會被傳送給 AI 公司。",
                    keyNotSet: "提醒：此模型所需的 {keyName} 尚未設定。",
                    messageEmpty: "訊息不能為空。",
                                        apiKeyNotSetError: "請先在「API 金鑰管理」中設定並儲存您的 {keyName}。",
                    customModels: "自訂模型",
                    addCustomModel: "新增自訂模型",
                    modelProvider: "供應商",
                    modelDisplayName: "顯示名稱",
                    modelId: "模型 ID",
                    addModel: "新增",
                    deleteModel: "刪除",
                    noCustomModels: "尚未新增任何自訂模型。",
                    modelAdded: "自訂模型已新增！",
                    modelDeleted: "自訂模型已刪除！",
                    fillAllFields: "請填寫所有欄位。",
                    selectProvider: "選擇供應商",
                    browserAiDetecting: "瀏覽器內建 AI（偵測中...）",
                    browserAiAvailable: "瀏覽器內建 AI",
                    browserAiAfterDownload: "瀏覽器內建 AI（需下載模型）",
                    browserAiNotSupported: "瀏覽器內建 AI（不支援）",
                },
                'zh-CN': {
                    aiConversation: "AI 对话",
                    minimize: "最小化",
                    fullscreen: "全屏",
                    restore: "还原",
                    aiModelSettings: "AI 模型设置",
                    loadingSettings: "正在加载设置...",
                    typeYourMessage: "在此输入您的消息...",
                    send: "发送",
                    disclaimer: "AI 可能会犯错。",
                    selectAiModel: "选择 AI 模型",
                    temperature: "温度",
                    precise: "精确",
                    creative: "创意",
                    enableOllama: "启用 Ollama",
                    ollamaRequires: `需要 <a href="https://ollama.com/download" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama</a> 以及 <a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama Chrome API</a> 扩展程序。`,
                    refreshLocalModels: "刷新本地模型",
                    apiKeyManagement: "API 密钥管理",
                    apiKeyStorage: "您的密钥将以混淆形式安全地存储在您的本地浏览器中。",
                    getApiKey: "获取 API 密钥",
                    clearAllSettings: "清除所有设置",
                    saveAndClose: "保存并关闭",
                    confirmAction: "确认操作",
                    confirmClear: "您确定要清除所有设置吗？此操作无法撤销。",
                    cancel: "取消",
                    confirm: "确认",
                    you: "您",
                    copyContent: "复制 {format} 内容",
                    downloadFile: "下载 {format}",
                    copiedToClipboard: "{type} 已复制到剪贴板！",
                    copyFailed: "复制失败！",
                    settingsCleared: "所有设置已清除，页面即将重新加载。",
                    settingsSaved: "设置已保存！",
                    initialGreeting: "您好！请点击右上角的设置图标来选择模型并设置您的 API 密钥。",
                    greetingWithModel: "当前使用 {provider} 的 {modelName} 模型。有什么可以帮助您的吗？",
                    foundOllamaModels: "找到 {count} 个 Ollama 模型。",
                    noOllamaModels: "找不到任何本地 Ollama 模型。",
                    ollamaConnectionFailed: '连接失败。Ollama 是否正在运行，且 <a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Chrome 扩展程序</a> 已安装？',
                    dataStaysLocal: "您的数据会保留在您的计算机上。",
                    dataSentToCompany: "您的数据将会被发送给 AI 公司。",
                    keyNotSet: "提醒：此模型所需的 {keyName} 尚未设置。",
                    messageEmpty: "消息不能为空。",
                    apiKeyNotSetError: "请先在“API 密钥管理”中设置并保存您的 {keyName}。",
                    customModels: "自定义模型",
                    addCustomModel: "添加自定义模型",
                    modelProvider: "供应商",
                    modelDisplayName: "显示名称",
                    modelId: "模型 ID",
                    addModel: "添加",
                    deleteModel: "删除",
                    noCustomModels: "尚未添加任何自定义模型。",
                    modelAdded: "自定义模型已添加！",
                    modelDeleted: "自定义模型已删除！",
                    fillAllFields: "请填写所有字段。",
                    selectProvider: "选择供应商",
                    browserAiDetecting: "浏览器内置 AI（检测中...）",
                    browserAiAvailable: "浏览器内置 AI",
                    browserAiAfterDownload: "浏览器内置 AI（需下载模型）",
                    browserAiNotSupported: "浏览器内置 AI（不支持）",
                },
                'ja': {
                    aiConversation: "AI会話",
                    minimize: "最小化",
                    fullscreen: "全画面表示",
                    restore: "元に戻す",
                    aiModelSettings: "AIモデル設定",
                    loadingSettings: "設定を読み込み中...",
                    typeYourMessage: "ここにメッセージを入力してください...",
                    send: "送信",
                    disclaimer: "AIは間違いを犯す可能性があります。",
                    selectAiModel: "AIモデルを選択",
                    temperature: "温度",
                    precise: "正確",
                    creative: "創造的",
                    enableOllama: "Ollamaを有効にする",
                    ollamaRequires: `<a href="https://ollama.com/download" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama</a> と <a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama Chrome API</a> 拡張機能が必要です。`,
                    refreshLocalModels: "ローカルモデルを更新",
                    apiKeyManagement: "APIキー管理",
                    apiKeyStorage: "キーは難読化されてローカルブラウザに安全に保存されます。",
                    getApiKey: "APIキーを取得",
                    clearAllSettings: "すべての設定をクリア",
                    saveAndClose: "保存して閉じる",
                    confirmAction: "アクションの確認",
                    confirmClear: "すべての設定をクリアしてもよろしいですか？この操作は元に戻せません。",
                    cancel: "キャンセル",
                    confirm: "確認",
                    you: "あなた",
                    copyContent: "{format} コンテンツをコピー",
                    downloadFile: "{format} をダウンロード",
                    copiedToClipboard: "{type} をクリップボードにコピーしました！",
                    copyFailed: "コピーに失敗しました！",
                    settingsCleared: "すべての設定がクリアされました。ページがリロードされます。",
                    settingsSaved: "設定が保存されました！",
                    initialGreeting: "こんにちは！右上の設定アイコンをクリックして、モデルを選択し、APIキーを設定してください。",
                    greetingWithModel: "現在、{provider} の {modelName} モデルを使用しています。何かお手伝いできることはありますか？",
                    foundOllamaModels: "{count} 個の Ollama モデルが見つかりました。",
                    noOllamaModels: "ローカルの Ollama モデルが見つかりません。",
                    ollamaConnectionFailed: '接続に失敗しました。<a href="https://ollama.com/download" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama</a> が実行中で、<a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Chrome 拡張機能</a> がインストールされていることを確認してください。',
                    dataStaysLocal: "あなたのデータはコンピュータ上に留まります。",
                    dataSentToCompany: "あなたのデータは AI 企業に送信されます。",
                    keyNotSet: "注意：このモデルに必要な {keyName} が設定されていません。",
                    messageEmpty: "メッセージは空にできません。",
                                        apiKeyNotSetError: "まず「APIキー管理」で {keyName} を設定して保存してください。",
                    customModels: "カスタムモデル",
                    addCustomModel: "カスタムモデルを追加",
                    modelProvider: "プロバイダー",
                    modelDisplayName: "表示名",
                    modelId: "モデル ID",
                    addModel: "追加",
                    deleteModel: "削除",
                    noCustomModels: "カスタムモデルはまだ追加されていません。",
                    modelAdded: "カスタムモデルが追加されました！",
                    modelDeleted: "カスタムモデルが削除されました！",
                    fillAllFields: "すべてのフィールドを入力してください。",
                    selectProvider: "プロバイダーを選択",
                    browserAiDetecting: "ブラウザ内蔵 AI（検出中...）",
                    browserAiAvailable: "ブラウザ内蔵 AI",
                    browserAiAfterDownload: "ブラウザ内蔵 AI（ダウンロード必要）",
                    browserAiNotSupported: "ブラウザ内蔵 AI（非対応）",
                },
                'ko': {
                    aiConversation: "AI 대화",
                    minimize: "최소화",
                    fullscreen: "전체 화면",
                    restore: "복원",
                    aiModelSettings: "AI 모델 설정",
                    loadingSettings: "설정 로드 중...",
                    typeYourMessage: "여기에 메시지를 입력하세요...",
                    send: "전송",
                    disclaimer: "AI는 실수를 할 수 있습니다.",
                    selectAiModel: "AI 모델 선택",
                    temperature: "온도",
                    precise: "정확하게",
                    creative: "창의적으로",
                    enableOllama: "Ollama 활성화",
                    ollamaRequires: `<a href="https://ollama.com/download" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama</a> 및 <a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama Chrome API</a> 확장 프로그램이 필요합니다.`,
                    refreshLocalModels: "로컬 모델 새로 고침",
                    apiKeyManagement: "API 키 관리",
                    apiKeyStorage: "키는 난독화되어 로컬 브라우저에 안전하게 저장됩니다.",
                    getApiKey: "API 키 받기",
                    clearAllSettings: "모든 설정 지우기",
                    saveAndClose: "저장하고 닫기",
                    confirmAction: "작업 확인",
                    confirmClear: "모든 설정을 지우시겠습니까? 이 작업은 되돌릴 수 없습니다.",
                    cancel: "취소",
                    confirm: "확인",
                    you: "당신",
                    copyContent: "{format} 콘텐츠 복사",
                    downloadFile: "{format} 다운로드",
                    copiedToClipboard: "{type}이(가) 클립보드에 복사되었습니다!",
                    copyFailed: "복사 실패!",
                    settingsCleared: "모든 설정이 지워졌습니다. 페이지가 다시 로드됩니다.",
                    settingsSaved: "설정이 저장되었습니다!",
                    initialGreeting: "안녕하세요! 오른쪽 상단의 설정 아이콘을 클릭하여 모델을 선택하고 API 키를 설정하세요.",
                    greetingWithModel: "현재 {provider}의 {modelName} 모델을 사용하고 있습니다. 무엇을 도와드릴까요?",
                    foundOllamaModels: "{count}개의 Ollama 모델을 찾았습니다.",
                    noOllamaModels: "로컬 Ollama 모델을 찾을 수 없습니다.",
                    ollamaConnectionFailed: '연결에 실패했습니다. <a href="https://ollama.com/download" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Ollama</a>가 실행 중이고 <a href="https://chromewebstore.google.com/detail/ollama-chrome-api/eeceimooeojijecjhjedodbhimcfgiif" target="_blank" class="hover:underline" style="color: var(--widget-primary-color);">Chrome 확장 프로그램</a>이 설치되어 있는지 확인하세요.',
                    dataStaysLocal: "데이터는 컴퓨터에 저장됩니다.",
                    dataSentToCompany: "데이터가 AI 회사로 전송됩니다.",
                    keyNotSet: "알림: 이 모델에 필요한 {keyName}이(가) 설정되지 않았습니다.",
                    messageEmpty: "메시지는 비워 둘 수 없습니다.",
                    apiKeyNotSetError: "먼저 'API 키 관리'에서 {keyName}을(를) 설정하고 저장하십시오.",
                    customModels: "사용자 정의 모델",
                    addCustomModel: "사용자 정의 모델 추가",
                    modelProvider: "공급업체",
                    modelDisplayName: "표시 이름",
                    modelId: "모델 ID",
                    addModel: "추가",
                    deleteModel: "삭제",
                    noCustomModels: "아직 사용자 정의 모델이 추가되지 않았습니다.",
                    modelAdded: "사용자 정의 모델이 추가되었습니다!",
                    modelDeleted: "사용자 정의 모델이 삭제되었습니다!",
                    fillAllFields: "모든 필드를 입력하세요.",
                    selectProvider: "공급업체 선택",
                    browserAiDetecting: "브라우저 내장 AI（감지 중...）",
                    browserAiAvailable: "브라우저 내장 AI",
                    browserAiAfterDownload: "브라우저 내장 AI（다운로드 필요）",
                    browserAiNotSupported: "브라우저 내장 AI（지원 안 됨）",
                }
            };

            this.translations = translations;
            
            // Normalize language code (support both 'zh-TW'/'zh-tw' and 'zh-CN'/'zh-cn')
            let requestedLang = this.options.language || 'en';
            const langLower = requestedLang.toLowerCase();
            
            // Map common variations to standard keys
            const langMap = {
                'zh-tw': 'zh-TW',
                'zh-cn': 'zh-CN',
                'zh_tw': 'zh-TW',
                'zh_cn': 'zh-CN',
                'zhtw': 'zh-TW',
                'zhcn': 'zh-CN'
            };
            
            // Check if we need to map the language code
            if (langMap[langLower]) {
                requestedLang = langMap[langLower];
            }
            
            // Fallback to English if the selected language doesn't exist
            this.lang = this.translations[requestedLang] ? requestedLang : 'en';
        }

        /**
         * Gets a translated string for a given key.
         * @param {string} key - The key of the string to translate.
         * @returns {string} The translated string.
         */
        _t(key) {
            return this.translations[this.lang][key] || this.translations['en'][key] || `[${key}]`;
        }

    // =================================================================================
    // INITIALIZATION & RENDERING
    // =================================================================================

    /**
     * A helper function to lighten or darken a hex color.
     * @param {string} color - The hex color string (e.g., "#RRGGBB").
     * @param {number} amount - The amount to adjust by (negative for darker, positive for lighter).
     * @returns {string} The adjusted hex color string.
     */
    _adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, c => ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
    }

    _injectCSS() {
        const style = document.createElement('style');
        style.id = `ai-chat-widget-styles-${this.container.id}`;
        
        // Define CSS variables from options for theming
        const colors = this.options.colors;
        const primaryHover = this._adjustColor(colors.primary, -20);
        const primaryLight = this._adjustColor(colors.primary, 180);
        const primaryDarkText = this._adjustColor(colors.primary, -80);
        const primaryLightHover = this._adjustColor(primaryLight, -10);

        const css = `
            #${this.container.id} {
                visibility: hidden; /* Initially hide the widget */
                --widget-primary-color: ${colors.primary};
                --widget-primary-color-hover: ${primaryHover};
                --widget-primary-color-light: ${primaryLight};
                --widget-primary-color-dark-text: ${primaryDarkText};
                --widget-primary-color-light-hover: ${primaryLightHover};
                --widget-background-color: ${colors.background};
                --widget-user-bubble-color: ${colors.userBubble};
                --widget-user-text-color: ${colors.userText};
                --widget-ai-bubble-color: ${colors.aiBubble};
                --widget-ai-text-color: ${colors.aiText};
            }
            #${this.container.id} * { box-sizing: border-box; }
            #${this.container.id} .chat-bubble { max-width: 80%; padding: 12px 18px; border-radius: 20px; margin-bottom: 10px; line-height: 1.5; word-wrap: break-word; }
            #${this.container.id} .chat-bubble-user { background-color: var(--widget-user-bubble-color); color: var(--widget-user-text-color); margin-left: auto; border-bottom-right-radius: 5px; }
            #${this.container.id} .chat-bubble-ai { background-color: var(--widget-ai-bubble-color); color: var(--widget-ai-text-color); margin-right: auto; border-bottom-left-radius: 5px; }
            #${this.container.id} .typing-indicator { display: flex; align-items: center; }
            #${this.container.id} .typing-indicator span { height: 10px; width: 10px; background-color: #90949c; border-radius: 50%; display: inline-block; margin: 0 2px; animation: bounce 1.4s infinite ease-in-out both; }
            #${this.container.id} .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
            #${this.container.id} .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
            @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
            #${this.container.id} pre { background-color: #2d2d2d; color: #f1f1f1; padding: 1rem; border-radius: 8px; overflow-x: auto; position: relative; }
            #${this.container.id} .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background-color: #2d3748; color: white; padding: 10px 20px; border-radius: 8px; z-index: 10000; opacity: 0; transition: opacity 0.5s ease-in-out; visibility: hidden; }
            #${this.container.id} .toast.show { opacity: 1; visibility: visible; }
            #${this.container.id} .thinking-block { color: #6b7280; font-style: italic; padding: 0.75rem; margin-top: 0.5rem; margin-bottom: 0.5rem; background-color: #f3f4f6; border-left-width: 4px; border-color: #d1d5db; border-radius: 0.375rem; }
            #${this.container.id} .data-block table { width: 100%; border-collapse: collapse; table-layout: auto; margin-top: 8px; }
            #${this.container.id} .data-block th, #${this.container.id} .data-block td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            #${this.container.id} .data-block th { background-color: #f3f4f6; }
            #${this.container.id} .chat-textarea { transition: height 0.3s ease-in-out; resize: none; }
            
            #chat-window-${this.container.id} {
                height: 92vh;
                //max-height: 1000px;
            }

            /* Maximize Styles */
            #${this.container.id}.widget-maximized {
                position: fixed !important;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9998;
                background-color: rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            #${this.container.id}.widget-maximized > .widget-wrapper {
                width: 100%;
                height: 100%;
                max-width: 1400px;
                max-height: 95vh;
            }
            #${this.container.id}.widget-maximized #widget-content-wrapper-${this.container.id} > div {
                 padding: 0 !important;
            }
            #${this.container.id}.widget-maximized #chat-window-${this.container.id} {
                border-radius: 0.75rem;
                height: 100%;
                max-height: 100%;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            }

            /* Minimize Styles */
            #restoreBtn-${this.container.id} {
                display: none;
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                width: 3.5rem; /* 56px */
                height: 3.5rem; /* 56px */
                border-radius: 9999px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                align-items: center;
                justify-content: center;
                cursor: pointer;
                background-color: var(--widget-primary-color);
                color: white;
            }
            #restoreBtn-${this.container.id} svg {
                width: 1.75rem; /* 28px */
                height: 1.75rem; /* 28px */
            }
            #${this.container.id}.widget-minimized #widget-content-wrapper-${this.container.id} {
                display: none;
            }
            #${this.container.id}.widget-minimized #restoreBtn-${this.container.id} {
                display: flex;
            }
        `;
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    _renderHTML() {
        this.container.innerHTML = `
          <div class="widget-wrapper flex flex-row h-full w-full overflow-x-hidden" style="font-family: 'Inter', sans-serif;">
            <div id="widget-content-wrapper-${this.container.id}" class="w-full">
                <div class="flex flex-col flex-auto h-full">
                    <div id="chat-window-${this.container.id}" class="flex flex-col flex-auto flex-shrink-0 rounded-2xl h-full" style="background-color: var(--widget-background-color);">
                        <div class="flex flex-row items-center justify-between p-2 border-b border-gray-200">
                            <span id="widget-title-${this.container.id}" class="font-semibold text-lg">${this._t('aiConversation')}</span>
                            <div class="flex items-center space-x-1">
                                ${this.options.minimizable ? `
                                <button id="minimizeBtn-${this.container.id}" class="p-2 rounded-full hover:bg-gray-200" title="${this._t('minimize')}">
                                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                                </button>` : ''}
                                ${this.options.fullscreenable ? `
                                <button id="maximizeBtn-${this.container.id}" class="p-2 rounded-full hover:bg-gray-200" title="${this._t('fullscreen')}">
                                    ${this.iconMaximize}
                                </button>` : ''}
                                <button id="settingsBtn-${this.container.id}" class="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2" style="--tw-ring-color: var(--widget-primary-color);" title="${this._t('aiModelSettings')}">
                                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </button>
                            </div>
                        </div>
                        <div id="chat-container-${this.container.id}" class="flex flex-col h-full overflow-y-auto mb-4">
                            <div class="flex flex-col h-full">
                                <div class="grid grid-cols-12 gap-y-2">
                                    <div class="col-start-1 col-end-12 p-3 rounded-lg" id="initial-message-container-${this.container.id}">
                                        <div class="flex flex-row items-center">
                                            <div class="flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 text-white font-bold" style="background-color: var(--widget-primary-color);">A</div>
                                            <div class="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                                                <div id="initial-ai-message-${this.container.id}">${this._t('loadingSettings')}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-row items-center h-auto rounded-xl bg-white w-full px-4 py-2">
                            <div class="flex-grow">
                                <textarea id="userInput-${this.container.id}" class="chat-textarea flex w-full border rounded-xl focus:outline-none pl-4 py-2" style="--tw-ring-color: var(--widget-primary-color); --focus-border-color: var(--widget-primary-color);" onfocus="this.style.borderColor = this.style.getPropertyValue('--focus-border-color')" onblur="this.style.borderColor = ''" rows="1" placeholder="${this._t('typeYourMessage')}"></textarea>
                            </div>
                            <div class="ml-4">
                                <button id="sendBtn-${this.container.id}" class="flex items-center justify-center rounded-xl text-white px-4 py-2 flex-shrink-0" style="background-color: var(--widget-primary-color);" onmouseover="this.style.backgroundColor= 'var(--widget-primary-color-hover)'" onmouseout="this.style.backgroundColor='var(--widget-primary-color)'">
                                    <span>${this._t('send')}</span>
                                    <span class="ml-2"><svg class="w-4 h-4 transform rotate-45 -mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></span>
                                </button>
                            </div>
                        </div>
                        <p id="disclaimer-${this.container.id}" class="text-xs text-gray-400 text-center mt-2 px-4">${this.options.disclaimerText || this._t('disclaimer')}</p>
                    </div>
                </div>
            </div>
            <button id="restoreBtn-${this.container.id}">
                 <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
            <div id="toast-${this.container.id}" class="toast"></div>
            <div id="settingsModal-${this.container.id}" class="fixed inset-0 bg-black bg-opacity-50 z-[10000] hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-full overflow-y-auto">
                    <div class="flex justify-between items-center p-4 border-b">
                        <h2 class="text-xl font-bold">${this._t('aiModelSettings')}</h2>
                        <button id="closeModalBtn-${this.container.id}" class="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
                    </div>
                    <div class="p-6">
                        <div class="flex flex-col md:flex-row md:space-x-8 space-y-6 md:space-y-0">
                            <!-- Left Column -->
                            <div class="w-full md:w-1/2 flex flex-col space-y-4">
                                <div>
                                    <label for="aiModel-${this.container.id}" class="block text-sm font-medium text-gray-700">${this._t('selectAiModel')}</label>
                                    <select id="aiModel-${this.container.id}" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus-outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md">
                                        <optgroup label="Browser (Local)" id="browser-model-group-${this.container.id}">
                                            <option value="browser-builtin" disabled>${this._t('browserAiDetecting')}</option>
                                        </optgroup>
                                        <optgroup label="Ollama (Local)" id="ollama-model-group-${this.container.id}" style="display: none;"></optgroup>
                                        <optgroup label="Google">
                                            <option value="gemini-3.5-flash-preview">Gemini 3.5 Flash</option>
                                            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                                            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                                            <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                                            <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                                            <option value="gemini-2.5-flash" selected>Gemini 2.5 Flash (Default)</option>
                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                            <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
                                            <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
                                        </optgroup>
                                        <optgroup label="Anthropic">
                                            <option value="claude-opus-4-7-20260416">Claude Opus 4.7</option>
                                            <option value="claude-sonnet-4-6-20260217">Claude Sonnet 4.6</option>
                                            <option value="claude-opus-4-5-20251124">Claude Opus 4.5</option>
                                            <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                                            <option value="claude-haiku-4-5-20251015">Claude Haiku 4.5</option>
                                            <option value="claude-opus-4-1-20250805">Claude Opus 4.1</option>
                                            <option value="claude-3-5-sonnet-20240620">Claude Sonnet 3.5</option>
                                            <option value="claude-3-opus-20240229">Claude Opus 3</option>
                                        </optgroup>
                                        <optgroup label="OpenAI">
                                            <option value="gpt-5.5-pro">GPT-5.5 Pro</option>
                                            <option value="gpt-5.5">GPT-5.5</option>
                                            <option value="gpt-5.4">GPT-5.4</option>
                                            <option value="gpt-5.2">GPT-5.2</option>
                                            <option value="gpt-5.2-chat-latest">GPT-5.2 Chat</option>
                                            <option value="gpt-5.2-pro">GPT-5.2 Pro</option>
                                            <option value="gpt-5">GPT-5</option>
                                            <option value="gpt-4o">GPT-4o</option>
                                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                        </optgroup>
                                        <optgroup label="xAI">
                                            <option value="grok-4-0709">grok-4-0709</option>
                                            <option value="grok-3-mini">grok-3-mini</option>
                                            <option value="grok-3">grok-3</option>
                                        </optgroup>
                                        <optgroup label="DeepSeek">
                                            <option value="deepseek-v4-pro">DeepSeek-V4 Pro</option>
                                            <option value="deepseek-v4-flash">DeepSeek-V4 Flash</option>
                                            <option value="deepseek-r1-0528">DeepSeek-R1 (0528 Update)</option>
                                            <option value="deepseek-r1">DeepSeek-R1</option>
                                            <option value="deepseek-v3">DeepSeek-V3</option>
                                            <option value="deepseek-chat">DeepSeek Chat</option>
                                        </optgroup>
                                    </select>
                                    <div id="model-warning-${this.container.id}" class="text-xs mt-2"></div>
                                    <div id="key-warning-${this.container.id}" class="text-red-500 text-xs mt-1" style="display: none;"></div>
                                </div>

                                <div class="pt-4 border-t">
                                    <label for="temperatureSlider-${this.container.id}" class="block text-sm font-medium text-gray-700">${this._t('temperature')}: <span id="temperatureValue-${this.container.id}">0.7</span></label>
                                    <input id="temperatureSlider-${this.container.id}" type="range" min="0" max="1" step="0.1" value="0.7" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                                    <div class="flex justify-between text-xs text-gray-500"><p>${this._t('precise')}</p><p>${this._t('creative')}</p></div>
                                </div>

                                <div class="border-t pt-4">
                                    <h3 class="text-lg font-semibold">Ollama (Local)</h3>
                                    <div class="flex items-center mt-2">
                                        <input type="checkbox" id="enableOllama-${this.container.id}" class="h-4 w-4 text-green-600 border-gray-300 rounded" style="color: var(--widget-primary-color)">
                                        <label for="enableOllama-${this.container.id}" class="ml-2 block text-sm text-gray-900">${this._t('enableOllama')}</label>
                                    </div>
                                    <div id="ollama-error-${this.container.id}" class="text-red-500 text-xs mt-1" style="display: none;"></div>
                                    <p class="text-xs text-gray-500 mt-1">${this._t('ollamaRequires')}</p>
                                    <button id="refreshOllamaBtn-${this.container.id}" class="mt-2 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" disabled>${this._t('refreshLocalModels')}</button>
                                </div>
                                
                                <!-- Custom Models Section -->
                                <div class="border-t pt-4">
                                    <h3 class="text-lg font-semibold">${this._t('customModels')}</h3>
                                    <p class="text-xs text-gray-500 mt-1 mb-3">${this._t('addCustomModel')}</p>
                                    
                                    <div class="space-y-2">
                                        <select id="customModelProvider-${this.container.id}" class="block w-full px-3 py-2 text-sm border-gray-300 rounded-md">
                                            <option value="">${this._t('selectProvider')}</option>
                                            <option value="Google">Google</option>
                                            <option value="Anthropic">Anthropic</option>
                                            <option value="OpenAI">OpenAI</option>
                                            <option value="Groq">Groq</option>
                                            <option value="DeepSeek">DeepSeek</option>
                                        </select>
                                        <input type="text" id="customModelName-${this.container.id}" class="block w-full px-3 py-2 text-sm border-gray-300 rounded-md" placeholder="${this._t('modelDisplayName')} (e.g. GPT-6)">
                                        <input type="text" id="customModelId-${this.container.id}" class="block w-full px-3 py-2 text-sm border-gray-300 rounded-md" placeholder="${this._t('modelId')} (e.g. gpt-6-preview)">
                                        <button id="addCustomModelBtn-${this.container.id}" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none" style="background-color: var(--widget-primary-color);" onmouseover="this.style.backgroundColor='var(--widget-primary-color-hover)'" onmouseout="this.style.backgroundColor='var(--widget-primary-color)'">${this._t('addModel')}</button>
                                    </div>
                                    
                                    <div id="customModelsList-${this.container.id}" class="mt-3 space-y-2"></div>
                                </div>
                            </div>
                            <!-- Right Column -->
                            <div class="w-full md:w-1/2 border-t md:border-t-0 md:border-l border-gray-200 md:pl-8 pt-6 md:pt-0">
                                <h3 class="text-lg font-semibold mb-2">${this._t('apiKeyManagement')}</h3>
                                <div class="space-y-4">
                                    <p class="text-xs text-gray-500">${this._t('apiKeyStorage')}</p>
                                    <div>
                                        <div class="flex items-center"><label for="geminiApiKey-${this.container.id}" class="block text-sm font-medium text-gray-700">Gemini API Key</label><a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-xs hover:underline ml-2" style="color: var(--widget-primary-color);">(${this._t('getApiKey')})</a></div>
                                        <input type="password" id="geminiApiKey-${this.container.id}" class="api-key-input mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" placeholder="AIzaSy...">
                                    </div>
                                    <div>
                                        <div class="flex items-center"><label for="claudeApiKey-${this.container.id}" class="block text-sm font-medium text-gray-700">Claude API Key</label><a href="https://docs.claude.com" target="_blank" class="text-xs hover:underline ml-2" style="color: var(--widget-primary-color);">(${this._t('getApiKey')})</a></div>
                                        <input type="password" id="claudeApiKey-${this.container.id}" class="api-key-input mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" placeholder="sk-ant-...">
                                    </div>
                                    <div>
                                        <div class="flex items-center"><label for="openaiApiKey-${this.container.id}" class="block text-sm font-medium text-gray-700">OpenAI API Key</label><a href="https://platform.openai.com/api-keys" target="_blank" class="text-xs hover:underline ml-2" style="color: var(--widget-primary-color);">(${this._t('getApiKey')})</a></div>
                                        <input type="password" id="openaiApiKey-${this.container.id}" class="api-key-input mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" placeholder="sk-...">
                                    </div>
                                    <div>
                                        <div class="flex items-center"><label for="groqApiKey-${this.container.id}" class="block text-sm font-medium text-gray-700">Groq API Key</label><a href="https://console.groq.com/keys" target="_blank" class="text-xs hover:underline ml-2" style="color: var(--widget-primary-color);">(${this._t('getApiKey')})</a></div>
                                        <input type="password" id="groqApiKey-${this.container.id}" class="api-key-input mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" placeholder="gsk_...">
                                    </div>
                                    <div>
                                        <div class="flex items-center"><label for="deepseekApiKey-${this.container.id}" class="block text-sm font-medium text-gray-700">DeepSeek API Key</label><a href="https://platform.deepseek.com/api_keys" target="_blank" class="text-xs hover:underline ml-2" style="color: var(--widget-primary-color);">(${this._t('getApiKey')})</a></div>
                                        <input type="password" id="deepseekApiKey-${this.container.id}" class="api-key-input mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" placeholder="dk_...">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center p-4 border-t gap-4">
                        <button id="clearSettingsBtn-${this.container.id}" class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">${this._t('clearAllSettings')}</button>
                        <button id="saveKeysBtn-${this.container.id}" class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2" style="background-color: var(--widget-primary-color); --tw-ring-color: var(--widget-primary-color);" onmouseover="this.style.backgroundColor='var(--widget-primary-color-hover)'" onmouseout="this.style.backgroundColor='var(--widget-primary-color)'">${this._t('saveAndClose')}</button>
                    </div>
                </div>
            </div>
            <div id="confirmModal-${this.container.id}" class="fixed inset-0 bg-black bg-opacity-50 z-[10000] hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
                    <div class="p-6">
                        <h3 class="text-lg font-bold text-gray-900">${this._t('confirmAction')}</h3>
                        <p class="mt-2 text-sm text-gray-600">${this._t('confirmClear')}</p>
                    </div>
                    <div class="flex justify-end items-center gap-4 p-4 bg-gray-50 rounded-b-lg">
                        <button id="cancelClearBtn-${this.container.id}" class="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">${this._t('cancel')}</button>
                        <button id="confirmClearBtn-${this.container.id}" class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">${this._t('confirm')}</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    
    _initializeShowdown() {
        if (typeof showdown === 'undefined') {
            console.error("Showdown.js library is not loaded. Markdown conversion will not work.");
            this.markdownConverter = { makeHtml: (text) => text }; // Fallback
        } else {
            this.markdownConverter = new showdown.Converter({ tables: true, simplifiedAutoLink: true, openLinksInNewWindow: true });
        }
    }

    _queryDOMElements() {
        const id = this.container.id;
        this.widgetTitle = this.container.querySelector(`#widget-title-${id}`);
        this.maximizeBtn = this.container.querySelector(`#maximizeBtn-${id}`);
        this.widgetContentWrapper = this.container.querySelector(`#widget-content-wrapper-${id}`);
        this.browserModelGroup = this.container.querySelector(`#browser-model-group-${id}`);
        this.aiModelSelect = this.container.querySelector(`#aiModel-${id}`);
        this.modelWarning = this.container.querySelector(`#model-warning-${id}`);
        this.temperatureSlider = this.container.querySelector(`#temperatureSlider-${id}`);
        this.temperatureValueDisplay = this.container.querySelector(`#temperatureValue-${id}`);
        this.claudeApiKeyInput = this.container.querySelector(`#claudeApiKey-${id}`);
        this.geminiApiKeyInput = this.container.querySelector(`#geminiApiKey-${id}`);
        this.openaiApiKeyInput = this.container.querySelector(`#openaiApiKey-${id}`);
        this.groqApiKeyInput = this.container.querySelector(`#groqApiKey-${id}`);
        this.deepseekApiKeyInput = this.container.querySelector(`#deepseekApiKey-${id}`);
        this.saveKeysBtn = this.container.querySelector(`#saveKeysBtn-${id}`);
        this.enableOllamaCheckbox = this.container.querySelector(`#enableOllama-${id}`);
        this.refreshOllamaBtn = this.container.querySelector(`#refreshOllamaBtn-${id}`);
        this.ollamaErrorDiv = this.container.querySelector(`#ollama-error-${id}`);
        this.scrollContainer = this.container.querySelector(`#chat-container-${id}`);
        this.chatGrid = this.container.querySelector(`#chat-container-${id} .grid`);
        this.userInput = this.container.querySelector(`#userInput-${id}`);
        this.sendBtn = this.container.querySelector(`#sendBtn-${id}`);
        this.toast = this.container.querySelector(`#toast-${id}`);
        this.keyWarningDiv = this.container.querySelector(`#key-warning-${id}`);
        this.initialMessageDiv = this.container.querySelector(`#initial-ai-message-${id}`);
        this.settingsBtn = this.container.querySelector(`#settingsBtn-${id}`);
        this.settingsModal = this.container.querySelector(`#settingsModal-${id}`);
        this.closeModalBtn = this.container.querySelector(`#closeModalBtn-${id}`);
        this.clearSettingsBtn = this.container.querySelector(`#clearSettingsBtn-${id}`);
        this.confirmModal = this.container.querySelector(`#confirmModal-${id}`);
        this.confirmClearBtn = this.container.querySelector(`#confirmClearBtn-${id}`);
        this.cancelClearBtn = this.container.querySelector(`#cancelClearBtn-${id}`);
        this.minimizeBtn = this.container.querySelector(`#minimizeBtn-${id}`);
        
        // Custom Models elements
        this.customModelProviderSelect = this.container.querySelector(`#customModelProvider-${id}`);
        this.customModelNameInput = this.container.querySelector(`#customModelName-${id}`);
        this.customModelIdInput = this.container.querySelector(`#customModelId-${id}`);
        this.addCustomModelBtn = this.container.querySelector(`#addCustomModelBtn-${id}`);
        this.customModelsList = this.container.querySelector(`#customModelsList-${id}`);
        this.restoreBtn = this.container.querySelector(`#restoreBtn-${id}`);
    }

    _attachEventListeners() {
        if (this.minimizeBtn) {
            this.minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        }
        if (this.restoreBtn) {
            this.restoreBtn.addEventListener('click', () => this.toggleMinimize());
        }
        if (this.maximizeBtn) {
            this.maximizeBtn.addEventListener('click', () => this._toggleMaximize());
        }
        this.saveKeysBtn.addEventListener('click', () => this.saveSettings());
        this.refreshOllamaBtn.addEventListener('click', () => this.discoverOllamaModels(true));
        this.enableOllamaCheckbox.addEventListener('change', () => this.handleOllamaToggle());
        this.sendBtn.addEventListener('click', () => this._handleSendMessage());
        this.temperatureSlider.addEventListener('input', () => {
            this.temperatureValueDisplay.textContent = this.temperatureSlider.value;
        });
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._handleSendMessage();
            }
        });
        
        this.userInput.addEventListener('input', () => {
            const textarea = this.userInput;
            const charCount = textarea.value.length;
            if (charCount > 200) {
                 textarea.style.height = '400px';
            } else {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
            if(textarea.value === '') textarea.style.height = 'auto';
        });

        this.aiModelSelect.addEventListener('change', () => {
             this.checkAndDisplayKeyWarning();
             this._updateModelWarning();
        });
        this.container.querySelectorAll('.api-key-input').forEach(input => {
            input.addEventListener('input', () => this.checkAndDisplayKeyWarning());
        });

        this.settingsBtn.addEventListener('click', () => this.settingsModal.classList.remove('hidden'));
        this.closeModalBtn.addEventListener('click', () => this.settingsModal.classList.add('hidden'));

        this.clearSettingsBtn.addEventListener('click', () => this.confirmModal.classList.remove('hidden'));
        this.cancelClearBtn.addEventListener('click', () => this.confirmModal.classList.add('hidden'));
        this.confirmClearBtn.addEventListener('click', () => {
            localStorage.clear();
            this.confirmModal.classList.add('hidden');
            this.showToast(this._t('settingsCleared'));
            setTimeout(() => location.reload(), 1500);
        });
        
        // Custom Models event listeners
        this.addCustomModelBtn.addEventListener('click', () => this._addCustomModel());
    }

    // =================================================================================
    // CORE LOGIC 
    // =================================================================================
    
    _encrypt(text) {
        if (!text) return text;
        try {
            return btoa(text);
        } catch (e) {
            console.error("Encryption failed:", e);
            return text;
        }
    }

    _decrypt(encryptedText) {
        if (!encryptedText) return encryptedText;
        try {
            return atob(encryptedText);
        } catch (e) {
            console.error("Decryption failed, returning raw text:", e);
            return encryptedText; // Fallback to raw text if decryption fails
        }
    }

    _toggleMinimize(state) {
        if (!this.options.minimizable) return;

        if (state === 'minimize') {
            this.container.classList.add('widget-minimized');
        } else if (state === 'restore') {
            this.container.classList.remove('widget-minimized');
        } else {
            this.container.classList.toggle('widget-minimized');
        }
    }

    _toggleMaximize() {
        if (!this.options.fullscreenable) return;
        
        this.isMaximized = !this.isMaximized;
        // The root element `this.container` is what gets moved and styled.
        
        if (this.isMaximized) {
            // Move to body for true fullscreen
            document.body.appendChild(this.container);
            this.container.classList.add('widget-maximized');
            this.maximizeBtn.innerHTML = this.iconRestoreFromMax;
            this.maximizeBtn.title = this._t('restore');
        } else {
            // Move back to its original placeholder
            this.originalContainer.appendChild(this.container);
            this.container.classList.remove('widget-maximized');
            this.maximizeBtn.innerHTML = this.iconMaximize;
            this.maximizeBtn.title = this._t('fullscreen');
        }
    }

    async loadInitialSettingsAndModels() {
        // Load API Keys
        this.claudeApiKeyInput.value = this._decrypt(localStorage.getItem('claudeApiKey')) || '';
        this.geminiApiKeyInput.value = this._decrypt(localStorage.getItem('geminiApiKey')) || '';
        this.openaiApiKeyInput.value = this._decrypt(localStorage.getItem('openaiApiKey')) || '';
        this.groqApiKeyInput.value = this._decrypt(localStorage.getItem('groqApiKey')) || '';
        this.deepseekApiKeyInput.value = this._decrypt(localStorage.getItem('deepseekApiKey')) || '';

        // Load Temperature
        const savedTemp = localStorage.getItem('aiTemperature') || '0.7';
        this.temperatureSlider.value = savedTemp;
        this.temperatureValueDisplay.textContent = savedTemp;

        // Detect Browser Built-in AI
        await this._detectBrowserModel();

        // Check if Ollama should be enabled from settings
        const ollamaEnabled = localStorage.getItem('ollamaEnabled') === 'true';
        if (ollamaEnabled) {
            this.enableOllamaCheckbox.checked = true;
            this.refreshOllamaBtn.disabled = false;
            // Await the discovery of models so the dropdown is populated
            await this.discoverOllamaModels(false);
        }

        // Load custom models
        this._renderCustomModelsDropdown();
        this._renderCustomModelsList();
        
        // After all potential options are loaded (including async Ollama), set the selected model
        const savedModel = localStorage.getItem('selectedAiModel');
        if (savedModel) {
            const optionExists = Array.from(this.aiModelSelect.options).find(o => o.value === savedModel);
            if (optionExists) {
                this.aiModelSelect.value = savedModel;
            } else {
                // This case can happen if the saved model was an Ollama model and the connection failed.
                console.warn(`Saved model "${savedModel}" not found in dropdown. It may be an offline Ollama model.`);
            }
        }
    }

    saveSettings() {
        localStorage.setItem('claudeApiKey', this._encrypt(this.claudeApiKeyInput.value));
        localStorage.setItem('geminiApiKey', this._encrypt(this.geminiApiKeyInput.value));
        localStorage.setItem('openaiApiKey', this._encrypt(this.openaiApiKeyInput.value));
        localStorage.setItem('groqApiKey', this._encrypt(this.groqApiKeyInput.value));
        localStorage.setItem('deepseekApiKey', this._encrypt(this.deepseekApiKeyInput.value));
        localStorage.setItem('ollamaEnabled', this.enableOllamaCheckbox.checked);
        localStorage.setItem('selectedAiModel', this.aiModelSelect.value);
        localStorage.setItem('aiTemperature', this.temperatureSlider.value);
        this.showToast(this._t('settingsSaved'));
        this.checkAndDisplayKeyWarning();
        this.setInitialMessage();
        this.settingsModal.classList.add('hidden');
    }

    setInitialMessage() {
        if (!this.initialMessageDiv) return;
        const selectedOption = this.aiModelSelect.options[this.aiModelSelect.selectedIndex];
        if (!selectedOption) {
            this.initialMessageDiv.textContent = this._t('initialGreeting');
            return;
        }

        // Check if custom model and get effective provider
        const isCustomModel = selectedOption.dataset.customProvider;
        const provider = isCustomModel ? selectedOption.dataset.customProvider : selectedOption.parentElement.label;
        const modelName = selectedOption.value;
        let isConfigured = false;

        switch (provider) {
            case 'Browser (Local)': isConfigured = true; break;
            case 'Ollama (Local)': if (localStorage.getItem('ollamaEnabled') === 'true') isConfigured = true; break;
            case 'Google': if (this.geminiApiKeyInput.value) isConfigured = true; break;
            case 'Anthropic': if (this.claudeApiKeyInput.value) isConfigured = true; break;
            case 'OpenAI': if (this.openaiApiKeyInput.value) isConfigured = true; break;
            case 'Groq': if (this.groqApiKeyInput.value) isConfigured = true; break;
            case 'DeepSeek': if (this.deepseekApiKeyInput.value) isConfigured = true; break;
        }

        if (isConfigured) {
            this.initialMessageDiv.textContent = this._t('greetingWithModel').replace('{modelName}', modelName).replace('{provider}', provider);
        } else {
            this.initialMessageDiv.textContent = this._t('initialGreeting');
        }
    }
    
    async handleOllamaToggle() {
        const isEnabled = this.enableOllamaCheckbox.checked;
        const ollamaGroup = this.container.querySelector(`#ollama-model-group-${this.container.id}`);
        this.refreshOllamaBtn.disabled = !isEnabled;
        if (isEnabled) {
            await this.discoverOllamaModels(true);
        } else {
            ollamaGroup.style.display = 'none';
            this.ollamaErrorDiv.style.display = 'none';
        }
    }

    async discoverOllamaModels(showSuccessToast) {
        const ollamaGroup = this.container.querySelector(`#ollama-model-group-${this.container.id}`);
        this.ollamaErrorDiv.style.display = 'none';
        this.refreshOllamaBtn.disabled = true; // Disable while fetching

        try {
            const response = await fetch('http://localhost:11434/api/tags');
            if (!response.ok) throw new Error('Ollama service not available.');
            const data = await response.json();

            if (data.models && data.models.length > 0) {
                ollamaGroup.innerHTML = '';
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    ollamaGroup.appendChild(option);
                });
                ollamaGroup.style.display = 'block';
                this.refreshOllamaBtn.disabled = false; // Re-enable on success
                
                if (showSuccessToast) this.showToast(this._t('foundOllamaModels').replace('{count}', data.models.length));
            } else {
                ollamaGroup.style.display = 'none';
                this.ollamaErrorDiv.textContent = this._t('noOllamaModels');
                this.ollamaErrorDiv.style.display = 'block';
                this.refreshOllamaBtn.disabled = false; // Re-enable even if no models, to allow retry
            }
        } catch (error) {
            console.warn("Could not fetch Ollama models.", error);
            ollamaGroup.style.display = 'none';
            // DO NOT uncheck the box. Keep the user's saved preference.
            this.refreshOllamaBtn.disabled = false; // Re-enable to allow retry
            this.ollamaErrorDiv.innerHTML = this._t('ollamaConnectionFailed');
            this.ollamaErrorDiv.style.display = 'block';
        }
    }

    _updateModelWarning() {
        const selectedOption = this.aiModelSelect.options[this.aiModelSelect.selectedIndex];
        if (!selectedOption || !this.modelWarning) return;

        // Check if custom model and get effective provider
        const isCustomModel = selectedOption.dataset.customProvider;
        const provider = isCustomModel ? selectedOption.dataset.customProvider : selectedOption.parentElement.label;
        if (provider === 'Ollama (Local)' || provider === 'Browser (Local)') {
            this.modelWarning.textContent = this._t('dataStaysLocal');
            this.modelWarning.className = 'text-xs mt-2 text-blue-600';
        } else {
            this.modelWarning.textContent = this._t('dataSentToCompany');
            this.modelWarning.className = 'text-xs mt-2 text-red-600';
        }
    }

    // =================================================================================
    // CUSTOM MODELS MANAGEMENT
    // =================================================================================
    
    _getCustomModels() {
        try {
            const stored = localStorage.getItem('customModels');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading custom models:', e);
            return [];
        }
    }
    
    _saveCustomModels(models) {
        localStorage.setItem('customModels', JSON.stringify(models));
    }
    
    _addCustomModel() {
        const provider = this.customModelProviderSelect.value;
        const displayName = this.customModelNameInput.value.trim();
        const modelId = this.customModelIdInput.value.trim();
        
        if (!provider || !displayName || !modelId) {
            this.showToast(this._t('fillAllFields'));
            return;
        }
        
        const models = this._getCustomModels();
        const newModel = {
            id: `custom_${Date.now()}`,
            provider: provider,
            displayName: displayName,
            modelId: modelId
        };
        
        models.push(newModel);
        this._saveCustomModels(models);
        
        // Clear inputs
        this.customModelProviderSelect.value = '';
        this.customModelNameInput.value = '';
        this.customModelIdInput.value = '';
        
        // Refresh UI
        this._renderCustomModelsDropdown();
        this._renderCustomModelsList();
        
        this.showToast(this._t('modelAdded'));
    }
    
    _deleteCustomModel(modelId) {
        let models = this._getCustomModels();
        models = models.filter(m => m.id !== modelId);
        this._saveCustomModels(models);
        
        // Refresh UI
        this._renderCustomModelsDropdown();
        this._renderCustomModelsList();
        
        this.showToast(this._t('modelDeleted'));
    }
    
    _renderCustomModelsDropdown() {
        const models = this._getCustomModels();
        
        // First, remove all previously added custom model options (marked with data-custom-model-id)
        this.aiModelSelect.querySelectorAll('option[data-custom-model-id]').forEach(opt => opt.remove());
        
        // Also remove any legacy "Custom Models" optgroup if it exists from older versions
        const legacyGroup = Array.from(this.aiModelSelect.querySelectorAll('optgroup')).find(
            og => og.label === 'Custom Models'
        );
        if (legacyGroup) {
            legacyGroup.remove();
        }
        
        if (models.length === 0) {
            return;
        }
        
        // Group models by provider
        const groupedModels = {};
        models.forEach(model => {
            if (!groupedModels[model.provider]) {
                groupedModels[model.provider] = [];
            }
            groupedModels[model.provider].push(model);
        });
        
        // Provider label to optgroup label mapping
        const providerLabels = {
            'Google': 'Google',
            'Anthropic': 'Anthropic',
            'OpenAI': 'OpenAI',
            'Groq': 'Groq',
            'DeepSeek': 'DeepSeek'
        };
        
        // Insert custom models at the beginning of their respective provider groups
        Object.keys(groupedModels).forEach(provider => {
            const optgroupLabel = providerLabels[provider];
            if (!optgroupLabel) return; // Skip if provider not in predefined list
            
            // Find the optgroup for this provider
            const allOptgroups = Array.from(this.aiModelSelect.querySelectorAll('optgroup'));
            const optgroup = allOptgroups.find(og => og.label === optgroupLabel);
            
            if (!optgroup) return;
            
            // Insert custom models at the beginning of this optgroup (in reverse order to maintain order)
            const customModelsForProvider = [...groupedModels[provider]].reverse();
            customModelsForProvider.forEach(model => {
                const option = document.createElement('option');
                option.value = model.modelId;
                option.textContent = `⭐ ${model.displayName}`;
                option.dataset.customProvider = provider;
                option.dataset.customModelId = model.id;
                
                // Insert at the beginning of the optgroup
                if (optgroup.firstChild) {
                    optgroup.insertBefore(option, optgroup.firstChild);
                } else {
                    optgroup.appendChild(option);
                }
            });
        });
    }
    
    _renderCustomModelsList() {
        const models = this._getCustomModels();
        
        if (!this.customModelsList) return;
        
        if (models.length === 0) {
            this.customModelsList.innerHTML = `<p class="text-xs text-gray-400 italic">${this._t('noCustomModels')}</p>`;
            return;
        }
        
        // Group models by provider for compact display
        const groupedModels = {};
        models.forEach(model => {
            if (!groupedModels[model.provider]) {
                groupedModels[model.provider] = [];
            }
            groupedModels[model.provider].push(model);
        });
        
        // Create collapsible list grouped by provider
        let html = `<div class="border rounded-md overflow-hidden mt-2" style="max-height: 200px; overflow-y: auto;">`;
        
        Object.keys(groupedModels).forEach(provider => {
            html += `
                <div class="border-b last:border-b-0">
                    <div class="bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 sticky top-0">${provider} (${groupedModels[provider].length})</div>
                    <div class="divide-y divide-gray-100">
                        ${groupedModels[provider].map(model => `
                            <div class="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 text-xs">
                                <div class="flex-1 min-w-0">
                                    <span class="font-medium text-gray-800">${model.displayName}</span>
                                    <span class="text-gray-400 ml-1 truncate">${model.modelId}</span>
                                </div>
                                <button class="delete-custom-model-btn ml-2 text-red-400 hover:text-red-600 p-1" data-model-id="${model.id}" title="${this._t('deleteModel')}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        html += `<p class="text-xs text-gray-400 mt-1 text-right">${models.length} ${this._t('customModels').toLowerCase()}</p>`;
        
        this.customModelsList.innerHTML = html;
        
        // Attach delete event listeners
        this.customModelsList.querySelectorAll('.delete-custom-model-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modelId = e.currentTarget.dataset.modelId;
                this._deleteCustomModel(modelId);
            });
        });
    }


    checkAndDisplayKeyWarning() {
        const selectedOption = this.aiModelSelect.options[this.aiModelSelect.selectedIndex];
        if (!selectedOption) return;
        
        // Check if custom model and get effective provider
        const isCustomModel = selectedOption.dataset.customProvider;
        const provider = isCustomModel ? selectedOption.dataset.customProvider : selectedOption.parentElement.label;
        let requiredKeyInput, keyName;

        if (provider === 'Ollama (Local)' || provider === 'Browser (Local)') {
            if (this.keyWarningDiv) this.keyWarningDiv.style.display = 'none';
            return;
        } else if (provider === 'Anthropic') {
            requiredKeyInput = this.claudeApiKeyInput; keyName = 'Claude API Key';
        } else if (provider === 'Google') {
            requiredKeyInput = this.geminiApiKeyInput; keyName = 'Gemini API Key';
        } else if (provider === 'OpenAI') {
            requiredKeyInput = this.openaiApiKeyInput; keyName = 'OpenAI API Key';
        } else if (provider === 'Groq') {
            requiredKeyInput = this.groqApiKeyInput; keyName = 'Groq API Key';
        } else if (provider === 'DeepSeek') {
            requiredKeyInput = this.deepseekApiKeyInput; keyName = 'DeepSeek API Key';
        }
        
        if (!this.keyWarningDiv) return;

        if (requiredKeyInput && requiredKeyInput.value.trim() === '') {
            this.keyWarningDiv.textContent = this._t('keyNotSet').replace('{keyName}', keyName);
            this.keyWarningDiv.style.display = 'block';
        } else {
            this.keyWarningDiv.style.display = 'none';
        }
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        setTimeout(() => this.toast.classList.remove('show'), 3000);
    }
    
    async _handleSendMessage(resolve, reject) {
        const message = this.userInput.value.trim();
        if (!message) {
            if (reject) reject(new Error(this._t('messageEmpty')));
            return;
        };

        const initialMessageContainer = this.container.querySelector(`#initial-message-container-${this.container.id}`);
        if (initialMessageContainer) this.chatGrid.innerHTML = '';

        const selectedOption = this.aiModelSelect.options[this.aiModelSelect.selectedIndex];
        const provider = selectedOption.parentElement.label;

        this._appendMessage(message, 'user');
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        this.conversationHistory.push({ role: 'user', content: message });

        const typingIndicatorId = this._appendTypingIndicator(provider);
        try {
            const responseText = await this._callAiModel(message);
            document.getElementById(typingIndicatorId)?.remove();
            this._appendMessage(responseText, 'ai', false, provider);
            this.conversationHistory.push({ role: 'assistant', content: responseText });
            this.lastAiResponse = responseText;
            if (resolve) resolve(responseText);
        } catch (error) {
            console.error('API Call Failed:', error);
            document.getElementById(typingIndicatorId)?.remove();
            this._appendMessage(`Error: ${error.message}`, 'ai', true, provider);
            if (reject) reject(error);
        }
    }
    
    _getProviderIcon(provider) {
        // Check if this is a custom model
        const selectedOption = this.aiModelSelect.options[this.aiModelSelect.selectedIndex];
        const isCustomModel = selectedOption && selectedOption.dataset.customProvider;
        const effectiveProvider = isCustomModel ? selectedOption.dataset.customProvider : provider;
        
        switch (effectiveProvider) {
            case 'Google': return { text: 'G', classes: 'bg-green-500 text-white' };
            case 'Anthropic': return { text: 'C', classes: 'bg-orange-500 text-white' };
            case 'OpenAI': return { text: 'O', classes: 'bg-gray-700 text-white' };
            case 'Groq': return { text: 'g', classes: 'bg-purple-500 text-white' };
            case 'DeepSeek': return { text: 'D', classes: 'bg-blue-600 text-white' };
            case 'Ollama (Local)': return { text: 'O', classes: 'bg-white text-black border-2 border-black' };
            case 'Browser (Local)': return { text: 'B', classes: 'bg-teal-500 text-white' };
            default: return { text: 'AI', classes: 'text-white' };
        }
    }

    _appendMessage(text, sender, isError = false, provider = 'AI') {
        const messageWrapper = document.createElement('div');
        let messageHtml;
        if (sender === 'user') {
            messageWrapper.className = 'col-start-6 col-end-13 p-3 rounded-lg';
            messageHtml = `<div class="flex items-center justify-start flex-row-reverse"><div class="flex items-center justify-center h-10 w-10 rounded-full bg-gray-500 flex-shrink-0 text-white font-bold">${this._t('you')}</div><div class="relative mr-3 text-sm chat-bubble chat-bubble-user shadow"><div>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div></div></div>`;
        } else {
            const icon = this._getProviderIcon(provider);
            const modelName = this.aiModelSelect.value;
            const tooltipTitle = `${provider}: ${modelName}`;
            messageWrapper.className = 'col-start-1 col-end-12 p-3 rounded-lg';
            
            const processed = isError ? { html: `<div class="text-red-500 font-semibold">${text}</div>`, datasets: [] } : this._processAIResponse(text);
            
            let bubbleHtml = `<div class="flex flex-row items-start"><div class="flex items-center justify-center h-10 w-10 rounded-full ${icon.classes} flex-shrink-0 font-bold" style="background-color: ${provider === 'AI' ? 'var(--widget-primary-color)' : ''}" title="${tooltipTitle}">${icon.text}</div><div class="relative ml-3 text-sm chat-bubble chat-bubble-ai shadow">${processed.html}</div></div>`;
            
            let buttonsHtml = '';
            if (processed.datasets && processed.datasets.length > 0) {
                processed.datasets.forEach((dataset) => {
                    const format = dataset.format.toUpperCase();
                    const encodedContent = encodeURIComponent(dataset.content);
                    buttonsHtml += `
                        <div class="flex flex-row">
                            <div class="w-10 flex-shrink-0"></div>
                            <div class="ml-3 mt-2 flex space-x-2">
                                <button class="copy-data-btn text-xs font-bold py-1 px-3 rounded-full flex items-center" style="background-color: var(--widget-primary-color-light); color: var(--widget-primary-color-dark-text);" onmouseover="this.style.backgroundColor='var(--widget-primary-color-light-hover)'" onmouseout="this.style.backgroundColor='var(--widget-primary-color-light)'" data-content="${encodedContent}">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    ${this._t('copyContent').replace('{format}', format)}
                                </button>
                                <button class="download-data-btn text-xs font-bold py-1 px-3 rounded-full flex items-center" style="background-color: var(--widget-primary-color-light); color: var(--widget-primary-color-dark-text);" onmouseover="this.style.backgroundColor='var(--widget-primary-color-light-hover)'" onmouseout="this.style.backgroundColor='var(--widget-primary-color-light)'" data-content="${encodedContent}" data-format="${dataset.format}">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    ${this._t('downloadFile').replace('{format}', format)}
                                </button>
                            </div>
                        </div>`;
                });
            }
            messageHtml = bubbleHtml + buttonsHtml;
        }
        messageWrapper.innerHTML = messageHtml;
        this.chatGrid.appendChild(messageWrapper);
        if (sender === 'ai') {
            this._attachDataButtonListeners(messageWrapper);
        }
        setTimeout(() => { this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight; }, 0);
    }
    
    _appendTypingIndicator(provider) {
        const typingId = `typing-${Date.now()}`;
        const icon = this._getProviderIcon(provider);
        const modelName = this.aiModelSelect.value;
        const tooltipTitle = `${provider}: ${modelName}`;
        const indicatorHtml = `<div id="${typingId}" class="col-start-1 col-end-12 p-3 rounded-lg"><div class="flex flex-row items-center"><div class="flex items-center justify-center h-10 w-10 rounded-full ${icon.classes} flex-shrink-0 font-bold" style="background-color: ${provider === 'AI' ? 'var(--widget-primary-color)' : ''}" title="${tooltipTitle}">${icon.text}</div><div class="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>`;
        this.chatGrid.insertAdjacentHTML('beforeend', indicatorHtml);
        setTimeout(() => { this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight; }, 0);
        return typingId;
    }
    
    /**
     * Heuristic to check if a block of text is TSV-like.
     * @param {string} text The text content to check.
     * @returns {boolean} True if the text seems to be TSV.
     */
    _isTsvLike(text) {
        const lines = text.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return false; // Must have at least a header and a row

        const tabCounts = lines.map(line => (line.match(/\t/g) || []).length);

        // The first line must have at least one tab to be considered a potential header
        if (tabCounts[0] === 0) return false;

        // Check if most lines have the same number of tabs as the header
        const headerTabCount = tabCounts[0];
        const matchingLines = tabCounts.filter(count => count === headerTabCount).length;
        
        // Heuristic: If over 70% of lines have the same number of tabs as the header, classify as TSV.
        return (matchingLines / lines.length) > 0.7;
    }

    _processAIResponse(text) {
        let tempText = text;
        const itemsToProcess = [];
        const placeholder = (index) => `<!-- ITEM_PLACEHOLDER_${index} -->`;
    
        // 1. Explicit TSV/CSV blocks
        tempText = tempText.replace(/```(tsv|csv)\n([\s\S]*?)\n```/g, (match, type, content) => {
            itemsToProcess.push({ type: 'data', content: content.trim(), format: type });
            return placeholder(itemsToProcess.length - 1);
        });

        // 2. Markdown tables
        tempText = tempText.replace(/(?:^\|.*\|(?:\r\n|\n))+(?:^\|(?: *\:?-+\:? *\|)+)(?:(?:\r\n|\n)|$)(?:(?:^\|.*\|(?:\r\n|\n)?)+)?/gm, (match) => {
            const tsvContent = this._convertMarkdownTableToTsv(match);
            itemsToProcess.push({ type: 'data', content: tsvContent, format: 'tsv', originalMarkdown: match });
            return placeholder(itemsToProcess.length - 1);
        });
        
        // 3. Generic code blocks - with added heuristic for TSV
        tempText = tempText.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
            const langMatch = codeContent.match(/^(\w+)\n/);
            let finalContent = codeContent;
            let language = langMatch ? langMatch[1].toLowerCase() : null;

            if (langMatch) {
                finalContent = codeContent.substring(langMatch[0].length);
            }
            
            // If it's not explicitly a known language and it looks like TSV, treat it as data.
            if (!language && this._isTsvLike(finalContent)) {
                 itemsToProcess.push({ type: 'data', content: finalContent.trim(), format: 'tsv' });
            } else {
                 itemsToProcess.push({ type: 'code', content: finalContent });
            }
            return placeholder(itemsToProcess.length - 1);
        });
        
        let html = this.markdownConverter.makeHtml(tempText);
        let allDataContent = [];
    
        itemsToProcess.forEach((item, index) => {
            let replacementHtml = '';
            if (item.type === 'data') {
                allDataContent.push({ content: item.content, format: item.format });
                const tableHtml = item.originalMarkdown ? this.markdownConverter.makeHtml(item.originalMarkdown) : this.markdownConverter.makeHtml(this._convertTsvToMarkdownTable(item.content));
                replacementHtml = `<div class="data-block">${tableHtml}</div>`;
            } else if (item.type === 'code') {
                replacementHtml = `<pre><code>${item.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
            }
            html = html.replace(placeholder(index), replacementHtml);
        });
    
        return { html, datasets: allDataContent };
    }

    _convertMarkdownTableToTsv(markdownTable) {
        if (!markdownTable || typeof markdownTable !== 'string') return '';
        const lines = markdownTable.trim().split('\n');
        const dataLines = lines.filter(line => !/^\s*\|?(:?-+:?\|)+(:?-+:?)?\|?\s*$/.test(line.trim()));
        return dataLines.map(line => {
            let cleanLine = line.trim().replace(/^\||\|$/g, '').trim();
            return cleanLine.split('|').map(cell => cell.trim()).join('\t');
        }).join('\n');
    }

    _convertTsvToMarkdownTable(tsv) {
        const lines = tsv.trim().split('\n');
        if (lines.length === 0) return '';
        const tableLines = [];
        const header = lines[0].split('\t');
        tableLines.push(`| ${header.join(' | ')} |`);
        tableLines.push(`|${header.map(() => '---').join('|')}|`);
        for (let i = 1; i < lines.length; i++) {
            tableLines.push(`| ${lines[i].split('\t').join(' | ')} |`);
        }
        return tableLines.join('\n');
    }

    _attachDataButtonListeners(container) {
        container.querySelectorAll('.copy-data-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const content = decodeURIComponent(e.currentTarget.dataset.content);
                this._copyTextToClipboard(content, 'Data');
            });
        });

        container.querySelectorAll('.download-data-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const content = decodeURIComponent(e.currentTarget.dataset.content);
                const format = e.currentTarget.dataset.format || 'txt';
                const now = new Date();
                const fileName = `export-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.${format}`;
                const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/tab-separated-values;charset=utf-8;';
                
                const blob = new Blob([content], { type: mimeType });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        });
    }

    _copyTextToClipboard(text, type = 'Text') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = 0;
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            this.showToast(this._t('copiedToClipboard').replace('{type}', type));
        } catch (err) {
            console.error('Could not copy text: ', err);
            this.showToast(this._t('copyFailed'));
        }
        document.body.removeChild(textarea);
    }
    
    async _callAiModel(prompt) {
        const selectedOption = this.aiModelSelect.options[this.aiModelSelect.selectedIndex];
        const provider = selectedOption.parentElement.label;
        const model = this.aiModelSelect.value;
        const temperature = parseFloat(localStorage.getItem('aiTemperature') || 0.7);

        let config, apiKey, keyName;
        const openAICompatibleBody = {
            model: model,
            messages: this.conversationHistory,
            temperature: temperature
        };

        // Check if this is a custom model
        const isCustomModel = selectedOption && selectedOption.dataset.customProvider;
        const effectiveProvider = isCustomModel ? selectedOption.dataset.customProvider : provider;

        // --- Browser Built-in AI (Prompt API) ---
        if (effectiveProvider === 'Browser (Local)') {
            // Resolve API across Chrome versions
            // Chrome 138+: window.LanguageModel  (availability() returns string)
            // Chrome 127–137: window.ai.languageModel  (capabilities() returns { available })
            // Chrome 122–126: window.ai.assistant  (legacy)
            let langModelAPI = null;
            if (window.LanguageModel) langModelAPI = window.LanguageModel;
            else if (window.ai?.languageModel) langModelAPI = window.ai.languageModel;
            else if (window.ai?.assistant) langModelAPI = window.ai.assistant;

            if (!langModelAPI) throw new Error(this._t('browserAiNotSupported'));

            try {
                // Check availability (API differs by version)
                let available;
                if (window.LanguageModel) {
                    available = await window.LanguageModel.availability();
                } else {
                    const caps = await langModelAPI.capabilities();
                    available = caps.available;
                }
                if (available === 'no') throw new Error(this._t('browserAiNotSupported'));

                const sessionOptions = { temperature: Math.min(Math.max(temperature, 0), 1) };
                const history = this.conversationHistory.slice(0, -1);
                if (history.length > 0) {
                    sessionOptions.initialPrompts = history.map(msg => ({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    }));
                }
                const session = await langModelAPI.create(sessionOptions);
                const response = await session.prompt(prompt);
                session.destroy();
                return response;
            } catch (error) {
                throw new Error(`Browser AI Error: ${error.message || error}`);
            }
        }

        switch (effectiveProvider) {
            case 'Google':
                apiKey = this._decrypt(localStorage.getItem('geminiApiKey'));
                keyName = 'Gemini API Key';
                config = {
                    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    buildBody: () => ({ 
                        contents: [...this.conversationHistory.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })).slice(0, -1), { role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: temperature
                        }
                    }),
                    parseResponse: (data) => data.candidates?.[0]?.content.parts[0].text || "The API returned an empty result, possibly due to content moderation.",
                    parseError: (errorData) => `Gemini API Error: ${errorData.error.message || 'Unknown error'}`
                };
                break;
            case 'Anthropic':
                apiKey = this._decrypt(localStorage.getItem('claudeApiKey'));
                keyName = 'Claude API Key';
                config = {
                    url: 'https://api.anthropic.com/v1/messages',
                    method: 'POST',
                    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
                    buildBody: () => ({ 
                        model: model, 
                        max_tokens: 4096, 
                        messages: this.conversationHistory,
                        temperature: temperature
                    }),
                    parseResponse: (data) => data.content[0].text,
                    parseError: (errorData) => `Claude API Error: ${errorData.error.message || 'Unknown error'}`,
                    corsError: 'Claude API call failed due to browser security restrictions (CORS). For a production app, proxy this request through a backend server.'
                };
                break;
            case 'OpenAI':
                apiKey = this._decrypt(localStorage.getItem('openaiApiKey'));
                keyName = 'OpenAI API Key';
                config = { buildBody: () => openAICompatibleBody, url: 'https://api.openai.com/v1/chat/completions', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, parseResponse: (data) => data.choices[0].message.content, parseError: (errorData) => `OpenAI API Error: ${errorData.error.message || 'Unknown error'}` };
                break;
            case 'Groq':
                apiKey = this._decrypt(localStorage.getItem('groqApiKey'));
                keyName = 'Groq API Key';
                config = { buildBody: () => openAICompatibleBody, url: 'https://api.groq.com/openai/v1/chat/completions', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, parseResponse: (data) => data.choices[0].message.content, parseError: (errorData) => `Groq API Error: ${errorData.error.message || 'Unknown error'}`};
                break;
            case 'DeepSeek':
                apiKey = this._decrypt(localStorage.getItem('deepseekApiKey'));
                keyName = 'DeepSeek API Key';
                config = { buildBody: () => openAICompatibleBody, url: 'https://api.deepseek.com/v1/chat/completions', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, parseResponse: (data) => data.choices[0].message.content, parseError: (errorData) => `DeepSeek API Error: ${errorData.error.message || 'Unknown error'}`, corsError: 'DeepSeek API call failed due to browser security restrictions (CORS). For a production app, use a backend proxy.' };
                break;
            case 'Ollama (Local)':
                keyName = 'Ollama Service';
                config = {
                     url: 'http://localhost:11434/api/chat',
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     buildBody: () => ({ 
                         model: model, 
                         messages: this.conversationHistory, 
                         stream: false,
                         options: {
                            temperature: temperature
                         }
                    }),
                     parseResponse: (data) => data.message.content,
                     parseError: (errorData) => `Ollama API Error: ${errorData.error || 'Unknown error'}`,
                     corsError: 'Could not connect to Ollama. Ensure it is running and the Chrome API extension is installed.'
                };
                break;
            default:
                throw new Error('Unsupported AI provider selected.');
        }
        if (effectiveProvider !== 'Ollama (Local)' && !apiKey) {
            throw new Error(this._t('apiKeyNotSetError').replace('{keyName}', keyName));
        }
        try {
            const response = await fetch(config.url, {
                method: config.method || 'POST',
                headers: config.headers,
                body: JSON.stringify(config.buildBody(prompt))
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(config.parseError(errorData));
            }
            const data = await response.json();
            return config.parseResponse(data);
        } catch (error){
            if (config.corsError && error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error(config.corsError);
            }
            throw error;
        }
    }

    async _detectBrowserModel() {
        const group = this.browserModelGroup;
        if (!group) return;

        let availability = null;

        try {
            if (window.LanguageModel) {
                // Chrome 138+: availability() returns the string directly
                availability = await window.LanguageModel.availability();
            } else if (window.ai?.languageModel) {
                // Chrome 127–137: capabilities() returns { available: string }
                const caps = await window.ai.languageModel.capabilities();
                availability = caps.available;
            } else if (window.ai?.assistant) {
                // Chrome 122–126 (legacy)
                const caps = await window.ai.assistant.capabilities();
                availability = caps.available;
            }
        } catch (e) {
            console.error('[AIChatWidget] Browser AI detection failed:', e);
        }

        if (!availability || availability === 'no') {
            group.innerHTML = `<option value="browser-builtin" disabled>${this._t('browserAiNotSupported')}</option>`;
        } else if (availability === 'after-download') {
            group.innerHTML = `<option value="browser-builtin">${this._t('browserAiAfterDownload')}</option>`;
        } else {
            // 'readily' or any other non-'no' value
            group.innerHTML = `<option value="browser-builtin">${this._t('browserAiAvailable')}</option>`;
        }
    }
}

// Expose to global scope (class declarations are not auto-added to window)
window.AIChatWidget = AIChatWidget;

