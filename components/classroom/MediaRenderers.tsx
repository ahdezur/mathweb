'use client';

import React from 'react';

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title = 'Clase Grabada en Video' }) => {
  if (!videoUrl) return null;

  return (
    <div className="my-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3 flex items-center gap-2 font-title">
        <i className="fa-solid fa-circle-play"></i> {title}
      </h4>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black shadow-inner">
        <iframe
          src={videoUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

interface PdfViewerProps {
  pdfUrl?: string;
  title?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, title = 'Guía Teórica y Solucionario en PDF' }) => {
  if (!pdfUrl) return null;

  return (
    <div className="my-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2 font-title">
          <i className="fa-regular fa-file-pdf"></i> {title}
        </h4>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <i className="fa-solid fa-arrow-down-to-line"></i> Descargar PDF
        </a>
      </div>
      <div className="w-full h-96 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-full"
        >
          <p className="text-xs text-slate-500 p-6 text-center">
            Tu navegador no soporta la previsualización directa de PDF.{' '}
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline font-bold">
              Haz clic aquí para abrir el documento PDF.
            </a>
          </p>
        </object>
      </div>
    </div>
  );
};
