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
  photo: string  // base64 data URL or empty
  summary: string

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

export const THUMB_DATA: ResumeData = {
  ...DEMO_DATA,
  // For thumbnails — same data, just reused
}
