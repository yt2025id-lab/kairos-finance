import { z } from "zod";

export interface ProtocolAPYData {
  name: string;
  protocolId: number;
  apy: number;
  tvl: string;
}

export interface AIRecommendation {
  protocolId: number;
  allocationBps: number;
  expectedAPY: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

// Zod schema for runtime validation of Claude AI responses
export const AIRecommendationSchema = z.object({
  protocolId: z.number().int().min(0).max(3),
  allocationBps: z.number().int().min(1).max(10000),
  expectedAPY: z.number().int().nonnegative(),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string().min(1).max(2000),
});

export interface ProtocolScore {
  protocolId: number;
  name: string;
  apyScore: number;
  safetyScore: number;
  tvlScore: number;
  stabilityScore: number;
  weightedTotal: number;
}

export interface ProtocolAlternative {
  protocolId: number;
  name: string;
  expectedAPY: number;
  weightedScore: number;
  reason: string;
}

export interface AIAnalysis {
  protocolId: number;
  allocationBps: number;
  expectedAPY: number;
  confidence: number;
  riskScore: number;
  reasoning: string;
  scores: ProtocolScore[];
  alternatives: ProtocolAlternative[];
}

export interface StrategyRequestEvent {
  user: `0x${string}`;
  amount: bigint;
  timeHorizon: bigint;
  timestamp: bigint;
}
