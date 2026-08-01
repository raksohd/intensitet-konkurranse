'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
 
export default function Navbar() {
  const [name, setName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
 
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoggedIn(false); return }
      setLoggedIn(true)
      const { data: profile } = await supabase
        .from('profiles').select('full_name,is_admin').eq('id', user.id).single()
      setName(profile?.full_name || '')
      setIsAdmin(!!profile?.is_admin)
    }
    load()
    setMenuOpen(false)
  }, [pathname])
 
  if (!loggedIn || pathname === '/login' || pathname === '/reset-password') return null
 
  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/register', label: 'Registrer' },
    { href: '/history', label: 'Historikk' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ]
  if (isAdmin) links.push({ href: '/admin', label: 'Admin' })
  links.push({ href: '/account', label: 'Min konto' })
 
  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
 
  return (
    <nav className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/dashboard" className="font-bold text-indigo-600 hover:text-indigo-700">
          🏃 Konkurranse
        </Link>
 
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-md hover:bg-gray-100 flex items-center gap-2"
          aria-label="Meny"
        >
          <span className="text-sm text-gray-500 hidden sm:inline">{name}</span>
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
 
      {menuOpen && (
        <div className="border-t bg-white shadow-lg absolute w-full">
          <div className="max-w-4xl mx-auto">
            <div className="px-4 py-2 text-sm text-gray-500 border-b sm:hidden">Innlogget som {name}</div>
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`block px-4 py-3 text-sm border-b ${
                  pathname.startsWith(l.href) ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}>
                {l.label}
              </Link>
            ))}
            <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50">
              Logg ut
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
