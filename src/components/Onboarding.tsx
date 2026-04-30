'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { tapScale } from '@/lib/animations'

interface Props {
  product: 'home' | 'pet'
  onComplete: () => void
  inline?: boolean
}

type Step = 1 | 2

const LIVING = ['Estudio', 'Piso compartido', 'Piso en propiedad', 'Casa'] as const
const STUFF  = ['Menos de €5.000', '€5.000 – €15.000', 'Más de €15.000'] as const

const PET_OPS = [
  { label: 'Perro pequeño', emoji: '🐶', price: 33.6 },
  { label: 'Perro mediano', emoji: '🐕', price: 40.8 },
  { label: 'Perro grande',  emoji: '🦮', price: 50.4 },
  { label: 'Gato',          emoji: '🐱', price: 26.4 },
] as const

const HOME_FEATURES = [
  'Daños eléctricos incluidos de serie',
  'Indemnización en efectivo — tú eliges al reparador',
  'Cancela cuando quieras, sin llamadas ni papeleo',
]

const PET_FEATURES = [
  'Consultas veterinarias y urgencias',
  'Cirugía y hospitalización',
  'Diagnósticos (radiografías, analíticas, ecografías)',
  'Vacunas anuales incluidas',
  'Responsabilidad civil frente a terceros',
]

function calcHogar(living: string, stuff: string): number {
  let base = 9.0
  if (living === 'Piso compartido')   base = 10.0
  if (living === 'Piso en propiedad') base = 12.0
  if (living === 'Casa')              base = 14.0
  if (stuff === '€5.000 – €15.000')  base += 1.5
  if (stuff === 'Más de €15.000')    base += 3.5
  return Math.round(base * 1.2 * 10) / 10
}

function getComp(price: number): string {
  if (price < 15) return 'un café al día ☕'
  if (price < 25) return '2 copas en Malasaña 🍷'
  if (price < 35) return 'el gym que no usas 💪'
  if (price < 45) return 'una cena para dos 🍝'
  return 'Spotify + Netflix juntos 🎬'
}

export default function Onboarding({ product, onComplete, inline }: Props) {
  const [step, setStep]         = useState<Step>(1)
  const [living, setLiving]     = useState('')
  const [stuff, setStuff]       = useState('')
  const [petLabel, setPetLabel] = useState('')
  const [petPrice, setPetPrice] = useState(0)

  const hogarPrice  = product === 'home' && living && stuff ? calcHogar(living, stuff) : 0
  const price       = product === 'home' ? hogarPrice : petPrice
  const compText    = getComp(price)
  const canProceed  = product === 'home' ? !!(living && stuff) : !!petLabel

  function handleComplete() {
    if (product === 'home') {
      localStorage.setItem('daily_onboarding_complete', 'true')
      localStorage.setItem('daily_hogar_price', String(hogarPrice))
    } else {
      localStorage.setItem('daily_mascota_price', String(petPrice))
      localStorage.setItem('daily_mascota_type', petLabel)
    }
    onComplete()
  }

  const sel      = 'text-white font-semibold'
  const unsel    = 'text-[#0D0D0D] font-medium'
  const chip     = 'px-4 py-2.5 rounded-[11px] text-[13px] border transition-all duration-200'
  const chipSel  = `${chip} border-transparent`
  const chipUn   = `${chip} border-[#0D0D0D]/10 bg-[rgba(13,13,13,.04)]`
  const lbl      = 'text-[11px] font-bold text-[#0D0D0D]/40 uppercase tracking-[0.8px] mb-2 block'

  const steps = (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}>
          <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[1px] mb-1">Paso 1 de 2</div>

          {product === 'home' ? (
            <>
              <h2 className="text-[22px] font-bold text-[#0D0D0D] mb-1 tracking-tight">Cuéntanos sobre tu hogar</h2>
              <p className="text-[13px] text-[#0D0D0D]/40 mb-5">Solo aseguramos tus cosas, no las paredes — eso es del propietario.</p>
              <span className={lbl}>¿Dónde vives?</span>
              <div className="flex flex-wrap gap-2 mb-5">
                {LIVING.map(o => (
                  <button key={o} onClick={() => setLiving(o)}
                    className={living === o ? `${chipSel} ${sel}` : `${chipUn} ${unsel}`}
                    style={living === o ? { background: '#1D9E75' } : {}}>
                    {o}
                  </button>
                ))}
              </div>
              <span className={lbl}>¿Cuánto valen tus cosas?</span>
              <div className="flex flex-wrap gap-2 mb-6">
                {STUFF.map(o => (
                  <button key={o} onClick={() => setStuff(o)}
                    className={stuff === o ? `${chipSel} ${sel}` : `${chipUn} ${unsel}`}
                    style={stuff === o ? { background: '#1D9E75' } : {}}>
                    {o}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[22px] font-bold text-[#0D0D0D] mb-1 tracking-tight">¿Qué mascota tienes?</h2>
              <p className="text-[13px] text-[#0D0D0D]/40 mb-5">Cobertura completa desde el primer día, sin carencias.</p>
              <div className="flex flex-col gap-2 mb-6">
                {PET_OPS.map(o => (
                  <button key={o.label}
                    onClick={() => { setPetLabel(o.label); setPetPrice(o.price) }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-[13px] border text-left transition-all duration-200 ${petLabel === o.label ? sel : unsel}`}
                    style={petLabel === o.label
                      ? { background: '#1D9E75', borderColor: '#1D9E75' }
                      : { background: 'rgba(13,13,13,.04)', borderColor: 'rgba(13,13,13,.1)' }}>
                    <span className="text-[20px]">{o.emoji}</span>
                    <div className="flex-1 text-[14px] font-semibold">{o.label}</div>
                    <span className={`text-[13px] font-bold ${petLabel === o.label ? 'text-white/80' : 'text-[#0D0D0D]/35'}`}>
                      €{o.price.toFixed(2)}/mes
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {canProceed && (
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
          <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[1px] mb-1">Paso 2 de 2</div>
          <h2 className="text-[22px] font-bold text-[#0D0D0D] mb-5 tracking-tight">Tu cobertura personalizada</h2>

          <div className="rounded-[16px] p-4 mb-3 border border-[#0D0D0D]/[0.07]" style={{ background: 'var(--sand-card)' }}>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <span className="text-[20px]">{product === 'home' ? '🏠' : '🐾'}</span>
                <span className="text-[14px] font-semibold text-[#0D0D0D]">
                  {product === 'home' ? 'Hogar' : petLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#1D9E75]">€{price.toFixed(2)}/mes</span>
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
            {(product === 'home' ? HOME_FEATURES : PET_FEATURES).map(item => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-[11px] font-bold text-[#1D9E75] mt-[2px]">✓</span>
                <span className="text-[12px] text-[#0D0D0D]/55 leading-snug">{item}</span>
              </div>
            ))}
          </div>

          <motion.button whileTap={tapScale} onClick={handleComplete}
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
      {([1, 2] as Step[]).map(i => (
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
