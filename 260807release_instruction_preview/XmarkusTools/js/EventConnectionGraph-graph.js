// ------------------------------
//       d3 graph functions
// ------------------------------

//svg.on("click", (event) => {
//   // 取得點擊位置
//   const [x, y] = d3.pointer(event);
//});

function drawGraph() {
   if (GlobalVar.showSvgOverlayAtDrawing) {
      $("#svgOverlay").fadeIn(3000);      // 2025-06-02
   }

   var nodesPos = [];                     // 為了 force simulation 時，透過 customForce() 計算出 d.x, d.y 等給 ticked() 使用
   
   class GraphNode {
      constructor(group, param) {
         this.group = group;              // 儲存起來...

         // 2025-10-23
         if (GlobalVar.temp.pinnedNodePosition[param.id]) {
            param.x = GlobalVar.temp.pinnedNodePosition[param.id].x;
            param.y = GlobalVar.temp.pinnedNodePosition[param.id].y;
         }
         
         let foreignObjectDisplay = "none";
         let shrinkedObjectDisplay = "block";
         let labelDisplayCss = (param.labelDisplay === true || param.labelDisplay == "true") 
                             ? "block" : "none";    // 2024-07-26
         
         // 使用 foreignObject 顯示可換行的文字內容
         // .select("foreignObject[key='" + key + "']")
         const foreignObject = this.group
           .append("foreignObject")
           .attr("id", "f_" + param.id)                 // 2025-05-27: param.id 就是 graphNode (e.g., E001, C002)
           .attr("type", "node")                        // 2025-02-18
           .attr("graphDataIdx", param.graphDataIdx)
           .attr("x", param.x)
           .attr("y", param.y)
           .attr("width", param.rectWidth || 240)
           .attr("height", param.rectHeight || 160)
           .attr("minWidth", param.minWidth || 120)
           .attr("minHeight", param.minHeight || 80)
           .style("display", foreignObjectDisplay);
           //.datum(function(d) { return d; });         // 綁定資料？
         
         // 在物件右下角顯示一個小方形，藉此來改變拖曳後的 foreignObject 大小
         // 注意：每個矩形物件都有一個小方形，因此畫面上可能呈現多個可用來拖曳的小方形
         let rect = group.append("rect")
                         .style("display", "none");
   
         const foreignDiv = foreignObject.append("xhtml:div")
            .attr("class", "foreignRect " + param.colorClass)
            .style("width", param.rectWidth + "px")
            .style("height", param.rectHeight + "px")
            .style("overflow-wrap", "break-word")
            .style("word-wrap", "break-word")
            //.style("white-space", "pre-wrap")          // 加上後，<div> 之間的間距會加大！
            .style("text-align", "left")
            .style("padding", "10px")
            .style("box-sizing", "border-box")
            .html(param.html);
            
         // 2024-05-15: 縮併後所呈現的小圖示
         let cx = param.x, cy = param.y;
         let shrinkedObject = null;
         
         // 2025-03-17: 先做出 node label 再繪製 node（如此可讓 node 呈現在 node label 上方，不會被字型加上白邊所影響）
         let nodeLabelPos = GlobalVar.nodeTypeLabelPosMap[param.nodeType];         // {'E', 'C', ' M', 'B'} maps to 'top' or 'bottom'
         if (nodeLabelPos == 'top') {
            GlobalVar.labelOffset[nodeLabelPos] = [-5, -15];                       // [x_offset, y_offset]
         }
         else {
            GlobalVar.labelOffset[nodeLabelPos] = [-15, 10 + GlobalVar.nodeSizeRadius * 2];
         }
         
         // 2025-03-17 加上 fontWhiteBorderEffect
         let nodeLabelClass = GlobalVar.nodeFontSizeClass 
                            + (GlobalVar.addNodeLabelFontEffect ? ' fontWhiteBorderEffect' : '')
                            + ' ' + param.nodeLabelColorClass;                   // 2025-05-14
         //alert(nodeLabelClass);
         
         const shrinkedObjectLabel = this.group
                                     .append("text")
                                     .attr("id", "t_" + param.id)
                                     //.attr("class", "graphNodeLabel")
                                     .attr("class", nodeLabelClass)
                                     .attr("x", param.x + GlobalVar.labelOffset[nodeLabelPos][0])               // 2024-12-04
                                     .attr("y", param.y + GlobalVar.labelOffset[nodeLabelPos][1])
                                     .text(param.graphNodeLabel)
                                     .style("display", labelDisplayCss);

         // 2025-11-05
         let flagDisplay = GlobalVar.temp.flaggedNodeList.includes(param.id)
                         ? 'block' : 'none';
         
         const iconObjectFlagSymbol = this.group
                                          .append("text")
                                          .attr("id", "flag_" + param.id)
                                          .attr("class", "flagTextIcon")
                                          .attr("x", param.x - 12)     // 左上方
                                          .attr("y", param.y - 5)      // 左上方
                                          .html('\u2691')              // .text('T'), .html('&#128204;') -- red pin (cannot change color), .html('&#9041;'), .html('\u2691') a flag
                                          .style("display", flagDisplay);

                                             
         // 繪製節點 (2025-05-11: nodeShape 移到 class 外設定）
         let nodeShape = param.nodeShape;
         
         let diameter = GlobalVar.nodeSizeRadius * 2;
         let pointsString;
         switch (nodeShape) {              // 2024-07-21: 藉由 nodeType => nodeShape 選擇圖示的形狀
         case 'circle': 
            shrinkedObject = this.group
                                 .append("circle")
                                 .attr("iconType", nodeShape)
                                 .attr("cx", cx)                          // y-axis coordinate of a center point
                                 .attr("cy", cy)                          // y-axis coordinate of a center point
                                 .attr("r", GlobalVar.nodeSizeRadius);
            break;
         case 'square':
            const squareHalfSize = GlobalVar.nodeSizeRadius;
            shrinkedObject = this.group
                                 .append("rect")
                                 .attr("iconType", nodeShape)
                                 .attr("x", cx - squareHalfSize - 1)     // 小方形的左上角 x 座標
                                 .attr("y", cy - squareHalfSize - 1)     // 小方形的左上角 y 座標
                                 .attr("width", squareHalfSize * 2)      // 小方形的寬度
                                 .attr("height", squareHalfSize * 2);    // 小方形的高度
            break;
         case 'triangle':
            // 計算正三角形的頂點
            pointsString = calculatePolyPoints(nodeShape, [cx,cy], diameter);
            shrinkedObject = this.group
                                 .append("polygon")
                                 .attr("iconType", nodeShape)
                                 .attr("points", pointsString);
            break;
         case 'diamond':      // 2025-07-09: 加上菱形 -- 也需同步更改其他 dragging 和放大縮小 函式
            pointsString = calculatePolyPoints(nodeShape, [cx,cy], diameter);
            shrinkedObject = this.group
                                 .append("polygon")
                                 .attr("iconType", nodeShape)
                                 .attr("points", pointsString);
            break;            
         //case 'star':
         //   pointsString = calculateStarPoints([cx,cy], diameter, diameter/2);
         //   shrinkedObject = this.group
         //                        .append("polygon")
         //                        //.attr("type", "node")
         //                        //.attr("nodeType", param.nodeType)
         //                        .attr("iconType", "triangle")
         //                        .attr("points", pointsString);
         //   break;            
         default:
            console.log("Unrecognized nodeType: " + param.nodeType);
         }

         // 2025-08-22: 雖然繪製 icon 時只有 circle 需要用到 cx, cy，但將它們儲存起來可方便後續調整大小卻不整個重繪
         shrinkedObject.attr("type", "node")                        // 2025-09-17: 方便 selectAll("
                       .attr("cx", cx)
                       .attr("cy", cy);

         shrinkedObject.attr("id", "c_" + param.id)
                       .attr("graphDataIdx", param.graphDataIdx)
                       .attr("class", "shrinkedObject " + param.colorClass)
                       .style("display", shrinkedObjectDisplay);

         // -----------------------------------------------------------------------------

         // 拖曳函式
         // 2025-10-09: dragging 處理過程必須過濾掉 altKey 等事件，否則可能會吃掉 node click 事件！
         //             後續在 foreignObject 和 shrinkedObject 都套用拖曳函式
         const nodeDrag = d3.drag()
                             .filter((event) => {    // 2026-01-23 TEST
                                // 只允許左鍵、且沒有 Alt (event.ctrlKey 和 event.shiftKey 因為 dragging 需求可通過)
                                return (event.button === 0 && !event.altKey);
                             })
                            .on("start", nodeDragStart)
                            .on("drag", nodeDragging)
                            .on("end", nodeDragEnd);

         shrinkedObject.on("click", function(evt) {
            if (!GlobalVar.disallowNodeExpansion) return;        // 舊模式：允許雙擊展開節點（不套用單擊顯示內容模式）
            evt.stopPropagation();     

            // 注意，由於 GlobalVar.temp.flaggedNodeList 是陣列，不能用 let a = GlobalVar.b 的方式取得參考後，透過 a 來更新 GlobalVar.b！
            let clickToShowContent = true;
            if (evt.altKey) {      // 2025-11-10: evt.ctrlKey 也可以... 先前是被 dragging event 吃掉了
               let obj = d3.select(this);
               let nodeId = obj.attr("id").substr("c_".length);
               clickToShowContent = !GlobalVar.temp.flaggedNodeList.includes(nodeId);    // 若在 flaggedNodeList 中，表示 click 是要移除高亮，不需顯示內容
               if (clickToShowContent) {
                  GlobalVar.temp.flaggedNodeList.push(nodeId);
               }
               else {
                  GlobalVar.temp.flaggedNodeList = GlobalVar.temp.flaggedNodeList.filter(x => (x !== nodeId));
               }
               
               //alert(nodeId + "\n" + JSON.stringify(GlobalVar.temp.flaggedNodeList) + "\n" + clickToShowContent);
            }
            
            // 注意：會吃掉 dblclick -- 因此允許 click 就代表 disable double-click
            if (clickToShowContent) {
               // D3 在 .on("event", callback) 裡，會把 this 綁定成當前綁定事件的 原生 DOM 元素
               let me = this;

               // 2025-12-10: 若內容為 [DYN_ImageInfo]，則顯示 Preparing 訊息（注意，每次點擊都得重新計算）
               //             但由於僅有 'M' nodes 才會有 [DYN_DYN_ImageInfo]，判斷是否為 image nodes 即可
               //let jqDiv = $("<div/>").append(param.html);
               //if (jqDiv.text().trim() == '[DYN_ImageInfo]') {
               if (param.nodeType == 'M') {
                  showProgressMsg("ImageInfo...");
                  window.setTimeout(function() {
                     showNodeContentAndHighlights(me);
                     hideProgressMsg();
                  }, 200);
               }
               else showNodeContentAndHighlights(me);
            }
            else {
               group.selectAll(".flagTextIcon")
                    .style("display", function() {
                       let me = this;
                       let nodeId = me.id.substr("flag_".length);
                       let ret = GlobalVar.temp.flaggedNodeList.includes(nodeId) ? 'block': 'none';
                       return ret;
                    });
            }
            
            // 2025-11-26: Dawn 說，若沒有 flagged nodes 採取 non-fading mode，有則採 fading mode
            GlobalVar.displayGraphOnFadingMode = (GlobalVar.temp.flaggedNodeList.length > 0);

            arrows.data(getArrowPaths())
                  .attr("d", d => d.path)
                  .attr("stroke", d => d.pathColor)
                  .attr("stroke-dasharray", d => (d.type === "dashed") ? "5,3" : null)    // 虛線: "4,2" 表示 4px線+2px空格，null 表示實線
                  .attr("pathClass", d => d.pathClass);       // 2025-11-03
         })
         .call(nodeDrag);

         // 2024-05-14: 雙擊保留給「切換顯示：方塊或圖示」
         // 2025-09-16: assisted with ChatGPT
         shrinkedObject.on("dblclick", function(evt) {
            evt.stopPropagation();                           // 防止傳到 zoom handler
            if (GlobalVar.disallowNodeExpansion) return;     // 防止「偶而」雙擊仍會被觸發
            
            let obj = d3.select(this);
            let objId = obj.attr("id");       // f_<graphNode>, c_<graphNode>, etc.
            let nodeType = objId.substr(2, 1);
            if (nodeType === 'C' && !GlobalVar.enableExpandCommonNodes) return;
         
            // 反轉 transform 得到原始（未轉換前）的 SVG 座標
            //let transform = GlobalVar.currentZoomTransform || d3.zoomIdentity;
            //let [cx, cy] = transform.invert([+obj.attr("cx"), +obj.attr("cy")]);
            let [cx, cy] = [+obj.attr("cx"), +obj.attr("cy")];
         
            obj.style("display", "none");
            shrinkedObjectLabel.style("display", "none");
         
            // shrinkedObject 可能被拖曳到新的位置，因此需計算 foreignObject 的 (x,y)
            // 調整 w/h：從 attr 取出原始值後，再反轉 zoom 縮放
            let rawW = +(foreignObject.attr("origWidth") || foreignObject.attr("width"));
            let rawH = +(foreignObject.attr("origHeight") || foreignObject.attr("height"));
            //let w = rawW / transform.k;
            //let h = rawH / transform.k;
            let w = rawW;
            let h = rawH;
         
            let x = Math.floor(cx - w / 2);
            let y = Math.floor(cy - h / 2);
            if (x < 0) x = 0;
            if (y < 0) y = 0;
         
            foreignObject
               .attr("x", x)
               .attr("y", y)
               .attr("width", w)
               .attr("height", h)
               .raise()
               .style("display", "block");
         
            // 2024-05-27: 也需更新 graphData（繪製弧線）
            let graphDataIdx = +obj.attr("graphDataIdx");
            graphData[graphDataIdx].x = cx;
            graphData[graphDataIdx].y = cy;
         
            GlobalVar.temp.graphNodeObjArray[graphDataIdx].expandedObject = foreignObject;
         
            // 似乎不需重新繪製弧線？但還是同步一下...
            arrows.data(getArrowPaths())
                  .attr("d", d => d.path)
                  .attr("stroke", d => d.pathColor)
                  .attr("stroke-dasharray", d => (d.type === "dashed") ? "5,3" : null)    // 虛線: "4,2" 表示 4px線+2px空格，null 表示實線
                  .attr("pathClass", d => d.pathClass);       // 2025-11-03
         });         
         
         foreignObject.on("dblclick", function(evt) {
            evt.stopPropagation();
            if (GlobalVar.disallowNodeExpansion) return;     // 防止「偶而」雙擊仍會被觸發

            //alert("foreignObject double-clicked");
            let obj = d3.select(this);
            let mouseX, mouseY;
            //let mouseX = evt.x;            // 滑鼠座標（相對於螢幕）
            //let mouseY = evt.y;
    
            //let id = obj.attr("id");
            let x = Number(obj.attr("x"));
            let y = Number(obj.attr("y"));
            let w = Number(obj.attr("width"));
            let h = Number(obj.attr("height"));
            let cx = Math.floor(x + w / 2);           // 由於從「矩形」改成「圓形」都會將圓心置於矩形中間，當矩形因故貼齊畫布邊緣時，重覆切換可能導致圓心跟一開始不同
            let cy = Math.floor(y + h / 2);
            //let cx = mouseX;                        // 將縮小的節點置放在滑鼠點擊的位置
            //let cy = mouseY;
            let r = GlobalVar.nodeSizeRadius;
            obj.attr("origWidth", w);                 // 將當前 width, height 儲存起來
            obj.attr("origHeight", h);
            //console.log(cx + ':' + cy);
            
            // 動畫：縮小 foreignObject (by ChatGPT)
            obj.transition()
               .duration(500)
               .attr("width", 0)
               .attr("height", 0)
               .attr("x", cx)   // 讓它縮小往中心點
               .attr("y", cy)
               .on("end", function() {
                  obj.style("display", "none");
         
                  // 也隱藏小方形（假設 rect 是同一層級的元素）
                  rect.style("display", "none");
         
                  // 顯示縮小圖形
                  let iconType = shrinkedObject.attr("iconType");        // 2025-07-09
                  let pointsString = (iconType === 'circle' || iconType === 'square')
                                   ? ''
                                   : calculatePolyPoints(iconType, [cx,cy], diameter);
                  //let shrinkedObject = d3.select("#c_" + obj.attr("id").substr(2));
                  shrinkedObject.attr("cx", cx)
                                .attr("cy", cy)
                                .attr("r", r)
                                .attr("x", cx - GlobalVar.nodeSizeRadius / 2)
                                .attr("y", cy - GlobalVar.nodeSizeRadius / 2)
                                .attr("points", pointsString)
                                .raise()
                                .style("display", "block");
         
                  shrinkedObjectLabel.attr("x", cx - r / 2)
                                     .attr("y", cy - 3 * r / 2)
                                     .classed("highlighted", false)
                                     .style("display", labelDisplayCss);
                                     
                  //iconObjectFlagSymbol 未實作
         
                  // 更新 graphData 與箭頭
                  let graphDataIdx = +obj.attr("graphDataIdx");
                  graphData[graphDataIdx].x = cx;
                  graphData[graphDataIdx].y = cy;
                  GlobalVar.temp.graphNodeObjArray[graphDataIdx].iconObject = shrinkedObject;
                  arrows.data(getArrowPaths())
                        .attr("d", d => d.path)
                        .attr("stroke", d => d.pathColor)
                        .attr("stroke-dasharray", d => (d.type === "dashed") ? "5,3" : null)    // 虛線: "4,2" 表示 4px線+2px空格，null 表示實線
                        .attr("pathClass", d => d.pathClass);       // 2025-11-03
               });
         });

         // 用 jQuery 或 D3 選 drag handle（一定要確定元素已插入 DOM）
         d3.select(foreignObject.node().querySelector(".dragHandle"))
           .call(nodeDrag);
         
         // -------- 拖曳相關的處理 ---------
         var dragVar = {};
         
         // 2025-06-09, 2025-06-30: GenAI (ChatGPT, Copilot) 真的太厲害了... 
         //             原本修碼弄得心煩，想不到將程式碼上載並簡單說明狀況，ChatGPT 竟可修改原本
         //             錯誤的程式碼，然後產生以下可運行的程式碼...
         
         function nodeDragStart(event) {
            console.log("nodeDragStart");
            if (event.sourceEvent) {
               event.sourceEvent.stopPropagation();
               //if (event.sourceEvent.target.setPointerCapture) {     // for Edge
               //   event.sourceEvent.target.setPointerCapture(event.sourceEvent.pointerId);
               //}
            }
            
            GlobalVar.temp.onNodeDraggingState = false;       // 2025-10-09: nodeDragging() 時才設為 true

            let obj = d3.select(this);
            let outerId = "aux_" + obj.attr("id");
            if (!group.select(`[id=${outerId}]`).empty()) hideNodeContent();    // 若拖動的是當前 highlight 的節點，就先將內容隱藏

            if (obj.classed("dragHandle")) {
               let targetDataIdx = +obj.attr("graphDataIdx");
               let graphNodeObj = GlobalVar.temp.graphNodeObjArray[targetDataIdx];
               let rect = graphNodeObj.rect4Resize;
               rect.style("display", "none").classed("active", false);
               obj = graphNodeObj.expandedObject;
            }
         
            let sourceDataIdx = +obj.attr("graphDataIdx");
            let nodesToMove = [obj];
         
            // 快捷鍵選多個
            if (event.sourceEvent) {
               if (event.sourceEvent.shiftKey) {
                  GlobalVar.temp.graphDataIdxLinks[sourceDataIdx].forEach(targetDataObj => {
                     let { nodeIdx } = targetDataObj;
                     let targetNode = GlobalVar.temp.graphNodeObjArray[nodeIdx].iconObject;
                     if (targetNode.style("display") === "none") {
                        targetNode = GlobalVar.temp.graphNodeObjArray[nodeIdx].expandedObject;
                     }
                     nodesToMove.push(targetNode);
                  });
               }
               // 因提供 canvas zoom in/out，不需再用 alt-drag 拖曳所有節點
               //else if (event.sourceEvent.altKey) {
               //   Object.keys(GlobalVar.temp.graphNodeObjArray).forEach(dataIdx => {
               //      let targetNode = GlobalVar.temp.graphNodeObjArray[dataIdx].iconObject;
               //      if (targetNode.style("display") === "none") {
               //         targetNode = GlobalVar.temp.graphNodeObjArray[dataIdx].expandedObject;
               //      }
               //      nodesToMove.push(targetNode);
               //   });
               //}
            }

            // 取得未經 transform 的滑鼠座標（重要！）
            //const transform = GlobalVar.currentZoomTransform || d3.zoomIdentity;
            //const [mouseX, mouseY] = transform.invert(d3.pointer(event, group.node()));    // 把滑鼠事件的座標，轉換成「相對於容器節點 <g>」的座標
            const [mouseX, mouseY] = d3.pointer(event, group.node());
         
            dragVar.mouseStart = { x: mouseX, y: mouseY };
         
            dragVar.nodesToMove = nodesToMove.map(node => {
               if (GlobalVar.raiseMovedElementsOnDragging) node.raise();    // 2026-04-23: 可能造成 conflict？
               // node.raise();         
         
               // 取得原始座標 (沒經過 transform)
               let x = node.classed("shrinkedObject") ? +node.attr("cx") : +node.attr("x");
               let y = node.classed("shrinkedObject") ? +node.attr("cy") : +node.attr("y");
         
               return { node, x, y };
            });
         }
         
         function nodeDragging(event) {
            GlobalVar.temp.onNodeDraggingState = true;
            
            //const transform = GlobalVar.currentZoomTransform || d3.zoomIdentity;
            //const [mouseX, mouseY] = transform.invert(d3.pointer(event, group.node()));
            const [mouseX, mouseY] = d3.pointer(event, group.node());
         
            const dx = mouseX - dragVar.mouseStart.x;
            const dy = mouseY - dragVar.mouseStart.y;
         
            dragVar.nodesToMove.forEach(({ node, x: startX, y: startY }) => {
               const newX = startX + dx;
               const newY = startY + dy;
               let nodeId = node.attr("id").substr(2);
         
               const graphDataIdx = +node.attr("graphDataIdx");
         
               if (node.classed("shrinkedObject")) {
                  let iconType = node.attr("iconType");
         
                  let pointsString = (iconType === 'circle' || iconType === 'square')
                                   ? ''
                                   : calculatePolyPoints(iconType, [newX, newY], GlobalVar.nodeSizeRadius * 2);

                  // "main" node
                  node.attr("cx", newX)
                      .attr("cy", newY)
                      .attr("x", newX - GlobalVar.nodeSizeRadius / 2)
                      .attr("y", newY - GlobalVar.nodeSizeRadius / 2)
                      .attr("points", pointsString);
         
                  // label
                  d3.select("#t_" + nodeId)
                    .attr("x", newX + GlobalVar.labelOffset[nodeLabelPos][0])
                    .attr("y", newY + GlobalVar.labelOffset[nodeLabelPos][1]);
         
                  // 2025-11-03: iconObjectFlagSymbol
                  d3.select("#flag_" + nodeId)
                    .attr("x", newX - 12)
                    .attr("y", newY - 5);
                    
                  // 2025-11-03: nodeHighlightCircle
                  // 2025-11-11: 加上 iconType 判斷
                  d3.select("#aux_" + nodeId)
                    .attr("cx", (iconType == 'circle') ? newX : newX + GlobalVar.nodeSizeRadius / 2)
                    .attr("cy", (iconType == 'circle') ? newY : newY + GlobalVar.nodeSizeRadius / 2);
         
                  graphData[graphDataIdx].x = newX;
                  graphData[graphDataIdx].y = newY;
               } 
               else {
                  node.attr("x", newX).attr("y", newY);
         
                  graphData[graphDataIdx].x = newX + (+node.attr("width") / 2);
                  graphData[graphDataIdx].y = newY + (+node.attr("height") / 2);
               }
            });
         
            // 更新所有連線（應該只需更新 nodesToMove neighbors 會更有效率）
            // -- TODEBUG: 為什麼拖曳時，有時虛線會變成實線？
            arrows.data(getArrowPaths())
                  .attr("d", d => d.path)
                  .attr("stroke", d => d.pathColor)
                  .attr("stroke-dasharray", d => (d.type === "dashed") ? "5,3" : null)    // 2025-11-26: 虛線: "4,2" 表示 4px線+2px空格，null 表示實線                  
                  .attr("pathClass", d => d.pathClass);                                    // 2025-11-03: 加上 pathClass 以利後續判斷

            // 2026-04-24
            if (GlobalVar.raiseMovedElementsOnDragging) arrows.raise();
        }

         function nodeDragEnd(event) {
            if (!GlobalVar.temp.onNodeDraggingState) {
               // 若沒有真的拖動過 → 模擬 click（但有時會變成感覺上觸發兩次 click）
               d3.select(event.sourceEvent.target).dispatch("click");
            }
    
            GlobalVar.temp.onNodeDraggingState = false;

            let obj = d3.select(this);
            obj.classed("active", false);
            GlobalVar.temp.onNodeDraggingState = false;
         }
         
         // ----------------------------------------------------------------
         
         function showNodeContentAndHighlights(domNode) {
            // 注意：除了顯示節點內容，也高亮相關的 nodes/links
            group.selectAll(".nodeHighlightCircle").remove();    // 移除既有的 circle 標記
            
            let obj = d3.select(domNode);
            let nodeId = obj.attr("id").substr("c_".length);     // obj.attr("id") := 'c_E002'
            let iconType = obj.attr("iconType");
            let cx = +obj.attr("cx");
            let cy = +obj.attr("cy");
            if (iconType != "circle") {
               cx += GlobalVar.nodeSizeRadius/2;
               cy += GlobalVar.nodeSizeRadius/2;
            }
            
            group.append("circle")
                 .attr("id", "aux_" + nodeId)       // 方便後續可利用 node id 取得這個外圈
                 .attr("type", "aux")
                 .attr("class", "nodeHighlightCircle")
                 .attr("cx", cx)
                 .attr("cy", cy)
                 .attr("r", GlobalVar.nodeSizeRadius + 8)
                 .attr("fill", "none")                                // 圓內不填色，可填顏色如 "red"
                 .attr("stroke", GRAPH_COLORS.nodeHighlightCircle)    // 圓框顏色
                 .attr("stroke-width", 3);                            // 邊框寬度
                 
            // 2025-09-23: 若包含影像，將不能直接套用 param.html（因其 viewBox 並未更新）
            //             必須將 viewBox 正確設定上去才行... 但要怎麼做才好呢？
            //alert(param.html);
             
            // 2025-12-10: div.nodeContent 是固定區塊，內容由 param.html 動態加上去顯示
            let jqDiv = $("<div/>").append(param.html);
            if (jqDiv.text().trim() == '[DYN_ImageInfo]') {
               let jqNodeEventHtml = jqDiv.find("div.nodeEventHtml");      // 2025-12-24
               let graphNode = jqNodeEventHtml.attr("graphNode");
               let html = getEventElementsHtml(graphNode, "00", true);     // 2024-09-14
               jqNodeEventHtml.html(html);                                 // 2025-12-24: bug fix （必須放在 div.nodeEventHtml 而非 jqDiv 下）
            }
            
            let jqSvgImageContainer = jqDiv.find("svg.imageContainer");
            if (jqSvgImageContainer.length > 0) {
               let imageKey = jqSvgImageContainer.find("image").first().attr("key");
               let viewBox = GlobalVar.imageContainerViewBox[imageKey];   // 若無法取得影像，viewBox 會是 undefined
               if (viewBox) jqSvgImageContainer.attr("viewBox", viewBox);   
            }
            
            $("div.nodeContent").html(jqDiv.html());
            $("div.nodeContentArea").show();
            
            // 2025-11-01: 透過 nodeId 決定是否在 GlobalVar.temp.flaggedNodeList 之中
            let flaggedNodeList = GlobalVar.temp.flaggedNodeList;
            group.selectAll(".flagTextIcon")
                 .style("display", function() {
                    let me = this;
                    let nodeId = me.id.substr("flag_".length);
                    let ret = GlobalVar.temp.flaggedNodeList.includes(nodeId) ? 'block': 'none';
                    return ret;
                 });
            
            // 2025-11-02
            fadingHighlightingNodesAndPaths(nodeId);
            
            // 2025-10-21: 動態註冊 div.nodeContent 內的事件
            $("div.nodeContent").find("span.butLinkBack")
                                .off("click").on("click", function(evt) {
               //alert("Linkback: " + $(this).attr("filenames"));
               let filenamesStr = $(this).attr("filenames");
               let queryStr = '{' + filenamesStr + '}';          // m.filename:f1|f2|...
               if (GlobalVar.linkbackViaBroadcastChannel && location.protocol !== 'file:') {          // 2025-10-31
                  // 透過頻道廣播 -- 可在同源之間傳播訊息
                  let source = 'EventConnectionGraph';
                  let target = 'XmarkusAnalyzer';
                  let purpose = 'searchingDocuments';
                  sendBroadcastMessage(source, target, purpose, queryStr, '');
               }
               else {
                  // 透過 iframe 之間 window.postMessage()
                  linkback2Text(queryStr);
               }
            });
         }
         
         function hideNodeContent() {
            group.selectAll(".nodeHighlightCircle").remove();
            $("div.nodeContentArea").hide();        // #divNodeContentContainer 保持 visible?
         }
         
         // -----------------------------------------------------------------------------
   
         let objCreated = null;
         let node = { id: "c_" + param.id, 
                      nodeType: param.nodeType, 
                      x: param.x, 
                      y:param.y
                    };
         //if (foreignObjectDisplay == "block") {
         //   objCreated = foreignObject;
         //   node.id = "f_" + param.id;
         //}
         //else {
         //   objCreated = shrinkedObject;
         //   node.id = "c_" + param.id;
         //}
         nodesPos.push(node);
   
         this.iconObject = shrinkedObject;                         // 2025-07-05
         this.iconObjectLabel = shrinkedObjectLabel;               // 2025-07-09
         this.iconObjectFlagSymbol = iconObjectFlagSymbol;         // 2025-11-01
         this.expandedObject = foreignObject;                      // 2025-07-05
         this.expandedObjectForeignDiv = foreignDiv;
         this.rect4Resize = rect;
         this.hideNodeContent = hideNodeContent;                   // 2025-10-01: expose method
      }  // constructor
      
   }     // class GraphNode
   
   // --------------------------------------------------------------------------

   // 2025-09-25
   //const widthScale = d3.scaleSqrt()
   //                     .domain([1, d3.max(getArrowPaths(), d => d.weight)]) // 這裡的 domain 最小值是 1
   //                     .range([1, Math.sqrt(d3.max(getArrowPaths(), d => d.weight) - 1) + 1]);
   function widthScale(n) {
      if (!GlobalVar.enableWeightedLinkWidth || !n) return 1;                  // 防呆
      return Math.min(10, Math.sqrt(n - 1) + 1);                               // 最大寬度 10
      //return 1 + ((n-1) ** (1/3));     // 1 + (n-1)^{1/3}
   }

   
   // 2025-05-20: graph title
   function plotGraphTitle(svg, graphTitle) {
      const svgWidth = +svg.attr("width");
      const svgHeight = +svg.attr("height");
      
      let legendX = 0;
      let legendY = 0;
      
      const graphTitleGroup = svg.append("g")
                                 .attr("transform", `translate(0, 0)`)
                                 .style("cursor", "grab")             // "move" or "grab"
                                 .call(
                                    d3.drag()
                                      .on("start", dragStarted)
                                      .on("drag", dragged)
                                      .on("end", dragEnded)
                                 );
      
      // 外框先畫出來，稍後再設定寬高
      const backgroundRect = graphTitleGroup.append("rect")
                                            .attr("x", 0)
                                            .attr("y", 0)
                                            .attr("fill", "#ffffff")
                                            .attr("stroke", "#ffffff")
                                            .attr("stroke-width", 1)
                                            .attr("rx", 6)
                                            .attr("ry", 6);
      
      // 標題
      graphTitleGroup.append("text")
                     .attr("x", 0)
                     .attr("y", 0)
                     .attr("class", "graphTitleClass")
                     .text(graphTitle);
      
      // 等待渲染完成再量測尺寸與定位
      requestAnimationFrame(() => {
         const bbox = graphTitleGroup.node().getBBox();
         
         const padding = 10;
         backgroundRect.attr("x", bbox.x - padding)
                       .attr("y", bbox.y - padding)
                       .attr("width", bbox.width + padding * 2)
                       .attr("height", bbox.height + padding * 2);
         
         // 計算左上角位置
         legendX = 40;
         legendY = 40;
         graphTitleGroup.attr("transform", `translate(${legendX}, ${legendY})`);
      });
      
      function dragStarted(event) {
         //--d3.select(this).raise();
      }
      
      function dragged(event) {
         legendX += event.dx;
         legendY += event.dy;
         d3.select(this).attr("transform", `translate(${legendX}, ${legendY})`);
      }
      
      function dragEnded(event) {
         // 可選操作
      }
   }
   
   
   // 2025-05-11: d3 svg legend (with ChatGPT)
   //             (1). SVG 圖例產生於左下角
   //             (2). 圖例有外框，並自動包住所有圖例內容（使用 getBBox 測量）
   //             (3). 可拖曳圖例群組（legendGroup）
   function plotLegend(svg, legendData, legendGroupTitle) {
      const svgWidth = +svg.attr("width");
      const svgHeight = +svg.attr("height");
      
      // 2025-06-04: 將項目歸類
      let legendDataTypeList = {};
      legendData.forEach(function(item) {
         let type = item.type;
         if (!legendDataTypeList[type]) legendDataTypeList[type] = [];
         legendDataTypeList[type].push(item);
      });
      
      const legendGroup = svg.append("g")
                             .attr("transform", `translate(0, 0)`)
                             .style("cursor", "grab")
                             .call(
                                d3.drag()
                                  .on("start", dragStarted)
                                  .on("drag", dragged)
                                  .on("end", dragEnded)
                             );
      
      // 外框先畫出來，稍後再設定寬高
      const backgroundRect = legendGroup.append("rect")
                                        .attr("x", 0)
                                        .attr("y", 0)
                                        .attr("fill", "#f9f9f9")
                                        .attr("stroke", "#999")
                                        .attr("stroke-width", 1)
                                        .attr("rx", 6)
                                        .attr("ry", 6);
      
      // 圖例標題
      legendGroup.append("text")
                 .attr("x", 0)
                 .attr("y", 0)
                 .attr("font-size", 14)
                 .attr("font-weight", "bold")
                 .text(legendGroupTitle);
      
      // 依序產生每個圖例項目
      let lines = 1;
      Object.keys(legendDataTypeList).forEach(function(type, typeIdx) {
         // type := 'E', 'M', 'C'
         let itemList = legendDataTypeList[type];

         // 將節點類型依照 'E', 'M', 'C' 等歸類         
         //if (itemList.length > 1) {
         //   legendGroup.append("text")
         //              .attr("x", 0)
         //              .attr("y", (lines++) * 25 + 4 * (typeIdx+1))
         //              .attr("font-size", 14)
         //              .text(NodeTypeNameMap[type]);
         //}
         
         itemList.forEach((item, index) => {
            // item := {"type":"E","shape":"square","colorClass":"colorSetB08","label":"Event"}
            //alert(JSON.stringify(item));
            const y = (lines++) * 25;
            
            let shape;
            if (item.shape === "circle") {
              shape = legendGroup.append("circle")
                                 .attr("cx", 10)
                                 .attr("cy", y)
                                 .attr("r", 6);
            } else if (item.shape === "square") {
              shape = legendGroup.append("rect")
                                 .attr("x", 4)
                                 .attr("y", y - 6)
                                 .attr("width", 12)
                                 .attr("height", 12);
            } else if (item.shape === "triangle") {
               //const points = `${10},${y} ${4},${y - 10} ${16},${y - 10}`;     // 倒三角形
               const offset = 4;              // 往下偏移量
               const points = `${10},${y - 10 + offset} ${4},${y + offset} ${16},${y + offset}`;
               shape = legendGroup.append("polygon")
                                  .attr("points", points);
            } else if (item.shape === "diamond") {
               const points = `${10},${y - 6} ${4},${y} ${10},${y + 6} ${16},${y}`;
               shape = legendGroup.append("polygon")
                                  .attr("points", points);
            }
            else alert("Unknown shape: " + item.shape);
            
            //shape.attr("fill", item.color);
            shape.attr("class", item.colorClass);
            
            legendGroup.append("text")
                       .attr("x", 25)
                       .attr("y", y + 4)
                       .attr("font-size", 12)
                       .text(item.label);
         });
      });
      
      // 等待渲染完成再量測尺寸與定位
      let legendX = 0;           // 需要先定義，後續才能夠拖曳
      let legendY = 0;
      
      requestAnimationFrame(() => {
         const bbox = legendGroup.node().getBBox();
         
         const padding = 10;
         backgroundRect.attr("x", bbox.x - padding)
                       .attr("y", bbox.y - padding)
                       .attr("width", bbox.width + padding * 2)
                       .attr("height", bbox.height + padding * 2 + 2);
         
         // 計算左下角位置
         legendX = 40;              // 需用到
         legendY = svgHeight - (bbox.height + padding * 2) - 20;
         legendGroup.attr("transform", `translate(${legendX}, ${legendY})`);
      });
      
      function dragStarted(event) {
         //--d3.select(this).raise();
      }
      
      function dragged(event) {
         legendX += event.dx;
         legendY += event.dy;
         d3.select(this).attr("transform", `translate(${legendX}, ${legendY})`);
      }
      
      function dragEnded(event) {
         // 可選操作
      }
   }  // plotLegend

   // -------------------------------------------------------------------------------------
   //                                plot graph
   // -------------------------------------------------------------------------------------

   const svg = d3.select("svg");
   svg.selectAll("*").remove();                    // 清除 svg 中的所有物件
   
   // 2024-09-29
   let viewportWidth = parseInt($("#viewportWidth").val());      // NaN ?
   let viewportHeight = parseInt($("#viewportHeight").val());
   
   // 2025-02-21: 測了一下，在此可以取得 window.innerWidth？
   if (isNaN(viewportWidth)) {                     // 初始時並沒有值？
      viewportWidth = window.innerWidth - 30 - GlobalVar.leftSidebarWidth;       // 2024-11-04: 需扣除 leftSidebarWidth
   }
   else if (viewportWidth < MIN_VIEWPORT_WIDTH) viewportWidth = MIN_VIEWPORT_WIDTH;
   else if (viewportWidth > MAX_VIEWPORT_WIDTH) viewportWidth = MAX_VIEWPORT_WIDTH;
      
   if (isNaN(viewportHeight)) viewportHeight = window.innerHeight - GlobalVar.svgTopOffset - 25;   // 2025-06-03: 原先是 -20，改為 -25 可避免一開始就出現垂直捲軸
   else if (viewportHeight < MIN_VIEWPORT_HEIGHT) viewportHeight = MIN_VIEWPORT_HEIGHT;
   else if (viewportHeight > MAX_VIEWPORT_HEIGHT) viewportHeight = MAX_VIEWPORT_HEIGHT;
   
   //alert("Graph width, height = " + viewportWidth + ", " + viewportHeight + " --- " + window.innerWidth);
      
   $("#viewportWidth").val(viewportWidth);
   $("#viewportHeight").val(viewportHeight);

   GlobalVar.svgWidth = viewportWidth * GlobalVar.svgCanvasScale;
   GlobalVar.svgHeight = viewportHeight * GlobalVar.svgCanvasScale;
   
   svg.attr("width", GlobalVar.svgWidth);
   svg.attr("height", GlobalVar.svgHeight);
   
   // 測試：用 viewBox 來取得縮小圖
   //svg.attr("viewBox", "0 0 " + GlobalVar.svgWidth * 2 + " " + GlobalVar.svgHeight * 2);

   // 基本上 GlobalVar.graphNodeDict 會儲存所有節點資訊，並透過每個節點的 display 屬性判斷是否要繪製出來
   //console.log(GlobalVar.graphNodeDict);
   let graphData = computeGraphData();                      // graph node 陣列
   GlobalVar.temp.graphData = graphData;                    // 2025-08-22: 將計算結果存入 GlobalVar.temp.graphData，方便後續 apply styling 利用（似乎不需要？）
   
   // 利用 graphData 的 graphDataIdx，計算 GlobalVar.temp.graphDataIdxLinks
   // 其中 graphDataIdxLinks[i] := [{j1,w1}, {j2,w2}, ..., {jn,wn}] 表示節點索引 i 與節點索引 j1, ..., jn 之間有連線, wi 是權重
   // 每一個 graph node（不論是 event node 或 common node）都有唯一的 graph node index
   // 後續可透過 GlobalVar.temp.graphNodeObjArray[graphDataIdx] 取得該 graph node 物件
   // TODO: 將 j1, j2 改為 {nodeIdx, weight} 物件，以利後續利用 weight 更改連線粗細
   GlobalVar.temp.graphDataIdxLinks = [];                       // reset
   let graphDataIdxLinks = GlobalVar.temp.graphDataIdxLinks;    // reference
   graphData.forEach(function(source) {
      graphDataIdxLinks[source.graphDataIdx] = [];              // initialize
   });
   graphData.forEach(function(source) {
      let sourceIdx = source.graphDataIdx;
      graphData.forEach(function(target) {
         if (source.id === target.id) return;                   // 自己到自己，不加上連線
         if (target.linkToGroups[source.id]) {
            let targetIdx = target.graphDataIdx;
            let linkObj = { nodeIdx: targetIdx, weight: 1};
            graphDataIdxLinks[sourceIdx].push(linkObj);         // sourceIdx 為 'C' node，linkObj.nodeIdx 為 event node
            linkObj = { nodeIdx: sourceIdx, weight: 1};
            graphDataIdxLinks[targetIdx].push(linkObj);         // 2025-06-10: 產生反向的連結
         }
      });
   });
   //alert(JSON.stringify(GlobalVar.temp.graphDataIdxLinks));
   
   const wrappedGroup = svg.append("g").attr("id", "wrappedGroup");
   
   if (GlobalVar.displayGraphOnFadingMode) {
      // 2025-11-24: 雖然 tooltip 並不需加上 colorFading...（它只有在被 hover 時才會顯示，而只要顯示就不需加上 colorFading）
      wrappedGroup.selectAll("*")
                  .classed("colorFading", true)
                  .lower();           // 2026-01-24: 通通送到最底層
   }

   //alert("Flagged nodes: " + JSON.stringify(GlobalVar.temp.flaggedNodeList));
   
   // 繪製 event nodes
   // console.log(graphData);
   GlobalVar.temp.graphNodeObjArray = [];                 // 2025-06-15
   graphData.forEach(function(d) {
      if (GlobalVar.hideGraphNodeTagPrefix) {             // 2025-06-25
         d.graphNodeLabel= d.graphNodeLabel.replace(/[\*\^\#]/g, '');    // 偷懶直接將所有 symbols 移除
      }
      let graphNode = new GraphNode(wrappedGroup, d);     // 透過 new GraphNode(.) 繪製節點
      GlobalVar.temp.graphNodeObjArray[d.graphDataIdx] = graphNode;
   });
   //alert(JSON.stringify(GlobalVar.temp.graphNodeObjArray));
   
   raiseAllNodes();
   
   // 2024-12-30: 影像是透過 expandedObject 載入後，在此動態調整 viewBox 大小...
   //             注意，必須在 GraphNode 插入 <image> 後，對這些物件註冊才有效
   $("image").on("load", function() {
      setImageViewBox(this);
   })
   
   // -------------------------------------------------------------------
   
   // 2025-07-02
   d3.selectAll("span.closeNode").on("click", function(event) {
      let me = $(this);
      let graphDataIdx = parseInt(me.attr("graphDataIdx"));
      let graphNodeObj = GlobalVar.temp.graphNodeObjArray[graphDataIdx];
      graphNodeObj.expandedObject.dispatch("dblclick");
      graphNodeObj.rect4Resize.style("display", "none");
   });
   
   d3.selectAll("span.resizeNode").on("click", function(event) {
      // 2025-07-05
      let me = $(this);
      let graphDataIdx = parseInt(me.attr("graphDataIdx"));
      let graphNodeObj = GlobalVar.temp.graphNodeObjArray[graphDataIdx];
      
      let foreignObject = graphNodeObj.expandedObject;
      let foreignDiv = graphNodeObj.expandedObjectForeignDiv;
      let rect = graphNodeObj.rect4Resize;
      
      // 利用小方形來調整方塊大小的拖曳函式
      let dragResize = d3.drag()
         .on("drag", function(event) {
            // 2025-09-16: 計算拖曳距離
            let transform = GlobalVar.currentZoomTransform || d3.zoomIdentity;
            let dx = event.dx / transform.k;
            let dy = event.dy / transform.k;
            
            // 更新矩形的寬度和高度
            let x = Number(foreignObject.attr("x"));
            let y = Number(foreignObject.attr("y"));
            let w = Number(foreignObject.attr("width"));
            let h = Number(foreignObject.attr("height"));
            let mw = Number(foreignObject.attr("minWidth"));
            let mh = Number(foreignObject.attr("minHeight"));
            
            w += dx;
            h += dy;
            
            if (w < mw) w = mw;
            if (h < mh) h = mh;
      
            foreignObject.attr("width", w)
                         .attr("height", h);
   
            // 需同步調整 div 容器的大小（注意，是用 style 而非 attr）
            foreignDiv.style("width", w + "px")
                      .style("height", h + "px");
   
            // 2025-07-20: 拖曳啟動後（不需等拖曳完成），就隱藏小方形
            rect.style("display", "none")
                .classed("active", false);       // 2025-07-20: 必須切換回 inactive，否則 resize 鈕需按兩次才能再 enable
         });

      // 顯示可拖曳的小方塊，使用者可藉此調整 foreignObject 大小
      let x = Number(foreignObject.attr("x"));
      let y = Number(foreignObject.attr("y"));
      let w = Number(foreignObject.attr("width"));
      let h = Number(foreignObject.attr("height"));
      
      // 2024-05-14
      if (!rect.classed("active")) {       // 利用 rect.classed("active") 判斷小方形是否被顯示
         rect.attr("x", x + w)
             .attr("y", y + h)
             .attr("width", 10)
             .attr("height", 10)
             .style("fill", "white")
             .style("stroke", "black")
             .style("cursor", "nwse-resize")
             .style("display", "block")
             .raise()
             .classed("active", true)
             .call(dragResize);
      }
      else {
         rect.style("display", "none")
             .classed("active", false);
      }
   });

   // 2025-01-01: 讓使用者可藉由按下 immarkusPieceIdBar 切換 shape 顯示
   d3.selectAll("div.immarkusPieceIdBar").on("click", function(evt) {
      evt.stopPropagation();                    // 2025-01-03
      let obj = d3.select(this);                // d3 的 selection object, obj.node() 可取得 DOM object
      let jqThis = $(obj.node());               // 2025-01-03
      let pieceId = jqThis.text();              // 透過 jquery 取得 pieceId （可直接透過 DOM 取得，但程式中盡量用 jquery 以保持一致）

      let selector = "svg *[key='" + pieceId + "']";        // 注意，雖然先前標籤是用 Key，但經 html 處理後都只能用全小寫 key
      let jqShapes = jqThis.closest("div.nodeEventHtml") 
                           .find(selector);                 // 應該只會找到一個標籤
      // 2025-01-02: 若 svg 有展示 immarkus piece layer，按鈕就需加上 immarkusPieceHighlighted
      if (jqShapes.is(":hidden")) {
         jqShapes.show();
         jqThis.addClass("immarkusPieceHighlighted");
      }
      else {
         jqShapes.hide();
         jqThis.removeClass("immarkusPieceHighlighted");
      }
   });
   
   //若關閉 node expansion 功能，就不需此設定了...
   if (GlobalVar.enableExpandedNodeLinkback2Text) {           // 2025-10-10
      // 註冊點擊事件 (click event)
      // 2024-06-05: 注意在 d3 必須用 d3.selectAll()
      d3.selectAll("div.eventNodeTitle").on("click", function() {
         let obj = d3.select(this);        // d3 的 selection object, obj.node() 可取得 DOM object
         //let filenameList = [ obj.attr("docFilename") ];
         let postActionStr = "postActions=comarkusEvent:ComarkusId:" + obj.attr("comarkusId");
         let queryStr = '{' + obj.attr("docFilename") + '}'; 
         linkback2Text(queryStr, postActionStr);
      });
   }

   // 2024-08-16
   d3.selectAll("div.eventNumber").on("click", function(evt) {
      // 注意：觸發此事件後，還會 bubble 到外層 (foreignObject 觸發顯示 rect 的小方塊)
      //       但... 有時 click 事件似乎會被「吃掉」，點擊後沒反應（需再次點擊一次）？
      let eventNumber = $(this).attr("eventNumber");
      let textNodeId = "#t_" + eventNumber;
      //alert(d3.select(textNodeId).text());
      d3.select(textNodeId).classed("highlighted", true);          // add class
   });
   
   // ------------------ node hovering effect ---------------------
   // 2025-09-24
   // 2026-02-23: mouseover() 時，需避免用 raise/lower 來改變 DOM 順序 -- 會導致 Edge 無法拖曳節點！
   //             也就是說，mouseover, mouseout 事件處理中，都不應進行 raise/lower 動作！
   d3.selectAll("[type=node]")
     .on("mouseover", function(event, d) {
        if (GlobalVar.temp.onNodeDraggingState) return;

        // e.g., d.id := 'E005', this.id := 'c_E005'
        //console.log("hovering over node: ", d);
        //const nodeSelected = d3.select(this);
        //alert(d.id + ' --- ' + this.id);
        let hoveredNodeId = d.id;
        
        fadingHighlightingNodesAndPaths(hoveredNodeId);
     })
     .on("mouseout", function(event, d) {
        // 關鍵：如果正在拖拽，絕對不要執行任何會改變 DOM 順序 (lower/raise) 的動作
        if (GlobalVar.temp.onNodeDraggingState) return;

        //d3.select(this).attr("class", "colorSetA05");         // 改變節點顏色
        wrappedGroup.selectAll("*")
                    .classed("hoverHighlight", false);          // 移除連線的 hover highlight
     
        // 2025-11-09: Chromium-based 瀏覽器還需額外補上 starHighlight 處理？（Firefox 不需要...）
        wrappedGroup.selectAll("path.nodeLink")
                    .classed("starHighlight", function() {
                       let d3SelObj = d3.select(this);
                       return (d3SelObj.attr("pathClass") === 'starLink');
                    });
     
        if (!GlobalVar.displayGraphOnFadingMode) {
           // 2025-12-02: .raise() 移到最上層，.lower() 放到最下層 
           wrappedGroup.selectAll("*")
                       .classed("colorFading", false)           // 全正常顯示（非刷淡）模式：移除所有節點和連線的變淡
                       .lower();                                // 2026-01-24: 滑鼠移出才改變 DOM 應該對 Edge 也 OK 吧？
        }
        else {
           if (GlobalVar.displayGraphUnfadeLastHovering) ;      // 最後 hovering 的 node 和其 neighbors 保持正常方式顯示
           else {
              // 注意：tootip 不該加入 colorFading
              // CSS selector 不支援 '!=' 操作...
              wrappedGroup.selectAll("circle,rect[iconType='square'],polygon,path:not([pathClass='starLink']),text")
                          .classed("colorFading", true);         // 刷淡幾乎所有節點與連線
                          
              // 2025-12-12: 將連線加上 .lower() 移到最下層
              wrappedGroup.selectAll("path:not([pathClass='starLink']),text")                          .lower();
     
              // 2025-09-30: 將 starredNodes (和 neighborhood) 都提到上層
              let starredNodeIds = [];
              GlobalVar.temp.flaggedNodeList.forEach(function(nodeId) {
                 let [extraNeighborNodeIds, _] = getNeighborPathsFromNodeId(nodeId);
                 starredNodeIds = starredNodeIds.concat(extraNeighborNodeIds);
              });
              
              wrappedGroup.selectAll("*")
                          .filter(function() {
                             let d3SelObj = d3.select(this);
                             let [prefix, nodeId] = this.id.split('_');    // 將 'c_E011' 拆分成 ['c, 'E011']
                             let ret = (starredNodeIds.includes(nodeId) ||
                                        d3SelObj.classed("starHighlight") ||
                                        d3SelObj.classed("tooltip"));
                             return ret;
                           })
                          .classed("colorFading", false);
                          //--.raise();
           }
        }
     
        if (GlobalVar.raiseAllNodesAfterHovering) raiseAllNodes();      // 2025-12-12
     });    // end of d3.selectAll("[type=node]")
     
   // -------------------------------------------------------------------------

   function fadingHighlightingNodesAndPaths(hoveredNodeId) {
      // 用 fading 表示 node, edge 刷淡（dimming 表示背景刷淡）
      let [neighborNodeIds, neighborPaths] = getNeighborPathsFromNodeId(hoveredNodeId);
      
      let neighborPathIdList = [];
      neighborPaths.forEach(function(np) {
         let pathId1 = 'path_' + np.source.id + '_' + np.target.id;    // 兩種可能...
         let pathId2 = 'path_' + np.target.id + '_' + np.source.id;
         neighborPathIdList.push(pathId1, pathId2);
      });
      //alert(JSON.stringify(neighborPathIdList));
   
      let starredNodeIds = [];
      GlobalVar.temp.flaggedNodeList.forEach(function(nodeId) {
         let [extraNeighborNodeIds, _] = getNeighborPathsFromNodeId(nodeId);
         starredNodeIds = starredNodeIds.concat(extraNeighborNodeIds);
      });

      // 2025-11-21
      //wrappedGroup.selectAll("*").classed("colorFading", true);
      
      // 2025-09-30: 加上 fading effect
      wrappedGroup.selectAll("*")
                  .filter(function() {
                     // 注意： 'this' is a DOM element, not d3 selection
                     let me = this;
                     let d3SelObj = d3.select(me);

                     let myId = me.id || "";
                     let parts = myId.split("_");        // 將 'c_E011' 拆分成 ['c, 'E011']
                     let nodeId = parts.length > 1 ? parts[1] : null;

                     // 2025-10-04                       
                     const isNeighbor = nodeId && neighborNodeIds.concat(starredNodeIds).includes(nodeId);
                     //alert(d3SelObj.attr("pathId") + "\n" + JSON.stringify(neighborPathIdList));
      
                     let ret = (!isNeighbor && 
                                !d3SelObj.classed("nodeHighlightCircle"));
                     return ret;
                   })
                  .classed("hoverHighlight", false)
                  .classed("starHighlight", false)
                  .classed("colorFading", true);

      wrappedGroup.selectAll("path.nodeLink")
                  .filter(function() {
                     let d3SelObj = d3.select(this);
                     return (d3SelObj.attr("pathClass") === 'starLink');
                  })
                  .classed("starHighlight", true);

      wrappedGroup.selectAll("path.nodeLink")
                  .filter(function() {
                     let d3SelObj = d3.select(this);
                     return neighborPathIdList.includes(d3SelObj.attr("pathId"));
                  })
                  .classed("hoverHighlight", true);
                  
                  
      // 2025-09-30: 移除 starredNodes (和 neighborhood) 的 colorFading
      wrappedGroup.selectAll("*")
                  .filter(function() {
                     let d3SelObj = d3.select(this);
                     let [prefix, nodeId] = this.id.split('_');    // 將 'c_E011' 拆分成 ['c, 'E011']
                     let ret = (starredNodeIds.concat(neighborNodeIds).includes(nodeId) ||
                                d3SelObj.classed("starHighlight") ||
                                d3SelObj.classed("hoverHighlight") ||
                                d3SelObj.classed("tooltip"));
                     return ret;
                   })
                  .classed("colorFading", false);
                  //--.raise();     // 2026-01-24: 不能將物件都提到上層，會造成 Edge 因調整物件順序而卡當！

      //console.log("Hover: " + hoveredNodeId + "\n" + JSON.stringify(neighborPaths));
   }  // end of fadingHighlightingNodesAndPaths()
     
   // Create arrowhead marker
   svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("fill", GRAPH_COLORS.arrowMarker)
      .attr("refX", 6)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5");

   // ------------------ edge hovering effect ---------------------
   // 2025-09-26
   const edgeTooltip = wrappedGroup.append("g")
                                   .attr("class", "tooltip")       // 2026-01-23
                                   .style("display", "none");
  
   // Edge: 在建立 edgeTooltip 後立刻執行以下程序  // 2026-01-23: YES TEST
   edgeTooltip.style("pointer-events", "none")
              .selectAll("*")
              .style("pointer-events", "none");
   
   edgeTooltip.append("rect")
              .attr("class", "tooltip")
              .attr("fill", "black")
              .attr("rx", 4).attr("ry", 4)
              .attr("opacity", 0.7);
   
   edgeTooltip.append("text")
              .attr("class", "tooltip")
              .attr("fill", "white")
              .attr("x", 5).attr("y", 15)
              .style("font-size", "12px");
   
   // Create arrows
   // 注意: getArrowPaths() 回傳陣列的每個元素是透過 type 以控制實現或虛線 { path: "M10,10L100,100", style: "dashed" } 
   // 2025-09-16: path.nodeLink 需放在 wrappedGroup 內（先前直接使用 svg.selectAll()，會放在 svg 下）
   const arrows = wrappedGroup.selectAll("path.nodeLink")                            // 2025-06-06: (bug fix) :scope > path.nodeLin 僅選擇當前節點下的 <path> -- 原先是選出所有 path，這樣會「不小心」加入 <g> 中的 path！
                     .data(getArrowPaths())
                     .enter()
                     .append("path")
                     .attr("pathId", d =>'path_' + d.source.id + '_' + d.target.id)  // 2025-11-09
                     .attr("pathClass", d => d.pathClass)                            // 2025-11-03: 加上 pathClass 以利後續高亮判斷
                     .attr("class", "nodeLink")
                     .attr("d", d => d.path)                                         // 取得 getArrowPaths() 所回傳 pathObj 的 path
                     .attr("fill", "none")
                     .attr("stroke", d => d.pathColor)                               // 2025-08-01: 加上 path color 來改變顏色
                     .attr("stroke-width", d => widthScale(d.weight))                // 2025-09-25: TO DEBUG ... 但 simulation2 有時會壞掉？
                     //.attr("marker-end", "url(#arrowhead)")                        // 末端的箭頭
                     .attr("stroke-dasharray", d => (d.type === "dashed") ? "5,3" : null)    // 虛線: "4,2" 表示 4px線+2px空格，null 表示實線
                     .on("mouseover", function(event, d) {
                        // TEST TEST TODO YES
                        // edge hovering
                        d3.select(this).classed("edgeHighlight", true);
                                       //--.raise();    // raise() 會導致 Edge 改變 DOM 結構而導致後續 hover/click 出狀況
                        
                        // 2025-11-26: 依照 event/image node 型態，決定 edge 要顯示的內容
                        let displayText = '-';
                        if (d.source.id.startsWith('E') || d.target.id.startsWith('E')) {
                           displayText = (GlobalVar.tagsForFileStructure.includes(d.source.nodeTagName) || GlobalVar.tagsForFileStructure.includes(d.target.nodeTagName))
                                       ? 'Event has 1 source text'
                                       : `Event has ${d.weight} annotations`    // 2025-12-23: Dawn suggested term
                        }
                        else if (d.source.id.startsWith('M') || d.target.id.startsWith('M')) {
                           displayText = (GlobalVar.tagsForFileStructure.includes(d.source.nodeTagName) || GlobalVar.tagsForFileStructure.includes(d.target.nodeTagName))
                                       ? 'Image has 1 folder'
                                       : `Image has ${d.weight} annotations`;   // # of annotations (i.e., entities)
                        }
                        else if (d.source.id.startsWith('CX') || d.target.id.startsWith('CX')) {
                           displayText = "Aligned tag has 1 feature";       // 2025-12-01: 先前漏掉
                        }
                        else {
                           displayText = `來源: ${d.source.id}, 目標: ${d.target.id}`;       // 防呆
                        }
                        
                        edgeTooltip.style("display", null);
                        edgeTooltip.raise();      // 2026-01-23
                        edgeTooltip.select("text")
                                   .text(displayText)
                                   .raise();      // 2026-01-23: 字必須提到最上層，否則會看不見
                     
                        // 動態調整背景大小
                        const bbox = edgeTooltip.select("text").node().getBBox();
                        edgeTooltip.select("rect")
                                   .attr("width", bbox.width + 10)
                                   .attr("height", bbox.height + 5)
                                   .classed("colorFading", false);     // 2025-11-24
                                   
                        //--edgeTooltip.raise();
                     })
                     .on("mousemove", function(event) {
                        // 在 g 的座標系統裡移動 edgeTooltip
                        const [x, y] = d3.pointer(event, wrappedGroup.node());
                        edgeTooltip.attr("transform", `translate(${x + 10}, ${y - 10})`);
                     })
                    .on("mouseout", function() {
                       if (GlobalVar.mouseoutRemoveAllEdgeHighlight) {
                          // 2026-01-25: 移除「所有」 paths 的 edgeHighlight
                          d3.select("path").classed("edgeHighlight", false);
                       }
                       else {
                          // 2026-01-25: 若僅移除 this 的 edgeHighlight，有時會依然留下一條 edgeHighlight 紅線？
                          d3.select(this).classed("edgeHighlight", false);
                                         //--.lower();    // 2025-12-01: 加上 .lower() -- 會導致 Edge 改變 DOM 結構而出狀況
                       } 
                       
                       edgeTooltip.style("display", "none");
                     }); 
                     
   GlobalVar.temp.nodeLinks = arrows;                        // 2025-08-22: 將當前的 arrows 物件儲存到全域變數
      
   // ---------------------------------------------------------------------------------
   // 2025-09-16: 支援縮放與平移
   //const wg = d3.select('#wrappedGroup');
   const zoom = d3.zoom()
                  .filter(function(event) {
                     // 只允許滑鼠左鍵點擊 + 沒有 modifier 鍵
                     return !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0;
                  })
                  //.filter((event) => event.altKey)     // 只有按著 Alt 才允許縮放/平移
                  .scaleExtent([0.2, 8])                 // 最小/最大縮放
                  .on('zoom', (event) => {
                     // event.transform 有平移與縮放（k, x, y）
                     wrappedGroup.attr('transform', event.transform);
                     GlobalVar.currentZoomTransform = event.transform;     // 儲存起來供後續使用
                  });
   svg.call(zoom);
   //svg.call(zoom.transform, d3.zoomIdentity.scale(2));

   d3.select("svg").style("touch-action", "none");      // 2026-01-23: YES TEST
   
   // ---------------------------------------------------------------------------------
   
   function raiseAllNodes() {
      // 2025-06-23: 將所有節點都提升到最上方（方便拖曳）
      GlobalVar.temp.graphNodeObjArray.forEach(function(node) {
         //node.iconObjectLabel.raise();           // 2025-07-09: 把 label 也移到上方...（但似乎沒什麼效果）
         node.iconObject.raise();
      });
   }
   
   // 創建力學模型：force strength 正值為吸引力大小，負值表示排斥力大小
   //         注意：必須等到移動結束，使用者才能拖曳或更改矩形大小
   let totalNodes = graphData.length;
   let strength = -120;                              // 用於「舊版」的 simulation
   if (totalNodes >= 100) strength = -8;
   else if (totalNodes >= 75) strength = -15;
   else if (totalNodes >= 50) strength = -30
   else if (totalNodes >= 20) strength = -60;
   else if (totalNodes >= 10) strength = -90;

   let userStrength = -$("#forceModelRepulsiveStrengthVal").val();        // 預設 -10
   let repulsiveStrength = Math.floor((strength + userStrength) / 2);     // 最終使用的排斥力強度
   //console.log("strength: " + repulsiveStrength);
   
   // 2025-06-25
   // 利用先前計算的 graphDataIdxLinks 計算出 grahData 中的「有連線節點」-- 後續套用力學模型，僅套用在這些節點
   // connectedNodes, isolatedNodes[.] 都是 graphData 陣列（不是 d3 selection 物件的陣列）
   // 透過 obj = GlobalVar.temp.graphNodeObjArray[graphDataIdx] 可以取得 graph node 物件（obj.iconObject 可取得 d3 selection 物件）
   let connectedNodes = [];
   let isolatedNodes = {};           // e.g., isolatedNodes['E.SPONSOR'] = [graphData_item1, graphData_item2, ...]
   let graphDataIdxMap = {};         // graphDataIdxMap[graphDataIdx] = nodeGroup => isolatedNodes[nodeGroup] contains graphDataIdx
   graphData.forEach(function(gdata) {
      let gIdx = gdata.graphDataIdx;
      if (graphDataIdxLinks[gIdx].length > 0) connectedNodes.push(gdata);
      else {
         // 藉由 nodeType + nodeLegendCaption 決定 node group
         let nodeGroup = gdata.nodeType + '-' + gdata.nodeLegendCaption;     // 注意，用 '-' 而不是 '.' 或 ':' 以避免 selection 弄錯意思
         if (!isolatedNodes[nodeGroup]) isolatedNodes[nodeGroup] = [];
         isolatedNodes[nodeGroup].push(gdata);
         graphDataIdxMap[gIdx] = nodeGroup;
      }
   });
   
   // ---------------------------------------------------------------------
   // 2025-01-15: 利用 event trigger 允許在過程中將動畫模擬中斷
   $("#butStopSimulation").off("click").on("click",function() {
      simulation.stop();
   });

   var initForeignObjects = svg.selectAll("foreignObject").data(graphData);     
   var initShrinkedObjects = svg.selectAll(".shrinkedObject").data(graphData);   // 需與 forceSimulation() 綁定在相同變數
   
   
   // ----------------------------------------------------------------------
   
   function ticked() {
      let svg = d3.select("svg");
      let width = Number(svg.attr("width"));
      let height = Number(svg.attr("height"));
      
      let ret = 0;
      let space = 40;               // 2025-07-19: 到 viewport 邊緣的留白
      //initForeignObjects
      //   .attr("x", function(d) {
      //      // 2024-05-27: (TODO) 也需同步修改 graphData，以確保 getArrowPaths() 弧線不會脫隊？
      //      // 2024-05-10: 至少貼齊左邊，最多貼齊右邊
      //      if (d.x < space) return space;           // 2025-05-17: 直接回傳 0 
      //      if (d.x + d.width + space > width) ret = width - d.width - space;
      //      ret = d.x;
      //      return ret;
      //   })
      //   .attr("y", function(d) { 
      //      // 2024-05-27: (TODO) 也需同步修改 graphData，以確保 getArrowPaths() 弧線不會脫隊？
      //      if (d.y < space) return space;           // 2025-06-19: 直接回傳 space 
      //      if (d.y + d.height + space > height) ret = height - d.height - space;
      //      ret = d.y;
      //      return ret;
      //   });

      //let bbox = node.getBBox();
      //let cx = bbox.x + bbox.width/2;  // 元素中心點的 x
      initShrinkedObjects                   // d3 selection object
         .attr("cx", function(d) {          // for circle
            // 2024-05-10: 至少貼齊左邊，最多貼齊右邊
            if (d.x < space) ret = space;
            else if (d.x + space > width) ret = width - space;
            else ret = d.x;
            
            let obj = d3.select(this);
            let graphDataIdx = +obj.attr("graphDataIdx");
            graphData[graphDataIdx].x = ret;
            return ret;
         })
         .attr("cy", function(d) { 
            if (d.y < space) ret = space;
            else if (d.y + space > height) ret = height - space;
            else ret = d.y;

            let obj = d3.select(this);
            let graphDataIdx = +obj.attr("graphDataIdx");
            graphData[graphDataIdx].y = ret;
            return ret;
         })
         .attr("x", function(d) {                   // for square
            // 2024-07-20
            let cx = d.x;
            let obj = d3.select(this);
            let graphDataIdx = +obj.attr("graphDataIdx");
            graphData[graphDataIdx].x = cx;
            return cx - GlobalVar.nodeSizeRadius/2;
         })
         .attr("y", function(d) { 
            // 2024-07-20
            let cy = d.y;
            let obj = d3.select(this);
            let graphDataIdx = +obj.attr("graphDataIdx");
            graphData[graphDataIdx].y = cy;
            return cy - GlobalVar.nodeSizeRadius/2;
         })
         .attr("points", function(d) {              // for polygons (triangle, diamond)
            let cx = d.x;
            let cy = d.y;
            let nodeShape = d.nodeShape;
            let pointsString = '';
            if (nodeShape === 'circle' || nodeShape === 'square') ;       // 跳過
            else pointsString = calculatePolyPoints(nodeShape, [cx,cy], GlobalVar.nodeSizeRadius * 2);
            return pointsString;
         });
         
      // 2024-05-27: 同步移動相關的物件
      initShrinkedObjects.each(function(d, i) {
         // 2024-05-24: 移動 icon 上方的文字
         let nodeType = d.id.substr(0,1);                                  // 2024-12-04
         let nodeLabelPos = GlobalVar.nodeTypeLabelPosMap[nodeType];

         // label
         d3.select("#t_" + d.id)
           .attr("x", d.x + GlobalVar.labelOffset[nodeLabelPos][0])        // 2024-12-04: 注意不要變成 undefined...
           .attr("y", d.y + GlobalVar.labelOffset[nodeLabelPos][1]);
         
         // iconObjectFlagSymbol
         d3.select("#flag_" + d.id)
           .attr("x", d.x - 12)
           .attr("y", d.y - 5);
         
         // 2024-05-27: 移動 foreignObject 的位置
         let obj = d3.select("#f_" + d.id);
         let x = d.x - Number(obj.attr("width"))/2
         let y = d.y - Number(obj.attr("height"))/2
         obj.attr("x", x)
            .attr("y", y);
      });
      
      arrows.data(getArrowPaths())
            .attr("d", d => d.path)
            .attr("stroke-dasharray", d => (d.type === "dashed") ? "5,3" : null)    // 虛線: "4,2" 表示 4px線+2px空格，null 表示實線
            .attr("stroke", d => d.pathColor);    // 2025-11-03


      // 2025-11-21
      if (GlobalVar.displayGraphOnFadingMode) {
         //wrappedGroup.selectAll("path,circle,rect,polygon,text").classed("colorFading", true);
         wrappedGroup.selectAll("*").classed("colorFading", true);     // 2025-11-21
      }
  }  // ticked()
   
   // 2025-05-11: legend 圖例
   let legendData = [];
   
   // 透過 GlobalVar.eventGenreStyleMap, imageGenreStyleMap, binrelGenreStyleMap, commonGenreStyleMap 取得 legend 所需資訊
   // event nodes
   let captions = Object.keys(GlobalVar.temp.eventNodeGenreMap).sort();
   captions.forEach(function(caption) {
      let obj = GlobalVar.eventGenreStyleMap[caption];
      legendItem = { type: 'E',                       // 2025-06-04
                     shape: obj.nodeShape,
                     colorClass: 'colorSetB' + obj.nodeColorIdx,
                     label: caption
                   };
      legendData.push(legendItem);
   });
   
   // image nodes
   captions = Object.keys(GlobalVar.temp.imageNodeGenreMap).sort();
   captions.forEach(function(caption) {
      //if (!GlobalVar.imageGenreStyleMap[caption]) {
      //   alert(caption + "\n" + JSON.stringify(Object.keys(GlobalVar.imageGenreStyleMap));
      //}
      let obj = GlobalVar.imageGenreStyleMap[caption];      
      legendItem = { type: 'M',
                     shape: obj.nodeShape,
                     colorClass: 'colorSetB' + obj.nodeColorIdx,
                     label: caption
                   };
      legendData.push(legendItem);
   });
   
   // binrel nodes
   captions = Object.keys(GlobalVar.temp.binrelNodeGenreMap).sort();
   captions.forEach(function(caption) {
      let obj = GlobalVar.binrelGenreStyleMap[caption];
      legendItem = { type: 'B',
                     shape: obj.nodeShape,
                     colorClass: 'colorSetB' + obj.nodeColorIdx,
                     label: caption
                   };
      legendData.push(legendItem);
   });
   
   
   // common nodes
   // 注意：如果某種節點並未顯示於圖中，其相關 legend 也應被隱藏 (透過 GlobalVar.temp.cxNodeConnected 實作）
   captions = Object.keys(GlobalVar.temp.commonNodeTypeMap).sort();
   captions.forEach(function(caption) {
      let obj = GlobalVar.commonGenreStyleMap[caption];
      
      // 2025-10-30: 若 CX 節點需被隱藏，那麼其 legend 訊息也該被隱藏
      if (!GlobalVar.temp.cxNodeConnected && caption == LegendCaption.featureHierarchy) return;
      
      legendItem = { type: 'C',
                     shape: obj.nodeShape,
                     colorClass: 'colorSetB' + obj.nodeColorIdx,
                     label: caption
                   };
      legendData.push(legendItem);
   });
   
   let legendGroupTitle = 'Legend';        // "圖例 Legend"
   let graphTitle = $("#graphTitle").val();

   plotLegend(svg, legendData, legendGroupTitle);
   plotGraphTitle(svg, graphTitle);

   // 2025-06-08: ask ChatGPT 如何在 d3 觸發 click 事件...
   if (GlobalVar.highlightPiecesAtStart) {
      d3.selectAll("div.immarkusPieceIdBar").each(function() {
        this.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
   }
   
   // ------------------------------------------------------------------
   //        以下模擬動畫的程式由 ChatGPT 提供，但需手動做些修正
   // ------------------------------------------------------------------
   
   function setupSimulation(graphData, arrows, strength) {
      const svgWidth = GlobalVar.svgWidth;
      const svgHeight = GlobalVar.svgHeight;
      
      // 找出連接過的節點 ID
      const connectedNodes = new Set();
      arrows.forEach(link => {
         connectedNodes.add(link.source.id);     // 2025-06-14: (bug fix) link.source.id 而不是 link.source
         connectedNodes.add(link.target.id);
      });
      
      // 找出孤立節點
      const isolatedNodes = graphData.filter(node => !connectedNodes.has(node.id));

      // 2025-07-11
      let centerX = svgWidth * 0.48;
      let centerY = svgHeight * 0.5;
      if (isolatedNodes.length > 0) centerX = svgWidth * 0.40;        // 左邊空出擺放 isolated nodes
      
      // 調整：孤立節點群集的中心
      const clusterCenter = {
         x: svgWidth * 0.76,
         y: svgHeight * 0.42
      };
      
      // 2025-07-11
      let linkWeight = 0.005;
      if (graphData.length > 100) linkWeight = 0.20;
      else if (graphData.length > 50) linkWeight = 0.10;
      else if (graphData.length > 20) linkWeight = 0.05;

      let collisionRadius = 35;
      if (graphData.length > 300) collisionRadius = 15;
      else if (graphData.length > 200) collisionRadius = 20;
      else if (graphData.length > 100) collisionRadius = 28;
      
      let myArrows = (Math.random() > 0.5 && graphData.length < 100) ? [] : arrows;      // 若節點數小於 100，50% 的機會不加上 link 效果
      
      // 2025-10-23: 處理 'pinned' nodes -- 僅需將 d.fx 和 d.fy 固定為原先的位置，就可讓 simulation 不去移動這些節點 (ChatGPT)
      if (Object.keys(GlobalVar.temp.pinnedNodePosition).length > 0) {
         graphData.forEach(d => {
            if (GlobalVar.temp.pinnedNodePosition[d.id]) {
               d.fx = d.x;
               d.fy = d.y;
            }
            else {
               d.fx = null;
               d.fy = null;
            }
         });      
      
         if (GlobalVar.keepPinnedZoomStateOnRedraw) {
            // 保持在 zoom 的狀態（修改 ChatGPT 建議）      
            let transform = GlobalVar.currentZoomTransform || d3.zoomIdentity;
            wrappedGroup.attr('transform', transform);
         
            // 同步 zoom 行為的內部狀態（很重要，不然滑鼠滾輪/拖拉會「跳」）
            svg.call(zoom.transform, transform);
         }
      }
  
      const mySimulation = d3.forceSimulation(graphData)
         .force("center", d3.forceCenter(centerX, centerY))
         .force("charge", d3.forceManyBody().strength(strength))
         .force("link", d3.forceLink(myArrows))
                          //.strength(d => d.attrWeight || linkWeight))    // 注意，不能用 d.weight (線條粗細)
         .force("collision", d3.forceCollide(collisionRadius))             // collision radius: 碰撞節點之間保持的最小距離
      
         // 讓孤立節點靠近 clusterCenter（接近中心偏下）
         .force("isolateCluster", function(alpha) {
            const isolateStrength = 0.08;
            isolatedNodes.forEach(node => {
               node.vx += (clusterCenter.x - node.x) * isolateStrength * alpha;
               node.vy += (clusterCenter.y - node.y) * isolateStrength * alpha;
            });
         })
      
         // 孤立節點彼此微弱排斥，避免重疊但不推太遠
         .force("isolateRepel", function(alpha) {
            for (let i = 0; i < isolatedNodes.length; i++) {
               for (let j = i + 1; j < isolatedNodes.length; j++) {
                  const node1 = isolatedNodes[i];
                  const node2 = isolatedNodes[j];
      
                  const dx = node1.x - node2.x;
                  const dy = node1.y - node2.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const minDist = 15;
      
                  if (dist < minDist && dist > 0) {
                     const repelStrength = 0.01;
                     const repulse = (minDist - dist) * repelStrength * alpha;
      
                     node1.vx += (dx / dist) * repulse;
                     node1.vy += (dy / dist) * repulse;
                     node2.vx -= (dx / dist) * repulse;
                     node2.vy -= (dy / dist) * repulse;
                  }
               }
            }
         })
         .on("tick", ticked)
         .on("end", () => {
            if (GlobalVar.raiseAllNodesAfterHovering) raiseAllNodes();
            $("#svgOverlay").fadeOut(2000);
         });
      
      return mySimulation;
   }
   
   
   var simulation = setupSimulation(graphData, getArrowPaths(), repulsiveStrength);       // 排斥的 strength 需高一些？但差別好像不大...
      
   // ----------------------------------------------------------------------

   
}   // drawGraph()

// -------------------------------
//      conversion functions
// -------------------------------

function convertTableData2graphNodeDict(tableData) {
   // 進行 tableData 表格到 graphNodeDict 的轉換 (i.e., table2graphNodeDict)
   // 2025-06-20: 最後可用 'CX01', 'CX02' 等作為額外節點的 graphNode id，在 graphNodeDict 加上表格資料沒提供的 "extra nodes"
   
   //console.log(tableData);

   // 2024-05-10: 將多個 rows 合併成以 "event" 為主的 hash table，方便呈現 event list view
   // 2024-07-25: 為了處理較複雜的狀況，改為將每個 graphNode 對應到一個圖形節點 (2024-08-12 加上 nodeContentStr, 2025-01-23 加上 nodeTagName)
   //             GlobalVar.graphNodeDict[graphNode] = { nodeInfo: { eNum1: {eventElement, ...},
   //                                                                eNum2: {eventElement, ...},
   //                                                                ... },
   //                                                    display,
   //                                                    graphNodeLabel, nodeContentStr, nodeTagName,
   //                                                    labelDisplay
   //                                                  }
   // 2024-12-25: 也順便計算出 GlobalVar.eventElementTags 物件，e.g., eventElementTags['Udef_Evt_INITIATOR']['<refid>/侯'] = 5
   //             GlobalVar.eventElementTags := { eTag1: { value: "type/value", count: n},
   //                                             eTag2: { value: "type/value", count: n},
   //                                             ...
   //                                           }
   // 2025-07-01: 計算 
   //             GlobalVar.myEventElementTags[nodeType] := { eTag1: { value: "type/value", count: n},
   //                                                         eTag2: { value: "type/value", count: n},
   //                                                         ...
   //                                                       }   
   // 2025-01-16: 若 GlobalVar.eventElementTagIncludeGenre 為 true，則檢查 eTag 的 value，
   //             若為 "type/value" 形式（例如 "RENOVATION/重修"），則將 type 取出，並額外
   //             在 GlobalVar.eventElementTags 加上 <tag>.Genre: {type:n}，
   //             例如 Udef_Evt_EVENT.Genre: { "RENOVATION":n, "CONSTRUCTION":m, ... }
   // 2025-08-09: 額外計算 tagEnodeLookupMap := { 'Udef_XXX': [ 'E001', 'E003', 'I015'], ... }
   //             如此可透過這張表查詢某 tag 有出現在幾個 event nodes 中（最多構成幾條連線）...
   
   GlobalVar.graphNodeDict = {};                           // reset 
   
   //GlobalVar.eventElementTags = {};                      // reset
   //eventElementTags = GlobalVar.eventElementTags;        // 取得 reference
   
   // 2025-07-01
   GlobalVar.myEventElementTags = {};                    // reset
   myEventElementTags = GlobalVar.myEventElementTags;    // 取得 reference
   
   GlobalVar.commonTagsHash = {};                     // 2025-01-22
   commonTagsHash = GlobalVar.commonTagsHash;         // commonTagsHash[tag] := [val1, val2, ...]
   
   let nodeType, nodeShape, //nodeColor, 
       display, graphNodeLabel, labelDisplay,
       eventTimeNotBefore, eventTimeNotAfter, 
       nodeLegendCaption, nodeLabelColorClass, nodeColorIdx, 
       eventLocation, nodeContentStr, nodeTagName;
   
   let extraConnections = {};                         // 2025-06-20: 產製額外的 object, obj_part 等節點和連線
   let tagEnodeLookupHash = {};                       // 2025-08-09: 為了計算 GlobalVar.tagEnodeLookupMap 所加上的變數

   tableData.forEach(function(row) {
      // e.g., {"id":1,"eNum","E001", "eNumDisplay":true,
      //        "graphNode":"E001", "graphNodeLabel":"自訂名稱",
      //        "comarkusId":"...", "docFilename":"xyz", 
      //        "type":"TIME", "markusId":"...",
      //        "tagName":"Udef_Evt_TIME",
      //        "refId":"公元1610年:明神宗",
      //        "content":"BEGIN/丙戌四月朔"}
      //alert(JSON.stringify(row));
      let eNum = row.eNum;
      let graphNode = row.graphNode;
      let elementName = row.tagName;                                     // 2024-06-04
      let eventType = eNum.substr(0,1);                                  // 2024-08-15

      nodeType = graphNode.substr(0,1);                                  // 2024-07-28: 'E', 'C', 'M', 'B'
      display = row.display ? row.display.toString() : 'false';          // row.display 回傳的結果：true 會是 boolean，false 會是 "false" ==> 強迫換成字串
      graphNodeLabel = row.graphNodeLabel;                               // 2024-07-26
      labelDisplay = row.labelDisplay.toString();                        // 強迫轉成字串
      eventTimeNotBefore = row.eventTimeNotBefore;                       // 2024-08-18
      eventTimeNotAfter = row.eventTimeNotAfter;                         // 2024-08-18
      nodeLegendCaption = row.nodeLegendCaption;                         // 2025-05-11
      nodeLabelColorClass = row.nodeLabelColorClass;                     // 2025-05-14
      nodeColorIdx = row.nodeColorIdx;                                   // 2025-05-10, 2025-05-25 加入 '00' 防呆
      //let eventLocation = row.eventLocation;

      // 2024-08-15: 不同的 eventType（不是 nodeType）型態，繪製到 graph 的 finalContent 將有所不同      
      let finalContent = row.content;
      if (eventType == 'B') {
         if (row.type == 'BinRel') {
            //finalContent += ": " + row.type + " (" + row.refId + ")";
            finalContent = graphNode + ': ' + row.refId;                  // 2025-01-25
            //alert(finalContent);
         } 
         else if (row.type == 'DocMeta') {       // 2025-01-05
            finalContent = row.tagName.replace(/Udef_DocMeta_/,'#') + ': ' + row.content;
         } 
         else {
            let target = "(" + finalContent + ")";
            let replaced = row.type.replace(/Y/g, target);
            finalContent = (row.type == replaced) 
                         ? "(" + row.refId + ") " + row.type + " " + target
                         : "(" + row.refId + ") " + replaced;
         }
         //alert(finalContent);
      }
      else if (row.refId && row.content != row.refId) {
         if (row.refId == "#doc_title") {                                                            // 2024-09-15
            if (row.content == "-: -") finalContent = "*";
         }
         else if (eventType == 'M' && !row.tagName.startsWith('Udef_DocMeta_')) {                    // 2025-06-08: 不能用 row.RefId != 'DocMeta'排除 Udef_DocMeta_xyz 之類的標籤
            // 注意：需要以下程式碼（多 pieces 的 image node 展開後，才能顯示 "piece:1" 之類的 bar 會不見）
            let spanAttr = ` class="immarkusPieceRefId" paragraphImmarkusId="${row.immarkusId}"`;    // 2025-11-27: 加上 paragraphImmarkusId 屬性，方便找到對應的 <Paragraph>
            finalContent += "/<span" + spanAttr + ">" + row.refId + "</span>";
         }
      }
      //alert(finalContent);
      
      // 2024-12-18: 額外計算全域變數 GlobalVar.eventElementTags
      //             注意，採用 row.content 而非 row.finalContent 來讓使用者透過 #divElementTagTypeValue 
      //             進行勾選（這裡不採用 row.finalContent，除了「太細不見得合適」之外，還需考慮 dupCnt 的
      //             計算也只是用到 row.tagName 和 row.content，並沒有用到 row.refId）
      // 2025-01-10: 雖然希望 XmarkusAnalyzer 的後分類一致，但其實 XA 和 ERL 雖然用相同的 tagName（例如 Udef_Evt_EVENT），
      //             但 XA 主要是採用 RefId 做為 cue value，ERL 在此則是採用 (tag) content 的值
      //             想了想，因為兩者用途不同，因此也不需強求在此的 value 一致（尤其兩者的數量計算單位
      //             從一開始就不一樣：XA 是以文件做單位，ERL 是以事件做單位）
      //             => 注意：從 XA 的 Udef_Event_Element 的 cue list，可以看到「所有」 tag/value 值！
      // e.g., eventElementTags['Udef_Evt_INITIATOR']['<refid>/侯'] = 5
      //       eventElementTags['Udef_Evt_TIME']['BEGIN/<refid>/九年三月'] = 1
      //if (!eventElementTags[elementName]) eventElementTags[elementName] = {};
      
      // 2025-07-01
      if (!myEventElementTags[eventType]) myEventElementTags[eventType] = {};
      if (!myEventElementTags[eventType][elementName]) myEventElementTags[eventType][elementName] = {};
      
      // 2025-02-12: 注意 "elementName (tag) + content_p" (content 或 content 移除後綴）就是 common node 的 common property
      let contentP = row.content;
      if (GlobalVar.computeDupByTagPlusContentWithoutSuffix) contentP = removeSuffix(contentP, '/');
      //eventElementTags[elementName][contentP] = row.dupCnt;
      
      // 2025-07-01: 注意，計算 row.dupCnt 需一併考量 eventType ('E', 'M', 'B')！
      //             只是，對於 Udef_Align_XXX 而言，由於跨 eventTypes，最後的連線數必須將每個 eventTypes 下，同樣 tag+content 的值相加
      //             => 這樣的計算方式合理嗎？
      myEventElementTags[eventType][elementName][contentP] = row.dupCnt;

      // 2025-06-18 
      if (nodeType == 'C') {           // e.g., eNum 為 'E005', graphNode 為 'C029'，此時 nodeType 為 'C'
         if (!commonTagsHash[elementName]) commonTagsHash[elementName] = [];
         if (elementName != 'Udef_Evt_MissingBundleKey') {
            commonTagsHash[elementName].push(contentP);
         }
      }
      
      if (GlobalVar.eventElementTagIncludeGenre) {
         // 2025-01-16: 檢查 tag 的 value，若為 "type/others" 形式（例如 "RENOVATION/重修"），
         //             則將 type 取出，並額外 加上 <tag>.Genre: {<type>:n}，
         //             例如 Udef_Evt_EVENT.Genre: { "RENOVATION":n, "CONSTRUCTION":m, ... }
         // 注意：也需同步修改 applyNodeTagValFilter()！
         // 2025-02-17: 加上 removeSuffix() 處理
         let tagVal = row.content || '-';               // 2025-05-14: 防呆
         if (GlobalVar.computeDupByTagPlusContentWithoutSuffix) tagVal = removeSuffix(tagVal, '/');
         let [type, others] = tagVal.split('/');
         if (others !== undefined) {
            // 2025-07-01
            let newTag = elementName + '.Genre';
            if (!myEventElementTags[eventType][newTag]) myEventElementTags[eventType][newTag] = {};
            if (!myEventElementTags[eventType][newTag][type]) myEventElementTags[eventType][newTag][type] = 1;
            else myEventElementTags[eventType][newTag][type]++;
         }
      }

      // nodeInfo 陣列的元素
      // 注意：若 graphNode 為 E-node，nodeInfo[graphNode] 應該只會包含 Enum （等於 graphNode）這個元素 -- Udef_EventRelLite
      //       若 graphNode 為 C-node，nodeInfo[graphNode] 應會包含此 C-node 所連接 event 的 Enum rows
      //       => 例如若 E005 有兩個 C09 rows（例如 SharedPart 有相同的 TIME (一個 row 為 BEGIN，一個為 END），
      //          那麼這兩個 rows 會構成兩個 graphNode 是 C09 的 eventElement（eNum 都是 E005）
      let eventElement = { "docFilename": row.docFilename,               // 需 docFilename + comarkusId 才能找到資料庫對應文件的事件標記
                           "docTitle": row.docTitle,                     // 2025-09-28
                           "comarkusId": row.comarkusId,
                           "immarkusId": row.immarkusId,                 // 2025-11-27
                           "type": row.type,
                           "comarkusBundleIdx": row.comarkusBundleIdx,   // 2025-10-03: 後續顯示 event 節點內容時，需利用此變數將 elementName 彙整到不同的 bundles
                           //"markusId" row.markusId,                    // event element id
                           "elementName": elementName,                   // 就是 row.tagName
                           "content": row.content,                       // 2024-05-10: 注意，是 row.content
                           finalContent,                                 // 2024-12-18: 額外加上 finalContent 欄位... （row.content 加上 row.refId）
                           "refId": row.refId,                           // 2025-01-01: 加上以利判別 immarkus piece...
                           "extra": row.extra,                           // 2025-01-01: svg selector 資訊
                           eNum: row.eNum,                               // 2024-06-02: 方便 common node 的 eventElements 找到其來源的 eNum
                           graphNode,                                    // 2024-08-16: 為了讓 'C' node 呈現時，知道 eventElement 對應到圖形中的哪個節點（f_{graphNode}, c_{graphNode}），因此需加上 graphNode 資訊
                           graphNodeLabel,                               // 2024-07-26: 將 row.graphNodeLabel 拷貝到 eventElement.graphNodeLabel
                           eventTimeNotBefore,                           // 2024-08-18
                           eventTimeNotAfter,                            // 2024-08-18
                           nodeLegendCaption,                            // 2025-05-11
                           nodeLabelColorClass,                          // 2025-05-14
                           nodeColorIdx,                                 // 2025-05-10: '00', '01', etc.
                           //eventLocation,
                           //nodeDegree:
                           //"url": row.url,
                         };
                         
      // 2024-09-18: 將 tagName 和 row.content/finalContent （作為 tagName 的 sample values）存放到 GlobalVar.eventNodeTagNames
      // 2024-09-25: 注意，elementName 的值就是 row.tagName，而對 elementName 為 "Udef_EventRelLite" 的 content 應保持與其 graphNodeLabel 一致
      // 2025-05-11: (bug fix) 不是用 graphNode，而是用 eNum 與 eventNodeType 作為 GlobalVar.eventNodeTagNames 參數
      let eventNodeType = eNum.substr(0,1);
      if (!GlobalVar.eventNodeTagNames[eventNodeType]) GlobalVar.eventNodeTagNames[eventNodeType] = {};
      if (!GlobalVar.eventNodeTagNames[eventNodeType][elementName]) GlobalVar.eventNodeTagNames[eventNodeType][elementName] = {};   // 2024-09-25: 從 [] 改 {}
      
      // 2024-09-26: 注意，對 event node 而言，若 elementName 為 "Udef_EventRelLite"，graphNode 應與 row.eNum 一致
      let eventNodeTagName = (eventNodeType == 'B') ? row.refId : finalContent;        // 2025-01-25: binrel => 將 eventNodeTagName 設為 row.refId
      // 2025-05-11: 串接多值 （2025-05-14 改為陣列，方便最後用 array_unique 移除重覆）
      if (!GlobalVar.eventNodeTagNames[eventNodeType][elementName][eNum]) GlobalVar.eventNodeTagNames[eventNodeType][elementName][eNum] = [];
      GlobalVar.eventNodeTagNames[eventNodeType][elementName][eNum].push(eventNodeTagName);
      //alert(elementName + "\n" + eventNodeType + "\n" + JSON.stringify(GlobalVar.eventNodeTagNames));

      //// 2024-08-20: 注意變數的 scope 問題（getEmptyGraphNode() 會用到這些變數）
      //nodeShape = GlobalVar.nodeTypeShapeMap[nodeType] || 'circle';                  // 'circle', 'triangle', 'square'
      //nodeLabelColorClass = GlobalVar.nodeTypeLabelClassMap[nodeType];   // 'nodeLabelColor00', 'nodeLabelColor01', etc.
      
      if (!GlobalVar.graphNodeDict[graphNode]) {
         // 注意：display 和 labelDisplay 將會是第一個 row 的 display 和 labelDisplay
         GlobalVar.graphNodeDict[graphNode] = getEmptyGraphNode();
      }
      if (!GlobalVar.graphNodeDict[graphNode].nodeInfo[eNum]) {
         GlobalVar.graphNodeDict[graphNode].nodeInfo[eNum] = [];
      }
      
      // 2024-09-14: 不管是否要顯示，都需將資訊填入（panel 才能取得所有可能的節點資訊來顯示）
      let dictObj = GlobalVar.graphNodeDict[graphNode];
      dictObj.nodeInfo[eNum].push(eventElement);
      if (!dictObj.nodeContentStr.includes(row.content)) {         // 2025-05-17
         dictObj.nodeContentStr += row.content + '|';     // 2024-08-12: concat the content of all rows
      }
      dictObj.nodeTagName = row.tagName;                  // 2025-01-23
      
      // 2025-09-26: 加上 visibleConnectedNodeList 以「僅」取得當前顯示的相連節點
      //             注意！必須在此 display 為 true，且 eNum === graphNode 的 row display 也為 true 才能計入
      if (nodeType == 'C' && display === 'true' && GlobalVar.graphNodeDict[eNum].display === 'true') {
         dictObj.visibleConnectedNodeList.push(eNum);
      }

      dictObj.eventTimeNotBefore = Math.max(dictObj.eventTimeNotBefore, eventTimeNotBefore);   // 2024-08-18
      dictObj.eventTimeNotAfter = Math.min(dictObj.eventTimeNotAfter, eventTimeNotAfter);      // 2024-08-18

      // 2024-05-26: 若要在節點展開的方塊中展示「完整」的事件資訊，
      //             若 row.graphNode 為 'C' 節點（graphNode != evtNode），將需「額外」將
      //             eventElement 的資訊加到 GlobalVar.graphNodeDict[eNum].nodeInfo[eNum]
      if (GlobalVar.rectEntireEventInfo && graphNode != eNum) {
         if (!GlobalVar.graphNodeDict[eNum]) GlobalVar.graphNodeDict[eNum] = getEmptyGraphNode();
         
         let eNumDictObj = GlobalVar.graphNodeDict[eNum];
         if (!eNumDictObj.nodeInfo[eNum]) eNumDictObj.nodeInfo[eNum] = [];
         
         // 更新 GlobalVar.graphNodeDict[eNum] 各項屬性值
         // eNumDictObj.nodeTagName 應不需更新
         eNumDictObj.nodeInfo[eNum].push(eventElement);
         eNumDictObj.nodeContentStr += row.content + '|';                                                 // 2024-08-12
         eNumDictObj.eventTimeNotBefore = Math.max(eNumDictObj.eventTimeNotBefore, eventTimeNotBefore);   // 2024-08-18
         eNumDictObj.eventTimeNotAfter = Math.min(eNumDictObj.eventTimeNotAfter, eventTimeNotAfter);      // 2024-08-18
      }
      
      // 2025-06-01
      GlobalVar.graphNodeDict[eNum].xmlMetadataStr = GlobalVar.graphNodeDict[eNum].xmlMetadataStr || row.xmlMetadataStr;
      
      // 2025-06-20: 利用 elementName (i.e., row.tagName) 和 graphNode 判斷需要加上哪些額外節點
      if (elementName.startsWith('Udef_Align_')) {
         let contentParts = row.content.split('/');
         let extraNodeLabel = (contentParts.length <= 1)     // 防呆：若沒有 x/y 僅有 y，將 x 設為 'OBJECT'
                            ? 'OBJECT'
                            : contentParts.shift();
         if (!extraConnections[extraNodeLabel]) extraConnections[extraNodeLabel] = {};
         extraConnections[extraNodeLabel][graphNode] = 1;
         
         // 2025-06-15
         if (GlobalVar.genre4AlignedFeature) {
            allocateCommonTypeColor(LegendCaption.alignedFeature);
            row.nodeLegendCaption = LegendCaption.alignedFeature
         }
      }
      
      // 2025-08-09: 注意，elementName 其實就是 row.tagName
      if (!tagEnodeLookupHash[elementName]) tagEnodeLookupHash[elementName] = {};
      tagEnodeLookupHash[elementName][eNum] = 1;
      
   });   // tableData.forEach()
   //console.log(GlobalVar.graphNodeDict);

   // 2025-08-09 計算 GlobalVar.tagEnodeLookupMap
   GlobalVar.tagEnodeLookupMap = {};                           // reset 
   Object.keys(tagEnodeLookupHash).forEach(function(tag) {
      GlobalVar.tagEnodeLookupMap[tag] = Object.keys(tagEnodeLookupHash[tag]);
   });
   //alert(JSON.stringify(GlobalVar.tagEnodeLookupMap));

   // 2025-08-11: 若 GlobalVar.tagVisibleEnodeList 尚未有值，可直接以 tagEnodeLookupMap 作為其值
   if (Object.keys(GlobalVar.tagVisibleEnodeList).length == 0) {
      GlobalVar.tagVisibleEnodeList = GlobalVar.tagEnodeLookupMap;
   }
   
   // -----------------------------------------------------------------------
   // 2024-10-02: 將處理 graph nodes 的 TNB, TNA 移到此處
   autoAdjustNodeYearRange();
   
   // 2025-06-20: 加上表格資料所沒有的「額外節點」
   // 目標：如果 common node 的 tagName 是 Udef_Align_OBJECT，且其 value 具有階層性 (e.g., obj_part/city_wall_gate)，
   //       那麼就產生一個 obj_part 額外節點，並將這個節點和此 common node 以虛線相連
   //       如果沒有階層，就產生一個 object 額外節點，將它和此 aligned common node 相連。
   // 注意：假設 Udef_Align_XXX 的標籤值必然為 <extra_node>/<value> (<extra_node 若省略則自動算是 object)
   // 以 'CX01', 'CX02' 作為 graphNode (id) 可能比較合適？（視為 common node，但屬於「額外」加上的節點）
   //   let extraNode = {"nodeInfo":{"M001":1,
   //                    "M002":1,
   //                    "M003":1,
   //                    "C008":1,
   //                    "E006":1
   //                    },
   //                    "nodeType":"C",
   //                    "nodeShape":"triangle",
   //                    "nodeLegendCaption":"Hierarchy",
   //                    "nodeLabelColorClass":"nodeLabelColor05",
   //                    "nodeColorIdx":"05",
   //                    "display":"true",
   //                    "graphNodeLabel":"EXTRA",
   //                    "labelDisplay":"true",
   //                    "eventTimeNotBefore":-9999,
   //                    "eventTimeNotAfter":9999,
   //                    "nodeTagName":"EXTRA",
   //                    "nodeContentStr":"",
   //                    "initX":0,
   //                    "initY":0
   //                  };
      
   if (GlobalVar.addExtraConnections) {             // 後續可透過此變數切換是否顯示 extra connections
      //alert(JSON.stringify(extraConnections));
      Object.keys(extraConnections).forEach(function(extraNodeLabel, idx) {
         if (extraNodeLabel == 'NULL') return;      // 2025-06-21: 表示 "parent" 是 "NULL" (IMMARKUS 標記上表示沒有 parent 的 entity) -- 不需畫出節點
         let nodeType = 'C';
         let nodeLegendCaption = LegendCaption.featureHierarchy;           // 2025-06-25: Hilde 定名為 "Feature Hierarchy" 
         let nodeLabelColorClass = 'nodeLabelColor00';                     // 預設
         let nodeShape = 'square';                                         // 預設，防呆用

         // 2025-06-24: 以下與 EventConnectionGraph-main.js 處理 GlobalVar.commonGenreStyleMap 的方式一致
         let genre = nodeLegendCaption;
         allocateCommonTypeColor(genre);
         ({ nodeColorIdx, nodeLabelColorClass, nodeShape } = GlobalVar.commonGenreStyleMap[genre]);

         //let extraNode = getEmptyGraphNode();
         let extraNode = { nodeInfo: extraConnections[extraNodeLabel],      // e.g., {"C001":1, "C005":1} 表示此 extraNodeLabel 連到這兩個 C-nodes
                           visibleConnectedNodeList: [],                    // 2025-09-26 新增，為了得知當前繪圖時 'C' node 有連到哪些 eNum nodes
                           nodeType,
                           nodeShape,
                           nodeLegendCaption,
                           nodeLabelColorClass,
                           nodeColorIdx: nodeColorIdx,
                           display: 'true',                                 // 重要... 但後續會被改為 false? (debug!)
                           graphNodeLabel: extraNodeLabel,
                           labelDisplay: 'true',
                           eventTimeNotBefore: -9999,
                           eventTimeNotAfter: 9999,
                           nodeTagName: 'Udef_CX_' + extraNodeLabel,
                           nodeContentStr: '',
                           initX: 0,
                           initY: 0,
                         };
         //extraNode.nodeInfo = {"M001":1, "M002":1, "M003":1, "C008":1, "E006":1};

         let nodeId = 'CX' + idx.toString().padStart(2,'0');          // 'CX00', 'CX01', etc.
         GlobalVar.graphNodeDict[nodeId] = extraNode;
         //alert(JSON.stringify(GlobalVar.graphNodeDict[nodeId]));
      });
   }
   
   //alert(JSON.stringify(Object.keys(GlobalVar.graphNodeDict)));
   return GlobalVar.graphNodeDict;              // convertTableData2graphNodeDict()

   // -----------------------------------------------------------------------
   //        inner-functions of convertTableData2graphNodeDict()
   // -----------------------------------------------------------------------

   function getEmptyGraphNode() {
      // 回傳一個  GlobalVar.graphNodeDict[eNum] 所需的起始空物件（程式中需多次呼叫，統一管理較單純）
      // 因需用到 nodeType 等 local variables，函式放在 convertTableData2graphNodeDict() 內（nested functions 的優點）
      let obj = { nodeInfo: {}, 
                  visibleConnectedNodeList: [],  // 2025-09-26 新增，為了得知當前繪圖時 'C' node 有連到哪些 eNum nodes
                  nodeType,
                  nodeShape,
                  //nodeColor,                   // 'random (B/W)', etc.
                  nodeLegendCaption,             // 2025-05-11
                  nodeLabelColorClass,           // 2025-05-16
                  nodeColorIdx,                  // 2025-05-10: 新增加到每個 node 的顏色 '00', '01', etc.
                  display,                       // 注意：display 是字串 'true', 'false'
                  graphNodeLabel,                // local variable, graphNodeLabel := row.graphNodeLabel => 所以預設值是第一個碰到的 row.graphNodeLabel 值
                  labelDisplay,                  // 是否顯示 node label（注意是字串 'true', 'false'）
                  eventTimeNotBefore,
                  eventTimeNotAfter,
                  //eventLocation
                  nodeTagName,           // 2025-01-23
                  nodeContentStr: '|',   // 2024-08-12: 用 '|s1|s2|...|' 串起 eventElement 的 content
                  initX: 0,              // 2024-09-30
                  initY: 0,              // 2024-09-30
                };
      return obj;
   }
}  // convertTableData2graphNodeDict()

function autoAdjustNodeYearRange() {
   // 2024-10-02
   let graphNodes = Object.keys(GlobalVar.graphNodeDict);
   //console.log(graphNodes);
   graphNodes.forEach(function(graphNode) {
      if (GlobalVar.autoSetTnbTnaByTheOther) {
         let nodeObj = GlobalVar.graphNodeDict[graphNode];
         let tnb = nodeObj.eventTimeNotBefore;
         let tna = nodeObj.eventTimeNotAfter;
         // 2024-09-13
         // 如果 tnb 未定義但 tna 有定義，就將 tnb 設為 tna - GlobalVar.defaultTimeSpan
         // 如果 tna 未定義但 tnb 有定義，就將 tna 設為 tnb + GlobalVar.defaultTimeSpan
         // => 其實可以有個範圍？例如若範圍是 10 年，那麼若 tnb 未定義但 tna 有定義，就將 tnb := tna - 10
         if (tnb == -9999 && tna != 9999) tnb = tna - GlobalVar.defaultTimeSpan;
         else if (tnb != -9999 && tna == 9999) tna = tnb + GlobalVar.defaultTimeSpan;
         nodeObj.eventTimeNotBefore = tnb;
         nodeObj.eventTimeNotAfter = tna;

         if (graphNode.substr(0,1) != 'C') {             // event nodes
            let yearRange = tnb + " - " + tna;
            $("span.nodeYearRange[key='" + graphNode + "']").text(yearRange);
         }
      }
   });      
}

function applyQueryFilter(graphNodeDict) {
   // 2024-12-18: 將時間過濾，移出 Query Filter，放到 node tag:value filter 中...

   // Query Filter Syntax: A,B;X;Y,Z means (A and B) or (X) or (Y and Z)
   // e.g., A,B;X;Y,Z => [[A,B], [X], [Y,Z]]
   //       ignore blanks in symbols, e.g., "A, B; X; Y ,Z" returns the same result
   GlobalVar.temp.queryTerms = [];                            // reset，提供後續 highlightQueryTerms() 使用
   let queryFilter = $("#inputQueryFilter").val().trim();
   let disjointSubQueries = queryFilter.split(';')
                                       .filter((v) => (v.trim()!=''));
   disjointSubQueries = disjointSubQueries.map(function(v) {
      let ret = [];
      let conjParts = v.replace(/[\|]/g,'').split(',');       // remove '|' symbol (used in nodeContentStr)
      conjParts.forEach(function(x) {
         x = x.trim();
         if (x != '') {
            ret.push(x);
            GlobalVar.temp.queryTerms.push(escapeRegExp(x));   // 注意：因後續需套用 RegExp，在此先進行 escape 處理
         }
      });
      return ret;
   });
   //alert(JSON.stringify(disjointSubQueries));
      
   let graphNodes = Object.keys(graphNodeDict);
   graphNodes.forEach(function(graphNode) {
      // (2). apply query filter: 僅針對 display 為 true 的 event nodes 進行過濾
      // 2024-09-17: 注意，用 every() 和 some()，迭代的函數必須明確回傳 true/false
      if (graphNodeDict[graphNode].display == 'true' && disjointSubQueries.length > 0) {
         let nodeContentStr = graphNodeDict[graphNode].nodeContentStr;    // get a copy
         let outerPass = disjointSubQueries.some(function(conjList) {
            let innerPass = conjList.every(function(v) {
               if (!nodeContentStr.includes(v)) return false;
               else return true;
            });
            if (innerPass) return true;
            else return false;
         });
         if (!outerPass) graphNodeDict[graphNode].display = 'false';
      }

      // 2024-09-17: 以 queryTerms 對 event nodes 的內容進行 highlight
      if (checkIfEventNode(graphNodeDict[graphNode].nodeType)) {
         let t = getEventElementsHtml(graphNode, "00", false);
         $("#nodeDisplayTable div.eventElements[key='" + graphNode + "']").html(t);
      }
   });
   
}

// ------------------------------------------------------
//                event filtering
// ------------------------------------------------------

function applyNodeTagValFilter(graphNodeDict) {
   // event filtering 篩選函式
   // 2024-09-12, 2024-12-18, 2025-01-10, 2025-05-17
   let inputTNB = parseInt($("#inputTNB").val());
   let inputTNA = parseInt($("#inputTNA").val());
   let includeEventNodesWithoutTimeInfo = $("#includeEventNodesWithoutTimeInfo").prop("checked");
   //alert(inputTNB + ':' + inputTNA + ' -- ' + includeEventNodesWithoutTimeInfo);
   
   // 2025-05-26: 改為經由 #eventFilterCategoryCues （從 #divElementTagTypeValue 序列化的結果）而非 ui 狀態...
   let checkedTagValHash = {};
   
   //// 2025-07-01: 允許 <nodeType>:<tag>:<value>
   //let filterCategoryCuesStr = $("#eventFilterCategoryCues").val().trim();
   //filterCategoryCues = filterCategoryCuesStr.split(' ').forEach(function(filterCategoryCue) {
   //   if (filterCategoryCue == '--') return;           // 起始載入時，會有這種狀況
   //   let parts = filterCategoryCue.split(':');
   //   if (parts.length <= 1) {
   //      alert("WARNING: skip illegal filter: '" + filterCategoryCue + "'");
   //      return;
   //   }
   //   if (parts.length == 2) parts.unshift('[ALL]');             // 2025-07-01: 若沒有 <nodeType> 'E' 或 'M'，補上 '[ALL]' 表示對所有（不分類型） event nodes 進行篩選
   //   let [filterNodeType, tag, cue] = parts;
   //   if (!cue) return;                                          // 防呆
   //   if (!checkedTagValHash[filterNodeType]) checkedTagValHash[filterNodeType] = {};
   //   if (!checkedTagValHash[filterNodeType][tag]) checkedTagValHash[filterNodeType][tag] = {};
   //   cue.split('|').forEach(function(val) {
   //      checkedTagValHash[filterNodeType][tag][val] = 1;
   //   });
   //});
   
   // 2025-05-26: 注意，這裡已改採較佳方式，取 textarea.eventFilterByEventTerms 的字串值為準，而非取 overlay UI（例如使用者修改後按 cancel）狀態
   let clauseList = [];
   $("textarea.eventFilterByEventTerms").each(function() {     // 注意，可能有多個 filters
      let val = $(this).val().trim();
      if (val.split(':').length >= 2) clauseList.push(val);
   });
   
   //let eventTagsTextFilterStr = $("textarea.eventFilterByEventTerms").val().trim();          // Udef_Evt_BENEFICIARY|Udef_Evt_INITIATOR|Udef_Evt_SPONSOR:monk|buddhist
   //let clauseList = eventTagsTextFilterStr.split(' ');
   
   // A ^ B v C ^ D v E ==> (A ^ B) v (C ^ D) v E
   // filterDisjunctions = [[A,B],[C,D],E], where A, B, ..., E is filterItem := {filterNodeType, tags, terms}
   let filterClauses = [];           // 三層陣列，[filterDisjunctions1, filterDisjunctions2, ...] 這些 filterDisjunctions{i} 之間是 AND operation
   let appliedNodeType = '[ALL]';  
   clauseList.forEach(function(clause) {
      let filterDisjunctions = [];
      let subClauses = clause.split('[OR]').forEach(function(disjunction) {
         // TODO: 加入 [AND] operation...
         let andFilterItems = [];
         disjunction.split('[AND]').forEach(function(item) {
            let parts = item.split(':');            // 2025-07-31: (bug fix) 先前誤為 clause.split(':')
            if (parts.length > 3) {
               alert("WARNING: filter syntax error\n" + clause);
               return;
            }
            else if (parts.length >= 2) {
               if (parts.length == 2) parts.unshift(appliedNodeType);       // 2025-07-02: 補上變成 parts.length == 3
               appliedNodeType = parts[0];                                  // 若有指定 'E', 'M' 之類 nodeType，更新 appliedNodeType
               
               let filterItem = { filterNodeType: appliedNodeType,
                                  tags: parts[1].split('|').map((v) => v.replace(/\#/g,'Udef_DocMeta_')
                                                                        .replace(/\*/g,'Udef_Evt_')
                                                                        .replace(/\^/g,'Udef_properties_')
                                                                        .trim()),
                                  terms: parts[2].split('|').map((v) => v.trim()),
                                };
               andFilterItems.push(filterItem);
            }
            else ;       // 直接跳過（例如一開始的 '--'）
         });
         filterDisjunctions.push(andFilterItems);
      });
      if (filterDisjunctions.length > 0) filterClauses.push(filterDisjunctions);     // 注意，若 filterDisjunctions 為 [] 則不加入
   });
   //alert(JSON.stringify(filterClauses));    // 注意：filterClauses 是一個三層的陣列
   
   // -----------------------------------------------------
   //             對每個 graphNode 進行篩選
   // -----------------------------------------------------
   let nodePassed = [];
   let graphNodes = Object.keys(graphNodeDict);
   graphNodes.forEach(function(graphNode) {
      let nodeType = graphNodeDict[graphNode].nodeType;
      if (nodeType == 'C') {
         if (graphNode.startsWith('CX')) ;            // 2025-06-21: 'CX' 節點不能設為隱藏（後續 E-C 連線計算不會牽涉 CX 節點）
         else graphNodeDict[graphNode].display = 'false';
         return;
      }

      // 以下針對 Event nodes 進行篩選
      let timePass = true;

      // (1). 對每個 event node （'C', 'CX' 不會執行至此），取出 eventTimeNotBefore, eventTimeNotAfter => [tnb, tna]
      //      若其範圍和 [inputTNB, inputTNA] 沒有交集，就將 timePass 設為 false
      let tnb = graphNodeDict[graphNode].eventTimeNotBefore;
      let tna = graphNodeDict[graphNode].eventTimeNotAfter;
      //alert("[" + tnb + ',' + tna + '] -- ' + includeEventNodesWithoutTimeInfo + ' -- ' + graphNodeDict[graphNode].nodeType);
      
      if (tna < inputTNB || inputTNA < tnb) {
         //alert("[" + tnb + "," + tna + "] and [" + inputTNB + "," + inputTNA + "] has empty intersection");
         timePass = false;
      }
      else if (!includeEventNodesWithoutTimeInfo && tnb == -9999 && tna == 9999) {
         // 若 includeEventNodesWithoutTimeInfo 為 false，則將「無時間資訊的非 'C' 節點」隱藏 (uncheck event nodes)
         timePass = false;
      }
      
      // (2). 2025-05-17 加上 event tags text filter 檢查
      //      方法：提取出 eventElements = graphNodeDict[graphNode].nodeInfo[graphNode]，
      //            然後檢視 elementName 和 content 是否滿足 filter 設定，只要有一個 element 滿足即算是 pass
      //            若 eventTagsTextFilter 未定義，即視為 pass
      //      e.g., BENEFICIARY|INITIATOR|SPONSOR:monk|buddhist
      
      // 2025-09-26: 注意，加上 [AND] 後，filterClauses (相當於 filterDisjunctions) 是一個三層的陣列
      //             filterClauses := [filter
      //alert(JSON.stringify(filterClauses));
      let eventTagsTextFilterPass = filterClauses.every(function(filterDisjunctions) {     // filterClauses 若為空，則回傳 true
         let disjunctionPass = filterDisjunctions.some(function(andFilterItems) {
            let innerAndPass = andFilterItems.every(function(filterItem) {
               let {filterNodeType, tags, terms} = filterItem;
               let typeCheckPass = (filterNodeType == '[ALL]' || nodeType == filterNodeType);         // 對此 graphNode 而言，是 clause 可套用的節點型態
               if (!typeCheckPass) return true;                                                       // 不是需檢查的節點型態，就視為 pass
               
               let eventElements = graphNodeDict[graphNode].nodeInfo[graphNode];
               
               // 2025-07-07: 如果 terms 包含 [ANY] 或 [NONE]，必須特別處理...
               //             尤其是 [NONE]，必須所有 element.elementName 都沒有出現在 tags 中，才能設為 true
               let elementContainsTags = false;
               let filterItemPass = eventElements.some(function(element) {
                  if (tags.includes(element.elementName)) {
                     elementContainsTags = true;                                                      // 某個 elementName 出現在 tags 中
                     if (terms.includes('[ANY]')) return true;                                        // 2025-07-07
                     let pass = terms.some(function(term) {
                        if (GlobalVar.filterComparedWithExactValue) {                                 // 2025-07-04
                           if (element.content == term) return true;                                  // 必須值完全相同才算是通過
                        }
                        else {
                           if (element.content.includes(term)) return true;                           // 注意，只要包含 term 子字串即視為通過
                        }
                     });
                     if (pass) return true;
                  }
                  else {
                     // element.elementName 並未出現在 tags
                  }
               });
            
               if (terms.includes('[NONE]') && elementContainsTags === false) filterItemPass = true;        // 2025-07-07
               return filterItemPass;
            });
            return innerAndPass;
         });
         return disjunctionPass;
      });
      //alert(eventTagsTextFilterPass);
      
      let nodePass = (timePass && eventTagsTextFilterPass);
      if (nodePass) nodePassed.push(graphNode);           // 2025-01-10: 將 nodePassCount 改為 nodePassed 陣列
      graphNodeDict[graphNode].display = (nodePass ? 'true' : 'false');
   });   // graphNodes.forEach()

   if (nodePassed.length == 0) {
      let msg = "No event nodes satisfying the conditions!\n"
              + "Perhaps you have applied multiple filters across the different tags of event elements?\n"
              + "(click RESET FILTER to re-select filters)"
      alert(msg);
   }
   //else alert(`Find ${nodePassed.length} event nodes which satisfies the conditions`);
   return nodePassed;
}

function applyCommonNodeDisplayFilter(graphNodeDict) {
   // 2024-07-28: 最後（不是在 tabulator 修改 data）增加「利用 common node connectivity」
   //             篩選 common node display 的功能（只是因為這項 connectivity test 較簡單，不見得實用？）
   let eventConnectivity = {};

   // 2025-05-11: 重設以下 GlobalVar.temp.* 變數
   GlobalVar.temp.eventNodeGenreMap = {};
   GlobalVar.temp.imageNodeGenreMap = {};
   GlobalVar.temp.binrelNodeGenreMap = {};
   GlobalVar.temp.commonNodeTypeMap = {};
   GlobalVar.temp.eventNodeConnectedEntities = {};

   // (1). filter out "unwanted" common nodes
   if (GlobalVar.filterUnwantedCommonNodes) {           // 也算是防呆？
      // 2025-05-17: collect visible event nodes
      let visibleEventNodes = [];
      let graphNodeData;
      for (let graphNode in graphNodeDict) {
         graphNodeData = graphNodeDict[graphNode];
         if (['E','M','B'].includes(graphNodeData.nodeType) && graphNodeData.display == 'true') {
            visibleEventNodes.push(graphNode);
         }
      }
      
      // 2025-05-09, 2025-05-17: C-node visibility
      let minConnectivity = GlobalVar.thresholdCommonNodeDegree;
      for (let graphNode in graphNodeDict) {
         graphNodeData = graphNodeDict[graphNode];
         if (graphNodeData.nodeType == 'C' && !graphNode.startsWith('CX')) {                  // 2025-06-21: 需排除 'CX' nodes
            let filteredList = Object.keys(graphNodeData.nodeInfo);                           // eNumList
            $("input[name='hideIsolatedCommonNodes']:checked").each(function() {
               filteredList = filteredList.filter(v => visibleEventNodes.includes(v));        // 取交集
            });
            let nodeConnectivity = filteredList.length;
            if (nodeConnectivity < minConnectivity) graphNodeData.display = 'false';
            else {
               filteredList.forEach(function(eNum) {
                  if (!eventConnectivity[eNum]) eventConnectivity[eNum] = 0;
                  eventConnectivity[eNum]++;
               });
            }
         }
      }
   }

   // (2). filter out "event" nodes without connectivity
   if (GlobalVar.hideIsolatedEventNode) {
      for (let graphNode in graphNodeDict) {
         let graphNodeData = graphNodeDict[graphNode];
         if (['E','M','B'].includes(graphNodeData.nodeType)) {
            if (GlobalVar.hideIsolatedEventNode && !eventConnectivity[graphNode]) {     // 2024-08-12: 加上 GlobalVar.hideIsolatedEventNode
               graphNodeData.display = 'false';
            }
         }
      }
   }
   
   // 2025-05-11: 設定 GlobalVar.temp.eventNodeGenreMap, GlobalVar.temp.commonNodeTypeMap, GlobalVar.temp.imageNodeGenreMap, GlobalVar.binrelNodeGenreMap
   //             但... 要設定 GlobalVar.temp.commonNodeTypeMap 應該不需 iterate 整份 graphNodeDict
   //             例如可透過 GlobalVar.commonGenreStyleMap[nodeLegendCaption] 設定 nodeColorIdx, nodeLabelColorClass
   //             => 日後有機會再改善
   for (let graphNode in graphNodeDict) {
      let graphNodeData = graphNodeDict[graphNode];
      if (graphNodeData.display == 'true') {
         let nodeType = graphNodeData.nodeType;
         let nodeLegendCaption = graphNodeData.nodeLegendCaption;
         
         if (nodeType == 'E') {
            GlobalVar.temp.eventNodeGenreMap[nodeLegendCaption] = GlobalVar.eventGenreStyleMap[nodeLegendCaption];
         }
         else if (nodeType == 'M') {
            GlobalVar.temp.imageNodeGenreMap[nodeLegendCaption] = GlobalVar.imageGenreStyleMap[nodeLegendCaption];
         }
         else if (nodeType == 'B') {
            GlobalVar.temp.binrelNodeGenreMap[nodeLegendCaption] = GlobalVar.binrelGenreStyleMap[nodeLegendCaption];
         }
         else if (nodeType == 'C') {
            GlobalVar.temp.commonNodeTypeMap[nodeLegendCaption] = GlobalVar.commonGenreStyleMap[nodeLegendCaption];
         }
         else {
            alert("EventConnectionGraph-graph: unrecognized nodeType: " + nodeType);
         }
      }
   }

   //console.log(graphNodeDict);
   return graphNodeDict;
}

function convertTableDataAndApplyCommonNodeDisplayFilter() {
   // 2024-09-12: 將 convertTableData2graphNodeDict() 和 applyCommonNodeDisplayFilter() 從 drawGraph() 獨立出來
   // 將表格所使用的 GlobalVar.tableData，轉換成繪圖所需的 GlobalVar.graphNodeDict
   convertTableData2graphNodeDict(GlobalVar.tableData);
   //console.log(GlobalVar.graphNodeDict);
   
   // 如果 panel 中有「即時」（例如點選顯示 event details radio）切換顯示狀態者，在此也需檢查該狀態
   // 否則（例如 div.eventElements 起始狀態是隱藏）可能造成不一致（checkbox 狀態 'Y' 但 eventElement 
   // 還在隱藏狀態）
   let nodeDetails = $("input[name=inputNodeListDetails]:checked").val();
   if (nodeDetails == 'Y') $("#nodeDisplayTable div.eventElements").show();
   else $("#nodeDisplayTable div.eventElements").hide();
   
   // 2025-06-06: applyCommonNodeDisplayFilter 會加上 GlobalVar.temp.xxx 的一些設定，所以仍有需要
   GlobalVar.graphNodeDict = applyCommonNodeDisplayFilter(GlobalVar.graphNodeDict);

}

// ----------------------------------------------------------------

// 2024-09-14: 獨立出來（方便 panel 的 display list 可顯示 event element 訊息）
//             這裡的程式碼因多次修補，邏輯頗為雜亂，後續應找時間清理...
// 2025-12-08: 若 graphNode 為 'M' node，Chromium 執行此函式的速度很慢...
function getEventElementsHtml(graphNode, colorIdx = "00", titleBar = false) {
   let evtNode = graphNode;
   
   // 2025-09-26: 若是在 GlobalVar.disallowNodeExpansion 模式下，就固定採用 colorIdx 為 "00" (淡色底)
   if (GlobalVar.disallowNodeExpansion) colorIdx = "00";

   // 從 eventElements 彙整出要顯示在「event 矩形」的 html 文字
   let graphNodeData = GlobalVar.graphNodeDict[graphNode];
   let eventTimeNotBefore = graphNodeData.eventTimeNotBefore;    // 2024-08-18
   let eventTimeNotAfter = graphNodeData.eventTimeNotAfter;      // 2024-08-18
   let nodeInfoEvents = graphNodeData.nodeInfo;                           // objects of "array of eventElement"

   let eventElements = graphNodeData.nodeInfo[evtNode];
   let nodeType = graphNodeData.nodeType;
   let isEventNode = checkIfEventNode(nodeType);

   let eventTextColorClass = (parseInt(colorIdx) < DarkLightBoundary) 
                           ? "eventTextDarkColor" : "eventTextLightColor";
   let eventNodeTitleClass = (colorIdx < DarkLightBoundary) ? "eventNodeTitleLight" : "eventNodeTitleDark";
   if (GlobalVar.disallowNodeExpansion) eventNodeTitleClass = "eventNodeTitle";     // 2025-09-27

   //console.log(graphNode + ':' + evtNode, eventElements);
   let eventHtmlRows = [];
   let s = "";

   // 2025-06-01: 加上 xmlMetadataStr
   if (GlobalVar.displayXmlMetadata) eventHtmlRows.push(graphNodeData.xmlMetadataStr);
   
   // 影像節點: 加上影像的相關數據
   if (nodeType == 'M') {
      let firstDocFilename = eventElements[0].docFilename;            // 2024-06-28
      // 透過 docFilename 取得 immarkus json 所對應的影像（和 thumbnail）url
      let imageUrl = GlobalVar.immarkusDict[firstDocFilename].imageUrl;
      let imageThumbnail = GlobalVar.immarkusDict[firstDocFilename].imageThumbnail;
      
      // 取出所有 elements 的 shapes，放入 shapeList 中
      let shapeList = [];
      let pieceShapeDict = {};
      
      //console.log(nodeInfoEvents[graphNode]);
      nodeInfoEvents[graphNode].forEach(function(eventElement) {
         let pieceKey = eventElement.refId;
         let pieceShape = eventElement.extra;
         if (pieceKey && pieceShape && !pieceShapeDict[pieceKey]) pieceShapeDict[pieceKey] = pieceShape;
      });

      // 需移除最前面的空字串 -- 額外新增上去的 elementName:"Udef_EventRelLite"（其他有 elementName:"Udef_properties_ID", elementName:"Udef_properties_name" 等）
      //const colors = ImageShapeMask;
      let n = 0;
      for (let pieceKey in pieceShapeDict) {
         let pieceShape = pieceShapeDict[pieceKey];
         let shapeHtml = $("<div/>").append(pieceShape)
                                    .find("svg").find("*")                     // 假設 <svg> 下的所有標籤都可加上相同的 fill 屬性
                                    .attr("key", pieceKey)                     // 2024-05-02: 加上 key 以利後續加框等動作
                                    .attr("fill", ImageShapeMask[n % ImageShapeMask.length])
                                    .attr("style", "display:none")             // 2024-11-07: 預設隱藏 shapes
                                    .prop("outerHTML");
                                    
         shapeList.push(shapeHtml);
         n++;
      }
      //alert(JSON.stringify(shapeList));

      let shapeListHtml = shapeList.join('\n');
      
      // 注意：SVG2 建議使用 href 而非 xlink:href
      // viewBox = "<min-x> <min-y> <width> <height>"
      // 2025-09-24: <image> 不該用 id 而該用 key，因為可能會用在兩個地方（expandedNode 和 nodeContent）
      // 2025-12-08: 注意 image key 的規則是 immarkus_<graphNode>，後續若採用動態（點擊後才）顯示，會需要用到
      let t = '<svg class="imageContainer">'                   // image.on("load") 會設定 viewBox 屬性，若 GlobalVar.disallowNodeExpansion 為 false，顯示內容時需從 foreignObject 取得 viewBox 設定並進行取代
            + '<rect x="0" y="0" width="100%" height="100%" class="background" fill="#f0f0f0" />'    // 2025-06-04: 為圖片設定的淺灰背景（位置與尺寸與圖片相同），當圖片載入失敗時將可看見此底色
            + '<image key="immarkus_' + graphNode + '" xlink:href="' + imageUrl + '"></image>\n'      // 2025-06-06: 需加上 "xlink:"，否則影像會無法縮放？
            + shapeListHtml
            + '</svg>';
      //saveTextFile("test.xml", "<xml>" + t + "</xml>");
      
      eventHtmlRows.unshift(t);                         // 打算將 image 放在標題下方第一列...
   }  // end of if (nodeType == 'M')
   
   // 標題列
   //console.log(element["elementName"]);
   // 注意：'Udef_Evt_EVENT_SOURCE_TEXT' 與 'Udef_Genre_Subfolder' 都歸屬於 file structure，但後者的展開訊息還有待思考
   let element = eventElements[0];
   if (titleBar) {
      // 2025-10-08: 計算節點的一些統計資訊
      //             event node，可利用 eventElements 每個 element.elementName 判斷是否為「正常」標記（排除 Udef_EventRelLite 和 Udef_Align_）
      //             C-node 則需在 getEventElementsHtml() 外層計算...
      //console.log(eventElements);
      let tagHash = {};
      let eventAnnotationCount = 0;       // 2025-12-24: event annotation count 就是 tag 計數
      let imageAnnotationCount = 0;       // 2025-12-24: image annotation count 是 "entities" <Udef_Img_EntityClass> 數量
      let imageShapeCount = 0;            // 2025-12-24: image pieces 計數（但魯汶認為 pieces 不直觀，改用詞為 shapes）
      
      // 對 'M' 節點來說，eventElements 其實是對應到 image entities...
      eventElements.forEach(function(myElement) {
         let name = myElement.elementName;
         if (name !== 'Udef_EventRelLite' && !name.startsWith('Udef_Align_') && !name.startsWith('Udef_Genre_')) {
            if (!tagHash[name]) tagHash[name] = 0;
            tagHash[name]++;
            eventAnnotationCount++;
         }
         if (name === 'Udef_Genre_Filename') {
            // 包含 immarkusId 項目，只代表有找到 Paragraph 的 ImmarkusId，並不一定有對應的 <Event>
            // 那該怎麼計算 pieces 比較合適呢？
            // 2025-11-28: 似乎只能從 jqXml 比對是否在 Event ImmarkusPiece 下也有對應的 immarkusId？
            let paragraphImmarkusId = myElement.immarkusId;
            let selector = `Events > Event ImmarkusPiece[ImmarkusId="${paragraphImmarkusId}"]`;
            if (GlobalVar.jqXml.find(selector).length > 0) imageAnnotationCount++;    // 因為 eventElement 對應到 image entity，因此是 imageAnnotationCount 而非 imageShapeCount
         }
      });
      let tagCount = Object.keys(tagHash).length;

      // 2025-12-24: imageShapeCount 比較麻煩，必須從 jqXml 計算...
      if (nodeType == 'M') {
         let firstDocFilename = eventElements[0].docFilename;
         let selector = `document[filename="${firstDocFilename}"] Paragraph ImmarkusShape`;
         imageShapeCount = GlobalVar.jqXml.find(selector).length;
         //selector = `document[filename="${firstDocFilename}"] Paragraph ImmarkusObj ImmarkusBody[ImmarkusId="NULL"]`;
         //imageShapeCount -= GlobalVar.jqXml.find(selector).length;
      }

      // event node 標題列
      //console.log(graphNodeData);
      //alert(JSON.stringify(graphNodeData));
      // 2025-09-28: 需透過 graphNodeData.nodeInfo[graphNode][0] 才能取得當前事件節點的資訊？
      let eventInfo = graphNodeData.nodeInfo[graphNode][0];
      
      let eventDocTitle = eventInfo.docTitle;
      let eventDocFilename = eventInfo.docFilename;
      let eventTimeRange = "(" + eventTimeNotBefore + "~" + eventTimeNotAfter + ")"    // 2024-08-18
      
      // 2025-08-16: graphNode 移到 action bar (dragHandle)
      // 2025-10-21: 加上 linkback
      // 2025-11-27: nodeStats
      let nodeStats = '-';
      if (nodeType == 'E') nodeStats = `${tagCount} tags, ${eventAnnotationCount} annotations`;
      else if (nodeType == 'M') nodeStats = `${imageShapeCount} shapes, ${imageAnnotationCount} annotations`;
                   
      s = "<div class='eventNodeTitle " + eventNodeTitleClass + " " + GlobalVar.nodeFontSizeClass  // 2024-11-01: 加上 GlobalVar.nodeFontSizeClass
        + "' docFilename='" + convertToLegalTagAttrValue(element["docFilename"])                   // 2025-01-27: 20250123-c2d-福建bridges-Evt2Doc.xml 有看到包含單引號的檔名！
        + "' comarkusId='" + element["comarkusId"] + "'>"
        + graphNode 
        //+ ": " + element["content"]                                    // cf. finalContent in convertTableData2graphNodeDict()
        //+ " " + eventTimeRange
        + `: <span title="${eventTimeRange}" EventDocFilename="${eventDocFilename}">${eventDocTitle}</span>`
        + `<span class="butLinkBack" style="margin-left:16px" filenames="${eventDocFilename}"><i class="fa-solid fa-paper-plane"></i></span>`
        + "<br/>"
        + nodeStats
        + "</div>";
        
      eventHtmlRows.unshift(s);                                     // 將 event source 放在第一列
   }

   // 2025-12-12: 標題列、影像後，關於節點的相關細節
   let combinedMarkusHtmlRows = getEventNodeHtmlRows(graphNode);
   
   eventHtmlRows = eventHtmlRows.concat(combinedMarkusHtmlRows);
   
   if (eventHtmlRows.length > 0) {
      eventHtmlRows.unshift("<div class='eventItems'>");
      eventHtmlRows.push("</div>");
   }

   return eventHtmlRows.join("\n");
   
}  // getEventElementsHtml()


// 2025-11-20: 將處理 comarkusTagBundle (event metadata) 的程式獨立出來，方便 Source Structure 節點呈現 event metadata...
//             => 由於 Chromium 在產生 'M' node 的 html rows 速度頗慢，也許該將 'M' node 的部分獨立出來？
//                而且，'M' node 內容似乎可以直接從 jqXml document 提取所有 <Paragraph> 來產生，不需藉由迭代 eventElements 產生每個 row...
//             => 改成動態點擊後才產生 image content，應該暫時緩解過慢的問題，就等日後有機會再改善吧...
function getEventNodeHtmlRows(graphNode, eventTextColorClass = 'eventTextDarkColor') {
   // 傳入的「當前節點」 graphNode 必然是事件節點
   // 若為 'E' node: 回傳 comarkusTagBundle 彙整後的 HTML
   // 若為 'M' node: 回傳 getImageHtmlRowsFromParagraphs()
   // 若為（應該沒用到的）'B' node...
   
   if (graphNode.startsWith('M')) {
      // 直接從 document paragraphs 取得需呈現的 image content？
      return getImageHtmlRowsFromParagraphs(graphNode, eventTextColorClass);
   }
   
   let evtNode = graphNode;
   let graphNodeData = GlobalVar.graphNodeDict[graphNode];
   let eventElements = GlobalVar.graphNodeDict[evtNode].nodeInfo[evtNode];    // 2025-12-08
   let isEventNode = checkIfEventNode(graphNodeData.nodeType);
   
   let comarkusTagBundle = {};                // 2025-10-03: 依序將 eventElements 放入 comarkusTagBundle[comarkusBundleIdx] 的陣列中
   let immarkusPieceHtmlRowsDict = {};        // 2025-11-28
   let htmlRows = [];

   //alert(JSON.stringify(eventElements));
   // 2025-09-30: 將 eventElements 依照 EventTypeOrder 排序（依序顯示 EVENT_SOURCE_TEXT, EVENT, OBJECT_MAIN, TIME, ...）
   eventElements.forEach(function(element) {
      let name = element["elementName"];      // Udef_Evt_xxx
      if (name.startsWith("Udef_Evt_")) {
         let eventType = name.substr("Udef_Evt_".length);
         element.order = EventTypeOrder[eventType] || 100;
      }
      else element.order = 100;               // 非事件通通設為 100
   });
   
   eventElements.sort(function(a,b) {
                         if (a.order > b.order) return true;
                         else if (a.order < b.order) return false;
                         else return (a.elementName > b.elementName);
                      });
   
   
   // 2025-11-27: 儲存 immarkusId 以便後續可從 <Paragraph> 下取得 Udef_Align_OBJECT 資訊
   let immarkusIdHash = {};      // immarkusIdHash[pieceKey] := immarkusId
   
   // 事件項目列表 class="eventLine"
   eventElements.forEach(function(element) {
      let elementNodeType = element.eNum.substr(0,1);
   
      let lineClass = "eventNodeLine";
      let colorClass = eventTextColorClass;
      // 2024-08-15: 依照 elementNodeType 節點型態 (B, M, E)，套用不同方式調整顯示的文字...
      if (elementNodeType == 'E') {            // for 'E' node
         if (element['elementName'] == 'Udef_EventRelLite') ;        // 2025-08-16: 等同 (element["type"] == '系統編碼') -- 跳過不需顯示
         else {
            // 2025-10-05: OBJ_PART_LINKED 需特別處理
            //             - 將相同 comarkusBundleIdx 的項目聚集在一起...
            //             - 將 elementName 的 Udef_Evt_MATERIAL 的 "MATERIAL" 取出放在 extra（暫時略過）
   
            // 2025-10-05: OBJ_PARK_LINKED 是一個 bundle (bag) 型態，包含數個 Udef_Evt_OBJ_PART, Udef_Evt_OBJ_MATERIAL 等標籤，日後或許需要把標籤特性抓出來顯示...
            let extra = '';
            if (GlobalVar.showObjPartLinkedInnerTagName && element["type"] == 'OBJ_PART_LINKED' && element["elementName"].startsWith('Udef_Evt_')) {
               extra = element["elementName"].substr("Udef_Evt_".length) + ': ';
            }
            
            s = "<div class='" + lineClass + " " + colorClass + " " + GlobalVar.nodeFontSizeClass + "'>"
              + element["type"] + ': '
              + extra
              + highlightQueryTerms(element["finalContent"])         // 2024-12-18: 改用 finalContent
              + "</div>";
              
            // 2025-10-03: 依照 comarkusBundleIdx 裝箱，彙整後再一次填入 eventHtmlRows
            let comarkusBundleIdx = 'C' + element['comarkusBundleIdx'];     // 若沒加上 'C' （強迫變成字串），後續 Object.keys() 可能會依照 comarkusBundleIdx 排序（而不是依照排序後的 elements）
            if (!comarkusTagBundle[comarkusBundleIdx]) comarkusTagBundle[comarkusBundleIdx] = [];
            comarkusTagBundle[comarkusBundleIdx].push(s);
         }
      }
      else {      //  (elementNodeType == 'B') or others?
         if (element["type"] == "BinRel") {
            lineClass = "eventNodeTitle";
            colorClass = (colorIdx < DarkLightBoundary) ? "eventNodeTitleLight" : "eventNodeTitleDark";
            if (GlobalVar.disallowNodeExpansion) colorClass = "eventNodeTitle";
         }
         s = "<div class='" + lineClass + " " + colorClass + "'>" 
           + element["finalContent"]                     // 2025-01-04: from "content" to "finalContent"
           + "</div>";
         htmlRows.push(s);
      }
   });
   
   // 2025-10-03: COMARKUS -- 輸出 comarkusTagBundle 彙整結果
   if (Object.keys(comarkusTagBundle).length > 0) {
      Object.keys(comarkusTagBundle).forEach(function(bundleIdxStr) {
         htmlRows.push(`<div class="comarkusTagBundle" bundleIdx="${bundleIdxStr}">`);
         comarkusTagBundle[bundleIdxStr].forEach(function(s) {
            htmlRows.push(s);
         });
         htmlRows.push("</div>");
      });
   }

   GlobalVar.temp.eventLines += htmlRows.length;
   return htmlRows;
}  // end of getEventNodeHtmlRows()

// --------------------------------------------------------------------------
//// 2025-12-12: 將 'M' 節點的 panel 顯示內容獨立出來，方便後續改善
//function getImmarkusImagePanelHtmlRows(graphNode, eventTextColorClass) {
//   let evtNode = graphNode;
//   let graphNodeData = GlobalVar.graphNodeDict[graphNode];
//   let eventElements = GlobalVar.graphNodeDict[evtNode].nodeInfo[evtNode];    // 2025-12-08
//   let isEventNode = checkIfEventNode(graphNodeData.nodeType);
//   
//   let immarkusPieceHtmlRowsDict = {};        // 2025-11-28
//   let htmlRows = [];
//
//   // 2025-11-27: 儲存 immarkusId 以便後續可從 <Paragraph> 下取得 Udef_Align_OBJECT 資訊
//   let immarkusIdHash = {};      // immarkusIdHash[pieceKey] := immarkusId
//   
//   // 事件項目列表 class="eventLine"
//   eventElements.forEach(function(element) {
//      let eventYearKey = "NoEventYearInfo";                     // 2024-08-19
//      //alert(JSON.stringify(element));
//      
//      let elementNodeType = element.eNum.substr(0,1);
//
//      if (element["elementName"] == "Udef_properties_year") {             // Immarkus 專有標籤
//         // 2024-08-19: 將年份放回 'M' node 的 {eventYearKey}
//         //             因為還沒有 render 到 DOM object，因此需自己對 htmlRows[] 進行取代
//         //alert(JSON.stringify(htmlRows));
//         for (let i=0; i<htmlRows.length; i++) {
//            htmlRows[i] = htmlRows[i].replace(new RegExp(eventYearKey, 'g'), element["content"]);
//         }
//      }
//   
//      let lineClass = "eventNodeLine";
//      let colorClass = eventTextColorClass;
//      // 2024-08-15: 依照 elementNodeType 節點型態 (B, M, E)，套用不同方式調整顯示的文字...
//
//      // 2025-01-02
//      let pieceElement = element["finalContent"]; 
//      
//      // 2025-06-08: 由「dunhua_neicheng <span class="immarkusPieceRefId">(piece:0)</span>」改為「dunhua_neicheng/<span class="immarkusPieceRefId">piece:0</span>」
//      let jqPieceElement = $("<div/>").append(pieceElement);
//      let pieceId = jqPieceElement.find("span.immarkusPieceRefId").text() || 'DOCMETA';    // .replace(/\((.+)\)/g, "$1");
//      jqPieceElement.find("span.immarkusPieceRefId").remove();
//      
//      // 2025-11-27: 從 element.finalContent 中，將 immarkusId 擷取出來，放入 immarkusPieceHtmlRowsDict[pieceId] 字串中
//      //             但問題是 pieceKey (piece:nnn) 並沒有儲存在 element 結構中，必須透過 GlobalVar.jqXml
//      //             從 Paragraph 取得屬性 Key 的值 (mark:n) 並進行「硬」轉換...
//      let jqTempXml = $("<p/>").append(element.finalContent);
//      let immarkusId = jqTempXml.find("span").first().attr("paragraphImmarkusId");    // <Paragraph> 和對應 <ImmarkusPiece> 有相同的 ImmarkusId
//      if (immarkusId !== '-') {                     // <ImmarkusBody> 的 ImmarkusId 可能為 "NULL"，但 <Paragraph> 應該都有 ImmarkusId
//         let jqParagraph = GlobalVar.jqXml.find(`Paragraph[ImmarkusId="${immarkusId}"]`);
//         let markKey = jqParagraph.attr("Key") || 'mark:999';
//         let pieceKey = 'piece:' + markKey.split(':')[1].padStart(3,'0');
//         immarkusIdHash[pieceKey] = immarkusId;
//      }
//      
//      let finalContentMainText = jqPieceElement.text().trim();
//      if (finalContentMainText.endsWith('/')) finalContentMainText = finalContentMainText.slice(0, -1);  // 移除最後一個字元
//      
//      if (!immarkusPieceHtmlRowsDict[pieceId]) immarkusPieceHtmlRowsDict[pieceId] = [];
//      s = `<div class="${lineClass} ${colorClass} ${GlobalVar.nodeFontSizeClass}">`
//        + (element["type"] ? element["type"] + ": " : '')      // 2024-10-07: 從 '/' 改 ': '
//        + highlightQueryTerms(finalContentMainText)            // 2024-12-18: 改用 finalContent
//        + "</div>";
//      
//      // 2025-12-08: WARNING (TOCHECK) 由於 C-node nodeInfo 的 event list 似乎有重覆內容，
//      //             會造成資訊重覆顯示，在此暫時透過暴力檢查，若內容相同則不加入陣列
//      if (immarkusPieceHtmlRowsDict[pieceId].includes(s)) ;
//      else immarkusPieceHtmlRowsDict[pieceId].push(s);
//
//      GlobalVar.temp.eventLines++;          // 藉 GlobalVar.temp 將 eventLines 資訊回傳出去
//   });
//   
//   // 2025-11-27: IMMARKUS
//   if (Object.keys(immarkusPieceHtmlRowsDict).length > 0) {
//      let pieceKeyList = Object.keys(immarkusPieceHtmlRowsDict);
//      pieceKeyList.sort(function(a,b) {                           // 需排序，否則 'piece:002' 可能會跑到 'piece:000' 前面（但 Chromium 排序很慢！）
//                          if (a === '系統編碼') return -1;        // 將 '系統編碼' 排在最前面
//                          else if (b === '系統編碼') return 1;
//                          return a.localeCompare(b);
//                       });    
//      
//      let pieceHtmlHash = {};    
//      pieceKeyList.forEach(function(pieceKey) {
//         // pieceKeyList := ["系統編碼","DocAlign","DocGenre","piece:001","piece:002","piece:003","piece:004",...]
//         // 2025-11-27: 似乎可以特別處理 'DocAlign'，但看起來會增加後續麻煩，先略去
//         if (['DocGenre','DocAlign'].includes(pieceKey)) return;     // 跳過 'DocGenre'（若魯汶有要求再說）
//         let pieceTitle = (pieceKey == '系統編碼') 
//                        ? 'image metadata'                           // 2025-12-24
//                        : pieceKey.replace(/piece/g, 'shape') ;      // 2025-12-24: 將 piece:nnn 顯示為 shape:nnn
//         let titleStr = `<div class="immarkusPieceIdBar" paragraphImmarkusId="${immarkusIdHash[pieceKey]}">${pieceTitle}</div>`;
//         htmlRows.push(titleStr);
//
//         if (pieceKey == '系統編碼') {
//            htmlRows = htmlRows.concat(immarkusPieceHtmlRowsDict[pieceKey]);
//            
//            // 2025-11-28: 需加上 imageMetadata -- 存放於「某個」（通常是最後一個，但並不一定）
//            //            <ImmarkusBody ImmarkusId="NULL"...> 的 Paragraph 標籤內的 <ImageProperties>
//            let docFilename = graphNodeData.nodeInfo[graphNode][0].docFilename;
//            let jqDocument = GlobalVar.jqXml.find(`document[filename="${docFilename}"]`);
//            if (jqDocument.length > 0) {
//               let jqImmarkusBody = jqDocument.find('ImmarkusBody[ImmarkusId="NULL"]');
//               if (jqImmarkusBody.length > 0) {
//                  let s = jqImmarkusBody.find("ImmarkusProperties").html();
//                  htmlRows.push("<div class='imageMetadata'>" + s + "</div>");
//               }
//               else {
//                  console.log(`ImageMetadata: cannot find ImmarkusBody with NULL ImmarkusId in filename '${docFilename}'`);
//               }
//            }
//            else {
//               console.log(`ImageMetadata: cannot find document with filename '${docFilename}'`);
//            }
//         }
//         else if (pieceKey == 'DocAlign') {
//            // 前面跳過，所以這部分應不會執行到...（先留著，或許未來有用）
//            immarkusPieceHtmlRowsDict[pieceKey].forEach(function(pieceRow) {
//               if (!pieceHtmlHash[pieceRow]) pieceHtmlHash[pieceRow] = 0;
//               pieceHtmlHash[pieceRow]++;
//            });
//            
//            let collectedPieceRows = [];
//            Object.keys(pieceHtmlHash).sort().forEach(function(pieceRow) {
//               let s = pieceRow;
//               if (pieceHtmlHash[pieceRow] > 1) {
//                  let jqPieceRow = $("<p/>").append(pieceRow);
//                  let t = jqPieceRow.text() + ' (' + pieceHtmlHash[pieceRow] + ' pieces)'
//                  jqPieceRow.find("div").text(t);
//                  s = jqPieceRow.html();
//               }
//               collectedPieceRows.push(s);
//            });
//            
//            htmlRows = htmlRows.concat(collectedPieceRows);
//         }
//         else if (pieceKey.startsWith('piece:')) {
//            // 2025-11-27: 加上 DocAlign 與 image (piece) metadata  
//            //             => 這類訊息並沒有被加入 tableData，需透過 ImmarkusId 到 jqXml 查詢 Paragraph > Udef_Align_OBJECT 取得對應訊息
//            //alert(pieceKey + "\n" + JSON.stringify(immarkusIdHash));
//            let immarkusId = immarkusIdHash[pieceKey];
//            let jqParagraph = GlobalVar.jqXml.find(`Paragraph[ImmarkusId="${immarkusId}"]`);
//            if (jqParagraph.length == 0) {
//               console.log(`Cannot find Paragraph ImmarkusId:${immarkusId}, pieceKey=${pieceKey}`);
//               return;
//            }
//            
//            // 加上 Udef_Align_OBJECT 訊息
//            let alignText = jqParagraph.find("Udef_Align_OBJECT").text();
//            alignText = "<div class='udefAlignText'>Udef_Align_OBJECT: " + alignText + "</div>";
//            s = "<div class='imagePieceMetadata'>" + alignText + "</div>";
//            htmlRows.push(s);
//
//            // 最後才加上基本的標記資料
//            htmlRows = htmlRows.concat(immarkusPieceHtmlRowsDict[pieceKey]);
//         }
//         else {      // 防呆
//            htmlRows.push("<div>SKIP: " + pieceKey + "</div>");
//         }
//      });
//      //console.log(htmlRows);
//      GlobalVar.temp.eventLines += Object.keys(immarkusPieceHtmlRowsDict).length;
//   }
//   return htmlRows;
//}

function getImageHtmlRowsFromParagraphs(graphNode, eventTextColorClass) {
   // 2025-12-25: 對比舊版 getImmarkusImagePanelHtmlRows()
   let htmlRows = [];
   let graphNodeData = GlobalVar.graphNodeDict[graphNode]; 

   // 利用 docFilename 從 GlobalVar.jqXml 的 document Paragraphs 取得所需資訊
   let docFilename = graphNodeData.nodeInfo[graphNode][0].docFilename;
   let jqDoc = GlobalVar.jqXml.find(`document[filename="${docFilename}"]`);

   // <div class="eventItems">
   // <div class="eventNodeTitle eventNodeTitle fontSizeLarge" docfilename="<filename.json>" comarkusid="-">
   //    Mxxx: <span title="..." eventdocfilename="<filename.json>">abc</span>
   //    <span class="butLinkBack" style="margin-left:16px" filenames="<filename.json>"><i class="fa-solid fa-paper-plane"></i></span>
   //    <br/>mm pieces, nn annotations</div>
   //    <svg>...</svg>
   //    -------- 從以下開始 ---------
   //    <div class="immarkusPieceIdBar" paragraphImmarkusId="NULL">image metadata</div>
   //       <div class="eventNodeLine eventTextDarkColor fontSizeLarge">Type:Filename</div>
   //       <div class="imageMetadata">
   //          <div>properties/Volume: <udef_properties_volume>1</udef_properties_volume></div>
   //          ...
   //       </div>
   //    </div>
   //    (piece blocks)
   //    <div class="immarkusPieceIdBar" paragraphImmarkusId="...">piece:nnn</div>
   //       <div class="imagePieceMetadata"><div class="udefAlignText">Udef_Align_OBJECT: OBJECT_MAIN/city_wall</div></div>
   //       <div class="eventNodeLine eventTextDarkColor fontSizeLarge">ID: yangzhou_cheng</div>
   //       ...
   //    </div>
   //    ...
   //    -------- 到以上為止 ---------
   // </div>

   // (1). 輸出 image metadata 區塊 (Genre, image metadata)
   //      => 從 <doc_content> 取出 <ImmarkusImage> 的 @Type 和 @Filename，輸出 <Type>:<Filename>
   //         注意： <xml_metadata> 的內容是 folder metadata，不需在 image 點擊時展示（點擊 image node 的 source structure node 展示 folder metadata）
   //      => 從 Paragraph/ImmarkusObj/ImmarkusBody 找出 @ImmarkusId 為 NULL 項目，輸出 image metadata
   let jqDocContent = jqDoc.find("doc_content");
   let jqImmarkusImage = jqDocContent.find("ImmarkusImage");
   let imageType = jqImmarkusImage.attr("Type") || '-';
   let imageFilename = jqImmarkusImage.attr("Filename") || '-';

   let titleStr = `<div class="immarkusPieceIdBar" paragraphImmarkusId="NULL">image metadata</div>`;
   htmlRows.push(titleStr);
   let s = `<div class="eventNodeLine ${eventTextColorClass}">${imageType}: ${imageFilename}</div>`;
   htmlRows.push(s);
   
   s = '<div class="imageMetadata">';
   htmlRows.push(s);
   let jqImageBody = jqDocContent.find(`Paragraph ImmarkusBody[ImmarkusId='NULL']`);
   // 略去 Udef_Genre_ 標籤，僅輸出 ImmarkusProperties 內容
   jqImageBody.find("ImmarkusProperties div").each(function() {
      let t = $(this).html() + "<br/>";
      htmlRows.push(t);
   });
   htmlRows.push('</div>');
   
   // (2).對所有 <doc_content> 下的 <Paragraph> 逐一處理
   //     若 Paragraph/ImmarkusObj/ImmarkusBody 的 @ImmarkusId 不為 NULL，則輸出 piece:nnn 區塊
   //     
   jqDocContent.find("Paragraph").each(function() {
      let immarkusId = $(this).attr("ImmarkusId");
      let key = $(this).attr("Key");                  // mark:n ==> 轉換為 piece:nnn
      let [_, pieceNumber] = key.split(':');
      pieceNumber = pieceNumber.padStart(3, '0');
      
      $(this).find("ImmarkusBody").each(function() {
         let immarkusId = $(this).attr("ImmarkusId");
         if (immarkusId === 'NULL') return;           // 跳過，此為（由 Rainer IMMARKUS json 結構轉出的）image metadata
         let jqImmarkusBody = $(this);
         
         // 注意：除了需跳過 immarkusId 為 NULL 的 paragraph，
         //       有的 ImmarkusBody 之下的 ImmarkusProperties 為空（例如 "嘉靖_惟揚志_48_49_com.png" 的 mark:7, mark:8, mark:9 三個 Paragraphs）...
         // 2025-12-24: 不能跳過！ 可能有 UDef_Align_OBJECT 或 Udef_Img_EntityClass
         //             => 若一個 shape 包含多份 entities，將會呈現多個 immarkusPieceIdBar
         let s = `<div class="immarkusPieceIdBar" paragraphImmarkusId="${immarkusId}">shape:${pieceNumber}</div>`;      // 2025-12-23: 改 piece 為 shape
         htmlRows.push(s);
         
         // 2025-12-24: 以 ImmarkusBody 下的 Udef_Align_OBJECT 內容作為 image piece metadata
         let selector = 'Udef_Align_OBJECT';      // 'Udef_Align_OBJECT,Udef_Img_EntityClass'
         jqImmarkusBody.find(selector).each(function() {
            let t = '<div class="imagePieceMetadata"><div class="udefAlignText">'
                  + $(this).prop("tagName") 
                  + ': ' + $(this).text()
                  + "</div></div>"
            htmlRows.push(t);
         });

         jqImmarkusBody.find("ImmarkusProperties").each(function() {
            let jqDiv = $(this).find("div");
            jqDiv.each(function() {
               let t = $(this).html();
               t = `<div class="eventNodeLine ${eventTextColorClass} fontSizeLarge">${t}</div>`;
               htmlRows.push(t);
            });
         });
      });
      
   });
   
   GlobalVar.temp.eventLines += htmlRows.length;
   return htmlRows;
}


// C-node 內容顯示
function getCommonNodeContentHtmlRows(graphNode, connFilenames) {
   let dispEventHtmlRows = [];
   let graphNodeData = GlobalVar.graphNodeDict[graphNode];
   let graphNodeLabel = graphNodeData.graphNodeLabel;

   // 2025-09-26: graphNodeData.nodeInfo 包含「所有」與此 'C' node 相連的節點，
   //             在此仍需透過 connFilenames 判斷當前可見的節點...
   let allConnNodes = Object.keys(graphNodeData.nodeInfo);

   // C-node 統計資訊: 加上 number of annotations (row numbers), number of events (連線數）統計
   let eventAnnotationCount = 0;
   let eventCount = 0;
   let imageCount = 0;                              // 2025-11-26: 魯汶希望區隔 event 和 image -- 雖然它們都被視為 event nodes
   let cxNodeDegree = 0;                            // 2025-11-26: 計算 CX 節點的 degree（連到幾個 C nodes）
   let cNodeLinkbackFilenames = [];                 // 2025-10-25
   GlobalVar.temp.cxNodeConnected = false;          // 2025-10-31: CX 節點是否有連到某個 C 節點 -- 改存到 GlobalVar.temp.cxNodeConnected

   let immarkusIdProcessed = {};      // 2025-11-27: 每個 piece 的 <Udef_Genre> 和 <Udef_Align> 都相同，因此需避免重覆輸出
   let connNodeHtmlRows = [];         // 2025-12-08
   allConnNodes.forEach(function(connEventNode) {
      // e.g., connEventNode := 'E001'
      // 注意，若 graphNode 為 'CX' node (e.g., 'CX00')，connEventNode 將會是 C node (e.g., 'C018')，此時 nodeInfo[connEventNode] 會是 undefined
      let connNodeInfo = GlobalVar.graphNodeDict[connEventNode];

      if (graphNode.startsWith('CX')) {
         // 當 GlobalVar.addExtraConnections 為 true，會在 GlobalVar.graphNodeDict[] 加入 nodeId 為 'CX' 開頭的節點
         // 但若判斷不需顯示（沒有連到任何其他節點），就不會加入 computeGraphData() 結果的 graphData 陣列（以及全域的 GlobalVar.temp.graphData）

         if (connNodeInfo.display == 'false') return;     // 2025-10-04: 連接到的 C node 是隱藏的
         cxNodeDegree++;
         
         GlobalVar.temp.cxNodeConnected = true;
         connNodeHtmlRows.push("<div class='cxConnectedNode'>");
         let s = connEventNode + ': ' + connNodeInfo.graphNodeLabel;
         connNodeHtmlRows.push(s);
         connNodeHtmlRows.push("</div>");
      }
      else {    // normal 'C' nodes (feature, source-structure)
         let docMetadataProcessed = {};                   // 2025-11-27
         if (!graphNodeData.visibleConnectedNodeList.includes(connEventNode)) return;
         
         let eventList = graphNodeData.nodeInfo[connEventNode];
         connNodeHtmlRows.push("<div class='cNodeEventBundle'>");
         
         // 標題
         // 2025-10-22: 加上 linkback
         let eventItem = eventList[0];
         let s = "<div class='cNodeEventTitle'>"
               + "<span class='eventId'>" + eventItem.eNum 
               + "</span>: <span class='eventDocTitle' docFilename='" + escapeHtml(eventItem.docFilename) + "'>" + eventItem.docTitle
               + "</span>"
               + `<span class="butLinkBack" style="margin-left:16px" filenames="${eventItem.docFilename}"><i class="fa-solid fa-paper-plane"></i></span>`
               + "</div>";
         connNodeHtmlRows.push("<div>" + s + "</div>");
         cNodeLinkbackFilenames.push(eventItem.docFilename);
         
         eventList.forEach(function(eventItem, idx) {
            // TOCHECK: (WARNING) 對於 C-node 而言，eventList 後半是前半的重覆內容！
            // 2025-12-08: 因為 eventItem 會重覆（應該是先前重覆加入項目），暴力跳過後半的 eventItem
            if (idx >= eventList.length / 2) return;     // 2025-12-08: 直接跳過後半的項目（日後若修正重覆問題，必須移除這段程式碼）
            
            connFilenames.push(escapeHtml(eventItem.docFilename));     // 2025-10-21: 注意，檔名可能會包含單引號
            
            // 2025-11-26: 魯汶希望 source structure 節點 ('Udef_Evt_EVENT_SOURCE_TEXT','Udef_Genre_Subfolder') 要列出事件節點的 metadata
            if (GlobalVar.tagsForFileStructure.includes(eventItem.elementName)) {
               // 2025-11-21: 特別處理 SourceStructure 節點的顯示內容（加上 event metadata）
               //             注意：有時兩份文件會有相同名稱（例如，「松溪縣志: 重建杉溪橋碑記」有兩份，作者分別為「潘拱辰」與「徐民式」），
               //                   這種狀況下，SourceStructure 節點會連到多個 event nodes （這兩份文件的事件節點）！
               // 2025-11-21: 需透過 GlobalVar.jqXml 取得文件的 meteadata
               let eventDocFilename = eventItem.docFilename;
               
               if (docMetadataProcessed[eventDocFilename]) return;     // 已經處理該文件的 xml_metadata，直接跳過
               //alert(connEventNode + "\n" + eventDocFilename + "\n" + GlobalVar.jqXml.find(`document[filename="${eventDocFilename}"]`).length);
               
               let htmlRows = [];
               GlobalVar.jqXml.find(`document[filename="${eventDocFilename}"]`).each(function() {
                  $(this).find("xml_metadata *").each(function() {
                     let tagName = $(this).prop("tagName").replace('Udef_DocMeta_','#');
                     let tagValue = $(this).text();
                     htmlRows.push("<div>" + tagName + ': ' + tagValue + "</div>");
                  });
               });
               
               let docMetadataXml = "<div class='sourceNodeMetadata'>"     // 2025-11-28
                                  + htmlRows.join("\n")
                                  + "</div>";
               connNodeHtmlRows.push(docMetadataXml); 
               
               docMetadataProcessed[eventDocFilename] = 1;     // 避免重覆（尤其 image 經常會重覆多次）
            }
            else {
               // Normal feature node (C-node) -- 內容為連到的 Event/Image 特徵
               
               // 2025-11-28: 若為 Image node，加上該 feature 來自哪個 piece 的訊息
               let extraInfo = '';
               let jqSpan = $("<p/>").append(eventItem.finalContent).find("span[paragraphImmarkusId]");
               if (jqSpan.length > 0) {         // 為 Image 節點
                  let paragraphImmarkusId = jqSpan.attr("paragraphImmarkusId");
                  let mark = GlobalVar.jqXml.find(`Paragraph[ImmarkusId="${paragraphImmarkusId}"]`).attr("Key");
                  let pieceText = 'piece:' + mark.split(':')[1].padStart(3,'0');
                  extraInfo = ' (' + pieceText.replace(/piece/g,'shape') + ')';
               }
               
               let s = "<div class='eventItemFinalContent'>" 
                     + eventItem.finalContent 
                     + extraInfo
                     + "</div>";
                     
               connNodeHtmlRows.push(s);
            }
         });    
         
         connNodeHtmlRows.push("</div>");                     // close <div class='cNodeEventBundle'>

         if (connEventNode.startsWith('M')) imageCount++;
         else eventCount++;
         eventAnnotationCount += eventList.length;
      }
   });
   
   dispEventHtmlRows = dispEventHtmlRows.concat(connNodeHtmlRows);
   
   // 補上標題列
   let isSourceStructureNode = GlobalVar.tagsForFileStructure.includes(graphNodeData.nodeTagName);

   if (GlobalVar.computeDupByTagPlusContentWithoutSuffix) graphNodeLabel = removeSuffix(graphNodeLabel, '/');    // 2025-02-11
   let commonNodeStatsText = '-';
   if (graphNode.startsWith('CX')) {
      // 特殊的
      commonNodeStatsText = '<br/>' + `${cxNodeDegree} features`;
   }
   else if (isSourceStructureNode) {
      // structure node 只需顯示有幾項 events/images
      if (eventCount > 0) commonNodeStatsText = `<br/>${eventCount} events`;
      if (imageCount > 0) commonNodeStatsText = `<br/>${imageCount} images`;
   }
   else {
      // 一般 feature node
      let list = [];       // 2025-12-02
      commonNodeStatsText = '<br/>';
      //list.push(`${eventAnnotationCount} annotations`);
      if (eventCount > 0) list.push(`${eventCount} events`);
      if (imageCount > 0) list.push(`${imageCount} images`);
      commonNodeStatsText += list.join(', ');
   }
   
   let cNodeTitleLinkback = '';
   if (GlobalVar.enableLinkbackMultiFilenames) {
      let filenames = cNodeLinkbackFilenames.join('|');
      cNodeTitleLinkback = `<span class="butLinkBack" style="margin-left:16px" filenames="${filenames}"><i class="fa-solid fa-paper-plane"></i></span>`;
   }
   let s = "<div class='commonNodeTitle'>"
         + graphNode + ": " + graphNodeLabel
         + cNodeTitleLinkback
         + commonNodeStatsText
         + "</div>";
   dispEventHtmlRows.unshift(s);       // 將 event title 放在第一列
   
   return dispEventHtmlRows;
}


// ---------------------------------------------------------------------------------

function checkIfEventNode(node) {
   let nodeType = node.substr(0,1);             // 2025-01-10: 增加方便性，讓輸入可以是 graphNode 或者已經是 nodeType 
   let ret = (nodeType == 'E' || nodeType == 'M' || nodeType == 'B') 
           ? true : false;     // event node or "common" node
   return ret;
}

function highlightQueryTerms(s) {
   // 2024-09-17: 利用 GlobalVar.temp.queryTerms 對 s 套上高亮標籤
   // 2024-10-10: 加上 GlobalVar.highlightQueryTerms 旗標
   if (GlobalVar.highlightQueryTerms && GlobalVar.temp.queryTerms.length > 0) {
      let regexp = new RegExp('(' + GlobalVar.temp.queryTerms.join('|') + ')', 'g');
      s = s.replace(regexp, "<span class='queryTerm'>$1</span>");
      //if (t!=s) alert(" ==> " + t);
   }
   return s;
}

// ------------------------------------------------------------------------------------

function computeGraphData() {
   // 使用者進行 style 設定後，相關值都會經 convertTableData2graphNodeDict() 而儲存在 GlobalVar.graphNodeDict
   let graphData = [];
   let graphNodeDict = GlobalVar.graphNodeDict;          // a reference
   let graphNodes = Object.keys(graphNodeDict);
   
   //console.log(graphNodeDict);
   //alert("YES computeGraphData");
   
   // 計算 graphData，原則上將以一個矩形描繪出一個 graphNode 中所有 display==true 的 event elements
   let totalLinks = 0;              // 計算總共有多少 edges（非必要，但可能有用）
   
   // 2024-09-11: 即使節點都選擇 "random (B/W)"，不同型態的節點也可套用不同顏色
   let nodeTypes = ['C', 'E', 'M', 'B'];
   
   // 2024-10-01: 指定每個 graphNode 的起始位置
   //alert(GlobalVar.svgWidth + ':' + GlobalVar.svgHeight);
   let collectedTypedNodes = {};            // 所有 display 為 true 的 graph nodes（分節點類型存放）
   graphNodes.forEach(function(graphNode) {
      if (graphNodeDict[graphNode].display == 'true') {
         let nodeType = graphNode.substr(0,1);
         if (!collectedTypedNodes[nodeType]) collectedTypedNodes[nodeType] = [];
         collectedTypedNodes[nodeType].push(graphNode);
      }
   });
   
   // 2025-05-03
   let collectedNodeTypes = Object.keys(collectedTypedNodes);
   collectedNodeTypes.sort();
   
   let collectedGraphNodes = [];            // 不分類型串在一起
   for (nodeType in collectedTypedNodes) {
      collectedGraphNodes = collectedGraphNodes.concat(collectedTypedNodes[nodeType]);
   }
   let nodeTypesCount = Object.keys(collectedTypedNodes).length;
   
   // Note: [...Array(10).keys()] can create an array [0, 1, 2, ... 9]
   let bandNumberList = [...Array(nodeTypesCount).keys()];
   
   let nodeTypeNumMap = {};
   let entry = 0;
   for (nodeType in collectedTypedNodes) {
      nodeTypeNumMap[nodeType] = bandNumberList[entry++];
   }

   // ---------------------------------------------------------------------------------------------
   //  只有 "old" simulation（forceLink 只用到起始的 arrows 而非 getArrowPaths()）需以下擺放過程
   //  => "new" simulation （動態呼叫 getArrowPaths() 取得節點相連數據）應可省去以下擺放的過程
   // ---------------------------------------------------------------------------------------------
   let centerX = Math.floor(GlobalVar.svgWidth / 2) - 60;      // 2025-01-27: 往左一些...
   let centerY = Math.floor(GlobalVar.svgHeight / 2) + 60;     // 2024-12-19: 加上 60px offset（主要是 label 預設是放節點上方，因此 initY 稍微往下移）

   // 2025-02-24: 採取類似 k-means 的簡單方式：先隨機擺放 common nodes，然後將「尚未擺放」的 event nodes 放在 common nodes 附近
   // 2025-06-30: 移除其他 layout 選項
   let placedNodes = {};
   if (Array.isArray(collectedTypedNodes['C'])) {
      collectedTypedNodes['C'].forEach(function(commonNode) {
         let x = Math.floor(centerX + 0.40 * GlobalVar.svgWidth * (Math.random() - 0.5)) - 300;
         let y = Math.floor(centerY + 0.35 * GlobalVar.svgHeight * (Math.random() - 0.5)) + 60;
         graphNodeDict[commonNode].initX = x;
         graphNodeDict[commonNode].initY = y;
         placedNodes[commonNode] = 1;
         
         // 擺放相連的節點（通常是 event nodes）
         let connectedNodes = Object.keys(graphNodeDict[commonNode].nodeInfo);
         connectedNodes.forEach(function(graphNode) {
            if (!placedNodes[graphNode]) {
               let x = Math.floor(20 * (Math.random()));
               let y = Math.floor(20 * (Math.random()));
               if (graphNodeDict[commonNode].initX < GlobalVar.svgWidth / 2) x = -x;
               if (graphNodeDict[commonNode].initY < GlobalVar.svgHeight / 2) y = -y;
               graphNodeDict[graphNode].initX = graphNodeDict[commonNode].initX + x;
               graphNodeDict[graphNode].initY = graphNodeDict[commonNode].initY + y;
               placedNodes[graphNode] = 1;
            }
         });
      });
      
      // 再把 common nodes 設在 connectd nodes 的中間         
      collectedTypedNodes['C'].forEach(function(commonNode) {
         let connectedNodes = Object.keys(graphNodeDict[commonNode].nodeInfo);
         let xSum = 0, ySum =0;
         connectedNodes.forEach(function(graphNode) {
            xSum += graphNodeDict[graphNode].initX;
            ySum += graphNodeDict[graphNode].initY;
         });
         graphNodeDict[commonNode].initX = Math.floor(xSum / connectedNodes.length);
         graphNodeDict[commonNode].initY = Math.floor(ySum / connectedNodes.length);
      });
   }

   // 最後再隨機擺上「沒有連到 common nodes」的節點
   collectedGraphNodes.forEach(function(graphNode) {
      if (!placedNodes[graphNode]) {
         let x = Math.floor(centerX + 0.4 * GlobalVar.svgWidth * (Math.random() - 0.5));
         let y = Math.floor(centerY + 0.4 * GlobalVar.svgHeight * (Math.random() - 0.5));
         graphNodeDict[graphNode].initX = x;
         graphNodeDict[graphNode].initY = y;
      }
   });
   
   // ---------------------------------------------------------------------------------
   
   // 節點內容
   // => 這裡的處理流程因多此修補而頗混亂，後續應找機會清理
   //alert(graphNodes.length);
   graphNodes.forEach(function(graphNode, idx) {       // graphNode: E001, C005, etc.
      // 注意：每個要被顯示的 graphNode 最後會透過 graphData.push(d) 加入一個顯示節點
      let graphNodeData = GlobalVar.graphNodeDict[graphNode];
      
      let nodeTagName = graphNodeData.nodeTagName;                           // 2025-06-20 (bug fix): 先前竟然是寫成 graphNode.nodeTagName...
      let nodeType = graphNodeData.nodeType;                                 // 2024-08-20

      let nodeInfoEvents = graphNodeData.nodeInfo;                           // objects of "array of eventElement"
      let display = graphNodeData.display;
      let graphNodeLabel = graphNodeData.graphNodeLabel;
      let nodeContentStr = graphNodeData.nodeContentStr;                     // 2024-08-12
      let labelDisplay = graphNodeData.labelDisplay;       
      
      let nodeLegendCaption = graphNodeData.nodeLegendCaption;               // 2025-05-11
      
      let connFilenames = [];                                                // 後續可用於連回 search interface...

      // shape, color 都應該跟從 GlobalVar 的 eventGenreStyleMap, imageGenreStyleMap, binrelGenreStyleMap, commonGenreStyleMap 取得
      // 而不是透過 graphNodeData（從 tableData 轉 graphNodeDict 而得）
      let myStyle = null;
      if (nodeType == 'E') myStyle = GlobalVar.eventGenreStyleMap[nodeLegendCaption];
      else if (nodeType == 'M') myStyle = GlobalVar.imageGenreStyleMap[nodeLegendCaption];
      else if (nodeType == 'B') myStyle = GlobalVar.binrelGenreStyleMap[nodeLegendCaption];
      else if (nodeType == 'C') myStyle = GlobalVar.commonGenreStyleMap[nodeLegendCaption];     // 包含 'CX'
      else {
         alert("ERROR: unsupported nodeType '" + nodeType + "'");
         return;
      }
      
      // 2025-06-23: 防呆一下... （尤其 Binrel 部分沒有經過什麼測試，容易出錯）
      if (!myStyle || Object.keys(myStyle).length == 0) myStyle = GlobalVar.defaultGenericStyleMap;

      let nodeLabelColorClass = myStyle.nodeLabelColorClass;           // 2025-05-14
      let nodeColorIdx = myStyle.nodeColorIdx;                         // 2025-05-10, 2025-05-23 防呆
      let nodeShape = myStyle.nodeShape;                               // 2024-08-20
      
      // 2025-08-01: 預設藉由 GlobalVar.defaultGenericStyleMap 決定 pathColor，但現在可透過 tag 調整
      let pathColor = GlobalVar.tagDupLookup[nodeTagName]?.pathColor ?? myStyle.pathColor;
      //if (nodeTagName == 'Udef_Evt_TIME') pathColor = 'red';               // TEST

      let isEventNode = checkIfEventNode(nodeType);
      let colorIdx = nodeColorIdx.slice(-2);                                 // 2-digits 字串

      // 2025-05-10
      colorClass = "colorSetB" + nodeColorIdx;
      //alert(colorClass);
      
      // 2024-07-25: 將字串值轉為 boolean
      display = (display == 'true') ? true : false;
      if (!display) return;                                           // 注意：若 display 為 false 就會直接跳過
      
      labelDisplay = (labelDisplay == 'true') ? true : false;
      //alert(graphNode + "\n" + JSON.stringify(nodeInfoEvents));
      
      let dispEventHtmlRows = [];
      let graphNodeEventNumberDict = {};                              // 若 graphNode 不等於 evtNode，此 evtNode 就設為 1 （代表「繪製連線」）
      
      // -----------------------------------------------------------------------------
      // 以下處理需頗長 computation time...
      GlobalVar.temp.eventLines = 0;
      
      let firstDocFilename = 'UNDEF';                    // 後續以此文件檔名，透過 GlobalVar.immarkusDict 取得影像 url
      for (let evtNode in nodeInfoEvents) {              // nodeInfoEvents := GlobalVar.graphNodeDict[graphNode].nodeInfo
         let eventElements = nodeInfoEvents[evtNode];    // eventElements := GlobalVar.graphNodeDict[graphNode].nodeInfo[evtNode]

         //alert(evtNode + " => " + JSON.stringify(eventElements));
         // eventElements: [{"docFilename":"KangXiGaoYuXianXuZhi_JuanZhiBa_ChongXiuYinZiQiaoBeiJi.txt_markus_cor2",
         //                  "comarkusId": ...,
         //                  "type":"TIME",
         //                  "elementName":"Udef_Evt_TIME",          // tagName
         //                  "content":"BEGIN:庚戍春 (公元1610年:明神宗)",
         //                  "eNum":"E001",
         //                  "graphNodeLabel":"自訂的顯示標籤",
         //                  "eventTimeNotBefore":1610,
         //                  "eventTimeNotAfter":9999,
         //                  }, 
         //                  ... ]
         // 2024-06-04: 修正後的版本中，content 將包含原始標籤中的 type 屬性 (e.g., "BEGIN")
         
         if (graphNode.startsWith('CX')) continue;                   // 2025-06-18: 略去 'CX' 開頭的特殊節點...（其實應該不需在 loop 內判斷）
         if (eventElements.length == 0) continue;                    // 沒有內容（直接跳過）
         firstDocFilename = eventElements[0].docFilename;            // 2024-06-28
         
         // 若 graphNode 不等於 evtNode，就「繪製連線」（注意，在此可能需假設每個 evtNode 都會出現在 graphNode 中）
         // 2025-09-21: 將 SharedPart 的計數以 weight 屬性加入 graphNodeEventNumberDict[evtNode]
         if (graphNode != evtNode) {           // graphNode 應為一個 feature node
            // graphNode 為 C-node (包含 CX-nodes) -- 計算 evtNode 的 link weight
            // 對 'M'-node 而言，目標是計算 SharedPart (FeatureType) count，是否就是 eventElements.length 還要再確認...
            // 2025-12-24: 發現 eventElements 並沒對應到 shapes，而是對應到 entities！一個 shape 可能包含多份 entities
            //             但 Dawn 的信上是說，連線顯示 image has n annotations (entities)，因此 linkWeight 用 eventElements.length 是對的
            let linkWeight = GlobalVar.tagsForFileStructure.includes(eventElements[0].elementName)
                           ? 1
                           : eventElements.length;
            graphNodeEventNumberDict[evtNode] = linkWeight;
         }
         else {
            // graphNode == evtNode，graphNode 必為事件節點
            // 取得 event node 需呈現的內容資訊
            // 2025-12-10: image node 頗耗時 -- 嘗試改採點擊後動態計算？
            //             但動態載入圖檔，後續需載入後才能計算 ViewBox 大小，相當麻煩...
            //             先載入圖檔，其他資訊後續再說？
            let eventElementsHtml = '[DYN_ImageInfo]';        // 後續會偵測這內容來動態呼叫 getEventElementsHtml()
            if (graphNode.startsWith('M')) {
               let imageUrl = GlobalVar.immarkusDict[firstDocFilename].imageUrl;
               getImageSize(imageUrl, function(size) {
                  // 注意，<graphNode> 所對應的 imageKey 是 immarkus_<graphNode>
                  if (size) {    // 若 imageUrl 無法正確取得 image，會回傳 null，
                     let s = '0 0 ' + size.width + ' ' + size.height;
                     let imageKey = 'immarkus_' + graphNode;
                     GlobalVar.imageContainerViewBox[imageKey] = s;
                  }
               });
            }
            else {
               eventElementsHtml = getEventElementsHtml(graphNode, colorIdx, true);
            }
            dispEventHtmlRows.push(eventElementsHtml);
         }
      }
      //alert(JSON.stringify(dispEventHtmlRows));

      // 2025-12-12: 計算 common node 內容
      if (graphNode.startsWith('C')) {
         dispEventHtmlRows = getCommonNodeContentHtmlRows(graphNode, connFilenames);
      }

      let html = dispEventHtmlRows.join("\n");
      //console.log(html);
      
      // 2025-07-05, 2025-08-14 改用 <table>
      let graphDataIdx = graphData.length;                     // 需透過 graphData[graphDataIdx] 取得 node 的物件參考 
      
      let actionBar = `<div class='dragHandle' graphDataIdx='${graphDataIdx}'>`
                    + "<table width='100%' cellpadding='0' cellspacing='0'>"
                    + "<tr>"
                    + "<td align='left'>"
                    + `<span class='resizeNode' title='click to enable box resizing' graphDataIdx='${graphDataIdx}'><i class='fa-solid fa-up-right-and-down-left-from-center'></i></span>`
                    + "</td>"
                    + "<td align='center'>"
                    + graphNode
                    + "</td>"
                    + "<td align='right'>"
                    + `<span class='closeNode' title='click to close box' graphDataIdx='${graphDataIdx}'><i class='fas fa-window-close'></i></span>`
                    + "</td></tr>"
                    + "</table>"
                    + "</div>";
   
      if (GlobalVar.disallowNodeExpansion) actionBar = '';

      // 2025-05-28: 'E' node 在事件列表後，補上事件的原文...
      if (nodeType == 'E') {
         // graphNodeData.nodeInfo[graphNode] 是一個關於 event elements 的 data array
         let docFilename = graphNodeData.nodeInfo[graphNode][0].docFilename;         // 取出第一項的檔名
         let docTitle = graphNodeData.nodeInfo[graphNode][0].docTitle;               // 2025-09-28
         let jqDoc = GlobalVar.docFilenameJqDoc[docFilename];
         let jqClone = jqDoc.clone();
         jqClone.find("Events,Comment").remove();
         let jqDocContent = jqClone.find("doc_content");
         
         // 2025-05-31
         let connectedEntities = GlobalVar.temp.eventNodeConnectedEntities[graphNode];
         if (GlobalVar.nodeFulltextHighlightTerms && connectedEntities !== undefined) {         // 2025-06-03: 僅當 GlobalVar.nodeFulltextHighlightTerms 為 true 才進行
            // 有連接的 common nodes，報告該 nodes 所連接到的節點型態和 element value, e.g., [{"type":"EVENT","content":"RENOVATION/reconstruct/復"}]
            connectedEntities.forEach(function(entityInfo) {
               let parts = entityInfo.content.split('/');
               let term = parts.pop();                   // 要對回 annotated tags 的過程其實頗為複雜（甚至有時也還是對不回去），這裡為了簡化就只取出文字部分來比對（代價是提高錯標的機率...）
               jqDocContent.find("*").each(function() {
                  if ($(this).text() == term) $(this).addClass("highlight");
               });
            });
         }
         
         html += "<div id='EventText_" + graphNode + "' class='eventContentXml'>"    // e.g., id 'EventText_E001'，方便 common node 從中進行 text highlighting
               + jqDocContent.html()
               + "</div>";
      }

      // 2025-09-22: 加上 graphDataIdx 方便取得該資訊來隱藏 nodeContentArea，加上 docFilenames 可連回 search interface
      // 2025-12-10: 加上 graphNode 方便辨識此節點
      let docFilenames = connFilenames.join('|');
      html = `<div class='nodeEventHtml' graphNode='${graphNode}' graphDataIdx='${graphDataIdx}' docFilenames='${docFilenames}'>`
             + actionBar
             + html
             + "</div>\n";
      
      //console.log(Object.keys(graphNodeEventNumberDict));
      totalLinks += Object.keys(graphNodeEventNumberDict).length;
      
      let w = (isEventNode) ? 320 : 240;
      let h = Math.min(42 + GlobalVar.temp.eventLines * 28, 240);
      
      //alert(graphNode + "\n" + JSON.stringify(graphNodeEventNumberDict));
      
      // 2025-06-20: 新增的 common node 'CX01' 之類，linkToGroups 需客製化計算
      let linkToGroups = graphNodeEventNumberDict;  
      if (graphNode.startsWith('CX')) {
         // 一般節點：若 graphNode 為 event node，則此值為 {}。
         //           若 graphNode 為 C-node X，則 {'E001':1, 'E003':5} 表示 X 連到 'E001' (link weight 1), 'E003' (link weight 5) 這兩個 event nodes
         // 注意：linkToGroups['C018'] = 1，這個 1 就是 weight 資訊
         // TODO: 需加入節點內容？
         linkToGroups = graphNodeData.nodeInfo;                  // 'CX' 節點的 nodeInfo 結構與一般 C-node 結構不同
         //alert(graphNode + "\n" + html + "\n" + JSON.stringify(linkToGroups));
      }
      //alert(graphNode + "\n" + JSON.stringify(linkToGroups));      
      
      let d = { id: graphNode,                                   // 2024-05-24
                nodeType,
                nodeShape,                                       // 2025-05-11
                pathColor,                                       // 2025-08-01: 與此點相連 path 的顏色
                graphDataIdx,                                    // 2024-05-24: 此節點對應到變數 graphData 的索引
                linkToGroups,                                    // 2024-05-25: 若 graphNode 為 event node，則此值為 {}。若 graphNode 為 C-node X，則 {'E001':w1, 'E003':w2} 表示 X 連到 'E001', 'E003' 這兩個 event nodes (w1, w2 為 SharedPart weight)
                x: graphNodeData.initX,                          // 2024-09-30
                y: graphNodeData.initY,                          // 2024-09-30
                rectWidth: w,
                rectHeight: h,
                key: "row" + idx,
                html: html,
                colorClass,
                nodeLegendCaption,                               // 2025-05-11
                nodeLabelColorClass,                             // 2025-05-14
                nodeColorIdx,                                    // 2025-05-10
                graphNodeLabel,                                  // 2024-07-26
                nodeContentStr,                                  // 2024-08-12
                nodeTagName,                                     // 2025-01-23
                labelDisplay: labelDisplay,                      // 2024-07-16
              };
      
      //console.log(d);
      //alert(JSON.stringify(d));

      // 2025-10-21: 若所有 CX 節點沒有連結到任何 C 節點，就不加入 graphData（總是不顯示！）
      if (graphNode.startsWith('CX') && !GlobalVar.temp.cxNodeConnected) ;
      else graphData.push(d);
   });     // graphNodes.forEach()
   
   // 2025-08-22
   return graphData;   
}          // computeGraphData()

   // ----------------------------------------------------------------------
   
   function calculatePolyPoints(shape, center, size, angle = 0) {
      // 2025-07-10
      switch (shape) {
      case 'triangle':
         return calculateTrianglePoints(center, size, 0);
      case 'diamond':
         return calculateDiamondPoints(center, size);
      case 'triangle-down':
         return calculateTrianglePoints(center, size, Math.PI);
      default:
         alert("ERROR: unknown shape " + shape);
      }
   }

   //// 計算正三角形的頂點座標
   //function calculateTrianglePoints(center, size) {
   //   const cx = parseFloat(center[0]);               // 防呆：避免 center[0] 是字串
   //   const cy = parseFloat(center[1]);
   //   const halfSize = parseFloat(size) / 2;
   //   const topPoint = [cx, cy - halfSize];
   //   const leftPoint = [cx - halfSize * Math.sqrt(3) / 2, cy + halfSize / 2];
   //   const rightPoint = [cx + halfSize * Math.sqrt(3) / 2, cy + halfSize / 2];
   //   return `${topPoint.join(",")} ${leftPoint.join(",")} ${rightPoint.join(",")}`;
   //}

   function calculateTrianglePoints(center, size, angle = 0) {
      const cx = parseFloat(center[0]);
      const cy = parseFloat(center[1]);
      const halfSize = parseFloat(size) / 2;
      
      // 原始（未旋轉）的三個頂點座標
      const topPoint = [cx, cy - halfSize];
      const leftPoint = [cx - halfSize * Math.sqrt(3) / 2, cy + halfSize / 2];
      const rightPoint = [cx + halfSize * Math.sqrt(3) / 2, cy + halfSize / 2];
      
      // 將角度轉為弧度
      const rad = angle * Math.PI / 180;
      
      // 定義旋轉函式：繞中心 (cx, cy) 旋轉 angle
      function rotate([x, y]) {
         const dx = x - cx;
         const dy = y - cy;
         const xRot = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
         const yRot = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
         return [xRot, yRot];
      }
      
      // 旋轉每個頂點
      const top = rotate(topPoint);
      const left = rotate(leftPoint);
      const right = rotate(rightPoint);
      
      return `${top.join(",")} ${left.join(",")} ${right.join(",")}`;
   }

   
   // 繪製菱形 (by ChatGPT)
   function calculateDiamondPoints(center, size) {
      const cx = parseFloat(center[0]);               // 防呆：避免 center[0] 是字串
      const cy = parseFloat(center[1]);
      const halfSize = parseFloat(size) / 2;
      const top = [cx, cy - halfSize];
      const right = [cx + halfSize, cy];
      const bottom = [cx, cy + halfSize];
      const left = [cx - halfSize, cy];
      return `${top.join(",")} ${right.join(",")} ${bottom.join(",")} ${left.join(",")}`;
   }
   
   // 繪製星形 (by ChatGPT)
   function calculateStarPoints(center, outerRadius, innerRadius, numPoints = 5) {
      const cx = parseFloat(center[0]);               // 防呆：避免 center[0] 是字串
      const cy = parseFloat(center[1]);
      const step = Math.PI / numPoints;
      let points = [];
      
      for (let i = 0; i < 2 * numPoints; i++) {
         const angle = i * step - Math.PI / 2;
         const r = i % 2 === 0 ? outerRadius : innerRadius;
         const x = cx + r * Math.cos(angle);
         const y = cy + r * Math.sin(angle);
         points.push(`${x},${y}`);
      }
      
      return points.join(" ");
   }

   function getArrowPaths() {            // 回傳 {path, source, target, type}（代表 source, target 兩點間的連線）陣列
      let graphData = GlobalVar.temp.graphData;       // 從全域變數取得完整 graphData 參考（原先是直接用 drawGraph() 函式內的變數）
      
      //alert(JSON.stringify(graphData));
      let paths = [];
      graphData.forEach(source => {
         // source := {id, nodeType, nodeShape, pathColor,
         //            graphDataIdx, linkToGroups, x, y, rectWidth, rectHeight, 
         //            html, colorClass, graphNodeLabel, nodeContentStr, nodeTagName
         //            labelDisplay }
         let [neighborNodeIds, neighborPaths] = getNeighborPathsFromSource(source);
         paths = paths.concat(neighborPaths);
      });
      return paths;
   }
   
   function getNeighborPathsFromSource(source) {
      // source := {id, nodeType, nodeShape, pathColor,
      //            graphDataIdx, linkToGroups, x, y, rectWidth, rectHeight, 
      //            html, colorClass, graphNodeLabel, nodeContentStr, nodeTagName
      //            labelDisplay }
      let neighborNodeIds = [];         // ['E011', 'C003', 'C005'], etc. （不是繪圖節點的 id f_E011, t_E011, c_E011, etc.）
      let neighborPaths = [];
      GlobalVar.temp.graphData.forEach(target => {
         // 'CX' 出現在 target.id（而非 source.id）
         let type = 'solid';                          // 'dashed'
         // 計算兩節點的路徑（繪製連線）
         if (source.id === target.id) return;         // 自己到自己，不加上連線

         // 2024-08-12: 加上「允許同類型 events 之間也有連線」
         //             若 node label of A 是 node content of B 的子字串，就在 A-B 間加上連線（注意 '|' 為 sub-contents delimiter）
         // 2025-06-20: 由於 event node 標籤可變化，允許 C-node 連到 C-node 會比較直觀
         let linkDueToLabelContentComp = false;
         if (GlobalVar.enableFeatureLinks) {
            let sourceType = source.id.substr(0,1);     // 'E', 'M', 'B', 'C' ('CX' 也視為 'C')
            let targetType = target.id.substr(0,1);     // 'E', 'M', 'B', 'C' ('CX' 也視為 'C')
            let passTypeCheck = (sourceType == targetType && (['C'].includes(sourceType)));
            let sourceLabelInTargetContent = target.nodeContentStr.includes('|' + source.graphNodeLabel + '|');
            //let targetLabelInSourceContent = source.nodeContentStr.includes('|' + target.graphNodeLabel + '|');
            linkDueToLabelContentComp = (passTypeCheck && sourceLabelInTargetContent);
         }

         // 2025-06-21: Dawn 說 'Udef_Evt_EVENT' 歸屬一般 Feature，以實線和 event 相連
         // 2025-06-22: IMMARKUS 的 'Udef_Genre_Subfolder' 也類似
         // 但是需注意：不能加上 Udef_Align_OBJECT -- 否則 image 和 Udef_Align_OBJECT 之間將通通變虛線
         // TODO: dashedNodeTagNames 移到 GlobalVar 進行全域設定
         // 2025-09-23: 原先只測試 target.linkToGroups[source.id]，需補上 source.linkToGroups[target.id] （否則 source 若為 'C' node 將無法通過檢測而取得空的 neighborPaths）
         let dashedNodeTagNames = GlobalVar.tagsForFileStructure;     // source structure 節點也是用 dashed
         if (source.linkToGroups[target.id] || target.linkToGroups[source.id] || linkDueToLabelContentComp) {
            if (dashedNodeTagNames.includes(source.nodeTagName) ||
                dashedNodeTagNames.includes(target.nodeTagName) ||
                source.id.startsWith('CX') || 
                target.id.startsWith('CX')) type = 'dashed';    // 2025-06-20

            neighborNodeIds.push(target.id);      // 2025-09-30
                
            // 2025-09-25: 加上 edge weight...
            const weight = target.linkToGroups[source.id] || source.linkToGroups[target.id];    // 2025-09-24: 加上 source.linkToGroups[target.id]
            
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) + 1;
            const angle = Math.atan2(dy, dx);
            
            const isSourceSquare = (source.nodeShape == 'square');
            const isTargetSquare = (target.nodeShape == 'square');

            // 2025-07-08: square 狀況下，似乎應跟著 nodSize 調整（而不是固定 2px）？
            const sourceRadius = GlobalVar.nodeSizeRadius + 4 + (isSourceSquare ? 2 : 0);
            const targetRadius = GlobalVar.nodeSizeRadius + 4 + (isTargetSquare ? 2 : 0);

            let sourceX = source.x + sourceRadius * Math.cos(angle);
            let sourceY = source.y + sourceRadius * Math.sin(angle);
            
            let targetX = target.x - targetRadius * Math.cos(angle);
            let targetY = target.y - targetRadius * Math.sin(angle);
            
            // 2025-07-08: 目前似乎只有方形需額外校正（圓形和三角形都不需）...
            if (isSourceSquare) {
               sourceX += 3;            
               sourceY += 3;
            }
            if (isTargetSquare) {
               targetX += 3;
               targetY += 3;
            }
            
            const path = GlobalVar.drawNodeLinkAsArc
                       ? `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`
                       : `M${sourceX},${sourceY} L${targetX},${targetY}`;

            // 2025-08-01                          
            let pathColor = target.pathColor || source.pathColor;             // 以 target 優先？
            
            // 2025-11-03: 加上 pathClass 與對應顏色
            let pathClass = 'normalLink';
            let flaggedNodeList = GlobalVar.temp.flaggedNodeList.slice();     // shallow copy
            //flaggedNodeList.push('E001');
            if (flaggedNodeList.includes(source.id) || flaggedNodeList.includes(target.id)) {
               //pathColor = GRAPH_COLORS.starLink;
               pathClass = 'starLink';
            }
            
            //if (target.id.startsWith('M') || source.id.startsWith('M')) {
            //   console.log(source.id + ':' + target.id + ' -- ' + type); 
            //}
            let pathId = 'path_' + source.id + '_' + target.id;     // 2025-11-09
            let pathObj = { path, pathId, source, target, type, pathColor, pathClass, weight };
            neighborPaths.push(pathObj);
         }
      });

      neighborNodeIds.unshift(source.id);
      return [neighborNodeIds, neighborPaths];
   }
   
   // 2025-09-24
   function getNeighborPathsFromNodeId(nodeId) {
      //alert(nodeId);
      // 從 GlobalVar.temp.GraphData 中，找出 nodeId 對應值作為 source，然後呼叫 getNeighborPathsFromSource() 取得相鄰的連線
      // GlobalVar.temp.graphDataIdxLinks 是個陣列，其每個元素的值為相連的節點 index 與連線權重 {"nodeIdx":n,"weight":m}
      let isEventNode = checkIfEventNode(nodeId);

      // 必須是 event node 才能用以下方式得到 neighborPaths?
      let neighborNodeIds = [];
      let neighborPaths = [];
      let source = null;
      let graphDataIdxList = Object.keys(GlobalVar.temp.graphDataIdxLinks);
      //alert(JSON.stringify(graphDataIdxList));
      graphDataIdxList.forEach(function(graphDataIdx) {
         let obj = GlobalVar.temp.graphData[graphDataIdx];
         //alert(graphDataIdx + "\n" + JSON.stringify(obj));
         if (nodeId === obj.id) {
            source = GlobalVar.temp.graphData[graphDataIdx];
            //alert(obj.id + "\n" + JSON.stringify(source));
         }
      });

      if (source) {
         [neighborNodeIds, neighborPaths] = getNeighborPathsFromSource(source);
         //alert(JSON.stringify(neighborPaths));
      }
      //console.log("neighborPaths: ", neighborPaths);
      return [neighborNodeIds, neighborPaths];
   }

// -----------------------------------------------------------------------------------

function setImageViewBox(dom) {
   let imageKey = $(dom).attr("key");        // 2025-09-24: 從 prop("id") 改為 attr("key")（<image> 可能重覆）
   let svgContainer = $(dom).parent().get(0);
   
   // 沒辦法直接透過 getBBox() 取得物件大小... 所以額外做以下處理
   // 創建一個新的Image物件
   var img = new Image();
   
   // 利用 dom 的 xlink:href 設定圖片的來源
   img.src = $(dom).attr("xlink:href");

   // 監聽image載入完成後的事件
   img.onload = function() {
      // 載入完成後，取得原始尺寸（圖片的原始寬度和高度）
      let imageWidth = img.naturalWidth;
      let imageHeight = img.naturalHeight;
      // 設置 SVG 的 viewBox 屬性
      let s = '0 0 ' + imageWidth + ' ' + imageHeight;
      console.log(imageKey + ' size:' + s);
      svgContainer.setAttribute('viewBox', s);
      
      // 若 GlobalVar.disallowNodeExpansion 為 false，那麼在內容區塊直接套用 param.html 是不行的，
      // 因為其 viewBox 並未被更新... 在此將 imageKey 的 viewBox 直接儲存在全域變數，以供後續使用
      GlobalVar.imageContainerViewBox[imageKey] = s;
   };
}

function getImageSize(url, callback) {
  const img = new Image();

  img.onload = function () {
    callback({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };

  img.onerror = function () {
    callback(null);   // or handle error
  };

  img.src = url;
}

