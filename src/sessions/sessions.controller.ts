import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from '../dto/create-session.dto';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova sessão de cinema' })
  @ApiResponse({ status: 201, description: 'Sessão criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.createSession(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as sessões' })
  @ApiResponse({ status: 200, description: 'Lista de sessões retornada' })
  async findAll() {
    return this.sessionsService.findAll();
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Consultar disponibilidade de assentos' })
  @ApiParam({ name: 'id', description: 'ID da sessão (UUID)' })
  @ApiResponse({ status: 200, description: 'Disponibilidade retornada' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async getAvailability(@Param('id') id: string) {
    return this.sessionsService.getAvailability(id);
  }
}
