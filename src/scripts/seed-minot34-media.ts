import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Client} from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import {and, eq, ne} from 'drizzle-orm';
import {buildings, floors, roomCategories, roomGallery, roomPeople, rooms} from '../db/schema';

type StaffMode = 'images-only' | 'primary-keep' | 'primary-replace';
export type MediaSourceRow = {
  sourceRow: number;
  sourceRoom: string;
  roomCode: string | null;
  personName: string | null;
  roomImageSourceUrl: string | null;
  personImageSourceUrl: string | null;
};
type NewRoom = {roomCode: string; roomName: string; categoryCode: string};
type Source = {sourceWorkbook: string; rows: MediaSourceRow[]; newRooms?: NewRoom[]};

export function driveImageId(source: string) {
  const url = new URL(source);
  const match = url.pathname.match(/^\/file\/d\/([\w-]+)\/view$/);
  if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com' || !match) {
    throw new Error(`Unsupported image source: ${source}`);
  }
  return match[1];
}

export function formatPersonName(value: string) {
  return value.trim().toLowerCase().replace(/^atty[,\.\s]*/, 'atty. ')
    .replace(/\b([a-z])\.(?=[a-z])/g, '$1. ')
    .replace(/\b[a-z]/g, letter => letter.toUpperCase()).replace(/\bJr\.?$/, 'Jr.');
}

function nameParts(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
    .filter(part => !['atty', 'mr', 'mrs', 'ms', 'dr', 'jr', 'sr'].includes(part));
}

export function samePerson(existing: string, incoming: string) {
  const left = nameParts(existing);
  const right = nameParts(incoming);
  return left.join(' ') === right.join(' ') ||
    (left.length >= 2 && right.length >= 2 && left[0] === right[0] && left.at(-1) === right.at(-1));
}

export function groupMediaRows(rows: MediaSourceRow[]) {
  const grouped = new Map<string, MediaSourceRow[]>();
  for (const row of rows) {
    if (!row.roomCode) throw new Error(`Row ${row.sourceRow}: confirm the room mapping for ${row.sourceRoom} first.`);
    grouped.set(row.roomCode, [...(grouped.get(row.roomCode) ?? []), row]);
  }
  return grouped;
}

export async function importRoomMedia(
  db: any,
  sourceRows: MediaSourceRow[],
  imageUrl: (source: string) => string,
  staffMode: StaffMode,
  newRooms: NewRoom[] = [],
) {
  const grouped = groupMediaRows(sourceRows);
  return db.transaction(async (tx: any) => {
    const report = {roomsCreated: 0, roomsUpdated: 0, galleryImagesAdded: 0, staffAdded: 0, staffUpdated: 0, staffMadeInactive: 0};
    for (const definition of newRooms) {
      const [existing] = await tx.select({id: rooms.id}).from(rooms).where(eq(rooms.roomCode, definition.roomCode)).limit(1);
      if (existing) continue;
      const [category] = await tx.select({id: roomCategories.id}).from(roomCategories).where(eq(roomCategories.code, definition.categoryCode)).limit(1);
      if (!category) throw new Error(`Missing category ${definition.categoryCode}`);
      await tx.insert(buildings).values({code: 'UNASSIGNED', name: 'Building to be confirmed', description: 'Location not supplied for imported rooms.'}).onConflictDoNothing();
      const [building] = await tx.select({id: buildings.id}).from(buildings).where(eq(buildings.code, 'UNASSIGNED')).limit(1);
      let [floor] = await tx.select({id: floors.id}).from(floors).where(and(eq(floors.buildingId, building.id), eq(floors.floorName, 'Floor to be confirmed'))).limit(1);
      if (!floor) [floor] = await tx.insert(floors).values({buildingId: building.id, floorNumber: 0, floorName: 'Floor to be confirmed'}).returning({id: floors.id});
      const inserted = await tx.insert(rooms).values({
        roomCode: definition.roomCode, roomName: definition.roomName, shortName: definition.roomName,
        categoryId: category.id, buildingId: building.id, floorId: floor.id,
        locationNote: 'Exact building and floor have not yet been verified.',
        searchableKeywords: definition.roomName,
      }).onConflictDoNothing().returning({id: rooms.id});
      report.roomsCreated += inserted.length;
    }
    // Only media and explicitly selected staff fields are written. Room IDs and route tables stay untouched.
    for (const [code, entries] of grouped) {
      const [room] = await tx.select({id: rooms.id, name: rooms.roomName}).from(rooms).where(eq(rooms.roomCode, code)).limit(1);
      if (!room) throw new Error(`Room ${code} not found. No records were changed.`);
      const photos = [...new Set(entries.map(row => row.roomImageSourceUrl).filter((url): url is string => !!url))];
      if (photos.length) {
        const primary = imageUrl(photos[0]);
        await tx.update(rooms).set({imageUrl: primary, coverImageUrl: primary, updatedAt: new Date()}).where(eq(rooms.id, room.id));
        report.roomsUpdated++;
        const gallery = await tx.select().from(roomGallery).where(eq(roomGallery.roomId, room.id));
        let order = gallery.reduce((max: number, item: {sortOrder: number}) => Math.max(max, item.sortOrder), -1) + 1;
        for (const photo of photos) {
          const url = imageUrl(photo);
          const filename = `${driveImageId(photo)}.jpg`;
          const existing = gallery.find((item: {imageUrl: string}) => item.imageUrl.endsWith(`/${filename}`));
          if (existing) {
            if (existing.imageUrl !== url) await tx.update(roomGallery).set({imageUrl: url}).where(eq(roomGallery.id, existing.id));
          } else {
            await tx.insert(roomGallery).values({roomId: room.id, imageUrl: url, imageType: 'room', caption: room.name, sortOrder: order++});
            report.galleryImagesAdded++;
          }
        }
      }
      if (staffMode === 'images-only') continue;
      for (const entry of entries.filter(row => !!row.personName)) {
        const incoming = formatPersonName(entry.personName!);
        const people = await tx.select().from(roomPeople).where(eq(roomPeople.roomId, room.id));
        const candidates = people.filter((person: {fullName: string}) => samePerson(person.fullName, incoming));
        if (candidates.length > 1) throw new Error(`Ambiguous staff match for ${incoming} in ${room.name}. No records were changed.`);
        const existing = candidates[0];
        const values = {
          fullName: existing && nameParts(existing.fullName).length >= nameParts(incoming).length ? existing.fullName : incoming,
          isPrimary: true,
          isActive: true,
          updatedAt: new Date(),
          ...(entry.personImageSourceUrl ? {imageUrl: imageUrl(entry.personImageSourceUrl)} : {}),
        };
        let personId: number;
        if (existing) {
          personId = existing.id;
          await tx.update(roomPeople).set(values).where(eq(roomPeople.id, personId));
          report.staffUpdated++;
        } else {
          const [inserted] = await tx.insert(roomPeople).values({roomId: room.id, roleTitle: 'Person in charge', ...values}).returning({id: roomPeople.id});
          personId = inserted.id;
          report.staffAdded++;
        }
        const oldPrimaries = await tx.update(roomPeople)
          .set({isPrimary: false, ...(staffMode === 'primary-replace' ? {isActive: false} : {}), updatedAt: new Date()})
          .where(and(eq(roomPeople.roomId, room.id), eq(roomPeople.isPrimary, true), ne(roomPeople.id, personId)))
          .returning({id: roomPeople.id});
        if (staffMode === 'primary-replace') report.staffMadeInactive += oldPrimaries.length;
      }
    }
    return report;
  });
}

async function run() {
  const sourcePath = process.argv.find(arg => arg.startsWith('--source='))?.slice('--source='.length) ?? 'src/scripts/data/minot34-public-links.json';
  const source = JSON.parse(await readFile(resolve(sourcePath), 'utf8')) as Source;
  const staffMode = (process.argv.find(arg => arg.startsWith('--staff-mode='))?.split('=')[1] ?? 'images-only') as StaffMode;
  if (!['images-only', 'primary-keep', 'primary-replace'].includes(staffMode)) throw new Error('Invalid --staff-mode');
  const dryRun = process.argv.includes('--dry-run');
  const base = new URL(process.argv.find(arg => arg.startsWith('--base-url='))?.slice('--base-url='.length) ?? 'https://ar-navigation-api.onrender.com');
  if (!['https:', 'http:'].includes(base.protocol)) throw new Error('Invalid media base URL');
  const grouped = groupMediaRows(source.rows);
  const links = [...new Set(source.rows.flatMap(row => [row.roomImageSourceUrl, row.personImageSourceUrl]).filter((url): url is string => !!url))];
  for (const link of links) {
    const file = await readFile(resolve('public/room-images', `${driveImageId(link)}.jpg`));
    if (file[0] !== 0xff || file[1] !== 0xd8 || file.at(-2) !== 0xff || file.at(-1) !== 0xd9) throw new Error(`Invalid JPEG: ${link}`);
  }
  const client = new Client({connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000});
  await client.connect();
  try {
    const db = drizzle(client);
    const codes = (await client.query('SELECT room_code FROM public.rooms')).rows.map(row => row.room_code);
    for (const code of grouped.keys()) if (!codes.includes(code) && !source.newRooms?.some(room => room.roomCode === code)) throw new Error(`Room ${code} not found. Import stopped before any updates.`);
    const navigationDigest = async () => (await client.query(`SELECT md5(COALESCE(string_agg(row_to_json(r)::text, '|' ORDER BY r.id), '')) AS routes FROM public.ar_navigation_routes r`)).rows[0].routes + ':' +
      (await client.query(`SELECT md5(COALESCE(string_agg(row_to_json(p)::text, '|' ORDER BY p.id), '')) AS points FROM public.ar_navigation_route_points p`)).rows[0].points;
    const before = await navigationDigest();
    if (dryRun) {
      console.log(JSON.stringify({dryRun,workbook:source.sourceWorkbook,rooms:grouped.size,newRooms:source.newRooms,roomCodes:[...grouped.keys()],verifiedImages:links.length,staffMode}, null, 2));
      return;
    }
    const report = await importRoomMedia(db, source.rows, link => new URL(`/media/room-images/${driveImageId(link)}.jpg`, base).toString(), staffMode, source.newRooms);
    const after = await navigationDigest();
    console.log(JSON.stringify({...report, navigationUnchanged: before === after, verifiedImages: links.length, staffMode}, null, 2));
    if (before !== after) throw new Error('Navigation data changed during the import. Investigate concurrent calibration activity.');
  } finally {
    await client.end();
  }
}

if (require.main === module) run().catch(error => {console.error(error.message); process.exitCode = 1;});
