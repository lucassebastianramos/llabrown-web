-- CreateEnum
CREATE TYPE "JornadaStatus" AS ENUM ('pendiente', 'abierta', 'cerrada');

-- CreateTable
CREATE TABLE "mesa_jornada" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "electores" INTEGER,
    "status" "JornadaStatus" NOT NULL DEFAULT 'pendiente',
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "votantes" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesa_jornada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesa_resultados" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "resultados" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesa_resultados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MesaActa" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MesaActa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mesa_jornada_mesaId_key" ON "mesa_jornada"("mesaId");

-- CreateIndex
CREATE UNIQUE INDEX "mesa_resultados_mesaId_key" ON "mesa_resultados"("mesaId");

-- CreateIndex
CREATE INDEX "MesaActa_mesaId_idx" ON "MesaActa"("mesaId");

-- AddForeignKey
ALTER TABLE "mesa_jornada" ADD CONSTRAINT "mesa_jornada_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_resultados" ADD CONSTRAINT "mesa_resultados_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MesaActa" ADD CONSTRAINT "MesaActa_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
