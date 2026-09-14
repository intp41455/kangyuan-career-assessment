import ExcelJS from 'exceljs';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { loadLocalRecords, loadLocalJobs, saveLocalJobs, logAdminAction } from '../lib/store.js';
import { DEFAULT_JOBS } from '../data/defaultJobs.js';
import { analyzeForExport, EXPORT_COLUMNS } from '../lib/personalityExport.js';

const adminPage = document.getElementById('adminPage');
const DIMENSIONS_POOL = [
  '共情能力','情绪稳定','责任心','沟通表达','抗压能力','学习能力','领导力','团队协作','细致严谨','创新思维','主动性','服务意识',
  '口头表达与说服','倾听理解与回应','流程合规与差错防范','应急与危机处置','观察洞察','执行落地','跨部门协调','持续学习适应','耐心与照护亲和','专业审慎与风险意识'
];

// 数据模式：配置云端数据库走 cloud，否则走 local（本机浏览器）
const MODE = isSupabaseConfigured ? 'cloud' : 'local';

let allRecords = [];
let allJobs = [];
let currentFilter = { name: '', mbti: '' };
let currentUser = null;

async function init() {
  // 云端模式：必须先登录管理员账号，否则任何人都能读取/篡改全员测评数据
  if (MODE === 'cloud') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user || null;
    } catch (_) { currentUser = null; }
    if (!currentUser) { renderLogin(); return; }
  }
  await bootAdmin();
}

// 管理员登录界面（仅云端模式使用）
function renderLogin() {
  adminPage.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-logo">康</div>
        <h2 class="login-title">管理后台登录</h2>
        <p class="login-sub">请输入管理员账号与密码（数据库已开启权限保护）</p>
        <form class="login-form" id="loginForm" autocomplete="on">
          <label class="form-field">
            <span class="field-label">管理员账号（邮箱）</span>
            <input type="email" id="loginEmail" autocomplete="username" placeholder="admin@kymh.com" required />
          </label>
          <label class="form-field">
            <span class="field-label">密码</span>
            <input type="password" id="loginPassword" autocomplete="current-password" placeholder="请输入密码" required />
          </label>
          <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登录</button>
          <div class="login-error" id="loginError"></div>
          <div class="login-status" id="forgotStatus"></div>
          <div class="login-foot">
            <a href="#" id="forgotLink" class="link-muted">忘记密码？</a>
          </div>
        </form>
      </div>
    </div>
  `;
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    errEl.textContent = '';
    btn.disabled = true; btn.textContent = '登录中…';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      errEl.textContent = '登录失败：' + error.message;
      btn.disabled = false; btn.textContent = '登录';
      return;
    }
    await logAdminAction(supabase, '管理员登录', '', `邮箱：${email}`);
    await bootAdmin();
  });

  const forgot = document.getElementById('forgotLink');
  if (forgot) forgot.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const errEl = document.getElementById('loginError');
    const statusEl = document.getElementById('forgotStatus');
    if (!email) { errEl.textContent = '请先在上方输入管理员邮箱，再点"忘记密码"。'; return; }
    errEl.textContent = '';
    statusEl.textContent = '正在发送重置邮件…';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + '/reset.html'
    });
    if (error) { statusEl.textContent = '发送失败：' + error.message; return; }
    statusEl.textContent = '✅ 重置邮件已发送至 ' + email + '，请查收并点击链接设置新密码。';
  });
}

async function bootAdmin() {
  if (MODE === 'cloud') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user || currentUser;
    } catch (_) {}
  }
  adminPage.innerHTML = `
    <div class="mode-banner ${MODE === 'cloud' ? 'cloud' : 'local'}">
      ${MODE === 'cloud'
        ? `✅ 已连接云端数据库（Supabase），数据多人共享、跨设备可读写。`
        : 'ℹ️ 当前为<b>本地模式</b>：数据仅保存在本机浏览器。配置云端数据库后可多人共享与跨设备查看（详见部署说明）。'}
      ${MODE === 'cloud' && currentUser
        ? `<span class="admin-user">管理员：${escapeHtml(currentUser.email)}</span><button class="btn btn-ghost btn-sm" id="changePwdBtn">修改密码</button><button class="btn btn-ghost btn-sm" id="logoutBtn">退出登录</button>`
        : ''}
    </div>
    <div class="admin-tabs">
      <button class="admin-tab active" data-tab="records">测评记录</button>
      <button class="admin-tab" data-tab="jobs">岗位管理</button>
      <button class="admin-tab" data-tab="logs">操作日志</button>
    </div>
    <div class="admin-panel active" id="panelRecords"></div>
    <div class="admin-panel" id="panelJobs"></div>
    <div class="admin-panel" id="panelLogs"></div>
    <div class="modal-mask" id="pwdModal">
      <div class="modal-box">
        <h3>修改管理员密码</h3>
        <p class="modal-tip">修改后请使用新密码登录，且不要再将密码群发给他人。</p>
        <input type="password" id="newPwd" class="modal-input" placeholder="输入新密码（至少6位）" autocomplete="new-password">
        <input type="password" id="newPwd2" class="modal-input" placeholder="再次输入新密码" autocomplete="new-password">
        <div class="modal-err" id="pwdErr"></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="pwdCancel">取消</button>
          <button class="btn btn-primary" id="pwdSubmit">确认修改</button>
        </div>
      </div>
    </div>
  `;
  const lb = document.getElementById('logoutBtn');
  if (lb) lb.addEventListener('click', async () => {
    try {
      await logAdminAction(supabase, '管理员退出', '', '');
      await supabase.auth.signOut();
    } catch (_) {}
    currentUser = null;
    renderLogin();
  });
  const cpb = document.getElementById('changePwdBtn');
  if (cpb) {
    cpb.addEventListener('click', () => {
      document.getElementById('pwdErr').textContent = '';
      document.getElementById('newPwd').value = '';
      document.getElementById('newPwd2').value = '';
      document.getElementById('pwdModal').style.display = 'flex';
    });
    document.getElementById('pwdCancel').addEventListener('click', () => {
      document.getElementById('pwdModal').style.display = 'none';
    });
    document.getElementById('pwdSubmit').addEventListener('click', async () => {
      const p1 = document.getElementById('newPwd').value;
      const p2 = document.getElementById('newPwd2').value;
      const errEl = document.getElementById('pwdErr');
      if (p1.length < 6) { errEl.textContent = '密码至少 6 位'; return; }
      if (p1 !== p2) { errEl.textContent = '两次输入不一致'; return; }
      const btn = document.getElementById('pwdSubmit');
      btn.disabled = true; btn.textContent = '修改中…';
      const { error } = await supabase.auth.updateUser({ password: p1 });
      btn.disabled = false; btn.textContent = '确认修改';
      if (error) { errEl.textContent = '修改失败：' + error.message; return; }
      document.getElementById('pwdModal').style.display = 'none';
      showToast('密码已修改，下次请用新密码登录', 'success');
    });
  }
  document.querySelectorAll('.admin-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById('panel' + cap(t.dataset.tab)).classList.add('active');
    });
  });
  await Promise.all([loadRecords(), loadJobs(), loadLogs()]);
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ===== 记录加载 =====
async function loadRecords() {
  const panel = document.getElementById('panelRecords');
  panel.innerHTML = '<div class="loading-state">正在加载测评记录…</div>';
  try {
    if (MODE === 'cloud') {
      const { data, error } = await supabase.from('assessments').select('*').order('created_at', { ascending: false });
      if (error) { panel.innerHTML = `<div class="report-empty"><p>加载失败：${escapeHtml(error.message)}</p></div>`; return; }
      allRecords = data || [];
    } else {
      allRecords = loadLocalRecords();
    }
  } catch (e) {
    allRecords = [];
  }
  renderRecords();
}

function renderRecords() {
  const panel = document.getElementById('panelRecords');
  const today = new Date().toDateString();
  const todayCount = allRecords.filter(r => new Date(r.created_at).toDateString() === today).length;

  const mbtiTypes = [...new Set(allRecords.map(r => r.mbti))].sort();
  const filtered = allRecords.filter(r => {
    if (currentFilter.name && !(r.name || '').includes(currentFilter.name)) return false;
    if (currentFilter.mbti && r.mbti !== currentFilter.mbti) return false;
    return true;
  });

  panel.innerHTML = `
    <div class="stat-row">
      <div class="stat-card"><div class="stat-label">总测评人数</div><div class="stat-value">${allRecords.length}<span class="stat-unit">人</span></div></div>
      <div class="stat-card"><div class="stat-label">今日新增</div><div class="stat-value">${todayCount}<span class="stat-unit">人</span></div></div>
      <div class="stat-card"><div class="stat-label">当前筛选结果</div><div class="stat-value">${filtered.length}<span class="stat-unit">人</span></div></div>
    </div>
    <div class="toolbar">
      <input class="search-input" id="searchName" type="text" placeholder="按姓名搜索…" value="${escapeHtml(currentFilter.name)}" />
      <select class="filter-select" id="filterMbti">
        <option value="">全部 MBTI</option>
        ${mbtiTypes.map(t => `<option value="${t}" ${currentFilter.mbti === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <button class="btn btn-outline btn-sm" id="exportExcelBtn">导出已测试人员分析表</button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>姓名</th><th>性别</th><th>年龄</th><th>MBTI</th>
            <th>大五 E</th><th>C</th><th>A</th><th>N</th><th>O</th><th>情绪稳定</th>
            <th>PDP</th><th>DISC</th><th>九型</th><th>提交时间</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.length === 0
            ? '<tr class="empty-row"><td colspan="15">暂无符合条件的测评记录</td></tr>'
            : filtered.map(r => `
              <tr>
                <td>${escapeHtml(r.name)}</td>
                <td>${escapeHtml(r.gender)}</td>
                <td>${r.age}</td>
                <td><span class="type-chip">${escapeHtml(r.mbti)}</span></td>
                <td>${r.big5_e}</td><td>${r.big5_c}</td><td>${r.big5_a}</td><td>${r.big5_n}</td><td>${r.big5_o}</td>
                <td>${r.emotion_stability}</td>
                <td><span class="type-chip">${escapeHtml(r.pdp)}</span></td>
                <td><span class="type-chip">${escapeHtml(r.disc)}</span></td>
                <td>${r.enneagram}号</td>
                <td>${formatDate(r.created_at)}</td>
                <td><button class="btn btn-outline btn-sm" data-view="${r.id}" data-name="${escapeHtml(r.name)}">查看报告</button></td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('searchName').addEventListener('input', (e) => {
    currentFilter.name = e.target.value.trim();
    renderRecords();
    document.getElementById('searchName').focus();
  });
  document.getElementById('filterMbti').addEventListener('change', (e) => {
    currentFilter.mbti = e.target.value;
    renderRecords();
  });
  document.getElementById('exportExcelBtn').addEventListener('click', () => exportExcel(filtered));
  panel.querySelectorAll('[data-view]').forEach(b => {
    b.addEventListener('click', async () => {
      await logAdminAction(supabase, '查看报告', b.dataset.view, `姓名：${b.dataset.name || ''}`);
      window.open(`./result.html?id=${encodeURIComponent(b.dataset.view)}`, '_blank');
    });
  });
}

// ===== 导出 Excel (.xlsx) — 自带排版样式（打开即排版好，无需再手动调整）=====
//   · 表头：深蓝底(1F4E79)白字加粗居中
//   · 列宽：按内容适配（长文列给足宽度）
//   · 单元格：长文自动换行、垂直顶部对齐
//   · 数据行：隔行浅蓝斑马纹、固定行高容纳多行
//   · 表头常驻：冻结首行
//   · 细边框：浅灰
// 使用 ExcelJS（样式/冻结为一等公民；SheetJS 在当前构建下 cell.s 样式与 !freeze 写入失效）
function colWidthFor(name) {
  return ({
    '姓名': 10, '年龄': 6, 'MBTI类型': 14,
    '性格分析之特长': 44, '性格分析之优势': 30, '优势': 54, '劣势': 54,
    'MBTI维度分析': 52, 'MBTI匹配岗位': 18,
    '大五维度分析': 52, '大五匹配岗位': 18,
    'PDP维度分析': 46, 'PDP匹配岗位': 18,
    'DISC维度分析': 46, 'DISC匹配岗位': 18,
    '九型维度分析': 48, '九型匹配岗位': 18,
    '综合匹配岗位': 18, '综合匹配度': 10, '综合匹配依据': 58,
    '立体人物性格综合分析': 64, '职业推荐综合分析': 58
  })[name] || 24;
}

function exportExcel(records) {
  if (records.length === 0) { showToast('没有可导出的记录'); return; }
  try {
    // 依据 5 测试自动生成各分析列 + 单项匹配 + 综合匹配
    const rows = records.map(r => analyzeForExport(r, allJobs || []));
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('已测试人员');
    ws.columns = EXPORT_COLUMNS.map(name => ({ header: name, key: name, width: colWidthFor(name) }));

    rows.forEach((rowObj, i) => {
      const r = ws.addRow(rowObj);
      r.alignment = { vertical: 'top', wrapText: true };
      if (i % 2 === 1) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F6FC' } };
    });

    // 表头样式
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    header.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
    header.height = 32;

    // 数据行高（容纳多行换行文本）
    for (let i = 2; i <= rows.length + 1; i++) ws.getRow(i).height = 104;

    // 细边框
    const thin = () => { const s = { style: 'thin', color: { argb: 'FFD9D9D9' } }; return { top: s, bottom: s, left: s, right: s }; };
    ws.eachRow(row => row.eachCell(cell => { if (!cell.border) cell.border = thin(); }));

    // 冻结首行（滚动时表头常驻）
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    // 浏览器端：writeBuffer → Blob 触发下载
    wb.xlsx.writeBuffer().then(buf => {
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `康源美宏_已测试人员分析表_${formatDate(new Date().toISOString(), true)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('已导出已测试人员分析表', 'success');
    }).catch(err => {
      console.error('导出失败:', err);
      showToast('导出失败：' + (err && err.message ? err.message : err));
    });
  } catch (e) {
    console.error('导出失败:', e);
    showToast('导出失败：' + (e && e.message ? e.message : e));
  }
}

// ===== 岗位管理 =====
async function loadJobs() {
  const panel = document.getElementById('panelJobs');
  panel.innerHTML = '<div class="loading-state">正在加载岗位配置…</div>';
  try {
    if (MODE === 'cloud') {
      const { data, error } = await supabase.from('jobs').select('*').order('sort_order', { ascending: true });
      if (error) { panel.innerHTML = `<div class="report-empty"><p>加载失败：${escapeHtml(error.message)}</p></div>`; return; }
      allJobs = data || [];
    } else {
      let local = loadLocalJobs();
      if (!local || local.length === 0) {
        // 首次使用：用默认岗位初始化本机配置
        local = DEFAULT_JOBS.map(j => ({ ...j, id: genId(), dimensions: j.dimensions.map(d => ({ ...d })) }));
        saveLocalJobs(local);
      }
      allJobs = local;
    }
    // 合并默认岗位（含院长 / 副院长 / 行政综合岗等灵活配置），保证职业匹配候选始终可用；
    // 管理员可在"岗位管理"中对这些岗位进行编辑或删除（非固定设置）。
    const missing = DEFAULT_JOBS.filter(d => !allJobs.some(j => j.name === d.name));
    if (missing.length) {
      allJobs = [...allJobs, ...missing.map(j => ({ ...j, id: j.id || genId(), dimensions: j.dimensions.map(d => ({ ...d })) }))];
    }
    // 维度升级迁移：内置岗位若 dimensions 损坏（null/非数组/空）或仍是旧版（缺少 B 层维度），
    // 用最新 defaultJobs 覆盖；云端模式下自动写回修复后的配置。自定义岗位（非内置名）不受影响。
    allJobs = allJobs.map(j => {
      const def = DEFAULT_JOBS.find(d => d.name === j.name);
      if (!def) return j;
      const needsFix = !Array.isArray(j.dimensions) || j.dimensions.length === 0 || !j.dimensions.some(d => d.dimension === '专业审慎与风险意识');
      if (needsFix) {
        const fixed = { ...j, dimensions: def.dimensions.map(d => ({ ...d })), qualification: def.qualification };
        if (MODE === 'cloud' && fixed.id) {
          // 自动写回修复后的配置（管理员已登录，有写权限）；失败仅 warn，不阻塞页面。
          supabase.from('jobs').update({ dimensions: fixed.dimensions, qualification: fixed.qualification }).eq('id', fixed.id)
            .then(({ error }) => { if (error) console.warn('岗位自动修复写回失败：', error.message); })
            .catch(e => console.warn('岗位自动修复写回异常：', e));
        }
        return fixed;
      }
      return j;
    });
  } catch (e) {
    allJobs = [];
  }
  renderJobs();
}

function renderJobs() {
  const panel = document.getElementById('panelJobs');
  panel.innerHTML = `
    <div class="toolbar">
      <strong style="flex:1">岗位列表（${allJobs.length}个）</strong>
      <button class="btn btn-primary btn-sm" id="addJobBtn">新增岗位</button>
    </div>
    <div class="job-mgmt-list">
      ${allJobs.map(j => renderJobCard(j)).join('')}
    </div>
  `;
  document.getElementById('addJobBtn').addEventListener('click', () => openJobModal(null));
  allJobs.forEach(j => {
    const card = panel.querySelector(`[data-job-id="${j.id}"]`);
    if (card) {
      card.querySelector('.jm-edit').addEventListener('click', () => openJobModal(j));
      card.querySelector('.jm-delete').addEventListener('click', () => deleteJob(j));
    }
  });
}

// ===== 操作日志 =====
async function loadLogs() {
  const panel = document.getElementById('panelLogs');
  if (!panel) return;
  panel.innerHTML = '<div class="loading-state">正在加载操作日志…</div>';
  const rows = [];
  if (MODE === 'cloud') {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) { panel.innerHTML = `<div class="report-empty"><p>日志加载失败：${escapeHtml(error.message)}</p></div>`; return; }
      rows.push(...(data || []));
    } catch (e) {
      panel.innerHTML = `<div class="report-empty"><p>日志加载异常：${escapeHtml(e.message || String(e))}</p></div>`; return;
    }
  } else {
    panel.innerHTML = `<div class="report-empty"><p>当前为本地模式，操作日志未启用。配置云端数据库并登录后可记录完整日志。</p></div>`;
    return;
  }
  if (rows.length === 0) {
    panel.innerHTML = '<div class="report-empty"><p>暂无操作记录。</p></div>';
    return;
  }
  const labelMap = {
    '管理员登录': '登录',
    '管理员退出': '退出',
    '查看报告': '查看报告',
    '新增岗位': '新增岗位',
    '编辑岗位': '编辑岗位',
    '删除岗位': '删除岗位'
  };
  panel.innerHTML = `
    <div class="toolbar">
      <strong style="flex:1">操作日志（最近 ${rows.length} 条）</strong>
      <span class="log-tip">说明：日志由系统自动记录，不可被任何账号删除或篡改。若多人共用同一账号密码，日志中"操作者"会显示为同一邮箱，需为每位管理员分配独立账号才能精确区分责任人。</span>
    </div>
    <div class="table-wrap">
      <table class="data-table log-table">
        <thead>
          <tr><th>时间</th><th>操作者</th><th>动作</th><th>对象</th><th>详情</th></tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${formatDate(r.created_at, true)}</td>
              <td><span class="actor-chip">${escapeHtml(r.actor_email)}</span></td>
              <td><span class="log-action-tag tag-${escapeHtml((r.action || '').replace(/[^一-龥a-zA-Z]/g, ''))}">${escapeHtml(labelMap[r.action] || r.action)}</span></td>
              <td class="log-target">${escapeHtml(r.target)}</td>
              <td class="log-detail">${escapeHtml(r.detail)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderJobCard(j) {
  const dims = j.dimensions || [];
  const total = dims.reduce((s, d) => s + (Number(d.weight) || 0), 0);
  const valid = total === 100;
  return `
    <div class="job-mgmt-card" data-job-id="${j.id}">
      <div class="job-mgmt-header">
        <span class="jm-name">${escapeHtml(j.name)}</span>
        <div class="jm-actions">
          <button class="btn btn-outline btn-sm jm-edit">编辑</button>
          <button class="btn btn-danger btn-sm jm-delete">删除</button>
        </div>
      </div>
      <div class="jm-dims">
        ${dims.map(d => `<span class="jm-dim-chip">${escapeHtml(d.dimension)}<span class="chip-weight">${d.weight}%</span></span>`).join('')}
      </div>
      <div class="jm-total ${valid ? 'valid' : 'invalid'}">维度权重合计：${total}% ${valid ? '✓ 合规' : '（需等于100%）'}</div>
    </div>`;
}

function openJobModal(job) {
  const isEdit = !!job;
  const dims = job ? (job.dimensions || []) : [{ dimension: DIMENSIONS_POOL[0], weight: 100 }];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>${isEdit ? '编辑岗位' : '新增岗位'}</h3>
      <p class="modal-desc">设置岗位名称及考察维度的权重，所有维度权重之和必须等于100%。</p>
      <label class="form-field" style="margin-bottom:14px">
        <span class="field-label">岗位名称</span>
        <input type="text" id="jobNameInput" value="${job ? escapeHtml(job.name) : ''}" placeholder="如：护理员" maxlength="20" />
      </label>
      <div class="dim-edit-list" id="dimEditList"></div>
      <button class="btn btn-ghost btn-sm" id="addDimBtn" style="margin-bottom:10px">+ 添加维度</button>
      <div class="dim-edit-total" id="dimTotal">权重合计：100% ✓</div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="cancelJobBtn">取消</button>
        <button class="btn btn-primary" id="saveJobBtn">保存</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const dimList = overlay.querySelector('#dimEditList');
  const totalEl = overlay.querySelector('#dimTotal');

  function renderDimRows(rows) {
    dimList.innerHTML = '';
    rows.forEach((d, i) => {
      const row = document.createElement('div');
      row.className = 'dim-edit-row';
      row.innerHTML = `
        <select class="de-dim" data-idx="${i}">
          ${DIMENSIONS_POOL.map(opt => `<option value="${opt}" ${d.dimension === opt ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
        <input type="number" class="de-weight" data-idx="${i}" min="0" max="100" value="${d.weight}" />
        <span class="de-label">% </span>
        <button class="de-remove" data-idx="${i}">×</button>
      `;
      dimList.appendChild(row);
    });
    updateTotal();
  }

  let rows = dims.map(d => ({ dimension: d.dimension, weight: Number(d.weight) || 0 }));
  renderDimRows(rows);

  function updateTotal() {
    const total = rows.reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const valid = total === 100;
    totalEl.textContent = `权重合计：${total}% ${valid ? '✓ 合规' : '（需等于100%）'}`;
    totalEl.className = 'dim-edit-total ' + (valid ? 'valid' : 'invalid');
  }

  dimList.addEventListener('change', (e) => {
    const idx = Number(e.target.dataset.idx);
    if (e.target.classList.contains('de-dim')) rows[idx].dimension = e.target.value;
    if (e.target.classList.contains('de-weight')) rows[idx].weight = Number(e.target.value) || 0;
    updateTotal();
  });
  dimList.addEventListener('input', (e) => {
    if (e.target.classList.contains('de-weight')) {
      const idx = Number(e.target.dataset.idx);
      rows[idx].weight = Number(e.target.value) || 0;
      updateTotal();
    }
  });
  dimList.addEventListener('click', (e) => {
    if (e.target.classList.contains('de-remove')) {
      const idx = Number(e.target.dataset.idx);
      rows.splice(idx, 1);
      renderDimRows(rows);
    }
  });
  overlay.querySelector('#addDimBtn').addEventListener('click', () => {
    rows.push({ dimension: DIMENSIONS_POOL[0], weight: 0 });
    renderDimRows(rows);
  });

  overlay.querySelector('#cancelJobBtn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#saveJobBtn').addEventListener('click', async () => {
    const name = overlay.querySelector('#jobNameInput').value.trim();
    if (!name) { showToast('请输入岗位名称'); return; }
    const total = rows.reduce((s, d) => s + (Number(d.weight) || 0), 0);
    if (total !== 100) { showToast('维度权重之和必须等于100%'); return; }
    if (rows.some(r => !r.dimension)) { showToast('每个维度都需要选择'); return; }
    const payload = {
      name,
      dimensions: rows.map(r => ({ dimension: r.dimension, weight: Number(r.weight) }))
    };
    overlay.querySelector('#saveJobBtn').disabled = true;
    if (isEdit) {
      await saveJob({ ...job, ...payload }, true);
    } else {
      const maxOrder = allJobs.reduce((m, j) => Math.max(m, j.sort_order || 0), 0);
      await saveJob({ id: genId(), name: payload.name, dimensions: payload.dimensions, sort_order: maxOrder + 1 }, false);
    }
    overlay.remove();
  });
}

async function saveJob(job, isEdit) {
  if (MODE === 'cloud') {
    if (isEdit) {
      const { error } = await supabase.from('jobs').update({ name: job.name, dimensions: job.dimensions }).eq('id', job.id);
      if (error) { showToast('保存失败：' + error.message); return; }
      await logAdminAction(supabase, '编辑岗位', job.id, `岗位名：${job.name}`);
      showToast('岗位已更新', 'success');
    } else {
      const { error } = await supabase.from('jobs').insert({ name: job.name, dimensions: job.dimensions, sort_order: job.sort_order });
      if (error) { showToast('保存失败：' + error.message); return; }
      await logAdminAction(supabase, '新增岗位', '', `岗位名：${job.name}`);
      showToast('岗位已新增', 'success');
    }
    await loadJobs();
  } else {
    if (isEdit) {
      const idx = allJobs.findIndex(j => j.id === job.id);
      if (idx >= 0) allJobs[idx] = job;
    } else {
      allJobs.push(job);
    }
    saveLocalJobs(allJobs);
    renderJobs();
    showToast(isEdit ? '岗位已更新' : '岗位已新增', 'success');
  }
}

async function deleteJob(job) {
  if (!confirm(`确定删除岗位"${job.name}"？此操作不可恢复。`)) return;
  if (MODE === 'cloud') {
    const { error } = await supabase.from('jobs').delete().eq('id', job.id);
    if (error) { showToast('删除失败：' + error.message); return; }
    await logAdminAction(supabase, '删除岗位', job.id, `岗位名：${job.name}`);
    showToast('岗位已删除', 'success');
    await loadJobs();
  } else {
    allJobs = allJobs.filter(j => j.id !== job.id);
    saveLocalJobs(allJobs);
    renderJobs();
    showToast('岗位已删除', 'success');
  }
}

function genId() {
  return 'loc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDate(iso, forFile = false) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  if (forFile) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showToast(msg, type = 'error') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.className = 'toast ' + type;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

init().catch(err => {
  adminPage.innerHTML = `<div class="report-empty"><h2>后台加载失败</h2><p>${escapeHtml(err.message || err)}</p></div>`;
});
