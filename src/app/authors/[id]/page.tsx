'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  description?: string | null;
  isbn?: string | null;
  publishedYear?: number | null;
  genre?: string | null;
  pages?: number | null;
  createdAt: string;
}

interface Author {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  nationality?: string | null;
  birthYear?: number | null;
  createdAt: string;
  updatedAt: string;
  books: Book[];
}

interface AuthorStats {
  authorId: string;
  authorName: string;
  totalBooks: number;
  firstBook: { title: string; year: number } | null;
  latestBook: { title: string; year: number } | null;
  averagePages: number;
  genres: string[];
  longestBook: { title: string; pages: number } | null;
  shortestBook: { title: string; pages: number } | null;
}

export default function AuthorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const authorId = params?.id as string;

  const [author, setAuthor] = useState<Author | null>(null);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Editar Autor
  const [isEditAuthorOpen, setIsEditAuthorOpen] = useState(false);
  const [authorForm, setAuthorForm] = useState({
    name: '',
    email: '',
    bio: '',
    nationality: '',
    birthYear: '',
  });
  const [authorFormError, setAuthorFormError] = useState('');
  const [savingAuthor, setSavingAuthor] = useState(false);

  // Modal Agregar / Editar Libro
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    genre: '',
    publishedYear: '',
    pages: '',
    isbn: '',
    description: '',
  });
  const [bookFormError, setBookFormError] = useState('');
  const [savingBook, setSavingBook] = useState(false);

  // Modal Confirmar Eliminar Libro
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAuthorAndStats = useCallback(async () => {
    if (!authorId) return;
    try {
      setLoading(true);
      const [resAuthor, resStats] = await Promise.all([
        fetch(`/api/authors/${authorId}`),
        fetch(`/api/authors/${authorId}/stats`),
      ]);

      if (!resAuthor.ok) {
        throw new Error('No se pudo encontrar al autor');
      }

      const authorData = await resAuthor.json();
      const statsData = resStats.ok ? await resStats.json() : null;

      setAuthor(authorData);
      setStats(statsData);

      setAuthorForm({
        name: authorData.name,
        email: authorData.email,
        bio: authorData.bio || '',
        nationality: authorData.nationality || '',
        birthYear: authorData.birthYear ? String(authorData.birthYear) : '',
      });
    } catch (err: any) {
      showToast(err.message || 'Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [authorId]);

  useEffect(() => {
    loadAuthorAndStats();
  }, [loadAuthorAndStats]);

  // Guardar cambios del autor
  const handleUpdateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorForm.name.trim() || !authorForm.email.trim()) {
      setAuthorFormError('El nombre y el correo son obligatorios.');
      return;
    }

    try {
      setSavingAuthor(true);
      setAuthorFormError('');

      const res = await fetch(`/api/authors/${authorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authorForm.name.trim(),
          email: authorForm.email.trim(),
          bio: authorForm.bio.trim() || null,
          nationality: authorForm.nationality.trim() || null,
          birthYear: authorForm.birthYear ? parseInt(authorForm.birthYear, 10) : null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al actualizar autor');

      showToast('Información del autor actualizada con éxito');
      setIsEditAuthorOpen(false);
      loadAuthorAndStats();
    } catch (err: any) {
      setAuthorFormError(err.message);
    } finally {
      setSavingAuthor(false);
    }
  };

  // Abrir modal libro
  const openAddBookModal = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      genre: '',
      publishedYear: '',
      pages: '',
      isbn: '',
      description: '',
    });
    setBookFormError('');
    setIsBookModalOpen(true);
  };

  const openEditBookModal = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      genre: book.genre || '',
      publishedYear: book.publishedYear ? String(book.publishedYear) : '',
      pages: book.pages ? String(book.pages) : '',
      isbn: book.isbn || '',
      description: book.description || '',
    });
    setBookFormError('');
    setIsBookModalOpen(true);
  };

  // Guardar libro
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim()) {
      setBookFormError('El título es obligatorio.');
      return;
    }
    if (bookForm.title.trim().length < 3) {
      setBookFormError('El título debe tener al menos 3 caracteres.');
      return;
    }

    try {
      setSavingBook(true);
      setBookFormError('');

      const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books';
      const method = editingBook ? 'PUT' : 'POST';

      const payload: any = {
        title: bookForm.title.trim(),
        authorId,
        genre: bookForm.genre.trim() || null,
        description: bookForm.description.trim() || null,
        isbn: bookForm.isbn.trim() || null,
        publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear, 10) : null,
        pages: bookForm.pages ? parseInt(bookForm.pages, 10) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al guardar el libro');

      showToast(editingBook ? 'Libro actualizado' : 'Nuevo libro añadido al autor');
      setIsBookModalOpen(false);
      loadAuthorAndStats();
    } catch (err: any) {
      setBookFormError(err.message);
    } finally {
      setSavingBook(false);
    }
  };

  // Eliminar libro
  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    try {
      setDeletingBook(true);
      const res = await fetch(`/api/books/${bookToDelete.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al eliminar');

      showToast('Libro eliminado');
      setBookToDelete(null);
      loadAuthorAndStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDeletingBook(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Cargando autor y estadísticas...</span>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Autor no encontrado</h2>
          <p className="text-sm text-slate-500 mt-2">
            El autor solicitado no existe en la base de datos o fue eliminado.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast */}
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
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Volver a Autores</span>
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
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

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera / Tarjeta del Autor */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
                {author.name.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {author.name}
                </h1>
                <p className="text-sm font-mono text-slate-500">{author.email}</p>

                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  {author.nationality && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      📍 {author.nationality}
                    </span>
                  )}
                  {author.birthYear && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      🎂 Nacimiento: {author.birthYear}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    📚 {stats?.totalBooks ?? author.books?.length ?? 0} libros registrados
                  </span>
                </div>

                <p className="pt-3 text-sm text-slate-600 leading-relaxed max-w-3xl italic">
                  {author.bio || 'Sin biografía registrada.'}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              <button
                onClick={() => setIsEditAuthorOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition shadow-sm"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Editar Autor</span>
              </button>

              <button
                onClick={openAddBookModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Agregar Libro</span>
              </button>
            </div>
          </div>
        </section>

        {/* Sección de Estadísticas Detalladas (Endpoint stats) */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Estadísticas Literarias</h2>
            <p className="text-xs text-slate-500">
              Métricas generadas por el endpoint <code>/api/authors/[id]/stats</code>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Libros */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total de Libros
              </span>
              <p className="text-2xl font-black text-indigo-600">
                {stats?.totalBooks ?? 0}
              </p>
              <p className="text-[11px] text-slate-400">Publicaciones registradas</p>
            </div>

            {/* Promedio Páginas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Promedio de Páginas
              </span>
              <p className="text-2xl font-black text-slate-800">
                {stats?.averagePages ? `${stats.averagePages} págs.` : 'N/D'}
              </p>
              <p className="text-[11px] text-slate-400">Longitud media de sus obras</p>
            </div>

            {/* Primer Libro */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Primer Libro
              </span>
              <p className="text-sm font-bold text-slate-800 line-clamp-1">
                {stats?.firstBook?.title || 'Sin registros'}
              </p>
              <p className="text-xs font-semibold text-indigo-600">
                {stats?.firstBook ? `Año ${stats.firstBook.year}` : '—'}
              </p>
            </div>

            {/* Último Libro */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Último Libro
              </span>
              <p className="text-sm font-bold text-slate-800 line-clamp-1">
                {stats?.latestBook?.title || 'Sin registros'}
              </p>
              <p className="text-xs font-semibold text-indigo-600">
                {stats?.latestBook ? `Año ${stats.latestBook.year}` : '—'}
              </p>
            </div>

            {/* Libro Más Largo */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Libro más Extenso
              </span>
              <p className="text-sm font-bold text-slate-800 line-clamp-1">
                {stats?.longestBook?.title || 'Sin registros'}
              </p>
              <p className="text-xs font-semibold text-emerald-600">
                {stats?.longestBook ? `${stats.longestBook.pages} páginas` : '—'}
              </p>
            </div>

            {/* Libro Más Corto */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Libro más Breve
              </span>
              <p className="text-sm font-bold text-slate-800 line-clamp-1">
                {stats?.shortestBook?.title || 'Sin registros'}
              </p>
              <p className="text-xs font-semibold text-amber-600">
                {stats?.shortestBook ? `${stats.shortestBook.pages} páginas` : '—'}
              </p>
            </div>

            {/* Géneros Únicos */}
            <div className="sm:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Géneros Únicos Escritos ({stats?.genres?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {stats?.genres && stats.genres.length > 0 ? (
                  stats.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No se han registrado géneros</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Libros del Autor */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Obras de {author.name} ({author.books?.length || 0})
              </h2>
              <p className="text-xs text-slate-500">
                Listado completo de libros pertenecientes a este autor
              </p>
            </div>

            <button
              onClick={openAddBookModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Añadir libro</span>
            </button>
          </div>

          {author.books?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-sm text-slate-500 font-medium">
                Este autor aún no tiene libros registrados en la biblioteca.
              </p>
              <button
                onClick={openAddBookModal}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Agregar su primer libro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {author.books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {book.title}
                      </h3>
                      {book.genre && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                          {book.genre}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {book.description || 'Sin descripción disponible.'}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                      {book.publishedYear && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                          📅 {book.publishedYear}
                        </span>
                      )}
                      {book.pages && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                          📄 {book.pages} págs.
                        </span>
                      )}
                      {book.isbn && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px]">
                          ISBN: {book.isbn}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditBookModal(book)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                      title="Editar libro"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setBookToDelete(book)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                      title="Eliminar libro"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal Editar Autor */}
      {isEditAuthorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Editar Información del Autor</h3>
              <button
                onClick={() => setIsEditAuthorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateAuthor} className="p-6 space-y-4">
              {authorFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {authorFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={authorForm.name}
                  onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={authorForm.email}
                  onChange={(e) => setAuthorForm({ ...authorForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nacionalidad
                  </label>
                  <input
                    type="text"
                    value={authorForm.nationality}
                    onChange={(e) => setAuthorForm({ ...authorForm, nationality: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Año de Nacimiento
                  </label>
                  <input
                    type="number"
                    value={authorForm.birthYear}
                    onChange={(e) => setAuthorForm({ ...authorForm, birthYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Biografía
                </label>
                <textarea
                  rows={3}
                  value={authorForm.bio}
                  onChange={(e) => setAuthorForm({ ...authorForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditAuthorOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAuthor}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100"
                >
                  {savingAuthor ? 'Guardando...' : 'Actualizar Información'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar / Editar Libro */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">
                {editingBook ? 'Editar Libro' : `Agregar Libro a ${author.name}`}
              </h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 space-y-4">
              {bookFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {bookFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título del Libro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: El coronel no tiene quien le escriba"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Género
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Novela"
                    value={bookForm.genre}
                    onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Año de Publicación
                  </label>
                  <input
                    type="number"
                    placeholder="1961"
                    value={bookForm.publishedYear}
                    onChange={(e) => setBookForm({ ...bookForm, publishedYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Número de Páginas
                  </label>
                  <input
                    type="number"
                    placeholder="120"
                    value={bookForm.pages}
                    onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    placeholder="978-0140157536"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  placeholder="Reseña del libro..."
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBook}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100"
                >
                  {savingBook ? 'Guardando...' : editingBook ? 'Actualizar Libro' : 'Añadir Libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación Libro */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-bold text-slate-800">¿Eliminar libro?</h4>
              <p className="text-xs text-slate-500">
                Se eliminará <strong>{bookToDelete.title}</strong> de la biblioteca.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deletingBook}
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingBook}
                onClick={handleDeleteBook}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                {deletingBook ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
