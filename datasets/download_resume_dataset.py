import kagglehub
import shutil
import os

# 目标路径
target_dir = r"D:\old\项目\工程实训（二）\datasets\resume_datasets"

# Download latest version
print("正在下载 Kaggle Resume Dataset...")
path = kagglehub.dataset_download("saugataroyarghya/resume-dataset")

print("下载路径:", path)

# 复制文件到目标目录
os.makedirs(target_dir, exist_ok=True)
for item in os.listdir(path):
    src = os.path.join(path, item)
    dst = os.path.join(target_dir, item)
    if os.path.isfile(src):
        shutil.copy2(src, dst)
    else:
        shutil.copytree(src, dst, dirs_exist_ok=True)

print(f"数据集已保存到: {target_dir}")
print("文件列表:")
for item in os.listdir(target_dir):
    print(f"  - {item}")
