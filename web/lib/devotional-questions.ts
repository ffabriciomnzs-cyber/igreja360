// Pergunta do dia do devocional: transforma leitura em resposta pessoal.
// São perguntas universais (funcionam com qualquer texto) escolhidas de forma
// estável pelo devocional — o mesmo devocional traz sempre a mesma pergunta.

export const DEVOTIONAL_QUESTIONS: string[] = [
  'O que esse versículo diz sobre quem Deus é para você hoje?',
  'O que você precisa entregar a Deus antes de começar o dia?',
  'Que passo simples você pode dar hoje por causa desta palavra?',
  'Por quem você vai orar hoje depois de ler isso?',
  'O que você tem carregado sozinho e pode soltar agora?',
  'Onde você mais precisa de coragem nesta semana?',
  'Pelo que você é grato neste exato momento?',
  'O que essa palavra muda no seu jeito de olhar para hoje?',
  'Existe alguém que precisa ouvir isso de você hoje?',
  'O que você faria diferente se acreditasse nisso por inteiro?',
  'Qual medo essa palavra ajuda você a encarar?',
  'O que você quer pedir a Deus antes de fechar o app?',
  'Que promessa você quer guardar desta leitura?',
  'Onde você tem procurado força fora de Deus?',
  'O que essa palavra revela sobre o cuidado de Deus com você?',
  'Qual é o próximo passo pequeno, mas possível, para hoje?',
  'O que você precisa perdoar — em alguém ou em si mesmo?',
  'Como você quer ser lembrado no fim deste dia?',
];

/** Pergunta estável para um devocional (mesma leitura, mesma pergunta). */
export function questionFor(index: number): string {
  const i =
    ((index % DEVOTIONAL_QUESTIONS.length) + DEVOTIONAL_QUESTIONS.length) %
    DEVOTIONAL_QUESTIONS.length;
  return DEVOTIONAL_QUESTIONS[i];
}
