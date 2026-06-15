import { IsIn, IsInt, IsNumber, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsInt()
  @Min(1)
  age: number;

  @IsIn(['male', 'female'])
  gender: string;

  @IsNumber()
  @Min(1)
  height_cm: number;

  @IsNumber()
  @Min(1)
  weight_kg: number;

  @IsIn(['lose_slow', 'lose_aggressive', 'maintain', 'gain'])
  goal: string;

  @IsIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'])
  activity_level: string;
}
