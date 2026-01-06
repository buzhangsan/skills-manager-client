# Skill Manager 安全扫描功能

基于 [agent-skills-guard](https://github.com/brucevanfdm/agent-skills-guard) 的安全检测逻辑集成。

## 功能概述

Skill Manager 集成了智能安全扫描引擎,可以在导入 Skill 时自动检测潜在的安全风险,保护您的系统安全。

### 核心特性

✅ **60+ 条安全规则** - 覆盖多种威胁类型
✅ **自动扫描** - 导入时自动检测,无需手动操作
✅ **智能评分** - 0-100 分安全评分系统
✅ **硬触发机制** - 严重风险自动阻止安装
✅ **详细报告** - 提供修复建议和 CWE 编号
✅ **置信度标注** - 区分高/中/低置信度问题

## 安全规则分类

### 1. **破坏性操作** (Destructive)
- `rm -rf /` - 删除根目录 ⛔ 硬触发
- `rm -rf ~` - 删除用户目录 ⛔ 硬触发
- `dd` 写入磁盘设备 ⛔ 硬触发
- `mkfs` 格式化磁盘 ⛔ 硬触发

### 2. **远程代码执行** (Remote Execution)
- `curl | sh` - 远程脚本执行 ⛔ 硬触发
- `wget | bash` - 远程脚本执行 ⛔ 硬触发
- `base64 -d | sh` - Base64 解码执行 ⛔ 硬触发
- 反弹 Shell 后门 ⛔ 硬触发

### 3. **命令注入** (Command Injection)
- Python `eval()` / `exec()`
- `os.system()`
- `subprocess shell=True`
- Node.js `child_process.exec()`
- `vm.runInNewContext()`

### 4. **网络外传** (Network)
- `curl POST` 请求
- `netcat` 连接
- HTTP/HTTPS 请求
- WebSocket 连接
- FTP 协议使用

### 5. **权限提升** (Privilege Escalation)
- `sudo` 提权
- `chmod 777` 权限开放
- `/etc/sudoers` 修改 ⛔ 硬触发

### 6. **敏感信息泄露** (Secrets)
- API Key 硬编码
- 私钥硬编码
- 密码硬编码
- AWS 密钥
- GitHub Token
- JWT Token
- 数据库连接串
- Slack Webhook

### 7. **持久化机制** (Persistence)
- `crontab` 定时任务
- SSH 密钥注入 ⛔ 硬触发

### 8. **敏感文件访问** (Sensitive File Access)
- 读取 SSH 私钥
- 读取 AWS 凭证
- 读取 `.env` 文件
- 读取 `/etc/passwd`
- 读取 `/etc/shadow` ⛔ 硬触发
- 读取 Git 凭证

## API 接口

### 1. 单个 Skill 安全扫描

```bash
POST /api/skills/scan-security
Content-Type: application/json

{
  "skillPath": "/path/to/skill"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "skillId": "my-skill",
    "score": 85,
    "level": "low",
    "blocked": false,
    "issues": [
      {
        "severity": "warning",
        "category": "network",
        "description": "HTTP 请求库: Python requests HTTP 请求",
        "lineNumber": 42,
        "codeSnippet": "response = requests.get('https://api.example.com')",
        "filePath": "main.py",
        "confidence": "low",
        "remediation": "确认请求目标URL的安全性，使用HTTPS协议"
      }
    ],
    "recommendations": [
      "ℹ️  该 Skill 存在轻微安全风险，建议审查后再安装",
      "ℹ️  包含网络请求，请确认目标地址可信"
    ],
    "summary": {
      "totalIssues": 1,
      "criticalCount": 0,
      "highCount": 0,
      "mediumCount": 0,
      "lowCount": 1,
      "score": 85,
      "blocked": false,
      "level": "low"
    }
  }
}
```

### 2. 批量扫描所有已安装 Skills

```bash
POST /api/skills/scan-all-security
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "skills": [
      {
        "id": "skill-1",
        "name": "My Safe Skill",
        "localPath": "/path/to/skill-1",
        "securityReport": {
          "score": 100,
          "level": "safe",
          "blocked": false,
          "issues": []
        }
      }
    ]
  }
}
```

### 3. GitHub 导入 (自动安全扫描)

```bash
POST /api/skills/import/github
Content-Type: application/json

{
  "url": "https://github.com/user/repo",
  "installPath": "/path/to/install",
  "skipSecurityCheck": false  // 可选,默认 false
}
```

**被阻止的响应:**
```json
{
  "success": false,
  "blocked": true,
  "error": "检测到严重安全风险，已阻止安装",
  "securityReport": {
    "blocked": true,
    "hardTriggerIssues": [
      {
        "ruleName": "删除根目录",
        "file": "install.sh",
        "line": 15,
        "description": "rm -rf / 删除根目录",
        "code": "rm -rf /"
      }
    ]
  }
}
```

### 4. 本地导入 (自动安全扫描)

```bash
POST /api/skills/import/local
Content-Type: application/json

{
  "sourcePath": "/path/to/local/skill",
  "installPath": "/path/to/install",
  "skipSecurityCheck": false  // 可选,默认 false
}
```

## 前端集成

### 使用 SecurityReportCard 组件

```tsx
import SecurityReportCard from '@/components/SecurityReportCard';

function MyComponent() {
  const [report, setReport] = useState(null);
  const [scanning, setScanning] = useState(false);

  const handleScan = async (skillPath: string) => {
    setScanning(true);
    try {
      const response = await fetch('http://localhost:3002/api/skills/scan-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillPath })
      });
      const data = await response.json();
      setReport(data.data);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleScan('/path/to/skill')}>
        扫描 Skill
      </button>

      <SecurityReportCard
        report={report}
        loading={scanning}
        onClose={() => setReport(null)}
      />
    </div>
  );
}
```

## 评分机制

### 计算方式

```
初始分数 = 100
最终分数 = 100 - Σ(匹配规则的权重)
最低分数 = 0
```

### 风险等级

| 分数范围 | 等级 | 描述 |
|---------|------|------|
| 90-100 | safe | 安全 - 未发现明显风险 |
| 70-89 | low | 低风险 - 存在轻微风险 |
| 50-69 | medium | 中等风险 - 建议谨慎安装 |
| 30-49 | high | 高风险 - 强烈建议不要安装 |
| 0-29 | critical | 严重风险 - 极度危险 |

### 规则权重分配

| 严重程度 | 权重范围 | 示例 |
|---------|---------|------|
| Critical | 80-100 | `rm -rf /`, AWS密钥泄露 |
| High | 55-75 | `eval()`, API密钥硬编码 |
| Medium | 25-50 | `subprocess.run()`, `.env`访问 |
| Low | 15-25 | HTTP请求, WebSocket |

## 硬触发机制

某些极其危险的操作会触发**硬阻止**,直接拒绝安装:

1. **破坏性操作**
   - `rm -rf /`
   - `rm -rf ~`
   - `dd` 写入磁盘
   - `mkfs` 格式化

2. **远程代码执行**
   - `curl | sh`
   - `wget | bash`
   - 反弹 Shell

3. **权限滥用**
   - `/etc/sudoers` 修改

4. **敏感文件**
   - SSH 密钥注入
   - `/etc/shadow` 读取

## 最佳实践

### 1. 导入前审查

在导入任何 Skill 前:
- 查看 GitHub 仓库的星标和 fork 数
- 阅读源代码,尤其是 `.sh`, `.py`, `.js` 文件
- 检查最近更新时间

### 2. 信任评估

只安装来自以下来源的 Skill:
- ✅ 官方仓库
- ✅ 知名开发者
- ✅ 经过社区验证
- ❌ 未知来源
- ❌ 最近才创建的账号

### 3. 风险等级处理

- **safe/low**: 可以放心安装
- **medium**: 仔细审查代码后再决定
- **high/critical**: 强烈不建议安装
- **blocked**: 已自动阻止,不要强制安装

### 4. 定期扫描

使用批量扫描功能定期检查已安装的 Skills:

```bash
POST /api/skills/scan-all-security
```

## 技术实现

### 规则引擎

- **语言**: JavaScript/Node.js
- **模式匹配**: 正则表达式
- **规则数量**: 60+
- **可扩展**: 易于添加新规则

### 扫描范围

扫描以下文件类型:
- Markdown (`.md`, `SKILL.md`)
- Python (`.py`)
- JavaScript/TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`)
- Shell (`.sh`, `.bash`, `.zsh`)
- 配置文件 (`.yml`, `.yaml`, `.json`)

### 性能优化

- 跳过 `node_modules`, `.git` 等目录
- 只扫描文本文件
- 异步并行处理

## 与 agent-skills-guard 的对比

| 特性 | agent-skills-guard | skill-manager |
|------|-------------------|---------------|
| 语言 | Rust + Tauri | JavaScript/Node.js |
| 规则数量 | 60+ | 60+ (完全移植) |
| 部署方式 | 独立桌面应用 | 集成在 Web 应用 |
| 扫描时机 | 手动触发 | 导入时自动 + 手动 |
| 界面 | Tauri 桌面界面 | React Web 界面 |
| 性能 | 更快 (Rust) | 稍慢 (JavaScript) |
| 易用性 | 需单独安装 | 内置无需额外安装 |

## 未来规划

- [ ] 规则自动更新
- [ ] 自定义规则配置
- [ ] 白名单机制
- [ ] 机器学习增强检测
- [ ] 社区规则贡献
- [ ] 扫描历史记录
- [ ] 风险趋势分析

## 常见问题

### Q: 误报怎么办?

A: 如果确认是误报,可以:
1. 手动审查代码
2. 在导入时设置 `skipSecurityCheck: true` 跳过检查
3. 提交 Issue 报告误报规则

### Q: 扫描需要多长时间?

A: 通常在 1-5 秒内完成,取决于 Skill 大小。

### Q: 可以自定义规则吗?

A: 当前版本不支持,计划在未来版本中添加。

### Q: 扫描会修改文件吗?

A: 不会,扫描是只读操作,不会修改任何文件。

## 致谢

感谢 [agent-skills-guard](https://github.com/brucevanfdm/agent-skills-guard) 项目提供的优秀安全规则库!

## 许可证

MIT License
