# 康源美宏 · 员工职业测评系统

企业级员工职业性格测评平台，集成 **MBTI + 大五人格 (Big5) + PDP + DISC + 九型人格** 五大工具，共 162 题。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite 5 + Vanilla JS + Chart.js |
| 后端 | Supabase (PostgreSQL + Auth + RLS) |
| 导出 | ExcelJS (带样式 .xlsx 导出) |
| 部署 | Cloudflare Pages |

## 功能

- **5 合 1 测评** — MBTI 28题 + Big5 44题 + DISC + PDP + 九型人格，一次性完成
- **多入口应用** — 首页 / 答题 / 结果 / 管理后台 / 重置 / 恢复，Vite 多入口构建
- **管理后台** — 登录门禁、测评记录管理、岗位维度配置、操作审计日志
- **Excel 导出** — 自带排版的 .xlsx（冻结首行 / 隔行斑马纹 / 列宽自适应 / 多行换行）
- **结果报告** — 雷达图 + 维度解读 + 岗位匹配度计算

## 安全设计

### Supabase RLS 策略

系统依赖 Row Level Security 实现数据隔离，而非客户端权限控制：

| 表 | 匿名用户 (anon) | 认证管理员 (authenticated) |
|---|---|---|
| `assessments` | INSERT only | 全部 CRUD |
| `jobs` | 无权限 | 全部 CRUD |
| `admin_audit_log` | 无权限 | SELECT + INSERT（不可删改） |

部署步骤：在 Supabase Dashboard → SQL Editor 执行 `supabase_rls_policies.sql`。

### 环境变量

Supabase 连接信息通过环境变量注入，不硬编码在源码中：

```bash
cp .env.example .env
# 填入你的 Supabase URL 和 anon key
```

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建
npm run build

# 预览构建产物
npm run preview
```

## 项目结构

```
src/
├── data/           # 题库 + 各工具解读库
│   ├── questions.js       # 162 题库
│   ├── mbtiLibrary.js     # MBTI 16 类型解读
│   ├── big5Library.js     # Big5 5 维度解读
│   ├── discLibrary.js     # DISC 4 类型解读
│   ├── pdpLibrary.js      # PDP 5 类型解读
│   ├── enneagramLibrary.js# 九型 9 类型解读
│   └── defaultJobs.js     # 默认岗位画像
├── lib/            # 基础设施
│   ├── supabaseConfig.js  # 环境变量读取
│   ├── supabase.js        # 客户端创建 + 会话持久化
│   ├── store.js           # localStorage 离线兜底
│   ├── scoring.js        # 计分引擎
│   ├── reportGenerator.js# 报告生成
│   └── personalityExport.js # Excel 导出分析
├── pages/          # 页面逻辑
│   ├── home.js / assess.js / report.js / admin.js / reset.js / recover.js
└── styles/
    └── main.css
```

## License

Proprietary — 康源美宏养老服务有限公司
