/*
  Warnings:

  - Made the column `userId` on table `Quote` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "technicalParameters" TEXT NOT NULL,
    "estimatedCost" REAL NOT NULL,
    "staffingRequirements" TEXT NOT NULL,
    "diagramDefinition" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BORRADOR',
    CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("clientName", "createdAt", "diagramDefinition", "estimatedCost", "id", "projectType", "staffingRequirements", "status", "technicalParameters", "userId") SELECT "clientName", "createdAt", "diagramDefinition", "estimatedCost", "id", "projectType", "staffingRequirements", "status", "technicalParameters", "userId" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
