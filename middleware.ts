import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isDashboard = pathname.startsWith('/dashboard')
  const isSuperadmin = pathname.startsWith('/superadmin')

  // Ambil cookie login
  const isLoggedIn = req.cookies.get('isLoggedIn')?.value
  const userRole = req.cookies.get('userRole')?.value

  console.log('DEBUG:', { pathname, isLoggedIn, userRole }) // bantu cek log di terminal

  // Kalau halaman dilindungi dan belum login
  if ((isDashboard || isSuperadmin) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Batasi akses berdasarkan role
  if (isDashboard && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isSuperadmin && userRole !== 'superadmin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/superadmin/:path*'],
}
