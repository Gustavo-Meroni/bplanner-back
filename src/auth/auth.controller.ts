import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuarioAtual, type UsuarioAutenticado } from '../common/usuario-atual.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registrar')
  @ApiOperation({ summary: 'Criar conta (individual) e já receber o token' })
  registrar(@Body() body: CreateUsuarioDto) {
    return this.authService.registrar(body);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Entrar e receber o token JWT' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.senha);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Usuário logado e as viagens de que participa' })
  eu(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.authService.eu(usuario.id);
  }
}
