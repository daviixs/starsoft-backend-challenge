"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKafkaConfig = void 0;
const getKafkaConfig = (configService) => ({
    clientId: configService.get('KAFKA_CLIENT_ID'),
    brokers: configService.get('KAFKA_BROKERS').split(','),
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
});
exports.getKafkaConfig = getKafkaConfig;
//# sourceMappingURL=kafka.config.js.map