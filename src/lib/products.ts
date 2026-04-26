import type { Product } from '@/types'

export const PRODUCTS: Product[] = [
  {
    id: 'home', label: 'Hogar', desc: 'Tu piso protegido',
    basePrice: 14.90, icon: '🏠', color: '#1D9E75',
    questions: [
      { id: 'size', label: 'Tamaño de tu hogar', options: [
        { label: 'Pequeño', desc: 'Menos de 80m²', multiplier: 0.85 },
        { label: 'Mediano', desc: '80–150m²', multiplier: 1.0 },
        { label: 'Grande', desc: 'Más de 150m²', multiplier: 1.4 },
      ]},
      { id: 'ownership', label: '¿Propietario o inquilino?', options: [
        { label: 'Propietario', desc: 'La casa es tuya', multiplier: 1.1 },
        { label: 'Inquilino', desc: 'Vives de alquiler', multiplier: 0.9 },
      ]},
      { id: 'buildYear', label: 'Antigüedad del edificio', options: [
        { label: 'Antes de 1980', desc: 'Más riesgo de tuberías', multiplier: 1.15 },
        { label: '1980–2010', desc: 'Construcción estándar', multiplier: 1.0 },
        { label: 'Después de 2010', desc: 'Edificio moderno', multiplier: 0.9 },
      ]},
    ],
  },
  {
    id: 'car', label: 'Coche / Moto', desc: 'Circula tranquilo',
    basePrice: 28.50, icon: '🚗', color: '#378ADD',
    questions: [
      { id: 'type', label: '¿Qué conduces?', options: [
        { label: 'Coche', multiplier: 1.0 },
        { label: 'Moto', multiplier: 0.65 },
      ]},
      { id: 'year', label: 'Antigüedad del vehículo', options: [
        { label: 'Antes de 2000', desc: 'Clásico / segunda mano', multiplier: 0.7 },
        { label: '2000–2015', desc: 'Uso estándar', multiplier: 1.0 },
        { label: 'Después de 2015', desc: 'Coche moderno', multiplier: 1.3 },
      ]},
      { id: 'use', label: '¿Uso principal?', options: [
        { label: 'Ciudad', desc: 'Menos de 10k km/año', multiplier: 0.85 },
        { label: 'Mixto', desc: 'Ciudad y carretera', multiplier: 1.0 },
        { label: 'Carretera', desc: 'Más de 20k km/año', multiplier: 1.25 },
      ]},
    ],
  },
  {
    id: 'pet', label: 'Mascota', desc: 'Tu mejor amigo cubierto',
    basePrice: 18.90, icon: '🐾', color: '#D85A30',
    questions: [
      { id: 'type', label: '¿Qué mascota tienes?', options: [
        { label: 'Perro', multiplier: 1.0 },
        { label: 'Gato', multiplier: 0.8 },
      ]},
      { id: 'age', label: '¿Qué edad tiene?', options: [
        { label: 'Joven', desc: '0–5 años', multiplier: 0.85 },
        { label: 'Adulto', desc: '5–10 años', multiplier: 1.0 },
        { label: 'Senior', desc: 'Más de 10 años', multiplier: 1.45 },
      ]},
      { id: 'size', label: 'Tamaño', options: [
        { label: 'Pequeño', desc: 'Menos de 10kg', multiplier: 0.9 },
        { label: 'Mediano', desc: '10–25kg', multiplier: 1.0 },
        { label: 'Grande', desc: 'Más de 25kg', multiplier: 1.2 },
      ]},
    ],
  },
  {
    id: 'travel', label: 'Viaje', desc: 'Para tu próxima aventura',
    basePrice: 12.50, icon: '✈️', color: '#9747FF',
    questions: [
      { id: 'destination', label: '¿A dónde viajas?', options: [
        { label: 'Europa', desc: 'Espacio Schengen', multiplier: 0.85 },
        { label: 'Mundo', desc: 'Excepto USA y Canadá', multiplier: 1.2 },
        { label: 'USA / Canadá', desc: 'Costes médicos altos', multiplier: 1.85 },
      ]},
      { id: 'duration', label: '¿Cuánto dura el viaje?', options: [
        { label: 'Fin de semana', desc: '1–4 días', multiplier: 0.7 },
        { label: 'Una semana', desc: '5–10 días', multiplier: 1.0 },
        { label: 'Más largo', desc: '11–30 días', multiplier: 1.55 },
      ]},
      { id: 'activity', label: '¿Tipo de viaje?', options: [
        { label: 'Turístico', desc: 'Ciudades, playa, cultura', multiplier: 0.95 },
        { label: 'Aventura', desc: 'Trekking, esquí, surf', multiplier: 1.35 },
        { label: 'Negocios', desc: 'Trabajo y reuniones', multiplier: 1.0 },
      ]},
    ],
  },
]

export const BUNDLE_TIERS = [
  { minPolicies: 2, discount: 3 },
  { minPolicies: 3, discount: 7 },
  { minPolicies: 4, discount: 12 },
]

export const LOYALTY_TIERS = [
  { months: 4,  discount: 5  },
  { months: 12, discount: 10 },
  { months: 24, discount: 15 },
]

export function calcPrice(productId: string, answers: Record<string, string>): number {
  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) return 0
  const multiplier = product.questions.reduce((acc, q) => {
    const answer = answers[q.id]
    const option = q.options.find(o => o.label === answer)
    return acc * (option?.multiplier ?? 1)
  }, 1)
  return Math.round(product.basePrice * multiplier * 100) / 100
}

export function getBundleDiscount(activeCount: number): number {
  let discount = 0
  BUNDLE_TIERS.forEach(t => { if (activeCount >= t.minPolicies) discount = t.discount })
  return discount
}

export function getLoyaltyDiscount(months: number): number {
  let discount = 0
  LOYALTY_TIERS.forEach(t => { if (months >= t.months) discount = t.discount })
  return discount
}
