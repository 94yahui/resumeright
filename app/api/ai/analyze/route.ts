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

    const resumeSnippet = `应聘职位：${resumeData.jobtitle || '未填写'}
${summaryContext}
${expContext}
${projContext}
技能：${(resumeData.skills || []).join('、')}
${hasJD ? `\n目标职位要求：${jobDesc}` : ''}`.trim()

    // ── 两个请求并行 ──────────────────────────────────────────────────────────

    const existingSkillsStr = (resumeData.skills || []).join('、')

    // ── diff markup format ────────────────────────────────────
    // [[+added or modified words+]]  →  highlight color
    // [[~deleted words~]]            →  strikethrough
    // plain text                     →  unchanged
    const diffExample = `
【行内diff标记规则】
- 未改动的原文：直接保留，不加任何标记
- 在句中新增或改写词语：[[+新增内容+]]
- 删除句中词语：[[~删除内容~]]
- 整条全新增加的bullet：[[+完整新增bullet内容+]]
- 整条删除的bullet：[[~完整删除bullet内容~]]
示例（原bullet："参与外卖App H5核心交互开发，提升用户体验"）
→ 修改后："参与外卖App H5核心交互开发[[+，覆盖300万日活用户+]]，提升[[~用户体验~]][[+核心转化率18%+]]"
注意：标记符号[[+ +]]和[[~ ~]]内部不能再嵌套，纯文本resume内容不含这两种符号，请放心使用。`

    const promptSuggestions = hasJD
      ? `你是资深简历顾问，现在处于【岗位定向优化模式】。
任务：结合目标职位描述，深挖用户简历中隐藏的可关联潜在能力与成果，进行针对性补全或润色，让简历精准命中岗位需求。
核心原则：①只基于已有经历包装，严禁虚构 ②若描述已优秀则仅做局部增删修改 ③优先工作经历、技能、个人简介等核心版块。
${diffExample}

请严格按以下JSON格式返回，suggestions包含4到6条：
{
  "hasOfferRate": true,
  "offerRate": <整数0-100，综合考量经验/技能/学历匹配度>,
  "jobInfo": {"title": <职位名称或null>, "company": <公司名或null>, "location": <地点或null>, "type": <"全职"/"兼职"/"实习"或null>},
  "matchBreakdown": {"overall": <0-100>, "experience": <0-100>, "skills": <0-100>, "other": <0-100>},
  "missingSkills": [<3到6条，每条10字内，以"需"开头>],
  "overview": <3-4句：2个契合点 + 2个差距 + 最关键改进建议>,
  "suggestions": [
    {
      "id": "summary_0", "section": "summary", "entryIndex": 0, "field": "summary",
      "label": <如"个人简介">,
      "tip": <针对目标职位的改写方向，15字内>,
      "changeDescription": <30字内：改了什么、带来什么核心竞争优势>,
      "optimizedContent": [<针对目标职位改写的简介，可使用diff标记，1-2句>]
    },
    {
      "id": "exp_0", "section": "exp", "entryIndex": 0, "field": "bullets",
      "label": <如"工作经历·职位@公司">,
      "tip": <改写重点，15字内>,
      "changeDescription": <30字内：改了哪个模块、具体改动及核心竞争优势>,
      "optimizedContent": [<完整bullet列表，每条使用diff标记标注改动；未改动bullet原文输出；每条50字内>]
    },
    {
      "id": "skills_0", "section": "skills", "entryIndex": 0, "field": "skills",
      "label": "技能补充建议",
      "tip": <15字内>,
      "changeDescription": null,
      "optimizedContent": [<仅列出岗位要求但简历没有的技能；简历已有：${existingSkillsStr}；不能含已有技能；斜杠组合如"Kubernetes/Kafka"必须拆成两个独立条目；无缺失则返回[]>]
    }
  ]
}
规则：①只为实际有内容的版块生成建议 ②每条bullet不以句号结尾 ③entryIndex从0开始 ④skills的optimizedContent为[]时整条省略。

简历信息：
${resumeSnippet}`
      : `你是资深简历顾问，现在处于【简历润色模式】。
任务：逐条审视简历描述，找出表达薄弱、缺乏说服力或信息不足的地方，进行针对性加强；若描述已足够清晰有力则仅做最小改动。
核心原则：①只基于已有经历润色，严禁虚构或夸大 ②量化数据必须有依据，不得凭空捏造数字 ③不生成技能建议（用户未填目标职位）④不改动已经优秀的描述。
${diffExample}

请按以下JSON格式返回（不包含skills建议）：
{
  "hasOfferRate": false,
  "overview": <2-3句：最突出优势 + 最需改进方向>,
  "suggestions": [
    {
      "id": "summary_0", "section": "summary", "entryIndex": 0, "field": "summary",
      "label": "个人简介",
      "tip": <STAR改写重点，15字内>,
      "changeDescription": <30字内：改了什么、带来什么核心竞争优势>,
      "optimizedContent": [<改写后的简介，可使用diff标记，1-2句>]
    },
    {
      "id": "exp_0", "section": "exp", "entryIndex": 0, "field": "bullets",
      "label": <如"工作经历·职位@公司">,
      "tip": <量化改写重点，15字内>,
      "changeDescription": <30字内：改了哪个模块、具体改动及核心竞争优势>,
      "optimizedContent": [<完整bullet列表，使用diff标记标注改动；未改动原文输出；每条50字内>]
    },
    {
      "id": "exp_1", "section": "exp", "entryIndex": 1, "field": "bullets",
      "label": <第二段工作经历>,
      "tip": <改写重点，15字内>,
      "changeDescription": <30字内：改了什么、带来什么优势>,
      "optimizedContent": [<完整bullet列表，使用diff标记>]
    }
  ]
}
规则：①只为实际有内容的版块生成建议 ②bullet不以句号结尾 ③entryIndex从0开始 ④不含任何skills建议。

简历信息：
${resumeSnippet}`

    const promptInterview = `你是资深面试教练。根据简历生成10道高质量面试题和详细回答建议，返回JSON（仅JSON）：
{
  "interviewQuestions": ["题1？", "题2？", ..., "题10？"],
  "interviewAnswers": ["回答建议1（3-4句，含STAR框架提示或关键词）", ..., "回答建议10"]
}
规则：问题结合简历具体项目/技术/经历${hasJD ? '/目标职位' : ''}，覆盖技术深度(3)+项目细节(2)+行为情景(2)+职业规划(2)+${hasJD ? '岗位匹配(1)' : '综合能力(1)'}，每题50字内，回答3-4句具体实用。

简历信息：
${resumeSnippet}`

    // 并行发送两个请求
    const [suggestionsData, interviewData] = await Promise.all([
      qwen(promptSuggestions, apiKey),
      qwen(promptInterview,   apiKey),
    ]) as [Record<string, unknown>, Record<string, unknown>]

    const stripPeriod = (s: string) => s.replace(/[。.！!？?]+$/, '').trim()
    const stripDiff = (s: string) => s.replace(/\[\[~.*?~\]\]/g, '').replace(/\[\[\+(.*?)\+\]\]/g, '$1').trim()
    const existingSkillsLower = new Set(
      (resumeData.skills || []).map((s: string) => s.toLowerCase().trim())
    )

    if (Array.isArray(suggestionsData.suggestions)) {
      suggestionsData.suggestions = (suggestionsData.suggestions as Record<string, unknown>[])
        .map(s => {
          const isBullets = (s.field === 'bullets') && (s.section === 'exp' || s.section === 'project')
          const cleanContent = (b: string) => isBullets ? stripPeriod(b) : stripPeriod(stripDiff(b))
          const next = {
            ...s,
            optimizedContent: Array.isArray(s.optimizedContent)
              ? (s.optimizedContent as string[]).map(cleanContent)
              : typeof s.optimizedContent === 'string'
                ? cleanContent(s.optimizedContent as string)
                : s.optimizedContent,
          }

          // Skills: split compound entries, strictly exclude already-existing skills
          if (s.section === 'skills' && Array.isArray(next.optimizedContent)) {
            const split = (next.optimizedContent as string[])
              .flatMap(sk =>
                sk.split(/[/／·&]|(?:\s+(?:and|及|与|和)\s+)|\s*,\s*/)
                  .map(p => p.trim())
                  .filter(Boolean)
              )
              .filter(sk => !existingSkillsLower.has(sk.toLowerCase().trim()))
            next.optimizedContent = split
          }

          return next
        })
        // Remove skills suggestions that ended up with an empty list after filtering
        .filter(s => {
          if ((s as Record<string, unknown>).section === 'skills') {
            return Array.isArray(s.optimizedContent) && (s.optimizedContent as unknown[]).length > 0
          }
          return true
        })
    }

    // No-JD mode: strip any skills suggestions the model might have included anyway
    if (!hasJD && Array.isArray(suggestionsData.suggestions)) {
      suggestionsData.suggestions = (suggestionsData.suggestions as Record<string, unknown>[])
        .filter(s => s.section !== 'skills')
    }

    // Server-side enforcement: when JD is provided, ensure required fields always present
    // regardless of whether the AI model included them in its JSON output.
    if (hasJD) {
      suggestionsData.hasOfferRate = true
      if (typeof suggestionsData.offerRate !== 'number') {
        const jb = suggestionsData.matchBreakdown as { overall?: number; experience?: number; skills?: number; other?: number } | null
        const derived = jb?.overall ?? (jb
          ? Math.round(((jb.experience ?? 50) + (jb.skills ?? 50) + (jb.other ?? 50)) / 3)
          : null)
        suggestionsData.offerRate = derived ?? 50
      }
    } else {
      suggestionsData.hasOfferRate = false
    }

    return NextResponse.json({ ...suggestionsData, ...interviewData })
  } catch (e) {
    console.error('analyze route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
