'use client';

import React from 'react';
import { MathFormula, MathText } from '../math/MathFormula';

interface FormulaItem {
  label: string;
  latex: string;
  description?: string;
}

interface SplitFormulaPanelProps {
  formulas: FormulaItem[];
  onClose: () => void;
}

export const SplitFormulaPanel: React.FC<SplitFormulaPanelProps> = React.memo(({ formulas, onClose }) => {
  return (
    <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[calc(100vh-160px)] animate-fadeIn sticky top-0">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 shrink-0">
        <h4 className="font-bold text-sm text-cyan-600 dark:text-cyan-400 flex items-center gap-2 font-title">
          <i className="fa-solid fa-square-root-variable text-base"></i> Fórmulas & Teoremas Clave
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer font-semibold"
          title="Cerrar panel de fórmulas"
        >
          <i className="fa-solid fa-xmark mr-1"></i> Cerrar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {formulas.map((item, idx) => (
          <div
            key={idx}
            style={{ marginTop: idx === 0 ? '0px' : '24px', padding: '18px 20px' }}
            className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all"
          >
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block text-center mb-2.5 border-b border-slate-200/80 dark:border-slate-800 pb-1.5 font-title">
              {item.label}
            </span>
            <div className="overflow-x-auto py-1 text-center">
              <MathFormula latex={item.latex} block />
            </div>
            
            {/* Small Review / Description Text Area rendered with KaTeX LaTeX */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 text-center">
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <MathText text={item.description || "Esta expresión matemática es fundamental para guiar el procedimiento y resolución paso a paso de los ejercicios del capítulo."} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

SplitFormulaPanel.displayName = 'SplitFormulaPanel';
