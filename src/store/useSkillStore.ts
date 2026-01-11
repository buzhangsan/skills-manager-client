import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InstalledSkill, MarketplaceSkill } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface SkillStore {
  installedSkills: InstalledSkill[];
  marketplaceSkills: MarketplaceSkill[];
  isLoading: boolean;
  projectPaths: string[];
  defaultInstallLocation: 'system' | 'project';
  selectedProjectIndex: number;

  // Actions
  fetchMarketplaceSkills: () => Promise<void>;
  scanLocalSkills: () => Promise<void>;
  installSkill: (skill: MarketplaceSkill) => Promise<void>;
  uninstallSkill: (id: string) => void;
  updateSkill: (id: string, skill: Partial<InstalledSkill>) => void;
  importFromGithub: (url: string, installPath?: string) => Promise<void>;
  importFromLocal: (sourcePath: string, installPath?: string) => Promise<void>;
  fetchProjectPaths: () => Promise<void>;
  saveProjectPaths: (paths: string[]) => Promise<void>;
  setDefaultInstallLocation: (location: 'system' | 'project') => void;
  setSelectedProjectIndex: (index: number) => void;
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

      setDefaultInstallLocation: (location: 'system' | 'project') => {
        set({ defaultInstallLocation: location });
      },

      setSelectedProjectIndex: (index: number) => {
        set({ selectedProjectIndex: index });
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
              id: s.path,  // 使用 path 作为唯一 id
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
              id: s.path,  // 使用 path 作为唯一 id
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
        try {
          const { defaultInstallLocation, projectPaths, selectedProjectIndex } = get();

          // 确定安装路径
          let installPath = undefined;
          if (defaultInstallLocation === 'project') {
            // 如果设置为安装到项目，但没有项目路径，则回退到系统路径
            if (projectPaths.length > 0) {
              // 使用选中的项目路径，如果索引无效则使用第一个
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
              skipSecurityCheck: false // 执行安全检查
            }
          });

          if (!result.success || result.blocked) {
            throw new Error(result.message || 'Installation failed');
          }

          // 重新扫描本地技能
          await get().scanLocalSkills();

          return result;
        } catch (error) {
          console.error('Install skill failed:', error);
          throw error;
        }
      },

      uninstallSkill: async (id: string) => {
        try {
          // 找到对应的 skill
          const skill = get().installedSkills.find(s => s.id === id);
          if (!skill) {
            throw new Error('Skill not found');
          }

          // 调用后端删除
          const result: any = await invoke('uninstall_skill', {
            request: {
              skillPath: skill.localPath
            }
          });

          if (!result.success) {
            throw new Error(result.message || 'Uninstall failed');
          }

          // 从 state 中移除
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
        try {
          const result: any = await invoke('import_github_skill', {
            request: {
              repoUrl: url,
              installPath,
              skipSecurityCheck: false
            }
          });

          if (!result.success || result.blocked) {
            throw new Error(result.message || 'Import failed');
          }

          // 重新扫描
          await get().scanLocalSkills();
          return result;
        } catch (error) {
          console.error('Import from GitHub failed:', error);
          throw error;
        }
      },

      importFromLocal: async (sourcePath: string, installPath?: string) => {
        try {
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
          return result;
        } catch (error) {
          console.error('Import from local failed:', error);
          throw error;
        }
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
        // 不持久化 installedSkills，每次启动重新扫描
        projectPaths: state.projectPaths,
        defaultInstallLocation: state.defaultInstallLocation,
        selectedProjectIndex: state.selectedProjectIndex
      }),
    }
  )
);
