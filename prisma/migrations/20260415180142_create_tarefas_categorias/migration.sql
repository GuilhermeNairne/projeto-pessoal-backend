-- CreateTable
CREATE TABLE "categorias_tarefa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "categorias_tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoriaId" TEXT,
    "tempo" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_tarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
