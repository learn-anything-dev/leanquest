import type { Activity, Sex } from './types';

export const KCAL_PER_KG = 7700;

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(b: number): string {
  if (b < 18.5) return 'Underweight';
  if (b < 25) return 'Healthy range';
  if (b < 30) return 'Overweight';
  if (b < 35) return 'Obesity class 1';
  if (b < 40) return 'Obesity class 2';
  return 'Obesity class 3';
}

/** Mifflin-St Jeor resting energy estimate (kcal/day). "unspecified" uses the midpoint of the two constants. */
export function bmr(sex: Sex, age: number, weightKg: number, heightCm: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  return base - 78;
}

export function tdee(sex: Sex, age: number, weightKg: number, heightCm: number, activity: Activity): number {
  return bmr(sex, age, weightKg, heightCm) * ACTIVITY_FACTOR[activity];
}

/** Weight at BMI 25 for a given height. */
export function referenceWeight(heightCm: number): number {
  const m = heightCm / 100;
  return 25 * m * m;
}

/** Adjusted body weight used for protein targets in people with obesity. */
export function adjustedWeight(weightKg: number, heightCm: number): number {
  const ref = referenceWeight(heightCm);
  return weightKg <= ref ? weightKg : ref + 0.25 * (weightKg - ref);
}

export function round(n: number, step = 1): number {
  return Math.round(n / step) * step;
}
