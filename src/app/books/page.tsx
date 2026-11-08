'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Author {
  id: string;
  name: string;
  email: string;
}

interface Book {
  id: string;
  title: string;
  description?: string | null;
  isbn?: string | null;
  publishedYear?: number | null;
  genre?: string | null;
  pages?: number | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: Author;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const COMMON_GENRES = [
  'Novela',
  'Cuento',
  'Ciencia Ficción',
  'Fantasía',
  'Realismo Mágico',
  'Ensayo',
  'Historia',
  'Poesía',
  'Filosofía',
  'Terror',
  'Drama',
];

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Paginación
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [authorNameFilter, setAuthorNameFilter] = useState('');
  const [debouncedAuthorName, setDebouncedAuthorName] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Modal Crear / Editar Libro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    authorId: '',
    genre: '',
    publishedYear: '',
    pages: '',
    isbn: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [savingBook, setSavingBook] = useState(false);

  // Modal Confirmación Eliminar
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Debounce para búsqueda en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reiniciar a página 1 al cambiar búsqueda
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAuthorName(authorNameFilter);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [authorNameFilter]);

  // Cargar lista de autores para el dropdown
  useEffect(() => {
    fetch('/api/authors')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAuthors(data);
        }
      })
      .catch((err) => console.error('Error cargando autores:', err));
  }, []);

  // Consultar libros usando el endpoint de búsqueda avanzada
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (selectedGenre.trim()) params.append('genre', selectedGenre.trim());
      if (debouncedAuthorName.trim()) params.append('authorName', debouncedAuthorName.trim());
      params.append('page', String(page));
      params.append('limit', String(limit));
      params.append('sortBy', sortBy);
      params.append('order', order);

      const res = await fetch(`/api/books/search?${params.toString()}`);
      if (!res.ok) throw new Error('Error al consultar libros');

      const data = await res.json();
      setBooks(data.data || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } catch (err: any) {
      showToast(err.message || 'Error al conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedGenre, debouncedAuthorName, page, limit, sortBy, order]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSearch('');
    setSelectedGenre('');
    setAuthorNameFilter('');
    setSortBy('createdAt');
    setOrder('desc');
    setPage(1);
  };

  const openCreateModal = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      authorId: authors[0]?.id || '',
      genre: '',
      publishedYear: '',
      pages: '',
      isbn: '',
      description: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      authorId: book.authorId,
      genre: book.genre || '',
      publishedYear: book.publishedYear ? String(book.publishedYear) : '',
      pages: book.pages ? String(book.pages) : '',
      isbn: book.isbn || '',
      description: book.description || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.authorId) {
      setFormError('El título y el autor son obligatorios.');
      return;
    }

    if (bookForm.title.trim().length < 3) {
      setFormError('El título debe tener al menos 3 caracteres.');
      return;
    }

    try {
      setSavingBook(true);
      setFormError('');

      const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books';
      const method = editingBook ? 'PUT' : 'POST';

      const payload: any = {
        title: bookForm.title.trim(),
        authorId: bookForm.authorId,
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
      if (!res.ok) {
        throw new Error(result.error || 'Ocurrió un error al guardar el libro');
      }

      showToast(editingBook ? 'Libro actualizado exitosamente' : 'Libro creado exitosamente');
      setIsModalOpen(false);
      fetchBooks();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/books/${bookToDelete.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al eliminar el libro');

      showToast('Libro eliminado correctamente');
      setBookToDelete(null);
      fetchBooks();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

// Géneros combinados disponibles con tipado estricto string[]
  const availableGenres: string[] = Array.from(
    new Set([
      ...COMMON_GENRES,
      ...books
        .map((b) => b.genre?.trim())
        .filter((g): g is string => typeof g === 'string' && g.length > 0),
    ])
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Biblioteca Digital</h1>
              <p className="text-xs text-slate-500 font-medium">Búsqueda & Paginación - DAWA</p>
            </div>
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
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700"
            >
              Catálogo de Libros
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Encabezado y Acción Crear */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Catálogo y Búsqueda Avanzada de Libros
            </h2>
            <p className="text-sm text-slate-500">
              Filtra por título, autor, género y gestiona la paginación dinámica del sistema.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-100 hover:shadow-lg active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Agregar Nuevo Libro</span>
          </button>
        </div>

        {/* Panel de Filtros y Búsqueda en Tiempo Real */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Input Búsqueda por Título */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Búsqueda por Título
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: Cien años de soledad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
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
            </div>

            {/* Input Filtro por Autor */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Nombre de Autor
              </label>
              <input
                type="text"
                placeholder="Ej: Gabriel García Márquez..."
                value={authorNameFilter}
                onChange={(e) => setAuthorNameFilter(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
              />
            </div>

            {/* Dropdown Filtro por Género */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Filtrar por Género
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
              >
                <option value="">Todos los géneros</option>
                {availableGenres.map((g) => (
                  <option key={g} value={String(g)}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Opciones de Ordenamiento y Límite */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="createdAt">Fecha de Creación</option>
                  <option value="title">Título</option>
                  <option value="publishedYear">Año de Publicación</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Orden:</span>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Por página:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {(search || selectedGenre || authorNameFilter || sortBy !== 'createdAt' || order !== 'desc') && (
              <button
                onClick={handleClearFilters}
                className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
              >
                <span>Limpiar filtros</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Resumen de Resultados y Estado de Carga */}
        <div className="flex items-center justify-between text-sm text-slate-600 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{pagination.total}</span>
            <span>libros encontrados</span>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Actualizando...
              </span>
            )}
          </div>

          <span className="text-xs text-slate-500">
            Página {pagination.page} de {pagination.totalPages || 1}
          </span>
        </div>

        {/* Lista de Libros (Cards Responsivas) */}
        {loading && books.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-3">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-12 bg-slate-200 rounded" />
                <div className="h-6 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-slate-700">No se encontraron libros</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              No hay libros que coincidan con los criterios de búsqueda o no se han registrado obras aún.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Registrar nuevo libro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {book.title}
                    </h3>

                    {book.genre && (
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {book.genre}
                      </span>
                    )}
                  </div>

                  {/* Autor */}
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Autor: </span>
                    {book.author ? (
                      <Link
                        href={`/authors/${book.author.id}`}
                        className="font-bold text-indigo-600 hover:underline"
                      >
                        {book.author.name}
                      </Link>
                    ) : (
                      <span className="text-slate-700 font-medium">No asignado</span>
                    )}
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {book.description || 'Sin descripción disponible.'}
                  </p>

                  {/* Metadatos (Páginas, Año, ISBN) */}
                  <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                    {book.publishedYear && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                        📅 {book.publishedYear}
                      </span>
                    )}
                    {book.pages && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                        📄 {book.pages} páginas
                      </span>
                    )}
                    {book.isbn && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[10px]">
                        ISBN: {book.isbn}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(book)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white transition shadow-sm border border-transparent hover:border-slate-200"
                    title="Editar libro"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setBookToDelete(book)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white transition shadow-sm border border-transparent hover:border-slate-200"
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

        {/* Paginación Funcional */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando página <strong>{pagination.page}</strong> de{' '}
              <strong>{pagination.totalPages}</strong> ({pagination.total} libros en total)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Anterior
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                      p === pagination.page
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Crear / Editar Libro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">
                {editingBook ? 'Editar Libro' : 'Registrar Nuevo Libro'}
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

            <form onSubmit={handleBookSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título del Libro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cien años de soledad"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Autor *
                </label>
                <select
                  required
                  value={bookForm.authorId}
                  onChange={(e) => setBookForm({ ...bookForm, authorId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="" disabled>
                    Selecciona un autor
                  </option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
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
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Año de Publicación
                  </label>
                  <input
                    type="number"
                    placeholder="1967"
                    value={bookForm.publishedYear}
                    onChange={(e) => setBookForm({ ...bookForm, publishedYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    placeholder="417"
                    value={bookForm.pages}
                    onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    placeholder="978-0307474728"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  placeholder="Reseña o sinopsis de la obra..."
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
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
                  disabled={savingBook}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition shadow-md shadow-indigo-100"
                >
                  {savingBook ? 'Guardando...' : editingBook ? 'Actualizar Libro' : 'Guardar Libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
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
                Se eliminará el libro <strong>{bookToDelete.title}</strong> de la base de datos de forma permanente.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteBook}
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
  export default function AuthorDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando autor...</div>}>
      <AuthorDetailContent />
    </Suspense>
  );
}
}
