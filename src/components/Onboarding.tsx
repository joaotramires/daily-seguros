'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { tapScale } from '@/lib/animations'

interface Props { onComplete: () => void; inline?: boolean }

type Step = 1 | 2 | 3
type PayMethod = 'card' | 'bizum' | 'apple'

const LIVING = ['Estudio', 'Piso compartido', 'Piso en propiedad', 'Casa'] as const
const STUFF  = ['Menos de €5.000', '€5.000 – €15.000', 'Más de €15.000'] as const

function calcHogar(living: string, stuff: string): number {
  let base = 9.0
  if (living === 'Piso compartido')   base = 10.0
  if (living === 'Piso en propiedad') base = 12.0
  if (living === 'Casa')              base = 14.0
  if (stuff === '€5.000 – €15.000')  base += 1.5
  if (stuff === 'Más de €15.000')    base += 3.5
  return Math.round(base * 1.2 * 10) / 10
}

export default function Onboarding({ onComplete, inline }: Props) {
  const [step, setStep]             = useState<Step>(1)
  const [living, setLiving]         = useState('')
  const [stuff, setStuff]           = useState('')
  const [payMethod, setPayMethod]   = useState<PayMethod>('card')
  const [cardNum, setCardNum]       = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc]       = useState('')
  const [bizumPhone, setBizumPhone] = useState('')

  const hogarPrice = living && stuff ? calcHogar(living, stuff) : 0

  const compText = hogarPrice < 15 ? 'un café al día ☕'
    : hogarPrice < 25 ? '2 copas en Malasaña 🍷'
    : hogarPrice < 35 ? 'el gym que no usas 💪'
    : hogarPrice < 45 ? 'una cena para dos 🍝'
    : 'Spotify + Netflix juntos 🎬'

  function handlePay() {
    localStorage.setItem('daily_onboarding_complete', 'true')
    localStorage.setItem('daily_hogar_price', String(hogarPrice))
    const pmLabel = payMethod === 'card' ? 'Tarjeta' : payMethod === 'bizum' ? 'Bizum' : 'Apple Pay'
    const msg = encodeURIComponent(
      `¡Hola! Acabo de activar mi Seguro Hogar Daily.\n` +
      `• Vivienda: ${living}\n` +
      `• Bienes: ${stuff}\n` +
      `• Cuota: €${hogarPrice.toFixed(2)}/mes\n` +
      `• Pago: ${pmLabel}\n` +
      `¡Gracias! 🏠`
    )
    window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${msg}`, '_blank')
    onComplete()
  }

  const sel      = 'text-white font-semibold'
  const unsel    = 'text-[#0D0D0D] font-medium'
  const btnBase  = 'px-4 py-2.5 rounded-[11px] text-[13px] border transition-all duration-200'
  const btnSel   = `${btnBase} border-transparent`
  const btnUnsel = `${btnBase} border-[#0D0D0D]/10 bg-[rgba(13,13,13,.04)]`

  const inputCls = 'w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D]'
  const inputSty = { background: 'rgba(13,13,13,.05)', border: '1px solid rgba(13,13,13,.12)' }
  const labelCls = 'block text-[11px] font-bold text-[#0D0D0D]/40 uppercase tracking-[0.8px] mb-1.5'

  const steps = (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}>
          <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[1px] mb-1">Paso 1 de 3</div>
          <h2 className="text-[22px] font-bold text-[#0D0D0D] mb-1 tracking-tight">Cuéntanos sobre tu hogar</h2>
          <p className="text-[13px] text-[#0D0D0D]/40 mb-5">Solo aseguramos tus cosas, no las paredes — eso es del propietario.</p>

          <div className={labelCls}>¿Dónde vives?</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {LIVING.map(o => (
              <button key={o} onClick={() => setLiving(o)}
                className={living === o ? `${btnSel} ${sel}` : `${btnUnsel} ${unsel}`}
                style={living === o ? { background: '#1D9E75' } : {}}>
                {o}
              </button>
            ))}
          </div>

          <div className={labelCls}>¿Cuánto valen tus cosas?</div>
          <div className="flex flex-wrap gap-2 mb-6">
            {STUFF.map(o => (
              <button key={o} onClick={() => setStuff(o)}
                className={stuff === o ? `${btnSel} ${sel}` : `${btnUnsel} ${unsel}`}
                style={stuff === o ? { background: '#1D9E75' } : {}}>
                {o}
              </button>
            ))}
          </div>

          {living && stuff && (
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              whileTap={tapScale} onClick={() => setStep(2)}
              className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white"
              style={{ background: '#0D0D0D' }}>
              Siguiente →
            </motion.button>
          )}
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}>
          <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[1px] mb-1">Paso 2 de 3</div>
          <h2 className="text-[22px] font-bold text-[#0D0D0D] mb-5 tracking-tight">Tu cobertura personalizada</h2>

          <div className="rounded-[16px] p-4 mb-3 border border-[#0D0D0D]/[0.07]" style={{ background: 'var(--sand-card)' }}>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <span className="text-[20px]">🏠</span>
                <span className="text-[14px] font-semibold text-[#0D0D0D]">Hogar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#1D9E75]">€{hogarPrice.toFixed(2)}/mes</span>
                <span className="text-[#1D9E75] text-[16px]">✓</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-4 px-3 py-2.5 rounded-[10px]"
            style={{ background: 'rgba(13,13,13,.04)' }}>
            <span className="text-[12px] text-[#0D0D0D]/40">Al mes, menos que</span>
            <span className="text-[12px] font-semibold text-[#0D0D0D]/70">{compText}</span>
          </div>

          <div className="flex flex-col gap-1.5 mb-5">
            {[
              'Daños eléctricos incluidos de serie',
              'Indemnización en efectivo — tú eliges al reparador',
              'Cancela cuando quieras, sin llamadas ni papeleo',
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#1D9E75]">✓</span>
                <span className="text-[12px] text-[#0D0D0D]/55">{item}</span>
              </div>
            ))}
          </div>

          <motion.button whileTap={tapScale} onClick={() => setStep(3)}
            className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mb-3"
            style={{ background: '#1D9E75' }}>
            Continuar al pago →
          </motion.button>
          <p className="text-center text-[12px] text-[#0D0D0D]/35">Cancela cuando quieras. Sin permanencia.</p>

          <button onClick={() => setStep(1)} className="w-full text-center text-[12px] text-[#0D0D0D]/35 py-2 mt-1">
            ← Volver
          </button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}>
          <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[1px] mb-1">Paso 3 de 3</div>
          <h2 className="text-[22px] font-bold text-[#0D0D0D] mb-1 tracking-tight">Confirma el pago</h2>
          <p className="text-[13px] text-[#0D0D0D]/40 mb-5">€{hogarPrice.toFixed(2)}/mes · Sin permanencia</p>

          {/* Payment method tabs */}
          <div className="flex gap-2 mb-5 p-1 rounded-[13px]" style={{ background: 'rgba(13,13,13,.06)' }}>
            {([
              { k: 'card',  l: 'Tarjeta',   i: '💳' },
              { k: 'bizum', l: 'Bizum',      i: '💙' },
              { k: 'apple', l: 'Apple Pay',  i: '🍎' },
            ] as { k: PayMethod; l: string; i: string }[]).map(pm => (
              <button key={pm.k} onClick={() => setPayMethod(pm.k)}
                className="flex-1 py-2 rounded-[10px] text-[11px] font-semibold transition-all duration-200"
                style={payMethod === pm.k
                  ? { background: '#0D0D0D', color: 'white' }
                  : { background: 'transparent', color: 'rgba(13,13,13,.45)' }}>
                {pm.i} {pm.l}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {payMethod === 'card' && (
              <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}>
                <label className={labelCls}>Número de tarjeta</label>
                <input type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                  value={cardNum} onChange={e => setCardNum(e.target.value.slice(0, 19))}
                  className={`${inputCls} mb-4`} style={inputSty} />
                <div className="flex gap-3 mb-6">
                  <div className="flex-1">
                    <label className={labelCls}>Caducidad</label>
                    <input type="text" placeholder="MM/AA"
                      value={cardExpiry} onChange={e => setCardExpiry(e.target.value.slice(0, 5))}
                      className={inputCls} style={inputSty} />
                  </div>
                  <div className="flex-1">
                    <label className={labelCls}>CVC</label>
                    <input type="text" inputMode="numeric" placeholder="123"
                      value={cardCvc} onChange={e => setCardCvc(e.target.value.slice(0, 3))}
                      className={inputCls} style={inputSty} />
                  </div>
                </div>
              </motion.div>
            )}

            {payMethod === 'bizum' && (
              <motion.div key="bizum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }} className="mb-6">
                <label className={labelCls}>Número de móvil</label>
                <input type="tel" placeholder="+34 600 000 000"
                  value={bizumPhone} onChange={e => setBizumPhone(e.target.value)}
                  className={inputCls} style={inputSty} />
                <p className="text-[11px] text-[#0D0D0D]/35 mt-2">Recibirás una solicitud de pago en tu app de banco.</p>
              </motion.div>
            )}

            {payMethod === 'apple' && (
              <motion.div key="apple" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }} className="mb-6">
                <div className="rounded-[13px] p-4 flex items-center gap-3 border border-[#0D0D0D]/10"
                  style={{ background: 'rgba(13,13,13,.04)' }}>
                  <span className="text-[28px]">🍎</span>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0D0D0D]">Apple Pay</div>
                    <div className="text-[11px] text-[#0D0D0D]/40">Confirma con Face ID o Touch ID</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button whileTap={tapScale} onClick={handlePay}
            className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mb-3"
            style={{ background: '#1D9E75' }}>
            Pagar €{hogarPrice.toFixed(2)}/mes →
          </motion.button>
          <p className="text-center text-[12px] text-[#0D0D0D]/35">🔒 Pago seguro · Cancela cuando quieras</p>

          <button onClick={() => setStep(2)} className="w-full text-center text-[12px] text-[#0D0D0D]/35 py-2 mt-1">
            ← Volver
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const content = (
    <div className="flex-1 rounded-t-[28px] -mt-1 relative z-10 overflow-y-auto"
      style={{ background: 'var(--sand-base)' }}>
      <div className="p-6 pb-10">{steps}</div>
    </div>
  )

  const progressBar = (
    <div className="flex gap-1.5">
      {([1, 2, 3] as Step[]).map(i => (
        <div key={i} className="h-[3px] flex-1 rounded-full transition-all duration-300"
          style={{ background: i <= step ? '#1D9E75' : 'rgba(255,255,255,.15)' }} />
      ))}
    </div>
  )

  if (inline) {
    return (
      <div className="flex flex-col h-full" style={{ background: '#0d1a10' }}>
        <div className="px-6 pt-6 pb-3 flex-shrink-0">
          <div className="text-white/80 text-[18px] font-bold tracking-tight mb-4">daily</div>
          {progressBar}
        </div>
        {content}
      </div>
    )
  }

  return (
    <div className="phone-frame" style={{ background: '#0d1a10' }}>
      <div className="flex justify-between items-center px-7 pt-3 pb-0 text-white text-[13px] font-bold flex-shrink-0">
        <span>9:41</span>
        <div className="w-28 h-7 bg-black rounded-full" />
        <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
          <path d="M1 8h2v4H1zM5 5h2v7H5zM9 3h2v9H9zM13 0h2v12h-2z"/>
        </svg>
      </div>
      <div className="px-6 pt-4 pb-3 flex-shrink-0">
        <div className="text-white/80 text-[18px] font-bold tracking-tight mb-4">daily</div>
        {progressBar}
      </div>
      {content}
    </div>
  )
}
