import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('registrar')
    async registrar(@Body() body: CreateUsuarioDto) {
        return this.authService.registrar(body.nome, body.email, body.senha, body.codigoConvite);
    }

    @Post('login')
    async login(@Body() body: LoginDto) {
        return this.authService.login(body.email, body.senha);
    }
}