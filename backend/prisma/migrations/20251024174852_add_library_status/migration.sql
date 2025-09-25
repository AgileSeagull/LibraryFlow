-- CreateTable
CREATE TABLE "LibraryStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "message" TEXT,
    "isAutoScheduled" BOOLEAN NOT NULL DEFAULT false,
    "autoOpenTime" TEXT,
    "autoCloseTime" TEXT,
    "maintenanceMessage" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);
