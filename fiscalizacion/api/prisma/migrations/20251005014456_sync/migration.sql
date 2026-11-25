-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mesaNro" TEXT;

-- CreateTable
CREATE TABLE "Mesa" (
    "id" TEXT NOT NULL,
    "nro" TEXT NOT NULL,
    "escuelaId" TEXT NOT NULL,
    "fiscalId" TEXT,

    CONSTRAINT "Mesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mesa_escuelaId_nro_key" ON "Mesa"("escuelaId", "nro");

-- AddForeignKey
ALTER TABLE "Mesa" ADD CONSTRAINT "Mesa_escuelaId_fkey" FOREIGN KEY ("escuelaId") REFERENCES "Escuela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesa" ADD CONSTRAINT "Mesa_fiscalId_fkey" FOREIGN KEY ("fiscalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
