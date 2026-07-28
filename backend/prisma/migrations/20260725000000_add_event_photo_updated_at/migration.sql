-- Marca quando a foto do evento mudou. Só adiciona coluna: nenhum dado
-- existente é alterado ou removido.
ALTER TABLE "Event" ADD COLUMN "photoUpdatedAt" TIMESTAMP(3);

-- Backfill: eventos que JÁ têm foto passam a ter a marca, senão a imagem
-- sumiria da tela (a listagem decide se há foto por esta coluna). Usa a data
-- de criação, que é a informação mais próxima que temos.
UPDATE "Event" SET "photoUpdatedAt" = "createdAt" WHERE "photo" IS NOT NULL;
