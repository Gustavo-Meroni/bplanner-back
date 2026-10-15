import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  nome: string;
}

/** Injeta o usuário do token JWT: `@UsuarioAtual() usuario: UsuarioAutenticado` */
export const UsuarioAtual = createParamDecorator((_: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
  return ctx.switchToHttp().getRequest().user;
});
