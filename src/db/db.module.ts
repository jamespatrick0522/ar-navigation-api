import {Global, Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';
export const DRIZZLE_DB = 'DRIZZLE_DB';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const useSsl = configService.get<boolean>('DATABASE_SSL', false);

        return new Pool({
          connectionString: databaseUrl,
          ssl: useSsl ? {rejectUnauthorized: false} : undefined,
        });
      },
    },
    {
      provide: DRIZZLE_DB,
      inject: [DATABASE_POOL],
      useFactory: (pool: Pool) => drizzle(pool),
    },
  ],
  exports: [DATABASE_POOL, DRIZZLE_DB],
})
export class DatabaseModule {}
