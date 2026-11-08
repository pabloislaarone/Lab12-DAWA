import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim();
    const genre = searchParams.get('genre')?.trim();
    const authorName = searchParams.get('authorName')?.trim();

    // Paginación
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;

    const skip = (page - 1) * limit;

    // Ordenamiento
    const allowedSortBy = ['title', 'publishedYear', 'createdAt'];
    const sortByParam = searchParams.get('sortBy') || 'createdAt';
    const sortBy = allowedSortBy.includes(sortByParam) ? sortByParam : 'createdAt';

    const orderParam = (searchParams.get('order') || 'desc').toLowerCase();
    const order = orderParam === 'asc' ? 'asc' : 'desc';

    // Construcción dinámica de filtros Prisma
    const where: any = {};

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (genre && genre !== 'ALL') {
      where.genre = genre;
    }

    if (authorName) {
      where.author = {
        name: {
          contains: authorName,
          mode: 'insensitive',
        },
      };
    }

    // Consulta de datos y total en paralelo
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take: limit,
      }),
      prisma.book.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);
    const hasNext = page < totalPages;
    const hasPrev = page > 1 && totalPages > 0;

    return NextResponse.json({
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error('Error al buscar libros:', error);
    return NextResponse.json(
      { error: 'Error al buscar libros' },
      { status: 500 }
    );
  }
}
