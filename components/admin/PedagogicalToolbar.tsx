'use client';

import React from 'react';

interface PedagogicalToolbarProps {
  onInsertSnippet: (snippet: string) => void;
}

export function PedagogicalToolbar({ onInsertSnippet }: PedagogicalToolbarProps) {
  const snippets = [
    {
      id: 'card',
      label: '+ Tarjeta Base',
      icon: 'fa-cube',
      color: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
      snippet: `\\begin{card}\nTexto...\n\\end{card}`
    },
    {
      id: 'formula',
      label: '+ Fórmula Destacada',
      icon: 'fa-calculator',
      color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
      snippet: `$$\nFórmula...\n$$`
    },
    {
      id: 'definicion',
      label: '+ Definición',
      icon: 'fa-thumbtack',
      color: 'bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200',
      snippet: `\\begin{definicion}{Título}\nTexto...\n\\end{definicion}`
    },
    {
      id: 'teorema',
      label: '+ Teorema',
      icon: 'fa-award',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200',
      snippet: `\\begin{teorema}{Título}\nEnunciado...\n\n\\demostracion{Demostración...}\n\\end{teorema}`
    },
    {
      id: 'lema',
      label: '+ Lema',
      icon: 'fa-wrench',
      color: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
      snippet: `\\begin{lema}{Título}\nEnunciado...\n\n\\demostracion{Demostración...}\n\\end{lema}`
    },
    {
      id: 'corolario',
      label: '+ Corolario',
      icon: 'fa-lightbulb',
      color: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
      snippet: `\\begin{corolario}{Título}\nEnunciado...\n\n\\demostracion{Demostración...}\n\\end{corolario}`
    },
    {
      id: 'propiedades',
      label: '+ Propiedades',
      icon: 'fa-list-check',
      color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
      snippet: `\\begin{propiedades}{Título de Propiedades}\n\n\\propiedad{Propiedad 1}{Fórmula o descripción...}\n\\demostracionPropiedad{Propiedad 1}{Demostración de propiedad 1...}\n\n\\propiedad{Propiedad 2}{Fórmula o descripción...}\n\\demostracionPropiedad{Propiedad 2}{Demostración de propiedad 2...}\n\n\\end{propiedades}`
    },
    {
      id: 'metodo',
      label: '+ Método de Resolución',
      icon: 'fa-gears',
      color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
      snippet: `\\begin{metodo}{Título}\n\n\\problema{Enunciado...}\n\n\\paso{1}{Título del Paso 1}\nDescripción...\n\\ejemplo{Cálculo...}\n\n\\end{metodo}`
    },
    {
      id: 'trampa',
      label: '+ Trampa Cognitiva',
      icon: 'fa-triangle-exclamation',
      color: 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200',
      snippet: `\\begin{trampa}{Título}\n\\error{Error...}\n\\correct{Forma correcta...}\n\\end{trampa}`
    },
    {
      id: 'pregunta',
      label: '+ Pregunta Guía',
      icon: 'fa-brain',
      color: 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200',
      snippet: `\\begin{pregunta}\nPregunta...\n\\end{pregunta}`
    },
    {
      id: 'ejercicio',
      label: '+ Ejercicio Clave',
      icon: 'fa-key',
      color: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
      snippet: `\\begin{ejercicio}{Título}\nEnunciado...\n\n\\solucion{Solución...}\n\\end{ejercicio}`
    },
    {
      id: 'aplicacion',
      label: '+ Aplicación Ingeniería',
      icon: 'fa-lightbulb',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200',
      snippet: `\\begin{aplicacion}{Título}\nTexto...\n\\end{aplicacion}`
    }
  ];

  return (
    <div className="bg-slate-100/90 border border-slate-200/90 rounded-2xl p-5 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-title flex items-center gap-1.5">
          <i className="fa-solid fa-wand-magic-sparkles text-cyan-600"></i> Botonera Pedagógica (1-Clic Inserción LaTeX)
        </span>
        <span className="text-[10px] text-slate-400 font-medium">Haz clic para insertar la plantilla nativa</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {snippets.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onInsertSnippet(item.snippet)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs font-title ${item.color}`}
            title={`Insertar plantilla de ${item.label}`}
          >
            <i className={`fa-solid ${item.icon} text-[11px]`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
