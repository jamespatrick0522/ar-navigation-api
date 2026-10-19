import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';

export class SaveArNavigationRoutePointDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
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
  @ApiProperty({default: 'MAIN_ENTRANCE'})
  @IsString()
  @MaxLength(80)
  startAnchorCode!: string;

  @ApiProperty({enum: ['marker-floor-v2']})
  @IsIn(['marker-floor-v2'])
  coordinateFrame!: string;

  @ApiProperty({description: 'Vertical distance from the printed marker center to the entrance floor, in meters.'})
  @IsNumber()
  @Min(0)
  @Max(3)
  markerFloorOffsetMeters!: number;

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
  @ArrayMinSize(2)
  @ArrayMaxSize(500)
  @ValidateNested({each: true})
  @Type(() => SaveArNavigationRoutePointDto)
  points!: SaveArNavigationRoutePointDto[];
}
