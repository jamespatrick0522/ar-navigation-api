import {Module} from '@nestjs/common';
import {NavigationPreviewService} from './navigation-preview.service';

@Module({providers: [NavigationPreviewService], exports: [NavigationPreviewService]})
export class NavigationPreviewModule {}
