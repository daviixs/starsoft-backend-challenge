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
exports.Sale = void 0;
const typeorm_1 = require("typeorm");
const reservation_entity_1 = require("./reservation.entity");
let Sale = class Sale {
    id;
    reservationId;
    userId;
    totalAmountCents;
    confirmedAt;
    reservation;
};
exports.Sale = Sale;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Sale.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reservation_id' }),
    __metadata("design:type", String)
], Sale.prototype, "reservationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], Sale.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount_cents', type: 'int' }),
    __metadata("design:type", Number)
], Sale.prototype, "totalAmountCents", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'confirmed_at' }),
    __metadata("design:type", Date)
], Sale.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reservation_entity_1.Reservation),
    (0, typeorm_1.JoinColumn)({ name: 'reservation_id' }),
    __metadata("design:type", reservation_entity_1.Reservation)
], Sale.prototype, "reservation", void 0);
exports.Sale = Sale = __decorate([
    (0, typeorm_1.Entity)('sales'),
    (0, typeorm_1.Unique)(['reservationId'])
], Sale);
//# sourceMappingURL=sale.entity.js.map