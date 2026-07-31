'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
 
export default function Navbar() {
  const [name, setName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
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
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-2 text-sm rounded-md whitespace-nowrap ${
                pathname.startsWith(l.href) ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 pl-2">
          <span className="text-sm text-gray-500 hidden sm:inline">{name}</span>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">Logg ut</button>
        </div>
      </div>
    </nav>
  )
}
