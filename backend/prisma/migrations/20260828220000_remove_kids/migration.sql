-- Remove o módulo Kids (check-in de crianças) a pedido da igreja.
--
-- ⚠️ Isto APAGA os dados de crianças, responsáveis e o histórico de entrada
-- e saída. A decisão foi tomada com o recurso recém-publicado e sem uso real.
-- O código continua no histórico do git, caso um dia volte.
DROP TABLE IF EXISTS "KidsCheckin";
DROP TABLE IF EXISTS "ChildGuardian";
DROP TABLE IF EXISTS "Child";
