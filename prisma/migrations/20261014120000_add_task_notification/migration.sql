-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "recurring" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tarefaId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "notifications_tarefaId_key" ON "notifications"("tarefaId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
