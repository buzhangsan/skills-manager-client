use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use anyhow::{Result, Context};
use serde_yaml;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Skill {
    pub name: String,
    pub location: String,
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description_zh: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description_en: Option<String>,
    pub path: String,
    pub skill_type: String, // "system" or "project"
}

#[derive(Debug, Deserialize)]
struct SkillFrontmatter {
    name: Option<String>,
    description: Option<String>,
    #[serde(rename = "descriptionZh")]
    description_zh: Option<String>,
    #[serde(rename = "descriptionEn")]
    description_en: Option<String>,
}

/// 解析 SKILL.md 文件的 frontmatter
fn parse_skill_frontmatter(content: &str) -> Option<SkillFrontmatter> {
    // 检查是否有 frontmatter (以 --- 开头)
    if !content.trim_start().starts_with("---") {
        return None;
    }

    // 查找第二个 ---
    let lines: Vec<&str> = content.lines().collect();
    let mut frontmatter_end = 0;
    for (i, line) in lines.iter().enumerate().skip(1) {
        if line.trim() == "---" {
            frontmatter_end = i;
            break;
        }
    }

    if frontmatter_end == 0 {
        return None;
    }

    // 提取 frontmatter 内容 (跳过第一行的 ---)
    let frontmatter_content = lines[1..frontmatter_end].join("\n");

    // 解析 YAML
    serde_yaml::from_str::<SkillFrontmatter>(&frontmatter_content).ok()
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

                // 读取 SKILL.md 文件内容
                let content = fs::read_to_string(path).ok();

                // 尝试解析 frontmatter
                let frontmatter = content.as_ref().and_then(|c| parse_skill_frontmatter(c));

                // 优先使用 frontmatter 中的信息，否则使用文件夹名称和简单解析
                let name = frontmatter.as_ref()
                    .and_then(|f| f.name.clone())
                    .unwrap_or_else(|| skill_name.clone());

                let description = frontmatter.as_ref()
                    .and_then(|f| f.description.clone())
                    .or_else(|| {
                        // 如果没有 frontmatter，使用旧的解析方式
                        content.as_ref().and_then(|c| {
                            c.lines()
                                .skip_while(|line| line.starts_with('#') || line.trim() == "---")
                                .find(|line| !line.trim().is_empty())
                                .map(|s| s.to_string())
                        })
                    });

                let description_zh = frontmatter.as_ref().and_then(|f| f.description_zh.clone());
                let description_en = frontmatter.as_ref().and_then(|f| f.description_en.clone());

                skills.push(Skill {
                    name,
                    location: skill_type.to_string(),
                    description,
                    description_zh,
                    description_en,
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
