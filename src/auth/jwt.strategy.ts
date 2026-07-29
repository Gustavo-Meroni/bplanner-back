import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            // Ensina a pegar o token do cabeçalho de Autorização (Bearer Token)
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false, // Rejeita tokens vencidos
            secretOrKey: process.env.JWT_SECRET || 'bplanner-chave-secreta-em-desenvolvimento',
        });
    }

    // Se o token for válido, ele decodifica os dados e joga nessa função
    async validate(payload: any) {
        // Isso vai ser injetado no objeto "Request" da sua rota!
        return { id: payload.sub, email: payload.email, nome: payload.nome };
    }
}