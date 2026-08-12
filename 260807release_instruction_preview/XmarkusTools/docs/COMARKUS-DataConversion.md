# COMARKUS Data Transforamation

---

## 1. Introduction

**Comarkus2D** is a tool which converts data from the annotated output of **ENTMARKUS**
and **COMARKUS** to an **X-MARKUS XML** file which is compatible to the **DocuXml** format.

Comarks2D reuses the **M2D** (MARKUS to DocuSky) tool which converts the MARKUS .html files 
to an XML file with DocuXml format.  Based on the converted XML, Comarkus2D attaches the 
COMARKUS event annotations and metadata to get the final result.



---

## 2. Sample Files

To illustrate Comarkus2D data transformation, we will use the following sample files as inputs:
- ENTMARKUS output: <a href="./docs/comarkus-data-transform-samples/Fujian Bridge Sample/Wanli_ZhengheXianzhi_Juanzhiba_Cihanzhi_ZouXixian_Xiningqiaoji.txt_markus_event.html">HTML</a>
- COMARKUS json file: <a href="./docs/comarkus-data-transform-samples/Fujian Bridge Sample/Wanli_ZhengheXianzhi_Juanzhiba_Cihanzhi_ZouXixian_Xiningqiaoji.txt_markus_event.json">JSON</a>
- COMARKUS metadata file: <a href="./docs/comarkus-data-transform-samples/Fujian Bridge Sample/xmarkus-metadata.json">JSON</a>

The converted outputs
- Option *Show all events as separate documents*
  <a href="./docs/comarkus-data-transform-samples/DocuXml/c2d-COMARKUS-CORPUS.xml">XML</a>
- Option *Show source texts with their events as separate documents*
  <a href="./docs/comarkus-data-transform-samples/c2d-COMARKUS-CORPUS-Evt2Doc.xml">XML</a>

The JSON annotation file contains 3 events.  The following screenshots illustrate the conversion
of the second event.  

The JSON structure of the second event annotation:


![JSON of the 2nd event](./docs/comarkus-data-transform-samples/images/JsonEventBeforeConversion.png "annotated JSON of the second event")

The converted XML of the second event, with metadata and annotation:

![XML of the 2nd event](./docs/comarkus-data-transform-samples/images/XmlEventAfterConversion.png "converted XML of the second event")
  

---

## 3. Metadata JSON

- piece title: `<Udef_DocMeta_piece_title>熈寧橋記</Udef_DocMeta_piece_title>`
- piece author: <Udef_DocMeta_piece_author>鄒希賢(207492)</Udef_DocMeta_piece_author>
- piece time: <Udef_DocMeta_piece_time>丁酉(公元1597年:明神宗)</Udef_DocMeta_piece_time>
- place covered: <Udef_DocMeta_place_covered>政和(hvd_40253)</Udef_DocMeta_place_covered>
- source title: <Udef_DocMeta_source_title>政和縣志</Udef_DocMeta_source_title>
- source author: <Udef_DocMeta_source_author>-</Udef_DocMeta_source_author>
- publication place: <Udef_DocMeta_publication_place>-</Udef_DocMeta_publication_place>
- publication time:<Udef_DocMeta_publication_time>萬曆(16)</Udef_DocMeta_publication_time>


The JSON structure of the document metadata:

![metadata JSON for the document](./docs/comarkus-data-transform-samples/images/JsonEventMetadata.png "JSON of the document metadata")


The converted metadata is located under the `<xml_metadata>` tag:

![xml_metadata](./docs/comarkus-data-transform-samples/images/XmlUdefDocMetadata.png "xml_metadata")


---

## 4. COMARKUS DocuXml tags

The converted DocuXml contains several types of tags.

- **Date**, **PersonName**, **LocName**, **Office**: the "standard" tags used in
  MARKUS annotations.

- **Udef_\<subject\>**: user-defined tags for annotating text terms (M2D 
  tags).  Example tags include **Udef_work**, **Udef_object**, **Udef_object_part**, 
  etc.
  
- **Udef_Evt_\<subject\>**: event tags converted from COMARKUS JSON files.
  Example tags are **Udef_Evt_BENEFICIARY**, **Udef_Evt_COST**, **Udef_Evt_EVENT**,
  **Udef_Evt_EVENT_CAUSE**, **Udef_Evt_OBJECT_MAIN**, **Udef_Evt_OBJ_PART**,
  etc.
  
- **Udef_Evt_\<subject\>.GenreL1** and **Udef_Evt_\<subject\>.GenreL2**:
  For instance, **Udef_Evt_EVENT.GenreL1** and **Udef_Evt_EVENT.GenreL2**.
  
- **Udef_Event_Element**: for describing an event element.  For instance,
  `<Udef_Event_Element>TIME/BEGIN/1556-03/丙辰之二月</Udef_Event_Element>`.
  
- **Udef_DocMeta_\<subject\>**: serves as document metadata.  Some examples are
  **Udef_DocMeta_piece_title**, **Udef_DocMeta_piece_author**, 
  **Udef_DocMeta_piece_time**, etc.
  
- **Udef_Align_\<subject\>**: tags for aligning COMARKUS event annotations 
  and IMMARKUS image annotations.  Example: **Udef_Align_OBJECT**.

  
  