"""
下载 Embedding 模型（首次使用需要）
用法: python scripts/download_model.py
设置 HF_ENDPOINT=https://hf-mirror.com 使用国内镜像
"""

import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from fastembed import TextEmbedding

MODEL = "BAAI/bge-small-zh-v1.5"
print(f"⏳ 正在下载模型 {MODEL} ...")
model = TextEmbedding(MODEL)
print(f"✅ 模型下载完成！向量维度: {model.model.model.config.dim}")
