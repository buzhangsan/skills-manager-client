/**
 * 安全扫描引擎
 * 基于规则库对 Skill 文件进行安全扫描
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getAllRules, getHardTriggerRules, Severity, Category } from './rules.js';

/**
 * 安全扫描器类
 */
export class SecurityScanner {
  constructor() {
    this.rules = getAllRules();
    this.hardTriggerRules = getHardTriggerRules();
  }

  /**
   * 扫描目录下的所有文件
   * @param {string} dirPath - 要扫描的目录路径
   * @param {string} skillId - Skill ID
   * @returns {Object} 安全报告
   */
  async scanDirectory(dirPath, skillId) {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`目录不存在: ${dirPath}`);
    }

    const allIssues = [];
    const allMatches = [];
    const scannedFiles = [];
    const hardTriggerIssues = [];
    let blocked = false;

    // 递归读取目录下的所有文件
    const files = this._getAllFiles(dirPath);

    for (const filePath of files) {
      const fileName = path.relative(dirPath, filePath);

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        scannedFiles.push(fileName);

        // 扫描文件内容
        const lines = content.split('\n');
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const line = lines[lineNum];

          for (const rule of this.rules) {
            if (rule.pattern.test(line)) {
              const match = {
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                category: rule.category,
                weight: rule.weight,
                description: rule.description,
                hardTrigger: rule.hardTrigger,
                lineNumber: lineNum + 1,
                codeSnippet: line.trim(),
                confidence: rule.confidence,
                remediation: rule.remediation,
                cweId: rule.cweId
              };

              allMatches.push(match);

              // 检查硬触发
              if (match.hardTrigger) {
                blocked = true;
                hardTriggerIssues.push({
                  ruleName: match.ruleName,
                  file: fileName,
                  line: match.lineNumber,
                  description: match.description,
                  code: match.codeSnippet
                });
              }

              // 转换为安全问题
              allIssues.push({
                severity: this._mapSeverity(match.severity),
                category: this._mapCategory(match.category),
                description: `${match.ruleName}: ${match.description}`,
                lineNumber: match.lineNumber,
                codeSnippet: match.codeSnippet,
                filePath: fileName,
                confidence: match.confidence,
                remediation: match.remediation,
                cweId: match.cweId
              });
            }
          }
        }
      } catch (error) {
        console.warn(`无法读取文件 ${filePath}:`, error.message);
      }
    }

    // 计算安全评分
    const score = this._calculateScoreWeighted(allMatches);
    const level = this._getSecurityLevel(score);

    // 生成建议
    const recommendations = this._generateRecommendations(allMatches, score);

    return {
      skillId,
      score,
      level,
      issues: allIssues,
      recommendations,
      blocked,
      hardTriggerIssues,
      scannedFiles,
      summary: this._generateSummary(allMatches, score, blocked)
    };
  }

  /**
   * 扫描单个文件
   * @param {string} content - 文件内容
   * @param {string} filePath - 文件路径
   * @returns {Object} 安全报告
   */
  scanFile(content, filePath) {
    const matches = [];
    const lines = content.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      for (const rule of this.rules) {
        if (rule.pattern.test(line)) {
          matches.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            category: rule.category,
            weight: rule.weight,
            description: rule.description,
            hardTrigger: rule.hardTrigger,
            lineNumber: lineNum + 1,
            codeSnippet: line.trim(),
            confidence: rule.confidence,
            remediation: rule.remediation,
            cweId: rule.cweId
          });
        }
      }
    }

    // 转换为安全问题
    const issues = matches.map(m => ({
      severity: this._mapSeverity(m.severity),
      category: this._mapCategory(m.category),
      description: `${m.ruleName}: ${m.description}`,
      lineNumber: m.lineNumber,
      codeSnippet: m.codeSnippet,
      filePath,
      confidence: m.confidence,
      remediation: m.remediation,
      cweId: m.cweId
    }));

    // 检查硬触发
    const hardTriggerMatches = matches.filter(m => m.hardTrigger);
    const blocked = hardTriggerMatches.length > 0;
    const hardTriggerIssues = hardTriggerMatches.map(m => ({
      ruleName: m.ruleName,
      file: filePath,
      line: m.lineNumber,
      description: m.description,
      code: m.codeSnippet
    }));

    // 计算评分
    const score = this._calculateScoreWeighted(matches);
    const level = this._getSecurityLevel(score);
    const recommendations = this._generateRecommendations(matches, score);

    return {
      skillId: filePath,
      score,
      level,
      issues,
      recommendations,
      blocked,
      hardTriggerIssues,
      scannedFiles: [filePath],
      summary: this._generateSummary(matches, score, blocked)
    };
  }

  /**
   * 计算文件校验和
   * @param {Buffer|string} content - 文件内容
   * @returns {string} SHA256 校验和
   */
  calculateChecksum(content) {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * 基于权重计算安全评分 (0-100)
   */
  _calculateScoreWeighted(matches) {
    let baseScore = 100;

    for (const match of matches) {
      baseScore -= match.weight;
    }

    return Math.max(0, baseScore);
  }

  /**
   * 根据评分获取安全等级
   */
  _getSecurityLevel(score) {
    if (score >= 90) return 'safe';
    if (score >= 70) return 'low';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'high';
    return 'critical';
  }

  /**
   * 映射严重程度
   */
  _mapSeverity(severity) {
    const mapping = {
      [Severity.CRITICAL]: 'critical',
      [Severity.HIGH]: 'error',
      [Severity.MEDIUM]: 'warning',
      [Severity.LOW]: 'info'
    };
    return mapping[severity] || 'info';
  }

  /**
   * 映射类别
   */
  _mapCategory(category) {
    const mapping = {
      [Category.DESTRUCTIVE]: 'filesystem',
      [Category.REMOTE_EXEC]: 'process_execution',
      [Category.CMD_INJECTION]: 'dangerous_function',
      [Category.NETWORK]: 'network',
      [Category.PRIVILEGE]: 'process_execution',
      [Category.SECRETS]: 'data_exfiltration',
      [Category.PERSISTENCE]: 'process_execution',
      [Category.SENSITIVE_FILE_ACCESS]: 'filesystem'
    };
    return mapping[category] || 'other';
  }

  /**
   * 生成安全建议
   */
  _generateRecommendations(matches, score) {
    const recommendations = [];

    // 检查硬触发
    const hardTriggers = matches.filter(m => m.hardTrigger);
    if (hardTriggers.length > 0) {
      recommendations.push('⛔ 检测到严重安全风险，已阻止安装！');
      hardTriggers.forEach(m => {
        recommendations.push(`  • ${m.description}`);
      });
      return recommendations;
    }

    // 基于分数的建议
    if (score < 50) {
      recommendations.push('⚠️  该 Skill 存在严重安全风险，强烈建议不要安装');
    } else if (score < 70) {
      recommendations.push('⚠️  该 Skill 存在中等安全风险，请谨慎安装');
    } else if (score < 90) {
      recommendations.push('ℹ️  该 Skill 存在轻微安全风险，建议审查后再安装');
    } else {
      recommendations.push('✅ 该 Skill 未发现明显安全风险');
    }

    // 按类别提供建议
    const categories = new Set(matches.map(m => m.category));

    if (categories.has(Category.DESTRUCTIVE)) {
      recommendations.push('⚠️  包含破坏性操作，可能删除或修改重要文件');
    }
    if (categories.has(Category.REMOTE_EXEC)) {
      recommendations.push('⚠️  包含远程代码执行，可能下载并执行未知脚本');
    }
    if (categories.has(Category.CMD_INJECTION)) {
      recommendations.push('⚠️  使用了动态代码执行，可能存在代码注入风险');
    }
    if (categories.has(Category.NETWORK)) {
      recommendations.push('ℹ️  包含网络请求，请确认目标地址可信');
    }
    if (categories.has(Category.SECRETS)) {
      recommendations.push('⚠️  检测到硬编码的敏感信息（密钥、密码等）');
    }
    if (categories.has(Category.PRIVILEGE)) {
      recommendations.push('⚠️  可能尝试提升权限，请谨慎');
    }
    if (categories.has(Category.PERSISTENCE)) {
      recommendations.push('⚠️  包含持久化机制（定时任务、自启动等）');
    }
    if (categories.has(Category.SENSITIVE_FILE_ACCESS)) {
      recommendations.push('ℹ️  访问敏感文件，请确认必要性');
    }

    return recommendations;
  }

  /**
   * 生成扫描摘要
   */
  _generateSummary(matches, score, blocked) {
    const criticalCount = matches.filter(m => m.severity === Severity.CRITICAL).length;
    const highCount = matches.filter(m => m.severity === Severity.HIGH).length;
    const mediumCount = matches.filter(m => m.severity === Severity.MEDIUM).length;
    const lowCount = matches.filter(m => m.severity === Severity.LOW).length;

    return {
      totalIssues: matches.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      score,
      blocked,
      level: this._getSecurityLevel(score)
    };
  }

  /**
   * 递归获取目录下所有文件
   */
  _getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const fullPath = path.join(dirPath, file);

      if (fs.statSync(fullPath).isDirectory()) {
        // 跳过 node_modules, .git 等目录
        if (!['node_modules', '.git', '.svn', '__pycache__', 'dist', 'build'].includes(file)) {
          arrayOfFiles = this._getAllFiles(fullPath, arrayOfFiles);
        }
      } else {
        // 只扫描文本文件
        const ext = path.extname(file).toLowerCase();
        const textExtensions = ['.md', '.py', '.js', '.ts', '.sh', '.bash', '.zsh', '.yml', '.yaml', '.json', '.txt', '.jsx', '.tsx'];
        if (textExtensions.includes(ext) || file === 'SKILL.md') {
          arrayOfFiles.push(fullPath);
        }
      }
    });

    return arrayOfFiles;
  }
}

// 导出单例
export default new SecurityScanner();
