/*
  Warnings:

  - The primary key for the `categorias_tarefa` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `categorias_tarefa` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `tarefas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `tarefas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `categoriaId` column on the `tarefas` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "tarefas" DROP CONSTRAINT "tarefas_categoriaId_fkey";

-- AlterTable
ALTER TABLE "categorias_tarefa" DROP CONSTRAINT "categorias_tarefa_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "categorias_tarefa_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tarefas" DROP CONSTRAINT "tarefas_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "categoriaId",
ADD COLUMN     "categoriaId" INTEGER,
ADD CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_tarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
