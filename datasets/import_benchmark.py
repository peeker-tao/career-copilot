"""
从 AI_Resume_Screening.csv 批量导入筛选基准数据到后端 API

用法:
  # 默认用户 111@qq.com 导入全部 1000 条
  python import_benchmark.py

  # 指定用户/密码
  python import_benchmark.py --email xxx@qq.com --password 123456

  # 一键模式（服务端自动从 datasets 目录读取 CSV）
  python import_benchmark.py --seed

  # 指定 CSV + 用户
  python import_benchmark.py --csv D:/data.csv --email xxx@qq.com --password 123456
"""
import csv
import json
import urllib.request

API_BASE = "http://localhost:3002/api"
LOGIN_URL = f"{API_BASE}/auth/login"
IMPORT_URL = f"{API_BASE}/resumes/screening/benchmark-import"
SEED_URL = f"{API_BASE}/resumes/screening/benchmark-seed"

# 默认测试账号
LOGIN_EMAIL = "111@qq.com"
LOGIN_PASSWORD = "111111"

CSV_PATH = r"D:\gitclone\软件工程实训（二）\career-copilot\datasets\AI_Resume_Screening\AI_Resume_Screening.csv"


def login():
    """自动登录获取 JWT token"""
    body = json.dumps({
        "email": LOGIN_EMAIL,
        "password": LOGIN_PASSWORD,
    }).encode("utf-8")
    req = urllib.request.Request(
        LOGIN_URL, data=body,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        token = result.get("data", {}).get("accessToken") or result.get("accessToken")
        if not token:
            raise RuntimeError(f"登录成功但未找到 token: {result}")
        print(f"🔑 登录成功，已获取 token")
        return token


def load_csv(path):
    records = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            skills = [s.strip() for s in row["Skills"].split(",")]
            records.append({
                "resumeId": int(row["Resume_ID"]),
                "name": row["Name"],
                "skills": skills,
                "experienceYears": float(row["Experience (Years)"]),
                "education": row["Education"],
                "certifications": row["Certifications"] if row["Certifications"] != "None" else None,
                "jobRole": row["Job Role"],
                "recruiterDecision": row["Recruiter Decision"],
                "salaryExpectation": int(row["Salary Expectation ($)"]),
                "projectsCount": int(row["Projects Count"]),
                "aiScore": int(row["AI Score (0-100)"]),
            })
    return records


def import_records(token, records):
    """批量导入所有记录"""
    url = IMPORT_URL
    body = json.dumps({"records": records}).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }
    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def seed_default(token):
    """调用服务端 benchmark-seed（服务端自动读取 CSV）"""
    req = urllib.request.Request(
        SEED_URL,
        data=b"{}",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def main():
    import argparse

    parser = argparse.ArgumentParser(description="批量导入筛选基准数据")
    parser.add_argument("--email", default=LOGIN_EMAIL, help="登录邮箱")
    parser.add_argument("--password", default=LOGIN_PASSWORD, help="登录密码")
    parser.add_argument("--csv", default=CSV_PATH, help="CSV 文件路径")
    parser.add_argument(
        "--seed", action="store_true",
        help="一键模式：服务端自动从 datasets 目录读取 CSV（无需本地 CSV）",
    )
    args = parser.parse_args()

    token = login()

    # --seed 模式：调用服务端一键导入
    if args.seed:
        print("🌱 一键导入模式（服务端读取 CSV）...")
        try:
            result = seed_default(token)
            print(f"✅ 导入结果: {result}")
        except urllib.error.HTTPError as e:
            print(f"❌ 失败: HTTP {e.code}: {e.read().decode()}")
            return
        print("🎉 导入完成！")
        return

    # 普通模式：本地 CSV → API
    records = load_csv(args.csv)
    print(f"📄 读取了 {len(records)} 条记录")

    batch_size = 100
    for start in range(0, len(records), batch_size):
        batch = records[start:start + batch_size]
        try:
            result = import_records(token, batch)
            print(f"✅ 第 {start+1}-{start+len(batch)} 条: {result}")
        except urllib.error.HTTPError as e:
            print(f"❌ 第 {start+1}-{start+len(batch)} 条失败: HTTP {e.code}: {e.read().decode()}")
            break

    print("🎉 导入完成！")


if __name__ == "__main__":
    main()
