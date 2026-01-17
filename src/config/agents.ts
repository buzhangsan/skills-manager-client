/**
 * AI 代理配置
 * 基于 skill-dir.md 标准
 * 采用 Claude Code 为主目录，软链接到其他代理
 */

export interface AgentConfig {
  id: string;
  name: string;
  displayName: string;
  skillsDir: string;           // 项目级技能目录
  globalSkillsDir: string;     // 全局技能目录 (相对于 home)
  compatibility: 'native' | 'symlink';  // native = 原生支持, symlink = 需要软链
  color: string;               // 主题颜色
}

// 主目录配置 - 所有 Skills 安装到这里
export const PRIMARY_SKILLS_DIR = '.claude/skills';

// 代理配置 - 基于 skill-dir.md 标准
export const agents: Record<string, AgentConfig> = {
  // ==================== 原生兼容代理 ====================
  'claude-code': {
    id: 'claude-code',
    name: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: '.claude/skills',
    compatibility: 'native',
    color: '#D97757'
  },
  'github-copilot': {
    id: 'github-copilot',
    name: 'github-copilot',
    displayName: 'GitHub Copilot',
    skillsDir: '.github/skills',
    globalSkillsDir: '.copilot/skills',
    compatibility: 'native',
    color: '#000000'
  },
  'cursor': {
    id: 'cursor',
    name: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.cursor/skills',
    globalSkillsDir: '.cursor/skills',
    compatibility: 'native',
    color: '#00D4FF'
  },
  'opencode': {
    id: 'opencode',
    name: 'opencode',
    displayName: 'OpenCode',
    skillsDir: '.opencode/skill',
    globalSkillsDir: '.config/opencode/skill',
    compatibility: 'native',
    color: '#6366F1'
  },
  'antigravity': {
    id: 'antigravity',
    name: 'antigravity',
    displayName: 'Antigravity',
    skillsDir: '.agent/skills',
    globalSkillsDir: '.gemini/antigravity/skills',
    compatibility: 'native',
    color: '#4285F4'
  },
  'amp': {
    id: 'amp',
    name: 'amp',
    displayName: 'Amp',
    skillsDir: '.amp/skills',
    globalSkillsDir: '.amp/skills',
    compatibility: 'native',
    color: '#FF6B6B'
  },

  // ==================== 需要软链接的代理 ====================
  'codex': {
    id: 'codex',
    name: 'codex',
    displayName: 'OpenAI Codex',
    skillsDir: '.codex/skills',
    globalSkillsDir: '.codex/skills',
    compatibility: 'symlink',
    color: '#10A37F'
  },
  'gemini-cli': {
    id: 'gemini-cli',
    name: 'gemini-cli',
    displayName: 'Gemini CLI',
    skillsDir: '.gemini/skills',
    globalSkillsDir: '.gemini/skills',
    compatibility: 'symlink',
    color: '#8E44AD'
  },
  'windsurf': {
    id: 'windsurf',
    name: 'windsurf',
    displayName: 'Windsurf',
    skillsDir: '.windsurf/skills',
    globalSkillsDir: '.codeium/windsurf/skills',
    compatibility: 'symlink',
    color: '#22C55E'
  },
  'roo': {
    id: 'roo',
    name: 'roo',
    displayName: 'Roo',
    skillsDir: '.roo/skills',
    globalSkillsDir: '.roo/skills',
    compatibility: 'symlink',
    color: '#F59E0B'
  },
  'trae': {
    id: 'trae',
    name: 'trae',
    displayName: 'Trae',
    skillsDir: '.trae/skills',
    globalSkillsDir: '.trae/skills',
    compatibility: 'symlink',
    color: '#EC4899'
  }
};

export const agentList = Object.values(agents);

// 获取需要软链的代理列表
export const getSymlinkAgents = (): AgentConfig[] => {
  return agentList.filter(a => a.compatibility === 'symlink');
};

// 获取原生兼容的代理列表
export const getNativeAgents = (): AgentConfig[] => {
  return agentList.filter(a => a.compatibility === 'native');
};

export const getAgentById = (id: string): AgentConfig | undefined => {
  return agents[id];
};

export const getAgentDisplayName = (id: string): string => {
  return agents[id]?.displayName || id;
};

// 获取代理的软链目标路径 (相对于 home)
export const getSymlinkTarget = (agentId: string): string | null => {
  const agent = agents[agentId];
  if (!agent || agent.compatibility !== 'symlink') return null;
  return agent.globalSkillsDir;
};
