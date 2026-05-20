import type { Region, DataErasure } from "@/generated/prisma";
import {
  LOGISTICS_COST_PER_UNIT,
  ERASURE_COST_PER_UNIT,
  INSPECTION_COST_PER_UNIT,
} from "./coefficients";

export interface ProcessingCostInput {
  totalUnits: number;
  region: Region;
  dataErasure: DataErasure;
  hasServers: boolean;
}

export interface ProcessingCostResult {
  logistics: number;
  erasure: number;
  inspection: number;
  total: number;
}

export function calculateProcessingCost(
  input: ProcessingCostInput
): ProcessingCostResult {
  let logistics = LOGISTICS_COST_PER_UNIT[input.region] * input.totalUnits;
  if (input.hasServers) logistics = Math.round(logistics * 1.5);

  const erasure = ERASURE_COST_PER_UNIT[input.dataErasure] * input.totalUnits;
  const inspection = INSPECTION_COST_PER_UNIT * input.totalUnits;

  return { logistics, erasure, inspection, total: logistics + erasure + inspection };
}
