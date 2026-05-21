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
  width:210mm!important;height:297mm!important;overflow:hidden!important;
}
.resume-page:last-child{break-after:auto!important;page-break-after:auto!important;}
.resume-page-num{display:none!important;}
@page{size:A4;margin:0;}
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
  const { htmlContent, docTitle } = await req.json()
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

    // Inject HTML directly — no separate HTTP round-trip, no shared in-memory store.
    // waitUntil:'networkidle0' lets Google Fonts finish loading before we proceed.
    const fullHtml = buildHtml(htmlContent)
    if (process.env.VERCEL) {
      await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30_000 })
    } else {
      await page.setContent(fullHtml, { waitUntil: 'networkidle', timeout: 30_000 })
    }

    // Wait for fonts.ready so all glyphs are measured before PDF layout.
    await page.evaluate(() => document.fonts.ready)
    // Small buffer for any final paint after fonts settle.
    await new Promise(r => setTimeout(r, 600))

    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    const safe = (docTitle ?? '简历').replace(/[/\\:*?"<>|]/g, '').trim() || '简历'

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
