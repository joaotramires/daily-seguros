'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { sheetVariants } from '@/lib/animations'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Sheet({ open, onClose, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[26px] max-h-[90vh] overflow-y-auto"
            style={{
              background: 'var(--sand-modal)',
              boxShadow: '0 -10px 50px rgba(0,0,0,0.25)',
              maxWidth: 430,
              margin: '0 auto',
            }}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="w-9 h-1 rounded-full bg-[#0D0D0D]/15 mx-auto mt-3 mb-0" />
            <div className="pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
