use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use anyhow::{Result, Context};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Skill {
    pub name: String,
    pub location: String,
    pub description: Option<String>,
    pub path: String,
    pub skill_type: String, // "system" or "project"
}

pub fn scan_skills_in_path(base_path: &Path, skill_type: &str) -> Result<Vec<Skill>> {
    let mut skills = Vec::new();

    if !base_path.exists() {
        return Ok(skills);
    }

    // 遍历目录，寻找 SKILL.md 文件
    for entry in WalkDir::new(base_path)
        .max_depth(2)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.file_name().and_then(|n| n.to_str()) == Some("SKILL.md") {
            if let Some(parent) = path.parent() {
                let skill_name = parent
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("Unknown")
                    .to_string();

                // 读取 SKILL.md 获取描述
                let description = fs::read_to_string(path)
                    .ok()
                    .and_then(|content| {
                        content.lines()
                            .skip_while(|line| line.starts_with('#'))
                            .find(|line| !line.trim().is_empty())
                            .map(|s| s.to_string())
                    });

                skills.push(Skill {
                    name: skill_name.clone(),
                    location: skill_type.to_string(),
                    description,
                    path: parent.to_string_lossy().to_string(),
                    skill_type: skill_type.to_string(),
                });
            }
        }
    }

    Ok(skills)
}

pub fn read_skill_content(skill_path: &str) -> Result<String> {
    let path = PathBuf::from(skill_path).join("SKILL.md");
    fs::read_to_string(&path)
        .with_context(|| format!("Failed to read skill at {:?}", path))
}

pub fn import_local_skill(source_path: &str, target_path: &Path) -> Result<()> {
    let source = PathBuf::from(source_path);
    if !source.exists() {
        anyhow::bail!("Source path does not exist: {}", source_path);
    }

    // 复制整个目录
    copy_dir_recursive(&source, target_path)?;
    Ok(())
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<()> {
    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if file_type.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

pub fn clone_github_repo(repo_url: &str, target_path: &Path) -> Result<()> {
    use std::process::Command;

    // 确保目标目录的父目录存在
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent)?;
    }

    // 执行 git clone
    let output = Command::new("git")
        .arg("clone")
        .arg("--depth")
        .arg("1")
        .arg(repo_url)
        .arg(target_path)
        .output()
        .context("Failed to execute git clone")?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Git clone failed: {}", error);
    }

    Ok(())
}

pub fn remove_skill(skill_path: &str) -> Result<()> {
    let path = PathBuf::from(skill_path);
    if path.exists() {
        fs::remove_dir_all(&path)
            .with_context(|| format!("Failed to remove skill at {:?}", path))?;
    }
    Ok(())
}
