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
        // ========================================
        // 破坏性操作 (Linux/macOS)
        // ========================================
        SecurityRule {
            id: "RM_RF_ROOT",
            name: "删除根目录",
            pattern: Regex::new(r"rm\s+(-[a-zA-Z]*\s+)*-r[a-zA-Z]*\s+(-[a-zA-Z]*\s+)*(/|/\s*$)").unwrap(),
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
            pattern: Regex::new(r"rm\s+(-[a-zA-Z]*\s+)*-r[a-zA-Z]*\s+[^\s]*\*").unwrap(),
            severity: Severity::High,
            category: Category::Destructive,
            weight: 80,
            description: "rm -rf *危险通配符删除",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "RM_RF_HOME",
            name: "删除用户目录",
            pattern: Regex::new(r"rm\s+(-[a-zA-Z]*\s+)*-r[a-zA-Z]*\s+(-[a-zA-Z]*\s+)*(~|/home/|\$HOME)").unwrap(),
            severity: Severity::Critical,
            category: Category::Destructive,
            weight: 95,
            description: "rm -rf ~ 删除用户主目录",
            hard_trigger: true,
            confidence: Confidence::High,
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
        SecurityRule {
            id: "DD_DISK",
            name: "低级磁盘写入",
            pattern: Regex::new(r"dd\s+.*of\s*=\s*/dev/").unwrap(),
            severity: Severity::Critical,
            category: Category::Destructive,
            weight: 100,
            description: "使用dd直接写入磁盘设备",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "SHRED_WIPE",
            name: "安全擦除",
            pattern: Regex::new(r"(shred|wipe)\s+").unwrap(),
            severity: Severity::High,
            category: Category::Destructive,
            weight: 75,
            description: "使用shred/wipe安全删除文件",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },

        // ========================================
        // 破坏性操作 (Windows)
        // ========================================
        SecurityRule {
            id: "WINDOWS_DEL_RECURSIVE",
            name: "Windows递归删除",
            pattern: Regex::new(r"(?i)(del|erase)\s+.*(/s|/q)").unwrap(),
            severity: Severity::High,
            category: Category::Destructive,
            weight: 80,
            description: "Windows del /s 递归删除文件",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "WINDOWS_RD_RECURSIVE",
            name: "Windows删除目录",
            pattern: Regex::new(r"(?i)(rd|rmdir)\s+.*(/s|/q)").unwrap(),
            severity: Severity::High,
            category: Category::Destructive,
            weight: 80,
            description: "Windows rd /s 递归删除目录",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "WINDOWS_FORMAT",
            name: "Windows格式化",
            pattern: Regex::new(r"(?i)format\s+[a-z]:").unwrap(),
            severity: Severity::Critical,
            category: Category::Destructive,
            weight: 100,
            description: "Windows格式化磁盘",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "WINDOWS_DISKPART",
            name: "Windows磁盘分区",
            pattern: Regex::new(r"(?i)diskpart").unwrap(),
            severity: Severity::High,
            category: Category::Destructive,
            weight: 70,
            description: "使用diskpart进行磁盘操作",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },

        // ========================================
        // 命令注入
        // ========================================
        SecurityRule {
            id: "SHELL_INJECTION",
            name: "Shell命令注入",
            pattern: Regex::new(r#"(exec|system|popen|subprocess\.(call|run|Popen)|os\.system|child_process)\s*\("#).unwrap(),
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
            id: "BACKTICK_SHELL_EXEC",
            name: "Shell反引号执行",
            pattern: Regex::new(r"\$\([^)]+\)|`[^`]{10,}`").unwrap(),
            severity: Severity::Medium,
            category: Category::CmdInjection,
            weight: 40,
            description: "使用$()或反引号执行命令",
            hard_trigger: false,
            confidence: Confidence::Low,
        },
        SecurityRule {
            id: "PYTHON_EXEC",
            name: "Python代码执行",
            pattern: Regex::new(r"python[23]?\s+(-c|.*exec\s*\()").unwrap(),
            severity: Severity::High,
            category: Category::CmdInjection,
            weight: 65,
            description: "Python -c 或 exec() 执行代码",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "NODE_EXEC",
            name: "Node.js代码执行",
            pattern: Regex::new(r"node\s+-e").unwrap(),
            severity: Severity::High,
            category: Category::CmdInjection,
            weight: 65,
            description: "Node.js -e 执行代码",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "XARGS_RM",
            name: "xargs删除",
            pattern: Regex::new(r"xargs\s+.*rm").unwrap(),
            severity: Severity::High,
            category: Category::Destructive,
            weight: 70,
            description: "通过xargs执行删除操作",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "BASE64_DECODE_EXEC",
            name: "Base64解码执行",
            pattern: Regex::new(r"base64\s+(-d|--decode).*\|\s*(ba)?sh").unwrap(),
            severity: Severity::Critical,
            category: Category::CmdInjection,
            weight: 95,
            description: "Base64解码后执行脚本",
            hard_trigger: true,
            confidence: Confidence::High,
        },

        // ========================================
        // Windows 命令注入
        // ========================================
        SecurityRule {
            id: "POWERSHELL_ENCODED",
            name: "PowerShell编码执行",
            pattern: Regex::new(r"(?i)powershell.*-[eE](nc(odedcommand)?)?").unwrap(),
            severity: Severity::Critical,
            category: Category::CmdInjection,
            weight: 100,
            description: "PowerShell使用编码命令执行（常见攻击手法）",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "POWERSHELL_BYPASS",
            name: "PowerShell绕过策略",
            pattern: Regex::new(r"(?i)powershell.*-[eE]xecutionpolicy\s*(bypass|unrestricted)").unwrap(),
            severity: Severity::High,
            category: Category::CmdInjection,
            weight: 85,
            description: "PowerShell绕过执行策略",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "POWERSHELL_DOWNLOAD",
            name: "PowerShell下载执行",
            pattern: Regex::new(r"(?i)(Invoke-WebRequest|Invoke-Expression|IEX|wget|curl).*\|").unwrap(),
            severity: Severity::High,
            category: Category::RemoteExec,
            weight: 80,
            description: "PowerShell下载并执行远程脚本",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "WINDOWS_REG_ADD",
            name: "Windows注册表修改",
            pattern: Regex::new(r"(?i)reg\s+(add|delete|import)").unwrap(),
            severity: Severity::High,
            category: Category::Persistence,
            weight: 70,
            description: "修改Windows注册表",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "WINDOWS_SCHTASKS",
            name: "Windows计划任务",
            pattern: Regex::new(r"(?i)schtasks\s+/create").unwrap(),
            severity: Severity::High,
            category: Category::Persistence,
            weight: 70,
            description: "创建Windows计划任务",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "WINDOWS_SERVICE",
            name: "Windows服务操作",
            pattern: Regex::new(r"(?i)sc\s+(create|config|start)").unwrap(),
            severity: Severity::High,
            category: Category::Persistence,
            weight: 65,
            description: "创建或修改Windows服务",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "WINDOWS_WMIC",
            name: "WMIC命令",
            pattern: Regex::new(r"(?i)wmic\s+(process|service|os)\s+(call|create|delete)").unwrap(),
            severity: Severity::High,
            category: Category::CmdInjection,
            weight: 70,
            description: "使用WMIC进行系统操作",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },

        // ========================================
        // 远程执行/网络
        // ========================================
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
            pattern: Regex::new(r"(bash\s+-i.*>&|nc\s+.*-e|/dev/tcp/|mkfifo.*nc)").unwrap(),
            severity: Severity::Critical,
            category: Category::RemoteExec,
            weight: 100,
            description: "检测到反向shell连接",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "NETCAT_LISTEN",
            name: "Netcat监听",
            pattern: Regex::new(r"nc\s+.*-l").unwrap(),
            severity: Severity::High,
            category: Category::Network,
            weight: 70,
            description: "Netcat监听端口（可能用于后门）",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "SSH_TUNNEL",
            name: "SSH隧道",
            pattern: Regex::new(r"ssh\s+.*(-L|-R|-D)\s+").unwrap(),
            severity: Severity::Medium,
            category: Category::Network,
            weight: 45,
            description: "SSH端口转发/隧道",
            hard_trigger: false,
            confidence: Confidence::Low,
        },

        // ========================================
        // 数据外泄
        // ========================================
        SecurityRule {
            id: "DATA_EXFIL_SCP",
            name: "SCP远程复制",
            pattern: Regex::new(r"scp\s+.*@.*:").unwrap(),
            severity: Severity::Medium,
            category: Category::Network,
            weight: 45,
            description: "使用SCP传输文件到远程服务器",
            hard_trigger: false,
            confidence: Confidence::Low,
        },
        SecurityRule {
            id: "DATA_EXFIL_RSYNC",
            name: "Rsync远程同步",
            pattern: Regex::new(r"rsync\s+.*@.*:").unwrap(),
            severity: Severity::Medium,
            category: Category::Network,
            weight: 45,
            description: "使用rsync同步到远程服务器",
            hard_trigger: false,
            confidence: Confidence::Low,
        },
        SecurityRule {
            id: "CLOUD_UPLOAD",
            name: "云存储上传",
            pattern: Regex::new(r"(aws\s+s3\s+(cp|sync|mv)|gsutil\s+(cp|rsync)|azcopy)").unwrap(),
            severity: Severity::Medium,
            category: Category::Network,
            weight: 50,
            description: "上传文件到云存储",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "FTP_TRANSFER",
            name: "FTP传输",
            pattern: Regex::new(r"(?i)(ftp|sftp|lftp)\s+").unwrap(),
            severity: Severity::Medium,
            category: Category::Network,
            weight: 40,
            description: "使用FTP传输文件",
            hard_trigger: false,
            confidence: Confidence::Low,
        },
        SecurityRule {
            id: "DNS_EXFIL",
            name: "DNS外泄",
            pattern: Regex::new(r"(dig|nslookup|host)\s+.*\$").unwrap(),
            severity: Severity::High,
            category: Category::Network,
            weight: 75,
            description: "可能通过DNS进行数据外泄",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },

        // ========================================
        // 敏感文件访问
        // ========================================
        SecurityRule {
            id: "PASSWD_ACCESS",
            name: "访问密码文件",
            pattern: Regex::new(r"/etc/(passwd|shadow|master\.passwd)").unwrap(),
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
            pattern: Regex::new(r"\.ssh/(id_rsa|id_dsa|id_ecdsa|id_ed25519|authorized_keys|known_hosts)").unwrap(),
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
            pattern: Regex::new(r#"(?i)(API_KEY|SECRET_KEY|PRIVATE_KEY|PASSWORD|ACCESS_TOKEN|AUTH_TOKEN|CREDENTIAL|AWS_SECRET)\s*=\s*['"]?[a-zA-Z0-9]"#).unwrap(),
            severity: Severity::Medium,
            category: Category::Secrets,
            weight: 50,
            description: "可能存在硬编码的密钥",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "BROWSER_CREDENTIALS",
            name: "浏览器凭据访问",
            pattern: Regex::new(r"(?i)(\.mozilla|\.chrome|\.config/chromium|Login Data|cookies\.sqlite)").unwrap(),
            severity: Severity::High,
            category: Category::Secrets,
            weight: 75,
            description: "访问浏览器存储的凭据",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "WINDOWS_SAM",
            name: "Windows密码数据库",
            pattern: Regex::new(r"(?i)(\\system32\\config\\sam|\\system32\\config\\system)").unwrap(),
            severity: Severity::Critical,
            category: Category::SensitiveFileAccess,
            weight: 95,
            description: "访问Windows SAM密码数据库",
            hard_trigger: true,
            confidence: Confidence::High,
        },

        // ========================================
        // 持久化
        // ========================================
        SecurityRule {
            id: "CRONTAB_MODIFY",
            name: "修改定时任务",
            pattern: Regex::new(r"crontab\s+(-e|-l|-r)|>>\s*/etc/cron").unwrap(),
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
            pattern: Regex::new(r"(/etc/rc\.local|/etc/init\.d/|systemctl\s+enable|launchctl\s+(load|submit))").unwrap(),
            severity: Severity::High,
            category: Category::Persistence,
            weight: 65,
            description: "修改系统启动项",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "BASHRC_MODIFY",
            name: "修改Shell配置",
            pattern: Regex::new(r">>\s*~?\/?\.?(bashrc|zshrc|profile|bash_profile)").unwrap(),
            severity: Severity::High,
            category: Category::Persistence,
            weight: 70,
            description: "修改用户Shell配置文件",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "WINDOWS_STARTUP",
            name: "Windows启动目录",
            pattern: Regex::new(r"(?i)(\\Start Menu\\Programs\\Startup|\\Startup\\)").unwrap(),
            severity: Severity::High,
            category: Category::Persistence,
            weight: 70,
            description: "写入Windows启动目录",
            hard_trigger: false,
            confidence: Confidence::High,
        },

        // ========================================
        // 权限提升
        // ========================================
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
            pattern: Regex::new(r"chmod\s+(777|a\+rwx)").unwrap(),
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
            pattern: Regex::new(r"chmod\s+([ugo]\+s|[24][0-7]{3})").unwrap(),
            severity: Severity::High,
            category: Category::Privilege,
            weight: 70,
            description: "设置SUID/SGID权限位",
            hard_trigger: false,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "SUDO_EDIT_SUDOERS",
            name: "修改sudoers",
            pattern: Regex::new(r"(visudo|/etc/sudoers)").unwrap(),
            severity: Severity::Critical,
            category: Category::Privilege,
            weight: 85,
            description: "修改sudo配置文件",
            hard_trigger: false,
            confidence: Confidence::High,
        },

        // ========================================
        // AI/提示词注入
        // ========================================
        SecurityRule {
            id: "AI_IGNORE_INSTRUCTIONS",
            name: "忽略指令攻击",
            pattern: Regex::new(r"(?i)(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)").unwrap(),
            severity: Severity::Critical,
            category: Category::CmdInjection,
            weight: 100,
            description: "尝试让AI忽略之前的指令",
            hard_trigger: true,
            confidence: Confidence::High,
        },
        SecurityRule {
            id: "AI_ROLE_HIJACK",
            name: "角色劫持",
            pattern: Regex::new(r"(?i)(you are now|act as|pretend to be|roleplay as)\s+(a\s+)?(different|new|another|evil|malicious)").unwrap(),
            severity: Severity::High,
            category: Category::CmdInjection,
            weight: 80,
            description: "尝试劫持AI角色",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "AI_SYSTEM_PROMPT",
            name: "系统提示词访问",
            pattern: Regex::new(r"(?i)(show|reveal|print|output|display)\s+(me\s+)?(your\s+)?(system\s+prompt|instructions?|rules?|constraints?)").unwrap(),
            severity: Severity::Medium,
            category: Category::SensitiveFileAccess,
            weight: 55,
            description: "尝试获取AI系统提示词",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "AI_JAILBREAK",
            name: "越狱攻击",
            pattern: Regex::new(r"(?i)(DAN|jailbreak|bypass|disable)\s+(mode|filter|safety|restriction)").unwrap(),
            severity: Severity::Critical,
            category: Category::CmdInjection,
            weight: 95,
            description: "尝试越狱或绕过AI安全限制",
            hard_trigger: true,
            confidence: Confidence::High,
        },

        // ========================================
        // 加密/勒索相关
        // ========================================
        SecurityRule {
            id: "ENCRYPT_FILES",
            name: "批量加密文件",
            pattern: Regex::new(r"(openssl\s+enc|gpg\s+(-c|--symmetric)|7z\s+a\s+-p)").unwrap(),
            severity: Severity::High,
            category: Category::Destructive,
            weight: 65,
            description: "使用加密工具加密文件",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "RANSOM_EXTENSION",
            name: "勒索软件特征扩展名",
            pattern: Regex::new(r"\.(locked|encrypted|crypto|crypt|enc)\b").unwrap(),
            severity: Severity::High,
            category: Category::Destructive,
            weight: 70,
            description: "检测到勒索软件常用的加密扩展名",
            hard_trigger: false,
            confidence: Confidence::Medium,
        },
        SecurityRule {
            id: "CRYPTO_WALLET",
            name: "加密货币钱包",
            pattern: Regex::new(r"(?i)(bitcoin|ethereum|wallet\.dat|\.wallet)").unwrap(),
            severity: Severity::Medium,
            category: Category::Secrets,
            weight: 50,
            description: "访问加密货币钱包文件",
            hard_trigger: false,
            confidence: Confidence::Low,
        },
    ];
}

// 检测是否为注释行
fn is_comment_line(line: &str) -> bool {
    let trimmed = line.trim();
    trimmed.starts_with('#') ||
    trimmed.starts_with("//") ||
    trimmed.starts_with("/*") ||
    trimmed.starts_with('*') ||
    trimmed.starts_with("--") ||
    trimmed.starts_with("REM ") ||
    trimmed.starts_with("rem ") ||
    trimmed.starts_with("<!--")
}

// 危险的二进制文件扩展名
const BLOCKED_BINARY_EXTS: &[&str] = &["exe", "dll", "so", "dylib", "jar", "msi", "scr", "com", "pif"];

// 可扫描的文本文件扩展名
const SCANNABLE_EXTS: &[&str] = &[
    "md", "txt", "sh", "bash", "zsh", "fish",
    "py", "js", "ts", "jsx", "tsx", "mjs", "cjs",
    "rb", "pl", "php", "lua", "r",
    "yaml", "yml", "json", "toml", "xml", "ini", "cfg", "conf",
    "ps1", "psm1", "bat", "cmd", "vbs", "wsf",
    "c", "cpp", "h", "hpp", "java", "go", "rs", "swift",
    "sql", "dockerfile", "makefile"
];

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
                s.starts_with('.') || s == "node_modules" || s == "__pycache__" || s == "target"
            })
        })
    {
        if entry.file_type().is_file() {
            let path = entry.path();
            let ext = path.extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();

            // 检查是否为危险的二进制文件
            if BLOCKED_BINARY_EXTS.contains(&ext.as_str()) {
                issues.push(SecurityIssue {
                    rule_id: "BINARY_EXECUTABLE".to_string(),
                    rule_name: "可执行二进制文件".to_string(),
                    file: path.to_string_lossy().to_string(),
                    line: 0,
                    code: format!("检测到可执行文件: {}", path.file_name().unwrap_or_default().to_string_lossy()),
                    severity: Severity::Critical,
                    category: Category::RemoteExec,
                    description: "Skill 中包含可执行二进制文件，存在重大安全风险".to_string(),
                    confidence: Confidence::High,
                });
                total_weight_deducted += 100;
                blocked = true;
                scanned_files.push(path.to_string_lossy().to_string());
                continue;
            }

            // 只扫描文本文件
            let is_skill_file = path.file_name()
                .map(|n| n.to_string_lossy().to_uppercase().contains("SKILL"))
                .unwrap_or(false);
            let is_no_ext = ext.is_empty();

            if !SCANNABLE_EXTS.contains(&ext.as_str()) && !is_skill_file && !is_no_ext {
                continue;
            }

            if let Ok(content) = fs::read_to_string(path) {
                scanned_files.push(path.to_string_lossy().to_string());

                for (line_num, line) in content.lines().enumerate() {
                    // 跳过注释行以减少误报
                    if is_comment_line(line) {
                        continue;
                    }

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

    // 计算安全评分 (使用饱和减法避免溢出)
    let score = 100u32.saturating_sub(total_weight_deducted.min(100));

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
