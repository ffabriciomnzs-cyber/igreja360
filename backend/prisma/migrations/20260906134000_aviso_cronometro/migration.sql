-- 1) Trava de trabalho único (avisos e correções que rodam uma vez só).
CREATE TABLE "SystemFlag" (
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemFlag_pkey" PRIMARY KEY ("key")
);

-- 2) Zera os pontos de HOJE, agora de verdade.
--
-- A tentativa anterior rodou as 2h da manha, quando o dia mal tinha comecado e
-- nao havia o que apagar. Agora e domingo de manha e as pessoas ja jogaram sem
-- cronometro — sao esses pontos que dariam vantagem.
--
-- ⚠️ Isto APAGA pontos reais do dia (e so do dia). Dias anteriores intactos.
DELETE FROM "ArenaAnswer"
 WHERE "day" = to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD');

DELETE FROM "ArenaQuestionOpen"
 WHERE "day" = to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD');
