import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    // Função auxiliar para gerar código de convite aleatório (ex: "B7K9X2")
    private gerarCodigoConvite(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // 💡 ALTERAÇÃO AQUI: Adicionado nomeCasal?: string no final dos parâmetros
    async registrar(nome: string, email: string, senhaPlana: string, codigoConvite?: string, nomeCasal?: string) {
        const usuarioExiste = await this.prisma.usuario.findUnique({
            where: { email },
        });

        if (usuarioExiste) {
            throw new ConflictException('Este email já está em uso.');
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHasheada = await bcrypt.hash(senhaPlana, salt);

        let casalId: string;

        if (codigoConvite) {
            // Se informou o código, busca o casal correspondente
            const casalExistente = await this.prisma.casal.findUnique({
                where: { codigoConvite: codigoConvite.toUpperCase() },
            });

            if (!casalExistente) {
                throw new NotFoundException('Código de convite inválido ou casal não encontrado.');
            }

            // O segundo parceiro está entrando! Os perfis já foram criados pelo primeiro parceiro.
            casalId = casalExistente.id;
        } else {
            // 💡 ALTERAÇÃO AQUI: Usa o nomeCasal se ele veio do front, ou cai no padrão "Finanças de..."
            const nomeDoGrupo = nomeCasal && nomeCasal.trim() ? nomeCasal : `Finanças de ${nome}`;

            const novoCasal = await this.prisma.casal.create({
                data: {
                    nome: nomeDoGrupo,
                    codigoConvite: this.gerarCodigoConvite(),
                    perfis: {
                        create: [
                            { name: `Planejamento ${nome}`, limit: 0 },
                            { name: 'Planejamento Parceiro(a)', limit: 0 }
                        ]
                    }
                },
            });
            casalId = novoCasal.id;
        }

        // Cria o usuário vinculado ao casalId
        const novoUsuario = await this.prisma.usuario.create({
            data: {
                nome,
                email,
                senha: senhaHasheada,
                casalId,
            },
            include: {
                casal: true, // Retorna os dados do casal (inclusive o código de convite)
            },
        });

        const { senha, ...usuarioSemSenha } = novoUsuario;
        return usuarioSemSenha;
    }

    async login(email: string, senhaPlana: string) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { email },
            include: { casal: true },
        });

        if (!usuario) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        const senhaValida = await bcrypt.compare(senhaPlana, usuario.senha);

        if (!senhaValida) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        const payload = {
            sub: usuario.id,
            email: usuario.email,
            nome: usuario.nome,
            casalId: usuario.casalId,
        };

        return {
            access_token: this.jwtService.sign(payload),
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                casal: usuario.casal,
            },
        };
    }

    async buscarGrupoPorCodigo(codigoConvite: string) {
        const casal = await this.prisma.casal.findUnique({
            where: { codigoConvite: codigoConvite.toUpperCase() },
            select: {
                id: true,
                nome: true,
            },
        });

        if (!casal) {
            throw new NotFoundException('Código de convite inválido ou não encontrado.');
        }

        return casal;
    }

    async atualizarNomeCasal(casalId: string, novoNome: string) {
        return this.prisma.casal.update({
            where: { id: casalId },
            data: { nome: novoNome },
        });
    }
}