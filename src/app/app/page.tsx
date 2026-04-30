'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Toggle from '@/components/ui/Toggle'
import SurveyModal from '@/components/modals/SurveyModal'
import Sheet from '@/components/ui/Sheet'
import Onboarding from '@/components/Onboarding'
import { getBundleDiscount, getLoyaltyDiscount } from '@/lib/products'
import { fadeUp, stagger, tapScale } from '@/lib/animations'
import type { ProductId } from '@/types'

const COMPS = [
  { max: 15,       text: 'Un café al día ☕' },
  { max: 25,       text: '2 copas en Malasaña 🍷' },
  { max: 35,       text: 'El gym que no usas 💪' },
  { max: 45,       text: 'Una cena para dos 🍝' },
  { max: 60,       text: 'Spotify + Netflix juntos 🎬' },
  { max: Infinity, text: 'Menos que un Glovo al mes 🛵' },
]

const COVERAGES: Record<string, string[]> = {
  home: [
    'Incendio y daños por agua (tuberías, goteras)',
    'Robo con fractura y robo en el interior',
    'Daños eléctricos y cortocircuitos',
    'Responsabilidad civil frente a vecinos',
    'Asistencia en hogar 24h (cerrajero, fontanero)',
    'Fenómenos meteorológicos (granizo, viento)',
    'Indemnización en efectivo — tú eliges al reparador',
  ],
  pet: [
    'Consultas veterinarias y urgencias',
    'Cirugía y hospitalización',
    'Diagnósticos (radiografías, analíticas, ecografías)',
    'Vacunas anuales incluidas',
    'Responsabilidad civil por daños a terceros',
    'Muerte accidental o por enfermedad',
  ],
}

const PET_OPTIONS = [
  { label: 'Perro pequeño', emoji: '🐶', price: 33.6 },
  { label: 'Perro mediano', emoji: '🐕', price: 40.8 },
  { label: 'Perro grande',  emoji: '🦮', price: 50.4 },
  { label: 'Gato',          emoji: '🐱', price: 26.4 },
]

function endOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function HomePage() {
  const [active, setActive]           = useState({ home: false, pet: false })
  const [prices, setPrices]           = useState({ home: 0, pet: 0 })
  const [mascotaType, setMascotaType] = useState('')
  const [policyIds, setPolicyIds]     = useState<Record<string, string>>({})
  const [loyaltyMonths, setLoyaltyMonths] = useState(0)

  const [cancelling, setCancelling]   = useState<Record<string, string>>({})
  const [cancelTarget, setCancelTarget] = useState<'home' | 'pet' | null>(null)
  const [cancelTooltip, setCancelTooltip] = useState<'home' | 'pet' | null>(null)

  const [chipInput, setChipInput]     = useState('')
  const [chipSaved, setChipSaved]     = useState(false)
  const [chipModalOpen, setChipModalOpen] = useState(false)
  const [chipBannerVisible, setChipBannerVisible] = useState(false)

  const [compIdx, setCompIdx]         = useState(0)
  const [compVisible, setCompVisible] = useState(true)
  const compTimer = useRef<ReturnType<typeof setTimeout>>()

  const [surveyProduct, setSurveyProduct] = useState<ProductId | null>(null)
  const [travelActive, setTravelActive]   = useState(false)

  const [bdOpen, setBdOpen]           = useState(false)
  const [openCov, setOpenCov]         = useState<Record<string, boolean>>({})

  const [showRegister, setShowRegister]   = useState(false)
  const [pendingProduct, setPendingProduct] = useState<'home' | 'pet' | null>(null)
  const [regForm, setRegForm]             = useState({ name: '', email: '', phone: '' })
  const [regLoading, setRegLoading]       = useState(false)

  const [activating, setActivating]   = useState<'home' | 'pet' | null>(null)

  // Onboarding overlay (triggered on first activation attempt)
  const [showOnboarding, setShowOnboarding]     = useState(false)
  const [pendingActivation, setPendingActivation] = useState<'home' | 'pet' | null>(null)

  // Pet picker (for users who get a pet after onboarding)
  const [petPickerOpen, setPetPickerOpen] = useState(false)

  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [refCopied, setRefCopied]       = useState(false)

  useEffect(() => {
    const hogarPrice   = parseFloat(localStorage.getItem('daily_hogar_price') || '0')
    const mascotaPrice = parseFloat(localStorage.getItem('daily_mascota_price') || '0')
    const mascType     = localStorage.getItem('daily_mascota_type') || ''
    const chip         = localStorage.getItem('daily_chip_saved') === 'true'
    if (localStorage.getItem('daily_travel_active') === 'true') setTravelActive(true)
    const rawCancelling: Record<string, string> = JSON.parse(localStorage.getItem('daily_cancelling') || '{}')
    const now = Date.now()
    const validCancelling: Record<string, string> = {}
    for (const [k, v] of Object.entries(rawCancelling)) {
      if (new Date(v).getTime() > now) validCancelling[k] = v
    }
    setPrices({ home: hogarPrice, pet: mascotaPrice })
    setMascotaType(mascType)
    setChipSaved(chip)
    setCancelling(validCancelling)

    const customerId = localStorage.getItem('customerId')
    if (!customerId) return
    fetch(`/api/get-customer?id=${customerId}`)
      .then(r => r.json())
      .then(data => {
        if (data.policies?.length) {
          const newActive = { home: false, pet: false }
          const newIds: Record<string, string> = {}
          data.policies.forEach((p: { id: string; product: string; monthly_premium: number }) => {
            if (p.product === 'home' || p.product === 'pet') {
              newActive[p.product as 'home' | 'pet'] = true
              newIds[p.product] = p.id
            }
          })
          setActive(newActive)
          setPolicyIds(newIds)
          if (newActive.pet && !chip) setChipBannerVisible(true)
        }
        if (data.loyaltyMonths) setLoyaltyMonths(data.loyaltyMonths)
        if (data.referralCode) setReferralCode(data.referralCode)
      })
      .catch(console.error)
  }, [])

  const net = (active.home && !cancelling.home ? prices.home : 0)
            + (active.pet  && !cancelling.pet  ? prices.pet  : 0)

  const validComps = COMPS.filter(c => net < c.max || c.max === Infinity)

  useEffect(() => {
    clearTimeout(compTimer.current)
    setCompIdx(0)
    setCompVisible(true)
    if (validComps.length <= 1) return
    const tick = () => {
      setCompVisible(false)
      compTimer.current = setTimeout(() => {
        setCompIdx(i => (i + 1) % validComps.length)
        setCompVisible(true)
      }, 300)
    }
    compTimer.current = setTimeout(function loop() {
      tick()
      compTimer.current = setTimeout(loop, 3300)
    }, 3000)
    return () => clearTimeout(compTimer.current)
  }, [net, validComps.length])

  const activeCount = [active.home, active.pet].filter(Boolean).length
  const bundleDisc  = getBundleDiscount(activeCount)
  const loyaltyDisc = getLoyaltyDiscount(loyaltyMonths)
  const totalDisc   = bundleDisc + loyaltyDisc
  const gross       = (active.home ? prices.home : 0) + (active.pet ? prices.pet : 0)
  const netDisplay  = gross * (1 - totalDisc / 100)
  const saved       = (gross * totalDisc / 100 * 4).toFixed(2)
  const nextTier    = [{ months: 4, disc: 5 }, { months: 12, disc: 10 }, { months: 24, disc: 15 }].find(t => t.months > loyaltyMonths)
  const streakPct   = nextTier ? Math.round((loyaltyMonths / nextTier.months) * 100) : 100

  async function activateDirect(id: 'home' | 'pet', priceOverride?: number) {
    const customerId = localStorage.getItem('customerId')
    if (!customerId) { setPendingProduct(id); setShowRegister(true); return }
    setActivating(id)
    const monthlyPremium = priceOverride ?? prices[id]
    try {
      const res  = await fetch('/api/create-policy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, product: id, monthlyPremium, answers: {} }),
      })
      const data = await res.json()
      setActive(a => ({ ...a, [id]: true }))
      if (data.policyId) setPolicyIds(p => ({ ...p, [id]: data.policyId }))
      if (id === 'pet' && !chipSaved) setChipBannerVisible(true)
    } catch (e) { console.error(e) }
    setActivating(null)
  }

  function handleToggle(id: 'home' | 'pet') {
    if (cancelling[id]) {
      setCancelTooltip(id)
      setTimeout(() => setCancelTooltip(null), 2500)
      return
    }
    if (active[id]) {
      setCancelTarget(id)
    } else if (prices[id] === 0) {
      setPendingActivation(id)
      setShowOnboarding(true)
    } else {
      activateDirect(id)
    }
  }

  function confirmCancel() {
    if (!cancelTarget) return
    const endDate = endOfMonth()
    const newCancelling = { ...cancelling, [cancelTarget]: endDate.toISOString() }
    setCancelling(newCancelling)
    localStorage.setItem('daily_cancelling', JSON.stringify(newCancelling))
    setActive(a => ({ ...a, [cancelTarget!]: false }))
    const policyId = policyIds[cancelTarget]
    if (policyId) {
      fetch('/api/cancel-policy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ policyId }) }).catch(console.error)
    }
    setCancelTarget(null)
  }

  async function handleRegisterAndBuy() {
    if (!regForm.name || !regForm.email) return
    setRegLoading(true)
    try {
      const res  = await fetch('/api/register-customer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...regForm, city: 'Madrid' }) })
      const data = await res.json()
      if (data.customerId) {
        localStorage.setItem('customerId', data.customerId)
        localStorage.setItem('customerName', regForm.name)
      }
    } catch (e) { console.error(e) }
    setRegLoading(false)
    setShowRegister(false)
    if (pendingProduct) { activateDirect(pendingProduct); setPendingProduct(null) }
  }

  function saveChip() {
    if (chipInput.length !== 15) return
    localStorage.setItem('daily_chip_saved', 'true')
    setChipSaved(true)
    setChipBannerVisible(false)
    setChipModalOpen(false)
  }

  function copyReferral() {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode).catch(() => {})
    setRefCopied(true)
    setTimeout(() => setRefCopied(false), 2000)
  }

  function handleOnboardingComplete() {
    const hp = parseFloat(localStorage.getItem('daily_hogar_price') || '0')
    const mp = parseFloat(localStorage.getItem('daily_mascota_price') || '0')
    const mt = localStorage.getItem('daily_mascota_type') || ''
    setPrices({ home: hp, pet: mp })
    setMascotaType(mt)
    setShowOnboarding(false)
    if (pendingActivation) {
      const id = pendingActivation
      const price = id === 'home' ? hp : mp
      setPendingActivation(null)
      activateDirect(id, price)
    }
  }

  const hasPet = mascotaType && mascotaType !== 'No tengo'

  const PRODUCTS_DISPLAY = [
    { id: 'home' as const, label: 'Hogar',   icon: '🏠', color: '#1D9E75', desc: 'Alquilado o recién comprado' },
    ...(hasPet
      ? [{ id: 'pet' as const, label: 'Mascota', icon: '🐾', color: '#D85A30', desc: `${mascotaType}` }]
      : []),
  ]

  return (
    <div className="px-4 py-4 pb-6 relative">
      <motion.div variants={stagger} initial="hidden" animate="visible">

        {/* Referral box */}
        <motion.div variants={fadeUp} className="rounded-[20px] overflow-hidden mb-3">
          <div className="p-5" style={{ background: '#0D0D0D' }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] mb-2" style={{ color: 'rgba(255,255,255,.3)' }}>
                  Daily Club · Recompensas
                </div>
                <div className="text-[26px] font-bold text-white leading-tight tracking-tight">
                  Netflix gratis.{' '}
                  <span style={{ color: '#E50914' }}>1 año.</span>
                </div>
                <div className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,.4)' }}>
                  Invita 3 amigos con tu código
                </div>
              </div>
              <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[22px] font-black text-white flex-shrink-0"
                style={{ background: '#E50914', fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>N</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-[10px] font-bold tracking-[3px] text-[14px] text-white"
                style={{ background: 'rgba(255,255,255,.08)' }}>
                {referralCode ? referralCode.toUpperCase() : '· · · · · ·'}
              </div>
              <motion.button whileTap={tapScale} onClick={copyReferral}
                className="px-4 py-2.5 rounded-[10px] text-[12px] font-bold transition-all"
                style={refCopied ? { background: 'rgba(29,158,117,.9)', color: 'white' } : { background: '#E50914', color: 'white' }}>
                {refCopied ? '✓ Copiado' : 'Copiar'}
              </motion.button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
                <div className="h-full rounded-full w-0" style={{ background: '#E50914' }} />
              </div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,.25)' }}>0 / 3 amigos</div>
            </div>
          </div>
        </motion.div>

        {/* Hero card */}
        <motion.div variants={fadeUp} className="rounded-[20px] p-6 mb-3 text-center"
          style={{ background: '#0D0D0D' }}>
          <motion.div key={netDisplay.toFixed(2)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="text-[50px] font-bold text-white tracking-[-2px] leading-none">
            €{netDisplay.toFixed(2)}
          </motion.div>
          <div className="text-[11px] text-white/30 mt-2 uppercase tracking-[0.8px] font-medium">
            {activeCount === 0 ? 'Activa tu primer seguro ↓' : `al mes · ${activeCount} activo${activeCount !== 1 ? 's' : ''}`}
          </div>
        </motion.div>

        {/* Bundle badge */}
        <AnimatePresence>
          {activeCount >= 2 && bundleDisc > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="rounded-[12px] p-3 mb-3 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg,#1D9E75,#0F6E56)' }}>
              <span className="text-[18px]">🎁</span>
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-white">Descuento multi-seguro activo</div>
              </div>
              <div className="text-[20px] font-bold text-white">-{bundleDisc}%</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Insurance cards */}
        {PRODUCTS_DISPLAY.map(product => {
          const isOn         = active[product.id]
          const isCancelling = !!cancelling[product.id]
          const price        = prices[product.id]
          const discPrice    = isOn && bundleDisc > 0 ? price * (1 - bundleDisc / 100) : price
          const endDate      = isCancelling ? new Date(cancelling[product.id]) : null
          const covOpen      = !!openCov[product.id]
          const isLoading    = activating === product.id

          return (
            <motion.div key={product.id} variants={fadeUp}
              className="mb-2 overflow-hidden"
              style={{
                borderRadius: 14,
                border: isCancelling
                  ? '1px solid rgba(245,158,11,.3)'
                  : `1px solid ${isOn ? product.color : 'rgba(13,13,13,.08)'}`,
                borderLeft: isCancelling ? '3px solid #F59E0B' : undefined,
                background: isCancelling
                  ? 'rgba(245,158,11,.04)'
                  : isOn
                    ? `color-mix(in srgb,${product.color} 6%,var(--sand-card))`
                    : 'var(--sand-card)',
              }}
              onClick={isCancelling ? () => handleToggle(product.id) : undefined}>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center text-[20px] flex-shrink-0 relative"
                    style={{ background: isCancelling ? 'rgba(245,158,11,.12)' : isOn ? `color-mix(in srgb,${product.color} 15%,var(--sand-card))` : 'rgba(13,13,13,.06)' }}>
                    {product.icon}
                    {chipSaved && product.id === 'pet' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1D9E75] flex items-center justify-center text-[8px] text-white font-bold">✓</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#0D0D0D]">{product.label}</div>
                    {isCancelling && endDate ? (
                      <div className="text-[11px] font-medium mt-0.5" style={{ color: '#D97706' }}>
                        Activo hasta {fmtDate(endDate)} · Mapfre notificado ✓
                      </div>
                    ) : (
                      <div className="text-[12px] text-[#0D0D0D]/40 mt-0.5">
                        {isOn ? (
                          bundleDisc > 0 ? (
                            <span>
                              <span className="line-through text-[#0D0D0D]/20 mr-1">€{price.toFixed(2)}</span>
                              <span style={{ color: product.color }}>€{discPrice.toFixed(2)}/mes</span>
                            </span>
                          ) : `€${price.toFixed(2)}/mes`
                        ) : `€${price.toFixed(2)}/mes · Inactivo`}
                      </div>
                    )}
                    {isCancelling && (
                      <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(245,158,11,.12)', color: '#D97706' }}>
                        Cancelación en curso
                      </div>
                    )}
                  </div>
                </div>
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-[#0D0D0D]/10 border-t-[#1D9E75] rounded-full animate-spin" />
                ) : (
                  <Toggle checked={isOn || isCancelling} onChange={() => !isCancelling && handleToggle(product.id)} color={product.color} />
                )}
              </div>

              <AnimatePresence>
                {cancelTooltip === product.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-2 text-[11px] text-[#D97706] font-medium border-t"
                    style={{ borderColor: 'rgba(245,158,11,.2)', background: 'rgba(245,158,11,.05)' }}>
                    Mapfre ya ha sido notificado. Sin más pasos.
                  </motion.div>
                )}
              </AnimatePresence>

              {!isCancelling && COVERAGES[product.id] && (
                <>
                  <button onClick={() => setOpenCov(prev => ({ ...prev, [product.id]: !prev[product.id] }))}
                    className="w-full flex items-center justify-between px-4 py-2 border-t"
                    style={{ borderColor: 'rgba(13,13,13,.06)' }}>
                    <span className="text-[11px] font-semibold text-[#0D0D0D]/35">
                      {covOpen ? 'Ocultar coberturas' : 'Ver coberturas incluidas'}
                    </span>
                    <motion.span animate={{ rotate: covOpen ? 180 : 0 }} transition={{ duration: 0.2 }}
                      className="text-[12px]" style={{ color: 'rgba(13,13,13,.3)', display: 'block' }}>⌃</motion.span>
                  </button>
                  <AnimatePresence>
                    {covOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        transition={{ duration: 0.22 }} className="overflow-hidden">
                        <div className="px-4 pt-2 pb-3">
                          {COVERAGES[product.id].map((item, i) => (
                            <div key={i} className="flex items-start gap-2 py-1.5">
                              <span className="text-[11px] font-bold flex-shrink-0 mt-[1px]" style={{ color: product.color }}>✓</span>
                              <span className="text-[12px] text-[#0D0D0D]/55 leading-snug">{item}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )
        })}

        {/* Mascota chip banner */}
        <AnimatePresence>
          {chipBannerVisible && !chipSaved && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="rounded-[13px] p-3.5 mb-2 flex items-center gap-3 border"
              style={{ background: 'rgba(245,158,11,.07)', borderColor: 'rgba(245,158,11,.25)' }}>
              <span className="text-[18px] flex-shrink-0">🐾</span>
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-[#D97706] leading-snug">
                  Añade el chip de tu mascota para activar cobertura completa
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setChipModalOpen(true)}
                  className="text-[11px] font-bold text-white px-2.5 py-1.5 rounded-[8px]"
                  style={{ background: '#D97706' }}>
                  Añadir
                </button>
                <button onClick={() => setChipBannerVisible(false)} className="text-[#D97706]/50 text-[14px]">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add-pet card (shown when user has no pet type set) */}
        {!hasPet && (
          <motion.div variants={fadeUp}
            className="rounded-[14px] p-4 mb-2 flex items-center gap-3 border border-dashed"
            style={{ borderColor: 'rgba(216,90,48,.3)', background: 'rgba(216,90,48,.03)' }}>
            <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center text-[20px] flex-shrink-0"
              style={{ background: 'rgba(216,90,48,.08)' }}>🐾</div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-[#0D0D0D]">Seguro Mascota</div>
              <div className="text-[11px] text-[#0D0D0D]/40 mt-0.5">Desde €26.40/mes · Perro o gato</div>
            </div>
            <motion.button whileTap={tapScale} onClick={() => setPetPickerOpen(true)}
              className="text-[12px] font-bold text-white px-3 py-2 rounded-[9px]"
              style={{ background: '#D85A30' }}>
              Añadir
            </motion.button>
          </motion.div>
        )}

        {/* Viaje add-on card */}
        <motion.div variants={fadeUp}
          className="rounded-[14px] p-4 mb-3 flex items-center gap-3 border"
          style={{
            borderStyle: travelActive ? 'solid' : 'dashed',
            borderColor: travelActive ? '#9747FF' : 'rgba(151,71,255,.3)',
            background: travelActive ? 'rgba(151,71,255,.07)' : 'rgba(151,71,255,.04)',
          }}>
          <div className="text-[24px] flex-shrink-0">✈️</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-[13px] font-semibold text-[#0D0D0D]">Cobertura de viaje</div>
              {travelActive && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#9747FF' }}>Activo</span>
              )}
            </div>
            <div className="text-[11px] text-[#0D0D0D]/40 mt-0.5">
              {travelActive ? 'Tu viaje está asegurado' : 'Solo cuando lo necesitas · Desde €3.90/viaje'}
            </div>
          </div>
          {travelActive ? (
            <motion.button whileTap={tapScale}
              onClick={() => { setTravelActive(false); localStorage.removeItem('daily_travel_active') }}
              className="text-[11px] font-bold px-3 py-2 rounded-[9px]"
              style={{ background: 'rgba(151,71,255,.12)', color: '#9747FF' }}>
              Gestionar
            </motion.button>
          ) : (
            <motion.button whileTap={tapScale}
              onClick={() => setSurveyProduct('travel')}
              className="text-[12px] font-bold text-white px-3 py-2 rounded-[9px]"
              style={{ background: '#9747FF' }}>
              Añadir
            </motion.button>
          )}
        </motion.div>

        {/* Breakdown */}
        {gross > 0 && (
          <motion.div variants={fadeUp} className="rounded-[14px] mt-1 overflow-hidden border border-[#0D0D0D]/[0.07]"
            style={{ background: 'var(--sand-card)' }}>
            <button onClick={() => setBdOpen(!bdOpen)} className="w-full flex justify-between items-center px-4 py-4">
              <div>
                <div className="text-[13px] font-semibold text-[#0D0D0D] text-left">Cómo gastamos cada euro</div>
                <div className="text-[11px] text-[#0D0D0D]/35 mt-0.5 text-left">Sin opacidad. Sin sorpresas.</div>
              </div>
              <motion.span animate={{ rotate: bdOpen ? 180 : 0 }} className="text-[#0D0D0D]/30 text-[14px]">⌃</motion.span>
            </button>
            <AnimatePresence>
              {bdOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4">
                    {[
                      { label: 'Cobertura Mapfre', pct: 82, color: '#378ADD', value: (net * 0.82).toFixed(2) },
                      { label: 'Gestión Daily',    pct: 13, color: '#1D9E75', value: (net * 0.13).toFixed(2) },
                      { label: 'Donación',         pct: 5,  color: '#9747FF', value: (net * 0.05).toFixed(2) },
                    ].map(row => (
                      <div key={row.label} className="mb-3">
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-[#0D0D0D]/50">{row.label}</span>
                          <span className="font-semibold text-[#0D0D0D]">€{row.value}</span>
                        </div>
                        <div className="h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(13,13,13,.08)' }}>
                          <motion.div className="h-full rounded-full" style={{ background: row.color }}
                            initial={{ width: 0 }} animate={{ width: `${row.pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Loyalty card */}
        <motion.div variants={fadeUp} className="rounded-[18px] p-4 mt-2 mb-2"
          style={{ background: 'var(--sand-card)', border: '1px solid rgba(29,158,117,.2)' }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-[1px]">Mes {loyaltyMonths} con Daily</div>
              <div className="text-[20px] font-bold text-[#0D0D0D] mt-1 tracking-tight">{totalDisc}% de descuento</div>
              <div className="text-[11px] text-[#0D0D0D]/40 mt-0.5">Para siempre, mientras sigas</div>
            </div>
            <div className="rounded-[10px] px-3 py-2 text-center" style={{ background: 'rgba(29,158,117,.12)' }}>
              <div className="text-[9px] font-bold text-[#1D9E75] uppercase tracking-[0.5px]">Ahorrado</div>
              <div className="text-[14px] font-bold text-[#1D9E75] mt-0.5">€{saved}</div>
            </div>
          </div>
          <div className="h-[5px] rounded-full mt-3 mb-1.5 overflow-hidden" style={{ background: 'rgba(13,13,13,.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#1D9E75,#25c48a)' }}
              initial={{ width: 0 }} animate={{ width: `${streakPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
          {nextTier && (
            <div className="flex justify-between text-[11px] text-[#0D0D0D]/30">
              <span><strong className="text-[#0D0D0D]/60">{nextTier.months - loyaltyMonths} meses</strong> para el siguiente nivel</span>
              <span className="text-[#1D9E75] font-bold">{nextTier.disc}%</span>
            </div>
          )}
        </motion.div>

        <div className="text-center text-[12px] text-[#0D0D0D]/20 mt-4">Cancela con un toque. Siempre.</div>
      </motion.div>

      {/* Travel survey modal */}
      <SurveyModal
        productId={surveyProduct}
        activeCount={activeCount}
        onClose={() => setSurveyProduct(null)}
        onActivated={(_id, _price) => { setSurveyProduct(null); setTravelActive(true); localStorage.setItem('daily_travel_active', 'true') }}
      />

      {/* Cancellation sheet */}
      <Sheet open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
        <div className="px-5 pt-4 pb-2">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[15px] font-bold text-[#0D0D0D]">¿Seguro que quieres cancelar?</div>
            <button onClick={() => setCancelTarget(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] text-[#0D0D0D]/40"
              style={{ background: 'rgba(13,13,13,.07)' }}>✕</button>
          </div>
          <div className="rounded-[13px] p-4 mb-5 text-[13px] leading-relaxed text-[#0D0D0D]/70"
            style={{ background: 'rgba(13,13,13,.04)', border: '1px solid rgba(13,13,13,.08)' }}>
            Tu seguro seguirá activo hasta el{' '}
            <strong className="text-[#0D0D0D]">{fmtDate(endOfMonth())}</strong>.{' '}
            Nosotros notificamos a Mapfre hoy mismo — sin llamadas, sin papeleo.
          </div>
          <motion.button whileTap={tapScale} onClick={confirmCancel}
            className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mb-2"
            style={{ background: '#EF4444' }}>
            Sí, cancelar
          </motion.button>
          <motion.button whileTap={tapScale} onClick={() => setCancelTarget(null)}
            className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white"
            style={{ background: '#1D9E75' }}>
            Mantener seguro
          </motion.button>
        </div>
      </Sheet>

      {/* Chip modal */}
      <Sheet open={chipModalOpen} onClose={() => setChipModalOpen(false)}>
        <div className="px-5 pt-4 pb-2">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[15px] font-bold text-[#0D0D0D]">Número de chip</div>
            <button onClick={() => setChipModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] text-[#0D0D0D]/40"
              style={{ background: 'rgba(13,13,13,.07)' }}>✕</button>
          </div>
          <label className="block text-[10px] font-bold text-[#0D0D0D]/40 uppercase tracking-[0.8px] mb-1.5">
            Número de chip (15 dígitos)
          </label>
          <input
            type="number" inputMode="numeric" placeholder="000000000000000"
            value={chipInput} onChange={e => setChipInput(e.target.value.slice(0, 15))}
            className="w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D] mb-4"
            style={{ background: 'rgba(13,13,13,.05)', border: '1px solid rgba(13,13,13,.12)' }} />
          <motion.button whileTap={tapScale} onClick={saveChip}
            disabled={chipInput.length !== 15}
            className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mb-2 disabled:opacity-40"
            style={{ background: '#0D0D0D' }}>
            Guardar
          </motion.button>
          <button onClick={() => setChipModalOpen(false)} className="w-full text-center text-[12px] text-[#0D0D0D]/35 py-2">
            Hacerlo más tarde
          </button>
        </div>
      </Sheet>

      {/* Pet picker sheet */}
      <Sheet open={petPickerOpen} onClose={() => setPetPickerOpen(false)}>
        <div className="px-5 pt-4 pb-2">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[15px] font-bold text-[#0D0D0D]">¿Qué mascota tienes?</div>
            <button onClick={() => setPetPickerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] text-[#0D0D0D]/40"
              style={{ background: 'rgba(13,13,13,.07)' }}>✕</button>
          </div>
          <div className="flex flex-col gap-2 pb-2">
            {PET_OPTIONS.map(o => (
              <button key={o.label}
                onClick={() => {
                  localStorage.setItem('daily_mascota_type', o.label)
                  localStorage.setItem('daily_mascota_price', String(o.price))
                  setMascotaType(o.label)
                  setPrices(p => ({ ...p, pet: o.price }))
                  setPetPickerOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-[13px] border text-left transition-all"
                style={{ background: 'rgba(13,13,13,.04)', borderColor: 'rgba(13,13,13,.1)' }}>
                <span className="text-[22px]">{o.emoji}</span>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-[#0D0D0D]">{o.label}</div>
                  <div className="text-[11px] text-[#0D0D0D]/40">€{o.price.toFixed(2)}/mes</div>
                </div>
                <span className="text-[#0D0D0D]/20 text-[16px]">›</span>
              </button>
            ))}
          </div>
        </div>
      </Sheet>

      {/* Register gate */}
      <Sheet open={showRegister} onClose={() => setShowRegister(false)}>
        <div className="px-5 pt-4 pb-2">
          <div className="flex justify-between items-center mb-1">
            <div className="text-[15px] font-bold text-[#0D0D0D]">Antes de continuar</div>
            <button onClick={() => setShowRegister(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] text-[#0D0D0D]/40"
              style={{ background: 'rgba(13,13,13,.07)' }}>✕</button>
          </div>
          <p className="text-[13px] text-[#0D0D0D]/45 mb-5">30 segundos. Solo una vez.</p>
          {[
            { label: 'Tu nombre', key: 'name', placeholder: 'Ana García', type: 'text' },
            { label: 'Email', key: 'email', placeholder: 'ana@email.com', type: 'email' },
            { label: 'Móvil (opcional)', key: 'phone', placeholder: '+34 600 000 000', type: 'tel' },
          ].map(f => (
            <div key={f.key} className="mb-3">
              <label className="block text-[10px] font-bold text-[#0D0D0D]/40 uppercase tracking-[0.8px] mb-1.5">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={regForm[f.key as keyof typeof regForm]}
                onChange={e => setRegForm(r => ({ ...r, [f.key]: e.target.value }))}
                className="w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D]"
                style={{ background: 'rgba(13,13,13,.05)', border: '1px solid rgba(13,13,13,.12)' }} />
            </div>
          ))}
          <motion.button whileTap={tapScale} onClick={handleRegisterAndBuy}
            disabled={!regForm.name || !regForm.email || regLoading}
            className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mt-2 disabled:opacity-40"
            style={{ background: '#0D0D0D' }}>
            {regLoading ? 'Guardando…' : 'Continuar →'}
          </motion.button>
        </div>
      </Sheet>

      {/* Onboarding overlay (shown on first activation attempt) */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex justify-center items-stretch">
          <div className="w-full h-full" style={{ maxWidth: 430 }}>
            <Onboarding inline onComplete={handleOnboardingComplete} />
          </div>
        </div>
      )}
    </div>
  )
}
