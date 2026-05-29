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

  let token: string
  try {
    token = await getAccessToken()
  } catch (e) {
    return NextResponse.json({ ok: false, step: 'get_token', error: String(e) }, { status: 500 })
  }

  const menu = {
    button: [
      { type: 'click', name: '获取登录码', key: 'GET_LOGIN_CODE' },
    ],
  }

  let data: { errcode: number; errmsg: string }
  try {
    const res = await fetch(
      `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${token}`,
      { method: 'POST', body: JSON.stringify(menu) }
    )
    data = await res.json()
  } catch (e) {
    return NextResponse.json({ ok: false, step: 'create_menu', error: String(e) }, { status: 500 })
  }

  if (data.errcode !== 0) {
    return NextResponse.json({ ok: false, detail: data }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
