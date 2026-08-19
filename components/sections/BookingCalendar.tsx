'use client';

import React, { useState } from 'react';

interface BookingCalendarProps {
  onSelectSlot: (dateStr: string, timeStr: string) => void;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ onSelectSlot }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(15);
  const [currentMonth, setCurrentMonth] = useState<'Junio' | 'Julio' | 'Agosto'>('Junio');

  const availableDays = [2, 4, 8, 10, 15, 17, 22, 24, 29];

  const timeSlots = [
    { time: '09:00 - 10:00', label: 'Disponible' },
    { time: '10:30 - 11:30', label: 'Disponible' },
    { time: '15:00 - 16:00', label: 'Disponible' },
    { time: '16:30 - 17:30', label: 'Disponible' },
    { time: '18:00 - 19:00', label: 'Disponible' }
  ];

  return (
    <section id="agenda" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border)', padding: '80px 0' }}>
      <div className="container">
        <span className="section-tag" style={{ display: 'block', textAlign: 'center', margin: '0 auto 10px auto' }}>Reserva de Horarios</span>
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '10px' }}>Reserva tu Horario de Consulta</h2>
        <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px auto', color: 'var(--text-muted)' }}>
          Selecciona un día en el calendario interactivo para ver los bloques horarios libres disponibles.
        </p>

        <div className="booking-calendar-wrapper">
          <div className="booking-calendar-card">
            <div className="calendar-header">
              <button type="button" className="calendar-nav-btn" onClick={() => setCurrentMonth(currentMonth === 'Agosto' ? 'Julio' : 'Junio')}>
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <h3 id="calendar-month-year">{currentMonth} 2026</h3>
              <button type="button" className="calendar-nav-btn" onClick={() => setCurrentMonth(currentMonth === 'Junio' ? 'Julio' : 'Agosto')}>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
            <div className="calendar-days-week">
              <span>Do</span><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span>
            </div>
            <div className="calendar-days-grid">
              <div className="calendar-day empty"></div>
              {Array.from({ length: 30 }).map((_, i) => {
                const dayNum = i + 1;
                const isAvailable = availableDays.includes(dayNum);
                const isSelected = selectedDay === dayNum;

                return (
                  <div
                    key={dayNum}
                    className={`calendar-day ${
                      isSelected
                        ? 'selected'
                        : isAvailable
                        ? 'available'
                        : 'disabled'
                    }`}
                    onClick={() => {
                      if (isAvailable) setSelectedDay(dayNum);
                    }}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="booking-slots-card" id="booking-slots-card">
            <h3 id="selected-day-label">
              {selectedDay ? `${currentMonth} ${selectedDay}, 2026` : 'Selecciona un día'}
            </h3>
            <div className="slots-container">
              {selectedDay ? (
                timeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="slot-btn"
                    onClick={() => onSelectSlot(`${selectedDay} de ${currentMonth}, 2026`, slot.time)}
                  >
                    <span><i className="fa-regular fa-clock" style={{ marginRight: '8px', color: 'var(--accent)' }}></i>{slot.time}</span>
                    <span className="slot-status available">{slot.label}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                  Por favor, selecciona un día habilitado del calendario (marcados en azul) para ver las horas de tutoría disponibles.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
