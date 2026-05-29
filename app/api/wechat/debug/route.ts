import { NextResponse } from 'next/server'

// 临时调试接口，确认环境变量是否加载 — 上线后删除
export async function GET() {
  const token = process.env.WECHAT_TOKEN ?? ''
  return NextResponse.json({
    token_loaded: token.length > 0,
    token_length: token.length,
    token_first3: token.slice(0, 3),  // 只看前3位，不暴露完整值
  })
}
