'use client';

import React, { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function sanitizeLaTeX(str: string): string {
  if (!str) return '';
  return str
    .replace(/\x0C/g, '\\f')
    .replace(/\x0D/g, '\\r')
    .replace(/\x09/g, '\\t')
    .replace(/\x08/g, '\\b')
    .replace(/\x0B/g, '\\v')
    .replace(/[\r\n]eq/g, '\\neq ')
    .replace(/[\r\n]notin/g, '\\notin ')
    .replace(/[\r\n]nabla/g, '\\nabla ')
    .replace(/[\r\n]nu/g, '\\nu ')
    .replace(/[\r\n]neg/g, '\\neg ')
    .replace(/\\n/g, '\n')
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1');
}

// Helper to render inline & display KaTeX safely
function renderKaTeX(text: string) {
  if (!text) return null;

  const cleanText = sanitizeLaTeX(text);
  const parts = cleanText.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2).trim();
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-3 block overflow-x-auto" />;
      } catch (e) {
        return <code key={index} className="text-rose-500">{part}</code>;
      }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1).trim();
      try {
        const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
      } catch (e) {
        return <code key={index} className="text-rose-500">{part}</code>;
      }
    }

    // Render plain text with multiline \n support
    const lines = part.split('\n');
    return (
      <React.Fragment key={index}>
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  });
}

// -----------------------------------------------------------------------------
// 1. Tarjeta Blanca Base (Contenedor Narrativo Nivel 2)
// -----------------------------------------------------------------------------
export interface WhiteBaseCardProps {
  children: React.ReactNode;
  className?: string;
  paddingRight?: string;
  style?: React.CSSProperties;
}

export function WhiteBaseCard({ children, className = '', paddingRight, style = {} }: WhiteBaseCardProps) {
  return (
    <div
      style={{
        marginTop: '10px',
        marginBottom: '10px',
        paddingTop: '52px',
        paddingBottom: '52px',
        paddingLeft: '60px',
        paddingRight: paddingRight || '60px',
        ...style,
      }}
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-lg transition-all duration-300 space-y-9 ${className}`}
    >
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 📌 2. Definición (Cian)
// -----------------------------------------------------------------------------
export interface DefinicionCardProps {
  title: string;
  content: string;
}

export function DefinicionCard({ title, content }: DefinicionCardProps) {
  return (
    <div
      style={{ marginTop: '36px', marginBottom: '36px', padding: '36px 40px' }}
      className="bg-cyan-50/70 dark:bg-cyan-950/30 border-l-4 border-cyan-500 dark:border-cyan-400 rounded-2xl shadow-sm space-y-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <h4 className="font-bold text-base md:text-lg text-cyan-900 dark:text-cyan-200 tracking-tight">
          📌 Definición: <span className="font-medium">{title}</span>
        </h4>
      </div>
      <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pl-1">
        {renderKaTeX(content)}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 🎖️ 3. Teorema / Lema / Corolario / Propiedades (Con Demostración Anidada Nivel 4)
// -----------------------------------------------------------------------------
export interface PropertyItem {
  title: string;
  content: string;
  demostration?: string;
}

export interface TheoreticalCardProps {
  type: 'teorema' | 'lema' | 'corolario' | 'propiedades';
  title: string;
  content: string;
  demostration?: string;
  properties?: PropertyItem[];
}

export function TheoreticalCard({ type, title, content, demostration, properties }: TheoreticalCardProps) {
  const [showDemo, setShowDemo] = useState(false);

  const config = {
    teorema: {
      badge: '🎖️ Teorema',
      bg: 'bg-indigo-50/70 dark:bg-indigo-950/30',
      border: 'border-indigo-500 dark:border-indigo-400',
      text: 'text-indigo-900 dark:text-indigo-200',
    },
    lema: {
      badge: '🛠️ Lema',
      bg: 'bg-purple-50/70 dark:bg-purple-950/30',
      border: 'border-purple-500 dark:border-purple-400',
      text: 'text-purple-900 dark:text-purple-200',
    },
    corolario: {
      badge: '💡 Corolario',
      bg: 'bg-amber-50/70 dark:bg-amber-950/30',
      border: 'border-amber-500 dark:border-amber-400',
      text: 'text-amber-900 dark:text-amber-200',
    },
    propiedades: {
      badge: '📋 Propiedades',
      bg: 'bg-blue-50/70 dark:bg-blue-950/30',
      border: 'border-blue-500 dark:border-blue-400',
      text: 'text-blue-900 dark:text-blue-200',
    },
  }[type];

  const hasPropertyDemos = properties && properties.some((p) => p.demostration);
  const hasDemos = !!demostration || hasPropertyDemos;

  return (
    <div
      style={{ marginTop: '36px', marginBottom: '36px', padding: '36px 40px' }}
      className={`${config.bg} border-l-4 ${config.border} rounded-2xl shadow-sm transition-all duration-300 space-y-4`}
    >
      <div className="flex items-center gap-3 mb-2">
        <h4 className={`font-bold text-base md:text-lg ${config.text} tracking-tight`}>
          {config.badge}: <span className="font-medium">{title}</span>
        </h4>
      </div>

      {content && content.trim().length > 0 && (
        <div
          style={{ marginBottom: '10px' }}
          className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pl-1"
        >
          {renderKaTeX(content)}
        </div>
      )}

      {/* Render structured properties if available */}
      {properties && properties.length > 0 && (
        <div className="space-y-3 mt-4">
          {properties.map((prop, idx) => (
            <div
              key={idx}
              className="bg-white/80 dark:bg-slate-900/80 border border-blue-200/80 dark:border-blue-900/60 rounded-xl p-4 shadow-xs transition-all"
            >
              <div className="font-semibold text-blue-950 dark:text-blue-200 text-sm md:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span>{prop.title}</span>
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pl-8">
                {renderKaTeX(prop.content)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unified Single Demonstration Button & Expanded Proof List */}
      {hasDemos && (
        <div
          style={{ marginTop: '16px', paddingTop: '12px' }}
          className="border-t border-slate-200/60 dark:border-slate-800"
        >
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all duration-200"
          >
            <i className="fa-solid fa-pen-nib"></i>
            <span>{showDemo ? 'Ocultar Demostraciones' : 'Ver Demostraciones'}</span>
            <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-300 ${showDemo ? 'rotate-180' : ''}`}></i>
          </button>

          {showDemo && (
            <div
              style={{ padding: '24px 28px', marginTop: '20px' }}
              className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed animate-fadeIn space-y-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-2 text-xs uppercase tracking-wider">
                <i className="fa-solid fa-pen-nib"></i> Demostración Formal (Q.E.D.)
              </div>

              {/* General Demonstration if present */}
              {demostration && (
                <div className="space-y-3">{renderKaTeX(demostration)}</div>
              )}

              {/* List of Individual Property Demonstrations */}
              {properties &&
                properties.map((prop, idx) => {
                  if (!prop.demostration) return null;
                  return (
                    <div
                      key={idx}
                      className="bg-white/90 dark:bg-slate-900/90 border border-emerald-300/70 dark:border-emerald-800/70 rounded-xl p-4 space-y-2"
                    >
                      <div className="font-bold text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <span>✒️ Demostración Propiedad {idx + 1}: {prop.title}</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        {renderKaTeX(prop.demostration)}
                      </div>
                    </div>
                  );
                })}

              <div className="text-right text-emerald-600 dark:text-emerald-400 font-bold text-base mt-2">■</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// ⚙️ 4. Método de Resolución (Vista Dividida en Paralelo Izquierda / Derecha)
// -----------------------------------------------------------------------------
export interface MetodoResolucionCardProps {
  title: string;
  steps: { step: number; title: string; description: string }[];
  fullExample?: string;
}

export function MetodoResolucionCard({ title, steps, fullExample }: MetodoResolucionCardProps) {
  const [splitView, setSplitView] = useState(false);

  const parsedExample = React.useMemo(() => {
    if (!fullExample) return { headers: [], map: new Map<number, string>(), footers: [] };

    const map = new Map<number, string>();
    const headers: string[] = [];
    const footers: string[] = [];

    const lines = fullExample.split(/\\n+|\n+/g);
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const match = trimmed.match(/^(?:Paso\s+(\d+)|Step\s+(\d+))[:\.]?\s*(.*)/i);
      if (match) {
        const num = parseInt(match[1] || match[2], 10);
        const content = match[3];
        map.set(num, content);
      } else if (trimmed.toLowerCase().startsWith('problema')) {
        headers.push(trimmed);
      } else if (trimmed.toLowerCase().startsWith('resultado')) {
        footers.push(trimmed);
      } else {
        headers.push(trimmed);
      }
    });

    return { headers, map, footers };
  }, [fullExample]);

  return (
    <div
      style={{ marginTop: '36px', marginBottom: '36px', padding: '36px 40px' }}
      className="bg-orange-50/70 dark:bg-orange-950/30 border-l-4 border-orange-500 dark:border-orange-400 rounded-2xl shadow-sm transition-all duration-300 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <h4 className="font-bold text-base md:text-lg text-orange-900 dark:text-orange-200 tracking-tight">
            ⚙️ Método de resolución: <span className="font-medium">{title}</span>
          </h4>
        </div>

        {fullExample && (
          <button
            onClick={() => setSplitView(!splitView)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 shadow-sm ${
              splitView
                ? 'bg-slate-700 hover:bg-slate-800 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            <i className={`fa-solid ${splitView ? 'fa-xmark' : 'fa-file-lines'}`}></i>
            <span>{splitView ? 'Ocultar Ejemplo' : 'Ver Ejemplo en Paralelo'}</span>
          </button>
        )}
      </div>

      {/* Si NO está en splitView: Mostrar columna única del algoritmo */}
      {!splitView && (
        <div className="flex flex-col gap-4">
          {steps.map((s) => (
            <div
              key={s.step}
              style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '20px', paddingBottom: '20px' }}
              className="bg-white dark:bg-slate-900 border-2 border-orange-200/90 dark:border-orange-900/60 rounded-2xl shadow-md hover:shadow-lg transition-all space-y-2.5"
            >
              <div className="font-bold text-sm md:text-base text-orange-950 dark:text-orange-100 flex items-center gap-2.5">
                <span className="w-5.5 h-5.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {s.step}
                </span>
                {s.title}
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pl-1">
                {renderKaTeX(s.description)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Si SI está en splitView: Mostrar filas espejo alineadas horizontalmente paso a paso */}
      {splitView && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Header del Problema si existe */}
          {parsedExample.headers.length > 0 && (
            <div
              style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '18px', paddingBottom: '18px' }}
              className="bg-orange-100/80 dark:bg-orange-950/70 border-2 border-orange-300/80 dark:border-orange-800 rounded-2xl shadow-xs text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed"
            >
              {renderKaTeX(parsedExample.headers.join('\n\n'))}
            </div>
          )}

          {/* Filas espejo alineadas horizontalmente paso a paso */}
          {steps.map((s) => {
            const exampleContent = parsedExample.map.get(s.step);
            return (
              <div key={s.step} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* Paso Teórico (Izquierda) */}
                <div
                  style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '20px', paddingBottom: '20px' }}
                  className="bg-white dark:bg-slate-900 border-2 border-orange-200/90 dark:border-orange-900/60 rounded-2xl shadow-md space-y-2.5 flex flex-col justify-start h-full"
                >
                  <div className="font-bold text-sm md:text-base text-orange-950 dark:text-orange-100 flex items-center gap-2.5">
                    <span className="w-5.5 h-5.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                      {s.step}
                    </span>
                    {s.title}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pl-1">
                    {renderKaTeX(s.description)}
                  </div>
                </div>

                {/* Paso Práctico Espejo Alineado (Derecha) */}
                <div
                  style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '20px', paddingBottom: '20px' }}
                  className="bg-white dark:bg-slate-900 border-2 border-orange-300 dark:border-orange-800 rounded-2xl shadow-md space-y-2.5 flex flex-col justify-start h-full"
                >
                  <div className="font-bold text-sm md:text-base text-orange-950 dark:text-orange-100 flex items-center gap-2.5">
                    <span className="w-5.5 h-5.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                      {s.step}
                    </span>
                    Paso {s.step}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pl-1">
                    {renderKaTeX(exampleContent || '')}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Footer del Resultado si existe */}
          {parsedExample.footers.length > 0 && (
            <div
              style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '18px', paddingBottom: '18px' }}
              className="bg-orange-100/80 dark:bg-orange-950/70 border-2 border-orange-300/80 dark:border-orange-800 rounded-2xl shadow-xs text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed"
            >
              {renderKaTeX(parsedExample.footers.join('\n\n'))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// ⚠️ 5. Trampa Cognitiva (Rojo)
// -----------------------------------------------------------------------------
export interface TrampaCognitivaCardProps {
  title?: string;
  errorDescription: string;
  correctApproach: string;
}

export function TrampaCognitivaCard({ title = 'Error Frecuente de Certamen', errorDescription, correctApproach }: TrampaCognitivaCardProps) {
  return (
    <div
      style={{ marginTop: '36px', marginBottom: '36px', padding: '36px 40px' }}
      className="bg-rose-50/70 dark:bg-rose-950/30 border-l-4 border-rose-500 dark:border-rose-400 rounded-2xl shadow-sm space-y-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <h4 className="font-bold text-base md:text-lg text-rose-950 dark:text-rose-200 tracking-tight">
          ⚠️ Trampa cognitiva: <span className="font-medium">{title}</span>
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm md:text-base">
        <div className="bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 rounded-xl p-5 text-rose-950 dark:text-rose-200">
          <div className="font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-xmark"></i> Error Común en Examen
          </div>
          <div>{renderKaTeX(errorDescription)}</div>
        </div>

        <div className="bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-5 text-emerald-950 dark:text-emerald-200">
          <div className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-check"></i> Corrección Rigurosa
          </div>
          <div>{renderKaTeX(correctApproach)}</div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 🧠 6. Pregunta Guía (Teal)
// -----------------------------------------------------------------------------
export interface PreguntaGuiaCardProps {
  question: string;
}

export function PreguntaGuiaCard({ question }: PreguntaGuiaCardProps) {
  return (
    <div
      style={{ marginTop: '36px', marginBottom: '36px', padding: '36px 40px' }}
      className="bg-teal-50/70 dark:bg-teal-950/30 border-l-4 border-teal-500 dark:border-teal-400 rounded-2xl shadow-sm space-y-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <h4 className="font-bold text-base md:text-lg text-teal-950 dark:text-teal-200 tracking-tight">
          🧠 Pregunta guía y reflexión
        </h4>
      </div>

      <div className="text-slate-800 dark:text-slate-200 font-medium text-sm md:text-base leading-relaxed pl-1">
        {renderKaTeX(question)}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 🔑 7. Ejercicio Clave (Púrpura con Solución Anidada Nivel 4)
// -----------------------------------------------------------------------------
export interface EjercicioClaveCardProps {
  title: string;
  problem: string;
  solucion: string;
}

export function EjercicioClaveCard({ title, problem, solucion }: EjercicioClaveCardProps) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div
      style={{ marginTop: '36px', marginBottom: '36px', padding: '36px 40px' }}
      className="bg-purple-50/70 dark:bg-purple-950/30 border-l-4 border-purple-600 dark:border-purple-400 rounded-2xl shadow-sm space-y-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <h4 className="font-bold text-base md:text-lg text-purple-950 dark:text-purple-200 tracking-tight">
          🔑 Ejercicio clave: <span className="font-medium">{title}</span>
        </h4>
      </div>

      <div
        style={{ marginBottom: '10px' }}
        className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed pl-1"
      >
        {renderKaTeX(problem)}
      </div>

      <div
        style={{ marginTop: '16px', paddingTop: '12px' }}
        className="border-t border-purple-200/60 dark:border-purple-900/50"
      >
        <button
          onClick={() => setShowSolution(!showSolution)}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all duration-200"
        >
          <i className="fa-solid fa-file-lines"></i>
          <span>{showSolution ? 'Ocultar Solución' : 'Ver Solución / Pauta'}</span>
          <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-300 ${showSolution ? 'rotate-180' : ''}`}></i>
        </button>

        {showSolution && (
          <div
            style={{ padding: '32px 36px', marginTop: '20px' }}
            className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed animate-fadeIn space-y-4 shadow-sm"
          >
            <div className="space-y-3">{renderKaTeX(solucion)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
