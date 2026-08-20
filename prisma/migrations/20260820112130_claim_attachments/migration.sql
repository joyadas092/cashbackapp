-- CreateTable
CREATE TABLE "claim_attachments" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claim_attachments_claim_id_key" ON "claim_attachments"("claim_id");

-- AddForeignKey
ALTER TABLE "claim_attachments" ADD CONSTRAINT "claim_attachments_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "cashback_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
