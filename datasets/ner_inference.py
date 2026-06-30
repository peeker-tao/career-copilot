"""
Resume NER 中文简历命名实体识别推理服务

基于 ModelScope iic/resume_ner 数据集的 BIO 标注模式，
提供中文简历的实体提取能力。

支持提取的实体类型：
  - NAME:  姓名
  - CONT:  国籍
  - RACE:  民族
  - TITLE: 职务/职称
  - EDU:   学历
  - ORG:   组织机构/学校/公司
  - PRO:   专业
  - LOC:   地点

两种模式：
  1. API 服务模式 (默认): python ner_inference.py --serve
     启动 HTTP API，后端可通过 REST 调用
  2. 命令行模式: python ner_inference.py --text "简历文本"
     直接输出识别结果
"""

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# ============================================================
# 配置
# ============================================================
NER_DATA_DIR = os.path.join(os.path.dirname(__file__), "resume_ner", "iic", "resume_ner")
DEFAULT_PORT = 8001

# ============================================================
# BIO 标签解析 — 从训练数据构建词典
# ============================================================

class ResumeNER:
    """基于词典匹配 + 规则的中文简历 NER 引擎"""

    TAG_NAMES = {
        "NAME": "姓名",
        "CONT": "国籍",
        "RACE": "民族",
        "TITLE": "职务/职称",
        "EDU": "学历",
        "ORG": "组织机构",
        "PRO": "专业",
        "LOC": "地点",
    }

    # 学历关键词（来自 EDU 标签）
    EDU_KEYWORDS = [
        "博士", "硕士", "学士", "本科", "专科", "大专",
        "研究生", "MBA", "EMBA", "博士后",
        "高中", "中专", "初中",
        "工学学士", "理学学士", "文学学士", "法学学士",
    ]

    # 常见职务关键词（来自 TITLE 标签）
    TITLE_KEYWORDS = [
        "工程师", "高级工程师", "总工程师", "技术总监", "CTO",
        "项目经理", "产品经理", "总经理", "董事长", "CEO",
        "主任", "副主任", "教授", "副教授", "讲师",
        "研究员", "助理研究员", "博士", "硕士生导师",
        "注册会计师", "注册建筑师",
        "党员", "党委书记", "支部书记",
        "主席", "会长", "秘书长",
    ]

    # 专业关键词（来自 PRO 标签）
    PRO_KEYWORDS = [
        "计算机", "软件工程", "电子信息", "通信工程", "自动化",
        "机械工程", "土木工程", "建筑学", "化学", "物理",
        "数学", "统计学", "经济学", "金融", "会计",
        "法律", "英语", "中文", "新闻", "艺术",
        "材料", "环境", "生物", "医学", "药学",
    ]

    def __init__(self):
        self.entity_dict = defaultdict(set)
        self._load_bio_patterns()

    def _load_bio_patterns(self):
        """从 BIO 训练数据中提取实体模式"""
        train_path = os.path.join(NER_DATA_DIR, "train.txt")
        if not os.path.exists(train_path):
            print(f"⚠️  未找到训练数据: {train_path}")
            print("   将仅使用规则匹配")
            return

        current_entity = []
        current_tag = None

        with open(train_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    # 空行 = 句子结束
                    if current_entity and current_tag:
                        entity_text = "".join(current_entity)
                        if len(entity_text) >= 2:
                            self.entity_dict[current_tag].add(entity_text)
                    current_entity = []
                    current_tag = None
                    continue

                parts = line.split()
                if len(parts) != 2:
                    # 尝试按空格分割（BIO 文件可能使用空格）
                    parts = [p for p in line.replace("\t", " ").split(" ") if p]
                    if len(parts) < 2:
                        continue

                char, tag = parts
                if tag.startswith("B-"):
                    # 保存之前的实体
                    if current_entity and current_tag:
                        entity_text = "".join(current_entity)
                        if len(entity_text) >= 2:
                            self.entity_dict[current_tag].add(entity_text)
                    current_entity = [char]
                    current_tag = tag[2:]
                elif tag.startswith("I-") and current_tag == tag[2:]:
                    current_entity.append(char)
                else:
                    # O 标签
                    if current_entity and current_tag:
                        entity_text = "".join(current_entity)
                        if len(entity_text) >= 2:
                            self.entity_dict[current_tag].add(entity_text)
                    current_entity = []
                    current_tag = None

        # 统计
        total = sum(len(v) for v in self.entity_dict.values())
        print(f"📚 从训练数据加载了 {total} 个实体模式:")
        for tag, items in sorted(self.entity_dict.items()):
            print(f"   {self.TAG_NAMES.get(tag, tag)} ({tag}): {len(items)} 个")

    def extract(self, text: str) -> dict:
        """从中文文本中提取命名实体

        Args:
            text: 中文文本（简历内容）

        Returns:
            {
                "entities": {
                    "NAME": ["张三"],
                    "EDU": ["本科", "硕士"],
                    ...
                },
                "stats": { "total": 5, ... }
            }
        """
        if not text or not text.strip():
            return {"entities": {}, "stats": {"total": 0}}

        result = defaultdict(list)

        # 1. 基于词典匹配（从BIO数据提取的模式）
        for tag, patterns in self.entity_dict.items():
            for pattern in patterns:
                if pattern in text:
                    result[tag].append(pattern)

        # 2. 基于规则的补充提取
        self._rule_based_extract(text, result)

        # 3. 去重并排序（按出现位置）
        unique_result = {}
        for tag, items in result.items():
            # 去重并保持顺序
            seen = set()
            ordered = []
            for item in items:
                if item not in seen:
                    seen.add(item)
                    ordered.append(item)
            unique_result[tag] = ordered

        # 4. 统计
        stats = {
            "total": sum(len(v) for v in unique_result.values()),
        }
        for tag, items in unique_result.items():
            stats[tag] = len(items)

        tag_names = {v: k for k, v in self.TAG_NAMES.items()}
        named_result = {}
        for tag, items in unique_result.items():
            name = self.TAG_NAMES.get(tag, tag)
            named_result[name] = items

        return {"entities": named_result, "stats": stats}

    def _rule_based_extract(self, text: str, result: defaultdict):
        """基于规则的实体提取补充"""
        # 学历
        for kw in self.EDU_KEYWORDS:
            if kw in text and kw not in result.get("EDU", []):
                result["EDU"].append(kw)

        # 职务
        for kw in self.TITLE_KEYWORDS:
            if kw in text and kw not in result.get("TITLE", []):
                result["TITLE"].append(kw)

        # 专业
        for kw in self.PRO_KEYWORDS:
            if kw in text and kw not in result.get("PRO", []):
                result["PRO"].append(kw)

        # 姓名提取：简单规则（"姓名：XXX" 或 "姓名 XXX" 模式）
        name_patterns = [
            r"(?:姓名[：:]\s*)([\u4e00-\u9fff]{2,4})",
            r"(?:名字[：:]\s*)([\u4e00-\u9fff]{2,4})",
            r"(?:Name[：:]\s*)([A-Za-z\s]+)",
        ]
        for pat in name_patterns:
            match = re.search(pat, text)
            if match:
                result["NAME"].append(match.group(1).strip())

        # 邮箱提取
        email_pat = r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"
        email_match = re.search(email_pat, text)
        if email_match:
            result["CONT"].append(email_match.group(1))

        # 电话提取
        phone_pat = r"(1[3-9]\d{9})"
        phone_match = re.search(phone_pat, text)
        if phone_match:
            result["CONT"].append(phone_match.group(1))

    def extract_structured(self, text: str) -> dict:
        """提取并转换为结构化简历格式

        与后端 ParsedResumeResult 兼容的输出
        """
        raw = self.extract(text)
        entities = raw["entities"]

        # 构建结构化结果
        result = {
            "basicInfo": {
                "name": entities.get("姓名", [""])[0] if entities.get("姓名") else None,
                "phone": None,
                "email": None,
            },
            "education": [],
            "experience": [],
            "skills": [],
            "summary": None,
            "ner_raw": entities,  # 保留原始 NER 结果
        }

        # 提取联系方式
        for item in entities.get("国籍", []):
            if "@" in item:
                result["basicInfo"]["email"] = item
            elif re.match(r"1[3-9]\d{9}", item):
                result["basicInfo"]["phone"] = item

        # 构建教育经历
        edu_parts = []
        for edu in entities.get("学历", []):
            edu_parts.append(edu)
        if edu_parts:
            result["education"].append({
                "school": entities.get("组织机构", [""])[0] if entities.get("组织机构") else "",
                "major": entities.get("专业", [""])[0] if entities.get("专业") else "",
                "degree": "、".join(edu_parts),
            })

        # 技能提取（合并 TITLE 中与技术相关的）
        skills = []
        for title in entities.get("职务/职称", []):
            if any(kw in title for kw in ["工程师", "技术", "开发", "设计", "架构"]):
                skills.append(title)
        result["skills"] = skills

        return result


# ============================================================
# HTTP API 服务
# ============================================================

def serve_api(port: int):
    """启动 HTTP API 服务"""
    try:
        from http.server import HTTPServer, BaseHTTPRequestHandler
    except ImportError:
        print("❌ 需要 http.server 模块（Python 标准库）")
        sys.exit(1)

    ner = ResumeNER()

    class NERHandler(BaseHTTPRequestHandler):
        def do_POST(self):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            try:
                data = json.loads(body)
                text = data.get("text", "")
                mode = data.get("mode", "full")
            except (json.JSONDecodeError, TypeError):
                self._respond(400, {"error": "无效的 JSON"})
                return

            if not text:
                self._respond(400, {"error": "text 字段不能为空"})
                return

            if mode == "structured":
                result = ner.extract_structured(text)
            else:
                result = ner.extract(text)

            self._respond(200, result)

        def do_GET(self):
            """健康检查"""
            if self.path == "/health":
                self._respond(200, {"status": "ok", "service": "resume-ner"})
            elif self.path == "/tags":
                self._respond(200, {"tags": ResumeNER.TAG_NAMES})
            else:
                self._respond(404, {"error": "Not Found"})

        def _respond(self, status: int, data: dict):
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

        def do_OPTIONS(self):
            self._respond(200, {})

        def log_message(self, format, *args):
            print(f"  📡 {args[0]} {args[1]} {args[2]}")

    server = HTTPServer(("0.0.0.0", port), NERHandler)
    print(f"\n🧠 Resume NER 服务已启动")
    print(f"   API: http://localhost:{port}")
    print(f"   健康检查: http://localhost:{port}/health")
    print(f"   标签列表: http://localhost:{port}/tags")
    print(f"   实体提取: POST http://localhost:{port} (JSON body: {{\"text\": \"...\"}})")
    print(f"\n按 Ctrl+C 停止服务\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 服务已停止")
        server.server_close()


# ============================================================
# 命令行模式
# ============================================================

def cli_mode(text: str, mode: str):
    """命令行模式运行 NER"""
    ner = ResumeNER()

    if mode == "structured":
        result = ner.extract_structured(text)
    else:
        result = ner.extract(text)

    print(json.dumps(result, ensure_ascii=False, indent=2))


def demo_mode():
    """演示模式"""
    ner = ResumeNER()
    samples = [
        "张明，男，中国国籍，1988年出生，汉族，中共党员，本科学历，计算机科学与技术专业，高级工程师，毕业于北京大学。",
        "李芳，硕士学历，毕业于清华大学计算机系，5年Java开发经验，现任高级软件工程师。",
        "王伟，博士，人工智能专业，毕业于浙江大学，研究方向为自然语言处理，曾任阿里巴巴算法工程师。",
    ]

    print("\n" + "=" * 60)
    print("🧪 NER 演示：中文简历实体识别")
    print("=" * 60)

    for i, sample in enumerate(samples, 1):
        print(f"\n--- 示例 {i} ---")
        print(f"📝 文本: {sample[:60]}...")
        result = ner.extract(sample)
        print(f"📊 结果:")
        for tag, items in result["entities"].items():
            if items:
                print(f"   {tag}: {', '.join(items)}")
        print(f"📈 统计: {result['stats']}")


# ============================================================
# 主入口
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Resume NER 中文简历命名实体识别")
    parser.add_argument("--serve", action="store_true", help="启动 HTTP API 服务")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="API 端口号")
    parser.add_argument("--text", type=str, help="要识别的文本（命令行模式）")
    parser.add_argument("--mode", type=str, default="full", choices=["full", "structured"], help="输出模式")
    parser.add_argument("--demo", action="store_true", help="运行演示")

    args = parser.parse_args()

    if args.serve:
        serve_api(args.port)
    elif args.text:
        cli_mode(args.text, args.mode)
    elif args.demo:
        demo_mode()
    else:
        parser.print_help()
        print("\n💡 提示: 使用 --demo 查看演示，--serve 启动 API 服务")
