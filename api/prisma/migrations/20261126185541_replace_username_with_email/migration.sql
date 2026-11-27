-- Troca o login por username pelo login por e-mail.
--
-- Escrita à mão: o SQL gerado pelo Prisma seria "DROP username + ADD email NOT NULL",
-- o que falha (ou perde dados) quando já existem usuários. Aqui a coluna é
-- RENOMEADA, preservando os dados e o índice único.

ALTER TABLE "users" RENAME COLUMN "username" TO "email";
ALTER INDEX "users_username_key" RENAME TO "users_email_key";

-- Usuários já existentes recebem um e-mail provisório (ex.: "admin" -> "admin@bolao.local").
-- A senha continua a mesma.
UPDATE "users" SET "email" = "email" || '@bolao.local' WHERE "email" NOT LIKE '%@%';
