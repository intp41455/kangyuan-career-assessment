// 本机存储辅助：用于"离线 / 本地模式"。
// 数据结构与 Supabase assessments / jobs 表保持一致，便于云端配置后无缝升级。

export const RECORDS_KEY = 'assessment_records';
export const JOBS_KEY = 'kymh_jobs';

export function loadLocalRecords() {
  try {
    const arr = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// 保存一条测评记录（最新置顶，最多保留 200 条）
export function saveLocalRecord(record) {
  const arr = loadLocalRecords();
  arr.unshift(record);
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(arr.slice(0, 200)));
  } catch (e) {
    console.warn('本地保存测评记录失败：', e);
  }
}

export function loadLocalJobs() {
  try {
    const arr = JSON.parse(localStorage.getItem(JOBS_KEY) || 'null');
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

export function saveLocalJobs(jobs) {
  try {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  } catch (e) {
    console.warn('本地保存岗位配置失败：', e);
  }
}

// ===== 后台操作审计日志 =====
// 写入 cloud.admin_audit_log 表（该表 RLS 强制写入者为当前登录管理员，且不可被任何人改/删）。
// 任意异常都不影响主流程；local 模式下只能留痕到本机，生产应走云端。
export async function logAdminAction(supabase, action, target, detail) {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const actor = user ? (user.email || user.id) : '(未知)';
    const { error } = await supabase.from('admin_audit_log').insert({
      actor_email: actor,
      action,
      target: target || '',
      detail: detail || ''
    });
    if (error) console.warn('操作日志写入失败（不影响业务）：', error.message);
  } catch (e) {
    console.warn('操作日志写入异常（不影响业务）：', e);
  }
}
