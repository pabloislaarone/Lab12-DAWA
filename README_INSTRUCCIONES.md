# Laboratorio 12 DAWA: Sistema de Biblioteca Avanzado (Tecsup)

Este paquete contiene la implementación completa de la **Tarea del Laboratorio 12**:
1. **Endpoint de Búsqueda Avanzada con Paginación y Filtros** (`src/app/api/books/search/route.ts`).
2. **Endpoint de Estadísticas Literarias de Autor** (`src/app/api/authors/[id]/stats/route.ts`).
3. **Página Dashboard Principal** (`src/app/page.tsx`).
4. **Página de Catálogo y Búsqueda de Libros** (`src/app/books/page.tsx`).
5. **Página de Detalle y Estadísticas del Autor** (`src/app/authors/[id]/page.tsx`).
6. Endpoints optimizados para Next.js 15+ y 16 con compatibilidad total para Neon PostgreSQL.

---

## 🚀 Pasos de Instalación Rápida

### Paso 1: Descomprimir y copiar los archivos
Copia la carpeta `src/` directamente en la raíz de tu repositorio `Lab12-DAWA`. Reemplazará los archivos base e incorporará las nuevas páginas y endpoints.

### Paso 2: Configurar tu base de datos en Neon
En tu archivo `.env`, asegúrate de tener tu cadena de conexión de Neon:
```env
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[ENDPOINT].neon.tech/[DB_NAME]?sslmode=require"
```

### Paso 3: Sincronizar Prisma
Ejecuta en tu terminal:
```bash
npx prisma db push
npx prisma generate
```

### Paso 4: Iniciar la aplicación
```bash
npm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 📌 Guía de Endpoints Nuevos para Postman / Pruebas

### 1. Búsqueda de Libros con Paginación y Filtros
* **Método:** `GET`
* **URL:** `http://localhost:3000/api/books/search?search=amor&genre=Novela&page=1&limit=10&sortBy=publishedYear&order=desc`
* **Parámetros admitidos:**
  * `search`: Búsqueda parcial insensible a mayúsculas/minúsculas en el título.
  * `authorName`: Búsqueda parcial insensible a mayúsculas/minúsculas por autor.
  * `genre`: Filtro exacto por género.
  * `page`: Número de página (default: `1`).
  * `limit`: Resultados por página (default: `10`, máx: `50`).
  * `sortBy`: `title`, `publishedYear`, `createdAt` (default: `createdAt`).
  * `order`: `asc` o `desc` (default: `desc`).

### 2. Estadísticas de Autor
* **Método:** `GET`
* **URL:** `http://localhost:3000/api/authors/[ID]/stats`
* **Devuelve:**
  * `totalBooks`: Total de libros.
  * `firstBook`: Libro más antiguo (`title`, `year`).
  * `latestBook`: Libro más reciente (`title`, `year`).
  * `averagePages`: Promedio de páginas redondeado.
  * `genres`: Array con géneros únicos escritos.
  * `longestBook`: Obra con mayor número de páginas.
  * `shortestBook`: Obra con menor número de páginas.

---

## 📝 5 Conclusiones para tu Informe (Página 29 de la Guía)

1. **Eficiencia en consultas con Prisma y Postgres:** La separación entre consultas de datos con `skip`/`take` y el recuento con `prisma.book.count` permite calcular con exactitud los metadatos de paginación (`totalPages`, `hasNext`, `hasPrev`) sin degradar el rendimiento al trabajar con bases de datos en la nube como Neon.
2. **Filtrado dinámico con insensitive mode:** El uso de `contains` con `mode: 'insensitive'` en Prisma ORM garantiza que las búsquedas por título o autor sean tolerantes a variaciones de mayúsculas y minúsculas, mejorando la experiencia del usuario final.
3. **Cálculo de estadísticas agregadas:** La implementación del endpoint de estadísticas demuestra cómo transformar colecciones relacionales para obtener métricas clave (primer y último libro, promedios y extremos de páginas) controlando casos límite en autores sin obras registradas.
4. **React App Router y experiencia en tiempo real:** La integración de un debounce en los inputs de búsqueda de `src/app/books/page.tsx` evita la saturación de peticiones HTTP, sincronizando los filtros de la interfaz gráfica con el endpoint de búsqueda de manera fluida y responsiva.
5. **Arquitectura desacoplada en Next.js:** Mantener la lógica de negocio en API Routes (`src/app/api`) y la interfaz en componentes de cliente (`'use client'`) permite que los endpoints sean consumibles tanto desde la interfaz web propia como desde herramientas externas (Postman, aplicaciones móviles u otros microservicios).

---

## 📤 Subir los cambios a GitHub

En tu terminal ejecuta:
```bash
git add .
git commit -m "feat: implementar búsqueda avanzada, estadísticas de autor y vistas completas"
git push origin main
```
