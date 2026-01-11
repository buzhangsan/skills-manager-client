# Skill Manager - 完整目录结构

## 📁 完整目录布局

### 程序本体
```
任意位置\
└── skill-manager.exe           # 10MB 单文件可执行程序
```

### 用户数据目录
```
C:\Users\用户名\.skills-manager\
├── config.json                 # 应用配置
├── security-rules.json         # 安全规则库（可选）
├── marketplace.json            # 技能市场数据（可选）
└── skills\                     # 所有已安装的技能
    ├── git-commander\
    │   ├── SKILL.md
    │   └── skill.py
    ├── file-explorer\
    │   ├── SKILL.md
    │   └── skill.py
    └── custom-skill\
        ├── SKILL.md
        └── skill.py
```

### 项目级技能（可选）
```
D:\Projects\MyProject\.skills-manager\
└── skills\
    └── project-specific-skill\
        ├── SKILL.md
        └── skill.py
```

## 🔄 数据流程

### 首次启动
```
用户双击 skill-manager.exe
    ↓
检查 ~/.skills-manager/config.json
    ↓
不存在 → 从 INIT_DATA_URL 下载 init-data.zip
    ↓
解压到 ~/.skills-manager/
    ├── config.json
    ├── security-rules.json
    ├── marketplace.json
    └── skills/
        ├── skill-1/
        └── skill-2/
    ↓
启动应用
```

### 后续启动
```
用户双击 skill-manager.exe
    ↓
检查 ~/.skills-manager/config.json
    ↓
存在 → 跳过下载
    ↓
直接启动应用
```

## 📦 远程数据包结构

### init-data.zip
```
init-data.zip
├── config.json              # 必需：应用配置
├── security-rules.json      # 可选：安全规则
├── marketplace.json         # 可选：市场数据
└── skills/                  # 可选：预装技能
    ├── example-skill-1/
    │   ├── SKILL.md
    │   └── skill.py
    └── example-skill-2/
        ├── SKILL.md
        └── skill.py
```

### config.json 示例
```json
{
  "projectPaths": [],
  "defaultInstallLocation": "system",
  "defaultProjectPath": null,
  "githubRepo": "username/skill-manager",
  "updatedAt": "2026-01-06T00:00:00Z"
}
```

## 🎯 使用场景

### 场景 1: 纯净安装
- 用户下载 `skill-manager.exe`
- 首次运行自动下载基础配置
- `.skills-manager/skills/` 为空
- 用户手动从市场安装技能

### 场景 2: 预装技能
- init-data.zip 包含常用技能
- 首次运行自动下载并解压
- 用户立即可用预装技能

### 场景 3: 企业定制
- init-data.zip 包含企业专用配置
- 部署在内网服务器
- 所有员工使用统一配置和技能

## 💡 优势

✅ **单文件分发**: exe 独立运行
✅ **自动初始化**: 首次启动自动配置
✅ **预装技能**: 可以打包常用技能
✅ **在线更新**: 配置和技能可在线更新
✅ **数据隔离**: 程序和数据完全分离
✅ **用户友好**: 无需手动配置
✅ **离线可用**: 下载后完全离线
✅ **企业部署**: 支持内网定制

## 🔧 配置方法

### 1. 设置下载源
编辑 `src-tauri/src/main.rs`:
```rust
const INIT_DATA_URL: &str = "https://github.com/username/skill-manager/releases/latest/download/init-data.zip";
```

### 2. 准备 init-data.zip
```bash
# 创建目录结构
mkdir init-data
cd init-data

# 添加配置
echo '{"projectPaths":[],"defaultInstallLocation":"system"}' > config.json

# 添加预装技能（可选）
mkdir -p skills/my-skill
echo '# My Skill' > skills/my-skill/SKILL.md

# 打包
zip -r init-data.zip config.json skills/
```

### 3. 发布到 GitHub Release
1. 创建 Release
2. 上传 `init-data.zip`
3. 获取下载 URL

### 4. 重新编译
```bash
npm run tauri:build:windows
```

## 📊 与传统方案对比

| 特性 | 传统方案 | 当前方案 |
|------|---------|---------|
| 配置文件 | 打包在 exe 中 | 远程下载 |
| 更新配置 | 需重新打包 exe | 只需更新 zip |
| 技能安装 | 分散在 .claude/ | 统一在 .skills-manager/ |
| 预装技能 | 需打包到 exe | 打包到 zip |
| exe 大小 | 包含所有数据 | 仅程序本体 (10MB) |
| 离线使用 | ✅ | ✅ (首次联网) |
| 企业定制 | ❌ 困难 | ✅ 简单 |

## ⚠️ 注意事项

1. **首次启动需网络**: 下载初始化数据
2. **下载失败处理**: 自动使用默认配置继续运行
3. **目录权限**: 确保用户有 `~/.skills-manager/` 写权限
4. **ZIP 格式**: 确保 init-data.zip 格式正确
5. **URL 可用性**: 确保下载链接长期有效
