import {Inject, Injectable} from '@nestjs/common';
import {
  Building,
  Floor,
  RoomCategory,
  buildings,
  floors,
  navigationAnchors,
  navigationDemoConfigs,
  navigationRoutes,
  navigationRouteSteps,
  qrEntries,
  roomCategories,
  roomGallery,
  roomPeople,
  rooms,
  adminUsers,
} from 'src/db/schema';
import {DRIZZLE_DB} from 'src/db/db.module';
import {hashAdminPassword} from '../admin-auth/admin-password';

type SeedRoom = {
  roomName: string;
  shortName: string;
  headInstructor: string | null;
  categoryCode: string;
  buildingCode: 'MAIN' | 'ANNEX';
  floorName: 'Ground Floor' | 'Second Floor';
  roomNumber: string;
};

const SCHOOL_PROFILE = {
  name: 'Philippine Advent College',
  campusName: 'Main Campus',
  address: 'Ramon Magsaysay, Sindangan, Zamboanga del Norte',
  email: 'philippineadventcollege@gmail.com',
  contact: '(065)-224-2700/2038 | 09361116589',
  schoolDirectoryQr: 'PHILIPPINE-ADVENT-COLLEGE-DIRECTORY',
} as const;

const roomSeed: SeedRoom[] = [
  {roomName: 'Business Office', shortName: 'Business', headInstructor: 'Marquinjo Kenneth C. Macias', categoryCode: 'OFFICE', buildingCode: 'MAIN', floorName: 'Ground Floor', roomNumber: '101'},
  {roomName: 'Registrar', shortName: 'Registrar', headInstructor: 'Leodith P. Rodrigo', categoryCode: 'OFFICE', buildingCode: 'MAIN', floorName: 'Ground Floor', roomNumber: '102'},
  {roomName: 'Cashier', shortName: 'Cashier', headInstructor: 'Myra Paculanang', categoryCode: 'OFFICE', buildingCode: 'MAIN', floorName: 'Ground Floor', roomNumber: '103'},
  {roomName: 'Treasurer', shortName: 'Treasurer', headInstructor: 'Jaygen S. Villarosa', categoryCode: 'OFFICE', buildingCode: 'MAIN', floorName: 'Ground Floor', roomNumber: '104'},
  {roomName: 'VPAA Office', shortName: 'VPAA', headInstructor: 'Arlene B. Benago', categoryCode: 'OFFICE', buildingCode: 'MAIN', floorName: 'Second Floor', roomNumber: '201'},
  {roomName: 'Office of the President', shortName: 'President', headInstructor: 'Mariano Joaquin C. Macias Jr.', categoryCode: 'OFFICE', buildingCode: 'MAIN', floorName: 'Second Floor', roomNumber: '202'},
  {roomName: 'College Faculty', shortName: 'College Faculty', headInstructor: 'Jewel Colette R. Galido', categoryCode: 'ACADEMIC', buildingCode: 'ANNEX', floorName: 'Second Floor', roomNumber: 'A-201'},
  {roomName: 'Computer Studies Office', shortName: 'Computer Studies', headInstructor: 'Gladys Mae Cuevas Pielago', categoryCode: 'ACADEMIC', buildingCode: 'ANNEX', floorName: 'Ground Floor', roomNumber: 'A-101'},
  {roomName: 'Midwifery Office', shortName: 'Midwifery', headInstructor: 'Jennifer Cuenca', categoryCode: 'ACADEMIC', buildingCode: 'ANNEX', floorName: 'Ground Floor', roomNumber: 'A-102'},
  {roomName: 'HS Computer Laboratory', shortName: 'HS Computer Lab', headInstructor: 'Junmar Abrenica', categoryCode: 'ACADEMIC', buildingCode: 'ANNEX', floorName: 'Ground Floor', roomNumber: 'A-103'},
  {roomName: 'School of Education Office', shortName: 'Education Office', headInstructor: null, categoryCode: 'ACADEMIC', buildingCode: 'MAIN', floorName: 'Second Floor', roomNumber: '203'},
  {roomName: 'Pastoral Office', shortName: 'Pastoral', headInstructor: null, categoryCode: 'SERVICE', buildingCode: 'MAIN', floorName: 'Ground Floor', roomNumber: '105'},
  {roomName: 'Business Education Department Office', shortName: 'Business Education', headInstructor: null, categoryCode: 'ACADEMIC', buildingCode: 'MAIN', floorName: 'Second Floor', roomNumber: '204'},
  {roomName: 'Principal\'s Office', shortName: 'Principal', headInstructor: null, categoryCode: 'OFFICE', buildingCode: 'MAIN', floorName: 'Ground Floor', roomNumber: '106'},
  {roomName: 'Elementary Principal\'s Office', shortName: 'Elem Principal', headInstructor: null, categoryCode: 'OFFICE', buildingCode: 'MAIN', floorName: 'Ground Floor', roomNumber: '107'},
  {roomName: 'BPA Department', shortName: 'BPA Dept', headInstructor: 'Rhenjel Paglinawan', categoryCode: 'ACADEMIC', buildingCode: 'ANNEX', floorName: 'Second Floor', roomNumber: 'A-202'},
  {roomName: 'Pathfinder Office', shortName: 'Pathfinder', headInstructor: null, categoryCode: 'SERVICE', buildingCode: 'MAIN', floorName: 'Ground Floor', roomNumber: '108'},
  {roomName: 'High School Faculty Office', shortName: 'HS Faculty', headInstructor: null, categoryCode: 'ACADEMIC', buildingCode: 'ANNEX', floorName: 'Second Floor', roomNumber: 'A-203'},
  {roomName: 'ROTC Office', shortName: 'ROTC', headInstructor: null, categoryCode: 'SERVICE', buildingCode: 'ANNEX', floorName: 'Ground Floor', roomNumber: 'A-104'},
  {roomName: 'Educ Room 101', shortName: 'Educ 101', headInstructor: null, categoryCode: 'ACADEMIC', buildingCode: 'MAIN', floorName: 'Second Floor', roomNumber: 'E-101'},
  {roomName: 'Educ Room 102', shortName: 'Educ 102', headInstructor: null, categoryCode: 'ACADEMIC', buildingCode: 'MAIN', floorName: 'Second Floor', roomNumber: 'E-102'},
  {roomName: 'Educ Room 103', shortName: 'Educ 103', headInstructor: null, categoryCode: 'ACADEMIC', buildingCode: 'MAIN', floorName: 'Second Floor', roomNumber: 'E-103'},
  {roomName: 'Educ Room 104', shortName: 'Educ 104', headInstructor: null, categoryCode: 'ACADEMIC', buildingCode: 'MAIN', floorName: 'Second Floor', roomNumber: 'E-104'},
  {roomName: 'Computer Studies Room', shortName: 'Computer Room', headInstructor: null, categoryCode: 'ACADEMIC', buildingCode: 'ANNEX', floorName: 'Ground Floor', roomNumber: 'A-105'},
  {roomName: 'BPA Room', shortName: 'BPA Room', headInstructor: null, categoryCode: 'ACADEMIC', buildingCode: 'ANNEX', floorName: 'Second Floor', roomNumber: 'A-204'},
  {roomName: 'Audio Visual Room', shortName: 'AVR', headInstructor: null, categoryCode: 'FACILITY', buildingCode: 'ANNEX', floorName: 'Ground Floor', roomNumber: 'A-106'},
];


const ADMIN_SEED_USERS = [
  {username: 'pacadmin', displayName: 'PAC Admin', password: 'PacAdmin@2026'},
  {username: 'demo_admin', displayName: 'Demo Admin', password: 'DemoAdmin@2026'},
] as const;
const createRoomCode = (roomName: string) =>
  roomName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

@Injectable()
export class DevSeedService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async seed() {
    await this.db.delete(navigationDemoConfigs);
    await this.db.delete(navigationRouteSteps);
    await this.db.delete(navigationRoutes);
    await this.db.delete(roomGallery);
    await this.db.delete(roomPeople);
    await this.db.delete(qrEntries);
    await this.db.delete(rooms);
    await this.db.delete(navigationAnchors);
    await this.db.delete(floors);
    await this.db.delete(buildings);
    await this.db.delete(roomCategories);
    await this.db.delete(adminUsers);


    await this.db.insert(adminUsers).values(
      ADMIN_SEED_USERS.map(user => ({
        username: user.username,
        displayName: user.displayName,
        passwordHash: hashAdminPassword(user.password),
        role: 'admin',
      })),
    );
    await this.db.insert(roomCategories).values([
      {code: 'OFFICE', name: 'Office', description: 'Administrative and management offices', iconName: 'briefcase', colorHex: '#0EA5E9'},
      {code: 'SERVICE', name: 'Student Service', description: 'Public support and service rooms', iconName: 'heart', colorHex: '#22C55E'},
      {code: 'ACADEMIC', name: 'Academic', description: 'Academic departments, rooms, and laboratories', iconName: 'book-open', colorHex: '#F59E0B'},
      {code: 'FACILITY', name: 'Facility', description: 'School support facility', iconName: 'map-pin', colorHex: '#A855F7'},
    ]);

    const insertedBuildings = (await this.db.insert(buildings).values([
      {
        code: 'MAIN',
        name: 'Main Academic Building',
        description: `${SCHOOL_PROFILE.name} main building for public offices, registrar, finance, and education rooms.`,
        imageUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a',
        campusName: SCHOOL_PROFILE.campusName,
        address: SCHOOL_PROFILE.address,
        mapNote: 'Nearest to the front entrance and welcome area.',
      },
      {
        code: 'ANNEX',
        name: 'Annex Building',
        description: `${SCHOOL_PROFILE.name} annex building for computer studies, laboratories, and faculty work areas.`,
        imageUrl: 'https://images.unsplash.com/photo-1460317442991-0ec209397118',
        campusName: SCHOOL_PROFILE.campusName,
        address: SCHOOL_PROFILE.address,
        mapNote: 'Connected by the main hallway and courtyard walkway.',
      },
    ]).returning()) as Building[];

    const [mainBuilding, annexBuilding] = insertedBuildings;

    const insertedFloors = (await this.db.insert(floors).values([
      {buildingId: mainBuilding.id, floorNumber: 1, floorName: 'Ground Floor', description: 'Public offices and service rooms.'},
      {buildingId: mainBuilding.id, floorNumber: 2, floorName: 'Second Floor', description: 'Education offices and classrooms.'},
      {buildingId: annexBuilding.id, floorNumber: 1, floorName: 'Ground Floor', description: 'Laboratories and shared facilities.'},
      {buildingId: annexBuilding.id, floorNumber: 2, floorName: 'Second Floor', description: 'Faculty and academic department rooms.'},
    ]).returning()) as Floor[];

    const floorMap = new Map<string, Floor>(insertedFloors.map((floor: Floor) => [`${floor.buildingId}-${floor.floorName}`, floor]));
    const mainGroundFloor = floorMap.get(`${mainBuilding.id}-Ground Floor`);
    if (!mainGroundFloor) {
      throw new Error('Main building ground floor was not seeded');
    }

    const insertedAnchors = await this.db.insert(navigationAnchors).values([
      {
        code: 'MAIN_ENTRANCE',
        name: 'Main Entrance',
        qrCodeValue: 'PAC-NAV-START-MAIN-ENTRANCE',
        description: 'Verified QR anchor at the school main entrance. Start navigation here.',
        buildingId: mainBuilding.id,
        floorId: mainGroundFloor.id,
        sortOrder: 1,
      },
      {
        code: 'MAIN_HALLWAY',
        name: 'Main Hallway',
        qrCodeValue: 'PAC-NAV-ANCHOR-MAIN-HALLWAY',
        description: 'Checkpoint QR along the main hallway after entering the building.',
        buildingId: mainBuilding.id,
        floorId: mainGroundFloor.id,
        sortOrder: 2,
      },
      {
        code: 'STAIRS_GROUND_FLOOR',
        name: 'Stairs Ground Floor',
        qrCodeValue: 'PAC-NAV-ANCHOR-STAIRS-GROUND',
        description: 'Checkpoint QR at the ground-floor stairs for future upper-floor routes.',
        buildingId: mainBuilding.id,
        floorId: mainGroundFloor.id,
        sortOrder: 3,
      },
    ]).returning();
    const anchorMap = new Map<string, any>(insertedAnchors.map((anchor: any) => [anchor.code, anchor]));

    const insertedCategories = await this.db.select().from(roomCategories) as RoomCategory[];
    const categoryMap = new Map<string, RoomCategory>(insertedCategories.map((item: RoomCategory) => [item.code, item]));
    const buildingMap = new Map<'MAIN' | 'ANNEX', Building>([
      ['MAIN', mainBuilding],
      ['ANNEX', annexBuilding],
    ]);

    const insertedRooms = [] as Array<{headInstructor: string | null} & Record<string, any>>;
    for (const item of roomSeed) {
      const building = buildingMap.get(item.buildingCode);
      const floor = floorMap.get(`${building?.id}-${item.floorName}`);
      const category = categoryMap.get(item.categoryCode);

      if (!building || !floor || !category) {
        throw new Error(`Seed mapping failed for ${item.roomName}`);
      }

      const [room] = await this.db.insert(rooms).values({
        roomCode: createRoomCode(item.roomName),
        roomName: item.roomName,
        shortName: item.shortName,
        categoryId: category.id,
        buildingId: building.id,
        floorId: floor.id,
        description: `${item.roomName} is part of the seeded school directory for thesis demo use.`,
        roomNumber: item.roomNumber,
        imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
        coverImageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
        nearestLandmark: building.code === 'MAIN' ? 'Near the main hallway signage' : 'Near the annex corridor marker',
        operatingHours: 'Mon-Fri, 8:00 AM - 5:00 PM',
        contactEmail: SCHOOL_PROFILE.email,
        contactPhone: SCHOOL_PROFILE.contact,
        locationNote: `Located in the ${building.name}, ${item.floorName}.`,
        qrCodeValue: `${createRoomCode(item.roomName)}-QR`,
        isFeatured: ['REGISTRAR', 'CASHIER', 'BUSINESS-OFFICE', 'AUDIO-VISUAL-ROOM', 'COMPUTER-STUDIES-OFFICE'].includes(createRoomCode(item.roomName)),
        capacity: item.categoryCode === 'ACADEMIC' ? 35 : 10,
        tagsJson: [item.roomName, item.shortName, building.name, item.floorName],
        searchableKeywords: `${item.roomName} ${item.shortName} ${building.name} ${item.floorName}`,
        staticDistanceNote: building.code === 'MAIN' ? 'Approximately 15 to 30 meters from the main entrance.' : 'Approximately 30 to 45 meters from the main entrance.',
        demoNavigationNote: `For the thesis preview, follow hallway signs toward ${item.roomName}.`,
      }).returning();
      insertedRooms.push({...room, headInstructor: item.headInstructor});
    }

    for (const room of insertedRooms) {
      await this.db.insert(roomGallery).values([
        {
          roomId: room.id,
          imageUrl: room.coverImageUrl,
          imageType: 'cover',
          sortOrder: 1,
          caption: `${room.roomName} cover`,
        },
        {
          roomId: room.id,
          imageUrl: room.imageUrl,
          imageType: 'detail',
          sortOrder: 2,
          caption: `${room.roomName} reference image`,
        },
      ]);

      await this.db.insert(navigationDemoConfigs).values({
        roomId: room.id,
        arrowDirection: room.buildingId === mainBuilding.id ? 'forward-right' : 'forward-left',
        approximateDistanceMeters: room.buildingId === mainBuilding.id ? 22 : 38,
        overlayLabel: `${room.roomName} Ahead`,
        helperText: `Walk forward, follow the corridor markers, and look for ${room.roomName}.`,
        mockStepsJson: [
          'Start from the entrance QR point',
          'Walk straight to the main hallway',
          room.buildingId === mainBuilding.id ? 'Stay inside the main building corridor' : 'Proceed toward the annex hallway',
          `Look for the room sign for ${room.roomName}`,
        ],
      });

      if (room.headInstructor) {
        await this.db.insert(roomPeople).values({
          roomId: room.id,
          fullName: room.headInstructor,
          roleTitle: 'Head / Instructor',
          email: SCHOOL_PROFILE.email,
          phone: SCHOOL_PROFILE.contact,
          officeHours: 'Weekdays, 8:00 AM - 4:30 PM',
          notes: `Primary contact for ${room.roomName}.`,
          isPrimary: true,
        });
      }
    }

    const roomMap = new Map<string, any>(insertedRooms.map(room => [room.roomCode, room]));
    const mainEntrance = anchorMap.get('MAIN_ENTRANCE');
    const mainHallway = anchorMap.get('MAIN_HALLWAY');
    const routeSeeds = [
      {
        roomCode: 'REGISTRAR',
        title: 'Main Entrance to Registrar',
        totalDistanceMeters: 18,
        finalDistanceMeters: 6,
        finalDirection: 'left',
      },
      {
        roomCode: 'CASHIER',
        title: 'Main Entrance to Cashier',
        totalDistanceMeters: 22,
        finalDistanceMeters: 10,
        finalDirection: 'right',
      },
      {
        roomCode: 'BUSINESS-OFFICE',
        title: 'Main Entrance to Business Office',
        totalDistanceMeters: 16,
        finalDistanceMeters: 5,
        finalDirection: 'left',
      },
    ];

    for (const routeSeed of routeSeeds) {
      const room = roomMap.get(routeSeed.roomCode);
      if (!room || !mainEntrance || !mainHallway) {
        continue;
      }

      const [route] = await this.db.insert(navigationRoutes).values({
        roomId: room.id,
        startAnchorId: mainEntrance.id,
        title: routeSeed.title,
        description: 'QR-assisted AR indoor navigation using verified anchor points and predefined route steps.',
        totalDistanceMeters: routeSeed.totalDistanceMeters,
      }).returning();

      await this.db.insert(navigationRouteSteps).values([
        {
          routeId: route.id,
          stepOrder: 1,
          fromAnchorId: mainEntrance.id,
          toAnchorId: mainHallway.id,
          instruction: 'Start at the Main Entrance QR point and walk forward into the main hallway.',
          helperText: 'Keep the phone upright. The AR overlay shows the direction, while the QR confirms the starting anchor.',
          arrowDirection: 'forward',
          distanceMeters: 12,
          checkpointQrValue: mainHallway.qrCodeValue,
          isCheckpointRequired: true,
        },
        {
          routeId: route.id,
          stepOrder: 2,
          fromAnchorId: mainHallway.id,
          instruction: `At the Main Hallway checkpoint, turn ${routeSeed.finalDirection} and continue toward ${room.roomName}.`,
          helperText: `Look for room ${room.roomNumber}. Use the checkpoint scan if tracking becomes uncertain.`,
          arrowDirection: routeSeed.finalDirection,
          distanceMeters: routeSeed.finalDistanceMeters,
          isCheckpointRequired: false,
        },
        {
          routeId: route.id,
          stepOrder: 3,
          instruction: `Arrive at ${room.roomName}. Confirm the door sign before ending navigation.`,
          helperText: 'This final instruction is intentionally human-verifiable for a stable thesis demo.',
          arrowDirection: 'arrive',
          distanceMeters: 0,
          isCheckpointRequired: false,
        },
      ]);
    }

    await this.db.insert(qrEntries).values([
      {
        qrCodeValue: SCHOOL_PROFILE.schoolDirectoryQr,
        label: `${SCHOOL_PROFILE.name} Directory`,
        description: 'Opens the full public room directory.',
        scopeType: 'school_directory',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
      },
      {
        qrCodeValue: 'MAIN-BUILDING-DIRECTORY',
        label: 'Main Building Directory',
        description: 'Shows rooms in the main academic building.',
        buildingId: mainBuilding.id,
        scopeType: 'building_directory',
      },
      {
        qrCodeValue: 'ANNEX-BUILDING-DIRECTORY',
        label: 'Annex Building Directory',
        description: 'Shows rooms in the annex building.',
        buildingId: annexBuilding.id,
        scopeType: 'building_directory',
      },
      {
        qrCodeValue: 'PAC-NAV-START-MAIN-ENTRANCE',
        label: 'Navigation Start - Main Entrance',
        description: 'Starts QR-assisted AR navigation from the main entrance anchor.',
        buildingId: mainBuilding.id,
        floorId: mainGroundFloor.id,
        scopeType: 'navigation_anchor',
      },
      {
        qrCodeValue: 'PAC-NAV-ANCHOR-MAIN-HALLWAY',
        label: 'Navigation Checkpoint - Main Hallway',
        description: 'Confirms progress at the main hallway checkpoint.',
        buildingId: mainBuilding.id,
        floorId: mainGroundFloor.id,
        scopeType: 'navigation_anchor',
      },
      {
        qrCodeValue: 'PAC-NAV-ANCHOR-STAIRS-GROUND',
        label: 'Navigation Checkpoint - Stairs Ground Floor',
        description: 'Confirms progress at the ground-floor stairs checkpoint.',
        buildingId: mainBuilding.id,
        floorId: mainGroundFloor.id,
        scopeType: 'navigation_anchor',
      },
    ]);

    return {
      success: true,
      roomsSeeded: insertedRooms.length,
      peopleSeeded: insertedRooms.filter(room => room.headInstructor).length,
    };
  }
}



