import { NextRequest, NextResponse } from 'next/server'
import { guardAI, checkServerQuota, incrementQuota } from '../_guard'
import { aiFetch } from '../_fetch'

export const maxDuration = 60 // Vercel Hobby plan max (seconds)

const QWEN_BASE         = process.env.QWEN_BASE_URL     || 'https://api.deepseek.com'
const QWEN_MODEL        = process.env.QWEN_MODEL        || 'deepseek-chat'
const QWEN_FAST_MODEL   = process.env.QWEN_FAST_MODEL   || 'deepseek-chat'

const EXPERT_SYSTEM = `你是一位拥有15年招聘与人才管理经验的资深简历顾问，曾担任多家世界500强企业的人才招聘总监，深度参与过数万份简历的筛选与评估。你精通用STAR原则（Action强力动词开头/Result呈现可衡量成果）改写简历描述，熟悉互联网、金融、快消、制造、医疗等主流行业的岗位要求与筛选标准。核心能力：精准识别简历弱点，用"主导/设计/推动/实现/重构"等强力动词替换"参与/负责/协助/支持"等弱动词，在不虚构任何信息的前提下最大化候选人竞争力。`

async function qwen(prompt: string, apiKey: string, timeoutMs = 90_000, systemMsg?: string): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await aiFetch(`${QWEN_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          ...(systemMsg ? [{ role: 'system', content: systemMsg }] : []),
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
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

/**
 * Distills a raw job posting down to just the relevant requirements using a
 * fast/cheap model. Strips company intro, benefits, location, salary info, etc.
 * Falls back to the original text if the call fails.
 */
async function distillJobDesc(raw: string, apiKey: string): Promise<string> {
  // Short JDs are likely already focused — skip the extra call
  if (raw.length <= 800) return raw
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15_000)
    let res: Response
    try {
      res = await aiFetch(`${QWEN_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: QWEN_FAST_MODEL,
          messages: [{
            role: 'user',
            content: `从下面的招聘JD中，只提取【职位名称、核心职责、技能要求、任职资格】，删除公司介绍、福利待遇、薪资、通勤地点、申请方式等无关内容。尽量保留原文措辞，精简输出，不超过600字。\n\nJD原文：\n${raw}`,
          }],
          temperature: 0.1,
          max_tokens: 800,
        }),
        signal: ctrl.signal,
      })
    } finally {
      clearTimeout(timer)
    }
    if (!res.ok) return raw
    const json = await res.json()
    const distilled = json.choices?.[0]?.message?.content?.trim()
    return distilled && distilled.length > 50 ? distilled : raw
  } catch {
    return raw
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const { resumeData, jobDesc, deviceId } = await req.json()

    const guard = guardAI(req, deviceId)
    if (guard) return guard
    const quotaGuard = await checkServerQuota(req, 'analyze', deviceId)
    if (quotaGuard) return quotaGuard

    if (JSON.stringify(resumeData).length > 30000)
      return NextResponse.json({ error: 'Resume content too large' }, { status: 413 })
    if (typeof jobDesc === 'string' && jobDesc.length > 3000)
      return NextResponse.json({ error: 'Job description too large' }, { status: 413 })

    const rawJD = typeof jobDesc === 'string' ? jobDesc.trim() : ''
    const hasJD = rawJD.length > 0
    // Distill JD to requirements-only before building the analysis prompt
    const effectiveJD = hasJD ? await distillJobDesc(rawJD, apiKey) : ''

    // Detect English resume: no CJK characters in key text fields
    const CJK = /[一-鿿㐀-䶿]/
    const keyTexts = [
      resumeData.jobtitle, resumeData.summary,
      ...(resumeData.exp ?? []).flatMap((e: Record<string, unknown>) => (e.bullets as string[]) ?? []).slice(0, 4),
    ].filter(Boolean) as string[]
    const isEN = keyTexts.length > 0 && !keyTexts.some((t: string) => CJK.test(t))

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
${hasJD ? `\n目标职位要求：${effectiveJD}` : ''}`.trim()

    // ── 两个请求并行 ──────────────────────────────────────────────────────────

    const existingSkillsStr = (resumeData.skills || []).join('、')
    // Language instruction appended to both prompts for English resumes
    const langNote = isEN
      ? `\n\n⚠️ ENGLISH RESUME MODE — The following rules OVERRIDE all Chinese-specific instructions above:

LANGUAGE: Every field in the output (overview, tip, label, changeDescription, optimizedContent, missingSkills, skill names) MUST be written in English.

POWER VERBS: Replace weak verbs (worked on / helped / was responsible for / participated in / assisted with) with strong action verbs such as: Led, Architected, Designed, Built, Implemented, Spearheaded, Optimized, Delivered, Scaled, Launched, Drove, Streamlined, Owned, Championed, Overhauled.

BULLET LENGTH: Target 15–25 words per bullet. Ignore the 50-character limit.

REWRITING DEPTH: The "no full-sentence replacement" restriction is LIFTED for English. You MAY rewrite entire bullets from scratch when the original is vague, passive, or weak — quality rewrites are preferred over micro-edits.
${hasJD ? `
JOB-DESCRIPTION ALIGNMENT (JD provided — apply all three):
• ADD: You MAY add 1–2 new bullets to an experience or project entry when the JD requires a responsibility or skill that is clearly inferable from the candidate's existing work context (e.g., candidate worked at a SaaS company + JD requires Agile ceremonies → add a bullet about sprint/scrum facilitation). Mark new bullets with [[+...+]].
• REMOVE: You MAY remove or replace bullets that strongly contradict the target role's seniority or focus (e.g., detailed manual QA steps on a resume targeting a senior engineering role). Mark removed bullets with [[~...~]].
• EMPHASIZE: Surface outcomes, leadership scope, cross-functional collaboration, and technical depth that the JD explicitly calls out.` : ''}

STAR PRINCIPLE (English): Action verb → Context/Scale → Method or Tool used → Measurable Result. Never invent specific numbers or percentages not present in the original resume.`
      : ''

    // ── diff markup format ────────────────────────────────────
    // [[+added or modified words+]]  →  highlight color
    // [[~deleted words~]]            →  strikethrough
    // plain text                     →  unchanged
    const diffExample = `
【STAR改写原则】
每条bullet改写时优先遵循：
- Action：句首用强力动词（主导/设计/推动/实现/重构/搭建），替换弱动词（参与/负责/协助/支持/完成）
- Result：尽量呈现可衡量的结果或业务影响（范围、效率、质量、覆盖用户数等）
- 若原文缺少Result层，可基于Action合理推断补充，但严禁虚构具体数字或百分比

【行内diff标记规则（强制执行）】
每条bullet必须用diff标记标注实际改动，未改动的文字直接保留、不加任何标记。
标记用法：
- 仅替换句中某个词语：[[~原词~]][[+新词+]]（紧挨着写，中间无空格）
- 仅在句中新增内容：[[+新增内容+]]
- 仅删除句中某些字：[[~删除内容~]]
- 整条bullet全部新增：[[+完整内容+]]
- 整条bullet全部删除：[[~完整内容~]]

⛔ 严禁整句替换：若要改动，必须精确标出变化的词语，每个diff片段通常不超过10个字。
⛔ 若某条bullet已经清晰有力无需修改，直接原样输出，不加任何标记。
⛔ 严禁凭空添加原文中不存在的具体数字、百分比或量化指标。

✅ 正确示例（原文："参与外卖App H5核心交互开发，提升用户体验"）
   → "[[~参与~]][[+主导+]]外卖App H5核心交互开发[[~，提升用户体验~]][[+，优化核心下单流程，提升下单转化率+]]"
❌ 错误示例（整句替换，绝对禁止）
   → "[[~参与外卖App H5核心交互开发，提升用户体验~]][[+主导外卖App H5核心交互开发与优化，重构下单流程+]]"

注意：标记符号内部不能再嵌套。`

    const promptSuggestions = hasJD
      ? `【岗位定向优化模式】
任务：结合目标职位描述，对简历进行全面的精准重构——优化现有内容、挖掘隐藏经验、移除不相关条目、提炼新项目条目、补全经历框架，让简历精准命中岗位需求。
核心原则：①以简历已有内容为主，若JD要求的技能/方法论与工作背景高度相关可合理推断补充 ②严禁捏造项目成果、核心技术或具体数字 ③若原文无数字，绝对不得添加量化数据 ④优先工作经历、项目经历、技能、个人简介。
${diffExample}

【四类建议说明】
A. 常规优化（改写bullet）：用diff标记标注改动，每条20到40字
B. 建议移除（action:"remove"）：整段工作/项目经历与JD方向明显不符，建议移除以突出重点
C. 新增项目（action:"add"）：用户工作描述中有可提炼为独立项目的内容，且用户项目版块为空或薄弱时使用
D. 补充框架（action:"fill"）：JD明确要求某类经历但用户完全没有相关背景，生成带[[?占位符?]]的草稿框架供用户填写

请严格按以下JSON格式返回，suggestions包含4到8条（视情况选用A/B/C/D类型组合）：
{
  "hasOfferRate": true,
  "offerRate": <整数0-100，综合考量经验/技能/学历匹配度>,
  "jobInfo": {"title": <职位名称或null>, "company": <公司名或null>, "location": <地点或null>, "type": <"全职"/"兼职"/"实习"或null>},
  "matchBreakdown": {"overall": <0-100>, "experience": <0-100>, "skills": <0-100>, "other": <0-100>},
  "missingSkills": [<3到6条岗位要求但简历缺失的技能关键词，每条10字内，仅技能名称，不加任何前缀>],
  "overview": <3-4句：2个契合点 + 2个差距 + 最关键改进建议；若有不相关经历请点名说明>,
  "suggestions": [
    {
      "id": "summary_0", "section": "summary", "entryIndex": 0, "field": "summary",
      "label": <如"个人简介">,
      "tip": <针对目标职位的改写方向，15字内>,
      "changeDescription": <30字内：改了什么、带来什么核心竞争优势>,
      "optimizedContent": [<针对目标职位改写的简介，必须使用diff标记标注改动词语，1-2句>]
    },
    {
      "id": "exp_0", "section": "exp", "entryIndex": 0, "field": "bullets",
      "label": <如"工作经历·职位@公司">,
      "tip": <改写重点，15字内>,
      "changeDescription": <30字内：改了哪个模块、具体改动及核心竞争优势>,
      "optimizedContent": [<完整bullet列表，每条必须用diff标记精确标注改动词语（禁止整句替换）；未改动bullet原样输出；每条20到40字>]
    },
    {
      "id": "project_0", "section": "project", "entryIndex": 0, "field": "bullets",
      "label": <如"项目经历·项目名">,
      "tip": <改写重点，15字内>,
      "changeDescription": <30字内：改了哪个模块、具体改动及核心竞争优势>,
      "optimizedContent": [<完整bullet列表，每条必须用diff标记精确标注改动词语（禁止整句替换）；未改动bullet原样输出；每条20到40字>]
    },
    {
      "id": "skills_0", "section": "skills", "entryIndex": 0, "field": "skills",
      "label": ${isEN ? '"Skills to Add"' : '"技能补充建议"'},
      "tip": <15字内>,
      "changeDescription": null,
      "optimizedContent": [<仅列出岗位要求但简历没有的技能；简历已有：${existingSkillsStr}；不能含已有技能；斜杠组合如"Kubernetes/Kafka"必须拆成两个独立条目；无缺失则返回[]>]
    },
    {
      "id": "exp_2", "section": "exp", "entryIndex": 2, "field": "bullets",
      "action": "remove",
      "label": <如"建议移除·运营专员@某公司">,
      "tip": <15字内，说明为何不符>,
      "changeDescription": <30字内：该经历方向与JD不符的具体原因，保留会有什么负面影响>,
      "optimizedContent": []
    },
    {
      "id": "new_project_0", "section": "project", "entryIndex": -1, "field": "bullets",
      "action": "add",
      "label": <如"建议新增项目·低代码平台搭建">,
      "tip": <15字内>,
      "changeDescription": <30字内：从哪段工作经历提炼、为何作为项目展示更有说服力>,
      "newEntry": {
        "title": <项目名称>,
        "sub": <担任角色，如"技术负责人">,
        "date": <时间范围，从工作经历推断>,
        "bullets": [<3条描述，每条20到40字，强动词+行为+结果>]
      },
      "optimizedContent": []
    },
    {
      "id": "fill_0", "section": "exp", "entryIndex": -1, "field": "bullets",
      "action": "fill",
      "label": <如"建议补充：数据分析经历框架">,
      "tip": <15字内，目标职位要求此能力>,
      "changeDescription": <30字内：JD中哪个要求触发了此建议，补充后有什么价值>,
      "newEntry": {
        "title": "[[?职位/项目名称?]]",
        "sub": "[[?公司或团队?]]",
        "date": "[[?起止时间?]]",
        "bullets": [<2-3条带[[?占位符?]]的框架描述，占位符用[[?...?]]标注，描述20到40字>]
      },
      "optimizedContent": []
    }
  ]
}
规则：①只为实际有内容的版块生成常规优化建议 ②bullet不以句号结尾 ③entryIndex从0开始，新增类entryIndex为-1 ④skills的optimizedContent为[]时整条省略 ⑤remove仅在整段经历与JD明显不符时使用，不得滥用 ⑥add仅在工作描述中有可提炼项目且用户项目版块薄弱时使用 ⑦fill仅在JD硬性要求而用户完全无相关背景时使用，非必要不生成。${langNote}

简历信息：
${resumeSnippet}`
      : `【简历润色模式】
任务：全面诊断简历内容，按优先级依次处理以下四类问题，每条bullet独立判断：

【问题检测优先级】
① 错别字 / 语法错误（最高优先）
   - 错别字、同音字误用（如"的地得"混用、"已以"混用）、标点堆叠等
   - 直接修正，diff标记精确标出变化字符
   - tip写"修正错别字"或"修正语法"

② 描述过短（单条bullet少于15字）
   - 基于该条已有信息 + 所在职位/公司上下文，合理补充：行为方式、使用工具、或初步结果
   - 补充内容必须是可以从职位性质合理推断的，不得虚构具体数字或项目名
   - 例："负责后台开发" → "[[~负责~]][[+主导+]]后台[[+核心模块+]]开发[[+，使用Spring Boot搭建RESTful接口+]]"
   - tip写"描述过短，已补充细节"

③ 动词薄弱 / 表达被动（参与/负责/协助/支持/完成 → 主导/设计/推动/搭建/优化）
   - 用STAR原则：强力动词开头 → 行为 → 结果/影响
   - tip写"强化动词表达"

④ 逻辑不清 / 缺少结果层（已有清晰行动但无结果说明）
   - 在不虚构数字的前提下补充结果方向（"提升稳定性""缩短交付周期"等）
   - tip写"补充结果层"

核心约束：
- 严禁虚构任何原文未提及的技术、项目成果、具体数字或百分比
- 若某条bullet四类问题均无，原样输出，不加标记
- 不生成技能建议
${diffExample}

请按以下JSON格式返回：
{
  "hasOfferRate": false,
  "overview": <2-3句：检测到的主要问题类型（如"存在X条描述过短、Y处弱动词"）+ 最突出优势 + 最需改进方向>,
  "suggestions": [
    {
      "id": "summary_0", "section": "summary", "entryIndex": 0, "field": "summary",
      "label": "个人简介",
      "tip": <改写重点，15字内>,
      "changeDescription": <30字内：改了什么问题、带来什么改善>,
      "optimizedContent": [<改写后的简介，必须使用diff标记标注改动词语，1-2句>]
    },
    {
      "id": "exp_0", "section": "exp", "entryIndex": 0, "field": "bullets",
      "label": <如"工作经历·职位@公司">,
      "tip": <检测到的主要问题类型，15字内>,
      "changeDescription": <30字内：检测到几类问题、如何处理>,
      "optimizedContent": [<完整bullet列表，每条按四类问题独立处理；用diff标记标出改动；未改动原样输出；每条20到40字；原文过短时可补充细节但总长不超过40字>]
    },
    {
      "id": "exp_1", "section": "exp", "entryIndex": 1, "field": "bullets",
      "label": <第二段工作经历>,
      "tip": <检测到的主要问题类型，15字内>,
      "changeDescription": <30字内：检测到几类问题、如何处理>,
      "optimizedContent": [<完整bullet列表，每条按四类问题独立处理；用diff标记标出改动；未改动原样输出；每条20到40字；原文过短时可补充细节但总长不超过40字>]
    },
    {
      "id": "project_0", "section": "project", "entryIndex": 0, "field": "bullets",
      "label": <如"项目经历·项目名">,
      "tip": <检测到的主要问题类型，15字内>,
      "changeDescription": <30字内：检测到几类问题、如何处理>,
      "optimizedContent": [<完整bullet列表，每条按四类问题独立处理；用diff标记标出改动；未改动原样输出；每条20到40字；原文过短时可补充细节但总长不超过40字>]
    }
  ]
}
规则：①只为实际有内容的版块生成建议（没有项目经历时不生成project建议）②bullet不以句号结尾 ③entryIndex从0开始 ④不含任何skills建议 ⑤若某个版块所有bullet均无问题，不生成该版块的suggestion。${langNote}

简历信息：
${resumeSnippet}`

    const suggestionsData = await qwen(promptSuggestions, apiKey, 55_000, EXPERT_SYSTEM) as Record<string, unknown>

    const stripPeriod = (s: string) => s.replace(/[。.！!？?]+$/, '').trim()

    // Compute a word/character-level LCS diff between two clean text strings.
    // Returns the new text annotated with [[+add+]] / [[~del~]] at word/char granularity.
    function lcsWordDiff(oldText: string, newText: string): string {
      if (oldText === newText) return newText
      const CJK_RE = /[一-鿿㐀-䶿　-〿＀-￯]/
      const tokenize = (s: string): string[] => {
        const tokens: string[] = []
        let i = 0
        while (i < s.length) {
          if (CJK_RE.test(s[i])) { tokens.push(s[i]); i++ }
          else if (s[i] === ' ') { tokens.push(' '); i++ }
          else {
            let j = i
            while (j < s.length && s[j] !== ' ' && !CJK_RE.test(s[j])) j++
            if (j > i) tokens.push(s.slice(i, j))
            i = j
          }
        }
        return tokens
      }
      const a = tokenize(oldText), b = tokenize(newText)
      const m = a.length, n = b.length
      const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
      for (let ii = 1; ii <= m; ii++)
        for (let jj = 1; jj <= n; jj++)
          dp[ii][jj] = a[ii-1] === b[jj-1] ? dp[ii-1][jj-1] + 1 : Math.max(dp[ii-1][jj], dp[ii][jj-1])
      type Seg = { type: 'keep'|'add'|'del'; text: string }
      const segs: Seg[] = []
      let ii = m, jj = n
      while (ii > 0 || jj > 0) {
        if (ii > 0 && jj > 0 && a[ii-1] === b[jj-1]) { segs.unshift({ type: 'keep', text: a[ii-1] }); ii--; jj-- }
        else if (jj > 0 && (ii === 0 || dp[ii][jj-1] >= dp[ii-1][jj])) { segs.unshift({ type: 'add', text: b[jj-1] }); jj-- }
        else { segs.unshift({ type: 'del', text: a[ii-1] }); ii-- }
      }
      const merged: Seg[] = []
      for (const seg of segs) {
        if (merged.length && merged[merged.length-1].type === seg.type) merged[merged.length-1].text += seg.text
        else merged.push({ ...seg })
      }
      return merged.map(seg =>
        seg.type === 'keep' ? seg.text :
        seg.type === 'add'  ? `[[+${seg.text}+]]` : `[[~${seg.text}~]]`
      ).join('')
    }
    // Strip common Chinese descriptive suffixes so "Rust语言经验" → "Rust", "CI/CD流水线" → "CI/CD"
    const cleanSkillName = (s: string): string =>
      s.replace(/[（(].*?[)）]/g, '')   // strip parenthetical annotations
       .replace(/(语言)?[开发]?经验$/u, '')
       .replace(/编程语言$|语言$/u, '')
       .replace(/流水线$/u, '')
       .replace(/流程$/u, '')
       .replace(/技术栈$|技术体系$/u, '')
       .replace(/工具链$|工具$/u, '')
       .replace(/平台$/u, '')
       .replace(/基础$/u, '')
       .replace(/能力$/u, '')
       .replace(/相关$/u, '')
       .replace(/知识$/u, '')
       .trim()
    const STRAY_SERVER = /\[\[[\+~]|[\+~]\]\]|\[\[|\]\]/g
    const stripDiff = (s: string) => s
      .replace(/\[\[~((?:[^~]|~(?!\]\]))*?)~\]\]/g, '')
      .replace(/\[\[\+((?:[^+]|\+(?!\]\]))*)\+\]\]/g, '$1')
      .replace(STRAY_SERVER, '')
      .trim()
    const existingSkillsLower = new Set(
      (resumeData.skills || []).map((s: string) => s.toLowerCase().trim())
    )

    if (Array.isArray(suggestionsData.suggestions)) {
      suggestionsData.suggestions = (suggestionsData.suggestions as Record<string, unknown>[])
        .map(s => {
          // Normalize section + entryIndex from the id field — the model sometimes mislabels section
          // id format: "exp_0", "project_1", "summary_0", "skills_0"
          const idMatch = /^(exp|project|summary|skills|award|cert|volunteer|language)_(\d+)$/.exec(s.id as string ?? '')
          if (idMatch) {
            s = { ...s, section: idMatch[1], entryIndex: parseInt(idMatch[2], 10) }
          }

          const isActionCard = s.action === 'remove' || s.action === 'add' || s.action === 'fill'
          const isBullets = !isActionCard && (s.field === 'bullets') && (s.section === 'exp' || s.section === 'project')
          const next: Record<string, unknown> = { ...s }

          if (isActionCard) {
            // Inject stable entryId for remove cards so client can find the right entry even if order changed
            if (s.action === 'remove' && s.entryIndex !== undefined) {
              const sec = s.section as string
              const entry = (resumeData[sec] as Record<string, unknown>[] | undefined)?.[s.entryIndex as number]
              if (entry?.id) next.entryId = entry.id
            }
          } else if (isBullets && Array.isArray(s.optimizedContent)) {
            // Strip AI-produced diff markers and recompute a proper word-level diff.
            const sec = s.section as string
            const entryIdx = s.entryIndex as number
            const origBullets: string[] = (resumeData[sec]?.[entryIdx]?.bullets ?? []) as string[]
            next.optimizedContent = (s.optimizedContent as string[]).map((b, i) => {
              const cleanB = stripPeriod(stripDiff(b))
              if (!cleanB) return ''
              if (i >= origBullets.length) return `[[+${cleanB}+]]`   // new bullet
              const origB = stripPeriod((origBullets[i] ?? '').trim())
              if (cleanB === origB) return origB                        // unchanged
              return lcsWordDiff(origB, cleanB)                         // fine-grained diff
            }).filter(Boolean)
          } else {
            const cleanContent = (b: string) => stripPeriod(stripDiff(b))
            next.optimizedContent = Array.isArray(s.optimizedContent)
              ? (s.optimizedContent as string[]).map(cleanContent)
              : typeof s.optimizedContent === 'string'
                ? cleanContent(s.optimizedContent as string)
                : s.optimizedContent
          }

          // Skills: split compound entries, clean names, strictly exclude already-existing skills
          if (s.section === 'skills' && Array.isArray(next.optimizedContent)) {
            const split = (next.optimizedContent as string[])
              .flatMap(sk =>
                sk.split(/[/／·&]|(?:\s+(?:and|及|与|和)\s+)|\s*,\s*/)
                  .map(p => cleanSkillName(p.trim()))
                  .filter(Boolean)
              )
              .filter(sk => !existingSkillsLower.has(sk.toLowerCase().trim()))
            next.optimizedContent = split
          }

          return next
        })
        // Remove skills suggestions that ended up with an empty list after filtering
        .filter(s => {
          // Action cards always pass through
          if ((s as Record<string, unknown>).action) return true
          if ((s as Record<string, unknown>).section === 'skills') {
            return Array.isArray(s.optimizedContent) && (s.optimizedContent as unknown[]).length > 0
          }
          // Drop exp/project suggestions where every bullet is identical to the original after applying diff
          const sec = (s as Record<string, unknown>).section as string
          if ((sec === 'exp' || sec === 'project') && Array.isArray(s.optimizedContent)) {
            const entryIdx = (s as Record<string, unknown>).entryIndex as number
            const originalBullets: string[] = (resumeData[sec]?.[entryIdx]?.bullets ?? []) as string[]
            const optimized = s.optimizedContent as string[]
            const normalize = (b: string) => stripDiff(b).replace(/[。.！!？?]+$/, '').trim()
            const hasChange = optimized.some((b: string, i: number) =>
              normalize(b) !== normalize(originalBullets[i] ?? '')
            )
            return hasChange
          }
          return true
        })
    }

    // No-JD mode: strip any skills suggestions the model might have included anyway
    if (!hasJD && Array.isArray(suggestionsData.suggestions)) {
      suggestionsData.suggestions = (suggestionsData.suggestions as Record<string, unknown>[])
        .filter(s => s.section !== 'skills')
    }

    // When JD is provided and the model didn't return a skills suggestion (or it was filtered
    // out as empty), synthesise one from missingSkills so the user always gets skill checkboxes.
    if (hasJD && Array.isArray(suggestionsData.missingSkills) && (suggestionsData.missingSkills as string[]).length > 0) {
      const suggs = suggestionsData.suggestions as Record<string, unknown>[]
      const hasSkillsSugg = Array.isArray(suggs) && suggs.some(s => s.section === 'skills')
      if (!hasSkillsSugg) {
        const skillNames = (suggestionsData.missingSkills as string[])
          .map((ms: string) => cleanSkillName(
            ms.replace(/^需(掌握|了解|熟悉|具备|会|使用|学习)?/u, '')
              .replace(/^Need\s+(knowledge of|proficiency in|experience with|familiarity with)?\s*/i, '')
              .trim()
          ))
          .filter(Boolean)
          .filter(sk => !existingSkillsLower.has(sk.toLowerCase().trim()))
        if (skillNames.length > 0) {
          if (!Array.isArray(suggestionsData.suggestions)) suggestionsData.suggestions = []
          ;(suggestionsData.suggestions as Record<string, unknown>[]).push({
            id: 'skills_0', section: 'skills', entryIndex: 0, field: 'skills',
            label: isEN ? 'Skills to Add' : '技能补充建议', tip: isEN ? 'Skills required by the job but missing from resume' : '岗位要求但简历缺失的技能',
            changeDescription: null, optimizedContent: skillNames,
          })
        }
      }
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

    await incrementQuota(req, 'analyze', deviceId)
    return NextResponse.json({ ...suggestionsData })
  } catch (e) {
    console.error('analyze route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
