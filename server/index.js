import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import yaml from 'yamljs';
import { glob } from 'glob';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import fse from 'fs-extra';
import securityScanner from './security/scanner.js';
import updateChecker from './update/checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/', (req, res) => {
  res.json({
    name: 'Skill Manager API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      scan: 'GET /api/skills/scan',
      importGithub: 'POST /api/skills/import/github',
      importLocal: 'POST /api/skills/import/local',
      scanSecurity: 'POST /api/skills/scan-security',
      scanAllSecurity: 'POST /api/skills/scan-all-security',
      getConfig: 'GET /api/config',
      saveConfig: 'POST /api/config',
      getProjectPaths: 'GET /api/config/project-paths',
      saveProjectPaths: 'POST /api/config/project-paths',
      checkUpdate: 'GET /api/update/check',
      performUpdate: 'POST /api/update/perform'
    }
  });
});

// API健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取系统级 skill 目录（兼容不同操作系统）
function getSystemSkillPath() {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === 'win32') {
    return path.join(homeDir, '.claude', 'skills');
  } else if (platform === 'darwin') {
    return path.join(homeDir, '.claude', 'skills');
  } else {
    // Linux
    return path.join(homeDir, '.claude', 'skills');
  }
}

// 读取完整配置
function getConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading config:', error);
  }
  return {
    projectPaths: [],
    defaultInstallLocation: 'system', // 'system' or 'project'
    defaultProjectPath: null,
    updatedAt: new Date().toISOString()
  };
}

// 保存配置
function saveConfig(config) {
  const configPath = path.join(__dirname, 'config.json');
  const updatedConfig = {
    ...config,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf8');
}

// 读取配置文件中的项目路径
function getProjectPaths() {
  const config = getConfig();
  return config.projectPaths || [];
}

// 保存项目路径配置
function saveProjectPaths(paths) {
  const config = getConfig();
  config.projectPaths = paths;
  saveConfig(config);
}

// 获取默认安装路径
function getDefaultInstallPath() {
  const config = getConfig();
  if (config.defaultInstallLocation === 'project' && config.defaultProjectPath) {
    return path.join(config.defaultProjectPath, '.claude', 'skills');
  }
  return getSystemSkillPath();
}

// 解析 SKILL.md 文件
function parseSkillMd(skillMdPath) {
  try {
    const content = fs.readFileSync(skillMdPath, 'utf8');

    // 提取 YAML frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);

    if (frontmatterMatch) {
      // 有 YAML frontmatter，正常解析
      const yamlContent = frontmatterMatch[1];
      const metadata = yaml.parse(yamlContent);
      return metadata;
    } else {
      // 没有 frontmatter，从 markdown 内容提取
      console.log(`No frontmatter found in ${skillMdPath}, extracting from markdown...`);

      // 提取第一个 # 标题作为名称
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const name = titleMatch ? titleMatch[1].trim() : path.basename(path.dirname(skillMdPath));

      // 提取第一段文字作为描述
      const lines = content.split('\n');
      let description = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // 跳过标题和空行
        if (line && !line.startsWith('#') && !line.startsWith('```')) {
          description = line;
          break;
        }
      }

      return {
        name: name,
        description: description || 'No description available',
        version: '1.0.0',
        author: 'Unknown'
      };
    }
  } catch (error) {
    console.error(`Error parsing ${skillMdPath}:`, error.message);
    return null;
  }
}

// 扫描指定目录下的所有 skills
async function scanSkillsInDirectory(directory, type = 'system') {
  const skills = [];

  if (!fs.existsSync(directory)) {
    console.log(`Directory does not exist: ${directory}`);
    return skills;
  }

  try {
    // 查找所有 SKILL.md 文件（支持大小写不敏感）
    const pattern = path.join(directory, '**', 'SKILL.md').replace(/\\/g, '/');
    console.log(`Searching pattern: ${pattern}`);
    const skillFiles = await glob(pattern, { nocase: true });

    console.log(`Found ${skillFiles.length} SKILL.md files in ${directory}`);
    skillFiles.forEach(f => console.log(`  - ${f}`));

    for (const skillFile of skillFiles) {
      const metadata = parseSkillMd(skillFile);
      if (metadata) {
        const skillDir = path.dirname(skillFile);
        const skillName = path.basename(skillDir);

        // 使用路径作为唯一ID，避免重复
        const uniqueId = `${type}-${skillDir.replace(/[\\\/:.]/g, '-')}`;

        skills.push({
          id: uniqueId,
          name: metadata.name || skillName,
          description: metadata.description || 'No description',
          author: metadata.author || 'Unknown',
          version: metadata.version || '1.0.0',
          localPath: skillDir,
          installDate: fs.statSync(skillFile).mtime.getTime(),
          status: 'unknown',
          type: type,
          metadata: metadata
        });

        console.log(`Added skill: ${metadata.name || skillName}`);
      } else {
        console.log(`Failed to parse metadata from: ${skillFile}`);
      }
    }
  } catch (error) {
    console.error(`Error scanning ${directory}:`, error.message);
  }

  console.log(`Total skills found in ${directory}: ${skills.length}`);
  return skills;
}

// API: 扫描本地已安装的 skills
app.get('/api/skills/scan', async (req, res) => {
  try {
    const systemPath = getSystemSkillPath();
    const projectPaths = getProjectPaths();

    console.log('Scanning system skills from:', systemPath);
    console.log('Scanning project skills from:', projectPaths);

    // 扫描系统级 skills
    const systemSkills = await scanSkillsInDirectory(systemPath, 'system');

    // 扫描所有项目级 skills
    let projectSkills = [];
    for (const projectPath of projectPaths) {
      const skillDir = path.join(projectPath, '.claude', 'skills');
      const skills = await scanSkillsInDirectory(skillDir, 'project');
      projectSkills = projectSkills.concat(skills);
    }

    res.json({
      success: true,
      data: {
        systemSkills,
        projectSkills,
        total: systemSkills.length + projectSkills.length,
        systemPath,
        projectPaths
      }
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 获取完整配置
app.get('/api/config', (req, res) => {
  const config = getConfig();
  res.json({
    success: true,
    data: config
  });
});

// API: 保存完整配置
app.post('/api/config', (req, res) => {
  try {
    const config = req.body;
    saveConfig(config);
    res.json({
      success: true,
      message: 'Configuration saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 获取配置的项目路径
app.get('/api/config/project-paths', (req, res) => {
  const paths = getProjectPaths();
  res.json({
    success: true,
    data: paths
  });
});

// API: 保存项目路径配置
app.post('/api/config/project-paths', (req, res) => {
  try {
    const { paths } = req.body;
    saveProjectPaths(paths);
    res.json({
      success: true,
      message: 'Project paths saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 从 GitHub URL 导入 skill (带安全扫描)
app.post('/api/skills/import/github', async (req, res) => {
  try {
    const { url, installPath, skipSecurityCheck } = req.body;

    // 解析 GitHub URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub URL'
      });
    }

    const [, owner, repo] = match;
    const skillName = repo.replace(/\.git$/, '');
    // 使用提供的路径，否则使用默认路径
    const targetPath = path.join(installPath || getDefaultInstallPath(), skillName);

    // 使用 git clone
    execSync(`git clone "${url}" "${targetPath}"`, { stdio: 'inherit' });

    // 执行安全扫描 (除非明确跳过)
    let securityReport = null;
    if (!skipSecurityCheck) {
      try {
        console.log(`Running security scan on imported skill: ${targetPath}`);
        securityReport = await securityScanner.scanDirectory(targetPath, skillName);

        // 如果被阻止，删除已导入的文件
        if (securityReport.blocked) {
          console.warn(`Security check failed for ${skillName}, removing...`);
          fse.removeSync(targetPath);

          return res.status(403).json({
            success: false,
            blocked: true,
            error: '检测到严重安全风险，已阻止安装',
            securityReport
          });
        }
      } catch (scanError) {
        console.error('Security scan error:', scanError);
        // 扫描失败不阻止安装，但返回警告
        securityReport = {
          error: scanError.message,
          score: 0,
          level: 'unknown'
        };
      }
    }

    res.json({
      success: true,
      message: `Skill imported successfully to ${targetPath}`,
      path: targetPath,
      securityReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 从本地路径导入 skill (带安全扫描)
app.post('/api/skills/import/local', async (req, res) => {
  try {
    const { sourcePath, installPath, skipSecurityCheck } = req.body;

    if (!fs.existsSync(sourcePath)) {
      return res.status(400).json({
        success: false,
        error: 'Source path does not exist'
      });
    }

    const skillName = path.basename(sourcePath);
    // 使用提供的路径，否则使用默认路径
    const targetPath = path.join(installPath || getDefaultInstallPath(), skillName);

    // 先扫描源路径 (如果未跳过)
    let securityReport = null;
    if (!skipSecurityCheck) {
      try {
        console.log(`Running security scan on local skill: ${sourcePath}`);
        securityReport = await securityScanner.scanDirectory(sourcePath, skillName);

        // 如果被阻止，不执行复制
        if (securityReport.blocked) {
          return res.status(403).json({
            success: false,
            blocked: true,
            error: '检测到严重安全风险，已阻止安装',
            securityReport
          });
        }
      } catch (scanError) {
        console.error('Security scan error:', scanError);
        securityReport = {
          error: scanError.message,
          score: 0,
          level: 'unknown'
        };
      }
    }

    // 复制文件夹
    await fse.copy(sourcePath, targetPath);

    res.json({
      success: true,
      message: `Skill imported successfully to ${targetPath}`,
      path: targetPath,
      securityReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 扫描 Skill 安全性
app.post('/api/skills/scan-security', async (req, res) => {
  try {
    const { skillPath } = req.body;

    if (!skillPath) {
      return res.status(400).json({
        success: false,
        error: 'skillPath parameter is required'
      });
    }

    if (!fs.existsSync(skillPath)) {
      return res.status(404).json({
        success: false,
        error: 'Skill path does not exist'
      });
    }

    console.log(`Scanning skill at: ${skillPath}`);

    // 执行安全扫描
    const report = await securityScanner.scanDirectory(skillPath, path.basename(skillPath));

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Security scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 批量扫描所有已安装的 Skills
app.post('/api/skills/scan-all-security', async (req, res) => {
  try {
    const systemPath = getSystemSkillPath();
    const projectPaths = getProjectPaths();

    console.log('Batch security scanning...');

    const results = [];

    // 扫描系统级 skills
    const systemSkills = await scanSkillsInDirectory(systemPath, 'system');
    for (const skill of systemSkills) {
      try {
        const report = await securityScanner.scanDirectory(skill.localPath, skill.id);
        results.push({
          ...skill,
          securityReport: report
        });
      } catch (error) {
        console.error(`Error scanning ${skill.name}:`, error.message);
        results.push({
          ...skill,
          securityReport: {
            error: error.message,
            score: 0,
            level: 'unknown'
          }
        });
      }
    }

    // 扫描项目级 skills
    for (const projectPath of projectPaths) {
      const skillDir = path.join(projectPath, '.claude', 'skills');
      const projectSkills = await scanSkillsInDirectory(skillDir, 'project');

      for (const skill of projectSkills) {
        try {
          const report = await securityScanner.scanDirectory(skill.localPath, skill.id);
          results.push({
            ...skill,
            securityReport: report
          });
        } catch (error) {
          console.error(`Error scanning ${skill.name}:`, error.message);
          results.push({
            ...skill,
            securityReport: {
              error: error.message,
              score: 0,
              level: 'unknown'
            }
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        total: results.length,
        skills: results
      }
    });
  } catch (error) {
    console.error('Batch scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 读取 SKILL.md 文件内容
app.get('/api/read-skill', (req, res) => {
  try {
    const { path: skillPath } = req.query;

    if (!skillPath) {
      return res.status(400).json({
        success: false,
        error: 'Path parameter is required'
      });
    }

    // 检查文件是否存在
    if (!fs.existsSync(skillPath)) {
      return res.status(404).json({
        success: false,
        error: 'SKILL.md file not found'
      });
    }

    // 读取文件内容
    const content = fs.readFileSync(skillPath, 'utf8');

    // 直接返回纯文本内容
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 检查更新
app.get('/api/update/check', async (req, res) => {
  try {
    const config = getConfig();
    const githubRepo = config.githubRepo || 'YOUR_USERNAME/skill-manager'; // 等待用户提供仓库地址

    // 检查应用更新
    const appUpdate = await updateChecker.checkAppUpdate(githubRepo);

    // 检查数据库(安全规则)更新
    const rulesPath = path.join(__dirname, 'security', 'rules.js');
    const dbUpdate = await updateChecker.checkDatabaseUpdate(githubRepo, rulesPath);

    res.json({
      success: true,
      data: {
        app: appUpdate,
        database: dbUpdate,
        currentPlatform: updateChecker.getCurrentPlatform()
      }
    });
  } catch (error) {
    console.error('Check update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 执行更新
app.post('/api/update/perform', async (req, res) => {
  try {
    const { type } = req.body; // 'app' or 'database'

    if (type === 'database') {
      const config = getConfig();
      const githubRepo = config.githubRepo || 'YOUR_USERNAME/skill-manager';
      const rulesPath = path.join(__dirname, 'security', 'rules.js');

      const result = await updateChecker.updateDatabase(githubRepo, rulesPath);

      res.json({
        success: result.success,
        message: result.message || result.error,
        data: result
      });
    } else if (type === 'app') {
      // 应用更新需要用户手动下载并安装
      res.json({
        success: false,
        message: '应用更新需要手动下载并安装新版本',
        requireManualUpdate: true
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid update type. Must be "app" or "database"'
      });
    }
  } catch (error) {
    console.error('Perform update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Skill Manager API server running on port ${PORT}`);
  console.log(`System skill path: ${getSystemSkillPath()}`);
});
