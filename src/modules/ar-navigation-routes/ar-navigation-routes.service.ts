import {BadRequestException, Inject, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {and, asc, eq} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {arNavigationRoutePoints, arNavigationRoutes, navigationAnchors, rooms} from 'src/db/schema';
import {SaveArNavigationRouteDto} from './dto/save-ar-navigation-route.dto';

const MAIN_ENTRANCE = 'MAIN_ENTRANCE';
const COORDINATE_FRAME = 'marker-floor-v2';
const normalizeAnchor = (code = MAIN_ENTRANCE) =>
  code === 'PAC-NAV-START-MAIN-ENTRANCE' ? MAIN_ENTRANCE : code;

@Injectable()
export class ArNavigationRoutesService {
  private readonly logger = new Logger(ArNavigationRoutesService.name);

  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async getRouteSummaries(startAnchorCode?: string) {
    return this.db
      .select({
        id: arNavigationRoutes.id,
        roomId: arNavigationRoutes.roomId,
        roomName: rooms.roomName,
        startAnchorCode: navigationAnchors.code,
        startAnchorName: navigationAnchors.name,
        title: arNavigationRoutes.title,
        coordinateFrame: arNavigationRoutes.coordinateFrame,
        updatedAt: arNavigationRoutes.updatedAt,
      })
      .from(arNavigationRoutes)
      .innerJoin(rooms, eq(arNavigationRoutes.roomId, rooms.id))
      .innerJoin(navigationAnchors, eq(arNavigationRoutes.startAnchorId, navigationAnchors.id))
      .where(and(
        eq(arNavigationRoutes.isActive, true),
        eq(rooms.isActive, true),
        eq(navigationAnchors.isActive, true),
        eq(arNavigationRoutes.coordinateFrame, COORDINATE_FRAME),
        startAnchorCode ? eq(navigationAnchors.code, normalizeAnchor(startAnchorCode)) : undefined,
      ))
      .orderBy(asc(rooms.roomName));
  }

  async getRoomRoute(roomId: number, startAnchorCode = MAIN_ENTRANCE, db?: any) {
    if (db) return this.readRoomRoute(roomId, startAnchorCode, db);
    return this.db.transaction((tx: any) => this.readRoomRoute(roomId, startAnchorCode, tx), {
      isolationLevel: 'repeatable read',
      accessMode: 'read only',
    });
  }

  private async readRoomRoute(roomId: number, startAnchorCode: string, db: any) {
    const [route] = await db
      .select({
        id: arNavigationRoutes.id,
        roomId: arNavigationRoutes.roomId,
        title: arNavigationRoutes.title,
        description: arNavigationRoutes.description,
        coordinateFrame: arNavigationRoutes.coordinateFrame,
        markerFloorOffsetMeters: arNavigationRoutes.markerFloorOffsetMeters,
        updatedAt: arNavigationRoutes.updatedAt,
        startAnchorId: navigationAnchors.id,
        startAnchorCode: navigationAnchors.code,
        startAnchorName: navigationAnchors.name,
        destinationRoomName: rooms.roomName,
        destinationRoomCode: rooms.roomCode,
      })
      .from(arNavigationRoutes)
      .innerJoin(navigationAnchors, eq(arNavigationRoutes.startAnchorId, navigationAnchors.id))
      .innerJoin(rooms, eq(arNavigationRoutes.roomId, rooms.id))
      .where(and(
        eq(arNavigationRoutes.roomId, roomId),
        eq(navigationAnchors.code, normalizeAnchor(startAnchorCode)),
        eq(navigationAnchors.isActive, true),
        eq(rooms.isActive, true),
        eq(arNavigationRoutes.isActive, true),
      ))
      .limit(1);

    if (!route) throw new NotFoundException('AR navigation route not found for this room and start anchor');

    const points = await db
      .select({
        id: arNavigationRoutePoints.id,
        pointOrder: arNavigationRoutePoints.pointOrder,
        pointType: arNavigationRoutePoints.pointType,
        label: arNavigationRoutePoints.label,
        direction: arNavigationRoutePoints.direction,
        x: arNavigationRoutePoints.x,
        y: arNavigationRoutePoints.y,
        z: arNavigationRoutePoints.z,
      })
      .from(arNavigationRoutePoints)
      .where(eq(arNavigationRoutePoints.routeId, route.id))
      .orderBy(asc(arNavigationRoutePoints.pointOrder));

    return {
      id: route.id,
      roomId: route.roomId,
      title: route.title,
      description: route.description,
      coordinateFrame: route.coordinateFrame,
      markerFloorOffsetMeters: route.markerFloorOffsetMeters,
      updatedAt: route.updatedAt,
      startAnchor: {id: route.startAnchorId, code: route.startAnchorCode, name: route.startAnchorName},
      destinationRoom: {name: route.destinationRoomName, code: route.destinationRoomCode},
      points,
    };
  }

  async saveRoomRoute(roomId: number, dto: SaveArNavigationRouteDto) {
    this.validateRoute(dto);
    const points = [...dto.points].sort((a, b) => a.pointOrder - b.pointOrder);
    const code = normalizeAnchor(dto.startAnchorCode);

    const saved = await this.db.transaction(async (tx: any) => {
      const [room] = await tx.select({id: rooms.id, roomName: rooms.roomName})
        .from(rooms).where(and(eq(rooms.id, roomId), eq(rooms.isActive, true))).limit(1);
      if (!room) throw new NotFoundException('Room not found');

      const [anchor] = await tx.select({id: navigationAnchors.id}).from(navigationAnchors)
        .where(and(eq(navigationAnchors.code, code), eq(navigationAnchors.isActive, true))).limit(1);
      if (!anchor) throw new NotFoundException('Start anchor not found. Apply the navigation anchor migration before calibrating.');

      const values = {
        title: dto.title || `${room.roomName} AR Route`,
        description: dto.description,
        coordinateFrame: dto.coordinateFrame,
        markerFloorOffsetMeters: dto.markerFloorOffsetMeters,
        isActive: true,
        updatedAt: new Date(),
      };
      // The upsert locks this room/entrance row so concurrent saves cannot mix their points.
      const [route] = await tx.insert(arNavigationRoutes)
        .values({...values, roomId, startAnchorId: anchor.id})
        .onConflictDoUpdate({
          target: [arNavigationRoutes.roomId, arNavigationRoutes.startAnchorId],
          set: values,
        }).returning({id: arNavigationRoutes.id});

      await tx.delete(arNavigationRoutePoints).where(eq(arNavigationRoutePoints.routeId, route.id));
      await tx.insert(arNavigationRoutePoints).values(points.map(point => ({...point, routeId: route.id})));
      return this.getRoomRoute(roomId, code, tx);
    });

    this.logger.log(`Saved verified AR route ${saved.id} for room ${roomId}, anchor ${code}, points ${points.length}`);
    return saved;
  }

  private validateRoute(dto: SaveArNavigationRouteDto) {
    if (dto.coordinateFrame !== COORDINATE_FRAME) {
      throw new BadRequestException('Recalibrate using stable entrance marker alignment before publishing this route.');
    }
    if (!Number.isFinite(dto.markerFloorOffsetMeters) || dto.markerFloorOffsetMeters < 0 || dto.markerFloorOffsetMeters > 3) {
      throw new BadRequestException('A valid measured marker-to-floor offset is required.');
    }
    if (!Array.isArray(dto.points) || dto.points.length < 2 || dto.points.length > 500) {
      throw new BadRequestException('A route requires an entrance and destination, with at most 500 points.');
    }
    const points = [...dto.points].sort((a, b) => a.pointOrder - b.pointOrder);
    const types = new Set(['entrance', 'turn', 'stair-start', 'stair-end', 'destination']);
    let stairDirection: string | undefined;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.pointOrder !== i || !types.has(p.pointType) || ![p.x, p.y, p.z].every(Number.isFinite)) {
        throw new BadRequestException('Route points must be finite, valid, and ordered consecutively from zero.');
      }
      if ((p.pointType === 'entrance') !== (i === 0) || (p.pointType === 'destination') !== (i === points.length - 1)) {
        throw new BadRequestException('A route must start with one entrance and end with one destination.');
      }
      if (p.pointType === 'stair-start') {
        if (stairDirection || !['up', 'down'].includes(p.direction ?? '')) throw new BadRequestException('Invalid stair start.');
        stairDirection = p.direction;
      } else if (p.pointType === 'stair-end') {
        if (!stairDirection || p.direction !== stairDirection) throw new BadRequestException('Stair arrival must match its start.');
        stairDirection = undefined;
      } else if (stairDirection) throw new BadRequestException('Finish the stair transition before adding other points.');
    }
    if (stairDirection) throw new BadRequestException('Missing stair arrival.');
    if (Math.hypot(points[0].x, points[0].y, points[0].z) > 0.01) {
      throw new BadRequestException('Entrance must be the marker-floor origin.');
    }
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y, points[i].z - points[i - 1].z);
    }
    if (length < 0.3) throw new BadRequestException('Destination is too close to the entrance. Record the route before saving.');
  }
}
