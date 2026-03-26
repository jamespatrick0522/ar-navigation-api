import {ApiPropertyOptional} from '@nestjs/swagger';
import {Transform} from 'class-transformer';
import {IsBoolean, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';

export class ListRoomsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({value}) => Number(value))
  @IsInt()
  buildingId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({value}) => Number(value))
  @IsInt()
  floorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({value}) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({default: 1})
  @IsOptional()
  @Transform(({value}) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({default: 10})
  @IsOptional()
  @Transform(({value}) => Number(value ?? 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}
