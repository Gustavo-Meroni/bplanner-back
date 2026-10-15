import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsuarioAutenticado } from '../common/usuario-atual.decorator';
import { JWT_SECRET } from './auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  validate(payload: { sub: string; email: string; nome: string }): UsuarioAutenticado {
    return { id: payload.sub, email: payload.email, nome: payload.nome };
  }
}
