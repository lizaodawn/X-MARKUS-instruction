   // Comarkus2D
   // - 由於需藉由 NTU 實驗室開發的 Markus2D 轉換 ENTMARKUS html，許多全域變數以 GvarXX 命名
   // - 使用者藉由點選 butSelectEntmarkusExports/butSelectComarkusExports 驅動轉換
   

   const EnableDocuSkyConnectivity = false;       // 若為 true，則參考 DocuSky.connectivity.js 取得 DocuSkyHost
   const EnableMessageViaParent = true;           // 2024-12-26: （實驗）若為 true，則透過 parent 傳遞 postMessage() 給其他工具

   const inputFormat = 'MARKUS';
   const outputFormat = 'THDLExportXML';
   
   const CopyDocMetaForPostClassification = true;

   // 2025-01-20: 藉此全域變數判斷是否在 X-MARKUS 正常的 local mode 下執行（以顯示一些額外訊息）
   const InXmarkusLocalMode = (EnableMessageViaParent && parent && 
                              (location.protocol == 'file:' || parent.location.href!=location.href));

   // 利用 global variable 儲存 side-effects的資訊（ThdlExportXMLToSTAMLFuncs.js 會使用到）...
   var GvarThdlExport = { featureAnalysisTags: [],
                          personNameTagIdAsFeature: true,         // 是否要將 cbdbid 之類的 id 當作詞頻分析所顯示的 term
                          placeNameTagIdAsFeature: true,          // 是否要將 placename_id 當作詞頻分析的詞彙
                          datetimeTagIdAsFeature: true,
                          udefTagIdAsFeature: true,               // 2018-04-13
                        };          
   var GvarPassageToDoc = false;                   // 2025-08-01: Dawn 建議 Entmarkus/Comarkus 都不需將 passage 轉成 document -- 預設值可為 false, 'default', or 'passageId'
   var GvarBrAsNewline = true                      // 2019-04-09 Wayne: 符合 Markus 換行格式
   var GvarAlignCount;                             // 2019-04-23 Wayne: 新增全域累加變數
   var GvarAlignKeyTable;                          // 2019-10-26 Wayne: Markus comparativeus 對應 DocuXML key 值得對照表
   var GvarRelationIdTable;                        // 2019-10-29 Wayne: 支援 MarkusRelationId 對應到 DocuXMLTag 轉換
   var GvarMarkusRelIdToTag = {};                  // 2020-05-01: ThdlExportXMLToSTAMLFuncs.js 有用到，需先定義
                                                   
   var GvarJsonImports = {};                       // 2024-04-09: GvarJsonImports[filenameMain] := jsonObj
   var GvarComarkusUdefTags = {};                  // 2024-04-15: GvarComarkusUdefTags[udef_tagname] = 1 (udef_tagname 為 comarkus jon 轉換後產生)
   var GvarExtraUdefEventTags = [];                // 2024-06-04
                                                   
   var GvarMetadataJsonDict = {};                  // 2024-06-21: xmarkus-metadata.json 格式 {filename:{field1:[],field2:[],...}, ...}
   var GvarCorpusXmlList = [];                     // Tu: add for output multiple corpuses
   var GvarInFilesParam = {};                      // 2024-08-06
   var GvarTransformResult = [];                   // 2024-08-07
                                                   
   var GvarBatchEntry = 0;                         // 2024-08-11: 下一個 batch 編號（方便透過 <li> 顯示當前讀入的檔案數量）
   var GvarMetadataFieldSettingDict = {};          // 2024-08-05: 儲存 metadata 後分類的設定值，dict[tagName] = { tagContent:"年份", displayOrder:"3"} 形式
   var GvarStageDocuXml = '';                      // 2024-08-03: 存放「這次迭代」轉換出（可儲存）的 DocuXml
   var GvarFinalDocuXml = '';                      // 2024-08-xx: 存放「當前整併後」最終（可儲存）的 DocuXml
                                                   
   var GvarTextUdef4TagAnalysis = true;            // 2024-09-24: 是否將文本中的 Udef 標籤加入 <feature_analysis>
   var GvarExtraGenreUdefTags = true;              // 2024-09-22: 如果 Udef_abc 的內容為 x/y，則新增標籤 Udef_abc.GenreL{n}，其值為 x（"event-level" tags）
   var GvarExtraGenreUdefTagWithTerm = false;      // 2025-01-18: 若額外產生 Udef_abc.GenreL{n} 標籤，是否在標籤內加入 Term  <tag Term="x">y</tag>
                                                   
   var GvarConvertEachEvent2Doc = true;            // 2025-01-20: 將每個事件轉成獨立的文件（會在使用者按下 Entmarkus/Comarkus 按鈕後進行設定）
   var GvarInsertTagId2TagText = true;             // 2025-02-10: 是否在 convertComarkusBundle2Xml() 程序中，要將 comarkus 'id' 除了放入 @RefId，另外加入 tag text
   var GvarSkipMissingBundleKey = true;            // 2025-07-12: COMARKUS exports 有些地方似乎沒清理乾淨，應是陣列卻不是，導致 C2D 產生 MissingBundleKey 以資識別，若設為 true 則直接跳過。
   var GvarAddYearBlock2NewUdefTags = false;       // 2025-02-28: 將 metadata 的 year_for_grouping 轉換成 010Y_Block (e.g., 120-129), 050Y_Block (e.g., 150-199), 100Y_Block (e.g., 1200-1299) 跨年時段的 Udef_Extra_Y{n} 標籤
   
   var GvarAddXmlMetadataToUdefMetaTags = true;    // 2025-06-10: 將 xml_metadata 內的標籤 xyz，以 ("GlobalVar.udefDocMetaPrefix" + xyz) 加入 tags 後分類
   var GvarSpecifiedCompilation = '-';             // 2025-10-21: 使用者透過選擇 folder 或指定的 metadata compilation
   
   var GlobalVar = { enableExperimentFeatures: false,                            // 2024-12-25
                     userSelectEntmarkusOrComarkusFiles: 'General',              // 2025-01-18
                     subwinZindex: 101,                                          // subwinArea 的 z-index 為 100
                     enableExtraAlignObjectId: true,                             // 2026-01-20: 是否除了 <Udef_Align_OBJECT> 之外，額外輸出 <Udef_Align_OBJECT_ID>
                     fixAlignObjectId2Event: true,                               // 2025-12-27: 若為 true，則總是以 'Event' 作為 alignObjectId 的 tag text（@Term 則是 object id）
                     udefDocMetaPrefix: 'Udef_DocMeta_txt_',                     // 2026-01-21, 2026-02-25 改 Txt 為 txt
                     addDocTnaTnbByEvtTime: false,                               // 2026-03-31: 若為 true，在 DocuXml 加入 TNA, TNB （year_for_groupig 採用出版年） -- 但後續應用也需更新才有效
                   };        
   
   var GvarLinkToApp = { 'XmarkusAnalyzer': './XmarkusAnalyzer.html',            // 2024-12-20
                         'EventRelLite': './EventRelLite.html',
                         'MUNDa': '../MUNDa/index.html',
                       };

   function removeInvalidXmlChars(str) {
      // 目前 Comarkus2D 並沒用到，但還是保留著以備後續狀況
      // 2025-07-10: 超過 U+FFFF，是所謂「補充平面（Supplementary Plane）」的字元
      // => 若不想將合法的補充平面字元替換掉，應避免直接用 /[\uD800-\uDFFF]/ 替換 surrogate 區段，因為這樣會傷及合法字。
      //return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/g, '');
      return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF]))|(?:[^\uD800-\uDBFF][\uDC00-\uDFFF])/gu, '?');
   }               

   // 2025-05-25: 採用以下來自 ChatGPT 建議的程式碼...
   function decodeAndRemoveInvalidXmlEntities(str, replaced='') {
      return str.replace(/&#x([0-9a-fA-F]+);|&#([0-9]+);/g, (match, hex, dec) => {
         let codePoint = hex ? parseInt(hex, 16) : parseInt(dec, 10);
         
         // 根據 XML 1.0 規範，這些是非法字元
         if (
           (codePoint >= 0x00 && codePoint <= 0x08) ||
           codePoint === 0x0B ||
           codePoint === 0x0C ||
           (codePoint >= 0x0E && codePoint <= 0x1F) ||
           (codePoint >= 0xD800 && codePoint <= 0xDFFF) ||      // 代理對範圍
           codePoint === 0xFFFE ||
           codePoint === 0xFFFF
         ) {
           return replaced;       // 取代為 replaced，若 replaced 為空字串，效果等同移除非法字元
         }
         
         try {
           return String.fromCodePoint(codePoint);
         } catch (e) {
           // 若 codePoint 無效（不合法範圍），則忽略
           return replaced;
         }
      });
   }   
   
   function tryParseXML(xmlString, xmlFilename) {
      //alert(xmlString);
      try {
         // Note: parseFromString uses a hard-coded encoding UTF-8 ==> utf8mb4 characters yield errors?!
         //       text/html accepts &#55379;&#57054; but text/xml rejects
         var parser = new DOMParser();

         // 2024-04-13: 假設 parse 後出現 parsererror 標籤就代表剖析錯誤
         var dom = parser.parseFromString(xmlString, 'text/xml');
         if (dom.getElementsByTagName("parsererror").length > 0) {
            // 2025-05-24
            saveFile('debug.xml', xmlString);
            throw new Error('The input "' + xmlFilename + '" may not be a valid XML file!');
         }
         return dom;
      } catch(err) {
         $("#divLoadingContainer").hide();
         alert("Error: " + err.message);
         return null;
      }
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
   
   var split = { "THDLExportXML": function(data){
      var contents = [];
      for( var i = 0 ; i < data.length ; ++i ){
   		var xmlDoc = tryParseXML(data[i].content);         // 2016-09-16
   		if (xmlDoc === null) return null;
   
         var documents = xmlDoc.getElementsByTagName("document");
         for( var j = 0 ; j < documents.length ; ++j ){
            var newXML = (new DOMParser()).parseFromString("<ThdlPrototypeExport><documents></documents></ThdlPrototypeExport>", "text/xml");
            appendAllChildren( (new XMLSerializer()).serializeToString(documents[j]), newXML.getElementsByTagName("documents")[0]);
            contents.push({
               name: data[i].name + "(" + j + ")",
               content: (new XMLSerializer()).serializeToString(newXML)
            });
         }
      }
      return contents;
   }};
   
   var merge = {
      "THDLExportXML": function(data, replaceCorpus){
         if (typeof(replaceCorpus)==='undefined') replaceCorpus = true;          // 總是用 <input type='text' id='corpus'> 的值作為輸出的 corpus?
         var corpusVal = document.getElementById("corpus").value;
         var xmlStr = "<ThdlPrototypeExport>" +
                      "<corpus name='*'><feature_analysis></feature_analysis></corpus>" +     // put Udef_xxx here...
                      "<documents></documents>" +
                      "</ThdlPrototypeExport>";
         var newXML = (new DOMParser()).parseFromString(xmlStr, "text/xml");
         var corpusHash = {};
         for ( var i = 0 ; i < data.length ; ++i ) {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(data[i].content, "text/xml");
   
            var documents = xmlDoc.getElementsByTagName("document");
            for ( var j = 0 ; j < documents.length ; ++j ) {
               if (replaceCorpus) {
                  while( documents[j].getElementsByTagName("corpus").length > 0 ) {
                     documents[j].removeChild(documents[j].getElementsByTagName("corpus")[0]);
                  }
                  appendAllChildren("<corpus>" + corpusVal + "</corpus>", documents[j]);
               }
               appendAllChildren( (new XMLSerializer()).serializeToString(documents[j]), newXML.getElementsByTagName("documents")[0]);
            }
         
            //alert(JSON.stringify(GvarThdlExport['featureAnalysisTags']));    // 利用 global variable 取得 side-effects
            var corpusNodes = newXML.querySelectorAll("document > corpus");
            for (var k=0; k<corpusNodes.length; k++) {
               corpusHash[corpusNodes[k].childNodes[0].nodeValue] = 1;     // nodeValue can only apply to retrieving text node value
            }
            //alert(JSON.stringify(corpusHash));
            
            // 2024-05-01: (TODO) 將 <corpus name="*"> 改為 <corpus name="[文獻集名稱]">
            //             對又霖的程式寫法不熟悉，更動起來還真有點麻煩...
            //             暫且假設 M2D 一次僅能轉換一份文獻集
            let corpuses = Object.keys(corpusHash);
            newXML.getElementsByTagName("corpus")[0].setAttribute("name", corpuses[0]);
         
            var tagsHash = {};
            GvarThdlExport['featureAnalysisTags'].map(function(e) { tagsHash[e] = 1; });
            var myFeatureAnalysisTags = [];
            for (var key in tagsHash) myFeatureAnalysisTags.push(key);
            if (myFeatureAnalysisTags.length > 0) {
               var tagsXmlList = [];
               for (var k=0; k<myFeatureAnalysisTags.length; k++) {
                  let tagName = myFeatureAnalysisTags[k];
                  let category = tagName;
                  let subCategory = '-';
                  let tagXml = "<tag type='contentTagging' name='" + tagName + "' default_category='" 
                             + category + "' default_sub_category='" + subCategory + "'/>";
                  tagsXmlList.push(tagXml);
               }
               appendAllChildren(tagsXmlList.join("\r\n"), newXML.getElementsByTagName("feature_analysis")[0]);
            }
            //alert(JSON.stringify((new XMLSerializer()).serializeToString(newXML)));
         }
         //alert(newXML.getElementsByTagName("document").length);
    
         return [{
            name: document.getElementById("corpus").value,
            content: (new XMLSerializer()).serializeToString(newXML)
         }];
      }
   };

   var funcs = { "text": PlainTextToSTAMLFuncs, 
                 "STAML": { transform: function(id){return id;}, transformBack: function(id){return id;}},
                 "MARKUS": MarkusToSTAMLFuncs, 
                 "THDLExportXML": ThdlExportXMLToSTAMLFuncs };
   
   var subfilename = {
      "text": ".txt",
      "STAML": ".txt",
      "MARKUS": ".html",
      "THDLExportXML": ".xml"
   }
   
   // 2021-05-14: replace Markus character code &#(dddd); pattern to &#xhhhh; (may contain unicode surrogates)
   var replaceMarkusCharCode = function(match, digits) {
      let hexStr = parseInt(digits,10).toString(16).padStart(4,"0");          // dec to hex
      return "&#x" + hexStr + ";";
   };
   
   var replaceUnicodeSurrogates = function(match, highSurrogate, lowSurrogate) {
      let hex = (parseInt(highSurrogate,16) - 0xD800) * 0x400 + parseInt(lowSurrogate,16) - 0xDC00 + 0x10000;
      let code = "&#x" + hex.toString(16) + ";";          // e.g., &#x27c0e;
      //alert(code);
      return code;
   };
   
   function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
   }
   
   function transfer(inputFormat, outputFormat, contents, transferSuccFunc) {
      // 透過全域變數 GvarTransformResult 儲存轉換結果
      if( split[inputFormat] ){        // split contents to a new array [{name,content}, {name,content}, ...]
        contents = split[inputFormat](contents);
      }
      var inputTransformer = ((inputFormat !== "STAML")? new STAMLTransformer(funcs[inputFormat]) : funcs[inputFormat] );
      var outputTransformer = ((outputFormat !== "STAML")? new STAMLTransformer(funcs[outputFormat]) : funcs[outputFormat] );

      GvarTransformResult = [];       // reset global variable
      transferLoop(inputFormat, outputFormat, contents, inputTransformer, outputTransformer, 0, transferSuccFunc);

   }
   
   function transferLoop(inputFormat, outputFormat, contents, inputTransformer, outputTransformer, cidx, transferSuccFunc) {
      //for (let cidx=0; cidx<contents.length; cidx++) {
      if (cidx < contents.length) {
         data = contents[cidx];
         showProgressMsg(contents[cidx].name);
         // 若轉換成 STAML 途中有錯漏，就很可能是因為以下的 transform() 沒處理好            
         //alert('MY1: ' + JSON.stringify(data));        // Markus output format  
         //debugger;
         var staml = inputTransformer.transform(data.content);
         //alert('MY2: ' + JSON.stringify(staml));        // STAML format       

         data = { name: data.name,
                  content: staml
                }; 

         var extra = null;
         if (inputFormat == 'MARKUS' && outputFormat == 'THDLExportXML') {
            // 2017-03-09: Markus 似乎有 bugs，其內含的檔名可能會重覆（例如太平廣記的樣本）...
            //             在此很醜陋地用讀入的檔名，暴力置換掉 STAML 中的 <filename> 的檔名...
            if (data.name) {
               // 2024-11-17: data.name (輸入檔名) 可能包含 "&" 符號，造成後續處理的困難，在此將其取代掉
               let filename = escapeFilename(data.name);               // 2025-08-18: (bug fix) 不能將多個 '_' 換成單一 '_'，可能會造成 .html 和 .json 檔名不一致（若檔名包含連續的多個底線）
               data.content = data.content.replace(new RegExp("<filename>([^<]*)</filename>"), "<filename>" + filename + "</filename>");
               //alert(JSON.stringify(data.content));      // STAML format
            }
         }
         //debugger;
         //alert('BY3: ' + data.content);
         var xml = outputTransformer.transformBack(data.content);       // 2018-04-12: STAMLTransformer.js -- the transformBack may contain bugs --> output not valid XML!
         
         //alert('MY3: ' + JSON.stringify(xml));

         // 20170510: 加上 <doc_source>filename</doc_source>            
         //--------- 2018-8-20 wayne --------
         let parser = new DOMParser()
         let doc = parser.parseFromString(contents[0].content, 'text/xml')
         if (!doc) alert("Error: failed to parse document content")                // 2018=-8-26
         let metadataAttr = doc.firstChild.attributes['data-docusky-metadata'];    // 2018-08-26: (Tu) undefined value can cause problems
         let metadata = (metadataAttr && metadataAttr.value) ? JSON.parse(metadataAttr.value) : '';
         //--------- 2018-8-20 wayne --------
         // 20170416: 加上 paragraphs to docs 的處理
         var jqXmlDoc = $.parseXML(xml);            // returns XMLDocument
         var jqXml = $(jqXmlDoc);                   // returns jQuery object
         var jqDocumentNodes = jqXml.find("ThdlPrototypeExport > documents > document");

         // 在文件中，加入 comarkus <Event>
         var documentXmlList = jqDocumentNodes.map(function() {
            var docNode = this;
            var paragraphs = $(this).find("doc_content > Paragraph");
            //var radioVal = $("input[name=radioParagraphToDoc]:checked").val();
            //if ($("#inputParagraphAsDoc:checked").length > 0 && paragraphs.length > 1) {
            var radioVal = GvarPassageToDoc;
            if ((GvarPassageToDoc == 'default' || GvarPassageToDoc == 'passageId') && paragraphs.length > 1) {
               var cloneDoc = $(docNode).clone();
               cloneDoc.find("doc_content").html('');
               var newDocList = paragraphs.map(function(idx) {
                  var newDoc = cloneDoc.clone();
                  var origFilename = newDoc.attr("filename");
                  var paragraphId = $(this).attr("RefId");
                  
                  var newFilename = origFilename + "_p" + ("0000" + (idx + 1)).substr(-4,4);
                  // 2019-02-05 wayne
                  // 檢查 metadata array 是否存在相對應的 indexed metadata (paragraph metadata)
                  if (metadata[idx]) {
                     for (let key in metadata[idx]) {
                       let metadataNode = toXml(metadata[idx][key], key, "")
                       $(newDoc).find(key)[0].replaceWith(new DOMParser().parseFromString(metadataNode, "text/xml").childNodes[0])
                     }
                     newFilename = metadata[idx]['filename']
                     newDoc.attr('number', idx + 1)
                  }
                  //if (metadata.filename) $(newDoc).find('filename')[0].remove() // 2018-09-11 wayne 移除多餘的 metadata
                  //if (metadata.number) $(newDoc).find('number')[0].remove() // 2018-09-11 wayne 移除多餘的 metadata
                  //if (metadata.corpus) { $('.divInputCorpusName > input')[0].value = metadata.corpus } // 2018-09-11 wayne 預設使用舊有的 corpus name
                  
                  if (GvarPassageToDoc == 'passageId' && paragraphId) {
                     // 2017-07-03: 如果 paragraphId 為 'passage\d+'，則依然採用 newFilename
                     if (paragraphId.match(/^passage(\d+)$/) === null) newFilename = paragraphId;
                  }
                  newDoc.attr("filename", newFilename);
                  newDoc.find("filename").text(newFilename);
                  
                  // 2020-11-07: (bug fix) 若先前已經有 <doc_source>，若未移除就會多 append 一份上去
                  //             若 passages 被轉為文件，轉出的文件 filename 會是 origFilename_<pid>，然後 doc_source 保留 origFilename
                  $(newDoc).find("doc_source").remove();
                  newDoc.append("<doc_source>" + origFilename + "</doc_source>");    // 2017-05-03
                  
                  newDoc.find("doc_content").html(this.outerHTML);
                  return newDoc.get(0).outerHTML;
               });
               //alert(JSON.stringify(newDocList.toArray()));
               return newDocList.toArray();
            }
            else {
               var origFilename = $(this).attr("filename");
               $(this).append("<doc_source>" + origFilename + "</doc_source>");    // 2017-05-09
               return [this.outerHTML];
            }
         });
         
         jqXml.find("ThdlPrototypeExport > documents").first().html(documentXmlList.toArray().join("\r\n"));
         xml = getDocuXmlString(jqXml);
         //var xmlObj = jqXml.find("ThdlPrototypeExport").get(0);
         //xml = (new XMLSerializer()).serializeToString(xmlObj);
         //alert(xml);

         GvarTransformResult[cidx] = { name: data.name,
                       content: xml,
                     }; 

         setTimeout(function() {
            transferLoop(inputFormat, outputFormat, contents, inputTransformer, outputTransformer, cidx+1, transferSuccFunc);
         }, 10);
      }
      else {
         finishTransferLoop(outputFormat);
         transferSuccFunc();
      }
   }
   
   function finishTransferLoop(outputFormat) {
      if( merge[outputFormat] ){
         GvarTransformResult = merge[outputFormat](GvarTransformResult, true);     // true: always replaceCorpus
      }
      
      // alert(JSON.stringify(GvarTransformResult)); 
      $("#divLoadingContainer").hide();
   }
   
   // -------------------------------------------------------------------------------------

   window.addEventListener("load", function() {
      //if (document.getElementById("personNameTagIdAsFeature")) {         // 2024-06-21: 從主頁面移除
      //   document.getElementById("personNameTagIdAsFeature").addEventListener("click", function(e) {
      //      // 設定 gloal variable
      //      GvarThdlExport['personNameTagIdAsFeature'] = this.checked;   // true or false
      //   });
      //}
      //if (document.getElementById("placeNameTagIdAsFeature")) {         // 2024-06-21
      //   document.getElementById("placeNameTagIdAsFeature").addEventListener("click", function(e) {
      //      GvarThdlExport['placeNameTagIdAsFeature'] = this.checked;   // true or false
      //   });
      //}
      //if (document.getElementById("datetimeTagIdAsFeature")) {         // 2024-06-21
      //   document.getElementById("datetimeTagIdAsFeature").addEventListener("click", function(e) {
      //      GvarThdlExport['datetimeTagIdAsFeature'] = this.checked;   // true or false
      //   });
      //}
      //if (document.getElementById("udefTagIdAsFeature")) {             // 2024-06-21
      //   document.getElementById("udefTagIdAsFeature").addEventListener("click", function(e) {
      //      GvarThdlExport['udefTagIdAsFeature'] = this.checked;       // true or false
      //   });
      //}
      //if (document.getElementById("brAsNewline")) {                    // 2024-06-21
      //   document.getElementById("brAsNewline").addEventListener("click", function(e) {
      //      GvarBrAsNewline = this.checked;
      //   })
      //}
      
      $("#butSelectEntmarkusExports").click(function(evt) {
         let key = $(this).attr("key");               // should be 'Entmarkus' (General, Entmarkus, Comarkus)
         selectComarkusFiles(key)
      });
      
      $("#butSelectMarkusExports, #butSelectComarkusExports").click(function(evt) {
         // 2025-01-18: 利用 key 調整 corpus 名稱，並且指定顯示在哪個 "Files Processed" 區塊
         // -- #butSelectMarkusExports 改用 #butSelectEntmarkusExports
         let key = $(this).attr("key");               // General, Entmarkus, Comarkus
         //alert(key);
         
         // 2025-07-30: (bug fix) 在 Comarkus 狀況下，不應將 passage 轉成文件！
         //if (key == 'Comarkus') GvarPassageToDoc = false;
         
         // 2025-08-01: Dawn 建議 Entmarkus/Comarkus 都不需將 passage 解析成 document
         GvarPassageToDoc = false;
         
         // 2025-04-30
         $("#overlay").show();
         let w = 480;
         let h = 110;
         let left = Math.floor((window.innerWidth - w) / 2);
         let top = Math.min(80, Math.floor((window.innerHeight - h) / 2) - 100);
         
         let html = "<table style='margin-top:8px; overflow:clip;'>"
                  + "<tr><td valign='top'><input type='radio' name='conversionMode' value='event2Doc'></input></td><td>Show all <b>events</b> as separate documents</td></tr>"           // 完全按「事件」來組織 
                  + "<tr><td valign='top'><input type='radio' name='conversionMode' value='docManyEvents'></input></td><td>Show <b>source texts</b> with their events as separate documents</td></tr>"     // 按「原始文本」來組織
                  + "</table>"
                  + "<div style='height:12px'></div>"
                  + "<center><button id='butConversionMode' class='button' style='display:none'>CONTINUE</button></center>";
         let divContentId = showDivHtml(evt, top, left, w, h, "Conversion Mode", html);
         
         $("input[name='conversionMode']").off("change").on("change", function(e) {
            $("#butConversionMode").click();
         });
        
         $("#butConversionMode").off("click").on("click", function(e) {
            let s = $("input[name='conversionMode']:checked").val();
            GvarConvertEachEvent2Doc = (s == 'event2Doc') ? true : false;
            $("span.closeSubwinContainer").click();
            $("#overlay").hide();
            
            // 接回檔案選擇程序
            selectComarkusFiles(key);
         });
      });

      function selectComarkusFiles(key) {
         // 2025-02-04: 若使用者按下的是 Entmarkus 轉換，就不需將 event 轉成文件
         if (key == 'Entmarkus') GvarConvertEachEvent2Doc = false;

         GlobalVar.userSelectEntmarkusOrComarkusFiles = key;
         let corpusLabel = $("#corpus").val().replace(/(comarkus|entmarkus)/gi, key.toUpperCase());
         $("#corpus").val(corpusLabel);
         $("#fileselect").click();
      }
      
      document.getElementById("fileselect").addEventListener('change', function(e) {
         // 2024-08-06: 使用者選擇檔案後就觸發，檢查並設定 entmarkus/comarkus 檔案名稱等等
         //             注意，由於安全考量，file object 讀不到 filepath 的資訊
         //alert("files selected");
         GvarAlignCount = 0;             // 20190423 Wayne: initialize
         GvarAlignKeyTable = {};
         GvarMarkusRelIdToTag = {};
         
         // 2024-08-03: 根據讀入的檔名歸類處理
         let entmarkusHtmlFiles = {}, entmarkusMetadataJsonFiles = {}, comarkusJsonFiles = {};
         let files = document.getElementById("fileselect").files;
         
         if (files.length == 0) return;            // 2025-01-16: 按下 ESC 跳離 file selection

         for (let i=0; i<files.length; i++) {
            let fname = files[i].name;
            // 直接略過 rules.json, defaultMetadataSchema.json 這兩個檔案
            // 另外固定檔名 xmarkus-metadata.json 則放入 entmarkusMetadataJsonFiles
            if (fname == "rules.json" || fname == "defaultMetadataSchema.json") continue;
            else if (fname == "xmarkus-metadata.json") entmarkusMetadataJsonFiles[fname] = files[i];
            else if (fname == "forComarkus2D.json") {           // 2024-08-08: 內容很單純的設定檔（目前就是設定 corpus 名稱）
               readForCormarkus2D(files[i]);                    // 內容很單純，且只是設定 $("#corpus")，非同步進行應該沒問題
            }
            else {
               let filenameMain = fname.substring(0, fname.lastIndexOf("."));
               let filenameExt = fname.substring(fname.lastIndexOf(".") + 1);
               filenameMain = escapeFilename(filenameMain);     // 2025-08-20: 與 Entmarkus html 主檔名同步
               if (filenameExt == 'html') entmarkusHtmlFiles[filenameMain] = files[i];
               else if (filenameExt == 'json') comarkusJsonFiles[filenameMain] = files[i];
               else console.log("Warning: cannot recognize filename: " + fname);
            }
         };
         
         let entmarkusHtmlFileList = Object.keys(entmarkusHtmlFiles);
         let comarkusJsonFileList = Object.keys(comarkusJsonFiles);
         //alert(entmarkusHtmlFileList.length + ':' + comarkusJsonFileList.length);
         
         let entNoCo = entmarkusHtmlFileList.filter(x => !comarkusJsonFileList.includes(x));
         let coNoEnt = comarkusJsonFileList.filter(x => !entmarkusHtmlFileList.includes(x));
         //alert("Html without comarkus json: " + JSON.stringify(entNoCo));
         //alert("Comarkus json without html: " + JSON.stringify(coNoEnt));
         
         GvarCorpusXmlList = [];           // reset （每次選完一批檔案後，就會 reset）
         GvarInFilesParam = { entmarkusHtmlFiles, 
                              entmarkusMetadataJsonFiles, 
                              comarkusJsonFiles,
                              entNoCo,
                              coNoEnt,
                              corpusToBuild: $("#corpus").val()
                            };

         // 選完檔案後，才顯示「文獻集名稱」和「轉換按鈕」
         //$("#convertFiles").fadeIn(1000);
         
         // 2025-10-21: 原先是 fileselect 處理完之後就直接進入 convertToDocuXml()，但現在多加入一道程序
         specifyMoreMetadata();
      });
      
      // 2025-10-21
      function specifyMoreMetadata() {
         $("#overlay").show();
         let w = 480;
         let h = 110;
         let left = Math.floor((window.innerWidth - w) / 2);
         let top = Math.min(80, Math.floor((window.innerHeight - h) / 2) - 100);
         let html = "<table style='margin-top:8px; overflow:clip;'>"
                  + "<tr><td valign='top'><input type='radio' name='specifyCompilation' value='byFolderName'></input></td><td>By choosing a folder name (and allowing uploads)</td></tr>"
                  + "<tr><td valign='top'><input type='radio' name='specifyCompilation' value='bySpecifiedValue'></input></td><td>By specifying a value manually</td></tr>"
                  + "</table>";
         let divContentId = showDivHtml(null, top, left, w, h, "Specify metadata 'compilation' for these data", html);

         $("input[name='specifyCompilation']").off("change").on("change", function(e) {
            let s = $("input[name='specifyCompilation']:checked").val();
            if (s == 'byFolderName') $("#folderselect").click();
            else if (s == 'bySpecifiedValue') {
               let s = prompt("Please specify the value:", '');
               s = (s === null) ? '-' : s.trim();
               GvarSpecifiedCompilation = s || '-';
               convertToDocuXml();
            }
            $("span.closeSubwinContainer").click();
            $("#overlay").hide();
            
         });
      }

      document.getElementById("folderselect").addEventListener('change', function(e) {
         const files = [...e.target.files];
         const root = (files.length > 0)
                    ? files[0].webkitRelativePath.split('/')[0] : '-';     // 選擇的 folder 會在 webkitRelativePath 的 root
         GvarSpecifiedCompilation = root;

         // 2024-12-20: 不需使用者輸入 corpus 名稱（採用預設值）後，可在選完檔案後直接進行轉換？
         convertToDocuXml();
      });

      // 2025-07-27: 由於 #batchConvertToDocuXml 已被隱藏，因此以下應可刪去...
      //document.getElementById("batchConvertToDocuXml").addEventListener("click", function(e) {
      //   convertToDocuXml();
      //});
      
      function convertToDocuXml() {           // 2025-07-27 獨立出來
         // 在此主要是處理「讀入檔案資料」，建構 DocuXml 將等到按下 batchConvertToDocuXml 按鈕才會執行
         if (document.getElementById("fileselect").files.length == 0) {    // 2024-06-21
            alert("錯誤：沒有指定欲匯入的 ENTMARKUS/COMARKUS .html 和 .json 檔案");
            return;
         }
         
         GvarBatchEntry++;
         showProgressMsg("converting");
         
         GvarInFilesParam.corpusToBuild = $("#corpus").val();    // 2024-08-25: 按下轉換鍵才設定為新值
         convertHtmlAndReadOtherFiles(GvarInFilesParam);         // 用最新值傳入函式來進行轉換

         // 注意，以下會 async 執行，並非等檔案都讀入才執行
         var dateStr = (new Date()).yyyymmdd();
         $("#dbTitle").val(dateStr + '-c2d');               // $("#corpus").val()
         $("#inputFields").addClass("disabled");
      }

      // 2024-06-21
      document.getElementById("saveFile").addEventListener("click", function(e) {
         if (!GvarFinalDocuXml) {
            alert("Error: no DocuXml to save!");
            return;
         }
         
         // 儲存         
         var blob = new Blob([GvarFinalDocuXml], {type: "text/plain;charset=utf-8"});
         var dateStr = (new Date()).yyyymmdd();
         
         let mainFilename = dateStr + '-c2d-' + $("#corpus").val();
         if (GvarConvertEachEvent2Doc) mainFilename += '-Evt2Doc';            // 2025-01-18
         var filename =  mainFilename + '.xml';                               // after merging, result[0].name will be the valud in element id="corpus"
         saveAs(blob, filename);                                              // requires FileSaver.js
         
         // 2024-12-20: Comarkus2D 到其他 Xmarkus 應用工具
         //             試著透過 CSS pointer-events:none; 來「禁用」標籤元素...
         $("button.continueBuilding, #saveFile").addClass("disabled");                  // 需 CSS 配合
         //if (location.protocol === 'file:') $("#askToUseLeftSidebarFuncs").fadeIn(1500);
         //else $("#linksToApplications").show();
      });
      
      init();
   });
   
   // ----------------------------------------------------------------------------------
   
   // 2025-05-24
   function saveFile(filename, out, mime="text/plain;charset=utf-8") {
      var blob = new Blob([out], {type: mime});
      saveAs(blob, filename);             // requires FileSaver.js
   }

   function init() {
      GvarBatchEntry = 0;
      setTimeout(resizeOverlay, 1000);            // 必須等一小段時間，否則 window.innerWidth 和 innerHeight 會都是 0
   }
   
   function resizeOverlay() {
      let h = window.innerHeight;
      let w = window.innerWidth;
      //alert(h + ':' + w);
      $("#overlay").css({width: w + 'px', height: h + 'px'});
   }
   
   function readForCormarkus2D(f) {
      // 2024-08-08
      let fname = f.name;
      let r = new FileReader();
      r.onload = function(e) { 
   	   let settings = JSON.parse(e.target.result.trim());
         if (settings.corpusName) $("#corpus").val(settings.corpusName);
      }
      r.readAsText(f);
   }
   
   // 2024-08-03: 檔案全部載入後，才能執行 attachMetadataAndEvents()
   function attachMetadataAndEvents() {
      // 注意：不管是否有 comarkus json 檔，此函式都應在轉換過程最後被呼叫到
      //alert("attachMetadataAndEvents");
      showProgressMsg("attach metadata and events");

      // 將 GvarJsonImports 內容 attach 到 GvarStageDocuXml，產生新的 xml
      let xml = GvarStageDocuXml;
      //alert(JSON.stringify(GvarJsonImports));
      xml = attachEntmarkusMetadata(xml);              // 2024-06-21: 加上 entmarkus metadata json 的資料

      GvarStageDocuXml = insertComarkusEvents(xml);    // 函式內會處理 <feature_analysis> 設定
      mergeStageToFinalDocuXml();
      //console.log(GvarStageDocuXml);
      
      // 2025-01-19: 將每個事件轉成獨立的文件... 注意事件若有時間和地點，需同時更新文件的相關 metadata
      if (GvarConvertEachEvent2Doc) convertEvent2Doc();
      
      // 2025-01-19: 隱藏第一次的匯入按鈕
      $("#butSelectMarkusExports").hide();
      $("#spanSelectMarkusExportsDone").show();

      // 2025-02-18: 等一小陣子再呼叫 finishBatchImports()
      window.setTimeout(finishBatchImports, 500);
   }
   
   function convertEvent2Doc() {
      // 2025-01-18: 將 GvarFinalDocuXml 中的每個事件轉成獨立的文件... 
      //             注意事件若有時間和地點，需同時更新文件的相關 metadata
      let xmlPrefix = '<?xml version="1.0"?>';
      let jqXmlDoc = $.parseXML(xmlPrefix + GvarFinalDocuXml);    // returns XMLDocument
      let jqXml = $(jqXmlDoc);                                    // returns jQuery object
      
      jqXml.find("document").each(function() {
         let jqDoc = $(this);
         let docFilename = jqDoc.attr("filename");
         let jqEventList = jqDoc.find("Events > Event");
         let eventCount = jqEventList.length;
         if (eventCount <= 1) return;               // 事件數量小於等於一，跳過不需額外處理

         // 將每個事件轉成一份新文件
         jqEventList.each(function(idx) {
            let jqEvent = $(this);
            let eventKey = jqEvent.attr("Key");     // "Event:0", "Event:1", etc. 也可用 attr("ComarkusId")
            let jqClone = jqDoc.clone();
            jqClone.find("Events > Event").remove();
            jqClone.find("Events").append(jqEvent);
            let newFilename = docFilename + '_E' + idx.toString().padStart(2,'0');     // 注意，idx 從 0 起跳
            jqClone.attr("filename", newFilename);
            
            // 2025-12-07: 如果有 <xml_metadata><Udef_DocMeta_Txt_piece_time>
            //             先以這時間（似乎是寫作的時間）作為「基本」的 year_for_grouping 年份
            let pieceTimeTag = GlobalVar.udefDocMetaPrefix + 'piece_time';
            jqClone.find(`xml_metadata > ${pieceTimeTag}`).each(function() {
               let str = $(this).text();
               let match = /公元([\d]+)/.exec(str);      // 也有「嘉慶(公元1796～1821年:清仁宗)」狀況 -- 1786-2821 是完整的嘉慶年
               if (match) {
                  jqClone.find("year_for_grouping").each(function() {
                     $(this).text(match[1]);
                  });
               }
            });
            
            // 2026-03-31: 嘗試加入 TNA <timeseq_not_after>, TNB <timeseq_not_before>
            if (GlobalVar.addDocTnaTnbByEvtTime) {
               // 事件若有時間和地點，需同時更新文件的相關 metadata => 地點的部分，由於目前 metadata 只放地名（沒有 RefId），因此暫時不需更新...
               // <Udef_Evt_TIME RefId="公元13681398"...>
               // <Udef_Evt_TIME RefId="1624" ...>
               // <Udef_Evt_TIME RefId="3年" MarkusId="...">DURATION/三載</Udef_Evt_TIME>
               // <Udef_Evt_TIME RefId="1517-04" MarkusId="...">END/正德丁丑春三月</Udef_Evt_TIME>
               // <Udef_Evt_LOCATION RefId="hvd_1261"...>
               // <Udef_Evt_LOCATION RefId="hvd_96363"...>

               // 目前觀察到的 Type，有 BEGIN, END, BEFORE, AFTER, DURATION (duration), timePeriod 等幾種
               let tna = 9999, tnb = -9999;
               let yearBeginFound = false;
               jqEvent.find("Udef_Evt_TIME").each(function() {
                  let refId = $(this).attr("RefId");
                  if (!refId) return;                              // 沒有 RefId 就直接跳過
                  
                  // 2025-12-06: 若 <Udef_Evt_TIME @RefId> 的值 "BEGIN/1621/..." 形式，就用 @RefId 的值放入 <year_for_graouping>
                  let year = refId.match(/[\-]*\d{1,4}/)[0];       // 比對到的第一組數字 -- 不超過四位數
                  let val = $(this).text();
                  let type = val.split('/')[0];
                  
                  // begin at Y, after Y -- not before Y
                  // end at Y, before Y -- not after T
                  if (['BEGIN','AFTER'].includes(type)) tnb = year;
                  else if (['END','BEFORE'].includes(type)) tna = year;
                  else if (['timePeriod'].includes(type)) {
                     // 2025-12-09: 有可能是「公元1126年～1127年:宋欽宗」或「1074-09」！
                     val = val.replace(/～/g,'~');
                     let parts = val.split('~');
                     tnb = parts[0]?.match(/[\-]?\d{1,4}/)?.[0] ?? -9999;
                     tna = parts[1]?.match(/[\-]?\d{1,4}/)?.[0] ?? 9999;
                  }
               });
               
               let s = `<timeseq_not_before>${tnb}</timeseq_not_before>`;
               let t = `<timeseq_not_after>${tna}</timeseq_not_after>`;
               jqClone.append(s)
                      .append(t);
            }

            // 2025-01-23 (bug fix): 當初竟然放在 jqEventList.each(...) 迴圈中
            jqClone.find("title").each(function() {      // 2025-01-20: 在標題後方，補上此文件的「事件編號/事件總數」
               // 注意：XA 後分類的 TITLE，必須記得將 span.copy 移除...
               //       為了讓 TITLE 加入後分類，且不想增加額外的處理負擔，在此需避免有冒號或空白（例如將空白都換成 '_'）
               let newTitle = $(this).html()
                            + '<span class="copy">(' + (idx+1) + '/' + eventCount + ')</span>';   // 2025-07-17: 移除空白以避免後續處理的麻煩
               $(this).html(newTitle);
            });

            // 將新文件放入 jqXml 中
            jqXml.find("documents").append(jqClone);
         });
         
         // 移除（單一文件包含多筆事件的）舊文件
         jqDoc.remove();
      });
      
      GvarFinalDocuXml = getDocuXmlString(jqXml);
   }
   
   function finishBatchImports() {
      // 2024-12-25: 完成這一輪的 batch imports
      showNextStepInstruction();

      // 2025-01-20: 原先是讀入檔案就傳遞訊息給父視窗，現移到 finish batch 再執行
      if (InXmarkusLocalMode) {
         window.setTimeout(function() {
            // 透過 postMessage() 將「使用者已在 Comarkus2D 選檔案」的動作傳訊給 Converting page 知道
            let wrapper = { source: 'Comarkus2D',
                            target: 'ConvertingPage',
                            type: 'json',
                            message: { action: 'FileSelection' }
                          };
            window.parent.postMessage(wrapper, '*');     // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
         }, 250);
      }
      
      if (GlobalVar.enableExperimentFeatures) {         // 2024-12-25
         $("#testArea").show();                         // #butTEST -- TEST TEST xxyyzz 
      }
      hideProgressMsg();
   }
   
   function mergeStageToFinalDocuXml() {
      // 2024-08-09
      if (!GvarFinalDocuXml) {
         GvarFinalDocuXml = GvarStageDocuXml;
         return;
      }

      // 想法：先轉成 jqXml，進行 merge 動作後，再轉回 DocuXml
      let xmlPrefix = '<?xml version="1.0"?>';
      let jqFinalXmlDoc = $.parseXML(xmlPrefix + GvarFinalDocuXml);    // returns XMLDocument
      let jqFinalXml = $(jqFinalXmlDoc);                               // returns jQuery object
      //alert(GvarFinalDocuXml);
      //alert(jqFinalXml.find("documents").prop('outerHTML'));
      //alert(jqFinalXml.find("documents").html());
      
      let jqStageXmlDoc = $.parseXML(GvarStageDocuXml);
      let jqStageXml = $(jqStageXmlDoc);
      
      // 以下處理 corpus settings
      // <corpus name="福建bridges">
      // <metadata_field_settings>
      // <feature_analysis>
      
      let jqStageCorpus = jqStageXml.find("ThdlPrototypeExport > corpus");
      let jqStageCorpusName = (jqStageCorpus.length > 0)
                            ? jqStageCorpus.attr("name") : '-';
                            
      let corpusSelector = "ThdlPrototypeExport > corpus[name='" + jqStageCorpusName + "']";
      let jqFinalCorpus = jqFinalXml.find(corpusSelector);
      if (jqFinalCorpus.length == 0) {
         jqFinalXml.find("ThdlPrototypeExport")
                   .prepend('<corpus name="' + jqStageCorpusName + '"></corpus>');
         jqFinalCorpus = jqFinalXml.find(corpusSelector);
      }
      
      let jqFinalMetadataFieldSettings = jqFinalCorpus.find("metadata_field_settings");
      let jqStageMetadataFieldSettings = jqStageCorpus.find("metadata_field_settings");
      if (jqStageMetadataFieldSettings.length > 0) {
         jqStageMetadataFieldSettings.children().each(function() {
            // e.g., <author show_spotlight="Y" display_order="3">事件作者</author>
            let tagName = $(this).prop("tagName").toLowerCase();          // tagName 總是回傳大寫，而 DocuSky metadata settings 都是小寫和底線
            if (jqFinalMetadataFieldSettings.find(tagName).length == 0) {
               let s = '<' + tagName + ' show_spotlight="Y" display_order="' 
                     + $(this).attr("display_order") + '">'
                     + $(this).text()
                     + '</' + tagName + '>';
               jqFinalMetadataFieldSettings.append(s); 
            }
         });
      }
      
      let jqFinalFeatureAnalysis = jqFinalCorpus.find("feature_analysis");
      let jqStageFeatureAnalysis = jqStageCorpus.find("feature_analysis");
      if (jqStageFeatureAnalysis.length > 0) {
         jqStageFeatureAnalysis.find("tag").each(function() {
            // e.g., <tag type="contentTagging" name="Udef_Event_Element" default_category="Udef_Event_Element" default_sub_category="-"/>
            let jqStageTag = $(this);
            let tagAttrName = $(this).attr("name");       // 假設必然存在
            if (jqFinalFeatureAnalysis.find("tag[name='" + tagAttrName + "']").length == 0) {
               let category = tagAttrName, subCategory = '-';
               if (tagAttrName == "Udef_Evt_LOCATION") {
                  category = "Place";
                  subCategory = tagAttrName;
               }
               let s = '<tag type="contentTagging" name="' + tagAttrName 
                     + '" default_category="' + category
                     + '" default_sub_category="' + subCategory + '"/>';
               jqFinalFeatureAnalysis.append(s);
            }
         });
      }

      // 以下處理 documents
      let documentsSelector = "ThdlPrototypeExport > documents";
      let jqFinalDocuments = jqFinalXml.find(documentsSelector);      // 假設必然存在
      let jqStageDocuments = jqStageXml.find(documentsSelector);
      if (jqStageDocuments.length > 0) {
         jqStageDocuments.find("document").each(function() {
            let docXml = $(this).prop("outerHTML");
            jqFinalDocuments.append(docXml + "\n");
         });
      }
      
      // 轉回 xml 字串，儲存到 GvarFinalDocuXml
      let xmlObj = jqFinalXml.find("ThdlPrototypeExport").get(0);
      GvarFinalDocuXml = (new XMLSerializer()).serializeToString(xmlObj);
   }
   
   function convertHtmlAndReadOtherFiles(inFilesParam) {
      // convertHtmlAndReadOtherFiles() 步驟：
      // (1). 從 inFilesParam.entmarkusHtmlFiles 取得 entmarkus html 的 file object
      //      讀入 entmarkusHtmlFileList 的 html
      // (2). 進行特殊字元取代後，呼叫 M2D 的 transfer() 建構出基本的 DocuXml
      // (3). 從 coNoEnt 找出「只有 comarkus json 但沒有 entmarkus html」的檔名，「補上」空的文件
      // (4). 利用 entmarkusMetadataJsonFiles 讀入 entmarkus metadata
      // (5). 利用 comarkusJsonFileList 讀入 comarkus json
      // (6). 將 comarkus json 的數據 "attach" 到 entmarkus jquery documents 中
      //      注意 entmarkus metadata 和 comarkus json 的 attachment 需等到呼叫 attachMetadataAndEvents() 才執行
      
      //alert(JSON.stringify(inFilesParam));
      if (Object.keys(inFilesParam.entmarkusHtmlFiles).length > 0) {        // 2024-08-07: 補上
         let filesContent = [];
         let loadFinished = 0;
         for (let key in inFilesParam.entmarkusHtmlFiles) {
            let f = inFilesParam.entmarkusHtmlFiles[key];            // file object
            let fname = f.name;
            var r = new FileReader();
            r.onload = function(e) { 
   	         var contents = e.target.result.trim();
               if (contents.indexOf("<div ")!==0 && contents.indexOf("<html>")>0) {      // 2017-08-09
                  alert("Warning: this file may not have a valid MARKUS format!\nPlease make sure it's exported by Export --> MARKUS format");
               }
               // var puncRange = /[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A1-\u00BF\u00D7\u00F7\u200B-\u2927\u202A-\u202E\u2030-\u205E\u2060-\u2069\u3001-\u303F\uFE10-\uFF19\uFE30-\uFE4F\uFE50-\uFE6B\uFF00-\uFFEF\s]+/g;	// 20170731: remove "u" flag (for older browsers)
               // var hanziRange = new RegExp("[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]+", "g");	// 20170731: remove "u" flag (for older browsers)
               // unicode surrogate: high surrogate: 0xD800 - 0xDBFF
               //                    low surrogate:  0xDC00 - 0xDFFF
               // dec2hex: hexString = number.toString(16);
               // hex2dec: number = parseInt(hexString, 16);
               // 2021-05-14: (1). 移除 invalid characters 部分，允許 unicode surrogates 範圍
               //             (2). 修改原先的 .replace(/&amp;#\(([0-9a-hA-H]+)\);/g, "&#$1;")，讓它轉成 &#xhhhh;
               //             (3). 將 &#xd[8-9a-b][0-9a-f]{2};&#xd[c-f][0-9a-f]{2}; 置換成 &#x1hhhh; 到 &#x10hhhh;
               // 2024-06-30: Guangxu_PuchengXianzhi_Juanzhisanshiliu_Yiwensiji_ZhuBingjian_Renshoushiqiaogaijianfuqiaobeiji.txt_markus_event.html 的 Pos:6116 屬性內包含 '& ' 的不合規字元！
         
               // 2025-02-17: comarkus 轉出的 value="..." 中，有時 '&' 不會被轉成 '&amp;'，導致 xml 錯誤訊息！
               //             例如 DaoGuangFanShiXianZhi_JuanZhiLiu_YiWen_QianChengJi.txt_markus_cor2.html, Jiaqing_LianjiangXianzhi_Juaner_Chengchi_WuKongqi_QingJiequJi.txt_markus_event.html
               contents = contents.replace(/&(amp|apos|lt|gt|quot);/g,'==$1;')
                                  .replace(/&/g, '&amp;')
                                  .replace(/==(amp|apos|lt|gt|quot);/g,'&$1;');
                                  
               contents = contents.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uD800-\uDFFF\uE000-\uFFFD]/g, '')               // 2021-05-14: 允許 unicode surrogates range （才不會移除某個這類罕字元）
                                  .replace(/<br>/g, '<br/>')                                                                  // 2018-03-05
                                  .replace(/&nbsp;/g, ' ')                                                                    // 2017-04-23: replace HTML entities not valid in XML（若轉為 &#160; 後續處理因無法去除這空白，會比較麻煩）
                                  .replace(/&amp;#\(([0-9]+)\);/g, replaceMarkusCharCode)                                     // 2021-05-14
                                  .replace(/&#x(d[8-9a-b][0-9a-f]{2});&#x(d[c-f][0-9a-f]{2});/g, replaceUnicodeSurrogates)    // 2021-05-014
                                  .replace(/<[/]?font[^>]*>/g, '')                                                            // 2017-12-12: remove suspecious <font> tags (likely bugs of the newly MARKUS version)
                                  .replace(/\\b/g, ' ')                                                                       // 2017-09-02: Firefox reports error (if there is \b in the tag attribute) -- Chrome ok
                                  .replace(/<[/]?o:p>/g, '')                                                                  // 2017-09-02: special MS tags
                                  .replace(/<\/pb:[^>]+>/g, '')                                                               // 2018-05-05: removing mistaken closing tags from MARKUS
                                  .replace(/<pb:([^>]+)>/g, '<Pb Key="$1"></Pb>')                                             // 2018-05-05: for Kanripo page breaks
                                  .replace(/ & /, '');                                                                        // 2024-06-30

               // 2024-09-20: "&#xd852;" is an invalid XML character... (KangXi_QinShuiXianZhi_JuanZhiShiYi_YiWen_BuXiuXianChengLaiMaiJi.txt_markus_cor2.html)
               // 2025-05-24: &#d846; &#d862; &#d863 => 因為是字串形式，直接用 removeInvalidXmlChars() 並無法移除
               //contents = removeInvalidXmlChars(contents);
               
               // 2025-05-26: 改用以下版本...
               // 注意，即使已經「盡量」在 contents 移除不合法字元，utilities.js 的 appendAllChildren() 仍還需「重覆」移除不合法字元...
               contents = decodeAndRemoveInvalidXmlEntities(contents);

               var xmlDoc = tryParseXML(contents, f.name);                         // 2017-03-29: returns DOM object
               if (xmlDoc === null) return null;
               filesContent.push({content: contents, name: f.name.substring(0, f.name.lastIndexOf("."))});
         
               ++loadFinished;
               if (loadFinished === Object.keys(inFilesParam.entmarkusHtmlFiles).length) {
                  // 進行轉檔
                  // 2024-08-07: transfer() 會透過 GvarTransformResult 儲存結果，需加上 transferSuccFunc 處理後續事宜
                  transfer(inputFormat, outputFormat, filesContent, function() {
                     let docXml = GvarTransformResult[0].content;         // 包含 <ThdlPrototypeExport><corpus><feature_analysis><documents> 的完整 DocuXml！
                     GvarCorpusXmlList.push({ name: GvarTransformResult[0].name, content: docXml });
                     // 2025-01-18: 在螢幕上顯示目前已轉換的文獻集
                     let batchListId = "batchList" + "General";           // GlobalVar.userSelectEntmarkusOrComarkusFiles;
                     $("#" + batchListId).show();
                     var s = "";
                     GvarCorpusXmlList.map(function(data, index) {        // 對 comarkus 而言，單一目錄應該只有一份文獻集
                        s += "<li id='batch_" + GvarBatchEntry + "'>" + data.name + ": " + loadFinished + " entmarkus html</li>";
                     });
                     let batchImportedId = "batchImported" + "General";    // GlobalVar.userSelectEntmarkusOrComarkusFiles;
                     $("#" + batchImportedId).append(s);          // 2024-08-09
                     
                     // 2024-08-03: 步驟 (3)-(6)，接續處理其他檔案
                     addNewEmptyContentFiles(inFilesParam);
                     readMetadataJsonFiles(inFilesParam);
                     
                     hideProgressMsg();
                  });
               }
            }
            r.readAsText(f);
         }
      }
      else {
         // 沒有 Entmarkus .html 檔，只有 json 檔
         // 2024-12-19: 補上 batchList 項目
         $("#batchList").show();
         let corpus = $("#corpus").val();
         let s = "<li id='batch_" + GvarBatchEntry + "'>" + corpus + ": NO entmarkus html files</li>";
         $("#batchImported").append(s);          // 2024-08-09

         let emptyCorpus = "<ThdlPrototypeExport>"
                         + '<corpus name="' + $("#corpus").val() + '">'
                         + '</corpus>'
                         + '<documents>'
                         + '</documents>'
                         + '</ThdlPrototypeExport>';
         GvarCorpusXmlList.push({ name: $("#corpus").val(), content: emptyCorpus });
         addNewEmptyContentFiles(inFilesParam);
         readMetadataJsonFiles(inFilesParam);
                     
         hideProgressMsg();
      }
   }
   
   function addNewEmptyContentFiles(inFilesParam) {
      // 對「僅有 comarkus json 卻沒有 entmarkus html」的檔案，加上空的文件內容
      let lastCorpusXml = GvarCorpusXmlList.slice(-1)[0];     // {name, content}
      let corpusXml = lastCorpusXml.content;                  // string value (copy)
      let emptyDocList = [];
      inFilesParam.coNoEnt.forEach(function(fname) {                                // 注意，fname 不包含附檔名
         let msg = 'Input contains <div style="font-size:smaller">' + fname         // 2025-06-12
                 + '.json</div> but misses <div style="font-size:smaller">' + fname + '.html</div>'
                 + '<p/>';
         let s = '<document filename="' + fname + '" key="emptyContent">'           // 2025-07-18: 加上 key="emptyContent"
               + '<corpus>' + inFilesParam.corpusToBuild + '</corpus>'
               + '<doc_content>' + msg + '</doc_content>'
               + '</document>';
         emptyDocList.push(s);
      });
      if (emptyDocList.length > 0) {
         let p = corpusXml.indexOf("</documents>");
         if (p > 0) {
            lastCorpusXml.content = corpusXml.slice(0, p) 
                                  + "\r\n" + emptyDocList.join("\r\n") 
                                  + corpusXml.slice(p);
         }
         else console.log("Error: fail to add empty documents -- cannot find </documents>");
      }
      GvarStageDocuXml = lastCorpusXml.content;          // 注意：讀入檔案後，需將處理結果儲存在 GvarStageDocuXml
   }
   
   function readMetadataJsonFiles(inFilesParam) {
      // 2024-06-21: entmarkus 的 metadata 的 json files
      if (Object.keys(inFilesParam.entmarkusMetadataJsonFiles).length > 0) {     // 2024-08-07: 補上
         let jsonMetadataFinished = 0;
         for (let key in inFilesParam.entmarkusMetadataJsonFiles) {
            f = inFilesParam.entmarkusMetadataJsonFiles[key];
            // 注意：entmarkus 的 metadata 檔名是固定的 "xmarkus-metadata.json"，
            //       若讀入多個檔，會將其結果彙整到 GvarMetadataJsonDict
            var r = new FileReader();
            r.onload = function(e) {
   	         var contents = e.target.result.trim();
               let jsonObj = JSON.parse(contents);                     // {<filename.html>: {..., "place covered":[{"id":"hvd_40325","value":"漳平","type":"placeName"}], ... }
               //alert(JSON.stringify(jsonObj));
               
               let metadataJsonFilenames = Object.keys(jsonObj);       // xmarkus-metadata.json 最外層物件的 keys，<name>.html 表示 ENTMARKUS 檔名
               let firstPieceValue = '-';
               metadataJsonFilenames.forEach(function(fname) {
                  let docFilename = fname.substring(0, fname.lastIndexOf("."));         // 移除 .html 後綴
                  GvarMetadataJsonDict[docFilename] = jsonObj[fname];
                  if (Array.isArray(jsonObj[fname]["piece title"])) {
                     firstPieceValue = jsonObj[fname]["piece title"][0].value;          // 2024-08-11
                  }
               });
         
               ++jsonMetadataFinished;
               if (jsonMetadataFinished === Object.keys(inFilesParam.entmarkusMetadataJsonFiles).length) {
                  let s = ", " + jsonMetadataFinished + " metadata (" + firstPieceValue + "...)";
                  $("#batch_" + GvarBatchEntry).append(s);
                  //alert("batch --- " + JSON.stringify(GvarMetadataJsonDict));
                  readComarkusJsonFiles(inFilesParam);
               }
            }
            r.readAsText(f);
         }
      }
      else {
         // 2024-08-07: 防呆（處理沒有 metadata json 的狀況）
         readComarkusJsonFiles(inFilesParam);
      }
   }

   function readComarkusJsonFiles(inFilesParam) {       // inFilesParam.comarkusJsonFiles
      // 2024-04-09: comarkus 的 json files （對 Comarkus2D 而言，應可假設必然有 comarkus json）
      let jsonFinished = 0;
      for (let key in inFilesParam.comarkusJsonFiles) {
         let f = inFilesParam.comarkusJsonFiles[key];
         var r = new FileReader();
         r.onload = function(e) { 
   	      var contents = e.target.result.trim();
            //alert(contents);
            let filenameMain = f.name.substring(0, f.name.lastIndexOf("."));
            
            // 2025-02-19: 新版的 comarkus json 會是 { version, value } 物件，其中 value 是個陣列
            let jsonObj = JSON.parse(contents);
            if (typeof jsonObj === 'object' && !Array.isArray(jsonObj) && jsonObj !== null) {
               // 正常物件
               jsonObj = jsonObj.value;
               if (Array.isArray(jsonObj)) GvarJsonImports[filenameMain] = jsonObj;
               else alert("SKIP: " + f.name + " is not in a valid COMARKUS json format (obj.value is not an array of objects)");
            }
            else if (Array.isArray(jsonObj)) {           // 注意，有可能是空陣列 []
               GvarJsonImports[filenameMain] = jsonObj;
            }
            else {
               alert("SKIP: " + f.name + " is not in a valid COMARKUS json format!");
            }
      
            ++jsonFinished;
            if (jsonFinished === Object.keys(inFilesParam.comarkusJsonFiles).length) {
               //alert("Comarkus JSON files loaded: " + jsonFinished);
               $("#batch_" + GvarBatchEntry).append(", " + jsonFinished + " comarkus json");
               attachMetadataAndEvents();
            }
         }
         r.readAsText(f);
      }
      
      // 2024-09-21: 防呆（例如僅有 entmarkus html）
      if (Object.keys(inFilesParam.comarkusJsonFiles).length == 0) {
         //alert(GvarStageDocuXml);
         attachMetadataAndEvents();           // 防呆
         
         showNextStepInstruction();
      }
   }

   function insertComarkusEvents(xml) {
      var jqXmlDoc = $.parseXML('<?xml version="1.0"?>' + xml);            // returns XMLDocument
      var jqXml = $(jqXmlDoc);                                             // returns jQuery object
   
      // 檔案中的文件數量
      var jqDocumentNodes = jqXml.find("ThdlPrototypeExport > documents > document");
      jqDocumentNodes.each(function(idx, elem) {
         let filename = $(this).attr("filename");
         if (GvarJsonImports[filename]) {
            // attach data in GvarJsonImports[filename] to the document...
            //alert(filename + "\n" + JSON.stringify(GvarJsonImports[filename]));
            // 注意，<Events> 必須放在 <doc_content> 下
            attachComarkusData($(this), GvarJsonImports[filename]);
         }
         //console.log($(this).prop("outerHTML"));
      });
      //alert(jqDocumentNodes.length);

      // M2D 其實已經把文本內的 Udef 標籤加入 <feature_analysis>，只是若讀入多份檔案，
      // 將會產生（大量）重覆的 <tag> 設定
      // => 原先是直接將它們移除（假設使用者有 comarkus json 的 event tags，因此僅需後續
      //    將 comarkusFeatureAnalysisTags 加入後分類即可）
      // 2024-09-24: 加入 GvarTextUdef4TagAnalysis 設定，可保留文本中的 Udef 標籤設定
      // 2025-02-10: 移除 GvarTextUdef4TagAnalysis = $("#autoSetContentUdefTags").is(':checked');
      jqXml.find("ThdlPrototypeExport > corpus  > feature_analysis > tag")
           .each(function() {
         if (GvarTextUdef4TagAnalysis) {
            // 將標籤名稱以 GvarComarkusUdefTags[<tagName>] = 1 形式保存下來
            GvarComarkusUdefTags[$(this).attr("name")] = 1;
         }
      });
      //alert(JSON.stringify(GvarComarkusUdefTags));
      
      // 將 M2D 所產生的 <feature_analysis><tag> 全數移除
      jqXml.find("ThdlPrototypeExport > corpus  > feature_analysis > tag").remove();
      
      // 2024-04-15: 將 GvarComarkusUdefTags 的標籤，加入 <feature_analysis> 設定中
      let jqCorpusSettings = jqXml.find("ThdlPrototypeExport > corpus");
      let jqCorpusFeatureAnalysis = jqCorpusSettings.find("feature_analysis");

      // 2025-01-19: 防呆（例如在缺乏 Entmarkus html 狀況）
      if (jqCorpusFeatureAnalysis.length == 0) {
         jqCorpusSettings.append("<feature_analysis></feature_analysis>");
         jqCorpusFeatureAnalysis = jqCorpusSettings.find("feature_analysis");
      }
      
      let comarkusFeatureAnalysisTags = [];
      for (var key in GvarComarkusUdefTags) comarkusFeatureAnalysisTags.push(key);
      comarkusFeatureAnalysisTags = comarkusFeatureAnalysisTags.sort();              // 2025-07-16: 加上 sort()
      if (comarkusFeatureAnalysisTags.length > 0) {
         let tagsXmlList = [];
         for (var k=0; k<comarkusFeatureAnalysisTags.length; k++) {
            let tagName = comarkusFeatureAnalysisTags[k];
            let category = tagName;
            let subCategory = '-';
            // 2024-08-04: 針對 Udef_Evt_LOCATION 設定不同的 category/subCategory
            if (tagName.toLowerCase() == 'udef_evt_location') {
               category = 'Place';             // 注意大小寫必須是 Place
               subCategory = 'Event';
            }
            let tagXml = "<tag type='contentTagging' name='" + tagName + "' default_category='" 
                       + category + "' default_sub_category='" + subCategory + "'/>";
            jqCorpusFeatureAnalysis.append(tagXml);
         }
         //alert(jqCorpusFeatureAnalysis.html());
      }
      
      // 2024-08-05: <metadata_field_settings>
      // GvarMetadataFieldSettingDict
      // <metadata_field_settings>
      //    <author show_spotlight="Y" display_order="1">傳主</author>
      //    ...
      // </metadata_field_settings>
      let jqCorpusMetadataFieldSettings = jqCorpusSettings.find("metadata_field_settings");
      if (jqCorpusMetadataFieldSettings.length == 0) {
         jqCorpusSettings.prepend("<metadata_field_settings></metadata_field_settings>");
         jqCorpusMetadataFieldSettings = jqCorpusSettings.find("metadata_field_settings");
      }
      jqCorpusMetadataFieldSettings.empty();
      
      for (let corpusTagName in GvarMetadataFieldSettingDict) {
         let {tagContent, displayOrder} = GvarMetadataFieldSettingDict[corpusTagName];
         let s = "<" + corpusTagName + " show_spotlight='Y' display_order='" + displayOrder + "'>"
               + tagContent 
               + "</" + corpusTagName + ">";
         jqCorpusMetadataFieldSettings.append(s);
      }

      // (TODO): <feature_analysis> 的 <spotlight> 設定
      // 若要指定標籤後分類項目顯示的名稱，必須另外設定 <spotlight>
      // <spotlight category="Place" sub_category="Udef_Address" display_order="6" title="地址"/>
      
      // 2024-04-14: 將 jqXml 內容轉成 xml 字串
      xml = getDocuXmlString(jqXml);
      //let xmlObj = jqXml.find("ThdlPrototypeExport").get(0);
      //xml = (new XMLSerializer()).serializeToString(xmlObj);
      return xml;
   }

   function attachEntmarkusMetadata(xml) {
      // 2024-06-21: 套用 GvarMetadataJsonDict 的資訊
      //             => 加入文件的自訂 metadata <xml_metadata>，
      //                例如 "piece title":"熈寧橋記" 會被轉為 <Udef_DocMeta_Txt_piece_title>熈寧橋記</Udef_DocMeta_Txt_piece_title>
      //                （piece title 的 type "work" 並沒有儲存起來，若需要則日後可加到 @Type="work"）
      //             => 若 ENTMARKUS/COMARKUS 檔沒有 EVENT_SOURCE_TEXT，則後續 insertComarkusEvents() 會
      //                透過 attachComarkusData() 利用 <xml_metadata> 的 source_title:piece_title 填入 <title>
      //                例如
      //                  <ComarkusBundle Type="EVENT_SOURCE_TEXT">
      //                     <Udef_Evt_EVENT_SOURCE_TEXT RefId="#doc_title" MarkusId="#xml_metadata">政和縣志：熈寧橋記</Udef_Evt_EVENT_SOURCE_TEXT>
      //                  </ComarkusBundle>
      //             注意：因 DocuXml 是以文件作為單位，metadata json 檔的資訊必須經過適當轉換。
      //                   其中一些「額外」資訊，例如 type ('fullName', 'timePeriod', etc.)，可能在轉換過程遺失
      var jqXmlDoc = $.parseXML('<?xml version="1.0"?>' + xml);            // returns XMLDocument
      var jqXml = $(jqXmlDoc);   
      // returns jQuery object

      GvarMetadataFieldSettingDict = {};     // reset
   
      // 取得檔案中的所有文件節點
      var jqDocumentNodes = jqXml.find("ThdlPrototypeExport > documents > document");
      jqDocumentNodes.each(function(idx, elem) {
         let jqDocNode = $(this);
         let filename = $(this).attr("filename");
         
         // 2025-07-11: (bug fix) 若含有多個 paragraphs，filename 檔名可能會加上 _p0123 suffix
         //             若未移除這些 suffix，將會導致 GvarMetadataJsonDict[filename] 變成 undefined
         let origFilename = filename;
         let result = origFilename.match(/(.+)_p\d+$/);
         if (result) origFilename = result[1];

         //alert(filename + '\n' + origFilename + '\n' + JSON.stringify(GvarMetadataJsonDict[origFilename]));
         if (GvarMetadataJsonDict[origFilename]) {
            // 2025-10-21: 加上使用者指定的 "compilation_name"
            if (CopyDocMetaForPostClassification) {
               // 2026-02-27: bug fix -- 必須將空白換成底線（否則透過後分類查詢，空白會變成 AND delimiter）
               GvarSpecifiedCompilation = GvarSpecifiedCompilation.replace(/[ ]+/g,'_');
               
               let corpusTagName = 'compilation_name';
               let escapedVal = escapeHtml(GvarSpecifiedCompilation);          // 防呆
               jqDocNode.prepend(`<${corpusTagName}>${escapedVal}</${corpusTagName}>`);
               GvarMetadataFieldSettingDict[corpusTagName]= { "tagContent":"Compilation",
                                                              "displayOrder":"1" };
                                                              
               // 2025-11-18: 也在 <xml_metadata> 加入 <Udef_DocMeta_Compilation> 標籤（方便顯示於搜尋介面 metadata 區塊）
               // e.g., "place covered":[{"id":"hvd_40325","value":"漳平","type":"placeName"}
               let field = 'Compilation';
               GvarMetadataJsonDict[origFilename][field] = [{ id: GvarSpecifiedCompilation,
                                                              value: GvarSpecifiedCompilation,
                                                              type: '-'}];
            }
            
            // 2026-03-31         
            if (GlobalVar.addDocTnaTnbByEvtTime) {
               let corpusTagName = 'timeseq_not_before';
               GvarMetadataFieldSettingDict[corpusTagName]= { "tagContent":"EventYearBegin",    // TNB
                                                              "displayOrder":"9" };
               corpusTagName = 'timeseq_not_after';
               GvarMetadataFieldSettingDict[corpusTagName]= { "tagContent":"EventYearEnd",      // TNA
                                                              "displayOrder":"10" };
            }

            let sourceTitle = null, pieceTitle = null         // 若有這兩項，將它們組成文件的 <title>
            
            // attach data in GvarMetadataJsonDict[origFilename] to the document...
            let metadataFields = Object.keys(GvarMetadataJsonDict[origFilename]);
            //alert(JSON.stringify(metadataFields));
            
            let metaItems = [];
            metadataFields.forEach(function(field) {
               // 2024-07-01: shichan1 子目錄下的 xmarkus-metadata.json 有 bugs，多出一個 field 為空字串，內容 {id,value,type} 均為空的物件
               if (!field) return;           // 2024-07-01 防呆
               
               let tagName = convertToLegalTagName(field);                   // 將 "source title" 換成 "source_title"
               let objArray = GvarMetadataJsonDict[origFilename][field];     // array of {id, value, type}
               let objTypeArray = [];                                        // 2025-11-02: 儲存 objArray 每一項的 type

               if (!Array.isArray(objArray)) objArray = [objArray];          // 2024-06-30 防呆
               
               let valList = [];
               let origValList = [], extraValList = [];                  // 2024-08-04: origValList 不加上額外的括弧，extraValList 則僅放入括弧內容（不含括弧符號）
               objArray.forEach(function(obj) {
                  let objType = obj.type;                                // 2025-11-02: type 記錄 'work', 'fullName', 'placeName' 等，先略去
                  
                  let objVal = convertToLegalTagValue((obj.value || '-').trim());
                  objVal = replaceTagHierarchyDelimieter(objVal);        // 2025-07-20
                  let extraVal = '';
                  let concatedVal = objVal;
                  
                  if (obj.id) {
                     // 2024-08-04
                     let objIdVal = convertToLegalTagValue(obj.id);
                     objIdVal = replaceTagHierarchyDelimieter(objIdVal);         // 2025-07-20
                     if (objVal != objIdVal) {
                        concatedVal = objVal + "(" + objIdVal + ")";
                        extraVal = objIdVal;
                     }
                  }
                  origValList.push(objVal);
                  extraValList.push(extraVal);           // 注意：需和 origValList 有 1-1 對應

                  // 2025-07-17: 將 "公毓榘(公毓榘|fl1886|r蒙陰)" 的 '|' 置換成 ',' -- 避免後續檢索 query 會以為 '|' 代表 'OR'
                  let escapedVal = concatedVal.replace(/[\|]/g, ',');      
                  valList.push(escapedVal);

                  // 2025-11-19: COMARKUS 應該是用 'source title'，但 metadata JSON 經合併成新的 xmarkus-metadata.json，這合併檔可能會變成 'source_title' => 導致 sourceTitle 為 null
                  //             => 應可直接用 tagName 而非 field 來進行比對，e.g., (tagName === 'source_title')
                  if (!sourceTitle && ['source title','source_title'].includes(field)) sourceTitle = (obj.value || '-').trim();       // 取第一個 -- 但有可能 obj.value 為 null？
                  else if (!pieceTitle && ['piece title','piece_title'].includes(field)) pieceTitle = (obj.value || '-').trim();     // 取第一個
                  
                  objTypeArray.push(objType);
               });
               let udefTag = "<" + tagName + ">" + valList.join(';') + "</" + tagName + ">";

               // 2025-06-10: 若 GvarAddXmlMetadataToUdefMetaTags 為 true，則取代為 Udef_Meta_xyz，並加入後分類項目
               if (GvarAddXmlMetadataToUdefMetaTags) {
                  let udefMetaTag = (['Compilation'].includes(tagName))       // 2026-02-25: 'Compilation' 應屬於 Comarkus/Immarkus 可共用的 metadata 屬性，因此僅加上 'Udef_DocMeta_' 而非 'Udef_DocMeta_Txt_'
                                  ? 'Udef_DocMeta_' + tagName
                                  : GlobalVar.udefDocMetaPrefix + tagName;
                  GvarComarkusUdefTags[udefMetaTag] = 1;
                  udefTag = "<" + udefMetaTag + " Type='" + objTypeArray.join(';') + "'>"     // 2025-11-02: 補上 objType（未來可能會用到）
                          + valList.join(';')                                                 // e.g., field 'source title' 下是一個陣列
                          + "</" + udefMetaTag + ">";
               }
               metaItems.push(udefTag);
               
               if (CopyDocMetaForPostClassification) {
                  copyDocMeta4PostClassification(jqDocNode, tagName, origValList, extraValList);
               }
            });
            let udefMetadata = "\r\n<xml_metadata>" + metaItems.join("\r\n") + "</xml_metadata>\r\n";
            jqDocNode.prepend(udefMetadata);
            
            // 2024-06-21: 若有 "source title" 和 "piece title"，就將它們組起來取代文件的 <title>
            if (sourceTitle && pieceTitle) {
               let docTitle = (sourceTitle == pieceTitle)             // 2024-08-28: 如果相同，就只輸出 sourceTitle（避免產出 "-: -" 的標題）
                            ? sourceTitle
                            : sourceTitle + '：' + pieceTitle;        // 2025-07-17: 將 ': ' 改為 '：' 以避免後續困擾
               jqDocNode.find("title").remove();
               jqDocNode.prepend("<title>" + docTitle + "</title>");
            }
            
            // 2024-08-03: 若 <document> 下並沒有 <corpus>，則在此將其加上去...
            //             注意：在此其實不應直接取用 $("#corpus").val()，日後有機會應該重構一下（至少把 $("#corpus").val() 存入全域變數來取用）
            if (jqDocNode.find("corpus").length === 0) {
               jqDocNode.prepend("<corpus>" + $("#corpus").val() + "</corpus>");
            }
            
         }
         //console.log($(this).prop("outerHTML"));
      });

      // 2024-06-21: 轉出新的 xml
      xml = getDocuXmlString(jqXml);
      //let xmlObj = jqXml.find("ThdlPrototypeExport").get(0);
      //xml = (new XMLSerializer()).serializeToString(xmlObj);

      return xml;
   }

   function copyDocMeta4PostClassification(jqDocNode, tagName, origValList, extraValList) {
      // 2024-08-05: 將特定的 tagName 直接對應到後分類項目，儲存在 GvarMetadataFieldSettingDict）
      //             後續還需將 GvarMetadataFieldSettingDict 取出，進行 <metadata_field_setting> 設定
      // <xml_metadata>
      // <piece_title>浮橋記</piece_title> 
      // <piece_author>王之楫(王之楫|fl1828|r漳平)</piece_author> 
      // <piece_time>復月望日(公元1829年5月17日:清宣宗)</piece_time> 
      // <place_covered>漳平(hvd_40325)</place_covered> 
      // <source_title>漳平縣志</source_title> 
      // <source_author>-</source_author> 
      // <publication_place>-</publication_place> 
      // <publication_time>道光(1830)</publication_time> 
      // </xml_metadata>
      // 注意: 若要修改顯示名稱，必須透過 <spotlight> 標籤設定
      let corpusTagName = "UNDEF";
      if (tagName == 'source_title') {
         // 方志名稱 Gazetteer
         // 2025-10-21: 原先使用 compilation_name，改採 topic (doc_source 已經被 M2D 用來儲存匯入的檔名)
         corpusTagName = "topic";
         jqDocNode.prepend("<" + corpusTagName + ">" + origValList.join(';') + "</" + corpusTagName + ">");
         GvarMetadataFieldSettingDict[corpusTagName]= { "tagContent":"Data Source",         // 文件來源 (Gazetteer), cf. <title> 是 dataSource:pieceTitle
                                                        "displayOrder":"2" };
      }
      else if (tagName == 'piece_title') {
         // 題名 (title)
         corpusTagName = "docclass";
         jqDocNode.prepend("<" + corpusTagName + ">" + origValList.join(';') + "</" + corpusTagName + ">");
         GvarMetadataFieldSettingDict[corpusTagName] = { "tagContent":"Data Title",         // 文件題名    
                                                         "displayOrder":"6" };
      }
      if (tagName == "piece_time") {
         // 注意：這個時間不是出處的時間，而是文件「事件」的時間
         corpusTagName = "year_for_grouping";
         // 取出 extraValList 中非空的第一個值的「年份」 -- 如果找不到年份設為 9999
         let year_for_grouping = "9999";        // 標籤中，都是用字串
         extraValList.some(function(v) {
            let match = v.match(/公元(\d+)年/);
            if (match !== null) {
               year_for_grouping = match[1];
               return true;
            }
         });
         jqDocNode.prepend("<" + corpusTagName + ">" + year_for_grouping + "</" + corpusTagName + ">");
         GvarMetadataFieldSettingDict[corpusTagName] = { "tagContent":"Year",        // 第一起事件年份 (Year of the First Event)
                                                         "displayOrder":"3" }; 
      }
      else if (tagName == "piece_author") {
         corpusTagName = "author";
         jqDocNode.prepend("<" + corpusTagName + ">" + origValList.join(';') + "</" + corpusTagName + ">");
         GvarMetadataFieldSettingDict[corpusTagName] = { "tagContent":"Author",      // 事件作者 (2025-02-10 revise 為 "Author")
                                                         "displayOrder":"4" };
      }
      else if (tagName == 'place_covered') {
         // DocuSky 的 metadata 後分類並不支援地名規範庫 id，僅支援地點的 (x,y) 座標...
         // 注意：和 <year_for_grouping> 不同，這裡的地點可能會串接起多個地名
         // 2025-06-06: 改採 geo_level1 （先前是採用 doctype -- 當初的顧慮在於不是單一地點）
         corpusTagName = "geo_level1";
         jqDocNode.prepend("<" + corpusTagName + ">" + origValList.join(';') + "</" + corpusTagName + ">");
         GvarMetadataFieldSettingDict[corpusTagName] = { "tagContent":"Place Covered",            // 事件地點 (2025-02-10 revise 為 "Place Covered")
                                                         "displayOrder":"5" };
      }
      //else if ... doctype
   }

   // --------------------------------------------------------------------------
   
   function attachComarkusData(jqDocNode, comarkusJson) {
      // 2024-04-13: comarkusJson must be an array of "bundle"
      //             each combo is an object with an uppercased name and value (as well as an id:<combo_id>)
      //             { type, id, text, markus_id }     （X-MARKUS 似乎就固定是這幾個欄位，但 COMARKUS 很可能有擴充）
      //             type      => tag Udef_Evt_<type>  （注意，必須將 type 中非合法標籤字元都進行替換）
      //             id        => @RefId="<id>"         (of tag Udef_Evt_<type>)
      //             text      => text of tag Udef_Evt_<type>
      //             markus_id => @MarkusId
      //             <others>  => @Comarkus_<others> (如果有擴充的話...)
      // example: (2024-06-04 modified, 2024-06-06 fixed)
      // <Events [@Name]>
      //   <Event [@Name]>
      //      <Udef_Event_Element>TIME/BEGIN/庚戍春</Udef_Event_Element>           <-- 有些擔心事件數量超過系統限制，導致 CatTree 無法完整呈現...
      //      <Udef_Event_Element>TIME/END/秋</Udef_Event_Element>                 <-- delimiter '/' 是為了讓此標籤日後可相容於 CatTree
      //      ...
      //      ...
      //      <ComarkusBundle Type="TIME">
      //         <Udef_Evt_TIME RefId="公元1610年:明神宗" MarkusId="3a6db523-442c-4651-9f1e-f3661fcfe2de" Type="BEGIN">BEGIN:庚戍春</Udef_Evt_TIME>
      //         <Udef_Evt_TIME RefId="公元1610年:明神宗" MarkusId="a7be7d72-9455-423b-976a-e2874962f16e" Type="BEGIN">END:秋</Udef_Evt_TIME>
      //      </ComarkusBundle>
      //      <ComarkusBundle Type="OBJECT_LENGTH">
      //            ...
      //      </ComarkusBundle>
      //      <ComarkusBundle Type="OBJECT_PART">
      //            ...
      //      </ComarkusBundle>
      //      ... 
      //   </Event>
      // </Events>
      //
      // 2024-06-23: 若 bundle name 為 "OBJ_PART_LINKED"，bunndle array 的 element 內容將會是 
      //             sub-bundles 物件（多出一層）...
      
      let jqContentNode = jqDocNode.find("doc_content").first();

      // 2024-06-04: 加上 <Udef_Event_Element>
      GvarComarkusUdefTags['Udef_Event_Element'] = 1;
      
      // 2025-01-18: convertComarkusBundle2Xml() 會將 extra udef event tags 填入 GvarExtraUdefEventTags
      let comarkusEvents = [];
      comarkusJson.forEach(function(bundle, comarkusIdx) {
         GvarExtraUdefEventTags = [];                      // reset (2025-01-18 移入 comarkusJson)
         let comarkusBundles = [];
         for (let key in bundle) {
            if (key == 'OBJ_PART_LINKED' || key == 'MATERIAL_LINKED') {
               // 2024-06-24: 注意，若有多於一種 key 需 bundleGroup，那麼同一篇文件的 groupKey 就可能並非唯一
               // 2024-10-25: MATERIAL_LINKED 也有類似狀況... （或許 XXX_LINKED 都有類似結構？ 相關資訊似乎是放在 rules.json 的 nestedSchema）
               let bundleGroup = bundle[key];
               bundleGroup.forEach(function(bgroup, idx) {
                  let comarkusBundleGroup = [];
                  for (let subkey in bgroup) {          // 目前的例子，似乎沒有 id 欄... (subkey != 'id')
                     let s = convertComarkusBundle2Xml(bgroup[subkey], subkey, false);    // 不包含外圍的 <ComarkusBundle>
                     comarkusBundleGroup.push(s);
                  }
                  
                  let t = '<ComarkusBundle Type="' + convertToLegalTagAttrValue(key) + '">'
                        + comarkusBundleGroup.join("\n")
                        + '</ComarkusBundle>';
                  comarkusBundles.push(t);
               });
            }
            else if (key !== 'id') {
               comarkusBundles.push(convertComarkusBundle2Xml(bundle[key], key));
            }
         }
         
         let s = '<Event ComarkusId="' + bundle['id'] + '" Key="Event:' + comarkusIdx + '">'       // 2024-06-23: 加上 Key
               + comarkusBundles.join("\n")
               + GvarExtraUdefEventTags.join("\n")            // 2025-01-18
               + "</Event>";
         comarkusEvents.push(s);
      });
      
      let jqContentEvents = jqContentNode.find("Events");
      if (jqContentEvents.length == 0) jqContentNode.append("<Events></Events>");
      
      jqContentEvents = jqContentNode.find("Events");
      jqContentEvents.append(comarkusEvents.join("\n"));
      
      // 2024-06-24: 檢查是否有 EVENT_SOURCE_TEXT，若沒有則嘗試補上
      // 2024-10-07: 注意，metadata 中只有 EVENT_SOURCE_TEXT 會被加入 <Event> 中...
      //             也就是說，目前作者資訊並沒被加入 <Event> 中！
      if (jqContentEvents.find("ComarkusBundle[Type='EVENT_SOURCE_TEXT']").length == 0) {
         jqContentNode.parent().find("title").each(function() {
            // 若有 <xml_metadata>，則會利用 source_title:piece_title 填入 <title>
            let docTitle = $(this).text();
            // 將 EVENT_SOURCE_TEXT 加入 event
            // e.g., <ComarkusBundle Type="EVENT_SOURCE_TEXT">
            //          <Udef_Evt_EVENT_SOURCE_TEXT RefId="#doc_title" MarkusId="#xml_metadata">續修咸陽縣志: 重修咸陽縣城碑記</Udef_Evt_EVENT_SOURCE_TEXT>
            //       </ComarkusBundle>
            let s = '<ComarkusBundle Type="EVENT_SOURCE_TEXT">'
                  + '<Udef_Evt_EVENT_SOURCE_TEXT RefId="#doc_title" MarkusId="#xml_metadata">' + docTitle + '</Udef_Evt_EVENT_SOURCE_TEXT>'
                  // + (other metadata as udef tags, if necessary)
                  + '</ComarkusBundle>';
            jqContentEvents.find("Event").prepend(s);     // 注意：每個 <Event> 都要加上一份 EVENT_SOURCE_TEXT
         });
      }
      
      //jqContentEvents.append(GvarExtraUdefEventTags.join("\n"));          // 2024-06-04 (2025-01-18 移入 <Event>)
      //console.log(jqContentNode.prop("outerHTML"));
      
      // 2025-02-28
      if (GvarAddYearBlock2NewUdefTags) {
         const spanList = [10, 50, 100];
         if (jqDocNode.find("year_for_grouping").length > 0) {
            let adYear = parseInt(jqDocNode.find("year_for_grouping").first().text());
            spanList.forEach(function(v) {
               let timeBlockTag = 'Udef_Event_Extra_' + v.toString().padStart(3,'0') + 'Y';
               let yearBlock = '-';
               if (adYear !== 9999 && adYear !== -9999) {
                  let periodStart = Math.floor(adYear / v) * v;
                  yearBlock = periodStart.toString().padStart(4,'0') + '-' + (periodStart + v - 1).toString().padStart(4,'0');
               }
               let newTagContent = '<' + timeBlockTag + '>' + yearBlock + '</' + timeBlockTag + '>';
               jqContentEvents.append(newTagContent);
               GvarComarkusUdefTags[timeBlockTag] = 1;         
            });
            //alert(JSON.stringify(jqEvents.html()));
         }
      }
      //alert(Object.keys(GvarComarkusUdefTags));
   }
   
   function convertComarkusBundle2Xml(comarkusBundle, bundleKey, enclosingTag = true) {
      // comarkus json 第一層是個陣列，陣列的每個元素代表一個事件，然後該事件是一個物件，包含多組 comarkusBundles
      // bundleKey 是 'OBJECT_MAIN', 'LOCATION', 'INITIATOR', 'SPONSOR', 'OBJ_PART' ...
      // { key1:{type, id, text, markus_id}, key2:{type, id, text, markus_id}, ... }
      // 當 bundleKey 為 'OBJECT_PART_LINKED'，狀況可能變複雜：
      // 例如 "OBJ_PART_LINKED":[{"OBJ_PART":[{"markus_id":"282ae48c-f4f0-4a96-a562-d8e4fd83b40c","text":"礅","id":"pier","type":"obj_part"}],
      //                          "OBJ_PART_QUANT":[{"markus_id":"5c776400-0044-4f01-bc85-1735e5d8200b","text":"十有八","id":"18墩","type":"obj_part_quant"}]}, 
      //                         {"MATERIAL":[...], ... },
      //                        ...]
      // 若有 "type" 值（例如 type:obj_part），這 type 值 (obj_part) 會被加入標籤值，產生 obj_part/pier/礅
      // 也就是說，若有 type 則標籤值為 <type>/<id>/<text>，若沒有 type 則標籤值會是 <id>/<text>

      // 將一組 key:{type, id, text, markus_id} 稱為一個 ComarkusBundle
      
      // For bundleKey:{ type, id, text, markus_id }  （COMARKUS 目前似乎就固定是這幾個欄位...）
      // => tag: Udef_Evt_<bundleKey>                 （注意，必須將 bundleKey 中非合法標籤字元都進行替換）
      // type      => tag value <type>:<text>         （目前 type 應該為 "wall", "bridge". "road" 其中之一，但有時 json 檔會誤標為 "object" 等其他值）
      // id        => @RefId="<id>" of tag Udef_Evt_<type>
      // text      => use <type>/<id>/text as the tag value of Udef_Evt_<bundleKey> (2025-02-10)
      // markus_id => @MarkusId
      // <others>  => @Comarkus_<others> (如果有的話...)
      // 2024-04-13: EVENT_SOURCE_TEXT, OBJECT_MAIN 等項目，可能不會有 type...

      let xmarkusAttrs = ['type', 'id', 'text', 'markus_id'];
      let itemXmlList = [];
      
      if (!Array.isArray(comarkusBundle)) {            // 2024-06-30: 防呆
         console.log("MissingBundleKey: comarkus bundle is of type " + typeof(comarkusBundle) + " (should be an array)");
         //alert(JSON.stringify(comarkusBundle));        // "8932e026-f290-4f1b-9ed7-f87e2cb08163", or "柱", etc.
         comarkusBundle = [{ bundleKey: comarkusBundle}];
         bundleKey = 'MissingBundleKey';
         if (GvarSkipMissingBundleKey) return '';      // 2025-07-12: 避免 DocuXml 產生冗餘的 <Udef_Evt_MissingBundleKey>
      }
      
      comarkusBundle.forEach(function(item) {
         // 2027-07-20: 雖然目前 item['id'] 和 item['type'] 都不會包含 '/'，但為了防呆還是在此將 '/' 取代掉
         item['id'] = replaceTagHierarchyDelimieter(item['id']);        // 若值 undefined 會回傳 ''
         item['type'] = replaceTagHierarchyDelimieter(item['type']);    // 若值 undefined 會回傳 ''
         item['text'] = replaceTagHierarchyDelimieter(item['text']);    // 若值 undefined 會回傳 ''
         
         let tagName = 'Udef_Undefined';
         if (!item['type']) {   // type 缺值（JSON 沒有 type 欄位）
            // 2024-04-28: 加上 convertToLegalTagName()
            tagName = "Udef_Evt_" + convertToLegalTagName(bundleKey);     // 2024-06-04: 以 bundleKey 作為標籤 suffix
            //console.log("warning: " + bundleKey + " has no 'type' attribute");        // 2024-04-21: 只是記錄，不影響後續轉換
         }
         else {                 // type 有值
            // 注意：目前僅當 type 有值，才會額外加上 Udef_Align_OBJECT 標籤，其值是 OBJECT_MAIN/<type> 或 OBJ_PART/<id>
            tagName = "Udef_Evt_" + convertToLegalTagName(bundleKey);
            // 2025-06-18: 若 bundleKey 為 OBJECT_MAIN，則另行加上 Udef_Align_{key}
            //             目前 OBJECT_MAIN 會有三種值 wall, bridge, road，在此「寫死」對應到 IMMARKUS 的 city_wall, bridge, road
            //             唉，要從 COMARKUS 對應到 IMMARKUS，看來得 hard code 許多東西...
            let tagForAlignment = { 'OBJECT_MAIN': 'OBJECT',    // Udef_Align_OBJECT (Udef_Align_${tagForAlignment[tag]}) 是目前唯一可用來和 IMMARKUS 相連的標籤
                                    'OBJ_PART': 'OBJECT' 
                                  };           
            let c2iTermMapping = { 'wall': 'city_wall',                  // 2025-06-20: hard code 寫死
                                   'outer_wall': 'city_wall_outer_wall',
                                   'gate': 'city_wall_gate',
                                   'water_gate': 'city_wall_watergate',
                                   'watch_tower': 'city_wall_watchtower',
                                 }
            if (tagForAlignment[bundleKey]) {      // 2025-06-20: bundleKey 為 OBJECT_MAIN 或 OBJ_PART
               //alert(JSON.stringify(item));
               let val = item['type'];             // for (bundleKey == 'OBJECT_MAIN')
               if (bundleKey == 'OBJECT_MAIN') val = item['type'];
               else if (bundleKey == 'OBJ_PART') val = item['id'];
               if (c2iTermMapping[val]) val = c2iTermMapping[val];      // e.g., 將原值 'wall' 轉成 'city_wall' 輸出
               let val2 = bundleKey + '/' + val;
               
               // 2025-12-05: 先前竟然沒有將 align tag 加入 GvarComarkusUdefTags？
               let alignTagName = "Udef_Align_" + tagForAlignment[bundleKey];
               tag = `<${alignTagName}>${val2}</${alignTagName}>`;
               itemXmlList.push(tag);
               GvarComarkusUdefTags[alignTagName] = 1;                  // 2025-12-05: 記錄用到的 Udef 標籤（corpus parameters 設定用）
               
               // 2026-01-23: 後續工具 (XA/VizTool) 也需進行相關處理（透過 @Term 顯示 spotlight cue）
               if (GlobalVar.enableExtraAlignObjectId && bundleKey == 'OBJECT_MAIN') {     // 僅處理 OBJECT_MAIN 的項目（注意，需和 I2D 轉出同步）
                  //alignTagName = "Udef_Align_" + tagForAlignment[bundleKey] + "_ID";
                  alignTagName = "Udef_Align_" + convertToLegalTagName(val) + "_ID";       // 2026-01-30: e.g., Udef_Align_city_wall_ID
                  let term = item.id;                                                      // 2026-01-30
                  let tagVal = (GlobalVar.fixAlignObjectId2Event) ? 'Event' : item.type;   // 標籤內容，COMARKUS 用 'Event'，IMMARKUS 用 'Image'
                  tag = `<${alignTagName} Term="${term}">${tagVal}</${alignTagName}>`;     // 注意：@Term 通常是 tag value 的 norm/id
                  itemXmlList.push(tag);
                  GvarComarkusUdefTags[alignTagName] = 1;                                  // 2026-01-30: 記錄用到的 Udef 標籤（corpus parameters 設定用）
               }
            }
         }
         GvarComarkusUdefTags[tagName] = 1;                              // 2024-04-15: 記錄用到的 Udef 標籤（corpus parameters 設定用）
         
         let tagAttrs = [];
         if (!item['markus_id']) console.log(bundleKey + " has no 'markus_id' -- no @MarkusId generated");
         else tagAttrs.push('MarkusId="' + convertToLegalTagAttrValue(item['markus_id']) + '"');

         // 注意：這裡的 RefId 和文本的 RefId 之間並不能直接進行對應（需經過一些計算後才能對應）
         //       例如，文本的人時地 RefId 沒有 'markus_' 前綴，Udef 標籤的 RefId 有加上 'markus_' 前綴
         //       此外，comarkus json 的 id 可能會出現 '范諫|fl1568|r東明' 或 '朱文科|fl1568|o東明' 之類包含額外訊息的值
         let tagText = "";
         if (!item['id']) {
            // 2025-02-10: 若沒有 id 則使用 '-' 做為 id
            console.log(bundleKey + " has no 'id' -- use '-' as @RefId");
            item['id'] = '-';
         }
         
         if (!item['text']) {
            console.log(bundleKey + " has no 'text' -- no tag text generated");
            item['text'] = '-';
         }
         
         // 至此可假設 item['id'], item['type'], item['text'] 都有字串值...
         // 2025-11-21: 農堯報錯，"GuangXu_NingJinXianZhi_JuanYi_QiaoLiang_YuZhiYing_ChongXiuTongDeQiaoJi.txt_markus_cor2_p_E00" 會產生 
         //                       <Udef_Event_Element>LOCATION/placeName/hvd_88036/
	      //                       寧津</Udef_Event_Element>
         //             也就是 "hvd_88036/" 和 "寧津" 之間竟然跑出換行字元...
         //             => 在先前的防呆檢查後，還需加上 .trim() 繼續防呆
         item['id'] = item['id'].trim();
         item['type'] = item['type'].trim();
         item['text'] = item['text'].trim();

         if (item['type']) {
            // 2024-06-09: 先前 <type> 和 <text> 之間用 ':' 串接，但後分類預設規則 <term>:<refid> 也是用 ':' 串接，如此會產生混淆，因此改用 '/'
            let delimiter = '/';
            tagText += item['type'] + delimiter;             // 檢索頁可能也需修改（將直接從 '<type>/<text>' 取得 type，而不需額外加上 Type 屬性？）
            //tagAttrs.push('Type="' + convertToLegalTagAttrValue(item['type']) + '"');    
         }
         
         tagAttrs.push('RefId="' + convertToLegalTagAttrValue(item['id']) + '"');

         // 2025-02-11: 加入 GvarInsertTagId2TagText 控制要將 id 放入 RefId 或是 tag text
         if (GvarInsertTagId2TagText) {
            item['text'] = item['id'] + '/' + item['text'];                  // 2025-02-10: 注意，在此將 id 做為前綴加入 text 內容
         }

         tagText = convertToLegalTagValue(tagText + item['text']);        // 2024-06-04

         // 檢查是否還有其他欄位 -- 若有則通通算作「額外」屬性
         for (let subkey in item) {
            if (!xmarkusAttrs.includes(subkey)) {
               tagAttrs.push('Comarkus_' + convertToLegalAttrName(subkey) + '="' + convertToLegalTagAttrValue(item[subkey]) + '"');
            }
         }
         
         let tagAttrStr = tagAttrs.join(' ');
         
         // 以下的 tagName, tagAttrStr, tagText 都應已處理過（僅包含合法字元）
         let s = "<" + tagName + " " + tagAttrStr + ">" + tagText + "</" + tagName + ">";
         itemXmlList.push(s);
         
         // 2024-09-22: 如果 tagText 為 x/y/z 形式，或許可新增標籤 (<tagName>_Genre)，內容值為 x
         //             注意：若有加上這樣的標籤，也需將該標籤名稱加入 GvarExtraUdefEventTags
         //                   以下的 tagName, tagText 應僅包含合法字元
         if (GvarExtraGenreUdefTags) {
            // 2025-01-18: Hilde 希望能透過完整的階層來進行 searching and filtering，所以將各階層都設定一個後分類
            let tagHierarchy = tagText.split('/');
            let levels = tagHierarchy.length;
            if (levels > 1) {
               for (let i=0; i<levels-1; i++) {         // 2025-07-31: 改 levels-1 -- 應該僅需到 tagHierarchy.length-1（最後一層的內容就是 tag 值）
                  let genreLevel = i + 1;
                  let timeBlockTagName = tagName + ".GenreL" + genreLevel;
                  let topLevelStr = tagHierarchy.slice(0, genreLevel).join('/');
                  // 2025-01-15: 原先是 <tag>${matches[1]}</tag>，現在改 <tag Term="${matches[1]}">${matches[2]}</tag>
                  if (GvarExtraGenreUdefTagWithTerm) {
                     s = "<" + timeBlockTagName + ' Term="' + matches[levels-1] + '">' + topLevelStr + "</" + timeBlockTagName + ">";
                  }
                  else {
                     s = "<" + timeBlockTagName + ">" + topLevelStr + "</" + timeBlockTagName + ">";
                  }
                  GvarExtraUdefEventTags.push(s);
                  GvarComarkusUdefTags[timeBlockTagName] = 1;
               }
            }
         }
         
         // 2024-06-04: 將 <Udef_Event_Element> 加入 GvarExtraUdefEventTags
         // 2024-10-07: <Udef_Event_Element> 應包含所有 <Udef_Evt_XXX> 的值...
         // 2025-02-11: bundleKey 後的 delimiter 考慮使用 '@' -- 但只有 Udef_Event_Element 會有 bundleKey (tagName)，若將此標籤當成「特例」也無妨...
         let t = bundleKey + '/';                 
         if (item['type']) t += item['type'] + '/';
         s = "<Udef_Event_Element>" 
           + convertToLegalTagValue(t + item['text'])
           + "</Udef_Event_Element>";
         GvarExtraUdefEventTags.push(s);
      });      // end of comarkusBundle
      //alert(JSON.stringify(itemXmlList));
      
      let ret = (enclosingTag ? '<ComarkusBundle Type="' + convertToLegalTagAttrValue(bundleKey) + '">' : '')
              + itemXmlList.join("\n")
              + (enclosingTag ? '</ComarkusBundle>' : '');
      return ret;
   }
   
   // ------------------------------------------------------------------------------------------
   
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
      // 2024-08-04: 需轉成字串（防呆）！
      return s.toString();
   }
   
   function replaceTagHierarchyDelimieter(s, replaceTo='_') {
      // 2025-07-22: 避免 s 中出現代表層級的 '/'（將它置換為 '_'）
      //             例如，Sichuan_Road 檔案中會出現 "三之一" 被標記為 "markus_+1/3" 的狀況...
      if (!s) return '';                // 注意有時 s 會是 undefined！
      return s.replace(/[\/]/g, replaceTo);
   }
   
   // -------------------------------
   //      supporting functions
   // -------------------------------

   function escapeFilename(filename) {
      return filename.replace(/[&]+/g,'_');           // 2025-08-18: (bug fix) 不能將多個 '_' 換成單一 '_'，可能會造成 .html 和 .json 檔名不一致（若檔名包含連續的多個底線）
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

   // 2025-05-27   
   function showNextStepInstruction() {
      // 2025-01-18: 需判斷是否在 file: 協定下，若是則採用 "ChildIframe"，否則採用 "Independent"
      let nextStepKey = (InXmarkusLocalMode) ? "ChildIframe" : "Independent";
      let nextInstId = "nextStepInstructions" + nextStepKey;
      $("#" + nextInstId).fadeIn(1000);
   }

   // ------------------------------------------------------------------------------------------
   
   var docuSkyObj = null;
   var myVar = {};

   function widgetLoadSuccFunc() {
      // 雖然 Comarkus2D 不需透過 widget 下載 DocuSky 文本，但可能還是需要上載建庫
      // hide the widget, and then do uploading
      docuSkyObj.hideWidget();
      
      // 2024-08-07: GvarFinalDocuXml 已經是最後的 DocuXml 了
      //var result = merge[outputFormat](GvarCorpusXmlList, false);     // don't replace corpus
      //var xml = result[0].content;
      //xml = attachEntmarkusMetadata(xml);              // 2024-08-07: 加上 entmarkus metadata json 的資料
      //xml = insertComarkusEvents(xml);                 // 2024-08-07: 加上 comarkus json 的資料
      
      if (GvarFinalDocuXml) xml = GvarFinalDocuXml;    // 2024-08-03: 轉換過後的 DocuXml
      else {
         alert("Error: no DocuXml to upload");
         return;
      }
   
      var dbTitle = $("#dbTitle").val().trim();
      if (dbTitle === '') dbTitle = (new Date()).yyyymmdd() + '-db';
      var filename = dbTitle + '.xml';
      
      var url = docuSkyObj.urlUploadXmlFilesToBuildDbJson;     // 2018-01-30
      var formData = { dummy: {name: 'dbTitleForImport', value: dbTitle }};
      var nameVal = 'importedFiles[]';      // <input type="file" name="importedFiles[]" ...>
      formData['file'] = {value: xml, filename: filename, name:nameVal};
      //alert(JSON.stringify(formData));
      myVar.uploadProgressId = docuSkyObj.uploadProgressId;
      docuSkyObj.uploadProgressId = 'myUploadProgressId';     // 在此硬改掉 uploadProgressId，成功上載後再覆蓋回來 
      $("#myUploadProgressId").show();
      
      docuSkyObj.uploadMultipart(url, formData, succUploadFun);
   }
   
   function succUploadFun(serverMsg) {
      // 放回原先的 uploadProgressId
      docuSkyObj.uploadProgressId = myVar.uploadProgressId;
      $("#myUploadProgressId").hide();
      if (serverMsg.code == 0) alert(serverMsg.message);
   }

   function getUrlQueryParameter(url, key) {       // get url query parameters
      key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
     var match = url.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
     return match && decodeURIComponent(match[1].replace(/\+/g, " "));
   }

   // 2024-09-20: for debugging (code from ChatGPT)
   function saveStringToLocalFile(filename, content) {
       const blob = new Blob([content], { type: 'text/plain' });
       const url = URL.createObjectURL(blob);
       
       const a = document.createElement('a');
       a.href = url;
       a.download = filename;
       document.body.appendChild(a);
       a.click();
       
       // 釋放物件 URL
       URL.revokeObjectURL(url);
       document.body.removeChild(a);
   }

   function getDocuXmlString(jqXml) {
      let xmlObj = jqXml.find("ThdlPrototypeExport").get(0);
      let xml = (new XMLSerializer()).serializeToString(xmlObj);
      
      // 2026-03-02: 在每篇文件「適當處」加上換行，讓 xml 比較容易閱讀些...
      xml = xml.replace(/\r\n?/g, "\n")             // 統一換行符號
               .replace(/\s*(<\/?document>|<\/?doc_content>|<\/?Paragraph>|<\/?Comment>)\s*/g, "\n$1\n")
               .replace(/<br\/?>/g, "<br/>\n")
               .replace(/\n{2,}/g, "\n");           // 去除多餘空行

      return xml;
   }
   
   $(document).ready(function() { 
      var me = this;
      docuSkyObj = docuskyManageDbListSimpleUI;
      
      // 2024-08-25: 只有在定義 window.DocuSkyHost（正確引入 js/DocuSky.connectivity.js）後，才顯示 DocuSky 相關的功能與訊息
      if (EnableDocuSkyConnectivity && window.DocuSkyHost) {       // 2024-09-01: 加入 EnableDocuSkyConnectivity 檢查
         $(".disableDocuSkyConnectivity").removeAttr("disableDocuSkyConnectivity").show();
         let s = "open DocuSky in a new window";
         $("#linkToDocuSky").html(s);
         $("#linkToDocuSky").click(function() {
            window.open(window.DocuSkyHost, "_blank");
         });
      }
   
      $("#buildDbImmediately").click(function(e) {
         // 2: 哎哎，上載資料的程式，竟然被放在 widgetLoadSuccFunc 中...
         docuSkyObj.manageDbList(e, widgetLoadSuccFunc);
      });

      // 以下處理段落的部分，Comarkus2D 應該沒用到（先保留，或許未來會需要...）
      $("#inputParagraphAsDoc").click(function() {
         $("#divParagraphToDocOption").toggle();
         GvarPassageToDoc = ($("#divParagraphToDocOption:checked").length > 0) ? 'default' : false;     // 2018-05-05
         if (GvarPassageToDoc) {     // 2017-07-03
            if (GvarPassageToDoc === 'default') $('input:radio[name="radioParagraphToDoc"]').filter('[value="1"]').attr('checked', true);
            else if (GvarPassageToDoc === 'passageId') $('input:radio[name="radioParagraphToDoc"]').filter('[value="2"]').attr('checked', true);
            $("#divParagraphToDocOption").show();
         }
      });
      
      $("#personNameTagIdAsFeature").prop("checked",GvarThdlExport['personNameTagIdAsFeature']);
      $("#placeNameTagIdAsFeature").prop("checked",GvarThdlExport['placeNameTagIdAsFeature']);
      $("#datetimeTagIdAsFeature").prop("checked",GvarThdlExport['datetimeTagIdAsFeature']);
      $("#udefTagIdAsFeature").prop("checked",GvarThdlExport['udefTagIdAsFeature']);
      $("#inputParagraphAsDoc").prop("checked", (GvarPassageToDoc!==false));
      if (GvarPassageToDoc) {     // 2017-07-03
         if (GvarPassageToDoc === 'default') $('input:radio[name="radioParagraphToDoc"]').filter('[value="1"]').attr('checked', true);
         else if (GvarPassageToDoc === 'passageId') $('input:radio[name="radioParagraphToDoc"]').filter('[value="2"]').attr('checked', true);
         $("#divParagraphToDocOption").show();
      }

   });

   // -----------------------------
   //        UI functions
   // -----------------------------
   
   $("#butPass2XmarkusAnalyzer").click(function() {
      doPostMessage("Comarkus2D", "XmarkusAnalyzer", GvarFinalDocuXml);
   });
   
   $("#butPass2EventRelLite").click(function() {
      doPostMessage("Comarkus2D", "EventRelLite", GvarFinalDocuXml);
   });

   $("#refreshComarkus2D").click(function() {
      // 2024-12-25
      window.location.reload();
   });
   
   //$("button.continueBuilding").click(function() {
   //   // 2024-12-20
   //   $("#fileselect").click();
   //});
   
   $("#butNextAddMoreFiles").click(function() {     // 2025-06-07
      $("#fileselect").click();
   });
   
   $("#butNextGoSearch").click(function() {         
      // 2025-06-07: 新版的介面不再需透過 converting page -> root page -> C2D page，可直接傳訊給 root page 說要接 XA
      doPostMessage("Comarkus2D", "XmarkusAnalyzer", GvarFinalDocuXml);
   });
   
   $("#butNextDownload").click(function() {         // 2025-06-07
      $("#saveFile").click();
   });
   
   $("#butNextMergeDatabase").click(function() {
      // 2026-07-28
      doPostMessage("Comarkus2D", "DocuMerger", GvarFinalDocuXml);     // 可直接貼出 finalDocuXml（不必重新計算）
   });
   
   $("span.linkToApp").click(function() {
      // 2024-12-20
      let appName = $(this).attr("key");
      //alert(appName);
      let url = GvarLinkToApp[appName];
      
      let protocol = location.protocol;             // e.g., "http:", "https:", "file:"
      //alert(protocol);
      
      // 注意：由於 "file:" protocol 會被視為 anonymous origin，嘗試修改 parent 物件的內容
      //       會因 XSS (cross-site scripting) 理由而被瀏覽器拒絕（Access to property denied）
      //       不能列印或修改物件內容，但似乎可以透過 postMessage 傳遞訊息...？
      //try {
         if (parent && parent.location.href!=location.href) {
            //parent.postMessage({test:"xyz"}, "*");
            //alert(protocol + ':' + parent);
            parent.location = url;
         }
         else window.open(url, appName);
      //} catch(e) {
      //   window.open(url, appName);
      //}
   });
   
   $("#passDocuXmlByPostMessage").click(function() {
      // 2024-10-26
      let newWindow = window.open('EventRelLite.html', '_blank');
      //newWindow.onload = function() {          // 確保新視窗載入完成（應比等待一陣子就傳遞訊息來得好，但... 在 Firefox 似乎事件不會被觸發？）
      window.setTimeout(function() {
         if (newWindow) {
            // 傳遞訊息
            let json = { source: "Comarkus2D",
                         target: "EventRelLite",
                         parameters: [],         // 2025-02-20
                         type: "DocuXml",        // 2024-10-31
                         message: GvarFinalDocuXml
                       };
            newWindow.postMessage(json, '*');    // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
         }
         else console.log("Error: newWindow not ready");
      }, 2000);
   });
      
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
   
   // -----------------------------------------------------------------------------------------------   
   
   function doPostMessage(sourceTool, targetTool, xmlStr) {   
      // 2025-01-16
      if (InXmarkusLocalMode) {
         // 傳遞到最 top 的 XmarkusPlatform.html
         // (1). XmarkusPlatform.html 引入 iframe XmarkusPlatform-Converting.html
         // (2). XmarkusPlatform-Converting.html 引入 iframe Comarkus2D.html
         // 注意：即使沒有父視窗，parent 依然有值，但在 file: 協定下無法透過 parent.parent.location.href!=location.href 進行比對
         //       會跑出 Uncaught DOMException: Permission denied to get property "href" on cross-origin object

         // 2025-02-20: 調整訊息格式，改為 source, target, parameters, type, message 五項參數
         let wrapper = { source: sourceTool,
                         target: targetTool,
                         type: "DocuXml",
                         message: GvarFinalDocuXml }
         parent.parent.postMessage(wrapper, '*');    // 第二個參數是目標源，可以根據需要設置（若以 json object 送出，接收端似可直接取用 json 物件，不需經過 JSON.parse 處理）
      }
      else alert("EnableMessageViaParent disabled");
   }

   // -------------------------------
   //      PostMessage handler
   // -------------------------------
   
   window.addEventListener("message", messageHandler, false);
   
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

         // 2025-01-17         
         if (source == "ConvertingPage") {
            if (message == 'analysis') doPostMessage("Comarkus2D", "XmarkusAnalyzer", GvarFinalDocuXml);
            else if (message == 'download') $("#saveFile").click();
            else ;
         }
         else ;
      } catch (e) {
         alert(e.name + ": " + e.message);
      }
   }

   
   