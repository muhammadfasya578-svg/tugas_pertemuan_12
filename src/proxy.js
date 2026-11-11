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

  const sanitizeResponse = (res) => {
    if (session && (session.avatar_url || (sessionCookie?.value && sessionCookie.value.length > 1000))) {
      const cleanSession = {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
      }
      res.cookies.set('perpus_session', encodeURIComponent(JSON.stringify(cleanSession)), {
        path: '/',
        maxAge: 86400,
        sameSite: 'lax',
      })
    }
    return res
  }

  if (!session && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return sanitizeResponse(NextResponse.redirect(url))
  }

  if (session && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = session.role === 'admin' ? '/admin' : '/'
    return sanitizeResponse(NextResponse.redirect(url))
  }

  if (session && pathname.startsWith('/admin') && session.role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return sanitizeResponse(NextResponse.redirect(url))
  }

  return sanitizeResponse(NextResponse.next())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
