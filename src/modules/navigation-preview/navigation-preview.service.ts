import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {eq} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {navigationDemoConfigs} from 'src/db/schema';

@Injectable()
export class NavigationPreviewService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async getByRoomId(roomId: number) {
    const [config] = await this.db
      .select()
      .from(navigationDemoConfigs)
      .where(eq(navigationDemoConfigs.roomId, roomId))
      .limit(1);

    if (!config) {
      throw new NotFoundException('Navigation preview not found');
    }

    return config;
  }
}
