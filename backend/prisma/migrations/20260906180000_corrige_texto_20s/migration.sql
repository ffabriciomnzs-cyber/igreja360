-- O comunicado enviado hoje dizia "30 segundos por pergunta". O tempo passou a
-- ser 20 logo depois, e o texto ficou salvo no app contradizendo o jogo — quem
-- abrisse o aviso leria uma regra e veria outra na tela.
--
-- Corrige a frase no comunicado ja publicado, sem mexer em mais nada.
UPDATE "Communication"
   SET "content" = replace("content", '30 segundos por pergunta', '20 segundos por pergunta')
 WHERE "title" = 'Novas regras da Arena Bíblica'
   AND "content" LIKE '%30 segundos por pergunta%';
