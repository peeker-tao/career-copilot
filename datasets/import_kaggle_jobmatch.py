"""
导入 Kaggle Resume Dataset 到后端 JobMatch 表

功能：
1. 读取 resume_datasets/resume_data.csv（9,544 条人岗匹配数据）
2. 通过后端 API 注册一个专用数据账号
3. 将 CSV 数据导入到 job_matches 表中，作为岗位匹配的初始参考数据

用途：
- 为 job-matching 模块提供真实世界的人岗匹配数据
- 支持基于技能相似度的岗位匹配推荐
- 替代纯 AI 生成推荐，提供更精准的匹配结果

数据映射：
  CSV 字段                    → JobMatch 字段
  ─────────────────────────────────────────────
  job_position_name           → position
  professional_company_names  → company
  locations                   → location
  skills_required             → requirements (JSON array)
  matched_score               → matchScore (0-100)
  career_objective            → description
  skills                      → matchDetails.matchedSkills
"""

import csv
import json
import sys
import time
import os

API_BASE = "http://localhost:3002/api"

# ============================================================
# 配置
# ============================================================
CSV_PATH = os.path.join(os.path.dirname(__file__), "resume_datasets", "resume_data.csv")
DATA_EMAIL = "kaggle_data@import.local"
DATA_PASSWORD = "KaggleImport2024!"
DATA_NAME = "Kaggle Data Import"

try:
    import requests
except ImportError:
    print("❌ 请先安装 requests 库：pip install requests")
    sys.exit(1)


def login_or_register():
    """登录或注册数据导入账号"""
    session = requests.Session()

    # 尝试登录
    resp = session.post(
        f"{API_BASE}/auth/login",
        json={"email": DATA_EMAIL, "password": DATA_PASSWORD},
    )
    if resp.status_code == 201:
        data = resp.json()
        print(f"✅ 登录成功: {data.get('message', '')}")
        token = data["data"]["accessToken"]
        session.headers["Authorization"] = f"Bearer {token}"
        return session

    # 注册
    resp = session.post(
        f"{API_BASE}/auth/register",
        json={"email": DATA_EMAIL, "password": DATA_PASSWORD, "name": DATA_NAME},
    )
    if resp.status_code == 201:
        data = resp.json()
        print(f"✅ 注册成功")
        token = data["data"]["accessToken"]
        session.headers["Authorization"] = f"Bearer {token}"
        return session

    # 直接调用 API 创建用户（如果支持）
    print(f"⚠️  登录/注册失败: {resp.status_code} {resp.text[:200]}")
    print("继续尝试直接调用 match API...")
    return session


def parse_skills(skills_str: str) -> list[str]:
    """解析 CSV 中的技能字段（可能为 JSON 数组格式的字符串）"""
    if not skills_str or skills_str.strip() == "":
        return []

    skills_str = skills_str.strip()
    try:
        skills = json.loads(skills_str.replace("'", '"'))
        if isinstance(skills, list):
            return [s.strip() for s in skills if s and s.strip()]
    except (json.JSONDecodeError, TypeError):
        pass

    # 尝试按逗号分割
    skills_str = skills_str.strip("[]'\" ")
    return [s.strip().strip("'\"") for s in skills_str.split(",") if s.strip()]


def parse_company(companies_str: str) -> str | None:
    """从公司列表中提取第一个公司名"""
    if not companies_str or companies_str.strip() in ("", "[]", "None"):
        return None
    try:
        companies = json.loads(companies_str.replace("'", '"'))
        if isinstance(companies, list) and companies:
            return str(companies[0]).strip()
    except (json.JSONDecodeError, TypeError):
        pass
    return None


def parse_location(locations_str: str) -> str | None:
    """解析工作地点"""
    if not locations_str or locations_str.strip() in ("", "[]", "None"):
        return None
    try:
        locs = json.loads(locations_str.replace("'", '"'))
        if isinstance(locs, list) and locs:
            return str(locs[0]).strip()
    except (json.JSONDecodeError, TypeError):
        pass
    return str(locations_str).strip() if locations_str.strip() else None


def parse_requirements(req_str: str) -> list[str] | None:
    """解析岗位要求"""
    if not req_str or req_str.strip() == "":
        return None
    try:
        reqs = json.loads(req_str.replace("'", '"'))
        if isinstance(reqs, list):
            return [str(r).strip() for r in reqs if r]
        return [str(reqs)]
    except (json.JSONDecodeError, TypeError):
        return [s.strip() for s in req_str.split(",") if s.strip()]


def parse_match_score(score_str: str) -> float:
    """解析匹配分数，CSV 中是 0~1 float，JobMatch 需要 0~100"""
    try:
        score = float(score_str)
        if score <= 1:
            score = round(score * 100, 1)
        return min(max(score, 0), 100)
    except (ValueError, TypeError):
        return 0


def import_csv(session: requests.Session, max_rows: int | None = None):
    """导入 CSV 数据到后端

    Args:
        session: 已认证的 requests Session
        max_rows: 最大导入行数（None = 全部）
    """
    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV 文件不存在: {CSV_PATH}")
        return

    print(f"\n📂 读取 CSV: {CSV_PATH}")
    total = 0
    success = 0
    skip = 0
    errors = []

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        # CSV 中实际列名是 锘縥ob_position_name（UTF-8 BOM 导致）
        fieldnames = reader.fieldnames or []
        pos_col = None
        for col in fieldnames:
            if "position" in col.lower() or "job" in col.lower():
                pos_col = col
                break
        print(f"  字段数: {len(fieldnames)}")
        print(f"  岗位列名: {pos_col}")

        for row_idx, row in enumerate(reader):
            if max_rows and total >= max_rows:
                break

            total += 1

            # 提取岗位名称（跳过无岗位数据的行）
            position = (row.get(pos_col or "job_position_name") or "").strip()
            if not position:
                skip += 1
                continue

            skills_str = row.get("skills", "")
            skills = parse_skills(skills_str)

            match_score = parse_match_score(row.get("matched_score", "0"))

            # 岗位要求
            req_skills = parse_requirements(row.get("skills_required", ""))
            edu_req = (row.get("educationaL_requirements", "") or "").strip()
            exp_req = (row.get("experiencere_requirement", "") or "").strip()

            # 构建 requirements
            requirements_list = []
            if req_skills:
                requirements_list.append(f"技能要求: {', '.join(req_skills[:10])}")
            if edu_req and edu_req.lower() not in ("none", "na", ""):
                requirements_list.append(f"学历要求: {edu_req}")
            if exp_req and exp_req.lower() not in ("none", "na", ""):
                requirements_list.append(f"经验要求: {exp_req}")
            requirements = requirements_list if requirements_list else None

            # 公司信息
            company = parse_company(row.get("professional_company_names", ""))
            location = parse_location(row.get("locations", ""))

            # 描述（职业目标）
            description = (row.get("career_objective", "") or "").strip()
            if not description and row.get("responsibilities", ""):
                description = row.get("responsibilities", "").strip()[:500]

            # 构建 matchDetails
            match_details = {
                "matchedSkills": skills[:20] if skills else [],
                "missingSkills": [],
                "sourceData": "kaggle_resume_dataset",
            }
            if req_skills:
                missing = [s for s in req_skills if s not in (skills or [])]
                match_details["missingSkills"] = missing[:10]

            # 清理掉公司名为 None / N/A 的情况
            if company and company.lower() in ("none", "n/a", "na"):
                company = None
            if match_score is None or match_score < 1 or match_score > 100:
                match_score = max(match_score, 0)

            # 构造 payload
            payload = {
                "userId": DATA_EMAIL,  # 用 email 标识，后端会自动找 user
                "position": position,
                "company": company,
                "location": location,
                "salaryRange": None,
                "description": description[:500] if description else None,
                "requirements": requirements,
                "matchScore": match_score,
                "matchDetails": match_details,
                "status": "saved",
                "source": "external",
            }

            # 调用后端 API 导入
            try:
                resp = session.post(
                    f"{API_BASE}/job-matching/import",
                    json=payload,
                    timeout=10,
                )
                if resp.status_code in (200, 201):
                    success += 1
                else:
                    errors.append(f"行 {row_idx + 2}: HTTP {resp.status_code}")
                    skip += 1
            except requests.exceptions.RequestException as e:
                errors.append(f"行 {row_idx + 2}: {e}")
                skip += 1

            if total % 500 == 0:
                print(f"  进度: {total} 行, 成功 {success}, 跳过 {skip}")

    # 输出统计
    print(f"\n{'='*50}")
    print(f"📊 导入完成!")
    print(f"  总计读取: {total} 行")
    print(f"  ✅ 成功导入: {success} 条")
    print(f"  ⏭️  跳过: {skip} 条")
    if errors:
        print(f"  ❌ 错误数: {len(errors)}")
        if len(errors) <= 5:
            for e in errors:
                print(f"    - {e}")
        else:
            for e in errors[:5]:
                print(f"    - {e}")
            print(f"    ... 还有 {len(errors) - 5} 个错误")


def add_import_endpoint():
    """提示用户需要在后端添加 import 端点"""
    print()
    print("=" * 60)
    print("📋 下一步操作:")
    print("=" * 60)
    print("""
1. 在后端 job-matching.controller.ts 中添加 import 端点:

   @Post('import')
   @HttpCode(HttpStatus.CREATED)
   @ApiOperation({ summary: '批量导入岗位匹配数据（内部使用）' })
   async importMatch(@Body() dto: ImportJobMatchDto) {
     return this.jobMatchingService.importJobMatch(dto);
   }

2. 在后端添加 DTO:

   export class ImportJobMatchDto {
     @IsString() position!: string;
     @IsOptional() @IsString() company?: string;
     @IsOptional() @IsString() location?: string;
     @IsOptional() @IsString() description?: string;
     @IsOptional() requirements?: any;
     @IsNumber() @Min(0) @Max(100) matchScore!: number;
     @IsOptional() matchDetails?: any;
     @IsOptional() @IsString() status?: string;
     @IsOptional() @IsString() source?: string;
   }

3. 在后端 job-matching.service.ts 中添加:

   async importJobMatch(data: ImportJobMatchDto & { userId: string }) {
     return this.prisma.jobMatch.create({
       data: {
         userId: data.userId,
         position: data.position,
         company: data.company || null,
         location: data.location || null,
         description: data.description || null,
         requirements: data.requirements || null,
         matchScore: data.matchScore,
         matchDetails: data.matchDetails || null,
         status: data.status || 'pending',
         source: data.source || 'external',
       },
     });
   }
""")


if __name__ == "__main__":
    print("=" * 50)
    print("📥 Kaggle Resume Dataset 导入工具")
    print("=" * 50)

    session = login_or_register()

    # 测试 API 连接
    try:
        resp = session.get(f"{API_BASE}/job-matching/matches?limit=1", timeout=5)
        print(f"📡 API 连接: {resp.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接后端 API，请确保后端已启动 (npm run start:dev)")
        sys.exit(1)

    # 检查有无 import 端点
    test_import = session.post(
        f"{API_BASE}/job-matching/import",
        json={"position": "test", "matchScore": 50},
        timeout=5,
    )

    if test_import.status_code == 404:
        print("⚠️  import 端点不存在，需要先添加")
        add_import_endpoint()
        sys.exit(0)
    elif test_import.status_code == 401:
        print("⚠️  未认证，检查登录状态")
        # 删除测试记录（如果有的话）
        print("  继续尝试导入...")
    else:
        print(f"✅ import 端点可用: {test_import.status_code}")

    # 开始导入（测试阶段先导入 100 条）
    import_csv(session, max_rows=None)
