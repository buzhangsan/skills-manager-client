/**
 * GitHub 更新检查器
 * 检查应用程序和数据库的更新
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';

const APP_VERSION = '1.0.0';

/**
 * 从 GitHub API 获取最新 release 信息
 */
function getLatestRelease(owner, repo) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/releases/latest`,
      method: 'GET',
      headers: {
        'User-Agent': 'Skill-Manager'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const release = JSON.parse(data);
            resolve(release);
          } catch (error) {
            reject(new Error('Failed to parse GitHub response'));
          }
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * 比较版本号
 * @returns {number} 1: v1 > v2, -1: v1 < v2, 0: v1 === v2
 */
function compareVersions(v1, v2) {
  const normalize = (v) => v.replace(/^v/, '').split('.').map(Number);
  const parts1 = normalize(v1);
  const parts2 = normalize(v2);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * 检查应用更新
 */
export async function checkAppUpdate(githubRepo) {
  try {
    const [owner, repo] = githubRepo.split('/');
    const release = await getLatestRelease(owner, repo);

    const latestVersion = release.tag_name.replace(/^v/, '');
    const hasUpdate = compareVersions(latestVersion, APP_VERSION) > 0;

    return {
      hasUpdate,
      currentVersion: APP_VERSION,
      latestVersion,
      releaseNotes: release.body,
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
      assets: release.assets.map(asset => ({
        name: asset.name,
        downloadUrl: asset.browser_download_url,
        size: asset.size,
        platform: detectPlatform(asset.name)
      }))
    };
  } catch (error) {
    console.error('Failed to check app update:', error);
    return {
      hasUpdate: false,
      error: error.message
    };
  }
}

/**
 * 检测安装包平台
 */
function detectPlatform(filename) {
  if (filename.includes('win') || filename.endsWith('.exe') || filename.endsWith('.msi')) {
    return 'windows';
  }
  if (filename.includes('mac') || filename.includes('darwin') || filename.endsWith('.dmg')) {
    return 'macos';
  }
  if (filename.includes('linux') || filename.endsWith('.AppImage') || filename.endsWith('.deb')) {
    return 'linux';
  }
  return 'unknown';
}

/**
 * 检查数据库(Skills规则库)更新
 */
export async function checkDatabaseUpdate(githubRepo, currentDbPath) {
  try {
    const [owner, repo] = githubRepo.split('/');

    // 获取远程文件的最后提交时间
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/commits?path=server/security/rules.js&per_page=1`,
      method: 'GET',
      headers: {
        'User-Agent': 'Skill-Manager'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const commits = JSON.parse(data);
              if (commits.length > 0) {
                const latestCommit = commits[0];
                const remoteUpdatedAt = new Date(latestCommit.commit.committer.date);

                // 检查本地文件时间
                let localUpdatedAt = null;
                if (fs.existsSync(currentDbPath)) {
                  const stats = fs.statSync(currentDbPath);
                  localUpdatedAt = stats.mtime;
                }

                const hasUpdate = !localUpdatedAt || remoteUpdatedAt > localUpdatedAt;

                resolve({
                  hasUpdate,
                  localUpdatedAt: localUpdatedAt ? localUpdatedAt.toISOString() : null,
                  remoteUpdatedAt: remoteUpdatedAt.toISOString(),
                  commitMessage: latestCommit.commit.message,
                  commitUrl: latestCommit.html_url
                });
              } else {
                resolve({ hasUpdate: false });
              }
            } catch (error) {
              reject(new Error('Failed to parse GitHub response'));
            }
          } else {
            reject(new Error(`GitHub API returned status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  } catch (error) {
    console.error('Failed to check database update:', error);
    return {
      hasUpdate: false,
      error: error.message
    };
  }
}

/**
 * 下载并更新数据库文件
 */
export async function updateDatabase(githubRepo, targetPath) {
  try {
    const [owner, repo] = githubRepo.split('/');
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/server/security/rules.js`;

    return new Promise((resolve, reject) => {
      const req = https.get(rawUrl, (res) => {
        if (res.statusCode === 200) {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              // 备份原文件
              if (fs.existsSync(targetPath)) {
                const backupPath = `${targetPath}.backup`;
                fs.copyFileSync(targetPath, backupPath);
              }

              // 写入新文件
              fs.writeFileSync(targetPath, data, 'utf8');

              resolve({
                success: true,
                message: 'Database updated successfully',
                backupCreated: true
              });
            } catch (error) {
              reject(error);
            }
          });
        } else {
          reject(new Error(`Failed to download file: ${res.statusCode}`));
        }
      });

      req.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Failed to update database:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 获取当前系统平台
 */
export function getCurrentPlatform() {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  if (platform === 'linux') return 'linux';
  return 'unknown';
}

export default {
  checkAppUpdate,
  checkDatabaseUpdate,
  updateDatabase,
  getCurrentPlatform,
  APP_VERSION
};
