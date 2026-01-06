# 🚀 Skill Manager - 快速启动指南

## 当前状态

✅ 后端服务器已启动 (端口 3002)
✅ 前端开发服务器已启动 (端口 5174)
✅ 所有新功能已集成完毕

## 📋 新增功能清单

### 1. ⚙️ 默认安装路径配置
- 支持设置默认安装到系统级或项目级目录
- API: `GET /api/config` 和 `POST /api/config`

### 2. 🔄 GitHub 更新检查
- 自动检查应用和安全规则库更新
- API: `GET /api/update/check` 和 `POST /api/update/perform`

### 3. 📦 Tauri 桌面应用打包
- 已配置 Windows 和 macOS 打包
- 命令: `npm run tauri:build:windows` / `npm run tauri:build:mac`

### 4. 🔒 安全扫描 (之前已完成)
- 60+ 安全规则
- 自动扫描导入的 Skills
- 详细安全报告和修复建议

## 🎯 下一步行动

### 提交代码到 GitHub

您提到会稍后提交 GitHub 地址。提交后需要:

1. **更新配置文件中的仓库地址**:
   ```bash
   curl -X POST http://localhost:3002/api/config \
     -H "Content-Type: application/json" \
     -d '{
       "githubRepo": "YOUR_USERNAME/skill-manager",
       "defaultInstallLocation": "system",
       "defaultProjectPath": null
     }'
   ```

2. **替换代码中的占位符**:
   - `server/index.js` 第 578 行和 611 行
   - 将 `YOUR_USERNAME/skill-manager` 替换为实际仓库地址

### 打包应用程序

#### Windows 打包

1. **安装 Rust** (如果还没有):
   ```bash
   # 访问 https://rustup.rs/ 或使用:
   winget install Rustlang.Rustup
   ```

2. **安装 Microsoft C++ Build Tools**:
   ```bash
   # 访问 https://visualstudio.microsoft.com/visual-cpp-build-tools/
   # 下载并安装 "Desktop development with C++"
   ```

3. **验证安装**:
   ```bash
   rustc --version
   cargo --version
   ```

4. **构建**:
   ```bash
   npm run tauri:build:windows
   ```

5. **输出位置**:
   - `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/skill-manager_1.0.0_x64_en-US.msi`

#### macOS 打包

1. **安装 Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **安装 Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```

3. **添加目标**:
   ```bash
   # Apple Silicon
   rustup target add aarch64-apple-darwin

   # Intel Mac
   rustup target add x86_64-apple-darwin
   ```

4. **构建**:
   ```bash
   npm run tauri:build:mac
   ```

5. **输出位置**:
   - `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/skill-manager_1.0.0_aarch64.dmg`

## 🧪 测试新功能

### 1. 测试配置管理

```bash
# 获取当前配置
curl http://localhost:3002/api/config

# 设置默认安装路径为项目级
curl -X POST http://localhost:3002/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "defaultInstallLocation": "project",
    "defaultProjectPath": "C:\\Users\\17136\\Desktop\\work\\project\\test"
  }'
```

### 2. 测试更新检查

```bash
# 检查更新 (需要先设置 githubRepo)
curl http://localhost:3002/api/update/check

# 更新数据库
curl -X POST http://localhost:3002/api/update/perform \
  -H "Content-Type: application/json" \
  -d '{"type": "database"}'
```

### 3. 测试安全扫描

```bash
# 扫描单个 Skill
curl -X POST http://localhost:3002/api/skills/scan-security \
  -H "Content-Type: application/json" \
  -d '{"skillPath": "C:\\Users\\17136\\.claude\\skills\\your-skill"}'

# 批量扫描所有 Skills
curl -X POST http://localhost:3002/api/skills/scan-all-security
```

## 📁 项目结构

```
skill-manager/
├── server/
│   ├── index.js              # 主服务器 (已更新)
│   ├── config.json           # 配置文件 (新增字段)
│   ├── security/             # 安全扫描模块 ✨
│   │   ├── rules.js
│   │   └── scanner.js
│   └── update/               # 更新检查模块 ✨
│       └── checker.js
├── src/
│   └── components/
│       └── SecurityReportCard.tsx  # 安全报告UI ✨
├── src-tauri/                # Tauri配置 ✨
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   ├── build.rs
│   ├── src/
│   │   └── main.rs
│   └── icons/               # 应用图标
├── SECURITY.md              # 安全功能文档 ✨
├── PACKAGING.md             # 打包指南 ✨
└── NEW_FEATURES.md          # 新功能总结 ✨
```

## 🔗 有用的链接

- **访问应用**: http://localhost:5174
- **API 文档**: http://localhost:3002
- **健康检查**: http://localhost:3002/api/health

## 📚 详细文档

- [NEW_FEATURES.md](./NEW_FEATURES.md) - 新功能详细说明和API文档
- [SECURITY.md](./SECURITY.md) - 安全扫描功能完整指南
- [PACKAGING.md](./PACKAGING.md) - 打包和发布详细步骤
- [README.md](./README.md) - 项目总览

## ⚠️ 重要提示

1. **GitHub 仓库配置**: 提交代码到 GitHub 后,记得更新配置
2. **Rust 安装**: 打包前必须安装 Rust 和相关工具链
3. **代码签名**: 生产环境建议添加代码签名证书
4. **发布流程**: 详见 PACKAGING.md 中的发布检查清单

## 🎉 完成状态

- ✅ 默认安装路径配置
- ✅ GitHub 更新检查
- ✅ Tauri 打包配置
- ✅ 安全扫描功能
- ✅ 完整文档

所有功能已准备就绪,等待您提交 GitHub 仓库地址后即可完整使用更新功能!

---

**需要帮助?** 查看各个 .md 文档或联系开发团队。
