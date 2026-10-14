# =============================================================================
#  实验二 · 前端启动脚本
#  作用：找到 Node.js，然后运行同目录的 server.mjs（静态文件服务器）
#
#  你也可以直接双击上级目录的 双击我启动.bat，它会同时把前后端都起起来。
# =============================================================================
param(
    [int]$Port = 5173
)

$ErrorActionPreference = "Continue"
$here = $PSScriptRoot

# ---------- 找 Node.js ----------
function Resolve-Node {
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        "E:\NODE\node.exe",
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    return $null
}

$node = Resolve-Node
if (-not $node) {
    Write-Host "[错误] 没找到 Node.js。" -ForegroundColor Red
    Write-Host "       实验二的前端需要一个静态服务器，请安装 Node.js 18 以上版本。" -ForegroundColor Red
    Write-Host "       下载：https://nodejs.org/" -ForegroundColor Red
    Write-Host ""
    Write-Host "按任意键关闭…"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "[前端] Node.js : $node" -ForegroundColor Cyan
Write-Host "[前端] 目录    : $here" -ForegroundColor Cyan
$env:PORT = $Port

& $node (Join-Path $here "server.mjs")

Write-Host ""
Write-Host "前端已停止。按任意键关闭窗口…"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
