import {BadRequestException, Inject, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {and, asc, eq} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {
  arNavigationRoutePoints,
  arNavigationRoutes,
  navigationAnchors,
  rooms,
} from 'src/db/schema';
import {SaveArNavigationRouteDto} from './dto/save-ar-navigation-route.dto';

@Injectable()
export class ArNavigationRoutesService {
  private readonly logger = new Logger(ArNavigationRoutesService.name);

  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async getRouteSummaries(startAnchorCode?: string) {
    const rows = await this.db
      .select({
        id: arNavigationRoutes.id,
        roomId: arNavigationRoutes.roomId,
        roomName: rooms.roomName,
        startAnchorCode: navigationAnchors.code,
        startAnchorName: navigationAnchors.name,
        title: arNavigationRoutes.title,
        updatedAt: arNavigationRoutes.updatedAt,
      })
      .from(arNavigationRoutes)
      .innerJoin(rooms, eq(arNavigationRoutes.roomId, rooms.id))
      .innerJoin(navigationAnchors, eq(arNavigationRoutes.startAnchorId, navigationAnchors.id))
      .where(eq(arNavigationRoutes.isActive, true))
      .orderBy(asc(rooms.roomName));

    return startAnchorCode
      ? rows.filter((row: {startAnchorCode: string}) => row.startAnchorCode === startAnchorCode)
      : rows;
  }

  async getRoomRoute(roomId: number, startAnchorCode = 'PAC-NAV-START-MAIN-ENTRANCE') {
    const [route] = await this.db
      .select({
        id: arNavigationRoutes.id,
        roomId: arNavigationRoutes.roomId,
        title: arNavigationRoutes.title,
        description: arNavigationRoutes.description,
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
      .where(
        and(
          eq(arNavigationRoutes.roomId, roomId),
          eq(navigationAnchors.code, startAnchorCode),
          eq(arNavigationRoutes.isActive, true),
        ),
      )
      .limit(1);

    if (!route) {
      throw new NotFoundException('AR navigation route not found for this room and start anchor');
    }

    const points = await this.db
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
      updatedAt: route.updatedAt,
      startAnchor: {
        id: route.startAnchorId,
        code: route.startAnchorCode,
        name: route.startAnchorName,
      },
      destinationRoom: {
        name: route.destinationRoomName,
        code: route.destinationRoomCode,
      },
      points,
    };
  }

  async saveRoomRoute(roomId: number, dto: SaveArNavigationRouteDto) {
    this.logger.log(`Saving AR route request for room ${roomId}, anchor ${dto.startAnchorCode}, points ${dto.points?.length ?? 0}`);

    if (!dto.points?.length) {
      throw new BadRequestException('At least one AR route point is required');
    }

    const [room] = await this.db
      .select({id: rooms.id, roomName: rooms.roomName})
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.isActive, true)))
      .limit(1);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const [anchor] = await this.db
      .select({id: navigationAnchors.id, code: navigationAnchors.code, name: navigationAnchors.name})
      .from(navigationAnchors)
      .where(and(eq(navigationAnchors.code, dto.startAnchorCode), eq(navigationAnchors.isActive, true)))
      .limit(1);

    if (!anchor) {
      throw new NotFoundException('Start anchor not found');
    }

    const sortedPoints = [...dto.points].sort((a, b) => a.pointOrder - b.pointOrder);
    const [existingRoute] = await this.db
      .select({id: arNavigationRoutes.id})
      .from(arNavigationRoutes)
      .where(
        and(
          eq(arNavigationRoutes.roomId, roomId),
          eq(arNavigationRoutes.startAnchorId, anchor.id),
        ),
      )
      .limit(1);

    let routeId = existingRoute?.id;
    if (routeId) {
      await this.db
        .delete(arNavigationRoutePoints)
        .where(eq(arNavigationRoutePoints.routeId, routeId));
      await this.db
        .update(arNavigationRoutes)
        .set({
          title: dto.title || `${room.roomName} AR Route`,
          description: dto.description,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(arNavigationRoutes.id, routeId));
    } else {
      const [insertedRoute] = await this.db
        .insert(arNavigationRoutes)
        .values({
          roomId,
          startAnchorId: anchor.id,
          title: dto.title || `${room.roomName} AR Route`,
          description: dto.description,
        })
        .returning({id: arNavigationRoutes.id});
      routeId = insertedRoute.id;
    }

    await this.db.insert(arNavigationRoutePoints).values(
      sortedPoints.map(point => ({
        routeId,
        pointOrder: point.pointOrder,
        pointType: point.pointType,
        label: point.label,
        direction: point.direction,
        x: point.x,
        y: point.y,
        z: point.z,
      })),
    );

    this.logger.log(`Saved AR route ${routeId} for room ${roomId}, anchor ${anchor.code}, points ${sortedPoints.length}`);

    return this.getRoomRoute(roomId, anchor.code);
  }
}
