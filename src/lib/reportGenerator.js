// ===== 综合分析生成器：交叉验证、核心优势、发展建议、个性化职业建议 =====
import { getMBTIInfo } from '../data/mbtiLibrary.js';
import { getBig5DimInfo, big5WorkEnvPreference, big5TeamRole, big5MgmtAdvice } from '../data/big5Library.js';
import { getPDPInfo } from '../data/pdpLibrary.js';
import { getDISCInfo } from '../data/discLibrary.js';
import { getEnneagramInfo } from '../data/enneagramLibrary.js';
import { getBloodTypeInfo, getZodiacInfo } from '../data/auxLibrary.js';

// 找出维度得分中的前N项和后N项
function topDims(dimensions, n) {
  return Object.entries(dimensions).sort((a, b) => b[1] - a[1]).slice(0, n);
}
function bottomDims(dimensions, n) {
  return Object.entries(dimensions).sort((a, b) => a[1] - b[1]).slice(0, n);
}

// 生成核心优势（3-5条，附行为表现）
export function generateStrengths(results) {
  const { mbti, big5, pdp, disc, enneagram, dimensions } = results;
  const strengths = [];
  const top = topDims(dimensions, 4);

  top.forEach(([dim, score]) => {
    if (score >= 7) {
      const behavior = dimBehavior(dim, results);
      strengths.push({ dim, score, desc: behavior });
    }
  });

  // 补充基于类型交叉的优势
  if (mbti.type.includes('F') && big5.A >= 6) {
    if (!strengths.find(s => s.dim === '共情能力')) {
      strengths.push({ dim: '共情能力', score: dimensions['共情能力'], desc: 'MBTI中的情感倾向与大五的高宜人性相互印证，你对他人情感有天然的敏感度，能建立深层信任关系。' });
    }
  }
  if (mbti.type.includes('J') && big5.C >= 6) {
    if (!strengths.find(s => s.dim === '责任心')) {
      strengths.push({ dim: '责任心', score: dimensions['责任心'], desc: 'MBTI的判断倾向与大五的高尽责性一致，你做事有计划、有承诺感，是团队中可靠的执行者。' });
    }
  }

  return strengths.slice(0, 5);
}

function dimBehavior(dim, results) {
  const map = {
    '共情能力': '你能敏锐感知他人的情绪和需求，在关怀类工作中让人感到被理解和被支持。',
    '情绪稳定': '你的情绪起伏较小，在压力和复杂情境下依然能保持冷静和理性判断。',
    '责任心': '你做事有计划、有承诺感，对职责一丝不苟，是团队中可信赖的执行者。',
    '沟通表达': '你善于把想法清晰传达，能带动他人、营造氛围，在需要协调和动员时表现出色。',
    '抗压能力': '你在压力下反而能保持功能，善于在挑战中找到方向并持续推动。',
    '学习能力': '你对新知识和新领域保持好奇，能快速理解并迁移应用。',
    '领导力': '你善于组织资源和人员、推动目标达成，在需要决策和引领时自然担当。',
    '团队协作': '你重视团队和谐、善于配合，能在团队中发挥稳定支撑作用。',
    '细致严谨': '你注重细节和质量，做事有章法，能保障交付的准确和可靠。',
    '创新思维': '你思维灵活、富有想象力，能从不同角度看问题并提出新方案。',
    '主动性': '你善于主动出击、把握机会，不等待指令而是推动事情发生。',
    '服务意识': '你以他人需求为导向，乐于提供支持和关怀，让人感到被重视。',
    '口头表达与说服': '你善于把想法讲清楚并产生说服力，在谈判、动员和客户沟通中表现突出。',
    '倾听理解与回应': '你先听后说，能准确接住对方的需求与顾虑，回应让人感到被尊重。',
    '流程合规与差错防范': '你对规则与流程有敬畏心，做事留痕复核，能把差错挡在门外。',
    '应急与危机处置': '你在突发状况中能快速判断、稳住局面并组织应对，是团队中的定海神针。',
    '观察洞察': '你眼力细致，能在细节与异常中捕捉信号，提前预判风险与机会。',
    '执行落地': '你不只把事想清楚，更把计划变成结果，交付闭环、说到做到。',
    '跨部门协调': '你善于在不同团队间穿针引线，把分歧转化为协作方案。',
    '持续学习适应': '你在新的工具、政策和环境中上手快，能把变化变成成长机会。',
    '耐心与照护亲和': '面对长者与需要照护的人，你能保持耐心与温度，让人安心。',
    '专业审慎与风险意识': '你下判断前习惯评估风险，专业动作稳当，是质量与安全的把关者。'
  };
  return map[dim] || `${dim}表现突出。`;
}

// 生成发展潜力方向（2-3条）
export function generatePotentials(results) {
  const { mbti, big5, pdp, disc, enneagram } = results;
  const pots = [];
  if (big5.O >= 7 && (mbti.type.includes('N') || pdp.primary === '变色龙')) {
    pots.push('你在创新和探索方面有明显潜力，可在新业务拓展、课程研发或市场创新中发挥价值。');
  }
  if (big5.E >= 6 && (pdp.primary === '老虎' || disc.primary === 'D' || ['ENTJ','ENFJ','ESTJ'].includes(mbti.type))) {
    pots.push('你具备带领团队的潜力，可在管理或项目负责人方向上进一步发展。');
  }
  if (big5.A >= 7 && (enneagram.primary === 2 || enneagram.primary === 9)) {
    pots.push('你在人际关怀和关系经营上有独特优势，可在客户关系、社工或团队建设中深耕。');
  }
  if (big5.C >= 7 && (pdp.primary === '猫头鹰' || disc.primary === 'C')) {
    pots.push('你在质量管理和专业精进方面有发展空间，可在标准化、品控或专业岗位方向深耕。');
  }
  if (pots.length === 0) {
    pots.push('你的能力较为均衡，具备在不同岗位间灵活切换的潜力，可在轮岗中找到最适合的方向。');
    pots.push('你善于在不同情境中保持稳定，适合在需要综合协调的岗位上发展。');
  }
  return pots.slice(0, 3);
}

// 生成需关注的成长点（2-3条）
export function generateGrowthPoints(results) {
  const { big5, pdp, disc, enneagram, mbti } = results;
  const growth = [];
  if (big5.N >= 7) {
    growth.push('你对压力较为敏感，建议建立规律的情绪调节方式（如运动、冥想、倾诉），在高压任务前做好心理准备。');
  }
  if (big5.C < 4) {
    growth.push('你的灵活性强，但任务跟进的系统化有提升空间，可借助清单和里程碑工具增强条理性。');
  }
  if (big5.E < 4 && big5.A < 5) {
    growth.push('你在主动表达和冲突应对上可进一步练习，尝试在小事上主动发声、清晰表达立场。');
  }
  if (pdp.primary === '老虎' && disc.primary === 'D') {
    growth.push('你的行动力和决断力强，建议在推动时增加倾听和体察，避免因过快而忽略他人感受。');
  }
  if (pdp.primary === '无尾熊' && disc.primary === 'S') {
    growth.push('你的稳定性是优势，建议有意识地训练主动性和应变能力，在变化中保持参与感。');
  }
  if (enneagram.primary === 9) {
    growth.push('你善于和谐，建议练习在必要时表达不同意见，把和谐建立在真实而非回避之上。');
  }
  if (enneagram.primary === 1) {
    growth.push('你追求卓越，建议区分"足够好"与"完美"，给自己和他人留出试错空间。');
  }
  if (growth.length === 0) {
    growth.push('你的各项特质较为均衡，建议关注长期方向的聚焦，避免因能力全面而分散精力。');
    growth.push('可在承担新挑战时留意自己的能量管理，找到可持续的工作节奏。');
  }
  return growth.slice(0, 3);
}

// 生成个性化综合职业建议（200-300字）
export function generateFinalAdvice(profile, results, topJob) {
  const { name } = profile;
  const { mbti, big5, pdp, disc, enneagram } = results;
  const mbtiInfo = getMBTIInfo(mbti.type);
  const enneagramInfo = getEnneagramInfo(enneagram.primary);
  const top = topDims(results.dimensions, 2);
  const topDimNames = top.map(t => t[0]).join('与');

  let advice = `${name}，感谢你认真地完成了这次综合测评。`;
  advice += `从五大工具的交叉结果来看，你是一位**${mbtiInfo.cnName}**特质鲜明、以**${pdp.primary}**行为风格见长的伙伴，`;
  const desireText = enneagramInfo.desire ? enneagramInfo.desire.replace('追求', '') : '理想';
  advice += `内心深处带着**${enneagramInfo.name}**对${desireText}的向往。`;
  advice += `你在**${topDimNames}**上的表现尤为突出，这是你独特而宝贵的职业资本。`;

  if (topJob) {
    advice += `综合多维交叉分析，系统判断你在康源美宏的**${topJob.job.name}**岗位上有较高的匹配潜力（${topJob.matchPct}%），`;
    advice += `这个方向既能发挥你的自然优势，也有进一步成长的空间。`;
  }

  advice += `职业发展不是一次定型，而是一段持续探索的旅程。`;
  advice += `建议你在发挥优势的同时，留意报告中所指出的成长点，`;
  advice += `把它们视为可以刻意练习的方向，而非需要回避的不足。`;
  advice += `康源美宏的业务涵盖养老、教育和社区服务，正需要像你这样有独特禀赋的伙伴，`;
  advice += `在合适的位置上发光发热。愿你在这份工作中被看见、被珍视，也持续成为更好的自己。`;

  return advice;
}

// 业务板块推荐：将真实 17 个岗位映射到康源美宏的业务板块，按板块内岗位的平均匹配度给出建议。
export function recommendBusiness(results, topJobs) {
  const businessMap = {
    '机构养老运营': ['区域院长', '院长', '副院长', '介护师', '社工', '养老机构医生', '养老机构护士'],
    '医疗健康服务': ['护理院医生', '护理院护士', '诊所医生', '诊所护士', '药剂师', '康复师', '检验师'],
    '行政与市场': ['行政综合岗', '营销经理', '营销专员']
  };
  const scores = {};
  Object.entries(businessMap).forEach(([biz, jobs]) => {
    const matched = topJobs.filter(tj => jobs.includes(tj.job.name));
    scores[biz] = matched.length ? matched.reduce((s, tj) => s + tj.matchPct, 0) / matched.length : 0;
  });
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) {
    return { primary: '暂无推荐', primaryScore: 0, all: [] };
  }
  return {
    primary: sorted[0][0],
    primaryScore: Math.round(sorted[0][1]),
    all: sorted.map(([biz, score]) => ({ business: biz, score: Math.round(score) }))
  };
}

// 生成 Top3 推荐理由
export function generateTopReasons(results, jobMatch) {
  const { dimensions } = results;
  return jobMatch.map((jm, idx) => {
    const topDetail = [...jm.details].sort((a, b) => b.contribution - a.contribution).slice(0, 2);
    const dimHighlights = topDetail.map(d => `${d.dimension}（${d.employeeScore}分）`).join('、');
    const reasons = [
      `你在该岗位重点考察的${dimHighlights}上表现突出，与岗位需求高度契合。`,
      `该岗位所需的核心能力与你的${results.pdp.primary}行为风格和${results.disc.primary}型DISC特质相匹配。`,
      `从九型${results.enneagram.primary}号的动机来看，该岗位的工作内容能为你带来较高满足感。`
    ];
    return {
      rank: idx + 1,
      jobName: jm.job.name,
      matchPct: jm.matchPct,
      reason: reasons[idx % reasons.length]
    };
  });
}

export { topDims, bottomDims };
