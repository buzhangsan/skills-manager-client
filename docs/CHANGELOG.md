# Changelog

## [2.0.0] - 2025-12-26

### Major Updates
- **Smart Installation Methods**: Automatically selects the best download method
  - SVN export (preferred): Fast, efficient, folder-only download
  - Git sparse checkout (fallback): Complete folder with minimal overhead
  - SKILL.md only (final fallback): Minimal installation when tools unavailable

### Added
- `hasCommand()`: Detect available download tools
- `extractRepoInfo()`: Parse GitHub URLs for download methods
- `installWithSvn()`: SVN export implementation for efficient downloads
- `installWithSparseCheckout()`: Git sparse checkout implementation
- `installSkillMdOnly()`: Fallback to HTTP download
- Installation method display in success messages
- Enhanced error messages with troubleshooting tips
- File listing after successful installation

### Changed
- `installSkill()`: Now automatically selects best method
- `displaySkillGuide()`: Added installation method parameter
- Complete folder download instead of SKILL.md only
- Improved error handling with platform-specific suggestions

### Technical Details
- Uses GitHub's SVN protocol support for folder-level access
- Git sparse checkout for systems without SVN
- Automatic cleanup of temporary directories
- Cross-platform path handling (Windows/Linux/Mac)

### Performance
- **SVN**: ~2-5x faster than full git clone
- **Sparse Checkout**: ~3x faster than full clone
- Minimal disk usage (no Git history for SVN)

## [1.0.0] - 2025-12-26

### Initial Release
- Search through 31,767+ community skills
- Intelligent search with weighted scoring
- Basic SKILL.md download and installation
- Configuration guide display
- JSON database with Chinese translations
