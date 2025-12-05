'use client';

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '📊 Summary' },
    { href: '/space-efficiency', label: '🏆 Space Efficiency' },
    { href: '/activities', label: '🎯 Activities' },
    { href: '/combos', label: '🎁 Combos' },
    { href: '/parties', label: '🎉 Parties' },
    { href: '/recharge', label: '💳 Recharge' },
    { href: '/arcade', label: '🎰 Arcade' },
  ];

  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="sticky top-0 z-50 bg-white shadow-md border-b-2 border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-2xl shadow-lg">
                  🎮
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                    Neon Panda Arcade
                  </h1>
                  <p className="text-xs text-gray-600 hidden md:block">Performance Analytics Dashboard</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href}
                      href={item.href}
                      className={`relative px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-2 md:px-4 py-4 md:py-8">
          {children}
        </main>
        <footer className="bg-gray-100 text-gray-700 py-6 mt-12 border-t-2 border-gray-200">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">
              © 2025 Neon Panda Arcade - Data-Driven Insights
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
