import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {asc, and, eq} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {
  buildings,
  floors,
  navigationAnchors,
  navigationRoutes,
  navigationRouteSteps,
  rooms,
} from 'src/db/schema';

@Injectable()
export class NavigationRoutesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async getAnchors() {
    return this.db
      .select({
        id: navigationAnchors.id,
        code: navigationAnchors.code,
        name: navigationAnchors.name,
        qrCodeValue: navigationAnchors.qrCodeValue,
        description: navigationAnchors.description,
        buildingName: buildings.name,
        floorName: floors.floorName,
      })
      .from(navigationAnchors)
      .leftJoin(buildings, eq(navigationAnchors.buildingId, buildings.id))
      .leftJoin(floors, eq(navigationAnchors.floorId, floors.id))
      .where(eq(navigationAnchors.isActive, true))
      .orderBy(asc(navigationAnchors.sortOrder), asc(navigationAnchors.name));
  }

  async getAnchorByQr(qrCodeValue: string) {
    const [anchor] = await this.db
      .select({
        id: navigationAnchors.id,
        code: navigationAnchors.code,
        name: navigationAnchors.name,
        qrCodeValue: navigationAnchors.qrCodeValue,
        description: navigationAnchors.description,
        buildingName: buildings.name,
        floorName: floors.floorName,
      })
      .from(navigationAnchors)
      .leftJoin(buildings, eq(navigationAnchors.buildingId, buildings.id))
      .leftJoin(floors, eq(navigationAnchors.floorId, floors.id))
      .where(
        and(
          eq(navigationAnchors.qrCodeValue, qrCodeValue),
          eq(navigationAnchors.isActive, true),
        ),
      )
      .limit(1);

    if (!anchor) {
      throw new NotFoundException('Navigation anchor QR not found');
    }

    return anchor;
  }

  async getRoomRoute(roomId: number, startAnchorCode?: string) {
    const [route] = await this.db
      .select({
        id: navigationRoutes.id,
        roomId: navigationRoutes.roomId,
        title: navigationRoutes.title,
        description: navigationRoutes.description,
        totalDistanceMeters: navigationRoutes.totalDistanceMeters,
        startAnchorId: navigationRoutes.startAnchorId,
        startAnchorCode: navigationAnchors.code,
        startAnchorName: navigationAnchors.name,
        destinationRoomName: rooms.roomName,
        destinationRoomCode: rooms.roomCode,
      })
      .from(navigationRoutes)
      .innerJoin(navigationAnchors, eq(navigationRoutes.startAnchorId, navigationAnchors.id))
      .innerJoin(rooms, eq(navigationRoutes.roomId, rooms.id))
      .where(and(eq(navigationRoutes.roomId, roomId), eq(navigationRoutes.isActive, true)))
      .limit(1);

    if (!route) {
      throw new NotFoundException('Navigation route not found');
    }

    if (startAnchorCode && route.startAnchorCode !== startAnchorCode) {
      throw new NotFoundException('Route is not available from this start anchor yet');
    }

    const steps = await this.db
      .select({
        id: navigationRouteSteps.id,
        stepOrder: navigationRouteSteps.stepOrder,
        instruction: navigationRouteSteps.instruction,
        helperText: navigationRouteSteps.helperText,
        arrowDirection: navigationRouteSteps.arrowDirection,
        distanceMeters: navigationRouteSteps.distanceMeters,
        checkpointQrValue: navigationRouteSteps.checkpointQrValue,
        isCheckpointRequired: navigationRouteSteps.isCheckpointRequired,
        fromAnchorCode: navigationAnchors.code,
        fromAnchorName: navigationAnchors.name,
      })
      .from(navigationRouteSteps)
      .leftJoin(navigationAnchors, eq(navigationRouteSteps.fromAnchorId, navigationAnchors.id))
      .where(eq(navigationRouteSteps.routeId, route.id))
      .orderBy(asc(navigationRouteSteps.stepOrder));

    return {
      id: route.id,
      roomId: route.roomId,
      title: route.title,
      description: route.description,
      totalDistanceMeters: route.totalDistanceMeters,
      startAnchor: {
        id: route.startAnchorId,
        code: route.startAnchorCode,
        name: route.startAnchorName,
      },
      destinationRoom: {
        name: route.destinationRoomName,
        code: route.destinationRoomCode,
      },
      steps,
    };
  }
}
