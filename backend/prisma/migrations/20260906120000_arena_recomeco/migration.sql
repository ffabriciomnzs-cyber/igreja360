-- Recomeço da Arena: apaga as respostas de HOJE.
--
-- Pedido da igreja ao ligar o cronômetro: quem já tinha jogado hoje jogou sem
-- limite de tempo, então esses pontos dariam vantagem. Todo mundo volta à
-- mesma largada e joga de novo, agora contra o relógio.
--
-- ⚠️ Isto APAGA pontos reais do dia (e só do dia). O histórico dos dias
-- anteriores fica intacto, e com ele o ranking geral.
--
-- O sorteio das perguntas do dia não precisa ser mexido aqui: o rodízio é
-- fatiado pelo tamanho do banco, que passou de 260 para 359 perguntas — o
-- embaralhamento muda sozinho e ninguém repete o que já viu hoje.
DELETE FROM "ArenaAnswer"
 WHERE "day" = to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD');

DELETE FROM "ArenaQuestionOpen"
 WHERE "day" = to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD');
