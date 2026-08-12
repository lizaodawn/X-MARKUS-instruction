var STAMLTransformer = (function(){

	function STAMLTransformer(functions){
		for( var key in functions ){
			this[key] = functions[key];
		}
	}

	STAMLTransformer.prototype.transform = function(context) {
	   // 若轉換成 STAML 途中有錯漏，就很可能是因為以下的 merge() 沒處理好  
      //alert("1:" + JSON.stringify(this.articleInformation(context)));
		let mergedContext = this.merge( this.documentInformation(context),
                                      this.articleInformation(context) );
      //alert("2:" + JSON.stringify(mergedContext));
      return mergedContext;
	}


	STAMLTransformer.prototype.transformBack = function(STAMLcontext) {
      //alert('transformBack1: ' + JSON.stringify(STAMLcontext));
		var contextObj = this.unmerge(STAMLcontext);
      //alert('transformBack2: ' + JSON.stringify(contextObj));     // 2017-04-07: allows content to be an array...
		var result = this.mergeToContext(contextObj);
		// result: e.g., ThdlExportXml, MarkusHtml
      //alert('transformBack3: ' + JSON.stringify(result));
      return result;
	}

	/*
	STAMLTransformer.prototype.recursiveXML = function(node, userdata, linkdata ){
		var nodeData = { type: node.nodeName };
		if( node.hasAttribute("subtype") ){
			nodeData.subtype = node.getAttribute("subtype") ;
		}

		if( node.hasAttribute("userdataRef") ){
			nodeData.userdata = userdata[node.getAttribute("userdataRef")];
		}

		if( node.hasAttribute("linkdataRef") ){
			nodeData.linkdata = linkdata[node.getAttribute("linkdataRef")];
		}

		for( var i = 0 ; i < node.childNodes.length ; i++ ){
			if( node.childNodes[i].nodeType === 3 ){
				nodeData.content = node.childNodes[i].nodeValue;
			}
			else if( node.childNodes[i].nodeType === 1 ){
				nodeData.content = this.recursiveXML(node.childNodes[i], userdata, linkdata);
			}
		}

		return nodeData;
	}
	
	STAMLTransformer.prototype.XMLtoContent = function(xmlNode, userdata, linkdata){
		if( xmlNode.childNodes.length === 1 && xmlNode.firstChild.nodeType === 3 ){
			return xmlNode.firstChild.nodeValue;
		}

		var result = [];
		var childNodes = xmlNode.childNodes;
		for( var i = 0 ; i < childNodes.length ; i++ ){
			if( childNodes[i].nodeType === 3 ){
				result.push( childNodes[i].nodeValue.escape() );
			}
			else if( childNodes[i].nodeType === 1 ){
				result.push( this.recursiveXML(childNodes[i], userdata, linkdata) );
			}
		}

		return result;
	}
	*/
	STAMLTransformer.prototype.XMLtoObject = function(xmlNode){
		if( xmlNode.childNodes.length === 1 && xmlNode.firstChild.nodeType === 3 ){
			return xmlNode.firstChild.nodeValue.escape();
		}
		
		var object = {};
		var childNodes = xmlNode.childNodes;
		for( var i = 0 ; i < childNodes.length ; ++i ){
			if( object[childNodes[i].nodeName] !== undefined ){
				if( !Array.isArray(object[childNodes[i].nodeName]) ){
					object[childNodes[i].nodeName] = [ object[childNodes[i].nodeName] ];
				}
				object[childNodes[i].nodeName].push(this.XMLtoObject(childNodes[i]));
			}
			object[childNodes[i].nodeName] = this.XMLtoObject(childNodes[i]);
		}
		
		return object;
	}
	
	STAMLTransformer.prototype.XMLtoTaggedObject = function(isArray, setting, xmlNode){
		if( xmlNode.childNodes.length === 1 && xmlNode.firstChild.nodeType === 3 ){
			return xmlNode.firstChild.nodeValue.escape();
		}

      //alert((new XMLSerializer()).serializeToString(xmlNode));
      
		var array = [];
		var childNodes = xmlNode.childNodes;
		for( var i = 0 ; i < childNodes.length ; ++i ){
			if( childNodes[i].nodeType === 3 ){
				array.push(childNodes[i].nodeValue.escape());
				continue;
			}
			
			var object = {};
			object.type = childNodes[i].nodeName;
 			
			if( childNodes[i].hasAttribute("subtype") ){
				object.subtype = childNodes[i].getAttribute("subtype");
			}
			// Tu: 20170410 (note: "refId" here but not "typeValId" anymore)
			if( childNodes[i].hasAttribute("RefId") ) {
				object.refId = childNodes[i].getAttribute("RefId");
			}
			if( childNodes[i].hasAttribute("Term") ) {
				object.Term = childNodes[i].getAttribute("Term");
			}
			if( childNodes[i].hasAttribute("Type") ) {
				object.Type = childNodes[i].getAttribute("Type");
			}
			if( childNodes[i].hasAttribute("CbdbId") ) {
				object.CbdbId = childNodes[i].getAttribute("CbdbId");
			}
			if( childNodes[i].hasAttribute("Category") ) {
				object.Category = childNodes[i].getAttribute("Category");
			}
			if( childNodes[i].hasAttribute("Key") ) {           // 2018-05-05
				object.Key = childNodes[i].getAttribute("Key");
			}
			if( childNodes[i].hasAttribute("TagForConversion") ) {
				object.tagForConversion = childNodes[i].getAttribute("TagForConversion");
			}
			if( childNodes[i].hasAttribute("relType") ) {      // Note: 在此未採取首字大寫，將來維護上可能會麻煩許多...
				object.relType = childNodes[i].getAttribute("relType");
			}
			if( childNodes[i].hasAttribute("relMeta") ) {
				object.relMeta = childNodes[i].getAttribute("relMeta");
			}
			if( childNodes[i].hasAttribute("sourceId") ) {
				object.sourceId = childNodes[i].getAttribute("sourceId");
			}
			if( childNodes[i].hasAttribute("targetId") ) {
				object.targetId = childNodes[i].getAttribute("targetId");
			}
         // 2020-11-06: 原本是凡煒制訂的 MarkusContentPosition，改為 SourceTagRelDataId
			if( childNodes[i].hasAttribute("SourceTagRelDataId") ) {
				object.SourceTagRelDataId = childNodes[i].getAttribute("SourceTagRelDataId");
			}
         // 2020-11-05: Tu （注意，是 TagRelDataId，不是 TagRefDataId）
			if( childNodes[i].hasAttribute("TagRelDataId") ) {
				object.TagRelDataId = childNodes[i].getAttribute("TagRelDataId");
            //alert(JSON.stringify(object));
			}

         //alert(JSON.stringify(object));
			for( var name in setting ){
				if( childNodes[i].hasAttribute(name+"Ref") ){
					object[name] = setting[name][childNodes[i].getAttribute(name+"Ref")];
				}
			}
				
			var nextIsArray = (object.type === "chapter" || object.type === "section");
			if( childNodes[i].nodeName == "MetaTags") { // 2019-09-26 Wayne: Supported MetaTags
				object.content = []
				for (var tag of Object.values(childNodes[i].childNodes)) {
					var temp = {}
					for (var attribute of Object.values(tag.attributes)) {
						temp[attribute.name] = attribute.nodeValue;
					}
					object.content.push(temp)
				}
			} else {
				object.content = this.XMLtoTaggedObject(nextIsArray, setting, childNodes[i]);
			}
			array.push(object);
		}
      //alert(childNodes.length + "\n" + (new XMLSerializer()).serializeToString(xmlNode));
      //alert("Continue" + "\n" + JSON.stringify(array) + "\n" + isArray);
      return array;
      
		//if( !isArray ){
      //   return { content: array };
		//}
		//else {
	   //		return array;
		//}
	}
	
	
	STAMLTransformer.prototype.objectToXML = function(object){
		if( String.isString(object) ){
			return object.escape();
		}
		
		if( Array.isArray(object) ){
			return object.map(this.objectToXML.bind(this)).join("");
		}
		
		var xmlString = "";
		for( var key in object ){
			if( key === "#text" ){
				xmlString += object[key];
				continue;
			}
			xmlString += "<" + key + ">" + this.objectToXML(object[key]) + "</" + key + ">";
		}
		return xmlString;
	}
	
	STAMLTransformer.prototype.taggedObjectToXML = function(setting, object){
      //alert(JSON.stringify(object));
		if( String.isString(object) ){
			return object.escape();
		}
		
		if( Array.isArray(object) ){
			return object.map(this.taggedObjectToXML.bind(this, setting)).join("");
		}
		if( !object.type ){
			return this.objectToXML(object);
		}
		if ( object.type == "MetaTags" ) {
			if (object.content && object.content.length > 0) {
				var xmlString = "<MetaTags>";
				for (var tag of Object.values(object.content)) {
					xmlString += "<" + tag.type;
					for (var attribute of Object.keys(tag)) {
						xmlString += " " + attribute + "='" + tag[attribute] + "'";
					}
					xmlString += "></" + tag.type + ">"; 
				}
				xmlString += "</MetaTags>";
			}
			return xmlString;
		} else if (object.type == "Event") {
				var xmlString = "<Event";
				for (var attribute of Object.keys(object)) {
					xmlString += " " + attribute + "='" + object[attribute] + "'";
				}
				xmlString += ">" + this.taggedObjectToXML(setting, object.content) + "</Event>";
				return xmlString;
		}
		var xmlString = "<";
		//console.log(object);
		xmlString += object.type;
		
		if ( object.subtype ){
			xmlString += " subtype='" + object.subtype + "'";
		}
      // Tu: 20170410      
		if (object.typeValId) {
			xmlString += " refId='" + object.typeValId + "'";
		}
		if (object.Term) {
			xmlString += " Term='" + object.Term + "'";
		}
		if (object.Category) {
			xmlString += " Category='" + object.Category + "'";
		}
		if (object.CbdbId) {
			xmlString += " CbdbId='" + object.CbdbId + "'";
		}
		if (object.RefId) {
			xmlString += " RefId='" + object.RefId + "'";
		}
		if (object.Type) {
			xmlString += " Type='" + object.Type + "'";
		}
		if (object.Key) {
		    xmlString += " Key='" + object.Key + "'";
		}
		if (object.TagForConversion) {
			xmlString += " TagForConversion='" + object.TagForConversion + "'";
		}
      if (object.TagRelDataId) {       // 2020-11-06: Tu （注意 TagRelDataId 首字是大寫）
         xmlString += " TagRelDataId='" + object.TagRelDataId + "'";
      }
		for( var name in setting ){        // name: userdata, linkdata
			if( object[name] !== undefined ){
				xmlString += " " + name + "Ref='" + setting[name].length + "'";
				object[name]["refID"] = setting[name].length.toString();
				setting[name].push(object[name]);
			}
		}
		xmlString += ">";
		
		xmlString += this.taggedObjectToXML(setting, object.content);
		
		xmlString += "</" + object.type + ">";
		return xmlString;
	}

	STAMLTransformer.prototype.merge = function(document, article){
		/*
			document : {
									 metadata: { title: ...., author: ...., date: ....., .......},
									 userdata: { ....... },
									 linkdata: { ....... },
									 application: { ....... }
								 }

			article : [{
									type: "chapter",
									content: [
															{
																type: "section",
                                                typeValId: sectionId (optional)   // 20170410: Tu 
																content: [
																	".....",
																	{
																		type: "person event datetime location thing comment",
																		content: {
																			type: "person event datetime location thing",
																			content: "",
																			userdata: { ....... },
			 																linkdata: { ....... },
			 																application: { ....... }
																		},
																		userdata: { ....... },
		 																linkdata: { ....... },
		 																application: { ....... }
																	}, ....
																],
																userdata: { ....... },
 																linkdata: { ....... },
 																application: { ....... }
															}, .....
													 ],
									userdata: { ....... }
									linkdata: { ....... }
									application: { ....... }
								},
								...... ]

		*/

	   //alert(JSON.stringify(article));
		var xmlString = "<STAML><metadata></metadata><article></article><application></application><userdata></userdata><linkdata></linkdata></STAML>";
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(xmlString, "text/xml");

		var setting = { userdata: [], linkdata: [], application: [] };
		var itemName = { userdata: "data", linkdata: "link", application: "appdata"};
		
		/* metadata */
		var metadata = (Array.isArray(document.metadata)) ? document.metadata[0] : document.metadata; // 2019-04-01 wayne: 判斷 metadata 是不是陣列
		var metadataNode = xmlDoc.getElementsByTagName("metadata")[0];
		for( var key in metadata ){
			if (key == '#text') continue;        // 2016-10-17: Tu
			if( setting[key] !== undefined ){
				var attribute = xmlDoc.createAttribute(key + "Ref");
				attribute.value = setting[key].length.toString();
				metadata[key]["refID"] = setting[key].length.toString();
				setting[key].push(metadata[key]);
				metadataNode.setAttributeNode(attribute);
			}
			else {
				var result = this.objectToXML(metadata[key]);
				var node = xmlDoc.createElement(key);
				appendAllChildren( result, node );
				metadataNode.appendChild(node);
			}
		}
		/* article */
		var articleNode = xmlDoc.getElementsByTagName("article")[0];
		//alert('ARTICLE1: ' + JSON.stringify(article));                // article is a JSON object (argument)
      var articleXml = this.taggedObjectToXML(setting, article);    // note: setting will be changed here
		//alert('ARTICLE2: ' + articleXml);
		appendAllChildren( articleXml, articleNode );
	
      // alert(JSON.stringify(setting));
		/* now the setting contains the required 'userdata', 'linkdata', 'application' (extracted from article) */
		for( var key in setting ){
			var node = xmlDoc.getElementsByTagName(key)[0];
			if( document[key] !== undefined ){
				appendAllChildren( "<" + itemName[key] + ">" + this.objectToXML(document[key]) + "</" + itemName[key] + ">", node);
			}
			
			for( var i = 0 ; i < setting[key].length ; ++i ){
				appendAllChildren( "<" + itemName[key] + ">" + this.objectToXML(setting[key][i]) + "</" + itemName[key] + ">", node);
			}
		}
		return new XMLSerializer().serializeToString(xmlDoc);
	}

	STAMLTransformer.prototype.unmerge = function(STAMLcontext){
		//var metadata = {}, sections = [], application = [];
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(STAMLcontext, "text/xml");

		var setting = { userdata: [], linkdata: [], application: [] };
		var itemName = { userdata: "data", linkdata: "link", application: "appdata"};
		
		var document = { metadata: {} }, article = {};
		/* userdata, linkdata, application */
		for( var key in setting ){
			var node = xmlDoc.getElementsByTagName(key)[0];
			var childNodes = node.childNodes;
			
			for( var i = 0 ; i < childNodes.length ; ++i ){
				if( childNodes[i].hasAttribute("refID") ){
					setting[key][childNodes[i].getAttribute("refID")] = this.XMLtoObject(childNodes[i]);
				}
				else{
					document[key] = this.XMLtoObject(childNodes[i]);				
				}
			}
		}
		
		/* article */
		var articleNode = xmlDoc.getElementsByTagName("article")[0];
	   //alert('A1: ' + (new XMLSerializer()).serializeToString(articleNode));
		article = this.XMLtoTaggedObject(true, setting, articleNode);
      //alert('A2: ' + JSON.stringify(article));
		
		/* metadata */
		var metadataNode = xmlDoc.getElementsByTagName("metadata")[0];
		var metadataChildNodes = metadataNode.childNodes;
		for( var i = 0 ; i < metadataChildNodes.length ; ++i ){
			var isRef = false;
			for( var key in setting ){
				if( metadataChildNodes[i].nodeName == key + "Ref" ){
					document.metadata[metadataChildNodes[i].nodeName] = setting[key][metadataChildNodes[i].value];
					isRef = true;
					break;
				}
			}
			
			if( !isRef ){
				document.metadata[metadataChildNodes[i].nodeName] = this.XMLtoObject(metadataChildNodes[i]);
			}
		}
		
		return {
			document: document,
			article: article
		};
	}
	return STAMLTransformer;
})();
