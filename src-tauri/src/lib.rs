use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use walkdir::WalkDir;

mod security;
use security::SecurityReport;

// 主目录配置
const PRIMARY_SKILLS_DIR: &str = ".claude/skills";

// 代理配置 - 基于 skill-dir.md 标准
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub id: String,
    pub name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    #[serde(rename = "skillsDir")]
    pub skills_dir: String,
    #[serde(rename = "globalSkillsDir")]
    pub global_skills_dir: String,
    pub compatibility: String,  // "native" | "symlink"
    pub color: String,
}

// 软链接状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymlinkStatus {
    #[serde(rename = "agentId")]
    pub agent_id: String,
    #[serde(rename = "agentName")]
    pub agent_name: String,
    #[serde(rename = "targetPath")]
    pub target_path: String,
    #[serde(rename = "linkPath")]
    pub link_path: String,
    pub exists: bool,
    #[serde(rename = "isValid")]
    pub is_valid: bool,
    pub error: Option<String>,
}

fn get_agent_configs() -> Vec<AgentConfig> {
    vec![
        // ==================== 原生兼容代理 ====================
        AgentConfig {
            id: "claude-code".to_string(),
            name: "claude-code".to_string(),
            display_name: "Claude Code".to_string(),
            skills_dir: ".claude/skills".to_string(),
            global_skills_dir: ".claude/skills".to_string(),
            compatibility: "native".to_string(),
            color: "#D97757".to_string(),
        },
        AgentConfig {
            id: "github-copilot".to_string(),
            name: "github-copilot".to_string(),
            display_name: "GitHub Copilot".to_string(),
            skills_dir: ".github/skills".to_string(),
            global_skills_dir: ".copilot/skills".to_string(),
            compatibility: "native".to_string(),
            color: "#000000".to_string(),
        },
        AgentConfig {
            id: "cursor".to_string(),
            name: "cursor".to_string(),
            display_name: "Cursor".to_string(),
            skills_dir: ".cursor/skills".to_string(),
            global_skills_dir: ".cursor/skills".to_string(),
            compatibility: "native".to_string(),
            color: "#00D4FF".to_string(),
        },
        AgentConfig {
            id: "opencode".to_string(),
            name: "opencode".to_string(),
            display_name: "OpenCode".to_string(),
            skills_dir: ".opencode/skill".to_string(),
            global_skills_dir: ".config/opencode/skill".to_string(),
            compatibility: "native".to_string(),
            color: "#6366F1".to_string(),
        },
        AgentConfig {
            id: "antigravity".to_string(),
            name: "antigravity".to_string(),
            display_name: "Antigravity".to_string(),
            skills_dir: ".agent/skills".to_string(),
            global_skills_dir: ".gemini/antigravity/skills".to_string(),
            compatibility: "native".to_string(),
            color: "#4285F4".to_string(),
        },
        AgentConfig {
            id: "amp".to_string(),
            name: "amp".to_string(),
            display_name: "Amp".to_string(),
            skills_dir: ".amp/skills".to_string(),
            global_skills_dir: ".amp/skills".to_string(),
            compatibility: "native".to_string(),
            color: "#FF6B6B".to_string(),
        },
        // ==================== 需要软链接的代理 ====================
        AgentConfig {
            id: "codex".to_string(),
            name: "codex".to_string(),
            display_name: "OpenAI Codex".to_string(),
            skills_dir: ".codex/skills".to_string(),
            global_skills_dir: ".codex/skills".to_string(),
            compatibility: "symlink".to_string(),
            color: "#10A37F".to_string(),
        },
        AgentConfig {
            id: "gemini-cli".to_string(),
            name: "gemini-cli".to_string(),
            display_name: "Gemini CLI".to_string(),
            skills_dir: ".gemini/skills".to_string(),
            global_skills_dir: ".gemini/skills".to_string(),
            compatibility: "symlink".to_string(),
            color: "#8E44AD".to_string(),
        },
        AgentConfig {
            id: "windsurf".to_string(),
            name: "windsurf".to_string(),
            display_name: "Windsurf".to_string(),
            skills_dir: ".windsurf/skills".to_string(),
            global_skills_dir: ".codeium/windsurf/skills".to_string(),
            compatibility: "symlink".to_string(),
            color: "#22C55E".to_string(),
        },
        AgentConfig {
            id: "roo".to_string(),
            name: "roo".to_string(),
            display_name: "Roo".to_string(),
            skills_dir: ".roo/skills".to_string(),
            global_skills_dir: ".roo/skills".to_string(),
            compatibility: "symlink".to_string(),
            color: "#F59E0B".to_string(),
        },
        AgentConfig {
            id: "trae".to_string(),
            name: "trae".to_string(),
            display_name: "Trae".to_string(),
            skills_dir: ".trae/skills".to_string(),
            global_skills_dir: ".trae/skills".to_string(),
            compatibility: "symlink".to_string(),
            color: "#EC4899".to_string(),
        },
    ]
}

fn get_symlink_agents() -> Vec<AgentConfig> {
    get_agent_configs()
        .into_iter()
        .filter(|a| a.compatibility == "symlink")
        .collect()
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillInfo {
    pub name: String,
    pub description: String,
    #[serde(rename = "descriptionZh")]
    pub description_zh: Option<String>,
    #[serde(rename = "descriptionEn")]
    pub description_en: Option<String>,
    pub path: String,
    #[serde(rename = "skillType")]
    pub skill_type: String,
    // 新增元数据字段
    pub version: Option<String>,
    pub author: Option<String>,
    pub source: Option<String>,  // "marketplace" | "github" | "local"
    #[serde(rename = "sourceUrl")]
    pub source_url: Option<String>,
    #[serde(rename = "installDate")]
    pub install_date: Option<u64>,
    #[serde(rename = "commitHash")]
    pub commit_hash: Option<String>,
}

// Skill 元数据 - 存储在每个 skill 目录的 .skill-meta.json
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SkillMetadata {
    pub source: String,  // "marketplace" | "github" | "local"
    #[serde(rename = "sourceUrl")]
    pub source_url: Option<String>,
    #[serde(rename = "installDate")]
    pub install_date: u64,
    #[serde(rename = "commitHash")]
    pub commit_hash: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "descriptionZh")]
    pub description_zh: Option<String>,
    #[serde(rename = "descriptionEn")]
    pub description_en: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ScanResult {
    #[serde(rename = "systemSkills")]
    pub system_skills: Vec<SkillInfo>,
    #[serde(rename = "projectSkills")]
    pub project_skills: Vec<SkillInfo>,
}

#[derive(Debug, Deserialize)]
pub struct ImportGithubRequest {
    #[serde(rename = "repoUrl")]
    pub repo_url: String,
    #[serde(rename = "installPath")]
    pub install_path: Option<String>,
    #[serde(rename = "skipSecurityCheck")]
    pub skip_security_check: bool,
    // 市场元数据（从市场安装时传入）
    #[serde(rename = "isMarketplace")]
    pub is_marketplace: Option<bool>,
    pub description: Option<String>,
    #[serde(rename = "descriptionZh")]
    pub description_zh: Option<String>,
    #[serde(rename = "descriptionEn")]
    pub description_en: Option<String>,
    pub author: Option<String>,
    pub version: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub success: bool,
    pub message: String,
    pub blocked: bool,
}

#[derive(Debug, Deserialize)]
pub struct UninstallRequest {
    #[serde(rename = "skillPath")]
    pub skill_path: String,
}

#[derive(Debug, Deserialize)]
pub struct ImportLocalRequest {
    #[serde(rename = "sourcePath")]
    pub source_path: String,
    #[serde(rename = "installPath")]
    pub install_path: Option<String>,
    #[serde(rename = "skillName")]
    pub skill_name: String,
}

#[derive(Debug, Deserialize)]
pub struct SavePathsRequest {
    pub paths: Vec<String>,
}

fn get_claude_skills_dir() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(PRIMARY_SKILLS_DIR))
}

fn get_config_path() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".claude").join("skill-manager-config.json"))
}

// 从 SKILL.md 中提取版本号
fn extract_version_from_md(content: &str) -> Option<String> {
    // 尝试匹配常见的版本格式
    // 例如: "Version: 1.0.0", "v1.0.0", "**Version**: 1.0.0"
    for line in content.lines() {
        let line_lower = line.to_lowercase();
        if line_lower.contains("version") {
            // 提取版本号
            if let Some(version) = extract_version_number(line) {
                return Some(version);
            }
        }
    }
    None
}

fn extract_version_number(text: &str) -> Option<String> {
    // 匹配 v1.0.0 或 1.0.0 格式
    let re_patterns = [
        r"v?(\d+\.\d+\.\d+)",
        r"v?(\d+\.\d+)",
    ];
    for pattern in re_patterns {
        if let Ok(re) = regex::Regex::new(pattern) {
            if let Some(caps) = re.captures(text) {
                if let Some(m) = caps.get(1) {
                    return Some(m.as_str().to_string());
                }
            }
        }
    }
    None
}

// 从 SKILL.md 中提取作者
fn extract_author_from_md(content: &str) -> Option<String> {
    for line in content.lines() {
        let line_lower = line.to_lowercase();
        if line_lower.contains("author") {
            // 提取 : 或 **: 后面的内容
            if let Some(pos) = line.find(':') {
                let author = line[pos + 1..].trim();
                let author = author.trim_matches(|c| c == '*' || c == '`');
                if !author.is_empty() {
                    return Some(author.to_string());
                }
            }
        }
    }
    None
}

// 加载 skill 元数据
fn load_skill_metadata(skill_dir: &PathBuf) -> Option<SkillMetadata> {
    let meta_path = skill_dir.join(".skill-meta.json");
    if meta_path.exists() {
        if let Ok(content) = fs::read_to_string(&meta_path) {
            return serde_json::from_str(&content).ok();
        }
    }
    None
}

// 保存 skill 元数据
fn save_skill_metadata(skill_dir: &PathBuf, metadata: &SkillMetadata) -> Result<(), String> {
    let meta_path = skill_dir.join(".skill-meta.json");
    let content = serde_json::to_string_pretty(metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    fs::write(&meta_path, content)
        .map_err(|e| format!("Failed to write metadata: {}", e))?;
    Ok(())
}

// 获取当前时间戳
fn current_timestamp() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

// 解析 YAML frontmatter，返回 (description, name, version)
fn parse_yaml_frontmatter(content: &str) -> (Option<String>, Option<String>, Option<String>) {
    let lines: Vec<&str> = content.lines().collect();

    // 检查是否以 --- 开头
    if lines.is_empty() || lines[0].trim() != "---" {
        return (None, None, None);
    }

    // 找到结束的 ---
    let mut end_index = None;
    for (i, line) in lines.iter().enumerate().skip(1) {
        if line.trim() == "---" {
            end_index = Some(i);
            break;
        }
    }

    let end_index = match end_index {
        Some(i) => i,
        None => return (None, None, None),
    };

    // 解析 frontmatter 中的字段
    let mut description = None;
    let mut name = None;
    let mut version = None;

    for line in &lines[1..end_index] {
        let line = line.trim();

        // 解析 description 字段
        if line.starts_with("description:") {
            let value = line.trim_start_matches("description:").trim();
            // 移除引号
            let value = value.trim_matches('"').trim_matches('\'');
            if !value.is_empty() {
                description = Some(value.to_string());
            }
        }

        // 解析 name 字段
        if line.starts_with("name:") {
            let value = line.trim_start_matches("name:").trim();
            let value = value.trim_matches('"').trim_matches('\'');
            if !value.is_empty() {
                name = Some(value.to_string());
            }
        }

        // 解析 version 字段
        if line.starts_with("version:") {
            let value = line.trim_start_matches("version:").trim();
            let value = value.trim_matches('"').trim_matches('\'');
            if !value.is_empty() {
                version = Some(value.to_string());
            }
        }
    }

    (description, name, version)
}

fn parse_skill_md(path: &PathBuf, skill_type: &str) -> Option<SkillInfo> {
    let content = fs::read_to_string(path).ok()?;
    let skill_dir = path.parent()?;
    let name = skill_dir.file_name()?.to_string_lossy().to_string();

    // 尝试解析 YAML frontmatter
    let (frontmatter_desc, frontmatter_name, frontmatter_version) = parse_yaml_frontmatter(&content);

    // 如果没有 frontmatter，使用旧方法提取描述
    let description = frontmatter_desc.unwrap_or_else(|| {
        content
            .lines()
            .skip_while(|l| l.starts_with('#') || l.starts_with("---") || l.trim().is_empty())
            .take_while(|l| !l.trim().is_empty() && !l.starts_with('#'))
            .collect::<Vec<_>>()
            .join(" ")
            .chars()
            .take(500)
            .collect::<String>()
    });

    // 使用 frontmatter 中的 name，如果没有则使用目录名
    let skill_name = frontmatter_name.unwrap_or(name);

    // 从 SKILL.md 提取版本和作者
    let version_from_md = frontmatter_version.or_else(|| extract_version_from_md(&content));
    let author_from_md = extract_author_from_md(&content);

    // 尝试加载元数据
    let metadata = load_skill_metadata(&skill_dir.to_path_buf());

    // 优先使用元数据中的描述（从市场安装时保存的中英文描述）
    let (desc_zh, desc_en) = if let Some(ref m) = metadata {
        (m.description_zh.clone(), m.description_en.clone())
    } else {
        (None, None)
    };

    Some(SkillInfo {
        name: skill_name,
        description: description.clone(),
        description_zh: desc_zh.or_else(|| Some(description.clone())),
        description_en: desc_en.or_else(|| Some(description)),
        path: skill_dir.to_string_lossy().to_string(),
        skill_type: skill_type.to_string(),
        version: version_from_md.or_else(|| metadata.as_ref().and_then(|m| m.version.clone())),
        author: author_from_md.or_else(|| metadata.as_ref().and_then(|m| m.author.clone())),
        source: metadata.as_ref().map(|m| m.source.clone()),
        source_url: metadata.as_ref().and_then(|m| m.source_url.clone()),
        install_date: metadata.as_ref().map(|m| m.install_date),
        commit_hash: metadata.as_ref().and_then(|m| m.commit_hash.clone()),
    })
}

#[tauri::command]
fn scan_skills() -> Result<ScanResult, String> {
    let mut system_skills = Vec::new();
    let mut project_skills = Vec::new();

    if let Some(skills_dir) = get_claude_skills_dir() {
        if skills_dir.exists() {
            for entry in WalkDir::new(&skills_dir).max_depth(3) {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.file_name().map(|n| n == "SKILL.md").unwrap_or(false) {
                        if let Some(skill) = parse_skill_md(&path.to_path_buf(), "system") {
                            system_skills.push(skill);
                        }
                    }
                }
            }
        }
    }

    if let Ok(paths) = get_project_paths() {
        for project_path in paths {
            let skills_dir = PathBuf::from(&project_path).join(".claude").join("skills");
            if skills_dir.exists() {
                for entry in WalkDir::new(&skills_dir).max_depth(3) {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        if path.file_name().map(|n| n == "SKILL.md").unwrap_or(false) {
                            if let Some(skill) = parse_skill_md(&path.to_path_buf(), "project") {
                                project_skills.push(skill);
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(ScanResult {
        system_skills,
        project_skills,
    })
}

#[tauri::command(async)]
async fn import_github_skill(request: ImportGithubRequest) -> Result<ImportResult, String> {
    let repo_url = request.repo_url.clone();

    let result = tokio::task::spawn_blocking(move || {
        let parts: Vec<&str> = repo_url
            .trim_end_matches('/')
            .split('/')
            .collect();

        if parts.len() < 5 {
            return ImportResult {
                success: false,
                message: "Invalid GitHub URL".to_string(),
                blocked: false,
            };
        }

        // 始终安装到 Claude Code 主目录
        let install_dir = if let Some(path) = &request.install_path {
            PathBuf::from(path).join(".claude").join("skills")
        } else {
            match get_claude_skills_dir() {
                Some(dir) => dir,
                None => return ImportResult {
                    success: false,
                    message: "Cannot determine skills directory".to_string(),
                    blocked: false,
                },
            }
        };

        if let Err(e) = fs::create_dir_all(&install_dir) {
            return ImportResult {
                success: false,
                message: format!("Failed to create directory: {}", e),
                blocked: false,
            };
        }

        let skill_name = if repo_url.contains("/tree/") {
            parts.last().unwrap_or(&"skill").to_string()
        } else {
            parts.get(4).unwrap_or(&"skill").to_string()
        };

        let target_dir = install_dir.join(&skill_name);

        if repo_url.contains("/tree/") {
            let repo_base = format!("https://github.com/{}/{}", parts[3], parts[4]);
            let branch = parts.get(6).unwrap_or(&"main");
            let subpath = parts[7..].join("/");

            let temp_dir = install_dir.join(".temp_clone");
            let _ = fs::remove_dir_all(&temp_dir);

            let output = Command::new("git")
                .args(["clone", "--depth", "1", "--filter=blob:none", "--sparse", &repo_base, temp_dir.to_str().unwrap()])
                .output();

            match output {
                Err(e) => return ImportResult {
                    success: false,
                    message: format!("Git command failed: {}", e),
                    blocked: false,
                },
                Ok(o) if !o.status.success() => return ImportResult {
                    success: false,
                    message: format!("Git clone failed: {}", String::from_utf8_lossy(&o.stderr)),
                    blocked: false,
                },
                _ => {}
            }

            let _ = Command::new("git")
                .current_dir(&temp_dir)
                .args(["sparse-checkout", "set", &subpath])
                .output();

            let _ = Command::new("git")
                .current_dir(&temp_dir)
                .args(["checkout", branch])
                .output();

            let source = temp_dir.join(&subpath);
            if source.exists() {
                let _ = fs::remove_dir_all(&target_dir);
                if let Err(e) = fs::rename(&source, &target_dir) {
                    let _ = fs::remove_dir_all(&temp_dir);
                    return ImportResult {
                        success: false,
                        message: format!("Failed to move skill: {}", e),
                        blocked: false,
                    };
                }

                // 保存元数据 (sparse checkout)
                let metadata = SkillMetadata {
                    source: "github".to_string(),
                    source_url: Some(repo_url.clone()),
                    install_date: current_timestamp(),
                    commit_hash: None,  // sparse checkout 不保留 git 信息
                    version: None,
                    author: None,
                    description: None,
                    description_zh: None,
                    description_en: None,
                };
                let _ = save_skill_metadata(&target_dir, &metadata);
            }

            let _ = fs::remove_dir_all(&temp_dir);
        } else {
            let _ = fs::remove_dir_all(&target_dir);

            let output = Command::new("git")
                .args(["clone", "--depth", "1", &repo_url, target_dir.to_str().unwrap()])
                .output();

            match output {
                Err(e) => return ImportResult {
                    success: false,
                    message: format!("Git command failed: {}", e),
                    blocked: false,
                },
                Ok(o) if !o.status.success() => return ImportResult {
                    success: false,
                    message: format!("Git clone failed: {}", String::from_utf8_lossy(&o.stderr)),
                    blocked: false,
                },
                _ => {}
            }
        }

        // 获取 commit hash
        let commit_hash = Command::new("git")
            .current_dir(&target_dir)
            .args(["rev-parse", "HEAD"])
            .output()
            .ok()
            .and_then(|o| {
                if o.status.success() {
                    Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
                } else {
                    None
                }
            });

        // 保存元数据
        let metadata = SkillMetadata {
            source: "github".to_string(),
            source_url: Some(repo_url.clone()),
            install_date: current_timestamp(),
            commit_hash,
            version: None,  // 会从 SKILL.md 中提取
            author: None,   // 会从 SKILL.md 中提取
            description: None,
            description_zh: None,
            description_en: None,
        };
        let _ = save_skill_metadata(&target_dir, &metadata);

        ImportResult {
            success: true,
            message: format!("Successfully installed {} to {}", skill_name, target_dir.display()),
            blocked: false,
        }
    }).await.map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
fn uninstall_skill(request: UninstallRequest) -> Result<ImportResult, String> {
    let skill_path = &request.skill_path;

    if skill_path.is_empty() {
        return Ok(ImportResult {
            success: false,
            message: "Skill path is empty".to_string(),
            blocked: false,
        });
    }

    let path = PathBuf::from(skill_path);

    if !path.exists() {
        return Ok(ImportResult {
            success: false,
            message: format!("Skill path does not exist: {}", skill_path),
            blocked: false,
        });
    }

    let path_str = path.to_string_lossy().to_string();
    if !path_str.contains(".claude") || !path_str.contains("skills") {
        return Ok(ImportResult {
            success: false,
            message: "Invalid skill path - must be in .claude/skills directory".to_string(),
            blocked: false,
        });
    }

    match fs::remove_dir_all(&path) {
        Ok(_) => Ok(ImportResult {
            success: true,
            message: "Skill uninstalled successfully".to_string(),
            blocked: false,
        }),
        Err(e) => Ok(ImportResult {
            success: false,
            message: format!("Failed to remove skill: {}", e),
            blocked: false,
        }),
    }
}

#[tauri::command]
fn import_local_skill(request: ImportLocalRequest) -> Result<ImportResult, String> {
    let source = PathBuf::from(&request.source_path);

    if !source.exists() {
        return Ok(ImportResult {
            success: false,
            message: "Source path does not exist".to_string(),
            blocked: false,
        });
    }

    let install_dir = if let Some(path) = &request.install_path {
        PathBuf::from(path).join(".claude").join("skills")
    } else {
        get_claude_skills_dir().ok_or("Cannot determine skills directory")?
    };

    fs::create_dir_all(&install_dir).map_err(|e| e.to_string())?;

    let target_dir = install_dir.join(&request.skill_name);

    copy_dir_all(&source, &target_dir).map_err(|e| e.to_string())?;

    // 保存本地导入的元数据
    let metadata = SkillMetadata {
        source: "local".to_string(),
        source_url: None,
        install_date: current_timestamp(),
        commit_hash: None,
        version: None,
        author: None,
        description: None,
        description_zh: None,
        description_en: None,
    };
    let _ = save_skill_metadata(&target_dir, &metadata);

    Ok(ImportResult {
        success: true,
        message: format!("Successfully imported {} to {}", request.skill_name, target_dir.display()),
        blocked: false,
    })
}

fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[tauri::command]
fn get_project_paths() -> Result<Vec<String>, String> {
    let config_path = get_config_path().ok_or("Cannot determine config path")?;

    if !config_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let config: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    let paths = config
        .get("projectPaths")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();

    Ok(paths)
}

#[tauri::command]
fn save_project_paths(request: SavePathsRequest) -> Result<(), String> {
    let config_path = get_config_path().ok_or("Cannot determine config path")?;

    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let mut config: serde_json::Value = if config_path.exists() {
        let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    config["projectPaths"] = serde_json::json!(request.paths);

    fs::write(&config_path, serde_json::to_string_pretty(&config).unwrap())
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/c", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn read_skill(skill_path: String) -> Result<String, String> {
    let path = PathBuf::from(&skill_path);
    let skill_md = path.join("SKILL.md");

    if skill_md.exists() {
        fs::read_to_string(&skill_md).map_err(|e| e.to_string())
    } else {
        Err("SKILL.md not found".to_string())
    }
}

#[derive(Debug, Deserialize)]
pub struct SecurityScanRequest {
    #[serde(rename = "skillPath")]
    pub skill_path: String,
    #[serde(rename = "skillId")]
    pub skill_id: String,
}

#[tauri::command]
fn scan_skill_security(request: SecurityScanRequest) -> Result<SecurityReport, String> {
    let path = PathBuf::from(&request.skill_path);

    if !path.exists() {
        return Err(format!("Skill path does not exist: {}", request.skill_path));
    }

    security::scan_directory(&path, &request.skill_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn scan_all_skills_security() -> Result<Vec<SecurityReport>, String> {
    let mut reports = Vec::new();

    if let Some(skills_dir) = get_claude_skills_dir() {
        if skills_dir.exists() {
            for entry in WalkDir::new(&skills_dir).max_depth(2) {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_dir() && path.join("SKILL.md").exists() {
                        let skill_id = path.file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_else(|| "unknown".to_string());

                        if let Ok(report) = security::scan_directory(path, &skill_id) {
                            reports.push(report);
                        }
                    }
                }
            }
        }
    }

    if let Ok(paths) = get_project_paths() {
        for project_path in paths {
            let skills_dir = PathBuf::from(&project_path).join(".claude").join("skills");
            if skills_dir.exists() {
                for entry in WalkDir::new(&skills_dir).max_depth(2) {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        if path.is_dir() && path.join("SKILL.md").exists() {
                            let skill_id = path.file_name()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_else(|| "unknown".to_string());

                            if let Ok(report) = security::scan_directory(path, &skill_id) {
                                reports.push(report);
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(reports)
}

// ========== 软链接管理 ==========

#[tauri::command]
fn get_all_agents() -> Result<Vec<AgentConfig>, String> {
    Ok(get_agent_configs())
}

#[tauri::command]
fn get_symlink_agents_config() -> Result<Vec<AgentConfig>, String> {
    Ok(get_symlink_agents())
}

// 检查所有软链接状态
#[tauri::command]
fn check_symlink_status() -> Result<Vec<SymlinkStatus>, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let source_dir = home.join(PRIMARY_SKILLS_DIR);
    let agents = get_symlink_agents();
    let mut statuses = Vec::new();

    for agent in agents {
        let link_path = home.join(&agent.global_skills_dir);

        let status = if link_path.exists() {
            // 检查是否是有效的符号链接
            match fs::read_link(&link_path) {
                Ok(target) => {
                    let is_valid = target == source_dir ||
                        target.to_string_lossy().contains(".claude/skills");
                    SymlinkStatus {
                        agent_id: agent.id.clone(),
                        agent_name: agent.display_name.clone(),
                        target_path: source_dir.to_string_lossy().to_string(),
                        link_path: link_path.to_string_lossy().to_string(),
                        exists: true,
                        is_valid,
                        error: if is_valid { None } else {
                            Some(format!("Points to: {}", target.display()))
                        },
                    }
                }
                Err(_) => {
                    // 存在但不是符号链接（可能是普通目录）
                    SymlinkStatus {
                        agent_id: agent.id.clone(),
                        agent_name: agent.display_name.clone(),
                        target_path: source_dir.to_string_lossy().to_string(),
                        link_path: link_path.to_string_lossy().to_string(),
                        exists: true,
                        is_valid: false,
                        error: Some("Path exists but is not a symlink".to_string()),
                    }
                }
            }
        } else {
            SymlinkStatus {
                agent_id: agent.id.clone(),
                agent_name: agent.display_name.clone(),
                target_path: source_dir.to_string_lossy().to_string(),
                link_path: link_path.to_string_lossy().to_string(),
                exists: false,
                is_valid: false,
                error: None,
            }
        };

        statuses.push(status);
    }

    Ok(statuses)
}

// 创建单个软链接
#[tauri::command]
fn create_symlink(agent_id: String) -> Result<SymlinkStatus, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let source_dir = home.join(PRIMARY_SKILLS_DIR);

    let agents = get_symlink_agents();
    let agent = agents.iter()
        .find(|a| a.id == agent_id)
        .ok_or("Agent not found")?;

    let link_path = home.join(&agent.global_skills_dir);

    // 确保源目录存在
    if !source_dir.exists() {
        fs::create_dir_all(&source_dir).map_err(|e| e.to_string())?;
    }

    // 确保链接父目录存在
    if let Some(parent) = link_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // 如果路径已存在，检查是否是符号链接
    if link_path.exists() {
        let metadata = fs::symlink_metadata(&link_path).map_err(|e| e.to_string())?;
        if metadata.file_type().is_symlink() {
            // 已是符号链接，删除重建
            fs::remove_file(&link_path).map_err(|e| e.to_string())?;
        } else {
            return Ok(SymlinkStatus {
                agent_id: agent.id.clone(),
                agent_name: agent.display_name.clone(),
                target_path: source_dir.to_string_lossy().to_string(),
                link_path: link_path.to_string_lossy().to_string(),
                exists: true,
                is_valid: false,
                error: Some("Path exists and is not a symlink. Please remove it manually.".to_string()),
            });
        }
    }

    // 创建符号链接
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(&source_dir, &link_path)
            .map_err(|e| e.to_string())?;
    }

    #[cfg(windows)]
    {
        // Windows 需要管理员权限或开发者模式
        std::os::windows::fs::symlink_dir(&source_dir, &link_path)
            .map_err(|e| format!("Failed to create symlink (may need admin rights): {}", e))?;
    }

    Ok(SymlinkStatus {
        agent_id: agent.id.clone(),
        agent_name: agent.display_name.clone(),
        target_path: source_dir.to_string_lossy().to_string(),
        link_path: link_path.to_string_lossy().to_string(),
        exists: true,
        is_valid: true,
        error: None,
    })
}

// 创建所有软链接
#[tauri::command]
fn create_all_symlinks() -> Result<Vec<SymlinkStatus>, String> {
    let agents = get_symlink_agents();
    let mut results = Vec::new();

    for agent in agents {
        match create_symlink(agent.id.clone()) {
            Ok(status) => results.push(status),
            Err(e) => results.push(SymlinkStatus {
                agent_id: agent.id.clone(),
                agent_name: agent.display_name.clone(),
                target_path: "".to_string(),
                link_path: "".to_string(),
                exists: false,
                is_valid: false,
                error: Some(e),
            }),
        }
    }

    Ok(results)
}

// 删除软链接
#[tauri::command]
fn remove_symlink(agent_id: String) -> Result<SymlinkStatus, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;

    let agents = get_symlink_agents();
    let agent = agents.iter()
        .find(|a| a.id == agent_id)
        .ok_or("Agent not found")?;

    let link_path = home.join(&agent.global_skills_dir);

    if link_path.exists() {
        let metadata = fs::symlink_metadata(&link_path).map_err(|e| e.to_string())?;
        if metadata.file_type().is_symlink() {
            fs::remove_file(&link_path).map_err(|e| e.to_string())?;
        } else {
            return Err("Path is not a symlink, refusing to remove".to_string());
        }
    }

    Ok(SymlinkStatus {
        agent_id: agent.id.clone(),
        agent_name: agent.display_name.clone(),
        target_path: "".to_string(),
        link_path: link_path.to_string_lossy().to_string(),
        exists: false,
        is_valid: false,
        error: None,
    })
}

// 获取平台信息
#[tauri::command]
fn get_platform_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "family": std::env::consts::FAMILY,
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            scan_skills,
            import_github_skill,
            uninstall_skill,
            import_local_skill,
            get_project_paths,
            save_project_paths,
            open_url,
            read_skill,
            scan_skill_security,
            scan_all_skills_security,
            get_all_agents,
            get_symlink_agents_config,
            check_symlink_status,
            create_symlink,
            create_all_symlinks,
            remove_symlink,
            get_platform_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
