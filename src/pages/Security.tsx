import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldCheck, ShieldAlert, RefreshCw, AlertTriangle, XCircle } from 'lucide-react';
import { useSkillStore } from '../store/useSkillStore';
import { invoke } from '@tauri-apps/api/core';
import SecurityReportCard from '../components/SecurityReportCard';

interface SecurityIssue {
  ruleId: string;
  ruleName: string;
  file: string;
  line: number;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  confidence: 'low' | 'medium' | 'high';
}

interface SecurityReport {
  skillId: string;
  score: number;
  level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  issues: SecurityIssue[];
  blocked: boolean;
  recommendations: string[];
  scannedFiles: string[];
}

const Security = () => {
  const { t, i18n } = useTranslation();
  const { installedSkills } = useSkillStore();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SecurityReport | null>(null);

  const handleScan = async () => {
    setScanning(true);
    try {
      const result: SecurityReport[] = await invoke('scan_all_skills_security');
      setReports(result);
      setLastScan(new Date());
    } catch (error) {
      console.error('Security scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    // 首次加载时自动扫描
    if (installedSkills.length > 0 && reports.length === 0) {
      handleScan();
    }
  }, [installedSkills]);

  const totalIssues = reports.reduce((sum, r) => sum + r.issues.length, 0);
  const criticalCount = reports.filter(r => r.level === 'critical' || r.blocked).length;
  const highCount = reports.filter(r => r.level === 'high').length;
  const safeCount = reports.filter(r => r.level === 'safe' || r.level === 'low').length;

  const getOverallStatus = () => {
    if (criticalCount > 0) return { text: t('securityStatusAtRisk'), color: 'text-error', icon: XCircle };
    if (highCount > 0) return { text: t('securityStatusAttention'), color: 'text-warning', icon: AlertTriangle };
    return { text: t('safe'), color: 'text-success', icon: ShieldCheck };
  };

  const overallStatus = getOverallStatus();
  const StatusIcon = overallStatus.icon;

  const getReportForSkill = (skillPath: string) => {
    return reports.find(r => skillPath.includes(r.skillId) || r.skillId === skillPath.split(/[\\/]/).pop());
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <span className="badge badge-error badge-sm">{t('critical')}</span>;
      case 'high':
        return <span className="badge badge-error badge-sm">{t('high')}</span>;
      case 'medium':
        return <span className="badge badge-warning badge-sm">{t('medium')}</span>;
      case 'low':
        return <span className="badge badge-info badge-sm">{t('low')}</span>;
      case 'safe':
        return <span className="badge badge-success badge-sm">{t('safe')}</span>;
      default:
        return <span className="badge badge-ghost badge-sm">{t('unknown')}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {t('securityCenterTitle')}
          </h2>
          <p className="text-base-content/60">
            {t('securityCenterDesc')}
          </p>
        </div>
        <button
          className={`btn btn-primary gap-2`}
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <RefreshCw size={18} />
          )}
          {scanning
            ? t('scanning')
            : t('scanNow')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body items-center text-center py-4">
            <StatusIcon size={40} className={`${overallStatus.color} mb-1`} />
            <h3 className="font-semibold text-sm">
              {t('systemStatus')}
            </h3>
            <p className={`${overallStatus.color} font-medium`}>{overallStatus.text}</p>
            {lastScan && (
              <p className="text-xs text-base-content/50">
                {t('lastScan')}: {lastScan.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body items-center text-center py-4">
            <Shield size={40} className="text-info mb-1" />
            <h3 className="font-semibold text-sm">
              {i18n.language === 'zh' ? '已扫描' : 'Scanned'}
            </h3>
            <p className="text-2xl font-bold">{reports.length}</p>
            <p className="text-xs text-base-content/50">
              {i18n.language === 'zh' ? 'Skills' : 'Skills'}
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body items-center text-center py-4">
            <ShieldCheck size={40} className="text-success mb-1" />
            <h3 className="font-semibold text-sm">
              {i18n.language === 'zh' ? '安全' : 'Safe'}
            </h3>
            <p className="text-2xl font-bold text-success">{safeCount}</p>
            <p className="text-xs text-base-content/50">
              {i18n.language === 'zh' ? '无风险' : 'No risks'}
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body items-center text-center py-4">
            <ShieldAlert size={40} className="text-error mb-1" />
            <h3 className="font-semibold text-sm">
              {t('issuesFound')}
            </h3>
            <p className="text-2xl font-bold text-error">{totalIssues}</p>
            <p className="text-xs text-base-content/50">
              {criticalCount > 0 && <span className="text-error">{criticalCount} {t('critical')}</span>}
            </p>
          </div>
        </div>
      </div>

      {selectedReport && (
        <SecurityReportCard
          report={{
            skillId: selectedReport.skillId,
            score: selectedReport.score,
            level: selectedReport.level,
            issues: selectedReport.issues.map(issue => {
              // 映射 severity: low/medium/high/critical -> info/warning/error/critical
              const severityMap: Record<string, 'critical' | 'error' | 'warning' | 'info'> = {
                critical: 'critical',
                high: 'error',
                medium: 'warning',
                low: 'info'
              };
              return {
                severity: severityMap[issue.severity] || 'info',
                category: issue.category,
                description: issue.description,
                lineNumber: issue.line,
                codeSnippet: issue.code,
                filePath: issue.file,
                confidence: issue.confidence,
              };
            }),
            recommendations: selectedReport.recommendations,
            blocked: selectedReport.blocked,
            scannedFiles: selectedReport.scannedFiles,
          }}
          onClose={() => setSelectedReport(null)}
        />
      )}

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h3 className="card-title mb-4">
            {t('scanResults')}
          </h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>{t('score')}</th>
                  <th>{t('riskLevel')}</th>
                  <th>{t('issues')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {installedSkills.map(skill => {
                  const report = getReportForSkill(skill.localPath || skill.id);
                  return (
                    <tr key={skill.id}>
                      <td className="font-medium">{skill.name}</td>
                      <td>
                        {report ? (
                          <span className={`font-bold ${
                            report.score >= 90 ? 'text-success' :
                            report.score >= 70 ? 'text-warning' :
                            'text-error'
                          }`}>
                            {report.score}
                          </span>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td>
                        {report ? (
                          getLevelBadge(report.level)
                        ) : (
                          <span className="badge badge-ghost badge-sm">
                            {t('notScanned')}
                          </span>
                        )}
                      </td>
                      <td>
                        {report ? (
                          <span className={report.issues.length > 0 ? 'text-warning font-medium' : ''}>
                            {report.issues.length}
                          </span>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td>
                        {report && (
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => setSelectedReport(report)}
                          >
                            {t('viewReport')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {installedSkills.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-base-content/50 py-8">
                      {t('noSkillsInstalled')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
