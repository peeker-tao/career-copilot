## 【求职导航】—— AI模拟面试官与职业规划

### 数据集27：Resume Dataset（简历分类）✅ 已下载

| 字段 | 内容 |
|------|------|
| **名称** | Resume Dataset（Kaggle） |
| **描述** | 涵盖简历解析、候选人画像、岗位匹配的综合简历数据集（英文） |
| **主要下载链接** | <https://www.kaggle.com/datasets/saugataroyarghya/resume-dataset> |
| **许可证** | CC0 Public Domain |
| **本地路径** | `datasets/resume_datasets/resume_data.csv` |
| **规模** | 9,544 条简历记录，35 列（含技能、教育、工作经历、匹配评分等） |
| **优先级** | 🟢 已下载 |
| **备注** | 下载脚本: `datasets/download_resume_dataset.py` |

### 数据集28：简历命名实体识别数据集（中文）✅ 已下载

| 字段 | 内容 |
|------|------|
| **名称** | Resume NER（ModelScope/阿里） |
| **描述** | 中文简历命名实体识别数据集，BIO 标注格式（CoNLL 标准），含 8 种实体类型 |
| **规模** | 训练集 3,821 句 / 验证集 463 句 / 测试集 477 句 |
| **实体类型** | 国籍(CONT)、教育背景(EDU)、地名(LOC)、人名(NAME)、组织名(ORG)、专业(PRO)、民族(RACE)、职称(TITLE) |
| **主要下载链接** | <https://www.modelscope.cn/datasets/iic/resume_ner/summary> |
| **许可证** | CC BY 4.0 |
| **本地路径** | `datasets/resume_ner/iic/resume_ner/`（含 train.txt, dev.txt, test.txt） |
| **优先级** | 🟢 已下载 |
| **备注** | 下载脚本: `datasets/download_resume_ner.py`；分析脚本: `datasets/analyze_resume_ner.py` |

### 数据集29：AI驱动简历筛选数据集（2025）✅ 已下载

| 字段 | 内容 |
|------|------|
| **名称** | AI-Driven Resume Screening Dataset 2025 |
| **描述** | 1000+综合简历，含技能、经验、教育、AI筛选分数等字段，适合职业路径分析 |
| **规模** | 1000+ 条（4种岗位，AI平均分84.0） |
| **主要下载链接** | <https://www.heywhale.com/mw/dataset/67d58e8601a3c032ac0e412d> |
| **许可证** | 开源 |
| **本地路径** | `datasets/AI_Resume_Screening/AI_Resume_Screening.csv` |
| **优先级** | 🟢 已下载 |

### 数据集30：Resumes 原始PDF简历分类数据集（HuggingFace）✅ 已下载（本地完整存档）

| 字段 | 内容 |
|------|------|
| **名称** | opensporks/resumes（HuggingFace） |
| **描述** | 原始PDF简历文件，按24个职业类别分类，含完整简历文本（Summary/Experience/Education等） |
| **规模** | **2,484 份原始PDF简历**，24个职业类别 |
| **类别列表** | ACCOUNTANT, ADVOCATE, AGRICULTURE, APPAREL, ARTS, AUTOMOBILE, AVIATION, BANKING, BPO, BUSINESS-DEVELOPMENT, CHEF, CONSTRUCTION, CONSULTANT, DESIGNER, DIGITAL-MEDIA, ENGINEERING, FINANCE, FITNESS, HEALTHCARE, HR, INFORMATION-TECHNOLOGY, PUBLIC-RELATIONS, SALES, TEACHER |
| **主要下载链接** | <https://huggingface.co/datasets/opensporks/resumes> |
| **许可证** | 待确认 |
| **本地路径** | `datasets/opensporks_resumes/{CATEGORY}/{id}.pdf`（含索引文件 `index.csv`） |
| **优先级** | 🟢 已下载 |
| **备注** | 下载脚本: `datasets/download_opensporks_resumes.py`；各类别数量见数据集分析文档 |
