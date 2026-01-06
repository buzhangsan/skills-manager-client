@echo off
echo Setting up Rust environment...

REM 设置 MSVC 环境变量（使用最新安装的版本）
set "VSINSTALLDIR=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\"
set "VCINSTALLDIR=%VSINSTALLDIR%VC\"
set "MSVC_VERSION=14.44.35207"

REM 将 MSVC 工具链添加到 PATH 前面，优先于 Git 的 link.exe
set "PATH=%VCINSTALLDIR%Tools\MSVC\%MSVC_VERSION%\bin\Hostx64\x64;%USERPROFILE%\.cargo\bin;%PATH%"

echo Checking Rust installation...
rustc --version
cargo --version

echo.
echo Verifying MSVC link.exe...
where link
echo.

echo Building Tauri application for Windows...
echo This may take several minutes (first build: 5-10 minutes)...
echo.

npx tauri build --target x86_64-pc-windows-msvc

echo.
echo Build completed!
echo.
echo Output files:
echo   MSI Installer: src-tauri\target\x86_64-pc-windows-msvc\release\bundle\msi\
echo   Executable:    src-tauri\target\x86_64-pc-windows-msvc\release\skill-manager.exe
echo.
pause
