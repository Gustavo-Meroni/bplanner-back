import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    async registrar(nome: string, email: string, senhaPlana: string) {
        // 1. Verifica se o email já está cadastrado
        const usuarioExiste = await this.prisma.usuario.findUnique({
            where: { email },
        });

        if (usuarioExiste) {
            throw new ConflictException('Este email já está em uso.');
        }

        // 2. Criptografa a senha com bcrypt (10 rounds de salt)
        const salt = await bcrypt.genSalt(10);
        const senhaHasheada = await bcrypt.hash(senhaPlana, salt);

        // 3. Salva o novo usuário no banco
        const novoUsuario = await this.prisma.usuario.create({
            data: {
                nome,
                email,
                senha: senhaHasheada,
            },
        });

        // 4. Retira a senha do objeto de retorno por segurança
        const { senha, ...usuarioSemSenha } = novoUsuario;
        return usuarioSemSenha;
    }
    async login(email: string, senhaPlana: string) {
        // 1. Busca o usuário pelo email
        const usuario = await this.prisma.usuario.findUnique({
            where: { email },
        });

        if (!usuario) {
            // Retornamos um erro genérico por segurança (para não revelar se o email existe)
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        // 2. Compara a senha digitada com a senha embaralhada do banco
        const senhaValida = await bcrypt.compare(senhaPlana, usuario.senha);

        if (!senhaValida) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        // 3. Se tudo deu certo, criamos o "conteúdo" do crachá (payload)
        const payload = { sub: usuario.id, email: usuario.email, nome: usuario.nome };

        // 4. Assinamos e devolvemos o Token
        return {
            access_token: this.jwtService.sign(payload),
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
            }
        };
    }
}
