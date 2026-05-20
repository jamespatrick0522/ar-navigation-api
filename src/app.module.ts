import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import configuration from './config/configuration';
import {DatabaseModule} from './db/db.module';
import {PublicModule} from './modules/public/public.module';
import {RoomsModule} from './modules/rooms/rooms.module';
import {BuildingsModule} from './modules/buildings/buildings.module';
import {FloorsModule} from './modules/floors/floors.module';
import {CategoriesModule} from './modules/categories/categories.module';
import {QrModule} from './modules/qr/qr.module';
import {RoomPeopleModule} from './modules/room-people/room-people.module';
import {NavigationPreviewModule} from './modules/navigation-preview/navigation-preview.module';
import {NavigationRoutesModule} from './modules/navigation-routes/navigation-routes.module';
import {DevSeedModule} from './modules/dev-seed/dev-seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    PublicModule,
    RoomsModule,
    BuildingsModule,
    FloorsModule,
    CategoriesModule,
    QrModule,
    RoomPeopleModule,
    NavigationPreviewModule,
    NavigationRoutesModule,
    DevSeedModule,
  ],
})
export class AppModule {}
