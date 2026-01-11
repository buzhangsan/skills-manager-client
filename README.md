# Skill Manager

一个用于管理 Claude Skills 的桌面应用程序，支持系统级和项目级 Skill 的浏览、安装、导入和安全扫描。

## 使用
普通用户直接从release下载最新版本，mac日内发布
如有问题请在issues中反馈

感谢黄佬的推荐 https://x.com/servasyy_ai/status/2010240935121342719

## 功能特性

### 1. **我的 Skills**
- 自动扫描系统级和项目级已安装的 Skills
- 支持查看 Skill 详细信息
- 运行和编辑 Skill 配置
- 一键卸载不需要的 Skills

### 2. **Skill 市场**
- 浏览 40,800+ 开源 Skills
- 搜索和筛选功能
- 一键安装到本地

### 3. **Skill 导入**
支持三种导入方式：
- **GitHub 导入**：输入 GitHub 仓库 URL，自动克隆到本地
- **本地文件夹**：从本地文件夹导入现有 Skill
- **本地压缩包**：从 ZIP 等压缩包导入（即将支持）

### 4. **安全扫描**
- 扫描已安装 Skill 的安全风险
- 标记可疑代码模式
- 安全评分和建议

### 5. **项目路径配置**
- 自定义多个项目路径
- 自动扫描项目下的 `.claude/skills` 文件夹
- 跨平台支持（Windows、macOS、Linux）

## 技术栈

- **前端**: React 19, TypeScript, Vite 7
- **UI 库**: Tailwind CSS 3.4, DaisyUI 5.5
- **状态管理**: Zustand 5.0 (with persist)
- **路由**: React Router v7
- **图标**: Lucide React
- **图表**: Recharts
- **后端**: Node.js + Express
- **桌面打包**: Tauri v2 (计划中)

## 开发和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端 API 服务

```bash
cd server
node index.js
```

后端服务将运行在 `http://localhost:3002`

### 3. 启动前端开发服务器

在另一个终端窗口：

```bash
npm run dev
```

前端将运行在 `http://localhost:3001` (或可用的端口)

### 4. 访问应用

打开浏览器访问: http://localhost:3001

## Skill 目录结构

### 系统级 Skills
- **Windows**: `C:\Users\[用户名]\.claude\skills`
- **macOS/Linux**: `~/.claude/skills`

### 项目级 Skills
在设置页面配置项目根目录，系统会自动扫描：
```
[项目根目录]/.claude/skills/
```

### Skill 格式要求
每个 Skill 文件夹必须包含 `SKILL.md` 文件，格式如下：

```markdown
---
name: skill-name
description: Skill description
author: Your Name
version: 1.0.0
---

# Skill Instructions

Your skill content here...
```

## API 接口

### 扫描本地 Skills
```
GET /api/skills/scan
```

### 导入 GitHub Skill
```
POST /api/skills/import/github
Body: { "url": "https://github.com/user/repo" }
```

### 导入本地 Skill
```
POST /api/skills/import/local
Body: { "sourcePath": "/path/to/skill" }
```

### 获取项目路径配置
```
GET /api/config/project-paths
```

### 保存项目路径配置
```
POST /api/config/project-paths
Body: { "paths": ["/path1", "/path2"] }
```

## 打包为桌面应用

计划使用 Tauri v2 打包为：
- Windows: `.exe`
- macOS: `.dmg`
- Linux: `.AppImage`

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
