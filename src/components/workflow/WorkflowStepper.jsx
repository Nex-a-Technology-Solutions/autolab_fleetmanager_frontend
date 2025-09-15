import React from 'react';
import { Check, Car, Sparkles, TestTubeDiagonal, Wrench, ShieldCheck, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

const stagesConfig = [
  { key: 'returned', label: 'Check-in', icon: Car },
  { key: 'washing', label: 'Wash/Visuals', icon: Sparkles },
  { key: 'driving_test', label: 'Drive Test', icon: TestTubeDiagonal },
  { key: 'servicing', label: 'Maintenance', icon: Wrench },
  { key: 'approval', label: 'Final Approval', icon: ShieldCheck },
  { key: 'ready_for_hire', label: 'Ready', icon: Flag },
];

export default function WorkflowStepper({ currentStage, completedStages = [] }) {
  const currentStageIndex = stagesConfig.findIndex(s => s.key === currentStage);

  return (
    <div className="w-full">
      <ol className="flex items-center w-full">
        {stagesConfig.map((stage, index) => {
          const isCompleted = completedStages.includes(stage.key) || index < currentStageIndex;
          const isCurrent = stage.key === currentStage;

          return (
            <motion.li
              key={stage.key}
              className={`flex w-full items-center ${index < stagesConfig.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex flex-col items-center justify-center w-full">
                <span
                  className={`flex items-center justify-center w-12 h-12 rounded-full ring-4 lg:w-14 lg:h-14 transition-all duration-300 ${
                    isCurrent ? 'ring-blue-300 bg-blue-600 text-white scale-110' :
                    isCompleted ? 'ring-slate-200 bg-emerald-600 text-white' :
                    'ring-slate-200 bg-white text-slate-500'
                  } ${index < stagesConfig.length - 1 ? `after:border-slate-200` : ''}`}
                >
                  {isCompleted && !isCurrent ? <Check className="w-6 h-6" /> : <stage.icon className="w-6 h-6" />}
                </span>
                <p className={`mt-3 text-xs text-center font-medium ${isCurrent ? 'text-blue-600' : 'text-slate-600'}`}>{stage.label}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}