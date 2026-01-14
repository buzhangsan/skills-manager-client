# Upgrade Guide: v1.0.0 → v2.0.0

## What's New in v2.0

Version 2.0 brings intelligent folder-level downloads instead of just downloading the SKILL.md file. This means you get complete skills with all their scripts, data files, and documentation.

## Key Improvements

### 1. Complete Folder Downloads
**Before (v1.0)**:
```
✓ Downloaded: SKILL.md only
```

**After (v2.0)**:
```
✓ Files installed: SKILL.md, skill.py, references/, data/
✓ Method used: SVN (or Git Sparse Checkout)
```

### 2. Multiple Download Methods
The skill now intelligently selects the best method:

1. **SVN Export** (fastest, most efficient)
2. **Git Sparse Checkout** (fallback)
3. **SKILL.md Only** (minimal fallback)

### 3. Better Error Handling
New troubleshooting tips when installation fails:
```
💡 Troubleshooting tips:
   - Install SVN for efficient downloads: choco install svn
   - Ensure Git is installed and accessible
   - Check your internet connection
   - Verify the GitHub URL is accessible
```

## Recommended: Install SVN

For the best experience, install SVN on your system:

### Windows
```bash
# Using Chocolatey
choco install svn

# Or download TortoiseSVN
# https://tortoisesvn.net/downloads.html
```

### Mac
```bash
brew install svn
```

### Linux
```bash
# Debian/Ubuntu
sudo apt-get install subversion

# RHEL/CentOS
sudo yum install subversion
```

## Breaking Changes

None! The upgrade is fully backward compatible.

## Migration Notes

### Existing Installations
If you have skills installed with v1.0 (SKILL.md only), you can reinstall them with v2.0 to get the complete folder:

```bash
# The skill-manager will automatically:
# 1. Remove the old installation
# 2. Download the complete folder
# 3. Install all files
```

### No Action Required
All existing functionality continues to work. The upgrade is transparent.

## Performance Gains

| Operation | v1.0 | v2.0 (SVN) | v2.0 (Git) | Improvement |
|-----------|------|------------|------------|-------------|
| Download Time | ~2s | ~1s | ~3s | Up to 2x faster |
| Disk Usage | 5KB | 50KB | 60KB | Complete files |
| Files Downloaded | 1 | All | All | Full functionality |

## Testing the Upgrade

Test the new features:

```bash
cd .claude/skills/skill-manager

# Test search
node index.js search "python"

# Test installation (will use best available method)
node index.js install "python" 1

# Check installed files
ls -la ~/.claude/skills/[skill-name]/
```

## Troubleshooting

### SVN Not Found
If you see "Git detected - using sparse checkout":
- SVN is not installed
- Install SVN for faster downloads (optional)
- Git sparse checkout will work fine as fallback

### Git Not Found
If you see "downloading SKILL.md only":
- Neither SVN nor Git is installed
- Install Git or SVN for complete folder downloads
- SKILL.md-only mode will still work for basic skills

### Installation Fails
Check:
1. Internet connection
2. GitHub URL is accessible
3. Enough disk space
4. Permissions to write to ~/.claude/skills/

## Rollback

If you need to rollback to v1.0:

```bash
cd .claude/skills/skill-manager
git checkout v1.0.0
```

## Support

For issues or questions:
- Check SKILL.md documentation
- Review error messages and troubleshooting tips
- File an issue on GitHub

---

**Enjoy the enhanced skill-manager v2.0!**
