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
 * A chave carrega a data justamente para poder ser reusada: para mandar um
 * aviso novo, troca-se o texto e a chave, e o anterior continua travado.
 */
const CHAVE = 'aviso:arena-rodada-completa:2026-09-06';

const TITULO = 'Novas regras da Arena Bíblica';

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
      // Só o push. A primeira versão também gravava um comunicado, e o
      // resultado foi a tela inicial da igreja tomada por dois blocos enormes
      // de regra de jogo — no lugar onde deveriam estar os avisos que a
      // liderança escreve. Aviso de sistema é passageiro: vive na notificação
      // e no pop-up de regras, não na mural da igreja.
      await this.push.notifyChurch(
        igreja.id,
        `▶️ ${TITULO}`,
        'Agora você decide quando o relógio começa — e os pontos só valem se você responder as 12. Vem ver!',
        'announcements',
        // O toque leva direto para o jogo, não para a tela inicial.
        'arena',
      );
    }
    this.logger.log(`aviso do cronômetro enviado a ${igrejas.length} igreja(s)`);
  }
}
