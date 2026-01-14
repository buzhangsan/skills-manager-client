use serde::{Deserialize, Serialize};
use regex::Regex;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Category {
    Destructive,
    RemoteExec,
    CmdInjection,
    Network,
    Privilege,
    Secrets,
    Persistence,
    SensitiveFileAccess,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Confidence {
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone)]
pub struct SecurityRule {
    pub id: &'static str,
    pub name: &'static str,
    pub pattern: Regex,
    pub severity: Severity,
    pub category: Category,
    pub weight: u32,
    pub description: &'static str,
    pub hard_trigger: bool,
    pub confidence: Confidence,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecurityIssue {
    pub rule_id: String,
    pub rule_name: String,
    pub file: String,
    pub line: usize,
    pub code: String,
    pub severity: Severity,
    pub category: Category,
    pub description: String,
    pub confidence: Confidence,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecurityReport {
    pub skill_id: String,
    pub score: u32,
    pub level: String,
    pub issues: Vec<SecurityIssue>,
    pub blocked: bool,
    pub recommendations: Vec<String>,
    pub scanned_files: Vec<String>,
}

// 核心安全规则定义
lazy_static::lazy_static! {
    pub static ref SECURITY_RULES: Vec<SecurityRule> = vec![
        // 破坏性操作
        SecurityRule {
            id: "RM_RF_ROOT",
            name: "删除根目录",
            pattern: Regex::new(r"rm\s+(-[a-zA-Z]*)*\s*-r[a-zA-Z]*\s+(-[a-zA-Z]*\s+)*/[#$\s;|]").unwrap(),
            severity: Severity::Critical,
            category: Category::Destructive,
            weight: 100,
            description: "rm -rf / 删除根目录",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "RM_RF_WILDCARD",
            name: "通配符删除",
            pattern: Regex::new(r"rm\s+(-[a-zA-Z]*)*\s*-r[a-zA-Z]*\s+[^\s]*\*").unwrap(),
            severity: Severity::High,
            category: Category::Destructive,
            weight: 80,
            description: "rm -rf *危险通配符删除",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "FORMAT_DISK",
            name: "格式化磁盘",
            pattern: Regex::new(r"(mkfs|format)\s+.*(/dev/|[A-Z]:)").unwrap(),
            severity: Severity::Critical,
            category: Category::Destructive,
            weight: 100,
            description: "格式化磁盘操作",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        // 命令注入
        SecurityRule {
            id: "SHELL_INJECTION",
            name: "Shell命令注入",
            pattern: Regex::new(r#"(exec|system|popen|subprocess\.call|os\.system)\s*\("#).unwrap(),
            severity: Severity::High,
            category: Category::CmdInjection,
            weight: 70,
            description: "可能存在shell命令注入",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "EVAL_DANGER",
            name: "危险的eval",
            pattern: Regex::new(r"\beval\s*\(").unwrap(),
            severity: Severity::High,
            category: Category::CmdInjection,
            weight: 60,
            description: "使用eval执行动态代码",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "BACKTICK_EXEC",
            name: "反引号执行",
            pattern: Regex::new(r"`[^`]+`").unwrap(),
            severity: Severity::Medium,
            category: Category::CmdInjection,
            weight: 40,
            description: "使用反引号执行命令",
            hard_trigger: false,
            confidence: Confidence::Low,
        },
        // 网络外传
        SecurityRule {
            id: "CURL_POST",
            name: "外部数据传输",
            pattern: Regex::new(r"curl\s+.*(-X\s+POST|-d\s+|--data)").unwrap(),
            severity: Severity::Medium,
            category: Category::Network,
            weight: 40,
            description: "使用curl POST传输数据",
            hard_trigger: false,
            confidence: Confidence::Low,
        },
        SecurityRule {
            id: "WGET_EXEC",
            name: "下载并执行",
            pattern: Regex::new(r"(wget|curl)\s+.*\|\s*(ba)?sh").unwrap(),
            severity: Severity::Critical,
            category: Category::RemoteExec,
            weight: 90,
            description: "从网络下载并直接执行脚本",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "REVERSE_SHELL",
            name: "反向Shell",
            pattern: Regex::new(r"(bash\s+-i|nc\s+-e|/dev/tcp/)").unwrap(),
            severity: Severity::Critical,
            category: Category::RemoteExec,
            weight: 100,
            description: "检测到反向shell连接",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        // 敏感文件访问
        SecurityRule {
            id: "PASSWD_ACCESS",
            name: "访问密码文件",
            pattern: Regex::new(r"/etc/(passwd|shadow)").unwrap(),
            severity: Severity::High,
            category: Category::SensitiveFileAccess,
            weight: 70,
            description: "访问系统密码文件",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "SSH_KEY_ACCESS",
            name: "访问SSH密钥",
            pattern: Regex::new(r"\.ssh/(id_rsa|id_dsa|id_ecdsa|id_ed25519|authorized_keys)").unwrap(),
            severity: Severity::High,
            category: Category::Secrets,
            weight: 70,
            description: "访问SSH私钥或授权文件",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "ENV_SECRETS",
            name: "环境变量泄露",
            pattern: Regex::new(r"(API_KEY|SECRET|PASSWORD|TOKEN|CREDENTIAL)\s*=").unwrap(),
            severity: Severity::Medium,
            category: Category::Secrets,
            weight: 50,
            description: "可能存在硬编码的密钥",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        // 持久化
        SecurityRule {
            id: "CRONTAB_MODIFY",
            name: "修改定时任务",
            pattern: Regex::new(r"crontab\s+-e|echo.*>>\s*/etc/crontab").unwrap(),
            severity: Severity::High,
            category: Category::Persistence,
            weight: 65,
            description: "修改crontab定时任务",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "STARTUP_MODIFY",
            name: "修改启动项",
            pattern: Regex::new(r"(/etc/rc\.local|/etc/init\.d/|systemctl\s+enable|launchctl\s+load)").unwrap(),
            severity: Severity::High,
            category: Category::Persistence,
            weight: 65,
            description: "修改系统启动项",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        // 权限提升
        SecurityRule {
            id: "SUDO_NOPASSWD",
            name: "无密码sudo",
            pattern: Regex::new(r"NOPASSWD").unwrap(),
            severity: Severity::Critical,
            category: Category::Privilege,
            weight: 90,
            description: "配置无密码sudo",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "CHMOD_777",
            name: "危险权限设置",
            pattern: Regex::new(r"chmod\s+777").unwrap(),
            severity: Severity::Medium,
            category: Category::Privilege,
            weight: 40,
            description: "设置过于宽松的文件权限",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "SETUID",
            name: "设置SUID位",
            pattern: Regex::new(r"chmod\s+[u\+]*s|chmod\s+4[0-7]{3}").unwrap(),
            severity: Severity::High,
            category: Category::Privilege,
            weight: 70,
            description: "设置SUID权限位",
            hard_trigger: false,
            confidence: Confidence::High,
        },
    ];
}

pub fn scan_directory(dir_path: &Path, skill_id: &str) -> Result<SecurityReport> {
    let mut issues = Vec::new();
    let mut total_weight_deducted = 0u32;
    let mut blocked = false;
    let mut scanned_files = Vec::new();

    // 扫描所有文件
    for entry in WalkDir::new(dir_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            // 跳过隐藏目录和 node_modules
            let path = e.path();
            !path.components().any(|c| {
                let s = c.as_os_str().to_string_lossy();
                s.starts_with('.') || s == "node_modules"
            })
        })
    {
        if entry.file_type().is_file() {
            let path = entry.path();

            // 只扫描文本文件
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            let scannable_exts = ["md", "txt", "sh", "bash", "zsh", "py", "js", "ts", "rb", "pl", "php", "yaml", "yml", "json", "toml"];

            if !scannable_exts.contains(&ext) && !path.file_name().map(|n| n.to_string_lossy().contains("SKILL")).unwrap_or(false) {
                continue;
            }

            if let Ok(content) = fs::read_to_string(path) {
                scanned_files.push(path.to_string_lossy().to_string());

                for (line_num, line) in content.lines().enumerate() {
                    for rule in SECURITY_RULES.iter() {
                        if rule.pattern.is_match(line) {
                            issues.push(SecurityIssue {
                                rule_id: rule.id.to_string(),
                                rule_name: rule.name.to_string(),
                                file: path.to_string_lossy().to_string(),
                                line: line_num + 1,
                                code: line.chars().take(200).collect(),
                                severity: rule.severity.clone(),
                                category: rule.category.clone(),
                                description: rule.description.to_string(),
                                confidence: rule.confidence.clone(),
                            });

                            total_weight_deducted += rule.weight;
                            if rule.hard_trigger {
                                blocked = true;
                            }
                        }
                    }
                }
            }
        }
    }

    // 计算安全评分
    let score = if total_weight_deducted >= 100 {
        0
    } else {
        100 - total_weight_deducted
    };

    // 确定风险等级
    let level = if blocked || score < 20 {
        "critical".to_string()
    } else if score < 50 {
        "high".to_string()
    } else if score < 75 {
        "medium".to_string()
    } else if score < 90 {
        "low".to_string()
    } else {
        "safe".to_string()
    };

    // 生成建议
    let recommendations = generate_recommendations(&issues);

    Ok(SecurityReport {
        skill_id: skill_id.to_string(),
        score,
        level,
        issues,
        blocked,
        recommendations,
        scanned_files,
    })
}

fn generate_recommendations(issues: &[SecurityIssue]) -> Vec<String> {
    let mut recommendations = Vec::new();

    if issues.iter().any(|i| matches!(i.category, Category::Destructive)) {
        recommendations.push("避免使用破坏性命令如 rm -rf，建议使用更安全的删除方式".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::CmdInjection)) {
        recommendations.push("避免使用 eval 或动态执行命令，存在代码注入风险".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::RemoteExec)) {
        recommendations.push("不要从网络直接下载并执行脚本，存在远程代码执行风险".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::Network)) {
        recommendations.push("审查所有网络请求，确保不会泄露敏感数据".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::Secrets)) {
        recommendations.push("不要在代码中硬编码密钥，使用环境变量或密钥管理服务".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::Persistence)) {
        recommendations.push("审查所有持久化操作，确保不会在系统中留下恶意后门".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::Privilege)) {
        recommendations.push("避免过于宽松的权限设置，遵循最小权限原则".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::SensitiveFileAccess)) {
        recommendations.push("不要访问系统敏感文件，如 /etc/passwd 或 SSH 密钥".to_string());
    }

    if recommendations.is_empty() {
        recommendations.push("未发现明显安全问题，但建议定期审查代码".to_string());
    }

    recommendations
}
