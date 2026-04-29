'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, stagger, tapScale } from '@/lib/animations'

const BENEFITS = [
  { emoji: '🏥', title: 'Red médica',       desc: 'Especialistas con 30% dto.' },
  { emoji: '🚗', title: 'Grúa 24h',         desc: 'Asistencia en carretera gratis' },
  { emoji: '🔧', title: 'Urgencias hogar',  desc: 'Fontanero garantizado en 2h' },
  { emoji: '✈️', title: 'Asistencia viaje', desc: 'Médico y repatriación incluidos' },
  { emoji: '🦷', title: 'Dental',           desc: 'Revisiones gratuitas en red propia' },
  { emoji: '🎟️', title: 'Ocio',             desc: 'Cine, gimnasio y restaurantes dto.' },
]

export default function VentajasPage() {
  const [toast, setToast] = useState(false)

  function handleUsar() {
    setToast(true)
    setTimeout(() => setToast(false), 2200)
  }

  return (
    <div className="px-4 py-4 pb-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">

        {/* Hero */}
        <motion.div variants={fadeUp} className="rounded-[20px] p-6 mb-5"
          style={{ background: '#0D0D0D' }}>
          <div className="text-[11px] font-bold tracking-[1.5px] uppercase mb-1"
            style={{ color: '#C9A84C' }}>✦ Miembro Club Mapfre</div>
          <div className="text-[26px] font-bold text-white tracking-tight leading-snug mb-2">
            6 ventajas incluidas<br />con tu póliza
          </div>
          <div className="text-[13px] text-white/40 leading-relaxed">
            Activas desde el primer día. Sin coste adicional.
          </div>
        </motion.div>

        {/* 2×3 grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {BENEFITS.map((b, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-[16px] p-4 flex flex-col"
              style={{ background: 'var(--sand-card)', border: '1px solid rgba(13,13,13,.08)', boxShadow: '0 2px 12px rgba(13,13,13,.06)' }}>
              <div className="text-[36px] mb-3">{b.emoji}</div>
              <div className="text-[14px] font-bold text-[#0D0D0D] leading-tight mb-1">{b.title}</div>
              <div className="text-[11px] text-[#0D0D0D]/45 leading-snug flex-1 mb-3">{b.desc}</div>
              <motion.button whileTap={tapScale} onClick={handleUsar}
                className="w-full py-2 rounded-[9px] text-[12px] font-semibold text-white text-center"
                style={{ background: '#1D9E75' }}>
                Usar →
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} className="text-center text-[11px] text-[#0D0D0D]/25">
          Ventajas incluidas con tu póliza Daily × Mapfre
        </motion.div>

      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
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
