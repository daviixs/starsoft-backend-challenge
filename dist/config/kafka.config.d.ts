import { KafkaConfig } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
export declare const getKafkaConfig: (configService: ConfigService) => KafkaConfig;
