import {NestFactory} from '@nestjs/core';
import {DRIZZLE_DB} from '../db/db.module';
import {adminUsers} from '../db/schema';
import {AppModule} from '../app.module';
import {hashAdminPassword} from '../modules/admin-auth/admin-password';

const ADMIN_SEED_USERS = [
  {username: 'pacadmin', displayName: 'PAC Admin', password: 'PacAdmin@2026'},
  {username: 'demo_admin', displayName: 'Demo Admin', password: 'DemoAdmin@2026'},
] as const;

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const db = app.get(DRIZZLE_DB) as any;

  for (const user of ADMIN_SEED_USERS) {
    const passwordHash = hashAdminPassword(user.password);
    await db
      .insert(adminUsers)
      .values({
        username: user.username,
        displayName: user.displayName,
        passwordHash,
        role: 'admin',
        isActive: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: adminUsers.username,
        set: {
          displayName: user.displayName,
          passwordHash,
          role: 'admin',
          isActive: true,
          updatedAt: new Date(),
        },
      });
  }

  await app.close();
  console.log(`Seeded ${ADMIN_SEED_USERS.length} admin users.`);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
