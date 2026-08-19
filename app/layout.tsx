import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Álvaro Hernández – Profesor de Matemáticas e Ingeniería',
  description: 'Horarios de consulta universitarios y plataforma de cursos de Cálculo, Álgebra, Ecuaciones Diferenciales Ordinarias y Topología en R^n.',
  keywords: ['Matemáticas', 'Cálculo Diferencial', 'Cálculo Integral', 'Álgebra Lineal', 'EDO', 'Universidad', 'Tutorías'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
