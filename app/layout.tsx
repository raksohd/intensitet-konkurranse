import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
 
export const metadata: Metadata = {
  title: 'Intensitetsminutter 2026',
  description: 'Intern konkurranse - registrer intensitetsminutter',
}
 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className="bg-gray-50 min-h-screen text-gray-900">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
