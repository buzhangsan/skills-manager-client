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
            pattern: Regex::new(r"\.ssh/(id_rsa|id_dsa|id_ecdsa|id_ed25519)").unwrap(),
            severity: Severity::High,
            category: Category::Secrets,
            weight: 70,
            description: "访问SSH私钥",
            hard_trigger: false,
            confidence: Confidence::High,
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
    ];
}

pub fn scan_directory(dir_path: &Path, skill_id: &str) -> Result<SecurityReport> {
    let mut issues = Vec::new();
    let mut total_weight_deducted = 0u32;
    let mut blocked = false;

    // 扫描所有文件
    for entry in WalkDir::new(dir_path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Ok(content) = fs::read_to_string(entry.path()) {
                for (line_num, line) in content.lines().enumerate() {
                    for rule in SECURITY_RULES.iter() {
                        if rule.pattern.is_match(line) {
                            issues.push(SecurityIssue {
                                rule_id: rule.id.to_string(),
                                rule_name: rule.name.to_string(),
                                file: entry.path().to_string_lossy().to_string(),
                                line: line_num + 1,
                                code: line.to_string(),
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
    } else {
        "low".to_string()
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
    })
}

fn generate_recommendations(issues: &[SecurityIssue]) -> Vec<String> {
    let mut recommendations = Vec::new();

    if issues.iter().any(|i| matches!(i.category, Category::Destructive)) {
        recommendations.push("避免使用破坏性命令如 rm -rf".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::CmdInjection)) {
        recommendations.push("避免使用 eval 或动态执行命令".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::Network)) {
        recommendations.push("审查所有网络请求，确保数据安全".to_string());
    }
    if issues.iter().any(|i| matches!(i.category, Category::Secrets)) {
        recommendations.push("不要在代码中硬编码密钥或访问敏感文件".to_string());
    }

    recommendations
}
