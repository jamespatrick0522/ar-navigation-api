import {Body, Controller, Get, Param, ParseIntPipe, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {SaveArNavigationRouteDto} from '../ar-navigation-routes/dto/save-ar-navigation-route.dto';
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

  @Get('rooms/:id/navigation-route')
  getRoomNavigationRoute(
    @Param('id', ParseIntPipe) id: number,
    @Query('startAnchorCode') startAnchorCode?: string,
  ) {
    return this.publicService.getRoomNavigationRoute(id, startAnchorCode);
  }

  @Get('navigation/ar-routes')
  getArNavigationRoutes(@Query('startAnchorCode') startAnchorCode?: string) {
    return this.publicService.getArNavigationRouteSummaries(startAnchorCode);
  }

  @Get('rooms/:id/ar-navigation-route')
  getRoomArNavigationRoute(
    @Param('id', ParseIntPipe) id: number,
    @Query('startAnchorCode') startAnchorCode?: string,
  ) {
    return this.publicService.getRoomArNavigationRoute(id, startAnchorCode);
  }

  @Post('rooms/:id/ar-navigation-route')
  saveRoomArNavigationRoute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveArNavigationRouteDto,
  ) {
    return this.publicService.saveRoomArNavigationRoute(id, dto);
  }

  @Get('navigation/anchors')
  getNavigationAnchors() {
    return this.publicService.getNavigationAnchors();
  }

  @Get('navigation/anchors/qr/:qrCodeValue')
  getNavigationAnchorByQr(@Param('qrCodeValue') qrCodeValue: string) {
    return this.publicService.getNavigationAnchorByQr(qrCodeValue);
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
