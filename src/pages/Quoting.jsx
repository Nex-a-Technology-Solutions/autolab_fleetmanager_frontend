import React from 'react';
import { motion } from 'framer-motion';
import QuoteBuilder from '../components/quoting/QuoteBuilder';

export default function Quoting() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{color: 'var(--wwfh-navy)'}}>
            Quote Builder
          </h1>
          <p className="text-lg text-slate-600">Create and manage quotes for vehicle hires.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuoteBuilder />
        </motion.div>
      </div>
    </div>
  );
}