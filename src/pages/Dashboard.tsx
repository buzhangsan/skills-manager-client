import { useEffect } from 'react';
import { useSkillStore } from '../store/useSkillStore';
import { ShieldAlert, Zap, Box, HardDrive } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const StatCard = ({ title, value, icon: Icon, color, desc }: any) => (
  <div className="stats shadow bg-base-100 border border-base-200">
    <div className="stat">
      <div className={`stat-figure text-${color}`}>
        <Icon size={32} />
      </div>
      <div className="stat-title">{title}</div>
      <div className="stat-value text-2xl">{value}</div>
      <div className="stat-desc">{desc}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const { scanLocalSkills, installedSkills } = useSkillStore();

  // 根据语言切换图表数据
  const data = [
    { name: t('mon'), usage: 40 },
    { name: t('tue'), usage: 30 },
    { name: t('wed'), usage: 20 },
    { name: t('thu'), usage: 27 },
    { name: t('fri'), usage: 18 },
    { name: t('sat'), usage: 23 },
    { name: t('sun'), usage: 34 },
  ];

  useEffect(() => {
    scanLocalSkills();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const systemSkillsCount = installedSkills.filter(s => s.type === 'system').length;
  const projectSkillsCount = installedSkills.filter(s => s.type === 'project').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('installedSkills')}
          value={installedSkills.length}
          icon={Zap}
          color="primary"
          desc={t('allActiveSkills')}
        />
        <StatCard
          title={t('systemLevel')}
          value={systemSkillsCount}
          icon={HardDrive}
          color="secondary"
          desc={t('globallyAvailable')}
        />
        <StatCard
          title={t('projectLevel')}
          value={projectSkillsCount}
          icon={Box}
          color="accent"
          desc={t('currentProjectOnly')}
        />
        <StatCard
          title={t('securityStatus')}
          value={t('safe')}
          icon={ShieldAlert}
          color="success"
          desc={t('noRisksFound')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
          <h3 className="font-bold text-lg mb-4">{t('skillUsageTrend')}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="usage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
          <h3 className="font-bold text-lg mb-4">{t('recentActivity')}</h3>
          <ul className="steps steps-vertical w-full">
            <li className="step step-primary">
                <div className="text-left ml-2">
                    <p className="font-medium">
                      {t('installedActivity', { name: 'Git Commander' })}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {t('minutesAgo', { count: 2 })}
                    </p>
                </div>
            </li>
            <li className="step step-primary">
                <div className="text-left ml-2">
                    <p className="font-medium">
                      {t('updatedActivity', { name: 'Web Search' })}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {t('hoursAgo', { count: 2 })}
                    </p>
                </div>
            </li>
            <li className="step">
                <div className="text-left ml-2">
                    <p className="font-medium">
                      {t('securityScanActivity')}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {t('yesterday')}
                    </p>
                </div>
            </li>
            <li className="step">
                <div className="text-left ml-2">
                    <p className="font-medium">
                      {t('systemUpdateActivity')}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {t('daysAgo', { count: 3 })}
                    </p>
                </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
