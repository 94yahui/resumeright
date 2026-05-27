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
      temperature: 0.3,
      enable_thinking: false,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return JSON.parse(json.choices?.[0]?.message?.content ?? '{}')
}

type RD = Record<string, unknown>
type Entry = { id?: string; title?: string; sub?: string; date?: string; bullets?: string[] }

function pickEntries(arr: unknown[]): Entry[] {
  return arr.map(e => {
    const r = e as RD
    return {
      id:      String(r.id ?? ''),
      title:   String(r.title ?? ''),
      sub:     String(r.sub ?? ''),
      date:    String(r.date ?? ''),
      bullets: Array.isArray(r.bullets) ? (r.bullets as unknown[]).map(String) : [],
    }
  })
}

// Merge compressed entries back and build a diff map keyed by "section:index".
// Each changed bullet becomes "[[~original~]] [[+compressed+]]" — the same inline
// diff format used by the AI analysis panel so the renderer can reuse the same logic.
function mergeWithDiffs(
  secName: string,
  origArr: RD[],
  compArr: Entry[]
): { cleanArr: RD[]; diffs: Record<string, string[]> } {
  const cleanArr: RD[] = []
  const diffs: Record<string, string[]> = {}

  origArr.forEach((orig, i) => {
    const c = compArr?.[i]
    const origBullets: string[] = Array.isArray(orig.bullets) ? (orig.bullets as string[]) : []

    if (!c || !Array.isArray(c.bullets) || !c.bullets.length) {
      cleanArr.push(orig)
      return
    }

    const newBullets = c.bullets
    const diffBullets = newBullets.map((newB, bi) => {
      const oldB = origBullets[bi] ?? ''
      if (!oldB || newB.trim() === oldB.trim()) return newB
      return `[[~${oldB}~]] [[+${newB}+]]`
    })

    if (diffBullets.some(b => b.includes('[[~'))) {
      diffs[`${secName}:${i}`] = diffBullets
    }

    cleanArr.push({ ...orig, bullets: newBullets })
  })

  return { cleanArr, diffs }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const { resumeData, deviceId } = await req.json()

    const guard = guardAI(req, deviceId)
    if (guard) return guard

    const rd = resumeData as RD

    const snippet = {
      summary:   String(rd.summary ?? ''),
      exp:       pickEntries((rd.exp       as unknown[] | undefined) ?? []),
      project:   pickEntries((rd.project   as unknown[] | undefined) ?? []),
      volunteer: pickEntries((rd.volunteer as unknown[] | undefined) ?? []),
    }

    const prompt = `You are a professional Chinese resume editor. Your task is to compress the resume content so it fits on one A4 page.

Rules:
1. Reduce overall text length by 15–25% by removing filler phrases, redundant modifiers, and verbose descriptions.
2. PRESERVE: all quantifiable achievements (numbers, percentages, metrics), technical skills, company names, project names, and key outcomes.
3. REMOVE: vague adjectives (积极主动、善于沟通、吃苦耐劳, etc.), redundant connectors, over-long introductory clauses.
4. Keep all bullets — just make each bullet shorter and more impactful. Never drop a bullet entirely.
5. If summary is present, trim it to 2–3 concise sentences.
6. Return ONLY valid JSON with the exact same structure as the input (same fields, same array lengths). No extra commentary.

Input JSON:
${JSON.stringify(snippet)}`

    const compressed = await qwen(prompt, apiKey) as RD

    const expResult  = mergeWithDiffs('exp',      (rd.exp       as RD[] | undefined) ?? [], (compressed.exp       as Entry[] | undefined) ?? [])
    const prjResult  = mergeWithDiffs('project',  (rd.project   as RD[] | undefined) ?? [], (compressed.project   as Entry[] | undefined) ?? [])
    const volResult  = mergeWithDiffs('volunteer',(rd.volunteer as RD[] | undefined) ?? [], (compressed.volunteer as Entry[] | undefined) ?? [])

    const allDiffs = { ...expResult.diffs, ...prjResult.diffs, ...volResult.diffs }

    const newSummary = String((compressed.summary as string | undefined) || rd.summary || '')
    const oldSummary = String(rd.summary || '')
    const summaryChanged = newSummary.trim() !== oldSummary.trim()

    const result: RD = {
      ...resumeData,
      summary:   newSummary,
      exp:       expResult.cleanArr,
      project:   prjResult.cleanArr,
      volunteer: volResult.cleanArr,
    }

    return NextResponse.json({
      data: result,
      bulletDiffs: allDiffs,
      summaryChanged,
      summaryOld: summaryChanged ? oldSummary : undefined,
      summaryNew: summaryChanged ? newSummary : undefined,
    })
  } catch (e) {
    console.error('compress route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
