-- CreateTable
CREATE TABLE "Asignacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "escuelaId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "Asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asignacion_userId_escuelaId_role_key" ON "Asignacion"("userId", "escuelaId", "role");

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_escuelaId_fkey" FOREIGN KEY ("escuelaId") REFERENCES "Escuela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
