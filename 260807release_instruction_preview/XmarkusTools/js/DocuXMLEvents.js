var DocuXMLEventsBuilder = function() {
    this.events = [];
    this.markusRelIdToTag = {}
    this.positionToRelationsData = {}

    this.setMarkusRelIdToTag = function(markusRelIdToTag) {
        this.markusRelIdToTag = markusRelIdToTag;
    }
    this.getPositionToRelationsData = function() {
        return this.positionToRelationsData;
    }
    this.parseMarkusRelationsData = function(linkdata) {
        try {
            return JSON.parse(atob(linkdata.relations_data)) // atob() 支援 IE 9 以上版本：base64 解碼
        } catch (e) {
            alert('未能正常解析關係資料')
        }
    };
    
    this.mappingPositionToRelationsData = function() {
      //alert(JSON.stringify(this.events));
      for (var event of this.events) {
         var relation = event.getRelation();
         var position = event.getSourceTagRelDataId();
         var relType = relation.getRelType();
         var relMeta = relation.getRelMeta();
         var sourceId = relation.getSourceId();
         var targetId = relation.getTargetId();
         //console.log(relation);
         //console.log(position);
         //console.log(relType);
         //console.log(relMeta);
         //console.log(sourceId);
         //console.log(targetId);
         //alert(JSON.stringify(event));

         //alert(JSON.stringify(this.positionToRelationsData));
         if (position in this.positionToRelationsData)   {
            if (this.positionToRelationsData[position]['id'] == sourceId) {
                this.positionToRelationsData[position]['relations'].push({dest: targetId, type: relType, meta: relMeta})
            } else {
                console.error(position, sourceId)
                alert("Event 於 Markus 的位置出錯，未能正常產生 relations_data")
            }
         } else {
            this.positionToRelationsData[position] = {id: sourceId, relations:[]}
            if (targetId !== undefined) {
                this.positionToRelationsData[position]['relations'].push({dest: targetId, type: relType, meta: relMeta});
            }
         }
         //alert(JSON.stringify(this.positionToRelationsData));
      }
    };
    
    this.hasEvent = function() {
        return (this.events.length > 0);
    };
    
    this.addEvent = function(relType, relMeta, sourceId, targetId, sourceTagRelDataId) {
        // 目前轉換僅支持 DocuXML 中的 Markus BinRelation
        var binRelation = this.createBinRelation(relType, relMeta, sourceId, targetId);
        this.events.push((new DocuXMLEvent(binRelation, sourceTagRelDataId)));
    };
    
    this.addEventFromMarkus = function(markusRelationsData, sourceTagRelDataId) {
        // MarkusRelationsData 的格式為 {id, {type, meta, dest}}
        for (var relation of Object.values(markusRelationsData.relations)) {
            var relType = relation['type'];
            var relMeta = relation['meta'];
            var sourceId = markusRelationsData['id'];
            var targetId = relation['dest'];
            var binRelation = this.createBinRelation(relType, relMeta, sourceId, targetId);
            //alert(JSON.stringify(binRelation) + "\n" + sourceId + " -> " + targetId);
            this.events.push((new DocuXMLEvent(binRelation, sourceTagRelDataId)));
            //alert(JSON.stringify(this.events));
        }
    };
    
    this.createBinRelation = function (relType, relMeta, sourceId, targetId) {
        //alert(" => " + JSON.stringify(this.markusRelIdToTag) + "\n" + sourceId + "\n" + targetId);
        var binRelation = new BinRelation();
        binRelation.setRelType(relType);
        binRelation.setRelMeta(relMeta);
        binRelation.setSourceId(sourceId);
        binRelation.setSourceTag(this.markusRelIdToTag[sourceId]);
        binRelation.setTargetId(targetId);
        binRelation.setTargetTag(this.markusRelIdToTag[targetId]);
        //alert(JSON.stringify(binRelation));
        return binRelation
    };
    
    this.toDocuXMLTag = function() {
        var DocuXMLTag = '<Events>';
        for (var event of Object.values(this.events)) {
            DocuXMLTag += event.toDocuXMLTag();   
        }
        return DocuXMLTag + '</Events>';
    }
}

var DocuXMLEvent = function (relation, sourceTagRelDataId) {
    this.relation = relation;
    this.sourceTagRelDataId = sourceTagRelDataId;

    this.setRelation = function (relation) {
        this.relation = relation;
    }
    this.setSourceTagRelDataId = function (sourceTagRelDataId) {
        this.sourceTagRelDataId = sourceTagRelDataId;
    }
    this.getRelation = function() {
        return this.relation;
    }
    this.getSourceTagRelDataId = function() {
        return this.sourceTagRelDataId;
    }
    this.toDocuXMLTag = function() {
        try {
            //return "<Event SourceTagRelDataId='" + this.sourceTagRelDataId + "'>" + relation.toDocuXMLTag() + "</Event>";
            // 2020-11-06: SourceTagRelDataId 改放 relation 的 sourceId（因此應改稱為 MarkusRelationSourceId 較合適）
            //alert(JSON.stringify(relation));
            return "<Event SourceTagRelDataId='" + relation.sourceId + "'>" + relation.toDocuXMLTag() + "</Event>";
        } catch (e) {
            alert("未能正常產生 Event 標籤");
            console.error(relation);
            console.error(e);
        }
    } 
}

var BinRelation = function() {
    this.relType;
    this.relMeta;
    this.sourceId;
    this.sourceTag;
    this.targetId;
    this.targetTag;

    this.setRelType = function(relType) {
        this.relType = relType;
    }
    this.setRelMeta = function(relMeta) {
        this.relMeta = relMeta;
    }
    this.setSourceId = function(sourceId) {
        this.sourceId = sourceId;
    }
    this.setSourceTag = function(sourceTag) {
       this.sourceTag = sourceTag;            // 注意：sourceTag 是個 DOM Element
    }
    this.setTargetId = function(targetId) {
       this.targetId = targetId;
    }
    this.setTargetTag = function(targetTag) {
       this.targetTag = targetTag;            // 注意：targetTag 是個 DOM Element
    }

    this.getRelType = function(relType) {
        return this.relType;
    }
    this.getRelMeta = function (relMeta) {
        return this.relMeta;
    }
    this.getSourceId = function() {
        return this.sourceId;
    }
    this.getTargetId = function() {
        return this.targetId;
    }

    this.toDocuXMLTag = function() {
        if (this.relType === undefined) this.relType = "";
        if (this.relMeta === undefined) this.relMeta = "";
        if (this.sourceTag === undefined) throw Error("缺少來源標籤")
        if (this.targetTag === undefined) {
            // 2019-12-11: 發現 <source> 是 HTML5 的標籤名稱... 將 <Source>, <Target> 改為 <RelSource>, <RelTarget>
            //             將凡煒原先使用的 "type", "meta" 改為 Pascal style 的 "Type", "Meta"
            // 2020-11-09: 對 DocuXml 而言， @MarkusRelId 似乎是多餘的屬性，但... 不能僅從這裡將屬性移除（要移除似乎需花頗多力氣）...
            var DocuXMLTag =  "<BinRel Type='" + this.relType + "' Meta='" + this.relMeta + "'>" +
                "<RelSource MarkusRelId='" + this.sourceId + "'>" + this.sourceTag.outerHTML + "</RelSource>" +
                "<RelSource>" + this.sourceTag.outerHTML + "</RelSource>" +
                "</BinRel>";
                return DocuXMLTag;
            } 
        else {
            var DocuXMLTag =  "<BinRel Type='" + this.relType + "' Meta='" + this.relMeta +  "'>" +
                "<RelSource MarkusRelId='" + this.sourceId + "'>" + this.sourceTag.outerHTML + "</RelSource>" +
                "<RelTarget>" + this.targetTag.outerHTML + "</RelTarget>" +
                "</BinRel>";
            }
            return DocuXMLTag;
        }

}
// var RelationTag  = function(tagName, markusRelId, content) {
//     this.tagName = tagName;
//     this.markusRelId = markusRelId;
//     this.content = content;

//     this.setTagName = function(tagName) {
//         this.tagName = tagName;
//     }
//     this.setMarkusRelId = function(markusRelId) {
//         this.markusRelId = markusRelId;
//     }
//     this.setContent = function(content) {
//         this.content = content;
//     }
//     this.setTagNameAndContentFromDocuXMLTag = function(DocuXMLTag) {
//         try {
//             this.tagName = DocuXMLTag.tagName;
//             this.content = DocuXMLTag.innerHTML;
//         } catch(e) {
//             console.log("未能建立標籤：" + e);
//         }
//     }
// }

// var RelationSourceTag = function(tagName, markusRelId, content) {
//     RelationTag.call(this, tagName, markusRelId, content);

//     this.toDocuXMLTag = function() {
//         if (this.tagName === undefined || this.markusRelId === undefined || this.content === undefined) {
//             throw new Error("Source 標籤缺少屬性")
//         }
//         return "<Source><" + sourceTag.tagName + " MarkusRelId=" + sourceTag.markusRelId + ">" + sourceTag.content + "</" + sourceTag.tagName + "></Source>";
//     }
// }

// var RelationTargetTag = function (tagName, markusRelId, content) {
//     RelationTag.call(this, tagName, markusRelId, content);

//     this.toDocuXMLTag = function() {
//         if (this.tagName === undefined || this.markusRelId === undefined || this.content === undefined) {
//             throw new Error("Target 標籤缺少屬性")
//         }
//         return "<Target><" + targetTag.tagName + " MarkusRelId=" + targetTag.markusRelId + ">" + targetTag.content + "</" + targetTag.tagName + "></Target>";
//     }
// }
