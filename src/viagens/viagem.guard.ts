import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Participante } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Garante que o usuário logado participa da viagem em `:viagemId`.
 * Use depois do JwtAuthGuard: `@UseGuards(JwtAuthGuard, ViagemGuard)`.
 * Responde 404 (e não 403) para não revelar que a viagem existe.
 */
@Injectable()
export class ViagemGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const viagemId: string | undefined = request.params?.viagemId;
    const usuarioId: string | undefined = request.user?.id;

    if (!viagemId || !usuarioId) {
      throw new NotFoundException('Viagem não encontrada.');
    }

    const participante = await this.prisma.participante.findUnique({
      where: { usuarioId_viagemId: { usuarioId, viagemId } },
    });

    if (!participante) {
      throw new NotFoundException('Viagem não encontrada.');
    }

    request.participante = participante;
    return true;
  }
}

/** Injeta a participação do usuário na viagem da rota (preenchida pelo ViagemGuard). */
export const ParticipanteAtual = createParamDecorator((_: unknown, ctx: ExecutionContext): Participante => {
  return ctx.switchToHttp().getRequest().participante;
});

export function exigirDono(participante: Participante) {
  if (participante.papel !== 'DONO') {
    throw new ForbiddenException('Só quem criou a viagem pode fazer isso.');
  }
}
