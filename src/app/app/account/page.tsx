'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sheet from '@/components/ui/Sheet'
import { fadeUp, stagger, tapScale } from '@/lib/animations'

const FAQS = [
  { q: '¿Qué pasa si cancelo?',        a: 'Nada. Se cancela. Sin penalización, sin llamadas, sin papeleo. Lo prometido.' },
  { q: '¿Quién paga mis siniestros?',  a: 'Mapfre. Nosotros gestionamos todo el proceso y hacemos seguimiento.' },
  { q: '¿Sois una aseguradora?',       a: 'No. Somos un corredor digital. Mapfre asegura, nosotros gestionamos todo lo demás.' },
  { q: '¿Puedo tener varios seguros?', a: 'Sí, y te premiamos. Con 2 seguros tienes un 3% extra, con 3 un 7%, con los 4 un 12%.' },
]

const PM_ICONS: Record<string, string> = { bizum: '💙', card: '💳', apple: '🍎' }

export default function AccountPage() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [pms, setPms] = useState<{ id: string; type: string; icon: string; label: string; sub: string; isDefault: boolean }[]>([])
  const [editField, setEditField] = useState<{ key: string; label: string } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [addPmOpen, setAddPmOpen] = useState(false)
  const [newPm, setNewPm] = useState({ type: 'bizum', value: '' })

  useEffect(() => {
    async function load() {
      const customerId = localStorage.getItem('customerId')
      if (!customerId) return
      try {
        const res = await fetch(`/api/get-customer?id=${customerId}`)
        const data = await res.json()
        if (data.profile) setProfile(data.profile)
        if (data.paymentMethods?.length) {
          setPms(data.paymentMethods.map((p: any) => ({
            id: p.id, type: p.type, icon: PM_ICONS[p.type] || '💳',
            label: p.label, sub: p.sub || '', isDefault: p.is_default,
          })))
        }
      } catch (e) { console.error(e) }
    }
    load()
  }, [])

  function openEdit(key: string, label: string) {
    setEditField({ key, label })
    setEditVal(profile[key as keyof typeof profile])
  }

  async function saveEdit() {
    if (!editField || !editVal.trim()) return
    setProfile(p => ({ ...p, [editField.key]: editVal }))
    const customerId = localStorage.getItem('customerId')
    if (customerId) {
      await fetch('/api/update-customer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, field: editField.key, value: editVal }),
      })
    }
    setEditField(null)
  }

  async function addPaymentMethod() {
    if (newPm.type !== 'apple' && !newPm.value.trim()) return
    const labels: Record<string, string> = { bizum: 'Bizum', card: `Visa •••• ${newPm.value.slice(-4)}`, apple: 'Apple Pay' }
    const sub = newPm.type === 'bizum' ? newPm.value : newPm.type === 'card' ? 'Caduca MM/AA' : 'iPhone'
    const isFirst = pms.length === 0
    const customerId = localStorage.getItem('customerId')
    if (customerId) {
      const res = await fetch('/api/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, type: newPm.type, label: labels[newPm.type], sub, isDefault: isFirst }),
      })
      const data = await res.json()
      if (data.paymentMethod) {
        const pm = data.paymentMethod
        setPms(prev => [...prev, { id: pm.id, type: pm.type, icon: PM_ICONS[pm.type] || '💳', label: pm.label, sub: pm.sub || '', isDefault: pm.is_default }])
      }
    }
    setAddPmOpen(false)
    setNewPm({ type: 'bizum', value: '' })
  }

  async function setDefaultPm(pmId: string) {
    const customerId = localStorage.getItem('customerId')
    if (customerId) {
      await fetch('/api/payment-method', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, pmId }),
      })
    }
    setPms(prev => prev.map(p => ({ ...p, isDefault: p.id === pmId })))
  }

  async function deletePm(pmId: string) {
    await fetch('/api/payment-method', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pmId }),
    })
    setPms(prev => prev.filter(p => p.id !== pmId))
  }

  return (
    <div className="px-4 py-4 pb-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">

        {/* Profile */}
        <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-2">Mi perfil</div>
        <motion.div variants={fadeUp} className="rounded-[14px] overflow-hidden mb-4 border border-[#0D0D0D]/[0.07]"
          style={{ background: 'var(--sand-card)' }}>
          {[
            { key: 'name', label: 'Nombre', icon: '👤' },
            { key: 'email', label: 'Email', icon: '✉️' },
            { key: 'phone', label: 'Móvil', icon: '📱' },
          ].map((f, i) => (
            <div key={f.key} className={`flex justify-between items-center px-4 py-3 ${i < 2 ? 'border-b border-[#0D0D0D]/[0.06]' : ''}`}>
              <div>
                <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.3px]">{f.icon} {f.label}</div>
                <div className="text-[13px] font-medium text-[#0D0D0D] mt-0.5">{profile[f.key as keyof typeof profile] || '—'}</div>
              </div>
              <button onClick={() => openEdit(f.key, f.label)} className="text-[12px] font-semibold text-[#1D9E75]">Editar</button>
            </div>
          ))}
        </motion.div>

        {/* Payment methods */}
        <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-2">Métodos de pago</div>
        <motion.div variants={fadeUp} className="rounded-[14px] overflow-hidden mb-2 border border-[#0D0D0D]/[0.07]"
          style={{ background: 'var(--sand-card)' }}>
          {pms.map((pm, i) => (
            <div key={pm.id} className={`flex items-center gap-3 px-4 py-3 ${i < pms.length - 1 ? 'border-b border-[#0D0D0D]/[0.06]' : ''}`}>
              <div className="w-9 h-6 rounded-[5px] flex items-center justify-center text-[14px] flex-shrink-0"
                style={{ background: 'rgba(13,13,13,.06)' }}>{pm.icon}</div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#0D0D0D]">{pm.label}</div>
                <div className="text-[11px] text-[#0D0D0D]/35">{pm.sub}</div>
              </div>
              <div className="flex items-center gap-2">
                {pm.isDefault
                  ? <span className="text-[10px] font-bold text-[#1D9E75] px-2 py-0.5 rounded-[7px]" style={{ background: 'rgba(29,158,117,.1)' }}>Principal</span>
                  : <button onClick={() => setDefaultPm(pm.id)}
                      className="text-[12px] font-semibold text-[#1D9E75]">Usar</button>
                }
                {pms.length > 1 && !pm.isDefault && (
                  <button onClick={() => deletePm(pm.id)}
                    className="text-[12px] font-semibold text-red-500">✕</button>
                )}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.button variants={fadeUp} whileTap={tapScale}
          onClick={() => setAddPmOpen(true)}
          className="w-full border rounded-[14px] py-3.5 text-[13px] font-semibold mb-4 transition-colors"
          style={{ borderStyle: 'dashed', borderColor: 'rgba(13,13,13,.18)', color: 'rgba(13,13,13,.38)', background: 'transparent' }}>
          + Añadir método de pago
        </motion.button>

        {/* María */}
        <motion.div variants={fadeUp} className="rounded-[14px] p-4 mb-4 border border-[#0D0D0D]/[0.07]"
          style={{ background: 'var(--sand-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white font-bold text-[20px] flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#FAC775,#D85A30)' }}>M</div>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-[#0D0D0D]">María</div>
              <div className="text-[11px] text-[#0D0D0D]/35 mt-0.5">Respuesta media: <strong className="text-[#1D9E75]">4 min</strong></div>
            </div>
            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hola+María`}
              target="_blank" rel="noopener noreferrer"
              className="bg-[#1D9E75] text-white px-4 py-2 rounded-[10px] text-[13px] font-semibold no-underline">
              WhatsApp
            </a>
          </div>
        </motion.div>

        {/* FAQ */}
        <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-2">Preguntas frecuentes</div>
        <motion.div variants={fadeUp} className="rounded-[14px] overflow-hidden mb-3 border border-[#0D0D0D]/[0.07]"
          style={{ background: 'var(--sand-card)' }}>
          {FAQS.map((faq, i) => (
            <div key={i} className={i < FAQS.length - 1 ? 'border-b border-[#0D0D0D]/[0.06]' : ''}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center px-4 py-4 text-left">
                <span className="text-[13px] font-semibold text-[#0D0D0D] pr-3">{faq.q}</span>
                <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} className="text-[16px] text-[#0D0D0D]/25 flex-shrink-0">+</motion.span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 text-[12px] text-[#0D0D0D]/45 leading-relaxed">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        <motion.button variants={fadeUp} whileTap={tapScale}
          onClick={() => {
            localStorage.removeItem('daily_onboarding_complete')
            localStorage.removeItem('daily_hogar_price')
            localStorage.removeItem('daily_mascota_price')
            localStorage.removeItem('daily_mascota_type')
            localStorage.removeItem('daily_chip_saved')
            localStorage.removeItem('daily_cancelling')
            window.location.href = '/app'
          }}
          className="w-full py-3.5 rounded-[14px] text-[14px] font-semibold mb-2"
          style={{ background: 'rgba(29,158,117,.07)', color: '#1D9E75', border: '1px solid rgba(29,158,117,.2)' }}>
          Recalcular mi cobertura
        </motion.button>

        <motion.button variants={fadeUp} whileTap={tapScale}
          onClick={() => {
            const keys = [
              'customerId', 'customerName',
              'daily_onboarding_complete', 'daily_hogar_price',
              'daily_mascota_price', 'daily_mascota_type',
              'daily_chip_saved', 'daily_cancelling', 'daily_travel_active',
            ]
            keys.forEach(k => localStorage.removeItem(k))
            window.location.href = '/app'
          }}
          className="w-full py-3.5 rounded-[14px] text-[14px] font-semibold mb-3"
          style={{ background: 'rgba(239,68,68,.07)', color: '#EF4444', border: '1px solid rgba(239,68,68,.18)' }}>
          Cerrar sesión
        </motion.button>

        <div className="text-center text-[10px] text-[#0D0D0D]/20">Mediador inscrito en DGSFP España</div>
      </motion.div>

      {/* Edit profile sheet */}
      <Sheet open={!!editField} onClose={() => setEditField(null)}>
        <div className="px-5 pt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[15px] font-bold text-[#0D0D0D]">Editar {editField?.label}</div>
            <button onClick={() => setEditField(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] text-[#0D0D0D]/40"
              style={{ background: 'rgba(13,13,13,.07)' }}>✕</button>
          </div>
          <input value={editVal} onChange={e => setEditVal(e.target.value)}
            className="w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D] border border-[#0D0D0D]/12 mb-4"
            style={{ background: 'rgba(13,13,13,.04)' }} />
          <motion.button whileTap={tapScale} onClick={saveEdit}
            className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white"
            style={{ background: '#0D0D0D' }}>
            Guardar cambio
          </motion.button>
        </div>
      </Sheet>

      {/* Add payment sheet */}
      <Sheet open={addPmOpen} onClose={() => setAddPmOpen(false)}>
        <div className="px-5 pt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[15px] font-bold text-[#0D0D0D]">Añadir método de pago</div>
            <button onClick={() => setAddPmOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] text-[#0D0D0D]/40"
              style={{ background: 'rgba(13,13,13,.07)' }}>✕</button>
          </div>
          <div className="flex gap-2 mb-4">
            {[{ k: 'bizum', l: 'Bizum', i: '💙' }, { k: 'card', l: 'Tarjeta', i: '💳' }, { k: 'apple', l: 'Apple Pay', i: '🍎' }].map(pm => (
              <button key={pm.k} onClick={() => setNewPm(n => ({ ...n, type: pm.k }))}
                className="flex-1 py-2.5 rounded-[11px] text-[12px] font-semibold border transition-all"
                style={{
                  background: newPm.type === pm.k ? 'rgba(13,13,13,.08)' : 'rgba(13,13,13,.04)',
                  borderColor: newPm.type === pm.k ? 'rgba(13,13,13,.3)' : 'rgba(13,13,13,.1)',
                  color: '#0D0D0D',
                }}>
                {pm.i} {pm.l}
              </button>
            ))}
          </div>
          {newPm.type !== 'apple' && (
            <input value={newPm.value} onChange={e => setNewPm(n => ({ ...n, value: e.target.value }))}
              placeholder={newPm.type === 'bizum' ? '+34 600 000 000' : '1234 5678 9012 3456'}
              className="w-full px-4 py-3 rounded-[11px] text-[14px] text-[#0D0D0D] border border-[#0D0D0D]/12 mb-4"
              style={{ background: 'rgba(13,13,13,.04)' }} />
          )}
          <motion.button whileTap={tapScale} onClick={addPaymentMethod}
            className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white"
            style={{ background: '#0D0D0D' }}>
            Añadir método
          </motion.button>
        </div>
      </Sheet>
    </div>
  )
}
