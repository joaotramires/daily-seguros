'use client'
import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { fadeUp, stagger, tapScale } from '@/lib/animations'
import { useIsNative } from '@/lib/useIsNative'

function OnboardingForm() {
  const router   = useRouter()
  const isNative = useIsNative()
  const params   = useSearchParams()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: 'Madrid',
    consent_gdpr: false, consent_marketing: false,
  })
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const ref = params.get('ref') || localStorage.getItem('daily_referral_code') || ''
    if (ref) { setReferralCode(ref); localStorage.setItem('daily_referral_code', ref) }
  }, [params])

  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.consent_gdpr) return
    setLoading(true)
    try {
      const res = await fetch('/api/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          platform:    isNative ? 'android' : 'web',
          referred_by: referralCode || undefined,
        }),
      })
      const data = await res.json()
      if (data.customerId) {
        localStorage.setItem('customerId', data.customerId)
        localStorage.setItem('customerName', form.name)
        localStorage.removeItem('daily_referral_code')
      }
    } catch (e) { console.error(e) }
    router.push('/app')
  }

  return (
    <div className="phone-frame" style={{ background: '#111' }}>
      {!isNative && (
        <div className="flex justify-between items-center px-7 pt-3 text-white text-[13px] font-bold flex-shrink-0">
          <span>9:41</span>
          <div className="w-28 h-7 bg-black rounded-full" />
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
            <path d="M1 8h2v4H1zM5 5h2v7H5zM9 3h2v9H9zM13 0h2v12h-2z"/>
          </svg>
        </div>
      )}

      <div className="px-6 pt-4 pb-3 flex-shrink-0" style={{ background: 'linear-gradient(160deg,#0d1a10,#080d07)' }}>
        <div className="text-white/80 text-[18px] font-semibold tracking-tight">daily</div>
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-[3px] flex-1 rounded-full"
              style={{ background: i === 0 ? '#1D9E75' : 'rgba(255,255,255,.12)' }} />
          ))}
        </div>
      </div>

      <div className="flex-1 rounded-t-[28px] -mt-3 relative z-10 overflow-y-auto"
        style={{ background: 'var(--sand-base)' }}>
        <div className="p-6 pb-10">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.h2 variants={fadeUp} className="text-[22px] font-bold text-[#0D0D0D] mb-1 tracking-tight">
              Cuéntanos sobre ti
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[13px] text-[#0D0D0D]/45 mb-6">
              30 segundos. Solo una vez.
            </motion.p>
            {referralCode && (
              <motion.div variants={fadeUp} className="mb-4 rounded-[11px] px-4 py-3 text-[12px] font-semibold"
                style={{ background: 'rgba(29,158,117,.1)', color: '#1D9E75' }}>
                🎁 Te invitó un amigo · código {referralCode.toUpperCase()}
              </motion.div>
            )}
            <motion.div variants={stagger}>
              {[
                { label: 'Tu nombre', key: 'name',  placeholder: 'Ana García',        type: 'text'  },
                { label: 'Email',     key: 'email', placeholder: 'ana@email.com',     type: 'email' },
                { label: 'Móvil (WhatsApp)', key: 'phone', placeholder: '+34 600 000 000', type: 'tel' },
              ].map(f => (
                <motion.div key={f.key} variants={fadeUp} className="mb-4">
                  <label className="block text-[10px] font-bold text-[#0D0D0D]/40 uppercase tracking-[0.8px] mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as 'name' | 'email' | 'phone']}
                    onChange={e => set(f.key as keyof typeof form, e.target.value)}
                    className="w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D]"
                    style={{ background: 'rgba(13,13,13,.05)', border: '1px solid rgba(13,13,13,.12)' }}
                  />
                </motion.div>
              ))}

              {/* GDPR consent */}
              <motion.div variants={fadeUp} className="mb-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.consent_gdpr}
                    onChange={e => set('consent_gdpr', e.target.checked)}
                    className="mt-0.5 flex-shrink-0 accent-[#1D9E75]" />
                  <span className="text-[12px] text-[#0D0D0D]/60 leading-relaxed">
                    He leído y acepto la <strong className="text-[#0D0D0D]/80">Política de Privacidad</strong> y el tratamiento de mis datos para gestionar mi seguro. *
                  </span>
                </label>
              </motion.div>
              <motion.div variants={fadeUp} className="mb-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.consent_marketing}
                    onChange={e => set('consent_marketing', e.target.checked)}
                    className="mt-0.5 flex-shrink-0 accent-[#1D9E75]" />
                  <span className="text-[12px] text-[#0D0D0D]/60 leading-relaxed">
                    Acepto recibir ofertas y comunicaciones de Daily. (Opcional)
                  </span>
                </label>
              </motion.div>

              <motion.button variants={fadeUp} whileTap={tapScale}
                onClick={handleSubmit}
                disabled={!form.name || !form.email || !form.consent_gdpr || loading}
                className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mt-2 disabled:opacity-40"
                style={{ background: '#0D0D0D' }}>
                {loading ? 'Guardando…' : 'Entrar →'}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}
