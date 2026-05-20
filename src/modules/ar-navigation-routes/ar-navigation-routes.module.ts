import {Module} from '@nestjs/common';
import {ArNavigationRoutesService} from './ar-navigation-routes.service';

@Module({
  providers: [ArNavigationRoutesService],
  exports: [ArNavigationRoutesService],
})
export class ArNavigationRoutesModule {}
