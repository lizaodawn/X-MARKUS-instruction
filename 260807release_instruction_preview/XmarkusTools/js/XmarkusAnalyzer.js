   // global constants and variables
   const EnableMessageViaParent = true;            // 2024-12-25: 是否透過 parent 傳遞訊息
   const UseLeftSidebar = false;                   // 2024-11-04: 是否採用 left-sidebar 置放功能鈕
   const ResetGlobalVarOnParsingDocuXml = true;    // 2025-06-14: 是否在 parsing DocuXml 前就重設 GlobalVars -- 注意：若設為 false，UI 必須提供 RESET 按鈕
   const EnableDocuSkyConnectivity = true;         // 上線後預設為 false（與 DocuSky 完全獨立開）。若為 true，則參考 DocuSky.connectivity.js 取得 DocuSkyHost（主要是為了開發測試作為 scafford 使用）
   
   const COLORS_6 = [ 'navy', 'darkgreen', 'purple', 'darkorange', 'red', 'blue' ];
   const COLORS_10 = [ '#CD5C5C',                  // 紅
                       '#E67E22',                  // 橙
                       '#F1C40F',                  // 黃
                       '#58D68D',                  // 綠
                       '#5DADE2',                  // 藍
                       '#2471A3',                  // 靛
                       '#8E44AD',                  // 紫
                       '#117A65',                  // 墨綠
                       '#C39BD3',                  // 淡紫
                       '#CACFD2',                  // 灰色
                      ];

   // 指定 DocuXml 的 metadata tags (e.g., <title>, <author>, <year_for_grouping>) ，以及其對應到的後分類減寫
   const XmarkusMetadataAbbrMap = { 'title': 'TITLE',                // 2024-12-30: 文件標題經常是 <dataSource>:<pieceTitle> 形式，不適合後分類
                                    'author': 'AU',                  // 'AU' 等簡寫，盡量跟 DocuSky 相容...
                                    'year_for_grouping': 'ADY',      // 注意：這幾項後分類，cue 主要是取自 @RefId，沒有 RefId 才會取標籤內文
                                    //'date_ad_year': 'ADY2',        // 2025-11-08: （新版 DocuXml？）CBDB 後分類採用的標籤... 但在此與 'year_for_grouping' 共用 'ADY' 會出問題...
                                    'docclass': 'CLASS',             // e.g., 'Piece_title'
                                    'compilation_name': 'COMP',      // e.g., 'Data_source'
                                    'topic': 'TP',                   // 2025-10-21
                                    'doctype': 'DT',                 // e.g., 'Place_covered'
                                    'book_code': 'BC',               
                                    'time_dynasty': 'DYN',           
                                    'geo_level1': 'GEO1',            // 2025-06-06
                                    //'doc_source': 'SRC',           // 註：doc_source 已經被 M2D 用來儲存匯入的檔名
                                    //'timeseq_not_before': 'TNB',   // 2026-03-31: still under TEST
                                    //'timeseq_not_after': 'TNA',    // 2026-03-31: still under TEST
                                  };

   const XmarkusAbbrMetadataMap = {};                              // XmarkusMetadataAbbrMap 的反函數
   for (let key in XmarkusMetadataAbbrMap) XmarkusAbbrMetadataMap[XmarkusMetadataAbbrMap[key]] = key;
   
   // (TODO) API endpoints
   const API_URL = { // PersonAuthority
                     'DilaPersonAuthoritySearch': 'https://authority.dila.edu.tw/person/search.php',               // 人名權威網頁呈現
                     'DilaApiGetAuthorityData': 'https://authority.dila.edu.tw/webwidget/getAuthorityData.php',    // 地名支援多 id 查詢（用空白斷開），例如 https://authority.dila.edu.tw/webwidget/getAuthorityData.php?type=place&id=PL000000000001%20PL000000000083
                     //'CbdbApiPerson': 'https://cbdb.fas.harvard.edu/cbdbapi/person.php',
                     'CbdbApiPerson': 'https://input.cbdb.fas.harvard.edu/cbdbapi/person.php',
                     'KauthApiPerson': 'https://sillok.history.go.kr/manInfo/popManDetail.do',
                     'DocuGisLite': 'https://docusky.org.tw/DocuSky/docuTools/DocuGIS/api/lite.html',              // 2019-12-06
                     'TwoDimTableLite': 'TwoDimTableLite.html',     // TEST
                   };
   
   // 2025-07-11, 2025-09-24 order based on Dawn's feedback
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
                              
   // global variables
   var ConfigVar = { cuesUnificationMap: {},                            // 2024-11-25: 由於每次載入 DocuXml 會重設 GlobalVar，Config 參數必須放在不同的全域變數
                     onlyShowAlignObjIdCueWithMultiTypes: true,         // 2026-03-15: 2/23 開會希望 align_evt_img 下的 Udef_Align_{obj}_ID 後分類列表僅顯示「同時有 Event/Image」的項目
                     showUdefImgNoteTranscriptorId: true,               // 2026-04-08: 顯示 transcriptorId
                     enableClickingImageShape: false,                   // 2026-04-05: 是否可點選 image shape（目前只是將該形狀 de-highlight）
                     enableClickingUdefPropertiesLocation: false,       // 2026-05-01: 尚在開發測試中
                     showRelationEntityLabel: true,                     // 2026-08-05: 將預設改為 true（false 會顯示 immarkus id）
                     showRelationEntityClass: false,                    // 2026-07-10: 暫且先設為 false
                     enableRelationPieceButton: false,                  // 2026-07-??: 實驗性質（沒時間處理好，應該也有 bugs），暫時先設為 false
                   };
   var StateVar =  { ctrlPressed: false,                                // 2026-04-05                   
                   };

   var GlobalVar = {};                                                  // 在 resetGlobalVar() 設定
   
   var DocuSkyObj = null;
   var DocuSkyDbDocList = [];
                   

   // ---------------------------
   //       init functions
   // ---------------------------

   window.onload = (function(e) {
      init();
   });

   $(window).bind('beforeunload', function(evt) {
      if (GlobalVar.confirmBeforeUnload) {
         // FF 似乎會有些特殊處理方式，事件處理器中需有 confirm，但訊息會被轉換成特定的是否離開訊息
         evt.stopPropagation();              // 2024-11-22
         let answer = confirm("Are you sure you want to leave?");
         return answer;
      }
   });
   
   // 2026-04-05
   document.addEventListener("keydown", e => {
      if (e.key === "Control") StateVar.ctrlPressed = true;
   });

   document.addEventListener("keyup", e => {
      if (e.key === "Control") StateVar.ctrlPressed = false;
   });
   
   function init() {
      resetGlobalVar();
      initDynamicContentEventListening();
      initDisplayFuncButtons();
      resizeSpotlightColumnDocked();
      resizeOverlay();
   }
   
   function resetGlobalVar() {
      GlobalVar = { dbName: '',                               // 2025-10-28: 增補（原先是直接用 docuXmlFilename）
                                                              
                    docuXmlFilename: '',                      // 2024-08-25
                    srcDocuXmlList: [],                       // 2024-11-21: 保留原始 DocuXml 字串（用陣列是為了保留日後多份 DocuXml 的彈性）
                    totalDocs: 0,                             // 應等於 Object.keys(docFilenameCorpusMap).length
                    corpusSettings: {},                       // corpusSettings[corpus] = {metadataFieldSettings, featureAnalysis, xml} -- 其中 xml 是為了方便 export DocuXml 時可直接取用
                    enableDocuTools: false,                   // 2024-11-12: 可使用 DocuSky Lites 視覺化工具，例如年代分佈的 url
                    forceMerging2SingleCorpus: true,          // 2025-12-06: (實驗性質）若有多份 corpuses，將其文獻集名稱通通改為 'XA-AutoMergedDb'
                                                              
                    enableUdefMetaTags4Analysis: true,        // 2025-07-01: 是否將 <xml_metadata> 內的自訂標籤，加入 tags 後分類（新版 X-MARKUS 需設為 true，cf. viz tool useDocuXmlMetadataInsteadOfXmlMetadata 預設 false）
                    assignNullValue2MissingUdefTags: false,   // 2025-10-31: 出現在 <feature_analysis> 的 tags，若沒有出現在文件中，是否自動指定 GlobalVar.docDict[docCorpus][docFilename].tagStats[tagName]['[NULL]'] = { freq: 1, terms:['[NULL]'] } -- 注意不是用 [NONE]
                    enableMetadataFieldDisplayOrder: false,   // 2025-11-06: 預設為 false -- 是否依照 Docusky 規則，以 <metadata_settings> 的 display_order 對後分類選單排序

                    docDict: {},                              // 所有文件的詳細字典 docDict[corpus][filename] = {filename, metadata, tagStats, xaStats, jqDoc, fulltext, metadataText, tagsText}，有 corpus 與 filename 即可取得文件數據
                                                              // (TODO) 加入 featureCooccurrence := {corpus1: {m.TITLE:3, m.ADY:3, m.DT:4, t.xxx:n }, corpus2:{...}} 其中 {type}.{abbr} 為後分類 feature， {n} 為此 corpus 中共有此 feature 的文件篇數
                                                              //        允許 corpus1, corpus2 是為了日後支援多文獻集先預留
                    corpusCount: 0,                           // 文件載入後，透過 Object.keys(GlobalVar.docDict).length 取得
                                                              
                    docFilenameCorpusMap: {},                 // 從檔名取得文獻集名稱
                    docFilenameJqDocMap: {},                  // 2024-09-02: 從檔名直接取得 jqDoc（與 docDict[corpus][filename].jqDoc 指向相同 jqDoc 物件）
                    dbMetadataSpotlightFilenames: {},                  // 2024-09-02: metadata 後分類的文件分佈，用於 filter documents
                    dbTagsSpotlightFilenames: {},                      // 2024-09-02: tags 後分類的文件分佈，用於 filter documents
                    dbXaSpotlightFilenames: {},                        // 2024-11-10: dbXaSpotlightFilenames[corpus][xaName][cue] = { filenames, freq, terms }
                    filteredResult: { query : '',                      // 就是查詢時的 $("#queryFilter").val() -- 後續若 queryFilter 被更動但尚未發出，兩者的值就不同
                                      queryTermsInfo: {},              // {spotlightTermsObj:{}, fulltextTerms:[]}, 分別儲存 query 中 spotlight/fulltext 需 highlight 的 cues/terms
                                      queryFilters: {},                // 2024-11-21: {fulltextFilters:[...], spotlightFilters:[...]} 將 query parts 分別放入 fulltextFilters 和 spotlightFilters（儲存起來給給後續計算 2-dim 時使用）
                                      metadataDocsDict: {},            // metadataDocsDict[corpus][metadataField] = [docRef1, docRef2, ...], where docRefi is a reference to GlobalVar.docDict[docCorpus][docFilename]
                                      tagsDocsDict: {},                // tagsDocsDict[corpus][tagName] = [docRef1, docRef2, ...], where docRefi is a reference to GlobalVar.docDict[docCorpus][docFilename]
                                      xaDocsDict: {},                  // 仿 tagsDocsDict
                                      metadataSpotlight: {},           // 2024-11-06: metadataSpotlight[corpus][mfield][cue] = { filenames:[...], freq:n }
                                      tagsSpotlight: {},               // tagsSpotlight[corpus][tagName][cue] = { freq, terms }
                                      xaSpotlight: {},                 // xaSpotlight[corpus]['Udef_XaSpotlight'][cue] = { freq, terms } -- 目前 terms 應該與 cue 相同
                                      filteredDocFilenameList: [],     // filteredDocFilenameList = [f1, ...], where fi is docFilename
                                      corpusJqDocFilenameHash: {},     // 透過 filteredDocFilenameList 取得對應的 jqDoc 並拆分到各 corpuses，corpusJqDocFilenameHash[corpus][filename] = jqDoc
                                    },                                 
                                                                       
                    prevCorpus:'',                                     // 2025-02-10, 2025-02-15: 由 corpusFocused 改名為 prevCorpus
                    prevSpotlightCat:'ALL',                            // 2025-01-24, 2025-02-15: 新加入的 "spotlight" 類型 (metadata, udef_docmeta, text_tags, txt_event_tree, txt_evt_genre, img_properties, img_tags, img_property_tree, xa) 分類
                    prevSpotlight:'',                                  // 2025-02-08, 2025-02-15: 從 spotlightFocused 更名為 prevSpotlight
                    prevCueList: [],                                   // 2025-01-22, 2025-02-15: 自動將 spotlitTable 下的這些 cues 勾選起來
                    prevSortDocsBy:'m.filename',                       // 2025-10-24
                    prevSortDocsOption:'asc',
                                                                       
                    leftSidebarWidth: 0,                               // 2024-11-04
                    reservedScrollTopHeight: 120,                      // 以程式讓文件捲動時，上方保留的點數
                    
                    pageSize: 10,                                      // 每一頁最多文件篇數
                    curResultSize: 0,                                  // 當前 search result 的文件數量
                    curPageNumber: 1,                                  // 需知道當前的 pageNumber，才能取得對應的文件（bug fix: initial value must be 1）
                    curPageDocs: 0,                                    // 當前顯示頁面所包含的文件數

                    enableQueryHistory: false,                         // 2025-10-25: 若 enableQueryHistory, historyPagingEnabled, historySpotlightChangeEnabled, historySortDocsByEnabled 均為 false，則啟用 butQueryBack
                    historyPagingEnabled: false,                       // 2025-10-25: 是否切換頁面也需加入 query history
                    //historySpotlightCatChangeEnabled: false,         // 尚未實作
                    historySpotlightChangeEnabled: false,              // 2024-10-30: history 是否將 spotlight change 列入
                    historySortDocsByEnabled: false,                   // 2025-10-25: history 是否將 sortDocsBy change 列入

                    queryHistory: [],                                  // [historyItem, ...] where historyItem = {dbXml, query, corpus, spotlight, postActions} and postActions is an array of actions
                    historyEntry: 0,                                   // 通常是 queryHistory 的長度（下一個元素可擺入的位置），但使用者藉由 history 前後瀏覽時，就不一定是 queryHistory 長度

                    enableDocumentBag: true,                           // 2025-11-03
                    documentBag: [],                                   // 2025-11-03: 儲存 search results 累加後的 document collection
                    
                    udefTagHighlighted: false,                         // 2024-10-10: 切換是否對 .udef 標籤套上高亮顯示
                    jqPagination: null,                                // 2024-10-29: $("#paginationContainer")
                    paginationCallbackInvokded: false,                 // 2024-10-29: 必須在 paginationCallbackInvokded 設為 true 之後，才能處理 postActions 
                    displayTagWithRefId: true,                         // 2024-11-14: highlight tags 時，除了顯示標籤名稱，是否也顯示 RefId
                    hideSpotlightWithSingleCue: false,                 // 2024-11-02: 若 spotlight 僅包含一項 cue，選單 spotlightSelect 就不顯示該 spotlight -- 通常還是設為 true 比較好
                    alwaysHideMetaSpWithSingleUndefCue: true,          // 2025-12-18
                    
                    docContainsComarkusTags: false,                    // 2025-06-06: 載入的 DocuXml (為了簡單，只檢查 corpus settings) 後分類是否包含 Comarkus tags（若有，則顯示 text highlight 選單）
                                                                       
                    udefEvtTagsUseContentButNotRefIdAsCue: true,       // 2025-02-12: 對於 comarkus event tags <Udef_Evt_xxx> 的後分類，是否一律採用標籤內容（而非 RefId 優先）作為 cue -- 預設為 true，此時可將 spotlightSelectShowGenre 設為 false（不再需顯示 Genre）
                    showTagSpotlightCuesAsTree: false,                 // 2025-02-17: 是否用 "<refid>/<tag_text>" 作為 cue -- 如此則可支援兩層樹狀顯示。若設為 false，則採 DocuSky tag 後分類樣貌（用 refid 作為 cue, text value 作為 term）。
                    spotlightSelectShowGenre: false,                   // 2025-01-14: 後分類選單是否顯示 Udef_Evt_XXX.Genre（Dawn asked "event-level" spotlights）
                    spotlightSelectShowUdefEventElement: true,         // 2024-11-17: 是否將 <Udef_Event_Element> 加入 tags 後分類列表
                    spotlightSelectShowDefaultTags: true,              // 2024-11-17: 是否將 ["Date", "LocName", "PersonName", "Office"] 加入 tags 後分類
                    spotlightSelectAddCueCount: false,                 // 2024-11-17: 後分類選單，除了顯示後分類名稱，是否還要顯示該後分類下有幾個 cues
                    spotlightSelectExcludedItems: ['filename',         // 2025-10-25: 將 'filename', 'TITLE' (注意不是 docTitle) 排除在後分類選單外
                                                   'TITLE'],
                    highlightSplittedTreePathTerms: true,              // 2026-07-03: 查詢 Udef_xxx:a/b/c 時，將 spTerms 從 'a/b/c' 改成 ['a','b','c'] -- 否則高亮處理會找不到 "Udef_properties_texture/brick_arrangement"（因 events 區顯示的字串為 properties_texture: brick_arrangement）來進行高亮
                                                                       
                    searchRange: 'all',                                // 2026-03-08: 透過 $("#searchRange").val() 取得
                    searchFulltextIncludingEventRefId: true,           // 2026-03-08: 將 Event RefId 加入 fulltext（搜尋時可找到該 RefId 文件 -- 但高亮部分尚未處理，因此預設為 false）
                    
                    highlightTextWithEscapedCue: true,                 // 2025-10-28: 是否在高亮比對時，需將文本中的空白轉成底線（cue 不允許空白，因此空白會被轉成底線）
                    confirmBeforeUnload: false,                        // 2024-11-22: 離開頁面前，是否需跳出確認對話盒
                    removeInfixMarkusFromRefId: true,                  // 2025-02-11: 若顯示 UdefInfo 時，不希望出現「額外」的 "markus_" 中綴，則可將此設為 true
                    
                    textFilterOnTerms: 'udefXmarkusTags',              // 2025-05-31: 'allTags', 'udefXmarkusTags', 'allUdefTags'
                    highlightPiecesAfterUpdate: true,                  // 2025-06-08: 是否預設載入 DocuXml 後，每次更新頁面內容都 highlight immarkus pieces
                    
                    outputImageAlignTags: true,                        // 2025-11-30: 是否在 event area 輸出 IMMARKUS 的 image align 數據（Udef_Align_）
                    outputImageGenreTags: false,                       // 2025-07-21: 是否在 event area 輸出 IMMARKUS 的 image genre 數據（Udef_Genre_）
                    outputImageRelation: true,                         // 2026-06-20: Event 需匯出 piece relations (e.g., "Relation: -- part of whole"）
                    
                    svgImageScrollSpecificBannerPainting: false,       // 2025-04-08: 當 svg image 為特殊的橫幅狀態（寬度大於 800，高度卻小於 400，例如某些早期 iiif 橫幅圖），是否顯示水平捲軸
                    maxPieceHighlightColor: 16,                        // 2025-06-13: 注意，image piece 和對應的 button 都應採用相同底色（透過 ChatGPT 將原先 6 色增為 16 色）
                    
                    addon: { spotlightSparkMaxCues: 8,                 // 2024-12-16
                           },
                           
                    treeJsObj: null,                                   // 2025-02-15: treejs object
                    subwinZindex: 1,                                   // 2025-03-08: 控制 sub-windows 的 z-index
                    
                    curMetadataDisplay: true,                          // 2025-07-11: 預設顯示
                    curCommentsDisplay: true,                          // 2025-07-11: 預設顯示
                    
                    enableMatchingByTagTextOnly: true,                 // 2025-07-12: 比對 comarkus event element 和 entmakus 原文標記時，若 RefId 比對不到，是否採用寬鬆的 tag text 文字比對
                    enableTreeNonLeafFreq: false,                      // 2025-07-18: 是否利用後分類 X.GenreL{n}，讓樹狀結構的非葉節點也能顯示該節點的文件數量
                    enableQueryWithCorpus: false,                      // 2025-07-25: 當 corpus 數量超過 1，是否自動在 query 前加上 "CORPUS>"（其中 CORPUS 為當前的 corpus name）

                    hideNormalMetadataSpotlights: false,               // 2025-07-17: X-MARKUS 預設 true -- 是否隱藏「正常 DocuSky 意義下的」metadata（先期實驗加上的 <author>、<doc_compilation>、<geo_level1> 等可後分類的欄位）
                    hideMetadataSpotlightByField: [],                  // 2026-03-20: 例如 ['ADY', 'AU'] 可隱藏 metadata Year, Author 欄位
                    hideTagSpotlightByCategory: ['txt_evt_genre'],     // 2026-03-16: 隱藏後分類哪些 categories（例如 Udef_Event_Element, Udef_Event_TimeSpan_100Y 的 category 會被歸屬於 txt_evt_genre）
                    
                    addSortOption2Year: true,                          // 2026-03-20: 是否在 SortBy 的列表中，將 m.ADY 加上 ASC/DESC 選項（其他欄位似乎沒必要加上排序方式）
                    enableSortDocsOption: false,                       // 2026-04-02: 注意，額外加上 sortDocsOption 需考慮 history 與對應狀態...（若設為 true，addSortOption2Year 應設為 false 以避免重覆）
                    enableAddingSortDocsByValue2Title: false,          // 2025-12-09: 是否在 sortDocsBy 不為 'm.filename' 的狀況下，將 sortDocsBy (例如 'm.AU', 'm.COMP') 的值加到文件標題列 -- 至少可方便檢錯
                    
                    showObjPartLinkedInnerTagName: false,              // 2025-10-05: OBJ_PART_LINKED (ComarkusBundle) 包含了多個標籤，是否將標籤 Udef_Evt_MATERIAL 的 'MATERIAL' 提取出來顯示
                    autoExtractUdefTags4FeatureAnalysis: false,        // 2025-10-30: 是否直接從內文，將所有 Udef_ 開頭的標籤都加入 GlobalVar.corpusSettings[corpus].featureAnalysis
 
                    markHighlightColorBound: 5,                        // 2024-11-23: 查詢找到詞彙後，會用 <mark> 標記來呈現 highlight，最多有幾種 highlight 顏色 (max 10)
                    enableHighlightCrossTagsMarkTerm: false,           // 2025-11-03: 是否 spTermsObj 用舊模式，ftTerms 用 markTerm()（例如查詢「m.AU:蔡清 三十里 張 清」可觀察不同效果）
                    reverseTermOrderOnHighlight: false,                // 2025-11-14: 若為 true，query "A B C" 會以 C, B, A 順序進行 <mark> 標記                    
                    highlightMatchingColorByRegExp: false,             // 2026-03-16: highlight matching terms 時，是否以 regexp 比對 allTerms（而非直接用字串比對）來填色
                    highlightTermsColorBySpotlightType: false,         // 2026-03-16: （若 highlightMatchingColorByRegExp 為 false 才檢查）是否根據 term 屬於哪個 spotlight 來分配顏色（若設為 true，相同 spotlight 下的 terms 會被分配相同顏色）
                    
                    skipSpotlightCat: ['img_genre'],                   // 2025-12-18: 後分類菜單中，要跳過哪些類別（metadata, text_tags, txt_event_tree; udef_docmeta, img_genre, img_property_tree, img_properties, img_entity_tree, align_evt_img）
                    spotlightCatWithTreeUi: ['txt_event_tree',         // 2025-12-23
                                             'img_property_tree', 
                                             'img_entity_tree',
                                            ],
                                             
                    enableFulltextPartialSearch: true,                 // 2026-01-20 開會說希望提供「partial search」
                  };
   }
   
   function initDynamicContentEventListening() {
      // 2026-04-05: (TODO) 文件動態加入的狀況下，處理 image click
      //             .immarkus-image-container 下有 polygon, path 等 IMMARKUS 產生的 shapes
      if (ConfigVar.enableClickingImageShape) {
         $(document).on('click',
                        'rect,circle,ellipse,polygon,path,line,polyline',
                        function(e) {
            //alert($(this).prop('outerHTML'));
            let key = $(this).attr("Key");
            let pieceImmarkusId = $(this).attr('pieceImmarkusId');
            
            //alert($(this).closest('div').prop('outerHTML'));     // div.immarkus-image-container
            let jqDocEvents = $(this).closest('tr.docContent').find("td.docEvents");
            jqDocEvents.find(`span.butHighlightImmarkusPiece[Key='${key}']`).click();
            e.stopPropagation();
         });
      }
   }

   function initDisplayFuncButtons() {
      // 2024-11-04: 載入時，所有功能按鈕都是隱藏，必須在此將可用的功能按鈕顯示出來
      if (UseLeftSidebar) {
         GlobalVar.leftSidebarWidth = 50;
         let cssObj = { left: (GlobalVar.leftSidebarWidth+2) + "px" };         // 加上 2px 留白（作為分隔線）
         let selector = "#divMainAreaTopBarDocked, #divMainArea, "
                      + "#divSpotlightSelectDocked, #spotlightResultDocked, #cuesActionBarDocked";
         $(selector).css(cssObj);
         $("#divLeftSidebar").show();
      }
      else {
         GlobalVar.leftSidebarWidth = 0
         let cssObj = { left: (GlobalVar.leftSidebarWidth) + "px",
                        width: "100%" };
         let selector = "#divMainAreaTopBarDocked, #divMainArea";
         $(selector).css(cssObj);

         selector = "#butLoadDocuXmlFile, "
                  + "#butInvokeEventConnectionGraphAndPostMessage, #butInvokeMundaAndPostMessage, "
                  + "#butAddRemoveXaTagsToFilteredDocs, "
                  + "#butExportDocSpotlightTable, #butExportPostClassification, "
                  + "#butSaveFile";
         $(selector).show();
      }
      
      if (GlobalVar.enableSortDocsOption) $("#sortDocsOption").show();   // 2026-04-02       
      
      if (!GlobalVar.enableQueryHistory) $("#historyControl").hide();    // 2025-10-25
      if (!GlobalVar.enableDocumentBag) $("#documentBag").hide();        // 2025-11-03
      
      $(".experimentFeatures").hide();                                   // 2024-11-12
   }
   
   // 2025-07-23: 註冊事件，加上讓使用者輸入查詢字串後，可按下 Enter 啟動檢索
   $(document).ready(function() {
      $("#queryFilter").on("keydown", function(e) {
         if (e.key === "Enter" || e.keyCode === 13) {
            e.preventDefault();
            $("#butQueryGo").click();
         }
      });
      
      // TEST: DocuSky functions
      if (EnableDocuSkyConnectivity && window.DocuSkyHost) {       // 2024-09-01: 加入 EnableDocuSkyConnectivity 檢查
         //$("#butDocuSkyWidget").show();
         
         //DocuSkyObj = docuskyManageDbListSimpleUI;               // cf. components/js/docusky.ui.manageDbListSimpleUI.js
         DocuSkyObj = docuskyGetDbCorpusDocumentsSimpleUI;         // cf. components/js/docusky.ui.getDbCorpusDocumentsSimpleUI.js
         DocuSkyDbDocList = [];                                    // reset

         $("#butDocuSkyWidget").click(function(evt) {
            var target = 'USER';
            var db = '', corpus = '';             // empty string: force the simpleUI to display a menu for user selection
            var page = 1;
            var pageSize = 200;
            DocuSkyObj.getDbCorpusDocumentsGivenPageAndSize(target, db, corpus, page, pageSize, evt, finishFetchingDocuSkyPage);
         });
      }
      
   });
   
   function finishFetchingDocuSkyPage() {
      // 2025-10-28: 後續還需取得所有 pages 的內容，並串接起來
      //alert(DocuSkyObj.totalFound);
      //alert(JSON.stringify(DocuSkyObj.docList));
      //alert(DocuSkyObj.db);
      
      DocuSkyObj.docList.forEach(function(v) {
         putDocuSkyDocToDbDocList(v);
      });
      
      if (DocuSkyDbDocList.length < DocuSkyObj.totalFound) {
         fetchNextPage(DocuSkyObj.page+1, DocuSkyObj.pageSize);
      }
      else {
         // finish fetching the database documents
         // compose DocuXml: 注意，目前透過 DocuSky 下載 DocuXml，在 XmarkusAnalyzer 後分類區塊將不會有 txt_event_tree 選項！
         //                  => 可能因為缺少 corpus settings 中的 <tag type="contentTagging" name="Udef_Evt_TIME.GenreL1" default_category="Udef_Evt_TIME.GenreL1" default_sub_category="-"/> 設定
         let docuXml = "<ThdlPrototypeExport>"
                     // + <corpus>...</corpus>        // 為了簡化，暫時略去...
                     + "<documents>"         
                     + DocuSkyDbDocList.join("\n")
                     + "</documents>"
                     + "</ThdlPrototypeExport>";
                     
         $("#dbName").text(DocuSkyObj.db)
         parseDocuXmlStr(docuXml);
      }
   }
   
   function fetchNextPage(page, pageSize) {
      DocuSkyObj.getDbCorpusDocumentsGivenPageAndSize(DocuSkyObj.target, DocuSkyObj.db, DocuSkyObj.corpus, page, pageSize, null, finishFetchingDocuSkyPage);
   }
   
   function putDocuSkyDocToDbDocList(v) {
      // 呃，為了簡單化後續處理程序。嘗試兜回原始的 DocuXml 文件樣貌...
      let docInfo = v.docInfo;
      //alert(JSON.stringify(docInfo));
      
      // 僅取出以下欄位...
      let corpus = docInfo.corpus;
      let docAuthor = docInfo.docAuthor || '-';           
      let docClass = docInfo.docClass || '-';
      let docCompilation = docInfo.docCompilation || '-';
      let docTopic = docInfo.docTopic || '-';                  // 2025-10-21
      let docSource = docInfo.docSource || '-';
      let docContentXml = docInfo.docContentXml;
      let docFilename = docInfo.docFilename;
      let docMetadataXml = docInfo.docMetadataXml || '';       // 有時會沒有值？
      let docTitleXml = docInfo.docTitleXml || '';
      let dateAdYear = (docInfo.timeInfo)
                     ? docInfo.timeInfo.dateAdYear
                     : '0000';

      // "<DocMetadata>...</DocMetadata>", "<Content>...</Content>"
      let xmlMetadataStr = docMetadataXml.replace(/DocMetadata>/g, 'xml_metadata>');
      let docContentStr = docContentXml.replace(/Content>/g, 'doc_content>');
      
      let docXml = `<document filename="${docFilename}">`
                 + `<corpus>${corpus}</corpus>`
                 + `<title>${docTitleXml}</title>`
                 + `<author>${docAuthor}</author>`
                 + `<compilation_name>${docCompilation}</compilation_name>`
                 + `<topic>${docTopic}</topic>`
                 + `<docclass>${docClass}</docclass>`
                 + `<year_for_grouping>${dateAdYear}</year_for_grouping>`
                 + `<doc_source>${docSource}</doc_source>`
                 + xmlMetadataStr
                 + docContentStr
                 + '</document>';
      //console.log(v);
      //console.log(docXml);
      
      // 放入全域變數 DocuSkyDbDocList
      DocuSkyDbDocList.push(docXml);
   }

   // ------------------------------------------------------------------------------------------

   function resizeOverlay() {
      let h = window.innerHeight;
      let w = window.innerWidth;
      $("#overlay").css({width: w + 'px', height: h + 'px'});
   }
   
   // let dataSource = [...Array(GlobalVar.totalFound).keys()];
   // e.g., showPagination('paginationContainer', dataSource);
   var showPagination = function(paginationId, dataSource) {
      // https://pagination.js.org/docs/index.html
      // 注意：如果 dataSource 的元素數量小於 pageSize，pagination 會自動隱藏不顯示！

      // 2024-10-28: 必須 reset，否則若 dataSource 只有 7 萹文件，但 curPageNumber = 2，後續計算會「找不到文件來顯示」
      GlobalVar.curPageNumber = 1;
      
      // 舊的 pagination 若還存在，必須先 destroy 掉
      GlobalVar.jqPagination = $("#" + paginationId);            // container
      if (typeof GlobalVar.jqPagination['destroy'] === 'function') {
         GlobalVar.jqPagination.destroy();
      }
      
      GlobalVar.jqPagination.pagination({
         dataSource: dataSource,
         pageRange: 1,              // a range of pages that should be display around current page -- 2026-03-16: 從 2 改為 1
         pageSize: GlobalVar.pageSize,
         pageNumber: 1,           
         autoHidePrevious: true,
         autoHideNext: true,
         //hideWhenLessThanOnePage: true,
         showGoInput: true,
         showGoButton: true,
         formatGoInput: '<span x-disp-key="content.pagination.goto">跳至第</span> <%= input %> <span x-disp-key="content.pagination.page">頁</span>',
         showNavigator: false,
         formatNavigator: '<span style="color: #f00"><%= currentPage %></span> / <%= totalPage %> pages, <%= totalNumber %> entries',
         callback: function(dataInPage, pagination) {
            //alert("callback " + pagination.pageNumber);
            GlobalVar.curPageDocs = dataInPage.length;           // 當前頁面有幾篇文件
            GlobalVar.curPageNumber = pagination.pageNumber;
            updateContentTextAndEvents(true);

            // 2025-07-11: 換頁後，需套用當前的顯示狀態 (color scheme, +/- metadata and tags)
            applyCurTextStyling();
            
            GlobalVar.paginationCallbackInvokded = true;         // 每次 init pagination 後，都會觸發一次 callback，透過此變數儲存是否這 callback 已經被呼叫過（必須在呼叫後才能執行 postActions）
         },
      });

      // 2025-10-25   
      GlobalVar.jqPagination.addHook("afterPageOnClick", function(event) {
         if (GlobalVar.historyPagingEnabled) {
            // 似乎只有原生事件才會觸發，因此不需判斷 event.originalEvent...
            if (event && event.type === 'click') {
               let postActions = [{ "page": GlobalVar.curPageNumber }];
               let obj = { postActions };
               appendHistoryItem(obj);
            }
         }
      });
   };

   // ---------------------------------------------
   //       functions for message handlers
   // ---------------------------------------------

   window.addEventListener("message", messageHandler, false);
   
   function messageHandler(evt) {
      if (!EnableMessageViaParent) return;      // 需打開此參數才能套用以下程式
      //alert(evt.origin);                      // invoker URL hostname
      //alert(evt.source);                      // invoker DOM object
      
      //if (event.origin !== window.location.origin) return;    // 如果來源不符預期，就直接跳過

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
         if (!evt.data) return;                                // to prevent "SyntaxError: JSON.parse: unexpected end of data at line 1 column 1 of the JSON data"
         let {source, target, parameters, type, message} = evt.data;      // 2025-02-20
         
         // 2025-02-20: 如果 source 是自己，表示先前 postMessage 是由自己接收... 意思是沒有 parent（沒能 post 到 parent）
         if (source === 'XmarkusAnalyzer') {
            //if (target === 'EventRelLite') startNewWindow('EventRelLite.html', '_blank');
            if (target === 'EventConnectionGraph') startNewWindow('EventConnectionGraph.html', '_blank');
            else alert("Unknown target: " + target);
         }
         else if (type === 'DocuXml') {
            //alert("I'm XmarkusAnalyzer:\n" + JSON.stringify(message));
            GlobalVar.docuXmlFilename = (new Date()).yyyymmdd() + '-' + source + '(memory).xml';       // 2025-03-18
            GlobalVar.dbName = GlobalVar.docuXmlFilename;      // 2025-10-28
            $("#dbName").text(GlobalVar.dbName);               // 2025-01-19
            parseDocuXmlStr(message);
         }
         else if (type === 'json') {                           // 2025-02-21
            // alert(JSON.stringify(message));
            if (message.purpose === 'searchingDocuments') {
               $("#queryFilter").val(message.query);
               $("#butQueryGo").click();
            }
            else alert("Unknown purpose: " + message.purpose);
         }
         else alert("Unknown type: " + type);
         
         //let json = evt.data;                                // evt.data 似乎會直接被剖析成 json 物件...
      } catch (e) {
         alert(e.name + ": " + e.message);
      }
   }

   
   // ---------------------------------------------
   //        functions for parsing DocuXml
   // ---------------------------------------------
   
   function parseDocuXmlStr(docuXml) {
      // 2024-12-24: 每次 parse 後，都強制隱藏起始的引導說明（或者，等到文件載入完成後再隱藏？）
      //$("#startInstructions").hide();

      if (ResetGlobalVarOnParsingDocuXml) resetGlobalVar();           // 原先是每次都重設... 但需注意，重設後必須填回 docuXmlFilename
      
      // 2025-05-14: 需額外重設的 UI 元件
      $("#selectApplyColorScheme").val('normalText');
      
      GlobalVar.dbName = $("#dbName").text();                         // 2024-10-30: reset 後因 docuXmlFilename, dbName 都會清除，在此必須將 docuXmlFilename 和 dbName 填回
      GlobalVar.docuXmlFilename = GlobalVar.dbName;                   // 2025-10-28
      GlobalVar.srcDocuXmlList.push(docuXml);                         // 2024-11-21: 保留 DocuXml 字串，方便日後若有多份 xml 文件時使用（目前是僅支援單一檔）
      
      // 2024-08-24: xml 是 local disk 載入的 DocuXml
      let xmlDoc = $.parseXML(docuXml);
      let jqXml = $(xmlDoc);
      
      // 注意：整併 Comarkus 和 Immarkus 的 DocuXml，就可能包含多個 corpuses
      showProgressMsg('parse settings');
      GlobalVar.corpusSettings = parseCorpusSettings(jqXml);
      
      let jqDocList = [];
      jqXml.find("documents > document").each(function() {
         jqDocList.push($(this));
      });
      
      // 檢查是否有 commment tag，若沒有則隱藏 #butHideComments 和 #butShowComments
      if (jqXml.find("documents > document").find("Comment").length == 0) {
         $("#butHideComments, #butShowComments").hide();
      }
      
      const chunkSize = 50;
      parseDocuXmlByChunk(jqDocList, 0, chunkSize);
   }
   
   function parseDocuXmlByChunk(jqDocList, start, chunkSize) {
      // parse document 主要是計算 GlobalVar.docDict[corpus][filename] := {filename, metadata, tagStats, xaStats, jqDoc, fulltext, metadataText, tagsText}，
      // 如此一來，後續只要有 corpus 與 filename 即可取得文件數據
      let jqDocChunk = jqDocList.slice(start, start + chunkSize);
      showProgressMsg(start + "/" + jqDocList.length);
      
      jqDocChunk.forEach(function(jqDoc) {
         let docFilename = jqDoc.attr("filename");
         let docCorpus = jqDoc.find("corpus").text() || '-';
         if (GlobalVar.forceMerging2SingleCorpus) docCorpus = 'XA-AutoMergedDb';     // 2025-12-06

         docCorpus = convertToValidCorpus(docCorpus);                 // 2025-07-18: 在 parsing 階段就置換 corpus 不合規的字元

         //alert(docCorpus);
         
         let docDict = GlobalVar.docDict;                             // reference
         if (!docDict[docCorpus]) docDict[docCorpus] = {};
         
         let docDictCorpusObj = docDict[docCorpus];                   // reference
         docDictCorpusObj[docFilename] = {};
         docDictCorpusObj[docFilename].docFilename = docFilename;                       // 2024-09-02: 方便取得 docRef 就可取得 docFilename
         docDictCorpusObj[docFilename].metadata = parseDocMetadata(jqDoc);              // 後分類 metadata[metadataField] = textVal
         docDictCorpusObj[docFilename].tagStats = parseDocTagStats(jqDoc, docCorpus);   // 後分類 tagStats[tagName][cue] = { freq, terms }, where terms is an array of strings (注意，cue 會以 RefId 優先，最後才取標籤內文字）
         docDictCorpusObj[docFilename].xaStats = parseDocXaStats(jqDoc, docCorpus);     // 2024-11-09
         addTagInfo2ContentTags(jqDoc);                                                 // 2024-10-12: 對預設和 Udef 標籤加上 <span class="udef"> 以利後續呈現
         docDictCorpusObj[docFilename].jqDoc = jqDoc;
         
         // 2025-07-31: 檢查是否包含 Entmarkus/Comarkus 標籤（先前是檢查 <corpus> 設定，但那樣很容易出錯）
         if (!GlobalVar.docContainsComarkusTags) {
            const immarkusUdefTagPrefixes = ['Udef_DocMeta_', 'Udef_Genre_', 'Udef_properties_', 'Udef_PieceTreePath', 'Udef_Align_'];
            jqDoc.find("doc_content *").each(function() {
               let tagName = $(this).prop("tagName");
               // 如果文件只包含 Immarkus tags，GlobalVar.docContainsComarkusTags 就應該是 false（不顯示 tag highlighting）
               let isImmarkusUdefTag = immarkusUdefTagPrefixes.some((prefix) => tagName.startsWith(prefix));
               if (tagName.startsWith("Udef_") && !isImmarkusUdefTag) GlobalVar.docContainsComarkusTags = true;
            });
         }

         // 2024-12-30: 計算 fulltext 的內容（是否包含 metadata 和 Comment/Events）
         let jqClone = jqDoc.clone();      // 注意：目前包含 metadata, Comment, Event 等內容
         
         let jqDocContent = jqClone.find("doc_content");              // 不含 metadata 區塊

         let jqEventsComments = jqDocContent.find("Comment,Events");
         docDictCorpusObj[docFilename].tagsText = jqEventsComments.text(); 

         // 移除 Comments/Events 後，才能取得剩下的 main text (fulltext)
         // 注意：若是 IMMARKUS XML，fulltext 會包含有 properties 內容
         //       => 因 <Paragraph> 下的 <ImmarkusObj> 標籤內容會包含 <Udef_Genre_Type> 和 <Udef_properties_name> 的內文
         //       => 但 fulltext 將不會包含 <Compilation> -- 它會被放在 metadataText
         jqDocContent.find("Comment,Events").remove();
         docDictCorpusObj[docFilename].fulltext = jqDocContent.text(); 

         // 注意：jqMetadata.text() 並不是頁面上 metadata 區塊的內容！
         //       頁面上顯示的內容是 parseMetadataXml() 的產出... 
         let metadataHtml = parseMetadataXml(jqClone.find("xml_metadata"));
         //let jqMetadata = jqClone.find("doc_content").remove();
         docDictCorpusObj[docFilename].metadataText = $("<p/>").append(metadataHtml).text(); 
         //alert(docDictCorpusObj[docFilename].metadataText);
         
         if (GlobalVar.searchFulltextIncludingEventRefId) {                       // 2026-03-08: 預設是 false
            // <Udef_Evt_OBJECT_MAIN RefId="siluqili_bridge" MarkusId="...">bridge/西路七里橋</Udef_Evt_OBJECT_MAIN>
            // 原先放在 @RefId 並不會被加入 fulltext，因此查詢全文 siluqili_bridge 會找不到文件（但透過後分類可以找到）
            let refIdList = [];
            jqDoc.find("Comment,Events").find("*[RefId]").each(function() {       // 因 jqClone 可能移除 Events 了，因此直接從 jqDoc 取
               refIdList.push($(this).attr("RefId"));
            });
            docDictCorpusObj[docFilename].fulltext += ' ' + refIdList.join(' ');  // 將 RefId 列表加入 fulltext
         }
         
         GlobalVar.docFilenameCorpusMap[docFilename] = docCorpus;
         GlobalVar.docFilenameJqDocMap[docFilename] = jqDoc;
      });
      
      start += chunkSize;
      if (start >= jqDocList.length) {
         // parse 檔案完畢
         // 2025-07-31: 檔案全部剖析後，才能確認包含 entmarkus/comarkus 標籤，若沒有則隱藏 highlight texts 選單
         if (!GlobalVar.docContainsComarkusTags) $("#selectApplyColorScheme").hide();
         else $("#selectApplyColorScheme").show();             // 2025-07-31: (bug fix) 若先前載入 Immarkus，現在載入 Comarkus，就還是該顯示出來
         
         // 顯示資料庫大小（文件總數）
         GlobalVar.totalDocs = Object.keys(GlobalVar.docFilenameCorpusMap).length;      // 注意：計算整份 DocuXml 中的 unique filenames（若重覆後面的會蓋掉前面的！）
         $("#totalDocuments").text(GlobalVar.totalDocs);
         
         // 2025-07-18: 注意，Comarkus2D 若碰上 empty content html，也會輸出一份 corpus 為 "COMARKUS-CORPUS" 的文件
         GlobalVar.corpusCount = Object.keys(GlobalVar.docDict).length;
         //alert(JSON.stringify(Object.keys(GlobalVar.docDict)));
         
         // 2025-06-06, 2025-07-18: 因應 DocuXml 內容，隱藏不需要的一些選單
         if (GlobalVar.corpusCount <= 1) $("#spanCorpusSelect").hide();
         else $("#spanCorpusSelect").show();
         resizeSpotlightColumnDocked();

         // 除錯用
         //console.log("GlobalVar", GlobalVar);
         
         // 載入 DocuXml 的後續事項: 計算 filteredResult
         showProgressMsg("Analyzing");
         window.setTimeout(function() {
            $("#queryFilter").val("");                                      // reset
            // 將完整後分類計算結果存入 dbMetadataSpotlightFilenames 和 dbTagsSpotlightFilenames
            computeFilteredResultAndPresent(true, 'm.filename', 'asc');     // 注意，只有在起始狀態 filteredResult 為所有文件時，才能傳入 true
            setTimeout(function() {
               appendHistoryItem();
            }, 100);
            hideProgressMsg();
         }, 20);
      }
      else {
         window.setTimeout(() => parseDocuXmlByChunk(jqDocList, start, chunkSize), 10);
      }
   }
   
   function parseMetadataXml(jqUdefMetadata) {
      // 取得 <xml_metadata> 內容（不是 DocuSky 文件後分類的項目內容）
      //alert(jqUdefMetadata.html());
      // 2025-04-23: 改用 <table> 排列
      let metadataHtmlList = [];
      metadataHtmlList.push("<table class='udefMetadata'>");               // 包含 iiif manifest 的特定 metadata 欄位
      let jqRows = jqUdefMetadata.children();
      jqRows.each(function() {
         let udefMetadataTagName = $(this).prop("tagName");
         udefMetadataTagName = udefMetadataTagName.replace(/Udef_DocMeta_/g, '#');    // 2025-06-09
         let s = "<tr>"
               + "<td class='udefMetadataTag'>" + udefMetadataTagName + ":</td>"
               + "<td class='udefMetadataVal'>" + $(this).text() + "</td>"
               + "</tr>";
         metadataHtmlList.push(s);
      });
      if (jqRows.length == 0) metadataHtmlList.push("<tr><td colspan='2'>No metadata</td></tr>");
      metadataHtmlList.push("</table'>");
      return metadataHtmlList.join("\n");
   }
   
   function getContentPlusSvgHtml(jqContent, containerDocNumber) {
      let contentHtml = '';
      if (jqContent.find("ImmarkusImage").length > 0) {
         // svg image
         contentHtml += parseImmarkusContent2GenSvgImage(jqContent, containerDocNumber);
      }
      else {
         // 2024-08-31: 不含 ImmarkusImage，先直接回傳 DocuXml 文件
         contentHtml = jqContent.html();      // 暫時先回傳整份結構
      }
      return contentHtml;
   }
   
   function parseImmarkusContent2GenSvgImage(jqContent, containerDocNumber = 0) {
      // 2024-11-06: 注意，immarkus image 是用 <doc_content> 下的內容繪製（不是 <Events> 下的內容）
      // 2025-03-05: 從 getContentPlusSvgHtml() 獨立出來
      let contentHtml = '';
      jqContent.find("ImmarkusImage")        // 注意：<document> 下有兩組 ImmarkusImage（一組直接在 document 下，一組在 Event 下）
               .each(function(immarkusImageIdx) {
         // 2026-07-25: 若父節點是 Event 則跳過
         if ($(this).parent().prop("tagName") == 'Event') return;
         
         // 2024-09-01: 僅顯示 immarkus image，忽略其他訊息（Events 有重覆的內容，將顯示於該區域）
         let jqImmarkusImage = $(this);;
         let origUrl = jqImmarkusImage.attr("Url");
         let imageFilename = origUrl.split('/').at(-1);        // take the last element of array
         
         // 2025-06-18: 移除 LocalUrl 選項
         let url = jqImmarkusImage.attr("Url");
         let imageWidth = jqImmarkusImage.attr("Width") || '0';       // 2026-01-18: 可能未定義（尤其是舊版轉出的）...
         let imageHeight = jqImmarkusImage.attr("Height") || '0';     // 2026-01-18: 可能未定義（尤其是舊版轉出的）...
         
         // 2024-09-01: 拷貝自 DocuSky 檢索頁
         // 2024-05-01: 取得文件中 <ImmarkusShape> 的 @SelectorValue （假設 SelectorType 必定是 "SvgSelector"）
         //             目前一個 ImmarkusPiece 下應該只有一份 ImmarkusShape？
         
         // 2025-04-22: <Paragraph>
         //                 <ImmarkusObj>
         //                    <ImmarkusShape>...</ImmarkusShape>    <= 注意，有的 annotation item 只有 body 沒有 shape
         //                    <ImmarkusBody>...</ImmarkusBody>
         //                 </ImmarkusObj>
         //              </Paragraph>
         let shapeList = [];
         jqContent.find("ImmarkusShape").each(function(idx) {
            let shapeVal = $(this).attr("SelectorValue");
            let shapeKey = $(this).attr("Key");                              // e.g., "mark:0", "mark:1"
            
            let pieceImmarkusId = $(this).closest("Paragraph").attr("ImmarkusId");
            
            // 可以個別指定 fill, stroke, stroke-width 屬性，也可以透過 style 通通放在一起 style="fill:xx; stroke:yy; stroke-width:zz"
            // 完成後 s 會成為 <polygon points="..." Key="..." fill="..."> 字串
            let pieceSvg = $("<div/>").append(shapeVal).find("svg");
            pieceSvg.children()
                    .attr("Key", shapeKey)                          // 2024-05-02: 加上 Key 以利後續加框等動作
                    .attr("PieceImmarkusId", pieceImmarkusId)       // 2025-03-05
                    .attr("style", "display:none");                 // 2024-11-07: 預設隱藏 shapes            
            
            // 2025-04-17: 除了 polygon，目前也有可能是 rect 或 path（若遺漏會變成一塊黑色）
            // 2026-01-18: 加上 ellipse 以及其他 svg shape tags
            let shapeTags = "rect,circle,ellipse,polygon,path,line,polyline";
            let jqPolygon = pieceSvg.children(shapeTags);
            if (jqPolygon.length == 0) jqPolygon = pieceSvg.children("g").children(shapeTags);
            jqPolygon.attr("class", "pieceHighlightColor" + (idx % GlobalVar.maxPieceHighlightColor));     // 2024-04-12: 注意底色相依於 ImmarkusShape 的 index（必須和 button 相對應）
            
            let s = pieceSvg.prop("outerHTML");
            //alert(s);
            shapeList.push(s);        // 注意：immarkus json 的 shapeVal 外層都有 <svg> 標籤
            
            // 2024-05-02: 加上一個可以點選的小按鈕
            //s = '&nbsp;<button id="b1" class="immarkusShape" Key="' + shapeKey + '">圖標框線</button><br/>';
            //$(this).append(s);
         });
         
         // 在此略過不提取 ImmarkusBody 下的 Udef_Genre_ 和 Udef_Align_OBJECT 標籤（顯示於 event 區塊）
         //jqContent.find("ImmarkusBody").each(function() {...});
         
         // 2024-05-01, 2024-06-23: immarkus image and svg
         // 2024-06-23: width 必須設在 container，才能自動調整 shape 大小（利用 .immarkus-image-container？）
         let containerSuffix = containerDocNumber + '_' + immarkusImageIdx;
         let svgContainerId = 'svg-container_' + containerSuffix;
         let imageId = 'immarkus_' + containerSuffix;
         let knownWidthHeight = (imageWidth != '0' && imageHeight !='0')
                              ? '" width="' + imageWidth + '" height="' + imageHeight
                              : '';
                              
         // 2026-03-05: 透過 url 調整錯誤時的顯示訊息
         let errorExtraMessage = '';
         if (url.startsWith('../') || 
             url.startsWith('file://') || 
             url.startsWith('http://localhost') || 
             url.startsWith('http://192.168.') ||
             url.startsWith('blob:') ||                   // 2026-03-23
             url.startsWith('I2D_FAIL_TO_FIND=')) {       // 2026-03-29: Immarkus2D 偵測後發現連結失效，會以此 prefix 開頭
            // 本地（非 IIIF）影像，不需加入額外訊息
         }
         else {
            // 應該是 IIIF 連結...
            errorExtraMessage = "<p/>"
                              + "<span class='iiifImageFailed'>"
                              + "This may be due to temporary source-server instability or access restrictions. Please try again later.  If the issue persists, you can download the image, save it to your annotation folder, and import the folder into X-MARKUS after annotating it."
                              + "</span>";
         }
         
         let s = '<div class="immarkus-image-container">'
               + '<svg id="' + svgContainerId + '">'
               + '<image id="' + imageId + '" xlink:href="' + url 
               + knownWidthHeight
               + '" preserveAspectRatio="xMidYMid meet'
               + '" onerror="svgImageLoadError(this)">'     // 2024-06-23: 早期測試是把 width, height 加在這裡...（似乎可以只用 href，不需 xlink:href？）
               + '</image>'
               + shapeList.join("\n")                                                                                        // 將 shape 資訊放在 <image> 後方
               + '</svg>'
               + '<div class="imageFailed" style="display:none">Failed to load:<br/>' + url + errorExtraMessage + '</div>'   // 2025-01-25: 加上 error message
               + '</div>\n';
         contentHtml += s;           // 2025-03-25: 改 += 允許多份 immarkus images
      });

      //$("body").delegate("button.immarkusShape", "click", function() {
      //   //alert($(this).closest(".mainContent").find("svg").html());
      //   
      //   // 2024-06-23: 調整框線的寬度
      //   let strokeWidth = 4;
      //   $(this).closest(".mainContent").find("svg image").each(function() {
      //      // 圖片的原始寬高
      //      let imageWidth = $(this).get(0).getBBox().width;
      //      let containerWidth = GlobalVar.immarkusImageDisplayWidth;
      //      strokeWidth *= imageWidth / containerWidth;
      //   });
      //   //alert(strokeWidth);
      //
      //   let shapeKey = $(this).attr("Key");
      //   // 不知是否因為 @Key 包含冒號，.find("svg").find('*[Key="' + shapeKey + '"]') 竟然找不到元素...
      //   $(this).closest(".mainContent").find("svg").children().each(function() {
      //      $(this).removeAttr("stroke").removeAttr("stroke-width");               // 2024-06-23: 先移除框線
      //      if ($(this).attr("Key")) {
      //         if ($(this).attr("Key") == shapeKey && !$(this).attr("stroke")) {   // 同個按鈕按兩次，就可以移除框線
      //            $(this).attr("stroke","red").attr("stroke-width",strokeWidth);   // 加上紅色框線
      //            //alert($(this).prop("outerHTML"));
      //         }
      //      }
      //   });
      //});
      return contentHtml;
   }
   
   function parseCorpusSettings(jqXml) {
      // 2024-08-25
      let cpSettings = GlobalVar.corpusSettings;
      jqXml.find("ThdlPrototypeExport > corpus").each(function() {
         let corpus = $(this).attr("name");
         if (GlobalVar.forceMerging2SingleCorpus) corpus = 'XA-AutoMergedDb';              // 2025-12-06
         corpus = convertToValidCorpus(corpus);            // 2025-07-18
         if (!cpSettings[corpus]) cpSettings[corpus] = { metadataFieldSettings: {},
                                                         featureAnalysis:{},
                                                         xml: $(this).prop("outerHTML"),    // 2024-10-25
                                                       };
         
         $(this).find("metadata_field_settings").children().each(function() {               // 2024-10-31
            // tagName: author, year_for_grouping, docclass, compilation_name, doc_author, book_code, doctype, geo_level1
            let tagName = $(this).prop("tagName");
            if (XmarkusMetadataAbbrMap[tagName]) {    // 從 tagName 'author' 對到縮寫 'AU'
               // mfield: TITLE, AU, ADY, CLASS, COMP, BC, DT, GEO1
               let mfield = XmarkusMetadataAbbrMap[tagName];
               let mfieldLabel = $(this).text() || tagName;
               //cpSettings[corpus].metadataFieldSettings[mfield] = mfieldLabel;
               // 2025-11-06: 加上 label, displayOrder
               cpSettings[corpus].metadataFieldSettings[mfield] = { label: mfieldLabel,
                                                                    displayOrder: parseInt($(this).attr("display_order")),
                                                                  };
               //alert(mfield + "\n" + JSON.stringify(cpSettings[corpus].metadataFieldSettings[mfield]));
            }
         });
         //alert(JSON.stringify(cpSettings[corpus].metadataFieldSettings));

         $(this).find("feature_analysis").each(function() {
            // <spotlight category="Place" sub_category="Udef_NativePlace" display_order="2" title="籍貫地NativePlace"/>
            // <tag type="contentTagging" name="Udef_NativePlace" default_category="Place" default_sub_category="Udef_NativePlace"/>
            
            // 對 Xmarkus 而言，目前應該只需 <tag> 標籤，且僅需用到屬性 name 作為顯示字串
            // => 可忽略 DocuSky 用到的屬性 type, default_category, default_sub_category
            $(this).find("tag").each(function() {
               let name = $(this).attr("name");
               cpSettings[corpus].featureAnalysis[name] = name;
            });
         });
         //alert(JSON.stringify(cpSettings[corpus].featureAnalysis));
         
      });
      
      // 2025-10-30: 從內文取出 Udef_ 標籤，並將它們加入 GlobalVar.corpusSettings[corpus].featureAnalysis
      //             注意必須判斷 document 是否歸屬於 corpus 下
      if (GlobalVar.autoExtractUdefTags4FeatureAnalysis) {
         let cpSettings = GlobalVar.corpusSettings;
         jqXml.find("document").each(function() {
            let docCorpus = $(this).find("corpus").text();
            if (GlobalVar.forceMerging2SingleCorpus) docCorpus = 'A-AutoMergedDb';     // 2025-12-06
            if (!cpSettings[docCorpus]) cpSettings[docCorpus] = { metadataFieldSettings: {},
                                                                  featureAnalysis:{},
                                                                  xml: '',
                                                                };
            $(this).find("*").each(function() {
               let tagName = $(this).prop("tagName");
               if (tagName.startsWith('Udef_')) {
                  cpSettings[docCorpus].featureAnalysis[tagName] = tagName;
               }
            });
         });
      }
         
      //alert(JSON.stringify(cpSettings));
      return cpSettings;
   }
   
   function parseDocMetadata(jqDoc) {
      // 2024-08-24
      // GlobalVar.corpusSettings[corpus].metadataFieldSettings[metadataField]
      // 僅處理 Xmarkus 的 metadata: author, year_for_grouping, docclass, compilation_name, book_code, doctype, geo_level1
      let metadata = {};

      // 注意：可在此額外加上固定的 filename 和 docTitle （DocuSky 並沒有這兩項後分類）
      metadata.filename = escapeSpotlightCue(jqDoc.attr("filename"));                 // 2024-10-01: 防呆：檔名也可能包含空白字元...
      
      //// 2024-11-01: 注意，目前 Immarkus2D 會將 docTitle 和 compliation_name 設為相同值...
      //let jqDocTitle = jqDoc.find("title");
      //if (jqDocTitle.length > 0) {
      //   let jqClone = jqDocTitle.clone();
      //   jqClone.find("span.copy").remove();                // 2025-01-23
      //   metadata.docTitle = escapeSpotlightCue(jqClone.text());
      //}
      //else metadata.docTitle = '-';
      //
      //// 2024-12-07: 應該是 Comarkus2D 轉出文件標題時，為了防呆卻沒處理好，導致標題跑出 "-:_-" 而非 "-"
      //if (metadata.docTitle == "-:_-") metadata.docTitle = '-';
      
      // 注意：在此的實作方式，即使 <document> 下包含 DocuXml 的其他後分類欄位（例如 doc_category_l1 之類），
      //       回傳的 doc metadata 都只會包含 XmarkusMetadataAbbrMap 所允許的標籤！
      //alert(JSON.stringify(GlobalVar.corpusSettings[docCorpus].metadataFieldSettings));
      for (let mtag in XmarkusMetadataAbbrMap) {
         // 2024-10-01 mtag: title, author, year_for_grouping, docclass, compilation_name, book_code, doctype, geo_level1
         //            mfield: TITLE, AU, ADY, CLASS, COMP, BC, DT, GEO1

         let mfield = XmarkusMetadataAbbrMap[mtag];

         // 2025-01-24: 標題必須特別處理（移除 span.copy）
         let jqTag = jqDoc.find(mtag);
         //if (jqTag.length == 0) continue;         // 2025-02-01: 例如 date_ad_year -- 若沒此項檢查，當文件沒有該標籤時，會覆蓋掉先前的 year_for_grouping 值！
         if (jqTag.length == 0) {
            metadata[mfield] = '-';                 // 2025-03-29: (bug fix) 防呆
            continue;         
         }
         let jqClone = jqTag.first().clone();       // 2024-12-26: 注意需 first() -- 有時會發現有多份 mtag（例如 CBDB ShineApi 取得的 DocuXml）！

         if (mtag == 'title') jqClone.find("span.copy").remove();
         let cue = jqClone.text() || '-';
         metadata[mfield] = escapeSpotlightCue(cue);                       
         
         // 2024-11-26
         let spotlight = 'm.' + mfield;
         if (ConfigVar.cuesUnificationMap[spotlight]) {                    // 有出現在 unificationMap 才進行以下動作
            let unifiedCue = applyCueUnification(spotlight, cue);          // 注意，有加上前綴 'm.'
            metadata[mfield+'_X'] = unifiedCue;                            // 2024-11-27: 新建一個 mfield+'_X' 的 newSpotlight（注意，沒有 'm.' prefix），並將其 cue 值設為 unifiedCue
         }
      }
      
      //alert("metadata => " + JSON.stringify(metadata));
      return metadata;
   }
   
   function parseDocTagStats(jqDoc, docCorpus) {
      // 2024-08-24: 計算後分類 tagStats
      let tagStats = {};
      let jqDocContent = jqDoc.find("doc_content");
      
      let defaultTags = (GlobalVar.spotlightSelectShowDefaultTags)                    // 2024-11-17
                      ? ["Date", "LocName", "PersonName", "Office"]
                      : [];
                      
      // 注意，這裡會用到 corpus settings 中 feature_analysis 的設定
      let featureAnalysis = (GlobalVar.corpusSettings[docCorpus])
                          ? GlobalVar.corpusSettings[docCorpus].featureAnalysis   // list of utags
                          : [];                                                   // 2024-08-25: 加上防呆

      let udefTags = Object.keys(featureAnalysis);  
      //alert(docCorpus + "\n" + JSON.stringify(GlobalVar.corpusSettings));
      
      // 2025-10-31: 以 feature_analysis 的設定為基礎，計算文件中出現哪些 udef tags
      //             => 或許也可先剖析所有文件算出可能的 Udef_ tags，但這要花額外力氣，且不見得所有 Udef_ tags 都需進入後分類
      let udefTagsUsed = {};
      udefTags.forEach((t) => udefTagsUsed[t] = 0);
      
      // 2024-11-20: 必須 escape '.' （在前方加上反斜線，但需注意程式是需寫兩個反斜線），否則 jquery selector 會錯以為是 class
      let selector = defaultTags.concat(udefTags).join(',').replace(/[\.]/g,'\\.');
      if (!selector) return tagStats;                                             // 2024-11-17: 後續應該還有許多地方需加上防呆...

      // 注意：這表示 Udef tags 若沒在 <feature_analysis> 設定，就不會被 select 進來...
      jqDocContent.find(selector).each(function() {
         let tagName = $(this).prop("tagName");
         udefTagsUsed[tagName]++;                    // 2025-10-31
         
         // 這個 tagName 會包含大小寫
         
         // 注意：tag 後分類的 cue (tagValue) 值，會以 CbdbId/RefId/Term 為先，若沒有才會取標籤內的值！
         //       所以，PersonName 的 cues 會是 "cbdb_127772", "cbdb_張鐸" 之類，然後將該人物的各種別名放入 (term,term,...) 中
         let refId = $(this).attr("RefId") || $(this).attr("CbdbId") || $(this).attr("Term");
         let tagValue = refId || $(this).text();
                        
         // 2025-02-12: 所有 Comarkus <Udef_Evt_xxx> 都以標籤內容做為 cue
         if (GlobalVar.udefEvtTagsUseContentButNotRefIdAsCue) {
            if (tagName.startsWith("Udef_Evt_")) tagValue = $(this).text();
         }

         // 2024-10-01: 「正常」的 tag 後分類 -- 用 RefId 作為 cue，tag text 作為 term
         let textVal = $(this).text();
         let term = textVal;

         // 2025-02-16: 將 RefId/tagText 串接在一起作為 tag value
         if (GlobalVar.showTagSpotlightCuesAsTree && !tagName.startsWith("Udef_Evt_")) {    // 2025-02-17: 需排除 "Udef_Evt_xxx" tags
            if (refId) tagValue = refId + '/' + textVal;
            term = tagValue;
         }
         
         // 注意：為了簡化系統的複雜度，後分類的 cues 並不允許出現冒號 ':'（主要是 query 需用 ':' 區隔 spotlight 和 cues）
         //       因此，像是 Udef_properties_BAIKE 標籤值是 URL https://xxx 形式，cue 就必須特別處理（先前會只剩下 http 或 https）
         
         let p = tagValue.indexOf("http");        // 2025-07-20: 針對 URL 形式 http(s)://xyz 的部分進行 escape 處理（假設 http 之後就是 URL）
         if (p >= 0) {
            tagValue = tagValue.substr(0,p) + encodeURIComponent(tagValue.substr(p));
         }
         
         let matches = tagValue.match(/([^,:;]*)(.*)/);
         if (matches) tagValue = matches[1];                                      // 僅取出 "," 或 ":" 或 ";" 之前的字串
         matches = tagValue.match(/markus_(.*)/);
         if (matches) tagValue = matches[1];                                      // 移除 "markus_" 前綴
         //if (tagValue.match(/(hvd|twgis|dila|KoreanPlace|cbdb)_(.*)/)) ;

         let escapedCue = escapeSpotlightCue(tagValue);                          
         if (!tagStats[tagName]) tagStats[tagName] = {};
         if (!tagStats[tagName][escapedCue]) tagStats[tagName][escapedCue] = { freq: 0, terms:[] };
         tagStats[tagName][escapedCue].freq++;
         tagStats[tagName][escapedCue].terms.push(term);

         // 2024-11-26
         let spotlight = 't.' + tagName;
         if (ConfigVar.cuesUnificationMap[spotlight]) {                     // 有出現在 unificationMap 才進行以下動作
            let unifiedCue = applyCueUnification(spotlight, tagValue);
            let newSpotlight = tagName + '_X';                              // 2024-11-27: 新建一個 tagName+'_X' 的 newSpotlight（注意，不需要前綴 't.'）
            if (!tagStats[newSpotlight]) tagStats[newSpotlight] = {};
            if (!tagStats[newSpotlight][unifiedCue]) tagStats[newSpotlight][unifiedCue] = { freq: 0, terms:[] };
            tagStats[newSpotlight][unifiedCue].freq++;
            tagStats[newSpotlight][unifiedCue].terms.push(term);
         }
      });
      
      if (GlobalVar.assignNullValue2MissingUdefTags) {
         // 2025-10-31: 找出 udefTagsUsed[uTag] == 0 的 uTag，設定 tagStats[tagName]['[NULL]'] = { freq: 1, terms:['[NULL]'] }
         //             注意這裡的 tagsStats 結果，會以 GlobalVar.docDict[docCorpus][docFilename].tagStats = tagStats 被參考
         Object.keys(udefTagsUsed).forEach(function(uTag) {
            if (udefTagsUsed[uTag] == 0) {
               let term = '[NULL]';
               tagStats[uTag] = {};
               tagStats[uTag][term] = { freq: 1, terms:[term] }
            }
         });
      }
      
      // 2025-06-09: 加上 <xml_metadata> 的 Udef_DocMeta_xyz 標籤
      // 2025-07-20: 由於 cue 不能有 ':'，因此 tagVal 需特別處理... 在此是用 encodeURIComponent() 將 ?,=,/,&,: 字元取代掉
      //             但測試了一下，發現 t.Udef_DocMeta_DOI:SUN:KGXB.0.2001-01-003 卻還是可以檢索...
      if (GlobalVar.enableUdefMetaTags4Analysis) {
         jqDoc.find("xml_metadata").children().each(function() {
            let tagName = $(this).prop("tagName");
            let tagVal = $(this).text();
            if (tagVal.indexOf('http') >= 0) tagVal = encodeURIComponent(tagVal);      // 假設出現 'http' 就表示值為 url 形式...
            tagVal = tagVal.replace(/[\:]/g, '%25');                                   // 似可不需此取代...（t.Udef_DocMeta_DOI:SUN:KGXB.0.2001-01-003 可檢索）
            
            if (!tagStats[tagName]) tagStats[tagName] = {};
            if (!tagStats[tagName][tagVal]) tagStats[tagName][tagVal] = { freq: 0, terms:[] };
            tagStats[tagName][tagVal].freq++;
            tagStats[tagName][tagVal].terms.push(tagVal);
         });
      }

      //alert(JSON.stringify(tagStats));
      return tagStats;
   }
   
   function parseDocXaStats(jqDoc, docCorpus) {
      // 仿 parseDocTagStats()，計算 xa <Udef_XaSpotlight> （目前僅提供此標籤）的後分類
      
      let xaStats = {};
      let jqDocContent = jqDoc.find("doc_content");

      //let featureAnalysis = (GlobalVar.corpusSettings[docCorpus])
      //                    ? GlobalVar.corpusSettings[docCorpus].featureAnalysis   // list of utags
      //                    : [];                                                   // 2024-08-25: 加上防呆
      // 注意：這表示 Udef tags 若沒在 <feature_analysis> 設定，就不會被包含進來 -- 目前只有 Udef_Evt_ 前綴的標籤會被 Comarkus2D 加入設定
      //let udefTags = Object.keys(featureAnalysis);                                
      //let selector = defaultTags.concat(udefTags).join(',');

      // 因為目前僅單一標籤 <Udef_XaSpotlight>，不需額外彈性，因此可跳過 <feature_analysis> 定義
      let udefTags = ['Udef_XaSpotlight'];
      let selector = udefTags.join(',');

      jqDocContent.find(selector).each(function() {
         let tagName = $(this).prop("tagName");                                    // 這個 tagName 會包含大小寫
         let tagValue = $(this).attr("CbdbId") || $(this).attr("RefId") ||         // 目前應該僅有 @Term
                        $(this).attr("Term") || $(this).text();

         let matches = tagValue.match(/([^,:;]*)(.*)/);
         if (matches) tagValue = matches[1];                             // 僅取出 "," 或 ":" 或 ";" 之前的字串
         matches = tagValue.match(/markus_(.*)/);
         if (matches) tagValue = matches[1];                             // 移除 "markus_" 前綴
         //if (tagValue.match(/(hvd|twgis|dila|KoreanPlace|cbdb)_(.*)/)) ;

         let escapedCue = escapeSpotlightCue(tagValue);                  // 2024-10-01
         let textVal = $(this).text();
         
         if (!xaStats[tagName]) xaStats[tagName] = {};
         if (!xaStats[tagName][escapedCue]) xaStats[tagName][escapedCue] = { freq: 0, terms:[] };
         xaStats[tagName][escapedCue].freq++;
         xaStats[tagName][escapedCue].terms.push(textVal);             

         // 2024-11-26
         let spotlight = 'x.' + tagName;
         if (ConfigVar.cuesUnificationMap[spotlight]) {                  // 有出現在 unificationMap 才進行以下動作
            let unifiedCue = applyCueUnification(spotlight, tagValue);
            let newSpotlight = tagName + '_X';                           // 2024-11-27: 新建一個 tagName+'_X' 的 newSpotlight（注意，不需要前綴 'x.'）
            if (!xaStats[newSpotlight]) xaStats[newSpotlight] = {};
            if (!xaStats[newSpotlight][unifiedCue]) xaStats[newSpotlight][unifiedCue] = { freq: 0, terms:[] };
            xaStats[newSpotlight][unifiedCue].freq++;                    
            xaStats[newSpotlight][unifiedCue].terms.push(textVal);
         }
      });

      //alert(JSON.stringify(xaStats));
      return xaStats;
   }
   
   // -------------------------------------
   //    functions to support parsing
   // -------------------------------------
   
   function getEventsBlockHtml(jqNodes) {          // jquery find() 回傳的 node collection
      // jqNodes 為 Events or Comment nodes
      //alert(jqNodes.length + "\n" + jqNodes.prop("outerHTML"));
      
      let commentHtmlList = [];                    // 2025-04-29: 將 comment 儲存起來，以便放在 Events 後面顯示
      let eventHtmlList = [];
      
      jqNodes.each(function() {
         let jqNode = $(this);
         let tagName = jqNode.prop("tagName");       // Comment, Events
         //alert(tagName);
         if (tagName == 'Comment') {
            jqNode.find("CommentItem").each(function() {
               let category = $(this).attr("Category");
               if (!category || category == 'default') category = 'comment';
               let s = "<div class='comment'>"
                     + "<span class='commentItemCategory'>" + category + "</span>"
                     + $(this).html()                // 可能包含 <br/>
                     + "</div>";
               commentHtmlList.push(s);
            });
         }
         else if (tagName == 'Events') {
            // 2025-03-24: <doc_content> 下已經有 <ImmarkusImage>，似乎不需在 <Event> 下也放上一份，因此先移除
            //if (jqNode.find("ImmarkusImage").length > 0) {
            //   let jqImmarkusImage = $(jqNode).find("ImmarkusImage");
            //   eventHtmlList.push("<div>image filename: " + jqImmarkusImage.text() + "</div>");
            //}
            //alert(jqNode.prop("outerHTML"));
            
            // 2024-04-15: Event/ComarkusBundle
            // 2024-06-06: 嘗試將 comarkus 標籤的 RefId 內容「對回」原文標籤（找出原本的標記所在）
            //             例如，event 標籤的 RefId='xyz'，對回 RefId='xyz'（人時地）或 RefId='markus_xyz'
            //             注意：由於 MARKUS export 沒有匯出 markus_id 的資訊，將一項 event 下的標籤以 RefId 對回原文，可能會比對出多份標籤...
            if (jqNode.find("ComarkusBundle").length > 0) {            // 2024-04-18
               // 2024-04-20: 將 DocuXml 中的相關資訊都轉入 Comarkus-xxx 屬性，以備後續 $("div.comarkusEventLabel").click() 取用
               let comarkusHtml = '';    // "<div class='comarkusEventsLabel'>COMARKUS events</div>";
               let htmlList = [];
               jqNode.find("Event[ComarkusId]").each(function() {      // 在此僅取出有 @CormarkusId 的 events
                  let comarkusId = $(this).attr("ComarkusId");
                  let comarkusEventBar = '<div class="comarkusEvent" ComarkusId="' + comarkusId + '">'       // 2024-05-13: 加上 @ComarkusId（有時需 comarkusId 來進行除錯...）
                                       + '<span class="comarkusEventLabel">highlight event tags</span>'
                                       + '<span class="floatRight">'
                                       + '<button key="fold" title="fold"><i class="fa fa-caret-up"></i></button>'                           // fold
                                       + '<button key="unfold" title="unfold"class="hideButton"><i class="fa fa-caret-down"></i></button>'   // unfold
                                       + '</span>';
                  htmlList.push(comarkusEventBar);
                  htmlList.push("<div class='comarkusEventElements'>");
                  
                  let eventObjList = [];              // 等待排序的事件（每個元素是一個 {type, weight, html} 物件）
                  $(this).find("ComarkusBundle").each(function() {
                     if ($(this).children().length == 0) return;        // skip
                     let jqComarkusBundle = $(this);
                     let type = jqComarkusBundle.attr("Type");          // <ComarkusBundle @Type>
                     // 2025-07-11: 魯汶那邊希望能依照 type 對這些項目進行排序...
                     let typeHtmlList = [];
                     typeHtmlList.push("<div Comarkus-udefTagKey='" + type + "'><b class='udefTagKey'>" + type + "</b>");   
                     jqComarkusBundle.children().each(function() {
                        let tagName = $(this).prop("tagName");          // 2024-10-10: 此處的 tagName 仍然包含大小寫！
                        if (tagName.toUpperCase() == 'BR') return;      // 2024-04-22: 防呆（若檢索頁的 <br/> 按鈕被打開，<Events> 下就有可能出現 <br/>
                        
                        // 2025-07-11: 為了和 IMMARKUS 連結，C2D/I2D 加上 Udef_Align_XXX 標籤，因此 tagName 有可能為 <Udef_Align_OBJECT>
                        //             若為 Udef_Evt_<type>，udefTagKey 就會等於 type
                        //     待檢查: 不需像處理 Immarkus tags，需先 jqClone，然後 jqClone.find("span.udefInfo").remove()？

                        let udefTagName = tagName;
                        if (udefTagName.startsWith('Udef_Align_')) {
                           // 注意，let 是作用在每個 {...} 區塊的 lexical scope
                           let s = getXmarkusFeatureStr($(this));     // 2026-01-26: 顯示 "X-MARKUS Feature" 字串
                           typeHtmlList.push(s);
                        }
                        else {
                           // 注意：<Udef_Img_Note> 只有 IMMMARKUS 有，COMARKUS 並沒有類似的 event note
                           //let p = udefTagName.indexOf("Udef_Evt_");       
                           //if (p == 0) udefTagName = udefTagName.substr("Udef_Evt_".length);
                           let refId = $(this).attr("RefId");
                           let markusId = $(this).attr("MarkusId");
                           let text = $(this).text();                      // 注意：經 Comarkus2D，此 text 為 <type>:<text> 形式，後續可藉由 @Comarkus-text 取出
                           
                           // 2025-10-05: OBJ_PARK_LINKED 是一個 bundle (bag) 型態，包含數個 Udef_Evt_OBJ_PART, Udef_Evt_OBJ_MATERIAL 等標籤，日後或許需要把標籤特性抓出來顯示...
                           if (GlobalVar.showObjPartLinkedInnerTagName && type === 'OBJ_PART_LINKED' && udefTagName.startsWith('Udef_Evt_')) {
                              text = udefTagName.substr('Udef_Evt_'.length) + ': ' + text
                           }
                           
                           let s = "<div>"                           // 2024-11-15: 改為 <div><span>
                                 + "<span Comarkus-udefTagName='" + udefTagName + "' Comarkus-refId='" + refId + "' Comarkus-markusId='" + markusId + "' Comarkus-text='" + text + "'"
                                 + ">"
                                 + " - <span>" + text + "</span>"    // 2025-10-27: 加入 <span> 讓 text 在標籤內
                                 + (GlobalVar.udefEvtTagsUseContentButNotRefIdAsCue ? '' : " (" + refId + ")")     // 2025-02-12: 若 refId 已經被放入標籤內容，就不需額外用刮號顯示 refId 了
                                 + "</span></div>";
                           typeHtmlList.push(s);
                        }
                     });
                     typeHtmlList.push("</div>");    // <div @Comarkus-udefTagKey>
                     
                     // 2025-07-11
                     let eventOrder = EventTypeOrder[type] || 100;
                     let obj = { type, order:eventOrder, html:typeHtmlList.join('\n') };
                     //alert(JSON.stringify(obj));
                     eventObjList.push(obj);
                  });
                  
                  eventObjList.sort(function(a,b) {
                     return (a.order > b.order);
                  });
                  
                  eventObjList.forEach(function(eventObj) {
                     htmlList.push(eventObj.html);
                  });
                  
                  htmlList.push("</div>");       // closing comarkusEventElements
                  htmlList.push("</div>");       // closing comarkusEventBar, i.e., <div @ComarkusEvent>
               });
               comarkusHtml += htmlList.join("\n");
               eventHtmlList.push(comarkusHtml);
            };
         
            // 2024-08-31: Immarkus 的主要內容，在 <doc_content> 應也有一份拷貝（包含 ImmarkusPiece 等），
            //             這似乎沒什麼必要... （但可以方便 DocuSky 檢索頁進行內容呈現）
            //             ImmarkusPiece（每份 immarkus json 只會轉出一個 event，但有多 pieces）
            let docPieces = $(jqNode).find("ImmarkusPiece").length;
            if (docPieces > 0) {
               let immarkusHtml = "";
               if (docPieces > 1) immarkusHtml = "<div class='immarkusPieces'>"                 // 2025-05-01: 若多於一個 piece 才顯示 toggle all
                                               + "<span class='butToggleAllImmarkusPieces'>Toggle all shapes</span>"
                                               + "<hr class='hrImmarkusPiece'/>";
               let htmlList = [];
               
               // 2026-07-01: 注意，jqNode 是 <Event>，jqParagraph 才是 <Paragraph>
               $(jqNode).find("ImmarkusPiece[ImmarkusId]").each(function(idx) {   // 在此僅取出有 @CormarkusId 的 ImmarkusPiece
                  let jqPiece = $(this);                    // 一個 shape (Event 下的 \\ImmarkusPiece)
                  let immarkusId = jqPiece.attr("ImmarkusId");
                  
                  // Paragraph 下的 Udef_Img_EntityRelation
                  let jqParagraph = jqPiece.closest("document")
                                           .find(`Paragraph[ImmarkusId="${immarkusId}"]`);
                  
                  let imageEntityHtmlList = [];        // 2025-12-25                   
                  jqParagraph.find("ImmarkusBody").each(function() {
                     // 2025-12-25: ImmarkusBody 代表一個 entity -- 一個 shape (ImmarkusPiee) 可有多個 entities
                     let jqImmarkusBody = $(this);
                     let imageGenreHtmlList = [];
                     let imageImgHtmlList = [];                       // 2025-12-19: Udef_Img_ 開頭，例如 "Udef_Img_EntityClass"（內容是由 Udef_Genre_Source 加上其 hierarchy 的 parent 所組成）
                     let imageAlignHtmlList = [];
                     let propertiesHtmlList = [];

                     let hasPropertiesIdName = false;                 // 2026-08-01: 若沒有 id/name，就額外輸出 piece 的 immarkus id
                     jqImmarkusBody.children().each(function() {
                        // <Udef_Genre_Type><span class="udef">Dataset<span class="udefInfo hideUdefInfo" title="-">*Genre_Type:<span class="udefRefId">-</span></span></span></Udef_Genre_Type>
                        let tagName = $(this).prop("tagName");
                        if (!tagName.startsWith("Udef_")) return;     // 跳過 ImmarkusProperties
                        
                        if (['Udef_properties_id','Udef_properties_name'].includes(tagName)) hasPropertiesIdName = true;

                        let jqClone = $(this).clone();
                        jqClone.find("span.udefInfo").remove();
                        if (tagName.startsWith('Udef_Align_')) {      // 2025-11-30: 注意 jqClone.text() 前後有加上 <span> 以方便進行 highight
                           let s = getXmarkusFeatureStr(jqClone);     // 2026-01-26: 顯示 "X-MARKUS Feature" 字串
                           imageAlignHtmlList.push(s);
                        }
                        else if (tagName.startsWith('Udef_Genre_')) {
                           let s = "<div>" + tagName + ': <span>' + jqClone.text() + "</span></div>";
                           imageGenreHtmlList.push(s);
                        }
                        else if (tagName.startsWith('Udef_Img_') && !['Udef_Img_EntityRelation'].includes(tagName)) {     // <Udef_Img_EntityRelation> 牽涉兩個 entities 需特別處理
                           // && !['Udef_Img_EntityRelation', 'Udef_Img_RelationSource', 'Udef_Img_RelationTarget'].includes(tagName)) {     
                           // 2026-03-15: <Udef_Img_Note> 有 TranscriptorI 屬性，若其為 'NULL' 表示是「人工加上的 comment」，否則就是 ai transcription
                           //             <Udef_Img_EntityClass> 沒有 TranscriptorI 屬性，其 transcriptorId 會是 undefined
                           let transcriptorId = $(this).attr("TranscriptorId");
                           let extra = '';
                           if (ConfigVar.showUdefImgNoteTranscriptorId && (transcriptorId !== undefined && transcriptorId !== 'NULL')) {
                              extra = ' [' + transcriptorId + ']';
                           }
                           let s = "<div>" + tagName + extra + ': <span>' + jqClone.text() + "</span></div>";
                           imageImgHtmlList.push(s);
                        }
                        else {
                           // 跳過其他（不顯示）的 "Udef_XXX" tags
                        }
                     });

                     // 2026-08-01                     
                     if (!hasPropertiesIdName) {
                        let s = "<div>immarkus id: <span>" + immarkusId + "</span></div>";
                        imageImgHtmlList.unshift(s);
                     }

                     // 2026-07-??: 對 Paragraph ImmarkusBody 下，Udef_Img_EntityRelation 進行特別處理（加上一些日後可能會用到的訊息...）
                     let entityRelationHtmlList = [];
                     jqImmarkusBody.find("Udef_Img_EntityRelation").each(function() {
                        let tagName = $(this).prop("tagName");
                        let sourceEntityId = $(this).attr("SourcePieceImmarkusId");
                        let sourcePieceDocFilename = $(this).attr("SourcePieceDocFilename");
                        let sourcePieceImmarkusId = $(this).attr("SourcePieceImmarkusId");
                        let SourcePieceLabel = $(this).attr("SourcePieceLabel");           // 2025-07-10
                        let targetEntityId = $(this).attr("TargetPieceImmarkusId");
                        let targetPieceDocFilename = $(this).attr("TargetPieceDocFilename");
                        let targetPieceImmarkusId = $(this).attr("TargetPieceImmarkusId");
                        let targetPieceLabel = $(this).attr("TargetPieceLabel");           // 2025-07-10
                        let pieceImmarkusId = '-';

                        let nodesInSameDoc = (sourcePieceDocFilename === targetPieceDocFilename);
                        
                        let paragraphImmarkusId = $(this).closest("Paragraph").attr("ImmarkusId");
                        let isSourceNode = false, isTargetNode = false;
                        if (paragraphImmarkusId == sourceEntityId) isSourceNode = true;
                        if (paragraphImmarkusId == targetEntityId) isTargetNode = true;
                        
                        // TODO: butViewImmarkusRelation 尚未完工... （目前是顯示子視窗，高亮 sourcePieceImmarkusId 這個 piece）
                        // TODO: 藉由 SourcePieceImmarkusId 找到對應的 <Paragraph>，
                        //       提取該 <Paragraph> 的 @Key，以及其下 ImmarkusProperties/Udef_properties_id 和 ImmarkusProperties/Udef_properties_name
                        // (todo) ...
                        let sourceLabel = (ConfigVar.showRelationEntityLabel)
                                        ? (SourcePieceLabel + (ConfigVar.showRelationEntityClass ? '[' + $(this).attr("SourceEntityClass") + ']' : ''))     // 2026-07-10
                                        : sourcePieceImmarkusId;
                        if (isSourceNode) {
                           sourceLabel = '&#128100;';    // emoji 人影，or '&#9675;' a circle
                           pieceImmarkusId = sourcePieceImmarkusId;
                        }
                        
                        let targetLabel = (ConfigVar.showRelationEntityLabel)
                                        ? (targetPieceLabel + (ConfigVar.showRelationEntityClass ? '[' + $(this).attr("TargetEntityClass") + ']' : ''))
                                        : targetPieceImmarkusId;
                        if (isTargetNode) {
                           targetLabel = '&#128100;';
                           pieceImmarkusId = targetPieceImmarkusId;
                        }
                        
                        // 由於有兩個 entities，處理起來還蠻容易弄混...
                        if (!nodesInSameDoc) {
                           // 滿足 !nodesInSameDoc 表示它是處於別的文件中，而非人影圖像表示它並非當前的 entity => 在此將 label 轉成連結形式
                           if (sourceLabel != '&#128100;') sourceLabel = ` <span class='relationDocLink' link2Doc='${sourcePieceDocFilename}' pieceImmarkusId='${pieceImmarkusId}'>${sourceLabel}</span>`;
                           if (sourceLabel != '&#128100;') targetLabel = ` <span class='relationDocLink' link2Doc='${targetPieceDocFilename}' pieceImmarkusId='${pieceImmarkusId}'>${targetLabel}</span>`;
                        }
                        
                        let s = sourceLabel + ' ' + $(this).html() + ' ' + targetLabel;
                        if (ConfigVar.enableRelationPieceButton) {
                           s = $(this).html()          // 注意，可能包含 highlighting terms 所加上的額外標籤
                             + ` <span class="butViewImmarkusRelation" SourcePieceDocFilename="${sourcePieceDocFilename}" SourcePieceImmarkusId="${sourcePieceImmarkusId}" TargetPieceDocFilename="${targetPieceDocFilename}" TargetPieceImmarkusId="${targetPieceImmarkusId}">`
                             + 'view entities'
                             + '</span>';
                        }
                        $(this).html(s);                // 更新內容（加上 sourcePieceImmarkusId）
                        
                        let t = `<div class="entityRelation">RELATION: ${s}</div>`;     // ${tagName}
                        entityRelationHtmlList.push(t);
                     });
                     
                     // 2025-02-22: 取出 <ImmarkusProperties> -- entity information
                     // 2025-12-25: 一個 piece 可能包含多個 entities，應該每個 entity 獨立輸出一個區塊！
                     jqImmarkusBody.find("ImmarkusProperties").each(function() {
                        // 注意：Immarkus2D 轉出時，就已包含 <div> 標籤，例如 "<div>properties/ID:<Udef_properties_ID>dunhua_neicheng</Udef_properties_ID></div>"，
                        //       在此就直接將其以 $(this).html() 匯出
                        let s = "<div class='entityProperties'>"
                              + $(this).html()
                              + "</div>";

                        //// 2026-04-16: 以 <div> 逐一輸出（可對特別項目進行處理）
                        //let divList = [];
                        //$(this).find("div").each(function() {
                        //   let t = "<div>" + $(this).html() + "</div>";
                        //   divList.push(t);
                        //});
                        //let s = "<div class='entityProperties'>"
                        //      + divList.join("\n")
                        //      + "</div>";

                        propertiesHtmlList.push(s);
                     });
                  
                     // 因 Source/Target 可從 relation 的 '&#128100;'(人影) 得知，因此不需額外再顯示
                     //jqPiece.find("Udef_Img_RelationSource").each(function() {
                     //   let jqClone = $(this).clone();
                     //   jqClone.find("span.udefInfo").remove();
                     //   let s = jqClone.text();
                     //   let t = `<div class="relationSource">- SOURCE: ${s}</div>`;     // ${tagName}
                     //   entityRelationHtmlList.push(t);
                     //});
                     //
                     //jqPiece.find("Udef_Img_RelationTarget").each(function() {
                     //   let jqClone = $(this).clone();
                     //   jqClone.find("span.udefInfo").remove();
                     //   let s = jqClone.text();
                     //   let t = `<div class="relationTarget">- TARGET: ${s}</div>`;     // ${tagName}
                     //   entityRelationHtmlList.push(t);
                     //});

                     let s = "<div class='imageEntityBlock'>"
                           + (GlobalVar.outputImageAlignTags ? imageAlignHtmlList.join('\n') : '')
                           + (GlobalVar.outputImageGenreTags ? imageGenreHtmlList.join('\n') : '')
                           + imageImgHtmlList.join('\n')
                           + propertiesHtmlList.join('\n')
                           + entityRelationHtmlList.join('\n')
                           + "</div>";
                     imageEntityHtmlList.push(s);
                  });

                  // 彙整一個 shape 區塊
                  let pieceKey = jqPiece.attr("Key");               // 2025-02-01: "piece:0", "piece:1", etc.
                  let [_, pieceIdx] = pieceKey.split(':');
                  let shapeKey = "mark:" + pieceIdx;                // 注意，這裡是需要 Immarkus2D 轉出 <ImmarkusShape> 的 @Key，Events 下的 <ImmarkusPieceShape> 並沒有 @Key
                  if (idx > 0) htmlList.push("<hr class='hrImmarkusPiece'/>");
                  
                  // 2025-04-12: 將 button 被點擊後的底色，與 image 被高亮的 piece 底色設為相同... (在 butHighlightImmarkusPiece 加上該 index 所對應的底色)
                  //             這裡有些懶惰，假設 idx 對應到 pieceShape 的 index，也需假設兩者在 color 選擇上採用相同演算法... 
                  //             => 這樣會導致後續維護的困擾（可能兩邊不一致），應該在早期產生標記時就加上顏色對應（以後有機會重構再說吧...）
                  let xColorIdx = idx % GlobalVar.maxPieceHighlightColor;           // 假設與 shape highlight 採用相同演算法，得到相同的 color index

                  let piecDoceFilename = $(this).closest("document").attr("filename");
                  let pieceKeyAsShape = pieceKey.replace(/piece:/g, 'shape:');     // 2025-12-26: 顯示給使用者時，改用 shape:nnn
                  let pieceButton = (immarkusId == 'Immarkus2D_placeholder') 
                                  ? ' --- '                     // 2025-03-25: 防呆 （值 Immarkus2D_placeholder 表示並沒有實際的標記...）
                                  : '<span class="butHighlightImmarkusPiece" PieceDocFilename="' + piecDoceFilename + '" Key="' 
                                    + shapeKey + '" xColorIdx="' + xColorIdx + '">' + pieceKeyAsShape + '</span>';

                  // 2025-03-04: 在 button 加上 @PieceFilename（未來可能會用到...）
                  let s = '<div class="immarkusPiece" ImmarkusId="' + immarkusId + '">'        // 2024-05-13: 加上 @ComarkusId
                        //+ '<div>ImmarkusPiece*' + immarkusId                                 // 暫時加上 '*' for debugging
                        + pieceButton
                        + '<span class="floatRight">'
                        + '<button key="fold" title="fold"><i class="fa fa-caret-up"></i></button>'                           // fold
                        + '<button key="unfold" title="unfold"class="hideButton"><i class="fa fa-caret-down"></i></button>'   // unfold
                        + '</span>';             // 注意，</immarkusPiece> 是在最後才加上去
                  htmlList.push(s);
                  
                  s = "<div class='immarkusPieceElements'>"        // 一份 piece (i.e., shape) -- 它可能包含多組 entities
                    + imageEntityHtmlList.join('\n')
                    //+ (GlobalVar.outputImageRelation ? relationList.join('\n') : '')           // 2025-12-25
                    + "</div>";
                  htmlList.push(s);
                  htmlList.push("</div>");                         // div.immarkusPiece（當前 piece 涵蓋所有 immarkusPieceElements）
               });
               immarkusHtml += htmlList.join("\n") + "</div>";     // div.immarkusPieces（涵蓋所有 pieces）
               eventHtmlList.push(immarkusHtml);
            };
            
            // 2024-11-08: 顯示 <Udef_XmarkusAnalyer> 之下的 <Udef_XaSpotlight> 內容
            if ($(jqNode).find("Udef_XmarkusAnalyzer").length > 0) {
               let htmlList = [];
               htmlList.push("<hr/>");
               $(jqNode).find("Udef_XmarkusAnalyzer").each(function() {
                  $(this).find("Udef_XaSpotlight").each(function() {
                     let t = $(this).attr("Term") || $(this).text();     // 測試版的標籤並沒有 @Term
                     let s = '<div class="XaSpotlight">' + $(this).prop("tagName") + ': ' + t + '</div>';
                     htmlList.push(s);
                  });
                  eventHtmlList.push(htmlList.join("\n"));
               });
            }

            // 2025-01-25: BinRel 的 events
            if (jqNode.find("BinRel").length > 0) {
               let binrelHtml = '';
               let binrelName = $(this).attr("Name") || '---';
               
               let htmlList = [];
               htmlList.push("<div class='binrelEvents'>BinRel events (" + binrelName + ")");
               
               jqNode.find("BinRel").each(function() {
                  let relType = $(this).attr("Type");
                  let jqSourceNode = $(this).find("RelSource");
                  let jqTargetNode = $(this).find("RelTarget");
                  let sourceType = jqSourceNode.attr("Type");
                  let sourceText = jqSourceNode.text();
                  let targetType = jqTargetNode.attr("Type");
                  let targetText = jqTargetNode.text();
                  
                  let t = "<span class='targetType'>(" + targetText + ")</span>";
                  let r = relType.replace(/Y/g, t);
                  
                  let s = "<div class='binrel'>"
                        + "<span class='sourceType'>(" + sourceText + ")</span>"
                        + "&#160;<span class='relType'>" + r + "</span>&#160;"    // 若取代到 'Y'，則 r 已經包含取代內容
                        + ((r !== relType) ? '' : t)                              // 若未取代到 'Y'，就需把 t 加在最後
                        + "</div>";
                        
                  htmlList.push(s);
               });
               
               htmlList.push("</div>");          // closing <div class='binrelEvents'>
               
               binrelHtml = htmlList.join("\n");
               eventHtmlList.push(binrelHtml);
            };

         }  // 'Event'
      });   // jqNodes
      
      eventHtmlList = eventHtmlList.concat(commentHtmlList);
      let eventsHtml = eventHtmlList.join("\n");
      //alert(eventsHtml);
      return eventsHtml;
   }
   
   // 2026-01-26
   function getXmarkusFeatureStr(jqNode) {
      let tagName = jqNode.prop("tagName");
      let tagVal = (jqNode.attr("Term"))        // 2025-01-26: 注意這裡只有處理 Image aligned-tag 顯示，Event aligned-tag 在別的地方
                 ? (jqNode.attr("Term") + ' (' + jqNode.text() + ')')
                 : jqNode.text();
      let s = "<div>" + " &#9654; X-MARKUS Feature: [" + tagName + '] <span>' + tagVal + "</span></div>";
      return s;
   }
   
   function applyCueUnification(spotlight, cue) {
      // 實驗：載入自定義的 unificationMap[spotlight]:cue1|cue2|... => unifiedCue 後，
      //       目的是將來源文本的不同 cue 值，對應到統一後的值，例如 m.ADY:1201|1202|..|1250=>1200-1250
      // spotlight: m.XXX, t.YYY, x.ZZZ
      // (TODO) xxyyzz
      //alert(JSON.stringify(ConfigVar.cuesUnificationMap));
      if (ConfigVar.cuesUnificationMap[spotlight] && ConfigVar.cuesUnificationMap[spotlight][cue]) {
         cue = ConfigVar.cuesUnificationMap[spotlight][cue];
      }
      return cue;
   }
   
   function addTagInfo2ContentTags(jqDoc) {
      // 2024-11-08: 在此 <Udef_XaSpotlight> 會被視為一般的 udef 標籤一起處理
      let jqDocContent = jqDoc.find("doc_content");

      let defaultTags = ["Date", "LocName", "PersonName", "Office"];

      // 逐一檢查內文標籤，將具有 "Udef_" 前綴（但排除 "Udef_Evt_"）的標籤名稱加入 udefTags
      let udefTags = [];
      jqDocContent.find("*").each(function() {
         let tagName = $(this).prop("tagName");
         if (tagName.indexOf("Udef_") == 0 && tagName.indexOf("Udef_Evt_") == -1) {
            // IMMARKUS 可能會有 "Udef_properties_Language." 這樣的 tagName，會導致 jquery selector 報錯！
            udefTags.push(tagName);
         }
      });
      udefTags = [...new Set(udefTags)];              // array_unique
      //alert(JSON.stringify(udefTags));
      
      let selector = defaultTags.concat(udefTags).join(',');
      //alert(selector);

      // 2024-10-10: 在 udef 標籤下加入 <span class="udef"> 標籤，這樣可以方便後續 highlight 呈現
      // 2025-09-16: 問題是，若「先處理外層 tag，則取代後會因標籤內容改變，後續將無法用 $(this) 存取到內層 tag...」
      jqDocContent.find(selector).each(function() {
         // 注意，這裡的處理方式並不是很好，只能允許有兩層 udef nested tags（以後若有需要再改良）
         let outer = $(this);
         outer.find(selector).each(function() {
            let replacedByTag = "<span class='udef'>"
                              + $(this).html() 
                              + "</span>"
            $(this).html(replacedByTag);
            valueChanged = true;
         });
         let replacedByTag = "<span class='udef'>"
                           + $(this).html() 
                           + "</span>"
         outer.html(replacedByTag);
         //alert($(this).prop("tagName"));
      });
      //alert(jqDocContent.prop("outerHTML"));
   }
   
   
   // ---------------------------------------
   //        UI supporting functions
   // ---------------------------------------
   
   // 2024-10-11
   function highlightUdefTags(jqDocContent, highlightTags) {
      jqDocContent.find(".udef").each(function() {
         let jqTag = $(this).parent();                          // 取得 <span class='udef'> 父節點（原始的 udef 節點）
         let udefTagName = jqTag.prop("tagName");
         let udefRefId = jqTag.attr("RefId") || jqTag.attr("CbdbId") || '-';     // 注意屬性名稱有分大小寫

         // 2025-02-11       
         if (GlobalVar.removeInfixMarkusFromRefId) udefRefId = udefRefId.replace(/markus_/g,'');

         // 2024-10-12: 不論 highlightTags 旗標真假，都將 span.udefInfo 加上，改用 span.hideUdefInfo 控制是否顯示
         let tagNameDisplayed = (udefTagName.indexOf("Udef_") == 0) 
                              ? '*' + udefTagName.substr(5)
                              : udefTagName;
         // 2024-11-14: 加上 refId 顯示
         let t = (GlobalVar.displayTagWithRefId) 
               ? ':<span class="udefRefId">' + udefRefId + '</span>'
               : '';
               
         // 2025-07-11: udef_Align_ 不需加上 udefInfo
         let s = (udefTagName.startsWith('Udef_Align_'))
               ? ''
               : "<span class='udefInfo' title='" + udefRefId + "'>" + tagNameDisplayed + t + "</span>";

         // 2025-02-12: 將 prepend 改為 append（udefInfo 放在詞彙後方）
         $(this).append(s);                    // 注意，是加在 <span class='udef'> 之下

         if (highlightTags) $(this).addClass("udefOn");
         else $(this).find("span.udefInfo").addClass("hideUdefInfo");
      });
   }

   // 2025-07-12, 2025-07-18: 重新查詢（包含換頁）更新文字內容後，內文顯示區塊應調回先前的設定
   function applyCurTextStyling(curTextStyling = null) {
      if (!curTextStyling) curTextStyling = getCurTextStyling();
      let { curColorScheme, curMetadataDisplay, curCommentsDisplay} = curTextStyling;
      //$("#selectApplyColorScheme").trigger("change");
      $("#selectApplyColorScheme").val(curColorScheme).trigger("change");
      if (curMetadataDisplay) $("#butShowMetadata").click();
      else $("#butHideMetadata").click();
      if (curCommentsDisplay) $("#butShowComments").click();
      else $("#butHideComments").click();
   }
   
   // 2025-07-18
   function getCurTextStyling() {
      let curColorScheme = $("#selectApplyColorScheme").val();
      let curMetadataDisplay = GlobalVar.curMetadataDisplay;
      let curCommentsDisplay = GlobalVar.curCommentsDisplay;
      return { curColorScheme, curMetadataDisplay, curCommentsDisplay };
   }
   
   // 2025-10-24
   function getCurSortDocsBy() {
      return $("#sortDocsBy").val();
   }
   
   // 2026-04-01
   function getCurSortDocsOption() {
      return $("#sortDocsOption").val();
   }

   // ----------------------------------------------------
   //      compute and present the filtered result
   // ----------------------------------------------------

   function computeFilteredResultAndPresent(storeToGlobalVarDb = false, sortDocsBy = 'm.filename', sortDocsOption = 'asc') {
      GlobalVar.filteredResult.query = $("#queryFilter").val();

      // 2024-08-26: 計算當前經過 filtering 的結果 (GlobalVar.filteredResult)
      applyFilterToGetDocuments();     // 將結果儲存於 GlobalVar.filteredResult.filteredDocFilenameList

      let filteredDocFilenameList = GlobalVar.filteredResult.filteredDocFilenameList;
      //alert("篩選後（當前文獻集）文件總數: " + filteredDocFilenameList.length);
      
      if (filteredDocFilenameList.length == 0) {
         // 2024-09-04: 查詢不到文件... 需做防呆處理（後續程式都假設有文件，且文件有 corpus 等欄位資訊）
         alert("Sorry, cannot find matching documents\n" + GlobalVar.filteredResult.query);
         hideProgressMsg();

         // 2024-12-28: 沒搜尋到結果，原先是直接顯示空白頁面，現改為「退回先前查詢」
         $("#butHistoryBackwardItem").click();         
         //$("#divMainArea").slideUp();
         return;
      }

      // 注意，必須先重設 global variable 的值，再將其參考指定給 local var，才能藉此 local var 更動物件內容
      // 也就是說，若這樣
      //    let corpusJqDocFilenameHash = GlobalVar.filteredResult.corpusJqDocFilenameHash;
      //    corpusJqDocFilenameHash = {};                 // reset (for update)
      // 那麼更新 corpusJqDocFilenameHash["a"]="x" 後，
      //          GlobalVar.filteredResult.corpusJqDocFilenameHash 不會被更動到，將依然是 {}
      GlobalVar.filteredResult.corpusJqDocFilenameHash = {};                 // reset (for update)
      let corpusJqDocFilenameHash = GlobalVar.filteredResult.corpusJqDocFilenameHash;

      // 計算後分類分佈
      let metadataDocsDict = {};
      let tagsDocsDict = {};
      let xaDocsDict = {};
      
      filteredDocFilenameList.forEach(function(docFilename) {
         let jqDoc = GlobalVar.docFilenameJqDocMap[docFilename];                  // 2024-09-02
         //let docFilename = jqDoc.attr("filename");
         let docCorpus = jqDoc.find("corpus").text() || '-';
         if (GlobalVar.forceMerging2SingleCorpus) docCorpus = 'XA-AutoMergedDb';  // 2025-12-06
         docCorpus = convertToValidCorpus(docCorpus);                             // 2025-07-18

         let docRef = GlobalVar.docDict[docCorpus][docFilename];                  // 2024-08-25
         if (!docRef) alert("ERROR: cannot find docRef: " + docCorpus + ", " + docFilename);
         
         if (!corpusJqDocFilenameHash[docCorpus]) corpusJqDocFilenameHash[docCorpus] = {};
         corpusJqDocFilenameHash[docCorpus][docFilename] = jqDoc;
      
         // 將篩選後，符合各類 metadata 的文件參考，放入 GlobalVar.filteredResult.metadataDocsDict
         if (!metadataDocsDict[docCorpus]) metadataDocsDict[docCorpus] = {};
         let metadataFields = Object.keys(GlobalVar.docDict[docCorpus][docFilename].metadata);
         //alert(JSON.stringify(metadataFields));
         metadataFields.forEach(function(field) {
            if (!metadataDocsDict[docCorpus][field]) metadataDocsDict[docCorpus][field] = [];
            metadataDocsDict[docCorpus][field].push(docRef);         // 2024-08-25: 從 docFilename 改 docRef
         });
         //alert(JSON.stringify(metadataDocsDict));
         
         // 將篩選後，符合各類 tags 的文件參考，放入 GlobalVar.filteredResult.tagsDocsDict
         if (!tagsDocsDict[docCorpus]) tagsDocsDict[docCorpus] = {};
         let tagNames = Object.keys(GlobalVar.docDict[docCorpus][docFilename].tagStats);
         tagNames.forEach(function(tagName) {
            if (!tagsDocsDict[docCorpus][tagName]) tagsDocsDict[docCorpus][tagName] = [];
            tagsDocsDict[docCorpus][tagName].push(docRef);              // 2024-08-25: 從 docFilename 改 docRef
         });
         
         // 2024-11-08: 仿 tagsDocsDict 的處理方式，計算 GlobalVar.filteredResult.xaDocsDict
         if (!xaDocsDict[docCorpus]) xaDocsDict[docCorpus] = {};
         let xaNames = Object.keys(GlobalVar.docDict[docCorpus][docFilename].xaStats);
         xaNames.forEach(function(xaName) {
            if (!xaDocsDict[docCorpus][xaName]) xaDocsDict[docCorpus][xaName] = [];
            xaDocsDict[docCorpus][xaName].push(docRef);                 // 2024-08-25: 從 docFilename 改 docRef
         });
      });
      //console.log(xaDocsDict);

      // 儲存後分類 metadataDocsDict, tagsDocsDict, 以及新加上的 xaDocsDict
      GlobalVar.filteredResult.metadataDocsDict = metadataDocsDict;     // metadataDocsDict[docCorpus][metadataField] := [docRef, ...], where docRef := GlobalVar.docDict[docCorpus][docFilename]
      GlobalVar.filteredResult.tagsDocsDict = tagsDocsDict;
      GlobalVar.filteredResult.xaDocsDict = xaDocsDict;

      // 利用 metadataDocsDict 計算後分類分佈表: metadata 後分類
      // 注意：在相同的 corpus 下，即使 mfield 不同，metadataDocsDict[corpus][mfield] 也都會包含「copus 下所有文件的 jqDoc 參考」（呃... 也可說 mfield 是多餘的，只是在先前步驟為了方便除錯所加上去的...）
      GlobalVar.filteredResult.metadataSpotlight = {};                  // reset
      let metadataSpotlight = GlobalVar.filteredResult.metadataSpotlight;
      for (let corpus in metadataDocsDict) {
         for (let mfield in metadataDocsDict[corpus]) {
            metadataDocsDict[corpus][mfield].forEach(function(docRef) {
               let escapedCue = docRef.metadata[mfield];              // 2024-10-01: escapedCue
               if (!metadataSpotlight) metadataSpotlight = {};
               if (!metadataSpotlight[corpus]) metadataSpotlight[corpus] = {};
               if (!metadataSpotlight[corpus][mfield]) metadataSpotlight[corpus][mfield] = {};
               if (!metadataSpotlight[corpus][mfield][escapedCue]) {
                  metadataSpotlight[corpus][mfield][escapedCue] = { filenames:[], freq:0 };   // 2024-09-02
               }
               metadataSpotlight[corpus][mfield][escapedCue].filenames.push(docRef.docFilename);
               metadataSpotlight[corpus][mfield][escapedCue].freq++;
            });
         }
      }
      //console.log("metadataSpotlight ==> " + metadataSpotlight);
      //alert(JSON.stringify(metadataSpotlight));

      // 利用 tagsDocsDict 計算後分類分佈表: tags 後分類
      // 由於每種 tagName (e.g., Udef_mytag) 下可能有多值，因此會比 metadata 多需一個迴圈
      GlobalVar.filteredResult.tagsSpotlight = {};                    // reset
      let tagsSpotlight = GlobalVar.filteredResult.tagsSpotlight;
      for (let corpus in tagsDocsDict) {
         for (let tagName in tagsDocsDict[corpus]) {
            tagsDocsDict[corpus][tagName].forEach(function(docRef) {
               let tagCuesStats = docRef.tagStats[tagName];
               for (let escapedCue in tagCuesStats) {                 // 2024-10-01: tagCueStats 的 key 是已經過 escapeSpotlightCue() 處理的 cue
                  if (!tagsSpotlight) tagsSpotlight = {};
                  if (!tagsSpotlight[corpus]) tagsSpotlight[corpus] = {};
                  if (!tagsSpotlight[corpus][tagName]) tagsSpotlight[corpus][tagName] = {};
                  if (!tagsSpotlight[corpus][tagName][escapedCue]) {
                     tagsSpotlight[corpus][tagName][escapedCue] = { filenames:[], freq:0, terms:[] };
                  }
                  let spotlightItem = tagsSpotlight[corpus][tagName][escapedCue];
                  spotlightItem.filenames.push(docRef.docFilename);   // 2024-09-02
                  spotlightItem.freq++;
                  let myArray = spotlightItem.terms.concat(tagCuesStats[escapedCue].terms).sort();   
                  // 注意，即使取 unique 後，也依然存有 "action/修", "RENOVATION/修" 等「不同」的 terms。後續顯示成 cues 僅取 "/" 後的字詞，因此仍可能有多個「修」出現
                  spotlightItem.terms = [...new Set(myArray)];        // ES6 get unique elements (array_unique)
               }
            });
         }
      }
      //console.log("tagSpotlight ==> " + tagsSpotlight);
      //alert(JSON.stringify(tagsSpotlight));
      
      // 利用 xaDocsDict 計算後分類分佈表: <Udef_XaSpotlight> 後分類
      // 由於每種標籤 (e.g., Udef_XaSpotlight) 下可能有多值，因此會比 metadata 多需一個迴圈
      GlobalVar.filteredResult.xaSpotlight = {};                      // reset
      let xaSpotlight = GlobalVar.filteredResult.xaSpotlight;
      for (let corpus in xaDocsDict) {
         for (let xaName in xaDocsDict[corpus]) {                    // xaName 相當於 tagName，目前就只有 "Udef_XaSpotlight"
            xaDocsDict[corpus][xaName].forEach(function(docRef) {
               let xaCuesStats = docRef.xaStats[xaName];
               for (let escapedCue in xaCuesStats) {                 // 2024-10-01: tagCueStats 的 key 是已經過 escapeSpotlightCue() 處理的 cue
                  if (!xaSpotlight) xaSpotlight = {};
                  if (!xaSpotlight[corpus]) xaSpotlight[corpus] = {};
                  if (!xaSpotlight[corpus][xaName]) xaSpotlight[corpus][xaName] = {};
                  if (!xaSpotlight[corpus][xaName][escapedCue]) {
                     xaSpotlight[corpus][xaName][escapedCue] = { filenames:[], freq:0, terms:[] };
                  }
                  let spotlightItem = xaSpotlight[corpus][xaName][escapedCue];
                  spotlightItem.filenames.push(docRef.docFilename);   // 2024-09-02
                  spotlightItem.freq++;
                  let myArray = spotlightItem.terms.concat(xaCuesStats[escapedCue].terms).sort();
                  spotlightItem.terms = [...new Set(myArray)];        // ES6 get unique elements (array_unique)
               }
            });
         }
      }
      //console.log("xaSpotlight ==> " + xaSpotlight);
      //alert(JSON.stringify(GlobalVar.filteredResult.xaSpotlight));
      
      // 2024-09-02, 2024-11-08: 若重新查詢，就需將後分類計算結果更新，並存入全域變數
      if (storeToGlobalVarDb) {
         // 將 metadataSpotlight 與 tagsSpotlight 的後分類結果，取出檔名部分，
         // 存入 dbMetadataSpotlightFilenames, dbTagsSpotlightFilenames, dbXaSpotlightFilenames
         // metadataSpotlight[corpus][mfield][escapedCue] = { filenames, freq }
         // tagsSpotlight[corpus][tagName][cue] = { filenames, freq, terms }
         // dbXaSpotlightFilenames[corpus][xaName][cue] = { filenames, freq, terms }
         
         GlobalVar.dbMetadataSpotlightFilenames = {};
         let mRef = GlobalVar.dbMetadataSpotlightFilenames;        // 透過 mRef 來設定 global 變數內容
         for (let corpus in metadataSpotlight) {
            if (!mRef[corpus]) mRef[corpus] = {};
            for (let mfield in metadataSpotlight[corpus]) {
               if (!mRef[corpus][mfield]) mRef[corpus][mfield] = {};
               for (let escapedCue in metadataSpotlight[corpus][mfield]) {
                  mRef[corpus][mfield][escapedCue] = metadataSpotlight[corpus][mfield][escapedCue].filenames;
               }
            }
         }
         
         GlobalVar.dbTagsSpotlightFilenames = {};
         let tRef = GlobalVar.dbTagsSpotlightFilenames;     // 透過 tRef 來設定 global 變數內容
         for (let corpus in tagsSpotlight) {
            if (!tRef[corpus]) tRef[corpus] = {};
            for (let tagName in tagsSpotlight[corpus]) {
               if (!tRef[corpus][tagName]) tRef[corpus][tagName] = {};
               for (let escapedCue in tagsSpotlight[corpus][tagName]) {
                  tRef[corpus][tagName][escapedCue] = tagsSpotlight[corpus][tagName][escapedCue].filenames;
               }
            }
         }

         // 2024-11-09: 仿 GlobalVar.dbTagsSpotlightFilenames，加上 GlobalVar.dbXaSpotlightFilenames 處理
         GlobalVar.dbXaSpotlightFilenames = {};
         let xaRef = GlobalVar.dbXaSpotlightFilenames;      // 透過 xaRef 來設定 global 變數內容
         for (let corpus in xaSpotlight) {
            if (!xaRef[corpus]) xaRef[corpus] = {};
            for (let xaName in xaSpotlight[corpus]) {
               if (!xaRef[corpus][xaName]) xaRef[corpus][xaName] = {};
               for (let escapedCue in xaSpotlight[corpus][xaName]) {
                  xaRef[corpus][xaName][escapedCue] = xaSpotlight[corpus][xaName][escapedCue].filenames;
               }
            }
         }
      }
      
      showProgressMsg("rendering");         // 2025-06-05: 「揚州」的 Immarkus 檔案需 render 甚久...
      window.setTimeout(() => presentFilteredResult(sortDocsBy, sortDocsOption), 20);
   }
   
   function updateGlobalXaSpotlightVars() {
      // 2024-11-10: 必須更新到「所有」文件，而不是僅更新 filteredResult
      let allDocFilenameList = Object.keys(GlobalVar.docFilenameJqDocMap);
      if (allDocFilenameList.length == 0) return;     // should not happen

      // 僅計算後分類 xaSpotlight 分佈
      let xaDocsDict = {};
      
      allDocFilenameList.forEach(function(docFilename) {
         let jqDoc = GlobalVar.docFilenameJqDocMap[docFilename];     // 2024-09-02
         //let docFilename = jqDoc.attr("filename");
         let docCorpus = jqDoc.find("corpus").text() || '-';
         docCorpus = convertToValidCorpus(docCorpus);                // 2025-07-18
         
         let docRef = GlobalVar.docDict[docCorpus][docFilename];     // 2024-08-25
         if (!docRef) alert("ERROR: cannot find docRef: " + docCorpus + ", " + docFilename);
         //alert(JSON.stringify(docRef));
         
         // 2024-11-10: 仿 tagsDocsDict 的處理方式，計算 GlobalVar.filteredResult.xaDocsDict
         if (!xaDocsDict[docCorpus]) xaDocsDict[docCorpus] = {};
         let xaNames = Object.keys(GlobalVar.docDict[docCorpus][docFilename].xaStats);
         xaNames.forEach(function(xaName) {
            if (!xaDocsDict[docCorpus][xaName]) xaDocsDict[docCorpus][xaName] = [];
            xaDocsDict[docCorpus][xaName].push(docRef);            // 2024-08-25: 從 docFilename 改 docRef
         });
      });
      //console.log(xaDocsDict);

      // 注意：xaDocsDict 是對「所有」文件，因此不能將它設到 GlobalVar
      // 利用 xaDocsDict 計算後分類分佈表: <Udef_XaSpotlight> 後分類
      // 由於每種標籤 (e.g., Udef_XaSpotlight) 下可能有多值，因此會比 metadata 多需一個迴圈
      let xaSpotlight = {};
      for (let corpus in xaDocsDict) {
         for (let xaName in xaDocsDict[corpus]) {                    // xaName 相當於 tagName，目前就只有 "Udef_XaSpotlight"
            xaDocsDict[corpus][xaName].forEach(function(docRef) {
               let xaCuesStats = docRef.xaStats[xaName];
               for (let escapedCue in xaCuesStats) {                 // 2024-10-01: tagCueStats 的 key 是已經過 escapeSpotlightCue() 處理的 cue
                  if (!xaSpotlight) xaSpotlight = {};
                  if (!xaSpotlight[corpus]) xaSpotlight[corpus] = {};
                  if (!xaSpotlight[corpus][xaName]) xaSpotlight[corpus][xaName] = {};
                  if (!xaSpotlight[corpus][xaName][escapedCue]) {
                     xaSpotlight[corpus][xaName][escapedCue] = { filenames:[], freq:0, terms:[] };
                  }
                  let spotlightItem = xaSpotlight[corpus][xaName][escapedCue];
                  spotlightItem.filenames.push(docRef.docFilename);   // 2024-09-02
                  spotlightItem.freq++;
                  let myArray = spotlightItem.terms.concat(xaCuesStats[escapedCue].terms).sort();
                  spotlightItem.terms = [...new Set(myArray)];        // ES6 get unique elements (array_unique)
               }
            });
         }
      }
      //console.log("xaSpotlight ==> " + xaSpotlight);
      //alert(JSON.stringify(GlobalVar.filteredResult.xaSpotlight));
      
      // 2024-11-09: 必須更新 GlobalVar.dbXaSpotlightFilenames
      GlobalVar.dbXaSpotlightFilenames = {};
      let xaRef = GlobalVar.dbXaSpotlightFilenames;      // 透過 xaRef 來設定 global 變數內容
      for (let corpus in xaSpotlight) {
         if (!xaRef[corpus]) xaRef[corpus] = {};
         for (let xaName in xaSpotlight[corpus]) {
            if (!xaRef[corpus][xaName]) xaRef[corpus][xaName] = {};
            for (let escapedCue in xaSpotlight[corpus][xaName]) {
               xaRef[corpus][xaName][escapedCue] = xaSpotlight[corpus][xaName][escapedCue].filenames;
            }
         }
      }
   }

   function applyFilterToGetDocuments() {
      // 將篩選結果儲存於 GlobalVar.filteredResult.filteredDocFilenameList
      // 注意：檔名查詢可用 m.filename:f1|f2|...

      // 注意：由於 XmarkusAnalyzer 並未有全文索引支援，因此全文檢索必須逐篇檢查
      //       但為了加速 metadata/tags 檢索，實作了 GlobalVar.dbMetadataSpotlightFilenames
      //       和 GlobalVar.dbTagsSpotlightFilenames 機制
      // 想了一陣子，query 形式也沒必要和 DocuSky 檢索類似...（相對可彰顯 XmarkusAnalyzer 特殊性）
      // query examples: m.ADY:1249
      //                 m.ADY:1249|1343
      //                 m.ADY:1249|1343|2000
      //                 m.filename:XXX|YYY              <= DocuSky 形式 {XXX}，在此簡化為 metadagta field search
      //                 m.docTitle:XXX                  <= DocuSky 不支援 title 後分類（DocuSky 有 @title:XXX 全文索引）
      //                 t.Udef_Evt_EVENT_CAUSE:flood
      //                 t.Udef_Evt_EVENT_CAUSE:flood|fire
      //                 t.Udef_Evt_EVENT_CAUSE:flood|fire|xyz
      //                 x.Udef_XaSpotlight:test|xyz     <= 2024-11-08 新增 XmarkusAnalyzer 特有的 tags
      //                 xtf.a|b:monk|buddhist           <= extended tags filter, tags a 或 b 中包含 monk|buddhist 就算擊中
      //                                                    e.g., xtf.Udef_Evt_BENIFICIARY|Udef_Evt_INITIATOR|Udef_Evt_SPONSOR:monk|buddhist
      // 2025-02-13: t.PersonName:cbdb_1651/蔡端平
      let query = $("#queryFilter").val().trim();      // 取值時，jquery 即已進行 unescape 動作，將 &#39; 換成單引號
      
      // 2026-01-01: 加入 " OR "（注意不是 "[OR]"），作為最外層的 operator => disjunctive normal form
      //             注意：感覺後續可能有其他效應，因此仍屬實驗性質
      //             例如：後續若繼續套用後分類的狀況：若原先是 "A OR B"，加上後分類 C 的結果
      //                   應該是 "C and (A OR B)"，所以不能僅是產生 "C A OR B"，而必須產生 "C A OR C B"
      let finalFilteredDocFilenameList = [];           // 運算後，最終的 docFilenameList
      let queryContainsSpotlight = false;
      
      // reset
      GlobalVar.filteredResult.queryTermsInfo = { spotlightTermsObj:{},    // spotlightTermsObj[spotlight]=terms (terms is an array) 
                                                  fulltextTerms:[],        // 注意，其 element 可能為 "a|b" 形式
                                                };
      
      let disjunctQueryParts = query.split(' OR ');        // 在最外層，用包含空白的 ' OR ' 而不是 '[OR]'
      disjunctQueryParts.forEach(function(conjQuery) {     // 注意： conjQuery 是「原始」從 input box 取得字串的一部份
         let filteredDocFilenameList = getConjQueryFilenameList(conjQuery.trim());
         // 注意：array_union = [...new Set([...array1, ...array2])];
         //alert(conjQuery + ' --- ' + filteredDocFilenameList.length);
         finalFilteredDocFilenameList = [...new Set([...finalFilteredDocFilenameList, ...filteredDocFilenameList])];
         //alert('union ==> ' + finalFilteredDocFilenameList.length);
      });
      
      // 2025-02-21: 若非後分類查詢（只要任意 conjQuery 有包含 spotlights，queryContainsSpotlight 就為 true），就將 prevCueList 清空
      if (!queryContainsSpotlight) GlobalVar.prevCueList = [];
      
      $("#filteredSize").text(finalFilteredDocFilenameList.length);
      
      GlobalVar.filteredResult.filteredDocFilenameList = finalFilteredDocFilenameList;

      // ------------------------------------------------------------------
      //    inner function （會用到 scoped 變數 queryContainsSpotlight） 
      // ------------------------------------------------------------------
      function getConjQueryFilenameList(conjQuery) {         // 用空白作為 'AND' 的 conjQuery
         // conjQuery 是「原始」從 input box 取得字串「用空白分隔後」的部份
         let spotlightFilters = [];            // query 中屬於 spotlight filter 的部分
         let fulltextFilters = [];             // query 中屬於 fulltext filter 的部分

         let spotlightTermsObj = {};           // 2025-11-04
         let fulltextTerms = [];               // 2025-11-04
         
         if (conjQuery == '') {
            return Object.keys(GlobalVar.docFilenameJqDocMap);
         }
         
         // 以下 (conjQuery != '')
         let queryParts = conjQuery.replace(/\s+/g,' ').split(' ');
         queryParts.forEach(function(qPart) {      // (m|t).<spotlight>:<cue>, or {filename|..}
            // 2026-04-20: 如果 qPart 最後的字元是一個或多個 '|'，則移除這些字元
            qPart = qPart.replace(/\|+/g, "|")        // 將多個 '|' 取代成一個
                         .replace(/^\|+|\|+$/g, "");  // 把「開頭或結尾的 |」全部移除

            // 2025-10-21: 讓 X-MARKUS 也支援 DocuSky 的 {f1|f2|...} 檔名查詢格式 => 將 {X} 改為 m.filename:X
            let docuFilenamesStyle = /^\{([^\}]+)\}$/;
            let matchArray = qPart.match(docuFilenamesStyle);
            if (matchArray) {
               //alert(JSON.stringify(matchArray));
               qPart = 'm.filename:' + matchArray[1];
            }
         
            let queryCorpus = '[ALL]';                              // default
            let p = qPart.indexOf(':');
            if (p > 0) {
               // 2025-07-21: 未指定 corpus 狀況下，queryKey 應該是 'm.xxx' or 't.xxx' or 'x.xxx'
               //             TODO: queryCorpus>m.xx ??
               //             TODO: 未來或可補上 queryDb ??
               let queryKey = qPart.substring(0, p);                    // should be 'm.xxx' or 't.xxx' or 'x.xxx'
               let queryVal = qPart.substring(p + 1);
               
               let p2 = queryKey.indexOf('>');                          // e.g., corpus>m.AU:xxx
               if (p2 > 0) {
                  queryCorpus = queryKey.substr(0,p2);
                  queryKey = queryKey.substr(p2+1);
               }
               
               // 2026-02-27
               if (queryKey == 'regexp') {       // 加上支援 regexp:query
                  // 2026-02-28: queryVal 保持不變，算是 fulltext query
                  // 由於 fulltext 查詢支援 regular expression，在此需濾除 invalid queryTerm，以免後續出錯
                  let r = checkRegexPattern(queryVal);
                  if (!queryVal) {
                     alert("'regexp:' expects to have a non-empty regular expression!\n" + "=> SKIPPED");
                  }
                  else if (r.ok) {
                     let fulltextFilter = { queryCorpus,
                                            queryTerm: queryVal,
                                            queryEscaped: false,      // 2026-03-21: queryVal 並未經過 escapeRegExp() 處理
                                          };
                     
                     fulltextFilters.push(fulltextFilter);
                     fulltextTerms.push(queryVal);   // 注意：這裡將 queryVal 視為單一 term
                  }
                  else {
                     alert("'" + queryVal + "' is not a valid regular expression\n" + r.error + "\n" + "=> SKIPPED");
                  }
               }
               else {
                  // 「正常」的 spotlight format -- e.g., m.AU:xxx, t.XX:xxx
                  // 2025-10-22: queryVal 必須經過 escapeSpotlightCue() 處理！
                  //             注意：單引號 apostrophe 會被編碼成 &#39;
                  queryVal = queryVal.split('|')
                                  .map((v) => escapeSpotlightCue(v))     // 由於是 spotlight 查詢，需進行 escapeSpotlightCue(.) 
                                  .join('|');
                  //alert(JSON.stringify(queryVal));
                  
                  // 2025-02-21: 後分類的 '-' 不應加入 highlighting terms，因此從 queryVal 移除 '-'
                  let termArray = queryVal.split('|');
                  const index = termArray.indexOf('-');
                  if (index > -1) termArray.splice(index, 1);      // 2nd parameter means remove one item only
                  
                  // 2024-12-30: (bug fix) 例如 "t.Udef_properties_date.dynasty:宋"，不能直接用 
                  //             let [queryType, querySpotlight] = queryKey.split('.')，會遺失第二個 '.' 以及後面的部分
                  let splittedParts = queryKey.split('.');
                  let queryType = splittedParts.shift();
                  let querySpotlight = splittedParts.join('.');
                  
                  if (['m','t','x'].includes(queryType)) {             // 2024-09-26: 從 metadata/tags 改為較短的 m/t，2024-11-08 加上 'x'
                     spotlightFilters.push({ queryCorpus,              // 2025-07-21: 先加上「未來可能會用到」的 corpus...
                                             'type':queryType, 
                                             'spotlight': querySpotlight,
                                             'cues': queryVal});       // 可能 's1|s2...' 包含多項 cues
                     if (!spotlightTermsObj[querySpotlight]) spotlightTermsObj[querySpotlight] = [];    // 2025-11-05
                     spotlightTermsObj[querySpotlight] = spotlightTermsObj[querySpotlight].concat(termArray);
                  }
                  else if (['xtf'].includes(queryType)) {
                     // 2025-05-21: xtf "extended tag filter" 包含所有 tags
                     spotlightFilters.push({ queryCorpus,
                                             'type':queryType, 
                                             'spotlight': querySpotlight,
                                             'cues': queryVal});        // 可能 's1|s2...' 包含多項 cues
                     if (!spotlightTermsObj[querySpotlight]) spotlightTermsObj[querySpotlight] = [];
                     spotlightTermsObj[querySpotlight] = spotlightTermsObj[querySpotlight].concat(termArray);
                  }
                  else {
                     // 視為 fulltext query -- 目前 fulltextFilters 就是字串的陣列（不包含 corpus）...
                     // 防呆：忽略 queryKey，以 queryVal 作為全文檢索的查詢值 (e.g., a.xx:test)
                     // Query format:
                     //    <term> -- fulltext search
                     //    regexp:<reg_exp> -- search by reg_exp
                     //    (m|t).<spotlight>:<cue> -- search by 後分類
                     let s = "Invalid query: " + queryType + " is not a valid query prefix";
                     alert(s);
                     if (queryVal) {     // 2026-04-20: 加上檢查
                        let fulltextFilter = { queryCorpus,
                                               queryTerm: escapeRegExp(queryVal),    // 2026-03-21
                                               queryEscaped: true,                   // 2026-03-21: queryVal 已經過 escapeRegExp() 處理
                                             };
                        fulltextFilters.push(fulltextFilter);
                        fulltextTerms = fulltextTerms.concat(termArray);
                     }
                  }
               }
            }
            else {
               // fulltext query
               // 2025-07-21: 為未來可能的 corpus>queryTerm 做些準備...
               let p = qPart.indexOf('>');
               if (p > 0) {
                  queryCorpus = qPart.substr(0,p);
                  qPart = qPart.substr(p+1);
               }
               
               let q = qPart.split('|')
                            .map((v) => escapeRegExp(v))         // 2026-02-27
                            .join('|');
                            
               // 2026-02-28: 在此 q 已經過 escape，因此不需再檢查是否 invalid (注意最後還是以 regular expression 進行比對)
               let fulltextFilter = { queryCorpus,
                                      queryTerm: q,
                                      queryEscaped: true,        // 2026-03-21
                                    };
                  
               fulltextFilters.push(fulltextFilter);

               let termArray = q.split('|');
               fulltextTerms = fulltextTerms.concat(termArray);
            }
         });
         //alert(fulltextTerms);
         
         // union := [... new Set(array1.concat(array2))];
         // 因為這函式僅處理完整查詢中，被 ' OR ' 切分後的 conjQuery part，因此 queryTermsInfo.spotlightTermsObj 會累加
         let queryTermsInfo = GlobalVar.filteredResult.queryTermsInfo;        // reference
         queryTermsInfo.fulltextTerms = [... new Set(queryTermsInfo.fulltextTerms.concat(fulltextTerms))];       // 注意，其 element 可能為 "a|b" 形式
         
         // 2025-11-05: 更新 queryTermsInfo.spotlightTermsObj
         Object.keys(spotlightTermsObj).forEach(function(udefTag) {
            queryTermsInfo.spotlightTermsObj[udefTag] = spotlightTermsObj[udefTag];
         });
         
         GlobalVar.filteredResult.queryFilters = { fulltextFilters,         // 2024-11-21: 為將來計算 2-dim table (spotlight*spotlight) 鋪路
                                                   spotlightFilters
                                                 };      
         //alert(JSON.stringify(GlobalVar.filteredResult.queryFilters));
         
         // 若有 spotlightFilters，可以不需對「所有文件」進行 fulltext filter
         // => 可以先取出 spotlightFilters 所篩選文件的交集
         let filteredDocFilenameList = (spotlightFilters.length > 0)
                                     ? getSpotlightFilteredDocFilenames(spotlightFilters)   // 後分類篩選後的文件檔名
                                     : Object.keys(GlobalVar.docFilenameJqDocMap);          // 包含資料庫所有文件檔名
         
         if (fulltextFilters.length > 0) {
            // 再套用 fulltextFilters 過濾 filteredDocFilenameList 取得縮小範圍的集合
            filteredDocFilenameList = getFulltextFilteredDocFilenames(filteredDocFilenameList, fulltextFilters);
         }
         
         if (spotlightFilters.length > 0) queryContainsSpotlight = true;
         
         return filteredDocFilenameList;
      }     // inner function getConjQueryFilenameList()

   }  // end of function applyFilterToGetDocuments();
   
   function getSpotlightFilteredDocFilenames(spotlightFilters) {
      // spotlightFilters: array of {type, spotlight, cue}
      // alert(JSON.stringify(spotlightFilters));
      // Notes: intersectionArray = array1.filter(value => array2.includes(value));
      //        unionArray = [... new Set(array1.concat(array2))];
      
      let finalDocFilenameList = [];
      let filteredDocFilenameList = {};             // {'metadata':[...], 'tags':[...], 'xa':[...], 'xtf':[...]}，如果沒有某種 filter 就會缺該項
      
      // 2024-11-01: (bugs fix) metadataFilters, tagsFilters 都應該是陣列，尤其 tagsFilters 應可允許同個 spotlight 下查詢不同 cues 的交集
      let metadataFilters = [];
      let tagsFilters = [];
      let xaFilters = [];
      let tagsTextFilters = {};
      
      spotlightFilters.forEach(function(v) {
         let {queryCorpus, type, spotlight, cues} = v;                  // e.g., 'queryCorpus>t.PersonName:cbdb_1651/蔡端平'
         //let obj = { };                                                  // 2024-11-01
         //obj[spotlight] = cues;
         
         // 4 types: m, t, x, xtf
         if (type == 'm') metadataFilters.push(v);
         else if (type == 't') tagsFilters.push(v);
         else if (type == 'x') xaFilters.push(v);                     // 2024-11-10
         else if (type == 'xtf') {                                      // 2025-05-21: 'xtf.Udef_Evt_BENEFICIARY|Udef_Evt_INITIATOR|Udef_Evt_SPONSOR:monk|buddhist'
            if (!tagsTextFilters[type]) tagsTextFilters[type] = [];
            tagsTextFilters[type].push(v);
         }
         else alert("Unknown type: " + type);                           // should not happen
      });
      
      // 注意：查詢的處理流程很容易出錯，尤其需注意防呆（例如沒有 metadata filter 的狀況）
      // (for each corpus) apply metadata filters
      // => TODO: 未來 spotlightFilters 應可指定這 filter 要套用在哪個 corpus？
      // format: dbMetadataSpotlightFilenames[corpus][spotlight][cue] = docFilenameList
      if (metadataFilters.length > 0) {
         for (let corpus in GlobalVar.dbMetadataSpotlightFilenames) {
            let corpusFilteredList = [];
            if (!GlobalVar.dbMetadataSpotlightFilenames[corpus]) continue;       // 防呆
            let startoff = true;
            metadataFilters.forEach(function(metadataFilter) {
               let {queryCorpus, type, spotlight, cues} = metadataFilter;                  // e.g., 'queryCorpus>t.PersonName:cbdb_1651/蔡端平'
               if (queryCorpus !== '[ALL]' && corpus !== queryCorpus) return;              // 2025-07-21: 直接跳過（不對此 corpus 文件進行過濾）
               //let spotlight = Object.keys(metadataFilter)[0];                           // 在此已經假設 metadataFilter 物件僅含 {spotlight:cues} 一項
               if (!GlobalVar.dbMetadataSpotlightFilenames[corpus][spotlight]) return;     // 防呆
               //let cues = metadataFilter[spotlight];
               let cuesDocFilenameList = [];
               cues.split('|').forEach(function(cue) {
                  // 注意：這裡的 cue 是已經過 escapeSpotlightCue() 處理的字串
                  if (!GlobalVar.dbMetadataSpotlightFilenames[corpus][spotlight][cue]) return;    // 防呆，至少需是空陣列
                  let docFilenameList = GlobalVar.dbMetadataSpotlightFilenames[corpus][spotlight][cue];
                  // 兩個檔名列表取聯集 union = [...new Set([...a, ...b])]
                  // [...a, ...b] concatenates two arrays, you can use a.concat(b) as well. new Set() create a set out of it and thus your union. And the last [...x] converts it back to an array.
                  cuesDocFilenameList = [... new Set(cuesDocFilenameList.concat(docFilenameList))];
               });
               
               // 兩個檔名列表取交集 -- 但需考慮 startoff （第一次直接用 GlobalVar.dbMetadataSpotlightFilenames[corpus][spotlight][cue]）
               if (startoff) {
                  corpusFilteredList = cuesDocFilenameList;
                  startoff = false;           // 馬上關閉 startoff
               }
               else {
                  // 透過 filter 取交集
                  corpusFilteredList = corpusFilteredList.filter(v => cuesDocFilenameList.includes(v));
               }
            });
         
            // 對不同文獻集的的篩選結果，需取聯集 [...new Set([...a, ...b])]
            if (filteredDocFilenameList['metadata'] === undefined) filteredDocFilenameList['metadata'] = [];
            let union = new Set([...filteredDocFilenameList['metadata'], ...corpusFilteredList]);
            filteredDocFilenameList['metadata'] = [... union];
         }
      }
      
      // 2024-09-03
      // (for each corpus) apply tags filters
      // format: dbTagsSpotlightFilenames[corpus][spotlight][cue] = docFilenameList
      if (tagsFilters.length > 0) {
         for (let corpus in GlobalVar.dbTagsSpotlightFilenames) {
            let corpusFilteredList = [];
            if (!GlobalVar.dbTagsSpotlightFilenames[corpus]) continue;                 // 防呆
            let startoff = true;
            tagsFilters.forEach(function(tagsFilter) {
               let {queryCorpus, type, spotlight, cues} = tagsFilter;                  // e.g., 'queryCorpus>t.PersonName:cbdb_1651/蔡端平'
               if (queryCorpus !== '[ALL]' && corpus !== queryCorpus) return;          // 2025-07-21: 直接跳過（不對此 corpus 文件進行過濾）
               //let spotlight = Object.keys(tagsFilter)[0];                           // 假設恰有第一項
               //alert(spotlight + "\n" + JSON.stringify(Object.keys(GlobalVar.dbTagsSpotlightFilenames[corpus])));
               if (!GlobalVar.dbTagsSpotlightFilenames[corpus][spotlight]) return;     // 防呆
               let filterCues = cues;                                                  // e.g., 'cbdb_1651/蔡端平'
               let cuesDocFilenameList = [];
               filterCues.split('|').forEach(function(filterCue) {
                  let tagCueFilenames = GlobalVar.dbTagsSpotlightFilenames[corpus][spotlight];
                  let docFilenameList = getFilteredDocFilenameList('tagStats', spotlight, tagCueFilenames, filterCue);
                  // 兩個檔名列表取聯集 union = [...new Set([...a, ...b])]
                  // [...a, ...b] concatenates two arrays, you can use a.concat(b) as well. new Set() create a set out of it and thus your union. And the last [...x] converts it back to an array.
                  cuesDocFilenameList = [... new Set(cuesDocFilenameList.concat(docFilenameList))];
               });
               
               // 兩個檔名列表取交集 -- 但需考慮 startoff （第一次直接取 GlobalVar.dbTagsSpotlightFilenames[corpus][spotlight][cue]） 
               if (startoff) {
                  corpusFilteredList = cuesDocFilenameList;
                  startoff = false;           // 馬上關閉 startoff
               }
               else {
                  // 透過 filter 取交集
                  corpusFilteredList = corpusFilteredList.filter(v => cuesDocFilenameList.includes(v));
               }
            });
            
            // 對不同文獻集的的篩選結果取聯集
            if (filteredDocFilenameList['tags'] === undefined) filteredDocFilenameList['tags'] = [];
            let union = new Set([...filteredDocFilenameList['tags'], ...corpusFilteredList]);
            filteredDocFilenameList['tags'] = [... union];
         }
      }
      
      // 2024-11-08
      // (for each corpus) apply xa filters
      // format: dbXaSpotlightFilenames[corpus][spotlight][cue] = docFilenameList
      if (xaFilters.length > 0) {
         for (let corpus in GlobalVar.dbXaSpotlightFilenames) {
            let corpusFilteredList = [];
            if (!GlobalVar.dbXaSpotlightFilenames[corpus]) continue;                  // 防呆
            let startoff = true;
            xaFilters.forEach(function(xaFilter) {
               let {queryCorpus, type, spotlight, cues} = xaFilter;                   // e.g., 'queryCorpus>t.PersonName:cbdb_1651/蔡端平'
               if (queryCorpus !== '[ALL]' && corpus !== queryCorpus) return;         // 2025-07-21: 直接跳過（不對此 corpus 文件進行過濾）
               //let spotlight = Object.keys(xaFilter)[0];                            // 假設恰有第一項
               if (!GlobalVar.dbXaSpotlightFilenames[corpus][spotlight]) return;      // 防呆
               //let cues = xaFilter[spotlight];
               let cuesDocFilenameList = [];
               cues.split('|').forEach(function(cue) {
                  if (!GlobalVar.dbXaSpotlightFilenames[corpus][spotlight][cue]) return;    // 防呆
                  let docFilenameList = GlobalVar.dbXaSpotlightFilenames[corpus][spotlight][cue];
                  // 兩個檔名列表取聯集 union = [...new Set([...a, ...b])]
                  // [...a, ...b] concatenates two arrays, you can use a.concat(b) as well. new Set() create a set out of it and thus your union. And the last [...x] converts it back to an array.
                  cuesDocFilenameList = [... new Set(cuesDocFilenameList.concat(docFilenameList))];
               });
               
               // 兩個檔名列表取交集 -- 但需考慮 startoff （第一次直接取 GlobalVar.dbXaSpotlightFilenames[corpus][spotlight][cue]） 
               if (startoff) {
                  corpusFilteredList = cuesDocFilenameList;
                  startoff = false;           // 馬上關閉 startoff
               }
               else {
                  // 透過 filter 取交集
                  corpusFilteredList = corpusFilteredList.filter(v => cuesDocFilenameList.includes(v));
               }
            });
            
            // 對不同文獻集的的篩選結果取聯集
            if (filteredDocFilenameList['xa'] === undefined) filteredDocFilenameList['xa'] = [];
            let union = new Set([...filteredDocFilenameList['xa'], ...corpusFilteredList]);
            filteredDocFilenameList['xa'] = [... union];
         }
      }
      
      // 2025-05-30: xtf -- extended tag-text filters
      // (for each corpus) apply tags text filters
      // refers to: dbTagsSpotlightFilenames[corpus][spotlight][cue] = docFilenameList
      // 注意，目前並不支援 wildcard -- e.g., xtf.*:monk|buddhist
      for (tagsTextFilterType in tagsTextFilters) {              // tagsTextFilterType 為 'xtf'
         for (let corpus in GlobalVar.dbTagsSpotlightFilenames) {
            let corpusFilteredList = [];
            if (!GlobalVar.dbTagsSpotlightFilenames[corpus]) continue;                        // 防呆
            let startoff = true;
            tagsTextFilters[tagsTextFilterType].forEach(function(tagsTextFilter) {
               let {queryCorpus, type, spotlight, cues} = tagsTextFilter;                  // e.g., 'queryCorpus>t.PersonName:cbdb_1651/蔡端平'
               if (queryCorpus !== '[ALL]' && corpus !== queryCorpus) return;              // 2025-07-21: 直接跳過（不對此 corpus 文件進行過濾）
               let filterSpotlightStr = spotlight;                                         // e.g., 'Udef_Evt_BENEFICIARY|Udef_Evt_INITIATOR|Udef_Evt_SPONSOR'
               let filterText = cues;                                                      // e.g., 'monk|buddhist'
               let filterSpotlights = filterSpotlightStr.split('|');

               let cuesDocFilenameList = [];
               let spotlights = Object.keys(GlobalVar.dbTagsSpotlightFilenames[corpus]);
               spotlights.forEach(function(spotlight) {
                  if (!filterSpotlights.includes(spotlight)) return;
                  
                  filterText.split('|').forEach(function(filterTerm) {
                     let tagCueFilenames = GlobalVar.dbTagsSpotlightFilenames[corpus][spotlight];
                     let tagCues = Object.keys(tagCueFilenames)
                     //alert(spotlight + '\n' + JSON.stringify(tagCues));
                     tagCues.forEach(function(tagCue) {
                        //alert(spotlight + ':' + tagCue + '\n' + filterTerm + '\n\n' + tagCueFilenames[tagCue]);
                        if (tagCue.includes(filterTerm)) {
                           let docFilenameList = getFilteredDocFilenameList('tagStats', spotlight, tagCueFilenames, tagCue);
                           // 兩個檔名列表取聯集 union = [...new Set([...a, ...b])]
                           // [...a, ...b] concatenates two arrays, you can use a.concat(b) as well. new Set() create a set out of it and thus your union. And the last [...x] converts it back to an array.
                           cuesDocFilenameList = [... new Set(cuesDocFilenameList.concat(docFilenameList))];
                           //alert(cuesDocFilenameList.length + '\n' + JSON.stringify(cuesDocFilenameList));
                        }
                     });
                  });
               });

               // 兩個檔名列表取交集 -- 但需考慮 startoff （第一次直接取 GlobalVar.dbTagsSpotlightFilenames[corpus][spotlight][cue]） 
               if (startoff) {
                  corpusFilteredList = cuesDocFilenameList;
                  startoff = false;           // 馬上關閉 startoff
               }
               else {
                  // 透過 filter 取交集
                  corpusFilteredList = corpusFilteredList.filter(v => cuesDocFilenameList.includes(v));
               }
            });
            
            // 對不同文獻集的的篩選結果取聯集 (xtf: extended tag-text filter)
            if (filteredDocFilenameList['xtf'] === undefined) filteredDocFilenameList['xtf'] = [];
            let union = new Set([...filteredDocFilenameList['xtf'], ...corpusFilteredList]);
            filteredDocFilenameList['xtf'] = [... union];
         }
      }  // for (tagsTextFilterType in tagsTextFilters)
      
      // 總結
      let filterTypes = Object.keys(filteredDocFilenameList);
      if (filterTypes.length > 0) {
         // 2024-11-08: 有兩種以上，就對「有 filter」的 metadata/tags/xa filters 結果取交集
         let firstFilterType = filterTypes.shift();
         finalDocFilenameList = filteredDocFilenameList[firstFilterType];
         filterTypes.forEach(function(filterType) {
            finalDocFilenameList = finalDocFilenameList.filter(v => filteredDocFilenameList[filterType].includes(v));
         });
      }
      else {
         // 沒有後分類 filters，直接取 Object.keys(GlobalVar.docFilenameJqDocMap)
         // 若呼叫端已經確認有 spotlightFilters，就應該不會執行到這裡（只是防呆）
         finalDocFilenameList = Object.keys(GlobalVar.docFilenameJqDocMap);
      }

      return finalDocFilenameList;
   }
   
   function getFilteredDocFilenameList(docDictField, spotlight, tagCueFilenames, queryCue) {
      // 2025-02-14
      // tagCueFilenames := GlobalVar.dbTagsSpotlightFilenames[corpus][spotlight];
      // 逐一檢視以下三種狀況（滿足其一即回傳檔名列表）：
      // case (1): queryCue q 恰為某個 cue (in tagsSpotlight)
      // case (2): queryCue q+'/' 是某些 cue (in tagsSpotlight) 的 prefix
      // case (3): 某個 cue in tagsSpotlight 滿足 cue+'/' 為 query q 的 prefix
      // 注意：在後分類 spotlight dict 的設計上是將「該後分類下的所有 cues 裝入 dict」，
      //       這些 cues 應處於相同階層（但這需要有合適規範，且需 DocuXml converter 配合）。
      //       在此假設不會有 q 為某個 cue1 prefix，然後又存在某 cue2 為 q 的 prefix 的狀況
      
      let cueList = Object.keys(tagCueFilenames);
      let docFilenameList = [];
      
      // case (1): queryCue q 恰為某個 cue (in tagsSpotlight)
      if (cueList.includes(queryCue)) return tagCueFilenames[queryCue];
      
      // case (2): queryCue q+'/' 是某些 cue (in tagsSpotlight) 的 prefix
      cueList.forEach(function(cue) {
         if (cue.startsWith(queryCue+'/')) docFilenameList = docFilenameList.concat(tagCueFilenames[cue]);
      });
      if (docFilenameList.length > 0) return [...new Set(docFilenameList)];       // array_unique
         
      // case (3): 某個 cue in tagsSpotlight 滿足 cue+'/' 為 query q 的 prefix -- 將 q = cue/remains 的 remains 取出
      //           結果應為 tagCueFilenames[queryCue] 的子集合...
      //           => 需從 docDict[corpus][filename] = {metadata, tagStats, xaStats, jqDoc, text} 
      //              利用 docDictField 取得 'tagStats' 或 'xaStats' 子物件的 terms 來對 remains 進行比對...
      if (docFilenameList.length == 0) {
         let corpus = GlobalVar.prevCorpus;
         cueList.forEach(function(cue) {
            if (queryCue.startsWith(cue+'/')) {
               let remains = queryCue.substr(cue.length+1);
               //alert(remains);
               tagCueFilenames[cue].forEach(function(filename) {
                  let obj = GlobalVar.docDict[corpus][filename][docDictField];    // obj[spotlight][cue] = { freq, terms }, where terms is an array of strings
                  //alert(JSON.stringify(obj));
                  if (obj[spotlight] && obj[spotlight][cue]) {
                     // 注意：obj[spotlight][cue].terms 應存在
                     //alert(JSON.stringify(obj[spotlight][cue].terms));
                     if (obj[spotlight][cue].terms.includes(remains)) docFilenameList.push(filename);
                  }
                  else alert("Something wrong? spotlight=" + spotlight + ", cue=" + cue);    // should not happen
               });
            }
         });
      }
      return docFilenameList;
   }

   function getFulltextFilteredDocFilenames(inDocFilenameList, fulltextFilters) {
      // 2024-09-04: 從 filteredDocFilenameList 中，以 fulltextFilters 篩選出最終的檔名列表
      let filteredDocFilenameList = [];
      inDocFilenameList.forEach(function(docFilename) {
         let corpus = GlobalVar.docFilenameCorpusMap[docFilename];
         let text = GlobalVar.docDict[corpus][docFilename].fulltext;
         
         // 2026-03-08：調整搜尋範圍
         if (GlobalVar.searchRange == 'all') {
            text += ' ' + GlobalVar.docDict[corpus][docFilename].metadataText    // 除去 <doc_content> 後的文字內容
                  + ' ' + GlobalVar.docDict[corpus][docFilename].tagsText;       // <doc_content> 內 <Event>, <Comment> 的內容
         }
         
         let pass = fulltextFilters.every(function(filter) {             // 注意：filter 可能為 'a|b' 形式
            // filter := { queryCorpus, queryTerm }                      // 2025-07-21
            if (filter.queryCorpus !== '[ALL]' && filter.queryCorpus !== corpus) return true;    // 2025-07-21: 直接跳過（不對此 corpus 文件進行過濾）
            let queryTerm = filter.queryTerm;                            // 2025-01-05: .toUpperCase(); 是否需換成大寫來比對？
            
            let innerPass = queryTerm.split('|').some(function(term) {
               //return (text.includes(term.toUpperCase()));             // 2025-01-06: 換成大寫來比對 （但查詢 novation 仍可找到 renovation!）
               //if (docFilename == '20250324_Immarkus_Dawn_iiif_Catographic_ethnograpy_Shanxi_gazetteer_道光_大同縣志_道光_大同縣志_57.json_P12') saveTextFile("test.txt", text);
               // 2026-01-22: to support "partial search"
                           
               // 2026-02-28: 若 queryTerm 為 "\|門"，在此 term 就可能僅為一個 "\" 而導致錯誤
               if (GlobalVar.enableFulltextPartialSearch) {
                  let r = checkRegexPattern(term);
                  if (!r.ok) return false;
               }

               let pass = (GlobalVar.enableFulltextPartialSearch)
                        ? text.match(new RegExp(term, "gi"))
                        : (text.match(new RegExp("\\W" + term + "\\W", "gi")));    // 2025-01-06: 前後不能是英數字，[^a-zA-Z0-9_]
               return pass;       
            });
            return innerPass;
         });
         if (pass) filteredDocFilenameList.push(docFilename);
      });
      return filteredDocFilenameList;
   }   
   
   
   // ------------------------------------------------------------------------
   //                         experiments
   // * exportDocSpotlightsTable() -- a big table of row:filename, 
   //                                 column:spotlight, cell:cue value
   // * exportTwoDimTable() -- 2-dim table
   // * invokeSpotlightSparkLite()
   // ------------------------------------------------------------------------
   
   function exportTwoDimTable() {
      let {rType, cType, twoDimTable} = computeTwoDimObj('table');
      let data = twoDimTable;
      
      // (1). 創建一個工作表
      const ws = XLSX.utils.aoa_to_sheet(data);        // aoa_to_sheet 是用來將二維陣列轉換為工作表的函式
      
      // (2). 創建一個工作簿 (sheetname cannot exceed 31 characters)
      const wb = XLSX.utils.book_new();
      let t = GlobalVar.filteredResult.query.trim();
      t = t ? (':'+t) : '';
      let sheetname = GlobalVar.prevCorpus + t;   
      if (sheetname.length > 30) {
         sheetname = sheetname.substring(0,2) + 'X' + spotlight.slice(-28);     // slice(-28) takes the last 28 chars
      }
      XLSX.utils.book_append_sheet(wb, ws, sheetname);
      
      // (3). 將工作簿轉換為 Excel 檔案並觸發下載
      let filteredSize = GlobalVar.filteredResult.filteredDocFilenameList.length;
      let outFilename = (new Date()).yyyymmdd() + "-XA-2dimTable(" + filteredSize + ").xlsx";
      XLSX.writeFile(wb, outFilename);
   }
   
   function invokeTwoDimTableLite(exportJson = false) {
      // 透過 postMessage 傳遞 DocuXml（字串形式）到應用程式
      // 2024-11-27: TEST TEST TEST
      //let twoDimTableTree = computeTwoDimObj('tree');
      //alert(JSON.stringify(twoDimTableTree));
      let twoDimObj = computeTwoDimObj('table');
      if (!twoDimObj) return;                       // 防呆
      
      // 2024-12-05
      let wrapperJson = { source: 'XmarkusAnalyzer',
                          target: 'TwoDimTableLite',
                          parameters: [],                           // 2025-02-20
                          type: 'JSON',
                          message: { 'rAdditive': twoDimObj.rAdditive,
                                     'cAdditive': twoDimObj.cAdditive,
                                     'twoDimTable': twoDimObj.twoDimTable,
                                   },
                        };
                        
      if (exportJson) {
         let outFilename = (new Date()).yyyymmdd() + "-XA-2dimTable-export.json";
         let mimeType = "application/json";
         exportMimeFile(outFilename, mimeType, JSON.stringify(wrapperJson));
      }

      let newWindow = window.open(API_URL['TwoDimTableLite'], '_blank');
      //newWindow.onload = function() {                   // 確保新視窗載入完成（應比等待一陣子就傳遞訊息來得好，但... 在 Firefox 似乎事件不會被觸發？）
      window.setTimeout(function() {
         if (newWindow) {
            // 傳遞訊息
            newWindow.postMessage(wrapperJson, '*');      // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
         }
         else console.log("Error: newWindow not ready");
      }, 2000);
   }

   function computeTwoDimObj(retTreeOrTable = 'table') {
      // 這部分的計算還頗麻煩... 但目前也想不出其他更好的辦法...
      let fulltextFilters = GlobalVar.filteredResult.queryFilters.fulltextFilters;
      let spotlightFilters = GlobalVar.filteredResult.queryFilters.spotlightFilters;
      if (!Array.isArray(spotlightFilters) || spotlightFilters.length < 2) {
         // 不到兩項後分類
         alert("Sorry, needs to specify at least two spotlights");
         return false;
      }

      // (1). 取出最後（query 最前方）兩個 spotlightFilters
      //      GlobalVar.filteredResult.metadataSpotlight[corpus][mfield][cue] = { filenames:[...], freq:n }
      //      GlobalVar.filteredResult.tagsSpotlight[corpus][tagName][cue] = { freq, terms }
      //      GlobalVar.filteredResult.xaSpotlight[corpus]['Udef_XaSpotlight'][cue] = { freq, terms } -- 目前 terms 應該與 cue 相同
      let spotlightC = spotlightFilters.shift();          // {type, spotlight, cues}, 最後的 spotlightFilter 放在橫向 (X-axis) as columns
      let spotlightR = spotlightFilters.shift();          // {type, spotlight, cues}, 縱向 (Y-axis) as rows
      //alert(JSON.stringify(spotlightR) + "\n" + JSON.stringify(spotlightC));

      // (2). 將剩下的 filters 合併成 new query，計算 filteredResult
      let query = [].concat(spotlightFilters).concat(fulltextFilters).reverse().join(' ');
      $("#queryFilter").val(query);                       // 注意：query 可包含 &#39; 等 escape 過的字元（顯示在 input box 會是 unescape 的單引號字元）
      computeFilteredResultAndPresent(false, getCurSortDocsBy(), getCurSortDocsOption());

      // (3). 2024-11-23: 對 filteredResult 計算 twoDimTree spotlights 的 Xcues 與 Ycues
      //      注意：應該只需計算當前 corpus 下的 2-dim distribution
      let corpus = GlobalVar.prevCorpus;

      let rType = spotlightR.type;                        // 'm', 't', 'x'
      let rField = spotlightR.spotlight;                  // 'ADY', 'Udef_XXX', 'Udef_Xa_XXX', etc.
      let cType = spotlightC.type;                        // 'm', 't', 'x'
      let cField = spotlightC.spotlight;                  // 'ADY', 'Udef_XXX', 'Udef_Xa_XXX', etc.
      
      // 2024-11-27: rCues, cCues 加上 sort()
      let cCues = [], rCues = [], obj;
      let spotlightMap = { 'm': 'metadataSpotlight',
                           't': 'tagsSpotlight',
                           'x': 'xaSpotlight' };
      obj = GlobalVar.filteredResult[spotlightMap[rType]][corpus][rField];
      rCues = (obj) ? Object.keys(obj).sort() : [];       // 正常狀況下應該不為空（因為是透過 UI 選擇 spotlight:cue），但還是防呆一下
      obj = GlobalVar.filteredResult[spotlightMap[cType]][corpus][cField];
      cCues = (obj) ? Object.keys(obj).sort() : [];       // 正常狀況下應該不為空（因為是透過 UI 選擇 spotlight:cue），但還是防呆一下
      //alert(JSON.stringify(cCues) + "\n\n" + JSON.stringify(rCues));
      
      // (4). 初始化 twoDimTree[cCues][rCues] 物件（注意，最後得到的 twoDimTree 會是一棵 full tree）
      let twoDimTree = {};
      let treeLabel = spotlightR.type + '.' + spotlightR.spotlight + ' * ' 
                    + spotlightC.type + '.' + spotlightC.spotlight;
      twoDimTree['_label'] = treeLabel;                      // 相當於要放在表格 (0,0) 的標籤
      rCues.forEach(function(rCue) {
         twoDimTree[rCue] = {};
         cCues.forEach(function(cCue) {
            twoDimTree[rCue][cCue] = 0;
         });
      });
      
      // (5). 透過 GlobalVar.filteredResult.corpusJqDocFilenameHash[corpus] 取得 corpusJqDocFilenameHash
      let dictSpotlightMap = { 'm': 'metadata',
                               't': 'tagStats',
                               'x': 'xaStats' };
      let corpusJqDocFilenameHash = GlobalVar.filteredResult.corpusJqDocFilenameHash[corpus];
      Object.keys(corpusJqDocFilenameHash).forEach(function(docFilename) {
         let jqDoc = corpusJqDocFilenameHash[docFilename];
         //let docFilename = jqDoc.attr("filename");
         let docRef = GlobalVar.docDict[corpus][docFilename];
         // GlobalVar.docDict[corpus][docFilename] := {metadata, tagStats, xaStats, jqDoc, text}
         // where metadata[metadataField] = cue
         //       tagStats[tagName][cue] = { freq, terms }         
         //       xaStats[tagName][cue] = { freq, terms }         
         let rDocCues = getDocCues(docRef, rType, rField);
         let cDocCues = getDocCues(docRef, cType, cField);
         rDocCues.forEach(function(rDocCue) {
            if (rCues.includes(rDocCue)) {
               cDocCues.forEach(function(cDocCue) {
                  if (cCues.includes(cDocCue)) twoDimTree[rDocCue][cDocCue]++;
               });
            }
         });
      });
      //alert(JSON.stringify(twoDimTree));

      // 2024-12-05      
      const typeAdditiveMap = { 'm': true,
                                't': false,
                                'x': false,
                              };
      let rAdditive = typeAdditiveMap[rType];
      let cAdditive = typeAdditiveMap[cType];
      
      // 2024-11-27: 回傳的格式 ('tree' or 'table')
      let result = { rAdditive, cAdditive, twoDimTree };          // 2024-12-05
      if (retTreeOrTable == 'tree') return result;
      
      // (6). 產生二維表格，以便直接用 XLSX.utils.aoa_to_sheet(data) 產生 worksheet
      let twoDimTable = convertTwoDimTree2Table(twoDimTree);
      //alert(JSON.stringify(twoDimTable));
      
      result = { rAdditive, cAdditive, twoDimTable };             // 2024-12-05
      return result;
   }
   
   function convertTwoDimTree2Table(twoDimTree) {
      // 2024-11-29: 將 2-dim tree 轉換成二維表格
      //             twoDimTree := { '_label':'XYZ', rCue1:{cCue1, cCue2,...}, rCue2:{cCue1, ...}, ...}
      //             可方便直接用 XLSX.utils.aoa_to_sheet(data) 產生 worksheet
      //             注意: 需加上第一列 row header cueR 與第一欄 cueC
      // 在此假設 twoDimTree （雖然表達成兩層樹狀結構）展開後是「完整」的，每個 twoDimTree[r][c]
      // 都有值（預設會是 twoDimTree[r][c] = 0），不會有缺項

      let twoDimTable = [];
      
      // first row
      let list = [];
      list.push(twoDimTree['_label']);       // 放在 (0,0) 的標籤
      delete twoDimTree['_label'];           // 2024-12-01: bug fix

      let cueR = Object.keys(twoDimTree)[0];          
      for (let cueC in twoDimTree[cueR]) list.push(cueC);
      twoDimTable.push(list);
      
      // other rows
      for (let cueR in twoDimTree) {
         if (cueR == '_label') continue;     // 放在 (0,0) 的標籤字串，直接跳過
         list = [];                          // reset
         list.push(cueR);                    // first column
         for (let cueC in twoDimTree[cueR]) list.push(twoDimTree[cueR][cueC])
         twoDimTable.push(list);
      }
      
      return twoDimTable;
   }
   
   function getDocCues(docRef, type, field) {
      let docCues = [];
      let obj;
      if (type == 'm') docCues = docRef.metadata[field].split(';');
      else if (type == 't') {
         obj = docRef.tagStats[field];
         docCues = (obj) ? Object.keys(obj) : [];
      }
      else if (type == 'x') {
         obj = docRef.xaStats[field];
         docCues = (obj) ? Object.keys(obj) : [];
      }
      //alert(type + ':' + field + ' => ' + JSON.stringify(docCues));
      return docCues;
   }
   
   function exportDocSpotlightsTable() {
      // 創建一個新的工作簿
      const wb = XLSX.utils.book_new();

      // 將後分類數據填入工作表
      computeDocSpotlightTableToWorkbook(wb);

      // 將工作簿寫入 Excel 檔案（2025-03-18: 調整匯出的檔名 -- 以匯入的 xml 檔名作為 prefix）
      let filteredSize = GlobalVar.filteredResult.filteredDocFilenameList.length;
      //let outFilename = (new Date()).yyyymmdd() + "-XA-docSpotlightTable(" + filteredSize + ").xlsx";
      let inDocuXmlFilename = GlobalVar.docuXmlFilename;
      if (!inDocuXmlFilename) inDocuXmlFilename = (new Date()).yyyymmdd() + '-NoFilename.xml';
      let parts = inDocuXmlFilename.split('.');
      parts.pop();                                 // 移除最末端的 .xml
      let outFilename = parts.join('.') + "-XA-docSpotlightTable(" + filteredSize + ").xlsx";
      
      XLSX.writeFile(wb, outFilename);
   }

   function computeDocSpotlightTableToWorkbook(wb) {
      // 2024-11-21: 只針對 filteredResult 匯出（這樣可以更有彈性）-- 每個 corpus 單張 sheet
      // 產生 {corpus1: [{spotlight1,spotlight2,...}, {spotlight1,spotlight2,...},...], corpus2:[...] }，其中 spotlight1 應該是 'filename'
      for (let corpus in GlobalVar.filteredResult.corpusJqDocFilenameHash) {
         let rowJsonArray = [];
         // metadataDocsDict[corpus][metadataField] = [docRef1, docRef2, ...], where docRefi is a reference to GlobalVar.docDict[docCorpus][docFilename]
         // GlobalVar.docDict[docCorpus][docFilename] := {metadata, tagStats, xaStats, jqDoc, text}
         
         //let spotlights = [ Object.keys(GlobalVar.filteredResult.metadataDocsDict[corpus]),
         //                   Object.keys(GlobalVar.filteredResult.tagsDocsDict[corpus]),
         //                   Object.keys(GlobalVar.filteredResult.xaDocsDict[corpus]) ];
         //alert(JSON.stringify(spotlights));
         
         // 針對每份 jqDoc 進行 row 輸出
         // metadata 相對簡單（假設只有單字串值）；tagStats 就複雜許多（包含 terms 之類的統計），目前僅取出 tag 和 tag 內容物件的 keys
         let corpusJqDocFilenameHash = GlobalVar.filteredResult.corpusJqDocFilenameHash[corpus];
         Object.keys(corpusJqDocFilenameHash).forEach(function(docFilename) {
            let jqDoc = corpusJqDocFilenameHash[docFilename];
            //let docFilename = jqDoc.attr("filename");
            let docRef = GlobalVar.docDict[corpus][docFilename];

            let outTagStats = {};
            for (let tag in docRef.tagStats) {
               let tagObj = docRef.tagStats[tag];
               outTagStats[tag] = Object.keys(tagObj).join(';');
            }
            let outXaStats = {};
            for (let xa in docRef.xaStats) {
               let xaObj = docRef.xaStats[xa];
               outXaStats = Object.keys(xaObj).join(';');
            }
            let rowObj = { ...docRef.metadata, ...outTagStats, ...outXaStats };    // merging objects
            //alert(JSON.stringify(rowObj));

            rowJsonArray.push(rowObj);
         });

         let sheetname = corpus;
         let worksheet = XLSX.utils.json_to_sheet(rowJsonArray);        // 可將 [{f11,f12,...,f1m}, {f21,f22,...,f2m}, ..., {fn1,fn2,...,fnm}] 展成 n rows，m columns 的表格
         XLSX.utils.book_append_sheet(wb, worksheet, sheetname);
      }
   }

   function invokeSpotlightSparkLite(evt, spotlightSparksObj, newWin = true) {
      // 透過 postMessage 傳遞 DocuXml（字串形式）到應用程式
      let url = "./SpotlightSparkLite.html";
      let json = { source: 'XmarkusAnalyzer',           // 2024-12-15: 比直接從 file 匯入資料，多包裝一層
                   target: 'SpotlightSparkLite',
                   parameters: [],
                   type: 'JSON',
                   message: spotlightSparksObj,
                 };
      
      if (newWin) {
         let newWindow = window.open(url, '_blank');
         window.setTimeout(function() {
            if (newWindow) {
               newWindow.postMessage(json, '*');    // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
            }
            else console.log("Error: newWindow not ready");
         }, 1500);
      }
      else {
         let evtAlt = (evt.originalEvent) ? evt : $(this);
         let backgroundColor = '#FFFFFF';
         let iframeTitle = "SpotlightSparkLite";
         let postAction = null;
         let w = Math.max(window.innerWidth - 80, 800);
         let h = Math.min(window.innerHeight - 50, 640);
         
         var iframeId = showUrlIframe(evtAlt, url, iframeTitle, postAction, w, h);
         
         document.getElementById(iframeId).onload = function() {
         //$(iframeId).ready(function() {
            //window.setTimeout(function() {    // 1500 ms 後才送訊息... 否則顯示頁面可能會空白（不確定是否是因為沒收到訊息）
               let targetOrigin = "*";
               document.getElementById(iframeId).contentWindow.postMessage(json, targetOrigin);
            //}, 1500);
         //});
         }
      }
   }
   
   function parseSpotlightCuesUnificationMapFile(s) {
      // 注意：ConfigVar.cuesUnificationMap[spotlight][cue] = mappedCue 中的 spotlight, cue, mappedCue 都是字串
      // # comment
      // m.ADY: 1064 => 1100
      // m.ADY: 1501..1600 => 1600
      // t.Udef_Evt_EVENT: 建|修|建修|修建 => construct

      if (s.charCodeAt(0) === 0xFEFF) s = s.substr(1);                   // remove utf-8 BOM
      let lines = s.split("\n").map(v => v.replace(/\s/g,'').trim());    // 或許不需最後的 trim()？
      
      ConfigVar.cuesUnificationMap = {};                                 // reset
      lines.forEach(function(line) {
         if (line.length == 0 || line.substr(0,1) == '#') return;        // empty or comment line
         let [key, mappedVal] = line.split("=>");
         let [spotlight, cuesStr] = key.split(':').map((v) => v.trim());
         mappedVal = mappedVal.trim();                                   // 注意，還是需要加上 trim()
         if (!ConfigVar.cuesUnificationMap[spotlight]) ConfigVar.cuesUnificationMap[spotlight] = {};

         let cues = cuesStr.split('|').map((v) => v.trim());             // e.g., "1201..1240|1241|1242..1250"
         cues.forEach(function(cue) {
            if (spotlight == 'm.ADY') {                                  // 目前僅 m.ADY 屬於數字型態的 cues
               let [startYear, endYear] = cue.split('..');               // e.g., "1201..1240"
               if (endYear === undefined) {
                  ConfigVar.cuesUnificationMap[spotlight][cue] = mappedVal;
               }
               else {
                  startYear = parseInt(startYear);
                  endYear = parseInt(endYear);
                  if (endYear < startYear) endYear = startYear;
                  let years = Array.from({length: endYear-startYear+1}, (_, i) => i + startYear);   // array of [startYear, sy+1, ..., endYear]
                  years.forEach(function(y) {
                     ConfigVar.cuesUnificationMap[spotlight][y.toString()] = mappedVal;
                  });
               }
               
            }
            else ConfigVar.cuesUnificationMap[spotlight][cue] = mappedVal;
         });
      });
      
      //alert(JSON.stringify(ConfigVar.cuesUnificationMap));
      
      // 2024-11-26
      $("#butLoadSpotlightCuesUnificationMapFile").removeClass("buttonStateChanged");
      if (Object.keys(ConfigVar.cuesUnificationMap).length > 0) {
         $("#butLoadSpotlightCuesUnificationMapFile").addClass("buttonStateChanged");
      }
   }
   
   // ------------------------------------------------------
   //         present and update filtered result
   // ------------------------------------------------------

   function presentFilteredResult(sortDocsBy, sortDocsOption = 'asc') {
      // 為了展示經計算後的 filtered result，需要處理一系列動作
      $("#divMainAreaTopBarDocked").show();
      $("#divMainArea").slideDown();
      showProgressMsg(sortDocsBy);             // 2025-11-18
      
      window.setTimeout(function() {
         updateMainAreaTopBar();
         updateSpotlightArea(sortDocsBy, sortDocsOption);     // 會設定 $("#sortDocsBy") 選單
         updateResultCorpusSizeAndPagination(sortDocsBy, sortDocsOption);

         // 2026-04-21: 加上 rendering 顯示
         showProgressMsg("rendering...");
         window.setTimeout(function() {
            updateContentTextAndEvents(true);
            hideProgressMsg();                                   // 2024-09-25: $("#butQueryGo").click() 按下後會顯示 progress
         }, 50); 
      }, 50);
   }
   
   function updateMainAreaTopBar() {
      // corpus select -- 不管是否有經過 filtering，結果都不會改變
      let corpusList = Object.keys(GlobalVar.docDict);
      let optionHtmlList = [];
      corpusList.forEach(function(corpus, idx) {
         let selected = (idx == 0) ? " selected='1'" : "";
         let s = "<option value='" + corpus + "'" + selected + ">" + corpus + "</option>";
         optionHtmlList.push(s);
      });
      $("#corpusSelect").html(optionHtmlList.join("\n"));
   }
   
   function updateSpotlightArea(sortDocsBy, sortDocsOption = 'asc') {
      // 注意：是以當前的 filtered result 來進行呈現
      // spotlightSelect, spotlightResult
      // GlobalVar.filteredResult.metadataDocsDict, GlobalVar.filteredResult.tagsDocsDict

      let corpus;
      if (GlobalVar.prevCorpus) {
         corpus = GlobalVar.prevCorpus;                                 
         $("#corpusSelect option[value='" + corpus + "']").attr("selected","selected");   // 必須加入這段
      }
      else {
         corpus = $("#corpusSelect option:selected").val();
         GlobalVar.prevCorpus = corpus;                                 // 2024-10-30
      }
      let corpusSettings = GlobalVar.corpusSettings[corpus];
      
      if (!corpusSettings) corpusSettings = { metadataFieldSettings:{},                   // 2024-11-12: 防呆
                                              featureAnalysis:{},
                                            };

      // 以下 spotlightSelect 選單，應該會需要跟著 filtered result 變化...
      let optionHtmlList = [];

      let metadataDocs = GlobalVar.filteredResult.metadataDocsDict[corpus] || {};    // 防呆：若 filteredDocFilenameList 為空集合， metadataDocsDict 將為 {}
      let metadataFields = Object.keys(metadataDocs);
      //alert(JSON.stringify(metadataFields));           // e.g., ["filename","TITLE","AU","ADY","CLASS","COMP","BC"]
      
      // 2024-11-01: 若額外加上 filename/docTitle，在此設定其顯示名稱
      let extraMetadataFieldsLabel = { 'filename': 'Document ID',
                                       'TITLE': 'Document Title',
                                       'COMP': 'Compilation',         // 2025-11-20
                                       'TP': 'Gazetteer',             // 2025-11-20
                                     };
      
      // 2025-11-06: 依照 DocuSky 規則應該按照 display_order 排序，但這裡直接用 label 排
      //             但已經將 display
      //alert(JSON.stringify(corpusSettings));
      if (Object.keys(corpusSettings.metadataFieldSettings).length > 0) {
         metadataFields.sort(function(a, b) {
            // 若 metadataField 為 'filename'，corpusSettings.metadataFieldSettings['filename'] := undefined
            //alert(a + "\n" + JSON.stringify(corpusSettings.metadataFieldSettings[a]));
            let ret = 0;
            if (GlobalVar.enableMetadataFieldDisplayOrder) {
               let x = corpusSettings.metadataFieldSettings?.[a]?.displayOrder || 0; 
               let y = corpusSettings.metadataFieldSettings?.[b]?.displayOrder || 0; 
               ret = x - y;
               //alert(a + ':' + b + ' ==> ' + ret);
            }
            else {
               let x = corpusSettings.metadataFieldSettings?.[a]?.label || extraMetadataFieldsLabel[a] || a;    // 2025-11-06
               let y = corpusSettings.metadataFieldSettings?.[b]?.label || extraMetadataFieldsLabel[b] || b;    // 2025-11-06
               ret = x.toLowerCase().localeCompare(y.toLowerCase());
            }
            return ret;
         });
      }
      //alert(JSON.stringify(metadataFields));
      
      metadataFields.forEach(function(mf, idx) {
         // mf := 'filename', 'AU' (author), 'ADY' (year_for_grouping, for year), 'TP' (topic, for data souorce), 'COMP' (compilation_name, for copy of Udef_DocMeta_Compilation), etc.

         // 2025-07-17: 隱藏 DocuSky「正常意義下的」metadata -- X-MARKUS 似乎只需要 tags 後分類（將 metadata 轉成 Udef_DocMeta_XXX 標籤）
         if (GlobalVar.hideNormalMetadataSpotlights) return;

         // 2026-03-20: 跳過「必須隱藏」的項目
         if (GlobalVar.hideMetadataSpotlightByField.includes(mf)) return;

         // 2025-10-24: 排除 mf == "filename" 和 mf == "TITLE" 
         //             注意 Comarkus 的 <title> 通常會是 sourceTitle + ': ' + pieceTitle 的形式，不怎麼合適進行後分類分析
         if (GlobalVar.spotlightSelectExcludedItems.includes(mf)) return;    // 預設排除 mf == 'TITLE'
         
         // 2025-02-01: 若 metadata 後分類列表只包含一項，就不顯示後分類
         let cueListHash = GlobalVar.filteredResult.metadataSpotlight[corpus][mf];
         let cuesCount = Object.keys(cueListHash).length;
         if (cuesCount <= 1) {
            //alert(JSON.stringify(cueListHash));
            if (GlobalVar.hideSpotlightWithSingleCue) return;
            //let spotlight = GlobalVar.prevSpotlight;   
            let spotlight = $("#spotlightSelect").find(":selected").val();         // e.g., undefined (initially), or "m.COMP"
            let cues = Object.keys(cueListHash);
            let notCurSpotlight = (spotlight!='m.'+mf);
            // 若設定「隱藏僅有一個 cue 且該 cue 為 '-'」，且檢查後確實滿足，則不顯示該 spotlight
            if (GlobalVar.alwaysHideMetaSpWithSingleUndefCue && notCurSpotlight && cues[0] == '-') return;   // metadata 後分類，若查詢結果不為空，就至少會有一個 cues
         }
         
         let selected = (idx == 0) ? " selected='1'" : "";
         
         // 2025-11-20: 合併新舊資料後，corpus settings 可能會有遺漏？
         //             例如新資料多了 '<compilation_name>' 但 <metadata_field_settings> 可能缺此項設定
         //             因此加上 '?'，改用 corpusSettings.metadataFieldSettings[mf]?.label 來防呆
         //if (!corpusSettings.metadataFieldSettings[mf]) alert("Missing metadata field settings: " + mf);
         let label = corpusSettings.metadataFieldSettings[mf]?.label || extraMetadataFieldsLabel[mf] || mf;    // 2024-11-01
         let extra = (GlobalVar.enableDocuTools && mf == 'ADY')      // 2024-11-12: 加上 EnableDocuSkyConnectivity
                   ? " style='color:red'"                            // 僅能在 <select> 和 <option> 上套用一些基本的樣式（如 color, font-size, background-color 等）
                   : "";                                             
         let t = GlobalVar.spotlightSelectAddCueCount 
               ? " (" + cuesCount + ")"                              // 2024-11-16: 加上 cuesCount
               : "";
         let s = "<option category='metadata' value='m." + mf + "'" + extra + selected + ">"    // 2025-01-24: 加入 category 屬性
               + label + t
               + "</option>";
         optionHtmlList.push(s);
      });
      //alert(JSON.stringify(optionHtmlList));
      
      // 2024-08-30
      // tagsDocsDict[corpus][tagName] = {v1:docFilenameList, v2:...}
      let tagDocs = GlobalVar.filteredResult.tagsDocsDict[corpus] || {};        // 防呆：若 filteredDocFilenameList 為空集合， tagsDocsDict 將為 {}
      let tagNames = Object.keys(tagDocs).sort();
      //alert(JSON.stringify(tagNames));
      
      tagNames.forEach(function(tn, idx) {
         if (!GlobalVar.spotlightSelectShowUdefEventElement && tn == "Udef_Event_Element") return;     // 2024-11-17
         if (!GlobalVar.spotlightSelectShowGenre && tn.match(/\.GenreL\d/)) return;                // 2025-01-18: Genre 現在會有 GenreL{n}
         
         let cuesCount = Object.keys(GlobalVar.filteredResult.tagsSpotlight[corpus][tn]).length;
         if (GlobalVar.hideSpotlightWithSingleCue) {
            if (cuesCount <= 1) return;                                         // tags 後分類有可能沒有 cues                                                               
         }
         
         let selected = ""; 
         let label = corpusSettings.featureAnalysis[tn] || tn;                  // 注意：目前 featureAnalysis[x] 應回傳 x (as an identity function)
         label = label.replace(/Udef_Evt_/, '*')
                      .replace(/Udef_properties_/, '^')
                      .replace(/Udef_DocMeta_/, '#');
         
         let extra = (GlobalVar.enableDocuTools && tn == 'Udef_Evt_LOCATION')   // 2025-02-12: GlobalVar.udefEvtTagsUseContentButNotRefIdAsCue?
                   ? " ' style='color:red'" 
                   : "";                                                        // 2024-09-28: 強調可啟動 DocuGIS Lite
         let t = GlobalVar.spotlightSelectAddCueCount 
               ? " (" + cuesCount + ")"                                         // 2024-11-16: 加上 cuesCount
               : "";

         // 2025-01-24: 將 tags 後分類進行歸類
         let category = 'text_tags';
         if (label.substring(0,1) == '*') {
            // Udef_Evt_INITIATOR, Udef_Evt_OBJECT_MAIN 等，都被歸屬於 txt_event_tree（可用 sub-menu 選擇要檢視哪個 Udef_Evt_ 標籤）
            category = (label.indexOf(".Genre") > 0) ? 'txt_evt_genre' : 'txt_event_tree';
         }
         else if (label.startsWith('^')) category = 'img_properties';             // 2025-03-09: '^' stands for ''Udef_properties_''
         else if (label.startsWith('#')) category = 'udef_docmeta';               // 2025-06-09
         else if (label == 'Udef_PieceTreePath') category = 'img_property_tree';
         else if (label.startsWith('Udef_Event_')) category = 'txt_evt_genre';        // Udef_Event_Element, Udef_Event_TimeSpan_100Y, etc.
         else if (label.startsWith('Udef_Genre_')) category = 'img_genre';        // 2025-11-29
         else if (label.startsWith('Udef_Align_')) category = 'align_evt_img';    // 2025-12-18: 若沒加入 align_evt_img，就會被放入預設的 text_tags
         else if (label.startsWith('Udef_Img_')) category = 'img_entity_tree';    // 2025-12-23: 額外加上 Udef_Img_EntityClass
  
         // 2026-03-20
         if (GlobalVar.hideTagSpotlightByCategory.includes(category)) return;     // 必須隱藏 Udef_Event_Element，否則會增加使用者混淆...
         
         let s = "<option category='" + category + "' value='t." + tn + "'" + extra + selected + ">" 
               + label + t
               + "</option>";                                                     // 2024-09-26
         optionHtmlList.push(s);
      });
      
      // 2024-11-08: xaDocsDict[corpus][tagName] = {v1:docFilenameList, v2:...}
      let xaDocs = GlobalVar.filteredResult.xaDocsDict[corpus] || {};     // 防呆：若 filteredDocFilenameList 為空集合， xaDocsDict 將為 {}
      let xaNames = Object.keys(xaDocs).sort();
      //alert(JSON.stringify(xaNames));
      
      xaNames.forEach(function(xn, idx) {
         let cuesCount = Object.keys(GlobalVar.filteredResult.xaSpotlight[corpus][xn]).length;
         if (GlobalVar.hideSpotlightWithSingleCue) {
            if (cuesCount <= 1) return;                                           // xa 後分類與 tags 後分類性質相同，有可能沒有 cues
         }
         let selected = "";
         let label = corpusSettings.featureAnalysis[xn] || xn;                    // 注意：目前 <Udef_XaSpotlight> 應不需在 <feature_analysis> 註冊？因此就是以 xn 作為 label
         let t = GlobalVar.spotlightSelectAddCueCount 
               ? " (" + cuesCount + ")"                                           // 2024-11-16: 加上 cuesCount
               : "";
         let s = "<option category='xa' value='x." + xn + "'" + selected + ">"    // 'xa' stands for 'XmarkusAnalyzer'
               + label + t
               + "</option>";                                                     // 2024-09-26
         optionHtmlList.push(s);
      });
      
      $("#spotlightSelect").html(optionHtmlList.join("\n"));
      
      
      // 將「所有」後分類選項都加入「sortDocsBy」，並在最前方額外加上 m.filename
      // 2025-10-24: 預設 sort by m.filename
      let mf = 'filename';
      let label = corpusSettings?.metadataFieldSettings?.[mf]?.label || extraMetadataFieldsLabel[mf] || mf;
      let s = "<option category='metadata' value='m." + mf + "'>"
            + label
            + "</option>";
      optionHtmlList.unshift(s);
      $("#sortDocsBy").html(optionHtmlList.join("\n"));
      
      // 2026-03-20: 「只」對 m.ADY 額外加上「ASC」、「DESC」排序的選項...
      if (GlobalVar.addSortOption2Year) {
         let jqOpt = $("#sortDocsBy").find("option[value='m.ADY']");
         let jqAsc = jqOpt.clone()
                          .val("m.ADY,ASC")
                          .text("Year (ASC)")
                          .removeAttr("selected");
         let jqDesc = jqOpt.clone()
                          .val("m.ADY,DESC")
                          .text("Year (DESC)")
                          .removeAttr("selected");
         jqOpt.after(jqDesc).after(jqAsc);
         jqOpt.remove();                 // 移除原本的（必須在執行 .after() 插入項目後）
      }

      // 隱藏非 metadata 項目，並指定當前選擇的項目
      $("#sortDocsBy option[category!='metadata']").hide();       // 只展現 metadata 後分類的選項
      $("#sortDocsBy").val(sortDocsBy);                           // 或者 $("#sortDocsBy option[value='" + sortDocsBy + "']").prop("selected",true).trigger("change");
      
      $("#sortDocsOption").val(sortDocsOption);
      
      // 2025-01-24: #spotlightCatSelect
      let catList = [];                    // 可以是 ['ALL'] or []
      $("#spotlightSelect option[category]").each(function() {
         let category = $(this).attr("category");
         if (!catList.includes(category)) catList.push(category);
      });
      //alert(JSON.stringify(catList));
      
      let catOptionHtmlList = [];
      catList.forEach(function(cat) {
         if (GlobalVar.skipSpotlightCat.includes(cat)) return;     // 2025-11-30: 略過哪些 spotlightCat 項目
         let s = "<option value='" + cat + "'>" + cat + "</option>";
         catOptionHtmlList.push(s);
      });
      
      //// 2025-11-30: 若要對 spotlightCatSelect 項目進行排序，接下來必須找到 "metadata" 項目並將 selected 設為 true
      ////             => 或者，對每種項目設個次序，例如 metadata:1, text_tags:2, txt_event_tree:3
      ////                udef_docmeta:11, img_genre:12, img_property_tree:13, img_properties:14
      ////
      //catOptionHtmlList.sort(function(a,b) {
      //   let x = $("<p/>").append(a).find("option").text();
      //   let y = $("<p/>").append(b).find("option").text();
      //   return x.localeCompare(y);
      //});
      
      $("#spotlightCatSelect").html(catOptionHtmlList.join("\n"));
      
      $("#spotlightCatSelect").val(GlobalVar.prevSpotlightCat).change();

      // 2024-09-30: filtered spotlight result
      if (catOptionHtmlList.length > 0) {         // 2025-02-13 (bug fix)
         // 2025-01-24: UI 必須設回原先的 prevSpotlightCat 和 prevSpotlight
         let spotlightCat = GlobalVar.prevSpotlightCat;
         let selector = "#spotlightCatSelect option[value='" + spotlightCat + "']";
         if ($(selector).length > 0) $(selector).prop("selected",true).trigger("change");
         else {
            // 2025-02-13: 防呆（剛載入時，預設是 'ALL'，但可能 catList 並不包含 'ALL'）
            selector = "#spotlightCatSelect option:first";
            $(selector).prop("selected",true).trigger("change");
         }
         
         window.setTimeout(function() {
            let spotlight;
            if (GlobalVar.prevSpotlight) {
               spotlight = GlobalVar.prevSpotlight;                  
               //alert(spotlight);            
               $("#spotlightSelect option[value='" + spotlight + "']").prop("selected",true).trigger("change");    // 2025-02-07: 必須加入 trigger()
            }
            else {
               // 2025-02-27: 剛載入 DocuXml 時沒有 prevSpotlight（或 prevSpotlightCat 是 'ALL' 卻被隱藏時？）
               //             若 spotlight 選單包含 Udef_Evt_EVENT 就自動切到這個項目，否則就切到第一個項目
               //let preferredSelect = 'Udef_Evt_EVENT';                                      // 2025-02-27
               //selector = "#spotlightSelect option[value='" + preferredSelect + "']";
               //if ($(selector).length == 0) selector = "#spotlightSelect option:first";     // 2025-02-27
               let selector = "#spotlightSelect option:first";     // 2025-02-27
               $(selector).prop("selected", true);
               spotlight = $("#spotlightSelect option:selected").val();
            }
            
            //alert("call displayCurSpotlightCues #1");
            displayCurSpotlightCues(corpus, spotlightCat, spotlight, null);          // sortOption 傳入 null：排序方式，由該函式決定
         }, 100);
      }
      else {                                                                      // 防呆：此文獻集的篩選結果可能是空集合
         $("#spotlightCuesList").empty();
      }
   }
   
   function displayCurSpotlightCues(corpus, spotlightCat, spotlight, sortOption = null) {            // 2025-02-11: 加入 spotlightCat
      // 顯示當前 spotlight 的 cues 列表
      // 2025-01-18: 防呆 -- 若使用者有兩篇「相同 filename，卻分屬不同 corpus」文件，可能造成其中之一（先出現在 DocuXml 的會被覆蓋）在顯示上變成空值...      
      //             一般使用不應出現這種狀況，因此除了防呆，也不另行擴增 XA 的錯誤處理程式了
      //alert("update spotlight cues -- " + spotlight);                // e.g., m.filename, t.Udef_Event_Element
      if (!spotlight) return;
      
      if (!GlobalVar.enableDocuTools) {
         $("button.docuskyVizTool, span.docuskyVizTool").hide();     // 隱藏所有連到 DocuSky 的按鈕
      }
      
      // 2024-09-01: 注意需用 window.DocuSkyHost（僅用 DocuSkyHost 會跑出未定義錯誤）
      //             if (EnableDocuSkyConnectivity && window.DocuSkyHost) ...
      // (TODO) not implemented
      
      if (GlobalVar.enableDocuTools) {                            // 2024-11-12: 改由 GlobalVar.enableDocuTools 控制
         let cuesAsTree = false;
         if (displayedAsTree(spotlightCat)) cuesAsTree = true;
         if (!cuesAsTree) $("#butWordCloudLite").show();          // 只有在非 tree 的狀況，才適合用 word cloud (內含 top-10 bars)
         
         // 目前僅有 m.ADY 和 t.Udef_Evt_LOCATION 會驅動特定的 viz tools
         if (spotlight == "m.ADY") {
            $("#butYearStatsLite").show();
         }
         else if (spotlight == "t.Udef_Evt_LOCATION") {               // "Event Place" 並未提供 geo-code，因此無法使用 GIS
            $("#butDocuGisLite").show();
         }
      }

      // ----------------------------------------------------------------------------------------------------------------------
      // 2025-02-12: 為了讓 docuTools 能夠透過 spotlightTable 取得 cues，不管是否呈現為 event tree 都一樣產生 spotlightTable
      const cuesMoveToLast = ['-', '-9999', '9999'];                  // 移到列表最下方
      let matches = spotlight.match(/^(m|t|x)\.(.+)$/);               // 2024-11-08: 改 m|t|x
      if (matches) {   
         let [dummy, spType, spVal] = matches;
         if (spType == "m") {
            // metadata 後分類 -- 目前僅 ADY 需 sortByCuesAsIntAsc（可考慮 TNA, TNB？）
            if (spVal == 'ADY') {
               if (!sortOption) sortOption = 'sortByCuesAsIntAsc';              // 將 cue 轉換成整數（例如年份）進行排序
               updateCurMetadataSpotlight(corpus, spVal, sortOption, cuesMoveToLast);
            }
            else {
               if (!sortOption) sortOption = 'sortByValsDesc';                  // default
               updateCurMetadataSpotlight(corpus, spVal, sortOption, ['-']);    // 2026-03-31: 從 cuesMoveToLast 改 ['-']
            }
         }
         else if (spType == 't') {
            // tags 後分類
            if (!sortOption) sortOption = 'sortByValsDesc';                     // default
            updateCurTagsSpotlight(corpus, spVal, sortOption, ['-']);           // 2026-03-31: 從 cuesMoveToLast 改 ['-']);
         }
         else if (spType == 'x') {
            // 2024-11-08: 擴增的 <Udef_XaSpotlight>
            if (!sortOption) sortOption = 'sortByValsDesc';                     // default
            updateCurXaSpotlight(corpus, spVal, sortOption, ['-']);             // 2026-03-31: 從 cuesMoveToLast 改 ['-']);
         }
         else alert("Error: unknown spType '" + spType + "'");
      }
      else alert("invalid spotlight option: " + spotlight);
         
      // 2025-02-12: 因應 spotlightCat 以 simple list 或 treejs 顯示
      // 2025-03-13: 加入 property_tree (2026-01-25 改 img_property_tree)
      // 2025-12-23: 加入 GlobalVar.spotlightCatWithTreeUi (注意在點擊後 $("#butApplySpotlightCuesFilter).click() 也需進行判斷)
      // => 也可僅對特定 spotlight 套用 tree ui（目前是 spotlightCatWithTreeUi 下的所有 spotlights 都套用 tree ui）
      if (GlobalVar.spotlightCatWithTreeUi.includes(spotlightCat) ||
          (GlobalVar.showTagSpotlightCuesAsTree && GlobalVar.prevSpotlightCat == 'text_tags')) {
         displaySpotlightTreeJs(corpus, spotlightCat, spotlight);
      }
      else {
         $("#spotlightCuesList").show();
         $("#spotlightCuesTreeJs").hide();
      }
   }
   
   function displayedAsTree(spotlightCat) {
      let isEventTree = (spotlightCat === 'txt_event_tree');            // && GlobalVar.udefEvtTagsUseContentButNotRefIdAsCue ?
      let isTagSpotlightTree = (GlobalVar.showTagSpotlightCuesAsTree && spotlightCat === 'text_tags');
      let isPropertyTree = (spotlightCat === 'img_property_tree');
      return (isEventTree || isTagSpotlightTree || isPropertyTree);
   }
   
   function displaySpotlightTreeJs(corpus, spotlightCat, spotlight) {
      // 2025-02-12
      // e.g., spotlight := 't.Udef_Evt_EVENT:CONSTRUCTION/build/作興|...'
      //alert(spotlight);
      $("#spotlightCuesList").hide();
      $("#spotlightCuesTreeJs").show();

      let matches = spotlight.match(/^(m|t|x)\.(.+)$/);               // 2024-11-08: 改 m|t|x
      if (!matches) {
         alert("Unknown spotlight: " + spotlight);
         return;
      }
      let [dummy, spType, tagName] = matches;
      let spotlightData = GlobalVar.filteredResult.tagsSpotlight[corpus][tagName];
      //console.log(spotlightData);

      // tags 後分類和 metadata 後分類，在顯示上有一些差異（tags 額外有 terms，即使此專案不需 tf）
      let cueValArray = getTagSpotlightCueArray(spotlightData);     // [{"cue":"RENOVATION/rebuild/更新","val":1,"terms":["更新"]},...]
      sortSpotlightCuesByKeysAsc(cueValArray, ['-', '-9999', '9999']);
      //console.log(cueValArray);
      
      // 2025-07-18: 利用 X.GenreL{n} 進行樹狀結構節點的文件數計算
      let allLevelSpotlightDict = {};
      if (GlobalVar.enableTreeNonLeafFreq) {
         const maxLevel = 3;                  // L1..L3 -- 實務上 Comarkus 僅需 L1,L2 兩層（最後一層和原標籤相同）
         for (let i=1; i<=maxLevel; i++) {
            let genreTag = tagName + '.GenreL' + i;
            let levelData = GlobalVar.filteredResult.tagsSpotlight[corpus][genreTag];
            if (!levelData) break;           // 若沒有 L{n} 這個階層，也不會有 L{n+1}
            Object.keys(levelData).forEach(function(cue) {
               allLevelSpotlightDict[cue] = levelData[cue].freq;
            });
         }
      }
      //alert(tagName + "\n" + JSON.stringify(allLevelSpotlightDict));
         
      //let treeData = [
      //  {
      //    id: '0',
      //    text: 'node-0',
      //    children: [
      //      {
      //        id: '0/0',
      //        text: 'node-0-0',
      //        children: [
      //          {id: '0/0/0', text: 'node-0-0-0'},
      //          {id: '0/0/1', text: 'node-0-0-1'},
      //          {id: '0/0/2', text: 'node-0-0-2'},
      //        ],
      //      },
      //      {id: '0/1', text: 'node-0-1'},
      //    ],
      //  },
      //];
      
      treeData = convertCueValArray2TreeData(cueValArray, allLevelSpotlightDict);
      //console.log(cueValArray);
      //console.log(treeData);
      
      //alert("new jstree");
      GlobalVar.treeJsObj = new Tree('#spotlightCuesTreeJs', {
         data: treeData,
         closeDepth: 1,              // 僅展開第一層（但點擊打開後，會自動展開該層下的所有節點... 好像沒辦法一層一層展開？）
         loaded: function() {
            //this.values = ["bridge_worker/橋夫","bridge_worker/波子"];        // e.g., initally checked ids ["RENOVATION/build/砌","RENOVATION/build/肇建","RENOVATION/build/興作","RENOVATION/build/鼎建"]
            //this.values = ["bridge_worker/橋夫"];
            //this.values = ["bridge_worker"];
            //this.values = [];
            //alert("TreeJs Loaded ==> " + JSON.stringify(GlobalVar.prevCueList));
            this.values = GlobalVar.prevCueList;            // 2025-02-15
         },
      });
   }
   
   function convertCueValArray2TreeData(cueValArray, allLevelSpotlightDict) {
      // convert path array to treeData object
      // cueValArray := [ { cue, val, terms}, {cue, val, terms}, ...]
      //       terms := [ term, term, ...]
      // => treeData (注意，並不需根節點) is an array of subtrees, each subtree is an object
      //    { id, text, children } where children is an array of subtrees
      // 2025-07-18: 加上 allLevelSpotlightDict

      // 2024-01-13: 以下程式來自於 ChatGPT，然後再進行一些修改
      const tree = [];
      cueValArray.forEach(cueVal => {
         let current = tree;
         
         // 2025-07-20: 由於 cue 不允許出現冒號，因此若值為 url，前處理已經將 cue 篩成剩下 http 或 https
         //             因此，其實可以直接用 path = cueVal.cue.split('/') -- 但還是先保留 url 的處理方式
         //let path = cueVal.cue.split('/');
         const parts = cueVal.cue.split("/");
         const httpIndex = parts.findIndex(part => part.startsWith("http"));      // 找出以 http 或 https 開頭的位置
         const path = [ ...parts.slice(0, httpIndex),                             // 前面的是 prefix，從 httpIndex 開始的是 URL
                        parts.slice(httpIndex).join("/")
                      ];
         //alert(JSON.stringify(path));

         path.forEach((nodeCue, index) => {
            // 透過 nodeId 比對 current (tree) 陣列的 element id，查找節點是否存在於當前層級
            let nodeId = path.slice(0,index+1).join('/'); 
            let existingNode = current.find(item => item.id === nodeId);
            
            // 如果節點不存在，則創建新的節點
            if (!existingNode) {
               let text = nodeCue;                            // treejs 是用 text 而非 label
               text = text.replace(/^markus_/,'#');           // 將 prefix "markus_" 取代為 '#' （仍然保留 symbol '#' 以便除錯）
               if (index === path.length - 1) {               // leaf node
                  text += " (" + cueVal.val + ")";
               }
               else {
                  // 2025-07-18: 非葉節點（其實葉節點應也 OK），可利用 nodeId (e.g., A/B) 從某個 allLevelSpotlightDict[nodeId] 取得 freq 數據，就可在每一層都加上「該 nodeId 可檢索到得的文件數」...
                  let freq = allLevelSpotlightDict[nodeId];
                  if (freq) text += " (" + allLevelSpotlightDict[nodeId] + ")";
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

   function updateCurMetadataSpotlight(corpus, metadataField, sortOption, cuesMoveToLast) {
      // GlobalVar.filteredResult.metadataSpotlight[corpus][mfield][cue] = { filenames:[...], freq:n }
      // 藉由 metadataSpotlight 即可取得 cue 的文件數，以及相關的文件
      let spotlightData = GlobalVar.filteredResult.metadataSpotlight[corpus][metadataField];
      //alert(JSON.stringify(spotlightData));
      
      let cueValArray = [];
      for (let cue in spotlightData) {
         let val = spotlightData[cue].freq;              // 2024-09-02
         cueValArray.push({cue,val});
      }
      
      // 注意：呼叫排序函式後，傳入的 cueValArray 內容會被更新
      if (sortOption == 'sortByCuesAsc') sortSpotlightCuesByKeysAsc(cueValArray, cuesMoveToLast);
      else if (sortOption == 'sortByCuesAsIntAsc') sortSpotlightCuesByKeysAsIntAsc(cueValArray, cuesMoveToLast);
      else if (sortOption == 'sortByValsDesc') sortSpotlightCuesByValsDesc(cueValArray, cuesMoveToLast);    
      else alert("Unknown sort option: " + sortOption);
      //alert(JSON.stringify(cueValArray));
      
      let spotlightResultHtml = getSpotlightResultHtml(cueValArray, 'm.' + metadataField);
      updateSpotlightResultHtml('m', corpus, metadataField, spotlightResultHtml, cuesMoveToLast);
   }
   
   function updateCurTagsSpotlight(corpus, tagName, sortOption, cuesMoveToLast) {
      // 2024-08-31
      // tags: GlobalVar.filteredResult.tagsSpotlight[corpus][tagName]
      let spotlightData = GlobalVar.filteredResult.tagsSpotlight[corpus][tagName];
      //alert(JSON.stringify(spotlightData));

      // tags 後分類和 metadata 後分類，在顯示上有一些差異（tags 額外有 terms，即使此專案不需 tf）
      let cueValArray = getTagSpotlightCueArray(spotlightData);

      // 對 tags 後分類而言，並沒有「年代分佈圖」需考慮依照 cues 年份排序，但還是有數種可能
      if (sortOption == 'sortByCuesAsc') sortSpotlightCuesByKeysAsc(cueValArray, cuesMoveToLast);    
      else sortSpotlightCuesByValsDesc(cueValArray, cuesMoveToLast);    
      
      let spotlightResultHtml = getSpotlightResultHtml(cueValArray, 't.' + tagName);
      updateSpotlightResultHtml('t', corpus, tagName, spotlightResultHtml, cuesMoveToLast);
   }
   
   function updateCurXaSpotlight(corpus, xaName, sortOption, cuesMoveToLast) {
      // 2024-11-08
      // xa: GlobalVar.filteredResult.xaSpotlight[corpus][xaName]
      let spotlightData = GlobalVar.filteredResult.xaSpotlight[corpus][xaName];
      //alert(JSON.stringify(spotlight));

      // tags 後分類和 metadata 後分類，在顯示上有一些差異（tags 額外有 terms，即使此專案不需 tf）
      let cueValArray = getTagSpotlightCueArray(spotlightData);
      
      // 對 tags 後分類而言，並沒有「年代分佈圖」需考慮依照 cues 年份排序，但還是有數種可能
      if (sortOption == 'sortByCuesAsc') sortSpotlightCuesByKeysAsc(cueValArray, cuesMoveToLast);    
      else sortSpotlightCuesByValsDesc(cueValArray, cuesMoveToLast);    
      
      let spotlightResultHtml = getSpotlightResultHtml(cueValArray, 'x.' + xaName);
      updateSpotlightResultHtml('x', corpus, xaName, spotlightResultHtml, cuesMoveToLast);
   }
   
   function getTagSpotlightCueArray(spotlightData) {
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
         let unescapedCue = unescapeHtml(cue);       // 2026-01-22: 原始的 cue 有經過 escapeHtml() 以方便檢錯，樹狀顯示時轉回未 escape 的字串
         cueValArray.push({cue:unescapedCue,
                           val,
                           terms});                  // 注意，此 cueValArray 的元素多了 terms
      }
      return cueValArray;      
   }
   
   function getSpotlightResultHtml(cueValArray, spotlight) {
      // spotlight 的 cues 列表 (list of spotlight cues)
      let cueHtmlList = [];
      cueHtmlList.push("<table class='spotlightTable'>");
      let s = "<tr class='spotlightSortBar'>"
            + "<th class='chk' title='sort by checked items'><i id='sortCuesByCheckedAsc' class='fa-solid fa-arrow-up'></i></th>"
            + "<th class='cue' title='sort by cues ASC'><i id='sortCuesByKeyAsc' class='fa-solid fa-arrow-up'></i></th>"
            + "<th class='val' title='sort by counts DESC'><i id='sortCuesByValDesc' class='fa-solid fa-arrow-down'></i></th>"
            + "</tr>";
      cueHtmlList.push(s);
      
      cueValArray.forEach(function(v, idx) {
         let rowClass = ((idx+1) % 10 == 0) ? "class='cueRow bottomLine'" : "class='cueRow'";
         
         // 2024-11-01: 若 v.terms 和 v.cue 相同，就不需顯示 v.terms 了...
         // 2025-02-22: (bug fix) v.vue 已將空白置換為底線，但在此 v.terms 卻可能包含空白... 因此還需將空白置換掉
         let terms = (v.terms) 
                   ? v.terms.map((v) => v.split(';').map((w) => w.trim().replace(/[ ]/g,'_')).join('/')).join(', ')
                   : '';
                  
         // 2025-01-18: Udef_Evt_xxx.GenreL{n} 常出現 v.cue := "CONSTRUCTION/架"，terms := "架" 形式
         let cueParts = v.cue.split('/');
         let lastPart = cueParts.pop();
         
         // 2026-03-16: Hilde 希望 t.Udef_Align_bridge_ID 等後分類「僅顯示同時包含 Event 和 Image 兩種 types」的 cues
         let isAlignObjId = (spotlight.startsWith("t.Udef_Align_") && spotlight.endsWith("_ID"));               // Udef_Align_XXX_ID
         let alignObjHideCueWithSingleType = isAlignObjId &&
                                             ConfigVar.onlyShowAlignObjIdCueWithMultiTypes &&
                                             !StateVar.ctrlPressed;            // 並未按下 Ctrl 鍵
                                             
         // 2024-12-23: 加上 spotlight 判斷, 2025-01-18: 加上 lastPart
         //             一般 cue 的狀況下，按下 ctrl 才會隱藏 extra info（與 isAlignObjId 相反！）
         let cueAddExtraInfo = (terms && terms!=v.cue && terms!=lastPart) &&
                               spotlight!='t.Udef_Event_Element' &&
                               ((isAlignObjId && StateVar.ctrlPressed) || (!isAlignObjId && !StateVar.ctrlPressed));
                              
         let cueExtraInfo = '';
         if (cueAddExtraInfo) {
            cueExtraInfo = "<span class='cueTerms'> (" + terms + ")</span>";
         }
         
         let s = "<tr " + rowClass + ">"
               + "<td class='chk'>" + "<span class='chk'>" + "<input type='checkbox' name='chk_" + idx + "'></input></span></td>"
               + "<td class='cue'>" + "<span class='cue'>" + v.cue + "</span>" + cueExtraInfo + "</td>"
               + "<td class='val'>" + "<span class='val'>" + v.val + "</span> " 
               + "</td></tr>";
                  
         // 2026-03-15: 檢查 spotlight 是否為 t.Udef_Align_{obj}_ID
         if (alignObjHideCueWithSingleType && terms.split(',').length <= 1) {
             ;              // 只有 Event 或 Image -- 跳過這個項目不顯示
         }
         else cueHtmlList.push(s);
      });
      cueHtmlList.push("</table>");
      
      return cueHtmlList.join("\n");
   }
   
   function updateSpotlightResultHtml(type, corpus, field, spotlightResultHtml, cuesMoveToLast) {
      // 2024-08-31: 獨立出來，metadata 和 tags 後分類都可以呼叫
      $("#spotlightCuesList").html(spotlightResultHtml);
      
      // 2025-01-22: 總感覺並沒有想清楚 GlobalVar.prevCueList 的設定和清除的時機... （low priority，暫時先不管了）
      //if (Array.isArray(GlobalVar.prevCueList)) {
         $("#spotlightCuesList").find("table.spotlightTable td span.cue").each(function() {
            if (GlobalVar.prevCueList.includes($(this).text())) {
               $(this).closest("tr").find("span.chk input").prop("checked", true);
            }
         });
      //}
      
      // 2024-11-21: 注意，以下「按排序鍵」的處理方式，是直接在 UI 介面透過 checked items 排序
      //             也就是說，不是透過 updateCurMetadataSpotlight() 或 updateCurTagsSpotlight() 以 data model 排序
      $("#sortCuesByCheckedAsc").click(function() {
         // <table class='spotlightTable'>
         // <tr><th>...</th></tr>
         // <tr class='cueRow'><td class='chk'>...</td><td class='cue'>...</td><td class='val'>...</td></tr>
         // </table>
         
         // 以下參考 ChatGPT 提供的排序程式碼
         let rows = $('#spotlightCuesList table.spotlightTable tr.cueRow').get();     // tr 將包含第一列 th，因此需用 tr.cueRow
         
         rows.sort(function(a, b) {
            let checkedA = $(a).find("input").is(":checked") ? 1 : 0;
            let checkedB = $(b).find("input").is(":checked") ? 1 : 0;
            return checkedB - checkedA;                
         });
         
         // 將排序後的 tr 重新附加到 table（注意，不需先用 remove() 移除 rows）
         $.each(rows, function(index, row) {
            $('#spotlightCuesList table.spotlightTable').append(row);
         });
      });
      
      $("#sortCuesByKeyAsc").click(function() {
         // 2024-11-22
         let rows = $('#spotlightCuesList table.spotlightTable tr.cueRow').get();     // tr 將包含第一列 th，因此需用 tr.cueRow
         rows.sort(function(a, b) {
            let cueA = $(a).find('td').eq(1).text();
            let cueB = $(b).find('td').eq(1).text();
            if (cuesMoveToLast.includes(cueA)) return 1;           // +1: move x afer y
            else if (cuesMoveToLast.includes(cueB)) return -1;     // -1: move x before y
            else {
               // 2025-02-23: 若 cueA 和 cueB 的第一個字元都是 '-'，則將其解讀為補零後的數字，
               //             例如 -1000, -0100, -0010，此時 '-' 後面依照降冪排序
               if (cueA.charAt(0) === '-' && cueB.charAt(0) === '-') {
                  return cueB.localeCompare(cueA);                 // 降冪（但因為是負數，從數量看是升冪）
               }
               else return cueA.localeCompare(cueB);               // 升冪
            }
         });
         
         // 將排序後的 tr 重新附加到 table（注意，不需先執行 .remove() 移除）
         $.each(rows, function(index, row) {
            $('#spotlightCuesList table.spotlightTable').append(row);
         });
      });
      
      $("#sortCuesByValDesc").click(function() {
         // 2024-11-22
         let itemsMoveToLast = (type == 'm') ? [] : cuesMoveToLast;
         let rows = $('#spotlightCuesList table.spotlightTable tr.cueRow').get();     // tr 將包含第一列 th，因此需用 tr.cueRow
         
         rows.sort(function(a, b) {
            let cueA = $(a).find('td').eq(2).text();
            let cueB = $(b).find('td').eq(2).text();
            if (itemsMoveToLast.includes(cueA)) return 1;           // +1: move x afer y
            else if (itemsMoveToLast.includes(cueB)) return -1;     // -1: move x before y
            let result = parseInt(cueB) - parseInt(cueA);           // 降冪
            return result;
         });
         
         // 將排序後的 tr 重新附加到 table（注意，不需先執行 .remove() 移除）
         $.each(rows, function(index, row) {
            $('#spotlightCuesList table.spotlightTable').append(row);
         });
      });
      
      $("table.spotlightTable tr.cueRow td.cue").off("click").on("click", function(evt) {          // 只有 click cue 時才觸發
         // 2024-10-01
         let spotlight = $("#spotlightSelect option:selected").val();
         let cue = $(this).find("span.cue").text().trim();
         
         //let curQuery = $("#queryFilter").val().trim();
         //let q = escapeSpotlightCue(spotlight + ':' + cue) + (curQuery ? ' ' + curQuery : '');
         //$("#queryFilter").val(q);
         
         // 2025-07-18
         let filter = spotlight + ':' + cue;
         if (GlobalVar.enableQueryWithCorpus && GlobalVar.corpusCount > 1) {
            filter = GlobalVar.prevCorpus + '>' + filter;    // 2025-07-25: 注意尚未經過測試...
         }
         
         addQueryFilterAndGo(filter);       // 2025-10-25: (bug fix) 該函式最後會執行 $("#butQueryGo").click();

         // 2024-09-30: 有別於使用者自己點選 #butQueryGo，透過後分類篩選，應將 corpus/spotlight 切回篩選時的位置
         $("#corpusSelect").val(GlobalVar.prevCorpus);
         $("#spotlightCatSelect").val(GlobalVar.prevSpotlightCat).trigger("change");   // 2025-01-25
         GlobalVar.prevCueList = [ cue ];                                                              // 2025-01-22
         $("#spotlightSelect").val(GlobalVar.prevSpotlight).trigger("change");         // 2025-01-22: 加入 trigger
      });
   }

   function updateResultCorpusSizeAndPagination(sortDocsBy, sortDocsOption = 'asc') {
      if (!sortDocsBy) sortDocsBy = 'm.filename';    // 防呆
      // 僅考慮當前 corpus 下的文件
      let corpus = GlobalVar.prevCorpus;             // 2024-10-30
      
      // 2025-01-18: 啊... 原來 corpus size 指的是 filtered result size 在當前 corpus 下的大小...
      //             因此 filteredSize 會大於等於 corpusSize 
      //let corpusOrigSize = Object.keys(GlobalVar.docDict[corpus]).length;
      //$("#corpusSize").text(corpusOrigSize);
      
      $("#sortDocsBy").val(sortDocsBy);
      
      // 2025-10-24: 依照 sortDocsBy 選項排序...
      // cf. GlobalVar.docDict[corpus][filename].metadata[mfield]
      //     GlobalVar.filteredResult.metadataSpotlight[corpus][mfield][cue] = { filenames:[...], freq:n }

      // 2026-03-16: 加上 ASC, DESC
      let [sortField, sortOrder] = sortDocsBy.split(',');
      if (!sortOrder) sortOrder = sortDocsOption;
      
      let [spotlightType, spotlight] = sortField.split('.');     // e.g., m.filename, m.AU
      if (!spotlight) spotlight = 'filename';
      let curDocDict = GlobalVar.docDict[corpus];
      
      let filteredDocFilenameList = GlobalVar.filteredResult.filteredDocFilenameList;
      //filteredDocFilenameList.sort();
      //filteredDocFilenameList.sort().reverse();
      
      // 2025-12-09: 相較於 Firefox，Chromium 對以下 sort() 似乎需頗長的時間...
      // 預設是 ASC 排序（注意，是利用 sortField 而非 sortDocsBy 判斷）
      if (sortField == 'm.filename') filteredDocFilenameList.sort();
      else {
         filteredDocFilenameList.sort(function(a,b) {
            let v;
            let a1 = curDocDict[a]?.metadata[spotlight] || '-';          // 2025-11-14: 改為 '?.' 以防呆
            let b1 = curDocDict[b]?.metadata[spotlight] || '-';          // 若 metdata 未定義，先設為 '-'，再取代為「龘」以讓它排在最後方
            if (['m.ADY','m.TNA','m.TNB'].includes(sortField)) {         // ADY（和「未來可能的」TNA,TNB）加上 padding-zero 便於排序
               if (a1 == '-') a1 = 9999;
               if (b1 == '-') b1 = 9999;
               a1 = parseInt(a1);                                        // 注意，在此轉成 integer 比較
               b1 = parseInt(b1);
               v = (a1 - b1);
            }
            else {
               if (a1 == '-') a1 = '龘';
               if (b1 == '-') b1 = '龘';
               v = a1.localeCompare(b1);          // 2025-12-09: 因 Chromium 對較長字串的排序相當慢，因此不採 x = a1 + ':' + a; （會讓字串更長）的比較方式
               if (v == 0) v = a.localeCompare(b); 
            }
            return v;            
         });
      }
      //alert(JSON.stringify(filteredDocFilenameList));
      
      // 2026-03-16
      if (sortOrder.toLowerCase() == 'desc') filteredDocFilenameList = filteredDocFilenameList.reverse();

      //let corpusJqDocFilenameHash = GlobalVar.filteredResult.corpusJqDocFilenameHash;
      //let resultCorpusSize = (corpusJqDocFilenameHash[corpus] ? corpusJqDocFilenameHash[corpus].length : 0);     // 防呆
      //console.log(corpusJqDocFilenameHash);
      //alert(JSON.stringify(Object.keys(corpusJqDocFilenameHash)));
      
      let resultCorpusSize = filteredDocFilenameList.length;
      $("#corpusSize").text(resultCorpusSize);

      let dataSource = [...Array(resultCorpusSize).keys()];     // [0, 1, 2, ..., n-1]
      GlobalVar.curResultSize = dataSource.length;              // 2024-09-06
      GlobalVar.curPageDocs = resultCorpusSize;                 // 先預設為 resultCorpusSize
      
      let paginationId = 'paginationContainer';
      showPagination(paginationId, dataSource);
   }

   function updateContentTextAndEvents(scrollToTop = true) {
      // 2024-08-27: update documents under current corpus and pageNumber
      let corpus = GlobalVar.prevCorpus;     // 2024-10-30
      let pageNumber = GlobalVar.curPageNumber;

      let corpusList = Object.keys(GlobalVar.filteredResult.corpusJqDocFilenameHash);
      let corpusJqDocFilenameHash = GlobalVar.filteredResult.corpusJqDocFilenameHash[corpus];    // 當前 corpus 內容
      //alert(corpus + "\n" + JSON.stringify(corpusJqDocFilenameHash));
      
      // 2025-11-05: 注意新版中，spotlightTermsObj 是個物件，但 fulltextTerms 仍是 array
      let spotlightTermsObj = GlobalVar.filteredResult.queryTermsInfo.spotlightTermsObj;         // 2025-11-05: 改為 object，spotlightTermsObj[udefTag] = terms
      let fulltextTerms = GlobalVar.filteredResult.queryTermsInfo.fulltextTerms;                 // 注意，其 element 可能為 "a|b" 形式
      
      const pageSize = GlobalVar.pageSize;           // 2025-07-17
      let corpusFilteredSize = GlobalVar.filteredResult.filteredDocFilenameList.length;
      let docHtmlList = [];

      for (let i=0; i<pageSize; i++) {
         let docNumber = (pageNumber-1) * pageSize + (i+1);          // 注意：docNumber 從 1 到 corpusJqDocFilenameHash[corpus].length
         if (docNumber > corpusFilteredSize) continue;
         
         // 2025-10-24: 取出 (sorted) filteredDocFilenameList 的第 n 篇（這些可能在不同 corpus 下！）
         let docFilename = GlobalVar.filteredResult.filteredDocFilenameList[docNumber-1];

         // 2025-11-25: 在 multiple corpuses 的狀況下，需遍歷所有 corpuses 才能找到 jqDoc
         let jqDoc = null;
         corpusList.forEach(function(myCorpus) {
            let corpusJqDocHash = GlobalVar.filteredResult.corpusJqDocFilenameHash[myCorpus];    // 當前 corpus 內容
            if (corpusJqDocHash[docFilename]) jqDoc = corpusJqDocHash[docFilename];              // 若找不到，corpusJqDocHash[docFilename] := undefined
         });
         if (jqDoc === null) {
            alert("Error: cannot find '" + docFilename + "'");
            continue;
         }
         
         let jqClone = jqDoc.clone();                                // 在 clone 上操作，避免修改到原始的 jqDoc 內容
         let jqContentNodes = jqClone.find("doc_content,Content"); 

         jqContentNodes.each(function(contentIdx) {                  // should be exactly one node
            let jqContentNode = $(this);
            let s = getDocContentHtml(jqContentNode, docNumber, docFilename, spotlightTermsObj, fulltextTerms);
            docHtmlList.push(s);
         });
      }
   
      // 2024-11-15: 若原先 td.docEvents 是隱藏狀態，更新內容後依然需將其隱藏
      let hasEvents = ($("td.docEvents").length > 0);
      let curEventsVisible = (hasEvents)
                           ? $("td.docEvents").first().is(":visible")
                           : true;                 // 例如剛讀入的狀態
      $("#contentTable").html(docHtmlList.join("\n"));
      
      if (!curEventsVisible) $("td.docEvents").hide();
      if (GlobalVar.enableDocumentBag) {
         $("div.docTitle").each(function() {
            let docFilename = $(this).attr("DocFilename");
            if (GlobalVar.documentBag.includes(docFilename)) $(this).find("span.butAddDoc2Bag").hide();
            else $(this).find("span.butRemoveDocFromBag").hide();
         });
      }
      
      // 2025-01-23: 更新 eventsXml 後，將文本找到的標籤加上 .udefMatch（方便後續加上 .udefOn 高亮處理），
      //             event 區塊對應的 event element 加上 .eventElementMatch（標上橘色 dotted line）
      //             cf. eventElementMatchByText
      $("span.comarkusEventLabel").each(function() {
         // 在 span.comarkusEventLabel 下面會有多個與該事件相關的 event elements
         let jqComarkusEventElements = $(this).parent().find("div.comarkusEventElements");
         let jqHtmlDocContent = $(this).closest("tr.docContent");

         let comarkusEventElements = [];
         jqComarkusEventElements.find("span[Comarkus-udefTagName]").each(function() {     // 2024-11-15: 從 <div> 改為 <span>
            //alert($(this).prop("outerHTML"));    
            // e.g., <span comarkus-udeftagname="Udef_Evt_EVENT_SOURCE_TEXT" comarkus-refid="#doc_title" comarkus-markusid="#xml_metadata" 
            //       comarkus-text="繁峙縣志: 遷城記"> - 繁峙縣志: 遷城記 (#doc_title)</div>
            let udefEvtTagName = $(this).attr("Comarkus-udefTagName");
            let comarkusRefId = $(this).attr("Comarkus-refId");
            let markusId = $(this).attr("Comarkus-markusId");
            let comarkusText = $(this).attr("Comarkus-text");      // e.g., "BEGIN/1767/越二年"
            let element = { udefEvtTagName,
                            comarkusRefId,
                            markusId,
                            comarkusText,
                            jqComarkusEvent:$(this),               // 2024-10-14
                          };
            comarkusEventElements.push(element);
         });
         
         // 有了 comarkusEventElements 陣列，嘗試從 jqHtmlDocContent 找到每個 event element 的對應
         spotComarkusEventTagsInContent(jqHtmlDocContent, comarkusEventElements);
      });
      
      updateDocContentEventHandler();
      
      // 2025-07-12: 更新頁面內容後，需套用當前的顯示狀態
      applyCurTextStyling();            
      
      if (scrollToTop) windowScrollTop();               // 2024-11-23
      
      // 未來若想實作 postActions，應可放在這裡...
      // postActions = GlobalVar.tempPostActions;
      // doPostActions(postActions);
      
   }  // end of updateContentTextAndEvents()


   // 2026-07-09: 將一篇文件的內容處理函式（以 <tr>...</tr> 框起）獨立出來
   function getDocContentHtml(jqContentNode, docNumber, docFilename, spotlightTermsObj, fulltextTerms) {   
      // 2024-10-11
      highlightUdefTags(jqContentNode, GlobalVar.udefTagHighlighted);
      
      // 取出 Comment 和 Events 節點後，將它們從內容節點移除
      let jqCommentAndEvents = jqContentNode.find("Comment,Events");
      //let eventsXml = jqCommentAndEvents.prop("outerHTML");
      let eventsXml = getEventsBlockHtml(jqCommentAndEvents);
      jqContentNode.find("Comment,Events").remove();
   
      let metadataHtml = parseMetadataXml(jqContentNode.parent().find("xml_metadata"));
      let imageMetadataHtml = '';       // 2025-11-30
      
      // 2025-11-01:
      // 想法: 或可對每篇文件，動態套用不同的 queryTerms?
      // 例如，"t.Date:公元1602年"，後分類顯示「公元1602年 (萬曆三十年, 萬歷三十年, 萬歷壬寅)」...
      // <date refid="公元1602年:明神宗" term="公元1602年:明神宗" class="applyColor">
      //    <span class="udef">萬曆三十年<span class="udefInfo" title="公元1602年:明神宗">Date:
      //    <span class="udefRefId">公元1602年:明神宗</span></span></span>
      // </date>
      // (1). 需以「公元1602年」標記 <span class="udefRefId">
      // (2). 或可動態查找出「萬曆三十年」，並將其高亮出來...
      
      // 2026-03-08: 若搜尋範圍為「全部」，就需加上 metadata 高亮處理
      let jqMetadataBlock = $("<div/>").append(metadataHtml);
      if (GlobalVar.searchRange == 'all') {
         metadataHtml = getJqContentWithTermsHighlighted('metadata', jqMetadataBlock, spotlightTermsObj, fulltextTerms).html();   // 將回傳的 jquery node 轉成 html
      }
      else {
         metadataHtml = jqMetadataBlock.html();
      }
      
      // 2025-11-30: IMMARKUS 加上 imageMetadata (jqContentNode 以經是 clone 的物件，不會修改到原 DocuXml)
      //             因為後續還需對 query terms 進行 highlighting，因此需在此加入 jqContentNode
      if (jqContentNode.find("ImmarkusImage").length > 0) {
         // 2025-11-19: 補上 image metadata -- 存放在某個 <ImmarkusBody ImmarkusId="NULL"...>
         //             的 Paragraph 標籤下的 <ImmarkusProperties>？
         let items = [];
         jqContentNode.find("Paragraph ImmarkusBody[ImmarkusId='NULL']").each(function() {
            let t = '';
            $(this).find("ImmarkusProperties *").each(function() {
               let tagName = $(this).prop("tagName");
               if (tagName.startsWith("Udef_")) {
                  let jqClone = $(this);
                  jqClone.find("span.udefInfo").remove();
                  t = tagName + ': <span>' + jqClone.text() + '</span>';
                  items.push("<div>" + t + "</div>");
               }
            });
            imageMetadataHtml = "<div class='imageMetadata'>"
                              + items.join("\n")
                              + "</div>";
         });
      }
   
      // 2026-03-08: 若搜尋範圍為「全部」，就需加上 image metadata 高亮處理
      if (GlobalVar.searchRange == 'all') {
         let jqImageMetadataBlock = $("<div/>").append(imageMetadataHtml);
         imageMetadataHtml = getJqContentWithTermsHighlighted('imageMetadata', jqImageMetadataBlock, spotlightTermsObj, fulltextTerms).html();   // 將回傳的 jquery node 轉成 html
      }
   
      // 2026-03-08: 若搜尋範圍為「全部」，也需加上 events 高亮處理
      if (GlobalVar.searchRange == 'all') {
         let jqEventBlock = $("<div/>").append(eventsXml);
         eventsXml = getJqContentWithTermsHighlighted('events', jqEventBlock, spotlightTermsObj, fulltextTerms).html();
      }
      
      // 對主要內文加上高亮處理（標上 <mark>）
      let jqContentHighlighted = getJqContentWithTermsHighlighted('mainText', jqContentNode, spotlightTermsObj, fulltextTerms);
      let contentHtml = getContentPlusSvgHtml(jqContentHighlighted, docNumber);     // 2024-08-31: 加上 docNumber
    
      // 每篇文件兩個 <tr> （文件標題，文件內容），DocFilename 放在 tr.docContent 區
      // 若一篇文件被切成多個事件文，Comarkus2D 會將標題變成類似「壺關縣志：重修縣南城碑記<span class="copy">(3/8)</span>」形式
      let docTitle = jqContentNode.parent().find("title").text() || 'No Title';    // 2025-01-15: 補上 'No Title'
      //alert(jqContentNode.parent().prop("outerHTML"));
   
      // 2025-10-25: GlobalVar.docDict[corpus][filename].metadata[mfield]
      let sortedByFieldHtml = '';
      let sortDocsBy = getCurSortDocsBy() || 'm.filename';        // 2025-12-20: 加上 m.filename 防呆
      if (GlobalVar.enableAddingSortDocsByValue2Title && sortDocsBy !== 'm.filename') {
         let [sortField, sortOption] = sortDocsBy.split(',');     // 2026-03-16: sortOption 可能為 undefined
         let [spotlightType, spotlight] = sortField.split('.');
         sortedByFieldHtml = "<span class='docSortedByField'>"
                           + GlobalVar.docDict[corpus][docFilename].metadata[spotlight]
                           + "</span>";
      }
      
      // bag operation html
      // span.butAddDoc2Bag, span.butRemoveDocFromBag
      let bagOperationHtml = '';
      if (GlobalVar.enableDocumentBag) {
         bagOperationHtml = `<span class="button butAddDoc2Bag" style="margin-left:6px" title="add to bag" x-filename="${docFilename}">`
                          + '&#x279E; <i class="fa-solid fa-bag-shopping"></i>'
                          + '</span>'
                          + `<span class="button butRemoveDocFromBag" style="margin-left:6px" title="remove from bag" x-filename="${docFilename}">`
                          + '<i class="fa-solid fa-bag-shopping"></i> &#x279E;'
                          + '</span>';
      }
      
      // 以 <tr>...</tr> 框住一篇文件的內容
      // 結構 tr.docTitle
      //      tr.docContent
      //         td | td.docEvents
      let s = "<tr class='docTitle' key='"+ docNumber + "'>"
            + "<td colspan='2'>"
            + "<div class='docTitle' DocFilename='" + docFilename + "'>"      // 2025-11-03: 加上 docFilename 方便取得當前檔名
            + "<span class='docNumber'>" + docNumber + "</span>. "
            + sortedByFieldHtml
            + "<span class='docTitle'>" + docTitle + "</span>"
            + bagOperationHtml
            + "</div>"
            + "</td></tr>"
            + "<tr class='docContent' DocFilename='" + docFilename + "'>"     // 2024-10-11 加上 docFilename 方便按下 ComarkusEvent 鈕之後找到檔名
            + "<td valign='top' class='docContent'>"    // 還是得加上 valign...
            + "<div class='docMetadata'>" + metadataHtml + "</div>"
            + imageMetadataHtml
            + "<div class='docText'>" + contentHtml + "</div>"
            + "<div class='docFilename'>" + docFilename + "</div>"            // 頁面上加上 filename 資訊（方便檢錯）... 2024-11-18: bugs fix 移至此
            + "</td>"
            + "<td valign='top' class='docEvents'>"
            + "<div>" + eventsXml + "</div>"
            + "</td>"
            + "</tr>"
      return s;
   }
         
   // 2026-07-31: 將更新事件處理獨立出來（更新文件內容後，也需重新註冊內容中的 event handlers）
   function updateDocContentEventHandler() {
      // 2026-08-06
      $("span.relationDocLink").off("click").on("click", function() {
         //alert($(this).prop("outerHTML"));
         let filename = $(this).attr("link2Doc");
         let query = '{' + filename + '}';
         $("#queryFilter").val(query);
         $("#butQueryGo").click();
      });
      
      // 2024-10-12: 更新 #contentTable 後，需重新註冊相關的事件處理函式
      //             例如，應重新註冊 div.ComarkusEvent
      //             注意：class value 是用 camel，但屬性名稱是採取 Pascal
      $("span.comarkusEventLabel").off("click").on("click", function() {
         let jqComarkusEventElements = $(this).parent().find("div.comarkusEventElements");
         let jqHtmlDocContent = $(this).closest("tr.docContent");
         //let docFilename = jqHtmlDocContent.attr("DocFilename");
         //let jqDoc = GlobalVar.docFilenameJqDocMap[docFilename];
         //alert(jqDoc.prop("outerHTML"));
      
         // 2025-01-23: 按鈕有三種狀態 (without classes) -> eventHighlighted -> eventHighlighted displayWithEventId ->
         //             若原本處於 eventHilighted+displayWithEventId 狀態，點擊後要變成 dehighlighted 狀態，但按鈕則需顯示 highlight（使用者點擊後的動作）
         
         // 注意：若文件包含多 events，就會產生多份 span.comarkusEventLabel（因此不是僅用 $(this) 調整自己的 class 狀態）
         let jqEventLabels = jqHtmlDocContent.find("span.comarkusEventLabel");
      
         if (!$(this).hasClass("eventHighlighted")) {
            jqHtmlDocContent.find("span.udefMatch").addClass("udefMatchOn");
            jqEventLabels.addClass("eventHighlighted");
            jqEventLabels.text("highlight with event id");            // next state
         }
         else {
            if (!$(this).hasClass("displayWithEventId")) {
               jqHtmlDocContent.find("span.udefMatch").find("span.udefInfo").removeClass("hideUdefInfo");
               jqEventLabels.addClass("displayWithEventId");
               jqEventLabels.text("dehighlight event tags");          // next state
            }
            else {
               jqHtmlDocContent.find("span.udefMatch").removeClass("udefMatchOn");
               jqHtmlDocContent.find("span.udefMatch").find("span.udefInfo").addClass("hideUdefInfo");
               jqEventLabels.removeClass("displayWithEventId eventHighlighted");
               jqEventLabels.text("highlight event tags");
            }
         }
      });
      
      // 2024-11-07: 加上 span.butHighlightImmarkusPiece 事件重新註冊
      $("span.butHighlightImmarkusPiece").off("click").on("click", function() {
         // 注意，這裡假設 highlight 的影像和 selector 都和 button 處在相同文件中
         // 注意：目前 shapes 應僅包含 <polygon>, <rect>, <g>, <path>
         let shapeKey = $(this).attr("Key");
         let selector = "svg *[key='" + shapeKey + "']";      // e.g., "svg *[key='mark:0']" -- 注意，雖然先前標籤是用 Key，但經 html 處理後都只能用全小寫 key
            
         let jqShapes = $(this).closest("tr.docContent")      // 找到文件的區塊 -- 注意是 tr.docContent 而不是 tr.docTitle）
                               .find(selector);               // 應該只會找到一個標籤
                               
         //alert("butHighlightImmarkusPiece:\n" +
         //      selector + "\n" + 
         //      jqShapes.prop("outerHTML"));
         
         // 2024-12-30: 若 svg 有展示 immarkus piece layer，按鈕就需加上 immarkusRelationSourcePiece
         if (jqShapes.is(":hidden")) {
            jqShapes.show();
            $(this).addClass("immarkusRelationSourcePiece");
            $(this).addClass("pieceHighlightColor" + $(this).attr("xColorIdx"));         // 2025-04-12
         }
         else {
            jqShapes.hide();
            $(this).removeClass("immarkusRelationSourcePiece");
            for (let i=0; i<GlobalVar.maxPieceHighlightColor; i++) $(this).removeClass("pieceHighlightColor" + i);
         }
      });
      
      // 2026-05-02: Udef_properties_Location（搭配 XmarkusAnalyzer.css）
      //$("div.immarkusPiece Udef_properties_Location").off("click").on("click", function(evt) {
      //   let jqClone = $(this).clone();
      //   jqClone.find("span.udefInfo").remove();
      //   //let text = jqClone.text();
      //   //let [y, x] = text.split(",");         // 注意，<Udef_properties_Location> 是直接提取 Immarkus (location_0,location_1)，先緯度後經度，也就是 "(y,x)" format
      //   let text = jqClone.attr("RefId");
      //   let x = 0; y = 0;
      //   if (text && text.startsWith("xy=")) {
      //      text = text.substr(3);
      //      [x, y] = text.split(",");            // 注意，DocuSky 格式是 RefId="xy=<lng,lat>"
      //   }
      //   else {                                  // 舊版轉出的 xml 缺少 RefId 屬性
      //      text = jqClone.text();
      //      [y, x] = text.split(",");            // 注意，<Udef_properties_Location> 是直接提取 Immarkus (location_0,location_1)，先緯度後經度，也就是 "(y,x)" format
      //   }
      //   
      //   let lng = parseFloat(x);
      //   let lat = parseFloat(y);
      //   let coordinateList = [{lng,lat}];
      //   encodedStr = PolylineUtil.encode(coordinateList);
      //   let url = API_URL['DocuGisLite'] + "?mt2=" + encodedStr + ";;;default";
      //   //let url = API_URL['DocuGisLite'] + "?id2=hvd_33403,hvd_113555;;;default&mt2=" + encodedStr + ";;;default";
      //   //alert(url);
      //   showUrlIframe(evt, url, "DocuGIS Lite: " + text, null, 800, 480);
      //});
      
      // 2025-06-08
      if (GlobalVar.highlightPiecesAfterUpdate) {
         $("span.butHighlightImmarkusPiece").click();
      }
      
      // 2025-03-05:
      $("span.butViewImmarkusRelation").off("click").on("click", function(evt) {
         // 利用 @PieceDocFilename 和 @PieceImmarkusId 開啟小視窗來顯示跨文件的 piece...
         let curDocFilename = $(this).closest("tr.docContent").attr("DocFilename");
         let sourcePieceCorpus = $(this).attr("SourcePieceCorpus") || GlobalVar.prevCorpus;     // 2025-03-12: 加上 GlobalVar.prevCorpus（其實應該是 curCorpus）防呆...
         let sourcePieceDocFilename = $(this).attr("SourcePieceDocFilename");
         
         if (curDocFilename !== sourcePieceDocFilename) {
            alert("Notice: curDocFilename: " + curDocFilename + "\n" + "sourcePieceDocFilename: " + sourcePieceDocFilename);
         }
         
         // (TODO): 目前先假設是單一文獻集，不需要用到 sourcePieceCorpus... 注意 GlobalVar.docFilenameJqDocMap 已假設資料庫中（即使不同文獻集）檔名唯一
         let jqSourcePieceDoc = GlobalVar.docFilenameJqDocMap[sourcePieceDocFilename];
         jqSourcePieceContent = jqSourcePieceDoc.find("doc_content,Content"); 
         let svgImageHtml = parseImmarkusContent2GenSvgImage(jqSourcePieceContent);
         
         // 2025-03-10: (TODO TODO) xxyyzz 
         //             svgImageHtml 中的一些 id 日後必須修改（否則會跟內文的 id 重覆）
         // ...
         //alert(svgImageHtml);
         
         // (TODO) 小視窗的內容，可以是 svg image 加上 event info
         let contentHtml = svgImageHtml;
         // (TODO) 加上 event info...
         // ...
         
         let divContentId = showDivHtml(evt, 600, 400, "TEST", contentHtml);
         
         // 2025-03-11: ImmarkusRelation 只有 @PieceImmarkusId，沒有 @Key
         let sourcePieceImmarkusId = $(this).attr("SourcePieceImmarkusId");
         selector = "svg *[pieceimmarkusid='" + sourcePieceImmarkusId + "']";
         $('#' + divContentId).find(selector)
                              .show()
                              .addClass("immarkusRelationSourcePiece");
      
         // TODO...
         let targetPieceImmarkusId = $(this).attr("TargetPieceImmarkusId");
         selector = "svg *[pieceimmarkusid='" + targetPieceImmarkusId + "']";
         $('#' + divContentId).find(selector)
                              .show()
                              .addClass("immarkusRelationTargetPiece");
      
         });
      
      $("span.butToggleAllImmarkusPieces").off("click").on("click", function() {
         // 2025-04-21: 改 $(this).parent().parent()
         $(this).parent().parent().find("span.butHighlightImmarkusPiece").click();
      });
      
      // 2024-10-13: 更新 $("#contentTable") 後，event 區塊的 buttons 也需重新註冊
      // 2024-12-31: 加上 Immarkus piece (as an eventunit) 處理
      $("#contentTable button").off("click").on("click", function() {     // buttons to fold/unfold event elements
         let key = $(this).attr("key");                // 'fold' or 'unfold'
         let jqEventUnit = $(this).closest("div.comarkusEvent, div.immarkusPiece");
         jqEventUnit.find("button[key]").hide();
         if (key == 'fold') {
            jqEventUnit.find("div.comarkusEventElements, div.immarkusPieceElements").slideUp(500);
            jqEventUnit.find("button[key='unfold']").show();
         }
         else if (key == 'unfold') {
            jqEventUnit.find("div.comarkusEventElements, div.immarkusPieceElements").slideDown(500);
            jqEventUnit.find("button[key='fold']").show();              // 2025-01-08: bug fix
         }
         else alert("Error: unknown @key '" + key + "'");
      });
      
      // 2025-11-03: 每篇文件標題後方，關於從 bag 加入或移除（動態註冊）
      $("span.butAddDoc2Bag").off("click").on("click", function() {
         let docFilename = $(this).attr("x-filename");
         GlobalVar.documentBag = [... new Set([...GlobalVar.documentBag, docFilename])];
         $("#documentBagSize").text(GlobalVar.documentBag.length);
         
         $(this).hide();
         $(this).parent().find("span.butRemoveDocFromBag").show();
      });
      
      $("span.butRemoveDocFromBag").off("click").on("click", function() {
         let docFilename = $(this).attr("x-filename");
         GlobalVar.documentBag = GlobalVar.documentBag.filter(x => x !== docFilename);
         $("#documentBagSize").text(GlobalVar.documentBag.length);
      
         $(this).hide();
         $(this).parent().find("span.butAddDoc2Bag").show();
      });
      
      // 2024-11-12: 註冊 PersonName 和 LocName（後續再補完工作）
      $("PersonName").off("click").on("click", function(evt) {
         // (TODO -- unfinished) 
         // 利用 @CbdbId (Xmarkus) 或 @RefId (DocuSky) 取得規範庫的 identifier
         let srcId = $(this).attr("CbdbId") || $(this).attr("RefId");
         let idList = srcId.split("|").map(v => v.split(',')[0]);      // 2024-11-12: Comarkus 會有 'cbdb_劉維屏,fl1613,r高苑' 這種標示方式... => 取出 'cbdb_劉維屏'
         let refId = idList.join("|");
         let jqClone = $(this).clone();
         jqClone.find("span.udefInfo").remove();
         let personName = jqClone.text();                        // 2024-11-24: 若直接用 $(this).text()，將會多取得 span.udefInfo 內「為了 highlight 顯示」的內容
         
         let url = "";
         let param = "";
         let label = "";                                         // 2024-11-24: 顯示在小視窗的標題（依各種狀況顯示人名或 id）
         if (idList.length > 1) {
            param = "name=" + personName;
            url = API_URL['CbdbApiPerson'] + "?" + param;        // location.protocol + "//..."
            label = personName;
         }
         else if (/^cbdb_(\d+)$/.test(refId)) {                  // 2019-04-09: cbdb_nnnnn
            param = "id=" + refId.substr(5);
            url = API_URL['CbdbApiPerson'] + "?" + param;        // location.protocol + "//..."
            label = personName + ':' + refId;
         }
         else if (/^cbdb_([^\d]+)$/.test(idList[0])) {           // 2024-09-22: cbdb_人名 (Comarkus) -- 注意只支援查詢一個人名！
            personName = "cbdb_" + idList[0].substr(5);          // 第一項的人名，加上 "cbdb_" 前綴（顯示在小視窗標題 -- 沒有額外加上 DocuGIS Lite）
            param = "name=" + idList[0].substr(5);               // 第一項的標記人名
            url = API_URL['CbdbApiPerson'] + "?" + param;        // location.protocol + "//..."
            label = srcId;
         }
         else if (/^dila_(.+)$/.test(refId)) {                   // 2024-11-13
            url = API_URL['DilaPersonAuthoritySearch'] + "?aid=" + key;
            label = personName + ':' + key;
         }
         else if (/^kauth_(.+)$/.test(refId)) {                  // 2024-11-13
            url = API_URL['KauthApiPerson'] + "?manId=" + key;
            label = personName + ':' + key;
         }
         else if (/^(\d+)$/.test(refId)) {                      // 2019-04-09: nnnnn => cbdb
            url = API_URL['CbdbApiPerson'] + "?id=" + refId;    // location.protocol + "//..."
            label = personName + ':' + refId;
         }
         else if (/^http[s]?:\/\/.+/.test(refId)) {             // 2018-10-23: a URL
            url = refId;
            label = refId;
         }
         else {
            alert("Cannot consult CBDB since the cbdbId '" + cbdbId + "' is not a valid number");
            return;
         }
         //alert(url);
      
         // 由於 CORS 問題，若不用 iframe 將無法直接取得資料（必須透過 server 提供 proxy）
         let postAction = null;                                     // 2023-11-12: 先設為 null
         showUrlIframe(evt, url, label, postAction, 800, 480);
         
         //alert($(this).prop("outerHTML"));
      });
      
      $("LocName").off("click").on("click", function(evt) {
         // 2024-11-14
         // 利用 @RefId 取得規範庫的 identifier -- 若沒有 @RefId 或 @RefId 不合規，是否該跳出警示？
         //alert($(this).prop("outerHTML"));
         let placeName = $(this).text();
         let placeId = $(this).attr("RefId") || $(this).attr("PlaceRefId");        // @PlaceRefId 用於 Udef tags
         let marker = 'default';                // "default", "redcircle", "bluecircle", "greencircle", "graycircle"
         let url = API_URL['DocuGisLite'] + "?id=" + placeId + ";;;" + marker;
         let postAction = null;
         showUrlIframe(evt, url, "DocuGIS Lite: " + placeName, postAction, 800, 480);
      });
      
      // TODO TODO "lite.html?mt=" + encodedStr + ";;;default";
      //     where lng = parseFloat(x);
      //           lat = parseFloat(y);
      //           coordinateList = [{lng,lat}];
      //           encodedStr = PolylineUtil.encode(coordinateList);
      // 2026-04-15: Udef_properties_Location: 32.407351932418,119.43450203979052
      
      // 2024-09-01, 2024-11-16: 拷貝自 DocuSky 檢索頁（必須在影像載入時調整大小）
      // 注意: 必須在 contentTable 插入 <image> 後，對這些物件註冊才有效
      $("image").off("load").on("load", function() {
         jqImage = $(this);
         setSvgViewboxImageOnload(jqImage);
      })
      
      // 2026-01-23: rect,circle,ellipse,polygon,path,line,polyline
      $("polygon,rect,path,ellipse,g").off("click").on("click", function() {
         //alert("YES (TODO): " + $(this).prop("tagName") + "\n" + $(this).attr("Key"));
      });
   }

   // 2025-03-11: 將以下從 $("image").on("load", function(...)) 獨立出來...
   function setSvgViewboxImageOnload(jqImage) {
      let imageId = jqImage.prop("id");
      let imageUrl = jqImage.attr("xlink:href");
      let imageWidth = jqImage.attr("width");        // 2026-01-18
      let imageHeight = jqImage.attr("height");      // 2026-01-18
      let jqSvg = jqImage.parent();
      let svgObj = jqSvg.get(0);
      
      // 獲取圖片的（原始）寬度和高度
      // 2026-01-18: IIIF image server 可能會設定最大輸出尺寸限制，即使是 full/full/0 也未必能取得原始的大小！
      //             => 這表示 Immarkus2D 必須（透過 manifest 取得）設定原始影像的大小！
      if (!imageWidth || !imageHeight || imageWidth == '0' || imageHeight == '0') {
         imageWidth = jqImage.get(0).getBBox().width;
         imageHeight = jqImage.get(0).getBBox().height;
      }
      
      // 設置 SVG 的 viewBox 屬性
      let viewBox = '0 0 ' + imageWidth + ' ' + imageHeight;
      //alert(viewBox);
      svgObj.setAttribute('viewBox', viewBox);
      //jqSvg.attr('viewBox', viewBox);                     // 不知為什麼，在此用 jquery 會失效，必須用 svgObj.setAttribute()
      console.log(`Image ${imageId} ${imageUrl}: ${viewBox}`);

      // 2025-04-10: 特殊橫幅狀況 (banner painting)：寬度夠，但高度很小...
      if (GlobalVar.svgImageScrollSpecificBannerPainting) {
         if (imageHeight < 400 && imageWidth > 800) {
            svgObj.classList.add('full-height-auto-width');
            let divContainer = jqSvg.parent().get(0);
            divContainer.classList.add('image-container-x-scroll');
            divContainer.style.height = imageHeight + 'px';
         }
      }
      
   }
   
   // 2025-01-30: 
   function svgImageLoadError(imageElement) {
      // 注意：<image onerror="..."> 圖片載入失敗時，瀏覽器不會把 http status code 暴露給 JS...
      // 在此展示的錯誤訊息，是在產生 <image> 時就已事先制訂（訊息包含圖檔 URL）
      // e.g., "Fail to access: http://localhost:8088/XmarkusData/ImmarkusData/20251224-IMMARKUS Leuven University Hall_new/University Hall_photo.jpeg"
      $(imageElement).parent().parent().find("div.imageFailed").show();
   }
   
   // 2025-04-28: 利用 ChatGPT 產生 markTerm 的相關程式碼...（e.g., 合併檔查詢「咸陽去京兆」）
   //             會直接利用 document.createElement() 修改 container 內容...
   function markTerm(term, container) {
     if (!term || !container) return;
   
     function getTextNodes(node) {
       let textNodes = [];
       if (node.nodeType === Node.TEXT_NODE) {
         textNodes.push(node);
       } else {
         for (let child of node.childNodes) {
           textNodes.push(...getTextNodes(child));
         }
       }
       return textNodes;
     }
   
     const textNodes = getTextNodes(container);
   
     // 建立全文本和節點映射
     let fullText = '';
     const nodeMap = [];
   
     for (const node of textNodes) {
       nodeMap.push({
         node: node,
         start: fullText.length,
         end: fullText.length + node.textContent.length,
       });
       fullText += node.textContent;
     }
   
     // 找到所有匹配位置
     const matches = [];
     let pos = 0;
     while ((pos = fullText.indexOf(term, pos)) !== -1) {
       matches.push({ start: pos, end: pos + term.length });
       pos += term.length;
     }
   
     if (matches.length === 0) {
       console.log(`找不到要高亮的文字: ${term}`);
       return;
     }
   
     // 反向處理 matches（避免節點變動影響）
     for (const { start, end } of matches.reverse()) {
       let startInfo = null, endInfo = null;
   
       for (const info of nodeMap) {
         if (start >= info.start && start < info.end) startInfo = info;
         if (end > info.start && end <= info.end) endInfo = info;
       }
   
       if (!startInfo || !endInfo) continue;
   
       // 需要處理從 start 到 end 之間可能跨多個節點的情況
       const startNode = startInfo.node;
       const startOffset = start - startInfo.start;
       const endNode = endInfo.node;
       const endOffset = end - endInfo.start;
   
       const range = document.createRange();
       range.setStart(startNode, startOffset);
       range.setEnd(endNode, endOffset);
   
       const contents = range.extractContents();
       const mark = document.createElement('mark');
       mark.className = 'ftHighlight';
       mark.appendChild(contents);
       range.insertNode(mark);
     }
   }

   function getJqContentWithTermsHighlighted(blockType, jqContent, spTermsObj, ftTerms = []) {
      // -- highlightQueryTerms
      // 在 jqContent 中，文字內容若有出現 terms 則加上高亮標籤 <span class="highlight">
      // 方法：在此藉由 ChatGPT 取得 highlightTextNode() 程式碼（在這類狀況下，ChatGPT 真的很實用）
      //       由於不想花太多時間在 code modification，僅在其前後以 jquery node 進行包裝。
      // 原理：將 textnode 轉成 <span xmlns="...">...<span class='highlight'>term</span>...</span>
      // 注意：若詞彙跨標籤，將不會被 highlight
      // 注意：是逐一對每個 term 進行 highlight，而不是將所有 terms 串接起來一次處理
      // 回傳：更新後的 jqContent
      // 註：傳遞 spTermsObj, ftTerms 是因為先前想保留彈性，可對不同 spotlights 標上不同色（但目前還是併在 allTerms 一起處理）

      if (Object.keys(spTermsObj).length + ftTerms.length == 0) return jqContent;
      //alert(JSON.stringify(spTermsObj) + "\n" + JSON.stringify(ftTerms) + "\n" + jqContent.prop("outerHTML"));

      // 2025-02-16: 若 GlobalVar.showTagSpotlightCuesAsTree 為 true，spotlightCat 為 'text_tags'，
      //             則 term 將會是 <refid>/<tag_text> 形式，需將其切成 <refid>, <tag_text> 來處理
      //             （否則在文本中一定比對不到）
      let spTerms = [];
      //alert(GlobalVar.prevSpotlightCat);
      if (GlobalVar.showTagSpotlightCuesAsTree || GlobalVar.highlightSplittedTreePathTerms) {    // 2026-07-03
         let newTerms = [];
         Object.keys(spTermsObj).forEach(function(spotlight) {
            let terms = spTermsObj[spotlight];
            terms.forEach(function(term) {
               let [refid, tagText] = term.split('/');           // 仍有可能僅有 tagText
               newTerms.push(refid);
               if (tagText) newTerms.push(tagText);
            });
         });
         spTerms = newTerms;
      }
      else {
         Object.keys(spTermsObj).forEach(function(spotlight) {
            let terms = spTermsObj[spotlight];
            terms.forEach((term) => spTerms.push(term));
         });
      }
      
      // 2025-12-05: spTerms 將 '&#039;' 換回單引號，然後 '?' 要加上反斜線
      // 2026-02-27: ftTerms 包含 regexp-form 字串，以及 escaped 後的字串，
      spTerms = spTerms.map((v) => escapeRegExp(unescapeHtml(v)));
      
      // 2025-01-05: 將 terms 由長到短排序... 否則 "construct|construction" 會標出 <mark>construct</mark>ion 結果
      function sortArrayByStrLengthDesc(array) {
         return array.sort((a,b) => b.length-a.length);
      }
      
      spTerms = sortArrayByStrLengthDesc(spTerms);
      ftTerms = sortArrayByStrLengthDesc(ftTerms);
      let allTerms = [... spTerms.concat(ftTerms)];
      //console.log(allTerms);
      //alert(JSON.stringify(allTerms));
      
      // 2025-11-14
      if (GlobalVar.reverseTermOrderOnHighlight) allTerms = allTerms.reverse();
      
      // 2025-11-01: 改回舊版標記程式... 
      // => 它可處理「文字在標籤內」的情形，但無法處理「查詢文字跨多標籤」的狀況
      // => 由於「文字跨標籤」的高亮應該只有全文查詢才會遇到，若真要處理或可先對 highlight terms 分類，
      //    屬於 fulltext 的就套用 markTerm() 來進行跨標籤標記... （但對 X-MARKUS 而言，應該高亮出 annotated tags 會比較重要）
      
      // 舊版：採取單純的方式
      // concatedTerms = (allTerms.map((v) => escapeRegExp(v)).join('|'));      // 2024-09-28: bug fix

      // 2025-10-26: 移到 concatedTerms 前
      let escapedSpTerms = [];
      if (GlobalVar.highlightTextWithEscapedCue) {
         // 加上「比對 escaped cues（尤其是將內文空白換成底線）」功能，參考 escapeSpotlightCue()
         let newTerms = [];
         Object.keys(spTermsObj).forEach(function(spotlight) {
            let terms = spTermsObj[spotlight];
            terms.forEach(function(term) {
               if (GlobalVar.showTagSpotlightCuesAsTree || GlobalVar.highlightSplittedTreePathTerms) {      // 2026-07-03
                  let [refid, tagText] = term.split('/');                  // 仍有可能僅有 tagText
                  newTerms.push(getTermHighlightWithEscapedCue(refid));    // 2025-10-28
                  if (tagText) newTerms.push(getTermHighlightWithEscapedCue(tagText));
               }
               else {
                  // 2025-10-23: 對 term 先加上 unesapeHtml() 處理...
                  term = getTermHighlightWithEscapedCue(term);
                  newTerms.push(term);
               }
            });
         });
         escapedSpTerms = newTerms;
      }
      else {
         escapedSpTerms = (spTerms.map((v) => escapeRegExp(v)));
      }
      //console.log(escapedSpTerms);
      //alert(escapedSpTerms);
      
      // 測試:「t.Udef_action:break_down m.AU:楊善 泰山」與「t.Udef_action:break_down m.AU:楊善 渡泰山」
      //      「t.Udef_Evt_EVENT:CONSTRUCTION/do/為」
      // 2025-10-28: 目前先加上 '^' 來讓高亮的結果「較為精準」，或可再加上 '$'？(會不會 precision 提升，但 recall 卻下降 -- 反而高亮不到「應該可比對到」的詞彙？)
      let spTermsStr = escapedSpTerms.join('|');
      let concatedTerms = '';
      if (GlobalVar.enableHighlightCrossTagsMarkTerm) {
         // 舊版模式套用到 spTerms，markTerm() 套用到 ftTerms
         // 2025-12-05: 改用 (^|\/)x, where x is the term string
         concatedTerms = (spTermsStr !== '') 
                       ? '(?:^|\/)(' + spTermsStr + ')'
                       : '';
      }
      else {
         // 將 spTermsObj 和 ftTerms 合併在 concatedTerms 一次性套用舊模式比對
         let ftTermsStr = (ftTerms.map((v) => v).join('|'));
         if (spTermsStr !== '') {
            // 2025-12-05: 改用 (^|\/)x, where x is the term string
            // 2026-02-06: (bug fix) ftTerms 不該要求前方需為 null 或 '/'
            // 2026-03-26: (bug fix) 原先 (?:^|\/) 可能會多比對到 term 前方的 '/'，詢問 ChatGPT 後改用 lookbehind (?<=^|/)
            concatedTerms = (ftTermsStr !== '') 
                          ? '(?<=^|/)(' + spTermsStr + ')' + '|' + ftTermsStr    // 優先比對 spTerms
                          : '(?<=^|/)(' + spTermsStr + ')';
         }
         else {
            concatedTerms = ftTermsStr;
         }
      }
      //console.log("concatedTerms: " + concatedTerms);
      //alert(concatedTerms + "\n\n" + jqContent.html());

      // 在 RegExp 模式下，要同時顯示標籤與高亮關鍵詞有些困難度...
      if (concatedTerms !== '') {
         const regex = new RegExp(`(${concatedTerms})`, 'gi');
         
         // 以下進行高亮處理... 
         //alert(jqContent.prop("outerHTML"));
         let node = jqContent.get(0);
         
         // 2026-02-26: HighlighterManager 可以處理 main text，但對於 metadata block 之類（也許是表格內文包含特定標籤？但需要更多檢查），似乎就經常標記失敗...
         //             => 透過 blockType 採取不同標記函式
         if (['metadata','imageMetadata','events'].includes(blockType)) {    // 2026-02-26: 加上 blockType （判斷採取哪份高亮函式）
            // 2026-02-26: old function call
            highlightTextNode(node, regex);         // internal function
            jqContent = $(node);
         
            //alert(jqContent.html());
            //alert(jqContent.find("*[RefId]").length);
            jqContent.find("span[xmlns]").removeClass("highlight");    // 從多餘的 <span xmlns...> 標籤，移除其 highlight class
         }
         else {     // 'mainText'
            const container = node;
            const hl = new HighlighterManager(container, {'markTag':'mark'});
            
            // 規則：priority 越小越先套（也就是越不容易被其他規則搶走）
            // e.g., 募.{0,7}金|捐.{0,7}兩
            const rules = [
               { id: "keyword", pattern: regex, className: "highlight", priority: 1 },
               //  { id: "donate", pattern: /捐.{0,7}兩/g, className: "mark-donate", priority: 1 },
               //  { id: "money",  pattern: /募.{0,7}金/g, className: "mark-money",  priority: 2 },
               //  { id: "term",   pattern: "鳩工",            className: "mark-term",   priority: 10 }, // 字串也行
            ];
            
            hl.apply(rules);
            jqContent = $(node);
         }
         
         // 2024-11-22: 比對 <mark>字串</mark> 的字串出現在 terms 的第幾項，加上 markColor<n> 的類型
         //             註：若不管英文大小寫，可先將 terms 轉為通通小寫的 lcTerms，mark 字串也轉為小寫，來找出其出現在 terms 的第幾項（這裡暫時不去處理...）
         jqContent.find("mark").each(function(markIdx) {
            let term = $(this).text();
            let p = allTerms.indexOf(term);                         // 注意，為了防呆，需考慮沒比對到時，p 值為 -1

            if (GlobalVar.highlightMatchingColorByRegExp) {         // 2026-03-16
               let found = false;
               allTerms.forEach(function(searchTerm, idx) {
                  if (found) return;
                  let regexp = new RegExp(searchTerm);
                  if (term.match(regexp)) {
                     p = idx;
                     found = true;
                  }
               });
            }
            else if (GlobalVar.highlightTermsColorBySpotlightType) {        // 以 term 出現在哪個 spotlight 來分配顏色
               // 檢查 term 是出現在哪個 spotlight 或 fulltext 中
               p = -1;
               Object.keys(spTermsObj).forEach(function(spotlight, spIdx) {
                  if (spTermsObj[spotlight].includes(term)) p = spIdx
               });
               if (p === -1) p = Object.keys(spTermsObj).length;    // fulltext
            }
            
            if (p == -1) p = (new Date()).getMonth();               // 2026-02-26: 若關鍵詞含 regular expression，p 幾乎必為 -1，此時透過當時的月份換成不同色 (0-11)
            p = (p+GlobalVar.markHighlightColorBound) % GlobalVar.markHighlightColorBound;          // 0 到 (GlobalVar.markHighlightColorBound-1)

            let colorClass = "markColor" + p;
            $(this).addClass(colorClass);
            
            // 2025-02-13: 若節點的祖先包含 span.udef 標籤，則該標籤內容將會是文本中的對應詞彙
            let jqSpanUdef = $(this).closest("span.udef");
            // 2025-10-26: 有時會有兩層（多層？）<span class="udef"> 狀況？
            //if (jqSpanUdef.closest("span.udef").length > 0) jqSpanUdef = jqSpanUdef.closest("span.udef");    
            if (jqSpanUdef.length > 0) jqSpanUdef.addClass(colorClass);
         });
      }
      
      ////// 2025-04-28: 改採 jquery.mark.js --- 似乎也無法處理文字跨多標籤的狀況...（「咸陽去京兆」）
      ////// $(".context").mark(keyword [, options]);
      ////// $(".context").markRegExp(regexp [, options]);
      ////terms.forEach(function(term) {
      ////   jqContent.mark(term, {separateWordSearch:false, acrossElements:true});
      ////});

      // 2025-11-02: 簡單加強版 -- 如果舊版模式某些 terms 沒有標記到（例如沒有高亮到任何項目 -- 但這裡的判斷規則很容易錯漏），就試著用 markTerm() 看看能否找到高亮項目
      //             例如文本是「<tag>江浙<tag>至」，則查詢「江浙至」、甚至「浙至」都可以被高亮出來！
      if (GlobalVar.enableHighlightCrossTagsMarkTerm) {
         // 2025-04-29: 改採 markTerm() 在跨標籤結果稍好，但若標籤過於複雜且包含其他內容（但這些內容被隱藏顯示），就無法順利標記出來...
         //             => 由於 <span class="udefInfo">...</span> 會包含「純文字內容」，因此造成比對失敗
         //                (1). 先把 <span class="udefInfo"> 的內容先用 Base64.encode(s) 存入某屬性 @base64
         //                (2). 從 <span class="udefInfo"> 移除該內容
         //                (3). 呼叫 markTerm() 修改 container 節點
         //                (4). 從 <span class="udefInfo"> @base64 屬性中取出編碼字串 t
         //                (5). 將 Base64.decode(t) 放回 <span class="udefInfo"> 標籤

         jqContent.find("span.udefInfo").each(function() {
            let s = $(this).html();
            $(this).prop("base64", Base64.encode(s));
            $(this).html('');
         });
         
         let container = jqContent.get(0);
         ftTerms.forEach(function(term) {      // 注意是高亮 ftTerms 的詞彙
            markTerm(term, container);
         });
         
         jqContent.find("span.udefInfo").each(function() {
            let t = $(this).prop("base64");
            $(this).html(Base64.decode(t));
         });
      }

      // ---------- internal function --------------      
      function highlightTextNode(node, regex) {
         if (node.nodeType === Node.TEXT_NODE) {
            //console.log(node.textContent);
            const match = node.textContent.match(regex);
            if (match) {
               const span = document.createElement('span');
               //span.className = 'highlight';               // 必須移除，否則整段 text node 文字都將被 highlight
               span.innerHTML = node.textContent.replace(regex, '<mark class="highlight">$1</mark>');
               node.parentNode.replaceChild(span, node);
            }
         } 
         else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes) {
            //alert(node.innerHTML);
            for (let i = 0; i < node.childNodes.length; i++) {
               highlightTextNode(node.childNodes[i], regex);
            }
         }
      }  // end of internal function highlightTextNode()
      
      return jqContent;
   }

   // ------------------------------------------------------------------------------
   // 2026-02-26, 2026-03-11: 
   // 跟 ChatGPT 進行多次來回對話，它給出以下 HighlighterManager 程式碼...
   
   class HighlighterManager {
     constructor(container, options = {}) {
       this.container = container;
       this.markTag = options.markTag ?? "mark";
       this.markAttr = options.markAttr ?? "data-hl";
       this.excludeSelector = options.excludeSelector ?? ".udefInfo";    // 略去 <span class="udefInfo"> 標籤理的內容
       this.ignoreCharsRegex = options.ignoreCharsRegex ?? /[\s\u200B-\u200D\uFEFF]/;
     }
   
     clear() {
       const selector = `${this.markTag}[${this.markAttr}]`;
       const marks = this.container.querySelectorAll(selector);
       marks.forEach(m => {
         const p = m.parentNode;
         while (m.firstChild) p.insertBefore(m.firstChild, m);
         p.removeChild(m);
         p.normalize();
       });
     }
   
     /**
      * rules: [{ id, pattern, className, flags, priority }]
      * options:
      *  - clearFirst: true
      *  - mode: "block" | "nest" | "merge"   (default "block")
      */
     apply(rules, { clearFirst = true, mode = "block" } = {}) {
       if (clearFirst) this.clear();
   
       const { filteredText, charMap } = this._buildFilteredTextAndMap();
       if (!filteredText) return { totalFound: 0, applied: 0, mode };
   
       const normalizedRules = (rules ?? [])
         .map((r, i) => ({
           id: r.id ?? `r${i}`,
           className: r.className ?? "",
           priority: Number.isFinite(r.priority) ? r.priority : 100,
           regex: this._normalizePattern(r.pattern, r.flags)
         }))
         .sort((a, b) => a.priority - b.priority);
   
       // 1) 收集所有 matches（在 filteredText 上）
       let allMatches = [];
       for (const rule of normalizedRules) {
         const re = rule.regex;
         re.lastIndex = 0;
         let m;
         while ((m = re.exec(filteredText)) !== null) {
           if (m[0].length === 0) { re.lastIndex++; continue; }
           allMatches.push({
             ruleId: rule.id,
             className: rule.className,
             priority: rule.priority,
             start: m.index,
             end: m.index + m[0].length
           });
         }
       }
   
       const totalFound = allMatches.length;
       if (!totalFound) return { totalFound: 0, applied: 0, mode };
   
       if (mode === "merge") {
         const applied = this._applyMerge(allMatches, charMap);
         return { totalFound, applied, mode };
       }
   
       // block / nest：先挑選可套用的 match，再逐個包（由後往前）
       const selected = (mode === "nest")
         ? this._selectNestable(allMatches)
         : this._selectNonOverlapping(allMatches); // block
   
       // 由後往前包，避免影響前面 mapping
       selected.sort((a, b) => a.start - b.start || a.end - b.end);
       let applied = 0;
   
       for (let i = selected.length - 1; i >= 0; i--) {
         const { start, end, ruleId, className } = selected[i];
         const startPos = charMap[start];
         const endPos = charMap[end - 1];
         if (!startPos || !endPos) continue;
   
         const range = document.createRange();
         range.setStart(startPos.node, startPos.offset);
         range.setEnd(endPos.node, endPos.offset + 1);
   
         this._wrapRange(range, { token: ruleId, className });
         applied++;
       }
   
       return { totalFound, applied, mode };
     }
   
     // ---------------- mode helpers ----------------
   
     // block：完全不重疊（交叉/包含都算重疊，會被擋掉；但含內含外你可能也希望套，則用 nest/merge）
     _selectNonOverlapping(matches) {
       // priority 小先，越早越優先；同起點時長的優先
       const sorted = [...matches].sort((a, b) =>
         a.priority - b.priority ||
         a.start - b.start ||
         (b.end - b.start) - (a.end - a.start)
       );
   
       const chosen = [];
       const occupied = []; // 已選區間（在 filteredText 座標）
   
       for (const m of sorted) {
         if (!this._overlapsAny(m, occupied)) {
           chosen.push(m);
           occupied.push({ start: m.start, end: m.end });
         }
       }
       return chosen;
     }
   
     // nest：允許包含式重疊，但不允許交叉式重疊
     _selectNestable(matches) {
       const sorted = [...matches].sort((a, b) =>
         a.priority - b.priority ||
         a.start - b.start ||
         (b.end - b.start) - (a.end - a.start)
       );
   
       const chosen = [];
       const intervals = [];
   
       for (const m of sorted) {
         let ok = true;
         for (const iv of intervals) {
           if (this._isCrossOverlap(m, iv)) { ok = false; break; }
         }
         if (ok) {
           chosen.push(m);
           intervals.push({ start: m.start, end: m.end });
         }
       }
       return chosen;
     }
   
     // merge：允許任意重疊，切成片段後每片段加上多個 class/id
     _applyMerge(matches, charMap) {
       // 1) 收集所有切點
       const points = new Set();
       for (const m of matches) { points.add(m.start); points.add(m.end); }
       const cuts = [...points].sort((a, b) => a - b);
   
       // 2) 產生 segments: [cuts[i], cuts[i+1])
       const segments = [];
       for (let i = 0; i < cuts.length - 1; i++) {
         const s = cuts[i], e = cuts[i + 1];
         if (s < e) segments.push({ start: s, end: e });
       }
   
       // 3) 每段找覆蓋它的規則（m.start <= seg.start && m.end >= seg.end）
       //    並依 priority 排序後合併 id/class
       let applied = 0;
   
       // 由後往前包，避免破壞前段 mapping
       for (let i = segments.length - 1; i >= 0; i--) {
         const seg = segments[i];
   
         const covering = matches
           .filter(m => m.start <= seg.start && m.end >= seg.end)
           .sort((a, b) => a.priority - b.priority);
   
         if (!covering.length) continue;
   
         const ids = [...new Set(covering.map(c => c.ruleId))];
         const classes = [...new Set(covering.map(c => c.className).filter(Boolean))];
   
         const startPos = charMap[seg.start];
         const endPos = charMap[seg.end - 1];
         if (!startPos || !endPos) continue;
   
         const range = document.createRange();
         range.setStart(startPos.node, startPos.offset);
         range.setEnd(endPos.node, endPos.offset + 1);
   
         const token = ids.join(",");
         const className = classes.join(" ");
         this._wrapRange(range, { token, className });
         applied++;
       }
   
       return applied;
     }
   
     _overlapsAny(m, intervals) {
       for (const iv of intervals) {
         if (m.start < iv.end && m.end > iv.start) return true;
       }
       return false;
     }
   
     // 交叉式重疊：彼此有重疊，但不是包含關係
     _isCrossOverlap(a, b) {
       const overlap = a.start < b.end && a.end > b.start;
       if (!overlap) return false;
       const aInB = a.start >= b.start && a.end <= b.end;
       const bInA = b.start >= a.start && b.end <= a.end;
       return !(aInB || bInA);
     }
   
     // ---------------- text mapping ----------------
   
     _normalizePattern(pattern, flags) {
       if (pattern instanceof RegExp) {
         return pattern.global ? pattern : new RegExp(pattern.source, pattern.flags + "g");
       }
       if (typeof pattern === "string") {
         const fl0 = flags ?? "g";
         const fl = fl0.includes("g") ? fl0 : fl0 + "g";
         const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
         return new RegExp(escaped, fl);
       }
       throw new Error("pattern must be RegExp or string");
     }
   
     _isExcludedTextNode(textNode) {
       if (!this.excludeSelector) return false;
       const el = textNode.parentElement;
       return el ? !!el.closest(this.excludeSelector) : false;
     }
   
     _buildFilteredTextAndMap() {
       const walker = document.createTreeWalker(
         this.container,
         NodeFilter.SHOW_TEXT,
         {
           acceptNode: (node) => {
             if (this._isExcludedTextNode(node)) return NodeFilter.FILTER_REJECT;
             return NodeFilter.FILTER_ACCEPT;
           }
         }
       );
   
       let filteredText = "";
       const charMap = [];
   
       let node;
       while ((node = walker.nextNode())) {
         const raw = node.nodeValue;
         if (!raw) continue;
   
         for (let i = 0; i < raw.length; i++) {
           const ch = raw[i];
           if (this.ignoreCharsRegex.test(ch)) continue;
   
           const norm = ch.normalize("NFKC");
           for (let k = 0; k < norm.length; k++) {
             filteredText += norm[k];
             charMap.push({ node, offset: i });
           }
         }
       }
   
       return { filteredText, charMap };
     }
   
     _wrapRange(range, { token, className } = {}) {
       const el = document.createElement(this.markTag);
       el.setAttribute(this.markAttr, token);
       if (className) el.className = className;
   
       const frag = range.extractContents();
       el.appendChild(frag);
       range.insertNode(el);
       return el;
     }
   }

   // assuming CSS   
   //.mark-donate { background: #ffe082; padding: 0 2px; border-radius: 2px; }
   //.mark-money  { background: #b3e5fc; padding: 0 2px; border-radius: 2px; }
   //.mark-term   { background: #c8e6c9; padding: 0 2px; border-radius: 2px; }

   // exmaple usage:
   //const container = document.getElementById("content");
   //const hl = new HighlighterManager(container);
   //
   //// 規則：priority 越小越先套（也就是越不容易被其他規則搶走）
   //const rules = [
   //  { id: "donate", pattern: /捐.{1,10}兩/g, className: "mark-donate", priority: 1 },
   //  { id: "money",  pattern: /銀[^<]{1,10}兩/g, className: "mark-money",  priority: 2 },
   //  { id: "term",   pattern: "鳩工",            className: "mark-term",   priority: 10 }, // 字串也行
   //];
   //
   //hl.apply(rules);
   
   //重新套用（例如搜尋條件改了）：
   //hl.apply(rules, { clearFirst: true });
   
   //只清掉高亮、不做任何高亮：
   //hl.clear();
   
   //要讓高亮可點、顯示 tooltip...
   //你可以在 apply() 插入 wrapper 後（我有留註解的位置）加事件：
   //
   //wrapper.addEventListener("mouseenter", () => showTip(m));
   //wrapper.addEventListener("mouseleave", hideTip);
   //
   //而且你可以用 wrapper.getAttribute("data-hl") 知道是哪個 rule id。

   // --------------------------------------------------------------
   
   
   function spotComarkusEventTagsInContent(jqHtmlDocContent, comarkusEventElements) {
      // 提醒：因為 MARKUS 和 COMARKUS 之間的命名規則和結構有些差異，加上 M2D/Comarkus2D 進行了一些轉換，
      //       導致並無法「直接」將 Comarkus event element 對回內文，而需進行一些「暴力」比對...
      // 注意：HTML 中，jquery 回傳的 prop("outerHTML") 標籤全小寫，但 prop("tagName") 全大寫？
      // e.g., comarkus event element
      //       {"udefEvtTagName":"Udef_Evt_EVENT_SOURCE_TEXT","comarkusRefId":"#doc_title","markusId":"#xml_metadata","comarkusText":"繁峙縣志: 遷城記", jqComarkusEvent}
      //       {"udefEvtTagName":"Udef_Evt_OBJECT_MAIN","comarkusRefId":"fanshi_cheng","markusId":"eb2f2d8a-327c-44ac-9405-4858a4ae23a3","comarkusText":"wall/繁峙縣城", jqComarkusEvent}
      //       {"udefEvtTagName":"Udef_Evt_TIME","comarkusRefId":"1586-11-16","markusId":"b9685b08-5a3e-442e-8837-67f9e1809f58","comarkusText":"END/是年十月六日", jqComarkusEvent}
      //       {"udefEvtTagName":"Udef_Evt_LOCATION","comarkusRefId":"hvd_95112","markusId":"847e4e75-5301-450d-8d9f-c8227ada9ab8","comarkusText":"繁峙", jqComarkusEvent}
      //       {"udefEvtTagName":"Udef_Evt_INITIATOR","comarkusRefId":"surveillance_commissioner","markusId":"489702cc-ede9-49d1-99fb-6ce8c8cb1746","comarkusText":"按察"
      // => 注意，eventElement 的 udefEvtTagName 前綴是 "Udef_Evt_"，但內文的 tagName 是 "Udef_"（沒有 Evt_）
      //    但 Udef_Evt_TIME, Udef_Evt_LOCATION, Udef_Evt_OBJECT => 內文也不一定是 Udef_TIME, Udef_LOCATION 等
      // e.g., 內文 outerHTML <udef_object refid="markus_fanshi_cheng" 
      //                      tagforconversion="{&quot;markus&quot;:&quot;object&quot;}" 
      //                      term="markus_fanshi_cheng"><span class="udef">繁峙縣城</span></udef_object>
      
      // 2024-10-12: 先一次移除所有 udefMatch 屬性
      //             且若 GlobalVar.udefTagHighlighted 為 false 則一次性隱藏所有 udefInfo
      jqHtmlDocContent.find("span.udef").removeClass("udefMatch");
      if (!GlobalVar.udefTagHighlighted) {
         jqHtmlDocContent.find("span.udefInfo").addClass("hideUdefInfo");
      }

      // 2024-10-12: 沒辦法用單層迴圈「直接」比對，只能用雙層迴圈暴力比對
      //             注意：由於是採雙層迴圈，對於每個 eventElement 都會遍歷所有 span.udef 標籤，
      //                   可能導致某標籤對 element1 滿足比對，卻對 element2 不滿足，
      //                   因此不能在內層迴圈對標籤進行個別 true/false 設定！
      // 注意：一個 event element 可能會對到多個內文標籤（例如多個標記為「民」，相同 RefId 的標籤）
      // 2025-09-15: <span class="udef">
      //             <Udef_work TagForConversion="{&quot;markus&quot;:&quot;work&quot;}"><Udef_object TagForConversion="{&quot;markus&quot;:&quot;object&quot;}">廣濟橋</Udef_object>記</Udef_work>
      //             </span>
      //             會導致 <Udef_Object> 從 event 對不回來...
      comarkusEventElements.forEach(function(eventElement) {
         // { "udefEvtTagName":"Udef_Evt_EVENT",
         //   "comarkusRefId":"construct",
         //   "markusId":"80ab1d0f-dfad-4ead-ae9d-b3f46f2666a6",
         //   "comarkusText":"CONSTRUCTION/construct/建",
         //   "jqComarkusEvent":{"0":{},"context":{},"length":1}
         // }
         //alert(JSON.stringify(eventElement));
         let {udefEvtTagName, comarkusRefId, markusId, comarkusText, jqComarkusEvent} = eventElement;
         jqHtmlDocContent.find("span.udef").each(function() { 
            // e.g., <Udef_TAG><span class="udef"><span class="udefInfo">...</span>詞彙</span></Udef_TAG>
            //$(this).removeClass("udefMatch");
            let jqUdefInfo = $(this).find("span.udefInfo");        // 應該都要存在...
            
            if (GlobalVar.udefTagHighlighted) $(this).addClass("udefOn");
            else $(this).removeClass("udefOn");
            
            // 2025-09-16
            let origText = $(this).text();
            
            let jqHtmlTag = $(this).parent();
            let docTagName = jqHtmlTag.prop("tagName");            // 注意，prop("outerHTML") 的標籤和屬性名稱都會是小寫，但 prop("tagName") 都是大寫！
            let docTagRefId = jqHtmlTag.attr("RefId") || jqHtmlTag.attr("CbdbId");
            if (docTagRefId === undefined) {                       // 2024-12-07: (bug fix) 避免沒有 @RefId, @CbdbId 的 <LocName> 沒被對應到
               let jqClone = jqHtmlTag.clone();
               jqClone.find("span.udefInfo").remove();             // 移除標籤內「額外加上」的 <span class="udefInfo"> 內容
               docTagRefId = jqClone.text();                       // 移除 <span> 後才能取得原標籤內容
            }
            
            // 比對 ComarkusRefId （相當於 HTML event 顯示的 comarkus_refid 屬性）和 HTML text tag 的 RefId，若一致就當作比對成功
            // 2024-11-15: (bug fix) comarkusRefId '張維城|fl1586|b永清' 但 docTagRefId 是 'cbdb_張維城,fl1586,b永清'
            let tagMatch = false;
            let tagMatchTextOnly = false;
            if (docTagRefId == comarkusRefId || docTagRefId == "cbdb_" + comarkusRefId.replace(/[\|]/g,',')
                                             || docTagRefId == "markus_" + comarkusRefId) {
               tagMatch = true;
            }
            
            // 對 <Date> 特別處理（注意因為已經是在 html 範圍進行處理，prop('tagName') 會取得全大寫的字串）
            // 例如 comarkusText := "BEGIN/1767/越二年"
            // 2025-07-11: 加入 <Udef_Duration>
            //if (docTagName == "DATE" || docTagName == 'UDEF_DURATION') {
            if (!tagMatch && GlobalVar.enableMatchingByTagTextOnly) {
               // 2024-10-14
               // text area: <date refid="公元1586年5月18日:明神宗" term="公元1586年5月18日:明神宗"><span class="udef"><span class="udefInfo hideUdefInfo" title="公元1586年5月18日:明神宗">Date</span>丙戌四月朔</span></date>
               // event area: <div comarkus-udeftagname="Udef_Evt_TIME" comarkus-refid="1586-05-18" comarkus-markusid="a9d5441d-7ceb-4681-8c5e-4fbbb4ace47d" comarkus-text="BEGIN/丙戌四月朔"> - BEGIN/丙戌四月朔 (1586-05-18)</div>
               // 需先拷貝一份，移除 udefInfo 後取得文本的文字「丙戌四月朔」，並以此與 event element 的 comarkusText（移除 '/' 前的 prefix）進行比對
               jqTagClone = jqHtmlTag.clone();
               jqTagClone.find("span.udefInfo").remove();
               let tagText = jqTagClone.text();
               
               let comarkusTagParts = comarkusText.split('/');
               //let p = comarkusText.indexOf('/');
               //let eventText = (p >= 0) ? comarkusText.substr(p+1) : comarkusText.substr(3);     // 移除最前方的 " - "
               eventText = comarkusTagParts.pop();                     // "BEGIN/1767/越二年" => "越二年""
               
               // 2025-09-16:
               if (eventText == tagText || eventText == origText) tagMatchTextOnly = true;      // 應該算是 "tagLooseMatch"
            }
            // 是否需額外考慮 <PersonName> with docTagRefId.startsWith("cbdb_")？
            //                <LocName> with docTagRefId.startsWith("hvd_")？
            //alert(jqHtmlTag.prop("outerHTML"));
               
            if (tagMatch || tagMatchTextOnly) {
               $(this).addClass("udefMatch");                            // 內文標籤加上 .udefMatch
               jqComarkusEvent.addClass("eventElementMatch");            // event element 加上 .eventElementMatch

               if (tagMatchTextOnly) {
                  // 2025-07-12
                  $(this).addClass("udefMatchByText");                   // 內文標籤加上 .udefMatchByText
                  jqComarkusEvent.addClass("eventElementMatchByText");   // event element 加上 .eventElementMatchByText           
               }

               // 2024-11-15
               let matchKey = docTagRefId;
               $(this).attr("matchKey", matchKey);
               jqComarkusEvent.attr("matchKey", matchKey);

               // 若預設要顯示 udefInfo...
               //jqUdefInfo.removeClass("hideUdefInfo");             // 顯示 udefInfo
            }
         });
      });
      
      // 2024-11-15: 對 class="eventElementMatch" 的元素註冊事件處理函式
      // 2025-01-23: 注意不能對所有 $("span.eventElementMatch") 註冊，會產生重覆註冊的問題！
      //$("span.eventElementMatch").off("click").on("click", function() {
      jqHtmlDocContent.find("span.eventElementMatch").off("click").on("click", function(evt) {    // spotComarkusEventTagsInContent() 可能被多次呼叫，因此需 .off().on()？
         // 2025-07-12: 不管怎樣，都先從內文移除所有 .tagSpotted .tagSpottedByText 和 .tagSpottedRoughMatch
         jqHtmlDocContent.find("*[matchKey]").removeClass("tagSpotted tagSpottedByText tagSpottedRoughMatch");
         
         // 事件區塊
         if ($(this).hasClass("curElementMatch")) {
            $(this).removeClass("curElementMatch curElementMatchByText");
            return;
         }
         
         // 2025-07-12: 從 event area 移除所有 .curElementMatch 和 curElementMatchByText
         $("span.eventElementMatch").removeClass("curElementMatch curElementMatchByText");
         $(this).addClass("curElementMatch");
         
         // 2025-07-12
         if ($(this).hasClass('eventElementMatchByText')) $(this).addClass('curElementMatchByText');
         
         // 特別用 class="tagSpotted" highlight 出這個元素（Find Event Tags 按鈕會一次高亮事件中的所有對應元素）
         // 需注意的是，若 CSS 是用 .tagSpotted 定義，由於其 priority 會低於 span.udef 之類的定義，addClass("tagSpotted") 將不會生效
         let matchKey = $(this).attr('matchKey'); 
         let comarkusText = $(this).attr('Comarkus-text');            // e.g., "RENOVATION/重修"
         let comarkusTextTail = comarkusText.split('/').pop();        // e.g., "重修"
         
         let found = false;
         jqHtmlDocContent.find("*[matchKey='" + matchKey + "']").each(function() {
            // 注意：matchKey 儲存 tag 的 RefId，例如 matchKey="markus_公元1767年:清高宗"，comarkus-text="BEGIN/1767/越二年"
            //       有時，標記「重修」或「修」的 RefId 都是 markus_renovate，連文字都一起比會更為精準
            let jqClone = $(this).clone();
            jqClone.find("span").remove();         // 移除 <span> 後才能得到內文的原始標記文字，e.g., "六閲月", "越二年"
            let text = jqClone.text();             // 內文標記文字
            if (text === comarkusTextTail) {       // 內文區塊找到符合者
               found = true;
               $(this).addClass("tagSpotted");
               if (jqClone.hasClass('udefMatchByText')) {                 // 2025-07-12
                   // 注意：CSS 必須把 span.tagSpottedByText 放在 span.tagSpotted 後面（後出現設定的會蓋掉前面的）
                  $(this).addClass('tagSpottedByText');
               }
            }
            //if (text === comarkusText) $(this).addClass("tagSpotted");    // 事件區塊找到符合者
         });
         //alert(matchKey + "\n" + comarkusText + "\n" + comarkusTextTail + "\n" + found);
         
         // 防呆：如果「較為詳細的比對」找不到原始標記，就用較為鬆散的比對（僅比對 matchKey）
         if (!found) jqHtmlDocContent.find("*[matchKey='" + matchKey + "']").addClass('tagSpottedRoughMatch');
      });

   }

   function computeAllSpotlightCuesInCorpus(corpus, maxItems = 1000, moveUndefinedToLast = false) {
      // 2024-12-08: 將所有 spotlights 計算出來（之後想試試可否利用 viz tool 一次呈現出這些 spotlights 的 top cues）
      // 回傳的物件 corpusSpotlightCues := { spotlight1: { topCues: {cue1:val1, cue2:val2, ..., cue{n}:val{n}},
      //                                                   cuesAreDisjoint: true/false,
      //                                                   cuesRelations: [ [cue1, cue2, strength], [c1, c2, s], ...],
      //                                                   urlPattern: "...?xxx=...&yyy={cue}",        // 2024-12-16
      //                                                 },
      //                                                   
      //                                     spotlight2: { topCues, cuesAreDisjoint, cuesRelations, urlPattern }, 
      //                                     ... }
      // 其中 spotlight 以 m.XXX, t.XXX, x.XXX 表示（metadata/tags/xa 通通放在一起）
      let corpusSpotlightCues = {};
      cuesMoveToLast = (moveUndefinedToLast) ? ['-', '-9999', '9999'] : [];

      // (1). 藉由 metadataSpotlight 即可取得 metadata spotlight 下的 cue 文件數，以及相關的文件
      //      GlobalVar.filteredResult.metadataSpotlight[corpus][mfield][cue] = { filenames:[...], freq:n }
      let spotlightObj = GlobalVar.filteredResult.metadataSpotlight[corpus];
      let metadataSpotlights = Object.keys(spotlightObj);
      metadataSpotlights.forEach(function(spotlight) {
         // 先將所有 cues 放入陣列，方便排序取出 top n items
         let cueValArray = [];
         for (let cue in spotlightObj[spotlight]) {
            let val = spotlightObj[spotlight][cue].freq;           // 2024-12-07
            cueValArray.push({cue,val});
         }
         sortSpotlightCuesByValsDesc(cueValArray, cuesMoveToLast);
         // 2024-12-08: 取出 top items 後，將結果轉成物件
         let cueValObj = {};
         cueValArray.slice(0, maxItems).forEach(function(item) {
            let {cue, val} = item;
            cueValObj[cue] = val;
         });
         let obj = { topCues: cueValObj,
                     cuesAreDisjoint: true,                        // metadata spotlight
                     cuesRelations: [],                            // (TODO): 目前省去 cues 之間的關係（假設沒有關聯）
                     urlPattern: "",                               // (TODO): 希望是類似 "https://abc/abc?xxx=...&yyy={cue}" 形式，其中 {cue} 將被 topCues 項目取代
                   };
         corpusSpotlightCues['m.'+spotlight] = obj;
      });

      // (2). tags: GlobalVar.filteredResult.tagsSpotlight[corpus][tagName]
      //      tags 後分類和 metadata 後分類，在儲存結構上有一些差異（tags 有額外的 terms，在此不需用到）
      spotlightObj = GlobalVar.filteredResult.tagsSpotlight[corpus];
      let tagsSpotlights = Object.keys(spotlightObj);
      tagsSpotlights.forEach(function(spotlight) {
         cueValArray = [];                                        // 用陣列方便排序，取出 top items 後需轉成 cueValObj
         for (let cue in spotlightObj[spotlight]) {
            // 注意，tags 的 spotlight[cue] 有 freq 和 terms 屬性，在此不需用到 terms
            let val = spotlightObj[spotlight][cue].freq; 
            cueValArray.push({cue,val});                  
         }
         sortSpotlightCuesByValsDesc(cueValArray, cuesMoveToLast);
         // 2024-12-08: 取出 top items 後，將結果轉成物件
         let cueValObj = {};
         cueValArray.slice(0, maxItems).forEach(function(item) {
            let {cue, val} = item;
            cueValObj[cue] = val;
         });
         let obj = { topCues: cueValObj,
                     cuesAreDisjoint: false,                       // tags spotlight
                     cuesRelations: [],                            // (TODO): 目前省去 cues 之間的關係（假設沒有關聯）
                   };
         corpusSpotlightCues['t.'+spotlight] = obj;
      });

      // (3). xa: GlobalVar.filteredResult.xaSpotlight[corpus][xaName]
      //      xa 後分類其實就是一種 tags 後分類，只是在此專案為了可能的擴充（動態將檢索結果的文件加入自訂的 xa.cue）而設置
      //      => 「動態」加上後分類是很複雜的...（另一種實作方式，是在後分類額外加上「是否屬於動態自訂」屬性，但這樣維護起來也不會變簡單）
      //      注意，若 GlobalVar.filteredResult.xaSpotlight 為 {}，GlobalVar.filteredResult.xaSpotlight[corpus] 會是 undefined
      spotlightObj = GlobalVar.filteredResult.xaSpotlight[corpus];
      let xaSpotlights = (spotlightObj) ? Object.keys(spotlightObj) : [];
      xaSpotlights.forEach(function(spotlight) {
         cueValArray = [];
         for (let cue in spotlightObj[spotlight]) {
            // 注意，xa 和 tags 類似，其 spotlight[cue] 有 freq 和 terms 屬性，在此不需用到 terms
            let val = spotlightObj[spotlight].freq;
            cueValArray.push({cue,val});
         }
         sortSpotlightCuesByValsDesc(cueValArray, cuesMoveToLast);
         // 2024-12-08: 取出 top items 後，將結果轉成物件
         let cueValObj = {};
         cueValArray.slice(0, maxItems).forEach(function(item) {
            let {cue, val} = item;
            cueValObj[cue] = val;
         });
         let obj = { topCues: cueValObj,
                     cuesAreDisjoint: false,                       // xa spotlight
                     cuesRelations: [],                            // (TODO): 目前省去 cues 之間的關係（假設沒有關聯）
                   };
         corpusSpotlightCues['x.'+spotlight] = obj;
      });
      
      //alert(JSON.stringify(corpusSpotlightCues));
      return corpusSpotlightCues;
   }

   // --------------------------------
   //        sorting functions
   // --------------------------------
   
   function sortSpotlightCuesByKeysAsc(cueValArray, cuesMoveToLast) {     // cueValArray is a reference
      cueValArray.sort(function(x,y) {
         // x.cue, x.val
         if (cuesMoveToLast.includes(x.cue)) return 1;         // +1: move x afer y
         else if (cuesMoveToLast.includes(y.cue)) return -1;   // -1: move x before y
         if (x.cue < y.cue) return -1;                         // 升冪
         else if (x.cue > y.cue) return 1;
         else return 0;
      });
      //return cueValArray;
   }

   function sortSpotlightCuesByKeysAsIntAsc(cueValArray, cuesMoveToLast) {     // cueValArray is a reference
      cueValArray.sort(function(x,y) {
         // x.cue, x.val
         if (cuesMoveToLast.includes(x.cue)) return 1;         // +1: move x afer y
         else if (cuesMoveToLast.includes(y.cue)) return -1;   // -1: move x before y
         let xInt = parseInt(x.cue);
         let yInt = parseInt(y.cue);
         return (xInt - yInt);                                 // 升冪
      });
   }

   function sortSpotlightCuesByValsDesc(cueValArray, cuesMoveToLast) {
      cueValArray.sort(function(x,y) {
         // x.cue, x.val
         // return (parseInt(b) - parseInt(a));                 // descending
         if (cuesMoveToLast.includes(x.cue)) return 1;
         else if (cuesMoveToLast.includes(y.cue)) return -1;
         return y.val - x.val;                                  // 降冪
      });
   }
   
   // ------------------------------
   //     UI control functions
   // ------------------------------
  
   //$(window).on("click", function() {
   //   SomeButtonClicked = true;
   //});
   
   $("#toolTitle").dblclick(function(evt) {          // 2025-06-09: 改 dblclick
      if (evt.ctrlKey && evt.shiftKey) {             // 2025-01-10: ctrl+shift click
         if (UseLeftSidebar) $("#divLeftSidebar .experimentFeatures").toggle();
         else $(".experimentFeatures").toggle();
         
         // 2025-06-05: 調整左側後分類的位置
         resizeSpotlightColumnDocked();
         
         $("#historyControl").show();                // 注意：歷史記錄還需更多檢驗，先放入實驗模式
      }
   });
   
   $("#corpusSelect").on("change", function(evt) {
      let corpus = $("#corpusSelect:selected").val();
      GlobalVar.prevCorpus = corpus;                   // 2024-09-30
      
      // 更新 spotlight，需注意切換 corpus 後，原 spotlight 可能不存在...
      // 不同文獻集，可能有不同後分類項目，例如 comarkus/immarkus 標籤不同
      updateSpotlightArea(getCurSortDocsBy(), getCurSortDocsOption());

      // 但以下的方式在 doHistoryItem 上可能會出錯...
      //let oldSpotlight = GlobalVar.prevSpotlight;
      //if ($("spotlightSelect").find("option[value='" + oldSpotlight + "']").length == 0) {
      //   let newSpotlight = $("#spotlightSelect option:first").val();    // 自動切到第一項 spotlight
      //   $("#spotlightSelect").val(newSpotlight).trigger("change");      // 2024-10-30: val() 之後還需 trigger()
      //   GlobalVar.prevSpotlight = newSpotlight;
      //   GlobalVar.prevSpotlightCat = 'ALL';                             // 2025-01-24
      //   GlobalVar.prevCueList = [];                                     // 2025-01-22
      //}
      
      // 一併更新相關顯示區塊
      updateResultCorpusSizeAndPagination(getCurSortDocsBy());           // 2025-10-24: 必須加上 sortDocsBy 引數
      updateContentTextAndEvents(true);
      
      // 2024-10-30: 若是原生事件，就加入 history
      if (evt.originalEvent) appendHistoryItem();
   });
   
   $("#spotlightCatSelect").off("change").on("change", function(evt) {
      // 2025-01-25
      let corpus = GlobalVar.prevCorpus;
      let spotlightCat = $(this).find(":selected").val();
      
      // 2025-02-27: 設定 sub-menu (spotlightSelect) 選項
      //             注意：#spotlightCatSelect 和 #spotlightSelect 都是 UI elements，但由於
      //                   這些 UI 元素彼此之間是獨立的，因此可分別設定，不受 async 問題影響
      $("#spotlightSelect option").hide();                         // 先隱藏 sub-menu 所有選項
      let selector = (spotlightCat == 'ALL')
                   ? "#spotlightSelect option"
                   : '#spotlightSelect option[category="' + spotlightCat + '"]';
      // 僅顯示 spotlightCat 所指定的 category 選項
      $(selector).show();
      
      // 2025-02-27: 切換到 sub-menu 預設選項
      // 注意：可能是因為瀏覽器對 <option> 的限制，不能用 :visible 判斷是否可見！
      if (spotlightCat == 'txt_event_tree') {                          // 若主選單項目是 txt_event_tree，則若 sub-menu 以設定為 t.Udef_Evt_EVENT 優先
         selector = '#spotlightSelect option[category="' + spotlightCat + '"][value="t.Udef_Evt_EVENT"]:first';     // 注意 value 要加上 prefix "t."
         if ($(selector).length == 0) selector = '#spotlightSelect option[category="' + spotlightCat + '"]:first';
      }
      else if (spotlightCat !== 'ALL') selector = '#spotlightSelect option[category="' + spotlightCat + '"]:first';
      else selector = "#spotlightSelect option:first";
      //alert($("#spotlightSelect").prop("outerHTML"));
      $(selector).prop("selected", true).trigger("change");        // 可見選項中的第一個項目 -- 主動 trigger 還是比較妥當
      let spotlight = $("#spotlightSelect :selected").val();               // 2025-02-22: (bug fix)
      //alert("Alter spotlightCat: " + spotlightCat + " -- spotlight: " + spotlight);
      
      // 2025-02-21
      if (evt.originalEvent) GlobalVar.prevSpotlightCat = spotlightCat;
      
      // 2025-12-04: 從 (evt.originalEvent) block 移出
      displayCurSpotlightCues(corpus, spotlightCat, spotlight, null);
      
      // (TODO -- 尚未實作): 若 GlobalVar.historySpotlightCatEnabled 且屬於原生事件，就加入 history
      //if (GlobalVar.historySpotlightCatEnabled && evt.originalEvent) appendHistoryItem();
   });

   $("#spotlightSelect").on("change", function(evt) {
      // 應該不需更動 prevSpotlightCat...
      let corpus = GlobalVar.prevCorpus;
      let spotlightCat = GlobalVar.prevSpotlightCat;           // 2025-02-11
      let spotlight = $(this).find(":selected").val();

      // 2025-01-24, 2025-02-21 (bug fix): 只有在 evt.originalEvent 狀況下，才更新 prevSpotlight 並呼叫 displayCurSpotlightCues()
      if (evt.originalEvent) GlobalVar.prevSpotlight = spotlight;

      // 2025-12-04: 必須重新 render spotlight cues
      displayCurSpotlightCues(corpus, spotlightCat, spotlight, null);

      // 2024-10-31: 若 GlobalVar.historySpotlightChangeEnabled 且屬於原生事件，就加入 history
      if (GlobalVar.historySpotlightChangeEnabled && evt.originalEvent) appendHistoryItem();
   });
   
   $("#sortDocsBy").off("change").on("change", function(evt) {
      let sortDocsBy = $(this).find(":selected").val();
      if (sortDocsBy === null) sortDocsBy = 'm.filename';      // 2025-10-26: 防呆
      
      let sortDocsOption = getCurSortDocsOption() || 'asc';
      
      // 2025-10-25: 若 GlobalVar.historySortDocsByEnabled 且屬於原生事件，就加入 history
      if (GlobalVar.historySortDocsByEnabled && evt.originalEvent) appendHistoryItem();
      
      if (GlobalVar.prevSortDocsBy != sortDocsBy) {     
         presentFilteredResult(sortDocsBy, sortDocsOption);   
         if (evt.originalEvent) {
            GlobalVar.prevSortDocsBy = sortDocsBy;
            GlobalVar.prevSortDocsOption = sortDocsOption;
         }
      }
   });
   
   $("#sortDocsOption").off("change").on("change", function(evt) {     // 2026-04-01
      let sortDocsBy = getCurSortDocsBy();
      let sortDocsOption = getCurSortDocsOption();
      if (GlobalVar.prevSortDocsOption != sortDocsOption) {
         presentFilteredResult(sortDocsBy, sortDocsOption);   
         if (evt.originalEvent) {
            GlobalVar.prevSortDocsBy = sortDocsBy;
            GlobalVar.prevSortDocsOption = sortDocsOption;
         }
      }
   });

   // 2026-03-08
   $("#searchRange").on("change", function(evt) {
      GlobalVar.searchRange = $(this).val();
   });

   
   // 2025-10-28
   $("#editQuery").click(function() {
      let query = $("#queryFilter").val();
      $("#queryEditorTextArea").val(query);
      $("#overlayQueryEditor").show();
   });
   
   $("#butQueryEditorOK").click(function() {
      let query = $("#queryEditorTextArea").val();
      $("#queryFilter").val(query);
      $("#overlayQueryEditor").hide();
   });
   
   $("#butQueryEditorCancel").click(function() {
      $("#overlayQueryEditor").hide();
   });
   
   $("#butQueryGo").click(function() {
      showProgressMsg("filtering");                    // 2024-09-25
      
      // GlobalVar.searchRange 設定會動態隨 $("#searchRange").on("change",...) 變化
      //GlobalVar.searchRange = $("#searchRange").val();
      
      // 2025-02-07 (bug fix): 每次新查詢，都需將當前的 spotlightCat 和 spotlight 儲存起來...
      GlobalVar.prevSpotlightCat = $("#spotlightCatSelect option:selected").val();
      GlobalVar.prevSpotlight = $("#spotlightSelect option:selected").val();
      //alert(GlobalVar.prevSpotlightCat + "\n" + GlobalVar.prevSpotlight);

      // 2025-02-21: 注意若 query 僅含 fulltext，應將 prevCueList 設為 []
      GlobalVar.prevCueList = [];
      $("#spotlightCuesList tr input:checked").each(function() {
         let cue = $(this).closest("tr").find("span.cue").text();
         GlobalVar.prevCueList.push(cue);
      });
      //alert("butQueryGo ==> " + JSON.stringify(GlobalVar.prevCueList));

      appendHistoryItem();
      window.setTimeout(() => computeFilteredResultAndPresent(false, getCurSortDocsBy(), getCurSortDocsOption()), 100);
   });

   $("#butQueryReset").click(function() {
      GlobalVar.prevCueList = [];                    // 2025-01-22: prevCorpus, prevSpotlightCat, prevSpotlight 保持不變
      $("#queryFilter").val('');
      appendHistoryItem();
      computeFilteredResultAndPresent(false, getCurSortDocsBy(), getCurSortDocsOption());
   });
   
   $("#butQueryBack").click(function() {
      // 2025-10-29
      $("#butHistoryBackwardItem").click();
      if (GlobalVar.historyEntry <= 1) $("#butQueryBack").hide();
   });
   
   // 2025-11-02
   $("#butAddSearchResult2Bag").click(function() {
      // array_union = [...new Set([...array1, ...array2])];
      GlobalVar.documentBag = [... new Set([...GlobalVar.documentBag, ...GlobalVar.filteredResult.filteredDocFilenameList])];
      $("#documentBagSize").text(GlobalVar.documentBag.length);
      
      // 同步修改當前每一篇文件的 span.butAddDoc2Bag, span.butRemoveDocFromBag
      $("span.butAddDoc2Bag").hide();
      $("span.butRemoveDocFromBag").show();
   });

   // 2025-11-03
   $("#butRemoveSearchResultFromBag").click(function() {
      // 兩個陣列相減：result = a.filter(x => !b.includes(x));
      GlobalVar.documentBag = GlobalVar.documentBag.filter(x => !GlobalVar.filteredResult.filteredDocFilenameList.includes(x));
      $("#documentBagSize").text(GlobalVar.documentBag.length);
      
      // 同步修改當前每一篇文件的 span.butAddDoc2Bag, span.butRemoveDocFromBag
      $("span.butAddDoc2Bag").show();
      $("span.butRemoveDocFromBag").hide();
   });

   $("#butClearBag").click(function() {
      GlobalVar.documentBag = [];
      $("#documentBagSize").text(GlobalVar.documentBag.length);

      // 同步修改當前文件的 span.butAddDoc2Bag, span.butRemoveDocFromBag
      $("span.butRemoveDocFromBag").hide();
      $("span.butAddDoc2Bag").show();
   });

   $("#butFetchDocsFromBag").click(function() {
      if (GlobalVar.documentBag.length > 0) {
         let query = '{' + GlobalVar.documentBag.join('|') + '}';
         $("#queryFilter").val(query);
         $("#butQueryGo").click();
      }
      else {
         alert("Sorry, there is no documents in the bag");
      }
   });
   
   $("#butScrollUp").click(function() {
      // 2024-09-06
      let [docIdx, inView] = getCurViewDocIndexAndTitleInView();
      //docIdx = (docIdx + GlobalVar.curPageDocs - 1) % GlobalVar.curPageDocs;
      
      let pageNumber = GlobalVar.curPageNumber;
      docIdx--;
      if (docIdx < 0) {
         // 注意：若當前在第一頁，pagination 會包含最後一頁的按鈕
         pageNumber = Math.ceil(GlobalVar.curResultSize / GlobalVar.pageSize);        // 最後一頁
         docIdx = GlobalVar.curResultSize - (pageNumber-1) * GlobalVar.pageSize - 1;
      }
      if (pageNumber != GlobalVar.curPageNumber) {
         let prevPageButton = document.querySelector(`li.paginationjs-page[data-num="${pageNumber}"]`);
         if (prevPageButton) prevPageButton.click();      // 需檢查 prevPageButton 以防呆
      }
      scrollToDocIndex(docIdx);
   });

   $("#butScrollDown").click(function() {
      // 2024-09-06: 可從第 n 頁的最後一篇文件「捲」到第 (n+1) 頁的第一篇文件
      let [docIdx, inView] = getCurViewDocIndexAndTitleInView();    // docIdx 是頁面「span.docNumber」陣列的索引
      
      let pageNumber = GlobalVar.curPageNumber;
      docIdx++;
      if (docIdx >= GlobalVar.curPageDocs) {
         // 注意：若當前在最後一頁，pagination 會包含第一頁的按鈕
         if (pageNumber * GlobalVar.pageSize > GlobalVar.curResultSize) pageNumber = 1;
         else pageNumber++
         docIdx = 0;
      }
      if (pageNumber != GlobalVar.curPageNumber) {
         let nextPageButton = document.querySelector(`li.paginationjs-page[data-num="${pageNumber}"]`);
         if (nextPageButton) nextPageButton.click();      // 需檢查 nextPageButton 以防呆
      }
      scrollToDocIndex(docIdx);
   });

   //$("#butHighlightTags").click(function(evt) {
   //   // 2025-01-22: 也許不需 updateContentTextAndEvents()，可直接透過 .addClass(), .removeClass() 達成？
   //   //             注意：更新內容後，color scheme 的設定 class="applyColor" 會被清除...
   //   GlobalVar.udefTagHighlighted = true;
   //   updateContentTextAndEvents(false);                  // 2024-11-23: false 處理後不需捲到第一篇
   //   $(this).hide();
   //   $("#butDeHighlightTags").show();
   //   $("#butApplyColorScheme").show();                   // 2025-01-22: 必須重置這些按鈕...
   //   $("#butApplyDecolorScheme").hide();
   //});
   //
   //$("#butDeHighlightTags").click(function(evt) {
   //   // 2025-01-22: 注意，更新內容後，color scheme 的設定 class="applyColor" 會被清除...
   //   GlobalVar.udefTagHighlighted = false;
   //   updateContentTextAndEvents(false);                  // 2024-11-23: false 處理後不需捲到第一篇
   //   $(this).hide();
   //   $("#butHighlightTags").show();
   //   $("#butApplyColorScheme").show();                   // 2025-01-22: 必須重置這些按鈕...
   //   $("#butApplyDecolorScheme").hide();
   //});
   
   //// 2025-05-14 改用 selectApplyColorScheme
   //$("#butApplyColorScheme").click(function(evt) {
   //   // 2025-01-24
   //   if (!$(this).hasClass("colorApplied")) {
   //      $("span.docNumber").each(function(idx) {                     // 計算處於當前顯示區的文件 index
   //         var trTitle = $(this).parent().parent().parent();
   //         var trContent = $(trTitle).next();
   //         trContent.find(".udef").each(function() {
   //            let jqTag = $(this).parent();                          // 取得 <span class='udef'> 父節點（原始的 udef 節點）
   //            jqTag.addClass("applyColor");
   //         });
   //      });
   //      $(this).addClass("colorApplied");
   //      $(this).text("color & evt_id")
   //      $(this).prop("title", "apply color scheme and show event id")
   //   }
   //   else {
   //      if (!$(this).hasClass("eventIdDisplayed")) {
   //         $("span.docNumber").each(function(idx) {                       // 計算處於當前顯示區的文件 index
   //            var trTitle = $(this).parent().parent().parent();
   //            var trContent = $(trTitle).next();
   //            //trContent.find(".udef").each(function() {
   //               //let jqTag = $(this).parent();                          // 取得 <span class='udef'> 父節點（原始的 udef 節點）
   //               //jqTag.addClass("applyColor");
   //            //});
   //            trContent.find(".udefInfo").removeClass("hideUdefInfo");
   //         });
   //         $(this).addClass("eventIdDisplayed");
   //         $(this).text("-colors")
   //         $(this).prop("title", "remove color and evt_id")
   //      }
   //      else {
   //         $("span.docNumber").each(function(idx) {                       // 計算處於當前顯示區的文件 index
   //            var trTitle = $(this).parent().parent().parent();
   //            var trContent = $(trTitle).next();
   //            trContent.find(".udef").each(function() {
   //               let jqTag = $(this).parent();                            // 取得 <span class='udef'> 父節點（原始的 udef 節點）
   //               jqTag.removeClass("applyColor");
   //            });
   //            trContent.find(".udefInfo").addClass("hideUdefInfo");
   //         });
   //         $(this).addClass("eventIdDisplayed");
   //         $(this).removeClass("colorApplied eventIdDisplayed");
   //         $(this).text("color scheme")
   //      }
   //   }
   //});
   
   // 2025-05-14
   $("#selectApplyColorScheme").change(function(evt) {
      let selectedVal = $(this).val();
      if (selectedVal == 'normalText') {
         // 清除 color，隱藏 udefInfo
         $("span.docNumber").each(function(idx) {                       // 計算處於當前顯示區的文件 index
            var trTitle = $(this).parent().parent().parent();
            var trContent = $(trTitle).next();
            trContent.find(".udef").each(function() {
               let jqTag = $(this).parent();                            // 取得 <span class='udef'> 父節點（原始的 udef 節點）
               jqTag.removeClass("applyColor");
            });
            trContent.find(".udefInfo").addClass("hideUdefInfo");
         });
      }
      else {           // colorScheme, colorSchemeAndRefId
         // 加上 color
         $("span.docNumber").each(function(idx) {                     // 計算處於當前顯示區的文件 index
            var trTitle = $(this).parent().parent().parent();
            var trContent = $(trTitle).next();
            trContent.find(".udef").each(function() {
               let jqTag = $(this).parent();                          // 取得 <span class='udef'> 父節點（原始的 udef 節點）
               jqTag.addClass("applyColor");
            });
         });
         
         // 移除或者加上 udefInfo (2025-05-27 bug fix)
         $("span.docNumber").each(function(idx) {                       // 計算處於當前顯示區的文件 index
            let trTitle = $(this).parent().parent().parent();
            let trContent = $(trTitle).next();
            if (selectedVal == 'colorScheme') trContent.find(".udefInfo").addClass("hideUdefInfo");
            else trContent.find(".udefInfo").removeClass("hideUdefInfo");
         });

      }
   });
   
   // 2025-06-01: 實驗性質...
   $("#butTagTextFilter").click(function(evt) {
      // TODO: utf.Udef_XXX|Udef_YYY:a|b|c => Udef_XXX 或 Udef_YYY 的標籤內容中，包含 a 或 b 或 c （a, b, c 為標籤內容的子字串）
      let corpus = GlobalVar.prevCorpus;
      let spotlights = Object.keys(GlobalVar.dbTagsSpotlightFilenames[corpus]);

      spotlights = spotlights.filter(function(spotlight) {
         let lastPart = spotlight.split('.').pop();
         if (lastPart.startsWith('Genre')) return false;             // 移除 .Genre{Ln} 的後分類項目
         switch (GlobalVar.textFilterOnTerms) {
         case 'allTags': 
            break;
         case 'udefXmarkusTags':
            // Udef_Evt_xxx for comarkus event, Udef_properties_xxx for immarkus properties
            if (spotlight.startsWith('Udef_Evt_') || spotlight.startsWith('Udef_properties_')) break;
            else return false;
         case 'allUdefTags':
            // e.g., Udef_work for entmarkus text annotation
            if (spotlight.startsWith('Udef_')) break;
            else return false;
         default:
            alert("Unknwon text filter condition: " + GlobalVar.textFilterOnTerms);
         }
         return true;
      });
      
      // 2025-05-31: 在 overlay #overlayTagTextFilter 的 #divTagFilterList 呈現可選擇的 tags
      let tagHtmlList = [];
      tagHtmlList.push("<table class='tagFilterList' width='100%'>");
      spotlights.sort().forEach(function(spotlight) {
         let t = spotlight.replace(/Udef_Evt_/,'*')
                          .replace(/Udef_properties_/,'^')
                          .replace(/Udef_DocMeta_/,'#');
         let s = "<tr>"
               + `<td valign="top" width="30px"><input name="inputTagFilter" type="checkbox" value="${spotlight}" checked="checked"></input></td>`
               + "<td valign='top' width='92%'>" + t + "</td>"
               + "</tr>";
         tagHtmlList.push(s);
      });
      tagHtmlList.push("</table>");
      $("#divTagFilterList").html(tagHtmlList);

      $("#overlayTagTextFilter").show();
   });

   $("#butOverlayTagTextFilterApply").click(function() {
      // 2025-05-31: 
      let tags = [];
      let selector = "input[type='checkbox'][name='inputTagFilter']:checked";
      $("#divTagFilterList").find(selector).each(function() {
         tags.push($(this).val());
      });
      let entityTerms = $("#filterTagTerms").val().trim();
      let filter = (tags.length == 0 || entityTerms == '')               // 若指定不完整，就當作空的 filter
                 ? '-'        
                 : tags.join('|') + ':' + entityTerms;
      filter = 'xtf.' + filter;

      if (GlobalVar.enableQueryWithCorpus && GlobalVar.corpusCount > 1) {
         filter = GlobalVar.prevCorpus + '>' + filter;    // 2025-07-25: 注意尚未經過測試...
      }
      
      //alert(filter);
      addQueryFilterAndGo(filter);
      
      $("#overlayTagTextFilter").fadeOut(500);
   });
   
   $("#butOverlayTagTextFilterCancel").click(function() {
      $("#overlayTagTextFilter").hide();
   });
   
   $("#butTagSelectAll").click(function() {
      let selector = "input[type='checkbox'][name='inputTagFilter']";
      $("#divTagFilterList").find(selector).each(function() {
         $(this).prop("checked", true);
      });
   });

   $("#butTagSelectNone").click(function() {
      let selector = "input[type='checkbox'][name='inputTagFilter']";
      $("#divTagFilterList").find(selector).each(function() {
         $(this).prop("checked", false);
      });
   });

   // 2025-04-30
   $("#butHideMetadata").click(function(evt) {
      GlobalVar.curMetadataDisplay = false;               // 按下 hide button 後，display 切換為 false
      $("div.docMetadata, div.imageMetadata").hide();     // 2025-11-20: 加上 div.imageMetadata
      $(this).hide();
      $("#butShowMetadata").show();
   });

   $("#butShowMetadata").click(function(evt) {
      GlobalVar.curMetadataDisplay = true;
      $("div.docMetadata, div.imageMetadata").show();
      $(this).hide();
      $("#butHideMetadata").show();
   });

   // 2025-04-29
   $("#butHideComments").click(function(evt) {
      GlobalVar.curCommentsDisplay = false;     // 按下 hide button 後，display 切換為 false
      $("div.comment").hide();
      $(this).hide();
      $("#butShowComments").show();
   });

   $("#butShowComments").click(function(evt) {
      GlobalVar.curCommentsDisplay = true;
      $("div.comment").show();
      $(this).hide();
      $("#butHideComments").show();
   });
   
   $("#butShowHideEvents").click(function(evt) {
      $("td.docEvents").toggle();
      //let visible = $("td.docEvents").first().is(":visible");
      //if (visible) $("td.docEvents").hide("slide", { direction: "right" }, 600);     // jquery-ui
      //else $("td.docEvents").show("slide", { direction: "right" }, 600);             // jquery-ui
   });
   
   // Invoke DocuSky Viz Tools
   $("#butWordCloudLite").click(function(evt) {
      // set wordArray from cues: [ {name,value,url}, {name,value,url}, ... ]
      // e.g., wordArray = [ {"name":"TEST1", "value":10, "url":null}, 
      //                     {"name":"TEST2", "value":12, "url":null}, 
      //                     {"name":"TEST3", "value":8, "url": null} 
      //                   ];
      // 2024-10-10
      let wordArray = [];
      $("table.spotlightTable td span.cue").each(function() {
         let cue = $(this).text();
         let val = $(this).closest("tr").find("span.val").text();
         let item = { "name":cue, "value":parseInt(val), "url":null };
         wordArray.push(item);
      });
      invokeWordCloudLite(evt, wordArray);
   });

   $("#butYearStatsLite").click(function(evt) {
      // 2024-09-03
      // trend := { title, stats:yearStats }
      // yearStats[yearStr] = { count: parseInt(val) }
      let trendList = [];
      let stats = {};
      $("table.spotlightTable td span.cue").each(function() {
         let cue = $(this).text();
         let val = $(this).closest("tr").find("span.val").text();
         let cueInt = parseInt(cue);                                    // 年份轉為數字
         if (isNaN(cueInt) || cueInt >= 9999 || cueInt <= -9999) ;      // skip
         else {
            if (!stats[cue]) stats[cue] = { "count": parseInt(val) };
         }
      });
      let trend = { title: "Year Distribution",
                    stats,
                  };
      trendList.push(trend);
      let eraLines = "-1100:周;-221:秦;-206:漢;220:;265:晉;581:;618:唐;907:;960:宋;1279:元;1368:明;1644:清;1912:中華民國";
      invokeYearStatsLite(evt, "Year Distribution", trendList, eraLines)
   });
   
   $("#butDocuGisLite").click(function(evt) {
      // 2024-09-02
      let placeIdList = [];
      $("table.spotlightTable td span.cue").each(function() {
         let cue = $(this).text();            // should be "hvd_xxx", "twgis_xxx" （但可能會出現未加上 geocode 的「杉溪」地名）
         let parts = cue.split('/');          // 2025-02-12: 例如 "hvd_xxx/地名" 的狀況，則僅取 '/' 前方的字串
         cue = parts[0];
         if (cue.match(/(hvd|twgis|dila|KoreanPlace|cbdb)_(.*)/)) placeIdList.push(cue);
         else ;                               // non-geocode cue -- skip
      });
      invokeDocuGisLite(evt, placeIdList);
   });
   
   $("#butSelectAllCues").click(function() {
      if (displayedAsTree(GlobalVar.prevSpotlightCat)) {      // 2025-02-16
         GlobalVar.treeJsObj.selectAll();
      }
      else {
         // 2024-09-28
         $("#spotlightCuesList tr input").each(function() {
            $(this).prop("checked", true);
         });
      }
   });

   $("#butInverseSelected").click(function() {
      if (displayedAsTree(GlobalVar.prevSpotlightCat)) {      // 2025-02-16
         GlobalVar.treeJsObj.selectInverse();
      }
      else {
         // 2024-09-28
         $("#spotlightCuesList tr input").each(function() {
            $(this).prop("checked", !$(this).prop("checked"));
         });
      }
   });

   $("#butApplySpotlightCuesFilter").click(function() {                   // 2024-09-29
      // 2025-02-16
      let spotlightCat = $("#spotlightCatSelect option:selected").val();
      let spotlight = $("#spotlightSelect option:selected").val();
      let cueList = [];

      if (GlobalVar.spotlightCatWithTreeUi.includes(spotlightCat) ||      // 2025-12-26
          (GlobalVar.showTagSpotlightCuesAsTree && GlobalVar.prevSpotlightCat == 'text_tags')) {
         // 2025-02-15: 目前直接用 GlobalVar.treeJsObj.values 當作 cueList
         //             (TODO) 若某節點 A 的子節點都被勾選，cueList 應該可以只放 A，略去 A 的子節點... (efficiency issue -- low priority?)
         //alert(JSON.stringify(GlobalVar.treeJsObj.values));
         //alert(JSON.stringify(GlobalVar.treeJsObj.selectedNodes));     // 可取得 checked nodes 的 status (1 表示 partially checked, 2 checked)
         cueList = GlobalVar.treeJsObj.values;
      }
      else {
         // collect cues from checked items
         $("#spotlightCuesList tr input:checked").each(function() {
            // <tr>
            // <td class='chk'><span class='chk'><input type='checkbox' name='chk_[nnn]'></input></span></td>
            // <td class='cue'><span class='cue'>[cue]</span>[xx]</td>
            // <td class='val'><span class='val'>[val]</span>
            // </td></tr>
            let cue = $(this).closest("tr").find("span.cue").text();
            cueList.push(cue);
         });
      }
      
      if (cueList.length == 0) alert("Please check some items before applying filter");
      else {
         // 2025-01-22: 將 cueList 的 cues 勾選起來... （避免 $("#spotlightSelect").on("change") 尚未執行，偷懶用 setTimeout() 方式等一小陣子再去更新）
         GlobalVar.prevCueList = cueList;

         let filter = spotlight + ':' + cueList.join('|');
         if (GlobalVar.enableQueryWithCorpus && GlobalVar.corpusCount > 1) {
            filter = GlobalVar.prevCorpus + '>' + filter;    // 2025-07-25: 注意尚未經過測試...
         }
         
         addQueryFilterAndGo(filter);
      }
   });
   
   // ----------------------------------------------
   //   functions about resizing window/spotlight
   // ----------------------------------------------

   $(window).resize(function() {
      // 調整後分類欄的 docking size
      resizeSpotlightColumnDocked();
   });
   
   function resizeSpotlightColumnDocked() {
      // 2025-06-05: 若 corpus 選單或 tag text filter 可見，就需額外空出一行
      //             但 $("#spanCorpusSelect").is(":visible") 似乎常會誤判（可能是 async 緣故？），因此加上 GlobalVar.corpusCount 判斷
      //             => 目前正常的 C2D/I2D 都應只會產生一個 corpus...
      let extraHeight = ($("#spanCorpusSelect, #spanTagTextFilter").is(':visible') || GlobalVar.corpusCount > 1)
                      ? 24
                      : 0;
      
      // 調整左側後分類的位置
      let offsetHeight = 140 + extraHeight;
      let h = parseInt(window.innerHeight) - offsetHeight - 30;

      $("#spotlightResultDocked").height(h + 'px')
                                 .css({top:offsetHeight+'px'});
      $("#spotlightCuesList, #spotlightCuesTreeJs").height(h + 'px');      // 2025-02-11
      $("#cuesActionBarDocked").css({top:(offsetHeight+h-6)+'px'});        // 2024-09-28, 2025-06-05
      
      if (extraHeight == 0) $("#spotlightFilter").css({'margin-top': '8px'});
      else $("#spotlightFilter").css({'margin-top': '0px'});

      // 2025-06-07: 調整 divContentArea 高度（起因是想產生捲軸...）
      let cssObj = { height: (h+24) + 'px',
                     'overflow-y': 'auto' };
      $("#divContentArea").css(cssObj);

   }

   // -------------------------------------------------------------------------------
   //                  functions to support UI control
   // -------------------------------------------------------------------------------
  
   function addQueryFilterAndGo(filter) {           // 2025-05-31 獨立出來
      // 2026-01-01: 由於加上 ' OR ' operator，能僅以最基礎的方式，將 filter 串接於 query 前方
      //             例如，若原先是 "A OR B"，加上 filter C 的結果應該是 "C and (A OR B)"，
      //             => 不能僅是產生 "C A OR B"，而必須產生 "C A OR C B"
      //let newQuery = filter + ' ' + GlobalVar.filteredResult.query;

      let disjParts = GlobalVar.filteredResult.query.split(' OR ');
      let newQuery = disjParts.map((v) => filter + ' ' + v).join(' OR ');
      
      $("#queryFilter").val(newQuery);
      $("#butQueryGo").click();
   }


   // ----------------------------------------------
   //            scrolling functions
   // ----------------------------------------------

   function windowScrollTop() {
      window.scrollTo({ top: 0,
                        left: 0,
                        behavior: 'smooth'
                      });
   }
   
   function detectTagInView(elem, viewPortOffset) {
      var docViewTop = $(window).scrollTop() + viewPortOffset;
      var docViewBottom = docViewTop + $(window).height();
      var elemTop = $(elem).offset().top;
      var elemBottom = elemTop + $(elem).height();
      var elemTopInView = ((elemTop >= docViewTop) && (elemTop <= docViewBottom));
      var elemBottomInView = ((elemBottom >= docViewTop) && (elemBottom <= docViewBottom));
      var viewContainsElem = (elemTopInView || elemBottomInView || (docViewTop >= elemTop && docViewBottom <= elemBottom));
      return viewContainsElem;
   }

   function getCurViewDocIndexAndTitleInView() {            // 2023-07-21: 獨立出來
      // 2019-02-10: detect which doc is in the current viewport, and determine "next" doc index
      let curViewDocIndex = 0;
      let titleInView = true;
      $("span.docNumber").each(function(idx) {              // 計算處於當前顯示區的文件 index
         var trTitle = $(this).parent().parent().parent();
         var trContent = $(trTitle).next();
         titleInView = detectTagInView($(trTitle).get(0), GlobalVar.reservedScrollTopHeight);
         var contentInView = detectTagInView($(trContent).get(0), GlobalVar.reservedScrollTopHeight);
         var inView =  titleInView || contentInView;
         if (inView) {
            curViewDocIndex = idx;
            return false;         // break the each() loop
         }
      });
      return [curViewDocIndex, titleInView];
   }

   function scrollToDocIndex(docIdx) {                 // 2023-07-21: 獨立出來
      docIdx = parseInt(docIdx);                       // 防呆
      var spotNode = $("tr.docTitle").eq(docIdx);
      var scrollDuration = 800;
      //$(spotNode).addClass('MarkSpot');
      $([document.documentElement, document.body]).animate({
         scrollTop: spotNode.offset().top - GlobalVar.reservedScrollTopHeight        // 上方保留給 banner 和操作功能的寬度 (div.topAreaDocked) 就有 128px，再加上一些空白和前幾行，就先捲到距頂 160px
      }, scrollDuration);
   }

   //// e.g., var node = scrollTextToTagAttrVal('f', '*', '[PersonRefId]', null,  param2);
   ////       setTimeout(function() {       // invoke after blinking
   ////          $(node).click();
   ////       }, 1000);
   //
   //function scrollTextToTagAttrVal(direction, tagName, attrName, val, tagIdx) { 
   //   if (tagIdx !== null && tagIdx !== undefined) {
   //      tagIdx = parseInt(tagIdx);
   //      let m = (direction == 'r') ? 1 : -1;            // 若為 forward/reverse，先將 tagIndex 減一/加一，後續 numSelectedNodes>0 後會加回來
   //      if (tagIdx >= 0) GlobalVar.tagScrollTo.tagIndex = tagIdx + m;
   //   }
   //
   //   if (!tagName) return;                                                    // 2023-09-13: 防呆
   //   var tagNameForSelector = tagName.replace(/\./g,"\\.");                   // 2019-06-02: xml 允許 '.', '-' 字元。欲讓 selector 選擇正確的標籤，需將 '.' 換成 '\.'
   //   var selector = (val === null)                       
   //                ? (tagNameForSelector + attrName)                           // 若 attrName 為 .xyz，則跳過 val 值
   //                : (tagNameForSelector + "[" + attrName + "='" + quoteattr(val) + "']");
   //
   //   var numSelectedNodes = $(selector).length;
   //   if (numSelectedNodes > 0) {
   //      if (direction == 'r') {    // reverse direction
   //         GlobalVar.tagScrollTo.tagIndex = (GlobalVar.tagScrollTo.tagIndex + numSelectedNodes - 1) % numSelectedNodes;
   //      }
   //      else {                     // forward direction (assumed 'f')
   //         GlobalVar.tagScrollTo.tagIndex = (GlobalVar.tagScrollTo.tagIndex + 1) % numSelectedNodes;
   //      }
   //      var spotNode = $(selector).eq(GlobalVar.tagScrollTo.tagIndex);
   //      var scrollDuration = 800;
   //      //alert(JSON.stringify(GlobalVar.tagScrollTo));
   //      
   //      var n = GlobalVar.tagNameToTagSpot[tagName] || 0;
   //      var tagSpotNum = String('000' + n).slice(-2);
   //      $(spotNode).addClass('TagSpot_' + tagSpotNum);     // 2019-06-01: 在 XP 版的 Firefox，class="UdefHighlight TagSpot_00" 可能會導致 spotNode 內容顯示不出來？
   //      $([document.documentElement, document.body]).animate({
   //         scrollTop: spotNode.offset().top - GlobalVar.reservedScrollTopHeight         // 上方保留給 banner 和操作功能的寬度 (div.topAreaDocked) 就有 128px，再加上一些空白和前幾行，就先捲到距頂 160px
   //      }, scrollDuration, function() {
   //         $(spotNode).effect("highlight", {'color':'cyan'}, 500);                      // blink
   //      });
   //      //alert($(spotNode).html());
   //      
   //      return spotNode;
   //   }
   //   else {
   //      let msg = "Warning: this page does not contain content that match the selector: " + selector;
   //      alert(msg);           // 目前先跳出警示，但其實也可以僅呈現在 console.log
   //      //console.log(msg);
   //   }
   //}
   
   
   // ----------------------------------------------------------------------------------
   
   function getFilteredResultAsDocuXml() {
      // 2024-10-30
      let filteredResult = GlobalVar.filteredResult;         // reference
      let corpuses = Object.keys(filteredResult.corpusJqDocFilenameHash);
      //alert(JSON.stringify(corpuses));
      
      let corpusSettingsXmlList = [];
      let docsXmlList = [];
      corpuses.forEach(function(corpus) {
         let corpusDocFilenames = filteredResult.filteredDocFilenameList;
         if (corpusDocFilenames.length == 0) return;              // 篩選後並沒有該文獻集的文件
         //let corpusJqDocs = filteredResult.corpusJqDocFilenameHash[corpus];
         //if (corpusJqDocs.length == 0) return;              // 篩選後並沒有該文獻集的文件
         
         // 2024-11-17: 防呆（有些轉換出的 DocuXml 沒有 corpus settings）
         let settingsXml = (GlobalVar.corpusSettings[corpus] && GlobalVar.corpusSettings[corpus].xml)
                         ? GlobalVar.corpusSettings[corpus].xml
                         : '';
         corpusSettingsXmlList.push(settingsXml);
         
         corpusDocFilenames.forEach(function(docFilename) {
            let jqDoc = filteredResult.corpusJqDocFilenameHash[corpus][docFilename];
            if (!jqDoc) {      // 防呆
               console.log(`Failed to find document from corpus '${corpus}', filename'${docFilename}'`);
               return;
            }
            let jqClone = jqDoc.clone();                            // 先拷貝一份
            jqClone.find("span.udef, mark").each(function() {       // 移除動態加上的 <span class="udef"> 和 <mark class="highlight">
               $(this).replaceWith($(this).html());                 // 移除外圍的標籤
            });
            docsXmlList.push(jqClone.prop("outerHTML"));
         });
      });
      
      let docuXml = '<?xml version="1.0"?>'
                  + '<ThdlPrototypeExport>\n'
                  + corpusSettingsXmlList.join("\n") + "\n"
                  + '<documents>\n'
                  + docsXmlList.join("\n") + "\n"
                  + '</documents>\n'
                  + '</ThdlPrototypeExport>';      
      return docuXml;
   }

   function fillWorksheetsByPostClassificationData(wb) {       // wb: workbook object
      // 匯出的 spreadsheet，其 sheet name 應該是 corpus + spotlight (mfield/tagName) 的組合
      let allSpotlightData = computeAllSpotlightData();        // { corpus: {spotlight: [{cue,df}, {cue,df},...], ... }, ... }
      //alert(JSON.stringify(allSpotlightData));
      
      // 2024-11-06
      for (corpus in allSpotlightData) {
         for (spotlight in allSpotlightData[corpus]) {
            let worksheet = XLSX.utils.json_to_sheet(allSpotlightData[corpus][spotlight]);    // 可將 [{f11,f12,...,f1m}, {f21,f22,...,f2m}, ..., {fn1,fn2,...,fnm}] 展成 n rows，m columns 的表格
            // 將工作表加入工作簿，並命名標籤為 spotlight
            // 注意，sheet names cannot exceed 31 characters，and cannot have duplicate sheet names
            let sheetname = spotlight;
            if (sheetname.length > 30) {
               sheetname = spotlight.substring(0,2) + 'X' + spotlight.slice(-28);     // slice(-28) takes the last 28 chars
            }
            XLSX.utils.book_append_sheet(wb, worksheet, sheetname);
         }
      }
   }
   
   function computeAllSpotlightData() {
      // compute post-classification data
      // input: GlobalVar.filteredResult.metadataSpotlight[corpus][mfield][cue] = { filenames:[...], freq:n }
      //        GlobalVar.filteredResult.tagsSpotlight[corpus][tagName][cue] = { freq, terms }
      // output: { corpus: {spotlight: [{cue:'abc',df:n}, {cue,df}, ...], ... }, ... }

      let allSpotlightData = {};
      for (corpus in GlobalVar.corpusSettings) {
         allSpotlightData[corpus] = computeCorpusSpotlightData(corpus);
      }
      //alert("computeAllSpotlightData\n" + JSON.stringify(allSpotlightData));
      
      return allSpotlightData;
   }
   
   function computeCorpusSpotlightData(corpus) {
      // 從 metadataSpotlight 和 tagsSpotlight 計算 spotlightData
      // ref: GlobalVar.filteredResult.metadataSpotlight[corpus][mfield][cue] = { filenames:[...], freq:n }
      //      GlobalVar.filteredResult.tagsSpotlight[corpus][tagName][cue] = { freq, terms }
      let corpusSpotlightData = {};
      let cueObjList, cueObj, df;

      let corpusMetadataSpotlight = GlobalVar.filteredResult.metadataSpotlight[corpus];    // reference
      for (let mfield in corpusMetadataSpotlight) {
         cueObjList = [];
         for (let cue in corpusMetadataSpotlight[mfield]) {
            df = corpusMetadataSpotlight[mfield][cue].freq;
            cueObj = { cue, df };              // e.g., {"cue":"abc", "df":5 }
            cueObjList.push(cueObj);
         }
         corpusSpotlightData["m."+mfield] = cueObjList;
      }

      let corpusTagsSpotlight = GlobalVar.filteredResult.tagsSpotlight[corpus];            // reference
      for (let tagName in corpusTagsSpotlight) {
         cueObjList = [];
         for (let cue in corpusTagsSpotlight[tagName]) {
            df = corpusTagsSpotlight[tagName][cue].freq;
            cueObj = { cue, df };              // e.g., {"cue":"abc", "df":5 }
            cueObjList.push(cueObj);
         }
         corpusSpotlightData["t."+tagName] = cueObjList;
      }
      
      return corpusSpotlightData;
   }
   
   // -------------------------------------------------
   //    add/remove XaSpotlight from filteredResult
   // -------------------------------------------------
   
   function addXaSpotlight(cues, compObjects = 'term_or_text') {          // term, text, term_or_text
      // 2024-11-10: add <Udef_XaSpotlight Term="cue">cue</Udef_XaSpotlight> to all filtered documents
      // 2024-11-11: 參數改 cues，允許以 "x;y;z" 形式一次新增多個 cues
      const xaName = 'Udef_XaSpotlight';
      let filenameList = GlobalVar.filteredResult.filteredDocFilenameList;
      
      let xaTagList = [];
      let cueList = cues.split(';');
      cueList.forEach(function(cue) {
         cue = cue.trim();
         if (cue == '') return;
         let xaTag = '<' + xaName + ' Term="' + convertToLegalTagAttrValue(cue) + '">'
                   + convertToLegalTagValue(cue)
                   + '</' + xaName + '>';
         xaTagList.push(xaTag);
      });
      //alert(JSON.stringify(xaTagList) + "\n" + JSON.stringify(cueList));
      
      filenameList.forEach(function(docFilename) {
         let jqDoc = GlobalVar.docFilenameJqDocMap[docFilename];
         if (jqDoc.find("Events").length == 0) jqDoc.append("<Events></Events>");
         let jqDocEvents = jqDoc.find("Events").first();
         if (jqDocEvents.find("Udef_XmarkusAnalyzer").length == 0) jqDocEvents.append("<Udef_XmarkusAnalyzer/>");
         let jqDocXa = jqDocEvents.find("Udef_XmarkusAnalyzer").first();
         
         // 如果該標籤原先就已經存有該 cue，在此先將其移除（最後再一次加上所有的 cues）
         jqDocXa.find(xaName).each(function() {
            let pass = false;
            if (compObjects == 'term_or_text' || compObject == 'term') {
               if (cueList.includes($(this).attr("Term"))) {
                  $(this).remove();
                  return;
               }
            }
            else if (compObject == 'text') {
               if (cueList.includes($(this).text())) {
                  $(this).remove();
                  return;
               }
            }
         });
         
         // 將 xaTags 加入文件
         jqDocXa.append(xaTagList.join("\n"));
         
         // 2024-11-10: 同步更新 xaStats， 才能「動態」顯示後分類...
         //             注意：當前頁面還是不會看到這項更動（類似 cache 效果），必須新查詢後才會看到
         //             (TODO) 以後若有時間改進，應可讓頁面也即時更新
         let docCorpus = GlobalVar.docFilenameCorpusMap[docFilename];
         GlobalVar.docDict[docCorpus][docFilename].xaStats = parseDocXaStats(jqDoc, docCorpus);
         addTagInfo2ContentTags(jqDoc);                // 將新加入的標籤加入 content（顯示和互動）
      });

      // 2024-11-10
      // 需藉以下步驟更新 GlobalVar.dbXaSpotlightFilenames[corpus][xaName][cue] = { filenames, freq, terms }
      updateGlobalXaSpotlightVars();
   }

   function removeXaSpotlight(cues, compObjects = 'term_or_text') {
      // 2024-11-10: remove <Udef_XaSpotlight> whose @Term/content value equals <cue> to all filtered documents
      // 2024-11-11: 參數改 cues，允許以 "x;y;z" 形式一次移除多個 cues
      let filenameList = GlobalVar.filteredResult.filteredDocFilenameList;
      filenameList.forEach(function(filename) {
         let jqDoc = GlobalVar.docFilenameJqDocMap[filename];
         if (jqDoc.find("Events").length == 0) jqDoc.append("<Events></Events>");
         let jqDocEvents = jqDoc.find("Events").first();
         if (jqDocEvents.find("Udef_XmarkusAnalyzer").length == 0) jqDocEvents.append("<Udef_XmarkusAnalyzer/>");
         let jqDocXa = jqDocEvents.find("Udef_XmarkusAnalyzer").first();
         
         // 檢查該標籤下的值是否在 cueList 中，若有就進行移除
         jqDocXa.find(xaName).each(function() {
            let pass = false;
            if (compObjects == 'term_or_text' || compObject == 'term') {
               if (cueList.includes($(this).attr("Term"))) {
                  $(this).remove();
                  return;
               }
            }
            else if (compObject == 'text') {
               if (cueList.includes($(this).text())) {
                  $(this).remove();
                  return;
               }
            }
         });
      });
   }

   // ----------------------------------------------
   //          loading progress message
   // ----------------------------------------------

   function showProgressMsg(msg) {
      if (msg) {
         $("#divLoadingContainer").css({top:'30%', left:'40%'}).show();
         $("#divWorkingProgress").text(msg.substring(0,10));    // max 10 characters
      }
   }
   
   function hideProgressMsg() {
      $("#divLoadingContainer").hide();
   }
   
   // ------------------------------------------------
   //         queryHistory （放棄 postActions）
   // ------------------------------------------------
   
   function appendHistoryItem(obj = {}) {
      // 2024-10-28: 取出與當前狀態相關的一些參數，儲存到 GlobalVar.queryHistory
      // (TODO): 若需更改 corpus, spotlight, page (pageSize 固定，不需儲存) 等，就透過 postActions 指定
      let n = GlobalVar.queryHistory.length - GlobalVar.historyEntry;
      if (n > 0) GlobalVar.queryHistory.splice(-n);                                        // 移除後面 n 個項目
      
      // 2024-10-30: 將 corpus 納入 historyItem 的必要屬性（每次計算完畢，都先切換到 corpus，再執行 postActions）
      // 2024-10-31: 將 spotlight 也列入考量，但加上 historySpotlightChangeEnabled 參數來控制（因有不確定性）
      // 2025-12-05: 將 spotlightCat 也加入 history item...
      let spotlight = (GlobalVar.historySpotlightChangeEnabled)
                    ? obj.spotlight || GlobalVar.prevSpotlight || $("#spotlightSelect option:selected").val()
                    : $("#spotlightSelect option:selected").val();
      
      let spotlightCat = (GlobalVar.historySpotlightChangeEnabled)
                       ? obj.spotlightCat || GlobalVar.prevSpotlightCat || $("#spotlightCatSelect option:selected").val()
                       : $("#spotlightCatSelect option:selected").val();
                       
      let historyItem = { dbXml: GlobalVar.docuXmlFilename,                    // 因無法跨越當前資料庫，資料庫的檔名似乎並沒有必要，只是為了完整性先保留
                          corpus: obj.corpus || GlobalVar.prevCorpus
                                             || $("#corpusSelect option:selected").val(),
                          searchRange: GlobalVar.searchRange,                  // 2026-03-08
                          query: obj.query || $("#queryFilter").val(),
                          spotlightCat,
                          spotlight,
                          postActions: obj.postActions || [],
                          curTextStyling: getCurTextStyling(),                 // 2025-07-17
                          curSortDocsBy: getCurSortDocsBy(),                   // 2025-10-24
                          curSortDocsOption: getCurSortDocsOption(),           // 2026-04-01
                        };
      
      //alert("add HistoryItem: " + JSON.stringify(historyItem));
      GlobalVar.queryHistory.push(historyItem);
      GlobalVar.historyEntry = GlobalVar.queryHistory.length;
      
      updateHistoryQueue();                    // 2024-10-30
      //console.log(GlobalVar.queryHistory);   // for debugging

      // 2025-10-29
      let showButQueryBack = (!GlobalVar.enableQueryHistory && !GlobalVar.historyPagingEnabled && 
                              !GlobalVar.historySpotlightChangeEnabled && !GlobalVar.historySortDocsByEnabled);
      if (showButQueryBack && GlobalVar.historyEntry > 1) $("#butQueryBack").show();
   } 
   
   function updateHistoryQueue() {
      $("#historyCount").text(GlobalVar.historyEntry + "/" + GlobalVar.queryHistory.length);
   }
   
   function doHistoryItem(historyIdx = 0) {
      // TOFIX: 若文獻集數量大於一，doHistoryItem() 之後，後分類的顯示可能會出問題！
      if (historyIdx < 0 || historyIdx >= GlobalVar.queryHistory.length) return;

      let historyItem = GlobalVar.queryHistory[historyIdx];
      //alert(JSON.stringify(historyItem));

      // 在計算前，就先取出當前「最後」的 menu 選項（計算後連 GlobalVar.prevSpotlight 等變數都會被覆蓋）
      let spotlightCat = $("#spotlightCatSelect").val();           // 基本上，"undo" 後，後分類區會呈現最後的項目
      let spotlight = $("#spotlightSelect").val();

      // 2025-10-24: 若「上一步/下一步」與當前的 query 與 spotlight 相同，其實應不需重新計算，
      //             但為了方便管理狀態，這裡還是全部重新計算...
      // 注意：computeFilteredResultAndPresent() 重新計算後，更新 pagination 會啟動其 callback 程序，完成後會將 paginationCallbackInvokded 設為 true      
      $("#queryFilter").val(historyItem.query);
      GlobalVar.paginationCallbackInvokded = false;
      computeFilteredResultAndPresent(false, historyItem.curSortDocsBy, historyItem.curSortDocsOption);
      
      let timerId;
      let retryCount = 0;
      timerId = setInterval(function() {
         if (GlobalVar.paginationCallbackInvokded) {
            clearInterval(timerId);                                  // 馬上清除 retry timer
            let corpus = historyItem.corpus || GlobalVar.prevCorpus;
            $("#corpusSelect").val(corpus);
            if ($("#corpusSelect").val() === corpus) $("#corpusSelect").trigger("change");          // 2024-10-30: 注意：在此觸發 "change" 卻不應產生新的 historyItem

            // 2025-12-05: 若文獻集數量大於一，或者在「更動 spotlight menu 也會記錄到 history」的狀況下，才會切換 spotlightCat 和 spotlight
            if (Object.keys(GlobalVar.filteredResult.corpusJqDocFilenameHash).length > 1 || GlobalVar.historySpotlightChangeEnabled) {
               spotlightCat = historyItem.spotlightCat; 
               spotlight = historyItem.spotlight;
            }
      
            // 2025-12-05
            $("#spotlightCatSelect").val(spotlightCat);
            if ($("#spotlightCatSelect").val() === spotlightCat) $("#spotlightCatSelect").trigger("change");
                              
            if (spotlight != '') {
               setTimeout(function() {
                  GlobalVar.prevCueList = [];                       // 2025-01-22: 目前先總是將其清空 (TODO): historyItems 或可加入 prevCueList 資訊... 
                  $("#spotlightSelect").val(spotlight);             // 可以跟 postActions 非同步執行
                  if ($("#spotlightSelect").val() === spotlight) $("#spotlightSelect").trigger("change");
                  setTimeout(function() {
                     // 2025-12-05: 需呼叫 displayCurSpotlightCues() 將 txt_event_tree 的 a/b/c 改成樹狀結構
                     displayCurSpotlightCues(corpus, spotlightCat, spotlight, null);    // computeFilteredResultAndPresent() 可能會重設 spotlightCat？
                     doPostActions(historyItem.postActions);
                  }, 50);
               }, 30);
            }
            
            // 2026-03-08 
            $("#searchRange").val(historyItem.searchRange);
            
            applyCurTextStyling(historyItem.curTextStyling);       // 2025-07-17: (TODO) 尚未檢測
            
         }
         else {
            retryCount++;
            if (retryCount > 50) {
               clearInterval(timerId);
               alert("Error: too busy to execute the history action");
            }
         }
      }, 200);
   }
   
   function doPostActions(actions) {      // actions is an array
      // 注意：若 actions 包含多項動作，必須確保前一項執行完，才能執行後一項
      // (TODO) 只是先留著，暫時應該不會實作
      if (actions.length > 0) doFirstPostAction(actions);
   }
   
   function doFirstPostAction(actions) {
      // e.g., 跳到第幾頁
      let action = actions.shift();
      let actionKeys = Object.keys(action);
      actionKeys.forEach(function(actionKey) {         // 通常應該只有一項（僅在「可非同步執行」時才能允許多項併存）
         // 2024-10-29 (TODO) xxyyzz
         switch(actionKey) {
         case "page":
            let n = parseInt(action[actionKey]);
            if (isNaN(n) || n<1) n = 1;
            GlobalVar.paginationCallbackInvokded = false;
            GlobalVar.jqPagination.pagination('go', n);        // 跳到第 n 頁
            break;
         default:
            alert("Unrecognized action key: " + actionKey);
         }
      });
      
      // 為了簡單，不做 loop 了
      if (actions.length > 0) {
         window.setTimeout(function() {
            doFirstPostAction(actions);
         }, 300);
      }
   }
   
   $("#butHistoryBackwardItem").click(function() {
      GlobalVar.historyEntry--;
      if (GlobalVar.historyEntry < 1) {             // 無法再往前
         GlobalVar.historyEntry = 1;                // 第一項（載入後，就應至少有一項）
         return;
      }
      doHistoryItem(GlobalVar.historyEntry - 1);
      updateHistoryQueue();                         // 2024-10-30
   });

   $("#butHistoryForwardItem").click(function() {
      GlobalVar.historyEntry++;
      if (GlobalVar.historyEntry > GlobalVar.queryHistory.length) {
         GlobalVar.historyEntry = GlobalVar.queryHistory.length ;
         return;
      }
      doHistoryItem(GlobalVar.historyEntry - 1);
      updateHistoryQueue();                        // 2024-10-30
   });

   // ----------------------------------------------
   //                 載入或儲存
   // ----------------------------------------------
   
   $("#loadDocuXmlFile").on("change", function(evt) {    // 2024-08-08
      // 獲取檔案輸入元素
      const fileInput = document.getElementById('loadDocuXmlFile');
      if (fileInput.files.length === 0) return;          // 確保選擇了檔案

      // 2026-02-06: show progress before loading (particularly for large data files)
      showProgressMsg("Loading...");
      
      // 獲取選擇的檔案（只能載入單一檔案，該檔名會被視為 db name）
      const file = fileInput.files[0];
      let filename = file.name;

      GlobalVar.docuXmlFilename = filename;              // 2024-10-30
      GlobalVar.dbName = GlobalVar.docuXmlFilename;      // 2025-10-28
      $("#dbName").text(GlobalVar.dbName);               // 2024-08-25
      
      const reader = new FileReader();
      reader.onload = function(evt) {
         parseDocuXmlStr(evt.target.result);
         hideProgressMsg();
      };

      // 定義檔案讀取錯誤的處理邏輯（正常應該不需要）
      reader.onerror = function() {
          alert('檔案讀取錯誤');
      };

      // 讀取檔案為文字格式
      reader.readAsText(file);
   });
   
   // 2024-11-03: 加上 function buttons, 
   //             e.g., #funcButLoadDocuXmlFile, #funcButExportPostClassification, #funcButSaveFile
   $("#butLoadDocuXmlFile, #funcButLoadDocuXmlFile").click(function(evt) {
      $("span.highlightAtStart").removeClass("highlightAtStart");     // 2025-06-05
      $("#loadDocuXmlFile").click();            // 觸發 <input type="file"> 的「讀取檔案」機制
   });
   
   // -------------------------------------------------
   
   // -------------------------------------------------
   
   $("#butConfig").click(function() {
      // 2024-11-25: (TODO) 測試... xxyyzz
      $("#divConfigBox").show();
   });
   
   $("#butLoadSpotlightCuesUnificationMapFile").click(function(evt) {
      $("#loadSpotlightCuesUnificationMapFile").click();            // 觸發 <input type="file"> 的「讀取檔案」機制
   });
   
   // 2024-11-26: 讀取 spotlight cue-unification mapping 檔   
   $("#loadSpotlightCuesUnificationMapFile").on("change", function(evt) {
      // 獲取檔案輸入元素（僅允許匯入單一 unification map 檔）
      const fileInput = document.getElementById('loadSpotlightCuesUnificationMapFile');
      if (fileInput.files.length === 0) return;             // 確保選擇了檔案

      // 獲取選擇的檔案
      const file = fileInput.files[0];
      const filename = file.name;
      const reader = new FileReader();

      // 定義檔案讀取完成後的處理邏輯
      reader.onload = function(event) {
         parseSpotlightCuesUnificationMapFile(event.target.result);
      };

      // 定義檔案讀取錯誤的處理邏輯（正常應該不需要）
      reader.onerror = function() {
          alert('檔案讀取錯誤');
      };

      // 讀取檔案為文字格式
      reader.readAsText(file);
   });
  
   $("#butCloseConfigBox").click(function() {
      $("#divConfigBox").fadeOut(600);
   });
   
   $("#butTEST").click(function(evt) {
      alert("測試用 -- 目前沒作用");
      //exportTwoDimTable();               // 輸出 excel 的 2-dim table
      //exportDocSpotlightsTable();
      //invokeSpotlightSparkLite();
   });
   
   $("#butTwoDimTable").click(function(evt) {
      // 注意：exportTwoDimTable() 和 invokeTwoDimTableLite() 都會呼叫 computeTwoDimObj()，並「吃掉」兩個 query spotlights
      let exportJson = (evt.ctrlKey) ? true : false;
      invokeTwoDimTableLite(exportJson);
   });
   
   $("#butSpotlightSpark").click(function(evt) {
      let maxCues = GlobalVar.addon.spotlightSparkMaxCues;            // 2024-12-16
      let curCorpus = GlobalVar.prevCorpus;
      let spotlightCues = computeAllSpotlightCuesInCorpus(curCorpus, maxCues, true);
      //alert(JSON.stringify(spotlightCues));
      
      // export
      let today = (new Date()).yyyymmdd();
      
      // 2024-12-11
      let labelKeyMap = {};
      Object.keys(GlobalVar.corpusSettings[curCorpus].metadataFieldSettings).forEach(function(v) {
         // 注意：目前僅 metadata 有這樣的對應表... e.g., v := 'AU', v:='COMP'
         labelKeyMap['m.'+v] = GlobalVar.corpusSettings[curCorpus].metadataFieldSettings[v].label;
      });
      
      let spotlightSparksObj = { 'metadata': { 'creator': 'XmarkusAnalyzer',
                                               'date': today,
                                               'database': GlobalVar.dbName,        // 2025-10-28: 注意，在 X-MARKUS 中，dbName 其實就是 docuXmlFilename
                                               'corpus': GlobalVar.prevCorpus,
                                               'filter': GlobalVar.filteredResult.query,
                                               'resultSize': GlobalVar.filteredResult.filteredDocFilenameList.length,
                                               'maxCues': maxCues,
                                               labelKeyMap,             // 2024-12-11: optional 
                                             },
                                 'data': spotlightCues,
                               };
                    
      if (evt.altKey) {
         // export
         let outFilename = today + "-XA-SpotlightSpark-maxCues(" + maxCues + ").json";
         let mimeType = "application/json";
         exportMimeFile(outFilename, mimeType, JSON.stringify(spotlightSparksObj));
      }
      else {
         // 2024-12-15
         let newWin = (evt.ctrlKey) ? true : false;
         invokeSpotlightSparkLite(evt, spotlightSparksObj, newWin);
      }
   });
   
   //$("#butInvokeEventRelLiteAndPostMessage, #funcButInvokeEventRelLiteAndPostMessage").click(function() {
   $("#butInvokeEventConnectionGraphAndPostMessage, #funcButInvokeEventConnectionGraphAndPostMessage").click(function() {
      let xml = getFilteredResultAsDocuXml();
      
      // 2025-02-10: 防呆檢查，若沒有 events 就顯示訊息並跳出
      let xmlDoc = $.parseXML(xml);
      let jqXml = $(xmlDoc);
      if (jqXml.find("Events").length == 0) {
         alert("Sorry, there is no events in the filtered result");
         return;
      }
      
      // 2025-02-20: 調整訊息格式，改為 source, target, parameters, type, message 五項參數
      let json = { source: "XmarkusAnalyzer",
                   target: "EventConnectionGraph",              // "EventRelLite",
                   parameters: [],
                   type: "DocuXml",
                   message: xml,
                 };

      if (EnableMessageViaParent) {                // 2025-05-27
         window.parent.postMessage(json, '*');     // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
      }
      else {
         // 2024-10-31: 透過 postMessage 傳遞 DocuXml（字串形式）到應用程式
         //startNewWindow('EventRelLite.html', '_blank');
         startNewWindow('EventConnectionGraph.html', '_blank');
      }
   });
   
   $("#butInvokeMundaAndPostMessage, #funcButInvokeMundaAndPostMessage").click(function(evt) {
      alert("TODO -- invoke MUNDa");
   });
   
   $("#butAddRemoveXaTagsToFilteredDocs, #funcButAddRemoveXaTagsToFilteredDocs").click(function(evt) {
      // 2024-11-11: 先用 prompt() 簡單實作，日後若真想提供 XaSpotlight 功能，應需客製一個 dialog subwindow
      //let cues = prompt("Enter the XaSpotlight cue name to be applied to all filtered documents");
      //if (cues===null && cues.trim()!='') return;
      //addXaSpotlight(cues, 'term_or_text');
      showXaSpotlightPanel();
   });
   
   $("#doXaSpotlightAddRemove").click(function() {
      // (TODO) xxyyzz
      let radioVal = $("input[name='radioAddRemoveXaSpotlight']:checked").val();
      if (radioVal == "add") {
         let cues = $("#inputXaSpotlightCues").val();
         if (cues) addXaSpotlight(cues);
      }
      else if (radioVal == "remove") {
         alert("TODO -- doXaSpotlightAddRemove -- remove");
      }
      else alert("Unknown radio value: " + radioVal);
      hideXaSpotlightPanel();
   });
   
   $("#cancelXaSpotlightAddRemove").click(function() {
      hideXaSpotlightPanel();
   });
   
   $("#butExportDocSpotlightTable, #funcButExportDocSpotlightTable").click(function() {
      // 2024-11-22
      exportDocSpotlightsTable();
   });
   
   $("#butExportPostClassification, #funcButExportPostClassification").click(function(evt) {
      // 創建一個新的工作簿
      const wb = XLSX.utils.book_new();

      // 將後分類數據填入工作表
      fillWorksheetsByPostClassificationData(wb);

      // 將工作簿寫入 Excel 檔案
      let filteredSize = GlobalVar.filteredResult.filteredDocFilenameList.length;
      let outFilename = (new Date()).yyyymmdd() + "-XA-postClassification(" + filteredSize + ").xlsx";
      XLSX.writeFile(wb, outFilename);
   });

   $("#butSaveFile, #funcButSaveFile").click(function(evt) {
      // 2024-10-31
      let xml = getFilteredResultAsDocuXml();
      let filteredSize = GlobalVar.filteredResult.filteredDocFilenameList.length;
      let outFilename = (new Date()).yyyymmdd() + "-XA-export(" + filteredSize + ").xml";
      let blob = new Blob([xml], {type:"application.xml"});
      saveAs(blob, outFilename);
   });
   
   // -------------------------------------------------

   function showXaSpotlightPanel() {
      // 2024-11-12
      $("#overlay").show();
      $("#divXaSpotlightSmallPanel").fadeIn();
   }
   
   function hideXaSpotlightPanel() {
      // 2024-11-12
      $("#overlay").hide();
      $("#divXaSpotlightSmallPanel").fadeOut();
   }
   
   function startNewWindow(url, title, ms = 2000) {        // 2025-02-20
      let newWindow = window.open(url, title);
      window.setTimeout(function() {
         if (newWindow) {
            // 2025-01-11: 若處於 file:// 協定，postMessage() 將因 XSS 錯誤而無法送達
            newWindow.postMessage(json, '*');    // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
         }
         else console.log("Error: newWindow not ready");
      }, ms);
   }
   
   // --------------------------------------------------------------
   //        呼叫 YearStatsLite, DocuGisLite, WordCloudLite
   // --------------------------------------------------------------
   
   // 以下程式碼拷貝自 DocuSky，再依照 XmarkusAnalyer 特性進行小修改
   
   var showUrlIframe = function(evt, url, title, postAction, width, height, backgroundColor = '#EFEFEF') {
      let timestamp = (new Date()).getTime();
      let subwinContainerId = "subwinContainer_" + timestamp;           // 2018-10-28
      let titleBarId = "titleBar_" + timestamp;
      let postActionStr = (postAction) ? postAction : '';
      
      let iframeId = "iframe_" + timestamp;
      // fa-window-close, fa-times, fa-times-circle
      // style='text-align:center; padding:2px 4px; background-color:#BFBFBF; color:black; cursor:pointer;
      let s = "<div id='" + subwinContainerId + "' class='sub-window' x-post-action='" + postActionStr + "' style='display:none; width:" + (width+4) + "px; z-index:" + (GlobalVar.subwinZindex++) + "'>"
            + "<table id='" + titleBarId + "' class='titleBar' width='100%' cellpadding='0' cellspacing='0'>"
            + "<tr class='x-sub-window-title-bar-xmarkus' style='width:" + width + "px; padding-right:5px;'>" 
            + "<td align='left' class='sub-window-title-bar-xmarkus' style='color:white; padding:3px 8px; border-top-left-radius:10px;'>" + title + "</td>"
            + "<td align='right' class='sub-window-title-bar-xmarkus' valign='top' width='100' style='border-top-right-radius:10px;'>" 
            + "<span class='extendSubwinContainer' style='padding-right:8px; cursor:pointer;' x-containerId='" + subwinContainerId + "'><i class='fa-solid fa-window-maximize' style='font-size:1.3em; padding-top:6px;'></i></span>"       // <i class='fas fa-external-link-alt'></i>
            + "<span class='restoreSubwinContainer' style='display:none; padding-right:8px; cursor:pointer;' x-containerId='" + subwinContainerId + "'><i class='fa-solid fa-window-restore' style='font-size:1.3em; padding-top:6px;'></i></span>"       
            + "<span class='closeSubwinContainer' style='padding-right:8px; cursor:pointer;' x-containerId='" + subwinContainerId + "'><i class='fa fa-window-close' style='font-size:1.3em; padding-top:6px;'></i></span>"
            + "</td>"
            + "</tr></table>"
            + "<iframe id='" + iframeId + "' src='javascript:void(0)' style='width:" + width + "px; height:" + height + "px; background-color:#FFFFFF; border:1px solid #FFFFFF; border-bottom-left-radius:16px; border-bottom-right-radius:16px;'>"
            + "</iframe>"
            + "</div>";
            
      openSubWindow(evt, subwinContainerId, iframeId, titleBarId, s);
      
      window.setTimeout(() => $("#" + iframeId).attr('src', url), 250);     // 2019-11-21: 等 250ms 再設定 src
                    
      return iframeId;
   };
   
   // 2025-03-08
   var showDivHtml = function(evt, width, height, title, contentHtml) {
      let timestamp = (new Date()).getTime();
      let subwinContainerId = "subwinContainer_" + timestamp;       // 2025-03-08
      let divContentId = "divContent_" + timestamp;           // 2025-03-08
      let titleBarId = "titleBar_" + timestamp;
      
      // fa-window-close, fa-times, fa-times-circle
      // style='text-align:center; padding:2px 4px; background-color:#BFBFBF; color:black; cursor:pointer;
      let divHtml = "<div id='" + subwinContainerId + "' class='sub-window' style='display:none; width:" + (width+4) + "px; height:" + (height+24) + "px; z-index:" + (GlobalVar.subwinZindex++) + "'>"
                  + "<table id='" + titleBarId + "' class='titleBar' width='100%' cellpadding='0' cellspacing='0'>"
                  + "<tr class='x-sub-window-title-bar-xmarkus' style='width:" + width + "px; padding-right:5px;'>" 
                  + "<td align='left' class='sub-window-title-bar-xmarkus' style='color:white; padding:3px 8px; border-top-left-radius:10px;'>" + title + "</td>"
                  + "<td align='right' class='sub-window-title-bar-xmarkus' valign='top' width='75' style='border-top-right-radius:10px;'>" 
                  + "<span class='extendSubwinContainer' style='padding-right:8px; cursor:pointer;' x-containerId='" + subwinContainerId + "'><i class='fa-solid fa-window-maximize' style='font-size:1.3em; padding-top:6px;'></i></span>"       // <i class='fas fa-external-link-alt'></i>
                  + "<span class='restoreSubwinContainer' style='display:none; padding-right:8px; cursor:pointer;' x-containerId='" + subwinContainerId + "'><i class='fa-solid fa-window-restore' style='font-size:1.3em; padding-top:6px;'></i></span>"       
                  + "<span class='closeSubwinContainer' style='padding-right:8px; cursor:pointer;' x-containerId='" + subwinContainerId + "'><i class='fa fa-window-close' style='font-size:1.3em; padding-top:6px;'></i></span>"
                  + "</td>"
                  + "</tr></table>"
                  + "<div id='" + divContentId + "' class='sub-window-div'>"               // 2025-03-09 修 sub-window-div （加上 overflow-y:scroll 捲軸）
                  + contentHtml
                  + "</div>"
                  + "</div>";
            
      openSubWindow(evt, subwinContainerId, divContentId, titleBarId, divHtml);
      
      // 2025-03-11: 在 openSubWindow() render divHtml 後，必須註冊 image onload，才能替 svg 加上 viewbox
      $('#' + subwinContainerId).find('image').on('load', function() {
         setSvgViewboxImageOnload($(this));
      });
      
      return divContentId;
   };
   
   function openSubWindow(evt, subwinContainerId, subwinContentId, titleBarId, subwinHtml) {
      // 2025-03-08
      $("#subwinArea").append(subwinHtml);                  // 注意：subwinArea 允許同時存在多個 sub-window
      
      // Pop a div to the front
      $("#subwinArea").parent().append($("#subwinArea"));
      
      let jqSubwinContainer = $('#' + subwinContainerId);
      let jqSubwinContent = $('#' + subwinContentId);
      
      //$("#" + closeContainerButId).click(() => jqSubwinContainer.remove());
      jqSubwinContainer.find("span.closeSubwinContainer").click(function(evt) {
         jqSubwinContainer.fadeOut(400, function() { $(this).remove(); });
      });
      
      //jqSubwinContainer.find("span.externalLink").click(function(evt) {
      //   let newWinUrl = $(this).attr("x-url");
      //   window.open(newWinUrl, "_blank");
      //});

      jqSubwinContainer.find("span.extendSubwinContainer").click(function(evt) {
         // 2025-03-10
         let restorePosition = jqSubwinContainer.offset();                    // offset() 和 position() 只有 top, left 訊息，前者回傳 absolute position
         let restoreWidth = jqSubwinContainer.outerWidth();
         let restoreHeight = jqSubwinContainer.outerHeight();
         //alert(JSON.stringify(restorePosition));

         let css = { position: 'fixed',                  // 2025-03-09
                     top: '0px',                         // 因為要放到當前視窗位置的 (0,0)，所以採 'position:fixed'
                     left: '0px',
                     width: (window.innerWidth - 4) + 'px',
                     height: (window.innerHeight - 4) + 'px',
                   }
         //$("#" + $(this).attr('x-containerId')).css(css);
         jqSubwinContainer.css(css)
                          .attr('restore-position', 'absolute')
                          .attr('restore-top', Math.floor(restorePosition.top))         // 取整數
                          .attr('restore-left', Math.floor(restorePosition.left))
                          .attr('restore-width', Math.floor(restoreWidth))
                          .attr('restore-height', Math.floor(restoreHeight));

         // 裡頭的 title bar 和 content window 也需自己去調整大小
         jqSubwinContainer.find("table.titleBar").width('100%');
         
         css = { width: window.innerWidth - 4,
                 height: window.innerHeight - 4 - 20,
               }
         jqSubwinContent.css(css);

         jqSubwinContainer.find('span.extendSubwinContainer').hide();
         jqSubwinContainer.find('span.restoreSubwinContainer').show();
      });

      jqSubwinContainer.find("span.restoreSubwinContainer").click(function(evt) {
         // 2025-03-10: (bug fixed)
         let css = { position: 'absolute',
                     top: jqSubwinContainer.attr('restore-top') + 'px',
                     left: jqSubwinContainer.attr('restore-left') + 'px',
                     width: jqSubwinContainer.attr('restore-width'),
                     height: jqSubwinContainer.attr('restore-height'),
                   };
         //alert(JSON.stringify(css));
         jqSubwinContainer.css(css);

         jqSubwinContainer.find("table.titleBar").width('100%');
         css = { width: jqSubwinContainer.attr('restore-width'),
                 height: jqSubwinContainer.attr('restore-height') - 20,
               }
         jqSubwinContent.css(css);

         jqSubwinContainer.find('span.restoreSubwinContainer').hide();
         jqSubwinContainer.find('span.extendSubwinContainer').show();
      });

      var resizeOption = { alsoResize: "#" + subwinContentId,
                           minWidth: 600,
                           minHeight: 480 };
      
      var dragOption = { handle: '#' + titleBarId,                   // 2021-07-21
                         opacity: 0.7,                               // 2025-03-06
                         containment: "window",                      // 2025-03-05
                         //drag : function(e, ui) {
                         //         if (ui.position.left < 0) ui.position.left = 0;
                         //         if (ui.position.top < 0) ui.position.top = 0;
                         //       },
                         start: function(e) { jqSubwinContainer.css('z-index', GlobalVar.subwinZindex++); },
                         stop:  function(e) { },
                       };                 

      // 2023-07-02
      let leftOffset = 10, topOffset = 10;
      if (!evt.originalEvent) {                                   // 2023-06-28: 非「原生驅動」，使用者動作所觸發的事件
         let cnt = $("#subwinArea div.sub-window").length;           // 注意：div.sub-window 內可以是 iframe 或 div
         leftOffset += cnt * 20 - 30;
         topOffset  += cnt * 20 - 45;
      }

      // 2025-03-05: 已透過 dragOption，加上「防止拖曳超過視窗」的防呆機制...
      jqSubwinContainer.show()                           //.fadeIn(800)
                       .draggable(dragOption)
                       .resizable(resizeOption)          // 2024-11-12: 需引入 jquery-ui.min.css，否則會無效
                       .position({ my:"left+" + leftOffset + " top+" + topOffset, 
                                   at:"center bottom", 
                                   of:evt,
                                   collision:"fit"});
   }
   
   // 2024-10-09: word cloud lite
   var invokeWordCloudLite = function(evt, wordArray) {
      var url = DocuSkyHost + "/docuTools/WordCloudLite/WordCloudLite.html";
      let evtAlt = (evt.originalEvent) ? evt : $(this);
      var backgroundColor = '#FFFFFF';
      let iframeTitle = "WordCloud Lite";
      let postAction = null;
      let w = 720;
      let h = 450;
      
      var iframeId = showUrlIframe(evtAlt, url, iframeTitle, postAction, w, h);

      $(iframeId).ready(function() {
         window.setTimeout(function() {    // 1500 ms 後才送訊息... 否則顯示頁面可能會空白（不確定是否是因為沒收到訊息）
            //let targetOrigin = location.protocol + "//" + location.host;      // or simply use "*"
            let targetOrigin = "*";
            //let messageJson = JSON.stringify(wordArray);                    // basic format: a simple array
            let obj = { eventBeheavior: 'newWin',                             // 2019-10-20: 'postBack', 'newWin'
                        data: wordArray };                                    // wordCloud 所需的資料格式
            let messageJson = JSON.stringify(obj);
            document.getElementById(iframeId).contentWindow.postMessage(messageJson, targetOrigin);
         }, 1500);
      });
   };
   
   // year stats lite
   var invokeYearStatsLite = function(evtAlt, title, trendList, yearLines) {
      var url = DocuSkyHost + "/docuTools/YearStatsLite/YearStatsLite.html";
      var iframeWidth = 800;
      var iframeHeight = 450;
      var backgroundColor = '#FFFFFF';
      
      let postAction = 'spTime';             // 2023-07-02: 目前只有 metadata 後分類的 ADY 可以繪製年代分佈圖（因此不需額外參數）
      var iframeId = showUrlIframe(evtAlt, url, title, postAction, iframeWidth, iframeHeight, backgroundColor);
      //alert(iframeId);
      
      $(iframeId).ready(function() {
         window.setTimeout(function() {      // 1500 ms 後才送訊息... 否則顯示頁面可能會空白（不確定是否是因為沒收到訊息）
            let targetOrigin = location.protocol + "//" + location.host;           // or simply use "*"
            let colorList = shuffle(COLORS_6);
            //let colorList = shuffle(COLORS_10);
            if (trendList.length > 1) colorList[trendList.length-1] = '#B0B0B0';   // lightgray #D3D3D3; gray #808080;
            let message = { yearStats: trendList,
                            colorList,
                            plotAverageLine: false,
                            customizedAxisTitles: { xAxis: '西元年', yAxis: '文件數' },
                            yearLines,        // 2019-12-24
                          };
            let messageJson = JSON.stringify(message);         // yearStats 所需的資料格式 (note: message can also be a simple trendList array)
            document.getElementById(iframeId).contentWindow.postMessage(messageJson, targetOrigin);
         }, 1500);
      });
   };
   
   function invokeDocuGisLite(evt, placeIdArray) {
      // 2025-07-24: TGAZ 更改網址 https://chgis.hudci.org/tgw/，但 DocuGis 已經將座標內化，因此沒有影響
      let url = DocuSkyHost + "/docuTools/DocuGis/api/lite.html";

      // jquery ui 的 position() 可以吃 event 或 element 物件 
      // 利用 evt.originalEvent 判斷是否為「原生驅動」（使用者動作所觸發的事件），否則 position() 將只能擺在左上角
      let evtAlt = (evt.originalEvent) ? evt : $(this);

      let postAction = null;
      let iframeTitle = "DocuGIS Lite";

      let placeIdListStr = placeIdArray.join(",");
      let marker = (placeIdArray.length <= 5) 
                 ? "greencircle"       // "bluecircle"
                 : "redcircle";
      let param = "id2=" + placeIdListStr + ";;;" + marker
      url += "?" + param;

      let w = 720;
      let h = 450;
      
      var iframeId = showUrlIframe(evtAlt, url, iframeTitle, postAction, w, h);
   }
   
   // ---------------------------
   //         utilities
   // ---------------------------

   Date.prototype.yyyymmdd = function() {       // Tu: copied from Web
     var mm = this.getMonth() + 1;              // getMonth() is zero-based
     var dd = this.getDate();
     return this.getFullYear() + ('0'+mm).substr(-2) + ('0'+dd).substr(-2);    // padding
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
   
   function unescapeHtml(text) {
      // 2025-10-23
      const map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
      };
      return text.replace(/&(amp|lt|gt|quot|#\d+);/g, function(m) { return map[m]; });
   }
   
   // 主要為了讓 query 處理起來較方便（語法和 DocuSky 不太一樣，採用 m.field:Q 和 t.udef_xxx:Q 形式）
   // 查找符合的標籤時，需將欲查詢的字串和文本 xml 的標籤值，都先經過 escapeSpotlightCue() 處理
   function escapeSpotlightCue(s) {
      // 注意，這裡先經過 escapeHtml() 處理，因此單引號 apostrophe 會被轉成 &#39;
      s = escapeHtml(s).replace(/\s+/g, '_')
                       .replace(/[\|]+/g, ',');        // e.g., m.ADY:x|y|z 其中 x, y, z 不能包含 '|'
      return s;
   }
   
   function getTermHighlightWithEscapedCue(term) {
      term = escapeRegExp(unescapeHtml(term));
      term = term.replace(/_/g, '[_\\s]+')        // 底線 => 空白或底線（注意 \s 要寫成 \\s，一個反斜線會被字串轉 internal 吃掉）
                 .replace(/,/g, '[,\|]+');        // 逗點 => 逗點或 '|'
      return term;
   }
   
   function escapeRegExp(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
   }
   
   var shuffle = function(array) {
      for (let i = array.length - 1; i > 0; i--) {
         let j = Math.floor(Math.random() * (i + 1));
         [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
   };

   // 2026-02-28: by ChatGPT
   function checkRegexPattern(s, flags = "") {
      // s 必須是字串
      s = String(s);
      
      // flags 也可能是使用者輸入：先檢查是否合法
      // 允許的 flags: d g i m s u v y（有些環境不支援 v，但不支援時會在 new RegExp 時丟錯）
      if (flags && !/^[dgimsuvy]*$/.test(flags)) {
         return { ok: false, error: "Invalid flags" };
      }
      // flags 不能重複
      if (flags && new Set(flags).size !== flags.length) {
         return { ok: false, error: "Duplicate flags" };
      }
      
      try {
         const re = new RegExp(s, flags);
         return { ok: true, regex: re };
      } catch (e) {
         // 通常是 SyntaxError：Unterminated group / character class / escape...
         return { ok: false, error: e.message };
      }
   }

   // Create Base64 Object
   var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
   
   // encodedString = Base64.encode(string);
   // decodedString = Base64.decode(encodedString);

   function detectBrowser() {
      const ua = navigator.userAgent;
      if (ua.includes("Firefox")) return "Firefox";
      if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) return "Chrome";
      if (ua.includes("Edg")) return "Edge";
      if (ua.includes("OPR")) return "Opera";
      return "Other";
   }

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

   /*
    * PolylineUtil 
    * Actual code from:
    * http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/\
    */

	// This function is very similar to Google's, but I added
	// some stuff to deal with the double slash issue.
	var encodeNumber = function (num) {
		var encodeString = '';
		var nextValue, finalValue;
		while (num >= 0x20) {
			nextValue = (0x20 | (num & 0x1f)) + 63;
			encodeString += (String.fromCharCode(nextValue));
			num >>= 5;
		}
		finalValue = num + 63;
		encodeString += (String.fromCharCode(finalValue));
		return encodeString;
	};

	// This one is Google's verbatim.
	var encodeSignedNumber = function (num) {
		var sgn_num = num << 1;
		if (num < 0) {
			sgn_num = ~(sgn_num);
		}

		return encodeNumber(sgn_num);
	};

	var getLat = function (latlng) {
		if (latlng.lat) {
			return latlng.lat;
		} else {
			return latlng[0];
		}
	};
	var getLng = function (latlng) {
		if (latlng.lng) {
			return latlng.lng;
		} else {
			return latlng[1];
		}
	};

	var PolylineUtil = {
		encode: function (latlngs, precision) {
			var i, dlat, dlng;
			var plat = 0;
			var plng = 0;
			var encoded_points = '';

			precision = Math.pow(10, precision || 5);

			for (i = 0; i < latlngs.length; i++) {
				var lat = getLat(latlngs[i]);
				var lng = getLng(latlngs[i]);
				var latFloored = Math.floor(lat * precision);
				var lngFloored = Math.floor(lng * precision);
				dlat = latFloored - plat;
				dlng = lngFloored - plng;
				plat = latFloored;
				plng = lngFloored;
				encoded_points += encodeSignedNumber(dlat) + encodeSignedNumber(dlng);
			}
			return encoded_points;
		},

		decode: function (encoded, precision) {
			var len = encoded.length;
			var index = 0;
			var latlngs = [];
			var lat = 0;
			var lng = 0;

			precision = Math.pow(10, -(precision || 5));

			while (index < len) {
				var b;
				var shift = 0;
				var result = 0;
				do {
					b = encoded.charCodeAt(index++) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);
				var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
				lat += dlat;

				shift = 0;
				result = 0;
				do {
					b = encoded.charCodeAt(index++) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);
				var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
				lng += dlng;

				latlngs.push([lat * precision, lng * precision]);
			}

			return latlngs;
		}
	};
   
   // --------------------------------------------------------------------------
   //        utility functions for converting to legal names
   // --------------------------------------------------------------------------
   
   function convertToLegalTagName(s) {
      // xml tagname characters:
      // NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] |
      //                   [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] |
      //                   [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] |
      //                   [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] |
      //                   [#x10000-#xEFFFF]
      // NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] |
      //             [#x203F-#x2040]
      // Name ::= NameStartChar (NameChar)*
      
      // 先偷懶，用較簡單的方式取代非法的常見字元
      s = s.replace(/\s/g,'_')               // 2024-06-21
           .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uD800-\uDFFF\uE000-\uFFFD]/g, '-');
      return s;
   }
   
   function convertToLegalAttrName(s) {
      // 先暫時假設 COMARKUS 的 json 輸出，都會是合法的標籤屬性名稱字元...
      return s;
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
   
   function convertToLegalTagValue(s) {
      // 先暫時假設 COMARKUS 的 json 輸出，都會是合法的標籤文字字元... 
      return s.toString();                    // 2024-08-04: 需轉成字串（防呆）！
   }

   function convertToValidCorpus(s) {
      // 2025-07-18: 因為 query 格式 corpus>m.ADY:x|y|z，XA 需避免 corpus 出現空白、英文句點等特殊字元...
      return s.replace(/\s+/g, '_')
              .replace(/[\.]/g, '_')
              .replace(/[\|]+/g, ',')
              .replace(/[<]/g, '[')
              .replace(/[>]/g, ']');
   }

   // ------------------------------------------------------------------------------------------   
   // Tech Notes:   
   // (1). 可透過 clonedObj = JSON.parse(JSON.stringify(origObj)) 取得 deep copy 結果
   //      但需注意：，些值在 stringify 和 parse 後會產生變化（例如 NaN, undefined, RegExp 等），
   //      參考 https://www.programfarmer.com/articles/2021/javascript-shallow-copy-deep-copy
   //
   // ------------------------------------------------------------------------------------------   

