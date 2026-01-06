import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkillStore } from '../store/useSkillStore';
import { Download, Search, Star, ExternalLink, Check } from 'lucide-react';
import { getLocalizedDescription } from '../utils/i18n';

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
        alert(i18n.language === 'zh'
            ? `安装失败: ${error.message}`
            : `Installation failed: ${error.message}`);
    } finally {
        setInstallingSkillId(null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold">{t('marketplace')}</h2>
            <p className="text-base-content/60">
              {i18n.language === 'zh'
                ? '发现并安装社区贡献的 Claude Skills'
                : 'Discover and install community-contributed Claude Skills'}
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
                                    <a
                                        href={skill.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost btn-xs gap-1 text-base-content/50"
                                    >
                                        <ExternalLink size={12} /> {i18n.language === 'zh' ? '源码' : 'Source'}
                                    </a>

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
                <div className="flex justify-center mt-8">
                    <div className="join">
                        <button
                            className="join-item btn"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            «
                        </button>
                        <button className="join-item btn">Page {page} of {totalPages}</button>
                        <button
                            className="join-item btn"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                            »
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
