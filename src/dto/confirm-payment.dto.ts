import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'ID da reserva a confirmar (UUID v4)',
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  })
  @IsUUID('4', { message: 'reservationId deve ser um UUID v4 válido' })
  @IsNotEmpty({ message: 'reservationId não pode ser vazio' })
  reservationId: string;

  @ApiProperty({
    description: 'ID do usuário que fez a reserva (UUID v4)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'userId deve ser um UUID v4 válido' })
  @IsNotEmpty({ message: 'userId não pode ser vazio' })
  userId: string;
}
