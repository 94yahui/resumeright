import { NextRequest, NextResponse } from 'next/server'
import { guardAI } from '../_guard'
import { aiFetch } from '../_fetch'

const QWEN_BASE = process.env.QWEN_BASE_URL || 'https://api.deepseek.com'
const QWEN_MODEL = process.env.QWEN_MODEL || 'deepseek-chat'

const EXPERT_SYSTEM = `你是专业简历改写专家，擅长将平淡、信息量不足的简历描述改写为结构完整、内容充实、吸引招聘官的bullet。你的核心能力是对每一条描述进行完整的内容重构——不是仅换一个动词，而是补全"做了什么、怎么做的、产生什么影响"三层信息，让每条描述真正有说服力。`

export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const { type, text, context, deviceId } = await req.json()

    const guard = guardAI(req, deviceId)
    if (guard) return guard

    if (typeof text === 'string' && text.length > 5000) {
      return NextResponse.json({ error: 'Input text too large' }, { status: 413 })
    }

    let prompt: string
    if (type === 'bullets') {
      const bulletLines = text.split('\n').filter((l: string) => l.trim().length > 0)
      const isShort = text.trim().length < 120 || bulletLines.length < 2
      const countInstruction = isShort
        ? '返回4-5条优化后的描述（原文较简短，请充分展开）'
        : '返回3-5条优化后的描述'
      const lengthInstruction = '每条控制在20到40字之间；原描述过短时可基于职位性质合理补充细节，但总长不超过40字'

      prompt = `请对以下工作/项目描述进行完整改写，每条输出结构完整、内容充实的简历描述。

背景信息：${context || '无'}
原始描述：
${text}

【改写结构（每条必须包含全部三层）】
强力动词 ＋ 具体行为或方法 ＋ 结果或影响方向

【改写示例】
原文："负责后台接口开发"
改写："主导后台RESTful接口设计与实现，支撑前端多业务模块稳定高效调用"（27字）

原文："参与用户增长项目"
改写："推动用户拉新到留存全链路优化，协调产研资源保障项目按期交付"（28字）

原文："协助数据分析"
改写："独立完成用户行为数据清洗与分析，输出周报支持运营团队策略决策"（29字）

【规则】
1. 每条20到40字，绝不低于20字；若原文信息量不足，基于岗位背景补充合理行为细节
2. 严禁虚构任何具体数字、百分比或项目名称
3. 保留原文中的技术栈名称、产品名、公司背景
4. 禁用"显著""大幅""极大""有效""积极"等空洞形容词
5. ${countInstruction}

仅返回JSON（无markdown）：{"bullets": ["改写后描述1", "改写后描述2", "改写后描述3"]}`
    } else {
      prompt = `请优化以下个人简介，使其更专业、更简洁。

当前简介：${text}
${context ? `背景：${context}` : ''}

要求：
1. 2-3句话，简洁务实
2. 突出核心竞争力（年限+领域+代表性成果），用具体能力和经验描述
3. 避免"显著""大幅""极具竞争力"等夸张修饰词，语气客观自然

仅返回JSON（无markdown）：{"summary": "优化后的个人简介"}`
    }

    const res = await aiFetch(`${QWEN_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          { role: 'system', content: EXPERT_SYSTEM },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.65,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Qwen optimize error:', err)
      return NextResponse.json({ error: 'Qwen API error' }, { status: 502 })
    }

    const json = await res.json()
    const resultText = json.choices?.[0]?.message?.content ?? ''
    const result = JSON.parse(resultText)

    return NextResponse.json(result)
  } catch (e) {
    console.error('optimize route error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
