# Lab12-DAWA — API Routes con App Router y Prisma

## Estructura

```
Lab12-DAWA/
├── prisma/
│   └── schema.prisma              # Modelos Author y Book
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── authors/
│   │   │   │   ├── route.ts               # GET (listar) / POST (crear)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts           # GET / PUT / DELETE por ID
│   │   │   │       └── books/route.ts     # GET libros de un autor
│   │   │   └── books/
│   │   │       ├── route.ts               # GET (filtros genre/authorId) / POST
│   │   │       └── [id]/route.ts          # GET / PUT / DELETE por ID
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       └── prisma.ts              # Cliente Prisma
├── .env.example
└── package.json
```

## Cómo iniciar

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env` (copiando `.env.example`) con la cadena de conexión de Neon:

   ```env
   DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@ep-xxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

3. Crear las tablas y generar el cliente:

   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. Ejecutar:

   ```bash
   npm run dev
   ```

   API disponible en `http://localhost:3000/api/authors` y `http://localhost:3000/api/books`.
