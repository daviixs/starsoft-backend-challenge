import {
  IsString,
  IsInt,
  IsDateString,
  Min,
  Max,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Nome do filme',
    example: 'Interstellar',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'movieName deve ser uma string' })
  @IsNotEmpty({ message: 'movieName não pode ser vazio' })
  @MinLength(1, { message: 'movieName deve ter no mínimo 1 caractere' })
  @MaxLength(255, { message: 'movieName deve ter no máximo 255 caracteres' })
  movieName: string;

  @ApiProperty({
    description: 'Número da sala de cinema',
    example: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsInt({ message: 'roomNumber deve ser um número inteiro' })
  @Min(1, { message: 'roomNumber deve ser no mínimo 1' })
  @Max(20, { message: 'roomNumber deve ser no máximo 20' })
  @Type(() => Number)
  roomNumber: number;

  @ApiProperty({
    description: 'Data e hora de início da sessão (ISO 8601)',
    example: '2026-03-15T19:30:00.000Z',
  })
  @IsDateString(
    {},
    { message: 'startsAt deve ser uma data válida no formato ISO 8601' },
  )
  @IsNotEmpty({ message: 'startsAt não pode ser vazio' })
  startsAt: string;

  @ApiProperty({
    description: 'Preço do ingresso em centavos (ex: 2500 = R$ 25,00)',
    example: 2500,
    minimum: 1000,
  })
  @IsInt({ message: 'priceCents deve ser um número inteiro' })
  @Min(1000, { message: 'priceCents deve ser no mínimo 1000 (R$ 10,00)' })
  @Type(() => Number)
  priceCents: number;

  @ApiProperty({
    description: 'Quantidade total de assentos da sessão',
    example: 40,
    minimum: 16,
    maximum: 100,
  })
  @IsInt({ message: 'totalSeats deve ser um número inteiro' })
  @Min(16, { message: 'totalSeats deve ser no mínimo 16 (requisito mínimo)' })
  @Max(100, { message: 'totalSeats deve ser no máximo 100' })
  @Type(() => Number)
  totalSeats: number;
}
