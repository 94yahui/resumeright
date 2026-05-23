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

export interface ResumeData {
  // Header
  name: string
  jobtitle: string
  email: string
  phone: string
  city: string
  website: string
  extraWebsites?: string[]   // additional website links beyond the first
  photo: string  // base64 data URL or empty
  photoMeta?: { x: number; y: number; scale: number; natW?: number; natH?: number }  // crop: x/y fractions of circle size, scale ≥ 1, natW/natH = source px
  summary: string

  // Contact visibility (undefined = visible)
  hideEmail?: boolean
  hidePhone?: boolean
  hideCity?: boolean
  hideWebsite?: boolean

  // Visibility flags
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
}

export type SectionKey =
  | 'exp' | 'edu' | 'project' | 'award'
  | 'cert' | 'volunteer' | 'interest' | 'language'

export interface AISuggestion {
  id: string
  section: string                        // 'summary' | 'exp' | 'project' | 'skills'
  entryIndex?: number
  field: 'bullets' | 'summary' | 'skills'
  label: string                          // human-readable label, e.g. "工作经历 · 前端工程师"
  tip: string                            // short improvement hint
  optimizedContent: string | string[]    // string for summary, string[] for bullets
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
  name: '张浩然',
  jobtitle: '高级软件工程师',
  email: 'zhanghaoran@email.com',
  phone: '138-0000-0000',
  city: '上海',
  website: 'github.com/zhr',
  photo: '',
  summary: '5 年前端开发经验，专注高性能 Web 应用构建与用户体验优化。在字节跳动、美团等头部互联网公司积累了丰富的大规模产品研发经验。',
  hasSummary: false,
  hasSkills: true,
  hasProject: false,
  hasLanguage: false,
  hasAward: false,
  hasCert: false,
  hasVolunteer: false,
  hasInterest: false,
  exp: [
    {
      id: 'e1',
      title: '高级前端工程师',
      sub: '字节跳动 · 抖音事业部',
      date: '2022.03 — 至今',
      bullets: [
        '主导直播间互动模块重构，首屏渲染速度优化 40%',
        '设计并实现可视化搭建平台，服务 200+ 内部团队',
        '日活跃用户超 5 万，团队 NPS 评分 9.2/10',
      ],
    },
    {
      id: 'e2',
      title: '前端工程师',
      sub: '美团 · 到家事业群',
      date: '2020.07 — 2022.02',
      bullets: [
        '参与外卖 App H5 核心交互开发',
        '负责性能监控体系建设，页面加载速度提升 25%',
        '用户端错误率下降 30%，用户投诉量减少 45%',
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
  skills: ['React', 'TypeScript', 'Vue 3', 'Node.js', 'WebGL', '性能优化', '微前端'],
  project: [],
  award: [],
  cert: [],
  volunteer: [],
  interest: [],
  language: [],
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
    exp, edu, project, award, cert, volunteer, interest, language, skills,
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
    {
      id: 'aw2',
      title: 'ACM-ICPC 亚洲区域赛铜奖',
      sub: '国际大学生程序设计竞赛',
      date: '2019',
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
