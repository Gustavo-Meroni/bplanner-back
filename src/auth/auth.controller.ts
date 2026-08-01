import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    UseGuards,
    Req
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateCasalDto } from './dto/update-casal.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('registrar')
    @ApiOperation({ summary: 'Cadastrar novo usuário (criando ou entrando em um casal)' })
    async registrar(@Body() body: CreateUsuarioDto) {
        return this.authService.registrar(
            body.nome,
            body.email,
            body.senha,
            body.codigoConvite,
            body.nomeCasal
        );
    }

    @Post('login')
    @ApiOperation({ summary: 'Fazer login e obter o Token JWT' })
    async login(@Body() body: LoginDto) {
        return this.authService.login(body.email, body.senha);
    }

    // Rota PÚBLICA para o frontend consultar o nome do grupo pelo código antes de registrar
    @Get('validar-convite/:codigo')
    @ApiOperation({ summary: 'Buscar nome do grupo pelo código de convite (para pré-visualização)' })
    async validarConvite(@Param('codigo') codigo: string) {
        return this.authService.buscarGrupoPorCodigo(codigo);
    }

    // Rota PROTEGIDA para o casal atualizar o nome do seu espaço financeiro
    @Patch('casal')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Atualizar o nome do grupo do casal logado' })
    async atualizarCasal(@Body() body: UpdateCasalDto, @Req() req: any) {
        const casalId = req.user.casalId;
        return this.authService.atualizarNomeCasal(casalId, body.nome);
    }
}