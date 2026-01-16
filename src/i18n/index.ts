import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: "Dashboard",
      mySkills: "My Skills",
      marketplace: "Marketplace",
      security: "Security",
      settings: "Settings",

      // Dashboard
      installedSkills: "Installed Skills",
      systemLevel: "System Level",
      projectLevel: "Project Level",
      securityStatus: "Security Status",
      allActiveSkills: "All active skills",
      globallyAvailable: "Globally available",
      currentProjectOnly: "Current project only",
      safe: "Safe",
      noRisksFound: "No risks found",
      skillUsageTrend: "Skill Usage Trend",
      recentActivity: "Recent Activity",

      // My Skills
      scanSkills: "Scan Skills",
      importSkill: "Import Skill",
      totalSkills: "Total Skills",
      searchSkills: "Search skills...",
      name: "Name",
      type: "Type",
      location: "Location",
      description: "Description",
      actions: "Actions",
      view: "View",
      remove: "Remove",
      system: "System",
      project: "Project",

      // Marketplace
      availableSkills: "Available Skills",
      searchMarketplace: "Search marketplace...",
      install: "Install",
      installed: "Installed",
      author: "Author",
      downloads: "Downloads",
      rating: "Rating",

      // Security
      scanAllSkills: "Scan All Skills",
      securityScore: "Security Score",
      riskLevel: "Risk Level",
      issues: "Issues",
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",

      // Settings
      generalSettings: "General Settings",
      defaultInstallLocation: "Default Install Location",
      installToSystem: "Install to System (.claude/skills)",
      installToProject: "Install to Project",
      projectPaths: "Project Paths",
      addProjectPath: "Add Project Path",
      selectDirectory: "Select Directory",
      removeProjectPath: "Remove Project Path",
      language: "Language",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      save: "Save",
      cancel: "Cancel",

      // Import Dialog
      importFromGitHub: "Import from GitHub",
      importFromLocal: "Import from Local",
      githubRepository: "GitHub Repository",
      githubPlaceholder: "username/repository",
      localPath: "Local Path",
      selectFolder: "Select Folder",
      importing: "Importing...",

      // Messages
      importSuccess: "Skill imported successfully",
      importError: "Failed to import skill",
      removeSuccess: "Skill removed successfully",
      removeError: "Failed to remove skill",
      saveSuccess: "Settings saved successfully",
      saveError: "Failed to save settings",
      scanComplete: "Scan complete",

      // Common
      loading: "Loading...",
      noData: "No data available",
      confirm: "Confirm",
      error: "Error",
      success: "Success",
      warning: "Warning",
    }
  },
  zh: {
    translation: {
      // 导航
      dashboard: "仪表盘",
      mySkills: "我的 Skills",
      marketplace: "市场",
      security: "安全",
      settings: "设置",

      // 仪表盘
      installedSkills: "已安装 Skills",
      systemLevel: "系统级",
      projectLevel: "项目级",
      securityStatus: "安全状态",
      allActiveSkills: "所有已激活的技能",
      globallyAvailable: "全局可用",
      currentProjectOnly: "当前项目专用",
      safe: "安全",
      noRisksFound: "未发现风险",
      skillUsageTrend: "Skill 调用趋势",
      recentActivity: "最近活动",

      // 我的 Skills
      scanSkills: "扫描 Skills",
      importSkill: "导入 Skill",
      totalSkills: "总计 Skills",
      searchSkills: "搜索 skills...",
      name: "名称",
      type: "类型",
      location: "位置",
      description: "描述",
      actions: "操作",
      view: "查看",
      remove: "移除",
      system: "系统",
      project: "项目",

      // 市场
      availableSkills: "可用 Skills",
      searchMarketplace: "搜索市场...",
      install: "安装",
      installed: "已安装",
      author: "作者",
      downloads: "下载量",
      rating: "评分",

      // 安全
      scanAllSkills: "扫描所有 Skills",
      securityScore: "安全评分",
      riskLevel: "风险等级",
      issues: "问题",
      low: "低",
      medium: "中",
      high: "高",
      critical: "严重",

      // 设置
      generalSettings: "通用设置",
      defaultInstallLocation: "默认安装位置",
      installToSystem: "安装到系统 (.claude/skills)",
      installToProject: "安装到项目",
      projectPaths: "项目路径",
      addProjectPath: "添加项目路径",
      selectDirectory: "选择目录",
      removeProjectPath: "移除项目路径",
      language: "语言",
      theme: "主题",
      light: "浅色",
      dark: "深色",
      save: "保存",
      cancel: "取消",

      // 导入对话框
      importFromGitHub: "从 GitHub 导入",
      importFromLocal: "从本地导入",
      githubRepository: "GitHub 仓库",
      githubPlaceholder: "用户名/仓库名",
      localPath: "本地路径",
      selectFolder: "选择文件夹",
      importing: "导入中...",

      // 消息
      importSuccess: "Skill 导入成功",
      importError: "导入 Skill 失败",
      removeSuccess: "Skill 移除成功",
      removeError: "移除 Skill 失败",
      saveSuccess: "设置保存成功",
      saveError: "保存设置失败",
      scanComplete: "扫描完成",

      // 通用
      loading: "加载中...",
      noData: "暂无数据",
      confirm: "确认",
      error: "错误",
      success: "成功",
      warning: "警告",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
