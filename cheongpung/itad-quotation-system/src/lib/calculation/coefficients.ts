import type { Grade, Region, DataErasure } from "@/generated/prisma";

export const GRADE_COEFFICIENTS: Record<Grade, number> = {
  A: 1.00,
  B: 0.75,
  C: 0.45,
  DEFECTIVE: 0.15,
  UNKNOWN: 0.50,
};

export function getGradeCoefficient(grade: Grade): number {
  return GRADE_COEFFICIENTS[grade];
}

export function getAgeCoefficient(manufactureYear: number | null): number {
  if (manufactureYear === null) return 0.40;
  const ageYears = new Date().getFullYear() - manufactureYear;
  const table = [1.00, 0.85, 0.70, 0.55, 0.45, 0.35, 0.25];
  return table[Math.min(ageYears, 6)];
}

export const REGION_COEFFICIENTS: Record<Region, number> = {
  SEOUL: 1.00,
  CHUNGCHEONG: 0.97,
  YEONGNAM: 0.95,
  HONAM: 0.93,
  GANGWON_JEJU: 0.88,
};

export function getRegionCoefficient(region: Region): number {
  return REGION_COEFFICIENTS[region];
}

export const LOGISTICS_COST_PER_UNIT: Record<Region, number> = {
  SEOUL: 5_000,
  CHUNGCHEONG: 7_000,
  YEONGNAM: 9_000,
  HONAM: 11_000,
  GANGWON_JEJU: 15_000,
};

export const ERASURE_COST_PER_UNIT: Record<DataErasure, number> = {
  PHYSICAL: 6_000,
  SOFTWARE: 3_000,
  NONE: 0,
};

export const INSPECTION_COST_PER_UNIT = 3_500;
