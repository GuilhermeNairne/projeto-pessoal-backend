/*
  Warnings:

  - Added the required column `cor` to the `categorias_tarefa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categorias_tarefa" ADD COLUMN     "cor" TEXT NOT NULL;
