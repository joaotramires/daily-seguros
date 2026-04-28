import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'daily — El seguro como debería ser',
  description: 'Seguros para gente que odia los seguros. Con cobertura Mapfre.',
  themeColor: '#0d1a10',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
