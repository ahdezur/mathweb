'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCourseContentBySlug, CourseContent, ChapterData, UnitData } from '@/lib/classroomData';
import { ClassroomSidebar } from '@/components/classroom/ClassroomSidebar';
import { SplitFormulaPanel } from '@/components/classroom/SplitFormulaPanel';
import { VideoPlayer, PdfViewer } from '@/components/classroom/MediaRenderers';
import { MathFormula, MathText } from '@/components/math/MathFormula';
import {
  WhiteBaseCard,
  DefinicionCard,
  TheoreticalCard,
  MetodoResolucionCard,
  TrampaCognitivaCard,
  PreguntaGuiaCard,
  EjercicioClaveCard,
} from '@/components/classroom/PedagogicalCards';
import { InteractivePractice, PracticeExercise } from '@/components/classroom/InteractivePractice';
import { LaTeXPedagogicalParser } from '@/components/math/LaTeXPedagogicalParser';

export default function CourseClassroomPage() {
  const params = useParams();
  const slug = (params.slug as string) || 'calculo-diferencial';

  const canonicalSlug = slug.includes('algebra-lineal')
    ? 'algebra-lineal'
    : slug.includes('calculo-multivariable')
    ? 'calculo-multivariable'
    : slug;

  const defaultCourse = getCourseContentBySlug(canonicalSlug);
  const [courseData, setCourseData] = useState<CourseContent>(defaultCourse);

  const router = useRouter();

  useEffect(() => {
    if (slug !== canonicalSlug) {
      router.replace(`/curso/${canonicalSlug}`);
    }
  }, [slug, canonicalSlug, router]);

  useEffect(() => {
    fetch(`/api/admin/courses?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.courses)) {
          const found = data.courses.find((c: any) => c.slug === canonicalSlug || c.slug === slug);
          if (found) {
            setCourseData(found);
          }
        }
      })
      .catch((err) => console.error('Error fetching live course data for student:', err));
  }, [slug, canonicalSlug]);

  // Classroom States
  const [activeChapterId, setActiveChapterId] = useState<string>(courseData.chapters[0]?.id || 'cap-1');
  const [activeTab, setActiveTab] = useState<'motivacion' | 'teoria' | 'practica' | 'ejercicios'>('motivacion');
  const [splitScreenOpen, setSplitScreenOpen] = useState<boolean>(false);
  const [headerCollapsed, setHeaderCollapsed] = useState<boolean>(false);

  // Exercise Pautas & Fichas Técnicas Toggle State
  const [openPautas, setOpenPautas] = useState<Record<number, boolean>>({});
  const [openFichas, setOpenFichas] = useState<Record<number, boolean>>({});

  const togglePauta = useCallback((idx: number) => {
    setOpenPautas((prev) => {
      const isCurrentlyOpen = !!prev[idx];
      const willBeOpen = !isCurrentlyOpen;
      if (willBeOpen) {
        // Auto-collapse Ficha Técnica when opening Pauta so solution has 100% width
        setOpenFichas((fPrev) => ({ ...fPrev, [idx]: false }));
      }
      return { ...prev, [idx]: willBeOpen };
    });
  }, []);

  const toggleFicha = useCallback((idx: number) => {
    setOpenFichas((prev) => {
      const currentVal = prev[idx] !== undefined ? prev[idx] : true;
      return { ...prev, [idx]: !currentVal };
    });
  }, []);

  // Sidebar Controls (Default: Light Mode as per user global preferences)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [fontScale, setFontScale] = useState<number>(1.0);

  const hasUnits = Array.isArray(courseData.units) && courseData.units.length > 0;
  const unitChapters = hasUnits ? courseData.units!.flatMap((u) => u.chapters || []) : [];
  const allChapters: ChapterData[] = unitChapters.length > 0
    ? unitChapters
    : (courseData.chapters || []);

  const activeChapter: ChapterData = allChapters.find((c) => c.id === activeChapterId) || allChapters[0];
  const activeUnit: UnitData | undefined = courseData.units?.find((u) =>
    u.chapters.some((c) => c.id === activeChapterId)
  );

  const handleIncreaseFont = useCallback(() => {
    setFontScale((prev) => Math.min(prev + 0.15, 1.75));
  }, []);

  const handleDecreaseFont = useCallback(() => {
    setFontScale((prev) => Math.max(prev - 0.15, 0.75));
  }, []);

  const handleSelectChapter = useCallback((id: string) => {
    setActiveChapterId(id);
    setActiveTab('motivacion');
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-row transition-colors duration-300 font-sans ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Lateral Panel with Exclusive Navigation and Control Buttons */}
      <ClassroomSidebar
        courseTitle={courseData.title}
        units={courseData.units}
        chapters={allChapters}
        activeChapterId={activeChapterId}
        onSelectChapter={handleSelectChapter}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        fontScale={fontScale}
        onIncreaseFont={handleIncreaseFont}
        onDecreaseFont={handleDecreaseFont}
      />

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Single Unified Header Box with Collapsible Focus Mode Toggle */}
        <header
          style={{ paddingLeft: '56px', paddingRight: '56px' }}
          className={`transition-all duration-500 ease-in-out border-b flex flex-col shrink-0 ${
            headerCollapsed ? 'py-3.5' : 'py-6'
          } ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          {/* Top Row: Chapter Title, Formula Box & Collapsible Header with Smooth Transition */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              headerCollapsed ? 'max-h-0 opacity-0 mb-0 scale-95 pointer-events-none' : 'max-h-96 opacity-100 mb-5 scale-100'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left Column: Unit & Chapter Capsules + Chapter Title */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1 flex-wrap">
                {activeUnit && (
                  <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0 font-title">
                    Unidad {activeUnit.number}{activeUnit.title ? `: ` : ''}
                    {activeUnit.title && <MathText text={activeUnit.title.replace(/^Unidad \d+:\s*/i, '')} />}
                  </span>
                )}
                <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shrink-0 font-title">
                  Capítulo {activeUnit ? `${activeUnit.number}.${activeChapter.number || 1}` : (activeChapter.number || 1)}
                </span>
                <h1 className="text-xl lg:text-2xl font-bold truncate font-title">
                  <MathText text={activeChapter.title} />
                </h1>
              </div>

              {/* Right Side: Formula del Capítulo Oval Box */}
              <div
                className={`flex flex-col items-center justify-center px-10 py-3.5 rounded-3xl border shrink-0 shadow-sm text-center min-w-[280px] ${
                  isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest block mb-1 font-title">
                  Fórmula del Capítulo
                </span>
                <div className="overflow-x-auto max-w-full">
                  <MathFormula latex={activeChapter.mathKey} block={true} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Always Visible Tabs Row + Header Collapse Toggle Button */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* 4 Tabs (Motivación, Teoría, Práctica, Ejercicios) - ALWAYS VISIBLE */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <button
                type="button"
                style={{ paddingLeft: '28px', paddingRight: '28px' }}
                className={`py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2.5 cursor-pointer font-title border shadow-sm ${
                  activeTab === 'motivacion'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-transparent shadow-md scale-105'
                    : isDarkMode
                    ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-cyan-400 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('motivacion')}
              >
                <i className={`fa-solid fa-lightbulb text-base ${activeTab === 'motivacion' ? 'text-white' : 'text-cyan-500'}`}></i>
                <span>Motivación</span>
              </button>

              <button
                type="button"
                style={{ paddingLeft: '28px', paddingRight: '28px' }}
                className={`py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2.5 cursor-pointer font-title border shadow-sm ${
                  activeTab === 'teoria'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-transparent shadow-md scale-105'
                    : isDarkMode
                    ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-cyan-400 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('teoria')}
              >
                <i className={`fa-solid fa-book-bookmark text-base ${activeTab === 'teoria' ? 'text-white' : 'text-indigo-500'}`}></i>
                <span>Teoría</span>
              </button>

              <button
                type="button"
                style={{ paddingLeft: '28px', paddingRight: '28px' }}
                className={`py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2.5 cursor-pointer font-title border shadow-sm ${
                  activeTab === 'practica'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-transparent shadow-md scale-105'
                    : isDarkMode
                    ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-cyan-400 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('practica')}
              >
                <i className={`fa-solid fa-pen-ruler text-base ${activeTab === 'practica' ? 'text-white' : 'text-emerald-500'}`}></i>
                <span>Práctica</span>
              </button>

              <button
                type="button"
                style={{ paddingLeft: '28px', paddingRight: '28px' }}
                className={`py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2.5 cursor-pointer font-title border shadow-sm ${
                  activeTab === 'ejercicios'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-transparent shadow-md scale-105'
                    : isDarkMode
                    ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-cyan-400 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('ejercicios')}
              >
                <i className={`fa-solid fa-calculator text-base ${activeTab === 'ejercicios' ? 'text-white' : 'text-amber-500'}`}></i>
                <span>Ejercicios</span>
              </button>
            </div>

            {/* Toggle Header Collapse Button */}
            <button
              type="button"
              onClick={() => setHeaderCollapsed(!headerCollapsed)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer font-title shadow-sm ${
                isDarkMode
                  ? 'bg-slate-950 hover:bg-slate-800 text-cyan-400 border-slate-800'
                  : 'bg-slate-50 hover:bg-slate-100 text-cyan-700 border-slate-200'
              }`}
              title={headerCollapsed ? 'Mostrar Encabezado del Capítulo' : 'Ocultar Encabezado del Capítulo'}
            >
              <i className={`fa-solid ${headerCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
              <span>{headerCollapsed ? 'Mostrar Encabezado' : 'Ocultar Encabezado'}</span>
            </button>
          </div>
        </header>

        {/* Chapter Content Main Area (Full-Width Reading View - Tight Bottom Spacing) */}
        <div
          style={{ paddingLeft: '56px', paddingRight: '56px', paddingTop: '24px', paddingBottom: '24px' }}
          className="flex-1 overflow-y-auto"
        >
          <div className="w-full transition-all">
            {/* PESTAÑA 1: MOTIVACIÓN */}
            {activeTab === 'motivacion' && (
              <div className="flex flex-col gap-2.5">
                {/* Encabezado General del Capítulo */}
                <div
                  className={`flex items-center gap-4 pb-4 border-b ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-xl font-bold font-title shrink-0">
                    <i className="fa-solid fa-lightbulb"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-title">Motivación e Intuición Conceptual</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">¿Por qué es fundamental este tema en la ingeniería?</p>
                  </div>
                </div>

                {/* Contenido Dinámico de Motivación */}
                <div style={{ zoom: fontScale }} className="transition-all duration-200">
                  <LaTeXPedagogicalParser content={activeChapter.motivacion || ''} />
                </div>
              </div>
            )}

            {/* PESTAÑA 2: DEFINICIONES Y TEORÍA */}
            {activeTab === 'teoria' && (
              <div className="flex flex-col gap-2.5">
                <div
                  className={`flex items-center gap-4 pb-4 border-b ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xl font-bold font-title shrink-0">
                    <i className="fa-solid fa-book-bookmark"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-title">Definiciones, Teoremas y Demostraciones</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Desarrollo formal riguroso en LaTeX (KaTeX)</p>
                  </div>
                </div>

                {/* Contenido Dinámico de Teoría */}
                <div style={{ zoom: fontScale }} className="transition-all duration-200">
                  <LaTeXPedagogicalParser content={activeChapter.teoria || ''} />
                </div>
              </div>
            )}

            {/* PESTAÑA 3: PRÁCTICA (Solo Tarjetas Blancas Base + Sección Interactiva + Media) */}
            {activeTab === 'practica' && (
              <div className="flex flex-col gap-2.5">
                {/* 🎯 SECCIÓN INTERACTIVA DE PRÁCTICA CON HEADER UNIFICADO (TÍTULO + PRECISIÓN Y REINICIAR) */}
                <InteractivePractice
                  fontScale={fontScale}
                  exercises={activeChapter.practica?.exercises || []}
                />

                {/* Video & PDF Media Components */}
                <div style={{ zoom: fontScale }} className="space-y-6 transition-all duration-200">
                  <VideoPlayer videoUrl={activeChapter.practica.videoUrl} title={`Video Explicativo: ${activeChapter.title}`} />
                  <PdfViewer pdfUrl={activeChapter.practica.pdfUrl} title={`Guía de Estudio PDF: ${activeChapter.title}`} />
                </div>
              </div>
            )}

            {/* PESTAÑA 4: EJERCICIOS (Solo Tarjetas Blancas Base + Pautas Desplegables con Botón Agrandado) */}
            {activeTab === 'ejercicios' && (
              <div className="flex flex-col gap-2.5">
                {/* Sticky Ejercicios Header with Split Screen Formula Drawer Toggle */}
                <div
                  className={`flex items-center justify-between pb-4 border-b sticky top-0 z-30 backdrop-blur-md pt-2.5 transition-all ${
                    isDarkMode ? 'border-slate-800/80 bg-slate-950/90' : 'border-slate-200/80 bg-white/90'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-xl font-bold font-title shrink-0">
                      <i className="fa-solid fa-calculator"></i>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-title">Guía de Ejercicios del Capítulo</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Problemas propuestos para certamen</p>
                    </div>
                  </div>

                  {/* Split Screen Formula Drawer Toggle - Always Visible when panel is closed */}
                  {!splitScreenOpen && (
                    <button
                      type="button"
                      onClick={() => setSplitScreenOpen(true)}
                      className="px-7 py-3.5 md:px-8 md:py-4 rounded-2xl text-sm md:text-base font-extrabold bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 font-title cursor-pointer"
                    >
                      <i className="fa-solid fa-table-columns text-base md:text-lg"></i>
                      <span>Dividir Pantalla (Fórmulas Clave)</span>
                    </button>
                  )}
                </div>

                {/* Contenedor de Ejercicios: Cada ejercicio en su propia Tarjeta Blanca Base */}
                <div className="flex flex-col gap-6 transition-all duration-200">
                  {activeChapter.ejercicios.problems.map((item, idx) => {
                    const problemText = typeof item === 'string' ? item : item.problem;
                    const pautaText = typeof item === 'string' ? null : item.pauta;
                    const dificultad = typeof item === 'string' ? null : item.dificultad;
                    const conceptos = typeof item === 'string' ? [] : (item.conceptos || []);
                    const habilidades = typeof item === 'string' ? [] : (item.habilidades || []);
                    const isPautaOpen = !!openPautas[idx];
                    const isFichaOpen = openFichas[idx] !== undefined ? openFichas[idx] : !isPautaOpen;

                    return (
                      <WhiteBaseCard key={idx} paddingRight="20px">
                        <div className="flex flex-col gap-6">
                          {/* 1. FILA SUPERIOR: Número de Ejercicio + Enunciado Matemático + Botón Pauta + Ficha Técnica */}
                          <div className="flex flex-col lg:flex-row items-start justify-between gap-4 w-full">
                            {/* Columna Izquierda: Enunciado del problema y Botón Ver Indicaciones (escalables con fontScale) */}
                            <div style={{ zoom: fontScale }} className="flex items-start gap-4 flex-1 min-w-0 w-full transition-all duration-200">
                              <span className="w-9 h-9 rounded-2xl bg-cyan-600 text-white font-bold font-title flex items-center justify-center text-sm shrink-0 shadow-xs mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm md:text-base leading-relaxed text-slate-900 dark:text-slate-100 font-medium">
                                  <MathText text={problemText} />
                                </div>

                                {/* Botón Ver Indicaciones / Pauta ubicado exactamente a 28px bajo el texto del problema */}
                                {pautaText && (
                                  <div style={{ marginTop: '28px' }} className="border-t border-slate-200 dark:border-slate-800 pt-6">
                                    <button
                                      type="button"
                                      onClick={() => togglePauta(idx)}
                                      className="px-6 py-3.5 text-sm font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-3 cursor-pointer font-title"
                                    >
                                      <i className="fa-solid fa-file-lines text-base"></i>
                                      <span>{isPautaOpen ? 'Ocultar indicaciones / pauta' : 'Ver indicaciones / pauta'}</span>
                                      <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-300 ${isPautaOpen ? 'rotate-180' : ''}`}></i>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Columna Derecha: FICHA TÉCNICA LATERAL CON BOTÓN DE ACORDEÓN */}
                            {!splitScreenOpen && (dificultad || conceptos.length > 0 || habilidades.length > 0) && (
                              <>
                                {isFichaOpen ? (
                                  /* Ficha Técnica Desplegada */
                                  <div className="w-full lg:w-56 shrink-0 p-3.5 rounded-2xl border bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-2xs transition-all ml-auto">
                                    {/* Header Ficha Técnica con Botón Acordeón para Recoger */}
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-2">
                                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-title inline-flex items-center gap-1.5 min-w-0 truncate">
                                        <i className="fa-solid fa-clipboard-list text-cyan-600 dark:text-cyan-400 shrink-0"></i> Ficha Técnica
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => toggleFicha(idx)}
                                        className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                                        title="Recoger / Ocultar Ficha Técnica"
                                      >
                                        <i className="fa-solid fa-chevron-right text-xs"></i>
                                      </button>
                                    </div>

                                    {/* Sección Dificultad dentro del cuerpo de la caja */}
                                    {dificultad && (
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-title">
                                          Dificultad
                                        </span>
                                        <div>
                                          <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider font-title shadow-2xs ${
                                              dificultad === 'Básico'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                                : dificultad === 'Medio'
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                            }`}
                                          >
                                            <i className={`fa-solid ${dificultad === 'Básico' ? 'fa-circle-check text-emerald-600 dark:text-emerald-400' : dificultad === 'Medio' ? 'fa-triangle-exclamation text-amber-600 dark:text-amber-400' : 'fa-fire text-rose-600 dark:text-rose-400'}`}></i>
                                            <span>{dificultad}</span>
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Conceptos Clave */}
                                    {conceptos.length > 0 && (
                                      <div className="space-y-1.5 pt-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-title">
                                          Conceptos Clave
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {conceptos.map((conc, cIdx) => (
                                            <span
                                              key={cIdx}
                                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-cyan-100/70 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/60 font-title"
                                            >
                                              <i className="fa-solid fa-tag text-[9px] text-cyan-600 dark:text-cyan-400"></i>
                                              <span>{conc}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Habilidades Cognitivas */}
                                    {habilidades.length > 0 && (
                                      <div className="space-y-1.5 pt-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-title">
                                          Habilidades Cognitivas
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {habilidades.map((hab, hIdx) => (
                                            <span
                                              key={hIdx}
                                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-100/70 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 font-title"
                                            >
                                              <i className="fa-solid fa-brain text-[9px] text-purple-600 dark:text-purple-400"></i>
                                              <span>{hab}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* Ficha Técnica Recogida / Colapsada (Botón de Acordeón Discreto en Esquina Superior Derecha) */
                                  <button
                                    type="button"
                                    onClick={() => toggleFicha(idx)}
                                    className="px-3.5 py-2 rounded-2xl border bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition-all font-title shrink-0 ml-auto"
                                    title="Desplegar Ficha Técnica"
                                  >
                                    <i className="fa-solid fa-clipboard-list text-cyan-600 dark:text-cyan-400 text-sm"></i>
                                    <span>Ver Ficha Técnica</span>
                                    <i className="fa-solid fa-chevron-left text-[10px] text-slate-400"></i>
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          {/* 2. FILA INFERIOR: CAJA VERDE DE LA PAUTA (Toma el 100% de ancho del contenedor al desplegarse) */}
                          {pautaText && isPautaOpen && (
                            <div style={{ zoom: fontScale }} className="w-full transition-all duration-200">
                              <div
                                style={{ padding: '32px 36px' }}
                                className="w-full bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl transition-all duration-300 shadow-xs"
                              >
                                <div className="px-4 py-3 md:px-6 md:py-4 text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-line space-y-2">
                                  <MathText text={pautaText} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </WhiteBaseCard>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Banner Inferior de Feedback y Sugerencias (SIEMPRE VISIBLE FIJO AL PIE) */}
        <div
          style={{ paddingLeft: '56px', paddingRight: '56px' }}
          className={`py-3 md:py-3.5 border-t shrink-0 backdrop-blur-md transition-all z-20 ${
            isDarkMode
              ? 'bg-slate-950/95 border-slate-800 text-slate-100'
              : 'bg-white/95 border-slate-200 shadow-sm text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-sm shrink-0">
              <i className="fa-solid fa-envelope-open-text"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-900 dark:text-slate-100">¿Tienes sugerencias o erratas?</span>
                <span>Escríbeme a</span>
                <a
                  href={`mailto:contacto@alvaroprofemate.cl?subject=Sugerencia/Erratum%20-%20${encodeURIComponent(activeChapter.title)}`}
                  style={{ color: '#ffffff' }}
                  className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white !text-white transition-all shadow-xs hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 my-0.5"
                  title="Haga clic para enviar un correo directamente"
                >
                  <i className="fa-solid fa-envelope text-xs text-white"></i>
                  <span className="text-white font-bold">contacto@alvaroprofemate.cl</span>
                </a>
                <span>para seguir optimizando los contenidos.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Split Formula Side Panel */}
      {splitScreenOpen && (
        <SplitFormulaPanel
          formulas={activeChapter.ejercicios.formulasClave}
          onClose={() => setSplitScreenOpen(false)}
        />
      )}
    </div>
  );
}


