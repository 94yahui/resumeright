import { ResumeData } from './types'

export type UserType = 'student' | 'fresh' | 'experienced'
export type Industry = 'tech' | 'product' | 'marketing' | 'finance'

const BASE: Pick<ResumeData, 'photo' | 'customContacts' | 'hasAward' | 'hasVolunteer' | 'hasInterest' | 'award' | 'volunteer' | 'interest'> = {
  photo: '',
  customContacts: [],
  hasAward: false,
  hasVolunteer: false,
  hasInterest: false,
  award: [],
  volunteer: [],
  interest: [],
}

// 教育优先排序（学生 & 应届）
const EDU_FIRST_ORDER = ['edu', 'exp', 'project', 'language', 'cert', 'award', 'volunteer', 'interest'] as const

// ── Student ───────────────────────────────────────────────────────────────────
const STUDENT: Record<Industry, ResumeData> = {
  tech: {
    ...BASE,
    name: '李明远',
    jobtitle: '求职意向：前端开发实习',
    email: 'lmy@example.com',
    phone: '139-0000-0000',
    city: '北京',
    website: 'github.com/lmy-dev',
    summary: '计算机科学大三在读，熟悉 React / TypeScript 前端技术栈，对性能优化与工程化实践有浓厚兴趣。有字节跳动暑期实习经历，独立完成过 2 个千级用户的个人项目，习惯用数据说话。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: '计算机科学与技术 · 本科', sub: '北京大学', date: '2022 — 至今',
      bullets: [
        'GPA 3.78/4.0，连续两年校级学业奖学金',
        '主修课程：数据结构、操作系统、计算机网络、数据库原理',
        '校 ACM 协会核心成员，参与 2023 年 ICPC 区域赛',
      ],
    }],
    exp: [{
      id: 'e1', title: '前端开发实习生', sub: '字节跳动 · 飞书事业部', date: '2024.07 — 2024.09',
      bullets: [
        '参与飞书文档富文本编辑器协同模块开发，负责光标同步逻辑优化',
        '修复 12 个线上 Bug，相关页面崩溃率降低 18%，收到 3 条用户好评工单',
        '为核心模块补充单元测试，覆盖率从 45% 提升至 72%',
        '参与 Code Review，输出 2 份技术分享文档被团队收录至 Wiki',
      ],
    }],
    project: [
      {
        id: 'p1', title: '个人博客系统', sub: '独立开发', date: '2024.03 — 2024.05',
        bullets: [
          '基于 Next.js 14 + MDX + Tailwind CSS 构建，支持全文检索、RSS 订阅与暗色模式',
          '引入 ISR 增量静态再生成策略，首屏 LCP 降至 0.9s，Lighthouse 性能分 96',
          '部署至 Vercel，已积累 Google SEO 收录文章 50+ 篇，月独立访客 2000+',
        ],
      },
      {
        id: 'p2', title: '校园二手交易小程序', sub: '前端负责人 · 3 人团队', date: '2023.09 — 2023.12',
        bullets: [
          '使用 Taro + React 开发跨端小程序，对接微信支付与 OSS 图片上传',
          '实现图片懒加载与虚拟列表，商品列表滚动帧率从 30fps 提升至 55fps',
          '上线 3 个月，注册用户 1200+，月活 800+，累计完成交易 300+ 笔',
        ],
      },
    ],
    skills: ['React', 'TypeScript', 'Next.js', 'Vue 3', 'Node.js', 'Webpack / Vite', 'Python', 'Git / GitHub Actions', 'Linux', 'MySQL 基础'],
    language: [
      { id: 'ln1', title: '英语', sub: 'CET-6 · 584 分，读写流利', date: '', bullets: [] },
    ],
    cert: [{ id: 'cr1', title: 'LeetCode 600+ 题', sub: '算法练习', date: '持续更新', bullets: [] }],
  },

  product: {
    ...BASE,
    name: '陈雨晴',
    jobtitle: '求职意向：产品经理实习',
    email: 'cyq@example.com',
    phone: '138-0000-0000',
    city: '上海',
    website: '',
    summary: '工业设计大三在读，辅修人机交互，对产品需求分析与用户研究有浓厚兴趣。有腾讯产品运营实习经历，具备从用户访谈、需求文档到高保真原型的完整交付经验，熟练使用 Figma / Axure。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: '工业设计 · 本科', sub: '同济大学', date: '2022 — 至今',
      bullets: [
        'GPA 3.65/4.0，辅修人机交互方向',
        '主修课程：用户体验设计、交互设计原理、设计思维、服务设计',
        '设计学院优秀学生干部，负责院级用研工作坊策划',
      ],
    }],
    exp: [{
      id: 'e1', title: '产品运营实习生', sub: '腾讯 · 微信事业群', date: '2024.06 — 2024.08',
      bullets: [
        '参与微信小程序新功能灰度测试，系统整理 200+ 条用户反馈并分类建档',
        '独立输出 3 份竞品分析报告（对标飞书 / 钉钉），提出的 5 条改进建议被产品团队采纳 3 条',
        '协助 2 个版本迭代上线，跟进需求评审、提测、验收全流程',
        '新功能上线后次日留存提升 8%，7 日留存提升 5%',
      ],
    }],
    project: [
      {
        id: 'p1', title: '大学生求职助手 App 设计', sub: '课程项目 · 负责人', date: '2024.03 — 2024.05',
        bullets: [
          '主导 20 人用户访谈与问卷调研（回收 120 份），提炼 5 个核心痛点与 3 个机会方向',
          '基于亲和图与用户旅程地图输出完整需求文档，覆盖 6 个核心流程',
          '交付 Figma 高保真原型 30+ 页面，课程答辩评分 95/100，被推荐为全院优秀案例',
        ],
      },
      {
        id: 'p2', title: '校园失物招领小程序需求分析', sub: '独立项目', date: '2023.11 — 2023.12',
        bullets: [
          '完成 15 人深度访谈，识别现有方案的 4 个核心体验断点',
          '输出低保真原型与交互说明文档，获导师评价"逻辑清晰、落地性强"',
        ],
      },
    ],
    skills: ['Figma', 'Axure RP', 'Sketch', 'SQL 基础', '用户访谈', '竞品分析', 'ONES / Jira', 'Notion', 'Excel 数据分析', 'PPT / 演讲'],
    language: [{ id: 'ln1', title: '英语', sub: 'CET-6 · 读写流利，能阅读英文 PRD', date: '', bullets: [] }],
    cert: [],
  },

  marketing: {
    ...BASE,
    name: '张思琦',
    jobtitle: '求职意向：市场运营实习',
    email: 'zsq@example.com',
    phone: '137-0000-0000',
    city: '广州',
    website: '',
    summary: '新闻传播大三在读，辅修数据分析，有小红书内容运营实习经历。擅长内容策划、数据复盘与 KOL 协作，单篇内容最高阅读量 12 万，主导策划过千人到场的线下活动。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: '新闻传播学 · 本科', sub: '中山大学', date: '2022 — 至今',
      bullets: [
        'GPA 3.55/4.0，辅修数据分析方向',
        '主修课程：传播学理论、广告策划与创意、数字媒体营销、新媒体运营',
        '校学生媒体中心副主编，管理公众号矩阵，粉丝累计 6000+',
      ],
    }],
    exp: [{
      id: 'e1', title: '内容运营实习生', sub: '小红书 · 生活方式事业部', date: '2024.07 — 2024.09',
      bullets: [
        '负责 3 个垂类账号（美食 / 家居 / 学习）的内容策划与发布，管理日历排期',
        '单篇笔记最高阅读量 12 万，点赞超 8000，被平台推荐至发现页',
        '策划 #大学生必看# 话题活动，带动 UGC 内容投稿 1800+ 条，话题页浏览量 400 万',
        '输出竞品内容矩阵分析报告，提出 5 条选题策略优化建议，全部被采纳落地',
      ],
    }],
    project: [
      {
        id: 'p1', title: '某饮料品牌校园快闪活动策划', sub: '策划负责人', date: '2023.10 — 2023.11',
        bullets: [
          '独立完成活动方案策划，从创意提报到落地执行全程负责，现场到场人数超 600 人',
          '制作宣传海报（PS）及微信推文，推文阅读量 3500+，带动品牌微信关注增长 400+',
          '活动后整理数据复盘报告，获品牌方好评并续签下学期合作',
        ],
      },
      {
        id: 'p2', title: '新媒体账号矩阵搭建与增长实践', sub: '个人项目', date: '2023.03 — 至今',
        bullets: [
          '运营个人小红书账号（学习类），6 个月从 0 涨粉至 3200，月均互动量 1500+',
          '建立内容选题库与数据分析模板，形成可复用的内容生产 SOP',
        ],
      },
    ],
    skills: ['内容策划 / 选题', '数据分析（Excel / Python 基础）', 'Photoshop / 剪映', '微信公众号运营', '小红书 / 抖音运营', 'KOL 协作', '活动策划', '文案撰写'],
    language: [{ id: 'ln1', title: '英语', sub: 'CET-6 · 可阅读英文行业报告', date: '', bullets: [] }],
    cert: [],
  },

  finance: {
    ...BASE,
    name: '刘浩宇',
    jobtitle: '求职意向：金融分析 / 投研实习',
    email: 'lhy@example.com',
    phone: '136-0000-0000',
    city: '上海',
    website: '',
    summary: '金融学大三在读，辅修数学，GPA 3.82，正备考 CFA 一级。有中信证券研究助理实习经历，具备 DCF 建模与行业研究能力，熟练使用 Wind / Python 进行数据处理。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: '金融学 · 本科', sub: '复旦大学', date: '2022 — 至今',
      bullets: [
        'GPA 3.82/4.0，辅修数学，连续两年国家奖学金',
        '主修课程：公司金融、投资学、金融衍生品、计量经济学、Python 金融应用',
        '金融学院投资研究协会副会长，主持月度行业研究分享会',
      ],
    }],
    exp: [{
      id: 'e1', title: '研究助理实习生', sub: '中信证券 · 新能源研究组', date: '2024.06 — 2024.08',
      bullets: [
        '协助撰写新能源汽车行业深度报告，覆盖 15 家 A 股上市公司财务与业务数据',
        '独立搭建 DCF 估值模型，与市场共识偏差控制在 5% 以内，获分析师认可',
        '整理路演 PPT 及投资者 Q&A 素材，支持完成 3 场机构路演',
        '使用 Python + Wind API 完成行业数据自动抓取脚本，节省团队日常工作 2 小时/天',
      ],
    }],
    project: [
      {
        id: 'p1', title: '消费行业投资分析报告', sub: '课程项目 · 独立完成', date: '2024.04',
        bullets: [
          '对标普 500 消费板块 10 家企业进行 3 年期财务比率与 DCF 估值分析',
          '建立多因子评分模型（盈利 / 成长 / 估值 / 资产质量），筛选出 3 只推荐标的',
          '撰写 20 页深度报告，答辩评分 A，被导师推荐参加院级优秀论文评选',
        ],
      },
      {
        id: 'p2', title: '锂电池产业链数据追踪系统', sub: '个人项目', date: '2024.01 — 2024.03',
        bullets: [
          '用 Python + pandas 抓取 Wind 数据，自动生成产业链价格与库存周报',
          '已在协会内部推广使用，服务 20+ 同学的研究需求',
        ],
      },
    ],
    skills: ['Excel / VBA 建模', 'Python（pandas / matplotlib）', 'Wind / Bloomberg 基础', 'DCF 估值', '财务报表分析', '行业研究框架', 'PowerPoint', 'SQL 基础'],
    language: [
      { id: 'ln1', title: '英语', sub: 'CET-6 · 665 分，可阅读英文研报', date: '', bullets: [] },
    ],
    cert: [{ id: 'cr1', title: 'CFA Level I 备考中', sub: 'CFA Institute · 预计 2025.02 应试', date: '2025', bullets: [] }],
  },
}

// ── Fresh graduate ────────────────────────────────────────────────────────────
const FRESH: Record<Industry, ResumeData> = {
  tech: {
    ...BASE,
    name: '王子涵',
    jobtitle: '前端开发工程师',
    email: 'wzh@example.com',
    phone: '135-0000-0000',
    city: '北京',
    website: 'github.com/wzh-dev',
    summary: '应届软件工程本科毕业生，熟悉 React / TypeScript / Node.js 全栈开发，有阿里巴巴 6 个月实习经历。毕业设计在线协作白板获优秀，期望加入技术驱动的产品团队，持续成长。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: '软件工程 · 本科', sub: '华中科技大学', date: '2021 — 2025',
      bullets: [
        'GPA 3.75/4.0，校优秀毕业生，连续三年综合奖学金',
        '主修课程：编译原理、分布式系统、软件工程实践、机器学习基础',
      ],
    }],
    exp: [{
      id: 'e1', title: '前端开发实习生', sub: '阿里巴巴 · 淘天集团', date: '2024.07 — 2024.12',
      bullets: [
        '参与商品详情页性能专项，使用 LCP 优化 + 预加载策略，页面 LCP 从 3.2s 降至 1.8s',
        '独立开发促销活动可视化配置后台（React + Ant Design Pro），日均 50+ 运营人员使用',
        '设计并落地组件库灰度发布机制，支持 A/B 实验，降低上线风险',
        '提交 40+ PR，Code Review 通过率 92%，获导师"综合评定优秀"',
      ],
    }],
    project: [
      {
        id: 'p1', title: '在线协作白板工具', sub: '毕业设计 · 独立开发', date: '2024.09 — 2025.04',
        bullets: [
          '基于 WebSocket + Canvas 实现多人实时协作，端到端延迟 < 80ms，支持 10 人同时编辑',
          '支持图形绘制、便利贴、思维导图、图片标注等 10+ 交互模式，操作体验对标 Miro',
          '实现 CRDT 冲突解决算法，保障断线重连后数据一致性',
          '毕业答辩评分 95 分，获全院优秀毕业设计，已在 GitHub 获 200+ Stars',
        ],
      },
      {
        id: 'p2', title: '轻量级前端监控 SDK', sub: '个人开源项目', date: '2024.03 — 2024.06',
        bullets: [
          '实现错误捕获、性能指标采集（LCP / FID / CLS）、用户行为回放三大功能模块',
          '发布至 npm，累计下载量 1200+，获 3 家中小团队线上使用',
        ],
      },
    ],
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js / Express', 'Vue 3', 'MySQL / Redis', 'Docker', 'Git / CI/CD', 'Webpack / Vite', 'WebSocket / WebRTC'],
    language: [{ id: 'ln1', title: '英语', sub: 'CET-6 · 608 分，可流利阅读英文技术文档', date: '', bullets: [] }],
    cert: [{ id: 'cr1', title: 'AWS Certified Cloud Practitioner', sub: 'Amazon Web Services', date: '2024', bullets: [] }],
  },

  product: {
    ...BASE,
    name: '赵悦',
    jobtitle: '产品经理',
    email: 'zy@example.com',
    phone: '134-0000-0000',
    city: '杭州',
    website: '',
    summary: '应届人机交互方向硕士，有字节跳动 7 个月产品实习经历，主导过 0→1 功能落地，上线后 GMV 提升 15%。擅长用户研究驱动决策，具备完整的需求分析、原型设计与跨部门推动能力。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: '人机交互 · 硕士', sub: '浙江大学', date: '2022 — 2025',
      bullets: [
        '研究方向：用户体验设计与智能交互系统',
        '参与国家自然科学基金项目"多模态交互评估框架"，发表 CHI 会议论文 1 篇',
      ],
    }],
    exp: [{
      id: 'e1', title: '产品经理实习生', sub: '字节跳动 · 抖音电商', date: '2024.03 — 2024.09',
      bullets: [
        '负责达人选品推荐功能从立项到上线全流程，上线后带货 GMV 环比提升 15%',
        '撰写 PRD 8 份，主导 2 期迭代排期、设计评审与 QA 验收，需求按时交付率 95%',
        '组织用户访谈 30 场，输出用户旅程地图与机会点矩阵，识别 10 个高价值需求',
        '通过数据漏斗分析发现关键转化瓶颈，推动研发优化后点击率提升 22%',
      ],
    }],
    project: [
      {
        id: 'p1', title: '社区电商 App 从 0 到 1 产品设计', sub: '硕士课题项目', date: '2023.09 — 2024.01',
        bullets: [
          '完成市场调研、竞品拆解（对标闲鱼 / 得物）与用户画像构建，输出完整 PRD',
          '完成 Figma 高保真原型（40+ 页面），组织 5 轮可用性测试，任务完成率从 64% 提升至 88%',
          '答辩获导师与业界评委联合打分 93/100，被推荐参加省级研究生创新创业大赛',
        ],
      },
      {
        id: 'p2', title: '智能日程管理工具竞品分析', sub: '独立研究', date: '2023.06',
        bullets: [
          '深度拆解 Notion / Todoist / Fantastical 三款产品的核心功能与商业逻辑',
          '输出 15 页分析报告，总结 6 项可借鉴的产品策略，在组内分享获高度认可',
        ],
      },
    ],
    skills: ['需求分析 / PRD', 'Figma / Axure', 'SQL 数据分析', 'JIRA / Confluence', 'A/B 测试', '用户访谈与研究', 'OKR 管理', 'Python 基础（数据处理）'],
    language: [{ id: 'ln1', title: '英语', sub: 'CET-6 · 流利读写，可阅读英文学术文献', date: '', bullets: [] }],
    cert: [],
  },

  marketing: {
    ...BASE,
    name: '孙佳慧',
    jobtitle: '市场运营专员',
    email: 'sjh@example.com',
    phone: '133-0000-0000',
    city: '上海',
    website: '',
    summary: '应届市场营销本科毕业生，有美团 6 个月内容运营实习经历，独立管理过 30+ KOL 投放项目，自然流量增长 22%。数据敏感，习惯用 A/B 测试与漏斗分析优化运营策略。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: '市场营销 · 本科', sub: '上海财经大学', date: '2021 — 2025',
      bullets: [
        'GPA 3.62/4.0，主修课程：消费者行为学、数字营销、品牌管理、数据分析',
        '校营销协会会长，主办"双十一品牌案例大赛"，参与团队 40+',
      ],
    }],
    exp: [{
      id: 'e1', title: '内容运营实习生', sub: '美团 · 到店事业群', date: '2024.06 — 2024.12',
      bullets: [
        '负责餐饮类目 KOL 合作，管理 30+ 达人投放项目，内容总播放量累计 2000 万+',
        '优化内容分发策略（标签 + 发布时间测试），自然流量增长 22%，CTR 提升 11%',
        '独立策划年中大促物料及传播方案，活动期间曝光量 800 万+，GMV 环比 +18%',
        '搭建 KOL 数据分析模板，将达人筛选效率提升 40%，被团队推广至其他类目',
      ],
    }],
    project: [
      {
        id: 'p1', title: '某快消品牌校园营销方案', sub: '毕业设计 · 企业命题', date: '2024.10 — 2025.03',
        bullets: [
          '完成 200 份问卷调研与 10 场深访，提炼 Z 世代消费决策路径洞察',
          '制定社交媒体 + 线下联动整合传播方案，预算 20 万，预测 ROI 2.4',
          '获导师与合作企业联合评审优秀，方案被企业用于实际执行参考',
        ],
      },
      {
        id: 'p2', title: '个人小红书账号增长实践', sub: '个人项目', date: '2023.05 — 至今',
        bullets: [
          '聚焦职场成长赛道，8 个月从 0 涨粉至 4500，单篇最高点赞 2300',
          '建立内容选题 SOP 与数据复盘机制，互动率稳定在行业均值 2 倍以上',
        ],
      },
    ],
    skills: ['内容策划 / 选题', 'KOL 投放管理', '数据分析（Excel / Python）', 'Photoshop / 剪映', '社群私域运营', 'SEO / SEM 基础', 'A/B 测试', '项目管理'],
    language: [{ id: 'ln1', title: '英语', sub: 'CET-6 · 可阅读英文行业报告', date: '', bullets: [] }],
    cert: [],
  },

  finance: {
    ...BASE,
    name: '吴晨阳',
    jobtitle: '金融分析师 / 投研助理',
    email: 'wcy@example.com',
    phone: '132-0000-0000',
    city: '上海',
    website: '',
    summary: '应届金融学硕士，CFA 一级持证（2024.02），有中金公司 7 个月研究实习经历，独立覆盖新能源行业，主导发布深度研报 2 篇，受到机构客户引用。具备完整的财务建模与路演支持能力。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: '金融学 · 硕士', sub: '上海交通大学', date: '2022 — 2025',
      bullets: [
        '研究方向：资产定价与投资组合管理',
        '主修课程：金融衍生品定价、机器学习在金融中的应用、公司治理与价值评估',
        '研究生学业奖学金一等奖，参与导师纵向课题"A 股市场异质信念研究"',
      ],
    }],
    exp: [{
      id: 'e1', title: '研究助理实习生', sub: '中金公司 · 新能源研究组', date: '2024.03 — 2024.09',
      bullets: [
        '独立覆盖新能源汽车产业链 15 家 A 股上市公司，追踪季报、月度产销数据',
        '主导撰写《锂电池 2025 年展望》深度报告，发布后被 3 家头部私募引用',
        '搭建 DCF + 相对估值双模型，预测偏差率优于团队历史均值 30%',
        '使用 Python + Wind API 自动化行业数据抓取，节省日常工作 2 小时/天',
        '支持分析师完成 5 场机构路演，独立整理路演 Q&A 素材与跟进纪要',
      ],
    }],
    project: [
      {
        id: 'p1', title: '新能源汽车全产业链深度研究', sub: '独立项目', date: '2023.09 — 2024.02',
        bullets: [
          '覆盖电池材料 / 整车制造 / 充电桩三大环节，建立 DCF 与 EV/EBITDA 双估值模型',
          '结合 SCNN 情绪指标与技术面分析输出投资建议，获组内年度优质研报奖',
        ],
      },
      {
        id: 'p2', title: '多因子选股模型构建', sub: '硕士课程项目', date: '2023.03 — 2023.06',
        bullets: [
          '基于 A 股 5 年数据，构建含盈利 / 成长 / 动量 / 质量 4 类 20 个因子的选股模型',
          '年化超额收益 12.3%，最大回撤控制在 8% 以内，课程评分 A+',
        ],
      },
    ],
    skills: ['Excel / VBA 建模', 'Python（pandas / sklearn）', 'Wind / Bloomberg', 'DCF / 相对估值', '财务报表深度分析', '行业研究框架', 'PowerPoint 路演制作', 'SQL'],
    language: [{ id: 'ln1', title: '英语', sub: 'CFA 持证水平 · 可流利阅读英文研报与财报', date: '', bullets: [] }],
    cert: [{ id: 'cr1', title: 'CFA Level I', sub: 'CFA Institute · 2024.02 通过', date: '2024', bullets: [] }],
  },
}

// ── Experienced ───────────────────────────────────────────────────────────────
const EXPERIENCED: Record<Industry, ResumeData> = {
  tech: {
    ...BASE,
    name: '林志远',
    jobtitle: '高级前端工程师',
    email: 'lzy@example.com',
    phone: '131-0000-0000',
    city: '上海',
    website: 'github.com/lzy-dev',
    summary: '5 年前端开发经验，主攻高性能 Web 应用与工程化体系建设。主导过百万级 DAU 产品的全链路性能治理与低代码平台从 0 到 1 建设，有跨部门技术方案推动经验，曾带领 3 人小组。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    edu: [{ id: 'd1', title: '计算机科学 · 本科', sub: '浙江大学', date: '2016 — 2020', bullets: [] }],
    exp: [
      {
        id: 'e1', title: '高级前端工程师', sub: '字节跳动 · 抖音事业部', date: '2022.03 — 至今',
        bullets: [
          '主导直播间互动模块架构重构，引入 WebRTC + 虚拟列表，首屏渲染速度优化 40%',
          '设计并搭建低代码可视化活动搭建平台，服务 200+ 内部团队，月活 5 万+',
          '带领 3 人小组完成全链路性能治理，P95 接口延迟降低 35%，用户投诉量减少 42%',
          '主导前端工程化升级（Webpack → Vite），构建速度提升 3 倍，研发效率显著改善',
        ],
      },
      {
        id: 'e2', title: '前端工程师', sub: '美团 · 到家事业群', date: '2020.07 — 2022.02',
        bullets: [
          '参与外卖 App H5 核心交互模块开发，负责购物车与结算流程重构',
          '建设前端性能监控体系（LCP / FID / CLS），页面加载速度整体提升 25%',
          '用户端 JS 错误率下降 30%，用户投诉量减少 45%',
        ],
      },
    ],
    project: [{
      id: 'p1', title: '低代码可视化搭建平台', sub: '技术负责人', date: '2023.01 — 至今',
      bullets: [
        '设计组件拖拽引擎与 Schema 协议，支持 200+ 内部团队自助搭建活动页',
        '接入 AI 内容生成模块，制作效率提升 3 倍；通过虚拟滚动优化，首屏降低 55%',
      ],
    }],
    skills: ['React', 'TypeScript', 'Vue 3', 'Node.js', 'WebGL / Canvas', '性能优化', '微前端', 'Webpack / Vite', 'Docker / CI/CD', 'Git'],
    language: [{ id: 'ln1', title: '英语', sub: 'CET-6 · 流利读写英文技术文档', date: '', bullets: [] }],
    cert: [{ id: 'cr1', title: 'AWS Certified Solutions Architect – Associate', sub: 'Amazon Web Services', date: '2022', bullets: [] }],
  },

  product: {
    ...BASE,
    name: '周心怡',
    jobtitle: '高级产品经理',
    email: 'zxy@example.com',
    phone: '130-0000-0000',
    city: '北京',
    website: '',
    summary: '4 年 B 端 SaaS 产品经验，专注企业数字化与 HR 科技赛道。主导 3 款产品从 0 到 1 落地，累计服务付费客户 200+，年 ARR 贡献超 500 万，NPS 从 32 提升至 61。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    edu: [{ id: 'd1', title: '信息管理与信息系统 · 本科', sub: '北京航空航天大学', date: '2017 — 2021', bullets: [] }],
    exp: [
      {
        id: 'e1', title: '高级产品经理', sub: '北森 · HRM 产品线', date: '2022.06 — 至今',
        bullets: [
          '负责绩效管理模块从 0 到 1 落地，6 个月内上线并服务 80 家企业客户',
          '主导 3 期大版本迭代，覆盖目标对齐、过程跟进、360 评估三大场景，NPS 32 → 61',
          '协调研发 / 设计 / 销售跨部门协作，需求交付准时率 94%，Bug 逃逸率降低 60%',
          '推动智能报表模块上线，客户自助分析率提升 45%，降低客服压力 30%',
        ],
      },
      {
        id: 'e2', title: '产品经理', sub: '有赞 · 商家工具事业部', date: '2021.07 — 2022.05',
        bullets: [
          '参与订单管理模块重构，操作路径缩短 40%，商家操作时长降低 25%',
          '输出竞品分析报告 6 份，支持事业部 2 项业务决策',
        ],
      },
    ],
    project: [{
      id: 'p1', title: 'OKR 管理 SaaS 产品', sub: '产品负责人', date: '2023.01 — 至今',
      bullets: [
        '从 0 构建 OKR 制定 / 对齐 / 复盘全流程产品，历时 6 个月上线，付费客户 200+，MRR 45 万',
        '设计 AI 目标拆解功能，客户目标完成率提升 18%，续费率 86%',
      ],
    }],
    skills: ['需求分析 / PRD 撰写', 'Figma / Axure', 'SQL 数据分析', 'JIRA / Confluence', 'A/B 测试设计', '用户访谈与研究', 'OKR / KPI 体系设计', 'SaaS 商业模式'],
    language: [{ id: 'ln1', title: '英语', sub: 'CET-6 · 可流利阅读英文产品文档', date: '', bullets: [] }],
    cert: [],
  },

  marketing: {
    ...BASE,
    name: '黄雅文',
    jobtitle: '品牌市场经理',
    email: 'hyw@example.com',
    phone: '189-0000-0000',
    city: '上海',
    website: '',
    summary: '4 年消费品牌整合营销经验，专注社媒增长与全渠道传播。主导元气森林气泡水系列品牌战役，抖音 + 小红书 GMV 年增长 45%，单次大促活动 GMV 超 3000 万，ROI 3.1。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    edu: [{ id: 'd1', title: '广告学 · 本科', sub: '武汉大学', date: '2017 — 2021', bullets: [] }],
    exp: [
      {
        id: 'e1', title: '品牌市场经理', sub: '元气森林', date: '2022.04 — 至今',
        bullets: [
          '负责气泡水系列全渠道品牌传播，抖音 + 小红书渠道 GMV 年增长 45%',
          '主导明星联名合作项目（2 次），合作话题播放量累计破 2 亿，带动新客增长 35%',
          '管理 KOL 矩阵（头部 3 家 + 腰部 60+），统筹内容排期与数据复盘',
          '搭建内容 ROI 评估模型，投放 CPM 降低 22%，种草到购买转化率提升 15%',
        ],
      },
      {
        id: 'e2', title: '市场运营专员', sub: '完美日记', date: '2021.07 — 2022.03',
        bullets: [
          '参与私域社群精细化运营，30 天复购率提升 18%',
          '负责天猫旗舰店大促物料与落地页，双十一 GMV 环比 +30%',
        ],
      },
    ],
    project: [{
      id: 'p1', title: '"零糖夏天"整合营销战役', sub: '项目负责人', date: '2023.05 — 2023.08',
      bullets: [
        '统筹线上（抖音 / 小红书 / 微博）+ 线下（便利店联动）跨渠道投放，总曝光 5 亿+',
        '活动期间单品 GMV 超 3000 万，购买转化率 4.2%，ROI 3.1，创品牌单次活动历史最高',
      ],
    }],
    skills: ['品牌整合传播', '社媒运营（抖音 / 小红书 / 微博）', 'KOL / KOC 投放管理', '数据分析（Excel / Python）', '内容策划与文案', '活动策划执行', 'Photoshop / 剪映', '项目管理'],
    language: [{ id: 'ln1', title: '英语', sub: 'CET-6 · 可阅读英文行业报告', date: '', bullets: [] }],
    cert: [],
  },

  finance: {
    ...BASE,
    name: '陈浩',
    jobtitle: '高级研究员 / 金融分析师',
    email: 'ch@example.com',
    phone: '188-0000-0000',
    city: '上海',
    website: '',
    summary: '4 年卖方研究经验，主攻新能源与消费赛道，独立覆盖 15 家 A 股公司，年度研报发布 12 篇，多次获机构客户引用。具备完整建模体系与路演支持能力，获年度最佳分析师提名。',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    edu: [{ id: 'd1', title: '金融学 · 硕士', sub: '复旦大学', date: '2017 — 2020', bullets: [] }],
    exp: [
      {
        id: 'e1', title: '高级研究员', sub: '中金公司 · 研究部', date: '2022.01 — 至今',
        bullets: [
          '独立覆盖新能源汽车产业链 15 家 A 股上市公司，季度追踪报告及时率 100%',
          '年度发布深度研报 12 篇，总阅读量 50 万+，被 30+ 头部机构客户引用',
          '2023 年度最佳分析师提名（新能源方向），所在组排名行业前 5%',
          '支持 35 场机构路演，管理客户关系覆盖资产规模超 20 亿',
        ],
      },
      {
        id: 'e2', title: '研究员', sub: '华泰证券 · 研究所', date: '2020.07 — 2021.12',
        bullets: [
          '协助覆盖消费板块 10 家公司，参与 6 篇行业深度报告撰写',
          '搭建消费行业估值数据库，提升团队研究效率 40%，被全组推广使用',
        ],
      },
    ],
    project: [{
      id: 'p1', title: '新能源汽车全产业链深度研究', sub: '独立主导', date: '2023.03 — 2023.09',
      bullets: [
        '覆盖电池 / 整车 / 充电桩三大环节，建立 DCF + EV/EBITDA 双估值模型，预测偏差 < 5%',
        '报告被 50+ 家机构下载，获公司内部年度优质研报奖，并被行业媒体转载',
      ],
    }],
    skills: ['Excel / VBA 建模', 'Python（pandas / sklearn）', 'Wind / Bloomberg', 'DCF / 相对估值', '财务报表深度分析', '行业研究框架', 'PowerPoint 路演制作', 'SQL'],
    language: [{ id: 'ln1', title: '英语', sub: 'CFA 持证 · 可流利阅读英文财报与研报', date: '', bullets: [] }],
    cert: [{ id: 'cr1', title: 'CFA Charterholder', sub: 'CFA Institute', date: '2023', bullets: [] }],
  },
}

export function getStarterData(userType: UserType, industry: Industry): ResumeData {
  const map = { student: STUDENT, fresh: FRESH, experienced: EXPERIENCED }
  return map[userType][industry]
}
