// Biblioteca de devocionais pré-definidos (versículos Almeida, domínio público).
// Roda automaticamente: cada dia mostra um devocional, avançando 1 por dia e
// reiniciando o ciclo ao chegar ao fim. Mesmo devocional para toda a igreja no
// mesmo dia. Ninguém precisa escrever — basta adicionar itens a esta lista.

export interface DailyDevotional {
  title: string;
  ref: string;
  text: string;
  reflection: string;
  song?: string; // título de louvor sugerido (vira busca no YouTube)
}

export const DAILY_DEVOTIONALS: DailyDevotional[] = [
  {
    title: 'Deus é o seu Pastor',
    ref: 'Salmos 23:1',
    text: 'O Senhor é o meu pastor; nada me faltará.',
    reflection:
      'Antes de qualquer promessa, há uma Pessoa: o Senhor é o seu Pastor. É por causa de quem Ele é que você pode descansar hoje.\n\nEntregue a Ele o que está faltando e confie no cuidado de Quem conhece cada passo seu.',
    song: 'O Senhor é o meu Pastor louvor',
  },
  {
    title: 'O amor que salva',
    ref: 'João 3:16',
    text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    reflection:
      'O amor de Deus não é uma ideia distante: tem nome, rosto e sacrifício. Ele deu o que tinha de mais precioso por você.\n\nHoje, viva sabendo que você é profundamente amado — não pelo que faz, mas por quem Deus é.',
    song: 'Grande é o Senhor louvor',
  },
  {
    title: 'Tudo posso nEle',
    ref: 'Filipenses 4:13',
    text: 'Posso todas as coisas naquele que me fortalece.',
    reflection:
      'A força para o dia de hoje não vem de você, mas dEle. O segredo não é ser forte, é estar ligado à Fonte.\n\nSeja qual for o desafio, você não vai encará-lo sozinho: Cristo é a sua força.',
    song: 'Tua Graça Me Basta Toque no Altar',
  },
  {
    title: 'Não ande ansioso',
    ref: 'Filipenses 4:6-7',
    text: 'Não andeis ansiosos por coisa alguma; antes em tudo sejam os vossos pedidos conhecidos diante de Deus pela oração e súplica com ações de graças; e a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.',
    reflection:
      'Onde você colocaria preocupação, Deus pede que coloque oração. Troque a ansiedade por um pedido — e junte a ele um agradecimento.\n\nA promessa é uma paz que a mente não explica, mas o coração sente.',
    song: 'Deus Cuida de Mim Kleber Lucas',
  },
  {
    title: 'Ele coopera para o bem',
    ref: 'Romanos 8:28',
    text: 'E sabemos que todas as coisas concorrem para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.',
    reflection:
      'Nem tudo o que acontece é bom, mas Deus é capaz de tecer até as linhas tortas para um bem maior. Nada se perde nas mãos dEle.\n\nConfie: o capítulo de hoje não é o fim da história que Deus escreve para você.',
    song: 'Ainda Que a Figueira Nívea Soares',
  },
  {
    title: 'Não temas',
    ref: 'Isaías 41:10',
    text: 'não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.',
    reflection:
      'Três vezes Deus se compromete: eu te fortaleço, eu te ajudo, eu te sustento. O medo pergunta "e se eu cair?"; Deus responde "a minha mão te segura".\n\nVocê não caminha sozinho hoje.',
    song: 'Deus Está Aqui louvor',
  },
  {
    title: 'Seja forte e corajoso',
    ref: 'Josué 1:9',
    text: 'Não to mandei eu? Esforça-te, e tem bom ânimo; não te atemorizes, nem te espantes; porque o Senhor teu Deus está contigo, por onde quer que andares.',
    reflection:
      'A coragem que Deus pede não nasce da ausência de medo, mas da presença dEle. "Por onde quer que andares" não há lugar onde Ele não esteja.\n\nDê o próximo passo com ânimo: o Senhor vai com você.',
    song: 'Fé Anderson Freire',
  },
  {
    title: 'Refúgio na angústia',
    ref: 'Salmos 46:1',
    text: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.',
    reflection:
      'Deus não é um socorro distante que chega atrasado — Ele é "bem presente" exatamente na hora da angústia. Você pode correr para Ele agora.\n\nNo meio da tempestade, há um abrigo seguro: a presença do Senhor.',
    song: 'Meu Refúgio louvor',
  },
  {
    title: 'Confie de todo o coração',
    ref: 'Provérbios 3:5-6',
    text: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.',
    reflection:
      'Confiar é abrir mão de entender tudo. Quando reconhecemos Deus em cada caminho, Ele mesmo endireita o que está torto.\n\nHoje, entregue o controle a Quem enxerga o caminho inteiro.',
    song: 'Eu Confio em Ti louvor',
  },
  {
    title: 'Busque primeiro',
    ref: 'Mateus 6:33',
    text: 'Mas buscai primeiro o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas.',
    reflection:
      'Deus não ignora as suas necessidades — Ele apenas organiza a prioridade. Coloque-O em primeiro lugar e confie que o resto vem por acréscimo.\n\nO coração que busca a Deus não fica desamparado.',
    song: 'Consagração Aline Barros',
  },
  {
    title: 'Venha descansar',
    ref: 'Mateus 11:28',
    text: 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.',
    reflection:
      'Jesus não pede que você resolva tudo antes de chegar. Ele te chama do jeito que você está: cansado, sobrecarregado.\n\nO descanso que você procura não vem de fazer mais, mas de confiar mais.',
    song: 'Descansa Fernandinho',
  },
  {
    title: 'Ele cuida de você',
    ref: '1 Pedro 5:7',
    text: 'lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.',
    reflection:
      'Repare: "toda" a ansiedade, não só uma parte. E o motivo é o mais terno possível — "porque ele tem cuidado de vós".\n\nO que aperta o seu peito também toca o coração de Deus.',
    song: 'Deus Cuida de Mim louvor',
  },
  {
    title: 'Deus supre',
    ref: 'Filipenses 4:19',
    text: 'O meu Deus, segundo as suas riquezas, suprirá todas as vossas necessidades em glória, por Cristo Jesus.',
    reflection:
      'A medida da provisão de Deus não é o tamanho da sua carteira, mas o tamanho das riquezas dEle — e elas não têm fim.\n\nEle promete suprir tudo o que você realmente precisa.',
    song: 'Jeová Jireh louvor',
  },
  {
    title: 'Entregue o seu caminho',
    ref: 'Salmos 37:5',
    text: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.',
    reflection:
      'Entregar é mais do que pedir ajuda: é colocar o volante nas mãos de Deus. Depois de entregar, descanse — a parte que sobra é dEle.\n\n"Ele tudo fará" é uma promessa para quem confia.',
    song: 'Entrego a Ti louvor',
  },
  {
    title: 'Planos de paz',
    ref: 'Jeremias 29:11',
    text: 'Pois eu bem sei os planos que estou projetando para vós, diz o Senhor; planos de paz, e não de mal, para vos dar um futuro e uma esperança.',
    reflection:
      'Mesmo quando o presente confunde, os planos de Deus para você são de paz. Ele enxerga um futuro que você ainda não vê.\n\nHaja o que houver, a esperança tem fundamento: o coração de Deus por você é bom.',
    song: 'Deus de Promessas Toque no Altar',
  },
  {
    title: 'Uma nova criatura',
    ref: '2 Coríntios 5:17',
    text: 'Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.',
    reflection:
      'Em Cristo, você não é uma versão remendada do antigo — você é feito novo. Sua identidade não está no fracasso, mas em quem Ele diz que você é.\n\nO novo não depende da sua força, mas da obra dEle em você.',
    song: 'Faz Um Milagre em Mim Regis Danese',
  },
  {
    title: 'Salvos pela graça',
    ref: 'Efésios 2:8-9',
    text: 'Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus. Não vem das obras, para que ninguém se glorie.',
    reflection:
      'A salvação é presente, não salário. Você não precisa conquistar o amor de Deus — só receber.\n\nDescanse hoje: o seu valor não está no que você faz, mas na graça que recebeu.',
    song: 'Ousado Amor louvor',
  },
  {
    title: 'Faça de coração',
    ref: 'Colossenses 3:23',
    text: 'E, tudo quanto fizerdes, fazei-o de coração, como ao Senhor, e não aos homens.',
    reflection:
      'Não existe tarefa pequena quando é feita para Deus. O trabalho comum vira adoração quando o coração está certo.\n\nSeja qual for a sua função hoje, faça-a como quem serve ao Senhor.',
    song: 'Tudo Rende-se a Ti louvor',
  },
  {
    title: 'A fé é a certeza',
    ref: 'Hebreus 11:1',
    text: 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não vêem.',
    reflection:
      'Fé não é sentir tudo resolvido — é firmar-se em Deus antes da resposta chegar. É enxergar com o coração o que os olhos ainda não veem.\n\nHoje, dê um passo de fé confiando em Quem nunca falha.',
    song: 'Creio Toque no Altar',
  },
  {
    title: 'Peça sabedoria',
    ref: 'Tiago 1:5',
    text: 'E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente e o não lança em rosto, e ser-lhe-á dada.',
    reflection:
      'Diante de uma decisão difícil, você não precisa acertar sozinho. Deus dá sabedoria de graça, sem cobrar e sem humilhar.\n\nAntes de escolher hoje, pare e peça direção a Ele.',
    song: 'Ao Único Fernandinho',
  },
  {
    title: 'À sombra do Altíssimo',
    ref: 'Salmos 91:1-2',
    text: 'Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.',
    reflection:
      'Existe um lugar seguro em qualquer tempestade: a presença de Deus. Não é um esconderijo para fugir da vida, mas um abrigo para atravessá-la.\n\nHabite nesse lugar hoje.',
    song: 'Salmo 91 louvor',
  },
  {
    title: 'O Senhor é minha luz',
    ref: 'Salmos 27:1',
    text: 'O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?',
    reflection:
      'Onde há luz, o medo perde o poder de esconder. Se o Senhor é a sua luz, a escuridão não tem a última palavra.\n\nEncare o dia lembrando de quem está com você.',
    song: 'Minha Luz louvor',
  },
  {
    title: 'Misericórdias novas',
    ref: 'Lamentações 3:22-23',
    text: 'As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade.',
    reflection:
      'Todo amanhecer traz um estoque novo da misericórdia de Deus. Você não está preso ao erro de ontem.\n\nEsta manhã veio com misericórdias novas — aproveite-as.',
    song: 'As Misericórdias do Senhor louvor',
  },
  {
    title: 'A alegria do Senhor é força',
    ref: 'Neemias 8:10',
    text: 'Não vos entristeçais, porque a alegria do Senhor é a vossa força.',
    reflection:
      'A força para hoje não vem de circunstâncias animadoras, mas de uma alegria que nasce de Deus. Ela sustenta mesmo quando o dia pesa.\n\nBusque a alegria do Senhor — ela é combustível para seguir.',
    song: 'Alegria Fernandinho',
  },
  {
    title: 'Renovar as forças',
    ref: 'Isaías 40:31',
    text: 'mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.',
    reflection:
      'Esperar em Deus não é ficar parado, é trocar de fonte de energia. Quem espera nEle voa mais alto e caminha mais longe.\n\nEntregue o cansaço e receba forças renovadas.',
    song: 'Como Águia louvor',
  },
  {
    title: 'Deleite-se no Senhor',
    ref: 'Salmos 37:4',
    text: 'Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração.',
    reflection:
      'Quando encontramos prazer em Deus, Ele molda os nossos desejos e os cumpre. O segredo não é forçar respostas, é amar mais a Ele.\n\nHoje, encontre alegria na presença do Senhor.',
    song: 'Meu Prazer louvor',
  },
  {
    title: 'A paz que Ele dá',
    ref: 'João 14:27',
    text: 'Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.',
    reflection:
      'A paz do mundo depende de tudo dar certo. A paz de Jesus é herança, e permanece mesmo no meio da tempestade.\n\nEscolha não deixar o coração se turbar: a paz já foi dada.',
    song: 'Deus da Minha Paz Toque no Altar',
  },
  {
    title: 'Deus é fiel',
    ref: '1 Coríntios 10:13',
    text: 'Não veio sobre vós tentação, senão humana; mas fiel é Deus, que vos não deixará tentar acima do que podeis, antes com a tentação dará também o escape, para que a possais suportar.',
    reflection:
      'Nenhuma luta que você enfrenta é maior do que a fidelidade de Deus. Junto com a prova, Ele já preparou uma saída.\n\nVocê não vai ser esmagado: o Senhor mede o peso e oferece o escape.',
    song: 'Tu és Fiel Senhor louvor',
  },
  {
    title: 'O Senhor peleja por você',
    ref: 'Êxodo 14:14',
    text: 'O Senhor pelejará por vós, e vós vos calareis.',
    reflection:
      'Há batalhas que não são suas para vencer, mas para entregar. Enquanto você silencia a ansiedade, Deus entra em ação.\n\nDescanse: quem luta por você é maior do que aquilo que está contra você.',
    song: 'O Senhor Pelejará louvor',
  },
  {
    title: 'Gratidão em tudo',
    ref: '1 Tessalonicenses 5:18',
    text: 'Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.',
    reflection:
      'O texto diz "em tudo", não "por tudo". Em qualquer circunstância há motivos para agradecer — a vida, o fôlego, a presença de Deus.\n\nComece hoje agradecendo, antes de pedir. A gratidão muda os olhos com que você vê o dia.',
    song: 'Gratidão louvor',
  },
];

// Índice do dia (fuso BR, UTC-3): dias desde a época, avança 1 por dia.
function dayIndexBR(): number {
  const br = Date.now() - 3 * 60 * 60 * 1000;
  return Math.floor(br / 86_400_000);
}

export function devotionalOfDay(seed?: number): DailyDevotional {
  const idx = seed ?? dayIndexBR();
  const i = ((idx % DAILY_DEVOTIONALS.length) + DAILY_DEVOTIONALS.length) %
    DAILY_DEVOTIONALS.length;
  return DAILY_DEVOTIONALS[i];
}

// Semente estável do dia (para variar a arte da imagem por dia).
export function daySeed(): number {
  return dayIndexBR();
}
