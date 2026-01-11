# Skill Manager

[中文文档](./README.md)

A desktop application for managing Claude Code Skills, supporting browsing, installation, import, and security scanning of both system-level and project-level Skills.

## Quick Start

Download the latest version from [Releases](https://github.com/buzhangsan/skills-manager-client/releases).

For smarter skill discovery, try this CLI tool: https://github.com/buzhangsan/skill-manager

Report issues on [GitHub Issues](https://github.com/buzhangsan/skills-manager-client/issues).

## Features

### 1. **My Skills**
- Automatically scan installed Skills at system and project levels
- View detailed Skill information
- One-click uninstall for unwanted Skills

### 2. **Skill Marketplace**
- Browse 40,800+ open-source Skills
- Search and filter functionality
- One-click install to local

### 3. **Skill Import**
Two import methods supported:
- **GitHub Import**: Enter a GitHub repository URL to automatically clone locally
- **Local Folder**: Import existing Skills from a local folder

### 4. **Security Scanning**
- Scan installed Skills for security risks
- Flag suspicious code patterns
- Security scoring and recommendations

### 5. **Project Path Configuration**
- Customize multiple project paths
- Automatically scan `.claude/skills` folders under projects
- Cross-platform support (Windows, macOS)

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7
- **UI Library**: Tailwind CSS 3.4, DaisyUI 5.5
- **State Management**: Zustand 5.0 (with persist)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Charts**: Recharts
- **Desktop**: Tauri v2 (Rust backend)

## Development

### Prerequisites
- Node.js 20+
- Rust (latest stable)
- npm

### 1. Install Dependencies

```bash
npm install
```

### 2. Run in Development Mode

```bash
npm run tauri dev
```

This will start both the Vite dev server and the Tauri application.

### 3. Build for Production

```bash
npm run tauri build
```

Build artifacts will be in `src-tauri/target/release/bundle/`.

## Skill Directory Structure

### System-Level Skills
- **Windows**: `C:\Users\[username]\.claude\skills`
- **macOS/Linux**: `~/.claude/skills`

### Project-Level Skills
Configure project root directories in Settings, and the system will automatically scan:
```
[Project Root]/.claude/skills/
```

### Skill Format Requirements
Each Skill folder must contain a `SKILL.md` file in the following format:

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

## Downloads

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `Skill.Manager_x.x.x_arm64.dmg` |
| macOS (Intel) | `Skill.Manager_x.x.x_x64.dmg` |
| Windows (Installer) | `Skill.Manager_x.x.x_x64-setup.exe` |
| Windows (MSI) | `Skill.Manager_x.x.x_x64_en-US.msi` |

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License
