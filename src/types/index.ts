export interface MarketplaceSkill {
  id: string;
  name: string;
  author: string;
  authorAvatar: string;
  description: string;
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
  installDate: number;
  localPath: string;
  status: 'safe' | 'unsafe' | 'unknown';
  type: 'system' | 'project';
  version?: string;
}

export interface SkillManifest {
  name: string;
  description: string;
  [key: string]: any;
}
