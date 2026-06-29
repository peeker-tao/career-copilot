"""
Embedding Worker —— 本地 Embedding 子进程
==========================================
由 Node.js (SimpleRagService) 通过 child_process 启动，
模型常驻内存，通过 stdin/stdout 以 JSON 行协议通信。

协议：
  → 发送: {"text": "要嵌入的文本"}
  ← 收到: {"ok": true, "embedding": [0.123, -0.456, ...]}
  ← 错误: {"ok": false, "error": "错误消息"}

首次运行会自动下载模型（约 30MB），后续直接加载缓存。
"""

import sys
import json
import traceback
import io

# Windows 管道编码修复：确保 stdin/stdout 使用 UTF-8
if sys.platform == "win32":
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 使用 ONNX 运行时，不需要 PyTorch
from fastembed import TextEmbedding

# ── 初始化模型 ──────────────────────────────────────────────────
# BGE-Small-ZH: 384 维，中文语义效果好，轻量快速
MODEL_NAME = "BAAI/bge-small-zh-v1.5"

def main():
    # 加载模型（首次自动下载，后续从缓存加载）
    model = TextEmbedding(MODEL_NAME)
    
    # 告诉 Node.js 进程模型已就绪
    init_msg = json.dumps({"ok": True, "ready": True, "model": MODEL_NAME})
    sys.stdout.write(init_msg + "\n")
    sys.stdout.flush()

    # ── 主循环：逐行读取 stdin ──────────────────────────────────
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
            text = request.get("text", "")
            req_id = request.get("id", None)  # 可选请求 ID，用于匹配异步响应

            if not isinstance(text, str) or not text.strip():
                response = {"ok": False, "error": "text 字段为空"}
                if req_id is not None:
                    response["id"] = req_id
            else:
                # 生成嵌入向量
                embedding = list(model.embed(text))[0].tolist()
                response = {"ok": True, "embedding": embedding}
                if req_id is not None:
                    response["id"] = req_id

        except Exception as e:
            traceback.print_exc(file=sys.stderr)
            response = {"ok": False, "error": str(e)}

        # 写回结果
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
