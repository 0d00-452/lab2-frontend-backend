# =============================================================================
#  实验二 · 一键启动（同时启动【后端】和【前端】两个进程）
#
#  为什么是两个进程？
#     这就是「前后端分离」的字面意思：前端和后端各自独立运行、
#     各自独立部署，之间只通过 HTTP 接口通信。
#     所以你会看到两个黑窗口 —— 一个后端、一个前端，别关错。
#
#  用法：
#     .\启动全部.ps1                 默认 后端 8081 + 前端 5173
#     .\启动全部.ps1 -SkipBuild      跳过后端编译（没改 Java 代码时更快）
#
#  一般不直接运行这个脚本，双击上级的 双击我启动.bat 就行。
# =============================================================================
param(
    [int]$BackendPort = 8081,
    [int]$FrontendPort = 5173,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Continue"
$root = $PSScriptRoot

$backendScript = Join-Path $root "backend\run.ps1"
$frontendScript = Join-Path $root "frontend\serve.ps1"

foreach ($f in @($backendScript, $frontendScript)) {
    if (-not (Test-Path $f)) {
        Write-Host "[错误] 找不到脚本：$f" -ForegroundColor Red
        Write-Host "       请确认整个『实验二-前后端分离』文件夹是完整的。" -ForegroundColor Red
        Write-Host ""
        Write-Host "按任意键关闭…"
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  实验二 · 前后端分离   正在启动两个进程" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  [窗口 1] 后端  Spring Boot  →  http://localhost:$BackendPort" -ForegroundColor Yellow
Write-Host "  [窗口 2] 前端  静态服务器    →  http://localhost:$FrontendPort" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  后端第一次要编译，大约 30 秒；之后浏览器会自动打开。" -ForegroundColor Gray
Write-Host "  注意：会弹出【两个】黑色窗口，它们分别是前端和后端。" -ForegroundColor Gray
Write-Host "  用完关掉这两个窗口即可停止服务。" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ---------- 1) 启动后端（新窗口，-NoExit 让报错信息留在窗口里看得见） ----------
$backendArgs = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-NoExit",
    "-File", $backendScript,
    "-Port", "$BackendPort"
)
if ($SkipBuild) { $backendArgs += "-SkipBuild" }
Start-Process -FilePath "powershell.exe" -ArgumentList $backendArgs | Out-Null
Write-Host "[1/3] 后端窗口已打开…" -ForegroundColor Green

# ---------- 2) 启动前端 ----------
$frontendArgs = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-NoExit",
    "-File", $frontendScript,
    "-Port", "$FrontendPort"
)
Start-Process -FilePath "powershell.exe" -ArgumentList $frontendArgs | Out-Null
Write-Host "[2/3] 前端窗口已打开…" -ForegroundColor Green

# ---------- 3) 等后端真的起来，再打开浏览器 ----------
# 这里刻意不用「睡固定秒数」：第一次启动要编译，可能要一分钟以上，
# 睡固定时间容易在"后端还没起来"时就打开浏览器，看起来像失败了。
# 改成每隔 2 秒问一次后端的健康检查接口，通了才打开。
Write-Host "[3/3] 等待后端就绪（第一次要编译，请耐心等）…" -ForegroundColor Green
$deadline = (Get-Date).AddSeconds(180)
$ready = $false
while ((Get-Date) -lt $deadline) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$BackendPort/api/health" -UseBasicParsing -TimeoutSec 3
        if ($resp.StatusCode -eq 200) { $ready = $true; break }
    } catch {
        # 还没起来，正常现象，继续等
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
}
Write-Host ""

if ($ready) {
    Write-Host "后端已就绪 ✓" -ForegroundColor Green
} else {
    Write-Host "等了 3 分钟，后端还是没起来。" -ForegroundColor Red
    Write-Host "请看【后端那个窗口】里的红色报错信息，或查 新手必读.md 的报错对照表。" -ForegroundColor Red
}

Start-Process "http://localhost:$FrontendPort" | Out-Null

Write-Host ""
Write-Host "已打开：http://localhost:$FrontendPort" -ForegroundColor Yellow
Write-Host "如果浏览器没弹出来，手动在地址栏输入上面这个地址即可。" -ForegroundColor Gray
Write-Host ""
Write-Host "按任意键关闭【本窗口】（注意：这不会停止服务，服务在那两个窗口里）…"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
