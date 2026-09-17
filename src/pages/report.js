import { STORAGE_KEY, supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { scoreAll, matchJobs } from '../lib/scoring.js';
import { getMBTIInfo } from '../data/mbtiLibrary.js';
import { getBig5DimInfo, big5WorkEnvPreference, big5TeamRole, big5MgmtAdvice, big5Level } from '../data/big5Library.js';
import { getPDPInfo } from '../data/pdpLibrary.js';
import { getDISCInfo } from '../data/discLibrary.js';
import { getEnneagramInfo } from '../data/enneagramLibrary.js';
import { getBloodTypeInfo, getZodiacInfo } from '../data/auxLibrary.js';
import { generateStrengths, generatePotentials, generateGrowthPoints, generateFinalAdvice, recommendBusiness, generateTopReasons } from '../lib/reportGenerator.js';
import { loadLocalJobs, loadLocalRecords, saveLocalRecord } from '../lib/store.js';
import { DEFAULT_JOBS } from '../data/defaultJobs.js';
import Chart from 'chart.js/auto';

const reportPage = document.getElementById('reportPage');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!saved.profile || !saved.answers) {
      window.location.href = './';
      return null;
    }
    return saved;
  } catch (e) {
    window.location.href = './';
    return null;
  }
}

// 按记录ID加载一条测评（后台查看用）：云端优先，本机回退
async function loadRecordById(recId) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('assessments').select('*').eq('id', recId).maybeSingle();
      if (!error && data) return data;
    } catch (e) { console.warn('云端读取记录失败：', e); }
  }
  try {
    const local = loadLocalRecords().find(r => r.id === recId);
    return local || null;
  } catch (e) {
    console.warn('本机读取记录失败：', e);
    return null;
  }
}

async function init() {
  // 支持后台按记录ID调阅完整报告： result.html?id=<uuid>
  const params = new URLSearchParams(location.search);
  const recId = params.get('id');

  let profile, answers, viewOnly = false;
  let saved = null; // 需在整个 init 作用域内使用（幂等守卫、保存记录）

  if (recId) {
    // 后台查看模式：从存档还原 profile + 原始答案，重新生成完整报告
    const rec = await loadRecordById(recId);
    if (!rec || !rec.answers) {
      reportPage.innerHTML = `<div class="report-empty"><h2>无法加载该测评记录</h2><p>记录不存在、已被删除，或当前账号无权限访问。</p><a href="./admin.html" class="btn btn-primary" style="margin-top:16px;">返回管理后台</a></div>`;
      return;
    }
    profile = { name: rec.name, gender: rec.gender, age: rec.age, blood_type: rec.blood_type, zodiac: rec.zodiac };
    answers = rec.answers;
    viewOnly = true;
  } else {
    saved = loadState();
    if (!saved) return;
    profile = saved.profile;
    answers = saved.answers;
    // 确保本次提交有稳定ID：结果页刷新/重开时复用同一ID，云端 upsert 落到同一行，避免重复
    if (!saved.submissionId) {
      saved.submissionId = uuid();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (e) { /* ignore */ }
    }
  }

  // 第一步：评分（容错：失败也保留原始数据，不让用户丢失）
  let results;
  try {
    results = scoreAll(answers);
  } catch (e) {
    console.error('评分失败：', e);
    reportPage.innerHTML = `<div class="report-empty"><h2>报告生成失败</h2><p>${escapeHtml(e.message || String(e))}</p><p style="font-size:13px;color:#888;margin-top:12px;">测评数据已保存，可联系管理员协助处理。</p><a href="./" class="btn btn-primary" style="margin-top:16px;">返回首页</a></div>`;
    return;
  }
  const { mbti, big5, pdp, disc, enneagram, dimensions } = results;

  // 第二步：组装记录并写入（仅员工自己提交时；后台查看模式不重复写入）
  // 顺序：先存本机 → 再试云端。无论云端成功与否，员工一定能看到报告、数据也留在本机。
  // 幂等保护：已完成的测评（saved.completed）再次进入本页（如刷新）不再写入，从根本上杜绝重复报告。
  if (!viewOnly && !saved.completed) {
    const baseRecord = {
      id: saved.submissionId,
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      blood_type: profile.blood_type,
      zodiac: profile.zodiac,
      mbti: mbti.type,
      big5_e: big5.E, big5_c: big5.C, big5_a: big5.A, big5_n: big5.N, big5_o: big5.O,
      emotion_stability: big5.emotionStability,
      pdp: pdp.primary,
      disc: disc.primary,
      enneagram: enneagram.primary,
      enneagram_scores: enneagram.scores,
      pdp_scores: pdp.scores,
      disc_scores: disc.scores,
      dimensions,
      answers
    };
    const localRecord = { ...baseRecord, created_at: new Date().toISOString() };

    // 1) 始终先存本机，保证员工一定能看到报告、且后台本地模式可读
    try {
      saveLocalRecord(localRecord);
      saved.completed = true;
      saved.assessmentId = localRecord.id;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (e) {
      console.warn('本机保存失败：', e);
    }

    // 2) 再试云端（任何异常都不影响主流程）
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('assessments').insert(baseRecord);
        if (error) {
          console.warn('云端写入失败（已保存到本机）：', error.message);
          showSaveToast('云端保存失败，已保存到本机');
        }
      } catch (e) {
        console.warn('云端写入异常（已保存到本机）：', e);
        showSaveToast('云端保存失败，已保存到本机');
      }
    }
  }

  // 第三步：拉岗位配置（任何失败都回退到本地/默认，不影响主流程）
  let jobs;
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('jobs').select('*').order('sort_order', { ascending: true });
      if (!error && Array.isArray(data) && data.length) {
        // 过滤维度配置损坏的岗位（dimensions 缺失/非数组/空），防止 matchJobs 抛错导致整份报告崩
        const valid = data.filter(j => j && Array.isArray(j.dimensions) && j.dimensions.length > 0);
        if (valid.length) jobs = valid;
        else console.warn('云端 jobs 全部损坏，回退到默认岗位配置');
      }
    } catch (e) { console.warn('拉岗位配置异常：', e); }
  }
  if (!jobs || !jobs.length) {
    const local = loadLocalJobs();
    jobs = (local && local.length) ? local : DEFAULT_JOBS;
  }

  // 第四步：渲染报告（容错：失败显示错误但不丢数据）
  try {
    const jobMatches = matchJobs(dimensions, jobs || []);
    const topJob = jobMatches[0];
    const top3 = jobMatches.slice(0, 3);
    renderReport(profile, results, jobMatches, topJob, top3, viewOnly);
  } catch (e) {
    console.error('渲染报告失败：', e);
    reportPage.innerHTML = `<div class="report-empty"><h2>报告渲染失败</h2><p>${escapeHtml(e.message || String(e))}</p><p style="font-size:13px;color:#888;margin-top:12px;">你的测评数据已成功保存到云端和本机，可在管理后台查看。</p><a href="./" class="btn btn-primary" style="margin-top:16px;">返回首页</a></div>`;
  }
}

function showSaveToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast error show';
  setTimeout(() => t.classList.remove('show'), 4000);
}

function genId() {
  return 'loc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 稳定的提交ID（优先用标准 uuid，便于云端表主键幂等；环境不支持时回退随机串）
function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'loc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function renderReport(profile, results, jobMatches, topJob, top3, viewOnly = false) {
  const { mbti, big5, pdp, disc, enneagram, dimensions } = results;
  const mbtiInfo = getMBTIInfo(mbti.type);
  const pdpInfo = getPDPInfo(pdp.primary);
  const pdpSecondInfo = getPDPInfo(pdp.secondary);
  const discInfo = getDISCInfo(disc.primary);
  const discSecondInfo = getDISCInfo(disc.secondary);
  const ennInfo = getEnneagramInfo(enneagram.primary);
  const bloodInfo = getBloodTypeInfo(profile.blood_type);
  const zodiacInfo = getZodiacInfo(profile.zodiac);
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const strengths = generateStrengths(results);
  const potentials = generatePotentials(results);
  const growthPoints = generateGrowthPoints(results);
  const topReasons = generateTopReasons(results, top3);
  const bizRec = recommendBusiness(results, jobMatches);
  const finalAdvice = generateFinalAdvice(profile, results, topJob);

  // 岗位匹配仅管理员后台查看时展示；员工端隐藏（员工只看到性格与职业发展分析）
  const showJobMatch = viewOnly;

  const viewBanner = viewOnly ? `<div class="report-viewonly">管理后台查看模式 · 该报告依据云端存档的答题数据重新生成</div>` : '';
  reportPage.innerHTML = `
    ${viewBanner}
    ${renderProfileCard(profile, timeStr)}
    ${renderMBTISection(mbti, mbtiInfo)}
    ${renderBig5Section(big5)}
    ${renderPDPSection(pdp, pdpInfo, pdpSecondInfo)}
    ${renderDISCSection(disc, discInfo, discSecondInfo)}
    ${renderEnneagramSection(enneagram, ennInfo)}
    ${renderAuxSection(profile, bloodInfo, zodiacInfo)}
    ${renderSynthesisSection(strengths, potentials, growthPoints, jobMatches, topJob, top3, topReasons, bizRec, finalAdvice, dimensions, showJobMatch)}
    ${renderActions(viewOnly)}
  `;

  // 渲染雷达图
  renderBig5Radar(big5);
  // 岗位卡片展开
  document.querySelectorAll('.job-card-header').forEach(h => {
    h.addEventListener('click', () => h.parentElement.classList.toggle('expanded'));
  });
  // 按钮事件
  document.getElementById('exportBtn').addEventListener('click', () => window.print());
  if (viewOnly) {
    const back = document.getElementById('backBtn');
    if (back) back.addEventListener('click', () => { window.location.href = './admin.html'; });
  } else {
    document.getElementById('retakeBtn').addEventListener('click', () => {
      if (confirm('确定重新测评？当前报告将不再保留在本机。')) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = './';
      }
    });
  }
}

function renderProfileCard(profile, timeStr) {
  return `
    <div class="profile-card">
      <h1>${escapeHtml(profile.name)} 的职业测评报告</h1>
      <div class="profile-meta">
        <span>性别：${profile.gender}</span>
        <span>年龄：${profile.age} 岁</span>
        <span>血型：${profile.blood_type} 型</span>
        <span>星座：${profile.zodiac}</span>
      </div>
      <div class="profile-time">测评完成时间：${timeStr}</div>
    </div>`;
}

function renderMBTISection(mbti, info) {
  const p = mbti.percentages;
  return `
    <section class="report-section" id="sec-mbti">
      <h2><span class="sec-icon">①</span>MBTI 人格类型分析</h2>
      <p class="sec-sub">基于认知功能栈的性格类型解读</p>
      <div class="type-badge">${mbti.type} · ${info.name}</div>
      <div class="tag-list">${info.traits.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="dim-bar-row"><span class="dim-label">E / I</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${p.E}%"></div></div><span class="dim-value">${p.E}% / ${p.I}%</span></div>
      <div class="dim-bar-row"><span class="dim-label">S / N</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${p.S}%"></div></div><span class="dim-value">${p.S}% / ${p.N}%</span></div>
      <div class="dim-bar-row"><span class="dim-label">T / F</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${p.T}%"></div></div><span class="dim-value">${p.T}% / ${p.F}%</span></div>
      <div class="dim-bar-row"><span class="dim-label">J / P</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${p.J}%"></div></div><span class="dim-value">${p.J}% / ${p.P}%</span></div>
      <div class="analysis-block">
        <h4>类型解读</h4>
        <p><strong>中文名称：</strong>${info.cnName}</p>
        <p><strong>核心特质：</strong>${info.traits.join('、')}</p>
        <p><strong>认知功能栈：</strong>${info.functions}</p>
      </div>
      <div class="analysis-block">
        <h4>职场优势</h4>
        <ul>${info.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="analysis-block">
        <h4>潜在盲点</h4>
        <ul>${info.blindspots.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="analysis-block">
        <h4>职业建议</h4>
        <p>${info.careers}</p>
        <p><strong>沟通风格：</strong>${info.communication}</p>
        <p><strong>压力管理与自我提升：</strong>${info.growth}</p>
      </div>
    </section>`;
}

function renderBig5Section(big5) {
  const dims = [
    { key: 'E', name: '外倾性', score: big5.E },
    { key: 'C', name: '尽责性', score: big5.C },
    { key: 'A', name: '宜人性', score: big5.A },
    { key: 'N', name: '神经质', score: big5.N },
    { key: 'O', name: '开放性', score: big5.O }
  ];
  const dimInfos = dims.map(d => ({ ...d, info: getBig5DimInfo(d.key, d.score) }));
  const envPref = big5WorkEnvPreference(big5);
  const teamRole = big5TeamRole(big5);
  const mgmt = big5MgmtAdvice(big5);

  return `
    <section class="report-section" id="sec-big5">
      <h2><span class="sec-icon">②</span>大五人格 深度分析</h2>
      <p class="sec-sub">五维度得分与百分位解读 · 情绪稳定性 = 10 - 神经质</p>
      <div class="chart-wrap"><canvas id="big5Radar" width="380" height="340"></canvas></div>
      ${dimInfos.map(d => `
        <div class="analysis-block">
          <h4>${d.name} · 得分 ${d.score}/10（${d.info.level}）</h4>
          <p>${d.info.interp}</p>
          <p><strong>团队表现：</strong>${d.info.team}</p>
          <p><strong>${d.key === 'N' ? '压力敏感度' : (d.key === 'E' ? '社交偏好' : (d.key === 'A' ? '冲突处理' : (d.key === 'C' ? '自律与条理' : '学习风格'))) }：</strong>${d.key === 'N' ? d.info.conflict : (d.key === 'E' ? d.info.social : (d.key === 'A' ? d.info.conflict : (d.key === 'C' ? d.info.social : d.info.social)))}</p>
        </div>
      `).join('')}
      <div class="analysis-block">
        <h4>情绪稳定性</h4>
        <p>你的情绪稳定性得分为 <strong>${big5.emotionStability}/10</strong>（由 10 - 神经质${big5.N} 得出）。${big5.emotionStability >= 6 ? '这表明你在面对压力和情绪波动时通常能保持较好的内在平衡。' : '这表明你对情绪变化较为敏感，建议关注情绪调节与自我关怀。'}</p>
      </div>
      <div class="analysis-block">
        <h4>职业建议</h4>
        <p><strong>工作环境偏好：</strong>${envPref}</p>
        <p><strong>适合的团队角色：</strong>${teamRole}</p>
        <p><strong>管理建议：</strong></p>
        <ul>${mgmt.map(m => `<li>${m}</li>`).join('')}</ul>
      </div>
    </section>`;
}

function renderPDPSection(pdp, info, secondInfo) {
  const types = ['老虎', '孔雀', '无尾熊', '猫头鹰', '变色龙'];
  return `
    <section class="report-section" id="sec-pdp">
      <h2><span class="sec-icon">③</span>PDP 行为风格分析</h2>
      <p class="sec-sub">主导类型：${pdp.primary} · 备选类型：${pdp.secondary}</p>
      <div class="type-badge">${pdp.primary}型 · ${info.core}</div>
      ${types.map(t => `
        <div class="dim-bar-row"><span class="dim-label">${t}</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${pdp.scores[t] * 10}%"></div></div><span class="dim-value">${pdp.scores[t]}</span></div>
      `).join('')}
      <div class="analysis-block">
        <h4>核心行为特征</h4>
        <p>${info.behavior}</p>
        <p><strong>团队角色：</strong>${info.teamRole}</p>
      </div>
      <div class="analysis-block">
        <h4>优势与可能的过当</h4>
        <p><strong>优势：</strong></p>
        <ul>${info.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
        <p><strong>过当（过度表现时）：</strong></p>
        <ul>${info.overuse.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="analysis-block">
        <h4>职业建议</h4>
        <p><strong>最匹配的岗位特征：</strong>${info.jobFit}</p>
        <p><strong>建议避免：</strong>${info.jobAvoid}</p>
        <p><strong>协作建议：</strong>${info.collab}</p>
        <p><strong>备选类型（${pdp.secondary}）的影响：</strong>${secondInfo.core} 在你的行为中也有一定体现，可在主风格之外灵活调用。</p>
      </div>
    </section>`;
}

function renderDISCSection(disc, info, secondInfo) {
  const types = ['D', 'I', 'S', 'C'];
  return `
    <section class="report-section" id="sec-disc">
      <h2><span class="sec-icon">④</span>DISC 行为风格分析</h2>
      <p class="sec-sub">主导类型：${disc.primary} · 副型：${disc.secondary}</p>
      <div class="type-badge">${disc.primary}型 · ${info.name}</div>
      ${types.map(t => `
        <div class="dim-bar-row"><span class="dim-label">${t} 型</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${disc.scores[t]}%"></div></div><span class="dim-value">${disc.scores[t]}%</span></div>
      `).join('')}
      <div class="analysis-block">
        <h4>核心驱动力与恐惧</h4>
        <p>${info.core}</p>
      </div>
      <div class="analysis-block">
        <h4>典型行为模式</h4>
        <p>${info.behavior}</p>
        <p><strong>情绪表达：</strong>${info.emotion}</p>
      </div>
      <div class="analysis-block">
        <h4>职业建议</h4>
        <p><strong>适合的岗位特征：</strong>${info.jobFit}</p>
        <p><strong>团队协作注意事项：</strong>${info.collab}</p>
        <p><strong>副型（${disc.secondary}）的影响：</strong>${secondInfo.name}特质在你的行为中作为补充，让主风格更有弹性。</p>
      </div>
    </section>`;
}

function renderEnneagramSection(enneagram, info) {
  const allTypes = enneagram.sorted.map(s => `
    <div class="dim-bar-row"><span class="dim-label">${s.type}号</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${(s.count / 4) * 100}%"></div></div><span class="dim-value">${s.count}题</span></div>
  `).join('');
  return `
    <section class="report-section" id="sec-enn">
      <h2><span class="sec-icon">⑤</span>九型人格 深层动机分析</h2>
      <p class="sec-sub">主导类型：${enneagram.primary}号 · ${info.name}</p>
      <div class="type-badge">${enneagram.primary}号 · ${info.name}</div>
      ${allTypes}
      <div class="analysis-block">
        <h4>基本欲望与基本恐惧</h4>
        <p><strong>基本欲望：</strong>${info.desire}</p>
        <p><strong>基本恐惧：</strong>${info.fear}</p>
      </div>
      <div class="analysis-block">
        <h4>健康层级</h4>
        <p><strong>健康状态：</strong>${info.healthy}</p>
        <p><strong>压力状态：</strong>${info.stress}</p>
      </div>
      <div class="analysis-block">
        <h4>防御机制与自动化反应</h4>
        <p>${info.defense}</p>
      </div>
      <div class="analysis-block">
        <h4>职场优势与挑战</h4>
        <p><strong>优势：</strong></p>
        <ul>${info.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
        <p><strong>挑战：</strong></p>
        <ul>${info.challenges.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="analysis-block">
        <h4>职业建议</h4>
        <p><strong>最易获得满足感的工作：</strong>${info.satisfaction}</p>
        <p><strong>示例集团适合方向：</strong>${info.fit}</p>
        <p><strong>发展陷阱与突破：</strong>${info.trap}</p>
        <p><strong>与不同类型同事相处：</strong>${info.relation}</p>
      </div>
    </section>`;
}

function renderAuxSection(profile, bloodInfo, zodiacInfo) {
  return `
    <section class="report-section" id="sec-aux">
      <h2><span class="sec-icon">⑥</span>血型与星座 辅助参考</h2>
      <p class="sec-sub">仅供参考，不作为核心决策依据</p>
      <div class="analysis-block">
        <h4>血型：${profile.blood_type} 型</h4>
        <p><strong>性格倾向：</strong>${bloodInfo.tendency}</p>
        <p><strong>团队表现：</strong>${bloodInfo.team}</p>
        <p><strong>职场适配：</strong>${bloodInfo.career}</p>
      </div>
      <div class="analysis-block">
        <h4>星座：${profile.zodiac}</h4>
        <p><strong>性格倾向：</strong>${zodiacInfo.tendency}</p>
        <p><strong>职业偏好：</strong>${zodiacInfo.career}</p>
      </div>
    </section>`;
}

function renderSynthesisSection(strengths, potentials, growthPoints, jobMatches, topJob, top3, topReasons, bizRec, finalAdvice, dimensions, showJobMatch = true) {
  // 岗位相关块：仅管理员后台查看时展示；员工端隐藏
  const jobBlock = showJobMatch ? `
      <div class="analysis-block">
        <h4>岗位匹配结果</h4>
        <p class="sec-sub">以下展示所有已配置岗位的匹配度，点击卡片可查看维度明细。</p>
        ${jobMatches.map((jm, idx) => `
          <div class="job-card ${idx === 0 ? 'best-match' : ''}">
            <div class="job-card-header">
              <div class="job-card-title">
                <span class="job-name">${escapeHtml(jm.job.name)}</span>
                ${idx === 0 ? '<span class="job-best-tag">最佳匹配</span>' : ''}
              </div>
              <span class="job-match-pct">${jm.matchPct}%</span>
            </div>
            <div class="job-match-bar"><div class="job-match-bar-fill" style="width:${jm.matchPct}%"></div></div>
            <div class="job-card-detail">
              <p style="font-size:13px;color:var(--neutral-600);margin-bottom:10px;">该岗位所用维度及你的得分贡献：</p>
              ${jm.details.map(d => `
                <div class="job-detail-row">
                  <span class="jd-dim">${d.dimension}</span>
                  <div class="jd-bar"><div class="jd-bar-fill" style="width:${d.employeeScore * 10}%"></div></div>
                  <span class="jd-score">得分 ${d.employeeScore}</span>
                  <span class="jd-weight">权重${d.weight}%</span>
                </div>
              `).join('')}
              ${jm.job.qualification ? `<p style="font-size:12px;color:var(--neutral-600);margin-top:10px;"><strong>岗位准入资质：</strong>${escapeHtml(jm.job.qualification)}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="analysis-block">
        <h4>Top 3 推荐岗位</h4>
        <div class="top-recs">
          ${topReasons.map(r => `
            <div class="top-rec-card">
              <div class="rec-rank">推荐 #${r.rank}</div>
              <div class="rec-name">${escapeHtml(r.jobName)}</div>
              <div class="rec-pct">${r.matchPct}%</div>
              <div class="rec-reason">${r.reason}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="analysis-block">
        <h4>业务板块推荐</h4>
        <p>综合你在各岗位的匹配情况，你最有潜力发挥价值的业务板块是 <strong>${bizRec.primary}</strong>（综合匹配度 ${bizRec.primaryScore}%）。</p>
        <ul>${bizRec.all.map(b => `<li><strong>${b.business}：</strong>综合匹配度 ${b.score}%</li>`).join('')}</ul>
      </div>

      <div class="analysis-block">
        <h4>匹配度算法说明</h4>
        <div class="algo-note">
          匹配度计算基于你测评得出的22项核心能力维度得分（每项0-10分，由五大测评工具 MBTI、大五、PDP、DISC、九型综合推断；其中12项人格基底 + 10项职业行为胜任力细分）。
          每个岗位由管理员配置了若干考察维度及对应权重（权重之和为100%）。
          匹配度 = Σ(你在该维度的得分 × 该维度的权重) ÷ (10 × Σ权重) × 100%，
          即把你的加权得分归一化为0-100%的百分比。得分越高，表示你的能力结构与该岗位的需求越契合。
          该结果结合了MBTI、大五、PDP、DISC、九型、血型、星座七类测评工具的交叉分析，作为岗位安排与发展建议的参考，
          最终决策还需结合实际工作表现、专业资质与个人意愿。
        </div>
      </div>
  ` : `
      <div class="analysis-block job-match-hidden">
        <p style="font-size:13px;color:var(--neutral-600);line-height:1.7;">
          岗位匹配与岗位推荐结果由公司管理员在后台查看与配置，此处仅向你展示性格特质与职业发展方向分析。
          如需了解你的岗位适配情况，请联系你的直属主管或测评管理员。
        </p>
      </div>
  `;

  return `
    <section class="report-section" id="sec-synthesis">
      <h2><span class="sec-icon">⑦</span>综合分析${showJobMatch ? '与岗位匹配' : '与职业建议'}</h2>
      <p class="sec-sub">${showJobMatch ? '七维度交叉验证 · 智能岗位匹配' : '核心维度交叉验证 · 职业发展方向'}</p>

      <div class="analysis-block">
        <h4>核心优势</h4>
        <ul>${strengths.map(s => `<li><strong>${s.dim}（${s.score}/10）：</strong>${s.desc}</li>`).join('')}</ul>
      </div>
      <div class="analysis-block">
        <h4>发展潜力方向</h4>
        <ul>${potentials.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="analysis-block">
        <h4>需关注的成长点</h4>
        <ul>${growthPoints.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>

      ${jobBlock}

      <div class="analysis-block">
        <h4>综合职业建议</h4>
        <div class="final-advice">${formatAdvice(finalAdvice)}</div>
      </div>
    </section>`;
}

function renderActions(viewOnly) {
  if (viewOnly) {
    return `
    <div class="report-actions">
      <button class="btn btn-primary btn-large" id="exportBtn">打印 / 保存为 PDF</button>
      <button class="btn btn-ghost btn-large" id="backBtn">返回管理后台</button>
    </div>`;
  }
  return `
    <div class="report-actions">
      <button class="btn btn-outline btn-large" id="exportBtn">导出我的报告</button>
      <button class="btn btn-ghost btn-large" id="retakeBtn">重新测评</button>
    </div>`;
}

function renderBig5Radar(big5) {
  const ctx = document.getElementById('big5Radar');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['外倾性', '尽责性', '宜人性', '神经质', '开放性'],
      datasets: [{
        label: '你的得分',
        data: [big5.E, big5.C, big5.A, big5.N, big5.O],
        backgroundColor: 'rgba(204,85,0,0.18)',
        borderColor: '#cc5500',
        borderWidth: 2,
        pointBackgroundColor: '#cc5500',
        pointRadius: 4
      }]
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 10,
          ticks: { stepSize: 2, font: { size: 10 } },
          pointLabels: { font: { size: 13 } }
        }
      }
    }
  });
}

function formatAdvice(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

init().catch(err => {
  console.error('生成报告时未捕获异常：', err);
  const detail = (err && err.stack) ? escapeHtml(err.stack) : escapeHtml(err && (err.message || String(err)));
  reportPage.innerHTML = `<div class="report-empty"><h2>生成报告时出错</h2><p>${detail}</p><p style="font-size:13px;color:#888;margin-top:12px;">请将上方红色错误信息截图发给管理员以便定位。</p><a href="./" class="btn btn-primary" style="margin-top:16px;">返回首页</a></div>`;
});
