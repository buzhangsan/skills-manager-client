import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkillStore } from '../store/useSkillStore';
import { Plus, X, FolderOpen, ExternalLink, Package } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const {
    projectPaths,
    fetchProjectPaths,
    saveProjectPaths,
    defaultInstallLocation,
    setDefaultInstallLocation,
    marketplaceSkills,
    selectedProjectIndex,
    setSelectedProjectIndex
  } = useSkillStore();
  const [paths, setPaths] = useState<string[]>([]);
  const [newPath, setNewPath] = useState('');

  useEffect(() => {
    fetchProjectPaths();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPaths(projectPaths);
  }, [projectPaths]);

  const handleAddPath = async () => {
    if (newPath && !paths.includes(newPath)) {
      const updatedPaths = [...paths, newPath];
      setPaths(updatedPaths);
      setNewPath('');
      // 自动保存
      try {
        await saveProjectPaths(updatedPaths);
      } catch (error) {
        console.error('Failed to save paths:', error);
        alert(t('saveError'));
      }
    }
  };

  const handleRemovePath = async (pathToRemove: string) => {
    const updatedPaths = paths.filter(p => p !== pathToRemove);
    setPaths(updatedPaths);
    // 自动保存
    try {
      await saveProjectPaths(updatedPaths);
    } catch (error) {
      console.error('Failed to save paths:', error);
      alert(t('saveError'));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('settings')}</h2>

      {/* Skill 安装设置 + 右侧信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：安装设置 */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">
                {i18n.language === 'zh' ? 'Skill 安装设置' : 'Skill Installation Settings'}
              </h3>
              <p className="text-sm text-base-content/60 mb-4">
                {i18n.language === 'zh'
                  ? '选择从 Marketplace 安装 Skill 时的默认存储位置。无论选择哪种方式，Claude Code 都能正常使用这些 Skills。'
                  : 'Choose the default storage location when installing Skills from Marketplace. Claude Code can use Skills from either location.'
                }
              </p>

            <div className="space-y-4">
                {/* 选项1: 系统目录 */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    defaultInstallLocation === 'system'
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-base-400'
                  }`}
                  onClick={() => setDefaultInstallLocation('system')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="install-location"
                      className="radio radio-primary mt-1"
                      checked={defaultInstallLocation === 'system'}
                      onChange={() => setDefaultInstallLocation('system')}
                    />
                    <div className="flex-1">
                      <div className="font-semibold mb-1">
                        {i18n.language === 'zh' ? '系统全局目录（推荐）' : 'System Global Directory (Recommended)'}
                      </div>
                      <div className="text-sm text-base-content/70 mb-2">
                        {i18n.language === 'zh'
                          ? 'Skills 存储在用户主目录下，所有项目都能访问'
                          : 'Skills stored in user home directory, accessible to all projects'
                        }
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <FolderOpen size={14} className="text-base-content/50" />
                        <code className="bg-base-200 px-2 py-1 rounded text-base-content/80">
                          {i18n.language === 'zh'
                            ? 'Windows: C:\\Users\\[用户名]\\.claude\\skills'
                            : 'Windows: C:\\Users\\[username]\\.claude\\skills'
                          }
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <FolderOpen size={14} className="text-base-content/50" />
                        <code className="bg-base-200 px-2 py-1 rounded text-base-content/80">
                          {i18n.language === 'zh'
                            ? 'Linux/Mac: ~/.claude/skills'
                            : 'Linux/Mac: ~/.claude/skills'
                          }
                        </code>
                      </div>
                      <div className="mt-2 text-xs text-success">
                        ✓ {i18n.language === 'zh' ? '无需为每个项目重复安装' : 'No need to reinstall for each project'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 选项2: 项目目录 */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    defaultInstallLocation === 'project'
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-base-400'
                  }`}
                  onClick={() => setDefaultInstallLocation('project')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="install-location"
                      className="radio radio-primary mt-1"
                      checked={defaultInstallLocation === 'project'}
                      onChange={() => setDefaultInstallLocation('project')}
                    />
                    <div className="flex-1">
                      <div className="font-semibold mb-1">
                        {i18n.language === 'zh' ? '项目专属目录' : 'Project-Specific Directory'}
                      </div>
                      <div className="text-sm text-base-content/70 mb-2">
                        {i18n.language === 'zh'
                          ? 'Skills 存储在指定项目的 .claude/skills 文件夹中'
                          : 'Skills stored in project\'s .claude/skills folder'
                        }
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <FolderOpen size={14} className="text-base-content/50" />
                        <code className="bg-base-200 px-2 py-1 rounded text-base-content/80">
                          {i18n.language === 'zh'
                            ? '[项目路径]/.claude/skills'
                            : '[Project Path]/.claude/skills'
                          }
                        </code>
                      </div>
                      {projectPaths.length === 0 && (
                        <div className="mt-2 text-xs text-warning flex items-center gap-1">
                          ⚠ {i18n.language === 'zh'
                            ? '需要先在下方添加项目路径'
                            : 'Please add project paths below first'
                          }
                        </div>
                      )}
                      {projectPaths.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <label className="text-xs font-medium text-base-content/70">
                            {i18n.language === 'zh' ? '选择安装到哪个项目:' : 'Select project to install to:'}
                          </label>
                          {projectPaths.map((path, index) => (
                            <label
                              key={index}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                selectedProjectIndex === index
                                  ? 'bg-primary/10 border border-primary'
                                  : 'bg-base-200 hover:bg-base-300'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProjectIndex(index);
                              }}
                            >
                              <input
                                type="radio"
                                name="selected-project"
                                className="radio radio-xs radio-primary"
                                checked={selectedProjectIndex === index}
                                onChange={() => setSelectedProjectIndex(index)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <FolderOpen size={12} className="text-base-content/50" />
                              <span className="text-xs font-mono flex-1 truncate" title={path}>
                                {path}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-base-content/60">
                        ✓ {i18n.language === 'zh' ? '可随项目版本控制' : 'Can be version controlled with project'}
                      </div>
                    </div>
                  </div>
                </div>
            </div>

              <div className="alert alert-info mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="text-sm">
                  {i18n.language === 'zh'
                    ? '提示：Claude Code 会自动扫描系统目录和已添加的项目目录中的所有 Skills。'
                    : 'Tip: Claude Code automatically scans all Skills in both system and project directories.'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：项目信息 */}
        <div className="space-y-6">
          {/* 关于部分 */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">
                {i18n.language === 'zh' ? '关于' : 'About'}
              </h3>

              <div className="space-y-3">
                {/* 当前项目信息 */}
                <div className="flex items-center justify-between py-2 border-b border-base-200">
                  <span className="text-sm text-base-content/70">
                    {i18n.language === 'zh' ? '版本' : 'Version'}
                  </span>
                  <span className="text-sm font-semibold">v1.2.2</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-base-200">
                  <span className="text-sm text-base-content/70">
                    {i18n.language === 'zh' ? 'Marketplace Skills' : 'Marketplace Skills'}
                  </span>
                  <span className="text-sm font-semibold">{marketplaceSkills.length} {i18n.language === 'zh' ? '个' : 'skills'}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-base-content/70">
                    {i18n.language === 'zh' ? '项目仓库' : 'Repository'}
                  </span>
                  <a
                    href="https://github.com/buzhangsan/skills-manager-client"
                    className="btn btn-sm btn-ghost gap-1"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        await invoke('open_url', { url: 'https://github.com/buzhangsan/skills-manager-client' });
                      } catch (error) {
                        console.error('Failed to open URL:', error);
                      }
                    }}
                  >
                    <ExternalLink size={14} />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 相关项目 */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">
                {i18n.language === 'zh' ? '相关项目' : 'Related Project'}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Package size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">Skill Manager (Skill)</h4>
                    <p className="text-xs text-base-content/70 mb-3">
                      {i18n.language === 'zh'
                        ? '命令行版本的 Skill 管理工具，支持智能搜索、安装Skill，内置skill市场功能。'
                        : 'Command-line Skill management tool with smart search, installation, and built-in skill marketplace.'
                      }
                    </p>
                    <a
                      href="https://github.com/buzhangsan/skill-manager"
                      className="btn btn-sm btn-primary gap-1 w-full"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          await invoke('open_url', { url: 'https://github.com/buzhangsan/skill-manager' });
                        } catch (error) {
                          console.error('Failed to open URL:', error);
                        }
                      }}
                    >
                      <ExternalLink size={14} />
                      {i18n.language === 'zh' ? '查看项目' : 'View Project'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title text-lg">{t('projectPaths')}</h3>
            <p className="text-sm text-base-content/60 mb-4">
              {i18n.language === 'zh'
                ? '添加您的项目根目录，系统将自动扫描 [项目]/.claude/skills 文件夹'
                : 'Add your project root directories. The system will scan [project]/.claude/skills folders'
              }
            </p>

            {/* 现有路径列表 */}
            <div className="space-y-2 mb-4">
              {paths.length === 0 ? (
                <div className="text-center py-8 text-base-content/40 border border-dashed border-base-300 rounded-lg">
                  {t('noData')}
                </div>
              ) : (
                paths.map((path, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                    <FolderOpen size={18} className="text-base-content/60 shrink-0" />
                    <span className="flex-1 font-mono text-sm break-all">{path}</span>
                    <button
                      className="btn btn-sm btn-ghost text-error"
                      onClick={() => handleRemovePath(path)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* 添加新路径 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {i18n.language === 'zh' ? '添加新的项目路径' : 'Add New Project Path'}
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={i18n.language === 'zh'
                    ? '例如: C:\\Projects\\MyApp 或 /Users/name/Projects/MyApp'
                    : 'e.g., C:\\Projects\\MyApp or /Users/name/Projects/MyApp'
                  }
                  className="input input-bordered flex-1"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPath()}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddPath}
                  disabled={!newPath.trim()}
                >
                  <Plus size={20} />
                  {i18n.language === 'zh' ? '添加' : 'Add'}
                </button>
              </div>
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  {i18n.language === 'zh'
                    ? '系统会扫描该路径下的 .claude/skills 文件夹'
                    : 'System will scan .claude/skills folder under this path'
                  }
                </span>
              </label>
            </div>

            <div className="alert alert-success mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm">
                {i18n.language === 'zh'
                  ? '✓ 添加或删除项目路径时会自动保存'
                  : '✓ Project paths are automatically saved when added or removed'
                }
              </span>
            </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title text-lg">
              {i18n.language === 'zh' ? '外观' : 'Appearance'}
            </h3>
            <div className="form-control w-full max-w-xs">
                <label className="label">
                    <span className="label-text">{t('theme')}</span>
                </label>
                <select className="select select-bordered">
                    <option>{i18n.language === 'zh' ? '跟随系统' : 'Follow System'}</option>
                    <option>{t('light')}</option>
                    <option>{t('dark')}</option>
                </select>
            </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title text-lg text-error">
              {i18n.language === 'zh' ? '危险区域' : 'Danger Zone'}
            </h3>
            <p className="text-sm text-base-content/60 mb-4">
              {i18n.language === 'zh'
                ? '这些操作不可逆，请谨慎使用。'
                : 'These actions are irreversible. Use with caution.'
              }
            </p>

            <div className="flex flex-wrap gap-3">
                <button className="btn btn-outline btn-error">
                  {i18n.language === 'zh' ? '重置所有 Skills' : 'Reset All Skills'}
                </button>
                <button className="btn btn-outline btn-error">
                  {i18n.language === 'zh' ? '清空缓存' : 'Clear Cache'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
