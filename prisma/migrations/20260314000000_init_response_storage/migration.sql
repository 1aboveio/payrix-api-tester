-- CreateTable
CREATE TABLE "TransactionResponse" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "referenceNum" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestData" TEXT NOT NULL,
    "responseData" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "statusText" TEXT NOT NULL,
    "duration" INTEGER,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionResponse_transactionId_idx" ON "TransactionResponse"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionResponse_referenceNum_idx" ON "TransactionResponse"("referenceNum");

-- CreateIndex
CREATE INDEX "TransactionResponse_endpoint_idx" ON "TransactionResponse"("endpoint");

-- CreateIndex
CREATE INDEX "TransactionResponse_createdAt_idx" ON "TransactionResponse"("createdAt");
