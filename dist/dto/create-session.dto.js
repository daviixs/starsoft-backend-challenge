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
exports.CreateSessionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateSessionDto {
    movieName;
    roomNumber;
    startsAt;
    priceCents;
    totalSeats;
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do filme',
        example: 'Interstellar',
        minLength: 1,
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)({ message: 'movieName deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'movieName não pode ser vazio' }),
    (0, class_validator_1.MinLength)(1, { message: 'movieName deve ter no mínimo 1 caractere' }),
    (0, class_validator_1.MaxLength)(255, { message: 'movieName deve ter no máximo 255 caracteres' }),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "movieName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número da sala de cinema',
        example: 5,
        minimum: 1,
        maximum: 20,
    }),
    (0, class_validator_1.IsInt)({ message: 'roomNumber deve ser um número inteiro' }),
    (0, class_validator_1.Min)(1, { message: 'roomNumber deve ser no mínimo 1' }),
    (0, class_validator_1.Max)(20, { message: 'roomNumber deve ser no máximo 20' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSessionDto.prototype, "roomNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data e hora de início da sessão (ISO 8601)',
        example: '2026-03-15T19:30:00.000Z',
    }),
    (0, class_validator_1.IsDateString)({}, { message: 'startsAt deve ser uma data válida no formato ISO 8601' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'startsAt não pode ser vazio' }),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "startsAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preço do ingresso em centavos (ex: 2500 = R$ 25,00)',
        example: 2500,
        minimum: 1000,
    }),
    (0, class_validator_1.IsInt)({ message: 'priceCents deve ser um número inteiro' }),
    (0, class_validator_1.Min)(1000, { message: 'priceCents deve ser no mínimo 1000 (R$ 10,00)' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSessionDto.prototype, "priceCents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade total de assentos da sessão',
        example: 40,
        minimum: 16,
        maximum: 100,
    }),
    (0, class_validator_1.IsInt)({ message: 'totalSeats deve ser um número inteiro' }),
    (0, class_validator_1.Min)(16, { message: 'totalSeats deve ser no mínimo 16 (requisito mínimo)' }),
    (0, class_validator_1.Max)(100, { message: 'totalSeats deve ser no máximo 100' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSessionDto.prototype, "totalSeats", void 0);
//# sourceMappingURL=create-session.dto.js.map