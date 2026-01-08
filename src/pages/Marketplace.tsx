import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkillStore } from '../store/useSkillStore';
import { Download, Search, Star, ExternalLink, Check } from 'lucide-react';
import { getLocalizedDescription } from '../utils/i18n';
import { invoke } from '@tauri-apps/api/core';

const Marketplace = () => {
  const { t, i18n } = useTranslation();
  const { marketplaceSkills, fetchMarketplaceSkills, installSkill, installedSkills, isLoading } = useSkillStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [installingSkillId, setInstallingSkillId] = useState<string | null>(null);
  const pageSize = 12;

  useEffect(() => {
    if (marketplaceSkills.length === 0) {
        fetchMarketplaceSkills();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInstall = async (skill: any) => {
    if (installingSkillId) return;

    setInstallingSkillId(skill.id);
    try {
        await installSkill(skill);
        alert(i18n.language === 'zh'
            ? `${skill.name} 安装成功！安全扫描已通过。`
            : `${skill.name} installed successfully! Security scan passed.`);
    } catch (error: any) {
        console.error('Installation error:', error);
        const errorMessage = typeof error === 'string' ? error : (error.message || 'Unknown error');
        alert(i18n.language === 'zh'
            ? `安装失败: ${errorMessage}`
            : `Installation failed: ${errorMessage}`);
    } finally {
        setInstallingSkillId(null);
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

  // 生成页码数组
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // 如果总页数少于等于5，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 否则显示当前页附近的页码
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      // 调整范围以确保总是显示5个页码
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold">{t('marketplace')}</h2>
            <p className="text-base-content/60">
              {i18n.language === 'zh'
                ? `发现并安装社区贡献的 Claude Skills (${marketplaceSkills.length} 个)`
                : `Discover and install community-contributed Claude Skills (${marketplaceSkills.length} skills)`}
            </p>
        </div>

        <div className="join w-full md:w-auto">
          <div className="relative w-full md:w-64">
             <input
                className="input input-bordered join-item w-full"
                placeholder={t('searchSkills')}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                }}
             />
          </div>
          <button className="btn join-item bg-base-200">
            <Search size={18} />
          </button>
        </div>
      </div>

      {isLoading && (
          <div className="flex justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
      )}

      {!isLoading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentSkills.map((skill) => {
                    const installed = isInstalled(skill.id);
                    return (
                        <div key={skill.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow h-full flex flex-col">
                            <div className="card-body p-5 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <img src={skill.authorAvatar} alt={skill.author} className="w-6 h-6 rounded-full" />
                                        <span className="text-xs text-base-content/60">{skill.author}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-warning text-xs font-medium">
                                        <Star size={12} fill="currentColor" />
                                        <span>{skill.stars.toLocaleString()}</span>
                                    </div>
                                </div>
                                <h3 className="card-title text-lg">{skill.name}</h3>
                                <p className="text-sm text-base-content/70 line-clamp-3 mb-4 flex-1" title={getLocalizedDescription(skill, i18n.language)}>
                                    {getLocalizedDescription(skill, i18n.language)}
                                </p>

                                <div className="card-actions justify-between items-center mt-auto pt-4 border-t border-base-200">
                                    <button
                                        onClick={() => handleOpenSource(skill.githubUrl)}
                                        className="btn btn-ghost btn-xs gap-1 text-base-content/50"
                                    >
                                        <ExternalLink size={12} /> {i18n.language === 'zh' ? '源码' : 'Source'}
                                    </button>

                                    {installed ? (
                                        <button className="btn btn-success btn-sm btn-outline gap-2 no-animation cursor-default">
                                            <Check size={16} /> {t('installed')}
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-primary btn-sm gap-2"
                                            onClick={() => handleInstall(skill)}
                                            disabled={!!installingSkillId}
                                        >
                                            {installingSkillId === skill.id ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                <Download size={16} />
                                            )}
                                            {installingSkillId === skill.id ? (i18n.language === 'zh' ? '安装中...' : 'Installing...') : t('install')}
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
                <div className="flex justify-center mt-8 pb-8">
                    <div className="flex items-center gap-2">
                        <button
                            className="btn btn-sm"
                            disabled={page === 1}
                            onClick={() => {
                                setPage(1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            ««
                        </button>
                        <button
                            className="btn btn-sm"
                            disabled={page === 1}
                            onClick={() => {
                                setPage(p => Math.max(1, p - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            «
                        </button>

                        {getPageNumbers().map((pageNum) => (
                            <button
                                key={pageNum}
                                className={`btn btn-sm ${pageNum === page ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => {
                                    setPage(pageNum);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            >
                                {pageNum}
                            </button>
                        ))}

                        <button
                            className="btn btn-sm"
                            disabled={page === totalPages}
                            onClick={() => {
                                setPage(p => Math.min(totalPages, p + 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            »
                        </button>
                        <button
                            className="btn btn-sm"
                            disabled={page === totalPages}
                            onClick={() => {
                                setPage(totalPages);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            »»
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
