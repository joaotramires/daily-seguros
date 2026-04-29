'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sheet from '@/components/ui/Sheet'
import { tapScale } from '@/lib/animations'

const NAV = [
  { path: '/app',           icon: '◉', label: 'Seguros'    },
  { path: '/app/claims',    icon: '◷', label: 'Siniestros' },
  { path: '/app/ventajas',  icon: '🏆', label: 'Club'      },
  { path: '/app/account',   icon: '◎', label: 'Ayuda'      },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [initial, setInitial]         = useState('')
  const [showAuth, setShowAuth]       = useState(false)
  const [email, setEmail]             = useState('')
  const [name, setName]               = useState('')
  const [phone, setPhone]             = useState('')
  const [step, setStep]               = useState<'email' | 'register' | 'loading'>('email')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const storedName = localStorage.getItem('customerName') || ''
    if (storedName) setInitial(storedName[0].toUpperCase())
  }, [])

  function handleAvatarClick() {
    if (initial) router.push('/app/account')
    else setShowAuth(true)
  }

  function closeAuth() {
    setShowAuth(false); setEmail(''); setName(''); setPhone(''); setStep('email')
  }

  async function handleEmailSubmit() {
    if (!email.trim()) return
    setAuthLoading(true)
    try {
      const res  = await fetch('/api/login-customer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (data.found) {
        localStorage.setItem('customerId', data.customerId)
        localStorage.setItem('customerName', data.name)
        setInitial(data.name[0].toUpperCase())
        closeAuth()
        window.location.reload()
      } else {
        setStep('register')
      }
    } catch (e) { console.error(e) }
    setAuthLoading(false)
  }

  async function handleRegister() {
    if (!name.trim()) return
    setAuthLoading(true)
    try {
      const res  = await fetch('/api/register-customer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, city: 'Madrid' }) })
      const data = await res.json()
      if (data.customerId) {
        localStorage.setItem('customerId', data.customerId)
        localStorage.setItem('customerName', name)
        setInitial(name[0].toUpperCase())
        closeAuth()
        window.location.reload()
      }
    } catch (e) { console.error(e) }
    setAuthLoading(false)
  }

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
        <div className="text-[26px] font-bold text-[#0D0D0D] tracking-tight leading-none">daily</div>
        <div className="flex items-center gap-2">
          {!initial && (
            <button onClick={() => setShowAuth(true)}
              className="px-3 py-2 rounded-[10px] text-[12px] font-semibold text-white"
              style={{ background: '#1D9E75' }}>
              Entrar
            </button>
          )}
          <button onClick={handleAvatarClick}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold transition-colors"
            style={{ background: initial ? '#0D0D0D' : 'rgba(13,13,13,.1)', color: initial ? 'white' : 'rgba(13,13,13,.3)' }}>
            {initial || '?'}
          </button>
        </div>
      </div>

      {/* Screen content */}
      <div className="screen" style={{ background: 'var(--sand-base)' }}>
        {children}
      </div>

      {/* Bottom nav */}
      <div className="flex justify-around py-2.5 pb-5 flex-shrink-0 border-t border-[#0D0D0D]/[0.07]"
        style={{ background: 'var(--sand-base)' }}>
        {NAV.map(item => {
          const active = pathname === item.path
          return (
            <motion.button key={item.path} whileTap={{ scale: 0.9 }}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 px-3 py-1">
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

      {/* Auth sheet */}
      <Sheet open={showAuth} onClose={closeAuth}>
        <div className="px-5 pt-4 pb-2">
          <div className="flex justify-between items-center mb-1">
            <div className="text-[15px] font-bold text-[#0D0D0D]">
              {step === 'email' ? 'Entrar en Daily' : 'Crea tu cuenta'}
            </div>
            <button onClick={closeAuth} className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] text-[#0D0D0D]/40"
              style={{ background: 'rgba(13,13,13,.07)' }}>✕</button>
          </div>
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[13px] text-[#0D0D0D]/45 mb-5 mt-1">Introduce tu email y continuamos.</p>
                <label className="block text-[10px] font-bold text-[#0D0D0D]/40 uppercase tracking-[0.8px] mb-1.5">Email</label>
                <input type="email" placeholder="ana@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                  className="w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D] mb-4"
                  style={{ background: 'rgba(13,13,13,.05)', border: '1px solid rgba(13,13,13,.12)' }} />
                <motion.button whileTap={tapScale} onClick={handleEmailSubmit}
                  disabled={!email.trim() || authLoading}
                  className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white disabled:opacity-40"
                  style={{ background: '#0D0D0D' }}>
                  {authLoading ? 'Comprobando…' : 'Continuar →'}
                </motion.button>
              </motion.div>
            )}
            {step === 'register' && (
              <motion.div key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-[13px] text-[#0D0D0D]/45 mb-5 mt-1">Es tu primera vez. Solo unos datos.</p>
                {[
                  { label: 'Tu nombre', key: 'name', val: name, set: setName, placeholder: 'Ana García', type: 'text' },
                  { label: 'Móvil (opcional)', key: 'phone', val: phone, set: setPhone, placeholder: '+34 600 000 000', type: 'tel' },
                ].map(f => (
                  <div key={f.key} className="mb-3">
                    <label className="block text-[10px] font-bold text-[#0D0D0D]/40 uppercase tracking-[0.8px] mb-1.5">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={f.val} onChange={e => f.set(e.target.value)}
                      className="w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D]"
                      style={{ background: 'rgba(13,13,13,.05)', border: '1px solid rgba(13,13,13,.12)' }} />
                  </div>
                ))}
                <motion.button whileTap={tapScale} onClick={handleRegister}
                  disabled={!name.trim() || authLoading}
                  className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mt-2 disabled:opacity-40"
                  style={{ background: '#0D0D0D' }}>
                  {authLoading ? 'Guardando…' : 'Crear cuenta →'}
                </motion.button>
                <button onClick={() => setStep('email')} className="w-full text-center text-[12px] text-[#0D0D0D]/35 mt-2 py-2">
                  ← Cambiar email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Sheet>
    </div>
  )
}
