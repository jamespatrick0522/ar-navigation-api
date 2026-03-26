import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {asc, eq} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {floors} from 'src/db/schema';

@Injectable()
export class FloorsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async getAll() {
    return this.db.select().from(floors).where(eq(floors.isActive, true)).orderBy(asc(floors.floorNumber));
  }

  async getOne(id: number) {
    const [floor] = await this.db.select().from(floors).where(eq(floors.id, id)).limit(1);
    if (!floor) {
      throw new NotFoundException('Floor not found');
    }
    return floor;
  }
}
