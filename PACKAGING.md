# Skill Manager 打包指南

## 前提条件

### Windows 打包

1. **安装 Rust**
   ```bash
   # 访问 https://rustup.rs/ 下载并安装
   # 或使用以下命令:
   winget install Rustlang.Rustup
   ```

2. **安装 Microsoft C++ Build Tools**
   ```bash
   # 访问 https://visualstudio.microsoft.com/visual-cpp-build-tools/
   # 下载并安装 "Desktop development with C++"
   ```

3. **验证安装**
   ```bash
   rustc --version
   cargo --version
   ```

### macOS 打包

1. **安装 Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **安装 Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

3. **添加 macOS 目标**
   ```bash
   # 对于 Apple Silicon (M1/M2/M3)
   rustup target add aarch64-apple-darwin

   # 对于 Intel Mac
   rustup target add x86_64-apple-darwin
   ```

## 打包步骤

### 1. 准备打包

```bash
# 安装依赖
npm install

# 构建前端
npm run build
```

### 2. Windows 打包

```bash
# 构建 Windows 安装包
npm run tauri:build:windows
```

**输出位置:**
- 安装包: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/skill-manager_1.0.0_x64_en-US.msi`
- 便携版: `src-tauri/target/x86_64-pc-windows-msvc/release/skill-manager.exe`

### 3. macOS 打包

```bash
# 构建 macOS DMG
npm run tauri:build:mac
```

**输出位置:**
- DMG 镜像: `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/skill-manager_1.0.0_aarch64.dmg`
- App 包: `src-tauri/target/aarch64-apple-darwin/release/bundle/macos/skill-manager.app`

### 4. 构建所有平台

```bash
# 构建当前平台的所有格式
npm run tauri:build
```

## 配置说明

### 修改应用信息

编辑 `src-tauri/tauri.conf.json`:

```json
{
  "productName": "Skill Manager",  // 应用名称
  "version": "1.0.0",               // 版本号
  "identifier": "com.skillmanager.app"  // Bundle ID
}
```

### 修改应用图标

1. 准备 512x512 的 SVG 或 PNG 图标
2. 运行图标生成命令:
   ```bash
   npx @tauri-apps/cli icon path/to/your/icon.svg
   ```

## 发布到 GitHub

### 1. 创建 Release

```bash
# 打标签
git tag v1.0.0
git push origin v1.0.0
```

### 2. 上传构建产物

1. 访问 GitHub 仓库的 Releases 页面
2. 点击 "Create a new release"
3. 选择标签 `v1.0.0`
4. 上传以下文件:
   - Windows: `skill-manager_1.0.0_x64_en-US.msi`
   - macOS: `skill-manager_1.0.0_aarch64.dmg`

### 3. 自动化发布 (GitHub Actions)

创建 `.github/workflows/release.yml`:

\`\`\`yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        platform: [windows-latest, macos-latest]

    runs-on: \${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run tauri:build

      - name: Upload Release Assets
        uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/**/*
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

## 代码签名 (可选)

### Windows 代码签名

1. 获取代码签名证书
2. 配置 `src-tauri/tauri.conf.json`:
   ```json
   {
     "bundle": {
       "windows": {
         "certificateThumbprint": "YOUR_CERT_THUMBPRINT"
       }
     }
   }
   ```

### macOS 代码签名

1. 加入 Apple Developer Program
2. 配置签名身份:
   ```json
   {
     "bundle": {
       "macOS": {
         "signingIdentity": "Developer ID Application: Your Name"
       }
     }
   }
   ```

## 更新机制

应用内置了更新检查功能:

1. **检查更新**: `GET /api/update/check`
2. **执行更新**: `POST /api/update/perform`

更新检查会自动从 GitHub Releases 获取最新版本信息。

## 故障排查

### Windows 构建失败

**错误**: `failed to run 'cargo metadata'`
**解决**: 确保已安装 Rust 并添加到 PATH

**错误**: `link.exe not found`
**解决**: 安装 Microsoft C++ Build Tools

### macOS 构建失败

**错误**: `xcrun: error: invalid active developer path`
**解决**: 运行 `xcode-select --install`

**错误**: `linker 'cc' not found`
**解决**: 安装 Xcode Command Line Tools

### 通用问题

**问题**: 构建时间过长
**优化**:
- 使用 `--debug` 标志进行开发构建
- 添加 `.cargo/config.toml` 优化编译:
  ```toml
  [build]
  incremental = true

  [profile.dev]
  opt-level = 0
  ```

## 打包检查清单

- [ ] 更新版本号 (`package.json` 和 `src-tauri/tauri.conf.json`)
- [ ] 更新 CHANGELOG.md
- [ ] 测试所有功能
- [ ] 构建并测试安装包
- [ ] 创建 Git 标签
- [ ] 上传到 GitHub Releases
- [ ] 更新文档

## 分发大小优化

默认构建包含调试信息。优化大小:

1. 编辑 `src-tauri/Cargo.toml`:
   ```toml
   [profile.release]
   strip = true
   opt-level = "z"
   lto = true
   codegen-units = 1
   ```

2. 重新构建:
   ```bash
   npm run tauri:build
   ```

## 支持的平台

- ✅ Windows 10/11 (x64)
- ✅ macOS 11+ (Intel and Apple Silicon)
- ⏳ Linux (需要额外配置)

## 许可证

MIT License
