'use client';

import { motion } from 'framer-motion';

export default function AnimatedHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-white mb-2">
        KPMG CFO Dashboard
      </h1>
      <p className="text-slate-400 text-lg">
        Find virksomheder der har behov for CFO Interim Assistance
      </p>
    </motion.div>
  );
} 