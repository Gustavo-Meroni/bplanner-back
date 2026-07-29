/*
  Warnings:

  - You are about to drop the column `categoria` on the `Aporte` table. All the data in the column will be lost.
  - Added the required column `mes` to the `Aporte` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Aporte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "mes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Aporte" ("createdAt", "descricao", "id", "valor") SELECT "createdAt", "descricao", "id", "valor" FROM "Aporte";
DROP TABLE "Aporte";
ALTER TABLE "new_Aporte" RENAME TO "Aporte";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
