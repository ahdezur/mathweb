import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Administrador – Álvaro Profemate',
  description: 'Sistema privado de administración de cursos, módulos, lecciones y tutorías.',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {children}
    </div>
  );
}
