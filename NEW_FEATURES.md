# Skill Manager - 新功能总结

## 🎉 已完成的功能

### 1. ⚙️ 默认安装路径配置

#### 功能说明
用户可以配置默认安装 Skill 到系统级目录或项目目录。

#### API 接口

**获取完整配置**
```bash
GET /api/config
```

响应:
```json
{
  "success": true,
  "data": {
    "projectPaths": ["/path/to/project1", "/path/to/project2"],
    "defaultInstallLocation": "system",  // 或 "project"
    "defaultProjectPath": "/path/to/default/project",
    "githubRepo": "YOUR_USERNAME/skill-manager",
    "updatedAt": "2026-01-06T..."
  }
}
```

**保存配置**
```bash
POST /api/config
Content-Type: application/json

{
  "projectPaths": [...],
  "defaultInstallLocation": "project",
  "defaultProjectPath": "/path/to/project"
}
```

#### 配置说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `defaultInstallLocation` | string | 默认安装位置: `"system"` 或 `"project"` |
| `defaultProjectPath` | string | 当选择项目级安装时的默认项目路径 |
| `projectPaths` | array | 所有项目路径列表 |
| `githubRepo` | string | GitHub 仓库地址，用于更新检查 |

#### 使用示例

导入 Skill 时会自动使用默认路径:

```javascript
// 不指定 installPath，使用默认路径
fetch('/api/skills/import/github', {
  method: 'POST',
  body: JSON.stringify({
    url: 'https://github.com/user/skill'
    // installPath 未提供，自动使用默认路径
  })
});

// 或显式指定路径覆盖默认设置
fetch('/api/skills/import/github', {
  method: 'POST',
  body: JSON.stringify({
    url: 'https://github.com/user/skill',
    installPath: '/custom/path'  // 覆盖默认路径
  })
});
```

---

### 2. 🔄 GitHub 更新检查

#### 功能说明
自动检查应用程序和安全规则数据库的更新。

#### API 接口

**检查更新**
```bash
GET /api/update/check
```

响应:
```json
{
  "success": true,
  "data": {
    "app": {
      "hasUpdate": true,
      "currentVersion": "1.0.0",
      "latestVersion": "1.1.0",
      "releaseNotes": "## What's New\n- Feature 1\n- Bug fixes",
      "releaseUrl": "https://github.com/.../releases/tag/v1.1.0",
      "publishedAt": "2026-01-10T...",
      "assets": [
        {
          "name": "skill-manager_1.1.0_x64.msi",
          "downloadUrl": "https://github.com/.../skill-manager_1.1.0_x64.msi",
          "size": 52428800,
          "platform": "windows"
        },
        {
          "name": "skill-manager_1.1.0_aarch64.dmg",
          "downloadUrl": "https://github.com/.../skill-manager_1.1.0_aarch64.dmg",
          "size": 48234567,
          "platform": "macos"
        }
      ]
    },
    "database": {
      "hasUpdate": true,
      "localUpdatedAt": "2026-01-05T...",
      "remoteUpdatedAt": "2026-01-06T...",
      "commitMessage": "Add new security rules for Node.js",
      "commitUrl": "https://github.com/.../commit/abc123"
    },
    "currentPlatform": "windows"  // 或 "macos", "linux"
  }
}
```

**执行更新**
```bash
POST /api/update/perform
Content-Type: application/json

{
  "type": "database"  // 或 "app"
}
```

响应:
```json
{
  "success": true,
  "message": "Database updated successfully",
  "data": {
    "backupCreated": true
  }
}
```

#### 更新类型

| 类型 | 说明 | 自动执行 |
|------|------|---------|
| `database` | 安全规则库更新 | ✅ 是 |
| `app` | 应用程序更新 | ❌ 否，需要手动下载安装 |

#### 配置 GitHub 仓库

在配置中设置 `githubRepo`:

```javascript
fetch('/api/config', {
  method: 'POST',
  body: JSON.stringify({
    ...otherConfig,
    githubRepo: 'YOUR_USERNAME/skill-manager'
  })
});
```

---

### 3. 📦 Tauri 桌面应用打包

#### 已配置的功能

- ✅ Tauri 2 集成
- ✅ 自动启动后端服务器
- ✅ Windows/macOS 打包配置
- ✅ 应用图标生成
- ✅ 安装包构建脚本

#### 打包命令

```bash
# Windows 构建
npm run tauri:build:windows

# macOS 构建
npm run tauri:build:mac

# 当前平台构建
npm run tauri:build

# 开发模式 (热重载)
npm run tauri:dev
```

#### 输出文件

**Windows:**
- MSI 安装包: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/skill-manager_1.0.0_x64_en-US.msi`
- 便携版 EXE: `src-tauri/target/x86_64-pc-windows-msvc/release/skill-manager.exe`

**macOS:**
- DMG 镜像: `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/skill-manager_1.0.0_aarch64.dmg`
- App 包: `src-tauri/target/aarch64-apple-darwin/release/bundle/macos/skill-manager.app`

#### 前提条件

在打包前需要安装:

**Windows:**
1. Rust: https://rustup.rs/
2. Microsoft C++ Build Tools

**macOS:**
1. Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. Xcode Command Line Tools: `xcode-select --install`

详细说明请查看 [PACKAGING.md](./PACKAGING.md)

---

## 📂 新增文件清单

```
skill-manager/
├── server/
│   ├── security/
│   │   ├── rules.js          # 60+ 安全规则 ✨
│   │   └── scanner.js        # 安全扫描引擎 ✨
│   └── update/
│       └── checker.js        # GitHub 更新检查器 ✨
├── src/
│   └── components/
│       └── SecurityReportCard.tsx  # 安全报告UI组件 ✨
├── src-tauri/               # Tauri 配置目录 ✨
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── src/
│   │   └── main.rs
│   └── icons/              # 应用图标 ✨
├── SECURITY.md             # 安全功能文档 ✨
└── PACKAGING.md            # 打包指南 ✨
```

## 🔧 配置文件更新

### `server/config.json`

新增字段:

```json
{
  "projectPaths": [...],
  "defaultInstallLocation": "system",      // 新增 ✨
  "defaultProjectPath": null,              // 新增 ✨
  "githubRepo": "YOUR_USERNAME/skill-manager",  // 新增 ✨
  "updatedAt": "..."
}
```

### `package.json`

新增命令:

```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:windows": "tauri build --target x86_64-pc-windows-msvc",
    "tauri:build:mac": "tauri build --target aarch64-apple-darwin"
  }
}
```

## 🔗 完整 API 列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/skills/scan` | 扫描本地 Skills |
| POST | `/api/skills/import/github` | 从 GitHub 导入 (带安全扫描) |
| POST | `/api/skills/import/local` | 从本地导入 (带安全扫描) |
| POST | `/api/skills/scan-security` | 扫描单个 Skill 安全性 |
| POST | `/api/skills/scan-all-security` | 批量扫描所有 Skills |
| GET | `/api/config` | 获取完整配置 ✨ |
| POST | `/api/config` | 保存完整配置 ✨ |
| GET | `/api/config/project-paths` | 获取项目路径 |
| POST | `/api/config/project-paths` | 保存项目路径 |
| GET | `/api/update/check` | 检查更新 ✨ |
| POST | `/api/update/perform` | 执行更新 ✨ |
| GET | `/api/read-skill` | 读取 SKILL.md 内容 |

## 📝 前端集成示例

### 使用默认安装路径

```tsx
import { useState, useEffect } from 'react';

function Settings() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // 加载配置
    fetch('http://localhost:3002/api/config')
      .then(r => r.json())
      .then(data => setConfig(data.data));
  }, []);

  const handleSave = () => {
    fetch('http://localhost:3002/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  };

  return (
    <div>
      <select
        value={config?.defaultInstallLocation}
        onChange={(e) => setConfig({
          ...config,
          defaultInstallLocation: e.target.value
        })}
      >
        <option value="system">系统级 (~/.claude/skills)</option>
        <option value="project">项目级 (当前项目)</option>
      </select>

      {config?.defaultInstallLocation === 'project' && (
        <input
          type="text"
          value={config?.defaultProjectPath || ''}
          onChange={(e) => setConfig({
            ...config,
            defaultProjectPath: e.target.value
          })}
          placeholder="/path/to/project"
        />
      )}

      <button onClick={handleSave}>保存设置</button>
    </div>
  );
}
```

### 检查更新

```tsx
import { useState } from 'react';

function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkUpdate = async () => {
    setChecking(true);
    const res = await fetch('http://localhost:3002/api/update/check');
    const data = await res.json();
    setUpdateInfo(data.data);
    setChecking(false);
  };

  const updateDatabase = async () => {
    const res = await fetch('http://localhost:3002/api/update/perform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'database' })
    });
    const data = await res.json();
    alert(data.message);
  };

  return (
    <div>
      <button onClick={checkUpdate} disabled={checking}>
        {checking ? '检查中...' : '检查更新'}
      </button>

      {updateInfo?.app.hasUpdate && (
        <div className="alert alert-info">
          <p>发现新版本: {updateInfo.app.latestVersion}</p>
          <a href={updateInfo.app.releaseUrl} target="_blank">
            下载更新
          </a>
        </div>
      )}

      {updateInfo?.database.hasUpdate && (
        <div className="alert alert-warning">
          <p>安全规则库有更新</p>
          <button onClick={updateDatabase}>立即更新</button>
        </div>
      )}
    </div>
  );
}
```

## 🚀 下一步行动

### 1. 配置 GitHub 仓库

将代码提交到 GitHub 后,在配置中设置仓库地址:

```bash
curl -X POST http://localhost:3002/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "githubRepo": "YOUR_USERNAME/skill-manager"
  }'
```

### 2. 安装 Rust (打包前必需)

**Windows:**
```bash
winget install Rustlang.Rustup
```

**macOS:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 3. 构建第一个发布版本

```bash
# 构建前端
npm run build

# Windows 用户
npm run tauri:build:windows

# macOS 用户
npm run tauri:build:mac
```

### 4. 创建 GitHub Release

```bash
# 打标签
git tag v1.0.0
git push origin v1.0.0

# 在 GitHub 上创建 Release 并上传构建产物
```

## 📚 相关文档

- [SECURITY.md](./SECURITY.md) - 安全扫描功能详解
- [PACKAGING.md](./PACKAGING.md) - 打包和发布完整指南
- [README.md](./README.md) - 项目总览

## ⚠️ 注意事项

1. **更新检查需要 GitHub 仓库**: 在配置中设置 `githubRepo` 字段
2. **打包需要 Rust**: 首次打包前必须安装 Rust 工具链
3. **默认路径配置**: 更改默认安装位置后,只影响新导入的 Skills
4. **数据库更新**: 会自动备份原文件为 `.backup` 后缀
5. **应用更新**: 目前需要用户手动下载安装,暂不支持自动更新

## 🎁 新功能演示

启动应用后,可以测试:

1. **配置默认路径**:
   ```bash
   curl http://localhost:3002/api/config
   ```

2. **检查更新**:
   ```bash
   curl http://localhost:3002/api/update/check
   ```

3. **查看所有 API**:
   ```bash
   curl http://localhost:3002/
   ```

---

所有功能已经完成并准备就绪! 🎉
