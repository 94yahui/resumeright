import { NextRequest, NextResponse } from 'next/server'
import { guardAI } from '../_guard'

const QWEN_BASE  = process.env.QWEN_BASE_URL  || 'https://dashscope-us.aliyuncs.com/compatible-mode/v1'
const QWEN_MODEL = process.env.QWEN_MODEL     || 'qwen-plus'

async function qwen(prompt: string, apiKey: string): Promise<unknown> {
  const res = await fetch(`${QWEN_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      enable_thinking: false,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return JSON.parse(json.choices?.[0]?.message?.content ?? '{}')
}

type EntrySnippet = { title: string; sub: string; date: string; bullets: string[] }

function pickEntries(arr: unknown[]): EntrySnippet[] {
  return arr.map(e => {
    const r = e as Record<string, unknown>
    return {
      title:   String(r.title   ?? ''),
      sub:     String(r.sub     ?? ''),
      date:    String(r.date    ?? ''),
      bullets: Array.isArray(r.bullets) ? (r.bullets as unknown[]).map(String) : [],
    }
  })
}

function mergeEntries(
  originals: Record<string, unknown>[],
  translated: EntrySnippet[],
): Record<string, unknown>[] {
  return originals.map((orig, i) => {
    const t = translated?.[i]
    if (!t) return orig
    return {
      ...orig,
      title:   t.title   || orig.title,
      sub:     t.sub     || orig.sub,
      date:    t.date    || orig.date,
      bullets: Array.isArray(t.bullets) && t.bullets.length ? t.bullets : orig.bullets,
    }
  })
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const { resumeData, deviceId, docTitle } = await req.json()

    const guard = guardAI(req, deviceId)
    if (guard) return guard

    if (JSON.stringify(resumeData).length > 30000)
      return NextResponse.json({ error: 'Resume content too large' }, { status: 413 })

    // Build a stripped payload with only text fields that need translation
    type RD = Record<string, unknown>
    const rd = resumeData as RD
    const snippet = {
      name:       docTitle ? String(docTitle) : '',
      personName: String(rd.name ?? ''),
      jobtitle: rd.jobtitle,
      city:     rd.city,
      summary:  rd.summary,
      exp:      pickEntries((rd.exp as unknown[] | undefined) ?? []),
      edu:      pickEntries((rd.edu as unknown[] | undefined) ?? []),
      project:  pickEntries((rd.project as unknown[] | undefined) ?? []),
      award:    ((rd.award as unknown[] | undefined) ?? []).map(e => {
        const r = e as RD; return { title: String(r.title ?? ''), sub: String(r.sub ?? '') }
      }),
      cert:     ((rd.cert as unknown[] | undefined) ?? []).map(e => {
        const r = e as RD; return { title: String(r.title ?? ''), sub: String(r.sub ?? '') }
      }),
      volunteer: pickEntries((rd.volunteer as unknown[] | undefined) ?? []),
      interest:  ((rd.interest as unknown[] | undefined) ?? []).map(e => {
        const r = e as RD; return { title: String(r.title ?? ''), sub: String(r.sub ?? '') }
      }),
      language:  ((rd.language as unknown[] | undefined) ?? []).map(e => {
        const r = e as RD; return { title: String(r.title ?? ''), sub: String(r.sub ?? '') }
      }),
      skills: rd.skills,
    }

    const prompt = `You are a professional Chinese-to-English resume translator.
Translate the following JSON resume fields to natural, professional English.

Rules:
1. Translate all Chinese text to professional English.
2. "personName": romanize Chinese names to Pinyin with proper capitalization (e.g., 张三 → Zhang San, 王小明 → Wang Xiaoming). For already-English or mixed names, keep as-is.
3. Company/university names: use the official English name when well-known (e.g. 字节跳动→ByteDance, 阿里巴巴→Alibaba, 腾讯→Tencent, 美团→Meituan, 北京大学→Peking University, 清华大学→Tsinghua University, 上海交通大学→Shanghai Jiao Tong University), otherwise translate descriptively.
4. Job titles: use standard English equivalents (高级前端工程师→Senior Frontend Engineer, 产品经理→Product Manager).
5. In date fields, replace "至今" with "Present" only; keep numeric formats like "2022.03" unchanged.
6. Bullet points: begin with a strong past-tense action verb; keep all numeric data unchanged.
7. Skills: keep technology names in English as-is (React, TypeScript, etc.); translate non-English skill names.
8. City names: translate to standard English (上海→Shanghai, 北京→Beijing, 深圳→Shenzhen, etc.).
9. Return ONLY valid JSON with the exact same field structure as the input. No extra commentary.

Input JSON:
${JSON.stringify(snippet)}`

    const translated = await qwen(prompt, apiKey) as RD

    // Merge translated fields back into original ResumeData (preserving ids, photo, contact, flags, etc.)
    const result: RD = {
      ...resumeData,
      resumeLang: 'en',
      name:     String(translated.personName || rd.name     || ''),
      jobtitle: String(translated.jobtitle   || rd.jobtitle || ''),
      city:     String(translated.city      || rd.city      || ''),
      summary:  String(translated.summary   || rd.summary   || ''),
      skills:   Array.isArray(translated.skills) ? translated.skills : rd.skills,
      exp:      mergeEntries((rd.exp      as RD[] | undefined) ?? [], (translated.exp      as EntrySnippet[] | undefined) ?? []),
      edu:      mergeEntries((rd.edu      as RD[] | undefined) ?? [], (translated.edu      as EntrySnippet[] | undefined) ?? []),
      project:  mergeEntries((rd.project  as RD[] | undefined) ?? [], (translated.project  as EntrySnippet[] | undefined) ?? []),
      volunteer:mergeEntries((rd.volunteer as RD[] | undefined) ?? [], (translated.volunteer as EntrySnippet[] | undefined) ?? []),
      award: ((rd.award as RD[] | undefined) ?? []).map((orig, i) => {
        const t = (translated.award as RD[] | undefined)?.[i]
        return t ? { ...orig, title: t.title || orig.title, sub: t.sub || orig.sub } : orig
      }),
      cert: ((rd.cert as RD[] | undefined) ?? []).map((orig, i) => {
        const t = (translated.cert as RD[] | undefined)?.[i]
        return t ? { ...orig, title: t.title || orig.title, sub: t.sub || orig.sub } : orig
      }),
      interest: ((rd.interest as RD[] | undefined) ?? []).map((orig, i) => {
        const t = (translated.interest as RD[] | undefined)?.[i]
        return t ? { ...orig, title: t.title || orig.title, sub: t.sub || orig.sub } : orig
      }),
      language: ((rd.language as RD[] | undefined) ?? []).map((orig, i) => {
        const t = (translated.language as RD[] | undefined)?.[i]
        return t ? { ...orig, title: t.title || orig.title, sub: t.sub || orig.sub } : orig
      }),
    }

    const translatedTitle = translated.name ? String(translated.name) : ''
    return NextResponse.json({ data: result, translatedTitle })
  } catch (e) {
    console.error('translate route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
