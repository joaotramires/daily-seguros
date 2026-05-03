'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PushNotifications } from '@capacitor/push-notifications'
import Sheet from '@/components/ui/Sheet'
import { tapScale } from '@/lib/animations'
import { useIsNative } from '@/lib/useIsNative'
import { createClient } from '@/lib/supabase'

const NAV: { path: string; label: string; icon: React.ReactNode }[] = [
  {
    path: '/app', label: 'Seguros',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 2.5L4.5 5.5V11c0 3.8 2.8 7.3 6.5 8.5 3.7-1.2 6.5-4.7 6.5-8.5V5.5L11 2.5z"/>
      </svg>
    ),
  },
  {
    path: '/app/claims', label: 'Siniestros',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8.5"/>
        <path d="M11 7v4.5l3 1.5"/>
      </svg>
    ),
  },
  {
    path: '/app/ventajas', label: 'Club',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 2.5l2.5 5.2 5.7.8-4.1 4 1 5.7L11 15.4l-5.1 2.8 1-5.7-4.1-4 5.7-.8L11 2.5z"/>
      </svg>
    ),
  },
  {
    path: '/app/account', label: 'Ayuda',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="8" r="3.5"/>
        <path d="M3.5 19.5c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5"/>
      </svg>
    ),
  },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const isNative = useIsNative()
  const [initial, setInitial]         = useState('')
  const [showAuth, setShowAuth]       = useState(false)
  const [email, setEmail]             = useState('')
  const [name, setName]               = useState('')
  const [phone, setPhone]             = useState('')
  const [step, setStep]               = useState<'email' | 'register' | 'loading'>('email')
  const [authLoading, setAuthLoading] = useState(false)
  const [mariaOpen, setMariaOpen]     = useState(false)

  useEffect(() => {
    const storedName = localStorage.getItem('customerName') || ''
    if (storedName) setInitial(storedName[0].toUpperCase())

    // 1. Push Notifications Setup
    if (isNative) {
      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') PushNotifications.register()
      })
      PushNotifications.addListener('registration', async (token) => {
        localStorage.setItem('fcm_token', token.value)
        const customerId = localStorage.getItem('customerId')
        if (customerId) {
          await fetch('/api/update-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: customerId, fcm_token: token.value })
          })
        }
      })
    }

    // 2. Bridge Supabase OAuth sessions
    // Fires after the OAuth redirect returns and Supabase restores the session.
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email && !localStorage.getItem('customerId')) {
        const email = session.user.email
        const name  = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email
        try {
          const platform = isNative ? 'android' : 'web'
          const res = await fetch('/api/login-customer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, platform }) })
          const d   = await res.json()
          let finalId = ''
          if (d.found) {
            localStorage.setItem('customerId',   d.customerId)
            localStorage.setItem('customerName', d.name)
            setInitial(d.name[0].toUpperCase())
            finalId = d.customerId
          } else {
            const r2 = await fetch('/api/register-customer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, city: 'Madrid', platform }) })
            const d2 = await r2.json()
            if (d2.customerId) {
              localStorage.setItem('customerId',   d2.customerId)
              localStorage.setItem('customerName', name)
              setInitial(name[0].toUpperCase())
              finalId = d2.customerId
            }
          }

          // Sync FCM token immediately after identifying the customer
          const token = localStorage.getItem('fcm_token')
          if (finalId && token) {
            await fetch('/api/update-customer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: finalId, fcm_token: token })
            })
          }

          window.location.reload()
        } catch (e) { console.error('OAuth bridge error', e) }
      }
    })
    return () => subscription.unsubscribe()
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

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    })
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
      {!isNative && (
        <div className="flex justify-between items-center px-7 pt-3 pb-0 text-[#0D0D0D] text-[13px] font-bold flex-shrink-0"
          style={{ background: 'var(--sand-base)' }}>
          <span>9:41</span>
          <div className="w-28 h-7 bg-[#0D0D0D] rounded-full" />
          <svg width="16" height="12" viewBox="0 0 16 12" fill="#0D0D0D">
            <path d="M1 8h2v4H1zM5 5h2v7H5zM9 3h2v9H9zM13 0h2v12h-2z"/>
          </svg>
        </div>
      )}

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
              <span className={`transition-colors ${active ? 'text-[#0D0D0D]' : 'text-[#0D0D0D]/20'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-[#0D0D0D] font-bold' : 'text-[#0D0D0D]/20'}`}>
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* María backdrop — closes panel when tapping outside */}
      <AnimatePresence>
        {mariaOpen && (
          <motion.div className="absolute inset-0 z-[29]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMariaOpen(false)} />
        )}
      </AnimatePresence>

      {/* María floating button — above bottom nav, below sheets (z-30) */}
      <div className="absolute bottom-[80px] right-4 z-30">
        <AnimatePresence mode="wait">
          {mariaOpen ? (
            <motion.div key="expanded"
              initial={{ opacity: 0, scale: 0.85, x: 12 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 12 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 rounded-[16px] py-3 pl-3 pr-3 shadow-xl"
              style={{ background: 'var(--sand-modal)', border: '1px solid rgba(13,13,13,.08)', minWidth: 210 }}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[18px]"
                  style={{ background: 'linear-gradient(135deg,#FAC775,#D85A30)' }}>M</div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                  style={{ background: '#25D366', borderColor: 'var(--sand-modal)' }} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-[#0D0D0D]">Habla con María</div>
                <div className="text-[11px]" style={{ color: 'rgba(13,13,13,.4)' }}>Responde en ~4 min</div>
              </div>
              <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hola+María`}
                target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[18px] flex-shrink-0"
                style={{ background: '#25D366' }}>
                💬
              </a>
            </motion.div>
          ) : (
            <motion.button key="collapsed"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setMariaOpen(true)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[20px] shadow-lg relative"
              style={{ background: 'linear-gradient(135deg,#FAC775,#D85A30)' }}>
              M
              {/* Pulsing ring */}
              <motion.div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ border: '2px solid #25D366' }}
                animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
              {/* Solid green dot */}
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                style={{ background: '#25D366', borderColor: 'var(--sand-base)' }} />
            </motion.button>
          )}
        </AnimatePresence>
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
                <p className="text-[13px] text-[#0D0D0D]/45 mb-4 mt-1">Accede o crea tu cuenta en segundos.</p>
                {/* Google Sign-In */}
                <button onClick={handleGoogleSignIn}
                  className="w-full py-3 rounded-[13px] text-[14px] font-semibold text-[#0D0D0D] mb-3 flex items-center justify-center gap-2.5 border"
                  style={{ background: 'white', borderColor: 'rgba(13,13,13,.15)' }}>
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continuar con Google
                </button>
                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-[#0D0D0D]/10" />
                  <span className="text-[11px] text-[#0D0D0D]/30">o con email</span>
                  <div className="flex-1 h-px bg-[#0D0D0D]/10" />
                </div>
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
