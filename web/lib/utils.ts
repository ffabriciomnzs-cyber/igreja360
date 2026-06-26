import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(value: string | Date): string {
  // Usa a parte de data (YYYY-MM-DD) sem conversão de fuso, evitando
  // o deslocamento de um dia em datas salvas em UTC (nascimento, batismo, etc.).
  const iso = typeof value === 'string' ? value : value.toISOString();
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}
