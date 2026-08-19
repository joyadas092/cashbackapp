-- CreateTable
CREATE TABLE "store_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_favorites_user_id_idx" ON "store_favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_favorites_user_id_store_id_key" ON "store_favorites"("user_id", "store_id");

-- AddForeignKey
ALTER TABLE "store_favorites" ADD CONSTRAINT "store_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_favorites" ADD CONSTRAINT "store_favorites_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
