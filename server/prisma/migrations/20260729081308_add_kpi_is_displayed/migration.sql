-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_kpis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT,
    "kpiType" TEXT NOT NULL DEFAULT 'operational',
    "name" TEXT NOT NULL,
    "targetValue" REAL,
    "targetUnit" TEXT,
    "achievedValue" REAL,
    "achievedUnit" TEXT,
    "displayPercent" INTEGER,
    "year" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDisplayed" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kpis_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "priority_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "kpis_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_kpis" ("achievedUnit", "achievedValue", "categoryId", "displayPercent", "id", "kpiType", "name", "sortOrder", "targetUnit", "targetValue", "updatedAt", "updatedById", "year") SELECT "achievedUnit", "achievedValue", "categoryId", "displayPercent", "id", "kpiType", "name", "sortOrder", "targetUnit", "targetValue", "updatedAt", "updatedById", "year" FROM "kpis";
DROP TABLE "kpis";
ALTER TABLE "new_kpis" RENAME TO "kpis";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
