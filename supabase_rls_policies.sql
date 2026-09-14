-- ============================================================
-- 康源美宏 · 员工职业测评系统 — Supabase RLS 安全策略
-- ============================================================
-- 用途：在 Supabase Dashboard → SQL Editor 中执行此文件
-- 效果：启用 Row Level Security，限制匿名用户只能插入测评数据，
--       只有认证管理员可读取/修改/删除测评记录与岗位配置
-- ============================================================

-- 1. assessments 表 — 测评记录
-- ------------------------------------
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- 匿名用户可提交测评（INSERT），但无法读取任何记录
CREATE POLICY "anon_can_insert_assessments"
  ON assessments FOR INSERT
  TO anon
  WITH CHECK (true);

-- 认证用户（管理员）可读取全部测评记录
CREATE POLICY "auth_can_select_assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (true);

-- 认证用户可更新测评记录（管理员修正数据）
CREATE POLICY "auth_can_update_assessments"
  ON assessments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 认证用户可删除测评记录
CREATE POLICY "auth_can_delete_assessments"
  ON assessments FOR DELETE
  TO authenticated
  USING (true);

-- 禁止匿名用户 SELECT / UPDATE / DELETE
-- （无需显式 DENY，RLS 默认拒绝未授权操作）


-- 2. jobs 表 — 岗位配置
-- ------------------------------------
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 认证用户可读取全部岗位配置
CREATE POLICY "auth_can_select_jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (true);

-- 认证用户可新增岗位
CREATE POLICY "auth_can_insert_jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 认证用户可更新岗位
CREATE POLICY "auth_can_update_jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 认证用户可删除岗位
CREATE POLICY "auth_can_delete_jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (true);

-- 匿名用户无法读取岗位配置（岗位数据包含组织结构信息）
-- RLS 默认拒绝，无需额外策略


-- 3. admin_audit_log 表 — 操作日志
-- ------------------------------------
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 认证用户可读取操作日志
CREATE POLICY "auth_can_select_audit_log"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (true);

-- 认证用户可插入日志（logAdminAction 函数调用）
CREATE POLICY "auth_can_insert_audit_log"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 禁止任何人删除或修改日志（审计日志不可篡改）
-- RLS 默认拒绝，无需额外策略


-- ============================================================
-- 验证：执行完毕后可用以下查询确认策略已生效
-- ============================================================
-- SELECT tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
