import {Controller, Get, Param, ParseIntPipe, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {ListRoomsQueryDto} from '../rooms/dto/list-rooms-query.dto';
import {PublicService} from './public.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('qr/:qrCodeValue')
  getQrEntry(@Param('qrCodeValue') qrCodeValue: string) {
    return this.publicService.getQrEntry(qrCodeValue);
  }

  @Get('rooms')
  getRooms(@Query() query: ListRoomsQueryDto) {
    return this.publicService.getRooms(query);
  }

  @Get('rooms/:id')
  getRoom(@Param('id', ParseIntPipe) id: number) {
    return this.publicService.getRoomById(id);
  }

  @Get('rooms/:id/navigation-preview')
  getNavigationPreview(@Param('id', ParseIntPipe) id: number) {
    return this.publicService.getNavigationPreview(id);
  }

  @Get('categories')
  getCategories() {
    return this.publicService.getCategories();
  }

  @Get('buildings')
  getBuildings() {
    return this.publicService.getBuildings();
  }

  @Get('buildings/:id')
  getBuilding(@Param('id', ParseIntPipe) id: number) {
    return this.publicService.getBuilding(id);
  }

  @Get('floors')
  getFloors() {
    return this.publicService.getFloors();
  }

  @Get('floors/:id')
  getFloor(@Param('id', ParseIntPipe) id: number) {
    return this.publicService.getFloor(id);
  }
}
