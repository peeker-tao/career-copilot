#!/usr/bin/env python
"""Extract text from .doc files using PowerShell + Word COM automation."""

import subprocess
import sys

ps_script = """
$files = @(
    'D:\\old\\项目\\工程实训（二）\\项目设计文件\\实训过程文档目录及模板\\08_日常报告\\16周\\个人周报1-陶宏阳.doc',
    'D:\\old\\项目\\工程实训（二）\\项目设计文件\\实训过程文档目录及模板\\08_日常报告\\16周\\个人周报1-赵原一.doc',
    'D:\\old\\项目\\工程实训（二）\\项目设计文件\\实训过程文档目录及模板\\08_日常报告\\16周\\个人周报1-李烨.doc',
    'D:\\old\\项目\\工程实训（二）\\项目设计文件\\实训过程文档目录及模板\\08_日常报告\\16周\\工作日志1-陶宏阳.doc',
    'D:\\old\\项目\\工程实训（二）\\项目设计文件\\实训过程文档目录及模板\\08_日常报告\\16周\\工作日志1-赵原一.doc',
    'D:\\old\\项目\\工程实训（二）\\项目设计文件\\实训过程文档目录及模板\\08_日常报告\\16周\\工作日志1-李烨.doc',
    'D:\\old\\项目\\工程实训（二）\\项目设计文件\\实训过程文档目录及模板\\08_日常报告\\16周\\个人周报1-邓继舟.doc',
    'D:\\old\\项目\\工程实训（二）\\项目设计文件\\实训过程文档目录及模板\\08_日常报告\\16周\\工作日志1-邓继舟.doc'
)

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    
    foreach ($file in $files) {
        Write-Host "===== $((Split-Path $file -Leaf)) ====="
        try {
            $doc = $word.Documents.Open($file)
            $text = $doc.Content.Text
            Write-Host $text
            $doc.Close()
        } catch {
            Write-Host "Error: $_"
        }
        Write-Host ""
    }
    $word.Quit()
} catch {
    Write-Host "Word not available: $_"
    exit 1
}
"""

result = subprocess.run(
    ["powershell", "-NoProfile", "-Command", ps_script],
    capture_output=True,
    text=True,
    timeout=60,
)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[:1000], file=sys.stderr)

sys.exit(0 if "Word not available" not in result.stdout else 1)
