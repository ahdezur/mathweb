'use client';

import React, { useRef, useState, useMemo, useCallback } from 'react';

interface GutterCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  className?: string;
  rows?: number;
}

interface FoldableLineInfo {
  lineIndex: number;
  type: string;
  title: string;
  isFolded: boolean;
  endLineIndex: number;
  hiddenCount: number;
  foldKey: string;
}

// Global in-memory storage for folded block contents to avoid injecting encoded code into text
const FOLDED_CONTENTS_CACHE: Record<string, string> = {};

export function GutterCodeEditor({
  value,
  onChange,
  placeholder = 'Escribe en LaTeX nativo o HTML...',
  textareaRef: externalRef,
  className = '',
  rows = 16
}: GutterCodeEditorProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      if (externalRef) {
        (externalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      }
    },
    [externalRef]
  );

  const lines = useMemo(() => (value || '').split('\n'), [value]);

  // Detect lines with \begin{...} that have matching \end{...}
  const foldableLinesMap = useMemo(() => {
    const map = new Map<number, FoldableLineInfo>();
    const stack: { type: string; title: string; lineIndex: number }[] = [];

    const envRegex = /\\begin\{(card|html|metodo|definicion|teorema|lema|corolario|propiedades|trampa|pregunta|ejercicio|aplicacion|demostracion|ejemplo|solucion|pauta)\}(?:\{([\s\S]*?)\})?/;
    const endRegex = /\\end\{(card|html|metodo|definicion|teorema|lema|corolario|propiedades|trampa|pregunta|ejercicio|aplicacion|demostracion|ejemplo|solucion|pauta)\}/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const beginMatch = line.match(envRegex);
      if (beginMatch) {
        const type = beginMatch[1];
        const title = beginMatch[2] || type.toUpperCase();
        stack.push({ type, title, lineIndex: i });
      }

      const endMatch = line.match(endRegex);
      if (endMatch && stack.length > 0) {
        const last = stack[stack.length - 1];
        if (last.type === endMatch[1]) {
          stack.pop();
          const lineSpan = i - last.lineIndex;
          if (lineSpan >= 1) {
            let isFolded = false;
            let foldKey = `env_${last.type}_${last.lineIndex}`;

            for (let k = last.lineIndex + 1; k < i; k++) {
              if (lines[k] && lines[k].includes('líneas ocultas')) {
                isFolded = true;
                const idMatch = lines[k].match(/ID:(env_\w+)/);
                if (idMatch) {
                  foldKey = idMatch[1];
                }
                break;
              }
            }

            map.set(last.lineIndex, {
              lineIndex: last.lineIndex,
              type: last.type,
              title: last.title,
              isFolded,
              endLineIndex: i,
              hiddenCount: lineSpan - 1,
              foldKey
            });
          }
        }
      }
    }

    return map;
  }, [lines]);

  // Synchronize scroll between textarea and line number gutter
  const handleScroll = () => {
    if (localRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = localRef.current.scrollTop;
    }
  };

  const toggleFoldAtLine = (lineIdx: number) => {
    const info = foldableLinesMap.get(lineIdx);
    if (!info) return;

    const currentLines = (value || '').split('\n');

    if (info.isFolded) {
      // Unfold: find comment line and restore from cache
      let foldCommentLineIdx = -1;
      let foundId = info.foldKey;

      for (let i = lineIdx + 1; i <= info.endLineIndex; i++) {
        if (currentLines[i] && currentLines[i].includes('líneas ocultas')) {
          foldCommentLineIdx = i;
          const idMatch = currentLines[i].match(/ID:(env_\w+)/);
          if (idMatch) {
            foundId = idMatch[1];
          }
          break;
        }
      }

      if (foldCommentLineIdx !== -1) {
        const restoredText = FOLDED_CONTENTS_CACHE[foundId];
        if (restoredText !== undefined) {
          const restoredLines = restoredText.split('\n');
          currentLines.splice(lineIdx + 1, foldCommentLineIdx - lineIdx, ...restoredLines);
          onChange(currentLines.join('\n'));
          return;
        }

        // Fallback if cache lost: check for encoded payload
        const commentLine = currentLines[foldCommentLineIdx];
        const matchData = commentLine.match(/PAYLOAD:(.*?)\] %/);
        if (matchData && matchData[1]) {
          try {
            const restored = decodeURIComponent(matchData[1]);
            const restoredLines = restored.split('\n');
            currentLines.splice(lineIdx + 1, foldCommentLineIdx - lineIdx, ...restoredLines);
            onChange(currentLines.join('\n'));
            return;
          } catch (e) {}
        }
      }
    } else {
      // Fold: extract inner lines, generate unique ID, save in cache, insert clean comment
      const innerLines = currentLines.slice(lineIdx + 1, info.endLineIndex);
      const innerText = innerLines.join('\n');
      const uniqueId = `env_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      FOLDED_CONTENTS_CACHE[uniqueId] = innerText;

      const foldPlaceholder = `  % [${innerLines.length} líneas ocultas | Clic en ▶ para desplegar | ID:${uniqueId}] %`;

      currentLines.splice(lineIdx + 1, innerLines.length, foldPlaceholder);
      onChange(currentLines.join('\n'));
    }
  };

  return (
    <div className={`relative flex bg-slate-50/70 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all ${className}`}>
      {/* Left Gutter: Line numbers & Fold Triangles JUNTO AL TEXTO */}
      <div
        ref={gutterRef}
        className="w-14 shrink-0 bg-slate-100/90 border-r border-slate-200/90 text-slate-400 select-none py-6 font-mono text-xs text-right space-y-0.5 overflow-hidden transition-colors h-full"
        style={{ paddingRight: '8px' }}
      >
        {lines.map((_, idx) => {
          const foldInfo = foldableLinesMap.get(idx);
          return (
            <div key={idx} className="h-[21px] flex items-center justify-end gap-1 font-mono text-[11px] leading-tight">
              {foldInfo ? (
                <button
                  type="button"
                  onClick={() => toggleFoldAtLine(idx)}
                  className={`w-4 h-4 rounded hover:bg-slate-200 flex items-center justify-center text-[10px] cursor-pointer transition-colors ${
                    foldInfo.isFolded ? 'text-amber-600 font-bold' : 'text-cyan-700 font-bold'
                  }`}
                  title={foldInfo.isFolded ? `Desplegar ${foldInfo.type}` : `Plegar ${foldInfo.type} (${foldInfo.hiddenCount} líneas)`}
                >
                  {foldInfo.isFolded ? '▶' : '▼'}
                </button>
              ) : (
                <span className="w-4 inline-block"></span>
              )}
              <span className="text-slate-400 text-[10px]">{idx + 1}</span>
            </div>
          );
        })}
      </div>

      {/* Main Textarea */}
      <textarea
        ref={setRefs}
        rows={rows}
        wrap="off"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className="flex-1 w-full h-full bg-transparent text-xs md:text-sm font-mono leading-[21px] text-slate-900 focus:outline-none resize-y py-6 px-4 overflow-x-auto custom-scrollbar"
        style={{ minHeight: `${rows * 21 + 48}px`, whiteSpace: 'pre' }}
        placeholder={placeholder}
      />
    </div>
  );
}
