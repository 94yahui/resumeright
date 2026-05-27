import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== 'true') return NextResponse.next()

  const { pathname } = req.nextUrl
  // Allow the maintenance page itself and its assets to pass through
  if (pathname.startsWith('/maintenance') || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/maintenance', req.url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
