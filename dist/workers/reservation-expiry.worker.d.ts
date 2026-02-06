import { OnModuleInit } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Reservation } from '../modules/sessions/entities/reservation.entity';
import { Seat } from '../modules/sessions/entities/seat.entity';
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
export declare class ReservationExpiryWorker implements OnModuleInit {
    private reservationRepository;
    private seatRepository;
    private dataSource;
    private kafkaProducer;
    private kafkaConsumer;
    private readonly logger;
    constructor(reservationRepository: Repository<Reservation>, seatRepository: Repository<Seat>, dataSource: DataSource, kafkaProducer: KafkaProducerService, kafkaConsumer: KafkaConsumerService);
    onModuleInit(): Promise<void>;
    checkExpiredReservations(): Promise<void>;
    private expireReservation;
    private handleReservationCreated;
    forceExpireReservation(reservationId: string): Promise<void>;
}
