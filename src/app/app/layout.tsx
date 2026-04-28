'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const NAV = [
  { path: '/app',          icon: '◉', label: 'Seguros'    },
  { path: '/app/claims',   icon: '◷', label: 'Siniestros' },
  { path: '/app/impact',   icon: '♡', label: 'Impacto'    },
  { path: '/app/account',  icon: '◎', label: 'Cuenta'     },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [initial, setInitial] = useState('?')

  useEffect(() => {
    const name = localStorage.getItem('customerName') || ''
    if (name) setInitial(name[0].toUpperCase())
  }, [])

  return (
    <div className="phone-frame">
      {/* Status bar */}
      <div className="flex justify-between items-center px-7 pt-3 pb-0 text-[#0D0D0D] text-[13px] font-bold flex-shrink-0"
        style={{ background: 'var(--sand-base)' }}>
        <span>9:41</span>
        <div className="w-28 h-7 bg-[#0D0D0D] rounded-full" />
        <svg width="16" height="12" viewBox="0 0 16 12" fill="#0D0D0D">
          <path d="M1 8h2v4H1zM5 5h2v7H5zM9 3h2v9H9zM13 0h2v12h-2z"/>
        </svg>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3 flex-shrink-0 border-b border-[#0D0D0D]/[0.07]"
        style={{ background: 'var(--sand-base)' }}>
        <div>
          <div className="text-[26px] font-bold text-[#0D0D0D] tracking-tight leading-none">daily</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[#00b67a] text-[12px]">★★★★★</span>
            <span className="text-[12px] font-bold text-[#0D0D0D]">4.8</span>
            <span className="text-[12px] text-[#0D0D0D]/20">·</span>
            <span className="text-[12px] text-[#0D0D0D]/40">247 miembros</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/app/account')}
          className="w-10 h-10 rounded-full bg-[#0D0D0D] flex items-center justify-center text-[15px] text-white font-bold"
        >
          {initial}
        </button>
      </div>

      {/* Screen content */}
      <div className="screen" style={{ background: 'var(--sand-base)' }}>
        {children}
      </div>

      {/* Mapfre bar */}
      <div className="flex items-center justify-center gap-1.5 py-1.5 flex-shrink-0 border-t border-[#0D0D0D]/[0.06]"
        style={{ background: 'var(--sand-base)' }}>
        <span className="text-[10px] text-[#0D0D0D]/35 font-medium tracking-[0.3px]">Powered by</span>
        <span className="bg-[#E30613] text-white text-[9px] font-bold px-2 py-0.5 rounded-[4px] tracking-[0.5px]">MAPFRE</span>
      </div>

      {/* Bottom nav */}
      <div className="flex justify-around py-2.5 pb-5 flex-shrink-0 border-t border-[#0D0D0D]/[0.07]"
        style={{ background: 'var(--sand-base)' }}>
        {NAV.map(item => {
          const active = pathname === item.path
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <span className={`text-[20px] transition-colors ${active ? 'text-[#0D0D0D]' : 'text-[#0D0D0D]/20'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-[#0D0D0D] font-bold' : 'text-[#0D0D0D]/20'}`}>
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
