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
  label: string                          // human-readable label, e.g. "Work Experience · Frontend Engineer"
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
  name: 'Alex Morgan',
  jobtitle: 'Senior Software Engineer',
  email: 'alex.morgan@example.com',
  phone: '(XXX) 555-0182',
  city: 'San Francisco, CA',
  website: 'alexmorgan.example.com',
  customContacts: [],
  photo: '/virtual_photo.png',
  summary: 'Senior software engineer with 6 years designing and scaling full-stack web services. Strong in distributed systems, API design, and performance, with a track record of leading work across frontend, backend, and cloud infrastructure.',
  resumeLang: 'en',
  skillsStyle: 'plain',
  languageStyle: 'plain',
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
      title: 'Senior Software Engineer',
      sub: 'Stripe · Payments Platform',
      date: 'Mar 2022 — Present',
      bullets: [
        'Designed and shipped an idempotent payment-events service in Go and PostgreSQL processing 20M+ events/day with exactly-once semantics',
        'Led decomposition of a Rails monolith into Kubernetes microservices, cutting deploy time 70% and improving p99 latency',
        'Built a GraphQL gateway unifying 8 backend services, reducing client round-trips and standardizing auth',
        'Mentored 3 engineers and introduced contract tests, lowering production incidents 35%',
      ],
    },
    {
      id: 'e2',
      title: 'Software Engineer',
      sub: 'Airbnb · Growth',
      date: 'Jul 2019 — Feb 2022',
      bullets: [
        'Built React and TypeScript booking flows served to millions of users with SSR and edge caching',
        'Cut Largest Contentful Paint 40% via code-splitting, image optimization, and route prefetching',
        'Developed a Node.js and Kafka event pipeline powering A/B experiments and funnel analytics',
        'Optimized Postgres queries and added Redis caching, reducing API latency from 800ms to 120ms',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: 'B.S. in Computer Science',
      sub: 'University of California, Berkeley',
      date: '2016 — 2020',
      bullets: ['GPA 3.8/4.0 · Dean’s List'],
    },
  ],
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'Redis', 'GraphQL', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
  project: [
    {
      id: 'p1',
      title: 'Distributed Job Scheduler',
      sub: 'Open Source',
      date: '2023',
      bullets: [
        'Built a fault-tolerant scheduler in Go with at-least-once delivery and cron semantics',
        'Implemented leader election and partition sharding via etcd for horizontal scaling',
        'Added Prometheus metrics and Grafana dashboards for end-to-end observability',
        'Published on GitHub with 1.2k stars and an active contributor community',
      ],
    },
    {
      id: 'p2',
      title: 'Real-Time Collaboration Engine',
      sub: 'Side Project',
      date: '2022',
      bullets: [
        'Implemented a CRDT sync layer over WebSocket for conflict-free concurrent editing',
        'Designed offline queueing and reconnection with automatic state reconciliation',
        'Cut sync bandwidth 60% with binary diffing and message batching',
        'Wrote load tests simulating 10k concurrent clients to validate throughput',
      ],
    },
  ],
  award: [
    {
      id: 'aw1',
      title: 'Award Name',
      sub: 'Issuer',
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
      title: 'English',
      sub: 'Native',
      date: '',
      bullets: [],
    },
    {
      id: 'ln2',
      title: 'Spanish',
      sub: 'Professional',
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
  // first URL → website field, rest → extraWebsites array (mirrors the editor's "Add link" flow).
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
    hasSkills: !!raw.hasSkills || skills.length > 0 || !!(skillCategories && skillCategories.some(c => c.items.length > 0)),
    hasProject: !!raw.hasProject || project.length > 0,
    hasLanguage: !!raw.hasLanguage || language.length > 0,
    hasAward: !!raw.hasAward || award.length > 0,
    hasCert: !!raw.hasCert || cert.length > 0,
    hasVolunteer: !!raw.hasVolunteer || volunteer.length > 0,
    hasInterest: !!raw.hasInterest || interest.length > 0,
    resumeLang,
    // Filled-template flows (landing import / resume analysis / ATS) use the plain language style.
    languageStyle: 'plain',
    exp, edu, project, award, cert, volunteer, interest, language, skills,
    ...(skillCategories !== undefined ? { skillCategories } : {}),
    // Categorized skills default to the plain style and open category mode in the editor.
    ...(skillCategories && skillCategories.some(c => c.items.length > 0) ? { skillsStyle: 'plain' as const } : {}),
    ...(basicInfoContacts.length > 0 ? { customContacts: basicInfoContacts } : {}),
  }
}

export const THUMB_DATA: ResumeData = {
  ...DEMO_DATA,
  summary: 'Senior software engineer, 6 years across full-stack web services — distributed systems, API design, and performance. Led a payments-platform service at scale and mentored a small team.',
}

/**
 * Sample resume content for template previews and new-from-template.
 * Single-column → plain skill/language styling; two-column → tag/pill styling.
 * Two-column trims experience/projects to 3 bullets (narrower main column); single-column
 * keeps the full set. `maxBullets` overrides the bullet cap explicitly (e.g. Hero preview).
 */
/**
 * Sample resume content for template previews and new-from-template.
 * Full content (no trimming) — previews compress it to one page via fontScale.
 * Single-column → plain skill/language styling; two-column → tag/pill styling.
 */
export function sampleResumeData(opts: { single: boolean }): ResumeData {
  return opts.single
    ? { ...THUMB_DATA, skillsStyle: 'plain', languageStyle: 'plain' }
    : { ...THUMB_DATA, skillsStyle: 'tags', languageStyle: 'pills' }
}

export const THUMB_DATA_STUDENT: ResumeData = {
  ...DEMO_DATA,
  jobtitle: 'New Graduate',
  summary: 'Marketing new grad with solid data analysis and operations internship experience. Led several campus events, strong at cross-team communication, eager to grow in consumer/internet roles.',
  hasSummary: true,
  hasProject: true,
  hasLanguage: true,
  hasAward: true,
  hasCert: true,
  hasSkills: true,
  skills: ['Data Analysis', 'Excel/VBA', 'Python Basics', 'Photoshop', 'Copywriting', 'Notion', 'Project Management'],
  exp: [
    {
      id: 'e1',
      title: 'Marketing Operations Intern',
      sub: 'Xiaohongshu · Brand Partnerships',
      date: '2024.07 — 2024.12',
      bullets: [
        'Helped plan 3 brand collab campaigns with 2M+ total impressions',
        'Tracked daily metrics and produced weekly reports to optimize ad strategy',
        'Sourced and managed a 50+ influencer database',
      ],
    },
    {
      id: 'e2',
      title: 'Campus Ambassador',
      sub: 'NetEase Youdao · Campus Marketing',
      date: '2023.09 — 2024.06',
      bullets: [
        'Ran on-campus promotion, driving 300+ student sign-ups',
        'Organized online challenges; named Ambassador of the Year',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: 'B.A. in Marketing',
      sub: 'Renmin University of China',
      date: '2021 — 2025',
      bullets: ['GPA 3.7/4.0, scholarship three years running', 'Head of Student Union PR; led the campus paper redesign'],
    },
  ],
  project: [
    {
      id: 'p1',
      title: 'Campus Consumer Behavior Study',
      sub: 'Project Lead',
      date: '2024.03 — 2024.06',
      bullets: [
        'Designed surveys, collected 500+ valid responses, and cleaned the data',
        'Ran descriptive statistics in Python and produced a 15-page report',
        'Nominated for outstanding thesis at the department level',
      ],
    },
  ],
  award: [
    { id: 'aw1', title: 'National Scholarship', sub: 'Ministry of Education', date: '2023', bullets: [] },
    { id: 'aw2', title: 'Outstanding Student Leader', sub: 'Renmin University of China', date: '2024', bullets: [] },
  ],
  cert: [
    { id: 'cr1', title: 'TOEFL 105', sub: 'ETS', date: '2023', bullets: [] },
    { id: 'cr2', title: 'Google Analytics Certified', sub: 'Google', date: '2024', bullets: [] },
  ],
  language: [
    { id: 'ln1', title: 'English', sub: 'Professional', date: '', bullets: [] },
  ],
}

export const THUMB_DATA_FINANCE: ResumeData = {
  ...DEMO_DATA,
  jobtitle: 'Senior Financial Analyst',
  summary: '6 years in banking and securities focused on equity investment and M&A valuation. Led financial due diligence for multiple IPOs; strong DCF modeling and industry research; CFA Level III candidate.',
  hasSummary: false,
  hasProject: true,
  hasLanguage: true,
  hasAward: true,
  hasCert: true,
  hasSkills: true,
  skills: ['Financial Modeling', 'DCF Valuation', 'Bloomberg', 'Excel/VBA', 'Capital IQ', 'Python', 'Industry Research', 'Project Management'],
  exp: [
    {
      id: 'e1',
      title: 'Senior Equity Research Analyst',
      sub: 'CITIC Securities · Research',
      date: 'Jun 2021 — Present',
      bullets: [
        'Covered 15 listed consumer & retail companies, managing a portfolio worth over $400M',
        'Led financial due diligence for 3 IPOs and helped set pricing',
        'Authored in-depth industry reports; named Analyst of the Year (Consumer)',
      ],
    },
    {
      id: 'e2',
      title: 'Investment Analyst',
      sub: 'ICBC · Investment Banking',
      date: '2019.07 — 2021.05',
      bullets: [
        'Built valuation models for M&A deals, producing 20+ DCF / comparable-company analyses',
        'Prepared bond issuance roadshow materials and institutional pitches',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: 'M.S. in Finance',
      sub: 'Shanghai Jiao Tong University',
      date: '2017 — 2019',
      bullets: ['GPA 3.9/4.0, research focus: asset pricing and derivatives'],
    },
  ],
  project: [
    {
      id: 'p1',
      title: 'Consumer Leader M&A Valuation',
      sub: 'Project Lead',
      date: '2023.04 — 2023.10',
      bullets: [
        'Built a three-statement financial model with sensitivity analysis across 8 key assumptions',
        'Valued via EV/EBITDA and DCF and delivered final acquisition pricing recommendations',
        'Deal closed successfully with 4.9/5 client satisfaction',
      ],
    },
  ],
  award: [
    { id: 'aw1', title: 'Analyst of the Year', sub: 'CITIC Securities', date: '2023', bullets: [] },
  ],
  cert: [
    { id: 'cr1', title: 'CFA Level III', sub: 'CFA Institute', date: '2022', bullets: [] },
    { id: 'cr2', title: 'FRM Part II', sub: 'GARP', date: '2021', bullets: [] },
  ],
  language: [
    { id: 'ln1', title: 'English', sub: 'TOEFL 108 · Business fluent', date: '', bullets: [] },
  ],
}

export const THUMB_DATA_DESIGN: ResumeData = {
  ...DEMO_DATA,
  jobtitle: 'Senior UI/UX Designer',
  summary: '7 years of product design experience, owning everything from user research to interactive prototypes. Built the design system for an app with tens of millions of MAU and drove design-led conversion gains.',
  hasSummary: false,
  hasProject: true,
  hasLanguage: true,
  hasAward: true,
  hasCert: false,
  hasSkills: true,
  skills: ['Figma', 'Sketch', 'Principle', 'Photoshop', 'Illustrator', 'User Research', 'Design Systems', 'Motion Design'],
  exp: [
    {
      id: 'e1',
      title: 'Senior Interaction Designer',
      sub: 'Tencent · WeChat Group',
      date: 'Mar 2021 — Present',
      bullets: [
        'Owned end-to-end interaction design for creator tools reaching 120M users',
        'Built the creator-side design system, unifying 120+ components and boosting dev efficiency 30%',
        'Drove A/B testing adoption, lifting key-path conversion 18%',
      ],
    },
    {
      id: 'e2',
      title: 'UI/UX Designer',
      sub: 'NetEase · Yanxuan',
      date: '2018.07 — 2021.02',
      bullets: [
        'Contributed to the app 4.0 redesign, reworking product detail and cart interactions',
        'Led 20+ user research interviews and produced journey maps to guide decisions',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: 'B.A. in Visual Communication Design',
      sub: 'Central Academy of Fine Arts',
      date: '2014 — 2018',
      bullets: ['Graduation project won an award and was selected for the annual exhibition'],
    },
  ],
  project: [
    {
      id: 'p1',
      title: 'Creator Design System',
      sub: 'Design Lead',
      date: '2022.01 — 2022.12',
      bullets: [
        'Built a design token system and component library from scratch across mobile and web',
        'Partnered with engineering on handoff standards, improving cross-team delivery 35%',
        'The design system was recognized internally as an outstanding infrastructure project',
      ],
    },
  ],
  award: [
    { id: 'aw1', title: 'Red Dot Award · Winner', sub: 'Red Dot Design Award', date: '2023', bullets: [] },
    { id: 'aw2', title: 'Employee of the Year', sub: 'Tencent', date: '2022', bullets: [] },
  ],
  cert: [],
  language: [
    { id: 'ln1', title: 'English', sub: 'Fluent', date: '', bullets: [] },
  ],
}

export const THUMB_DATA_MANAGEMENT: ResumeData = {
  ...DEMO_DATA,
  jobtitle: 'Director of Operations',
  summary: '10 years of internet operations management, skilled at building high-performing teams from scratch and driving growth for business lines with $100M+ monthly GMV. Full P&L ownership and data-driven decision making.',
  hasSummary: false,
  hasProject: true,
  hasLanguage: false,
  hasAward: true,
  hasCert: false,
  hasSkills: true,
  skills: ['Team Management', 'Strategic Planning', 'P&L Management', 'Data Analysis', 'Project Management', 'Negotiation', 'OKR', 'Growth'],
  exp: [
    {
      id: 'e1',
      title: 'Director of User Growth',
      sub: 'JD.com · Retail',
      date: 'Sep 2020 — Present',
      bullets: [
        'Led a 45-person growth team and owned annual GMV target setting and execution',
        'Built a member operations system, raising annual retention from 62% to 81%',
        'Ran end-to-end operations for major sales events, hitting $45M single-day GMV in 2023',
      ],
    },
    {
      id: 'e2',
      title: 'Senior Operations Manager',
      sub: 'Pinduoduo · Subsidy Program',
      date: '2017.06 — 2020.08',
      bullets: [
        'Designed and ran subsidy strategy for electronics, managing a $20M annual budget',
        'Built and led a 12-person team, raising ROI to 3.8 through careful product selection',
        'Rolled out direct sourcing, cutting procurement costs 22%',
      ],
    },
  ],
  edu: [
    {
      id: 'd1',
      title: 'MBA',
      sub: 'Peking University, Guanghua School of Management',
      date: '2015 — 2017',
      bullets: [],
    },
  ],
  project: [
    {
      id: 'p1',
      title: 'Member Growth System',
      sub: 'Project Lead',
      date: '2021.01 — 2021.12',
      bullets: [
        'Built community operations SOPs from scratch, reaching 800k+ paying members',
        'Designed a points & perks system, shortening the repurchase cycle from 45 to 28 days',
        'Project won the group\'s annual best innovation award',
      ],
    },
  ],
  award: [
    { id: 'aw1', title: 'Manager of the Year', sub: 'JD.com', date: '2023', bullets: [] },
    { id: 'aw2', title: 'Outstanding Team Award', sub: 'Pinduoduo', date: '2019', bullets: [] },
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
