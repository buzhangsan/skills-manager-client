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
}

export interface SkillManifest {
  name: string;
  description: string;
  descriptionZh?: string; // 中文描述（可选）
  descriptionEn?: string; // 英文描述（可选）
  [key: string]: any;
}
