import { NextRequest, NextResponse } from 'next/server'
import { guardAI } from '../_guard'

const QWEN_BASE = process.env.QWEN_BASE_URL || 'https://dashscope-us.aliyuncs.com/compatible-mode/v1'
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen3.6-plus'

export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const { resumeData, jobDesc, deviceId } = await req.json()

    const guard = guardAI(req, deviceId)
    if (guard) return guard

    // Input length limits
    if (JSON.stringify(resumeData).length > 10000) {
      return NextResponse.json({ error: 'Resume content too large' }, { status: 413 })
    }
    if (typeof jobDesc === 'string' && jobDesc.length > 3000) {
      return NextResponse.json({ error: 'Job description too large' }, { status: 413 })
    }

    const hasJD = typeof jobDesc === 'string' && jobDesc.trim().length > 0

    const expContext = (resumeData.exp || []).map((e: Record<string, unknown>, i: number) =>
      `工作经历[${i}]: ${e.title} @ ${e.sub}, 描述: ${JSON.stringify(e.bullets)}`
    ).join('\n')
    const projContext = resumeData.hasProject && (resumeData.project || []).length > 0
      ? (resumeData.project as Record<string, unknown>[]).map((e, i) =>
          `项目经历[${i}]: ${e.title} @ ${e.sub}, 描述: ${JSON.stringify(e.bullets)}`
        ).join('\n')
      : ''
    const summaryContext = resumeData.hasSummary && resumeData.summary
      ? `个人简介: ${resumeData.summary}` : ''

    const prompt = `你是资深简历顾问。请从专业招聘视角分析以下简历内容，生成优化建议与最有可能被问到的面试题。

优化规则：
- 总体评估禁止提及候选人姓名，以客观第三方视角描述（"该候选人""此份简历"等）
- 不评价时间信息，只评估内容质量、描述清晰度、成果量化程度
- 每条优化内容禁止以句号（。）或句点（.）结尾
- 优化bullet时用具体动词开头，尽量量化成果，每条50字以内，返回3-5条
- 优化summary时2-3句话，客观务实，不用"显著""大幅"等夸张修饰词
- 最多返回4条优化建议，只为有实质内容的版块生成建议
- tip字段为15字以内的改进摘要

面试题规则：
- 严格根据简历内容生成，必须覆盖：技术深度（4题）、项目细节（4题）、行为问题（3题）、情景问题（2题）、职业规划（2题），共15题
- 每道题具体结合简历中的项目/技术/经历，不要泛泛而谈
- 每道题以问句结尾，不超过50字
- 对每道题生成对应的回答建议，2-3句话，提炼该题的关键作答角度，无需说"你应该"等，直接给出要点

简历信息：
应聘职位：${resumeData.jobtitle || '未填写'}
${summaryContext}
${expContext}
${projContext}
技能：${(resumeData.skills || []).join('、')}
${hasJD ? `\n目标岗位JD：${jobDesc}` : ''}

请返回JSON（仅JSON，无markdown）：
{
  "hasOfferRate": ${hasJD ? 'true' : 'false'},
  ${hasJD ? '"offerRate": 数字(0-100，基于简历与JD匹配度估算，忽略时间因素),' : ''}
  "overview": "2-3句总体分析（禁止提及候选人姓名，不评价时间日期）",
  "suggestions": [
    {
      "id": "exp_0",
      "section": "exp",
      "entryIndex": 0,
      "field": "bullets",
      "label": "工作经历 · {职位名} @ {公司}",
      "tip": "改进摘要（15字以内）",
      "optimizedContent": ["优化后bullet1（不以。结尾）", "bullet2", "bullet3"]
    }
  ],
  "interviewQuestions": ["面试题1？", "面试题2？", "...", "面试题15？"],
  "interviewAnswers": ["题1回答建议（2-3句）", "题2回答建议", "...", "题15回答建议"]
}

suggestions数组说明：
- exp条目：section="exp", field="bullets", entryIndex=索引, optimizedContent=string[]
- project条目：section="project", field="bullets", entryIndex=索引, optimizedContent=string[]
- summary：section="summary", field="summary", entryIndex不需要, optimizedContent=string`

    const res = await fetch(`${QWEN_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        enable_thinking: false,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Qwen analyze error:', err)
      return NextResponse.json({ error: 'Qwen API error' }, { status: 502 })
    }

    const json = await res.json()
    const text = json.choices?.[0]?.message?.content ?? ''
    const result = JSON.parse(text)

    const stripPeriod = (s: string) => s.replace(/[。.！!？?]+$/, '').trim()
    if (Array.isArray(result.suggestions)) {
      result.suggestions = result.suggestions.map((s: Record<string, unknown>) => ({
        ...s,
        optimizedContent: Array.isArray(s.optimizedContent)
          ? (s.optimizedContent as string[]).map(stripPeriod)
          : typeof s.optimizedContent === 'string'
            ? stripPeriod(s.optimizedContent as string)
            : s.optimizedContent,
      }))
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('analyze route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
