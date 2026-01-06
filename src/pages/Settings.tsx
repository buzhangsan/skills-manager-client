import { useEffect, useState } from 'react';
import { useSkillStore } from '../store/useSkillStore';
import { Plus, X, FolderOpen } from 'lucide-react';

const Settings = () => {
  const { projectPaths, fetchProjectPaths, saveProjectPaths } = useSkillStore();
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
      alert('项目路径保存成功！');
    } catch (error) {
      alert('保存失败，请检查后端服务是否启动');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">设置</h2>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title text-lg">系统级 Skill 目录</h3>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">默认位置</span>
                </label>
                <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 bg-base-200"
                      value="~/.claude/skills"
                      readOnly
                    />
                    <button className="btn btn-square btn-outline">
                      <FolderOpen size={20} />
                    </button>
                </div>
                <label className="label">
                    <span className="label-text-alt text-base-content/50">
                      Windows: C:\Users\[用户名]\.claude\skills<br />
                      macOS/Linux: ~/.claude/skills
                    </span>
                </label>
            </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title text-lg">项目级 Skill 路径</h3>
            <p className="text-sm text-base-content/60 mb-4">
              添加您的项目根目录，系统将自动扫描 [项目]/.claude/skills 文件夹
            </p>

            {/* 现有路径列表 */}
            <div className="space-y-2 mb-4">
              {paths.length === 0 ? (
                <div className="text-center py-8 text-base-content/40 border border-dashed border-base-300 rounded-lg">
                  暂无配置的项目路径
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
                <span className="label-text">添加新的项目路径</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="例如: C:\Projects\MyApp 或 /Users/name/Projects/MyApp"
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
                  添加
                </button>
              </div>
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  系统会扫描该路径下的 .claude/skills 文件夹
                </span>
              </label>
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="btn btn-primary"
                onClick={handleSavePaths}
              >
                保存配置
              </button>
            </div>

            <div className="divider"></div>

            <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    <span className="label-text">自动更新 Skills</span>
                </label>
            </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title text-lg">外观</h3>
            <div className="form-control w-full max-w-xs">
                <label className="label">
                    <span className="label-text">主题</span>
                </label>
                <select className="select select-bordered">
                    <option>跟随系统</option>
                    <option>浅色</option>
                    <option>深色</option>
                </select>
            </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title text-lg text-error">危险区域</h3>
            <p className="text-sm text-base-content/60 mb-4">这些操作不可逆，请谨慎使用。</p>

            <div className="flex flex-wrap gap-3">
                <button className="btn btn-outline btn-error">重置所有 Skills</button>
                <button className="btn btn-outline btn-error">清空缓存</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
