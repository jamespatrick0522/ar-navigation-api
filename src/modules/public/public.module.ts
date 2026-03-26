import {Module} from '@nestjs/common';
import {BuildingsModule} from '../buildings/buildings.module';
import {CategoriesModule} from '../categories/categories.module';
import {FloorsModule} from '../floors/floors.module';
import {NavigationPreviewModule} from '../navigation-preview/navigation-preview.module';
import {QrModule} from '../qr/qr.module';
import {RoomsModule} from '../rooms/rooms.module';
import {PublicController} from './public.controller';
import {PublicService} from './public.service';

@Module({
  imports: [
    QrModule,
    RoomsModule,
    CategoriesModule,
    BuildingsModule,
    FloorsModule,
    NavigationPreviewModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
