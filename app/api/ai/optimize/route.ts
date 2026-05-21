import { NextRequest, NextResponse } from 'next/server'
import { guardAI } from '../_guard'

const QWEN_BASE = process.env.QWEN_BASE_URL || 'https://dashscope-us.aliyuncs.com/compatible-mode/v1'
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen3.6-plus'

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
      prompt = `你是一位专业的简历撰写顾问。请优化以下工作/项目描述，使其更清晰、更具体、更吸引招聘官。

背景信息：${context || '无'}
当前描述：
${text}

要求：
1. 保留原有核心内容，用具体动词开头（如"设计""负责""推动""完成"）
2. 尽量用具体数字或事实描述成果，避免模糊程度副词
3. 禁止使用"显著""大幅""极大""显著提升""大幅提高""极大改善"等程度夸张词，改用具体数字替代
4. 语气平实务实，不过度夸张
5. 每条控制在50字以内
6. 返回3-5条优化后的描述

仅返回JSON（无markdown）：{"bullets": ["描述1", "描述2", "描述3"]}`
    } else {
      prompt = `你是一位专业的简历撰写顾问。请优化以下个人简介，使其更专业、更简洁。

当前简介：${text}
${context ? `背景：${context}` : ''}

要求：
1. 2-3句话，简洁务实
2. 用具体能力和经验描述，避免"显著""大幅""极具竞争力"等夸张修饰词
3. 适合简历使用，语气客观自然

仅返回JSON（无markdown）：{"summary": "优化后的个人简介"}`
    }

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
        temperature: 0.7,
        enable_thinking: false,
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
