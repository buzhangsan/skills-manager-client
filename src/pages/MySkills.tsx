import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkillStore } from '../store/useSkillStore';
import { Trash2, Eye, FolderOpen, X, Github, HardDrive, Plus } from 'lucide-react';
import type { InstalledSkill } from '../types';
import { getLocalizedDescription } from '../utils/i18n';

const MySkills = () => {
  const { t, i18n } = useTranslation();
  const { installedSkills, scanLocalSkills, uninstallSkill, importFromGithub, importFromLocal } = useSkillStore();
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'project'>('all');
  const [selectedSkill, setSelectedSkill] = useState<InstalledSkill | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [skillContent, setSkillContent] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'github' | 'local' | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [importPath, setImportPath] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    scanLocalSkills();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredSkills = installedSkills.filter(skill => {
    if (activeTab === 'all') return true;
    return skill.type === activeTab;
  });

  const handleViewSkill = async (skill: InstalledSkill) => {
    setSelectedSkill(skill);
    setShowViewModal(true);

    // 读取 SKILL.md 文件内容
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const content = await invoke<string>('read_skill', {
        skillPath: skill.localPath
      });
      setSkillContent(content);
    } catch (error) {
      console.error('Failed to load skill content:', error);
      setSkillContent(`# ${skill.name}\n\n${skill.description}\n\n**版本**: ${skill.version}\n**作者**: ${skill.author}\n\n**路径**: ${skill.localPath}`);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      if (importType === 'github') {
        await importFromGithub(importUrl);
        alert('成功从 GitHub 导入 Skill！');
      } else if (importType === 'local') {
        await importFromLocal(importPath);
        alert('成功从本地导入 Skill！');
      }
      // 重置状态
      setShowImportModal(false);
      setImportUrl('');
      setImportPath('');
      setImportType(null);
    } catch (error: any) {
      alert(`导入失败: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportType(null);
    setImportUrl('');
    setImportPath('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold">{t('mySkills')}</h2>
            <p className="text-base-content/60">
              {i18n.language === 'zh'
                ? '管理本地安装的系统级和项目级 Skills'
                : 'Manage locally installed system and project Skills'}
            </p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={() => setShowImportModal(true)}
        >
            <Plus size={18} />
            {t('importSkill')}
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-boxed bg-base-100 p-1 w-fit">
        <a
            role="tab"
            className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
        >
            {i18n.language === 'zh' ? '全部' : 'All'} ({installedSkills.length})
        </a>
        <a
            role="tab"
            className={`tab ${activeTab === 'system' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('system')}
        >
            {t('systemLevel')} ({installedSkills.filter(s => s.type === 'system').length})
        </a>
        <a
            role="tab"
            className={`tab ${activeTab === 'project' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('project')}
        >
            {t('projectLevel')} ({installedSkills.filter(s => s.type === 'project').length})
        </a>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-200">
        <table className="table">
          <thead>
            <tr>
              <th>{i18n.language === 'zh' ? '名称 / 路径' : 'Name / Path'}</th>
              <th>{t('description')}</th>
              <th>{t('type')}</th>
              <th>{i18n.language === 'zh' ? '状态' : 'Status'}</th>
              <th className="text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSkills.map((skill) => (
              <tr key={skill.id} className="hover">
                <td>
                  <div className="font-bold flex items-center gap-2">
                    {skill.name}
                  </div>
                  <div className="text-xs text-base-content/40 font-mono truncate max-w-[200px]" title={skill.localPath}>
                    {skill.localPath}
                  </div>
                </td>
                <td className="max-w-xs">
                    <div className="truncate" title={getLocalizedDescription(skill, i18n.language)}>
                      {getLocalizedDescription(skill, i18n.language)}
                    </div>
                </td>
                <td>
                  {skill.type === 'system' ? (
                      <span className="badge badge-neutral badge-sm">{t('system')}</span>
                  ) : (
                      <span className="badge badge-accent badge-outline badge-sm">{t('project')}</span>
                  )}
                </td>
                <td>
                  {skill.status === 'safe' && <div className="badge badge-success badge-sm gap-1">{i18n.language === 'zh' ? '安全' : 'Safe'}</div>}
                  {skill.status === 'unsafe' && <div className="badge badge-error badge-sm gap-1">{i18n.language === 'zh' ? '风险' : 'Unsafe'}</div>}
                  {skill.status === 'unknown' && <div className="badge badge-ghost badge-sm gap-1">{i18n.language === 'zh' ? '未扫描' : 'Unknown'}</div>}
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleViewSkill(skill)}
                    >
                        <Eye size={16} />
                        {t('view')}
                    </button>
                    <button
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                        onClick={() => {
                            if(window.confirm(
                              i18n.language === 'zh'
                                ? `确定要卸载 ${skill.name} 吗?`
                                : `Are you sure you want to uninstall ${skill.name}?`
                            )) {
                                uninstallSkill(skill.id);
                            }
                        }}
                    >
                        <Trash2 size={16} />
                        {t('remove')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSkills.length === 0 && (
            <div className="text-center py-12 text-base-content/50">
                <div className="flex flex-col items-center gap-2">
                    <FolderOpen size={48} strokeWidth={1} />
                    <p>
                      {i18n.language === 'zh'
                        ? `暂无 ${activeTab !== 'all' && (activeTab === 'system' ? '系统级' : '项目级')} Skills`
                        : `No ${activeTab !== 'all' ? activeTab : ''} Skills found`
                      }
                    </p>
                </div>
            </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedSkill && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-base-200 bg-base-100 shrink-0">
                    <div>
                      <h3 className="font-bold text-xl flex items-center gap-2">
                          {selectedSkill.name}
                      </h3>
                      <p className="text-xs text-base-content/50 mt-1 font-mono">
                        {selectedSkill.localPath}
                      </p>
                    </div>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={() => {
                            setShowViewModal(false);
                            setSelectedSkill(null);
                            setSkillContent('');
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-base-200 p-6">
                    <div className="prose prose-sm max-w-none bg-base-100 p-6 rounded-lg shadow-sm">
                      <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed font-mono bg-transparent">
                        {skillContent || '加载中...'}
                      </pre>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-base-200 bg-base-100 flex justify-end gap-2 shrink-0">
                    <button
                      className="btn"
                      onClick={() => {
                        setShowViewModal(false);
                        setSelectedSkill(null);
                        setSkillContent('');
                      }}
                    >
                      {i18n.language === 'zh' ? '关闭' : 'Close'}
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">{t('importSkill')}</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={closeImportModal}
              >
                <X size={20} />
              </button>
            </div>

            {!importType ? (
              /* 选择导入方式 */
              <div className="space-y-3">
                <p className="text-sm text-base-content/60 mb-4">
                  {i18n.language === 'zh' ? '选择导入方式：' : 'Select import method:'}
                </p>

                <div
                  className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors p-4"
                  onClick={() => setImportType('github')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-base-100 flex items-center justify-center shrink-0">
                      <Github size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1">{t('importFromGitHub')}</div>
                      <div className="text-sm text-base-content/60">
                        {i18n.language === 'zh'
                          ? '输入 GitHub 仓库 URL，支持完整仓库或子目录'
                          : 'Enter GitHub repository URL, supports full repo or subdirectory'}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors p-4"
                  onClick={() => setImportType('local')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-base-100 flex items-center justify-center shrink-0">
                      <HardDrive size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1">{t('importFromLocal')}</div>
                      <div className="text-sm text-base-content/60">
                        {i18n.language === 'zh'
                          ? '选择本地文件夹路径，必须包含 SKILL.md 文件'
                          : 'Select local folder path, must contain SKILL.md file'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 导入表单 */
              <div className="space-y-6">
                <div
                  className="alert alert-info"
                >
                  <div className="flex items-center gap-3">
                    {importType === 'github' ? <Github size={20} /> : <HardDrive size={20} />}
                    <span className="text-sm">
                      {importType === 'github' ? t('importFromGitHub') : t('importFromLocal')}
                    </span>
                  </div>
                </div>

                {importType === 'github' ? (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        {i18n.language === 'zh' ? 'GitHub 仓库 URL' : 'GitHub Repository URL'}
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://github.com/username/skill-name"
                      className="input input-bordered w-full"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      autoFocus
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/50">
                        {i18n.language === 'zh'
                          ? '仓库必须包含 SKILL.md 文件'
                          : 'Repository must contain SKILL.md file'}
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        {i18n.language === 'zh' ? '本地文件夹路径' : 'Local Folder Path'}
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="C:\Users\User\Downloads\my-skill"
                      className="input input-bordered w-full"
                      value={importPath}
                      onChange={(e) => setImportPath(e.target.value)}
                      autoFocus
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/50">
                        {i18n.language === 'zh'
                          ? '文件夹必须包含 SKILL.md 文件'
                          : 'Folder must contain SKILL.md file'}
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setImportType(null);
                      setImportUrl('');
                      setImportPath('');
                    }}
                  >
                    {i18n.language === 'zh' ? '返回' : 'Back'}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleImport}
                    disabled={isImporting || (importType === 'github' ? !importUrl.trim() : !importPath.trim())}
                  >
                    {isImporting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {t('importing')}
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        {i18n.language === 'zh' ? '确认导入' : 'Confirm Import'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MySkills;
