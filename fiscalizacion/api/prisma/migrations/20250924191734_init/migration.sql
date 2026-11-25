-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('coordinador', 'encargado_seccion', 'fiscal_general', 'fiscal_mesa');

-- CreateEnum
CREATE TYPE "public"."IncidentType" AS ENUM ('ausencia_fiscal', 'problema_tecnico', 'irregularidad', 'consulta', 'otro');

-- CreateEnum
CREATE TYPE "public"."IncidentStatus" AS ENUM ('abierta', 'en_proceso', 'resuelta', 'cerrada');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "dni" TEXT,
    "celular" TEXT,
    "seccionId" INTEGER,
    "escuelaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Escuela" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "circuito" TEXT NOT NULL,
    "seccion" INTEGER NOT NULL,
    "fgId" TEXT,

    CONSTRAINT "Escuela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fiscal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT,
    "celular" TEXT,
    "role" "public"."UserRole" NOT NULL,
    "escuelaId" TEXT,

    CONSTRAINT "Fiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Incidencia" (
    "id" TEXT NOT NULL,
    "tipo" "public"."IncidentType" NOT NULL,
    "estado" "public"."IncidentStatus" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "escuelaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incidencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."Fiscal" ADD CONSTRAINT "Fiscal_escuelaId_fkey" FOREIGN KEY ("escuelaId") REFERENCES "public"."Escuela"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Incidencia" ADD CONSTRAINT "Incidencia_escuelaId_fkey" FOREIGN KEY ("escuelaId") REFERENCES "public"."Escuela"("id") ON DELETE SET NULL ON UPDATE CASCADE;
