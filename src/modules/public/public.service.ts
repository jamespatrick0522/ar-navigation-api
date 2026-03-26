import {Injectable} from '@nestjs/common';
import {BuildingsService} from '../buildings/buildings.service';
import {CategoriesService} from '../categories/categories.service';
import {FloorsService} from '../floors/floors.service';
import {NavigationPreviewService} from '../navigation-preview/navigation-preview.service';
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
    private readonly navigationPreviewService: NavigationPreviewService,
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
