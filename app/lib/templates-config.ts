export type LayoutType =
  | 'single-classic'
  | 'single-centered'
  | 'sidebar-left-narrow'
  | 'sidebar-left-wide'
  | 'sidebar-right'
  | 'top-banner-photo'
  | 'two-column-balance'
  | 'header-card'
  | 'linkedin-banner'
  | 'namecard-header'
  | 'diagonal-photo'
  | 'accent-stripe'
  | 'bottom-strip'
  | 'timeline-rail'
  | 'editorial'
  | 'section-cards'
  | 'hanging-headings'
  | 'top-band'


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
  | 'arrow-trio'

export type FontPair =
  | 'modern-sans'
  | 'serif-heading'
  | 'mono-accent'

// Full list of heading (section-title) styles — shown in the editor's style tab and
// the landing-page heading-style picker.
export const ACCENT_STYLES: { value: AccentStyle; label: string }[] = [
  { value: 'underline-bar', label: 'Underline' },
  { value: 'left-bar', label: 'Left bar' },
  { value: 'side-icon', label: 'Dot & line' },
  { value: 'background-pill', label: 'Pill' },
  { value: 'thin-line', label: 'Thin line' },
  { value: 'double-line', label: 'Double line' },
  { value: 'triple-bar', label: 'Gradient bars' },
  { value: 'arrow-trio', label: 'Fading arrows' },
  { value: 'gradient-band', label: 'Gradient band' },
  { value: 'flanked-line', label: 'Flanking lines' },
  { value: 'slash-prefix', label: 'Slash prefix' },
  { value: 'highlight-mark', label: 'Highlight' },
  { value: 'plain-bold', label: 'Bold plain' },
]

// Accent color presets shown in the editor + landing color pickers.
// All are dark/saturated enough to keep strong contrast on a white resume.
export const ACCENT_COLOR_PRESETS: string[] = [
  '#0f172a', // ink / near-black
  '#334155', // slate
  '#1e3a8a', // navy
  '#1d4ed8', // royal blue
  '#0f766e', // teal
  '#0e7490', // deep cyan
  '#166534', // forest green
  '#9f1239', // burgundy
  '#b91c1c', // classic red
  '#6d28d9', // violet
]

// Runtime list of every AccentStyle — used to validate untrusted input (e.g. URL params).
export const VALID_ACCENT_STYLES: readonly AccentStyle[] = [
  'underline-bar', 'left-bar', 'side-icon', 'background-pill', 'thin-line',
  'double-line', 'plain-bold', 'triple-bar', 'gradient-band', 'flanked-line',
  'slash-prefix', 'highlight-mark', 'arrow-trio',
]

export interface TemplateConfig {
  id: string
  free: boolean
  layout: LayoutType
  accentStyle: AccentStyle
  accentColor: string
  fontPair: FontPair
  showPhoto: boolean
  /** For single-centered layouts: where the photo sits relative to the name block.
   *  Omit for the default (photo centered above name). */
  photoPlacement?: 'right' | 'left-beside' | 'band-right' | 'large-center'
}

// One representative per layout, split into with-photo / no-photo variants where the
// layout supports both. Permutations of font/accent are no longer surfaced as separate
// templates — the editor lets users change font, accent, and color on any template.
export const TEMPLATES: TemplateConfig[] = [
  // ── top-banner-photo (default) ──
  { id: 'banner-warm', free: true, layout: 'top-banner-photo', accentStyle: 'background-pill', accentColor: '#334155', fontPair: 'modern-sans', showPhoto: true },

  // ── single-classic ──
  { id: 'classic-pro', free: true, layout: 'single-classic', accentStyle: 'underline-bar', accentColor: '#1e293b', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-classic-bold-photo', free: true, layout: 'single-classic', accentStyle: 'plain-bold', accentColor: '#0f172a', fontPair: 'modern-sans', showPhoto: true },

  // ── single-centered ──
  { id: 'minimal-line', free: true, layout: 'single-centered', accentStyle: 'thin-line', accentColor: '#0f172a', fontPair: 'serif-heading', showPhoto: false },
  { id: 'pro-centered-photo', free: true, layout: 'single-centered', accentStyle: 'underline-bar', accentColor: '#0f172a', fontPair: 'modern-sans', showPhoto: true, photoPlacement: 'left-beside' },

  // ── sidebar-left-narrow ──
  { id: 'pro-narrow-serif', free: true, layout: 'sidebar-left-narrow', accentStyle: 'left-bar', accentColor: '#9f1239', fontPair: 'serif-heading', showPhoto: false },
  { id: 'teal-creative', free: true, layout: 'sidebar-left-narrow', accentStyle: 'underline-bar', accentColor: '#0d9488', fontPair: 'modern-sans', showPhoto: true },

  // ── sidebar-left-wide ──
  { id: 'pro-wide-sans', free: true, layout: 'sidebar-left-wide', accentStyle: 'underline-bar', accentColor: '#0f172a', fontPair: 'modern-sans', showPhoto: false },
  { id: 'navy-modern', free: true, layout: 'sidebar-left-wide', accentStyle: 'plain-bold', accentColor: '#1e3a8a', fontPair: 'modern-sans', showPhoto: true },

  // ── sidebar-right ──
  { id: 'pro-right-bar', free: true, layout: 'sidebar-right', accentStyle: 'left-bar', accentColor: '#0f766e', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-right-thin', free: true, layout: 'sidebar-right', accentStyle: 'thin-line', accentColor: '#0f172a', fontPair: 'modern-sans', showPhoto: true },

  // ── two-column-balance ──
  { id: 'pro-two-col-sans', free: true, layout: 'two-column-balance', accentStyle: 'underline-bar', accentColor: '#1e3a8a', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-two-col-serif', free: true, layout: 'two-column-balance', accentStyle: 'left-bar', accentColor: '#155e75', fontPair: 'serif-heading', showPhoto: true },

  // ── header-card ──
  { id: 'pro-card-minimal', free: true, layout: 'header-card', accentStyle: 'thin-line', accentColor: '#0f172a', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-card-pill', free: true, layout: 'header-card', accentStyle: 'background-pill', accentColor: '#4f46e5', fontPair: 'modern-sans', showPhoto: true },

  // ── accent-stripe ──
  { id: 'pro-stripe-teal', free: true, layout: 'accent-stripe', accentStyle: 'underline-bar', accentColor: '#0f766e', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-stripe-photo', free: true, layout: 'accent-stripe', accentStyle: 'left-bar', accentColor: '#6d28d9', fontPair: 'modern-sans', showPhoto: true },

  // ── bottom-strip ──
  { id: 'pro-bottom-navy', free: true, layout: 'bottom-strip', accentStyle: 'underline-bar', accentColor: '#1e3a8a', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-bottom-photo', free: true, layout: 'bottom-strip', accentStyle: 'underline-bar', accentColor: '#1e293b', fontPair: 'modern-sans', showPhoto: true },

  // ── photo-forward single layouts ──
  { id: 'pro-linkedin-blue', free: true, layout: 'linkedin-banner', accentStyle: 'left-bar', accentColor: '#0a66c2', fontPair: 'modern-sans', showPhoto: true },
  { id: 'pro-namecard-slate', free: true, layout: 'namecard-header', accentStyle: 'thin-line', accentColor: '#334155', fontPair: 'modern-sans', showPhoto: true },
  { id: 'pro-diagonal-navy', free: true, layout: 'diagonal-photo', accentStyle: 'left-bar', accentColor: '#0e7490', fontPair: 'modern-sans', showPhoto: true },

  // ── timeline-rail (left rail + dot per section) ──
  { id: 'pro-timeline', free: true, layout: 'timeline-rail', accentStyle: 'plain-bold', accentColor: '#0f766e', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-timeline-photo', free: true, layout: 'timeline-rail', accentStyle: 'plain-bold', accentColor: '#1e3a8a', fontPair: 'modern-sans', showPhoto: true },

  // ── editorial (centered serif masthead) ──
  { id: 'pro-editorial', free: true, layout: 'editorial', accentStyle: 'plain-bold', accentColor: '#1e293b', fontPair: 'serif-heading', showPhoto: false },
  { id: 'pro-editorial-photo', free: true, layout: 'editorial', accentStyle: 'plain-bold', accentColor: '#9f1239', fontPair: 'serif-heading', showPhoto: true },

  // ── section-cards (each section in a soft card) ──
  { id: 'pro-cards', free: true, layout: 'section-cards', accentStyle: 'underline-bar', accentColor: '#4f46e5', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-cards-photo', free: true, layout: 'section-cards', accentStyle: 'underline-bar', accentColor: '#0e7490', fontPair: 'modern-sans', showPhoto: true },

  // ── hanging-headings (section label in left gutter) ──
  { id: 'pro-hanging', free: true, layout: 'hanging-headings', accentStyle: 'underline-bar', accentColor: '#334155', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-hanging-photo', free: true, layout: 'hanging-headings', accentStyle: 'underline-bar', accentColor: '#1e3a8a', fontPair: 'modern-sans', showPhoto: true },

  // ── top-band (two-tier color masthead) ──
  { id: 'pro-band', free: true, layout: 'top-band', accentStyle: 'underline-bar', accentColor: '#1e293b', fontPair: 'modern-sans', showPhoto: false },
  { id: 'pro-band-photo', free: true, layout: 'top-band', accentStyle: 'underline-bar', accentColor: '#0a66c2', fontPair: 'modern-sans', showPhoto: true },
]

export function getTemplate(id: string): TemplateConfig {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
}

const SINGLE_COLUMN_LAYOUTS = new Set<LayoutType>([
  'single-classic', 'single-centered', 'top-banner-photo', 'header-card',
  'accent-stripe', 'bottom-strip', 'namecard-header', 'linkedin-banner', 'diagonal-photo',
  'timeline-rail', 'editorial', 'section-cards', 'hanging-headings', 'top-band',
])

export function isSingleColumn(layout: LayoutType): boolean {
  return SINGLE_COLUMN_LAYOUTS.has(layout)
}

// Newer single-column layouts to surface near the front of the no-photo group.
const FEATURED_NEW_LAYOUTS = new Set<LayoutType>(['timeline-rail', 'editorial', 'section-cards', 'hanging-headings', 'top-band'])

// Default display order (landing library + editor tab): single-column no-photo first
// (North-American resumes are usually photo-free), then single-column with-photo,
// then everything else (two-column variants). Within no-photo: keep the classic default
// first, then the new featured layouts, then the rest. Stable within each group.
function _orderRank(t: TemplateConfig): number {
  const single = SINGLE_COLUMN_LAYOUTS.has(t.layout)
  if (single && !t.showPhoto) {
    if (t.id === 'classic-pro') return 0
    if (FEATURED_NEW_LAYOUTS.has(t.layout)) return 1
    return 2
  }
  if (single && t.showPhoto) return 3
  return 4
}
export const ORDERED_TEMPLATES: TemplateConfig[] = TEMPLATES
  .map((t, i) => ({ t, i }))
  .sort((a, b) => _orderRank(a.t) - _orderRank(b.t) || a.i - b.i)
  .map(x => x.t)
