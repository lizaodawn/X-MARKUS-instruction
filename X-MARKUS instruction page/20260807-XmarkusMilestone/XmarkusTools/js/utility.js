// String.prototype.replaceAll = function(search, replacement) {
//     let target = this;
//     return target.replace(new RegExp(search, 'g'), replacement)
// }
String.prototype.escape = function() {
    var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return this.replace(/[&<>]/g, function(tag) {
        return tagsToReplace[tag] || tag;
    });
};

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

if( !String.isString ){
    String.isString = function(val) {
        return typeof val === 'string' || ((!!val && typeof val === 'object') && Object.prototype.toString.call(val) === '[object String]');
    }
}


var appendAllChildren = function( nodeString, nodeTo ) {
   // 2025-05-26: 若有時還是會遇到報錯（不知是在 M2D 哪段程式在文字轉碼時沒處理好？），只好在此再「重覆」移除不合法字元...
   // 2025-07-10: 移除以下取代（會將 "潘「金越」" 取代成 "潘??" -- 超過 U+FFFF 的 Unicode 字元）
   //             ChatGPT: 應避免直接用 /[\uD800-\uDFFF]/ 替換 surrogate 區段
   nodeString = nodeString.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF]))|(?:[^\uD800-\uDBFF][\uDC00-\uDFFF])/gu, '?');

   if (nodeTo === undefined) alert("utility.js nodeTo undefined!");    // 2024-06-30: for debugging
   var parser = new DOMParser();
   var xmlTemp = parser.parseFromString("<append>" + nodeString + "</append>", "text/xml");
   //console.log( (new XMLSerializer()).serializeToString(xmlTemp) );
   var nodeFrom = xmlTemp.getElementsByTagName("append")[0];
   if (!nodeFrom) {
      //saveFile("test.xml", nodeString);
      alert("M2D: ERROR on appendAllChildren()\n" + saveXml(xmlTemp));   
   }
   if( nodeFrom.getElementsByTagName("refID")[0] !== undefined ){
       var id = xmlTemp.createAttribute("refID");
       id.value = nodeFrom.getElementsByTagName("refID")[0].textContent;
       nodeFrom.childNodes[0].setAttributeNode(id);
       nodeFrom.childNodes[0].removeChild(nodeFrom.getElementsByTagName("refID")[0]);
   }
   
   while( nodeFrom.hasChildNodes() ){
       nodeTo.appendChild(nodeFrom.removeChild(nodeFrom.firstChild));
   }
};

var appendRelationsData = function(eventsBuilder, xmlDoc) {
   // 2020-11-06: 「有點辛苦」地將 relations_data 貼到「適當的」標籤上...
   var positionToRelationsData = eventsBuilder.getPositionToRelationsData();
   //alert("utility.js => " + JSON.stringify(positionToRelationsData));
   let passageNodes = xmlDoc.getElementsByClassName('passage');
   for (var sourceTagRelDataId in positionToRelationsData) {
      let relation = positionToRelationsData[sourceTagRelDataId];
      for (let passageNode of passageNodes) {
         //alert(passageNode.outerHTML);
         // 2020-11-08: querySelector() 會回傳「第一筆」符合的資料，因此我們其實背後假設「at most one tag matches the condition」
         //             原先是取名 MarkusTagRelDataId，但因為複雜的關聯本來就不適合放在單一標籤內，將 relations 提取到標籤外
         //             的 <Event> 是「通用的方式」，因此改名為 TagRelDataId
         //alert(relation.id);
         let node = passageNode.querySelector('[TagRelDataId="' + relation.id + '"]');
         if (node === null) alert("Fail to find the tag with TagRelDataId: " + relation.id);    // should be at most one tag
         else {
            // 將 relation 轉成 xml 加入 xmlDoc
            //alert(node.outerHTML);
            let relationsData = btoa(JSON.stringify(relation));
            try {
               node.setAttribute('relations_data', relationsData);
               //alert("=> " + sourceTagRelDataId + "\n" + node.outerHTML);
            } catch (e) {
               alert("錯誤：未能放回關係資料！ sourceTagRelDataId=" + sourceTagRelDataId)
            }
         }
      }  // for (let passageNode of passageNodes) 
   }     // for (var sourceTagRelDataId in positionToRelationsData)
};


var createXMLDocumentFromNode = function( node ){
   //return (new DOMParser()).parseFromString( (new XMLSerializer()).serializeToString(node), "text/xml");
   return loadXml(saveXml(node));
}

Date.prototype.yyyymmdd = function() {  // Tu: copied from Web
  var mm = this.getMonth() + 1;         // getMonth() is zero-based
  var dd = this.getDate();
  return this.getFullYear() + ('0'+mm).substr(-2) + ('0'+dd).substr(-2);  // padding
}

var loadXml = function(xml) {          // Tu
   return (new DOMParser()).parseFromString(xml, "text/xml");
}

var saveXml = function(xmlNode) {      // Tu
   return (new XMLSerializer()).serializeToString(xmlNode);
}

var toXml = function(v, name, ind) {
    var xml = "";
    if (v instanceof Array) {
        for (var i=0, n=v.length; i<n; i++)
            xml += ind + toXml(v[i], name, ind+"\t") + "\n";
    }
    else if (typeof(v) == "object") {
        var hasChild = false;
        xml += ind + "<" + name;
        for (var m in v) {
            if (m.charAt(0) == "@")
            xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
            else
            hasChild = true;
        }
        xml += hasChild ? ">" : "/>";
        if (hasChild) {
            for (var m in v) {
            if (m == "#text")
                continue
                //xml += v[m];
            else if (m == "#cdata")
                xml += "<![CDATA[" + v[m] + "]]>";
            else if (m.charAt(0) != "@")
                xml += toXml(v[m], m, ind+"\t");
            }
            xml += (xml.charAt(xml.length-1)=="\n"?ind:"") + "</" + name + ">";
        }
    }
    else {
        xml += ind + "<" + name + ">" + v.toString() +  "</" + name + ">";
    }
    return xml;
}

var pad = function(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// 2020-11-25: 為了處理 UTF-8 所未包含的罕見字，需讓 xml 開頭指定 encoding 為 ISO-10646-UCS-4
var getDomFromXml = function(xml) {
   let parser = new DOMParser();
   if (xml.substr(0,5) !== "<?xml") xml = '<?xml version="1.0" encoding="ISO-10646-UCS-4"?>' + xml;
   return parser.parseFromString(xml, "text/xml");
};