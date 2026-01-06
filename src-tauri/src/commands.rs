use crate::config::{Config, get_system_skill_path, get_default_install_path};
use crate::skills::{scan_skills_in_path, read_skill_content, clone_github_repo, remove_skill, Skill};
use crate::skills::import_local_skill as copy_local_skill;
use crate::security::{scan_directory, SecurityReport};
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use anyhow::Result;

// ===== Health Check =====

#[tauri::command]
pub fn health_check() -> Result<HealthResponse, String> {
    Ok(HealthResponse {
        status: "ok".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
    timestamp: String,
}

// ===== Skills Operations =====

#[tauri::command]
pub async fn scan_skills() -> Result<ScanSkillsResponse, String> {
    let mut all_skills = Vec::new();

    // 扫描系统级技能
    let system_path = get_system_skill_path();
    if let Ok(skills) = scan_skills_in_path(&system_path, "system") {
        all_skills.extend(skills);
    }

    // 扫描项目级技能
    if let Ok(config) = Config::load() {
        for project_path in config.project_paths {
            let path = PathBuf::from(&project_path).join(".claude").join("skills");
            if let Ok(skills) = scan_skills_in_path(&path, "project") {
                all_skills.extend(skills);
            }
        }
    }

    Ok(ScanSkillsResponse {
        system_skills: all_skills.iter()
            .filter(|s| s.skill_type == "system")
            .cloned()
            .collect(),
        project_skills: all_skills.iter()
            .filter(|s| s.skill_type == "project")
            .cloned()
            .collect(),
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanSkillsResponse {
    system_skills: Vec<Skill>,
    project_skills: Vec<Skill>,
}

#[tauri::command]
pub async fn read_skill(skill_path: String) -> Result<String, String> {
    read_skill_content(&skill_path)
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportGithubRequest {
    repo_url: String,
    install_path: Option<String>,
    skip_security_check: Option<bool>,
}

#[tauri::command]
pub async fn import_github_skill(request: ImportGithubRequest) -> Result<ImportResponse, String> {
    // 解析 GitHub URL 获取技能名称
    let skill_name = request.repo_url
        .split('/')
        .last()
        .ok_or("Invalid GitHub URL")?
        .trim_end_matches(".git");

    // 确定安装路径
    let install_base = if let Some(path) = request.install_path {
        PathBuf::from(path)
    } else {
        get_default_install_path().map_err(|e| e.to_string())?
    };

    let target_path = install_base.join(skill_name);

    // 克隆仓库
    clone_github_repo(&request.repo_url, &target_path)
        .map_err(|e| e.to_string())?;

    // 安全扫描
    let security_report = if !request.skip_security_check.unwrap_or(false) {
        let report = scan_directory(&target_path, skill_name)
            .map_err(|e| e.to_string())?;

        if report.blocked {
            // 删除被阻止的技能
            let _ = remove_skill(&target_path.to_string_lossy());
            return Ok(ImportResponse {
                success: false,
                message: "Skill blocked due to security issues".to_string(),
                skill_name: skill_name.to_string(),
                security_report: Some(report),
                blocked: true,
            });
        }
        Some(report)
    } else {
        None
    };

    Ok(ImportResponse {
        success: true,
        message: format!("Successfully imported skill: {}", skill_name),
        skill_name: skill_name.to_string(),
        security_report,
        blocked: false,
    })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportLocalRequest {
    source_path: String,
    install_path: Option<String>,
    skill_name: String,
}

#[tauri::command]
pub async fn import_local_skill(request: ImportLocalRequest) -> Result<ImportResponse, String> {
    let install_base = if let Some(path) = request.install_path {
        PathBuf::from(path)
    } else {
        get_default_install_path().map_err(|e| e.to_string())?
    };

    let target_path = install_base.join(&request.skill_name);

    copy_local_skill(&request.source_path, &target_path)
        .map_err(|e| e.to_string())?;

    Ok(ImportResponse {
        success: true,
        message: format!("Successfully imported skill: {}", request.skill_name),
        skill_name: request.skill_name,
        security_report: None,
        blocked: false,
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResponse {
    success: bool,
    message: String,
    skill_name: String,
    security_report: Option<SecurityReport>,
    blocked: bool,
}

// ===== Security Operations =====

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanSecurityRequest {
    skill_path: String,
    skill_id: String,
}

#[tauri::command]
pub async fn scan_security(request: ScanSecurityRequest) -> Result<SecurityReport, String> {
    let path = PathBuf::from(&request.skill_path);
    scan_directory(&path, &request.skill_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_all_security() -> Result<Vec<SecurityReport>, String> {
    let mut reports = Vec::new();

    // 扫描所有技能
    if let Ok(response) = scan_skills().await {
        let all_skills: Vec<_> = response.system_skills.into_iter()
            .chain(response.project_skills.into_iter())
            .collect();

        for skill in all_skills {
            if let Ok(report) = scan_directory(&PathBuf::from(&skill.path), &skill.name) {
                reports.push(report);
            }
        }
    }

    Ok(reports)
}

// ===== Config Operations =====

#[tauri::command]
pub async fn get_config() -> Result<Config, String> {
    Config::load().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_config(config: Config) -> Result<(), String> {
    config.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_project_paths() -> Result<Vec<String>, String> {
    let config = Config::load().map_err(|e| e.to_string())?;
    Ok(config.project_paths)
}

#[derive(Deserialize)]
pub struct SaveProjectPathsRequest {
    paths: Vec<String>,
}

#[tauri::command]
pub async fn save_project_paths(request: SaveProjectPathsRequest) -> Result<(), String> {
    let mut config = Config::load().map_err(|e| e.to_string())?;
    config.project_paths = request.paths;
    config.save().map_err(|e| e.to_string())
}

// ===== Update Operations =====

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResponse {
    has_update: bool,
    current_version: String,
    latest_version: String,
    download_url: Option<String>,
}

#[tauri::command]
pub async fn check_updates() -> Result<UpdateCheckResponse, String> {
    // 简化版本：暂时返回无更新
    Ok(UpdateCheckResponse {
        has_update: false,
        current_version: "1.0.0".to_string(),
        latest_version: "1.0.0".to_string(),
        download_url: None,
    })
}

#[derive(Deserialize)]
pub struct PerformUpdateRequest {
    update_type: String,
}

#[tauri::command]
pub async fn perform_update(_request: PerformUpdateRequest) -> Result<String, String> {
    Err("Update feature not implemented yet".to_string())
}
