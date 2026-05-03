import type { Product } from '@/types'

// Multiplicative GLM model: finalPrice = base × Π(factor_i)
// Base prices are calibrated to the "reference" profile (all factors = 1.0)
// Reference: Hogar → Madrid periferia · piso · 60-100m² · propiedad · 1980-2000 · estándar
// Reference: Mascota → perro · mediana · joven · castrado · sano
// Reference: Viaje → Europa · una semana · 2 personas · 30-50 · sin deportes

export const PRODUCTS: Product[] = [
  {
    id: 'home', label: 'Hogar', desc: 'Alquilado o recién comprado',
    basePrice: 15.90, icon: '🏠', color: '#1D9E75',
    questions: [
      // Affects claim frequency (theft) and repair costs
      { id: 'location', label: '¿Dónde está el inmueble?', options: [
        { label: 'Madrid centro',    desc: 'Distritos Centro, Retiro, Salamanca', multiplier: 1.18 },
        { label: 'Madrid periferia', desc: 'Resto de la Comunidad de Madrid',     multiplier: 1.0  },
        { label: 'Barcelona',        desc: 'Ciudad de Barcelona',                 multiplier: 1.14 },
        { label: 'Otra capital',     desc: 'Valencia, Sevilla, Bilbao…',          multiplier: 1.06 },
        { label: 'Otra ciudad',      desc: 'Municipio o ciudad pequeña',          multiplier: 0.88 },
      ]},
      // Casa has more exposure: perimeter, roof, garden access
      { id: 'type', label: '¿Piso o casa?', options: [
        { label: 'Piso', desc: 'Apartamento en bloque',         multiplier: 1.0  },
        { label: 'Casa', desc: 'Unifamiliar, adosado o chalet', multiplier: 1.18 },
      ]},
      // Drives sum insured for building and contents
      { id: 'size', label: 'Superficie del inmueble', options: [
        { label: 'Menos de 60 m²', multiplier: 0.78 },
        { label: '60–100 m²',      multiplier: 1.0  },
        { label: '100–150 m²',     multiplier: 1.24 },
        { label: 'Más de 150 m²',  multiplier: 1.55 },
      ]},
      // Alquiler: contenido only. Propiedad: continente + contenido
      { id: 'ownership', label: '¿Alquiler o propiedad?', options: [
        { label: 'Alquiler',  desc: 'Soy inquilino',  multiplier: 0.84 },
        { label: 'Propiedad', desc: 'Es mi vivienda', multiplier: 1.14 },
      ]},
      // Older buildings: higher fire, pipe and structural risk
      { id: 'buildYear', label: 'Año de construcción del edificio', options: [
        { label: 'Antes de 1980',   desc: 'Mayor riesgo de tuberías y estructura', multiplier: 1.22 },
        { label: '1980–2000',       desc: 'Construcción estándar',                 multiplier: 1.04 },
        { label: '2000–2015',       desc: 'Edificio moderno',                      multiplier: 0.93 },
        { label: 'Después de 2015', desc: 'Edificio nuevo con normas actuales',    multiplier: 0.83 },
      ]},
      // Directly sets the contents sum insured
      { id: 'contents', label: 'Valor estimado del contenido', options: [
        { label: 'Básico',   desc: 'Hasta €15.000',      multiplier: 0.76 },
        { label: 'Estándar', desc: '€15.000 – €30.000',  multiplier: 1.0  },
        { label: 'Alto',     desc: '€30.000 – €60.000',  multiplier: 1.28 },
        { label: 'Muy alto', desc: 'Más de €60.000',     multiplier: 1.62 },
      ]},
    ],
  },
  {
    id: 'pet', label: 'Mascota', desc: 'Porque el vet siempre cobra más',
    basePrice: 19.90, icon: '🐾', color: '#D85A30',
    questions: [
      // Cats have lower average claim cost than dogs
      { id: 'species', label: '¿Qué especie tienes?', options: [
        { label: 'Perro', multiplier: 1.0  },
        { label: 'Gato',  multiplier: 0.70 },
      ]},
      // Body weight drives surgical costs, anaesthesia and medication dose
      { id: 'breed', label: '¿Cuál es su raza o tamaño?', options: [
        { label: 'Raza pequeña',           desc: 'Chihuahua, Yorkshire, Pomerania…', multiplier: 0.82 },
        { label: 'Raza mediana',           desc: 'Beagle, Cocker, Border Collie…',   multiplier: 1.0  },
        { label: 'Raza grande',            desc: 'Labrador, Pastor, Boxer…',         multiplier: 1.24 },
        { label: 'Raza gigante o exótica', desc: 'Mastín, Gran Danés, Persa…',       multiplier: 1.52 },
      ]},
      // Age is the strongest predictor of veterinary claims
      { id: 'age', label: '¿Qué edad tiene?', options: [
        { label: 'Cachorro', desc: '0–2 años',       multiplier: 0.80 },
        { label: 'Joven',    desc: '3–6 años',       multiplier: 1.0  },
        { label: 'Adulto',   desc: '7–10 años',      multiplier: 1.22 },
        { label: 'Senior',   desc: 'Más de 10 años', multiplier: 1.55 },
      ]},
      // Neutered animals have lower cancer and infection rates
      { id: 'neutered', label: '¿Está castrado/a?', options: [
        { label: 'Sí', multiplier: 0.88 },
        { label: 'No', multiplier: 1.06 },
      ]},
      // Pre-existing conditions raise expected claim severity
      { id: 'health', label: '¿Tiene historial de enfermedades?', options: [
        { label: 'No, sano/a',       desc: 'Sin problemas previos',             multiplier: 1.0  },
        { label: 'Problemas leves',  desc: 'Alergias, infecciones puntuales',   multiplier: 1.28 },
        { label: 'Problemas graves', desc: 'Cirugías o enfermedades crónicas',  multiplier: 1.65 },
      ]},
    ],
  },
  {
    id: 'travel', label: 'Viaje', desc: 'Ese viaje que llevas meses planeando',
    basePrice: 22.00, icon: '✈️', color: '#9747FF',
    // Base = 2 persons · Europa · 1 semana · 30-50 · sin deportes ≈ €22
    questions: [
      // Medical costs abroad drive 80 % of travel claims
      { id: 'destination', label: '¿A dónde viajas?', options: [
        { label: 'España',          desc: 'Viaje nacional, cobertura básica',  multiplier: 0.42 },
        { label: 'Europa',          desc: 'Espacio Schengen',                  multiplier: 1.0  },
        { label: 'Resto del mundo', desc: 'Excepto USA y Canadá',              multiplier: 1.55 },
        { label: 'USA o Canadá',    desc: 'Costes médicos muy elevados',       multiplier: 2.55 },
      ]},
      // Exposure time: each extra day adds proportional risk
      { id: 'duration', label: '¿Cuánto dura el viaje?', options: [
        { label: 'Fin de semana',    desc: '1–3 días',   multiplier: 0.42 },
        { label: 'Una semana',       desc: '4–8 días',   multiplier: 1.0  },
        { label: 'Dos semanas',      desc: '9–15 días',  multiplier: 1.72 },
        { label: 'Más de 2 semanas', desc: '16–30 días', multiplier: 2.65 },
      ]},
      // Group rates include slight per-person discount
      { id: 'travelers', label: '¿Cuántos viajeros?', options: [
        { label: 'Solo yo',      multiplier: 0.52 },
        { label: '2 personas',   multiplier: 1.0  },
        { label: '3–4 personas', desc: 'Grupo pequeño', multiplier: 1.72 },
        { label: '5 o más',      desc: 'Grupo',         multiplier: 2.38 },
      ]},
      // Elderly travellers have significantly higher medical claim rates
      { id: 'maxAge', label: 'Edad del viajero mayor', options: [
        { label: 'Menos de 30 años', multiplier: 0.82 },
        { label: '30–50 años',       multiplier: 1.0  },
        { label: '51–65 años',       multiplier: 1.38 },
        { label: 'Más de 65 años',   multiplier: 1.92 },
      ]},
      // Adventure sports raise accident and rescue claim probability
      { id: 'activity', label: '¿Practicáis deportes de riesgo?', options: [
        { label: 'No',                desc: 'Turismo o negocios',          multiplier: 1.0  },
        { label: 'Deportes suaves',   desc: 'Senderismo, esquí de pista…', multiplier: 1.22 },
        { label: 'Deportes aventura', desc: 'Surf, escalada, rafting…',    multiplier: 1.58 },
        { label: 'Deportes extremos', desc: 'Paracaidismo, alpinismo…',    multiplier: 2.15 },
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
    const option = q.options.find(o => o.label === answers[q.id])
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
