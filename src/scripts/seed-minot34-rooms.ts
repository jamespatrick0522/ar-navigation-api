import {NestFactory} from '@nestjs/core';
import {eq} from 'drizzle-orm';
import {AppModule} from '../app.module';
import {DRIZZLE_DB} from '../db/db.module';
import {buildings, floors, roomCategories, rooms} from '../db/schema';

type RoomSeed = {
  name: string;
  type?: string;
};

const SCHOOL_PROFILE = {
  name: 'Philippine Advent College',
  campusName: 'Main Campus',
  address: 'Ramon Magsaysay, Sindangan, Zamboanga del Norte',
} as const;

const RAW_ROOM_SEEDS: RoomSeed[] = [
  {name: 'Nightingale', type: 'Nursing Room'},
  {name: 'Seacole', type: 'Nursing Room'},
  {name: 'Benner', type: 'Nursing Room'},
  {name: 'BSBA Room 101', type: 'College Room'},
  {name: 'BSBA Room 102', type: 'College Room'},
  {name: 'BSBA Room 103', type: 'College Room'},
  {name: 'BSBA Room 104', type: 'College Room'},
  {name: 'Henderson', type: 'College Room'},
  {name: 'BPA Room', type: 'College Room'},
  {name: 'Sora', type: 'College Room'},
  {name: 'Giron-Tupas', type: 'Nursing Room'},
  {name: 'Midwifery Skills Laboratory', type: 'Skills Laboratory'},
  {name: 'Grade 1', type: 'Elementary Room'},
  {name: 'Grade 2', type: 'Elementary Room'},
  {name: 'Grade 3', type: 'Elementary Room'},
  {name: 'Grade 4', type: 'Elementary Room'},
  {name: 'Grade 5', type: 'Elementary Room'},
  {name: 'Grade 6', type: 'Elementary Room'},
  {name: 'Myrtle Room'},
  {name: 'G-7 Mustard', type: 'High School Room'},
  {name: 'G-7 Sycamore', type: 'High School Room'},
  {name: 'School of Education Office'},
  {name: 'Kindergarten Room'},
  {name: 'Chapel'},
  {name: 'Conference Room'},
  {name: 'VPAA Office'},
  {name: 'College Computer Lab'},
  {name: 'Library'},
  {name: 'VP - Development Office'},
  {name: 'Guidance Office'},
  {name: 'MLK Laundry Shop'},
  {name: 'PAC Canteen'},
  {name: 'PAC Cafeteria'},
  {name: 'Gym'},
  {name: 'Tailoring'},
  {name: 'Microbiology Lab'},
  {name: 'Anatomy Lab'},
  {name: 'Caregiving NC II Room'},
  {name: 'FBS Room'},
  {name: 'Tech-Voc Office'},
  {name: 'Boys Dorm'},
  {name: 'Girls Dorm'},
  {name: "Elementary Principal's Office"},
  {name: 'School Clinic'},
  {name: 'BPA Department Office'},
  {name: 'VP - Student Affairs & Service / HRMO Office'},
  {name: 'Sardonyx Room'},
  {name: 'Jasper Room'},
  {name: 'Jade'},
  {name: 'Phyllite Room'},
  {name: 'Jacinth Room'},
  {name: 'Diamond Room'},
  {name: 'Gold Room'},
  {name: "Principal's Office"},
  {name: 'High School Faculty Office'},
  {name: 'G-8 Olive'},
  {name: 'G-10 Einstein'},
  {name: 'Pomegranate'},
  {name: 'Newton'},
  {name: 'G-9 Oganesson'},
  {name: 'Tennessine'},
  {name: 'Pathfinder Office I'},
  {name: 'Guard House'},
];

const CATEGORY_SEEDS = [
  {code: 'OFFICE', name: 'Office', description: 'Administrative and management offices', iconName: 'briefcase', colorHex: '#0EA5E9'},
  {code: 'ACADEMIC', name: 'Academic', description: 'Academic departments, rooms, and classrooms', iconName: 'book-open', colorHex: '#F59E0B'},
  {code: 'LABORATORY', name: 'Laboratory', description: 'Laboratory and skills rooms', iconName: 'flask-conical', colorHex: '#14B8A6'},
  {code: 'FACILITY', name: 'Facility', description: 'Campus facilities and shared areas', iconName: 'map-pin', colorHex: '#A855F7'},
  {code: 'SERVICE', name: 'Student Service', description: 'Public support and service rooms', iconName: 'heart', colorHex: '#22C55E'},
  {code: 'DORMITORY', name: 'Dormitory', description: 'Student residence areas', iconName: 'bed', colorHex: '#6366F1'},
] as const;

const createRoomCode = (roomName: string) =>
  roomName
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const shortNameFor = (name: string) => {
  if (name.length <= 78) return name;
  return name.slice(0, 77).trim();
};

const categoryCodeFor = (seed: RoomSeed) => {
  const name = seed.name.toLowerCase();
  const type = (seed.type ?? '').toLowerCase();

  if (name.includes('office') || name.includes('guidance') || name.includes('principal')) return 'OFFICE';
  if (name.includes('lab') || type.includes('laboratory')) return 'LABORATORY';
  if (name.includes('dorm')) return 'DORMITORY';
  if (
    name.includes('chapel') ||
    name.includes('canteen') ||
    name.includes('cafeteria') ||
    name.includes('gym') ||
    name.includes('laundry') ||
    name.includes('tailoring') ||
    name.includes('clinic') ||
    name.includes('guard house')
  ) return 'FACILITY';

  return 'ACADEMIC';
};

const uniqueRoomSeeds = () => {
  const map = new Map<string, RoomSeed>();
  for (const seed of RAW_ROOM_SEEDS) {
    const key = createRoomCode(seed.name);
    if (!map.has(key)) {
      map.set(key, seed);
    }
  }
  return [...map.values()];
};

async function upsertCategory(db: any, seed: typeof CATEGORY_SEEDS[number]) {
  const [category] = await db
    .insert(roomCategories)
    .values({...seed, isActive: true, updatedAt: new Date()})
    .onConflictDoUpdate({
      target: roomCategories.code,
      set: {...seed, isActive: true, updatedAt: new Date()},
    })
    .returning();
  return category;
}

async function upsertMainBuilding(db: any) {
  const [building] = await db
    .insert(buildings)
    .values({
      code: 'MAIN',
      name: 'Main Academic Building',
      description: `${SCHOOL_PROFILE.name} main building and directory reference for imported rooms.`,
      campusName: SCHOOL_PROFILE.campusName,
      address: SCHOOL_PROFILE.address,
      mapNote: 'Default building assignment for imported spreadsheet rooms until exact building mapping is finalized.',
      isActive: true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: buildings.code,
      set: {
        name: 'Main Academic Building',
        campusName: SCHOOL_PROFILE.campusName,
        address: SCHOOL_PROFILE.address,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();
  return building;
}

async function upsertGroundFloor(db: any, buildingId: number) {
  const existing = await db
    .select()
    .from(floors)
    .where(eq(floors.buildingId, buildingId));
  const ground = existing.find((floor: any) => floor.floorNumber === 1 || floor.floorName === 'Ground Floor');
  if (ground) {
    return ground;
  }

  const [floor] = await db
    .insert(floors)
    .values({
      buildingId,
      floorNumber: 1,
      floorName: 'Ground Floor',
      description: 'Default floor assignment for imported spreadsheet rooms.',
      isActive: true,
      updatedAt: new Date(),
    })
    .returning();
  return floor;
}

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const db = app.get(DRIZZLE_DB) as any;

  const categoryEntries = await Promise.all(CATEGORY_SEEDS.map(seed => upsertCategory(db, seed)));
  const categoryMap = new Map(categoryEntries.map((category: any) => [category.code, category]));
  const building = await upsertMainBuilding(db);
  const floor = await upsertGroundFloor(db, building.id);

  const seeds = uniqueRoomSeeds();
  let insertedOrUpdated = 0;

  for (const seed of seeds) {
    const categoryCode = categoryCodeFor(seed);
    const category = categoryMap.get(categoryCode);
    if (!category) {
      throw new Error(`Missing category ${categoryCode} for ${seed.name}`);
    }

    const roomCode = createRoomCode(seed.name);
    const typeLabel = seed.type ? ` (${seed.type})` : '';
    const description = `${seed.name}${typeLabel} is listed in the imported room directory and can be calibrated for AR navigation.`;

    await db
      .insert(rooms)
      .values({
        roomCode,
        roomName: seed.name,
        shortName: shortNameFor(seed.name),
        categoryId: category.id,
        buildingId: building.id,
        floorId: floor.id,
        description,
        roomNumber: null,
        imageUrl: null,
        coverImageUrl: null,
        nearestLandmark: 'To be calibrated from the main entrance route.',
        operatingHours: null,
        contactEmail: null,
        contactPhone: null,
        locationNote: 'Imported from MINOT34 room list. Exact location can be refined after calibration.',
        qrCodeValue: `${roomCode}-QR`,
        isFeatured: false,
        isActive: true,
        capacity: null,
        tagsJson: [seed.name, seed.type ?? '', building.name, floor.floorName].filter(Boolean),
        searchableKeywords: [seed.name, seed.type, building.name, floor.floorName, category.name].filter(Boolean).join(' '),
        staticDistanceNote: 'Distance will be available after AR route calibration.',
        demoNavigationNote: `Open ${seed.name}, then use Admin calibration to save an AR route.`,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: rooms.roomCode,
        set: {
          roomName: seed.name,
          shortName: shortNameFor(seed.name),
          categoryId: category.id,
          buildingId: building.id,
          floorId: floor.id,
          description,
          nearestLandmark: 'To be calibrated from the main entrance route.',
          locationNote: 'Imported from MINOT34 room list. Exact location can be refined after calibration.',
          isActive: true,
          tagsJson: [seed.name, seed.type ?? '', building.name, floor.floorName].filter(Boolean),
          searchableKeywords: [seed.name, seed.type, building.name, floor.floorName, category.name].filter(Boolean).join(' '),
          staticDistanceNote: 'Distance will be available after AR route calibration.',
          demoNavigationNote: `Open ${seed.name}, then use Admin calibration to save an AR route.`,
          updatedAt: new Date(),
        },
      });

    insertedOrUpdated += 1;
  }

  await app.close();
  console.log(`Seeded/upserted ${insertedOrUpdated} MINOT34 rooms.`);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});