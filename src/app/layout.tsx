import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Biblioteca Digital - Laboratorio 12 DAWA',
  description: 'Sistema avanzado de gestión de autores y biblioteca con búsqueda, filtros y paginación en Next.js, Prisma y Neon PostgreSQL.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
        {children}
      </body>
    </html>
  );
}
