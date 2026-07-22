-- Preferências de notificação do membro. NULL = recebe tudo (padrão),
-- então a coluna é apenas adicionada: nenhum dado existente é alterado.
ALTER TABLE "Member" ADD COLUMN "notifyPrefs" JSONB;
