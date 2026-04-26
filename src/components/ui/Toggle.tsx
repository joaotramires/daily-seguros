'use client'
import { motion } from 'framer-motion'

interface ToggleProps {
  checked: boolean
  onChange: () => void
  color?: string
}

export default function Toggle({ checked, onChange, color = '#1D9E75' }: ToggleProps) {
  return (
    <motion.button
      onClick={onChange}
      className="relative flex-shrink-0 rounded-full"
      style={{
        width: 50, height: 28,
        background: checked ? color : 'rgba(13,13,13,0.15)',
        transition: 'background 0.25s',
      }}
      whileTap={{ scale: 0.93 }}
    >
      <motion.div
        className="absolute top-[3px] rounded-full bg-white"
        style={{ width: 22, height: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
        animate={{ left: checked ? 25 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  )
}
