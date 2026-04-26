export type ProductId = 'home' | 'car' | 'pet' | 'travel'

export interface AnswerOption {
  label: string
  desc?: string
  multiplier: number
}

export interface Question {
  id: string
  label: string
  options: AnswerOption[]
}

export interface Product {
  id: ProductId
  label: string
  desc: string
  basePrice: number
  icon: string
  color: string
  questions: Question[]
}

export interface Policy {
  id: string
  customer_id: string
  product: ProductId
  status: 'active' | 'cancelled' | 'pending'
  monthly_premium: number
  annual_premium: number
  answers: Record<string, string>
  stripe_subscription_id?: string
  starts_at: string
  cancelled_at?: string
  loyalty_months: number
}

export interface Claim {
  id: string
  policy_id: string
  customer_id: string
  status: 'received' | 'in_review' | 'with_mapfre' | 'with_assessor' | 'resolved'
  description: string
  resolution_deadline: string
  resolved_at?: string
  notes?: string
  created_at: string
}

export interface Customer {
  id: string
  email: string
  phone?: string
  name: string
  age?: number
  city?: string
  referral_code: string
  referred_by?: string
  stripe_customer_id?: string
  loyalty_months: number
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bizum' | 'apple'
  label: string
  sub: string
  isDefault: boolean
}
