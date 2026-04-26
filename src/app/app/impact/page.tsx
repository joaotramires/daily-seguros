'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, stagger, tapScale } from '@/lib/animations'

export default function ImpactPage() {
  const [adopted, setAdopted] = useState<string | null>(null)

  return (
    <div className="px-4 py-4 pb-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">

        {/* Donation hero */}
        <motion.div variants={fadeUp} className="rounded-[18px] p-6 mb-4 text-center"
          style={{ background: '#0D0D0D' }}>
          <div className="text-[10px] font-medium text-white/40 uppercase tracking-[1px] mb-1">Has donado este año</div>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="text-[48px] font-bold tracking-[-2px] leading-none mt-1 mb-3"
            style={{ color: '#1D9E75' }}>
            €4.80
          </motion.div>
          <p className="text-[13px] text-white/50 leading-relaxed">
            Junto a 247 miembros, hemos llevado<br />
            <strong className="text-white">€1.182 al Refugio Animal Madrid.</strong>
          </p>
        </motion.div>

        {/* Luna card */}
        <motion.div variants={fadeUp} className="rounded-[18px] overflow-hidden mb-3 border border-[#0D0D0D]/[0.07]"
          style={{ background: 'var(--sand-card)' }}>
          <div className="h-[120px] flex items-center justify-center text-[52px]"
            style={{ background: 'linear-gradient(135deg,#D6C8A0,#C4B080)' }}>
            🐕
          </div>
          <div className="p-4">
            <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[1px] mb-1">Esperando hogar</div>
            <div className="text-[20px] font-bold text-[#0D0D0D] mb-1">Luna, 2 años</div>
            <p className="text-[12px] text-[#0D0D0D]/45 leading-relaxed mb-3">
              Mestiza tranquila. Adora a los niños. En el refugio desde hace 4 meses.
            </p>
            <motion.button whileTap={tapScale}
              onClick={() => setAdopted('Luna')}
              className="w-full py-3 rounded-[11px] text-[14px] font-semibold text-white"
              style={{ background: adopted === 'Luna' ? '#1D9E75' : '#0D0D0D' }}>
              {adopted === 'Luna' ? '¡Gracias! Te contactaremos en 24h 🐾' : 'Conocer a Luna →'}
            </motion.button>
          </div>
        </motion.div>

        {/* Updates */}
        <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-2">Últimas novedades</div>
        {[
          { icon: '❤️', text: 'Max encontró hogar gracias a la comunidad Daily', when: 'Hace 3 días' },
          { icon: '🥘', text: 'Compramos 50kg de comida con vuestras donaciones', when: 'Hace 1 semana' },
          { icon: '👥', text: 'Visita de 12 miembros Daily al refugio',           when: 'Hace 2 semanas' },
        ].map((item, i) => (
          <motion.div key={i} variants={fadeUp}
            className="flex gap-3 rounded-[12px] p-3.5 mb-2 border border-[#0D0D0D]/[0.07]"
            style={{ background: 'var(--sand-card)' }}>
            <span className="text-[18px] flex-shrink-0">{item.icon}</span>
            <div>
              <div className="text-[12px] font-medium text-[#0D0D0D]/70 leading-snug">{item.text}</div>
              <div className="text-[10px] text-[#0D0D0D]/25 mt-1">{item.when}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
