'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MathText } from '@/components/math/MathFormula';

interface HTMLSandboxCardProps {
  title?: string;
  htmlContent: string;
}

export function HTMLSandboxCard({ title, htmlContent }: HTMLSandboxCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(420);

  let fullDoc = htmlContent.trim();
  const lowerDoc = fullDoc.toLowerCase();

  // If full document HTML is not provided, wrap it into a clean HTML5 template with KaTeX preloaded
  if (!lowerDoc.includes('<!doctype html>') && !lowerDoc.includes('<html')) {
    fullDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="if(window.renderMathInElement) renderMathInElement(document.body);"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: transparent;
      color: #1e293b;
    }
    canvas { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${fullDoc}
</body>
</html>`;
  }

  useEffect(() => {
    const handleIframeLoad = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          const doc = iframeRef.current.contentWindow.document;
          const bodyHeight = doc.body.scrollHeight;
          const htmlHeight = doc.documentElement.scrollHeight;
          const calculated = Math.max(bodyHeight, htmlHeight);
          if (calculated && calculated > 100) {
            setIframeHeight(Math.max(calculated + 25, 250));
          }
        } catch (e) {
          // Fallback height on cross-origin restrictions
        }
      }
    };

    const timer = setTimeout(() => {
      handleIframeLoad();
    }, 500);

    return () => clearTimeout(timer);
  }, [htmlContent]);

  return (
    <div className="my-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-xs overflow-hidden space-y-4">
      {title && (
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <i className="fa-solid fa-code"></i>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base font-title">
            <MathText text={title} />
          </h4>
        </div>
      )}

      <div className="w-full flex justify-center items-center overflow-x-auto rounded-xl bg-slate-50/70 dark:bg-slate-950/70 p-2 border border-slate-100 dark:border-slate-800/80">
        <iframe
          ref={iframeRef}
          srcDoc={fullDoc}
          title={title || 'Lienzo HTML Interactivo'}
          style={{ height: `${iframeHeight}px` }}
          className="w-full max-w-[820px] border-0 transition-all duration-300 rounded-xl"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
