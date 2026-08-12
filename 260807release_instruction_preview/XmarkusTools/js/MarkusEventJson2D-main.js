   // global constants
   const EnableDocuSkyConnectivity = true;     // 若為 true，則參考 DocuSky.connectivity.js 取得 DocuSkyHost
   const WhiteSpaceSymbol = '.';               // 2024-04-30: e.g., <Udef_properties_date.dynasty>
   const LayerDelimiter = '//';                // 2024-04-30
   
   var docuSkyObj = null;
   var GlobalVar = { udefTagsDict:{},
                   };

   // 讀入本地的 texts，將其轉換、或合併為 ThdlExportXml
   var CorpusList = {};               // { corpusTitle: [{filename,text},{filename,text}, ...] }
   var GvarComarkusUdefTags = {};     // 2024-05-20

   // -------------------------------------------------------------------------------------------------

   Date.prototype.yyyymmdd = function() {       // Tu: copied from Web
     var mm = this.getMonth() + 1;              // getMonth() is zero-based
     var dd = this.getDate();
     return this.getFullYear() + ('0'+mm).substr(-2) + ('0'+dd).substr(-2);  // padding
   }

   function htmlEncode(value) {
     //create a in-memory div, set it's inner text(which jQuery automatically encodes)
     //then grab the encoded contents back out.  The div never exists on the page.
     return $('<div/>').text(value).html();
   }
   
   function htmlDecode(value) {
     return $('<div/>').html(value).text();
   }   
   
   // -------------------------------------------------------------------------------------------------
   
   $(document).ready(function() { 
      var me = this;
      docuSkyObj = docuskyManageDbListSimpleUI;
      $("#manageDbList").click(function(e) {
         docuSkyObj.manageDbList(e);
      });
   });
   
   // -------------------------------------------------------------------------------------------------

   function setupReader(evt, file) {
      var filename = file.name;
      var fr = new FileReader();
      fr.addEventListener('load', function(evt) { 
         //alert(s);
         var s = evt.target.result; 
         // 2016-05-06: Invalid characters get converted to 0xFFFD on parsing, so use the following line to remove invalid characters
         // s = String(s).replace(/\uFFFD/g, '');     // to valid UTF-8
         // valid XML 1.0 characters: #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
         // XML 1.1: Char ::= [#x1-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]    // any Unicode character, excluding the surrogate blocks, FFFE, and FFFF.
         //          RestrictedChar ::= [#x1-#x8] | [#xB-#xC] | [#xE-#x1F] | [#x7F-#x84] | [#x86-#x9F]
         // Characters need to be escaped: <&>'" (same as htmlspecialchars?)
         s = s.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, '');      // 2016-05-09
         var corpusTitle = $("#corpusTitle").val().trim();
         var numFiles = CorpusList.length;
         CorpusList[corpusTitle].push({filename: filename, text: s});
         $("#loadedFilenameList").append(corpusTitle + ": " + filename + "\n");      // 2017-05-24
         // s.split(/={4,}/);         // 四個以上的等號
         //console.log(filename + ':' + CorpusList[corpusTitle].length);
         refreshCorpusList();
      });
      var encoding = 'utf-8';         // 'utf-8', 'big5'
      fr.readAsText(file, encoding);
   }
   
   function handleSelectInFile(evt) {        
      var corpusTitle = $("#corpusTitle").val().trim();
      if (CorpusList[corpusTitle] === undefined) CorpusList[corpusTitle] = [];      // 2017-05-24
      
      // 將 corpus 名稱加入輸出的 XML 檔名
      //var outFilename = $("#outFilename").val().replace('-'+corpusTitle+'-','-').replace(/^(.+)\.xml$/, "$1-" + corpusTitle + ".xml");
      let outFilename = dateStr = (new Date()).yyyymmdd() + '-' + corpusTitle + ".xml";

      $("#outFilename").val(outFilename)
      
      var files = evt.target.files;        // FileList object
      for (var i=0; i<files.length; i++) {
         setupReader(evt, files[i]);       // the ith selected file
      }
   }

   $("#selectInFile").bind('change', function(evt) {
      handleSelectInFile(evt);
   });
   
   $("#generateDocuXml").click(function() {
      // 2017-06-01: 加上是否尚未載入文件的檢查機制
      if (Object.getOwnPropertyNames(CorpusList).length === 0) {
         alert("錯誤：尚未載入任何 IMMARKUS JSON 檔");
         return;
      }

      let corpusSettingsXmlList = [];
      let out = '';
      for (let corpusTitle in CorpusList) {
         let curCorpus = CorpusList[corpusTitle];         // curCorpus: [{filename,text}, {filename,text}, ...]
         curCorpus.sort(function(a, b) {
            return (a.filename < b.filename) ? -1 : (a.filename > b.filename);   // 依照 filename 排序
         });

         // 2024-04-30, 2024-05-20
         GlobalVar.udefTagsDict = {};                          // reset (for each corpus)
            
         for (let i=0; i<curCorpus.length; i++) {
            let markusEventJson = JSON.parse(curCorpus[i].text);     // 一份 JSON 包含多個事件，每個事件將產生一篇文件
            let s = convertMarkusEventJson2Docs(markusEventJson, curCorpus[i].filename, corpusTitle);
            
            //out += '<document filename="' + curCorpus[i].filename + '">\r\n'
            //     + '<corpus>' + corpusTitle + '</corpus>\r\n'
            //     + '<doc_content>'
            //     + s
            //     + '</doc_content>\r\n'
            //     + '</document>\r\n';
            out += s;
         }

         // 2024-05-20: (TODO -- 目前仍是空的) 最後再處理 corpus settings
         corpusSettingsXmlList.push(getCorpusSettingsXml(corpusTitle, GlobalVar.udefTagsDict));
      }

      let outHead = '<?xml version="1.0"?>\r\n' +
                    '<ThdlPrototypeExport>\r\n' +
                    corpusSettingsXmlList.join('\r\n') +
                    '<documents>\r\n';
                    
      out = outHead + out
          + '</documents>\r\n' 
          + '</ThdlPrototypeExport>';
          
      var blob = new Blob([out], {type: "text/plain;charset=utf-8"});
      var filename = $("#outFilename").val();
      saveAs(blob, filename);             // requires FileSaver.js
   });
   
   function getCorpusSettingsXml(corpusTitle, udefTagDict) {      // 2024-04-30
      let lines = [];
      lines.push('<corpus name="' + corpusTitle + '">');
      lines.push('<feature_analysis>');
      
      Object.keys(udefTagDict).forEach(function(v) {
         let s = '<tag type="contentTagging" name="' + v + '" default_category="' + v + '" default_sub_category="-"/>';
         lines.push(s);
      });
      
      lines.push('</feature_analysis>');
      lines.push('</corpus>');
      return lines.join("\n");
   };
   
   // ------------------------------------------------------------------------------------------
   
   function convertMarkusEventJson2Docs(markusEventJson, jsonFilename, corpusTitle) {   
      //alert(JSON.stringify(markusEventJson));
      
      let s = '';
      if (!Array.isArray(markusEventJson)) {
         s = "Error: '" + jsonFilename + "' is not a valid MARKUS EVENT JSON file (must be an array of object)!";
         alert(s);
         return s;
      }
      //alert(JSON.stringify(markusEventJson));            // an array of events
      
      let eventDocs = [];
      
      markusEventJson.forEach(function(markusEvent, idx) {
         let docLines = [];
         
         let [contentPartXml, eventPartXml] = convertComarkusEvent(markusEvent);
         //alert(contentPartXml);
         //alert(eventPartXml);
         
         let docKey = "mark:" + (idx+1);              // optional @Key
         let t = '<document filename="' + jsonFilename + '_' + idx.toString().padStart(3,'0') + '">\n'
               + '<corpus>' + corpusTitle + '</corpus>\n'
               + '<doc_content>\n'
               + contentPartXml + "\n"
               + eventPartXml + "\n"
               + '</doc_content>\n'
               + '</document>\n';
         eventDocs.push(t);
      });
      
      return eventDocs.join("\n");
   }
   
   // -------------------------------------------------------------------------------------------

   function convertComarkusEvent(markusEvent) {
      // 2024-05-20: markusEvent must be an object of "bundles"
      //             each bundle is an object with an uppercased name and value (as well as an id:<bundle_id>)
      //             { type, id, text, markus_id }     （X-MARKUS 似乎就固定是這幾個欄位，但 COMARKUS 很可能有擴充）
      //             type      => tag Udef_Evt_<type>  （注意，必須將 type 中非合法標籤字元都進行替換）
      //             id        => @RefId="<id>"         (of tag Udef_Evt_<type>)
      //             text      => text of tag Udef_Evt_<type>
      //             markus_id => @MarkusId
      //             <others>  => @Comarkus_<others> (如果有擴充的話...)
      // example:
      //   <Event [@Name]>
      //      <Udef_Ev_Name>...</Udef_Ev_Name>           <-- 從以下 Action, Object, AdYear, Loc, Person 擷取後組成
      //      <Udef_Ev_Action>...</Udef_Ev_Action>       <-- 程式從 ComarkusBundle 擷取，若有多項則用 ';' 串接 (EVENT?)
      //      <Udef_Ev_Object>...</Udef_Ev_Object>       <-- 物 (OBJECT_MAIN, OBJECT_LENGTH, OBJECT_WIDTH, MATERIAL...)
      //      <Udef_Ev_AdYear>...</Udef_Ev_AdYear>       <-- 時 (從 TIME/BEGIN, TIME/END, TIME/AFTER, TIME/DURATION 等彙整 => 怎麼彙整？有待研究...）
      //      <Udef_Ev_Loc>...</Udef_Ev_Loc>             <-- 地 (LOCATION)
      //      <Udef_Ev_Person>...</Udef_Ev_Person>       <-- 人 (INITIATOR)
      //      <ComarkusBundle Type="TIME">
      //         <Udef_Evt_BEGIN RefId="公元1610年:明神宗" MarkusId="3a6db523-442c-4651-9f1e-f3661fcfe2de">庚戍春</Udef_Evt_TIME_BEGIN>
      //         <Udef_Evt_END RefId="公元1610年:明神宗" MarkusId="a7be7d72-9455-423b-976a-e2874962f16e">秋</Udef_Evt_TIME_END>
      //      </ComarkusBundle>
      //      <ComarkusBundle Type="OBJECT_LENGTH">
      //            ...
      //      </ComarkusBundle>
      //      <ComarkusBundle Type="OBJECT_PART">
      //            ...
      //      </ComarkusBundle>
      //      ... 
      //   </Event>
      //
   
      let ContentPartComarkusBundles = [];
      let EventPartComarkusBundles = [];
      let bundleId = "NoId";
      for (let key in markusEvent) {
         let bundle = markusEvent[key];
         if (key !== 'id') {
            let [contentPart, eventPart] = convertComarkusBundle2Xml(bundle, key);
            ContentPartComarkusBundles.push(contentPart);
            EventPartComarkusBundles.push(eventPart);
         }
         else bundleId = markusEvent[key];
      }
      
      // (TODO) 加上 <Udef_Ev_Name>, <Udef_Ev_Action> 等額外標記
      //GlobalVar.udefTagsDict[<extra_tagname>] = 1;
      
      let eventPartXml = '<Events>'                                    // 將 event 獨立出來... 每個 <Events> 僅包含一個 <Event>
                       + '<Event ComarkusId="' + bundleId + '">'       // 或可額外加上 @Name
                       + EventPartComarkusBundles.join("\n")
                       + '</Event>'
                       + '</Events>\n';
                    
      // 2024-05-20
      let contentPartXml = '<div>' + 'ComarkusId: ' + bundleId + '</div>'
                         + ContentPartComarkusBundles.join("\n");
      
      return [contentPartXml, eventPartXml];
   }
   
   function convertComarkusBundle2Xml(comarkusBundle, bundleKey) {
      // a bundle is a list of "combo"
      // each combo is a simple object { type, id, text, markus_id }  （MARKUS JSON 似乎就固定是這幾個欄位，但 COMARKUS 很可能有擴充）
      // type      => tag Udef_Evt_<type>                             （注意，必須將 type 中非合法標籤字元都進行替換）
      // id        => @RefId="<id>" of tag Udef_Evt_<type>
      // text      => text of tag Udef_Evt_<type>
      // markus_id => @MarkusId
      // <others>  => @Comarkus_<others> (如果有的話...)
      // 2024-04-13: EVENT_SOURCE_TEXT, OBJECT_MAIN 等項目，可能不會有 type...

      // [{"markus_id":"3a6db523-442c-4651-9f1e-f3661fcfe2de","text":"庚戍春","id":"公元1610年:明神宗","type":"BEGIN"},{"markus_id":"a7be7d72-9455-423b-976a-e2874962f16e","text":"秋","id":"公元1610年:明神宗","type":"END"}]
      // alert(JSON.stringify(comarkusBundle));
      
      let xmarkusAttrs = ['type', 'id', 'text', 'markus_id'];
      let eventPartList = [];
      let bundleKeyDict = {};
      
      comarkusBundle.forEach(function(combo) {
         let tagName = 'Udef_Undefined';
         let convertedBundleKey = convertToLegalTagName(bundleKey);
         let bundleType = 'NoType';
         if (!combo['type']) { 
            // 2024-04-28: 加上 convertToLegalTagName()
            tagName = "Udef_Evt_" + convertedBundleKey + "_" + bundleType;     // 2024-04-22: 加上 bundleKey（暫時還是先加上 NoType，日後若沒有 type 可能就直接不加 suffix？）
            console.log("warning: " + bundleKey + " has no 'type' attribute");               // 2024-04-21: 只是記錄，不影響後續轉換
         }
         else {
            bundleType = convertToLegalTagName(combo['type']);
            tagName = "Udef_Evt_" + convertedBundleKey + "_" + bundleType;
         }

         GlobalVar.udefTagsDict[tagName] = 1;             // 2024-04-15
         
         // 注意：這裡的 RefId 和文本的 RefId 之間並不能直接進行對應（需經過一些計算後才能對應）
         //       例如，文本的人時地 RefId 沒有 'markus_' 前綴，Udef 標籤的 RefId 有加上 'markus_' 前綴
         //       此外，comarkus json 的 id 可能會出現 '范諫|fl1568|r東明' 或 '朱文科|fl1568|o東明' 之類包含額外訊息的值
         let tagAttrs = [];
         if (!combo['id']) console.log(bundleKey + " has no 'id' -- no @RefId generated");
         else tagAttrs.push('RefId="' + convertToLegalTagAttrValue(combo['id']) + '"');
         
         if (!combo['markus_id']) console.log(bundleKey + " has no 'markus_id' -- no @MarkusId generated");
         else tagAttrs.push('MarkusId="' + convertToLegalTagAttrValue(combo['markus_id']) + '"');

         let tagText = "";
         if (!combo['text']) console.log(bundleKey + " has no 'text' -- no tag text generated");
         tagText = convertToLegalTagValue(combo['text']);

         // 檢查是否還有其他欄位 -- 若有則通通算作「額外」屬性
         for (let subkey in combo) {
            if (!xmarkusAttrs.includes(subkey)) {
               tagAttrs.push('Comarkus_' + convertToLegalAttrName(subkey) + '="' + convertToLegalTagAttrValue(combo[subkey]) + '"');
            }
         }
         
         let tagAttrStr = tagAttrs.join(' ');
         
         // 以下的 tagName, tagAttrStr, tagText, tagName 都應已處理過（僅包含合法字元）
         let s = "<" + tagName + " " + tagAttrStr + ">" + tagText + "</" + tagName + ">";
         eventPartList.push(s);
         
         // 2024-05-20
         if (!bundleKeyDict[convertedBundleKey]) bundleKeyDict[convertedBundleKey] = {};
         if (!bundleKeyDict[convertedBundleKey][bundleType]) bundleKeyDict[convertedBundleKey][bundleType] = [];
         bundleKeyDict[convertedBundleKey][bundleType].push(s + " (" + combo['id'] + ")");
         //let t = "<div>" + convertedBundleKey + "/" + bundleType + ": " + s + "</div>";
         //contentPartList.push(t);
      });
      //alert(JSON.stringify(eventPartList));

      let eventPart = '<ComarkusBundle Type="' + convertToLegalTagAttrValue(bundleKey) + '">'
                    + eventPartList.join("\n")
                    + '</ComarkusBundle>';
                    
      
      let contentPartList = [];
      for (let bk in bundleKeyDict) {
         contentPartList.push("<div><b>" + bk + "</b>");
         for (let bt in bundleKeyDict[bk]) {
            let t = bundleKeyDict[bk][bt].join("; ");
            contentPartList.push("<div>" + t + "</div>");
         }
         contentPartList.push("</div>");
      }
      let contentPart = contentPartList.join("\n");
      
      return [contentPart, eventPart];
   }
   
   // -------------------------------------------------------------------------------------------
   
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
      s = s.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uD800-\uDFFF\uE000-\uFFFD]/g, '-');
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
      
   // -------------------------------------------------------------------------------------------
   
   function refreshCorpusList() {
      var s = "<ol style='margin-top:-5px'>";
      for (var corpusTitle in CorpusList) {
         s += "<li>" + corpusTitle + " (" + CorpusList[corpusTitle].length + ")</li>";
      }
      s += "</ol>";
      $("#corpusList").html(s);
   }
   
