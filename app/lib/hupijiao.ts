import crypto from 'crypto'

const BASE = 'https://api.xunhupay.com'

function getCredentials() {
  return {
    appid:     process.env.HUPIJIAO_APPID     ?? '',
    appsecret: process.env.HUPIJIAO_APPSECRET ?? '',
  }
}

function sign(params: Record<string, string>, appsecret: string): string {
  const payload = Object.keys(params)
    .filter(k => params[k] !== '' && params[k] != null && k !== 'hash')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&') + appsecret   // 官方：直接拼接，无 &key= 前缀
  return crypto.createHash('md5').update(payload).digest('hex')
}

function baseParams(appid: string): Record<string, string> {
  return {
    appid,
    time:      Math.floor(Date.now() / 1000).toString(),
    nonce_str: crypto.randomBytes(8).toString('hex'),
  }
}

export interface CreateResult {
  ok: boolean
  url?: string
  error?: string
}

export async function hpjCreate({
  orderId, amountFen, title, notifyUrl, returnUrl,
}: {
  orderId: string
  amountFen: number
  title: string
  notifyUrl: string
  returnUrl: string
}): Promise<CreateResult> {
  const { appid, appsecret } = getCredentials()

  const params: Record<string, string> = {
    version:        '1.1',
    ...baseParams(appid),
    trade_order_id: orderId,
    total_fee:      (amountFen / 100).toFixed(2),
    title,
    notify_url:     notifyUrl,
    return_url:     returnUrl,
    payment:        'wechat',
    type:           'WAP',
    wap_url:        returnUrl,
    wap_name:       'ResumeCraft',
  }
  params.hash = sign(params, appsecret)

  const res  = await fetch(`${BASE}/payment/do.html`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams(params).toString(),
  })
  const data = await res.json()

  if (data.errcode !== 0) {
    console.error('[hupijiao] create error:', data)
    return { ok: false, error: data.errmsg ?? '创建支付失败' }
  }
  // url is the payment page; scanning it with WeChat triggers payment directly
  return { ok: true, url: data.url }
}

export interface QueryResult {
  paid: boolean
  transactionId?: string
  error?: string
}

export async function hpjQuery(orderId: string): Promise<QueryResult> {
  const { appid, appsecret } = getCredentials()

  const params: Record<string, string> = {
    ...baseParams(appid),
    trade_order_id: orderId,
  }
  params.hash = sign(params, appsecret)

  const res  = await fetch(`${BASE}/payment/query.html?${new URLSearchParams(params)}`)
  const data = await res.json()
  if (data.errcode !== 0) return { paid: false, error: data.errmsg }
  return { paid: data.status === 'OD', transactionId: data.transaction_id }
}

export function hpjVerify(params: Record<string, string>): boolean {
  const { hash, ...rest } = params
  if (!hash) return false
  const { appsecret } = getCredentials()
  return sign(rest, appsecret) === hash
}
