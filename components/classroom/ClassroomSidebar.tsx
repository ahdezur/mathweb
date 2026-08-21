'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChapterData, UnitData } from '@/lib/classroomData';
import { MathText } from '@/components/math/MathFormula';

interface ClassroomSidebarProps {
  courseTitle: string;
  units?: UnitData[];
  chapters: ChapterData[];
  activeChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  fontScale: number;
  onIncreaseFont: () => void;
  onDecreaseFont: () => void;
}

const ClassroomSidebarComponent: React.FC<ClassroomSidebarProps> = ({
  courseTitle,
  units,
  chapters,
  activeChapterId,
  onSelectChapter,
  collapsed,
  onToggleCollapse,
  isDarkMode,
  onToggleTheme,
  fontScale,
  onIncreaseFont,
  onDecreaseFont,
}) => {
  // Unit collapse state (key: unitId, value: isCollapsed boolean)
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});

  const toggleUnit = (unitId: string) => {
    setCollapsedUnits((prev: Record<string, boolean>) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // Display Units fallback wrapper (Sorted by unit number and chapter number)
  const displayUnits: UnitData[] = (units && units.length > 0
    ? units
    : [{ id: 'u-default', number: 1, title: 'Unidad 1: Módulos del Curso', chapters }]
  )
    .slice()
    .sort((a, b) => (a.number || 0) - (b.number || 0))
    .map((u) => ({
      ...u,
      chapters: (u.chapters || []).slice().sort((a, b) => (a.number || 0) - (b.number || 0))
    }));

  return (
    <aside
      className={`h-full transition-all duration-500 ease-in-out border-r flex flex-col z-40 shrink-0 ${
        isDarkMode
          ? 'bg-slate-950 border-slate-800 text-slate-100'
          : 'bg-[#edf1f5] border-slate-200/80 text-slate-900 shadow-xs'
      } ${collapsed ? 'w-16' : 'w-[340px]'}`}
    >
      {/* Sidebar Control Toolbar (Home, Theme, Font, Collapse) */}
      <div
        className={`py-3 px-4.5 border-b flex items-center justify-between gap-2.5 ${
          isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200/80 bg-white/90'
        }`}
      >
        {!collapsed ? (
          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hover:opacity-80 shadow-2xs border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400"
            title="Volver a la Página Principal"
          >
            <i className="fa-solid fa-house text-xs"></i>
            <span className="font-title tracking-wide">Inicio</span>
          </Link>
        ) : (
          <Link
            href="/"
            className="p-2 rounded-xl transition-colors mx-auto text-cyan-600 dark:text-cyan-400"
            title="Volver a la Página Principal"
          >
            <i className="fa-solid fa-house text-sm"></i>
          </Link>
        )}

        <div className="flex items-center gap-1">
          {/* Button 1: Toggle Theme */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
              isDarkMode
                ? 'hover:bg-slate-800 text-amber-400'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
          </button>

          {/* Button 2: Font Scale (-) */}
          <button
            type="button"
            onClick={onDecreaseFont}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Reducir tamaño de letra"
          >
            <i className="fa-solid fa-minus text-[10px]"></i>
          </button>

          {/* Font Scale indicator */}
          {!collapsed && (
            <span className="text-[11px] font-mono px-1 font-semibold opacity-75">
              {Math.round(fontScale * 100)}%
            </span>
          )}

          {/* Button 3: Font Scale (+) */}
          <button
            type="button"
            onClick={onIncreaseFont}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Aumentar tamaño de letra"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
          </button>

          {/* Button 4: Collapse / Expand Sidebar */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title={collapsed ? 'Expandir panel lateral' : 'Ocultar panel lateral'}
          >
            <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'} text-xs`}></i>
          </button>
        </div>
      </div>

      {/* Course Title Header with Logo + Álvaro Profemate on Top Right */}
      <div
        style={{ padding: collapsed ? '0px' : '18px 22px' }}
        className={`overflow-hidden transition-all duration-500 ease-in-out border-b ${
          collapsed ? 'max-h-0 opacity-0 border-transparent pointer-events-none' : 'max-h-60 opacity-100'
        } ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200/80 bg-white/90'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <span
              className="text-xs font-extrabold uppercase tracking-widest block font-title text-cyan-600 dark:text-cyan-400"
            >
              <i className="fa-solid fa-graduation-cap mr-1"></i> Contenido del Curso
            </span>
            <h2 className="text-base font-extrabold leading-snug font-title text-slate-900 dark:text-slate-100 truncate">
              {courseTitle}
            </h2>
          </div>

          {/* Logo Vectorial Original + Texto Álvaro Profemate */}
          <div className="flex items-center gap-2.5 shrink-0" title="Álvaro Profemate">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <svg width="24" height="24" viewBox="0 0 32 32" style={{ display: 'block' }}>
                <path d="M 4,16 L 7,16 L 10,26 L 13,4 L 28,4" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 15,25 L 20.5,14 L 26,25" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/>
                <line x1="17.5" y1="21.5" x2="23.5" y2="21.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/>
                <line x1="20.5" y1="11" x2="23" y2="7.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-sm font-black font-title tracking-tight text-slate-900 dark:text-slate-100">
                Álvaro
              </span>
              <span className="text-xs font-black font-title tracking-tight bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Profemate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Units & Chapters Tree List with Accordions (15px Symmetric Margins, 10px Inter-card Gap, 20px Top Gap) */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ paddingLeft: '15px', paddingRight: '15px', paddingTop: '20px', paddingBottom: '20px', gap: '10px' }} className="flex flex-col">
          {displayUnits.map((unit) => {
            const isUnitCollapsed = !!collapsedUnits[unit.id];

            return (
              <div
                key={unit.id}
                className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  isDarkMode
                    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                {/* Unit Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleUnit(unit.id)}
                  className={`w-full flex items-center justify-between p-3.5 text-left transition-all cursor-pointer ${
                    isDarkMode
                      ? 'hover:bg-slate-850 text-slate-200'
                      : 'hover:bg-slate-50 text-[#1e293b]'
                  }`}
                  title={collapsed ? unit.title : `Alternar desplegable de ${unit.title}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
                      <i className="fa-solid fa-layer-group"></i>
                    </div>
                    {!collapsed && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-title">
                          Unidad {unit.number}
                        </span>
                        <span className="text-sm font-extrabold font-title break-words whitespace-normal leading-snug text-[#1e293b] dark:text-slate-100">
                          <MathText text={unit.title.replace(/^Unidad \d+:\s*/i, '')} />
                        </span>
                      </div>
                    )}
                  </div>
                  {!collapsed && (
                    <i className={`fa-solid ${isUnitCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-xs opacity-60 ml-2 shrink-0 transition-transform`}></i>
                  )}
                </button>

                {/* Chapters inside Unit Card Container */}
                {!isUnitCollapsed && (
                  <div className="p-2.5 pt-0 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="pt-2 space-y-2">
                      {unit.chapters.map((chap: ChapterData, cIdx: number) => {
                        const isActive = chap.id === activeChapterId;

                        return (
                          <button
                            key={chap.id}
                            type="button"
                            onClick={() => onSelectChapter(chap.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                              isActive
                                ? isDarkMode
                                  ? 'bg-cyan-950/80 border-l-4 border-cyan-400 text-slate-100 font-semibold shadow-2xs'
                                  : 'bg-[#ecfeff] border-l-4 border-[#0891b2] text-slate-900 font-semibold shadow-2xs'
                                : isDarkMode
                                ? 'hover:bg-slate-800/80 text-slate-300'
                                : 'hover:bg-slate-100/80 text-slate-700'
                            }`}
                          >
                            <div
                              className={`px-2 py-0.5 rounded-md flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 min-w-[28px] ${
                                isActive
                                  ? 'bg-cyan-600 text-white shadow-2xs'
                                  : isDarkMode
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-slate-200/80 text-slate-700'
                              }`}
                            >
                              {`${unit.number}.${chap.number || cIdx + 1}`}
                            </div>

                            <div className={`flex-1 min-w-0 transition-all duration-500 ease-in-out ${collapsed ? 'max-w-0 opacity-0 overflow-hidden' : 'max-w-full opacity-100'}`}>
                              <span className="font-bold text-sm block leading-snug font-title mb-1">
                                <MathText text={chap.title} />
                              </span>
                              <span className={`text-xs line-clamp-2 leading-relaxed ${isActive ? 'text-cyan-900 dark:text-cyan-200 opacity-90' : 'opacity-75'}`}>
                                {chap.summary}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out text-center text-[11px] font-semibold opacity-70 ${
          collapsed ? 'max-h-0 opacity-0 py-0 pointer-events-none' : 'max-h-20 opacity-70 py-3 px-4'
        }`}
      >
        <i className="fa-solid fa-square-root-variable mr-1 text-cyan-500"></i> Álvaro Profemate &bull; Aula Virtual
      </div>
    </aside>
  );
};

export const ClassroomSidebar = React.memo(ClassroomSidebarComponent);
