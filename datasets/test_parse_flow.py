"""测试简历上传、解析、查询的完整流程"""

import requests
import json
import time
import glob
import sys

BASE = "http://localhost:3002/api"

# 1. 登录/注册
reg = requests.post(
    f"{BASE}/auth/register",
    json={"email": "test@test.com", "password": "test123", "name": "Test"},
)
print(f'Register: {reg.status_code} code={reg.json().get("code")}')

log = requests.post(
    f"{BASE}/auth/login", json={"email": "test@test.com", "password": "test123"}
)
print(f'Login: {log.status_code} code={log.json().get("code")}')

token = log.json()["data"]["accessToken"]
print(f"Token: {token[:30]}...")

# 2. 找一份简历PDF
pdfs = glob.glob(
    "D:/old/项目/工程实训（二）/datasets/opensporks_resumes/INFORMATION-TECHNOLOGY/*.pdf"
)
if not pdfs:
    print("No PDFs found!")
    sys.exit(1)

pdf_path = pdfs[0]
print(f"\nUploading: {pdf_path}")

with open(pdf_path, "rb") as f:
    r = requests.post(
        f"{BASE}/resumes/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("resume.pdf", f, "application/pdf")},
    )

resp = r.json()
print(f'Upload response code={resp.get("code")}')
data = resp["data"]
print(f'  id={data["id"]}')
print(f'  status={data["status"]}')
print(f'  parsedData={"null" if data["parsedData"] is None else "NOT null"}')
print(f'  skills={data["skills"]}')

resume_id = data["id"]

# 3. 轮询等待解析完成
print(f"\nPolling resume {resume_id}...")
for i in range(30):
    time.sleep(2)
    r = requests.get(
        f"{BASE}/resumes/{resume_id}", headers={"Authorization": f"Bearer {token}"}
    )
    data = r.json()["data"]
    status = data["status"]
    has_parsed = data["parsedData"] is not None
    print(
        f'  [{i+1}] status={status} parsedData={"✓" if has_parsed else "✗"} skills={len(data.get("skills", []))}项'
    )

    if status == "completed":
        print("\n✅ 解析成功！")
        print(json.dumps(data["parsedData"], indent=2, ensure_ascii=False)[:2000])
        break
    elif status == "failed":
        print("\n❌ 解析失败！")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        break
else:
    print("\n⏰ 超时 - 解析未完成")
