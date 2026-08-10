-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserToroles" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserToroles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "_UserToroles_B_index" ON "_UserToroles"("B");

-- AddForeignKey
ALTER TABLE "_UserToroles" ADD CONSTRAINT "_UserToroles_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToroles" ADD CONSTRAINT "_UserToroles_B_fkey" FOREIGN KEY ("B") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: turn existing enum values into rows in "roles"
INSERT INTO "roles" ("name")
SELECT DISTINCT unnest("roles")::text
FROM "users"
WHERE "roles" IS NOT NULL
ON CONFLICT ("name") DO NOTHING;

-- Backfill: link users to their existing roles
INSERT INTO "_UserToroles" ("A", "B")
SELECT u."id", r."id"
FROM "users" u
CROSS JOIN LATERAL unnest(u."roles") AS ur("role_name")
JOIN "roles" r ON r."name" = ur."role_name"::text;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "roles";

-- DropEnum
DROP TYPE "Role";
