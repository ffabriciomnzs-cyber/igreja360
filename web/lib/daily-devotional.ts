// Biblioteca de devocionais pré-definidos (versículos Almeida, domínio público).
// GERADO automaticamente por scripts/gen-devotionals — os textos dos versículos
// são extraídos da Bíblia do projeto (web/public/bible). Roda sozinho: cada dia
// mostra um devocional, avançando 1 por dia e reiniciando o ciclo ao terminar.
// Mesmo devocional para toda a igreja no mesmo dia. Para ampliar, adicione itens.

export interface DailyDevotional {
  title: string;
  ref: string;
  text: string;
  reflection: string;
  song?: string;
}

export const DAILY_DEVOTIONALS: DailyDevotional[] = [
  {
    "title": "Deus é o seu Pastor",
    "ref": "Salmos 23:1",
    "text": "O Senhor é o meu pastor; nada me faltará.",
    "reflection": "Antes de qualquer promessa, há uma Pessoa: o Senhor é o seu Pastor. É por causa de quem Ele é que você pode descansar hoje.\n\nEntregue a Ele o que está faltando e confie no cuidado de Quem conhece cada passo seu.",
    "song": "O Senhor é o meu Pastor"
  },
  {
    "title": "O amor que salva",
    "ref": "João 3:16",
    "text": "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    "reflection": "O amor de Deus não é uma ideia distante: tem nome, rosto e sacrifício. Ele deu o que tinha de mais precioso por você.\n\nViva hoje sabendo que é profundamente amado — não pelo que faz, mas por quem Deus é.",
    "song": "Deus é Amor"
  },
  {
    "title": "Tudo posso nEle",
    "ref": "Filipenses 4:13",
    "text": "Posso todas as coisas naquele que me fortalece.",
    "reflection": "A força para hoje não vem de você, mas dEle. O segredo não é ser forte, é estar ligado à Fonte.\n\nSeja qual for o desafio, você não vai encará-lo sozinho: Cristo é a sua força.",
    "song": "Tua Graça Me Basta"
  },
  {
    "title": "Não temas",
    "ref": "Isaías 41:10",
    "text": "não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.",
    "reflection": "Três vezes Deus se compromete: eu te fortaleço, eu te ajudo, eu te sustento. O medo pergunta \"e se eu cair?\"; Deus responde \"a minha mão te segura\".\n\nVocê não caminha sozinho hoje.",
    "song": "Deus Está Aqui"
  },
  {
    "title": "Confie de todo o coração",
    "ref": "Provérbios 3:5-6",
    "text": "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.",
    "reflection": "Confiar é abrir mão de entender tudo. Quando reconhecemos Deus em cada caminho, Ele mesmo endireita o que está torto.\n\nEntregue o controle a Quem enxerga o caminho inteiro.",
    "song": "Eu Confio em Ti"
  },
  {
    "title": "Venha descansar",
    "ref": "Mateus 11:28",
    "text": "Vinde a mim, todos os que estai cansados e oprimidos, e eu vos aliviarei.",
    "reflection": "Jesus não pede que você resolva tudo antes de chegar. Ele te chama do jeito que você está: cansado, sobrecarregado.\n\nO descanso que você procura não vem de fazer mais, mas de confiar mais.",
    "song": "Descansa"
  },
  {
    "title": "Planos de paz",
    "ref": "Jeremias 29:11",
    "text": "Pois eu bem sei os planos que estou projetando para vós, diz o Senhor; planos de paz, e não de mal, para vos dar um futuro e uma esperança.",
    "reflection": "Mesmo quando o presente confunde, os planos de Deus para você são de paz. Ele enxerga um futuro que você ainda não vê.\n\nA esperança tem fundamento: o coração de Deus por você é bom.",
    "song": "Deus de Promessas"
  },
  {
    "title": "Refúgio na angústia",
    "ref": "Salmos 46:1",
    "text": "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.",
    "reflection": "Deus não é um socorro distante que chega atrasado — Ele é \"bem presente\" na hora exata da angústia.\n\nNo meio da tempestade, há um abrigo seguro: a presença do Senhor.",
    "song": "Meu Refúgio"
  },
  {
    "title": "Ele coopera para o bem",
    "ref": "Romanos 8:28",
    "text": "E sabemos que todas as coisas concorrem para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.",
    "reflection": "Nem tudo o que acontece é bom, mas Deus tece até as linhas tortas para um bem maior. Nada se perde nas mãos dEle.\n\nO capítulo de hoje não é o fim da história que Ele escreve para você.",
    "song": "Ainda Que a Figueira"
  },
  {
    "title": "Não ande ansioso",
    "ref": "Filipenses 4:6-7",
    "text": "Não andeis ansiosos por coisa alguma; antes em tudo sejam os vossos pedidos conhecidos diante de Deus pela oração e súplica com ações de graças; e a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.",
    "reflection": "Onde você colocaria preocupação, Deus pede que coloque oração. Troque a ansiedade por um pedido — e some a ele um agradecimento.\n\nA promessa é uma paz que a mente não explica, mas o coração sente.",
    "song": "Deus Cuida de Mim"
  },
  {
    "title": "De onde vem o socorro",
    "ref": "Salmos 121:1-2",
    "text": "Elevo os meus olhos para os montes; de onde me vem o socorro? O meu socorro vem do Senhor, que fez os céus e a terra.",
    "reflection": "Levantar os olhos é reconhecer que a ajuda não vem de você mesmo. Ela vem do Senhor, que fez os céus e a terra.\n\nSeja qual for o monte à sua frente, o seu socorro tem endereço certo.",
    "song": "A Ti Levanto os Olhos"
  },
  {
    "title": "Ele cuida de você",
    "ref": "1 Pedro 5:7",
    "text": "lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.",
    "reflection": "Repare: \"toda\" a ansiedade, não só uma parte. E o motivo é o mais terno possível — \"porque ele tem cuidado de vós\".\n\nO que aperta o seu peito também toca o coração de Deus.",
    "song": "Deus Cuida de Mim"
  },
  {
    "title": "Forte e corajoso",
    "ref": "Josué 1:9",
    "text": "Não to mandei eu? Esforça-te, e tem bom ânimo; não te atemorizes, nem te espantes; porque o Senhor teu Deus está contigo, por onde quer que andares.",
    "reflection": "A coragem que Deus pede não nasce da ausência de medo, mas da presença dEle. \"Por onde quer que andares\" não há lugar onde Ele não esteja.\n\nDê o próximo passo com ânimo.",
    "song": "Fé"
  },
  {
    "title": "Renovar as forças",
    "ref": "Isaías 40:31",
    "text": "mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão, e não se cansarão; andarão, e não se fatigarão.",
    "reflection": "Esperar em Deus não é ficar parado, é trocar de fonte de energia. Quem espera nEle voa mais alto e caminha mais longe.\n\nEntregue o cansaço e receba forças renovadas.",
    "song": "Como Águia"
  },
  {
    "title": "A paz que Ele dá",
    "ref": "João 14:27",
    "text": "Deixo-vos a paz, a minha paz vos dou; eu não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.",
    "reflection": "A paz do mundo depende de tudo dar certo. A paz de Jesus é herança, e permanece mesmo na tempestade.\n\nEscolha não deixar o coração se turbar: a paz já foi dada.",
    "song": "Deus da Minha Paz"
  },
  {
    "title": "Misericórdias novas",
    "ref": "Lamentações 3:22-23",
    "text": "A benignidade do Senhor jamais acaba, as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade.",
    "reflection": "Todo amanhecer traz um estoque novo da misericórdia de Deus. Você não está preso ao erro de ontem.\n\nEsta manhã veio com misericórdias novas — aproveite-as.",
    "song": "As Misericórdias do Senhor"
  },
  {
    "title": "Entregue o seu caminho",
    "ref": "Salmos 37:5",
    "text": "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.",
    "reflection": "Entregar é mais do que pedir ajuda: é colocar o volante nas mãos de Deus. Depois de entregar, descanse.\n\n\"Ele tudo fará\" é uma promessa para quem confia.",
    "song": "Entrego a Ti"
  },
  {
    "title": "Uma nova criatura",
    "ref": "2 Coríntios 5:17",
    "text": "Pelo que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.",
    "reflection": "Em Cristo, você não é uma versão remendada do antigo — você é feito novo. Sua identidade não está no fracasso, mas em quem Ele diz que você é.\n\nO novo não depende da sua força, mas da obra dEle.",
    "song": "Faz Um Milagre em Mim"
  },
  {
    "title": "Busque primeiro",
    "ref": "Mateus 6:33",
    "text": "Mas buscai primeiro o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas.",
    "reflection": "Deus não ignora as suas necessidades — Ele apenas organiza a prioridade. Coloque-O em primeiro lugar e confie que o resto vem por acréscimo.\n\nO coração que busca a Deus não fica desamparado.",
    "song": "Consagração"
  },
  {
    "title": "Perto do coração quebrado",
    "ref": "Salmos 34:18",
    "text": "Perto está o Senhor dos que têm o coração quebrantado, e salva os contritos de espírito.",
    "reflection": "Deus não se afasta da sua dor; Ele se aproxima dela. Está perto dos que têm o coração quebrantado.\n\nSe hoje dói, saiba: você não chora sozinho.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Salvos pela graça",
    "ref": "Efésios 2:8-9",
    "text": "Porque pela graça sois salvos, por meio da fé, e isto não vem de vós, é dom de Deus; não vem das obras, para que ninguém se glorie.",
    "reflection": "A salvação é presente, não salário. Você não precisa conquistar o amor de Deus — só recebê-lo.\n\nDescanse: seu valor não está no que você faz, mas na graça que recebeu.",
    "song": "Ousado Amor"
  },
  {
    "title": "À sombra do Altíssimo",
    "ref": "Salmos 91:1-2",
    "text": "Aquele que habita no esconderijo do Altíssimo, à sombra do Todo-Poderoso descansará. Direi do Senhor: Ele é o meu refúgio e a minha fortaleza, o meu Deus, em quem confio.",
    "reflection": "Existe um lugar seguro em qualquer tempestade: a presença de Deus. Não é fuga da vida, mas abrigo para atravessá-la.\n\nHabite nesse lugar hoje.",
    "song": "Lugar Secreto"
  },
  {
    "title": "A certeza da fé",
    "ref": "Hebreus 11:1",
    "text": "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que não se vêem.",
    "reflection": "Fé não é sentir tudo resolvido — é firmar-se em Deus antes da resposta chegar. É ver com o coração o que os olhos ainda não veem.\n\nDê um passo de fé confiando em Quem nunca falha.",
    "song": "Creio"
  },
  {
    "title": "Deus supre",
    "ref": "Filipenses 4:19",
    "text": "Meu Deus suprirá todas as vossas necessidades segundo as suas riquezas na glória em Cristo Jesus.",
    "reflection": "A medida da provisão de Deus não é o tamanho da sua carteira, mas o tamanho das riquezas dEle — e elas não têm fim.\n\nEle promete suprir tudo o que você realmente precisa.",
    "song": "Jeová Jireh"
  },
  {
    "title": "O Senhor é minha luz",
    "ref": "Salmos 27:1",
    "text": "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?",
    "reflection": "Onde há luz, o medo perde o poder de esconder. Se o Senhor é a sua luz, a escuridão não tem a última palavra.\n\nEncare o dia lembrando de quem está com você.",
    "song": "Minha Luz"
  },
  {
    "title": "Peça sabedoria",
    "ref": "Tiago 1:5",
    "text": "Ora, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente e não censura, e ser-lhe-á dada.",
    "reflection": "Diante de uma decisão difícil, você não precisa acertar sozinho. Deus dá sabedoria de graça, sem cobrar e sem humilhar.\n\nAntes de escolher hoje, pare e peça direção a Ele.",
    "song": "Ao Único"
  },
  {
    "title": "Deleite-se no Senhor",
    "ref": "Salmos 37:4",
    "text": "Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração.",
    "reflection": "Quando encontramos prazer em Deus, Ele molda os nossos desejos e os cumpre. O segredo não é forçar respostas, é amar mais a Ele.\n\nEncontre alegria na presença do Senhor.",
    "song": "Meu Prazer"
  },
  {
    "title": "Nas águas e no fogo",
    "ref": "Isaías 43:2",
    "text": "Quando passares pelas águas, eu serei contigo; quando pelos rios, eles não te submergirão; quando passares pelo fogo, não te queimarás, nem a chama arderá em ti.",
    "reflection": "Deus não promete um caminho sem rios nem fogo, mas promete estar com você quando eles vierem. As águas não vão te afogar.\n\nVocê pode atravessar, porque Ele atravessa com você.",
    "song": "Oceanos"
  },
  {
    "title": "Deus é fiel",
    "ref": "1 Coríntios 10:13",
    "text": "Não vos sobreveio nenhuma tentação, senão humana; mas fiel é Deus, o qual não deixará que sejais tentados acima do que podeis resistir, antes com a tentação dará também o meio de saída, para que a possais suportar.",
    "reflection": "Nenhuma luta que você enfrenta é maior que a fidelidade de Deus. Junto com a prova, Ele já preparou uma saída.\n\nVocê não vai ser esmagado: o Senhor mede o peso e oferece o escape.",
    "song": "Tu és Fiel Senhor"
  },
  {
    "title": "A alegria do Senhor é força",
    "ref": "Neemias 8:10",
    "text": "Disse-lhes mais: Ide, comei as gorduras, e bebei as doçuras, e enviai porções aos que não têm nada preparado para si; porque este dia é consagrado ao nosso Senhor. Portanto não vos entristeçais, pois a alegria do Senhor é a vossa força.",
    "reflection": "A força para hoje não vem de circunstâncias animadoras, mas de uma alegria que nasce de Deus.\n\nBusque a alegria do Senhor — ela é combustível para seguir.",
    "song": "Alegria"
  },
  {
    "title": "Lance o seu fardo",
    "ref": "Salmos 55:22",
    "text": "Lança o teu fardo sobre o Senhor, e ele te susterá; nunca permitirá que o justo seja abalado.",
    "reflection": "Deus convida você a lançar o fardo, não a carregá-lo com mais força. Quem confia não será abalado para sempre.\n\nSolte hoje o peso que não é seu para carregar.",
    "song": "Entrego a Ti"
  },
  {
    "title": "Um dia de cada vez",
    "ref": "Mateus 6:34",
    "text": "Não vos inquieteis, pois, pelo dia de amanhã; porque o dia de amanhã cuidará de si mesmo. Basta a cada dia o seu mal.",
    "reflection": "Grande parte da ansiedade mora no amanhã. Deus dá graça medida para o dia de hoje.\n\nFaça a parte de hoje; amanhã Ele já estará lá com novo suprimento.",
    "song": "Um Dia de Cada Vez"
  },
  {
    "title": "Nada nos separa",
    "ref": "Romanos 8:38-39",
    "text": "Porque estou certo de que, nem a morte, nem a vida, nem anjos, nem principados, nem coisas presentes, nem futuras, nem potestades, nem a altura, nem a profundidade, nem qualquer outra criatura nos poderá separar do amor de Deus, que está em Cristo Jesus nosso Senhor.",
    "reflection": "Nem morte, nem vida, nem altura, nem profundidade: nada é capaz de te arrancar do amor de Deus.\n\nQuando você duvidar do seu valor, lembre do que não pode te separar dEle.",
    "song": "Ousado Amor"
  },
  {
    "title": "Aquietar-se e saber",
    "ref": "Salmos 46:10",
    "text": "Aquietai-vos, e sabei que eu sou Deus; sou exaltado entre as nações, sou exaltado na terra.",
    "reflection": "Há uma força que só nasce no silêncio: parar e reconhecer que Ele é Deus. Aquietar-se não é desistir, é confiar.\n\nSepare um instante hoje só para estar diante dEle.",
    "song": "Sonda-me"
  },
  {
    "title": "Ele dirige os passos",
    "ref": "Provérbios 16:9",
    "text": "O coração do homem propõe o seu caminho; mas o Senhor lhe dirige os passos.",
    "reflection": "Você planeja, e faz bem em planejar. Mas é o Senhor quem firma e dirige cada passo.\n\nEntregue seus planos a Deus e caminhe com o coração tranquilo.",
    "song": "Deus de Promessas"
  },
  {
    "title": "Bom ânimo",
    "ref": "João 16:33",
    "text": "Tenho-vos dito estas coisas, para que em mim tenhais paz. No mundo tereis tribulações; mas tende bom ânimo, eu venci o mundo.",
    "reflection": "Jesus foi honesto: no mundo há aflição. Mas Ele já venceu o mundo, e a vitória dEle é a sua paz.\n\nTenha bom ânimo hoje — o fim da história já está garantido.",
    "song": "Deus do Impossível"
  },
  {
    "title": "Não esqueça os benefícios",
    "ref": "Salmos 103:2",
    "text": "Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum dos seus benefícios.",
    "reflection": "A pressa faz a gente esquecer o que Deus já fez. Davi conversa com a própria alma e a lembra de bendizer.\n\nRelembre hoje três coisas boas que Deus fez por você.",
    "song": "Gratidão"
  },
  {
    "title": "Paz perfeita",
    "ref": "Isaías 26:3",
    "text": "Tu conservarás em paz aquele cuja mente está firme em ti; porque ele confia em ti.",
    "reflection": "A paz completa é prometida a quem mantém o pensamento firme em Deus. O foco muda o coração.\n\nOnde estão os seus pensamentos hoje? Volte-os para Ele.",
    "song": "Deus da Minha Paz"
  },
  {
    "title": "A graça basta",
    "ref": "2 Coríntios 12:9",
    "text": "e ele me disse: A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza. Por isso, de boa vontade antes me gloriarei nas minhas fraquezas, a fim de que repouse sobre mim o poder de Cristo.",
    "reflection": "Deus não espera que você seja forte o tempo todo. É na fraqueza que o poder dEle se aperfeiçoa.\n\nOnde você se sente frágil, ali a graça dEle brilha mais.",
    "song": "Tua Graça Me Basta"
  },
  {
    "title": "Este é o dia",
    "ref": "Salmos 118:24",
    "text": "Este é o dia que o Senhor fez; regozijemo-nos, e alegremo-nos nele.",
    "reflection": "Cada novo dia é feito pelo Senhor — inclusive este. Há motivo para alegrar-se antes mesmo de saber o que virá.\n\nReceba hoje como presente das mãos de Deus.",
    "song": "Este é o Dia"
  },
  {
    "title": "Ele termina o que começou",
    "ref": "Filipenses 1:6",
    "text": "tendo por certo isto mesmo, que aquele que em vós começou a boa obra a aperfeiçoará até o dia de Cristo Jesus,",
    "reflection": "O que Deus começou em você, Ele é fiel para terminar. A obra não depende só da sua força.\n\nSiga em frente confiando que Ele completa o que iniciou.",
    "song": "Creio"
  },
  {
    "title": "Maravilhosamente feito",
    "ref": "Salmos 139:14",
    "text": "Eu te louvarei, porque de um modo tão admirável e maravilhoso fui formado; maravilhosas são as tuas obras, e a minha alma o sabe muito bem.",
    "reflection": "Você não é um acaso: foi formado com cuidado e propósito. As obras de Deus são maravilhosas, e você é uma delas.\n\nOlhe para si hoje com os olhos de quem foi criado com amor.",
    "song": "Maravilhosa Graça"
  },
  {
    "title": "Peça, busque, bata",
    "ref": "Mateus 7:7",
    "text": "Pedí, e dar-se-vos-á; buscai, e achareis; batei e abrir-se-vos-á.",
    "reflection": "A oração é um convite para insistir. Quem pede recebe, quem busca acha, e a quem bate a porta se abre.\n\nNão desista de orar pelo que Deus colocou no seu coração.",
    "song": "Preciso de Ti"
  },
  {
    "title": "O fruto do Espírito",
    "ref": "Gálatas 5:22-23",
    "text": "Mas o fruto do Espírito é: o amor, o gozo, a paz, a longanimidade, a benignidade, a bondade, a fidelidade. a mansidão, o domínio próprio; contra estas coisas não há lei.",
    "reflection": "A vida cristã não se mede por esforço, mas por fruto: amor, alegria, paz, paciência. É o Espírito que produz em nós.\n\nPeça hoje para que Ele cultive esse fruto em você.",
    "song": "Santo Espírito"
  },
  {
    "title": "A alegria vem de manhã",
    "ref": "Salmos 30:5",
    "text": "Porque a sua ira dura só um momento; no seu favor está a vida. O choro pode durar uma noite; pela manhã, porém, vem o cântico de júbilo.",
    "reflection": "O choro pode durar uma noite, mas não terá a última palavra. A alegria vem pela manhã.\n\nSe a noite está difícil, segure firme: o amanhecer de Deus está a caminho.",
    "song": "Alegria"
  },
  {
    "title": "Força ao cansado",
    "ref": "Isaías 40:29",
    "text": "Ele dá força ao cansado, e aumenta as forças ao que não tem nenhum vigor.",
    "reflection": "Deus se especializa em dar força justamente a quem já não tem nenhuma. Ao cansado, Ele multiplica o vigor.\n\nSe você chegou ao limite, esse é o lugar onde Deus age.",
    "song": "Como Águia"
  },
  {
    "title": "Permaneça nEle",
    "ref": "João 15:5",
    "text": "Eu sou a videira; vós sois as varas. Quem permanece em mim e eu nele, esse dá muito fruto; porque sem mim nada podeis fazer.",
    "reflection": "Separado de Cristo, nada podemos fazer; ligados a Ele, damos muito fruto. A chave é permanecer.\n\nFique perto de Jesus hoje — é dEle que vem a vida.",
    "song": "Rendido Estou"
  },
  {
    "title": "Só em Deus",
    "ref": "Salmos 62:1-2",
    "text": "Somente em Deus espera silenciosa a minha alma; dele vem a minha salvação. Só ele é a minha rocha e a minha salvação; é ele a minha fortaleza; não serei grandemente abalado.",
    "reflection": "A alma encontra descanso verdadeiro só em Deus. Ele é a rocha que não se move quando tudo balança.\n\nAncore o seu coração nEle e não será abalado.",
    "song": "Tu Reinas"
  },
  {
    "title": "Torre forte",
    "ref": "Provérbios 18:10",
    "text": "Torre forte é o nome do Senhor; para ela corre o justo, e está seguro.",
    "reflection": "O nome do Senhor é uma torre forte para onde o justo corre e fica seguro. Não é um muro de fuga, é um lugar de força.\n\nCorra para Deus hoje e encontre segurança.",
    "song": "Teu Santo Nome"
  },
  {
    "title": "Perdão garantido",
    "ref": "1 João 1:9",
    "text": "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça.",
    "reflection": "Deus é fiel e justo para perdoar quando confessamos. Não há mancha que o Seu perdão não alcance.\n\nNão carregue a culpa: leve-a a Ele e receba limpeza.",
    "song": "Nada Além do Sangue"
  },
  {
    "title": "Perto de quem O invoca",
    "ref": "Salmos 145:18",
    "text": "Perto está o Senhor de todos os que o invocam, de todos os que o invocam em verdade.",
    "reflection": "Deus está perto de todos os que O invocam de verdade. A oração sincera nunca cai no vazio.\n\nChame por Ele hoje — Ele está mais perto do que você imagina.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Ele não muda",
    "ref": "Hebreus 13:8",
    "text": "Jesus Cristo é o mesmo, ontem, e hoje, e eternamente.",
    "reflection": "Jesus é o mesmo ontem, hoje e para sempre. Num mundo instável, Ele é o ponto firme.\n\nO Deus que cuidou de você ontem é o mesmo que cuida hoje.",
    "song": "Tu és Fiel Senhor"
  },
  {
    "title": "Ele te instrui",
    "ref": "Salmos 32:8",
    "text": "Instruir-te-ei, e ensinar-te-ei o caminho que deves seguir; aconselhar-te-ei, tendo-te sob a minha vista.",
    "reflection": "Deus promete instruir e guiar, com os olhos postos em você. Você não precisa achar o caminho sozinho.\n\nPeça direção e siga confiando que Ele conduz.",
    "song": "Sonda-me"
  },
  {
    "title": "Fome e sede de justiça",
    "ref": "Mateus 5:6",
    "text": "Bem-aventurados os que têm fome e sede de justiça porque eles serão fartos.",
    "reflection": "Quem tem fome de Deus não fica de estômago vazio: será farto. O desejo por Ele já é o começo da resposta.\n\nAlimente hoje essa fome buscando a presença do Senhor.",
    "song": "Rendido Estou"
  },
  {
    "title": "Por Suas pisaduras",
    "ref": "Isaías 53:5",
    "text": "Mas ele foi ferido por causa das nossas transgressões, e esmagado por causa das nossas iniqüidades; o castigo que nos traz a paz estava sobre ele, e pelas suas pisaduras fomos sarados.",
    "reflection": "A cruz não foi um acidente: ali Jesus levou a nossa dor e as nossas feridas. Pelas pisaduras dEle, fomos sarados.\n\nLeve a Ele hoje aquilo que ainda dói.",
    "song": "Aos Pés da Cruz"
  },
  {
    "title": "Espera em Deus",
    "ref": "Salmos 42:11",
    "text": "Por que estás abatida, ó minha alma, e por que te perturbas dentro de mim? Espera em Deus, pois ainda o louvarei, a ele que é o meu socorro, e o meu Deus.",
    "reflection": "Até a alma abatida pode conversar consigo mesma e escolher esperar em Deus. O ânimo volta quando o olhar sobe.\n\nDiga ao seu coração hoje: espera no Senhor.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Faça de coração",
    "ref": "Colossenses 3:23",
    "text": "E tudo quanto fizerdes, fazei-o de coração, como ao Senhor, e não aos homens,",
    "reflection": "Não existe tarefa pequena quando é feita para Deus. O trabalho comum vira adoração.\n\nFaça o seu dia como quem serve ao Senhor.",
    "song": "Tudo Rende-se a Ti"
  },
  {
    "title": "Quando eu temer",
    "ref": "Salmos 56:3",
    "text": "No dia em que eu temer, hei de confiar em ti.",
    "reflection": "O medo vai bater, mas ele não precisa mandar. \"Quando eu temer, confiarei em ti\" — a confiança é uma escolha.\n\nTransforme cada medo de hoje em um convite para confiar.",
    "song": "Eu Confio em Ti"
  },
  {
    "title": "Bem-aventurado quem confia",
    "ref": "Jeremias 17:7",
    "text": "Bendito o varão que confia no Senhor, e cuja esperança é o Senhor.",
    "reflection": "Feliz é quem põe no Senhor a sua confiança. Essa pessoa é como árvore à beira das águas: não teme a seca.\n\nFinque as suas raízes em Deus hoje.",
    "song": "Deus de Promessas"
  },
  {
    "title": "A luz do mundo",
    "ref": "João 8:12",
    "text": "Então Jesus tornou a falar-lhes, dizendo: Eu sou a luz do mundo; quem me segue de modo algum andará em trevas, mas terá a luz da vida.",
    "reflection": "Quem segue Jesus não anda em trevas, mas tem a luz da vida. O caminho fica claro quando Ele vai à frente.\n\nDeixe Jesus iluminar o próximo passo.",
    "song": "Minha Luz"
  },
  {
    "title": "Deus é a minha porção",
    "ref": "Salmos 73:26",
    "text": "A minha carne e o meu coração desfalecem; do meu coração, porém, Deus é a fortaleza, e o meu quinhão para sempre.",
    "reflection": "O corpo e o coração podem enfraquecer, mas Deus é a força e a herança eterna. Ele é o que permanece quando tudo falha.\n\nApoie-se nEle, a sua porção para sempre.",
    "song": "Tu és Fiel Senhor"
  },
  {
    "title": "Não é espírito de medo",
    "ref": "2 Timóteo 1:7",
    "text": "Porque Deus não nos deu o espírito de covardia, mas de poder, de amor e de moderação.",
    "reflection": "Deus não te deu espírito de covardia, mas de poder, amor e moderação. O medo não define quem você é.\n\nCaminhe hoje na coragem que vem dEle.",
    "song": "Fé"
  },
  {
    "title": "Plenitude de alegria",
    "ref": "Salmos 16:11",
    "text": "Tu me farás conhecer a vereda da vida; na tua presença há plenitude de alegria; à tua mão direita há delícias perpetuamente.",
    "reflection": "Na presença de Deus há plenitude de alegria e delícias perpétuas. A verdadeira festa do coração acontece perto dEle.\n\nBusque hoje esse lugar de alegria.",
    "song": "Alegria"
  },
  {
    "title": "Guarde o coração",
    "ref": "Provérbios 4:23",
    "text": "Guarda com toda a diligência o teu coração, porque dele procedem as fontes da vida.",
    "reflection": "De tudo o que se guarda, o coração é o mais importante — dele procedem as saídas da vida. Cuide do que entra nele.\n\nProteja hoje o seu coração para Deus.",
    "song": "Sonda-me"
  },
  {
    "title": "Pensamentos mais altos",
    "ref": "Isaías 55:8-9",
    "text": "Porque os meus pensamentos não são os vossos pensamentos, nem os vossos caminhos os meus caminhos, diz o Senhor. Porque, assim como o céu é mais alto do que a terra, assim são os meus caminhos mais altos do que os vossos caminhos, e os meus pensamentos mais altos do que os vossos pensamentos.",
    "reflection": "Os caminhos de Deus são mais altos que os nossos. O que não entendemos, Ele enxerga do alto.\n\nConfie mesmo quando a lógica não fecha: Ele sabe.",
    "song": "Tua Palavra"
  },
  {
    "title": "Ele aperfeiçoa",
    "ref": "Salmos 138:8",
    "text": "O Senhor aperfeiçoará o que me diz respeito. A tua benignidade, ó Senhor, dura para sempre; não abandones as obras das tuas mãos.",
    "reflection": "O Senhor cumpre o Seu propósito em você e não abandona a obra das Suas mãos. Você não é um projeto largado.\n\nDeus está comprometido com o seu amanhã.",
    "song": "Creio"
  },
  {
    "title": "Para Deus, tudo é possível",
    "ref": "Mateus 19:26",
    "text": "Jesus, fixando neles o olhar, respondeu: Aos homens é isso impossível, mas a Deus tudo é possível.",
    "reflection": "O que é impossível para os homens é possível para Deus. Onde a sua força acaba, o poder dEle começa.\n\nEntregue hoje aquilo que parece impossível.",
    "song": "Deus do Impossível"
  },
  {
    "title": "Consolo na multidão de cuidados",
    "ref": "Salmos 94:19",
    "text": "Quando os cuidados do meu coração se multiplicam, as tuas consolações recreiam a minha alma.",
    "reflection": "Quando os cuidados se multiplicam por dentro, as consolações de Deus alegram a alma. Ele conhece o peso que ninguém vê.\n\nDeixe que Ele console você hoje.",
    "song": "Deus Cuida de Mim"
  },
  {
    "title": "Povo escolhido",
    "ref": "1 Pedro 2:9",
    "text": "Mas vós sois a geração eleita, o sacerdócio real, a nação santa, o povo todo seu para que proclameis as grandezas daquele que vos chamou das trevas para a sua maravilhosa luz,",
    "reflection": "Você é geração eleita, povo de propriedade de Deus, chamado das trevas para a Sua luz. Isso é identidade, não conquista.\n\nAnde hoje como filho da luz.",
    "song": "Digno é o Senhor"
  },
  {
    "title": "Escudo ao meu redor",
    "ref": "Salmos 3:3",
    "text": "Mas tu, Senhor, és um escudo ao redor de mim, a minha glória, e aquele que exulta a minha cabeça.",
    "reflection": "Deus é escudo em volta de você e Aquele que levanta a sua cabeça. Quando o desânimo abaixa o olhar, Ele o ergue.\n\nDeixe Deus levantar a sua cabeça hoje.",
    "song": "Tu Reinas"
  },
  {
    "title": "No que pensar",
    "ref": "Filipenses 4:8",
    "text": "Quanto ao mais, irmãos, tudo o que é verdadeiro, tudo o que é honesto, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se há alguma virtude, e se há algum louvor, nisso pensai.",
    "reflection": "Aquilo que é verdadeiro, honesto, puro e amável merece a sua mente. O que alimentamos por dentro cresce.\n\nEscolha hoje pensamentos que aproximam de Deus.",
    "song": "Tua Palavra"
  },
  {
    "title": "Sol e escudo",
    "ref": "Salmos 84:11",
    "text": "Porquanto o Senhor Deus é sol e escudo; o Senhor dará graça e glória; não negará bem algum aos que andam na retidão.",
    "reflection": "O Senhor é sol e escudo; dá graça e glória e não nega o bem a quem anda em integridade.\n\nConfie que Deus não vai reter de você aquilo que é bom.",
    "song": "Grande é o Senhor"
  },
  {
    "title": "Mente renovada",
    "ref": "Romanos 12:2",
    "text": "E não vos conformeis a este mundo, mas transformai-vos pela renovação da vossa mente, para que experimenteis qual seja a boa, agradável, e perfeita vontade de Deus.",
    "reflection": "A transformação começa por dentro, na renovação da mente. Não se molde ao mundo — deixe Deus reformar o seu pensar.\n\nEntregue hoje a sua mente para ser renovada.",
    "song": "Sonda-me"
  },
  {
    "title": "Ele sara os quebrantados",
    "ref": "Salmos 147:3",
    "text": "sara os quebrantados de coração, e cura-lhes as feridas;",
    "reflection": "Deus cuida das feridas do coração e faz curativo nelas. Nenhuma dor sua é ignorada pelo Céu.\n\nApresente a Ele hoje o que precisa ser curado.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Ele não te desampara",
    "ref": "Deuteronômio 31:6",
    "text": "Sede fortes e corajosos; não temais, nem vos atemorizeis diante deles; porque o Senhor vosso Deus é quem vai convosco. Não vos deixará, nem vos desamparará.",
    "reflection": "Sê forte e corajoso, porque o Senhor vai contigo e nunca te desampara nem te deixa. A presença dEle é a sua garantia.\n\nAvance sem medo: você não está só.",
    "song": "Deus Está Aqui"
  },
  {
    "title": "Esperei com paciência",
    "ref": "Salmos 40:1",
    "text": "Esperei com paciência pelo Senhor, e ele se inclinou para mim e ouviu o meu clamor.",
    "reflection": "A espera não foi em vão: Deus se inclinou e ouviu o clamor. Ele não está distraído.\n\nContinue esperando — o Senhor ouve e responde.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Alegria nas provas",
    "ref": "Tiago 1:2-3",
    "text": "Meus irmãos, tende por motivo de grande gozo o passardes por várias provações, sabendo que a aprovação da vossa fé produz a perseverança;",
    "reflection": "As provações produzem perseverança e amadurecem a fé. O que hoje incomoda pode estar te fortalecendo.\n\nPeça a Deus para enxergar propósito no que você atravessa.",
    "song": "Ainda Que a Figueira"
  },
  {
    "title": "Sede de Deus",
    "ref": "Salmos 63:1",
    "text": "Ó Deus, tu és o meu Deus; ansiosamente te busco. A minha alma tem sede de ti; a minha carne te deseja muito em uma terra seca e cansada, onde não há água.",
    "reflection": "A alma tem sede de Deus como terra seca tem sede de água. Nada além dEle mata essa sede.\n\nBusque cedo a presença do Senhor hoje.",
    "song": "Me Derramar"
  },
  {
    "title": "Renovado por dentro",
    "ref": "2 Coríntios 4:16",
    "text": "Por isso não desfalecemos; mas ainda que o nosso homem exterior se esteja consumindo, o interior, contudo, se renova de dia em dia.",
    "reflection": "Ainda que o exterior se desgaste, o interior se renova dia após dia. Deus trabalha por dentro, mesmo quando não se vê.\n\nNão desanime: a renovação é diária.",
    "song": "Como Águia"
  },
  {
    "title": "Provai e vede",
    "ref": "Salmos 34:8",
    "text": "Provai, e vede que o Senhor é bom; bem-aventurado o homem que nele se refugia.",
    "reflection": "Deus convida você a experimentar a Sua bondade: \"provai e vede que o Senhor é bom\". Bem-aventurado quem nEle confia.\n\nDê a Deus a chance de mostrar quão bom Ele é.",
    "song": "Grande é o Senhor"
  },
  {
    "title": "O que Deus pede",
    "ref": "Miquéias 6:8",
    "text": "Ele te declarou, ó homem, o que é bom; e que é o que o Senhor requer de ti, senão que pratiques a justiça, e ames a benevolência, e andes humildemente com o teu Deus?",
    "reflection": "Deus pede o essencial: praticar a justiça, amar a misericórdia e andar humildemente com Ele. Simples e profundo.\n\nViva hoje esses três verbos.",
    "song": "Rendido Estou"
  },
  {
    "title": "Coração puro",
    "ref": "Salmos 51:10",
    "text": "Cria em mim, ó Deus, um coração puro, e renova em mim um espírito estável.",
    "reflection": "Davi não pediu circunstâncias novas, mas um coração novo. A verdadeira mudança começa por dentro.\n\nPeça a Deus hoje um coração limpo e um espírito renovado.",
    "song": "Sonda-me"
  },
  {
    "title": "Chegue com confiança",
    "ref": "Hebreus 4:16",
    "text": "Cheguemo-nos, pois, confiadamente ao trono da graça, para que recebamos misericórdia e achemos graça, a fim de sermos socorridos no momento oportuno.",
    "reflection": "Podemos chegar ao trono da graça com ousadia, para receber misericórdia e socorro na hora certa.\n\nNão hesite: aproxime-se de Deus com confiança hoje.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Semeando com lágrimas",
    "ref": "Salmos 126:5",
    "text": "Os que semeiam em lágrimas, com cânticos de júbilo segarão.",
    "reflection": "Quem semeia com lágrimas, colhe com alegria. O que você planta chorando não será perdido.\n\nContinue semeando fé — a colheita vem.",
    "song": "Alegria"
  },
  {
    "title": "O Caminho",
    "ref": "João 14:6",
    "text": "Respondeu-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai, senão por mim.",
    "reflection": "Jesus não apenas mostra o caminho: Ele é o Caminho, a Verdade e a Vida. Nele o acesso a Deus está aberto.\n\nSiga a Cristo e você não se perderá.",
    "song": "Rendido Estou"
  },
  {
    "title": "De manhã, a bondade",
    "ref": "Salmos 143:8",
    "text": "Faze-me ouvir da tua benignidade pela manhã, pois em ti confio; faze-me saber o caminho que devo seguir, porque a ti elevo a minha alma.",
    "reflection": "Começar o dia ouvindo a bondade de Deus muda tudo. É a Ele que levantamos a alma logo cedo.\n\nEntregue a Deus a primeira palavra do seu dia.",
    "song": "Me Derramar"
  },
  {
    "title": "Muito além",
    "ref": "Efésios 3:20",
    "text": "Ora, àquele que é poderoso para fazer tudo muito mais abundantemente além daquilo que pedimos ou pensamos, segundo o poder que em nós opera,",
    "reflection": "Deus é poderoso para fazer infinitamente mais do que pedimos ou pensamos. A imaginação dEle é maior que a nossa.\n\nSonhe grande na oração — o Deus que ouve é maior.",
    "song": "Deus do Impossível"
  },
  {
    "title": "Minha força e escudo",
    "ref": "Salmos 28:7",
    "text": "O Senhor é a minha força e o meu escudo; nele confiou o meu coração, e fui socorrido; pelo que o meu coração salta de prazer, e com o meu cântico o louvarei.",
    "reflection": "O Senhor é força e escudo; nele o coração confia e é socorrido. Por isso a alma exulta e canta.\n\nDeixe a gratidão virar louvor hoje.",
    "song": "Tu Reinas"
  },
  {
    "title": "Honra ao Senhor",
    "ref": "Provérbios 3:9-10",
    "text": "Honra ao Senhor com os teus bens, e com as primícias de toda a tua renda; assim se encherão de fartura os teus celeiros, e trasbordarão de mosto os teus lagares.",
    "reflection": "Honrar a Deus com os nossos bens é reconhecer de Quem tudo vem. A generosidade abre espaço para a provisão.\n\nColoque Deus em primeiro lugar também nas finanças.",
    "song": "Consagração"
  },
  {
    "title": "Espero na Sua palavra",
    "ref": "Salmos 130:5",
    "text": "Aguardo ao Senhor; a minha alma o aguarda, e espero na sua palavra.",
    "reflection": "A espera do salmista se apoia na palavra de Deus. É a promessa que sustenta quem aguarda.\n\nSegure-se hoje naquilo que Deus já falou.",
    "song": "Tua Palavra"
  },
  {
    "title": "Luz do mundo",
    "ref": "Mateus 5:14",
    "text": "Vós sois a luz do mundo. Não se pode esconder uma cidade situada sobre um monte;",
    "reflection": "Você é a luz do mundo; uma cidade no alto não se esconde. A sua vida ilumina o ambiente ao redor.\n\nDeixe a sua luz brilhar hoje com bondade.",
    "song": "Brilha Jesus"
  },
  {
    "title": "Rendei graças",
    "ref": "Salmos 107:1",
    "text": "Dai graças ao Senhor, porque ele é bom; porque a sua benignidade dura para sempre;",
    "reflection": "Rendei graças ao Senhor, porque Ele é bom e a Sua misericórdia dura para sempre. A gratidão reconhece o bem que já recebemos.\n\nComece hoje agradecendo.",
    "song": "Gratidão"
  },
  {
    "title": "A benignidade não se afasta",
    "ref": "Isaías 54:10",
    "text": "Pois as montanhas se retirarão, e os outeiros serão removidos; porém a minha benignidade não se apartará de ti, nem será removido ao pacto da minha paz, diz o Senhor, que se compadece de ti.",
    "reflection": "Ainda que os montes se movam, a benignidade de Deus não se afasta de você. O amor dEle é mais firme que a terra.\n\nDescanse nesse amor inabalável.",
    "song": "Ousado Amor"
  },
  {
    "title": "Anjos ao seu cuidado",
    "ref": "Salmos 91:11",
    "text": "Porque aos seus anjos dará ordem a teu respeito, para te guardarem em todos os teus caminhos.",
    "reflection": "Deus dá ordens aos Seus anjos para te guardarem em todos os caminhos. Você é cuidado até no que não percebe.\n\nSiga hoje sob a proteção do Senhor.",
    "song": "Lugar Secreto"
  },
  {
    "title": "Deus da esperança",
    "ref": "Romanos 15:13",
    "text": "Ora, o Deus de esperança vos encha de todo o gozo e paz na vossa fé, para que abundeis na esperança pelo poder do Espírito Santo.",
    "reflection": "Que o Deus da esperança encha você de alegria e paz no crer, para transbordar de esperança pelo Espírito.\n\nPeça hoje esse transbordar de esperança.",
    "song": "Deus de Promessas"
  },
  {
    "title": "Rocha e libertador",
    "ref": "Salmos 18:2",
    "text": "O Senhor é a minha rocha, a minha fortaleza e o meu libertador; o meu Deus, o meu rochedo, em quem me refúgio; o meu escudo, a força da minha salvação, e o meu alto refúgio.",
    "reflection": "O Senhor é rocha, fortaleza e libertador. Onde há terreno instável, Ele é o chão firme.\n\nFique em pé sobre a Rocha hoje.",
    "song": "Tu Reinas"
  },
  {
    "title": "Não desanime no bem",
    "ref": "Gálatas 6:9",
    "text": "E não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não houvermos desfalecido.",
    "reflection": "No tempo certo colheremos, se não desanimarmos. O cansaço é real, mas a colheita também.\n\nContinue fazendo o bem — o tempo de Deus chega.",
    "song": "Fé"
  },
  {
    "title": "Ele carrega as cargas",
    "ref": "Salmos 68:19",
    "text": "Bendito seja o Senhor, que diariamente leva a nossa carga, o Deus que é a nossa salvação.",
    "reflection": "Bendito o Senhor, que cada dia leva as nossas cargas. Ele não te dá só força: Ele carrega junto.\n\nComece o dia entregando o peso a Deus.",
    "song": "Entrego a Ti"
  },
  {
    "title": "Vida em abundância",
    "ref": "João 10:10",
    "text": "O ladrão não vem senão para roubar, matar e destruir; eu vim para que tenham vida e a tenham em abundância.",
    "reflection": "Jesus veio para que tenhamos vida, e vida com abundância. O plano dEle para você é plenitude, não escassez.\n\nReceba hoje a vida que Ele oferece.",
    "song": "Deus é Deus"
  },
  {
    "title": "Bom para todos",
    "ref": "Salmos 145:9",
    "text": "O Senhor é bom para todos, e as suas misericórdias estão sobre todas as suas obras.",
    "reflection": "O Senhor é bom para todos, e as Suas misericórdias estão sobre todas as obras. A bondade dEle não faz exceção.\n\nConfie que Deus é bom também com você.",
    "song": "Grande é o Senhor"
  },
  {
    "title": "O maior é o amor",
    "ref": "1 Coríntios 13:13",
    "text": "Agora, pois, permanecem a fé, a esperança, o amor, estes três; mas o maior destes é o amor.",
    "reflection": "Fé, esperança e amor permanecem; e o maior deles é o amor. É por ele que tudo o que fazemos ganha valor.\n\nEscolha amar hoje, mesmo quando for difícil.",
    "song": "Ousado Amor"
  },
  {
    "title": "Palavras que agradam",
    "ref": "Salmos 19:14",
    "text": "Sejam agradáveis as palavras da minha boca e a meditação do meu coração perante a tua face, Senhor, Rocha minha e Redentor meu!",
    "reflection": "Que as palavras da boca e a meditação do coração sejam agradáveis a Deus. O que falamos e pensamos importa a Ele.\n\nOfereça a Deus hoje as suas palavras.",
    "song": "Me Derramar"
  },
  {
    "title": "Boas novas aos aflitos",
    "ref": "Isaías 61:1",
    "text": "O Espírito do Senhor Deus está sobre mim, porque o Senhor me ungiu para pregar boas-novas aos mansos; enviou-me a restaurar os contritos de coração, a proclamar liberdade aos cativos, e a abertura de prisão aos presos;",
    "reflection": "O Espírito do Senhor unge para levar boas novas aos quebrantados e liberdade aos cativos. Deus está no ramo de restaurar.\n\nDeixe Ele restaurar você hoje.",
    "song": "Santo Espírito"
  },
  {
    "title": "O que retribuir",
    "ref": "Salmos 116:12",
    "text": "Que darei eu ao Senhor por todos os benefícios que me tem feito?",
    "reflection": "Diante de tantos benefícios, o salmista pergunta como retribuir ao Senhor. A resposta começa em gratidão e entrega.\n\nAgradeça hoje reconhecendo o que Deus fez.",
    "song": "Gratidão"
  },
  {
    "title": "Eu estou convosco",
    "ref": "Mateus 28:20",
    "text": "ensinando-os a observar todas as coisas que eu vos tenho mandado; e eis que eu estou convosco todos os dias, até a consumação dos séculos.",
    "reflection": "A última promessa de Jesus foi de presença: \"estou convosco todos os dias\". Nenhum dia foge desse abraço.\n\nViva hoje sabendo que Ele está com você.",
    "song": "Emmanuel"
  },
  {
    "title": "Espera no Senhor",
    "ref": "Salmos 27:14",
    "text": "Espera tu pelo Senhor; anima-te, e fortalece o teu coração; espera, pois, pelo Senhor.",
    "reflection": "Espera no Senhor, anima-te, e Ele fortalecerá o teu coração. A espera não é fraqueza, é confiança ativa.\n\nSegure firme: o socorro vem no tempo dEle.",
    "song": "Preciso de Ti"
  },
  {
    "title": "A paz governe",
    "ref": "Colossenses 3:15",
    "text": "E a paz de Cristo, para a qual também fostes chamados em um corpo, domine em vossos corações; e sede agradecidos.",
    "reflection": "Deixe a paz de Cristo governar o seu coração e seja grato. A paz dEle é como um juiz que acalma as decisões.\n\nEntregue hoje ao Senhor as suas escolhas.",
    "song": "Deus da Minha Paz"
  },
  {
    "title": "Descansa, minha alma",
    "ref": "Salmos 62:5",
    "text": "Ó minha alma, espera silenciosa somente em Deus, porque dele vem a minha esperança.",
    "reflection": "A alma encontra descanso esperando somente em Deus, de quem vem a esperança. Ele é a expectativa que não decepciona.\n\nAquiete a sua alma nEle hoje.",
    "song": "Tu Reinas"
  },
  {
    "title": "Confie as suas obras",
    "ref": "Provérbios 16:3",
    "text": "Entrega ao Senhor as tuas obras, e teus desígnios serão estabelecidos.",
    "reflection": "Confie ao Senhor as suas obras, e os seus planos serão estabelecidos. Entregar não é perder o controle, é ganhar direção.\n\nComece o dia entregando os seus projetos a Deus.",
    "song": "Deus de Promessas"
  },
  {
    "title": "Livre de todos os temores",
    "ref": "Salmos 34:4",
    "text": "Busquei ao Senhor, e ele me respondeu, e de todos os meus temores me livrou.",
    "reflection": "O salmista buscou o Senhor, e Ele o livrou de todos os temores. A oração desarma o medo.\n\nLeve hoje os seus temores a Deus.",
    "song": "Eu Confio em Ti"
  },
  {
    "title": "O amor lança fora o medo",
    "ref": "1 João 4:18",
    "text": "No amor não há medo antes o perfeito amor lança fora o medo; porque o medo envolve castigo; e quem tem medo não está aperfeiçoado no amor.",
    "reflection": "No amor perfeito de Deus não há medo; o amor dEle expulsa o temor. Quanto mais conhecemos esse amor, menos tememos.\n\nDescanse hoje no amor que acalma.",
    "song": "Ousado Amor"
  },
  {
    "title": "Entrar com gratidão",
    "ref": "Salmos 100:4",
    "text": "Entrai pelas suas portas com ação de graças, e em seus átrios com louvor; dai-lhe graças e bendizei o seu nome.",
    "reflection": "A porta de entrada para a presença de Deus é a gratidão. Não chegamos perfeitos — chegamos gratos.\n\nComece a oração de hoje agradecendo.",
    "song": "Gratidão"
  },
  {
    "title": "Corramos com perseverança",
    "ref": "Hebreus 12:1-2",
    "text": "Portanto, nós também, pois estamos rodeados de tão grande nuvem de testemunhas, deixemos todo embaraço, e o pecado que tão de perto nos rodeia, e corramos com perseverança a carreira que nos está proposta, fitando os olhos em Jesus, autor e consumador da nossa fé, o qual, pelo gozo que lhe está proposto, suportou a cruz, desprezando a ignomínia, e está assentado à direita do trono de Deus.",
    "reflection": "Deixando todo peso, corramos a corrida olhando para Jesus, autor e consumador da fé. O foco certo sustenta a corrida.\n\nTire hoje o olhar do problema e fixe-o em Cristo.",
    "song": "Rendido Estou"
  },
  {
    "title": "Como a corça",
    "ref": "Salmos 42:1",
    "text": "Como o cervo anseia pelas correntes das águas, assim a minha alma anseia por ti, ó Deus!",
    "reflection": "Como a corça anseia pelas águas, a alma anseia por Deus. Há uma sede que só Ele sacia.\n\nBusque hoje matar essa sede na presença do Senhor.",
    "song": "Me Derramar"
  },
  {
    "title": "Olhar para o outro",
    "ref": "Filipenses 2:3-4",
    "text": "nada façais por contenda ou por vanglória, mas com humildade cada um considere os outros superiores a si mesmo; não olhe cada um somente para o que é seu, mas cada qual também para o que é dos outros.",
    "reflection": "Nada por vaidade; considere os outros superiores e cuide do interesse deles também. O amor pensa além de si.\n\nFaça hoje um bem a alguém sem esperar retorno.",
    "song": "Rendido Estou"
  },
  {
    "title": "Ele guarda a sua vida",
    "ref": "Salmos 121:7",
    "text": "O Senhor te guardará de todo o mal; ele guardará a tua vida.",
    "reflection": "O Senhor te guardará de todo o mal e guardará a tua alma. A proteção dEle alcança o corpo e o interior.\n\nSaia hoje sob o cuidado de Deus.",
    "song": "Lugar Secreto"
  },
  {
    "title": "Perdoar",
    "ref": "Mateus 6:14",
    "text": "Porque, se perdoardes aos homens as suas ofensas, também vosso Pai celestial vos perdoará a vós;",
    "reflection": "Perdoar os outros abre espaço para experimentarmos o perdão do Pai. A mágoa aprisiona quem a carrega.\n\nPeça a Deus graça para perdoar hoje.",
    "song": "Nada Além do Sangue"
  },
  {
    "title": "Descansa e espera",
    "ref": "Salmos 37:7",
    "text": "Descansa no Senhor, e espera nele; não te enfades por causa daquele que prospera em seu caminho, por causa do homem que executa maus desígnios.",
    "reflection": "Descansa no Senhor e espera nele com paciência, sem te irritares com o sucesso alheio. A paz nasce da confiança.\n\nEntregue hoje a comparação e descanse.",
    "song": "Tu Reinas"
  },
  {
    "title": "Graça em abundância",
    "ref": "2 Coríntios 9:8",
    "text": "E Deus é poderoso para fazer abundar em vós toda a graça, a fim de que, tendo sempre, em tudo, toda a suficiência, abundeis em toda boa obra;",
    "reflection": "Deus é poderoso para fazer abundar em você toda a graça, para que tenha o suficiente e sobre para o bem.\n\nConfie na provisão generosa de Deus hoje.",
    "song": "Jeová Jireh"
  },
  {
    "title": "Sob Suas asas",
    "ref": "Salmos 91:4",
    "text": "Ele te cobre com as suas penas, e debaixo das suas asas encontras refúgio; a sua verdade é escudo e broquel.",
    "reflection": "Deus te cobre com as Suas penas; debaixo das Suas asas há refúgio. A verdade dEle é escudo.\n\nAbrigue-se hoje na proteção do Senhor.",
    "song": "Lugar Secreto"
  },
  {
    "title": "Este é o caminho",
    "ref": "Isaías 30:21",
    "text": "e os teus ouvidos ouvirão a palavra do que está por detrás de ti, dizendo: Este é o caminho, andai nele; quando vos desviardes para a direita ou para a esquerda.",
    "reflection": "Deus promete direção: \"este é o caminho, andai por ele\". Ele fala mesmo às escolhas do dia a dia.\n\nOuça com o coração e siga a direção dEle.",
    "song": "Sonda-me"
  },
  {
    "title": "Longe as transgressões",
    "ref": "Salmos 103:12",
    "text": "Quanto o oriente está longe do ocidente, tanto tem ele afastado de nós as nossas transgressões.",
    "reflection": "Deus afasta as nossas transgressões tão longe quanto o oriente do ocidente. O perdão dEle é completo.\n\nNão volte a pegar aquilo que Deus já jogou longe.",
    "song": "Nada Além do Sangue"
  },
  {
    "title": "Amados no pecado",
    "ref": "Romanos 5:8",
    "text": "Mas Deus dá prova do seu amor para conosco, em que, quando éramos ainda pecadores, Cristo morreu por nós.",
    "reflection": "Cristo morreu por nós ainda quando éramos pecadores. O amor de Deus não esperou você melhorar.\n\nReceba hoje um amor que veio primeiro.",
    "song": "Ousado Amor"
  },
  {
    "title": "À sombra das asas",
    "ref": "Salmos 63:7",
    "text": "pois tu tens sido o meu auxílio; de júbilo canto à sombra das tuas asas.",
    "reflection": "Porque Deus tem sido ajuda, à sombra das Suas asas há motivo para cantar. A lembrança do socorro produz louvor.\n\nRelembre hoje uma vez em que Deus te ajudou.",
    "song": "Tu és Fiel Senhor"
  },
  {
    "title": "Chegue perto de Deus",
    "ref": "Tiago 4:8",
    "text": "Chegai-vos para Deus, e ele se chegará para vós. Limpai as mãos, pecadores; e, vós de espírito vacilante, purificai os corações.",
    "reflection": "Aproximai-vos de Deus, e Ele se aproximará de vós. O primeiro passo abre a porta para o encontro.\n\nDê hoje um passo em direção a Ele.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Deus no meio dela",
    "ref": "Salmos 46:5",
    "text": "Deus está no meio dela; não será abalada; Deus a ajudará desde o raiar da alva.",
    "reflection": "Deus está no meio da cidade, e ela não será abalada; Ele a socorre ao romper da manhã. A presença dEle firma tudo.\n\nDeixe Deus ser o centro do seu dia.",
    "song": "Deus Está Aqui"
  },
  {
    "title": "O conselho do Senhor prevalece",
    "ref": "Provérbios 19:21",
    "text": "Muitos são os planos no coração do homem; mas o desígnio do Senhor, esse prevalecerá.",
    "reflection": "Muitos são os planos no coração, mas o propósito do Senhor é que permanece. Ele guia a história.\n\nEntregue hoje os seus planos ao propósito de Deus.",
    "song": "Deus de Promessas"
  },
  {
    "title": "Esperança sempre",
    "ref": "Salmos 71:14",
    "text": "Mas eu esperarei continuamente, e te louvarei cada vez mais.",
    "reflection": "Enquanto houver vida, haverá esperança: \"esperarei sempre e te louvarei cada vez mais\". A esperança se renova no louvor.\n\nEscolha esperar e adorar hoje.",
    "song": "Alegria"
  },
  {
    "title": "A ressurreição e a vida",
    "ref": "João 11:25",
    "text": "Declarou-lhe Jesus: Eu sou a ressurreição e a vida; quem crê em mim, ainda que morra, viverá;",
    "reflection": "Jesus é a ressurreição e a vida; quem crê nEle vive, ainda que morra. A morte não tem a palavra final.\n\nAncore hoje a sua esperança na vida que Ele dá.",
    "song": "Deus é Deus"
  },
  {
    "title": "Ensina-me os teus caminhos",
    "ref": "Salmos 25:4-5",
    "text": "Faze-me saber os teus caminhos, Senhor; ensina-me as tuas veredas. Guia-me na tua verdade, e ensina-me; pois tu és o Deus da minha salvação; por ti espero o dia todo.",
    "reflection": "Peça a Deus que mostre os Seus caminhos e ensine as Suas veredas. Quem se deixa ensinar não anda perdido.\n\nComece o dia disposto a aprender com Ele.",
    "song": "Sonda-me"
  },
  {
    "title": "Sede bondosos",
    "ref": "Efésios 4:32",
    "text": "Antes sede bondosos uns para com os outros, compassivos, perdoando-vos uns aos outros, como também Deus vos perdoou em Cristo.",
    "reflection": "Sede bondosos e perdoai uns aos outros, como Deus vos perdoou em Cristo. A bondade recebida se transforma em bondade dada.\n\nSeja hoje um canal da bondade de Deus.",
    "song": "Rendido Estou"
  },
  {
    "title": "De manhã, a minha oração",
    "ref": "Salmos 5:3",
    "text": "Pela manhã ouves a minha voz, ó Senhor; pela manhã te apresento a minha oração, e vigio.",
    "reflection": "Pela manhã Deus ouve a minha voz; de manhã apresento a oração e espero. Começar o dia com Deus muda o dia.\n\nDedique a Ele o seu primeiro momento hoje.",
    "song": "Me Derramar"
  },
  {
    "title": "Humilhe-se",
    "ref": "1 Pedro 5:6",
    "text": "Humilhai-vos, pois, debaixo da potente mão de Deus, para que a seu tempo vos exalte;",
    "reflection": "Humilhai-vos sob a poderosa mão de Deus, para que Ele vos exalte no tempo certo. A entrega antecede a elevação.\n\nDeixe hoje que Deus cuide da sua história.",
    "song": "Rendido Estou"
  },
  {
    "title": "À rocha mais alta",
    "ref": "Salmos 61:2",
    "text": "Desde a extremidade da terra clamo a ti, estando abatido o meu coração; leva-me para a rocha que é mais alta do que eu.",
    "reflection": "Do fim da terra o coração clama: \"leva-me à rocha que é mais alta do que eu\". Há um refúgio acima das suas forças.\n\nSuba hoje para a Rocha que é Deus.",
    "song": "Tu Reinas"
  },
  {
    "title": "Pés como os das cervas",
    "ref": "Habacuque 3:19",
    "text": "O Senhor Deus é minha força, ele fará os meus pés como os da corça, e me fará andar sobre os meus lugares altos. {Ao regente de música. Para instrumentos de cordas.}",
    "reflection": "O Senhor Deus é a minha força; faz os meus pés como os das cervas e me faz andar nas alturas.\n\nConfie que Deus te dá firmeza mesmo nos lugares difíceis.",
    "song": "Como Águia"
  },
  {
    "title": "Muitas aflições, um livrador",
    "ref": "Salmos 34:19",
    "text": "Muitas são as aflições do justo, mas de todas elas o Senhor o livra.",
    "reflection": "Muitas são as aflições do justo, mas o Senhor o livra de todas. As lutas existem, mas o livramento também.\n\nEntregue hoje a Deus cada aflição.",
    "song": "Deus do Impossível"
  },
  {
    "title": "Pensai nas coisas do alto",
    "ref": "Colossenses 3:2",
    "text": "Pensai nas coisas que são de cima, e não nas que são da terra;",
    "reflection": "Pensai nas coisas lá de cima, não nas da terra. O foco no eterno acalma as ansiedades do imediato.\n\nEleve hoje o seu olhar para Deus.",
    "song": "Tua Palavra"
  },
  {
    "title": "Ele levanta os caídos",
    "ref": "Salmos 145:14",
    "text": "O Senhor sustém a todos os que estão a cair, e levanta a todos os que estão abatidos.",
    "reflection": "O Senhor ampara todos os que caem e levanta todos os abatidos. Cair não é o fim quando Deus está por perto.\n\nDeixe Ele te levantar hoje.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Deus é a minha salvação",
    "ref": "Isaías 12:2",
    "text": "Eis que Deus é a minha salvação; eu confiarei e não temerei porque o Senhor, sim o Senhor é a minha força e o meu cântico; e se tornou a minha salvação.",
    "reflection": "Eis que Deus é a minha salvação; confiarei e não temerei, porque Ele é a minha força e o meu cântico.\n\nTroque hoje o medo por confiança.",
    "song": "Tu Reinas"
  },
  {
    "title": "No dia em que clamei",
    "ref": "Salmos 138:3",
    "text": "No dia em que eu clamei, atendeste-me; alentaste-me, fortalecendo a minha alma.",
    "reflection": "No dia em que clamei, Deus me atendeu e fortaleceu a minha alma. A oração não muda só as coisas: fortalece você.\n\nClame hoje e receba força.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Aprendei de mim",
    "ref": "Mateus 11:29",
    "text": "Tomai sobre vós o meu jugo, e aprendei de mim, que sou manso e humilde de coração; e achareis descanso para as vossas almas.",
    "reflection": "Jesus convida a tomar o Seu jugo e aprender dEle, que é manso e humilde, e assim achar descanso.\n\nCaminhe hoje no ritmo suave de Cristo.",
    "song": "Descansa"
  },
  {
    "title": "Deus me ouviu",
    "ref": "Salmos 66:19",
    "text": "mas, na verdade, Deus me ouviu; tem atendido à voz da minha oração.",
    "reflection": "Verdadeiramente Deus me ouviu e atendeu à voz da minha oração. Ele não é indiferente ao seu clamor.\n\nOre hoje com a certeza de ser ouvido.",
    "song": "Preciso de Ti"
  },
  {
    "title": "O Senhor é fiel",
    "ref": "2 Tessalonicenses 3:3",
    "text": "Mas fiel é o Senhor, o qual vos confirmará e guardará do maligno.",
    "reflection": "Fiel é o Senhor, que vos confirmará e guardará do mal. A fidelidade dEle é a sua segurança.\n\nDescanse hoje na fidelidade de Deus.",
    "song": "Tu és Fiel Senhor"
  },
  {
    "title": "Meu esconderijo",
    "ref": "Salmos 32:7",
    "text": "Tu és o meu esconderijo; preservas-me da angústia; de alegres cânticos de livramento me cercas.",
    "reflection": "Deus é esconderijo; guarda da angústia e cerca de cânticos de livramento. No abrigo dEle há música, não medo.\n\nRefugie-se hoje em Deus.",
    "song": "Lugar Secreto"
  },
  {
    "title": "A resposta branda",
    "ref": "Provérbios 15:1",
    "text": "A resposta branda desvia o furor, mas a palavra dura suscita a ira.",
    "reflection": "A resposta branda acalma o furor, mas a palavra dura desperta a ira. As suas palavras podem apagar ou atear fogo.\n\nEscolha hoje falar com mansidão.",
    "song": "Rendido Estou"
  },
  {
    "title": "Tirou-me do lodo",
    "ref": "Salmos 40:2",
    "text": "Também me tirou duma cova de destruição, dum charco de lodo; pôs os meus pés sobre uma rocha, firmou os meus passos.",
    "reflection": "Deus tirou o salmista do poço e do lodo, firmou-lhe os pés na rocha e endireitou os passos.\n\nConfie que Deus pode firmar você em terreno seguro.",
    "song": "Deus do Impossível"
  },
  {
    "title": "Amai-vos",
    "ref": "João 13:34",
    "text": "Um novo mandamento vos dou: que vos ameis uns aos outros; assim como eu vos amei a vós, que também vós vos ameis uns aos outros.",
    "reflection": "Um novo mandamento: que vos ameis como Jesus vos amou. O amor é a marca de quem O segue.\n\nAme alguém hoje do jeito que Cristo te amou.",
    "song": "Ousado Amor"
  },
  {
    "title": "Bom e perdoador",
    "ref": "Salmos 86:5",
    "text": "Porque tu, Senhor, és bom, e pronto a perdoar, e abundante em benignidade para com todos os que te invocam.",
    "reflection": "Tu, Senhor, és bom e pronto a perdoar, rico em benignidade para os que te invocam.\n\nChegue a Deus hoje confiando na Sua bondade.",
    "song": "Grande é o Senhor"
  },
  {
    "title": "Pelo meu Espírito",
    "ref": "Zacarias 4:6",
    "text": "Ele me respondeu, dizendo: Esta é a palavra do Senhor a Zorobabel, dizendo: Não por força nem por poder, mas pelo meu Espírito, diz o Senhor dos exércitos.",
    "reflection": "Não por força nem por poder, mas pelo Espírito do Senhor. O que parece impossível se faz pela ação dEle.\n\nDependa hoje do Espírito, não só do esforço.",
    "song": "Santo Espírito"
  },
  {
    "title": "Não temerá más notícias",
    "ref": "Salmos 112:7",
    "text": "Ele não teme más notícias; o seu coração está firme, confiando no Senhor.",
    "reflection": "O justo não teme más notícias; o seu coração está firme, confiando no Senhor. A confiança estabiliza o coração.\n\nFirme hoje o seu coração em Deus.",
    "song": "Eu Confio em Ti"
  },
  {
    "title": "Prosseguir para o alvo",
    "ref": "Filipenses 3:13-14",
    "text": "Irmãos, quanto a mim, não julgo que o haja alcançado; mas uma coisa faço, e é que, esquecendo-me das coisas que atrás ficam, e avançando para as que estão adiante, prossigo para o alvo pelo prêmio da vocação celestial de Deus em Cristo Jesus.",
    "reflection": "Esquecendo o que ficou para trás, prossigo para o alvo. Não dá para correr para frente olhando para trás.\n\nSolte o passado e dê o próximo passo hoje.",
    "song": "Fé"
  },
  {
    "title": "Aonde ir da presença?",
    "ref": "Salmos 139:7-8",
    "text": "Para onde me irei do teu Espírito, ou para onde fugirei da tua presença? Se subir ao céu, tu aí estás; se fizer no Seol a minha cama, eis que tu ali estás também.",
    "reflection": "Não há lugar onde a presença de Deus não alcance. Nem nas alturas, nem no abismo você está sozinho.\n\nHoje, Ele está com você onde quer que você vá.",
    "song": "Emmanuel"
  },
  {
    "title": "Firmes e constantes",
    "ref": "1 Coríntios 15:58",
    "text": "Portanto, meus amados irmãos, sede firmes e constantes, sempre abundantes na obra do Senhor, sabendo que o vosso trabalho não é vão no Senhor.",
    "reflection": "Sede firmes, constantes, abundando na obra do Senhor, sabendo que o vosso trabalho não é vão.\n\nO que você faz para Deus não se perde — persista.",
    "song": "Fé"
  },
  {
    "title": "Meu refúgio e fortaleza",
    "ref": "Salmos 91:2",
    "text": "Direi do Senhor: Ele é o meu refúgio e a minha fortaleza, o meu Deus, em quem confio.",
    "reflection": "Direi do Senhor: Ele é o meu Deus, o meu refúgio e a minha fortaleza, e nEle confiarei.\n\nDeclare hoje sobre quem é o seu Deus.",
    "song": "Lugar Secreto"
  },
  {
    "title": "A palavra permanece",
    "ref": "Isaías 40:8",
    "text": "Seca-se a erva, e murcha a flor; mas a palavra de nosso Deus subsiste eternamente.",
    "reflection": "A erva seca e a flor cai, mas a palavra do nosso Deus permanece para sempre. O que Ele falou não muda.\n\nApoie-se hoje no que é firme: a Palavra.",
    "song": "Tua Palavra"
  },
  {
    "title": "O Senhor é por mim",
    "ref": "Salmos 118:6",
    "text": "O Senhor é por mim, não recearei; que me pode fazer o homem?",
    "reflection": "O Senhor é por mim; não temerei o que me possa fazer o homem. Quem tem Deus ao lado enfrenta o dia diferente.\n\nAnde hoje com essa certeza.",
    "song": "Tu Reinas"
  },
  {
    "title": "Suportai-vos",
    "ref": "Colossenses 3:13",
    "text": "suportando-vos e perdoando-vos uns aos outros, se alguém tiver queixa contra outro; assim como o Senhor vos perdoou, assim fazei vós também.",
    "reflection": "Suportai-vos e perdoai-vos mutuamente, como o Senhor vos perdoou. A convivência pede graça diária.\n\nEstenda hoje a alguém a graça que você recebeu.",
    "song": "Rendido Estou"
  },
  {
    "title": "No vale, Tu comigo",
    "ref": "Salmos 23:4",
    "text": "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.",
    "reflection": "Ainda que eu ande pelo vale da sombra da morte, não temerei, porque Tu estás comigo. A companhia dEle vence o medo.\n\nAtravesse o vale de hoje sem temor: Ele vai junto.",
    "song": "O Senhor é o meu Pastor"
  },
  {
    "title": "Pacificadores",
    "ref": "Mateus 5:9",
    "text": "Bem-aventurados os pacificadores, porque eles serão chamados filhos de Deus.",
    "reflection": "Bem-aventurados os pacificadores, porque serão chamados filhos de Deus. Levar paz é parecer com o Pai.\n\nSeja hoje um instrumento de paz onde houver tensão.",
    "song": "Deus da Minha Paz"
  },
  {
    "title": "Contar os dias",
    "ref": "Salmos 90:12",
    "text": "Ensina-nos a contar os nossos dias de tal maneira que alcancemos corações sábios.",
    "reflection": "Ensina-nos a contar os nossos dias, para que alcancemos coração sábio. O tempo é presente para viver com propósito.\n\nUse bem o dia de hoje para o que importa.",
    "song": "Tua Palavra"
  },
  {
    "title": "O Deus de toda consolação",
    "ref": "2 Coríntios 1:3-4",
    "text": "Bendito seja o Deus e Pai de nosso Senhor Jesus Cristo, o Pai das misericórdias e Deus de toda a consolação, que nos consola em toda a nossa tribulação, para que também possamos consolar os que estiverem em alguma tribulação, pela consolação com que nós mesmos somos consolados por Deus.",
    "reflection": "Deus nos consola em toda tribulação, para que possamos consolar os outros. A dor consolada vira ferramenta de amor.\n\nDeixe Deus te consolar e consolar alguém por meio de você.",
    "song": "Deus Cuida de Mim"
  },
  {
    "title": "Firmados por Deus",
    "ref": "Salmos 37:23-24",
    "text": "Confirmados pelo Senhor são os passos do homem em cujo caminho ele se deleita; ainda que caia, não ficará prostrado, pois o Senhor lhe segura a mão.",
    "reflection": "Os passos do homem bom são confirmados pelo Senhor; ainda que caia, não ficará prostrado, porque Deus o segura.\n\nSe tropeçar hoje, lembre: a mão dEle te sustenta.",
    "song": "Deus de Promessas"
  },
  {
    "title": "Retenha a esperança",
    "ref": "Hebreus 10:23",
    "text": "retenhamos inabalável a confissão da nossa esperança, porque fiel é aquele que fez a promessa;",
    "reflection": "Retenhamos firmes a confissão da esperança, porque fiel é Aquele que prometeu. A fidelidade dEle sustenta a nossa fé.\n\nSegure firme a promessa hoje.",
    "song": "Tu és Fiel Senhor"
  },
  {
    "title": "Ele farta a alma",
    "ref": "Salmos 107:9",
    "text": "Pois ele satisfaz a alma sedenta, e enche de bens a alma faminta.",
    "reflection": "Deus farta a alma sedenta e enche de bens a alma faminta. Só Ele satisfaz de verdade.\n\nLeve a Ele hoje a sua fome mais profunda.",
    "song": "Me Derramar"
  },
  {
    "title": "Lembrei-me do Senhor",
    "ref": "Jonas 2:7",
    "text": "Quando dentro de mim desfalecia a minha alma, eu me lembrei do Senhor; e entrou a ti a minha oração, no teu santo templo.",
    "reflection": "No fundo do poço, Jonas se lembrou do Senhor, e a sua oração chegou até Deus. Nenhum lugar é fundo demais para a oração alcançar o Céu.\n\nClame de onde você está hoje.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Nossa alma espera",
    "ref": "Salmos 33:20",
    "text": "A nossa alma espera no Senhor; ele é o nosso auxílio e o nosso escudo.",
    "reflection": "A nossa alma espera no Senhor; Ele é o nosso auxílio e escudo. A espera confiante não envergonha.\n\nAguarde hoje no Senhor com o coração tranquilo.",
    "song": "Tu Reinas"
  },
  {
    "title": "Fortes no Senhor",
    "ref": "Efésios 6:10",
    "text": "Finalmente, fortalecei-vos no Senhor e na força do seu poder.",
    "reflection": "Fortalecei-vos no Senhor e na força do Seu poder. A batalha não se vence com força própria.\n\nVista hoje a força que vem de Deus.",
    "song": "Fé"
  },
  {
    "title": "Volta ao descanso",
    "ref": "Salmos 116:7",
    "text": "Volta, minha alma, ao teu repouso, pois o Senhor te fez bem.",
    "reflection": "Volta, minha alma, ao teu descanso, pois o Senhor te fez bem. Recontar as bênçãos acalma o coração.\n\nLembre-se hoje do bem que Deus já te fez.",
    "song": "Descansa"
  },
  {
    "title": "A bênção do Senhor",
    "ref": "Números 6:24-26",
    "text": "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti, e tenha misericórdia de ti; o Senhor levante sobre ti o seu rosto, e te dê a paz.",
    "reflection": "O Senhor te abençoe e te guarde; faça resplandecer o Seu rosto sobre ti e te dê a paz. Essa é a vontade de Deus para você.\n\nReceba hoje essa bênção.",
    "song": "Emmanuel"
  },
  {
    "title": "O agrado do Senhor",
    "ref": "Salmos 147:11",
    "text": "O Senhor se compraz nos que o temem, nos que esperam na sua benignidade.",
    "reflection": "O Senhor se agrada dos que O temem e esperam na Sua bondade. A sua esperança alegra o coração de Deus.\n\nEspere hoje na bondade dEle.",
    "song": "Grande é o Senhor"
  },
  {
    "title": "Alegres na esperança",
    "ref": "Romanos 12:12",
    "text": "alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração;",
    "reflection": "Alegrai-vos na esperança, sede pacientes na tribulação e perseverai na oração. Três âncoras para qualquer dia.\n\nPratique hoje esses três verbos.",
    "song": "Alegria"
  },
  {
    "title": "Em paz me deito",
    "ref": "Salmos 4:8",
    "text": "Em paz me deitarei e dormirei, porque só tu, Senhor, me fazes habitar em segurança.",
    "reflection": "Em paz me deito e logo pego no sono, porque só Tu, Senhor, me fazes habitar em segurança.\n\nEntregue a noite a Deus e descanse.",
    "song": "Deus da Minha Paz"
  },
  {
    "title": "Filhos de Deus",
    "ref": "1 João 3:1",
    "text": "Vede que grande amor nos tem concedido o Pai: que fôssemos chamados filhos de Deus; e nós o somos. Por isso o mundo não nos conhece; porque não conheceu a ele.",
    "reflection": "Vede que grande amor o Pai nos deu, a ponto de sermos chamados filhos de Deus. E nós o somos.\n\nViva hoje a partir dessa identidade.",
    "song": "Ousado Amor"
  },
  {
    "title": "Esforce o coração",
    "ref": "Salmos 31:24",
    "text": "Esforçai-vos, e fortaleça-se o vosso coração, vós todos os que esperais no Senhor.",
    "reflection": "Esforçai-vos, e Ele fortalecerá o vosso coração, todos vós que esperais no Senhor.\n\nCrie ânimo hoje: a espera terá recompensa.",
    "song": "Fé"
  },
  {
    "title": "Estou contigo",
    "ref": "Gênesis 28:15",
    "text": "Eis que estou contigo, e te guardarei por onde quer que fores, e te farei tornar a esta terra; pois não te deixarei até que haja cumprido aquilo de que te tenho falado.",
    "reflection": "Deus prometeu a Jacó: \"estou contigo e te guardarei por onde quer que fores\". A mesma promessa alcança você.\n\nSiga hoje sob o cuidado de Deus.",
    "song": "Emmanuel"
  },
  {
    "title": "Não dormita",
    "ref": "Salmos 121:3",
    "text": "Não deixará vacilar o teu pé; aquele que te guarda não dormitará.",
    "reflection": "Deus não permite que os teus pés vacilem; Aquele que te guarda não dormita. A vigilância dEle é constante.\n\nDurma e acorde sabendo que Ele vela por você.",
    "song": "Lugar Secreto"
  },
  {
    "title": "Ele enxugará as lágrimas",
    "ref": "Apocalipse 21:4",
    "text": "Ele enxugará de seus olhos toda lágrima; e não haverá mais morte, nem haverá mais pranto, nem lamento, nem dor; porque já as primeiras coisas são passadas.",
    "reflection": "Deus enxugará toda lágrima; não haverá mais morte, nem pranto, nem dor. O melhor capítulo ainda está por vir.\n\nDeixe essa esperança animar o seu hoje.",
    "song": "Deus é Deus"
  },
  {
    "title": "Ensina-me a fazer a tua vontade",
    "ref": "Salmos 143:10",
    "text": "Ensina-me a fazer a tua vontade, pois tu és o meu Deus; guie-me o teu bom Espírito por terreno plano.",
    "reflection": "Ensina-me a fazer a tua vontade, pois tu és o meu Deus; o teu bom Espírito me guie por terreno plano.\n\nEntregue hoje as suas decisões à direção de Deus.",
    "song": "Sonda-me"
  },
  {
    "title": "Onde está o tesouro",
    "ref": "Mateus 6:21",
    "text": "Porque onde estiver o teu tesouro, aí estará também o teu coração.",
    "reflection": "Onde estiver o seu tesouro, ali estará o seu coração. O que você valoriza conduz a sua vida.\n\nInvista hoje no que tem valor eterno.",
    "song": "Rendido Estou"
  },
  {
    "title": "Cantarei as misericórdias",
    "ref": "Salmos 89:1",
    "text": "Cantarei para sempre as benignidades do Senhor; com a minha boca proclamarei a todas as gerações a tua fidelidade.",
    "reflection": "Cantarei para sempre as misericórdias do Senhor; a Sua fidelidade anunciarei de geração em geração.\n\nTransforme hoje a memória do bem em louvor.",
    "song": "As Misericórdias do Senhor"
  },
  {
    "title": "Deus faz coisa nova",
    "ref": "Isaías 43:18-19",
    "text": "Não vos lembreis das coisas passadas, nem considereis as antigas. Eis que faço uma coisa nova; agora está saindo à luz; porventura não a percebeis? eis que porei um caminho no deserto, e rios no ermo.",
    "reflection": "Não te lembres das coisas passadas; eis que faço uma coisa nova. Onde você vê deserto, Ele abre caminho.\n\nAbra os olhos para o novo que Deus quer fazer.",
    "song": "Deus de Promessas"
  },
  {
    "title": "Amo o Senhor",
    "ref": "Salmos 116:1",
    "text": "Amo ao Senhor, porque ele ouve a minha voz e a minha súplica.",
    "reflection": "Amo o Senhor, porque Ele ouve a minha voz e as minhas súplicas. O amor cresce na experiência de ser ouvido.\n\nAgradeça hoje por Deus te escutar.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Aprender o contentamento",
    "ref": "Filipenses 4:11",
    "text": "Não digo isto por causa de necessidade, porque já aprendi a contentar-me com as circunstâncias em que me encontre.",
    "reflection": "Paulo aprendeu a contentar-se em qualquer situação. O contentamento é um caminho, não um dom instantâneo.\n\nPratique hoje agradecer pelo que você já tem.",
    "song": "Gratidão"
  },
  {
    "title": "Nada falta aos que buscam",
    "ref": "Salmos 34:10",
    "text": "Os leõezinhos necessitam e sofrem fome, mas àqueles que buscam ao Senhor, bem algum lhes faltará.",
    "reflection": "Os que buscam ao Senhor de nada têm falta de bem. A prioridade certa não deixa faltar o essencial.\n\nBusque a Deus hoje acima de tudo.",
    "song": "Consagração"
  },
  {
    "title": "Autoridade de filhos",
    "ref": "João 1:12",
    "text": "Mas, a todos quantos o receberam, aos que crêem no seu nome, deu-lhes o poder de se tornarem filhos de Deus;",
    "reflection": "A todos os que O receberam, deu o direito de serem feitos filhos de Deus. Recebê-lo é ganhar uma nova família.\n\nViva hoje como filho amado.",
    "song": "Digno é o Senhor"
  },
  {
    "title": "Porque me amou",
    "ref": "Salmos 91:14",
    "text": "Pois que tanto me amou, eu o livrarei; pô-lo-ei num alto retiro, porque ele conhece o meu nome.",
    "reflection": "Porque tanto me amou, Eu o livrarei e o porei em lugar seguro, diz o Senhor. O amor a Deus atrai o cuidado dEle.\n\nAproxime-se hoje de quem te ama primeiro.",
    "song": "Lugar Secreto"
  },
  {
    "title": "Ensina a criança",
    "ref": "Provérbios 22:6",
    "text": "Instrui o menino no caminho em que deve andar, e até quando envelhecer não se desviará dele.",
    "reflection": "Instrui a criança no caminho em que deve andar, e nem quando envelhecer se desviará. O que se semeia cedo dá fruto tarde.\n\nInvista hoje na fé de quem está ao seu redor.",
    "song": "Tua Palavra"
  },
  {
    "title": "Maravilhas incontáveis",
    "ref": "Salmos 40:5",
    "text": "Muitas são, Senhor, Deus meu, as maravilhas que tens operado e os teus pensamentos para conosco; ninguém há que se possa comparar a ti; eu quisera anunciá-los, e manifestá-los, mas são mais do que se podem contar.",
    "reflection": "Muitas são as maravilhas que Deus tem feito; são tantas que não se podem contar. A vida está cheia de bondade dEle.\n\nConte hoje algumas dessas maravilhas.",
    "song": "Grande é o Senhor"
  },
  {
    "title": "Deus não se atrasa",
    "ref": "2 Pedro 3:9",
    "text": "O Senhor não retarda a sua promessa, ainda que alguns a têm por tardia; porém é longânimo para convosco, não querendo que ninguém se perca, senão que todos venham a arrepender-se.",
    "reflection": "O Senhor não retarda a Sua promessa; Ele é paciente, não querendo que ninguém se perca.\n\nO que parece demora pode ser a paciência amorosa de Deus.",
    "song": "Tu és Fiel Senhor"
  },
  {
    "title": "Confia e faze o bem",
    "ref": "Salmos 37:3",
    "text": "Confia no Senhor e faze o bem; assim habitarás na terra, e te alimentarás em segurança.",
    "reflection": "Confia no Senhor e faze o bem; habita na terra e alimenta-te da Sua fidelidade. Fé e ação caminham juntas.\n\nConfie e pratique o bem hoje.",
    "song": "Fé"
  },
  {
    "title": "Olhai as aves",
    "ref": "Mateus 6:26",
    "text": "Olhai para as aves do céu, que não semeiam, nem ceifam, nem ajuntam em celeiros; e vosso Pai celestial as alimenta. Não valeis vós muito mais do que elas?",
    "reflection": "Se Deus alimenta as aves, quanto mais cuidará de você, que vale muito mais? A ansiedade some diante do seu valor.\n\nDescanse: você é precioso para o Pai.",
    "song": "Deus Cuida de Mim"
  },
  {
    "title": "Ele sacia todo vivente",
    "ref": "Salmos 145:16",
    "text": "abres a mão, e satisfazes o desejo de todos os viventes.",
    "reflection": "Deus abre a mão e sacia o desejo de todo vivente. A provisão dEle alcança cada criatura.\n\nConfie que a Sua mão também se abre para você.",
    "song": "Jeová Jireh"
  },
  {
    "title": "Ele se alegra em você",
    "ref": "Sofonias 3:17",
    "text": "O Senhor teu Deus está no meio de ti, poderoso para te salvar; ele se deleitará em ti com alegria; renovar-te-á no seu amor, regozijar-se-á em ti com júbilo.",
    "reflection": "O Senhor está no meio de ti; Ele se alegra com júbilo por tua causa e se aquieta no Seu amor. Deus canta por você.\n\nDeixe-se amar por Deus hoje.",
    "song": "Ousado Amor"
  },
  {
    "title": "Ver a bondade do Senhor",
    "ref": "Salmos 27:13",
    "text": "Creio que hei de ver a bondade do Senhor na terra dos viventes.",
    "reflection": "Eu creria ver a bondade do Senhor na terra dos viventes. A fé espera enxergar o bem ainda em vida.\n\nMantenha hoje os olhos abertos para a bondade de Deus.",
    "song": "Grande é o Senhor"
  },
  {
    "title": "Contentamento e presença",
    "ref": "Hebreus 13:5",
    "text": "Seja a vossa vida isenta de ganância, contentando-vos com o que tendes; porque ele mesmo disse: Não te deixarei, nem te desampararei.",
    "reflection": "Sede sem avareza, contentes com o que tendes, pois Deus disse: \"não te deixarei, nem te desampararei\".\n\nA maior riqueza é a presença dEle: você a tem hoje.",
    "song": "Emmanuel"
  },
  {
    "title": "Que bom viver unidos",
    "ref": "Salmos 133:1",
    "text": "Oh! quão bom e quão suave é que os irmãos vivam em união!",
    "reflection": "Oh, quão bom e agradável é viverem unidos os irmãos! A unidade é lugar onde Deus derrama bênção.\n\nBusque hoje a paz e a comunhão com os seus.",
    "song": "Deus é Amor"
  },
  {
    "title": "Eu te seguro pela mão",
    "ref": "Isaías 41:13",
    "text": "Porque eu, o Senhor teu Deus, te seguro pela tua mão direita, e te digo: Não temas; eu te ajudarei.",
    "reflection": "Eu, o Senhor teu Deus, te seguro pela tua mão direita e te digo: não temas, eu te ajudo.\n\nCaminhe hoje de mãos dadas com Deus.",
    "song": "Deus Está Aqui"
  },
  {
    "title": "O Senhor ouve e livra",
    "ref": "Salmos 34:17",
    "text": "Os justos clama, e o Senhor os ouve, e os livra de todas as suas angústias.",
    "reflection": "Os justos clamam, e o Senhor os ouve e os livra de todas as suas angústias. Nenhum clamor sincero se perde.\n\nApresente hoje a Deus a sua angústia.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Nada é impossível a Deus",
    "ref": "Lucas 1:37",
    "text": "porque para Deus nada será impossível.",
    "reflection": "Para Deus não há nada impossível. O que a razão descarta, o poder dEle realiza.\n\nEntregue hoje o impossível nas mãos do Deus que tudo pode.",
    "song": "Deus do Impossível"
  },
  {
    "title": "Derrama o coração",
    "ref": "Salmos 62:8",
    "text": "Confiai nele, ó povo, em todo o tempo; derramai perante ele o vosso coração; Deus é o nosso refúgio.",
    "reflection": "Confia nEle em todo o tempo, ó povo; derramai perante Ele o vosso coração, pois Deus é o nosso refúgio.\n\nAbra hoje o coração diante do Senhor.",
    "song": "Me Derramar"
  },
  {
    "title": "Nele tudo subsiste",
    "ref": "Colossenses 1:17",
    "text": "Ele é antes de todas as coisas, e nele subsistem todas as coisas;",
    "reflection": "Ele é antes de todas as coisas, e nEle tudo subsiste. O que parece solto está seguro nas mãos de Cristo.\n\nDescanse: Ele sustenta o seu mundo hoje.",
    "song": "Tu Reinas"
  },
  {
    "title": "Força que vem de Ti",
    "ref": "Salmos 84:5",
    "text": "Bem-aventurados os homens cuja força está em ti, em cujo coração os caminhos altos.",
    "reflection": "Bem-aventurado o homem cuja força está em Deus. A verdadeira energia brota da dependência dEle.\n\nBusque hoje força na presença do Senhor.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Toda boa dádiva",
    "ref": "Tiago 1:17",
    "text": "Toda boa dádiva e todo dom perfeito vêm do alto, descendo do Pai das luzes, em quem não há mudança nem sombra de variação.",
    "reflection": "Toda boa dádiva vem do alto, do Pai das luzes, em quem não há mudança. Deus é a fonte constante do bem.\n\nAgradeça hoje reconhecendo de onde vêm as coisas boas.",
    "song": "Gratidão"
  },
  {
    "title": "Estendo as mãos",
    "ref": "Salmos 143:6",
    "text": "A ti estendo as minhas mãos; a minha alma, qual terra sedenta, tem sede de ti.",
    "reflection": "Estendo as mãos para Ti; a minha alma tem sede de Ti como terra sedenta. O desejo por Deus é oração.\n\nBusque hoje saciar a sede na presença dEle.",
    "song": "Me Derramar"
  },
  {
    "title": "Brilhe a vossa luz",
    "ref": "Mateus 5:16",
    "text": "Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras, e glorifiquem a vosso Pai, que está nos céus.",
    "reflection": "Assim brilhe a vossa luz diante dos homens, para que vejam as boas obras e glorifiquem o Pai.\n\nDeixe a sua vida apontar para Deus hoje.",
    "song": "Brilha Jesus"
  },
  {
    "title": "Minha força e cântico",
    "ref": "Salmos 118:14",
    "text": "O Senhor é a minha força e o meu cântico; tornou-se a minha salvação.",
    "reflection": "O Senhor é a minha força e o meu cântico; Ele se tornou a minha salvação. A alegria e a força têm a mesma fonte.\n\nCante hoje sobre o que Deus é para você.",
    "song": "Tu Reinas"
  },
  {
    "title": "Buscai o Senhor",
    "ref": "1 Crônicas 16:11",
    "text": "Buscai ao Senhor e a sua força; buscai a sua face continuamente.",
    "reflection": "Buscai o Senhor e a Sua força; buscai a Sua face continuamente. A busca não é evento único, é hábito diário.\n\nProcure a presença de Deus hoje.",
    "song": "Consagração"
  },
  {
    "title": "Eu o atenderei",
    "ref": "Salmos 91:15",
    "text": "Quando ele me invocar, eu lhe responderei; estarei com ele na angústia, livrá-lo-ei, e o honrarei.",
    "reflection": "Ele me invocará, e Eu o atenderei; estarei com ele na angústia e o livrarei. Deus responde e permanece.\n\nChame por Ele hoje com confiança.",
    "song": "Preciso de Ti"
  },
  {
    "title": "Feitura de Deus",
    "ref": "Efésios 2:10",
    "text": "Porque somos feitura sua, criados em Cristo Jesus para boas obras, as quais Deus antes preparou para que andássemos nelas.",
    "reflection": "Somos feitura de Deus, criados em Cristo para boas obras que Ele preparou. A sua vida tem propósito planejado.\n\nAnde hoje na direção do propósito de Deus.",
    "song": "Digno é o Senhor"
  },
  {
    "title": "Olham e ficam radiantes",
    "ref": "Salmos 34:5",
    "text": "Olhai para ele, e sede iluminados; e os vossos rostos jamais serão confundidos.",
    "reflection": "Os que olham para Deus ficam radiantes, e o seu rosto jamais será coberto de vergonha.\n\nDirija hoje o seu olhar para Ele.",
    "song": "Grande é o Senhor"
  },
  {
    "title": "Medite na Palavra",
    "ref": "Josué 1:8",
    "text": "Não se aparte da tua boca o livro desta lei, antes medita nele dia e noite, para que tenhas cuidado de fazer conforme tudo quanto nele está escrito; porque então farás prosperar o teu caminho, e serás bem sucedido.",
    "reflection": "Medita na Palavra dia e noite, para cumpri-la; então farás prosperar o teu caminho. A Palavra guia e sustenta.\n\nGuarde hoje um versículo no coração.",
    "song": "Tua Palavra"
  },
  {
    "title": "Rocha e fortaleza",
    "ref": "Salmos 31:3",
    "text": "Porque tu és a minha rocha e a minha fortaleza; pelo que, por amor do teu nome, guia-me e encaminha-me.",
    "reflection": "Tu és a minha rocha e a minha fortaleza; por amor do teu nome, guia-me e encaminha-me.\n\nPeça direção a Deus e siga seguro.",
    "song": "Tu Reinas"
  },
  {
    "title": "Tudo com amor",
    "ref": "1 Coríntios 16:14",
    "text": "Todas as vossas obras sejam feitas em amor.",
    "reflection": "Todas as vossas coisas sejam feitas com amor. O amor é o tempero que dá sabor a tudo o que fazemos.\n\nColoque amor em cada tarefa de hoje.",
    "song": "Ousado Amor"
  },
  {
    "title": "Cercados de bênção",
    "ref": "Salmos 5:12",
    "text": "Pois tu, Senhor, abençoas o justo; tu o circundas do teu favor como de um escudo.",
    "reflection": "Tu, Senhor, abençoas o justo e o cercas do teu favor como um escudo. O favor de Deus envolve a sua vida.\n\nComece o dia debaixo da bênção do Senhor.",
    "song": "Grande é o Senhor"
  },
  {
    "title": "Confiai perpetuamente",
    "ref": "Isaías 26:4",
    "text": "Confiai sempre no Senhor; porque o Senhor Deus é uma rocha eterna.",
    "reflection": "Confiai no Senhor perpetuamente, porque o Senhor Deus é uma rocha eterna. A confiança nEle nunca é investimento perdido.\n\nApoie hoje o seu peso nessa Rocha.",
    "song": "Tu Reinas"
  },
  {
    "title": "Firme está o meu coração",
    "ref": "Salmos 108:1",
    "text": "Preparado está o meu coração, ó Deus; cantarei, sim, cantarei louvores, com toda a minha alma.",
    "reflection": "Firme está o meu coração, ó Deus; cantarei e entoarei louvores. A adoração firma o que estava vacilante.\n\nComece hoje decidindo louvar.",
    "song": "Tu Reinas"
  },
  {
    "title": "Se Deus é por nós",
    "ref": "Romanos 8:31",
    "text": "Que diremos, pois, a estas coisas? Se Deus é por nós, quem será contra nós?",
    "reflection": "Se Deus é por nós, quem será contra nós? Nenhuma oposição é maior que a presença dEle ao seu lado.\n\nEncare o dia com essa certeza.",
    "song": "Deus é Deus"
  },
  {
    "title": "Cântico de noite",
    "ref": "Salmos 42:8",
    "text": "Contudo, de dia o Senhor ordena a sua bondade, e de noite a sua canção está comigo, uma oração ao Deus da minha vida.",
    "reflection": "De dia o Senhor manda a Sua benignidade; de noite, o Seu cântico está comigo. Há graça para o dia e canção para a noite.\n\nDeixe Deus preencher a sua noite hoje.",
    "song": "Deus da Minha Paz"
  },
  {
    "title": "Grande ganho",
    "ref": "1 Timóteo 6:6",
    "text": "e, de fato, é grande fonte de lucro a piedade com o contentamento.",
    "reflection": "A piedade com contentamento é grande fonte de lucro. Ter a Deus e um coração satisfeito já é riqueza.\n\nCultive hoje gratidão em vez de ansiedade.",
    "song": "Gratidão"
  },
  {
    "title": "Melhor que a vida",
    "ref": "Salmos 63:3",
    "text": "Porquanto a tua benignidade é melhor do que a vida, os meus lábios te louvarão.",
    "reflection": "A tua benignidade é melhor do que a vida; por isso os meus lábios te louvarão. O amor de Deus vale mais que tudo.\n\nLouve hoje por esse amor.",
    "song": "Ousado Amor"
  },
  {
    "title": "Ele ressuscitou",
    "ref": "Mateus 28:6",
    "text": "Não está aqui, porque ressurgiu, como ele disse. Vinde, vede o lugar onde jazia;",
    "reflection": "Ele não está aqui; ressuscitou como havia dito. O túmulo vazio é a garantia da nossa esperança.\n\nViva hoje na força da ressurreição.",
    "song": "Ele Vive"
  },
  {
    "title": "Não temerás de noite",
    "ref": "Salmos 91:5",
    "text": "Não temerás os terrores da noite, nem a seta que voe de dia,",
    "reflection": "Não temerás os terrores da noite, nem a seta que voa de dia. A proteção de Deus cobre todas as horas.\n\nDescanse sob o cuidado dEle hoje.",
    "song": "Lugar Secreto"
  },
  {
    "title": "A verdade liberta",
    "ref": "João 8:32",
    "text": "e conhecereis a verdade, e a verdade vos libertará.",
    "reflection": "Conhecereis a verdade, e a verdade vos libertará. Em Cristo, a verdade quebra as correntes da mentira.\n\nCaminhe hoje na liberdade que Ele dá.",
    "song": "Rendido Estou"
  },
  {
    "title": "Pranto em dança",
    "ref": "Salmos 30:11",
    "text": "Tornaste o meu pranto em regozijo, tiraste o meu cilício, e me cingiste de alegria;",
    "reflection": "Deus mudou o meu pranto em dança, tirou o meu luto e me cingiu de alegria. Ele é especialista em virar o jogo.\n\nEntregue hoje o seu pranto e espere a dança.",
    "song": "Alegria"
  },
  {
    "title": "Ele vai adiante",
    "ref": "Deuteronômio 31:8",
    "text": "O Senhor, pois, é aquele que vai adiante de ti; ele será contigo, não te deixará, nem te desamparará. Não temas, nem te espantes.",
    "reflection": "O Senhor vai adiante de ti; Ele será contigo, não te deixará; não temas nem te espantes. O caminho já tem companhia.\n\nSiga hoje sabendo que Deus vai à frente.",
    "song": "Emmanuel"
  }
];

// Índice do dia (fuso BR, UTC-3): dias desde a época, avança 1 por dia.
function dayIndexBR(): number {
  const br = Date.now() - 3 * 60 * 60 * 1000;
  return Math.floor(br / 86_400_000);
}

export function devotionalOfDay(seed?: number): DailyDevotional {
  const idx = seed ?? dayIndexBR();
  const i =
    ((idx % DAILY_DEVOTIONALS.length) + DAILY_DEVOTIONALS.length) %
    DAILY_DEVOTIONALS.length;
  return DAILY_DEVOTIONALS[i];
}

// Semente estável do dia (para variar a arte da imagem por dia).
export function daySeed(): number {
  return dayIndexBR();
}
