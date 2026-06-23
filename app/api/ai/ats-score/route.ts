import { NextRequest, NextResponse } from 'next/server'
import { inflateRaw } from 'zlib'
import { promisify } from 'util'
import { guardAI, checkServerQuota, incrementQuota } from '../_guard'
import { aiFetch } from '../_fetch'

const inflateRawAsync = promisify(inflateRaw)
const QWEN_BASE = process.env.QWEN_BASE_URL || 'https://api.deepseek.com'
const MODEL     = process.env.QWEN_MODEL    || 'deepseek-chat'

// ── Parse prompt (for editor pre-fill only — not for ATS scoring) ─────────────
const PARSE_SYSTEM = `You are a resume parser. Extract all information and return ONLY valid JSON (no markdown):
{"isResume":true,"name":string,"jobtitle":string,"email":string,"phone":string,"city":string,"website":string,"extraWebsites":string[],"photo":"","summary":string,"hasSummary":boolean,"hasSkills":boolean,"hasProject":boolean,"hasLanguage":boolean,"hasAward":boolean,"hasCert":boolean,"hasVolunteer":boolean,"hasInterest":boolean,"exp":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"edu":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"project":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"award":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"cert":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"volunteer":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"interest":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"language":[{"id":string,"title":string,"sub":string,"date":"","bullets":[]}],"skills":string[],"skillCategories":null}
Generate unique ids like "e1","d1","p1"; photo always ""; set hasXxx true if section has content; preserve original language.
If NOT a resume return ONLY: {"isResume":false}`

// ── DOCX text extraction ──────────────────────────────────────────────────────
async function extractDocxText(buf: Buffer): Promise<string> {
  const SIG = [0x50, 0x4b, 0x03, 0x04]
  let pos = 0
  while (pos < buf.length - 30) {
    if (buf[pos] === SIG[0] && buf[pos+1] === SIG[1] && buf[pos+2] === SIG[2] && buf[pos+3] === SIG[3]) {
      const method    = buf.readUInt16LE(pos + 8)
      const compSize  = buf.readUInt32LE(pos + 18)
      const fnameLen  = buf.readUInt16LE(pos + 26)
      const extraLen  = buf.readUInt16LE(pos + 28)
      const fname     = buf.subarray(pos + 30, pos + 30 + fnameLen).toString('utf8')
      const dataStart = pos + 30 + fnameLen + extraLen
      if (fname === 'word/document.xml') {
        const chunk = buf.subarray(dataStart, dataStart + compSize)
        const xml = method === 0 ? chunk.toString('utf8') : (await inflateRawAsync(chunk)).toString('utf8')
        return xml
          .replace(/<w:p[ />]/g, '\n').replace(/<w:br[^/]*/g, '\n').replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/\n{3,}/g, '\n\n').trim()
      }
      pos = dataStart + compSize
    } else { pos++ }
  }
  return ''
}

async function extractPdfText(buf: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js')
  const data = await pdfParse(buf)
  return (data.text as string).replace(/\n{3,}/g, '\n\n').trim()
}

// ── Statistical helpers ───────────────────────────────────────────────────────
function medianOf(arr: number[]): number {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

// ── Rule-based ATS analysis ───────────────────────────────────────────────────
interface Dim { key: string; name: string; score: number; feedback: string }

function runATSChecks(text: string, buf: Buffer, mime: string): {
  dims: Dim[]; totalScore: number; overview: string; name: string; jobtitle: string
} {
  const charCount  = text.length
  const fileSizeKB = buf.length / 1024
  const lines      = text.split('\n')
  const nonEmpty   = lines.filter(l => l.trim().length > 2)

  // ── Dim 1: Text extractability ───────────────────────────────────────────────────
  const replacements   = (text.match(/�/g) || []).length
  const replaceRatio   = charCount > 0 ? replacements / charCount : 1
  const isLikelyImage  = charCount < 80 && fileSizeKB > 40

  let d1Score = 20, d1Fb = ''
  if (isLikelyImage) {
    d1Score = 0
    d1Fb = `Likely a scanned/image PDF (only ${charCount} chars extracted, ${fileSizeKB.toFixed(0)}KB). ATS cannot read any text — use an editable version`
  } else if (charCount < 200) {
    d1Score = 4
    d1Fb = `Too little text extracted (${charCount} chars); content is insufficient for ATS to parse fully`
  } else if (replaceRatio > 0.08) {
    d1Score = 5
    d1Fb = `Garbled characters at ${(replaceRatio * 100).toFixed(1)}% (${replacements} U+FFFD); unembedded fonts make the ATS read garbage`
  } else if (replaceRatio > 0.015) {
    d1Score = 12
    d1Fb = `A few garbled characters (${replacements}); some fonts may not be embedded — re-export the PDF with fonts embedded`
  } else if (charCount < 400) {
    d1Score = 14
    d1Fb = `Light on content (${charCount} chars); check whether some text failed to extract`
  } else {
    d1Score = 20
    d1Fb = `Text extraction is normal (${charCount} chars); the ATS can read it fully`
  }

  // ── Dim 2: Encoding ─────────────────────────────────────────────────────
  const specialBullets = (text.match(/[◆◇□■●▶▸►◀‣⁃◦▪▫✦✧★☆]/g) || []).length
  const controlChars   = (text.match(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g) || []).length
  const compatCJK      = (text.match(/[豈-﫿︰-﹏]/g) || []).length
  const specialRatio   = charCount > 0 ? specialBullets / charCount : 0

  let d2Score = 20, d2Fb = ''
  if (replaceRatio > 0.05 || controlChars > 20) {
    d2Score = 3
    d2Fb = `Severe encoding issues: ${replacements} replacement chars + ${controlChars} control chars; font embedding failed and the ATS will misparse`
  } else if (controlChars > 5) {
    d2Score = 9
    d2Fb = `${controlChars} control (non-printing) characters that interfere with ATS paragraph/field detection — rebuild in plain text`
  } else if (specialRatio > 0.025) {
    d2Score = 10
    d2Fb = `Many decorative symbols (${specialBullets}, e.g. ◆●■) that some ATS can't read — use "-" or "·" instead`
  } else if (compatCJK > 15) {
    d2Score = 13
    d2Fb = `${compatCJK} CJK-compatibility characters (possibly from legacy character sets) — use standard Unicode characters`
  } else if (specialBullets > 15) {
    d2Score = 16
    d2Fb = `${specialBullets} special symbols; most ATS handle these, with a small risk of some being ignored`
  } else {
    d2Score = 20
    d2Fb = `Character encoding is clean with no problematic symbols; the ATS can read every character`
  }

  // ── Dim 3: Layout structure ───────────────────────────────────────────────────
  const lineLengths  = nonEmpty.map(l => l.trim().length)
  const tabCount     = (text.match(/\t/g) || []).length
  const tabRatio     = charCount > 0 ? tabCount / charCount : 0
  const med          = medianOf(lineLengths)
  const shortRatio   = lineLengths.length > 0
    ? lineLengths.filter(l => l < 28).length / lineLengths.length : 0

  let d3Score = 20, d3Fb = ''
  if (tabRatio > 0.025) {
    d3Score = 4
    d3Fb = `Many tab characters (${tabCount}) indicate a table layout. The ATS will badly scramble reading order — switch to plain-text layout`
  } else if (shortRatio > 0.62 && med < 38) {
    d3Score = 6
    d3Fb = `${(shortRatio*100).toFixed(0)}% of lines are under 28 chars (median ${med.toFixed(0)}), indicating a two-column layout. The ATS mixes the columns and can't parse them`
  } else if (shortRatio > 0.5 && med < 48) {
    d3Score = 12
    d3Fb = `Uneven line lengths (${(shortRatio*100).toFixed(0)}% short lines) suggest two columns or text boxes; the ATS reading order may be scrambled`
  } else if (tabRatio > 0.008) {
    d3Score = 14
    d3Fb = `Tab characters detected (${tabCount}); there may be a local table — replace tabs with spaces or plain text`
  } else if (med < 30 && nonEmpty.length > 10) {
    d3Score = 15
    d3Fb = `Average line length is short (median ${med.toFixed(0)}); the layout is tight — confirm it's a single column of continuous text`
  } else {
    d3Score = 20
    d3Fb = `Single-column layout with even line lengths (median ${med.toFixed(0)}/line); the ATS reads it in the correct order`
  }

  // ── Dim 4: Key field detection ───────────────────────────────────────────────
  const hasEmail    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(text)
  const normalizedPhone = text.replace(/[\s\-–—·.()​‌‍⁠­﻿]/g, '')
  const digitChunks = (text.match(/\d+/g) || []).join('')
  const hasPhone    = /1[3-9]\d{9}/.test(normalizedPhone) || /0\d{2,3}\d{7,8}/.test(normalizedPhone)
                   || /1[3-9]\d{9}/.test(digitChunks)
  const hasWork     = /工作经历|工作经验|职业经历|实习经历|实习经验|项目经历|work experience|employment|internship/i.test(text)
  const hasEdu      = /教育背景|教育经历|education|学历|毕业/i.test(text)
  const hasSkill    = /技能|skills?|专业技能|expertise/i.test(text)
  const hasDate     = /\d{4}[.\-/年]\d{1,2}|\d{4}\s*[~–\-至]\s*(\d{4}|至今|present)/i.test(text)
  const misses: string[] = []

  let d4Score = 0
  if (hasEmail) d4Score += 5; else misses.push('email')
  if (hasPhone) d4Score += 5; else misses.push('phone')
  if (hasWork)  d4Score += 4; else misses.push('Experience heading')
  if (hasEdu)   d4Score += 3; else misses.push('Education heading')
  if (hasSkill) d4Score += 1
  if (hasDate)  d4Score += 2; else misses.push('standard date format')
  d4Score = Math.min(20, d4Score)

  const d4Fb = misses.length === 0
    ? `Email, phone, section headings, and dates are all detected and extractable by the ATS`
    : `Not detected: ${misses.join(', ')} — the ATS can't extract these fields, hurting how your info is stored`

  // ── Dim 5: File format ────────────────────────────────────────────────────
  const isDocx = mime.includes('openxmlformats') || mime.includes('docx')
  const isPdf  = mime.includes('pdf')
  const isDoc  = (mime.includes('msword') || mime.includes('.doc')) && !isDocx
  const sizeMB = fileSizeKB / 1024
  const sizeDeduct = sizeMB > 5 ? 8 : sizeMB > 3 ? 5 : sizeMB > 2 ? 2 : 0

  let d5Score = 20, d5Fb = ''
  if (isDocx) {
    d5Score = Math.max(0, 20 - sizeDeduct)
    d5Fb = sizeDeduct > 0
      ? `Word (.docx) has the best compatibility, but the file is large (${sizeMB.toFixed(1)}MB); some ATS may time out — compress images to under 2MB`
      : `Word (.docx) format has excellent ATS compatibility and the most accurate field parsing`
  } else if (isPdf) {
    if (isLikelyImage) {
      d5Score = 2
      d5Fb = `Image-based PDF — the ATS can't extract any text. Submit an editable Word doc or a text-based PDF`
    } else {
      d5Score = Math.max(0, 16 - sizeDeduct)
      d5Fb = sizeDeduct > 0
        ? `The PDF is large (${sizeMB.toFixed(1)}MB); compress to under 1MB. Text PDFs parse okay but less reliably than Word`
        : `Text-based PDF; most ATS can parse it, though some extract fields less accurately than from Word`
    }
  } else if (isDoc) {
    d5Score = Math.max(0, 11 - sizeDeduct)
    d5Fb = `Legacy .doc format (Word 97-2003) parses unreliably in modern ATS — save as .docx and re-upload`
  } else {
    d5Score = 4
    d5Fb = `Unknown file format; the ATS may reject it — submit a .docx or a text-based .pdf`
  }

  const dims: Dim[] = [
    { key: 'extractability', name: 'Text Extraction',   score: d1Score, feedback: d1Fb },
    { key: 'encoding',       name: 'Encoding',   score: d2Score, feedback: d2Fb },
    { key: 'layout',         name: 'Layout Structure',   score: d3Score, feedback: d3Fb },
    { key: 'field_detect',   name: 'Field Detection',   score: d4Score, feedback: d4Fb },
    { key: 'file_format',    name: 'File Format',   score: d5Score, feedback: d5Fb },
  ]
  const totalScore = dims.reduce((s, d) => s + d.score, 0)

  // Generate overview from scores
  const worst = [...dims].sort((a, b) => a.score - b.score)[0]
  const best  = [...dims].sort((a, b) => b.score - a.score)[0]
  let overview: string
  if (totalScore >= 95) {
    overview = `Perfect ATS score (${totalScore}/100). Every dimension is excellent and your resume fully meets ATS standards.`
  } else if (totalScore >= 85) {
    overview = `High ATS score (${totalScore}/100). Overall it meets ATS standards with only minor tweaks needed. Most to improve: ${worst.name} (${worst.score}/20): ${worst.feedback}`
  } else if (totalScore >= 60) {
    overview = `Moderate ATS score (${totalScore}/100) with fixable technical issues. Most to improve: ${worst.name} (${worst.score}/20): ${worst.feedback} — fixing it will raise your score significantly.`
  } else {
    overview = `Low ATS score (${totalScore}/100) with serious technical issues that may get you filtered out automatically. Top issue: ${worst.name} (${worst.score}/20) — ${worst.feedback}`
  }

  // Extract name/jobtitle heuristically from first few lines
  const topLines = lines.slice(0, 6).map(l => l.trim()).filter(l => l.length > 0)
  const name = topLines[0] ?? ''
  const jobtitle = topLines[1] ?? ''

  return { dims, totalScore, overview, name, jobtitle }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    const deviceId = String(formData.get('deviceId') ?? '')
    if (!file) return NextResponse.json({ error: 'Please upload a resume file' }, { status: 400 })

    const guard = guardAI(req, deviceId)
    if (guard) return guard

    const quotaGuard = await checkServerQuota(req, 'ats-score', deviceId)
    if (quotaGuard) return quotaGuard

    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: 'File too large, please upload a file under 5 MB' }, { status: 413 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const mime   = file.type || ''
    const name   = file.name.toLowerCase()

    // ── Extract text ──
    let resumeText = ''
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
      resumeText = await extractPdfText(buffer)
    } else if (mime.includes('docx') || mime.includes('openxmlformats') || name.endsWith('.docx')) {
      resumeText = await extractDocxText(buffer)
    } else if (mime.includes('doc') || name.endsWith('.doc')) {
      resumeText = buffer.toString('utf8', 0, Math.min(buffer.length, 50000))
        .replace(/[^\x20-\x7e一-鿿　-〿＀-￯\n\r\t]/g, ' ').replace(/ {3,}/g, ' ').trim()
    } else {
      return NextResponse.json({ error: 'Please upload a PDF or Word (.docx/.doc) resume' }, { status: 415 })
    }

    // ── Rule-based ATS analysis (instant, no AI needed) ──
    const { dims, totalScore, overview, name: hName, jobtitle: hTitle } =
      runATSChecks(resumeText, buffer, mime)

    // ── AI parse call (for editor pre-fill, runs in background) ──
    let parsedData: Record<string, unknown> | null = null
    let aiName = hName, aiTitle = hTitle
    if (resumeText.length >= 30) {
      try {
        const parseText = resumeText.slice(0, 12000)
        const parseRes = await aiFetch(`${QWEN_BASE}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: MODEL, temperature: 0.1,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: PARSE_SYSTEM },
              { role: 'user',   content: `Parse this resume:\n\n${parseText}` },
            ],
          }),
        })
        if (parseRes.ok) {
          const pd = await parseRes.json()
          const raw = JSON.parse(pd.choices?.[0]?.message?.content ?? '{}')
          if (raw.isResume !== false) {
            parsedData = raw
            if (raw.name)    aiName  = String(raw.name)
            if (raw.jobtitle) aiTitle = String(raw.jobtitle)
          }
        }
      } catch { /* ignore — ATS result still returned */ }
    }

    await incrementQuota(req, 'ats-score', deviceId)

    return NextResponse.json({
      name:       aiName,
      jobtitle:   aiTitle,
      totalScore: Math.min(100, Math.max(0, totalScore)),
      overview,
      dimensions: dims,
      parsedData,
    })
  } catch (e) {
    console.error('ats-score error:', e)
    return NextResponse.json({ error: 'Server error, please try again later' }, { status: 500 })
  }
}
