'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, stagger, tapScale } from '@/lib/animations'

const STREAMING_TIERS = [
  {
    friends: 3,
    headline: '1 año de Netflix gratis',
    sub: '€156 de valor',
    platforms: [{ label: 'Netflix', color: '#E50914' }],
  },
  {
    friends: 5,
    headline: 'Los tres grandes, para siempre',
    sub: 'Mientras seas miembro Daily',
    platforms: [
      { label: 'Netflix',  color: '#E50914' },
      { label: 'HBO Max',  color: '#7B2FBE' },
      { label: 'Disney+',  color: '#0063E5' },
    ],
  },
]

const BENEFITS = [
  { emoji: '🏥', title: 'Red médica',       desc: 'Especialistas con 30% dto.' },
  { emoji: '🚗', title: 'Grúa 24h',         desc: 'Asistencia en carretera gratis' },
  { emoji: '🔧', title: 'Urgencias hogar',  desc: 'Fontanero garantizado en 2h' },
  { emoji: '✈️', title: 'Asistencia viaje', desc: 'Médico y repatriación incluidos' },
  { emoji: '🦷', title: 'Dental',           desc: 'Revisiones gratuitas en red propia' },
  { emoji: '🎟️', title: 'Ocio',             desc: 'Cine, gimnasio y restaurantes dto.' },
]

const UPDATES = [
  { icon: '❤️', text: 'Max encontró hogar gracias a la comunidad Daily', when: 'Hace 3 días' },
  { icon: '🥘', text: 'Compramos 50kg de comida con vuestras donaciones', when: 'Hace 1 semana' },
  { icon: '👥', text: 'Visita de 12 miembros Daily al refugio',           when: 'Hace 2 semanas' },
]

const CONTRIBUTE = [
  { emoji: '💳', label: 'Redondeo solidario', desc: 'Añade €1/mes más a tu cuota' },
  { emoji: '📢', label: 'Comparte en redes', desc: 'Cada nuevo miembro = €5 al refugio' },
  { emoji: '🐾', label: 'Visita el refugio', desc: 'Próxima visita grupal: mayo' },
]

type Tab = 'ventajas' | 'impacto'

type ReferralStats = { earned: number; pending: number; forfeited: number; nextEligibleAt: string | null }

export default function ClubPage() {
  const [tab, setTab]             = useState<Tab>('ventajas')
  const [toast, setToast]         = useState(false)
  const [copied, setCopied]       = useState(false)
  const [adopted, setAdopted]     = useState<string | null>(null)
  const [donationAmount, setDonationAmount] = useState(0)
  const [hasPolicy, setHasPolicy] = useState(false)
  const [referralCode, setReferralCode]   = useState<string | null>(null)
  const [referralStats, setReferralStats] = useState<ReferralStats>({ earned: 0, pending: 0, forfeited: 0, nextEligibleAt: null })

  useEffect(() => {
    const customerId = localStorage.getItem('customerId')
    if (!customerId) return
    fetch(`/api/get-customer?id=${customerId}`)
      .then(r => r.json())
      .then(data => {
        if (data.policies?.length) {
          const qualifying = data.policies.some((p: { product: string }) =>
            p.product === 'home' || p.product === 'pet'
          )
          setHasPolicy(qualifying)
          setDonationAmount(
            data.policies.reduce((s: number, p: { monthly_premium: number }) =>
              s + Number(p.monthly_premium) * 0.05, 0)
          )
        }
        if (data.referralCode) setReferralCode(data.referralCode)
        if (data.referralStats) setReferralStats(data.referralStats)
      })
      .catch(console.error)
  }, [])

  async function shareReferral() {
    const url = `https://daily-seguros.vercel.app/?ref=${referralCode}`
    if (navigator.share) {
      await navigator.share({ title: 'Daily Seguros', text: '¿Cansado de tu aseguradora? Prueba Daily.', url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleUsar() {
    setToast(true)
    setTimeout(() => setToast(false), 2200)
  }

const TABS: { id: Tab; label: string }[] = [
    { id: 'ventajas', label: '🏆 Ventajas' },
    { id: 'impacto',  label: '🐾 Impacto'  },
  ]

  return (
    <div className="px-4 py-4 pb-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">

        {/* Title */}
        <motion.div variants={fadeUp} className="mb-4">
          <div className="text-[11px] font-bold tracking-[1.5px] uppercase mb-0.5" style={{ color: '#C9A84C' }}>✦ Daily Club</div>
          <div className="text-[24px] font-bold text-[#0D0D0D] tracking-tight">Tu membresía</div>
        </motion.div>

        {/* Tab switcher */}
        <motion.div variants={fadeUp} className="flex gap-1.5 mb-4 p-1 rounded-[14px]"
          style={{ background: 'rgba(13,13,13,.06)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-[11px] text-[11px] font-semibold transition-all duration-200"
              style={tab === t.id
                ? { background: '#0D0D0D', color: 'white' }
                : { background: 'transparent', color: 'rgba(13,13,13,.4)' }}>
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* ── TAB: VENTAJAS ── */}
        <AnimatePresence mode="wait">
          {tab === 'ventajas' && (
            <motion.div key="ventajas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>

              {!hasPolicy && (
                <div className="rounded-[11px] px-3.5 py-2.5 mb-3 flex items-center gap-2.5 border border-[#F59E0B]/30"
                  style={{ background: 'rgba(245,158,11,.06)' }}>
                  <span className="text-[14px]">🔒</span>
                  <span className="text-[12px] font-medium" style={{ color: '#D97706' }}>
                    Activa Hogar o Mascota para usar estas ventajas
                  </span>
                </div>
              )}

              {/* Referral / Netflix section */}
              {referralCode && (() => {
                const NETFLIX_THRESHOLD = 3
                const netflixProgress = Math.min(referralStats.earned + referralStats.pending, NETFLIX_THRESHOLD)
                const netflixUnlocked = referralStats.earned >= NETFLIX_THRESHOLD
                return (
                  <div className="rounded-[16px] p-4 mb-4 border border-[#0D0D0D]/[0.08]"
                    style={{ background: 'var(--sand-card)', boxShadow: '0 2px 12px rgba(13,13,13,.06)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px]">Invita amigos</div>
                        <div className="text-[14px] font-bold text-[#0D0D0D] mt-0.5">
                          {netflixUnlocked ? '🎉 Netflix 1 año desbloqueado' : `${netflixProgress}/${NETFLIX_THRESHOLD} para Netflix gratis`}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px] flex-shrink-0"
                        style={{ background: netflixUnlocked ? 'rgba(229,9,20,.1)' : 'rgba(13,13,13,.06)' }}>
                        📺
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex gap-1.5 mb-3">
                      {Array.from({ length: NETFLIX_THRESHOLD }).map((_, i) => {
                        const isEarned  = i < referralStats.earned
                        const isPending = !isEarned && i < referralStats.earned + referralStats.pending
                        return (
                          <div key={i} className="h-[5px] flex-1 rounded-full"
                            style={{
                              background: isEarned  ? '#1D9E75' :
                                          isPending ? 'rgba(29,158,117,.35)' :
                                                      'rgba(13,13,13,.1)',
                            }} />
                        )
                      })}
                    </div>

                    {/* Status labels */}
                    <div className="flex gap-3 flex-wrap mb-3">
                      {referralStats.earned > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]"
                          style={{ background: 'rgba(29,158,117,.1)', color: '#1D9E75' }}>
                          {referralStats.earned} confirmado{referralStats.earned > 1 ? 's' : ''} ✓
                        </span>
                      )}
                      {referralStats.pending > 0 && referralStats.nextEligibleAt && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-[7px]"
                          style={{ background: 'rgba(245,158,11,.1)', color: '#D97706' }}>
                          {referralStats.pending} en espera · hasta {new Date(referralStats.nextEligibleAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {!netflixUnlocked && (
                      <p className="text-[11px] text-[#0D0D0D]/40 leading-relaxed mb-3">
                        Netflix 1 año gratis cuando tú y tus {NETFLIX_THRESHOLD} amigos llevéis 1 año activos.
                      </p>
                    )}

                    <motion.button whileTap={tapScale} onClick={shareReferral}
                      className="w-full py-2.5 rounded-[11px] text-[13px] font-semibold text-white"
                      style={{ background: '#0D0D0D' }}>
                      {copied ? '¡Enlace copiado!' : `Compartir código ${referralCode.toUpperCase()} →`}
                    </motion.button>
                  </div>
                )
              })()}

              <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-3">
                Club Mapfre · 6 ventajas incluidas
              </div>

              <div className={`grid grid-cols-2 gap-3 mb-4 transition-opacity ${!hasPolicy ? 'opacity-45' : ''}`}>
                {BENEFITS.map((b, i) => (
                  <div key={i} className="rounded-[16px] p-4 flex flex-col"
                    style={{ background: 'var(--sand-card)', border: '1px solid rgba(13,13,13,.08)', boxShadow: '0 2px 12px rgba(13,13,13,.06)' }}>
                    <div className="text-[32px] mb-2">{b.emoji}</div>
                    <div className="text-[13px] font-bold text-[#0D0D0D] leading-tight mb-1">{b.title}</div>
                    <div className="text-[11px] text-[#0D0D0D]/45 leading-snug flex-1 mb-3">{b.desc}</div>
                    {hasPolicy && (
                      <motion.button whileTap={tapScale} onClick={handleUsar}
                        className="w-full py-2 rounded-[9px] text-[11px] font-semibold text-white"
                        style={{ background: '#1D9E75' }}>
                        Usar →
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center text-[11px] text-[#0D0D0D]/20 mb-2">
                Ventajas incluidas con tu póliza Daily × Mapfre
              </div>
            </motion.div>
          )}

          {/* ── TAB: IMPACTO ── */}
          {tab === 'impacto' && (
            <motion.div key="impacto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>

              <div className="rounded-[18px] p-5 mb-3 text-center" style={{ background: '#0D0D0D' }}>
                <div className="text-[10px] font-medium text-white/40 uppercase tracking-[1px] mb-1">Has donado este mes</div>
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 280 }}
                  className="text-[44px] font-bold tracking-[-2px] leading-none mt-1 mb-2"
                  style={{ color: '#1D9E75' }}>
                  €{donationAmount.toFixed(2)}
                </motion.div>
                <p className="text-[12px] text-white/50 leading-relaxed">
                  Junto a 247 miembros, hemos llevado<br />
                  <strong className="text-white">€1.182 al Refugio Animal Madrid.</strong>
                </p>
              </div>

              {/* Luna card */}
              <div className="rounded-[18px] overflow-hidden mb-3 border border-[#0D0D0D]/[0.07]"
                style={{ background: 'var(--sand-card)' }}>
                <div className="h-[130px] relative overflow-hidden flex items-end justify-center pb-2"
                  style={{ background: 'linear-gradient(160deg,#D6C8A0 0%,#C4B080 60%,#B89A60 100%)' }}>
                  {[
                    { top: '10px', left: '16px', size: '26px', opacity: 0.12 },
                    { top: '8px',  right: '20px', size: '18px', opacity: 0.09 },
                  ].map((s, i) => (
                    <div key={i} className="absolute rounded-full"
                      style={{ top: s.top, left: s.left, right: s.right, width: s.size, height: s.size, background: `rgba(93,60,20,${s.opacity})` }} />
                  ))}
                  <div className="relative" style={{ width: '80px', height: '78px' }}>
                    <div className="absolute" style={{ width: '24px', height: '12px', background: '#C17F3A', borderRadius: '12px 12px 4px 4px', bottom: '28px', right: '-16px', transform: 'rotate(35deg)', transformOrigin: 'left center' }} />
                    <div className="absolute" style={{ width: '60px', height: '44px', background: '#C17F3A', borderRadius: '24px 24px 16px 16px', bottom: '16px', left: '10px' }} />
                    <div className="absolute" style={{ width: '28px', height: '22px', background: '#E8B87A', borderRadius: '50%', bottom: '20px', left: '26px' }} />
                    <div className="absolute" style={{ width: '12px', height: '20px', background: '#C17F3A', borderRadius: '6px 6px 8px 8px', bottom: '0', left: '18px' }} />
                    <div className="absolute" style={{ width: '12px', height: '20px', background: '#C17F3A', borderRadius: '6px 6px 8px 8px', bottom: '0', left: '34px' }} />
                    <div className="absolute" style={{ width: '40px', height: '36px', background: '#C17F3A', borderRadius: '50% 50% 42% 42%', top: '0', left: '8px' }} />
                    <div className="absolute" style={{ width: '20px', height: '15px', background: '#E8B87A', borderRadius: '50%', top: '20px', left: '17px' }} />
                    <div className="absolute" style={{ width: '8px', height: '5px', background: '#5C3010', borderRadius: '50%', top: '21px', left: '23px' }} />
                    <div className="absolute" style={{ width: '6px', height: '6px', background: '#2A1505', borderRadius: '50%', top: '12px', left: '14px', boxShadow: '1px 1px 0 rgba(255,255,255,.4)' }} />
                    <div className="absolute" style={{ width: '6px', height: '6px', background: '#2A1505', borderRadius: '50%', top: '12px', left: '30px', boxShadow: '1px 1px 0 rgba(255,255,255,.4)' }} />
                    <div className="absolute" style={{ width: '16px', height: '22px', background: '#A05F20', borderRadius: '50% 10% 50% 50%', top: '2px', left: '3px', transform: 'rotate(-10deg)' }} />
                    <div className="absolute" style={{ width: '16px', height: '22px', background: '#A05F20', borderRadius: '10% 50% 50% 50%', top: '2px', left: '30px', transform: 'rotate(10deg)' }} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[1px] mb-0.5">Esperando hogar</div>
                  <div className="text-[18px] font-bold text-[#0D0D0D] mb-1">Luna, 2 años</div>
                  <p className="text-[12px] text-[#0D0D0D]/45 leading-relaxed mb-3">
                    Mestiza tranquila. Adora a los niños. En el refugio desde hace 4 meses.
                  </p>
                  <motion.button whileTap={tapScale} onClick={() => setAdopted('Luna')}
                    className="w-full py-3 rounded-[11px] text-[13px] font-semibold text-white"
                    style={{ background: adopted === 'Luna' ? '#1D9E75' : '#0D0D0D' }}>
                    {adopted === 'Luna' ? '¡Gracias! Te contactaremos en 24h 🐾' : 'Conocer a Luna →'}
                  </motion.button>
                </div>
              </div>

              <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-2">Contribuir más</div>
              {CONTRIBUTE.map((c, i) => (
                <motion.button key={i} whileTap={tapScale}
                  className="w-full flex items-center gap-3 rounded-[12px] p-3.5 mb-2 border text-left transition-all"
                  style={{ background: 'var(--sand-card)', borderColor: 'rgba(13,13,13,.08)' }}>
                  <span className="text-[20px] flex-shrink-0">{c.emoji}</span>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0D0D0D]">{c.label}</div>
                    <div className="text-[11px] text-[#0D0D0D]/40 mt-0.5">{c.desc}</div>
                  </div>
                  <span className="ml-auto text-[#0D0D0D]/20 text-[14px]">›</span>
                </motion.button>
              ))}

              <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-2 mt-3">Últimas novedades</div>
              {UPDATES.map((item, i) => (
                <div key={i} className="flex gap-3 rounded-[12px] p-3.5 mb-2 border border-[#0D0D0D]/[0.07]"
                  style={{ background: 'var(--sand-card)' }}>
                  <span className="text-[16px] flex-shrink-0">{item.icon}</span>
                  <div>
                    <div className="text-[12px] font-medium text-[#0D0D0D]/70 leading-snug">{item.text}</div>
                    <div className="text-[10px] text-[#0D0D0D]/25 mt-1">{item.when}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-0 right-0 mx-auto px-5 py-3 rounded-[14px] text-white text-[13px] font-semibold flex items-center gap-2.5"
            style={{ background: '#1D9E75', maxWidth: 320, width: 'calc(100% - 48px)', boxShadow: '0 8px 24px rgba(29,158,117,.4)' }}>
            <span className="text-[18px]">✓</span>
            <div>
              <div>Abriendo ventaja…</div>
              <div className="text-[11px] font-normal text-white/70">Próximamente disponible</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
