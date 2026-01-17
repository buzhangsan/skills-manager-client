# Findings & Decisions

## Requirements
<!-- 基于 skillslm 分析得出的优化需求 -->
- 支持多个 AI 代理 (不仅限于 Claude Code)
- 代理自动检测功能
- 批量安装多个 Skills
- 安装到多个代理
- Skill 更新/升级功能
- 简化 GitHub 导入格式 (支持 owner/repo 简写)
- 保留现有安全扫描优势

## Research Findings

### skillslm 包信息
- **版本:** 2.0.0 (2026-01-15 发布)
- **依赖:** commander, chalk, ora, axios, degit, @clack/prompts, gray-matter
- **关键词:** cli, skills, claude, anthropic, cursor, codex, opencode, ai-coding-agents

### skillslm 支持的 9 个代理

| 代理 | 标识符 | 项目级路径 | 全局路径 |
|------|--------|-----------|---------|
| Claude Code | `claude-code` | `.claude/skills` | `~/.claude/skills` |
| Cursor | `cursor` | `.cursor/skills` | `~/.cursor/skills` |
| Codex | `codex` | `.codex/skills` | `~/.codex/skills` |
| OpenCode | `opencode` | `.opencode/skill` | `~/.config/opencode/skill` |
| Amp | `amp` | `.agents/skills` | `~/.config/agents/skills` |
| Kilo Code | `kilo` | `.kilocode/skills` | `~/.kilocode/skills` |
| Roo Code | `roo` | `.roo/skills` | `~/.roo/skills` |
| Goose | `goose` | `.goose/skills` | `~/.config/goose/skills` |
| Antigravity | `antigravity` | `.agent/skills` | `~/.gemini/antigravity/skills` |

### skillslm 代理检测逻辑
```javascript
// 通过检测目录是否存在来判断代理是否安装
detect: () => fs.existsSync(path.join(os.homedir(), '.claude'))
detect: () => fs.existsSync(path.join(os.homedir(), '.cursor'))
// ...
```

### skillslm 技能发现优先级目录
```
1. 搜索路径本身
2. skills/
3. skills/.curated/
4. skills/.experimental/
5. skills/.system/
6. .codex/skills/
7. .claude/skills/
8. .opencode/skill/
9. .cursor/skills/
10. .agents/skills/
11. .kilocode/skills/
12. .roo/skills/
13. .goose/skills/
14. .agent/skills/
```

### skillslm 安装命令格式
```bash
# 交互式安装
npx skillslm install anthropics/skills

# 指定代理安装
npx skillslm install mcp-builder --agent claude-code

# 安装到多个代理
npx skillslm install mcp-builder --agent claude-code --agent cursor

# 全局安装
npx skillslm install mcp-builder --agent claude-code --global

# 批量安装
npx skillslm install anthropics/skills --skill mcp-builder --skill pdf --agent claude-code
```

### 你的项目当前功能
- **技术栈:** React 19 + TypeScript + Vite 7 + Tauri v2 + Zustand + DaisyUI
- **页面:** Dashboard, Marketplace, MySkills, Security, Settings
- **核心功能:**
  - 市场浏览 (53,000+ Skills)
  - GitHub/本地导入
  - 安全扫描评分
  - 系统/项目级 Skills 管理
  - 中英文国际化

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| 采用 skillslm 的代理配置格式 | 保持与 CLI 工具兼容，用户熟悉的路径结构 |
| 在 Settings 页面添加代理管理 | 符合现有架构，用户习惯 |
| 使用 Rust 实现代理检测 | 更高效的文件系统操作 |
| 安装时提供代理选择下拉框 | 在 Marketplace 和 MySkills 页面复用 |
| 批量安装使用复选框模式 | 简单直观，无需购物车UI |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| (暂无) | - |

## Resources
- skillslm npm 包: https://www.npmjs.com/package/skillslm
- skillslm GitHub (推测): https://github.com/your-username/skillslm
- 你的项目: /Users/a0/creat/skill_manager/skills-manager-client
- Tauri v2 文档: https://v2.tauri.app

## Visual/Browser Findings
- skillslm README 确认支持 9 个代理
- 提供交互式和命令行两种安装模式
- 使用 degit 实现快速下载 (无需完整 git clone)

---
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
