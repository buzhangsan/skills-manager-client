import { useEffect } from 'react';
import { useSkillStore } from '../store/useSkillStore';
import { ShieldAlert, Download, Activity, Zap, Box, HardDrive } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '周一', usage: 40 },
  { name: '周二', usage: 30 },
  { name: '周三', usage: 20 },
  { name: '周四', usage: 27 },
  { name: '周五', usage: 18 },
  { name: '周六', usage: 23 },
  { name: '周日', usage: 34 },
];

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
  const { scanLocalSkills, installedSkills } = useSkillStore();

  useEffect(() => {
    scanLocalSkills();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const systemSkillsCount = installedSkills.filter(s => s.type === 'system').length;
  const projectSkillsCount = installedSkills.filter(s => s.type === 'project').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="已安装 Skills"
          value={installedSkills.length}
          icon={Zap}
          color="primary"
          desc="所有已激活的技能"
        />
        <StatCard
          title="系统级"
          value={systemSkillsCount}
          icon={HardDrive}
          color="secondary"
          desc="全局可用"
        />
        <StatCard
          title="项目级"
          value={projectSkillsCount}
          icon={Box}
          color="accent"
          desc="当前项目专用"
        />
        <StatCard
          title="安全状态"
          value="安全"
          icon={ShieldAlert}
          color="success"
          desc="未发现风险"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
          <h3 className="font-bold text-lg mb-4">Skill 调用趋势</h3>
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
          <h3 className="font-bold text-lg mb-4">最近活动</h3>
          <ul className="steps steps-vertical w-full">
            <li className="step step-primary">
                <div className="text-left ml-2">
                    <p className="font-medium">安装了 "Git Commander"</p>
                    <p className="text-xs text-base-content/60">2 分钟前</p>
                </div>
            </li>
            <li className="step step-primary">
                <div className="text-left ml-2">
                    <p className="font-medium">更新了 "Web Search"</p>
                    <p className="text-xs text-base-content/60">2 小时前</p>
                </div>
            </li>
            <li className="step">
                <div className="text-left ml-2">
                    <p className="font-medium">完成安全扫描</p>
                    <p className="text-xs text-base-content/60">昨天</p>
                </div>
            </li>
            <li className="step">
                <div className="text-left ml-2">
                    <p className="font-medium">系统自动更新</p>
                    <p className="text-xs text-base-content/60">3 天前</p>
                </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
