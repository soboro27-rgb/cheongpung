-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'INSPECTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" TEXT NOT NULL,
    "erpName" TEXT NOT NULL DEFAULT '',
    "bizNumber" TEXT NOT NULL DEFAULT '',
    "managerName" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "quantityDesc" TEXT NOT NULL DEFAULT '',
    "arrivalDate" TEXT NOT NULL DEFAULT '',
    "depositor" TEXT NOT NULL DEFAULT '',
    "bank" TEXT NOT NULL DEFAULT '',
    "accountNumber" TEXT NOT NULL DEFAULT '',
    "chargeAmount" INTEGER NOT NULL DEFAULT 0,
    "memo" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "vendorNameEn" TEXT NOT NULL DEFAULT '',
    "managerLastEn" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdById" INTEGER NOT NULL,
    CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "qrString" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "isInspected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseOrderId" INTEGER NOT NULL,
    CONSTRAINT "QRCode_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inspectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "manufacturer" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "cpu" TEXT NOT NULL DEFAULT '',
    "ram" TEXT NOT NULL DEFAULT '',
    "storage" TEXT NOT NULL DEFAULT '',
    "vga" TEXT NOT NULL DEFAULT '',
    "screenSize" TEXT NOT NULL DEFAULT '',
    "resolution" TEXT NOT NULL DEFAULT '',
    "lcdCondition" TEXT NOT NULL DEFAULT '',
    "keyboardTouch" TEXT NOT NULL DEFAULT '',
    "batteryLossPct" REAL NOT NULL DEFAULT 0,
    "battery45Checked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "adapter" BOOLEAN NOT NULL DEFAULT false,
    "disassembled" BOOLEAN NOT NULL DEFAULT false,
    "defectStatus" TEXT NOT NULL DEFAULT 'GOOD',
    "grade" TEXT NOT NULL DEFAULT '',
    "purchasePrice" INTEGER NOT NULL DEFAULT 0,
    "qrId" INTEGER NOT NULL,
    "inspectorId" INTEGER NOT NULL,
    CONSTRAINT "Inspection_qrId_fkey" FOREIGN KEY ("qrId") REFERENCES "QRCode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_qrString_key" ON "QRCode"("qrString");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_qrId_key" ON "Inspection"("qrId");
