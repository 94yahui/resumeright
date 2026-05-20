import { NextRequest, NextResponse } from 'next/server'
import { getPdfEntry } from '../../../lib/pdf-store'

/** Called by /print-resume to retrieve the resume payload by UUID (POST avoids static-export GET issues). */
export async function POST(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const entry = getPdfEntry(id)
  if (!entry) return NextResponse.json({ error: 'not found or expired' }, { status: 404 })
  return NextResponse.json(entry)
}
