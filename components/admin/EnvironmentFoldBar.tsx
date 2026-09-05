'use client';

import React, { useState, useMemo } from 'react';

interface EnvironmentBlock {
  type: string;
  title: string;
  fullMatch: string;
  innerContent: string;
  startIndex: number;
  endIndex: number;
  lineCount: number;
  isFolded: boolean;
}

interface EnvironmentFoldBarProps {
  text: string;
  onChange: (newText: string) => void;
  className?: string;
}

export function EnvironmentFoldBar({ text, onChange, className = '' }: EnvironmentFoldBarProps) {
  const [foldedState, setFoldedState] = useState<Record<string, boolean>>({});

  // Detect all \begin{ENV} ... \end{ENV} blocks in text
  const detectedBlocks = useMemo(() => {
    if (!text) return [];
    const envRegex = /\\begin\{(html|metodo|definicion|teorema|lema|corolario|propiedades|trampa|pregunta|ejercicio|aplicacion)\}(?:\{([\s\S]*?)\})?([\s\S]*?)\\end\{\1\}/g;
    const blocks: EnvironmentBlock[] = [];
    let match: RegExpExecArray | null;

    while ((match = envRegex.exec(text)) !== null) {
      const type = match[1];
      const title = match[2] || type.toUpperCase();
      const innerContent = match[3] || '';
      const lines = innerContent.split('\n').length;
      const key = `${type}:${match.index}:${title}`;

      // Check if this block is currently in folded placeholder state in text
      const isFoldedInText = innerContent.trim().startsWith('% [PLEGADO:');

      blocks.push({
        type,
        title,
        fullMatch: match[0],
        innerContent,
        startIndex: match.index,
        endIndex: envRegex.lastIndex,
        lineCount: lines,
        isFolded: isFoldedInText || !!foldedState[key]
      });
    }

    return blocks;
  }, [text, foldedState]);

  if (detectedBlocks.length === 0) {
    return null;
  }

  const toggleFold = (block: EnvironmentBlock, blockIdx: number) => {
    const envRegex = /\\begin\{(html|metodo|definicion|teorema|lema|corolario|propiedades|trampa|pregunta|ejercicio|aplicacion)\}(?:\{([\s\S]*?)\})?([\s\S]*?)\\end\{\1\}/g;
    let matchIdx = 0;
    let newText = text.replace(envRegex, (fullMatch, type, titleArg, innerContent) => {
      if (matchIdx === blockIdx) {
        const titleStr = titleArg ? `{${titleArg}}` : '';
        if (block.isFolded) {
          // Unfold: restore from data attribute or comment if present
          const unfoldComment = innerContent.match(/% \[PLEGADO:[\s\S]*?DATA:(.*?)\] %/);
          if (unfoldComment && unfoldComment[1]) {
            try {
              const originalInner = decodeURIComponent(unfoldComment[1]);
              matchIdx++;
              return `\\begin{${type}}${titleStr}${originalInner}\\end{${type}}`;
            } catch (e) {}
          }
        } else {
          // Fold: replace inner content with compact 1-line fold placeholder
          const encoded = encodeURIComponent(innerContent);
          const lines = innerContent.split('\n').length;
          matchIdx++;
          return `\\begin{${type}}${titleStr}\n  % [PLEGADO: ${lines} líneas ocultas | DATA:${encoded}] %\n\\end{${type}}`;
        }
      }
      matchIdx++;
      return fullMatch;
    });

    const key = `${block.type}:${block.startIndex}:${block.title}`;
    setFoldedState((prev) => ({ ...prev, [key]: !block.isFolded }));
    onChange(newText);
  };

  const foldAll = () => {
    let matchIdx = 0;
    const envRegex = /\\begin\{(html|metodo|definicion|teorema|lema|corolario|propiedades|trampa|pregunta|ejercicio|aplicacion)\}(?:\{([\s\S]*?)\})?([\s\S]*?)\\end\{\1\}/g;
    const newText = text.replace(envRegex, (fullMatch, type, titleArg, innerContent) => {
      const titleStr = titleArg ? `{${titleArg}}` : '';
      if (!innerContent.includes('% [PLEGADO:')) {
        const encoded = encodeURIComponent(innerContent);
        const lines = innerContent.split('\n').length;
        matchIdx++;
        return `\\begin{${type}}${titleStr}\n  % [PLEGADO: ${lines} líneas ocultas | DATA:${encoded}] %\n\\end{${type}}`;
      }
      matchIdx++;
      return fullMatch;
    });
    onChange(newText);
  };

  const unfoldAll = () => {
    const envRegex = /\\begin\{(html|metodo|definicion|teorema|lema|corolario|propiedades|trampa|pregunta|ejercicio|aplicacion)\}(?:\{([\s\S]*?)\})?([\s\S]*?)\\end\{\1\}/g;
    const newText = text.replace(envRegex, (fullMatch, type, titleArg, innerContent) => {
      const titleStr = titleArg ? `{${titleArg}}` : '';
      const unfoldComment = innerContent.match(/% \[PLEGADO:[\s\S]*?DATA:(.*?)\] %/);
      if (unfoldComment && unfoldComment[1]) {
        try {
          const originalInner = decodeURIComponent(unfoldComment[1]);
          return `\\begin{${type}}${titleStr}${originalInner}\\end{${type}}`;
        } catch (e) {}
      }
      return fullMatch;
    });
    onChange(newText);
  };

  const hasAnyFolded = detectedBlocks.some((b) => b.isFolded);

  return (
    <div className={`bg-slate-100/90 border border-slate-200/90 rounded-xl p-3 space-y-2 text-xs font-sans ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-700 font-title">
          <i className="fa-solid fa-folder-tree text-cyan-600"></i>
          <span>Ambientes Detectados ({detectedBlocks.length}):</span>
          <span className="text-[11px] font-normal text-slate-500">Haz clic en el triángulo para desplegar o plegar el código</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={hasAnyFolded ? unfoldAll : foldAll}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <i className={`fa-solid ${hasAnyFolded ? 'fa-square-minus text-amber-600' : 'fa-square-plus text-cyan-600'}`}></i>
            <span>{hasAnyFolded ? 'Desplegar Todos' : 'Plegar Todos'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {detectedBlocks.map((block, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => toggleFold(block, idx)}
            className={`px-3 py-1.5 rounded-lg border font-mono text-[11px] flex items-center gap-2 transition-all cursor-pointer font-medium shadow-2xs ${
              block.isFolded
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
            title={block.isFolded ? 'Clic para desplegar el código completo' : 'Clic para plegar este ambiente'}
          >
            <span className="text-xs">{block.isFolded ? '▶' : '▼'}</span>
            <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-700 font-title">
              \{block.type}
            </span>
            <span className="max-w-[180px] truncate text-slate-700 font-sans">{block.title}</span>
            <span className="text-[10px] text-slate-400 font-sans">
              ({block.isFolded ? 'Oculto' : `${block.lineCount} líns`})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper to ensure all folded blocks are automatically unfolded before saving to server
 */
export function ensureUnfoldedContent(text: string): string {
  if (!text || (!text.includes('líneas ocultas]') && !text.includes('% [PLEGADO:'))) return text;
  const envRegex = /\\begin\{(html|metodo|definicion|teorema|lema|corolario|propiedades|trampa|pregunta|ejercicio|aplicacion)\}(?:\{([\s\S]*?)\})?([\s\S]*?)\\end\{\1\}/g;
  return text.replace(envRegex, (fullMatch, type, titleArg, innerContent) => {
    const titleStr = titleArg ? `{${titleArg}}` : '';
    const unfoldComment = innerContent.match(/% \[[\s\S]*?(?:PAYLOAD|DATA):(.*?)(?:\] %|\])/);
    if (unfoldComment && unfoldComment[1]) {
      try {
        const originalInner = decodeURIComponent(unfoldComment[1].trim());
        return `\\begin{${type}}${titleStr}${originalInner}\\end{${type}}`;
      } catch (e) {}
    }
    return fullMatch;
  });
}
