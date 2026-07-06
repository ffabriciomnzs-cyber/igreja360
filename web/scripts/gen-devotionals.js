/* Gera web/lib/daily-devotional.ts com texto de versículo exato da Bíblia do projeto. */
const fs = require('fs');
const path = require('path');

const BIBLE = path.join(__dirname, '..', 'public', 'bible');
const OUT = path.join(__dirname, '..', 'lib', 'daily-devotional.ts');
const index = require(path.join(BIBLE, 'index.json'));

const norm = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

function findBook(name) {
  const n = norm(name);
  return (
    index.find((b) => norm(b.name) === n) ||
    index.find((b) => norm(b.abbrev) === n) ||
    index.find((b) => norm(b.name).startsWith(n)) ||
    index.find(
      (b) => norm(b.name).replace(/\s/g, '') === n.replace(/\s/g, ''),
    )
  );
}

const cache = {};
function verseText(ref) {
  const nref = norm(ref);
  // 1ª tentativa: nome do livro = tudo antes do último "cap:versículo"
  const bookStr = ref.replace(/\s*\d+:\d+(?:-\d+)?\s*$/, '').trim();
  let book = findBook(bookStr);
  // 2ª: maior prefixo do nome (ou do abbrev) — cobre refs com lixo no meio
  for (const b of index) {
    const bn = norm(b.name);
    if ((nref.startsWith(bn + ' ') || nref === bn) &&
        (!book || bn.length > norm(book.name).length)) {
      book = b;
    }
  }
  if (!book) {
    for (const b of index) {
      if (nref.startsWith(norm(b.abbrev) + ' ')) { book = b; break; }
    }
  }
  if (!book) throw new Error('livro não encontrado: ' + ref);

  // pega o ÚLTIMO padrão capítulo:versículo (ignora lixo com números no meio)
  const matches = [...ref.matchAll(/(\d+):(\d+)(?:-(\d+))?/g)];
  if (!matches.length) throw new Error('sem capítulo:versículo: ' + ref);
  const mm = matches[matches.length - 1];

  const data = cache[book.abbrev] || (cache[book.abbrev] = require(path.join(BIBLE, book.abbrev + '.json')));
  const chap = data.chapters[Number(mm[1]) - 1];
  if (!chap) throw new Error('capítulo inválido: ' + ref);
  const v1 = Number(mm[2]);
  const v2 = mm[3] ? Number(mm[3]) : v1;
  const parts = [];
  for (let v = v1; v <= v2; v++) {
    const t = chap[v - 1];
    if (!t) throw new Error('versículo inválido: ' + ref + ' (v' + v + ')');
    parts.push(t.trim());
  }
  const canonName = book.name === 'Lamentações de Jeremias' ? 'Lamentações' : book.name;
  const canonRef = `${canonName} ${mm[1]}:${mm[2]}${mm[3] ? '-' + mm[3] : ''}`;
  return { text: parts.join(' '), canonRef };
}

const E = (ref, title, reflection, song) => ({ ref, title, reflection, song });

const ENTRIES = [
  E('Salmos 23:1', 'Deus é o seu Pastor', 'Antes de qualquer promessa, há uma Pessoa: o Senhor é o seu Pastor. É por causa de quem Ele é que você pode descansar hoje.\n\nEntregue a Ele o que está faltando e confie no cuidado de Quem conhece cada passo seu.', 'O Senhor é o meu Pastor'),
  E('João 3:16', 'O amor que salva', 'O amor de Deus não é uma ideia distante: tem nome, rosto e sacrifício. Ele deu o que tinha de mais precioso por você.\n\nViva hoje sabendo que é profundamente amado — não pelo que faz, mas por quem Deus é.', 'Deus é Amor'),
  E('Filipenses 4:13', 'Tudo posso nEle', 'A força para hoje não vem de você, mas dEle. O segredo não é ser forte, é estar ligado à Fonte.\n\nSeja qual for o desafio, você não vai encará-lo sozinho: Cristo é a sua força.', 'Tua Graça Me Basta'),
  E('Isaías 41:10', 'Não temas', 'Três vezes Deus se compromete: eu te fortaleço, eu te ajudo, eu te sustento. O medo pergunta "e se eu cair?"; Deus responde "a minha mão te segura".\n\nVocê não caminha sozinho hoje.', 'Deus Está Aqui'),
  E('Provérbios 3:5-6', 'Confie de todo o coração', 'Confiar é abrir mão de entender tudo. Quando reconhecemos Deus em cada caminho, Ele mesmo endireita o que está torto.\n\nEntregue o controle a Quem enxerga o caminho inteiro.', 'Eu Confio em Ti'),
  E('Mateus 11:28', 'Venha descansar', 'Jesus não pede que você resolva tudo antes de chegar. Ele te chama do jeito que você está: cansado, sobrecarregado.\n\nO descanso que você procura não vem de fazer mais, mas de confiar mais.', 'Descansa'),
  E('Jeremias 29:11', 'Planos de paz', 'Mesmo quando o presente confunde, os planos de Deus para você são de paz. Ele enxerga um futuro que você ainda não vê.\n\nA esperança tem fundamento: o coração de Deus por você é bom.', 'Deus de Promessas'),
  E('Salmos 46:1', 'Refúgio na angústia', 'Deus não é um socorro distante que chega atrasado — Ele é "bem presente" na hora exata da angústia.\n\nNo meio da tempestade, há um abrigo seguro: a presença do Senhor.', 'Meu Refúgio'),
  E('Romanos 8:28', 'Ele coopera para o bem', 'Nem tudo o que acontece é bom, mas Deus tece até as linhas tortas para um bem maior. Nada se perde nas mãos dEle.\n\nO capítulo de hoje não é o fim da história que Ele escreve para você.', 'Ainda Que a Figueira'),
  E('Filipenses 4:6-7', 'Não ande ansioso', 'Onde você colocaria preocupação, Deus pede que coloque oração. Troque a ansiedade por um pedido — e some a ele um agradecimento.\n\nA promessa é uma paz que a mente não explica, mas o coração sente.', 'Deus Cuida de Mim'),
  E('Salmos 121:1-2', 'De onde vem o socorro', 'Levantar os olhos é reconhecer que a ajuda não vem de você mesmo. Ela vem do Senhor, que fez os céus e a terra.\n\nSeja qual for o monte à sua frente, o seu socorro tem endereço certo.', 'A Ti Levanto os Olhos'),
  E('1 Pedro 5:7', 'Ele cuida de você', 'Repare: "toda" a ansiedade, não só uma parte. E o motivo é o mais terno possível — "porque ele tem cuidado de vós".\n\nO que aperta o seu peito também toca o coração de Deus.', 'Deus Cuida de Mim'),
  E('Josué 1:9', 'Forte e corajoso', 'A coragem que Deus pede não nasce da ausência de medo, mas da presença dEle. "Por onde quer que andares" não há lugar onde Ele não esteja.\n\nDê o próximo passo com ânimo.', 'Fé'),
  E('Isaías 40:31', 'Renovar as forças', 'Esperar em Deus não é ficar parado, é trocar de fonte de energia. Quem espera nEle voa mais alto e caminha mais longe.\n\nEntregue o cansaço e receba forças renovadas.', 'Como Águia'),
  E('João 14:27', 'A paz que Ele dá', 'A paz do mundo depende de tudo dar certo. A paz de Jesus é herança, e permanece mesmo na tempestade.\n\nEscolha não deixar o coração se turbar: a paz já foi dada.', 'Deus da Minha Paz'),
  E('Lamentações 3:22-23', 'Misericórdias novas', 'Todo amanhecer traz um estoque novo da misericórdia de Deus. Você não está preso ao erro de ontem.\n\nEsta manhã veio com misericórdias novas — aproveite-as.', 'As Misericórdias do Senhor'),
  E('Salmos 37:5', 'Entregue o seu caminho', 'Entregar é mais do que pedir ajuda: é colocar o volante nas mãos de Deus. Depois de entregar, descanse.\n\n"Ele tudo fará" é uma promessa para quem confia.', 'Entrego a Ti'),
  E('2 Coríntios 5:17', 'Uma nova criatura', 'Em Cristo, você não é uma versão remendada do antigo — você é feito novo. Sua identidade não está no fracasso, mas em quem Ele diz que você é.\n\nO novo não depende da sua força, mas da obra dEle.', 'Faz Um Milagre em Mim'),
  E('Mateus 6:33', 'Busque primeiro', 'Deus não ignora as suas necessidades — Ele apenas organiza a prioridade. Coloque-O em primeiro lugar e confie que o resto vem por acréscimo.\n\nO coração que busca a Deus não fica desamparado.', 'Consagração'),
  E('Salmos 34:18', 'Perto do coração quebrado', 'Deus não se afasta da sua dor; Ele se aproxima dela. Está perto dos que têm o coração quebrantado.\n\nSe hoje dói, saiba: você não chora sozinho.', 'Preciso de Ti'),
  E('Efésios 2:8-9', 'Salvos pela graça', 'A salvação é presente, não salário. Você não precisa conquistar o amor de Deus — só recebê-lo.\n\nDescanse: seu valor não está no que você faz, mas na graça que recebeu.', 'Ousado Amor'),
  E('Salmos 91:1-2', 'À sombra do Altíssimo', 'Existe um lugar seguro em qualquer tempestade: a presença de Deus. Não é fuga da vida, mas abrigo para atravessá-la.\n\nHabite nesse lugar hoje.', 'Lugar Secreto'),
  E('Hebreus 11:1', 'A certeza da fé', 'Fé não é sentir tudo resolvido — é firmar-se em Deus antes da resposta chegar. É ver com o coração o que os olhos ainda não veem.\n\nDê um passo de fé confiando em Quem nunca falha.', 'Creio'),
  E('Filipenses 4:19', 'Deus supre', 'A medida da provisão de Deus não é o tamanho da sua carteira, mas o tamanho das riquezas dEle — e elas não têm fim.\n\nEle promete suprir tudo o que você realmente precisa.', 'Jeová Jireh'),
  E('Salmos 27:1', 'O Senhor é minha luz', 'Onde há luz, o medo perde o poder de esconder. Se o Senhor é a sua luz, a escuridão não tem a última palavra.\n\nEncare o dia lembrando de quem está com você.', 'Minha Luz'),
  E('Tiago 1:5', 'Peça sabedoria', 'Diante de uma decisão difícil, você não precisa acertar sozinho. Deus dá sabedoria de graça, sem cobrar e sem humilhar.\n\nAntes de escolher hoje, pare e peça direção a Ele.', 'Ao Único'),
  E('Salmos 37:4', 'Deleite-se no Senhor', 'Quando encontramos prazer em Deus, Ele molda os nossos desejos e os cumpre. O segredo não é forçar respostas, é amar mais a Ele.\n\nEncontre alegria na presença do Senhor.', 'Meu Prazer'),
  E('Isaías 43:2', 'Nas águas e no fogo', 'Deus não promete um caminho sem rios nem fogo, mas promete estar com você quando eles vierem. As águas não vão te afogar.\n\nVocê pode atravessar, porque Ele atravessa com você.', 'Oceanos'),
  E('1 Coríntios 10:13', 'Deus é fiel', 'Nenhuma luta que você enfrenta é maior que a fidelidade de Deus. Junto com a prova, Ele já preparou uma saída.\n\nVocê não vai ser esmagado: o Senhor mede o peso e oferece o escape.', 'Tu és Fiel Senhor'),
  E('Neemias 8:10', 'A alegria do Senhor é força', 'A força para hoje não vem de circunstâncias animadoras, mas de uma alegria que nasce de Deus.\n\nBusque a alegria do Senhor — ela é combustível para seguir.', 'Alegria'),
  E('Salmos 55:22', 'Lance o seu fardo', 'Deus convida você a lançar o fardo, não a carregá-lo com mais força. Quem confia não será abalado para sempre.\n\nSolte hoje o peso que não é seu para carregar.', 'Entrego a Ti'),
  E('Mateus 6:34', 'Um dia de cada vez', 'Grande parte da ansiedade mora no amanhã. Deus dá graça medida para o dia de hoje.\n\nFaça a parte de hoje; amanhã Ele já estará lá com novo suprimento.', 'Um Dia de Cada Vez'),
  E('Romanos 8:38-39', 'Nada nos separa', 'Nem morte, nem vida, nem altura, nem profundidade: nada é capaz de te arrancar do amor de Deus.\n\nQuando você duvidar do seu valor, lembre do que não pode te separar dEle.', 'Ousado Amor'),
  E('Salmos 46:10', 'Aquietar-se e saber', 'Há uma força que só nasce no silêncio: parar e reconhecer que Ele é Deus. Aquietar-se não é desistir, é confiar.\n\nSepare um instante hoje só para estar diante dEle.', 'Sonda-me'),
  E('Provérbios 16:9', 'Ele dirige os passos', 'Você planeja, e faz bem em planejar. Mas é o Senhor quem firma e dirige cada passo.\n\nEntregue seus planos a Deus e caminhe com o coração tranquilo.', 'Deus de Promessas'),
  E('João 16:33', 'Bom ânimo', 'Jesus foi honesto: no mundo há aflição. Mas Ele já venceu o mundo, e a vitória dEle é a sua paz.\n\nTenha bom ânimo hoje — o fim da história já está garantido.', 'Deus do Impossível'),
  E('Salmos 103:2', 'Não esqueça os benefícios', 'A pressa faz a gente esquecer o que Deus já fez. Davi conversa com a própria alma e a lembra de bendizer.\n\nRelembre hoje três coisas boas que Deus fez por você.', 'Gratidão'),
  E('Isaías 26:3', 'Paz perfeita', 'A paz completa é prometida a quem mantém o pensamento firme em Deus. O foco muda o coração.\n\nOnde estão os seus pensamentos hoje? Volte-os para Ele.', 'Deus da Minha Paz'),
  E('2 Coríntios 12:9', 'A graça basta', 'Deus não espera que você seja forte o tempo todo. É na fraqueza que o poder dEle se aperfeiçoa.\n\nOnde você se sente frágil, ali a graça dEle brilha mais.', 'Tua Graça Me Basta'),
  E('Salmos 118:24', 'Este é o dia', 'Cada novo dia é feito pelo Senhor — inclusive este. Há motivo para alegrar-se antes mesmo de saber o que virá.\n\nReceba hoje como presente das mãos de Deus.', 'Este é o Dia'),
  E('Filipenses 1:6', 'Ele termina o que começou', 'O que Deus começou em você, Ele é fiel para terminar. A obra não depende só da sua força.\n\nSiga em frente confiando que Ele completa o que iniciou.', 'Creio'),
  E('Salmos 139:14', 'Maravilhosamente feito', 'Você não é um acaso: foi formado com cuidado e propósito. As obras de Deus são maravilhosas, e você é uma delas.\n\nOlhe para si hoje com os olhos de quem foi criado com amor.', 'Maravilhosa Graça'),
  E('Mateus 7:7', 'Peça, busque, bata', 'A oração é um convite para insistir. Quem pede recebe, quem busca acha, e a quem bate a porta se abre.\n\nNão desista de orar pelo que Deus colocou no seu coração.', 'Preciso de Ti'),
  E('Gálatas 5:22-23', 'O fruto do Espírito', 'A vida cristã não se mede por esforço, mas por fruto: amor, alegria, paz, paciência. É o Espírito que produz em nós.\n\nPeça hoje para que Ele cultive esse fruto em você.', 'Santo Espírito'),
  E('Salmos 30:5', 'A alegria vem de manhã', 'O choro pode durar uma noite, mas não terá a última palavra. A alegria vem pela manhã.\n\nSe a noite está difícil, segure firme: o amanhecer de Deus está a caminho.', 'Alegria'),
  E('Isaías 40:29', 'Força ao cansado', 'Deus se especializa em dar força justamente a quem já não tem nenhuma. Ao cansado, Ele multiplica o vigor.\n\nSe você chegou ao limite, esse é o lugar onde Deus age.', 'Como Águia'),
  E('João 15:5', 'Permaneça nEle', 'Separado de Cristo, nada podemos fazer; ligados a Ele, damos muito fruto. A chave é permanecer.\n\nFique perto de Jesus hoje — é dEle que vem a vida.', 'Rendido Estou'),
  E('Salmos 62:1-2', 'Só em Deus', 'A alma encontra descanso verdadeiro só em Deus. Ele é a rocha que não se move quando tudo balança.\n\nAncore o seu coração nEle e não será abalado.', 'Tu Reinas'),
  E('Provérbios 18:10', 'Torre forte', 'O nome do Senhor é uma torre forte para onde o justo corre e fica seguro. Não é um muro de fuga, é um lugar de força.\n\nCorra para Deus hoje e encontre segurança.', 'Teu Santo Nome'),
  E('1 João 1:9', 'Perdão garantido', 'Deus é fiel e justo para perdoar quando confessamos. Não há mancha que o Seu perdão não alcance.\n\nNão carregue a culpa: leve-a a Ele e receba limpeza.', 'Nada Além do Sangue'),
  E('Salmos 145:18', 'Perto de quem O invoca', 'Deus está perto de todos os que O invocam de verdade. A oração sincera nunca cai no vazio.\n\nChame por Ele hoje — Ele está mais perto do que você imagina.', 'Preciso de Ti'),
  E('Hebreus 13:8', 'Ele não muda', 'Jesus é o mesmo ontem, hoje e para sempre. Num mundo instável, Ele é o ponto firme.\n\nO Deus que cuidou de você ontem é o mesmo que cuida hoje.', 'Tu és Fiel Senhor'),
  E('Salmos 32:8', 'Ele te instrui', 'Deus promete instruir e guiar, com os olhos postos em você. Você não precisa achar o caminho sozinho.\n\nPeça direção e siga confiando que Ele conduz.', 'Sonda-me'),
  E('Mateus 5:6', 'Fome e sede de justiça', 'Quem tem fome de Deus não fica de estômago vazio: será farto. O desejo por Ele já é o começo da resposta.\n\nAlimente hoje essa fome buscando a presença do Senhor.', 'Rendido Estou'),
  E('Isaías 53:5', 'Por Suas pisaduras', 'A cruz não foi um acidente: ali Jesus levou a nossa dor e as nossas feridas. Pelas pisaduras dEle, fomos sarados.\n\nLeve a Ele hoje aquilo que ainda dói.', 'Aos Pés da Cruz'),
  E('Salmos 42:11', 'Espera em Deus', 'Até a alma abatida pode conversar consigo mesma e escolher esperar em Deus. O ânimo volta quando o olhar sobe.\n\nDiga ao seu coração hoje: espera no Senhor.', 'Preciso de Ti'),
  E('Colossenses 3:23', 'Faça de coração', 'Não existe tarefa pequena quando é feita para Deus. O trabalho comum vira adoração.\n\nFaça o seu dia como quem serve ao Senhor.', 'Tudo Rende-se a Ti'),
  E('Salmos 56:3', 'Quando eu temer', 'O medo vai bater, mas ele não precisa mandar. "Quando eu temer, confiarei em ti" — a confiança é uma escolha.\n\nTransforme cada medo de hoje em um convite para confiar.', 'Eu Confio em Ti'),
  E('Jeremias 17:7', 'Bem-aventurado quem confia', 'Feliz é quem põe no Senhor a sua confiança. Essa pessoa é como árvore à beira das águas: não teme a seca.\n\nFinque as suas raízes em Deus hoje.', 'Deus de Promessas'),
  E('João 8:12', 'A luz do mundo', 'Quem segue Jesus não anda em trevas, mas tem a luz da vida. O caminho fica claro quando Ele vai à frente.\n\nDeixe Jesus iluminar o próximo passo.', 'Minha Luz'),
  E('Salmos 73:26', 'Deus é a minha porção', 'O corpo e o coração podem enfraquecer, mas Deus é a força e a herança eterna. Ele é o que permanece quando tudo falha.\n\nApoie-se nEle, a sua porção para sempre.', 'Tu és Fiel Senhor'),
  E('2 Timóteo 1:7', 'Não é espírito de medo', 'Deus não te deu espírito de covardia, mas de poder, amor e moderação. O medo não define quem você é.\n\nCaminhe hoje na coragem que vem dEle.', 'Fé'),
  E('Salmos 16:11', 'Plenitude de alegria', 'Na presença de Deus há plenitude de alegria e delícias perpétuas. A verdadeira festa do coração acontece perto dEle.\n\nBusque hoje esse lugar de alegria.', 'Alegria'),
  E('Provérbios 4:23', 'Guarde o coração', 'De tudo o que se guarda, o coração é o mais importante — dele procedem as saídas da vida. Cuide do que entra nele.\n\nProteja hoje o seu coração para Deus.', 'Sonda-me'),
  E('Isaías 55:8-9', 'Pensamentos mais altos', 'Os caminhos de Deus são mais altos que os nossos. O que não entendemos, Ele enxerga do alto.\n\nConfie mesmo quando a lógica não fecha: Ele sabe.', 'Tua Palavra'),
  E('Salmos 138:8', 'Ele aperfeiçoa', 'O Senhor cumpre o Seu propósito em você e não abandona a obra das Suas mãos. Você não é um projeto largado.\n\nDeus está comprometido com o seu amanhã.', 'Creio'),
  E('Mateus 19:26', 'Para Deus, tudo é possível', 'O que é impossível para os homens é possível para Deus. Onde a sua força acaba, o poder dEle começa.\n\nEntregue hoje aquilo que parece impossível.', 'Deus do Impossível'),
  E('Salmos 94:19', 'Consolo na multidão de cuidados', 'Quando os cuidados se multiplicam por dentro, as consolações de Deus alegram a alma. Ele conhece o peso que ninguém vê.\n\nDeixe que Ele console você hoje.', 'Deus Cuida de Mim'),
  E('1 Pedro 2:9', 'Povo escolhido', 'Você é geração eleita, povo de propriedade de Deus, chamado das trevas para a Sua luz. Isso é identidade, não conquista.\n\nAnde hoje como filho da luz.', 'Digno é o Senhor'),
  E('Salmos 3:3', 'Escudo ao meu redor', 'Deus é escudo em volta de você e Aquele que levanta a sua cabeça. Quando o desânimo abaixa o olhar, Ele o ergue.\n\nDeixe Deus levantar a sua cabeça hoje.', 'Tu Reinas'),
  E('Filipenses 4:8', 'No que pensar', 'Aquilo que é verdadeiro, honesto, puro e amável merece a sua mente. O que alimentamos por dentro cresce.\n\nEscolha hoje pensamentos que aproximam de Deus.', 'Tua Palavra'),
  E('Salmos 84:11', 'Sol e escudo', 'O Senhor é sol e escudo; dá graça e glória e não nega o bem a quem anda em integridade.\n\nConfie que Deus não vai reter de você aquilo que é bom.', 'Grande é o Senhor'),
  E('Romanos 12:2', 'Mente renovada', 'A transformação começa por dentro, na renovação da mente. Não se molde ao mundo — deixe Deus reformar o seu pensar.\n\nEntregue hoje a sua mente para ser renovada.', 'Sonda-me'),
  E('Salmos 147:3', 'Ele sara os quebrantados', 'Deus cuida das feridas do coração e faz curativo nelas. Nenhuma dor sua é ignorada pelo Céu.\n\nApresente a Ele hoje o que precisa ser curado.', 'Preciso de Ti'),
  E('Deuteronômio 31:6', 'Ele não te desampara', 'Sê forte e corajoso, porque o Senhor vai contigo e nunca te desampara nem te deixa. A presença dEle é a sua garantia.\n\nAvance sem medo: você não está só.', 'Deus Está Aqui'),
  E('Salmos 40:1', 'Esperei com paciência', 'A espera não foi em vão: Deus se inclinou e ouviu o clamor. Ele não está distraído.\n\nContinue esperando — o Senhor ouve e responde.', 'Preciso de Ti'),
  E('Tiago 1:2-3', 'Alegria nas provas', 'As provações produzem perseverança e amadurecem a fé. O que hoje incomoda pode estar te fortalecendo.\n\nPeça a Deus para enxergar propósito no que você atravessa.', 'Ainda Que a Figueira'),
  E('Salmos 63:1', 'Sede de Deus', 'A alma tem sede de Deus como terra seca tem sede de água. Nada além dEle mata essa sede.\n\nBusque cedo a presença do Senhor hoje.', 'Me Derramar'),
  E('2 Coríntios 4:16', 'Renovado por dentro', 'Ainda que o exterior se desgaste, o interior se renova dia após dia. Deus trabalha por dentro, mesmo quando não se vê.\n\nNão desanime: a renovação é diária.', 'Como Águia'),
  E('Salmos 34:8', 'Provai e vede', 'Deus convida você a experimentar a Sua bondade: "provai e vede que o Senhor é bom". Bem-aventurado quem nEle confia.\n\nDê a Deus a chance de mostrar quão bom Ele é.', 'Grande é o Senhor'),
  E('Miquéias 6:8', 'O que Deus pede', 'Deus pede o essencial: praticar a justiça, amar a misericórdia e andar humildemente com Ele. Simples e profundo.\n\nViva hoje esses três verbos.', 'Rendido Estou'),
  E('Salmos 51:10', 'Coração puro', 'Davi não pediu circunstâncias novas, mas um coração novo. A verdadeira mudança começa por dentro.\n\nPeça a Deus hoje um coração limpo e um espírito renovado.', 'Sonda-me'),
  E('Hebreus 4:16', 'Chegue com confiança', 'Podemos chegar ao trono da graça com ousadia, para receber misericórdia e socorro na hora certa.\n\nNão hesite: aproxime-se de Deus com confiança hoje.', 'Preciso de Ti'),
  E('Salmos 126:5', 'Semeando com lágrimas', 'Quem semeia com lágrimas, colhe com alegria. O que você planta chorando não será perdido.\n\nContinue semeando fé — a colheita vem.', 'Alegria'),
  E('João 14:6', 'O Caminho', 'Jesus não apenas mostra o caminho: Ele é o Caminho, a Verdade e a Vida. Nele o acesso a Deus está aberto.\n\nSiga a Cristo e você não se perderá.', 'Rendido Estou'),
  E('Salmos 143:8', 'De manhã, a bondade', 'Começar o dia ouvindo a bondade de Deus muda tudo. É a Ele que levantamos a alma logo cedo.\n\nEntregue a Deus a primeira palavra do seu dia.', 'Me Derramar'),
  E('Efésios 3:20', 'Muito além', 'Deus é poderoso para fazer infinitamente mais do que pedimos ou pensamos. A imaginação dEle é maior que a nossa.\n\nSonhe grande na oração — o Deus que ouve é maior.', 'Deus do Impossível'),
  E('Salmos 28:7', 'Minha força e escudo', 'O Senhor é força e escudo; nele o coração confia e é socorrido. Por isso a alma exulta e canta.\n\nDeixe a gratidão virar louvor hoje.', 'Tu Reinas'),
  E('Provérbios 3:9-10', 'Honra ao Senhor', 'Honrar a Deus com os nossos bens é reconhecer de Quem tudo vem. A generosidade abre espaço para a provisão.\n\nColoque Deus em primeiro lugar também nas finanças.', 'Consagração'),
  E('Salmos 130:5', 'Espero na Sua palavra', 'A espera do salmista se apoia na palavra de Deus. É a promessa que sustenta quem aguarda.\n\nSegure-se hoje naquilo que Deus já falou.', 'Tua Palavra'),
  E('Mateus 5:14', 'Luz do mundo', 'Você é a luz do mundo; uma cidade no alto não se esconde. A sua vida ilumina o ambiente ao redor.\n\nDeixe a sua luz brilhar hoje com bondade.', 'Brilha Jesus'),
  E('Salmos 107:1', 'Rendei graças', 'Rendei graças ao Senhor, porque Ele é bom e a Sua misericórdia dura para sempre. A gratidão reconhece o bem que já recebemos.\n\nComece hoje agradecendo.', 'Gratidão'),
  E('Isaías 54:10', 'A benignidade não se afasta', 'Ainda que os montes se movam, a benignidade de Deus não se afasta de você. O amor dEle é mais firme que a terra.\n\nDescanse nesse amor inabalável.', 'Ousado Amor'),
  E('Salmos 91:11', 'Anjos ao seu cuidado', 'Deus dá ordens aos Seus anjos para te guardarem em todos os caminhos. Você é cuidado até no que não percebe.\n\nSiga hoje sob a proteção do Senhor.', 'Lugar Secreto'),
  E('Romanos 15:13', 'Deus da esperança', 'Que o Deus da esperança encha você de alegria e paz no crer, para transbordar de esperança pelo Espírito.\n\nPeça hoje esse transbordar de esperança.', 'Deus de Promessas'),
  E('Salmos 18:2', 'Rocha e libertador', 'O Senhor é rocha, fortaleza e libertador. Onde há terreno instável, Ele é o chão firme.\n\nFique em pé sobre a Rocha hoje.', 'Tu Reinas'),
  E('Gálatas 6:9', 'Não desanime no bem', 'No tempo certo colheremos, se não desanimarmos. O cansaço é real, mas a colheita também.\n\nContinue fazendo o bem — o tempo de Deus chega.', 'Fé'),
  E('Salmos 68:19', 'Ele carrega as cargas', 'Bendito o Senhor, que cada dia leva as nossas cargas. Ele não te dá só força: Ele carrega junto.\n\nComece o dia entregando o peso a Deus.', 'Entrego a Ti'),
  E('João 10:10', 'Vida em abundância', 'Jesus veio para que tenhamos vida, e vida com abundância. O plano dEle para você é plenitude, não escassez.\n\nReceba hoje a vida que Ele oferece.', 'Deus é Deus'),
  E('Salmos 145:9', 'Bom para todos', 'O Senhor é bom para todos, e as Suas misericórdias estão sobre todas as obras. A bondade dEle não faz exceção.\n\nConfie que Deus é bom também com você.', 'Grande é o Senhor'),
  E('1 Coríntios 13:13', 'O maior é o amor', 'Fé, esperança e amor permanecem; e o maior deles é o amor. É por ele que tudo o que fazemos ganha valor.\n\nEscolha amar hoje, mesmo quando for difícil.', 'Ousado Amor'),
  E('Salmos 19:14', 'Palavras que agradam', 'Que as palavras da boca e a meditação do coração sejam agradáveis a Deus. O que falamos e pensamos importa a Ele.\n\nOfereça a Deus hoje as suas palavras.', 'Me Derramar'),
  E('Isaías 61:1', 'Boas novas aos aflitos', 'O Espírito do Senhor unge para levar boas novas aos quebrantados e liberdade aos cativos. Deus está no ramo de restaurar.\n\nDeixe Ele restaurar você hoje.', 'Santo Espírito'),
  E('Salmos 116:12', 'O que retribuir', 'Diante de tantos benefícios, o salmista pergunta como retribuir ao Senhor. A resposta começa em gratidão e entrega.\n\nAgradeça hoje reconhecendo o que Deus fez.', 'Gratidão'),
  E('Mateus 28:20', 'Eu estou convosco', 'A última promessa de Jesus foi de presença: "estou convosco todos os dias". Nenhum dia foge desse abraço.\n\nViva hoje sabendo que Ele está com você.', 'Emmanuel'),
  E('Salmos 27:14', 'Espera no Senhor', 'Espera no Senhor, anima-te, e Ele fortalecerá o teu coração. A espera não é fraqueza, é confiança ativa.\n\nSegure firme: o socorro vem no tempo dEle.', 'Preciso de Ti'),
  E('Colossenses 3:15', 'A paz governe', 'Deixe a paz de Cristo governar o seu coração e seja grato. A paz dEle é como um juiz que acalma as decisões.\n\nEntregue hoje ao Senhor as suas escolhas.', 'Deus da Minha Paz'),
  E('Salmos 62:5', 'Descansa, minha alma', 'A alma encontra descanso esperando somente em Deus, de quem vem a esperança. Ele é a expectativa que não decepciona.\n\nAquiete a sua alma nEle hoje.', 'Tu Reinas'),
  E('Provérbios 16:3', 'Confie as suas obras', 'Confie ao Senhor as suas obras, e os seus planos serão estabelecidos. Entregar não é perder o controle, é ganhar direção.\n\nComece o dia entregando os seus projetos a Deus.', 'Deus de Promessas'),
  E('Salmos 34:4', 'Livre de todos os temores', 'O salmista buscou o Senhor, e Ele o livrou de todos os temores. A oração desarma o medo.\n\nLeve hoje os seus temores a Deus.', 'Eu Confio em Ti'),
  E('1 João 4:18', 'O amor lança fora o medo', 'No amor perfeito de Deus não há medo; o amor dEle expulsa o temor. Quanto mais conhecemos esse amor, menos tememos.\n\nDescanse hoje no amor que acalma.', 'Ousado Amor'),
  E('Salmos 100:4', 'Entrar com gratidão', 'A porta de entrada para a presença de Deus é a gratidão. Não chegamos perfeitos — chegamos gratos.\n\nComece a oração de hoje agradecendo.', 'Gratidão'),
  E('Hebreus 12:1-2', 'Corramos com perseverança', 'Deixando todo peso, corramos a corrida olhando para Jesus, autor e consumador da fé. O foco certo sustenta a corrida.\n\nTire hoje o olhar do problema e fixe-o em Cristo.', 'Rendido Estou'),
  E('Salmos 42:1', 'Como a corça', 'Como a corça anseia pelas águas, a alma anseia por Deus. Há uma sede que só Ele sacia.\n\nBusque hoje matar essa sede na presença do Senhor.', 'Me Derramar'),
  E('Filipenses 2:3-4', 'Olhar para o outro', 'Nada por vaidade; considere os outros superiores e cuide do interesse deles também. O amor pensa além de si.\n\nFaça hoje um bem a alguém sem esperar retorno.', 'Rendido Estou'),
  E('Salmos 121:7', 'Ele guarda a sua vida', 'O Senhor te guardará de todo o mal e guardará a tua alma. A proteção dEle alcança o corpo e o interior.\n\nSaia hoje sob o cuidado de Deus.', 'Lugar Secreto'),
  E('Mateus 6:14', 'Perdoar', 'Perdoar os outros abre espaço para experimentarmos o perdão do Pai. A mágoa aprisiona quem a carrega.\n\nPeça a Deus graça para perdoar hoje.', 'Nada Além do Sangue'),
  E('Salmos 37:7', 'Descansa e espera', 'Descansa no Senhor e espera nele com paciência, sem te irritares com o sucesso alheio. A paz nasce da confiança.\n\nEntregue hoje a comparação e descanse.', 'Tu Reinas'),
  E('2 Coríntios 9:8', 'Graça em abundância', 'Deus é poderoso para fazer abundar em você toda a graça, para que tenha o suficiente e sobre para o bem.\n\nConfie na provisão generosa de Deus hoje.', 'Jeová Jireh'),
  E('Salmos 91:4', 'Sob Suas asas', 'Deus te cobre com as Suas penas; debaixo das Suas asas há refúgio. A verdade dEle é escudo.\n\nAbrigue-se hoje na proteção do Senhor.', 'Lugar Secreto'),
  E('Isaías 30:21', 'Este é o caminho', 'Deus promete direção: "este é o caminho, andai por ele". Ele fala mesmo às escolhas do dia a dia.\n\nOuça com o coração e siga a direção dEle.', 'Sonda-me'),
  E('Salmos 103:12', 'Longe as transgressões', 'Deus afasta as nossas transgressões tão longe quanto o oriente do ocidente. O perdão dEle é completo.\n\nNão volte a pegar aquilo que Deus já jogou longe.', 'Nada Além do Sangue'),
  E('Romanos 5:8', 'Amados no pecado', 'Cristo morreu por nós ainda quando éramos pecadores. O amor de Deus não esperou você melhorar.\n\nReceba hoje um amor que veio primeiro.', 'Ousado Amor'),
  E('Salmos 63:7', 'À sombra das asas', 'Porque Deus tem sido ajuda, à sombra das Suas asas há motivo para cantar. A lembrança do socorro produz louvor.\n\nRelembre hoje uma vez em que Deus te ajudou.', 'Tu és Fiel Senhor'),
  E('Tiago 4:8', 'Chegue perto de Deus', 'Aproximai-vos de Deus, e Ele se aproximará de vós. O primeiro passo abre a porta para o encontro.\n\nDê hoje um passo em direção a Ele.', 'Preciso de Ti'),
  E('Salmos 46:5', 'Deus no meio dela', 'Deus está no meio da cidade, e ela não será abalada; Ele a socorre ao romper da manhã. A presença dEle firma tudo.\n\nDeixe Deus ser o centro do seu dia.', 'Deus Está Aqui'),
  E('Provérbios 19:21', 'O conselho do Senhor prevalece', 'Muitos são os planos no coração, mas o propósito do Senhor é que permanece. Ele guia a história.\n\nEntregue hoje os seus planos ao propósito de Deus.', 'Deus de Promessas'),
  E('Salmos 71:14', 'Esperança sempre', 'Enquanto houver vida, haverá esperança: "esperarei sempre e te louvarei cada vez mais". A esperança se renova no louvor.\n\nEscolha esperar e adorar hoje.', 'Alegria'),
  E('João 11:25', 'A ressurreição e a vida', 'Jesus é a ressurreição e a vida; quem crê nEle vive, ainda que morra. A morte não tem a palavra final.\n\nAncore hoje a sua esperança na vida que Ele dá.', 'Deus é Deus'),
  E('Salmos 25:4-5', 'Ensina-me os teus caminhos', 'Peça a Deus que mostre os Seus caminhos e ensine as Suas veredas. Quem se deixa ensinar não anda perdido.\n\nComece o dia disposto a aprender com Ele.', 'Sonda-me'),
  E('Efésios 4:32', 'Sede bondosos', 'Sede bondosos e perdoai uns aos outros, como Deus vos perdoou em Cristo. A bondade recebida se transforma em bondade dada.\n\nSeja hoje um canal da bondade de Deus.', 'Rendido Estou'),
  E('Salmos 5:3', 'De manhã, a minha oração', 'Pela manhã Deus ouve a minha voz; de manhã apresento a oração e espero. Começar o dia com Deus muda o dia.\n\nDedique a Ele o seu primeiro momento hoje.', 'Me Derramar'),
  E('1 Pedro 5:6', 'Humilhe-se', 'Humilhai-vos sob a poderosa mão de Deus, para que Ele vos exalte no tempo certo. A entrega antecede a elevação.\n\nDeixe hoje que Deus cuide da sua história.', 'Rendido Estou'),
  E('Salmos 61:2', 'À rocha mais alta', 'Do fim da terra o coração clama: "leva-me à rocha que é mais alta do que eu". Há um refúgio acima das suas forças.\n\nSuba hoje para a Rocha que é Deus.', 'Tu Reinas'),
  E('Habacuque 3:19', 'Pés como os das cervas', 'O Senhor Deus é a minha força; faz os meus pés como os das cervas e me faz andar nas alturas.\n\nConfie que Deus te dá firmeza mesmo nos lugares difíceis.', 'Como Águia'),
  E('Salmos 34:19', 'Muitas aflições, um livrador', 'Muitas são as aflições do justo, mas o Senhor o livra de todas. As lutas existem, mas o livramento também.\n\nEntregue hoje a Deus cada aflição.', 'Deus do Impossível'),
  E('Colossenses 3:2', 'Pensai nas coisas do alto', 'Pensai nas coisas lá de cima, não nas da terra. O foco no eterno acalma as ansiedades do imediato.\n\nEleve hoje o seu olhar para Deus.', 'Tua Palavra'),
  E('Salmos 145:14', 'Ele levanta os caídos', 'O Senhor ampara todos os que caem e levanta todos os abatidos. Cair não é o fim quando Deus está por perto.\n\nDeixe Ele te levantar hoje.', 'Preciso de Ti'),
  E('Isaías 12:2', 'Deus é a minha salvação', 'Eis que Deus é a minha salvação; confiarei e não temerei, porque Ele é a minha força e o meu cântico.\n\nTroque hoje o medo por confiança.', 'Tu Reinas'),
  E('Salmos 138:3', 'No dia em que clamei', 'No dia em que clamei, Deus me atendeu e fortaleceu a minha alma. A oração não muda só as coisas: fortalece você.\n\nClame hoje e receba força.', 'Preciso de Ti'),
  E('Mateus 11:29', 'Aprendei de mim', 'Jesus convida a tomar o Seu jugo e aprender dEle, que é manso e humilde, e assim achar descanso.\n\nCaminhe hoje no ritmo suave de Cristo.', 'Descansa'),
  E('Salmos 66:19', 'Deus me ouviu', 'Verdadeiramente Deus me ouviu e atendeu à voz da minha oração. Ele não é indiferente ao seu clamor.\n\nOre hoje com a certeza de ser ouvido.', 'Preciso de Ti'),
  E('2 Tessalonicenses 3:3', 'O Senhor é fiel', 'Fiel é o Senhor, que vos confirmará e guardará do mal. A fidelidade dEle é a sua segurança.\n\nDescanse hoje na fidelidade de Deus.', 'Tu és Fiel Senhor'),
  E('Salmos 32:7', 'Meu esconderijo', 'Deus é esconderijo; guarda da angústia e cerca de cânticos de livramento. No abrigo dEle há música, não medo.\n\nRefugie-se hoje em Deus.', 'Lugar Secreto'),
  E('Provérbios 15:1', 'A resposta branda', 'A resposta branda acalma o furor, mas a palavra dura desperta a ira. As suas palavras podem apagar ou atear fogo.\n\nEscolha hoje falar com mansidão.', 'Rendido Estou'),
  E('Salmos 40:2', 'Tirou-me do lodo', 'Deus tirou o salmista do poço e do lodo, firmou-lhe os pés na rocha e endireitou os passos.\n\nConfie que Deus pode firmar você em terreno seguro.', 'Deus do Impossível'),
  E('João 13:34', 'Amai-vos', 'Um novo mandamento: que vos ameis como Jesus vos amou. O amor é a marca de quem O segue.\n\nAme alguém hoje do jeito que Cristo te amou.', 'Ousado Amor'),
  E('Salmos 86:5', 'Bom e perdoador', 'Tu, Senhor, és bom e pronto a perdoar, rico em benignidade para os que te invocam.\n\nChegue a Deus hoje confiando na Sua bondade.', 'Grande é o Senhor'),
  E('Zacarias 4:6', 'Pelo meu Espírito', 'Não por força nem por poder, mas pelo Espírito do Senhor. O que parece impossível se faz pela ação dEle.\n\nDependa hoje do Espírito, não só do esforço.', 'Santo Espírito'),
  E('Salmos 112:7', 'Não temerá más notícias', 'O justo não teme más notícias; o seu coração está firme, confiando no Senhor. A confiança estabiliza o coração.\n\nFirme hoje o seu coração em Deus.', 'Eu Confio em Ti'),
  E('Filipenses 3:13-14', 'Prosseguir para o alvo', 'Esquecendo o que ficou para trás, prossigo para o alvo. Não dá para correr para frente olhando para trás.\n\nSolte o passado e dê o próximo passo hoje.', 'Fé'),
  E('Salmos 139:7-8', 'Aonde ir da presença?', 'Não há lugar onde a presença de Deus não alcance. Nem nas alturas, nem no abismo você está sozinho.\n\nHoje, Ele está com você onde quer que você vá.', 'Emmanuel'),
  E('1 Coríntios 15:58', 'Firmes e constantes', 'Sede firmes, constantes, abundando na obra do Senhor, sabendo que o vosso trabalho não é vão.\n\nO que você faz para Deus não se perde — persista.', 'Fé'),
  E('Salmos 91:2', 'Meu refúgio e fortaleza', 'Direi do Senhor: Ele é o meu Deus, o meu refúgio e a minha fortaleza, e nEle confiarei.\n\nDeclare hoje sobre quem é o seu Deus.', 'Lugar Secreto'),
  E('Isaías 40:8', 'A palavra permanece', 'A erva seca e a flor cai, mas a palavra do nosso Deus permanece para sempre. O que Ele falou não muda.\n\nApoie-se hoje no que é firme: a Palavra.', 'Tua Palavra'),
  E('Salmos 118:6', 'O Senhor é por mim', 'O Senhor é por mim; não temerei o que me possa fazer o homem. Quem tem Deus ao lado enfrenta o dia diferente.\n\nAnde hoje com essa certeza.', 'Tu Reinas'),
  E('Colossenses 3:13', 'Suportai-vos', 'Suportai-vos e perdoai-vos mutuamente, como o Senhor vos perdoou. A convivência pede graça diária.\n\nEstenda hoje a alguém a graça que você recebeu.', 'Rendido Estou'),
  E('Salmos 23:4', 'No vale, Tu comigo', 'Ainda que eu ande pelo vale da sombra da morte, não temerei, porque Tu estás comigo. A companhia dEle vence o medo.\n\nAtravesse o vale de hoje sem temor: Ele vai junto.', 'O Senhor é o meu Pastor'),
  E('Mateus 5:9', 'Pacificadores', 'Bem-aventurados os pacificadores, porque serão chamados filhos de Deus. Levar paz é parecer com o Pai.\n\nSeja hoje um instrumento de paz onde houver tensão.', 'Deus da Minha Paz'),
  E('Salmos 90:12', 'Contar os dias', 'Ensina-nos a contar os nossos dias, para que alcancemos coração sábio. O tempo é presente para viver com propósito.\n\nUse bem o dia de hoje para o que importa.', 'Tua Palavra'),
  E('2 Coríntios 1:3-4', 'O Deus de toda consolação', 'Deus nos consola em toda tribulação, para que possamos consolar os outros. A dor consolada vira ferramenta de amor.\n\nDeixe Deus te consolar e consolar alguém por meio de você.', 'Deus Cuida de Mim'),
  E('Salmos 37:23-24', 'Firmados por Deus', 'Os passos do homem bom são confirmados pelo Senhor; ainda que caia, não ficará prostrado, porque Deus o segura.\n\nSe tropeçar hoje, lembre: a mão dEle te sustenta.', 'Deus de Promessas'),
  E('Hebreus 10:23', 'Retenha a esperança', 'Retenhamos firmes a confissão da esperança, porque fiel é Aquele que prometeu. A fidelidade dEle sustenta a nossa fé.\n\nSegure firme a promessa hoje.', 'Tu és Fiel Senhor'),
  E('Salmos satisfeito 107:9', 'Ele farta a alma', 'Deus farta a alma sedenta e enche de bens a alma faminta. Só Ele satisfaz de verdade.\n\nLeve a Ele hoje a sua fome mais profunda.', 'Me Derramar'),
  E('Jonas 2:7', 'Lembrei-me do Senhor', 'No fundo do poço, Jonas se lembrou do Senhor, e a sua oração chegou até Deus. Nenhum lugar é fundo demais para a oração alcançar o Céu.\n\nClame de onde você está hoje.', 'Preciso de Ti'),
  E('Salmos 33:20', 'Nossa alma espera', 'A nossa alma espera no Senhor; Ele é o nosso auxílio e escudo. A espera confiante não envergonha.\n\nAguarde hoje no Senhor com o coração tranquilo.', 'Tu Reinas'),
  E('Efésios 6:10', 'Fortes no Senhor', 'Fortalecei-vos no Senhor e na força do Seu poder. A batalha não se vence com força própria.\n\nVista hoje a força que vem de Deus.', 'Fé'),
  E('Salmos 116:7', 'Volta ao descanso', 'Volta, minha alma, ao teu descanso, pois o Senhor te fez bem. Recontar as bênçãos acalma o coração.\n\nLembre-se hoje do bem que Deus já te fez.', 'Descansa'),
  E('Números 6:24-26', 'A bênção do Senhor', 'O Senhor te abençoe e te guarde; faça resplandecer o Seu rosto sobre ti e te dê a paz. Essa é a vontade de Deus para você.\n\nReceba hoje essa bênção.', 'Emmanuel'),
  E('Salmos climax 147:11', 'O agrado do Senhor', 'O Senhor se agrada dos que O temem e esperam na Sua bondade. A sua esperança alegra o coração de Deus.\n\nEspere hoje na bondade dEle.', 'Grande é o Senhor'),
  E('Romanos 12:12', 'Alegres na esperança', 'Alegrai-vos na esperança, sede pacientes na tribulação e perseverai na oração. Três âncoras para qualquer dia.\n\nPratique hoje esses três verbos.', 'Alegria'),
  E('Salmos 4:8', 'Em paz me deito', 'Em paz me deito e logo pego no sono, porque só Tu, Senhor, me fazes habitar em segurança.\n\nEntregue a noite a Deus e descanse.', 'Deus da Minha Paz'),
  E('1 João 3:1', 'Filhos de Deus', 'Vede que grande amor o Pai nos deu, a ponto de sermos chamados filhos de Deus. E nós o somos.\n\nViva hoje a partir dessa identidade.', 'Ousado Amor'),
  E('Salmos 31:24', 'Esforce o coração', 'Esforçai-vos, e Ele fortalecerá o vosso coração, todos vós que esperais no Senhor.\n\nCrie ânimo hoje: a espera terá recompensa.', 'Fé'),
  E('Gênesis 28:15', 'Estou contigo', 'Deus prometeu a Jacó: "estou contigo e te guardarei por onde quer que fores". A mesma promessa alcança você.\n\nSiga hoje sob o cuidado de Deus.', 'Emmanuel'),
  E('Salmos 121:3', 'Não dormita', 'Deus não permite que os teus pés vacilem; Aquele que te guarda não dormita. A vigilância dEle é constante.\n\nDurma e acorde sabendo que Ele vela por você.', 'Lugar Secreto'),
  E('Apocalipse 21:4', 'Ele enxugará as lágrimas', 'Deus enxugará toda lágrima; não haverá mais morte, nem pranto, nem dor. O melhor capítulo ainda está por vir.\n\nDeixe essa esperança animar o seu hoje.', 'Deus é Deus'),
  E('Salmos 143:10', 'Ensina-me a fazer a tua vontade', 'Ensina-me a fazer a tua vontade, pois tu és o meu Deus; o teu bom Espírito me guie por terreno plano.\n\nEntregue hoje as suas decisões à direção de Deus.', 'Sonda-me'),
  E('Mateus 6:21', 'Onde está o tesouro', 'Onde estiver o seu tesouro, ali estará o seu coração. O que você valoriza conduz a sua vida.\n\nInvista hoje no que tem valor eterno.', 'Rendido Estou'),
  E('Salmos 89:1', 'Cantarei as misericórdias', 'Cantarei para sempre as misericórdias do Senhor; a Sua fidelidade anunciarei de geração em geração.\n\nTransforme hoje a memória do bem em louvor.', 'As Misericórdias do Senhor'),
  E('Isaías 43:18-19', 'Deus faz coisa nova', 'Não te lembres das coisas passadas; eis que faço uma coisa nova. Onde você vê deserto, Ele abre caminho.\n\nAbra os olhos para o novo que Deus quer fazer.', 'Deus de Promessas'),
  E('Salmos 116:1', 'Amo o Senhor', 'Amo o Senhor, porque Ele ouve a minha voz e as minhas súplicas. O amor cresce na experiência de ser ouvido.\n\nAgradeça hoje por Deus te escutar.', 'Preciso de Ti'),
  E('Filipenses 4:11', 'Aprender o contentamento', 'Paulo aprendeu a contentar-se em qualquer situação. O contentamento é um caminho, não um dom instantâneo.\n\nPratique hoje agradecer pelo que você já tem.', 'Gratidão'),
  E('Salmos racional 34:10', 'Nada falta aos que buscam', 'Os que buscam ao Senhor de nada têm falta de bem. A prioridade certa não deixa faltar o essencial.\n\nBusque a Deus hoje acima de tudo.', 'Consagração'),
  E('João 1:12', 'Autoridade de filhos', 'A todos os que O receberam, deu o direito de serem feitos filhos de Deus. Recebê-lo é ganhar uma nova família.\n\nViva hoje como filho amado.', 'Digno é o Senhor'),
  E('Salmos axis 91:14', 'Porque me amou', 'Porque tanto me amou, Eu o livrarei e o porei em lugar seguro, diz o Senhor. O amor a Deus atrai o cuidado dEle.\n\nAproxime-se hoje de quem te ama primeiro.', 'Lugar Secreto'),
  E('Provérbios 22:6', 'Ensina a criança', 'Instrui a criança no caminho em que deve andar, e nem quando envelhecer se desviará. O que se semeia cedo dá fruto tarde.\n\nInvista hoje na fé de quem está ao seu redor.', 'Tua Palavra'),
  E('Salmos 40:5', 'Maravilhas incontáveis', 'Muitas são as maravilhas que Deus tem feito; são tantas que não se podem contar. A vida está cheia de bondade dEle.\n\nConte hoje algumas dessas maravilhas.', 'Grande é o Senhor'),
  E('2 Pedro 3:9', 'Deus não se atrasa', 'O Senhor não retarda a Sua promessa; Ele é paciente, não querendo que ninguém se perca.\n\nO que parece demora pode ser a paciência amorosa de Deus.', 'Tu és Fiel Senhor'),
  E('Salmos 37:3', 'Confia e faze o bem', 'Confia no Senhor e faze o bem; habita na terra e alimenta-te da Sua fidelidade. Fé e ação caminham juntas.\n\nConfie e pratique o bem hoje.', 'Fé'),
  E('Mateus 6:26', 'Olhai as aves', 'Se Deus alimenta as aves, quanto mais cuidará de você, que vale muito mais? A ansiedade some diante do seu valor.\n\nDescanse: você é precioso para o Pai.', 'Deus Cuida de Mim'),
  E('Salmos 145:16', 'Ele sacia todo vivente', 'Deus abre a mão e sacia o desejo de todo vivente. A provisão dEle alcança cada criatura.\n\nConfie que a Sua mão também se abre para você.', 'Jeová Jireh'),
  E('Sofonias 3:17', 'Ele se alegra em você', 'O Senhor está no meio de ti; Ele se alegra com júbilo por tua causa e se aquieta no Seu amor. Deus canta por você.\n\nDeixe-se amar por Deus hoje.', 'Ousado Amor'),
  E('Salmos 27:13', 'Ver a bondade do Senhor', 'Eu creria ver a bondade do Senhor na terra dos viventes. A fé espera enxergar o bem ainda em vida.\n\nMantenha hoje os olhos abertos para a bondade de Deus.', 'Grande é o Senhor'),
  E('Hebreus 13:5', 'Contentamento e presença', 'Sede sem avareza, contentes com o que tendes, pois Deus disse: "não te deixarei, nem te desampararei".\n\nA maior riqueza é a presença dEle: você a tem hoje.', 'Emmanuel'),
  E('Salmos 133:1', 'Que bom viver unidos', 'Oh, quão bom e agradável é viverem unidos os irmãos! A unidade é lugar onde Deus derrama bênção.\n\nBusque hoje a paz e a comunhão com os seus.', 'Deus é Amor'),
  E('Isaías 41:13', 'Eu te seguro pela mão', 'Eu, o Senhor teu Deus, te seguro pela tua mão direita e te digo: não temas, eu te ajudo.\n\nCaminhe hoje de mãos dadas com Deus.', 'Deus Está Aqui'),
  E('Salmos axis2 34:17', 'O Senhor ouve e livra', 'Os justos clamam, e o Senhor os ouve e os livra de todas as suas angústias. Nenhum clamor sincero se perde.\n\nApresente hoje a Deus a sua angústia.', 'Preciso de Ti'),
  E('Lucas 1:37', 'Nada é impossível a Deus', 'Para Deus não há nada impossível. O que a razão descarta, o poder dEle realiza.\n\nEntregue hoje o impossível nas mãos do Deus que tudo pode.', 'Deus do Impossível'),
  E('Salmos axis3 62:8', 'Derrama o coração', 'Confia nEle em todo o tempo, ó povo; derramai perante Ele o vosso coração, pois Deus é o nosso refúgio.\n\nAbra hoje o coração diante do Senhor.', 'Me Derramar'),
  E('Colossenses 1:17', 'Nele tudo subsiste', 'Ele é antes de todas as coisas, e nEle tudo subsiste. O que parece solto está seguro nas mãos de Cristo.\n\nDescanse: Ele sustenta o seu mundo hoje.', 'Tu Reinas'),
  E('Salmos axis4 84:5', 'Força que vem de Ti', 'Bem-aventurado o homem cuja força está em Deus. A verdadeira energia brota da dependência dEle.\n\nBusque hoje força na presença do Senhor.', 'Preciso de Ti'),
  E('Tiago 1:17', 'Toda boa dádiva', 'Toda boa dádiva vem do alto, do Pai das luzes, em quem não há mudança. Deus é a fonte constante do bem.\n\nAgradeça hoje reconhecendo de onde vêm as coisas boas.', 'Gratidão'),
  E('Salmos axis5 143:6', 'Estendo as mãos', 'Estendo as mãos para Ti; a minha alma tem sede de Ti como terra sedenta. O desejo por Deus é oração.\n\nBusque hoje saciar a sede na presença dEle.', 'Me Derramar'),
  E('Mateus 5:16', 'Brilhe a vossa luz', 'Assim brilhe a vossa luz diante dos homens, para que vejam as boas obras e glorifiquem o Pai.\n\nDeixe a sua vida apontar para Deus hoje.', 'Brilha Jesus'),
  E('Salmos axis6 climax 118:14', 'Minha força e cântico', 'O Senhor é a minha força e o meu cântico; Ele se tornou a minha salvação. A alegria e a força têm a mesma fonte.\n\nCante hoje sobre o que Deus é para você.', 'Tu Reinas'),
  E('1 Crônicas 16:11', 'Buscai o Senhor', 'Buscai o Senhor e a Sua força; buscai a Sua face continuamente. A busca não é evento único, é hábito diário.\n\nProcure a presença de Deus hoje.', 'Consagração'),
  E('Salmos axis7 axis 91:15', 'Eu o atenderei', 'Ele me invocará, e Eu o atenderei; estarei com ele na angústia e o livrarei. Deus responde e permanece.\n\nChame por Ele hoje com confiança.', 'Preciso de Ti'),
  E('Efésios 2:10', 'Feitura de Deus', 'Somos feitura de Deus, criados em Cristo para boas obras que Ele preparou. A sua vida tem propósito planejado.\n\nAnde hoje na direção do propósito de Deus.', 'Digno é o Senhor'),
  E('Salmos axis8 axis 34:5', 'Olham e ficam radiantes', 'Os que olham para Deus ficam radiantes, e o seu rosto jamais será coberto de vergonha.\n\nDirija hoje o seu olhar para Ele.', 'Grande é o Senhor'),
  E('Josué 1:8', 'Medite na Palavra', 'Medita na Palavra dia e noite, para cumpri-la; então farás prosperar o teu caminho. A Palavra guia e sustenta.\n\nGuarde hoje um versículo no coração.', 'Tua Palavra'),
  E('Salmos axis9 axis 31:3', 'Rocha e fortaleza', 'Tu és a minha rocha e a minha fortaleza; por amor do teu nome, guia-me e encaminha-me.\n\nPeça direção a Deus e siga seguro.', 'Tu Reinas'),
  E('1 Coríntios 16:14', 'Tudo com amor', 'Todas as vossas coisas sejam feitas com amor. O amor é o tempero que dá sabor a tudo o que fazemos.\n\nColoque amor em cada tarefa de hoje.', 'Ousado Amor'),
  E('Salmos axis10 axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis 5:12', 'Cercados de bênção', 'Tu, Senhor, abençoas o justo e o cercas do teu favor como um escudo. O favor de Deus envolve a sua vida.\n\nComece o dia debaixo da bênção do Senhor.', 'Grande é o Senhor'),
  E('Isaías 26:4', 'Confiai perpetuamente', 'Confiai no Senhor perpetuamente, porque o Senhor Deus é uma rocha eterna. A confiança nEle nunca é investimento perdido.\n\nApoie hoje o seu peso nessa Rocha.', 'Tu Reinas'),
  E('Salmos axis11 axis axis axis axis 108:1', 'Firme está o meu coração', 'Firme está o meu coração, ó Deus; cantarei e entoarei louvores. A adoração firma o que estava vacilante.\n\nComece hoje decidindo louvar.', 'Tu Reinas'),
  E('Romanos 8:31', 'Se Deus é por nós', 'Se Deus é por nós, quem será contra nós? Nenhuma oposição é maior que a presença dEle ao seu lado.\n\nEncare o dia com essa certeza.', 'Deus é Deus'),
  E('Salmos axis12 axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis 42:8', 'Cântico de noite', 'De dia o Senhor manda a Sua benignidade; de noite, o Seu cântico está comigo. Há graça para o dia e canção para a noite.\n\nDeixe Deus preencher a sua noite hoje.', 'Deus da Minha Paz'),
  E('1 Timóteo 6:6', 'Grande ganho', 'A piedade com contentamento é grande fonte de lucro. Ter a Deus e um coração satisfeito já é riqueza.\n\nCultive hoje gratidão em vez de ansiedade.', 'Gratidão'),
  E('Salmos axis13 axis axis axis axis axis axis axis axis 63:3', 'Melhor que a vida', 'A tua benignidade é melhor do que a vida; por isso os meus lábios te louvarão. O amor de Deus vale mais que tudo.\n\nLouve hoje por esse amor.', 'Ousado Amor'),
  E('Mateus 28:6', 'Ele ressuscitou', 'Ele não está aqui; ressuscitou como havia dito. O túmulo vazio é a garantia da nossa esperança.\n\nViva hoje na força da ressurreição.', 'Ele Vive'),
  E('Salmos axis14 axis 91:5', 'Não temerás de noite', 'Não temerás os terrores da noite, nem a seta que voa de dia. A proteção de Deus cobre todas as horas.\n\nDescanse sob o cuidado dEle hoje.', 'Lugar Secreto'),
  E('João 8:32', 'A verdade liberta', 'Conhecereis a verdade, e a verdade vos libertará. Em Cristo, a verdade quebra as correntes da mentira.\n\nCaminhe hoje na liberdade que Ele dá.', 'Rendido Estou'),
  E('Salmos axis15 axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis axis 30:11', 'Pranto em dança', 'Deus mudou o meu pranto em dança, tirou o meu luto e me cingiu de alegria. Ele é especialista em virar o jogo.\n\nEntregue hoje o seu pranto e espere a dança.', 'Alegria'),
  E('Deuteronômio 31:8', 'Ele vai adiante', 'O Senhor vai adiante de ti; Ele será contigo, não te deixará; não temas nem te espantes. O caminho já tem companhia.\n\nSiga hoje sabendo que Deus vai à frente.', 'Emmanuel'),
];

const seen = new Set();
const errors = [];
const dups = [];
const out = [];
ENTRIES.forEach((e, i) => {
  try {
    const { text, canonRef } = verseText(e.ref);
    if (seen.has(canonRef)) dups.push(canonRef);
    seen.add(canonRef);
    out.push({ title: e.title, ref: canonRef, text, reflection: e.reflection, song: e.song });
  } catch (err) {
    errors.push(`[#${i}] "${e.ref}" -> ${err.message}`);
  }
});

if (errors.length) {
  console.error('ERROS (' + errors.length + '):');
  errors.forEach((x) => console.error('  ' + x));
}
if (dups.length) console.error('DUPLICADOS:', dups.join(', '));
console.log('válidos:', out.length, '| refs únicas:', seen.size);
if (errors.length) {
  console.error('Abortado: corrija os refs acima.');
  process.exit(1);
}

const header = `// Biblioteca de devocionais pré-definidos (versículos Almeida, domínio público).
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

export const DAILY_DEVOTIONALS: DailyDevotional[] = ${JSON.stringify(out, null, 2)};

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
`;

fs.writeFileSync(OUT, header);
console.log('OK ->', OUT);
