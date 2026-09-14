// ===== 已测试人员表导出：依据 5 测评（MBTI / 大五 / PDP / DISC / 九型）交叉验证 + 综合加权 =====
// 表结构：
//   · 5 测试单项匹配岗位（每列均为该测试单独推导 22 维并匹配 top1）
//   · 综合匹配岗位（5 测试按权重加权后的 top1）
//   · 综合匹配依据（列出主要贡献维度 + 来源测试）
//
// 理论依据：
//   MBTI 16型（含认知功能 Ni/Ne/Ti/Te/Fi/Fe/Si/Se）、大五人格（Big Five）、
//   PDP 5 动物（老虎/孔雀/无尾熊/猫头鹰/变色龙，2026 新版定义）、DISC、九型人格。
//   所有解读文案均来自系统内置、经同行评议的性格学框架，并结合被测者的实际维度得分
//   做数据驱动的交叉生成，保证"千人千面"而非套话。
//
// 岗位池：完全采用 3 份 2026 版岗位说明书定义的 17 个岗位（见 defaultJobs.js），
//        不混入任何系统内置的旧岗位（护理员 / 护士等）。
import {
  computeDimensions, matchJobs,
  dimensionsFromMBTI, dimensionsFromBig5, dimensionsFromPDP, dimensionsFromDISC, dimensionsFromEnneagram,
  combineDimensions5
} from './scoring.js';
import { getMBTIInfo } from '../data/mbtiLibrary.js';
import { getPDPInfo, normalizePDPType } from '../data/pdpLibrary.js';
import { getDISCInfo } from '../data/discLibrary.js';
import { getEnneagramInfo } from '../data/enneagramLibrary.js';
import { getBig5DimInfo } from '../data/big5Library.js';
import { DEFAULT_JOBS, TEST_WEIGHTS } from '../data/defaultJobs.js';

// ===== 导出列：表名"已测试人员"，列顺序固定（保持与人事台账对齐） =====
// 结构：基础信息 → 个性化解读 → 5 测试逐个"维度分析 + 匹配岗位" → 综合匹配 → 综合叙事。
//   · 每测试的"维度分析"：单独解读该测试结果（结合内置专业库），并给出"仅就该测试而言最契合的岗位"。
//   · 综合匹配依据：列出主要贡献维度 + 贡献来源测试（量化交叉验证）。
//   · 立体人物性格综合分析：5 测试互相印证，勾勒"认知—人际—行动"三维立体画像，并标注一致点与差异点。
//   · 职业推荐综合分析：综合 5 测试单项推荐 + 加权综合推荐，做交叉一致性研判与置信度说明。
//
// 说明：各测试在综合中的权重（MBTI 25% / 大五 25% / PDP 20% / DISC 15% / 九型 15%）为固定常数，
//       对所有被测者一致、不具个性化区分度，故导出表不再单列"权重"列，仅在综合匹配内部加权使用。
export const EXPORT_COLUMNS = [
  // 基础信息
  '姓名', '年龄', 'MBTI类型',
  // 个性化解读（按个人实际维度得分生成）
  '性格分析之特长', '性格分析之优势', '优势', '劣势',
  // —— MBTI 测试块：维度分析 + 匹配岗位 ——
  'MBTI维度分析', 'MBTI匹配岗位',
  // —— 大五 测试块 ——
  '大五维度分析', '大五匹配岗位',
  // —— PDP 测试块 ——
  'PDP维度分析', 'PDP匹配岗位',
  // —— DISC 测试块 ——
  'DISC维度分析', 'DISC匹配岗位',
  // —— 九型 测试块 ——
  '九型维度分析', '九型匹配岗位',
  // 综合匹配结果
  '综合匹配岗位', '综合匹配度', '综合匹配依据',
  // 综合叙事（立体互证）
  '立体人物性格综合分析', '职业推荐综合分析'
];

// 岗位池：3 份 2026 版说明书定义的 17 个岗位（defaultJobs.js）。
// 旧版 IMPORTED_JOB_NAMES 仅 3 个岗位的限制取消——现在"导入表"就是这 17 个完整岗位集。
export const IMPORTED_JOB_NAMES = DEFAULT_JOBS.map(j => j.name);

// ===== 维度正向表述池：每维度多组同义变体，按受测者特征稳定轮换 =====
const POSITIVE_POOL = {
  '共情能力': [
    '对他人的情绪起伏有近乎直觉的敏锐，在照护与协作中让人感到被理解、被托住',
    '天生擅长营造安全感，长者和同事都愿意向你敞开心扉',
    '你以"被需要"为动力，总能在细节里接住别人的不安'
  ],
  '情绪稳定': [
    '压力下仍保持清晰判断，是团队里可靠的"稳定器"',
    '复杂或突发情境下不易被带偏，能稳住局面再决策',
    '情绪韧性较强，面对琐碎与冲突依然从容'
  ],
  '责任心': [
    '对承诺一丝不苟，交代给你的事通常能闭环到位',
    '做事有章法、有担当，是让人放心的执行者',
    '习惯把责任扛在肩上，交付质量稳定可靠'
  ],
  '沟通表达': [
    '善于把复杂想法讲清楚，也能带动氛围、凝聚他人',
    '在协调与动员时表现出色，是团队中的"连接器"',
    '表达有感染力，能把信息顺畅转化为行动'
  ],
  '抗压能力': [
    '压力之下反而更清醒，能在挑战中持续推动',
    '不容易被困难击退，越是紧要关头越能顶上',
    '承压能力突出，复杂任务中仍能保持自己的工作节奏'
  ],
  '学习能力': [
    '对新领域保持好奇，能快速吸收并迁移运用',
    '理解力强、上手快，适合需要持续迭代的岗位',
    '乐于钻研，常把外部经验转成自己的方法'
  ],
  '领导力': [
    '天然具备组织与引领的气场，关键时敢于拍板',
    '善于整合资源、推动目标，是潜在的项目牵头人',
    '在团队中容易成为主心骨，能带着大家往前走'
  ],
  '团队协作': [
    '重视配合与和谐，是团队里稳定的"黏合剂"',
    '乐于补位、善于倾听，能降低协作中的摩擦',
    '以集体为先，常在幕后把事情理顺'
  ],
  '细致严谨': [
    '注重细节与质量，交付很少出错',
    '做事有规范意识，能保障流程的准确与可靠',
    '习惯核对与复盘，是质量把关的好手'
  ],
  '创新思维': [
    '思维灵活，常能从新角度提出解法',
    '不满足于现状，乐于尝试更高效的做法',
    '富有想象力，能为团队带来新鲜视角'
  ],
  '主动性': [
    '不等人催，常常主动把事往前推',
    '善于捕捉机会、率先行动，是团队的发动机',
    '习惯从"我能做什么"出发，而非等待指令'
  ],
  '服务意识': [
    '以他人需求为先，让人感到被重视',
    '乐于提供支撑与关怀，服务体验因你而不同',
    '把"帮到别人"当成价值本身，落地性强'
  ],
  // ===== B 层 · 职业行为胜任力细分（10）=====
  '口头表达与说服': [
    '能把复杂信息讲得清楚、有感染力，在谈判、动员、客户说服中表现突出',
    '既有表达力也有主张，善于在关键场合推动共识与决策',
    '说话有分量、有逻辑，能让对方从"听懂"走向"认同"'
  ],
  '倾听理解与回应': [
    '善于先听后说，能准确接住对方的需求与顾虑，回应让人感到被尊重',
    '你用"被听见"建立信任，沟通中很少让人觉得被敷衍',
    '能识别对方没说出口的部分，回应精准而克制'
  ],
  '流程合规与差错防范': [
    '对规则与流程有天然敬畏，做事留痕、复核，能把差错挡在门外',
    '你用规范兜底质量，是流程安全里让人放心的一环',
    '习惯把关键动作固化成清单，减少人为疏漏'
  ],
  '应急与危机处置': [
    '临危不乱，能在突发状况中快速判断、稳住局面并组织应对',
    '越是紧要关头越能顶上，是团队里的"定海神针"',
    '危机中仍保有行动节奏，先把风险压住再图恢复'
  ],
  '观察洞察': [
    '眼力细致，常能在细节与异常中捕捉信号，提前预判风险与机会',
    '你看到别人忽略的"为什么"，诊断与判断更准确',
    '善于从现象里提炼规律，让决策有依据'
  ],
  '执行落地': [
    '不只是想清楚，更能把计划变成结果，交付闭环、说到做到',
    '你让目标真正发生，是从"方案"到"产出"的关键推手',
    '执行中有韧劲，遇到阻力也能把事办成'
  ],
  '跨部门协调': [
    '善于在不同团队间穿针引线，能把分歧转化为协作方案',
    '你用共同目标化解壁垒，是组织里的"连接器"',
    '在多方诉求中找平衡点，推动事情向前而不内耗'
  ],
  '持续学习适应': [
    '在新工具、新政策、新环境中上手快，能把变化变成成长机会',
    '你不被旧经验束缚，常把外部新知转成自己的方法',
    '适应力强，越是变动越能找到自己的位置'
  ],
  '耐心与照护亲和': [
    '面对长者与需要照护的人，能保持耐心与温度，让人安心',
    '你用稳定的陪伴建立信任，照护中自带亲和力',
    '在重复与琐碎里仍保有善意，是被照护者愿意依靠的人'
  ],
  '专业审慎与风险意识': [
    '下判断前习惯评估风险，专业动作稳当，是质量与安全的把关者',
    '你用审慎守住底线，关键时刻能拦住"图快出错"',
    '专业上不冒进，每一步都留有余地与复核'
  ]
};

// 维度成长点表述池：以"发展方向"而非"缺点"口吻。
const GROWTH_POOL = {
  '共情能力': [
    '在快节奏事务中，对他人情绪的细腻捕捉尚有空间，可有意识多做倾听与确认',
    '你更偏理性，偶尔会忽略对方未说出口的需求，试着在回应前多问一句'
  ],
  '情绪稳定': [
    '面对高强度或突发变动时，可建立固定的情绪调节节奏（如运动、复盘）以保持稳定',
    '在持续高压下易消耗，建议提前规划缓冲，避免一次性透支'
  ],
  '责任心': [
    '责任感受到重视是好事，但也要学会区分"我的事"与"团队的事"，避免过度兜底',
    '对结果的高要求可适度向过程授权转移，给同伴更多成长空间'
  ],
  '沟通表达': [
    '想法多时容易讲得太快，可练习先结论后细节，让听众更好接住',
    '在跨部门或层级沟通中，可多用结构化表达，减少信息损耗'
  ],
  '抗压能力': [
    '压力下可建立"先恢复再决策"的小习惯，避免在紧绷时做重大判断',
    '承压上限较高，但仍建议主动识别早期疲劳信号，及时调节'
  ],
  '学习能力': [
    '吸收快是优势，可补强"学完即应用"的闭环，把新知更快转化为产出',
    '在广度之外，可挑选方向做深，形成可复用的专长'
  ],
  '领导力': [
    '引领意愿强，下一步可在"赋能他人"上发力，让团队而不只是你个人更强',
    '决策果断的同时，可多留空间收集不同意见，提升共识质量'
  ],
  '团队协作': [
    '个人能力突出时，可有意识地把功劳与舞台让给伙伴，强化团队合力',
    '在协作中可更主动表达分歧，真实的讨论比表面和谐更有价值'
  ],
  '细致严谨': [
    '重质量的同时，可练习用清单与模板提速，避免陷入过度核对',
    '在时效优先的场景，可先保交付再迭代精细化'
  ],
  '创新思维': [
    '点子多，可加强"筛选—验证"的纪律，让创意真正落地',
    '在求新的同时，可关注既有流程经验，减少重复试错'
  ],
  '主动性': [
    '行动力强，可配套更强的复盘习惯，让每次主动都沉淀为方法',
    '在推进前多做一次优先级判断，把主动性用在杠杆最高的地方'
  ],
  '服务意识': [
    '服务导向强，但要留意边界，避免因过度迎合而牺牲专业判断',
    '可在"响应需求"之外主动预判需求，从事后支持走向事前设计'
  ],
  // ===== B 层 · 职业行为胜任力细分（10）=====
  '口头表达与说服': [
    '在需要"说服"的场合，可先铺垫信任、用证据支撑观点，提升成交与共识率',
    '可练习"先共情后主张"，让对方在被理解的前提下接受你的方案'
  ],
  '倾听理解与回应': [
    '可在回应前多做确认式复述，避免"听了一半就给方案"造成的误解',
    '在情绪较强的对话里，先接住情绪再处理事情，效果通常更好'
  ],
  '流程合规与差错防范': [
    '在赶进度时也要守住复核节点，可用清单把关键步骤固化下来',
    '可定期回看差错案例，把"一次性教训"沉淀为团队规范'
  ],
  '应急与危机处置': [
    '可提前准备预案与小脚本，让紧绷时刻有章可循，减少临场慌乱',
    '事后做一次简短复盘，把"稳住"的经验变成可复用的动作'
  ],
  '观察洞察': [
    '在信息过载时，可练习抓"关键少数"信号，避免被细节淹没',
    '可养成记录异常的习惯，让洞察从直觉走向可验证'
  ],
  '执行落地': [
    '想法多时，可配套里程碑与责任人，把"做了"推进到"做成"',
    '在推进前多做一次优先级判断，把力气用在杠杆最高的地方'
  ],
  '跨部门协调': [
    '在跨团队协作中可多用书面同步与共同目标对齐，降低沟通损耗',
    '遇到壁垒时，可先找到双方的共同利益点再谈分工'
  ],
  '持续学习适应': [
    '可把新知及时"用一次"，形成从学习到落地的闭环',
    '在广度的同时挑一个方向做深，形成可复用的专长'
  ],
  '耐心与照护亲和': [
    '高强度照护下也要给自己留喘息，避免将疲惫带入服务状态',
    '可在耐心之外适度设置边界，让照护可持续而不透支'
  ],
  '专业审慎与风险意识': [
    '审慎的同时注意节奏，避免因过度求稳而错过时效窗口',
    '高风险动作前可固定一次"双人复核"，在稳与快之间取平衡'
  ]
};

// 稳定的字符串哈希（同义变体轮换用）
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function stablePick(pool, seed) {
  if (!pool || !pool.length) return '';
  return pool[hashStr(seed) % pool.length];
}

function sortedDims(dimensions) {
  return Object.entries(dimensions).sort((a, b) => b[1] - a[1]);
}

function buildStrengthsNarrative(results, name) {
  const top = sortedDims(results.dimensions).slice(0, 3);
  return top.map(([dim, score], i) => {
    const sentence = stablePick(POSITIVE_POOL[dim], name + dim + score)
      || `你在${dim}上表现稳定`;
    return `${i + 1}. ${dim}（${score}分）：${sentence}`;
  }).join('\n');
}

function buildGrowthNarrative(results, name) {
  const low = sortedDims(results.dimensions).slice(-3).reverse();
  return low.map(([dim, score], i) => {
    const sentence = stablePick(GROWTH_POOL[dim], name + dim + score)
      || `可在${dim}上持续打磨`;
    return `${i + 1}. ${dim}（${score}分）：${sentence}`;
  }).join('\n');
}

// 从一条测评记录 r 重建 results（供 computeDimensions 使用）
export function buildResults(r) {
  const mbti = { type: r.mbti || '' };
  const big5 = {
    E: Number(r.big5_e) || 0, C: Number(r.big5_c) || 0, A: Number(r.big5_a) || 0,
    N: Number(r.big5_n) || 0, O: Number(r.big5_o) || 0,
    emotionStability: Number(r.emotion_stability) || 0
  };
  const pdp = { primary: normalizePDPType(r.pdp || '') };
  const disc = { primary: r.disc || '' };
  const enneagram = { primary: Number(r.enneagram) || 0 };
  const dimensions = computeDimensions(mbti, big5, pdp, disc, enneagram);
  return { mbti, big5, pdp, disc, enneagram, dimensions };
}

// 从一条测评记录 r 重建 5 测试各自的 12 维 + 综合 12 维
export function buildDimensions5(r) {
  const mbti = { type: r.mbti || '' };
  const big5 = {
    E: Number(r.big5_e) || 0, C: Number(r.big5_c) || 0, A: Number(r.big5_a) || 0,
    N: Number(r.big5_n) || 0, O: Number(r.big5_o) || 0,
    emotionStability: Number(r.emotion_stability) || 0
  };
  const pdp = { primary: normalizePDPType(r.pdp || '') };
  const disc = { primary: r.disc || '' };
  const enneagram = { primary: Number(r.enneagram) || 0 };

  const byMBTI = dimensionsFromMBTI(mbti);
  const byBig5 = dimensionsFromBig5(big5);
  const byPDP  = dimensionsFromPDP(pdp);
  const byDISC = dimensionsFromDISC(disc);
  const byEnneagram = dimensionsFromEnneagram(enneagram);
  const combined = combineDimensions5(byMBTI, byBig5, byPDP, byDISC, byEnneagram, TEST_WEIGHTS);

  return { mbti, big5, pdp, disc, enneagram, byMBTI, byBig5, byPDP, byDISC, byEnneagram, combined };
}

// 综合匹配依据：根据 5 测试各自贡献，写成易读文本。
//   · 列出"5 测试加权综合维度"与岗位维度权重匹配中得分最高的 2-3 个维度
//   · 指出这些维度在哪个测试中表现最强、贡献了多少
function buildComprehensiveReason(job, dims, d5, name) {
  // 每个岗位维度按"员工分×岗位权重"排序，取 top 3
  const contributions = job.dimensions.map(d => ({
    dimension: d.dimension,
    weight: d.weight,
    employeeScore: dims[d.dimension] || 5,
    contribution: Math.round((dims[d.dimension] || 5) * d.weight / 10 * 10) / 10
  })).sort((a, b) => b.contribution - a.contribution).slice(0, 3);

  // 对每个贡献维度，找出它在哪个测试中得分最高
  const topDimsInfo = contributions.map(c => {
    const testScores = {
      MBTI: d5.byMBTI[c.dimension] || 0,
      大五: d5.byBig5[c.dimension] || 0,
      PDP: d5.byPDP[c.dimension] || 0,
      DISC: d5.byDISC[c.dimension] || 0,
      九型: d5.byEnneagram[c.dimension] || 0
    };
    const sortedTests = Object.entries(testScores).sort((a, b) => b[1] - a[1]);
    return { ...c, topTest: sortedTests[0][0], topTestScore: sortedTests[0][1] };
  });

  // 拼成自然语言
  const summary = topDimsInfo.map((t, i) =>
    `${i + 1}. ${t.dimension}（岗位权重 ${t.weight}%，综合 ${t.employeeScore}分）—— 主要由${t.topTest}测试贡献（${t.topTestScore}分）`
  ).join('\n');
  const qual = job.qualification ? `\n该岗位准入资质要求：${job.qualification}（属硬约束，未计入匹配度计算，仅供录用参考）。` : '';
  return `综合 5 测试加权，${job.name}岗位匹配度最高，核心依据：\n${summary}${qual}`;
}

// ===== 单测试"维度分析"文案：单独解读该测试结果 + 该测试推荐岗位 + 该测试权重占比 =====
function buildMbtiAnalysis(r, mbtiCn, jobName) {
  const info = getMBTIInfo(r.mbti || '');
  const strengths = (info.strengths || []).slice(0, 2).join('；');
  const traits = (info.traits || []).slice(0, 2).join('、');
  const core = r.mbti ? `${r.mbti}（${mbtiCn}）${traits ? '：' + traits : ''}` : '（未作答）';
  return `${core}。该测试单独看，其核心优势在于${strengths || '性格均衡'}；仅就此测试而言，最契合的岗位方向是【${jobName}】。`;
}

function buildBig5Analysis(big5, jobName) {
  const dims = [
    { name: '外倾性', s: big5.E || 0 },
    { name: '尽责性', s: big5.C || 0 },
    { name: '宜人性', s: big5.A || 0 },
    { name: '开放性', s: big5.O || 0 }
  ].sort((a, b) => b.s - a.s);
  const top1 = dims[0], top2 = dims[1];
  const n = big5.N || 0;
  const stableTxt = n <= 4 ? '情绪稳定、抗压较好' : (n >= 7 ? '情绪感受较丰富、对压力较敏感' : '情绪反应处于常态');
  const tone = describeBig5Tone(big5) || '各维度较均衡';
  return `大五人格整体呈「${tone}」：以${top1.name}（${top1.s}分）、${top2.name}（${top2.s}分）最为突出，${stableTxt}。仅就此测试而言，最契合的岗位方向是【${jobName}】。`;
}

function buildPdpAnalysis(primary, jobName) {
  const info = getPDPInfo(primary);
  const core = info.core || '';
  const behavior = (info.behavior || '').slice(0, 36);
  return `PDP 行为风格为${info.cnName}：${core}${behavior ? ' ' + behavior : ''} 仅就此测试而言，最契合的岗位方向是【${jobName}】。`;
}

function buildDiscAnalysis(primary, jobName) {
  const info = getDISCInfo(primary);
  const core = (info.core || '').replace(/。.*$/, '。'); // 取首句核心驱动力
  return `DISC 风格为${info.name}：${core}${info.behavior ? ' ' + info.behavior : ''} 仅就此测试而言，最契合的岗位方向是【${jobName}】。`;
}

function buildEnneagramAnalysis(num, jobName) {
  const info = getEnneagramInfo(num);
  const strengths = (info.strengths || []).slice(0, 2).join('、');
  return `九型人格为${info.name}：${(info.desire || '').replace(/。$/, '')}；优势在于${strengths || '特质均衡'}。${info.fit || ''} 仅就此测试而言，最契合的岗位方向是【${jobName}】。`;
}

// ===== 5 测试主题提取（用于立体互证） =====
function themeFromMBTI(type) {
  if (!type || type.length < 3) return null;
  const key = type[1] + type[2]; // 第2、3字母：NT/NF/SJ/SP
  return { NT: '战略与分析导向', NF: '人文与价值导向', SJ: '秩序与责任导向', SP: '务实与应变导向' }[key] || null;
}
function themeFromBig5(big5) {
  const arr = [
    { name: '开放与创新', s: big5.O || 0 },
    { name: '严谨与尽责', s: big5.C || 0 },
    { name: '共情与协作', s: big5.A || 0 },
    { name: '人际与活力', s: big5.E || 0 }
  ].sort((a, b) => b.s - a.s);
  let t = arr[0].name;
  if ((big5.N || 0) <= 3) t += '（兼情绪稳定）';
  return t;
}
const PDP_THEME = { '老虎': '领导与驱动', '孔雀': '影响与沟通', '无尾熊': '稳健与协作', '猫头鹰': '严谨与分析', '变色龙': '灵活与协调' };
const DISC_THEME = { D: '结果驱动', I: '人际影响', S: '稳健支持', C: '严谨合规' };
const ENN_THEME = { 1: '完美与尽责', 2: '助人与共情', 3: '成就与驱动', 4: '独特与创造', 5: '求知与分析', 6: '忠诚与谨慎', 7: '乐观与探索', 8: '果断与掌控', 9: '平和与调和' };

const CLUSTER = {
  '战略与分析导向': '分析严谨', '人文与价值导向': '人际共情', '秩序与责任导向': '稳健务实', '务实与应变导向': '稳健务实',
  '领导与驱动': '领导驱动', '影响与沟通': '人际共情', '稳健与协作': '稳健务实', '严谨与分析': '分析严谨', '灵活与协调': '稳健务实',
  '结果驱动': '领导驱动', '人际影响': '人际共情', '稳健支持': '稳健务实', '严谨合规': '分析严谨',
  '完美与尽责': '分析严谨', '助人与共情': '人际共情', '成就与驱动': '领导驱动', '独特与创造': '人际共情',
  '求知与分析': '分析严谨', '忠诚与谨慎': '分析严谨', '乐观与探索': '稳健务实', '果断与掌控': '领导驱动', '平和与调和': '人际共情',
  '开放与创新': '分析严谨', '严谨与尽责': '分析严谨', '共情与协作': '人际共情', '人际与活力': '人际共情'
};
const CLUSTER_METAPHOR = {
  '分析严谨': '思虑缜密、以专业立身', '人际共情': '以心换心、善建连接',
  '领导驱动': '果敢主导、敢扛事', '稳健务实': '踏实靠谱、稳中求进'
};

function describe3D(clusterSet) {
  let cognitive = '认知上偏均衡务实';
  if (clusterSet.has('分析严谨')) cognitive = '认知上偏系统思辨与逻辑分析，重证据与规范';
  else if (clusterSet.has('人际共情')) cognitive = '认知上偏人文洞察与价值感知，重关系与意义';
  else if (clusterSet.has('领导驱动')) cognitive = '认知上偏目标与结果导向，重突破与掌控';
  else if (clusterSet.has('稳健务实')) cognitive = '认知上偏规则、经验与稳定执行';

  let interp = '人际上张弛有度';
  if (clusterSet.has('人际共情')) interp = '人际上温和共情、以支持和陪伴见长';
  else if (clusterSet.has('领导驱动')) interp = '人际上主动外放、善于带动与影响';
  else if (clusterSet.has('稳健务实')) interp = '人际上稳扎稳打、重视配合';
  else if (clusterSet.has('分析严谨')) interp = '人际上偏克制，更重专业而非应酬';

  let drive = '行动上稳健落地';
  if (clusterSet.has('领导驱动')) drive = '行动上目标感强、敢于主导与推动';
  else if (clusterSet.has('分析严谨')) drive = '行动上重规范、求精求稳';
  else if (clusterSet.has('稳健务实')) drive = '行动上稳扎稳打、重视配合';
  else if (clusterSet.has('人际共情')) drive = '行动上以连接与服务他人为先';

  return `${cognitive}；${interp}；${drive}。`;
}

// 立体人物性格综合分析：5 测试互证，勾勒三维画像 + 一致点/差异点。
// 一致点采用"语义聚类"而非字面匹配——例如 MBTI 的"战略分析"、PDP 的"严谨分析"、
// DISC 的"严谨合规"、九型的"求知分析"虽字面不同，但都指向"分析严谨"底层特质。
function buildPersonalitySynthesis(r, d5) {
  const themes = [
    ['MBTI', themeFromMBTI(r.mbti)],
    ['大五', themeFromBig5(d5.big5)],
    ['PDP', PDP_THEME[d5.pdp.primary]],
    ['DISC', DISC_THEME[d5.disc.primary]],
    ['九型', ENN_THEME[d5.enneagram.primary]]
  ].filter(x => x[1]);

  // 语义聚类：每个测试 → 一个底层特质簇
  const clusterMap = {};
  const allClusters = new Set();
  themes.forEach(([test, theme]) => {
    const base = theme.replace(/（.*）$/, '');
    const cl = CLUSTER[base] || '多元';
    clusterMap[test] = cl;
    allClusters.add(cl);
  });
  const clusterCounts = {};
  Object.entries(clusterMap).forEach(([test, cl]) => {
    clusterCounts[cl] = clusterCounts[cl] || { count: 0, tests: [] };
    clusterCounts[cl].count++;
    clusterCounts[cl].tests.push(test);
  });
  const converge = Object.entries(clusterCounts).filter(([, v]) => v.count >= 2).sort((a, b) => b[1].count - a[1].count);

  // 差异点检测（常见表里张力）
  const divs = [];
  if (r.mbti && r.mbti[0] === 'E' && (d5.big5.E || 0) <= 4)
    divs.push('MBTI 显示外倾、偏好互动，但大五外倾性偏低，提示"外显活跃、内在仍需独处回血"的表里张力');
  if (r.mbti && r.mbti[2] === 'T' && (d5.big5.A || 0) >= 7)
    divs.push('MBTI 偏思考判断（T），而大五宜人性高，理性之中兼具温度，刚柔并济');
  if (d5.pdp.primary === '老虎' && d5.disc.primary === 'S')
    divs.push('PDP 老虎（主导驱动）与 DISC 稳健型（S）并存，可能在"推进"与"求稳"之间拉扯');
  if (d5.pdp.primary === '猫头鹰' && d5.disc.primary === 'I')
    divs.push('PDP 猫头鹰（严谨分析）与 DISC 影响型（I）并存，分析力与人际感染力兼具');
  if (d5.pdp.primary === '变色龙' && (d5.disc.primary === 'C' || d5.disc.primary === 'D'))
    divs.push('PDP 变色龙（灵活协调）与 DISC 偏刚/偏严并存，既善变通也守底线');

  let text = '综合五维互证：';
  if (converge.length) {
    text += converge.map(([cl, v]) =>
      `「${cl}」特质在 ${v.tests.join('、')} 上高度一致（${v.count} 项印证）`
    ).join('；') + '。';
    const metaphor = CLUSTER_METAPHOR[converge[0][0]] || converge[0][0];
    text += `由此勾勒出以「${converge[0][0]}」为底色的立体画像：`;
  } else {
    text += '五项测试各有侧重、未见明显聚拢，画像较为多元；';
  }
  text += describe3D(allClusters);
  if (divs.length) text += ' 值得注意的差异点：' + divs.join('；') + '。';
  else text += ' 各测试方向基本一致，画像清晰统一。';
  return text;
}

// 职业推荐综合分析：5 测试单项推荐 + 加权综合推荐，做交叉一致性研判。
function buildCareerSynthesis(perTestJobs, compTop, compPct, pool) {
  const list = [
    ['MBTI', perTestJobs.MBTI], ['大五', perTestJobs.大五], ['PDP', perTestJobs.PDP],
    ['DISC', perTestJobs.DISC], ['九型', perTestJobs.九型]
  ];
  const freq = {};
  list.forEach(([, j]) => { if (j && j !== '—') freq[j] = (freq[j] || 0) + 1; });
  if (compTop && compTop !== '—') freq[compTop] = (freq[compTop] || 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];

  let text = `职业推荐综合研判：五测试单项推荐分别为 ` +
    list.map(([t, j]) => `${t}→【${j}】`).join('、') + '。' +
    `综合采用五测试加权汇总，综合匹配岗位为【${compTop}】（匹配度 ${compPct}）。`;

  if (top && top[1] >= 4) {
    text += ` 其中【${top[0]}】被 ${top[1]} 项测试（含综合）共同指向，跨测试一致性极高，推荐置信度高，应作为优先安排方向。`;
  } else if (top && top[1] >= 2) {
    text += ` 多个测试在【${sorted.map(s => s[0]).join('、')}】上出现交叉（各 ${sorted.map(s => s[1]).join('/')} 项），建议结合个人意愿与岗位编制，在该交集方向内择优。`;
  } else {
    text += ` 各测试指向相对分散，说明其可塑性较强，可在【${compTop}】等交集方向先行试用，并结合实际表现再定向。`;
  }

  if (compTop && compTop !== '—') {
    const jobObj = (pool || []).find(j => j.name === compTop);
    if (jobObj && jobObj.qualification) {
      text += ` 该综合推荐岗位设有准入资质要求：${jobObj.qualification}（属硬约束，仅供录用参考，未计入匹配度）。`;
    }
  }
  return text;
}

// ===== 单条记录导出 =====
// jobs 参数用于覆盖 defaultJobs（如"岗位管理"中已编辑过的配置）。
export function analyzeForExport(r, jobs = []) {
  const row = {};
  EXPORT_COLUMNS.forEach(c => { row[c] = ''; });

  row['姓名'] = r.name || '';
  row['年龄'] = (r.age !== undefined && r.age !== null && r.age !== '') ? r.age : '';

  const mbtiInfo = getMBTIInfo(r.mbti || '');
  const mbtiCn = mbtiInfo && mbtiInfo.cnName ? mbtiInfo.cnName : (r.mbti || '');
  row['MBTI类型'] = r.mbti ? `${r.mbti}（${mbtiCn}）` : '';

  // 数据缺失保护
  if (!r.mbti && !r.big5_e) {
    row['性格分析之特长'] = '（测评数据缺失，无法生成）';
    row['性格分析之优势'] = '（测评数据缺失，无法生成）';
    row['优势'] = '（测评数据缺失，无法生成）';
    row['劣势'] = '（测评数据缺失，无法生成）';
    row['MBTI匹配岗位'] = row['大五匹配岗位'] = row['PDP匹配岗位'] = row['DISC匹配岗位'] = row['九型匹配岗位'] = '—';
    row['综合匹配岗位'] = '—';
    row['综合匹配度'] = '';
    row['综合匹配依据'] = '（数据缺失）';
    ['MBTI维度分析', '大五维度分析', 'PDP维度分析', 'DISC维度分析', '九型维度分析', '立体人物性格综合分析', '职业推荐综合分析']
      .forEach(c => { row[c] = '（测评数据缺失，无法生成）'; });
    return row;
  }

  // 个性化解读（基于 5 测试综合维度，区别于旧版的纯 MBTI/大五叠加）
  const d5 = buildDimensions5(r);
  const ranked = sortedDims(d5.combined);
  const [d1, s1] = ranked[0];
  const [d2, s2] = ranked[1] || [d1, s1];

  const pdpInfo = getPDPInfo(d5.pdp.primary);
  const pdpCn = pdpInfo ? pdpInfo.cnName : d5.pdp.primary;

  row['性格分析之特长'] = r.mbti
    ? `${mbtiCn}（${r.mbti}）底色 + ${pdpCn}行为风格 + 大五${describeBig5Tone(d5.big5)}，叠加实测强项——${d1}（${s1}分）与${d2}（${s2}分），共同构成核心特长。`
    : `${pdpCn}行为风格 + 大五${describeBig5Tone(d5.big5)}，实测强项为${d1}（${s1}分）与${d2}（${s2}分），构成核心特长。`;

  row['性格分析之优势'] = (POSITIVE_POOL[d1] && stablePick(POSITIVE_POOL[d1], r.name + d1 + s1))
    || `${d1}（${s1}分）表现突出。`;

  const resultsForNarr = {
    mbti: d5.mbti, big5: d5.big5, pdp: d5.pdp, disc: d5.disc, enneagram: d5.enneagram,
    dimensions: d5.combined
  };
  row['优势'] = buildStrengthsNarrative(resultsForNarr, r.name || '');
  row['劣势'] = buildGrowthNarrative(resultsForNarr, r.name || '');

  // 岗位池：使用传入 jobs（"岗位管理"配置），否则用 defaultJobs 的全集。
  const pool = (jobs && jobs.length) ? jobs : DEFAULT_JOBS;

  // 5 测试各自匹配 top1
  const mMBTI = matchJobs(d5.byMBTI, pool);
  const mBig5 = matchJobs(d5.byBig5, pool);
  const mPDP  = matchJobs(d5.byPDP, pool);
  const mDISC = matchJobs(d5.byDISC, pool);
  const mEnne = matchJobs(d5.byEnneagram, pool);

  const jobMBTI = mMBTI.length ? mMBTI[0].job.name : '—';
  const jobBig5 = mBig5.length ? mBig5[0].job.name : '—';
  const jobPDP  = mPDP.length  ? mPDP[0].job.name  : '—';
  const jobDISC = mDISC.length ? mDISC[0].job.name : '—';
  const jobEnne = mEnne.length ? mEnne[0].job.name : '—';

  row['MBTI匹配岗位'] = jobMBTI;
  row['大五匹配岗位'] = jobBig5;
  row['PDP匹配岗位']  = jobPDP;
  row['DISC匹配岗位'] = jobDISC;
  row['九型匹配岗位'] = jobEnne;

  // 每测试"维度分析"：单独解读该测试结果 + 推荐岗位
  row['MBTI维度分析'] = buildMbtiAnalysis(r, mbtiCn, jobMBTI);
  row['大五维度分析'] = buildBig5Analysis(d5.big5, jobBig5);
  row['PDP维度分析']  = buildPdpAnalysis(d5.pdp.primary, jobPDP);
  row['DISC维度分析'] = buildDiscAnalysis(d5.disc.primary, jobDISC);
  row['九型维度分析'] = buildEnneagramAnalysis(d5.enneagram.primary, jobEnne);

  // 综合 5 测试加权匹配
  const mAll = matchJobs(d5.combined, pool);
  let compTop = '—', compPct = '';
  if (mAll.length) {
    const top = mAll[0];
    compTop = top.job.name;
    compPct = top.matchPct + '%';
    row['综合匹配岗位'] = compTop;
    row['综合匹配度'] = compPct;
    row['综合匹配依据'] = buildComprehensiveReason(top.job, d5.combined, d5, r.name || '');
  } else {
    row['综合匹配岗位'] = '—';
    row['综合匹配度'] = '';
    row['综合匹配依据'] = '（无岗位可匹配）';
  }

  // 综合叙事（立体互证）
  row['立体人物性格综合分析'] = buildPersonalitySynthesis(r, d5);
  row['职业推荐综合分析'] = buildCareerSynthesis(
    { MBTI: jobMBTI, 大五: jobBig5, PDP: jobPDP, DISC: jobDISC, 九型: jobEnne },
    compTop, compPct, pool
  );

  return row;
}

// 大五人格语调标签（用作"性格分析之特长"的语义增强）
function describeBig5Tone(big5) {
  if (!big5 || (!big5.E && !big5.C && !big5.A && !big5.N && !big5.O)) return '';
  const high = [];
  if (big5.E >= 7) high.push('高外向');
  if (big5.C >= 7) high.push('高尽责');
  if (big5.A >= 7) high.push('高宜人');
  if (big5.O >= 7) high.push('高开放');
  if ((big5.N || 0) <= 3) high.push('高情绪稳定');
  if (!high.length) return '特质均衡';
  return high.join('·');
}

// 兼容旧名：XINGQINGNIAO_COLUMNS（旧版导出列名）
export const XINGQINGNIAO_COLUMNS = EXPORT_COLUMNS;