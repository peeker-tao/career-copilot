from modelscope.hub.api import HubApi
from modelscope import dataset_snapshot_download
import os

target_dir = r"D:\old\项目\工程实训（二）\datasets\resume_ner"

print("正在下载 ModelScope Resume NER 数据集...")
os.makedirs(target_dir, exist_ok=True)

dataset_snapshot_download(dataset_id="iic/resume_ner", cache_dir=target_dir)

print(f"数据集已保存到: {target_dir}")
print("文件列表:")
for root, dirs, files in os.walk(target_dir):
    for f in files:
        rel_path = os.path.relpath(os.path.join(root, f), target_dir)
        size = os.path.getsize(os.path.join(root, f))
        print(f"  - {rel_path} ({size:,} bytes)")
