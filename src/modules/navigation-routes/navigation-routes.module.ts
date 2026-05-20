import {Module} from '@nestjs/common';
import {NavigationRoutesService} from './navigation-routes.service';

@Module({
  providers: [NavigationRoutesService],
  exports: [NavigationRoutesService],
})
export class NavigationRoutesModule {}
