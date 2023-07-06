import { IsString } from 'class-validator';

export class SearchBusStationDto {
  @IsString({ message: 'X좌표' })
  public long: string;
  @IsString({ message: 'Y좌표' })
  public lati: string;
}
