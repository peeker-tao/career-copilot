from huggingface_hub import dataset_info
from datasets import load_dataset
from collections import Counter
import io
import pdfplumber

# 获取数据集元信息
print("=== 数据集元信息 ===")
info = dataset_info("opensporks/resumes")
print(f"作者: {info.author}")
print(f"描述: {info.description[:1000] if info.description else 'N/A'}")
print(f"许可证: {info.cardData.get('license', 'N/A') if info.cardData else 'N/A'}")
print(f"标签: {info.tags}")
print(f"文件总数: {len(info.siblings)}")

# 统计各类别
categories = Counter()
total_size = 0
for f in info.siblings:
    parts = f.rfilename.split("/")
    if len(parts) >= 3 and parts[0] == "data" and parts[1] == "data":
        cat = parts[2]
        categories[cat] += 1
        if f.size:
            total_size += f.size

print(f"\n总数据大小: {total_size / 1024 / 1024:.1f} MB")
print(f"\n=== 类别分布 ===")
for cat, count in categories.most_common():
    print(f"  {cat}: {count} 份简历")

# 加载数据集（streaming 模式）
print("\n=== 加载数据集（前3条样本）===")
ds = load_dataset("opensporks/resumes", split="train", streaming=True)
print(f"数据集特征: {ds.features}")

for i, sample in enumerate(ds):
    if i >= 3:
        break
    label_name = ds.features["label"].int2str(sample["label"])
    pdf_bytes = sample["pdf"]
    print(
        f"\n--- 样本 {i+1} | 类别: {label_name} | PDF大小: {len(pdf_bytes):,} bytes ---"
    )
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = ""
        for page in pdf.pages[:2]:
            text += page.extract_text() or ""
        print(f"  内容预览 ({len(text)} 字符):")
        print(f"  {text[:600]}")

print("\n✅ 分析完成")
