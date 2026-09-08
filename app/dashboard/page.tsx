"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";
import { formatUnits } from "viem";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not Connected";

  const formattedBalance = balance
    ? Number(
        formatUnits(balance.value, balance.decimals)
      ).toFixed(4)
    : "0.0000";

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white" />
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">

      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-10">
        <div>
          <p className="text-xl font-semibold tracking-tight">AURA</p>
          <p className="text-xs text-zinc-500">
            Financial Intelligence
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm text-zinc-400">Agent Status</p>
            <p className="text-sm text-emerald-400">● Online</p>
          </div>

          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              {shortAddress}
            </button>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">

        <section className="mb-10">
          <p className="text-sm text-zinc-500">
            YOUR FINANCIAL COMMAND CENTER
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Good to see you.
          </h1>

          <p className="mt-3 max-w-xl text-zinc-400">
            AURA monitors your onchain world and helps you understand,
            decide, and act intelligently.
          </p>
        </section>

        {isConnected && (
          <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>
                <p className="text-sm text-emerald-400">
                  ● WALLET CONNECTED
                </p>

                <p className="mt-2 font-mono text-sm text-zinc-300">
                  {address}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-sm text-zinc-500">Network</p>

                <p className="mt-1 font-medium text-white">
                  {chain?.name || "Unknown Network"}
                </p>
              </div>

            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-zinc-500">
              Wallet Balance
            </p>

            <h2 className="mt-3 text-3xl font-semibold">
              {!isConnected
                ? "Not Connected"
                : balanceLoading
                ? "Loading..."
                : `${formattedBalance} ${balance?.symbol || "ETH"}`}
            </h2>

            <p className="mt-2 text-xs text-zinc-600">
              {isConnected
                ? "Live balance from connected wallet"
                : "Connect wallet to view balance"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-zinc-500">
              Financial Goals
            </p>

            <h2 className="mt-3 text-3xl font-semibold">0</h2>

            <p className="mt-2 text-xs text-zinc-600">
              No active goals yet
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.15] bg-gradient-to-br from-white/[0.08] to-transparent p-6">
            <p className="text-sm text-zinc-400">
              AURA Intelligence
            </p>

            <h2 className="mt-3 text-3xl font-semibold text-emerald-400">
              Ready
            </h2>

            <p className="mt-2 text-xs text-zinc-500">
              Your autonomous agent is standing by
            </p>
          </div>

        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">
                  AUTONOMOUS AGENT
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Ask AURA anything
                </h2>
              </div>

              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                Online
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-500">
                What would you like to understand about your finances?
              </p>

              <div className="mt-4 flex gap-3">
                <input
                  type="text"
                  placeholder="Ask your financial agent..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white/30"
                />

                <button className="rounded-lg bg-white px-5 text-sm font-medium text-black hover:bg-zinc-200">
                  Ask
                </button>
              </div>
            </div>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm text-zinc-500">
              QUICK ACTIONS
            </p>

            <div className="mt-5 space-y-3">

              <button className="w-full rounded-xl border border-white/10 p-4 text-left transition hover:bg-white/5">
                <p className="font-medium">Analyze Portfolio</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Understand your assets and activity
                </p>
              </button>

              <button className="w-full rounded-xl border border-white/10 p-4 text-left transition hover:bg-white/5">
                <p className="font-medium">Set Financial Goal</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Let AURA help plan your target
                </p>
              </button>

              <button className="w-full rounded-xl border border-white/10 p-4 text-left transition hover:bg-white/5">
                <p className="font-medium">Explore Base</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Discover your onchain opportunities
                </p>
              </button>

            </div>
          </div>

        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-zinc-500">ACTIVITY</p>

              <h2 className="mt-1 text-xl font-semibold">
                Recent Intelligence
              </h2>
            </div>

            <span className="text-sm text-zinc-600">
              {isConnected
                ? "Wallet monitoring active"
                : "No activity yet"}
            </span>

          </div>

          <div className="mt-6 border-t border-white/10 pt-6 text-center text-sm text-zinc-600">

            {isConnected
              ? "AURA can now begin analyzing your connected wallet."
              : "Connect your wallet to allow AURA to begin analyzing your onchain financial activity."}

          </div>

        </section>

      </div>
    </main>
  );
}