// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod security;
mod config;
mod skills;

use commands::*;
use config::Config;

// 配置下载地址
const INIT_DATA_URL: &str = "https://github.com/buzhangsan/skills-manager-client/releases/latest/download/init-data.zip";

#[tokio::main]
async fn main() {
    // 首次启动时从远程下载配置和数据到 ~/.skills-manager/
    if let Err(e) = Config::initialize_if_needed(INIT_DATA_URL).await {
        eprintln!("Warning: Failed to initialize from remote: {}", e);
        eprintln!("Continuing with default configuration...");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Health check
            health_check,
            // Skills operations
            scan_skills,
            read_skill,
            import_github_skill,
            import_local_skill,
            // Security operations
            scan_security,
            scan_all_security,
            // Config operations
            get_config,
            save_config,
            get_project_paths,
            save_project_paths,
            // Update operations
            check_updates,
            perform_update,
            // File picker
            select_directory,
            // Open URL
            open_url,
            // Uninstall skill
            uninstall_skill,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
