import { NextRequest, NextResponse } from 'next/server'
import { inflateRaw } from 'zlib'
import { promisify } from 'util'

const inflateRawAsync = promisify(inflateRaw)

const QWEN_BASE = process.env.QWEN_BASE_URL || 'https://dashscope-us.aliyuncs.com/compatible-mode/v1'
const PARSE_MODEL = process.env.QWEN_MODEL || 'qwen3.6-plus'

const PARSE_PROMPT = `You are a resume parser. First determine if this document is a resume/CV.

If the document is NOT a resume (e.g., it's a contract, article, blank, or other non-resume content), return ONLY:
{"isResume": false}

If it IS a resume, extract all information and return ONLY valid JSON (no markdown) in this structure:
{
  "isResume": true,
  "name": string,
  "jobtitle": string,
  "email": string,
  "phone": string,
  "city": string,
  "website": string,
  "extraWebsites": string[],
  "photo": "",
  "summary": string,
  "hasSummary": boolean,
  "hasSkills": boolean,
  "hasProject": boolean,
  "hasLanguage": boolean,
  "hasAward": boolean,
  "hasCert": boolean,
  "hasVolunteer": boolean,
  "hasInterest": boolean,
  "exp": [{ "id": string, "title": string, "sub": string, "date": string, "bullets": string[] }],
  "edu": [{ "id": string, "title": string, "sub": string, "date": string, "bullets": string[] }],
  "project": [{ "id": string, "title": string, "sub": string, "date": string, "bullets": string[] }],
  "award": [{ "id": string, "title": string, "sub": string, "date": string, "bullets": string[] }],
  "cert": [{ "id": string, "title": string, "sub": string, "date": string, "bullets": string[] }],
  "volunteer": [{ "id": string, "title": string, "sub": string, "date": string, "bullets": string[] }],
  "interest": [{ "id": string, "title": string, "sub": string, "date": string, "bullets": string[] }],
  "language": [{ "id": string, "title": string, "sub": string, "date": "", "bullets": [] }],
  "skills": string[]
}

Rules:
- website: put the FIRST URL/link found (GitHub, LinkedIn, portfolio, etc.)
- extraWebsites: put ALL additional URLs beyond the first, as an array of strings
- Set hasXxx boolean to true if that section has content, false if empty
- Generate unique ids like "e1","e2" for exp, "d1","d2" for edu, "p1" for project, etc.
- photo is always ""
- For language entries, "title" = language name, "sub" = proficiency (精通/流利/基础)
- Extract all bullet points; if the resume uses paragraph form, split into logical bullet points
- Use empty string for missing text fields, empty array for missing array fields
- Preserve original language (Chinese or English) of the resume content`

// ── DOCX text extraction (no external deps) ──────────────────────────────────
// DOCX is a ZIP archive; we scan for 'word/document.xml', decompress it, strip tags.
async function extractDocxText(buf: Buffer): Promise<string> {
  const SIG = [0x50, 0x4b, 0x03, 0x04]
  let pos = 0
  while (pos < buf.length - 30) {
    if (buf[pos] === SIG[0] && buf[pos+1] === SIG[1] && buf[pos+2] === SIG[2] && buf[pos+3] === SIG[3]) {
      const method      = buf.readUInt16LE(pos + 8)
      const compSize    = buf.readUInt32LE(pos + 18)
      const fnameLen    = buf.readUInt16LE(pos + 26)
      const extraLen    = buf.readUInt16LE(pos + 28)
      const fname       = buf.subarray(pos + 30, pos + 30 + fnameLen).toString('utf8')
      const dataStart   = pos + 30 + fnameLen + extraLen

      if (fname === 'word/document.xml') {
        const chunk = buf.subarray(dataStart, dataStart + compSize)
        const xml   = method === 0
          ? chunk.toString('utf8')
          : (await inflateRawAsync(chunk)).toString('utf8')

        return xml
          .replace(/<w:p[ />]/g, '\n')   // paragraph break
          .replace(/<w:br[^/]*/g, '\n')  // line break
          .replace(/<[^>]+>/g, '')        // strip all tags
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
      }

      pos = dataStart + compSize
    } else {
      pos++
    }
  }
  return ''
}

// ── PDF text extraction via pdf-parse ────────────────────────────────────────
async function extractPdfText(buf: Buffer): Promise<string> {
  // Use internal lib path to avoid v1's test-file loader running at require time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js')
  const data = await pdfParse(buf)
  return (data.text as string).replace(/\n{3,}/g, '\n\n').trim()
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const mime   = file.type || ''
    const name   = file.name.toLowerCase()

    // Extract plain text from the uploaded document
    let resumeText = ''
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
      resumeText = await extractPdfText(buffer)
    } else if (
      mime.includes('docx') || mime.includes('openxmlformats') ||
      name.endsWith('.docx')
    ) {
      resumeText = await extractDocxText(buffer)
    } else if (mime.includes('doc') || name.endsWith('.doc')) {
      // Legacy .doc (binary Word) — best-effort: send raw text bytes that are readable
      resumeText = buffer.toString('utf8', 0, Math.min(buffer.length, 50000))
        .replace(/[^\x20-\x7e一-鿿　-〿＀-￯\n\r\t]/g, ' ')
        .replace(/ {3,}/g, ' ')
        .trim()
    }

    if (!resumeText || resumeText.length < 30) {
      return NextResponse.json({ error: 'not_resume' }, { status: 422 })
    }

    // Send extracted text to qwen3.6-plus
    const res = await fetch(`${QWEN_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PARSE_MODEL,
        messages: [
          {
            role: 'user',
            content: `${PARSE_PROMPT}\n\n---\nResume content:\n${resumeText}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        enable_thinking: false,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Qwen parse-resume error:', err)
      return NextResponse.json({ error: 'Qwen API error', detail: err }, { status: 502 })
    }

    const json   = await res.json()
    const text   = json.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(text)

    if (parsed.isResume === false) {
      return NextResponse.json({ error: 'not_resume' }, { status: 422 })
    }

    // Normalize links: LLMs often pack multiple URLs into website or return extraWebsites as string.
    // Distribute: first URL → website, rest → extraWebsites (array), mirroring the editor's "添加链接" flow.
    const isUrl = (s: string) =>
      s.includes('://') || s.startsWith('http') || /[a-z0-9]\.[a-z]{2,}/i.test(s)
    const splitUrls = (s: string): string[] =>
      s.split(/[,;\s|]+/).map((u: string) => u.trim()).filter((u: string) => u.length > 0 && isUrl(u))

    const rawWebsite = String(parsed.website ?? '')
    const rawExtra: string[] = Array.isArray(parsed.extraWebsites)
      ? (parsed.extraWebsites as unknown[]).map(u => String(u)).filter((u: string) => u.length > 0)
      : typeof parsed.extraWebsites === 'string' && parsed.extraWebsites.trim()
        ? splitUrls(parsed.extraWebsites as string)
        : []

    const fromWebsite = splitUrls(rawWebsite)
    const websiteTokens = fromWebsite.length > 0 ? fromWebsite : (rawWebsite ? [rawWebsite] : [])
    const seen = new Set<string>()
    const allUrls: string[] = []
    for (const u of [...websiteTokens, ...rawExtra]) {
      if (!seen.has(u)) { seen.add(u); allUrls.push(u) }
    }

    const normalizedData = {
      ...parsed,
      website: allUrls[0] ?? '',
      extraWebsites: allUrls.slice(1),
    }

    return NextResponse.json({ data: normalizedData })
  } catch (e) {
    console.error('parse-resume route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
