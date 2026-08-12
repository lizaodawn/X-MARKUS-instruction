# X-MARKUS Code Overview

---

# 1. Introduction

The **X-MARKUS** platform is written by HTML, CSS and JavaScript.  It works locally
without the need to store any user data in any server.  Currently it only works on 
Chronium-based browsers (such as Chrome and Microsoft Edge).  But if you don't need
to use Immarkus2D which converts IMMARKUS data to **DocuXml**, you may use Firefox 
without any problem.

X-MARKUS does not rely on modern JavaScript frameworks such as Angular, React, 
or Vue.  This means that one may use a simple text editor to modify the source 
code.  X-MARKUS does, however, heavily use **jQuery** to control the DOM elements 
and to manage the content of XML.

All the source code is public and has not been encrypted or obfuscated.  Most 
of the code includes inline comments written in Traditional Chinese.  This 
documentation outlines the logic and structure of the X-MARKUS code.    

---

# 2. Entry Point and Its Components

The following lists the entry point and tools of the X-MARKUS platform:
- **X-MARKUS.html**: the entry point of this platform which contains the following
  `iframe` HTML code.
- **XmarkusPlatform-Introduction.html**: a static page for X-MARKUS information
- **XmarkusPlatform-Converting.html**: the code of the `iframe` for data conversion.  It
  includes **Comarkus2D.html** for converting ENTMARKUS/COMARKUS exports and 
  **Immarkus2D.html** for converting IMMARKUS data.
- **DocuMerger.html**: a page for merging multiple databases (i.e., DocuXml files)
- **XmarkusAnalyzer.html**: the code for the search interface
- **EventConnectionGraph.html**: the code for the visualising tool
- **XmarkusPlatform-Help.html**: provides the help documentation

The X-MARKUS tools reuse open-sourced components.  For instance, the **Comarkus2D.html**
reuses code from the 
[M2D](https://docusky.org.tw/docusky/docuTools/MarkusConverter/Markus2DocuXml.html) 
(MARKUS to DocuXml) tool developed by the NTU (National Taiwan University) 
[DocuSky](https://docusky.org.tw/docusky) team, and many tools heavily use the 
open-sourced *jquery* library for controlling DOM elements.  In addition, it uses 
the *d3* library for visualising, and applies other open-sourced JavaScript 
components such as *pagination* and *tabulator* for faster development.

The following screenshot shows the code organization:

![Organization of the Code Components](./docs/images/code-folder-structure.png) 

The entry point and tools are located under the root folder, which is *XmarkusTools* in 
the screenshot.  Open-sourced components can be found in the *components* subfolder.
The *js*, *css* and *images* subfolders store all the X-MARKUS JavaScript source code,
the required CSS page settings, and the images for HTML pages.  The *docs* and *samples*
subfolders contain documentation and sample files.



# 2.1 Open-source components used

X-MARKUS uses open-sourced JavaScript components to ease development.  They are
located under the folder `components`, where subfolder `js` contains
the JavaScript code and the `css` subfolder contains the required CSS files.

- **d3.js** (or its minimized version **d3.min.js**)

- **docusky.ui.getDbCorpusDocumentsSimpleUI.js** and **docusky.ui.manageDbListSimpleUI.js**

- **download.js**

- **FileSaver.min.js**

- **jquery-3.6.0.min.js** (**jquery.min.js**)

- **jquery.mark.js** (or its minimized version **jquery.mark.min.js**)

- **jquery-ui.min.js**

- **jszip.js** (or its minimized version **jszip.min.js**)

- **marked.min.js**

- **pagination.js** (or its minimized version **pagination.min.js**)

- **require.js** and **select2.min.js** (not used in the final version?)

- **tabulator.js** (or its minimized version **tabulator.min.js**)

- **treejs-customized.js**


---


# 3. Code Logic and Structure

The following is a brief description of the code.


## 3.1 X-MARKUS.html

It is the entry point of the entire platform.  It serves the following functionalities:

- Provides a left-hand sidebar for the user to select the three major X-MARKUS 
  tools: 
  the **converting page**, the **searching and filtering interface**, and the 
  **knowledge graph for visualising relations**.
  
- Offers a mechanism for communication between the major tools.  For instance, when
  the user finishes data conversion, it may download the converted XML or go directly to
  the **searching and filtering interface** to see the result.  The latter requires to
  pass message from the **converting page** to X-MARKUS.html, and X-MARKUS.html will
  forward the message to the **searching and filtering interface**.
  
- X-MARKUS is assumed to run under the Chromium-based browsers such as Google Chrome
  or Microsoft Edge.  These browsers provide the **File System Access API** for 
  reading or saving data directly to files and folders on the user's device.
  X-MARKUS.html implements the basic functions for getting **DirHandle** and the
  converted image URL required for IMMARKUS data conversion.

  
---

  
## 3.2 XmarkusPlatform-Converting.html

It is the `iframe` page which provides the UI for converting ENTMARKUS/COMARKUS or
IMMARKUS data to an XML file.  The XML file integrates texts, entity annotations, 
event clusters, and image markups for later analysis and applications.

[Contextual Semantic Text and Image Annotation in the MARKUS Environment (DHQ 2025 Vol.19, No.4)](https://dhq.digitalhumanities.org/vol/19/4/000808/000808.html)


### 3.2.1 Comarkus2D-main.js
**Comarkus2D-main.js** is the main code for converting ENTMARKUS/COMARKUS data to
the final XML.  The data is usually stored under a folder, with tagged
ENTMARKUS .html files, annotated COMARKUS .json files, and an optional 
*xmarkus-metadata.json* file which specifies the metadata.  The ENTMARKUS .html
and COMARKUS .json are paired by the main part of filenames, which means that 
\<data-filename\>.json is the corresponding event annotation of \<data-filename\>.html.

Since the **M2D** (MARKUS to DocuXml) code does not wrapped to work as a thrid-party
component, we copy its code to **Comarkus2D-main.js** and invokes it functions
directly.  One may regard **Comarkus2D-main.js** as an enhanced version of the
**M2D** code.

After the user selecting COMARKUS data files (.html and .json) from the 
**Comarkus2D.html** iframe, it converts the data files by invoking the
`convertHtmlAndReadOtherFiles()` function.  This function works as follows:

1. Calls the *M2D* `transfer()` function to convert ENTMARKUS .html files
   to a *DocuXml* string.
2. For error-handling purpose, detects and handles the case where a 
   \<data-filename\>.json exists but the program cannot find the corresponding 
   \<data-filename\>.html file from user inputs.
3. Reads *xmarkus-metadata.json* and parses it to get the *metadata*.
4. Reads COMARKUS .json files and parses their *event content*.
5. "Attach" the *metadata* and *event content* to appropriate position in
   the converted *DocuXml* string

[Comarkus2D sample files](./docs/data-samples/ComarkusData.zip) 

A special tag `Udef_Align_OBJECT` is added to "align" the objects (and object-parts)
in COMARKUS and IMMARKUS.


### 3.2.2 Immarkus2D-main.js

**Immarkus2D-main.js** is the main code for converting IMMARKUS data to the final XML.
An overview of the IMMARKUS data model can be found in
[Immarkus Data Model](./docs/IMMARKUS-Rainer-data-model-overview.md).

The input is a *project folder* which contain 6 types of IMMARKUS annotation 
files.  **Immarkus2D** uses the object `GlobalVar.folderModelFileDict` to store the 
parsing result.  

- The parsing result of *_immarkus.folder.meta.json* will be stored in 
  `GlobalVar.folderMetadataFileDic[filepath]`

- *_immarkus.folder.meta.json* will be parsed by `ParseModelJsonToObj()`.  Since the
  data model allows hierarchy, the function `extractIdParent()` is used to store a list
  of `idParentPairs := [{id,parentId},    ]`  and be stored
  in
  `GlobalVar.folderMetadataFileDic[filepath]`
  
- *\<filename\>.json* (the corresponding image file is usually named *\<filename\>.png*)
  `GlobalVar.folderJsonFilesArrayDict[filepath]`

      
- *_iiif.\<manifestId\>.annotations.json* 
  `GlobalVar.folderIiifMetadataFileDict[filepath]`

- *_iiif.\<manifestId\>.json* 
  `GlobalVar.folderIiifAnnotationFileDict[filepath]`
      
- *_immarkus.relations.json*
  `GlobalVar.folderRelationFileObjArray[filepath]`

  
Similar to Comarkus2D, Immarkus2D adds the special tag `Udef_Align_OBJECT` 
to each image piece to "align" the objects and object-parts annotated in
COMARKUS and IMMARKUS.

  

---

## 3.3 DocuMerger.html

X-MARKUS tools are designed to use DocuXml to integrate and analyze the 
outputs from COMARKUS and IMMARKUS annotations.  **DocuMerger.html** is a tool 
for merging multiple DocuXml files, for example, to combine the 
conversion results from Comarkus2D and Immarkus2D.  It reuses the
code of open-source DocuSky 
<a href="https://docusky.org.tw/docusky/docuTools/RecomposeXML/pickCorpusContentsTool.html" target="_blank">PickCorpusContentsTool.html</a> 
tool.
  
  
---


## 3.4 XmarkusAnalyzer.html

**XmarkusAnalyzer.html** (XA) is the entry point of the X-MARKUS searching and 
filtering interface.  It includes **XmarkusAnalyzer.js** as its core code, and 
works similar to the user interface of [DocuSky](https://docusky.org.tw).
The main function of XA is to enable the user to inspect document and event content,
to issue a query to search documents, and to export the filtered documents.  XA 
employs *Post-search classification* (which is used heavily in the DocuSky
environment) to help the user explore documents by their metadata or user-defined
tags.


### 3.4.1 Import and Parse a DocuXml File
[//]: # (載入並剖析 DocuXml)

After the user imports a DocuXml file, **XmarkusAnalyzer.js** invokes
`parseDocuXmlStr()` to parse the XML.  Recall that a DocuXml is a 
document-based structure which uses *document* to be the unit of text
content.  A DocuXml contains an optional corpus setting block which specifies 
customized parameters for **post-search classification**, and a `<documents>` 
block which contains a number of `<document>` where each `<document>`
contains the integrated content of text, annotated tags, comments, and image
links.

`parseDocuXmlStr()` calls `parseCorpusSettings()` and stores the corpus settings
to the global variable `GlobalVar.corpusSettings`.  For instance, assuming that
the corpus name is `COMARKUS-CORPUS`, the procedure will convert

``` XML
<metadata_field_settings>
   <compilation_name show_spotlight="Y" display_order="1">Compilation</compilation_name>
   <docclass show_spotlight="Y" display_order="6">Data Title</docclass>
   <author show_spotlight="Y" display_order="4">Author</author>
   <year_for_grouping show_spotlight="Y" display_order="3">Year</year_for_grouping>
   <geo_level1 show_spotlight="Y" display_order="5">Place Covered</geo_level1>
   <topic show_spotlight="Y" display_order="2">Data Source</topic>
</metadata_field_settings>
```
to `GlobalVar.corpusSettings['COMARKUS-CORPUS'].metadataFieldSettings`

``` JSON
{ 
  "COMP": {"label":"Compilation","displayOrder":1},
  "CLASS": {"label":"Data Title","displayOrder":6},
  "AU": {"label":"Author","displayOrder":4},
  "ADY": {"label":"Year","displayOrder":3},
  "GEO1": {"label":"Place Covered","displayOrder":5},
  "TP": {"label":"Data Source","displayOrder":2}
}
```
>Note: the `displayOrder' parameter is not used in XA.

These metadata become the menu items of *post-search classification over metadata*, as
the following snapshot shows:

![menu: post-classification over metadata](./docs/images/spotlight-metadata-menu.png)


Besides, `parseCorpusSettings()` will convert

``` XML
<feature_analysis>
   <tag type="contentTagging" name="Udef_DocMeta_piece_author" default_category="Udef_DocMeta_piece_author" default_sub_category="-"/>
   <tag type="contentTagging" name="Udef_DocMeta_piece_time" default_category="Udef_DocMeta_piece_time" default_sub_category="-"/>
      
</feature_analysis>
```

to `GlobalVar.corpusSettings['COMARKUS-CORPUS'].featureAnalysis`

``` JSON
   {
     "Udef_DocMeta_piece_author":"Udef_DocMeta_piece_author",
     "Udef_DocMeta_piece_time":"Udef_DocMeta_piece_time",
        
   }
```

After finishing the corpus settings, the `parseDocuXmlStr()` begins to parse all document 
content. To display the parsing progress in the user interface, the document content is 
read in chunks instead of loading it all at once.  
`parseDocuXmlByChunk()` parses the document content to `GlobalVar.docDict` so that

> GlobalVar.docDict[corpus][filename] := {filename, metadata, tagStats, xaStats, jqDoc, fulltext}

Therefore, knowing the document corpus and document filename, we can get its metadata 
and tags information with the `metadata` and `tagStats` fields (The `xaStats` field
is for experimental purpose and not used in practice).  The `jqDoc` is a *jQuery* 
reference to the document's DOM object, and the field `fulltext` is used for fulltext 
search.

The procedure `computeFilteredResultAndPresent()` is invoked after document parsing.
It computes the filtered documents based on the user query and the 
*post-search classification* result.  The procedure 
`presentFilteredResult()` will be invoked to present the paged content of documents
as well as their event information.  

---

### 3.4.2 Data Structure for the Parsed Content
[//]: # (主要是 GlobalVar.docDict)

XA stores all the documet content in the global variable `GlobalVar.docDict` by

``` JSON
   GlobalVar.docDict[corpus][filename] = {filename, metadata, tagStats, xaStats, jqDoc, fulltext},
```

where `corpus` is the document corpus and `filename` is the document identifier.  The
attribute `metadata`, `tagStats` and `xaStats` are JSON structure to store the information 
of document metadata, tags, and "extra tags for analysis" (for experiments and not used 
in practice).  `jqDoc` is a *jQuery collection* which can be used to access the document
content (the following code illustrates where `jqDoc` comes).  `fulltext` is a string 
which stores the text content of the document for fulltext search.

``` JavaScript
   let xmlDoc = $.parseXML(docuXml);
   let jqXml = $(xmlDoc);
   
   jqXml.find("documents > document").each(function() {
      GlobalVar.dict[corpus][filename].jqDoc = $(this);
         
   });

```

---


### 3.4.3 Query and the Search Function
[//]: # (This may be the most platform independent comment)

The user issues a *query* to search documents from the imported DocuXml.  A
query can be a *clause* or a list of clauses separated by spaces.  A *clause* is
of the form *{f1|f2|   }* or *\<type\>:\<field\>:\<values\>*, where
*f1*, *f2*,     are document *filenames*.  *\<type\>* is either 'm' (metadata)
or 't' (tags) which specifies the type of *\<field\>*.  *\<values\>* specifies
one or more values (concatenated by the '|' symbol) of the metadata/tags field.
For instance, the query `{filename1|filename2}` can retrieve documents whose 
*id* is *filename1* or *filename2*, the query `m.AU:朱秉鑒` search for the 
documents whose author is *朱秉鑒*.  More complex queries such as 
`t.Date:公元1127年~1131年 m.AU:徐民式` retrieves documents whose metadata
*author* has value *徐民式* and whose text contain a *Date* tag whose *RefId*
is *公元1127年~1131年*.  Notice that the space between two clauses can be
regarded as logical AND operations.


---

### 3.4.4 Highlighting text tags from an event tag
[//]: # (This may be the most platform independent comment)

Event items will dynamically be linked to the text content. For instance, from the 
source DocuXml

``` XML
<doc_content>
   <Paragraph>
      <Comment>   </Comment>
      <span>萬曆_政和縣志_卷之八_詞翰誌_鄒希賢_熈寧橋記</span>
         
      <Date RefId="公元1555年:明世宗" Term="公元1555年:明世宗">嘉靖乙卯</Date>
         
      <Udef_action RefId="markus_construct" TagForConversion="{"markus":"action"}" Term="markus_construct">建</Udef_action>
         
   </Paragraph>
   <Events>
         
      <ComarkusBundle Type="TIME">
         <Udef_Evt_TIME MarkusId="0df6cc14-04a9-483b-b81b-6d4af872b173" RefId="1555">END/1555/嘉靖乙卯</Udef_Evt_TIME>
      </ComarkusBundle>
         
      <ComarkusBundle Type="EVENT">
         <Udef_Evt_EVENT MarkusId="80ab1d0f-dfad-4ead-ae9d-b3f46f2666a6" RefId="construct">CONSTRUCTION/construct/建</Udef_Evt_EVENT>
      </ComarkusBundle>
         
   </Events>
</doc_content>
```

XA will convert the text structure (within `<Paragraph>`) and the event structure
(within `<Events>`) to HTML so that the converted content can be displayed on a modern browser.
In the above example, the text and event structures about type "EVENT" will be converted to

``` XHTML (text)
<udef_action refid="markus_construct" tagforconversion="{&quot;markus&quot;:&quot;action&quot;}" term="markus_construct" class="applyColor">
   <span class="udef tagSpotted" matchkey="markus_construct">建
      <span class="udefInfo" title="construct">*action:
        <span class="udefRefId">construct</span>
      </span>
   </span>
</udef_action>
```

and


``` XHTML (event)
<div comarkus-udeftagkey="EVENT">
   <b class="udefTagKey">EVENT</b>
   <div>
      <span comarkus-udeftagname="Udef_Evt_EVENT" comarkus-refid="construct" comarkus-markusid="80ab1d0f-dfad-4ead-ae9d-b3f46f2666a6" comarkus-text="CONSTRUCTION/construct/建" class="eventElementMatch curElementMatch" matchkey="markus_construct">
         - <span>CONSTRUCTION/construct/建</span>
      </span>
   </div>
</div>

```

respectively.  When the user clicks an event tag, XA will highlight the source text of
the event by invoking the function `spotComarkusEventTagsInContent()`.
The following screenshot illustrates the mapping of event *construct* 
to the original text which contains tag content '建'.  The event and text will be marked 
by *orange* background if the event-to-text mapping can be found from the `RefId` 
attribute.  In this example, the event attribute `comarkus-refid` has value *construct*, 
which equals the value of text tag `<span class="udefRefId">`.

<img alt="Event-Text-Mapping1" style="max-width:1200px" src="./docs/images/EventMapping-Figure01.png"/>

On the other hand, the text and event structures about type "TIME" will be converted to

``` XHTML
<date refid="公元1555年:明世宗" term="公元1555年:明世宗" class="applyColor">
   <span class="udef udefMatchByText tagSpotted tagSpottedByText" matchkey="公元1555年:明世宗">
      嘉靖乙卯<span class="udefInfo" title="公元1555年:明世宗">Date:<span class="udefRefId">公元1555年:明世宗</span></span>
   </span>
</date>
```

and

``` XHTML
<b class="udefTagKey">TIME</b>
<div>
   <span comarkus-udeftagname="Udef_Evt_TIME" comarkus-refid="1555" comarkus-markusid="0df6cc14-04a9-483b-b81b-6d4af872b173" comarkus-text="END/1555/嘉靖乙卯" class="eventElementMatch eventElementMatchByText curElementMatch curElementMatchByText" matchkey="公元1555年:明世宗">
   - <span>END/1555/嘉靖乙卯</span></span>
</div>
</div>
```

respectively.  Since the event attribute `comarkus-refid` has value *1555*, while 
the value of text tag `<span class="udefRefId">` is *公元1555年:明世宗*, XA fails
to find the mapping by exact match.  In such a case, XA will try to find the
mapping by checking the tag value (*嘉靖乙卯* in this case).  The resulting mapping
will have have lightblue background, as the following screenshot illustrates.

<img alt="Event-Text-Mapping2" style="max-width:1200px" src="./docs/images/EventMapping-Figure02.png"/>

[//]: # (This may be the most platform independent comment)


---


## 3.5 EventConnectionGraph.html

**EventConnectionGraph.html** is the entry point of the X-MARKUS visualising
relations tool.  It contains three JavaScript components: 

- **EventConnectionGraph-main.js**
- **EventConnectionGraph-tabulator.js**
- **EventConnectionGraph-graph.js**


## 3.5.1 EventConnectionGraph-main.js

**EventConnectionGraph-main.js** provides the main functionality of the visualising
tool.  It parses the input DocuXml, uses a global variable `GlobalVar.tableData`
which stores an "event/image element" as a row in the table for later 
omputation.  It also contains functions to handle the main UI.  

When the user loads a DocuXml file, it invokes `parseDocuXmlFile()` to store each 
document content to the global variable `GlobalVar.docFilenameJqDoc[filename]` (a 
*jQuery collection* that refers to the document whose id equals 
*filename*).  `parseDocuXmlFile()` in turn invokes `parseDocEventsFromJqDocContent()` 
which parses the document metadata and event tags to the global variable 
`GlobalVar.tableData`.

Since the input DocuXml may contain COMARKUS and IMMARKUS annotations, the procedure
`parseDocEventsFromJqDocContent()` invokes some more sub-procedures to convert
COMARKUS events and IMMARKUS image annotations to a table whose rows corresponds
to a "piece" of event or image.  Each row contains a lot of fields required to
compute the "shared features" of events.

- `parseEventFromDocuSkySingleDocXml()`
- `parseDocEventsFromJqDocContent()`
- `parseImmarkusEvent2TableRow()`


The `resetControlPanel()` is a complicated procedure which resets the graph control
panel.  The procedure `applyPanelToTableDataAndDrawGraph()` is key to the *REDRAW&
function.  It invokes `applySettingsAndRedraw()` after setting the positions of
pinned nodes.  Since a *REDRAW* process requires a lot of computation time, a
`window.setTimeout()` is called before running `applySettingsAndRedraw()`.

The procedure `applySettingsAndRedraw()` is complicated.  It iterates through all 
table rows to compute and set node features, and invokes
the computationally intensive `updateAndApplyDisplayFilter()`, which needs to
call `updateNodeDisplayList()` to update node display options and then invokes
`convertTableDataAndApplyCommonNodeDisplayFilter()` (located in
**EventConnectionGraph-graph.js**) to convert table data to `GlobalVar.graphNodeDict`
which is a structure for plotting the visible graph.


---


## 3.5.2 EventConnectionGraph-tabulator.js

Since it can be hard to inspect the internal table for debugging, I adopt
**EventConnectionGraph-tabulator.js** which puts the internal table in a
visible tabulator format.  This means that the user input is transformed
from DocuXml first to an internal table, and then be put to a tabulator.



---


## 3.5.3 EventConnectionGraph-graph.js

The final graph is generated by the tabulator data.

**EventConnectionGraph-graph.js** contains the procedures to plot the
event-connection graph with the popular *d3* module.  After detecting
and setting the viewport parameters, the function `computeGraphData()`
is invoked to transform the tabulator data to `GlobalVar.temp.graphData`.
The reason to add the *temp* object is that the *graphData* is dynamic
(depends on the *FeatureType* options).

The key of *graphData* is a graph *nodeId* is an object that contains 
the node settings.  A *nodeId* is a string such as 'E001', 'M012', or
'C005', where the prefix 'E', 'M', 'C' indicates the *nodeType* to be
*event*, *image*, or *feature*.  

`GlobalVar.temp.graphData[graphIdIdx]` is an array whose element contains 
a structure for a node.  For instance, `GlobalVar.temp.graphData[0]` can be
is a JSON structure such as

``` JSON
{
  "id": "E001",
  "nodeType": "E",
  "nodeShape": "square",
  "pathColor": "#b7b7b7",
  "graphDataIdx": 0,
  "linkToGroups": {},
  "x": 406,
  "y": 606,
  "rectWidth": 320,
  "rectHeight": 240,
  "key": "row0",
  "html": "<div class='nodeEventHtml' graphDataIdx='0' docFilenames=''><div class='eventItems'>\n<div class='eventNodeTitle eventNodeTitle fontSizeLarge' docFilename='GuangXu_YiDouXianTuZhi_JuanShiSi_YingJian_ZhaoZhiXin_NanYangQiaoBeiMing.txt_markus_cor2_p_E00' comarkusId='17adccbb-2a49-423a-8047-256303ed19d5'>E001: <span title=\"(1696~1696)\" EventDocFilename=\"GuangXu_YiDouXianTuZhi_JuanShiSi_YingJian_ZhaoZhiXin_NanYangQiaoBeiMing.txt_markus_cor2_p_E00\">益都縣圖志：南陽橋碑銘(1/4)</span><span class=\"butLinkBack\" style=\"margin-left:16px\" filenames=\"GuangXu_YiDouXianTuZhi_JuanShiSi_YingJian_ZhaoZhiXin_NanYangQiaoBeiMing.txt_markus_cor2_p_E00\"><i class=\"fa-solid fa-paper-plane\"></i></span><br/>20 annotations, 13 tags</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C3\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>EVENT_SOURCE_TEXT: 益都縣圖志：南陽橋碑銘</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C9\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>EVENT: RENOVATION/complete/成</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C5\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>OBJECT_MAIN: bridge/yidu_wannian_qiao/萬年</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>OBJECT_MAIN: OBJECT_MAIN/bridge</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C6\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>TIME: END/1696/康熙歳在丙子</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>TIME: duration/4年/四年</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C4\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>LOCATION: placeName/hvd_85282/益都</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C10\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>INITIATOR: soccat/taoist/道士</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>INITIATOR: fullName/卜夢麟|fl1687|r益都/卜夢麟</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C11\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>SPONSOR: officialTitle/prefect/太守</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>SPONSOR: fullName/472433/羅公</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>SPONSOR: soccat/gentry/士大夫</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>SPONSOR: soccat/poor/窶人</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>SPONSOR: soccat/poor_woman/貧女</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C7\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>BENEFICIARY: soccat/scholar/人士</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C8\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>EVENT_CAUSE: structural/abandon/廢</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C15\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>OBJECT_ALT_NAME: object/yidu_nanyang_qiao/南陽橋</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C13\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>OBJ_PART_LINKED: material/stone/石</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>OBJ_PART_LINKED: OBJ_PART/weir</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>OBJ_PART_LINKED: obj_width/c4丈/尋丈者凡四</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>OBJ_PART_LINKED: obj_part/weir/堰</div>\n</div>\n<div class=\"comarkusTagBundle\" bundleIdx=\"C14\">\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>OBJ_PART_LINKED: OBJ_PART/stele</div>\n<div class='eventNodeLine eventTextDarkColor fontSizeLarge'>OBJ_PART_LINKED: obj_part/stele/石</div>\n</div>\n</div><div id='EventText_E001' class='eventContentXml'><Paragraph>光緒_益都縣圖志_卷十四_營建_趙執信_南陽橋碑銘<br/><LocName RefId=\"hvd_85282\" Term=\"hvd_85282\">益都</LocName>縣<br/><PersonName CbdbId=\"cbdb_35188\" Term=\"cbdb_35188\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">趙執信 </PersonName><Udef_work TagForConversion=\"{&quot;markus&quot;:&quot;work&quot;}\">南陽橋碑銘</Udef_work><br/><Date RefId=\"公元1696年:清聖祖\" Term=\"公元1696年:清聖祖\">康熙歳在丙子</Date><LocName>青州</LocName>北郭橋<Udef_action RefId=\"markus_complete\" TagForConversion=\"{&quot;markus&quot;:&quot;action&quot;}\" Term=\"markus_complete\">成</Udef_action>興<Udef_duration RefId=\"markus_10年\" TagForConversion=\"{&quot;markus&quot;:&quot;duration&quot;}\" Term=\"markus_10年\">十年</Udef_duration>之已<Udef_action RefId=\"markus_abandon\" TagForConversion=\"{&quot;markus&quot;:&quot;action&quot;}\" Term=\"markus_abandon\">廢</Udef_action>還累代之舊觀郡之<Udef_soccat RefId=\"markus_scholar\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_scholar\">人士</Udef_soccat>莫不驚喜相告報也橋駕<LocName>南陽</LocName>水不知其所始<Udef_work RefId=\"markus_水經注\" TagForConversion=\"{&quot;markus&quot;:&quot;work&quot;}\" Term=\"markus_水經注\">酈注</Udef_work>南陽帶城又名<LocName>澠水</LocName>按其地形今猶昔也而不次橋梁<Udef_work TagForConversion=\"{&quot;markus&quot;:&quot;work&quot;}\">郡志</Udef_work>惟稱有宋時<Udef_obj_part RefId=\"markus_stele\" TagForConversion=\"{&quot;markus&quot;:&quot;obj_part&quot;}\" Term=\"markus_stele\">碑</Udef_obj_part><PersonName CbdbId=\"cbdb_7364\" Term=\"cbdb_7364\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">曾子固</PersonName>爲文<PersonName CbdbId=\"cbdb_3676\" Term=\"cbdb_3676\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">米元章</PersonName>書者今亡不可考矣元人<PersonName CbdbId=\"cbdb_489171\" Term=\"cbdb_489171\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">郝經</PersonName>紀行詩云飲馬<Udef_object RefId=\"markus_yidu_nanyang_qiao\" TagForConversion=\"{&quot;markus&quot;:&quot;object&quot;}\" Term=\"markus_yidu_nanyang_qiao\">南陽橋</Udef_object>摩挲<PersonName CbdbId=\"cbdb_3676\" Term=\"cbdb_3676\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">米芾</PersonName>記是則茲橋之昭昭者歟勝國以還再<Udef_action RefId=\"markus_destroy\" TagForConversion=\"{&quot;markus&quot;:&quot;action&quot;}\" Term=\"markus_destroy\">圮</Udef_action>再<Udef_action RefId=\"markus_reconstruct\" TagForConversion=\"{&quot;markus&quot;:&quot;action&quot;}\" Term=\"markus_reconstruct\">復</Udef_action>傳聞<Udef_action RefId=\"markus_destroy\" TagForConversion=\"{&quot;markus&quot;:&quot;action&quot;}\" Term=\"markus_destroy\">圮</Udef_action>於<Date RefId=\"公元1488年~1506年:明孝宗\" Term=\"公元1488年~1506年:明孝宗\">宏治之季</Date>也<Udef_action_cause RefId=\"markus_river_breach\" TagForConversion=\"{&quot;markus&quot;:&quot;action_cause&quot;}\" Term=\"markus_river_breach\">川原横潰</Udef_action_cause>堞漂石走往迹殘<Udef_obj_part RefId=\"markus_stele\" TagForConversion=\"{&quot;markus&quot;:&quot;obj_part&quot;}\" Term=\"markus_stele\">碑</Udef_obj_part>于焉頓盡迨<Date RefId=\"公元1673年~1720年:明神宗\" Term=\"公元1673年~1720年:明神宗\">萬曆</Date>中<Office Type=\"officialTitle\" RefId=\"markus_prefect\" TagForConversion=\"{&quot;markus&quot;:&quot;officialTitle&quot;}\">郡守</Office><PersonName CbdbId=\"cbdb_206522\" Term=\"cbdb_206522\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">衛</PersonName>姓者<Udef_action RefId=\"markus_renovate\" TagForConversion=\"{&quot;markus&quot;:&quot;action&quot;}\" Term=\"markus_renovate\">修</Udef_action>復之易其名曰<Udef_object RefId=\"markus_yidu_wannian_qiao\" TagForConversion=\"{&quot;markus&quot;:&quot;object&quot;}\" Term=\"markus_yidu_wannian_qiao\">萬年</Udef_object>至我朝<Date RefId=\"公元1687年:清聖祖\" Term=\"公元1687年:清聖祖\">康熙丙寅</Date>而<Udef_action RefId=\"markus_break_down\" TagForConversion=\"{&quot;markus&quot;:&quot;action&quot;}\" Term=\"markus_break_down\">頽</Udef_action><Udef_duration RefId=\"markus_c100年\" TagForConversion=\"{&quot;markus&quot;:&quot;duration&quot;}\" Term=\"markus_c100年\">不百年</Udef_duration>耳嗟乎地道變盈陵谷遷改雖以茲橋之堅且鉅猶未可恃也矧前賢文字之細乎哉是可感己<Udef_soccat RefId=\"markus_buddhist\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_buddhist\">浮屠</Udef_soccat><PersonName CbdbId=\"cbdb_成行,fl1696,r益都\" Term=\"cbdb_成行,fl1696,r益都\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">成行</PersonName>者郡<Udef_soccat RefId=\"markus_urban_resident\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_urban_resident\">城人</Udef_soccat>不眠不坐梵誦於<Udef_action RefId=\"markus_break_down\" TagForConversion=\"{&quot;markus&quot;:&quot;action&quot;}\" Term=\"markus_break_down\">頽</Udef_action>橋之側日橋不成吾以身殉<LocName RefId=\"hvd_85259\" Term=\"hvd_85259\">樂安</LocName><Udef_soccat RefId=\"markus_taoist\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_taoist\">道士</Udef_soccat><PersonName CbdbId=\"cbdb_卜夢麟,fl1687,r益都\" Term=\"cbdb_卜夢麟,fl1687,r益都\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">卜夢麟</PersonName>聞而助之皆不惜支體奔走號呼如赴急難<Office Type=\"officialTitle\" RefId=\"markus_prefect\" TagForConversion=\"{&quot;markus&quot;:&quot;officialTitle&quot;}\">太守</Office><LocName RefId=\"hvd_44560\" Term=\"hvd_44560\">閬中</LocName><PersonName CbdbId=\"cbdb_472433\" Term=\"cbdb_472433\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">羅公</PersonName>愍之曰吾事也遂率條屬出俸金以首是舉而自鄉<Udef_soccat RefId=\"markus_gentry\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_gentry\">士大夫</Udef_soccat>以逮<Udef_soccat RefId=\"markus_poor\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_poor\">窶人</Udef_soccat><Udef_soccat RefId=\"markus_poor_woman\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_poor_woman\">貧女</Udef_soccat>無有遠邇咸競施而樂其成計爲日<Udef_duration RefId=\"markus_4年\" TagForConversion=\"{&quot;markus&quot;:&quot;duration&quot;}\" Term=\"markus_4年\">四年</Udef_duration>費<Udef_cost RefId=\"markus_c10000錢\" TagForConversion=\"{&quot;markus&quot;:&quot;cost&quot;}\" Term=\"markus_c10000錢\">金錢千萬</Udef_cost>毁者完之末毁者葺之橋之長廣不加於舊有堅耳矣左右各<Udef_action RefId=\"markus_increase\" TagForConversion=\"{&quot;markus&quot;:&quot;action&quot;}\" Term=\"markus_increase\">益</Udef_action><Udef_material RefId=\"markus_stone\" TagForConversion=\"{&quot;markus&quot;:&quot;material&quot;}\" Term=\"markus_stone\">石</Udef_material><Udef_obj_part RefId=\"markus_weir\" TagForConversion=\"{&quot;markus&quot;:&quot;obj_part&quot;}\" Term=\"markus_weir\">堰</Udef_obj_part>夾持之廣<Udef_obj_width RefId=\"markus_c4丈\" TagForConversion=\"{&quot;markus&quot;:&quot;obj_width&quot;}\" Term=\"markus_c4丈\">尋丈者凡四</Udef_obj_width>今年夏水驟發勢倍往歳盪滌糞壤洗濯欄楯拳<Udef_material RefId=\"markus_stone\" TagForConversion=\"{&quot;markus&quot;:&quot;material&quot;}\" Term=\"markus_stone\">石</Udef_material>不移城郭宴爾於是乃大可恃矣夫人情於始也難圖而於成也易玩方橋之末復<Udef_soccat RefId=\"markus_traveler\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_traveler\">往來者</Udef_soccat>其莫不謂闕然今則相與欣然未久而視爲固然矣不謀所以保其成而使之久者而第矜之曰萬年年可必乎昔<PersonName CbdbId=\"cbdb_姬静,-862年~-782年,b鎬京\" Term=\"cbdb_姬静,-862年~-782年,b鎬京\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">周宣</PersonName>之考室也其<Udef_work TagForConversion=\"{&quot;markus&quot;:&quot;work&quot;}\">詩</Udef_work>曰君子攸躋君子攸甯一室之成而躋必於君子甯必於君子又況茲橋之鉅竭千百人之力合千萬人之財積歳累月僅能有成者欲蘄其甯非君子其何頼乎橋垂成<PersonName CbdbId=\"cbdb_472433\" Term=\"cbdb_472433\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">羅公</PersonName>下世<PersonName CbdbId=\"cbdb_成行,fl1696,r益都\" Term=\"cbdb_成行,fl1696,r益都\" TagForConversion=\"{&quot;markus&quot;:&quot;fullname&quot;}\">成行</PersonName>者踵予門乞爲之記以告<Udef_soccat RefId=\"markus_later_gentleman\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_later_gentleman\">後之君子</Udef_soccat>余乃諮於<Udef_soccat RefId=\"markus_crowd\" TagForConversion=\"{&quot;markus&quot;:&quot;soccat&quot;}\" Term=\"markus_crowd\">眾</Udef_soccat>曰夫萬年者以時計有所止也南陽者與地俱無所止也請仍名南陽亦以存宋元諸賢之舊庶有考焉爰勒諸<Udef_obj_part RefId=\"markus_stele\" TagForConversion=\"{&quot;markus&quot;:&quot;obj_part&quot;}\" Term=\"markus_stele\">石</Udef_obj_part>而系以銘銘曰長橋亘兮洪濤朿地靈奠兮蛟龍伏行人行兮妥爾足馬牛無驚車不觸城巖巖兮山𡻬𡻬形勢完兮雄觀復來有君子兮謹修築俾繩安流兮配四瀆豐碑兀兮水之曲履斯橋兮警心目 </Paragraph></div></div>\n",
  "colorClass": "colorSetB08",
  "nodeLegendCaption": "Event",
  "nodeLabelColorClass": "nodeLabelColor00",
  "nodeColorIdx": "08",
  "graphNodeLabel": "",
  "nodeContentStr": "|益都縣圖志：南陽橋碑銘|placeName/hvd_85282/益都|OBJECT_MAIN/bridge|bridge/yidu_wannian_qiao/萬年|END/1696/康熙歳在丙子|duration/4年/四年|soccat/scholar/人士|structural/abandon/廢|RENOVATION/complete/成|soccat/taoist/道士|fullName/卜夢麟|fl1687|r益都/卜夢麟|officialTitle/prefect/太守|fullName/472433/羅公|soccat/gentry/士大夫|soccat/poor/窶人|soccat/poor_woman/貧女|obj_width/c4丈/尋丈者凡四|material/stone/石|OBJ_PART/weir|obj_part/weir/堰|OBJ_PART/stele|obj_part/stele/石|object/yidu_nanyang_qiao/南陽橋|",
  "nodeTagName": "Udef_EventRelLite",
  "labelDisplay": true
}
```

In this case, we say that the `graphNodeIdx` of nodeId *E001* is 0.


---


## 3.5.4 A simple Example for Illistration

This sub-section uses a small example to illustrate the conversion from DocuXml
to table, and then to the final graph.

The example takes
<a alt="VizTool-SimpleExample.xml" href="./docs/data-samples/VizTool-SimpleExample.xml">VizTool-SimpleExample.xml</a>
as input.  The events of the document titled *益都縣圖志：南陽橋碑銘* are illustrated by the screenshot:

<img alt="SimpleExample" style="max-width:1200px" src="./docs/images/VizTool-SimpleExample2.png"/>

These events will be converted to the top 26 rows (rows #1 to #26) of the internal table (see the
following table as an illustration).  Notice
that the rows with `id` 5 and *31* have the same `tagName` *Udef_Evt_LOCATION* and `type` *LOCATION*,
which means that there are two nodes (`graphNode` *E001* and *E002*) have the same feature composed by 
*tagName* and *Type*.  Therefore the two rows will have the same `dupCnt` which equals 2.  Similarily,
the `graphNode` *C003* (*Source Structure* node labelled '益都縣圖志：南陽橋碑銘') and
*C010* (*Feature* node labelled 'EVENT_CAUSE') have `dupCnt` 1 and 2, which means the feature
node *C003* has one edge , and *C010* has two edges.  From the row with `id` 11 we know
that the *feature node* (called *connection node* in the code) *C003* connects to the event 
node *E001* (specified by the column `eNum`).  There are actually three rows (`id` 11,
69 and 70) which has `graphNode` value *C010*.  The row with `id` 11 says the graph node
*C010* connects to the event node *E001*, and the rows with `id` 69 and 70 means that
*C010* connects to the event node *E002* with two feature tags.

Notice that, for illustration purpose, this table does not list all the fields of the 
internal table.  



| id | display   | eNum | eNumDisplay | graphNode | graphNodeLabel         | tagName                    | type              | refId                       | dupCnt   |
| -: | :-------: | :--- | :---------: | :-------- | :--------------------- | :------------------------- | :---------------- | :-------------------------- | -------: |
| 1  | true      | E001 | true        | E001      |                        | Udef_EventRelLite          | 系統編碼          | E001                        | 1        |
| 2  | true      | E001 | true        | E001      |                        | Udef_EventRelLite          | 系統編碼          | E001                        | 1        |
| 3  | true      | E001 | true        | E001      |                        | Udef_EventRelLite          | 系統編碼          | E315                        | 1        |
| 4  | true      | E001 | true        | C003      | 益都縣圖志：南陽橋碑銘 | Udef_Evt_EVENT_SOURCE_TEXT | EVENT_SOURCE_TEXT | #doc_title                  | 1        |
| 5  | true      | E001 | true        | C004      | *LOCATION              | Udef_Evt_LOCATION          | LOCATION          | hvd_85282                   | 2        |
| 6  | false     | E001 | true        | C005      | OBJECT_MAIN            | Udef_Align_OBJECT          | OBJECT_MAIN       | -                           | 2        |
| 7  | false     | E001 | true        | C006      | bridge                 | Udef_Evt_OBJECT_MAIN       | OBJECT_MAIN       | yidu_wannian_qiao           | 2        |
| 8  | true      | E001 | true        | C007      | END                    | Udef_Evt_TIME              | TIME              | 1696                        | 2        |
| 9  | true      | E001 | true        | C008      | duration               | Udef_Evt_TIME              | TIME              | 4年                         | 1        |
| 10 | true      | E001 | true        | C009      | *BENEFICIARY           | Udef_Evt_BENEFICIARY       | BENEFICIARY       | scholar                     | 2        |
| 11 | true      | E001 | true        | C010      | *EVENT_CAUSE           | Udef_Evt_EVENT_CAUSE       | EVENT_CAUSE       | abandon                     | 2        |
| 12 | true      | E001 | true        | C011      | RENOVATION             | Udef_Evt_EVENT             | EVENT             | complete                    | 2        |
| 13 | true      | E001 | true        | C012      | *INITIATOR             | Udef_Evt_INITIATOR         | INITIATOR         | taoist                      | 2        |
| 14 | true      | E001 | true        | C012      | *INITIATOR             | Udef_Evt_INITIATOR         | INITIATOR         | 卜夢麟\|fl1687\|r益都       | 2        |
| 15 | true      | E001 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | prefect                     | 2        |
| 16 | true      | E001 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 472433                      | 2        |
| 17 | true      | E001 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | gentry                      | 2        |
| 18 | true      | E001 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | poor                        | 2        |
| 19 | true      | E001 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | poor_woman                  | 2        |
| 20 | false     | E001 | true        | C014      | *OBJECT_PART_WIDTH     | Udef_Evt_OBJECT_PART_WIDTH | OBJ_PART_LINKED   | c4丈                        | 1        |
| 21 | false     | E001 | true        | C015      | *MATERIAL              | Udef_Evt_MATERIAL          | OBJ_PART_LINKED   | stone                       | 1        |
| 22 | false     | E001 | true        | C005      | OBJ_PART               | Udef_Align_OBJECT          | OBJ_PART_LINKED   | -                           | 2        |
| 23 | false     | E001 | true        | C016      | obj_part               | Udef_Evt_OBJ_PART          | OBJ_PART_LINKED   | weir                        | 2        |
| 24 | false     | E001 | true        | C005      | OBJ_PART               | Udef_Align_OBJECT          | OBJ_PART_LINKED   | -                           | 2        |
| 25 | false     | E001 | true        | C016      | obj_part               | Udef_Evt_OBJ_PART          | OBJ_PART_LINKED   | stele                       | 2        |
| 26 | false     | E001 | true        | C017      | *OBJECT_ALT_NAME       | Udef_Evt_OBJECT_ALT_NAME   | OBJECT_ALT_NAME   | yidu_nanyang_qiao           | 1        |
| 27 | true      | E002 | true        | E002      |                        | Udef_EventRelLite          | 系統編碼          | E002                        | 1        |
| 28 | true      | E002 | true        | E002      |                        | Udef_EventRelLite          | 系統編碼          | E002                        | 1        |
| 29 | true      | E002 | true        | E002      |                        | Udef_EventRelLite          | 系統編碼          | E943                        | 1        |
| 30 | true      | E002 | true        | C021      | 東明縣志：重修玉帶橋記 | Udef_Evt_EVENT_SOURCE_TEXT | EVENT_SOURCE_TEXT | #doc_title                  | 1        |
| 31 | true      | E002 | true        | C004      | *LOCATION              | Udef_Evt_LOCATION          | LOCATION          | hvd_44815                   | 2        |
| 32 | false     | E002 | true        | C005      | OBJECT_MAIN            | Udef_Align_OBJECT          | OBJECT_MAIN       | -                           | 2        |
| 33 | false     | E002 | true        | C006      | bridge                 | Udef_Evt_OBJECT_MAIN       | OBJECT_MAIN       | dongming_yudai_qiao         | 2        |
| 34 | true      | E002 | true        | C012      | *INITIATOR             | Udef_Evt_INITIATOR         | INITIATOR         | 100023                      | 2        |
| 35 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | ministry_secretary          | 2        |
| 36 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 350748                      | 2        |
| 37 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | magistrate                  | 2        |
| 38 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 尚宏正\|fl1713\|o東安       | 2        |
| 39 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 趙文喜\|fl1741\|r東明       | 2        |
| 40 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | national_university_student | 2        |
| 41 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 孟國英\|fl1745\|r東明       | 2        |
| 42 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 朱福興\|fl1745\|r東明       | 2        |
| 43 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 吳鵬程\|fl1745\|r東明       | 2        |
| 44 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | national_university_stude   | 2        |
| 45 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 楊元亨\|fl1745\|r東明       | 2        |
| 46 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 崔澂\|fl1745\|r東明         | 2        |
| 47 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 劉澤宏\|fl1745\|r東明       | 2        |
| 48 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | prefect_school_student      | 2        |
| 49 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 穆藝\|fl1745\|r東明         | 2        |
| 50 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 梁棟\|fl1745\|r東明         | 2        |
| 51 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | 范元福\|fl1745\|r東明       | 2        |
| 52 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | great_families              | 2        |
| 53 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | influential_families        | 2        |
| 54 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | merchant                    | 2        |
| 55 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | peasant                     | 2        |
| 56 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | worker                      | 2        |
| 57 | true      | E002 | true        | C013      | *SPONSOR               | Udef_Evt_SPONSOR           | SPONSOR           | provincial_gradaute         | 2        |
| 58 | true      | E002 | true        | C022      | *COST                  | Udef_Evt_COST              | COST              | c1000金                     | 1        |
| 59 | true      | E002 | true        | C007      | END                    | Udef_Evt_TIME              | TIME              | 1745                        | 2        |
| 60 | true      | E002 | true        | C023      | BEGIN                  | Udef_Evt_TIME              | TIME              | 1745-04-2                   | 1        |
| 61 | true      | E002 | true        | C011      | RENOVATION             | Udef_Evt_EVENT             | EVENT             | renovate                    | 2        |
| 62 | false     | E002 | true        | C024      | *OBJECT_LENGTH         | Udef_Evt_OBJECT_LENGTH     | OBJECT_LENGTH     | 18丈                        | 1        |
| 63 | false     | E002 | true        | C025      | *OBJECT_WIDTH          | Udef_Evt_OBJECT_WIDTH      | OBJECT_WIDTH      | c2丈                        | 1        |
| 64 | false     | E002 | true        | C005      | OBJ_PART               | Udef_Align_OBJECT          | OBJ_PART_LINKED   | -                           | 2        |
| 65 | false     | E002 | true        | C016      | obj_part               | Udef_Evt_OBJ_PART          | OBJ_PART_LINKED   | railing                     | 2        |
| 66 | false     | E002 | true        | C005      | OBJ_PART               | Udef_Align_OBJECT          | OBJ_PART_LINKED   | -                           | 2        |
| 67 | false     | E002 | true        | C016      | obj_part               | Udef_Evt_OBJ_PART          | OBJ_PART_LINKED   | half_moon_shaped_embankment | 2        |
| 68 | true      | E002 | true        | C009      | *BENEFICIARY           | Udef_Evt_BENEFICIARY       | BENEFICIARY       | traveler                    | 2        |
| 69 | true      | E002 | true        | C010      | *EVENT_CAUSE           | Udef_Evt_EVENT_CAUSE       | EVENT_CAUSE       | abandon                     | 2        |
| 70 | true      | E002 | true        | C010      | *EVENT_CAUSE           | Udef_Evt_EVENT_CAUSE       | EVENT_CAUSE       | difficulty                  | 2        |

To plot the final graph, the tool will compute `GlobalVar.graphData` from the above table,
and then use data in `GlobalVar.graphData` to draw nodes and edges.  Notice that the 
feature node labeled *LOCATION* has two edges connected to nodes
*E001* and *E002*.  The edge between node labelled *LOCATION* and *E002* is a bit thicker
since the event contains 2 feature tags.  The thickest edge between nodes labelled 
*E002* and *SPONSOR* contains 23 feature tags (which corresponds to the rows from `id`
35 to 57).  The graph nodes with `display` value *false* will not be shown in the
graph, which means that the feature nodes such as *C005*, *C006*, *C014*, *C015*, 
etc. will not appear in the final graph.

![SimpleExample-Graph](./docs/images/VizTool-SimpleExample-Graph.png) 


---

## 3.5.5 Clicking a Graph Node

Clicking a graph node shows information about this node.  Different types of nodes need
to display different information:

| node type         | node information |
| :---------------- | :--------------- | 
| Event             | Label: number of tags, number of notations. <br/> Content: annotations plus COMARKUS event text | 
| Image             | Label: number of pieces, number of records. <br/> Content: IMMARKUS image, image metadata, and piece annotations | 
| Feature           | Label: number of annotations, number of events and images. <br/> Content: full feature | 
| Feature Hierarchy | Label: number of connected features. <br/> Content: corresponding features | 
| Source Structure  | Label: event/image source. <br/> Content: event metadata and image folder metadata | 

All node information is prepared by the `computeGraphData()` (located in the file
**EventConnectionGraph-graph.js**), which is a complicated
procedure dedicated to prepare all the required data for plotting the final 
graph.  The computed result will be stored in the global variable `GlobalVar.graphNodeDict`.


