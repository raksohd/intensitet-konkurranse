import { NextResponse, type NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const protectedPaths = ['/dashboard', '/register', '/history', '/leaderboard', '/admin', '/account']
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))
 
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.includes('auth-token')
  )
 
  if (isProtected && !hasAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
 
  if (request.nextUrl.pathname === '/login' && hasAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
 
  return NextResponse.next()
}
 
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
