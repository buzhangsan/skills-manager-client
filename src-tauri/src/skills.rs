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

/// 解析 GitHub URL，提取仓库信息
/// 支持格式：
/// - https://github.com/owner/repo
/// - https://github.com/owner/repo/tree/branch/path/to/dir
fn parse_github_url(url: &str) -> Result<(String, String, String, Option<String>)> {
    let url = url.trim_end_matches(".git");
    let parts: Vec<&str> = url.split('/').collect();

    let github_idx = parts.iter().position(|&p| p == "github.com")
        .ok_or_else(|| anyhow::anyhow!("Not a GitHub URL"))?;

    if parts.len() < github_idx + 3 {
        anyhow::bail!("Invalid GitHub URL format");
    }

    let owner = parts[github_idx + 1].to_string();
    let repo = parts[github_idx + 2].to_string();

    if parts.len() > github_idx + 4 && parts[github_idx + 3] == "tree" {
        let branch = parts[github_idx + 4].to_string();
        let subpath = if parts.len() > github_idx + 5 {
            Some(parts[github_idx + 5..].join("/"))
        } else {
            None
        };
        Ok((owner, repo, branch, subpath))
    } else {
        Ok((owner, repo, "main".to_string(), None))
    }
}

pub fn clone_github_repo(repo_url: &str, target_path: &Path) -> Result<()> {
    use std::process::Command;
    use std::io::{Read, Write, Cursor};

    // 确保目标目录的父目录存在
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent)?;
    }

    // 解析 GitHub URL
    let (owner, repo, branch, subpath) = parse_github_url(repo_url)?;

    // 如果有子路径，下载 zip 并提取
    if let Some(ref path) = subpath {
        // 使用 reqwest 下载 zip (blocking 模式)
        let zip_url = format!(
            "https://github.com/{}/{}/archive/refs/heads/{}.zip",
            owner, repo, branch
        );

        eprintln!("Downloading from: {}", zip_url);

        let client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .context("Failed to create HTTP client")?;

        let response = client.get(&zip_url)
            .header("User-Agent", "Skill-Manager/1.0")
            .send()
            .context("Failed to download zip file")?;

        if !response.status().is_success() {
            anyhow::bail!("Failed to download: HTTP {}", response.status());
        }

        let bytes = response.bytes().context("Failed to read response body")?;
        eprintln!("Downloaded {} bytes", bytes.len());

        // 解压 zip 文件
        let cursor = Cursor::new(bytes.as_ref());
        let mut archive = zip::ZipArchive::new(cursor)
            .context("Failed to open zip archive")?;

        // zip 内的根目录名称通常是 repo-branch
        let root_prefix = format!("{}-{}/", repo, branch);
        let target_prefix = format!("{}{}/", root_prefix, path);

        fs::create_dir_all(target_path)?;

        let mut extracted_count = 0;
        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let file_path = file.name().to_string();

            // 检查是否在目标子目录中
            if file_path.starts_with(&target_prefix) {
                let relative_path = &file_path[target_prefix.len()..];
                if relative_path.is_empty() {
                    continue;
                }

                let out_path = target_path.join(relative_path);

                if file.is_dir() {
                    fs::create_dir_all(&out_path)?;
                } else {
                    if let Some(parent) = out_path.parent() {
                        fs::create_dir_all(parent)?;
                    }
                    let mut outfile = fs::File::create(&out_path)?;
                    std::io::copy(&mut file, &mut outfile)?;
                    extracted_count += 1;
                }
            }
        }

        if extracted_count == 0 {
            anyhow::bail!("Subdirectory not found in archive: {}", path);
        }

        eprintln!("Extracted {} files", extracted_count);
        Ok(())
    } else {
        // 普通仓库克隆 - 先尝试 git clone，失败则下载 zip
        let clone_url = format!("https://github.com/{}/{}.git", owner, repo);

        let output = Command::new("git")
            .arg("clone")
            .arg("--depth")
            .arg("1")
            .arg("--branch")
            .arg(&branch)
            .arg(&clone_url)
            .arg(target_path)
            .output();

        match output {
            Ok(out) if out.status.success() => Ok(()),
            _ => {
                // git 不可用或失败，使用 zip 下载
                eprintln!("Git clone failed, falling back to zip download");
                download_repo_as_zip(&owner, &repo, &branch, target_path)
            }
        }
    }
}

/// 下载整个仓库为 zip 并解压
fn download_repo_as_zip(owner: &str, repo: &str, branch: &str, target_path: &Path) -> Result<()> {
    use std::io::Cursor;

    let zip_url = format!(
        "https://github.com/{}/{}/archive/refs/heads/{}.zip",
        owner, repo, branch
    );

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .context("Failed to create HTTP client")?;

    let response = client.get(&zip_url)
        .header("User-Agent", "Skill-Manager/1.0")
        .send()
        .context("Failed to download zip file")?;

    if !response.status().is_success() {
        anyhow::bail!("Failed to download: HTTP {}", response.status());
    }

    let bytes = response.bytes().context("Failed to read response body")?;

    let cursor = Cursor::new(bytes.as_ref());
    let mut archive = zip::ZipArchive::new(cursor)
        .context("Failed to open zip archive")?;

    // zip 内的根目录名称通常是 repo-branch
    let root_prefix = format!("{}-{}/", repo, branch);

    fs::create_dir_all(target_path)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let file_path = file.name().to_string();

        if file_path.starts_with(&root_prefix) {
            let relative_path = &file_path[root_prefix.len()..];
            if relative_path.is_empty() {
                continue;
            }

            let out_path = target_path.join(relative_path);

            if file.is_dir() {
                fs::create_dir_all(&out_path)?;
            } else {
                if let Some(parent) = out_path.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut outfile = fs::File::create(&out_path)?;
                std::io::copy(&mut file, &mut outfile)?;
            }
        }
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
