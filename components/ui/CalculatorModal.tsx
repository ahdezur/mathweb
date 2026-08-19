'use client';

import React, { useState } from 'react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [activeCalc, setActiveCalc] = useState<'selector' | 'puntaje' | 'aprobacion'>('selector');

  // Calculator 1 state
  const [maxScore, setMaxScore] = useState<number>(100);
  const [score, setScore] = useState<number>(75);
  const [exigency, setExigency] = useState<number>(60);

  // Calculator 2 state
  const [c1, setC1] = useState<number>(3.5);
  const [w1, setW1] = useState<number>(30);
  const [c2, setC2] = useState<number>(4.2);
  const [w2, setW2] = useState<number>(30);
  const [w3, setW3] = useState<number>(40);
  const [targetGrade, setTargetGrade] = useState<number>(4.0);

  if (!isOpen) return null;

  // Grade calculation
  const cutScore = maxScore * (exigency / 100);
  let finalGrade = 1.0;
  if (score < cutScore) {
    finalGrade = 1.0 + 3.0 * (score / cutScore);
  } else {
    finalGrade = 4.0 + 3.0 * ((score - cutScore) / (maxScore - cutScore));
  }
  if (isNaN(finalGrade)) finalGrade = 1.0;
  finalGrade = Math.min(Math.max(finalGrade, 1.0), 7.0);

  const currentAccum = (c1 * (w1 / 100)) + (c2 * (w2 / 100));
  const neededScore = (targetGrade - currentAccum) / (w3 / 100);

  return (
    <div id="calc-modal" className={`modal ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" id="calc-modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        {activeCalc === 'selector' && (
          <div className="modal-body" style={{ padding: '40px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', fontFamily: 'var(--font-title)', fontSize: '26px', color: 'var(--text-primary)' }}>
              ¿Qué deseas calcular hoy?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>
              Selecciona la herramienta académica que necesitas utilizar en este momento:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div
                className="subject-card"
                style={{ textAlign: 'center', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderColor: 'var(--border)' }}
                onClick={() => setActiveCalc('puntaje')}
              >
                <div className="subject-icon" style={{ marginBottom: '15px' }}><i className="fa-solid fa-table-list"></i></div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>Nota por Puntaje</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Obtén tu calificación a partir del puntaje máximo, obtenido y porcentaje de exigencia.</p>
              </div>

              <div
                className="subject-card"
                style={{ textAlign: 'center', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderColor: 'var(--border)' }}
                onClick={() => setActiveCalc('aprobacion')}
              >
                <div className="subject-icon" style={{ marginBottom: '15px', color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)' }}><i className="fa-solid fa-graduation-cap"></i></div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>Aprobar Asignatura</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Calcula la nota que necesitas obtener en tus próximas pruebas para aprobar la materia.</p>
              </div>
            </div>
          </div>
        )}

        {activeCalc === 'puntaje' && (
          <div className="modal-body" style={{ padding: '40px' }}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginBottom: '15px', fontSize: '14px', fontFamily: 'var(--font-title)' }}
              onClick={() => setActiveCalc('selector')}
            >
              <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i> Volver a opciones
            </button>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text-primary)' }}>Calculadora de Nota por Puntaje</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">Puntaje Máx.</label>
                <input type="number" className="form-control" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
              </div>
              <div>
                <label className="form-label">Puntaje Obtenido</label>
                <input type="number" className="form-control" value={score} onChange={(e) => setScore(Number(e.target.value))} />
              </div>
              <div>
                <label className="form-label">Exigencia (%)</label>
                <input type="number" className="form-control" value={exigency} onChange={(e) => setExigency(Number(e.target.value))} />
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--border-radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Nota Final Estimada</span>
              <div style={{ fontSize: '42px', fontWeight: 800, color: finalGrade >= 4.0 ? 'var(--accent)' : '#ef4444', margin: '5px 0' }}>
                {finalGrade.toFixed(1)}
              </div>
            </div>
          </div>
        )}

        {activeCalc === 'aprobacion' && (
          <div className="modal-body" style={{ padding: '40px' }}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginBottom: '15px', fontSize: '14px', fontFamily: 'var(--font-title)' }}
              onClick={() => setActiveCalc('selector')}
            >
              <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i> Volver a opciones
            </button>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text-primary)' }}>Calculadora de Nota para Aprobar</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">Certamen 1 / Ponderación %</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" step="0.1" className="form-control" value={c1} onChange={(e) => setC1(Number(e.target.value))} />
                  <input type="number" className="form-control" style={{ width: '70px' }} value={w1} onChange={(e) => setW1(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="form-label">Certamen 2 / Ponderación %</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" step="0.1" className="form-control" value={c2} onChange={(e) => setC2(Number(e.target.value))} />
                  <input type="number" className="form-control" style={{ width: '70px' }} value={w2} onChange={(e) => setW2(Number(e.target.value))} />
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--border-radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Nota Requerida en Certamen 3 ({w3}%)</span>
              <div style={{ fontSize: '42px', fontWeight: 800, color: neededScore <= 7.0 ? '#10b981' : '#ef4444', margin: '5px 0' }}>
                {neededScore <= 1.0 ? '1.0' : neededScore.toFixed(1)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
