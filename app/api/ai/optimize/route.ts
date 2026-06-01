import { NextRequest, NextResponse } from 'next/server'
import { guardAI } from '../_guard'

const QWEN_BASE = process.env.QWEN_BASE_URL || 'https://api.deepseek.com'
const QWEN_MODEL = process.env.QWEN_MODEL || 'deepseek-chat'

const EXPERT_SYSTEM = `你是一位拥有15年招聘与人才管理经验的资深简历顾问，曾担任多家世界500强企业的人才招聘总监，深度参与过数万份简历的筛选与评估。你精通用STAR原则（Action强力动词开头/Result呈现可衡量成果）改写简历描述，熟悉互联网、金融、快消、制造、医疗等主流行业的岗位要求与筛选标准。核心能力：精准识别简历弱点，用"主导/设计/推动/实现/重构"等强力动词替换"参与/负责/协助/支持"等弱动词，在不虚构任何信息的前提下最大化候选人竞争力。`

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
      prompt = `请优化以下工作/项目描述，使其更清晰、更具体、更吸引招聘官。

背景信息：${context || '无'}
当前描述：
${text}

改写要求（STAR原则）：
1. Action：每条句首用强力动词（主导/设计/推动/实现/重构/搭建），替换弱动词（参与/负责/协助/支持）
2. Result：每条尽量呈现可衡量的结果或业务影响；若原文无数字，可基于Action合理推断结果，但严禁虚构具体数字
3. 禁止使用"显著""大幅""极大""极大改善"等模糊程度词，改用具体事实替代
4. 保留原有核心信息，不删减关键技术或项目名称
5. 每条控制在50字以内
6. 返回3-5条优化后的描述

仅返回JSON（无markdown）：{"bullets": ["描述1", "描述2", "描述3"]}`
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

    const res = await fetch(`${QWEN_BASE}/chat/completions`, {
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
        temperature: 0.4,
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
