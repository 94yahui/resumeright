import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { storePdfEntry, deletePdfEntry } from '../../../lib/pdf-store'

// Vercel Pro: up to 60s; Hobby plan caps at 10s (PDF will likely time out on Hobby).
export const maxDuration = 60

const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'

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

  const origin = new URL(req.url).origin
  const printUrl = htmlContent
    ? `${origin}/print-html?id=${id}`
    : `${origin}/print-resume?id=${id}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any
  try {
    if (process.env.VERCEL) {
      // Serverless (Vercel): use @sparticuz/chromium-min + puppeteer-core.
      // The binary is downloaded from GitHub at runtime — no bundled Chromium needed.
      const chromium = (await import('@sparticuz/chromium-min')).default
      const puppeteer = await import('puppeteer-core')
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
        headless: true,
      })
    } else {
      // Local dev: use the Chromium that playwright already downloaded.
      const { chromium } = await import('playwright')
      browser = await chromium.launch({ headless: true })
    }

    const page = await browser.newPage()

    if (process.env.VERCEL) {
      // puppeteer-core API
      await page.setViewport({ width: 794, height: 1123 })
      await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30_000 })
      await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 30_000 })
    } else {
      // playwright API
      await page.setViewportSize({ width: 794, height: 1123 })
      await page.goto(printUrl, { waitUntil: 'networkidle', timeout: 30_000 })
      await page.waitForSelector('[data-pdf-ready="true"]', { state: 'attached', timeout: 30_000 })
    }

    const pdf = await page.pdf({
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
