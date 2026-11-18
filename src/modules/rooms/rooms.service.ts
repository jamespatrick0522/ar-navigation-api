import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {and, asc, count, desc, eq, exists, ilike, inArray, or, sql} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {
  buildings,
  floors,
  navigationDemoConfigs,
  roomCategories,
  roomGallery,
  roomPeople,
  rooms,
} from 'src/db/schema';
import {ListRoomsQueryDto} from './dto/list-rooms-query.dto';

@Injectable()
export class RoomsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async listRooms(query: ListRoomsQueryDto) {
    const conditions = [eq(rooms.isActive, true)];

    const search = query.search?.trim();
    const term = search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : undefined;
    const nameTerms = search?.split(/\s+/).map(word => `%${word.replace(/[\\%_]/g, '\\$&')}%`) ?? [];
    // Match all name words on the same person, allowing omitted middle names or initials.
    const personMatch = term ? or(
      and(...nameTerms.map(word => ilike(roomPeople.fullName, word))),
      ilike(roomPeople.roleTitle, term),
    ) : undefined;
    if (term) {
      conditions.push(
        or(
          ilike(rooms.roomName, term),
          ilike(rooms.shortName, term),
          ilike(rooms.roomCode, term),
          ilike(rooms.searchableKeywords, term),
          exists(this.db.select({id: roomPeople.id}).from(roomPeople).where(and(
            eq(roomPeople.roomId, rooms.id),
            eq(roomPeople.isActive, true),
            personMatch,
          ))),
        )!,
      );
    }

    if (query.category) {
      conditions.push(eq(roomCategories.code, query.category));
    }
    if (query.buildingId) {
      conditions.push(eq(rooms.buildingId, query.buildingId));
    }
    if (query.floorId) {
      conditions.push(eq(rooms.floorId, query.floorId));
    }
    if (typeof query.featured === 'boolean') {
      conditions.push(eq(rooms.isFeatured, query.featured));
    }

    const whereClause = and(...conditions);
    const offset = (query.page - 1) * query.limit;

    const rows = await this.db
      .select({
        id: rooms.id,
        roomCode: rooms.roomCode,
        roomName: rooms.roomName,
        shortName: rooms.shortName,
        description: rooms.description,
        roomNumber: rooms.roomNumber,
        imageUrl: rooms.imageUrl,
        coverImageUrl: rooms.coverImageUrl,
        nearestLandmark: rooms.nearestLandmark,
        staticDistanceNote: rooms.staticDistanceNote,
        demoNavigationNote: rooms.demoNavigationNote,
        isFeatured: rooms.isFeatured,
        category: roomCategories.name,
        categoryCode: roomCategories.code,
        categoryColor: roomCategories.colorHex,
        buildingName: buildings.name,
        floorName: floors.floorName,
      })
      .from(rooms)
      .innerJoin(roomCategories, eq(rooms.categoryId, roomCategories.id))
      .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
      .innerJoin(floors, eq(rooms.floorId, floors.id))
      .where(whereClause)
      .orderBy(desc(rooms.isFeatured), asc(rooms.roomName))
      .limit(query.limit)
      .offset(offset);

    const [{total}] = await this.db
      .select({total: count()})
      .from(rooms)
      .innerJoin(roomCategories, eq(rooms.categoryId, roomCategories.id))
      .where(whereClause);

    const matchedPeople = term && rows.length > 0 ? await this.db
      .select({id: roomPeople.id, roomId: roomPeople.roomId, fullName: roomPeople.fullName, roleTitle: roomPeople.roleTitle})
      .from(roomPeople)
      .where(and(inArray(roomPeople.roomId, rows.map((row: {id: number}) => row.id)), eq(roomPeople.isActive, true), personMatch))
      .orderBy(desc(roomPeople.isPrimary), asc(roomPeople.fullName), asc(roomPeople.id)) : [];
    const peopleByRoom = new Map<number, Array<{id: number; fullName: string; roleTitle: string | null}>>();
    for (const {roomId, ...person} of matchedPeople) {
      const people = peopleByRoom.get(roomId) ?? [];
      people.push(person);
      peopleByRoom.set(roomId, people);
    }

    return {
      items: rows.map((row: {id: number}) => ({...row, matchedPeople: peopleByRoom.get(row.id) ?? []})),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async getRoomById(id: number) {
    const [room] = await this.db
      .select({
        id: rooms.id,
        roomCode: rooms.roomCode,
        roomName: rooms.roomName,
        shortName: rooms.shortName,
        description: rooms.description,
        roomNumber: rooms.roomNumber,
        imageUrl: rooms.imageUrl,
        coverImageUrl: rooms.coverImageUrl,
        nearestLandmark: rooms.nearestLandmark,
        operatingHours: rooms.operatingHours,
        contactEmail: rooms.contactEmail,
        contactPhone: rooms.contactPhone,
        locationNote: rooms.locationNote,
        staticDistanceNote: rooms.staticDistanceNote,
        demoNavigationNote: rooms.demoNavigationNote,
        capacity: rooms.capacity,
        tagsJson: rooms.tagsJson,
        buildingId: buildings.id,
        buildingName: buildings.name,
        floorId: floors.id,
        floorName: floors.floorName,
        categoryId: roomCategories.id,
        categoryName: roomCategories.name,
        categoryColor: roomCategories.colorHex,
      })
      .from(rooms)
      .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
      .innerJoin(floors, eq(rooms.floorId, floors.id))
      .innerJoin(roomCategories, eq(rooms.categoryId, roomCategories.id))
      .where(eq(rooms.id, id))
      .limit(1);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const people = await this.db
      .select()
      .from(roomPeople)
      .where(and(eq(roomPeople.roomId, id), eq(roomPeople.isActive, true)))
      .orderBy(desc(roomPeople.isPrimary), asc(roomPeople.fullName));

    const gallery = await this.db
      .select()
      .from(roomGallery)
      .where(eq(roomGallery.roomId, id))
      .orderBy(asc(roomGallery.sortOrder));

    const [navigationPreview] = await this.db
      .select()
      .from(navigationDemoConfigs)
      .where(eq(navigationDemoConfigs.roomId, id))
      .limit(1);

    return {
      ...room,
      people,
      gallery,
      navigationPreview,
    };
  }
}
