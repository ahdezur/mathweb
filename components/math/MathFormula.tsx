'use client';

import React from 'react';
import katex from 'katex';

interface MathFormulaProps {
  latex: string;
  block?: boolean;
  className?: string;
}

// In-Memory KaTeX HTML Cache for maximum rendering performance & 0-ms re-renders
const katexHtmlCache = new Map<string, string>();

function sanitizeLaTeX(str: string): string {
  if (!str) return '';
  return str
    .replace(/\x0C/g, '\\f')
    .replace(/\x0D/g, '\\r')
    .replace(/\x09/g, '\\t')
    .replace(/\x08/g, '\\b')
    .replace(/\x0B/g, '\\v')
    // Restore unescaped control sequence corruptions
    .replace(/(?<!g)[\r\n]eq(?![a-zA-Z])/g, '\\neq ')
    .replace(/[\r\n]notin(?![a-zA-Z])/g, '\\notin ')
    .replace(/[\r\n]nabla(?![a-zA-Z])/g, '\\nabla ')
    .replace(/[\r\n]nu(?![a-zA-Z])/g, '\\nu ')
    .replace(/[\r\n]neg(?![a-zA-Z])/g, '\\neg ')
    .replace(/[\r\n]natural(?![a-zA-Z])/g, '\\natural ')
    .replace(/[\r\n]nleftrightarrow(?![a-zA-Z])/g, '\\nleftrightarrow ')

    // PROTECT valid \n LaTeX commands from being destroyed by \n replacement
    .replace(/\\(neq|notin|nabla|nu|neg|natural|nleftrightarrow)(?![a-zA-Z])/g, '___LATEX_$1___')
    .replace(/\\n/g, '\n')
    .replace(/___LATEX_(neq|notin|nabla|nu|neg|natural|nleftrightarrow)___/g, '\\$1 ')

    // Normalize double-escaped control sequences
    .replace(/\\\\(neq|geq|leq|notin|nabla|nu|neg|frac|sqrt|lim|sum|int|infty|alpha|beta|gamma|delta|epsilon|theta|pi|sigma|lambda|omega|mathbb|mathbf|mathcal|text|textbf|mathrm|left|right|begin|end)(?![a-zA-Z])/g, '\\$1');
}

const renderKatexCached = (latex: string, displayMode: boolean): string => {
  const cleanLatex = sanitizeLaTeX(latex);
  const cacheKey = `${displayMode ? 'block' : 'inline'}:${cleanLatex}`;
  if (katexHtmlCache.has(cacheKey)) {
    return katexHtmlCache.get(cacheKey)!;
  }
  try {
    const html = katex.renderToString(cleanLatex, {
      displayMode,
      throwOnError: false,
      output: 'html',
      strict: false,
      trust: true,
    });
    katexHtmlCache.set(cacheKey, html);
    return html;
  } catch (error) {
    console.error('Error rendering KaTeX:', error);
    return `<span>${cleanLatex}</span>`;
  }
};

const MathFormulaComponent: React.FC<MathFormulaProps> = ({ latex, block = false, className = '' }) => {
  const html = React.useMemo(() => {
    if (!latex) return '';
    return renderKatexCached(latex, block);
  }, [latex, block]);

  if (block) {
    return (
      <div
        className={`math-block text-center my-3 overflow-x-auto py-2 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`math-inline inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const MathFormula = React.memo(MathFormulaComponent);

interface MathTextProps {
  text: string;
  className?: string;
}

const MathTextComponent: React.FC<MathTextProps> = ({ text, className = '' }) => {
  const hasBlockMath = text ? text.includes('$$') : false;

  const renderedText = React.useMemo(() => {
    if (!text) return '';

    const cleanText = sanitizeLaTeX(text);
    const parts = cleanText.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\mathbb\{[^\}]+\}\^[0-3n]|\\varepsilon\s*-\s*\\delta)/g);

    return parts
      .map((part) => {
        if (!part) return '';

        if (part.startsWith('$$') && part.endsWith('$$')) {
          const latexExpr = part.slice(2, -2).trim();
          const katexHtml = renderKatexCached(latexExpr, true);
          return `<div class="math-block text-center my-3 overflow-x-auto py-2">${katexHtml}</div>`;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const latexExpr = part.slice(1, -1).trim();
          const katexHtml = renderKatexCached(latexExpr, false);
          return `<span class="inline-block px-0.5">${katexHtml}</span>`;
        } else if (part.startsWith('\\mathbb') || part.includes('\\varepsilon')) {
          const katexHtml = renderKatexCached(part.trim(), false);
          return `<span class="inline-block px-0.5">${katexHtml}</span>`;
        }

        return part
          .replace(/\\textit\{([^\}]+)\}/g, '<i>$1</i>')
          .replace(/\\emph\{([^\}]+)\}/g, '<i>$1</i>')
          .replace(/\\textbf\{([^\}]+)\}/g, '<b>$1</b>');
      })
      .join('');
  }, [text]);

  if (hasBlockMath) {
    return <div suppressHydrationWarning className={`block ${className}`} dangerouslySetInnerHTML={{ __html: renderedText }} />;
  }

  return <span suppressHydrationWarning className={className} dangerouslySetInnerHTML={{ __html: renderedText }} />;
};

export const MathText = React.memo(MathTextComponent);
