// ===== 康源美宏 测评题库 (162题) =====
// 第一部分 MBTI 28题 (二选一) - 维度: E/I, S/N, T/F, J/P
export const mbtiQuestions = [
  { id: 'm1', dim: 'EI', text: '在社交聚会中，你通常更倾向于：', a: { text: '与多人交谈，主动结识新朋友', value: 'E' }, b: { text: '与少数熟人深入交流', value: 'I' } },
  { id: 'm2', dim: 'EI', text: '在一天结束时，让你感到更充实的方式是：', a: { text: '与人互动、参与活动', value: 'E' }, b: { text: '独处、阅读或安静思考', value: 'I' } },
  { id: 'm3', dim: 'EI', text: '在工作中，你更偏好：', a: { text: '频繁与人沟通协作', value: 'E' }, b: { text: '独立完成需要专注的任务', value: 'I' } },
  { id: 'm4', dim: 'EI', text: '遇到问题时，你通常：', a: { text: '边讨论边思考，说出来更清晰', value: 'E' }, b: { text: '先在心中想清楚再开口', value: 'I' } },
  { id: 'm5', dim: 'EI', text: '别人通常觉得你：', a: { text: '容易接近、热情外向', value: 'E' }, b: { text: '较安静、需要时间才了解', value: 'I' } },
  { id: 'm6', dim: 'EI', text: '在团队中，你更倾向于：', a: { text: '主动发言、推动讨论', value: 'E' }, b: { text: '倾听思考、适时补充', value: 'I' } },
  { id: 'm7', dim: 'EI', text: '周末长时间独处后，你会：', a: { text: '感到能量不足，想找人交流', value: 'E' }, b: { text: '感到放松充实', value: 'I' } },
  { id: 'm8', dim: 'SN', text: '你更关注的是：', a: { text: '具体的事实、细节和现实经验', value: 'S' }, b: { text: '整体的可能性、关联和未来想象', value: 'N' } },
  { id: 'm9', dim: 'SN', text: '学习新事物时，你更偏好：', a: { text: '按部就班、循序渐进', value: 'S' }, b: { text: '先把握全局再深入细节', value: 'N' } },
  { id: 'm10', dim: 'SN', text: '你更欣赏的人是：', a: { text: '脚踏实地、注重实际的人', value: 'S' }, b: { text: '富有想象力、有远见的人', value: 'N' } },
  { id: 'm11', dim: 'SN', text: '描述事物时，你更倾向：', a: { text: '用具体的例子和事实', value: 'S' }, b: { text: '用比喻和抽象概念', value: 'N' } },
  { id: 'm12', dim: 'SN', text: '面对一个新项目，你首先想到：', a: { text: '现有资源和可执行的方法', value: 'S' }, b: { text: '可能的创新点和未来价值', value: 'N' } },
  { id: 'm13', dim: 'SN', text: '你更相信：', a: { text: '经过验证的经验', value: 'S' }, b: { text: '直觉和灵感', value: 'N' } },
  { id: 'm14', dim: 'SN', text: '阅读时你更喜欢：', a: { text: '实用、有操作性的内容', value: 'S' }, b: { text: '启发思考、富有想象的内容', value: 'N' } },
  { id: 'm15', dim: 'TF', text: '做决定时，你更倾向于：', a: { text: '基于逻辑和客观标准', value: 'T' }, b: { text: '考虑他人感受和价值观', value: 'F' } },
  { id: 'm16', dim: 'TF', text: '别人向你倾诉烦恼时，你更倾向：', a: { text: '帮他分析问题、给出方案', value: 'T' }, b: { text: '先共情、给予情感支持', value: 'F' } },
  { id: 'm17', dim: 'TF', text: '你认为更重要的品质是：', a: { text: '公正、理性、一视同仁', value: 'T' }, b: { text: '善良、有同情心', value: 'F' } },
  { id: 'm18', dim: 'TF', text: '评价一件事，你更看重：', a: { text: '是否合理、是否高效', value: 'T' }, b: { text: '是否和谐、是否照顾到每个人', value: 'F' } },
  { id: 'm19', dim: 'TF', text: '在冲突中，你更倾向：', a: { text: '据理力争、坚持立场', value: 'T' }, b: { text: '寻求和解、维护关系', value: 'F' } },
  { id: 'm20', dim: 'TF', text: '面对批评，你更希望：', a: { text: '直接、客观地指出问题', value: 'T' }, b: { text: '委婉、顾及感受地表达', value: 'F' } },
  { id: 'm21', dim: 'TF', text: '你觉得"对的事"是指：', a: { text: '逻辑上正确、符合规则', value: 'T' }, b: { text: '符合良知、对人有善意', value: 'F' } },
  { id: 'm22', dim: 'JP', text: '你的生活方式更接近：', a: { text: '有计划、按部就班', value: 'J' }, b: { text: '灵活应变、随性而为', value: 'P' } },
  { id: 'm23', dim: 'JP', text: '面对截止日期，你倾向：', a: { text: '提前完成、避免最后赶工', value: 'J' }, b: { text: '在压力下更有灵感', value: 'P' } },
  { id: 'm24', dim: 'JP', text: '你的工作空间通常：', a: { text: '整洁有序、物品各有其位', value: 'J' }, b: { text: '较随意、用得到时才整理', value: 'P' } },
  { id: 'm25', dim: 'JP', text: '面对一个决定，你更倾向：', a: { text: '尽快做出、明确结论', value: 'J' }, b: { text: '保留多种可能、收集更多信息', value: 'P' } },
  { id: 'm26', dim: 'JP', text: '旅行时你更倾向：', a: { text: '提前规划行程', value: 'J' }, b: { text: '说走就走、随兴调整', value: 'P' } },
  { id: 'm27', dim: 'JP', text: '你觉得规则是：', a: { text: '应该遵守的准则', value: 'J' }, b: { text: '可以灵活调整的参考', value: 'P' } },
  { id: 'm28', dim: 'JP', text: '在团队中，你常常扮演：', a: { text: '推动计划落地的人', value: 'J' }, b: { text: '带来灵活性和新选项的人', value: 'P' } }
];

// 第二部分 大五人格 44题 (五点量表) - 维度: E, C, A, N, O (R表示反向计分)
export const big5Questions = [
  // 外倾性 E (10题)
  { id: 'b1', dim: 'E', text: '我是聚会中的核心人物。' },
  { id: 'b2', dim: 'E', text: '我很少主动与人搭话。', reverse: true },
  { id: 'b3', dim: 'E', text: '我感到自己充满活力。' },
  { id: 'b4', dim: 'E', text: '我倾向于保留自己的意见。', reverse: true },
  { id: 'b5', dim: 'E', text: '我乐于与各种各样的人交谈。' },
  { id: 'b6', dim: 'E', text: '我很少在谈话中抢风头。', reverse: true },
  { id: 'b7', dim: 'E', text: '我常是群体的领导者。' },
  { id: 'b8', dim: 'E', text: '我常常沉默寡言。', reverse: true },
  { id: 'b9', dim: 'E', text: '我见到陌生人也能轻松交谈。' },
  { id: 'b10', dim: 'E', text: '我不太愿意成为关注的焦点。', reverse: true },
  // 尽责性 C (10题)
  { id: 'b11', dim: 'C', text: '我做事井井有条、有条不紊。' },
  { id: 'b12', dim: 'C', text: '我经常忘记把东西放回原处。', reverse: true },
  { id: 'b13', dim: 'C', text: '我注重细节。' },
  { id: 'b14', dim: 'C', text: '我常常把事情搞乱。', reverse: true },
  { id: 'b15', dim: 'C', text: '我做事总能善始善终。' },
  { id: 'b16', dim: 'C', text: '我经常逃避自己的职责。', reverse: true },
  { id: 'b17', dim: 'C', text: '我做事有计划性。' },
  { id: 'b18', dim: 'C', text: '我常常做事虎头蛇尾。', reverse: true },
  { id: 'b19', dim: 'C', text: '我是一个勤勉工作的人。' },
  { id: 'b20', dim: 'C', text: '我发现很难按计划行事。', reverse: true },
  // 宜人性 A (10题)
  { id: 'b21', dim: 'A', text: '我关心他人的感受。' },
  { id: 'b22', dim: 'A', text: '我对他人比较冷淡、疏远。', reverse: true },
  { id: 'b23', dim: 'A', text: '我容易相信别人。' },
  { id: 'b24', dim: 'A', text: '我有时对别人怀有敌意。', reverse: true },
  { id: 'b25', dim: 'A', text: '我乐于帮助他人。' },
  { id: 'b26', dim: 'A', text: '我有时故意让别人难堪。', reverse: true },
  { id: 'b27', dim: 'A', text: '我与人相处融洽。' },
  { id: 'b28', dim: 'A', text: '我有时会嫉妒别人的成就。', reverse: true },
  { id: 'b29', dim: 'A', text: '我富有同情心，对人真诚。' },
  { id: 'b30', dim: 'A', text: '我有时显得挑剔、苛刻。', reverse: true },
  // 神经质 N (8题)
  { id: 'b31', dim: 'N', text: '我容易紧张。' },
  { id: 'b32', dim: 'N', text: '我大多数时候感到放松。', reverse: true },
  { id: 'b33', dim: 'N', text: '我常常为小事担忧。' },
  { id: 'b34', dim: 'N', text: '我情绪稳定、不易受影响。', reverse: true },
  { id: 'b35', dim: 'N', text: '我容易感到沮丧或低落。' },
  { id: 'b36', dim: 'N', text: '我遇事能够保持冷静。', reverse: true },
  { id: 'b37', dim: 'N', text: '我容易情绪波动。' },
  { id: 'b38', dim: 'N', text: '我能很好应对压力。', reverse: true },
  // 开放性 O (6题)
  { id: 'b39', dim: 'O', text: '我有丰富的想象力。' },
  { id: 'b40', dim: 'O', text: '我不太关注抽象观念。', reverse: true },
  { id: 'b41', dim: 'O', text: '我对艺术和美有较强的感受力。' },
  { id: 'b42', dim: 'O', text: '我更喜欢常规、熟悉的事物。', reverse: true },
  { id: 'b43', dim: 'O', text: '我乐于思考新想法、探索新领域。' },
  { id: 'b44', dim: 'O', text: '我对哲学或抽象议题不太感兴趣。', reverse: true }
];

// 第三部分 PDP 30题 (五点量表) - 每6题对应一个类型
// 1-6: 老虎(Dominance) 7-12: 孔雀(Expressiveness) 13-18: 无尾熊(Patience) 19-24: 猫头鹰(Conformity) 25-30: 变色龙(Adaptability)
export const pdpQuestions = [
  // 老虎 1-6
  { id: 'p1', type: '老虎', text: '我喜欢设定具有挑战性的目标并努力达成。' },
  { id: 'p2', type: '老虎', text: '面对困难，我倾向于迎难而上、果断行动。' },
  { id: 'p3', type: '老虎', text: '我说话直接、不喜欢拐弯抹角。' },
  { id: 'p4', type: '老虎', text: '我喜欢掌控局面、做决策。' },
  { id: 'p5', type: '老虎', text: '我做事追求效率、不喜欢拖延。' },
  { id: 'p6', type: '老虎', text: '我乐于接受竞争和挑战。' },
  // 孔雀 7-12
  { id: 'p7', type: '孔雀', text: '我乐于表达自己的想法和感受。' },
  { id: 'p8', type: '孔雀', text: '我善于营造轻松愉快的氛围。' },
  { id: 'p9', type: '孔雀', text: '我喜欢与人互动、结交朋友。' },
  { id: 'p10', type: '孔雀', text: '我善于激励、感染他人。' },
  { id: 'p11', type: '孔雀', text: '我能调动他人情绪，是天生的氛围带动者。' },
  { id: 'p12', type: '孔雀', text: '我对人热情、注重关系、富有热忱。' },
  // 无尾熊 13-18（原"考拉"，按新版 PDP 定义更名为"无尾熊"）
  { id: 'p13', type: '无尾熊', text: '我做事稳重、不急不躁。' },
  { id: 'p14', type: '无尾熊', text: '我善于倾听、有耐心，能长期坚持做一件事。' },
  { id: 'p15', type: '无尾熊', text: '我倾向于配合他人、追求和谐。' },
  { id: 'p16', type: '无尾熊', text: '我做事按部就班、谨慎稳妥。' },
  { id: 'p17', type: '无尾熊', text: '我有恒心，能长期坚持重复性工作。' },
  { id: 'p18', type: '无尾熊', text: '我待人温和、随性易相处。' },
  // 猫头鹰 19-24
  { id: 'p19', type: '猫头鹰', text: '我做事注重精确和准确。' },
  { id: 'p20', type: '猫头鹰', text: '我喜欢分析数据、用事实说话。' },
  { id: 'p21', type: '猫头鹰', text: '我注重规则、流程和系统导向。' },
  { id: 'p22', type: '猫头鹰', text: '我做事严谨、追求完美与高标准。' },
  { id: 'p23', type: '猫头鹰', text: '我倾向于用逻辑和系统的方式解决问题。' },
  { id: 'p24', type: '猫头鹰', text: '我对细节有较高的敏感度，讲原则。' },
  // 变色龙 25-30
  { id: 'p25', type: '变色龙', text: '我能根据环境和对象调整自己的行为方式。' },
  { id: 'p26', type: '变色龙', text: '我善于在不同角色之间灵活切换。' },
  { id: 'p27', type: '变色龙', text: '我做事灵活、不拘一格，生存力顽强。' },
  { id: 'p28', type: '变色龙', text: '我容易适应新环境、新变化。' },
  { id: 'p29', type: '变色龙', text: '我善于整合不同人的观点，是优秀的协调者。' },
  { id: 'p30', type: '变色龙', text: '我善于谈判，能在多方间达成共赢。' }
];

// 第四部分 DISC 24题 (四选一) - 每题4个选项分别对应 D/I/S/C
export const discQuestions = [
  { id: 'd1', text: '面对一项新任务，我倾向于：', options: [
    { text: '立即着手、追求结果', value: 'D' },
    { text: '热情动员、争取支持', value: 'I' },
    { text: '稳扎稳打、配合团队', value: 'S' },
    { text: '先分析、制定方案', value: 'C' } ] },
  { id: 'd2', text: '在团队中，我常常：', options: [
    { text: '推动进展、做决策', value: 'D' },
    { text: '活跃气氛、激励他人', value: 'I' },
    { text: '默默支持、保持稳定', value: 'S' },
    { text: '把控质量、确保准确', value: 'C' } ] },
  { id: 'd3', text: '我做决定时，更看重：', options: [
    { text: '效率和结果', value: 'D' },
    { text: '人的感受和认同', value: 'I' },
    { text: '稳定和共识', value: 'S' },
    { text: '数据和逻辑', value: 'C' } ] },
  { id: 'd4', text: '面对压力，我倾向于：', options: [
    { text: '更加果断、加快节奏', value: 'D' },
    { text: '寻求社交支持、表达情绪', value: 'I' },
    { text: '保持冷静、按部就班', value: 'S' },
    { text: '深入分析、寻找根因', value: 'C' } ] },
  { id: 'd5', text: '我的沟通风格是：', options: [
    { text: '直接、简明、结果导向', value: 'D' },
    { text: '热情、生动、善于表达', value: 'I' },
    { text: '温和、耐心、善于倾听', value: 'S' },
    { text: '严谨、准确、注重细节', value: 'C' } ] },
  { id: 'd6', text: '我处理冲突的方式是：', options: [
    { text: '正面交锋、坚持立场', value: 'D' },
    { text: '幽默化解、缓和气氛', value: 'I' },
    { text: '退让求和、维护关系', value: 'S' },
    { text: '据理分析、寻求公正', value: 'C' } ] },
  { id: 'd7', text: '面对变化，我通常：', options: [
    { text: '主动引领、推动变革', value: 'D' },
    { text: '积极拥抱、带动他人', value: 'I' },
    { text: '慢慢适应、需要时间', value: 'S' },
    { text: '先评估风险再行动', value: 'C' } ] },
  { id: 'd8', text: '我的工作节奏：', options: [
    { text: '快节奏、目标明确', value: 'D' },
    { text: '有起伏、靠热情驱动', value: 'I' },
    { text: '稳定持续、不急不躁', value: 'S' },
    { text: '有计划、按部就班', value: 'C' } ] },
  { id: 'd9', text: '我对待规则的态度：', options: [
    { text: '规则是工具、必要时可打破', value: 'D' },
    { text: '灵活对待、看情况', value: 'I' },
    { text: '遵守规则、维护秩序', value: 'S' },
    { text: '规则很重要、应严格执行', value: 'C' } ] },
  { id: 'd10', text: '别人通常觉得我：', options: [
    { text: '果断、有魄力', value: 'D' },
    { text: '热情、有感染力', value: 'I' },
    { text: '可靠、温和', value: 'S' },
    { text: '严谨、专业', value: 'C' } ] },
  { id: 'd11', text: '我最害怕的是：', options: [
    { text: '失去控制、被他人支配', value: 'D' },
    { text: '被拒绝、失去社交认同', value: 'I' },
    { text: '突然变化、失去稳定', value: 'S' },
    { text: '出错、被批评不专业', value: 'C' } ] },
  { id: 'd12', text: '我喜欢的工作环境：', options: [
    { text: '有挑战、有自主权', value: 'D' },
    { text: '热闹、互动多', value: 'I' },
    { text: '和谐、稳定', value: 'S' },
    { text: '有序、专业', value: 'C' } ] },
  { id: 'd13', text: '面对错误，我倾向于：', options: [
    { text: '迅速纠正、继续前进', value: 'D' },
    { text: '轻松面对、不过分自责', value: 'I' },
    { text: '默默承担、慢慢改进', value: 'S' },
    { text: '深入复盘、找出根因', value: 'C' } ] },
  { id: 'd14', text: '我激励他人的方式是：', options: [
    { text: '设定目标、给予挑战', value: 'D' },
    { text: '描绘愿景、激发热情', value: 'I' },
    { text: '耐心支持、稳定陪伴', value: 'S' },
    { text: '提供方法、明确标准', value: 'C' } ] },
  { id: 'd15', text: '我面对权威的态度：', options: [
    { text: '尊重但保持独立判断', value: 'D' },
    { text: '乐于接近、建立关系', value: 'I' },
    { text: '服从、配合', value: 'S' },
    { text: '看其专业能力而非职位', value: 'C' } ] },
  { id: 'd16', text: '面对复杂任务，我倾向于：', options: [
    { text: '迅速拆解、抓主要矛盾', value: 'D' },
    { text: '召集众人、共同讨论', value: 'I' },
    { text: '按部就班、稳步推进', value: 'S' },
    { text: '建立模型、系统分析', value: 'C' } ] },
  { id: 'd17', text: '我对时间的管理：', options: [
    { text: '以结果为导向、不拘小节', value: 'D' },
    { text: '较灵活、易被即时事务吸引', value: 'I' },
    { text: '稳定、规律', value: 'S' },
    { text: '精确计划、严格守时', value: 'C' } ] },
  { id: 'd18', text: '我表达情绪的方式：', options: [
    { text: '直接、强烈', value: 'D' },
    { text: '外露、丰富', value: 'I' },
    { text: '内敛、温和', value: 'S' },
    { text: '克制、理性', value: 'C' } ] },
  { id: 'd19', text: '我对待承诺的态度：', options: [
    { text: '说到做到、追求结果', value: 'D' },
    { text: '乐于承诺、但有时随性', value: 'I' },
    { text: '谨慎承诺、一旦承诺必履行', value: 'S' },
    { text: '基于能力评估后再承诺', value: 'C' } ] },
  { id: 'd20', text: '我面对批评时：', options: [
    { text: '直接回应、必要时反击', value: 'D' },
    { text: '希望委婉、顾及感受', value: 'I' },
    { text: '默默接受、内心消化', value: 'S' },
    { text: '理性分析、有理则改', value: 'C' } ] },
  { id: 'd21', text: '我对成功的定义：', options: [
    { text: '达成目标、获得成就', value: 'D' },
    { text: '获得认可、被人喜爱', value: 'I' },
    { text: '生活安稳、关系和谐', value: 'S' },
    { text: '专业精湛、精益求精', value: 'C' } ] },
  { id: 'd22', text: '在社交场合，我：', options: [
    { text: '主导话题、把握节奏', value: 'D' },
    { text: '活跃全场、成为焦点', value: 'I' },
    { text: '安静观察、适时参与', value: 'S' },
    { text: '深入交流、谈专业话题', value: 'C' } ] },
  { id: 'd23', text: '面对未知，我：', options: [
    { text: '视为机会、主动出击', value: 'D' },
    { text: '充满好奇、跃跃欲试', value: 'I' },
    { text: '谨慎观望、做好准备', value: 'S' },
    { text: '收集信息、评估风险', value: 'C' } ] },
  { id: 'd24', text: '我领导团队时，更注重：', options: [
    { text: '目标达成、效率优先', value: 'D' },
    { text: '团队氛围、士气激励', value: 'I' },
    { text: '稳定和谐、成员关怀', value: 'S' },
    { text: '流程规范、质量把控', value: 'C' } ] }
];

// 第五部分 九型人格 36题 (是否符合) - 每个类型4题
// 1完美型 2助人型 3成就型 4感觉型 5思考型 6忠诚型 7活跃型 8领袖型 9和平型
export const enneagramQuestions = [
  // 1 完美型
  { id: 'e1', type: 1, text: '我做事追求正确、有强烈的是非观。' },
  { id: 'e2', type: 1, text: '我对自己和他人都有较高的标准。' },
  { id: 'e3', type: 1, text: '我容易注意到需要改进的地方。' },
  { id: 'e4', type: 1, text: '我常觉得"应该"做得更好，内心有批评者。' },
  // 2 助人型
  { id: 'e5', type: 2, text: '我乐于帮助他人、关心别人的需要。' },
  { id: 'e6', type: 2, text: '我常常先考虑他人再考虑自己。' },
  { id: 'e7', type: 2, text: '我希望被需要、被感激。' },
  { id: 'e8', type: 2, text: '我善于察觉他人的情绪和需求。' },
  // 3 成就型
  { id: 'e9', type: 3, text: '我目标感强、注重成就和表现。' },
  { id: 'e10', type: 3, text: '我注重形象、希望被人认可成功。' },
  { id: 'e11', type: 3, text: '我效率高、善于推进任务。' },
  { id: 'e12', type: 3, text: '我害怕失败、不愿展现弱点。' },
  // 4 感觉型
  { id: 'e13', type: 4, text: '我情感丰富、注重内心感受。' },
  { id: 'e14', type: 4, text: '我追求独特、不愿与别人一样。' },
  { id: 'e15', type: 4, text: '我常有一种与众不同的孤独感。' },
  { id: 'e16', type: 4, text: '我对美和情感有敏锐的感受力。' },
  // 5 思考型
  { id: 'e17', type: 5, text: '我善于观察、喜欢思考和分析。' },
  { id: 'e18', type: 5, text: '我需要独处时间来恢复能量。' },
  { id: 'e19', type: 5, text: '我倾向于在深入了解后才行动。' },
  { id: 'e20', type: 5, text: '我注重保护自己的时间和精力。' },
  // 6 忠诚型
  { id: 'e21', type: 6, text: '我重视忠诚、可靠和责任。' },
  { id: 'e22', type: 6, text: '我常预想最坏的情况以做好准备。' },
  { id: 'e23', type: 6, text: '我做决定前需要反复确认、寻求支持。' },
  { id: 'e24', type: 6, text: '我对权威既依赖又怀疑。' },
  // 7 活跃型
  { id: 'e25', type: 7, text: '我乐观、喜欢尝试新鲜事物。' },
  { id: 'e26', type: 7, text: '我思维活跃、点子很多。' },
  { id: 'e27', type: 7, text: '我害怕无聊和受限、追求丰富体验。' },
  { id: 'e28', type: 7, text: '我善于在不同活动之间切换、保持兴奋。' },
  // 8 领袖型
  { id: 'e29', type: 8, text: '我性格直率、有保护弱者的本能。' },
  { id: 'e30', type: 8, text: '我喜欢掌控局面、不愿被人支配。' },
  { id: 'e31', type: 8, text: '我敢于直面冲突、不回避对抗。' },
  { id: 'e32', type: 8, text: '我重视力量、正义和公平。' },
  // 9 和平型
  { id: 'e33', type: 9, text: '我性情温和、追求和谐。' },
  { id: 'e34', type: 9, text: '我善于看到各方观点、避免冲突。' },
  { id: 'e35', type: 9, text: '我容易与他人同频、融入环境。' },
  { id: 'e36', type: 9, text: '我有时拖延、害怕做决定打破平静。' }
];

export const allParts = [
  { key: 'mbti', title: '第一部分 · MBTI 人格类型', subtitle: '28题 · 二选一 · 选择最接近你的选项', questions: mbtiQuestions, type: 'binary' },
  { key: 'big5', title: '第二部分 · 大五人格', subtitle: '44题 · 五点量表 · 根据实际情况选择符合程度', questions: big5Questions, type: 'scale' },
  { key: 'pdp', title: '第三部分 · PDP 行为风格', subtitle: '30题 · 五点量表 · 根据实际情况选择符合程度', questions: pdpQuestions, type: 'scale' },
  { key: 'disc', title: '第四部分 · DISC 行为风格', subtitle: '24题 · 四选一 · 选择最接近你的选项', questions: discQuestions, type: 'disc' },
  { key: 'enneagram', title: '第五部分 · 九型人格', subtitle: '36题 · 是否符合 · 符合请勾选，不符合可跳过', questions: enneagramQuestions, type: 'enneagram' }
];

export const scaleLabels = ['非常不同意', '不同意', '中立', '同意', '非常同意'];
