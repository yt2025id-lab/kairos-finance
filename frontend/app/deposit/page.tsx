"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import Link from "next/link";
import { LoginButton, LoginCard } from "../../components/LoginButton";
import { useActiveWallet } from "../../hooks/useActiveWallet";
import { useDepositFlow } from "../../hooks/useDepositFlow";
import {
  VAULT_ADDRESS,
  VAULT_ABI,
  CONTROLLER_ADDRESS,
  CONTROLLER_ABI,
  FAUCET_ADDRESS,
  FAUCET_ABI,
} from "../../lib/contracts";

const TIME_OPTIONS = [
  { label: "1 Month", value: 30 * 86400 },
  { label: "3 Months", value: 90 * 86400 },
  { label: "6 Months", value: 180 * 86400 },
  { label: "12 Months", value: 365 * 86400 },
];

// ---------------------------------------------------------------------------
// DEMO MODE — Live Protocol Rates uses static mock data only
// ---------------------------------------------------------------------------

const DEMO_MODE = true;

const DEMO_RATES = {
  aave: 3.42,
  compound: 2.98,
  moonwell: 3.11,
  morpho: 3.67,
};

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
  const [timeHorizon, setTimeHorizon] = useState(TIME_OPTIONS[2].value);
  const deposit = useDepositFlow(address);

  // --- Read contracts ---

  const { data: vaultBalance, refetch: refetchVault } = useReadContract({
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

  // --- Live APY Reads (DEMO MODE ONLY) ---
  // All APY data is static for demo purposes

  // --- APY Demo Data (Static) ---
  const aaveApy = DEMO_RATES.aave;
  const compoundApy = DEMO_RATES.compound;
  const moonwellApy = DEMO_RATES.moonwell;
  const morphoApy = DEMO_RATES.morpho;

  // --- Write contracts ---

  const { writeContract: claimFaucet, data: faucetTxHash } = useWriteContract();
  const { writeContract: requestStrategy, data: requestTxHash } = useWriteContract();
  const { writeContract: withdrawFromStrategy, data: withdrawTxHash } = useWriteContract();
  const { writeContract: redeemFromVault, data: redeemTxHash } = useWriteContract();

  const { isLoading: isClaiming, isSuccess: faucetSuccess } = useWaitForTransactionReceipt({ hash: faucetTxHash });
  const { isLoading: isRequesting } = useWaitForTransactionReceipt({ hash: requestTxHash });
  const { isLoading: isWithdrawing } = useWaitForTransactionReceipt({ hash: withdrawTxHash });
  const { isLoading: isRedeeming } = useWaitForTransactionReceipt({ hash: redeemTxHash });

  // Refetch cooldown after faucet claim lands on-chain
  useEffect(() => {
    if (faucetSuccess) {
      refetchCooldown();
    }
  }, [faucetSuccess, refetchCooldown]);

  // Refetch vault balance when deposit flow reaches success
  useEffect(() => {
    if (deposit.step === "success") {
      refetchVault();
    }
  }, [deposit.step, refetchVault]);

  // --- Derived values ---

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

  // --- Handlers with Enhanced Debugging & Validation ---

  function handleClaimFaucet() {
    console.log("[Faucet] Claiming 100 test USDC...");
    try {
      if (!address) {
        console.error("[Faucet] ❌ Wallet not connected");
        alert("Please connect your wallet first");
        return;
      }

      console.log("[Faucet] 📍 Address:", address);
      claimFaucet({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: "faucet",
      });
      console.log("[Faucet] ✅ Transaction submitted");
    } catch (err) {
      console.error("[Faucet] ❌ Error:", err);
      alert("Faucet claim failed: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  function handleRequestStrategy() {
    console.log("[RequestStrategy] Starting strategy request...");
    try {
      if (!address) {
        console.error("[RequestStrategy] ❌ Wallet not connected");
        alert("Please connect wallet");
        return;
      }

      if (timeHorizon <= 0) {
        console.error("[RequestStrategy] ❌ Invalid time horizon");
        alert("Please select a valid timeline");
        return;
      }

      console.log("[RequestStrategy] 📊 Details:", {
        wallet: address,
        timeHorizon: timeHorizon + " seconds",
        days: Math.floor(timeHorizon / 86400) + " days",
      });

      requestStrategy({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "requestStrategy",
        args: [BigInt(timeHorizon)],
      });
      console.log("[RequestStrategy] ✅ Request submitted to CRE workflow");
    } catch (err) {
      console.error("[RequestStrategy] ❌ Error:", err);
      alert("Strategy request failed: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  function handleWithdrawFromStrategy() {
    console.log("[Withdraw] Starting strategy withdrawal...");
    try {
      if (!address) {
        console.error("[Withdraw] ❌ Wallet not connected");
        alert("Please connect wallet");
        return;
      }

      if (!pos?.isActive) {
        console.error("[Withdraw] ❌ No active strategy position");
        alert("No active position to withdraw");
        return;
      }

      console.log("[Withdraw] 📊 Details:", {
        wallet: address,
        strategy: pos.activeStrategy,
        amount: formatUnits(pos.allocatedAmount, 6) + " USDC",
      });

      withdrawFromStrategy({
        address: CONTROLLER_ADDRESS,
        abi: CONTROLLER_ABI,
        functionName: "withdrawFromStrategy",
        args: [address],
      });
      console.log("[Withdraw] ✅ Withdrawal submitted");
    } catch (err) {
      console.error("[Withdraw] ❌ Error:", err);
      alert("Withdrawal failed: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  function handleRedeemAll() {
    console.log("[Redeem] Starting vault redemption...");
    try {
      if (!address) {
        console.error("[Redeem] ❌ Wallet not connected");
        alert("Please connect wallet");
        return;
      }

      if (!vaultBalance || (vaultBalance as bigint) <= 0n) {
        console.error("[Redeem] ❌ No vault balance to redeem");
        alert("No balance to redeem");
        return;
      }

      console.log("[Redeem] 📊 Details:", {
        wallet: address,
        shares: vaultBalance?.toString(),
        assets: assetsFromShares ? formatUnits(assetsFromShares as bigint, 6) + " USDC" : "N/A",
      });

      redeemFromVault({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "redeem",
        args: [vaultBalance as bigint, address, address],
      });
      console.log("[Redeem] ✅ Redemption submitted");
    } catch (err) {
      console.error("[Redeem] ❌ Error:", err);
      alert("Redemption failed: " + (err instanceof Error ? err.message : String(err)));
    }
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

      {/* Debug Info Panel (Development Helper) */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 mb-6 text-xs font-mono">
          <div className="mb-2 text-gray-500">
            <span className={address ? "text-green-400" : "text-red-400"}>● </span>
            Wallet: {address ? address.slice(0, 10) + "..." : "❌ Not Connected"}
          </div>
          <div className="mb-2 text-gray-500">
            <span className={VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000" ? "text-green-400" : "text-red-400"}>● </span>
            Vault: {VAULT_ADDRESS?.slice(0, 10)}...
          </div>
          <div className="text-gray-500">
            <span className={deposit.usdcBalance !== undefined ? "text-green-400" : "text-yellow-400"}>● </span>
            USDC Balance: {deposit.usdcBalance !== undefined ? formatUnits(deposit.usdcBalance, 6) : "🔄 Loading..."}
          </div>
        </div>
      )}

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
            {deposit.usdcBalance !== undefined ? formatUnits(deposit.usdcBalance, 6) : "0.00"}{" "}
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

      {/* Live Protocol Rates — Demo Mode */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">Live Protocol Rates (Base)</h3>
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Demo</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <APYCard key="aave" name="Aave V3" apy={aaveApy} isLoading={false} isError={false} color="text-purple-400" />
          <APYCard key="compound" name="Compound V3" apy={compoundApy} isLoading={false} isError={false} color="text-green-400" />
          <APYCard key="moonwell" name="Moonwell" apy={moonwellApy} isLoading={false} isError={false} color="text-blue-400" />
          <APYCard key="morpho" name="Morpho" apy={morphoApy} isLoading={false} isError={false} color="text-orange-400" />
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
      {!!vaultBalance && (vaultBalance as bigint) > 0n && !pos?.isActive && !hasActiveRequest && (
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
              value={deposit.amount}
              onChange={(e) => deposit.setAmount(e.target.value)}
              placeholder="0.00"
              min="10"
              step="0.01"
              disabled={deposit.isPending}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
            />
            <button
              onClick={() => {
                if (deposit.usdcBalance) deposit.setAmount(formatUnits(deposit.usdcBalance, 6));
              }}
              disabled={deposit.isPending}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm text-gray-300 transition-colors"
            >
              Max
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum deposit: 10 USDC</p>
        </div>

        {/* Network Warning (shown proactively before user clicks) */}
        {deposit.networkError && (
          <div className="mb-4 bg-red-900/20 border border-red-800/50 px-4 py-3 rounded-lg flex items-center justify-between gap-3">
            <p className="text-sm text-red-400">{deposit.networkError}</p>
            <button
              onClick={deposit.switchNetwork}
              className="flex-shrink-0 text-xs font-medium bg-red-800/50 hover:bg-red-700/60 text-red-200 px-3 py-1.5 rounded-md transition-colors"
            >
              Switch Network
            </button>
          </div>
        )}

        {/* State Machine Action Button */}
        <div className="space-y-3">
          {deposit.step === "success" ? (
            <div className="w-full bg-green-900/30 border border-green-700/50 text-green-400 font-medium py-3 rounded-lg text-center">
              Deposit successful!
            </div>
          ) : (
            <button
              onClick={deposit.handleAction}
              disabled={!deposit.canSubmit}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {deposit.step === "approving"
                ? "Approving USDC..."
                : deposit.step === "depositing"
                  ? "Depositing..."
                  : deposit.needsApproval
                    ? "Approve USDC"
                    : deposit.parsedAmount > 0n
                      ? `Deposit ${deposit.amount} USDC`
                      : "Enter an amount"}
            </button>
          )}

          {deposit.step === "approving" && (
            <p className="text-xs text-gray-500">
              Approving Kairos Vault to spend your USDC — this is a one-time security check.
            </p>
          )}

          {deposit.step === "error" && deposit.errorMessage && (
            <div className="flex items-start justify-between bg-red-900/20 border border-red-800/50 p-3 rounded-lg">
              <p className="text-sm text-red-400">{deposit.errorMessage}</p>
              <button
                onClick={deposit.dismissError}
                className="ml-3 text-red-500 hover:text-red-300 text-xs shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Optimize Section - appears after deposit when vault has balance */}
      {!!vaultBalance && (vaultBalance as bigint) > 0n && !hasActiveRequest && !pos?.isActive && (
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

function APYCard({ name, apy, isLoading, isError, color }: { name: string; apy: number | null; isLoading?: boolean; isError?: boolean; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <div className={`text-xs font-medium ${color} mb-1`}>{name}</div>
      <div className="text-lg font-mono">
        {isLoading ? (
          <span className="text-gray-500 text-sm">Loading...</span>
        ) : isError ? (
          <span className="text-red-600 text-sm">Error</span>
        ) : apy !== null ? (
          `${apy.toFixed(2)}%`
        ) : (
          <span className="text-gray-600">N/A</span>
        )}
      </div>
      <div className="text-xs text-gray-600">Supply APY</div>
    </div>
  );
}
