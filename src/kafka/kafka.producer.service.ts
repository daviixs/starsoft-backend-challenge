import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { getKafkaConfig } from '../config/kafka.config';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.kafka = new Kafka(getKafkaConfig(this.configService));
    this.producer = this.kafka.producer();

    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publish(topic: string, message: any, key?: string): Promise<void> {
    try {
      const record: ProducerRecord = {
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
    } catch (error) {
      this.logger.error(`Failed to publish to ${topic}:`, error);
      throw error;
    }
  }

  async publishBatch(topic: string, messages: any[]): Promise<void> {
    try {
      const record: ProducerRecord = {
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

      this.logger.debug(
        `Batch of ${messages.length} messages published to ${topic}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish batch to ${topic}:`, error);
      throw error;
    }
  }
}
