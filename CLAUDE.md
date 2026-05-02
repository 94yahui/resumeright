# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js, port 3000)
npm run build    # Production build
npm run lint     # ESLint check
```

No test suite is configured. Verify UI changes by running the dev server.

## Architecture

**ResumeCraft** is a Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 resume builder with two routes:

- `/` — Marketing landing page (`app/page.tsx`) composing `Navbar`, `Hero`, `Templates`, `AISection`, `Pricing`, `Footer`
- `/editor` — Full resume editor (`app/editor/page.tsx`)

### Editor layout

The editor page (`app/editor/page.tsx`) owns all state and wires three panels together:

```
EditorTopbar (top bar: title, undo/redo, preview, upload, download)
├── LeftPanel   (264px, tabs: 模板 / 模块 / 颜色)
├── Center canvas  (PaginatedResume + zoom + color quick-picks)
└── RightPanel  (288px, context-sensitive field editor)
```

### Data model (`app/lib/types.ts`)

`ResumeData` is the single source of truth — one flat object with header fields (`name`, `jobtitle`, `email`, `phone`, `city`, `website`, `photo` as base64), boolean visibility flags (`hasSummary`, `hasSkills`, `hasProject`, …), and typed section arrays (`exp`, `edu`, `project`, `award`, `cert`, `volunteer`, `interest`, `language`).

Each `Entry` has `{ id, title, sub, date, bullets: string[] }`. Bullets are stored as a string array; the helpers `bulletsToText` / `textToBullets` convert to/from the newline-delimited textarea format.

Undo/redo is a simple history stack (`ResumeData[]`) with a 30-entry cap, managed entirely in `EditorPage`.

### Rendering pipeline

`ResumeRenderer` (`app/lib/ResumeRenderer.tsx`) renders a single full-height (A4: 794×1123px) resume. It is layout-agnostic — the active `TemplateConfig` (layout + accentStyle + fontPair + color) drives which JSX branch is rendered. All layout variants reuse the same inner primitives: `NameBlock`, `ContactInline`, `PhotoBlock`, `SectionTitle`, `EntryItem`, `Section`, `SummaryBlock`, `SkillsBlock`.

`PaginatedResume` (`app/lib/PaginatedResume.tsx`) wraps the renderer: it renders a hidden off-screen copy to measure total height, then shows N "page frames" each clipping the renderer via `overflow:hidden` + `translateY`. Only page 1 is interactive; pages 2+ are read-only clones.

`TemplateThumbnail` (`app/lib/TemplateThumbnail.tsx`) scales `ResumeRenderer` to a small preview via CSS `transform: scale()`.

### Template system (`app/lib/templates-config.ts`)

`TemplateConfig` composes orthogonal axes:
- **`layout`** — one of 8 layout types (`single-classic`, `sidebar-left-wide`, `sidebar-left-narrow`, `sidebar-right`, `top-banner-photo`, `two-column-balance`, `header-card`, `single-centered`)
- **`accentStyle`** — how section headings are decorated (`underline-bar`, `left-bar`, `side-icon`, `background-pill`, `thin-line`, `double-line`, `plain-bold`)
- **`fontPair`** — `modern-sans` | `serif-heading` | `mono-accent`
- **`accentColor`** — overridden at runtime by user color selection

There are 5 free templates and 25 pro templates (UI shows 🔒 but no paywall is enforced in code yet).

### Selection model

`SelectionType` is a discriminated union: `{ kind: 'none' }`, `{ kind: 'field'; field: 'name'|'summary'|'photo' }`, `{ kind: 'contact' }`, `{ kind: 'skills' }`, `{ kind: 'entry'; sec: SectionKey; idx: number }`. Clicking any region in `ResumeRenderer` calls `onSelect`; `RightPanel` switches its form based on the current selection.

### AI optimization (stub)

`RightPanel` has a simulated "AI 优化描述" button on `exp` and `project` entries. It currently uses a 1.6s timeout with hard-coded sample bullets from `AI_SAMPLES`. The real API integration is not yet implemented.

### PDF export

Print is triggered via `window.print()` after setting `document.title` to the resume filename. Preview opens a new window with inline styles and the resume DOM cloned into it. There is no server-side PDF generation.

## Key conventions

- All inline styles use the React `CSSProperties` object pattern — no CSS modules or Tailwind in the editor/renderer.
- The `no-print` CSS class hides UI chrome during `window.print()`.
- `app/globals.css` handles fonts (Google Fonts: Inter, Noto Sans SC, Noto Serif SC, JetBrains Mono) and print media queries.
- Keyboard shortcuts: Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z or Ctrl+Y for redo — wired in `EditorPage` via `useEffect`.
- The editor URL accepts `?template=<id>` to pre-select a template.
