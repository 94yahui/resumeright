import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'
import { randomUUID } from 'crypto'
import { storePdfEntry, deletePdfEntry } from '../../../lib/pdf-store'

/**
 * POST /api/pdf/generate
 * Accepts { data, templateId, color, docTitle }, renders the resume in a
 * headless Chromium via Playwright, and streams back a pixel-perfect A4 PDF.
 *
 * Flow:
 *  1. Store resume payload in the module-level pdf-store with a UUID.
 *  2. Playwright navigates to /print-resume?id=UUID on this same server.
 *  3. The print page fetches the payload via POST /api/pdf/data, renders
 *     PaginatedResume, and signals readiness with [data-pdf-ready="true"].
 *  4. page.pdf() generates the PDF with A4 format and zero margins.
 *  5. Cleanup: browser closed, store entry deleted.
 */
export async function POST(req: NextRequest) {
  const { data, templateId, color, docTitle, breakPoints, totalHeight, htmlContent } = await req.json()

  const id = randomUUID()
  storePdfEntry(id, {
    data: data ?? undefined,
    templateId: templateId ?? undefined,
    color: color ?? undefined,
    breakPoints: breakPoints ?? undefined,
    totalHeight: totalHeight || undefined,
    htmlContent: htmlContent ?? undefined,
  })

  // Derive origin from the request so this works on any port / domain.
  const origin = new URL(req.url).origin
  // HTML-capture mode: pre-rendered DOM sent from the client browser avoids
  // Playwright re-measuring fonts, which would produce different page breaks.
  const printUrl = htmlContent
    ? `${origin}/print-html?id=${id}`
    : `${origin}/print-resume?id=${id}`

  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // 794 px = A4 width at 96 dpi. Matching viewport to PDF paper width exactly
    // prevents Chromium from scaling content down and leaving white margins around
    // colored backgrounds. Height is one A4 page; PDF will extend across multiple.
    await page.setViewportSize({ width: 794, height: 1123 })

    // networkidle: waits for JS bundles + Google Fonts before proceeding.
    await page.goto(printUrl, { waitUntil: 'networkidle', timeout: 30_000 })

    // The print page sets this attribute once React has hydrated, fetched data,
    // run layout effects, and fonts have settled (~1.4 s after data arrives).
    // state: 'attached' — element exists in DOM (it's hidden, so 'visible' would time out)
    await page.waitForSelector('[data-pdf-ready="true"]', { state: 'attached', timeout: 30_000 })

    const pdf = await page.pdf({
      // preferCSSPageSize: use the exact @page { size: A4; margin: 0 } from PRINT_CSS
      // instead of Chromium's viewport-mapped A4, which can leave a sub-pixel white border.
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    const safe = (docTitle ?? '简历')
      .replace(/[/\\:*?"<>|]/g, '')
      .trim() || '简历'

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safe)}.pdf`,
      },
    })
  } finally {
    await browser?.close()
    deletePdfEntry(id)
  }
}
