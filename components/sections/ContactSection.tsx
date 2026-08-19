'use client';

import React, { useState } from 'react';

export const ContactSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contacto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container contact-grid">
        <div>
          <span className="section-tag">Contacto</span>
          <h2 className="section-title">¿Listo para mejorar tu rendimiento?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '35px', fontSize: '16px' }}>
            Reserva un horario de consulta, realiza preguntas sobre disponibilidad o solicita información detallada sobre los programas de tutorías sincrónicas.
          </p>

          <div className="contact-info-cards">
            <div className="contact-info-card">
              <div className="contact-info-icon"><i className="fa-regular fa-envelope"></i></div>
              <div>
                <h4 className="contact-info-title">Correo Electrónico</h4>
                <p className="contact-info-value">contacto@alvaroprofemate.cl</p>
              </div>
            </div>
            <div className="contact-info-card">
              <div className="contact-info-icon"><i className="fa-solid fa-graduation-cap"></i></div>
              <div>
                <h4 className="contact-info-title">Modalidad de Atención</h4>
                <p className="contact-info-value">100% Online (Zoom / Entorno Virtual EVA)</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <a href="#agenda" className="btn btn-primary" style={{ padding: '15px 35px', fontSize: '16px' }}>
              <i className="fa-solid fa-calendar-days"></i> Reservar Horario de Consulta
            </a>
          </div>
        </div>

        <div className="contact-form">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '48px', color: 'var(--accent)', marginBottom: '15px' }}></i>
              <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>¡Mensaje Enviado!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Gracias {formData.name}, responderé a tu correo {formData.email} a la brevedad.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', university: '', subject: '', message: '' });
                }}
              >
                Enviar Otro Mensaje
              </button>
            </div>
          ) : (
            <form id="landing-contact-form" onSubmit={handleSubmit}>
              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    placeholder="Ej. Juan Pérez"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    placeholder="Ej. juan@correo.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="university" className="form-label">Universidad en la que estudias</label>
                <input
                  type="text"
                  id="university"
                  name="university"
                  className="form-control"
                  placeholder="Ej. Universidad de Chile, PUC, etc."
                  required
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject" className="form-label">Asignatura de Interés</label>
                <select
                  id="subject"
                  name="subject"
                  className="form-control"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option value="" disabled>Selecciona una opción...</option>
                  <option value="Introducción al Cálculo">Introducción al Cálculo</option>
                  <option value="Introducción al Álgebra">Introducción al Álgebra</option>
                  <option value="Cálculo Diferencial">Cálculo Diferencial</option>
                  <option value="Cálculo Integral">Cálculo Integral</option>
                  <option value="Álgebra Lineal">Álgebra Lineal</option>
                  <option value="Cálculo Multivariable">Cálculo Multivariable</option>
                  <option value="Ecuaciones Diferenciales Ordinarias">Ecuaciones Diferenciales Ordinarias</option>
                  <option value="Cálculo Avanzado">Cálculo Avanzado</option>
                  <option value="Otro / Consulta General">Otro / Consulta General</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">Mensaje o Dudas</label>
                <textarea
                  id="message"
                  name="message"
                  className="form-control"
                  placeholder="Cuéntame en qué materia estás y qué tipo de ayuda necesitas..."
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <i className="fa-solid fa-paper-plane"></i> Enviar Mensaje
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
