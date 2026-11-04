   // global constants
   const NO_IIIF_IMAGE_KEY = 'NO_IMG_KEY';
   const EnableDocuSkyConnectivity = true;     // （早期開發測試）若為 true，則參考 DocuSky.connectivity.js 取得 DocuSkyHost
   const EnableMessageViaParent = true;        // 2024-12-31: （實驗）若為 true，則透過 parent 傳遞 postMessage() 給其他工具

   const WhiteSpaceSymbol = '.';               // 2024-04-30: e.g., <Udef_properties_date.dynasty>
   const LayerDelimiter = '//';                // 2024-10-24: flattern object 時，各階層之間的 delimiter
   const ImmarkusTagSuffixDelimiter = '_';     // 2025-02-22: e.g., "properties:location_0" 在 location 和 0 之間的符號（因為會變成 tagName，因此很多特殊符號都不能用，或可採用雙底線 '__'）
   
   const ImageFileExtList = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];       // 2025-02-17: 浩洋提供的 sample code 包含這些類型
   
   // 2025-01-20: 藉此全域變數判斷 X-MARKUS 是否在 local mode 下執行
   const InXmarkusLocalMode = (EnableMessageViaParent && location.protocol == 'file:');
   const BrowserType = detectBrowser();        // 2025-05-22

   var DocuSkyObj = null;
   var GlobalVar = { corpusDataDict: {},                                                        // 2025-03-22: 原先是全域變數 CorpusList，儲存剖析後的數據 { corpusTitle: [{filename, filepath, text, udefMetadataXml, docMetadataXml}, ...], ... }
                     fixedCorpusTitle: 'IMMARKUS-CORPUS',                                       // 2025-04-29: 若沒有指定，則會以 (new Date()).yyyymmdd() + "-i2d" 作為文獻集名稱 -- cf. Comarkus2D 目前以 'COMARKUS-CORPUS' 作為預設文獻集名稱
                     udefMetadataPrefix: 'Udef_DocMeta_img_',                                   // 2025-04-29: 自訂的 metadata 前綴，可設為 'Udef_DocMeta_' 以進行後分類並方便檢錯（若沒有這些需求，可直接設為 '' 以縮短欄位名稱）=> 2026-01-21 加上 Img_ 前綴，2026-02-25 改為 txt_
                                                                                                
                     immarkusDataRlativePath: "../XmarkusData/ImmarkusData/",                   // 2025-03-11: 固定的路徑（原先是用 localXmarkusDataPath）
                     immarkusLocalWebPath: "https://localhost:8088/XmarkusData/ImmarkusData/",  // 2025-12-28 (http), 2026-06-12 (https)
                     imageUrlPath: "../XmarkusData/ImmarkusData/",                              // 2024-06-25: 假設 image 和 thumbnail 同檔名（只是路徑不同）
                     imageRelativeFilenameDict: {},                                             // 2025-01-31: 因 Immarkus 圖檔可能為 .png 或 .jpeg，且 json 不一定有提供 source 標出圖檔名稱，因此需利用此 Dict 進行判讀...
                     udefTagsDict: {},                                                          // 2025-02-23: 記錄哪些 udef tags 要加入 corpus settings 的 <feature_analysis>，e.g., udefTagsDict['Udef_properties_year']=1
                     
                     omitUdefPropertiesTagSubscript: ['properties//texture'],     // 2026-07-15: <Udef_properties_texture_0> 並不需最後的 "_"，但移除 subscript 後允許多個 <Udef_properties_texture> 標籤
 
                     folderModelFileDict: {},                                     // 2025-06-18: IMMARKUS 的階層結構（對這個專案而言很重要！）
                     folderMetadataFileDict: {},                                  // 2024-10-27: metadata files 必須在讀取 json files 前先處理好，folderMetadataFileDict[path] = {filename, filepath, udefMetadataXml, docMetadataXml, udefMetadataXml }
                     folderJsonFilesArrayDict: {},                                // 2024-10-27: folderJsonFilesArrayDict[path] = [{ filename, filepath, file, udefMetadataXml, docMetadataXml }, ...]
                     folderIiifMetadataFileDict: {},                              // 2025-03-21: folderIiifMetadataFileDict[immarkusManifestId] = { filename, filepath, file, iiifManifestUrl, iiifManifestJson, iiifImageUrl, iiifCanvasIdMap, docMetadataXml, udefMetadataXml }
                                                                                  //             其中 iiifCanvasIdMap 是 immarkus iiif json 檔的 mapping 資訊，iiifCanvasIdMap[canvasId] = { name, imageKey:uri }
                     folderIiifAnnotationFileDict: {},                            // 2025-03-21: folderIiifAnnotationFileDict[immarkusManifestId] = { filename, filepath, file, udefMetadataXml, docMetadataXml } 後兩項 xml 可能用不到？
                     folderRelationFileObjArray: [],                              // 2024-12-22: 目前打算將所有 _immarkus.relations.json full pathname 存在這個陣列，後續將其中的關聯做聯集一起處理
                     folderSettingsFileObjArray: [],                              // 2026-06-11: IMMARKUS 新增 _immarkus.settings.json 設定檔
                     
                     filenameFolderHierarchyHash: {},                             // 2025-12-04: filenameFolderHierarchyHash[jsonFilename] := folderHierarchy，方便建立 <compilation_name>

                     immarkusEntityParentMap: {},                                 // 2025-06-21: 記錄 entity 的 parent type (e.g., immarkusEntityParentMap['city_wall'] = 'object_main')
                     
                     modelFilesLoaded: 0,                                         // 2025-06-18
                     metadataFilesLoaded: 0,                                      // 需藉 metadataFilesLoaded++ 與 metadataTotalFiles 判斷是否所需檔案皆已讀入完畢
                     metadataTotalFiles: 0,                                               
                     jsonFilesLoaded: 0,                                          // 需藉 jsonFilesLoaded++ 與 jsonTotalFiles 判斷是否所需檔案皆已讀入完畢（注意，不能跟 metadataFilesLoaded 共用變數）
                     jsonTotalFiles: 0,                                           // 2025-01-21
                     iiifMetadataFilesLoaded: 0,                                  // 2025-03-22
                     iiifMetadataTotalFiles: 0,                                   // 2025-03-22
                     iiifAnnotationFilesLoaded: 0,                                // 2025-03-22
                     iiifAnnotationTotalFiles: 0,                                 // 2025-03-22
                     relationFilesLoaded: 0,                                      // 需藉 relationFilesLoaded++ 與 relationTotalFiles 判斷是否所需檔案皆已讀入完畢（注意，不能跟 metadataFilesLoaded 共用變數）
                     relationTotalFiles: 0,
                     
                     iiifManifestTotal: 0,                                        // 2025-03-24
                     iiifManifestSuccess: 0,                                      // 2025-03-24
                     iiifManifestFail: 0,                                         // 2025-03-24
                     checkIiifImageOnConverting: false,                           // 2025-03-28: 是否在轉換成 DocuXml 過程檢查 iiif image 是否正常（許多 iiif 影像相當龐大，檢查過程可能需下載甚久）
                     iiifOnlyAddMajorMetadata: true,                              // 2025-04-06: 是否在 <xml_metadata> iiif manifest metadata 中，僅輸出 iiifMajorMetadataFields 所列的欄位（欄位可能會很多，產出 'iiif_' 開頭的標籤）
                     iiifMajorMetadataFields: [],                                 // 2025-04-06: 在 init() 設定 -- 只輸出這幾項「重要」的 metadata
                     udefIiifImmarkusMetadata: {},                                // 2025-04-18: 若 annotation item 只有 manifest_id 而沒有 canvas_id，它就是使用者加上的 iiif metadata -- udefIiifImmarkusMetadata[manifest_id] = [ annotation_item, ...]
                     failedIiifManifestInfo: {},                                  // 2025-04-21: failedIiifManifestInfo[manifes
                     replaceIiifUdefGenreSourceStructure: false,                  // 2025-07-01: 若 Udef_Genre_Filename (Udef_Genre_Subfolder 也類似) 為 iiif:<manifest_id>:<canvas_id>，將它換為 iiif:<image_title> （若文件中可找到對應的 <image_title>）
                     
                     enableUdefImgNote: true,                                     // 2026-04-08: 不屬於 properties 的項目... 顯示使用者 image note (or AI auto-transcription)

                     enableAutoScrollImageCheck: true,                            // 2025-03-13: 若設為 true，顯示 image check 的訊息會永遠將捲軸捲到最下方
                     showImageCheckPassedItems: false,                            // 2025-04-01: 是否逐條顯示 "pass: <image-url>" 成功訊息
                     hideimageCheckSummary: true,                                 // 2025-06-07: 是否隱藏 image check info 最後的 success/fail 數量訊息

                     autoSaveIiifManifest: false,                                 // 2025-04-23: 是否在讀取 iiif manifest 時，順便將 manifest json 儲存起來（有些 iiif server 會導致 CORS issues）
                     autoDownloadIiifImages: false,                               // 2025-04-17: 是否「額外」自動下載 iiif images
                     
                     contentIncludesImmarkusProperties: true,                     // 2024-10-23: 若為真，則 content 將以 <ImmarkusBody> 來額外包含 immarkus properties 內容（仍然有 <Events> 內容）
                     immarkusRelationArray: [],                                   // 2024-12-22: 每個 immarkusRelation 檔都是 json 陣列，此變數只是將它們 merge 起來存放
                     immarkusRelationHash: {},                                    // 2026-07-10: 將 Immarkus relation 的 linking 和 tagging 整合起來，方便後續處理
                     immarkusIdDict: {},                                          // 2024-12-23: Immarkus 新加入的 relation 似乎僅用 id 來進行連結，因看不懂結構，先加上 map 記錄 id 和對應的物件...
                     
                     metadataFieldLabelMap: {},                                   // 2024-11-01: metadata 欄位顯示名稱的對應表，例如 map['author'] = 'Publication Author' 
                     linkToApp: { 'XmarkusAnalyzer': './XmarkusAnalyzer.html',    // 2024-12-21
                                  'EventRelLite': './EventRelLite.html',
                                  'MUNDa': '../MUNDa/index.html',
                                },
                     
                     //batchResult: [],                                           // 2026-01-30: 每次 add project folder 將 batchNumber 加入 corpusTitle                    
                     jsonProcessedHash: {},                                                     // 2025-02-01: 若 json 檔 (filepath+'/'+filename) 已被處理，就放入此 Hash
                     finalDocuXml: '',                                            // 2025-01-30
                     
                     imageAccessibilityCheck: { urlHashToCheck: {},               // 2025-01-31
                                                urlPassHash: {},                  // 2025-02-01
                                                urlFailHash: {},
                                              },
                     
                     imageUseNonBlobPath: false,                                  // 2025-03-12: 是否採用（本地端）相對路徑存取 images
                     imgMsgNum: 0,                                                // 2025-03-13: 為了讓 check image accessibility 訊息捲動，藉由此變數加上訊息的 id
                     
                     convertEachPiece2Doc: false,                                 // 2025-04-26: 將每個 image piece 轉成獨立的文件
                     enableAddingCustomizedUdefTags: false,                       // 2025-04-04: 若設為 true，才使用 customizedUdefCombinationList
                     
                     customizedUdefCombinationList: [],                           // 2025-04-04: 每個元素是一個「可將多 udef tags 串連在一起」的規則 { type, newTag, tagsToConcatenate [,span,digits] }
                     mergeSplitFields: true,                                      // 2025-06-20: 與 customizedUdefCombinationList 作用類似，例如將 location_0, location_1 合併在一起

                     addPropertyTree: true,                                       // 2025-03-12: 是否額外加上 <Udef_PieceTreePath> 以構建 property tree（收納在 <ImmarkusCollectedTags> 下）
                     addPropertyTreeWithGenreLevel: true,                         // 2025-07-31: 除了 <Udef_PieceTreePath>，是否加上 <Udef_PieceTreePath.GenreL{n}> 以便於後分類計算樹節點的文件數量
                     addImageTypeToMetadata: false,                               // 2025-04-29: 是否將 "image type" 以 <doctype> 形式加入 metadata 後分類

                     exportUdefEntityRelationXml: true,                           // 2026-07-10: 暫時先設為 false（還需要測試）
                     extraUdefTagList: [//'Udef_Image_Source',                    // 2025-04-20: 要加入哪些「Immarkus2D 額外加入的」tags
                                        'Udef_Img_EntityRelation',                // 2026-06-20: 額外加上 <Udef_Img_EntityRelation> 後分類
                                       ],
                                       
                     dirPickerReady: false,                                       // 2025-05-22
                     
                     enableSnippet2Doc: false,                                    // 2025-07-27: 預設為 false -- 不需將 snippets 轉換成 documents（會產生大量文件）
                     enableExtraAlignObjectId: true,                              // 2026-01-20: 是否額外輸出 <Udef_Align_OBJECT_ID>
                     fixAlignObjectId2Image: true,                                // 2026-01-25: 若為 true，<Udef_Align_OBJECT_ID> 的值將總是 'Image'
                     
                     forceBlobUrlUnderChromium: true,                             // 2026-01-05: 是否利用 blob url 取得 local images （僅對 chromium 瀏覽器有效）
                     curWorkingMode: 'blobUrl',                                   // 2025-12-30: 預設是 'blobUrl' (X-MARKUS 使用者為非專家的模式），判斷後才切換到 'normalUrl'

                     useRestUrlPct2AdjustImageSize: false,                        // 2026-03-05: 透過 url 中 "/pct:{n}/" 來調整 imageWidth, imageHeight（注意，這只能算是備用的 workaround solution，因調整後仍只是真實大圖的約略大小）
                     addingDashToEntityClassObj: false,                           // 2026-02-28: 由於魯汶認為 entityClass 'object' 和 'obj_part' 都應該有兩層，當 source 就是 'obj_part' 時，此值為 true 會加上一層 '-'，否則就將它從 Udef_Img_EntityClass 移除
                     
                     errorReported: {},                                           // 2026-04-15
                   };

   // ----------------------------------------------------------------------------------------------

   // ----------------------------------------------------------------------------------------------

   $(document).ready(function() { 
      var me = this;

      // 2024-10-23: 只有在定義 window.DocuSkyHost（正確引入 js/DocuSky.connectivity.js）後，才顯示 DocuSky 相關的功能與訊息
      if (EnableDocuSkyConnectivity && window.DocuSkyHost) {       // 2024-09-01: 加入 EnableDocuSkyConnectivity 檢查
         $(".disableDocuSkyConnectivity").removeAttr("disableDocuSkyConnectivity").show();
         let s = "open DocuSky in a new window";
         $("#linkToDocuSky").html(s);
         $("#linkToDocuSky").click(function() {
            window.open(window.DocuSkyHost, "_blank");
         });
      }
   
      DocuSkyObj = docuskyManageDbListSimpleUI;
      $("#manageDbList").click(function(e) {
         DocuSkyObj.manageDbList(e);
      });
      
      init();
   });
   

   // ---------------------------
   //   error-display functions
   // ---------------------------

   window.onerror = function (message, source, lineno, colno, error) {
      showUserError("System Error");
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
   
   // ----------------------------------------------------------------------------------------------
   
   function init() {
      resetOutFilename();

      // 2025-04-06: 設定 "major" metadata fields
      GlobalVar.iiifMajorMetadataFields = [ 'title', 'subject', 'date', 'creator'];
      
      // 2025-01-14: 就算 parent.parent 實際上不存在，FF 還是讓 js 可偵測到！（但應該是取得當前網頁的參考）
      //             => 藉由 location.href 判斷工具是否 XmarkusPlatform.html 引入，若是則隱藏 tool title
      // 2025-01-17: file/ 協定下，無法存取 parent.location.href
      if (parent.parent && (location.protocol == 'file:' || location.href != parent.parent.location.href)) {
         $("#divHeaderBar").removeClass("headerBarToolLabel")
                           .addClass("headerBar");
         $("#spanToolLabel").hide();
      }
      
      // 2026-06-12: 預設使用 local web path
       $("#imageUrlPrefix").val(GlobalVar.immarkusLocalWebPath);
      
      setImageUrlPath();

      // 2025-05-01      
      setTimeout(resizeOverlay, 1000);            // 必須等一小段時間，否則 window.innerWidth 和 innerHeight 會都是 0

      // 2025-04-01: (TODO) 即使目前應只有幾項實驗性質的標籤...
      if (GlobalVar.enableAddingCustomizedUdefTags) setCustomizedUdefCombination();

      // 2026-01-22: reset      
      GlobalVar.jsonFilesLoaded = 0;                                // 2026-01-22: reset
      GlobalVar.jsonProcessedHash = {};                             // 2026-01-22: reset
      GlobalVar.folderModelFileDict = {};
      GlobalVar.folderMetadataFileDict = {};
      GlobalVar.folderIiifMetadataFileDict = {};
      GlobalVar.folderIiifAnnotationFileDict = {};
      GlobalVar.folderRelationFileObjArray = [];
      GlobalVar.folderJsonFilesArrayDict = {};          // 一般（非 iiif）IMMARKUS json files
      GlobalVar.errorReported = {};
   }
   
   function resetOutFilename() {
      let s = GlobalVar.fixedCorpusTitle;                                   // 2025-04-29
      let t = (new Date()).yyyymmdd() + "-i2d";
      if (!s) s = t;
      $("#inCorpusTitle").val(s);
      
      let suffix = (GlobalVar.convertEachPiece2Doc) ? "_Pcs2Doc" : "";
      let urlType = (GlobalVar.imageUseNonBlobPath || InXmarkusLocalMode)   // 2026-03-29
                  ? 'normal'       // images with standard URLs
                  : 'blob';        // images with blob URLs
      $("#outFilename").val(t + '_' + urlType + suffix + ".xml");
   }
   
   function resizeOverlay() {
      let h = window.innerHeight;
      let w = window.innerWidth;
      //alert(h + ':' + w);
      $("#overlay").css({width: w + 'px', height: h + 'px'});
   }
   
   function setCustomizedUdefCombination() {
      // 設定 GlobalVar.customizedUdefCombinationList
      GlobalVar.customizedUdefCombinationList = [
         { type: 'general',
           newTag: 'Udef_Extra_part.of.main.object',
           tagsToConcatenate: ['Udef_properties_part.of.main.object_type', '/', 'Udef_properties_part.of.main.object_instance'],
         },
         { type: 'general',
           newTag: 'Udef_Extra_width_height',
           tagsToConcatenate: ['W', 'Udef_properties_width_value', 'Udef_properties_width_unit', '_',    // 呃，後分類 cue 不能用逗點、分號或冒號...
                               'H', 'Udef_properties_height_value', 'Udef_properties_height_unit'],
         },
         { type: 'year',             // 1115 CE, 202 BCE, -100 (DocuXml year_for_grouping format) etc.
           newTag: 'Udef_Extra_Y010',
           tagsToConcatenate: ['Udef_properties_date.start'],
           span: 10,
           digits: 4,
         },
         { type: 'year',             // 1115 CE, 202 BCE, -100 (DocuXml year_for_grouping format) etc.
           newTag: 'Udef_Extra_Y050',
           tagsToConcatenate: ['Udef_properties_date.start'],
           span: 50,
           digits: 4,
         },
         { type: 'year',             // 1115 CE, 202 BCE, -100 (DocuXml year_for_grouping format) etc.
           newTag: 'Udef_Extra_Y100',
           tagsToConcatenate: ['Udef_properties_date.start'],
           span: 100,
           digits: 4,
         },
      ];
      
   }
   
   function setImageUrlPath() {
      if (InXmarkusLocalMode) {
         // 2025-01-31: 若是直接在 local 執行工具，就直接採用 GlobalVar.imageUrlPath (跳過 #imageUrlPrefix) 設定
         //             但... 未來可能需支援在 local 執行工具，也可指定 remote server 的 data path？
         //$("div.useFileProtocol").show();
         return;
      }
      
      if (GlobalVar.forceBlobUrlUnderChromium && ['Chrome','Edge'].includes(BrowserType)) {        // 2025-05-22
         // 2025-12-28: 採取點選 local folder 將 image URL 轉成 session blob 方式
         // 注意：此時 GlobalVar.imageUrlPath 並不會採用 $("#imageUrlPrefix") 的內容
         switchWorkingMode('blobUrl');
         return;
      }
      else switchWorkingMode('normalUrl');
      
      // 2025-01-31: 透過 http: 或 https: （例如利用 Simple Web Sever）執行工具，才能讓使用者指定 URL prefix
      $("div.useWebProtocol").show();
      
      s = $("#imageUrlPrefix").val().trim();
      if (s != '') {
         if (s.slice(-1) != '/') s += '/';               // 最後一個字元若非 '/'，則補上 '/'
         GlobalVar.imageUrlPath = s;
      }
      else ;                                             // 不更動當前（預設）值
   }
   
   // ------------------------------------------------------------------------------------------
   
   function handleSelectInDir(evt) {           // handle DirSelect
      let files = evt.target.files;            // 回傳 traversal result (a list of files)
      if (files.length == 0) {                 // 防呆...
         alert("Folder contains no files");
         return;       
      }
      
      handleAllFiles(files);
   }
   
   function handleAllFiles(files) {
       // 2025-03-22: 注意，由於後續需透過 GlobalVar 的 folderMetadataFileDict 和 folderJsonFilesArrayDict 等
      //             全域變數來傳遞與控制讀檔流程，因此每次 BatchImports 均需重設相關變數
      //             => 每次 BatchImports 讀取檔案，經過剖析後會將結果儲存於 GlobalVar.corpusDataDict
      //GlobalVar.folderModelFileDict = {};
      //GlobalVar.folderMetadataFileDict = {};
      //GlobalVar.folderIiifMetadataFileDict = {};
      //GlobalVar.folderIiifAnnotationFileDict = {};
      //GlobalVar.folderRelationFileObjArray = [];
      //GlobalVar.folderJsonFilesArrayDict = {};          // 一般（非 iiif）IMMARKUS json files
      //GlobalVar.jsonProcessedHash = {};                 // 2026-01-25: reset （必須清除，否則可能會 hang 住）
      
      // 2024-10-20
      var corpusTitle = $("#inCorpusTitle").val().trim();
      if (GlobalVar.corpusDataDict[corpusTitle] === undefined) GlobalVar.corpusDataDict[corpusTitle] = [];      // 2025-03-22
      //GlobalVar.corpusDataDict[corpusTitle] = [];      // 2026-01-20: reset

      let folderModelFileDict = GlobalVar.folderModelFileDict;
      let folderMetadataFileDict = GlobalVar.folderMetadataFileDict;                // reference
      let folderJsonFilesArrayDict = GlobalVar.folderJsonFilesArrayDict;            // reference
      
      // 遍歷所有檔案（若檔案並非 Immarkus2D 所需，需在後續過程進行處理）
      for (let file of files) {
         let filename = file.name;
         let fullname = file.webkitRelativePath;                                      // fullname 會包含最後的檔名
         let filepath = fullname.substr(0, fullname.length - filename.length - 1);    // 還需多扣除檔名前的 '/' (e.g., "20241018-Immarkus-Sunkyu/sanzhentushuo_juan 2")
         let fileExt = filename.split('.').pop();

         let obj = { filename, filepath, file, udefMetadataXml:'', docMetadataXml:'' };     // 2024-10-27: 加上 udefMetadataXml, docMetadataXml
         
         if (fileExt == 'json') {
            if (filename == "_immarkus.model.json") {
               // 不能直接跳過... :(
               folderModelFileDict[filepath] = obj;
            }
            else if (filename == "_immarkus.folder.meta.json") {          // 應不會有兩份同名（同路徑）的 metadata
               folderMetadataFileDict[filepath] = obj;                 
            }
            else if (filename == "_immarkus.relations.json") {
               // (TODO): xxyyzz 應該需要整合？
               //console.log("skip: " + fullname);
               // 但... 目前看不懂其意義和目的，好像就是為了展示某種關聯圖？
               // 其中的 motivation 似乎只有 "linking" 和 "tagging" 兩類，然後 tagging 下另有 "part of whole"
               // 2024-12-22: 整份目錄下，應該只有根目錄會有 _immarkus.relations.json?
               GlobalVar.folderRelationFileObjArray.push(obj);
            }
            else if (filename == '_immarkus.settings.json') {
               // 2026-06-10: IMMARKUS 新加入的設定檔，目前不知有什麼作用，只能先跳過
               //alert(filename);
               GlobalVar.folderSettingsFileObjArray.push(obj);      // 只是存起來，這專案應該用不到
               ;
            }
            else if (filename.startsWith('_iiif.')) {
               // 2025-03-20
               // _iiif.[manifest-id].json => 儲存「從 manifest 擷取出的 minimal metadata」
               // _iiif.[manifest-id].annotation.json => 儲存使用者對 iiif image 所進行的 annotation
               // iiif metadata/annoation json 至少需有一個存在
               let parts = filename.split('.');
               let immarkusManifestId = parts[1];                      // 偷懶不做防呆檢查了...
               if (filename.endsWith('.annotations.json')) {           // 2025-03-22: 注意不是 annotation.json
                  GlobalVar.folderIiifAnnotationFileDict[immarkusManifestId] = obj;
               }
               else {
                  obj = { filepath, filename, file, 
                          iiifManifestUrl: '',
                          iiifManifestJson: '',
                          iiifImageUrl: '',
                          iiifCanvasIdMap: {},             // 2025-04-21
                          docMetadataXml: '',              // 2025-06-13
                          udefMetadataXml: '',             // 2025-06-13
                        }
                  GlobalVar.folderIiifMetadataFileDict[immarkusManifestId] = obj;
               }
            }
            else {
               if (!folderJsonFilesArrayDict[filepath]) folderJsonFilesArrayDict[filepath] = [];
               // 2026-01-22: 必須檢查 obj.filename 是否已經存在！
               let existed = folderJsonFilesArrayDict[filepath].some(function(v) {
                  return v.filename == obj.filename;
               });
               if (!existed) folderJsonFilesArrayDict[filepath].push(obj);             // obj := { filename, filepath, file }
            }
         }
         else if (ImageFileExtList.includes(fileExt)) {                  // 目前只看到 png, jpeg, jpg 副檔名，但浩洋的 sample code 還包含其他
            // 圖檔 -- 雖然沒有實際用到圖檔內容，但或許也需儲存相關資訊？
            GlobalVar.imageRelativeFilenameDict[fullname] = 1;           // 2025-01-31: 需利用 json 檔名，對比此 dict 來取得圖檔名稱
            //console.log("image: " + fullname);
         }
         else {
            // 非 .json 檔案就直接跳過
            console.log("neglect: " + fullname);
         }
      }
      //console.log(GlobalVar.folderJsonFilesArrayDict);
      //alert(JSON.stringify(GlobalVar.folderIiifMetadataFileDict));
      
      showProgressMsg("converting");

      // (1). readDirModelFiles()，全部載入後才呼叫
      // (2). readDirMetadataAndJsonFiles()，全部載入後才呼叫 
      // (3). readDirJsonFiles()，全部載入後，再呼叫
      // (4). readIiifMetadataFiles()，全部載入後，再呼叫
      // (5). readIiifAnnotationFiles()，全部載入後，再呼叫
      // (6). readDirRelationFiles()，全部載入後，執行 finishReadingDirFiles()
      readDirModelFiles();
   }
  
   function readDirModelFiles() {
      //alert("(1). readDirModelFiles");
      showProgressMsg("reading model");
      
      // 注意：需處理資料夾下的 model/metadata files 後，才能讀取 json files
      let folderModelFileDict = GlobalVar.folderModelFileDict;          // reference
      
      // 利用 GlobalVar.modelFilesLoaded 儲存「已讀入並處理」幾份檔案，藉以判斷是否所有檔案都已讀入（處理）完畢...
      let modelFilepathList = Object.keys(folderModelFileDict);
      //alert(JSON.stringify(modelFilepathList));
      
      // 2025-06-18: 每個 folder 下應只有一個 model file
      GlobalVar.modelTotalFiles = modelFilepathList.length;
      
      GlobalVar.modelFilesLoaded = 0;                                // reset
      if (GlobalVar.modelTotalFiles == 0) {
         // 2024-06-18: 防呆 (no model files to convert)
         console.log("WARNING: no directory model files to convert");
         readDirMetadataAndJsonFiles();
      }
      else {
         modelFilepathList.forEach(function(modelFilepath) {
            let obj = folderModelFileDict[modelFilepath];
            setupFolderModelReader(obj);                        // 2025-06-18: 讀入的程序中遞增 GlobalVar.metadataFilesLoaded 的值，全部讀入會呼叫 readDirMetadataAndJsonFiles()
         });
      }
      //console.log(GlobalVar.folderModelFileDict);
   }
   
   function readDirMetadataAndJsonFiles() {
      //alert("(2). readDirMetadataAndJsonFiles");
      showProgressMsg("read metadata");
      
      // 注意：需處理資料夾下的 metadata files 後，才能讀取 json files
      let folderMetadataFileDict = GlobalVar.folderMetadataFileDict;                     // reference

      // 利用 GlobalVar.metadataFilesLoaded 儲存「已讀入並處理」幾份檔案，藉以判斷是否所有檔案都已讀入（處理）完畢...
      let metadataFilepathList = Object.keys(folderMetadataFileDict);
      //alert(JSON.stringify(metadataFilepathList));
      
      // 2025-01-21: 每個 folder 下只有一個 metadata file，但可以有多份 json files
      GlobalVar.metadataTotalFiles = metadataFilepathList.length;
      
      // 注意： (bug fix) setupFolderMetadataReader() 會判斷讀入的 metadata files 數，若全部讀完會呼叫 readDirJsonFiles()，因此這裡不該重覆執行 readDirJsonFiles()
      GlobalVar.metadataFilesLoaded = 0;                                // reset
      if (GlobalVar.metadataTotalFiles == 0) {
         // 2024-12-22: 防呆 (no metadata files to convert)
         console.log("WARNING: no metadata files to convert");
         readDirJsonFiles();
      }
      else {
         metadataFilepathList.forEach(function(metadataFilepath) {
            let obj = folderMetadataFileDict[metadataFilepath];
            setupFolderMetadataReader(obj);                        // 2025-01-21: 讀入的程序中遞增 GlobalVar.metadataFilesLoaded 的值，全部讀入會呼叫 readDirJsonFiles()
         });
      }
      //console.log(GlobalVar.folderMetadataFileDict);
   }
   
   function readDirJsonFiles() {
      //alert("(3). readDirJsonFiles");
      showProgressMsg("folder json");
      
      // 注意：只能讀取一次目錄！（若多次讀取，folderJsonFilesArrayDict 會遞增，導致 jsonTotalFiles 增加，無法匹配 jsonFilesLoaded）
      let folderJsonFilesArrayDict = GlobalVar.folderJsonFilesArrayDict;                 // reference
      //alert(JSON.stringify(folderJsonFilesArrayDict));

      // 利用 GlobalVar.metadataFilesLoaded 儲存「已讀入並處理」幾份檔案，藉以判斷是否所有檔案都已讀入（處理）完畢...
      let filePathList = Object.keys(folderJsonFilesArrayDict);
      
      // 重新計算不重覆的 json 檔案數量
      GlobalVar.jsonTotalFiles = 0;
      for (let filepath in folderJsonFilesArrayDict) {
         GlobalVar.jsonTotalFiles += folderJsonFilesArrayDict[filepath].length;
      }
      //alert("YES -- " + GlobalVar.jsonTotalFiles + "\n" + JSON.stringify(Object.keys(folderJsonFilesArrayDict)));

      if (GlobalVar.jsonTotalFiles == 0) {                          // 2024-12-26: bug fix
         // 2024-12-22: 防呆 (no json filepaths to convert)
         console.log("WARNING: no json filepaths to convert");
         readIiifMetadataFiles();                                   // 2025-03-19: 加入讀取 iiif 標記
      }
      else {
         filePathList.forEach(function(filePath) {
            folderJsonFilesArrayDict[filePath].forEach(function(obj) {
               setupFolderJsonReader(obj);      // 過程中設定 GlobalVar.corpusDataDict （讀入的程序中遞增 GlobalVar.metadataFilesLoaded 的值）
            });
         });
      }
      //console.log(GlobalVar.corpusDataDict);
   }
   
   function readIiifMetadataFiles() {
      //alert("(4). readIiifMetadataFiles");
      showProgressMsg("iiif metadata");
      
      let folderIiifMetadataFileDict = GlobalVar.folderIiifMetadataFileDict;      // reference

      let manifestIdList = Object.keys(folderIiifMetadataFileDict);
      GlobalVar.iiifMetadataTotalFiles = manifestIdList.length;
      
      GlobalVar.iiifMetadataFilesLoaded = 0;                                      // reset
      if (GlobalVar.iiifMetadataTotalFiles == 0) {                                // 2025-03-22
         // 2024-12-22: 防呆 (no json to convert)
         console.log("Notice: no iiif metadata files");
         readIiifAnnotationFiles();                                               // 2025-03-22
      }
      else {
         GlobalVar.iiifManifestTotal = manifestIdList.length;
         manifestIdList.forEach(function(manifestId) {
            setupIiifMetadataJsonReader(manifestId);
         });
      }
   }
   
   function readIiifAnnotationFiles() {
      //alert("(5). readIiifAnnotationFiles");
      showProgressMsg("iiif annotation");
      
      let folderIiifAnnotationFileDict = GlobalVar.folderIiifAnnotationFileDict;      // reference

      let manifestIdList = Object.keys(folderIiifAnnotationFileDict);
      GlobalVar.iiifAnnotationTotalFiles = manifestIdList.length;
      
      GlobalVar.iiifAnnotationFilesLoaded = 0;                                        // reset
      if (GlobalVar.iiifAnnotationTotalFiles == 0) {                                  // 2025-03-22
         console.log("Notice: no iiif annotation files");
         showProgressMsg("parse relations");            // 2026-06-20
         window.setTimeout(function() {                 // 2026-06-20
            // 2024-12-22: 防呆 (no json to convert)
            readDirRelationFiles();                                                   // 2025-03-22
         }, 300);
      }
      else {
         manifestIdList.forEach(function(manifestId) {
            setupIiifAnnotationJsonReader(folderIiifAnnotationFileDict, manifestId);
         });
      }
   }
   
   function readDirRelationFiles() {
      //alert("(6). readDirRelationFiles");
      
      // TODO: 若要更詳盡的 relation 資訊，需從 GlobalVar.folderModelFileDict 取得 _immarkus.model.json JSON 內容
      //       GlobalVar.folderModelFileDict[filepath].relationshipTypes 陣列中，每個元素會是 
      //       例如 relationshipTypes := [ { "name": "crossing",
      //                                     "directed": true,
      //                                     "sourceTypeId": "bridge"},
      //                                    ... ]
      //       => 應將其取出，儲存到 GlobalVar.relationTypeHash 中，方便以 GlobalVar.relationTypeHash[name]
      //          取得 "directed", "sourceTypeId" 這兩項資訊
      //alert(JSON.stringify(GlobalVar.folderModelFileDict));
      
      // 2024-12-23: 讀入 immarkus relations 檔案 (雖然目前還不知道能怎麼處理和應用...)
      let folderRelationFileObjArray = GlobalVar.folderRelationFileObjArray;      // reference

      // 利用 GlobalVar.metadataFilesLoaded 儲存「已讀入並處理」幾份檔案，藉以判斷是否所有檔案都已讀入（處理）完畢...
      GlobalVar.relationTotalFiles = folderRelationFileObjArray.length;              // reset
      GlobalVar.relationFilesLoaded = 0;                                             // reset
      if (GlobalVar.relationTotalFiles > 0) {                 // 2025-01-31: bug fix (原先用 metadataTotalFiles)
         // setupFolderImmarkusRelationsReader() 讀入的程序中遞增 GlobalVar.metadataFilesLoaded 的值
         // 全部載入後，才會執行 finishReadingDirFiles()
         folderRelationFileObjArray.forEach(function(fileObj) {
            setupFolderImmarkusRelationsReader(fileObj);
         });
      }
      else {
         // 防呆 (no relation files to process)
         console.log("NOTICE: no relation files to process");
         finishReadingDirFiles();                             // 2025-01-31: 若沒有 immarkus relations，直接呼叫 finishReadingDirFiles()
      }
      // 2025-01-31: (bug fix) 原先在此呼叫 finishReadingDirFiles()，若有 relations 會導致 setupFolderImmarkusRelationsReader() 重覆呼叫 finishReadingDirFiles()！
   }
   
   // 2025-06-18
   function setupFolderModelReader(obj) {
      // obj := folderModelFileDict[modelFilepath]
      let filename = obj.filename;
      let filepath = obj.filepath;

      var fr = new FileReader();
      fr.addEventListener('load', function(evt) {            // fr.onload(function(){...})
         var json = evt.target.result;
         
         // TODO TOCHECK: 由於「繼承」的關係，若該 json 為空，可能需回溯到父目錄以取得 model？
         obj.json = json;
         if (json.length > 0) {
            ParseModelJsonToObj(json, obj);
         }
         //else console.log("Skip empty json: " + filepath + "/" + filename);    // 注意，會有空的 json 檔...
         GlobalVar.modelFilesLoaded++;
         
         // 2025-06-18: model files 全部讀入後，才進行下一步 readDirJsonFiles()
         if (GlobalVar.modelFilesLoaded == GlobalVar.modelTotalFiles) {
            readDirMetadataAndJsonFiles();
         }
      });
      var encoding = 'utf-8';         // 'utf-8', 'big5'
      fr.readAsText(obj.file, encoding);
   }
   
   function setupFolderMetadataReader(obj) {
      // obj := folderMetadataFileDict[metadataFilepath]
      let filename = obj.filename;
      let filepath = obj.filepath;

      var fr = new FileReader();
      fr.addEventListener('load', function(evt) {            // fr.onload(function(){...})
         var json = evt.target.result;
         if (json.length > 0) parseMetadataJsonToObj(json, obj);
         else console.log("Skip empty json: " + filepath + "/" + filename);    // 注意，會有空的 json 檔...
         GlobalVar.metadataFilesLoaded++;
         
         // 2025-01-21: metadata files 全部讀入後，才進行下一步 readDirJsonFiles()
         //console.log(GlobalVar.metadataFilesLoaded + "/" + GlobalVar.metadataTotalFiles);
         if (GlobalVar.metadataFilesLoaded == GlobalVar.metadataTotalFiles) {
            readDirJsonFiles();
         }
      });
      var encoding = 'utf-8';         // 'utf-8', 'big5'
      fr.readAsText(obj.file, encoding);
   }
   
   function setupFolderJsonReader(obj) {
      let filename = obj.filename;
      let filepath = obj.filepath;

      // 2025-02-01: 加上以下檢查，似乎就可以避免「若使用者新增 folder 檔案會被重覆載入」的問題... （但沒有仔細確認）
      //alert(Object.keys(GlobalVar.jsonProcessedHash).length + "\n" + GlobalVar.jsonFilesLoaded);

      if (GlobalVar.jsonFilesLoaded == GlobalVar.jsonTotalFiles) {
         readIiifMetadataFiles();           // 2026-01-22: 直接跳到下一步
      }

      if (GlobalVar.jsonProcessedHash[filepath+'/'+filename]) {       // 先前（某批次）已經處理過
         //GlobalVar.jsonFilesLoaded++;            
         return;
      }
      else GlobalVar.jsonProcessedHash[filepath+'/'+filename] = 1;

      let fr = new FileReader();
      fr.addEventListener('load', function(evt) {                     // fr.onload(function(){...})
         let s = evt.target.result; 
         s = s.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, '');      // 移除 invalid characters

         let corpusTitle = $("#inCorpusTitle").val().trim();
         
         // 2025-04-09: 防呆 fail-safe
         let udefMetadataXml = '';
         if (GlobalVar.folderMetadataFileDict[filepath]) udefMetadataXml = GlobalVar.folderMetadataFileDict[filepath].udefMetadataXml || '';
         let docMetadataXml = '';
         if (GlobalVar.folderMetadataFileDict[filepath]) docMetadataXml = GlobalVar.folderMetadataFileDict[filepath].docMetadataXml || '';
         //console.log("folderMetadataFileDict[" + filepath + "].docMetadataXml:\n" + docMetadataXml);
         
         // fileInfo : = { "filename":"图一五九.json",
         //                "filepath":"20241018-Immarkus-Iva/REPORTS/book reports/Changsha",
         //                "text": (filepath/filename image markup with json),
         //                udefMetadataXml,
         //                docMetadataXml };
         let fileInfo = {filename, filepath, text:s, udefMetadataXml, docMetadataXml};      // 2024-10-27: 加上 udefMetadataXml, docMetadataXml
         
         GlobalVar.corpusDataDict[corpusTitle].push(fileInfo);
         
         $("#loadedFilenameList").append(corpusTitle + ": " + filename + "\n");              // 2017-05-24
         
         // 注意：檔案還沒處理完畢，需等全部載入處理後呼叫 finishReadingDirFiles() 才能呼叫 refreshCorpusDisplay();
         //refreshCorpusDisplay();
         GlobalVar.jsonFilesLoaded++;
         if (GlobalVar.jsonFilesLoaded == GlobalVar.jsonTotalFiles) {
            //readDirRelationFiles();          // 2024-12-23
            readIiifMetadataFiles();           // 2025-03-22
         }
      });
      var encoding = 'utf-8';         // 'utf-8', 'big5'
      fr.readAsText(obj.file, encoding);
   }
   
   function setupIiifMetadataJsonReader(manifestId) {
      // 從 _iiif.<immarkus_iiif_id>.json 讀取 iiif metadata 與 canvases 對應

      let obj = GlobalVar.folderIiifMetadataFileDict[manifestId];
      let filename = obj.filename;
      let filepath = obj.filepath;

      let fr = new FileReader();
      fr.addEventListener('load', function(evt) {                     // fr.onload(function(){...})
         // (1). 利用 folderIiifMetadataFileDict[manifestId].iiifManifestJson 儲存整份 _iiif.<immarkus_iiif_id>.json 內容
         //      後續可從 iiifManifestJson 取出 id (immarkus_iiif_id), name, uri (iiif_manifest), type, majorVersion 等欄位內容（先省略 importedAt, type）
         //      -- majorVersion 似乎是 iiif API 的版本？
         //      -- 透過 iiif_manifest 可取得 iiif image 的 manifest 檔
         //      API v2 從 sequences[i].canvases[j].images[k].resource.service['@id'] 取得 base_url
         //             base_url 就是原圖的 service.id
         //             拼接原圖位置：{base_url}/{region}/{size}/{rotation}/{quality}.{format}
         //                           通常就是在 base_url 後加上 /full/full/0/default.jpg 就可取得原圖
         //             若需確認是否真拿到最大解析度，可從 {base_url}/info.json 取得原圖的 width, height （以及支援哪幾種 filename extension）資訊
         //          v3 需從 items[i].items[j].body.service.id 取得 base_url
         // (2). 該如何看待 canvases 欄位？
         //      -- 每個 canvas 對應到 iiif manifest 所連結到的一份影像
         //         必須先存起來，後續 iiif annoation 時才能找出對應的影像

         $("#loadedFilenameList").append("iiif metadata: " + filename + "\n");
         let immarkusMetadataJson = JSON.parse(evt.target.result);
         //alert(JSON.stringify(immarkusMetadataJson));
         let iiifManifestUrl = immarkusMetadataJson.uri;              // 這個欄位需記錄在 DocuXml 中...
         //alert(iiifManifestUrl);

         obj.iiifCanvasIdMap = {};                                    // 2025-04-04: 方便透過 annotation json 從 canvas_id 找到 iiif sequenceId 和對應的影像（們？）
         obj.iiifApiVersion = immarkusMetadataJson.majorVersion;      // 2025-04-04: 注意是 Number 型態！
         obj.iiifManifestUrl = iiifManifestUrl;                       // 2025-04-20: 總是更新 iiifManifest 到 obj
         
         // 2025-03-28: unstable manifest       
         // 原先是用 $.getJSON()，但 https://www.loc.gov/item/gm71002478/manifest.json 似乎不甚穩定：
         // 有時似乎可以回傳 JSON（因此我可以下載圖檔），但有時回傳的結果卻是一份 html（看到一個網頁）？
         // 真的頗奇怪：3/28 早上測是回傳 html，但下午 3:30 測就回傳「正確」的 manifest json 檔...
         // 該網頁中 <link rel='alternate' type='image/jpeg' href="https://tile.loc.gov/image-services/iiif/service:gmd:gmd7:g7823:g7823h:ct001457/full/pct:25/0/default.jpg" />
         // 提到的 https://tile.loc.gov/image-services/iiif/service:gmd:gmd7:g7823:g7823h:ct001457/full/pct:25/0/default.jpg 才是真實影像位置
         
         // 某些狀況下，browser 會回傳 CORS header 'Access-Control-Allow-Origin' missing 錯誤訊息
         // => 因為 server 沒有在 回應 "Access-Control-Allow-Origin: *"，因此 browser 將 response 擋掉...
         //    CORS 限制主要會在以下情況發生：
         //    不同的網域（例如：從 localhost 請求 api.example.com）
         //    不同的 port（例如：從 localhost:3000 請求 localhost:8000）
         //    不同的 protocol（例如：http vs https）
         //    帶有特殊 header（例如加上 Authorization）
         // e.g., https://iiif.lib.harvard.edu/manifests/ids:7385474
         //       https://iiif.lib.harvard.edu/manifests/ids:7385464
         // => 可架設 Simple Web Server 解決此問題...
         var jqxhr = $.getJSON(iiifManifestUrl, function(manifestJson) {
            // 注意：在此假設 manifest 都是 valid... 沒有防呆檢查
            if (!manifestJson) {                     // 2025-04-09: 補上最簡單的防呆...
               alert("Error: fail to fetch iiif manifest from id " + manifestId + "\n" + iiifManifestUrl);
               GlobalVar.iiifManifestFail++;         // 也算是 fail（而非 success）
               return;
            }
            //alert(filename + "\n" + iiifManifestUrl + "\n" + JSON.stringify(manifestJson));
            
            // 2025-04-23
            parseIiifManifestJson(manifestJson, immarkusMetadataJson, manifestId);
            
            GlobalVar.iiifManifestSuccess++;
         }).done(function() {
            //console.log( "second success" );
         }).fail(function() {
            //alert("fail");                                                                 // 若發生 parseerror，會執行 fail(), error() 和 always()
            GlobalVar.iiifManifestFail++;
         }).error(function(jqXHR, textStatus, errorThrown) {
            if (textStatus === 'error' && jqXHR.status === 0) {
               alert("ERROR: fail to fetch IIIF manifest\n" + 
                     "IMMARKUS manifest id: " + manifestId + "\n" + iiifManifestUrl + "\n" + 
                     "Possibly due to server overload, CORS issues (may need a proxy to resolve it, or network problems");        // you may try it again later?
               GlobalVar.failedIiifManifestInfo[iiifManifestUrl] = { manifestId,            // 2025-04-21
                                                                     errorMessage: 'Likely CORS issue'
                                                                   };
            }
            // CORS error: 錯誤會被瀏覽器當作 TypeError，且不會有 response.status，因為請求根本沒成功
            //alert("error: " + textStatus);                                                 // error: parseerror
            //alert("incoming text: " + jqXHR.responseText);
            console.log("error: " + textStatus + " " + errorThrown.status);                  // e.g., error: parseerror
            console.log("incoming text: " + jqXHR.responseText);
         }).always(function() {
            //alert("complete");
            //console.log("complete");
            if (++GlobalVar.iiifMetadataFilesLoaded == GlobalVar.iiifMetadataTotalFiles) {
               readIiifAnnotationFiles();
            }
         });
          
         // Perform other work here ...
         // Set another completion function for the request above
         //jqxhr.always(function() {
         //   // console.log( "second complete" );
         //   // 2025-03-23: (bug fix) 因 async 緣故，必須將 iiifMetadataFilesLoaded 移到 always() 下！
         //});         
         
      });

      fr.readAsText(obj.file, 'utf-8');
   }
   
   function setupIiifAnnotationJsonReader(folderIiifAnnotationFileDict, immarkusManifestId) {
      // 2025-06-07: _iiif.<manifest_id>.annotations.json
      let obj = folderIiifAnnotationFileDict[immarkusManifestId];
      let filename = obj.filename;
      let filepath = obj.filepath;

      let fr = new FileReader();
      fr.addEventListener('load', function(evt) {                     // fr.onload(function(){...})
         let annotationData = evt.target.result; 
         
         let iiifMetadataObj = GlobalVar.folderIiifMetadataFileDict[immarkusManifestId];
         let iiifCanvasIdMap = iiifMetadataObj?.iiifCanvasIdMap;      // 2026-08-02
         
         if (iiifMetadataObj === undefined || iiifCanvasIdMap === undefined) {           // NO_IIIF_IMAGE_KEY, i.e., 'NO_IMG_KEY' ??
            // 2026-08-02: 加上 iiifMetadataObj 防呆
            // e.g., https://gallica.bnf.fr/iiif/ark:/12148/btv1b5963022t/manifest.json 有時會有 internal server error...
            alert("Error: undefined iiifMetadataObj or iiifCanvasIdMap\n - immarkus manifest id: " 
                  + immarkusManifestId + "\n" 
                  //+ JSON.stringify(iiifMetadataObj) + "\n"
                  + "=> Possibly due to server overload, failing to download manifest, or manifest parsing issues");
            if (++GlobalVar.iiifAnnotationFilesLoaded == GlobalVar.iiifAnnotationTotalFiles) readDirRelationFiles(); 
            return;
         }

         // TODO: 注意，GlobalVar.corpusDataDict[corpusTitle] 陣列的每一項都需對應到一篇文件（然後 filename 就是文件檔名）
         //       因此，這裡應該剖析 annotationData，將當中的每一個 canvas markup 轉成一份文件，
         //       也就是說，生成一或多份文件，每份文件提供一組 iiifAnnotationInfo
         //alert(immarkusManifestId + "\n" + JSON.stringify(iiifCanvasIdMap));

         // 比對流程：
         // 對每個 annotation item，從 target.source 的 ""iiif:<manifest_id>:<canvas_id>" 格式中，
         // 取出 manifest_id 和 canvas_id，再利用 GlobalVar.folderIiifMetadataFileDict[manifest_id]
         // 的 iiifCanvasIdMap 取得 iiif manifest 中的 imageKey，最後藉著這 imageKey 到 iiif manifest 
         // 找到對應的 sequence (i.e., sequence id with value <imageKey>) 和其下的影像
         
         // (1). 先收集所有的 canvas_id -- 每個 canvas_id 將會對應到一篇文件
         let immarkusAnnotation = (annotationData=='')               // 2025-04-05: 空字串會造成錯誤
                                ? [] : JSON.parse(annotationData);
         if (Array.isArray(immarkusAnnotation)) {
            let corpusTitle = $("#inCorpusTitle").val().trim();
            
            if (immarkusAnnotation.length == 0) {
               // 2025-04-08 防呆：目錄下有 _iiif.<manifest_id>.json 檔，但 _iiif.<manifest_id>.annotation.json 檔為空
               // 若 _iiif.<manifest_id>.annotation.json 為空，表示沒有對 iiif 的影像進行 piece 標記，應可直接跳過
               //let canvasImages = getCanvasImages(iiifMetadataObj.iiifManifestUrl,
               //                                   iiifMetadataObj.iiifApiVersion, 
               //                                   iiifMetadataObj.iiifManifestJson, 
               //                                   '-',                              // iiifImageKey
               //                                   immarkusManifestId,
               //                                   '(M)' + immarkusManifestId,       // canvasId ('(M)' 是為了方便辨識 -- 缺 annotation 檔，沒指定 canvasId 就只好用 manifest 並下載全部圖檔）
               //                                   []);                              // canvasAnnotation
               //let iiifAnnotationObj = { filepath,
               //                          filename,
               //                          immarkusManifestId,                                   // 2025-03-30: 加上這項參數
               //                          iiifManifestUrl: iiifMetadataObj.iiifManifestUrl,
               //                          iiifManifestJson: iiifMetadataObj.iiifManifestJson,   // 產生 DocuXml 時還需從中擷取 metadata
               //                          canvasImages,
               //                        };
               //GlobalVar.corpusDataDict[corpusTitle].push(iiifAnnotationObj);
            }
            else {
               // 將 immarkusAnnotation 中的每個項目，填入 canvasIdHash 以便彙整（canvasIdHash[canvadId] 包含所有在 canvadId 這張圖上的 pieces annoation）
               let canvasIdHash = {};
               immarkusAnnotation.forEach(function(annotationItem, itemIdx) {
                  let annotationItemId = annotationItem.id;             // 應該用不到
                  let source = annotationItem.target.source;
                  let [_, manifestId, canvasId] = source.split(':');
                  // 2025-04-05: Dawn 4/1 提供的樣本中，竟然有 target.source 是 "iiif:3acf4a276f285d36" --  會造成 canvasId 變成 undefined!
                  // 2025-04-16: Rainer 回覆，這表示它是 iiif manifest metadata
                  if (!manifestId) {   // 2025-04-05: 防呆 (fail-safe) -- 跳過這項 annotation item
                     alert("Error in annotation json (no manifest_id, no canvas_id): invalid target.source '" + source + "'");
                     return;
                  }
                  if (!canvasId) {            // 2025-04-18: Rainer 說，這是整份 manifest 圖檔的 metadata
                     canvasId = '-';          // 2025-04-18: 若 canvasId 為 '-'，就表示它是 manifest 的 metadata
                  }
                  if (!canvasIdHash[canvasId]) canvasIdHash[canvasId] = [];
                  canvasIdHash[canvasId].push(itemIdx);
               });
               
               // e,g., canvasIdHash := {"1562217993":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40],"-":[23]}
               // 表示 canvasId '1562217993' 在除了第 23 項是 metadata 外的 0..40 項
               //alert(JSON.stringify(canvasIdHash));
               
               let canvasIdList = Object.keys(canvasIdHash);
               //alert(JSON.stringify(canvasIdList));
               
               let canvasFilename = filename;                           // 預設，若 canvasIdList.length <= 1 時採用
               
               canvasIdList.forEach(function(canvasId, cIdx) {        
                  // 從 annotation json 擷取出 canvas annotation
                  let canvasAnnotation = [];
                  let itemIdxList = canvasIdHash[canvasId];             // itemIdxList: 在 annotationJson 的哪幾項都是參考到此 canvasId
                  itemIdxList.forEach(function(itemIdx) {
                     canvasAnnotation.push(immarkusAnnotation[itemIdx]);
                  });
                  
                  if (canvasIdList.length >= 3 || (canvasIdList.length == 2 && !canvasIdHash['-'])) {
                     canvasFilename = filename + "_c" + cIdx;     // 若有至少兩份 canvas，修改文件檔名
                  }
                  
                  // 若 canvasId == '-'，表示 canvasId 為空，此 annotation item 為 manifest metadata
                  if (canvasId == '-') {        
                     // 2025-06-13: 這是 IMMARKUS 使用者標記的 metadata，是「正常」的自訂 metadata，應放入 obj.udefMetadata...
                     //             obj := folderIiifAnnotationFileDict[immarkusManifestId];
                     canvasAnnotation.forEach(function(annotationItem) {     // 應該只會有一項
                        let jsonStr = JSON.stringify(annotationItem);
                        parseMetadataJsonToObj(jsonStr, obj);
                     });
                     //alert(JSON.stringify(obj.udefMetadataXml));
                     return;
                  }
                  
                  //alert(canvasId + "\n" + JSON.stringify(iiifCanvasIdMap));
                  let iiifImageKey = (iiifCanvasIdMap[canvasId])
                                   ? iiifCanvasIdMap[canvasId].imageKey : NO_IIIF_IMAGE_KEY;
                  //alert(iiifImageKey);
                  
                  // 從 iiifMetadataObj.iiifManifestJson 透過 imageKey 取得 canvasId 所對應的 iiifImageUrl
                  // -- Old API iiifImageUrl := sequences[i].canvases[j].images[k].resource['@id']
                  // -- API 3.0 iiifImageUrl := items[i].items[j].items[k].body.id
                  //    e.g., https://iiif.archive.org/iiif/3/reportofinternatinte/manifest.json
                  // getCanvasImages() 回傳 [{ iiifImageUrl, canvasId, imageKey, canvasAnnotation}, ...] 陣列
                  //                   每個 element 代表 iiif manifest 中的一張圖，canvasId 為 IMMARKUS 所加上的辨識碼（後面 piece annotation 會用到）

                  //alert("iiifMetadataObj:" +JSON.stringify(iiifMetadataObj));
                  //alert(iiifMetadataObj.iiifImageUrl);
                  let canvasImages = getCanvasImages(iiifMetadataObj.iiifManifestUrl,
                                                     iiifMetadataObj.iiifApiVersion, 
                                                     iiifMetadataObj.iiifManifestJson,
                                                     iiifImageKey,
                                                     immarkusManifestId,             // 2025-06-07
                                                     canvasId,
                                                     canvasAnnotation);
                  //alert(JSON.stringify(canvasImages));
                  
                  // Note:
                  // folderIiifMetadataFileDict[immarkusManifestId] = { filename, filepath, file, iiifManifestUrl, iiifManifestJson, iiifImageUrl, iiifCanvasIdMap }
                  // folderIiifAnnotationFileDict[immarkusManifestId] = { filepath, filename, file, udefMetadataXml, docMetadataXml } 但後兩項 xml 似乎用不到？
                  
                  let iiifAnnotationObj = { filepath,
                                            filename: canvasFilename, 
                                            immarkusManifestId,                                   // 2025-03-30: 加上這項參數
                                            iiifManifestUrl: iiifMetadataObj.iiifManifestUrl,
                                            iiifManifestJson: iiifMetadataObj.iiifManifestJson,   // IIIF service 所提供的 manifest 內容 -- 產生 DocuXml 時還需從中擷取 metadata
                                            canvasImages,      // [ {iiifImageUrl, imageKey, imageWidth, imageHeight, imageAnnotations}, ...] ，原先僅有 iiifMetadataObj.iiifImageUrl
                                            docMetadataXml: obj.docMetadataXml,                   // 2025-06-13
                                            udefMetadataXml: obj.udefMetadataXml,                 // 2025-06-13
                                          };
                  GlobalVar.corpusDataDict[corpusTitle].push(iiifAnnotationObj);
               });
            }  // (immarkusAnnotation.length != 0)
         }
         else {
            let msg = "SKIP: invalid immarkus annotation format: " + filepath + "/" + filename;
            console.log(msg);
         }
         
         $("#loadedFilenameList").append("iiif annotation: " + filename + "\n");
         if (++GlobalVar.iiifAnnotationFilesLoaded == GlobalVar.iiifAnnotationTotalFiles) {
            // 結束 parsing，剖析結果會儲存在 GlobalVar.corpusDataDict
            //console.log(GlobalVar.corpusDataDict);    // for debugging
            showProgressMsg("parse relations");         // 2026-06-20
            window.setTimeout(function() {         
               readDirRelationFiles(); 
            }, 300);
         }
      });

      fr.readAsText(obj.file, 'utf-8');
   }
   
   function setupFolderImmarkusRelationsReader(obj) {
      let filename = obj.filename;
      let filepath = obj.filepath;
      var fr = new FileReader();
      fr.addEventListener('load', function(evt) {            // fr.onload(function(){...})
         var jsonStr = evt.target.result;
         if (jsonStr.length > 0) parseImmarkusRelations(jsonStr, filename);
         else console.log("Skip empty json: " + filepath + "/" + filename);    // 注意，會有空的 json 檔...
         if (++GlobalVar.relationFilesLoaded == GlobalVar.relationTotalFiles) finishReadingDirFiles();
      });
      var encoding = 'utf-8';         // 'utf-8', 'big5'
      fr.readAsText(obj.file, encoding);
   }

   async function finishReadingDirFiles() {
      // TODO: 還需檢查是否 iiif manifest 都已載入，完成之後才呼叫 finishFolderImports()
      await checkIiifManifestReady(1);
   }
   
   async function finishFolderImports() {
      // 注意：執行至此，檔案應已全部載入，可透過 generateWithAttachedRelations() 
      //       產生 DocuXml 並對影像進行 accessible check
      console.log("Message: finish reading folder files");
      
      // 2025-04-28
      //GlobalVar.convertEachPiece2Doc = $("#convertEachPiece2OneDoc").is(":checked");
      //alert(GlobalVar.convertEachPiece2Doc);
      
      // 2025-01-30: 因為想在載入後就測試 image accessibility，所以還是在此將 data 轉成 global var
      $("#imageCheckItems").empty();                                    // 清空
      GlobalVar.imageAccessibilityCheck = { urlHashToCheck: {},         // 2025-02-01: reset
                                            urlPassHash: {},
                                            urlFailHash: {},
                                          };
      GlobalVar.finalDocuXml = await generateWithAttachedRelations();   // 會呼叫 generateDocuXml() 
      //alert(JSON.stringify(GlobalVar.imageAccessibilityCheck));
            
      // 2025-04-03: 若需將 piece 轉為文件，就呼叫 convertPiece2Doc() 並轉回 finalDocuXml
      if (GlobalVar.convertEachPiece2Doc) {
         GlobalVar.finalDocuXml = convertPiece2Doc(GlobalVar.finalDocuXml);
      }

      // 2026-01-31
      let nextStepKey = (InXmarkusLocalMode || (window.self !== window.top)) ? "ChildIframe" : "Independent";
      let nextInstId = "nextStepInstructions" + nextStepKey;
      
      function urlCheckFinished() {
         // 注意：若使用者額外添加 Immarkus folder，可能導致同一份 url 被檢查多次，因此 pass/fail 都改用 hash
         let totalUrls = Object.keys(GlobalVar.imageAccessibilityCheck.urlHashToCheck).length;
         let passCount = Object.keys(GlobalVar.imageAccessibilityCheck.urlPassHash).length;
         let failCount = Object.keys(GlobalVar.imageAccessibilityCheck.urlFailHash).length;
         //console.log(totalUrls + ':' + passCount + ':' + failCount);
         showProgressMsg((passCount + failCount) + '/' + totalUrls);
         
         // 若程式沒有錯，應該用 "==" 來精準獲取「是否完成」資訊，若採用 ">=" 則只是偷懶，因為不檢查影像是否可存取，仍可轉出 DocuXml
         return (totalUrls == passCount + failCount);             
      }
      
      function imageCheckLoop(loopCount) {
         console.log('checkImage: ' + loopCount);
         if (++loopCount >= 500 || urlCheckFinished()) {
            // 迴圈跑太多次（直接跳過），或者已沒有 image url 需要檢測
            //alert(loopCount + ':' + Object.keys(GlobalVar.imageAccessibilityCheck.urlHashToCheck).length);
            showNextStep();
         }
         else window.setTimeout(() => imageCheckLoop(loopCount), 400);
      }
      
      function showNextStep() {
         // 2025-01-30: 原先是讀入檔案就傳遞訊息給父視窗，現移到 finish batch 再執行
         //if (InXmarkusLocalMode) {
            // 嘗試將「使用者已在 Immarkus2D 選了目錄」的動作傳訊給 Converting page 知道
            // 2025-02-20: 訊息格式包含 source, target, parameters, type, message 五項參數
            let wrapper = { source: 'Immarkus2D',
                            target: 'ConvertingPage',
                            parameters: [],
                            type: 'json',
                            message: { action: 'DirSelection' }
                          };
            window.parent.postMessage(wrapper, '*');     // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
         //}

         // 2025-05-21: 注意，加上 DirHandle 後，讓使用者選擇多個 project folders 可能會產生問題（即使處於相同 browser session，兩次載入的 folder 應該是不同的）
         //if (InXmarkusLocalMode || ['Firefox'].includes(BrowserType)) {
            $("#" + nextInstId).fadeIn(500);  
         //}
         
         hideProgressMsg();
      }

      let loopCount = 0;      
      window.setTimeout(() => imageCheckLoop(loopCount), 100);

      // 等一秒後才顯示新的 corpus data（即使影像檢查還未結束... 因影像檢查不會影響最後 DocuXml，不需等檢查完畢才更新顯示）
      window.setTimeout(refreshCorpusDisplay, 1000);
   }

   // ------------------------------------------------------------------------------------------
   
   function getIiifImageUrl(manifestJson) {          // 暫時不透過 apiVersion 判斷，而是用 manifest json 結構判斷...
      // {base}/info.json 會明確列出支援的 profiles / sizes / tiles / qualities
      // {service["@id"]}/{region}/{size}/{rotation}/{quality}.{format}
      // 2025-03-24: 設定到 obj -- 由於 obj 是 GlobalVar.folderIiifMetadataFileDict[manifestId] 的 reference，因此會更新該全域變數的值
      // 2025-04-03: 在此只先取得第一筆影像 url -- 似乎不必要？後續再找時間清理...
      // 2026-01-17: 有時 IMMARKUS 留下的 manifest URL 其實是 "canvas JSON" URL？
      let sequences = manifestJson.sequences;
      let baseUrl;
      let suffix = '/full/full/0/default.jpg';       // 預設的 suffix -- 有的會是 "https://gallica.bnf.fr/iiif/ark:/12148/btv1b52519649q/f1/full/full/0/native.jpg"
      let imageUrl;
      
      if (sequences) {                               // v2
         let canvasImage = sequences[0].canvases[0].images[0];
         // 2026-01-17: 有時會同時有 canvasImage.resource['@id'] 和 canvasImage.resource.service['@id']
         let resourceId = canvasImage.resource['@id'];
         imageUrl = (resourceId && resourceId.endsWith(".jpg"))
                  ? resourceId
                  : canvasImage.resource.service['@id'] + suffix;     // 2026-01-16: resource['@id'] 即可
      }
      else {                       // v3
         // v3 要取得 base url，似乎變化多且複雜... 
         // 多數 base url 可透過兩層 items 取得，
         // 但 https://iiif.archive.org/iiif/3/reportofinternatinte/manifest.json 有三層 items，且 service 是個陣列...
         let item = manifestJson.items[0].items[0];
         if (item.items) {
            item = item.items[0];               // 2025-04-21: e.g., https://iiif.archive.org/iiif/3/reportofinternatinte/manifest.json
            let body = item.body;
            baseUrl = body.id;                  // e.g., https://iiif.archive.org/image/iiif/3/reportofinternatinte%2Freportofinternatinte_jp2.zip%2Freportofinternatinte_jp2%2Freportofinternatinte_0001.jp2/full/max/0/default.jpg
            if (baseUrl.endsWith(".jpg")) {
               suffix = '';
            }
            else {
               let service = body.service;
               if (Array.isArray(service)) service = service[0];
               baseUrl = service.id;
            }
         }
         else baseUrl = item.id;
         imageUrl = baseUrl + suffix;
      }
      return imageUrl;
   }
            
   function getCanvasImages(iiifManifestUrl, apiVersion, iiifManifestJson, iiifImageKey, manifestId, canvasId, canvasAnnotation) {
      // iiifImageKey: 擷取影像時，對應到的 sequence.id
      // API v2 從 sequences[i].canvases[j].images[k].resource.service['@id'] 取得 base_url
      //        base_url 就是原圖的 service.id
      //        拼接原圖位置：{base_url}/{region}/{size}/{rotation}/{quality}.{format}
      //                      通常就是在 base_url 後加上 /full/full/0/default.jpg 就可取得原圖
      //        若需確認是否真拿到最大解析度，可從 {base_url}/info.json 取得原圖的 width, height （以及支援哪幾種 filename extension）資訊
      //     v3 需從 items[i].items[j].body.service.id 取得 base_url
      //  簡單說，base_url: 等於圖像的 service.id（同時是 identifier）
      //          原圖 URL: {base_url}/full/full/0/default.jpg
      //          info.json: {base_url}/info.json 查看原圖大小與支援格式（偷懶，目前 Immarkus2D 不去做這些檢查...）

      // 2025-06-07: 先透過 GlobalVar.folderIiifMetadataFileDict[manifestId].iiifCanvasIdMap[canvasId].imageKey 取得 canvasId 所對應到的 uri
      let iiifObj = GlobalVar.folderIiifMetadataFileDict[manifestId];
      let canvasUri = null;
      if ((typeof iiifObj === "object") && (iiifObj !== null)) {
         let canvasObj = iiifObj.iiifCanvasIdMap[canvasId];
         if ((typeof canvasObj === "object") && (canvasObj !== null)) {
            canvasUri = canvasObj.imageKey;
         }
         else alert("Error: fail to access canvasId '" + canvasId + "' within manifestId: " + manifestId);
      }
      else {
         alert("Error: fail to access manifestId: " + manifestId);
      }

      // 2025-12-19: IIIF service 可能會升級，導致與 IMMARKUS 先前的記錄不同？！（IMMARKUS 似乎不會自動更新舊的相關內容？）
      // 2025-12-21: Rainer 回信
      //             - Manifests that gave more than one image per canvas are, in practice, extremely rare. 
      //             - IMMARKUS doesn't support them directly. It would skip all images on this canvas except the first one.
      //             - Therefore, its safe to assume that an IMMARKUS annotation that points to a Canvas is targeting the first image on this canvas.
      
      let apiVersionUpgraded = false;     // 沿用 IMMARKUS 所提供的 apiVersion 以及 iiifImageKey, canvasUri 等訊息
      
      let canvasImages = [];
      if (iiifManifestJson) {
         //console.log(iiifManifestJson);
         //alert(apiVersion + "\n" + JSON.stringify(iiifManifestJson));
         // IMMARKUS json 提供的 apiVersion 可能有誤！（也許是 IIIF service 升級？）
         if (apiVersion == 2 && !iiifManifestJson.sequences && iiifManifestJson.items) {
            // 2025-12-19: 例如 _iiif.bfcc263a1e0e3d02.json 和 _iiif.bfcc263a1e0e3d02.annotations.json
            apiVersion = 3;               // 自動升級！
            apiVersionUpgraded = true;
            //alert("Yes upup!");
            console.log("Auto-upgrade IMMARKUS canvas uri's api version -- " + manifestId);
         }
         let sequences = (apiVersion == 2)                     // 2 or 3（注意，是從 immarkus json 讀取而來，因此應該是數字型態）
                       ? iiifManifestJson.sequences
                       : iiifManifestJson.items;
         if (!sequences) {       // 有時（尤其是台北時間約下午 4:00-5:00）會失敗！
            alert("ERROR: cannot find legal sequences data, manifest uri " + iiifManifestUrl + "\nPerhaps due to unstable IIIF service -- you may retry later");
            //alert(apiVersion + "\n" + JSON.stringify(iiifManifestJson));
            return [];
         }

         sequences.forEach(function(sequence, seqIdx) {
            // 注意，canvases 也可能有多項，例如 https://gallica.bnf.fr/iiif/ark:/12148/btv1b5963022t/manifest.json 的 canvases 就有兩項...
            // 這裡藉由 iiifImageKey 篩出指定的 canvas
            // 2025-04-05: 若沒有 sequence.id，例如 https://www.davidrumsey.com/luna/servlet/iiif/m/RUMSEY~8~1~364271~90131788/manifest，就不需比對 iiifImageKey
            // 2025-04-20: (bug fix) 加上 iiifImageKey !== NO_IIIF_IMAGE_KEY 檢查
            
            //if (sequence.id !== undefined && iiifImageKey !== NO_IIIF_IMAGE_KEY && sequence.id !== iiifImageKey) return;       // 不是指定的 canvas，直接跳過
            // 例如，_iiif.c216ce029301c26e.json 包含了兩張圖，必須用 uri 比對 sequence id 來從 manifest 找出實際的影像

            // 2025-12-22: 注意，IMMARKUS json 的 canvas uri (iiifImageKey)，對應到的是 sequence id
            //             參考「20250318-Immarkus-Dawn-iiif-ManuscriptMaps」的例子，可發現似乎不能加上 sequence['@id']...
            //             sequence['@id']           := https://iiif.lib.harvard.edu/manifests/drs:437267661/sequence/normal.json
            //             iiifImageKey              := https://iiif.lib.harvard.edu/manifests/drs:437267661/canvas/canvas-437267664.json
            //             sequence.canvases.['@id'] := https://iiif.lib.harvard.edu/manifests/drs:437267661/canvas/canvas-437267664.json
            //             => 加上去反而可能判斷失誤！（即使是 api version 2，有時 sequence['@id'] 會有值，不等於 iiifImageKey 卻不該被跳過...）
            let sequenceId = sequence['id'];
            if (apiVersion == 2 && !sequenceId) {
               sequenceId = sequence.canvases?.['@id'];                // 2025-12-22
               //alert("yes: " + "\n" + sequence['@id'] + '--- ' + sequenceId + ' -- ' + iiifImageKey + "\n\n" + JSON.stringify(sequence));
            }
            
            if (sequenceId && iiifImageKey !== NO_IIIF_IMAGE_KEY) {    // 兩者都有值
               if (!apiVersionUpgraded) {
                  if (sequenceId !== iiifImageKey) return;       // 不是指定的 canvas，直接跳過
               }
               //else {
               //   // 2025-12-22: 自動升級後，似乎就不需以下處理了？
               //   // e.g., sequenceId   https://gallica.bnf.fr/iiif/ark:/12148/btv1b5963022t/sequence/default
               //   //       iiifImageKey https://gallica.bnf.fr/iiif/ark:/12148/btv1b5963022t/canvas/f1
               //   let sequencdIdPrefix = sequenceId.split('/').slice(0,-2).join('/');
               //   let iiifImageKeyPrefix = iiifImageKey.split('/').slice(0,-2).join('/');
               //   if (sequencdIdPrefix !== iiifImageKeyPrefix) return;       // 不是指定的 canvas，直接跳過
               //}
            }
            
            let canvases = (apiVersion == 2)
                         ? sequence.canvases
                         : sequence.items;
            //alert("api ver=" + apiVersion + "\n" + "iiifImageKey:" + iiifImageKey + "\n -- yes canvases --- " + canvases.length + "\n" + JSON.stringify(canvases));
            
            canvases.forEach(function(canvas, canIdx) {
               // 2025-06-07: 需利用 IMMARKUS canvasAnnotation 所儲存的 canvasUri（_iiif.<manifest_id>.json 每個項目的 uri）
               //             進行對應，找出相對應的 image url
               //let iiifCanvasUri = canvas['@id'] || canvas['id'];               // 2025-06-07, 2025-12-18 加上 'id'
               let iiifCanvasUri = (apiVersion == 2) 
                                 ? canvas['@id'] : canvas['id'];
               if (iiifCanvasUri !== canvasUri) {
                  //alert(JSON.stringify(canvas));
                  //saveJson4Debugging(`iiif_canvas_${canIdx}`, canvas);
                  
                  // 沒匹配到（不是這份 canvas image）
                  // ==> 按理應該直接 return 跳過，但 IMMARKUS 儲存的 canvasUri 有些怪...
                  // 2025-12-19: 會有 https://lib.is/IE978510/item/item-FL978514.json (from IIIF manifest) 和 
                  //                  https://lib.is/IE978510/canvas/canvas-FL978514.json (from IMMARKUS _iiif.b99b32f0fa277d06.json) 的差異？
                  //                 （但兩者都貌似無法取得「看起來內容有意義」的 json...）
                  // 或者 https://iiif.io/api/cookbook/recipe/0309-annotation-collection/annotation_page_painting/ap2
                  //      https://iiif.io/api/cookbook/recipe/0309-annotation-collection/canvas/p2 (IMMARKUS _iiif.c216ce029301c26e.json)
                  //      這個例子中， canvas.items[0].target （以及 sequence.id？）可取得 "https://iiif.io/api/cookbook/recipe/0309-annotation-collection/canvas/p2"
                  // ==> 最簡單且合適的解法，是 Rainer 修改 IMMARKUS _iiif.<manifestid>.json 中的值（但溝通不易，且 Rainer 似乎也不想講清楚該怎麼進行比對...）
                  //     目前似乎只能「頭痛醫頭」，看到一個例外就需處理一次...
                  
                  //if (iiifCanvasUri !== canvasUri.replace(/canvas/g,'item') &&
                  //    canvas.items?.[0]?.id !== canvasUri &&
                  //    canvas.items?.[0]?.target !== canvasUri) {
                  //   return;
                  //}

                  // 2025-12-22: 
                  // Rainer 說 "its safe to assume that an IMMARKUS annotation that points to a Canvas is targeting the first image on this canvas"
                  // 2026-01-10: iiifCanvasUri 在此若 canvases.length > 1，將直接跳過不處理
                  //             否則 _iiif.5cff5b5ed1dbe211.json 會產生多餘的 <ImmarkusImage>
                  if (canvases.length == 1) ;      // pass -- 否則可能會造成 canvasImages 為空的狀況！
                  else return;                     // try next one
               }
               
               // 2026-02-11: 最保險的方式，還是從 info.json 取得原始影像的 width 和 height，但這樣需額外 fetch 一次...
               //             例如 https://www.loc.gov/item/gm71005066/manifest.json 的
               //             resource @id 為 https://tile.loc.gov/image-services/iiif/service:gmd:gmd7:g7910:g7910:ct001390/full/pct:25/0/default.jpg，
               //             雖然 manifest 給出 width 為 3301，height 為 4095，但其實（從 info.json 才能得知）原始大小為 width 16381, height 13206！
               //             => URL 中的 pct:25 表示其為 25% 大小！
               //             => 透過 fetchIiifInfo() 取得 info.json 中的 width, height，但僅僅為了取得 width, height 就還需額外 fetch 一次，實在很沒效率
               //               （主要是 Rainer 不肯將這些資訊記錄在 IMMARKUS IIIF json 吧）
               //             => 目前先採用「約略」的方式，看到 pct:nn 就直接把 width, height 乘上 100/nn
               let baseUrl, imageKey, iiifImageUrl;
               let imageWidth = 0, imageHeight = 0;     // 2026-01-18: 記錄 manifest 中，resource（原始圖片）的 width, height
               let suffix = '/full/full/0/default.jpg';
               
               if (apiVersion == 2) {       // v2
                  //let images = canvas.images;       
                  //let resource = images[0].resource;
                  //iiifImageUrl = resource['@id'] || resource.service['@id'] + suffix;    // 2026-01-17

                  // 2026-01-17: 有時會同時有 canvasImage.resource['@id'] 和 canvasImage.resource.service['@id']
                  let canvasImage = canvas.images[0];
                  let resourceId = canvasImage.resource['@id'];
                  iiifImageUrl = (resourceId && resourceId.endsWith(".jpg"))
                               ? resourceId
                               : canvasImage.resource.service['@id'] + suffix;     // 2026-01-16: resource['@id'] 即可
                  //alert(iiifImageUrl);
                  imageWidth = canvasImage.resource['width'];          // 2026-01-18 => 2026-02-11: 但這個仍然可能是縮圖的寬度！
                  imageHeight = canvasImage.resource['height'];        // 2026-01-18
                  
                  // 2026-03-05: 注意，由於可能會有四捨五入等精度問題，此處「還原」出的原始大小只是趨近值 => 但目前應該也夠用了...
                  if (GlobalVar.useRestUrlPct2AdjustImageSize) {
                     let found = iiifImageUrl.match(/\/pct:(\d+)\//);
                     if (found) {
                        //alert(JSON.stringify(found));      // e.g., ["/pct:25/","25"]
                        imageWidth = '' + parseInt(imageWidth) * 100 / parseInt(found[1]);   // 最後轉為字串
                        imageHeight = '' + parseInt(imageHeight) * 100 / parseInt(found[1]);   // 最後轉為字串
                     }
                  }
                  
                  imageKey = 'iiif_v2_' + canvasId + '_' + seqIdx + '.' + canIdx;
               }
               else {                       // v3
                  // 注意：這裡的判斷規則還是一團亂... 日後需找時間重構才好
                  if (canvas.items) canvas = canvas.items[0];          // 有三層 items
                  baseUrl = canvas.body.id || canvas.id;
                  if (baseUrl.endsWith(".jpg")) suffix = '';           // 直接採用 id
                  else {
                     let service = canvas.body.service;
                     if (Array.isArray(service)) service = service[0];
                     baseUrl = service.id;
                  }
                  imageKey = 'iiif_v3_' + canvasId + '_' + seqIdx + '.' + canIdx;
                  imageWidth = sequence['width'];          // 2026-01-18
                  imageHeight = sequence['height'];        // 2026-01-18
                  iiifImageUrl = baseUrl + suffix;
               }
               let canvasObj = { iiifImageUrl,
                                 canvasId,                 // 2025-06-07
                                 imageKey, 
                                 imageWidth,               // 2026-01-18
                                 imageHeight,              // 2026-01-18
                                 canvasAnnotation,
                               };
               canvasImages.push(canvasObj);
               //alert("yes123 --- " + imageKey + "\n" + iiifImageUrl + "\n" + canvasImages.length);
            });
         });
         
         //alert(JSON.stringify(canvasImages));
         if (canvasImages.length == 0) {
            //saveJson4Debugging(`iiif_${manifestId}_manifestJson`, iiifManifestJson);
            alert("ERROR: cannot find canvasImages! manifestId:\n" + manifestId);
         }
      }
      else {
         // 2025-04-21
         if (GlobalVar.failedIiifManifestInfo[iiifManifestUrl]) {
            // TODO: missing manifest -- but should produce an canvasImages array?
            let canvasObj = { iiifImageUrl: null,
                              canvasId,                 // 2025-06-07
                              imageKey: NO_IIIF_IMAGE_KEY, 
                              'imageWidth':0,               // 2026-01-18
                              'imageHeight':0,              // 2026-01-18
                              canvasAnnotation,
                            };
            canvasImages.push(canvasObj);
         }
         else {
            let msg = (iiifManifestJson === undefined)
                    ? "Invalid IIIF Manifest (fail to load or invalid json)"
                    : "Fail to get a valid JSON from:\n" + iiifManifestUrl;
            alert("Fail to find sequenes/items in iiif manifest json\n" + msg);
         }
      }
      return canvasImages;         
   }
   
   // --------------------------------------------------------------------------------------
   // 以下為 ChatGPT 給出的「取得 image size」程式
   // 由於 Rainer 不願意將 IMMARKUS 所取得的資訊留在 annotation json，後續 Immarkus2D 可能需用到...
   
   // ---------------------  (start of fetching IIIF image size)  --------------------------
   // 核心：從 service base 抓 info.json（Promise）
   function fetchIIIFInfoJSON(serviceBaseUrl) {
     const base = String(serviceBaseUrl || "").replace(/\/$/, "");
     const infoUrl = base + "/info.json";
   
     return $.getJSON(infoUrl).then(function (info) {
       return {
         infoUrl,
         width: info?.width,
         height: info?.height,
         info
       };
     });
   }
   
   // 解析 manifest：取出每個 canvas 的 service + 尺寸（v2/v3 都可）
   function extractCanvasesFromManifest(manifest) {
     const canvases = [];
   
     // IIIF Presentation v3: manifest.items = canvases
     const v3Items = manifest?.items;
     if (Array.isArray(v3Items)) {
       v3Items.forEach((c, idx) => canvases.push({ canvas: c, index: idx }));
     }
   
     // IIIF Presentation v2: manifest.sequences[0].canvases = canvases
     const v2Canvases = manifest?.sequences?.[0]?.canvases;
     if (Array.isArray(v2Canvases)) {
       v2Canvases.forEach((c, idx) => canvases.push({ canvas: c, index: idx }));
     }
   
     return canvases;
   }
   
   function extractImageServiceBaseFromCanvas(canvas) {
     // v3: canvas.items[0].items[0].body.service[0].id (或 service.id)
     const v3Service =
       canvas?.items?.[0]?.items?.[0]?.body?.service;
   
     if (Array.isArray(v3Service) && v3Service[0]?.id) return v3Service[0].id;
     if (Array.isArray(v3Service) && v3Service[0]?.["@id"]) return v3Service[0]["@id"];
     if (!Array.isArray(v3Service) && v3Service?.id) return v3Service.id;
     if (!Array.isArray(v3Service) && v3Service?.["@id"]) return v3Service["@id"];
   
     // v2: canvas.images[0].resource.service["@id"]
     const v2Service = canvas?.images?.[0]?.resource?.service;
     if (v2Service?.["@id"]) return v2Service["@id"];
     if (v2Service?.id) return v2Service.id;
   
     return null;
   }
   
   function extractDimsFromManifest(canvas) {
     // v2 常見：canvas.width/height 或 resource.width/height
     const w =
       canvas?.width ??
       canvas?.images?.[0]?.resource?.width ??
       canvas?.items?.[0]?.items?.[0]?.body?.width;  // v3 也可能在 body
   
     const h =
       canvas?.height ??
       canvas?.images?.[0]?.resource?.height ??
       canvas?.items?.[0]?.items?.[0]?.body?.height;
   
     return (Number.isFinite(w) && Number.isFinite(h)) ? { width: w, height: h } : null;
   }
   
   // 主函式：給 manifest（物件或 URL）→ 回傳每張圖的原始尺寸 + info.json
   function getIIIFImageSizesFromManifest(manifestOrUrl, options) {
     const opt = Object.assign(
       {
         maxCanvases: Infinity,     // 你可限制最多抓幾張
         fetchInfoJson: true,       // 沒尺寸時才抓 info.json（預設 true）
         concurrency: 4             // 同時請求數（避免一次打爆 server）
       },
       options || {}
     );
   
     function loadManifest(x) {
       if (typeof x === "string") return $.getJSON(x);
       return $.Deferred().resolve(x).promise();
     }
   
     return loadManifest(manifestOrUrl).then(function (manifest) {
       const canvasList = extractCanvasesFromManifest(manifest).slice(0, opt.maxCanvases);
   
       // 建立任務
       const tasks = canvasList.map(function (item) {
         const canvas = item.canvas;
         const serviceBase = extractImageServiceBaseFromCanvas(canvas);
         const manifestDims = extractDimsFromManifest(canvas);
   
         return function () {
           // 先用 manifest 的 width/height
           if (manifestDims) {
             return $.Deferred().resolve({
               index: item.index,
               canvasId: canvas?.id || canvas?.["@id"],
               serviceBase,
               width: manifestDims.width,
               height: manifestDims.height,
               source: "manifest"
             }).promise();
           }
   
           // 沒有就去抓 info.json（若允許）
           if (!opt.fetchInfoJson || !serviceBase) {
             return $.Deferred().resolve({
               index: item.index,
               canvasId: canvas?.id || canvas?.["@id"],
               serviceBase,
               width: null,
               height: null,
               source: "none"
             }).promise();
           }
   
           return fetchIIIFInfoJSON(serviceBase).then(function (r) {
             return {
               index: item.index,
               canvasId: canvas?.id || canvas?.["@id"],
               serviceBase,
               width: r.width ?? null,
               height: r.height ?? null,
               source: "info.json",
               infoUrl: r.infoUrl
             };
           }).catch(function () {
             // CORS/網路錯誤等
             return {
               index: item.index,
               canvasId: canvas?.id || canvas?.["@id"],
               serviceBase,
               width: null,
               height: null,
               source: "info.json_failed"
             };
           });
         };
       });
   
       // 簡單 concurrency 控制（jQuery promise 版）
       const results = [];
       let i = 0;
   
       function runNext() {
         if (i >= tasks.length) return $.Deferred().resolve(results).promise();
   
         const batch = [];
         for (let k = 0; k < opt.concurrency && i < tasks.length; k++, i++) {
           batch.push(tasks[i]());
         }
   
         return $.when.apply($, batch).then(function () {
           const args = arguments.length === 1 ? [arguments[0]] : Array.from(arguments);
           args.forEach(r => results.push(r));
           return runNext();
         });
       }
   
       return runNext();
     });
   }
   
   // 使用範例
   
   //const manifestUrl = "https://www.loc.gov/item/gm71005066/manifest.json";
   //getIIIFImageSizesFromManifest(manifestUrl, { maxCanvases: 10 })
   //  .then(function (list) {
   //    console.log(list);       // list[0].width / list[0].height
   //  });
     
   // 若只要第一張（最常見）
   //getIIIFImageSizesFromManifest(manifestUrl, { maxCanvases: 1 })
   //  .then(list => console.log(list[0]));

   // ----------------------  (end of fetching IIIF image size)  ---------------------------
   
   async function checkIiifManifestReady(retry) {
      // 2025-03-24
      const maxRetry = 20;
      if (GlobalVar.iiifManifestTotal == GlobalVar.iiifManifestSuccess + GlobalVar.iiifManifestFail || retry >= maxRetry) {
         await finishFolderImports();
      }
      else {
         let msg = "iiif check: " + retry;
         showProgressMsg(msg);                       // 2025-04-20
         console.log(msg);
         window.setTimeout(function() {
            checkIiifManifestReady(retry+1);
         }, 500);
      }
   }
   
   // --------------------------------------
   //       parsing imported files
   // --------------------------------------
   
   //function parseDocuXmlStr(xmlStr) {
   //   let xmlDoc = $.parseXML(xmlStr);
   //   let jqXml = $(xmlDoc);
   //   // ...
   //}      
   
   function ParseModelJsonToObj(jsonStr, obj) {
      obj.json = jsonStr;         // 保留一份備份
      // TODO: 應該只需儲存 model 中的 tag relations...
      //       取出 model json 中，所有項目的 (id, parentId)，應該就夠了...
      //       id 的值若包含空白，則將空白置換成底線（標籤名稱不能有空白）
      //       最底層的 leaf nodes 代表 instance，不會被當作標籤
      //       e.g., object -> obj_main -> city_wall
      
      json = JSON.parse(jsonStr);
      
      // 儲存結果的陣列
      const idParentPairs = [];
      
      // 遞迴函式，從任意層級提取 id 和 parentId
      function extractIdParent(items) {
         items.forEach(item => {
            idParentPairs.push({
               id: item.id,
               parentId: item.parentId || 'NONE',        // 2025-06-20: 也需記錄沒有 parent 的 entity（原先是 null，就不會有這一項）
            });
            
            // 如果有 children，遞迴呼叫
            if (Array.isArray(item.children)) {
               extractIdParent(item.children);
            }
         });
      }
      
      // 此函式後續並沒用到？
      function buildIdChildrenArray(data) {
         // 先建立一個 id 對應的空 children 陣列
         const idMap = new Map();
         data.forEach(item => {
            idMap.set(item.id, { id: item.id, children: [] });
         });
         //alert(JSON.stringify(idMap));
         
         // 根據 parentId 將 child id 塞進對應 parent 的 children 陣列
         data.forEach(item => {
            //if (item.parentId != null && idMap.has(item.parentId)) {
            //   idMap.get(item.parentId).children.push(item.id);
            //}
            if (item.parentId === null) item.parentId = 'NULL';
            if (idMap.has(item.parentId)) {
               idMap.get(item.parentId).children.push(item.id);
            }
         });
         
         // 回傳結果陣列，依原始輸入順序排序
         return data.map(item => idMap.get(item.id));
      }      

      // 先從 model json 取出 idParentPairs := [ {id,parentId}, ...] 陣列
      extractIdParent(json.entityTypes);         // 包含 'entityTypes', 'folderSchemas', 'imageSchemas'，目前僅載入 entityTypes 相關
      
      let relationXmlList = [];
      idParentPairs.forEach(function(pair) {
         let s = `<Relation Parent="${pair.parentId}" Child="${pair.id}" />`
         relationXmlList.push(s);
         GlobalVar.immarkusEntityParentMap[pair.id] = pair.parentId;           // 2025-06-21: 注意，後面的會覆蓋前面的！
      });
      

      //// 直接從 json.entityTypes 建構
      // 將 idParentPairs := [{id,parentId}, ...] 陣列倒轉成 [id, childrend] 的陣列
      // e.g., [ { id: 1, children: [2, 3] },
      //         { id: 2, children: [4] },
      //         { id: 3, children: [] },
      //         { id: 4, children: [] }]
      //let idChildrenArray = buildIdChildrenArray(json.entityTypes);
      //alert(JSON.stringify(idChildrenArray));
      //
      //let prefix = '';      // 'Udef_properties_';
      //
      //idChildrenArray.forEach(function(item) {
      //   if (item.children.length > 0) {
      //      item.children.forEach(function(child) {
      //         if (!child) return;               // e.g., id "object" has "undefined" child?
      //         let s = `<Relation From="${prefix}${item.id}" To="${prefix}${child}" />`;
      //         relationXmlList.push(s);
      //         GlobalVar.immarkusEntityParentMap[child] = item.id;           // 2025-06-21: 注意，後面的會覆蓋前面的！
      //      });
      //   }
      //   else ;        // leaf nodes -- IMMARKUS model 的葉節點是 city_wall, water 之類（非標籤），直接跳過不處理
      //});
      
      let tagRelationsXml = relationXmlList.join("\n");
      //alert(tagRelationsXml);
      obj.tagRelationsXml = tagRelationsXml;
      
      // 2025-06-20: 取出 entityTypes 中所有項目的 id（不屬於此 id 的 @Source 就不算是 entity  而可以略去）
      let allowedEntities = [];
      json.entityTypes.forEach(function(entityType) {
         allowedEntities.push(entityType.id);
      });
      obj.allowedEntities = allowedEntities;
      
   }  // end of ParseModelJsonToObj()
   
   function parseMetadataJsonToObj(jsonStr, obj) {     // folder metadata
      // 2024-10-21
      // e.g., obj.filename := "_iiif.4477054ac0b530db.annotations.json"
      let json = JSON.parse(jsonStr);
      //alert(obj.filename + ':' + JSON.stringify(json));

      let filename = obj.filename;       // 2025-12-04: 透過 filename 取得 folderHierarchy，並存入 <compilation_name>
      
      let context = json["@context"];
      let type = json["type"];
      let id = json["id"];
      let source = json.body["source"];
      let purpose = json.body["purpose"];
      let properties = json.body["properties"];
      
      let udefMetadataXmlList = [];
      let docMetadataXmlList = [];                  // 2024-10-31
      for (let key in properties) {
         let metafield = convertToLegalTagName(key);
         let udefMetadataVal = properties[key];     // 2025-06-13: 字串或陣列？
         
         // 2025-06-13: 以前 properties[key] 似乎都是字串，但現在出現「陣列」型態了...
         if (Array.isArray(udefMetadataVal)) udefMetadataVal = udefMetadataVal.join(';');
         else if (typeof udefMetadataVal === "object") {
            // 偷懶不考慮通用的處理，假設只有兩層... （目前只看到 Size_h, Size_w : {value, unit}）
            let flatObj = flatternBodyProperties("my", udefMetadataVal);
            udefMetadataVal = Object.values(flatObj).join('');
            //alert(udefMetadataVal);
         }
         udefMetadataVal = udefMetadataVal.toString();

         // 2025-06-13: 這裡的資料會被加入 <xml_metadata>，若要對這些資料進行後分類，就需避開空白...
         udefMetadataVal = udefMetadataVal.toString().replace(/ /g, '.');            // 2025-06-19: udefMetadataVal「竟然」可能是數字！
         
         // 2025-06-06: TGAZ_cr, TGAZ_cv 的值（e.g., https://maps.cga.harvard.edu/tgaz/placename/hvd_33309）僅取出最後的 hvd_33309
         if (['TGAZ_cr','TGAZ_cv'].includes(metafield)) {
            udefMetadataVal = udefMetadataVal.split('/').pop();          // 取出 hvd_xxxx
         }
         else if (udefMetadataVal.indexOf('http') < 0) {
            // 2025-07-22: 假設正常的 udefMetadataVal 不會有 '/'
            //             <Udef_DocMeta_DOI> 會有 10.13619/j.cnki.cn11-1532/k.2014.03.011
            //             <Udef_properties_material.1> 會有 earth/dirt
            udefMetadataVal = replaceTagHierarchyDelimieter(udefMetadataVal);
         }
         
         let udefMetadataTag = GlobalVar.udefMetadataPrefix + metafield;   // prefix 原先設為 'META_' 可方便檢錯，但最終可直接設為 ''
         let itemXml = "<" + udefMetadataTag + ">"      
                     + convertToLegalTagValue(udefMetadataVal)
                     + "</" + udefMetadataTag + ">";
         udefMetadataXmlList.push(itemXml);
         
         // 2024-10-31: 將部分值放入 docMetadataXml，作為後分類可用的文件 metadata
         //             metafield: title, author, compilation_name, docclass, doctype, book_code, time_dynasty, doc_source, geo_level1
         //             但使用者所命名的標籤可能不同，例如 Iva (考古) 和 Sunkyu (LoGart) 所給的標籤就不一樣...
         // 注意：GlobalVar.metadataFieldLabelMap 後面的會蓋掉前面的
         // 2025-06-06: Immarkus: doctype 保留給 "normal image", "iiif image"
         let fieldCheck = metafield;
         let lastChar = fieldCheck.substr(fieldCheck.length - 1);
         if (lastChar == '_') fieldCheck = fieldCheck.substr(0, fieldCheck.length - 1);           // (Iva archeology) 最後的 '_' 是由於 json 屬性名稱最後「竟然」是空白... 在此進行防呆處理 

         let s = '';

         // 2025-11-26: 補上 'Image_title_ch' -- 「揚州府圖說」是用 'Image_title_ch'... (IMMARKUS 允許使用者自定義欄位名，在此就產生很多麻煩）
         if (['Source_title_ch', 'title_ch', 'piece_title', 'Image_title_ch'].includes(fieldCheck)) {               // 咸陽 Immarkus 用的是 piece_title...
            // 同時設到 <title> 與 <compilation_name>
            s = "<title>" + udefMetadataVal + "</title>";
            docMetadataXmlList.push(s);
            
            GlobalVar.metadataFieldLabelMap['docclass'] = 'Piece Title';
            s = "<docclass>" + udefMetadataVal + "</docclass>";
         }
         //else if (['Data_source', 'data_source'].includes(fieldCheck)) {            
         //   // 2025-04-30
         //   GlobalVar.metadataFieldLabelMap['compilation_name'] = 'Data Source';
         //   s = "<compilation_name>" + udefMetadataVal + "</compilation_name>";
         //}
         else if (['Publication_time', 'piece_time'].includes(fieldCheck)) {
            // 2025-02-01: 有可能「包含月份」，例如 "19812"！在此進行一些防呆處理...
            let val = udefMetadataVal;            
            if (parseInt(val) > 2100) val = parseInt(val.substr(0,4));
            GlobalVar.metadataFieldLabelMap['year_for_grouping'] = 'Year';
            s = "<year_for_grouping>" + val + "</year_for_grouping>";
         }
         else if (['Source_author', 'piece_author'].includes(fieldCheck)) {                       // Iva archeology 用的是 'Source_author', 咸陽 Immarkus 則是用 'piece_author'
            GlobalVar.metadataFieldLabelMap['author'] = 'Author';
            s = "<author>" + udefMetadataVal + "</author>";
         }
         else if (['Place_covered', 'place_covered'].includes(fieldCheck)) {            
            // 2025-06-06: m.GEO1 <geo_level1> 表示 place covered（調整與 Comarkus2D 一致）
            GlobalVar.metadataFieldLabelMap['geo_level1'] = 'Place Covered';
            s = "<geo_level1>" + udefMetadataVal + "</geo_level1>";
         }
         // else if ... <doctype> 保留給 iiif image type
         //else if (fieldCheck == 'Publication_title') {
         //   GlobalVar.metadataFieldLabelMap['book_code'] = 'Publication Source';
         //   s = "<book_code>" + udefMetadataVal + "</book_code>";
         //}
         //else if (fieldCheck == 'reign') {
         //   GlobalVar.metadataFieldLabelMap['time_dynasty'] = 'Dynasty';
         //   s = "<time_dynasty>" + udefMetadataVal + "</time_dynasty>";
         //}
         //else if (metafield == 'date') {            // 很少出現... 似乎只有「早期」的標記有這項資訊？
         //   GlobalVar.metadataFieldLabelMap['year_for_grouping'] = 'Year';
         //   s = "<year_for_grouping>" + udefMetadataVal + "</year_for_grouping>";
         //}
         //else if ...
         
         if (s != '') docMetadataXmlList.push(s);
      }

      // 更新 obj 屬性值（obj 是 GlobalVar.folderMetadataFileDict[folder] 的物件參考）
      //alert(JSON.stringify(docMetadataXmlList));            // [<title>, <compilation_name>, <author>, <year_for_grouping>, <docclass>]
      //alert(JSON.stringify(udefMetadataXmlList));           // [<META_Source_title_ch_>, ..., <<META_Language>>, ...]
      obj.docMetadataXml = docMetadataXmlList.join("\n");     // 後續在 convertImmarkusJson2Doc() 會將「目錄結構」補入 <compilation_name>
      obj.udefMetadataXml = udefMetadataXmlList.join("\n");
   }

   function parseImmarkusRelations(jsonStr, filename) {
      let json = JSON.parse(jsonStr);
      
      // 2024-12-23: 只是將 relation json 串接起來
      if (Array.isArray(json)) {
         GlobalVar.immarkusRelationArray = GlobalVar.immarkusRelationArray.concat(json);
         //GlobalVar.immarkusRelationArray = [...new Set(GlobalVar.immarkusRelationArray)];
      }
      else {
         console.log("WARNING: skip non-array json (immarkus relations should be an array)");
      }
      //console.log(GlobalVar.immarkusRelationArray);          // 竟然有數千筆 relations! 不知道該怎麼應用？
      
      // 2026-07-10: 剖析 json 字串，將 linking 和 tagging 串接起來（若可行，先前的 immarkusRelationArray 應可拋棄）
      // From Rainer:
      // (1). (linking) The first annotation establishes the link. 
      //      The "arrow" goes from the target to the body (!), exactly as you say. 
      //      That's counter-intuitive, but intentional. I'm no longer sure why the direction is defined that way. 
      //      But I remember it has something to do with the wording in the W3C spec, which seems to imply this direction.
      // (2). (tagging) The second annotation carries the "payload" (the tag / relation name). 
      //      In W3C terms, the second annotation annotates the first annotation with additional information. 
      //      Therefore: the relation name is in the body, and the target points to the link annotation via ID.
      // { "id": "7e058e7a-5592-42c7-82f9-d49a2ff37c2f",          --------- A
      //   "motivation": "linking",
      //   "body": "393e6634-a8cf-4877-b822-ddb2b6c35123",        --- arrow goes from "target" to "body"
      //   "target": "c6e648c7-d997-437d-a1f5-cf7cfa481559",
      //   "created": "2025-04-10T10:50:26.578Z"
      // },
      // { "id": "dd0f6fdf-e531-49f2-930e-e2b201ef3632",          --------- not referred
      //   "motivation": "tagging",
      //   "body": {
      //      "value": "crossing"
      //   },
      //   "target": "7e058e7a-5592-42c7-82f9-d49a2ff37c2f",      --------- A: id of the link
      //   "created": "2025-04-10T10:50:26.578Z"
      // },
      // ...

      // 2026-07-10: 將 linking 和 tagging 整合成一筆 record
      //             為了在 one-pass 處理完畢，假設 tagging 必然出現在 linking 之後
      let relationHash = GlobalVar.immarkusRelationHash;       // reference
      GlobalVar.immarkusRelationArray.forEach(function(relation, idx) {
         let {id, motivation, body, target} = relation;       // 2026-06-19: 加上 jsonFilename
         if (motivation == 'linking') {
            relation['relationType'] = '-';
            relationHash[id] = relation;
         }
         else if (motivation == 'tagging') {
            let relationId = target;
            if (!relationHash[relationId]) {
               alert("Cannot find associated linking id from tagging target: " + relationId);
            }
            else {
               relationHash[relationId]['relationType'] = body.value;       // e.g., "part of whole", "on top of", "adjacent", etc.
            }
         }
      });
      //alert("immarkusRelationHash:\n" + JSON.stringify(GlobalVar.immarkusRelationHash));
   }
   
   function parseIiifManifestJson(manifestJson, immarkusMetadataJson, manifestId) {
      // 2025-04-23: 將函式獨立出來... （也方便未來可從 local disk 讀取 saved iiif manifestJson）
      //             manifestJson: 透過 iiif manifest url 所 fetch 到的 json object
      //             immarkusMetadataJson: IMMARKUS _iiif.<immarkus_iiif_id>.json 的內容
      //             manifestId
      // (TODO): 從 manifestJson 取得 service base 的 info.json，並從中取得 original image 的 width 和 height，存入 GlobalVar 中供後續使用
      
      let obj = GlobalVar.folderIiifMetadataFileDict[manifestId];
      
      // 2025-04-22: 要取得原圖的 image url，步驟還頗複雜...
      obj.iiifImageUrl = getIiifImageUrl(manifestJson);
      //console.log(folderIiifMetadataFileDict[manifestId]);
      //alert("iiifImageUrl = " + obj.iiifImageUrl);
      
      // 2025-04-04: 從 _iiif.<manifest_id>.json 檔取得 immarkusMetadataJson
      //             概念上，應該是一份 canvas 對應到一幅影像，有標記的影像會再被對應到一篇文件
      //             但 Rainer 在實作上，卻似乎是假設一份 sequence 對應到一幅（或多幅？）影像？
      let canvasIdMap = {};
      immarkusMetadataJson.canvases.forEach(function(canvas) {
         // e.g., for immarkus manifest id e86d888e931f7ca7 (_iiif.e86d888e931f7ca7.json)
         //       canvasIdMap['1354533960'] = { name: '1', imageKey: 'https://iiif.archive.org/iiif/reportofinternatinte$0/canvas' }
         canvasIdMap[canvas.id] = { name: canvas.name,                  // 似乎只是 placeholder？
                                    imageKey: canvas.uri,               // 第一層 (sequence) 的 id (TO-CHECK: Rainer assumes a sequence contains only one image for annotation?)
                                  };
      });

      obj.iiifCanvasIdMap = canvasIdMap;                         // 2025-04-21: 將 iiif manifest 的 canvas.id 製作成 canvasIdMap
      obj.iiifManifestJson = manifestJson;                       // 把 _iiif.<immarkus_iiif_id>.json 完整存下一份...
      
      if (![2,3].includes(obj.iiifApiVersion)) {                 // 這 api vesion 是儲存在 immarkus json 中的數據...
         alert("Unrecognized iiif api version: " + obj.iiifApiVersion);
      }
      
      // 2025-04-23: 若成功下載，可將其儲存在 local disk（因瀏覽器權限控管，無法控制儲存的目錄位置）
      if (GlobalVar.autoSaveIiifManifest) {
         let manifestFilename = 'iiif_manifest_' + manifestId + '.json';
         let content = JSON.stringify(manifestJson, null, 2);    // 把物件轉成格式化的 JSON 字串，方便閱讀
         let mime = 'application/json;charset=utf-8';
         saveFile(manifestFilename, content, mime)
      }
   }

   // ------------------------------------------------------------------------------------
   
   $("#refreshImmarkus2D").click(function() {
      // 2024-12-26
      window.location.reload();
   });
   
   $("#butTEST").click(function() {
      if (EnableMessageViaParent) {
         let xmlStr = new XMLSerializer().serializeToString(jqXml.get(0));
         if (parent.parent) {
            // 2025-02-20: 訊息格式包含 source, target, parameters, type, message 五項參數
            let wrapper = { source: "Immarkus2D",
                            target: "XmarkusAnalyzer",
                            parameters: [],
                            type: "DocuXml",
                            message: xmlStr };
            parent.parent.postMessage(wrapper, '*');    // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
         }
      }
      else alert("bypass butTEST");
   });
   
   $("#butTEST2").click(function() {
      if (EnableMessageViaParent) {
         let xmlStr = new XMLSerializer().serializeToString(jqXml.get(0));
         if (parent.parent) {
            // 2025-02-20: 訊息格式包含 source, target, parameters, type, message 五項參數
            let wrapper = { source: "Immarkus2D",
                            target: "EventRelLite",
                            parameters: [],
                            type: "DocuXml",
                            message: xmlStr };
            parent.parent.postMessage(wrapper, '*');    // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
         }
      }
      else alert("bypass butTEST2");
   });
   
   $("div.selectExportsBox").click(function(evt) {
      // 2025-12-30
      if (evt.ctrlKey || evt.shiftKey) {                  // 2026-03-28: Mac 沒有 ctrlKey，加上 shiftKey
         // 2026-03-29: 使用者若在不同模式下 add project folder，產生的 XML 將可能包含 blob/normal URLs，而這份 XML 檔名 suffix 將會被設定為最後的狀態（blob/normal）
         //             -- 因此不能僅以檔名 suffix 判斷 XML 是否僅包含 blob/standard URLs
         let nextMode = (GlobalVar.curWorkingMode == 'normalUrl') 
                      ? 'blobUrl'
                      : 'normalUrl';
         
         switchWorkingMode(nextMode);            // 程序會設定 GlobalVar.curWorkingMode 為 nextMode
      }

   });
   
   $("#butSelectImmarkusFolder").click(function(evt) {
      evt.stopPropagation();
      GlobalVar.convertEachPiece2Doc = false;
      
      // 2025-06-17, 2025-07-27: 加上 GlobalVar.enableSnippet2Doc
      // 跳過以下選擇（不需讓 image snippets 獨立成分別的文件）
      if (GlobalVar.enableSnippet2Doc) {
         // 2025-05-01
         $("#overlay").show();
         let w = 400;
         let h = 132;
         let left = Math.floor((window.innerWidth - w) / 2);
         let top = Math.min(80, Math.floor((window.innerHeight - h) / 2) - 100);

         // 2026-06-12
         let imageUrlPrefix = GlobalVar.immarkusLocalWebPath;         
         
         let html = '<div class="useWebProtocol" style="display:none; margin-top:5px;">'
                  + 'Please specify the URL path: <button class="useRelativePath" style="margin-left:8px">use relative path</button><br/>'
                  + `<input type="text" id="imageUrlPrefix" size="40" value="${imageUrlPrefix}" style="font-size:12px" autocomplete="off"></input>`
                  + '<span style="font-size:12px">&lt;project_folder&gt;</span>'
                  + '</div>'
                  + "<table style='margin-top:8px; overflow:clip;'>"
                  + "<tr><td valign='top'><input type='radio' name='conversionMode' value='piece2Doc'></input></td><td>Show all <b>image pieces</b> as separate documents</td></tr>"           // 完全按「事件」來組織 
                  + "<tr><td valign='top'><input type='radio' name='conversionMode' value='docManyPieces'></input></td><td>Show each <b>image</b> with their pieces as a separate document</td></tr>"     // 按「原始文本」來組織
                  + "</table>"
                  + "<div style='height:6px'></div>"
                  + "<center><button id='butConversionMode' class='button' style='display:none'>CONTINUE</button></center>";
         let divContentId = showDivHtml(evt, top, left, w, h, "Conversion Mode", html);
           
           $("input[name='conversionMode']").off("change").on("change", function(e) {
              $("#butConversionMode").click();
           });
           
         $("#butConversionMode").off("click").on("click", function(e) {
            let s = $("input[name='conversionMode']:checked").val();
            GlobalVar.convertEachPiece2Doc = (s == 'piece2Doc') ? true : false;
            resetOutFilename();                    // 2025-06-12: 先前漏掉此部分
            $("span.closeSubwinContainer").click();
            $("#overlay").hide();
         
            // 接回原先的檔案選擇程序
            window.setTimeout(function() {
               addProjectFolder();
            }, 500);
         });
      }
      else {
         addProjectFolder();
      }
      
   });
   
   $("button.useRelativePath").click(function() {
      // 2025-03-12: 因 setImageUrlPath() 會做額外 protocol 檢查，在此就直接設定 path
      GlobalVar.forceBlobUrlUnderChromium = false;     // 2026-03-28: 總是採用 standard URLs 而非 blob URLs
      GlobalVar.imageUseNonBlobPath = true;            // 一旦 forceBlobUrlUnderChromium 為 false，imageUseNonBlobPath 就應該是 true（採用 standard URLs）
      $("#imageUrlPrefix").val(GlobalVar.immarkusDataRlativePath);
      GlobalVar.imageUrlPath = GlobalVar.immarkusDataRlativePath;
      resetOutFilename();                              // 重設輸出的 filename（檔名加上 'normal' 而非 'blob' 表示是用一般 URL 路徑）
      
      // 2025-12-28
      $(this).hide();
      $("button.useLocalWebPath").show();
   });
   
   $("button.useLocalWebPath").click(function() {
      // 2025-12-28: 因 setImageUrlPath() 會做額外 protocol 檢查，在此就直接設定 path
      GlobalVar.forceBlobUrlUnderChromium = false;     // 2026-03-28: 總是採用 standard URLs 而非 blob URLs
      GlobalVar.imageUseNonBlobPath = true;
      $("#imageUrlPrefix").val(GlobalVar.immarkusLocalWebPath);
      GlobalVar.imageUrlPath = GlobalVar.immarkusLocalWebPath;
      resetOutFilename();                     // 重設輸出的 filename（檔名加上 'normal' 而非 'blob' 表示是用一般 URL 路徑）

      $(this).hide();
      $("button.useRelativePath").show();
   });
   
   //$("button.continueBuilding").click(function() {
   //   addProjectFolder();
   //});
   
   $("#butNextAddProjectFolder").click(function() {     // 2025-06-07
      addProjectFolder();
   });
   
   $("#butNextGoSearch").click(function() {         
      // 2025-06-07: 新版的介面不再需透過 converting page -> root page -> C2D page，可直接傳訊給 root page 說要接 XA
      doPostMessage("Immarkus2D", "XmarkusAnalyzer", GlobalVar.finalDocuXml);     // 可直接貼出 finalDocuXml（不必重新計算）
   });
   
   $("#butNextDownload").click(function() {            // 2025-06-07
      $("#genDocuXmlAndDownload").click();
   });
   
   $("#butNextMergeDatabases").click(function() {
      // 2025-12-31
      doPostMessage("Immarkus2D", "DocuMerger", GlobalVar.finalDocuXml);     // 可直接貼出 finalDocuXml（不必重新計算）
   });
   
   // -----------------------------------------------------------------------------
   
   function addProjectFolder() {                       // 2025-06-05 獨立出來...
      // Brent modified 2024-06-25: Call root window to get DirHandle first...
      // It will send PostMessage to this iframe aftet that.
      if (GlobalVar.forceBlobUrlUnderChromium && !InXmarkusLocalMode && ['Chrome','Edge'].includes(BrowserType)) {
         // 必須在「安全環境（secure context）」 下，才能透過 DirHandle 取得 local image 的 blob URL
         // (1). 需在 https://, http://localhost 下執行（不能在 file:// 或一般 http:// 網站執行）
         // (2). 必須由「使用者手勢」觸發
         GlobalVar.imageUseNonBlobPath = false;       // 2025-12-29: 使用 blob URL
         window.parent.parent.postMessage("Ask DirHandle", "*")
      }
      else {
         GlobalVar.imageUseNonBlobPath = true;        // 2025-12-29: 使用 normal URL
         // 注意：若使用者途中按下 ESC 跳出，並不會觸發此事件（使用者點擊目錄之後，才會觸發）
         $("#selectInDir").click();
      }
      resetOutFilename();                             // 2025-12-29: 因為 GlobalVar.imageUseNonBlobPath 會影響 outFilename ...
   }
   
   $("#selectInDir").bind("change", function(evt) {       // 2024-10-19
      handleSelectInDir(evt);
   });

   // 2024-10-24: 處理使用者更動 imageUrlPrefix 的狀況（目前若在 local 執行，應該是看到並無法修改 url prefix）
   $("#imageUrlPrefix").blur(() => setImageUrlPath());

   $("#imageUrlPrefix").bind("keypress", {}, keypressInBox);

   $("span.linkToApp").click(function() {
      // 2024-12-21
      let appName = $(this).attr("key");
      //alert(appName);
      let url = GlobalVar.linkToApp[appName];
      
      let protocol = location.protocol;             // e.g., "http:", "https:", "file:"
      //alert(protocol);
      
      // 注意：由於 "file:" protocol 會被視為 anonymous origin，嘗試修改 parent 物件的內容
      //       會因 XSS (cross-site scripting) 理由而被瀏覽器拒絕（Access to property denied）
      //       不能列印或修改物件內容，但似乎可以透過 postMessage 傳遞訊息...？
      //try {
         if (parent) {
            //parent.postMessage({test:"xyz"}, "*");
            //alert(protocol + ':' + parent);
            parent.location = url;
         }
         else window.open(url, appName);
      //} catch(e) {
      //   window.open(url, appName);
      //}
   });
   
   function keypressInBox(e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if (code == 13) {           // Enter keycode                        
         e.preventDefault();
         $(this).blur();
      }
   };
   
   //$("#butShowExtraStep").click(function() {
   //   $("button.continueBuilding, #butShowExtraStep").addClass("disabled");
   //   $("tr.extraStep").show();
   //});
   
   async function generateWithAttachedRelations() {
      // 2025-01-17: 產生 DocuXml，加上 immarkus relations，最後再轉回 DocuXml
      let xmlStr = await generateDocuXml();      // 包含有 <?xml...> prefix
      //saveFile('test.xml', xmlStr);
      //console.log(xmlStr);
      //alert(xmlStr);

      // 2024-12-25: 產生 DocuXml 後，再加上 immarkus relations
      let xmlDoc = $.parseXML(xmlStr);
      let jqXml = $(xmlDoc);

      showProgressMsg("relations...");           // 因 busy 通常不會顯示在 UI...
      
      //alert("relations: " + GlobalVar.immarkusRelationArray.length);

      // 2025-03-03: Rainer 的文件說，motivation 有 "linking" 和 "tagging" 兩種
      //             tagging 其實就只是在 annotate 某個 linking（唉，為什麼不直接把訊息加在 linking 的結構裡啊...）
      //             linking 表示從 target --> body 的連結（Rainer 有從使用者角度說明為什麼與直觀反向，但我還是覺得結構上從 body 連到 target 應該比較合適）
      //             (1). 目前看來 linking 都是 links between pieces？
      //             (2). 考慮採 two-pass 簡單處理（資料不多，效能影響不大）：先處理所有 linking 項目，然後再利用 tagging 把 "link annotation" 補回去...
      
      // 如果是 motivation "tagging", body.value "part of whole"，其 target 將會指向某個 relation id ==> 目前直接略去
      // => 目前還是看不懂，為什麼採用這樣的表達結構，這些 relations 又可以有些什麼應用

      // 2025-06-20: 增加 <Udef_Img_EntityRelation>...</Udef_Img_EntityRelation>
      if (GlobalVar.exportUdefEntityRelationXml) {
         if (Object.keys(GlobalVar.immarkusRelationHash).length > 0) {
            // 宣告 relation tags for post-search classification
            let relationTags = ['Udef_Img_EntityRelation', 
                               ];
            relationTags.forEach(function(tag) {                    
               if (GlobalVar.extraUdefTagList.includes(tag)) {
                  let curCorpus = $(this).closest("document").find("corpus").text();
                  let faSelector = "corpus[name='" + curCorpus + "'] > feature_analysis";
                  let jqFeatureTag = jqXml.find(faSelector + " > tag[name='" + tag + "']");
                  if (jqFeatureTag.length === 0) {
                     let s = '<tag type="contentTagging" name="' + tag + '" default_category="' + tag + '" default_sub_category="-"/>';
                     jqXml.find("corpus > feature_analysis").append(s);
                  }
               }
            });
         }
         
         let msgFailedRelations = [];
         Object.keys(GlobalVar.immarkusRelationHash).forEach(function(relationId) {
            let {id, motivation, body, target, relationType} = GlobalVar.immarkusRelationHash[relationId];
            let msgList = [];
           
            // 注意：以下假設 relation 的兩個 entities 都可在 GlobalVar.immarkusIdDict[body] 找到
            //       => 這表示目前並不支持「跨 projects（例如 merge 多個 DocuXml）」的 relation！
            if (GlobalVar.immarkusIdDict[body] && GlobalVar.immarkusIdDict[target]) {
               let nodeTagName = GlobalVar.immarkusIdDict[body].tagType;        // should be 'ImmarkusPiece' under <Event>
               //if (nodeTagName !== 'ImmarkusPiece') alert(nodeTagName); 

               // IMMARKUS: target (source entity) --> body (target entity)
               let sourceEntityId = target;        // 在 Immarkus 'body' node 下產生 <Udef_Img_EntityRelation>
               let targetEntityId = body;
               
               let nodeInfo = {'source': { entityId: sourceEntityId,
                                           docFilename:'SourceFileNotFound',
                                           docCorpus:'SourceCorpusNotFound',
                                           shapeKey:'-',                         // 2026-07-28
                                           pieceLabel:'[no.id.name]',
                                           entityClass:'[no.entity.class]'},     // 2026-07-06: Dawn 信上說，會希望可 filtering by source/target entity class
                               'target': { entityId: targetEntityId,
                                           docFilename:'TargetFileNotFound',
                                           docCorpus:'TargetCorpusNotFound',
                                           shapeKey:'-',
                                           pieceLabel:'[no.id.name]',
                                           entityClass:'[no.entity.class]'},
                              };
               
               // 找出 source entity 和 target entity 所在的 corpus 和 filename
               // 注意：需假設 source 和 target entities 都在當前 project folder 下！（否則會找不到）
               Object.keys(nodeInfo).forEach(function(nodeKey) {       // nodeKey: 'source', 'target'
                  //let jqNode = jqXml.find("Event ImmarkusPiece[ImmarkusId='" + nodeInfo[nodeKey].entityId + "']");   // 注意，這裡是利用 ImmarkusId 提取 Event （而不是 Paragrph）下的資訊 -- 雖然它們的內容幾乎是一樣的（會有小差異，因 Event 是 for 後分類）
                  let jqParagraph = jqXml.find("Paragraph[ImmarkusId='" + nodeInfo[nodeKey].entityId + "']");   // 注意，這裡是利用 ImmarkusId 提取 Event （而不是 Paragrph）下的資訊 -- 雖然它們的內容幾乎是一樣的（會有小差異，因 Event 是 for 後分類）
                  if (jqParagraph.length > 0) {
                     let jqDoc = jqParagraph.closest("document");
                     nodeInfo[nodeKey]['docFilename'] = jqDoc.attr("filename");
                     nodeInfo[nodeKey]['docCorpus'] = jqDoc.find("corpus").text();                      // 2025-03-08
                     
                     nodeInfo[nodeKey]['shapeKey'] = jqParagraph.find("ImmarkusShape").attr("Key");     // 2026-07-28
                     
                     // 2026-07-25: 原則上從 Paragraph 提取會比從 <Event> 提取好... 
                     let jqImmarkusProperties = jqParagraph.find("ImmarkusProperties");        // 若是經由 <Event>，則是 jqNode.find("ImmarkusPieceProperties");
                     let jqEntityId = jqImmarkusProperties.find("Udef_properties_id");
                     let jqEntityName = jqImmarkusProperties.find("Udef_properties_name");
                     //if (jqEntityId.length + jqEntityName.length > 0) {
                     //   nodeInfo[nodeKey]['pieceLabel'] = jqEntityId.text() + ' (' + jqEntityName.text() + ')';
                     //}
                     if (jqEntityName.length > 0) {
                        nodeInfo[nodeKey]['pieceLabel'] = '(' + jqEntityName.text() + ')';
                     }
                     else if (jqEntityId.length > 0) {
                        nodeInfo[nodeKey]['pieceLabel'] = jqEntityId.text();
                     }
                     
                     // 由於 <Udef_Img_EntityClass> 是在 <Paragraph> 的 <ImmarkusBody> 下，因此還是得回到 Paragraph 取得相關訊息...
                     let jqEntityClass = jqImmarkusProperties.parent()                         
                                                          .find("Udef_Img_EntityClass");    // e.g., "object/bridge/yutai_unnamed_qiao1", "obj_part/city_wall_moat"
                     if (jqEntityClass.length > 0) {
                        let entityClassFull = jqEntityClass.text();
                        let splittedTerms = entityClassFull.split('/');
                        let entityClass = (splittedTerms.length >1)
                                        ? splittedTerms[1]       // 取第二層的 "bridge", "city_wall_moat"
                                        : splittedTerms[0];      // 當前 IMMARKUS annotation 不應出現這種狀況？
                        nodeInfo[nodeKey]['entityClass'] = entityClass;
                     }
                     
                  }
                  else {
                     alert(`Fail to find the document ${nodeKey} piece that contains ImmarkusId: ${nodeInfo[nodeKey].entityId}`);
                     return;
                  }
               });
               
               // 2027-07-31
               ['source','target'].forEach(function(nodeKey) {
                  if (nodeInfo[nodeKey]['pieceLabel'] == '[no.id.name]') {
                     nodeInfo[nodeKey]['pieceLabel'] = '[' + nodeInfo[nodeKey]['entityId'] + ']';
                  }
               });
               
               // 注意：TargetPieceLabel 可能是 "gu'an_xian (固安縣)" 包含單引號或雙引號，因此需呼叫 convertToLegalTagAttrValue() 進行 escape 處理
               let relationTag = "<Udef_Img_EntityRelation "           // image entity relation
                               + "LinkingImmarkusId='" + id + "' RelationType='" + relationType + "' "
                               + "SourcePieceCorpus='" + convertToLegalTagAttrValue(nodeInfo['source']['docCorpus']) + "' "
                               + "SourcePieceDocFilename='" + convertToLegalTagAttrValue(nodeInfo['source']['docFilename']) + "' "
                               + "SourcePieceImmarkusId='" + convertToLegalTagAttrValue(nodeInfo['source']['entityId']) + "' " 
                               + "SourcePieceShapeKey='" + convertToLegalTagAttrValue(nodeInfo['source']['shapeKey']) + "' " 
                               + "SourceEntityClass='" + convertToLegalTagAttrValue(nodeInfo['source']['entityClass']) + "' "               // 2026-08-02: 加上 SourceEntityClass
                               + "SourcePieceLabel='" + convertToLegalTagAttrValue(nodeInfo['source']['pieceLabel']) + "' "                 // 2026-07-25: 加上 SourcePieceLabel
                               + "TargetPieceCorpus='" + convertToLegalTagAttrValue(nodeInfo['target']['docCorpus']) + "' "
                               + "TargetPieceDocFilename='" + convertToLegalTagAttrValue(nodeInfo['target']['docFilename']) + "' "
                               + "TargetPieceImmarkusId='" + convertToLegalTagAttrValue(nodeInfo['target']['entityId']) + "' "              // 2026-07-10: arrow to "target"的 id -- 注意是 Immarkus 的 body 欄位而非 target 欄位
                               + "TargetPieceShapeKey='" + convertToLegalTagAttrValue(nodeInfo['target']['shapeKey']) + "' " 
                               + "TargetEntityClass='" + convertToLegalTagAttrValue(nodeInfo['target']['entityClass']) + "' "               // 2026-08-02: 加上 TargetEntityClass
                               + "TargetPieceLabel='" + convertToLegalTagAttrValue(nodeInfo['target']['pieceLabel']) + "'>"                 // 2026-07-25: 加上 SourcePieceLabel
                               + relationType                                                // 2026-07-05
                               + "</Udef_Img_EntityRelation>";
                  
               Object.keys(nodeInfo).forEach(function(nodeKey) {
                  let selector = nodeTagName + "[ImmarkusId='" + nodeInfo[nodeKey].entityId + "']";      // <Paragraph>, <Event><ImmarkusPiece> 中都會有此 ImmarkusId
                  
                  jqXml.find(selector).each(function() {
                     // 2025-03-05: 注意 Iva 的 _immarkus.relations.json 前兩項 linking（當然有不同 linking id）的 body 都是 (piece id B)
                     //             c2922168-72b4-492a-8e31-e54132721a8f，然後 target 都是 (piece id B) b8acd222-8eb0-4bd0-9914-499a531db8e9
                     //             => 這表示會有兩個 linkings from B to A！
                     // 2025-03-08: 為了保持一致性（和彈性），還需加上 SourcePieceCorpus！
                     // 2026-06-16: <ImmarkusRelation> 在 <Paragraph> 內，因此似可直接支援後分類？
                     //             => TODO: 必須在輸出 DocuXml 時，將其轉為 <Udef_properties_entity.relation>
                     //             => LinkingImmarkusId 和 SourcePieceImmarkusId 為兩項 annotated entities 的 uuid
                     //                TODO: <ImmarkusRelation> => <Udef_Img_EntityRelation>
                     
                     // 注意，IMMARKUS JSON:	'target' field records the source entity ID, 'body' records the target entity ID
                     // e.g., human guarding castle => target:'human', body:'castle', relation type:'guarding'
                  
                     // 注意：<Udef_Img_EntityRelation> 必須加在兩個地方
                     //       (1). <Paragraph> 下是 for 細節呈現 -- 因為要給 Knowledge Graph 讀，需放在 <ImmarkusBody> 內，<ImmarkusProperties> 外，且外層不能加上 <div>
                     //       (2). <Event> 下是 for 後分類
                     //console.log(relationTag);
                     $(this).closest("doc_content")
                            .find("Paragraph[ImmarkusId='" + nodeInfo[nodeKey].entityId + "']")
                            .find("ImmarkusBody")
                            .append(relationTag);
                  
                     let jqImmarkusPieceProperties = $(this).find("ImmarkusPieceProperties").first();

                     let s = "<Udef_Img_EntityRelation>" + relationType + "</Udef_Img_EntityRelation>";
                     jqImmarkusPieceProperties.append(s);                 // 2026-07-05: 放到 <ImmarkusPieceProperties> 內
                     
                  });
               });
            }
            else {
               // IMMARKUS 好像會有許多沒清理乾淨的 relations... => 記錄 log 後直接跳過
               let s = (!GlobalVar.immarkusIdDict[body]) ? "Source:" + body : '';
               let t = (!GlobalVar.immarkusIdDict[target]) ? "Target:" + target : '';
               if (t) s += ', ' + t;
               let msg = `Relation ${id} fails to locate ${s}`;
               msgFailedRelations.push(msg);
               console.log(msg);
               
               //let missingNode = (!GlobalVar.immarkusIdDict[body]) 
               //                ? 'body'
               //                : 'target';
               //let s = `<Udef_img_Relation_Missing JsonFilename="${jsonFilename}" RelationId="${id}" MissingNode="${missingNode}"></Udef_img_Relation_Missing>";
               // ...
            }
         });
         
         if (msgFailedRelations.length > 0) {
            alert(`WARNING: find ${msgFailedRelations.length} failed relations!\n${msgFailedRelations.join("\n")}`);
         }
      }  // if (GlobalVar.exportUdefEntityRelationXml) ...
      
      xmlStr = new XMLSerializer().serializeToString(jqXml.get(0));
      //saveFile("test.xml", jqXml.get(0));

      return xmlStr;
   }
   
   $("#genDocuXmlAndDownload").click(function() {
      // let xmlStr = generateWithAttachedRelations();
      let filename = $("#outFilename").val();
      let xmlStr = GlobalVar.finalDocuXml;          
      saveFile(filename, xmlStr);
      
      // 2024-12-21: 透過 CSS pointer-events:none; 來「禁用」標籤元素...
      //$("button.continueBuilding").addClass("disabled");
      $("#genDocuXmlAndDownload").addClass("disabled");             // 需 CSS 配合
   });
   
   
   // -------------------------------------------------------------------------------------------
   
   function convertPiece2Doc(xmlStr) {                // xmlStr 已經包含 xmlPrefix
      showProgressMsg("Piece2Doc");                   // 2025-05-22
      
      //let xmlPrefix = '<?xml version="1.0"?>';
      let jqXmlDoc = $.parseXML(xmlStr);              // returns XMLDocument
      let jqXml = $(jqXmlDoc);                        // returns jQuery object
      
      jqXml.find("document").each(function() {
         let jqDoc = $(this);
         let docFilename = jqDoc.attr("filename");
         
         // 若有多筆 pieces，將每個 piece 轉成一份文件
         let jqPieceList = jqDoc.find("Events > Event > ImmarkusPiece");
         let pieceCount = jqPieceList.length;
         if (pieceCount <= 1) return;               // 事件數量小於等於一，跳過不需額外處理
         
         // 將每個 piece 轉成一份新文件
         jqPieceList.each(function(idx) {
            let jqPiece = $(this);
            let pieceKey = jqPiece.attr("Key");     // "piece:0", "piece:1", etc. 也可用 attr("ImmarkusId")
            let keyNumber = parseInt(pieceKey.split(':').pop());
            let jqClone = jqDoc.clone();
            
            jqClone.find("Events > Event > ImmarkusPiece").remove();
            jqClone.find("Events > Event").append(jqPiece);
            let newFilename = docFilename + '_P' + idx.toString().padStart(2,'0');     // 注意，idx 從 0 起跳
            jqClone.attr("filename", newFilename);
            //alert(jqClone.prop("outerHTML"));
            
            // 2025-04-27: 僅保留當前 piece 所對應到的 paragaph (<ImmarkusPiece> 的 piece:n 對應到 <Paragraph> 的 mark:n)
            //             這樣可以節省大量重覆（且應該用不到）的 paragraph 內容
            let jqParagraph = jqClone.find("doc_content > Paragraph[Key='mark:" + keyNumber + "']");
            if (jqParagraph.length > 0) {             // 防呆：只當找到對應 jqParagraph 才進行以下處理
              jqClone.find("doc_content > Paragraph").remove();
              jqClone.find("doc_content").append(jqParagraph);
              
              //// 以下可省略 -- 只是為了將 Events 放到 <Paragraph> 後面...
              let jqEvents = jqClone.find("doc_content > Events");
              jqClone.find("doc_content > Events").remove();
              jqClone.find("doc_content").append(jqEvents);
            }
            
            //// 事件若有時間和地點，需同時更新文件的相關 metadata => 地點的部分，由於目前 metadata 只放地名（沒有 RefId），因此暫時不需更新...
            //// <Udef_Evt_TIME RefId="公元13681398"...>
            //// <Udef_Evt_TIME RefId="1624" ...>
            //// <Udef_Evt_TIME RefId="3年" MarkusId="...">DURATION/三載</Udef_Evt_TIME>
            //// <Udef_Evt_TIME RefId="1517-04" MarkusId="...">END/正德丁丑春三月</Udef_Evt_TIME>
            //// <Udef_Evt_LOCATION RefId="hvd_1261"...>
            //// <Udef_Evt_LOCATION RefId="hvd_96363"...>
            //jqEvent.find("Udef_Evt_TIME").each(function() {
            //   let refId = $(this).attr("RefId");
            //   if (!refId) return;                        // 沒有 RefId 就直接跳過
            //   if (refId.startsWith("公元")) {
            //      refId = refId.substr(2);
            //      if (refId.length > 4) {
            //         let half = Math.floor(refId.length / 2);
            //         refId = refId.substring(0, half);
            //      }
            //   }
            //   else if (isNaN(refId)) return;             // 2025-01-19: 若值為 NaN，則直接跳過
            //
            //   jqClone.find("year_for_grouping").each(function() {
            //      $(this).text(refId);
            //   });
            //   
            //   jqClone.find("title").each(function() {     // 2025-01-20: 在標題後方，補上此文件的「事件編號/事件總數」
            //      let newTitle = $(this).html() + ' <span class="copy">(' + (idx+1) + '/' + eventCount + ')</span>';
            //      $(this).html(newTitle);
            //   });
            //});
            
            // 將新文件放入 jqXml 中
            jqXml.find("documents").append(jqClone);
         });
         
         // 移除（單一文件包含多筆事件的）舊文件
         jqDoc.remove();
      });

      return getDocuXmlString(jqXml, "ThdlPrototypeExport");
   }
   
   function getDocuXmlString(jqXml, rootTag) {
      let xmlObj = jqXml.find(rootTag).get(0);
      let xml = (new XMLSerializer()).serializeToString(xmlObj);
      return xml;
   }
   
   async function generateDocuXml() {
      let corpusSettingsXmlList = [];
      let out = '';
      
      //console.log(GlobalVar.corpusDataDict);
      //alert("==> " + JSON.stringify(GlobalVar.corpusDataDict));
      
      for (let corpusTitle in GlobalVar.corpusDataDict) {
         // for iiif annotations, corpusDataList := [{filepath, filename, immarkusManifestId, iiifManifestUrl, iiifManifestJson, canvasImages, docMetadataXml, udefMetadataXml}, ...]
         // 其中每一個 element 是從 _iiif.xxxx.json 取得的一個項目
         let corpusDataList = GlobalVar.corpusDataDict[corpusTitle];
         corpusDataList.sort(function(a, b) {
            return (a.filename < b.filename) ? -1 : (a.filename > b.filename);   // 依照 filename 排序
         });
         
         // 2024-04-30, 2024-05-20
         GlobalVar.udefTagsDict = {};                          // reset
         //alert(corpusTitle + ':' + corpusDataList.length);
         for (let i=0; i<corpusDataList.length; i++) {
            // (TODO): 處理 _immarkus.folder.meta.json 所存放的 metadata
            //         由於 _immarkus.folder.meta.json 並未指定哪些 immarkus json 需套用這份 metadata，
            //         需要程式藉由 _immarkus.folder.meta.json 和 immarkus json 的本地端路徑來判別
            // e.g., "扬州城遗址和发掘位置.json" 沒有內容...
            if (!corpusDataList[i]) {
               console.log("EMPTY -- no annotation found: " + corpusDataList[i].filepath + "/" + corpusDataList[i].filename);
               continue;
            }
            
            //console.log(corpusDataList[i]);
            //alert(JSON.stringify(corpusDataList[i]));
            
            let xmlComponents = await convertImmarkusJson2Doc(corpusDataList[i]);
            let [docMetadataXml, udefMetadataXml, docContentXml] = xmlComponents;
            //console.log(xmlComponents);
            //alert(docMetadataXml);
            
            // 2025-03-26: 從 folder 來的 document metadata...
            let folderMetadataXml = (corpusDataList[i].udefMetadataXml)                  // 注意，可能是 undefined
                                  ? (corpusDataList[i].udefMetadataXml + '\r\n')         // 包含 <title>. <author> 等
                                  : '';
            udefMetadataXml = folderMetadataXml + udefMetadataXml;                       // 除了 <META_xxx> 之外，可能還會有 convertImmarkusJson2Doc() 回傳的項目（例如 Source, prop_image_title_ch 之類）          
            
            // 2024-10-24
            let docFilename = convertToLegalDocuFilename(corpusDataList[i].filepath + "/" + corpusDataList[i].filename);
            
            let extraSettings = 'ExtraSettings="ExtraRelations:RelationGenre:ImmarkusDataModelHierarchy"';        // 2025-07-24: 加上 ExtraSettings 以便後續對回 <ExtraRelations RelationGenre="ImmarkusDataModelHierarchy"> 設定
            out += '<document filename="' + docFilename + '" ' + extraSettings + '>\r\n'
                 + '<corpus>' + corpusTitle + '</corpus>\r\n'
                 + docMetadataXml                                        // 包含 <title>. <author> 等
                 + ((udefMetadataXml !='') ? '<xml_metadata>' + udefMetadataXml + '</xml_metadata>\r\n' : '')
                 + '<doc_content>'
                 + docContentXml
                 + '</doc_content>\r\n'
                 + '</document>\r\n';
         }
         
         // 2025-07-01: 對於 iiif images 而言，
         //             可透過 <Udef_DocMeta_Image_title_ch> 取得此 manifest_id 對應顯示的上層圖名 x => 修改 <Udef_Genre_Subfolder>iiif:x</Udef_Genre_Subfolder>
         //             透過某個 image piece 的 <Udef_properties_Image_title_ch> 取得 canvas_id 對應顯示的當前圖名 y => 修改 <Udef_Genre_Filename>iiif:y</Udef_Genre_Filename>
         if (GlobalVar.replaceIiifUdefGenreSourceStructure) {
            let processingTagList = { 'Udef_Genre_Filename': ['Udef_properties_Image_title_ch', 'Udef_properties_Image_title_py', 'Udef_properties_Image_title_en'],
                                      'Udef_Genre_Subfolder': ['Udef_DocMeta_Image_title_ch', 'Udef_DocMeta_Image_title_py', 'Udef_DocMeta_Image_title_en',
                                                               'Udef_DocMeta_Source_title_ch', 'Udef_DocMeta_Source_title_ch_',
                                                               'Udef_DocMeta_Source_title_py', 'Udef_DocMeta_Source_title_py_',
                                                               'Udef_DocMeta_Source_title_en', 'Udef_DocMeta_Source_title_en_'
                                                              ],
                                    };
            let xmlStr = '<root><documents>' + out + '</documents></root>';
            let xmlDoc = $.parseXML(xmlStr);
            let jqRoot = $(xmlDoc);
            jqRoot.find("document").each(function() {
               let jqDoc = $(this);
               let udefTagsToProcess = Object.keys(processingTagList);
               udefTagsToProcess.forEach(function(udefTagToProcess) {
                  jqDoc.find(udefTagToProcess).each(function() {
                     let origVal = $(this).text();
                     if (origVal.startsWith('iiif:')) {     // e.g., Udef_Genre_Filename := 'iiif:<manifest_id>:<canvas_id>' 
                        let docTitleTag = null;
                        let found = processingTagList[udefTagToProcess].some(function(tag) {
                           if (jqDoc.find(tag).length > 0) {
                              if (!docTitleTag) docTitleTag = tag;         // 取最前面符合的
                              return true;
                           }
                           else return false;
                        });
                        if (found) {
                           $(this).attr("OrigVal", origVal);
                           $(this).text('iiif:' + jqDoc.find(docTitleTag).text());
                        }
                     }
                  });
               });
            });
            out = jqRoot.find("documents").html();               // 不能直接透過 jqRoot.html() 或 jqRoot.prop("outerHTML") 取得 xml 字串！
         }

         // 2025-02-23: 將每篇文件加入的 Udef tags 加入 corpus setting
         // 2025-06-18: 加上 GlobalVar.folderModelFileDict 的 tagRelations
         // 2026-01-25: (TODO) 將多份 batch 的 corpus settings 合併...
         let corpusSettingsObj = { metadataFieldLabelMap: GlobalVar.metadataFieldLabelMap, 
                                   udefTagsDict: GlobalVar.udefTagsDict, 
                                   folderModelFileDict: GlobalVar.folderModelFileDict
                                 };
         // YES (TODO)...
         // ... store corpusSettingsObj for the final "merge corpus settings"
         let settingsXml = getCorpusSettingsXml(corpusTitle, GlobalVar.metadataFieldLabelMap, GlobalVar.udefTagsDict, GlobalVar.folderModelFileDict);
         corpusSettingsXmlList.push(settingsXml);
      }

      let outHead = '<?xml version="1.0"?>\r\n' +
                    '<ThdlPrototypeExport>\r\n' +
                    corpusSettingsXmlList.join('\r\n') +
                    '<documents>\r\n';
                    
      out = outHead 
          + out
          + '</documents>\r\n' 
          + '</ThdlPrototypeExport>';

      return out;          
   }
   
   function saveFile(filename, out, mime="text/plain;charset=utf-8") {
      var blob = new Blob([out], {type: mime});
      saveAs(blob, filename);             // requires FileSaver.js
   }
   
   function saveJson4Debugging(filename, obj) {
      filename = (new Date()).yyyymmdd() + '-debug-' + filename + '.json';
      let mime = 'application/json;charset=utf-8';
      saveFile(filename, JSON.stringify(obj), mime);
   }
   
   function getCorpusSettingsXml(corpusTitle, metadataFieldLabelMap, udefTagDict, folderModelFileDict) {
      let lines = [];
      lines.push('<corpus name="' + corpusTitle + '">');
      
      // 2024-10-27: <metadata_field_settings>
      // 2024-10-31: 注意，不同 Immarkus 來源的 metadata 可能相同（例如 Iva 的考古報告和 Sunkyu 的 LoGart，前者是期刊名與作者，後者則是文件的來源與作者）
      //             這表示需加上稍有彈性的機制，允許不同 corpus 在相同 spotlight (e.g., compilation_name) 顯示不同名稱（若文獻集合併，兩者會混在一起）
      // 2025-06-06: 加上 doctype, geo_level1
      let metadataFields = ['compilation_name', 'author', 'time_dynasty', 'year_for_grouping', 
                            'docclass', 'doc_source', 'doctype', 'geo_level1'];
      lines.push('<metadata_field_settings>');
      let idx = 0;
      metadataFields.sort().forEach(function(metadataField, idx) {     // 2025-07-16: 加上 sort()
         if (!metadataFieldLabelMap[metadataField]) return;            // 如果沒有在 metadataFieldLabelMap 找到對應，就不加入 settings
         let s = '<' + metadataField + ' show_spotlight="Y" display_order="' + (++idx) + '">' 
               + metadataFieldLabelMap[metadataField] 
               + '</' + metadataField + '>';
         lines.push(s);
      });
      lines.push('</metadata_field_settings>');

      // 2024-10-10: <feature_analysis>
      lines.push('<feature_analysis>');
      Object.keys(udefTagDict).sort().forEach(function(v) {            // 2025-07-16: 加上 sort()
         let s = '<tag type="contentTagging" name="' + v + '" default_category="' + v + '" default_sub_category="-"/>';
         lines.push(s);
      });
      lines.push('</feature_analysis>');

      // 2025-06-18: 加上 <TagRelations>，原先是利用 <![CDATA[ jsonStr ]]> 將 json 內容直接嵌入
      //             後來改為 xml <Relation From="tag1" To="tag2" /> 形式
      // 2025-07-24: 改名為 <ExtraRelations>，並加上 RelationGenre="ImmarkusDataModelHierarchy"
      let modelKeys = Object.keys(folderModelFileDict);
      if (modelKeys.length > 0) {
         lines.push('<ExtraRelations RelationGenre="ImmarkusDataModelHierarchy">');
         modelKeys.forEach(function(modelKey) {
            lines.push(`<Model Source="${modelKey}">`);
            lines.push(folderModelFileDict[modelKey].tagRelationsXml);
            lines.push("</Model>");
         });
         lines.push('</ExtraRelations>');
      }
      lines.push('</corpus>');
      console.log(lines);
      
      return lines.join("\n");
   };
   
   async function convertImmarkusJson2Doc(annotationJsonObj) {
      // 注意：這是個程式碼頗長，有些複雜度性的函式...
      //       一個 annotation json 產生一份 annotationJsonObj
      // annotationJsonObj := {filepath, filename, immarkusManifestId, iiifManifestJson, iiifManifestUrl, canvasImages}
      //console.log(annotationJsonObj);
      //alert(JSON.stringify(annotationJsonObj));
      
      // 2024-04-26:
      // 每一個陣列元素，對應到一個 Paragraph
      // naming rule: 來自 immarkus 所新增的標記名稱，都以 Immarkus 作為 prefix，例如 <ImmarkusXyz>
      // <Paragraph @ImmarkusId @W3Context @ImmarkusType @CreatedTime @CreatorIsGuest @CreatorId>
      //   <ImmarkusObj>
      //      [target]  => 圖像標記的資訊（形狀等）
      //      [body]    => 圖像標記的文字說明
      //   </ImmarkusObj>
      // </Paragraph>

      let jsonFilename = annotationJsonObj.filename;                       // 2024-10-21
      let jsonFilepath = annotationJsonObj.filepath;                       // 2024-10-21
      let annotationManifestId = annotationJsonObj.immarkusManifestId;     // 2025-04-18

      //console.log(annotationJsonObj);
      //alert("annotationJsonObj ==>" + jsonFilename + "\n\n" + JSON.stringify(annotationJsonObj, null, 2));
      
      let isIiifImageObj = false;
      if (annotationJsonObj.iiifManifestUrl !== undefined) {               // 2025-04-21: 在此不管是否有 fetch 到 manifest data
         isIiifImageObj = true;
      }

      // 2025-06-06: metadata <doctype> 保留給影像型態： "normal image", "iiif image"
      let docMetadataXml = ''
      if (GlobalVar.addImageTypeToMetadata) {
         // 2025-06-17: 將空白換成 '.' 以利後續後分類或搜尋
         GlobalVar.metadataFieldLabelMap['doctype'] = 'ImageType';               // 在 <metadata_field_settings> 加上 <doctype...> 設定
         let metadataDocType = (isIiifImageObj) ? 'iiif.image': 'normal.image';
         docMetadataXml = "<doctype>" + metadataDocType + "</doctype>";          // 2025-03-28
      }
      
      if (!isIiifImageObj) {
         // 2025-04-09: 防呆 fail-safe
         let folderMetadataXml = GlobalVar.folderMetadataFileDict[jsonFilepath]
                               ? GlobalVar.folderMetadataFileDict[jsonFilepath].docMetadataXml
                               : '';
         docMetadataXml = folderMetadataXml + "\n" + docMetadataXml;
      }
      
      let immarkusJson = [];
      if (isIiifImageObj) {
         //alert("isIiifImageObj " + JSON.stringify(annotationJsonObj.canvasImages));
         // annotationJsonObj.canvasImages := [{ iiifImageUrl, imageKey: iiif_<seq_id>.<canvas_id>.<image_id>, canvasAnnotation }, ...]
         // 2025-04-05: 概念上，一個 canvas 是可以有數個 images，但 immarkus iiif markup 似乎假設只有一份影像...
         //             在這裡直接將 canvas 的 annotations 用 .concat() 串接起來
         annotationJsonObj.canvasImages.forEach(function(canvasImage) {
            immarkusJson = immarkusJson.concat(canvasImage.canvasAnnotation);
         });
      }
      else {
         // 一般（非 iiif）影像
         if (annotationJsonObj.text!='') immarkusJson = JSON.parse(annotationJsonObj.text)
      }

      let imageFilename, folderHierarchy = '-', imageSubfolder;          // 2025-06-22: 加入 folderHierarchy, imageSubfolder
      let s = '';
      if (!Array.isArray(immarkusJson)) {
         // 2026-04-15
         let filename = jsonFilepath + "/" + jsonFilename;
         let errType = "Warning";
         let errMsg = "may not be a valid IMMARKUS JSON file (is not an array of object)!"
         reportError(filename, errType, errMsg) 
         return s;
      }
      
      let paragraphList = [];
      let udefMetadata = [];              // 2024-06-22: user-defined metadata -- 會併入 <xml_metadata>
      let selectorValueDict = {};         // 2024-06-25: 方便 convertImmarkusJsonAsEventsXml() 取得 selector 的值

      // (1). 處理 <xml_metadata> 部分      
      // 2025-03-25: 先將 iiif manifest 的 metadata 轉入 <xml_metadata> 下的標籤 （放在 udefMetadata 陣列）
      //             產生標籤 <{label}>{value}</{label}> -- 注意 label 需經過 encoding
      if (isIiifImageObj) {
         let iiifManifestUrl = annotationJsonObj.iiifManifestUrl;

         // 從 iiif manifest 提取 metadata
         // iiifMetadata: an array, each element has label and value fields (note: value can be an array of @value)
         let iiifMetadata = annotationJsonObj.iiifManifestJson.metadata;
         if (Array.isArray(iiifMetadata)) {
            iiifMetadata.forEach(function(item) {
               // 2025-04-03: 多數可從 item.label + item.value 直接取得字串，但有時 item.label 和 item.value 會是「可用 key 對應起來」的物件...
               let label = item.label;
               let value = item.value;
               if ((typeof label === "object" || typeof label === 'function') && (label !== null)) {     // 是個物件
                  // e.g., https://iiif.archive.org/iiif/3/reportofinternatinte/manifest.json
                  let objFirstKey = Object.keys(label)[0];           // 例如 "none"
                  label = label[objFirstKey];                        // 為了簡化，在此僅處理第一個 key 值的內容...
                  value = value[objFirstKey];
               }
               
               label = (Array.isArray(label)) ? label.join('; ') : label;
               
               // 2025-04-06
               if (GlobalVar.iiifOnlyAddMajorMetadata) {
                  if (!GlobalVar.iiifMajorMetadataFields.includes(label)) return;     // 如果不在 iiifMajorMetadataFields 列表就跳過
               }
               
               let tag = 'iiif_' + convertToLegalTagName(label);
               let val = (Array.isArray(value)) ? value.join(';') : value;
               
               // 2025-03-27：注意，若 val 為 '&lt;www.loc.gov/item/2002625249/&gt;' 經 append() 後竟然變成 '<www.loc.gov item="" 2002625249="">.</www.loc.gov>'！
               val = val.replace('&lt;','_').replace('&gt;','_');                        // 2025-03-27: 為了簡化問題，乾脆把 '&lt;', '&gt;' 都置換成底線
               val = val.replace(/ /g, '.');                                             // 2025-06-17: 將空白換成 '.'
               val = convertToLegalTagValue($("<div/>").append(val).text()) || '-';      // full description 可能包含 <img src="..."> 然後因為沒有 </img> 造成 Xml 失敗...
               let s = `<${tag}>${val}</${tag}>`;
               udefMetadata.push(s);
            });
         }
      }
      
      // 2024-04-29: 應可假設一篇 immarkus json 僅用到一份圖檔（因為 immarkus 需用檔名來對齊 json 和圖檔）
      //             因此，應在文件層級（而非 Paragraph 層級）下，加上 
      //             <ImmarkusImage @Type @Url @Thumbnail [@IiifManifest]>[caption]</ImmarkusImage>
      //             2025-06-10: 加上 Type 'Generic', 'Iiif'
      // 2024-06-23: 前幾天收到的 immarkus json 樣本中，陣列的第一項「可能」是該影像的部分 metadata 資訊...
      
      // 檢查是否有需放在 <xml_metadata> 的 udefMetadata 項目，若有則將其擷取出來後，從 immarkusJson 陣列移除
      // 2024-06-23 假設是在第一項，但後續樣本有出現在其他項中...

      //console.log(immarkusJson);
      immarkusJson.forEach(function(v, idx) {
         // 2024-06-23: 檢查是否是「正常」的 piece 標記，或者是 metadata（若沒有 created 和 creator 屬性，就視為 metadata）
         //             但 REPORTS/frst tier images/一九五四年春洛阳西郊发掘报告_郭宝钧/Screenshot (657).json 就放到最後一項...
         // 2024-10-21: 新的規格似另外加上 folder metadata，例如「考古學報 xx 期」的 metadata 資訊，
         //             然後 folder 中可能包含該報告的多份影像，每個影像一個檔案（所以可能有各自的 image metadata）
         //             => 如果 immarkusJson 的某個 item「沒有 v.created 也沒有 v.creator」，這個 item 就似乎是 image metadata
         //console.log(v);
         //alert(JSON.stringify(v,null,2));
         
         let t;
         // 注意：由於 v.target.source 僅包含 iiif:<manifest_id> 代表 user metadata 並且已另行
         //       處理（該項目已經被移除），以下的程式碼應該可以略去... todo todo todo
         // 2026-01-25: AI auto-transcription 不會有 v.created, v.creator，因此似乎不再需要以下檢查了？
         if (!v.created && !v.creator) {
            if (v.target && v.target.source) {
               let parts = v.target.source.split(':');
               if (parts.length <= 1) {
                  // e.g., 8f27dfc43b21adc2, b6706cca6d3f1500, etc.
                  console.log("missing created/creator and target.source seems invalid: " + v.target.source);
                  return;     
               }
               else if (parts.length == 2) alert("something wrong??");     // e.g., iiif:42b6679004af795d
               else if (parts.length == 3) return;   // return 表示這一項是「正常」的 piece annotation，不能設為 undefined，要留著（length 1 為 normal immarkus image, 3 為 iiif canvas annotation）
            }
            
            // 2026-04-15
            let errType = "Warning";
            let errMsg = "WARNING: not a valid IMMARKUS JSON file?";
            reportError(jsonFilename, errType, errMsg);
            
            //// 沒有 created 與 creator，若有 body 則視為 iiif metadata？
            //// 若是 iiif metadata，則取出並進行一些設定後，就將它移除（透過 immarkusJson[idx] = undefined 再 filter out）
            //if (v.body) {
            //   // target 的 source 是一串看不懂的編碼？ (e.g., "6c663d835c46ca7b") => 最後會被設為 undefined 然後移除
            //   if (v.body.properties) {
            //      t = "<Source>" + v.body.source + "</Source>";
            //      udefMetadata.push(t);
            //      let fields = Object.keys(v.body.properties);
            //      fields.forEach(function(field) {
            //         let tagName = "prop_" + convertToLegalTagName(field);                           // 2024-10-21: 加上前綴 'prop_'
            //         //console.log(tagName + ':' + field + ':' + JSON.stringify(v.body.properties));
            //         
            //         // 2024-11-17: (bug fix) v.body.properties[field] 可能是個物件 {"value":349,"unit":"pix"} 或整數
            //         let val = v.body.properties[field];
            //         if (typeof val === 'object') {
            //            let tempArr = [];
            //            Object.keys(val).forEach(function(valKey) {
            //               tempArr.push(valKey);
            //               tempArr.push(val[valKey]);
            //            });
            //            val = tempArr.join("_");
            //         }
            //         val = val.toString().trim();
            //         
            //         let tagVal = convertToLegalTagValue(val) || '-';           // 2024-11-01: 若為空值，就轉為 '-' 輸出
            //         tagVal = tagVal.replace(/ /g, '.');                        // 2025-06-17: 將空白置換成 '.'
            //         t = "<" + tagName + ">" + tagVal + "</" + tagName + ">";
            //         udefMetadata.push(t);
            //      });
            //   }
            //   else if (Array.isArray(v.body)) {                                // 可能是舊的格式？
            //      v.body.forEach(function(item) {
            //         if (item.value) {
            //            let tagName = "body_array_value";                       // 2024-10-21: 固定標籤名稱...
            //            let tagVal = convertToLegalTagValue(item.value);
            //            tagVal = tagVal.replace(/ /g, '.');                     // 2025-06-17: 將空白置換成 '.'
            //            t = "<" + tagName + ">" + tagVal + "</" + tagName + ">";
            //            udefMetadata.push(t);
            //         }
            //         else alert("Error: no created, creator, body array has no @value => " + JSON.stringify(v.body));
            //      });
            //   }
            //   else alert("Error: no created, creator, body => " + JSON.stringify(v.body));
            //}
            //else {
            //   alert("Error: missing 'body' attribue!\n" + JSON.stringify(v));
            //}
            //
            //immarkusJson[idx] = undefined;     // 先設為 undefined (for iiif metadata)，後續再用 filter 移除所有 undefined items
         }  // end of if (!v.created && !v.creator)
         
         // 2024-10-31: 必須有 created 和 creator 屬性的 v.target.source 才會是檔名...
         if (v.created && v.creator) {
            if (!imageFilename && v.target.source) imageFilename = v.target.source;
         }
      });
      
      // (2). 處理 image 部分 -- 注意一篇 immarkus 文件僅含一個 image，或者一個 iiif manifest
      // 2024-11-01: 如果移除「看不懂的舊版資訊」後，沒剩下任何項目，就還是得補一個（必須有 id 的）元素進去
      //             參考案例 "康熙_屯留縣志_14.json"
      immarkusJson = immarkusJson.filter((v) => (v!==undefined));     // 2024-10-21
      if (immarkusJson.length == 0) {
         immarkusJson.push({"id":"Immarkus2D_placeholder"});
      }

      if (!isIiifImageObj) {
         // 2024-11-03: 例如 "20241018-Immarkus-Sunkyu/Shanxi_gazetteer/康熙_屯留縣志" 的 "康熙_屯留縣志_14.json"
         //             會找不到 image filename，目前只能透過「預設檔名就是將 .json 改為 .jpeg」的方式處理
         // 2025-01-31: 圖檔可能是 .jpeg 或 .png 或 .jpg（例如懷仁縣志）！
         // 2025-04-18: Rainer 說 target.source 的圖檔名只供參考，目前是用 base filename 從目錄比對檔名來找出圖檔...
         //             (TODO) 需修改程式處理 target.source 和 folder image filename 不同的狀況...
         if (!imageFilename) {
            let candidateImageExt = ['png', 'jpeg', 'jpg', 'gif'];
            let found = candidateImageExt.some(function(ext) {
               let parts = jsonFilename.split('.');
               parts.pop();             // 移除最末的 json
               parts.push(ext);         // 改為新的 png/jpeg/jpg
               imageFilename = parts.join('.');
               if (GlobalVar.imageRelativeFilenameDict[jsonFilepath + '/' + imageFilename]) return true;
            });
            if (!found) {
               s = "Fail to find corresponding image filename for " + jsonFilepath + '/' + jsonFilename;
               //alert(s);
               console.log(s);          // imageFilename 應會是最後嘗試的 'jpg'
            }
         }
         
         if (immarkusJson.length > 0) {
            immarkusJson[0].imageFilename = imageFilename;         // 2024-06-25: 將檔名嵌入第一個元素
            immarkusJson[0].imageFilepath = jsonFilepath;          // 2024-06-25: 將檔名嵌入第一個元素
            
            let imageFilepath = jsonFilepath;
            let imageUrl = GlobalVar.imageUrlPath + imageFilepath + "/" + imageFilename;
            if (GlobalVar.dirPickerReady && GlobalVar.forceBlobUrlUnderChromium) {                              // 2025-05-22, 2026-03-30 加上 GlobalVar.forceBlobUrlUnderChromium 檢查（否則若第一次在 blob mode 選檔案夾，dirPickerReady 就會是 true）
               imageUrl = await window.parent.parent.getFileURLFromHandle(imageFilepath+ "/" + imageFilename);
               if (imageUrl === null) imageUrl = "I2D_FAIL_TO_FIND=" + imageFilepath+ "/" + imageFilename;      // 2025-05-28, 2026-03-29
            }
            
            // 2025-06-18: 移除 LocalUrl，改為 folderHierarchy
            folderHierarchy = imageFilepath;
            imageSubfolder = folderHierarchy.split('/').pop();     // image 所在子目錄名稱
            let t = getImmarkusImageTag('Generic', imageFilename, imageUrl, folderHierarchy, false);            // 內文部分的 image 略過檢查，在 <Event> 的 image 才需檢查
            paragraphList.push(t);
         }
         else console.log("Empty immarkusJson: " + jsonFilename)
      }
      else {
         // 2025-04-05: iiif images
         //alert(JSON.stringify(annotationJsonObj));
         //alert("YES -- " + annotationJsonObj.canvasImages.length + "\n" + JSON.stringify(annotationJsonObj.canvasImages));
         annotationJsonObj.canvasImages.forEach(function(canvasImage) {
            // 2025-06-22: 根據 Dawn 的來信，若 imageFilename := iiif:42b6679004af795d:1562217993
            //             則取 iiif:42b6679004af795d 作為 folderHierarchy
            let { iiifImageUrl, imageKey, imageWidth, imageHeight, canvasAnnotation} = canvasImage;
            if (!imageFilename) {
               // 2025-07-21: 防呆
               let immarkusManifestId = annotationJsonObj.immarkusManifestId;
               imageFilename = `iiif:${immarkusManifestId}:undefined`;
            }
            let parts = imageFilename.split(':');
            parts.pop();
            folderHierarchy = parts.join(':');
            imageSubfolder = folderHierarchy;                        // IIIF 的 imageSubfolder，跟 folderHierarchy 一樣，都是 iiif:<manifest_id>
            let t = getImmarkusImageTag('Iiif', imageFilename, iiifImageUrl, folderHierarchy, false, imageWidth, imageHeight);    // 2025-06-22: 原先是用 imageKey 而非 imageFilename
            //alert("Yes ImmarkusImage -- \n" + t);
            paragraphList.push(t);
         });
      }
      
      // 注意：經由以上步驟處理後，immarkusJson 已經不再是函數傳入的值，可能會移除陣列第一項
      //       的 metadata，新的陣列第一項會多出 imageFilename，
      //       iiif metadata 的項目，應該在前面就已經移除了...
      immarkusJson.forEach(function(v, idx) {        // v 為一個 piece 的數據（轉換成一個 paragraph）
         // Note: 在 DocuXml 中，新增 <ImmarkusImage>, <ImmarkusObj>, <ImmarkusShape>, 
         //       <ImmarkusBody>, <ImmarkusProperties> 五種標籤
         // console.log(v);
         
         // 檢查 annotation json 的一些欄位（防呆）
         // 2025-04-21: 還有一個 purpose 欄位...
         if (!v.id || !v['@context'] || !v.type || !v.target || !v.body) {                
            // IMMARKUS local images 這些欄位都需具備，否則就略過
            //if (!v.id) alert('missing id');
            //if (!v['@context']) alert('missing @context');
            //if (!v.type) alert('missing type');
            //if (!v.target) alert('missing target');
            //if (!v.body) alert('missing body');
            //alert(isIiifImageObj + "\n" + JSON.stringify(immarkusJson));
            console.log("Object [" + idx + "] seems not a valid IMMARKUS item? (missing some attribute)");
            return;
         }
         // 2025-11-19: (fix issues)「乾隆_上杭縣志_35774_135_136_com.json」的第一項缺少 created, creator 資訊
         //else if (!v.created || !v.creator) {
         //   if (v.target && v.target.source && v.target.source.split(':')[0] === 'iiif') ;    // 2025-04-18: iiif annotation
         //   else {
         //      console.log("Object " + idx + " is invalid IMMARKUS local image annotation (missing created/creator)");
         //      return;
         //   }
         //}
         
         let paragraphLines = [];
         
         // 2025-04-18: 為了處理 iiif metadata，加上防呆
         let created = v.created || '-';
         let isGuest = (v.creator && v.creator.isGuest) ? v.creator.isGuest : '-';
         let creatorId = (v.creator && v.creator.id) ? v.creator.id : '-';
         
         let immarkusJsonId = convertToLegalTagAttrValue(v.id);
         let paragraphKey = "mark:" + idx;                 // optional @Key
         let t = '<Paragraph Key="' + paragraphKey
               + '" ImmarkusId="' + immarkusJsonId
               + '" W3Context="' + convertToLegalTagAttrValue(v["@context"]) 
               + '" ImmarkusType="' + convertToLegalTagAttrValue(v.type)
               + '" CreatedTime="' + convertToLegalTagAttrValue(created) 
               + '" CreatorIsGuest="' + convertToLegalTagAttrValue(isGuest)
               + '" CreatorId="' + convertToLegalTagAttrValue(creatorId) + '">';
         paragraphLines.push(t);
         GlobalVar.immarkusIdDict[v.id] = { tagType: 'Paragraph' };           // 2024-12-23

         // 有點複雜的程式碼，日後應該需要重構...
         paragraphLines.push("<ImmarkusObj>");
         if (v.target.selector) {                    // 注意，json annotation item 不能是對應到 iiif metadata 的 item，才會有 svg selector
            // 注意: IMMARKUS 在影像上的形狀標記，似乎是以絕對點距來表示 => 這表示必須用原圖的大小來擺放才行（圖檔若放大縮小，標記的位置和大小就會跑掉）
            // [target]
            // <ImmarkusShape @Key @SelectorType @SelectorValue>            // 2024-05-02: 自行加入 @Key 屬性，填入 paragraphKey 值
            //    <Udef_Image_Source>target.source</Udef_Image_Source>
            // </ImmarkusShape>
            
            // 2024-06-23: selectorType 若非 "SvgSelector"，則在此進行額外轉換
            let selectorType = v.target.selector.type;
            let selectorValue = v.target.selector.value;             // e.g., <svg><polygon points="..."/></svg>
            if (selectorType == "SvgSelector") {
               // 2025-03-31: iiif image 的 SvgSelector，其 <polygon> points 似乎會被放大數倍...
               // TODO: 暫時將 iiif polygon 座標縮小 4 倍...
               if (isIiifImageObj) {
                  const shrinkRatio = 1;                             // （經過眼睛檢測）有時座標被放大 4 倍，有時則是 8 倍！
                  let jqSvgSelector = $(selectorValue);
                  jqSvgSelector.find("polygon").each(function() {
                     let points = $(this).attr("points").split(' ');
                     points = points.map(point => {
                       let [x, y] = point.split(',').map(Number);    // map(Number) 可將字串陣列換成數字陣列...
                       x = Math.floor(x / shrinkRatio);
                       y = Math.floor(y / shrinkRatio);
                       //alert(JSON.stringify(point) + "\n" + x + "\n" + y);
                       return `${x},${y}`;
                     });
                     $(this).attr("points", points.join(' '));
                  });
                  selectorValue = jqSvgSelector.prop("outerHTML");
               }
            }
            else if (selectorType == "FragmentSelector") {            
               // 2026-01-21: 雖然先前曾 Rainer 說，此 selectorType 已經 obsolete，但目前為了 AI auto-transcribing 似乎又跑出來了...
               // e.g., xywh=pixel:231.67844870887296,242.74731503245258,72.6652880331443,82.64976304309263
               if (selectorValue.indexOf("xywh=pixel:") >= 0) {
                  let [x,y,w,h] = selectorValue.substr("xywh=pixel:".length).split(',');
                  selectorValue = '<svg><rect x="' + Math.round(x) + '" y="' + Math.round(y)     // 可不需加上 Math.round()
                                + '" width="' + Math.round(w) + '" height="' + Math.round(h) + '"/>'
                                + '</svg>';
                  //alert(selectorValue);
               }
               else alert("Unrecognized FragmentSelector value: " + selectorValue);
            
               selectorType += "=>SvgSelector";
               //alert(selectorType + "\n" + selectorValue);
            }
            //else if (selectorType == 'MULTIPOLYGON') {
            //   // 早期 IMMARKUS 使用 MULTIPOLYGON
            //   // 2025-04-17: Rainer 說已拿掉 multipolygon，改用 svg path 實作（可詢問 ChatGPT 如何用 svg path 達成 GeoJSON multipolygon 效果）
            //   //             因此這部分日後應可移除
            //   let geometry = v.target.selector.geometry;
            //   let polygons = geometry.polygons;
            //   //alert(JSON.stringify(polygons));
            //
            //   let svgPolygons = [];
            //   polygons.forEach(function(polygon, pidx) {
            //      let rings = polygon.rings;                 // 目前不知除了 "rings", "bounds" （拿來定義 svg mask 範圍） 還有什麼（其他的）物件...
            //      let bounds = polygon.bounds;               // 定義 svg mask 時需給一個範圍
            //      if (rings.length < 2) {
            //         alert("SKIP: multipolygon should have at least 2 rings: only " + rings.length + " polygons");
            //         return;
            //      }
            //      let coordinates = [];
            //      rings.forEach(function(ring, ridx) {
            //         coordinates[ridx] = [];
            //         ring.points.forEach(function(point) {
            //            let [x,y] = point;
            //            coordinates[ridx].push(Math.floor(x) + ',' + Math.floor(y));
            //         });
            //      });
            //      
            //      // mask 白色區域：顯示底下的內容（圖像或其他元素）。
            //      //      黑色區域：會遮擋底下的內容，讓這部分不可見。
            //      //      灰色區域：顯示部分透明的效果。
            //      let maxX = Math.floor(bounds.maxX);
            //      let maxY = Math.floor(bounds.maxY);
            //      let innerRings = [];
            //      for (let i=1; i<coordinates.length; i++) {         // 外圈內可以有多個「洞」（也就是內圈）
            //         let hole = '<polygon points="' + coordinates[i].join(' ') + '" fill="black" />';
            //         innerRings.push(hole);
            //      }
            //      
            //      let maskId = immarkusJsonId + '_' + pidx;
            //      let mask = '<defs>'                           // 環內透明
            //               + `<mask id="${maskId}">`
            //               + `<rect x="0" y="0" width="${maxX}" height="${maxY}" fill="white" />`      // 若沒有 bounds 提供 maxX, maxY，則必須動態設定
            //               + innerRings.join('')
            //               + '</mask>'
            //               + '</defs>';
            //      let outerRing = '<polygon points="' + coordinates[0].join(' ') + `" fill="blue" mask="url(#${maskId})" />`;
            //      svgPolygons.push('<g>' + mask + outerRing + '</g>');
            //   });
            //   selectorValue = '<svg>' + svgPolygons.join('\n') + '</svg>';
            //   //alert(selectorValue);
            //}
            else {
               alert("Unknown selectorType: " + selectorType);
               selectorValue = "UnknownSelectorType";
            }
            selectorValueDict[idx] = selectorValue;                        // 2024-06-26: 轉換成 <svg> 的 selector value
            
            // 2025-04-19
            let udefImageSource = '';
            let udefTagName = 'Udef_Image_Source';
            if (GlobalVar.extraUdefTagList.includes(udefTagName)) {
               udefImageSource = '<' + udefTagName + '>' + convertToLegalTagValue(v.target.source) + '</' + udefTagName + '>';
               GlobalVar.udefTagsDict[udefTagName] = 1;
            }

            t = '<ImmarkusShape Key="' + paragraphKey                       // 2024-05-02: 加入 @Key，方便後續和 Paragraph 進行對應
              + '" SelectorType="' + convertToLegalTagAttrValue(selectorType) 
              + '" SelectorValue="' + convertToLegalTagAttrValue(selectorValue) + '">'
              + udefImageSource
              + '</ImmarkusShape>';
            paragraphLines.push(t);
         }
         
         // [body] -- 注意: body 是個陣列（2026-01-21: 若非陣列則表示它是 metadata）
         //           在此假設「不需從 tagname 轉回 immarkus json」，因此多階層的串接可以都用底線 '_' 以利閱讀
         // <ImmarkusBody @ImmarkusId @Type @Purpose @CreatedTime @Source>
         //    <Udef_Genre_Source>body.source</Udef_Genre_Source>
         //    <Udef_Genre_Purpose>body.purpose</Udef_Genre_Purpose>
         //    <Udef_Genre_Type>body.type</Udef_Genre_Type>
         //    <ImmarkusProperties>
         //       <Udef_name_of_layer>body[0]['name of layer']</Udef_name_of_layer>
         //       <Udef_date_dynasty>body[0]['date dynasty']</Udef_date_dynasty>
         //       <Udef_thickness_value>body[0]['thickness'].value</Udef_thickness_value>
         //       <Udef_thickness_unit>body[0]['thickness'].value</Udef_thickness_unit>
         //    </ImmarkusProperties>
         // </ImmarkusBody>
         // <ImmarkusBody>
         //    ...
         // </ImmarkusBody>
         //
         // => better?
         //    <Udef_thickness_value.unit>body[0]['thickness'].value/body[0]['thickness'].unit</Udef_thickness_value.unit>

         // (code)
         if (GlobalVar.contentIncludesImmarkusProperties) {
            let isImageMetadata = false;    // 若為 image metadata => 產製 <ImmarkusBody ImmarkusId="NULL">
            let body = v.body;
            
            if (!Array.isArray(body)) {     // 若 body 非陣列，表示其為 metadata？
               body = [body];             
               isImageMetadata = true;
            }
            
            // 2026-03-01: 產製 <ImmarkusBody>
            // body 雖然是個陣列，但「正常」狀況下只會有一項
            // 問題：山西_annotations/乾隆_壽陽縣志_92923_com/乾隆_壽陽縣志_92923_90_91_com.json
            //       中，最後一項 (shape18) 的 body 卻為一個包含兩項的陣列...
            //       依照樣本的照結構來看，應該 body[1] 是 body[0] 的子項目... 但目前產生的 <Udef_Genre_xx> 僅會有一層
            body.forEach(function(b, bidx) {
               // 2024-04-28: 除了 id, type, purpose, created 三欄，source 會放入 Udef_Genre 欄位
               // 2025-06-19: 有時沒有 source，卻多了一個 value (purpose 是 commenting)
               // 2026-01-21: AI auto-transcription 的欄位會沒有 b.source...
               if (!b.source) {
                  // 應該是 comment，因為沒有標記對象，應該可以先跳過不處理 comment（TODO: 以後若使用者想加上再說）
                  //let value = (b.purpose == 'commenting') ? b.value : '-';
                  //return;
               }
               
               let source = b.source || '-';
               let type = b.type || '-';
               let purpose = b.purpose || '-';

               // 若 b.id 不存在 (undefined)，convertToLegalTagAttrValue(b.id) 會回傳 NULL
               t = '<ImmarkusBody ImmarkusId="' + convertToLegalTagAttrValue(b.id)
                 + '" Type="' + convertToLegalTagAttrValue(type)
                 + '" Purpose="' + convertToLegalTagAttrValue(purpose)
                 + '" Source="' + convertToLegalTagAttrValue(source)                // e.g., 'stratighraphy', 'bridge', 'city', etc.
                 + '" Filename="' + convertToLegalTagAttrValue(imageFilename)       // 2025-06-17: Hilde 提到影像檔名
                 + '" CreatedTime="' + convertToLegalTagAttrValue(b.created) 
                 + '">';
               paragraphLines.push(t);
               
               // 2024-12-23: 在此假設最多只有一個 b.id 會是 undefined -- 但實際上可能有多份！（例如 _iiif.42b6679004af795d.annotations.json 第 22, 23 entries）
               GlobalVar.immarkusIdDict[b.id] = { tagType: 'ImmarkusBody' };
            
               // 2025-12-19: 處理 Udef_Genre_ 標籤
               // 注意：以 Udef_Align_OBJECT_MAIN 取代 Udef_Genre_Entity，如此方能和 COMARKUS 進行對應
               // 2025-06-18: COMARKUS2D 會將 OBJECT_MAIN 的 'wall' 轉換為 'city_wall'
               //             另外兩項研究重點是 'bridge', 'road'
                             
               let genreTags = { 'Udef_Genre_Type': type,
                                 'Udef_Genre_Purpose': purpose,
                                 'Udef_Genre_Source': source,                     // 2025-11-28
                                 'Udef_Genre_Filename': imageFilename,            // 2025-06-16
                                 'Udef_Genre_Subfolder': imageSubfolder,          // 2025-06-22
                               };
                                
               // 2026-02-28: 若為 image metadata，就不輸出 Udef_Img_EntityClass，避免產生 <Udef_Img_EntityClass> 多跑出類似 "historical printed illustration" 之類
               let parentId = undefined;
               if (!isImageMetadata && source !== '-') {      // 2026-02-28: 並不見得 bidx > 1 都是 comments (e.g., 乾隆_永定縣志_35776_142_143_com.json) ... 應該是「沒有 source 的項目是 comments」
                  genreTags['Udef_Img_EntityClass'] = source;

                  // 2025-06-20: "artwork" 不在 EntityTypes 下，屬於 ImageSchemas，因此不能加入 
                  //             需透過 folderModelFileDict[modelFilepath].allowedEntities 檢查 source 是否屬於允許的項目
                  let parentId = GlobalVar.immarkusEntityParentMap[source];
                  if (parentId === undefined) ;                                      // 不屬於 entity class，例如 'artwork' -- 不需加上 Udef_Align_OBJECT 對應
                  else {
                     // 2025-12-19: 產生 Udef_Img_EntityClass 
                     // 2026-01-21: landform, water 等的 parentId 為 'NONE'，Hilde 說要直接放在第一層
                     genreTags['Udef_Img_EntityClass'] = (parentId == 'NONE')
                                                       ? genreTags['Udef_Img_EntityClass']
                                                       : parentId + '/' + genreTags['Udef_Img_EntityClass'];
                                                       
                     // 2025-06-21: 關於 Udef_Align_OBJECT，僅處理 parentId 為 'object' (視為 OBJECT_MAIN), 'obj_main'（一樣視為 OBJECT_MAIN）, 'obj_part'（視為 OBJ_PART）
                     if (parentId == 'object' || parentId == 'obj_main') {
                        genreTags['Udef_Align_OBJECT'] = 'OBJECT_MAIN/' + source;       // COMARKUS 的 OBJECT_MAIN 和 OBJ_PART 也都將對應到 Udef_Align_OBJECT
                  
                        // 2026-01-25: Hilde 說，希望在 object 最後加上加上 "entity id"（properties 下的 id 作為 object）
                        let entityId = b.properties?.id;
                        genreTags['Udef_Img_EntityClass'] += '/' + entityId;
                     }
                     else if (parentId == 'obj_part') {
                        genreTags['Udef_Align_OBJECT'] = 'OBJ_PART/' + source;          // COMARKUS 的 OBJECT_MAIN 和 OBJ_PART 也都將對應到 Udef_Align_OBJECT
                     }
                     else {
                        // 沒有 parent class 的狀況... 由於僅勾選 Udef_Align_OBJECT 作為 common node，也必須加入 Udef_Align_OBJECT 才行
                        genreTags['Udef_Align_OBJECT'] = 'NULL/' + source;              // 以 NULL 代表「沒有 parent」（後續應用程式必須能解讀）
                     }

                     // 2025-02-28: 若 source 為 'obj_part'，則 parentId 為 'NONE'，會產生單層的 <Udef_Img_EntityClass>obj_part</Udef_Img_EntityClass>...
                     if (['object', 'obj_part'].includes(genreTags['Udef_Img_EntityClass'])) {
                        if (GlobalVar.addingDashToEntityClassObj) {
                           // 加上第二層 '-' （可方便檢錯 -- 例如當標註者不確定 obj_part 為 watchtower or shrine 時）
                           genreTags['Udef_Img_EntityClass'] += '/-';
                        }
                        else {
                           // 直接移除
                           delete(genreTags['Udef_Img_EntityClass']);
                           delete(genreTags['Udef_Align_OBJECT']);
                        }
                     }
                     
                  }
               }
               
               Object.keys(genreTags).forEach(function(genreTag) {
                  let genreVal = genreTags[genreTag];
                  genreVal = genreVal.replace(/ /g, '.');             // 2025-06-17: 將空白置換為 '.'
                  t = '<' + genreTag + '>' + convertToLegalTagValue(genreVal) + '</' + genreTag + '>';
                  paragraphLines.push(t);
                  GlobalVar.udefTagsDict[genreTag] = 1;
               });
               
               // 2026-01-20: 後續工具 (XA/VizTool) 也需進行相關處理，需注意標籤名稱要和 Comarkus2D 的轉出同步
               if (GlobalVar.enableExtraAlignObjectId && genreTags['Udef_Align_OBJECT']) {            // 2026-03-11: bug fix（必須有 Udef_Align_OBJECT）
                  //alert(genreTags['Udef_Align_OBJECT']);
                  let topLayer = genreTags['Udef_Align_OBJECT'].split('/')[0];
                  let secondLayer = genreTags['Udef_Align_OBJECT'].split('/')[1];
                  if (topLayer == 'OBJECT_MAIN') {                       // 僅處理 OBJECT_MAIN
                     let objectId = b.properties?.id || '-';
                     //let alignTagName = "Udef_Align_OBJECT_ID";
                     let alignTagName = "Udef_Align_" + convertToLegalTagName(secondLayer) + "_ID";   // 2026-01-30: e.g., Udef_Align_city_wall_ID
                     let term = objectId;                                                             // 2026-01-30
                     let tagVal = (GlobalVar.fixAlignObjectId2Image)                                  // 標籤內容，COMARKUS 用 'Event'，IMMARKUS 用 'Image'
                                ? 'Image' : source;
                     tag = `<${alignTagName} Term="${term}">${tagVal}</${alignTagName}>`;             // 注意：@Term 通常是 tag value 的 norm/id
                     //alert(tag);
                     paragraphLines.push(tag);
                     GlobalVar.udefTagsDict[alignTagName] = 1;
                  }
               }
            
               // 2026-03-12: 加上 properties 以外的項目？
               if (GlobalVar.enableUdefImgNote) {
                  // 2026-03-12: IMMARKUS AI auto-transcription 會將辨識出的文字放在 "value" 欄（而非 "properties" 欄位）
                  //             在此先將它放入 <ImmarkusProperties> 標籤內
                  if (b.value) {    
                     // 2026-03-15: 若沒有 creator，應該表示它是人工標註的 comment？
                     // 若有 b.creator，將可能會有 id, name 等欄位，標示是由哪個 AI model 轉譯
                     // 也有可能沒有 b.creator，只有 type, purpose, created 等欄位
                     // 注意：不需將 Udef_Img_Note 加入後分類，若欲加入則需設定 GlobalVar.udefTagsDict[noteTag] = 1;
                     let noteTag = 'Udef_Img_Note';
                     let transcriptorId = convertToLegalTagAttrValue(b.creator?.id);       // 2026-03-15: 加上 convertToLegalTagAttrValue() 以防呆
                     let purpose = convertToLegalTagAttrValue(b.purpose);
                     let created = convertToLegalTagAttrValue(b.created);
                     let escapedText = htmlEncode(b.value);                                // 2026-03-15: 注意，必須經過 escape
                     t = `<${noteTag} TranscriptorId="${transcriptorId}" Purpose="${purpose}" Created="${created}">${escapedText}</${noteTag}>`;
                     paragraphLines.push(t);
                  }
               }
                  
               // 2025-04-21: <ImmarkusProperties> -- 有些 items 會缺漏 properties
               //             例如 _iiif.139044f48f92b8c3.annotations.json，只有第一項的 body[i] 有 properties
               //             其他項的 body[i] 雖然有 id, type, purpose, source 等標記資訊，卻沒有 properties
               paragraphLines.push('<ImmarkusProperties>');
               let obj = flatternBodyProperties("properties", b.properties);
               t = getFlatObjXml(obj, 'Udef_');          // 最終產生 'Udef_properties_' 效果
               paragraphLines.push(t);

               paragraphLines.push('</ImmarkusProperties>');
               paragraphLines.push('</ImmarkusBody>');
            });
         }
            
         // 2025-06-14: 使用者在 iiif image 加入的 metadata 已經呈現於 <xml_metadata> 區塊，在此就不需另外顯示了
         //// 2025-04-18: udefIiifImmarkusMetadata 的角色比較尷尬...
         ////             既然是 metadata，本應加在 <xml_metadata> 區塊
         ////             但由於 immarkus annotation 處理這些 metadata items 和 piece items 採相同結構，
         ////             且 Immarkus2D 必須考慮「將所有 pieces 包在一篇文件」和「每個 piece 視為一篇文件」
         ////             兩種狀況，因此將 udefIiifImmarkusMetadata 以 <Udef_IiifMetadata_...> 方式存放
         //// 加上 GlobalVar.udefIiifImmarkusMetadata[annotationManifestId] 的資訊
         //if (Array.isArray(GlobalVar.udefIiifImmarkusMetadata[annotationManifestId])) {
         //   paragraphLines.push('<ImmarkusIiifMetadata>');
         //   GlobalVar.udefIiifImmarkusMetadata[annotationManifestId].forEach(function(manifestAnnotation) {
         //      manifestAnnotation.forEach(function(b) {
         //         //alert(JSON.stringify(b));
         //         // 2024-04-28: iiif metadata 目前看到的欄位 @context, type, id, target, body
         //         let source = b.target.source || '-';
         //         let type = b.type || '-';
         //         let purpose = b.purpose || '-';
         //         t = '<Udef_IiifMetadata_Source>' + convertToLegalTagAttrValue(source) + '</Udef_IiifMetadata_Source>'
         //           + '<Udef_IiifMetadata_Type>' + convertToLegalTagAttrValue(type) + '</Udef_IiifMetadata_Type>'
         //           + '<Udef_IiifMetadata_Purpose>' + convertToLegalTagAttrValue(purpose) + '</Udef_IiifMetadata_Purpose>';
         //         paragraphLines.push(t);
         //         
         //         let obj = flatternBodyProperties("properties", b.body.properties);
         //         t = getFlatObjXml(obj, 'Udef_IiifMetadata_');
         //         paragraphLines.push(t);
         //      });
         //   });
         //   paragraphLines.push('</ImmarkusIiifMetadata>');          // 2025-04-22: bug fix
         //}
         
         paragraphLines.push("</ImmarkusObj>");
         paragraphLines.push('</Paragraph>');
         
         paragraphList.push(paragraphLines.join("\n"));
      });
      
      let docEventsXml = await convertImmarkusJsonAsEventsXml(isIiifImageObj, annotationJsonObj, immarkusJson, jsonFilename, jsonFilepath, selectorValueDict);
      
      let udefMetadataXml = udefMetadata.join("\n");
      let docContentXml = paragraphList.join("\n") + docEventsXml;

      // 2025-06-13: 一般 immarkus 的 metadata 是存放在 folder 下（每份 folder 一個 metadata 檔），
      //             但 iiif image 因為沒有自己的資料夾（Rainer 沒有將 iiif image 下載並另放一個資料夾），
      //             因此 iiif image 的 metadata 被另存在 GlobalVar.folderIiifAnnotationFileDict
      if (isIiifImageObj) {
         let manifestId = annotationJsonObj.immarkusManifestId;
         let iiifAnnotationObj = GlobalVar.folderIiifAnnotationFileDict[manifestId];
         //alert("YES!! " + manifestId + "\n" + JSON.stringify(GlobalVar.folderIiifAnnotationFileDict[manifestId]));
         docMetadataXml = iiifAnnotationObj.docMetadataXml;
         udefMetadataXml = iiifAnnotationObj.udefMetadataXml;
      } 

      // 2025-12-05: 將 folderHierarchy 加入 <compilation_name> 
      //             也需在 <xml_metadata> 下加入 <Udef_DocMeta_Compilation>，如此才能在 metadata area 顯示出來
      GlobalVar.metadataFieldLabelMap['compilation_name'] = 'Compilation';       // 與 COMMARKUS 相同，避免後續衝突
      let compilation = "<compilation_name>"
                      + folderHierarchy?.replace(/[\s]+/g,'_')          // 2025-12-12: 加上 ?. 防呆
                      + "</compilation_name>";
         
      docMetadataXml += "\n" + compilation;
      udefMetadataXml += "\n" + "<Udef_DocMeta_Compilation>" + folderHierarchy?.replace(/[\s]+/g,'_') + "</Udef_DocMeta_Compilation>";

      return [docMetadataXml, udefMetadataXml, docContentXml];
   }
   
   async function convertImmarkusJsonAsEventsXml(isIiifImageObj, annotationJsonObj, immarkusJson, jsonFilename, jsonFilepath, selectorValueDict) {
      // 注意：目前文件內文和 <Event> 下，都各有一份 <ImmarkusImage> 標記 -- 是否僅需要一份？
      // 問題：該將 immarkus 的每個 piece 標記視為事件，還是一整份 immarkus json 視為一個事件？
      //       => 目前先將一份 immarkus json 視為一個事件（否則一份文件可能包含很多事件，似乎
      //          並不適合給 EventRelLite 拿來應用）
      // 注意：這裡的 immarkusJson 已透過 convertImmarkusJson2Doc() 改變陣列第一項的值
      //alert("convertImmarkusJsonAsEventsXml\n" + JSON.stringify(annotationJsonObj));
      
      // 2025-06-25 (TODO)
      let eventLines = [];
      
      let eventType = 'immarkusMarkup';
      let t = '<Event Type="' + eventType + '">';
      eventLines.push(t);
      
      // 2025-04-05: <Paragraph> 下的 <ImmarkusImage> 是為了在文件上顯示圖像，
      //             <Event> 下的 <ImmarkusImage> 是為了「在轉換時利用 <img> 標籤檢查影像是否可被存取（網址是否正確）」
      if (!isIiifImageObj) {
         let imageFilepath = immarkusJson[0].imageFilepath;
         let imageFilename = immarkusJson[0].imageFilename;

         //let imageUrl = await window.parent.parent.getFileURLFromHandle(imageFilepath + "/" + imageFilename)
         let imageUrl = GlobalVar.imageUrlPath + imageFilepath + "/" + imageFilename;
         
         // 2025-05-22: (Brent) image blob url from DirHandle
         // 2026-03-30 加上 GlobalVar.forceBlobUrlUnderChromium 檢查（否則若第一次在 blob mode 選檔案夾，dirPickerReady 就會是 true）
         if (GlobalVar.dirPickerReady && GlobalVar.forceBlobUrlUnderChromium) {
            imageUrl = await window.parent.parent.getFileURLFromHandle(imageFilepath+ "/" + imageFilename);
            if (imageUrl === null) imageUrl = "I2D_FAIL_TO_FIND=" + imageFilepath+ "/" + imageFilename;     // 2025-05-28, 2026-03-29
         }

         // 2025-06-18: 移除 LocalUrl，改為 folderHierarchy
         let folderHierarchy = imageFilepath;
         t = getImmarkusImageTag('Generic', imageFilename, imageUrl, folderHierarchy, true);
         eventLines.push(t);
      }
      else {
         // iiif images
         // 應該只需檢查 annotationJsonObj.canvasImages 所計算出的 url 影像
         annotationJsonObj.canvasImages.forEach(function(canvasImage) {
            let { iiifImageUrl, imageKey, imageWidth, imageHeight, canvasAnnotation} = canvasImage;
            let folderHierarchy = 'NoFolderHierarchy';
            let t = getImmarkusImageTag('Iiif', imageKey, iiifImageUrl, folderHierarchy, GlobalVar.checkIiifImageOnConverting, imageWidth, imageHeight);
            if (GlobalVar.autoDownloadIiifImages) downloadIiifImage(iiifImageUrl, imageKey);        // 2025-04-17: 先前不知為何被移除了？
            eventLines.push(t);
         });
      }
      
      // 2025-05-27
      if (GlobalVar.hideimageCheckSummary) $("#imageCheckSummary").hide();

      // 2024-06-25: 略去 selectorType 和 selectorValue
      //let selectorType = v.target.selector.type;
      //let selectorValue = v.target.selector.value;
      
      // 2024-06-25: 與 paragraph 轉換相較，在此也略去 <ImmarkusBody>, <ImmarkusProperties>
      //       <Udef_name_of_layer>body[0]['name of layer']</Udef_name_of_layer>
      //       <Udef_date_dynasty>body[0]['date dynasty']</Udef_date_dynasty>
      //       <Udef_thickness_value>body[0]['thickness'].value</Udef_thickness_value>
      //       <Udef_thickness_unit>body[0]['thickness'].value</Udef_thickness_unit>

      // (code)
      immarkusJson.forEach(function(v, idx) {        // v 為一個 piece 的數據（轉換成一個 paragraph）
         // 2025-04-26: 若 v 為 metadata 而非 piece annotation，則必須移除（不應產生 ImmarkusPiece）
         // 2026-01-21: 先前（逆向工程猜測）沒有 creator 表示它是 metadata，但現在發現 newly added AI auto-transcribing has no creator field! 必須加上 v.body 判斷是否為陣列
         if (!v.created && !v.creator && !Array.isArray(v.body)) return;       // 若 v.body 非陣列，就「應該」是 metadata
      
         // 2024-06-26: 從 ImmarkusShape 提取 selector 資訊（Event 中加上 ImmarkusPieceShape 
         //             以方便應用程式 highlight 出 piece 位置）
         let selectorValue = selectorValueDict[idx];
         
         // 2024-10-21: 注意，有些 json 的 piece 並沒有 selector...
         // 2025-05-26: 加入 pieceType -- 不同的 pieceType 可在 EventConnectionGraph 的 C-node 套用不同顏色節點
         let pieceType = 'Generic';
         let t = '<ImmarkusPiece Type="' + pieceType + '" ImmarkusId="' 
               + convertToLegalTagAttrValue(v.id) + '"'
               + ' Key="piece:' + idx + '"'
               + '>';
         eventLines.push(t);
         GlobalVar.immarkusIdDict[v.id] = { tagType: 'ImmarkusPiece' };        // 2024-12-23

         // 2025-04-26: 輸出 <ImmarkusPieceShape> -- 正常狀況下，可以預期該有 selector
         if (selectorValue) {
            t = '<ImmarkusPieceShape '
              + ' SelectorValue="' + convertToLegalTagAttrValue(selectorValue) + '"'
              + '/>';
            eventLines.push(t);
         }

         // 2025-04-26: 輸出 <ImmarkusPieceProperties>
         if (v.body) {                // 防呆... 有可能是 undefined
            let body = v.body;
            
            if (!Array.isArray(body)) {    // 2026-01-21: 非陣列，表示它是 metadata 欄位！
               // body = [body];           // 唉，按理說應該總是陣列...
               return;                     // 2026-01-21 跳過非陣列的 body
            }
            
            body.forEach(function(b, bidx) {                   // v.body 是個陣列，"...Iva/REPORTS/book reports/Changsha/图一五九.json" 的 v.body 有包含兩項
               // 注意，LayerDelimiter 為 "//"，執行 flatternBodyProperties() 後
               // obj := {"properties//ID":"dunhua_neicheng",
               //         "properties//name":"内城Qc",
               //         "properties//materials":"earth",
               //         "properties//location_0":"43.369",        // 緯度，y 座標！
               //         "properties//location_1":"128.22528",     // 經度，x 座標！
               //         "properties//date start":"1115 CE",
               //         "properties//date end":"1234 CE",
               //         "properties//date dynasty":"金",
               //         "properties//inference":"abandonment",
               //         "properties//part of main object//instance":"dunhua_cheng",
               //         "properties//part of main object//type":"city_wall"
               //        }
               // piecePropertiesXml :=
               //    <div>properties/ID: <Udef_properties_ID>dunhua_neicheng</Udef_properties_ID></div>
               //    <div>properties/name: <Udef_properties_name>内城Qc</Udef_properties_name></div>
               //    ...
            
               // 2025-03-31: 跳過 undefined b.properties 以避免產生空的 ImmarkusPieceProperties（似乎有許多 b.properties 都是 undefined？）
               if (b.properties === undefined) return;
               //alert(JSON.stringify(b.properties));
            
               // b.properties 應該是一個 object，例如 {"id":"changhua_xian","name":"昌化縣","tgaz":"hvd_346"}
               // 或 {"name":"harvest festival","description_in_image":"每遇歲時伏蠟會衆烹宰酒飲以竹筒食以木酌醉飽後擊鼓鳴鑼跳舞快樂盡日乃散"}
               let obj = flatternBodyProperties("properties", b.properties);
               let piecePropertiesXml = getFlatObjXml(obj, 'Udef_');
               
               // (TODO),(TEST): 從 obj 階層，試試看將第二層後的值串接起來，是否可變成較可讀的 cue...
               // 例如，或可對 properties//part of main object 串接出 "dunhua_cheng,city_wall" 這樣的 cue
               // 或者，「手動對特定標籤設定串接的規則」，將 "part of main object" 的子節點以 
               // type+instance 方式串接成 "city_wall,dunhua_cheng"
               // 目前僅是實驗性質，將 "part of main object" 的 "type" 與 "instance" 用 '/' 串接起來（似乎不能用 ','... XA 後分類好像有特殊用途）
               // 2025-01-21: 加上 <ImmarkusPieceProperties>
               let w = getCustomizedUdefCombinationList(piecePropertiesXml);
               piecePropertiesXml += w;
            
               t = `<ImmarkusPieceProperties bodyIdx="${bidx}">${piecePropertiesXml}</ImmarkusPieceProperties>`;
               eventLines.push(t);
               
               // 2025-03-12: 加上 <ImmarkusExtraTags> -- 將每份 piece property 以 <Udef_PieceTreePath> 彙整起來放在此標籤下
               // 2025-06-19: 原先是直接用 name, obj 產生 Udef_PieceTreePath，改用 piecePropertiesXml 產生
               //             => 若 getFlatObjXml() 有將 location_0, locaion_1 整併為 Location，在此就可直接取得整併值
               // 2025-11-17: 由於 IMMARKUS data 頗為雜亂（不知該如何整合應用），目前 XA 和 viz tool 都沒有用到 <ImmarkusExtraTags> 的資料
               if (GlobalVar.addPropertyTree) {
                  let list = [];
                  let tagName = 'Udef_PieceTreePath';
                  // 直接用 $("<div/>").append(piecePropertiesXml) 會將標籤都轉為全小寫，因此用 $.parseXML() 處理
                  let xmlStr = "<root>" + piecePropertiesXml + "</root>";
                  let xmlDoc = $.parseXML(xmlStr);
                  let jqProperties = $(xmlDoc);
                  jqProperties.find("div").children().each(function() {
                     let innerTagName = $(this).prop("tagName");
                     let innerTagVal = $(this).text();                                  // 注意，可能會有 "http://xxx/yyy?a&b" 之類的字串！
                     if (innerTagVal.indexOf('://') > 0) {                              // 2025-07-31
                        innerTagVal = innerTagVal.replace(/[\/]/g,'%2f;');
                     }
                     let t = convertToLegalTagValue(innerTagName + '/' + innerTagVal);  // 2025-06-20: 需進行編碼處理...
                     let s = "<" + tagName + ">" + t + "</" + tagName + ">";
                     list.push(s);
                     GlobalVar.udefTagsDict[tagName] = 1;
                     
                     // 2025-07-31: 加上 Udef_PieceTreePath.GenreL{n} 以方便 XA 在顯示 property tree 的節點時，計算該節點的文件數
                     //             注意： Udef_properties_material.1/earth/dirt 會有 .GenreL2
                     //                    x/y/z 僅需 L1 和 L2（<Udef_PieceTreePath> 的值就是完整的 x/y/z）
                     //             => 加上這些標籤後，檔案會增大許多... (e.g., Iva 樣本 3.8MB 變成 4.4MB, Sunkyu 樣本 4.99MB 變成 5.48MB)
                     if (GlobalVar.addPropertyTreeWithGenreLevel) {
                        let existedTagVal = {};
                        let parts = t.split('/');
                        for (let i=0; i<parts.length-1; i++) {             // L{n} 的層級僅需到 parts.length-1
                           let genreTag = tagName + '.GenreL' + (i+1);
                           let val = parts.slice(0, i+1).join('/');
                           let s = "<" + genreTag + ">" + val + "</" + genreTag + ">";
                           if (!existedTagVal[val]) {
                              existedTagVal[val] = 1;
                              list.push(s);
                              GlobalVar.udefTagsDict[genreTag] = 1;
                           }
                        }
                     }
                  });
                  
                  //for (let name in obj) {
                  //   let parts = name.split(LayerDelimiter);
                  //   if (!obj[name]) {                                        // 注意：Iva 的樣本中，有許多 obj[name] 都是空值！
                  //      console.log(name + ' --- has empty value!');
                  //      continue;
                  //   }
                  //   parts.push(obj[name]);                                   // 加上葉節點的值
                  //   parts.shift();                                           // 移除最前方的 'properties'
                  //   let tagVal = parts.join('/');
                  //   let t = convertToLegalTagValue(tagVal);
                  //   
                  //   let s = "<" + tagName + ">" + t + "</" + tagName + ">";
                  //   list.push(s);
                  //   GlobalVar.udefTagsDict[tagName] = 1;
                  //}
                  //alert(JSON.stringify(list));
                  
                  let wrapperTag = 'ImmarkusExtraTags';
                  t = `<${wrapperTag} bodyIdx="${bidx}">`
                    + list.join("\n")
                    + `</${wrapperTag}>`;
                  eventLines.push(t);
                  
               }
            });
         }
         
         eventLines.push("</ImmarkusPiece>");
      });
         
      eventLines.push('</Event>');
      
      t = "<Events>" + eventLines.join("\n") + "</Events>";
      //console.log(t);
      return t;
   }
   
   function getCustomizedUdefCombinationList(piecePropertiesXml) {
      // 2025-04-04
      // 透過 jquery 從 piecePropertiesXml 取出特定的 tags 內容，對其進行串接
      // 註：對 tags 進行操作（而非對轉成 xml 前的 obj 操作），雖需較多運算，但維護上應該比較有彈性
      // piecePropertiesXml :=
      //    <div>properties/ID: <Udef_properties_ID>dunhua_neicheng</Udef_properties_ID></div>
      //    <div>properties/name: <Udef_properties_name>内城Qc</Udef_properties_name></div>
      //    ...
      // 注意：還需設定 GlobalVar.udefTagsDict[tagName]=1
      // GlobalVar.customizedUdefCombinationList
      
      let concatenatedXmlList = [];
      let jqTempXml = $("<div/>").append(piecePropertiesXml);
      
      GlobalVar.customizedUdefCombinationList.forEach(function(udefCombination) {
         let { type, newTag, tagsToConcatenate, span, digits } = udefCombination;
         let tagValList = [];
         let hasValue = false;
         if (type == 'general') {
            tagsToConcatenate.forEach(function(tag) {
               if (tag.length <= 1) {
                  // tag 為 delimiter
                  tagValList.push(tag);
               }
               else {
                  //alert(tag + "\n" + jqTempXml.html());
                  // 2025-02-28: 注意 selector 必須 escape '.' （在前方加上反斜線，但需注意程式是需寫兩個反斜線），否則 jquery selector 會錯以為是 class
                  let selector = tag.replace(/[\.]/g,'\\.');
                  jqTempXml.find(selector).each(function() {         // 呃... 目前先假設一定找得到 tag（沒有加上防呆）
                     hasValue = true;
                     tagValList.push($(this).text());
                  });
               }
            });
         }
         else if (type == 'year') {
            // 2025-02-24
            if (!Number.isInteger(span)) {
               alert("Parameter 'span' must be an integer: " + span);
               return;
            }
            if (!Number.isInteger(digits)) digits = 4;
            
            tagsToConcatenate.forEach(function(tag) {
               let yearRange;
               if (tag.length <= 1) tagValList.push(tag);
               else {
                  let selector = tag.replace(/[\.]/g,'\\.');
                  jqTempXml.find(selector).each(function() {
                     let v = $(this).text();
                     let adYear = -9999;
                     let matches = v.match(/(\d+)\s*(BCE|CE)*/);
                     if (matches !== null) {
                        adYear = parseInt(matches[1]);
                        if (matches[2] === 'BCE') adYear = -adYear;        // 沒有西元零年（year = 0）
                     }
                     else {
                        adYear = parseInt(v);                              // parseInt("12x3") = 12
                        if (isNaN(adYear)) yearRange = 'Unknown';          // parseInt("-") = NaN
                     }
                     
                     // 將 adYear 換成範圍
                     if (yearRange === undefined) {
                        if (adYear !== 9999 && adYear !== -9999) {
                           let periodStart = Math.floor(adYear / span) * span;
                           let periodEnd = periodStart + span - 1;
                           let rangeDelimiter = '-';                    // '-' or '~'
                           // 注意："-123".padStart(5,0) = "0-123" 而不是 "-0123"
                           let yearRangeFrom = Math.abs(periodStart).toString().padStart(digits,'0');
                           if (periodStart < 0) yearRangeFrom = '-' + yearRangeFrom;
                           let yearRangeTo = Math.abs(periodEnd).toString().padStart(digits,'0');
                           if (periodEnd < 0) yearRangeTo = '-' + yearRangeTo;
                           yearRange = yearRangeFrom + rangeDelimiter + yearRangeTo;
                        }
                     }
                     tagValList.push(yearRange);
                     hasValue = true;
                  });
               }
            });   // tagsToConcatenate.forEach()
         }
         else alert("Unknown customizedUdefCombinationList type: " + type);

         if (hasValue) {
            // 2025-03-03: 原先是僅輸出 <Udef_Extra_Y010>1110-1119</Udef_Extra_Y010>，現將其放入 <div class="extra"> 標籤
            GlobalVar.udefTagsDict[newTag] = 1;
            let s = '<' + newTag + '>' + tagValList.join('') + '</' + newTag + '>';
            let t = (type == 'year') ? "Period" : "Combination";
            s = "<div class='extra'>" + t + "/" + newTag.split('_').pop() + ": " + s + "</div>";
            concatenatedXmlList.push(s);
         }
      });
      
      let ret = concatenatedXmlList.join('\n');
      //alert(ret);
      
      return ret;
   }
   
   function flatternBodyProperties(objName, objVal) {
      // input: an object possibly multiple layers
      // output: an object with only one layer (layer name is a concated string of the path)
      // 注意：需 recursively 串接所有節點的屬性名稱...
      let retObj = {};
      let objType = typeof(objVal);
      if (objVal === undefined) ;          // 2025-04-19: 沒有定義值，需避免產生 <Udef_properties>-</Udef_properties> 這樣沒什麼意思的標籤
      else if (objType !== 'object') {
         // 假設不為 object 就是基本的變數型態（假設 immarkus json 不包含 'function' 的變數型態）
         let varName = (objName);          // 2024-04-30: 在此不進行 convertImmarkusVarToTagName() -- 延遲到最後再處理
         let varVal = convertToLegalTagValue(objVal);
         varVal = varVal.replace(/ /g, '.');             // 2025-06-17: 將空白置換為 '.'
         retObj[varName] = varVal;
      }
      else {     // array or normal object
         let curVarVal = null;
         let curTagName = null;
         let flatObj = null;
         if (Array.isArray(objVal)) {
            objVal.forEach(function(v, idx) {
               curVarVal = v;
               curTagName = (objName + ImmarkusTagSuffixDelimiter + idx);    // 2025-02-21: 用特殊符號 '__' 以資識別（原先是用 '_'，易跟 'Udef_' 之類的底線混在一起）
               flatObj = flatternBodyProperties(curTagName, curVarVal);
               for (let k in flatObj) retObj[k] = flatObj[k];
            });
         }
         else {
            for (let name in objVal) {
               curVarVal = objVal[name];
               curTagName = (objName + LayerDelimiter + name);    // 2024-04-30: 在此不進行 convertImmarkusVarToTagName() -- 延遲到最後再處理
               flatObj = flatternBodyProperties(curTagName, curVarVal);
               for (let k in flatObj) retObj[k] = flatObj[k];
            }
         }
      }
      
      // 2025-06-06: 特別處理 TGAZ 部分 -- 注意在此還沒加上 Udef_ 前綴
      let tgazKey = 'properties' + LayerDelimiter + 'TGAZ';
      if (retObj[tgazKey]) retObj[tgazKey] = retObj[tgazKey].split('/').pop();
      
      return retObj;
   }
   
   function getFlatObjXml(obj, prefix) {
      // TODO: 將 location_0, location_1 彙整成 location （location_0,location_1）
      let list = [];
      let fieldsLocation = [ 'properties//location_0',
                             'properties//location_1',
                           ];
      let locationHash = {};
      
      for (let name in obj) {
         let fieldVal = obj[name].trim();

         // 2025-06-19: todo todo todo
         if (GlobalVar.mergeSplitFields) {
            if (fieldsLocation.includes(name)) {               // 2025-06-19
               locationHash[name] = fieldVal;                  // 將個別項目收集起來，迴圈後一併處理
               continue;                                       // 避免產生 <Udef_Evt_LOCATION_0> 這種標籤
            }
            //else if 
         }
       
         // 2026-07-05: 據 2026-06-15 Dawn 的要求進行補丁 -- 將所有 "properties//texture//0" 之類通通置換成 "properties//texture"
         GlobalVar.omitUdefPropertiesTagSubscript.forEach(function(tagWithoutSubscript) {
            if (name.startsWith(tagWithoutSubscript)) name = tagWithoutSubscript;
         });
         
         let s = genFieldTag(name, fieldVal, prefix);          // 包含 html event 區塊顯示所需的 <div>
         list.push(s);
      }
      
      // 2025-06-19: todo todo todo
      // TODO: 類似 setCustomizedUdefCombination()，將多個欄位整併成一個標籤
      // 注意：Udef_PieceTreePath 會以回傳值為基礎，因此不需在此額外處理
      if (GlobalVar.mergeSplitFields) {
         //{ type: 'general',
         //  newTag: 'Udef_Extra_width_height',
         //  tagsToConcatenate: ['W', 'Udef_properties_width_value', 'Udef_properties_width_unit', '_',    // 呃，後分類 cue 不能用逗點、分號或冒號...
         //                      'H', 'Udef_properties_height_value', 'Udef_properties_height_unit'],
         //},
         if (Object.keys(locationHash).length > 0) {
            // Udef_properties_Location
            let tagName = prefix + 'properties_Location';      // 將 location_0, location_1 整併為 Location （注意 'L' 大寫以資區別）
            let dispName = tagName;
            let t = locationHash['properties//location_0'] + ',' + locationHash['properties//location_1'];
            let xy = locationHash['properties//location_1'] + ',' + locationHash['properties//location_0'];    // 2026-05-02
            let s = "<" + tagName + " RefId='xy=" + xy + "'>" + t + "</" + tagName + ">";     // 注意，t 是 "y,x" format
            let fieldTag = '<div>' + dispName + ': ' + s + '</div>'
            GlobalVar.udefTagsDict[tagName] = 1;
            list.push(fieldTag);
         }
         
      }
      
      //alert(JSON.stringify(locationHash));
      
      // ----- supporting function -----
      function genFieldTag(name, val, prefix) {
         // e.g., name:= 'properties//materials', 'properties//location_0', etc.
         let dispName = name.replace(new RegExp(LayerDelimiter,'g'), '/')
                            .replace(/\s/g, WhiteSpaceSymbol);              // 2025-06-19: 加上「將空白轉為 WhiteSpaceSymbol」（與標籤處理空白的方式一致）
         let tagName = prefix + name.replace(new RegExp(LayerDelimiter,'g'), '_');
         tagName = convertImmarkusVarToTagName(tagName);

         // 2025-11-25: 竟然會出現 tagName 為 'Language.' 這樣的狀況！ 為了防呆並簡化，將最後的 '.' 換成 '_'
         //             注意，在 <div> 中顯示仍然包含 '.'，例如
         //             <div>
         //                properties/Language.:
         //                <Udef_properties_Language>Chinese</Udef_properties_Language>
         //             </div>
         //if (tagName.endsWith('.')) tagName = tagName.slice(0, -1) + '_';     // remove the last character '.' and append '_' -- 相當於將最後的 '.' 換成 '_';
         tagName = tagName.replace(/[:\.]/g, '_');            // 將 ':' 和 '.' 都換成 '_'，如此後續 jquery 才較好處理
                     
         let t = convertToLegalTagValue(val) || '-';          // 2024-11-01: 若為空值，就轉為 '-' 輸出
         
         // 2025-07-22: 避免出現 '/'
         if (t.indexOf('http') < 0) {                         // 非 url 才需進行取代（假設後續 XA 等工具，也會依照 url prefix 進行判讀）
            t = replaceTagHierarchyDelimieter(t);
         }
         
         let s = "<" + tagName + ">" + t + "</" + tagName + ">";
         let fieldTag = '<div>' + dispName + ': ' + s + '</div>'
         
         GlobalVar.udefTagsDict[tagName] = 1;
         return fieldTag;
      }
      
      return list.join("\n");
   }
   
   function getImmarkusImageTag(imageType, imageFilename, imageUrl, folderHierarchy, checkImage = false, imageWidth = 0, imageHeight = 0) {
      //alert(imageFilename + " -- invoke: " + checkImage);
      // 2025-01-31: document 會產生兩份 <ImmarkusImage>，但只需檢查 checkImage 一次
      //             => paragraph 部分不檢查 checkImageAccessibility，只有 events 才檢查
      // 2024-10-21: (TODO) 這裡的 url path 可能需再多考量...
      // 2025-06-10: 加上 Type 'Generic', 'Iiif'
      
      if (!imageUrl) imageUrl = "null-possibly_due_to_CORS_issues";    // 2026-01-17: 如果因 CORS 或其他問題，imageUrl 可能會是 null

      let s = '';
      if (imageType == 'Iiif') {
         s = '" Width="' + imageWidth                         // 必須額外輸出「原始」的 width, height
           + '" Height="' + imageHeight;
      }
      
      let t = '<ImmarkusImage Type="' + imageType
            + '" Url="' + imageUrl
            + s
            + '" FolderHierarchy="' + folderHierarchy
            + '" Filename="' + imageFilename                  // 2025-06-22: 加上 Filename 屬性，方便後續藉由此屬性提取 FolderHierarchy
            + '">'
            + imageFilename
            + '</ImmarkusImage>';
        
      // 2025-01-31: 利用 <img src="${imageUrl}/> 偵測是否可透過 url 存取到圖檔...
      // 2025-05-22: 由於只有 Chrome/Edge 支援 File System Access API，在 Chrome/Edge 下 image src 會轉成 blob:xxx 形式
      //             因此，只在 local mode 和 Firefox 模式下，才進行影像檢查
      if (checkImage) {    // && (InXmarkusLocalMode && BrowserType == 'Firefox')) {      // 2025-05-21: 僅在 local mode 或 Firefox 下才檢查...
         // 2025-01-31: 原先因 finishReadingDirFiles() 被重覆呼叫，導致 url 重覆
         GlobalVar.imageAccessibilityCheck.urlHashToCheck[imageUrl] = 1;
         checkImageAccessibility(imageUrl);
      }
      
      return t;
   }
   
   function downloadIiifImage(imageUrl, imageFilenameMainPart) {
      // 2025-04-01
      let origImageFilename = imageUrl.split('/').pop();                // 通常是 native.jpg 之類
      let imageFileType = origImageFilename.split('.').pop();           // e.g., jpg
      let downloadFilename = imageFilenameMainPart + '.' + imageFileType;
      
      // 以下參考 ChatGPT -- 若沒 ChatGPT，要自己上網或翻書找出這種方法，應該頗費時吧...
      // 注意：不能直接使用 document.createElement('a') 來下載（不允許在被別的網站嵌入時，讓 Firefox 顯示頁面內容）...
      //       採用 ChatGPT 建議的 fetch() 方法獲取圖片的內容，就不需將 <a> 標籤顯示在頁面上，且不會引起頁面顯示問題
      fetch(imageUrl).then(response => response.blob())  // 將圖片內容轉換為 Blob
                     .then(blob => {
                        // 創建一個指向該 Blob 的 URL
                        const url = URL.createObjectURL(blob);
                        
                        // 創建一個隱藏的<a>元素來觸發下載
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = downloadFilename;
                        
                        // 觸發下載
                        a.click();
                        
                        // 下載完成後釋放 Blob URL
                        URL.revokeObjectURL(url);
                     })
                     .catch(error => {
                        console.error('下載圖片時出錯:', error);
                     });
    }
   
   function scrollToElementId(elementId, time = 2000) {
      $([document.documentElement, document.body]).animate({
         scrollTop: $('#' + elementId).offset().top
      }, time);
   }
   
   
   function checkImageAccessibility(url) {
      var img = new Image();  // 創建新的 Image 對象

      // (TODO) 或許需要透過 GlobalVar.imgMsgNum 檢查是否所有檔案皆已經過加載測試？
      // 設置加載成功的處理
      img.onload = function() {
         let msgId = 'imgMsg_' + GlobalVar.imgMsgNum++;
         if (GlobalVar.showImageCheckPassedItems) {
            let msg = "<li id='" + msgId + "' class='imageAccess imageAccessPass'>" + url + "</li>";
            $("#imageCheckItems").append(msg);
         }
         GlobalVar.imageAccessibilityCheck.urlPassHash[url] = 1;

         // 2025-03-13: 將捲軸捲動到底部 https://stackoverflow.com/questions/10503606/scroll-to-bottom-of-div-on-page-load-jquery
         if (GlobalVar.enableAutoScrollImageCheck) {
            $('#importInfo').scrollTop($('#importInfo').prop("scrollHeight"));
         }
         
         // 2025-03-14
         let successCount = parseInt($("#imageSuccessCount").text()) + 1;
         $("#imageSuccessCount").text(successCount);
      };

      // 設置加載失敗的處理
      img.onerror = function() {
         // 確認加載失敗所需的時間，往往比加載成功的時間還要長...
         // 在 FF 中，似乎會延遲一陣子才一次執行多個 onerror 事件？
         // 例如，Iva 的 "吐列毛杜二号古城􀀱 􀀱􀀱 号台基平剖面.png" 中間包含數個無法辨識的字元，就會導致無法加載...
         // 又如，"frst tier images/江苏扬州宋大城北门水门遗址发掘简报" 下的 "图三北壁剖面.json" 有提到 "图三北壁剖面.png" 但找不到檔案
         let msgId = 'imgMsg_' + GlobalVar.imgMsgNum++;
         let msg = "<li id='" + msgId + "' class='imageAccess imageAccessFail'>" + url + "</li>";
         $("#imageCheckItems").append(msg)
         GlobalVar.imageAccessibilityCheck.urlFailHash[url] = 1;

         // 2025-03-13: 將捲軸捲動到底部
         if (GlobalVar.enableAutoScrollImageCheck) {
            $('#importInfo').scrollTop($('#importInfo').prop("scrollHeight"));
         }

         // 2025-03-14
         let failCount = parseInt($("#imageFailCount").text()) + 1;
         $("#imageFailCount").text(failCount);
         
         // 2025-06-07
         if (failCount > 0) {
            $("#imageCheckInfoHeading").text("Failed");
            $("#imageCheckBlock").show();
         }
      };

      // 設置圖片的 URL，觸發加載
      img.src = url;
    }

   function showProgressMsg(msg) {
      if (msg) {
         $("#divLoadingContainer").css({top:'30%', left:'40%'}).show();
         $("#divWorkingProgress").text(msg.substring(0,10));    // max 10 characters
      }
   }
   
   function hideProgressMsg() {
      $("#divLoadingContainer").hide();
   }
   
   // -------------------------------------------------------------------------------------------
   
   function switchWorkingMode(mode = 'blobUrl') {
      // 2025-12-30
      if (mode == 'blobUrl') {
         // 顯示「較為單純」的 xmarkusFolderNoteSelectFolderTwice 介面時，表示 forceBlobUrlUnderChromium 為 true
         GlobalVar.forceBlobUrlUnderChromium = true;
         $("div.selectExportsBox").css({height:'140px'});
         $("#xmarkusFolderNoteUnderSpecificFolder").hide();
         $("#xmarkusFolderNoteSelectFolderTwice").show();
         $("div.useWebProtocol").hide();
         if (GlobalVar.curWorkingMode != mode && ['Chrome','Edge'].includes(BrowserType)) {
            alert("Switch to blob URL mode\n" + 
                  "Now Immarkus2D will convert the newly added folder images to blob URLs");
         }
      }
      else if (mode == 'normalUrl') {
         // 顯示「較為複雜」的 xmarkusFolderNoteUnderSpecificFolder 介面時，表示 forceBlobUrlUnderChromium 為 false
         GlobalVar.forceBlobUrlUnderChromium = false;
         $("div.selectExportsBox").css({height:'176px'});
         $("#xmarkusFolderNoteSelectFolderTwice").hide();
         $("#xmarkusFolderNoteUnderSpecificFolder").show();
         $("div.useWebProtocol").show();
         if (GlobalVar.curWorkingMode != mode && ['Chrome','Edge'].includes(BrowserType)) {
            alert("Switch to advanced mode\n" + 
                  "Now Immarkus2D will convert the newly added folder images to standard URLs\n" +
                  "NOTE: You will need a Web server to access images via standard URLs");
         }

         // 2026-06-13: bug fix -- normalUrl 採用 $("#imageUrlPrefix") input box 內容作為 GlobalVar.imageUrlPath
         let s = $("#imageUrlPrefix").val().trim();
         if (s != '') {
            if (s.slice(-1) != '/') s += '/';               // 最後一個字元若非 '/'，則補上 '/'
            GlobalVar.imageUrlPath = s;
         }
      }
      else {
         alert("Unknown mode: " + GlobalVar.curWorkingMode);
         return;
      }
      
      GlobalVar.curWorkingMode = mode;
   }
   
   // -------------------------------------------------------------------------------------------
   
   function refreshCorpusDisplay() {
      // 舊版較為複雜的訊息（已隱藏）
      let lines = [];
      for (var corpusTitle in GlobalVar.corpusDataDict) {
         lines.push(corpusTitle + ": " + GlobalVar.corpusDataDict[corpusTitle].length);
      }
      let s = lines.join("\n");
      $("#corpusesImported").val(s);
      
      // 2025-06-07: 僅顯示最終的匯入檔案數（IMMARKUS 影像數）
      lines = [];
      for (var corpusTitle in GlobalVar.corpusDataDict) {      // 雖然目前應只會有單一文獻集...
         lines.push(GlobalVar.corpusDataDict[corpusTitle].length);
      }
      s = lines.join(';');
      $("#spanImportedCorpusFiles").text(s);
      $("#trImportedInfo").show();
      $("#butSelectImmarkusFolder").addClass("disabled");       // 不能從原先的按鈕接續下一份 batch
   }

   // -----------------------------------------------------------------------------

   // e.g., let divContentId = showDivHtml(evt, top, left, 600, 400, "TEST", contentHtml);
   var showDivHtml = function(evt, top, left, width, height, title, contentHtml) {
      let timestamp = (new Date()).getTime();
      let subwinContainerId = "subwinContainer_" + timestamp;       // 2025-03-08
      let divContentId = "divContent_" + timestamp;           // 2025-03-08
      let titleBarId = "titleBar_" + timestamp;
      
      // fa-window-close, fa-times, fa-times-circle
      // style='text-align:center; padding:2px 4px; background-color:#BFBFBF; color:black; cursor:pointer;
      let divHtml = "<div id='" + subwinContainerId + "' class='sub-window' style='display:none; top:" + (top) + "px; left:" + (left) + "px; width:" + (width+4) + "px; height:" + (height+24) + "px; z-index:" + (GlobalVar.subwinZindex++) + "'>"
                  + "<table id='" + titleBarId + "' class='titleBar' width='100%' cellpadding='0' cellspacing='0'>"
                  + "<tr class='x-sub-window-title-bar-xmarkus' style='width:" + width + "px; padding-right:5px;'>" 
                  + "<td align='left' class='sub-window-title-bar-xmarkus' style='color:white; padding:3px 8px; border-top-left-radius:10px;'>" + title + "</td>"
                  + "<td align='right' class='sub-window-title-bar-xmarkus' valign='top' width='75' style='border-top-right-radius:10px;'>" 
                  //+ "<span class='extendSubwinContainer' style='padding-right:8px; cursor:pointer;' x-containerId='" + subwinContainerId + "'><i class='fa-solid fa-window-maximize' style='font-size:1.3em; padding-top:6px;'></i></span>"       // <i class='fas fa-external-link-alt'></i>
                  //+ "<span class='restoreSubwinContainer' style='display:none; padding-right:8px; cursor:pointer;' x-containerId='" + subwinContainerId + "'><i class='fa-solid fa-window-restore' style='font-size:1.3em; padding-top:6px;'></i></span>"       
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
         $("#overlay").hide();
      });

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

      let leftOffset = 10, topOffset = 10;

      //// 2023-07-02
      //if (!evt.originalEvent) {                                   // 2023-06-28: 非「原生驅動」，使用者動作所觸發的事件
      //   let cnt = $("#subwinArea div.sub-window").length;           // 注意：div.sub-window 內可以是 iframe 或 div
      //   leftOffset += cnt * 20 - 30;
      //   topOffset  += cnt * 20 - 45;
      //}

      // 2025-03-05: 已透過 dragOption，加上「防止拖曳超過視窗」的防呆機制...
      jqSubwinContainer.show()                           //.fadeIn(800)
                       .draggable(dragOption)
                       .resizable(resizeOption);          // 2024-11-12: 需引入 jquery-ui.min.css，否則會無效
                       //.position({ my:"left+" + leftOffset + " top+" + topOffset, 
                       //            at:"center bottom", 
                       //            of:evt,
                       //            collision:"fit"});
   }
   
   // ------------------------
   //        utilities
   // ------------------------

   Date.prototype.yyyymmdd = function() {       // Tu: copied from Web
     var mm = this.getMonth() + 1;              // getMonth() is zero-based
     var dd = this.getDate();
     return this.getFullYear() + ('0'+mm).substr(-2) + ('0'+dd).substr(-2);  // padding
   }
   
   function detectBrowser() {
      const ua = navigator.userAgent;
      if (ua.includes("Firefox")) return "Firefox";
      if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) return "Chrome";
      if (ua.includes("Edg")) return "Edge";
      if (ua.includes("OPR")) return "Opera";
      return "Other";
   }

   function convertImmarkusVarToTagName(s) {
      let t = s.replace(/\s/g, WhiteSpaceSymbol);           // 將 whitespace 取代成 WhiteSpaceSymbol
      return convertToLegalTagName(t);
   }
   
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
      // 先暫時假設 IMMARKUS 的 json 輸出，都會是合法的標籤屬性名稱字元...
      return s;
   }

   function convertToLegalTagAttrValue(s) {
      // 2024-04-29
      //let t = $('<span/>').attr('title',s).prop('outerHTML');
      //t = t.match(/title="(.*)"/)[1];
      if (!s) s = 'NULL';                     // 防呆
      let t = s.toString()
               .replace(/&/g, '&amp;')        // This MUST be the 1st replacement
               .replace(/'/g, '&apos;')       // The 4 other predefined entities, required.
               .replace(/"/g, '&quot;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
      return t;
   }
   
   function convertToLegalTagValue(s) {
     return $('<div/>').html(s).html();
   }
      
   function replaceTagHierarchyDelimieter(s, replaceTo='_') {
      // 與 Comarkus2D 同步，加上 replaceTagHierarchyDelimieter()
      // 2025-07-22: 避免 s 中出現代表層級的 '/'（將它置換為 '_'）
      //             例如，Sichuan_Road 檔案中會出現 "三之一" 被標記為 "markus_+1/3" 的狀況...
      if (!s) return '';                // 注意有時 s 會是 undefined！
      return s.replace(/[\/]/g, replaceTo);
   }
   
   function htmlEncode(value) {
     //create a in-memory div, set it's inner text(which jQuery automatically encodes)
     //then grab the encoded contents back out.  The div never exists on the page.
     return $('<div/>').text(value).html();
   }
   
   function htmlDecode(value) {
     return $('<div/>').html(value).text();
   }
   
   // 2024-10-24: 防呆用
   function convertToLegalDocuFilename(s) {
      let filename = s.replace(/[\s\+\-\*\/\\:,;@%^!\'\"\?~\|]+/g, '_')
                      .replace(/[\{\[\<]/g, '(')
                      .replace(/[\}\]\>]/g, ')');
      return filename;
   }
   
   // 2025-04-25
   function getReadableJson(obj) {
      return JSON.stringify(obj, null, 2);
   }
   
   // 2026-04-15
   function reportError(filename, errType, errMsg) {
      if (!GlobalVar.errorReported[filename]) {
         GlobalVar.errorReported[filename] = {};
         if (!GlobalVar.errorReported[filename][errMsg]) {
            GlobalVar.errorReported[filename][errMsg] = 1;
            let msg = errType + ": " + errMsg + "\n" + filename;
            alert(msg);
            console.log(msg);
         }
      }
   }
   
   // --------------------------------------------------------------------------

   function doPostMessage(sourceTool, targetTool, xmlStr) {   
      // 2025-01-31
      //if (InXmarkusLocalMode) {
         // 傳遞到最 top 的 XmarkusPlatform.html
         // (1). XmarkusPlatform.html 引入 iframe XmarkusPlatform-Converting.html
         // (2). XmarkusPlatform-Converting.html 引入 iframe Comarkus2D.html
         // 注意：即使沒有父視窗，parent 依然有值，但在 file: 協定下無法透過 parent.parent.location.href!=location.href 進行比對
         //       會跑出 Uncaught DOMException: Permission denied to get property "href" on cross-origin object

         // 2025-02-20: 訊息格式包含 source, target, parameters, type, message 五項參數
         let wrapper = { source: sourceTool,
                         target: targetTool,
                         parameters: [],
                         type: "DocuXml",
                         message: xmlStr };
         parent.parent.postMessage(wrapper, '*');    // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
      //}
      //else alert("EnableMessageViaParent disabled");
   }

   // -------------------------------
   //      PostMessage handler
   // -------------------------------
   
   window.addEventListener("message", messageHandler, false);
   window.addEventListener("message", (evt) => {
      if (evt.data == "Root Has Got Project DirHandle") {
         GlobalVar.dirPickerReady = true;
         $("#selectInDir").click()
      }
      else if (evt.data == "Fail to Get Project DirHandle") {
         let msg = "ERROR: " + evt.data + "\n"
                 + "Please use Chrome or Edge to continue,\n"
                 + "run this page under https or http://localhost,\n"
                 + "or download the full package to run X-MARKUS locally.";
         alert(msg);
      }
   }, false);
   
   function messageHandler(evt) {
      if (!EnableMessageViaParent) return;      // 需打開此參數才能套用以下程式
      //alert(evt.origin);                      // invoker URL hostname
      //alert(evt.source);                      // invoker DOM object
      
      // 可透過此物件回傳訊息... （但瀏覽器可能會攔住，並加上一些提示訊息）
      try {
         if (!evt.data) return;                              // to prevent "SyntaxError: JSON.parse: unexpected end of data at line 1 column 1 of the JSON data"
         //alert(evt.data);
         
         let {source, target, parameters, type, message} = evt.data;           // 2025-02-20
         //alert("I'm Comarkus2D:\n" + JSON.stringify(evt.data));

         // 2025-01-18        
         if (source == "ConvertingPage") {
            if (message == 'analysis') {
               //let xmlStr = generateWithAttachedRelations();
               doPostMessage("Immarkus2D", "XmarkusAnalyzer", GlobalVar.finalDocuXml);   // 可直接貼出 finalDocuXml（不必重新計算）
            }
            else if (message == 'download') $("#genDocuXmlAndDownload").click();
            else alert("Unknown message: " + message);
         }
         else ;
      } catch (e) {
         alert(e.name + ": " + e.message);
      }
   }

   
