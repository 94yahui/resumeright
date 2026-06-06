import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../lib/jwt'
import { getResumeCollection } from '../../lib/mongodb'

function getOpenid(req: NextRequest): string | null {
  const token = req.cookies.get('rc_token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  return payload ? (payload.openid as string) : null
}

// GET /api/resumes — fetch all resumes for logged-in user
export async function GET(req: NextRequest) {
  const openid = getOpenid(req)
  if (!openid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const col = await getResumeCollection()
  const docs = await col.find({ openid }).sort({ savedAt: -1 }).toArray()
  return NextResponse.json(docs.map(d => ({
    id: d._id,
    name: d.name,
    data: d.data,
    templateId: d.templateId,
    color: d.color,
    accentStyleOverride: d.accentStyleOverride,
    fontPairOverride: d.fontPairOverride,
    savedAt: d.savedAt,
    isEnglish: d.isEnglish,
  })))
}

// POST /api/resumes — upsert a resume (body: { id, name, data, templateId, color, savedAt, isEnglish })
export async function POST(req: NextRequest) {
  const openid = getOpenid(req)
  if (!openid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, name, data, templateId, color, accentStyleOverride, fontPairOverride, savedAt, isEnglish } = body
  if (!id || !data) return NextResponse.json({ error: 'missing id or data' }, { status: 400 })

  const col = await getResumeCollection()
  await col.updateOne(
    { _id: id, openid },
    { $set: { openid, name, data, templateId, color, accentStyleOverride, fontPairOverride, savedAt, isEnglish } },
    { upsert: true }
  )
  return NextResponse.json({ ok: true })
}

// DELETE /api/resumes?id=xxx — delete one resume
export async function DELETE(req: NextRequest) {
  const openid = getOpenid(req)
  if (!openid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const col = await getResumeCollection()
  await col.deleteOne({ _id: id, openid })
  return NextResponse.json({ ok: true })
}
