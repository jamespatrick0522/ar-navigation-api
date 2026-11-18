import 'reflect-metadata';
import 'dotenv/config';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {Client} from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import {RoomsService} from '../src/modules/rooms/rooms.service';
import {ListRoomsQueryDto} from '../src/modules/rooms/dto/list-rooms-query.dto';

test('room search matches active assigned names/roles without duplicate rooms and preserves filters/pagination', {skip: !process.env.DATABASE_URL}, async () => {
  const url = new URL(process.env.DATABASE_URL!);
  if (url.hostname.endsWith('.neon.tech')) url.hostname = url.hostname.replace('-pooler.', '.');
  const client = new Client({connectionString: url.toString(), application_name: 'school-ar-room-search-tests', connectionTimeoutMillis: 15000});
  await client.connect();
  try {
    // Direct connection, temporary tables, and explicit IDs keep school data and sequences untouched.
    await client.query(`
      CREATE TEMP TABLE buildings (LIKE public.buildings INCLUDING DEFAULTS);
      CREATE TEMP TABLE floors (LIKE public.floors INCLUDING DEFAULTS);
      CREATE TEMP TABLE room_categories (LIKE public.room_categories INCLUDING DEFAULTS);
      CREATE TEMP TABLE rooms (LIKE public.rooms INCLUDING DEFAULTS);
      CREATE TEMP TABLE room_people (LIKE public.room_people INCLUDING DEFAULTS);
      INSERT INTO buildings (id,code,name) VALUES (1,'MAIN','Main Building'),(2,'ANNEX','Annex');
      INSERT INTO floors (id,building_id,floor_number,floor_name) VALUES (1,1,1,'Ground Floor'),(2,2,2,'Second Floor');
      INSERT INTO room_categories (id,code,name) VALUES (1,'OFFICE','Office'),(2,'ACADEMIC','Academic');
      INSERT INTO rooms (id,room_code,room_name,category_id,building_id,floor_id,is_active) VALUES
        (1,'REG','Registrar',1,1,1,true),(2,'CASH','Cashier',2,2,2,true),
        (3,'HIDDEN','Hidden Room',1,1,1,false),(4,'SPECIAL','Room 100%_A',1,1,1,true);
      INSERT INTO room_people (id,room_id,full_name,role_title,is_active,is_primary) VALUES
        (1,1,'Ana Dela Cruz','Manager',true,true),(2,2,'Ana Dela Cruz','Manager',true,true),
        (3,1,'Ana Reyes','Assistant',true,false),(4,2,'Hidden Person','Dean',false,false),
        (5,3,'Ghost Person','Dean',true,true),
        (6,1,'Leodith P. Rodrigo',NULL,true,false),
        (7,2,'Gladys Mae Cuevas Pielago','Instructor',true,false);
    `);
    const service = new RoomsService(drizzle(client));
    const search = (term: string, filters: Partial<ListRoomsQueryDto> = {}) =>
      service.listRooms(Object.assign(new ListRoomsQueryDto(), {search: term, page: 1, limit: 50}, filters));

    const names = await search('  aNa  ');
    assert.equal(names.total, 2);
    assert.deepEqual(names.items.map((r: {id: number}) => r.id).sort(), [1, 2]);
    assert.equal(names.items.find((r: {id: number}) => r.id === 1)!.matchedPeople.length, 2);
    assert.equal(names.items.find((r: {id: number}) => r.id === 2)!.matchedPeople[0].fullName, 'Ana Dela Cruz');
    assert.equal((await search('Manager')).total, 2);
    assert.equal((await search('Dean')).total, 0);
    assert.equal((await search('Ghost')).total, 0);
    const middleInitial = await search('  leodith   RODRIGO  ');
    assert.equal(middleInitial.total, 1);
    assert.equal(middleInitial.items[0].id, 1);
    assert.deepEqual(middleInitial.items[0].matchedPeople.map((p: {fullName: string}) => p.fullName), ['Leodith P. Rodrigo']);
    assert.equal((await search('Gladys Pielago')).items[0].id, 2);
    assert.equal((await search('Pielago Gladys')).items[0].id, 2);
    assert.equal((await search('Ana Pielago')).total, 0);
    assert.equal((await search('Ana', {category: 'OFFICE'})).total, 1);
    assert.equal((await search('Ana', {buildingId: 2})).items[0].id, 2);
    assert.equal((await search('Ana', {floorId: 1})).items[0].id, 1);
    const page = await search('Ana', {page: 2, limit: 1});
    assert.equal(page.total, 2);
    assert.equal(page.totalPages, 2);
    assert.equal(page.items.length, 1);
    assert.equal(page.items[0].id, 1);
    assert.deepEqual((await search('Registrar')).items[0].matchedPeople, []);
    assert.equal((await search('Room 100%')).total, 1);
    assert.equal((await search('_')).total, 1);
    assert.equal((await search('   ')).total, 3);
  } finally {
    try {
      await client.query('DROP TABLE IF EXISTS pg_temp.room_people, pg_temp.rooms, pg_temp.room_categories, pg_temp.floors, pg_temp.buildings');
    } finally {
      await client.end();
    }
  }
});
