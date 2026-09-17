# 示例集团 · 员工职业性格测评系统 — AI 运维总览手册

> 用途：本手册供**未来接手的全权运维 AI** 阅读。它汇总了项目从诞生到 2026-08-25 的全部过程、所有代码/文档、本地/云端/远端三种环境的真实状态，以及所有已修复与待修复的 Bug、操作红线。投喂本文件 + 克隆 GitHub 仓库，即可让新 AI 完整接管本项目的代码修改、Bug 修复、部署与运营。

---

## 0. 一句话定位

一个 **162 题**的职业性格测评 Web 系统，覆盖 **MBTI + 大五(Big5) + PDP + DISC + 九型人格** 五大体系，自动生成个性化报告与岗位匹配，数据存入 **Supabase** 云数据库，前端由 **CloudStudio** 静态托管。当前用于「示例养老服务有限公司」员工测评。

---

## 1. 项目背景与时间线

| 时间 | 事件 |
|---|---|
| 初次提交 | `bc07e48` 示例集团员工职业性格测评系统（162题 + 岗位匹配），Vite + Supabase |
| 后续迭代 | 岗位匹配升级 22 维、导出表改 ExcelJS、PDP 新版定义、业务板块推荐修复、幂等去重等（见第 5 节 git 历史） |
| **2026-08-24** | **P0 事故**：有人测试完报告页崩溃，截图报错 `ReferenceError: saved is not defined`。根因：上一次「幂等去重」提交(`e6fb773`)把 `const saved` 声明在 `else` 块内，却在外层引用，块级作用域导致 ReferenceError。该异常发生在评分之后、**存档之前**，导致当天所有人的测评记录从未写入云端/本机。 |
| 2026-08-24 | 修复 P0 + 5 个潜在 Bug（`19d629a`），部署新链接 `db49f0a2`。发现 CloudStudio「下架旧链接→新链接换域名→旧 localStorage 全部失联」的机制问题。 |
| 2026-08-24~25 | 逆向部署工具，复活旧链接 `a0c3e70b`（删除本地下架记录后同目录重部署，沙箱复用），并新增 `recover.html` 数据恢复中转页（`2b1247c`）。 |
| 2026-08-25 | 全项目只读体检，列出 7 项待修 Bug（见第 9 节），未改动代码。 |

---

## 2. 技术架构

- **构建**：Vite（多页应用，纯前端 SPA 多入口，无后端服务）
- **数据库**：Supabase（PostgreSQL + 行级安全 RLS）。客户端直接用 `supabase-js` 读写。
- **托管**：CloudStudio 静态站点（每次部署生成 `*.app.workbuddy.link` 子域名；另有长期链接 `*.gz5.agentos-app.net`）
- **语言**：原生 ES Module JavaScript + HTML + CSS，无框架。
- **关键库**：`@supabase/supabase-js`、`exceljs`（导出）、`xlsx`（`package.json` 已声明但**源码未使用**，可删）
- **运行模式**：`src/lib/supabaseConfig.js` 提供兜底公开配置；部署环境变量 `VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY` 优先；缺失则回退兜底，保证始终进入「云端模式」并启用后台登录门。

---

## 3. 三重环境总览

### 3.1 本地（开发者机器）
- **项目根目录**：`<项目工作区>`（即本仓库工作区）
- **部署历史/链接注册表**：`<用户目录>\.workbuddy\cloudstudio-deploy-history\`
  - 每次部署一个 JSON 记录（含 `deployTargetId`、`sandboxId`、`conversationId`、`shareLink`）
  - `unpublish-records/`：被下架（取消发布）的链接记录
  - `_revive-backup-20260825/`：复活旧链接时的备份
- **Node 运行时**：优先用 WorkBuddy 管理的 `<用户目录>\.workbuddy\binaries\node\versions\22.22.2\node.exe`
- **构建产物目录**：`dist/`（长期存活沙箱 `b8dd489c` 的来源）、`.deploy-build-4`（旧链接 `a0c3e70b`）、`.deploy-build-5`（曾用于 `db49f0a2`），均为同一份代码的部署快照。

### 3.2 云端（对外服务）
**当前存活、均为同一份修复代码的三个入口**（对外统一用 ①）：

| # | 链接 | 状态 | 说明 |
|---|---|---|---|
| ① | `https://a0c3e70b813941098aff7498084341e6.app.workbuddy.link` | ✅ 存活（已复活） | **测试者手里的原链接**，对外统一口径用它 |
| ② | `https://db49f0a223db46ddbb5ab382fd553c43.app.workbuddy.link` | ✅ 存活 | 含 `recover.html` 恢复页 |
| ③ | `https://b8dd489cf0be47788138dc467a77296f.gz5.agentos-app.net` | ✅ 存活（长期） | 最早沙箱，从未下架 |

> 注意：CloudStudio 子域名由**沙箱 ID 决定**，重新发布同一沙箱必然回到原域名。下架只是取消发布记录（纯本地 `unpublish-records` 判定），沙箱本身不销毁。

**Supabase 项目**
- URL：`https://zknmsszhupuvhtnkzwoo.supabase.co`
- 项目 ref：`zknmsszhupuvhtnkzwoo`
- anon key：公开（打包进客户端），见 `src/lib/supabaseConfig.js`
- 数据表：`assessments`（测评记录）、`jobs`（岗位配置，支持云端覆盖默认）
- **安全现状**：RLS 尚未收紧，anon key 理论上可写任意记录（见第 12 节遗留任务）

### 3.3 远端仓库（GitHub 私有）
- 仓库：`git@github.com:intp41455/career-personality-assessment.git`（私有）
- 分支：`main`（默认）、`export-analysis-v2`、`recovered-edgeone`、远端 `feature/excel-export-personality`
- 当前 HEAD：`2b1247c`（已含全部修复 + recover 页）
- 推送方式：见第 11 节（沙箱网络需绕过代理）

---

## 4. 完整文件清单与职责

### 4.1 `src/` 源码（21 个文件）
| 文件 | 职责 |
|---|---|
| `data/questions.js` | 162 题定义（5 部分：MBTI/Big5/PDP/DISC/九型），含题型、维度、反向计分标记 |
| `data/mbtiLibrary.js` | MBTI 16 型解读库（`getMBTIInfo`） |
| `data/big5Library.js` | 大五维度解读 + 工作环境/团队角色/管理建议辅助函数 |
| `data/pdpLibrary.js` | PDP 5 动物型解读 |
| `data/discLibrary.js` | DISC 4 型解读 |
| `data/enneagramLibrary.js` | 九型 9 型解读 |
| `data/auxLibrary.js` | 血型、星座解读（辅助维度） |
| `data/defaultJobs.js` | 17 个默认岗位（22 维权重，合计=100）、`TEST_WEIGHTS` |
| `lib/scoring.js` | `scoreAll` / `computeDimensions` / `matchJobs`（评分与岗位匹配核心，**已加固容错**） |
| `lib/reportGenerator.js` | 报告文案生成（`recommendBusiness` / `generateFinalAdvice` 等，已加固防空） |
| `lib/store.js` | 本地存储读写（`saveLocalRecord` / `loadLocalJobs` 等） |
| `lib/supabase.js` | Supabase 客户端初始化、`isSupabaseConfigured`、`STORAGE_KEY` 导出 |
| `lib/supabaseConfig.js` | 公开兜底配置（URL + anon key） |
| `lib/personalityExport.js` | Excel 导出（ExcelJS 排版），含少量未使用导入（`getBig5DimInfo`） |
| `pages/home.js` | 首页（开始测评、读取进度） |
| `pages/assess.js` | 答题页（渐进保存 `kymh_assessment_progress` 到 localStorage） |
| `pages/report.js` | **报告页（P0 事故点，已修复）**：评分→存档→拉岗位→渲染 |
| `pages/recover.js` | 数据恢复中转页（读 URL hash → 写 localStorage → 跳 result.html） |
| `pages/admin.js` | 管理后台（登录门、查 `assessments`、导出、岗位配置迁移/修复） |
| `pages/reset.js` | 重置/清理本地数据 |
| `styles/main.css` | 全局样式（报告/后台/Toast 等类齐全） |
| `modules/finance/bank_payment_gateway.js` | **⚠️ 孤立文件**，全仓库无任何 import，疑似遗留，体检未覆盖，建议核查是否应删除 |

### 4.2 根目录入口 HTML（构建入口见 4.3）
`index.html`(首页) `assess.html`(答题) `result.html`(报告) `admin.html`(后台) `reset.html` `recover.html` `assessment-rigor-analysis.html` `assessment-rigor-proof.html`

### 4.3 Vite 多页构建入口（vite.config.js）
`main(index) / assess / result / admin / reset / recover / rigorAnalysis / rigorProof`
> 其余根目录 HTML（见 4.4）**未纳入构建**，仅是本地/独立文档。

### 4.4 根目录独立文档/HTML（未随站点发布，仅供本地查阅或单独发送）
`professional-report.html`、`sop_monthly_payroll_flow.html`、`user_operation_sop_flowchart.html`、`职业岗位画像参考手册.html`、`数据恢复指引.html`、`使用说明操作手册.md`、`FULL_SOURCE_CODE.md`、`report_clean.md`、`格式校验报告_20260819.*`、`new-session-*.json`(⚠️ 含历史会话存档，有泄露风险，勿提交)、`test_dims.mjs`/`gen_job_profiles.mjs`(临时脚本)

---

## 5. Git 仓库关键提交时间线

```
bc07e48 初次提交：示例集团员工职业性格测评系统
ef65a12 后台导出改星青年性格分析排版；新增院长/副院长/行政灵活岗位
14a38c6 题型严谨性分析报告加入构建入口
7ae085c 星青年导出文字按真实维度得分个性化
552c906 PDP 5动物新版 + 17岗位导入 + 5测试加权综合导出
f7d9025 提交公开 Supabase 配置作部署兜底；放宽桌面容器
98777af 导出 Excel 改本地 SheetJS（移除 jsdelivr CDN）
119becb 岗位匹配维度升级 22 维；修复业务板块推荐失效；云端配置一次性迁移
143e9fd 导出表新增维度分析列 + 综合互证
c9dcf0e 导出表移除固定权重列
e6fb773 fix: 结果页幂等守卫 + 稳定提交ID（⚠️ 此提交引入 P0 作用域 bug）
f434c99 导出表改 ExcelJS 自带排版
19d629a fix: 修复 saved 作用域崩溃 + 加固 matchJobs/岗位加载/推荐防空（P0 修复）
2b1247c feat: 新增 recover.html 数据恢复中转页
```
> 全部已推送到 `origin/main`。

---

## 6. 部署拓扑与「链接永远不变」机制

**核心规则（务必遵守）**：CloudStudio 部署工具按「本地目录 → 最新有效部署记录」复用沙箱。**只要从同一目录重新部署、且本地下架记录不存在，链接域名就永远不变**。反之，`unpublish`（下架）会在本地写入 `unpublish-records`，导致下次同目录部署被迫新建沙箱、换域名——这正是 8/24 旧链接失联的根源。

**复活下架链接的实操**（8/25 已验证）：
1. 备份并删除 `~/.workbuddy/cloudstudio-deploy-history/unpublish-records/<对应记录>.json`
2. （如需）删除后来误建的新沙箱部署记录（如 `b9ed6b50018f602d_*.json`）
3. 删除该目录旧构建产物、`vite build --outDir <该目录>` 重建
4. 从同一目录重新 `deploy` → 复用旧沙箱，原域名复活

**当前三个存活链接均指向同一份代码**，对外统一用 `a0c3e70b`。

---

## 7. Supabase 后端

- **表 `assessments`**：字段含 `id`(submissionId, 主键)、`name/gender/age/blood_type/zodiac`、`mbti`、`big5_e/c/a/n/o`、`emotion_stability`、`pdp`、`disc`、`enneagram`、`*_scores`、`dimensions`(JSON)、`answers`(JSON)、`created_at`。后台 `admin.js:187` 按 `created_at desc` 读取。
- **表 `jobs`**：岗位配置，云端可覆盖 `defaultJobs.js`；`dimensions`(JSON, 22 维权重数组)、`qualification`、`sort_order`。
- **写入路径**：`report.js` 渲染报告前 `supabase.from('assessments').insert(baseRecord)`（⚠️ 应为 upsert，见 Bug#2）。
- **配置来源**：`src/lib/supabaseConfig.js`（公开 anon key）。部署环境变量同名优先。

---

## 8. 已完成修复（Bug 史，均已上线）

| 提交 | Bug | 修复 |
|---|---|---|
| `19d629a` | **P0** `ReferenceError: saved is not defined`（报告页全员崩溃） | 把 `let saved = null` 提升到 `init()` 作用域 |
| `19d629a` | `matchJobs` 对损坏 jobs 抛 TypeError | `jobs.filter(job => job && Array.isArray(job.dimensions) && job.dimensions.length>0)` |
| `19d629a` | 岗位加载遇全损数据崩溃 | 过滤无效 dimensions，回退默认 |
| `19d629a` | `recommendBusiness` 空数组 `sorted[0][0]` 崩溃 | 加 `if(!sorted.length)` 兜底 |
| `19d629a` | `generateFinalAdvice` 的 `desire` 空崩溃 | 加 null 守卫（兜底 `'理想'`） |
| `19d629a` | `crypto.randomUUID` 非安全上下文 ReferenceError | 改 `typeof crypto !== 'undefined'` 检查（report.js + home.js） |
| `2b1247c` | 旧链接失联导致数据无法恢复 | 新增 `recover.html` 中转页 + 复活旧沙箱 |

---

## 9. 全项目只读体检发现的待修清单（未改，按优先级）

| # | 优先级 | 位置 | 问题 |
|---|---|---|---|
| 1 | 🔴 | `recover.js:34` | **二次解码**：`URLSearchParams.get` 已解码，又 `decodeURIComponent` 一次，含 `%+hex` 文本会被静默篡改（探针已复现 `100%25`→`100%`）。修复：去掉多余的 `decodeURIComponent`，或直接 `JSON.parse(raw)` |
| 2 | 🟠 | `report.js:126` | 注释说 upsert 实为 `insert`，同 submissionId 重复写触发主键冲突误报「云端保存失败」。改 `.upsert({ onConflict: 'id' })` |
| 3 | 🟠 | `home.js:50` / `assess.js:34` | `JSON.parse(localStorage)` 无 try/catch，损坏时「开始测评」按钮静默失效。加 try/catch + 友好提示 |
| 4 | 🟠 | `admin.js:256` | 搜索框每键击重建整面板，中文输入法组合输入被打断。改为 `input` 防抖 + 仅刷新列表区 |
| 5 | 🟡 | `report.js` | profile 的 gender/age/blood/zodiac 未 `escapeHtml`（name 转了），viewOnly/恢复模式可注入。统一转义 |
| 6 | 🟡 | `scoring.js` | ① DISC 百分比四舍五入合计可能≠100%；② 九型全跳过时主型判为 1 号（全 0 并列取首 key）——报告会按「完美主义者」解读未答九型者 |
| 7 | ⚪ | `recover.js` | 仅校验 answers 非空，未校验答满 162 题（当前恢复数据完整，影响小） |
| 8 | ⚪ | 卫生类 | 死代码：`report.js` 的 `genId()`、`personalityExport.js` 的 `getBig5DimInfo` 导入、`scoreBig5` 的 `maxItems` 参数；`package.json` 的 `xlsx` 未用；根目录 `new-session-*.json` 含会话存档有泄露风险、`test_dims.mjs`/`gen_job_profiles.mjs`/`FULL_SOURCE_CODE.md` 等临时产物应清理或加 `.gitignore` |

---

## 10. 数据恢复事件完整复盘（2026-08-24 ~ 08-25）

**起因**：8/24 有人测试完报告页崩溃（P0）。用户问「今天测试的数据还能找到吗」「刷新一下就行吗」。

**根因链**：
1. P0 bug 使报告崩溃在「评分之后、存档之前」→ 当天记录从未写入云端/本机。
2. 但 `assess.js` 答题过程中已把 `profile + answers` 渐进存入**各测试者浏览器的 localStorage**（键 `kymh_assessment_progress`）。数据是有的，只是报告出不来、且没入库。
3. 第一次修复后我从新目录部署，CloudStudio **换新子域名** `db49f0a2`，旧链接 `a0c3e70b` 被下架（404）。浏览器 localStorage 是**按域名隔离**的，新链接读不到旧数据 → 出现「刷新无用」困境。

**恢复方案演进**：
- 方案 A（控制台片段）：测试者在旧链接 404 页 F12 粘贴脚本，把 localStorage 编码进 URL hash 跳到新站 `recover.html` → 写回 localStorage → 跳 result.html 自动评分入库。**仅电脑端可行**。
- 方案 B（手机免重测）：发现长期链接 `b8dd489c` 从未下架 → 原地更新为修复版，用该链接的手机用户开 `result.html` 即恢复。但多数手机用户用的是已失效的 `a0c3e70b`。
- **最终方案（方案 C）**：逆向部署工具，确认下架是纯本地记录、沙箱未销毁 → 删除 `a0c3e70b` 的下架记录 + 误建的新沙箱记录 → 同目录重建重部署 → **旧链接 `a0c3e70b` 原地复活，跑修复版代码**。所有测试者（手机/电脑/微信）直接点原链接 `result.html` 即可自动恢复，**无需控制台、无需重测**。

**现状**：三个存活链接同代码；旧链接已复活；`recover.html` 仍保留作兜底。

---

## 11. 操作手册 Runbook

### 11.1 本地构建
```bash
cd <项目工作区>
rm -rf dist && npx vite build --outDir dist   # 用 WorkBuddy 管理的 node 22
# 产物含 _redirects（若缺失从 .deploy-build-2 拷贝）
```

### 11.2 部署更新（关键：绝不下架，同目录重部署）
```bash
# 从 dist 部署 → 复用 b8dd489c 长期沙箱，链接不变
# 从 .deploy-build-4 部署 → 复用 a0c3e70b 旧链接
# 用 WorkBuddy 的 cloudstudio-deploy 工具 action=deploy, directory=<上述目录>
```

### 11.3 复活下架链接
见第 6 节实操四步（删 unpublish 记录 → 删误建记录 → 重建 → 同目录部署）。

### 11.4 数据恢复（给他人）
- 报错页还开着 → 刷新即出报告并入库。
- 页面关了 → 同上微信/浏览器开 `<旧链接>/result.html` 自动恢复。
- 换微信/清缓存 → 只能重测（系统已修复，不再崩）。
- 兜底：`recover.html` 控制台方案（见第 10 节）。

### 11.5 推送 GitHub（沙箱网络需用代理绕过）
```bash
git add -A && git commit -m "..." 
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy git push origin main
```

### 11.6 排查「报告出错」
1. 先看浏览器控制台报错是不是 `saved is not defined` 类（已修）。
2. 看 `matchJobs` 是否因 jobs 数据损坏崩溃（已加固）。
3. 确认 `isSupabaseConfigured` 与云端 `assessments/jobs` 表可达。

---

## 12. 当前遗留任务（待办）

1. **🔴 Supabase RLS 收紧**：执行 `20260811020000_secure_rls_and_audit_log.sql`（或等价策略），限制 anon key 仅可插入本人记录、禁止改删他人，杜绝数据被外部篡改。
2. **🔴 撤销两个旧 GitHub PAT**（历史暴露，应尽快在 GitHub 设置 revoke）。
3. **🟠 修第 9 节 Bug #1~#4**（尤其 #1 二次解码、#2 upsert）。
4. **⚪ 清理卫生项**：删 `xlsx` 依赖、孤立 `finance` 模块、根目录临时文件与 `new-session-*.json`、加 `.gitignore`。

---

## 13. 给未来 AI 的授权与红线

**你可以全权做**：
- 按本手册修复第 9 节列出的 Bug、执行第 12 节遗留任务。
- 任何代码修改 → 本地构建 → 同目录重部署 → 推 GitHub。
- 日常排查、数据恢复协助、回答用户关于本项目的问题。

**红线（绝对禁止）**：
- ❌ **绝不 `unpublish` / 下架任何正在使用的链接**。更新只做「同目录重新部署」，链接域名必须保持不变（否则所有用户 localStorage 失联、数据无法恢复）。
- ❌ 不得把 anon key / service role key 明文写进会被公开分发的文档；敏感凭据只在 `.env` 或源码配置文件内。
- ❌ 不得删除 `.workbuddy/cloudstudio-deploy-history` 的部署记录（它们是链接复用/复活的依据），除非按第 6 节复活流程明确需要。
- ❌ 不在未备份情况下批量删除用户数据或表。
- ⚠️ 改动 `scoring.js` / `questions.js` / `defaultJobs.js` 等核心算法前，先用 Node 探针验证 162 题结构、权重合计=100、各 getXInfo 兜底不崩。

---

## 14. 关键凭据与敏感信息位置（指向文件，不全文粘贴）

- Supabase URL + anon key：`src/lib/supabaseConfig.js`（anon key 公开，可提交）
- Supabase **service_role key**：不应存在于仓库；若需执行 RLS/后台管理 SQL，向用户索取或在其 Supabase 后台操作，**切勿写入本项目文件**。
- GitHub 仓库 SSH：`git@github.com:intp41455/career-personality-assessment.git`（私有，依赖本机已配置的 SSH key）
- WorkBuddy 部署工具：`cloudstudio-deploy`（action: deploy/unpublish），历史在 `~/.workbuddy/cloudstudio-deploy-history/`。

---

## 15. 标准交接 Prompt（复制给未来 AI 即可接管）

> 你从现在起全权负责「示例集团员工职业性格测评系统」的运维。项目在 GitHub 私有仓库 `git@github.com:intp41455/career-personality-assessment.git`（分支 main），本地工作区 `<项目工作区>`。技术栈：Vite 多页纯前端 + Supabase(PostgreSQL, ref `zknmsszhupuvhtnkzwoo`) + CloudStudio 静态托管。详见随附的《AI运维总览手册.md》(同一目录)。请先 `git clone` 并通读手册，重点记住：**更新部署必须同目录重部署、绝不下架链接**（否则用户 localStorage 失联）；已修复 P0 `saved` 作用域崩溃；当前有第 9 节 7 项待修 Bug 与第 12 节 3 项遗留任务待处理。后续所有代码修改、Bug 修复、部署、数据恢复、用户咨询均由你独立完成并自审，重大变更先小额提交再推送。

---

*本手册生成于 2026-08-25，汇总至该日为止的全部事实。后续如有新变更，请同步更新本文件第 5/8/9/12 节。*
