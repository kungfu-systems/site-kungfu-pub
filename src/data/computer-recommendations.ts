// Editorial buying shortlist, not a hardware benchmark or live inventory feed.
// Team workbook: 2026年电脑配置推荐.xlsx, 分价位推荐 rows 3 and 7.
export const computerGuideCheckedAt = '2026-09-09';
export const agentPlatformSource =
  'https://hermes-agent.nousresearch.com/docs/zh-Hans/getting-started/platform-support';

export const computerBudgets = [
  {
    id: '3000',
    label: '3,000–3,999 元',
    note: '先控制投入',
    title: '把预算花在开始做事上。',
    description:
      '先以整理资料、写文案、做求职作品为目标。选购时优先看内存和存储，别只看“AI 电脑”的宣传。',
    memory: '16GB',
    storage: '512GB',
    focus: '预算紧，就先看这一档；有旧电脑的同学，可以先试用再决定。',
    model: {
      brand: 'HONOR',
      name: '荣耀 X16 2025 战斗版',
      cpu: 'Intel i5-13420H',
      memory: '16GB',
      storage: '512GB SSD',
      screen: '16 英寸',
      price: 3499,
      priceLabel: '团队参考价 · 现价待核实',
      reason: '偏向在家学习：16 英寸屏幕，方便把资料和工作窗口摆在一起。',
      limitation: '这是较早款式，先问清是否有全新现货，以及保修和退换条件。',
      priceDetail:
        '价格来自团队清单，不是今日报价；清单未注明采价日期及优惠条件。官网已核对 i5 / 16GB / 512GB 版本，购买时请逐项匹配。',
      source: 'https://www.honor.com/cn/m/notice-13906',
      sourceLabel: '荣耀官方型号清单',
      official: 'https://www.honor.com/cn/laptops/honor-magicbook-x-16/',
    },
  },
  {
    id: '4000',
    label: '4,000–4,999 元',
    note: '看看便携选择',
    title: '带着电脑，去上课、去面试。',
    description:
      '预算多一点，也可以优先考虑尺寸和售后。相同的内存、硬盘容量，不代表必须为了更贵的型号加钱。',
    memory: '16GB',
    storage: '512GB 起',
    focus: '常带出门可看 14 英寸；主要在家用，可与上一档的大屏机比较。',
    model: {
      brand: 'Lenovo',
      name: '联想小新 14 SE 2025 酷睿版',
      cpu: 'Intel i5-13420H',
      memory: '16GB',
      storage: '512GB SSD',
      screen: '14 英寸',
      price: 4499,
      priceLabel: '教育特惠页展示价',
      reason: '偏向带出门：14 英寸机型，供需要在教室、图书馆和家之间使用的同学比较。',
      limitation: '活动入口为教育特惠页，请确认资格、库存和结算价；并非所有人都能按此价购买。',
      priceDetail:
        '联想教育特惠页列出 i5-13420H / 16GB / 512GB 版本 ¥4,499。未核验个人优惠资格、库存和最终结算价。',
      source: 'https://mactivity.lenovo.com.cn/xiaofei/xiaoxin/xxjyth.html',
      sourceLabel: '联想教育特惠价格来源',
      official: 'https://item.lenovo.com.cn/product/1042098.html',
    },
  },
  {
    id: '5000',
    label: '5,000–6,999 元',
    note: '多留些使用余量',
    title: '给同时做几件事，多留些空间。',
    description:
      '如果经常同时打开浏览器、表格和 Agent，可以把增加的预算放在更大内存和硬盘上。配置更高，并不等于 Agent 的回答更聪明。',
    memory: '24–32GB',
    storage: '1TB',
    focus: '这档主要买多任务与存储余量。刚开始学习，不必把它当成入门门槛。',
    model: {
      brand: 'ThinkBook',
      name: '联想 ThinkBook 14 2026 锐龙版',
      cpu: 'AMD Ryzen 7 H 260',
      memory: '24GB DDR5',
      storage: '1TB SSD',
      screen: '14 英寸 · 2.8K',
      price: 5699,
      priceLabel: '官网参考价 · 5UCD 版本',
      reason: '偏向长期日常使用：24GB 内存和 1TB 硬盘，为更多窗口、课程资料和项目文件留余量。',
      limitation: '请认准 5UCD、24GB / 1TB 版本；同名系列的不同配置和价格不能混用。',
      priceDetail:
        '联想官方知识库列示 ¥5,699，配置为 R7 H 260 / 24GB DDR5 / 1TB / 2.8K。实际库存、优惠和成交价以商城为准。',
      source: 'https://www.lenovo.com.cn/wiki/product-1052644.html',
      sourceLabel: '联想官方配置与参考价',
      official: 'https://www.lenovo.com.cn/wiki/product-1052644.html',
    },
  },
] as const;
