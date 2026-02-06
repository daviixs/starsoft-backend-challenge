import {
  IsUUID,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReserveSeatsDto {
  @ApiProperty({
    description: 'ID do usuário (UUID v4)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'userId deve ser um UUID v4 válido' })
  @IsNotEmpty({ message: 'userId não pode ser vazio' })
  userId: string;

  @ApiProperty({
    description: 'ID da sessão de cinema (UUID v4)',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  @IsUUID('4', { message: 'sessionId deve ser um UUID v4 válido' })
  @IsNotEmpty({ message: 'sessionId não pode ser vazio' })
  sessionId: string;

  @ApiProperty({
    description:
      'Lista de números dos assentos a reservar (formato: A1, B2, etc.)',
    example: ['A1', 'A2', 'A3'],
    type: [String],
    minItems: 1,
    maxItems: 10,
  })
  @IsArray({ message: 'seatNumbers deve ser um array' })
  @ArrayMinSize(1, { message: 'Deve reservar pelo menos 1 assento' })
  @ArrayMaxSize(10, { message: 'Máximo de 10 assentos por reserva' })
  @IsString({ each: true, message: 'Cada assento deve ser uma string' })
  @IsNotEmpty({ each: true, message: 'Número do assento não pode ser vazio' })
  @Matches(/^[A-H]\d{1,2}$/, {
    each: true,
    message:
      'Cada assento deve seguir o formato: letra (A-H) + número (ex: A1, B12)',
  })
  seatNumbers: string[];
}
