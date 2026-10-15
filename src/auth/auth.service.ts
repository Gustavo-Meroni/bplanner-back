import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { resumirViagem } from '../viagens/viagens.mapper';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /** Cadastro sempre individual. Já devolve o token para seguir direto ao onboarding. */
  async registrar(dto: CreateUsuarioDto) {
    const email = dto.email.trim().toLowerCase();
    const existe = await this.prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      throw new ConflictException('Este email já está em uso.');
    }

    const senha = await bcrypt.hash(dto.senha, 10);
    const usuario = await this.prisma.usuario.create({
      data: { nome: dto.nome.trim(), email, senha },
    });

    return this.sessao(usuario);
  }

  async login(emailInformado: string, senha: string) {
    const email = emailInformado.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      throw new UnauthorizedException('Email ou senha incorretos.');
    }

    return this.sessao(usuario);
  }

  /** Dados do usuário logado + viagens de que participa (para o front decidir: onboarding ou painel) */
  async eu(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      include: {
        participacoes: {
          include: { viagem: true },
          orderBy: { entrouEm: 'asc' },
        },
      },
    });

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      viagens: usuario.participacoes.map((p) => ({ ...resumirViagem(p.viagem), papel: p.papel })),
    };
  }

  private sessao(usuario: Usuario) {
    const payload = { sub: usuario.id, email: usuario.email, nome: usuario.nome };
    return {
      access_token: this.jwtService.sign(payload),
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    };
  }
}
