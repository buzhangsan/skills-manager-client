import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldCheck, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { useSkillStore } from '../store/useSkillStore';

const Security = () => {
  const { t, i18n } = useTranslation();
  const { installedSkills } = useSkillStore();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(new Date());

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
        setScanning(false);
        setLastScan(new Date());
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
             <h2 className="text-2xl font-bold">
               {i18n.language === 'zh' ? '安全中心' : 'Security Center'}
             </h2>
             <p className="text-base-content/60">
               {i18n.language === 'zh'
                 ? '扫描并监控您的 Skills 以发现潜在漏洞'
                 : 'Scan and monitor your Skills for potential vulnerabilities'}
             </p>
        </div>
        <button
            className={`btn btn-primary gap-2 ${scanning ? 'loading' : ''}`}
            onClick={handleScan}
            disabled={scanning}
        >
            {!scanning && <RefreshCw size={18} />}
            {scanning ? t('scanning') : (i18n.language === 'zh' ? '立即扫描' : 'Scan Now')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body items-center text-center">
                <ShieldCheck size={48} className="text-success mb-2" />
                <h3 className="card-title">
                  {i18n.language === 'zh' ? '系统状态' : 'System Status'}
                </h3>
                <p className="text-success font-medium">{t('safe')}</p>
                <p className="text-xs text-base-content/50">
                  {i18n.language === 'zh' ? '上次扫描' : 'Last scan'}: {lastScan?.toLocaleTimeString()}
                </p>
            </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body items-center text-center">
                <Shield size={48} className="text-info mb-2" />
                <h3 className="card-title">
                  {i18n.language === 'zh' ? '已扫描 Skills' : 'Scanned Skills'}
                </h3>
                <p className="text-2xl font-bold">{installedSkills.length}</p>
                <p className="text-xs text-base-content/50">
                  {i18n.language === 'zh' ? '总安装数' : 'Total installed'}
                </p>
            </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body items-center text-center">
                <ShieldAlert size={48} className="text-warning mb-2" />
                <h3 className="card-title">
                  {i18n.language === 'zh' ? '发现风险' : 'Risks Found'}
                </h3>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-base-content/50">
                  {i18n.language === 'zh' ? '需要处理' : 'Needs attention'}
                </p>
            </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title mb-4">
              {i18n.language === 'zh' ? '扫描结果' : 'Scan Results'}
            </h3>
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Skill</th>
                            <th>{i18n.language === 'zh' ? '状态' : 'Status'}</th>
                            <th>{i18n.language === 'zh' ? '上次检查' : 'Last Check'}</th>
                            <th>{i18n.language === 'zh' ? '详情' : 'Details'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {installedSkills.map(skill => (
                            <tr key={skill.id}>
                                <td className="font-medium">{skill.name}</td>
                                <td>
                                    {skill.status === 'safe' && (
                                        <div className="flex items-center gap-2 text-success">
                                            <CheckCircle size={16} />
                                            <span>{i18n.language === 'zh' ? '通过' : 'Passed'}</span>
                                        </div>
                                    )}
                                    {skill.status === 'unsafe' && (
                                        <div className="flex items-center gap-2 text-error">
                                            <ShieldAlert size={16} />
                                            <span>{i18n.language === 'zh' ? '高风险' : 'High Risk'}</span>
                                        </div>
                                    )}
                                    {skill.status === 'unknown' && (
                                        <div className="flex items-center gap-2 text-warning">
                                            <Shield size={16} />
                                            <span>{i18n.language === 'zh' ? '未验证' : 'Unverified'}</span>
                                        </div>
                                    )}
                                </td>
                                <td>{new Date().toLocaleDateString()}</td>
                                <td>
                                  <button className="btn btn-xs btn-ghost">
                                    {i18n.language === 'zh' ? '查看报告' : 'View Report'}
                                  </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
