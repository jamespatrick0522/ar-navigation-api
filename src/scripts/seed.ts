import 'dotenv/config';
import {NestFactory} from '@nestjs/core';
import {AppModule} from '../app.module';
import {DevSeedService} from '../modules/dev-seed/dev-seed.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(DevSeedService);
  await seedService.seed();
  await app.close();
}

void run();
