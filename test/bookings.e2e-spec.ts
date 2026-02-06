import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Bookings E2E Tests', () => {
  let app: INestApplication;
  let sessionId: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Criar módulo de teste
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar configurações globais (igual ao main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api');

    await app.init();

    // Obter DataSource para limpar DB entre testes
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Criar sessão para todos os testes
    const sessionResponse = await request(app.getHttpServer())
      .post('/api/sessions')
      .send({
        movieName: 'Test Movie',
        roomNumber: 1,
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        priceCents: 2500,
        totalSeats: 16,
      });

    sessionId = sessionResponse.body.id;
  });

  afterAll(async () => {
    // Limpar banco
    await dataSource.dropDatabase();
    await app.close();
  });

  // Limpar dados entre testes (opcional)
  afterEach(async () => {
    // Se quiser resetar entre cada teste
    // await dataSource.synchronize(true);
  });

  describe('POST /api/bookings/reserve', () => {
    it('should reserve seats successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send({
          userId: 'test-user-1',
          sessionId,
          seatNumbers: ['A1', 'A2'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body.status).toBe('pending');
      expect(response.body.seatIds).toHaveLength(2);
    });

    it('should reject reservation for unavailable seat', async () => {
      // Primeira reserva
      const firstResponse = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send({
          userId: 'test-user-2',
          sessionId,
          seatNumbers: ['B1'],
        })
        .expect(201);

      expect(firstResponse.body).toHaveProperty('id');

      // Tenta reservar o mesmo assento (deve falhar)
      const conflictResponse = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send({
          userId: 'test-user-3',
          sessionId,
          seatNumbers: ['B1'],
        })
        .expect(409);

      expect(conflictResponse.body.statusCode).toBe(409);
      expect(conflictResponse.body.message).toContain('unavailable');
    });

    it('should validate DTO fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send({
          userId: 'invalid-uuid',
          sessionId: 'invalid-uuid',
          seatNumbers: [],
        })
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
    });

    it('should return cached result for duplicate request (idempotency)', async () => {
      const payload = {
        userId: 'test-user-idempotent',
        sessionId,
        seatNumbers: ['C1', 'C2'],
      };

      // Primeira requisição
      const firstResponse = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send(payload)
        .expect(201);

      const firstReservationId = firstResponse.body.id;

      // Segunda requisição idêntica (dentro de 30s)
      const secondResponse = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send(payload)
        .expect(201);

      // Deve retornar a mesma reserva
      expect(secondResponse.body.id).toBe(firstReservationId);
    });
  });

  describe('POST /api/bookings/confirm', () => {
    it('should confirm payment successfully', async () => {
      // Criar reserva
      const reservationResponse = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send({
          userId: 'test-user-4',
          sessionId,
          seatNumbers: ['D1'],
        })
        .expect(201);

      const reservationId = reservationResponse.body.id;

      // Confirmar pagamento
      const saleResponse = await request(app.getHttpServer())
        .post('/api/bookings/confirm')
        .send({
          reservationId,
          userId: 'test-user-4',
        })
        .expect(201);

      expect(saleResponse.body).toHaveProperty('id');
      expect(saleResponse.body).toHaveProperty('totalAmountCents');
      expect(saleResponse.body.totalAmountCents).toBe(2500); // 1 assento * 2500
      expect(saleResponse.body.userId).toBe('test-user-4');
    });

    it('should reject confirmation for non-existent reservation', async () => {
      await request(app.getHttpServer())
        .post('/api/bookings/confirm')
        .send({
          reservationId: '00000000-0000-0000-0000-000000000000',
          userId: 'test-user-5',
        })
        .expect(404);
    });

    it('should reject double confirmation', async () => {
      // Criar e confirmar reserva
      const reservationResponse = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send({
          userId: 'test-user-6',
          sessionId,
          seatNumbers: ['E1'],
        })
        .expect(201);

      const reservationId = reservationResponse.body.id;

      // Primeira confirmação
      await request(app.getHttpServer())
        .post('/api/bookings/confirm')
        .send({
          reservationId,
          userId: 'test-user-6',
        })
        .expect(201);

      // Segunda confirmação (deve retornar a mesma venda ou 409)
      const secondConfirm = await request(app.getHttpServer())
        .post('/api/bookings/confirm')
        .send({
          reservationId,
          userId: 'test-user-6',
        });

      // Pode ser 201 (idempotente) ou 409 (já confirmado)
      expect([201, 409]).toContain(secondConfirm.status);
    });
  });

  describe('GET /api/sessions/:id/availability', () => {
    it('should return real-time availability', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}/availability`)
        .expect(200);

      expect(response.body).toHaveProperty('session');
      expect(response.body).toHaveProperty('availableSeats');
      expect(response.body).toHaveProperty('reservedSeats');
      expect(response.body).toHaveProperty('soldSeats');
      expect(response.body.availableSeats).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/bookings/user/:userId', () => {
    it('should return user purchase history', async () => {
      const userId = 'test-user-history';

      // Criar e confirmar uma compra
      const reservationResponse = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send({
          userId,
          sessionId,
          seatNumbers: ['F1'],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/bookings/confirm')
        .send({
          reservationId: reservationResponse.body.id,
          userId,
        })
        .expect(201);

      // Buscar histórico
      const historyResponse = await request(app.getHttpServer())
        .get(`/api/bookings/user/${userId}`)
        .expect(200);

      expect(historyResponse.body).toHaveProperty('userId');
      expect(historyResponse.body).toHaveProperty('totalPurchases');
      expect(historyResponse.body.totalPurchases).toBeGreaterThanOrEqual(1);
      expect(historyResponse.body.purchases).toBeInstanceOf(Array);
    });
  });
});
