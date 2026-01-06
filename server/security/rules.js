/**
 * 安全扫描规则库
 * 基于 agent-skills-guard 的 Rust 规则移植到 JavaScript
 */

// 风险严重程度
export const Severity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// 风险类别
export const Category = {
  DESTRUCTIVE: 'destructive',           // 破坏性操作
  REMOTE_EXEC: 'remote_exec',           // 远程执行
  CMD_INJECTION: 'cmd_injection',       // 命令注入
  NETWORK: 'network',                   // 网络外传
  PRIVILEGE: 'privilege',               // 权限提升
  SECRETS: 'secrets',                   // 敏感泄露
  PERSISTENCE: 'persistence',           // 持久化
  SENSITIVE_FILE_ACCESS: 'sensitive_file_access'  // 敏感文件访问
};

// 置信度等级
export const Confidence = {
  HIGH: 'high',      // 高置信度，误报可能性低
  MEDIUM: 'medium',  // 中等置信度
  LOW: 'low'         // 低置信度，可能误报
};

/**
 * 危险模式规则
 */
export const PATTERN_RULES = [
  // ===== A. 破坏性操作 =====
  {
    id: 'RM_RF_ROOT',
    name: '删除根目录',
    pattern: /rm\s+(-[a-zA-Z]*)*\s*-r[a-zA-Z]*\s+(-[a-zA-Z]*\s+)*\/(#|$|\s|;|\|)/,
    severity: Severity.CRITICAL,
    category: Category.DESTRUCTIVE,
    weight: 100,
    description: 'rm -rf / 删除根目录',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '检查命令参数，避免操作根目录或使用通配符',
    cweId: 'CWE-78'
  },
  {
    id: 'RM_RF_HOME',
    name: '删除用户目录',
    pattern: /rm\s+(-[a-zA-Z]*)*\s*-r[a-zA-Z]*\s+(-[a-zA-Z]*\s+)*(~|\$HOME)/,
    severity: Severity.CRITICAL,
    category: Category.DESTRUCTIVE,
    weight: 90,
    description: 'rm -rf ~ 删除用户目录',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '检查命令参数，避免操作用户主目录',
    cweId: 'CWE-78'
  },
  {
    id: 'DD_WIPE',
    name: '磁盘擦除',
    pattern: /dd\s+.*of=\/dev\/(sd[a-z]|nvme|hd[a-z]|vd[a-z])/,
    severity: Severity.CRITICAL,
    category: Category.DESTRUCTIVE,
    weight: 100,
    description: 'dd 写入磁盘设备',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '检查命令参数，避免写入系统磁盘设备',
    cweId: 'CWE-78'
  },
  {
    id: 'MKFS_FORMAT',
    name: '格式化磁盘',
    pattern: /mkfs(\.[a-z0-9]+)?\s+\/dev\//,
    severity: Severity.CRITICAL,
    category: Category.DESTRUCTIVE,
    weight: 100,
    description: 'mkfs 格式化命令',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '检查命令参数，避免格式化系统磁盘',
    cweId: 'CWE-78'
  },

  // ===== B. 远程执行 =====
  {
    id: 'CURL_PIPE_SH',
    name: 'Curl管道执行',
    pattern: /curl\s+[^|]*\|\s*(ba)?sh/,
    severity: Severity.CRITICAL,
    category: Category.REMOTE_EXEC,
    weight: 90,
    description: 'curl | sh 远程执行',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '避免直接执行远程脚本，应先下载后检查',
    cweId: 'CWE-78'
  },
  {
    id: 'WGET_PIPE_SH',
    name: 'Wget管道执行',
    pattern: /wget\s+[^|]*\|\s*(ba)?sh/,
    severity: Severity.CRITICAL,
    category: Category.REMOTE_EXEC,
    weight: 90,
    description: 'wget | sh 远程执行',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '避免直接执行远程脚本，应先下载后检查',
    cweId: 'CWE-78'
  },
  {
    id: 'BASE64_EXEC',
    name: 'Base64解码执行',
    pattern: /base64\s+(-d|--decode)[^|]*\|\s*(ba)?sh/,
    severity: Severity.CRITICAL,
    category: Category.REMOTE_EXEC,
    weight: 85,
    description: 'base64 解码后执行',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '避免执行Base64编码的命令，可能隐藏恶意代码',
    cweId: 'CWE-506'
  },
  {
    id: 'REVERSE_SHELL',
    name: '反弹Shell',
    pattern: /(socket\.socket|s\.connect|os\.dup2|subprocess\.call.*bin\/(ba)?sh)/,
    severity: Severity.CRITICAL,
    category: Category.REMOTE_EXEC,
    weight: 95,
    description: '反弹Shell后门',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '检查网络连接和进程调用，避免反弹Shell后门',
    cweId: 'CWE-506'
  },

  // ===== C. 命令注入 =====
  {
    id: 'PY_EVAL',
    name: 'Python eval',
    pattern: /\beval\s*\(/,
    severity: Severity.HIGH,
    category: Category.CMD_INJECTION,
    weight: 70,
    description: 'eval() 动态执行',
    hardTrigger: false,
    confidence: Confidence.MEDIUM,
    remediation: '避免使用eval()动态执行代码，使用安全的替代方法',
    cweId: 'CWE-94'
  },
  {
    id: 'PY_EXEC',
    name: 'Python exec',
    pattern: /\bexec\s*\(/,
    severity: Severity.HIGH,
    category: Category.CMD_INJECTION,
    weight: 70,
    description: 'exec() 动态执行',
    hardTrigger: false,
    confidence: Confidence.MEDIUM,
    remediation: '避免使用exec()动态执行代码，使用安全的替代方法',
    cweId: 'CWE-94'
  },
  {
    id: 'OS_SYSTEM',
    name: 'os.system',
    pattern: /os\.system\s*\(/,
    severity: Severity.HIGH,
    category: Category.CMD_INJECTION,
    weight: 65,
    description: 'os.system() Shell执行',
    hardTrigger: false,
    confidence: Confidence.MEDIUM,
    remediation: '避免使用os.system()，改用subprocess.run()并设置shell=False',
    cweId: 'CWE-78'
  },
  {
    id: 'SUBPROCESS_SHELL',
    name: 'subprocess shell=True',
    pattern: /subprocess\.(run|call|Popen)\s*\([^)]*shell\s*=\s*True/,
    severity: Severity.HIGH,
    category: Category.CMD_INJECTION,
    weight: 65,
    description: 'subprocess shell=True',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '避免设置shell=True，使用列表参数传递命令',
    cweId: 'CWE-78'
  },
  {
    id: 'SUBPROCESS_CALL',
    name: 'subprocess 调用',
    pattern: /subprocess\.(run|call|Popen)\s*\(/,
    severity: Severity.MEDIUM,
    category: Category.CMD_INJECTION,
    weight: 25,
    description: 'subprocess 进程调用',
    hardTrigger: false,
    confidence: Confidence.LOW,
    remediation: '确保命令参数经过验证，避免注入风险',
    cweId: 'CWE-78'
  },

  // ===== D. 网络外传 =====
  {
    id: 'CURL_POST',
    name: 'Curl POST',
    pattern: /curl\s+[^;|]*-X\s*POST/,
    severity: Severity.MEDIUM,
    category: Category.NETWORK,
    weight: 40,
    description: 'curl POST 请求',
    hardTrigger: false,
    confidence: Confidence.MEDIUM,
    remediation: '确认网络请求目标，避免泄露敏感数据',
    cweId: 'CWE-319'
  },
  {
    id: 'NETCAT',
    name: 'Netcat连接',
    pattern: /\bnc\s+(-[a-z]*\s+)*[a-zA-Z0-9.-]+\s+\d+/,
    severity: Severity.HIGH,
    category: Category.NETWORK,
    weight: 60,
    description: 'netcat 网络连接',
    hardTrigger: false,
    confidence: Confidence.MEDIUM,
    remediation: '检查netcat使用场景，避免未授权的网络连接',
    cweId: 'CWE-319'
  },
  {
    id: 'PY_URLLIB',
    name: 'Python urllib',
    pattern: /urllib\.request\.urlopen\s*\(/,
    severity: Severity.MEDIUM,
    category: Category.NETWORK,
    weight: 35,
    description: 'urllib 网络请求',
    hardTrigger: false,
    confidence: Confidence.LOW,
    remediation: '确认请求目标URL的安全性，使用HTTPS协议',
    cweId: null
  },
  {
    id: 'HTTP_REQUEST',
    name: 'HTTP 请求库',
    pattern: /requests\.(get|post|put|delete|patch)\s*\(/,
    severity: Severity.LOW,
    category: Category.NETWORK,
    weight: 15,
    description: 'Python requests HTTP 请求',
    hardTrigger: false,
    confidence: Confidence.LOW,
    remediation: '确认请求目标URL的安全性，使用HTTPS协议',
    cweId: null
  },

  // ===== E. 权限提升 =====
  {
    id: 'SUDO',
    name: 'sudo提权',
    pattern: /\bsudo\s+/,
    severity: Severity.HIGH,
    category: Category.PRIVILEGE,
    weight: 60,
    description: 'sudo 权限提升',
    hardTrigger: false,
    confidence: Confidence.LOW,
    remediation: '审查sudo使用场景，确保符合最小权限原则',
    cweId: 'CWE-250'
  },
  {
    id: 'CHMOD_777',
    name: 'chmod 777',
    pattern: /chmod\s+(-[a-zA-Z]*\s+)*7[0-7]{2}/,
    severity: Severity.HIGH,
    category: Category.PRIVILEGE,
    weight: 55,
    description: 'chmod 777 开放权限',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '避免设置777权限，使用最小权限原则',
    cweId: 'CWE-732'
  },
  {
    id: 'SUDOERS',
    name: 'sudoers修改',
    pattern: /(\/etc\/sudoers|visudo|NOPASSWD)/,
    severity: Severity.CRITICAL,
    category: Category.PRIVILEGE,
    weight: 95,
    description: 'sudoers 文件修改',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '检查sudoers修改，避免不当的权限配置',
    cweId: 'CWE-250'
  },

  // ===== F. 持久化 =====
  {
    id: 'CRONTAB',
    name: 'Crontab持久化',
    pattern: /(crontab\s+-|\/etc\/cron)/,
    severity: Severity.HIGH,
    category: Category.PERSISTENCE,
    weight: 65,
    description: 'crontab 持久化',
    hardTrigger: false,
    confidence: Confidence.MEDIUM,
    remediation: '检查定时任务内容，避免恶意持久化机制',
    cweId: 'CWE-506'
  },
  {
    id: 'SSH_KEYS',
    name: 'SSH密钥注入',
    pattern: /(>>|>)\s*~?\/?(.ssh\/authorized_keys|.ssh\/id_)/,
    severity: Severity.CRITICAL,
    category: Category.PERSISTENCE,
    weight: 90,
    description: 'SSH 密钥写入',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '检查SSH密钥写入操作，避免未授权访问',
    cweId: 'CWE-506'
  },

  // ===== G. 敏感泄露 =====
  {
    id: 'PRIVATE_KEY',
    name: '私钥硬编码',
    pattern: /-----BEGIN\s+(RSA|OPENSSH|EC|DSA)?\s*PRIVATE KEY-----/,
    severity: Severity.HIGH,
    category: Category.SECRETS,
    weight: 70,
    description: '硬编码私钥',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '使用环境变量或密钥管理服务，不要硬编码私钥',
    cweId: 'CWE-798'
  },
  {
    id: 'API_KEY',
    name: 'API Key',
    pattern: /(api[_-]?key|apikey|api_secret)\s*[=:]\s*["'][a-zA-Z0-9_-]{16,}["']/,
    severity: Severity.HIGH,
    category: Category.SECRETS,
    weight: 60,
    description: '硬编码 API Key',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '使用环境变量或密钥管理服务，不要硬编码API密钥',
    cweId: 'CWE-798'
  },
  {
    id: 'PASSWORD',
    name: '密码硬编码',
    pattern: /(password|passwd|pwd)\s*[=:]\s*["'][^"']{4,}["']/,
    severity: Severity.HIGH,
    category: Category.SECRETS,
    weight: 55,
    description: '硬编码密码',
    hardTrigger: false,
    confidence: Confidence.MEDIUM,
    remediation: '使用环境变量或配置文件，不要硬编码密码',
    cweId: 'CWE-798'
  },
  {
    id: 'AWS_KEY',
    name: 'AWS密钥',
    pattern: /(AKIA|ASIA)[A-Z0-9]{16}/,
    severity: Severity.CRITICAL,
    category: Category.SECRETS,
    weight: 80,
    description: 'AWS Access Key',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '使用AWS密钥管理服务或环境变量，不要硬编码AWS密钥',
    cweId: 'CWE-798'
  },
  {
    id: 'GITHUB_TOKEN',
    name: 'GitHub Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/,
    severity: Severity.CRITICAL,
    category: Category.SECRETS,
    weight: 80,
    description: 'GitHub Token',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '使用GitHub Secrets或环境变量，不要硬编码Token',
    cweId: 'CWE-798'
  },

  // ===== H. 敏感文件访问 =====
  {
    id: 'READ_SSH_PRIVATE_KEY',
    name: '读取SSH私钥',
    pattern: /(cat|less|head|tail|vim|nano|open)\s+.*\.ssh\/(id_rsa|id_dsa|id_ecdsa|id_ed25519)($|\s)/,
    severity: Severity.HIGH,
    category: Category.SENSITIVE_FILE_ACCESS,
    weight: 70,
    description: '读取SSH私钥文件',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '避免直接读取私钥文件，使用ssh-agent管理密钥',
    cweId: 'CWE-522'
  },
  {
    id: 'READ_AWS_CREDENTIALS',
    name: '读取AWS凭证',
    pattern: /(cat|less|head|tail|vim|nano|open)\s+.*\.aws\/credentials/,
    severity: Severity.HIGH,
    category: Category.SENSITIVE_FILE_ACCESS,
    weight: 70,
    description: '读取AWS凭证文件',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '使用AWS IAM角色或环境变量，避免读取凭证文件',
    cweId: 'CWE-522'
  },
  {
    id: 'READ_ENV_FILE',
    name: '读取.env文件',
    pattern: /(cat|less|head|tail|vim|nano|open)\s+.*\.env($|\s)/,
    severity: Severity.MEDIUM,
    category: Category.SENSITIVE_FILE_ACCESS,
    weight: 50,
    description: '读取环境变量配置文件',
    hardTrigger: false,
    confidence: Confidence.MEDIUM,
    remediation: '确保.env文件不包含敏感信息，或使用密钥管理服务',
    cweId: 'CWE-522'
  },
  {
    id: 'READ_PASSWD',
    name: '读取passwd文件',
    pattern: /(cat|less|head|tail)\s+\/etc\/passwd/,
    severity: Severity.MEDIUM,
    category: Category.SENSITIVE_FILE_ACCESS,
    weight: 45,
    description: '读取系统用户信息',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '确认是否需要读取用户信息，避免信息泄露',
    cweId: 'CWE-200'
  },
  {
    id: 'READ_SHADOW',
    name: '读取shadow文件',
    pattern: /(cat|less|head|tail)\s+\/etc\/shadow/,
    severity: Severity.CRITICAL,
    category: Category.SENSITIVE_FILE_ACCESS,
    weight: 85,
    description: '读取系统密码哈希文件',
    hardTrigger: true,
    confidence: Confidence.HIGH,
    remediation: '绝不应读取shadow文件，这是严重的安全风险',
    cweId: 'CWE-522'
  },
  {
    id: 'READ_GIT_CREDENTIALS',
    name: '读取Git凭证',
    pattern: /(cat|less|head|tail|vim|nano|open)\s+.*\.git-credentials/,
    severity: Severity.HIGH,
    category: Category.SENSITIVE_FILE_ACCESS,
    weight: 65,
    description: '读取Git凭证存储文件',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '使用SSH密钥或凭证管理器，避免明文存储Git凭证',
    cweId: 'CWE-522'
  },

  // ===== I. Node.js 命令注入 =====
  {
    id: 'NODE_CHILD_EXEC',
    name: 'Node.js child_process.exec',
    pattern: /child_process\.exec\s*\(/,
    severity: Severity.HIGH,
    category: Category.CMD_INJECTION,
    weight: 70,
    description: 'Node.js child_process.exec 执行',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '避免使用exec()，改用execFile()或spawn()并验证参数',
    cweId: 'CWE-78'
  },
  {
    id: 'NODE_VM_RUN',
    name: 'Node.js vm.runInNewContext',
    pattern: /vm\.runInNewContext\s*\(/,
    severity: Severity.HIGH,
    category: Category.CMD_INJECTION,
    weight: 65,
    description: 'Node.js 动态代码执行',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '避免动态执行未验证的代码，使用安全的替代方案',
    cweId: 'CWE-94'
  },

  // ===== J. 敏感数据泄露增强 =====
  {
    id: 'JWT_TOKEN',
    name: 'JWT Token 硬编码',
    pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,
    severity: Severity.HIGH,
    category: Category.SECRETS,
    weight: 75,
    description: '硬编码的 JWT Token',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '不要硬编码JWT Token，使用安全的存储方式',
    cweId: 'CWE-798'
  },
  {
    id: 'DB_CONNECTION_STRING',
    name: '数据库连接串',
    pattern: /(mongodb|mysql|postgresql|postgres):\/\/[^\s"']{10,}/,
    severity: Severity.HIGH,
    category: Category.SECRETS,
    weight: 70,
    description: '硬编码的数据库连接字符串',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '使用环境变量或配置文件管理数据库连接串，不要硬编码',
    cweId: 'CWE-798'
  },
  {
    id: 'SLACK_WEBHOOK',
    name: 'Slack Webhook URL',
    pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9/]{30,}/,
    severity: Severity.MEDIUM,
    category: Category.SECRETS,
    weight: 50,
    description: '硬编码的 Slack Webhook URL',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '使用环境变量存储 Webhook URL',
    cweId: 'CWE-798'
  },
  {
    id: 'GENERIC_SECRET',
    name: '通用密钥模式',
    pattern: /(secret|token|key)\s*[=:]\s*["'][a-zA-Z0-9_-]{16,}["']/,
    severity: Severity.MEDIUM,
    category: Category.SECRETS,
    weight: 45,
    description: '可能的硬编码密钥',
    hardTrigger: false,
    confidence: Confidence.LOW,
    remediation: '检查是否为敏感密钥，使用密钥管理服务',
    cweId: 'CWE-798'
  },

  // ===== K. 网络行为增强 =====
  {
    id: 'WEBSOCKET_CONNECT',
    name: 'WebSocket 连接',
    pattern: /(new\s+WebSocket|ws:\/\/|wss:\/\/)/,
    severity: Severity.LOW,
    category: Category.NETWORK,
    weight: 25,
    description: 'WebSocket 连接',
    hardTrigger: false,
    confidence: Confidence.LOW,
    remediation: '确认 WebSocket 连接的安全性，使用 wss:// 加密连接',
    cweId: null
  },
  {
    id: 'FTP_PROTOCOL',
    name: 'FTP 协议使用',
    pattern: /ftp:\/\//,
    severity: Severity.MEDIUM,
    category: Category.NETWORK,
    weight: 40,
    description: '使用不安全的 FTP 协议',
    hardTrigger: false,
    confidence: Confidence.HIGH,
    remediation: '使用 SFTP 或 FTPS 替代明文 FTP',
    cweId: 'CWE-319'
  }
];

/**
 * 获取所有硬触发规则
 */
export function getHardTriggerRules() {
  return PATTERN_RULES.filter(rule => rule.hardTrigger);
}

/**
 * 获取所有规则
 */
export function getAllRules() {
  return PATTERN_RULES;
}
