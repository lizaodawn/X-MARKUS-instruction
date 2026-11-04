/**
 * WMTS Layer Selector Widget (WMTS 圖層選擇器元件) — 獨立版
 * ------------------------------------------------------------------
 * 原生 JavaScript，無相依套件，可直接被其他專案以 <script> 引用：
 *
 *   <script src="wmts-layer-selector.js"></script>
 *   <script>
 *     const widget = new WmtsLayerSelector({
 *       containerId: 'my-container',
 *       dataUrl: 'wmts.json',        // 預設來源清單與離線圖層快取
 *       selectionMode: 'multiple',   // 'single' | 'multiple'
 *       language: 'zh-TW',
 *       height: '100%',
 *       onConfirm: (layers) => console.log(layers)
 *       // layers 格式: [{ name, url }, ...]
 *     });
 *   </script>
 *
 * 運作方式：
 *   - 預設讀取 dataUrl(wmts.json) 取得「區域 → 來源」清單與每個來源的離線圖層快取。
 *   - 選取某個來源時，預設直接顯示快取圖層（免連線、速度快）。
 *   - 介面提供「讀取線上版本」按鈕，可即時抓取該來源的線上 WMTS URL 取得最新圖層。
 *
 * @param {Object}   options
 * @param {string}   options.containerId        (必填) 容器 DOM id（不含 #）。
 * @param {string}   [options.dataUrl='wmts.json'] (選填) 資料檔網址。
 * @param {string}   [options.selectionMode='multiple']
 * @param {string}   [options.language='zh-TW']
 * @param {string}   [options.height='100%']
 * @param {function} [options.onConfirm]
 */
// 在腳本載入當下記錄自己所在的目錄，讓預設的 wmts.json 跟著本檔案走
// （而非跟著引用它的 HTML 頁面），方便把整組檔案搬到任意子目錄。
const WMTS_SELECTOR_BASE = (function () {
    try {
        if (document.currentScript && document.currentScript.src) {
            return document.currentScript.src.replace(/[^/]*$/, '');
        }
    } catch (e) { /* ignore */ }
    // 後備：從所有 <script> 中找出含 wmts-layer-selector.js 的那一個
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
        const s = scripts[i].src || '';
        if (/wmts-layer-selector\.js(\?|#|$)/.test(s)) {
            return s.replace(/[^/]*$/, '');
        }
    }
    return '';
})();

class WmtsLayerSelector {
    constructor(options = {}) {
        this.containerId = options.containerId;
        // 未指定 dataUrl 時，預設讀取與本腳本同目錄下的 wmts.json
        this.dataUrl = options.dataUrl || (WMTS_SELECTOR_BASE + 'wmts.json');
        this.selectionMode = options.selectionMode || 'multiple';
        this.height = options.height || '100%';
        this.onConfirm = options.onConfirm || function (data) { console.log('Selected:', data); };

        this.state = {
            layers: [],
            selectedIds: new Set(),
            loading: false,
            serviceTitle: "",
            sortAscending: true
        };

        this.els = {};
        this.data = null;                 // 由 dataUrl 載入的資料 { regions: {...} }
        this.currentRegionSources = [];   // 目前區域底下的來源陣列
        this._activeSourceName = "";      // 目前選取的來源名稱（給 XYZ 虛擬命名用）
        this._noDataKey = 'noData';       // 表格無資料時顯示的訊息 key

        this.translations = {
            "zh-TW": {
                labelRegion: "區域類別", optSelectRegion: "-- 請選擇區域 --",
                regionTW: "臺灣", regionCN: "中國", regionNEA: "東北亞", regionWorld: "世界", regionOther: "其他",
                labelSource: "WMTS 來源", optSelectSource: "-- 請選擇來源 --",
                labelUrl: "WMTS XML 來源網址", labelProxy: "使用代理伺服器 (CORS)",
                btnLoad: "讀取圖層", btnLive: "讀取線上版本", loading: "讀取中...",
                placeholderEmpty: "請從上方選單選擇來源，或使用手動輸入",
                colIndex: "#", colName: "圖層名稱", colUrl: "ResourceURL", colSelect: "選取",
                selectedPrefix: "已選取:", selectedSuffix: "個圖層", btnConfirm: "確認選取",
                alertTitle: "已送出", alertMsg: "已選取 {count} 個圖層。",
                errorTitle: "錯誤", errorParse: "XML 解析失敗", errorHttp: "網路請求錯誤",
                unknownService: "未知來源", noData: "找不到圖層資料",
                clickToCopy: "點擊複製", msgCopied: "已複製到剪貼簿",
                labelManual: "手動加入圖層", phManualName: "輸入圖層名稱 (必填)",
                phManualUrl: "輸入 WMTS XYZ 網址 (包含 {x}, {y}, {z})", btnAdd: "加入",
                errManualNameEmpty: "請輸入圖層名稱", errManualEmpty: "請輸入網址",
                modeSingle: "單選", modeMultiple: "複選",
                badgeCache: "離線快取", badgeLive: "線上即時", loadingData: "資料載入中...",
                noCache: "此來源無離線快取，請點「讀取線上版本」取得圖層",
                cacheHint: "預設顯示離線快取；選取來源後可點「讀取線上版本」取得最新圖層",
                dataError: "資料檔載入失敗"
            },
            "zh-CN": {
                labelRegion: "区域类别", optSelectRegion: "-- 请选择区域 --",
                regionTW: "台湾", regionCN: "中国", regionNEA: "东北亚", regionWorld: "世界", regionOther: "其他",
                labelSource: "WMTS 来源", optSelectSource: "-- 请选择来源 --",
                labelUrl: "WMTS XML 来源网址", labelProxy: "使用代理服务器 (CORS)",
                btnLoad: "读取图层", btnLive: "读取在线版本", loading: "读取中...",
                placeholderEmpty: "请从上方菜单选择来源，或使用手动输入",
                colIndex: "#", colName: "图层名称", colUrl: "资源链接 (ResourceURL)", colSelect: "选取",
                selectedPrefix: "已选取:", selectedSuffix: "个图层", btnConfirm: "确认选取",
                alertTitle: "已提交", alertMsg: "已选取 {count} 个图层。",
                errorTitle: "错误", errorParse: "XML 解析失败", errorHttp: "网络请求错误",
                unknownService: "未知来源", noData: "找不到图层数据",
                clickToCopy: "点击复制", msgCopied: "已复制到剪贴板",
                labelManual: "手动加入图层", phManualName: "输入图层名称 (必填)",
                phManualUrl: "输入 WMTS XYZ 网址 (包含 {x}, {y}, {z})", btnAdd: "加入",
                errManualNameEmpty: "请输入图层名称", errManualEmpty: "请输入网址",
                modeSingle: "单选", modeMultiple: "复选",
                badgeCache: "离线缓存", badgeLive: "在线实时", loadingData: "数据加载中...",
                noCache: "此来源无离线缓存，请点「读取在线版本」获取图层",
                cacheHint: "默认显示离线缓存；选取来源后可点「读取在线版本」获取最新图层",
                dataError: "数据文件加载失败"
            },
            "en": {
                labelRegion: "Region Category", optSelectRegion: "-- Select Region --",
                regionTW: "Taiwan", regionCN: "China", regionNEA: "Northeast Asia", regionWorld: "World", regionOther: "Other",
                labelSource: "WMTS Source", optSelectSource: "-- Select Source --",
                labelUrl: "WMTS XML Source URL", labelProxy: "Use Proxy (CORS)",
                btnLoad: "Load Layers", btnLive: "Load Live Version", loading: "Loading...",
                placeholderEmpty: "Select source or add manually",
                colIndex: "#", colName: "Layer Name", colUrl: "ResourceURL", colSelect: "Select",
                selectedPrefix: "Selected:", selectedSuffix: "layers", btnConfirm: "Confirm Selection",
                alertTitle: "Submitted", alertMsg: "{count} layers selected.",
                errorTitle: "Error", errorParse: "XML Parsing Failed", errorHttp: "HTTP Error",
                unknownService: "Unknown Source", noData: "No layers found",
                clickToCopy: "Click to copy", msgCopied: "Copied to clipboard",
                labelManual: "Add Custom Layer", phManualName: "Layer Name (Required)",
                phManualUrl: "WMTS XYZ URL (w/ {x}, {y}, {z})", btnAdd: "Add",
                errManualNameEmpty: "Layer Name is required", errManualEmpty: "URL is required",
                modeSingle: "Single", modeMultiple: "Multiple",
                badgeCache: "Offline Cache", badgeLive: "Live", loadingData: "Loading data...",
                noCache: "No offline cache for this source. Click \"Load Live Version\".",
                cacheHint: "Shows offline cache by default; click \"Load Live Version\" for the latest layers.",
                dataError: "Failed to load data file"
            },
            "ja": {
                labelRegion: "地域カテゴリー", optSelectRegion: "-- 地域を選択 --",
                regionTW: "台湾", regionCN: "中国", regionNEA: "北東アジア", regionWorld: "世界", regionOther: "その他",
                labelSource: "WMTS ソース", optSelectSource: "-- ソースを選択 --",
                labelUrl: "WMTS XML URL", labelProxy: "プロキシを使用 (CORS)",
                btnLoad: "読み込み", btnLive: "オンライン版を読み込み", loading: "読み込み中...",
                placeholderEmpty: "ソースを選択するか、手動で入力してください",
                colIndex: "#", colName: "レイヤー名", colUrl: "リソースURL", colSelect: "選択",
                selectedPrefix: "選択中:", selectedSuffix: "レイヤー", btnConfirm: "選択を確定",
                errorTitle: "エラー", errorParse: "XMLの解析に失敗しました", errorHttp: "ネットワークエラー",
                unknownService: "不明なソース", noData: "データが見つかりません",
                clickToCopy: "クリックしてコピー", msgCopied: "クリップボードにコピーしました",
                labelManual: "手動でレイヤーを追加", phManualName: "レイヤー名 (必須)",
                phManualUrl: "WMTS XYZ URLを入力 ({x}, {y}, {z} を含む)", btnAdd: "追加",
                errManualNameEmpty: "レイヤー名を入力してください", errManualEmpty: "URLを入力してください",
                modeSingle: "単一選択", modeMultiple: "複数選択",
                badgeCache: "オフラインキャッシュ", badgeLive: "ライブ", loadingData: "データ読み込み中...",
                noCache: "このソースにはキャッシュがありません。「オンライン版を読み込み」を押してください",
                cacheHint: "既定ではキャッシュを表示。ソース選択後「オンライン版を読み込み」で最新を取得",
                dataError: "データファイルの読み込みに失敗しました"
            },
            "ko": {
                labelRegion: "지역 카테고리", optSelectRegion: "-- 지역 선택 --",
                regionTW: "대만", regionCN: "중국", regionNEA: "동북아시아", regionWorld: "세계", regionOther: "기타",
                labelSource: "WMTS 소스", optSelectSource: "-- 소스 선택 --",
                labelUrl: "WMTS XML URL", labelProxy: "프록시 사용 (CORS)",
                btnLoad: "레이어 불러오기", btnLive: "온라인 버전 불러오기", loading: "로딩 중...",
                placeholderEmpty: "소스를 선택하거나 수동으로 입력하세요",
                colIndex: "#", colName: "레이어 이름", colUrl: "리소스 URL", colSelect: "선택",
                selectedPrefix: "선택됨:", selectedSuffix: "레이어", btnConfirm: "선택 확인",
                errorTitle: "오류", errorParse: "XML 파싱 실패", errorHttp: "네트워크 오류",
                unknownService: "알 수 없는 소스", noData: "데이터를 찾을 수 없습니다",
                clickToCopy: "클릭하여 복사", msgCopied: "클립보드에 복사되었습니다",
                labelManual: "수동으로 레이어 추가", phManualName: "레이어 이름 (필수)",
                phManualUrl: "WMTS XYZ URL 입력 ({x}, {y}, {z} 포함)", btnAdd: "추가",
                errManualNameEmpty: "레이어 이름을 입력하세요", errManualEmpty: "URL을 입력하세요",
                modeSingle: "단일 선택", modeMultiple: "다중 선택",
                badgeCache: "오프라인 캐시", badgeLive: "실시간", loadingData: "데이터 로딩 중...",
                noCache: "이 소스에는 캐시가 없습니다. '온라인 버전 불러오기'를 누르세요",
                cacheHint: "기본으로 캐시 표시. 소스 선택 후 '온라인 버전 불러오기'로 최신 취득",
                dataError: "데이터 파일 로드 실패"
            },
            "es": {
                labelRegion: "Categoría de región", optSelectRegion: "-- Seleccionar región --",
                regionTW: "Taiwán", regionCN: "China", regionNEA: "Noreste de Asia", regionWorld: "Mundo", regionOther: "Otro",
                labelSource: "Fuente WMTS", optSelectSource: "-- Seleccionar fuente --",
                labelUrl: "URL XML de WMTS", labelProxy: "Usar proxy (CORS)",
                btnLoad: "Cargar", btnLive: "Cargar versión en línea", loading: "Cargando...",
                placeholderEmpty: "Seleccione una fuente o agregue manualmente",
                colIndex: "#", colName: "Nombre de capa", colUrl: "URL de recurso", colSelect: "Seleccionar",
                selectedPrefix: "Seleccionado:", selectedSuffix: "capas", btnConfirm: "Confirmar",
                errorTitle: "Error", errorParse: "Error al analizar XML", errorHttp: "Error de red",
                unknownService: "Fuente desconocida", noData: "No se encontraron datos",
                clickToCopy: "Haz clic para copiar", msgCopied: "Copiado al portapapeles",
                labelManual: "Agregar capa manualmente", phManualName: "Nombre de capa (Obligatorio)",
                phManualUrl: "URL XYZ de WMTS (con {x}, {y}, {z})", btnAdd: "Agregar",
                errManualNameEmpty: "El nombre de la capa es obligatorio", errManualEmpty: "La URL es requerida",
                modeSingle: "Único", modeMultiple: "Múltiple",
                badgeCache: "Caché sin conexión", badgeLive: "En vivo", loadingData: "Cargando datos...",
                noCache: "Esta fuente no tiene caché. Haga clic en \"Cargar versión en línea\".",
                cacheHint: "Muestra caché por defecto; use \"Cargar versión en línea\" para lo más reciente.",
                dataError: "Error al cargar el archivo de datos"
            }
        };

        this.currentLang = options.language || 'zh-TW';
        this.init();
    }

    // 清理來源名稱：WMTS 的 S 已是 Service(服務)，移除多餘的「服務」二字
    // 例：「臺灣百年歷史地圖WMTS服務」-> 「臺灣百年歷史地圖WMTS」
    cleanSourceName(name) {
        if (!name) return name;
        return name.replace(/WMTS\s*服務/g, 'WMTS').trim();
    }

    // 取字典字串：找不到時退回 zh-TW，再退回 key 本身
    t(key) {
        const cur = this.translations[this.currentLang] || {};
        if (cur[key] != null) return cur[key];
        const fb = this.translations['zh-TW'] || {};
        return (fb[key] != null) ? fb[key] : key;
    }

    async init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.injectStyles();
        this.renderLayout(container);
        this.bindEvents();
        this.setLanguage(this.currentLang);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        await this.loadData();
    }

    // 載入資料檔（區域/來源清單 + 離線圖層快取）
    async loadData() {
        this.els.regionSelect.disabled = true;
        const prevOpt = this.els.regionSelect.options[0];
        if (prevOpt) prevOpt.textContent = this.t('loadingData');
        try {
            const res = await fetch(this.dataUrl);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            this.data = await res.json();
            this.els.regionSelect.disabled = false;
            if (prevOpt) prevOpt.textContent = this.t('optSelectRegion');
        } catch (err) {
            this.els.errorMsg.classList.remove('hidden');
            this.els.errorText.textContent = `${this.t('dataError')}: ${err.message}`;
            if (prevOpt) prevOpt.textContent = this.t('optSelectRegion');
        }
    }

    injectStyles() {
        if (document.getElementById('wmts-widget-style')) return;
        const style = document.createElement('style');
        style.id = 'wmts-widget-style';
        style.textContent = `
            .icon-spin { animation: spin 1s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .toast {
                position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
                background: rgba(30, 41, 59, 0.9); color: white; padding: 8px 16px;
                border-radius: 4px; font-size: 12px; opacity: 0; pointer-events: none;
                z-index: 1000; display: flex; align-items: center; gap: 8px;
                transition: opacity 0.3s;
            }
            .toast.show { opacity: 1; }
        `;
        document.head.appendChild(style);
    }

    setLanguage(lang) {
        if (!lang) return;
        let targetLang = 'zh-TW';
        const lowerLang = lang.toLowerCase();
        if (lowerLang === 'zh-tw') targetLang = 'zh-TW';
        else if (lowerLang === 'zh-cn') targetLang = 'zh-CN';
        else if (lowerLang === 'en' || lowerLang === 'en-us' || lowerLang === 'en-gb') targetLang = 'en';
        else if (lowerLang === 'ja' || lowerLang === 'ja-jp') targetLang = 'ja';
        else if (lowerLang === 'ko' || lowerLang === 'ko-kr') targetLang = 'ko';
        else if (lowerLang === 'es') targetLang = 'es';

        if (!this.translations[targetLang]) targetLang = 'zh-TW';
        this.currentLang = targetLang;

        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName === 'INPUT' && (key === 'phManualName' || key === 'phManualUrl')) {
                el.placeholder = this.t(key);
            } else {
                el.textContent = this.t(key);
            }
        });

        if (this.els.sourceSelect && this.els.sourceSelect.options.length <= 1) {
            this.els.sourceSelect.innerHTML = `<option value="">${this.t('optSelectSource')}</option>`;
        }

        if (this.els.layersTableBody && (this.state.layers.length > 0 || !this.els.dataContainer.classList.contains('hidden'))) {
            this.renderTable();
        }

        const modeBadgeSpan = container.querySelector('[data-i18n="modeSingle"], [data-i18n="modeMultiple"]');
        if (modeBadgeSpan) {
            const key = this.selectionMode === 'single' ? 'modeSingle' : 'modeMultiple';
            modeBadgeSpan.setAttribute('data-i18n', key);
            modeBadgeSpan.textContent = this.t(key);
        }
    }

    renderLayout(container) {
        const modeKey = this.selectionMode === 'single' ? 'modeSingle' : 'modeMultiple';
        const modeClass = this.selectionMode === 'single'
            ? 'bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200'
            : 'bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-200';

        container.innerHTML = `
            <div class="text-slate-700 flex flex-col w-full gap-3" style="height: ${this.height};">
                <div class="toast" id="${this.containerId}-toast">
                    <span class="material-symbols-outlined !text-[16px] text-green-400 align-middle">check_circle</span>
                    <span id="${this.containerId}-toastMsg">Copied!</span>
                </div>

                <div class="bg-white p-4 rounded-md border border-slate-200 flex flex-col gap-3 relative shrink-0">
                    <div class="absolute top-3 right-4">
                        <span class="${modeClass}" data-i18n="${modeKey}">...</span>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 mt-1">
                        <div class="w-full sm:w-1/3">
                            <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="labelRegion">區域類別</label>
                            <select id="${this.containerId}-regionSelect" class="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 disabled:opacity-50">
                                <option value="" data-i18n="optSelectRegion">-- 請選擇區域 --</option>
                                <option value="TW" data-i18n="regionTW">台灣</option>
                                <option value="CN" data-i18n="regionCN">中國</option>
                                <option value="NEA" data-i18n="regionNEA">東北亞</option>
                                <option value="World" data-i18n="regionWorld">世界</option>
                                <option value="Other" data-i18n="regionOther">其他</option>
                            </select>
                        </div>
                        <div class="w-full sm:w-2/3">
                            <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="labelSource">WMTS 來源</label>
                            <select id="${this.containerId}-sourceSelect" class="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 disabled:opacity-50" disabled>
                                <option value="" data-i18n="optSelectSource">-- 請先選擇區域 --</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 items-end">
                        <div class="flex-grow w-full">
                            <div class="flex justify-between items-center mb-1">
                                <label class="block text-xs font-bold text-slate-500" data-i18n="labelUrl">WMTS XML 網址</label>
                                <label class="flex items-center gap-1 cursor-pointer select-none group">
                                    <input type="checkbox" id="${this.containerId}-proxyCheckbox" class="w-3 h-3 text-blue-600 rounded border-slate-300 focus:ring-blue-500">
                                    <span class="text-xs text-slate-500 group-hover:text-blue-600 transition-colors" data-i18n="labelProxy">使用代理 (解決 CORS)</span>
                                </label>
                            </div>
                            <input type="text" id="${this.containerId}-urlInput" class="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" placeholder="https://...">
                        </div>
                        <button id="${this.containerId}-loadBtn" class="h-[34px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap shrink-0">
                            <span class="material-symbols-outlined text-[16px]">cloud_download</span>
                            <span data-i18n="btnLive">讀取線上版本</span>
                        </button>
                    </div>
                    <p class="text-[11px] text-slate-400 -mt-1" data-i18n="cacheHint">預設顯示離線快取；選取來源後可點「讀取線上版本」取得最新圖層</p>

                    <div class="border-t border-slate-100 pt-2 mt-1">
                        <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="labelManual">手動加入圖層</label>
                        <div class="flex flex-col sm:flex-row gap-2">
                            <input type="text" id="${this.containerId}-manualName" class="w-full sm:w-1/3 px-3 py-1.5 text-sm border border-slate-300 rounded" placeholder="圖層名稱 (必填)" data-i18n="phManualName">
                            <input type="text" id="${this.containerId}-manualUrl" class="w-full sm:w-2/3 px-3 py-1.5 text-sm border border-slate-300 rounded" placeholder="WMTS XYZ 網址" data-i18n="phManualUrl">
                            <button id="${this.containerId}-addManualBtn" class="h-[34px] px-4 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap shrink-0">
                                <span class="material-symbols-outlined text-[16px]">add</span>
                                <span data-i18n="btnAdd">加入</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="${this.containerId}-errorMsg" class="hidden shrink-0 bg-red-50 text-red-600 px-4 py-2 rounded text-xs flex items-center gap-2 border border-red-100">
                    <i data-lucide="alert-circle" class="w-4 h-4"></i> <span id="${this.containerId}-errorText"></span>
                </div>

                <div class="bg-white rounded-md border border-slate-200 flex flex-col flex-grow min-h-0">
                    <div id="${this.containerId}-contentArea" class="flex-grow overflow-hidden relative flex flex-col">
                        <div id="${this.containerId}-emptyState" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <i data-lucide="layers" class="w-10 h-10 mb-2 opacity-20"></i>
                            <p class="text-xs" data-i18n="placeholderEmpty">請選擇來源或輸入網址讀取</p>
                        </div>

                        <div id="${this.containerId}-dataContainer" class="hidden h-full flex flex-col">
                            <div class="bg-slate-50 border-b border-slate-200 px-4 py-2 z-10 shrink-0">
                                <h3 class="font-bold text-sm text-slate-800 flex items-center gap-2">
                                    <i data-lucide="database" class="w-4 h-4 text-blue-500"></i>
                                    <span id="${this.containerId}-serviceTitle">載入中...</span>
                                    <span id="${this.containerId}-sourceBadge" class="hidden text-[10px] font-bold px-2 py-0.5 rounded border"></span>
                                </h3>
                            </div>
                            <div class="flex-grow overflow-y-auto min-h-0 bg-white">
                                <table class="w-full text-xs text-left">
                                    <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th class="px-3 py-2 w-12 text-center" data-i18n="colIndex">#</th>
                                            <th id="${this.containerId}-sortNameBtn" class="p-0 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none group align-middle w-[1%]" title="點擊依名稱排序">
                                                <div class="overflow-hidden" style="resize: horizontal; min-width: 120px; width: 250px;">
                                                    <div class="px-3 py-2 flex items-center justify-between w-full h-full">
                                                        <span data-i18n="colName" class="whitespace-nowrap">圖層名稱</span>
                                                        <span id="${this.containerId}-sortIcon" class="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">arrow_downward</span>
                                                    </div>
                                                </div>
                                            </th>
                                            <th class="p-0 border-r border-slate-200 align-middle w-[1%]">
                                                <div class="overflow-hidden" style="resize: horizontal; min-width: 150px; width: 350px;">
                                                    <div class="px-3 py-2 flex items-center w-full h-full">
                                                        <span data-i18n="colUrl" class="whitespace-nowrap">網址 (ResourceURL)</span>
                                                    </div>
                                                </div>
                                            </th>
                                            <th class="px-3 py-2 w-16 text-center whitespace-nowrap" data-i18n="colSelect">選取</th>
                                        </tr>
                                    </thead>
                                    <tbody id="${this.containerId}-layersTableBody" class="divide-y divide-slate-100"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-50 p-3 border-t border-slate-200 flex justify-between items-center shrink-0">
                        <div class="text-xs text-slate-500 flex items-center gap-1">
                            <span data-i18n="selectedPrefix">已選取:</span>
                            <span id="${this.containerId}-selectionCount" class="font-bold text-blue-600 bg-blue-100 px-1.5 rounded">0</span>
                            <span data-i18n="selectedSuffix">個圖層</span>
                        </div>
                        <button id="${this.containerId}-confirmBtn" class="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0" disabled>
                            <span class="material-symbols-outlined text-[16px]">check</span>
                            <span data-i18n="btnConfirm">確認選取</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const ids = [
            'regionSelect', 'sourceSelect', 'urlInput', 'loadBtn', 'proxyCheckbox',
            'errorMsg', 'errorText', 'contentArea', 'emptyState', 'dataContainer',
            'serviceTitle', 'sourceBadge', 'layersTableBody', 'selectionCount', 'confirmBtn',
            'toast', 'toastMsg', 'manualName', 'manualUrl', 'addManualBtn', 'sortNameBtn', 'sortIcon'
        ];
        ids.forEach(id => { this.els[id] = document.getElementById(`${this.containerId}-${id}`); });
    }

    bindEvents() {
        // 選擇區域 -> 由資料檔填入該區域的來源
        this.els.regionSelect.addEventListener('change', (e) => {
            const region = e.target.value;
            this.els.sourceSelect.innerHTML = `<option value="">${this.t('optSelectSource')}</option>`;
            const list = (this.data && this.data.regions && this.data.regions[region]) || [];
            if (list.length) {
                this.els.sourceSelect.disabled = false;
                this.currentRegionSources = list;
                list.forEach((src, i) => {
                    const opt = document.createElement('option');
                    opt.value = String(i);
                    // 無快取的來源加上提示符號
                    const label = this.cleanSourceName(src.name);
                    opt.textContent = src.available === false ? `⚠ ${label}` : label;
                    this.els.sourceSelect.appendChild(opt);
                });
            } else {
                this.els.sourceSelect.disabled = true;
                this.currentRegionSources = [];
            }
            this.els.urlInput.value = "";
        });

        // 選擇來源 -> 預設顯示離線快取
        this.els.sourceSelect.addEventListener('change', (e) => {
            if (e.target.value === "") return;
            const src = this.currentRegionSources[Number(e.target.value)];
            if (!src) return;
            this._activeSourceName = src.name;
            this.els.urlInput.value = src.url;
            this.loadFromCache(src);
        });

        // 讀取線上版本（即時抓取 urlInput 的 WMTS URL）
        this.els.loadBtn.addEventListener('click', () => this.loadLayers());
        this.els.urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.loadLayers(); });
        this.els.addManualBtn.addEventListener('click', () => this.addManualLayer());

        this.els.sortNameBtn.addEventListener('click', () => {
            if (this.state.layers.length === 0) return;
            this.state.sortAscending = !this.state.sortAscending;
            this.els.sortIcon.textContent = this.state.sortAscending ? 'arrow_downward' : 'arrow_upward';
            this.sortLayers();
            this.renderTable();
        });

        this.els.confirmBtn.addEventListener('click', () => {
            const data = this.state.layers
                .filter(l => this.state.selectedIds.has(l.id))
                .map(l => ({ name: l.name, url: l.url }));
            this.onConfirm(data);
        });
    }

    // 顯示來源狀態徽章（離線快取 / 線上即時）
    setSourceBadge(mode) {
        const el = this.els.sourceBadge;
        if (!el) return;
        el.classList.remove('hidden');
        if (mode === 'live') {
            el.textContent = this.t('badgeLive');
            el.className = 'text-[10px] font-bold px-2 py-0.5 rounded border bg-green-100 text-green-700 border-green-200';
        } else {
            el.textContent = this.t('badgeCache');
            el.className = 'text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-100 text-amber-700 border-amber-200';
        }
    }

    // 以離線快取資料顯示圖層（不連線）
    loadFromCache(src) {
        this.els.errorMsg.classList.add('hidden');
        this.state.layers = (src.layers || []).map((l, i) => ({ id: i + 1, name: l.name, url: l.url, year: l.year }));
        this.state.selectedIds.clear();
        this.updateStatus();

        this.els.serviceTitle.textContent = this.cleanSourceName(src.name);
        if (this.state.layers.length === 0) {
            this.els.sourceBadge.classList.add('hidden');   // 無快取時不顯示徽章
            this._noDataKey = 'noCache';
        } else {
            this.setSourceBadge('cache');
            this._noDataKey = 'noData';
        }

        // 快取已是依年份排序，預設不重排
        this.state.sortAscending = true;
        if (this.els.sortIcon) this.els.sortIcon.textContent = 'arrow_downward';

        this.els.emptyState.classList.add('hidden');
        this.els.dataContainer.classList.remove('hidden');
        this.renderTable();
    }

    addManualLayer() {
        const name = this.els.manualName.value.trim();
        let url = this.els.manualUrl.value.trim();

        if (!name) { this.showToast(this.t('errManualNameEmpty')); return; }
        if (!url) { this.showToast(this.t('errManualEmpty')); return; }

        url = url.replace(/\{TileMatrix\}/gi, '{z}')
                 .replace(/\{TileCol\}/gi, '{x}')
                 .replace(/\{TileRow\}/gi, '{y}');

        if (this.els.dataContainer.classList.contains('hidden')) {
            this.els.emptyState.classList.add('hidden');
            this.els.dataContainer.classList.remove('hidden');
            this.els.serviceTitle.textContent = "Custom Layers";
            this.els.sourceBadge.classList.add('hidden');
        }

        const newLayer = { id: 'manual_' + Date.now(), name: name, url: url };
        this.state.layers.push(newLayer);

        if (this.selectionMode === 'single') this.state.selectedIds.clear();
        this.state.selectedIds.add(newLayer.id);

        this.sortLayers();
        this.renderTable();
        this.updateStatus();
        this.els.manualName.value = '';
        this.els.manualUrl.value = '';
    }

    sortLayers() {
        this.state.layers.sort((a, b) => {
            const nameA = (a.name || "").toLowerCase();
            const nameB = (b.name || "").toLowerCase();
            if (nameA < nameB) return this.state.sortAscending ? -1 : 1;
            if (nameA > nameB) return this.state.sortAscending ? 1 : -1;
            return 0;
        });
    }

    generateVirtualXml(layerName, xyzUrl) {
        const sanitizedUrl = xyzUrl.replace(/\{s\}/gi, 'a');
        return `<?xml version="1.0" encoding="UTF-8"?>
        <Capabilities xmlns="http://www.opengis.net/wmts/1.0" version="1.0.0">
            <ServiceIdentification><Title>${layerName}</Title></ServiceIdentification>
            <Contents><Layer>
                <ows:Title xmlns:ows="http://www.opengis.net/ows/1.1">${layerName}</ows:Title>
                <ResourceURL format="image/png" resourceType="tile" template="${sanitizedUrl}"/>
            </Layer></Contents>
        </Capabilities>`;
    }

    // 讀取線上版本：即時抓取並解析 WMTS URL
    async loadLayers() {
        const url = this.els.urlInput.value.trim();
        if (!url) return;

        this.state.loading = true;
        this.els.loadBtn.disabled = true;
        this.els.loadBtn.innerHTML = `
            <span class="material-symbols-outlined text-[16px] icon-spin">autorenew</span>
            <span data-i18n="loading">${this.t('loading')}</span>
        `;

        this.els.errorMsg.classList.add('hidden');
        this.state.layers = [];
        this.state.selectedIds.clear();
        this.updateStatus();
        this.els.dataContainer.classList.add('hidden');
        this.els.emptyState.classList.remove('hidden');
        this._noDataKey = 'noData';

        try {
            const isXyz = /\{z\}/i.test(url) && /\{x\}/i.test(url) && /\{y\}/i.test(url);
            let xmlText = "";

            if (isXyz) {
                const layerName = this._activeSourceName || "XYZ 網路底圖";
                xmlText = this.generateVirtualXml(layerName, url);
            } else {
                let fetchUrl = url;
                if (this.els.proxyCheckbox.checked) {
                    fetchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                }
                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`${this.t('errorHttp')}: ${response.status}`);
                xmlText = await response.text();
            }

            const parsedData = this.parseWmtsXml(xmlText);
            this.state.layers = parsedData.layers;
            this.els.serviceTitle.textContent = this.cleanSourceName(parsedData.title);
            this.setSourceBadge('live');

            this.state.sortAscending = true;
            if (this.els.sortIcon) this.els.sortIcon.textContent = 'arrow_downward';
            this.sortLayers();

            this.els.emptyState.classList.add('hidden');
            this.els.dataContainer.classList.remove('hidden');
            this.renderTable();

        } catch (err) {
            this.els.errorMsg.classList.remove('hidden');
            this.els.errorText.textContent = err.message || this.t('errorParse');
        } finally {
            this.state.loading = false;
            this.els.loadBtn.disabled = false;
            this.els.loadBtn.innerHTML = `
                <span class="material-symbols-outlined text-[16px]">cloud_download</span>
                <span data-i18n="btnLive">${this.t('btnLive')}</span>
            `;
        }
    }

    renderTable() {
        this.els.layersTableBody.innerHTML = '';
        if (this.state.layers.length === 0) {
            this.els.layersTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">${this.t(this._noDataKey || 'noData')}</td></tr>`;
            return;
        }

        const inputType = this.selectionMode === 'single' ? 'radio' : 'checkbox';
        const inputName = `${this.containerId}-layer-selection`;

        this.state.layers.forEach(layer => {
            const isSelected = this.state.selectedIds.has(layer.id);
            const tr = document.createElement('tr');
            tr.className = `group/row hover:bg-blue-50 transition-colors border-b border-slate-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`;

            const tdIndex = document.createElement('td');
            tdIndex.className = "px-3 py-2 text-center text-slate-400 font-mono text-[10px]";
            tdIndex.textContent = String(layer.id).startsWith('manual_') ? 'M' : layer.id;

            const tdName = document.createElement('td');
            tdName.className = "px-3 py-2 font-medium text-slate-700 cursor-pointer hover:text-blue-600 transition-colors relative group/name border-r border-slate-100 max-w-0";
            tdName.title = this.t('clickToCopy');
            tdName.innerHTML = `
                <div class="flex items-center gap-1 w-full">
                    <span class="truncate block w-full">${layer.name}</span>
                    <i data-lucide="copy" class="w-3 h-3 shrink-0 opacity-0 group-hover/name:opacity-50 text-blue-500"></i>
                </div>
            `;
            tdName.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.copyToClipboard(layer.name);
            });

            const tdUrl = document.createElement('td');
            tdUrl.className = "px-3 py-2 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors group/url border-r border-slate-100 max-w-0";
            tdUrl.title = this.t('clickToCopy');
            tdUrl.innerHTML = `
                <div class="flex items-center gap-1 w-full">
                    <span class="truncate block w-full text-[10px]">${layer.url}</span>
                </div>
            `;
            tdUrl.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.copyToClipboard(layer.url);
            });

            const tdCheck = document.createElement('td');
            tdCheck.className = "px-3 py-2 text-center";

            const inputEl = document.createElement('input');
            inputEl.type = inputType;
            inputEl.name = inputName;
            inputEl.className = inputType === 'radio'
                ? "w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer align-middle"
                : "w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer align-middle";
            inputEl.checked = isSelected;
            inputEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayer(layer.id);
            });

            tdCheck.appendChild(inputEl);
            tr.append(tdIndex, tdName, tdUrl, tdCheck);
            tr.addEventListener('click', () => this.toggleLayer(layer.id));
            this.els.layersTableBody.appendChild(tr);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    toggleLayer(id) {
        if (this.selectionMode === 'single') {
            if (!this.state.selectedIds.has(id)) {
                this.state.selectedIds.clear();
                this.state.selectedIds.add(id);
            } else {
                this.state.selectedIds.delete(id);
            }
        } else {
            if (this.state.selectedIds.has(id)) {
                this.state.selectedIds.delete(id);
            } else {
                this.state.selectedIds.add(id);
            }
        }
        this.renderTable();
        this.updateStatus();
    }

    updateStatus() {
        const count = this.state.selectedIds.size;
        this.els.selectionCount.textContent = count;
        this.els.confirmBtn.disabled = count === 0;
    }

    async copyToClipboard(text) {
        if (!text) return;

        const fallbackCopy = (textToCopy) => {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                textArea.style.position = "fixed";
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.width = "2em";
                textArea.style.height = "2em";
                textArea.style.padding = "0";
                textArea.style.border = "none";
                textArea.style.outline = "none";
                textArea.style.boxShadow = "none";
                textArea.style.background = "transparent";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) this.showToast(this.t('msgCopied'));
                else console.error('Fallback copy command failed.');
            } catch (fallbackErr) {
                console.error('Copy failed completely', fallbackErr);
            }
        };

        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                this.showToast(this.t('msgCopied'));
            } catch (err) {
                console.warn("navigator.clipboard failed, using fallback.", err);
                fallbackCopy(text);
            }
        } else {
            fallbackCopy(text);
        }
    }

    showToast(msg) {
        this.els.toastMsg.textContent = msg;
        this.els.toast.classList.add('show');
        setTimeout(() => this.els.toast.classList.remove('show'), 2000);
    }

    // 圖層名稱正規化：提取西元年份至最前方（含年代 1980s、完整日期、民國年）
    normalizeLayerName(name) {
        if (!name) return name;
        let yearStr = "";
        let newName = name.trim();

        const fullDateMatch = newName.match(/\b((?:18|19|20)\d{2})[./-](\d{2})[./-](\d{2})\b/);
        if (fullDateMatch) {
            yearStr = `${fullDateMatch[1]}${fullDateMatch[2]}${fullDateMatch[3]}`;
            return `${yearStr} ${newName}`;
        }

        const compactDateMatch = newName.match(/\b((?:18|19|20)\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b/);
        if (compactDateMatch) {
            yearStr = compactDateMatch[0];
            return `${yearStr} ${newName}`;
        }

        const rangeMatch = newName.match(/\(((?:18|19|20)\d{2})[~-]((?:18|19|20)\d{2})\)/);
        if (rangeMatch) {
            return `${rangeMatch[1]} ${newName}`;
        }

        const prefixMatch = newName.match(/^((?:18|19|20)\d{2})[-_ ]*(.*)/);
        if (prefixMatch) {
            yearStr = prefixMatch[1];
            newName = prefixMatch[2].trim();
            return `${yearStr} ${newName}`;
        }

        const suffixMatch = newName.match(/\(((?:18|19|20)\d{2})\)$/);
        if (suffixMatch) {
            yearStr = suffixMatch[1];
            newName = newName.replace(/\(((?:18|19|20)\d{2})\)$/, '').trim();
            return `${yearStr} ${newName}`;
        }

        const yearWordMatch = newName.match(/((?:18|19|20)\d{2})年/);
        if (yearWordMatch) {
            yearStr = yearWordMatch[1];
            newName = newName.replace(/((?:18|19|20)\d{2})年/, '年').trim();
            return `${yearStr} ${newName}`;
        }

        const yearMatch = newName.match(/((?:18|19|20)\d{2})(s?)/i);
        if (yearMatch) {
            let yearNum = parseInt(yearMatch[1], 10);
            if (yearMatch[2].toLowerCase() === 's') yearNum += 1;
            return `${yearNum} ${newName}`;
        }

        const rocMatch = newName.match(/(\d{2,3})年/);
        if (rocMatch) {
            const rocYear = parseInt(rocMatch[1], 10);
            yearStr = String(rocYear + 1911);
            return `${yearStr} ${newName}`;
        }

        return newName;
    }

    parseWmtsXml(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        if (xmlDoc.querySelector("parsererror")) throw new Error("XML Parsing Error");

        const getTagContent = (p, t) => {
            const tags = p.getElementsByTagName(t);
            if (tags.length > 0) return tags[0].textContent;
            const all = p.getElementsByTagName("*");
            for (let i = 0; i < all.length; i++) {
                if (all[i].localName === t) return all[i].textContent;
            }
            return null;
        };

        let title = getTagContent(xmlDoc, "Title") || this.t('unknownService');
        const layers = [];
        const layerNodes = xmlDoc.getElementsByTagName("Layer");
        const nameCounts = {};

        for (let i = 0; i < layerNodes.length; i++) {
            const ln = layerNodes[i];
            let lTitle = getTagContent(ln, "Title") || `Layer ${i + 1}`;
            lTitle = this.normalizeLayerName(lTitle);

            if (nameCounts[lTitle] !== undefined) {
                const count = nameCounts[lTitle];
                nameCounts[lTitle]++;
                lTitle = `${lTitle} ${count}`;
            } else {
                nameCounts[lTitle] = 1;
            }

            const resUrls = ln.getElementsByTagName("ResourceURL");
            if (resUrls.length > 0) {
                let tmpl = resUrls[0].getAttribute("template");
                if (tmpl) {
                    tmpl = tmpl.replace(/\{Style\}/gi, 'default')
                               .replace(/\{TileMatrixSet\}/gi, 'GoogleMapsCompatible')
                               .replace(/\{TileMatrix\}/gi, '{z}')
                               .replace(/\{TileCol\}/gi, '{x}')
                               .replace(/\{TileRow\}/gi, '{y}');
                    layers.push({ id: i + 1, name: lTitle, url: tmpl });
                }
            }
        }
        return { title, layers };
    }
}

// 對外輸出：支援 <script> 全域、CommonJS、AMD
if (typeof window !== 'undefined') window.WmtsLayerSelector = WmtsLayerSelector;
if (typeof module !== 'undefined' && module.exports) module.exports = WmtsLayerSelector;
