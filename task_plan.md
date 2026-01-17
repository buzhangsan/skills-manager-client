# Task Plan: Skills Manager Client 优化升级

## Goal
参考 skillslm (npm CLI 工具) 的功能特性，优化 skills-manager-client 桌面应用，使其支持多代理、批量安装、Skill 更新等核心功能。

## Current Phase
Phase 1

## Phases

### Phase 1: 需求分析与功能对比
- [x] 分析 skillslm 的核心功能
- [x] 分析 skills-manager-client 的现有功能
- [x] 确定优化优先级
- [x] 记录发现到 findings.md
- **Status:** complete

### Phase 2: 多代理支持架构设计
- [ ] 设计代理配置数据结构
- [ ] 规划前端 UI 变更 (设置页面、安装选择)
- [ ] 规划 Tauri 后端接口变更
- [ ] 确定代理检测逻辑
- **Status:** pending

### Phase 3: 核心功能实现
- [ ] 实现代理配置模块 (agents.ts)
- [ ] 添加代理自动检测功能 (Rust 后端)
- [ ] 更新设置页面支持多代理配置
- [ ] 更新安装流程支持选择目标代理
- **Status:** pending

### Phase 4: 批量安装与更新功能
- [ ] 实现 Marketplace 批量选择功能
- [ ] 添加批量安装到多代理的逻辑
- [ ] 实现 Skill 版本检测与更新功能
- [ ] 优化 GitHub 导入支持简写格式
- **Status:** pending

### Phase 5: 测试与验证
- [ ] 测试多代理安装功能
- [ ] 测试批量安装功能
- [ ] 测试 Skill 更新功能
- [ ] 修复发现的问题
- **Status:** pending

### Phase 6: 交付
- [ ] 代码审查
- [ ] 更新文档
- [ ] 提交变更
- **Status:** pending

## Key Questions
1. 是否需要支持所有 9 个代理，还是只支持主流的几个？ - 建议先支持前 5 个最常用的
2. 批量安装是否需要购物车UI？ - 建议使用多选模式
3. Skill 更新如何检测新版本？ - 可通过 GitHub API 检测最新 commit

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 参考 skillslm 的代理配置结构 | 保持兼容性，复用已验证的路径配置 |
| 优先实现多代理支持 | 这是扩大用户群体的关键功能 |
| 使用多选模式而非购物车 | 实现更简单，用户体验相近 |
| 保留安全扫描功能 | 这是项目的独特优势 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (暂无) | - | - |

## Notes
- skillslm 支持 9 个代理: claude-code, cursor, codex, opencode, amp, kilo, roo, goose, antigravity
- 你的项目优势: GUI、安全扫描、53000+ Skills 市场数据
- skillslm 优势: 多代理支持、CLI 便捷性、快速安装 (degit)
