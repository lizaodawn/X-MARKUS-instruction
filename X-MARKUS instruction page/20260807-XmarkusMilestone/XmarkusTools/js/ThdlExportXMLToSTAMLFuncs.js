//var GvarThdlExport = { featureAnalysisTags: [],
//                       personNameTagIdAsFeature: true,         // cbdbid
//                       placeNameTagIdAsFeature: true,          // placename_id
//                       datetimeTagIdAsFeature: true,
//                       udefTagIdAsFeature: true,
//                     };          

var ThdlExportXMLToSTAMLFuncs = (function(){
   var me = this;
   //GvarThdlExport['featureAnalysisTags'] = [];
   
   var termEscape = function(t) {             // 20170412
      t = t.replace(/[\|]/g, ',').replace(/[\(\)]/g,'');            // .replace(/[:]/g,'_');
      //if (t.length > 61) t = t.substr(0,61) + '...';              // Markus... #(nnnnn); 
      return t;
   }
 
   var sectionDividerTable = {
      chapter: false,
		section: "//Paragraph"
	}

   // 2017-01-19: tagTable... ThdlExportXml... object model... generateTag()!
	var tagTable = [
		{ type: "PersonName", xpath: "//PersonName" },
		{ type: "LocName", xpath: "//LocName" },
      { type: "datetime", xpath: "//Date"},
      { type: "thing", subtype: "specific", xpath: "//SpecificTerm"},
      //{ type: "pageBreak", xpath: "//Pb"},       // 2018-05-05
      //{ type: "lineBreak", xpath: "//Lb"},       // 2018-05-05
      { type: "drugname", xpath: "//DrugName"},
      { type: "recipe", xpath: "//Recipe"},
      //{ type: "udef_h", xpath: "//Udef_h"},
      { type: "MetaTags", xpath: "//MetaTags"}, // 2019-08-26 Wayne: Supported MetaTags
      { type: "Events", xpath: "//Events"}
  ];

  var tagTable = [];
  var tagIgnore = [];
  
  var XMLtoObject = function(xmlNode){
		if( xmlNode.childNodes.length === 1 && xmlNode.firstChild.nodeType === 3 ){
			return xmlNode.firstChild.nodeValue.escape();
		}
    
    if( xmlNode.nodeType === 3 ){
      return xmlNode.nodeValue;
    }
		var object = [];
    var isArray = false;
    var childNodes = xmlNode.childNodes;
		for( var i = 0 ; i < childNodes.length ; ++i ){
			if( childNodes[i].nodeType === 3 ){
        isArray = true;
        object.push(childNodes[i].nodeValue);
      } else if(childNodes[i].nodeName === 'tag'){  // metadata: user defined tag
        var obj = {}
        obj[childNodes[i].innerHTML] = XMLtoObject( childNodes[i] )
        object.push(obj)
      }
      else{
        var obj = {};
        obj[childNodes[i].nodeName] = XMLtoObject( childNodes[i] );
        object.push(obj);
      }
    }
    var attr = xmlNode.attributes;
    for( var i = 0 ; i < attr.length ; ++i ){
      var obj = {};
      obj[attr[i].nodeName] = attr[i].nodeValue;
      object.push(obj);
    }

		if( !isArray ){
      var realObj = {};
      for( var i = 0 ; i < object.length ; ++i ){
        for( var j in object[i] ){
          realObj[j] = object[i][j];
        }
      }
      object = realObj;
    }
		return object;
	}
	
   function appendCustomizedTags(customizedTags) {        // Tu
      //{ type: "Udef_h", xpath: "//Udef_h"},
	   var tagHash = {};
	   for (var i=0; i<tagTable.length; i++) {
	      tagHash[tagTable[i].type] = 1;
	   }

      for (var i=0; i<customizedTags.length; i++) {    // Markus html <span type="xxx"> to <Udef_xxx> 
         var tag = customizedTags[i];
	      if (!tagHash[tag]) {
	         var tagType = tag;                         // ThdlExportXml ... Udef_<tag>
	         var xpath = "//" + tagType;
	         var entry = { type: tagType,
	                       xpath: xpath
	                     };
            tagTable.push(entry);
            tagHash[tag] = 1;
         }
     }
	   //alert(JSON.stringify(tagTable));
	}
  function isRecursiveNode( node ){
    const childNodes = node.childNodes
    const firstChild = node.firstChild

    if (firstChild == null) return false
    if (node.nodeName == "MetaTags") {
      return false
    } else if (node.nodeName == "Events") {
      return false
    } else if (childNodes.length > 1) {
      return true
    } else if (firstChild.nodeName !== '#text') {
      return true
    } else if (node.nodeName === 'MarkusDiv') {
      return true
    } else {
      return false
    }
  }
  function flattenRecursiveNode( nodes ){
    const result = []
    nodes.forEach( function(currentValue){
      if ( isRecursiveNode(currentValue) ){
        const recursiveNode = flattenRecursiveNode(currentValue.childNodes)
        recursiveNode.forEach(function(currentValue) {
          result.push(currentValue)
        })
      } else {
        result.push(currentValue)
      }
    })
    return result
  } 

  var tagTransformer = function( context ){
      var content = [];
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(context, "text/xml");
      const nodes = flattenRecursiveNode(xmlDoc.firstChild.childNodes);

      // 2018/01/19 begining transformation
      for (let i in nodes) {
        let node = nodes[i]
        if( node.nodeType == 3 && node.nodeValue.trim().replace(/^\s+|\s+$/g, '') !== "" ) {
          // pure text
          content.push( nodes[i].nodeValue );
				} else if (node.nodeType == 1) {
          node = createXMLDocumentFromNode(node)
          let ignore = false;
          
          // filter the tag
          for (let j in tagIgnore) {
						if( node.evaluate(tagIgnore[j], node, null, XPathResult.ANY_TYPE, null).iterateNext() ){
							ignore = true;
							break;
						}
          }
          if(!ignore) {
            content.push(recursiveXML(node))
          }
        } else {
        }
      }
      return content;
  };
  
   var recursiveXML = function(node) {
      if (node.firstChild.nodeName == "MetaTags") { // 2019-08-26 Wayne: For MetaTag
        var metatags = { type: "MetaTags",  content: []};
        for ( var i = 0; i < tagTable.length; i++ ){
          var tags = node.evaluate('/MetaTags' + tagTable[i].xpath, node.firstChild, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
          var tag;
          while (tag = tags.iterateNext() ){
            var now = { type: tagTable[i].type, content: tag.textContent };
            for (var attribute of Object.values(tag.attributes)) {
              now[attribute.name] = attribute.value;
            }
            metatags['content'].push(now)
          }
        }
        return metatags;
      } 
      else if (node.firstChild.nodeName == "Events") {
        var events = { type: "Events", content: []};
        var tags = node.evaluate('/Events//Event', node.firstChild, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
        var tag;
        while (tag = tags.iterateNext() ){
          var now = { type: 'Event', content:  tag.textContent};
          if (tag.hasAttribute('SourceTagRelDataId')) {
            now['SourceTagRelDataId'] = tag.getAttribute('SourceTagRelDataId');
            now['sourceId'] = tag.getElementsByTagName('RelSource')[0].getAttribute('MarkusRelId');   // 2019-12-15: 'Source' => 'RelSource'
            now['relType'] = tag.getElementsByTagName('BinRel')[0].getAttribute('Type');              // 2019-12-15: 'type' => 'Type'
            now['relMeta'] = tag.getElementsByTagName('BinRel')[0].getAttribute('Meta');              // 2019-12-15: 'meta' => 'Meta'
            if (tag.getElementsByTagName('RelTarget').length > 0) {                                   // 2019-12-15: 'Target' => 'RelTarget'
               // 2020-11-15: RelTarget 沒有存放 @MarkusRelId，需取它的子節點（例如 <Udef_Commodities> 或 <PersonName>）才會有 @TagRelDataId
               let targetNode = tag.getElementsByTagName('RelTarget')[0];
               if (targetNode.children.length >= 1) {
                  now['targetId'] = targetNode.children[0].getAttribute('TagRelDataId');
                  //alert(JSON.stringify(now));
               }
               else {
                  alert("Cannot find TagRelDataId from RelTarget node:\n" + tag.outerHTML);
               }
            }
          }
          events['content'].push(now);
        }
        return events
      } 
      else {
         var content = {};
         var last = content;
         var now = content;
         for( var i = 0 ; i < tagTable.length ; i++ ){
             // document.evaluate( xpathExpression, contextNode, namespaceResolver, resultType, result );
            var tags = node.evaluate( tagTable[i].xpath, node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
            var tag;
            while( tag = tags.iterateNext() ){
              now.type = tagTable[i].type;
              if( tagTable[i].subtype ){
                now.subtype = tagTable[i].subtype;
              }
              if( tagTable[i].userdata ){
                now.userdata = (new XMLTableToJSON(tagTable[i].userdata))((new XMLSerializer()).serializeToString(tag) );
                if( Object.keys(now.userdata).length === 0 ){
                  now.userdata = undefined;
                  delete now.userdata;
                }
              }
              if( tagTable[i].linkdata ){
                now.linkdata = (new XMLTableToJSON(tagTable[i].linkdata))((new XMLSerializer()).serializeToString(tag) );
                if( Object.keys(now.linkdata).length === 0 ){
                  now.linkdata = undefined;
                  delete now.linkdata;
                }
              }
               //2018-01-24
               let attributes = tag.attributes;
               for (let i = 0; i < attributes.length; i++) {
                 let name = attributes[i].name
                 let value = attributes[i].value
                 now[name] = value
               }
               last = now;
               now.content = {};
               now = now.content;
               now = {}
            }
         }
         last.content = node.firstChild.textContent;
         // return content
         return last;
      }
	};
      
   var objectToXML = function(object){
		if( String.isString(object) ){
			return object.escape();
		}
		
		if( Array.isArray(object) ){
			return object.map(objectToXML).join("");
		}
		
		var xmlString = "";
		for( var key in object ){
      if( key === "#text" ){
        //xmlString += object[key]; // 2018-04-16 wayne 
        continue;
      }
			xmlString += "<" + key + ">" + objectToXML(object[key]) + "</" + key + ">";
		}
		return xmlString;
	}
  
   var removeQuotes = function(s) {           // 2018-04-12: to avoid having quotes in the value of tag attribute...
      //return s.replace(/'/g,"\x27").replace(/"/g,"\x22");
      return s.replace(/['"]/g," ");
   };
  
   var generateTag = function(object) {
      //alert(JSON.stringify(object));
      if (object.type == "metatags") {
         var t = "<MetaTags>";
         var metatags = JSON.parse(object.userdata['note'].replace(/, }/g, '}'));
         for (var metatag of Object.values(metatags)) {
           t += "<" + metatag.type;
           for (var attr of Object.keys(metatag)) {
             if (attr != 'content' && attr !='type') {
               t += " " + attr + "='" + metatag[attr] + "'";
             }
           }
           t += ">" + metatag['content'] + "</" + metatag.type + ">";
         }
         t += "</MetaTags>";
         return t;
      }
      if (Array.isArray(object)) {
         return object.map(function(e) { return generateTag(e); }).join("");
      }
      if( String.isString(object) ){
         return object;
      }
 	   if (typeof object !== "undefined" && object.type) {     // 2017-01-20
		   if (typeof object.content == "undefined") object.content = "";   // ...
		   var tagAttr = "";                       // 2017-03-22
		   if (object.userdata) {
            var noteVal = ("note" in object.userdata) ? object.userdata["note"] : object.userdata['CbdbId'];
            if (noteVal) {
               if (object.type == 'pageBreak' || object.type == 'lineBreak') tagAttr = ' Key="' + removeQuotes(noteVal) + '"';        // 2018-05-05
			  	   // 2019-03-27 Wayne:
               // 支援 korean id & ddbc id
               // 支援 system prefix
               else if (object.subtype == 'koreanOfficialTitle' && !noteVal.includes('koffice_')) noteVal = 'koffice_' + noteVal;
               else if (object.subtype == 'koreanPlace' && !noteVal.includes('kplace_')) noteVal = 'kplace_' + noteVal;
               else if (object.subtype == 'koreanBook' && !noteVal.includes('kbook_')) noteVal = 'kbook_' + noteVal;
               else if (object.subtype == 'koreanPerson' && !noteVal.includes('kperson_')) noteVal = 'kperson_' + noteVal;
               else if ((object.subtype == 'dilaPlace' || object.subtype == 'dilaPerson') && !noteVal.includes('dila_')) noteVal = 'dila_' + noteVal;   // 2019-04-16 Wayne: Markus 更新 
               //else if (noteVal.substr(0, 2)  == 'PL' || noteVal.substr(0, 1) == 'A') {    
               else if (noteVal.match(/^PL\d{8,}$/) || noteVal.match(/^A\d{8,}$/)) {
                  // 2020-11-07: bug fix -- 先前僅檢查前兩個字元，很容易出錯（例如 Accommodation_2 會被轉成 dila_Accommodation_2）
                  noteVal = 'dila_' + noteVal;
               }
               else if (noteVal.substr(0, 7) == 'cbdb_PL' || noteVal.substr(0, 6) == 'cbdb_A') noteVal = noteVal.replace('cbdb', 'dila');   // 2019-04-09 Wayne: 律定法鼓 prefix 為 dila
               else if (!noteVal.includes('markus_') &&
                        !noteVal.includes('twgis') &&
                        !noteVal.includes('hvd') &&
                        object.type != 'datetime') {
                           //alert(JSON.stringify(object.userdata));
                           noteVal = 'markus_' + noteVal;
               }
			  	   tagAttr = ' RefId="' + removeQuotes(noteVal) + '"';        // 2018-04-12
			  	
			  	   if (object.type == 'person' && noteVal.substr(0, 5) == 'dila_') object.subtype = 'dilaPerson';   // 2019-04-09 Wayne: 律定法鼓 prefix 為 dila
			  	   if (object.type == 'location' && noteVal.substr(0, 5) == 'dila_') object.subtype = 'dilaPlace';  // 2019-04-09 Wayne: 律定法鼓 prefix 為 dila
			  	
			   }
		   }
         
         var tagForConversion = '';
         var tagAttrRelDataId = '';
         //if (object.subtype) {
         //   tagForConversion = ' TagForConversion="{&quot;markus&quot;:&quot;' + object.subtype + '&quot;}"';        // 2019-04-01 Wayne: 為了 Markus 的新屬性
         //   //alert(JSON.stringify(object));
         //}

         // 2020-11-03: 輸出 XML 加上 TagRelDataId 屬性...
         if (object.tagRelDataId) {
            tagAttrRelDataId += ' TagRelDataId="' + object.tagRelDataId + '"';
         }

         let temp = null;
         if (object.subtype) temp = object.subtype;
         else if (object.type.substr(0,5) == 'Udef_') temp = object.type.substr(5);
         if (temp) tagForConversion = ' TagForConversion="{&quot;markus&quot;:&quot;' + temp + '&quot;}"';        // 2019-04-01 Wayne: 為了 Markus 的新屬性

         tagAttr += tagAttrRelDataId + tagForConversion
         
         switch (object.type) {
         case "person":
           tagAttr = tagAttrRelDataId + tagForConversion + ' ';
           var attrList = [];        // Tu: 2017-02-20
           for (var key in object.userdata) { // 2019-10-03 Wayne: 這邊的 key 值應該只有 CbdbId，若有多個可能會發生錯誤(Term 值多重賦予)
              var termVal = termEscape(object.userdata[key]);
              if (key === 'CbdbId') {
                // 2019-03-30 Wayne: 舊版 Markus 文件
                if (termVal.substr(0, 1) == 'A') {  
                   termVal = 'dila_' + termVal; // 2019-04-09 Wayne: 律定法鼓 prefix 為 dila
                   attrList.push('RefId="' + termVal + '"');
                }
                else if (termVal.substr(0, 6) == 'cbdb_A') {
                   termVal = termVal.replace('cbdb', 'dila');
                   attrlist.push('RefId="' + termVal + '"');
                }
                else if (!termVal.includes('cbdb_')) { // 2019-03-28 Wayne: 防呆
                   termVal = 'cbdb_' + termVal
                   attrList.push('CbdbId="' + termVal + '"'); 
                }
                
                if (GvarThdlExport['personNameTagIdAsFeature']) attrList.push('Term="' + termVal + '"');   // 20170412 將 Term 的值設為 RefId 的值
              } 
              else if (key == 'dilaPerson') {          // 2020-09-16: Tu (bug fix)
                 termVal = 'dila_' + termVal;
                 attrList.push('RefId="' + termVal + '"');
              }
              else {
                 // unknown key ==> output markus_<termVal> as a hint
                 //alert(key + ':' + termVal);
                 if (!termVal.includes('markus_')) termVal = 'markus_' + termVal
                 attrList.push(key + '="' + termVal + '"'); 
              }
           }
           var attrStr = (attrList.length == 0) ? '' : ' ' + attrList.join(' ');
           if (object.userdata && object.userdata['note']) {
              if (GvarThdlExport['personNameTagIdAsFeature']) {     // 20170412, 20170426
                 tagAttr += ' Term="' + termEscape(noteVal) + '"';
              }
           }
           let ret = "<PersonName" + attrStr + tagAttr + ">" + generateTag(object.content) + "</PersonName>";
           //alert(ret);
           return ret;
         case "location":
           if (object.userdata && object.userdata['note']) {
              if (GvarThdlExport['placeNameTagIdAsFeature']) {     // 20170412, 20170426
                 tagAttr += ' Term="' + termEscape(noteVal) + '"';
              }
           }
           return "<LocName" + tagAttr + ">" + generateTag(object.content) + "</LocName>";
         case "datetime":
           if (object.userdata && object.userdata['note']) {
              if (GvarThdlExport['datetimeTagIdAsFeature']) {     // 20170412, 20170426
                 tagAttr += ' Term="' + termEscape(noteVal) + '"';
              }
           }
           return "<Date" + tagAttr + ">" + generateTag(object.content) + "</Date>";
         //case "recipe":
         //   return "<SubDoc Key='Recipe'>" + generateTag(object.content) + "</SubDoc>";
         //case "drugname":
         //   return "<DrugName>" + generateTag(object.content) + "</DrugName>";
         case "thing":
           if (object.subtype === "specific" ) {      // 2017-03-28
            return "<SpecificTerm Type='officialTitle'" + tagAttr + ">" + generateTag(object.content) + "</SpecificTerm>";
           }
           else if (object.subtype == "glossary") {   
              // 2018-07-08: refer to MarkusToSTAMLFuncs.js tabTable
              //             { type: "thing", subtype: "glossary", tag: "//span[@type='ddbcGlossaries']",
              //               userdata: [ { from: "/span/@ref_id", to: "note"} ]}
              return '<SpecificTerm Type="' + object.subtype + '"' + tagAttr + '">' + // 2019-03-28 Wayne: fixed typo
                      generateTag(object.content) + "</SpecificTerm>";
           }
           else if (object.subtype == "koreanBook") { // 2019-03-30 Wayne: 支援 koreanBook
              // 2019-03-27 Wayne: refer to MarkusToSTAMLFuncs.js tabTable
              //             { type: "thing", subtype: "koreanBook", tag: "//span[@type='koreanBook']",
              //               userdata: [ { from: "/span/@koreanbook_id", to: "note"} ]}
              if (object.userdata && object.userdata['note']) {
                  if(GvarThdlExport['udefTagIdAsFeature']) {
                      tagAttr += ' Term="' + removeQuotes(termEscape(noteVal)) + '"';
                  }
              }
              return '<Udef_koreanBook' + tagAttr + '>' +
                      generateTag(object.content) + '</Udef_koreanBook>';
           }
           else {
              return '<Thing Type="' + object.subtype + tagAttr + '">' +
                      generateTag(object.content) + "</Thing>";
           }
         case "office":
                // 2019-03-27 Wayne: 支援 Korean Tag
                if (object.subtype == "koreanOfficialTitle") {
                    object.subtype = 'officialTitle'
                }
           return "<Office Type='" + object.subtype + "'" + tagAttr + ">" + generateTag(object.content) + "</Office>";
         case "specificTerm":
           return "<SpecificTerm Type='" + object.subtype + "'" + tagAttr + ">" + generateTag(object.content) + "</SpecificTerm>";
         case "comment":        // 20170418
            // 2020-11-07: 加上 trim() 並避免回傳空的標籤
            s = generateTag(object.content).trim();
            if (s) return "<Comment>" + s + "</Comment>";
            else return '';     // skip empty comment
         case "commentItem":    // 20170421
           return "<CommentItem Category='" + object.subtype + "'>" + generateTag(object.content) + "</CommentItem>";
         case "markusDiv":      // 20170422
            tagAttr = (object.userdata) ? (" Value='" + object.userdata["note"] + "'") : "";
            return "<MarkusDiv Type='" + object.subtype + "'" + tagAttr + ">" + generateTag(object.content) + "</MarkusDiv>";
         case "span":
            // 2020-11-07: 加上 trim()，避免產生空標籤
            s = generateTag(object.content).trim();
            if (s) return "<" + object.type + tagAttr + ">" + s + "</" + object.type + ">";
            else return '';
         case "div":           // 2017-04-07: YangWanLi file contains many <div> tags...
           var t = "<" + object.type + tagAttr + ">" + generateTag(object.content) + "</" + object.type + ">";
           return t;
         case "font":
           return '';         // 2017-04-07: ZGZY file contains one suspicious <font>, simply skip it...
         case "pre":           // 2017-08-17: fix MARKUS error (to have more than one <div class="doc><pre>)
           return generateTag(object.content);
         case "pageBreak":     // 2018-05-05 (defined in MarkusToSTAMLFuncs.js)
           return "<Pb" + tagAttr + ">" + generateTag(object.content) + "</Pb>";
         case "lineBreak":     // 2018-05-05
           return "<Lb" + tagAttr + ">" + generateTag(object.content) + "</Lb>";
         case "align":
            GvarAlignCount += 1
            const DocuXMLTagKey = "M2D_" + pad(GvarAlignCount, 4)
            const DocuXMLTagType = (object.subtype) ? object.subtype : "Align"
            var DocuXMLTag =  "<AlignBegin Type='" + DocuXMLTagType + "' Key='" + DocuXMLTagKey + "'" + tagAttr + "/>" + generateTag(object.content) + "<AlignEnd Type='" + DocuXMLTagType + "' Key='" + DocuXMLTagKey +"'/>"
            return DocuXMLTag
         case "comparativeus": // 2019-10-27 Wayne: added Markus comparativeus tag
            var matchmarkstart_id  = object.userdata.matchmarkstart_id;
            var matchmarkend_id = object.userdata.matchmarkend_id;
            var comparativeus_link = object.userdata.comparativeus_link;

            if (matchmarkstart_id !== undefined) { // <span type="matchMarkStart">
              var combinedAlignKey = [matchmarkstart_id, comparativeus_link].sort().join(',');
              GvarAlignKeyTable[matchmarkstart_id] = combinedAlignKey;
              var tagForConversion = "{&quot;markus&quot;:{&quot;" + object.type + "&quot;:&quot;" + matchmarkstart_id  + "&quot;}}";
              var DocuXMLTag = "<AlignBegin Type='" + object.type + "' Key='" + combinedAlignKey + "' TagForConversion='" + tagForConversion + "'/>";
              return DocuXMLTag;
            } else if (matchmarkend_id !== undefined) { // <span type="matchMarkEnd">
              var combinedAlignKey = GvarAlignKeyTable[matchmarkend_id];
              var tagForConversion = "{&quot;markus&quot;:{&quot;" + object.type + "&quot;:&quot;" + matchmarkend_id  + "&quot;}}";
              var DocuXMLTag = "<AlignEnd Type='" + object.type + "' Key='" + combinedAlignKey + "' TagForConversion='" + tagForConversion + "'/>";
              return DocuXMLTag;
            } else {
              console.error('Comparativeus 標籤缺少鍵值')
            }

         default:              // Udef_xxx
           var utag = object.type;
           if (utag.indexOf("Udef_") === 0 && utag.length > 5) {     // 20170621: ���ɷ|�� 'Udef_' �����ҡH
              GvarThdlExport['featureAnalysisTags'].push(object.type);
              //alert(JSON.stringify(object));
              // 2018-04-13: adds Term= to tagAttr
              if (object.userdata && object.userdata['note']) {
                 if (GvarThdlExport['udefTagIdAsFeature']) {
                    tagAttr += ' Term="' + removeQuotes(termEscape(noteVal)) + '"';
                    //alert(tagAttr);
                 }
              }
              var t = "<" + object.type + tagAttr + ">" + generateTag(object.content) + "</" + object.type + ">";
              return t;
           }
           else return '';
         }
      }
   }
  
  
  return {
    // document level meta-data extraction
    documentInformation: function(context){
      var dom = tryParseXML(context);             // 2016-09-16
		  if (dom === null) return null;

      var metadata = {};
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(context, "text/xml");
      
      // Tu 2017-02-08: should I append customized tags here? (will it be invoked several times?)
      var descendentNodes = xmlDoc.getElementsByTagName("*");
      var customizedTags = [];
      for (var i=0; i<descendentNodes.length; i++) {
        customizedTags.push(descendentNodes[i].tagName);
      }
      appendCustomizedTags(customizedTags);     // append Udef_xxx tags to tagTable
      
      
      var doc = xmlDoc.getElementsByTagName("document")[0];
      var childNodes = doc.childNodes;
      for( var i = 0 ; i < childNodes.length ; ++i ){
        if( childNodes[i].nodeName !== "doc_content" ){
          metadata[childNodes[i].nodeName] = XMLtoObject(childNodes[i]);
        } 
      }
      var attr = doc.attributes;
      for( var i = 0 ; i < attr.length ; ++i ){
        metadata[attr[i].nodeName] = attr[i].nodeValue;
      }
      return {
        metadata: metadata
      };
    },
    
   articleInformation: function( context ){
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(context, "text/xml");
      var chapters = [];
         if (sectionDividerTable.chapter) {
            var nodes = xmlDoc.evaluate(sectionDividerTable.chapter, xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            var node;
            while( node = nodes.iterateNext() ) {
               chapters.push( {type: "chapter", content: createXMLDocumentFromNode(node)} );
            }
         }
         else {
            chapters.push({type: "chapter", content: xmlDoc} );
         }
         var sections = [];
         for ( var i = 0 ; i < chapters.length ; i++ ) {
            sections.push({type: "chapter", content: []});
            var nodes = chapters[i].content.evaluate(sectionDividerTable.section, chapters[i].content, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            var node;
            if( !(node = nodes.iterateNext()) ){
               sections[i].content.push({ type: "section", content: tagTransformer((new XMLSerializer()).serializeToString(chapters[i].content.getElementsByTagName("doc_content")[0]))});
            }
            else {
               do {
                  sections[i].content.push({ type: "section", content: tagTransformer((new XMLSerializer()).serializeToString(node))});
               } while ( node = nodes.iterateNext() );
            }
        }
        //console.log(sections);
        return sections;
    },
      
    mergeToContext: function(input){
      //alert(JSON.stringify(input));
      var filename = input.document.metadata['filename'];        // Tu
      
      // 2024-06-30: Jiajing_JianningXianzhi_Fuluyiwen_Gao_Chengongsheng_Zhen'anqiaoji.txt_markus_event 檔名中包含單引號，會造成 filename 問題！
      var xmlString = "<ThdlPrototypeExport>" +
                      //"<corpus><feature_analysis></feature_analysis></corpus>" +
                      '<documents><document filename="' + filename + '"><doc_content></doc_content></document></documents>' +
                      "</ThdlPrototypeExport>";
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      var metadataXML = objectToXML(input.document.metadata);
      let documentNode = xmlDoc.getElementsByTagName("document")[0];
      //if (!documentNode) {
      //   alert(xmlString);
      //   alert("cannot find document node!");
      //}
      appendAllChildren( metadataXML, documentNode);
      var article = input.article;
      var allChaptersXML = "";          // Tu
      for (var chapter of Object.values(article)) {
         for (var section of Object.values(chapter.content)) {
            for (var prototypeNode of Object.values(section.content)) {
               if (prototypeNode.linkdata !== undefined) {
                  let relationsData = (new DocuXMLEventsBuilder()).parseMarkusRelationsData(prototypeNode.linkdata);
                  //alert(JSON.stringify(relationsData));

                  // 2020-11-04: Tu 加上新屬性 TagRelDataId
                  if (prototypeNode.tagRelDataId == undefined) {
                     prototypeNode.tagRelDataId = relationsData['id'];
                     //alert(prototypeNode.tagRelDataId + "\n" +JSON.stringify(prototypeNode));
                  }
                  
                  var DocuXMLString = generateTag(prototypeNode);
                  var DocuXMLTag = (new DOMParser()).parseFromString(DocuXMLString, 'application/xml').firstChild;
                  //alert(JSON.stringify(prototypeNode) + "\n => " + DocuXMLString + "\n => " + DocuXMLTag.tagName);


                  // 2020-11-01: bug fix（Markus 標記的 dest 可能找不到對應的節點）
                  //             應該將 relationsData.relations （陣列）中的 dest 也加入 GvarMarkusRelIdToTag，
                  //             但若該 dest 先前曾出現，就跳過不需處理，否則就創造一個 DOM Element <MarkusTagMissing>
                  let unspecifiedIdx = 1;
                  let relations = relationsData.relations;

                  relations.forEach(function(v) {
                     let dest = v.dest;
                     if (GvarMarkusRelIdToTag[dest] === undefined) {       // 只有當 GvarMarkusRelIdToTag[dest] 未定義才需加入
                        let dummyVal = "遺失_" + unspecifiedIdx++;
                        let dummyElement = "<MarkusTagMissing Dest='" + dest + "'>" + dummyVal + "</MarkusTagMissing>";
                        GvarMarkusRelIdToTag[dest] = (new DOMParser()).parseFromString(dummyElement, 'application/xml').firstChild;
                     }
                  });

                  // 即使該 MarkusRelId 先前已出現（例如在某個 dest 中），也是直接蓋掉               
                  var MarkusRelId = relationsData['id'];
                  GvarMarkusRelIdToTag[MarkusRelId] = DocuXMLTag;        // 注意，DocuXMLTag 是 DOM element
               }
               //else alert("No linkdata: " + JSON.stringify(prototypeNode));
            }
         }
      }
      //alert("GvarMarkusRelIdToTag => " + JSON.stringify(GvarMarkusRelIdToTag));
      
      for( var i = 0 ; i < article.length ; ++i ){
        var chapter = article[i];
        for( var j = 0 ; j < chapter.content.length ; ++j ){
          var section = chapter.content[j];
          //alert("Paragraph: " + JSON.stringify(section));
          var eventsBuilder = new DocuXMLEventsBuilder() // 2019-10-31 Wayne: 新增 Markus Relation 轉換
          eventsBuilder.setMarkusRelIdToTag(GvarMarkusRelIdToTag);
          var sectionXML = "<Paragraph";
          // Tu: 20170410, 2018-04-12: section.refId has to be escaped! (it may contain double quotation mark?!)
          if (section.refId) sectionXML += " RefId='" + removeQuotes(section.refId) + "'";
          sectionXML += ">";
          for( var k = 0 ; k < section.content.length ; ++k ){
             //alert(JSON.stringify(section.content[k]));
             var DocuXMLTag = generateTag(section.content[k]);
             //alert(DocuXMLTag);
             sectionXML += DocuXMLTag;
             if (section.content[k].linkdata !== undefined) {
                var relationsData = (new DocuXMLEventsBuilder()).parseMarkusRelationsData(section.content[k].linkdata);
                //alert(JSON.stringify(relationsData));                 // for debugging
                eventsBuilder.addEventFromMarkus(relationsData, k);     // k: SourceTagRelDataId
             }
          }
          if (eventsBuilder.hasEvent()) {
            sectionXML += eventsBuilder.toDocuXMLTag();
          }
          sectionXML += "</Paragraph>";
		  if (GvarBrAsNewline) sectionXML = sectionXML.replace(/\n/g, "<br/>") // 2019-04-09 Wayne: 符合 Markus 換行格式
          allChaptersXML += sectionXML;
        }
      }
	    appendAllChildren( allChaptersXML, xmlDoc.getElementsByTagName("doc_content")[0]);
      
      return (new XMLSerializer()).serializeToString(xmlDoc);
    }
  }
})();