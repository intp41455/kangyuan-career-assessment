// ===== 大五人格维度解读库 =====
export function big5Level(score) {
  if (score < 3) return { label: '低', desc: '低于平均水平' };
  if (score < 5) return { label: '中偏低', desc: '略低于平均水平' };
  if (score < 6) return { label: '中等', desc: '处于平均水平' };
  if (score < 8) return { label: '中偏高', desc: '略高于平均水平' };
  return { label: '高', desc: '高于平均水平' };
}

export const big5Library = {
  E: {
    name: '外倾性',
    interp: {
      low: '你倾向于在独处或小圈子中获得能量，更偏好安静、深入的工作环境。在团队中，你通常是安静的倾听者和思考者，发言前会先在心中整理好观点。',
      mid: '你能根据情境在独处与社交之间取得平衡，既能在必要时主动沟通，也能在需要时安静专注。',
      high: '你倾向于从人际互动中获得能量，乐于主动表达和结识他人。在团队中，你通常是活跃的参与者，善于带动氛围和建立连接。'
    },
    team: {
      low: '在团队中常扮演深度思考者和稳定支持者的角色，不争抢话语权但发言往往有分量。',
      mid: '能灵活适应不同团队氛围，既可主导也可配合。',
      high: '常是团队的连接者和气氛带动者，善于促进成员间的互动和协作。'
    },
    social: {
      low: '社交偏好偏向小范围、深度的关系，大型聚会可能让你感到消耗。',
      mid: '社交风格灵活，能根据需要调整。',
      high: '享受广泛的人际互动，社交活动让你感到充实和有活力。'
    }
  },
  C: {
    name: '尽责性',
    interp: {
      low: '你可能更偏好灵活、随性的工作方式，对严格的计划和规范感到一定束缚。这让你在面对突发情况时保持弹性，但需注意任务跟进的系统性。',
      mid: '你能在秩序与灵活之间找到平衡，既注重落实也保留应变空间。',
      high: '你做事有条理、有计划，对目标和承诺高度负责。注重细节和质量，是团队中可靠、可信赖的执行者。'
    },
    task: {
      low: '任务执行风格灵活，善于应对变化，建议借助外部工具辅助任务管理。',
      mid: '能根据任务性质调整执行方式。',
      high: '任务执行有计划、有节奏，善于分解和跟进，确保善始善终。'
    },
    discipline: {
      low: '自律性有提升空间，可通过设定明确的小目标和反馈机制来增强。',
      mid: '自律性适中，能在关键事项上保持专注。',
      high: '自律性强，有条理性，能持续跟进任务直至完成。'
    }
  },
  A: {
    name: '宜人性',
    interp: {
      low: '你可能更看重客观和原则，不轻易妥协，这让你在需要坚持立场时表现出色，同时需注意在人际中保留柔软度。',
      mid: '你能在坚持原则与照顾他人之间取得平衡。',
      high: '你富有同情心、善于体谅他人，注重和谐的人际关系。在团队中是温暖的润滑剂，让人感到被理解和被支持。'
    },
    relation: {
      low: '人际关系倾向独立、直接，重视效率胜过和谐。',
      mid: '能根据情境调整人际策略。',
      high: '重视和谐与信任，乐于帮助他人，是团队中让人感到温暖的存在。'
    },
    conflict: {
      low: '面对冲突时倾向于据理力争、坚持立场，建议在对抗中留出倾听空间。',
      mid: '能在坚持与和解之间灵活切换。',
      high: '面对冲突倾向于和解和包容，建议在照顾他人时也清晰表达自己的需求。'
    }
  },
  N: {
    name: '神经质',
    interp: {
      low: '你的情绪较为稳定，不易被外界波动影响，在压力下能保持冷静和理性。这是宝贵的心理资源，让你在复杂环境中依然从容。',
      mid: '你的情绪反应处于正常范围，会有起伏但能自我调节。',
      high: '你对情绪变化较为敏感，容易感受到压力和焦虑。这让你对细节和风险有较高的觉察力，同时建议关注情绪调节和自我关怀。'
    },
    emotion: {
      low: '情绪反应模式平稳，不易大起大落。',
      mid: '情绪有正常波动，能较好自我调节。',
      high: '情绪反应较为敏锐，可能体验到更丰富的情绪起伏。'
    },
    stress: {
      low: '压力敏感度低，在高压下依然能保持功能。',
      mid: '能应对一般程度的压力。',
      high: '对压力较敏感，建议建立规律的情绪调节和减压方式。'
    }
  },
  O: {
    name: '开放性',
    interp: {
      low: '你更偏好熟悉、稳妥和有章可循的方式，重视经验和实践。这让你在需要稳定和可靠的场景中表现出色。',
      mid: '你能在传统与创新之间取得平衡，既尊重经验也接受新事物。',
      high: '你富有想象力和好奇心，乐于探索新想法和新领域。对艺术、哲学和抽象观念有较强感受力，是创新和变革的推动者。'
    },
    learn: {
      low: '学习风格偏向实用和经验导向，重视可操作的知识。',
      mid: '学习方式灵活，能兼顾实用与探索。',
      high: '学习风格富有探索性，喜欢深入思考和举一反三。'
    },
    novelty: {
      low: '对新事物持审慎态度，更愿意在验证后再采纳。',
      mid: '对新事物保持适度开放。',
      high: '对新事物接受度高，乐于尝试和探索未知。'
    }
  }
};

export function getBig5DimInfo(dim, score) {
  const lib = big5Library[dim];
  if (!lib) return null;
  const level = big5Level(score);
  let bucket;
  if (score < 3) bucket = 'low';
  else if (score < 6) bucket = 'mid';
  else bucket = 'high';
  // 五个维度的解读文本字段不一致：仅 E 有 team/social；C/A/N/O 分别用
  // task/relation/emotion/learn 与 discipline/conflict/stress/novelty。
  // 统一映射到该维度真实存在的文本属性，确保返回的 team/social/conflict
  // 三个字段都不为 undefined，模板渲染不再抛 "reading mid/low/high"。
  const fieldMap = {
    E: { team: 'team',     social: 'social',    conflict: 'social'    },
    C: { team: 'task',     social: 'discipline', conflict: 'discipline' },
    A: { team: 'relation', social: 'relation',  conflict: 'conflict'  },
    N: { team: 'emotion',  social: 'stress',    conflict: 'stress'    },
    O: { team: 'learn',    social: 'novelty',   conflict: 'novelty'   }
  };
  const m = fieldMap[dim];
  return {
    name: lib.name,
    level: level.label,
    levelDesc: level.desc,
    interp: lib.interp[bucket],
    team: lib[m.team][bucket],
    social: lib[m.social][bucket],
    conflict: lib[m.conflict][bucket]
  };
}

// 综合工作环境偏好
export function big5WorkEnvPreference(big5) {
  const prefs = [];
  if (big5.C >= 6) prefs.push('喜欢结构化、有明确目标和流程的工作环境');
  else if (big5.C < 4) prefs.push('偏好灵活、自主度较高的工作环境');
  if (big5.E >= 6) prefs.push('乐于在团队协作和互动频繁的环境中工作');
  else if (big5.E < 4) prefs.push('更享受独立专注或小团队的工作方式');
  if (big5.O >= 6) prefs.push('欢迎有创新空间和变化的工作内容');
  else prefs.push('更偏好稳定、可预期的工作内容');
  if (big5.A >= 6) prefs.push('重视和谐、支持性的人际氛围');
  return prefs.join('；') + '。';
}

export function big5TeamRole(big5) {
  if (big5.E >= 6 && big5.A >= 6) return '团队中的协调者和氛围带动者，善于凝聚人心';
  if (big5.C >= 7 && big5.N < 5) return '团队中可靠的执行骨干，保障任务高质量落地';
  if (big5.O >= 7) return '团队中的创意来源和变革推动者，善于发现新可能';
  if (big5.A >= 7) return '团队中的关怀者和支持者，营造温暖氛围';
  if (big5.E < 4 && big5.C >= 6) return '团队中深思熟虑的专家角色，提供深度专业支撑';
  return '团队中的全能型成员，能根据需要在多种角色间切换';
}

export function big5MgmtAdvice(big5) {
  const tips = [];
  if (big5.E >= 6) tips.push('激励方式：给予公开认可和团队互动机会，让其带动项目');
  else tips.push('激励方式：给予独立空间和深度任务，认可其默默贡献');
  if (big5.C >= 6) tips.push('沟通方式：提供清晰目标和节点，信任其执行');
  else tips.push('沟通方式：帮助其拆解任务、设定里程碑，适度跟进');
  if (big5.A >= 6) tips.push('布置任务：可委以协调和服务类职责，注意避免其过度承担');
  else tips.push('布置任务：可委以需要坚持原则的职责，引导其关注人际影响');
  if (big5.N >= 6) tips.push('关注点：留意其压力信号，给予情绪支持和稳定预期');
  else tips.push('关注点：可适当给予挑战性任务，其抗压能力较强');
  return tips;
}
