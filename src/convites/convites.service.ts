import { Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { Participante, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { exigirDono } from '../viagens/viagem.guard';

// Sem 0/O, 1/I/L: fácil de ler e ditar
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TAMANHO = 8;

@Injectable()
export class ConvitesService {
  constructor(private prisma: PrismaService) {}

  /** Convite ativo da viagem (cria um se ainda não existir) */
  async obterOuCriar(viagemId: string, usuarioId: string) {
    const existente = await this.prisma.convite.findFirst({
      where: { viagemId, OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }] },
      orderBy: { createdAt: 'desc' },
    });
    return this.formatar(existente ?? (await this.criar(viagemId, usuarioId)));
  }

  /** Gera um código novo e invalida os anteriores (só o dono) */
  async renovar(viagemId: string, participante: Participante) {
    exigirDono(participante);
    await this.prisma.convite.deleteMany({ where: { viagemId } });
    return this.formatar(await this.criar(viagemId, participante.usuarioId));
  }

  /** Prévia pública do convite: o que a pessoa vê antes de entrar */
  async previa(codigo: string) {
    const convite = await this.buscarValido(codigo);
    const [viagem, criadoPor] = await Promise.all([
      this.prisma.viagem.findUniqueOrThrow({
        where: { id: convite.viagemId },
        include: {
          participantes: { include: { usuario: { select: { nome: true } } }, orderBy: { entrouEm: 'asc' } },
        },
      }),
      convite.criadoPorId
        ? this.prisma.usuario.findUnique({ where: { id: convite.criadoPorId }, select: { nome: true } })
        : null,
    ]);
    const dono = viagem.participantes.find((p) => p.papel === 'DONO');
    return {
      codigo: convite.codigo,
      convidadoPor: criadoPor?.nome ?? dono?.usuario.nome ?? null,
      viagem: {
        nome: viagem.nome,
        destinoNome: viagem.destinoNome,
        destinoPais: viagem.destinoPais,
        destinoLat: viagem.destinoLat,
        destinoLng: viagem.destinoLng,
        dataIda: viagem.dataIda?.toISOString().slice(0, 10) ?? null,
        dataVolta: viagem.dataVolta?.toISOString().slice(0, 10) ?? null,
      },
      participantes: viagem.participantes.map((p) => p.usuario.nome),
    };
  }

  /** Entra na viagem. Idempotente: se já participa, só devolve a viagem. */
  async aceitar(codigo: string, usuarioId: string) {
    const convite = await this.buscarValido(codigo);
    await this.prisma.participante.upsert({
      where: { usuarioId_viagemId: { usuarioId, viagemId: convite.viagemId } },
      create: { usuarioId, viagemId: convite.viagemId, papel: 'MEMBRO' },
      update: {},
    });
    return { viagemId: convite.viagemId };
  }

  private async buscarValido(codigo: string) {
    const convite = await this.prisma.convite.findUnique({ where: { codigo: codigo.trim().toUpperCase() } });
    if (!convite || (convite.expiraEm && convite.expiraEm < new Date())) {
      throw new NotFoundException('Convite inválido ou expirado. Peça um link novo para quem te convidou.');
    }
    return convite;
  }

  private async criar(viagemId: string, criadoPorId: string, tentativas = 5) {
    try {
      return await this.prisma.convite.create({ data: { codigo: gerarCodigo(), viagemId, criadoPorId } });
    } catch (erro) {
      // Colisão de código (raríssimo): tenta outro
      if (tentativas > 1 && erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        return this.criar(viagemId, criadoPorId, tentativas - 1);
      }
      throw erro;
    }
  }

  private formatar(c: { codigo: string; expiraEm: Date | null }) {
    return { codigo: c.codigo, expiraEm: c.expiraEm, caminho: `/convite/${c.codigo}` };
  }
}

function gerarCodigo() {
  return Array.from({ length: TAMANHO }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
}
