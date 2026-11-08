'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Author {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  nationality?: string | null;
  birthYear?: number | null;
  createdAt: string;
  updatedAt: string;
  books?: any[];
  _count?: {
    books: number;
  };
}

export default function DashboardPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    nationality: '',
    birthYear: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal Confirmación Eliminar
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Notificaciones Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/authors');
      if (!res.ok) throw new Error('Error al cargar autores');
      const data = await res.json();
      setAuthors(data);
    } catch (err: any) {
      showToast(err.message || 'Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const openCreateModal = () => {
    setEditingAuthor(null);
    setFormData({
      name: '',
      email: '',
      bio: '',
      nationality: '',
      birthYear: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (author: Author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name,
      email: author.email,
      bio: author.bio || '',
      nationality: author.nationality || '',
      birthYear: author.birthYear ? String(author.birthYear) : '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('El nombre y el correo electrónico son obligatorios.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const url = editingAuthor ? `/api/authors/${editingAuthor.id}` : '/api/authors';
      const method = editingAuthor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          bio: formData.bio.trim() || null,
          nationality: formData.nationality.trim() || null,
          birthYear: formData.birthYear ? parseInt(formData.birthYear, 10) : null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Ocurrió un error al guardar');
      }

      showToast(editingAuthor ? 'Autor actualizado con éxito' : 'Autor creado con éxito');
      setIsModalOpen(false);
      fetchAuthors();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAuthor = async () => {
    if (!authorToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/authors/${authorToDelete.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al eliminar autor');

      showToast('Autor y sus libros eliminados correctamente');
      setAuthorToDelete(null);
      fetchAuthors();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Estadísticas globales
  const stats = useMemo(() => {
    const totalAuthors = authors.length;
    const totalBooks = authors.reduce((acc, a) => acc + (a._count?.books || a.books?.length || 0), 0);
    const authorsWithBooks = authors.filter(a => (a._count?.books || a.books?.length || 0) > 0).length;
    const avgBooks = totalAuthors > 0 ? (totalBooks / totalAuthors).toFixed(1) : '0';
    return { totalAuthors, totalBooks, authorsWithBooks, avgBooks };
  }, [authors]);

  // Filtro local de autores
  const filteredAuthors = useMemo(() => {
    if (!searchTerm.trim()) return authors;
    const term = searchTerm.toLowerCase();
    return authors.filter(
      a =>
        a.name.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        (a.nationality && a.nationality.toLowerCase().includes(term))
    );
  }, [authors, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-bounce bg-white border-slate-200">
          <span
            className={`w-3 h-3 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navbar Superior */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Biblioteca Digital</h1>
              <p className="text-xs text-slate-500 font-medium">Gestión Avanzada - DAWA Lab 12</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700"
            >
              Dashboard
            </Link>
            <Link
              href="/books"
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            >
              Catálogo de Libros
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner de Bienvenida y Estadísticas */}
        <section className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Panel de Control de la Biblioteca
            </h2>
            <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
              Administra autores, supervisa métricas literarias en tiempo real y gestiona el catálogo de obras con paginación y filtros dinámicos.
            </p>
          </div>

          {/* Tarjetas de Métricas Globales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-200">
                Total Autores
              </span>
              <p className="text-3xl font-bold mt-1">{stats.totalAuthors}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-200">
                Total Libros
              </span>
              <p className="text-3xl font-bold mt-1">{stats.totalBooks}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-200">
                Autores Activos
              </span>
              <p className="text-3xl font-bold mt-1">{stats.authorsWithBooks}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-200">
                Promedio Libros/Autor
              </span>
              <p className="text-3xl font-bold mt-1">{stats.avgBooks}</p>
            </div>
          </div>
        </section>

        {/* Sección de Gestión de Autores */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Autores Registrados</h3>
              <p className="text-sm text-slate-500">
                Listado general de autores y acceso a sus estadísticas individuales
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 sm:w-64 pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3 top-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-100 hover:shadow-lg active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Nuevo Autor</span>
              </button>
            </div>
          </div>

          {/* Estado de Carga */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-8 bg-slate-200 rounded-lg w-full" />
                </div>
              ))}
            </div>
          ) : filteredAuthors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-700">No se encontraron autores</h4>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'No hay autores que coincidan con la búsqueda. Prueba con otro término.'
                  : 'Aún no hay autores registrados en la base de datos de Neon.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  Crear primer autor
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuthors.map((author) => {
                const bookCount = author._count?.books ?? author.books?.length ?? 0;
                return (
                  <div
                    key={author.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {author.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {author.name}
                            </h4>
                            <p className="text-xs text-slate-500 font-mono line-clamp-1">
                              {author.email}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {bookCount} {bookCount === 1 ? 'libro' : 'libros'}
                        </span>
                      </div>

                      {/* Metadatos */}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        {author.nationality && (
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            📍 {author.nationality}
                          </span>
                        )}
                        {author.birthYear && (
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            🎂 {author.birthYear}
                          </span>
                        )}
                      </div>

                      {/* Bio */}
                      <p className="mt-3 text-xs text-slate-600 line-clamp-2 italic">
                        {author.bio || 'Sin biografía registrada.'}
                      </p>
                    </div>

                    {/* Botones de Acción */}
                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/authors/${author.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <span>Ver Estadísticas</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(author)}
                          title="Editar Autor"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white transition shadow-sm border border-transparent hover:border-slate-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => setAuthorToDelete(author)}
                          title="Eliminar Autor"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white transition shadow-sm border border-transparent hover:border-slate-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal Crear / Editar Autor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">
                {editingAuthor ? 'Editar Autor' : 'Registrar Nuevo Autor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Gabriel García Márquez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="gabo@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nacionalidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Colombiana"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Año de Nacimiento
                  </label>
                  <input
                    type="number"
                    placeholder="1927"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Biografía
                </label>
                <textarea
                  rows={3}
                  placeholder="Breve reseña sobre el autor..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition shadow-md shadow-indigo-100"
                >
                  {saving ? 'Guardando...' : editingAuthor ? 'Actualizar' : 'Guardar Autor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {authorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-bold text-slate-800">¿Eliminar autor?</h4>
              <p className="text-xs text-slate-500">
                Se eliminará a <strong>{authorToDelete.name}</strong> y todos sus libros asociados en la base de datos (eliminación en cascada).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setAuthorToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAuthor}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-md shadow-rose-100"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
