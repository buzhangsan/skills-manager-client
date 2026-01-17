import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InstalledSkill, MarketplaceSkill } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface AgentConfig {
  id: string;
  name: string;
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string;
  compatibility: string;
  color: string;
}

interface SymlinkStatus {
  agentId: string;
  agentName: string;
  targetPath: string;
  linkPath: string;
  exists: boolean;
  isValid: boolean;
  error?: string;
}

interface SecurityReport {
  skillId: string;
  score: number;
  level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  issues: any[];
  blocked: boolean;
  recommendations: string[];
  scannedFiles: string[];
}

interface InstallResult {
  success: boolean;
  message: string;
  blocked: boolean;
  securityReport?: SecurityReport;
}

interface SkillStore {
  installedSkills: InstalledSkill[];
  marketplaceSkills: MarketplaceSkill[];
  isLoading: boolean;
  projectPaths: string[];
  defaultInstallLocation: 'system' | 'project';
  selectedProjectIndex: number;

  // 代理配置
  agents: AgentConfig[];
  symlinkAgents: AgentConfig[];
  symlinkStatuses: SymlinkStatus[];

  // 自定义软链接
  customSymlinks: { path: string; exists: boolean }[];

  // 安全扫描状态
  isScanning: boolean;
  lastSecurityReport: SecurityReport | null;

  // 更新检查状态
  isCheckingUpdates: boolean;
  isUpdating: boolean;

  // 平台信息
  platform: { os: string; arch: string; family: string } | null;

  // Actions
  fetchMarketplaceSkills: () => Promise<void>;
  scanLocalSkills: () => Promise<void>;
  installSkill: (skill: MarketplaceSkill) => Promise<InstallResult>;
  uninstallSkill: (id: string) => void;
  updateSkill: (id: string, skill: Partial<InstalledSkill>) => void;
  importFromGithub: (url: string, installPath?: string) => Promise<InstallResult>;
  importFromLocal: (sourcePath: string, installPath?: string) => Promise<InstallResult>;
  fetchProjectPaths: () => Promise<void>;
  saveProjectPaths: (paths: string[]) => Promise<void>;
  setDefaultInstallLocation: (location: 'system' | 'project') => void;
  setSelectedProjectIndex: (index: number) => void;
  scanSkillSecurity: (skillPath: string, skillId: string) => Promise<SecurityReport>;
  clearLastSecurityReport: () => void;

  // 更新相关 Actions
  checkSkillUpdates: () => Promise<void>;
  updateSelectedSkills: (skillIds: string[]) => Promise<{ success: string[]; failed: string[] }>;
  reinstallSkill: (skillId: string) => Promise<boolean>;

  // 软链接 Actions
  fetchAgents: () => Promise<void>;
  fetchSymlinkAgents: () => Promise<void>;
  checkSymlinkStatus: () => Promise<void>;
  createSymlink: (agentId: string) => Promise<SymlinkStatus>;
  createAllSymlinks: () => Promise<SymlinkStatus[]>;
  removeSymlink: (agentId: string) => Promise<SymlinkStatus>;
  getPlatformInfo: () => Promise<void>;

  // 自定义软链接 Actions
  createCustomSymlink: (targetPath: string) => Promise<boolean>;
  removeCustomSymlink: (targetPath: string) => Promise<boolean>;
  checkCustomSymlinks: () => Promise<void>;
  addCustomSymlinkPath: (path: string) => void;
  removeCustomSymlinkPath: (path: string) => void;
}

export const useSkillStore = create<SkillStore>()(
  persist(
    (set, get) => ({
      installedSkills: [],
      marketplaceSkills: [],
      isLoading: false,
      projectPaths: [],
      defaultInstallLocation: 'system',
      selectedProjectIndex: 0,
      isScanning: false,
      lastSecurityReport: null,

      // 更新检查状态
      isCheckingUpdates: false,
      isUpdating: false,

      // 代理状态
      agents: [],
      symlinkAgents: [],
      symlinkStatuses: [],

      // 自定义软链接
      customSymlinks: [],

      // 平台信息
      platform: null,

      setDefaultInstallLocation: (location: 'system' | 'project') => {
        set({ defaultInstallLocation: location });
      },

      setSelectedProjectIndex: (index: number) => {
        set({ selectedProjectIndex: index });
      },

      clearLastSecurityReport: () => {
        set({ lastSecurityReport: null });
      },

      // 软链接 Actions
      fetchAgents: async () => {
        try {
          const agents: AgentConfig[] = await invoke('get_all_agents');
          set({ agents });
        } catch (error) {
          console.error('Failed to fetch agents:', error);
        }
      },

      fetchSymlinkAgents: async () => {
        try {
          const symlinkAgents: AgentConfig[] = await invoke('get_symlink_agents_config');
          set({ symlinkAgents });
        } catch (error) {
          console.error('Failed to fetch symlink agents:', error);
        }
      },

      checkSymlinkStatus: async () => {
        try {
          const symlinkStatuses: SymlinkStatus[] = await invoke('check_symlink_status');
          set({ symlinkStatuses });
        } catch (error) {
          console.error('Failed to check symlink status:', error);
        }
      },

      createSymlink: async (agentId: string) => {
        const status: SymlinkStatus = await invoke('create_symlink', { agentId });
        await get().checkSymlinkStatus();
        return status;
      },

      createAllSymlinks: async () => {
        const statuses: SymlinkStatus[] = await invoke('create_all_symlinks');
        set({ symlinkStatuses: statuses });
        return statuses;
      },

      removeSymlink: async (agentId: string) => {
        const status: SymlinkStatus = await invoke('remove_symlink', { agentId });
        await get().checkSymlinkStatus();
        return status;
      },

      getPlatformInfo: async () => {
        try {
          const platform: any = await invoke('get_platform_info');
          set({ platform });
        } catch (error) {
          console.error('Failed to get platform info:', error);
        }
      },

      scanSkillSecurity: async (skillPath: string, skillId: string) => {
        set({ isScanning: true });
        try {
          const report: SecurityReport = await invoke('scan_skill_security', {
            request: { skillPath, skillId }
          });
          set({ lastSecurityReport: report, isScanning: false });
          return report;
        } catch (error) {
          console.error('Security scan failed:', error);
          set({ isScanning: false });
          throw error;
        }
      },

      fetchMarketplaceSkills: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/data/marketplace.json');
          if (!response.ok) throw new Error('Failed to load marketplace data');
          const data = await response.json();
          set({ marketplaceSkills: data, isLoading: false });
        } catch (error) {
          console.error('Error loading marketplace:', error);
          set({ isLoading: false });
        }
      },

      scanLocalSkills: async () => {
        set({ isLoading: true });
        try {
          const result: any = await invoke('scan_skills');

          const mapSkill = (s: any) => ({
            id: s.path,
            name: s.name,
            description: s.description || '',
            descriptionZh: s.descriptionZh,
            descriptionEn: s.descriptionEn,
            localPath: s.path,
            status: 'safe' as const,
            type: s.skillType,
            installDate: s.installDate || Date.now(),
            version: s.version,  // 不默认，保持原始值
            author: s.author,
            stars: 0,
            // 来源元数据
            source: s.source || 'local',
            sourceUrl: s.sourceUrl,
            commitHash: s.commitHash,
            hasUpdate: false
          });

          const allSkills = [
            ...result.systemSkills.map(mapSkill),
            ...result.projectSkills.map(mapSkill)
          ];

          set({
            installedSkills: allSkills,
            isLoading: false
          });
          console.log(`Scanned ${allSkills.length} skills from local directories`);
        } catch (error) {
          console.error('Error scanning local skills:', error);
          set({
            installedSkills: [],
            isLoading: false
          });
        }
      },

      installSkill: async (skill: MarketplaceSkill) => {
        const { defaultInstallLocation, projectPaths, selectedProjectIndex } = get();

        // 确定安装路径 (始终安装到 Claude Code 目录)
        let installPath = undefined;
        if (defaultInstallLocation === 'project') {
          if (projectPaths.length > 0) {
            installPath = projectPaths[selectedProjectIndex] || projectPaths[0];
          } else {
            console.warn('No project paths configured, installing to system directory');
          }
        }

        // 直接安装到 Claude Code 目录
        const result: any = await invoke('import_github_skill', {
          request: {
            repoUrl: skill.githubUrl,
            installPath,
            skipSecurityCheck: false
          }
        });

        if (!result.success) {
          throw new Error(result.message || 'Installation failed');
        }

        // 重新扫描本地技能
        await get().scanLocalSkills();

        // 安装后立即进行安全扫描
        set({ isScanning: true });
        try {
          const skillName = skill.githubUrl.split('/').pop()?.replace('.git', '') || skill.name;
          const installedSkill = get().installedSkills.find(s =>
            s.name === skillName || s.localPath?.includes(skillName)
          );

          if (installedSkill?.localPath) {
            const securityReport = await get().scanSkillSecurity(
              installedSkill.localPath,
              installedSkill.name
            );

            return {
              success: true,
              message: result.message,
              blocked: securityReport.blocked,
              securityReport
            };
          }
        } catch (scanError) {
          console.error('Post-install security scan failed:', scanError);
        } finally {
          set({ isScanning: false });
        }

        return {
          success: true,
          message: result.message,
          blocked: false
        };
      },

      uninstallSkill: async (id: string) => {
        try {
          const skill = get().installedSkills.find(s => s.id === id);
          if (!skill) {
            throw new Error('Skill not found');
          }

          const result: any = await invoke('uninstall_skill', {
            request: {
              skillPath: skill.localPath
            }
          });

          if (!result.success) {
            throw new Error(result.message || 'Uninstall failed');
          }

          set((state) => ({
            installedSkills: state.installedSkills.filter((s) => s.id !== id)
          }));
        } catch (error) {
          console.error('Uninstall skill failed:', error);
          throw error;
        }
      },

      updateSkill: (id: string, updatedSkill: Partial<InstalledSkill>) => {
        set((state) => ({
            installedSkills: state.installedSkills.map((s) =>
                s.id === id ? { ...s, ...updatedSkill } : s
            )
        }));
      },

      importFromGithub: async (url: string, installPath?: string) => {
        const { defaultInstallLocation, projectPaths, selectedProjectIndex } = get();

        let finalInstallPath = installPath;
        if (!finalInstallPath && defaultInstallLocation === 'project' && projectPaths.length > 0) {
          finalInstallPath = projectPaths[selectedProjectIndex] || projectPaths[0];
        }

        const result: any = await invoke('import_github_skill', {
          request: {
            repoUrl: url,
            installPath: finalInstallPath,
            skipSecurityCheck: false
          }
        });

        if (!result.success) {
          throw new Error(result.message || 'Import failed');
        }

        // 重新扫描
        await get().scanLocalSkills();

        // 安装后立即进行安全扫描
        set({ isScanning: true });
        try {
          const skillName = url.split('/').pop()?.replace('.git', '') || 'unknown';
          const installedSkill = get().installedSkills.find(s =>
            s.name === skillName || s.localPath?.includes(skillName)
          );

          if (installedSkill?.localPath) {
            const securityReport = await get().scanSkillSecurity(
              installedSkill.localPath,
              installedSkill.name
            );

            return {
              success: true,
              message: result.message,
              blocked: securityReport.blocked,
              securityReport
            };
          }
        } catch (scanError) {
          console.error('Post-install security scan failed:', scanError);
        } finally {
          set({ isScanning: false });
        }

        return {
          success: true,
          message: result.message,
          blocked: false
        };
      },

      importFromLocal: async (sourcePath: string, installPath?: string) => {
        const skillName = sourcePath.split(/[\\/]/).pop() || 'unknown-skill';

        const result: any = await invoke('import_local_skill', {
          request: {
            sourcePath,
            installPath,
            skillName
          }
        });

        if (!result.success) {
          throw new Error(result.message || 'Import failed');
        }

        // 重新扫描
        await get().scanLocalSkills();

        // 安装后立即进行安全扫描
        set({ isScanning: true });
        try {
          const installedSkill = get().installedSkills.find(s =>
            s.name === skillName || s.localPath?.includes(skillName)
          );

          if (installedSkill?.localPath) {
            const securityReport = await get().scanSkillSecurity(
              installedSkill.localPath,
              installedSkill.name
            );

            return {
              success: true,
              message: result.message,
              blocked: securityReport.blocked,
              securityReport
            };
          }
        } catch (scanError) {
          console.error('Post-install security scan failed:', scanError);
        } finally {
          set({ isScanning: false });
        }

        return {
          success: true,
          message: result.message,
          blocked: false
        };
      },

      fetchProjectPaths: async () => {
        try {
          const paths: string[] = await invoke('get_project_paths');
          set({ projectPaths: paths });
        } catch (error) {
          console.error('Error fetching project paths:', error);
        }
      },

      saveProjectPaths: async (paths: string[]) => {
        try {
          await invoke('save_project_paths', {
            request: { paths }
          });
          set({ projectPaths: paths });
        } catch (error) {
          console.error('Error saving project paths:', error);
          throw error;
        }
      },

      // 检查已安装 Skills 的更新
      checkSkillUpdates: async () => {
        set({ isCheckingUpdates: true });
        try {
          const { installedSkills } = get();
          const updatedSkills = [...installedSkills];

          for (let i = 0; i < updatedSkills.length; i++) {
            const skill = updatedSkills[i];
            if (skill.sourceUrl && skill.source === 'github') {
              try {
                // 调用后端检查更新
                const result: any = await invoke('check_skill_update', {
                  request: {
                    skillPath: skill.localPath,
                    sourceUrl: skill.sourceUrl
                  }
                });

                if (result.hasUpdate) {
                  updatedSkills[i] = {
                    ...skill,
                    hasUpdate: true,
                    latestCommitHash: result.latestCommitHash,
                    lastChecked: Date.now()
                  };
                } else {
                  updatedSkills[i] = {
                    ...skill,
                    hasUpdate: false,
                    lastChecked: Date.now()
                  };
                }
              } catch (error) {
                console.error(`Failed to check update for ${skill.name}:`, error);
              }
            }
          }

          set({ installedSkills: updatedSkills, isCheckingUpdates: false });
        } catch (error) {
          console.error('Failed to check updates:', error);
          set({ isCheckingUpdates: false });
        }
      },

      // 批量更新选中的 Skills
      updateSelectedSkills: async (skillIds: string[]) => {
        set({ isUpdating: true });
        const success: string[] = [];
        const failed: string[] = [];

        for (const skillId of skillIds) {
          try {
            const result = await get().reinstallSkill(skillId);
            if (result) {
              success.push(skillId);
            } else {
              failed.push(skillId);
            }
          } catch (error) {
            console.error(`Failed to update skill ${skillId}:`, error);
            failed.push(skillId);
          }
        }

        // 重新扫描
        await get().scanLocalSkills();
        set({ isUpdating: false });

        return { success, failed };
      },

      // 重新安装单个 Skill（用于更新）
      reinstallSkill: async (skillId: string) => {
        const skill = get().installedSkills.find(s => s.id === skillId);
        if (!skill || !skill.sourceUrl) {
          return false;
        }

        try {
          // 先删除
          await invoke('uninstall_skill', {
            request: { skillPath: skill.localPath }
          });

          // 重新安装
          const result: any = await invoke('import_github_skill', {
            request: {
              repoUrl: skill.sourceUrl,
              installPath: skill.type === 'project' ? skill.localPath?.split('/.claude/skills')[0] : undefined,
              skipSecurityCheck: false
            }
          });

          return result.success;
        } catch (error) {
          console.error(`Failed to reinstall skill ${skillId}:`, error);
          return false;
        }
      },

      // 自定义软链接 Actions
      addCustomSymlinkPath: (path: string) => {
        const { customSymlinks } = get();
        if (!customSymlinks.find(s => s.path === path)) {
          set({ customSymlinks: [...customSymlinks, { path, exists: false }] });
        }
      },

      removeCustomSymlinkPath: (path: string) => {
        const { customSymlinks } = get();
        set({ customSymlinks: customSymlinks.filter(s => s.path !== path) });
      },

      createCustomSymlink: async (targetPath: string) => {
        try {
          const result: any = await invoke('create_custom_symlink', {
            request: { targetPath }
          });
          await get().checkCustomSymlinks();
          return result.success;
        } catch (error) {
          console.error(`Failed to create custom symlink to ${targetPath}:`, error);
          return false;
        }
      },

      removeCustomSymlink: async (targetPath: string) => {
        try {
          const result: any = await invoke('remove_custom_symlink', {
            request: { targetPath }
          });
          await get().checkCustomSymlinks();
          return result.success;
        } catch (error) {
          console.error(`Failed to remove custom symlink ${targetPath}:`, error);
          return false;
        }
      },

      checkCustomSymlinks: async () => {
        try {
          const { customSymlinks } = get();
          const updated = await Promise.all(
            customSymlinks.map(async (s) => {
              try {
                const result: any = await invoke('check_custom_symlink', {
                  request: { targetPath: s.path }
                });
                return { path: s.path, exists: result.exists };
              } catch {
                return { path: s.path, exists: false };
              }
            })
          );
          set({ customSymlinks: updated });
        } catch (error) {
          console.error('Failed to check custom symlinks:', error);
        }
      }
    }),
    {
      name: 'skill-manager-storage',
      partialize: (state) => ({
        projectPaths: state.projectPaths,
        defaultInstallLocation: state.defaultInstallLocation,
        selectedProjectIndex: state.selectedProjectIndex,
        customSymlinks: state.customSymlinks
      }),
    }
  )
);
