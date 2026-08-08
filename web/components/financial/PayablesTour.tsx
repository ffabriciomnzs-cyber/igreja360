'use client';

// Balões explicativos do primeiro acesso à aba "Contas parceladas".
// Mesma técnica do tour do portal: quatro painéis escuros em volta do alvo
// (o truque de box-shadow gigante recorta errado em alguns navegadores).
// Passo sem alvo — ou com alvo que ainda não existe na tela, como a lista
// vazia no primeiro acesso — vira cartão central.

import { useCallback, useEffect, useState } from 'react';

const TOUR_KEY = 'igreja360.parceladas.tour';
export const ABRIR_TOUR_PARCELADAS = 'igreja360:abrir-tour-parceladas';

interface Passo {
  alvo: string | null;
  emoji: string;
  titulo: string;
  texto: string;
}

const PASSOS: Passo[] = [
  {
    alvo: null,
    emoji: '📄',
    titulo: 'Contas parceladas',
    texto:
      'Aqui você acompanha o que a igreja comprou parcelado: quanto já foi pago, quanto falta e o que vence primeiro. Leva um minuto para entender — vamos juntos?',
  },
  {
    alvo: null,
    emoji: '⚖️',
    titulo: 'A regra mais importante',
    texto:
      'Cadastrar uma conta NÃO tira dinheiro do saldo. Se você comprar algo de R$ 3.500 em 10 vezes, o caixa não perde R$ 3.500 hoje: perde R$ 350 a cada mês, quando você marcar a parcela como paga. É assim que o saldo continua batendo com o extrato do banco.',
  },
  {
    alvo: 'parceladas-resumo',
    emoji: '📊',
    titulo: 'O resumo do topo',
    texto:
      '"Falta pagar" é tudo o que a igreja ainda deve, somando todas as contas. "Vence este mês" é quanto sai do caixa até o fim do mês — o número que ajuda a planejar. "Atrasadas" é o que passou da data e ainda não foi pago.',
  },
  {
    alvo: 'parceladas-nova',
    emoji: '➕',
    titulo: 'Cadastrar uma conta',
    texto:
      'Atenção a um detalhe: informe o valor DE CADA PARCELA, não o total da compra. Coloque também quantas parcelas e a data do primeiro vencimento — o sistema cria todas as datas seguintes sozinho, respeitando o mesmo dia do mês.',
  },
  {
    alvo: 'parceladas-lista',
    emoji: '🎨',
    titulo: 'A barrinha de cada conta',
    texto:
      'Cada tracinho é uma parcela: verde já foi paga, vermelho está atrasado e cinza ainda vai vencer. Dá para ver a situação da conta inteira sem abrir nada.',
  },
  {
    alvo: 'parceladas-lista',
    emoji: '✅',
    titulo: 'Pagar uma parcela',
    texto:
      'Clique na conta para abrir as parcelas. No botão "Pagar", a despesa entra no financeiro na hora, com a categoria que você escolheu — ela aparece no extrato como qualquer outra saída. Se o valor mudou (juros de atraso ou desconto), dá para ajustar antes de confirmar.',
  },
  {
    alvo: 'parceladas-lista',
    emoji: '↩️',
    titulo: 'Errou? Dá para desfazer',
    texto:
      'A setinha ao lado de uma parcela paga desfaz o pagamento: o lançamento sai do financeiro e a parcela volta a ficar em aberto. E uma trava de proteção: não dá para excluir uma conta que já tem parcela paga, para nunca sumir com despesa de verdade do caixa.',
  },
  {
    alvo: null,
    emoji: '🔔',
    titulo: 'Você será avisado',
    texto:
      'Todo dia às 8h o sistema avisa tesoureiro, pastor e administrador sobre parcelas que vencem em 3 dias, vencem hoje ou estão atrasadas. Para receber no celular, toque uma vez em "Ativar avisos" no Dashboard.',
  },
  {
    alvo: null,
    emoji: '💡',
    titulo: 'Cuidado ao cadastrar conta antiga',
    texto:
      'Se a igreja já vinha pagando algo e essas despesas já foram lançadas à mão no extrato, cadastre a conta SÓ com as parcelas que ainda faltam — colocando o primeiro vencimento na próxima a vencer. Assim o mesmo gasto não é contado duas vezes.',
  },
  {
    alvo: null,
    emoji: '👍',
    titulo: 'Pronto!',
    texto:
      'É só isso. Se quiser rever este guia depois, o link "Como funciona" fica no rodapé da aba.',
  },
];

export function PayablesTour(): React.ReactElement | null {
  const [passo, setPasso] = useState(-1); // -1 = fechado
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const abrir = (): void => setPasso(0);
    let t: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        // Deixa a aba pintar (e os dados chegarem) antes de escurecer a tela.
        t = setTimeout(abrir, 900);
      }
    } catch {
      /* sem localStorage: não insiste */
    }
    window.addEventListener(ABRIR_TOUR_PARCELADAS, abrir);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener(ABRIR_TOUR_PARCELADAS, abrir);
    };
  }, []);

  // Mede o alvo do passo (e re-mede ao rolar ou redimensionar).
  useEffect(() => {
    if (passo < 0) return;
    const alvo = PASSOS[passo]?.alvo;
    if (!alvo) {
      setRect(null);
      return;
    }
    const mede = (): void => {
      const el = document.querySelector(`[data-tour="${alvo}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    const el = document.querySelector(`[data-tour="${alvo}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // Espera a rolagem assentar antes de medir, senão o recorte fica torto.
    const t = setTimeout(mede, 320);
    window.addEventListener('resize', mede);
    window.addEventListener('scroll', mede, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', mede);
      window.removeEventListener('scroll', mede, true);
    };
  }, [passo]);

  const termina = useCallback((): void => {
    try {
      localStorage.setItem(TOUR_KEY, String(Date.now()));
    } catch {
      /* ignora */
    }
    setPasso(-1);
  }, []);

  if (passo < 0) return null;
  const atual = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  // Balão embaixo do alvo, a não ser que não caiba — aí vai para cima.
  const alturaBalao = 260;
  const balaoEmCima =
    !!rect && rect.bottom + alturaBalao > window.innerHeight && rect.top > alturaBalao;

  return (
    <div className="fixed inset-0 z-50">
      {rect ? (
        <>
          <div
            className="absolute inset-x-0 top-0 bg-slate-900/70"
            style={{ height: Math.max(0, rect.top - 6) }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-slate-900/70"
            style={{ top: rect.bottom + 6 }}
          />
          <div
            className="absolute bg-slate-900/70"
            style={{
              top: rect.top - 6,
              height: rect.height + 12,
              left: 0,
              width: Math.max(0, rect.left - 6),
            }}
          />
          <div
            className="absolute bg-slate-900/70"
            style={{
              top: rect.top - 6,
              height: rect.height + 12,
              left: rect.right + 6,
              right: 0,
            }}
          />
          <div
            className="pointer-events-none absolute rounded-2xl ring-4 ring-white/70"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-900/70" />
      )}

      <div
        className={`absolute w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 ${
          rect ? '' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
        }`}
        style={
          rect
            ? {
                left: Math.max(
                  16,
                  Math.min(
                    rect.left,
                    window.innerWidth - Math.min(448, window.innerWidth - 32) - 16,
                  ),
                ),
                ...(balaoEmCima
                  ? { bottom: window.innerHeight - rect.top + 16 }
                  : { top: rect.bottom + 16 }),
              }
            : undefined
        }
      >
        <p className="text-2xl">{atual.emoji}</p>
        <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
          {atual.titulo}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {atual.texto}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {PASSOS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === passo
                    ? 'w-5 bg-indigo-500'
                    : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {passo > 0 && (
              <button
                onClick={() => setPasso((p) => p - 1)}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500"
              >
                Voltar
              </button>
            )}
            {!ultimo && (
              <button
                onClick={termina}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500"
              >
                Pular
              </button>
            )}
            <button
              onClick={() => (ultimo ? termina() : setPasso((p) => p + 1))}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {ultimo ? 'Entendi' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
