"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import Link from "next/link";
import { LoginButton, LoginCard } from "../../components/LoginButton";
import { useActiveWallet } from "../../hooks/useActiveWallet";
import {
  VAULT_ADDRESS,
  VAULT_ABI,
  CONTROLLER_ADDRESS,
  CONTROLLER_ABI,
  USDC_ADDRESS,
  FAUCET_ADDRESS,
  ERC20_ABI,
  FAUCET_ABI,
} from "../../lib/contracts";

const TIME_OPTIONS = [
  { label: "1 Month", value: 30 * 86400 },
  { label: "3 Months", value: 90 * 86400 },
  { label: "6 Months", value: 180 * 86400 },
  { label: "12 Months", value: 365 * 86400 },
];

// Strategy address → protocol name mapping (Base Sepolia deployment)
const PROTOCOL_NAMES: Record<string, string> = {
  "0xeC6e6ABe3DF9B3bD471d66Bd759c63a5f8e58dEF": "Aave V3",
  "0xec6e6abe3df9b3bd471d66bd759c63a5f8e58def": "Aave V3",
  "0xB94980938429bc6eE6b6E0fD4AB836652119B981": "Compound V3",
  "0xb94980938429bc6ee6b6e0fd4ab836652119b981": "Compound V3",
  "0x76bF3c419BDAf509bD6c15d8Fbf26EDA96b676ce": "Moonwell",
  "0x76bf3c419bdaf509bd6c15d8fbf26eda96b676ce": "Moonwell",
  "0x045Ef6487EAf645B80781ac8c1504566FF419Cf0": "Morpho",
  "0x045ef6487eaf645b80781ac8c1504566ff419cf0": "Morpho",
};

function getProtocolName(address: string): string {
  return PROTOCOL_NAMES[address] || PROTOCOL_NAMES[address.toLowerCase()] || address.slice(0, 6) + "..." + address.slice(-4);
}

export default function AppPage() {
  const { address, isConnected } = useActiveWallet();
  const [amount, setAmount] = useState("");
  const [timeHorizon, setTimeHorizon] = useState(TIME_OPTIONS[2].value);

  // --- Read contracts ---

  const { data: usdcBalance, refetch: refetchUsdc } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { data: vaultBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { data: assetsFromShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "convertToAssets",
    args: vaultBalance ? [vaultBalance as bigint] : undefined,
    query: { enabled: vaultBalance !== undefined && (vaultBalance as bigint) > 0n },
  });

  const { data: hasActiveRequest } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "hasActiveRequest",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5_000 },
  });

  const { data: position } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getUserPosition",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { data: cooldownRemaining, refetch: refetchCooldown } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "cooldownRemaining",
    args: address ? [address] : undefined,
    query: { enabled: !!address && FAUCET_ADDRESS !== "0x0000000000000000000000000000000000000000" },
  });

  // --- Live APY Reads (Base mainnet protocol addresses) ---

  // Aave V3: PoolDataProvider.getReserveData(USDC) → liquidityRate (ray)
  const AAVE_POOL_DATA_PROVIDER = "0xd82a47fdebB5bf5329b09441C3DaB4b5df2153Ad" as `0x${string}`;
  const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;

  const { data: aaveReserveData } = useReadContract({
    address: AAVE_POOL_DATA_PROVIDER,
    abi: [{
      name: "getReserveData",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "asset", type: "address" }],
      outputs: [
        { name: "unbacked", type: "uint256" },
        { name: "accruedToTreasuryScaled", type: "uint256" },
        { name: "totalAToken", type: "uint256" },
        { name: "totalStableDebt", type: "uint256" },
        { name: "totalVariableDebt", type: "uint256" },
        { name: "liquidityRate", type: "uint256" },
        { name: "variableBorrowRate", type: "uint256" },
        { name: "stableBorrowRate", type: "uint256" },
        { name: "averageStableBorrowRate", type: "uint256" },
        { name: "liquidityIndex", type: "uint256" },
        { name: "variableBorrowIndex", type: "uint256" },
        { name: "lastUpdateTimestamp", type: "uint40" },
      ],
    }] as const,
    functionName: "getReserveData",
    args: [BASE_USDC],
    chainId: 8453, // Base mainnet
    query: { refetchInterval: 60_000 },
  });

  // Compound V3: Comet.getSupplyRate(getUtilization())
  const COMPOUND_COMET = "0xb125E6687d4313864e53df431d5425969c15Eb2F" as `0x${string}`;

  const { data: compoundUtilization } = useReadContract({
    address: COMPOUND_COMET,
    abi: [{
      name: "getUtilization",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
    }] as const,
    functionName: "getUtilization",
    chainId: 8453,
    query: { refetchInterval: 60_000 },
  });

  const { data: compoundSupplyRate } = useReadContract({
    address: COMPOUND_COMET,
    abi: [{
      name: "getSupplyRate",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "utilization", type: "uint256" }],
      outputs: [{ name: "", type: "uint64" }],
    }] as const,
    functionName: "getSupplyRate",
    args: compoundUtilization !== undefined ? [compoundUtilization as bigint] : undefined,
    chainId: 8453,
    query: { enabled: compoundUtilization !== undefined, refetchInterval: 60_000 },
  });

  // Moonwell: mToken.supplyRatePerTimestamp()
  const MOONWELL_MUSDC = "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22" as `0x${string}`;

  const { data: moonwellSupplyRate } = useReadContract({
    address: MOONWELL_MUSDC,
    abi: [{
      name: "supplyRatePerTimestamp",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
    }] as const,
    functionName: "supplyRatePerTimestamp",
    chainId: 8453,
    query: { refetchInterval: 60_000 },
  });

  // Morpho: fetch from GraphQL API
  const [morphoApy, setMorphoApy] = useState<number | null>(null);

  useEffect(() => {
    async function fetchMorphoAPY() {
      try {
        const res = await fetch("https://blue-api.morpho.org/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `{
              markets(
                where: { chainId_in: [8453], loanAssetAddress_in: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"] }
                orderBy: TotalSupplyAssetsUsd
                first: 5
              ) { items { state { supplyApy } } }
            }`,
          }),
        });
        const data = await res.json();
        const items = data?.data?.markets?.items || [];
        let best = 0;
        for (const m of items) {
          const apy = (m.state?.supplyApy || 0) * 100;
          if (apy > best) best = apy;
        }
        setMorphoApy(best);
      } catch {
        setMorphoApy(null);
      }
    }
    fetchMorphoAPY();
    const interval = setInterval(fetchMorphoAPY, 60_000);
    return () => clearInterval(interval);
  }, []);

  // --- Compute APY percentages ---

  // Aave: liquidityRate is in ray (1e27), APY = rate / 1e25
  const aaveApy = aaveReserveData
    ? Number((aaveReserveData as readonly unknown[])[5] as bigint) / 1e25
    : null;

  // Compound: supplyRate is per-second scaled by 1e18, APY = rate * seconds_per_year / 1e16
  const compoundApy = compoundSupplyRate !== undefined
    ? Number(compoundSupplyRate as bigint) * 31536000 / 1e16
    : null;

  // Moonwell: supplyRatePerTimestamp is per-second scaled by 1e18
  const moonwellApy = moonwellSupplyRate !== undefined
    ? Number(moonwellSupplyRate as bigint) * 31536000 / 1e16
    : null;

  // --- Write contracts ---

  const { writeContract: claimFaucet, data: faucetTxHash } = useWriteContract();
  const { writeContract: approve, data: approveTxHash } = useWriteContract();
  const { writeContract: depositToVault, data: depositTxHash } = useWriteContract();
  const { writeContract: requestStrategy, data: requestTxHash } = useWriteContract();
  const { writeContract: withdrawFromStrategy, data: withdrawTxHash } = useWriteContract();
  const { writeContract: redeemFromVault, data: redeemTxHash } = useWriteContract();

  const { isLoading: isClaiming, isSuccess: faucetSuccess } = useWaitForTransactionReceipt({ hash: faucetTxHash });
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveTxHash });
  const { isLoading: isDepositing } = useWaitForTransactionReceipt({ hash: depositTxHash });
  const { isLoading: isRequesting } = useWaitForTransactionReceipt({ hash: requestTxHash });
  const { isLoading: isWithdrawing } = useWaitForTransactionReceipt({ hash: withdrawTxHash });
  const { isLoading: isRedeeming } = useWaitForTransactionReceipt({ hash: redeemTxHash });

  // Refetch balance + cooldown after faucet claim lands on-chain
  useEffect(() => {
    if (faucetSuccess) {
      refetchUsdc();
      refetchCooldown();
    }
  }, [faucetSuccess, refetchUsdc, refetchCooldown]);

  // --- Derived values ---

  const parsedAmount = amount ? parseUnits(amount, 6) : 0n;
  const needsApproval = allowance !== undefined && parsedAmount > (allowance as bigint);
  const canClaim = cooldownRemaining !== undefined && (cooldownRemaining as bigint) === 0n;

  const pos = position as
    | {
        depositAmount: bigint;
        timeHorizon: bigint;
        depositTimestamp: bigint;
        activeStrategy: string;
        allocatedAmount: bigint;
        isActive: boolean;
      }
    | undefined;

  const timeHorizonDays = pos ? Number(pos.timeHorizon) / 86400 : 0;
  const depositTimestamp = pos ? Number(pos.depositTimestamp) : 0;
  const endTimestamp = depositTimestamp + (pos ? Number(pos.timeHorizon) : 0);
  const now = Math.floor(Date.now() / 1000);
  const daysRemaining = Math.max(0, Math.ceil((endTimestamp - now) / 86400));

  // --- Handlers ---

  function handleClaimFaucet() {
    claimFaucet({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "faucet",
    });
  }

  function handleApprove() {
    approve({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [VAULT_ADDRESS, parsedAmount],
    });
  }

  function handleDeposit() {
    if (!address) return;
    depositToVault({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [parsedAmount, address],
    });
  }

  function handleRequestStrategy() {
    requestStrategy({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "requestStrategy",
      args: [BigInt(timeHorizon)],
    });
  }

  function handleWithdrawFromStrategy() {
    if (!address) return;
    withdrawFromStrategy({
      address: CONTROLLER_ADDRESS,
      abi: CONTROLLER_ABI,
      functionName: "withdrawFromStrategy",
      args: [address],
    });
  }

  function handleRedeemAll() {
    if (!address || !vaultBalance) return;
    redeemFromVault({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "redeem",
      args: [vaultBalance as bigint, address, address],
    });
  }

  // --- Not connected ---

  if (!isConnected) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <nav className="flex items-center justify-between mb-12">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Kairos Finance
          </Link>
          <LoginButton />
        </nav>
        <LoginCard />
      </main>
    );
  }

  // --- Connected ---

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      {/* Header */}
      <nav className="flex items-center justify-between mb-12">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Kairos Finance
        </Link>
        <LoginButton />
      </nav>

      {/* Testnet Faucet */}
      {FAUCET_ADDRESS !== "0x0000000000000000000000000000000000000000" ? (
        <div className="bg-gray-900 border border-yellow-900/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-500 mb-1">Testnet Faucet</div>
              <p className="text-xs text-gray-400">
                Claim 100 test USDC to try Kairos Finance. One claim per hour.
              </p>
            </div>
            <button
              onClick={handleClaimFaucet}
              disabled={isClaiming || !canClaim}
              className="ml-4 flex-shrink-0 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isClaiming
                ? "Claiming..."
                : !canClaim
                  ? `Wait ${Math.ceil(Number(cooldownRemaining || 0n) / 60)}m`
                  : "Claim 100 USDC"}
            </button>
          </div>
          {faucetSuccess && (
            <p className="text-xs text-green-400 mt-2">
              100 test USDC claimed successfully.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-400">
            💡 <strong>Faucet not available</strong> — Running on Base Mainnet. Faucet is only available on Base Sepolia testnet.
            <br />
            To use the testnet faucet, add
            <code className="bg-gray-800 px-1 py-0.5 rounded text-green-400 mx-1">NEXT_PUBLIC_FAUCET_ADDRESS</code>
            to your .env.local
          </p>
        </div>
      )}

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Wallet Balance</div>
          <div className="text-xl font-mono">
            {usdcBalance !== undefined ? formatUnits(usdcBalance as bigint, 6) : "0.00"}{" "}
            <span className="text-sm text-gray-500">USDC</span>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Vault Balance</div>
          <div className="text-xl font-mono">
            {assetsFromShares !== undefined
              ? formatUnits(assetsFromShares as bigint, 6)
              : "0.00"}{" "}
            <span className="text-sm text-gray-500">USDC</span>
          </div>
        </div>
      </div>

      {/* Live Protocol APYs */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Live Protocol Rates (Base)</h3>
        <div className="grid grid-cols-2 gap-3">
          <APYCard name="Aave V3" apy={aaveApy} color="text-purple-400" />
          <APYCard name="Compound V3" apy={compoundApy} color="text-green-400" />
          <APYCard name="Moonwell" apy={moonwellApy} color="text-blue-400" />
          <APYCard name="Morpho" apy={morphoApy} color="text-orange-400" />
        </div>
      </div>

      {/* Active Request */}
      {hasActiveRequest && (
        <div className="bg-gray-900 border border-blue-900 rounded-lg p-6 mb-6">
          <h3 className="font-medium text-blue-400 mb-2">AI Analysis in Progress</h3>
          <p className="text-sm text-gray-400">
            The Chainlink CRE workflow is reading live APY data from 4 lending protocols
            and using Claude AI to find the best option for your timeline. This may take
            a few moments.
          </p>
        </div>
      )}

      {/* Active Position */}
      {pos?.isActive && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="font-medium mb-4">Active Position</h3>

          <div className="space-y-3">
            <Row label="Protocol" value={getProtocolName(pos.activeStrategy)} />
            <Row
              label="Amount Deployed"
              value={`${formatUnits(pos.allocatedAmount, 6)} USDC`}
            />
            <Row label="Timeline" value={`${timeHorizonDays} days`} />
            <Row label="Days Remaining" value={`${daysRemaining} days`} />
            <Row
              label="Deposited On"
              value={new Date(depositTimestamp * 1000).toLocaleDateString()}
            />
          </div>

          <button
            onClick={handleWithdrawFromStrategy}
            disabled={isWithdrawing}
            className="mt-4 w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {isWithdrawing ? "Withdrawing from protocol..." : "Withdraw from Protocol"}
          </button>
        </div>
      )}

      {/* Redeem from vault (when funds are in vault but not deployed) */}
      {vaultBalance && (vaultBalance as bigint) > 0n && !pos?.isActive && !hasActiveRequest && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">
                You have {assetsFromShares !== undefined ? formatUnits(assetsFromShares as bigint, 6) : "0"} USDC in the vault ready to withdraw.
              </div>
            </div>
            <button
              onClick={handleRedeemAll}
              disabled={isRedeeming}
              className="ml-4 flex-shrink-0 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isRedeeming ? "Redeeming..." : "Withdraw to Wallet"}
            </button>
          </div>
        </div>
      )}

      {/* Deposit Section */}
      <div className="border-t border-gray-800 pt-8 mt-2">
        <h3 className="text-lg font-semibold mb-6">Deposit</h3>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Deposit Amount (USDC)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="10"
              step="0.01"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={() => {
                if (usdcBalance) setAmount(formatUnits(usdcBalance as bigint, 6));
              }}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
            >
              Max
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum deposit: 10 USDC</p>
        </div>

        {/* Approve / Deposit Buttons */}
        <div className="space-y-3">
          {parsedAmount > 0n && needsApproval && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isApproving ? "Approving USDC..." : "Approve USDC"}
            </button>
          )}

          {parsedAmount > 0n && !needsApproval && (
            <button
              onClick={handleDeposit}
              disabled={isDepositing}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isDepositing ? "Depositing..." : `Deposit ${amount} USDC`}
            </button>
          )}
        </div>
      </div>

      {/* Optimize Section - appears after deposit when vault has balance */}
      {vaultBalance && (vaultBalance as bigint) > 0n && !hasActiveRequest && !pos?.isActive && (
        <div className="border-t border-gray-800 pt-8 mt-8">
          <h3 className="text-lg font-semibold mb-2">Choose Your Target Timeline</h3>
          <p className="text-sm text-gray-400 mb-6">
            Select how long you want to keep your funds invested. The AI will find the best
            lending protocol for your chosen period. Longer timelines generally yield better
            returns as the AI can prioritize higher-APY protocols with greater confidence.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeHorizon(opt.value)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  timeHorizon === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 mb-6">
            Longer commitment periods allow the AI to recommend protocols with better compounding
            effects and more stable yields.
          </p>

          <button
            onClick={handleRequestStrategy}
            disabled={isRequesting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {isRequesting
              ? "Requesting AI analysis..."
              : `Optimize for ${TIME_OPTIONS.find((t) => t.value === timeHorizon)?.label}`}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="mt-12 border-t border-gray-800 pt-6">
        <p className="text-xs text-gray-500 leading-relaxed">
          Kairos Finance uses a Chainlink CRE workflow to analyze Aave V3, Compound V3,
          Moonwell, and Morpho on Base. Claude AI evaluates current APY, protocol risk,
          TVL, and your investment timeline to recommend the optimal allocation.
          You can withdraw your funds at any time.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-mono">{value}</span>
    </div>
  );
}

function APYCard({ name, apy, color }: { name: string; apy: number | null; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <div className={`text-xs font-medium ${color} mb-1`}>{name}</div>
      <div className="text-lg font-mono">
        {apy !== null ? `${apy.toFixed(2)}%` : <span className="text-gray-600">--</span>}
      </div>
      <div className="text-xs text-gray-600">Supply APY</div>
    </div>
  );
}
