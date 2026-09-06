import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

/**
 * Aviso pontual, disparado UMA VEZ no deploy.
 *
 * Por que assim, e não pelo painel: mandar um comunicado exige login de
 * administrador da produção, e guardar essa senha em algum lugar para um robô
 * usar seria pior do que o problema que resolve. Aqui o texto fica no git,
 * passa por revisão como qualquer código, e não há credencial envolvida.
 *
 * A trava é o `SystemFlag`: a chave é o id da tabela, então a segunda
 * tentativa de inserir estoura violação de unicidade e o trabalho é pulado.
 * Isso vale para reinício da API, deploy repetido e duas réplicas ao mesmo
 * tempo — ninguém recebe o aviso duas vezes.
 *
 * Depois de disparado, este arquivo pode ser removido.
 */
const CHAVE = 'aviso:arena-cronometro:2026-09';

const TITULO = 'A Arena Bíblica agora tem cronômetro';

const TEXTO = [
  'A partir de agora, cada pergunta da Arena tem 30 segundos para ser respondida. Passou do tempo, a pergunta vale 0 ponto e não volta — e sair do app não pausa o relógio.',
  'Os pontos de hoje foram zerados para todo mundo começar junto, e as perguntas do dia foram trocadas.',
  'Chegaram quase 100 perguntas novas: agora dá mais de um mês de desafio sem repetir nenhuma.',
  'O resto continua igual: 12 perguntas por dia, 10 pontos por acerto, e a semana fecha no sábado. No domingo, quem estiver em 1º lugar ganha a coroa na tela inicial.',
].join('\n\n');

@Injectable()
export class AnnounceService implements OnApplicationBootstrap {
  private readonly logger = new Logger('AnnounceService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Nunca deixa um aviso derrubar a subida da API.
    try {
      await this.dispara();
    } catch (err) {
      this.logger.warn(`aviso não enviado: ${String(err)}`);
    }
  }

  private async dispara(): Promise<void> {
    try {
      await this.prisma.systemFlag.create({ data: { key: CHAVE } });
    } catch (err) {
      // P2002 = a chave já existe, ou seja, já foi enviado. Silêncio é o certo.
      if ((err as { code?: string })?.code === 'P2002') return;
      throw err;
    }

    const igrejas = await this.prisma.church.findMany({ select: { id: true } });
    for (const igreja of igrejas) {
      // Fica salvo no app: quem não vê o push ainda encontra o aviso depois.
      await this.prisma.communication.create({
        data: { churchId: igreja.id, title: TITULO, content: TEXTO },
      });
      await this.push.notifyChurch(
        igreja.id,
        `⏱️ ${TITULO}`,
        'Cada pergunta tem 30 segundos. Os pontos de hoje foram zerados — todo mundo começa junto!',
        'announcements',
        // O toque leva direto para o jogo, não para a tela inicial.
        'arena',
      );
    }
    this.logger.log(`aviso do cronômetro enviado a ${igrejas.length} igreja(s)`);
  }
}
