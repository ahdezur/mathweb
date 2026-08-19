'use client';

import React, { useState, useEffect, useRef } from 'react';

export const MathCanvas: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [currentState, setCurrentState] = useState<number>(0); // 0: Derivada, 1: Integral, 2: Trig
  const [tDerivada, setTDerivada] = useState(0);
  const [tTrig, setTTrig] = useState(0);
  const [integN, setIntegN] = useState(4);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cycle states automatically every 7 seconds
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCurrentState(prev => (prev + 1) % 3);
        setOpacity(1);
      }, 300);
    }, 7000);
    return () => clearInterval(timer);
  }, [mounted]);

  // Animation Loop for frame updates
  useEffect(() => {
    if (!mounted) return;
    const anim = setInterval(() => {
      setTDerivada(prev => prev + 0.025);
      setTTrig(prev => prev + 0.025);
    }, 30);
    return () => clearInterval(anim);
  }, [mounted]);

  // Riemann Bars partition cycle every 1.2s
  useEffect(() => {
    if (!mounted) return;
    const particiones = [4, 8, 12, 16, 24, 32, 48, 64];
    let idx = 0;
    const rTimer = setInterval(() => {
      idx = (idx + 1) % particiones.length;
      setIntegN(particiones[idx]);
    }, 1200);
    return () => clearInterval(rTimer);
  }, [mounted]);

  // 1. DERIVADA CALCULATIONS
  function f_derivada(x: number) {
    return 125 - 0.4 * (x - 30) - 20 * Math.sin((x - 30) / 45);
  }

  let d_deriv = 'M 30 ' + f_derivada(30);
  for (let x = 31; x <= 270; x++) {
    d_deriv += ' L ' + x + ' ' + f_derivada(x);
  }

  const x_p = 120;
  const y_p = f_derivada(x_p);
  const h_inf = 0.01;
  const m_tangente = (f_derivada(x_p + h_inf) - y_p) / h_inf;

  let h = 80 + 75 * Math.sin(tDerivada - Math.PI / 2);
  if (Math.abs(h) < 2) h = h < 0 ? -2 : 2;
  let x_q = x_p + h;
  if (x_q < 30) x_q = 30;
  if (x_q > 270) x_q = 270;
  let y_q = f_derivada(x_q);
  const m_secante = (y_q - y_p) / (x_q - x_p);

  // 2. INTEGRAL CALCULATIONS
  function f_integral(x: number) {
    return 110 - 25 * Math.sin((x - 40) / 30) - 15 * Math.cos((x - 40) / 60);
  }

  let d_integ = 'M 30 ' + f_integral(30);
  for (let x = 31; x <= 270; x++) {
    d_integ += ' L ' + x + ' ' + f_integral(x);
  }

  const a_integ = 60;
  const b_integ = 240;
  const widthBars = (b_integ - a_integ) / integN;
  let sumaAreas = 0;
  let areaReal = 0;
  const pasosFinisimos = 1000;
  const dx_finito = (b_integ - a_integ) / pasosFinisimos;
  for (let i = 0; i < pasosFinisimos; i++) {
    areaReal += (130 - f_integral(a_integ + i * dx_finito)) * dx_finito;
  }
  for (let i = 0; i < integN; i++) {
    const rx = a_integ + i * widthBars;
    const ry = f_integral(rx);
    sumaAreas += Math.max(0, 130 - ry) * widthBars;
  }
  const errorPct = Math.abs((sumaAreas - areaReal) / areaReal) * 100;

  // 3. TRIGONOMETRY CALCULATIONS
  const R = 35;
  const cx_c = 65;
  const cy_c = 75;
  const px_trig = cx_c + R * Math.cos(tTrig);
  const py_trig = cy_c - R * Math.sin(tTrig);

  let d_wave = '';
  const start_x = 130;
  const end_x = 290;
  for (let x = start_x; x <= end_x; x++) {
    const fase_wave = tTrig - (x - start_x) * 0.05;
    const wave_y = cy_c - R * Math.sin(fase_wave);
    if (x === start_x) d_wave += `M ${x} ${wave_y}`;
    else d_wave += ` L ${x} ${wave_y}`;
  }
  const degTrig = Math.round((tTrig * 180 / Math.PI) % 360);

  const switchState = (index: number) => {
    setOpacity(0);
    setTimeout(() => {
      setCurrentState(index);
      setOpacity(1);
    }, 200);
  };

  return (
    <div className="hero-card" onClick={() => switchState((currentState + 1) % 3)} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span id="hero-anim-title" style={{ fontFamily: 'var(--font-title)', fontSize: '14px', color: 'var(--accent)', fontWeight: 600, opacity, transition: 'opacity 0.3s' }}>
          {currentState === 0 && <><i className="fa-solid fa-chart-line"></i> Derivadas: Recta Tangente</>}
          {currentState === 1 && <><i className="fa-solid fa-calculator"></i> Integrales: Sumas de Riemann</>}
          {currentState === 2 && <><i className="fa-solid fa-wave-square"></i> Trigonometría: Onda Senoidal</>}
        </span>
        <span id="hero-anim-eq" style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', opacity, transition: 'opacity 0.3s' }}>
          {currentState === 0 && 'dy/dx = lim Δy/Δx'}
          {currentState === 1 && `n = ${integN} barras`}
          {currentState === 2 && `θ = ${degTrig}° | sin θ = ${(Math.sin(tTrig)).toFixed(2)}`}
        </span>
      </div>

      <div className="hero-math-visual">
        {/* SVG 1: DERIVADA */}
        <svg id="svg-derivada" className={`hero-svg ${currentState === 0 ? 'active' : ''}`} viewBox="0 0 300 150">
          <defs>
            <pattern id="grid-a" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(128, 128, 128, 0.08)" strokeWidth="1"/>
            </pattern>
            <linearGradient id="grad-derivada" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-a)" />
          <line x1="20" y1="130" x2="280" y2="130" stroke="var(--border)" strokeWidth="1.5"/>
          <line x1="30" y1="15" x2="30" y2="140" stroke="var(--border)" strokeWidth="1.5"/>

          <path d={d_deriv} fill="none" stroke="url(#grad-derivada)" strokeWidth="3" />
          <path d={`M ${x_p} ${y_p} L ${x_q} ${y_p} L ${x_q} ${y_q}`} fill="none" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1.5" strokeDasharray="3,3" />

          <line x1="30" y1={y_p + m_secante * (30 - x_p)} x2="270" y2={y_p + m_secante * (270 - x_p)} stroke="rgba(239, 68, 68, 0.7)" strokeWidth="1.5" />
          <line x1="50" y1={y_p + m_tangente * (50 - x_p)} x2="210" y2={y_p + m_tangente * (210 - x_p)} stroke="#10b981" strokeWidth="2" opacity="0.8" />

          <circle cx={x_p} cy={y_p} r="5" fill="#6366f1" />
          <circle cx={x_q} cy={y_q} r="5" fill="#06b6d4" />

          <text x={x_p + h/2} y={y_p + (h > 0 ? 12 : -6)} fill="var(--text-muted)" fontSize="8" fontFamily="monospace" textAnchor="middle">
            Δx={Math.abs(h).toFixed(0)}
          </text>
          <text x={x_q + (h > 0 ? 6 : -35)} y={y_p + (y_q - y_p)/2} fill="var(--text-muted)" fontSize="8" fontFamily="monospace">
            Δy={Math.abs(y_q - y_p).toFixed(0)}
          </text>

          <text x="125" y="110" fill="#6366f1" fontSize="9" fontFamily="sans-serif" fontWeight="bold">P</text>
          <text x={x_q + 8} y={y_q - 5} fill="#06b6d4" fontSize="9" fontFamily="sans-serif" fontWeight="bold">Q</text>
        </svg>

        {/* SVG 2: INTEGRAL */}
        <svg id="svg-integral" className={`hero-svg ${currentState === 1 ? 'active' : ''}`} viewBox="0 0 300 150">
          <defs>
            <pattern id="grid-b" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(128, 128, 128, 0.08)" strokeWidth="1"/>
            </pattern>
            <linearGradient id="grad-rect" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.3)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 0.05)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-b)" />
          <line x1="20" y1="130" x2="280" y2="130" stroke="var(--border)" strokeWidth="1.5"/>
          <line x1="30" y1="15" x2="30" y2="140" stroke="var(--border)" strokeWidth="1.5"/>

          <g>
            {Array.from({ length: integN }).map((_, i) => {
              const rx = a_integ + i * widthBars;
              const ry = f_integral(rx);
              const rh = Math.max(0, 130 - ry);
              return (
                <rect
                  key={i}
                  x={rx}
                  y={ry}
                  width={widthBars - 0.5}
                  height={rh}
                  fill="url(#grad-rect)"
                  stroke="rgba(6, 182, 212, 0.4)"
                  strokeWidth="0.5"
                />
              );
            })}
          </g>
          <path d={d_integ} fill="none" stroke="url(#grad-derivada)" strokeWidth="3" />

          <text x="40" y="30" fill="var(--text-primary)" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
            Partición: n = {integN} barras
          </text>
          <text x="40" y="45" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">
            Error de área: {errorPct.toFixed(2)}%
          </text>
        </svg>

        {/* SVG 3: TRIGONOMETRÍA */}
        <svg id="svg-trig" className={`hero-svg ${currentState === 2 ? 'active' : ''}`} viewBox="0 0 300 150">
          <defs>
            <pattern id="grid-c" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(128, 128, 128, 0.08)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-c)" />
          <line x1="15" y1="75" x2="115" y2="75" stroke="var(--border)" strokeWidth="1" />
          <line x1="65" y1="25" x2="65" y2="125" stroke="var(--border)" strokeWidth="1" />
          <circle cx="65" cy="75" r="35" fill="none" stroke="var(--border)" strokeWidth="1.5" />

          <line x1="130" y1="75" x2="290" y2="75" stroke="var(--border)" strokeWidth="1.5" />
          <line x1="130" y1="20" x2="130" y2="130" stroke="var(--border)" strokeWidth="1" />

          <line x1={px_trig} y1={py_trig} x2="130" y2={py_trig} stroke="rgba(6, 182, 212, 0.6)" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="65" y1="75" x2={px_trig} y2={py_trig} stroke="#6366f1" strokeWidth="2.5" />
          <circle cx={px_trig} cy={py_trig} r="4" fill="#6366f1" />

          <line x1="65" y1="75" x2={px_trig} y2="75" stroke="#ef4444" strokeWidth="2" />
          <line x1={px_trig} y1="75" x2={px_trig} y2={py_trig} stroke="#06b6d4" strokeWidth="2" />

          <path d={d_wave} fill="none" stroke="url(#grad-derivada)" strokeWidth="3" />
          <circle cx="130" cy={py_trig} r="4" fill="#06b6d4" />
          <text x="140" y="30" fill="var(--text-primary)" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
            θ = {degTrig}° | sin θ = {(Math.sin(tTrig)).toFixed(2)}
          </text>
        </svg>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', minHeight: '38px' }}>
        <p id="hero-anim-desc" style={{ opacity, transition: 'opacity 0.3s' }}>
          {currentState === 0 && 'La pendiente de la recta secante converge a la tangente a medida que el incremento se reduce a cero.'}
          {currentState === 1 && 'La suma de las áreas de los n rectángulos de Riemann aproxima el área exacta bajo la curva.'}
          {currentState === 2 && 'La proyección vertical del vector rotatorio genera la curva armónica de la función seno.'}
        </p>
      </div>
    </div>
  );
};
