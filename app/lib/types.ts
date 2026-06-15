// ============================================================
// Shared types — bullet-style descriptions, photo upload
// ============================================================

export interface Entry {
  id: string
  title: string
  sub: string
  date: string
  /**
   * Description as bullet points.
   * Each newline in the editor textarea becomes a separate bullet.
   * Stored as an array internally for clean rendering.
   */
  bullets: string[]
}

export interface SkillCategory {
  id: string
  name: string
  items: string[]
}

export interface ResumeData {
  // Header
  name: string
  jobtitle: string
  email: string
  phone: string
  city: string
  website: string
  extraWebsites?: string[]   // additional website links beyond the first
  customContacts?: { label: string; value: string; hidden?: boolean; isInfo?: boolean }[]
  photo: string  // base64 data URL or empty
  photoMeta?: { x: number; y: number; scale: number; natW?: number; natH?: number; shape?: 'circle' | 'rounded' }
  summary: string

  // Basic info fields
  gender?: string
  age?: string

  // Contact visibility (undefined = visible)
  hideEmail?: boolean
  hidePhone?: boolean
  hideCity?: boolean
  hideWebsite?: boolean
  hideGender?: boolean
  hideAge?: boolean

  // Visibility flags
  hasExp?: boolean
  hasEdu?: boolean
  hasSummary: boolean
  hasSkills: boolean
  hasProject: boolean
  hasLanguage: boolean
  hasAward: boolean
  hasCert: boolean
  hasVolunteer: boolean
  hasInterest: boolean

  // Entries
  exp: Entry[]
  edu: Entry[]
  project: Entry[]
  award: Entry[]
  cert: Entry[]
  volunteer: Entry[]
  interest: Entry[]
  language: Entry[]
  skills: string[]
  skillsStyle?: 'tags' | 'plain' | 'dots'
  languageStyle?: 'pills' | 'plain' | 'list'
  skillCategories?: SkillCategory[]
  skillCategoriesStash?: SkillCategory[]  // preserved when toggling category mode off

  resumeLang?: 'zh' | 'en'
  fontScale?: number

  sectionOrder?: SectionKey[]
  sectionLabels?: Partial<Record<string, string>>
}

export type SectionKey =
  | 'exp' | 'edu' | 'project' | 'award'
  | 'cert' | 'volunteer' | 'interest' | 'language'

export interface AISuggestion {
  id: string
  section: string                        // 'summary' | 'exp' | 'project' | 'skills'
  entryIndex?: number
  field: 'bullets' | 'summary' | 'skills'
  // remove: delete the entry; add: insert newEntry into section; fill: insert newEntry with [[?placeholder?]] text
  action?: 'remove' | 'add' | 'fill'
  label: string                          // human-readable label, e.g. "工作经历 · 前端工程师"
  tip: string                            // short improvement hint
  changeDescription?: string             // brief: which module, what changed, core advantage
  // bullets strings may contain [[+added+]] and [[~deleted~]] inline diff markers
  optimizedContent: string | string[]
  // For action:'add'|'fill' — the new entry to insert into section array
  newEntry?: { title: string; sub: string; date: string; bullets: string[] }
  // For action:'remove' — stable entry id captured at analysis time for correct lookup
  entryId?: string
}

// ── Inline diff helpers ──────────────────────────────────────
// Markup: [[+new text+]] = addition (highlight color)
//         [[~old text~]] = deletion (strikethrough)
// These appear only inside exp/project bullet strings before the user applies.

export interface DiffSegment { text: string; type: 'keep' | 'add' | 'del' }

export function hasDiffMarkup(s: string): boolean {
  return /\[\[[\+~]/.test(s)
}

// Strips any leftover marker fragments: [[+, [[~, +]], ~]], [[, ]]
const STRAY_MARKERS = /\[\[[\+~]|[\+~]\]\]|\[\[|\]\]/g

// Robust regexes: negative lookahead prevents stopping early when content contains + or ~
const ADD_MARKER = /\[\[\+((?:[^+]|\+(?!\]\]))*)\+\]\]/
const DEL_MARKER = /\[\[~((?:[^~]|~(?!\]\]))*?)~\]\]/

export function parseDiffBullet(s: string): DiffSegment[] {
  const segs: DiffSegment[] = []
  let rem = s
  while (rem.length > 0) {
    const aM = ADD_MARKER.exec(rem)
    const dM = DEL_MARKER.exec(rem)
    const ai = aM ? aM.index : Infinity
    const di = dM ? dM.index : Infinity
    if (ai === Infinity && di === Infinity) {
      if (rem) segs.push({ text: rem.replace(STRAY_MARKERS, ''), type: 'keep' })
      break
    }
    const fi = Math.min(ai, di)
    if (fi > 0) segs.push({ text: rem.slice(0, fi).replace(STRAY_MARKERS, ''), type: 'keep' })
    if (ai <= di && aM) {
      segs.push({ text: aM[1].replace(STRAY_MARKERS, ''), type: 'add' })
      rem = rem.slice(ai + aM[0].length)
    } else if (dM) {
      segs.push({ text: dM[1].replace(STRAY_MARKERS, ''), type: 'del' })
      rem = rem.slice(di + dM[0].length)
    } else break
  }
  return segs
}

export function applyDiffBullet(s: string): string {
  return s
    .replace(/\[\[~((?:[^~]|~(?!\]\]))*?)~\]\]/g, '')           // drop deleted segments
    .replace(/\[\[\+((?:[^+]|\+(?!\]\]))*)\+\]\]/g, '$1')       // keep added content, strip markers
    .replace(STRAY_MARKERS, '')                                   // strip any remaining fragments
    .trim()
}

export type SelectionType =
  | { kind: 'none' }
  | { kind: 'field'; field: 'name' | 'summary' | 'photo' }
  | { kind: 'contact' }
  | { kind: 'skills' }
  | { kind: 'entry'; sec: SectionKey; idx: number }


// ============================================================
// Helpers for converting bullet arrays <-> textarea text
// ============================================================
export function bulletsToText(bullets: string[]): string {
  return (bullets || []).join('\n');
}

export function textToBullets(text: string): string[] {
  return text.split('\n').map(s => s.trim());
}


// ============================================================
// Default demo data
// ============================================================
export const DEMO_DATA: ResumeData = {
  name: '简力全开',
  jobtitle: '高级软件工程师',
  email: 'resume@jianliquankai.com',
  phone: '138-0000-0000',
  city: '上海',
  website: 'jianliquankai.com',
  customContacts: [],
  photo: '/virtual_photo.png',
  summary: '5 年前端开发经验，专注高性能 Web 应用与用户体验优化。熟悉大型业务系统的架构设计与迭代，有跨团队协作及技术方案落地经验。',
  hasSummary: true,
  hasSkills: true,
  hasProject: true,
  hasLanguage: true,
  hasAward: false,
  hasCert: true,
  hasVolunteer: false,
  hasInterest: false,
  exp: [
    {
      id: 'e1',
      title: '高级前端工程师',
      sub: '字节跳动 · 抖音事业部',
      date: '2022.03 — 至今',
      bullets: [
        '负责直播间互动模块的架构升级与日常迭代，持续改善渲染性能与稳定性',
        '主导搭建内部低代码平台，支持运营团队自助配置活动页面，减少开发排期依赖',
        '参与制定前端工程规范，推动代码审查流程落地，提升团队交付质量',
      ],
    },
    {
      id: 'e2',
      title: '前端工程师',
      sub: '美团 · 到家事业群',
      date: '2020.07 — 2022.02',
      bullets: [
        '参与外卖 App H5 核心交互功能开发，负责下单链路页面的维护与优化',
        '建设前端性能监控体系，收集关键指标并推动针对性优化',
        '协作排查线上异常，完善错误上报机制，改善用户端稳定性',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: '计算机科学与技术 · 本科',
      sub: '上海交通大学',
      date: '2016 — 2020',
      bullets: ['GPA 3.8/4.0，校级优秀毕业生'],
    },
  ],
  skills: ['React', 'TypeScript', 'Vue 3', 'Node.js', 'Webpack', '性能优化', '微前端', 'Git'],
  project: [
    {
      id: 'p1',
      title: '低代码可视化搭建平台',
      sub: '技术负责人',
      date: '2023.01 — 至今',
      bullets: [
        '设计并实现组件拖拽引擎与属性面板，支持运营人员自助搭建活动落地页',
        '接入 AI 辅助生成模块，帮助非技术人员快速完成页面初稿',
        '针对复杂列表场景引入虚拟滚动方案，解决大数据量下的渲染卡顿问题',
      ],
    },
    {
      id: 'p2',
      title: '直播间互动模块重构',
      sub: '核心开发',
      date: '2022.06 — 2022.12',
      bullets: [
        '将旧版轮询方案迁移至 WebSocket 长连接，降低服务端压力并改善消息实时性',
        '引入虚拟列表优化弹幕渲染，解决高并发弹幕下页面掉帧的问题',
        '整理并沉淀互动组件库，方便后续业务复用与扩展',
      ],
    },
    {
      id: 'p3',
      title: '前端性能监控平台',
      sub: '主要开发者',
      date: '2021.03 — 2021.09',
      bullets: [
        '设计数据采集 SDK，覆盖页面加载、接口耗时、JS 异常等核心指标',
        '搭建可视化看板，支持按页面、版本、设备类型多维度筛选与趋势分析',
        '推动监控数据与告警系统打通，帮助团队更快定位线上问题',
      ],
    },
  ],
  award: [
    {
      id: 'aw1',
      title: '奖项名称',
      sub: '颁奖机构',
      date: '',
      bullets: [],
    },
  ],
  cert: [
    {
      id: 'cr1',
      title: 'AWS Certified Solutions Architect',
      sub: 'Amazon Web Services',
      date: '2022',
      bullets: [],
    },
  ],
  volunteer: [],
  interest: [],
  language: [
    {
      id: 'ln1',
      title: '英语',
      sub: 'CET-6 · 流利读写',
      date: '',
      bullets: [],
    },
    {
      id: 'ln2',
      title: '日语',
      sub: 'JLPT N2',
      date: '',
      bullets: [],
    },
  ],
}

// Maps a raw Gemini-parsed object to a valid ResumeData, filling missing fields with safe defaults.
export function parsedToResumeData(raw: Record<string, unknown>): ResumeData {
  const stripTrailingPeriod = (s: string) => s.replace(/[。.！!？?]+$/, '').trim()
  function cleanEntries(arr: unknown, prefix: string): Entry[] {
    if (!Array.isArray(arr)) return []
    return arr.map((e, i) => ({
      id: String((e as Record<string, unknown>).id ?? `${prefix}${i + 1}`),
      title: String((e as Record<string, unknown>).title ?? ''),
      sub: String((e as Record<string, unknown>).sub ?? ''),
      date: String((e as Record<string, unknown>).date ?? ''),
      bullets: Array.isArray((e as Record<string, unknown>).bullets)
        ? ((e as Record<string, unknown>).bullets as unknown[]).map(b => stripTrailingPeriod(String(b)))
        : [],
    }))
  }
  const exp = cleanEntries(raw.exp, 'e')
  const edu = cleanEntries(raw.edu, 'd')
  const project = cleanEntries(raw.project, 'p')
  const award = cleanEntries(raw.award, 'aw')
  const cert = cleanEntries(raw.cert, 'cr')
  const volunteer = cleanEntries(raw.volunteer, 'vl')
  const interest = cleanEntries(raw.interest, 'it')
  const language = cleanEntries(raw.language, 'ln')
  const skills = Array.isArray(raw.skills) ? (raw.skills as unknown[]).map(s => String(s)) : []
  const skillCategories = Array.isArray(raw.skillCategories)
    ? (raw.skillCategories as unknown[]).map((c: unknown) => {
        const cat = c as Record<string, unknown>
        return {
          id: String(cat.id ?? Math.random().toString(36).slice(2)),
          name: String(cat.name ?? ''),
          items: Array.isArray(cat.items) ? (cat.items as unknown[]).map(s => String(s)) : [],
        }
      })
    : undefined

  // Normalize links: collect ALL URLs from website + extraWebsites, then distribute:
  // first URL → website field, rest → extraWebsites array (mirrors editor's "添加链接" flow).
  // LLMs often ignore extraWebsites and pack multiple URLs into one string.
  const isUrl = (s: string) =>
    s.includes('://') || s.startsWith('http') || /[a-z0-9]\.[a-z]{2,}/i.test(s)
  const splitIntoUrls = (s: string): string[] =>
    s.split(/[,;\s|]+/).map(u => u.trim()).filter(u => u.length > 0 && isUrl(u))

  const rawWebsiteStr = String(raw.website ?? '')
  // extraWebsites may come back as an array OR as a comma/space-separated string
  const rawExtraArr: string[] = Array.isArray(raw.extraWebsites)
    ? (raw.extraWebsites as unknown[]).map(u => String(u)).filter(u => u.length > 0)
    : typeof raw.extraWebsites === 'string' && raw.extraWebsites.trim()
      ? splitIntoUrls(raw.extraWebsites as string)
      : []

  const fromWebsite = splitIntoUrls(rawWebsiteStr)
  // Fall back to the raw string as a single entry if no URL-like tokens were found
  const websiteTokens = fromWebsite.length > 0 ? fromWebsite : (rawWebsiteStr ? [rawWebsiteStr] : [])

  // Merge all URLs deduped, preserving order: website tokens first, then extra
  const seen = new Set<string>()
  const allUrls: string[] = []
  for (const u of [...websiteTokens, ...rawExtraArr]) {
    if (!seen.has(u)) { seen.add(u); allUrls.push(u) }
  }
  const websiteVal = allUrls[0] ?? ''
  const extraVal = allUrls.length > 1 ? allUrls.slice(1) : undefined

  const CJK = /[一-鿿　-〿＀-￯]/
  const keyTexts = [String(raw.jobtitle ?? ''), String(raw.summary ?? ''), ...exp.flatMap(e => e.bullets).slice(0, 4)].filter(Boolean)
  const resumeLang: 'en' | 'zh' = keyTexts.length > 0 && !keyTexts.some(t => CJK.test(t)) ? 'en' : 'zh'

  const basicInfoContacts: { label: string; value: string; hidden: boolean; isInfo: boolean }[] =
    Array.isArray(raw.basicInfo)
      ? (raw.basicInfo as unknown[])
          .map((b: unknown) => {
            const item = b as Record<string, unknown>
            return { label: String(item.label ?? '').trim(), value: String(item.value ?? '').trim(), hidden: false, isInfo: true }
          })
          .filter(b => b.label.length > 0 && b.value.length > 0)
      : []

  return {
    name: String(raw.name ?? ''),
    jobtitle: String(raw.jobtitle ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    city: String(raw.city ?? ''),
    website: websiteVal,
    extraWebsites: extraVal,
    photo: '',
    summary: stripTrailingPeriod(String(raw.summary ?? '')),
    hasSummary: !!raw.hasSummary || String(raw.summary ?? '').length > 0,
    hasSkills: !!raw.hasSkills || skills.length > 0,
    hasProject: !!raw.hasProject || project.length > 0,
    hasLanguage: !!raw.hasLanguage || language.length > 0,
    hasAward: !!raw.hasAward || award.length > 0,
    hasCert: !!raw.hasCert || cert.length > 0,
    hasVolunteer: !!raw.hasVolunteer || volunteer.length > 0,
    hasInterest: !!raw.hasInterest || interest.length > 0,
    resumeLang,
    exp, edu, project, award, cert, volunteer, interest, language, skills,
    ...(skillCategories !== undefined ? { skillCategories } : {}),
    ...(basicInfoContacts.length > 0 ? { customContacts: basicInfoContacts } : {}),
  }
}

export const THUMB_DATA: ResumeData = {
  ...DEMO_DATA,
  summary: '5年前端开发经验，专注高性能Web应用构建与用户体验优化。主导字节跳动核心互动模块重构，曾带领3人小组完成百万级DAU产品的全链路性能治理。',
  hasSummary: false,
  hasProject: true,
  hasLanguage: true,
  hasAward: true,
  hasCert: true,
  skills: ['React', 'TypeScript', 'Vue 3', 'Node.js', 'WebGL', '性能优化', '微前端', 'Git'],
  project: [
    {
      id: 'p1',
      title: '低代码可视化搭建平台',
      sub: '技术负责人',
      date: '2023.01 — 至今',
      bullets: [
        '设计组件拖拽引擎，支持 200+ 内部团队自助搭建活动页',
        '接入 AI 生成模块，页面制作效率提升 3 倍，月活用户 5 万+',
        '通过虚拟滚动与懒加载优化，首屏渲染时间降低 55%',
      ],
    },
    {
      id: 'p2',
      title: '直播间互动实时重构',
      sub: '核心开发',
      date: '2022.06 — 2022.12',
      bullets: [
        '将旧版 Flash 方案迁移至 WebRTC，首屏速度降低 40%',
        '引入虚拟列表优化弹幕渲染，帧率从 30fps 提升至 60fps',
      ],
    },
  ],
  award: [
    {
      id: 'aw1',
      title: '年度技术创新奖',
      sub: '字节跳动',
      date: '2023',
      bullets: [],
    },
  ],
  cert: [
    {
      id: 'cr1',
      title: 'AWS Certified Solutions Architect',
      sub: 'Amazon Web Services',
      date: '2022',
      bullets: [],
    },
  ],
  language: [
    {
      id: 'ln1',
      title: '英语',
      sub: 'CET-6 · 流利读写',
      date: '',
      bullets: [],
    },
    {
      id: 'ln2',
      title: '日语',
      sub: 'JLPT N2',
      date: '',
      bullets: [],
    },
  ],
}

export const THUMB_DATA_STUDENT: ResumeData = {
  ...DEMO_DATA,
  jobtitle: '应届本科毕业生',
  summary: '市场营销专业应届生，具备扎实的数据分析与运营实习经验。在校期间主导多项校园活动策划，善于跨团队沟通协作，期待在快消/互联网领域发展。',
  hasSummary: true,
  hasProject: true,
  hasLanguage: true,
  hasAward: true,
  hasCert: true,
  hasSkills: true,
  skills: ['数据分析', 'Excel/VBA', 'Python基础', 'PS/剪映', '文案写作', 'Notion', '项目管理'],
  exp: [
    {
      id: 'e1',
      title: '市场运营实习生',
      sub: '小红书 · 品牌合作部',
      date: '2024.07 — 2024.12',
      bullets: [
        '协助策划 3 场品牌联名活动，累计曝光量超 200 万次',
        '负责日常数据追踪与周报输出，辅助团队优化投放策略',
        '参与 KOL 筛选与对接，维护 50+ 达人资源库',
      ],
    },
    {
      id: 'e2',
      title: '校园大使',
      sub: '网易有道 · 校园推广',
      date: '2023.09 — 2024.06',
      bullets: [
        '负责校内线下推广，带动 300+ 同学完成产品注册',
        '组织线上打卡活动，获评年度优秀校园大使',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: '市场营销 · 本科',
      sub: '中国人民大学',
      date: '2021 — 2025',
      bullets: ['GPA 3.7/4.0，连续三年获得校级奖学金', '学生会宣传部部长，主导校报改版'],
    },
  ],
  project: [
    {
      id: 'p1',
      title: '校园消费行为调研',
      sub: '课题负责人',
      date: '2024.03 — 2024.06',
      bullets: [
        '设计调查问卷，收集 500+ 份有效样本并完成数据清洗',
        '使用 Python 进行描述性统计分析，输出 15 页研究报告',
        '研究成果获院级优秀毕业论文提名',
      ],
    },
  ],
  award: [
    { id: 'aw1', title: '国家励志奖学金', sub: '教育部', date: '2023', bullets: [] },
    { id: 'aw2', title: '校级优秀学生干部', sub: '中国人民大学', date: '2024', bullets: [] },
  ],
  cert: [
    { id: 'cr1', title: 'CET-6（562分）', sub: '大学英语六级', date: '2023', bullets: [] },
    { id: 'cr2', title: 'Google Analytics 认证', sub: 'Google', date: '2024', bullets: [] },
  ],
  language: [
    { id: 'ln1', title: '英语', sub: 'CET-6 · 良好读写', date: '', bullets: [] },
  ],
}

export const THUMB_DATA_FINANCE: ResumeData = {
  ...DEMO_DATA,
  jobtitle: '高级金融分析师',
  summary: '6年银行及证券从业经验，专注股权投资与企业并购估值。主导完成多项 IPO 项目财务尽调，DCF 建模与行业研究能力突出，具备 CFA Level III 资质。',
  hasSummary: false,
  hasProject: true,
  hasLanguage: true,
  hasAward: true,
  hasCert: true,
  hasSkills: true,
  skills: ['财务建模', 'DCF估值', 'Bloomberg', 'Excel/VBA', 'Wind数据库', 'Python', '行业研究', '项目管理'],
  exp: [
    {
      id: 'e1',
      title: '高级股权研究分析师',
      sub: '中信证券 · 研究部',
      date: '2021.06 — 至今',
      bullets: [
        '覆盖消费与零售板块 15 家上市公司，管理组合市值逾 30 亿元',
        '主导 3 项 A 股 IPO 项目财务尽职调查，协助完成询价定价方案',
        '独立撰写深度行业报告，获评年度最佳研究员（消费组）',
      ],
    },
    {
      id: 'e2',
      title: '投资分析师',
      sub: '工商银行 · 投资银行部',
      date: '2019.07 — 2021.05',
      bullets: [
        '参与企业并购项目估值建模，完成超 20 份 DCF / 可比公司分析报告',
        '协助客户完成债券发行路演材料制作及机构推介',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: '金融学 · 硕士',
      sub: '上海交通大学',
      date: '2017 — 2019',
      bullets: ['GPA 3.9/4.0，研究方向：资产定价与衍生品'],
    },
  ],
  project: [
    {
      id: 'p1',
      title: '消费龙头并购估值项目',
      sub: '项目负责人',
      date: '2023.04 — 2023.10',
      bullets: [
        '构建三张报表联动财务模型，情景敏感性分析覆盖 8 个关键假设',
        '采用 EV/EBITDA、DCF 双法估值，出具最终并购定价建议',
        '项目成功落地，客户反馈满意度 4.9/5',
      ],
    },
  ],
  award: [
    { id: 'aw1', title: '年度最佳研究员', sub: '中信证券', date: '2023', bullets: [] },
  ],
  cert: [
    { id: 'cr1', title: 'CFA Level III', sub: 'CFA Institute', date: '2022', bullets: [] },
    { id: 'cr2', title: 'FRM Part II', sub: 'GARP', date: '2021', bullets: [] },
  ],
  language: [
    { id: 'ln1', title: '英语', sub: 'TOEFL 108 · 商务流利', date: '', bullets: [] },
  ],
}

export const THUMB_DATA_DESIGN: ResumeData = {
  ...DEMO_DATA,
  jobtitle: '资深 UI/UX 设计师',
  summary: '7年互联网产品设计经验，擅长从用户研究到交互原型全链路把控。主导过月活千万级 App 的设计体系建设，推动设计驱动业务转化的落地实践。',
  hasSummary: false,
  hasProject: true,
  hasLanguage: true,
  hasAward: true,
  hasCert: false,
  hasSkills: true,
  skills: ['Figma', 'Sketch', 'Principle', 'Photoshop', 'Illustrator', '用户研究', '设计系统', '动效设计'],
  exp: [
    {
      id: 'e1',
      title: '资深交互设计师',
      sub: '腾讯 · 微信事业群',
      date: '2021.03 — 至今',
      bullets: [
        '负责微信视频号创作者工具的全链路交互设计，版本迭代覆盖 1.2 亿用户',
        '主导搭建创作者端设计系统，统一 120+ 组件规范，研发提效 30%',
        '推动 A/B 测试机制落地，关键路径转化率提升 18%',
      ],
    },
    {
      id: 'e2',
      title: 'UI/UX 设计师',
      sub: '网易 · 严选事业部',
      date: '2018.07 — 2021.02',
      bullets: [
        '参与严选 App 4.0 全面改版，负责商品详情页与购物车交互重设计',
        '主导用研访谈 20+ 场，输出用户旅程图指导产品决策',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: '视觉传达设计 · 本科',
      sub: '中央美术学院',
      date: '2014 — 2018',
      bullets: ['毕业设计获优秀奖，作品入选年度院展'],
    },
  ],
  project: [
    {
      id: 'p1',
      title: '视频号创作者设计系统',
      sub: '设计 TL',
      date: '2022.01 — 2022.12',
      bullets: [
        '从零搭建设计 Token 体系与组件库，覆盖移动端 / Web 双平台',
        '与研发深度协作落地 Handoff 规范，跨组交付效率提升 35%',
        '设计系统在腾讯内部获评优秀基础设施项目',
      ],
    },
  ],
  award: [
    { id: 'aw1', title: 'Red Dot Award · 优胜奖', sub: 'Red Dot Design Award', date: '2023', bullets: [] },
    { id: 'aw2', title: '腾讯年度优秀员工', sub: '腾讯', date: '2022', bullets: [] },
  ],
  cert: [],
  language: [
    { id: 'ln1', title: '英语', sub: 'CET-6 · 流利读写', date: '', bullets: [] },
  ],
}

export const THUMB_DATA_MANAGEMENT: ResumeData = {
  ...DEMO_DATA,
  jobtitle: '运营总监',
  summary: '10年互联网运营管理经验，擅长从0到1搭建高绩效团队，主导过月GMV过亿的业务板块增长。具备P&L全面负责经验，专注用数据驱动运营决策。',
  hasSummary: false,
  hasProject: true,
  hasLanguage: false,
  hasAward: true,
  hasCert: false,
  hasSkills: true,
  skills: ['团队管理', '战略规划', 'P&L管理', '数据分析', '项目管理', '商务谈判', 'OKR', '业务增长'],
  exp: [
    {
      id: 'e1',
      title: '用户增长总监',
      sub: '京东 · 零售事业部',
      date: '2020.09 — 至今',
      bullets: [
        '统筹管理 45 人增长团队，负责年度 GMV 目标制定与分解执行',
        '推动私域运营体系建设，年度会员留存率从 62% 提升至 81%',
        '主导大促活动全链路运营，2023 年 618 单日 GMV 破 3.2 亿元',
      ],
    },
    {
      id: 'e2',
      title: '高级运营经理',
      sub: '拼多多 · 百亿补贴项目组',
      date: '2017.06 — 2020.08',
      bullets: [
        '负责 3C 品类补贴策略设计与执行，管理年度补贴预算 1.5 亿元',
        '组建并带领 12 人运营小组，通过精细化选品将 ROI 提升至 3.8',
        '推动供应商直采机制落地，降低采购成本 22%',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: '工商管理 · 硕士（MBA）',
      sub: '北京大学光华管理学院',
      date: '2015 — 2017',
      bullets: [],
    },
  ],
  project: [
    {
      id: 'p1',
      title: '私域流量增长体系建设',
      sub: '项目负责人',
      date: '2021.01 — 2021.12',
      bullets: [
        '从零搭建企业微信社群运营 SOP，沉淀付费会员 80 万+',
        '设计积分权益体系，复购周期从 45 天缩短至 28 天',
        '项目获集团年度最佳创新实践奖',
      ],
    },
  ],
  award: [
    { id: 'aw1', title: '年度最佳管理者', sub: '京东', date: '2023', bullets: [] },
    { id: 'aw2', title: '优秀项目团队奖', sub: '拼多多', date: '2019', bullets: [] },
  ],
  cert: [],
  language: [],
}

export const CATEGORY_THUMB_DATA: Record<string, ResumeData> = {
  student: THUMB_DATA_STUDENT,
  finance: THUMB_DATA_FINANCE,
  design: THUMB_DATA_DESIGN,
  management: THUMB_DATA_MANAGEMENT,
  tech: THUMB_DATA,
  general: THUMB_DATA,
}
