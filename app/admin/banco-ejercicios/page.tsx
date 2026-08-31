'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BankExercise,
  ExerciseType,
  DifficultyLevel,
  CognitiveLevel,
  getAllBankExercises,
  saveBankExercise,
  deleteBankExercise,
  toPracticeExercise,
  syncExercisesFromAllCourses,
} from '@/lib/exerciseBank';
import { MathText } from '@/components/math/MathFormula';
import { InteractivePractice } from '@/components/classroom/InteractivePractice';

export default function CentralExerciseBankPage() {
  const [exercises, setExercises] = useState<BankExercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Editing / Creating Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEx, setEditingEx] = useState<Partial<BankExercise> | null>(null);

  // Live Preview Toggle Memory
  const [openPreviews, setOpenPreviews] = useState<Record<string, boolean>>({});

  const togglePreview = (id: string) => {
    setOpenPreviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const synced = syncExercisesFromAllCourses();
    setExercises(synced);
    setLoading(false);
  }, []);

  const refreshData = () => {
    setExercises(getAllBankExercises());
  };

  // Filtered Exercises Computation
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      // Assignment Filter
      if (assignmentFilter === 'unassigned' && ex.asignaciones.length > 0) return false;
      if (assignmentFilter === 'assigned' && ex.asignaciones.length === 0) return false;

      // Type Filter
      if (typeFilter !== 'all' && ex.tipoEjercicio !== typeFilter) return false;

      // Difficulty Filter
      if (difficultyFilter !== 'all' && ex.nivelDificultad !== difficultyFilter) return false;

      // Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = ex.titulo.toLowerCase().includes(query);
        const matchesContent = ex.enunciadoLatex.toLowerCase().includes(query);
        const matchesTag = ex.tags.some((t) => t.tag.toLowerCase().includes(query));
        const matchesMateria = ex.materiaArea.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent && !matchesTag && !matchesMateria) return false;
      }

      return true;
    });
  }, [exercises, assignmentFilter, typeFilter, difficultyFilter, searchTerm]);

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingEx({
      id: `bank-ex-${Date.now()}`,
      tipoEjercicio: 'desarrollo',
      titulo: '',
      enunciadoLatex: '',
      nivelDificultad: 'Intermedio',
      materiaArea: 'Cálculo Diferencial',
      temaSubtema: 'General',
      tags: [{ tag: 'Nuevo Ejercicio', mostrarAlEstudiante: true }],
      nivelCognitivo: 'Aplicar',
      status: 'Borrador',
      asignaciones: [],
      pautaDetalladaLatex: '',
      analytics: {
        tasaAciertoHistorica: 0,
        intentosPromedio: 0,
        usoDePistaCount: 0,
        dificultadPercibidaTotal: 0,
        dificultadPercibidaVotos: 0,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ex: BankExercise) => {
    setEditingEx(JSON.parse(JSON.stringify(ex)));
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este ejercicio del Banco Central?')) {
      deleteBankExercise(id);
      refreshData();
    }
  };

  const handleSaveModal = () => {
    if (!editingEx || !editingEx.titulo || !editingEx.enunciadoLatex) {
      alert('Por favor complete el título y el enunciado del ejercicio.');
      return;
    }

    saveBankExercise(editingEx as BankExercise);
    setIsModalOpen(false);
    setEditingEx(null);
    refreshData();
  };

  // Helper to add/remove tags in modal
  const handleAddTag = (tagText: string) => {
    if (!tagText.trim() || !editingEx) return;
    const current = editingEx.tags || [];
    if (!current.some((t) => t.tag.toLowerCase() === tagText.trim().toLowerCase())) {
      setEditingEx({
        ...editingEx,
        tags: [...current, { tag: tagText.trim(), mostrarAlEstudiante: true }],
      });
    }
  };

  const handleRemoveTag = (index: number) => {
    if (!editingEx || !editingEx.tags) return;
    const updated = [...editingEx.tags];
    updated.splice(index, 1);
    setEditingEx({ ...editingEx, tags: updated });
  };

  const handleToggleTagVisibility = (index: number) => {
    if (!editingEx || !editingEx.tags) return;
    const updated = [...editingEx.tags];
    updated[index].mostrarAlEstudiante = !updated[index].mostrarAlEstudiante;
    setEditingEx({ ...editingEx, tags: updated });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
              title="Volver al Dashboard"
            >
              <i className="fa-solid fa-arrow-left text-sm"></i>
            </Link>
            <div>
              <h1 className="text-xl font-black font-title flex items-center gap-2">
                🏛️ Banco Centralizado de Ejercicios
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Repositorio global de reactivos, autoevaluaciones e ideas docentes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const synced = syncExercisesFromAllCourses();
                setExercises(synced);
                alert(`¡Sincronización completada! ${synced.length} ejercicios registrados en el Banco Central.`);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-title flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              title="Escanear todos los cursos y traer ejercicios de capítulos previos"
            >
              <i className="fa-solid fa-arrows-rotate text-cyan-600"></i>
              <span>Sincronizar Cursos</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white text-xs font-bold font-title shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Nuevo Ejercicio / Borrador</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Filters Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="Buscar por título, LaTeX, tema o tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Counter */}
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
              {filteredExercises.length} de {exercises.length} Ejercicios
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Assignment Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setAssignmentFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  assignmentFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setAssignmentFilter('unassigned')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  assignmentFilter === 'unassigned'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📥 Ideas / Sin Asignar
              </button>
              <button
                onClick={() => setAssignmentFilter('assigned')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  assignmentFilter === 'assigned'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📚 Asignados a Capítulos
              </button>
            </div>

            {/* Type Selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Todos los Tipos</option>
              <option value="true_false">Verdadero / Falso</option>
              <option value="single_choice">Selección Única</option>
              <option value="multiple_choice">Selección Múltiple</option>
              <option value="matching">Emparejamiento</option>
              <option value="desarrollo">Desarrollo Formal</option>
            </select>

            {/* Difficulty Selector */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Todas las Dificultades</option>
              <option value="Básico">Básico</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExercises.map((ex) => {
            const isUnassigned = ex.asignaciones.length === 0;

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                        {ex.tipoEjercicio.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          ex.nivelDificultad === 'Básico'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : ex.nivelDificultad === 'Avanzado'
                            ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {ex.nivelDificultad}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {ex.nivelCognitivo}
                      </span>
                    </div>

                    {isUnassigned ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <i className="fa-solid fa-lightbulb text-[9px]"></i> Idea / Sin Asignar
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {ex.asignaciones.length} Asignaciones
                      </span>
                    )}
                  </div>

                  {/* Title & Statement */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-title mb-1">
                      {ex.titulo}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <MathText text={ex.enunciadoLatex} />
                    </p>
                  </div>

                  {/* Tags with Student Visibility Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ex.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          t.mostrarAlEstudiante
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                        title={t.mostrarAlEstudiante ? 'Visible para el estudiante' : 'Solo visible para el profesor'}
                      >
                        <i className={`fa-solid ${t.mostrarAlEstudiante ? 'fa-eye' : 'fa-eye-slash'} text-[9px]`}></i>
                        {t.tag}
                      </span>
                    ))}
                  </div>

                  {/* Vista Previa en Vivo (Estudiante) */}
                  <div className="mt-3 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/70 dark:bg-slate-950/70">
                    <button
                      type="button"
                      onClick={() => togglePreview(ex.id)}
                      className="w-full px-4 py-2 bg-slate-100/90 dark:bg-slate-900/90 hover:bg-slate-200/90 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-bold font-title text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <i className="fa-solid fa-eye text-cyan-600 dark:text-cyan-400"></i>
                        <span>Vista Previa en Vivo (Estudiante)</span>
                      </span>
                      <i className={`fa-solid ${openPreviews[ex.id] ? 'fa-chevron-up' : 'fa-chevron-down'} text-slate-400 text-xs`}></i>
                    </button>

                    {openPreviews[ex.id] && (
                      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                        {ex.tipoEjercicio !== 'desarrollo' ? (
                          (() => {
                            const practiceEx = toPracticeExercise(ex);
                            if (!practiceEx) return null;
                            return <InteractivePractice exercises={[practiceEx]} />;
                          })()
                        ) : (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center font-title">
                                1
                              </span>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-title">
                                Ejercicio de Desarrollo
                              </span>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-300">
                              <MathText text={ex.enunciadoLatex} />
                            </div>
                            {ex.pautaDetalladaLatex && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block font-title">
                                  ✓ Pauta / Solución Paso a Paso:
                                </span>
                                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                  <MathText text={ex.pautaDetalladaLatex} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls & Analytics (Visible Only to Teacher) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    <span title="Tasa de Acierto Histórica">
                      <i className="fa-solid fa-chart-line text-emerald-500 mr-1"></i>
                      {ex.analytics.tasaAciertoHistorica}% acierto
                    </span>
                    <span title="Intentos Promedio">
                      <i className="fa-solid fa-rotate text-cyan-500 mr-1"></i>
                      {ex.analytics.intentosPromedio} int.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(ex)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer font-title"
                    >
                      <i className="fa-solid fa-pen-to-square mr-1"></i> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-500 transition-all cursor-pointer"
                      title="Eliminar del Banco"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Edit / Create Exercise Modal */}
      {isModalOpen && editingEx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-cyan-50 via-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-950 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 font-title">
                {editingEx.id ? 'Editar Ejercicio en Banco Central' : 'Nuevo Ejercicio / Borrador'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Título & Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Título del Ejercicio</label>
                  <input
                    type="text"
                    value={editingEx.titulo || ''}
                    onChange={(e) => setEditingEx({ ...editingEx, titulo: e.target.value })}
                    placeholder="Ej: Derivada de Función Compuesta con Seno"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tipo de Ejercicio</label>
                  <select
                    value={editingEx.tipoEjercicio}
                    onChange={(e) => setEditingEx({ ...editingEx, tipoEjercicio: e.target.value as ExerciseType })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="desarrollo">Desarrollo (Pestaña Ejercicios)</option>
                    <option value="single_choice">Selección Única (Pestaña Práctica)</option>
                    <option value="multiple_choice">Selección Múltiple (Pestaña Práctica)</option>
                    <option value="true_false">Verdadero / Falso (Pestaña Práctica)</option>
                    <option value="matching">Emparejamiento (Pestaña Práctica)</option>
                  </select>
                </div>
              </div>

              {/* Enunciado en LaTeX */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Enunciado en LaTeX</label>
                <textarea
                  rows={4}
                  value={editingEx.enunciadoLatex || ''}
                  onChange={(e) => setEditingEx({ ...editingEx, enunciadoLatex: e.target.value })}
                  placeholder="Escribe el enunciado aquí. Usa $f(x) = x^2$ para matemáticas en línea."
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
              </div>

              {/* Dificultad, Nivel Cognitivo y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Dificultad (Docente/Alumno)</label>
                  <select
                    value={editingEx.nivelDificultad}
                    onChange={(e) => setEditingEx({ ...editingEx, nivelDificultad: e.target.value as DifficultyLevel })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="Básico">Básico</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Nivel Cognitivo (Docente/Alumno)</label>
                  <select
                    value={editingEx.nivelCognitivo}
                    onChange={(e) => setEditingEx({ ...editingEx, nivelCognitivo: e.target.value as CognitiveLevel })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="Recordar">Recordar</option>
                    <option value="Aplicar">Aplicar</option>
                    <option value="Analizar">Analizar</option>
                    <option value="Evaluación">Evaluación</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Estado</label>
                  <select
                    value={editingEx.status}
                    onChange={(e) => setEditingEx({ ...editingEx, status: e.target.value as 'Borrador' | 'Listo' | 'Archivado' })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="Borrador">📝 Borrador / Idea</option>
                    <option value="Listo">✅ Listo / Publicable</option>
                    <option value="Archivado">📦 Archivado</option>
                  </select>
                </div>
              </div>

              {/* Tags con Control de Visibilidad para Estudiante */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Etiquetas (Tags) y Visibilidad</span>
                  <span className="text-[10px] text-slate-400 font-normal">Marca si la etiqueta debe ser visible para el alumno</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="new-tag-input"
                    placeholder="Agregar tag (ej: Certamen 1, Racionalización)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        handleAddTag(target.value);
                        target.value = '';
                      }
                    }}
                    className="flex-1 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('new-tag-input') as HTMLInputElement;
                      if (el) {
                        handleAddTag(el.value);
                        el.value = '';
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-bold text-xs cursor-pointer font-title"
                  >
                    Agregar Tag
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {editingEx.tags?.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    >
                      <span className="font-semibold">{t.tag}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleTagVisibility(idx)}
                        className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.mostrarAlEstudiante
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                        title="Hacer clic para alternar visibilidad alumno"
                      >
                        {t.mostrarAlEstudiante ? '👁️ Alumno' : '🙈 Oculto'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="text-slate-400 hover:text-rose-500 ml-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solución / Pauta Detallada en LaTeX */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Pauta Detallada / Explicación (LaTeX)</label>
                <textarea
                  rows={4}
                  value={editingEx.pautaDetalladaLatex || ''}
                  onChange={(e) => setEditingEx({ ...editingEx, pautaDetalladaLatex: e.target.value })}
                  placeholder="Solución paso a paso que el alumno puede desplegar con el botón Mostrar Solución."
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer font-title"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveModal}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white transition-all shadow-md cursor-pointer font-title flex items-center gap-2"
              >
                <i className="fa-solid fa-floppy-disk"></i>
                <span>Guardar en Banco Central</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
