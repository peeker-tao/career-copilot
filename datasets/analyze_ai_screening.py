import csv
from collections import Counter

f = open(
    r"D:\old\项目\工程实训（二）\datasets\AI_Resume_Screening\AI_Resume_Screening.csv",
    encoding="utf-8",
)
r = csv.DictReader(f)
rows = list(r)

job_c = Counter(row["Job Role"] for row in rows)
dec_c = Counter(row["Recruiter Decision"] for row in rows)
scores = [float(row["AI Score (0-100)"]) for row in rows]
salaries = [int(row["Salary Expectation ($)"]) for row in rows]
exps = [float(row["Experience (Years)"]) for row in rows]

print("=== AI-Driven Resume Screening 详情 ===")
print(f"\n岗位分布 ({len(job_c)} 种):")
for job, cnt in job_c.most_common():
    print(f"  {job}: {cnt}")

print(f"\n招聘决策分布:")
for dec, cnt in dec_c.most_common():
    print(f"  {dec}: {cnt}")

print(f"\nAI 筛选分数:")
print(f"  范围: {min(scores):.1f} ~ {max(scores):.1f}")
print(f"  平均: {sum(scores)/len(scores):.1f}")

print(f"\n薪资 ($):")
print(f"  范围: ${min(salaries):,} ~ ${max(salaries):,}")
print(f"  平均: ${sum(salaries)/len(salaries):,.0f}")

print(f"\n工作经验 (年):")
print(f"  范围: {min(exps):.1f} ~ {max(exps):.1f}")
print(f"  平均: {sum(exps)/len(exps):.1f}")

f.close()
