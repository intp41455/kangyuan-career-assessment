// Supabase 配置 — 从环境变量读取，不硬编码
//
// 部署时在平台环境变量中设置：
//   VITE_SUPABASE_URL=https://your-project.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key
//
// 本地开发：复制 .env.example 为 .env 并填入值

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
