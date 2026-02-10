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
var KafkaConsumerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaConsumerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafkajs_1 = require("kafkajs");
const kafka_config_1 = require("../config/kafka.config");
let KafkaConsumerService = KafkaConsumerService_1 = class KafkaConsumerService {
    configService;
    logger = new common_1.Logger(KafkaConsumerService_1.name);
    kafka;
    consumers = new Map();
    constructor(configService) {
        this.configService = configService;
        this.kafka = new kafkajs_1.Kafka((0, kafka_config_1.getKafkaConfig)(this.configService));
    }
    async onModuleDestroy() {
        for (const [topic, consumer] of this.consumers.entries()) {
            await consumer.disconnect();
            this.logger.log(`Consumer disconnected from ${topic}`);
        }
    }
    async subscribe(topic, groupId, handler) {
        const consumer = this.kafka.consumer({ groupId });
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: false });
        await consumer.run({
            eachMessage: async (payload) => {
                const { message } = payload;
                try {
                    const data = JSON.parse(message.value.toString());
                    this.logger.debug(`Message received from ${topic}:`, data);
                    await handler(data);
                }
                catch (error) {
                    this.logger.error(`Error processing message from ${topic}:`, error);
                    throw error;
                }
            },
        });
        this.consumers.set(topic, consumer);
        this.logger.log(`Consumer subscribed to ${topic} with group ${groupId}`);
    }
};
exports.KafkaConsumerService = KafkaConsumerService;
exports.KafkaConsumerService = KafkaConsumerService = KafkaConsumerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KafkaConsumerService);
//# sourceMappingURL=kafka-consumer.service.js.map