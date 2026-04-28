'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Toggle from '@/components/ui/Toggle'
import SurveyModal from '@/components/modals/SurveyModal'
import { PRODUCTS, getBundleDiscount, getLoyaltyDiscount } from '@/lib/products'
import { createClient } from '@/lib/supabase'
import { fadeUp, stagger, tapScale } from '@/lib/animations'
import type { ProductId } from '@/types'

export default function HomePage() {
  const [active, setActive] = useState<Record<ProductId, boolean>>({ home: false, car: false, pet: false, travel: false })
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [surveyProduct, setSurveyProduct] = useState<ProductId | null>(null)
  const [bdOpen, setBdOpen] = useState(false)
  const [loyaltyMonths, setLoyaltyMonths] = useState(0)

  useEffect(() => {
    async function loadPolicies() {
      const customerId = localStorage.getItem('customerId')
      if (!customerId) return
      const sb = createClient()
      const { data } = await sb.from('policies').select('*').eq('customer_id', customerId).eq('status', 'active')
      if (data) {
        const newActive = { ...active }
        const newPrices = { ...prices }
        data.forEach((p: any) => {
          newActive[p.product as ProductId] = true
          newPrices[p.product] = Number(p.monthly_premium)
        })
        setActive(newActive)
        setPrices(newPrices)
      }
      const { data: cust } = await sb.from('customers').select('loyalty_months').eq('id', customerId).single()
      if (cust) setLoyaltyMonths(cust.loyalty_months)
    }
    loadPolicies()
  }, [])

  const activeCount   = Object.values(active).filter(Boolean).length
  const bundleDisc    = getBundleDiscount(activeCount)
  const loyaltyDisc   = getLoyaltyDiscount(loyaltyMonths)
  const totalDisc     = bundleDisc + loyaltyDisc
  const gross         = PRODUCTS.reduce((s, p) => s + (active[p.id] && p.id !== 'travel' ? (prices[p.id] || p.basePrice) : 0), 0)
  const net           = gross * (1 - totalDisc / 100)
  const saved         = (gross * totalDisc / 100 * 4).toFixed(2)
  const nextTier      = [{ months: 4, disc: 5 }, { months: 12, disc: 10 }, { months: 24, disc: 15 }].find(t => t.months > loyaltyMonths)
  const streakPct     = nextTier ? Math.round((loyaltyMonths / nextTier.months) * 100) : 100

  function handleToggle(id: ProductId) {
    if (active[id]) {
      if (confirm(`¿Cancelar tu seguro de ${PRODUCTS.find(p => p.id === id)?.label}?`)) {
        setActive(a => ({ ...a, [id]: false }))
      }
    } else {
      setSurveyProduct(id)
    }
  }

  function handleActivated(productId: ProductId, price: number) {
    setActive(a => ({ ...a, [productId]: true }))
    setPrices(p => ({ ...p, [productId]: price }))
  }

  return (
    <div className="px-4 py-4 pb-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">

        {/* Hero amount */}
        <motion.div variants={fadeUp} className="rounded-[20px] p-6 mb-3 text-center"
          style={{ background: '#0D0D0D' }}>
          <motion.div
            key={net.toFixed(2)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[50px] font-bold text-white tracking-[-2px] leading-none"
          >
            €{net.toFixed(2)}
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
                {activeCount < 4 && (
                  <div className="text-[10px] text-white/60">Añade {4 - activeCount} más para llegar al 12%</div>
                )}
              </div>
              <div className="text-[20px] font-bold text-white">-{bundleDisc}%</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loyalty card */}
        <motion.div variants={fadeUp} className="rounded-[18px] p-4 mb-3"
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

        {/* Insurance cards */}
        {PRODUCTS.map(product => {
          const isOn   = active[product.id]
          const price  = prices[product.id] || product.basePrice
          const discPrice = isOn && bundleDisc > 0 ? price * (1 - bundleDisc / 100) : price
          return (
            <motion.div key={product.id} variants={fadeUp}
              className="rounded-[14px] p-4 mb-2 flex items-center justify-between border transition-all duration-200"
              style={{
                background: isOn ? `color-mix(in srgb,${product.color} 6%,var(--sand-card))` : 'var(--sand-card)',
                borderColor: isOn ? product.color : 'rgba(13,13,13,.08)',
              }}>
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center text-[20px] flex-shrink-0"
                  style={{ background: isOn ? `color-mix(in srgb,${product.color} 15%,var(--sand-card))` : 'rgba(13,13,13,.06)' }}>
                  {product.icon}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#0D0D0D]">{product.label}</div>
                  <div className="text-[12px] text-[#0D0D0D]/40 mt-0.5">
                    {isOn ? (
                      bundleDisc > 0 ? (
                        <span>
                          <span className="line-through text-[#0D0D0D]/20 mr-1">€{price.toFixed(2)}</span>
                          <span style={{ color: product.color }}>€{discPrice.toFixed(2)}/mes</span>
                        </span>
                      ) : `€${price.toFixed(2)}/mes`
                    ) : product.desc}
                  </div>
                </div>
              </div>
              <Toggle checked={isOn} onChange={() => handleToggle(product.id)} color={product.color} />
            </motion.div>
          )
        })}

        {/* Breakdown */}
        {gross > 0 && (
          <motion.div variants={fadeUp} className="rounded-[14px] mt-2 overflow-hidden border border-[#0D0D0D]/[0.07]"
            style={{ background: 'var(--sand-card)' }}>
            <button onClick={() => setBdOpen(!bdOpen)}
              className="w-full flex justify-between items-center px-4 py-4">
              <div>
                <div className="text-[13px] font-semibold text-[#0D0D0D] text-left">Cómo gastamos cada euro</div>
                <div className="text-[11px] text-[#0D0D0D]/35 mt-0.5 text-left">Sin opacidad. Sin sorpresas.</div>
              </div>
              <motion.span animate={{ rotate: bdOpen ? 180 : 0 }} className="text-[#0D0D0D]/30 text-[14px]">⌃</motion.span>
            </button>
            <AnimatePresence>
              {bdOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden">
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

        <div className="text-center text-[12px] text-[#0D0D0D]/20 mt-4">Cancela con un toque. Siempre.</div>
      </motion.div>

      <SurveyModal
        productId={surveyProduct}
        activeCount={activeCount}
        onClose={() => setSurveyProduct(null)}
        onActivated={handleActivated}
      />
    </div>
  )
}
