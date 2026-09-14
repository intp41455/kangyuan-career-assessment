import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.js';

// 部署环境变量优先；缺失时回落到提交的公开配置（保证任何部署都进入云端模式、后台登录门必生效）
const url = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

// 关键修复：缺少配置时不要调用 createClient(undefined) —— 否则模块加载即崩溃，
// 导致结果页永远卡在"加载中"。改为导出 isSupabaseConfigured 标志，由调用方决定走云端还是本地。
export const isSupabaseConfigured = Boolean(
  url && anonKey && String(url).startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        // 必须持久化会话：管理员从后台"查看报告"会用新标签页打开 result.html?id=，
        // 只有会话写入 localStorage，新标签页才能带着登录态读取测评记录（受 RLS 约束）。
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
  : null;

export const STORAGE_KEY = 'kymh_assessment_progress';
