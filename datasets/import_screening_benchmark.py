"""
数据集 4: AI Resume Screening 基准评估导入工具

用途：将 AI_Resume_Screening.csv 中的 1000 条简历筛选数据
导入后端，用于评估和改进六维评分算法的准确性。

数据字段：
  - Resume_ID, Name, Skills, Experience(Years), Education
  - Certifications, Job Role, Recruiter Decision (Hire/Reject)
  - Salary Expectation ($), Projects Count, AI Score (0-100)

后端对比能力：
  1. 针对每条简历，调用后端六维评估 API 生成评分
  2. 将后端评分 vs 数据集 AI Score 进行对比
  3. 统计后端评分与 Hire/Reject 决策的吻合度

用法：
  python import_screening_benchmark.py                # 交互模式
  python import_screening_benchmark.py --benchmark    # 执行基准对比
  python import_screening_benchmark.py --import-only  # 仅导入数据
"""

import argparse
import csv
import json
import os
import sys
import time
from collections import Counter
from pathlib import Path

# ============================================================
# 配置
# ============================================================
CSV_PATH = os.path.join(
    os.path.dirname(__file__),
    "AI_Resume_Screening",
    "AI_Resume_Screening.csv",
)
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3000")

# 导入用的用户
IMPORT_EMAIL = os.environ.get("IMPORT_EMAIL", "screening_benchmark@import.local")
IMPORT_PASSWORD = os.environ.get("IMPORT_PASSWORD", "benchmark123")

# API 端点
LOGIN_URL = f"{BACKEND_URL}/auth/login"
REGISTER_URL = f"{BACKEND_URL}/auth/register"
BENCHMARK_URL = f"{BACKEND_URL}/resume/screening/benchmark-import"


# ============================================================
# 数据加载
# ============================================================

def load_csv(filepath: str) -> list[dict]:
    """加载 CSV 文件"""
    if not os.path.exists(filepath):
        print(f"❌ 文件不存在: {filepath}")
        print("   请确认路径或使用 --csv-path 指定")
        sys.exit(1)

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"📄 加载了 {len(rows)} 条筛选记录")
    return rows


def analyze_dataset(rows: list[dict]):
    """分析数据集统计信息"""
    print("\n" + "=" * 60)
    print("📊 AI Resume Screening 数据集分析")
    print("=" * 60)

    decisions = Counter(r["Recruiter Decision"].strip() for r in rows)
    print(f"\n📋 招聘决策分布:")
    for k, v in decisions.most_common():
        print(f"   {k}: {v} ({v/len(rows)*100:.1f}%)")

    roles = Counter(r["Job Role"].strip() for r in rows)
    print(f"\n💼 职位类型分布:")
    for k, v in roles.most_common():
        print(f"   {k}: {v}")

    scores = [float(r["AI Score (0-100)"]) for r in rows]
    hired_scores = [
        float(r["AI Score (0-100)"])
        for r in rows
        if r["Recruiter Decision"].strip() == "Hire"
    ]
    rejected_scores = [
        float(r["AI Score (0-100)"])
        for r in rows
        if r["Recruiter Decision"].strip() == "Reject"
    ]

    print(f"\n🎯 AI 分数统计 (全部):")
    print(f"   均值: {sum(scores)/len(scores):.1f}")
    print(f"   中位数: {sorted(scores)[len(scores)//2]:.0f}")
    print(f"   范围: {min(scores):.0f} - {max(scores):.0f}")

    if hired_scores:
        print(f"\n✅ Hire 组:")
        print(f"   均值: {sum(hired_scores)/len(hired_scores):.1f}")
        print(f"   范围: {min(hired_scores):.0f} - {max(hired_scores):.0f}")

    if rejected_scores:
        print(f"\n❌ Reject 组:")
        print(f"   均值: {sum(rejected_scores)/len(rejected_scores):.1f}")
        print(f"   范围: {min(rejected_scores):.0f} - {max(rejected_scores):.0f}")

    # 分数阈值分析
    print(f"\n🔍 最佳录用决策阈值分析:")
    best_threshold = 0
    best_accuracy = 0
    for threshold in range(10, 100, 5):
        correct = sum(
            1 for r in rows
            if (float(r["AI Score (0-100)"]) >= threshold
                and r["Recruiter Decision"].strip() == "Hire")
            or (float(r["AI Score (0-100)"]) < threshold
                and r["Recruiter Decision"].strip() == "Reject")
        )
        accuracy = correct / len(rows) * 100
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_threshold = threshold

    print(f"   最佳阈值: ≥{best_threshold} → Hire (准确率 {best_accuracy:.1f}%)")


def import_to_backend(rows: list[dict], batch_size: int = 50):
    """
    将数据集导入后端
    通过后端 API 逐条创建评估基准记录
    """
    try:
        import requests
    except ImportError:
        print("❌ 需要 requests 库: pip install requests")
        sys.exit(1)

    session = requests.Session()

    # ---------- 登录/注册 ----------
    print(f"\n🔑 使用账号 {IMPORT_EMAIL} 登录...")
    try:
        resp = session.post(
            LOGIN_URL,
            json={"email": IMPORT_EMAIL, "password": IMPORT_PASSWORD},
        )
        if resp.status_code == 201:
            print("   ✅ 登录成功")
        else:
            print(f"   ⚠️ 登录失败 ({resp.status_code})，尝试注册...")
            resp = session.post(
                REGISTER_URL,
                json={
                    "email": IMPORT_EMAIL,
                    "password": IMPORT_PASSWORD,
                    "name": "Screening Benchmark",
                },
            )
            if resp.status_code in (200, 201):
                print("   ✅ 注册成功")
                # 重新登录
                session.post(
                    LOGIN_URL,
                    json={"email": IMPORT_EMAIL, "password": IMPORT_PASSWORD},
                )
            else:
                print(f"   ❌ 注册失败: {resp.text}")
                sys.exit(1)
    except requests.ConnectionError:
        print(f"   ❌ 无法连接后端: {BACKEND_URL}")
        print("   请确认后端服务已启动")
        sys.exit(1)

    # 获取 token
    token = session.cookies.get("access_token")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # ---------- 批量导入 ----------
    print(f"\n📤 开始导入 {len(rows)} 条基准数据 (批次大小: {batch_size})...")
    success = 0
    errors = 0

    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        batch_data = []
        for r in batch:
            batch_data.append({
                "resumeId": int(r["Resume_ID"]),
                "name": r["Name"].strip(),
                "skills": [s.strip() for s in r["Skills"].split(",")],
                "experienceYears": float(r["Experience (Years)"]),
                "education": r["Education"].strip(),
                "certifications": r["Certifications"].strip() if r["Certifications"].strip() != "None" else None,
                "jobRole": r["Job Role"].strip(),
                "recruiterDecision": r["Recruiter Decision"].strip(),
                "salaryExpectation": float(r["Salary Expectation ($)"]),
                "projectsCount": int(r["Projects Count"]),
                "aiScore": float(r["AI Score (0-100)"]),
            })

        try:
            resp = session.post(
                BENCHMARK_URL,
                json={"records": batch_data},
                headers=headers,
                timeout=30,
            )
            if resp.status_code in (200, 201):
                result = resp.json()
                count = result.get("imported", len(batch_data))
                success += count
                print(
                    f"   ✅ 批次 {i//batch_size + 1}/{(len(rows)-1)//batch_size + 1}: "
                    f"导入 {count} 条"
                )
            else:
                print(
                    f"   ⚠️ 批次 {i//batch_size + 1} 失败: "
                    f"{resp.status_code} {resp.text[:200]}"
                )
                errors += len(batch_data)
        except Exception as e:
            print(f"   ❌ 批次 {i//batch_size + 1} 异常: {e}")
            errors += len(batch_data)

        time.sleep(0.1)  # 避免请求过快

    print(f"\n📊 导入完成: ✅ {success} 成功, ❌ {errors} 失败")


# ============================================================
# 基准对比
# ============================================================

def run_benchmark(rows: list[dict]):
    """
    基准对比：使用数据集中的简历信息调用后端评估 API，
    并比较 AI Score 与后端评分的差异
    """
    try:
        import requests
    except ImportError:
        print("❌ 需要 requests 库: pip install requests")
        sys.exit(1)

    session = requests.Session()

    # 登录
    print(f"\n🔑 登录 {IMPORT_EMAIL}...")
    try:
        resp = session.post(
            LOGIN_URL,
            json={"email": IMPORT_EMAIL, "password": IMPORT_PASSWORD},
        )
        if resp.status_code != 201:
            print(f"   ⚠️ 登录失败，尝试注册...")
            session.post(
                REGISTER_URL,
                json={
                    "email": IMPORT_EMAIL,
                    "password": IMPORT_PASSWORD,
                    "name": "Screening Benchmark",
                },
            )
            session.post(
                LOGIN_URL,
                json={"email": IMPORT_EMAIL, "password": IMPORT_PASSWORD},
            )
    except requests.ConnectionError:
        print(f"❌ 无法连接后端: {BACKEND_URL}")
        return

    # 采样 100 条进行对比
    sample = rows[::10][:100]
    print(f"\n🧪 基准对比: 采样 {len(sample)} 条记录...")
    print(f"   每条记录将调用后端评估 API 进行评分")

    comparisons = []
    for i, r in enumerate(sample):
        job_role = r["Job Role"].strip()
        skills = [s.strip() for s in r["Skills"].split(",")]
        experience = float(r["Experience (Years)"])
        education = r["Education"].strip()
        ai_score = float(r["AI Score (0-100)"])
        decision = r["Recruiter Decision"].strip()

        # 调用后端评估 API
        try:
            resp = session.post(
                f"{BACKEND_URL}/resume/screening/evaluate",
                json={
                    "jobRole": job_role,
                    "skills": skills,
                    "experienceYears": experience,
                    "education": education,
                },
                timeout=15,
            )
            if resp.status_code == 201:
                backend_result = resp.json()
                backend_score = backend_result.get("score", 0)
                comparisons.append({
                    "name": r["Name"],
                    "jobRole": job_role,
                    "aiScore": ai_score,
                    "backendScore": backend_score,
                    "decision": decision,
                    "diff": backend_score - ai_score,
                })
        except Exception as e:
            print(f"   ⚠️ 第 {i+1} 条评估失败: {e}")

        if (i + 1) % 20 == 0:
            print(f"   📊 已完成 {i+1}/{len(sample)} 条")

    # ---------- 输出结果 ----------
    if not comparisons:
        print("❌ 无有效的对比结果")
        return

    print("\n" + "=" * 70)
    print("📊 基准对比结果")
    print("=" * 70)

    diffs = [c["diff"] for c in comparisons]
    print(f"\n  对比条数: {len(comparisons)}")
    print(f"  平均偏差: {sum(diffs)/len(diffs):.1f} 分")
    print(f"  偏差范围: {min(diffs):.1f} ~ {max(diffs):.1f} 分")

    # 统计吻合度
    thresholds = [50, 60, 70, 80]
    for thr in thresholds:
        match = sum(
            1 for c in comparisons
            if (c["aiScore"] >= thr and c["backendScore"] >= thr)
            or (c["aiScore"] < thr and c["backendScore"] < thr)
        )
        accuracy = match / len(comparisons) * 100
        print(f"  阈值 ≥{thr} 吻合度: {accuracy:.1f}% ({match}/{len(comparisons)})")

    # 保存详细结果
    result_path = os.path.join(os.path.dirname(__file__), "benchmark_result.json")
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "summary": {
                    "total": len(comparisons),
                    "avgDiff": sum(diffs) / len(diffs),
                    "minDiff": min(diffs),
                    "maxDiff": max(diffs),
                },
                "comparisons": comparisons,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
    print(f"\n📁 详细结果已保存至: {result_path}")


# ============================================================
# 主入口
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="AI Resume Screening 基准评估导入工具"
    )
    parser.add_argument(
        "--csv-path",
        default=CSV_PATH,
        help=f"CSV 文件路径 (默认: {CSV_PATH})",
    )
    parser.add_argument(
        "--import-only",
        action="store_true",
        help="仅导入数据，不执行基准对比",
    )
    parser.add_argument(
        "--benchmark",
        action="store_true",
        help="执行基准对比（需后端运行）",
    )
    parser.add_argument(
        "--analyze-only",
        action="store_true",
        help="仅分析数据集，不导入/对比",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="导入批次大小 (默认: 50)",
    )

    args = parser.parse_args()

    # 加载数据
    rows = load_csv(args.csv_path)

    if args.analyze_only:
        analyze_dataset(rows)
        return

    if args.benchmark:
        analyze_dataset(rows)
        run_benchmark(rows)
        return

    if args.import_only:
        analyze_dataset(rows)
        import_to_backend(rows, args.batch_size)
        return

    # 交互模式
    print("=" * 60)
    print("📋 AI Resume Screening 工具")
    print("=" * 60)
    print("\n可用操作:")
    print("  1. 分析数据集")
    print("  2. 导入数据到后端")
    print("  3. 执行基准对比（需要后端运行）")
    print("  4. 全部执行")
    print("  q. 退出")

    choice = input("\n请选择 (1/2/3/4/q): ").strip()

    if choice == "1":
        analyze_dataset(rows)
    elif choice == "2":
        analyze_dataset(rows)
        import_to_backend(rows, args.batch_size)
    elif choice == "3":
        analyze_dataset(rows)
        run_benchmark(rows)
    elif choice == "4":
        analyze_dataset(rows)
        import_to_backend(rows, args.batch_size)
        run_benchmark(rows)
    else:
        print("已退出")


if __name__ == "__main__":
    main()
