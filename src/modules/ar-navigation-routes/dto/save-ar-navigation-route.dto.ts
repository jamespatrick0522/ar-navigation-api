import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsArray, IsIn, IsNumber, IsOptional, IsString, MaxLength, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';

export class SaveArNavigationRoutePointDto {
  @ApiProperty()
  @IsNumber()
  pointOrder!: number;

  @ApiProperty({enum: ['entrance', 'turn', 'stair-start', 'stair-end', 'destination']})
  @IsString()
  @IsIn(['entrance', 'turn', 'stair-start', 'stair-end', 'destination'])
  pointType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  direction?: string;

  @ApiProperty()
  @IsNumber()
  x!: number;

  @ApiProperty()
  @IsNumber()
  y!: number;

  @ApiProperty()
  @IsNumber()
  z!: number;
}

export class SaveArNavigationRouteDto {
  @ApiProperty({default: 'PAC-NAV-START-MAIN-ENTRANCE'})
  @IsString()
  @MaxLength(80)
  startAnchorCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({type: [SaveArNavigationRoutePointDto]})
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => SaveArNavigationRoutePointDto)
  points!: SaveArNavigationRoutePointDto[];
}
