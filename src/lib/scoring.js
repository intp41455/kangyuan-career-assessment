import { mbtiQuestions, big5Questions, pdpQuestions, discQuestions, enneagramQuestions } from '../data/questions.js';

// ===== MBTI 计分 =====
export function scoreMBTI(answers) {
  const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  mbtiQuestions.forEach(q => {
    const ans = answers[q.id];
    if (ans && counts[ans] !== undefined) counts[ans]++;
  });
  const eiTotal = counts.E + counts.I || 1;
  const snTotal = counts.S + counts.N || 1;
  const tfTotal = counts.T + counts.F || 1;
  const jpTotal = counts.J + counts.P || 1;
  const type =
    (counts.E >= counts.I ? 'E' : 'I') +
    (counts.S >= counts.N ? 'S' : 'N') +
    (counts.T >= counts.F ? 'T' : 'F') +
    (counts.J >= counts.P ? 'J' : 'P');
  return {
    type,
    counts,
    percentages: {
      E: Math.round(counts.E / eiTotal * 100),
      I: Math.round(counts.I / eiTotal * 100),
      S: Math.round(counts.S / snTotal * 100),
      N: Math.round(counts.N / snTotal * 100),
      T: Math.round(counts.T / tfTotal * 100),
      F: Math.round(counts.F / tfTotal * 100),
      J: Math.round(counts.J / jpTotal * 100),
      P: Math.round(counts.P / jpTotal * 100)
    }
  };
}

// ===== 大五人格 计分 =====
export function scoreBig5(answers) {
  const sums = { E: 0, C: 0, A: 0, N: 0, O: 0 };
  const counts = { E: 0, C: 0, A: 0, N: 0, O: 0 };
  big5Questions.forEach(q => {
    const raw = answers[q.id];
    if (raw == null) return;
    const v = q.reverse ? (6 - raw) : raw;
    sums[q.dim] += v;
    counts[q.dim]++;
  });
  const normalize = (dim, maxItems, maxScore = 5) => {
    if (!counts[dim]) return 5;
    const avg = sums[dim] / counts[dim];
    return Math.round((avg / maxScore) * 10 * 10) / 10;
  };
  const E = normalize('E', 10);
  const C = normalize('C', 10);
  const A = normalize('A', 10);
  const N = normalize('N', 8);
  const O = normalize('O', 6);
  return {
    E, C, A, N, O,
    emotionStability: Math.round((10 - N) * 10) / 10,
    raw: { sums: { ...sums }, counts: { ...counts } }
  };
}

// ===== PDP 计分 =====
export function scorePDP(answers) {
  const types = ['老虎', '孔雀', '无尾熊', '猫头鹰', '变色龙'];
  const sums = { 老虎: 0, 孔雀: 0, 无尾熊: 0, 猫头鹰: 0, 变色龙: 0 };
  const counts = { 老虎: 0, 孔雀: 0, 无尾熊: 0, 猫头鹰: 0, 变色龙: 0 };
  pdpQuestions.forEach(q => {
    const raw = answers[q.id];
    if (raw == null) return;
    sums[q.type] += raw;
    counts[q.type]++;
  });
  const scores = {};
  types.forEach(t => {
    scores[t] = counts[t] ? Math.round((sums[t] / (counts[t] * 5)) * 10 * 10) / 10 : 0;
  });
  const sorted = types.map(t => ({ type: t, score: scores[t] })).sort((a, b) => b.score - a.score);
  return {
    primary: sorted[0].type,
    secondary: sorted[1].type,
    scores,
    sorted
  };
}

// ===== DISC 计分 =====
export function scoreDISC(answers) {
  const counts = { D: 0, I: 0, S: 0, C: 0 };
  discQuestions.forEach(q => {
    const ans = answers[q.id];
    if (ans && counts[ans] !== undefined) counts[ans]++;
  });
  const sorted = ['D', 'I', 'S', 'C'].map(k => ({ type: k, count: counts[k] })).sort((a, b) => b.count - a.count);
  const total = sorted.reduce((s, x) => s + x.count, 0) || 1;
  const scores = {};
  ['D', 'I', 'S', 'C'].forEach(k => { scores[k] = Math.round(counts[k] / total * 100); });
  return {
    primary: sorted[0].type,
    secondary: sorted[1].type,
    scores,
    counts
  };
}

// ===== 九型人格 计分 =====
export function scoreEnneagram(answers) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  enneagramQuestions.forEach(q => {
    if (answers[q.id] === true) counts[q.type]++;
  });
  const sorted = Object.keys(counts).map(k => ({ type: Number(k), count: counts[k] })).sort((a, b) => b.count - a.count);
  return {
    primary: sorted[0].type,
    scores: counts,
    sorted
  };
}

// ===== 12 维度得分映射 (基于大五 + MBTI + PDP + DISC + 九型) =====
// 维度池: 共情能力、情绪稳定、责任心、沟通表达、抗压能力、学习能力、领导力、团队协作、细致严谨、创新思维、主动性、服务意识
export function computeDimensions(mbti, big5, pdp, disc, enneagram) {
  const { type: mbtiType } = mbti;
  const { E, C, A, N, O, emotionStability } = big5;

  // 共情能力: 宜人性 + MBTI(F) + 九型(2,4,9)
  let empathy = A * 0.5 + (mbtiType.includes('F') ? 8 : 5) * 0.3;
  if (enneagram.primary === 2 || enneagram.primary === 4 || enneagram.primary === 9) empathy += 1.5;
  empathy = clamp(empathy);

  // 情绪稳定: 10 - 神经质 + MBTI(J倾向更稳定)
  let emotionStable = emotionStability * 0.7 + (mbtiType.includes('J') ? 6 : 5) * 0.3;
  emotionStable = clamp(emotionStable);

  // 责任心: 尽责性 + MBTI(J)
  let responsibility = C * 0.7 + (mbtiType.includes('J') ? 7 : 5) * 0.3;
  responsibility = clamp(responsibility);

  // 沟通表达: 外倾性 + PDP(孔雀/老虎) + DISC(I/D)
  let communication = E * 0.4 + 5 * 0.2;
  if (pdp.primary === '孔雀' || pdp.primary === '老虎') communication += 1.5;
  if (disc.primary === 'I' || disc.primary === 'D') communication += 1;
  communication = clamp(communication);

  // 抗压能力: 情绪稳定 + PDP(老虎/变色龙) + DISC(D)
  let stress = emotionStability * 0.5 + 5 * 0.2;
  if (pdp.primary === '老虎' || pdp.primary === '变色龙') stress += 1.5;
  if (disc.primary === 'D') stress += 1;
  stress = clamp(stress);

  // 学习能力: 开放性 + MBTI(N)
  let learning = O * 0.6 + (mbtiType.includes('N') ? 7 : 5) * 0.3;
  learning = clamp(learning);

  // 领导力: 外倾性 + PDP(老虎) + DISC(D) + MBTI(ENTJ/ESTJ加成)
  let leadership = E * 0.3 + 5 * 0.2;
  if (pdp.primary === '老虎') leadership += 1.5;
  if (disc.primary === 'D') leadership += 1;
  if (['ENTJ', 'ESTJ', 'ENFJ', 'ESTP'].includes(mbtiType)) leadership += 1;
  leadership = clamp(leadership);

  // 团队协作: 宜人性 + PDP(无尾熊/变色龙) + DISC(S)
  let teamwork = A * 0.4 + 5 * 0.2;
  if (pdp.primary === '无尾熊' || pdp.primary === '变色龙') teamwork += 1.5;
  if (disc.primary === 'S') teamwork += 1;
  teamwork = clamp(teamwork);

  // 细致严谨: 尽责性 + PDP(猫头鹰) + DISC(C) + MBTI(S/J)
  let meticulous = C * 0.4 + 5 * 0.2;
  if (pdp.primary === '猫头鹰') meticulous += 1.5;
  if (disc.primary === 'C') meticulous += 1;
  if (mbtiType.includes('S') && mbtiType.includes('J')) meticulous += 0.8;
  meticulous = clamp(meticulous);

  // 创新思维: 开放性 + MBTI(N/P) + PDP(变色龙/孔雀)
  let innovation = O * 0.5 + 5 * 0.2;
  if (mbtiType.includes('N')) innovation += 1;
  if (mbtiType.includes('P')) innovation += 0.5;
  if (pdp.primary === '变色龙' || pdp.primary === '孔雀') innovation += 0.8;
  innovation = clamp(innovation);

  // 主动性: 外倾性 + PDP(老虎/孔雀) + DISC(D/I)
  let initiative = E * 0.4 + 5 * 0.2;
  if (pdp.primary === '老虎' || pdp.primary === '孔雀') initiative += 1.5;
  if (disc.primary === 'D' || disc.primary === 'I') initiative += 1;
  initiative = clamp(initiative);

  // 服务意识: 宜人性 + PDP(无尾熊) + DISC(S) + 九型(2,9)
  let service = A * 0.5 + 5 * 0.2;
  if (pdp.primary === '无尾熊') service += 1;
  if (disc.primary === 'S') service += 1;
  if (enneagram.primary === 2 || enneagram.primary === 9) service += 1;
  service = clamp(service);

  const dims = {
    '共情能力': round1(empathy),
    '情绪稳定': round1(emotionStable),
    '责任心': round1(responsibility),
    '沟通表达': round1(communication),
    '抗压能力': round1(stress),
    '学习能力': round1(learning),
    '领导力': round1(leadership),
    '团队协作': round1(teamwork),
    '细致严谨': round1(meticulous),
    '创新思维': round1(innovation),
    '主动性': round1(initiative),
    '服务意识': round1(service)
  };
  // 在 12 个人格基底维度之上，派生 10 个职业行为胜任力细分维度（见 deriveBLayer）
  return { ...dims, ...deriveBLayer(dims) };
}

function clamp(v, min = 1, max = 10) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
function round1(v) { return Math.round(v * 10) / 10; }

// ===== 单测试维度推导 =====
// 每个函数只用一个测试结果推导出 12 维评分（用于"单项匹配岗位"和综合加权）
// 数据缺失时返回中位值 5（保证不影响整体加权）。

// MBTI 16型 → 12 维。基于 4 字母组合 + 16 型典型特征。
function _mbtiDimensions(type) {
  if (!type || type.length !== 4) return _zeroDimensions();
  const has = (ch) => type.includes(ch);
  const result = {};
  // E/I
  result['沟通表达'] = has('E') ? 8 : 4;
  result['主动性'] = has('E') ? 8 : 5;
  result['领导力'] = has('E') ? 7 : 5;
  result['服务意识'] = has('E') ? 7 : 6;
  // S/N
  result['学习能力'] = has('N') ? 8 : 5;
  result['创新思维'] = has('N') ? 8 : 4;
  result['细致严谨'] = has('S') ? 7 : 5;
  // T/F
  result['共情能力'] = has('F') ? 8 : 4;
  result['服务意识'] = Math.max(result['服务意识'] || 0, has('F') ? 8 : 5);
  result['团队协作'] = has('F') ? 8 : 5;
  // J/P
  result['责任心'] = has('J') ? 8 : 5;
  result['情绪稳定'] = has('J') ? 7 : 5;
  result['细致严谨'] = Math.max(result['细致严谨'] || 0, has('J') ? 8 : 5);
  // 抗压与领导力的复合类型加成
  result['抗压能力'] = (has('T') ? 7 : 5);
  if (['ENTJ', 'ESTJ', 'ENFJ', 'ESTP'].includes(type)) {
    result['领导力'] = Math.max(result['领导力'] || 0, 9);
    result['抗压能力'] = Math.max(result['抗压能力'] || 0, 8);
  }
  if (['ISTJ', 'ISFJ'].includes(type)) {
    result['细致严谨'] = Math.max(result['细致严谨'] || 0, 9);
    result['责任心'] = Math.max(result['责任心'] || 0, 9);
  }
  if (['INTP', 'ISTP'].includes(type)) {
    result['学习能力'] = Math.max(result['学习能力'] || 0, 9);
    result['创新思维'] = Math.max(result['创新思维'] || 0, 7);
  }
  if (['ENFP', 'INFP'].includes(type)) {
    result['共情能力'] = Math.max(result['共情能力'] || 0, 9);
    result['服务意识'] = Math.max(result['服务意识'] || 0, 8);
  }
  return _fillAll(result);
}

function _big5Dimensions(big5) {
  if (!big5 || !big5.E && !big5.C && !big5.A && !big5.N && !big5.O) return _zeroDimensions();
  const { E, C, A, N, O, emotionStability } = big5;
  const result = {
    '共情能力': clamp(round1((A || 5) * 0.9 + 1)),
    '情绪稳定': clamp(round1(emotionStability || (10 - (N || 5)))),
    '责任心': clamp(round1(C || 5)),
    '沟通表达': clamp(round1(E || 5)),
    '抗压能力': clamp(round1((10 - (N || 5)))),
    '学习能力': clamp(round1(O || 5)),
    '领导力': clamp(round1((E || 5) * 0.8 + 1)),
    '团队协作': clamp(round1((A || 5) * 0.8 + 1)),
    '细致严谨': clamp(round1(C || 5)),
    '创新思维': clamp(round1(O || 5)),
    '主动性': clamp(round1(E || 5)),
    '服务意识': clamp(round1((A || 5) * 0.9 + 1))
  };
  return _fillAll(result);
}

// PDP 5 动物 → 12 维。基于新版特质定义（老虎/孔雀/无尾熊/猫头鹰/变色龙）。
function _pdpDimensions(pdpPrimary) {
  const profile = {
    '老虎':   { '领导力': 9, '抗压能力': 8, '主动性': 9, '责任心': 7, '沟通表达': 7, '学习能力': 5, '服务意识': 4, '共情能力': 4, '团队协作': 5, '细致严谨': 5, '创新思维': 6, '情绪稳定': 6 },
    '孔雀':   { '沟通表达': 9, '服务意识': 8, '共情能力': 8, '主动性': 8, '创新思维': 7, '团队协作': 7, '学习能力': 6, '细致严谨': 5, '责任心': 5, '领导力': 6, '抗压能力': 5, '情绪稳定': 6 },
    '无尾熊': { '团队协作': 8, '共情能力': 8, '服务意识': 8, '情绪稳定': 7, '细致严谨': 7, '责任心': 7, '沟通表达': 5, '抗压能力': 5, '学习能力': 5, '主动性': 4, '创新思维': 4, '领导力': 4 },
    '猫头鹰': { '细致严谨': 9, '责任心': 8, '学习能力': 8, '情绪稳定': 7, '抗压能力': 7, '沟通表达': 4, '团队协作': 5, '共情能力': 5, '服务意识': 5, '主动性': 4, '创新思维': 5, '领导力': 5 },
    '变色龙': { '团队协作': 7, '沟通表达': 7, '抗压能力': 7, '情绪稳定': 7, '创新思维': 7, '服务意识': 6, '学习能力': 6, '共情能力': 6, '责任心': 6, '主动性': 6, '领导力': 6, '细致严谨': 6 }
  };
  return _fillAll(profile[pdpPrimary] || {});
}

// DISC 4 型 → 12 维。
function _discDimensions(discPrimary) {
  const profile = {
    'D': { '领导力': 9, '抗压能力': 9, '主动性': 8, '责任心': 7, '沟通表达': 6, '学习能力': 5, '团队协作': 4, '共情能力': 4, '服务意识': 3, '细致严谨': 5, '创新思维': 5, '情绪稳定': 6 },
    'I': { '沟通表达': 9, '服务意识': 8, '共情能力': 8, '主动性': 8, '团队协作': 7, '领导力': 6, '创新思维': 7, '学习能力': 6, '责任心': 5, '细致严谨': 4, '抗压能力': 5, '情绪稳定': 6 },
    'S': { '团队协作': 9, '共情能力': 8, '服务意识': 8, '责任心': 8, '细致严谨': 7, '情绪稳定': 7, '抗压能力': 6, '学习能力': 5, '主动性': 5, '创新思维': 4, '领导力': 5, '沟通表达': 6 },
    'C': { '细致严谨': 9, '学习能力': 8, '责任心': 8, '抗压能力': 7, '情绪稳定': 7, '服务意识': 6, '共情能力': 5, '团队协作': 5, '沟通表达': 4, '主动性': 4, '创新思维': 4, '领导力': 4 }
  };
  return _fillAll(profile[discPrimary] || {});
}

// 九型 9 型 → 12 维。
function _enneagramDimensions(typePrimary) {
  const profile = {
    1: { '责任心': 9, '细致严谨': 9, '服务意识': 8, '团队协作': 7, '共情能力': 6, '情绪稳定': 7, '抗压能力': 6, '学习能力': 7, '沟通表达': 5, '主动性': 5, '创新思维': 4, '领导力': 5 },
    2: { '共情能力': 9, '服务意识': 9, '团队协作': 8, '沟通表达': 8, '情绪稳定': 7, '抗压能力': 6, '责任心': 6, '细致严谨': 5, '学习能力': 5, '主动性': 6, '创新思维': 5, '领导力': 5 },
    3: { '领导力': 8, '沟通表达': 8, '主动性': 9, '抗压能力': 8, '责任心': 7, '学习能力': 7, '团队协作': 6, '服务意识': 5, '创新思维': 7, '共情能力': 5, '细致严谨': 5, '情绪稳定': 6 },
    4: { '创新思维': 8, '共情能力': 8, '沟通表达': 7, '服务意识': 6, '团队协作': 5, '责任心': 5, '学习能力': 7, '抗压能力': 5, '主动性': 6, '细致严谨': 4, '领导力': 5, '情绪稳定': 4 },
    5: { '学习能力': 9, '创新思维': 8, '细致严谨': 7, '责任心': 6, '共情能力': 5, '抗压能力': 6, '团队协作': 4, '服务意识': 4, '沟通表达': 4, '主动性': 5, '领导力': 4, '情绪稳定': 6 },
    6: { '团队协作': 7, '责任心': 7, '细致严谨': 8, '抗压能力': 7, '情绪稳定': 5, '学习能力': 6, '共情能力': 6, '服务意识': 6, '沟通表达': 5, '主动性': 5, '创新思维': 4, '领导力': 5 },
    7: { '主动性': 9, '创新思维': 9, '抗压能力': 8, '沟通表达': 8, '学习能力': 7, '团队协作': 5, '服务意识': 5, '共情能力': 5, '责任心': 4, '细致严谨': 4, '领导力': 6, '情绪稳定': 6 },
    8: { '领导力': 9, '抗压能力': 9, '主动性': 9, '沟通表达': 7, '责任心': 7, '团队协作': 5, '服务意识': 4, '共情能力': 4, '学习能力': 5, '细致严谨': 4, '创新思维': 6, '情绪稳定': 5 },
    9: { '团队协作': 9, '共情能力': 8, '服务意识': 8, '沟通表达': 7, '抗压能力': 6, '情绪稳定': 7, '责任心': 6, '学习能力': 5, '主动性': 4, '创新思维': 4, '细致严谨': 5, '领导力': 4 }
  };
  return _fillAll(profile[typePrimary] || {});
}

// ===== 22 维岗位匹配维度池 =====
// A 层 · 人格基底（12）：由 5 测试直接/间接推导的核心性格特质。
// B 层 · 职业行为胜任力细分（10）：在 A 层之上派生，更贴近岗位实际工作场景，
//      避免"通用性格维度"过粗；这些维度由对应 A 维度加权合成，因此在各测试中不再恒为基准分。
export const A_DIMS = ['共情能力','情绪稳定','责任心','沟通表达','抗压能力','学习能力','领导力','团队协作','细致严谨','创新思维','主动性','服务意识'];
export const B_DIMS = ['口头表达与说服','倾听理解与回应','流程合规与差错防范','应急与危机处置','观察洞察','执行落地','跨部门协调','持续学习适应','耐心与照护亲和','专业审慎与风险意识'];
export const ALL_DIMS = [...A_DIMS, ...B_DIMS];

// 由 12 个 A 层维度派生 10 个 B 层职业胜任力维度（各 A 维度缺失时回落到中位 5）。
function deriveBLayer(a) {
  const g = (k) => (a && a[k] != null) ? a[k] : 5;
  const w = (x) => clamp(round1(x));
  return {
    '口头表达与说服': w(0.60 * g('沟通表达') + 0.40 * g('领导力')),
    '倾听理解与回应': w(0.70 * g('共情能力') + 0.30 * g('团队协作')),
    '流程合规与差错防范': w(0.65 * g('细致严谨') + 0.35 * g('责任心')),
    '应急与危机处置': w(0.50 * g('抗压能力') + 0.30 * g('主动性') + 0.20 * g('情绪稳定')),
    '观察洞察': w(0.40 * g('细致严谨') + 0.30 * g('共情能力') + 0.30 * g('学习能力')),
    '执行落地': w(0.60 * g('责任心') + 0.40 * g('主动性')),
    '跨部门协调': w(0.50 * g('沟通表达') + 0.50 * g('团队协作')),
    '持续学习适应': w(0.55 * g('学习能力') + 0.45 * g('抗压能力')),
    '耐心与照护亲和': w(0.50 * g('共情能力') + 0.30 * g('服务意识') + 0.20 * g('情绪稳定')),
    '专业审慎与风险意识': w(0.55 * g('细致严谨') + 0.25 * g('责任心') + 0.20 * g('情绪稳定'))
  };
}

function _fillAll(partial) {
  const out = {};
  A_DIMS.forEach(d => { out[d] = round1(partial[d] ?? 5); });
  Object.assign(out, deriveBLayer(out));
  return out;
}
function _zeroDimensions() { return _fillAll({}); }

export function dimensionsFromMBTI(mbti) {
  return _mbtiDimensions(mbti && mbti.type);
}
export function dimensionsFromBig5(big5) {
  return _big5Dimensions(big5);
}
export function dimensionsFromPDP(pdp) {
  return _pdpDimensions(pdp && pdp.primary);
}
export function dimensionsFromDISC(disc) {
  return _discDimensions(disc && disc.primary);
}
export function dimensionsFromEnneagram(enne) {
  return _enneagramDimensions(enne && enne.primary);
}

// 5 测试加权综合：每个测试单独推导 12 维，再按权重加权平均。
// weights 形如 { mbti: 25, big5: 25, pdp: 20, disc: 15, enneagram: 15 }，百分比单位，合计应为 100。
export function combineDimensions5(byMBTI, byBig5, byPDP, byDISC, byEnneagram, weights) {
  const w = weights || { mbti: 25, big5: 25, pdp: 20, disc: 15, enneagram: 15 };
  const total = (w.mbti || 0) + (w.big5 || 0) + (w.pdp || 0) + (w.disc || 0) + (w.enneagram || 0);
  const f = total > 0 ? 1 / total : 0; // 归一化
  const out = {};
  ALL_DIMS.forEach(d => {
    const v =
      (byMBTI[d] || 5) * (w.mbti || 0) +
      (byBig5[d] || 5) * (w.big5 || 0) +
      (byPDP[d] || 5) * (w.pdp || 0) +
      (byDISC[d] || 5) * (w.disc || 0) +
      (byEnneagram[d] || 5) * (w.enneagram || 0);
    out[d] = round1(v * f);
  });
  return out;
}

// ===== 岗位匹配算法 =====
// 匹配度 = Σ(员工维度得分 × 岗位维度权重) / (10 × Σ权重) × 100%
export function matchJobs(dimensions, jobs) {
  if (!Array.isArray(jobs)) return [];
  // 容错：岗位配置损坏（dimensions 缺失/非数组/空）时跳过，避免整份报告崩溃
  return jobs.filter(job => job && Array.isArray(job.dimensions) && job.dimensions.length > 0).map(job => {
    let weightedSum = 0;
    let weightTotal = 0;
    const details = [];
    job.dimensions.forEach(d => {
      const empScore = dimensions[d.dimension] ?? 5;
      const weight = d.weight;
      weightedSum += empScore * weight;
      weightTotal += weight;
      details.push({
        dimension: d.dimension,
        weight,
        employeeScore: empScore,
        // 该维度对匹配度的实际贡献（占 0-100% 的百分点）：得分×权重/10
        contribution: Math.round((empScore * weight / 10) * 10) / 10
      });
    });
    const matchPct = weightTotal > 0
      ? Math.round((weightedSum / (10 * weightTotal)) * 1000) / 10
      : 0;
    return { job, matchPct, details };
  }).sort((a, b) => b.matchPct - a.matchPct);
}

// ===== 综合评分入口 =====
export function scoreAll(answers) {
  const mbti = scoreMBTI(answers);
  const big5 = scoreBig5(answers);
  const pdp = scorePDP(answers);
  const disc = scoreDISC(answers);
  const enneagram = scoreEnneagram(answers);
  const dimensions = computeDimensions(mbti, big5, pdp, disc, enneagram);
  return { mbti, big5, pdp, disc, enneagram, dimensions };
}