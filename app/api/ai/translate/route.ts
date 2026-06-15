import { NextRequest, NextResponse } from 'next/server'
import { guardAI, checkServerQuota, incrementQuota } from '../_guard'
import { aiFetch } from '../_fetch'

const QWEN_BASE  = process.env.QWEN_BASE_URL  || 'https://api.deepseek.com'
const QWEN_MODEL = process.env.QWEN_MODEL     || 'deepseek-chat'

async function qwen(prompt: string, apiKey: string): Promise<unknown> {
  const res = await aiFetch(`${QWEN_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return JSON.parse(json.choices?.[0]?.message?.content ?? '{}')
}

type EntrySnippet = { title: string; sub: string; date: string; bullets: string[] }
type ContactSnippet = { label: string; value: string }
type CatSnippet = { name: string; items: string[] }

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

function pickContacts(arr: unknown[]): ContactSnippet[] {
  return arr.map(c => {
    const r = c as Record<string, unknown>
    return { label: String(r.label ?? ''), value: String(r.value ?? '') }
  })
}

function pickCategories(arr: unknown[]): CatSnippet[] {
  return arr.map(c => {
    const r = c as Record<string, unknown>
    return {
      name:  String(r.name ?? ''),
      items: Array.isArray(r.items) ? (r.items as unknown[]).map(String) : [],
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

function mergeContacts(
  originals: Record<string, unknown>[],
  translated: ContactSnippet[],
): Record<string, unknown>[] {
  return originals.map((orig, i) => {
    const t = translated?.[i]
    if (!t) return orig
    return {
      ...orig,
      label: t.label || orig.label,
      value: t.value || orig.value,
    }
  })
}

function mergeCategories(
  originals: Record<string, unknown>[],
  translated: CatSnippet[],
): Record<string, unknown>[] {
  return originals.map((orig, i) => {
    const t = translated?.[i]
    if (!t) return orig
    return {
      ...orig,
      name:  t.name  || orig.name,
      items: Array.isArray(t.items) && t.items.length ? t.items : orig.items,
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
    const quotaGuard = await checkServerQuota(req, 'translate', deviceId)
    if (quotaGuard) return quotaGuard

    if (JSON.stringify(resumeData).length > 30000)
      return NextResponse.json({ error: 'Resume content too large' }, { status: 413 })

    // Build a stripped payload with only text fields that need translation
    type RD = Record<string, unknown>
    const rd = resumeData as RD
    const rawContacts = (rd.customContacts as unknown[] | undefined) ?? []
    const snippet = {
      name:       docTitle ? String(docTitle) : '',
      personName: String(rd.name ?? ''),
      jobtitle: rd.jobtitle,
      city:     rd.city,
      gender:   rd.gender,
      summary:  rd.summary,
      exp:      pickEntries((rd.exp as unknown[] | undefined) ?? []),
      edu:      pickEntries((rd.edu as unknown[] | undefined) ?? []),
      project:  pickEntries((rd.project as unknown[] | undefined) ?? []),
      award:    pickEntries((rd.award    as unknown[] | undefined) ?? []),
      cert:     pickEntries((rd.cert     as unknown[] | undefined) ?? []),
      volunteer: pickEntries((rd.volunteer as unknown[] | undefined) ?? []),
      interest:  pickEntries((rd.interest as unknown[] | undefined) ?? []),
      language:  pickEntries((rd.language as unknown[] | undefined) ?? []),
      skills: rd.skills,
      skillCategories: Array.isArray(rd.skillCategories)
        ? pickCategories(rd.skillCategories as unknown[])
        : undefined,
      skillCategoriesStash: Array.isArray(rd.skillCategoriesStash)
        ? pickCategories(rd.skillCategoriesStash as unknown[])
        : undefined,
      customContacts: rawContacts.length > 0 ? pickContacts(rawContacts) : undefined,
    }

    const prompt = `You are a professional Chinese-to-English resume translator.
Translate the following JSON resume fields to natural, professional English.

Rules:
1. Translate all Chinese text to professional English.
2. "personName": romanize Chinese names to Pinyin and reorder to Western convention (Given Name + Surname), e.g., 张三 → San Zhang, 王小明 → Xiaoming Wang, 李明 → Ming Li. For already-English or mixed names, keep as-is.
3. Company/university names: use the official English name when well-known (e.g. 字节跳动→ByteDance, 阿里巴巴→Alibaba, 腾讯→Tencent, 美团→Meituan, 北京大学→Peking University, 清华大学→Tsinghua University, 上海交通大学→Shanghai Jiao Tong University), otherwise translate descriptively.
4. Job titles: use standard English equivalents (高级前端工程师→Senior Frontend Engineer, 产品经理→Product Manager).
5. In date fields, replace "至今" with "Present" only; keep numeric formats like "2022.03" unchanged.
6. Bullet points: begin with a strong past-tense action verb; keep all numeric data unchanged.
7. Skills: keep technology names in English as-is (React, TypeScript, etc.); translate non-English skill names. For "skillCategories" and "skillCategoriesStash": translate each category's "name" field (e.g. 前端开发→Frontend Development, 编程语言→Programming Languages); apply the same skill translation rules to the "items" array.
8. City names: translate to standard English (上海→Shanghai, 北京→Beijing, 深圳→Shenzhen, etc.).
9. "gender": translate Chinese gender values (男→Male, 女→Female); keep already-English values as-is.
10. "customContacts": each entry has a "label" and a "value". Translate Chinese labels (e.g. 政治面貌→Political Affiliation, 民族→Ethnicity, 个人主页→Personal Website). Translate Chinese values (e.g. 中共党员→CPC Member, 汉族→Han). Keep URLs, emails, phone numbers, and already-English values unchanged.
11. Return ONLY valid JSON with the exact same field structure as the input. No extra commentary.

Input JSON:
${JSON.stringify(snippet)}`

    const translated = await qwen(prompt, apiKey) as RD

    // Merge translated fields back into original ResumeData (preserving ids, photo, contact, flags, etc.)
    const origCats = (rd.skillCategories as RD[] | undefined) ?? []
    const origStash = (rd.skillCategoriesStash as RD[] | undefined) ?? []
    const result: RD = {
      ...resumeData,
      resumeLang: 'en',
      name:     String(translated.personName || rd.name     || ''),
      jobtitle: String(translated.jobtitle   || rd.jobtitle || ''),
      city:     String(translated.city      || rd.city      || ''),
      gender:   translated.gender != null ? String(translated.gender) : rd.gender,
      summary:  String(translated.summary   || rd.summary   || ''),
      skills:   Array.isArray(translated.skills) ? translated.skills : rd.skills,
      skillCategories: origCats.length > 0
        ? mergeCategories(origCats, Array.isArray(translated.skillCategories) ? (translated.skillCategories as CatSnippet[]) : [])
        : rd.skillCategories,
      skillCategoriesStash: origStash.length > 0
        ? mergeCategories(origStash, Array.isArray(translated.skillCategoriesStash) ? (translated.skillCategoriesStash as CatSnippet[]) : [])
        : rd.skillCategoriesStash,
      customContacts: rawContacts.length > 0
        ? mergeContacts(rawContacts as RD[], Array.isArray(translated.customContacts) ? (translated.customContacts as ContactSnippet[]) : [])
        : rd.customContacts,
      exp:      mergeEntries((rd.exp      as RD[] | undefined) ?? [], (translated.exp      as EntrySnippet[] | undefined) ?? []),
      edu:      mergeEntries((rd.edu      as RD[] | undefined) ?? [], (translated.edu      as EntrySnippet[] | undefined) ?? []),
      project:  mergeEntries((rd.project  as RD[] | undefined) ?? [], (translated.project  as EntrySnippet[] | undefined) ?? []),
      volunteer:mergeEntries((rd.volunteer as RD[] | undefined) ?? [], (translated.volunteer as EntrySnippet[] | undefined) ?? []),
      award:    mergeEntries((rd.award    as RD[] | undefined) ?? [], (translated.award    as EntrySnippet[] | undefined) ?? []),
      cert:     mergeEntries((rd.cert     as RD[] | undefined) ?? [], (translated.cert     as EntrySnippet[] | undefined) ?? []),
      interest: mergeEntries((rd.interest as RD[] | undefined) ?? [], (translated.interest as EntrySnippet[] | undefined) ?? []),
      language: mergeEntries((rd.language as RD[] | undefined) ?? [], (translated.language as EntrySnippet[] | undefined) ?? []),
    }

    const translatedTitle = translated.name ? String(translated.name) : ''
    await incrementQuota(req, 'translate', deviceId)
    return NextResponse.json({ data: result, translatedTitle })
  } catch (e) {
    console.error('translate route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
