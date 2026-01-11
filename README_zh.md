# Skill Manager

[English](./README.md)

一个用于管理 Claude Code Skills 的桌面应用程序，支持系统级和项目级 Skill 的浏览、安装、导入和安全扫描。

## 快速开始

直接从 [Releases](https://github.com/buzhangsan/skills-manager-client/releases) 下载最新版本。

如果想更加智能的查找 skill，请使用此 CLI 工具：https://github.com/buzhangsan/skill-manager

如有问题请在 [Issues](https://github.com/buzhangsan/skills-manager-client/issues) 中反馈。

## 功能特性

### 1. **我的 Skills**
- 自动扫描系统级和项目级已安装的 Skills
- 支持查看 Skill 详细信息
- 一键卸载不需要的 Skills

### 2. **Skill 市场**
- 浏览 40,800+ 开源 Skills
- 搜索和筛选功能
- 一键安装到本地

### 3. **Skill 导入**
支持两种导入方式：
- **GitHub 导入**：输入 GitHub 仓库 URL，自动克隆到本地
- **本地文件夹**：从本地文件夹导入现有 Skill

### 4. **安全扫描**
- 扫描已安装 Skill 的安全风险
- 标记可疑代码模式
- 安全评分和建议

### 5. **项目路径配置**
- 自定义多个项目路径
- 自动扫描项目下的 `.claude/skills` 文件夹
- 跨平台支持（Windows、macOS）

## 技术栈

- **前端**: React 19, TypeScript, Vite 7
- **UI 库**: Tailwind CSS 3.4, DaisyUI 5.5
- **状态管理**: Zustand 5.0 (with persist)
- **路由**: React Router v7
- **图标**: Lucide React
- **图表**: Recharts
- **桌面端**: Tauri v2 (Rust 后端)

## 开发

### 环境要求
- Node.js 20+
- Rust (最新稳定版)
- npm

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式运行

```bash
npm run tauri dev
```

这将同时启动 Vite 开发服务器和 Tauri 应用程序。

### 3. 生产环境构建

```bash
npm run tauri build
```

构建产物将在 `src-tauri/target/release/bundle/` 目录下。

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

## 下载

| 平台 | 文件 |
|------|------|
| macOS (Apple Silicon) | `Skill.Manager_x.x.x_arm64.dmg` |
| macOS (Intel) | `Skill.Manager_x.x.x_x64.dmg` |
| Windows (安装程序) | `Skill.Manager_x.x.x_x64-setup.exe` |
| Windows (MSI) | `Skill.Manager_x.x.x_x64_en-US.msi` |

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
