import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar'

// CSS variables and print rules — mirrors print-html/page.tsx
const CSS = `
:root {
  --ink:#0f172a;--ink2:#334155;--ink3:#64748b;
  --paper:#ffffff;--paper2:#f8fafc;--paper3:#e2e8f0;
  --theme-blue:#0789ec;--gold2:#0edad3;--gold-light:#fef3c7;--gold3:#ffd500;
  --teal:#0d9488;--teal-light:#ccfbf1;
  --ai-color-1:#1c35f0;--ai-color-2:#bf46c5;
  --font-sans:'Inter','Noto Sans SC',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  --font-serif:'Noto Serif SC',Georgia,serif;
  --font-mono:'JetBrains Mono','SF Mono',Menlo,monospace;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;}
body{background:white;font-family:var(--font-sans);}
.no-print{display:none!important;}
.resume-pages-wrapper{gap:0!important;align-items:flex-start!important;}
.resume-page{
  break-after:page!important;page-break-after:always!important;
  break-inside:avoid!important;box-shadow:none!important;
  width:794px!important;height:1123px!important;overflow:hidden!important;
  clip-path:inset(0)!important;
}
.resume-page:last-child{break-after:auto!important;page-break-after:auto!important;}
.resume-page-num{display:none!important;}
@page{size:794px 1123px;margin:0;}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
`

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800' +
  '&family=Noto+Sans+SC:wght@300;400;500;600;700' +
  '&family=Noto+Serif+SC:wght@400;500;600;700' +
  '&family=JetBrains+Mono:wght@400;500&display=swap'

function buildHtml(bodyHtml: string) {
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8">
<style>${CSS}</style>
<link rel="stylesheet" href="${FONT_URL}">
</head><body>
<div class="resume-pages-wrapper">${bodyHtml}</div>
</body></html>`
}

export async function POST(req: NextRequest) {
  const { htmlContent, docTitle, format = 'pdf' } = await req.json()
  if (!htmlContent) {
    return NextResponse.json({ error: 'missing htmlContent' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any
  try {
    if (process.env.VERCEL) {
      const chromium = (await import('@sparticuz/chromium-min')).default
      const puppeteer = await import('puppeteer-core')
      chromium.setGraphicsMode = false
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
        headless: 'shell',
      })
    } else {
      const { chromium } = await import('playwright')
      browser = await chromium.launch({ headless: true })
    }

    const page = await browser.newPage()
    await (process.env.VERCEL
      ? page.setViewport({ width: 794, height: 1123 })
      : page.setViewportSize({ width: 794, height: 1123 }))

    const fullHtml = buildHtml(htmlContent)
    if (process.env.VERCEL) {
      await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30_000 })
    } else {
      await page.setContent(fullHtml, { waitUntil: 'networkidle', timeout: 30_000 })
    }

    // Explicitly load every font weight the renderer uses.
    // document.fonts.ready fires as soon as font-face rules are parsed, but web font
    // files may still be downloading. The load() calls block until each weight is
    // truly available in Puppeteer's font cache.
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.allSettled([
        document.fonts.load("400 16px 'Inter'"),
        document.fonts.load("500 16px 'Inter'"),
        document.fonts.load("600 16px 'Inter'"),
        document.fonts.load("700 16px 'Inter'"),
        document.fonts.load("400 16px 'Noto Sans SC'"),
        document.fonts.load("500 16px 'Noto Sans SC'"),
        document.fonts.load("700 16px 'Noto Sans SC'"),
      ])
    })
    // Extra buffer for any final repaints after font swap.
    await new Promise(r => setTimeout(r, 800))

    // Root cause of the horizontal-split / ghost-content artifact:
    //   The browser computes break points with its own font metrics and bakes them
    //   into the clip-div heights / translateY values sent in htmlContent.
    //   Puppeteer renders with slightly different metrics (1–3 px/line), so the
    //   baked-in break points are wrong:
    //     • Page N clip may cut through an entry (horizontal split).
    //     • Simply extending page N's clip without updating page N+1's translateY
    //       creates a duplicate strip of content visible on both pages.
    //
    // Fix: discard the browser's break points entirely. Using the first page's
    // unclipped content, measure all entries in Puppeteer's layout, re-run the
    // same pagination algorithm as PaginatedResume.tsx, then apply the new break
    // points to every page (clip height + translateY + overlays together).
    await page.evaluate(() => {
      const PAGE_H = 1123
      const CONT_PAD = 36   // CONTINUATION_PAD
      const TOP_PAD  = 9
      const MIN_SEC_FOLLOW = 80
      const MIN_LAST_CONTENT = 20

      const allPages = Array.from(document.querySelectorAll('.resume-page')) as HTMLElement[]
      if (allPages.length < 2) return  // single page — nothing to fix

      // ── Identify the first page's clip div and content div ────────────────
      const page0 = allPages[0]
      const fc0 = page0.firstElementChild as HTMLElement | null
      if (!fc0) return
      const isSidebar = fc0.style.overflow !== 'hidden'
      const clipDiv0 = isSidebar ? null : fc0
      const contentDiv0: HTMLElement | null = isSidebar
        ? fc0
        : (fc0.firstElementChild as HTMLElement | null)
      if (!contentDiv0) return

      // ── Expand page 0's clip so the entire content is layout-rendered ─────
      const savedH  = clipDiv0 ? clipDiv0.style.height  : ''
      const savedOv = clipDiv0 ? clipDiv0.style.overflow : ''
      if (clipDiv0) { clipDiv0.style.height = '20000px'; clipDiv0.style.overflow = 'visible' }
      void page0.offsetHeight   // flush layout

      const totalH   = contentDiv0.scrollHeight
      const p0Rect   = page0.getBoundingClientRect()

      // getBoundingClientRect() already accounts for any translateY; for page 0
      // it's translateY(-0px) so positions are directly in content space.
      const entries = (Array.from(contentDiv0.querySelectorAll('[data-entry]')) as HTMLElement[])
        .map(el => { const r = el.getBoundingClientRect(); return { top: r.top - p0Rect.top, h: r.height } })
        .filter(e => e.top >= 0 && e.h < PAGE_H * 0.9)
        .map(e => ({ top: e.top, bottom: e.top + e.h }))

      const titles = (Array.from(contentDiv0.querySelectorAll('[data-section-start]')) as HTMLElement[])
        .map(el => { const r = el.getBoundingClientRect(); return { top: r.top - p0Rect.top, h: r.height } })
        .filter(t => t.top >= 0)

      // ── Restore page 0's clip ─────────────────────────────────────────────
      if (clipDiv0) { clipDiv0.style.height = savedH; clipDiv0.style.overflow = savedOv }

      // ── Recompute break points (mirrors PaginatedResume.tsx logic) ────────
      const contCap = PAGE_H - 2 * CONT_PAD
      let totalPages: number
      if (totalH <= PAGE_H) {
        totalPages = 1
      } else {
        const remaining = totalH - (PAGE_H - CONT_PAD)
        const extra     = Math.ceil(remaining / contCap)
        const lastCont  = remaining - (extra - 1) * contCap
        totalPages = Math.max(1,
          (totalH - PAGE_H) < MIN_LAST_CONTENT || lastCont < MIN_LAST_CONTENT
            ? extra : 1 + extra
        )
      }

      const bp: number[] = [0]
      let breakAt = PAGE_H - CONT_PAD
      let built = 1
      while (breakAt < totalH && built < totalPages) {
        let smart = breakAt
        for (const e of entries) {
          if (e.top < breakAt && e.bottom > breakAt) {
            const adj = Math.max(0, e.top - TOP_PAD)
            if (adj > bp[bp.length - 1] + 200) smart = adj
            break
          }
        }
        for (const t of titles) {
          const vEnd = t.top + t.h + MIN_SEC_FOLLOW
          if (t.top < smart && vEnd > smart) {
            const adj = Math.max(0, t.top - TOP_PAD)
            if (adj > bp[bp.length - 1] + 200) smart = adj
            break
          }
        }
        bp.push(smart)
        breakAt = smart + contCap
        built++
      }

      // ── Apply new break points to every page ──────────────────────────────
      // Each page needs: contentDiv translateY + clipDiv height (or sidebar overlay top).
      // Updating both together ensures page N's clip and page N+1's start are consistent,
      // preventing the duplicate-strip artifact.
      allPages.forEach((pageEl, idx) => {
        const translateY  = bp[idx] ?? bp[bp.length - 1]
        const nextBreak   = bp[idx + 1] ?? null
        const clipH       = nextBreak !== null ? Math.min(PAGE_H, nextBreak - translateY) : PAGE_H
        const shift       = translateY - (idx > 0 ? CONT_PAD : 0)

        const fc = pageEl.firstElementChild as HTMLElement | null
        if (!fc) return
        const sidebar = fc.style.overflow !== 'hidden'

        if (!sidebar) {
          // Non-sidebar: update clip div height and content div translateY
          const cd = fc.firstElementChild as HTMLElement | null
          if (!cd) return
          cd.style.transform  = `translateY(-${shift}px)`
          fc.style.height     = `${clipH + (idx > 0 ? CONT_PAD : 0)}px`
        } else {
          // Sidebar: update content div translateY and bottom overlay top
          fc.style.transform = `translateY(-${shift}px)`
          const sibs = Array.from(pageEl.children) as HTMLElement[]
          const bot  = sibs.slice(1).find(
            c => c.style.position === 'absolute' && (c.style.bottom === '0px' || c.style.bottom === '0')
          ) as HTMLElement | undefined
          if (bot && nextBreak !== null) {
            bot.style.top = `${clipH + (idx > 0 ? CONT_PAD : 0)}px`
          }
        }
      })
    })

    const safe = (docTitle ?? '简历').replace(/[/\\:*?"<>|]/g, '').trim() || '简历'

    if (format === 'word') {
      const pageCount: number = await page.evaluate(() =>
        document.querySelectorAll('.resume-page').length
      )
      const totalH = Math.max(1123, pageCount * 1123)

      if (process.env.VERCEL) {
        await page.setViewport({ width: 794, height: totalH })
      } else {
        await page.setViewportSize({ width: 794, height: totalH })
      }
      await new Promise(r => setTimeout(r, 150))

      const pngPages: string[] = []
      for (let i = 0; i < pageCount; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buf = await (page as any).screenshot({
          clip: { x: 0, y: i * 1123, width: 794, height: 1123 },
          type: 'png',
        })
        pngPages.push(Buffer.from(buf).toString('base64'))
      }

      const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>@page{size:210mm 297mm;margin:0;}body{margin:0;padding:0;}div.pg{width:210mm;height:297mm;page-break-after:always;overflow:hidden;}div.pg:last-child{page-break-after:auto;}img{width:210mm;height:297mm;display:block;}</style></head><body>${pngPages.map(b64 => `<div class="pg"><img src="data:image/png;base64,${b64}"/></div>`).join('')}</body></html>`

      return new NextResponse(Buffer.from(wordHtml), {
        headers: {
          'Content-Type': 'application/msword',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safe)}.doc`,
        },
      })
    }

    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safe)}.pdf`,
      },
    })
  } finally {
    await browser?.close()
  }
}
