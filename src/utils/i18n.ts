/**
 * 根据当前语言获取技能描述
 * 优先级：对应语言的描述 > 英文描述 > 默认描述
 */
export function getLocalizedDescription(
  skill: {
    description: string;
    description_cn?: string;
    description_en?: string;
    descriptionZh?: string;
    descriptionEn?: string;
  },
  language: string
): string {
  if (language === 'zh') {
    // 中文环境：优先中文描述，其次英文，最后默认
    // 支持两种命名方式：description_cn 和 descriptionZh
    return skill.description_cn || skill.descriptionZh || skill.description_en || skill.descriptionEn || skill.description;
  } else {
    // 英文环境：优先英文描述，其次默认
    // 支持两种命名方式：description_en 和 descriptionEn
    return skill.description_en || skill.descriptionEn || skill.description;
  }
}
