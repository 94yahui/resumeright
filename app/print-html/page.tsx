'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// CSS custom properties that match globals.css — needed because the captured
// HTML uses var(--ink) etc. in its inline styles.
const CSS_VARS = `
:root {
  --ink: #0f172a; --ink2: #334155; --ink3: #64748b;
  --paper: #ffffff; --paper2: #f8fafc; --paper3: #e2e8f0;
  --theme-blue: #0789ec; --gold2: #0edad3; --gold-light: #fef3c7; --gold3: #ffd500;
  --teal: #0d9488; --teal-light: #ccfbf1;
  --ai-color-1: #1c35f0; --ai-color-2: #bf46c5;
  --font-sans: 'Inter','Noto Sans SC',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  --font-serif: 'Noto Serif SC',Georgia,serif;
  --font-mono: 'JetBrains Mono','SF Mono',Menlo,monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
body { background: white; font-family: var(--font-sans); }
.no-print { display: none !important; }
`

// Applied unconditionally — page is only accessed by Playwright.
const PRINT_CSS = `
body { margin: 0; padding: 0; }
.resume-pages-wrapper { gap: 0 !important; align-items: flex-start !important; }
.resume-page {
  break-after: page !important;
  page-break-after: always !important;
  break-inside: avoid !important;
  box-shadow: none !important;
  width: 210mm !important;
  height: 297mm !important;
  overflow: hidden !important;
}
.resume-page:last-child {
  break-after: auto !important;
  page-break-after: auto !important;
}
.resume-page-num { display: none !important; }
@page { size: A4; margin: 0; }
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
`

function PrintHtmlInner() {
  const params = useSearchParams()
  const id = params.get('id')

  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [fontsReady, setFontsReady] = useState(false)
  const [ready, setReady] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  useEffect(() => {
    if (!id) return
    fetch('/api/pdf/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
      .then(r => r.json())
      .then((entry: { htmlContent?: string }) => {
        if (entry.htmlContent) setHtmlContent(entry.htmlContent)
      })
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [id])

  // Signal ready after HTML is injected and fonts have settled
  useEffect(() => {
    if (!htmlContent || !fontsReady) return
    timerRef.current = setTimeout(() => setReady(true), 600)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [htmlContent, fontsReady])

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: CSS_VARS }} />
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      {/* Google Fonts — same subset as globals.css */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      {ready && <div data-pdf-ready="true" style={{ display: 'none' }} />}
      {htmlContent && (
        <div
          className="resume-pages-wrapper"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}
          // Pre-rendered DOM captured from the editor canvas — page breaks and
          // translateY offsets are already baked in from the user's browser.
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </>
  )
}

export default function PrintHtmlPage() {
  return (
    <Suspense fallback={null}>
      <PrintHtmlInner />
    </Suspense>
  )
}
