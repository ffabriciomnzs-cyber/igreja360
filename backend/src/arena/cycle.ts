/**
 * Ciclos da Arena Bíblica.
 *
 * A competição corre em SEMANAS que terminam no sábado. No domingo o campeão
 * da semana que fechou é anunciado e fica em destaque na tela inicial até o
 * sábado seguinte, quando um novo ciclo se encerra.
 *
 * O PRIMEIRO ciclo é proposital e maior: quando a regra semanal entrou, já
 * havia pontuação acumulada (a regra antiga era mensal). Em vez de zerar o
 * que a igreja já tinha jogado, tudo o que veio antes conta até o sábado
 * 22/08/2026 — daí em diante são semanas de 7 dias, domingo a sábado.
 */

/** Sábado em que o primeiro ciclo (o acumulado antigo) se encerra. */
export const FIM_DO_PRIMEIRO_CICLO = '2026-08-22';

/** Bem antes de existir qualquer resposta: início "aberto" do primeiro ciclo. */
const INICIO_DOS_TEMPOS = '2000-01-01';

export interface Ciclo {
  /** "AAAA-MM-DD" — primeiro dia que conta (inclusive). */
  inicio: string;
  /** "AAAA-MM-DD" — último dia que conta (inclusive, sempre um sábado). */
  fim: string;
  /** É o ciclo especial de transição (acumulado da regra antiga)? */
  primeiro: boolean;
}

function somaDias(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado. */
function diaDaSemana(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

/** O ciclo que CONTÉM o dia informado. */
export function cicloDoDia(day: string): Ciclo {
  if (day <= FIM_DO_PRIMEIRO_CICLO) {
    return { inicio: INICIO_DOS_TEMPOS, fim: FIM_DO_PRIMEIRO_CICLO, primeiro: true };
  }
  const fim = somaDias(day, 6 - diaDaSemana(day)); // sábado desta semana
  return { inicio: somaDias(fim, -6), fim, primeiro: false }; // domingo → sábado
}

/**
 * O ciclo JÁ ENCERRADO anterior ao dia informado — é dele que sai o campeão
 * em exposição. Devolve null enquanto o primeiro ciclo não fechou (ninguém
 * pode ser campeão de uma semana que ainda está correndo).
 */
export function cicloAnterior(day: string): Ciclo | null {
  const atual = cicloDoDia(day);
  if (atual.primeiro) return null;

  const fimAnterior = somaDias(atual.inicio, -1);
  if (fimAnterior <= FIM_DO_PRIMEIRO_CICLO) {
    return { inicio: INICIO_DOS_TEMPOS, fim: FIM_DO_PRIMEIRO_CICLO, primeiro: true };
  }
  return { inicio: somaDias(fimAnterior, -6), fim: fimAnterior, primeiro: false };
}
