@echo off
echo ========================================
echo 正在安装 MSVC 编译器工具链...
echo ========================================
echo.

REM 使用 Visual Studio Installer 修改安装
"C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe" modify ^
    --installPath "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools" ^
    --add Microsoft.VisualStudio.Workload.VCTools ^
    --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 ^
    --add Microsoft.VisualStudio.Component.Windows11SDK.22621 ^
    --includeRecommended ^
    --passive

echo.
echo ========================================
echo 安装命令已执行
echo 请等待安装完成，可能需要 5-10 分钟
echo ========================================
pause
