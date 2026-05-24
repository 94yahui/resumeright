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
      temperature: 0.4,
      enable_thinking: false,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return JSON.parse(json.choices?.[0]?.message?.content ?? '{}')
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const { resumeData, jobDesc, deviceId } = await req.json()

    const guard = guardAI(req, deviceId)
    if (guard) return guard

    if (JSON.stringify(resumeData).length > 10000)
      return NextResponse.json({ error: 'Resume content too large' }, { status: 413 })
    if (typeof jobDesc === 'string' && jobDesc.length > 3000)
      return NextResponse.json({ error: 'Job description too large' }, { status: 413 })

    const hasJD = typeof jobDesc === 'string' && jobDesc.trim().length > 0

    const expContext = (resumeData.exp || []).map((e: Record<string, unknown>, i: number) =>
      `工作经历[${i}]: ${e.title} @ ${e.sub}, 描述: ${JSON.stringify(e.bullets)}`
    ).join('\n')
    const projContext = resumeData.hasProject && (resumeData.project || []).length > 0
      ? (resumeData.project as Record<string, unknown>[]).map((e, i) =>
          `项目[${i}]: ${e.title} @ ${e.sub}, 描述: ${JSON.stringify(e.bullets)}`
        ).join('\n')
      : ''
    const summaryContext = resumeData.hasSummary && resumeData.summary
      ? `个人简介: ${resumeData.summary}` : ''

    const resumeSnippet = `
应聘职位：${resumeData.jobtitle || '未填写'}
${summaryContext}
${expContext}
${projContext}
技能：${(resumeData.skills || []).join('、')}
${hasJD ? `\n目标JD：${jobDesc}` : ''}`.trim()

    // ── 两个请求并行跑 ─────────────────────────────────────────────────────────

    const promptSuggestions = `你是资深简历顾问。分析简历，返回JSON（仅JSON）：
{
  ${hasJD ? `"hasOfferRate": true, "offerRate": 0-100匹配度（忽略时间因素）,` : '"hasOfferRate": false,'}
  "overview": "2-3句总体分析（客观，不提姓名，不评时间）",
  "suggestions": [
    {
      "id": "exp_0",
      "section": "exp",
      "entryIndex": 0,
      "field": "bullets",
      "label": "工作经历·职位@公司",
      "tip": "改进摘要（15字内）",
      "optimizedContent": ["优化bullet（不以。结尾）", "bullet2", "bullet3"]
    }
  ]
}
规则：最多4条建议，只为有实质内容的版块生成，bullet不以句号结尾，50字以内3-5条。

简历信息：
${resumeSnippet}`

    const promptInterview = `你是面试教练。根据简历生成8道高质量面试题和回答建议，返回JSON（仅JSON）：
{
  "interviewQuestions": ["题1？", "题2？", ..., "题8？"],
  "interviewAnswers": ["题1回答要点（2句）", ..., "题8回答要点"]
}
规则：问题具体结合简历中的项目/技术/经历，覆盖技术(3)+项目(2)+行为(2)+职业规划(1)，每题50字内。

简历信息：
${resumeSnippet}`

    // 并行发送两个请求
    const [suggestionsData, interviewData] = await Promise.all([
      qwen(promptSuggestions, apiKey),
      qwen(promptInterview,   apiKey),
    ]) as [Record<string, unknown>, Record<string, unknown>]

    const stripPeriod = (s: string) => s.replace(/[。.！!？?]+$/, '').trim()
    if (Array.isArray(suggestionsData.suggestions)) {
      suggestionsData.suggestions = (suggestionsData.suggestions as Record<string, unknown>[]).map(s => ({
        ...s,
        optimizedContent: Array.isArray(s.optimizedContent)
          ? (s.optimizedContent as string[]).map(stripPeriod)
          : typeof s.optimizedContent === 'string'
            ? stripPeriod(s.optimizedContent as string)
            : s.optimizedContent,
      }))
    }

    return NextResponse.json({ ...suggestionsData, ...interviewData })
  } catch (e) {
    console.error('analyze route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
