import {Module} from '@nestjs/common';
import {RoomPeopleService} from './room-people.service';

@Module({providers: [RoomPeopleService], exports: [RoomPeopleService]})
export class RoomPeopleModule {}
