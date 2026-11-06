import { NextResponse } from 'next/server'

export function proxy(request) {
  const sessionCookie = request.cookies.get('perpus_session')
  let session = null
  if (sessionCookie?.value) {
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value))
    } catch {
      session = null
    }
  }

  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (!session && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (session && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = session.role === 'admin' ? '/admin' : '/'
    return NextResponse.redirect(url)
  }

  if (session && pathname.startsWith('/admin') && session.role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
