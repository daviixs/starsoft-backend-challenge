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
exports.ReserveSeatsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ReserveSeatsDto {
    userId;
    sessionId;
    seatNumbers;
}
exports.ReserveSeatsDto = ReserveSeatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do usuário (UUID v4)',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'userId deve ser um UUID v4 válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'userId não pode ser vazio' }),
    __metadata("design:type", String)
], ReserveSeatsDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da sessão de cinema (UUID v4)',
        example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'sessionId deve ser um UUID v4 válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'sessionId não pode ser vazio' }),
    __metadata("design:type", String)
], ReserveSeatsDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Lista de números dos assentos a reservar (formato: A1, B2, etc.)',
        example: ['A1', 'A2', 'A3'],
        type: [String],
        minItems: 1,
        maxItems: 10,
    }),
    (0, class_validator_1.IsArray)({ message: 'seatNumbers deve ser um array' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Deve reservar pelo menos 1 assento' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Máximo de 10 assentos por reserva' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Cada assento deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ each: true, message: 'Número do assento não pode ser vazio' }),
    (0, class_validator_1.Matches)(/^[A-H]\d{1,2}$/, {
        each: true,
        message: 'Cada assento deve seguir o formato: letra (A-H) + número (ex: A1, B12)',
    }),
    __metadata("design:type", Array)
], ReserveSeatsDto.prototype, "seatNumbers", void 0);
//# sourceMappingURL=reserve-seats.dto.js.map