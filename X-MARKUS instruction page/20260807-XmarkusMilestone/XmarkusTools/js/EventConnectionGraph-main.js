   // global constants
   const EnableDocuSkyConnectivity = false;             // true for DocuSky as a scafford for development/testing （參考 DocuSky.connectivity.js 取得 DocuSkyHost）
   const EnableMessageViaParent = true;                 // 2025-02-20: 透過 parent 傳遞訊息
   const UseLeftSidebar = false;                        // 2024-11-04: 是否採用 left-sidebar 置放功能鈕

   const NodeTypeNameMap = { 'E': 'Event',              // 2025-05-25
                             'C': 'Connection',         // 以前是稱作 'Common' （因為包含了 'C', 'CX' 等不同 captions 類別，暫不使用 LegendCaption.feature)
                             'M': 'Image',
                             'B': 'BinRel',
                           };

   const ShapeSet = ['circle', 'square',                // 2025-07-02
                     'triangle', 'diamond'];   
   
   const TotalColors = 16;                              // 2025-07-02: 延伸成 16 色
   const DarkLightBoundary = TotalColors / 2;           // 16 種顏色的一半
   
   const NodeSizeMap = { 'xsmall': 2,                   // 2024-10-24
                         'small': 4,                    // 2024-10-03
                         'medium': 6,
                         'large': 8,
                         'xlarge': 10,
                         '2xlarge': 12,
                       };
   const FontSizeMap = { 'xsmall': 'fontSizeXsmall',    // 2024-10-22
                         'small': 'fontSizeSmall',
                         'medium': 'fontSizeMedium',
                         'large': 'fontSizeLarge',
                         'xlarge': 'fontSizeXlarge',
                         '2xlarge': 'fontSize2Xlarge',
                       };
                       
   const LegendCaption = { 'event': 'Event',              // 2025-06-28: 將（預設的）nodeLegendCaption 顯示字串統整在此
                           'image': 'Image',
                           'feature': 'Feature',
                           'featureHierarchy': 'Feature Hierarchy',
                           'sourceStructure': 'Source Structure',
                           'unifiedFeature': 'Unified Feature',            // 2025-07-08: 需 GlobalVar.genre4UnifiedFeature 為 true 才生效
                           'alignedFeature': 'Aligned Feature',            // 2025-07-15: 需 GlobalVar.genre4AlignedFeature 為 true 才生效
                         };
   
   const ImageShapeMask = [                               // image 標記區塊的底色
                            "rgba(255, 0, 0, 0.5)",       // 紅
                            "rgba(0, 255, 0, 0.5)",       // 綠
                            "rgba(0, 0, 255, 0.5)",       // 藍
                            "rgba(255, 255, 0, 0.5)",     // 黃
                            "rgba(255, 0, 255, 0.5)",     // 品紅
                            "rgba(0, 255, 255, 0.5)",     // 青
                            "rgba(128, 0, 0, 0.5)",       // 深紅
                            "rgba(0, 128, 0, 0.5)",       // 深綠
                            "rgba(0, 0, 128, 0.5)",       // 深藍
                            "rgba(128, 128, 0, 0.5)",     // 橄欖綠
                            "rgba(128, 0, 128, 0.5)",     // 紫色
                            "rgba(0, 128, 128, 0.5)",     // 暗青
                            "rgba(255, 128, 0, 0.5)",     // 橘色
                            "rgba(128, 255, 0, 0.5)",     // 螢光綠
                            "rgba(0, 255, 128, 0.5)",     // 水綠
                            "rgba(128, 0, 255, 0.5)"      // 紫藍                          
                          ];

   const EventTypeOrder = { 'EVENT_SOURCE_TEXT': 1,
                            'EVENT': 2,
                            'OBJECT_MAIN': 3,
                            'TIME': 4,
                            'LOCATION': 5,
                            
                            'INITIATOR': 11,
                            'SPONSOR': 12,
                            'BENEFICIARY': 13,
                            'EVENT_CAUSE': 14,
                            'OBJECT_MEANING': 15,
                            'OBJECT_DEITY': 16,
                            'OBJECT_ALT_NAME': 17,
                            
                            'COST': 21,
                            'COST_ORIGIN': 22,
                            'LABOR': 23,
                            'LABOR_ORIGIN': 24,
                            'FUNDING_ORIGIN': 25,
                            'MATERIAL': 26,
                            'MATERIAL_LINKED': 27,
                            
                            'OBJECT_LENGTH': 31,
                            'OBJECT_WIDTH': 32,
                            'OBJECT_HEIGHT': 33,
                            'OBJECT_DEPTH': 34,
                            
                            'OBJECT_PART': 41,
                            'OBJ_PART_LINKED': 42,
                            'PLACE_LINKED': 43,
                            
                            'OBJECT': 51,       // not in Dawn's feedback
                            'OBJ': 52,
                            'OBJ_LENGTH': 53,
                            'OBJ_WIDTH': 54,
                            'OBJ_HEIGHT': 55,
                            'OBJ_DEPTH': 56,
                            // 其他項: 100
                          };

   const GRAPH_COLORS = { 'arrowMarker': '#b7b7b7',
                          'nodeHighlightCircle' : 'red',
                          'hoverHighlight': '#123456',
                          'starLink': '#cc5500',             // #84b067 (green), #cc5500 (orange)
                          'defaultPathColor': '#b7b7b7',
                        };
     
   const MIN_VIEWPORT_WIDTH = 400;
   const MAX_VIEWPORT_WIDTH = 10000;
   const MIN_VIEWPORT_HEIGHT = 300;
   const MAX_VIEWPORT_HEIGHT = 7500;
   const MIN_INPUT_YEAR_RANGE = 0;                      // 2024-10-22: 年份範圍從 0-2100 
   const MAX_INPUT_YEAR_RANGE = 2100;

   // global variables
   var DocuSkyObj = null;                                             // 2024-05-04
   var GlobalVar = { // dbName: ...
                     // corpusName: '[ALL]',                          // 2025-10-28: 關聯圖會整併所有 corpuses 的資料...
                     jqXml: null,                                     // 2025-11-22: 儲存載入檔的 jQuery 參考 jqXml = $($.parseXML(docuXml))
   
                     resetDataVarsOnParsingDocuXml: true,             // 2025-02-27: 是否 parse DocuXml 前，呼叫 resetDataVars() 來重設資料相關的變數（false 則資料應可疊加 -- 注意若兩份不同檔名檔案包含重覆內容，將會產生看起來重覆的節點）
                     loadedDocuXmlFilenames: [],                      // 2025-06-08: 目前載入的 DocuXml filenames
                     docFilenameJqDoc: {},                            // 2025-05-20: 利用 DocuXml 中 <doc filename> 設定 docFilenameJqDoc[filename] := jqDoc 參考
                     filenamesLoadedHash: {},                         // 2025-06-13: 儲存已載入（並剖析過）的 docFilename hash，若文件檔名 filename 已被剖析過，filenamesLoadedHash[filename] = 1 
                                                                      
                     table: null,                                     // 儲存 tabulator 物件的參考
                     tableData: [],                                   // 將透過 DocuSkyObj 取回的文件，每項 event element 轉成一個 row
                     tableIdEntry: 1,                                 // tabulator 的每一列需要一個 id，TableIdEntry 為下一項的編號
                     totalDocs: 0,                                    
                     eventEntry: 1,                                   // counter (工具將藉此計數器，賦予每個 event 一個 number）
                                                                      
                     controlPanelOnRightHandSide: true,               // 2024-11-20: 是否將 graph control panel 放在 viewport 右方（預設是放左方）
                     enableFeatureLinks: false,                       // 2024-08-12: 允許 features (C-nodes)之間透過比對「node label of A 與 node label of B」來加上連線（若 A-label 為 B-label 的子字串，可「自動」在兩者間加上虛線）
                                                                      
                     // 關於 doc metadata 的一些設定
                     useDocuXmlMetadataInsteadOfXmlMetadata: false,   // 2025-07-01: 新版應預設 false -- 是否採用 DocuXml 的後分類 metadata，而不是 <xml_metadata>（注意，後分類項目可能只是 xml_metadata 經過挑選的一部份）
                     addDocMeta2RowsInParsingDocuXml: false,          // 2025-06-05: 預設 false 以減少麻煩（例如計算 event 下的 tags/annotations 數量）... 是否將 xml_metadata 的 tags 轉換成 table rows...(2025-05-31: 昨天「竟然」以為可以刪掉？ 但由於 immarkus image 的標籤沒有結構且混亂，將 metadata 轉為 tags 將可方便 filtering！）
                     displayXmlMetadata: false,                       // 2025-06-05: 若 addDocMeta2RowsInParsingDocuXml 為 true，就不必額外顯示 xmlMetadata

                     tagsWithAllDupOptions: [],                       // 2026-05-11: 允許 Tag, Type, Id, Text 四種 options 的標籤名稱（最基本的標籤是 Udef_Align_Object）
                     tagsComputeDupWithTagOnly: [],                   // 2025-06-18: 在 init() 設定：因預設就是用 tag only，因此可以略去
                     tagsComputeDupWithPrefix: [],                    // 2025-06-18: 在 init() 設定：要用 tag + content_prefix 作為 dup 計算的特定標籤（預設是以 tag 計算，如此可避免產生過多 common nodes）
                     tagsComputeDupWithInfix: [],                     // 2025-06-18: 在 init() 設定：採用 x/y/z 的 y，tag + y 當作 feature 計算 duplicate
                     tagsComputeDupWithSuffix: [],                    // 2025-06-18: 在 init() 設定：採用 x/y/z 的 z，tag + z 當作 feature 計算 duplicate
                     tagsComputeDupWithTop2Layers: [],                // 2025-06-19: 在 init() 設定：採用 x/y/z 的 x/y，tag + x/y 當作 feature 計算 duplicate
                     tagDupLookup: {},                                // 2025-07-07: 「反向」計算 -- 可查詢某 Udef 標籤被用來計算 dup 的方法
                     tagDupLookupDefault: {},                         // 2025-07-22: 將預設的 tagDupLookup 值拷貝於此，用來「回復」到預設的狀態
                     dupMethodLabel: {},                              // 2025-07-14: 將 dupMethod 以比較易懂的形式呈現（假設標籤值格式為 Type/Norm/Value）
                     limitedDupMethodLabel: {},                       // 2025-11-27: 除了 Udef_Align_OBJECT 需用到 'text' dup method，其他只需用到 'Tag', 'Type' 兩類
                     tagLinkColorList: {},                            // 2025-08-01
                     
                     tagsForFileStructure: [],                        // 2025-06-22: 在 init() 設定，Common node 歸屬於 "Source Structure" 而非一般 Feature 的 tag names
                     defaultCommonNodeTagsChecked: [],                // 2025-06-19: 在 init() 設定：預設要將哪些標籤的 common node 勾選起來顯示
                     
                     commonLabelIncludesTagName: false,               // 2025-05-10 (2025-08-20 透過 #commonLabelAlwaysShowTag 動態設定)
                     convertImmarkusPieceToNode: false,               // 2024-10-05: 是否每個 immarkus piece 視為一個 graphNode（若是，則每 piece 前加上一個 row，其 row.tagName:=Udef_EventRelLite）
                                  
                     nodeTypeDict: {},                                // 2025-06-01: e.g., nodeTypeDict['E']=10 means there are 10 event nodes
                     nodeTypeShapeMap: {},                            // 2024-07-24: 從 {'E', 'C', 'M'} 對應到 {'circle','triangle,'square'} 的函數
                     nodeTypeLabelClassMap: {},                       // 2025-05-16: 指定某類型節點標籤的字型顏色
                     nodeTypeLabelPosMap: {},                         // 2024-12-04: (TODO 尚未加上 UI）讓使用者可以選擇 label 可放在節點上方或下方...
                     labelOffset: {},                                 // 2024-12-04: {'top':[-5,-15], 'bottom':[-10,12+radius*2]}
                                                                      
                     graphNodeDict: {},                               // 重要的內部結構，儲存 tableData 整理後，graph nodes 以 "event-based" 的顯示資料（額外加上使用者決定的顯示或隱藏參數）
                                                      
                     // for event filter -- 透過 convertTableData2graphNodeDict(tableData) 函式計算出來 -- df. EventConnectionGraph-graph.js
                     //eventElementTags: {},                            // for event filter -- eventElementTags[tag][content_p] = dupCnt -- 注意 tag+content_p (content_p 是 content 或者「從 content 移除最末 '/' 後綴」的結果）就是目前 common node 所使用的 common property！ (EventRelLite-graph.js 在 convertTableData2graphNodeDict() 計算 graphNodeDict 時，一併計算出 eventElementTags)
                     myEventElementTags: {},                          // 2025-06-25: 擴充原先的 eventElementTags，加上事件節點型態 -- myEventElementTags['E'][tag][conent_p] = dupCnt -- 日後可一次改變數名為 nodeTypeEventTagDupCount
                     commonNodeDupKeyIncludesNodeType: false,         // 2025-07-19: 計算 common node dup key 時，除了 Udef_Align_ 和 Udef_DocMeta_ 標籤外，是否加入 nodeType ('E', 'M', etc.) 作為區隔（若加入，不同 nodeTypes 下的 rows 即使 tag+content 相同，也會被視為不同）
                     filterComparedWithExactValue: false,             // 2025-07-04: 套用 filter 比對 tag value 時，是否 exact match 才比對成功（false 代表鬆散模式，只要 filter term 出現為 value 的 substring 即算通過）
                     enableFilterTermAsAnyNone: true,                 // 2025-08-18
                     
                     eventElementTagIncludeGenre: false,              // 2025-01-16: (tabulator/graph) 計算 eventElementTags 時，額外檢查 content 是否為 'X/Y' 形式，若是則額外以 <tag>.Genre 加上 'X' 值，eventElementTags[tag.Genre][X] = dupCnt
                     commonTagsHash: {},                              // 2025-01-25: for event filter and common node display -- commonTagsHash[tag] = [val1, val2, ...] for tag in C node -- 在 EventConnectionGraph-graph.js 的 convertTableData2graphNodeDict() 計算

                     //enableFilterTrees: false,                        // 2025-06-12: event filter 是否採用 treejs 顯示 spotlight 內容
                     udefPropertyTreeName: 'UdefPropertyTree',        // 2025-06-16: 將 "Udef_properties_" 起頭的標籤，收納在 udefPropertyTreeName 為名稱的樹狀結構下
                     udefEventTreeName: 'UdefEventTree',              // 2025-06-19: 將 'Udef_Evt_" 起頭的標籤，收納在 udefEventTreeName 為名稱的樹狀結構下
                     tagNamesToRemove: ['span', 'Udef_properties'],   // 2025-06-08: 移除 C2D, I2D 轉換之後「冗餘」（例如 converter 為了偵錯所保留）的標籤，預設 ['span', 'Udef_properties']
                     enableCuesCountDisplay: true,                    // 2025-06-12: 是否在 spotlight 後方以 [n] 顯示該 spotlight 下有多少 cues
                                                                      
                     rectEntireEventInfo: true,                       // 2024-05-25: 預設「將共同重覆的 content 提取到新的 graphNode，提取後並不顯示在舊事件列表」
                     editOptions: {                                   
                        interlinked: true,                            
                     },                                               
                                                                      
                     leftSidebarWidth: 0,                             // 2024-11-04
                                
                     showSvgOverlayAtDrawing: true,                   // 2025-06-02: 繪製 graph 時，是否加上一層 overlay 以避免使用者在動畫期間拖拉節點（可能會造成後續執行錯誤）
                     svgCanvasScale: 1,                               // 2024-06-28: 實際寬度（長度）會是 svgWidth * svgCanvasScale
                     svgWidth: 100,                                   // 2024-09-29
                     svgHeight: 100,                                  // 2024-09-29
                     svgTopOffset: 32,                                // 2024-10-20  
                                                                      
                     linkToDocuSky: false,                            // 2025-02-21: (TODO) 目前永遠是 false（保留彈性）                                            
                     openPageUrl: null,                               // 2024-06-05
                     userPageUrl: null,                               // 2024-06-05
                     pageParams: {},                                  // 2024-06-05: 從工具的 url params 或 widget 讀入
                                                                      
                     nodeSizeRadius: NodeSizeMap['medium'],           // 2024-06-28: 4, 6, 8, 10
                     nodeFontSizeClass: FontSizeMap['large'],         // 2024-11-01
                     addNodeLabelFontEffect: false,                   // 2025-03-17: 是否在 node label 加上 CSS 白邊效果
                     highlightPiecesAtStart: false,                   // 2025-06-08
                               
                     treeJsObj: {},                                   // 2025-06-06: GlobalVar.treeJsObj[spotlight] := treejsObj
                                                                      
                     thresholdCommonNodeDegree: 1,                    // 2025-05-09: 僅顯示超過這個數量的 common nodes (2025-05-09: 設為 1，因此 C nodes 數量會動輒破千...)
                     filterUnwantedCommonNodes: true,                 // 2024-09-11: 若 common node 僅連到 1 event node，或者連到過多 event nodes，就隱藏此 common node
                     hideIsolatedEventNode: true,                     // 2024-08-12: 是否隱藏孤立的事件節點
                                                                      
                     autoSetTnbTnaByTheOther: true,                   // 2024-09-13, 2024-10-02
                     defaultTimeSpan: 0,                              // 2024-09-13, 2024-10-02 （更改變數名稱）
                     highlightQueryTerms: false,                      // 2024-10-10: 有時（例如事件節點展開時）可能並不希望查詢詞被 highlight
                     nodeFulltextHighlightTerms: false,               // 2025-06-03: 是否在 event node 全文中，highlight 出 connected C-node 的 terms（目前處理的方式有可能會誤標）

                     immarkusDict: {},                                // 2024-06-28: 儲存 docFilename => (image,thumbnail) 的資訊
                     eventNodeTagNames: {},                           // 2024-09-25: eventNodeTagNames[nodeType][tagName][eventNode] = content, e.g., event node "E001" 的 tagName "Udef_EventRelLite" 的 content（應與其 graphNodeLabel 同步！）
                     drawNodeLinkAsArc: false,                        // 2024-09-30
                                                                      
                     tagUnificationMap: {},                           // 2025-07-05: tagUnificationMap[<sourceTag>] := { sourceContent, targetTag, targetContent }
                                                                      
                     showSet2NodeIdButtonOnNodeLabeling: true,        // 2025-10-30: 在 node labeling sub-panel 中，是否額外顯示「set to node id」按鈕
                     showAbbrPrefixInEventLabel: true,                // 2025-01-04: 顯示 event label 時，是否顯示 '#', '*', '^' 等（為 Udef_MetaDocs_, Udef_Evt_, Udef_properties_ 縮寫符號）
                     showTagValueAsHintInLabelling: false,            // 2025-06-04: Hilde 認為似乎不需要顯示 tag value...
                     useEmptyEventLabelAsDefault: true,               // 2025-06-04: 若標籤沒有值，Hilde 建議直接用空字串

                     initTooManyNodes: 120,                           // 載入 DocuXml 後，若發現節點總數超過此數，就取 subset 後在繪圖
                     initHideNodeTypeLabels: [],                      // 2025-02-28: 起始時，哪些 nodeType 要勾選「隱藏標籤」，例如 ['E', 'M']（注意，這些 nodeType checkboxes 是動態生成的）
                     
                     temp: { eventLines: 0,                           // 2024-09-14: 藉著全域 GlobalVar.temp 在函式之間傳遞變數值值
                             queryTerms: [],                          // 2024-09-15: 藉全域變數，傳遞給 highlightQueryTerms() 使用
                             eventNodeGenreMap: {},                   // 2025-05-11: 當前 visible event nodes 的類型（eventGenreStyleMap keys 的子集，例如僅有 'CONSTRUCTION' 和 'RENOVATION'）與其對應的參數
                             imageNodeGenreMap: {},                   // 2025-05-25: imageNodeGenreMap[genre] := {nodeColorIdx, nodeLabelColorClass, nodeShape}，其中 genre 目前就是 nodeLegendCaption
                             binrelNodeGenreMap: {},                  // 2025-05-29
                             commonNodeTypeMap: {},                   // 2025-05-11: 當前 visible common nodes 的類型（commonGenreStyleMap keys 的子集）與其對應的參數
                             eventNodeConnectedEntities: {},          // 2025-05-20: 儲存「當前」所繪畫面 event node 所連到的 entities (i.e., common nodes) 資訊, e.g., eventNodeConnectedEntities['Exx'] = [{type:'EVENT',content:'RENOVATION/construct/造'}];
                             graphData: [],                           // 2025-08-22
                             nodeLinks: null,                         // 2025-08-22: svg selection object (svg.selectAll("path.nodeLink"))
                             graphNodeObjArray: [],                   // 2025-06-15: graphNodeObjArray[graphNodeIdx] = new GraphNode()
                             graphDataIdxLinks: [],                   // 2025-06-15: 二維陣列 graphDataIdxLinks[i] = [j1, j2,...] 表示 graphData 索引 i 的節點，連線到 graphData 索引 j1, j2, ...
                             onNodeDraggingState: false,              // 2025-09-24: 是否處於節點拖動狀態（若為 true，則 node hovering 將跳過 highlight connected paths）
                             onNeedComputeFilteredNodesState: false,  // 2025-09-25: 在 Redraw 前，是否需先呼叫 computeFilteredNodes()
                             pinnedNodePosition: {},                  // 2025-10-23: pinnedNodePosition[nodeId] = {x, y}，儲存 pinned node position
                             flaggedNodeList: [],                     // 2025-11-01: 使用者按下 ctrl-click 「固定」要 highlight 的節點
                             cxNodeConnected: false,                  // 2025-10-31: 額外的 CX nodes 是否有連線到（若 false，legend 中也不該顯示）
                           },

                     // TODO: 日後應可將 eventGenreStyleMap, imageGenreStyleMap, commonGenreStyleMap 統整起來...
                     eventGenreStyleMap: {},                          // 2025-05-10: e.g., eventGenreStyleMap['CONSTRUCTION'] = { nodeColorIdx:'03', nodeLabelColorClass:'nodeLabelColor00' }
                     imageGenreStyleMap: {},                          // 2025-05-25: 
                     binrelGenreStyleMap: {},                         // 2025-05-29
                     commonGenreStyleMap: {},                         // 2025-06-22: e.g., {'Feature':{nodeColorIdx, nodeLabelColorClass, nodeShape}, 'Source Structure': {...}, ...}
                     defaultGenericStyleMap: {},                      // 2025-06-23: init() 設定，預設的 style -- 防呆用
                     genre4UnifiedFeature: false,                     // 2025-07-08: 套用 tag unification 時，是否讓 Udef_Unification_XXX 標籤採用 'Unified Feature' legend caption
                     genre4AlignedFeature: false,                     // 2025-07-15: （預設 false）對 Udef_Align_Object 標籤採用 'Aligned Feature' legend caption

                     enableDynamicDupMethod: true,                    // 2025-07-28: 讓使用者可動態指定標籤的 dupMethod（仍屬實驗性質）-- 2025-09-29 預設 false
                     recomputeOnlyOnFeatureTypesChanged: false,       // 2025-12-03:（仍在實驗中，因此預設為 false 不啟用）REDRAW 需花大量時間重新計算 -- 若 FeatureType 沒有更動，E-nodes 與 C-nodes 應不會改變...
                     featureTypesChanged: false,                      // 2025-12-02: enableDynamicDupMethod 和 recomputeOnlyOnFeatureTypesChanged 為 true 時，若 featureTypesChanged 為 false 可跳過「應不必要的繁重計算過程」...

                     comarkusEventTimeTags: [],                       // 2025-06-27: Comarkus 哪些標籤（例如 Udef_Evt_TIME）會被用來取出 tnb, tna 以供 year filter 使用 -- 注意是陣列
                     immarkusImageTimeTags: {},                       // 2025-06-27: Immarkus (pieces) 哪些標籤會被用來提取 tnb, tna -- 由於標籤 start, end 是獨立的（沒有標籤屬性），必須透過標籤名稱加上屬性 begin/end -- 注意是 Dictionary
                     
                     enableUserTagLinkColor: false,                   // 2025-08-01: 讓使用者可動態指定標籤連線的顏色
                     addExtraConnections: true,                       // 2025-06-20: 是否加上額外的 CX 節點與連線（object, obj_part 節點，以及它們到 "Udef_Align_XXX 所連到的 C-node" 之間的連線）
                     hideGraphNodeTagPrefix: true,                    // 2025-06-25: 圖形上是否隱藏 '*', '^', '#' 等代表 Udef_Evt_, Udef_properties_, Udef_DocMeta_ 標籤的前綴

                     experimentMode: false,                           // 2025-05-20
                     
                     filterInitiated: false,                          // 2025-08-01: 預設必須是 false，init() 利用 maxFilters 設定好 filter HTML 後會改為 true
                     maxFilters: 4,                                   // 2025-08-01: 通常 3 就應足夠
                     
                     enableTagEnodeCount: false,                      // 2025-08-11: 是否在 "select features" sub-panel 顯示 filtered result 每個 tag 的 e-nodes 數量
                     tagEnodeLookupMap: {},                           // 2025-08-09: 格式 {'Udef_XXX': [ 'E001', 'E003', 'I015'], ... } -- 可快速得知某 tag 有出現在幾個 event nodes 中（最多構成幾條連線）... （屬於「靜態」的查詢表，載入 DocuXml 就已決定）
                     tagVisibleEnodeList: {},                         // 2025-08-10: (TODO) 在 updateCheckedNodesCountAndGraphNodeDict() 計算過程中，利用 tagEnodeLookupMap 和 visible (E-)graphNode 做交集取得
                     
                     nodeGenreUseEventTypes: false,                   // 2025-09-15: 在 parsing 過程中，允許 event types (CONSTRUCTION, RENOVATION, etc.) 作為 event node genre (nodeLabelCaption)
                     nodeGenreUseConnTagName: false,                  // 2025-09-15: 在 parsing 過程中，允許 feature tag names (INITIATOR, LOCATION, TIME, etc.) 作為 connection node genre (nodeLabelCaption)
                     nodeGenreUseImageTypes: false,                   // 2025-09-15: 在 parsing 過程中，允許 image types (目前僅有 Generic, Iiif 兩類) 作為 image node genre (nodeLabelCaption)
                     
                     currentZoomTransform: null,                      // 2025-09-20: 儲存 event.transform
                     enableWeightedLinkWidth: true,                   // 2025-09-24: 若設為 false，連線的 width 將總是 1
                     imageContainerViewBox: {},                       // 2025-09-24: e.g., GlobalVar.imageContainerViewBox['immarkus_M01'] = "0 0 <image_width> <image_height>"
                     
                     disallowNodeExpansion: true,                     // 2025-09-24: 若設為 true，單擊節點就會將節點內容另外顯示，然後不會啟用雙擊 node expand/shrink 動作，
                     enableExpandCommonNodes: true,                   // 2024-10-08: 若為 false，將不允許點擊 common node 後展開其內容 (expand/collapse node content)
                     enableExpandedNodeLinkback2Text: true,           // 2024-02-22: 若關閉 node expansion 功能，就不需此設定了...

                     linkbackViaBroadcastChannel: false,              // 2025-10-29: 工具都在同源的狀況下，可設為 true 透過 BroadcastChannel 傳遞 linkback 訊息
                     enableLinkbackMultiFilenames: false,             // 2025-10-25: 是否允許（例如 C-node 連結到多個 event nodes）linkback 時，以 f1|f2|... 方式傳遞多個檔名

                     showObjPartLinkedInnerTagName: false,            // 2025-10-05: 顯示事件節點內容時，OBJ_PART_LINKED (ComarkusBundle) 包含了多個標籤，是否將標籤 Udef_Evt_MATERIAL 的 'MATERIAL' 提取出來顯示

                     hideAlignObjectTagSingleEventType: true,         // 2025-10-04: 若 Event/Image 非同時出現（例如僅有 Event），是否在 subfilter 隱藏 Doc_Align_OBJECT 標籤（預設 true）
                     hideAlignObjIdTags: true,                        // 2026-04-23: 是否在 (filter 和 feature selection) menu 中隱藏 Udef_Align_<obj>_ID 的項目（預設 true）
                     
                     displayGraphUnfadeLastHovering: false,           // 2025-12-01: 預設 false -- 移開 hovering 後，該節點與相關連線不會馬上被刷淡（需滑鼠移到另一個節點才會被刷淡）
                     displayGraphOnFadingMode: false,                 // 2025-11-21: 若為 true，則節點和連線若非 pinned or hovered，基本上都是處於刷淡的狀態（便於「檢視」）；若為 false 則可以完整展示整張圖（適合列印出來 -- 初始值是 false）

                     keepPinnedZoomStateOnRedraw: true,               // 2025-10-23: 重繪並且保持 pinned node positions 時，是否也保持 zoom 狀態（若設為 true，即使 zoom 處於縮放狀態，只要節點沒變，即使重繪也會得到相同的圖）

                     tabulatorBuilt: false,                           // 2025-11-20: for exporting tabulator to Excel
                     mouseoutRemoveAllEdgeHighlight: false,           // 2026-01-25: 先預設為 false（但有時 mouseout 事件似乎會遺漏而留下 edgeHighlight 紅線，設為 true 當滑出其他 edge 時可一併移除所有 edgeHiglight...）
                     
                     raiseAllNodesAfterHovering: false,               // 2025-12-12: 是否在動畫模擬結束，以及 node hovering 後將所有節點提到最上層
                     raiseMovedElementsOnDragging: true,              // 2026-05-10: 應該設為 true 較佳，但先前好像（在拖曳過程中？）raise 會導致 Edge hang 住？ -- 對 arrows 似乎沒有作用？
                     raiseHilightedElements: false,                   // 2026-05-13: 原先是處於 false 模式，但設為 true 效果較佳
                   };
                   
   var BackupGlobalVarInitValue = JSON.parse(JSON.stringify(GlobalVar));            // 2025-01-31
                   
   // 建立一個可在同源共享的頻道（必須是同源才能傳遞訊息！）
   // 注意：linkback2Text() 採取不同方式（直接透過 win.postMessage()），可進行 cross-origin messaging
   //       => 也可利用 iframe bridge，在 origin A 和 B 各引入一個相同的 iframe 負責傳遞訊息，
   //          然後就可利用 postMessage()，從 A -> iframe bridge -> B
   const CHANNEL_NAME = "x-markus";
   var XmarkusChannel = new BroadcastChannel(CHANNEL_NAME);

   //$(window).on("click", function() {
   //   SomeButtonClicked = true;
   //});
   
   
   // ---------------------------
   //   error-display functions
   // ---------------------------

   window.onerror = function (message, source, lineno, colno, error) {
      showUserError("系統發生錯誤，請重新整理頁面或稍後再試。");
      console.error("JS Error:", message, source, lineno, colno, error);
      return true; // 防止瀏覽器預設 alert
   };

   window.addEventListener("unhandledrejection", event => {
      showUserError("資料載入失敗，請檢查網路或稍後再試。");
      console.error("Unhandled Promise:", event.reason);
   });   

   function showUserError(msg) {
     let el = document.getElementById("error-banner");
     if (!el) {
       el = document.createElement("div");
       el.id = "error-banner";
       el.style.cssText = `
         position: fixed;
         top: 10px;
         left: 50%;
         transform: translateX(-50%);
         background: #c62828;
         color: white;
         padding: 8px 14px;
         border-radius: 4px;
         z-index: 9999;
         font-size: 14px;
       `;
       document.body.appendChild(el);
     }
     el.textContent = msg;
     el.style.display = "block";
   
     setTimeout(() => el.style.display = "none", 5000);
   }
   
   // ---------------------------
   //       init functions
   // ---------------------------

   window.onload = (function(e) { 
      startTool();   
   });
   
   window.onresize = function() {
      // 2025-02-25
      resizingControlPanelContainer();
   }

   function startTool() {
      // 2025-02-09: 注意，在此將 window.onload() 改用 $(document).ready(function(e) { ...}); 也一樣，
      //             此外，雖然 parent 已在 <iframe> 設定 width，但有時 init() 仍無法取得 window.innerWidth（其值會是 0）

      // 2024-08-25: 只有在定義 window.DocuSkyHost（正確引入 js/DocuSky.connectivity.js）後，才顯示 DocuSky 相關的功能與訊息
      if (EnableDocuSkyConnectivity && window.DocuSkyHost) {       // 2024-09-01: 加入 EnableDocuSkyConnectivity 檢查
         $(".enableDocuSkyConnectivity").show();                   // 2024-11-02: 調整 CSS，預設是隱藏，若偵測到 connectivity 才顯示
      }
   
      // initialization
		let target = 'USER';
  		let db = '', corpus = '';
      let query = '.all';
  		let page = 1;
  		let pageSize = 200;
         
   	/* DocuSky Settings */
   	DocuSkyObj = docuskyGetDbCorpusDocumentsSimpleUI;          // global variable
      DocuSkyObj.setRequester("EventRelLite");                   // 2024-05-04
      
      //alert(window.location.href);
      //alert(window.location.protocol + "//" + window.location.hostname + window.location.pathname);
      
      // 2025-02-21: (window.location.protocol == 'file:')
      if (GlobalVar.linkToDocuSky) {
         let tmpArr = window.location.href.split('/');
         tmpArr.splice(-3, 3);                           // 移除末端 3 個 elements (e.g., .../XmarkusPlatform/XmarkusTools/XmarkusPlatform.html)
         GlobalVar.openPageUrl = tmpArr.join('/') + '/PHP5/WebApi/webpage-open-3in1.php';
         GlobalVar.userPageUrl = tmpArr.join('/') + '/PHP5/WebApi/webpage-search-3in1.php';
         //alert(GlobalVar.openPageUrl);              // 呃... 實際上用不到？
      }

      // 透過 URLSearchParams 取得 URL parameters，以「自動載入」某文獻集
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      target = urlParams.get('target');
      if (target!='USER') target='OPEN';
      db = urlParams.get('db') || '';
      corpus = urlParams.get('corpus') || '[ALL]';
      query = urlParams.get('query') || '.all';
      if (db != '') {
         let param = { 'target': target,
                       'db': db,
                       'corpus': corpus,
                       'query': query,
                       'page': 1,
                       'pageSize': pageSize,
                       'requester': 'EventRelLite (with param)',
                    };

         DocuSkyObj.getQueryResultDocuments(param, e, function() {
   			getDocuSkyPages(e);
   		}, function() {});
      }
      
      GlobalVar.pageParams = { db, corpus, query };               // 2024-06-05: query 使用時會被取代掉

   	$("#butFetchDocuXml").click(function(e) {
   		// empty string: force the simpleUI to display a menu for user selection
         GlobalVar.eventEntry = 1;              // reset
         
         let param = { 'target': '',
                       'db': '',
                       'corpus': '',
                       'query': '',
                       'page': 1,
                       'pageSize': 200,
                       'requester': 'EventRelLite (without param)',
                     };

   		DocuSkyObj.getQueryResultDocuments(param, e, function() {
   			getDocuSkyPages(e);
   		});
   		return;
   	});
      
      init();
   }
   
   function init() {
      // 預設值
      // 注意：只有 Udef_Align_ 標籤可產生 extra connections (Feature Hierarchy)
      //       若標籤值為 <category>/<value>，不為 NULL 的 <category> （例如 OBJECT_MAIN, OBJ_PART）
      //       會形成額外的 feature node，而 <value> 則為該 feature node 用來計算 dup 的值
      
      // 2026-05-11: 只有 Udef_Align_Object 允許 Tag, Type, Id, Text 等四種 DupMethod options
      GlobalVar.tagsWithAllDupOptions = [ 'Udef_Align_Object',
                                          //'Udef_Img_EntityClass',
                                        ];
      
      // Tag
      GlobalVar.tagsComputeDupWithTagOnly = [ 'Udef_Evt_LOCATION',             // 因預設就是 tag only，可以略去這部分設定
                                              'Udef_Evt_COST',
                                              'Udef_Evt_BENEFICIARY',
                                              'Udef_Evt_INITIATOR',
                                              'Udef_Evt_SPONSOR',
                                              'Udef_Evt_EVENT_CAUSE',          // e.g., 'env_water/silted_river/淤河' => tagsComputeDupWithPrefix?
                                              'Udef_Evt_OBJ_PART_QUANT',
                                              'Udef_Evt_OBJ_PART_LENGTH',
                                              'Udef_Evt_MATERIAL',
                                              'Udef_Evt_FUNDING_ORIGIN',       // 待確認
                                              'Udef_Evt_OBJECT_ALT_NAME',
                                              'Udef_Evt_OBJECT_LENGTH',
                                              'Udef_Evt_OBJECT_WIDTH',
                                              'Udef_Evt_OBJECT_HEIGHT',
                                              'Udef_Evt_OBJECT_DEPTH',
                                              'Udef_Evt_OBJECT_MEANING',
                                              'Udef_Evt_OBJECT_DEITY',
                                              'Udef_Evt_LABOR',
                                              'Udef_Evt_PLACE_LINKED',         // 需範例
                                            ];

      // Type
      GlobalVar.tagsComputeDupWithPrefix = [ 'Udef_DocMeta_AdYear',            // 2025-05-26
                                             'Udef_DocMeta_Author',            // 2025-05-26
                                             'Udef_DocMeta_Place',             // 2025-05-26
                                             'Udef_DocMeta_Title',             // 2025-05-26
                                             'Udef_Genre_Subfolder',           // IMMARKUS 的 subfolder，對應到 COMMARKUS 的 EVENT_SOURCE_TEXT
                                             'Udef_Evt_EVENT',                 // e.g., 'EXPANSION/build/置'
                                             'Udef_Evt_TIME',                  // e.g., 'BEGIN/1556-03/丙辰之二月'
                                             'Udef_Evt_OBJECT_MAIN',           // e.g., '>wall/yangzhou_cheng/揚州府城' -- 注意：這個標籤得特別處理，因它還有「複製版」的 'Udef_Align_OBJECT' （繪製節點時應該永遠不顯示 Udef_Evt_OBJECT_MAIN？）
                                             'Udef_Evt_OBJ_PART',              // e.g., 'obj_part/outer_wall/外城'                                                  // 'Udef_Unification_*'           // todo...?
                                             'Udef_properties_pattern',        // 待確認
                                             'Udef_Evt_EVENT_SOURCE_TEXT',     // 2025-11-18: 其值沒有階層，因此 prefix, infix, suffix 都應相同 -- 據 Dawn 所說，這是特別項，不能視為 feature，而要視為「與 image folder 類似」的存在
                                             'Udef_Img_EntityClass',           // 2026-04-21: e.g., 'jian'an_cheng/Image'
                                             'Udef_Img_EntityRelation',        // 2026-07-??
                                           ];
      
      // Id
      GlobalVar.tagsComputeDupWithInfix = [ //'Udef_Evt_OBJ_PART_LINKED',      // 沒有這個標籤
                                          ];

      // Text
      GlobalVar.tagsComputeDupWithSuffix = [                                   // dupMethod 會顯示為 'Value' 
                                             'Udef_Align_OBJECT',              // e.g., 'OBJ_PART/city_wall_outer_wall' -- COMARKUS 的 'obj_part/city_wall_gate' 需可對應到 IMMARKUS 的 'city_wall_gate'
                                           ];
      
      // Type/Id
      GlobalVar.tagsComputeDupWithTop2Layers = [ 
                                               ];
                                               
      // 2025-06-22: 視為 Source Structure 的標籤 -- feature node 與 event/image node 之間用虛線 (dashed) 相連
      //             另一個以虛線和 E/I nodes 連接的 "Feature Hierarchy" 是產自 Udef_Align_ 標籤（目前或許只有從 Udef_Align_Object 提取 top layer OBJECT_MAIN, OBJ_PART），不需在此設定...
      //             Event: Udef_Evt_EVENT_SOURCE_TEXT
      //             Image: Udef_Genre_Subfolder
      GlobalVar.tagsForFileStructure = ['Udef_Evt_EVENT_SOURCE_TEXT', 'Udef_Genre_Subfolder'];
                     
      // default for DHQ paper
      //GlobalVar.defaultCommonNodeTagsChecked = [ 'Udef_Align_OBJECT',             // special tag
      //                                           'Udef_Evt_EVENT_SOURCE_TEXT',    // special tag，代表 COMARKUS 的 file structure，注意它應該算是「例外」節點（日後可能得歸屬在 'X'？），和 event node 之間以虛線連結
	   //                                           //'Udef_Evt_OBJECT_MAIN',        // 與 'Udef_Align_OBJECT' 重點重覆（但 wall 會被轉成 city_wall），不需額外顯示
      //                                           //'Udef_Evt_OBJ_PART',           // 對 obj_part 另行產生 <Udef_Align_OBJECT_MAIN>
      //                                           'Udef_Evt_EVENT',                // 會顯示 event type (e.g., CONSTRUCTION, EXPANSION, etc.)
      //                                           'Udef_Evt_EVENT_CAUSE', 
      //                                           'Udef_Evt_BENEFICIARY',
      //                                           'Udef_Evt_INITIATOR',
      //                                           'Udef_Evt_SPONSOR',
      //                                           'Udef_Evt_LOCATION',
      //                                           //'Udef_Evt_MATERIAL',
      //                                           //'Udef_Evt_FUNDING_ORIGIN',
      //                                           'Udef_Evt_TIME',
      //                                           'Udef_Evt_COST',
      //                                           //'Udef_Evt_LABOR',
      //                                           'Udef_Genre_Subfolder',          // 2025-06-22: 它也是個「例外」節點，代表 IMMARKUS 的 file structure (folder hierarchy)
      //                                         ];

      GlobalVar.defaultCommonNodeTagsChecked = [ 'Udef_Align_OBJECT',             // special tag
                                                 'Udef_Evt_EVENT_SOURCE_TEXT',    // special tag，代表 COMARKUS 的 file structure，注意它應該算是「例外」節點（日後可能得歸屬在 'X'？），和 event node 之間以虛線連結
	                                              //'Udef_Evt_OBJECT_MAIN',        // 與 'Udef_Align_OBJECT' 重點重覆（但 wall 會被轉成 city_wall），不需額外顯示
                                                 //'Udef_Evt_OBJ_PART',           // 對 obj_part 另行產生 <Udef_Align_OBJECT_MAIN>
                                                 'Udef_Evt_EVENT',                // 會顯示 event type (e.g., CONSTRUCTION, EXPANSION, etc.)
                                                 //'Udef_Evt_EVENT_CAUSE', 
                                                 //'Udef_Evt_BENEFICIARY',
                                                 //'Udef_Evt_INITIATOR',
                                                 //'Udef_Evt_SPONSOR',
                                                 //'Udef_Evt_LOCATION',
                                                 //'Udef_Evt_MATERIAL',
                                                 //'Udef_Evt_FUNDING_ORIGIN',
                                                 //'Udef_Evt_TIME',
                                                 //'Udef_Evt_COST',
                                                 //'Udef_Evt_LABOR',
                                                 'Udef_Genre_Subfolder',          // 2025-06-22: 它也是個「例外」節點，代表 IMMARKUS 的 file structure (folder hierarchy)
                                               ];
      //GlobalVar.nodeTypeShapeMap = { 'E': 'circle',
      //                               'C': 'triangle',
      //                               'M': 'square',
      //                               'B': 'circle',
      //                             };
                                     
      GlobalVar.nodeTypeShapeMap = { 'E': 'square',          // 2025-06-23
                                     'C': 'circle',          // 2025-06-23
                                     'M': 'square',          // 2025-06-23
                                     'B': 'circle',
                                   };
                                     
      GlobalVar.nodeTypeLabelClassMap = { 'E': 'nodeLabelColor00',
                                          'C': 'nodeLabelColor00',
                                          'M': 'nodeLabelColor00',
                                          'B': 'nodeLabelColor00',
                                        };
             
      GlobalVar.defaultGenericStyleMap = { nodeColorIdx: '00',
                                           nodeLabelColorClass: 'nodeLabelColor00',
                                           nodeShape: 'circle',
                                           pathColor: GRAPH_COLORS.defaultPathColor,     // 2025-08-01: 預設的 path 顏色
                                         };

      // 被視為「時間」的標籤（COMARKUS 'Udef_Evt_TIME'，IMMARKUS 的幾個時間相關標籤）
      GlobalVar.comarkusEventTimeTags = [ 'Udef_Evt_TIME' ];
      GlobalVar.immarkusImageTimeTags = { 'Udef_DocMeta_AdYear': 'BEGIN', 
                                          'Udef_properties_date.start': 'BEGIN',
                                          'Udef_properties_date.end': 'END',
                                        };
      
      // 2025-06-24: 可透過以下設定「強迫」使用某些 style 設定... （可能需除錯）
      //GlobalVar.commonGenreStyleMap['Feature'] = { nodeColorIdx: '02',
      //                                             nodeLabelColorClass: 'nodeLabelColor06',  
      //                                             nodeShape: 'square',
      //                                             pathColor: '#b7b7b7',
      //                                           };
                                         
      // 2024-12-04
      GlobalVar.nodeTypeLabelPosMap = { 'E': 'top',                 // 'top' or 'bottom'
                                        'C': 'top',
                                        'M': 'bottom',
                                        'B': 'top',
                                      };

      GlobalVar.labelOffset = { 'top': [-5, -15],                   // default [x,y] offset
                                'bottom': [-15, 24],
                              }
                                   
      // 2024-11-04: 載入時，所有功能按鈕都是隱藏，必須在此將可用的功能按鈕顯示出來
      if (UseLeftSidebar) {
         GlobalVar.leftSidebarWidth = 50;
         let selector = "#graphArea div.container, #divControlPanelContainer, #divNodeContentContainer, #graphControlPanelIcon";
         let cssObj = { left: GlobalVar.leftSidebarWidth+"px" };
         $(selector).css(cssObj);
         $("#divLeftSidebar").show();
      }
      else {
         GlobalVar.leftSidebarWidth = 0
         //$("#butResetPage").show();
         $("#butLoadDocuXmlFile, #butShowGraphControlPanel, #butExportSvgFile").show();
      }
      
      //// 2025-06-06
      //if (GlobalVar.enableFilterTrees) {
      //   $("#divElementTagTypeValue").hide();
      //   $("#elementTagValTreeJs").show();
      //}
      
      
      // 2025-07-16: 計算「反向」結果 -- 可查詢該標籤被用來計算 dup 的方式
      //             目前沒有實際用途，就或可放在 feature display subpanel 提醒這標籤是如何被使用
      //             注意：未加入設定的 Udef_properties_* 等標籤，都套用「預設」的 TagOnly 模式
      //             <Tag>:<Type>/<Norm>/<Value>
      // 2025-09-27: 更名為 <Tag>:<Type>/<Id>/<Text>
      //             e.g., *EVENT:EXPANSION/build/置, *INITIATOR:officialTitle/prefect/郡守
      //                   *LOCATION:hvd_40201/福安, *MATERIAL:boat/舟
      //                   #Place_covered:揚州, Udef_Align_OBJECT:OBJECT_MAIN/city_wall
      //             如果 x/y/z 只有 u/v（通常表示缺少 Type），Type 和 Norm 都對應到 u，Value 對應到 v，Type/Norm 實際上會被視為 Norm/Value 而對應到 u/v
      //             如果 x/y/z 只有 u，Type, Norm, Value, Type/Norm 都會對應到 u
      // 2025-11-26: 注意必須包含 'tagsComputeDupWithSuffix' -- 因 Udef_Align_OBJECT 預設是採用此項
      GlobalVar.dupMethodLabel = { 'tagsComputeDupWithTagOnly': 'Tag',
                                   'tagsComputeDupWithPrefix': 'Type',             // 假設標籤值是 <type>/<norm>/<value> 形式
                                   'tagsComputeDupWithInfix': 'Id',                // 2025-11-17: 會議後移除
                                   'tagsComputeDupWithSuffix': 'Text',             // 2025-11-17: 會議後移除
                                   //'tagsComputeDupWithTop2Layers': 'Type/Id',    // 2025-11-17: 會議後移除
                                 };
                                 
      GlobalVar.limitedDupMethodLabel = { 'tagsComputeDupWithTagOnly': 'Tag',      // 2025-11-26
                                          'tagsComputeDupWithPrefix': 'Type', 
                                        };
      
      GlobalVar.specialDupMethodLabel = { 'tagsComputeDupWithTagOnly': 'Tag',      // 2026-04-21: Udef_Align_<obj>_ID 使用的 menu 選單
                                          'tagsComputeDupWithInfix': 'Id', 
                                        };
      
      // 2025-08-01
      GlobalVar.tagLinkColorList = { 'default': GRAPH_COLORS.defaultPathColor,
                                     'red': 'red',
                                     'blue': 'blue',
                                     'blue1': '#234567',
                                     'green': 'green',
                                     'orange': 'orange',
                                     'purple': 'purple',
                                   };
                                 
      // 注意：這裡只設定預設標籤的狀態，許多未定義於此的標籤，需在後續過程採用
      //       預設的 { dup:'tagsComputeDupWithTagOnly', pathColor:'#b7b7b7' }
      GlobalVar.tagDupLookup = {};
      Object.keys(GlobalVar.dupMethodLabel).forEach(function(dupMethod) {
         //alert(dupMethod + "\n" + JSON.stringify(GlobalVar[dupMethod]));
         GlobalVar[dupMethod].forEach(function(v) {                                   // 需定義有 GlobalVar.tagsComputeDupWithTagOnly, GlobalVar.tagsComputeDupWithPrefix 等陣列，才能直接用 GlobalVar[dupMethod]
            GlobalVar.tagDupLookup[v] = { dup: dupMethod,                             // 2025-07-24: 改為 object -- 為後續提供彈性
                                          pathColor: GRAPH_COLORS.defaultPathColor,   // 後續可透過 v 查到此標籤的 pathColor（連到此節點的連線顏色）
                                        };     
         });
      });
      //alert(JSON.stringify(GlobalVar.tagDupLookup));
      
      // 2025-07-22: 將預設值所設定好的 tagDupLookup 拷貝到 tagDupLookupDefault
      GlobalVar.tagDupLookupDefault = JSON.parse(JSON.stringify(GlobalVar.tagDupLookup));
      
      // 2025-08-01
      if (!GlobalVar.filterInitiated) {
         for (let i=2; i<=GlobalVar.maxFilters; i++) {
            let jqCopy = $("#eventFilters tr[targetKey='filter_1']").clone();    // 應該有兩個 <tr>
            let filterKey = 'filter_' + i;
            jqCopy.attr("targetKey", filterKey);
            jqCopy.find("span.filterLabel").text('#' + i);
            jqCopy.find("select.eventFilterNodeType, textarea.eventFilterByEventTerms")
                  .attr("targetKey", filterKey);
            $("#eventFilters").append(jqCopy);
         }
         GlobalVar.filterInitiated = true;
         //butAddEventTermsFilter
      }
      
      // 2025-08-01: 由於動態產生多份 filters，"set" 按鈕必須動態設定
      $("button.butAddEventTermsFilter").off("click").on("click", function() {
         // 2025-06-29: 需透過 targetKey 屬性得知目前是在設定哪一個 filter，並取得 nodeType
         let nodeTypeLabel = { 'E': 'EVENT',
                               'M': 'IMAGE',
                               'B': 'BinRel',
                             };
         let jqTr = $(this).closest("tr");
         let nodeType = jqTr.find("select.eventFilterNodeType").val();
         let targetKey = jqTr.find("select.eventFilterNodeType").attr("targetKey");    // e.g., filter_1, filter_2 -- 後續需藉由 targetKey 填入對應的 textarea
         $("#overlayEventFilterEntityTerms").attr("targetKey", targetKey);             // 設定目前打開 overlay 是在處理哪個 targetKey (e.g., filter_1)
         $("#filterNodeType").attr("nodeType",nodeType)                                // 設定 overlay 的一些基本項目
                             .text(nodeTypeLabel[nodeType]);
                    
         // 取得目前按下設定鈕旁 textarea 的 filter 字串 
         // (TODO: 後續可利用來設定 filters 勾選項目？）
         //let filterStr = $("textarea.eventFilterByEventTerms[targetKey='" + targetKey + "']").val();    // e.g., E:Udef_Evt_BENEFICIARY:buddhist_monk
         //alert(filterStr);
                             
         // 顯示當前 nodeType 下的 tag list，並移除所有勾選
         $("div.divEntityTagList table.tableEntityTagList").hide();
         $(`div.divEntityTagList table.tableEntityTagList[key="${nodeType}"]`).show();
         $("div.divEntityTagList input[type='checkbox']").prop("checked", false);
         
         // 清空 div.divTagValueList
         $("div.divTagValueList").html('');
         
         // 清空 input.filterTags 與 input.filterEntityTerms
         $("input.filterTags, input.filterEntityTerms").val('');
                             
         $("#overlayEventFilterEntityTerms").show();
         
         $("div.subFilter").slice(0,-1).remove();      // 2025-09-29: 保留最後一項，其他 div.subFilter 都移除（因 add button 留在最後一項）
         $("div.subFilter select.subFilterOperation").remove();

         //$("div.subFilter").remove();
         //addSubFilter();
      });
      
      // 2025-09-27
      $("div.subFilter button.addSubFilter").off("click").on("click", function(evt) {
         addSubFilter();
      });
      
      // 2025-06-10: 移除 d3 繪製的內容
      d3.select("svg").selectAll("*").remove();
      $("#svgOverlay").hide();
      
      resetDataVars();
      resetControlPanel();
      
      resizingControlPanelContainer();
   }
   
   function resizingControlPanelContainer() {
      // 剛載入時，window innerWidth 會是 0？可能還不會擴到全視窗？先等個 200ms 好了...
      // 2025-02-09: 不確定是什麼原因，有時會拿不到 window.innerWidth（是否跟 VM 有關：瀏覽器無法透過 url 存取到 VM 的該工具？）...
      //
      window.setTimeout(function() {
         // 2024-11-20: 將 graph control panel 改放在右方
         // 2025-02-21: iframe 視窗載入後，好像需要一段時間才能取得 window.innerWidth, window.innerHeight？（否則都會是 0）
         //             然後，因為同源問題，在 file: 協定下並無法透過 top.innerWidth 取得 parent 的寬度 (Permission denied to access property "innerWidth" on cross-origin object)
         //if (location.protocol === 'file:') GlobalVar.controlPanelOnRightHandSide = false;
         if (window.innerWidth == 0) {
            showProgressMsg("loading...");
            window.setTimeout(resizingControlPanelContainer, 1000);        // 注意，並沒有設定上限，若一直未取得會類似無窮迴圈
            return;
         }
         
         hideProgressMsg();
         
         let viewportWidth = window.innerWidth;
         let viewportHeight = window.innerHeight;

         let topBannerHeight = 50;
         let buttonDivHeight = 32;
         let controlPanelHeight = viewportHeight - topBannerHeight - buttonDivHeight - 16;         // div.graphControlPanel 的高度（top 已經設為 topBannerHeight）

         // 設定 control 放在左邊或右邊
         if (GlobalVar.controlPanelOnRightHandSide) {
            let controlPanelWidth = 460;                              // CSS #divControlPanelContainer width 460px
            let posLeft = viewportWidth - controlPanelWidth - 30;
            $("#divControlPanelContainer, #divNodeContentContainer").css({left:posLeft+'px'});
            //alert(viewportWidth + '--' + posLeft + "\n" + top.innerWidth);
         }

         // 設定 control panel 最下方 apply settings 的按鈕位置 (position:absolute)
         $("div.graphControlPanel").css({height:controlPanelHeight+'px'});
         $("#divRedrawButton").css({top:(controlPanelHeight+16)+'px'});            // 相對於 graphControlPanel 的高度

         $("div.nodeContentArea").css({height:(controlPanelHeight+30)+'px'});      // 不需最下方的 REDRAW 按鈕

         // 2025-07-05
         $("div.subPanel").css({height:(controlPanelHeight-46)+'px'});
         
         // -------------------------------------------
         //    #divNodeFilteringAndDisplay sub-panel
         // -------------------------------------------
         let blockHeight = Math.max(200, controlPanelHeight - 80);                 // 至少保持 200px
         
         let heightForLastRows = 168 - (18 * $("#divFilterExtraInfo div.experimentFeatures").length);

         // 2025-03-02: 調整 filtering 最下方的 "compute filtered nodes" 按鈕位置
         // 注意：若是從 local 啟動，$(#divFilterExtraInfo).css() 會遇到 CORS 問題，瀏覽器不允許設定！
         let myTop = controlPanelHeight - heightForLastRows + 12;                              // 2025-07-31: (bug fix) 注意變數不能用全域 top，會導致下一步出現 CORS 錯誤
         $("#divFilterExtraInfo").css({top:myTop+'px'});
         
         //let filterExtraInfoHeight = $("#divFilterExtraInfo").outerHeight(true);   // 含 border, padding 等的高度
         //alert(filterExtraInfoHeight);    // 若尚未渲染，就會回傳 0...

         $("#filterEventsBlock").css({height:(blockHeight - heightForLastRows)+'px'});    // 下方保留 82px（2+1 rows）的空間

         // 2025-08-01
         //let timeFilterHeight = $("#divEventTimeFilter").outerHeight();    // 包含 margin, padding, content 的 height -- 但好像有問題...
         let timeFilterHeight = 145;
         $("#divEventFeatureFilters").css({height:(blockHeight - timeFilterHeight - heightForLastRows)+'px'});
         

         // -------------------------------------
         //    #divFeaturesToDisplay subpanel
         // -------------------------------------
         $("#filterCommonTagBlock").css({height:(blockHeight - 90)+'px'});       // 2025-07-07 調整
         $("#divCommonNodesToDisplay").css({height:(blockHeight - 102)+'px'});   // 2025-07-25 調整
         
         // -------------------------------------
         //      #divNodeLabeling subpanel
         // -------------------------------------
         $("#divNodeLabeling").css({height:(blockHeight+28)+'px'});              // 下方不需有選項或按鈕，加回 28px
         let myHeight = (blockHeight)+'px';                                      // 原先 -66 空出三行
         $("#divNodeLabelList").css({'height':myHeight});                        // 2025-06-28
         $("ul.sortableList").css({'height':myHeight});                          // 2025-08-20: 需等 ul 已經放入 #divNodeLabelList 才有效？
         
         // ---------------------------------------------------------------------
         // (TODO) 動態調整 fine-selection, labeling, styling, unification 高度
         // ...
      }, 250);
   }
   
   function showProgressMsg(msg) {
      if (msg) {
         $("#divLoadingContainer").css({top:'200px', left:'500px', 'font-size':'11'}).show();
         $("#divWorkingProgress").text(msg.substring(0,11));    // max 11 characters
      }
   }
   
   function hideProgressMsg() {
      $("#divLoadingContainer").hide();
   }
   
   function resetDataVars() {
      // 2025-01-15: reset table/tabulator data
      GlobalVar.loadedDocuXmlFilenames = [];   // 2025-06-08
      GlobalVar.docFilenameJqDoc = {};         // 2025-06-30: 必須重設，否則無效
      GlobalVar.filenamesLoadedHash = {};      // 2025-06-25: 注意，需一併清除此變數
      GlobalVar.tableData = [];
      GlobalVar.table = null;                  // 2025-01-12: tabulator 物件的參考
      GlobalVar.tableIdEntry = 1;              // 2025-01-12
      GlobalVar.totalDocs = 0;                 // 2025-01-12
      GlobalVar.eventEntry = 1;                // 2025-01-12
      GlobalVar.treeJsObj = {};                // 2025-06-06
      GlobalVar.graphNodeDict = {};            // 2025-06-30
      GlobalVar.myEventElementTags = {};       // 2025-06-30
      GlobalVar.imageContainerViewBox = {};    // 2025-09-24
      
      GlobalVar.temp.pinnedNodePosition = {};  // 2025-11-05
      GlobalVar.temp.flaggedNodeList = [];     // 2025-11-05: 必須在 resetDataVars() 重設此變數
   }
   
   function getDocuSkyPages(evt) {
   	let maxpage = Math.ceil(DocuSkyObj.totalFound/DocuSkyObj.pageSize);
      //alert(maxpage);
      GlobalVar.totalDocs += DocuSkyObj.docList.length;

      //alert(JSON.stringify(DocuSkyObj.postClassification));
      //alert(JSON.stringify(DocuSkyObj.tagAnalysis));
      //alert(JSON.stringify(DocuSkyObj.features));
      //alert(JSON.stringify(DocuSkyObj.spotlights));                 // +COMP,文件出處,#DESC,26,1;+ADY,第一起事件年份,ASC,39,2;+AU,事件作者,#DESC,47,3;+CLASS,事件地點,#DESC,27,4;+SRC,SRC,#DESC,128,999
      //alert(JSON.stringify(DocuSkyObj.featureAnalysisSettings));    // Place/-,Place/-;Place/Event,Place/Event;Udef_Event_Element/-,Udef_Event_Element/-
   	
      // 處理本頁的內容
      //alert("document count: " + DocuSkyObj.docList.length);
   	for (var i = 0; i < DocuSkyObj.docList.length; i++) {
   		let docInfo = DocuSkyObj.docList[i].docInfo;
   		let filename = $("<div/>").append(docInfo.docFilename).text()
   		let docTitle = $("<div/>").append(docInfo.docTitleXml).text();
   		let docuXml = docInfo.docContentXml;

         parseEventFromDocuSkySingleDocXml(docuXml, filename, docTitle);        // <Content>...</Content>
   	}
   	
   	if (DocuSkyObj.page !== maxpage && maxpage !== 0) {	// in case user choosing a empty corpus
         // if wants to compute (by docs) after each fetching result, use
         //for (let i = (DocuSkyObj.page - 1) * DocuSkyObj.pageSize; i < DocuSkyDocs.length; i++) ;
   		DocuSkyObj.getDbCorpusDocumentsGivenPageAndSize(DocuSkyObj.target, DocuSkyObj.db, DocuSkyObj.corpus, (DocuSkyObj.page + 1), DocuSkyObj.pageSize, evt, function(){getDocuSkyPages(evt);});
   	} 
      else {
         // 已取得最後一個 page
         // 2024-06-05: 更新為讀入的 db, corpus, query
         GlobalVar.pageParams = { target: DocuSkyObj.target,
                                  db: DocuSkyObj.db,       
                                  corpus: DocuSkyObj.corpus,
                                  query: DocuSkyObj.query };
         computeDuplicateAndPlotGraph();
      }
   	return;
   }
   
   function computeDuplicateAndPlotGraph() {
      // 2025-02-09
      if (GlobalVar.tableData.length == 0) {
         alert("Sorry, there is no event-related data for visualization");
         return;
      }

      // 2025-11-20: 載入 tabulator，以便後續 export table data to Exel
      drawTable();
      
      // 2024-08-08
      // if wants to compute after each fetching result, use
      // for (let i = (DocuSkyObj.page - 1) * DocuSkyObj.pageSize; i < DocuSkyDocs.length; i++) ;
      //alert("Total documents: " + GlobalVar.totalDocs + "\n" + "Total rows (event elements): " + GlobalVar.tableData.length);
      $("#tableInfoDocs").text(GlobalVar.totalDocs);
      $("#tableInfoRows").text(GlobalVar.tableData.length);

      // 注意：此程序會更改 GlobalVar.tableData => 將符合條件的 graphNode 改為 Common node  
      computeDuplicateAndUpdateDisplayGroup();     // EventRelLite-tabulator.js
      
      //// 2024-05-31: 載入後就直接繪製 table
      //$("#butTableView").click();

      showProgressMsg("converting...");
      window.setTimeout(function() {
         // 2025-06-20: 透過以下程序，將 table data 轉換到 GlobalVar.graphNodeDict (i.e., table2graphNodeDict)
         convertTableData2graphNodeDict(GlobalVar.tableData);     // cf. EventConnectionGraph-graph.js
         
         // 注意：需先設置控制板內容，後續才能透過操控 UI 介面來繪製圖形
         // 2025-06-05: 不能省去以下步驟，若省去則 control panel 的 event filtering select menu 會變成空白
         resetControlPanel();                                    // 注意：僅當剖析 DocuXml 後才會呼叫此 computeDuplicateAndPlotGraph() 函式並重設 control panel
         
         // 2025-06-21: 計算預設條件（需等一小段時間，讓 checkbox 被勾選）下的 nodes 數量
         showProgressMsg("computing...");
         window.setTimeout(function() {
            // 注意：在 $("button.butComputeFilteredNodes").click(); 中利用 setTimeout 停等 100ms 以進行計算中間加上停頓或繪圖
            //       但因為執行緒一有空檔就會執行後續的步驟，且 $("#butGraphView").click() 會需要用到 computeFilteredNodes 的結果
            //       因此用 setTimeout 需等比 butComputeFilteredNodes 100+50+100 ms 更長的時間 => 等 300ms 看看？
            $("button.butComputeFilteredNodes").click();
            window.setTimeout(function() {
               hideProgressMsg();       // 2025-11-28: 繪圖前，移除進度相關訊息

               let eventCount = parseInt($("span.checkedEventNodesCount").first().text());
               let commonCount = parseInt($("span.checkedCommonNodesCount").first().text());
               
               // 若依然停留在仍需計算的狀態（例如還沒算完），就不能進入直接繪圖
               if (eventCount + commonCount > GlobalVar.initTooManyNodes || GlobalVar.temp.onNeedComputeFilteredNodesState) {   
                  $("#butShowGraphControlPanel").click();
               }
               else {
                  // 2025-06-21: 需顯示的節點數不算多，直接繪圖
                  $("#butGraphView").click();             // 呼叫 applyPanelToTableDataAndDrawGraph() 繪圖
               }
            }, 300);      // 注意，這裡的 300ms 需比 computeFilteredNodes() 的 100ms 大
         }, 150);
      }, 50);
   }

   // parsing DocuXml
   function parseDocuXmlFile(docuXml) {
      // 2025-01-15: 若 d3 動畫還在執行，parseDocuXmlFile() 執行後，設定 tabulator 並執行繪圖時會出現錯誤！
      $("#butStopSimulation").click();                            // 利用 event trigger 停止動動畫模擬

      if (GlobalVar.resetDataVarsOnParsingDocuXml) init();        // 會重設變數，以及 control panel

      // 2024-12-24: 隱藏一開始的簡單使用說明
      //$("#startInstructions").hide();
      showProgressMsg("parsing...");
         
      // 2025-02-27: 由於前置作業 $("#butStopSimulation").click(), init() 都會牽涉到 UI 非同步執行，因此稍等一小陣子再進行剖析
      window.setTimeout(function() {
         // 2024-08-08: xml 是 local disk 載入的 DocuXml
         let xmlDoc = $.parseXML(docuXml);
         let jqXml = $(xmlDoc);
         GlobalVar.jqXml = jqXml;        // 2025-11-22: 儲存以備後續 export XML 使用
         
         // 2025-01-09: 發現 "20250105-comarkus-四川bridges.xml" 有重覆檔名 "GuangXu_CengXiuGuanXianZhi_JuanShiSan_YiWenZhi_CaoBaiShaMinJiaoJi.txt" 的文件！
         //             為了防呆，在此先將所有 filename 提出來，然後僅留下較後方的文件參考（覆蓋前面的）
         //GlobalVar.docFilenameJqDoc = {};                   // 2025-05-20: 改成 global variable
         jqXml.find("documents > document").each(function() {
            let jqDoc = $(this);
            let filename = jqDoc.attr("filename");
            GlobalVar.docFilenameJqDoc[filename] = jqDoc;
         });
         
         Object.keys(GlobalVar.docFilenameJqDoc).sort().forEach(function(filename) {
            // 2025-06-13: 重覆的檔名，必須跳過（否則會增加冗餘的 tableRows，造成後續困擾）
            if (GlobalVar.filenamesLoadedHash[filename]) return;
            else GlobalVar.filenamesLoadedHash[filename] = 1;
            
            let jqDoc = GlobalVar.docFilenameJqDoc[filename];
            let docTitle = jqDoc.find("title").text() || '-';
            let jqDocContent = jqDoc.find("doc_content");
            
            // 除了 filename, docTitle，加上 document metadata 或 <xml_metadata> 的 metadata (META_XXX) 數據...
            let xmlMetadata = {};
            jqDoc.find("xml_metadata > *").each(function() {
               // Comarkus2D: piece_title, piece_author, piece_time, place_covered, source_title, source_author, publication_place, publication_time, etc.
               // Immarkus2D: META_Source_title_ch_, META_Source_title_py_, META_Source_author_, ..., etc.
               let tagName = $(this).prop("tagName");
               let tagContent = $(this).text();                         // $(this).html();
               xmlMetadata[tagName] = tagContent;
            });
            //alert(JSON.stringify(xmlMetadata));
            
            if (GlobalVar.useDocuXmlMetadataInsteadOfXmlMetadata || Object.keys(xmlMetadata).length == 0) {
               xmlMetadata = {};                   // 先清空（若有 <xml_metadata> 則將其捨棄）
               // 嘗試加上 <title>, <author> 與 <time_dynasty> 等 document metadaa
               jqDoc.find("title").each(function() {
                  xmlMetadata["Udef_DocMeta_Title"] = $(this).text();                  // 注意：轉入 tabulator 會變成全大寫：DOCMETA_TITLE
               });
               jqDoc.find("author").each(function() {
                  xmlMetadata["Udef_DocMeta_Author"] = $(this).text();
               });
               jqDoc.find("time_dynasty").each(function() {
                  xmlMetadata["Udef_DocMeta_Dynasty"] = $(this).text();
               });
               jqDoc.find("year_for_grouping,date_ad_year").each(function() {     // 2025-01-25
                  xmlMetadata["Udef_DocMeta_AdYear"] = $(this).text();
               });
               jqDoc.find("book_code").each(function() {                          // 2025-01-25
                  xmlMetadata["Udef_DocMeta_BookCode"] = $(this).text();
               });
               jqDoc.find("geo_level1").each(function() {                         // 2025-06-06
                  xmlMetadata["Udef_DocMeta_Place"] = $(this).text();
               });
            }
         
            let docMetadata = { filename, 
                                docTitle,
                                xmlMetadata
                              };
            //alert(JSON.stringify(docMetadata));
            
            parseDocEventsFromJqDocContent(jqDocContent, docMetadata);
         });
         
         // 從 local disk 載入，就沒有 server URL 的資訊...
         GlobalVar.pageParams = { target: '-',
                                  db: '-',
                                  corpus: '-',
                                  query: '-' };
                                  
         showProgressMsg("computing...");
         window.setTimeout(computeDuplicateAndPlotGraph, 150);
      }, 150);
   }
   
   function parseTagUnificationMapFile(s) {
      // 2024-10-16: 讀入 tag unification map file，重設 GlobalVar.tagUnificationMap
      //             設定 #tagUnificationMappingTable (all checked)，並將 mapping 設定到全域變數
      // 格式: <origTag>:<origContent> => newTag:newContent
      //       比對 tableData 的 row['origTagName'] + ':' + row['origContent']，將 tagName, content 設為新值
      // # comment
      // Udef_Evt_LOCATION:placeName/咸陽 => Udef_Unification_Location:咸陽
      // Udef_properties_location:咸陽 => Udef_Unification_Location:咸陽
      if (s.charCodeAt(0) === 0xFEFF) s = s.substr(1);                   // remove utf-8 BOM
      let lines = s.split("\n").map(v => v.replace(/\s/g,'').trim());    // 或許不需最後的 trim()？
      
      GlobalVar.tagUnificationMap = {};                         // reset
      let htmlRows = [];
      lines.forEach(function(line) {
         if (line.length == 0 || line.substr(0,1) == '#') return;        // empty or comment line
         let [key, val] = line.split("=>");
         key = key.trim();                   // 注意，還是需要加上 trim()
         val = val.trim();                   // 注意，還是需要加上 trim()

         // 2025-07-05
         let [sourceTag, sourceContent] = key.split(':');
         let [targetTag, targetContent] = val.split(':');
         if (!sourceContent || !targetContent) {
            console.log("Invalid unification rule:\n key=" + key + "\n val=" + val);
            return;                          // 跳過 invalid rule
         }

         let row = "<tr class='tagUnifItem'>"
                 + "<td class='tagUnifItem'><input name='tagUnifItem' type='checkbox' checked='checked'></input></td>"
                 + "<td class='tagUnifItem' key='key'>" + key + "</td>"
                 + "<td class='tagUnifItem' key='val'>" + val + "</td>"
                 + "</tr>";
         htmlRows.push(row);
         
         // 注意，若有多組 unification rules 牽涉到相同的 sourceTag，後面的會覆蓋前面的
         GlobalVar.tagUnificationMap[sourceTag] = { sourceContent, targetTag, targetContent };
      });
      $("#tagUnificationMappingTable").empty().append(htmlRows.join("\n"));
      
      //alert(JSON.stringify(GlobalVar.tagUnificationMap));
   }
   
   function parseEventFromDocuSkySingleDocXml(docuXml, filename, docTitle) {
      // 2024-05-05: 處理單篇文件 DocuXml，filename 為這篇文件的檔名
      let xmlDoc = $.parseXML(docuXml);
      let jqDocContent = $(xmlDoc);         // 注意：從 DocuSky 取得的是 <Content>...</Content> 而非 <doc_content>...</doc_content>

      // 2024-01-04
      let xmlMetadata = {};
      jqDocContent.find("xml_metadata > *").each(function() {
         // Comarkus2D: piece_title, piece_author, piece_time, place_covered, source_title, source_author, publication_place, publication_time, etc.
         // Immarkus2D: META_Source_title_ch_, META_Source_title_py_, META_Source_author_, ..., etc.
         let tagName = $(this).prop("tagName");
         let tagContent = $(this).text();                                // $(this).html();
         xmlMetadata[tagName] = tagContent;
      });
      
      if (Object.keys(xmlMetadata).length == 0) {
         // 2024-01-07: 沒有 <xml_metadata>，嘗試加上 <title>, <author> 與 <time_dynasty>
         // => Udef_DocMeta_Title, Udef_DocMeta_Author, etc. ?
         jqContent.find("title").each(function() {
            xmlMetadata["Udef_DocMeta_Title"] = $(this).text();
         });
         jqContent.find("author").each(function() {
            xmlMetadata["Udef_DocMeta_Author"] = $(this).text();
         });
         jqContent.find("time_dynasty").each(function() {
            xmlMetadata["Udef_DocMeta_Dynasty"] = $(this).text();
         });
      }

      let docMetadata = { filename, docTitle, xmlMetadata };             // 2025-01-31
      
      parseDocEventsFromJqDocContent(jqDocContent, docMetadata);
   }
   
   function parseDocEventsFromJqDocContent(jqDocContent, docMetadata) {     // 2025-01-04: 將 filename, docTitle 放入 docMetadata
      //console.log(jqDocContent.prop("outerHTML"));
      // 2024-08-08: 從 parseEventFromDocuSkySingleDocXml() 獨立出來，方便 parseDocuXmlFile() 處理 local DocuXml
      // 2025-01-05: 將 parseComarkusEvent2TableRow(), parseImmarkusEvent2TableRow(), parseBinRelEvents2TableRow() 獨立出來
      
      // COMARKUS
      jqDocContent.find("Events > Event[ComarkusId]").each(function(eventIdx) {
         parseComarkusEvent2TableRow($(this), docMetadata, eventIdx);         // 2025-01-05
      });
      
      // IMMARKUS
      jqDocContent.find("Events > Event[Type='immarkusMarkup']").each(function(eventIdx) {
         parseImmarkusEvent2TableRow($(this), docMetadata, eventIdx);         // 2025-01-05
      });
      
      // 2024-08-13: BinRel
      jqDocContent.find("Events").each(function(eventsIdx) {
         parseBinRelEvents2TableRow($(this), docMetadata, eventsIdx);         // 2025-01-05: 注意在 BinRel 是 events 而不是 event
      });

      //alert(GlobalVar.tableData.length);
      //console.log("EventParsing: " + GlobalVar.tableData.length);

   }  // parseDocEventsFromJqDocContent()

   function parseComarkusEvent2TableRow(jqEvent, docMetadata, eventIdx) {
      // 目前似乎不需用到 eventIdx 參數...
      let eNum = 'E' + (GlobalVar.eventEntry++).toString().padStart(3,0);
      let comarkusId = jqEvent.attr("ComarkusId");    // comarkusId 可以視為事件的 id （每個事件一個 comarkusId）
      let immarkusId = '';                            // COMMARKUS 項目的 immarkusId 值為空

      // TODO: 加上 docMetadata.docTitle?
      
      let extraRows = [];
      // 2024-07-23: 額外加上一個 row，填入 "unique" eNum 訊息（確保必然有一個 row 的 graphNode 為 eNum 值）
      //             注意：Udef_EventRelLite 名稱會在 EventRelLite-tabulator.js 用到，兩邊需同步
      let s = '<ComarkusBundle Type="系統編碼">'
            + '<Udef_EventRelLite RefId="' + eNum + '" MarkusId="-">'
            + eNum 
            + '</Udef_EventRelLite>'
            + '</ComarkusBundle>';
      extraRows.push(s);
      
      // 2024-01-05: 利用類似 extraRow 的方式，將 docMetadata 裡 xmlMetadata 的 tags 轉換成 rows
      if (GlobalVar.addDocMeta2RowsInParsingDocuXml) {
         let metadataTags = Object.keys(docMetadata.xmlMetadata);
         metadataTags.forEach(function(tag) {                  
            let tagContent = docMetadata.xmlMetadata[tag];
            let s = `<ComarkusBundle Type="${tag}">`
                  + `<${tag} RefId="${tag}" MarkusId="-">`     // 2025-06-15: <xml_metadata> 的 tags 已經都改以 Udef_DocMeta_ 開頭，因此這裡不需再加入 prefix
                  + tagContent
                  + `</${tag}>`
                  + '</ComarkusBundle>';
            extraRows.push(s);
         });
      }

      jqEvent.prepend(extraRows.join('\n'));
      
      // -------------------------------------------------------------
      // <ComarkusBundle Type="OBJECT_MAIN">
      //    <Udef_Align_OBJECT>OBJECT_MAIN/city_wall</Udef_Align_OBJECT>
      //    <Udef_Align_city_wall_ID Term="haicheng_cheng">Event</Udef_Align_city_wall_ID>
      //    <Udef_Evt_OBJECT_MAIN MarkusId="b673094b-2ebd-4188-973b-330c9f448661" RefId="haicheng_cheng">wall/haicheng_cheng/海澄縣城</Udef_Evt_OBJECT_MAIN>
      // </ComarkusBundle>
      
      let graphNodeTableDataEntry = GlobalVar.tableData.length;            // 2025-05-10: '系統編碼' 在 tableData 的 entry -- 後續可藉此修改 GlobalVar.tableData[] 的 nodeColorIdx
      jqEvent.find("ComarkusBundle").each(function(comarkusBundleIdx) {    // 2025-10-03: 可能需要 bundleIdx 判別 OBJ_PART_LINKED 的歸屬（不同 bundleIdx 屬於不同區塊）
         let jqComarkusBundle = $(this);
         
         // 2024-07-26: 雖然 Comarkus 轉出的 @Type 似乎就已經是全大寫，但為了跟 Immarkus 轉出（全小寫）的結果比對，因此還是加上 toUpperCase() 以防呆
         let type = $(this).attr("Type").toUpperCase();            // TIME, OBJECT_LENGTH, MATERIAL, EVENT_CAUSE, ... （注意，TIME 的 BEGIN/END 是放在 <Udef_Evt_TIME RefId="1832-10">BEGIN/BEGIN/十二年閏九月</Udef_Evt_TIME>

         jqComarkusBundle.children().each(function() {             
            let tagName = $(this).prop("tagName");                 // 2024-07-22: Udef_Evt_TIME_BEGIN, Udef_Evt_OBJECT_LENGTH_NoType, Udef_Align_city_wall_ID, ...

            // 2025-06-08: 加上移除「冗餘」標籤（例如 span, Udef_properties 等 Immarkus2D 轉換時，擔心數據有錯誤或遺漏所加上的訊息）
            if (GlobalVar.tagNamesToRemove.includes(tagName)) return;
            
            let tempArr = tagName.split('_');                      
            let refId = $(this).attr("RefId") || '-';              // 2025-02-11: 加上 '-'               
            let markusId = $(this).attr("MarkusId") || '-';        // markusId 可以視為 event element 的 id
            let content = $(this).text() || '-';                   // 2024-07-26: 若為空字串，則補上 '-'
            let extra = '';
            let url = '';
            
            let graphNode = eNum;                                  // 預設就是 eNum 的值
            let graphNodeType = graphNode.substr(0,1);             // Comarkus 應該只會有 'E' node type?
            let graphNodeLabel = graphNode;                        // 2024-07-26: rename from 'eNumLabel' to 'graphNodeLabel' （事件的顯示名稱，預設為 eNum，需和 graphNode 同步）

            // 2024-07-22: 將 event 中的時間地點提取出來，放在該 event (eNum) 下所有的 row 中
            let eventTimeNotBefore = -9999;                        // 預設值
            let eventTimeNotAfter = 9999;                          // 預設值
            let eventLocation = '-';                               // 預設值
            
            // 2024-08-17: 若標籤多次出現（可能有 BEGIN/yyyy, END/yyyy），後者會覆蓋前者
            let comarkusEventTimeTags = GlobalVar.comarkusEventTimeTags;           // [ "Udef_Evt_TIME" ]
            if (comarkusEventTimeTags.includes(tagName)) {
               let [tnb, tna] = getEventTimeRange(refId, content);    // refId 應包含 dddd，content 應包含 'BEGIN/xxx' 之類
               eventTimeNotBefore = tnb;                              // integer
               eventTimeNotAfter = tna;                               // integer
            }
            
            // 2025-05-10: 設定 Comarkus 節點顏色與類型字串
            let nodeColorIdx = '00';                               // 應該是 '00' ~ '07' 得字串值
            let nodeLabelColorClass = 'nodeLabelColor00';          // 預設
            let nodeShape = 'triangle';                            // 預設（防呆用）
            
            if (type == 'EVENT') {                                 // 對於 <ComarkusBundle type="EVENT"> 需特別回溯處理
               let eventGenre = 'Event';

               // 2025-09-15
               if (GlobalVar.nodeGenreUseEventTypes) {           
                  let eventType = content.split('/')[0];           // CONSTRUCTION, DESTRUCTION, RENOVATION, etc.
                  eventGenre += '.' + type;                        // 'CONSTRUCTION' 最終產生 'Event.CONSTRUCTION', 'RENOVATION' 最終產生 'Event.RENOVATION', etc.
               }

               allocateEventGenreStyle(eventGenre);
               ({ nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor } = GlobalVar.eventGenreStyleMap[eventGenre]);
               
               nodeCaption = eventGenre;

               // 回溯更新先前的 '系統編碼' row -- 需同步更新 nodeColorIdx, nodeLegendCaption, nodeLabelColorClass
               // 2025-06-01: 若為 event row，docMetadata 應被視為 column 加入 event row (GlobalVar.tableData[graphNodeTableDataEntry].xmlMetadata) 中
               // Hilde 希望所有 events 通通用相同顏色的節點（不需在此用顏色區分 event types）
               // 注意： tableData 並沒有加上 nodeShape, pathColor
               GlobalVar.tableData[graphNodeTableDataEntry].nodeLegendCaption = eventGenre;           // 2025-06-17: 先前是用 eventGenre，可以用顏色區分多種事件
               GlobalVar.tableData[graphNodeTableDataEntry].nodeColorIdx = GlobalVar.eventGenreStyleMap[eventGenre].nodeColorIdx;
               GlobalVar.tableData[graphNodeTableDataEntry].nodeLabelColorClass = GlobalVar.eventGenreStyleMap[eventGenre].nodeLabelColorClass;
               GlobalVar.tableData[graphNodeTableDataEntry].xmlMetadataStr = getXmlMetadataStr(docMetadata.xmlMetadata);        // 2025-06-01
            }
            else if (tagName.startsWith('Udef_Align_') && tagName.endsWith('_ID')) {
               // 2026-04-21: Udef_Align_<obj>_ID 需特別處理（若有 @Term，則將 @Term 加到標籤內容前面）
               let term = $(this).attr("Term") || '-';
               content = term + "/" + content;
            }
            
            // 2026-01-22: debug -- 移除以下的 else （若 type == 'EVENT'，若 tagName 為 'Udef_Evt_EVENT'，仍須設定 nodeLegendCaption 為 feature）
            //else {
               // COMARKUS 不會產生 image nodes，因此非 event node 就必然是 connection node
               // 2025-05-23: 藉由 type (ComarkusBundle 的 @Type 值，例如 SPONSOR) 決定 C-node 顏色，填入 GlobalVar.commonGenreStyleMap[type]
               // 2025-06-16: 先前是用 type 作為 nodeLegendCaption，但現在改取 tagName（移除 Udef_xxx_）
               //             除了 'EVENT' 外，就是先加入 'Feature' 作為其他 graphNode (i.e., 'C' node) 的基本型態
               nodeLegendCaption = LegendCaption.feature;             // 2025-06-17 直接填入 'Feature' 字串, 2025-06-28 改成 LegendCaption.feature
               
               // 2025-09-15: 注意，這裡是在剖析 Comarkus DocuXml 時進行 nodeLegendCapation 設定，因此是直接用預設的 GlobalVar.tagsComputeDupWithTagOnly 而非動態的 GlobalVar.tagDupLookup...
               if (GlobalVar.nodeGenreUseConnTagName) {    
                  // 2025-09-20: 僅當 tagName 不屬於 GlobalVar.tagsComputeDupWithTagOnly，才將 tagName 加入 nodeLegendCaption
                  //             日後 "Compute Filtered Nodes" 重新計算時，或可依照 GlobalVar.tagDupLookup 動態設定 nodeLegendCaption
                  //if (GlobalVar.tagsComputeDupWithTagOnly.includes(tagName)) nodeLegendCaption += '.Generic';
                  //else nodeLegendCaption += '.' + type;                    // 'Feature.BENEFICIARY', 'Feature.TIME', etc. （最終會變成 Connection.Feature.BENEFICIARY，仍加上 Feature 是為了區分 Source Structure 特殊屬性）
                  nodeLegendCaption += '.' + type;                    // 'Feature.BENEFICIARY', 'Feature.TIME', etc. （最終會變成 Connection.Feature.BENEFICIARY，仍加上 Feature 是為了區分 Source Structure 特殊屬性）
               }
               
               // 2025-06-20: 若標籤屬於 file structure 列表，將其 nodeLegendCaption 設為 'Source Structure'
               // 2025-06-21: 注意，Dawn 說 'Udef_Evt_EVENT' 歸屬於一般 Feature，與 event 之間用實線相連
               if (GlobalVar.tagsForFileStructure.includes(tagName)) {     // COMARKUS 只有前者
                  nodeLegendCaption = LegendCaption.sourceStructure;       // 2025-06-28: 從 'Source Structure' 改
                  allocateCommonTypeColor(nodeLegendCaption);              // 2025-06-23
                  ({ nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor } = GlobalVar.commonGenreStyleMap[nodeLegendCaption]);
               }
               else {
                  allocateCommonTypeColor(nodeLegendCaption);              // 2025-06-23
                  ({ nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor } = GlobalVar.commonGenreStyleMap[nodeLegendCaption]);
               }
            //}
            
            let row = { id: GlobalVar.tableIdEntry++,
                        display: true,                            // 2024-05-10: 是否顯示此 row（預設是顯示）-- 可切換 true/false
                        eNum,                                     // Comarkus 對事件並沒有給出「名稱」，因此用 eNum 作為事件代號（字串）
                        eNumDisplay: true,                        // 2024-05-29: (TODO) 切換整組 eNum 的 display 為 true/false（通常包含多個 graphNode）
                        graphNode,                                // Enum （起始值等同於 eNum）
                        groupDisplay: true,                       // 2024-05-29: (TODO) 切換整組 graphNode 的 display 為 true/false（可能跨多個 eNum）
                        graphNodeLabel,                           // 2024-07-26: rename from 'eNumLabel' to 'graphNodeLabel' （事件的顯示名稱，預設為 eNum，需和 graphNode 同步）
                        labelDisplay: true,                       // 2024-07-24: 因 graphNode 會包含 event node
                        docFilename: docMetadata.filename,        // 2024-06-05: 文件檔名，連回 DB 時將會需要用到
                        docTitle: docMetadata.docTitle,           // 2025-09-28
                        xmlMetadataStr: '',                       // 2025-06-01: 若為 event row，後續會補上 xmlMetadataStr 內容
                        eventTimeNotBefore,                       // 2024-08-17
                        eventTimeNotAfter,                        // 2024-08-17
                        nodeLegendCaption,                        // 2025-05-11: 顯示在 legend 的字串（節點的類型，例如 event node 為 "CONSTRUCTION"，common node 為 "INITIATOR" 之類）
                        nodeColorIdx,                             // 2025-05-10
                        //nodeShape: 'circle',                      // 2025-06-18: 在 tableData 中沒有這個值，是後續才動態加上去...
                        eventLocation,                            
                        tagName,                                  // 2025-02-11: 依序 tagName, type, refId, content                        
                        type,           
                        comarkusBundleIdx,                        // 2025-10-03: 需要加上 comarkusBundleIdx 以區分哪些標籤屬於同一個區塊
                        refId,                                    
                        content,                                  
                        origTagName: tagName,                     // 2024-10-15: 保留原始的 tagName
                        origContent: content,                     // 2024-10-15: 保留原始的 content
                        dupCnt: 1,                                // 2024-05-13: duplicate count
                        comarkusId,
                        immarkusId,
                        markusId,
                        extra,                                    // 2024-06-27: 不顯示，存放 immarkus 的 svg selector
                        url,                                      // 2024-06-27: 先放著
                      };
            GlobalVar.tableData.push(row);
         });
      });
      
      // initial GlobalVar.tableData
      //console.log(GlobalVar.tableData);
   }
   
   function parseImmarkusEvent2TableRow(jqEvent, docMetadata, eventIdx) {
      // 參數 eventIdx 目前似乎不需用到...
      let eventCode = "M" + (GlobalVar.eventEntry++).toString().padStart(3,0);       // 'M' for image
      let eNum = eventCode;             // 若 convertImmarkusPieceToNode 為真，eNum 會加上 'P01' 之類後綴
      let comarkusId = '-';
      let immarkusId = '-';
      let type = '-';
      let imageType = 'Generic';        // 2025-06-10: 預設都是 'Generic'

      if (jqEvent.find("ImmarkusImage").length > 0) {                     // 2024-06-28
         let jqImmarkusImage = jqEvent.find("ImmarkusImage").first();     // 注意，目前只取第一張圖！
         let imageUrl = jqImmarkusImage.attr("Url");                      // 2025-06-18: 移除 LocalUrl 選項
         let imageThumbnail = jqImmarkusImage.attr("Thumbnail");
         GlobalVar.immarkusDict[docMetadata.filename] = { imageUrl, imageThumbnail};
         
         imageType = jqImmarkusImage.attr("Type") || 'Generic';          // 2025-06-10
      }
      
      let extraRows = [];
      // 2024-07-24: 類似 Comarkus 處理方式，先額外加上一個 row，填入 "unique" eNum 訊息，
      //             以確保必然有一個 row 的 graphNode 為 eNum 值
      // 2025-05-26: 加入 Type (2025-06-10 從固定 'Generic' 改 imageType)
      if (!GlobalVar.convertImmarkusPieceToNode) {        // 預設的模式
         let s = '<ImmarkusPiece Type="' + imageType + '" ImmarkusId="-" Key="系統編碼">'
               + '<div>'
               + '<Udef_EventRelLite>'
               + eNum 
               + '</Udef_EventRelLite>'
               + '</div>'
               + '</ImmarkusPiece>';
         extraRows.push(s);
      }
      
      // 2025-06-07: 利用類似 extraRow 的方式，將 docMetadata 裡 xmlMetadata 的 tags 轉換成 rows
      //             但 Immarkus 的狀況和 Comarkus 有些不同，必須將 ImmarkusPiece 的 @Key 設為
      //             "DocMeta" (table row refId := "系統編碼")
      if (GlobalVar.addDocMeta2RowsInParsingDocuXml) {
         let metadataTags = Object.keys(docMetadata.xmlMetadata);
         metadataTags.forEach(function(tag) {
            let tagContent = docMetadata.xmlMetadata[tag];
            let s = `<ImmarkusPiece ImmarkusId="-" Key="DocMeta">`
                  + '<div>'
                  + `<${tag}>`                                        // 2025-06-15: <xml_metadata> 的 tags 已經都改以 Udef_DocMeta_ 開頭，因此這裡不需再加入 prefix
                  + convertToLegalTagAttrValue(tagContent)            // 可能有 url，其中包含 '&' 等符號...
                  + `</${tag}>`
                  + '</div>'
                  + '</ImmarkusPiece>';
            extraRows.push(s);
         });
      }
      
      // 2025-06-15: 以 prepend() 方式，將每個 <Paragraph> 區塊下的 Udef_Genre 標籤轉為 ImmarkusPiece
      // 2025-11-27: 所以，若有幾份 ImmarkusBody，將會產生幾個 DocGenre rows
      //             => 因此，若 IMMARKUS data 不夠乾淨，導致 <Paragraph> 數量多於 <Event>，pieces 數量（目前是以轉出的特定 rows 計算）就會被高估！
      // 2025-12-23: export xml 時，必須先將這些「額外加上」的 <ImmarkusPiece> 移除！
      // 2026-04-23: 只有第一個 Paragraph 的 Udef_Genre_Subfolder 和 Udef_Genre_Filename 需加入 rows！（同一篇文件的 image entities 都有相同的 subfolder 和 filename\）
      //             此外，由於使用者看不懂 Udef_Genre_Purpose, Udef_Genre_Type, Udef_Genre_Source（相同內容存入 Udef_Img_Entity），因此也略去
      //             => 經此處理後，可以大量減少「實務上不需要的」rows！
      // 注意：Paragraph 下只有 <Udef_Img_EntityRelation>，並沒有 <Udef_Img_RelationSouorce>, <Udef_Img_RelationTarget>，因此後兩者並不會自動出現在 filter 中（若需要，則必須額外處理！）

      let subfolderAdded = false, filenameAdded = false;
      jqEvent.closest("doc_content").find("Paragraph ImmarkusBody").children().each(function() {
         let tagName = this.tagName;
         if (['Udef_Genre_Purpose', 'Udef_Genre_Source', 'Udef_Genre_Type'].includes(tagName)) return;   // 2026-04-23
         
         let immarkusId = $(this).closest('Paragraph').attr("ImmarkusId");         // 2025-11-27: 加上 Paragraph 的 ImmarkusId，後續可利用來取得 <DocAlign> 等訊息

         if (tagName.startsWith('Udef_Genre_')) {                                 // 不需用 $(this).prop("tagName") -- 注意因為是採用 xml 載入，回傳的標籤名稱可含大小寫
            // 2026-04-23
            if (tagName == 'Udef_Genre_Subfolder') {
               if (subfolderAdded) return;
               else subfolderAdded = true;
            }
            else if (tagName == 'Udef_Genre_Filename') {
               if (filenameAdded) return;
               else filenameAdded = true;
            }
            
            let s = `<ImmarkusPiece ParagraphImmarkusId="${immarkusId}" Key="DocGenre">`    // 2025-11-27
                  + '<div>'
                  + `<${tagName}>`
                  + convertToLegalTagAttrValue($(this).text())
                  + `</${tagName}>`
                  + '</div>'
                  + '</ImmarkusPiece>';
            extraRows.push(s);
         }
         else if (tagName.startsWith('Udef_Align_')) {                        // 2025-06-18
            // e.g., Udef_Align_OBJECT, Udef_Align_<obj>_ID
            let t = convertToLegalTagAttrValue($(this).text());
            
            // 2026-04-21: Udef_Align_<obj>_ID 需特別處理（若有 @Term，則將 @Term 加到標籤內容前面）
            if (tagName.endsWith('_ID')) {
               let term = $(this).attr("Term") || '-';
               t = term + "/" + t;
            }

            let s = `<ImmarkusPiece ParagraphImmarkusId="${immarkusId}" Key="DocAlign">`    // 2025-11-27
                  + '<div>'
                  + `<${tagName}>`
                  + t
                  + `</${tagName}>`
                  + '</div>'
                  + '</ImmarkusPiece>';
            extraRows.push(s);
         }
         else if (tagName.startsWith('Udef_Img_')) {                        // 2026-05-01
            // 2026-05-01: 補上 Udef_Img_EntityClass, Udef_Img_Note, etc.
            let s = `<ImmarkusPiece ParagraphImmarkusId="${immarkusId}" Key="DocImg">`
                  + '<div>'
                  + `<${tagName}>`
                  + convertToLegalTagAttrValue($(this).text())
                  + `</${tagName}>`
                  + '</div>'
                  + '</ImmarkusPiece>';
            //if (tagName != 'Udef_Img_EntityClass' && tagName != 'Udef_Img_Note') alert(s);
            extraRows.push(s);
            
            // TODO: 若需加上 Udef_Img_RelationSource, Udef_Img_RelationTarget，則需在此額外處理
            //       => 注意，因為 Udef_Img_RelationSource/Udef_Img_RelationTarget 都是「從 relation 衍生出的後分類項目」，
            //          因此 graph 中若需加上這兩類標籤的 filters，應直接利用 <Paragraph> 下的 <Udef_Img_RelationSource> 產生
            //          這兩個標籤（應避免從 <Events> 下提取）
            //if (tagName == 'Udef_Img_EntityRelation') {
            //   let sourceImmarkusId = $(this).attr("SourcePieceImmarkusId");
            //   let targetImmarkusId = $(this).attr("TargetPieceImmarkusId");
            //   if (immarkusId == sourceImmarkusId) ...<Udef_Img_RelationSource>;
            //   else if (immarkusId == targetPieceImmarkusId) ...<Udef_Img_RelationTarget>;
            //}
         }
      });
         
      jqEvent.prepend(extraRows.join('\n'));

      // 前面已經將需要轉入 table 的資訊以 <ImmarkusPiece> 方式注入 <Event>，接下來就是
      // 逐一取出 ImmarkusPiece 下的內容，將它們轉為 table rows
      jqEvent.find("ImmarkusPiece").each(function(idx) {
         // 每件 piece 一個 ImmarkusId -- 對應到 Paragraph 的 ImmarkusId 值
         let immarkusId = $(this).attr("ImmarkusId") || $(this).attr("ParagraphImmarkusId");    // 2025-11-28
         let refId = $(this).attr("Key");               // piece:0, piece:1, etc.

         // 2025-11-26: 將 piece:n 改為 piece:00n （補零）以方便後續利用 'piece:n' 排序
         if (refId.startsWith('piece:')) {
            let parts = refId.split(':');
            parts[1] = parts[1].padStart(3,'0');
            refId = parts.join(':');
         }

         // <ImmarkusPiece ImmarkusId="44cac15f-5427-443c-9db8-8c7d29bbde39" Key="piece:0">
         //    <ImmarkusPieceShape SelectorValue="<svg><rect x="895" y="161" width="66" height="479"/></svg>"/>
         //    <div>
         //    properties/descriptor:
         //    <Udef_properties_descriptor>重修咸陽縣城碑記</Udef_properties_descriptor>
         //    </div>
         // </ImmarkusPiece>
         
         // 2025-05-26
         //let pieceType = $(this).attr("Type") || 'Generic';
         
         // 2024-10-06
         if (GlobalVar.convertImmarkusPieceToNode) {
            eNum = eventCode + 'P' + idx.toString().padStart(2,'0');        // 加上後綴
            let extraTag = '<div>'
                         + '<Udef_EventRelLite graphNode="' + eNum + '">'
                         + eventCode 
                         + '</Udef_EventRelLite>'
                         + '</div>';
            $(this).prepend(extraTag);
         }
      
         let extra = ''
         let url = '';
         
         if ($(this).find("ImmarkusPieceShape").length > 0) {
            extra = $(this).find("ImmarkusPieceShape").attr("SelectorValue");    // 2024-06-28
         }

         // <ImmarkusPiece> 下的每個 <div> 產生一個 row
         $(this).find("div").children().each(function() {          
            let tagName = $(this).prop("tagName");                 // Udef_properties_id, Udef_properties_name, Udef_properties_location, Udef_properties_a.part.of_instance, etc.
            
            // 2025-06-08: 加上移除「冗餘」標籤（例如 span, Udef_properties 等 Immarkus2D 轉換時，擔心數據有錯誤或遺漏所加上的訊息）
            if (GlobalVar.tagNamesToRemove.includes(tagName)) return;
            
            let tempArr = tagName.split('_');                      // 注意：Immarkus json 可能會包含空的標記，轉換出空內容的 <Udef_properties/>
            tempArr = tempArr.slice(2);                            // 移除前兩個 parts
            
            let type;
            if (tagName == 'Udef_EventRelLite') type = imageType;  // 每個 ImmarkusPiece 都套用 ImmarkusImage 的 @Type
            else type = tempArr.join('_');                         // e.g., 從 Udef_properties_x_y 中擷取出 "x_y"，並換成全大寫（與 Comarkus 的 type 一致）
            type = type.toUpperCase();                             // 注意：換成全大寫！
            //alert(type);
            
            let markusId = '';
            let content = $(this).text() || '-';                   // 2024-07-26: 若為空字串，則補上 '-'
            
            //let graphNode = eNum;                                // 預設就是 eNum 的值
            let graphNode = $(this).attr("graphNode") || eNum;     // 2024-10-06: 可透過指定標籤的 @graphNode 來動態設定 graphNode 值
            let graphNodeLabel = graphNode;                        // 2024-07-26: rename from 'eNumLabel' to 'graphNodeLabel' （事件的顯示名稱，預設為 eNum，需和 graphNode 同步）
            
            // 2024-07-22: 將 event 中的時間地點提取出來，放在該 event (eNum) 下所有的 row 中
            let eventTimeNotBefore = -9999;                        // 預設值
            let eventTimeNotAfter = 9999;                          // 預設值
            let eventLocation = '-';                               // 預設值

            // 2025-02-05: 額外處理時間部分... 
            //             若多個 pieces 放在同一份文件，因個 piece 可能有獨立的 "properties/date start", "properties/date end" 之類的年份訊息，
            //             目前的處理方式，就是讓後面出現的覆蓋前面出現的
            // 2025-06-27: 還不是很清楚這裡的處理方式是否恰當...
            let immarkusImageTimeTags = Object.keys(GlobalVar.immarkusImageTimeTags);  // [ "Udef_DocMeta_AdYear", "Udef_properties_date.start", "Udef_properties_date.end" ];
            if (immarkusImageTimeTags.includes(tagName)) {
               // getEventTimeRange() 透過 refId 取得年份，content.split('/')[0] 取得 typeStr 'BEGIN', 'END', 'AFTER', 'BEFORE'
               //let [tnb, tna] = getEventTimeRange(refId, content);            // Comarkus
               let refId = content;
               
               let timeAnnotation = GlobalVar.immarkusImageTimeTags[tagName];   // 取得 'BEGIN', 'END' 訊息
               let [tnb, tna] = getEventTimeRange(refId, timeAnnotation);
               eventTimeNotBefore = tnb;                                        // integer
               eventTimeNotAfter = tna;                                         // integer
            }
            
            // 2025-05-27: 設定 GlobalVar.imageGenreStyleMap （不要和 GlobalVar.temp.imageNodeGenreMap 混淆）
            let nodeColorIdx = '00';                               // 2025-05-25: 注意並不是數字
            let nodeLegendCaption = LegendCaption.image;           // 2025-05-16: 顯示在 legend 的字串（節點的類型，例如 event node 為 "CONSTRUCTION"，common node 為 "INITIATOR" 之類）
            let nodeLabelColorClass = 'nodeLabelColor00';          // 2025-05-16
            let nodeShape = 'triangle';                            // 預設（防呆）
            let pathColor = GRAPH_COLORS.defaultPathColor;         // 2025-08-01: default

            // 2025-05-27: event nodes 藉由 type (ImmarkusPiece 的 @Type 值，例如 NAME, LOCATION, DESCRIPTOR) 決定 C-node 顏色，填入 GlobalVar.commonGenreStyleMap[type]
            let xmlMetadataStr = '';                               // 2025-06-01
            if (tagName == 'Udef_EventRelLite') {
               // image node
               xmlMetadataStr = getXmlMetadataStr(docMetadata.xmlMetadata);

               // 2025-09-15
               if (GlobalVar.nodeGenreUseImageTypes) {           
                  nodeLegendCaption += '.' + type;                 // 'Image.Generic', 'Image.Iiif'
               }
               
               let imageGenre = nodeLegendCaption;       // 2025-06-17: 所有 image nodes 都統一用 'Image' 
               allocateImageGenreStyle(imageGenre);
               ({ nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor } = GlobalVar.imageGenreStyleMap[imageGenre]);
            
            }
            else {
               // feature node
               // 2025-06-16: common nodes 通通設為 'Feature'
               //             先前是藉由 tagName suffix 作為 nodeLegendCaption
               nodeLegendCaption = LegendCaption.feature;
               
               // 2025-09-15
               if (GlobalVar.nodeGenreUseConnTagName) {
                  // 2025-09-20: 僅當 tagName 不屬於 GlobalVar.tagsComputeDupWithTagOnly，才將 tagName 加入 nodeLegendCaption
                  //if (GlobalVar.tagsComputeDupWithTagOnly.includes(tagName)) nodeLegendCaption += '.Generic';
                  //else {
                     let parts = tagName.split('_');
                     let imageType = parts.pop();                          // 'UDEF_DOCMETA_PIECE_AUTHOR', 'CBDB' (^CBDB, i.e., Udef_properties_CBDB), 'date.dynasty', 'pattern', 'texture', etc.
                     nodeLegendCaption += '.' + imageType;                 // 'Feature.CBDB', 'Feature.pattern', etc.
                  //}
               }
               
               // 2025-06-22: IMMARKUS 只有 Udef_Genre_Subfolder，但為了跟 COMARKUS 處理的方式一致，這裡多考慮 Udef_Evt_EVENT_SOURCE_TEXT
               if (GlobalVar.tagsForFileStructure.includes(tagName)) nodeLegendCaption = LegendCaption.sourceStructure;
               allocateCommonTypeColor(nodeLegendCaption);              // 2025-06-23
               ({ nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor } = GlobalVar.commonGenreStyleMap[nodeLegendCaption]);
            }

            let row = { id: GlobalVar.tableIdEntry++,
                        display: true,                // 2024-05-10: 是否顯示此 row（預設是顯示）-- 可切換 true/false
                        eNum,                         // Comarkus 對事件並沒有給出「名稱」，因此用 eNum 作為事件代號（字串）
                        eNumDisplay: true,            // 2024-05-29: (TODO) 切換整組 eNum 的 display 為 true/false（通常包含多個 graphNode）
                        graphNode,                    // 注意，common node 目前並沒有提供 "common node label" 的選項
                        graphNodeLabel,               // 2024-06-27: 事件的顯示名稱（預設和 eNum 一樣），需和 eNum 同步
                        groupDisplay: true,           // 2024-05-29: (TODO) 切換整組 graphNode 的 display 為 true/false（可能跨多個 eNum）
                        labelDisplay: true,           // 2024-07-24: 因 graphNode 會包含 event node
                        docFilename: docMetadata.filename,        // 2024-06-05: 文件檔名，連回 DB 時將會需要用到
                        docTitle: docMetadata.docTitle,           // 2025-09-28
                        type,
                        tagName,
                        refId,
                        content,
                        origTagName: tagName,         // 2024-10-15: 保留原始的 tagName
                        origContent: content,         // 2024-10-15: 保留原始的 content
                        dupCnt: 1,                    // 2024-05-13: duplicate count
                        comarkusId,
                        immarkusId,
                        markusId,
                        extra,
                        url,
                        xmlMetadataStr,               // 2025-06-01
                        eventTimeNotBefore,
                        eventTimeNotAfter,
                        nodeLegendCaption,            // 2025-05-11: 顯示在 legend 的字串（節點的類型，例如 event node 為 "CONSTRUCTION"，common node 為 "INITIATOR" 之類）
                        nodeLabelColorClass,          // 2025-05-14
                        nodeColorIdx,                 // 2025-05-10
                        eventLocation,
                      };
            GlobalVar.tableData.push(row);
         });
      });
      //console.log(GlobalVar.tableData);             // graphNode 尚未加入 'C' ??
   }
   
   function parseBinRelEvents2TableRow(jqEvents, docMetadata, eventsIdx) {     // 注意，是 jqEvents 而不是 jqEvent
      // eventsIdx 目前似乎還不需要...
      if (jqEvents.find("Event > BinRel").length == 0) return;                 // 不是 BinRel 的 events 區塊
      
      // BinRel 的 <Events> 內容，通通歸在同個 event node
      let eNum = 'B' + (GlobalVar.eventEntry++).toString().padStart(3,0);      // 暫時採用 'B'（應該也可以用 'E' ...）
      
      let extraRows = [];
      // 2024-08-14: 類似 Comarkus 處理方式，需額外加上一個 row，填入 "unique" eNum 訊息，
      //             以確保必然有一個 row 的 graphNode 為 eNum 值
      //             注意： tabulator 的 tagName 欄和 content 欄取自 <RelTarget> 的 @Type 和 content
      //                    type 取自 <BinRel> 的 @Type，refId 取自 <RelSource> 的 content
      // 2025-01-25: 將 sourceName 放入 row.refId，後續在 convertTableData2graphNodeDict() 會因標籤名
      //             為 Udef_EventRelLite 而被拷貝到 eventNodeTagName （以及 row.content？）
      let sourceName = jqEvents.find("Event > BinRel > RelSource").first().text() || '---';
      let s = '<Event Name="此標籤的屬性值沒用到">'
            + '<BinRel Type="BinRel">'
            + '<RelSource Type="此標籤的值會被放入row.refId">' + sourceName + '</RelSource>'
            + '<RelTarget Type="Udef_EventRelLite">' + eNum + '</RelTarget>'
            + '</BinRel>'
            + '</Event>';
      extraRows.push(s);

      // 2024-01-06: 利用類似 extraRow 的方式，將 docMetadata 裡 xmlMetadata 的 tags 轉換成 rows
      if (GlobalVar.addDocMeta2RowsInParsingDocuXml) {
         // (TODO) extra rows for metadata (若沒有 <xml_metadata>，會加上 <title>, <author> 與 <time_dynasty>）
         // BinRel 的 <xml_metadata> 沿用舊規格，並沒有加上 Udef_DocMeta_ 前綴，在此將它補上
         let metadataTags = Object.keys(docMetadata.xmlMetadata);
         metadataTags.forEach(function(tag) {
            let tagContent = docMetadata.xmlMetadata[tag];
            let s = `<Event Name="此標籤的屬性值沒用到">`
                  + '<BinRel Type="DocMeta">'
                  + '<RelSource Type="此標籤的屬性值沒用到">BinRel</RelSource>'
                  + `<RelTarget Type="Udef_DocMeta_${tag}">${tagContent}</RelTarget>`
                  + '</BinRel>'
                  + '</Event>';
            extraRows.push(s);
         });
      }

      jqEvents.prepend(extraRows.join('\n'));
      
      jqEvents.find("Event > BinRel").each(function() {
         let jqBinRel = $(this);
         
         let graphNode = eNum;                                // 預設就是 eNum 的值
         let graphNodeLabel = docMetadata.docTitle;
         let matches = docMetadata.docTitle.match(/(.+) \(.+\)/);
         if (matches) graphNodeLabel = $("<div/>").append(matches[1]).text();       // 2024-12-21: 僅取純文字
         
         let markusId = '-';
         let comarkusId = '-';
         let immarkusId = '-';
         let extra = ''
         let url = '';
         
         let type = jqBinRel.attr("Type") || '-';             // e.g., "父 (F)", "孫 (SS)"
         let comment = jqBinRel.attr("Meta");                 // 應該沒用到，只是取出放著
         
         let jqEvents = jqBinRel.parent().parent();
         let eventsName = jqEvents.attr("Name");              // 2025-01-25: 如果有值 (e.g., "CbdbPersonKinship")，就放入 tagName
         
         // 依照 convension 應該和 docTitle 代表同一物件（但非強制，因此需加上一些防呆）
         let jqRelSource = jqBinRel.find("RelSource");
         let sourceContent = jqRelSource.text();
         
         let jqRelTarget = jqBinRel.find("RelTarget");
         let tagName = jqRelTarget.attr("Type");              // "PersonName" 之類
         let content = jqRelTarget.text() || '-';             // 應該都有值，不應變成 '-'
         
         // 2025-06-08: 加上移除「冗餘」標籤（例如 span, Udef_properties 等 Immarkus2D 轉換時，擔心數據有錯誤或遺漏所加上的訊息）
         if (GlobalVar.tagNamesToRemove.includes(tagName)) return;
            
         // 2025-01-25: (TOCHECK) 將 type 和 content 串接起來，這樣 filtering 可以產生 .Genre 篩選機制
         //             (TODO) 目前有 bugs？
         //content = type + '/' + content;                         
         
         let xmlMetadataStr = '';                                                // 2025-06-01
         if (tagName == 'Udef_EventRelLite') {
            xmlMetadataStr = getXmlMetadataStr(docMetadata.xmlMetadata);         // 2025-06-01
         }
         else {
            if (eventsName) tagName = eventsName;
         }
         
         //let refId = jqRelTarget.attr("RefId");             // 目前 <RelSource> 和 <RelTarget> 並沒有 @RefId
         let refId = sourceContent;                           // 'B' node 把 sourceContent 放在 refId 欄...

         // 2024-07-22: 將 event 中的時間地點提取出來，放在該 event (eNum) 下所有的 row 中
         let eventTimeNotBefore = -9999;           // 預設值
         let eventTimeNotAfter = 9999;             // 預設值
         let eventLocation = '-';                  // 預設值
         
         // 2025-01-25: 從 person metadata 提取 TNB/TNA 資訊，更新 eventTimeNotBefore/eventTimeNotAfter
         let yearSpan = 0;                         // 這 yearSpan 變數是為了增加彈性...
         if (docMetadata.xmlMetadata['DocAdYear']) {
            let docAdYear = parseInt(docMetadata.xmlMetadata['DocAdYear']);
            eventTimeNotBefore = docAdYear - Math.floor(yearSpan/2);
            eventTimeNotAfter = docAdYear + Math.ceil(yearSpan/2);
         }
         
         // 2025-05-29: 設定 GlobalVar.binrelGenreStyleMap （不要和 GlobalVar.temp.binrelNodeGenreMap 混淆）
         let nodeColorIdx = '00';                               // 2025-05-25: 注意並不是數字
         let nodeLegendCaption = 'Generic';                     // 2025-05-16: 顯示在 legend 的字串（節點的類型，例如 event node 為 "CONSTRUCTION"，common node 為 "INITIATOR" 之類）
         let nodeLabelColorClass = 'nodeLabelColor00';          // 2025-05-16
         let nodeShape = 'triangle';
         let pathColor = GRAPH_COLORS.defaultPathColor;

         let binrelGenre = nodeLegendCaption;
         allocateBinrelGenreStyle(binrelGenre);
         ({ nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor } = GlobalVar.binrelGenreStyleMap[binrelGenre]);
            
         let row = { id: GlobalVar.tableIdEntry++,
                     display: true,                            // 2024-05-10: 是否顯示此 row（預設是顯示）-- 可切換 true/false
                     eNum,                                     // Comarkus 對事件並沒有給出「名稱」，因此用 eNum 作為事件代號（字串）
                     eNumDisplay: true,                        // 2024-05-29: (TODO) 切換整組 eNum 的 display 為 true/false（通常包含多個 graphNode）
                     graphNode,                                // 注意，common node 目前並沒有提供 "common node label" 的選項
                     graphNodeLabel,                           // 2024-06-27: 事件的顯示名稱（預設和 eNum 一樣），需和 eNum 同步
                     groupDisplay: true,                       // 2024-05-29: (TODO) 切換整組 graphNode 的 display 為 true/false（可能跨多個 eNum）
                     labelDisplay: true,                       // 2024-07-24: 因 graphNode 會包含 event node
                     docFilename: docMetadata.filename,        // 2024-06-05: 文件檔名，連回 DB 時將會需要用到
                     docTitle: docMetadata.docTitle,           // 2025-09-28
                     type,
                     tagName,
                     refId,
                     content,
                     origTagName: tagName,                     // 2024-10-15: 保留原始的 tagName
                     origContent: content,                     // 2024-10-15: 保留原始的 content
                     dupCnt: 1,                                // 2024-05-13: duplicate count
                     comarkusId,
                     immarkusId,
                     markusId,
                     extra,
                     url,
                     xmlMetadataStr,               // 2025-06-01
                     eventTimeNotBefore,
                     eventTimeNotAfter,
                     nodeLegendCaption,            // 2025-05-11: 顯示在 legend 的字串（節點的類型，例如 event node 為 "CONSTRUCTION"，common node 為 "INITIATOR" 之類）
                     nodeLabelColorClass,          // 2025-05-14
                     nodeColorIdx,                 // 2025-05-10
                     eventLocation,
                   };
         
         GlobalVar.tableData.push(row);
      });
   }

   // -----------------------------------------------------------------------------
   
   function allocateCommonTypeColor(genre) {
      // 注意：genre 的值，其實就是以 nodeLegendCaption
      // ColorSetA: 00 ~ 07, ColorSetB: 00 ~ 15 ==> 指定 00 ~ 15 其中一個值
      let nodeLabelColorClass = 'nodeLabelColor00';
      let nodeShape = GlobalVar.nodeTypeShapeMap['C'];
      let pathColor = GRAPH_COLORS.defaultPathColor;
      if (GlobalVar.commonGenreStyleMap[genre] === undefined) {
         let genreCount = Object.keys(GlobalVar.commonGenreStyleMap).length;       // 未加入之前，已經有幾個值
         let nodeColorIdx = ((genreCount) % TotalColors).toString().padStart(2,'0');
         GlobalVar.commonGenreStyleMap[genre] = { nodeColorIdx,
                                                  nodeLabelColorClass,
                                                  nodeShape,
                                                  pathColor
                                                };
      }
   }

   function allocateEventGenreStyle(genre) {
      // 注意：genre 的值，其實就是以 nodeLegendCaption
      let nodeLabelColorClass = 'nodeLabelColor00';
      let nodeShape = GlobalVar.nodeTypeShapeMap['E'];
      let pathColor = GRAPH_COLORS.defaultPathColor;
      if (GlobalVar.eventGenreStyleMap[genre] === undefined) {
         let genreCount = Object.keys(GlobalVar.eventGenreStyleMap).length;      // 未加入之前，已經有幾個值
         let nodeColorIdx = ((genreCount+8) % TotalColors).toString().padStart(2,'0');
         GlobalVar.eventGenreStyleMap[genre] = { nodeColorIdx,
                                                 nodeLabelColorClass,
                                                 nodeShape,
                                                 pathColor,
                                               };
      }
   }

   function allocateImageGenreStyle(genre) {
      let nodeLabelColorClass = 'nodeLabelColor00';
      let nodeShape = GlobalVar.nodeTypeShapeMap['M'];
      let pathColor = GRAPH_COLORS.defaultPathColor;
      if (GlobalVar.imageGenreStyleMap[genre] === undefined) {
         let genreCount = Object.keys(GlobalVar.imageGenreStyleMap).length;           // 未加入之前，已經有幾個值
         let nodeColorIdx = ((genreCount+9) % TotalColors).toString().padStart(2,'0');
         GlobalVar.imageGenreStyleMap[genre] = { nodeColorIdx,
                                                 nodeLabelColorClass,
                                                 nodeShape,
                                                 pathColor,
                                               };
      }
   }

   function allocateBinrelGenreStyle(genre) {
      let nodeLabelColorClass = 'nodeLabelColor00';
      let nodeShape = GlobalVar.nodeTypeShapeMap['B'];
      let pathColor = GRAPH_COLORS.defaultPathColor;
      if (GlobalVar.binrelGenreStyleMap[genre] === undefined) {
         let genreCount = Object.keys(GlobalVar.binrelGenreStyleMap).length;           // 未加入之前，已經有幾個值
         let nodeColorIdx = ((genreCount+1) % TotalColors).toString().padStart(2,'0');
         GlobalVar.binrelGenreStyleMap[genre] = { nodeColorIdx,
                                                  nodeLabelColorClass,
                                                  nodeShape,
                                                  pathColor,
                                                };
      }
   }


   
   // -----------------------------------------------------------------------------

   function getXmlMetadataStr(xmlMetadata) {
      // 2025-06-01: 目前就是簡單將 xmlMetadata 物件換成串接的 <div>Tag: Value</div>，日後看需要再進行調整
      let htmlList = [];
      for (tag in xmlMetadata) {
         let val = xmlMetadata[tag];
         let s = "<div class='metadataLine'>" + tag + ': ' + val + "</div>";
         htmlList.push(s);
      }
      let ret = htmlList.join('');
      return ret;
   }
   
   function getEventTimeRange(refId, content) {
      // Comarkus: 對 tagName == 'Udef_Evt_TIME' 的 row 取得 [tnb, tna]
      // Immarkus: 對 tagName == '...' 的 row 取得 [tnb, tna]
      // => 透過 refId 取得年份，content.split('/')[0] 取得 typeStr 'BEGIN', 'END', 'AFTER', 'BEFORE'
      
      // 2024-08-18
      // refId 是從 Comarkus json 直接轉入，目前看來可能有多種格式：
      // '1664 (需檢查 content，例如 END/壬辰春暑, AFTER/壬辰春暑, BEGIN/乾隆丙寅), 
      // '1747-11' (需檢查 content，例如 BEGIN/乾隆丁卯年十月),
      // '8月' (content DURATION/八越月)
      // '1672-05-25', 
      // '公元13681398' (應該是 Entmarkus 輸出的 bugs...), 
      // '公元16111644' (content AFTER/崇禎)
      // 'c0.5年' (需檢查 content，例如 DURATION/半載) 等
      
      let tnb = -9999, tna = 9999;           // integers
      let [typeStr, chStr] = content.split('/');
      let matches = refId.match(/(\d+)/);    // 注意：僅回傳 refId 第一個比對到的結果！
      if (matches !== null) {                // e.g., ["1664","1664"]
         let timeStr = matches[1];           // 僅取出第一個比對出的數字字串作為「年份」
         if (timeStr.length >= 6) {          // 應該是一個年份區段
            let half = Math.floor(timeStr.length / 2);
            tnb = timeStr.substr(0, half);
            tna = timeStr.substr(half);
            //alert(timeStr + ':' + tnb + "-" + tna);
         }
         else if (timeStr.length >= 3) {
            if (typeStr == 'BEGIN') tnb = parseInt(timeStr);
            else if (typeStr == 'END') tna = parseInt(timeStr);
            else if (typeStr == 'AFTER') tnb = parseInt(timeStr);        // 2024-09-14: TO-CHECK 暫時先這樣定...
            else if (typeStr == 'BEFORE') tna = parseInt(timeStr);       // 2024-09-14: TO-CHECK 暫時先這樣定...
            else if (typeStr == 'timePeriod') tnb = parseInt(timeStr);   // 2024-09-14: TO-CHECK 暫時先這樣定...
            else if (typeStr == '-') {                                   // 2025-02-05: Immarkus (publication year)
               tnb = parseInt(timeStr);
               tna = tnb;
            }
            else if (typeStr.match(/^\d+$/)) {                           // 2025-08-21: e.g. "1858/咸豐戊午"
               tnb = parseInt(timeStr);
               tna = tnb;
            }
            else console.log("FAIL TO CONVERT: " + refId + "," + content);
         }
         else {
            // 不知道怎樣處理比較好... 先以 log 輸出，也許後續會需要加強處理
            //console.log("SKIP: event time range " + refId + " (" + content + ")");
         }
      }
      
      return [tnb, tna];
   }
   
   function updateDisplayCheckboxes() {
      // 2024-09-12: 透過 GlobalVar.graphNodeDict 更新 display checkboxes
      let graphNodes = Object.keys(GlobalVar.graphNodeDict);
      $("#nodeDisplayTable").find("input[type='checkbox']").each(function() {
         let graphNode = $(this).attr("key");
         let nodeType = graphNode.substr(0,1);
         if (nodeType == 'C') $(this).prop("checked", false);                // 先隱藏所有 'C' nodes
         else {
            let displayVal = GlobalVar.graphNodeDict[graphNode].display;     // 注意，是字串型態
            let display = (displayVal == 'true') ? true : false;
            //alert(graphNode + ':' + display + ':' + typeof(display));
            $(this).prop("checked", display);
         }
      });
      
      // 將有連結的 'C' nodes 勾選起來...
      // (TODO)
   }

   function updateCheckedNodesCountAndGraphNodeDict() {
      // 2024-09-15: 加上 nodeDisplayTable 的 checkbox 選項
      // 2024-10-01: 藉由 nodeDisplayTable 的 checkbox 勾選狀態，同步更新 graphNodeDict
      // 2026-04-23: debug xxyyzz xxyyzz
      let visibleEnodes = [];
      let typedNodesCount = {};
      $("#nodeDisplayTable").find("input[type='checkbox']").each(function() {
         // 2025-06-21: 注意 #nodeDisplayTable 也會包含有 'CX' 節點（但似乎很容易出錯？）
         let graphNode = $(this).attr("key");
         if (graphNode.startsWith("CX") && !GlobalVar.graphNodeDict[graphNode]) return;     // TODO: 暫時先這樣避免錯誤，但其實是需仔細除錯...
         if (!GlobalVar.graphNodeDict[graphNode]) alert("ERROR: something wrong... " + graphNode);
         
         let boxChecked = $(this).is(':checked');     
         if (boxChecked) {
            GlobalVar.graphNodeDict[graphNode].display = 'true';
            let nodeType = graphNode.substr(0,1);
            if (graphNode.substr(0,2) == 'CX') nodeType = 'CX';                 // 2026-04-23: 'CX' 另外計算
            if (!typedNodesCount[nodeType]) typedNodesCount[nodeType] = 0;
            typedNodesCount[nodeType]++;
            if (checkIfEventNode(nodeType)) visibleEnodes.push(graphNode);      // 2025-08-10
         }
         else {
            GlobalVar.graphNodeDict[graphNode].display = 'false';
         }
      });
      
      let eventNodesCount = 0, imageNodesCount = 0, binrelNodesCount = 0;         // 2025-12-12
      let commonNodesCount = 0;
      let cxNodesCount = 0;       // 'CX' nodes 包含 'Udef_CX_OBJECT_MAIN', 'Udef_CX_qingliu_longjin_qiao' 等 "aligned" nodes
      for (let nodeType in typedNodesCount) {
         if (nodeType == 'C') commonNodesCount += typedNodesCount[nodeType];      // 注意：一般 features nodes，以及 source structure nodes
         else if (nodeType == 'CX') cxNodesCount += typedNodesCount[nodeType];    // 2026-04-23: 'CX' 節點數量（目前介面不顯示）
         else if (nodeType == 'E') eventNodesCount += typedNodesCount[nodeType];
         else if (nodeType == 'M') imageNodesCount += typedNodesCount[nodeType];
         else if (nodeType == 'B') binrelNodesCount += typedNodesCount[nodeType];
         else console.log("WARNING: unknown nodeType: " + nodeType);
      }
      
      let checkedEventNodesCount = eventNodesCount + imageNodesCount + binrelNodesCount;
      $("span.checkedEventNodesCount").text(checkedEventNodesCount);            // 2025-01-10: 改用 class 選元素... 可一次更新數個 <span> 位置
      $("span.checkedCommonNodesCount").text(commonNodesCount);
      
      // 2025-08-10: 對 GlobalVar.tagEnodeLookupMap[tag] 和 visibleEnodes 取交集，將計算結果放入 GlobalVar.tagVisibleEnodeList
      let tagEnodeLookupMap = GlobalVar.tagEnodeLookupMap;                 // reference
      let visibleSet = new Set(visibleEnodes);
      Object.keys(tagEnodeLookupMap).forEach(function(tag) {
         // 取交集，且需去重 (ChatGPT)
         GlobalVar.tagVisibleEnodeList[tag] = [...new Set(tagEnodeLookupMap[tag].filter(x => visibleSet.has(x)))];
      });
      //alert(JSON.stringify(GlobalVar.tagVisibleEnodeList));
      
      // 2025-08-11
      if (GlobalVar.enableTagEnodeCount) {
         // 取出 #divCommonNodesToDisplay 下的 table row 項目，直接更新 td.tagEnodeCount
         $("#divCommonNodesToDisplay").find("input[type='checkbox']").each(function() {
            let tag = $(this).val();
            let count = GlobalVar.tagVisibleEnodeList[tag]?.length ?? '-';
            $(this).closest("tr").find("td.tagEnodeCount").text(count);
         });
      }
   }
   
   function setAllDisplayCheckboxes(checkedValue = true) {
      // 2024-09-09
      $("#nodeDisplayTable").find("input[type='checkbox']").each(function() {
         $(this).prop("checked", checkedValue);
      });
   }
   
   function inverseDisplayCheckboxes() {
      // 2024-08-24
      $("#nodeDisplayTable").find("input[type='checkbox']").each(function() {
         $(this).prop("checked", !$(this).prop("checked"));
      });
   }
   
   function extendSelectedCommonNodes() {
      // 2024-09-10: 找出勾選的 'C' 節點「往外延伸一層的節點」，並將其勾選起來...
      // 注意：為了方便（實務上似乎這樣也比較合理），目前僅延伸 nodeType 'C' 的節點
      // 如果是 nodeType 'C'，可直接從 GlobalVar.graphNodeDict['C'].nodeInfo 取得相連的 event nodes
      // 如果是其他 node types，處理起來會麻煩許多（嚴格來說還需考慮 GlobalVar.enableFeatureLinks）...
      
      let checkedNodes = [];
      $("#nodeDisplayTable").find("input[type='checkbox']").each(function() {
         if ($(this).prop("checked")) checkedNodes.push($(this).attr("key"));
      });
      //alert(JSON.stringify(checkedNodes));
      //console.log(GlobalVar.graphNodeDict);
      
      let graphNodeDict = GlobalVar.graphNodeDict;
      
      let extendedNodes = [];
      checkedNodes.forEach(function(node) {
         let nodeType = node.substr(0,1);
         if (nodeType == 'C' && graphNodeDict[node]) {
            let connectedNodes = Object.keys(graphNodeDict[node].nodeInfo);
            extendedNodes = extendedNodes.concat(connectedNodes);
         }
         else ;        // just skip (should not happen)
      });
      
      let uniqueNodes = [...new Set(extendedNodes)];         // array_unique
      uniqueNodes.forEach(function(node) {
         $("#nodeDisplayTable").find("input[type='checkbox'][key='" + node + "']").each(function() {
            $(this).prop("checked", true);
         });
      });
   }
   
   function extendSelectedEventNodes(threshold = 1, srcEventNodes = []) {
      // 2024-09-13: 找出勾選的 non-C (event) 節點「往外延伸一層的節點」，並將其勾選起來...
      //             方法：逐一檢查 C node 是否包含勾選的 event node，若包含則將其勾選起來
      if (srcEventNodes.length == 0) {
         // 預設：從 display table 將所有 checked event nodes 找出來...
         $("#nodeDisplayTable").find("input[type='checkbox']").each(function() {
            if ($(this).prop("checked")) {
               let graphNode = $(this).attr("key");
               if (checkIfEventNode(graphNode) && !graphNode.startsWith('C')) srcEventNodes.push(graphNode);
            }
         });
      }
      else {
         // 2025-01-10: 更新 display table，將屬於 srcEventNodes 的項目勾選起來，其他都設為不勾選
         // 2025-06-21: 必須排除 'CX' nodes！
         $("#nodeDisplayTable").find("input[type='checkbox']").each(function() {
            let graphNode = $(this).attr("key");
            if (graphNode.startsWith('CX')) return;          // 跳過不計
            $(this).prop("checked", srcEventNodes.includes(graphNode));
         });    
      }
      //console.log(GlobalVar.graphNodeDict);
      //alert(JSON.stringify(srcEventNodes));

      // 先取得「所有」common nodes（需排除 'CX' nodes）
      let graphNodeDict = GlobalVar.graphNodeDict;
      let commonNodes = Object.keys(graphNodeDict).filter(function(v) {
         return (graphNodeDict[v].nodeType == 'C' && !v.startsWith('CX'));     // 2025-06-21
      });
      //alert(JSON.stringify(commonNodes));
      
      // 2025-01-10: 對每一個 common node，計算其 visible degree
      // 2025-05-20: 加上 Text Filter，若其為 x|y|z，過濾掉不含 x|y|z 的 common nodes
      let commonNodeDegree = {};
      let commonNodeTagName = {};
      commonNodes.forEach((c) => commonNodeDegree[c] = 0);
      
      commonNodes.forEach(function(commonNode) {
         let nodeInfo = graphNodeDict[commonNode].nodeInfo;          // 該 common node 所連到的 event nodes
         let connectedEventNodes = Object.keys(nodeInfo);
         connectedEventNodes.forEach(function(eventNode) {
            let nodeVisible = graphNodeDict[eventNode].display;
            if (srcEventNodes.includes(eventNode) && nodeVisible) commonNodeDegree[commonNode]++;     // 2025-05-22: bug fix
         });
         commonNodeTagName[commonNode] = graphNodeDict[commonNode].nodeTagName;

         // 2025-05-10: 檢查 text filter，若 common node 不包含 text filter 的字串，就將其 degree 減去 10000（因此小於 threshold 而被刷掉）
         let nodeContentStr = graphNodeDict[commonNode].nodeContentStr;
         let textFilter = $("#commonNodeTermsFilter").val().trim();           // e.g., 'monk|buddhist'
         if (textFilter !== '') {
            let filterTerms = textFilter.split('|').map((v) => v.trim());
            let pass = filterTerms.some(function(term) {
               if (term !== '' && nodeContentStr.includes(term)) return true;
            });
            if (!pass) commonNodeDegree[commonNode] -= 10000;
         }
      });
      //console.log(commonNodeDegree);
      //alert(JSON.stringify(commonNodeDegree));

      // 2025-01-25: 將 degree 大於等於 threshold，且 tag name 在勾選列表的 common nodes 放入 extendedCommonNodes
      let checkedCommonNodeTags = [];
      $("#divCommonNodesToDisplay").find("input[type='checkbox']:checked").each(function() {
         checkedCommonNodeTags.push($(this).val());
      });
      //alert(JSON.stringify(checkedCommonNodeTags));
      
      let extendedCommonNodes = [];
      for (let commonNode in commonNodeDegree) {
         let tagName = commonNodeTagName[commonNode];
         if (commonNodeDegree[commonNode] >= threshold && checkedCommonNodeTags.includes(tagName)) { 
            extendedCommonNodes.push(commonNode);
         }
      }
      //alert(Object.keys(commonNodeDegree).length + "\n" + extendedCommonNodes.length);
      
      // 2025-01-10: 對「每個」common node 都依照是否在 extendedCommonNodes 更新勾選設定
      extendedCommonNodes.forEach(function(node) {
         let selector = "input[type='checkbox'][key='" + node + "']";
         $("#nodeDisplayTable").find(selector).each(function() {
            $(this).prop("checked", true);
         });
      });

   }
   
   function uncheckIsolatedEventNodes() {
      // 注意：在此假設 event nodes 之間並沒有連線...
      //（TODO）: 若 event nodes 間可有連線，需先確認連線發生的狀況，如此才能進行後續處理
      // (1). 收集 checked common nodes 所連到的 event nodes 集合 A
      // (2). 若某 checked event node 不在集合 A，就將其 uncheck

      // 2023-09-23
      let checkedNodes = [];
      $("#nodeDisplayTable").find("input[type='checkbox']:checked").each(function() {
         checkedNodes.push($(this).attr("key"));
      });
      
      let extendedNodes = [];
      checkedNodes.forEach(function(graphNode) {
         let nodeType = graphNode.substr(0,1);
         if (checkIfEventNode(nodeType)) return;
         let connectedNodes = Object.keys(GlobalVar.graphNodeDict[graphNode].nodeInfo);
         extendedNodes = extendedNodes.concat(connectedNodes);
      });
      let uniqueNodes = [...new Set(extendedNodes)];         // array_unique

      $("#nodeDisplayTable").find("input[type='checkbox']:checked").each(function() {
         let graphNode = $(this).attr("key");
         let nodeType = graphNode.substr(0,1);
         if (checkIfEventNode(nodeType)) {      // Event node
            if (!extendedNodes.includes(graphNode)) $(this).prop("checked", false);
         }
         else {                                 // Common node
            let connectedNodes = Object.keys(GlobalVar.graphNodeDict[graphNode].nodeInfo);
            let intersection = checkedNodes.filter(value => connectedNodes.includes(value));
            if (intersection.length == 0) $(this).prop("checked", false);
         }
      });
   }
   
   // ----------------------------------------------------------------------------
   
   function resetControlPanel() {
      // 2024-08-20: 更新 <div id="divControlPanel"> 控制板的內容，該控制版包含 
      //             divNodeDisplayList 和其他控制項
      // 注意：此函式相當長且複雜，將來或許需重構一下...
      // 注意：因此函式可能被多次呼叫，相關事件每次重新註冊 .off("click").on("click", function() {...}

      $("#graphControlPanel").hide();

      let graphNodeDict = GlobalVar.graphNodeDict;
      let graphNodes = Object.keys(graphNodeDict);
      
      GlobalVar.nodeTypeDict = {};                // reset
      graphNodes.forEach(function(graphNode) {
         let nodeType = graphNodeDict[graphNode].nodeType;
         if (!GlobalVar.nodeTypeDict[nodeType]) GlobalVar.nodeTypeDict[nodeType] = 0;
         GlobalVar.nodeTypeDict[nodeType]++;
      });
      let nodeTypes = Object.keys(GlobalVar.nodeTypeDict).sort();

      // ---------------------------------
      //        選擇節點形狀與顏色
      // ---------------------------------

      //// 選擇節點形狀
      //let shapeList = ["circle", "square", "triangle"];
      //let shapeSymbolDict = { "circle": "&#9675;",               // &#9679; 實心圓形，&#9675; 空心圓形
      //                        "square": "&#9633;",               // &#9632; 實心正方形，&#9633; 空心正方形
      //                        "triangle": "&#9651;",             // &#9650; 實心三角形，&#9651; 空心三角形
      //                      };
      //
      //nodeTypes.forEach(function(nodeType) {
      //   let t = '';
      //   shapeList.forEach(function(shape) {
      //      let displayChkStr = (GlobalVar.nodeTypeShapeMap[nodeType] == shape ? " checked='checked'" : "");
      //      t += "&#160;<input name='radio_shape_" + nodeType + "' key='" + nodeType + "' value='" 
      //         + shape + "' type='radio'" 
      //         + displayChkStr + ">" + shape + " " + shapeSymbolDict[shape] + "</input>"
      //   });
      //   let s = "<tr><td valign='top'>"
      //         + nodeType + ":"
      //         + "</td><td>"
      //         + t
      //         + "</td></tr>";
      //   nodesHtmlList.push(s);
      //});
      //let shapeTableHtml = "<table id='panelNodeShape'>"
      //                     + nodesHtmlList.join("\n")
      //                     + "</table>";
      //$("#divNodeShapeOptionsTable").html(shapeTableHtml);
      
      // 繪出當前節點的形狀與顏色（應該與 legend 有相同形狀與顏色...）
      // 2025-07-15: todo todo todo
      //$("#tableNodeShapeColor")
      
      // --------------------------------------------
      //               選擇節點形狀
      // --------------------------------------------
      // 2025-07-02: 形狀與顏色，都需透過以下 nodeTypeStyleMap
      let nodeTypeStyleMap = { 'E': GlobalVar.eventGenreStyleMap,
                               'M': GlobalVar.imageGenreStyleMap,
                               'B': GlobalVar.binrelGenreStyleMap,
                               'C': GlobalVar.commonGenreStyleMap,
                              };
      let nodesHtmlList = [];
      
      // 2025-07-02: todo todo
      for (nodeType in nodeTypeStyleMap) {
         let genreStyleMap = nodeTypeStyleMap[nodeType];
         let genreKeys = Object.keys(genreStyleMap);
         genreKeys.sort().forEach(function(genreKey) {
            let radioKey = nodeType + ':' + genreKey;
            let radioDisplay = NodeTypeNameMap[nodeType] + '.' + genreKey;
            let t = '';
            let shape = 'circle';
         
            ShapeSet.forEach(function(shape) {
                  displayChkStr = (nodeTypeStyleMap[nodeType][genreKey].nodeShape == shape)
                                ? " checked='checked'" 
                                : "";
                  
                  // note: <span> is an inline element (no width or height) => turn it to inline-block
                  let t2 = "<span class='shape_" + shape + "'>" + shape + "</span>";
                  
                  t += "&#160;<input name='radio_shape_" + radioDisplay + "' key='" + radioKey + "' value='" 
                     + shape + "' type='radio'" 
                     + displayChkStr + ">" + t2 + "</input>\n"
            });
            t += "<br/>";

            let s = "<tr class='panelNodeShape' style='padding:3px'><td valign='top'>"
                  + radioDisplay
                  + "</td><td>"
                  + t
                  + "</td></tr>";
            nodesHtmlList.push(s);
         });
      }

      let shapeTableHtml = "<table id='panelNodeShape' class='panelTable'>"
                         + nodesHtmlList.join("\n")
                         + "</table>";
      $("#divNodeShapeOptionsTable").html(shapeTableHtml);

      $("#butSetNodeShape").off("click").on("click", function() {
         $("#overlaySetNodeShape").show();
      });
      
      $("#butSetNodeShapeOK").off("click").on("click", function() {
         // 2025-05-23: 將 #divNodeShapeOptionsTable 的結果更新到 GlobalVar.3, GlobalVar.imageGenreStyleMap 和 GlobalVar.commonGenreStyleMap
         $("#panelNodeShape").find("input[type='radio']:checked").each(function() {
            //alert($(this).attr("key") + "\n" + $(this).val());
            let [nodeType, genre] = $(this).attr("key").split(':');          // e.g., 'C:EVENT_SOURCE_TEXT'
            let val = $(this).val();                                         // e.g., '04'
            if (nodeType == 'E') GlobalVar.eventGenreStyleMap[genre].nodeShape = val;
            else if (nodeType == 'M') GlobalVar.imageGenreStyleMap[genre].nodeShape = val;
            else if (nodeType == 'B') GlobalVar.binrelGenreStyleMap[genre].nodeShape = val;
            else if (nodeType == 'C') GlobalVar.commonGenreStyleMap[genre].nodeShape = val;
            else alert("Error: NodeShape currently not support nodeType '" + nodeType + "'");
         });
         
         // 將 nodeShape 更新到 GlobalVar.graphNodeDict[graphNode].nodeShape
         let graphNodeDict = GlobalVar.graphNodeDict;             // reference
         for (let graphNode in graphNodeDict) {
            let graphNodeData = graphNodeDict[graphNode];         // reference
            let nodeType = graphNodeData.nodeType;
            let genre = graphNodeData.nodeLegendCaption; 
            //console.log(nodeType + ':' + genre);
            
            if (nodeType == 'E') graphNodeData.nodeShape = GlobalVar.eventGenreStyleMap[genre].nodeShape;
            else if (nodeType == 'M') graphNodeData.nodeShape = GlobalVar.imageGenreStyleMap[genre].nodeShape;
            else if (nodeType == 'B') graphNodeData.nodeShape = GlobalVar.binrelGenreStyleMap[genre].nodeShape;
            else if (nodeType == 'C') graphNodeData.nodeShape = GlobalVar.commonGenreStyleMap[genre].nodeShape;
         }
         
         $("#overlaySetNodeShape").hide();
      });

      $("#butSetNodeShapeCancel").off("click").on("click", function() {
         $("#overlaySetNodeShape").hide();
      });


      // --------------------------------------------
      //               選擇節點顏色
      // --------------------------------------------
      // 2025-07-01: 利用 GlobalVar.eventGenreStyleMap, GlobalVar.imageGenreStyleMap 和 GlobalVar.commonGenreStyleMap
      //             讓使用者可指定顯示於 legend 節點類型的顏色
      //             GlobalVar.eventGenreStyleMap := {'EVENT': {nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor}, 'EXTRA':{...}, ... }
      //             GlobalVar.imageGenreStyleMap := { 'IMAGE': {nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor}, ... }
      //             GlobalVar.binrelGenreStyleMap := { 'Generic': {nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor}, ... }
      //             GlobalVar.commonGenreStyleMap := { 'Feature': {nodeColorIdx, nodeLabelColorClass, nodeShape, pathColor}, 'Feature Hierarchy':{...},'Source Structure':{...}, ...}
      
      nodesHtmlList = [];                    // reset
      let colorSets = ["colorSetB"];
      let colorSetIndexes = Array.from(Array(TotalColors).keys());                       // [0, 1, 2, ..., 7, ..., 15]
      let colorSetEntries = colorSetIndexes.map((v) => v.toString().padStart(2,"0"));    // ['00','01','02'...]
      
      for (nodeType in nodeTypeStyleMap) {
         let genreStyleMap = nodeTypeStyleMap[nodeType];
         let genreKeys = Object.keys(genreStyleMap);
         genreKeys.sort().forEach(function(genreKey) {
            //let genreColor = genreStyleMap[genreKey];              // e.g., {"nodeColorIdx":"05","nodeLabelColorClass":"nodeLabelColor00", "nodeShape":"circle" }
            let radioKey = nodeType + ':' + genreKey;
            let radioDisplay = NodeTypeNameMap[nodeType] + '.' + genreKey;
            let t = '';
            let colorClass = '';
         
            colorSets.forEach(function(colorSet) {
               colorSetEntries.forEach(function(cse) {          // cse: = '00', '01', etc.
                  colorClass = colorSet + cse;                  // 'colorSetB00', etc.
                  displayChkStr = (nodeTypeStyleMap[nodeType][genreKey].nodeColorIdx == cse)
                                ? " checked='checked'" 
                                : "";
                  
                  // note: <span> is an inline element (no width or height) => turn it to inline-block
                  let t2 = "<span class='" + colorClass + "' style='display:inline-block; position:relative; top:.3em; width:.8em; height:.8em;'>&#160;</span>";
                  
                  t += "&#160;<input name='radio_color_" + radioDisplay + "' key='" + radioKey + "' value='" 
                     + cse + "' type='radio'" 
                     + displayChkStr + ">" + t2 + "</input>\n"
               });
               t += "<br/>";
            });
            let s = "<tr class='panelNodeColor' style='padding:3px'><td valign='top'>"
                  + radioDisplay
                  + "</td><td>"
                  + t
                  + "</td></tr>";
            nodesHtmlList.push(s);
         });
      }

      let colorTableHtml = "<table id='panelNodeColor' class='panelTable'>"
                         + nodesHtmlList.join("\n")
                         + "</table>";
      $("#divNodeColorOptionsTable").html(colorTableHtml);
      
      $("#butSetNodeColor").off("click").on("click", function() {
         $("#overlaySetNodeColor").show();
      });
      
      $("#butSetNodeColorOK").off("click").on("click", function() {
         // 2025-05-23: 將 #divNodeColorOptionsTable 的結果更新到 GlobalVar.3, GlobalVar.imageGenreStyleMap 和 GlobalVar.commonGenreStyleMap
         $("#panelNodeColor").find("input[type='radio']:checked").each(function() {
            //alert($(this).attr("key") + "\n" + $(this).val());
            let [nodeType, genre] = $(this).attr("key").split(':');          // e.g., 'C:EVENT_SOURCE_TEXT'
            let val = $(this).val();                                         // e.g., '04'
            if (nodeType == 'E') GlobalVar.eventGenreStyleMap[genre].nodeColorIdx = val;
            else if (nodeType == 'M') GlobalVar.imageGenreStyleMap[genre].nodeColorIdx = val;
            else if (nodeType == 'B') GlobalVar.binrelGenreStyleMap[genre].nodeColorIdx = val;
            else if (nodeType == 'C') GlobalVar.commonGenreStyleMap[genre].nodeColorIdx = val;
            else alert("Error: currently not support nodeType '" + nodeType + "'");
         });
         
         // 將 nodeColorIdx 更新到 GlobalVar.graphNodeDict[graphNode].nodeColorIdx
         let graphNodeDict = GlobalVar.graphNodeDict;             // reference
         for (let graphNode in graphNodeDict) {
            let graphNodeData = graphNodeDict[graphNode];         // reference
            let nodeType = graphNodeData.nodeType;
            let genre = graphNodeData.nodeLegendCaption; 
            //console.log(nodeType + ':' + genre);
            
            if (nodeType == 'E') graphNodeData.nodeColorIdx = GlobalVar.eventGenreStyleMap[genre].nodeColorIdx;
            else if (nodeType == 'M') graphNodeData.nodeColorIdx = GlobalVar.imageGenreStyleMap[genre].nodeColorIdx;
            else if (nodeType == 'B') graphNodeData.nodeColorIdx = GlobalVar.binrelGenreStyleMap[genre].nodeColorIdx;
            else if (nodeType == 'C') graphNodeData.nodeColorIdx = GlobalVar.commonGenreStyleMap[genre].nodeColorIdx;
         }
         
         $("#overlaySetNodeColor").hide();
      });

      $("#butSetNodeColorCancel").off("click").on("click", function() {
         $("#overlaySetNodeColor").hide();
      });
      
      // -------------------------------------------------------------------
      // 2025-07-02: 選擇節點標籤顏色
      nodesHtmlList = [];
      colorSetIndexes = Array.from(Array(8).keys());         // [0, 1, 2, ..., 7]
      colorSetEntries = colorSetIndexes.map((v) => 'nodeLabelColor' + v.toString().padStart(2,"0"));
      
      for (nodeType in nodeTypeStyleMap) {
         let genreStyleMap = nodeTypeStyleMap[nodeType];
         let genreKeys = Object.keys(genreStyleMap);
         genreKeys.sort().forEach(function(genreKey) {
            //let genreColor = genreStyleMap[genreKey];              // e.g., {"nodeColorIdx":"05","nodeLabelColorClass":"nodeLabelColor00", "nodeShape":"circle" }
            let radioKey = nodeType + ':' + genreKey;
            let radioDisplay = NodeTypeNameMap[nodeType] + '.' + genreKey;
            let t = '';
         
               colorSetEntries.forEach(function(cse) {          // cse: = 'nodeLabelColor00', 'nodeLabelColor01', etc.
                  displayChkStr = (nodeTypeStyleMap[nodeType][genreKey].nodeLabelColorClass == cse)
                                ? " checked='checked'" 
                                : "";
                  
                  // note: <span> is an inline element (no width or height) => turn it to inline-block
                  let t2 = "<span class='" + cse + "'>A</span>";
                  
                  t += "&#160;<input name='radio_labelcolor_" + radioDisplay + "' key='" + radioKey + "' value='" 
                     + cse + "' type='radio'" 
                     + displayChkStr + ">" + t2 + "</input>\n"
               });
               t += "<br/>";

            let s = "<tr class='panelNodeLabelColor' style='padding:3px'><td valign='top'>"
                  + radioDisplay
                  + "</td><td>"
                  + t
                  + "</td></tr>";
            nodesHtmlList.push(s);
         });
      }

      let nodeLabelColorClassHtml = "<table id='panelNodeLabelColor' class='panelTable'>"
                                  + nodesHtmlList.join("\n")
                                  + "</table>";
      $("#divNodeLabelColorOptionsTable").html(nodeLabelColorClassHtml);
      
      $("#butSetNodeLabelColor").click(function() {
         $("#overlaySetNodeLabelColor").show();
      });
      
      $("#butSetNodeLabelColorOK").click(function() {
         // 2025-05-23: 將 #divNodeColorOptionsTable 的結果更新到 GlobalVar.3, GlobalVar.imageGenreStyleMap 和 GlobalVar.commonGenreStyleMap
         $("#panelNodeLabelColor").find("input[type='radio']:checked").each(function() {
            //alert($(this).attr("key") + "\n" + $(this).val());
            let [nodeType, genre] = $(this).attr("key").split(':');          // e.g., 'C:Feature'
            let val = $(this).val();                                         // e.g., 'nodeLabelColor04'
            if (nodeType == 'E') GlobalVar.eventGenreStyleMap[genre].nodeLabelColorClass = val;
            else if (nodeType == 'M') GlobalVar.imageGenreStyleMap[genre].nodeLabelColorClass = val;
            else if (nodeType == 'B') GlobalVar.binrelGenreStyleMap[genre].nodeLabelColorClass = val;
            else if (nodeType == 'C') GlobalVar.commonGenreStyleMap[genre].nodeLabelColorClass = val;
            else alert("Error: currently not support nodeType '" + nodeType + "'");
         });
         
         // 將 nodeLabelColorClass 更新到 GlobalVar.graphNodeDict[graphNode].nodeLabelColorClass
         let graphNodeDict = GlobalVar.graphNodeDict;             // reference
         for (let graphNode in graphNodeDict) {
            let graphNodeData = graphNodeDict[graphNode];         // reference
            let nodeType = graphNodeData.nodeType;
            let genre = graphNodeData.nodeLegendCaption; 
            //console.log(nodeType + ':' + genre);
            
            if (nodeType == 'E') graphNodeData.nodeLabelColorClass = GlobalVar.eventGenreStyleMap[genre].nodeLabelColorClass;
            else if (nodeType == 'M') graphNodeData.nodeLabelColorClass = GlobalVar.imageGenreStyleMap[genre].nodeLabelColorClass;
            else if (nodeType == 'B') graphNodeData.nodeLabelColorClass = GlobalVar.binrelGenreStyleMap[genre].nodeLabelColorClass;
            else if (nodeType == 'C') graphNodeData.nodeLabelColorClass = GlobalVar.commonGenreStyleMap[genre].nodeLabelColorClass;
         }
         
         $("#overlaySetNodeLabelColor").hide();
      });

      $("#butSetNodeLabelColorCancel").click(function() {
         $("#overlaySetNodeLabelColor").hide();
      });

      // ---------------------------------
      //     節點標籤 (node labeling)
      // ---------------------------------
      
      let nodeTypeOptionHtmlList = [];
      nodeTypes.forEach(function(nodeType) {
         let s = "";
         if (checkIfEventNode(nodeType)) {      // 2025-05-11: GlobalVar.eventNodeTagNames 應該只有 event nodes，因此可排除 common nodes
            let nodeTypeDisplayName = NodeTypeNameMap[nodeType];              // 2025-07-06
            s = "<option value='" + nodeType + "'>" + nodeTypeDisplayName + "</option>";
            nodeTypeOptionHtmlList.push(s);
         }
      });
      $("#selectNodeLabelingNodeType").html(nodeTypeOptionHtmlList.join(''));

      // 注意，系統剛載入 nodeLabelingNodeType 會因 nodeTypeOptionHtmlList 為空而得到 undefined
      let nodeLabelingNodeType = $("#selectNodeLabelingNodeType option:first").val();
      $("#selectNodeLabelingNodeType").val(nodeLabelingNodeType);             // select the first option
      
      // 2025-06-04
      if (nodeTypeOptionHtmlList.length <= 1) $("#nodeLabelOptionsNodeType").hide();
      else $("#nodeLabelOptionsNodeType").show();
      
      // 註冊 select 事件
      $("#selectNodeLabelingNodeType").on("change", function() {
         let nodeType = $(this).val();
         $("#divNodeLabelList ul").hide();
         $("#divNodeLabelList ul[nodeType='" + nodeType + "']").show();
      });      

      $("#divNodeLabelList").empty();          // 2024-09-20: 注意，在此清空就代表每次使用者都得重新調整順序
      // 2025-05-11
      Object.keys(GlobalVar.eventNodeTagNames).sort().forEach(function(eventNodeType) {
         let labelTagHtmlList = [];
         let s = "<ul id='nodeLabelList' class='sortableList' nodeType='" + eventNodeType + "' style='display:none;'>";
         labelTagHtmlList.push(s);
         let tagNames = Object.keys(GlobalVar.eventNodeTagNames[eventNodeType]);
         tagNames = tagNames.sort(function(a,b) {             // 2025-06-08: 加上 sort()
            if (a === 'Udef_EventRelLite') return false;
            else if (b === 'Udef_EventRelLite') return true;
            return a > b;
         });
         tagNames.forEach(function(tagName, idx) {  
            // 2024-09-26
            let valList = [];
            for (let eNum in GlobalVar.eventNodeTagNames[eventNodeType][tagName]) {
               let tempList = GlobalVar.eventNodeTagNames[eventNodeType][tagName][eNum];     // 因為是 event node，graphNode 應與 eNum 一致
               tempList = [... new Set(tempList)];                                           // 2025-05-14: array_unique
               let val = tempList.join(';');
               
               // 2025-02-21: 加上 key='nodeLabelKey' 方便 overwrite 時找到對應位置
               if (tagName == "Udef_EventRelLite") {
                  if (GlobalVar.useEmptyEventLabelAsDefault) val = '';                       // 2025-06-04: 預設清空 node label
                  val = "<span key='nodeElementVal'>"
                      + "<span type='nodeId' key='" + eNum + "'>" + eNum + "</span>"
                      + ": <input type='text' class='userSpecifiedLabel' size='42' key='" + eNum + "' value='" + val + "'></input>"
                      + "</span>";
               }
               else {
                  val = "<span key='nodeElementVal'>"
                      + "<span type='nodeId' key='" + eNum + "'>" + eNum + "</span>"
                      + ": <span type='nodeVal'>" + val + "</span></span>";
               }
               valList.push(val);
            }
            //alert(tagName + '\n' + JSON.stringify(valList));

            // 2024-10-06: 除了 Udef_EventRelLite（為了讓底下的標籤可編輯），其他都設為 draggable
            //let draggableAttr = (tagName == "Udef_EventRelLite") ? "" : " draggable='true'";
            
            // 2025-05-12: 重新設計後，不再需 dragging 了
            draggableAttr = '';
            
            // event 是 x/y/z，image 則是 msg/piece:n
            let options = "<select name='extractLabel' title='extract which part of label string x/y/z'>"
                        //+ "<option value='full'>x/y/z (full)</option>"
                        //+ "<option value='x'>x (of x/y/z)</option>"
                        //+ "<option value='y'>y (of x/y/z)</option>"
                        //+ "<option value='z'>z (of x/y/z)</option>"
                        + "<option value='full'>full</option>"                    // x/y/z := type/norm/value
                        + "<option value='x'>type</option>"
                        + "<option value='y' selected='1'>norm</option>"          // default
                        + "<option value='z'>value</option>"
                        + "</select>"
                        
            // if (!(tagName.startsWith('Udef_Evt_')) options = '';              

            let extraStr, tagDisplayed, itemTitle;
            if (tagName == 'Udef_EventRelLite') {
               extraStr = "<span style='margin-left:6px'>"                   // 2025-01-27
                        + (GlobalVar.showSet2NodeIdButtonOnNodeLabeling ? "&#160;<button class='resetLabel'>Set to node id</button>" : '')
                        + "&#160;<button class='setLabelToNone'>Clear</button>"
                        + "</span>";
               tagDisplayed = "<span style='color:red'>Event Label</span>";
               itemTitle = tagDisplayed;
            }
            else {
               extraStr = "<span style='margin-left:6px'>"                   // 2025-01-27
                        + "&#160;" + options
                        + "&#160;<button class='overwriteLabel' title='overwrite label'>Use</button>"
                        + "&#160;&#160;<span class='showHideSamples' state='hide' title='show tag values'><i class='fa-solid fa-eye'></i></span>"    // <i class="fa-solid fa-eye-slash"></i>
                        + "</span>";
               tagDisplayed = replaceTagPrefix2Symbol(tagName);
                                     
               itemTitle = idx.toString() + '. '                               // 第 0th 項是 Udef_EventRelLite，在此 idx >= 1
                         + "<span class='tagName'>" + tagDisplayed + "</span>"
            }
            
            let s = "<li" + draggableAttr + " key='" + tagName + "'>" 
                  + itemTitle
                  + extraStr
                  + "<div class='sampleValues' >" + valList.join("<br/>") + "</div>"
                  + "</li>";
            labelTagHtmlList.push(s);
         });
         
         labelTagHtmlList.push("</ul>");
         $("#divNodeLabelList").append(labelTagHtmlList.join(''));
      });
      
      // 2025-03-09: 注意，更新 #divNodeLabelList 後需重新註冊！
      $("input.userSpecifiedLabel").off("blur").on("blur", function(evt) {
         // 2024-09-26: 更新 divNodeDisplayList（這部分的 UI 和 label 顯示同步問題，處理起來還真麻煩...）
         $("#divNodeDisplayList tr[key='" + $(this).attr("key") + "']").find("span.nodeLabel").text($(this).val());
         $("#hideNodeLabelContainer input[value!='C']").prop("checked", false);       // 2025-03-09: 自動拿掉非 common nodes 的隱藏
      });

      // 2025-03-09: 更新 #divNodeLabelList 後需重新註冊！
      $("button.overwriteLabel").off("click").on("click", function() {
         // 2025-05-12: extract prefix/infix/suffix
         let extractOption = $(this).parent().find("select[name='extractLabel']").val();
         
         // 2025-02-21
         let jqParentList = $(this).closest("ul");
         let jqUdefEventRelLite = jqParentList.find("li[key='Udef_EventRelLite']");
         let curKey = $(this).closest("li").attr("key");
         let jqNodeLabelBlock = jqParentList.find("li[key='" + curKey + "']");     // bug fix
         
         jqNodeLabelBlock.find("span[key='nodeElementVal']").each(function() {
            let nodeId = $(this).find("span[type='nodeId']").text();
            let nodeVal = $(this).find("span[type='nodeVal']").text();
            
            // 2025-05-12: 將 nodeVal 經 extractOption 處理後，更新到對應欄位的值
            let terms = nodeVal.split(';').map(function(term) {
               return extractFromVal(term, extractOption);       // 2025-06-29 改呼叫函式取值
            });
            
            // 2025-06-12: 去除重覆的值（是否需排序一下？）
            terms = [...new Set(terms)];              // array_unique
            //terms = terms.sort();
            
            let updatedVal = terms.join(';');
            
            let selector = "input[key='" + nodeId + "']";
            jqUdefEventRelLite.find(selector).val(updatedVal);
         });
         $("#hideNodeLabelContainer input[value!='C']").prop("checked", false);       // 2025-03-09: 自動拿掉非 common nodes 的隱藏
      });

      $("button.setLabelToNone").off("click").on("click", function() {
         // 2025-06-12: bug fix
         let jqNodeLabelBlock = $(this).closest("ul").find("li[key='Udef_EventRelLite']");    // $("#divNodeLabelList") 下頭可能會有 'E', 'M' 等多份 Udef_EventRelLite
         jqNodeLabelBlock.find("span[key='nodeElementVal']").each(function() {
            let nodeId = $(this).find("span[type='nodeId']").text();
            $(this).find("input[key='" + nodeId + "']").val('');                      // 2025-06-04: Hilde 建議直接給空值
         });
         $("#hideNodeLabelContainer input[value!='C']").prop("checked", false);       // 2025-03-09: 自動拿掉非 common nodes 的隱藏
      });
      
      $("button.resetLabel").off("click").on("click", function() {
         // 2025-02-21
         let jqNodeLabelBlock = $("#nodeLabelList").find("li[key='Udef_EventRelLite']");
         jqNodeLabelBlock.find("span[key='nodeElementVal']").each(function() {
            let nodeId = $(this).find("span[type='nodeId']").text();
            $(this).find("input[key='" + nodeId + "']").val(nodeId);
         });
         $("#hideNodeLabelContainer input[value!='C']").prop("checked", false);       // 2025-03-09: 自動拿掉非 common nodes 的隱藏
      });
         
      $("span.showHideSamples").off("click").on("click", function() {
         // 2025-06-11
         let state = $(this).attr("state");
         let jqLiTag = $(this).closest("li");
         //let key = jqLiTag.attr("key");
         //let jqUlTag = jqLiTag.closest("ul");
         //let nodeType = jqUlTag.attr("nodeType");
         
         if (state == 'hide') {          // 當前是隱藏狀態
            $(this).attr("title", "hide tag values");
            $(this).find("i").removeClass("fa-eye").addClass("fa-eye-slash");
            jqLiTag.find("div.sampleValues").slideDown();
            $(this).attr("state", "show");
         }
         else {
            $(this).attr("title", "show tag values");
            $(this).find("i").removeClass("fa-eye-slash").addClass("fa-eye");
            jqLiTag.find("div.sampleValues").slideUp();
            $(this).attr("state", "hide");
         }
      });

      // 2025-06-04: 預設隱藏 sampleValues
      if (!GlobalVar.showTagValueAsHintInLabelling) {
         $("#divNodeLabelList").find("li[key!='Udef_EventRelLite']")
                               .find("div.sampleValues")
                               .hide();
      }
                  
      // 顯示當前 nodeType 的 tag names
      $("#divNodeLabelList ul[nodeType='" + nodeLabelingNodeType + "']").show();

      // 2025-06-18: 自動用 Udef_DocGenre_Filename 作為節點 label
      //$("#selectNodeLabelingNodeType").val('M').change();         // 2025-06-29: 若沒有 'M' 會導致顯示為空
      $("#divNodeLabelList").find("li[key='Udef_Genre_Filename']")
                            .find("button.overwriteLabel").click();

      // 2024-09-20: 與 selectNodeLabelingNodeType 不同，這裡連 'C' node 的 label 也需可隱藏
      const nodeTypeLabel = { 'C': 'Connection',      // 2025-08-29
                              'E': 'Event',
                              'M': 'Image',
                            };
      $("#hideNodeLabelContainer").empty();           // 注意，清空後所有的 check 都會歸零
      nodeTypes.forEach(function(nodeType) {
         let s = "<input name='inputHideNodeLabel' type='checkbox' value='" 
               + nodeType + "'>"
               + "<span style='cursor:default' title='" + NodeTypeNameMap[nodeType] + " nodes'>" + nodeTypeLabel[nodeType] + "</span>"   // 2025-07-06
               + "</input>";
         $("#hideNodeLabelContainer").append(s);
      });
      
      // 2025-02-24
      GlobalVar.initHideNodeTypeLabels.forEach(function(nodeType) {
         $("#hideNodeLabelContainer input[value='" + nodeType + "']").prop("checked", true);
      });

      // ---------------------------------
      //    filtering by tag/val 選單
      // ---------------------------------
      
      // 2024-12-25: 加入 selectElementTag，選擇後顯示對應的 elementTypeValue 表
      //eventElementTags = GlobalVar.eventElementTags;         // eventElementTags[tag][content_p] = dupCnt
      
      // 2025-07-01: 以 myEventElementTags 取代 eventElementTags...
      // 2025-07-01: todo todo...
      myEventElementTags = GlobalVar.myEventElementTags;     // myEventElementTags[nodeType][tag][content_p] = dupCnt, where nodeType is 'E', 'M', or 'B'
      let myNodeTypes = Object.keys(myEventElementTags);     // 'E', 'M', 'C', etc.
      if (myNodeTypes.length == 0) return;
      
      // TODO: myEventElementTags 顯示時需排序...
      // todo todo todo

      
      let nodeTypeOptions = [];
      myNodeTypes.forEach(function(nodeType) {
         let nodeTypeDisplayName = NodeTypeNameMap[nodeType];      // 2025-07-06
         let s =`<option value="${nodeType}">${nodeTypeDisplayName}</option>`;
         nodeTypeOptions.push(s);
      });
      let nodeTypeOptionsHtml = nodeTypeOptions.join('\n');
      $("select.eventFilterNodeType").html(nodeTypeOptionsHtml);      // 注意，這裡一次設定多個 <select>  -- 即使隱藏選單也需有此設定
      
      // 2025-07-03
      if (nodeTypeOptions.length >= 2) {
         $("div.moreNodeTypes").show();
         $("div.singleNodeType").hide();
      }
      else {
         $("div.moreNodeTypes").hide();
         $("div.singleNodeType").show();
      }
      
      $("textarea.eventFilterByEventTerms").val('');         // 2025-06-30: reset
      
      
      // ---------------------------------------------------------
      
      // 2025-06-29: 似乎不需要用到 tree...
      //let udefPropertiesTagsCount = 0, udefEventTagsCount = 0;
      //let optionHtmlList = [];
      //let elementTagList = Object.keys(eventElementTags).sort();           // 注意，有加上排序
      //elementTagList.forEach(function(eTag) {                              // eTag means elementTag
      //   if (eTag == 'Udef_EventRelLite') return;                          // 跳過（雖然從 Udef_EventRelLite 項數可以看出有多少 event nodes...）
      //   if (eTag == 'Udef_Evt_MissingBundleKey') return;                  // 2025-02-17: 跳過（Udef_Evt_MissingBundleKey 主要是除錯用）
      //   
      //   if (GlobalVar.enableFilterTrees) {
      //      // 在列表中，略去 Udef_properties_xyz 和 Udef_Evt_xyz 標籤（統整放到樹狀結構）
      //      if (eTag.startsWith('Udef_properties_')) {
      //         udefPropertiesTagsCount++;
      //         return;
      //      }
      //      else if (eTag.startsWith('Udef_Evt_')) {
      //         udefEventTagsCount++;
      //         return;
      //      }
      //   }
      //
      //   // 2024-12-21: 加上「該 tag 下有多少 cues」的數字提醒...
      //   let tagCuesCount = Object.keys(eventElementTags[eTag]).length;
      //   let t = replaceTagPrefix2Symbol(eTag);
      //   w = (GlobalVar.enableCuesCountDisplay)
      //     ? " [" + tagCuesCount + "]" : '';
      //   let s = "<option value='" + eTag + "' key='" + t + "' count='" + tagCuesCount + "'>" + t + w + "</option>";
      //   optionHtmlList.push(s);
      //});
      //
      //let s, t;
      //if (GlobalVar.enableFilterTrees) {
      //   if (udefPropertiesTagsCount > 0) {
      //      t = GlobalVar.udefPropertyTreeName;
      //      s = "<option value='" + t + "' key='" + t + "' count='" + udefPropertiesTagsCount + "'>" + t + " (" + udefPropertiesTagsCount + ")</option>";
      //      optionHtmlList.push(s);
      //   }
      //   if (udefEventTagsCount > 0) {
      //      t = GlobalVar.udefEventTreeName;
      //      s = "<option value='" + t + "' key='" + t + "' count='" + udefEventTagsCount + "'>" + t + " (" + udefPropertiesTagsCount + ")</option>";
      //      optionHtmlList.push(s);
      //   }
      //}
      //
      //// 2025-06-01: 利用 key 對 option list 升冪排序（也可利用 count 轉成數字比對後，降冪排序）
      //optionHtmlList.sort((a,b) => {
      //   return ($(a).attr("key") > $(b).attr("key"));
      //});
      //
      //$("#selectElementTag").html(optionHtmlList.join("\n"));              // *EVENT, *EVENT.Genre, *EVENT_CAUSE, etc.

      //if (GlobalVar.enableFilterTrees) {
      //   // 2025-06-06: 為每個 eTag (i.e., spotlight) 產生一個 treejs 物件的 <div>
      //   // property tree
      //   let propertyTreeContainerId = 'treejs_' + GlobalVar.udefPropertyTreeName;
      //   let propertyTreeData = {};
      //   if (udefPropertiesTagsCount > 0) {
      //      $("#elementTagValTreeJs").append("<div id='" + propertyTreeContainerId + "' class='treeContainer'></div>");
      //   }
      //   
      //   // event tree
      //   let eventTreeContainerId = 'treejs_' + GlobalVar.udefEventTreeName;
      //   let eventTreeData = {};
      //   if (udefEventTagsCount > 0) {
      //      $("#elementTagValTreeJs").append("<div id='" + eventTreeContainerId + "' class='treeContainer'></div>");
      //   }
      //
      //   let propertyTags = [], eventTags = [];
      //   let treeData;
      //   elementTagList.forEach(function(eTag) {
      //      if (eTag.startsWith("Udef_properties_")) propertyTags.push(eTag);
      //      else if (eTag.startsWith("Udef_Evt_")) eventTags.push(eTag);
      //      else {
      //         // 不需額外收納的簡單標籤
      //         let treeContainerId = 'treejs_' + eTag.replace(/\./g,'_');
      //         $("#elementTagValTreeJs").append("<div id='" + treeContainerId + "' class='treeContainer'></div>");
      //         treeData = getTreeData([eTag], false);
      //         addTreeJs(treeContainerId, treeData, eTag);
      //      }
      //   });
      //   
      //   if (propertyTags.length > 0) {
      //      treeData = getTreeData(propertyTags, true);
      //      addTreeJs(propertyTreeContainerId, treeData, GlobalVar.udefPropertyTreeName);
      //   }
      //   if (eventTags.length > 0) {
      //      treeData = getTreeData(eventTags, true);
      //      addTreeJs(eventTreeContainerId, treeData, GlobalVar.udefEventTreeName);
      //   }
      //
      //}
      //else {
      //   // 注意：這裡其實產生相當多 tables（不同的 event tag 會各自產生一張表）
      //   let eTagValTableHtmlList = [];
      //   elementTagList.forEach(function(eTag) {
      //      let tableRowHtmlList = [];
      //      let s = "<table class='elementTagVal' key='" + eTag + "'>";
      //      tableRowHtmlList.push(s);
      //      let tagValList = Object.keys(eventElementTags[eTag]).sort();      // "CONSTRUCTION", "DESTRUCTION", etc. 注意，有加上排序
      //      tagValList.forEach(function(tagVal) {
      //         let v = convertToLegalTagAttrValue(tagVal);
      //         let s = "<tr>"
      //               + `<td valign="top" style='width:24px'><input name="${eTag}" type="checkbox" value="${v}"></input></td>`
      //               + "<td valign='top' xstyle='width:200px'>" + tagVal + "</td>"
      //               + "<td valign='top' align='right' style='width:32px'>" + eventElementTags[eTag][tagVal] + "</td>"
      //               + "</tr>";
      //         tableRowHtmlList.push(s);
      //      });
      //      tableRowHtmlList.push("</table>");
      //      eTagValTableHtmlList.push(tableRowHtmlList.join("\n"));
      //   });
      //   $("#divElementTagTypeValue").html(eTagValTableHtmlList.join(''));    // 每個 elementTag 有自己的 <table>
      //}

      // ---------------------------------------------------------------------------
      //     #divCommonNodesToDisplay: 選擇哪些 features 的 common node 要被顯示
      // ---------------------------------------------------------------------------
      updateCommonNodesToDisplay();
      
      // -----------------------------------------------
      //    div.divEntityTagList: overlay filter terms
      // -----------------------------------------------
      
      // 2025-06-18: overlay "Filter for nodes whose features contain the specified values:" 
      //             這裡的 feature 其實就是 characteristic 或早先版本用的 "common"，因此
      //             基本上和 divCommonNodesToDisplay 所用的的標籤是一樣的...
      
      let entityTagHtmlList = [];

      // 2025-10-04: 動態註冊（必要）
      //             先前的設計中，一個 filter 可包含多組 sub-filters，但後來決定只保留
      //             一組（但允許 AND/OR operation），因此 subFilter 名稱就不太適合了...
      $("select.filterTagValOptions").off("change").on("change", function() {
         let subFilterTagAndValueBlock = $(this).closest("div.subFilterTagAndValueBlock");
         refreshTagValueList(subFilterTagAndValueBlock);
      });
   
      // subFilterTagAndValueBlock
      // 包含 feature/term tables，All/None 按鈕，filterTagValOptions 等
      let divSubFilterHtmlList = [];
      
      Object.keys(myEventElementTags).forEach(function(myNodeType) {
         // 每種 nodeType 一個 html table，以屬性 key 區別
         entityTagHtmlList.push(`<table class="tableEntityTagList" width="100%" key="${myNodeType}">`);
         let elementTagList = Object.keys(myEventElementTags[myNodeType]);
         // 2025-09-27: 依照魯汶的建議排序...
         let myTagList = elementTagList.map(function(tag) {
            if (tag.startsWith("Udef_Evt")) return { tag, rank:1 };
            else if (tag.startsWith("Udef_properties_")) return { tag, rank:3 };
            else if (tag.startsWith("Udef_DocMeta_")) return { tag, rank:5 };
            else if (tag.startsWith("Udef_Align_")) return { tag, rank:9 };
            else return { tag, rank:10 };
         });
         
         // 依照魯汶需求，對 tags 排序
         myTagList = myTagList.sort(function(a,b) {
            if (a.rank > b.rank) return 1;
            else if (a.rank < b.rank) return -1;
            else return a.tag > b.tag;
         });
         
         myTagList.forEach(function(myTag, myIdx) {
            if (myTag.tag == 'Udef_EventRelLite') return;                     // 2025-07-19

            // 2026-04-15: 隱藏 Udef_Genre_ 標籤（使用者看不懂）
            if (myTag.tag.startsWith('Udef_Genre_')) return;
            
            // 2026-04-20: 隱藏 Udef_Img_Note（但顯示 Udef_Img_EntityClass）
            if (myTag.tag == 'Udef_Img_Note') return;

            // 2025-10-05: 若輸入的資料僅包含 event/image 的單一型態，就隱藏 Udef_Align_ 項目
            if (GlobalVar.hideAlignObjectTagSingleEventType &&                // 2025-10-05
                Object.keys(GlobalVar.myEventElementTags).length == 1) {
               if (myTag.tag.startsWith('Udef_Align_')) return;               // 2026-04-21：若只有 IMMARKUS 數據，則會隱藏 Udef_Align_OBJECT, Udef_Align_<obj>_id 等（注意，C2D 也會轉出這些標籤）
            }
            
            // 2026-04-22: 是否總是隱藏 Udef_Align_<obj>_ID 標籤
            if (GlobalVar.hideAlignObjIdTags) {
               if (myTag.tag.startsWith('Udef_Align_') && myTag.tag.endsWith('_ID')) return;
            }

            let t = replaceTagPrefix2Symbol(myTag.tag);
            //let ch = ' checked="checked"';                                  // 預設 checked
            ch = '';                                                          // 預設 unchecked
            let s = "<tr>"
                  + `<td valign="top" width="30px"><input name="inputTag_${myNodeType}_${myIdx}" class="filterTagCheckbox" type="checkbox"`
                  + ch + ` value="${myTag.tag}"></input></td>`
                  + "<td valign='top' width='92%'>" + t + "</td>"
                  + "</tr>";
            entityTagHtmlList.push(s);
         });
         entityTagHtmlList.push("</table>");
      });
      
      // 2025-07-29: 將 table.tableEntityTagList 置入一個 div block，方便後續可添加多個 sub-filters（但尚未實作）
      let divSubFilterHtml = "<div class='tagSubFilter'>"
                             + entityTagHtmlList.join('\n')
                             + "</div>";
      divSubFilterHtmlList.push(divSubFilterHtml);
      
      $("div.divEntityTagList").html(divSubFilterHtmlList.join('\n'));
      $("div.divTagValueList").html('');
      
      // 動態註冊 features table 的 checkboxes
      $("div.divEntityTagList input[type='checkbox']").off("click").on("click", function() {
         // 注意：必須確保勾選的項目僅會出現在單一 nodeType 範圍內（跨 nodeTypes 會導致 UI 亂掉）
         //let tag = $(this).val();
         
         updateFilterTags();               // 更新 filterTag (box for input features) 的值
         refreshTagValueList();            // 更新 div.divTagValueList
      });
      
      // ---------------------------------
      //      控制節點是否顯示的選單
      // ---------------------------------

      // 注意：必須呼叫 updateNodeDisplayList() 更新（顯示出）所有 nodes 和是否 display 的 checkboxes
      //       若省略呼叫，載入 DocuXml 後（尚未 apply settings）將因沒能設定 checkboxes 而無法自動隨機繪圖
      updateNodeDisplayList();
      
      // 2024-09-16: 註冊 nodeDisplayTable 相關事件      
      //$("#divNodeFilteringAndDisplay input[name=inputNodeListDetails]").click(function() {
      $("input[name=inputNodeListDetails]").off("click").click(function() {
         if ($(this).val() == 'Y') {
            $("#nodeDisplayTable div.eventElements").show();
         }
         else {
            $("#nodeDisplayTable div.eventElements").hide();
         }
      });
      
      // ----------------------------------------------
      //    Miscellaneous: 選擇節點標籤的相對位置
      // ----------------------------------------------
      
      // 2024-12-06
      let labelPosHtmlList = [];
      let labelPosOptions = ["top", "bottom"];
      
      nodeTypes.forEach(function(nodeType) {
         let t = '';
         labelPosOptions.forEach(function(labelPos) {
            let displayChkStr = (GlobalVar.nodeTypeLabelPosMap[nodeType] == labelPos ? " checked='checked'" : "");
            t += "&#160;<input name='radio_labelPos_" + nodeType + "' key='" + nodeType + "' value='" 
               + labelPos + "' type='radio'" 
               + displayChkStr + ">" + labelPos + "</input>\n"
         });
         let s = "<tr>"
               + "<td valign='top'>"
               + nodeType + "."
               + "</td><td>"
               + t
               + "</td></tr>";
         labelPosHtmlList.push(s);
      });
      let labelPosTableHtml = "<table id='tableLabelPositionOptions'>"
                            + labelPosHtmlList.join("\n")
                            + "</table>";
      $("#divLabelPositionOptionsTable").html(labelPosTableHtml);

      $("#tableLabelPositionOptions input").off("change").change(function() {
         let nodeType = $(this).attr("key");
         let val = $(this).val();
         GlobalVar.nodeTypeLabelPosMap[nodeType] = val;
      });
    
   }  // function resetControlPanel()
   
   // --- supporting functions ---

   function displayLoadedFilenames(filename) {
      if (!GlobalVar.resetDataVarsOnParsingDocuXml) {           // 2025-07-08
         $("#butLoadDocuXmlFile").attr("title", "add a DocuXml file");
         $("#spanLoadDocuXmlFile").text("Add");
      }
      GlobalVar.loadedDocuXmlFilenames.unshift(filename);       // 2025-07-08: 放到「已載入的  DocuXml filename 檔案名稱」記錄最前方
      let s = GlobalVar.loadedDocuXmlFilenames.join("<br/>");
      $("#spanDocuXmlFilename").html(s).show();                 // 若載入多個檔名，將會分行顯示
   }

   function updateCommonNodesToDisplay() {
      // 2025-01-25: 加入「僅顯示哪些 tag 的 C nodes」的選單（divCommonNodesToDisplay 的 nodeDisplayList 表單）
      //             不需加入 pull-down menu
      // 2025-08-11: (TODO) 利用 GlobalVar.tagVisibleEnodeList 列出在當前的 filtered Enodes 下，各 tag 會有多少連線...
      
      let cTagTableHtmlList = [];
      let featureOptionsHash = {};
      
      cTagTableHtmlList.push("<table class='elementTagVal' width='98%' cellspacing='0' cellpadding='2'>");
      let s = `<tr category="[ALL]">`
            + "<th width='7%'>&#160;</th>"
            + "<th align='left' style='width:60%'>Tag</th>"                // 原 'Feature'
            + "<th align='center' title='number of e-nodes which contain this feature' class='tagEnodeCount'>#</th>"
            + "<th align='left'>FeatureType</th>"                          // 原 'SharedPart'
            + "<th align='center' class='tagLinkColor'>--</th>"            // 2025-08-01
            + "</tr>";
      cTagTableHtmlList.push(s);
      
      // 2025-11-26: Udef_Align_OBJECT 需用到較細顆粒的 'text'
      let dupMethodOptionsHtmlList = [];
      Object.keys(GlobalVar.dupMethodLabel).forEach(function(dupMethod) {
         let s = `<option value="${dupMethod}">${GlobalVar.dupMethodLabel[dupMethod]}</option>`;
         dupMethodOptionsHtmlList.push(s);
      });
      
      // 2025-11-26: 除了 Udef_Align_OBJECT 需用到較細顆粒的 'text'，其他只需用到 'Tag', 'Type'
      let limitedDupMethodOptionsHtmlList = [];
      Object.keys(GlobalVar.limitedDupMethodLabel).forEach(function(dupMethod) {
         let s = `<option value="${dupMethod}">${GlobalVar.limitedDupMethodLabel[dupMethod]}</option>`;
         limitedDupMethodOptionsHtmlList.push(s);
      });
      
      // 2026-04-21: Udef_Align_<obj>_ID 用到 'Tag', 'Id'
      let limitedDupMethodOptionsHtmlList2 = [];
      Object.keys(GlobalVar.specialDupMethodLabel).forEach(function(dupMethod) {
         let s = `<option value="${dupMethod}">${GlobalVar.specialDupMethodLabel[dupMethod]}</option>`;
         limitedDupMethodOptionsHtmlList2.push(s);
      });

      // 2025-08-01: linkColorOptionsHtmlList 
      let linkColorOptionsHtmlList = [];
      Object.keys(GlobalVar.tagLinkColorList).forEach(function(tagLinkColor) {
         let val = GlobalVar.tagLinkColorList[tagLinkColor];
         // &#9608; 是滿方塊（Full Block），&#9724; 是目前最佳字元（Medium Black Square），大黑方塊 &#11035; 無法如預期顯示不同色塊...
         let s = `<option value="${val}" style="color:${val}">&#9724</option>`;
         linkColorOptionsHtmlList.push(s);
      });

      let commonTags = Object.keys(GlobalVar.commonTagsHash).sort();
      commonTags.forEach(function(cTag) {
         // 2025-10-05: 若只有一種 Event/Image 節點，就跳過（隱藏） Udef_Align_OBJECT
         if (GlobalVar.hideAlignObjectTagSingleEventType &&                // 2025-10-05
             Object.keys(GlobalVar.myEventElementTags).length == 1) {
             if (cTag.startsWith('Udef_Align_')) return;                   // 2026-04-21
         }
         
         // 2026-04-22: 是否總是隱藏 Udef_Align_<obj>_ID 標籤
         if (GlobalVar.hideAlignObjIdTags) {
            if (cTag.startsWith('Udef_Align_') && cTag.endsWith('_ID')) return;
         }
         
         //// 2026-04-21: 排除以下標籤
         //if (['Udef_Genre_Purpose', 'Udef_Genre_Source', 'Udef_Genre_Type'].includes(cTag)) return;
         
         let t = replaceTagPrefix2Symbol(cTag);

         // 2025-07-14: 不屬於事先定義好的標籤，就套用預設的 tagsComputeDupWithTagOnly 方式
         if (!GlobalVar.tagDupLookup[cTag]) {
            GlobalVar.tagDupLookup[cTag] = { dup: 'tagsComputeDupWithTagOnly'};
         }
         let tagDupMethod = GlobalVar.tagDupLookup[cTag].dup;
         let tagDupMethodLabel = GlobalVar.dupMethodLabel[tagDupMethod];
         let tagLinkColor = '';       // default: no color options
         let tagCategory = '-';
         let specialTags = ['Udef_Evt_EVENT_SOURCE_TEXT', 'Udef_Genre_Subfolder'];            // 2025-07-23
         if (cTag.startsWith('Udef_Align_') || specialTags.includes(cTag)) {
            tagCategory = 'SpecialTags';
         }
         else if (cTag.startsWith('Udef_DocMeta_')) tagCategory = 'DocMeta';                  // '#' for 'Udef_DocMeta_'
         else if (cTag.startsWith('Udef_Evt_')) tagCategory = 'Event';                        // '*' for 'Udef_Evt_'
         else if (cTag.startsWith('Udef_properties_') ||                                      // '^' for 'Udef_properties_'
                  cTag.startsWith('Udef_Genre_') ||
                  cTag.startsWith('Udef_Img_')) {                                             // 2026-04-15: 補上 Udef_Img_EntityClass
            tagCategory = 'Image';                                                          
         }
         else tagCategory = '-- Unclassified --';                                             // 舊版 C2D/I2D 仍會產生'piece_author', 'publication_place', etc. => 新版應已改為 Udef_DocMeta_ 標籤
         featureOptionsHash[tagCategory] = 1;
         
         // 2025-11-26: Hilde 想要有更多彈性，因此改回採用「讓使用者可動態指定 dupMethod」的 select menu
         //let optionHtml = (cTag.startsWith('Udef_Align_OBJECT'))       // 2026-04-21: Udef_Align_OBJECT 改為 Udef_Align_ 起頭的標籤
         let optionHtml = [];
         if (GlobalVar.tagsWithAllDupOptions.includes(cTag)) {           // 2026-05-11: Tag, Type, Id, Text
            // 2026-04-21: 只有 Udef_Align_OBJECT 開啟完整的 select menu，其他（包含 Udef_Align_<obj>_ID）都採用有限制的 menu
            optionHtml = dupMethodOptionsHtmlList.join('');
         }
         else if (cTag.startsWith('Udef_Align_')) {                      // Tag, Id
            // 2026-04-21
            optionHtml = limitedDupMethodOptionsHtmlList2.join('');
         }
         else {                                                          // Tag, Type
            optionHtml = limitedDupMethodOptionsHtmlList.join('');
         }
         
         let w1 = `<span dupMethod="${tagDupMethod}">${tagDupMethodLabel}</span>`;
         if (GlobalVar.enableDynamicDupMethod) {       // 開啟 FeatureType 選單
            w1 = "<select class='selectDupMethod'>"
               + optionHtml
               + "</select>";
         }

         // 2025-08-02: 由於瀏覽器對原生 <select> 的 CSS 支援有限，雖可用 <option style="color:xxx"> 調整字體顏色，
         //             但 hover 時字體卻會變成黑色（問題是，自己不怎麼想花力氣加上 customized select 介面...）
         let w2 = '';
         if (GlobalVar.enableUserTagLinkColor) {
            w2 = "<select class='selectTagLinkColor'>"
               + linkColorOptionsHtmlList.join('')
               + "</select>";
         }
         
         // 2025-08-11
         let w3 = GlobalVar.tagVisibleEnodeList[cTag]?.length ?? '-';     // let z = x.a?.[b] ?? c;

         let s = `<tr category="${tagCategory}">`
               + "<td valign='top'>"
               + `<input name="inputCommonNodeTag" type="checkbox" value="${cTag}" dupMethod="${tagDupMethod}" checked="checked"></input>`
               + "</td>"
               + `<td valign="top" class="tagNameAbbr" tagName="${cTag}">${t}</td>`         // tag
               + "<td valign='top' align='right' class='tagEnodeCount'>" + w3 + "</td>"     // #
               + "<td valign='top'>" + w1 + "</td>"                                         // FeatureType
               + "<td valign='top' class='tagLinkColor'>" + w2 + "</td>"
               + "</tr>";
         cTagTableHtmlList.push(s);
      });
      cTagTableHtmlList.push("</table>");
      $("#divCommonNodesToDisplay").html(cTagTableHtmlList.join("\n"));
      
      //$('select.selectTagLinkColor').select2({
      //  width: '42px', 
      //  templateResult: function (data) {
      //    var $result = $('<span style="color:' + $(data.element).data('color') + '">' + data.text + '</span>');
      //    return $result;
      //  }
      //});

      // 2025-08-02
      if (!GlobalVar.enableUserTagLinkColor) $("#divCommonNodesToDisplay").find(".tagLinkColor").hide();

      // 2025-08-11
      if (!GlobalVar.enableTagEnodeCount) $("#divCommonNodesToDisplay").find(".tagEnodeCount").hide();
      
      let featureOptions = Object.keys(featureOptionsHash);
      featureOptions.unshift('[ALL]');

      let featureOptionHtmlList = featureOptions.map((v) => `<option value="${v}">${v}</option>`);
      $("#selectFeatureCategory").html(featureOptionHtmlList.join("\n"));
      
      $("#selectFeatureCategory").off("change").on("change", function() {
         let val = $(this).val();
         $("#divCommonNodesToDisplay").find("tr").show();          // 先通通設為顯示
         if (val == '[ALL]') return;
         else {
            $("#divCommonNodesToDisplay").find("tr")
                                         .filter(function() {
                                            const cat = $(this).attr("category");
                                            return (cat !== val && cat !== "[ALL]")
                                         })
                                         .hide();
         }
      });
      
      $("#divCommonNodesToDisplay input[type='checkbox']").off("change").on("change", function() {
         // 也可用 input[name='inputCommonNodeTag']
         setRemindComputeButton();
      });

      // 2025-07-22: 獨立出 switchSelectDupMethodBasedOnDupLookup() 函式
      switchSelectDupMethodBasedOnDupLookup();
      
      // 2025-07-18
      $("#divCommonNodesToDisplay select.selectDupMethod").off("change").on("change",function() {
         let dupMethod = $(this).val();
         let tag = $(this).closest("tr").find("td.tagNameAbbr").attr("tagName");
         //alert(tag + ':' + dupMethod);
         GlobalVar.tagDupLookup[tag].dup = dupMethod;                    // 2025-07-24

         // 2025-12-02: 使用者更動 FeatureType 選單（REDRAW 必須重新計算 C-nodes）
         GlobalVar.featureTypesChanged = true;
         
         // 2025-07-20
         setRemindComputeButton();
      });
      
      // 2025-08-01
      $("#divCommonNodesToDisplay select.selectTagLinkColor").off("change").on("change",function() {
         let tagLinkColor = $(this).val();
         $(this).css('color', tagLinkColor);                             // 2025-08-02: 將 select 框的字體換色
         let tag = $(this).closest("tr").find("td.tagNameAbbr").attr("tagName");
         GlobalVar.tagDupLookup[tag].pathColor = tagLinkColor;           // 2025-08-01

         // 調整連線顏色，可以直接按 REDRAW（不需重新計算）
         //$("button.butComputeFilteredNodes").addClass("remindToClick");
         //$("#butApplySettingsAndRedraw").addClass("disabled");         // 按下 "Compute filtered nodes" 鈕之前，不允許按 REDRAW 鈕
      });

      // 2025-01-24: 預設將幾個「似乎較為重要」的 tags 勾選起來
      checkDefaultCommonNodeTags();
   }

   function updateFilterTags() {
      // 將勾選結果以字串形式，更新到 div.subFilter 下 @key 為 lastKey 值的 filterTag input box
      lastKey = $("div.subFilter").last().attr("key");
      let filterTagList = [];
      $("div.subFilterTagAndValueBlock").find("input.filterTagCheckbox[type='checkbox']:checked").each(function() {
         filterTagList.push($(this).val());
      });
      $(`div.subFilter[key='${lastKey}']`).find("input.filterTags").val(filterTagList.join('|'));
   }
   
   function updateFilterEntityTerms() {
      let filterTermList = [];
      $("div.divTagValueList input[type='checkbox']:checked").each(function() {
         let term = $(this).val();
         filterTermList.push(term);
      });
      
      let lastKey = $("div.subFilter").last().attr("key");
      $(`div.subFilter[key='${lastKey}'] input.filterEntityTerms`).val(filterTermList.join('|'));
   }

   function refreshTagValueList() {
      // 2025-06-19
      // 取得 div.divEntityTagList 所有打勾項目的 tags。接著透過 GlobalVar.commonTagsHash[tag] 
      // 取得每個 tag 的 valList，將它們串接起來，移除重覆值後排序
      // 2025-06-30: todo todo 加上 select.filterTagValOptions 從 value 取出部分字串
      
      // 2025-09-25: 改為固定只有一份 div.subFilterTagAndValueBlock
      let subFilterTagAndValueBlock = $("div.subFilterTagAndValueBlock");
      
      let extractOption = subFilterTagAndValueBlock.find("select.filterTagValOptions").val();       // full, x, y, z, etc.
      
      let termList = [];
      subFilterTagAndValueBlock.find("div.divEntityTagList input[type='checkbox']:checked")
                               .each(function() {
         let tag = $(this).val();
         let valList = GlobalVar.commonTagsHash[tag];
         valList = valList.map(function(val) {
            return extractFromVal(val, extractOption);
         });
         termList = termList.concat(valList);
         //alert(JSON.stringify(termList));
      });
      
      // 移除重覆值再排序
      termList = [...new Set(termList)].sort();              // array_unique()   
      
      // 2025-07-07: 排序後，在最前方加上 [ANY], [NONE] 選項
      if (GlobalVar.enableFilterTermAsAnyNone) {
         termList.unshift('[ANY]', '[NONE]');
      }
       
      let termHtmlList = [];
      termHtmlList.push("<table class='TagTermList' width='100%'>");
      termList.forEach(function(term, tIdx) {
        let ch = '';
        let s = "<tr>"
              + `<td valign="top" width="30px"><input name="inputTagVal_${tIdx}" type="checkbox"`
              + ch + ` value="${term}"></input></td>`
              + "<td valign='top' width='92%' style='word-break:break-all'>" + term + "</td>"
              + "</tr>";
        termHtmlList.push(s);
      });
      termHtmlList.push("</table>");

      // 更新 div.divTagValueList
      subFilterTagAndValueBlock.find("div.divTagValueList").html(termHtmlList.join('\n'));

      // 修改 html 碼後，需動態註冊
      subFilterTagAndValueBlock.find("div.divTagValueList input[type='checkbox']")
                               .off("click").on("click", function() {
         let term = $(this).val();
         updateFilterEntityTerms();
      });
   }
   
   // --------------------------------------------------------------------------------
   
   function showSelectedElementTags() {
      // 2025-06-06 獨立出來
      let curElementTag = $("#selectElementTag").val();
      //if (GlobalVar.enableFilterTrees) {
      //   displaySpotlightTreeJs(curElementTag);
      //}
      //else {
         $("#divElementTagTypeValue table.elementTagVal").hide();
         $("#divElementTagTypeValue table.elementTagVal[key='" + curElementTag + "']").show();
      //}
   }
   
   function getNodeDisplayListDisplayTableHtml(graphNodeDict) {
      // 2024-09-30: 獨立出來，如此方便更動 (common) nodel labels 時，可重新取得 displayTableHtml
      let graphNodes = Object.keys(graphNodeDict);

      let nodesHtmlList = [];
      graphNodes.forEach(function(graphNode) {
         // 2025-06-21: 注意，graphNode 若為 'CX' node，預設都應該是 checked...
         let nodeObj = graphNodeDict[graphNode];
         //alert(graphNode + " ==> " + JSON.stringify(nodeObj));
         let display = (nodeObj.display === true || nodeObj.display === "true" || graphNode.startsWith('CX'));        // convert to boolean
         let labelDisplay = (nodeObj.labelDisplay === true || nodeObj.labelDisplay === "true");                       // convert to boolean
         let displayChkStr = (display ? " checked='checked'" : "");               // 2025-06-21: ChatGPT 說不能用 checked='1'，但嘗試了似乎沒差？
         let labelDisplayChkStr = (labelDisplay ? " checked='checked'" : "");

         let t = "";                          // 2024-09-13: no time info
         if (nodeObj.nodeType == 'C') ;       // 暫不考慮 common nodes 的時間範圍（雖然顯示 common nodes 時間範圍似乎也頗有意思，但 event nodes 還是主角）
         else if (nodeObj.eventTimeNotBefore == -9999 && nodeObj.eventTimeNotAfter == 9999) ;
         else {
            t = "<span class='nodeYearRange' key='" + graphNode + "'>"    // 2024-10-02: 加上 @key
              + nodeObj.eventTimeNotBefore + " - " + nodeObj.eventTimeNotAfter
              + "</span>";
         }
         
         // 2024-09-14
         let w = "";
         if (nodeObj.nodeType != 'C') {
            let evtNode = graphNode;
            let colorIdx = "00";
            let eventSourceTextAsHeaderBar = false;
            // 2024-09-17: 加上 key 方便後續 highlight 時對此標籤內容進行取代
            // 2025-12-08: 對 Chromium 而言，getEventElementsHtml() 計算相當耗時！
            w = "<div class='eventElements' key='" + graphNode + "' style='display:none'>"        // deafult hidden
              //+ getEventElementsHtml(graphNode, evtNode, colorIdx, eventSourceTextAsHeaderBar)
              + ' --(skipped)-- '     // 2025-12-08: 略過以加速
              + "</div>";
         }
         
         // 2024-10-02: bug fix adds name='nodeDisplay' to <input>
         // e.g., <tr key="C049"><td valign="top"><input id="chkbox_C049" name="nodeDisplay" key="C049" type="checkbox"></td><td valign="top">C049</td><td valign="top"><span class="nodeLabel">SPONSOR:縣尉</span></td><td valign="top" align="right"></td></tr>
         //       <tr key="C050"><td valign="top"><input id="chkbox_C050" name="nodeDisplay" key="C050" type="checkbox" checked="1"></td><td valign="top">C050</td><td valign="top"><span class="nodeLabel">EVENT:DESTRUCTION/圮</span></td><td valign="top" align="right"></td></tr>
      
         let s = "<tr key='" + graphNode + "'>"
               + "<td valign='top'>"
               + "<input id='chkbox_" + graphNode + "' name='nodeDisplay' key='" + graphNode + "' type='checkbox'" + displayChkStr + "></input>"
               + "</td><td valign='top'>"
               + graphNode
               + "</td><td valign='top' style='width:320px'>"
               + "<span class='nodeLabel'>" + nodeObj.graphNodeLabel + "</span>"
               + w
               + "</td><td valign='top' align='right'>"
               + t
               + "</td>"
               + "</tr>";
         nodesHtmlList.push(s);
         //console.log(graphNode + ':' + s);
      });

      // 2024-10-12
      let headerRow = "<thead><tr>"
                    + "<th class='nodeDisplay'>-</th>"
                    + "<th class='nodeDisplay'>node</th>"
                    + "<th class='nodeDisplay'>label</th>"
                    + "<th class='nodeDisplay'>range</th>"
                    + "</tr></thead>";
      let displayTableHtml = '<table id="nodeDisplayTable">'      // nodeDisplayTable 是動態添加的
                           + headerRow
                           + "<tbody>" + nodesHtmlList.join("\n") + "</tbody>"
                           + "</table>";
      return displayTableHtml;
   }
   
   function applyPanelToTableDataAndDrawGraph() {
      // 2025-05-18: 這個函式變得相當複雜且耗時，有疊床架屋感，日後有機會應該需進行重構
      // 按下 "apply settings and redraw" 後，在此執行許多複雜的設定和處理
      // 注意：若只套用到 GlobalVar.graphNodeDict，將不會影響到 tableData
      // => 目前採取的方式：直接更新 GlobalVar.tableData 和 GlobalVar.nodeTypeShapeMap
      
      // 2025-07-31
      $("#butStopSimulation").click();
      
      // 2025-10-23
      setPinnedNodePosition();
      
      showProgressMsg("apply...");                     // 2025-05-18
      window.setTimeout(applySettingsAndRedraw, 100);

      // -------------------------------------------------------------------------------------------
      //     inner functions of applyPanelToTableDataAndDrawGraph() -- 其實只是為了顯示進度訊息
      // -------------------------------------------------------------------------------------------
      
      function applySettingsAndRedraw() {
         let tableData = GlobalVar.tableData;
         let graphNodeDisplayDict = {};
         
         // 2025-07-07: 從 panel 介面取得相關設定
         GlobalVar.addExtraConnections = $("input[name='showExtraConnections']").is(":checked");
         GlobalVar.hideGraphNodeTagPrefix = !$("input[name='showPrefixSymbols']").is(":checked");
         GlobalVar.commonLabelIncludesTagName = $("input[name='commonLabelAlwaysShowTag']").is(":checked");     // 2025-08-20

         // 從 panel 介面取得 display 等訊息
         let inputNodeSize = $("input[name='nodeSize']:checked").val();               // 2024-10-03
         GlobalVar.nodeSizeRadius = NodeSizeMap[inputNodeSize];
         
         let nodeFontSize = $("input[name='nodeFontSize']:checked").val();            // 2024-11-01
         GlobalVar.nodeFontSizeClass = FontSizeMap[nodeFontSize] || 'fontSizeMedium';
         
         GlobalVar.drawNodeLinkAsArc = ($("input[name='nodeLinkType']:checked").val() == 'arc')     // 2024-09-30
                                     ? true : false;
                                     
         // 2024-09-21: 若 hide node display 被勾選，所有該類型的節點都不顯示 label
         //             從 control panel 只能設定「所有該類型節點的標籤顯示」（若需個別設定，需透過 tabulator）
         let hideNodesWithNodeType = [];
         $("input[name='inputHideNodeLabel']:checked").each(function() {
            hideNodesWithNodeType.push($(this).val());
         });
      
         // 2024-09-22
         let nodeLabelingTagOrder = {};
         $("#divNodeLabelList ul").each(function() {
            let nodeType = $(this).attr("nodeType");
            if (!nodeLabelingTagOrder[nodeType]) nodeLabelingTagOrder[nodeType] = {};
            $(this).find("li span.tagName").each(function(idx) {
               let tagName = $(this).text();
               nodeLabelingTagOrder[nodeType][tagName] = idx + 1;
            });
         });
         
         // 2025-06-06: 此步驟若省略會出錯...
         $("#divNodeDisplayList").find("input[name='nodeDisplay']").each(function() {
            let graphNode = $(this).attr("key");
            let displayVal = $(this).is(':checked');
            // 注意：後續在 second pass 會設定 GlobalVar.tableData，函式最後會再透過
            //       convertTableDataAndApplyCommonNodeDisplayFilter() 依照 tableData 更新 graphNodeDict
            graphNodeDisplayDict[graphNode] = displayVal;        
         });
         
         //alert("first-pass");
         // first-pass: (1). tag unification （將特定「標籤加內容」對應到新的「標籤加內容」）
         //             (2). set the node label to display
         let nodeTagLabelDict = {};                 // e.g., nodeTagLabelDict['E001']=[<row.tagName>,<row.graphNodeLabel>]
         tableData.forEach(function(row) {
            let tagName = row.tagName;
            let content = row.content;
           
            // 2024-09-26: 注意，label 需考慮所有該事件的 rows，因此是用 eNum 而非 graphNode 來判斷
            let eNum = row.eNum;
            let nodeType = eNum.substr(0,1);
            if (checkIfEventNode(nodeType)) {             // should always pass
               if (tagName == "Udef_EventRelLite") {
                  // 取得 $("input.userSpecifiedLabel[key='<eNum>'") 值，更新到 row.graphNodeLabel 與 row.content （對 "Udef_EventRelLite" row 而言，此二值需保持一致）
                  content = $("input.userSpecifiedLabel[key='" + eNum + "']").val();
                  row.graphNodeLabel = $("<div/>").append(content).text();           // 2024-12-31: 可省略（後面會因為 nodeTagLabelDict 再更新一次）
                  row.content = content;
               }
               if (nodeTagLabelDict[eNum]) {
                  let [curTagName, curGraphNode] = nodeTagLabelDict[eNum];
                  if (nodeLabelingTagOrder[nodeType][tagName] < nodeLabelingTagOrder[nodeType][curTagName]) {
                     nodeTagLabelDict[eNum] = [tagName, content];
                  }
               }
               else nodeTagLabelDict[eNum] = [tagName, content];
            }
            
            if (row.graphNode.substr(0,1) == 'C') {       // common node
               // 2024-09-30
               // 依照 GlobalVar.commonLabelIncludesTagName 設定更新 common node label 
               // cf. computeDuplicateAndUpdateDisplayGroup() 也會進行類似設定... 有可能重覆執行？
               // 注意：nodeDisplayList 中的「主顯示 row」並不會改變（這裡的邏輯有些亂，以後再想看看怎麼處理比較好...）
               
               // 2024-10-15: bug fix (for immarkus 'M' nodes)
               let rowTagName = row['tagName'];
               let commonNodeTagName = row['tagName'];
               if (rowTagName.indexOf("Udef_Evt_") == 0) {                 // for comarkus events
                  commonNodeTagName = (GlobalVar.showAbbrPrefixInEventLabel ? '*' : '')
                                    + rowTagName.substr("Udef_Evt_".length);   
               }
               else if (rowTagName.indexOf("Udef_properties_") == 0) {     // for immarkus events
                  commonNodeTagName = (GlobalVar.showAbbrPrefixInEventLabel ? '^' : '') 
                                    + rowTagName.substr("Udef_properties_".length);
               }
               else if (rowTagName.indexOf("Udef_DocMeta_") == 0) {        // 2025-01-05: for document metadata tags
                  commonNodeTagName = (GlobalVar.showAbbrPrefixInEventLabel ? '#' : '')
                                    + rowTagName.substr("Udef_DocMeta_".length);
               }
      
               let nodeLabel = $("<div/>").append(row.content).text();          // e.g., 'RENOVATION/create/建創'
               
               // 2025-07-18: 經由 EventConnectionGraph-tabulator.js 的 getCommonNodeLabel() 函式透過 GlobalVar.tagDupLookup[tag] 判斷 label 的顯示模式
               let prependTag = GlobalVar.commonLabelIncludesTagName;                 // 2025-08-20
               nodeLabel = getCommonNodeLabel(row.tagName, nodeLabel, prependTag);    // 函式在 EventConnectionGraph-tabulator.js
              
               row['graphNodeLabel'] = nodeLabel;
            }
         });
         
         // second-pass: apply nodeTagLabelDict[graphNode] to set node label
         //              since row display is independent of node label, also set node display in this pass
         tableData.forEach(function(row) {
            let nodeType = row.graphNode.substr(0,1);
      
            // 2024-09-22: set graphNodeLabel（將計算好的 nodeTagLabelDict[graphNode] 套用到 row.graphNodeLabel）
            //             注意，在此同步更新 tableData 與 graphNodeDict
            let graphNode = row.graphNode;
            if (checkIfEventNode(nodeType)) {
               if (nodeTagLabelDict[graphNode]) {        // nodeTagLabelDict[graphNode] 應該都成立？
                  let [tagName, tagContent] = nodeTagLabelDict[graphNode];
                  let s = $("<div/>").append(tagContent).text();                    // 2024-12-31
                  row.graphNodeLabel = s;                                           // tagName + ': ' + tagContent
                  GlobalVar.graphNodeDict[graphNode].graphNodeLabel = s;
               }
            }
            else {
               // 2024-09-30: common node
               if (!GlobalVar.graphNodeDict[graphNode]) alert("OH! " + graphNode + " -- undefined!" + row.id + '--' + row.graphNode);
               GlobalVar.graphNodeDict[graphNode].graphNodeLabel = row.graphNodeLabel;
            }
      
            // 2024-09-21: 將 hideNodesWithNodeType 型態節點的 labelDisplay 都設為 'false'
            if (hideNodesWithNodeType.includes(nodeType)) row.labelDisplay = 'false';
            else row.labelDisplay = 'true';              // 考慮是否不要加上這行...
      
            // set row display simultaneously: 將 panel divNodeDisplayList 中，各節點當前的 display 值套用到 table rows
            row.display = graphNodeDisplayDict[row.graphNode];
            
            // 2025-05-30: 最後，藉由 GlobalVar.graphNodeDict[graphNode].nodeColorIdx 更新 row.nodeColorIdx
            row.nodeColorIdx = GlobalVar.graphNodeDict[graphNode].nodeColorIdx;
         });
         
         //// 2024-08-20: node shape
         //$("#divNodeShape").find("input[type='radio']:checked").each(function() {
         //   let nodeType = $(this).attr("key");
         //   let nodeShape = $(this).val();
         //   GlobalVar.nodeTypeShapeMap[nodeType] = nodeShape;
         //});
         
         // 2025-05-16: node label color
         $("#panelnodeLabelColorClass").find("input[type='radio']:checked").each(function() {
            let nodeType = $(this).attr("key");
            let labelColorClass = $(this).val();
            GlobalVar.nodeTypeLabelClassMap[nodeType] = labelColorClass;
         });
      
         //console.log(GlobalVar.graphNodeDict);
         //alert(JSON.stringify(graphNodeDisplayDict));

         //// 2025-05-26: 將 overlay filter category 的 ui 狀態設定到 event filter category cue 字串中
         //setFilterCategoryCueByOverlayEventFilter();
         
         showProgressMsg("update...");
         window.setTimeout(updateAndApplyDisplayFilter, 100);
      }
      
      function updateAndApplyDisplayFilter() {
         // 以下步驟頗耗時... （尤其是 convertTableDataAndApplyCommonNodeDisplayFilter，似乎和先前某些步驟重覆？）
         updateNodeDisplayList();                             // 因為 apply and redraw 會因設定而改動 node display，因此需更新哪些節點需顯示

         convertTableDataAndApplyCommonNodeDisplayFilter();   // 呼叫 convertTableData2graphNodeDict() 和 applyCommonNodeDisplayFilter() (cf. EventEntityGraph-graph.js)
         
         showProgressMsg("drawing..."); 
         window.setTimeout(function() {
            hideProgressMsg();
            drawGraph();                               // 依照最後結果繪圖
         }, 250);
      }
   
   }
   
   function setTagUnificationCheckboxes() {
      // 2024-10-16: 依照 GlobalVar.tagUnificationMap 設定 UI 列表中的勾選項目
      //alert(JSON.stringify(GlobalVar.tagUnificationMap));
      let selector = "#tagUnificationMappingTable tr input[name='tagUnifItem']";
      $(selector).each(function() {
         let jqTr = $(this).closest("tr");
         let mapKey = jqTr.find("td[key='key']").text();
         //let mapVal = jqTr.find("td[key='val']").text();
         let existed = (GlobalVar.tagUnificationMap[mapKey] !== undefined);
         $(this).prop("checked", existed);
      });
   }
   
   function setTagUnificationMapByChecks() {
      // 2024-10-16: 依照 UI 列表中的勾選項目設定 GlobalVar.tagUnificationMap
      GlobalVar.tagUnificationMap = {};             // reset
      let selector = "#tagUnificationMappingTable tr input[name='tagUnifItem']";
      $(selector).each(function() {
         let jqTr = $(this).closest("tr");
         let mapKey = jqTr.find("td[key='key']").text();
         let mapVal = jqTr.find("td[key='val']").text();
         let checked = $(this).prop("checked");
         if (checked) {
            // 2025-07-05
            let [sourceTag, sourceContent] = mapKey.split(':');
            let [targetTag, targetContent] = mapVal.split(':');
            GlobalVar.tagUnificationMap[sourceTag] = { sourceContent, targetTag, targetContent };
         }
      });
   }
   
   function setTagUnificationMapAndApplyIt() {
      // 2024-10-17
      // (1). 依據 UI 的 checkboxes 設定 GlobalVar.tagUnificationMap
      // (2). 依據 GlobalVar.tagUnificationMap 修改 tableData 的 tagName 和 content
      // (3). computeDuplicateAndUpdateDisplayGroup()
      // (4). convertTableData2graphNodeDict(GlobalVar.tableData)
      // (5). updateCommonNodesToDisplay()
      
      // step (1) -- set GlobalVar.tagUnificationMap
      setTagUnificationMapByChecks();

      // 2024-10-16: for tag unification
      //             tagUnificationMap["<src_tag>:<src_content>"] := "<target_tag>:<target_content>"
      let tableData = GlobalVar.tableData;
      let tagUnificationMap = GlobalVar.tagUnificationMap;           // reference
      
      // step (2): 2025-07-05 改 tagUnificationMap[<source_tag>] := { sourceContent, targetTag, targetContent }
      tableData.forEach(function(row) {
         let origTagName = row['origTagName'];
         let target = tagUnificationMap[origTagName];
         if (target) {
            let origContent = row['origContent'];
            let srcPat = target.sourceContent.replace(/[\*]/g, '([^/]+)');
            
            try {
               const regex = new RegExp(srcPat, 'g');
               row.tagName = target.targetTag;
               row.content = origContent.replace(regex, target.targetContent);
               if (GlobalVar.genre4UnifiedFeature) {
                  allocateCommonTypeColor(LegendCaption.unifiedFeature);              // 2025-06-23
                  row.nodeLegendCaption = LegendCaption.unifiedFeature
               }

               //alert(row.tagName + "\n" + row.content);
            } catch (e) {
               console.error("Failed to convert pattern: " + origContent);
               return;      // 跳過這個 row 不處理
            }
         }
      });
      
      // step (3)
      computeDuplicateAndUpdateDisplayGroup();

      // step (4): 更新 GlobalVar.graphNodeDict
      convertTableData2graphNodeDict(GlobalVar.tableData);     // 2024-10-18: 因為 common nodes 會產生變化，因此也需更新 graphNodeDict

      // step (5). 2025-07-05: 更新 #divCommonNodesToDisplay （加入新的 unification features）
      updateCommonNodesToDisplay();
      updateNodeDisplayList();                                 // 注意，也必須呼叫此函式！（否則若在 common node 直接將 Udef_Unification_XXX 打勾，計算 filtering 會跳出錯誤）
   }
   
   function updateNodeDisplayList() {
      // 取得「每個節點是否顯示」的詳細 html 表單（目前雖已隱藏，但還是留著以保留彈性）
      // 後續需要透過這個表格，取得哪些 graphNode 需顯示，哪些需隱藏...
      let displayTableHtml = getNodeDisplayListDisplayTableHtml(GlobalVar.graphNodeDict);
      $("#divNodeDisplayList").html(displayTableHtml);
     
      // 2025-06-21: 有些奇怪，若沒有額外「強迫」將 'CX' nodes 的 checkbox 設為 true，後續 .is(":checked") 還是會得到 false...
      //             => 必須用 $("#nodeDisplayTable").find("input[type='checkbox'][key^='CX']").prop("checked",true); 先將其設為 true
      //$("#nodeDisplayTable").find("input[type='checkbox'][key^='CX']")
      //                      .prop("checked",true);
      
      // 2024-10-12: 註冊 <th class="nodeDisplay"> -- 由於 #nodeDisplayTable 內容會動態改變，需清除舊的事件註冊
      $("#nodeDisplayTable th.nodeDisplay").off("click").on("click", function() {
         let sortKeyMap = { '-': 'unchecked',         // 從 <th> 的顯示值，對應到 rowObj 的屬性名稱
                            'node': 'graphNode',
                            'label': 'label',
                            'range': 'range' };
         let sortKey = sortKeyMap[$(this).text()];
         //alert(sortKey);
         
         let rows = [];
         $("#nodeDisplayTable").find("tbody tr").each(function() {
            // 注意：這裡是依序從 <td> 取出內容，表示 <tr> 中若欄位更動，就會受到影響
            let jqRow = $(this);
            let rowCells = [];           // e.g., ["","C001","EVENT:RENOVATION/築",""]
            $(this).find("td").each(function() {
               rowCells.push($(this).text());
            });
            let unchecked = $(this).find("td input").is(":checked") ? 0 : 1;   // 若勾選就設為 0，否則設為 1 （方便排序時將「勾選」的項目排在前面）
            let graphNode = rowCells[1];
            let label = rowCells[2];
            let range = rowCells[3] || -9999;       // parseInt("123-456") = 123, parseInt("") = NaN, NaN || 123 = 123
            let rowObj = { unchecked, graphNode, label, range, jqRow };
            rows.push(rowObj);
         });
         
         rows.sort(function(a,b) {
            // 若回傳值小於零，a 會被放在 b 之前
            let x = a[sortKey], y = b[sortKey];
            let cmp = 0;
            if (typeof(x) == 'string') cmp = x.localeCompare(y);                 // 若 x < y 回傳 -1
            else cmp = x - y;
            //if (cmp == 0) cmp = a['graphNode'].localeCompare(b['graphNode']);  // 因 graphNode 唯一，因此 cmp 不會是零
            if (cmp == 0) cmp = a['label'].localeCompare(b['label']);            // 2024-10-27
            return cmp;
         });
         //alert(JSON.stringify(rows));
         
         let jqTbody = $("#nodeDisplayTable").find("tbody");
         jqTbody.empty();                  
         rows.forEach(function(row) {
            jqTbody.append(row.jqRow);
         });
         
         // 注意：empty() 清空也會移除事件，表格經 append() 補上後，事件需重新註冊...
         $("#nodeDisplayTable input[name=nodeDisplay]").off("change").change(function() {
            updateCheckedNodesCountAndGraphNodeDict();
         });
      });
      
      $("#nodeDisplayTable input[name=nodeDisplay]").off("change").change(function() {
         updateCheckedNodesCountAndGraphNodeDict();
      });
   }
   
   // ------------------------------
   //   functions to support UI
   // ------------------------------
   
   //function showMyOverlayBeforeDrawGraph() {
   //   $("#myOverlay").show();
   //}
   
   //function hideMyOverlayAndDrawGraph() {
   //   $("#myOverlay").hide();                        // .slideUp()
   //   $("#butGraphView").click();                    // 關掉 overlay 之後才繪圖
   //}
   
   // ------------------------------
   //     UI control functions
   // ------------------------------

   $("#toolTitle").dblclick(function(evt) {          // 2025-06-09: 改 dblclick
      if (evt.ctrlKey && evt.shiftKey) {             // 2025-01-10: ctrl+shift click
         GlobalVar.experimentMode = !GlobalVar.experimentMode;
         $(".experimentFeatures").toggle();
      }
   });
   
   // 2024-11-04: function buttons
   $("#butResetPage, #funcButResetPage").click(function() {
      // 2024-09-14: 由於僅清除 GlobalVar 和 svg 似乎還是會有 bugs，reset 就是直接從新載入工具頁面...
      //             => 理論上應該可以在程式內進行 reset，日後若有時間，應該再試看看...
      window.location.reload();
   });
   
   $("#butLoadDocuXmlFile, #funcButLoadDocuXmlFile").click(function(evt) {
      $("span.highlightAtStart").removeClass("highlightAtStart");     // 2025-06-11
      $("#butHideNodeContentArea").trigger("click");                  // 2025-12-24: bug fix (先隱藏，再載入新檔)
      window.setTimeout(function() {
         $("#loadDocuXmlFile").click();            // 觸發 <input type="file"> 的「讀取檔案」機制
      }, 100);
   });

   $("#butShowGraphControlPanel, #funcButShowGraphControlPanel").click(function() {
      $("#tableArea").hide();    // 2025-01-09: 隱藏 tableArea
      
      // 2024-10-16: 展開 graph control panel 時，需更新 tag unification 的 UI 項目
      //             若使用者修改 tag unification checkboxes 的勾選項目後，直接關閉再打開 control panel，
      //             tag unification items 應會回設為「尚未按下 apply tag unification」的狀態
      setTagUnificationCheckboxes();

      // 2025-02-09: 注意，需確保有取得 window.innerWidth（否則 control 會因在 left 負值的位置，顯示不出來）
      let slideWay = GlobalVar.controlPanelOnRightHandSide ? "right" : "left";
      if ($("#graphControlPanel").is(":visible")) {
         $("#graphControlPanel").hide("slide", { direction: slideWay }, 600);         // jquery-ui
      }
      else $("#graphControlPanel").show("slide", { direction: slideWay }, 600);       // jquery-ui
      //$("#graphControlPanel").show("slide", { direction: slideWay }, 600);
      
      $("#butEventNodeFiltering").click();
      
      // 2025-10-01: 呼叫 hideNodeContent() 以避免 graphControlPanel 被 node content 遮蔽（node content 顯示在 control panel 上方）
      $("#butHideNodeContentArea").trigger("click");
   });

   $("#butExportSvgFile, #funcButExportSvgFile").click(function() {
      if (GlobalVar.tableData.length == 0) {             // 2024-09-29: add tableData check
         alert("No data to export -- please import a DocuXml with Comarkus event data");
         return;
      }

      let outFilename = (new Date()).yyyymmdd() + "-export.svg";
      exportGraph2SvgFile(outFilename);
   });
   
   // 2025-11-30
   $("#butExportExcelFile, #funcButExportExcelFile").click(function() {
      if (GlobalVar.tabulatorBuilt) {
         showProgressMsg("Export...");
         window.setTimeout(function() {
            let outFilename = (new Date()).yyyymmdd() + "-Xmarkus-GraphTabulator.xlsx";
            exportTabulator2Excel(outFilename);
            hideProgressMsg();
         });
      }
      else {
         alert("Error: Graph tabulator not built");
      }
   });
   
   $("#butExportXmlFile, #funcButExportXmlFile").click(function() {
      exportFilteredEvents2Xml();
   });

   // experiment/debugging features
   $("#butGraphView").click(function(evt) {
      $("#tableArea, #graphControlPanel").hide();    // 2024-01-04: 加上 #graphControlPanel
      $("#graphArea").show();
      
      // 2025-05-09: 若是原生事件，就不重算（不需經過 applyPanelToTableDataAndDrawGraph() 再處理）
      if (evt.originalEvent) {
         // Q: 還是需呼叫以下步驟？
         updateNodeDisplayList();                             // 因為 apply and redraw 會因設定而改動 node display，因此需更新哪些節點需顯示
         convertTableDataAndApplyCommonNodeDisplayFilter();   // 呼叫 convertTableData2graphNodeDict() 和 applyDisplayFilter()
         drawGraph();                                         // 依照最後結果繪圖
      }
      else {
         applyPanelToTableDataAndDrawGraph();           // 2024-09-11: 繪圖前，先套用 panel 過濾條件並重新繪圖
      }
   });
   
   $("#butTableView").click(function() {
      $("#graphArea, #graphControlPanel").hide();    // 2024-01-04: 加上 #graphControlPanel
      $("#tableArea").show();
      drawTable();                                   // 重新繪製 table...
      
      if (GlobalVar.table !== null) {                // 2024-06-02
         clearSearchHighlights(GlobalVar.table);        
      }
   });
   
   //// miscellaneous UI controls
   //$("#butCloseOverlay").click(function() {
   //   hideMyOverlayAndDrawGraph();
   //});

   // ----------------------------------------------------------------
   //           Graph Control Panel and Node Content Area
   // ----------------------------------------------------------------
   
   $("#butHideGraphControlPanel").click(function() {
      //$("#graphControlPanel").fadeOut(600);
      $("#graphControlPanel").hide("slide", { direction: "right" }, 300);       // jquery-ui
      //$("#graphControlPanelIcon").show();
   });
   
   $("#butHideNodeContentArea").on("click", function(event) {
      let jsNodeEventHtml = $(this).closest("div.nodeContentArea")
                                   .find("div.nodeEventHtml");
      let graphDataIdx = jsNodeEventHtml.attr("graphDataIdx");     // 必須藉由 graphDataIdx 才能呼叫 hideNodeContent()
      if (graphDataIdx) {     // 防呆 (可能為 undefined)
         let nodeObj = GlobalVar.temp.graphNodeObjArray[graphDataIdx];
         nodeObj.hideNodeContent();
      }
   });

   
   // 以下幾個 buttons 是 panelTab，動作類似（未來或可整併）
   $("#butEventNodeFiltering").click(function() {
      $("div.subPanel").hide();
      $("#divNodeFilteringAndDisplay").show();
      $("#subPanelButtons").find("span,button").removeClass("active inactive");
      $(this).addClass("active");
   });
   
   $("#butFeaturesToDisplay").click(function() {
      $("div.subPanel").hide();
      $("#divFeaturesToDisplay").show();
      $("#subPanelButtons").find("span,button").removeClass("active inactive");
      $(this).addClass("active");
   });
   
   $("#butCheckNodesToDisplay").click(function() {
      $("div.subPanel").hide();
      $("#divCheckNodesToDisplay").show();
      $("#subPanelButtons").find("span,button").removeClass("active inactive");
      $(this).addClass("active");
   });
   
   $("#butNodeStyling").click(function() {
      $("div.subPanel").hide();
      $("#divNodeStyling").show();
      $("#subPanelButtons").find("span,button").removeClass("active inactive");
      $(this).addClass("active");
   });
   
   $("#butNodeLabeling").click(function() {
      $("div.subPanel").hide();               // 隱藏所有 sub-panels 
      $("#divNodeLabeling").show();           // 只顯示當中特定 sub-panel
      $("#subPanelButtons").find("span,button").removeClass("active inactive");
      $(this).addClass("active");
   });
   
   $("#butTagUnification").click(function() {
      $("div.subPanel").hide();               // 隱藏所有 sub-panels 
      $("#divTagUnification").show();         // 只顯示當中特定 sub-panel
      $("#subPanelButtons").find("span,button").removeClass("active inactive");
      $(this).addClass("active");
   });
   
   $("#butSetTagUnificationMap").click(function() {
      //let msg = "Tag unification can affect the computation of Common nodes.\nContinue?"
      //if (!confirm(msg)) return;
      setTagUnificationMapAndApplyIt();
   });
   
   // --------------------------
   //     for node filtering
   // --------------------------

   //// 2025-05-21
   //$("#butAddEventFilterByFacets").click(function() {
   //   // 2025-05-30 (TODO) 依照 eventFilterCategoryCues 內容設定 #divElementTagTypeValue input[type='checkbox']？
   //   // ...
   //   
   //   $("#overlayEventFilterByFacets").show();
   //});
   //
   //$("#butFilterEventOverlayOK").click(function() {
   //   setFilterCategoryCueByOverlayEventFilter();
   //   $("#butComputeFilteredNodes").addClass("remindToClick");           // 2025-05-26
   //   
   //   $("#overlayEventFilterByFacets").hide();
   //});
   //
   //$("#butFilterEventOverlayCancel").click(function() {
   //   $("#overlayEventFilterByFacets").hide();
   //});
   
   $("#butFilterEntityTermsOverlayOK").click(function() {
      // 2025-06-28: 加上 targetKey 屬性來定位（目前是在設定 #n filter）
      let targetKey = $("#overlayEventFilterEntityTerms").attr("targetKey");
      
      // 取得 nodeType, tags 與 terms
      let nodeType = $("#filterNodeType").attr("nodeType");    // e.g., 'E', 'M'
      let subFilterList = [];
      
      // 注意，目前每個 sub-filters 都使用相同的 nodeType
      $("div.subFilter input.filterTags").each(function(idx) {
         let s = $(this).val().trim();                               // disjunctedTags
         let t = $(this).parent().find("input.filterEntityTerms")
                                 .val().trim();                      // disjunctedTerms
                                                   
         if (s && t) {        // 2025-09-29: 必須有值，才需加入 operator
            let jqOp = $(this).parent().find("select.subFilterOperation");
            if (jqOp.length > 0) subFilterList.push('[' + jqOp.val() + ']');     // [AND], [OR]
            let subFilter = nodeType + ':' + s + ':' + t;
            subFilterList.push(subFilter);
         }
      });
      
      filter = (subFilterList.length > 0)
             ? subFilterList.join('')
             : '-';
      //alert("filter: " + filter);

      $("textarea.eventFilterByEventTerms[targetKey='" + targetKey + "']").val(filter);
      $("#overlayEventFilterEntityTerms").hide();

      setRemindComputeButton();
   });
   
   $("#butFilterEntityTermsOverlayCancel").click(function() {
      $("#overlayEventFilterEntityTerms").hide();
   });
   
   // 2025-09-29
   $("textarea.eventFilterByEventTerms").on("input", function() {
      setRemindComputeButton();
   });
   
   // --------------------------
   //     for node display
   // --------------------------

   $("button.butComputeFilteredNodes").click(function() {
      // 2025-09-27: 應魯汶的要求，這個按鈕預設會隱藏
      $(this).removeClass("remindToClick");
      showProgressMsg("compute");
      
      window.setTimeout(function() {
         // 2025-07-18: 若允許動態更動 dupMethod，就需要重新計算 duplicate common nodes
         computeFilteredNodes();
      }, 100);    // 注意，這裡的停頓時間必須比 300ms 小很多
   });
   
   $("#butApplyQueryToUpdateDisplayCheckboxes").click(function() {
      applyQueryFilter(GlobalVar.graphNodeDict);            // cf. EventRelLite-graph.js
      updateDisplayCheckboxes();
      updateCheckedNodesCountAndGraphNodeDict();
   });
   
   $("#butDisplaySelectAll").click(function() {
      setAllDisplayCheckboxes(true);
      updateCheckedNodesCountAndGraphNodeDict();
   });
   
   $("#butDisplaySelectNone").click(function() {
      setAllDisplayCheckboxes(false);
      updateCheckedNodesCountAndGraphNodeDict();
   });
   
   $("#butDisplayInverse").click(function() {
      inverseDisplayCheckboxes();
      updateCheckedNodesCountAndGraphNodeDict();
   });
   
   //$("#butRandomlySelect").click(function() {
   //   randomlySelectCheckboxes();
   //   updateCheckedNodesCountAndGraphNodeDict();
   //});
   
   $("#butExtendSelectedEventNodes").click(function() {
      let selectedEventNodes = [];
      //let selectedEventNodes = applyNodeTagValFilter(GlobalVar.graphNodeDict);       // cf. EventRelLite-graph.js
      
      // 從當前已勾選的 event (non-C) 節點向外延伸，連到的 'C' 節點都勾選起來
      let degree = parseInt($("#commonNodeDegreeThreshold").val());
      if (isNaN(degree) || degree <= 0) degree = 1;
      extendSelectedEventNodes(degree, selectedEventNodes);               // 2025-01-10: 加上 degree -- 但問題是，這個 degree 卻來自另一個 subpanel 的設定...
      
      updateCheckedNodesCountAndGraphNodeDict();
   });
   
   $("#butExtendSelectedCommonNodes").click(function() {
      // 從當前已勾選的 'C' 節點向外延伸，連到的 event 節點也都勾選起來
      extendSelectedCommonNodes();
      updateCheckedNodesCountAndGraphNodeDict();
   });
   
   $("#butUncheckIsolatedEventNodes").click(function() {
      // 2024-09-23
      uncheckIsolatedEventNodes();
      updateCheckedNodesCountAndGraphNodeDict();
   });
   
   $("#butApplySettingsAndRedraw").click(function() {
      $("#butApplySettingsAndRedraw").removeClass("remindToClick");
      if (GlobalVar.temp.onNeedComputeFilteredNodesState) {
         showProgressMsg("Recompute...");
         window.setTimeout(function() {
            computeFilteredNodes();
            wait4ComputingFilteredNodes();
            GlobalVar.featureTypesChanged = false;          // 2025-12-03: 注意，必須算完後才能重置
         }, 50);
      }
      else {
         applyPanelToTableDataAndDrawGraph();
         GlobalVar.featureTypesChanged = false;             // 2025-12-03: 算完後才能重置
      }
   });
   
   // --------------------------   
   //    for node filtering
   // --------------------------   

   $(document).on('input', '#inputTNB', function() {
      let tnb = parseInt($(this).val());
      let tna = parseInt($("#inputTNA").val());
      if (tnb > tna) {
         tna = tnb;
         $("#inputTNA").val(tna);
      }
      $("#inputTNAval").val(tna);
      $("#inputTNBval").val(tnb);
      setRemindComputeButton();
   });
   
   $(document).on('input', '#inputTNA', function() {
      let tnb = parseInt($("#inputTNB").val());
      let tna = parseInt($(this).val());
      if (tna < tnb) {
         tnb = tna;
         $("#inputTNB").val(tnb);
      }
      $("#inputTNAval").val(tna);
      $("#inputTNBval").val(tnb);
      setRemindComputeButton();
   });
   
   $("#inputTNBval").blur(function() {
      let tnb = parseInt($(this).val());
      let tna = parseInt($("#inputTNA").val());
      if (tnb < MIN_INPUT_YEAR_RANGE) tnb = MIN_INPUT_YEAR_RANGE;
      else if (tnb > MAX_INPUT_YEAR_RANGE) tnb = MAX_INPUT_YEAR_RANGE;
      $("#inputTNBval").val(tnb);
      
      if (tnb > tna) {
         tna = tnb;
         $("#inputTNAval").val(tna);
      }
      $("#inputTNA").val(tna);
      $("#inputTNB").val(tnb);
      setRemindComputeButton();
   });
   
   $("#inputTNAval").blur(function() {
      let tnb = parseInt($("#inputTNB").val());
      let tna = parseInt($(this).val());
      if (tna < MIN_INPUT_YEAR_RANGE) tna = MIN_INPUT_YEAR_RANGE;
      else if (tna > MAX_INPUT_YEAR_RANGE) tna = MAX_INPUT_YEAR_RANGE;
      $("#inputTNAval").val(tna);

      if (tna < tnb) {
         tnb = tna;
         $("#inputTNBval").val(tnb);
      }
      $("#inputTNA").val(tna);
      $("#inputTNB").val(tnb);
      setRemindComputeButton();
   });
   
   $("#inputTimeSpan").change(function() {     // 修改 input text 內容後，移出焦點（點選別的地方）會觸發事件
      // 2024-10-02
      let val = parseInt($(this).val());
      if (isNaN(val) || val < 0 || val > 9999) $(this).val('0');        // reset
      else {
         GlobalVar.defaultTimeSpan = parseInt(val);
         autoAdjustNodeYearRange();
      }
      setRemindComputeButton();
   });
   
   // 2024-10-22: 處理按下 enter 的狀況...
   $("#inputTNBval, #inputTNAval").bind("keypress", {}, keypressInBox);
   
   // Control subpanel: filtering
   $("button.butResetFilters").click(function() {
      // 2025-01-23: reset filtering conditions
      // (1). time-range
      $("#inputTNB, #inputTNBval").val(0);
      $("#inputTNA, #inputTNAval").val(2100);
      $("#includeEventNodesWithoutTimeInfo").prop("checked", true);
      
      // (2). event nodes
      //let selector = "input[type='checkbox']";
      //$("#divElementTagTypeValue").find(selector).each(function() {
      //   $(this).prop("checked", false);
      //});
      //$("#eventFilterCategoryCues").val('--');                     // 2025-05-22
      $("textarea.eventFilterByEventTerms").val('--');             // 2025-06-28

      //// (3). common nodes
      //$("#divCommonNodesToDisplay").find(selector).each(function() {
      //   $(this).prop("checked", false);
      //});
      
      setRemindComputeButton();      // 設為 remind -- 強迫重新計算
   });
   
   // 2025-07-10: 設定 force-model strength -- slider value 為正值，繪圖時需轉為負值（因設定的是排斥力）
   $(document).on('input', '#forceModelRepulsiveStrengthSlider', function() {
      let strength = parseInt($(this).val());
      $("#forceModelRepulsiveStrengthVal").val(strength);
   });
   
   $("#forceModelRepulsiveStrengthVal").bind("keypress", {}, keypressInBox);   // 按下 enter 後，利用 blur() 觸發修改 slider 事件
   
   $("#forceModelRepulsiveStrengthVal").blur(function() {
      let strength = parseInt($("#forceModelRepulsiveStrengthVal").val());
      
      let minStrength = parseInt($("#forceModelRepulsiveStrengthSlider").attr("min"));
      let maxStrength = parseInt($("#forceModelRepulsiveStrengthSlider").attr("max"));
      if (strength < minStrength) strength = minStrength;
      else if (strength > maxStrength) strength = maxStrength;
      $("#forceModelRepulsiveStrengthSlider").val(strength);
      $("#forceModelRepulsiveStrengthVal").val(strength);
   });
   
   // ---------------------------------------------------------------------------

   //$("#butElementTagSelectAll").click(function() {
   //   let curElementTag = $("#selectElementTag").val();
   //   if (GlobalVar.enableFilterTrees) {
   //      GlobalVar.treeJsObj[curElementTag].selectAll();
   //   }
   //   else {
   //      let selector = "input[type='checkbox'][name='" + curElementTag + "']";
   //      $("#divElementTagTypeValue").find(selector).each(function() {
   //         $(this).prop("checked", true);
   //      });
   //   }
   //});
   //
   //$("#butElementTagSelectNone").click(function() {
   //   let curElementTag = $("#selectElementTag").val();
   //   if (GlobalVar.enableFilterTrees) {
   //      GlobalVar.treeJsObj[curElementTag].selectAll();
   //      GlobalVar.treeJsObj[curElementTag].selectInverse();
   //   }
   //   else {
   //      let selector = "input[type='checkbox'][name='" + curElementTag + "']";
   //      $("#divElementTagTypeValue").find(selector).each(function() {
   //         $(this).prop("checked", false);
   //      });
   //   }
   //});
   //
   //$("#butElementTagSelectInverse").click(function() {
   //   let curElementTag = $("#selectElementTag").val();             // facet, 後分類項目
   //   if (GlobalVar.enableFilterTrees) {
   //      GlobalVar.treeJsObj[curElementTag].selectInverse();                       // customized function (treejs-customized.js)
   //   }
   //   else {
   //      let selector = "input[type='checkbox'][name='" + curElementTag + "']";
   //      $("#divElementTagTypeValue").find(selector).each(function() {
   //         $(this).prop("checked", !$(this).prop("checked"));
   //      });
   //   }
   //});

   $("#butCommonNodeTagSelectAll").click(function() {
      let selector = "input[type='checkbox']";
      $("#divCommonNodesToDisplay").find(selector).each(function() {
         $(this).prop("checked", true);
      });
   });
   
   $("#butCommonNodeClear").click(function() {
      let selector = "input[type='checkbox']";
      $("#divCommonNodesToDisplay").find(selector).each(function() {
         $(this).prop("checked", false);
      });
      
      // 2025-05-11: 也一併清除 Text filter
      $("#commonNodeTextFilter").val('');
   });
   
   $("#butCommonNodeTagSelectInverse").click(function() {
      let selector = "input[type='checkbox']";
      $("#divCommonNodesToDisplay").find(selector).each(function() {
         $(this).prop("checked", !$(this).prop("checked"));
      });
   });

   $("#butCommonNodeDefault").click(function() {
      // 2025-07-22: 切換回預設的 FeatureType (SharedPart)
      GlobalVar.tagDupLookup = JSON.parse(JSON.stringify(GlobalVar.tagDupLookupDefault));
      switchSelectDupMethodBasedOnDupLookup();
   
      // 2025-07-18: 切換回「僅勾選預設的 checkboxes」
      checkDefaultCommonNodeTags();
      
      // 提醒按鈕
      setRemindComputeButton();
   });

   $("button.butEntityTagsSelectAll").click(function() {              // 2025-05-21
      let subFilterTagAndValueBlock = $(this).closest("div.subFilterTagAndValueBlock");
      let selector = "div.divEntityTagList input[type='checkbox']";
      subFilterTagAndValueBlock.find(selector).each(function() {
         $(this).prop("checked", true);
      });
      updateFilterTags();                               // 2025-10-05: bug fix
      refreshTagValueList();                            // 2025-07-31
   });

   $("button.butEntityTagSelectNone").click(function() {              // 2025-05-21
      let subFilterTagAndValueBlock = $(this).closest("div.subFilterTagAndValueBlock");
      let selector = "div.divEntityTagList input[type='checkbox']";
      subFilterTagAndValueBlock.find(selector).each(function() {
         $(this).prop("checked", false);
      });
      updateFilterTags();                               // 2025-10-05: bug fix
      refreshTagValueList();                            // 2025-07-31
   });
   
   $("button.butFilterTagValSelectAll").click(function() {            // 2025-08-20
      let subFilterTagAndValueBlock = $(this).closest("div.subFilterTagAndValueBlock");
      let selector = "div.divTagValueList input[type='checkbox']";
      subFilterTagAndValueBlock.find(selector).each(function() {
         if (['[ANY]','[NONE]'].includes($(this).val())) $(this).prop("checked", false);
         else $(this).prop("checked", true);
      });
      updateFilterEntityTerms();                      // 2025-10-05: bug fix
   });
   
   $("button.butFilterTagValSelectNone").click(function() {           // 2025-08-20
      let subFilterTagAndValueBlock = $(this).closest("div.subFilterTagAndValueBlock");
      let selector = "div.divTagValueList input[type='checkbox']";
      subFilterTagAndValueBlock.find(selector).each(function() {
         $(this).prop("checked", false);
      });
      updateFilterEntityTerms();                      // 2025-10-05: bug fix
   });
   
   // -------------------------------
   //     Supporting Functions
   // -------------------------------
   
   function addSubFilter() {
      // 2025-09-26: tag 和 term 都必須有值，否則就跳出提醒
      let jqLastSubFilter = $("#subFilterRows div.subFilter").last();
      let pass = true;
      jqLastSubFilter.find("input").each(function() {
         if ($(this).val().trim() === '') pass = false;
      });
      if (!pass) {
         alert("Please specify both feature and value before adding condition");
         return;
      }
      
      // 2025-09-25
      let jqCopy = $("#subFilterRows div.subFilterTemplate").clone();    // <div> 下有 <select>, <input> 和 <button>
      jqCopy.attr("style", "display:block");                               
      jqCopy.removeClass("subFilterTemplate");
      jqCopy.addClass("subFilter");                                      // 將 'subFilterTemplate' 改成 'subFilter'
      jqLastSubFilter.find("input,select").addClass("locked");           // 2025-09-26
      jqLastSubFilter.find("button.addSubFilter").remove();              // 移除 button
      jqCopy.attr("key", +jqLastSubFilter.attr("key") + 1);
      $("#subFilterRows").append(jqCopy);
      
      $("button.butEntityTagSelectNone").click();                        // 清除 entity tag selection
      $("div.divTagValueList").html('');
      
      // 更新 html 後必須重新註冊
      $("div.subFilter button.addSubFilter").off("click").on("click", function(evt) {
         addSubFilter();
      });
   }
   
   function wait4ComputingFilteredNodes() {                   
      // 2025-09-25: 魯汶要求僅需一個 REDRAW 按鈕，就可「先進行計算後，直接 REDAW」
      showProgressMsg("continue...");
      window.setTimeout(function() {
         if (GlobalVar.temp.onNeedComputeFilteredNodesState) wait4ComputingFilteredNodes();
         else applyPanelToTableDataAndDrawGraph();
      }, 100);
   }

   function computeFilteredNodes() {
      if (GlobalVar.enableDynamicDupMethod) { 
         if (GlobalVar.recomputeOnlyOnFeatureTypesChanged && !GlobalVar.featureTypesChanged) ;    // 2025-12-03: 跳過不執行以下重算步驟
         else {
            // computeDuplicateAndUpdateDisplayGroup() 計算後，會衍生許多複雜性... 目前仍屬於混亂處理模式...
            // 注意：也需同步修改 row.graphNodeLabel （或 graphNodeData.graphNodeLabel？）
            computeDuplicateAndUpdateDisplayGroup();
            showProgressMsg("dyn-compute");
            convertTableData2graphNodeDict(GlobalVar.tableData);
            updateNodeDisplayList();
         }
      }
         
      let selectedEventNodes = applyNodeTagValFilter(GlobalVar.graphNodeDict);       // cf. EventRelLite-graph.js
      
      // 勾選符合條件的 common nodes（可直接呼叫 $("#butExtendSelectedEventNodes").click()？）
      let degree = parseInt($("#commonNodeDegreeThreshold").val());
      if (isNaN(degree) || degree <= 0) degree = 1;
      extendSelectedEventNodes(degree, selectedEventNodes);

      // 2025-01-24      
      GlobalVar.hideIsolatedEventNode = $("#hideIsolatedEventNodes").is(":checked");
      if (GlobalVar.hideIsolatedEventNode) uncheckIsolatedEventNodes();

      // 注意：在此不能呼叫 updateDisplayCheckboxes()，它會透過 GlobalVar.graphNodeDict 更新 display checkboxes
      updateCheckedNodesCountAndGraphNodeDict();

      // 2025-11-28: 若載入檔案大，馬上隱藏會造成一段時間空白... 因此不急著隱藏，進入繪圖程序前再隱藏即可
      //hideProgressMsg();
      showProgressMsg("Preparing...");
      
      GlobalVar.temp.onNeedComputeFilteredNodesState = false;               // 計算完畢，將旗標設為 false
   }
   
   function setRemindComputeButton() {
      // 2025-09-29: 注意，設定 remind 時「才」會將 GlobalVar.temp.onNeedComputeFilteredNodesState 設為 true（強迫重新計算）
      $("button.butComputeFilteredNodes").addClass("remindToClick");        // 2025-05-26
      //$("#butApplySettingsAndRedraw").addClass("disabled");               // 按下 "Compute filtered nodes" 鈕之前，不允許按 REDRAW 鈕
      $("#butApplySettingsAndRedraw").addClass("remindToClick");
      GlobalVar.temp.onNeedComputeFilteredNodesState = true;
   }
   
   function switchSelectDupMethodBasedOnDupLookup() {
      // 2025-07-18
      $("#divCommonNodesToDisplay select.selectDupMethod").each(function() {
         // 切換到每個標籤當前的 dupMethod
         let tag = $(this).closest("tr").find("td.tagNameAbbr").attr("tagName");
         let dupMethod = GlobalVar.tagDupLookup[tag].dup || 'tagsComputeDupWithTagOnly';
         $(this).val(dupMethod);
      });
   }
      
   function checkDefaultCommonNodeTags() {
      // 2025-07-17: 從 control panel 的 "select features" subpanel 勾選預設的項目
      let preCheckedTags = GlobalVar.defaultCommonNodeTagsChecked;
      $("#divCommonNodesToDisplay").find("input[type='checkbox']").each(function() {
         // 2025-10-05: 注意，若 Udef_Align_OBJECT 不在列表中，就不會被勾選
         let val = $(this).val();
         if (preCheckedTags.includes(val)) $(this).prop("checked",true);
         else $(this).prop("checked",false);
      });
   }

   function setFilterCategoryCueByOverlayEventFilter() {    
      // 2025-05-26: 將 overlayEventFilterByFacet 的內容彙整成字串，顯示在 #eventFilterCategoryCues
      // 2025-05-21: 在 graph control panel 添加「過濾器選了幾個 facet/category」的訊息
      let categoryHash = {};
      //if (GlobalVar.enableFilterTrees) {
      //   $("#selectElementTag").find("option").each(function() {
      //      let spotlight = $(this).val();          // attr("key") 為縮寫版，在此是需要完整的 Udef_Evt_EVENT 或 Udef_DocMeta_AdYear
      //      let cueList = GlobalVar.treeJsObj[spotlight].values;
      //
      //      // 2025-06-19
      //      // 將 UdefPropertyTree:<tag>/<value> 或 UdefEventTree:<tag>/<value> 轉換回 <tag>/<value> 形式
      //      // 注意：若有多個 <tag>，會轉換成 "<tag1>:<val1> <tag2>:<val2> ..."，也就是說，若從 property tree 第一層勾選多項，它們會是 AND 性質！
      //      if ([GlobalVar.udefPropertyTreeName, GlobalVar.udefEventTreeName].includes(spotlight)) {
      //         cueList.forEach(function(cue) {
      //            // 取出 <tag>/<val>，將 <val> 放入 tagHash[tag] 陣列
      //            let parts = cue.split('/');
      //            let tag = parts.shift();
      //            let val = parts.join('/');
      //            if (!categoryHash[tag]) categoryHash[tag] = [];
      //            categoryHash[tag].push(val);
      //         });
      //         //alert(JSON.stringify(categoryHash));
      //      }
      //      else if (cueList.length > 0) categoryHash[spotlight] = cueList;
      //   });
      //   //alert(JSON.stringify(categoryHash));
      //}
      //else {
      //   $("#divElementTagTypeValue input[type='checkbox']:checked").each(function() {
      //      let tag = $(this).prop("name");           // e.g., Udef_Evt_EVENT.Genre
      //      let val = $(this).val();                  // e.g., CONSTRUCTION
      //      if (!categoryHash[tag]) categoryHash[tag] = [];
      //      categoryHash[tag].push(val);
      //   });
      //}

      // 2025-05-22      
      let categoryCuesList = [];
      Object.keys(categoryHash).forEach(function(category) {
         let s = category + ':' + categoryHash[category].join('|');
         categoryCuesList.push(s);
      });
      
      let s = categoryCuesList.join(' ') || '--';    // 2025-02-26: 若沒有（或清除）filter 則設為 '--'
      $("#eventFilterCategoryCues").val(s);
   }
      
   function setOverlayEventFilterByFilterCategoryCue() {
      // 2025-05-26: 反過來，將 #eventFilterCategoryCues 內容展現到 "#divElementTagTypeValue input[type='checkbox']"
      // ...
      //let filterCategoryCuesStr = $("#eventFilterCategoryCues").text().trim();
      //let filterCategoryCues = filterCategoryCuesStr.split(' ');
      //let categoryHash = {};
   }

   // TODO TODO TODO tree display for event selection 
   // '#' Udef_DocMeta_, '*' Udef_Evt_, '^' Udef_properties_
   
   //function getTreeData(tagList, addTagAsPathPrefix = null) {
   //   // 從 GlobalVar.eventElementTags 取得 tagValArray := [{tag,val}, {tag,val}, ... ]
   //   let cueValArray = [];
   //   let eventElementTags = GlobalVar.eventElementTags;    // eventElementTags[tag][tagVal] = dupCnt
   //   
   //   // todo todo todo
   //   //let myEventElementTags = GlobalVar.myEventElementTags[nodeType]
   //   
   //   tagList.forEach(function(tag) {
   //      let elementCueVals = eventElementTags[tag];
   //
   //      Object.keys(elementCueVals).forEach(function(cue) {
   //         let val = elementCueVals[cue];
   //         cue = cue.replace(/\((\d+)\/(\d+)\)/g, '($1 of $2)');     // e.g., 惠安縣志: 輞川橋記 (2/2)
   //         if (addTagAsPathPrefix) cue = tag + '/' + cue;
   //         cueValArray.push({cue,val});
   //      });
   //   });
   //   //if (addTagAsPathPrefix) alert(JSON.stringify(cueValArray));
   //   
   //   let treeData = convertCueValArray2TreeData(cueValArray);
   //   //alert(JSON.stringify(treeData));
   //   return treeData;
   //}      
   //
   //function addTreeJs(containerId, treeData, tag) {
   //   //let treeData = [
   //   //  {
   //   //    id: '0',
   //   //    text: 'node-0',
   //   //    children: [
   //   //      {
   //   //        id: '0/0',
   //   //        text: 'node-0-0',
   //   //        children: [
   //   //          {id: '0/0/0', text: 'node-0-0-0'},
   //   //          {id: '0/0/1', text: 'node-0-0-1'},
   //   //          {id: '0/0/2', text: 'node-0-0-2'},
   //   //        ],
   //   //      },
   //   //      {id: '0/1', text: 'node-0-1'},
   //   //    ],
   //   //  },
   //   //];
   //   // get: const values = myTree.values;
   //   // set: tree.values = ['0-1'];      
   //   
   //   let treeDivId = '#treejs_' + tag.replace(/\./g,'_');
   //   GlobalVar.treeJsObj[tag] = new Tree('#' + containerId, {     // 注意，在此的 tag 為完整版？ 不含 '#', '*', '^' 等縮寫
   //      data: treeData,
   //      closeDepth: 1,              // 僅展開第一層（但點擊打開後，會自動展開該層下的所有節點... 好像沒辦法一層一層展開？）
   //      loaded: function() {        // 載入時，哪些項目要事先勾選
   //         //this.values = GlobalVar.prevCueList;            // 2025-02-15
   //      },
   //   });
   //}
   //
   //function displaySpotlightTreeJs(tag) {
   //   $("div.treeContainer").hide();
   //   let treeDivId = '#treejs_' + tag.replace(/\./g,'_');
   //   $(treeDivId).show();
   //}
   
   function getTagSpotlightCueArray(spotlightData) {   // array of [cue, val, terms]
      // tags 後分類和 metadata 後分類，在顯示上有一些差異（tags 額外有 terms，即使此專案不需 tf）
      let cueValArray = [];
      for (let cue in spotlightData) {
         let val = spotlightData[cue].freq;          // integer
         let terms = spotlightData[cue].terms;
         terms = terms.map(function(t) {             // 2024-09-01: 若 t 為 "evt_water/洪水"，將只保留 "洪水" 以便顯示
            let parts = t.split(new RegExp("/"));    // 注意：輸入的 terms 若為 "action/修", "RENOVATION/修"，map() 後將會是 ['修','修']
            return parts.pop();
         });
         terms = [...new Set(terms)].sort();         // 2024-11-26: 仍須取 array_unique() 然後排序
         cueValArray.push({cue,val,terms});          // 注意，此 cueValArray 的元素多了 terms
      }
      return cueValArray;      
   }
   
   function convertCueValArray2TreeData(cueValArray) {
      // convert path array to treeData object
      // cueValArray := [ { cue, val, terms}, {cue, val, terms}, ...]
      //       terms := [ term, term, ...]
      // => treeData (注意，並不需根節點) is an array of subtrees, each subtree is an object
      //    { id, text, children } where children is an array of subtrees

      // 2024-01-13: 以下程式來自於 ChatGPT，然後再進行一些修改
      const tree = [];
      cueValArray.forEach(cueVal => {
         let current = tree;
         
         let path = cueVal.cue.split('/');
         path.forEach((nodeCue, index) => {
            // 透過 nodeId 比對 current (tree) 陣列的 element id，查找節點是否存在於當前層級
            let nodeId = path.slice(0,index+1).join('/'); 
            let existingNode = current.find(item => item.id === nodeId);
            
            // 如果節點不存在，則創建新的節點
            if (!existingNode) {
               let text = nodeCue;                            // treejs 是用 text 而非 label
               text = text.replace(/^markus_/,'#');           // 將 prefix "markus_" 取代為 '#' （仍然保留 symbol '#' 以便除錯）
               if (index === path.length - 1) {
                  text += " (" + cueVal.val + ")";
               }
               existingNode = {
                  id: nodeId,
                  text,
                  children: []
               };
               current.push(existingNode); // 添加新節點到當前層級
            }
         
            // 游標移到下一層級
            current = existingNode.children;
         });
      });
      
      return tree;
   }

   // 2025-11-25 獨立出來
   function setPinnedNodePosition() {
      GlobalVar.temp.pinnedNodePosition = {};          // reset
      if ($("input[name='pinNodesOnRedraw']").is(":checked")) {
         showProgressMsg("save node position");
         let svg = d3.select("svg");
         svg.selectAll(".shrinkedObject").each(function(d, i) {
            //alert(d.id + ': ' + d.x + ", " + d.y);
            GlobalVar.temp.pinnedNodePosition[d.id] = { x: d.x, y:d.y };
         });
      }
   }

   // ---------------------------------------------------------------------------------
   
   function keypressInBox(e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if (code == 13) {           // Enter keycode                        
         e.preventDefault();
         $(this).blur();
      }
   };
   
   // ----------------------------------------------
   //                 載入或儲存
   // ----------------------------------------------
   
   $("#loadDocuXmlFile").on("change", function(evt) {    // 2024-08-08
      // 獲取檔案輸入元素（僅允許匯入單一 DocuXml 檔，但若多次匯入，結果可以疊加）
      const fileInput = document.getElementById('loadDocuXmlFile');
      if (fileInput.files.length === 0) return;              // 確保選擇了檔案

      // 獲取選擇的檔案
      const file = fileInput.files[0];
      const filename = file.name;                            // 2024-09-15
      const reader = new FileReader();

      // 定義檔案讀取完成後的處理邏輯
      reader.onload = function(event) {
         displayLoadedFilenames(filename);
         parseDocuXmlFile(event.target.result);
      };

      // 定義檔案讀取錯誤的處理邏輯（正常應該不需要）
      reader.onerror = function() {
          alert('檔案讀取錯誤');
      };

      // 讀取檔案為文字格式
      reader.readAsText(file);
   });
   
   // 2024-10-16: 讀取 tag unification mapping 檔   
   $("#loadTagUnifMapFile").on("change", function(evt) {    // 2024-10-16
      // 獲取檔案輸入元素（僅允許匯入單一 DocuXml 檔，但若多次匯入，結果可以疊加）
      const fileInput = document.getElementById('loadTagUnifMapFile');
      if (fileInput.files.length === 0) return;             // 確保選擇了檔案

      // 獲取選擇的檔案
      const file = fileInput.files[0];
      const filename = file.name;
      const reader = new FileReader();

      // 定義檔案讀取完成後的處理邏輯
      reader.onload = function(event) {
         parseTagUnificationMapFile(event.target.result);
      };

      // 定義檔案讀取錯誤的處理邏輯（正常應該不需要）
      reader.onerror = function() {
          alert('檔案讀取錯誤');
      };

      // 讀取檔案為文字格式
      reader.readAsText(file);
   });
   
   $("#butLoadTagUnifMapFile").click(function(evt) {
      $("#loadTagUnifMapFile").click();            // 觸發 <input type="file"> 的「讀取檔案」機制
   });
   
   //$("#butSaveFile").click(function(evt) {
   //   let viewportWidth = $(window).width();
   //   let w = (evt.pageX + 360 > viewportWidth) 
   //         ? (evt.pageX - 370)
   //         : ((evt.pageX > 80) ? evt.pageX - 60 : evt.pageX - 10);
   //   let css = {'top':evt.pageY+12,'left':w};
   //   
   //   // 2024-08-08
   //   let jqBox = $("#fileSaveFileBox");
   //   if (jqBox.is(":hidden")) jqBox.css(css).slideDown();
   //   else jqBox.slideUp();
   //});
   //
   //$("#butCancelSaveFile").click(function() {
   //   $("#fileSaveFileBox").fadeOut(500);
   //});

   //$("#butSaveDataFile").click(function() {
   //   // 儲存 CurData (而不是原先輸入的 DataIn)
   //   // 依照 fileSaveFormat (json/csv) 決定輸出的格式
   //   fileSaveFormat = $("input[name='fileSaveFormat']:checked").val();
   //
   //   let str = "";
   //   let mimeType = "json";
   //   if (fileSaveFormat == "json") {
   //      mimeType = "text/json;charset=utf-8";
   //      //str = JSON.stringify(CurData);
   //      alert("TODO -- not implemented yet");
   //      return;
   //   }
   //   else if (fileSaveFormat == "csv") {
   //      mimeType = "text/csv;charset=utf-8";
   //      //str = convertJsonToCsvStr();                      // 將 DataFields, CurData 轉成 csv string
   //      alert("TODO -- not implemented yet");
   //      return;
   //   }
   //   else if (fileSaveFormat == "svg") {
   //      mimeType = "image/svg+xml";
   //      // 2024-05-27: export SVG and <link> CSS content
   //      str = new XMLSerializer().serializeToString(document.getElementById("svgArea"));
   //      let linkElement = document.querySelector('link[href="css/EventRelLite-graph.css"]');
   //      let cssRules = linkElement.sheet.cssRules;
   //      let cssString = '';
   //      for (let i = 0; i < cssRules.length; i++) {
   //         cssString += cssRules[i].cssText + '\n';
   //      }
   //      str = str.replace("</svg>", "\n<style>" + cssString + "</style>\n</svg>");
   //   }
   //   else alert("Error: unrecognized file extension type '" + fileSaveFormat + "'");
   //   
   //   let outFilename = (new Date()).yyyymmdd() + "-export." + fileSaveFormat;
   //   let blob = new Blob([str], {type: mimeType});
   //   saveAs(blob, outFilename);
   //   
   //   // 關閉載入儲存的顯示區塊
   //   $("#fileSaveFileBox").fadeOut(400);
   //});
   
   // ------------------------------------------------------------------------------------------   
   
   // 2024-10-25: 接收 window 所傳來的 postMessage() 訊息
   window.addEventListener("message", messageHandler, false);
   
   function messageHandler(evt) {
      //alert(evt.origin);                      // invoker URL hostname
      //alert(evt.source);                      // invoker DOM object
      
      // 可透過此物件回傳訊息... （但瀏覽器可能會攔住，並加上一些提示訊息）
      //let eventSource = evt.source;             
      //eventSource.postMessage('Test message to caller', evt.origin);
      
      //const protocol = window.location.protocol;
      //const host = window.location.hostname;
      //const port = window.location.port;
      //let check1 = protocol + "//" + host;
      //let check2 = protocol + "//" + host + ":" + port;
      //if (evt.origin == "null") return;         // skip (note: evt.origin is a string)
      //else if (evt.origin != check1 && evt.origin != check2) {
      //   alert("origin check failed: " + evt.origin + " has to be the same as URL host " + check2);
      //   return;
      //}

      try {
         if (!evt.data) return;                              // to prevent "SyntaxError: JSON.parse: unexpected end of data at line 1 column 1 of the JSON data"
         let payload = evt.data;                             // evt.data 似乎會直接被剖析成 json 物件...
         let {source, target, parameters, type, message } = payload;
         if (type === 'DocuXml') {
            let internalDataName = "Data-from-" + source;
            displayLoadedFilenames(internalDataName);        // 2025-06-08
            parseDocuXmlFile(message);
         }
         else if (type === 'json') {
            alert(JSON.stringify(payload));
         }
         else console.log("Unknown postMessage type: " + type);
      } catch (e) {
         alert(e.name + ": " + e.message);
      }
   }

   // ---------------------------
   //         utilities
   // ---------------------------

   Date.prototype.yyyymmdd = function() {       // Tu: copied from Web
     var mm = this.getMonth() + 1;              // getMonth() is zero-based
     var dd = this.getDate();
     return this.getFullYear() + ('0'+mm).substr(-2) + ('0'+dd).substr(-2);  // padding
   }

   function escapeHtml(text) {                                                 // from ChatGPT
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, function(m) { return map[m]; });
   }
   
   function escapeRegExp(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');    // $& means the whole matched string
   }

   function convertToLegalTagAttrValue(s) {
      // 2024-04-29
      //let t = $('<span/>').attr('title',s).prop('outerHTML');
      //t = t.match(/title="(.*)"/)[1];
      let t = s.toString()
               .replace(/&/g, '&amp;')        // This MUST be the 1st replacement
               .replace(/'/g, '&apos;')       // The 4 other predefined entities, required.
               .replace(/"/g, '&quot;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
      return t;
   }
   
   function removeSuffix(str, delimiter = '/') {
      let tmpArray = str.split(delimiter);
      if (tmpArray.length > 1) {
         tmpArray.pop();
         str = tmpArray.join(delimiter);
      }
      return str;
   }
   
   function replaceTagPrefix2Symbol(tag) {
      // 2025-06-18
      return tag.replace(/Udef_Evt_/,'*')
                .replace(/Udef_properties_/,'^')
                .replace(/Udef_DocMeta_/,'#');
   }
   
   function replaceTagSymbol2Prefix(tag) {
      // 2025-07-18
      return tag.replace(/[\*]/g, 'Udef_Evt_')
                .replace(/[\^]/g, 'Udef_properties_')
                .replace(/[\#]/g, 'Udef_DocMeta_');
   }

   function extractFromVal(term, extractOption) {
      // 2025-06-29
      let parts = term.split('/');
      let prefix = parts[0] || '-';
      let suffix = parts[parts.length-1] || '-';
      let infix = parts[Math.floor((parts.length-1)/2)] || '-';    // 若 'x/y' 則選 'x'
      // 注意：與 C-node 顯示不同，在此並沒有 'x/y' 選項... （日後或可合併處理）
      if (extractOption == 'full') ;
      else if (extractOption == 'x') term = prefix;
      else if (extractOption == 'y') term = infix;
      else if (extractOption == 'z') term = suffix;
      return term;
   }
   
   // 2026-05-11: by ChatGPT
   function getBrowserType() {
       const ua = navigator.userAgent;
   
       if (ua.includes("Edg/")) return "Edge";
       if (ua.includes("Firefox/")) return "Firefox";
       if (ua.includes("Chrome/")) return "Chrome";
   
       return "Unknown";
   }
   
   // 2026-05-12
   function browserRaiseLowerFriendly() {
      let browserType = getBrowserType();
      return (['Firefox'].includes(browserType));     // Edge, Chrome 似乎都會讓 node dragging 失效（變成 canvas moving）...
   }
      
   // -----------------------------------------------------------------------------------
   //       Broadcast Channel 相關函式（僅需發送訊息，接收訊息由 X-MARKUS.html 處理）
   // -----------------------------------------------------------------------------------
   
   function sendBroadcastMessage(source, target, purpose, queryStr, postActionStr = '') {
      // 調整訊息格式，改為 source, target, parameters, type, message 四項參數
      // 注意，檔名查詢語法是 m.filename:f1|f2|...
      let meFilename = document.currentScript.src.split('/').pop();    // 'EventConnectionGraph-main.js'
      let payload = { source,        // e.g., "EventConnectionGraph",
                      target,        // e.g., "XmarkusAnalyzer",
                      parameters: [],
                      type: "json",
                      message: { purpose,     // e.g., "searchingDocuments",
                                 query: queryStr,                      // {f1|f2|...} or m.filename:f1|f2|...
                                 postAction: postActionStr,            // 2025-10-25
                               },
                    };
      
      // 廣播的完整訊息
      const completeMessage = { from: meFilename, 
                                type: "linkback", 
                                payload, 
                                timestamp: Date.now() };
      XmarkusChannel.postMessage(completeMessage);
   }
   
   // 2025-10-29: 透過 windowObject.postMessage() 傳遞 -- 可支援 file:// 開啟工具
   function linkback2Text(queryStr, postActionStr = '') {
      //alert("linkback2Text: " + queryStr);
      if (GlobalVar.linkToDocuSky) {
         let target = GlobalVar.pageParams["target"];
         let urlParam = "?db=" + GlobalVar.pageParams["db"] 
                      + "&corpus=" + GlobalVar.pageParams["corpus"]
                      + "&query=" + queryStr
                      //+ "&spType=tagAnalysis"
                      + (postActionStr ? "&" + postActionStr : '');
         let url = (target === 'USER') 
                 ? GlobalVar.userPageUrl + urlParam
                 : GlobalVar.openPageUrl + urlParam;
         alert("NOT support linking to DocuSky yet -- " + url);
         //window.open(url, "_blank");
      }
      else {
         // 2025-10-10: 注意，檔名查詢語法是 m.filename:f1|f2|...
         let messageObj = { purpose: "searchingDocuments",
                            //'target': 'USER',
                            //    'db': GlobalVar.docuXmlFilename,
                            //  'corpus': corpus,                            
                            query: queryStr,
                            //postAction: postActionStr,
                          };
         
         // 2025-02-22: 調整訊息格式，改為 source, target, parameters, type, message 四項參數
         let wrapper = { source: "EventConnectionGraph",
                         target: "XmarkusAnalyzer",
                         parameters: [],
                         type: "json",
                         message: messageObj,
                       };
         //alert(JSON.stringify(wrapper));
         
         if (EnableMessageViaParent && parent && (location.protocol == 'file:' || parent.location.href!=location.href)) {
            // 2025-01-16: 加上 location.protocol 與 parent.location.href!=location.href 判斷（即使沒有父視窗，window.parent 似乎仍然成功）
            window.setTimeout(function() {
               window.parent.postMessage(wrapper, '*');         // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
            }, 600);
         }
         else {
            // 2024-10-31: 透過 postMessage 傳遞 DocuXml（字串形式）到應用程式
            let newWindow = window.open('XmarkusAnalyzer.html', '_blank');
            //newWindow.onload = function() {             // 確保新視窗載入完成（應比等待一陣子就傳遞訊息來得好，但... 在 Firefox 似乎事件不會被觸發？）
            window.setTimeout(function() {
               if (newWindow) {
                  newWindow.postMessage(wrapper, '*');    // 注意：若處於 file: 協定，postMessage() 將因 XSS 錯誤而無法送達
               }
               else console.log("Error: newWindow not ready");
            }, 2000);
         }
      }
   }

   // -------------------------------
   //       export functions
   // -------------------------------

   function saveTextFile(filename, text) {
      // 2025-04-26
      let mimeType = "text/plain";
      exportMimeFile(filename, mimeType, text);
   }

   function exportMimeFile(outFilename, mimeType, str) {
      // 2024-11-28
      let blob = new Blob([str], {type: mimeType});
      saveAs(blob, outFilename);
   }
   
   function exportTabulator2Excel(filename = 'VizToolData.xlsx') {   
      // 2025-11-19: 注意必須等 table built 完成，才能下載
      if (GlobalVar.tabulatorBuilt) {
         // GlobalVar.table
         var sheets = { "Graph Data": "#tabulator", //first tab with table set using a query selector
                        //"Example Data": true, //second tab, generated from this table
                        //"Finance Data" : financeTable, //third tab with table set to DOM Node
                      };
         
         //GlobalVar.table.download("xlsx", "test.xlsx");
         GlobalVar.table.download("xlsx", filename, {sheets:sheets}); //download a Xlsx file that has a tab for each table
      }
      else {
         alert("Error: tabulator not built for export");
      }
   }

   function exportFilteredEvents2Xml() { 
      // 2025-11-22   
      let {docuXml, origSize, filteredSize} = getFilteredResultObj();
      //alert(docuXml);
      
      let outFilename = (new Date()).yyyymmdd() + "-Viz-export(" + filteredSize + ").xml";
      let blob = new Blob([docuXml], {type:"application.xml"});
      saveAs(blob, outFilename);
   }
   
   function exportGraph2SvgFile(outFilename = 'VizToolGraph.svg') {
      let mimeType = "image/svg+xml";
      let str = new XMLSerializer().serializeToString(document.getElementById("svgArea"));
      
      // Note: "Not allowed to access cross-origin stylesheet" Error!
      //try {
      //   let linkElement = document.querySelector('link[href="css/EventRelLite-graph.css"]');
      //   let cssRules = linkElement.sheet.cssRules;
      //   let cssString = '';
      //   for (let i = 0; i < cssRules.length; i++) {
      //      cssString += cssRules[i].cssText + '\n';
      //   }
      //} catch(e) {
      //   alert("Error: fail to read the css rules!" + "\n" + e);
      //   return;
      //}

      // 2024-10-18      
      let cssString = $("#EventConnectionGraphCss").html();
      str = str.replace("</svg>", "\n<style>" + cssString + "</style>\n</svg>");
      
      // 2025-01-01: 注意，若匯出的圖形需以 xlink:href 連到某圖檔，則需要加上 xmlns, xmlns:xlink 屬性
      // <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

      let blob = new Blob([str], {type: mimeType});
      saveAs(blob, outFilename);
   }


   function getFilteredResultObj() {
      let graphNodes = Object.keys(GlobalVar.graphNodeDict);     // 包含 'E', 'C', 'I' 等目前顯示的節點\\
      //alert(graphNodes.length + "\n" +JSON.stringify(graphNodes));
      
      let eventNodeFilenames = [];
      graphNodes.forEach(function(graphNodeId) {
         if (checkIfEventNode(graphNodeId)) {
            let nodeInfo = GlobalVar.graphNodeDict[graphNodeId].nodeInfo;
            let nodeObj = nodeInfo[graphNodeId][0];
            //console.log(GlobalVar.graphNodeDict[graphNodeId]);
            //alert(graphNodeId + " --- " + GlobalVar.graphNodeDict[graphNodeId].display + "\n" + JSON.stringify(nodeObj));
            if (GlobalVar.graphNodeDict[graphNodeId].display === 'true') {      // 注意是字串 'true'
               let docFilename = nodeObj.docFilename;
               eventNodeFilenames.push(docFilename);
            }
         }
      });
      
      let jqClone = GlobalVar.jqXml.find("ThdlPrototypeExport").clone();
      
      let origSize = jqClone.find("document").length;
      jqClone.find("document").each(function() {
         let docFilename = $(this).attr("filename");
         if (!eventNodeFilenames.includes(docFilename)) $(this).addClass("toRemove");
      });
      
      jqClone.find("document.toRemove").remove();
      
      // 2025-12-23: export xml 時，必須先將 Event 下，額外加上的 ImmarkusPiece 移除！
      jqClone.find("Event ImmarkusPiece[Key='系統編碼']").remove();
      jqClone.find("Event ImmarkusPiece[ParagraphImmarkusId]").remove();
      
      let filteredSize = jqClone.find("document").length;
      let xmlContent = jqClone.prop("outerHTML");
      let docuXml = '<?xml version="1.0"?>\n' 
                  + xmlContent;
                  
      return {docuXml, origSize, filteredSize};
   }
   
   // ------------------------------------------------------------------------------------------   
   
   
   