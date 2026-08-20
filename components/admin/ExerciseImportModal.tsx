'use client';

import React, { useState, useMemo } from 'react';
import { parseExerciseSyntaxText, SAMPLE_IMPORT_TEMPLATE } from '@/lib/exerciseParser';
import { InteractivePractice, PracticeExercise } from '@/components/classroom/InteractivePractice';

interface ExerciseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportExercises: (newExercises: PracticeExercise[]) => void;
}

export function ExerciseImportModal({ isOpen, onClose, onImportExercises }: ExerciseImportModalProps) {
  const [inputText, setInputText] = useState(SAMPLE_IMPORT_TEMPLATE);
  const [activeTab, setActiveTab] = useState<'editor' | 'help'>('editor');

  const parseResult = useMemo(() => {
    return parseExerciseSyntaxText(inputText);
  }, [inputText]);

  if (!isOpen) return null;

  const handleConfirmImport = () => {
    if (parseResult.exercises.length === 0) return;
    onImportExercises(parseResult.exercises);
    onClose();
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_IMPORT_TEMPLATE);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-indigo-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-bold text-lg shadow-sm font-title">
              <i className="fa-solid fa-file-import"></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-title flex items-center gap-2">
                Importador Masivo por Sintaxis LaTeX
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                  \\VF • \\ALT • \\MATCH • \\NUM
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Pega tus ejercicios redactados en bloque. Se agregarán automáticamente como tarjetas editables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs font-title"
              title="Cargar bloque de texto de ejemplo"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-cyan-600"></i>
              <span>Cargar Ejemplo</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Modal Main Body (2 Columns) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-slate-50/50">
          {/* Left Column: Textarea & Syntax Diagnostics */}
          <div className="p-5 flex flex-col border-r border-slate-200 bg-white overflow-hidden space-y-4">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-title flex items-center gap-1.5">
                <i className="fa-solid fa-code text-cyan-600"></i> Editor de Sintaxis
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {inputText.split('\n').length} líneas
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pega aquí tus ejercicios con \VF{...}, \ALT{...}, \MATCH{...}, \NUM{...}"
              className="flex-1 w-full p-4 font-mono text-xs leading-relaxed bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none shadow-inner"
              spellCheck={false}
            />

            {/* Diagnostics & Warnings Panel */}
            {parseResult.errors.length > 0 && (
              <div className="shrink-0 p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 max-h-32 overflow-y-auto text-xs">
                <div className="font-bold text-rose-800 flex items-center gap-1.5 font-title">
                  <i className="fa-solid fa-triangle-exclamation text-rose-600"></i>
                  <span>Avisos de Sintaxis ({parseResult.errors.length}):</span>
                </div>
                <ul className="list-disc pl-5 text-rose-700 space-y-0.5">
                  {parseResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Real-time Live Interactive Preview */}
          <div className="p-5 flex flex-col bg-slate-50 overflow-hidden space-y-4">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-title flex items-center gap-1.5">
                <i className="fa-solid fa-eye text-emerald-600"></i> Vista Previa en Tiempo Real ({parseResult.exercises.length} Ejercicios)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                KaTeX Nativo Activo
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
              {parseResult.exercises.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center text-xl">
                    <i className="fa-solid fa-list-check"></i>
                  </div>
                  <p className="text-xs font-medium max-w-xs">
                    Escribe o pega comandos como <code className="text-cyan-600 font-bold">\VF{`{...}`}</code> o <code className="text-cyan-600 font-bold">\ALT{`{...}`}</code> a la izquierda para ver la vista previa.
                  </p>
                </div>
              ) : (
                <InteractivePractice exercises={parseResult.exercises} fontScale={1.0} />
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              <strong>{parseResult.exercises.length}</strong> ejercicios parseados correctamente. Se agregarán al final de tu capítulo.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-300 transition-all cursor-pointer font-title flex-1 sm:flex-initial"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={parseResult.exercises.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer font-title flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              <i className="fa-solid fa-plus-circle"></i>
              <span>Confirmar e Insertar ({parseResult.exercises.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
