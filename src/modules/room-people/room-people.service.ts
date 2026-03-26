import {Inject, Injectable} from '@nestjs/common';
import {and, asc, eq} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {roomPeople} from 'src/db/schema';

@Injectable()
export class RoomPeopleService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async getByRoomId(roomId: number) {
    return this.db
      .select()
      .from(roomPeople)
      .where(and(eq(roomPeople.roomId, roomId), eq(roomPeople.isActive, true)))
      .orderBy(asc(roomPeople.fullName));
  }
}
