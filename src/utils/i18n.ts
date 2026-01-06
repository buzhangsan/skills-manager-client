/**
 * 根据当前语言获取技能描述
 * 优先级：对应语言的描述 > 英文描述 > 默认描述
 */
export function getLocalizedDescription(
  skill: {
    description: string;
    descriptionZh?: string;
    descriptionEn?: string;
  },
  language: string
): string {
  if (language === 'zh') {
    // 中文环境：优先中文描述，其次英文，最后默认
    return skill.descriptionZh || skill.descriptionEn || skill.description;
  } else {
    // 英文环境：优先英文描述，其次默认
    return skill.descriptionEn || skill.description;
  }
}
