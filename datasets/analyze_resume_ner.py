from collections import Counter

train_path = r"D:\old\项目\工程实训（二）\datasets\resume_ner\iic\resume_ner\train.txt"
dev_path = r"D:\old\项目\工程实训（二）\datasets\resume_ner\iic\resume_ner\dev.txt"
test_path = r"D:\old\项目\工程实训（二）\datasets\resume_ner\iic\resume_ner\test.txt"


def analyze(filepath, name):
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    # 按空行分隔得到句子
    sentences = [s.strip() for s in content.strip().split("\n\n")]

    # 统计实体类型
    tags = []
    for sent in sentences:
        for line in sent.split("\n"):
            parts = line.strip().split()
            if len(parts) >= 2:
                tags.append(parts[-1])

    c = Counter(tags)
    print(f"\n=== {name} ===")
    print(f"句子数: {len(sentences)}")
    print(f"总标注数: {sum(c.values())}")

    # 统计各实体
    entity_types = {}
    for tag, count in sorted(c.items()):
        if tag != "O":
            prefix = tag[0]  # B- 或 I-
            etype = tag[2:]  # 实体类型
            if etype not in entity_types:
                entity_types[etype] = {"B": 0, "I": 0}
            entity_types[etype][prefix] = count

    print(f"\n实体类型统计:")
    for etype, counts in sorted(entity_types.items()):
        total = counts["B"] + counts["I"]
        print(f"  {etype}: B={counts['B']}, I={counts['I']}, 合计={total}")


analyze(train_path, "训练集 train.txt")
analyze(dev_path, "验证集 dev.txt")
analyze(test_path, "测试集 test.txt")
