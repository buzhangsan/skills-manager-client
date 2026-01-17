export interface MarketplaceSkill {
  id: string;
  name: string;
  author: string;
  authorAvatar: string;
  description: string;
  descriptionZh?: string; // 中文描述（可选）
  descriptionEn?: string; // 英文描述（可选）
  githubUrl: string;
  stars: number;
  forks: number;
  updatedAt: number;
  hasMarketplace: boolean;
  path: string;
  branch: string;
}

export interface InstalledSkill extends Partial<MarketplaceSkill> {
  id: string;
  name: string;
  description: string;
  descriptionZh?: string; // 中文描述（可选）
  descriptionEn?: string; // 英文描述（可选）
  installDate: number;
  localPath: string;
  status: 'safe' | 'unsafe' | 'unknown';
  type: 'system' | 'project';
  version?: string;

  // 安装元数据
  source?: 'marketplace' | 'github' | 'local';  // 来源
  sourceUrl?: string;                            // 来源 URL (GitHub 地址)
  installedVersion?: string;                     // 安装时的版本
  latestVersion?: string;                        // 最新版本
  hasUpdate?: boolean;                           // 是否有更新
  lastChecked?: number;                          // 上次检查更新时间
  commitHash?: string;                           // 安装时的 commit hash
  latestCommitHash?: string;                     // 最新的 commit hash
}

export interface SkillManifest {
  name: string;
  description: string;
  descriptionZh?: string; // 中文描述（可选）
  descriptionEn?: string; // 英文描述（可选）
  version?: string;
  author?: string;
  license?: string;
  [key: string]: any;
}

// 安装结果
export interface InstallResult {
  success: boolean;
  message: string;
  blocked: boolean;
  securityReport?: SecurityReport;
  skillMetadata?: SkillMetadata;
}

// 安装时保存的元数据
export interface SkillMetadata {
  name: string;
  version: string;
  source: 'marketplace' | 'github' | 'local';
  sourceUrl?: string;
  installDate: number;
  commitHash?: string;
  author?: string;
  description?: string;
}

// 安全报告
export interface SecurityReport {
  skillId: string;
  score: number;
  level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  issues: SecurityIssue[];
  blocked: boolean;
  recommendations: string[];
  scannedFiles: string[];
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  file?: string;
  line?: number;
}
