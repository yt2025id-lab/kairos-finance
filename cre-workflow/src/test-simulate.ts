/**
 * Kairos CRE Local Simulation Test
 * 
 * Simulates the workflow locally with mock protocol data
 * demonstrating the end-to-end flow: protocols → Claude AI → recommendation
 */

import { buildYieldAnalysisPrompt } from "./ai/prompts.js";
import type { ProtocolAPYData, AIRecommendation } from "./ai/types.js";

async function runSimulation() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  Kairos CRE Workflow - Local Simulation Test          ║");
  console.log("║  (AI Yield Optimization Orchestration)                ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Mock protocol data (simulates reading from Base blockchain)
  console.log("📊 Simulated Protocol APY Data from Base:\n");

  const mockProtocols: ProtocolAPYData[] = [
    {
      name: "Aave V3",
      protocolId: 0,
      apy: 2.45,
      tvl: "$1.2B"
    },
    {
      name: "Compound V3",
      protocolId: 2,
      apy: 3.12,
      tvl: "$856M"
    },
    {
      name: "Moonwell",
      protocolId: 3,
      apy: 2.88,
      tvl: "$234M"
    }
  ];

  // Display protocol data
  mockProtocols.forEach((p) => {
    console.log(`  • ${p.name}: ${p.apy.toFixed(2)}% APY (TVL: ${p.tvl})`);
  });

  console.log("\n🤖 Building yield analysis prompt...\n");

  // Build prompt with realistic parameters
  const timeHorizonSeconds = 86400 * 30; // 30 days
  const amountUSDC = "10000.00";
  const prompt = buildYieldAnalysisPrompt(mockProtocols, timeHorizonSeconds, amountUSDC);
  
  console.log("📝 Sending to Claude API for analysis...\n");
  console.log(`   Time Horizon: 30 days`);
  console.log(`   Deposit Amount: ${amountUSDC} USDC\n`);

  // Mock Claude AI recommendation (what would be returned from real API)
  const mockRecommendation: AIRecommendation = {
    protocolId: 2,           // Compound V3
    allocationBps: 10000,    // 100% allocation
    expectedAPY: 3.12,
    confidence: "high",
    reasoning: "Compound V3 offers the highest APY (3.12%) with mature smart contracts and strong TVL. Optimal risk-adjusted returns for 30-day horizon."
  };

  console.log("✨ Claude AI Recommendation:\n");
  console.log("┌──────────────────────────────────────────────┐");
  console.log(`│ Recommended: ${mockProtocols[mockRecommendation.protocolId].name.padEnd(28)}│`);
  console.log(`│ Confidence: ${mockRecommendation.confidence.padEnd(32)}│`);
  console.log(`│ Expected APY: ${mockRecommendation.expectedAPY.toFixed(2)}%${" ".repeat(27)}│`);
  console.log("├──────────────────────────────────────────────┤");
  console.log(`│ Reasoning:                                   │`);
  const line1 = mockRecommendation.reasoning.substring(0, 40);
  const line2 = mockRecommendation.reasoning.substring(40, 80);
  console.log(`│ ${line1.padEnd(40)}│`);
  if (line2) {
    console.log(`│ ${line2.padEnd(40)}│`);
  }
  console.log("└──────────────────────────────────────────────┘\n");

  console.log("✅ Local Simulation Complete!");
  console.log("   What happens in production:");
  console.log("   ┌────────────────────────────────────────────────┐");
  console.log("   │ 1. User requests strategy (frontend)           │");
  console.log("   │ 2. StrategyRequested event emitted (contract)  │");
  console.log("   │ 3. Chainlink DON detects event (EVM Trigger)  │");
  console.log("   │ 4. Handler reads 4 protocol APYs (EVMClient)  │");
  console.log("   │ 5. Claude AI analyzes yield (HTTPClient)      │");
  console.log("   │ 6. Recommendation encoded on-chain            │");
  console.log("   │ 7. User sees result (frontend)                │");
  console.log("   └────────────────────────────────────────────────┘\n");

  console.log("🚀 Next Steps:");
  console.log("   → Test on frontend: http://localhost:3000");
  console.log("   → Deploy to Chainlink DON: npm run deploy:staging\n");
}

runSimulation().catch(console.error);
