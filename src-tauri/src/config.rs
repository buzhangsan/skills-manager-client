use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use anyhow::{Result, Context};
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub project_paths: Vec<String>,
    pub default_install_location: String, // "system" or "project"
    pub default_project_path: Option<String>,
    pub github_repo: Option<String>,
    pub updated_at: String,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            project_paths: Vec::new(),
            default_install_location: "system".to_string(),
            default_project_path: None,
            github_repo: Some("YOUR_USERNAME/skill-manager".to_string()),
            updated_at: Utc::now().to_rfc3339(),
        }
    }
}

impl Config {
    /// 获取 .skills-manager 目录路径（用户目录下）
    pub fn app_data_dir() -> Result<PathBuf> {
        let home = dirs::home_dir()
            .context("Failed to get home directory")?;
        let path = home.join(".skills-manager");
        fs::create_dir_all(&path)?;
        Ok(path)
    }

    /// 配置文件路径
    pub fn config_path() -> Result<PathBuf> {
        let mut path = Self::app_data_dir()?;
        path.push("config.json");
        Ok(path)
    }

    /// 首次启动初始化：从远程下载配置和数据
    pub async fn initialize_if_needed(download_url: &str) -> Result<()> {
        let app_dir = Self::app_data_dir()?;
        let config_path = Self::config_path()?;

        // 如果配置文件已存在，跳过初始化
        if config_path.exists() {
            println!("Config already exists, skipping initialization");
            return Ok(());
        }

        println!("First run detected, initializing from {}", download_url);

        // 下载配置包（可以是 zip 或单个 json）
        let client = reqwest::Client::new();
        let response = client.get(download_url)
            .send()
            .await
            .context("Failed to download initialization data")?;

        if !response.status().is_success() {
            anyhow::bail!("Download failed with status: {}", response.status());
        }

        let content = response.bytes().await?;

        // 检查是否是 ZIP 文件
        if download_url.ends_with(".zip") {
            // 解压到 .skills-manager 目录
            Self::extract_zip(&content, &app_dir)?;
        } else {
            // 假设是 JSON 配置文件
            fs::write(&config_path, content)?;
        }

        println!("Initialization completed!");
        Ok(())
    }

    /// 解压 ZIP 文件到指定目录
    fn extract_zip(data: &[u8], target_dir: &PathBuf) -> Result<()> {
        use std::io::Cursor;

        let reader = Cursor::new(data);
        let mut archive = zip::ZipArchive::new(reader)
            .context("Failed to read ZIP archive")?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let outpath = target_dir.join(file.name());

            if file.name().ends_with('/') {
                fs::create_dir_all(&outpath)?;
            } else {
                if let Some(parent) = outpath.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut outfile = fs::File::create(&outpath)?;
                std::io::copy(&mut file, &mut outfile)?;
            }
        }
        Ok(())
    }

    pub fn load() -> Result<Self> {
        let path = Self::config_path()?;
        if path.exists() {
            let content = fs::read_to_string(&path)?;
            let config: Config = serde_json::from_str(&content)?;
            Ok(config)
        } else {
            Ok(Config::default())
        }
    }

    pub fn save(&self) -> Result<()> {
        let path = Self::config_path()?;
        let mut updated_config = self.clone();
        updated_config.updated_at = Utc::now().to_rfc3339();
        let content = serde_json::to_string_pretty(&updated_config)?;
        fs::write(&path, content)?;
        Ok(())
    }
}

pub fn get_system_skill_path() -> PathBuf {
    // 使用 .skills-manager/skills 而不是 .claude/skills
    let home = dirs::home_dir().expect("Failed to get home directory");
    home.join(".skills-manager").join("skills")
}

pub fn get_default_install_path() -> Result<PathBuf> {
    let config = Config::load()?;
    if config.default_install_location == "project" {
        if let Some(project_path) = config.default_project_path {
            // 项目级仍然使用 .skills-manager/skills
            let path = PathBuf::from(project_path).join(".skills-manager").join("skills");
            return Ok(path);
        }
    }
    Ok(get_system_skill_path())
}
