# Skill Manager - 安装指南

## 📦 包含的文件

```
skill-manager/
├── SKILL.md                     # Skill 配置文件
├── README.md                    # 完整文档 (中文)
├── src/                         # 源代码
│   ├── index.js                 # 主程序 (499 行)
│   └── package.json             # NPM 包配置
├── data/                        # 数据文件
│   └── all_skills_with_cn.json  # 技能数据库 (30.33 MB, 31,767 个技能)
└── docs/                        # 文档
    ├── README_EN.md             # 完整文档 (英文)
    ├── INSTALLATION.md          # 本文件 (中文安装指南)
    ├── CHANGELOG.md             # 更新日志
    ├── PROJECT_SUMMARY.md       # 项目总结
    └── UPGRADE_GUIDE.md         # 升级指南
```

## 🚀 快速开始

### 方法 1: 命令行使用

1. **确保已安装 Node.js**
   ```bash
   node --version  # 需要 v14 或更高版本
   ```

2. **进入 skill-manager 目录**
   ```bash
   cd skill-manager
   ```

3. **搜索技能**
   ```bash
   node src/index.js search "python testing"
   node src/index.js search "docker"
   node src/index.js search "react"
   ```

4. **安装技能**
   ```bash
   node src/index.js install "python testing" 1
   ```
   - 第一个参数是搜索关键词
   - 第二个参数是要安装的技能编号

### 方法 2: 作为 Claude Code Skill 使用

1. **复制到 Claude Skills 目录**
   ```bash
   # Windows
   cp -r skill-manager "C:\Users\你的用户名\.claude\skills\"

   # macOS/Linux
   cp -r skill-manager ~/.claude/skills/
   ```

2. **重启 Claude Code**

3. **使用自然语言**
   ```
   "帮我找一个 Python 测试的 skill"
   "搜索 Docker 相关的技能"
   "安装第一个"
   ```

## 📊 数据库信息

- **总技能数**: 31,767 个
- **中文翻译**: 31,752 个 (99.95%)
- **数据库大小**: 30.33 MB
- **更新日期**: 2025-12-26

数据库包含的信息：
- ✅ 技能名称（英文）
- ✅ 技能描述（英文 + 中文）
- ✅ 作者名称
- ✅ GitHub 星标数
- ✅ Fork 数量
- ✅ GitHub 仓库链接
- ✅ 更新时间

## 🔍 搜索示例

### 示例 1: 搜索 Python 测试相关技能

```bash
node index.js search "python testing"
```

**输出：**
```
✓ Loaded 31767 skills from database

📦 Found 9 matching skills:

1. python-testing (by athola)
   ⭐ 11 stars | 🔀 2 forks
   📝 Python testing with pytest, fixtures, mocking...
   🔗 https://github.com/athola/claude-night-market/...

2. pytest-patterns (by manutej)
   ⭐ 10 stars | 🔀 3 forks
   📝 Python testing with pytest covering fixtures...
   ...
```

### 示例 2: 搜索 Docker 相关技能

```bash
node index.js search "docker"
```

**结果：** 找到 20 个相关技能，按星标排序

### 示例 3: 搜索 React 相关技能

```bash
node index.js search "react"
```

**结果：** 找到 20 个相关技能

## 💾 安装技能示例

```bash
node index.js install "python testing" 1
```

**安装过程：**
1. ✅ 搜索 "python testing"
2. ✅ 选择第 1 个结果
3. ✅ 从 GitHub 下载 SKILL.md
4. ✅ 安装到 `~/.claude/skills/python-testing/`
5. ✅ 显示配置和使用指南

**输出：**
```
📥 Installing skill: python-testing...
   Downloading from: https://raw.githubusercontent.com/...
   ✓ Installed to: C:\Users\...\python-testing\SKILL.md

================================================================================
📖 Configuration & Usage Guide for: python-testing
================================================================================

📍 Installation Path:
   C:\Users\17136\.claude\skills\python-testing\SKILL.md

📝 Description:
   Python testing with pytest, fixtures, mocking...

👤 Author: athola
⭐ GitHub Stats: Stars: 11 | Forks: 2

✅ Next Steps:
   1. Restart Claude Code to load the skill
   2. Use the skill in your conversations
   3. Check the SKILL.md file for detailed documentation
```

## 🔧 搜索算法

智能加权评分系统：

- **技能名称匹配**: +10 分
- **描述匹配**: +5 分
- **作者匹配**: +3 分

排序规则：
1. 相关性分数（降序）
2. GitHub 星标数（降序）

## 📝 命令行参数

### search 命令
```bash
node index.js search "<搜索关键词>"
```
- 搜索技能数据库
- 显示前 10 个匹配结果
- 输出人类可读格式 + JSON 格式

### install 命令
```bash
node index.js install "<搜索关键词>" <编号>
```
- 搜索并安装指定编号的技能
- 自动下载 SKILL.md 文件
- 安装到 `~/.claude/skills/` 目录
- 显示配置和使用指南

## ⚙️ 系统要求

- **Node.js**: v14.0.0 或更高版本
- **网络连接**: 需要连接 GitHub 下载技能
- **磁盘空间**: 至少 50 MB（包含数据库）

## 🛠️ 故障排除

### 问题 1: "Cannot find module"
**解决方案**: 确保在 `skill-manager` 目录中运行命令

### 问题 2: "Failed to load skills database"
**解决方案**: 检查 `data/all_skills_with_cn.json` 文件是否存在

### 问题 3: 下载失败
**解决方案**:
- 检查网络连接
- 确认 GitHub 可访问
- 某些技能可能已被删除或移动

### 问题 4: 安装目录权限错误
**解决方案**:
- Windows: 以管理员身份运行
- macOS/Linux: 使用 `sudo` 或修改目录权限

## 📚 更多信息

- **完整文档**: 查看 `../README.md` (中文) 或 `README_EN.md` (英文)
- **项目总结**: 查看 `PROJECT_SUMMARY.md`
- **Skill 配置**: 查看 `../SKILL.md`

## 💡 使用技巧

1. **精确搜索**: 使用具体的技术栈名称（如 "pytest" 而不是 "testing"）
2. **查看星标**: 高星标的技能通常质量更好
3. **多次尝试**: 如果第一个技能不合适，试试其他的
4. **阅读描述**: 安装前仔细阅读技能描述
5. **检查更新时间**: 最近更新的技能可能更加可靠

## 🎯 常见使用场景

### 场景 1: 学习新技术
```bash
node index.js search "typescript"
node index.js install "typescript" 1
```

### 场景 2: 提高测试能力
```bash
node index.js search "testing"
# 查看结果，选择合适的编号
node index.js install "testing" 3
```

### 场景 3: DevOps 工作
```bash
node index.js search "docker compose"
node index.js install "docker compose" 1
```

## 🌟 特色功能

- ✅ **双语支持**: 同时搜索英文和中文描述
- ✅ **智能排序**: 结合相关性和流行度
- ✅ **快速搜索**: 31,767 个技能，<1 秒响应
- ✅ **一键安装**: 自动下载和配置
- ✅ **详细指南**: 每次安装后显示使用说明

## 📞 支持

如有问题：
1. 查看 `../README.md` 或 `README_EN.md` 获取详细文档
2. 检查 `PROJECT_SUMMARY.md` 了解技术细节
3. 访问技能的 GitHub 仓库获取原始文档

---

**版本**: 1.0.0
**创建日期**: 2025-12-26
**数据库版本**: 2025-12-26
