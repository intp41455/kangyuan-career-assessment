// 数据恢复中转页：从 URL hash 中接收旧站点 localStorage 里的测评进度，
// 写入本站 localStorage 后跳转 result.html，由报告页完成评分 + 云端入库 + 渲染。
// 背景：旧链接的测评数据仅存于浏览器 localStorage（旧域名），旧链接已失效，
// 无法在旧域名上直接加载修复后的报告页；通过 404 页 + 控制台脚本携带数据跳转本页恢复。
import { STORAGE_KEY } from '../lib/supabase.js';

const page = document.getElementById('recoverPage');

function fail(title, detail) {
  page.innerHTML = `
    <div class="report-empty">
      <h2>${title}</h2>
      <p>${detail || ''}</p>
      <a href="./" class="btn btn-primary" style="margin-top:16px;">返回首页</a>
    </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function init() {
  // 兼容 #d=xxx 与 #data=xxx 两种参数名
  const hash = location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  const raw = params.get('d') || params.get('data');
  if (!raw) {
    fail('未检测到恢复数据', '本页面用于恢复旧链接的测评数据，请通过管理员提供的恢复指引进入。');
    return;
  }

  let state;
  try {
    state = JSON.parse(decodeURIComponent(raw));
  } catch (e) {
    // 某些浏览器粘贴时已自动解码，直接尝试按原文解析
    try { state = JSON.parse(raw); } catch (e2) {
      fail('数据解析失败', '携带的数据已损坏，请联系管理员重新获取恢复代码。');
      return;
    }
  }

  if (!state || typeof state !== 'object') {
    fail('数据格式不正确', '请联系管理员重新获取恢复代码。');
    return;
  }
  if (!state.profile || typeof state.profile !== 'object' || !state.profile.name) {
    fail('缺少个人信息', '恢复数据中没有测评者资料，无法恢复。');
    return;
  }
  if (!state.answers || typeof state.answers !== 'object' || Object.keys(state.answers).length === 0) {
    fail('缺少答题数据', '恢复数据中没有答题记录，无法恢复，请重新测评。');
    return;
  }

  const answerCount = Object.keys(state.answers).length;
  // 合并写入：保留旧数据中的 submissionId（幂等去重）；强制 completed=false，
  // 让报告页重新走评分 + 入库流程（旧站点上从未成功入库）。
  try {
    const merged = {
      ...state,
      completed: false,
      recovered: true,
      recoveredAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    fail('本地保存失败', escapeHtml(e.message || String(e)));
    return;
  }

  // 给用户一个简短的确认反馈后跳转报告页
  page.innerHTML = `
    <div class="report-empty">
      <h2>数据恢复成功</h2>
      <p>已恢复 ${escapeHtml(state.profile.name)} 的 ${answerCount} 道答题记录，正在生成报告…</p>
    </div>`;
  setTimeout(() => { window.location.href = './result.html'; }, 600);
}

init();
