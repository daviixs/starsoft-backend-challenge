import { Module, Global } from '@nestjs/common';
import { RedisLockService } from '../redis/redis-lock.service';
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';

@Global() 
@Module({
  providers: [RedisLockService, KafkaProducerService, KafkaConsumerService],
  exports: [RedisLockService, KafkaProducerService, KafkaConsumerService],
})
export class SharedModule {}
