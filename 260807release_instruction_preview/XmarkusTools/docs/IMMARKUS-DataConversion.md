# IMMARKUS Data Transforamation

---

## 1. Introduction

**IMMARKUS** is a tool which converts data from the annotated output of **IMMARKUS**
to an **X-MARKUS XML** file in the **DocuXml** format.  Since DocuXml is document-based,
we convert the annotated data of each IMMARKUS piece to one document "paragraph".
The **Immarkus2D** (*I2D* in short) is the tool for conversion.


---

## 2. Sample Files

We use the IMMARKUS Yangzhou(揚州) samples to illustrate *I2D* data 
transformation.  The zipped file
<a href="./docs/immarkus-data-transform-samples/">Yangzhou-Sample.zip</a>
contains all the sample files.  Unzipping the file will generate a "Yangzhou-Sample"
directory which serves as the "project" root folder.  There are two sub-folders
under *Yangzhou-Sample*: 

- `2. IMAGE ANNOTATION_ARCHAEOLOGY REPORT_Iva-IMMARKUS-Yangzhou`
- `3. IMAGE ANNOTATION_HISTORICAL MAP_20250603_yangzhou_map`

Each sub-folder contains files and "image folders" for the image annotation.  There 
are three JSON files in a sub-folder:

- _immarkus.model.json
- _immarkus.folder.meta.json
- _immarkus.relations.json

The "image folders" contains images and their annotation data.  For instance, the
`2. IMAGE ANNOTATION_ARCHAEOLOGY REPORT_Iva-IMMARKUS-Yangzhou` sub-folder has
an image folder "article report" which contains two images

- 图七北门水门遗址平面.png
- 图二北门水门与北门的位置关系.png

and their corresponding annotation files

- 图七北门水门遗址平面.json
- 图二北门水门与北门的位置关系.json

In addition, the image folder contains a file *_immarkus.folder.meta.json*
describing the folder metadata for the annotated images.


---

## 3. Illustration

**Comarkus2D** uses *_immarkus.model.json* and *_immarkus.relations.json* to generate
the *relation tags* (currently only presented but not used in the X-MARKUS tools) in 
DocuXml.  

For instance, the sub-folder *3. IMAGE ANNOTATION_HISTORICAL MAP_20250603_yangzhou_map*
will generate

``` XML
<ExtraRelations RelationGenre="ImmarkusDataModelHierarchy">
   <Model Source="Yangzhou-Sample/3. IMAGE ANNOTATION_HISTORICAL MAP_20250603_yangzhou_map">
      <Relation Parent="NONE" Child="object"/>
      <Relation Parent="object" Child="city_wall"/>
      <Relation Parent="object" Child="bridge"/>
      <Relation Parent="NONE" Child="obj_part"/>
      <Relation Parent="obj_part" Child="bridge_gate"/>
      <Relation Parent="obj_part" Child="city_wall_barbican"/>
      <Relation Parent="obj_part" Child="city_wall_gate"/>
      <Relation Parent="obj_part" Child="city_wall_gate_tower"/>
      <Relation Parent="obj_part" Child="city_wall_moat"/>
      <Relation Parent="obj_part" Child="city_wall_watchtower"/>
      <Relation Parent="obj_part" Child="city_wall_bastion"/>
      <Relation Parent="obj_part" Child="stele"/>
      <Relation Parent="NONE" Child="water"/>
      <Relation Parent="NONE" Child="landform"/>
      <Relation Parent="obj_part" Child="city_wall_watergate"/>
      <Relation Parent="obj_part" Child="city_wall_pass"/>
      <Relation Parent="obj_part" Child="city_wall_shrine"/>
      <Relation Parent="obj_part" Child="city_wall_suspension_bridge"/>
      <Relation Parent="obj_part" Child="city_wall_inner_wall"/>
      <Relation Parent="obj_part" Child="city_wall_outer_wall"/>
   </Model>
   ...
</ExtraRelations>
```

Relations in the IMMARKUS data will be used to produce the `<Udef_Align_OBJECT>`
tag whose purpose is to align objects with COMARKUS data.  For instance,

``` XML
<doc_content>
   <ImmarkusImage Type="Generic" Url="blob:http://localhost:8088/5d1146cb-551a-4632-a47b-4dbfef4d56e2" FolderHierarchy="Yangzhou-Sample/2. IMAGE ANNOTATION_ARCHAEOLOGY REPORT_Iva-IMMARKUS-Yangzhou/book report" Filename="YLG1.png">YLG1.png</ImmarkusImage>
   <Paragraph Key="mark:0" ImmarkusId="f3bd8e8a-3430-4232-86a6-dbdb6ef6dd82" W3Context="http://www.w3.org/ns/anno.jsonld" ImmarkusType="Annotation" CreatedTime="2024-04-30T09:16:20.351Z" CreatorIsGuest="true" CreatorId="rQPFIGUdOFhLSK87eojN">
      <ImmarkusObj>
         <ImmarkusShape Key="mark:0" SelectorType="SvgSelector" SelectorValue="<svg><polygon points="305.1633198964575,91.33609710723493 469.85862546749104,79.80736628360134 554.7955607137559,78.98391636267593 696.3147656524112,83.10130418511989 833.0118409417166,96.27690029615012 913.7125938853826,105.3351431391906 981.2376643318828,106.15862761457024 1038.8809901827356,106.98209481272278 1039.7044919353425,358.1424755461713 795.1319351732498,341.67295881084965 745.7234195217387,315.31217261199555 716.0782548437057,304.61648568608103 674.9043420648117,288.1258085988264 609.8497077672234,153.09675894885063 567.0289988098413,148.9793884036338 518.443777584212,152.27329175069812 412.21533417109225,128.39246656864103 412.21533417109225,128.39246656864103 412.21533417109225,128.39246656864103" /></svg>"/>
         <ImmarkusBody ImmarkusId="07665f9a-7393-4d25-bdeb-84d5945c3fdf" Type="Dataset" Purpose="classifying" Source="city_wall_moat" Filename="YLG1.png" CreatedTime="2024-04-30T09:18:11.789Z">
            <Udef_Genre_Type>Dataset</Udef_Genre_Type>
            <Udef_Genre_Purpose>classifying</Udef_Genre_Purpose>
            <Udef_Genre_Filename>YLG1.png</Udef_Genre_Filename>
            <Udef_Genre_Subfolder>book.report</Udef_Genre_Subfolder>
            <Udef_Align_OBJECT>OBJ_PART/city_wall_moat</Udef_Align_OBJECT>
            <ImmarkusProperties>
               <div>
                  properties/ID:
                  <Udef_properties_ID>yangzhou_cheng_hao</Udef_properties_ID>
               </div>
               <div>
                  properties/name:
                  <Udef_properties_name>扬州城壕</Udef_properties_name>
               </div>
               <div>
                  properties/materials:
                  <Udef_properties_materials>earth</Udef_properties_materials>
               </div>
               <div>
                  properties/date.start:
                  <Udef_properties_date.start>1368.CE</Udef_properties_date.start>
               </div>
               <div>
                  properties/date.end:
                  <Udef_properties_date.end>1912.CE</Udef_properties_date.end>
               </div>
               <div>
                  properties/date.dynasty:
                  <Udef_properties_date.dynasty>明;清</Udef_properties_date.dynasty>
               </div>
               <div>
                  properties/TGAZ:
                  <Udef_properties_TGAZ>hvd_33309</Udef_properties_TGAZ>
               </div>
               <div>
                  properties/inference:
                  <Udef_properties_inference>abandonment</Udef_properties_inference>
               </div>
               <div>
                  properties/part.of.main.object/instance:
                  <Udef_properties_part.of.main.object_instance>yangzhou_cheng</Udef_properties_part.of.main.object_instance>
               </div>
               <div>
                  properties/part.of.main.object/type:
                  <Udef_properties_part.of.main.object_type>city_wall</Udef_properties_part.of.main.object_type>
               </div>
               <div>
                  Udef_properties_Location:
                  <Udef_properties_Location>32.3835367,119.4395483</Udef_properties_Location>
               </div>
            </ImmarkusProperties>
         </ImmarkusBody>
      </ImmarkusObj>
   </Paragraph>
   ...
</doc_content>
```

is converted from the first component (the index *0* in `<ImmarkusShape Key="mark:0" ...>` 
indicates it corresponds to the first item in the JSON object) of the annotation file 
*YLG1.json*:

``` JSON (YLG1.json)
[
   {
      "id": "f3bd8e8a-3430-4232-86a6-dbdb6ef6dd82",
      "target": {
         "source": "YLG1.png",
         "type": "SpecificResource",
         "selector": {
            "type": "SvgSelector",
            "value": "<svg><polygon points=\"305.1633198964575,91.33609710723493 469.85862546749104,79.80736628360134 554.7955607137559,78.98391636267593 696.3147656524112,83.10130418511989 833.0118409417166,96.27690029615012 913.7125938853826,105.3351431391906 981.2376643318828,106.15862761457024 1038.8809901827356,106.98209481272278 1039.7044919353425,358.1424755461713 795.1319351732498,341.67295881084965 745.7234195217387,315.31217261199555 716.0782548437057,304.61648568608103 674.9043420648117,288.1258085988264 609.8497077672234,153.09675894885063 567.0289988098413,148.9793884036338 518.443777584212,152.27329175069812 412.21533417109225,128.39246656864103 412.21533417109225,128.39246656864103 412.21533417109225,128.39246656864103\" /></svg>"
         }
      },
      "@context": "http://www.w3.org/ns/anno.jsonld",
      "type": "Annotation",
      "body": [
         {
            "id": "07665f9a-7393-4d25-bdeb-84d5945c3fdf",
            "type": "Dataset",
            "purpose": "classifying",
            "source": "city_wall_moat",
            "properties": {
               "ID": "yangzhou_cheng_hao",
               "name": "扬州城壕",
               "materials": "earth",
               "location": [
                  32.3835367,
                  119.4395483
               ],
               "date start": "1368 CE",
               "date end": "1912 CE",
               "date dynasty": "明;清",
               "TGAZ": "https://maps.cga.harvard.edu/tgaz/placename/hvd_33309",
               "inference": "abandonment",
               "part of main object": {
                  "instance": "yangzhou_cheng",
                  "type": "city_wall"
               }
            },
            "created": "2024-04-30T09:18:11.789Z",
            "modified": "2025-05-23T13:24:45.154Z"
         }
      ],
      "created": "2024-04-30T09:16:20.351Z",
      "creator": {
         "isGuest": true,
         "id": "rQPFIGUdOFhLSK87eojN"
      },
      "modified": "2025-05-23T13:22:07.703Z"
   },
   ...
]
```

Each item in the body properties will be converted to a DocuXml tag with prefix
*Udef_properties_*.  For instance, the DocuXml

``` XML (example target)
<div>
   properties/ID:
   <Udef_properties_ID>yangzhou_cheng_hao</Udef_properties_ID>
</div>
```

is converted from the properties field `ID` with value `yangzhou_cheng_hao`.  The
`selector` value in the JSON file is transformed to the `<ImmarkusShape>` tag whose
`SelectorValue` value describes the svg polygon shape.


The `<Udef_Align_OBJECT>OBJ_PART/city_wall_moat</Udef_Align_OBJECT>` tag is generated 
by indetifying the "parent" of *city_wall_moat* from IMMARKUS data model (check with
the generated relation tag
`<Relation Parent="obj_part" Child="city_wall_moat"/>`).

I2D converts IMMARKUS foldler metadata (stored in *_immarkus.folder.meta.json*) to 
tags within the document `xml_metadata` tag.  Notice that some information not
important (e.g., the `id` field) is dropped in the converting process.


``` XML (metadata)
<xml_metadata>
   <Udef_DocMeta_Source_title_ch_>扬州城.:.1987-1998年考古发掘报告.</Udef_DocMeta_Source_title_ch_>
   <Udef_DocMeta_Source_title_py_>.Yangzhou.Cheng.:.1987-1998.Nian.Kao.Gu.Fa.Jue.Bao.Gao</Udef_DocMeta_Source_title_py_>
   <Udef_DocMeta_Source_author_>中国社会科学院考古研究所;南京博物院;扬州市文物考古研究所</Udef_DocMeta_Source_author_>
   <Udef_DocMeta_Publication_time_>2010</Udef_DocMeta_Publication_time_>
   <Udef_DocMeta_Publication_place>北京市</Udef_DocMeta_Publication_place>
   <Udef_DocMeta_Publisher_ch>文物出版社</Udef_DocMeta_Publisher_ch>
   <Udef_DocMeta_Publisher_py_>Wen.Wu.Chu.Ban.Shi</Udef_DocMeta_Publisher_py_>
   <Udef_DocMeta_ISBN>.9787501029884,.7501029881</Udef_DocMeta_ISBN>
   <Udef_DocMeta_Language>Chinese</Udef_DocMeta_Language>
   <Udef_DocMeta_Place_covered>揚州</Udef_DocMeta_Place_covered>
</xml_metadata>
```

Given an image with *\<filename\>.png* (the images are mostly with .png extension,
except a few with .jpg extension), IMMARKUS stores its metadata and annotations 
in the file named *\<filename\>.json*.  The JSON is supposed to be an array of 
piece annotations.  Image metadata is stored as a piece annotation except that
its does not have the `id` field.  To ease the converion, *I2D* transforms each
piece annotation to a `Paragraph`.  The image metadata (i.e., the piece annotations
without the `id` field) will be converted to a `Paragraph` with `ImmarkusId="NULL"`.

Since the file `YLG1.json` does not have image metadata, let's take the file
*iiif.42b6679004af795d.annotations.json* for illustration:

``` JSON (iiif.42b6679004af795d.annotations.json)
[
  ...,
  {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "type": "Annotation",
    "id": "8a75c900-e75d-4e25-b94e-e608067b970f",
    "target": {
      "source": "iiif:42b6679004af795d"
    },
    "body": {
      "source": "artwork",
      "properties": {
        "Image_title_ch": "揚州府圖說",
        "Image_title_py": "Yangzhou Fu tu shuo",
        "Image_title_en": "Illustrated Album of Yangzhou Prefecture",
        "Image_author": "anonymous",
        "Publication_time": "明萬曆 (between 1573 and 1620)",
        "Place_covered": "揚州",
        "TGAZ_cv": "hvd_33309",
        "Genre": "map_pictorial",
        "Medium": "painted on paper",
        "Format": "atlas",
        "Size_h": {
          "value": 38,
          "unit": "cm"
        },
        "Size_w": {
          "value": 19,
          "unit": "cm"
        },
        "Location_held": "Library of Congress",
        "Data_source": "Library of Congress",
        "Data_source_url": "https://lccn.loc.gov/2001708631",
        "Language": "Chinese",
        "Institution_dig": "Chinese Rare Book Collection (Library of Congress)"
      },
      "purpose": "describing"
    }
  },
  {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "type": "Annotation",
    "id": "b900edc7-bcee-422a-ad13-aef52a19fc6b",
    "target": {
      "source": "iiif:42b6679004af795d:1562217993"
    },
    "body": {
      "source": "artwork",
      "properties": {
        "Image_title_ch": "江都縣圖説",
        "Image_title_py": "Jiangdu xian tushuo",
        "Image_title_en": "Illustrated Essay of Jiangdu County",
        "Volume": "1",
        "Page": "4a-b",
        "Image_url": "https://www.loc.gov/resource/lcnclscd.2001708631.1A001/?sp=4"
      },
      "purpose": "describing"
    }
  },
  {
    "id": "cb41e468-c9ef-4d0f-b5a5-270df4f4a626",
    "target": {
      "source": "iiif:42b6679004af795d:1562217993",
      "type": "SpecificResource",
      "selector": {
        "type": "SvgSelector",
        "value": "<svg><polygon points=\"1921.903454991427,1872.6686273875102 1912.683516256344,1929.5249162538548 1998.7362777837843,1929.5249162538548 1987.9702461584684,1871.1225344972777\" /></svg>"
      }
    },
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "type": "Annotation",
    "body": [
      {
        "id": "06064a5d-68e0-453b-aa78-f4982f9d07d2",
        "type": "Dataset",
        "purpose": "classifying",
        "source": "city_wall_gate",
        "properties": {
          "name": "揚州城北門",
          "direction": "north",
          "texture": "unadorned"
        },
        "created": "2025-05-28T09:09:04.076Z",
        "modified": "2025-06-16T15:22:58.524Z"
      }
    ],
    "created": "2025-05-28T09:07:42.459Z",
    "creator": {
      "isGuest": true,
      "id": "jhQMylOqOKAaEfbCV_Aa"
    }
  },
  ...
]
```

Here we list three elements.  Notice that the top two elements do not have the
`created` and `creator` fields.  The first has `target.source := iiif:42b6679004af795d` 
which indicates it describe the user-specified metadata for this IIIF image.  Data 
in this element will be converted to "folder metadata" stored under the 
`<xml_metadata>` tag illustrated as follows

<img src="./docs/immarkus-data-transform-samples/images/iiif.42b6679004af795d.annotations.json-xml_metadata.png" alt="iiif:42b6679004af795d xml_metadata" style="border:1px solid #123456; border-radius:4px; padding:4px; max-width:960px; height:auto;" />

The second element (with `target.source := iiif:42b6679004af795d:1562217993`) 
stands for "image metadata" since its `body` field  does not contain an `id` 
subfield.  Immarkus2D will convert the second element to

<img src="./docs/immarkus-data-transform-samples/images/iiif.42b6679004af795d.annotations.json-image_metadata.png" alt="iiif:42b6679004af795d image metadata" style="border:1px solid #123456; border-radius:4px; padding:4px; max-width:1280px; height:auto;" />


The third element in the above example illustrates a typical piece annotation.  It
will be converted to the following piece of XML:

``` XML (the 24th elements of the immarkus json array)
<Paragraph Key="mark:23" ImmarkusId="cb41e468-c9ef-4d0f-b5a5-270df4f4a626" W3Context="http://www.w3.org/ns/anno.jsonld" ImmarkusType="Annotation" CreatedTime="2025-05-28T09:07:42.459Z" CreatorIsGuest="true" CreatorId="jhQMylOqOKAaEfbCV_Aa">
   <ImmarkusObj>
      <ImmarkusShape Key="mark:23" SelectorType="SvgSelector" SelectorValue="<svg><polygon points="1921,1872 1912,1929 1998,1929 1987,1871"></polygon></svg>"/>
      <ImmarkusBody ImmarkusId="06064a5d-68e0-453b-aa78-f4982f9d07d2" Type="Dataset" Purpose="classifying" Source="city_wall_gate" Filename="iiif:42b6679004af795d:1562217993" CreatedTime="2025-05-28T09:09:04.076Z">
      <Udef_Genre_Type>Dataset</Udef_Genre_Type>
      <Udef_Genre_Purpose>classifying</Udef_Genre_Purpose>
      <Udef_Genre_Source>city_wall_gate</Udef_Genre_Source>
      <Udef_Genre_Filename>iiif:42b6679004af795d:1562217993</Udef_Genre_Filename>
      <Udef_Genre_Subfolder>iiif:42b6679004af795d</Udef_Genre_Subfolder>
      <Udef_Align_OBJECT>OBJ_PART/city_wall_gate</Udef_Align_OBJECT>
      <ImmarkusProperties>
         <div>
            properties/name:
            <Udef_properties_name>揚州城北門</Udef_properties_name>
         </div>
         <div>
            properties/direction:
            <Udef_properties_direction>north</Udef_properties_direction>
         </div>
         <div>
            properties/texture:
            <Udef_properties_texture>unadorned</Udef_properties_texture>
         </div>
      </ImmarkusProperties>
      </ImmarkusBody>
   </ImmarkusObj>
</Paragraph>
```

Notice that the paragraph has attribute `Key="mark:23"`, but it corresponds to
the 24th elements in *iiif.42b6679004af795d.annotations.json*.


---

## 4. IMMARKUS DocuXml tags

The converted DocuXml contains several types of tags.

- **Udef_DocMeta_\<subject\>**: image metadata.  Examples include 
  **Udef_DocMeta_Source_title_ch**,
  **Udef_DocMeta_Source_author**, **Udef_DocMeta_Compilation**, etc.

- **Udef_properties_\<subject\>**: annotated image properties.  Examples i
  nclude **Udef_properties_DILA_PL**,
  **Udef_properties_Image_title**, **Udef_properties_Page**, 
  **"Udef_properties_relation_to_wall**, etc.

- **Udef_PieceTreePath** and **Udef_PieceTreePath.Genre1**: tags for producing
  the tree-structured post-search classification.

- **Udef_Img_\<subject\>**: extra tags for specifying image classes or types.
  Currently there is only one such tag, namely **Udef_Img_EntityClass**.

- **Udef_Genre_\<subject\>**: tags reserved.  There are four genre tags, 
  including **Udef_Genre_Subfolder**, **Udef_Genre_Filename**, 
  **Udef_Genre_Purpose** and **Udef_Genre_Type**.

- **Udef_Align_\<subject\>**: tags for aligning COMARKUS event annotations 
  and IMMARKUS image annotations.  Example: **Udef_Align_OBJECT**.


