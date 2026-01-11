#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 解析命令行参数
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node download-skill.js <github-url> <target-path>');
    process.exit(1);
}

const githubUrl = args[0];
const targetPath = args[1];

/**
 * 解析 GitHub URL
 * 支持格式：
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch/path/to/dir
 */
function parseGitHubUrl(url) {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);

    if (parts.length < 2) {
        throw new Error('Invalid GitHub URL');
    }

    const owner = parts[0];
    const repo = parts[1];

    // 检查是否是 tree URL
    if (parts.length > 3 && parts[2] === 'tree') {
        const branch = parts[3];
        const subpath = parts.slice(4).join('/');
        return { owner, repo, branch, subpath };
    }

    return { owner, repo, branch: 'main', subpath: null };
}

/**
 * 下载文件
 */
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const protocol = url.startsWith('https') ? https : http;

        const request = protocol.get(url, {
            headers: {
                'User-Agent': 'Skill-Manager/1.0'
            }
        }, (response) => {
            // 处理重定向
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                fs.unlinkSync(destPath);
                downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(destPath);
                reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });

        request.on('error', (err) => {
            file.close();
            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
            reject(err);
        });

        request.setTimeout(60000, () => {
            request.destroy();
            reject(new Error('Download timeout'));
        });
    });
}

/**
 * 解压 ZIP 文件中的特定目录
 */
async function extractSubdirectory(zipPath, subpath, targetPath) {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // 找到根目录前缀 (通常是 repo-branch/)
    let rootPrefix = '';
    for (const entry of entries) {
        if (entry.entryName.includes('/')) {
            rootPrefix = entry.entryName.split('/')[0] + '/';
            break;
        }
    }

    const targetPrefix = rootPrefix + subpath + '/';
    let extracted = false;

    // 创建目标目录
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
    }

    for (const entry of entries) {
        if (entry.entryName.startsWith(targetPrefix)) {
            const relativePath = entry.entryName.slice(targetPrefix.length);
            if (!relativePath) continue;

            const destPath = path.join(targetPath, relativePath);

            if (entry.isDirectory) {
                if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath, { recursive: true });
                }
            } else {
                const dir = path.dirname(destPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(destPath, entry.getData());
                extracted = true;
            }
        }
    }

    if (!extracted) {
        throw new Error(`Subdirectory not found in archive: ${subpath}`);
    }
}

/**
 * 使用内置 unzip 解压（不依赖 adm-zip）
 */
function extractWithBuiltinUnzip(zipPath, subpath, targetPath) {
    const { execSync } = require('child_process');
    const os = require('os');
    const tempDir = path.join(os.tmpdir(), `skill-extract-${Date.now()}`);

    try {
        fs.mkdirSync(tempDir, { recursive: true });

        // 在 Windows 上使用 PowerShell 解压
        if (process.platform === 'win32') {
            execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`, {
                stdio: 'pipe'
            });
        } else {
            execSync(`unzip -q "${zipPath}" -d "${tempDir}"`, { stdio: 'pipe' });
        }

        // 找到解压后的根目录
        const extractedDirs = fs.readdirSync(tempDir);
        if (extractedDirs.length === 0) {
            throw new Error('Empty archive');
        }

        const rootDir = path.join(tempDir, extractedDirs[0]);
        const sourceDir = path.join(rootDir, subpath);

        if (!fs.existsSync(sourceDir)) {
            throw new Error(`Subdirectory not found: ${subpath}`);
        }

        // 复制到目标目录
        copyDirRecursive(sourceDir, targetPath);

    } finally {
        // 清理临时目录
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}

/**
 * 递归复制目录
 */
function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * 克隆整个仓库
 */
function cloneRepo(owner, repo, branch, targetPath) {
    const cloneUrl = `https://github.com/${owner}/${repo}.git`;

    try {
        execSync(`git clone --depth 1 --branch ${branch} "${cloneUrl}" "${targetPath}"`, {
            stdio: 'pipe'
        });
    } catch (err) {
        // 如果指定分支失败，尝试默认分支
        execSync(`git clone --depth 1 "${cloneUrl}" "${targetPath}"`, {
            stdio: 'pipe'
        });
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log(`Downloading skill from: ${githubUrl}`);
        console.log(`Target path: ${targetPath}`);

        const { owner, repo, branch, subpath } = parseGitHubUrl(githubUrl);
        console.log(`Parsed: owner=${owner}, repo=${repo}, branch=${branch}, subpath=${subpath || '(root)'}`);

        if (subpath) {
            // 需要下载子目录
            const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;
            const tempZip = path.join(require('os').tmpdir(), `skill-${Date.now()}.zip`);

            console.log(`Downloading zip from: ${zipUrl}`);
            await downloadFile(zipUrl, tempZip);
            console.log('Download complete, extracting...');

            // 尝试使用内置解压
            extractWithBuiltinUnzip(tempZip, subpath, targetPath);

            // 清理临时文件
            if (fs.existsSync(tempZip)) {
                fs.unlinkSync(tempZip);
            }

            console.log('Extraction complete!');
        } else {
            // 克隆整个仓库
            console.log('Cloning repository...');
            cloneRepo(owner, repo, branch, targetPath);
            console.log('Clone complete!');
        }

        console.log('SUCCESS');
        process.exit(0);

    } catch (error) {
        console.error(`ERROR: ${error.message}`);
        process.exit(1);
    }
}

main();
