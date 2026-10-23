/**
 * Modelos de curso.
 *
 * Isto é RASCUNHO, não doutrina da igreja. Os modelos ficam no código e só
 * viram curso quando alguém do painel escolhe criar a partir deles — e aí
 * tudo é editável antes de publicar. Ensino sobre batismo e casamento é
 * assunto pastoral: nada aqui deve ir ao ar sem o pastor ler e aprovar.
 */

export interface ModeloLicao {
  title: string;
  content: string;
  bibleRefs: string[];
  question?: string;
}

export interface ModeloCurso {
  id: string;
  title: string;
  description: string;
  kind: 'BAPTISM' | 'MARRIAGE' | 'OTHER';
  couple: boolean;
  lessons: ModeloLicao[];
}

export const MODELOS: ModeloCurso[] = [
  {
    id: 'batismo',
    title: 'Preparação para o Batismo',
    description:
      'Oito lições curtas para quem decidiu descer às águas. Faça no seu tempo; ao final, conversamos pessoalmente.',
    kind: 'BAPTISM',
    couple: false,
    lessons: [
      {
        title: 'Por que estamos conversando sobre isso',
        content:
          'Você decidiu se batizar. Antes de marcar a data, queremos caminhar um pouco com você — não para testar se você merece, mas para que o dia signifique o que deve significar.\n\nO batismo não é um rito de passagem da igreja nem um diploma de bom comportamento. É a sua resposta pública a algo que já aconteceu por dentro: você creu em Jesus e decidiu segui-lo.\n\nEstas oito lições são curtas. Leia uma por dia, ou uma por semana, como der. No fim, você conversa com o pastor — e é essa conversa, não o aplicativo, que fecha a preparação.',
        bibleRefs: ['Atos 2:38-41'],
        question: 'O que te levou a decidir se batizar agora?',
      },
      {
        title: 'O que vem antes: arrependimento e fé',
        content:
          'No dia de Pentecostes, as pessoas ouviram a pregação e perguntaram: "que faremos?" A resposta de Pedro veio em duas partes — arrependei-vos, e seja cada um batizado.\n\nA ordem importa. O arrependimento não é só sentir culpa; é mudar de direção, concordar com Deus sobre o que estava errado e voltar-se para Ele. A fé é confiar que Jesus já pagou o que você não tinha como pagar.\n\nO batismo vem depois, porque ele anuncia uma coisa que já é verdade. Molhar alguém que não creu não produz nada — é só água.',
        bibleRefs: ['Atos 2:37-38', 'Marcos 1:15', 'Efésios 2:8-9'],
        question: 'Do que você precisou se arrepender ao decidir seguir a Jesus?',
      },
      {
        title: 'Jesus também foi batizado',
        content:
          'Jesus não tinha pecado do que se arrepender, e mesmo assim foi ao Jordão e pediu a João que o batizasse. João resistiu, achando que era o contrário que deveria acontecer. Jesus respondeu que era assim que convinha cumprir toda a justiça.\n\nEle não precisava — mas se colocou no lugar de quem precisa. E quando saiu da água, o céu se abriu e o Pai falou.\n\nSeguir a Jesus inclui fazer o que Ele fez. O batismo é um dos primeiros passos de obediência de quem decidiu andar atrás dele.',
        bibleRefs: ['Mateus 3:13-17'],
        question: 'O que te chama a atenção no batismo de Jesus?',
      },
      {
        title: 'O que o batismo significa',
        content:
          'Paulo explica o batismo como um sepultamento. Quem desce às águas está dizendo: a vida velha morreu com Cristo. Quem sobe está dizendo: e agora ando em novidade de vida, porque Ele ressuscitou.\n\nÉ por isso que a imagem é de morte e ressurreição, e não de limpeza superficial. Não é um banho — é um enterro e um nascimento, encenados diante de todos.\n\nNa prática isso quer dizer que há coisas que ficaram para trás. Não porque a igreja proibiu, mas porque pertencem à pessoa que morreu.',
        bibleRefs: ['Romanos 6:3-4', 'Colossenses 2:12'],
        question: 'O que, na sua vida, ficou do outro lado dessa linha?',
      },
      {
        title: 'Por imersão, e por que isso importa',
        content:
          'A palavra usada no Novo Testamento significa mergulhar, submergir. João batizava onde havia "muitas águas". Jesus "saiu da água". Filipe e o etíope "desceram ambos à água".\n\nBatizamos por imersão porque é o que o texto descreve — e porque a figura só funciona assim. Não dá para encenar um sepultamento com algumas gotas.\n\nNão é uma regra para complicar. É o cuidado de manter o sinal fazendo o que ele foi feito para fazer: contar uma história com o corpo.',
        bibleRefs: ['João 3:23', 'Atos 8:38-39', 'Marcos 1:10'],
      },
      {
        title: 'Quem pode ser batizado',
        content:
          'Em todos os relatos do Novo Testamento, o batismo vem depois da fé. Creram e foram batizados. Por isso batizamos pessoas que podem crer e decidir por si — e não bebês, que ainda não têm como responder.\n\nIsso não diz nada contra as crianças. Jesus as recebeu e as abençoou, e apresentamos nossos filhos ao Senhor. Mas o batismo é a resposta pessoal de alguém que creu.\n\nNão há idade mínima no texto. Há uma condição: entender o que está fazendo e querer fazê-lo.',
        bibleRefs: ['Atos 8:36-37', 'Atos 16:31-33', 'Marcos 10:13-16'],
        question: 'Você consegue explicar, com suas palavras, por que quer se batizar?',
      },
      {
        title: 'Depois da água: a vida em igreja',
        content:
          'Os que foram batizados em Atos 2 não voltaram para casa e seguiram sozinhos. Perseveravam na doutrina dos apóstolos, na comunhão, no partir do pão e nas orações.\n\nO batismo entrega você a uma família, não a um clube. É aqui que você vai ser conhecido pelo nome, cobrado com amor, socorrido quando precisar e chamado a servir quando puder.\n\nNinguém cresce sozinho no escuro. A planta que vinga é a que está no mesmo canteiro que as outras.',
        bibleRefs: ['Atos 2:42', 'Hebreus 10:24-25'],
        question: 'Em que parte da vida da igreja você gostaria de se envolver?',
      },
      {
        title: 'Preparando o seu dia',
        content:
          'Falta pouco. Algumas coisas práticas: traga uma muda de roupa e uma toalha; chegue um pouco antes; e convide as pessoas que importam para você — inclusive as que ainda não creem. Muita gente se reaproximou de Deus assistindo ao batismo de alguém que ama.\n\nAntes da data, você vai conversar com o pastor. Não é prova. É uma conversa para ouvir sua história, tirar dúvidas e orar com você.\n\nUma última coisa: o batismo não vai te tornar perfeito no dia seguinte. Ele marca de que lado você escolheu ficar enquanto caminha.',
        bibleRefs: ['Filipenses 1:6'],
        question: 'Quem você quer convidar para estar lá?',
      },
    ],
  },
  {
    id: 'noivos',
    title: 'Preparação para o Casamento',
    description:
      'Oito conversas para fazer a dois antes do grande dia. Cada um responde no seu celular, e vocês conversam depois.',
    kind: 'MARRIAGE',
    couple: true,
    lessons: [
      {
        title: 'O casamento foi ideia de Deus',
        content:
          'Antes de ser contrato, festa ou arranjo social, o casamento foi ideia de Deus. Ele olhou para o homem sozinho e disse que não era bom — e fez alguém que lhe correspondesse.\n\nIsso muda o ponto de partida. Vocês não estão inventando um acordo entre duas pessoas; estão entrando em algo que já existia e tem dono.\n\nAo longo destas lições, cada um de vocês vai responder no seu próprio celular. Depois conversem sobre o que escreveram. As respostas mais úteis para o pastor costumam ser justamente aquelas em que os dois responderam diferente.',
        bibleRefs: ['Gênesis 2:18-24'],
        question: 'Por que você quer casar com essa pessoa, especificamente?',
      },
      {
        title: 'Deixar, unir-se, tornar-se um',
        content:
          'O texto de Gênesis dá três movimentos, nessa ordem: deixa o pai e a mãe, une-se à sua mulher, e serão os dois uma só carne.\n\nDeixar não é abandonar a família — é mudar a prioridade. A partir do casamento, a lealdade principal passa a ser do casal. Casamentos sofrem quando um dos dois nunca saiu de casa por dentro.\n\nUnir-se é escolha diária, não um instante no altar. E tornar-se um é processo: leva anos, e passa por brigas, perdão e muita conversa chata.',
        bibleRefs: ['Gênesis 2:24', 'Mateus 19:4-6'],
        question: 'O que você precisa "deixar" para que esse casamento funcione?',
      },
      {
        title: 'Conversar de verdade',
        content:
          'A maior parte dos casais não briga por falta de amor; briga por falta de tradução. Um fala e o outro ouve outra coisa.\n\nTiago dá uma regra simples e difícil: pronto para ouvir, tardio para falar, tardio para se irar. Ouvir de verdade é esperar a pessoa terminar sem já estar montando a resposta.\n\nCombinem desde já uma hora da semana para conversar sem pressa e sem celular. Casal que só conversa sobre logística — conta, horário, compromisso — vira dois sócios morando juntos.',
        bibleRefs: ['Tiago 1:19', 'Provérbios 18:13'],
        question: 'Como você reage quando se sente mal interpretado?',
      },
      {
        title: 'O conflito que aproxima',
        content:
          'Vocês vão brigar. A pergunta não é se, mas como.\n\nA Bíblia não manda evitar o conflito; manda não deixar que ele apodreça. "Não se ponha o sol sobre a vossa ira" é um prazo, não um conselho vago. Discussão guardada de um dia para o outro vira mágoa, e mágoa vira parede.\n\nDuas combinações que ajudam: não discutir para vencer, e nunca ameaçar o casamento no meio de uma briga. Quem usa a palavra "separação" como arma está quebrando a casa para ganhar uma discussão.',
        bibleRefs: ['Efésios 4:26-27', 'Provérbios 15:1'],
        question: 'Como era resolvido o conflito na casa em que você cresceu?',
      },
      {
        title: 'Dinheiro a dois',
        content:
          'Dinheiro é um dos assuntos que mais quebram casamentos, e quase sempre porque o casal nunca falou claramente sobre ele.\n\nAntes de casar, cada um precisa saber: quanto o outro ganha, quanto deve, como foi criado para lidar com dinheiro e o que considera gasto bobo. Dívida escondida é uma bomba com relógio.\n\nDecidam também o que farão juntos: como vão orçar, quem cuida do quê, quanto vão poupar e como pretendem contribuir com a obra de Deus. Jesus falou mais de dinheiro do que de céu — não é assunto pequeno.',
        bibleRefs: ['Lucas 14:28', 'Provérbios 22:7', '1 Timóteo 6:10'],
        question: 'Que dívidas e compromissos financeiros você traz para o casamento?',
      },
      {
        title: 'Intimidade e fidelidade',
        content:
          'A intimidade no casamento é presente de Deus, e o Novo Testamento fala dela com franqueza: o corpo de cada um pertence também ao outro, e não devem privar-se um do outro senão de comum acordo.\n\nFidelidade começa muito antes da traição. Começa no que você olha, no que você responde, na conversa que você prefere ter com outra pessoa em vez de ter com quem vive ao seu lado.\n\nProtejam o que é de vocês dois. O que precisa ser escondido do seu cônjuge já é um problema, mesmo que ainda não tenha nome.',
        bibleRefs: ['1 Coríntios 7:3-5', 'Hebreus 13:4', 'Mateus 5:28'],
        question: 'O que, para você, já conta como quebra de confiança?',
      },
      {
        title: 'Famílias, sogros e limites',
        content:
          'Vocês não casam só com uma pessoa; casam com uma história, uma família e um jeito de fazer as coisas.\n\nHonrar pai e mãe continua valendo depois do casamento. Mas honrar não é obedecer: a casa de vocês tem dois donos, e as decisões são dos dois.\n\nCombinem agora, antes do primeiro atrito: como serão as festas de fim de ano, com que frequência visitam cada família, e o que vocês não vão contar para ninguém de fora. Casal que resolve isso em paz economiza anos de desgaste.',
        bibleRefs: ['Êxodo 20:12', 'Gênesis 2:24'],
        question: 'Que limite com as famílias vocês precisam combinar antes de casar?',
      },
      {
        title: 'O lar que vocês vão construir',
        content:
          'Daqui a dez anos, o que vocês querem que seja verdade sobre essa casa? Que tipo de lugar ela será para quem entrar?\n\nJesus comparou duas casas iguais por fora. A diferença estava no que não se via: a rocha debaixo. A tempestade veio para as duas.\n\nDecidam desde já as coisas pequenas que sustentam o resto: orar juntos, estar na igreja, servir em alguma coisa, abrir a casa para outras pessoas. Casamento não se sustenta por sentimento — se sustenta por hábito e por aliança.',
        bibleRefs: ['Mateus 7:24-27', 'Josué 24:15', 'Eclesiastes 4:12'],
        question: 'Que hábito vocês querem que exista nessa casa desde o primeiro mês?',
      },
    ],
  },
];
