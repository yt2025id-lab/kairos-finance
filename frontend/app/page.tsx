"use client";

import Link from "next/link";
import { LoginButton, LoginCard } from "../components/LoginButton";
import { useActiveWallet } from "../hooks/useActiveWallet";

export default function Home() {
  const { isConnected } = useActiveWallet();

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      {/* Header */}
      <nav className="flex items-center justify-between mb-20">
        <h1 className="text-xl font-semibold tracking-tight">Kairos Finance</h1>
        <LoginButton />
      </nav>

      {/* Hero */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          The right moment
          <br />
          for your yield.
        </h2>
        <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
          Deposit USDC, set your time horizon, and let AI find the best
          lending rate across Base protocols. Powered by Chainlink and Claude.
        </p>
      </section>

      {/* How it works - Onboarding */}
      <section className="mb-16 space-y-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          How it works
        </h3>

        <div className="space-y-4">
          <Step
            number="1"
            title="Sign in"
            description="Use your email or connect an existing wallet. If you sign in with email, we create a wallet for you automatically -- no extensions needed."
          />
          <Step
            number="2"
            title="Deposit and set your timeline"
            description="Deposit USDC into the Kairos vault and choose your investment horizon -- 7 days, 30 days, 90 days, or more."
          />
          <Step
            number="3"
            title="AI analyzes"
            description="A Chainlink CRE workflow reads live APY data from Aave, Compound, Moonwell, and Morpho on Base. Claude AI then determines the best protocol for your timeline."
          />
          <Step
            number="4"
            title="Funds deployed"
            description="The AI recommendation is delivered on-chain and your funds are automatically deposited into the best-performing protocol. Withdraw anytime."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mb-16">
        {isConnected ? (
          <Link
            href="/deposit"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        ) : (
          <LoginCard />
        )}
      </section>

      {/* Protocols */}
      <section className="mb-16">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Protocols analyzed
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {["Aave V3", "Compound V3", "Moonwell", "Morpho"].map((name) => (
            <div
              key={name}
              className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-300"
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-gray-800 pt-8">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>Built on Base</span>
          <span className="text-gray-700">|</span>
          <span>Chainlink CRE</span>
          <span className="text-gray-700">|</span>
          <span>Claude AI</span>
          <span className="text-gray-700">|</span>
          <span>ERC-4626</span>
        </div>
      </section>
    </main>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-mono text-gray-400">
        {number}
      </div>
      <div>
        <h4 className="font-medium mb-1">{title}</h4>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
