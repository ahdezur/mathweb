'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@/lib/mockData';
import { DataService } from '@/lib/dataService';
import { MathFormula, MathText } from '../math/MathFormula';

export const CourseCatalog: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      const data = await DataService.getCourses();
      setCourses(data);
      setLoading(false);
    }
    loadCourses();
  }, []);

  const getCourseIcon = (category?: string) => {
    switch (category) {
      case 'Álgebra Lineal':
        return 'fa-solid fa-border-all';
      case 'Multivariable':
        return 'fa-solid fa-layer-group';
      case 'Ecuaciones Diferenciales':
        return 'fa-solid fa-bezier-curve';
      case 'Topología':
        return 'fa-solid fa-diagram-project';
      default:
        return 'fa-solid fa-chart-line';
    }
  };

  return (
    <section id="catalogo-cursos" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag"><i className="fa-solid fa-graduation-cap"></i> Plataforma de Aprendizaje</span>
          <h2 className="section-title">Catálogo de Cursos Académicos</h2>
          <p className="section-subtitle">
            Cursos estructurados módulo a módulo con teoría rigorosa, guías paso a paso, ejercicios resueltos tipo control, pruebas y certámenes.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--accent)' }}>
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p style={{ marginTop: '12px', fontFamily: 'var(--font-title)', fontSize: '14px' }}>Cargando cursos desde la base de datos...</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/curso/${course.slug || 'fundamentos-calculo-diferencial'}`}
                className="course-card"
              >
                <div className="subject-icon">
                  <i className={getCourseIcon(course.category)}></i>
                </div>

                <h3 className="subject-title">
                  <MathText text={course.title} />
                </h3>

                <p className="subject-desc" style={{ marginBottom: '20px' }}>
                  <MathText text={course.description} />
                </p>

                {/* Math Formula Card Highlight */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius-sm)', padding: '14px', textAlign: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-title)', fontWeight: 600 }}>
                    Fórmula Clave del Curso:
                  </span>
                  <MathFormula latex={course.mathFormulaLatex} block />
                </div>

                {/* Syllabus chapters preview */}
                {course.chapters && course.chapters.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', display: 'block', marginBottom: '10px', fontFamily: 'var(--font-title)' }}>
                      Capítulos Destacados:
                    </span>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {course.chapters.slice(0, 4).map((chap, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <i className="fa-solid fa-circle-check" style={{ color: 'var(--accent)', fontSize: '12px', marginTop: '3px' }}></i>
                          <span><MathText text={chap} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', paddingTop: '16px', borderTop: '1px solid var(--border)', marginTop: 'auto', fontWeight: 500 }}>
                  <span><i className="fa-solid fa-layer-group" style={{ color: 'var(--accent)', marginRight: '6px' }}></i> {course.modulesCount || 4} Módulos</span>
                  <span><i className="fa-regular fa-clock" style={{ color: 'var(--accent)', marginRight: '6px' }}></i> {course.durationHours} hrs de contenido</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
