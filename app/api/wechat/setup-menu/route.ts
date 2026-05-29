import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '../../../lib/wechat'

// POST /api/wechat/setup-menu
// 一次性调用，创建公众号自定义菜单。
// 需携带 Authorization: Bearer <WECHAT_TOKEN> 头作为简单鉴权。
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${process.env.WECHAT_TOKEN}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const token = await getAccessToken()

  const menu = {
    button: [
      { type: 'click', name: '获取登录码', key: 'GET_LOGIN_CODE' },
    ],
  }

  const res  = await fetch(
    `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${token}`,
    { method: 'POST', body: JSON.stringify(menu) }
  )
  const data = await res.json() as { errcode: number; errmsg: string }

  if (data.errcode !== 0) {
    return NextResponse.json({ ok: false, detail: data }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
