'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-logo-desc">
          <a href="#" className="logo">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" style={{ display: 'block' }}>
                <path d="M 4,16 L 7,16 L 10,26 L 13,4 L 28,4" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 15,25 L 20.5,14 L 26,25" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="17.5" y1="21.5" x2="23.5" y2="21.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/>
                <line x1="20.5" y1="11" x2="23" y2="7.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/>
              </svg>
            </div>
            Álvaro<span>Profemate</span>
          </a>
          <p>Comprometidos con el aprendizaje profundo de las matemáticas. Doctorado y experiencia pedagógica enfocada en el éxito académico de estudiantes universitarios e ingenieros.</p>
        </div>
        <div className="footer-nav">
          <div className="footer-links-col">
            <h4>Navegación</h4>
            <ul>
              <li><a href="#">Inicio</a></li>
              <li><a href="#catalogo-cursos">Cursos</a></li>
              <li><a href="#sobre-mi">Sobre Mí</a></li>
              <li><a href="#blog">Lecturas</a></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4>Contacto</h4>
            <ul>
              <li>contacto@alvaroprofemate.cl</li>
              <li><a href="#agenda">Agenda Virtual</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>&copy; 2026 Álvaro Hernández Profemate. Todos los derechos reservados. Plantilla Premium lista para Netlify.</p>
        <Link href="/admin/login" className="admin-portal-link">
          <i className="fa-solid fa-lock"></i> Portal Administrador
        </Link>
      </div>
    </footer>
  );
};
