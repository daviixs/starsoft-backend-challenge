import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private kafka;
    private producer;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publish(topic: string, message: any, key?: string): Promise<void>;
    publishBatch(topic: string, messages: any[]): Promise<void>;
}
