'use client'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PaginatedResume from '../lib/PaginatedResume'
import { TEMPLATES } from '../lib/templates-config'
import type { ResumeData } from '../lib/types'

// Applied unconditionally (page is only accessed by Playwright).
// Mirrors the CSS used by the desktop iframe print path so output is identical.
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

function PrintResumeInner() {
  const params = useSearchParams()
  const id = params.get('id')

  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [templateId, setTemplateId] = useState('classic-pro')
  const [color, setColor] = useState<string | undefined>()
  const [breakPoints, setBreakPoints] = useState<number[] | undefined>()
  const [clientTotalHeight, setClientTotalHeight] = useState<number>(0)
  const [fontsReady, setFontsReady] = useState(false)
  // Height as measured by Playwright's Chromium for the same content
  const [serverTotalHeight, setServerTotalHeight] = useState<number | null>(null)
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
      .then((entry: { data: ResumeData; templateId?: string; color?: string; breakPoints?: number[]; totalHeight?: number }) => {
        setResumeData(entry.data)
        if (entry.templateId) setTemplateId(entry.templateId)
        if (entry.color) setColor(entry.color)
        if (entry.breakPoints?.length) setBreakPoints(entry.breakPoints)
        if (entry.totalHeight) setClientTotalHeight(entry.totalHeight)
      })
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [id])

  const template = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0]
  const effectiveColor = color || template.accentColor

  // Set body background to the template accent color so any sub-pixel gap at
  // the PDF page edges shows the template color instead of white.
  useEffect(() => {
    if (!resumeData) return
    document.body.style.background = effectiveColor
  }, [resumeData, effectiveColor])

  // Scale the client-measured break points to account for font metric differences
  // between the user's browser and Playwright's Chromium. Without this, Playwright
  // may render text slightly more compactly, pushing content up and mismatching pages.
  const adjustedBreakPoints = useMemo(() => {
    if (!breakPoints || !clientTotalHeight || serverTotalHeight === null || serverTotalHeight <= 0) return undefined
    if (Math.abs(serverTotalHeight - clientTotalHeight) < 2) return breakPoints // close enough
    const scale = serverTotalHeight / clientTotalHeight
    return breakPoints.map(bp => Math.round(bp * scale))
  }, [breakPoints, clientTotalHeight, serverTotalHeight])

  // Wait for: data + fonts + (if break points provided) server height measured.
  // The server height measurement happens in the first PaginatedResume render
  // (which uses internal measurement when no externalBreakPoints are set yet).
  // Once serverTotalHeight is set, adjustedBreakPoints is computed and a second
  // render uses those as externalBreakPoints. The 600 ms settle delay starts
  // only after all dependencies are resolved.
  const readyDeps = !!(resumeData && fontsReady && (!breakPoints || serverTotalHeight !== null))
  useEffect(() => {
    if (!readyDeps) return
    timerRef.current = setTimeout(() => setReady(true), 600)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [readyDeps])

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      {ready && <div data-pdf-ready="true" style={{ display: 'none' }} />}
      {resumeData && fontsReady && (
        <PaginatedResume
          data={resumeData}
          template={template}
          color={color}
          showWatermark={false}
          interactive={false}
          externalBreakPoints={adjustedBreakPoints}
          onMeasure={(h) => {
            // Only needed when not yet using external break points (first render)
            if (serverTotalHeight === null) setServerTotalHeight(h)
          }}
        />
      )}
    </>
  )
}

export default function PrintResumePage() {
  return (
    <Suspense fallback={null}>
      <PrintResumeInner />
    </Suspense>
  )
}
