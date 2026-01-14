import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InstalledSkill, MarketplaceSkill } from '../types';
import { invoke } from '@tauri-apps/api/core';

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

  // 安全扫描状态
  isScanning: boolean;
  lastSecurityReport: SecurityReport | null;

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

      setDefaultInstallLocation: (location: 'system' | 'project') => {
        set({ defaultInstallLocation: location });
      },

      setSelectedProjectIndex: (index: number) => {
        set({ selectedProjectIndex: index });
      },

      clearLastSecurityReport: () => {
        set({ lastSecurityReport: null });
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

          const allSkills = [
            ...result.systemSkills.map((s: any) => ({
              id: s.path,
              name: s.name,
              description: s.description || '',
              localPath: s.path,
              status: 'safe',
              type: s.skillType,
              installDate: Date.now(),
              version: '1.0.0',
              author: 'Unknown',
              stars: 0
            })),
            ...result.projectSkills.map((s: any) => ({
              id: s.path,
              name: s.name,
              description: s.description || '',
              localPath: s.path,
              status: 'safe',
              type: s.skillType,
              installDate: Date.now(),
              version: '1.0.0',
              author: 'Unknown',
              stars: 0
            }))
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

        // 确定安装路径
        let installPath = undefined;
        if (defaultInstallLocation === 'project') {
          if (projectPaths.length > 0) {
            installPath = projectPaths[selectedProjectIndex] || projectPaths[0];
          } else {
            console.warn('No project paths configured, installing to system directory');
          }
        }

        // 使用 GitHub URL 安装技能
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
          // 获取新安装的 skill 路径
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
        const result: any = await invoke('import_github_skill', {
          request: {
            repoUrl: url,
            installPath,
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
      }
    }),
    {
      name: 'skill-manager-storage',
      partialize: (state) => ({
        projectPaths: state.projectPaths,
        defaultInstallLocation: state.defaultInstallLocation,
        selectedProjectIndex: state.selectedProjectIndex
      }),
    }
  )
);
