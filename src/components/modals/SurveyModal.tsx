'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import Sheet from '@/components/ui/Sheet'
import { PRODUCTS, calcPrice, getBundleDiscount } from '@/lib/products'
import { fadeUp, stagger, tapScale, scaleIn } from '@/lib/animations'
import type { ProductId } from '@/types'

interface SurveyModalProps {
  productId: ProductId | null
  activeCount: number
  onClose: () => void
  onActivated: (productId: ProductId, price: number, policyId?: string, answers?: Record<string, string>) => void
  customerName?: string
  isLoggedIn?: boolean
  onLoggedIn?: (name: string, customerId: string) => void
}

type Phase = 'questions' | 'price' | 'details' | 'payment' | 'processing' | 'success'

export default function SurveyModal({ productId, activeCount, onClose, onActivated, customerName, isLoggedIn, onLoggedIn }: SurveyModalProps) {
  const product = PRODUCTS.find(p => p.id === productId)

  const [qStep, setQStep]     = useState(0)
  const [phase, setPhase]     = useState<Phase>('questions')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [createdPolicyId, setCreatedPolicyId] = useState<string | undefined>()
  const [regName, setRegName]   = useState('')
  const [regEmail, setRegEmail] = useState('')

  useEffect(() => {
    if (productId) {
      setQStep(0)
      setPhase('questions')
      setAnswers({})
      setRegName('')
      setRegEmail('')
      setCreatedPolicyId(undefined)
    }
  }, [productId])

  if (!product) return null

  const nQ       = product.questions.length
  const currentQ = phase === 'questions' ? product.questions[qStep] : null

  const basePrice  = calcPrice(product.id, answers)
  const bundleDisc = getBundleDiscount(activeCount + 1)
  const finalPrice = Math.round(basePrice * (1 - bundleDisc / 100) * 100) / 100

  const needsReg    = !isLoggedIn
  const canPay      = !needsReg || (!!regName && !!regEmail)
  const displayName = regName || customerName || ''

  // Progress: nQ segments for questions + 1 for price reveal
  const progressTotal  = nQ + 1
  const progressFilled = phase === 'questions' ? qStep : phase === 'price' ? nQ : progressTotal

  function selectOption(qId: string, label: string) {
    const newAnswers = { ...answers, [qId]: label }
    setAnswers(newAnswers)
    setTimeout(() => {
      if (qStep < nQ - 1) setQStep(q => q + 1)
      else setPhase('price')
    }, 180)
  }

  function goBack() {
    if (phase === 'payment') { setPhase('details'); return }
    if (phase === 'details') { setPhase('price'); return }
    if (phase === 'price')   { setPhase('questions'); setQStep(nQ - 1); return }
    if (qStep > 0)           { setQStep(q => q - 1) }
  }

  async function handlePay() {
    if (!product || !canPay) return
    setLoading(true)
    setPhase('processing')

    if (process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true') {
      try {
        const customerId = localStorage.getItem('customerId')
        const res = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, price: finalPrice, answers, customerId }),
        })
        const { url } = await res.json()
        if (url) { window.location.href = url; return }
      } catch (e) { console.error(e) }
      setLoading(false)
      return
    }

    let customerId = localStorage.getItem('customerId')
    if (!customerId && regName && regEmail) {
      try {
        const res  = await fetch('/api/register-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: regName, email: regEmail, city: 'Madrid', platform: Capacitor.isNativePlatform() ? 'android' : 'web' }),
        })
        const data = await res.json()
        if (data.customerId) {
          localStorage.setItem('customerId', data.customerId)
          localStorage.setItem('customerName', regName)
          customerId = data.customerId
          onLoggedIn?.(regName, data.customerId)
        }
      } catch (e) { console.error(e) }
    }

    await new Promise(r => setTimeout(r, 1500))
    try {
      if (customerId) {
        const res  = await fetch('/api/create-policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, product: product.id, monthlyPremium: finalPrice, answers }),
        })
        const data = await res.json()
        if (data.policyId) setCreatedPolicyId(data.policyId)
      }
    } catch (e) { console.error(e) }
    setPhase('success')
    setLoading(false)
  }

  function handleDone() {
    onActivated(product!.id as ProductId, finalPrice, createdPolicyId, answers)
    onClose()
  }

  const showChrome = phase !== 'success' && phase !== 'processing'

  return (
    <Sheet open={!!productId} onClose={phase === 'success' ? handleDone : onClose}>
      <div className="px-5 pt-4">

        {/* Header */}
        {showChrome && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[18px]"
                style={{ background: `color-mix(in srgb, ${product.color} 15%, var(--sand-modal))` }}>
                {product.icon}
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0D0D0D]">Activar {product.label}</div>
                <div className="text-[11px] text-[#0D0D0D]/40">
                  {phase === 'questions'
                    ? `Pregunta ${qStep + 1} de ${nQ}`
                    : phase === 'price' ? 'Tu precio'
                    : phase === 'details' ? 'Cobertura incluida'
                    : 'Confirmar pago'}
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] text-[#0D0D0D]/40"
              style={{ background: 'rgba(13,13,13,.07)' }}>✕</button>
          </div>
        )}

        {/* Progress bar */}
        {showChrome && (
          <div className="flex gap-1 mb-5">
            {Array.from({ length: progressTotal }).map((_, i) => (
              <div key={i} className="h-[3px] flex-1 rounded-full transition-all duration-300"
                style={{ background: i < progressFilled ? product.color : 'rgba(13,13,13,.1)' }} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* Question step */}
          {phase === 'questions' && currentQ && (
            <motion.div key={`q${qStep}`} variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0, x: -10 }}>
              <motion.h3 variants={fadeUp} className="text-[20px] font-bold text-[#0D0D0D] mb-5 leading-snug tracking-tight">
                {currentQ.label}
              </motion.h3>
              <motion.div variants={stagger}>
                {currentQ.options.map(opt => (
                  <motion.button key={opt.label} variants={scaleIn} whileTap={tapScale}
                    onClick={() => selectOption(currentQ.id, opt.label)}
                    className="w-full text-left rounded-[13px] p-4 mb-2 border transition-all"
                    style={{
                      background: answers[currentQ.id] === opt.label
                        ? `color-mix(in srgb, ${product.color} 10%, var(--sand-modal))`
                        : 'rgba(13,13,13,.04)',
                      borderColor: answers[currentQ.id] === opt.label ? product.color : 'rgba(13,13,13,.1)',
                    }}>
                    <div className="text-[14px] font-semibold text-[#0D0D0D]">{opt.label}</div>
                    {opt.desc && <div className="text-[12px] text-[#0D0D0D]/40 mt-0.5">{opt.desc}</div>}
                  </motion.button>
                ))}
              </motion.div>
              {qStep > 0 && (
                <button onClick={goBack} className="w-full text-center py-3 text-[12px] text-[#0D0D0D]/35 mt-1">
                  ← Volver
                </button>
              )}
            </motion.div>
          )}

          {/* Price reveal */}
          {phase === 'price' && (
            <motion.div key="price" variants={stagger} initial="hidden" animate="visible" className="text-center">
              <motion.div variants={fadeUp} className="text-[10px] font-bold text-[#0D0D0D]/40 uppercase tracking-[1px] mb-2">
                Tu precio personalizado
              </motion.div>
              {bundleDisc > 0 && (
                <motion.div variants={fadeUp} className="text-[11px] font-semibold mb-2" style={{ color: '#1D9E75' }}>
                  🎁 Descuento multi-seguro: -{bundleDisc}%
                </motion.div>
              )}
              <motion.div variants={fadeUp} className="text-[60px] font-bold text-[#0D0D0D] tracking-[-3px] leading-none mb-1">
                €{finalPrice.toFixed(2)}
              </motion.div>
              <motion.div variants={fadeUp} className="text-[12px] text-[#0D0D0D]/40 mb-5">
                {product.id === 'travel' ? 'por viaje · pago único' : 'al mes · sin permanencia'}
              </motion.div>
              <motion.div variants={fadeUp} className="rounded-[12px] p-4 mb-5 text-left"
                style={{ background: 'rgba(13,13,13,.04)', border: '1px solid rgba(13,13,13,.08)' }}>
                <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-2">Lo que has elegido</div>
                {product.questions.map(q => (
                  <div key={q.id} className="flex justify-between text-[12px] py-1 gap-4">
                    <span className="text-[#0D0D0D]/45 truncate">{q.label}</span>
                    <span className="font-semibold text-[#0D0D0D] flex-shrink-0">{answers[q.id] || '—'}</span>
                  </div>
                ))}
              </motion.div>
              <motion.button variants={fadeUp} whileTap={tapScale} onClick={() => setPhase('details')}
                className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mb-2"
                style={{ background: '#0D0D0D' }}>
                Ver cobertura incluida →
              </motion.button>
              <button onClick={goBack} className="w-full text-[12px] text-[#0D0D0D]/35 py-2">
                ← Cambiar respuestas
              </button>
            </motion.div>
          )}

          {/* Coverage details */}
          {phase === 'details' && product.coverageDetails && (
            <motion.div key="details" variants={stagger} initial="hidden" animate="visible">
              <motion.h3 variants={fadeUp} className="text-[20px] font-bold text-[#0D0D0D] mb-1 tracking-tight">
                Tu cobertura incluye
              </motion.h3>
              <motion.p variants={fadeUp} className="text-[12px] text-[#0D0D0D]/45 mb-4">
                Ficha resumen · {product.label} · €{finalPrice.toFixed(2)}{product.id === 'travel' ? '/viaje' : '/mes'}
              </motion.p>

              <motion.div variants={fadeUp} className="rounded-[13px] p-4 mb-3"
                style={{ background: 'rgba(29,158,117,.07)', border: '1px solid rgba(29,158,117,.2)' }}>
                <div className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-[0.8px] mb-2.5">Coberturas incluidas</div>
                {product.coverageDetails.coberturas.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                    <span className="text-[#1D9E75] text-[12px] mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-[13px] text-[#0D0D0D]">{c}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} className="rounded-[13px] p-4 mb-3"
                style={{ background: 'rgba(13,13,13,.04)', border: '1px solid rgba(13,13,13,.08)' }}>
                <div className="text-[10px] font-bold text-[#0D0D0D]/45 uppercase tracking-[0.8px] mb-2.5">Límites de cobertura</div>
                {product.coverageDetails.limites.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                    <span className="text-[12px] mt-0.5 flex-shrink-0">📊</span>
                    <span className="text-[13px] text-[#0D0D0D]/70">{l}</span>
                  </div>
                ))}
                <div className="mt-2.5 pt-2.5 border-t border-[#0D0D0D]/[0.07]">
                  <span className="text-[11px] text-[#0D0D0D]/40">Franquicia: </span>
                  <span className="text-[11px] font-semibold text-[#0D0D0D]/65">{product.coverageDetails.franquia}</span>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="rounded-[13px] p-4 mb-3"
                style={{ background: 'rgba(216,90,48,.06)', border: '1px solid rgba(216,90,48,.15)' }}>
                <div className="text-[10px] font-bold uppercase tracking-[0.8px] mb-2.5" style={{ color: '#D85A30' }}>Principales exclusiones</div>
                {product.coverageDetails.exclusiones.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                    <span className="text-[12px] mt-0.5 flex-shrink-0" style={{ color: '#D85A30' }}>✕</span>
                    <span className="text-[13px] text-[#0D0D0D]/60">{e}</span>
                  </div>
                ))}
              </motion.div>

              {(product.carenciaDays ?? 0) > 0 && (
                <motion.div variants={fadeUp} className="rounded-[13px] p-3.5 mb-4 flex items-start gap-2.5"
                  style={{ background: 'rgba(255,193,7,.1)', border: '1px solid rgba(255,193,7,.3)' }}>
                  <span className="text-[16px] flex-shrink-0">⏳</span>
                  <div>
                    <div className="text-[12px] font-bold" style={{ color: '#8B6000' }}>
                      Período de carencia: {product.carenciaDays} días
                    </div>
                    <div className="text-[11px] text-[#0D0D0D]/50 mt-0.5">
                      La cobertura se activa {product.carenciaDays} días tras la contratación. No cubre incidentes anteriores.
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.button variants={fadeUp} whileTap={tapScale} onClick={() => setPhase('payment')}
                className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mb-2"
                style={{ background: '#0D0D0D' }}>
                Confirmar y pagar →
              </motion.button>
              <button onClick={goBack} className="w-full text-[12px] text-[#0D0D0D]/35 py-2">
                ← Volver al precio
              </button>
            </motion.div>
          )}

          {/* Payment step */}
          {phase === 'payment' && (
            <motion.div key="payment" variants={stagger} initial="hidden" animate="visible">
              <motion.h3 variants={fadeUp} className="text-[20px] font-bold text-[#0D0D0D] mb-1 tracking-tight">
                Confirma tu pago
              </motion.h3>
              <motion.p variants={fadeUp} className="text-[12px] text-[#0D0D0D]/45 mb-4">
                {product.id === 'travel' ? 'Pago único por este viaje.' : 'Primer mes. Cancela cuando quieras.'}
              </motion.p>

              <motion.div variants={fadeUp} className="rounded-[14px] p-4 mb-4 flex justify-between items-center"
                style={{ background: '#0D0D0D' }}>
                <div>
                  <div className="text-[10px] text-white/40 font-semibold uppercase tracking-[0.5px]">Pagas hoy</div>
                  <div className="text-[11px] text-white/35 mt-1">
                    {product.label} · {product.id === 'travel' ? 'Viaje único' : 'Mes 1'}
                  </div>
                </div>
                <div className="text-[28px] font-bold tracking-tight" style={{ color: '#1D9E75' }}>
                  €{finalPrice.toFixed(2)}
                </div>
              </motion.div>

              {needsReg && (
                <motion.div variants={fadeUp} className="mb-4">
                  <div className="text-[10px] font-bold text-[#0D0D0D]/40 uppercase tracking-[0.8px] mb-2">Tus datos</div>
                  <input value={regName} onChange={e => setRegName(e.target.value)}
                    placeholder="Tu nombre" type="text"
                    className="w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D] mb-2"
                    style={{ background: 'rgba(13,13,13,.05)', border: '1px solid rgba(13,13,13,.12)' }} />
                  <input value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    placeholder="tu@email.com" type="email"
                    className="w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D]"
                    style={{ background: 'rgba(13,13,13,.05)', border: '1px solid rgba(13,13,13,.12)' }} />
                </motion.div>
              )}

              <motion.div variants={stagger}>
                {[
                  { icon: '💙', label: 'Bizum',     sub: '+34 600 000 000' },
                  { icon: '💳', label: 'Tarjeta',   sub: 'Visa •••• 4242'  },
                  { icon: '🍎', label: 'Apple Pay', sub: 'iPhone de Ana'   },
                ].map((pm, i) => (
                  <motion.button key={i} variants={scaleIn} whileTap={tapScale}
                    onClick={handlePay} disabled={loading || !canPay}
                    className="w-full flex items-center gap-3 rounded-[11px] p-3.5 mb-2 border text-left transition-opacity disabled:opacity-35"
                    style={{ background: 'rgba(13,13,13,.04)', borderColor: 'rgba(13,13,13,.1)' }}>
                    <span className="text-[18px]">{pm.icon}</span>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold text-[#0D0D0D]">{pm.label}</div>
                      <div className="text-[11px] text-[#0D0D0D]/35">{pm.sub}</div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              <div className="text-[11px] text-[#0D0D0D]/25 text-center mt-3">
                Pago cifrado · Stripe · Cancela cuando quieras
              </div>
              <button onClick={goBack} className="w-full text-[12px] text-[#0D0D0D]/35 py-2.5">
                ← Volver al precio
              </button>
            </motion.div>
          )}

          {/* Processing */}
          {phase === 'processing' && (
            <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
              <div className="w-9 h-9 border-[3px] border-[#0D0D0D]/10 border-t-[#1D9E75] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[13px] text-[#0D0D0D]/40">Procesando pago…</p>
            </motion.div>
          )}

          {/* Success */}
          {phase === 'success' && (
            <motion.div key="ok" variants={stagger} initial="hidden" animate="visible" className="text-center pt-2 pb-2">
              <motion.div variants={scaleIn}
                className="w-[68px] h-[68px] rounded-full bg-[#1D9E75] flex items-center justify-center text-[28px] text-white mx-auto mb-4"
                style={{ boxShadow: '0 8px 24px rgba(29,158,117,.35)' }}>
                ✓
              </motion.div>
              <motion.h3 variants={fadeUp} className="text-[26px] font-bold text-[#0D0D0D] tracking-tight mb-1">
                ¡Listo!
              </motion.h3>
              <motion.p variants={fadeUp} className="text-[13px] text-[#0D0D0D]/45 mb-5 leading-relaxed">
                {(() => {
                  const days = product.carenciaDays ?? 0
                  if (days === 0) return <>Tu seguro de {product.label.toLowerCase()}<br />está activo desde hoy.</>
                  const d = new Date(); d.setDate(d.getDate() + days)
                  const date = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
                  return <>Pago confirmado. Tu cobertura<br />comenzará el <strong className="text-[#0D0D0D]/70">{date}</strong>.</>
                })()}
              </motion.p>

              <motion.div variants={fadeUp} className="rounded-[14px] p-4 mb-4 text-left"
                style={{ background: '#e8f5e9', border: '1px solid rgba(13,13,13,.06)' }}>
                <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-black/[0.07]">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#FAC775,#D85A30)' }}>M</div>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: '#075E54' }}>María de Daily</div>
                    <div className="text-[10px] text-[#0D0D0D]/35">en línea</div>
                  </div>
                </div>
                <div className="rounded-lg rounded-tl-none p-3 text-[12px] leading-[1.5]"
                  style={{ background: '#DCF8C6', color: 'rgba(13,13,13,.8)' }}>
                  ¡Hola{displayName ? ` ${displayName}` : ''}! 👋 Tu pago está confirmado y tu seguro ya está activo.
                  Para completar tu póliza con Mapfre necesito una foto rápida de tu DNI. ¡Bienvenido a Daily! 😊
                  <div className="text-right text-[9px] text-[#0D0D0D]/30 mt-1">ahora · ✓✓</div>
                </div>
              </motion.div>

              <motion.button variants={fadeUp} whileTap={tapScale} onClick={handleDone}
                className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white"
                style={{ background: '#0D0D0D' }}>
                Continuar al app
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </Sheet>
  )
}
