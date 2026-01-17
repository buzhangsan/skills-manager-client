import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkillStore } from '../store/useSkillStore';
import { Download, Search, Star, ExternalLink, Check, Loader2, Shield, ShieldCheck, ShieldAlert, X, CheckSquare, Square, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react';
import { getLocalizedDescription } from '../utils/i18n';
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

type InstallPhase = 'idle' | 'downloading' | 'installing' | 'scanning' | 'done';

interface InstallStatus {
  show: boolean;
  phase: InstallPhase;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  securityReport?: SecurityReport;
}

const Marketplace = () => {
  const { t, i18n } = useTranslation();
  const {
    marketplaceSkills,
    fetchMarketplaceSkills,
    installSkill,
    installedSkills,
    isLoading
  } = useSkillStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [installingSkillId, setInstallingSkillId] = useState<string | null>(null);
  const [isBatchInstalling, setIsBatchInstalling] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchSelectedSkills, setBatchSelectedSkills] = useState<string[]>([]);
  const [installStatus, setInstallStatus] = useState<InstallStatus>({
    show: false,
    phase: 'idle',
    message: '',
    type: 'info'
  });
  const pageSize = 12;

  useEffect(() => {
    if (marketplaceSkills.length === 0) {
        fetchMarketplaceSkills();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleBatchSelect = (skillId: string) => {
    setBatchSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const clearBatchSelect = () => {
    setBatchSelectedSkills([]);
  };

  const selectAllBatch = (skillIds: string[]) => {
    setBatchSelectedSkills(skillIds);
  };

  const getPhaseMessage = (phase: InstallPhase, skillName: string): string => {
    const messages = {
      downloading: i18n.language === 'zh' ? `正在下载 ${skillName}...` : `Downloading ${skillName}...`,
      installing: i18n.language === 'zh' ? `正在安装 ${skillName}...` : `Installing ${skillName}...`,
      scanning: i18n.language === 'zh' ? `正在进行安全扫描...` : `Running security scan...`,
      done: i18n.language === 'zh' ? `${skillName} 安装完成！` : `${skillName} installed successfully!`,
      idle: ''
    };
    return messages[phase];
  };

  const handleInstall = async (skill: any) => {
    if (installingSkillId) return;

    setInstallingSkillId(skill.id);

    setInstallStatus({
      show: true,
      phase: 'downloading',
      message: getPhaseMessage('downloading', skill.name),
      type: 'info'
    });

    try {
      setTimeout(() => {
        setInstallStatus(prev => ({
          ...prev,
          phase: 'installing',
          message: getPhaseMessage('installing', skill.name)
        }));
      }, 500);

      const result = await installSkill(skill);

      setInstallStatus(prev => ({
        ...prev,
        phase: 'scanning',
        message: getPhaseMessage('scanning', skill.name)
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.securityReport) {
        const report = result.securityReport;
        const isRisky = report.level === 'high' || report.level === 'critical' || report.blocked;

        setInstallStatus({
          show: true,
          phase: 'done',
          message: isRisky
            ? (i18n.language === 'zh' ? `${skill.name} 已安装，但发现安全风险！` : `${skill.name} installed, but security risks found!`)
            : (i18n.language === 'zh' ? `${skill.name} 安装成功，安全评分: ${report.score}` : `${skill.name} installed successfully, security score: ${report.score}`),
          type: isRisky ? 'warning' : 'success',
          securityReport: report
        });
      } else {
        setInstallStatus({
          show: true,
          phase: 'done',
          message: getPhaseMessage('done', skill.name),
          type: 'success'
        });
      }

      if (!result.securityReport?.blocked && result.securityReport?.level !== 'critical') {
        setTimeout(() => {
          setInstallStatus(prev => {
            if (prev.phase === 'done' && !prev.securityReport?.blocked) {
              return { show: false, phase: 'idle', message: '', type: 'info' };
            }
            return prev;
          });
        }, 5000);
      }

    } catch (error: any) {
      console.error('Installation error:', error);
      const errorMessage = typeof error === 'string' ? error : (error.message || 'Unknown error');
      setInstallStatus({
        show: true,
        phase: 'done',
        message: i18n.language === 'zh' ? `安装失败: ${errorMessage}` : `Installation failed: ${errorMessage}`,
        type: 'error'
      });
      setTimeout(() => setInstallStatus({ show: false, phase: 'idle', message: '', type: 'info' }), 5000);
    } finally {
      setInstallingSkillId(null);
    }
  };

  const handleBatchInstall = async () => {
    if (batchSelectedSkills.length === 0 || isBatchInstalling) return;

    const skillsToInstall = marketplaceSkills.filter(s => batchSelectedSkills.includes(s.id));
    if (skillsToInstall.length === 0) return;

    setIsBatchInstalling(true);
    setInstallStatus({
      show: true,
      phase: 'installing',
      message: i18n.language === 'zh'
        ? `正在批量安装 ${skillsToInstall.length} 个 Skills...`
        : `Batch installing ${skillsToInstall.length} Skills...`,
      type: 'info'
    });

    let successCount = 0;
    let failCount = 0;

    try {
      for (const skill of skillsToInstall) {
        try {
          await installSkill(skill);
          successCount++;
        } catch (e) {
          failCount++;
          console.error(`Failed to install ${skill.name}:`, e);
        }
      }

      setInstallStatus({
        show: true,
        phase: 'done',
        message: i18n.language === 'zh'
          ? `批量安装完成: ${successCount} 成功${failCount > 0 ? `, ${failCount} 失败` : ''}`
          : `Batch install complete: ${successCount} succeeded${failCount > 0 ? `, ${failCount} failed` : ''}`,
        type: failCount > 0 ? 'warning' : 'success'
      });

      setBatchMode(false);
      clearBatchSelect();
      setTimeout(() => setInstallStatus({ show: false, phase: 'idle', message: '', type: 'info' }), 5000);
    } catch (error: any) {
      console.error('Batch installation error:', error);
      setInstallStatus({
        show: true,
        phase: 'done',
        message: i18n.language === 'zh' ? `批量安装失败: ${error.message}` : `Batch install failed: ${error.message}`,
        type: 'error'
      });
      setTimeout(() => setInstallStatus({ show: false, phase: 'idle', message: '', type: 'info' }), 5000);
    } finally {
      setIsBatchInstalling(false);
    }
  };

  const handleOpenSource = async (url: string) => {
    try {
        await invoke('open_url', { url });
    } catch (error) {
        console.error('Failed to open URL:', error);
        alert(i18n.language === 'zh'
            ? `无法打开链接: ${error}`
            : `Failed to open URL: ${error}`);
    }
  };

  const isInstalled = (skillId: string) => {
    return installedSkills.some(s => s.id === skillId);
  };

  const filteredSkills = marketplaceSkills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSkills.length / pageSize);
  const currentSkills = filteredSkills.slice((page - 1) * pageSize, page * pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (end - start < maxVisiblePages - 1) {
        if (start === 1) {
          end = Math.min(totalPages, start + maxVisiblePages - 1);
        } else {
          start = Math.max(1, end - maxVisiblePages + 1);
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case 'safe':
      case 'low':
        return <ShieldCheck className="text-success" size={20} />;
      case 'medium':
        return <Shield className="text-warning" size={20} />;
      case 'high':
      case 'critical':
        return <ShieldAlert className="text-error" size={20} />;
      default:
        return <Shield className="text-info" size={20} />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="space-y-8">
      {/* Install Status Toast */}
      {installStatus.show && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert shadow-2xl max-w-md rounded-2xl border ${
            installStatus.type === 'success' ? 'alert-success border-success/30' :
            installStatus.type === 'warning' ? 'alert-warning border-warning/30' :
            installStatus.type === 'error' ? 'alert-error border-error/30' : 'alert-info border-info/30'
          }`}>
            <div className="flex items-start gap-3 w-full">
              {installStatus.phase !== 'done' ? (
                <Loader2 className="animate-spin flex-shrink-0 mt-0.5" size={18} />
              ) : installStatus.securityReport ? (
                getSecurityIcon(installStatus.securityReport.level)
              ) : installStatus.type === 'success' ? (
                <Check size={18} className="flex-shrink-0 mt-0.5" />
              ) : null}

              <div className="flex-1 min-w-0">
                <p className="font-semibold">{installStatus.message}</p>

                {installStatus.securityReport && installStatus.phase === 'done' && (
                  <div className="mt-2 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{i18n.language === 'zh' ? '安全评分:' : 'Security Score:'}</span>
                      <span className={`font-bold ${getScoreColor(installStatus.securityReport.score)}`}>
                        {installStatus.securityReport.score}/100
                      </span>
                    </div>
                    {installStatus.securityReport.issues.length > 0 && (
                      <p className="opacity-80">
                        {i18n.language === 'zh'
                          ? `发现 ${installStatus.securityReport.issues.length} 个潜在问题`
                          : `Found ${installStatus.securityReport.issues.length} potential issues`}
                      </p>
                    )}
                    {installStatus.securityReport.blocked && (
                      <p className="text-error font-medium mt-1">
                        {i18n.language === 'zh'
                          ? '检测到严重安全风险！请在安全中心查看详情。'
                          : 'Critical security risk detected! Check Security Center for details.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {installStatus.phase === 'done' && (
                <button
                  onClick={() => setInstallStatus({ show: false, phase: 'idle', message: '', type: 'info' })}
                  className="btn btn-ghost btn-xs btn-circle flex-shrink-0 hover:bg-white/10"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-violet-500 rounded-xl">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold">{t('marketplace')}</h2>
          </div>
          <p className="text-base-content/60 text-lg">
            {i18n.language === 'zh'
              ? `发现并安装社区贡献的 AI Skills`
              : `Discover and install community-contributed AI Skills`}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="stat-badge bg-primary/10 text-primary">
              {marketplaceSkills.length} {i18n.language === 'zh' ? '个 Skills' : 'Skills'}
            </span>
            <span className="stat-badge bg-success/10 text-success">
              {installedSkills.length} {i18n.language === 'zh' ? '已安装' : 'Installed'}
            </span>
            <span className="stat-badge bg-orange-500/10 text-orange-500">
              Claude Code
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Batch Mode Toggle */}
          <button
            className={`btn btn-sm gap-2 rounded-xl transition-all duration-200 ${
              batchMode
                ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25'
                : 'bg-base-200 hover:bg-base-300 border-0'
            }`}
            onClick={() => {
              setBatchMode(!batchMode);
              if (batchMode) clearBatchSelect();
            }}
          >
            {batchMode ? <CheckSquare size={14} /> : <Square size={14} />}
            {i18n.language === 'zh' ? '批量模式' : 'Batch Mode'}
          </button>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              className="input bg-base-200 border-0 pl-10 w-full md:w-64 rounded-xl focus:ring-2 focus:ring-primary/20"
              placeholder={t('searchSkills')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Batch Action Bar */}
      {batchMode && (
        <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-violet-500/10 p-4 rounded-2xl border border-primary/20 animate-fade-in">
          <div className="flex items-center gap-4">
            <button
              className="btn btn-xs btn-ghost rounded-lg hover:bg-white/10"
              onClick={() => {
                const uninstalledIds = currentSkills
                  .filter(s => !isInstalled(s.id))
                  .map(s => s.id);
                selectAllBatch(uninstalledIds);
              }}
            >
              {i18n.language === 'zh' ? '全选当前页' : 'Select All'}
            </button>
            <button
              className="btn btn-xs btn-ghost rounded-lg hover:bg-white/10"
              onClick={clearBatchSelect}
            >
              {i18n.language === 'zh' ? '清除选择' : 'Clear'}
            </button>
            <span className="text-sm font-medium text-base-content/70">
              {i18n.language === 'zh'
                ? `已选择 ${batchSelectedSkills.length} 个`
                : `${batchSelectedSkills.length} selected`}
            </span>
          </div>
          <button
            className="btn btn-primary btn-sm gap-2 rounded-xl shadow-lg shadow-primary/25"
            onClick={handleBatchInstall}
            disabled={batchSelectedSkills.length === 0 || isBatchInstalling}
          >
            {isBatchInstalling ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                {i18n.language === 'zh' ? '安装中...' : 'Installing...'}
              </>
            ) : (
              <>
                <Download size={16} />
                {i18n.language === 'zh'
                  ? `安装 ${batchSelectedSkills.length} 个到 Claude Code`
                  : `Install ${batchSelectedSkills.length} to Claude Code`}
              </>
            )}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60">{i18n.language === 'zh' ? '正在加载 Skills...' : 'Loading Skills...'}</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {currentSkills.map((skill, index) => {
              const installed = isInstalled(skill.id);
              const isCurrentlyInstalling = installingSkillId === skill.id;
              const isSelected = batchSelectedSkills.includes(skill.id);
              return (
                <div
                  key={skill.id}
                  className={`skill-card h-full flex flex-col cursor-pointer animate-slide-up ${
                    batchMode && isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : ''
                  } ${installed ? 'opacity-75' : ''}`}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => {
                    if (batchMode && !installed) {
                      toggleBatchSelect(skill.id);
                    }
                  }}
                >
                  <div className="card-body p-5 flex-1">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {batchMode && !installed && (
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary rounded-lg"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleBatchSelect(skill.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <img src={skill.authorAvatar} alt={skill.author} className="w-7 h-7 rounded-full ring-2 ring-base-200" />
                        <span className="text-sm text-base-content/60 font-medium">{skill.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-500 text-sm font-semibold bg-amber-500/10 px-2 py-1 rounded-lg">
                        <Star size={12} fill="currentColor" />
                        <span>{skill.stars.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold mb-2 line-clamp-1">{skill.name}</h3>

                    {/* Description */}
                    <p className="text-sm text-base-content/60 line-clamp-3 mb-4 flex-1 leading-relaxed" title={getLocalizedDescription(skill, i18n.language)}>
                      {getLocalizedDescription(skill, i18n.language)}
                    </p>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-base-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSource(skill.githubUrl);
                        }}
                        className="btn btn-ghost btn-sm gap-1.5 text-base-content/50 hover:text-base-content rounded-lg"
                      >
                        <ExternalLink size={14} />
                        {i18n.language === 'zh' ? '源码' : 'Source'}
                      </button>

                      {installed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-lg text-sm font-medium">
                          <Check size={14} />
                          {t('installed')}
                        </span>
                      ) : batchMode ? (
                        <span className="text-xs text-base-content/50 font-medium">
                          {isSelected
                            ? (i18n.language === 'zh' ? '已选中' : 'Selected')
                            : (i18n.language === 'zh' ? '点击选择' : 'Click to select')}
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm gap-2 rounded-lg shadow-lg shadow-primary/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInstall(skill);
                          }}
                          disabled={!!installingSkillId}
                        >
                          {isCurrentlyInstalling ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              {installStatus.phase === 'scanning'
                                ? (i18n.language === 'zh' ? '扫描中' : 'Scanning')
                                : (i18n.language === 'zh' ? '安装中' : 'Installing')}
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              {t('install')}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10 pb-8">
              <div className="flex items-center gap-1 bg-base-200 p-1.5 rounded-2xl">
                <button
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={page === 1}
                  onClick={() => {
                    setPage(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={page === 1}
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1 px-2">
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`btn btn-sm min-w-[2.5rem] rounded-xl transition-all duration-200 ${
                        pageNum === page
                          ? 'btn-primary shadow-lg shadow-primary/25'
                          : 'btn-ghost'
                      }`}
                      onClick={() => {
                        setPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={page === totalPages}
                  onClick={() => {
                    setPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={page === totalPages}
                  onClick={() => {
                    setPage(totalPages);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marketplace;
