'use client';

import React from 'react';

export const AboutMe: React.FC = () => {
  return (
    <section id="sobre-mi" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container about-grid">
        <div className="about-details">
          <span className="section-tag">Sobre Mí</span>
          <h2 className="section-title">Álvaro Hernández, PhD</h2>
          <p>
            Docente universitario apasionado por la enseñanza y el aprendizaje efectivo de las matemáticas. Mi enfoque pedagógico se centra en construir intuición, reducir la abstracción innecesaria y guiar al estudiante de manera estructurada hacia la resolución autónoma de problemas complejos.
          </p>
          <p>
            <strong>Innovador en metodologías de enseñanza</strong>, dedicado al diseño de entornos interactivos y dinámicos para el aprendizaje. He liderado múltiples proyectos de innovación docente orientados a transformar la enseñanza tradicional del cálculo y el álgebra, integrando herramientas virtuales que facilitan el autoaprendizaje y construyen una sólida base conceptual a nivel de pregrado universitario.
          </p>
          <p>
            De trato amable, perseverante y profundamente comprometido con el desarrollo académico de mis estudiantes, adaptando las explicaciones al ritmo y necesidades individuales.
          </p>

          <div className="degree-box">
            <div className="degree-title">
              <i className="fa-solid fa-award"></i> Grado Académico Principal
            </div>
            <p className="degree-desc">
              <strong>Doctor en Ciencias de la Ingeniería con Mención en Modelación Matemática</strong>
              <br />
              Facultad de Ciencias Físicas y Matemáticas, Universidad de Chile.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius-md)', padding: '30px', position: 'relative' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--accent)' }}>
              <i className="fa-solid fa-lightbulb"></i> Innovación y Docencia
            </h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li>Líder en proyectos de innovación metodológica y docente universitaria.</li>
              <li>Creador de recursos y material docente de apoyo, con foco en el desarrollo autónomo de guías y talleres prácticos paso a paso.</li>
              <li>Diseño de entornos virtuales de aprendizaje y herramientas de auto-aprendizaje guiado.</li>
            </ul>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius-md)', padding: '30px', position: 'relative' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--primary)' }}>
              <i className="fa-solid fa-chalkboard-user"></i> Experiencia Docente
            </h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li>Cátedras universitarias en carreras de Ingeniería, Ciencias y Pedagogía.</li>
              <li>Más de 10 años resolviendo consultas y guiando a estudiantes en ramos de alta exigencia.</li>
              <li>Creador de guías, talleres de nivelación y material de estudio interactivo.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
