# Architecture

Culinaire est un monolithe Next.js App Router. Les Server Components lisent SQLite via Prisma, les Server Actions réalisent les mutations, et quelques composants clients gèrent les interactions immédiates. `src/domain/culinary.ts` ne dépend ni de React ni de Prisma et contient les calculs testables.
