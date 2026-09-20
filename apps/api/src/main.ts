import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';

const context = () => ({ request_id: randomUUID(), correlation_id: randomUUID() });

@Controller('health')
class HealthController {
  private response() {
    return {
      status: 'ok',
      service: 'api',
      version: process.env['APP_VERSION'] ?? '0.1.0',
      environment: process.env['NODE_ENV'] ?? 'local',
      timestamp: new Date().toISOString(),
      ...context(),
    };
  }

  @Get('live')
  live() {
    return this.response();
  }

  @Get('ready')
  ready() {
    return this.response();
  }
}

@Module({ controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter(), { bufferLogs: true });
  await app.listen(Number(process.env['PORT'] ?? 3000), '0.0.0.0');
}

void bootstrap();
