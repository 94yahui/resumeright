export type LayoutType =
  | 'single-classic'
  | 'single-centered'
  | 'sidebar-left-narrow'
  | 'sidebar-left-wide'
  | 'sidebar-right'
  | 'top-banner-photo'
  | 'two-column-balance'
  | 'header-card'

export type AccentStyle =
  | 'underline-bar'
  | 'left-bar'
  | 'side-icon'
  | 'background-pill'
  | 'thin-line'
  | 'double-line'
  | 'plain-bold'
  | 'triple-bar'
  | 'gradient-band'
  | 'flanked-line'
  | 'slash-prefix'
  | 'highlight-mark'

export type FontPair =
  | 'modern-sans'
  | 'serif-heading'
  | 'mono-accent'

export interface TemplateConfig {
  id: string
  name: string
  categories: string[]
  free: boolean
  layout: LayoutType
  accentStyle: AccentStyle
  accentColor: string
  fontPair: FontPair
  showPhoto: boolean
  /** For single-centered layouts: where the photo sits relative to the name block.
   *  Omit for the default (photo centered above name). */
  photoPlacement?: 'right' | 'left-beside' | 'band-right'
  tag: string
  desc: string
}

const _ALL_TEMPLATES: TemplateConfig[] = [

  // ========== 5 FREE TEMPLATES ==========
  {
    id: 'classic-pro',
    name: '经典专业',
    categories: ['general', 'finance'],
    free: true,
    layout: 'single-classic',
    accentStyle: 'underline-bar',
    accentColor: '#1e293b',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '简洁·通用·ATS',
    desc: '单栏下划线标题，ATS 友好，适合所有行业',
  },
  {
    id: 'navy-modern',
    name: '宽栏现代',
    categories: ['tech', 'finance'],
    free: true,
    layout: 'sidebar-left-wide',
    accentStyle: 'plain-bold',
    accentColor: '#1e3a8a',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '科技·金融·照片',
    desc: '左侧深色宽栏配头像，信息层次鲜明',
  },
  {
    id: 'minimal-line',
    name: '极简线条',
    categories: ['general', 'design'],
    free: true,
    layout: 'single-centered',
    accentStyle: 'thin-line',
    accentColor: '#0f172a',
    fontPair: 'serif-heading',
    showPhoto: false,
    tag: '极简·衬线·居中',
    desc: '居中衬线标题，细线分隔，优雅克制',
  },
  {
    id: 'teal-creative',
    name: '窄栏创意',
    categories: ['tech', 'design', 'general'],
    free: true,
    layout: 'sidebar-left-narrow',
    accentStyle: 'underline-bar',
    accentColor: '#0d9488',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '清新·侧栏·照片',
    desc: '左窄栏配头像，青绿点缀，现代清新',
  },
  {
    id: 'banner-warm',
    name: '横幅照片',
    categories: ['general'],
    free: true,
    layout: 'top-banner-photo',
    accentStyle: 'background-pill',
    accentColor: '#b45309',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '通用·横幅·照片',
    desc: '顶部彩色横幅带头像，胶囊式节标题',
  },

  // ── triple-bar variants (4) ──
  {
    id: 'pro-triple-classic',
    name: '三竖极简',
    categories: ['general', 'tech'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'triple-bar',
    accentColor: '#0f172a',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '极简·律动',
    desc: '三竖线由宽到细点缀标题，极简中带节奏感',
  },
  {
    id: 'pro-triple-narrow-photo',
    name: '三竖侧栏照片',
    categories: ['tech', 'design'],
    free: false,
    layout: 'sidebar-left-narrow',
    accentStyle: 'triple-bar',
    accentColor: '#1d4ed8',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '科技·设计·照片',
    desc: '左窄栏配头像与三竖线标题，现代律动感',
  },
  {
    id: 'pro-triple-card-serif',
    name: '三竖卡片衬线',
    categories: ['finance', 'general'],
    free: false,
    layout: 'header-card',
    accentStyle: 'triple-bar',
    accentColor: '#7f1d1d',
    fontPair: 'serif-heading',
    showPhoto: false,
    tag: '金融·咨询',
    desc: '头部卡片配衬线三竖线，沉稳而有层次',
  },
  {
    id: 'pro-triple-wide-photo',
    name: '三竖宽栏照片',
    categories: ['tech', 'general'],
    free: false,
    layout: 'sidebar-left-wide',
    accentStyle: 'triple-bar',
    accentColor: '#0d9488',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '全栈·管理·照片',
    desc: '深色宽栏配头像与三竖线标题，视觉层次丰富',
  },

  // ── gradient-band variants (4) ──
  {
    id: 'pro-gradient-classic',
    name: '渐变带单栏',
    categories: ['general', 'design'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'gradient-band',
    accentColor: '#6d28d9',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '设计·创意',
    desc: '全宽渐变色带衬托节标题，由深至浅优雅过渡',
  },
  {
    id: 'pro-gradient-narrow-photo',
    name: '渐变带侧栏照片',
    categories: ['design', 'tech'],
    free: false,
    layout: 'sidebar-left-narrow',
    accentStyle: 'gradient-band',
    accentColor: '#0891b2',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '设计·产品·照片',
    desc: '左窄栏配头像，渐变色带标题，清新现代',
  },
  {
    id: 'pro-gradient-card',
    name: '渐变带卡片',
    categories: ['general', 'tech'],
    free: false,
    layout: 'header-card',
    accentStyle: 'gradient-band',
    accentColor: '#ea580c',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '运营·市场',
    desc: '头部卡片配橙色渐变带，活力十足',
  },
  {
    id: 'pro-gradient-two-col',
    name: '渐变带双栏',
    categories: ['finance', 'general'],
    free: false,
    layout: 'two-column-balance',
    accentStyle: 'gradient-band',
    accentColor: '#1e3a8a',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '咨询·金融·照片',
    desc: '双栏平衡布局配衬线渐变带，精英沉稳气质',
  },

  // ========== 25 PRO TEMPLATES ==========
  // Each has a unique layout × accentStyle × fontPair combination

  // ── single-classic variants (4) ──
  {
    id: 'pro-classic-serif',
    name: '经典衬线',
    categories: ['finance', 'general'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'left-bar',
    accentColor: '#1e3a8a',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '金融·法律·照片',
    desc: '衬线标题配左侧竖条，正式传统感强',
  },
  {
    id: 'pro-classic-double',
    name: '双线分隔',
    categories: ['general', 'finance'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'double-line',
    accentColor: '#374151',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '商务·严谨',
    desc: '双线节分隔，布局工整，适合传统行业',
  },
  {
    id: 'pro-classic-pill',
    name: '胶囊标题',
    categories: ['tech', 'general'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'background-pill',
    accentColor: '#0d9488',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '科技·现代',
    desc: '节标题用底色胶囊，视觉跳跃感强',
  },
  {
    id: 'pro-classic-mono',
    name: '代码风格',
    categories: ['tech'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'side-icon',
    accentColor: '#16a34a',
    fontPair: 'mono-accent',
    showPhoto: false,
    tag: '开发·工程师',
    desc: '等宽字体配图标标题，开发者专属气质',
  },

  // ── sidebar-left-narrow variants (4) ──
  {
    id: 'pro-narrow-serif',
    name: '窄栏衬线',
    categories: ['finance', 'general'],
    free: false,
    layout: 'sidebar-left-narrow',
    accentStyle: 'left-bar',
    accentColor: '#92400e',
    fontPair: 'serif-heading',
    showPhoto: false,
    tag: '金融·咨询',
    desc: '左窄栏衬线字体，竖条标题，正式内敛',
  },
  {
    id: 'pro-narrow-pill',
    name: '窄栏胶囊',
    categories: ['tech', 'design'],
    free: false,
    layout: 'sidebar-left-narrow',
    accentStyle: 'background-pill',
    accentColor: '#3b82f6',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '科技·产品',
    desc: '左窄栏搭配胶囊节标题，活泼现代',
  },
  {
    id: 'pro-narrow-mono',
    name: '窄栏等宽',
    categories: ['tech'],
    free: false,
    layout: 'sidebar-left-narrow',
    accentStyle: 'plain-bold',
    accentColor: '#0c4a6e',
    fontPair: 'mono-accent',
    showPhoto: true,
    tag: '后端·架构',
    desc: '左窄栏等宽字体纯粗体，技术感十足',
  },
  {
    id: 'pro-narrow-double',
    name: '窄栏双线',
    categories: ['general', 'design'],
    free: false,
    layout: 'sidebar-left-narrow',
    accentStyle: 'double-line',
    accentColor: '#6d28d9',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '创意·通用',
    desc: '左窄栏配双线节标题，独特视觉节奏',
  },

  // ── sidebar-left-wide variants (3) ──
  {
    id: 'pro-wide-serif',
    name: '宽栏衬线',
    categories: ['finance', 'general'],
    free: false,
    layout: 'sidebar-left-wide',
    accentStyle: 'left-bar',
    accentColor: '#7f1d1d',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '高管·金融',
    desc: '深色宽栏配衬线字体，彰显资历与地位',
  },
  {
    id: 'pro-wide-icon',
    name: '宽栏图标',
    categories: ['tech'],
    free: false,
    layout: 'sidebar-left-wide',
    accentStyle: 'side-icon',
    accentColor: '#1e3a8a',
    fontPair: 'mono-accent',
    showPhoto: true,
    tag: '全栈·算法',
    desc: '宽栏侧边配图标等宽标题，工程师专属',
  },
  {
    id: 'pro-wide-double',
    name: '宽栏双线',
    categories: ['tech', 'general'],
    free: false,
    layout: 'sidebar-left-wide',
    accentStyle: 'double-line',
    accentColor: '#312e81',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '技术·管理',
    desc: '深色宽栏配双线节标题，结构感突出',
  },

  // ── sidebar-right variants (3) ──
  {
    id: 'pro-right-bar',
    name: '右栏竖条',
    categories: ['general', 'tech'],
    free: false,
    layout: 'sidebar-right',
    accentStyle: 'left-bar',
    accentColor: '#0f766e',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '通用·清爽',
    desc: '主内容居左，右侧辅助栏，左竖条标题',
  },
  {
    id: 'pro-right-serif',
    name: '右栏典雅',
    categories: ['design', 'general'],
    free: false,
    layout: 'sidebar-right',
    accentStyle: 'background-pill',
    accentColor: '#7c3aed',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '设计·艺术',
    desc: '右侧辅助栏配衬线胶囊标题，优雅创意',
  },
  {
    id: 'pro-right-thin',
    name: '右栏细线',
    categories: ['general', 'finance'],
    free: false,
    layout: 'sidebar-right',
    accentStyle: 'thin-line',
    accentColor: '#0f172a',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '简约·专业',
    desc: '右侧栏极细线分隔，克制而专业',
  },

  // ── top-banner-photo variants (2) ──
  {
    id: 'pro-banner-serif',
    name: '横幅衬线',
    categories: ['general', 'design'],
    free: false,
    layout: 'top-banner-photo',
    accentStyle: 'thin-line',
    accentColor: '#292524',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '人文·媒体',
    desc: '顶部横幅配衬线细线，黑白精致感',
  },
  {
    id: 'pro-banner-bar',
    name: '横幅竖条',
    categories: ['general'],
    free: false,
    layout: 'top-banner-photo',
    accentStyle: 'left-bar',
    accentColor: '#1d4ed8',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '通用·活力',
    desc: '顶部彩色横幅配左竖条节标题，层次清晰',
  },

  // ── two-column-balance variants (3) ──
  {
    id: 'pro-two-col-sans',
    name: '双栏商务',
    categories: ['general', 'finance'],
    free: false,
    layout: 'two-column-balance',
    accentStyle: 'underline-bar',
    accentColor: '#1e3a8a',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '商务·信息密集',
    desc: '左右双栏平衡排列，信息密度高',
  },
  {
    id: 'pro-two-col-serif',
    name: '双栏衬线',
    categories: ['finance', 'general'],
    free: false,
    layout: 'two-column-balance',
    accentStyle: 'left-bar',
    accentColor: '#374151',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '咨询·金融',
    desc: '双栏平衡配衬线左竖条，精英气质',
  },
  {
    id: 'pro-two-col-pill',
    name: '双栏胶囊',
    categories: ['tech', 'design'],
    free: false,
    layout: 'two-column-balance',
    accentStyle: 'background-pill',
    accentColor: '#ea580c',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '产品·运营',
    desc: '双栏平衡搭配胶囊标题，现代活力',
  },

  // ── header-card variants (4) ──
  {
    id: 'pro-card-minimal',
    name: '卡片极简',
    categories: ['general', 'design'],
    free: false,
    layout: 'header-card',
    accentStyle: 'thin-line',
    accentColor: '#0f172a',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '极简·留白',
    desc: '独立头部卡片配极细线，简洁留白',
  },
  {
    id: 'pro-card-serif',
    name: '卡片典雅',
    categories: ['finance', 'general'],
    free: false,
    layout: 'header-card',
    accentStyle: 'underline-bar',
    accentColor: '#1e3a8a',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '高管·律师',
    desc: '头部卡片配衬线下划线，沉稳典雅',
  },
  {
    id: 'pro-card-pill',
    name: '卡片活力',
    categories: ['general', 'tech'],
    free: false,
    layout: 'header-card',
    accentStyle: 'background-pill',
    accentColor: '#ec4899',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '市场·创意',
    desc: '头部卡片配彩色胶囊标题，个性鲜明',
  },
  {
    id: 'pro-card-mono',
    name: '卡片代码',
    categories: ['tech'],
    free: false,
    layout: 'header-card',
    accentStyle: 'side-icon',
    accentColor: '#16a34a',
    fontPair: 'mono-accent',
    showPhoto: false,
    tag: '全栈·DevOps',
    desc: '头部卡片配等宽图标标题，开发者专属',
  },

  // ── single-centered variants (2) ──
  {
    id: 'pro-centered-serif',
    name: '横版典雅',
    categories: ['design', 'general'],
    free: false,
    layout: 'single-centered',
    accentStyle: 'double-line',
    accentColor: '#1f2937',
    fontPair: 'serif-heading',
    showPhoto: true,
    photoPlacement: 'right',
    tag: '设计·学术',
    desc: '衬线字体配双线节标题，名字左对齐照片右侧，庄重典雅',
  },
  {
    id: 'pro-centered-pill',
    name: '居中胶囊',
    categories: ['general', 'tech'],
    free: false,
    layout: 'single-centered',
    accentStyle: 'background-pill',
    accentColor: '#0d9488',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '通用·现代',
    desc: '居中排列配胶囊节标题，简洁现代',
  },

  // ========== 30 MORE PRO TEMPLATES (reaching 60 total) ==========

  // ── single-classic (5 more) ──
  {
    id: 'pro-classic-thin',
    name: '单栏细线',
    categories: ['general', 'design'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'thin-line',
    accentColor: '#334155',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '极简·ATS',
    desc: '单栏极细分割线，留白舒适，高度 ATS 友好',
  },
  {
    id: 'pro-classic-serif-photo',
    name: '经典照片栏',
    categories: ['finance', 'general'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'underline-bar',
    accentColor: '#1a1a2e',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '金融·法律·照片',
    desc: '单栏衬线标题配头像，下划线节分隔，传统正式',
  },
  {
    id: 'pro-classic-bold-photo',
    name: '重磅单栏',
    categories: ['general', 'tech'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'plain-bold',
    accentColor: '#0f172a',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '简洁·有力',
    desc: '粗体标题无装饰，头像加持，干练直接',
  },
  {
    id: 'pro-classic-icon-serif',
    name: '图标衬线',
    categories: ['finance', 'general'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'side-icon',
    accentColor: '#7f1d1d',
    fontPair: 'serif-heading',
    showPhoto: false,
    tag: '管理·咨询',
    desc: '衬线字体配节边图标，传统而不老气',
  },
  {
    id: 'pro-classic-mono-bar',
    name: '工程竖条',
    categories: ['tech'],
    free: false,
    layout: 'single-classic',
    accentStyle: 'left-bar',
    accentColor: '#14532d',
    fontPair: 'mono-accent',
    showPhoto: false,
    tag: '后端·运维',
    desc: '等宽字体配绿色左竖条，CLI 风格工程师简历',
  },

  // ── single-centered (4 more) ──
  {
    id: 'pro-centered-photo',
    name: '照片名片',
    categories: ['general', 'design'],
    free: false,
    layout: 'single-centered',
    accentStyle: 'underline-bar',
    accentColor: '#0f172a',
    fontPair: 'modern-sans',
    showPhoto: true,
    photoPlacement: 'left-beside',
    tag: '设计·媒体·照片',
    desc: '照片与姓名并排居中，名片式布局，平衡感强',
  },
  {
    id: 'pro-centered-bar',
    name: '居中竖条',
    categories: ['general', 'finance'],
    free: false,
    layout: 'single-centered',
    accentStyle: 'left-bar',
    accentColor: '#1e3a8a',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '商务·简洁',
    desc: '居中排列配左侧竖条节标题，不对称美学',
  },
  {
    id: 'pro-centered-thin-photo',
    name: '通栏轻盈',
    categories: ['design', 'general'],
    free: false,
    layout: 'single-centered',
    accentStyle: 'thin-line',
    accentColor: '#374151',
    fontPair: 'modern-sans',
    showPhoto: true,
    photoPlacement: 'band-right',
    tag: '艺术·创意',
    desc: '淡色底栏居中排列，照片位于右侧，轻盈通透',
  },
  {
    id: 'pro-centered-bold',
    name: '居中粗体',
    categories: ['tech', 'general'],
    free: false,
    layout: 'single-centered',
    accentStyle: 'plain-bold',
    accentColor: '#0c4a6e',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '产品·运营',
    desc: '居中布局配纯粗体节标题，干净有力',
  },

  // ── sidebar-left-narrow (3 more) ──
  {
    id: 'pro-narrow-icon',
    name: '窄栏图标标题',
    categories: ['tech', 'design'],
    free: false,
    layout: 'sidebar-left-narrow',
    accentStyle: 'side-icon',
    accentColor: '#0f766e',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '产品·设计',
    desc: '左窄栏搭配侧边图标节标题，现代感强',
  },
  {
    id: 'pro-narrow-serif-photo',
    name: '窄栏典雅照片',
    categories: ['general', 'finance'],
    free: false,
    layout: 'sidebar-left-narrow',
    accentStyle: 'thin-line',
    accentColor: '#292524',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '人文·媒体',
    desc: '左窄栏衬线字体配头像细线，精致优雅',
  },
  {
    id: 'pro-narrow-tech',
    name: '窄栏代码风',
    categories: ['tech'],
    free: false,
    layout: 'sidebar-left-narrow',
    accentStyle: 'underline-bar',
    accentColor: '#1e3a8a',
    fontPair: 'mono-accent',
    showPhoto: false,
    tag: '前端·工程师',
    desc: '左窄栏等宽字体配下划线，开发者简约风',
  },

  // ── sidebar-left-wide (3 more) ──
  {
    id: 'pro-wide-sans',
    name: '宽栏简约',
    categories: ['general', 'tech'],
    free: false,
    layout: 'sidebar-left-wide',
    accentStyle: 'underline-bar',
    accentColor: '#0f172a',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '科技·通用',
    desc: '深色宽栏无照片下划线，聚焦内容密度',
  },
  {
    id: 'pro-wide-pill',
    name: '宽栏活力照片',
    categories: ['tech', 'design'],
    free: false,
    layout: 'sidebar-left-wide',
    accentStyle: 'background-pill',
    accentColor: '#0d9488',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '创业·产品',
    desc: '深色宽栏配胶囊节标题和头像，活力现代',
  },
  {
    id: 'pro-wide-serif-thin',
    name: '宽栏衬线细线',
    categories: ['finance', 'general'],
    free: false,
    layout: 'sidebar-left-wide',
    accentStyle: 'thin-line',
    accentColor: '#1a1a2e',
    fontPair: 'serif-heading',
    showPhoto: false,
    tag: '高管·学术',
    desc: '深色宽栏衬线字体配极细线分隔，沉稳内敛',
  },

  // ── sidebar-right (3 more) ──
  {
    id: 'pro-right-tech',
    name: '右栏科技',
    categories: ['tech'],
    free: false,
    layout: 'sidebar-right',
    accentStyle: 'side-icon',
    accentColor: '#0f766e',
    fontPair: 'mono-accent',
    showPhoto: false,
    tag: '算法·架构',
    desc: '右侧辅助栏配等宽图标节标题，技术感突出',
  },
  {
    id: 'pro-right-double',
    name: '右栏双线',
    categories: ['general', 'finance'],
    free: false,
    layout: 'sidebar-right',
    accentStyle: 'double-line',
    accentColor: '#1e3a8a',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '商务·条理清晰',
    desc: '右侧辅助栏配双线节标题，信息结构严谨',
  },
  {
    id: 'pro-right-serif-photo',
    name: '右栏衬线照片',
    categories: ['design', 'general'],
    free: false,
    layout: 'sidebar-right',
    accentStyle: 'underline-bar',
    accentColor: '#292524',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '设计·编辑',
    desc: '右侧辅助栏衬线下划线配头像，文艺气质',
  },

  // ── top-banner-photo (3 more) ──
  {
    id: 'pro-banner-double',
    name: '横幅双线',
    categories: ['general', 'tech'],
    free: false,
    layout: 'top-banner-photo',
    accentStyle: 'double-line',
    accentColor: '#1e3a8a',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '商务·层次感',
    desc: '顶部彩色横幅配双线节标题，商务层次清晰',
  },
  {
    id: 'pro-banner-tech',
    name: '横幅工程师',
    categories: ['tech'],
    free: false,
    layout: 'top-banner-photo',
    accentStyle: 'side-icon',
    accentColor: '#0f766e',
    fontPair: 'mono-accent',
    showPhoto: true,
    tag: '全栈·DevOps',
    desc: '横幅配等宽图标节标题，工程师气质十足',
  },
  {
    id: 'pro-banner-serif-classic',
    name: '横幅经典衬线',
    categories: ['finance', 'general'],
    free: false,
    layout: 'top-banner-photo',
    accentStyle: 'underline-bar',
    accentColor: '#1a1a2e',
    fontPair: 'serif-heading',
    showPhoto: true,
    tag: '金融·法律',
    desc: '深色横幅配衬线下划线，严肃专业',
  },

  // ── two-column-balance (4 more) ──
  {
    id: 'pro-two-col-thin',
    name: '双栏极简',
    categories: ['general', 'design'],
    free: false,
    layout: 'two-column-balance',
    accentStyle: 'thin-line',
    accentColor: '#374151',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '极简·留白',
    desc: '双栏平衡配极细分隔线，信息密集而不拥挤',
  },
  {
    id: 'pro-two-col-elegant',
    name: '双栏典雅',
    categories: ['finance', 'general'],
    free: false,
    layout: 'two-column-balance',
    accentStyle: 'double-line',
    accentColor: '#1f2937',
    fontPair: 'serif-heading',
    showPhoto: false,
    tag: '咨询·银行',
    desc: '双栏衬线配双线节标题，精英气质满满',
  },
  {
    id: 'pro-two-col-tech',
    name: '双栏工程',
    categories: ['tech'],
    free: false,
    layout: 'two-column-balance',
    accentStyle: 'side-icon',
    accentColor: '#0c4a6e',
    fontPair: 'mono-accent',
    showPhoto: false,
    tag: '全栈·数据',
    desc: '双栏等宽字体配图标节标题，工程师高密度简历',
  },
  {
    id: 'pro-two-col-bold-photo',
    name: '双栏重磅照片',
    categories: ['general', 'tech'],
    free: false,
    layout: 'two-column-balance',
    accentStyle: 'plain-bold',
    accentColor: '#0f172a',
    fontPair: 'modern-sans',
    showPhoto: true,
    tag: '管理·市场',
    desc: '双栏粗体节标题配头像，强势有力',
  },

  // ── header-card (5 more) ──
  {
    id: 'pro-card-bar',
    name: '卡片竖条',
    categories: ['general', 'tech'],
    free: false,
    layout: 'header-card',
    accentStyle: 'left-bar',
    accentColor: '#0f766e',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '清爽·结构感',
    desc: '头部卡片配左侧竖条节标题，清爽有条理',
  },
  {
    id: 'pro-card-double-serif',
    name: '卡片典雅双线',
    categories: ['finance', 'design'],
    free: false,
    layout: 'header-card',
    accentStyle: 'double-line',
    accentColor: '#1f2937',
    fontPair: 'serif-heading',
    showPhoto: false,
    tag: '学术·法律',
    desc: '头部卡片衬线字体配双线节标题，严谨典雅',
  },
  {
    id: 'pro-card-bold-mono',
    name: '卡片等宽重磅',
    categories: ['tech'],
    free: false,
    layout: 'header-card',
    accentStyle: 'plain-bold',
    accentColor: '#14532d',
    fontPair: 'mono-accent',
    showPhoto: true,
    tag: '后端·SRE',
    desc: '头部卡片等宽粗体配头像，硬核工程师专属',
  },
  {
    id: 'pro-card-tech-thin',
    name: '卡片科技细线',
    categories: ['tech', 'general'],
    free: false,
    layout: 'header-card',
    accentStyle: 'thin-line',
    accentColor: '#1e3a8a',
    fontPair: 'mono-accent',
    showPhoto: false,
    tag: '前端·产品',
    desc: '头部卡片等宽细线，科技感与极简的融合',
  },
  {
    id: 'pro-card-sans-classic',
    name: '卡片通用无照片',
    categories: ['general', 'finance'],
    free: false,
    layout: 'header-card',
    accentStyle: 'underline-bar',
    accentColor: '#334155',
    fontPair: 'modern-sans',
    showPhoto: false,
    tag: '通用·百搭',
    desc: '头部卡片无衬线下划线，百搭通用，ATS 友好',
  },

  // ══════════════════════════════════════════════════════════════
  // triple-bar × all layouts × all font pairs × photo variations
  // ══════════════════════════════════════════════════════════════

  // single-classic
  { id: 'pro-triple-cls-serif', name: '三竖单栏衬线', categories: ['finance', 'general'], free: false, layout: 'single-classic', accentStyle: 'triple-bar', accentColor: '#1e3a8a', fontPair: 'serif-heading', showPhoto: false, tag: '金融·律动', desc: '衬线字体配三竖线节标题，正式中透出律动感' },
  { id: 'pro-triple-cls-serif-ph', name: '三竖单栏衬线照片', categories: ['finance', 'general'], free: false, layout: 'single-classic', accentStyle: 'triple-bar', accentColor: '#7c3aed', fontPair: 'serif-heading', showPhoto: true, tag: '金融·照片', desc: '衬线三竖线配头像，沉稳而富有个性' },
  { id: 'pro-triple-cls-mono', name: '三竖单栏等宽', categories: ['tech'], free: false, layout: 'single-classic', accentStyle: 'triple-bar', accentColor: '#065f46', fontPair: 'mono-accent', showPhoto: false, tag: '开发·律动', desc: '等宽字体配三竖节标题，工程师专属律动感' },
  { id: 'pro-triple-cls-photo', name: '三竖单栏照片', categories: ['general', 'tech'], free: false, layout: 'single-classic', accentStyle: 'triple-bar', accentColor: '#374151', fontPair: 'modern-sans', showPhoto: true, tag: '通用·照片', desc: '单栏三竖配头像，百搭专业' },

  // single-centered
  { id: 'pro-triple-ctr-sans', name: '三竖居中', categories: ['design', 'general'], free: false, layout: 'single-centered', accentStyle: 'triple-bar', accentColor: '#0891b2', fontPair: 'modern-sans', showPhoto: false, tag: '设计·居中', desc: '居中排版配三竖节标题，现代感十足' },
  { id: 'pro-triple-ctr-photo', name: '三竖居中照片', categories: ['design', 'general'], free: false, layout: 'single-centered', accentStyle: 'triple-bar', accentColor: '#b45309', fontPair: 'modern-sans', showPhoto: true, photoPlacement: 'right', tag: '设计·照片', desc: '居中配头像与三竖标题，个性鲜明' },
  { id: 'pro-triple-ctr-serif', name: '三竖居中衬线', categories: ['design', 'finance'], free: false, layout: 'single-centered', accentStyle: 'triple-bar', accentColor: '#1e293b', fontPair: 'serif-heading', showPhoto: false, tag: '学术·设计', desc: '衬线居中排版配三竖节标题，典雅大气' },
  { id: 'pro-triple-ctr-serif-ph', name: '三竖居中衬线照片', categories: ['design', 'general'], free: false, layout: 'single-centered', accentStyle: 'triple-bar', accentColor: '#15803d', fontPair: 'serif-heading', showPhoto: true, photoPlacement: 'right', tag: '艺术·照片', desc: '衬线居中三竖配头像，文艺质感' },

  // sidebar-left-narrow
  { id: 'pro-triple-nrw-sans', name: '三竖窄栏', categories: ['general', 'tech'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'triple-bar', accentColor: '#0e7490', fontPair: 'modern-sans', showPhoto: false, tag: '通用·清爽', desc: '左窄栏无衬线三竖节标题，清爽专业' },
  { id: 'pro-triple-nrw-serif', name: '三竖窄栏衬线', categories: ['finance', 'general'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'triple-bar', accentColor: '#b91c1c', fontPair: 'serif-heading', showPhoto: false, tag: '咨询·正式', desc: '左窄栏衬线三竖，正式感强' },
  { id: 'pro-triple-nrw-serif-ph', name: '三竖窄栏衬线照片', categories: ['finance', 'general'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'triple-bar', accentColor: '#92400e', fontPair: 'serif-heading', showPhoto: true, tag: '法律·照片', desc: '左窄栏衬线三竖配头像，传统气质' },
  { id: 'pro-triple-nrw-mono', name: '三竖窄栏等宽', categories: ['tech'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'triple-bar', accentColor: '#4c1d95', fontPair: 'mono-accent', showPhoto: false, tag: '技术·代码', desc: '左窄栏等宽三竖节标题，极客风格' },
  { id: 'pro-triple-nrw-mono-ph', name: '三竖窄栏等宽照片', categories: ['tech'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'triple-bar', accentColor: '#14532d', fontPair: 'mono-accent', showPhoto: true, tag: '全栈·照片', desc: '左窄栏等宽三竖配头像，技术与个性兼具' },

  // sidebar-left-wide
  { id: 'pro-triple-wide-sans', name: '三竖宽栏', categories: ['general', 'tech'], free: false, layout: 'sidebar-left-wide', accentStyle: 'triple-bar', accentColor: '#1a1a2e', fontPair: 'modern-sans', showPhoto: false, tag: '科技·深色', desc: '深色宽栏无衬线三竖，沉稳大气' },
  { id: 'pro-triple-wide-serif', name: '三竖宽栏衬线', categories: ['finance', 'general'], free: false, layout: 'sidebar-left-wide', accentStyle: 'triple-bar', accentColor: '#9a1515', fontPair: 'serif-heading', showPhoto: false, tag: '高管·金融', desc: '宽栏衬线三竖，高管专属气质' },
  { id: 'pro-triple-wide-serif-ph', name: '三竖宽栏衬线照片', categories: ['finance', 'general'], free: false, layout: 'sidebar-left-wide', accentStyle: 'triple-bar', accentColor: '#312e81', fontPair: 'serif-heading', showPhoto: true, tag: '金融·照片', desc: '宽栏衬线三竖配头像，精英沉稳' },
  { id: 'pro-triple-wide-mono', name: '三竖宽栏等宽', categories: ['tech'], free: false, layout: 'sidebar-left-wide', accentStyle: 'triple-bar', accentColor: '#1e3a8a', fontPair: 'mono-accent', showPhoto: false, tag: '架构·工程', desc: '深色宽栏等宽三竖，架构师气质' },
  { id: 'pro-triple-wide-mono-ph', name: '三竖宽栏等宽照片', categories: ['tech'], free: false, layout: 'sidebar-left-wide', accentStyle: 'triple-bar', accentColor: '#0c4a6e', fontPair: 'mono-accent', showPhoto: true, tag: '后端·照片', desc: '宽栏等宽三竖配头像，工程师专属' },

  // sidebar-right
  { id: 'pro-triple-right-sans', name: '三竖右栏', categories: ['general', 'tech'], free: false, layout: 'sidebar-right', accentStyle: 'triple-bar', accentColor: '#1d4ed8', fontPair: 'modern-sans', showPhoto: false, tag: '通用·现代', desc: '右侧辅助栏配三竖节标题，布局新颖' },
  { id: 'pro-triple-right-photo', name: '三竖右栏照片', categories: ['general', 'tech'], free: false, layout: 'sidebar-right', accentStyle: 'triple-bar', accentColor: '#0d9488', fontPair: 'modern-sans', showPhoto: true, tag: '产品·照片', desc: '右栏三竖配头像，清新活力' },
  { id: 'pro-triple-right-serif', name: '三竖右栏衬线', categories: ['finance', 'general'], free: false, layout: 'sidebar-right', accentStyle: 'triple-bar', accentColor: '#3f3f46', fontPair: 'serif-heading', showPhoto: false, tag: '咨询·典雅', desc: '右栏衬线三竖，低调典雅' },
  { id: 'pro-triple-right-serif-ph', name: '三竖右栏衬线照片', categories: ['design', 'general'], free: false, layout: 'sidebar-right', accentStyle: 'triple-bar', accentColor: '#6d28d9', fontPair: 'serif-heading', showPhoto: true, tag: '设计·照片', desc: '右栏衬线三竖配头像，个性突出' },
  { id: 'pro-triple-right-mono', name: '三竖右栏等宽', categories: ['tech'], free: false, layout: 'sidebar-right', accentStyle: 'triple-bar', accentColor: '#374151', fontPair: 'mono-accent', showPhoto: false, tag: '全栈·极客', desc: '右栏等宽三竖，极客风格' },

  // top-banner-photo
  { id: 'pro-triple-banner-sans', name: '三竖横幅', categories: ['general', 'design'], free: false, layout: 'top-banner-photo', accentStyle: 'triple-bar', accentColor: '#1e293b', fontPair: 'modern-sans', showPhoto: true, tag: '通用·横幅', desc: '顶部横幅配三竖节标题，视觉冲击强' },
  { id: 'pro-triple-banner-serif', name: '三竖横幅衬线', categories: ['design', 'general'], free: false, layout: 'top-banner-photo', accentStyle: 'triple-bar', accentColor: '#7f1d1d', fontPair: 'serif-heading', showPhoto: true, tag: '人文·媒体', desc: '横幅衬线三竖，人文气息浓厚' },
  { id: 'pro-triple-banner-mono', name: '三竖横幅等宽', categories: ['tech'], free: false, layout: 'top-banner-photo', accentStyle: 'triple-bar', accentColor: '#0c4a6e', fontPair: 'mono-accent', showPhoto: true, tag: '技术·横幅', desc: '横幅等宽三竖，技术感与视觉冲击并存' },

  // two-column-balance
  { id: 'pro-triple-two-sans', name: '三竖双栏', categories: ['general', 'finance'], free: false, layout: 'two-column-balance', accentStyle: 'triple-bar', accentColor: '#334155', fontPair: 'modern-sans', showPhoto: false, tag: '信息密集·通用', desc: '双栏平衡配三竖节标题，信息密度高' },
  { id: 'pro-triple-two-photo', name: '三竖双栏照片', categories: ['general', 'tech'], free: false, layout: 'two-column-balance', accentStyle: 'triple-bar', accentColor: '#ea580c', fontPair: 'modern-sans', showPhoto: true, tag: '产品·运营', desc: '双栏三竖配头像，活力四射' },
  { id: 'pro-triple-two-serif', name: '三竖双栏衬线', categories: ['finance', 'general'], free: false, layout: 'two-column-balance', accentStyle: 'triple-bar', accentColor: '#1e3a8a', fontPair: 'serif-heading', showPhoto: false, tag: '咨询·金融', desc: '双栏衬线三竖，精英气质' },
  { id: 'pro-triple-two-mono', name: '三竖双栏等宽', categories: ['tech'], free: false, layout: 'two-column-balance', accentStyle: 'triple-bar', accentColor: '#16a34a', fontPair: 'mono-accent', showPhoto: false, tag: '工程·数据', desc: '双栏等宽三竖，代码工程师专属' },

  // header-card
  { id: 'pro-triple-card-sans', name: '三竖卡片', categories: ['general', 'design'], free: false, layout: 'header-card', accentStyle: 'triple-bar', accentColor: '#374151', fontPair: 'modern-sans', showPhoto: false, tag: '极简·通用', desc: '头部卡片三竖节标题，极简现代' },
  { id: 'pro-triple-card-photo', name: '三竖卡片照片', categories: ['general', 'tech'], free: false, layout: 'header-card', accentStyle: 'triple-bar', accentColor: '#7c3aed', fontPair: 'modern-sans', showPhoto: true, tag: '产品·照片', desc: '卡片三竖配头像，现代个性' },
  { id: 'pro-triple-card-serif-ph', name: '三竖卡片衬线照片', categories: ['finance', 'general'], free: false, layout: 'header-card', accentStyle: 'triple-bar', accentColor: '#1e3a8a', fontPair: 'serif-heading', showPhoto: true, tag: '高管·照片', desc: '卡片衬线三竖配头像，正式中带活力' },
  { id: 'pro-triple-card-mono', name: '三竖卡片等宽', categories: ['tech'], free: false, layout: 'header-card', accentStyle: 'triple-bar', accentColor: '#0891b2', fontPair: 'mono-accent', showPhoto: false, tag: '开发·DevOps', desc: '卡片等宽三竖，开发者专属风格' },

  // ══════════════════════════════════════════════════════════════
  // gradient-band × all layouts × all font pairs × photo variations
  // ══════════════════════════════════════════════════════════════

  // single-classic
  { id: 'pro-grad-cls-serif', name: '渐变单栏衬线', categories: ['finance', 'general'], free: false, layout: 'single-classic', accentStyle: 'gradient-band', accentColor: '#1e3a8a', fontPair: 'serif-heading', showPhoto: false, tag: '金融·典雅', desc: '衬线字体配全宽渐变带，沉稳典雅' },
  { id: 'pro-grad-cls-serif-ph', name: '渐变单栏衬线照片', categories: ['finance', 'general'], free: false, layout: 'single-classic', accentStyle: 'gradient-band', accentColor: '#7c3aed', fontPair: 'serif-heading', showPhoto: true, tag: '金融·照片', desc: '衬线渐变带配头像，正式与个性兼具' },
  { id: 'pro-grad-cls-mono', name: '渐变单栏等宽', categories: ['tech'], free: false, layout: 'single-classic', accentStyle: 'gradient-band', accentColor: '#065f46', fontPair: 'mono-accent', showPhoto: false, tag: '开发·渐变', desc: '等宽字体配渐变带节标题，技术美感' },
  { id: 'pro-grad-cls-photo', name: '渐变单栏照片', categories: ['general', 'tech'], free: false, layout: 'single-classic', accentStyle: 'gradient-band', accentColor: '#374151', fontPair: 'modern-sans', showPhoto: true, tag: '通用·照片', desc: '渐变带配头像，通用百搭' },

  // single-centered
  { id: 'pro-grad-ctr-sans', name: '渐变居中', categories: ['design', 'general'], free: false, layout: 'single-centered', accentStyle: 'gradient-band', accentColor: '#0891b2', fontPair: 'modern-sans', showPhoto: false, tag: '设计·渐变', desc: '居中排版配渐变带节标题，现代感十足' },
  { id: 'pro-grad-ctr-photo', name: '渐变居中照片', categories: ['design', 'general'], free: false, layout: 'single-centered', accentStyle: 'gradient-band', accentColor: '#b45309', fontPair: 'modern-sans', showPhoto: true, photoPlacement: 'right', tag: '创意·照片', desc: '居中渐变带配头像，创意设计感' },
  { id: 'pro-grad-ctr-serif', name: '渐变居中衬线', categories: ['design', 'finance'], free: false, layout: 'single-centered', accentStyle: 'gradient-band', accentColor: '#1e293b', fontPair: 'serif-heading', showPhoto: false, tag: '学术·典雅', desc: '衬线居中渐变带，学术典雅风格' },
  { id: 'pro-grad-ctr-serif-ph', name: '渐变居中衬线照片', categories: ['design', 'general'], free: false, layout: 'single-centered', accentStyle: 'gradient-band', accentColor: '#15803d', fontPair: 'serif-heading', showPhoto: true, photoPlacement: 'right', tag: '艺术·照片', desc: '衬线居中渐变带配头像，文艺质感' },

  // sidebar-left-narrow
  { id: 'pro-grad-nrw-sans', name: '渐变窄栏', categories: ['general', 'tech'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'gradient-band', accentColor: '#0e7490', fontPair: 'modern-sans', showPhoto: false, tag: '通用·现代', desc: '左窄栏渐变带节标题，清爽现代' },
  { id: 'pro-grad-nrw-serif', name: '渐变窄栏衬线', categories: ['finance', 'general'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'gradient-band', accentColor: '#b91c1c', fontPair: 'serif-heading', showPhoto: false, tag: '咨询·正式', desc: '左窄栏衬线渐变带，正式内敛' },
  { id: 'pro-grad-nrw-serif-ph', name: '渐变窄栏衬线照片', categories: ['finance', 'general'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'gradient-band', accentColor: '#92400e', fontPair: 'serif-heading', showPhoto: true, tag: '法律·照片', desc: '窄栏衬线渐变带配头像，传统专业' },
  { id: 'pro-grad-nrw-mono', name: '渐变窄栏等宽', categories: ['tech'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'gradient-band', accentColor: '#4c1d95', fontPair: 'mono-accent', showPhoto: false, tag: '技术·代码', desc: '左窄栏等宽渐变带，极客美学' },
  { id: 'pro-grad-nrw-mono-ph', name: '渐变窄栏等宽照片', categories: ['tech'], free: false, layout: 'sidebar-left-narrow', accentStyle: 'gradient-band', accentColor: '#134e4a', fontPair: 'mono-accent', showPhoto: true, tag: '全栈·照片', desc: '窄栏等宽渐变带配头像，技术感十足' },

  // sidebar-left-wide
  { id: 'pro-grad-wide-sans', name: '渐变宽栏', categories: ['general', 'tech'], free: false, layout: 'sidebar-left-wide', accentStyle: 'gradient-band', accentColor: '#1a1a2e', fontPair: 'modern-sans', showPhoto: false, tag: '科技·深色', desc: '深色宽栏渐变带节标题，沉稳大气' },
  { id: 'pro-grad-wide-photo', name: '渐变宽栏照片', categories: ['tech', 'general'], free: false, layout: 'sidebar-left-wide', accentStyle: 'gradient-band', accentColor: '#312e81', fontPair: 'modern-sans', showPhoto: true, tag: '全栈·照片', desc: '宽栏渐变带配头像，科技气质' },
  { id: 'pro-grad-wide-serif', name: '渐变宽栏衬线', categories: ['finance', 'general'], free: false, layout: 'sidebar-left-wide', accentStyle: 'gradient-band', accentColor: '#9a1515', fontPair: 'serif-heading', showPhoto: false, tag: '高管·金融', desc: '宽栏衬线渐变带，高管专属' },
  { id: 'pro-grad-wide-serif-ph', name: '渐变宽栏衬线照片', categories: ['finance', 'general'], free: false, layout: 'sidebar-left-wide', accentStyle: 'gradient-band', accentColor: '#1e3a8a', fontPair: 'serif-heading', showPhoto: true, tag: '精英·照片', desc: '宽栏衬线渐变带配头像，精英形象' },
  { id: 'pro-grad-wide-mono', name: '渐变宽栏等宽', categories: ['tech'], free: false, layout: 'sidebar-left-wide', accentStyle: 'gradient-band', accentColor: '#0c4a6e', fontPair: 'mono-accent', showPhoto: false, tag: '架构·工程', desc: '宽栏等宽渐变带，架构师专属' },

  // sidebar-right
  { id: 'pro-grad-right-sans', name: '渐变右栏', categories: ['general', 'tech'], free: false, layout: 'sidebar-right', accentStyle: 'gradient-band', accentColor: '#1d4ed8', fontPair: 'modern-sans', showPhoto: false, tag: '通用·现代', desc: '右侧辅助栏配渐变带节标题，布局新颖' },
  { id: 'pro-grad-right-photo', name: '渐变右栏照片', categories: ['general', 'tech'], free: false, layout: 'sidebar-right', accentStyle: 'gradient-band', accentColor: '#0d9488', fontPair: 'modern-sans', showPhoto: true, tag: '产品·照片', desc: '右栏渐变带配头像，清新现代' },
  { id: 'pro-grad-right-serif', name: '渐变右栏衬线', categories: ['finance', 'general'], free: false, layout: 'sidebar-right', accentStyle: 'gradient-band', accentColor: '#3f3f46', fontPair: 'serif-heading', showPhoto: false, tag: '咨询·典雅', desc: '右栏衬线渐变带，低调典雅' },
  { id: 'pro-grad-right-serif-ph', name: '渐变右栏衬线照片', categories: ['design', 'general'], free: false, layout: 'sidebar-right', accentStyle: 'gradient-band', accentColor: '#6d28d9', fontPair: 'serif-heading', showPhoto: true, tag: '设计·照片', desc: '右栏衬线渐变带配头像，个性突出' },
  { id: 'pro-grad-right-mono', name: '渐变右栏等宽', categories: ['tech'], free: false, layout: 'sidebar-right', accentStyle: 'gradient-band', accentColor: '#374151', fontPair: 'mono-accent', showPhoto: false, tag: '全栈·极客', desc: '右栏等宽渐变带，极客风格' },

  // top-banner-photo
  { id: 'pro-grad-banner-sans', name: '渐变横幅', categories: ['general', 'design'], free: false, layout: 'top-banner-photo', accentStyle: 'gradient-band', accentColor: '#1e293b', fontPair: 'modern-sans', showPhoto: true, tag: '通用·横幅', desc: '顶部横幅配渐变带节标题，视觉强劲' },
  { id: 'pro-grad-banner-serif', name: '渐变横幅衬线', categories: ['design', 'general'], free: false, layout: 'top-banner-photo', accentStyle: 'gradient-band', accentColor: '#7f1d1d', fontPair: 'serif-heading', showPhoto: true, tag: '人文·媒体', desc: '横幅衬线渐变带，人文气息浓厚' },
  { id: 'pro-grad-banner-mono', name: '渐变横幅等宽', categories: ['tech'], free: false, layout: 'top-banner-photo', accentStyle: 'gradient-band', accentColor: '#0c4a6e', fontPair: 'mono-accent', showPhoto: true, tag: '技术·横幅', desc: '横幅等宽渐变带，技术感强' },

  // two-column-balance
  { id: 'pro-grad-two-sans', name: '渐变双栏', categories: ['general', 'finance'], free: false, layout: 'two-column-balance', accentStyle: 'gradient-band', accentColor: '#334155', fontPair: 'modern-sans', showPhoto: false, tag: '信息密集·通用', desc: '双栏渐变带节标题，信息清晰有序' },
  { id: 'pro-grad-two-photo', name: '渐变双栏照片', categories: ['general', 'tech'], free: false, layout: 'two-column-balance', accentStyle: 'gradient-band', accentColor: '#ea580c', fontPair: 'modern-sans', showPhoto: true, tag: '产品·运营', desc: '双栏渐变带配头像，活力饱满' },
  { id: 'pro-grad-two-mono', name: '渐变双栏等宽', categories: ['tech'], free: false, layout: 'two-column-balance', accentStyle: 'gradient-band', accentColor: '#16a34a', fontPair: 'mono-accent', showPhoto: false, tag: '工程·数据', desc: '双栏等宽渐变带，工程数据专属' },

  // header-card
  { id: 'pro-grad-card-serif', name: '渐变卡片衬线', categories: ['finance', 'general'], free: false, layout: 'header-card', accentStyle: 'gradient-band', accentColor: '#1e293b', fontPair: 'serif-heading', showPhoto: false, tag: '高管·典雅', desc: '头部卡片衬线渐变带，高管专属' },
  { id: 'pro-grad-card-serif-ph', name: '渐变卡片衬线照片', categories: ['finance', 'general'], free: false, layout: 'header-card', accentStyle: 'gradient-band', accentColor: '#1e3a8a', fontPair: 'serif-heading', showPhoto: true, tag: '律师·照片', desc: '卡片衬线渐变带配头像，沉稳专业' },
  { id: 'pro-grad-card-mono', name: '渐变卡片等宽', categories: ['tech'], free: false, layout: 'header-card', accentStyle: 'gradient-band', accentColor: '#0891b2', fontPair: 'mono-accent', showPhoto: false, tag: '开发·DevOps', desc: '卡片等宽渐变带，开发者专属' },
  { id: 'pro-grad-card-photo', name: '渐变卡片照片', categories: ['general', 'tech'], free: false, layout: 'header-card', accentStyle: 'gradient-band', accentColor: '#7c3aed', fontPair: 'modern-sans', showPhoto: true, tag: '市场·创意', desc: '卡片渐变带配头像，活力个性' },

  // ══════════════════════════════════════════════════════════════
  // flanked-line (双侧横线) — 8 variants across all layouts
  // ══════════════════════════════════════════════════════════════
  { id: 'pro-flanked-cls-sans',      name: '双侧线单栏',      categories: ['general', 'finance'], free: false, layout: 'single-classic',       accentStyle: 'flanked-line', accentColor: '#1e293b', fontPair: 'modern-sans',   showPhoto: false, tag: '简洁·通用·ATS',   desc: '双侧横线居中节标题，优雅通透，高度 ATS 友好' },
  { id: 'pro-flanked-cls-serif',     name: '双侧线衬线',      categories: ['finance', 'general'], free: false, layout: 'single-classic',       accentStyle: 'flanked-line', accentColor: '#1e3a8a', fontPair: 'serif-heading', showPhoto: false, tag: '金融·学术',       desc: '衬线字体配双侧横线节标题，传统典雅气质' },
  { id: 'pro-flanked-cls-serif-ph',  name: '双侧线衬线照片',  categories: ['finance', 'general'], free: false, layout: 'single-classic',       accentStyle: 'flanked-line', accentColor: '#292524', fontPair: 'serif-heading', showPhoto: true,  tag: '法律·照片',       desc: '衬线双侧横线配头像，正式庄重' },
  { id: 'pro-flanked-nrw-photo',     name: '双侧线侧栏照片',  categories: ['general', 'design'],  free: false, layout: 'sidebar-left-narrow',  accentStyle: 'flanked-line', accentColor: '#0f766e', fontPair: 'modern-sans',   showPhoto: true,  tag: '通用·设计·照片', desc: '左窄栏配头像与双侧横线节标题，清新对称' },
  { id: 'pro-flanked-wide-photo',    name: '双侧线宽栏照片',  categories: ['general', 'tech'],    free: false, layout: 'sidebar-left-wide',    accentStyle: 'flanked-line', accentColor: '#1e3a8a', fontPair: 'modern-sans',   showPhoto: true,  tag: '科技·照片',       desc: '深色宽栏配头像与双侧横线，层次丰富' },
  { id: 'pro-flanked-card-serif',    name: '双侧线卡片衬线',  categories: ['finance', 'general'], free: false, layout: 'header-card',          accentStyle: 'flanked-line', accentColor: '#1f2937', fontPair: 'serif-heading', showPhoto: false, tag: '咨询·高管',       desc: '头部卡片配衬线双侧横线，精英气质' },
  { id: 'pro-flanked-two-col',       name: '双侧线双栏',      categories: ['general', 'finance'], free: false, layout: 'two-column-balance',   accentStyle: 'flanked-line', accentColor: '#334155', fontPair: 'modern-sans',   showPhoto: false, tag: '信息密集·商务',   desc: '双栏平衡配双侧横线节标题，工整严谨' },
  { id: 'pro-flanked-ctr-serif',     name: '双侧线居中衬线',  categories: ['design', 'general'],  free: false, layout: 'single-centered',      accentStyle: 'flanked-line', accentColor: '#374151', fontPair: 'serif-heading', showPhoto: false, tag: '设计·艺术',       desc: '居中衬线排版配双侧横线，文艺大气' },
  { id: 'pro-flanked-right',         name: '双侧线右栏',      categories: ['general', 'tech'],    free: false, layout: 'sidebar-right',        accentStyle: 'flanked-line', accentColor: '#0c4a6e', fontPair: 'modern-sans',   showPhoto: false, tag: '通用·清爽',       desc: '右侧辅助栏配双侧横线节标题，布局独特清爽' },
  { id: 'pro-flanked-banner',        name: '双侧线横幅',      categories: ['general', 'design'],  free: false, layout: 'top-banner-photo',     accentStyle: 'flanked-line', accentColor: '#1e293b', fontPair: 'modern-sans',   showPhoto: true,  tag: '通用·横幅·照片', desc: '顶部横幅配双侧横线节标题，视觉层次感强' },

  // ══════════════════════════════════════════════════════════════
  // slash-prefix (斜杠前缀) — 8 variants across all layouts
  // ══════════════════════════════════════════════════════════════
  { id: 'pro-slash-cls-mono',        name: '斜杠单栏',        categories: ['tech'],               free: false, layout: 'single-classic',       accentStyle: 'slash-prefix', accentColor: '#14532d', fontPair: 'mono-accent',   showPhoto: false, tag: '开发·工程师',     desc: '等宽字体配斜杠前缀节标题，代码注释风格' },
  { id: 'pro-slash-cls-sans',        name: '斜杠单栏简约',    categories: ['tech', 'general'],    free: false, layout: 'single-classic',       accentStyle: 'slash-prefix', accentColor: '#1e293b', fontPair: 'modern-sans',   showPhoto: false, tag: '简约·极简',       desc: '无衬线斜杠前缀，简约现代，个性感强' },
  { id: 'pro-slash-cls-mono-ph',     name: '斜杠单栏照片',    categories: ['tech'],               free: false, layout: 'single-classic',       accentStyle: 'slash-prefix', accentColor: '#0c4a6e', fontPair: 'mono-accent',   showPhoto: true,  tag: '技术·照片',       desc: '等宽斜杠配头像，工程师个性简历' },
  { id: 'pro-slash-nrw-mono',        name: '斜杠窄栏',        categories: ['tech'],               free: false, layout: 'sidebar-left-narrow',  accentStyle: 'slash-prefix', accentColor: '#4c1d95', fontPair: 'mono-accent',   showPhoto: false, tag: '后端·极客',       desc: '左窄栏等宽斜杠前缀，极客代码风' },
  { id: 'pro-slash-wide-mono',       name: '斜杠宽栏',        categories: ['tech'],               free: false, layout: 'sidebar-left-wide',    accentStyle: 'slash-prefix', accentColor: '#1e3a8a', fontPair: 'mono-accent',   showPhoto: true,  tag: '全栈·架构·照片', desc: '深色宽栏等宽斜杠配头像，工程师专属' },
  { id: 'pro-slash-card',            name: '斜杠卡片',        categories: ['tech', 'general'],    free: false, layout: 'header-card',          accentStyle: 'slash-prefix', accentColor: '#16a34a', fontPair: 'modern-sans',   showPhoto: false, tag: '科技·清爽',       desc: '头部卡片配斜杠节标题，技术感与整洁感并存' },
  { id: 'pro-slash-two-col',         name: '斜杠双栏',        categories: ['tech', 'general'],    free: false, layout: 'two-column-balance',   accentStyle: 'slash-prefix', accentColor: '#0891b2', fontPair: 'modern-sans',   showPhoto: true,  tag: '产品·工程·照片', desc: '双栏斜杠配头像，高信息密度个性简历' },
  { id: 'pro-slash-right-mono',      name: '斜杠右栏',        categories: ['tech'],               free: false, layout: 'sidebar-right',        accentStyle: 'slash-prefix', accentColor: '#374151', fontPair: 'mono-accent',   showPhoto: false, tag: '全栈·算法',       desc: '右侧辅助栏配等宽斜杠节标题，极客风格' },
  { id: 'pro-slash-banner',          name: '斜杠横幅',        categories: ['tech', 'general'],    free: false, layout: 'top-banner-photo',     accentStyle: 'slash-prefix', accentColor: '#0f766e', fontPair: 'modern-sans',   showPhoto: true,  tag: 'DevOps·横幅',    desc: '横幅斜杠节标题，技术感与视觉冲击兼备' },
  { id: 'pro-slash-ctr-mono',        name: '斜杠居中',        categories: ['tech', 'design'],     free: false, layout: 'single-centered',      accentStyle: 'slash-prefix', accentColor: '#065f46', fontPair: 'mono-accent',   showPhoto: false, tag: '设计·极简',       desc: '居中排版配等宽斜杠，个性与简洁并重' },

  // ══════════════════════════════════════════════════════════════
  // highlight-mark (荧光划线) — 8 variants across all layouts
  // ══════════════════════════════════════════════════════════════
  { id: 'pro-hl-cls-sans',           name: '荧光单栏',        categories: ['general', 'design'],  free: false, layout: 'single-classic',       accentStyle: 'highlight-mark', accentColor: '#0d9488', fontPair: 'modern-sans',   showPhoto: false, tag: '通用·活力',       desc: '主题色荧光衬底节标题，视觉焦点突出' },
  { id: 'pro-hl-cls-serif',          name: '荧光衬线',        categories: ['finance', 'general'], free: false, layout: 'single-classic',       accentStyle: 'highlight-mark', accentColor: '#7c3aed', fontPair: 'serif-heading', showPhoto: false, tag: '咨询·设计',       desc: '衬线字体配荧光底衬，典雅中透出个性' },
  { id: 'pro-hl-cls-serif-ph',       name: '荧光衬线照片',    categories: ['general', 'design'],  free: false, layout: 'single-classic',       accentStyle: 'highlight-mark', accentColor: '#b45309', fontPair: 'serif-heading', showPhoto: true,  tag: '媒体·照片',       desc: '衬线荧光配头像，人文温暖气息' },
  { id: 'pro-hl-nrw-photo',          name: '荧光窄栏照片',    categories: ['general', 'design'],  free: false, layout: 'sidebar-left-narrow',  accentStyle: 'highlight-mark', accentColor: '#ec4899', fontPair: 'modern-sans',   showPhoto: true,  tag: '设计·市场·照片', desc: '左窄栏配头像与荧光节标题，时尚个性' },
  { id: 'pro-hl-wide-sans',          name: '荧光宽栏',        categories: ['general', 'tech'],    free: false, layout: 'sidebar-left-wide',    accentStyle: 'highlight-mark', accentColor: '#1d4ed8', fontPair: 'modern-sans',   showPhoto: false, tag: '科技·管理',       desc: '深色宽栏配荧光节标题，视觉层次鲜明' },
  { id: 'pro-hl-card-photo',         name: '荧光卡片照片',    categories: ['general', 'design'],  free: false, layout: 'header-card',          accentStyle: 'highlight-mark', accentColor: '#ea580c', fontPair: 'modern-sans',   showPhoto: true,  tag: '创意·运营·照片', desc: '头部卡片配荧光节标题和头像，活力四射' },
  { id: 'pro-hl-two-col',            name: '荧光双栏',        categories: ['general', 'finance'], free: false, layout: 'two-column-balance',   accentStyle: 'highlight-mark', accentColor: '#0f172a', fontPair: 'modern-sans',   showPhoto: false, tag: '商务·信息密集',   desc: '双栏平衡配荧光节标题，信息密度高且醒目' },
  { id: 'pro-hl-right',              name: '荧光右栏',        categories: ['general', 'design'],  free: false, layout: 'sidebar-right',        accentStyle: 'highlight-mark', accentColor: '#6d28d9', fontPair: 'modern-sans',   showPhoto: false, tag: '创意·通用',       desc: '右侧辅助栏配荧光节标题，布局新颖醒目' },
  { id: 'pro-hl-banner',             name: '荧光横幅',        categories: ['general', 'design'],  free: false, layout: 'top-banner-photo',     accentStyle: 'highlight-mark', accentColor: '#0891b2', fontPair: 'modern-sans',   showPhoto: true,  tag: '市场·横幅·照片', desc: '横幅配荧光节标题，冲击力与识别度并存' },
  { id: 'pro-hl-ctr-serif',          name: '荧光居中衬线',    categories: ['design', 'general'],  free: false, layout: 'single-centered',      accentStyle: 'highlight-mark', accentColor: '#15803d', fontPair: 'serif-heading', showPhoto: false, tag: '艺术·学术',       desc: '居中衬线排版配荧光底衬，文艺雅致' },
]

// Deterministic Fisher-Yates shuffle with a fixed LCG seed so order is stable across builds
function _seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  let s = seed >>> 0
  for (let i = result.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function _buildTemplates(arr: TemplateConfig[]): TemplateConfig[] {
  const free = arr.filter(t => t.free)
  const pro = _seededShuffle(arr.filter(t => !t.free), 0x4A1B9F3E)
  return [...free, ...pro]
}

export const TEMPLATES: TemplateConfig[] = _buildTemplates(_ALL_TEMPLATES)
export const FREE_TEMPLATES = TEMPLATES.filter(t => t.free)
export const PRO_TEMPLATES = TEMPLATES.filter(t => !t.free)

export const CATEGORIES = ['通用', '科技', '设计', '金融', '全部']
export const CATEGORY_MAP: Record<string, string> = {
  '全部': 'all', '科技': 'tech', '设计': 'design', '金融': 'finance', '通用': 'general',
}

export function getTemplate(id: string): TemplateConfig {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
}
