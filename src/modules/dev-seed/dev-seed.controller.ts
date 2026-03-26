import {Controller, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {DevSeedService} from './dev-seed.service';

@ApiTags('Dev Seed')
@Controller('dev')
export class DevSeedController {
  constructor(private readonly devSeedService: DevSeedService) {}

  @Post('seed')
  seed() {
    return this.devSeedService.seed();
  }
}
