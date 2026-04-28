'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { PRODUCTS } from '@/lib/products'
import { fadeUp, stagger, tapScale } from '@/lib/animations'
import type { Claim } from '@/types'

const TIMELINE_DEMO = [
  { day: 1,  date: '18 mar', title: 'Siniestro abierto',       desc: 'Recibimos tu parte con 4 fotos',               owner: 'daily',  status: 'done'    },
  { day: 2,  date: '19 mar', title: 'Expediente enviado',       desc: 'Documentación completa a Mapfre',              owner: 'daily',  status: 'done'    },
  { day: 5,  date: '22 mar', title: 'Perito asignado',          desc: 'Carlos Ruiz · visita el día 8',                owner: 'mapfre', status: 'done'    },
  { day: 8,  date: '25 mar', title: 'Visita del perito',        desc: 'Daños inspeccionados y documentados',          owner: 'perito', status: 'done'    },
  { day: 12, date: '29 mar', title: 'Peritaje valorado',        desc: 'Daños valorados en €1.840',                    owner: 'mapfre', status: 'done'    },
  { day: 18, date: '4 abr',  title: 'En revisión con Mapfre',   desc: 'Daily hace seguimiento activo',                owner: 'mapfre', status: 'current' },
  { day: 30, date: '17 abr', title: 'Resolución prometida',     desc: 'O Daily te devuelve un mes de cuota',          owner: 'daily',  status: 'pending' },
]

const OWNERS: Record<string, { label: string; color: string; bg: string }> = {
  daily:  { label: 'Daily',  color: '#1D9E75', bg: 'rgba(29,158,117,.1)' },
  mapfre: { label: 'Mapfre', color: '#E30613', bg: 'rgba(227,6,19,.1)'   },
  perito: { label: 'Perito', color: '#8B6000', bg: 'rgba(161,109,0,.1)'  },
  user:   { label: 'Tú',     color: '#1446A0', bg: 'rgba(29,100,220,.1)' },
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<any[]>([
    { id: 'DLY-2847', desc: 'Daños por agua · Cocina', day: 18, isDemo: true }
  ])
  const [expandedId, setExpandedId] = useState<string | null>('DLY-2847')
  const [showForm, setShowForm] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [activePolicies, setActivePolicies] = useState<any[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    async function load() {
      const customerId = localStorage.getItem('customerId')
      if (!customerId) return
      const sb = createClient()
      const { data: pols } = await sb.from('policies').select('*').eq('customer_id', customerId).eq('status', 'active')
      setActivePolicies(pols || [])
      if (pols?.length) setSelectedPolicy(pols[0].id)
      const { data: cls } = await sb.from('claims').select('*').eq('customer_id', customerId)
      if (cls?.length) setClaims(prev => [...cls, ...prev.filter(c => c.isDemo)])
    }
    load()
  }, [])

  async function saveEdit(claimId: string, isDemo: boolean) {
    if (!editDesc.trim()) return
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, desc: editDesc } : c))
    if (!isDemo) {
      const customerId = localStorage.getItem('customerId')
      if (customerId) {
        const sb = createClient()
        await sb.from('claims').update({ description: editDesc }).eq('id', claimId)
      }
    }
    setEditId(null)
  }

  async function submitClaim() {
    if (!newDesc.trim()) return
    const newId = 'DLY-' + Math.floor(1000 + Math.random() * 9000)
    const newClaim = { id: newId, desc: newDesc.slice(0, 50), day: 1, isNew: true }
    setClaims(prev => [newClaim, ...prev])
    setExpandedId(newId)
    setShowForm(false)
    setNewDesc('')

    const customerId = localStorage.getItem('customerId')
    if (customerId && selectedPolicy) {
      const sb = createClient()
      const deadline = new Date(); deadline.setDate(deadline.getDate() + 30)
      await sb.from('claims').insert({
        customer_id: customerId, policy_id: selectedPolicy,
        description: newDesc, resolution_deadline: deadline.toISOString()
      })
    }
  }

  return (
    <div className="px-4 py-4 pb-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">

        {/* Promise card */}
        <motion.div variants={fadeUp} className="rounded-[18px] p-4 mb-3"
          style={{ background: '#0D0D0D', border: '1px solid rgba(29,158,117,.15)' }}>
          <div className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-[1px] mb-1">Promesa Daily</div>
          <div className="text-[16px] font-bold text-white leading-snug">
            Resuelto en 30 días o te devolvemos un mes de prima
          </div>
        </motion.div>

        {/* Claims list */}
        {claims.map(claim => (
          <motion.div key={claim.id} variants={fadeUp}
            className="rounded-[18px] mb-2.5 overflow-hidden border"
            style={{ background: 'var(--sand-card)', borderColor: claim.isNew ? 'rgba(29,158,117,.4)' : 'rgba(13,13,13,.08)' }}>

            {/* Header row */}
            <div className="p-4">
              {editId === claim.id ? (
                <div>
                  <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.5px] mb-2">
                    Siniestro {claim.id}
                  </div>
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[11px] text-[13px] text-[#0D0D0D] border border-[#0D0D0D]/12 resize-none mb-2"
                    style={{ background: 'rgba(13,13,13,.05)', minHeight: 60 }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(claim.id, claim.isDemo)}
                      className="flex-1 py-2 rounded-[10px] text-[13px] font-semibold text-white"
                      style={{ background: '#1D9E75' }}>Guardar</button>
                    <button onClick={() => setEditId(null)}
                      className="flex-1 py-2 rounded-[10px] text-[13px] font-semibold text-[#0D0D0D]/50"
                      style={{ background: 'rgba(13,13,13,.06)' }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedId(expandedId === claim.id ? null : claim.id)}>
                  <div>
                    <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.5px]">
                      Siniestro {claim.id}
                    </div>
                    <div className="text-[13px] font-bold text-[#0D0D0D] mt-0.5">{claim.desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); setEditId(claim.id); setEditDesc(claim.desc) }}
                      className="text-[12px] font-semibold text-[#1D9E75]">Editar</button>
                    <span className="rounded-[8px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.5px]"
                      style={claim.isNew
                        ? { background: 'rgba(29,100,220,.1)', color: '#1446A0' }
                        : { background: 'rgba(161,109,0,.1)', color: '#8B6000' }}>
                      {claim.isNew ? 'Recibido' : 'En curso'}
                    </span>
                    <motion.span animate={{ rotate: expandedId === claim.id ? 180 : 0 }}
                      className="text-[14px] text-[#0D0D0D]/25">⌃</motion.span>
                  </div>
                </div>
              )}
            </div>

            {/* Expanded detail */}
            <AnimatePresence>
              {expandedId === claim.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden border-t border-[#0D0D0D]/[0.06]">
                  <div className="p-4 pt-3">
                    {claim.isNew ? (
                      <div className="rounded-[12px] p-3" style={{ background: 'rgba(29,158,117,.08)', border: '1px solid rgba(29,158,117,.2)' }}>
                        <div className="text-[11px] font-bold text-[#1D9E75] mb-1">✓ Siniestro recibido</div>
                        <div className="text-[12px] text-[#0D0D0D]/50 leading-relaxed">
                          María te escribirá por WhatsApp en los próximos minutos.<br />
                          Plazo garantizado: <strong className="text-[#1D9E75]">30 días</strong>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Owner + day */}
                        <div className="rounded-[12px] p-3 mb-3" style={{ background: 'rgba(29,158,117,.08)', border: '1px solid rgba(29,158,117,.2)' }}>
                          <div className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-[0.8px] mb-1">Daily gestiona tu caso</div>
                          <div className="text-[20px] font-bold tracking-tight" style={{ color: '#1D9E75' }}>Activo · Día {claim.day}</div>
                          <div className="text-[12px] text-[#0D0D0D]/45 mt-1">📋 Coordinando con Mapfre para agilizar la resolución.</div>
                        </div>

                        {/* Day progress */}
                        <div className="flex items-center gap-4 mb-3">
                          <div>
                            <div className="text-[34px] font-bold text-[#0D0D0D] tracking-[-1px] leading-none">
                              {claim.day}<span className="text-[14px] text-[#0D0D0D]/25 font-medium">/30</span>
                            </div>
                            <div className="text-[10px] text-[#0D0D0D]/30 mt-0.5">días</div>
                          </div>
                          <div className="flex-1">
                            <div className="h-[5px] rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(13,13,13,.08)' }}>
                              <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#1D9E75,#25c48a)' }}
                                initial={{ width: 0 }} animate={{ width: `${Math.round(claim.day / 30 * 100)}%` }}
                                transition={{ duration: 0.8 }} />
                            </div>
                            <div className="text-[11px] text-[#0D0D0D]/35">
                              <strong className="text-[#0D0D0D]/60">{30 - claim.day} días</strong> hasta la promesa
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[10px] p-3 mb-3 flex items-start gap-2"
                          style={{ background: 'rgba(13,13,13,.05)' }}>
                          <span>📊</span>
                          <span className="text-[11px] text-[#0D0D0D]/45 leading-relaxed">
                            El <strong className="text-[#0D0D0D]/65">87% de siniestros como el tuyo</strong> se resuelven antes de 25 días.
                          </span>
                        </div>

                        {/* Timeline */}
                        <div className="text-[10px] font-bold text-[#0D0D0D]/35 uppercase tracking-[0.8px] mb-2">Cronología</div>
                        <div className="rounded-[14px] p-4" style={{ background: 'rgba(13,13,13,.04)', border: '1px solid rgba(13,13,13,.07)' }}>
                          {TIMELINE_DEMO.map((ev, i) => {
                            const own = OWNERS[ev.owner]
                            const isLast = i === TIMELINE_DEMO.length - 1
                            return (
                              <div key={i} className="flex gap-3 relative" style={{ paddingBottom: isLast ? 0 : 14 }}>
                                {!isLast && (
                                  <div className="absolute left-[11px] top-6 bottom-0 w-[2px]"
                                    style={{ background: ev.status === 'done' ? '#1D9E75' : 'rgba(13,13,13,.08)' }} />
                                )}
                                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white relative z-10"
                                  style={{
                                    background: ev.status === 'done' ? '#1D9E75' : 'var(--sand-card)',
                                    border: ev.status === 'current' ? '2px solid #1D9E75' : ev.status === 'pending' ? '1px solid rgba(13,13,13,.15)' : 'none',
                                    color: ev.status !== 'done' ? 'transparent' : 'white',
                                  }}>
                                  {ev.status === 'done' ? '✓' : ''}
                                </div>
                                <div className="flex-1 pt-0.5">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                      <div className={`text-[13px] font-semibold ${ev.status === 'pending' ? 'text-[#0D0D0D]/30' : 'text-[#0D0D0D]'}`}>
                                        {ev.title}
                                      </div>
                                      <div className={`text-[11px] mt-0.5 leading-snug ${ev.status === 'pending' ? 'text-[#0D0D0D]/20' : 'text-[#0D0D0D]/40'}`}>
                                        {ev.desc}
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className={`text-[10px] font-semibold ${ev.status === 'pending' ? 'text-[#0D0D0D]/15' : 'text-[#0D0D0D]/35'}`}>
                                        Día {ev.day}
                                      </div>
                                      <div className="text-[9px] text-[#0D0D0D]/20">{ev.date}</div>
                                    </div>
                                  </div>
                                  <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-[7px]"
                                    style={{ background: ev.status === 'pending' ? 'rgba(13,13,13,.04)' : own.bg }}>
                                    <div className="w-1 h-1 rounded-full" style={{ background: ev.status === 'pending' ? 'rgba(13,13,13,.15)' : own.color }} />
                                    <span className="text-[9px] font-bold uppercase tracking-[0.3px]"
                                      style={{ color: ev.status === 'pending' ? 'rgba(13,13,13,.2)' : own.color }}>
                                      {own.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* New claim button */}
        <motion.button variants={fadeUp} whileTap={tapScale}
          onClick={() => setShowForm(!showForm)}
          className="w-full py-4 rounded-[13px] text-[15px] font-semibold text-white mb-2"
          style={{ background: '#1D9E75' }}>
          + Reportar nuevo siniestro
        </motion.button>

        {/* New claim form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="rounded-[18px] p-4 mb-3 border border-[#1D9E75]/40"
              style={{ background: 'var(--sand-card)' }}>
              <div className="text-[15px] font-bold text-[#0D0D0D] mb-3">Nuevo siniestro</div>
              {activePolicies.length > 0 && (
                <select value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)}
                  className="w-full px-3 py-3 rounded-[11px] text-[13px] text-[#0D0D0D] mb-3 border border-[#0D0D0D]/12"
                  style={{ background: 'rgba(13,13,13,.05)' }}>
                  {activePolicies.map(p => {
                    const prod = PRODUCTS.find(pr => pr.id === p.product)
                    return <option key={p.id} value={p.id}>{prod?.icon} {prod?.label}</option>
                  })}
                </select>
              )}
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Describe brevemente qué ocurrió, cuándo y dónde…"
                className="w-full px-3 py-3 rounded-[11px] text-[13px] text-[#0D0D0D] mb-3 border border-[#0D0D0D]/12 resize-none"
                style={{ background: 'rgba(13,13,13,.05)', minHeight: 80 }} />
              <motion.button whileTap={tapScale} onClick={submitClaim}
                className="w-full py-3 rounded-[11px] text-[14px] font-semibold text-white"
                style={{ background: '#1D9E75' }}>
                Enviar siniestro →
              </motion.button>
              <button onClick={() => setShowForm(false)} className="w-full text-center text-[12px] text-[#0D0D0D]/35 mt-2">
                Cancelar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WhatsApp */}
        <motion.a variants={fadeUp} href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '34600000000'}?text=Hola+María`}
          target="_blank" rel="noopener noreferrer" whileTap={tapScale}
          className="flex items-center justify-between rounded-[14px] p-4 no-underline"
          style={{ background: '#0D0D0D' }}>
          <div>
            <div className="text-[13px] font-semibold text-white">Habla con María</div>
            <div className="text-[11px] text-white/30 mt-0.5">Por WhatsApp · 4 min de respuesta</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-[16px]">→</div>
        </motion.a>
      </motion.div>
    </div>
  )
}
