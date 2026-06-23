import { NextRequest, NextResponse } from 'next/server'
import { guardAI } from '../_guard'
import { aiFetch } from '../_fetch'

const QWEN_BASE = process.env.QWEN_BASE_URL || 'https://api.deepseek.com'
const QWEN_MODEL = process.env.QWEN_MODEL || 'deepseek-chat'

const SYSTEM = `You are an expert career writer who drafts tailored, convincing cover letters. You write in the candidate's voice — specific, grounded in their real experience, never generic or padded with empty adjectives. You only use facts present in the provided resume and job description; you never invent employers, numbers, or achievements.`

// Build a full plain-text resume digest for the prompt. The whole resume is
// passed through — every section is included so the model can judge for itself
// what's worth weaving into the letter (e.g. a relevant certificate or award).
interface Entry { title?: string; sub?: string; date?: string; bullets?: string[] }
interface ResumeLike {
  name?: string; jobtitle?: string; city?: string; website?: string; summary?: string
  skills?: string[]
  exp?: Entry[]; edu?: Entry[]; project?: Entry[]; award?: Entry[]
  cert?: Entry[]; volunteer?: Entry[]; interest?: Entry[]; language?: Entry[]
}

function digest(r: ResumeLike): string {
  const lines: string[] = []
  if (r.name) lines.push(`Name: ${r.name}`)
  if (r.jobtitle) lines.push(`Current title: ${r.jobtitle}`)
  if (r.city) lines.push(`Location: ${r.city}`)
  if (r.summary) lines.push(`Summary: ${r.summary}`)
  if (r.skills?.length) lines.push(`Skills: ${r.skills.join(', ')}`)
  // No caps — include every entry and every bullet across all sections.
  const section = (label: string, items?: Entry[]) => {
    if (!items?.length) return
    lines.push(`\n${label}:`)
    for (const e of items) {
      const head = [e.title, e.sub, e.date].filter(Boolean).join(' · ')
      if (head) lines.push(`- ${head}`)
      for (const b of (e.bullets ?? [])) if (b.trim()) lines.push(`  • ${b}`)
    }
  }
  section('Experience', r.exp)
  section('Projects', r.project)
  section('Education', r.edu)
  section('Certifications', r.cert)
  section('Awards', r.award)
  section('Volunteer', r.volunteer)
  section('Languages', r.language)
  section('Interests', r.interest)
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const { resumeData, jobDesc, tone, length, deviceId } = await req.json()

    const guard = guardAI(req, deviceId)
    if (guard) return guard

    if (typeof jobDesc === 'string' && jobDesc.length > 8000) {
      return NextResponse.json({ error: 'Job description too large' }, { status: 413 })
    }

    const resume = digest(resumeData ?? {})

    // Match output language to the resume (Chinese resume → Chinese letter).
    const CJK = /[一-鿿]/
    const isZH = CJK.test(resume)

    const toneMap: Record<string, string> = {
      professional: isZH ? '专业、稳重、可信' : 'professional, measured, and credible',
      enthusiastic: isZH ? '热情、积极、有感染力但不浮夸' : 'warm and enthusiastic without being over-the-top',
      concise: isZH ? '简洁、直接、信息密度高' : 'concise, direct, and high-signal',
    }
    const toneNote = toneMap[tone] || toneMap.professional
    const lengthNote = length === 'short'
      ? (isZH ? '约 3 段，半页篇幅（180-250 字）' : 'about 3 short paragraphs, half a page (180-260 words)')
      : (isZH ? '约 4 段，一页篇幅（300-400 字）' : 'about 4 paragraphs, one page (350-450 words)')

    const prompt = isZH
      ? `根据以下简历和岗位描述，写一封量身定制的求职信。

【候选人简历】
${resume}

【岗位描述】
${jobDesc?.trim() || '（未提供具体岗位描述，请基于简历写一封通用但有针对性的求职信）'}

【要求】
1. 语气：${toneNote}
2. 篇幅：${lengthNote}
3. 通盘考虑简历的全部内容（工作、项目、教育、证书、奖项、志愿、语言、兴趣等），自行判断哪些与该岗位最相关，挑出最有说服力的 2-3 个亮点重点展开
4. 【硬规则·只写相关内容】只把与该 JD 直接相关、能为这份工作加分的经历、技能、证书、奖项等写进信里。凡是与岗位无关的内容（无关的证书、奖项、兴趣、与岗位不沾边的经历等）一律不要提及，绝不为了凑字数或显得丰富而硬塞进去。宁可信短，也不要堆砌无关内容
5. 严禁虚构任何雇主、数字、成果或岗位名称——只用简历中已有的信息
6. 以"尊敬的招聘经理"开头，以"此致\\n${resumeData?.name || ''}"结尾
7. 不要使用"显著""极大""非常"等空洞修饰词

仅返回 JSON（无 markdown）：{"letter": "求职信全文，段落之间用 \\n\\n 分隔"}`
      : `Write a tailored cover letter from the resume and job description below.

[CANDIDATE RESUME]
${resume}

[JOB DESCRIPTION]
${jobDesc?.trim() || '(No specific job description provided — write a focused, general-purpose cover letter from the resume.)'}

[REQUIREMENTS]
1. Tone: ${toneNote}
2. Length: ${lengthNote}
3. Consider the entire resume (experience, projects, education, certifications, awards, volunteer work, languages, interests) and decide for yourself what is most relevant to this role; lead with the 2-3 most convincing strengths
4. [HARD RULE — RELEVANT ONLY] Include only experience, skills, certifications, or awards that are directly relevant to this JD and strengthen the case for this job. Leave out anything unrelated to the role (irrelevant certs, awards, interests, off-topic experience). Never pad the letter with unrelated content just to fill space or seem impressive — a shorter, focused letter is better than a padded one
5. Never invent employers, numbers, achievements, or titles — use only what's in the resume
6. Open with "Dear Hiring Manager," and sign off with "Sincerely,\\n${resumeData?.name || ''}"
7. Avoid empty intensifiers like "significantly", "extremely", "very"

Return JSON only (no markdown): {"letter": "full letter text, paragraphs separated by \\n\\n"}`

    const res = await aiFetch(`${QWEN_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('cover-letter API error:', err)
      return NextResponse.json({ error: 'AI API error' }, { status: 502 })
    }

    const json = await res.json()
    const resultText = json.choices?.[0]?.message?.content ?? ''
    const result = JSON.parse(resultText)

    return NextResponse.json(result)
  } catch (e) {
    console.error('cover-letter route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
