'use client'
import { useState, useEffect } from 'react'

const STATUSES = ['received', 'in_review', 'with_mapfre', 'with_assessor', 'resolved'] as const
type ClaimStatus = typeof STATUSES[number]

const STATUS_LABELS: Record<ClaimStatus, string> = {
  received:      'Recibido',
  in_review:     'En revisión',
  with_mapfre:   'Con Mapfre',
  with_assessor: 'Con perito',
  resolved:      'Resuelto',
}

const STATUS_COLORS: Record<ClaimStatus, string> = {
  received:      '#1446A0',
  in_review:     '#8B6000',
  with_mapfre:   '#E30613',
  with_assessor: '#6B21A8',
  resolved:      '#1D9E75',
}

const PRODUCT_ICONS: Record<string, string> = { home: '🏠', pet: '🐾', travel: '✈️' }

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

export default function DailyInternalPage() {
  const [adminKey, setAdminKey]   = useState<string | null>(null)
  const [keyInput, setKeyInput]   = useState('')
  const [authError, setAuthError] = useState(false)
  const [claims, setClaims]       = useState<any[]>([])
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState<string | null>(null)

  // Read key from URL hash (#secret) or sessionStorage on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const stored = sessionStorage.getItem('daily_admin_key')
    const key = hash || stored || null
    if (key) {
      if (hash) sessionStorage.setItem('daily_admin_key', hash)
      setAdminKey(key)
    }
  }, [])

  // Fetch claims whenever key is set
  useEffect(() => {
    if (!adminKey) return
    setLoading(true)
    fetch('/api/admin/claims', { headers: { 'x-admin-secret': adminKey } })
      .then(r => {
        if (r.status === 401) { setAuthError(true); setAdminKey(null); sessionStorage.removeItem('daily_admin_key'); return { claims: [] } }
        return r.json()
      })
      .then(d => { setClaims(d.claims || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [adminKey])

  async function updateStatus(claimId: string, status: ClaimStatus) {
    if (!adminKey) return
    setSaving(claimId)
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c))
    await fetch('/api/update-claim', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminKey },
      body: JSON.stringify({ claimId, status }),
    })
    setSaving(null)
  }

  function handleLogin() {
    const key = keyInput.trim()
    if (!key) return
    sessionStorage.setItem('daily_admin_key', key)
    setAuthError(false)
    setAdminKey(key)
  }

  // Auth gate
  if (!adminKey) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F5F0E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', maxWidth: 360, width: '100%', boxShadow: '0 4px 24px rgba(13,13,13,.08)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Daily · Uso interno</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0D0D0D', marginBottom: 20 }}>Acceso restringido</div>
          {authError && (
            <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#EF4444', marginBottom: 16 }}>
              Clave incorrecta. Inténtalo de nuevo.
            </div>
          )}
          <input
            type="password"
            placeholder="Clave de acceso"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(13,13,13,.12)', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
          />
          <button onClick={handleLogin}
            style={{ width: '100%', background: '#0D0D0D', color: 'white', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Entrar →
          </button>
        </div>
      </div>
    )
  }

  const open   = claims.filter(c => c.status !== 'resolved')
  const closed = claims.filter(c => c.status === 'resolved')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F5F0E8', minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Daily · Uso interno
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0D0D0D', margin: 0, letterSpacing: -0.5 }}>
            Siniestros
          </h1>
          <div style={{ fontSize: 12, color: 'rgba(13,13,13,.4)', marginTop: 4 }}>
            {open.length} abiertos · {closed.length} resueltos
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: 'rgba(13,13,13,.3)', padding: 40 }}>Cargando…</div>
        )}

        {[
          { label: 'Abiertos', items: open },
          { label: 'Resueltos', items: closed },
        ].map(group => group.items.length > 0 && (
          <div key={group.label} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(13,13,13,.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              {group.label}
            </div>
            {group.items.map((c: any) => {
              const days = daysSince(c.created_at)
              const overdue = days > 30 && c.status !== 'resolved'
              return (
                <div key={c.id} style={{
                  background: 'white', borderRadius: 16, padding: '14px 16px', marginBottom: 10,
                  border: overdue ? '1.5px solid rgba(216,90,48,.4)' : '1px solid rgba(13,13,13,.08)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>{PRODUCT_ICONS[c.policies?.product] ?? '📄'}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0D0D0D' }}>
                          {c.customers?.name ?? '—'}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(13,13,13,.35)' }}>
                          {c.customers?.email ?? ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#0D0D0D', marginBottom: 6, lineHeight: 1.4 }}>
                        {c.description}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {c.incident_date && (
                          <span style={{ fontSize: 11, color: 'rgba(13,13,13,.4)' }}>
                            Incidente: {new Date(c.incident_date).toLocaleDateString('es-ES')}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: overdue ? '#D85A30' : 'rgba(13,13,13,.4)', fontWeight: overdue ? 700 : 400 }}>
                          Día {days}{overdue ? ' ⚠️' : ''}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                        background: `${STATUS_COLORS[c.status as ClaimStatus]}18`,
                        color: STATUS_COLORS[c.status as ClaimStatus],
                        textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>
                        {STATUS_LABELS[c.status as ClaimStatus] ?? c.status}
                      </div>
                      <select
                        value={c.status}
                        onChange={e => updateStatus(c.id, e.target.value as ClaimStatus)}
                        disabled={saving === c.id}
                        style={{
                          fontSize: 12, border: '1px solid rgba(13,13,13,.12)', borderRadius: 8,
                          padding: '5px 8px', background: 'rgba(13,13,13,.04)', cursor: 'pointer',
                          opacity: saving === c.id ? 0.5 : 1,
                        }}>
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {!loading && claims.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(13,13,13,.3)', padding: 60 }}>
            No hay siniestros aún.
          </div>
        )}
      </div>
    </div>
  )
}
