use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillInfo {
    pub name: String,
    pub description: String,
    pub path: String,
    #[serde(rename = "skillType")]
    pub skill_type: String,
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
    dirs::home_dir().map(|h| h.join(".claude").join("skills"))
}

fn get_config_path() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".claude").join("skill-manager-config.json"))
}

fn parse_skill_md(path: &PathBuf, skill_type: &str) -> Option<SkillInfo> {
    let content = fs::read_to_string(path).ok()?;
    let name = path.parent()?.file_name()?.to_string_lossy().to_string();

    let description = content
        .lines()
        .skip_while(|l| l.starts_with('#') || l.trim().is_empty())
        .take_while(|l| !l.trim().is_empty())
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(200)
        .collect::<String>();

    Some(SkillInfo {
        name,
        description,
        path: path.parent()?.to_string_lossy().to_string(),
        skill_type: skill_type.to_string(),
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

    // 验证路径不为空
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

    // 安全检查：确保路径在 .claude/skills 目录下
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

    let config = serde_json::json!({
        "projectPaths": request.paths
    });

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
            read_skill
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
