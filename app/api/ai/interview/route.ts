import { NextRequest, NextResponse } from 'next/server'
import { guardAI } from '../_guard'
import { aiFetch } from '../_fetch'

const QWEN_BASE  = process.env.QWEN_BASE_URL || 'https://api.deepseek.com'
const QWEN_MODEL = process.env.QWEN_MODEL    || 'deepseek-chat'

async function qwen(prompt: string, apiKey: string, timeoutMs = 90_000): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await aiFetch(`${QWEN_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(await res.text())
    const json = await res.json()
    return JSON.parse(json.choices?.[0]?.message?.content ?? '{}')
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const { resumeData, jobDesc, deviceId } = await req.json()

    // Origin + IP rate limit check (no quota deduction — analyze already counted)
    const guard = guardAI(req, deviceId)
    if (guard) return guard

    const hasJD = typeof jobDesc === 'string' && jobDesc.trim().length > 0

    const CJK = /[一-鿿㐀-䶿]/
    const keyTexts = [
      resumeData?.jobtitle, resumeData?.summary,
      ...((resumeData?.exp ?? []) as Record<string, unknown>[])
        .flatMap(e => (e.bullets as string[]) ?? []).slice(0, 4),
    ].filter(Boolean) as string[]
    const isEN = keyTexts.length > 0 && !keyTexts.some((t: string) => CJK.test(t))
    const langNote = isEN
      ? '\n\n⚠️ The resume is in English. Generate all questions and answers in English.'
      : ''

    const expContext = ((resumeData?.exp ?? []) as Record<string, unknown>[])
      .map((e, i) => `工作经历[${i}]: ${e.title} @ ${e.sub}, 描述: ${JSON.stringify(e.bullets)}`)
      .join('\n')
    const projContext = resumeData?.hasProject && (resumeData?.project ?? []).length > 0
      ? ((resumeData.project as Record<string, unknown>[]))
          .map((e, i) => `项目[${i}]: ${e.title} @ ${e.sub}, 描述: ${JSON.stringify(e.bullets)}`)
          .join('\n')
      : ''

    const resumeSnippet = `应聘职位：${resumeData?.jobtitle || '未填写'}
${resumeData?.summary ? `个人简介: ${resumeData.summary}` : ''}
${expContext}
${projContext}
技能：${((resumeData?.skills ?? []) as string[]).join('、')}
${hasJD ? `\n目标职位要求：${jobDesc.trim()}` : ''}`.trim()

    const prompt = `你是资深面试教练。根据简历生成10道高质量面试题和详细回答建议，返回JSON（仅JSON）：
{
  "interviewQuestions": ["题1？", "题2？", ..., "题10？"],
  "interviewAnswers": ["回答建议1（3-4句，用自然流畅的口语直接回答，不使用情境-行动-结果等任何框架标签）", ..., "回答建议10"]
}
规则：问题结合简历具体项目/技术/经历${hasJD ? '/目标职位' : ''}，覆盖技术深度(3)+项目细节(2)+行为情景(2)+职业规划(2)+${hasJD ? '岗位匹配(1)' : '综合能力(1)'}，每题50字内，回答建议3-4句，像真实作答时说的话，语句自然连贯，不分点列举，不加标签。${langNote}

简历信息：
${resumeSnippet}`

    const data = await qwen(prompt, apiKey) as Record<string, unknown>
    return NextResponse.json({
      interviewQuestions: Array.isArray(data.interviewQuestions) ? data.interviewQuestions : [],
      interviewAnswers:   Array.isArray(data.interviewAnswers)   ? data.interviewAnswers   : [],
    })
  } catch (e) {
    console.error('interview route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
