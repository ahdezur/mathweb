'use client';

import React from 'react';
import Link from 'next/link';
import { MOCK_SUBJECTS } from '@/lib/mockData';
import { MathFormula } from '../math/MathFormula';

export const Asignaturas: React.FC = () => {
  return (
    <section id="materias">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Materias Académicas</span>
          <h2 className="section-title">¿Necesitas ayuda en estas asignaturas?</h2>
          <p className="section-subtitle">Explicaciones claras, desarrollo de guías de ejercicios, preparación para certámenes, pruebas y tutorías personalizadas a todo nivel.</p>
        </div>
        
        <div className="subjects-grid">
          {MOCK_SUBJECTS.map((subject) => (
            <Link key={subject.id} href={`/curso/${subject.slug}`} className="subject-card">
              <div className="subject-icon"><i className={subject.iconClass}></i></div>
              <h3 className="subject-title">
                {subject.title.includes('\\mathbb') ? (
                  <MathFormula latex={subject.title} />
                ) : (
                  subject.title
                )}
              </h3>
              <p className="subject-desc">
                {subject.description.includes('\\mathbb') ? (
                  <>
                    {subject.description.split('\\mathbb{R}^n')[0]}
                    <MathFormula latex="\mathbb{R}^n" />
                    {subject.description.split('\\mathbb{R}^n')[1]}
                  </>
                ) : (
                  subject.description
                )}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
