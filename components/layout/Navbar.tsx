'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('#');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeTheme = (theme: 'default' | 'dark' | 'emerald' | 'charcoal' | 'cosmic') => {
    document.body.className = '';
    if (theme !== 'default') {
      document.body.classList.add(`theme-${theme}`);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
      <Link href="#" className="logo">
        <div className="logo-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" style={{ display: 'block' }}>
            <path d="M 4,16 L 7,16 L 10,26 L 13,4 L 28,4" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 15,25 L 20.5,14 L 26,25" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="17.5" y1="21.5" x2="23.5" y2="21.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="20.5" y1="11" x2="23" y2="7.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/>
          </svg>
        </div>
        Álvaro<span>Profemate</span>
      </Link>

      <ul className={`nav-menu ${menuOpen ? 'active' : ''}`} id="nav-menu">
        <li>
          <a
            href="#"
            className={`nav-link ${activeLink === '#' ? 'active' : ''}`}
            onClick={() => { setActiveLink('#'); setMenuOpen(false); }}
          >
            Inicio
          </a>
        </li>

        <li>
          <a
            href="#catalogo-cursos"
            className={`nav-link ${activeLink === '#catalogo-cursos' ? 'active' : ''}`}
            onClick={() => { setActiveLink('#catalogo-cursos'); setMenuOpen(false); }}
          >
            Cursos
          </a>
        </li>
        <li>
          <a
            href="#sobre-mi"
            className={`nav-link ${activeLink === '#sobre-mi' ? 'active' : ''}`}
            onClick={() => { setActiveLink('#sobre-mi'); setMenuOpen(false); }}
          >
            Sobre Mí
          </a>
        </li>
        <li>
          <a
            href="#blog"
            className={`nav-link ${activeLink === '#blog' ? 'active' : ''}`}
            onClick={() => { setActiveLink('#blog'); setMenuOpen(false); }}
          >
            Lecturas
          </a>
        </li>
        <li>
          <a
            href="#agenda"
            className={`nav-link ${activeLink === '#agenda' ? 'active' : ''}`}
            onClick={() => { setActiveLink('#agenda'); setMenuOpen(false); }}
          >
            Agenda
          </a>
        </li>
        <li>
          <a
            href="#contacto"
            className={`nav-link ${activeLink === '#contacto' ? 'active' : ''}`}
            onClick={() => { setActiveLink('#contacto'); setMenuOpen(false); }}
          >
            Contacto
          </a>
        </li>

        <li className="theme-selector" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '30px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7, color: 'var(--text-muted)' }}>Tema:</span>
          <div className="theme-dot" style={{ background: '#f8fafc', border: '1px solid #4f46e5', width: '14px', height: '14px', borderRadius: '50%', cursor: 'pointer' }} title="Claro Académico (Defecto)" onClick={() => changeTheme('default')} />
          <div className="theme-dot" style={{ background: '#090d16', border: '1px solid #06b6d4', width: '14px', height: '14px', borderRadius: '50%', cursor: 'pointer' }} title="Oscuro Tech" onClick={() => changeTheme('dark')} />
          <div className="theme-dot" style={{ background: '#030706', border: '1px solid #10b981', width: '14px', height: '14px', borderRadius: '50%', cursor: 'pointer' }} title="Esmeralda Tech" onClick={() => changeTheme('emerald')} />
          <div className="theme-dot" style={{ background: '#0a0a0a', border: '1px solid #f59e0b', width: '14px', height: '14px', borderRadius: '50%', cursor: 'pointer' }} title="Carbón & Oro" onClick={() => changeTheme('charcoal')} />
          <div className="theme-dot" style={{ background: '#070512', border: '1px solid #d946ef', width: '14px', height: '14px', borderRadius: '50%', cursor: 'pointer' }} title="Violeta Cósmico" onClick={() => changeTheme('cosmic')} />
        </li>
      </ul>

      <div className="menu-toggle" id="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
      </div>
    </nav>
  );
};
