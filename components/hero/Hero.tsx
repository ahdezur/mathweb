'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MathCanvas = dynamic(() => import('./MathCanvas').then(m => m.MathCanvas), {
  ssr: false,
  loading: () => (
    <div className="hero-card" style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--accent)' }}></i>
    </div>
  )
});

interface HeroProps {
  onOpenCalculator: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenCalculator }) => {
  return (
    <header className="hero" id="home">
      <div className="container hero-grid">
        <div className="hero-content">
          <span className="hero-tag">
            <i className="fa-solid fa-graduation-cap"></i> Doctor en Ingeniería Matemática
          </span>
          <h1 className="hero-title">
            Domina las Matemáticas a Nivel <span>Universitario</span>
          </h1>
          <p className="hero-desc">
            Recursos avanzados e interactivos para Álgebra, Álgebra Lineal, Cálculo diferencial e integral, Ecuaciones Diferenciales Ordinarias. Aprende con un académico universitario con amplia experiencia pedagógica
          </p>
          <div className="hero-btns">
            <a href="#agenda" className="btn btn-primary">
              <i className="fa-regular fa-calendar-check"></i> Horarios de Consulta
            </a>
            <a href="#catalogo-cursos" className="btn btn-secondary">
              Explorar Cursos
            </a>
            <button
              type="button"
              className="btn btn-secondary"
              id="btn-calculadora"
              onClick={onOpenCalculator}
            >
              <i className="fa-solid fa-calculator"></i> Calculadora de notas
            </button>
          </div>
        </div>

        <div className="hero-graphic">
          <MathCanvas />
        </div>
      </div>
    </header>
  );
};
