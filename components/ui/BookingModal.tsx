'use client';

import React, { useState } from 'react';

interface BookingModalProps {
  bookingDetails: { date: string; time: string } | null;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ bookingDetails, onClose }) => {
  const [confirmed, setConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    subject: '',
    message: ''
  });

  if (!bookingDetails) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmed(true);
  };

  return (
    <div className="booking-modal-wrapper" id="booking-modal">
      <div className="booking-modal-card">
        <div className="booking-modal-header">
          <h3><i className="fa-regular fa-calendar-check" style={{ marginRight: '8px' }}></i> Confirmar Reserva</h3>
          <button type="button" className="booking-modal-close" id="close-booking-modal" onClick={onClose}>&times;</button>
        </div>

        {confirmed ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '48px', color: 'var(--accent)', marginBottom: '15px' }}></i>
            <h3 style={{ fontSize: '22px', marginBottom: '10px' }}>¡Reserva Solicitada con Éxito!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Registrada para el {bookingDetails.date} a las {bookingDetails.time}. Se envió confirmación a {formData.email}.
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose}>Entendido</button>
          </div>
        ) : (
          <>
            <div className="booking-details-summary">
              <p><strong>Fecha:</strong> <span id="summary-date">{bookingDetails.date}</span></p>
              <p><strong>Hora:</strong> <span id="summary-time">{bookingDetails.time}</span></p>
            </div>

            <form id="booking-form-submit" onSubmit={handleSubmit}>
              <div className="form-group-row" style={{ marginBottom: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="booking-name" className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    id="booking-name"
                    className="form-control"
                    placeholder="Ej. Juan Pérez"
                    required
                    style={{ width: '100%' }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="booking-email" className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    id="booking-email"
                    className="form-control"
                    placeholder="Ej. juan@correo.com"
                    required
                    style={{ width: '100%' }}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label htmlFor="booking-university" className="form-label">Universidad en la que estudias</label>
                <input
                  type="text"
                  id="booking-university"
                  className="form-control"
                  placeholder="Ej. Universidad de Chile, PUC, etc."
                  required
                  style={{ width: '100%' }}
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label htmlFor="booking-subject" className="form-label">Asignatura de Interés</label>
                <select
                  id="booking-subject"
                  className="form-control"
                  required
                  style={{ width: '100%' }}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option value="" disabled>Selecciona tu ramo...</option>
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

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="booking-message" className="form-label">Detalles o Temas a Tratar (Opcional)</label>
                <textarea
                  id="booking-message"
                  className="form-control"
                  placeholder="Describe de forma general los contenidos que te gustaría revisar..."
                  style={{ width: '100%', height: '80px' }}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
              </div>

              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" id="btn-cancel-booking" style={{ marginRight: '10px' }} onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary"><i className="fa-solid fa-check"></i> Reservar Sesión</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
