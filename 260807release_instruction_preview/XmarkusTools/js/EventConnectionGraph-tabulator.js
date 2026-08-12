   // ------------------------------
   //      tabulator functions
   // ------------------------------
   
   function drawTable() {
      let tableData = GlobalVar.tableData;
      let columnDef = [];
      if (tableData.length == 0) {
         if (GlobalVar.table) GlobalVar.table.setData(tableData);      // 2024-06-27: 清空 tabulator
         alert("No data to display");
         return;
      }

      let firstMatchingRow = null;   // 記錄符合搜尋的第一個 row （搜尋完畢可捲回此列）
      let lastSearchRow = null;      // 記錄上次搜尋的位置
      
      // 設定 columnDef 欄位參數定義
      Object.keys(tableData[0]).forEach(function(k) {
         let editor = true;
         let editorParams = null;
         let visible = true;
         let width = null;
         let tooltip = false;        // 2024-05-23
         let formatter = null;       // 2024-05-29
         let headerTooltip = true;

         switch (k) {                // 2024-05-12: 改用 switch()
            case 'id':
               width = 45;
               editor = false;
               break;
            case 'comarkusId':       // 2024-06-05: 若顯示可方便除錯
               visible = false;
               editor = false;
               break;
            case 'immarkusId':       // 2024-06-27: 若顯示可方便除錯
               visible = false;
               editor = false;
               break;
            case 'markusId':
               width = 80;
               editor = false;
               visible = false;      // 不顯示
               break;
            case 'eNum':
               width = 60;
               editor = false;
               break;
            case 'display':          // 此 row (graphNode) 是否要被顯示
               // https://stackoverflow.com/questions/71971567/tabulator-5-2-new-editor-list-option-value
               //editor = "list";        // not "select" after v5.2
               //editorParams = { values: {"true":true, "false":false}};
               width = 84;
               editor = false;
               formatter = getRadioFormatter(k, 'Y');            // 預設顯示
               break;
            case 'graphNode':
               width = 75;
               editor = false;
               break;
            case 'eNumDisplay':           // "toggle" eNum display
               width = 50;
               editor = false;
               headerTooltip = "click Y/N to change the display value of rows with the same eNum value";
               formatter = getYesNoButtonsFormatter(k);
               break;
            case 'graphNodeLabel':        // 2024-07-26: rename from 'eNumLabel' to 'graphNodeLabel'
               width = 120;
               headerTooltip = "label of this graphNode";
               break;
            case 'groupDisplay':          // 若更動這個欄位，可以一次改變所有相同 graphNode id 的 display 值
               width = 50;
               editor = false;
               headerTooltip = "click Y/N to change the display value of rows with the same graphNode value";
               formatter = getYesNoButtonsFormatter(k);
               break;
            case 'labelDisplay':
               width = 84;
               editor = false;
               headerTooltip = "check Y/N to swith whether to display graphNode node label";
               formatter = getRadioFormatter(k, 'Y');            // 預設顯示
               break;
            case 'docFilename': 
            case 'docTitle':             // 2025-09-25 增補
            case 'type':
            case 'comarkusBundleIdx':    // 2025-10-03 增補
               tooltip = true;
               break;
            case 'tagName': 
               tooltip = true;
               editor = false;
               formatter = function(cell, formatterParams, onRendered) {
                              cell.getElement().style.borderRight = "3px dotted #9F9F9F";    // dotted 需要粗一些
                              return cell.getValue();
                           };
               break;
            case 'xmlMetadataStr':          // 2025-06-01
               width = 100;
               editor = false;
               visible = false;
               break;
            case 'eventTimeNotBefore':      // 2024-07-22
            case 'eventTimeNotAfter':
               width = 60;
               editor = false;
               visible = false;
               break;
            case 'nodeLegendCaption':       // 2025-05-11: 顯示在 legend 的字串（節點的類型，例如 event node 為 "CONSTRUCTION"，common node 為 "INITIATOR" 之類）
               width = 100;
               break;
            case 'nodeLabelColorClass':     // 2025-05-14, 2025-08-29
               visible = false;
               width = 50;
               break;
            case 'nodeColorIdx':            // 2025-05-10
               width = 40;
               break;
            case 'eventLocation':
               editor = false;
               visible = false;
               break;
            case 'refId': 
            case 'content':
               tooltip = true;
               break;
            case 'dupCnt':
               width = 45;
               editor = false;
               formatter = function(cell, formatterParams, onRendered) {
                              cell.getElement().style.borderLeft = "2px solid #9F9F9F";
                              return cell.getValue();
                           };
               break;
            case 'extra': 
            case 'url':
               visible = false;
               editor = false;
               break;
            case 'origTagName':               // 2024-10-15
            case 'origContent':
               visible = false;
               break;
            default:
         }
         
         let column = { title: k,             // 欄位上方 column header 所顯示的字串
                        field: k,             // 對應到 dataTable 的變數名稱
                        editor,
                        editorParams,
                        // hozAlign:"center"
                        visible,
                        tooltip,
                        headerTooltip,        // 2024-05-23
                        formatter,               // 2024-05-29
                        width,
                      };
                        
         //if (field === 'eNumGroup' || field === 'graphNode') {
         //   column['format'] = function(cell, formatterParams, onRendered) {
         //      // ...
         //   };
         //}
         
         columnDef.push(column);
      });

      // 設定 tabulator
      
      GlobalVar.table = new Tabulator("#tabulator", {
       	height: window.innerHeight - 5,        // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
       	data: tableData,                       // assign data to table
       	layout: "fitColumns",                  // fit columns to width of table (optional)
       	columns: columnDef,                    // define Table Columns

         //cellClick: function(evt, cell) {       // 點擊儲存格
         //}

         //selectableRows: true,                  // make rows selectable
       	//rowClick:function(e, row){             // trigger an alert message when the row is clicked
       	//   alert("Row " + row.getData().id + " Clicked!!!!");
       	//},
      });
      
      // 2025-11-19: 必須等 table built 完成，才能下載！
      GlobalVar.table.on("tableBuilt", function() {
         GlobalVar.tabulatorBuilt = true;
      });

      let table = GlobalVar.table;               // 2024-06-02      
      
      // 使用者編輯某儲存格（如果需要，會將其結果同步到其他需連動的儲存格）
      table.on("cellEdited", function(cell) {
         //table.blockRedraw();
         
         let editedFieldName = cell.getField();   // cf. cell.getRow() to return RowComponent
         let editedRow = cell.getData();          // an object represents the row, e.g., {"id":6,"eNum":"E001","display":true, ... }
         //alert("cellEdited\n" + editedFieldName + "\n" + JSON.stringify(editedRow));
         
         // 2024-05-29
         if (editedFieldName == 'display' || editedFieldName == 'labelDisplay') {
            // 必須自己透過 DOM 將 radio 設到對應值
            let radioName = editedFieldName + '_' + cell.getRow().getIndex();    // 注意，不需要加一
            let radioValue = (editedRow[editedFieldName] === true) 
                           ? 'Y' : 'N';
            //alert("=>" + radioValue);
            document.getElementsByName(radioName).forEach(function(radio) {
               if (radio.value === radioValue) radio.checked = true;
            });
            return;
         }
         
         // 2024-06-27
         if (editedFieldName == 'graphNodeLabel') {
            // 如果更動的是 graphNodeLabel 欄的儲存格，就同步到「所有與這列有相同 row.graphNode 的那些列」的 graphNodeLabel
            // 注意： 使用者並無法更動 graphNode
            let rowData = table.getData();
            rowData.forEach(function(row, ridx) {
               if (row.graphNode == editedRow.graphNode) {
                  let cell = table.getRows()[ridx].getCell("graphNodeLabel");
                  cell.setValue(editedRow.graphNodeLabel);
               }
            });
            return;
         }
      
         // 根據需要修改其他 cells 的值
         if (GlobalVar.editOptions.interlinked) {
            // 注意：以下透過 tabularator 函式更新 cell value，也會同步反映到 GlobalVar.tableData!
            if (editedFieldName == 'content') {
               // 2023-05-23: tabulator 似乎沒有函式能取得「編輯前」的 cell value...
               let dupCntArray = computeDuplicateAndUpdateDisplayGroup();        // [{id,dupCnt,graphNode},{id,dupCnt,graphNode},...]
               table.updateData(dupCntArray);
            }
            else if (editedFieldName === "graphNode") {
               // 如果更動的是 graphNode 欄的儲存格，就同步到「所有與這列有相同 row.content 的那些列」的 graphNode
               let rowData = table.getData();
               rowData.forEach(function(row, ridx) {
                  if (row.content == editedRow.content) {
                     let cell = table.getRows()[ridx].getCell("graphNode");
                     //row.graphNode = editedRow.graphNode;
                     //table.updateRow(row);
                     cell.setValue(editedRow.graphNode);
                  }
               });
            }
            //console.log(GlobalVar.tableData);
         }
 
         //table.restoreRedraw();
      });
      
      function syncDisplayOptions(clickedCell, newDisplayValue) {
         let editedFieldName = clickedCell.getField();   // cf. clickedCell.getRow() to return RowComponent
         let editedRow = clickedCell.getData();          // an object represents the row, e.g., {"id":6,"eNum":"E001","display":true, ... }

         if (editedFieldName == 'eNumDisplay' || editedFieldName == 'groupDisplay') {     // toggle eNum/graphNode display
            // 同步設定「所有與這列有相同 row.eNum 的那些列」的 display 和 groupDisplay
            let fieldToCheck = (editedFieldName == 'eNumDisplay') ? 'eNum' : 'graphNode';
            
            let rowData = table.getData();              // array of object {id, display, eNum, ...}
            rowData.forEach(function(row, ridx) {
               //alert(JSON.stringify(row));
               if (row[fieldToCheck] === editedRow[fieldToCheck]) {   
                  // 此 row 和編輯的 row 有相同 eNumDisplay 或 groupDisplay 值 => 同步該 row 的某些 cell value
                  let cell = table.getRows()[ridx].getCell("display");
                  cell.setValue(newDisplayValue);       // 注意：會觸發 cellEdited 事件（只有當與原先值不同時才會觸發？）
                  //alert(ridx + ':' + row[fieldToCheck] + ' => ' + cell.getRow().getIndex() + ':' + newDisplayValue);               
                  
                  // tabulator 似乎只有在 cell 更新值與原值不同時才會觸發 cellEdited 事件（其實總感覺觸發的狀況並不明確）
                  // 為了處理未觸發的狀況，只好在此也去修改 display 欄的 radio 呈現（若 cellEdited 事件觸發，就可能多做一次）
                  let radioName = 'display_' + cell.getRow().getIndex();    // 注意：ridx+1 才會等於 cell.getRow().getIndex()
                  let radioValue = (newDisplayValue === true) 
                                 ? 'Y' : 'N';
                  document.getElementsByName(radioName).forEach(function(radio) {
                     if (radio.value === radioValue) radio.checked = true;
                  });
                  
               }
               else;      // alert("skip: " + ridx);
            });   // rowData.forEach()
         }        // if
         else if (editedFieldName == 'graphNodeLabel') {     // 2024-06-27
            alert("graphNodeLabel edited");
         }
      };

      // 2024-07-24
      function syncLabelDisplayOptions(clickedCell, newDisplayValue) {
         let editedFieldName = clickedCell.getField();   // cf. clickedCell.getRow() to return RowComponent
         let editedRow = clickedCell.getData();          // an object represents the row, e.g., {"id":6,"eNum":"E001","display":true, ... }

         //alert(editedFieldName);      // 'labelDisplay'

         // 同步設定「所有與這列有相同 row.graphNode 的那些列」的 labelDisplay
         let fieldToCheck = 'graphNode';
         
         let rowData = table.getData();              // array of object {id, display, eNum, ...}
         rowData.forEach(function(row, ridx) {
            //alert(JSON.stringify(row));
            if (row[fieldToCheck] === editedRow[fieldToCheck]) {  
               // 此 row 和編輯的 row 有相同 eNumDisplay 或 groupDisplay 值 => 同步該 row 的某些 cell value
               let cell = table.getRows()[ridx].getCell("labelDisplay");
               cell.setValue(newDisplayValue);       // 注意：會觸發 cellEdited 事件（只有當與原先值不同時才會觸發？）
               //alert(ridx + ':' + row[fieldToCheck] + ' => ' + cell.getRow().getIndex() + ':' + newDisplayValue);               
               
               // tabulator 似乎只有在 cell 更新值與原值不同時才會觸發 cellEdited 事件（其實總感覺觸發的狀況並不明確）
               // 為了處理未觸發的狀況，只好在此也去修改 display 欄的 radio 呈現（若 cellEdited 事件觸發，就可能多做一次）
               let radioName = 'labelDisplay_' + cell.getRow().getIndex();    // 注意：ridx+1 才會等於 cell.getRow().getIndex()
               let radioValue = (newDisplayValue === true) 
                              ? 'Y' : 'N';
               document.getElementsByName(radioName).forEach(function(radio) {
                  if (radio.value === radioValue) radio.checked = true;
               });
               
            }
            else;      // alert("skip: " + ridx);
         });   // rowData.forEach()
      };

      function getRadioFormatter(namePrefix, initValue) {
         function radioFormatter(cell, formatterParams, onRendered) {
            //let value = initValue;
            let value = cell.getValue().toString();             // 2024-07-25: 轉成字串（方便後續不需再進行型別檢查）
            //alert(value);
            let container = document.createElement("div");

            let trueInput = document.createElement("input");
            trueInput.type = "radio";
            trueInput.name = namePrefix + "_" + cell.getRow().getIndex();
            trueInput.value = "true";                          // 注意，是字串
            trueInput.checked = (value === trueInput.value);   // 字串比對
            trueInput.addEventListener("click", function() {
               //alert("You clicked Y for " + cell.getField());
               cell.setValue(true);       // 注意，cell value 是 true/false 而不是 Y/N
               if (namePrefix == 'labelDisplay') syncLabelDisplayOptions(cell, true);
            });
            container.appendChild(trueInput);
            container.appendChild(document.createTextNode("Y"));

            let falseInput = document.createElement("input");
            falseInput.type = "radio";
            falseInput.name = namePrefix + "_" + cell.getRow().getIndex();
            falseInput.value = 'false';
            falseInput.checked = (value === falseInput.value);
            falseInput.addEventListener("click", function() {
               cell.setValue(false);
               if (namePrefix == 'labelDisplay') syncLabelDisplayOptions(cell, false);
            });
            container.appendChild(falseInput);
            container.appendChild(document.createTextNode('N'));

            // 2024-06-01
            cell.getElement().style.borderRight = "2px solid #9F9F9F";

            return container;
         };
         return radioFormatter;
      };
      
      function getYesNoButtonsFormatter(fieldName) {
         function buttonsFormatter(cell, formatterParams, onRendered) {
            //let value = cell.getValue();
            let container = document.createElement("div");
            let yesButton = document.createElement("button");
            yesButton.id = fieldName + "_Y_" + cell.getRow().getIndex();
            yesButton.addEventListener("click", function() {
               //alert("You clicked Y for " + cell.getField());
               syncDisplayOptions(cell, true);
            });
            container.appendChild(yesButton);
            yesButton.appendChild(document.createTextNode("Y"));
            
            let noButton = document.createElement("button");
            noButton.id = fieldName + "_N_" + cell.getRow().getIndex();
            noButton.addEventListener("click", function() {
               //alert("You clicked N for " + cell.getField());
               syncDisplayOptions(cell, false);
            });
            container.appendChild(noButton);
            noButton.appendChild(document.createTextNode('N'));
            
            // 2024-06-01
            cell.getElement().style.borderRight = "2px solid #9F9F9F";

            return container;
         }
         return buttonsFormatter;
      };

      // -------------------------------
      //       search functions
      // -------------------------------
   
      $("#butSearch").click(function() {
         searchTable();
      });

      // 搜尋表格（注意：目前僅搜尋 content 欄！），將符合的儲存格加上 highlight
      function searchTable() {
         clearSearchHighlights(table);        // 清除之前的高亮 (highlight)
         
         var searchText = document.getElementById('searchInput').value.trim().toLowerCase();
         if (searchText === '') return;
         
         var rows = table.getRows();
         firstMatchingRow = null;
         let matchingCount = 0;
         for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row.getPosition(true) > (lastSearchRow ? lastSearchRow.getPosition(true) : -1)) {
               var cellValue = row.getData().content.toLowerCase();
               //alert(cellValue);
               var cellElement = row.getCell("content").getElement();    // refId, content
               if (cellValue.includes(searchText)) {
                  //row.scrollTo();
                  cellElement.classList.add("searchHighlight");
                  if (firstMatchingRow === null) firstMatchingRow = row;
                  matchingCount++;
                  //lastSearchRow = row;
                  //return;
               }
            }
         }

         alert("Find " + matchingCount + " matching rows");
         if (matchingCount) {
            // 文件是說，scrollToRow 可以有 animation （相對於 row.scrollTo() 會直接顯示）
            table.scrollToRow(firstMatchingRow);
         }

         // 沒找到匹配的結果
         //lastSearchRow = null;
         //alert("No matches found.");
      }
      
      // 搜尋下一筆
      //function searchNext() {
      //   if (lastSearchRow) searchTable();
      //   else alert("Please perform a search first.");
      //}

   }


   // -------------------------------------------------------------------------------------------------

   // 清除所有高亮的儲存格（從 graph 切換到 tabulator
      function clearSearchHighlights(table) {
         table.getRows().forEach(function(row) {
            var cellElement = row.getCell("content").getElement();
            cellElement.classList.remove("searchHighlight");
         });
      }
      
   
   // -------------------------------------------------------------------------------------------------
   
   function getValueAsDupKey(row) {                       // 這個函式相當基礎且重要...
      let tagAsPrefix = row.tagName;
      if (tagAsPrefix == 'Udef_EventRelLite') {           // 注意，需和 EventRelLite-main.js 同步
         // 2024-08-12: 這個 row 屬於「特殊列」，不應加入 duplicate count 計算
         //             但後續還會用整個 tableData 進行彙整計算，因此為了方便，將 row.id 也加入 prefix
         //             以避免 dup count 超過 1 （超過 1 會造成 row.graphNode 被更新為 'C001' 之類，
         //             導致 node type 變更為 'C' node）
         // => 例如，若將此列的 content（eNum E001 在此列的 graphNode 預設值 E001）改為 
         //    E002|E004|E009，就可在 E001 和 E002, E004, E009 之間加上連線
         return (tagAsPrefix + '_row_' + row.id);
      }
      
      // 2025-07-01: 加入 eventType 考量 -- 由於 X-MARKUS 中，不同 eventType 基本的 tags 都不同（理論上應只能透過 Udef_Align_XXX 相連），
      //             計算 dupCnt 時應該獨立計算（若 eventType 的標籤「完全不同」，那麼計算結果應相同）
      //             加入 eventType 是為了讓 filtering 機制可分別過濾不同 nodeTypes 下的事件
      let eventType = row.eNum.substr(0,1);
      let ret = getCommonNodeDupKey(tagAsPrefix, row.content, eventType);
      
      return ret;
   }
   
   function getCommonNodeDupKey(tag, val, eventType) {
      // 2025-06-18: 用 tag + content 的組合計算重覆
      //             由於 COMARKUS 和 IMMARKUS 標記結構相差甚多，在此必須對特定標籤取不同的組合進行計算
      // 2025-07-01: 加上 eventType 引數
      let ret = tag;            // 2025-06-18: 預設是 tagsComputeDupWithTagOnly，也就是以 tag 獨自作為比對值（尤其對於 IMMARKUS 而言）
      let parts = val.split('/');
      
      // 2025-07-24: 注意，還是會有許多 tag (e.g., "Udef_DocMeta_Source_title_ch_" 並沒有出現在 tagDupLookup 表...）
      // Syntax: let y = x?.a ?? 'empty';  ==>  若 x 存在則 y := x.a || 'empty'
      let dupMethod = GlobalVar.tagDupLookup[tag]?.dup ?? 'tagsComputeDupWithTagOnly';           // 2025-07-24: 改為 object 的 dup 屬性

      if (dupMethod == 'tagsComputeDupWithTagOnly') {
         ret = tag;
      }
      else if (dupMethod == 'tagsComputeDupWithPrefix') {
         ret = tag + ':' + parts.shift();
      }
      else if (dupMethod == 'tagsComputeDupWithInfix') {
         if (parts.length <= 1) ret = tag + ':' + parts.shift();
         else ret = tag + ':' + parts[1];
      }
      else if (dupMethod == 'tagsComputeDupWithSuffix') {
         ret = tag + ':' + parts.pop();                 // 2025-06-20 bug fix
      }
      else if (dupMethod == 'tagsComputeDupWithTop2Layers') {
         if (parts.length <= 1) ret = tag + ':' + parts.shift();
         else ret = tag + ':' + parts[0] + '/' + parts[1];
      }
      else {
         // 防呆：包含不屬於 GlobalVar.commonTagsHash（遺漏或沒處理好）的標籤... e.g., tag 為 Udef_EventRelLite1, Udef_DocMeta_Source_title_ch_, etc.
         //       正常來說，tag 應該要屬於 GlobalVar.commonTagsHash？
         //alert("Unknown dupMethod: " + dupMethod + " -- tag: " + tag + " -- " + GlobalVar.commonTagsHash[tag]);
         ret = tag;        // 預設
      }
      
      // 2025-07-21: 目前僅允許透過 Udef_Align_ 和 Udef_DocMeta_ 連結不同 event types ('E', 'M', etc.) 標籤
      //             => 這些標籤即使 commonNodeDupKeyIncludesNodeType 為 true，回傳值也不能加入 eventType（否則就無法跨 event types 連結了）
      if (GlobalVar.commonNodeDupKeyIncludesNodeType) {
         if (!tag.startsWith('Udef_Align_') && !tag.startsWith('Udef_DocMeta_')) {
            ret = eventType + ':' + ret;
         }
     }
      
      return ret;
   }
   
   function getCommonNodeLabel(tag, val, forceToShowTag = false) {
      // 2025-06-18: 類似於 getCommonNodeDupKey，藉由 GlobalVar 決定 common node 顯示什麼 label
      let label = replaceTagPrefix2Symbol(tag);
      let parts = val.split('/');
      let prefix = (forceToShowTag) 
                 ? (replaceTagPrefix2Symbol(tag) + ':') : '';
      
      let origTag = tag;             // 已經是原始標籤名稱（否則需透過 replaceTagSymbol2Prefix(tag) 置換回原始標籤名稱）

      // 2025-07-18: 注意，Udef_Unification_ 標籤通通套用 tagsComputeDupWithPrefix 模式
      //             如果 x/y/z 只有 u/v（通常表示缺少 Type），Type 和 Norm 都對應到 u，Value 對應到 v，Type/Norm 實際上會被視為 Norm/Value 而對應到 u/v
      //             如果 x/y/z 只有 u，Type, Norm, Value, Type/Norm 都會對應到 u
      let dupMethod = 'tagsComputeDupWithPrefix';          // default method
      
      // 2025-09-23: e.g., GlobalVar.tagDupLookup['Udef_properties_number'] 會是 undefined?
      if (GlobalVar.tagDupLookup[origTag] === undefined) {
         console.log(origTag + " is undefined in GlobalVar.tagDupLookup");
      }
      else {
         dupMethod = GlobalVar.tagDupLookup[origTag].dup;          // 2025-07-24
      }

      
      if (dupMethod == 'tagsComputeDupWithPrefix' || origTag.startsWith('Udef_Unification_')) {
         label = prefix + parts.shift();
      }
      else if (dupMethod == 'tagsComputeDupWithInfix') {
         // 2025-08-01: 調整 -- 若只有 u/v，則 infix (Norm) 取 parts[0]
         if (parts.length >= 3) label = prefix + parts[1];
         else label = prefix + parts[0];
      }
      else if (dupMethod == 'tagsComputeDupWithSuffix') {
         //if (parts.length >= 3) label = prefix + parts.pop();
         label = prefix + parts.pop();
      }
      else if (dupMethod == 'tagsComputeDupWithTop2Layers') {
         if (parts.length >= 2) label = prefix + parts[0] + '/' + parts[1];
         else label = prefix + parts[0];
      }
      else ;     // tagsComputeDupWithTagOnly
      
      return label;
   }
   
   function computeDuplicateAndUpdateDisplayGroup() {
      // 若表格資料量龐大，這函式將很吃計算資源...
      // 注意：通過此程序，才會將表格中的 graphNode 從原始的 'E', 'M' 改為 'C'
      // 2024-05-23: 除了更新 GlobalVar.tableData，也回傳 [{id,dupCnt}, {id,dupCnt}, ...] 陣列
      // 計算 GlobalVar.tableData 中，每個 row 的 "value" 在整份表格中被重覆幾次
      // 此 "value" 或許可以是某幾個欄位內容的串接，但暫時就直接用 content 字串來表示
      // 注意：同事件的標記中，即使有多份相同 value，也僅記作一項，也就是「value 出現在不同事件的次數」
      // 2024-07-26: 同步更新 graphNodeLabel
      // 回傳 dupCntArray := [{id:row.id, dupCnt:row.dupCnt, graphNode:row.graphNode}, ... ]
      let tableData = GlobalVar.tableData;

      let valueDict = {};
      tableData.forEach(function(row) {
         let value = getValueAsDupKey(row);
         let eNum = row.eNum;
         if (!valueDict[value]) valueDict[value] = {};     // a hash object
         valueDict[value][eNum] = 1;                       // 2024-07-21: 改用 valueDict[value] = {E001:1, E002:1, ... }
      });
      //alert(JSON.stringify(valueDict));
      
      // 將滿足條件（具有多個 events）的 value 放入 dupValueList 中
      const minConnectivity = GlobalVar.thresholdCommonNodeDegree;
      let dupValueList = [];
      for (let value in valueDict) {
         let connectivity = Object.keys(valueDict[value]).length;
         if (connectivity >= minConnectivity) dupValueList.push(value);
      }
      //console.log(dupValueList);
      
      // 2024-05-22
      let eNodeDict = {};                                        // 2024-06-02: 為了計算有幾個 eNodes
      let cNodeDict = {};                                        // 2024-06-02: 為了計算有幾個 cNodes
      let mNodeDict = {};
      let dupCntArray = [];                                      // 額外回傳 [{id,dupCnt,graphNode}, {id,dupCnt,graphNode}, ...] 陣列，以利 tabulator updateData
      
      // 有點怪... 不能改為以下的 chunked 方式，會出錯！
      //
      //// 2025-09-21: 合併後的資料檔頗大，有 37940 rows, EM/C nodes:1453/1275，因此希望能改成 chunked 計算
      //const total = tableData.length;
      //let processed = 0;
      //const chunkSize = 1000;        // 每批處理 1000 筆
      //
      //function processChunk() {
      //   const end = Math.min(processed + chunkSize, total);
      //   for (let idx = processed; idx < end; idx++) {
      //      row = tableData[idx];
      //
      //      let value = getValueAsDupKey(row);
      //      
      //      let valueEventCount = Object.keys(valueDict[value]).length;
      //      tableData[idx]['dupCnt'] = valueEventCount;             // note: 該 value 於幾個 events
      //      
      //      // 2024-05-25: 自動更新 graphNode, 2024-07-26: 同步更新 graphNodeLabel
      //      if (valueEventCount >= minConnectivity && row.tagName !== 'Udef_EventRelLite') {
      //         // 注意：Cnnn 的 nnn 未必連續 -- 有可能缺（若該 value 的 row.tagName 是 Udef_EventRelLite，例如有 C142, C144, 缺 C143)
      //         let cNode = 'C' + dupValueList.indexOf(value).toString().padStart(3,0);
      //         //alert(cNode + "\n" + JSON.stringify(dupValueList));
      //         tableData[idx]['graphNode'] = cNode;                 // 注意，在此會更新 graphNode，並影響到 node type （用第一個字元表示）
      //         // 2024-09-30: 是否該顯示標籤名稱？
      //         tableData[idx]['graphNodeLabel'] = $("<div/>").append(row.content).text();     // 2024-12-31: 僅取純文字 (row.content 可能包含 <span>)
      //         if (GlobalVar.commonLabelIncludesTagName) {
      //            let rowTagName = row['tagName'];
      //            let eventType = row['tagName'];
      //            if (rowTagName.indexOf("Udef_Evt_") == 0) {                 // 2024-10-15: for comarkus 'E' nodes
      //               eventType = rowTagName.substr("Udef_Evt_".length);   
      //            }
      //            else if (rowTagName.indexOf("Udef_properties_") == 0) {     // 2024-10-15: for immarkus 'M' nodes
      //               eventType = rowTagName.substr("Udef_properties_".length);
      //            }
      //            row['graphNodeLabel'] = eventType + ':' + $("<div/>").append(row.content).text();     // 2024-12-31: 僅取 row.content 純文字 (row.content 可能包含 <span>)
      //         }
      //         cNodeDict[cNode] = 1;
      //      }
      //      else {
      //         // 2024-08-13: 更新回原本值
      //         tableData[idx]['graphNode'] = GlobalVar.tableData[idx]['graphNode'];            
      //         tableData[idx]['graphNodeLabel'] = GlobalVar.tableData[idx]['graphNodeLabel'];    
      //      }
      //      
      //      eNodeDict[row.eNum] = 1;
      //      
      //      dupCntArray.push({id:row.id, dupCnt:row.dupCnt, graphNode:row.graphNode});
      //   }
      //   
      //   processed = end;
      //
      //   //updateProgress(Math.round((processed / total) * 100));
      //   showProgressMsg(processed + '/' + total);
      //
      //   if (processed < total) {
      //      //setTimeout(processChunk, 0);       // 排下一批
      //      // 改用 requestAnimationFrame 確保 UI 有機會更新
      //      requestAnimationFrame(processChunk);
      //      
      //      //// 延遲一點點再進入下一幀... 但在 FF 好像沒什麼效果
      //      //requestAnimationFrame(() => {
      //      //   setTimeout(processChunk, 10);     // 每幀之間多休息 10ms
      //      //});
      //   } else {
      //      // finish tableData computation
      //      hideProgressMsg();
      //   }
      //}
      //
      //processChunk();  
       
      tableData.forEach(function(row, idx) {
         //let value = row.content;                              // 直接用 content 字串作為 value
         let value = getValueAsDupKey(row);
         
         let valueEventCount = Object.keys(valueDict[value]).length;
         tableData[idx]['dupCnt'] = valueEventCount;             // note: 該 value 於幾個 events
         
         // 2024-05-25: 自動更新 graphNode, 2024-07-26: 同步更新 graphNodeLabel
         if (valueEventCount >= minConnectivity && row.tagName !== 'Udef_EventRelLite') {
            let cNode = 'C' + dupValueList.indexOf(value).toString().padStart(3,'0');
            tableData[idx]['graphNode'] = cNode;                 // 注意，在此會更新 graphNode，並影響到 node type （用第一個字元表示）
            // 2024-09-30: 是否該顯示標籤名稱？
            tableData[idx]['graphNodeLabel'] = $("<div/>").append(row.content).text();     // 2024-12-31: 僅取純文字 (row.content 可能包含 <span>)
            if (GlobalVar.commonLabelIncludesTagName) {
               let rowTagName = row['tagName'];
               let eventType = row['tagName'];
               if (rowTagName.indexOf("Udef_Evt_") == 0) {                 // 2024-10-15: for comarkus 'E' nodes
                  eventType = rowTagName.substr("Udef_Evt_".length);   
               }
               else if (rowTagName.indexOf("Udef_properties_") == 0) {     // 2024-10-15: for immarkus 'M' nodes
                  eventType = rowTagName.substr("Udef_properties_".length);
               }
               row['graphNodeLabel'] = eventType + ':' + $("<div/>").append(row.content).text();     // 2024-12-31: 僅取 row.content 純文字 (row.content 可能包含 <span>)
            }
            cNodeDict[cNode] = 1;
         }
         else {
            // 2024-08-13: 更新回原本值
            tableData[idx]['graphNode'] = GlobalVar.tableData[idx]['graphNode'];            
            tableData[idx]['graphNodeLabel'] = GlobalVar.tableData[idx]['graphNodeLabel'];    
         }
         
         eNodeDict[row.eNum] = 1;
         
         dupCntArray.push({id:row.id, dupCnt:row.dupCnt, graphNode:row.graphNode});
      });
      //alert(JSON.stringify(GlobalVar.tableData));
      
      let eLen = Object.keys(eNodeDict).length;
      let cLen = Object.keys(cNodeDict).length;
      $("#tableInfoEMC").text(eLen + "/" + cLen);

      return dupCntArray;
   }
   

