import {Injectable} from '@nestjs/common';
import {ArNavigationRoutesService} from '../ar-navigation-routes/ar-navigation-routes.service';
import {SaveArNavigationRouteDto} from '../ar-navigation-routes/dto/save-ar-navigation-route.dto';
import {BuildingsService} from '../buildings/buildings.service';
import {CategoriesService} from '../categories/categories.service';
import {FloorsService} from '../floors/floors.service';
import {NavigationPreviewService} from '../navigation-preview/navigation-preview.service';
import {NavigationRoutesService} from '../navigation-routes/navigation-routes.service';
import {QrService} from '../qr/qr.service';
import {ListRoomsQueryDto} from '../rooms/dto/list-rooms-query.dto';
import {RoomsService} from '../rooms/rooms.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly qrService: QrService,
    private readonly roomsService: RoomsService,
    private readonly categoriesService: CategoriesService,
    private readonly buildingsService: BuildingsService,
    private readonly floorsService: FloorsService,
    private readonly arNavigationRoutesService: ArNavigationRoutesService,
    private readonly navigationPreviewService: NavigationPreviewService,
    private readonly navigationRoutesService: NavigationRoutesService,
  ) {}

  getQrEntry(qrCodeValue: string) {
    return this.qrService.getByCode(qrCodeValue);
  }

  getRooms(query: ListRoomsQueryDto) {
    return this.roomsService.listRooms(query);
  }

  getRoomById(id: number) {
    return this.roomsService.getRoomById(id);
  }

  getNavigationPreview(roomId: number) {
    return this.navigationPreviewService.getByRoomId(roomId);
  }

  getNavigationAnchors() {
    return this.navigationRoutesService.getAnchors();
  }

  getNavigationAnchorByQr(qrCodeValue: string) {
    return this.navigationRoutesService.getAnchorByQr(qrCodeValue);
  }

  getRoomNavigationRoute(roomId: number, startAnchorCode?: string) {
    return this.navigationRoutesService.getRoomRoute(roomId, startAnchorCode);
  }

  getArNavigationRouteSummaries(startAnchorCode?: string) {
    return this.arNavigationRoutesService.getRouteSummaries(startAnchorCode);
  }

  getRoomArNavigationRoute(roomId: number, startAnchorCode?: string) {
    return this.arNavigationRoutesService.getRoomRoute(roomId, startAnchorCode);
  }

  saveRoomArNavigationRoute(roomId: number, dto: SaveArNavigationRouteDto) {
    return this.arNavigationRoutesService.saveRoomRoute(roomId, dto);
  }

  getCategories() {
    return this.categoriesService.getAll();
  }

  getBuildings() {
    return this.buildingsService.getAll();
  }

  getBuilding(id: number) {
    return this.buildingsService.getOne(id);
  }

  getFloors() {
    return this.floorsService.getAll();
  }

  getFloor(id: number) {
    return this.floorsService.getOne(id);
  }
}
