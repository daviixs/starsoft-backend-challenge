import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type MessageHandler = (payload: any) => Promise<void>;
export declare class KafkaConsumerService implements OnModuleDestroy {
    private configService;
    private readonly logger;
    private kafka;
    private consumers;
    constructor(configService: ConfigService);
    onModuleDestroy(): Promise<void>;
    subscribe(topic: string, groupId: string, handler: MessageHandler): Promise<void>;
}
export {};
