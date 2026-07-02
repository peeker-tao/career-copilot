"""
从 HuggingFace 缓存中读取 opensporks/resumes 数据集，保存全部 PDF 到本地
（2484 个 PDF 已在 HF 缓存中，直接从缓存读取保存）
"""

from datasets import load_dataset
import os
import csv

target_dir = r"D:\old\项目\工程实训（二）\datasets\opensporks_resumes"

print("正在从 HuggingFace 缓存读取 opensporks/resumes 数据集...")
print("所有文件已在缓存中，无需网络请求")

# 非流式加载（数据已在缓存中）
ds = load_dataset("opensporks/resumes", split="train", streaming=True)

# 获取类别名称
label_names = ds.features["label"].names
print(f"类别数: {len(label_names)}")
print(f"类别列表: {label_names}")

# 获取总行数
print("正在统计总行数...")
ds_full = load_dataset("opensporks/resumes", split="train", streaming=False)
total = len(ds_full)
print(f"数据集总数: {total} 份简历")
del ds_full

os.makedirs(target_dir, exist_ok=True)

# 流式迭代逐个保存 PDF
ds = load_dataset("opensporks/resumes", split="train", streaming=True)
ds_iter = iter(ds)

stats = {}
success_count = 0
fail_count = 0

for i in range(total):
    try:
        sample = next(ds_iter)
        label_idx = sample["label"]
        label_str = label_names[label_idx] if isinstance(label_idx, int) else label_idx
        pdf_bytes = sample["pdf"]

        cat_dir = os.path.join(target_dir, label_str)
        os.makedirs(cat_dir, exist_ok=True)

        pdf_path = os.path.join(cat_dir, f"{i+1}.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        stats[label_str] = stats.get(label_str, 0) + 1
        success_count += 1

        if (i + 1) % 300 == 0:
            print(f"  [{i+1}/{total}] ...")

    except Exception as e:
        fail_count += 1
        print(f"  ❌ [{i+1}] 保存失败: {e}")
        if fail_count > 10:
            print("  ⚠️ 失败次数过多，停止")
            break

# 生成索引 CSV
print("\n正在生成索引文件...")
idx_path = os.path.join(target_dir, "index.csv")
with open(idx_path, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["id", "category", "file_path"])
    for cat_name in sorted(stats.keys()):
        cat_dir = os.path.join(target_dir, cat_name)
        if os.path.isdir(cat_dir):
            fnames = sorted(
                os.listdir(cat_dir), key=lambda x: int(x.replace(".pdf", ""))
            )
            for fname in fnames:
                w.writerow([fname.replace(".pdf", ""), cat_name, f"{cat_name}/{fname}"])

print(f"\n{'='*50}")
print(f"✅ 处理完成！")
print(f"   成功: {success_count} 份")
print(f"   失败: {fail_count} 份")
print(f"\n=== 各类别数量 ===")
for cat, count in sorted(stats.items()):
    print(f"  {cat}: {count} 份")
print(f"\n索引文件: {idx_path}")
print(f"PDF 目录: {target_dir}\\")
print(f"{'='*50}")
print(f"✅ 下载完成！")
print(f"   成功: {success_count} 份")
print(f"   失败: {fail_count} 份")
print(f"\n=== 各类别数量 ===")
for cat, count in sorted(stats.items()):
    print(f"  {cat}: {count} 份")
print(f"\n索引文件: {idx_path}")
print(f"PDF 目录: {target_dir}\\")
print(f"{'='*50}")
