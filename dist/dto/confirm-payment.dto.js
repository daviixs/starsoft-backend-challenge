"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmPaymentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ConfirmPaymentDto {
    reservationId;
    userId;
}
exports.ConfirmPaymentDto = ConfirmPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da reserva a confirmar (UUID v4)',
        example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'reservationId deve ser um UUID v4 válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'reservationId não pode ser vazio' }),
    __metadata("design:type", String)
], ConfirmPaymentDto.prototype, "reservationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do usuário que fez a reserva (UUID v4)',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'userId deve ser um UUID v4 válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'userId não pode ser vazio' }),
    __metadata("design:type", String)
], ConfirmPaymentDto.prototype, "userId", void 0);
//# sourceMappingURL=confirm-payment.dto.js.map