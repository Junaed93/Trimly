import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LogWeightDto {
  @IsNotEmpty()
  @IsNumber()
  weight_kg: number;

  @IsNotEmpty()
  @IsString()
  date: string; // YYYY-MM-DD
}
