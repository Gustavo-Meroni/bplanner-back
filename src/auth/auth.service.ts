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

    async registrar(nome: string, email: string, senhaPlana: string, codigoConvite?: string) {
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

            casalId = casalExistente.id;
        } else {
            // Se não informou código, cria um novo Casal para o usuário
            const novoCasal = await this.prisma.casal.create({
                data: {
                    nome: `Finanças de ${nome}`,
                    codigoConvite: this.gerarCodigoConvite(),
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

        // O Token JWT agora transporta tanto o ID do usuário quanto o casalId
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
}