'use client';

import React, { useState, useMemo } from 'react';
import { BankExercise, getAllBankExercises, saveBankExercise } from '@/lib/exerciseBank';
import { MathText } from '@/components/math/MathFormula';

interface CentralBankImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  courseSlug: string;
  tab: 'practica' | 'ejercicios';
  onExercisesImported: () => void;
}

export function CentralBankImportModal({
  isOpen,
  onClose,
  chapterId,
  courseSlug,
  tab,
  onExercisesImported,
}: CentralBankImportModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const bankExercises = useMemo(() => {
    return getAllBankExercises();
  }, [isOpen]);

  // Filter exercises by Tab compatibility:
  // - Practica tab: true_false, single_choice, multiple_choice, matching ONLY
  // - Ejercicios tab: desarrollo ONLY
  const compatibleExercises = useMemo(() => {
    return bankExercises.filter((ex) => {
      if (tab === 'practica') {
        return ex.tipoEjercicio !== 'desarrollo';
      } else {
        return ex.tipoEjercicio === 'desarrollo';
      }
    });
  }, [bankExercises, tab]);

  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return compatibleExercises;
    const query = searchTerm.toLowerCase();
    return compatibleExercises.filter(
      (ex) =>
        ex.titulo.toLowerCase().includes(query) ||
        ex.enunciadoLatex.toLowerCase().includes(query) ||
        ex.materiaArea.toLowerCase().includes(query) ||
        ex.tags.some((t) => t.tag.toLowerCase().includes(query))
    );
  }, [compatibleExercises, searchTerm]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmImport = () => {
    if (selectedIds.length === 0) return;

    // Update assignment of selected exercises in the bank
    selectedIds.forEach((id) => {
      const ex = bankExercises.find((b) => b.id === id);
      if (ex) {
        const hasAssignment = ex.asignaciones.some(
          (asg) => asg.chapterId === chapterId && asg.tab === tab
        );
        if (!hasAssignment) {
          ex.asignaciones.push({ courseSlug, chapterId, tab });
          if (ex.status === 'Borrador') {
            ex.status = 'Listo';
          }
          saveBankExercise(ex);
        }
      }
    });

    onExercisesImported();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-cyan-50 via-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-bold text-lg shadow-sm font-title">
              <i className="fa-solid fa-vault"></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 font-title flex items-center gap-2">
                Seleccionar desde el Banco Central
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                  Pestaña {tab === 'practica' ? 'Práctica' : 'Ejercicios'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tab === 'practica'
                  ? 'Mostrando solo ejercicios interactivos (VF, Selección Única, Selección Múltiple, Emparejamiento).'
                  : 'Mostrando solo ejercicios de Desarrollo formal.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center gap-3">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="Buscar por título, contenido o etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200 font-sans"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            {filteredExercises.length} disponibles
          </span>
        </div>

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              <i className="fa-solid fa-inbox text-3xl text-slate-300 dark:text-slate-700 mb-2 block"></i>
              No hay ejercicios compatibles en el banco central que coincidan con la búsqueda.
            </div>
          ) : (
            filteredExercises.map((ex) => {
              const isSelected = selectedIds.includes(ex.id);
              const isAlreadyAssigned = ex.asignaciones.some(
                (asg) => asg.chapterId === chapterId && asg.tab === tab
              );

              return (
                <div
                  key={ex.id}
                  onClick={() => toggleSelect(ex.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 shadow-xs'
                      : isAlreadyAssigned
                      ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected || isAlreadyAssigned}
                    onChange={() => toggleSelect(ex.id)}
                    className="mt-1 accent-cyan-600 rounded cursor-pointer"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                        {ex.tipoEjercicio.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          ex.nivelDificultad === 'Básico'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : ex.nivelDificultad === 'Avanzado'
                            ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {ex.nivelDificultad}
                      </span>
                      {isAlreadyAssigned && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ Ya Asignado
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 font-title">
                      {ex.titulo}
                    </h4>
                    <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      <MathText text={ex.enunciadoLatex} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {selectedIds.length} ejercicios seleccionados
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer font-title"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={selectedIds.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white transition-all shadow-md cursor-pointer font-title flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Vincular Ejercicios al Capítulo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
