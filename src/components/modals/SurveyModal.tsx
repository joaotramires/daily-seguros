'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sheet from '@/components/ui/Sheet'
import { PRODUCTS, calcPrice, getBundleDiscount } from '@/lib/products'
import { createClient } from '@/lib/supabase'
import { fadeUp, stagger, tapScale, scaleIn } from '@/lib/animations'
import type { ProductId } from '@/types'

interface SurveyModalProps {
  productId: ProductId | null
  activeCount: number
  onClose: () => void
  onActivated: (productId: ProductId, price: number) => void
  customerName?: string
}

type Step = 'q1' | 'q2' | 'q3' | 'price' | 'payment' | 'processing' | 'success'

export default function SurveyModal({ productId, activeCount, onClose, onActivated, customerName }: SurveyModalProps) {
  const product = PRODUCTS.find(p => p.id === productId)
  const [step, setStep] = useState<Step>('q1')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  if (!product) return null

  const qIndex = step === 'q1' ? 0 : step === 'q2' ? 1 : step === 'q3' ? 2 : -1
  const currentQ = qIndex >= 0 ? product.questions[qIndex] : null
  const steps: Step[] = product.questions.length === 3
    ? ['q1', 'q2', 'q3', 'price', 'payment']
    : ['q1', 'q2', 'price', 'payment']

  const stepIndex = steps.indexOf(step)
  const basePrice = calcPrice(product.id, answers)
  const bundleDisc = getBundleDiscount(activeCount + 1)
  const finalPrice = Math.round(basePrice * (1 - bundleDisc / 100) * 100) / 100

  function selectOption(qId: string, label: string) {
    const newAnswers = { ...answers, [qId]: label }
    setAnswers(newAnswers)
    setTimeout(() => {
      const nextSteps: Record<Step, Step> = {
        q1: 'q2', q2: product!.questions.length === 3 ? 'q3' : 'price',
        q3: 'price', price: 'payment', payment: 'processing', processing: 'success', success: 'success'
      }
      setStep(nextSteps[step])
    }, 180)
  }

  async function handlePay() {
    // THIS IS THE FIX: We remind the computer that the product exists before it saves to the database.
    if (!product) return; 
    
    setLoading(true)
    setStep('processing')
    // In production: call /api/create-checkout with productId, price, answers
    // For demo: simulate payment then activate
    await new Promise(r => setTimeout(r, 1500))
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        await sb.from('policies').insert({
          customer_id: user.id,
          product: product.id,
          status: 'active',
          monthly_premium: finalPrice,
          annual_premium: finalPrice * 12,
          answers,
          starts_at: new Date().toISOString(),
        })
      }
    } catch (e) { console.error(e) }
    setStep('success')
    setLoading(false)
  }

  function handleDone() {
    onActivated(product!.id as ProductId, finalPrice)
    onClose()
  }

  const stepNum = ['q1','q2','q3','price','payment'].indexOf(step) + 1
  const totalSteps = steps.length

  return (
    <Sheet open={!!productId} onClose={step === 'success' ? handleDone : onClose}>
      <div className="px-5 pt-4">
        {/* Header */}
        {step !== 'success' && step !== 'processing' && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[18px]"
                style={{ background: `color-mix(in srgb, ${product.color} 15%, var(--sand-modal))` }}>
                {product.icon}
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0D0D0D]">Activar {product.label}</div>
                <div className="text-[11px] text-[#0D0D0D]/40">
                  {currentQ ? `Pregunta ${qIndex + 1} de ${product.questions.length}` :
                   step === 'price' ? 'Tu precio' : 'Pago'}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] text-[#0D0D0D]/40"
              style={{ background: 'rgba(13,13,13,.07)' }}>✕</button>
          </div>
        )}

        {/* Progress */}
        {step !== 'success' && step !== 'processing' && (
          <div className="flex gap-1 mb-5">
            {steps.filter(s => s !== 'payment' || true).slice(0, totalSteps).map((s, i) => (
              <div key={s} className="h-[3px] flex-1 rounded-full transition-all duration-300"
                style={{ background: i <= stepIndex ? product.color : 'rgba(13,13,13,.1)' }} />
            ))}
          </div>
        )}

        {/* Question steps */}
        <AnimatePresence mode="wait">
          {currentQ && (
            <motion.div key={step} variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0, x: -10 }}>
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
              {qIndex > 0 && (
                <button onClick={() => setStep(steps[stepIndex - 1])}
                  className="w-full text-center py-3 text-[12px] text-[#0D0D0D]/35 mt-1">
                  ← Volver
                </button>
              )}
            </motion.div>
          )}

          {step === 'price' && (
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

              {/* Answers summary */}
              <motion.div variants={fadeUp} className="rounded-[12px] p-4 mb-5 text-left"
                style={{ background: 'rgba(13,13,13,.04)', border: '1px solid rgba(13,13,13,.08)' }}>
                <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-2">Lo que has elegido</div>
                {product.questions.map(q => (
                  <div key={q.id} className="flex justify-between text-[12px] py-1">
                    <span className="text-[#0D0D0D]/45">{q.label}</span>
                    <span className="font-semibold text-[#0D0D0D]">{answers[q.id] || '—'}</span>
                  </div>
                ))}
              </motion.div>

              <motion.button variants={fadeUp} whileTap={tapScale} onClick={() => setStep('payment')}
                className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mb-2"
                style={{ background: '#0D0D0D' }}>
                Continuar al pago →
              </motion.button>
              <button onClick={() => setStep(steps[stepIndex - 1])}
                className="w-full text-[12px] text-[#0D0D0D]/35 py-2">← Cambiar respuestas</button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div key="payment" variants={stagger} initial="hidden" animate="visible">
              <motion.h3 variants={fadeUp} className="text-[20px] font-bold text-[#0D0D0D] mb-1 tracking-tight">
                Confirma tu pago
              </motion.h3>
              <motion.p variants={fadeUp} className="text-[12px] text-[#0D0D0D]/45 mb-5">
                {product.id === 'travel' ? 'Pago único por este viaje.' : 'Primer mes. Cancela cuando quieras.'}
              </motion.p>

              <motion.div variants={fadeUp} className="rounded-[14px] p-4 mb-5 flex justify-between items-center"
                style={{ background: '#0D0D0D' }}>
                <div>
                  <div className="text-[10px] text-white/40 font-semibold uppercase tracking-[0.5px]">Pagas hoy</div>
                  <div className="text-[11px] text-white/35 mt-1">{product.label} · {product.id === 'travel' ? 'Viaje único' : 'Mes 1'}</div>
                </div>
                <div className="text-[28px] font-bold tracking-tight" style={{ color: '#1D9E75' }}>
                  €{finalPrice.toFixed(2)}
                </div>
              </motion.div>

              <motion.div variants={stagger}>
                {[
                  { icon: '💙', label: 'Bizum', sub: '+34 600 000 000' },
                  { icon: '💳', label: 'Tarjeta', sub: 'Visa •••• 4242' },
                  { icon: '🍎', label: 'Apple Pay', sub: 'iPhone de Ana' },
                ].map((pm, i) => (
                  <motion.button key={i} variants={scaleIn} whileTap={tapScale}
                    onClick={handlePay} disabled={loading}
                    className="w-full flex items-center gap-3 rounded-[11px] p-3.5 mb-2 border text-left"
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
              <button onClick={() => setStep('price')} className="w-full text-[12px] text-[#0D0D0D]/35 py-2.5">
                ← Volver al precio
              </button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
              <div className="w-9 h-9 border-[3px] border-[#0D0D0D]/10 border-t-[#1D9E75] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[13px] text-[#0D0D0D]/40">Procesando pago…</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="ok" variants={stagger} initial="hidden" animate="visible" className="text-center pt-2 pb-2">
              <motion.div variants={scaleIn}
                className="w-[68px] h-[68px] rounded-full bg-[#1D9E75] flex items-center justify-center text-[28px] text-white mx-auto mb-4"
                style={{ boxShadow: '0 8px 24px rgba(29,158,117,.35)' }}>
                ✓
              </motion.div>
              <motion.h3 variants={fadeUp} className="text-[26px] font-bold text-[#0D0D0D] tracking-tight mb-1">¡Listo!</motion.h3>
              <motion.p variants={fadeUp} className="text-[13px] text-[#0D0D0D]/45 mb-5 leading-relaxed">
                Tu seguro de {product.label.toLowerCase()}<br />está activo desde hoy.
              </motion.p>

              {/* WhatsApp bubble */}
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
                  ¡Hola {customerName || ''}! 👋 Tu pago está confirmado y tu seguro ya está activo.
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