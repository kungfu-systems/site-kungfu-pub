// One site-wide source for audience IDs, navigation, and editorial recommendations.
export const profiles = [
  {
    id: 'explore',
    label: '先看看全部',
    short: '全部身份',
    description: '还没选好方向？从三个具体作品里找一个起点。',
    roadmap: '',
    practice: '',
    resourceIds: ['hf-agents', 'qwen-agent', 'mcp'],
    observationIds: ['learning-to-building', 'tool-protocols', 'hiring-method'],
    career: '先看工作内容，再选一个你愿意动手完成的任务。',
  },
  {
    id: 'business',
    label: '业务 / 产品 · 零编程基础',
    short: '业务与产品',
    description: '把你对业务、用户和需求的理解，变成能展示的作品。',
    roadmap: 'foundation',
    practice: 'competitor-watch',
    resourceIds: ['hf-agents'],
    observationIds: ['learning-to-building', 'hiring-method'],
    career:
      '先关注产品助理、AI 产品与运营岗位中的调研、需求拆解和流程改进。专业、经验和实习时长仍要逐项核对。',
  },
  {
    id: 'developer',
    label: '开发者 · 有编程基础',
    short: '有编程基础',
    description: '从自己写每一行，走向拆任务、审代码、验收 Agent 的结果。',
    roadmap: 'builder',
    practice: 'agent-coding',
    resourceIds: ['qwen-agent', 'mcp'],
    observationIds: ['tool-protocols', 'learning-to-building'],
    career:
      '关注 AI 应用开发、Coding Agent 与工具集成。你的编程基础用于设计接口、审查改动和定位故障；用得好 Agent 也需要能判断代码是否正确。',
  },
  {
    id: 'practitioner',
    label: '进阶实践者 · 已做过 Agent',
    short: '已有实践经验',
    description: '把一个能演示的 Agent，推进到有评估、有边界、能交接。',
    roadmap: 'practice',
    practice: 'agent-evaluation',
    resourceIds: ['mcp', 'qwen-agent'],
    observationIds: ['tool-protocols', 'hiring-method'],
    career:
      '关注 Agent 质量评估、应用交付与工作流运营。用失败案例、改进记录和可复查的结果，说明你如何处理真实使用中的问题。',
  },
] as const;
export type ProfileId = (typeof profiles)[number]['id'];
export const PROFILE_STORAGE_KEY = 'kungfu.pub:learner-profile:v1';
export function profileFor(value: unknown) {
  return profiles.find((p) => p.id === value) ?? profiles[0];
}
export const practiceEntries = [
  {
    id: 'competitor-watch',
    profile: 'business',
    number: '01',
    title: '用 Agent 做竞品观察',
    subtitle: '不要求编程 · 商科与文科也能开始',
    description: '读 6 张资料卡，核查 AI 的结论，写一份有判断的产品简报。',
    result: '一页竞品简报 + 核查记录',
    roadmap: 'foundation',
  },
  {
    id: 'agent-coding',
    profile: 'developer',
    number: '02',
    title: '让 Coding Agent 完成一个小工具',
    subtitle: '有编程基础 · 从手写走向协作',
    description: '从需求和验收出发，让 Agent 实现岗位清单整理工具，你负责审查与测试。',
    result: '可运行代码 + 测试与交接说明',
    roadmap: 'builder',
  },
  {
    id: 'agent-evaluation',
    profile: 'practitioner',
    number: '03',
    title: '让一个 Agent 经得起检查',
    subtitle: '已有实践经验 · 从演示走向交付',
    description: '用 8 个案例检查资料问答助手，修复错误，设计失败时的处理办法。',
    result: '评估表 + 改进记录 + 交付判断',
    roadmap: 'practice',
  },
] as const;
export function recommendedEntries(profile: unknown) {
  const p = profileFor(profile);
  return practiceEntries.filter((e) => p.id === 'explore' || e.profile === p.id);
}
