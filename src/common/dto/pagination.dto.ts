import {Transform} from 'class-transformer';
import {IsInt, IsOptional, Max, Min} from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Transform(({value}) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({value}) => Number(value ?? 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}
