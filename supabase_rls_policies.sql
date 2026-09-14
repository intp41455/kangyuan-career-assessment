-- ============================================================
-- 康源美宏 · 员工职业测评系统 — Supabase RLS 安全策略
-- ============================================================
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴本文件 → Run
--
-- 背景：本系统此前未启用 RLS，anon key 可对 assessments / jobs 表
--       执行任意读、写、删操作。任何人拿到前端 JS 里的 anon key
--       即可清空或篡改全部测评数据，且后台登录门形同虚设。
--
-- 本文件按「客户端实际访问路径」设计策略，逐条对应：
--   ① 匿名员工  → assessments INSERT          （提交测评，report.js:126）
--   ② 匿名员工  → jobs SELECT                  （报告岗位匹配，report.js:142）
--   ③ 认证管理员 → assessments 全部 CRUD        （后台管理，admin.js:187）
--   ④ 认证管理员 → jobs 全部 CRUD               （岗位配置，admin.js:356/602）
--   ⑤ 认证管理员 → admin_audit_log SELECT+INSERT（审计日志，store.js:52）
-- ============================================================

-- ------------------------------------------------------------
-- 1. assessments — 测评记录
-- ------------------------------------------------------------
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- ① 提交测评：anon 与 authenticated 都允许写入
--    用 public 角色而非单列 anon，避免管理员本人答题时被拒
DROP POLICY IF EXISTS "submit_assessments" ON assessments;
CREATE POLICY "submit_assessments"
  ON assessments FOR INSERT
  TO public
  WITH CHECK (true);

-- ③ 读取测评记录：仅认证管理员（这是本次修复关闭的核心漏洞）
DROP POLICY IF EXISTS "admin_read_assessments" ON assessments;
CREATE POLICY "admin_read_assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (true);

-- ③ 更新测评记录：仅认证管理员
DROP POLICY IF EXISTS "admin_update_assessments" ON assessments;
CREATE POLICY "admin_update_assessments"
  ON assessments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ③ 删除测评记录：仅认证管理员
DROP POLICY IF EXISTS "admin_delete_assessments" ON assessments;
CREATE POLICY "admin_delete_assessments"
  ON assessments FOR DELETE
  TO authenticated
  USING (true);

-- 匿名用户的 SELECT / UPDATE / DELETE 无对应策略，RLS 默认拒绝
-- → 修复前「anon 可删改全部数据」的漏洞在此关闭


-- ------------------------------------------------------------
-- 2. jobs — 岗位配置
-- ------------------------------------------------------------
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- ② 读取岗位配置：anon 与 authenticated 都允许
--    说明：员工交卷后结果页需要拉岗位配置来计算岗位匹配度（report.js:142）。
--    若此处只放行 authenticated，全部匿名员工报告会退回内置默认岗位，
--    管理员在后台自定义的岗位配置将不生效 —— 属于功能性回归。
--    权衡：岗位名称与维度权重属于低敏感度配置信息，且匹配结果本就会
--    展示给每位测评员工，因此对匿名开放 SELECT 与产品行为一致。
--    如需进一步收紧，应改为 SECURITY DEFINER 的 RPC 只返回匹配结果。
DROP POLICY IF EXISTS "read_jobs" ON jobs;
CREATE POLICY "read_jobs"
  ON jobs FOR SELECT
  TO public
  USING (true);

-- ④ 新增 / 更新 / 删除岗位：仅认证管理员
DROP POLICY IF EXISTS "admin_insert_jobs" ON jobs;
CREATE POLICY "admin_insert_jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_jobs" ON jobs;
CREATE POLICY "admin_update_jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_jobs" ON jobs;
CREATE POLICY "admin_delete_jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (true);


-- ------------------------------------------------------------
-- 3. admin_audit_log — 操作审计日志
-- ------------------------------------------------------------
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ⑤ 读取日志：仅认证管理员
DROP POLICY IF EXISTS "admin_read_audit_log" ON admin_audit_log;
CREATE POLICY "admin_read_audit_log"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (true);

-- ⑤ 写入日志：仅认证管理员
DROP POLICY IF EXISTS "admin_insert_audit_log" ON admin_audit_log;
CREATE POLICY "admin_insert_audit_log"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 日志的 UPDATE / DELETE 不设任何策略
-- → 任何账号（包括管理员）都无法修改或删除审计记录，保证不可篡改


-- ============================================================
-- 执行后验证：确认策略已生效
-- ============================================================
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;

-- 预期输出：3 张表全部启用 RLS，assessments 4 条策略、
--           jobs 4 条策略、admin_audit_log 2 条策略（无 UPDATE/DELETE）


-- ============================================================
-- 回归自测清单（执行后在站点上逐项确认）
-- ============================================================
-- [ ] 匿名浏览器（未登录）走完 162 题 → 能正常提交并看到报告
-- [ ] 匿名浏览器报告页 → 岗位匹配显示的是后台自定义岗位（非默认兜底）
-- [ ] 未登录直接打开 admin.html → 出现登录页，看不到任何记录
-- [ ] 登录管理员 → 能看到全部测评记录、可导出 Excel
-- [ ] 登录管理员 → 可新增/编辑/删除岗位
-- [ ] 匿名用 anon key 直接 REST 调 DELETE /assessments → 返回 0 行受影响
