-- Split the handle in two.
--
-- A goURL can be typed from memory, so people write them down and share them.
-- If the only handle were the editable username, every old link would break the
-- moment someone renamed themselves. So the auto-assigned 5-character handle
-- becomes immutable `user_code`, and `username` becomes the optional chosen one.
-- Both resolve in /go/<handle>/<store>.

ALTER TABLE "users" RENAME COLUMN "username" TO "user_code";
ALTER INDEX "users_username_key" RENAME TO "users_user_code_key";

ALTER TABLE "users" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
