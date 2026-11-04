var MarkusToSTAMLFuncs = (function(){
	var metadataTable = [
		{ from: "/div[@class='doc']/@filename", to: "filename"}
	];

	var applicationTable = [
		{ from: "/div[@class='doc']/@tag", to: "tag"}
	];

	var sectionDividerTable = {
		chapter: false,
		section: "/div[@class='doc']/pre//span[@type='passage']",     // 2017-07-17: modify '/' to '//' (to handle multiple <div class="doc><pre>)
		edit_section: "/div[@class='doc edit']/pre//span[@type='passage']" // 2018-05-05 wanye: for maruks edit mode
	}

	var MarkusTagTable = [
		{ type: "person", subtype: "fullname", tag: "//span[@type='fullName']",		   // 2019-10-03 Wayne: 全部轉成 userdata 處理
			userdata: [ { from: "/span/@cbdbid", to: "CbdbId" }, ],
			linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},                     // 2017-03-28: change 'cbdbid' to "CbdbId"
		{ type: "person", subtype: "othername", tag: "//span[@type='partialName']",
			userdata: [ { from: "/span/@cbdbid", to: "CbdbId" }, ],
			linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "person", subtype: "dilaPerson", tag: "//span[@type='ddbcPerson']",    // 2017-03-22: Markus ���N�� tag ��J�e�m�ŧi�ϡH
			userdata: [ { from: "/span/@ddbcperson_id", to: "dilaPerson" }, ],          // 2020-09-16: Tu (from 'note' to 'dilaPerson')
			linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "location", tag: "//span[@type='placeName']",
			userdata: [ { from: "/span/@placename_id", to: "note" }, ],
			linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},   // xxxx_id => note
		{ type: "office", subtype: "officialTitle", tag: "//span[@type='officialTitle']",
			userdata: [ { from: "/span/@officialtitle_id", to: "note" }, ],
			linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "thing", subtype: "glossary", tag: "//span[@type='ddbcGlossaries']",
			userdata: [ { from: "/span/@ref_id", to: "note" }, ],
			linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},                       // 2018-07-08: currently there is no "ref_id" in MARKUS html...
		//{ type: "specificTerm", subtype: "specificTerm", tag: "//span[@type='specific']",
		//    userdata: [ { from: "/span/@specific_id", to: "note"} ]},
		{ type: "datetime",  tag: "//span[@type='timePeriod']",
			userdata: [ { from: "/span/@timeperiod_id", to: "note" }, ],
			linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "markusDiv", subtype: "title", tag: "//div[@class='title']",
			userdata: [ { from: "/span/@value", to: "note" }, ],
		},
		{ type: "markusDiv", subtype: "fullText", tag: "//div[@class='fullText']",
			userdata: [ { from: "/span/@value", to: "note" }, ],
		},
		{ type: "markusDiv", subtype: "metadata", tag: "//div[@class='metadata']",
			userdata: [ { from: "/span/@value", to: "note" }, ],
		},
		//{ type: "DocTitle", tag: "//span[@type='title']" },
		//{ type: "recipe",  tag: "//span[@type='Recipe']",
		//   userdata: [ { from: "/span/@recipe_id", to: "note"} ]},
		//{ type: "drugname",  tag: "//span[@type='DrugName']",
		//   userdata: [ { from: "/span/@drugname_id", to: "note"} ]},
		{ type: "comments", tag: "//span[@class='commentContainer']",
			userdata: [ { from: "/span/@value", to: "note" }, ],
		},
		{ type: "pageBreak", tag: "//Pb",
			userdata: [ { from: "/Pb/@Key", to: "note"} ],
		},         // 2018-05-05
		{ type: "lineBreak", tag: "//Lb",
			userdata: [ { from: "/Lb/@Key", to: "note"} ]
		},         // 2018-05-05
		// 2019-03-27 Wayne: 支援 Korean Tag & ddbc tag
		{ type: "office", subtype: "koreanOfficialTitle", tag: "//span[@type='koreanOfficialTitle']",
				userdata: [ { from: "/span/@koreanofficialtitle_id", to: "note" } ],
				linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "location", subtype: "koreanPlace", tag: "//span[@type='koreanPlace']",
				userdata: [ { from: "/span/@koreanplace_id", to: "note" } ],
				linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "thing", subtype: "koreanBook", tag: "//span[@type='koreanBook']",
				userdata: [ { from: "/span/@koreanbook_id", to: "note" } ],
				linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "person", subtype: "koreanPerson", tag: "//span[@type='koreanPerson']",
				userdata: [ { from: "/span/@koreanperson_id", to: "note" } ],
				linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "location", subtype: "dilaPlace", tag: "//span[@type='ddbcPlace']", // 2019-04-16 Wayne: Markus 改版
				userdata: [ { from: "/span/@ddbcplace_id", to: "note" } ],
				linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		// 2019-4-16 Wayne: Markus 改版
		{ type: "location", subtype: "dilaPlace", tag: "//span[@type='dilaPlace']",
          	  userdata: [ { from: "/span/@dilaplace_id", to: "note" } ],
				linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "person", subtype: "dilaPerson", tag: "//span[@type='dilaPerson']",
				userdata: [ { from: "/span/@dilaperson_id", to: "dilaPerson" } ],    // 2020-09-16: Tu (from "note" to "dilaPerson")
				linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ]
		},
		{ type: "metatags", tag: "//span[@class='MetaTags']",
				userdata: [ { from: "/span/@value", to: "note "} ]
		},
      // 2019-10-26 Wayne: Markus 支援 comparativeus Tag (should be 'comparatives'?)
		{ type: "comparativeus", tag: "//span[@type='comparativeus']",             
				 userdata: [
					{ from: "/span/@matchmarkstart_id", to: "matchmarkstart_id" }, 
					{ from: "/span/@matchmarkend_id", to: "matchmarkend_id" },
					{ from: "/span/@data-comparativuslinks", to: "comparativeus_link" }
				]
      },
	];
	var MarkusTagPrefix = {
		"koreanPlace": { prefix: "kplace_", tagName: "koreanPlace", markusRefId: "koreanplace_id" },
		"koreanPerson": { prefix: "kperson_", tagName: "koreanPerson", markusRefId: "koreanperson_id" },
		"koreanOfficialTitle": { prefix: "koffice_", tagName: "koreanOfficialTitle", markusRefId: "koreanofficialtitle_id" },
		"koreanBook": { prefix: "kbook_", tagName: "koreanBook", markusRefId: "koreanbook_id" },
		"dilaPlace": { prefix: "dila_", tagName: "dilaPlace", markusRefId: "dilaplace_id" }, // 2019-04-09 Wayne: 律定法鼓 prefix 為 dila
		"dilaPerson": { prefix: "dila_", tagName: "dilaPerson", markusRefId: "dilaperson_id" }, // 2019-04-09 Wayne: 律定法鼓 prefix 為 dila
		"ddbcPlace": { prefix: "dila_", tagName: "dilaPlace", markusRefId: "dilaplace_id" }, // 2019-04-09 Wayne: 律定法鼓 prefix 為 dila
		"ddbcPerson": { prefix: "dila_", tagName: "dilaPerson", markusRefId: "dilaperson_id" }, // 2019-04-09 Wayne: 律定法鼓 prefix 為 dila
		"fullname": { prefix: "cbdb_", tagName: "fullName", markusRefId: "cbdbid" },
		"othername": { prefix: "cbdb_", tagName: "partialName", markusRefId: "cbdbid" },
		"officialTitle": { prefix: "markus_", tagName: "officialTitle", markusRefId: "officialtitle_id" }
	};
	var tagIgnore = [
		//"/span[@class='commentContainer']"
	];

	var XMLTableToJSON  = function( XMLTable ){    // [{from:xpath, to:'note'}]
      //alert(JSON.stringify(table));
		return function(context){
			var jsonData= {};
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(context, "text/xml");

			for( var i = 0 ; i < XMLTable.length ; i++ ){
				if( XMLTable[i].key ){
					jsonData[table[i].key] = XMLTable[i].value;
					continue;
				}
            try {             // 2017-10-26: "/span/@&#(732);drugs_id" is not a legal expression
               var nodes = xmlDoc.evaluate(XMLTable[i].from, xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
				   jsonData[XMLTable[i].to] = [];
				   var node;
				   while( node = nodes.iterateNext() ){
				   	if( node.nodeType === 1 ){         // 1: element
				   		jsonData[XMLTable[i].to] = node.textContent;
				   	}
				   	else if( node.nodeType === 2 ){    // 2: attribute
				   		jsonData[XMLTable[i].to] = node.value.replace(/&#\((x?[0-9]+)\);/g, "&#$1;");    // 20170421: add replace()
				   	}
				   	else if( node.nodeType === 3 ){    // 3:text
				   		jsonData[XMLTable[i].to] = node.nodeValue;
				   	}
				   }

				   if( jsonData[XMLTable[i].to].length === 1 ){
				   	jsonData[XMLTable[i].to] = jsonData[XMLTable[i].to][0];
				   }

				   if( jsonData[XMLTable[i].to].length === 0 ){
				   	delete jsonData[XMLTable[i].to];
				   }
            } catch (e) {
               console.error(e.message + "\n" + XMLTable[i].from);
            }
			}

			return jsonData;
		};
	}

	var tagTransformer = function( context ){
      var content = [];
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(context, "text/xml");

      // nodeType: 1 Element, 2 Attribute, 3 Text, 4 CDATASection, 5 EntityReference
      //           6 Entity, 7 ProcessingInstruction, 8 Comment, 9 Document
      //           10 DocumentType, 11 DocumentFragment, 12 Notation
		var nodes = xmlDoc.firstChild.childNodes;
		for (var i = 0; i < nodes.length; i++) {
			if (nodes[i].nodeType === 3) {
				content.push(nodes[i].nodeValue);
			}
			else if (nodes[i].nodeType === 1) {
				var node = createXMLDocumentFromNode(nodes[i]);
				var ignore = false;
				for (var j = 0 ; j < tagIgnore.length ; j++) {
					if (node.evaluate(tagIgnore[j], node, null, XPathResult.ANY_TYPE, null).iterateNext()) {
						ignore = true;
						break;
					}
				}
            if (!ignore) {     // 2017-04-07: Tu fix (recursiveXML can return an array)
               var result = recursiveXML(node);
               if (Array.isArray(result)) {
                  content.push.apply(content, result);
               }
               else content.push(result);
            }
			}
		}

      //alert(JSON.stringify(content));
		return content;
   }

   // ================================================================
   
   var extraTagHandling = function(node, contentList) {
      var firstChild = node.firstChild;
      var tagType = firstChild.tagName;     // ... tagName ... tagType...

      // 20170418
      if (tagType === 'span' && firstChild.getAttribute("class")==='commentContainer') {
         tagType = 'comment';
         // contentist[] ... comments ... attribute ... tag ...
         var commentContent = firstChild.getAttribute("value");      // a JSON-format array
         var commentArray = JSON.parse(commentContent);
         if (!Array.isArray(commentArray)) return null;

         var commentItems = commentArray.map(function(s) {
            s = s.replace(/&#\((x?[0-9]+)\);/g, "&#$1;");
            var lines = s.split("\n");
            var category = 'default';
            if (lines[0].match(/^[A-Z0-9 ]+:?$/)) {                  // comment category
               category = lines[0].trim().replace(':','');
               lines.shift();
            }
            return { type: 'commentItem', subtype: category, content: lines.join("\n") };
         });

         // ���ɡAcontentList �̫���G�|���Ť��e�� span??
         var myLast = contentList.pop();
         if (myLast.type === 'span' && myLast.content === '') ;       // skip this node content
         else contentList.push(myLast);

         if (contentList.length == 0) contentList = commentItems;
         else contentList.unshift({type:'comment', content:commentItems});
         return { type:tagType, content:contentList };
      }

      var now = {};
		for (var i = 0 ; i < MarkusTagTable.length ; i++) {
         // if (MarkusTagTable[i].type != 'markusDiv') continue; // 2019-04-25 Wayne: recursive node bug
         var tags = node.evaluate( MarkusTagTable[i].tag.replace('//', '/'), node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null ); // 2019-04-25 Wayne: Fixed Recursive node
			var tag = tags.iterateNext()
			if (tag) {
				now.type = MarkusTagTable[i].type;
				if( MarkusTagTable[i].subtype ){
					now.subtype = MarkusTagTable[i].subtype;
				}
				if( MarkusTagTable[i].userdata ){
					now.userdata = (new XMLTableToJSON(MarkusTagTable[i].userdata))((new XMLSerializer()).serializeToString(tag) );
					if( Object.keys(now.userdata).length === 0 ){
						now.userdata = undefined;
						delete now.userdata;
					}
				}
				if( MarkusTagTable[i].linkdata ){
					now.linkdata = (new XMLTableToJSON(MarkusTagTable[i].linkdata))((new XMLSerializer()).serializeToString(tag) );
					if( Object.keys(now.linkdata).length === 0 ) {
						now.linkdata = undefined;
						delete now.linkdata;
					}
				}
            ;
         }
      }
      if (Object.keys(now).length > 0) {
         now.tagType = 'markusDiv';
         now.content = contentList;
         return now;
      }

      return null;
   }

   // ...
	var recursiveXML = function( node ){
		var content = {};
		var last = content;
		var now = content;
		var allTag = 0;
		// nodeType 1:element, 2:attribute, 3:text
		//for(var child = node.childNodes[0]; child.nodeType !== 3 ; child = child.childNodes[0]){
		//for (var child = node.childNodes[0]; child && child.nodeType !== 3 ; child = child.childNodes[0]) {
		//for(var child = node.childNodes[0]; child.nodeType === 1 ; child = child.childNodes[0]){
		//	++allTag;
		//}
      var myNodes = node.getElementsByTagName("*");
      allTag = myNodes.length;

      if (allTag > 1) {
         var firstChild = node.firstChild;
         var tagType = firstChild.tagName;     // �Ȯɥ��� tagName �@�� tagType...
         var childNodes = firstChild.childNodes;
         var contentList = [];
         for (var i=0; i<childNodes.length; i++) {
            if (childNodes[i].nodeType == 1) {
              var myNode = createXMLDocumentFromNode(childNodes[i]);
              contentList[i] = recursiveXML(myNode);
            }
            else if (childNodes[i].nodeType == 3) {
              contentList[i] = childNodes[i].textContent;
            }
         }

         var ret = extraTagHandling(node, contentList);
         if (ret === null)  ret = { type: tagType, content: contentList };

         //alert(JSON.stringify(ret));
         return ret;
      }

		var foundTag = 0;
		for (var i = 0 ; i < MarkusTagTable.length ; i++) {
			var tags = node.evaluate( MarkusTagTable[i].tag, node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
			var tag;
			while (tag = tags.iterateNext()) {
	         //alert(tag.nodeType + ':' + JSON.stringify(tag.textContent) + "\n" +
            //      MarkusTagTable[i].tag + ' ' + (new XMLSerializer()).serializeToString(tag) );
				++foundTag;
				now.type = MarkusTagTable[i].type;
				if( MarkusTagTable[i].subtype ){
					now.subtype = MarkusTagTable[i].subtype;
				}
				if( MarkusTagTable[i].userdata ){
					now.userdata = (new XMLTableToJSON(MarkusTagTable[i].userdata))((new XMLSerializer()).serializeToString(tag) );
					if( Object.keys(now.userdata).length === 0 ){
						now.userdata = undefined;
						delete now.userdata;
					}
				}
				if( MarkusTagTable[i].linkdata ){
					now.linkdata = (new XMLTableToJSON(MarkusTagTable[i].linkdata))((new XMLSerializer()).serializeToString(tag) );
					if( Object.keys(now.linkdata).length === 0 ) {
						now.linkdata = undefined;
						delete now.linkdata;
					}
				}

				last = now;               // referece to the previous result
				now.content = {};         // create a deeper sub-object
				now = now.content;        // move object reference to deeper sub-object
			}
		}
      //alert(allTag + ' - Wrapup: ' + JSON.stringify(content));

		if (allTag !== foundTag){
			var lastNode = null;
			var diff = allTag - foundTag;
			var nowFoundTag = 0;
			var child;
			// 2017-01-18: should check if child is not null (i.e., child && ...)
			for( child = node.childNodes[0] ; child && child.nodeType !== 3 ; child = child.childNodes[0]){
				for( var i = 0 ; i < MarkusTagTable.length ; i++ ){
					var tags = node.evaluate( MarkusTagTable[i].tag, child, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
					var tag;

					while( tag = tags.iterateNext() ){
						++nowFoundTag;
					}
				}

				if( allTag - nowFoundTag !== diff ){
					now.type = lastNode.nodeName;
					if( lastNode.getAttribute("subtype") ){
						now.subtype = lastNode.getAttribute("subtype");
					}

					diff = allTag - nowFoundTag;

					last = now;
					now.content = {};
					now = now.content;
				}
				lastNode = child;
				--allTag;
			}

			if( diff > 0 ){
				now.type = lastNode.nodeName;
				if( lastNode.getAttribute("subtype") ){
					now.subtype = lastNode.getAttribute("subtype");
				}

				diff = allTag - nowFoundTag;

				last = now;
				now.content = {};
				now = now.content;
			}
		}

		last.content = node.firstChild.textContent;
      //alert('last: ' + node.firstChild.nodeType + ': ' + JSON.stringify(last.content));
		return content;         // content and last reference to the same object!
	}

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
			if(attr[i].nodeName === "style" || attr[i].nodeName === "id"){
				continue;
			}
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


   var generateTag = function( object ) {       // 產生 MARKUS html
      //alert(JSON.stringify(object));
      if (String.isString(object)) return object;
         if (Array.isArray(object)) {           // 2017-11-26
         var s = object.map(function(e) {
            return generateTag(e);
         });
         //return "<span class='unknown'>" + s + "</span>";
         return s;
	   }

	   // var XmlMappedToMarkus = {
      // 	Category: '',
      // 	Term: '',
      // 	CbdbId: '',
      // }
		// Markus	|	DocuXML
      // 姓名: fullname			| PersonName
      // 別名: partialname		| PersonName + othername
      // 時間: timePeriod		| Date
      // 地名: placeName		| LocName
      // 官名: officialTitle	| Office
      var tag = '<span class="' ;
      var markusRefId, prefix; // 2019-03-30 Wayne: 支援新版 Markus ID
		var tagName, moreThanOneIdData, moreThanOneIdAttribute;
		if (object.type === 'MetaTags') { // 2019-09-08 Wayne: Supported MetaTags
			tag += 'MetaTags" value=\'[';
			if (object.content && object.content.length > 1) {
				for (var metatag of Object.values(object.content)) {
					tag += '{'
					for (var key of Object.keys(metatag)) {
						var value = metatag[key]; var temp = '';
						if (typeof(value) === 'string') {
							for (let t = 0; t < value.length; t++) {
								let word = value.charCodeAt(t)
								if (word > 127) {	// 中文偵測
									temp += '&#' + word + ';'
								} else if (word == 34 || word == 39) {
									temp += '\\"'
								} else {
									temp += value[t]
								}
							}
							value = temp;
						}
						tag += '"' + key + '":"' + value + '", '; 
					}
					tag += '}, ';
				}
				tag = tag.substr(0, tag.length-2) + ']\'></span>';
			} else {
				throw new Error('MetaTags Parse Error: Empty MetaTags');
			}
			return tag;
		}
		else if( object.type === "PersonName" ) {
			markusRefId = "cbdbid";
			if( object.subtype === "othername" ){
				tagName = "partialName";
				moreThanOneIdData = "userdata";
				moreThanOneIdAttribute = "CbdbId";       // 2017-03-28: from "cbdbid" to "CbdbId"
			}
			else if( object.subtype === "officialTitle" ){
				tagName = "officialTitle";
				moreThanOneIdData = "userdata";
				moreThanOneIdAttribute = "note";
			}
			else {
				tagName = "fullName";
				moreThanOneIdData = "userdata";
				moreThanOneIdAttribute = "CbdbId";       // 2017-03-28: from "cbdbid" to "CbdbId"
			}
		}
		else if(object.type === "LocName"){               
			tagName = "placeName";
			moreThanOneIdData = "userdata";
			moreThanOneIdAttribute = "placename_id";
			markusRefId = 'placename_id'
		}
		else if(object.type === "Date"){
			tagName = "timePeriod";
			moreThanOneIdData = "userdata";
			moreThanOneIdAttribute = "note";
            markusRefId = 'timeperiod_id'
		}
		else if(object.type === "drugname"){
			tagName = "drugName";
			moreThanOneIdData = "userdata";
			moreThanOneIdAttribute = "note";
		}
		else if(object.type === "recipe"){
			tagName = "recipe";
			moreThanOneIdData = "userdata";
			moreThanOneIdAttribute = "note";
		}
		// 2017/12/21: added the office, span type
		else if (object.type === "Office") {
        	tagName = "officialTitle"
		}
		else if (object.type === "span") {
		}
        else if (object.type === "Pb") {
            return "<Pb Key='" + object.Key + "'>\t</Pb>"
            //return "<Pb Key=" + object.Key + "></Pb>"; 
		}
		else if (object.type === "AlignBegin") { // 20190423 Wayne: added AlignBegin tag feature
			if (object.Type == "comparativeus") {
				var DocuXMLAlignKey = object.Key.split(',');
				var matchmarkstart_id = JSON.parse(object.tagForConversion)['markus']['comparativeus'];
				var comparativeus_link = (matchmarkstart_id == DocuXMLAlignKey[0])? DocuXMLAlignKey[1] : DocuXMLAlignKey[0]; 
				var MarkusTag = '<span matchmarkstart_id="' + matchmarkstart_id + '" data-comparativuslinks="' + comparativeus_link + '" comparativeus_id="' + matchmarkstart_id + '" class="markup matchMarkStart comparativeus tagReset" type="comparativeus"> </span>';
				return MarkusTag;
			} else {
				const objectType = ( object.Type ) ? "Align." + object.Type : "Align."
				const objectRefId = ( object.Type ) ? "align." + object.Type.toLowerCase() + "_id" : "align._id"
				if ( object.refId ) {
					object.refId = object.refId.replace('markus_', '')
					return '<span class="markup maual unsolved ' + objectType + '" type="' + objectType + '" ' + objectRefId + '="' + object.refId + '">'
				}
				else return '<span class="markup maual unsolved ' + objectType + '" type="' + objectType + '">' 
			}
		}
		else if (object.type === "AlignEnd" ) { // 2019-04-23 Wayne: added AlignEnd tag feature
			if (object.Type == "comparativeus") {
				var matchmarkend_id = JSON.parse(object.tagForConversion)['markus']['comparativeus'];
				var MarkusTag = '<span matchmarkend_id="' + matchmarkend_id + '" comparativeus_id="' + matchmarkend_id + '" class="markup matchMarkEnd comparativeus tagReset" type="comparativeus"> </span>'; 
				return MarkusTag;
			} else {
				return "</span>";
			}
		}
      else {
			// check if object.type is "Udef_xxx"...
			var s = object.type;
			if (typeof(s) === 'undefined') {
				alert("Error in generateTag(): " + JSON.stringify(object));    // e.g., not an object but an array of objects: [{type,content}]
			}
			var ret = '';
			if (s.substr(0,5) === 'Udef_') {
				tagName = s.substr(5);
				moreThanOneIdData = "userdata";
				moreThanOneIdAttribute = "note";
				if (object.refId) markusRefId = 'refid'; // 2019-08-12 Wayne: Udef 中的 RefId
			}
			else {
				return "<" + object.type + ((object.subtype)? " subtype = '" + object.subtype + "'": "")+ ">" +  object.content + "</" + object.type + ">";
			}
		}
      
      // 2020-11-15:
		if ( object.tagForConversion ) {
			var key = JSON.parse(object.tagForConversion)['markus'];
         if (object.type.substr(0,5) == 'Udef_') {
            //alert(JSON.stringify(object));
			   prefix = 'markus_';
			   tagName = key;
			   markusRefId = key + '_id';
         }
         else {
            // e.g., MarkusTagPrefix[key] = {"prefix":"koffice_","tagName":"koreanOfficialTitle","markusRefId":"koreanofficialtitle_id"}
			   prefix = MarkusTagPrefix[key]['prefix'];
			   tagName = MarkusTagPrefix[key]['tagName'];
			   markusRefId = MarkusTagPrefix[key]['markusRefId'];
         }
		} else {
			prefix = 'markus_'
		}
      
      if (tagName) tag += 'markup manual unsolved ' + tagName; // 2019-04-01 Wayne: tagName 防呆
      if ( !object.refId && object.type == 'personName' ) tag += ' noCBDBID'
        
      // 2019-03-31 Wayne: Decrypted???
		if( object[moreThanOneIdData] && object[moreThanOneIdData] [moreThanOneIdAttribute] && object[moreThanOneIdData] [moreThanOneIdAttribute] .split("|").length > 1 ){
			tag += " moreThanOneId";
		}
		
		tag += '"'
		if (tagName) tag += ' type="' + tagName + '"'; // 2019-04-01 Wayne: tagName 防呆
		// if( object.linkdata ){
		// 	for( var key in object.linkdata ){
		// 		if( key === "refID" ){
		// 			continue;
		// 		}
		// 		tag += " " + key + '="' + object.linkdata[key] + '"';
		// 	}
		// }

		// if( object.userdata ){
		// 	for( var key in object.userdata ){
		// 		if( key === "note" ){
		// 			tag += " " + tagName.toLowerCase() + '_id="' + object.userdata[key] + '"'
		// 		}
		// 		else if( key === "refID" ){
		// 			continue;
		// 		}
		// 		else {
		// 			tag += " " + key + '="' + object.userdata[key] + '"';
		// 		}
		// 	}
		// }
		if (object.CbdbId) {
			object.refId = object.CbdbId;
		}
      if (object.refId) {
          object.refId = object.refId.replace(prefix, '');       // e.g., markus_Interpreters_15 => Interpreters_15
          if (prefix == 'markus_') {                             // 2020-11-04: bug fix (e.g., not RefID="xxx" but interpreters_id="xxx")
             let markusAttrName = "TO_BE_REPLACED";
             // 2020-11-04: 不能直接用 object.refId 中的 "Inerpreters" 作為 attr name 的 prefix，
             //             需使用 @Type 屬性（如果有 UDEF_ prefix，則使用 prefix 後的字串）...
             // e.g., let [markusAttrId, dummyNum] = object.refId.split('_');
             //       alert(JSON.stringify(object));
             //       markusAttrName = markusAttrId.toLowerCase() + '_id';
             // 否則，{"type":"Udef_Interpreters","refId":"koreanSillokOffice_6346","Term":"markus_koreanSillokOffice_6346","content":"譯官"}
             // 應該被輸出為 <span class="Interpreters markup unsolved" type="Interpreters" interpreters_id="koreanSillokOffice_6346">譯官</span>
             // 卻會被輸出成 <span class="markup manual unsolved Interpreters" type="Interpreters" koreansillokoffice_id="koreanSillokOffice_6346">譯官</span>
             if (object.type.substr(0,5) == 'Udef_') {
                markusAttrName = object.type.substr(5).toLowerCase() + '_id';
             }
             else {
                // e.g., <span class="placeName markup unsolved" type="placeName" placename_id="hvd_201001">奉天府</span>
                let typeVal = object.type;
                //alert(typeVal);
                if (typeVal == 'LocName') typeVal = 'PlaceName';     // 2020-11-04: DocuXml 使用 <LocName>，但 MARKUS 使用 placename
                // else if (如果還有其他 cases，需要特別轉換) ... 
                markusAttrName = typeVal.toLowerCase() + '_id';     
             }
             markusRefId = markusAttrName;
          }
          tag += ' ' + markusRefId + '="' + object.refId + '"';
      }

      // 2020-11-06: Tu -- 在 Markus Html 上，額外加上 TagRelDataId 屬性。原版的 Markus Html
      //             沒有此屬性；加上這屬性是為了方便後續將 relations data 貼上（注意首字大寫，
      //             也方便與正常 Markus Html 區別）
      if (object.TagRelDataId) {
         tag += ' TagRelDataId="' + object.TagRelDataId + '"';
      }
		
      tag += ">";
        
      if ( String.isString(object.content) ) {
			tag += object.content;
		}
		else {
			tag += generateTag(object.content);
		}

		tag += "</span>"
      
      //alert(tag);
		return tag;
	}

	var objectToXML = function(object){
		if( String.isString(object) ){
			return object.escape();
		}

		if( Array.isArray(object) ){
			return object.map(objectToXML).join("");
		}

		var xmlString = "";
		for( var key in object ){
			if( key === "#text" ) continue;
			xmlString += "<" + key + ">" + objectToXML(object[key]) + "</" + key + ">";
		}
		return xmlString;
	}

	function appendCustomizedTags(customizedTags) {        // Tu
		//{ type: "recipe",
		//  tag: "//span[@type='Recipe']",
		//  userdata: [ { from: "/span/@recipe_id", to: "note"} ]}
	   var tagHash = {};
	   for (var i=0; i<MarkusTagTable.length; i++) {
         var type = MarkusTagTable[i].type;
         if (type === 'comments' || type === 'markusDiv') continue;
	      var tagPath = MarkusTagTable[i].tag;
	      var regex = /\/\/span\[@type='(.+)'\]/g;
         var matches = regex.exec(tagPath);
         if (matches === null) continue;          // 2017-06-08: skip if no matches found
         else {
	         var tag = matches[1];
	         tagHash[tag] = 1;
         }
		}
		for (var tag in customizedTags) {           // �N Markus html �� <span type="xxx"> �ন <Udef_xxx>
	      if (!tagHash[tag]) {
            // 20190514 Wayne: Align 改版
            if (/^[Aa]lign/g.exec(tag)) {
               var tagType = "align"
               var subType = tag.replace(/^[Aa]lign./, '')
               var tagPath = "//span[@type='" + tag + "']";
               var udataFrom = "/span/@" + tag.toLowerCase() + "_id";
               var entry = {
                  type: tagType,
                  subtype: subType,
                  tag: tagPath,
                  userdata: [ { from:  udataFrom, to: "note"}]
               }
            } else {
               // 2020-11-15: Tu（自定義標籤，需加上 linkdata）
               var tagType = 'Udef_' + tag;          // DocuXml: Udef_<tag>
               var tagPath = "//span[@type='" + tag + "']";
               var udataFrom = "/span/@" + tag.toLowerCase() + "_id";
               var entry = { type: tagType,
                             tag: tagPath,
                             userdata: [ { from: udataFrom, to: "note"} ],
                             linkdata: [ { from: "/span/@relations_data", to: "relations_data" }, ],    // 2020-11-15
                           };
            }
            MarkusTagTable.push(entry);
            tagHash[tag] = 1;
         }
	   }
	   //alert(" ==> " + JSON.stringify(MarkusTagTable));       // 包含自定義標籤的 MarkusTagTable
	};
   
	function metadataObjToXmlString(metadata) {
		let result = ''
		for (let key in metadata) {
			let value = metadata[key]
			if (typeof(value) === 'string') {
				result += '"' + key + '":"'
				for (let t = 0; t < value.length; t++) {
					let word = value.charCodeAt(t)
					if (word > 127) {	// 中文偵測
						result += '&#(' + word + ');'
					} else if (word == 34 || word == 39) {
						result += '\\"'
					} else {
						result += value[t]
					}
				}
				result += '", '
			}
			else {
				const obj =  metadataObjToXmlString(value)
				result += '"' + key + '":'
				result +=  "{" + obj.substr(0, obj.length-2) + "}, "
			}
		}
		return result
	}

	return {
		documentInformation: function( context ){
			//var metadataTransform = XMLTableToJSON(metadataTable);
			var applicationTransform = XMLTableToJSON(applicationTable);
			var dom = tryParseXML(context);             // 2016-09-16
			if (dom === null) return null;
			metaHidden = (dom) ? dom.getElementById("metadataHidden") : null; // 2018-0201 wayne
			
			// 2018-04-15 wayne
			docuskyMeta = dom.firstChild.attributes['data-docusky-metadata'];
			markusMeta = dom.firstChild.attributes['data-markus-metadata'];   // 往後 markus 2 將會定義

			let metadata = {};
			if (metaHidden) {
				metadata = XMLtoObject(metaHidden)
			} else if(docuskyMeta || markusMeta) {
				let metaString = docuskyMeta.value.replace(/\n/g, '');      // 2018-05-20: Tu
				metadata = JSON.parse(metaString)
			}
			else {
				metadata = {filename: (new DOMParser()).parseFromString(context, "text/xml").getElementsByClassName("doc")[0].getAttribute("filename") }
			}

			//var metaHidden = (new DOMParser()).parseFromString(context, "text/xml").getElementById("metadataHidden");

			// Tu: 2017-01-19 firstChild <div ... tag="...">
         // 2017-08-09: add dom test -- otherwise it will hang
         var customizedTags = {};
         if (dom) {
            var c = dom.firstChild;
            if (c.nodeType == 1) {
               var s;
               customizedTags = (s = c.getAttribute("tag")) ? JSON.parse(s) : {};
            }
         }
			appendCustomizedTags(customizedTags);
         
			return {
				metadata,
				application: applicationTransform(context),
			};
		},
		articleInformation: function(context) {      // get the "article" information from context (e.g., Markus html)
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(context, "text/xml");
			var metaHidden = xmlDoc.getElementById("metadataHidden");
			if (metaHidden) metaHidden.parentNode.removeChild( xmlDoc.getElementById("metadataHidden") );

         // 2020-11-15: articleInformation 也需更新 MarkusTable
         var customizedTags = {};
         if (xmlDoc) {
            var c = xmlDoc.firstChild;
            if (c.nodeType == 1) {
               var s;
               customizedTags = (s = c.getAttribute("tag")) ? JSON.parse(s) : {};
            }
         }
			appendCustomizedTags(customizedTags);
         
			var chapters = [];
			if (sectionDividerTable.chapter) {
				var nodes = xmlDoc.evaluate(sectionDividerTable.chapter, xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
				var node;
				while (node = nodes.iterateNext()) {
					chapters.push( {type: "chapter", content: createXMLDocumentFromNode(node)} );
				}
			}
			else {
				chapters.push({type: "chapter", content: xmlDoc} );
			}

			var sections = [];
			var sectionDivider = sectionDividerTable.section               // 2018-05-05 wayne
			if (xmlDoc.firstChild.getAttribute('class') == 'doc edit') {	// 用來將 Markus 中的文件依 Passage 分段。
				sectionDivider = sectionDividerTable.edit_section
			}
			for (var i=0; i<chapters.length; i++) {
				sections.push({type: "chapter", content: []});
				var nodes = chapters[i].content.evaluate(sectionDivider, chapters[i].content, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
				var node;
				if (chapters.length === 1 && (node = nodes.iterateNext()) === null) {
              		 // 2017-08-17: MARKUS <div class='doc'><pre>
					var variants = ["/div[@class='doc']/pre", "/div[@class='doc']/span"];
					for (var j=0; j<variants.length; j++) {
						nodes = xmlDoc.evaluate(variants[j], xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
						node = nodes.iterateNext();
						if (node !== null) break;
					}
				}

				do {
					if (node) {
                  let s = (new XMLSerializer()).serializeToString(node);
						var node = (new DOMParser()).parseFromString(s, "text/xml");
						if (node.getElementById("metadataHidden") == undefined) {
							// node is of "Document" type (nodeType == 9)
							var nodeXml = (new XMLSerializer()).serializeToString(node);
							// tagTransformer ... tag ... <span type="passage" id="..."> ... type, id ...
							var typeValId = node.firstChild.getAttribute("id");    // ... passage ... id ... null
							//alert(typeValId);
                     //alert(nodeXml);
						   var transformedContent = tagTransformer(nodeXml);
						   sections[i].content.push({ type: "section", 
                                                typeValId: typeValId, 
                                                content: transformedContent
                                              });
						} 
					}
				} while (node = nodes.iterateNext());
			}

         //alert(JSON.stringify(sections));
			return sections;
		},

		mergeToContext: function( input ){
			var metadata = input.document.metadata;
			//var application = input.document.application;
			var sections = input.article;
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString( "<div class='doc'><pre contenteditable='false'></pre></div>" ,"text/xml");
			// metadata
			var rootNode = xmlDoc.evaluate("/div[@class='doc']", xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null).iterateNext();

			var filename = xmlDoc.createAttribute("filename");
			filename.value = ''
			for ( let i = 0; i < metadata.filename.length; i++) {
				let word = metadata.filename.charCodeAt(i)
				if (word > 127) {
					let temp = PINYIN_CACHE[metadata.filename[i]]
					if (temp)
						filename.value += temp[0].charAt(0).toUpperCase() + temp[0].slice(1)
					else
						filename.value += '_'
				} else {
					filename.value += metadata.filename[i]
				}
			}
			rootNode.setAttributeNode(filename);

			if( application.tag ){	// from feature_analysis
            //alert(JSON.stringify(application.tag));
				const tag = xmlDoc.createAttribute("tag");
				let result = '{ '
				for (let i in application.tag) {
					result += '"' + application.tag[i] + '":{'
					result += '"buttonName":"' + application.tag[i] + '",'
					result += '"visible":true,'
					result += '"color":"#333399",'           // 先簡單處理，全部設成相同顏色按鈕...
					result += '"status":""},'
				}
				result = result.substr(0, result.length-1) + '}'
				const test = JSON.parse(result) // check the tag json format
            //alert(JSON.stringify(test));
				tag.value = result
				rootNode.setAttributeNode(tag);
			} else if (metadata.doc_user_tagging) {	// from metadata user_defined_tagging
				const tag = xmlDoc.createAttribute("tag");
				let result = '{ '
				for (let i in metadata.doc_user_tagging) {
					result += '"' + i + '":{'
					result += '"buttonName":"' + i + '",'
					result += '"visible":true,'
					result += '"color":"#333399",'
					result += '"status":""},'
				}
				result = result.substr(0, result.length-1) + '}'
				const test = JSON.parse(result) // check the tag json format
            //alert(JSON.stringify(test));
				tag.value = result
				rootNode.setAttributeNode(tag);
			}
			
			// sections
			var sectionNumber = 0;
			for( var i = 0 ; i < sections.length ; i++ ) {
				let chapter = sections[i];
				for( var j = 0 ; j < chapter.content.length ; j++, sectionNumber++ ){
					let section = chapter.content[j]
					
					// comment
				 	const firstContent = section.content[0]
					let comment = ''
					let k = 0	// section number
                    if (firstContent && firstContent.type === 'CommentItem') {
						k = 1	// section number
						comment += '&quot;'
						for (let t = 0; t < firstContent.content.length; t++) {
							let word = firstContent.content.charCodeAt(t)
							if (word > 127) {	//  中文偵測
								comment += '&amp;#(' + word + ');'
							} else if (word == 34 || word == 39) {	// parse ' and "
								comment += '\\&quot;'
							} else {
								comment += firstContent.content[t]
							}
						}
						comment += '&quot;'
					}
               
               // 從 DocuXml 轉回 Markus Html，有些地方沒辦法一對一直接轉換完成（例如 relations_data 需從 <Event> 提取再填入先前產出的某標籤內）
					var context = '<span class="passage" type="passage" id="passage' + (sectionNumber) + '"><span class="commentContainer" value="[' + comment +']"><span class="glyphicon glyphicon-comment" type="commentIcon" style="" aria-hidden="true" data-markus-passageid="passage' + sectionNumber + '">\n</span></span>';
					var eventsBuilder = new DocuXMLEventsBuilder();
					for( k ; k < section.content.length ; k++ ){
						if (section.content[k].type == "Events") {
							for (var event of Object.values(section.content[k].content)) {
                        //alert(JSON.stringify(event));
								var relType = event['relType'];
								var relMeta = event['relMeta'];
								var sourceId = event['sourceId'];
								var targetId = event['targetId'];
								var SourceTagRelDataId = event['SourceTagRelDataId'];
								if (firstContent && firstContent.type === "CommentItem") {
									SourceTagRelDataId = parseInt(SourceTagRelDataId) + 1;
								}
								eventsBuilder.addEvent(relType, relMeta, sourceId, targetId, SourceTagRelDataId);
							}
                     //console.log(eventsBuilder.events);
                     //alert(JSON.stringify(eventsBuilder.events));
						} else {
							context += generateTag( section.content[k] )
						}
					}
					context += "</span>";
					context = context.replace(/\n[\s\n\t]*\n/g, '\n')// 2019-04-01 Wayne: Markus 自動分段問題
					appendAllChildren(context, xmlDoc.getElementsByTagName("div")[0].getElementsByTagName("pre")[0] );
					eventsBuilder.mappingPositionToRelationsData();
               //alert(JSON.stringify(eventsBuilder.positionToRelationsData));
					if (eventsBuilder.hasEvent()) {
                  // 2020-11-04 TODO (to fix): 
                  //   如果 relation 的節點是在另外一篇文件，
                  //   這裡的 append 似乎就沒辦法將所需的 relations_data 放回 Markus Html？
						appendRelationsData(eventsBuilder, xmlDoc);          // utility.js
					}
				}
			}
			const metadataXmlString = metadataObjToXmlString(metadata)
			const metadataAttr = xmlDoc.createAttribute("data-docusky-metadata");
			metadataAttr.value = '{' 
			+  metadataXmlString.substr(0, metadataXmlString.length -2)
			+ '}'
			rootNode.setAttributeNode(metadataAttr)
			return (new XMLSerializer()).serializeToString(xmlDoc) ;
		}
	};
})();
