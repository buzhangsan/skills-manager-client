---
name: skill-manager
description: A Claude Code skill that allows you to search, browse, and install skills from a database of 31,767+ community skills with intelligent folder-level downloads. Supports SVN export, Git sparse checkout, and HTTP fallback methods for complete skill folder installation.
version: 2.0.0
author: buzhangsan@github
license: MIT
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - WebFetch
tags:
  - skill-management
  - package-manager
  - search
  - installation
  - svn
  - git
requirements:
  - Node.js >= 14.0.0
  - Internet connection
  - SVN client (recommended) or Git
---

# Skill Manager

A Claude Code skill that allows you to search, browse, and install skills from a database of 31,767+ community skills with intelligent folder-level downloads.

## Description

Skill Manager provides an easy way to discover and install Claude Code skills. Simply describe what you're looking for, and it will search through a comprehensive database of skills, display matching results with ratings and descriptions, and automatically download the complete skill folder (not just SKILL.md) to your Claude environment.

## Features

- Search through 31,767+ skills from the community
- Intelligent search with weighted scoring (name, description, author)
- View skill details including stars, forks, author, and description
- **Smart installation with multiple methods:**
  - **SVN export** (preferred): Downloads only the skill folder efficiently
  - **Git sparse checkout**: Falls back if SVN unavailable
  - **SKILL.md only**: Final fallback for minimal installation
- Complete folder download including all scripts, data, and documentation
- Automatic configuration and usage guide display
- Support for both English and Chinese descriptions

## Installation Methods

The skill automatically selects the best available method:

### 1. SVN Export (Recommended)
- **Fastest and most efficient**
- Downloads only the specific skill folder
- No Git history overhead
- **Requirement**: SVN client installed
  - Windows: `choco install svn` or download from TortoiseSVN
  - Mac: `brew install svn`
  - Linux: `apt-get install subversion` or `yum install subversion`

### 2. Git Sparse Checkout
- Alternative when SVN unavailable
- Uses Git's sparse checkout feature
- Downloads only needed files
- **Requirement**: Git installed

### 3. SKILL.md Only (Fallback)
- Minimal installation
- Downloads only the SKILL.md file
- Works without any special tools
- Limited functionality for skills requiring additional files

## Usage

When you need to find and install a skill, simply tell Claude what you're looking for:

```
I need a skill for Python testing
```

```
Find me a skill to help with Docker
```

```
Search for skills related to API development
```

Claude will:
1. Search the skills database
2. Display matching results with ratings
3. Ask you to select one
4. **Download the complete skill folder** automatically
5. Show you the configuration and usage guide

## Installation

This skill includes the skills database file in the `data/` directory:
- `data/all_skills_with_cn.json` (30.33 MB)

## Technical Details

The skill uses Node.js to:
- Parse and search the JSON skills database
- **Automatically detect available download methods (SVN, Git, or HTTP)**
- **Use SVN export for efficient folder-only downloads**
- **Fall back to Git sparse checkout if SVN unavailable**
- Download complete skill folders with all files (scripts, data, docs)
- Install skills to `~/.claude/skills/` directory
- Parse skill configuration from SKILL.md content
- Display formatted installation guides with method used

## Download Method Selection

The skill intelligently selects the best method:

```javascript
if (SVN available) {
  → Use SVN export (fastest, most efficient)
} else if (Git available) {
  → Use Git sparse checkout (slower but complete)
} else {
  → Download SKILL.md only (minimal fallback)
}
```

**Why SVN for GitHub?**
- GitHub supports SVN protocol for folder-level access
- Much faster than cloning entire repositories
- No Git history overhead
- Perfect for downloading specific skill folders

## Examples

**Example 1: Installing with SVN (Full Download)**
```
User: I need help with Python testing
Assistant: [Searches database and shows results]
1. pytest-helper (by python-community)
   ⭐ 1,250 stars | 🔀 342 forks
   📝 Helps write and run pytest tests with fixtures and assertions...
   🔗 https://github.com/python-community/pytest-helper

User: Install the first one
Assistant: [Detects SVN, downloads complete folder with all scripts]
   ✓ SVN detected - using efficient folder download
   ✓ Method used: SVN
   ✓ Files installed: SKILL.md, pytest_runner.py, fixtures.py, README.md
```

**Example 2: Fallback to Git Sparse Checkout**
```
User: Find me skills for A股
Assistant: [Shows Chinese stock market skills]

User: Install technical-indicators
Assistant: [SVN not found, uses Git sparse checkout]
   ✓ Git detected - using sparse checkout
   ✓ Method used: Git Sparse Checkout
   ✓ Files installed: SKILL.md, skill.py, references/
```

**Example 3: Search by author**
```
User: Show me skills by pytorch
Assistant: [Searches and displays PyTorch organization skills]
```

**Example 4: Search by functionality**
```
User: Find skills for code review
Assistant: [Searches for code review related skills]
```

## Commands

The skill responds to natural language requests like:
- "Find skills for [topic]"
- "Search for [keyword] skills"
- "Show me skills by [author]"
- "I need help with [task]"
- "Install skill number [N]"
- "Install [skill-name]"

## Notes

- Skills are installed to `~/.claude/skills/[skill-name]/SKILL.md`
- After installation, restart Claude Code to load the new skill
- The database includes skills with GitHub stats (stars, forks) for quality reference
- Search results are ranked by relevance and popularity

## Requirements

- Node.js runtime (>= 14.0.0)
- Internet connection for downloading skills from GitHub
- Skills database file (`all_skills_with_cn.json`)
- **Recommended**: SVN client for optimal installation
  - Windows: `choco install svn` or TortoiseSVN
  - Mac: `brew install svn`
  - Linux: `apt-get install subversion`
- **Alternative**: Git client (usually pre-installed)

## Performance Comparison

| Method | Speed | Files Downloaded | Disk Usage | Requirements |
|--------|-------|------------------|------------|--------------|
| **SVN Export** | ⚡⚡⚡ Fast | All skill files | Minimal | SVN client |
| **Git Sparse Checkout** | ⚡⚡ Medium | All skill files | Small .git overhead | Git |
| **SKILL.md Only** | ⚡ Slow (HTTP) | Only SKILL.md | Minimal | None |

**Recommendation**: Install SVN for the best experience!

## Database Statistics

- Total Skills: 31,767
- Skills with Chinese translations: 31,752 (99.95%)
- Skills from diverse authors and organizations
- Regular updates from GitHub repositories

---

**Created**: 2025-12-26
**Version**: 2.0.0
**Updates in v2.0**:
- Added SVN export support for efficient folder downloads
- Added Git sparse checkout as fallback method
- Now downloads complete skill folders, not just SKILL.md
- Automatic method detection and selection
- Enhanced error handling and troubleshooting tips
