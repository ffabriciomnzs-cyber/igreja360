export interface DailyVerse {
  ref: string;
  text: string;
}

// Versículos (Almeida, domínio público) — mesmos da aba Bíblia.
export const DAILY_VERSES: DailyVerse[] = [
  { ref: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." },
  { ref: "Salmos 23:1-4", text: "O Senhor é o meu pastor; nada me faltará. Deitar-me faz em pastos verdejantes; guia-me mansamente a águas tranqüilas. Refrigera a minha alma; guia-me nas veredas da justiça por amor do seu nome. Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam." },
  { ref: "Filipenses 4:13", text: "Posso todas as coisas naquele que me fortalece." },
  { ref: "Filipenses 4:6-7", text: "Não andeis ansiosos por coisa alguma; antes em tudo sejam os vossos pedidos conhecidos diante de Deus pela oração e súplica com ações de graças; e a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus." },
  { ref: "Romanos 8:28", text: "E sabemos que todas as coisas concorrem para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito." },
  { ref: "Isaías 41:10", text: "não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça." },
  { ref: "Josué 1:9", text: "Não to mandei eu? Esforça-te, e tem bom ânimo; não te atemorizes, nem te espantes; porque o Senhor teu Deus está contigo, por onde quer que andares." },
  { ref: "Salmos 46:1", text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia." },
  { ref: "Provérbios 3:5-6", text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas." },
  { ref: "Mateus 6:33", text: "Mas buscai primeiro o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas." },
  { ref: "Mateus 11:28", text: "Vinde a mim, todos os que estai cansados e oprimidos, e eu vos aliviarei." },
  { ref: "1 Pedro 5:7", text: "lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós." },
  { ref: "Filipenses 4:19", text: "Meu Deus suprirá todas as vossas necessidades segundo as suas riquezas na glória em Cristo Jesus." },
  { ref: "Salmos 37:5", text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará." },
  { ref: "Jeremias 29:11", text: "Pois eu bem sei os planos que estou projetando para vós, diz o Senhor; planos de paz, e não de mal, para vos dar um futuro e uma esperança." },
  { ref: "2 Coríntios 5:17", text: "Pelo que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo." },
  { ref: "Gálatas 2:20", text: "Já estou crucificado com Cristo; e vivo, não mais eu, mas Cristo vive em mim; e a vida que agora vivo na carne, vivo-a na fé no filho de Deus, o qual me amou, e se entregou a si mesmo por mim." },
  { ref: "Efésios 2:8-9", text: "Porque pela graça sois salvos, por meio da fé, e isto não vem de vós, é dom de Deus; não vem das obras, para que ninguém se glorie." },
  { ref: "Colossenses 3:23", text: "E tudo quanto fizerdes, fazei-o de coração, como ao Senhor, e não aos homens," },
  { ref: "Hebreus 11:1", text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que não se vêem." },
  { ref: "Tiago 1:5", text: "Ora, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente e não censura, e ser-lhe-á dada." },
  { ref: "Salmos 91:1-2", text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Todo-Poderoso descansará. Direi do Senhor: Ele é o meu refúgio e a minha fortaleza, o meu Deus, em quem confio." },
  { ref: "Salmos 27:1", text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?" },
  { ref: "Salmos 34:8", text: "Provai, e vede que o Senhor é bom; bem-aventurado o homem que nele se refugia." },
  { ref: "Isaías 40:31", text: "mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão, e não se cansarão; andarão, e não se fatigarão." },
  { ref: "João 14:6", text: "Respondeu-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai, senão por mim." },
  { ref: "João 14:27", text: "Deixo-vos a paz, a minha paz vos dou; eu não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize." },
  { ref: "Romanos 12:2", text: "E não vos conformeis a este mundo, mas transformai-vos pela renovação da vossa mente, para que experimenteis qual seja a boa, agradável, e perfeita vontade de Deus." },
  { ref: "Romanos 10:9", text: "Porque, se com a tua boca confessares a Jesus como Senhor, e em teu coração creres que Deus o ressuscitou dentre os mortos, será salvo;" },
  { ref: "Filipenses 1:6", text: "tendo por certo isto mesmo, que aquele que em vós começou a boa obra a aperfeiçoará até o dia de Cristo Jesus," },
  { ref: "Filipenses 4:8", text: "Quanto ao mais, irmãos, tudo o que é verdadeiro, tudo o que é honesto, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se há alguma virtude, e se há algum louvor, nisso pensai." },
  { ref: "Salmos 119:105", text: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho." },
  { ref: "Provérbios 16:3", text: "Entrega ao Senhor as tuas obras, e teus desígnios serão estabelecidos." },
  { ref: "Provérbios 18:10", text: "Torre forte é o nome do Senhor; para ela corre o justo, e está seguro." },
  { ref: "Salmos 55:22", text: "Lança o teu fardo sobre o Senhor, e ele te susterá; nunca permitirá que o justo seja abalado." },
  { ref: "Salmos 103:1-2", text: "Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome. Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum dos seus benefícios." },
  { ref: "Salmos 145:18", text: "Perto está o Senhor de todos os que o invocam, de todos os que o invocam em verdade." },
  { ref: "Lamentações de Jeremias 3:22-23", text: "A benignidade do Senhor jamais acaba, as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade." },
  { ref: "Atos 1:8", text: "Mas recebereis poder, ao descer sobre vós o Espírito Santo, e ser-me-eis testemunhas, tanto em Jerusalém, como em toda a Judéia e Samária, e até os confins da terra." },
  { ref: "2 Timóteo 1:7", text: "Porque Deus não nos deu o espírito de covardia, mas de poder, de amor e de moderação." },
  { ref: "Hebreus 13:8", text: "Jesus Cristo é o mesmo, ontem, e hoje, e eternamente." },
  { ref: "Apocalipse 3:20", text: "Eis que estou à porta e bato; se alguém ouvir a minha voz, e abrir a porta, entrarei em sua casa, e com ele cearei, e ele comigo." },
  { ref: "Salmos 46:10", text: "Aquietai-vos, e sabei que eu sou Deus; sou exaltado entre as nações, sou exaltado na terra." },
  { ref: "Deuteronômio 31:6", text: "Sede fortes e corajosos; não temais, nem vos atemorizeis diante deles; porque o Senhor vosso Deus é quem vai convosco. Não vos deixará, nem vos desamparará." },
  { ref: "Salmos 118:24", text: "Este é o dia que o Senhor fez; regozijemo-nos, e alegremo-nos nele." },
  { ref: "Marcos 11:24", text: "Por isso vos digo que tudo o que pedirdes em oração, crede que o recebereis, e tê-lo-eis." },
  { ref: "Lucas 6:38", text: "Dai, e ser-vos-á dado; boa medida, recalcada, sacudida e transbordando vos deitarão no regaço; porque com a mesma medida com que medis, vos medirão a vós." },
  { ref: "João 8:12", text: "Então Jesus tornou a falar-lhes, dizendo: Eu sou a luz do mundo; quem me segue de modo algum andará em trevas, mas terá a luz da vida." },
  { ref: "Romanos 5:8", text: "Mas Deus dá prova do seu amor para conosco, em que, quando éramos ainda pecadores, Cristo morreu por nós." },
  { ref: "Romanos 15:13", text: "Ora, o Deus de esperança vos encha de todo o gozo e paz na vossa fé, para que abundeis na esperança pelo poder do Espírito Santo." },
  { ref: "1 João 4:19", text: "Nós amamos, porque ele nos amou primeiro." },
  { ref: "Salmos 100:4-5", text: "Entrai pelas suas portas com ação de graças, e em seus átrios com louvor; dai-lhe graças e bendizei o seu nome. Porque o Senhor é bom; a sua benignidade dura para sempre, e a sua fidelidade de geração em geração." },
  { ref: "Provérbios 22:6", text: "Instrui o menino no caminho em que deve andar, e até quando envelhecer não se desviará dele." },
  { ref: "Isaías 26:3", text: "Tu conservarás em paz aquele cuja mente está firme em ti; porque ele confia em ti." },
  { ref: "Salmos 121:1-2", text: "Elevo os meus olhos para os montes; de onde me vem o socorro? O meu socorro vem do Senhor, que fez os céus e a terra." },
  { ref: "Mateus 5:16", text: "Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras, e glorifiquem a vosso Pai, que está nos céus." },
  { ref: "1 Coríntios 13:4-7", text: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não se vangloria, não se ensoberbece, não se porta inconvenientemente, não busca os seus próprios interesses, não se irrita, não suspeita mal; não se regozija com a injustiça, mas se regozija com a verdade; tudo sofre, tudo crê, tudo espera, tudo suporta." },
  { ref: "Filipenses 2:3-4", text: "nada façais por contenda ou por vanglória, mas com humildade cada um considere os outros superiores a si mesmo; não olhe cada um somente para o que é seu, mas cada qual também para o que é dos outros." },
  { ref: "Salmos 139:14", text: "Eu te louvarei, porque de um modo tão admirável e maravilhoso fui formado; maravilhosas são as tuas obras, e a minha alma o sabe muito bem." },
  { ref: "Neemias 8:10", text: "Disse-lhes mais: Ide, comei as gorduras, e bebei as doçuras, e enviai porções aos que não têm nada preparado para si; porque este dia é consagrado ao nosso Senhor. Portanto não vos entristeçais, pois a alegria do Senhor é a vossa força." },
  { ref: "Salmos 147:3", text: "sara os quebrantados de coração, e cura-lhes as feridas;" },
  { ref: "1 Tessalonicenses 5:16-18", text: "Regozijai-vos sempre. Orai sem cessar. Em tudo dai graças; porque esta é a vontade de Deus em Cristo Jesus para convosco." },
];

// Retorna a "palavra do dia": muda a cada dia (fuso do Brasil, UTC-3) e é
// estável dentro do mesmo dia.
export function verseOfDay(now: Date = new Date()): DailyVerse {
  const br = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const dayNumber = Math.floor(
    Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), br.getUTCDate()) / 86400000,
  );
  return DAILY_VERSES[dayNumber % DAILY_VERSES.length];
}
