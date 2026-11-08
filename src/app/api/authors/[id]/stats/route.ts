import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de autor requerido' },
        { status: 400 }
      );
    }

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: true,
      },
    });

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      );
    }

    const books = author.books || [];
    const totalBooks = books.length;

    // Libros con año publicado definido
    const booksWithYear = books
      .filter((b) => b.publishedYear !== null && b.publishedYear !== undefined)
      .sort((a, b) => (a.publishedYear as number) - (b.publishedYear as number));

    const firstBook =
      booksWithYear.length > 0
        ? {
            title: booksWithYear[0].title,
            year: booksWithYear[0].publishedYear as number,
          }
        : null;

    const latestBook =
      booksWithYear.length > 0
        ? {
            title: booksWithYear[booksWithYear.length - 1].title,
            year: booksWithYear[booksWithYear.length - 1].publishedYear as number,
          }
        : null;

    // Libros con páginas definidas mayores a 0
    const booksWithPages = books
      .filter((b) => b.pages !== null && b.pages !== undefined && b.pages > 0)
      .sort((a, b) => (a.pages as number) - (b.pages as number));

    const averagePages =
      booksWithPages.length > 0
        ? Math.round(
            booksWithPages.reduce((acc, b) => acc + (b.pages as number), 0) /
              booksWithPages.length
          )
        : 0;

    const shortestBook =
      booksWithPages.length > 0
        ? {
            title: booksWithPages[0].title,
            pages: booksWithPages[0].pages as number,
          }
        : null;

    const longestBook =
      booksWithPages.length > 0
        ? {
            title: booksWithPages[booksWithPages.length - 1].title,
            pages: booksWithPages[booksWithPages.length - 1].pages as number,
          }
        : null;

    // Lista de géneros únicos
    const genres = Array.from(
      new Set(
        books
          .map((b) => b.genre?.trim())
          .filter((g): g is string => Boolean(g && g.length > 0))
      )
    );

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook,
      latestBook,
      averagePages,
      genres,
      longestBook,
      shortestBook,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del autor:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    );
  }
}
