import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkillStore } from '../store/useSkillStore';
import { Plus, X, FolderOpen } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const {
    projectPaths,
    fetchProjectPaths,
    saveProjectPaths,
    defaultInstallLocation,
    setDefaultInstallLocation
  } = useSkillStore();
  const [paths, setPaths] = useState<string[]>([]);
  const [newPath, setNewPath] = useState('');

  useEffect(() => {
    fetchProjectPaths();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPaths(projectPaths);
  }, [projectPaths]);

  const handleAddPath = () => {
    if (newPath && !paths.includes(newPath)) {
      const updatedPaths = [...paths, newPath];
      setPaths(updatedPaths);
      setNewPath('');
    }
  };

  const handleRemovePath = (pathToRemove: string) => {
    const updatedPaths = paths.filter(p => p !== pathToRemove);
    setPaths(updatedPaths);
  };

  const handleSavePaths = async () => {
    try {
      await saveProjectPaths(paths);
      alert(t('saveSuccess'));
    } catch (error) {
      alert(t('saveError'));
    }
  };

  const handleSelectDirectory = async () => {
    try {
      const selected = await invoke<string | null>('select_directory');
      if (selected) {
        setNewPath(selected);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">{t('settings')}</h2>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title text-lg">
              {i18n.language === 'zh' ? '系统级 Skill 目录' : 'System Skill Directory'}
            </h3>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">
                      {i18n.language === 'zh' ? '默认安装位置' : 'Default Install Location'}
                    </span>
                </label>
                <div className="flex gap-4">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="radio"
                      name="install-location"
                      className="radio radio-primary"
                      checked={defaultInstallLocation === 'system'}
                      onChange={() => setDefaultInstallLocation('system')}
                    />
                    <span className="label-text">{i18n.language === 'zh' ? '系统目录' : 'System Directory'}</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="radio"
                      name="install-location"
                      className="radio radio-primary"
                      checked={defaultInstallLocation === 'project'}
                      onChange={() => setDefaultInstallLocation('project')}
                    />
                    <span className="label-text">{i18n.language === 'zh' ? '当前项目' : 'Current Project'}</span>
                  </label>
                </div>

                <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 bg-base-200"
                      value="~/.claude/skills"
                      readOnly
                    />
                    <button className="btn btn-square btn-outline cursor-default">
                      <FolderOpen size={20} />
                    </button>
                </div>
                <label className="label">
                    <span className="label-text-alt text-base-content/50">
                      {i18n.language === 'zh'
                        ? 'Windows: C:\\Users\\[用户名]\\.claude\\skills\nLinux/Mac: ~/.claude/skills'
                        : 'Windows: C:\\Users\\[username]\\.claude\\skills\nLinux/Mac: ~/.claude/skills'
                      }
                    </span>
                </label>
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
                  className="btn btn-square btn-outline"
                  onClick={handleSelectDirectory}
                  title={i18n.language === 'zh' ? '选择文件夹' : 'Select Folder'}
                >
                  <FolderOpen size={20} />
                </button>
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

            <div className="flex justify-end mt-4">
              <button
                className="btn btn-primary"
                onClick={handleSavePaths}
              >
                {t('save')}
              </button>
            </div>

            <div className="divider"></div>

            <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    <span className="label-text">
                      {i18n.language === 'zh' ? '自动更新 Skills' : 'Auto Update Skills'}
                    </span>
                </label>
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
