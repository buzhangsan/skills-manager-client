import { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { useSkillStore } from '../store/useSkillStore';

const Security = () => {
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
             <h2 className="text-2xl font-bold">安全中心</h2>
             <p className="text-base-content/60">扫描并监控您的 Skills 以发现潜在漏洞</p>
        </div>
        <button
            className={`btn btn-primary gap-2 ${scanning ? 'loading' : ''}`}
            onClick={handleScan}
            disabled={scanning}
        >
            {!scanning && <RefreshCw size={18} />}
            {scanning ? '正在扫描...' : '立即扫描'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body items-center text-center">
                <ShieldCheck size={48} className="text-success mb-2" />
                <h3 className="card-title">系统状态</h3>
                <p className="text-success font-medium">安全</p>
                <p className="text-xs text-base-content/50">上次扫描: {lastScan?.toLocaleTimeString()}</p>
            </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body items-center text-center">
                <Shield size={48} className="text-info mb-2" />
                <h3 className="card-title">已扫描 Skills</h3>
                <p className="text-2xl font-bold">{installedSkills.length}</p>
                <p className="text-xs text-base-content/50">总安装数</p>
            </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body items-center text-center">
                <ShieldAlert size={48} className="text-warning mb-2" />
                <h3 className="card-title">发现风险</h3>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-base-content/50">需要处理</p>
            </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
            <h3 className="card-title mb-4">扫描结果</h3>
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Skill</th>
                            <th>状态</th>
                            <th>上次检查</th>
                            <th>详情</th>
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
                                            <span>通过</span>
                                        </div>
                                    )}
                                    {skill.status === 'unsafe' && (
                                        <div className="flex items-center gap-2 text-error">
                                            <ShieldAlert size={16} />
                                            <span>高风险</span>
                                        </div>
                                    )}
                                    {skill.status === 'unknown' && (
                                        <div className="flex items-center gap-2 text-warning">
                                            <Shield size={16} />
                                            <span>未验证</span>
                                        </div>
                                    )}
                                </td>
                                <td>{new Date().toLocaleDateString()}</td>
                                <td><button className="btn btn-xs btn-ghost">查看报告</button></td>
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
