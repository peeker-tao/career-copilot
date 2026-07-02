---
license: other
tags:
- NER
text:
  token-classification:    
    type:
      - ner
    language:
      - zh

---

# Resume命名实体识别数据集

## 数据集概述
Resume数据集是面向简历的中文命名实体识别数据集。

### 数据集简介
本数据集包括训练集（3821）、验证集（463）、测试集（477），实体类型包括国籍(CONT)、教育背景(EDU)、地名(LOC)、人名(NAME)、组织名(ORG)、专业(PRO)、民族(RACE)、职称(TITLE)。

### 数据集的格式和结构
数据格式采用conll标准，数据分为两列，第一列是输入句中的词划分，第二列是每个词对应的命名实体类型标签。一个具体case的例子如下：

```
1 O
9 O
7 O
0 O
年 O
出 O
生 O
， O
经 B-PRO
济 I-PRO
学 I-PRO
硕 B-EDU
士 I-EDU
， O
注 B-TITLE
册 I-TITLE
会 I-TITLE
计 I-TITLE
师 I-TITLE
、 O
注 B-TITLE
册 I-TITLE
税 I-TITLE
务 I-TITLE
师 I-TITLE
。 O

```

## 数据集版权信息

Creative Commons Attribution 4.0 International。

## 引用方式
  ```bib
    @inproceedings{levow-2006-third,
        title = "The Third International {C}hinese Language Processing Bakeoff: Word Segmentation and Named Entity Recognition",
        author = "Levow, Gina-Anne",
        booktitle = "Proceedings of the Fifth {SIGHAN} Workshop on {C}hinese Language Processing",
        month = jul,
        year = "2006",
        address = "Sydney, Australia",
        publisher = "Association for Computational Linguistics",
        url = "https://aclanthology.org/W06-0115",
        pages = "108--117",
    }
  ```
