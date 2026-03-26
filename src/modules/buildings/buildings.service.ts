import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {asc, eq} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {buildings} from 'src/db/schema';

@Injectable()
export class BuildingsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async getAll() {
    return this.db.select().from(buildings).where(eq(buildings.isActive, true)).orderBy(asc(buildings.name));
  }

  async getOne(id: number) {
    const [building] = await this.db.select().from(buildings).where(eq(buildings.id, id)).limit(1);
    if (!building) {
      throw new NotFoundException('Building not found');
    }
    return building;
  }
}
