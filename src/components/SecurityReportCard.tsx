import { Shield, AlertTriangle, CheckCircle, XCircle, Info, FileWarning } from 'lucide-react';

interface SecurityIssue {
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: string;
  description: string;
  lineNumber?: number;
  codeSnippet?: string;
  filePath?: string;
  confidence?: 'high' | 'medium' | 'low';
  remediation?: string;
  cweId?: string;
}

interface SecurityReport {
  skillId: string;
  score: number;
  level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  issues: SecurityIssue[];
  recommendations: string[];
  blocked: boolean;
  hardTriggerIssues?: Array<{
    ruleName: string;
    file: string;
    line: number;
    description: string;
    code: string;
  }>;
  scannedFiles: string[];
  summary?: {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    score: number;
    blocked: boolean;
    level: string;
  };
}

interface SecurityReportCardProps {
  report: SecurityReport | null;
  loading?: boolean;
  onClose?: () => void;
}

export default function SecurityReportCard({ report, loading, onClose }: SecurityReportCardProps) {
  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-3">
            <span className="loading loading-spinner loading-md"></span>
            <span>正在执行安全扫描...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    if (score >= 50) return 'text-warning';
    return 'text-error';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'badge-success';
    if (score >= 70) return 'badge-warning';
    if (score >= 50) return 'badge-warning';
    return 'badge-error';
  };

  const getLevelText = (level: string) => {
    const levels = {
      safe: '安全',
      low: '低风险',
      medium: '中等风险',
      high: '高风险',
      critical: '严重风险'
    };
    return levels[level as keyof typeof levels] || level;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-error" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-error" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-info" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityText = (severity: string) => {
    const severities = {
      critical: '严重',
      error: '错误',
      warning: '警告',
      info: '信息'
    };
    return severities[severity as keyof typeof severities] || severity;
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h3 className="card-title text-lg">安全扫描报告</h3>
              <p className="text-sm text-base-content/60">{report.skillId}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              ✕
            </button>
          )}
        </div>

        {/* Blocked Warning */}
        {report.blocked && (
          <div className="alert alert-error mb-4">
            <XCircle className="w-6 h-6" />
            <div>
              <h4 className="font-bold">检测到严重安全风险，已阻止安装！</h4>
              <div className="text-sm mt-2">
                {report.hardTriggerIssues?.map((issue, idx) => (
                  <div key={idx} className="mt-1">
                    <strong>{issue.ruleName}</strong> ({issue.file}:{issue.line})
                    <div className="text-xs opacity-80">{issue.description}</div>
                    {issue.code && (
                      <code className="block bg-base-300 px-2 py-1 rounded mt-1 text-xs">
                        {issue.code}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Score and Level */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="stat bg-base-200 rounded-box">
            <div className="stat-title">安全评分</div>
            <div className={`stat-value ${getScoreColor(report.score)}`}>
              {report.score}
            </div>
            <div className="stat-desc">满分 100</div>
          </div>
          <div className="stat bg-base-200 rounded-box">
            <div className="stat-title">风险等级</div>
            <div className="stat-value text-2xl">
              <span className={`badge ${getScoreBadge(report.score)} badge-lg`}>
                {getLevelText(report.level)}
              </span>
            </div>
            <div className="stat-desc">
              {report.scannedFiles.length} 个文件已扫描
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {report.summary && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="stat bg-error/10 rounded-box py-2">
              <div className="stat-title text-xs">严重</div>
              <div className="stat-value text-lg text-error">
                {report.summary.criticalCount}
              </div>
            </div>
            <div className="stat bg-error/10 rounded-box py-2">
              <div className="stat-title text-xs">高危</div>
              <div className="stat-value text-lg text-error">
                {report.summary.highCount}
              </div>
            </div>
            <div className="stat bg-warning/10 rounded-box py-2">
              <div className="stat-title text-xs">中危</div>
              <div className="stat-value text-lg text-warning">
                {report.summary.mediumCount}
              </div>
            </div>
            <div className="stat bg-info/10 rounded-box py-2">
              <div className="stat-title text-xs">低危</div>
              <div className="stat-value text-lg text-info">
                {report.summary.lowCount}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileWarning className="w-5 h-5" />
              安全建议
            </h4>
            <ul className="space-y-1">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="opacity-60">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Issues List */}
        {report.issues.length > 0 && (
          <div className="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div className="collapse-title font-medium flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              安全问题详情 ({report.issues.length})
            </div>
            <div className="collapse-content">
              <div className="space-y-3 mt-2 max-h-96 overflow-y-auto">
                {report.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="border border-base-300 rounded-lg p-3 bg-base-100"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {issue.description}
                          </span>
                          <span className={`badge badge-sm ${
                            issue.severity === 'critical' || issue.severity === 'error'
                              ? 'badge-error'
                              : issue.severity === 'warning'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}>
                            {getSeverityText(issue.severity)}
                          </span>
                          {issue.confidence && (
                            <span className="badge badge-sm badge-outline">
                              置信度: {issue.confidence}
                            </span>
                          )}
                        </div>
                        {issue.filePath && (
                          <div className="text-xs text-base-content/60">
                            📄 {issue.filePath}
                            {issue.lineNumber && `:${issue.lineNumber}`}
                          </div>
                        )}
                        {issue.codeSnippet && (
                          <code className="block bg-base-300 px-2 py-1 rounded mt-2 text-xs overflow-x-auto">
                            {issue.codeSnippet}
                          </code>
                        )}
                        {issue.remediation && (
                          <div className="mt-2 text-xs bg-info/10 p-2 rounded">
                            <strong>修复建议:</strong> {issue.remediation}
                          </div>
                        )}
                        {issue.cweId && (
                          <div className="mt-1 text-xs text-base-content/40">
                            {issue.cweId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Issues */}
        {report.issues.length === 0 && !report.blocked && (
          <div className="alert alert-success">
            <CheckCircle className="w-6 h-6" />
            <span>未发现明显安全风险，该 Skill 看起来是安全的！</span>
          </div>
        )}
      </div>
    </div>
  );
}
