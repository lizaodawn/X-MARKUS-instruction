/**
 * ============================================================================
 * IIIF Annotation Widget (IIIF 圖片標注渲染套件)
 * ============================================================================
 * * 【功能簡介】
 * 本套件用於讀取特定格式的 XML 資料 (包含 IIIF 影像網址與 ImmarkusShape 多邊形標注)，
 * 並將其自動轉換、縮放，渲染為帶有互動功能 (Hover 高亮、點擊顯示詳細資訊) 的 Web 元件。
 * * 【建構子參數說明】
 * @param {string|HTMLElement} containerId     - (必填) 準備用來掛載 Widget 的容器 ID 或 DOM 元素。
 * @param {string}             xmlString       - (必填) 包含影像與標注資料的 XML 字串。
 * @param {number|string}      customWidth     - (選填) 指定請求的影像寬度 (px)。若留白或無效，則自動使用容器目前的寬度。
 * @param {function}           onPropertyClick - (選填) 當使用者點選「可點擊屬性」時，會觸發此回呼函數 (Callback)。
 * @param {Array<string>}      clickableKeys   - (選填) 定義哪些 XML 屬性 (Key) 在畫面上要變成可點擊的超連結，例如 ["TGAZ", "PL"]。
 * @param {string}             lang            - (選填) 介面語系，支援 'zh-TW', 'zh-CN', 'en', 'ja', 'ko'。預設為 'zh-TW'。
 * * 【使用範例：建立實例】
 * const myWidget = new IiifAnnotationWidget(
 * "widget-root", 
 * xmlData, 
 * 800, 
 * handlePropertyClick, 
 * ["TGAZ", "PL"], 
 * "zh-TW"
 * );
 * * 【使用範例：動態更新】
 * 若要更換圖片或切換語言，不需要重新 new 物件，直接呼叫：
 * myWidget.updateConfig({
 * xmlString: newXmlData,
 * lang: 'en'
 * });
 * * 【自訂回呼函數 (Callback) 說明】
 * 傳入的 onPropertyClick 函數可以接收 4 個參數：(element, key, value, attrData)。
 * 且函數內部的 `this` 會自動綁定到被點擊的 HTML 元素上。
 * * 如果 XML 中的節點帶有屬性，例如：<Udef_properties_TGAZ lat="33" lng="110">hvd_40228</Udef...
 * 您可以使用以下方式取得資料：
 * * const handlePropertyClick = function(element, key, value, attrData) {
 * const lat = attrData['lat']; // 最推薦：從打包好的純 JS 物件讀取，絕對不會有 Log 出現 {} 的問題
 * // 或 const lat = element.getAttribute('lat');
 * console.log(`按下了 ${key}，數值為 ${value}，緯度: ${lat}`);
 * };
 * * ============================================================================
 */
    /**
     * ============================================================================
     * IIIF Annotation Viewer Widget Class
     * ============================================================================
     */
    class IiifAnnotationWidget {
        static I18N = {
            'zh-TW': {
                loading: '解析資料與讀取圖片中...',
                xmlError: 'XML 格式不正確。解析器回報：\n',
                noImageNode: '找不到 <ImmarkusImage> 節點',
                unnamed: '未命名標注',
                showAll: '-- 顯示所有標注 --',
                error: '錯誤: ',
                noProps: '無其他詳細屬性',
                metadataTitle: '圖片與文獻詳細資料 (Metadata)'
            },
            'zh-CN': {
                loading: '解析数据与读取图片中...',
                xmlError: 'XML 格式不正确。解析器回报：\n',
                noImageNode: '找不到 <ImmarkusImage> 节点',
                unnamed: '未命名标注',
                showAll: '-- 显示所有标注 --',
                error: '错误: ',
                noProps: '无其他详细属性',
                metadataTitle: '图片与文献详细资料 (Metadata)'
            },
            'en': {
                loading: 'Parsing data and loading image...',
                xmlError: 'Invalid XML format. Parser reported:\n',
                noImageNode: 'Cannot find <ImmarkusImage> node',
                unnamed: 'Unnamed Annotation',
                showAll: '-- Show all annotations --',
                error: 'Error: ',
                noProps: 'No other detailed properties',
                metadataTitle: 'Document & Image Metadata'
            },
            'ja': {
                loading: 'データを解析し、画像を読み込んでいます...',
                xmlError: '無効なXML形式です。パーサーの報告：\n',
                noImageNode: '<ImmarkusImage> ノードが見つかりません',
                unnamed: '無名のアノテーション',
                showAll: '-- すべてのアノテーションを表示 --',
                error: 'エラー: ',
                noProps: 'その他の詳細プロパティはありません',
                metadataTitle: '画像・文献メタデータ (Metadata)'
            },
            'ko': {
                loading: '데이터 구문 분석 및 이미지 로드 중...',
                xmlError: '잘못된 XML 형식. 파서 보고:\n',
                noImageNode: '<ImmarkusImage> 노드를 찾을 수 없습니다',
                unnamed: '이름 없는 주석',
                showAll: '-- 모든 주석 표시 --',
                error: '오류: ',
                noProps: '다른 세부 속성 없음',
                metadataTitle: '이미지 및 문헌 메타데이터 (Metadata)'
            }
        };

        injectStyles() {
            const styleId = 'iiif-widget-core-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    .iiif-widget-svg-layer {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none;
                    }
                    .iiif-widget-svg-layer > g {
                        pointer-events: all;
                        cursor: pointer;
                        transition: all 0.2s ease-in-out;
                    }
                    .iiif-widget-svg-layer > g:hover {
                        stroke: #ffffff;
                        stroke-width: 8 !important;
                        opacity: 0.85 !important;
                    }
                `;
                document.head.appendChild(style);
            }
        }

        constructor(containerId, xmlString, customWidth, onPropertyClick, clickableKeys = [], lang = 'zh-TW') {
            this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
            this.xmlString = xmlString;
            this.customWidth = customWidth; 
            this.onPropertyClick = onPropertyClick; 
            this.clickableKeys = clickableKeys;
            this.lang = lang;
            
            this.injectStyles();
            this.t = IiifAnnotationWidget.I18N[this.lang] || IiifAnnotationWidget.I18N['zh-TW'];
            
            this.annotations = [];
            this.globalMeta = {};
            this.svgOverlay = null;
            this.selectBox = null;
            this.infoPanel = null;
            
            this.init();
        }

        updateConfig(options = {}) {
            if (options.xmlString !== undefined) this.xmlString = options.xmlString;
            if (options.customWidth !== undefined) this.customWidth = options.customWidth;
            if (options.lang !== undefined) {
                this.lang = options.lang;
                this.t = IiifAnnotationWidget.I18N[this.lang] || IiifAnnotationWidget.I18N['zh-TW'];
            }
            this.init();
        }

        async init() {
            this.annotations = [];
            this.globalMeta = {};

            this.container.innerHTML = `<div class="text-center p-8 text-blue-600 font-medium">${this.t.loading}</div>`;

            try {
                const parser = new DOMParser();
                let cleanXmlString = this.xmlString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
                cleanXmlString = cleanXmlString.replace(/^<\?xml[^>]*\?>\s*/i, "");

                const wrappedXmlString = `<IIIF_Root>${cleanXmlString}</IIIF_Root>`;
                const xmlDoc = parser.parseFromString(wrappedXmlString, "text/xml");

                const errorNode = xmlDoc.querySelector("parsererror");
                if (errorNode) {
                    const errorMsg = errorNode.textContent || "Unknown Error";
                    throw new Error(`${this.t.xmlError}${errorMsg}`);
                }

                // 1. 提取 document 與 xml_metadata 表格資料
                const docNode = xmlDoc.querySelector("document");
                if (docNode) {
                    ['title', 'docclass', 'author', 'year_for_grouping', 'geo_level1', 'compilation_name'].forEach(tag => {
                        const node = docNode.querySelector(tag);
                        if (node && node.textContent.trim() && node.textContent.trim() !== '-') {
                            const label = tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            this.globalMeta[label] = node.textContent.trim();
                        }
                    });
                }

                const xmlMetaNode = xmlDoc.querySelector("xml_metadata");
                if (xmlMetaNode) {
                    Array.from(xmlMetaNode.children).forEach(child => {
                        const key = child.tagName.replace(/^Udef_DocMeta_(img_)?/, '');
                        const val = child.textContent.trim();
                        // 隱藏值為 "-" 或空白的欄位
                        if (val && val !== '-') {
                            this.globalMeta[key] = val;
                        }
                    });
                }

                // 2. 擷取 Image 網址與長寬
                let hasValidImage = false;
                let isIiifImage = false;
                let baseUrl = "";
                let directImageUrl = "";
                let origWidth = 0;
                let origHeight = 0;
                
                const imgNode = xmlDoc.querySelector("ImmarkusImage");
                
                if (imgNode) {
                    const urlAttr = imgNode.getAttribute("Url") || "";
                    const textContent = imgNode.textContent.trim();
                    
                    const attrW = parseInt(imgNode.getAttribute("Width") || imgNode.getAttribute("width"), 10);
                    const attrH = parseInt(imgNode.getAttribute("Height") || imgNode.getAttribute("height"), 10);
                    if (!isNaN(attrW) && attrW > 0) origWidth = attrW;
                    if (!isNaN(attrH) && attrH > 0) origHeight = attrH;

                    const fullIndex = urlAttr.indexOf('/full/');
                    
                    const isValidImageStr = (str) => {
                        if (!str || str.startsWith('blob:')) return false;
                        return str.startsWith('http') || str.startsWith('../') || str.startsWith('./') || /\.(png|jpe?g|gif|webp|svg)$/i.test(str);
                    };

                    if (fullIndex !== -1) {
                        baseUrl = urlAttr.substring(0, fullIndex);
                        directImageUrl = urlAttr;
                        hasValidImage = true;
                        isIiifImage = true;
                    } else if (isValidImageStr(urlAttr)) {
                        hasValidImage = true;
                        isIiifImage = false;
                        directImageUrl = urlAttr;
                    } else if (isValidImageStr(textContent)) {
                        hasValidImage = true;
                        isIiifImage = false;
                        directImageUrl = textContent;
                    }
                }

                // 3. 取得圖片尺寸
                if (hasValidImage && (origWidth === 0 || origHeight === 0)) {
                    if (isIiifImage) {
                        try {
                            const infoRes = await fetch(`${baseUrl}/info.json`);
                            if (infoRes.ok) {
                                const info = await infoRes.json();
                                origWidth = info.width;
                                origHeight = info.height;
                            }
                        } catch(e) {
                            console.warn("無法取得 info.json，改由圖檔或 SVG 座標推算原圖尺寸。");
                        }
                    }
                    
                    if (origWidth === 0 || origHeight === 0) {
                        try {
                            await new Promise((resolve) => {
                                const tmpImg = new Image();
                                tmpImg.onload = () => {
                                    origWidth = tmpImg.naturalWidth;
                                    origHeight = tmpImg.naturalHeight;
                                    resolve();
                                };
                                tmpImg.onerror = () => resolve();
                                tmpImg.src = directImageUrl;
                            });
                        } catch(e) {}
                    }
                }

                // 4. 解析所有標注與無 Shape 的 Metadata 段落
                const paragraphs = xmlDoc.querySelectorAll("Paragraph");
                let validShapeCount = 0;

                paragraphs.forEach((p, index) => {
                    const shapeNode = p.querySelector("ImmarkusShape");
                    const bodyNodes = Array.from(p.querySelectorAll("ImmarkusBody"));

                    // 全域 Metadata 段落 (無 Shape)
                    if (!shapeNode) {
                        bodyNodes.forEach(body => {
                            Array.from(body.children).forEach(child => {
                                if (child.tagName.startsWith('Udef_Genre_')) {
                                    const key = child.tagName.replace('Udef_Genre_', '');
                                    const val = child.textContent.trim();
                                    if (val && val !== '-') this.globalMeta[key] = val;
                                }
                            });

                            const propsDivs = body.querySelectorAll("ImmarkusProperties div");
                            propsDivs.forEach(div => {
                                const propTag = div.querySelector("[class^='Udef_'], [id^='Udef_'], *");
                                if (propTag) {
                                    const tagName = propTag.tagName;
                                    const key = tagName.startsWith('Udef_properties_') ? tagName : tagName.replace(/^Udef_properties_/i, '');
                                    const val = propTag.textContent.trim();
                                    if (val && val !== '-') this.globalMeta[key] = val;
                                }
                            });
                        });
                        return;
                    }
                    
                    let properties = {};
                    let targetName = `${this.t.unnamed} ${index + 1}`;

                    for (let body of bodyNodes) {
                        const propsDivs = body.querySelectorAll("ImmarkusProperties div");
                        propsDivs.forEach(div => {
                            const propTag = div.querySelector("[class^='Udef_'], [id^='Udef_'], *");
                            if (propTag) {
                                const tagName = propTag.tagName;
                                const key = tagName.startsWith('Udef_properties_') ? tagName : tagName.replace(/^Udef_properties_/i, '');
                                const val = propTag.textContent.trim();
                                if (val && val !== '-') {
                                    let attrs = {};
                                    for (let i = 0; i < propTag.attributes.length; i++) {
                                        const attr = propTag.attributes[i];
                                        attrs[attr.name] = attr.value;
                                    }
                                    properties[key] = { value: val, attributes: attrs };
                                    if (key === 'name' || key === 'Udef_properties_name') targetName = val;
                                }
                            }
                        });

                        const noteNode = body.querySelector("Udef_Img_Note");
                        if (noteNode && noteNode.textContent.trim() && noteNode.textContent.trim() !== '-') {
                            let attrs = {};
                            for (let i = 0; i < noteNode.attributes.length; i++) {
                                const attr = noteNode.attributes[i];
                                attrs[attr.name] = attr.value;
                            }
                            properties['Note'] = { value: noteNode.textContent.trim(), attributes: attrs };
                        }

                        const entityClassNode = body.querySelector("Udef_Img_EntityClass");
                        if (entityClassNode && entityClassNode.textContent.trim() && entityClassNode.textContent.trim() !== '-') {
                            let attrs = {};
                            for (let i = 0; i < entityClassNode.attributes.length; i++) {
                                const attr = entityClassNode.attributes[i];
                                attrs[attr.name] = attr.value;
                            }
                            properties['EntityClass'] = { value: entityClassNode.textContent.trim(), attributes: attrs };
                        }
                    }

                    const svgStr = shapeNode.getAttribute("SelectorValue");
                    
                    let approxArea = 0;
                    const rectMatch = svgStr.match(/<rect[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/i);
                    if (rectMatch) {
                        approxArea = parseFloat(rectMatch[1]) * parseFloat(rectMatch[2]);
                    } else {
                        const numbers = svgStr.match(/\d+(\.\d+)?/g);
                        if (numbers && numbers.length >= 4) {
                            let xs = [], ys = [];
                            for (let i = 0; i < numbers.length; i += 2) {
                                xs.push(parseFloat(numbers[i]));
                                if (i + 1 < numbers.length) ys.push(parseFloat(numbers[i+1]));
                            }
                            approxArea = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
                        }
                    }
                    
                    const hue = Math.floor(validShapeCount * 137.5) % 360;
                    const distinctColor = `hsla(${hue}, 80%, 55%, 0.4)`;
                    validShapeCount++;
                    
                    this.annotations.push({
                        id: p.getAttribute("ImmarkusId") || `anno-${index}`,
                        name: targetName,
                        svgStr: svgStr,
                        color: distinctColor,
                        properties: properties,
                        area: approxArea
                    });

                    if (origWidth === 0 || origHeight === 0) {
                        const numbers = svgStr.match(/\d+(\.\d+)?/g);
                        if (numbers) {
                            const maxVal = Math.max(...numbers.map(Number));
                            origWidth = Math.max(origWidth, maxVal + 100);
                            origHeight = Math.max(origHeight, maxVal + 100);
                        }
                    }
                });

                this.annotations.sort((a, b) => b.area - a.area);

                if (origWidth === 0) { origWidth = 3500; origHeight = 3500; }

                this.render(baseUrl, directImageUrl, isIiifImage, origWidth, origHeight, hasValidImage);

            } catch (error) {
                this.container.innerHTML = `<div class="p-4 bg-red-100 text-red-700 border border-red-300 rounded whitespace-pre-wrap break-all text-sm">${this.t.error}${error.message}</div>`;
                console.error(error);
            }
        }

        render(baseUrl, directImageUrl, isIiifImage, origWidth, origHeight, hasValidImage) {
            this.container.innerHTML = '';

            let renderWidth = parseInt(this.customWidth, 10);
            if (isNaN(renderWidth) || renderWidth <= 0) {
                const scrollArea = document.getElementById('preview-scroll-area') || this.container.parentElement;
                renderWidth = (scrollArea.clientWidth - 48) || 1000;
            }

            const widgetWrapper = document.createElement("div");
            widgetWrapper.className = "flex flex-col mx-auto";
            widgetWrapper.style.width = `${renderWidth}px`;

            const widgetHeader = document.createElement("div");
            widgetHeader.className = "flex justify-end mb-3 w-full";

            this.selectBox = document.createElement("select");
            this.selectBox.className = "px-3 py-2 border border-gray-300 rounded shadow-sm bg-white text-sm font-medium outline-none cursor-pointer max-w-[300px] overflow-hidden text-ellipsis";
            this.selectBox.innerHTML = `<option value="all">${this.t.showAll}</option>`;

            const imageContainer = document.createElement("div");
            imageContainer.className = "relative w-full bg-gray-100 shadow-md rounded-lg overflow-hidden border border-gray-300 min-h-[200px]";

            this.svgOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.svgOverlay.setAttribute("viewBox", `0 0 ${origWidth} ${origHeight}`);

            if (hasValidImage) {
                let scaledImageUrl = isIiifImage ? `${baseUrl}/full/${Math.min(renderWidth, 2500)},/0/default.jpg` : directImageUrl;

                const img = document.createElement("img");
                img.src = scaledImageUrl;
                img.className = "block w-full h-auto";
                
                img.onerror = () => {
                    if (img.src !== directImageUrl && directImageUrl) {
                        img.src = directImageUrl;
                    }
                };
                imageContainer.appendChild(img);

                this.svgOverlay.setAttribute("class", "iiif-widget-svg-layer");
            } else {
                const iconWrapper = document.createElement("div");
                iconWrapper.className = "absolute inset-0 flex items-center justify-center z-0 pointer-events-none";
                iconWrapper.innerHTML = `<span class="material-symbols-outlined text-gray-400" style="font-size: 48px;">broken_image</span>`;
                imageContainer.appendChild(iconWrapper);

                this.svgOverlay.setAttribute("class", "iiif-widget-svg-layer");
                this.svgOverlay.style.position = "relative";
                this.svgOverlay.style.display = "block";
                this.svgOverlay.style.height = "auto";
                this.svgOverlay.style.zIndex = "1";
            }

            const tempDiv = document.createElement("div");

            this.annotations.forEach(anno => {
                const option = document.createElement("option");
                option.value = anno.id;
                option.text = anno.name;
                this.selectBox.appendChild(option);

                tempDiv.innerHTML = anno.svgStr;
                const innerSvg = tempDiv.querySelector("svg");

                if (innerSvg) {
                    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    group.setAttribute("data-id", anno.id);
                    group.setAttribute("fill", anno.color);
                    group.setAttribute("stroke", "rgba(255,255,255,0.6)");
                    group.setAttribute("stroke-width", "5");

                    const titleTag = document.createElementNS("http://www.w3.org/2000/svg", "title");
                    titleTag.textContent = anno.name;
                    group.appendChild(titleTag);

                    while (innerSvg.firstChild) {
                        group.appendChild(innerSvg.firstChild);
                    }

                    group.addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        this.highlightAnnotation(anno.id);
                    });

                    this.svgOverlay.appendChild(group);
                }
            });

            imageContainer.addEventListener('click', () => {
                this.highlightAnnotation('all');
            });

            this.selectBox.addEventListener("change", (e) => {
                this.highlightAnnotation(e.target.value);
            });

            widgetHeader.appendChild(this.selectBox);
            imageContainer.appendChild(this.svgOverlay);

            // 渲染全域 Metadata 表格 (依指定順序，Udef_properties_* 強制排在最後面)
            let metaTableContainer = null;
            if (Object.keys(this.globalMeta).length > 0) {
                metaTableContainer = document.createElement("div");
                metaTableContainer.className = "mt-4 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden";

                let tableHtml = `<div class="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700">${this.t.metadataTitle}</div>`;
                tableHtml += `<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600"><tbody>`;

                // 一般欄位順序
                const baseOrder = [
                    'Source_title_ch',
                    'Source_title_py',
                    'Source_title_en',
                    'Source_author',
                    'CBDB',
                    'Publication_place',
                    'TGAZ_cr',
                    'Publication_time',
                    'Reprint',
                    'Place_covered',
                    'TGAZ_cv',
                    'Genre',
                    'Type',
                    'Format',
                    'Location_held',
                    'Data_source',
                    'Data_source_url',
                    'Language',
                    'Subfolder',
                    'Compilation'
                ];

                // Udef_properties_ 前綴欄位順序 (強制排在表格最底端)
                const udefPropsOrder = [
                    'Udef_properties_Volume',
                    'Udef_properties_Page',
                    'Udef_properties_Image_title',
                    'Udef_properties_image_note',
                    'Udef_properties_Subfolder'
                ];

                const renderedKeys = new Set();
                let rowIndex = 0;

                const renderRow = (key, value) => {
                    // 若值為 "-" 或空，直接跳過不繪製
                    if (!value || value === '-') return '';

                    const bgClass = rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50";
                    rowIndex++;
                    
                    let displayVal = value;
                    // 若屬於 TGAZ 系列，去除末尾的點號
                    if (key.toUpperCase().includes('TGAZ')) {
                        displayVal = displayVal.replace(/\.+$/, '');
                    }

                    let cellContent = displayVal;

                    // 需求 2: Data_source_url 或網址格式，自動轉換為超連結
                    if (key.toLowerCase() === 'data_source_url' || /^https?:\/\//i.test(displayVal)) {
                        cellContent = `<a href="${displayVal}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline break-all transition-colors">${displayVal}</a>`;
                    } else {
                        const isClickable = this.clickableKeys.some(k => k.toLowerCase() === key.toLowerCase());
                        if (isClickable) {
                            cellContent = `<button class="property-btn text-left font-medium text-blue-600 hover:text-blue-800 hover:underline break-words transition-colors outline-none cursor-pointer" data-key="${key}" data-value="${displayVal}">${displayVal}</button>`;
                        }
                    }

                    return `
                        <tr class="${bgClass} border-b last:border-0">
                            <th class="px-4 py-2 font-medium text-gray-700 w-1/3 border-r break-words">${key}</th>
                            <td class="px-4 py-2 break-words">${cellContent}</td>
                        </tr>
                    `;
                };

                // Step 1: 繪製指定順序內的一般欄位
                baseOrder.forEach(reqKey => {
                    const foundEntry = Object.entries(this.globalMeta).find(([k]) => k.toLowerCase() === reqKey.toLowerCase());
                    if (foundEntry) {
                        const [actualKey, value] = foundEntry;
                        if (value && value !== '-') {
                            tableHtml += renderRow(actualKey, value);
                            renderedKeys.add(actualKey);
                        }
                    }
                });

                // Step 2: 繪製未列在指定順序中且「非 Udef_properties_」的其他欄位
                Object.entries(this.globalMeta).forEach(([key, value]) => {
                    if (!renderedKeys.has(key) && !key.toLowerCase().startsWith('udef_properties_') && value && value !== '-') {
                        tableHtml += renderRow(key, value);
                        renderedKeys.add(key);
                    }
                });

                // Step 3: 依指定順序繪製 Udef_properties_ 欄位 (強制放在表格最後面)
                udefPropsOrder.forEach(reqKey => {
                    const foundEntry = Object.entries(this.globalMeta).find(([k]) => k.toLowerCase() === reqKey.toLowerCase());
                    if (foundEntry) {
                        const [actualKey, value] = foundEntry;
                        if (value && value !== '-') {
                            tableHtml += renderRow(actualKey, value);
                            renderedKeys.add(actualKey);
                        }
                    }
                });

                // Step 4: 繪製未列在指定順序中的其他 Udef_properties_ 欄位
                Object.entries(this.globalMeta).forEach(([key, value]) => {
                    if (!renderedKeys.has(key) && key.toLowerCase().startsWith('udef_properties_') && value && value !== '-') {
                        tableHtml += renderRow(key, value);
                        renderedKeys.add(key);
                    }
                });

                tableHtml += `</tbody></table></div>`;
                metaTableContainer.innerHTML = tableHtml;
            }

            // 資訊面板
            this.infoPanel = document.createElement("div");
            this.infoPanel.className = "mt-4 p-5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm text-gray-700 hidden";
            
            widgetWrapper.appendChild(widgetHeader);
            widgetWrapper.appendChild(imageContainer);
            widgetWrapper.appendChild(this.infoPanel);
            if (metaTableContainer) {
                widgetWrapper.appendChild(metaTableContainer);
            }
            this.container.appendChild(widgetWrapper);

            // 綁定全域 Metadata 表格中的點擊事件
            if (metaTableContainer && typeof this.onPropertyClick === 'function') {
                const btns = metaTableContainer.querySelectorAll('.property-btn');
                const callback = this.onPropertyClick;
                btns.forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        const el = e.currentTarget;
                        const clickedKey = el.getAttribute('data-key');
                        const clickedValue = el.getAttribute('data-value');
                        callback.call(el, el, clickedKey, clickedValue, { key: clickedKey, value: clickedValue });
                    });
                });
            }
        }

        highlightAnnotation(selectedId) {
            this.selectBox.value = selectedId;

            const groups = this.svgOverlay.querySelectorAll("g[data-id]");
            let selectedAnno = null;

            if (selectedId === "all") {
                this.annotations.forEach(anno => {
                    const g = this.svgOverlay.querySelector(`g[data-id="${anno.id}"]`);
                    if (g) {
                        g.style.opacity = "1";
                        g.setAttribute("stroke", "rgba(255,255,255,0.6)");
                        g.setAttribute("stroke-width", "5");
                        this.svgOverlay.appendChild(g); 
                    }
                });
            } else {
                groups.forEach(g => {
                    const gid = g.getAttribute("data-id");
                    if (gid === selectedId) {
                        g.style.opacity = "1";
                        g.setAttribute("stroke", "#ef4444"); 
                        g.setAttribute("stroke-width", "20"); 
                        this.svgOverlay.appendChild(g);
                        selectedAnno = this.annotations.find(a => a.id === gid);
                    } else {
                        g.style.opacity = "0.15";
                        g.setAttribute("stroke", "transparent");
                    }
                });
            }

            this.updateInfoPanel(selectedAnno);
        }

        updateInfoPanel(anno) {
            if (!anno) {
                this.infoPanel.classList.add('hidden');
                return;
            }

            let html = `<h3 class="font-bold text-xl text-gray-800 border-b pb-3 mb-3">${anno.name}</h3>`;
            html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">`;
            
            for (let [key, propData] of Object.entries(anno.properties)) {
                if (key === 'name' || key === 'Udef_properties_name') continue;
                
                let value = propData.value;
                if (!value || value === '-') continue;

                // 需求 3: EntityClass 若有多層，只顯示最後一層 (如 object/city_wall/feicheng_cheng 變成 feicheng_cheng)
                if (key.toLowerCase().includes('entityclass')) {
                    value = value.split('/').filter(Boolean).pop() || value;
                }

                // 去除末尾點號
                if (key.toUpperCase().includes('TGAZ')) {
                    value = value.replace(/\.+$/, '');
                }

                const isClickable = this.clickableKeys.some(k => k.toLowerCase() === key.toLowerCase());
                const colSpanClass = (key === 'Note' || key.toLowerCase().includes('note')) ? ' md:col-span-2' : '';

                html += `
                    <div class="flex flex-col bg-gray-50 p-2 rounded${colSpanClass}">
                        <span class="text-xs text-gray-400 font-mono uppercase">${key}</span>
                `;

                if (/^https?:\/\//i.test(value)) {
                    html += `<a href="${value}" target="_blank" rel="noopener noreferrer" class="font-medium text-blue-600 hover:underline mt-1 break-all">${value}</a>`;
                } else if (isClickable) {
                    let attrHtml = "";
                    for (let [attrKey, attrVal] of Object.entries(propData.attributes)) {
                        let finalAttrVal = attrVal;
                        if (attrKey.toLowerCase() === 'value' || attrKey.toUpperCase().includes('TGAZ')) {
                            finalAttrVal = finalAttrVal.replace(/\.+$/, '');
                        }
                        attrHtml += ` ${attrKey}="${finalAttrVal}"`;
                    }
                    html += `<button class="property-btn text-left font-medium text-blue-600 hover:text-blue-800 hover:underline mt-1 break-words transition-colors outline-none cursor-pointer" data-key="${key}" data-value="${value}"${attrHtml}>${value}</button>`;
                } else {
                    html += `<span class="font-medium text-gray-800 mt-1 break-words">${value}</span>`;
                }

                html += `</div>`;
            }
            
            if (Object.keys(anno.properties).length <= 1) {
                html += `<div class="text-gray-400 italic">${this.t.noProps}</div>`;
            }
            
            html += `</div>`;
            
            this.infoPanel.innerHTML = html;
            this.infoPanel.classList.remove('hidden');

            if (typeof this.onPropertyClick === 'function') {
                const btns = this.infoPanel.querySelectorAll('.property-btn');
                const callback = this.onPropertyClick;
                btns.forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        const el = e.currentTarget;
                        const clickedKey = el.getAttribute('data-key');
                        const clickedValue = el.getAttribute('data-value');
                        const attrData = {};
                        Array.from(el.attributes).forEach(attr => {
                            attrData[attr.name] = attr.value;
                        });
                        callback.call(el, el, clickedKey, clickedValue, attrData);
                    });
                });
            }
        }
    }