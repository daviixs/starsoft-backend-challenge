import { KafkaConfig } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

export const getKafkaConfig = (configService: ConfigService): KafkaConfig => ({
  clientId: configService.get('KAFKA_CLIENT_ID'),
  brokers: configService.get('KAFKA_BROKERS').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});
