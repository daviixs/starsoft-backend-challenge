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
var KafkaProducerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaProducerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafkajs_1 = require("kafkajs");
const kafka_config_1 = require("../config/kafka.config");
let KafkaProducerService = KafkaProducerService_1 = class KafkaProducerService {
    configService;
    logger = new common_1.Logger(KafkaProducerService_1.name);
    kafka;
    producer;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        this.kafka = new kafkajs_1.Kafka((0, kafka_config_1.getKafkaConfig)(this.configService));
        this.producer = this.kafka.producer();
        await this.producer.connect();
        this.logger.log('Kafka producer connected');
    }
    async onModuleDestroy() {
        await this.producer.disconnect();
    }
    async publish(topic, message, key) {
        try {
            const record = {
                topic,
                messages: [
                    {
                        key: key || message.id || Date.now().toString(),
                        value: JSON.stringify(message),
                        headers: {
                            timestamp: Date.now().toString(),
                        },
                    },
                ],
            };
            await this.producer.send(record);
            this.logger.debug(`Message published to ${topic}:`, message);
        }
        catch (error) {
            this.logger.error(`Failed to publish to ${topic}:`, error);
            throw error;
        }
    }
    async publishBatch(topic, messages) {
        try {
            const record = {
                topic,
                messages: messages.map((msg) => ({
                    key: msg.id || Date.now().toString(),
                    value: JSON.stringify(msg),
                    headers: {
                        timestamp: Date.now().toString(),
                    },
                })),
            };
            await this.producer.send(record);
            this.logger.debug(`Batch of ${messages.length} messages published to ${topic}`);
        }
        catch (error) {
            this.logger.error(`Failed to publish batch to ${topic}:`, error);
            throw error;
        }
    }
};
exports.KafkaProducerService = KafkaProducerService;
exports.KafkaProducerService = KafkaProducerService = KafkaProducerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KafkaProducerService);
//# sourceMappingURL=kafka.producer.service.js.map