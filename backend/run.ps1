# =============================================================================
#  实验二 · 后端启动脚本（Windows / PowerShell）
#
#  用法：
#     .\run.ps1                  编译并启动后端，默认 http://localhost:8081
#     .\run.ps1 -Port 8082       换端口
#     .\run.ps1 -SkipBuild       跳过编译直接启动（没改代码时更快）
#     .\run.ps1 -Profile mysql   连本机 MySQL（需先建库，见 README）
#
#  注意：这个脚本只启动【后端】。前端在 ../frontend，是另一个独立的进程。
#        两个都起来才能看到页面 —— 这就是「前后端分离」。
#        想一键起两个，直接双击上级目录的 双击我启动.bat。
#
#  【两个容易踩的坑，改这个文件时注意】
#  1. 文件必须存成 UTF-8 with BOM，否则 Windows PowerShell 5.1 会按 GBK 解析中文，
#     直接报一堆 "Unexpected token" 语法错误。
#  2. 下面用 $ErrorActionPreference = "Continue" 而不是 "Stop"：PS 5.1 会把
#     「原生命令写到 stderr 的内容」当成致命错误，而 java / mvn 都会往 stderr
#     写正常进度信息，用 Stop 会让脚本莫名中断。
#     代价是每一步都要自己检查 $LASTEXITCODE / Test-Path —— 下面都检查了。
# =============================================================================
param(
    [int]$Port = 8081,
    [switch]$SkipBuild,
    [string]$Profile = ""
)

$ErrorActionPreference = "Continue"
$projectRoot = $PSScriptRoot

# ---------- 1. 找 JDK 17（本机同时装了 24，所以要挑版本） ----------
function Test-Jdk17([string]$javaHomePath) {
    if (-not $javaHomePath) { return $false }

    # 优先读 JDK 目录下的 release 文件：比启动 java 进程快，也不受 stdout/stderr 影响
    $releaseFile = Join-Path $javaHomePath "release"
    if (Test-Path $releaseFile) {
        return (Get-Content $releaseFile -Raw) -match 'JAVA_VERSION="17\.'
    }

    # 兜底：没有 release 文件就真跑一次。
    # 用 --version 而不是 -version —— 前者输出到 stdout，后者是 stderr（老习惯）
    $exe = Join-Path $javaHomePath "bin\java.exe"
    if (-not (Test-Path $exe)) { return $false }
    $ver = & $exe --version 2>&1 | Out-String
    return $ver -match '(openjdk|java) 17\.'
}

function Resolve-Jdk17 {
    $candidates = @()
    if ($env:CRUD_JAVA_HOME) { $candidates += $env:CRUD_JAVA_HOME }
    if ($env:JAVA_HOME)      { $candidates += $env:JAVA_HOME }
    $candidates += @("D:\jdk", "D:\Java17")
    $candidates += (Get-ChildItem "C:\Program Files\Java", "C:\Program Files\Eclipse Adoptium", `
                                  "C:\Program Files\Microsoft" -Directory -ErrorAction SilentlyContinue |
                   ForEach-Object { $_.FullName })
    foreach ($c in $candidates) {
        if (Test-Jdk17 $c) { return $c }
    }
    return $null
}

$javaHome = Resolve-Jdk17
if (-not $javaHome) {
    Write-Host "[错误] 没找到 JDK 17。请设置环境变量 CRUD_JAVA_HOME 指向 JDK 17 目录。" -ForegroundColor Red
    exit 1
}
$env:JAVA_HOME = $javaHome
$javaExe = Join-Path $javaHome "bin\java.exe"
Write-Host "[1/4] JDK 17  : $javaHome" -ForegroundColor Cyan

# ---------- 2. 找 Maven（PATH 里没有就用 IDEA 自带的） ----------
function Resolve-Maven {
    $candidates = @()
    if ($env:MAVEN_HOME) { $candidates += (Join-Path $env:MAVEN_HOME "bin\mvn.cmd") }
    if ($env:M2_HOME)    { $candidates += (Join-Path $env:M2_HOME   "bin\mvn.cmd") }
    $cmd = Get-Command mvn -ErrorAction SilentlyContinue
    if ($cmd) { $candidates += $cmd.Source }
    $candidates += (Get-ChildItem "E:\java\JetBrains", "C:\Program Files\JetBrains" -Directory -ErrorAction SilentlyContinue |
                    ForEach-Object { Join-Path $_.FullName "plugins\maven\lib\maven3\bin\mvn.cmd" })
    foreach ($c in $candidates) { if ($c -and (Test-Path $c)) { return $c } }
    return $null
}

$mvn = Resolve-Maven
if (-not $mvn) {
    Write-Host "[错误] 没找到 Maven。请设置 MAVEN_HOME，或把 mvn 加进 PATH。" -ForegroundColor Red
    exit 1
}
Write-Host "[2/4] Maven   : $mvn" -ForegroundColor Cyan

$pom = Join-Path $projectRoot "pom.xml"

# ---------- 3. 编译 + 解析依赖 ----------
if (-not $SkipBuild) {
    Write-Host "[3/4] 编译中（mvn -o compile）…" -ForegroundColor Cyan
    & $mvn -o -B -q compile -f $pom
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 编译失败，请看上面的报错信息。" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[3/4] 跳过编译" -ForegroundColor DarkGray
}

$cpFile = Join-Path $projectRoot "target\cp.txt"
& $mvn -o -B -q org.apache.maven.plugins:maven-dependency-plugin:3.6.1:build-classpath `
    "-Dmdep.outputFile=$cpFile" -f $pom
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $cpFile)) {
    Write-Host "[错误] 依赖解析失败。" -ForegroundColor Red
    exit 1
}
$classpath = (Join-Path $projectRoot "target\classes") + ";" + ((Get-Content $cpFile -Raw).Trim())

# ---------- 4. 启动 ----------
$jvmArgs = @("-Dserver.port=$Port", "-Dfile.encoding=UTF-8")
if ($Profile -ne "") { $jvmArgs += "-Dspring.profiles.active=$Profile" }

Write-Host "[4/4] 启动中…" -ForegroundColor Green
Write-Host ""
Write-Host "  后端接口  : http://localhost:$Port/api/users" -ForegroundColor Yellow
Write-Host "  健康检查  : http://localhost:$Port/api/health" -ForegroundColor DarkGray
Write-Host "  H2 控制台 : http://localhost:$Port/h2-console" -ForegroundColor DarkGray
Write-Host "              账号 sa ／ 密码留空" -ForegroundColor DarkGray
Write-Host "  停止服务  : 按 Ctrl+C，或直接关掉这个窗口" -ForegroundColor DarkGray
Write-Host ""

Push-Location $projectRoot
try {
    & $javaExe ($jvmArgs + @("-cp", $classpath, "com.example.lab2.Lab2Application"))
} finally {
    Pop-Location
}
