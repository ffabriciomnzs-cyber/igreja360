// Trilhas temáticas do devocional: 7 dias cada, montadas a partir da
// biblioteca embutida (web/lib/daily-devotional.ts). Rodam sozinhas — ninguém
// precisa escrever nada. O membro escolhe uma trilha e avança 1 dia por dia;
// sem trilha ativa, segue o devocional do dia (mesmo para toda a igreja).
//
// As trilhas apontam por REFERÊNCIA bíblica (não por posição), então incluir
// devocionais novos na biblioteca nunca embaralha uma trilha.

import { DAILY_DEVOTIONALS, type DailyDevotional } from './daily-devotional';

export interface DevotionalTrail {
  id: string;
  title: string;
  subtitle: string;
  /** Referências, na ordem dos dias. */
  refs: string[];
}

export const DEVOTIONAL_TRAILS: DevotionalTrail[] = [
  {
    id: 'ansiedade',
    title: 'Ansiedade e medo',
    subtitle: 'Para os dias em que o peito aperta',
    refs: [
      'Filipenses 4:6-7',
      'Salmos 56:3',
      'Salmos 34:4',
      'Isaías 41:10',
      '1 Pedro 5:7',
      'Mateus 6:34',
      '1 João 4:18',
    ],
  },
  {
    id: 'paz',
    title: 'Paz e descanso',
    subtitle: 'Quando a alma precisa parar',
    refs: [
      'Mateus 11:28',
      'Salmos 46:10',
      'Salmos 62:5',
      'Salmos 91:1-2',
      'Colossenses 3:15',
      'Salmos 37:7',
      'Salmos 116:7',
    ],
  },
  {
    id: 'fe',
    title: 'Fé e confiança',
    subtitle: 'Firmar o coração no que não se vê',
    refs: [
      'Hebreus 11:1',
      'Provérbios 3:5-6',
      'Jeremias 17:7',
      'Salmos 37:3',
      'Filipenses 1:6',
      '1 Coríntios 10:13',
      'Salmos 27:14',
    ],
  },
  {
    id: 'gratidao',
    title: 'Gratidão e louvor',
    subtitle: 'Enxergar o bem que já recebeu',
    refs: [
      'Salmos 100:4',
      'Salmos 107:1',
      'Salmos 116:12',
      'Salmos 16:11',
      'Salmos 89:1',
      'Salmos 108:1',
      'Salmos 42:8',
    ],
  },
  {
    id: 'recomeco',
    title: 'Perdão e recomeço',
    subtitle: 'Página virada, misericórdia nova',
    refs: [
      '1 João 1:9',
      'Salmos 51:10',
      'Lamentações 3:22-23',
      '2 Coríntios 5:17',
      'Isaías 43:18-19',
      'Salmos 103:12',
      'Romanos 12:2',
    ],
  },
  {
    id: 'forca',
    title: 'Força para o dia',
    subtitle: 'Coragem para o que está pela frente',
    refs: [
      'Josué 1:9',
      'Isaías 40:29',
      'Isaías 40:31',
      'Filipenses 4:13',
      'Efésios 6:10',
      'Salmos 31:24',
      'Provérbios 18:10',
    ],
  },
];

export const TRAIL_LENGTH = 7;

const PELA_REF = new Map(DAILY_DEVOTIONALS.map((d) => [d.ref, d]));

export function trailById(id: string | null): DevotionalTrail | null {
  if (!id) return null;
  return DEVOTIONAL_TRAILS.find((t) => t.id === id) ?? null;
}

/**
 * Devocional de um dia da trilha. Se a referência não existir mais na
 * biblioteca, devolve null e o chamador cai no devocional do dia — mas isso
 * não deve acontecer: `scripts/check-trails.js` roda no build e barra.
 */
export function trailDevotional(
  trailId: string,
  position: number,
): DailyDevotional | null {
  const trail = trailById(trailId);
  if (!trail) return null;
  const ref = trail.refs[position];
  return ref ? PELA_REF.get(ref) ?? null : null;
}
