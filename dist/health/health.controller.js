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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let HealthController = class HealthController {
    health;
    db;
    configService;
    redisClient;
    constructor(health, db, configService) {
        this.health = health;
        this.db = db;
        this.configService = configService;
        this.redisClient = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST'),
            port: this.configService.get('REDIS_PORT'),
        });
    }
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.redisCheck(),
        ]);
    }
    async redisCheck() {
        try {
            await this.redisClient.ping();
            return { redis: { status: 'up' } };
        }
        catch (error) {
            return { redis: { status: 'down', error: error.message } };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar saúde da aplicação' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.TypeOrmHealthIndicator,
        config_1.ConfigService])
], HealthController);
//# sourceMappingURL=health.controller.js.map