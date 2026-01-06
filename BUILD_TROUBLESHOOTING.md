# 🚨 构建失败 - 需要安装 Microsoft C++ Build Tools

## 问题

Rust 编译器找不到正确的 `link.exe` 或 Windows SDK 库文件 (kernel32.lib, ntdll.lib 等)。这是因为:

1. **Git 的 link.exe 干扰**: Git for Windows 自带的 GNU link.exe 在 PATH 中优先于 MSVC 链接器
2. **缺少 Microsoft C++ Build Tools**: 系统中没有安装 MSVC 编译器工具链和 Windows SDK

## ⚠️ 重要验证

请运行以下命令确认是否正确安装了 Build Tools:

```bash
# 检查是否找到了 MSVC link.exe (不是 Git 的)
dir "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC" /b
```

如果显示 "系统找不到指定的路径"，说明 Build Tools **没有正确安装**。

## 解决方案

### 方案 1: 完整安装 Visual Studio Build Tools (最可靠)

1. **下载 Visual Studio Build Tools**
   - 访问: https://visualstudio.microsoft.com/downloads/
   - 下拉到 "所有下载" > "Tools for Visual Studio"
   - 下载 **Build Tools for Visual Studio 2022**

2. **安装时选择工作负载**
   - ✅ 勾选 **"使用 C++ 的桌面开发"** (Desktop development with C++)
   - 确保包含以下组件:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools (最新版本)
     - Windows 11 SDK 或 Windows 10 SDK (最新版本)
     - C++ CMake tools for Windows
     - C++ core features

3. **安装后重启**
   - **必须重启终端或电脑**，否则环境变量不会生效
   - 再次运行构建命令

### 方案 2: 使用 winget 自动安装 (快速)

```powershell
# 在 PowerShell (管理员) 中运行:
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

**注意**: 安装完成后必须**关闭并重新打开终端**！

## 验证安装

安装完成后,验证:

```bash
# 查找 link.exe
where link

# 应该显示类似:
# C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\...\bin\Hostx64\x64\link.exe
```

## 继续构建

安装完成后,运行:

```bash
# 方法 1: 使用 PowerShell (如果PATH已更新)
npm run tauri:build

# 方法 2: 使用我们创建的批处理文件
build-windows.bat
```

## 当前状态

✅ Rust 已安装 (1.92.0)
✅ Cargo 已安装 (1.92.0)
✅ 前端已构建 (dist 文件夹)
❌ Microsoft C++ Build Tools 未安装 **← 需要这个**

## 预计构建时间

安装 Build Tools 后:
- 首次构建: 5-10 分钟 (需要编译所有 Rust 依赖)
- 后续构建: 1-3 分钟

## 输出文件

构建成功后,文件将位于:

```
src-tauri/target/x86_64-pc-windows-msvc/release/bundle/
├── msi/
│   └── Skill Manager_1.0.0_x64_en-US.msi  ← Windows 安装包
└── ...

src-tauri/target/x86_64-pc-windows-msvc/release/
└── skill-manager.exe  ← 便携版可执行文件
```

## 需要帮助?

如果安装 Build Tools 后仍然失败:

1. **检查 PATH 环境变量**
   ```powershell
   $env:PATH -split ';' | Select-String "Visual Studio"
   ```

2. **尝试在 Developer Command Prompt 中构建**
   - 开始菜单搜索 "Developer Command Prompt for VS 2022"
   - 在该命令提示符中运行 `npm run tauri:build`

3. **查看详细错误**
   ```bash
   npm run tauri:build -- --verbose
   ```

---

**下一步**: 请安装 Microsoft C++ Build Tools,然后重新运行构建命令。
