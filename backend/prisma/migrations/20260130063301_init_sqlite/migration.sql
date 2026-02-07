-- CreateTable
XTTE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "birthDate" DATETIME,
    "isAdult" BOOLEAN NOT NULL DEFAULT false,
    "balanceXT" REAL NOT NULL DEFAULT 0,
    "dailyPostCount" INTEGER NOT NULL DEFAULT 0,
    "lastPostReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
XTTE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromUserId" INTEGER,
    "toUserId" INTEGER,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prevHash" TEXT NOT NULL,
    "currentHash" TEXT NOT NULL,
    CONSTRAINT "Transaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
XTTE TABLE "MediaPack" (
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MediaPack_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
XTTE TABLE "MediaItem" (
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" INTEGER NOT NULL,
    "packId" INTEGER,
    "title" TEXT,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "requiresUnlock" BOOLEAN NOT NULL DEFAULT true,
    "price" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MediaItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "MediaPack" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
XTTE TABLE "FlashSale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" INTEGER NOT NULL,
    "mediaItemId" INTEGER,
    "packId" INTEGER,
    "title" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "FlashSale_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FlashSale_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FlashSale_packId_fkey" FOREIGN KEY ("packId") REFERENCES "MediaPack" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
XTTE TABLE "MediaUnlock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mediaItemId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MediaUnlock_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MediaUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MediaUnlock_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
XTTE TABLE "MediaWatermark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mediaItemId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaWatermark_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MediaWatermark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
XTTE TABLE "Subscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
XTTE TABLE "ContentOwnership" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "packId" INTEGER NOT NULL,
    "isVaulted" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentOwnership_packId_fkey" FOREIGN KEY ("packId") REFERENCES "MediaPack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
XTTE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
XTTE UNIQUE INDEX "Transaction_currentHash_key" ON "Transaction"("currentHash");

-- CreateIndex
XTTE INDEX "Transaction_fromUserId_idx" ON "Transaction"("fromUserId");

-- CreateIndex
XTTE INDEX "Transaction_toUserId_idx" ON "Transaction"("toUserId");

-- CreateIndex
XTTE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
XTTE INDEX "MediaPack_creatorId_idx" ON "MediaPack"("creatorId");

-- CreateIndex
XTTE INDEX "MediaItem_creatorId_idx" ON "MediaItem"("creatorId");

-- CreateIndex
XTTE INDEX "MediaItem_packId_idx" ON "MediaItem"("packId");

-- CreateIndex
XTTE INDEX "MediaItem_createdAt_idx" ON "MediaItem"("createdAt");

-- CreateIndex
XTTE INDEX "FlashSale_creatorId_idx" ON "FlashSale"("creatorId");

-- CreateIndex
XTTE INDEX "FlashSale_expiresAt_idx" ON "FlashSale"("expiresAt");

-- CreateIndex
XTTE UNIQUE INDEX "MediaUnlock_transactionId_key" ON "MediaUnlock"("transactionId");

-- CreateIndex
XTTE INDEX "MediaUnlock_userId_idx" ON "MediaUnlock"("userId");

-- CreateIndex
XTTE UNIQUE INDEX "MediaUnlock_mediaItemId_userId_key" ON "MediaUnlock"("mediaItemId", "userId");

-- CreateIndex
XTTE INDEX "MediaWatermark_userId_idx" ON "MediaWatermark"("userId");

-- CreateIndex
XTTE UNIQUE INDEX "MediaWatermark_mediaItemId_userId_key" ON "MediaWatermark"("mediaItemId", "userId");

-- CreateIndex
XTTE INDEX "Subscription_creatorId_idx" ON "Subscription"("creatorId");

-- CreateIndex
XTTE INDEX "Subscription_expiresAt_idx" ON "Subscription"("expiresAt");

-- CreateIndex
XTTE UNIQUE INDEX "Subscription_userId_creatorId_key" ON "Subscription"("userId", "creatorId");

-- CreateIndex
XTTE INDEX "ContentOwnership_packId_idx" ON "ContentOwnership"("packId");

-- CreateIndex
XTTE UNIQUE INDEX "ContentOwnership_userId_packId_key" ON "ContentOwnership"("userId", "packId");
