// 康源美宏默认岗位配置（17 个岗位，完全对齐 3 份 2026 版岗位说明书）。
//
// 数据来源（2026 修订版）：
//   · 【2026】康源养老-岗位说明书-机构.xlsx —— 8 个机构岗位（区域院长、院长、副院长、
//     行政综合岗、社工、介护师、营销经理、营销专员）
//   · 【2026】康源养老-医护岗位说明书2026.7.24(2).xlsx —— 9 个医护岗位（护理院医生/护士、
//     诊所医生/护士、养老机构医生/护士、药剂师、康复师、检验师）
//   · 项目公司行政岗位职责（2026.3.6更新）.docx —— 行政专员（与 04_行政 同口径）
//
// 维度池（22 维，分两层）：
//   A 层 · 人格基底（12）：共情能力、情绪稳定、责任心、沟通表达、抗压能力、学习能力、
//         领导力、团队协作、细致严谨、创新思维、主动性、服务意识
//   B 层 · 职业行为胜任力细分（10）：口头表达与说服、倾听理解与回应、流程合规与差错防范、
//         应急与危机处置、观察洞察、执行落地、跨部门协调、持续学习适应、
//         耐心与照护亲和、专业审慎与风险意识
// 每个岗位各维度权重之和必须等于 100。
// 权重根据每份说明书的"性格参考 + 工作权重（KPI 占比）"推导。
//
// 准入资质（qualification）：属于"硬约束"而非加权维度——员工只做了性格测评、没有专业资质数据，
// 若把资质塞进加权维度反而稀释真实性格匹配信号。故单独列出，在报告/导出中提示，不参与匹配度计算。

export const DEFAULT_JOBS = [
  // ===== 机构 8 个岗位 =====
  {
    name: '区域院长',
    sort_order: 1,
    group: '机构',
    source: '01_区域院长',
    qualification: '医疗机构管理经验（区域/多项目负责人背景优先），熟悉养老运营与政企关系',
    // 战略统筹 + 跨项目管控 + 对外协调
    dimensions: [
      { dimension: '领导力', weight: 28 },
      { dimension: '责任心', weight: 22 },
      { dimension: '跨部门协调', weight: 14 },     // 对外政府/合作方 + 内部多院协同
      { dimension: '应急与危机处置', weight: 12 }, // 重大风险/舆情处置
      { dimension: '沟通表达', weight: 12 },
      { dimension: '细致严谨', weight: 12 }        // 标准化 + 信息化落地
    ]
  },
  {
    name: '院长',
    sort_order: 2,
    group: '机构',
    source: '02_院长',
    qualification: '中级及以上职称 / 养老机构院长培训合格，具备 30 人团队管理经验',
    dimensions: [
      { dimension: '领导力', weight: 28 },
      { dimension: '责任心', weight: 22 },
      { dimension: '沟通表达', weight: 14 },
      { dimension: '应急与危机处置', weight: 12 },
      { dimension: '跨部门协调', weight: 12 },
      { dimension: '细致严谨', weight: 12 }
    ]
  },
  {
    name: '副院长',
    sort_order: 3,
    group: '机构',
    source: '03_副院长',
    qualification: '护理或养老管理中级职称优先，分管服务品质与团队',
    // 服务品质 55% 主导 → 照护 + 共情 + 细致
    dimensions: [
      { dimension: '细致严谨', weight: 26 },
      { dimension: '服务意识', weight: 22 },
      { dimension: '责任心', weight: 18 },
      { dimension: '共情能力', weight: 14 },
      { dimension: '耐心与照护亲和', weight: 10 },
      { dimension: '团队协作', weight: 10 }
    ]
  },
  {
    name: '行政综合岗',
    sort_order: 4,
    group: '机构',
    source: '04_行政 + 项目公司行政岗位职责',
    qualification: '行政/文秘相关经验，熟练使用办公软件与档案/证照管理',
    // 基础保障 + 客户触点 + 协同
    dimensions: [
      { dimension: '细致严谨', weight: 22 },
      { dimension: '沟通表达', weight: 18 },
      { dimension: '责任心', weight: 18 },
      { dimension: '跨部门协调', weight: 16 },
      { dimension: '服务意识', weight: 16 },
      { dimension: '流程合规与差错防范', weight: 10 }
    ]
  },
  {
    name: '社工',
    sort_order: 5,
    group: '机构',
    source: '05_社工',
    qualification: '持有社会工作师资格证优先，擅长活动策划与长者关怀',
    // 长者关怀 + 活动 + 宣传 + 共情
    dimensions: [
      { dimension: '共情能力', weight: 26 },
      { dimension: '沟通表达', weight: 20 },
      { dimension: '服务意识', weight: 18 },
      { dimension: '倾听理解与回应', weight: 14 },
      { dimension: '创新思维', weight: 12 },
      { dimension: '团队协作', weight: 10 }
    ]
  },
  {
    name: '介护师',
    sort_order: 6,
    group: '机构',
    source: '06_介护',
    qualification: '养老护理员职业技能等级证书（五级及以上）',
    // 照护 50% + 标准 30% + 不良 10%
    dimensions: [
      { dimension: '共情能力', weight: 24 },
      { dimension: '服务意识', weight: 22 },
      { dimension: '耐心与照护亲和', weight: 18 },
      { dimension: '细致严谨', weight: 16 },
      { dimension: '责任心', weight: 12 },
      { dimension: '情绪稳定', weight: 8 }        // 突发应对
    ]
  },
  {
    name: '营销经理',
    sort_order: 7,
    group: '机构',
    source: '07_营销经理',
    qualification: '养老/医疗行业销售管理经验，具备团队与目标管理能力',
    // 入住 55% + 口碑 + 渠道
    dimensions: [
      { dimension: '沟通表达', weight: 22 },
      { dimension: '口头表达与说服', weight: 18 },
      { dimension: '抗压能力', weight: 16 },
      { dimension: '主动性', weight: 16 },
      { dimension: '领导力', weight: 16 },
      { dimension: '创新思维', weight: 12 }
    ]
  },
  {
    name: '营销专员',
    sort_order: 8,
    group: '机构',
    source: '08_营销专员',
    qualification: '良好沟通与服务意识，有无经验均可培养',
    // 接待 50% + 跟进 30% + 口碑
    dimensions: [
      { dimension: '沟通表达', weight: 24 },
      { dimension: '服务意识', weight: 18 },
      { dimension: '主动性', weight: 18 },
      { dimension: '共情能力', weight: 14 },
      { dimension: '口头表达与说服', weight: 14 },
      { dimension: '抗压能力', weight: 12 }
    ]
  },
  // ===== 医护 9 个岗位 =====
  {
    name: '护理院医生',
    sort_order: 9,
    group: '医护',
    source: '1.护理院-医生',
    qualification: '执业医师资格证（临床/全科方向）',
    // 医疗质量 55% + 诊疗 + 协作
    dimensions: [
      { dimension: '细致严谨', weight: 26 },
      { dimension: '责任心', weight: 22 },
      { dimension: '学习能力', weight: 16 },
      { dimension: '专业审慎与风险意识', weight: 14 },
      { dimension: '情绪稳定', weight: 12 },
      { dimension: '沟通表达', weight: 10 }       // MDT + 家属沟通
    ]
  },
  {
    name: '护理院护士',
    sort_order: 10,
    group: '医护',
    source: '1.护理院-护士',
    qualification: '护士执业资格证',
    // 质量 55% + 监测 MDT 20% + 慢病 15%
    dimensions: [
      { dimension: '细致严谨', weight: 24 },
      { dimension: '责任心', weight: 20 },
      { dimension: '服务意识', weight: 18 },
      { dimension: '流程合规与差错防范', weight: 14 },
      { dimension: '学习能力', weight: 12 },
      { dimension: '沟通表达', weight: 12 }
    ]
  },
  {
    name: '诊所医生',
    sort_order: 11,
    group: '医护',
    source: '2.诊所-医生',
    qualification: '执业医师资格证',
    // 质量 55% + 门诊 25% + 协作
    dimensions: [
      { dimension: '细致严谨', weight: 24 },
      { dimension: '责任心', weight: 18 },
      { dimension: '学习能力', weight: 16 },
      { dimension: '专业审慎与风险意识', weight: 14 },
      { dimension: '服务意识', weight: 14 },
      { dimension: '沟通表达', weight: 14 }       // 医患沟通
    ]
  },
  {
    name: '诊所护士',
    sort_order: 12,
    group: '医护',
    source: '2.诊所-护士',
    qualification: '护士执业资格证',
    // 质量 55% + 用药 20% + 宣教 15%
    dimensions: [
      { dimension: '细致严谨', weight: 24 },
      { dimension: '责任心', weight: 20 },
      { dimension: '服务意识', weight: 18 },
      { dimension: '流程合规与差错防范', weight: 14 },
      { dimension: '学习能力', weight: 12 },
      { dimension: '沟通表达', weight: 12 }
    ]
  },
  {
    name: '养老机构医生',
    sort_order: 13,
    group: '医护',
    source: '3.养老机构-医生',
    qualification: '执业医师资格证（老年医学方向优先）',
    // 质量 55% + 诊疗 25% + 团队
    dimensions: [
      { dimension: '细致严谨', weight: 24 },
      { dimension: '责任心', weight: 20 },
      { dimension: '学习能力', weight: 16 },
      { dimension: '专业审慎与风险意识', weight: 14 },
      { dimension: '服务意识', weight: 13 },
      { dimension: '沟通表达', weight: 13 }
    ]
  },
  {
    name: '养老机构护士',
    sort_order: 14,
    group: '医护',
    source: '3.养老机构-护士',
    qualification: '护士执业资格证',
    // 质量 55% + 评估 20% + 增值 15%
    dimensions: [
      { dimension: '耐心与照护亲和', weight: 22 },
      { dimension: '服务意识', weight: 22 },
      { dimension: '细致严谨', weight: 20 },
      { dimension: '责任心', weight: 16 },
      { dimension: '学习能力', weight: 12 },
      { dimension: '沟通表达', weight: 8 }        // 跨部门协作
    ]
  },
  {
    name: '药剂师',
    sort_order: 15,
    group: '医护',
    source: '4.药剂师',
    qualification: '执业药师资格证（必备）',
    // 药品安全 50% + 用药 25% + 标准 15%
    dimensions: [
      { dimension: '细致严谨', weight: 30 },
      { dimension: '责任心', weight: 22 },
      { dimension: '流程合规与差错防范', weight: 16 },
      { dimension: '专业审慎与风险意识', weight: 16 },
      { dimension: '情绪稳定', weight: 16 }
    ]
  },
  {
    name: '康复师',
    sort_order: 16,
    group: '医护',
    source: '5.康复师',
    qualification: '康复治疗师（士）资格证',
    // 康复 45% + 标准 30% + 评估 15%
    dimensions: [
      { dimension: '服务意识', weight: 22 },
      { dimension: '共情能力', weight: 20 },
      { dimension: '耐心与照护亲和', weight: 18 },
      { dimension: '沟通表达', weight: 16 },       // 激励引导
      { dimension: '学习能力', weight: 14 },
      { dimension: '主动性', weight: 10 }
    ]
  },
  {
    name: '检验师',
    sort_order: 17,
    group: '医护',
    source: '6.检验师',
    qualification: '医学检验资格证',
    // 检验 50% + 标准 20% + 安全 20%
    dimensions: [
      { dimension: '细致严谨', weight: 30 },
      { dimension: '责任心', weight: 22 },
      { dimension: '流程合规与差错防范', weight: 16 },
      { dimension: '专业审慎与风险意识', weight: 16 },
      { dimension: '情绪稳定', weight: 16 }
    ]
  }
];

// 5 个测评在"综合匹配"中的影响权重（%）。
// 设计依据：与岗位画像的匹配广度 + 学术权威性 + 与本批 17 个岗位性格参考的契合度。
// 任何修改请同步在 personalityExport.js 与本文件中保持一致。
export const TEST_WEIGHTS = {
  mbti: 25,        // 基础认知偏好，与岗位画像"性格参考"中的 MBTI 类型高度对齐
  big5: 25,        // 学术最权威，覆盖 5 大人格维度
  pdp: 20,         // 行为风格，与岗位"动物特质"参考高度对齐（用户特别强调 PDP）
  disc: 15,        // 行为风格补充（与 PDP 部分重叠，独立价值 15%）
  enneagram: 15    // 动机与深层性格，行为驱动力补充
};

// 总权重必须等于 100；导入时校验
export const TEST_WEIGHTS_TOTAL = Object.values(TEST_WEIGHTS).reduce((a, b) => a + b, 0);
