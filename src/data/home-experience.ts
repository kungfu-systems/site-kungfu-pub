import type { ProfileId } from './learner-profiles';

// Editorial learning suggestions, not employment predictions or learner testimonials.
export const startingPoints = [
  {
    id: 'business' as ProfileId,
    label: '我没有编程基础',
    note: '从会用 Agent 开始',
    title: '你已有的理解力，就是一个起点。',
    description: '能看懂资料、发现问题、说清自己的想法，就可以先试着和 Agent 做一份调研简报。',
    steps: ['说清一件要做的事', '让 Agent 帮你整理资料', '核查结果，完成自己的作品'],
    practice: 'competitor-watch',
    cta: '试做我的第一份简报',
    career: '了解产品助理、运营工作的任务',
    requirement: '不要求编程；练习需要使用你自己的 Agent。还没用上？先看下方的入门问题。',
  },
  {
    id: 'developer' as ProfileId,
    label: '我有编程基础',
    note: '把经验用在更关键的地方',
    title: '让 Agent 写代码，你来把好交付关。',
    description:
      '从一份明确的需求出发，让 Coding Agent 做岗位整理工具。把你的编程经验用在审查、测试和解决问题上。',
    steps: ['定义需求与验收标准', '和 Agent 一起完成工具', '测试通过，写清交接说明'],
    practice: 'agent-coding',
    cta: '开始我的工具项目',
    career: '了解 AI 应用开发的要求',
    requirement: '这条实践需要编程基础和 Python 运行环境。',
  },
  {
    id: 'practitioner' as ProfileId,
    label: '我已经用过 Agent',
    note: '从能用，走向做得可靠',
    title: '让你的 Agent 经验，有作品可证明。',
    description: '给一个资料问答助手出 8 道题，找出它答错、漏答的地方，再留下改进前后的检查记录。',
    steps: ['用真实任务的要求检查', '发现问题并调整', '记录结果，说明能交付什么'],
    practice: 'agent-evaluation',
    cta: '做一次完整的质量检查',
    career: '了解 Agent 评估与交付工作',
    requirement: '需要已有 Agent 使用经验；检查结果由你实际运行后填写。',
  },
];

export const demoSteps = [
  {
    label: '交代任务',
    title: '从一句你说得清的话开始。',
    description: '给背景、给资料、说清楚想要什么。',
  },
  {
    label: '一起完成',
    title: 'Agent 帮忙，你来判断。',
    description: '它整理信息，你检查依据、提出修改。',
  },
  {
    label: '得到作品',
    title: '把“我会用”变成看得见的成果。',
    description: '留下你的判断，也留下做事的过程。',
  },
];

export const beginnerQuestions = [
  {
    question: '我连代码都不会，真的能开始吗？',
    answer:
      '可以先从不需要编程的任务开始。本站的竞品观察练习提供现成资料和分步提示，你要做的是说明需求、核查信息、写出自己的判断。工具做出的结果仍需要你检查。',
    link: '/practice/competitor-watch/',
    label: '看一个不要求编程的练习',
  },
  {
    question: '三四五千的电脑够吗？一定要买新的吗？',
    answer:
      '先别急着买新电脑。可以先在 Windows 的“设置 → 系统 → 关于”或 Mac 的“关于本机”找到系统、处理器和内存信息，再对照所选工具的要求。需要买新机时，可以按预算查看上面的配置建议和品牌候选；这些是选购参考，机型尚未做 Agent 实测。',
    link: '#computer-guide',
    label: '按预算看看电脑推荐',
  },
  {
    question: '还没装好 Agent，应该从哪里开始？',
    answer:
      '先确定要使用的工具，再按你的电脑系统选择安装入口。Hermes 官方提供 Windows 和 Mac 的安装说明；账号、模型服务与网络连接也会影响能否用起来。下面是官方简体中文安装文档，包含命令行操作说明；面向国内小白的完整图文安装课还在准备中。',
    link: 'https://hermes-agent.nousresearch.com/docs/zh-Hans/getting-started/installation',
    label: '打开 Hermes 官方安装说明',
  },
  {
    question: '除了电脑，还要花哪些钱？',
    answer:
      '本站学习内容可以直接阅读。练习中使用的 Agent、模型服务和其他工具可能另行收费，具体以服务方的套餐为准。先用一个小任务了解消耗、查看账单，再决定是否增加预算。',
  },
  {
    question: '学完这些，就能找到工作吗？',
    answer:
      '不能保证。这里帮助你看懂岗位任务、练习相关能力、积累可以展示的作品。求职还要对照岗位的学历、经验和其他要求。你可以先读招聘样本里的实际职责，再判断是否值得投入。',
    link: '/careers/',
    label: '看看实际的岗位要求',
  },
];
