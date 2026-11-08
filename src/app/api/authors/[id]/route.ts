import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener un autor específico por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: {
          orderBy: {
            publishedYear: 'desc',
          },
        },
        _count: {
          select: { books: true },
        },
      },
    });

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(author);
  } catch (error) {
    console.error('Error al obtener autor:', error);
    return NextResponse.json(
      { error: 'Error al obtener autor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un autor
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { name, email, bio, nationality, birthYear } = body;

    // Validación básica de email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        );
      }
    }

    const author = await prisma.author.update({
      where: { id },
      data: {
        name,
        email,
        bio,
        nationality,
        birthYear: birthYear ? parseInt(birthYear, 10) : null,
      },
      include: {
        books: true,
      },
    });

    return NextResponse.json(author);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      );
    }
    console.error('Error al actualizar autor:', error);
    return NextResponse.json(
      { error: 'Error al actualizar autor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un autor
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

    await prisma.author.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Autor eliminado correctamente',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      );
    }
    console.error('Error al eliminar autor:', error);
    return NextResponse.json(
      { error: 'Error al eliminar autor' },
      { status: 500 }
    );
  }
}
