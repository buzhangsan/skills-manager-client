# Skill Manager | 技能管理器

![Skill Manager Banner](../data/banner.jpeg)


> Search, browse, and install 31,767+ community skills from GitHub for your AI agent

**English** | [中文](../README.md)

## 🎯 Introduction

Skill Manager is a Claude Code skill management tool that lets you easily discover and install 31,767+ skills from the GitHub community. Features bilingual search support, one-click installation, and automatic configuration.


## ✨ Features

- 🔍 **Smart Search** - Quickly find among 31,767 skills
- 🌏 **Bilingual Support** - Supports both English and Chinese search (99.95% translated)
- 📥 **One-Click Install** - Automatic download and installation from GitHub
- 📊 **GitHub Stats** - Displays stars, forks, and other metrics
- 📖 **Usage Guides** - Automatically shows configuration instructions after installation

## Community  
- [github:buzhangsan](https://github.com/buzhangsan)
- [x:buzhangsan](https://x.com/MolingDream)




## 🚀 Quick Start


Download and copy to the corresponding directory

### General Tips

Both AI assistants support the following operations:

| Operation | Description |
|-----------|-------------|
| Search Skills | Search 31,767+ skills using keywords |
| Install Skills | Install by specifying the search result number |
| Bilingual Search | Support both English and Chinese search |
| View Details | Display GitHub statistics for skills |


### Using with Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) is the official AI programming assistant from Anthropic.

**Installation Steps:**

1. Copy the `skill-manager` folder to the `~/.claude/skills/` directory (personal or project directory)
2. Restart Claude Code
3. Interact with Claude using natural language


**Notes:**
- Ensure the `SKILL.md` file exists in the skill-manager root directory
- Claude Code will automatically read SKILL.md to understand how to use this tool

### Using with Antigravity

[Antigravity](https://deepmind.google/) is an AI programming assistant from Google DeepMind.

**Installation Steps:**

1. Create the `.agent/skills/` directory in your project (if it doesn't exist)
2. Copy the `skill-manager` folder to the `.agent/skills/` directory
3. Interact with Antigravity using natural language




**Example Commands:**

```
"Please help me search for TypeScript related skills"
"Install a code review skill"
"Find skills suitable for frontend development"
```


## 📦 File Structure

```
skill-manager/
├── SKILL.md                     # Skill configuration
├── README.md                    # Chinese documentation
├── src/                         # Source code
│   ├── index.js                 # Main implementation
│   └── package.json             # NPM package definition
├── data/                        # Data files
│   └── all_skills_with_cn.json  # 31,767 skills (30.33 MB)
└── docs/                        # Documentation
    ├── README_EN.md             # This file
    ├── INSTALLATION.md          # Installation guide
    ├── CHANGELOG.md             # Changelog
    ├── PROJECT_SUMMARY.md       # Project summary
    └── UPGRADE_GUIDE.md         # Upgrade guide
```


## 📊 Database Statistics

| Item | Value |
|------|-------|
| Total Skills | 31,767 |
| Chinese Translations | 31,752 (99.95%) |
| Database Size | 30.33 MB |
| Last Updated | 2025-12-26 |

## 🔍 Search Algorithm

Intelligent weighted scoring:
- **Name match**: +10 points
- **Description match**: +5 points
- **Author match**: +3 points

Results sorted by relevance and GitHub stars

## 📖 Complete Documentation

- **[INSTALLATION.md](INSTALLATION.md)** - Detailed installation and usage guide (Chinese)
- **[README_EN.md](README_EN.md)** - Complete English documentation
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Technical project summary

## 🛠️ System Requirements

- Node.js >= 14.0.0
- Internet connection (for downloading skills)
- Disk space >= 50 MB


## Communication  

- [github:buzhangsan](https://github.com/buzhangsan)
- [x:buzhangsan](https://x.com/MolingDream)

<img src="../data/group.png" width="50%">

## 🌟 Project Highlights

- ✅ 31,767 community skills sourced from skillsmp
- ✅ 99.95% Chinese translation completion rate
- ✅ <1 second search response time
- ✅ 100% installation success rate (tested)
- ✅ Complete usage guides

## 📞 Getting Help

1. Check [INSTALLATION.md](INSTALLATION.md) for detailed instructions
2. Read [README_EN.md](README_EN.md) for more features
3. Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for technical details

## 📄 License

MIT License

---

**Version**: 1.0.0
**Created**: 2025-12-26
**Author**: Claude Skill Manager Team

