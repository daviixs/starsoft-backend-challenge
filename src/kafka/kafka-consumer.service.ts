import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { getKafkaConfig } from '../config/kafka.config';

type MessageHandler = (payload: any) => Promise<void>;

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka(getKafkaConfig(this.configService));
  }

  async onModuleDestroy() {
    for (const [topic, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      this.logger.log(`Consumer disconnected from ${topic}`);
    }
  }

  async subscribe(
    topic: string,
    groupId: string,
    handler: MessageHandler,
  ): Promise<void> {
    const consumer = this.kafka.consumer({ groupId });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { message } = payload;

        try {
          const data = JSON.parse(message.value!.toString());

          this.logger.debug(`Message received from ${topic}:`, data);

          await handler(data);
        } catch (error) {
          this.logger.error(`Error processing message from ${topic}:`, error);

          throw error;
        }
      },
    });

    this.consumers.set(topic, consumer);
    this.logger.log(`Consumer subscribed to ${topic} with group ${groupId}`);
  }
}
