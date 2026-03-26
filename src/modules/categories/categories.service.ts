import {Inject, Injectable} from '@nestjs/common';
import {asc, eq} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {roomCategories} from 'src/db/schema';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async getAll() {
    return this.db.select().from(roomCategories).where(eq(roomCategories.isActive, true)).orderBy(asc(roomCategories.name));
  }
}
