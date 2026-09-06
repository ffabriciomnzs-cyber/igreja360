-- Tira da tela inicial os dois avisos de sistema da Arena.
--
-- Eles foram gravados como comunicados para quem não visse o push, mas o
-- efeito foi ocupar a mural da igreja com dois blocos enormes de regra de
-- jogo, empurrando para baixo os avisos que a liderança de fato escreve.
-- A explicação das regras continua no pop-up do portal e na notificação.
--
-- ⚠️ Apaga dois comunicados. Só estes: o filtro casa título E conteúdo, para
-- não encostar em nada que a igreja tenha escrito.
DELETE FROM "Communication"
 WHERE ("title" = 'A Arena Bíblica agora tem cronômetro'
        AND "content" LIKE '%cada pergunta da Arena tem%')
    OR ("title" = 'Novas regras da Arena Bíblica'
        AND "content" LIKE '%Duas mudanças na Arena%');
