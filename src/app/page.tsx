'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { stagger, fadeUp, tapScale } from '@/lib/animations'
import { useIsNative } from '@/lib/useIsNative'

export default function LandingPage() {
  const router = useRouter()
  const isNative = useIsNative()

  return (
    <div className="phone-frame" style={{ background: '#111' }}>
      {!isNative && (
        <div className="flex justify-between items-center px-7 pt-3 pb-0 text-white text-[13px] font-bold flex-shrink-0">
          <span>9:41</span>
          <div className="w-28 h-7 bg-black rounded-full" />
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
            <path d="M1 8h2v4H1zM5 5h2v7H5zM9 3h2v9H9zM13 0h2v12h-2z"/>
          </svg>
        </div>
      )}

      {/* Dark gradient top */}
      <div
        className="flex-1 flex flex-col justify-end px-7 pb-8 pt-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0d1a10 0%,#0a1209 50%,#080d07 100%)' }}
      >
        {/* Glows */}
        <div className="absolute top-[-100px] right-[-80px] w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(29,158,117,.22) 0%,transparent 60%)' }} />
        <div className="absolute bottom-[40px] left-[-60px] w-[240px] h-[240px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(29,158,117,.1) 0%,transparent 60%)' }} />

        <motion.div variants={stagger} initial="hidden" animate="visible">
          {/* Logo */}
          <motion.div variants={fadeUp} className="text-white text-[48px] font-bold tracking-tight mb-5 leading-none">
            daily
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} className="text-white font-bold text-[34px] leading-[1.1] tracking-tight mb-2">
            Tu seguro actual<br />te ha fallado<br />
            <em className="italic">en algo.</em>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={fadeUp} className="text-white/70 text-[14px] italic mb-6 leading-relaxed">
            Daily existe para que eso no vuelva a pasar.
          </motion.p>

          {/* Bullets */}
          <motion.div variants={stagger} className="flex flex-col gap-3 mb-5">
            {[
              { bold: 'Sabes exactamente', rest: ' qué cubre cada euro.' },
              { bold: 'Pagas lo que usas,', rest: ' no lo que te imponen.' },
              { bold: 'Te vas cuando quieres.', rest: ' Sin llamadas.' },
            ].map((line, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-3">
                <div className="w-[6px] h-[6px] rounded-full bg-[#1D9E75] mt-[7px] flex-shrink-0" />
                <span className="text-[14px] text-white/90 leading-[1.4]">
                  <strong className="text-white font-semibold">{line.bold}</strong>{line.rest}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Proof box */}
          <motion.div variants={fadeUp}
            className="rounded-2xl p-4 mb-6"
            style={{ background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)' }}
          >
            <p className="text-white text-[13px] font-semibold leading-[1.4]">
              30 días para resolver tu siniestro —<br />o te devolvemos un mes.
            </p>
            <p className="text-white/60 text-[11px] mt-1">Garantía Daily · Con cobertura Mapfre</p>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp}>
            <motion.button
              whileTap={tapScale}
              onClick={() => router.push('/app')}
              className="w-full bg-white text-[#0a1209] font-bold text-[16px] rounded-2xl py-[17px] text-center tracking-tight"
            >
              Empezar ahora →
            </motion.button>
            <p className="text-white/60 text-[11px] text-center mt-2">
              Ya somos 2.400 personas que dejaron su aseguradora de siempre.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Trust bar — dark continuation */}
      <div
        className="flex-shrink-0 px-7 py-4 border-t border-white/[0.06]"
        style={{ background: 'linear-gradient(160deg,#060907,#040604)' }}
      >
        <div className="flex items-center justify-center gap-4">
          {[
            { dot: true, label: 'Sin permanencia' },
            { sep: true },
            { dot: true, label: 'Cobertura Mapfre' },
            { sep: true },
            { star: true, label: '4.8 Trustpilot' },
          ].map((item, i) => (
            item.sep ? (
              <div key={i} className="w-px h-3 bg-white/10" />
            ) : (
              <div key={i} className="flex items-center gap-1.5">
                {item.dot && <div className="w-[5px] h-[5px] rounded-full bg-[#1D9E75]" />}
                {item.star && <span className="text-[#00b67a] text-[11px]">★</span>}
                <span className="text-[11px] text-white/65 font-medium">{item.label}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
