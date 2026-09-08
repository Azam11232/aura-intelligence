"use client";

import { useEffect, useState, useRef } from "react";
import {
  useAccount,
  useBalance,
  useDisconnect,
  useConnect,
  useReadContract,
} from "wagmi";
import { useRouter } from "next/navigation";
import { formatUnits } from "viem";
const USDC_ADDRESS =
  "0x833589fCD6EDB6E08f4c7C32D4f71b54bDA02913" as const;

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      {
        name: "account",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
] as const;
type ChatMessage = {
  role: "user" | "aura";
  content: string;
};
type Transaction = {
  uniqueId?: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  asset: string | null;
  category: string;
  metadata?: {
    blockTimestamp?: string;
  };
};
type FinancialGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
};
function getTimeAgo(timestamp?: string) {
  if (!timestamp) return "";

  const now = new Date();
  const date = new Date(timestamp);

  const seconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(months / 12);
  return `${years} years ago`;
}
export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
const [ethPrice, setEthPrice] = useState<number | null>(null);
const [priceLoading, setPriceLoading] = useState(true);
useEffect(() => {
  async function fetchEthPrice() {
    try {
      const response = await fetch("/api/price");
      const data = await response.json();

      setEthPrice(data.ethereum.usd);
    } catch (error) {
      console.error("Failed to fetch ETH price:", error);
    } finally {
      setPriceLoading(false);
    }
  }

  fetchEthPrice();
}, []);
  // CHAT
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [transactionsLoading, setTransactionsLoading] = useState(false);
  // GOALS
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
const [savingAmount, setSavingAmount] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
const sentTransactions = transactions.filter(
  (tx) => tx.from.toLowerCase() === address?.toLowerCase()
);

const receivedTransactions = transactions.filter(
  (tx) => tx.from.toLowerCase() !== address?.toLowerCase()
);

const totalSent = sentTransactions.reduce(
  (total, tx) => total + Number(tx.value || 0),
  0
);

const totalReceived = receivedTransactions.reduce(
  (total, tx) => total + Number(tx.value || 0),
  0
);
const uniqueAssets = new Set(
  transactions
    .map((tx) => tx.asset)
    .filter((asset): asset is string => Boolean(asset))
);

const activityLevel =
  transactions.length >= 8
    ? "High"
    : transactions.length >= 4
    ? "Medium"
    : transactions.length > 0
    ? "Low"
    : "No Activity";
    const assetSummary = transactions.reduce(
  (summary: Record<string, number>, tx) => {
    const asset = tx.asset || "Unknown";

    summary[asset] = (summary[asset] || 0) + 1;

    return summary;
  },
  {}
);
  const {
    connect,
    connectors,
    isPending: connectLoading,
  } = useConnect();

  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
  });
const { data: usdcBalance, isLoading: usdcLoading } = useReadContract({
  address: USDC_ADDRESS,
  abi: ERC20_ABI,
  functionName: "balanceOf",
  args: address ? [address] : undefined,
});
const formattedUsdcBalance = usdcBalance
  ? Number(formatUnits(usdcBalance, 6)).toFixed(2)
  : "0.00";
  useEffect(() => {
    setMounted(true);

    const savedGoals = localStorage.getItem("aura-financial-goals");

    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (error) {
        console.error("Could not load goals:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        "aura-financial-goals",
        JSON.stringify(goals)
      );
    }
  }, [goals, mounted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatHistory, loading]);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not Connected";

  const formattedBalance = balance
    ? Number(
        formatUnits(balance.value, balance.decimals)
      ).toFixed(4)
    : "0.0000";
    const ethUsdValue =
  ethPrice && balance
    ? Number(formatUnits(balance.value, balance.decimals)) * ethPrice
    : 0;

const totalPortfolioValue =
  ethUsdValue + Number(formattedUsdcBalance);
  const ethAllocation =
  totalPortfolioValue > 0
    ? (ethUsdValue / totalPortfolioValue) * 100
    : 0;

const usdcAllocation =
  totalPortfolioValue > 0
    ? (Number(formattedUsdcBalance) / totalPortfolioValue) * 100
    : 0;
    const portfolioHealthScore =
  totalPortfolioValue === 0
    ? 0
    : Math.min(
        100,
        Math.round(
          50 +
          (ethAllocation > 0 ? 20 : 0) +
          (usdcAllocation > 0 ? 20 : 0) +
          (ethAllocation > 10 && usdcAllocation > 10 ? 10 : 0)
        )
      );

const portfolioHealthStatus =
  portfolioHealthScore >= 80
    ? "Excellent"
    : portfolioHealthScore >= 60
    ? "Good"
    : portfolioHealthScore > 0
    ? "Needs Attention"
    : "No Assets";
const portfolioAssets = [
  {
    name: balance?.symbol || "ETH",
    amount: formattedBalance,
    type: "Native Asset",
  },
  {
    name: "USDC",
    amount: formattedUsdcBalance,
    type: "Stablecoin",
  },
];

const detectedAssets = isConnected ? 2 : 0;
  async function askAura(customMessage?: string) {
    const userMessage = customMessage || message;

    if (!userMessage.trim() || loading) return;

    setChatHistory((previous) => [
      ...previous,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  message: userMessage,
  walletContext: {
    address: address || null,
    network: chain?.name || "Unknown",
    nativeAsset: balance?.symbol || "ETH",
    balance: formattedBalance,
    portfolioValue: formattedBalance || null,
    transactionsLoaded: transactions.length,
    sentTransactions: sentTransactions.length,
    receivedTransactions: receivedTransactions.length,
    activityLevel: activityLevel,
    assetsInteracted: uniqueAssets.size,
    assetSummary: assetSummary,
  },
  goalsContext: goals,
}),
      });

      const data = await response.json();

      const auraReply =
        data.reply ||
        data.error ||
        "AURA could not generate a response right now.";

      setChatHistory((previous) => [
        ...previous,
        {
          role: "aura",
          content: auraReply,
        },
      ]);
    } catch (error) {
      console.error(error);

      setChatHistory((previous) => [
        ...previous,
        {
          role: "aura",
          content:
            "Unable to connect to AURA right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function analyzePortfolio() {
    if (!isConnected || !address) {
      setChatHistory((previous) => [
        ...previous,
        {
          role: "aura",
          content:
            "Please connect your wallet first. Once connected, I can analyze your available onchain wallet information.",
        },
      ]);
      return;
    }

    const portfolioMessage = `Analyze my connected crypto wallet.

Wallet Address: ${address}
Network: ${chain?.name || "Unknown"}
Native Balance: ${formattedBalance} ${balance?.symbol || "ETH"}

Give me a clear portfolio intelligence summary.

Include:
1. Current wallet overview
2. General risk considerations
3. Diversification considerations
4. Questions I should investigate about my portfolio
5. General next steps

Important: Do not invent assets that are not provided. Do not promise financial returns. This is informational analysis only.`;

    await askAura(portfolioMessage);
  }

  function connectWallet() {
    const connector = connectors[0];

    if (!connector) {
      alert(
        "No wallet detected. Please install MetaMask or another browser wallet."
      );
      return;
    }

    connect({ connector });
  }

  function clearChat() {
    setChatHistory([]);
    setMessage("");
  }
const updateGoalSavings = (id: string) => {
  const amount = Number(savingAmount);

  if (!amount || amount <= 0) {
    alert("Please enter a valid savings amount");
    return;
  }

  setGoals((currentGoals) =>
    currentGoals.map((goal) =>
      goal.id === id
        ? {
            ...goal,
            current: goal.current + amount,
          }
        : goal
    )
  );

  setSavingAmount("");
};
  function addGoal() {
    if (!goalName.trim()) {
      alert("Please enter a goal name.");
      return;
    }

    if (!goalTarget || Number(goalTarget) <= 0) {
      alert("Please enter a valid target amount.");
      return;
    }

    const newGoal: FinancialGoal = {
      id: Date.now().toString(),
      name: goalName,
      target: Number(goalTarget),
      current: Number(goalCurrent) || 0,
      deadline: goalDeadline,
    };

    setGoals((previous) => [...previous, newGoal]);

    setGoalName("");
    setGoalTarget("");
    setGoalCurrent("");
    setGoalDeadline("");
    setShowGoalForm(false);
  }

  function deleteGoal(id: string) {
    setGoals((previous) =>
      previous.filter((goal) => goal.id !== id)
    );
  }
  const totalGoals = goals.length;

const totalGoalTarget = goals.reduce(
  (total, goal) => total + goal.target,
  0
);

const totalGoalSavings = goals.reduce(
  (total, goal) => total + goal.current,
  0
);

const overallGoalProgress =
  totalGoalTarget > 0
    ? (totalGoalSavings / totalGoalTarget) * 100
    : 0;
    let financialHealthScore = 0;

// Wallet connected
if (isConnected) {
  financialHealthScore += 25;
}

// Portfolio has assets
if (detectedAssets > 0) {
  financialHealthScore += 25;
}

// Financial goals created
if (totalGoals > 0) {
  financialHealthScore += 25;
}

// Savings progress
if (overallGoalProgress > 0) {
  financialHealthScore += 25;
}
useEffect(() => {
  async function fetchTransactions() {
    if (!address) {
      setTransactions([]);
      return;
    }

    try {
      setTransactionsLoading(true);

      const response = await fetch(
        `/api/transactions?address=${address}`
      );

      const data = await response.json();

      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  }

  fetchTransactions();
}, [address]);
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#08090b] text-white" />
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">

      {/* HEADER */}

      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-10">

        <div>
          <p className="text-xl font-semibold tracking-tight">
  AURA Intelligence
</p>

<p className="text-xs text-zinc-500">
  Your Autonomous Financial Agent
</p>
        </div>

        <div className="flex items-center gap-4">

          <div className="hidden text-right sm:block">
            <p className="text-sm text-zinc-400">
              Agent Status
            </p>

            <p className="text-sm text-emerald-400">
              ● Online
            </p>
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
              onClick={connectWallet}
              disabled={connectLoading}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              {connectLoading
                ? "Connecting..."
                : "Connect Wallet"}
            </button>
          )}

        </div>

      </header>


      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">

        {/* WELCOME */}

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


        {/* WALLET INFO */}

        {true && (
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

                <p className="text-sm text-zinc-500">
                  Network
                </p>

                <p className="mt-1 font-medium text-white">
                  {chain?.name || "Unknown Network"}
                </p>

              </div>

            </div>

          </section>
        )}


        {/* STATS */}

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
                : `${formattedBalance} ${
                    balance?.symbol || "ETH"
                  }`}

            </h2>

            <p className="mt-2 text-xs text-zinc-600">

              {isConnected
                ? "Live balance from connected wallet"
                : "Connect wallet to view balance"}

            </p>

          </div>


          {/* FINANCIAL GOALS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
  <p className="text-sm text-zinc-500">
    USDC Balance
  </p>

  <h2 className="mt-3 text-3xl font-semibold">
    {!isConnected
      ? "Not Connected"
      : usdcLoading
      ? "Loading..."
      : `${formattedUsdcBalance} USDC`}
  </h2>

  <p className="mt-2 text-xs text-zinc-600">
    Live USDC balance on Base
  </p>
</div>


          {/* INTELLIGENCE */}

          <div className="rounded-2xl border border-white/[0.15] bg-gradient-to-br from-white/[0.08] to-transparent p-6">

            <p className="text-sm text-zinc-400">
              AURA Intelligence
            </p>

            <h2 className="mt-3 text-3xl font-semibold text-emerald-400">
              Ready
            </h2>

            <p className="mt-2 text-xs text-zinc-500">
              {isConnected
                ? "Wallet intelligence available"
                : "Connect wallet to activate intelligence"}
            </p>

          </div>

        </section>
{/* TOTAL PORTFOLIO VALUE */}

{isConnected && (
  <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-emerald-400">
          TOTAL PORTFOLIO VALUE
        </p>

        <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
          {priceLoading
            ? "Loading..."
            : `$${totalPortfolioValue.toFixed(2)}`}
        </h2>

        <p className="mt-2 text-xs text-zinc-500">
          Estimated value of your ETH and USDC holdings
        </p>
      </div>

      <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-400">
        Live
      </div>

    </div>

  </section>
)}
{/* PORTFOLIO HOLDINGS */}
{/* PORTFOLIO ALLOCATION */}

{isConnected && (
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

    <div>
      <p className="text-sm text-zinc-500">
        PORTFOLIO ALLOCATION
      </p>

      <h2 className="mt-1 text-xl font-semibold">
        Asset Distribution
      </h2>
    </div>

    <div className="mt-6 space-y-6">

      {/* ETH */}

      <div>

        <div className="flex items-center justify-between">

          <div>
            <p className="font-medium text-white">
              {balance?.symbol || "ETH"}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              ${ethUsdValue.toFixed(2)}
            </p>
          </div>

          <p className="text-sm font-medium text-emerald-400">
            {ethAllocation.toFixed(1)}%
          </p>

        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">

          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{
              width: `${ethAllocation}%`,
            }}
          />

        </div>

      </div>


      {/* USDC */}

      <div>

        <div className="flex items-center justify-between">

          <div>
            <p className="font-medium text-white">
              USDC
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              ${Number(formattedUsdcBalance).toFixed(2)}
            </p>
          </div>

          <p className="text-sm font-medium text-blue-400">
            {usdcAllocation.toFixed(1)}%
          </p>

        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">

          <div
            className="h-full rounded-full bg-blue-400 transition-all duration-500"
            style={{
              width: `${usdcAllocation}%`,
            }}
          />

        </div>

      </div>

    </div>

  </section>
)}
{isConnected && (

  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-zinc-500">
          PORTFOLIO HOLDINGS
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          Assets Detected
        </h2>
      </div>

      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
        {detectedAssets} Assets
      </span>

    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">

      {portfolioAssets.map((asset) => (

        <div
          key={asset.name}
          className="rounded-xl border border-white/10 bg-black/20 p-5"
        >

          <div className="flex items-center justify-between">

            <div>
              <p className="font-medium text-white">
                {asset.name}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {asset.type}
              </p>
            </div>

            <p className="text-lg font-semibold text-emerald-400">
              {asset.amount}
            </p>

          </div>

        </div>

      ))}

    </div>

    <p className="mt-5 text-xs text-zinc-600">
      Currently monitoring native ETH and USDC assets on Base.
    </p>

  </section>

)}{/* PORTFOLIO HEALTH SCORE */}

{isConnected && (
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

      <div>
        <p className="text-sm text-zinc-500">
          PORTFOLIO HEALTH
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          Overall Portfolio Score
        </h2>

        <div className="mt-5 flex items-end gap-3">

          <p className="text-5xl font-semibold text-emerald-400">
            {portfolioHealthScore}
          </p>

          <p className="mb-2 text-zinc-500">
            / 100
          </p>

        </div>

        <p className="mt-3 text-sm text-zinc-400">
          Status:{" "}
          <span className="font-medium text-emerald-400">
            {portfolioHealthStatus}
          </span>
        </p>
      </div>


      <div className="space-y-3 md:w-1/2">

        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="text-emerald-400">●</span>
          Portfolio assets monitored
        </div>

        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="text-emerald-400">●</span>
          Diversification analysis active
        </div>

        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="text-emerald-400">●</span>
          Base network monitoring enabled
        </div>

      </div>

    </div>

  </section>
)}
{/* RECENT ONCHAIN ACTIVITY */}
{true && (
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-500">
          RECENT ONCHAIN ACTIVITY
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          Latest Base Transactions
        </h2>
      </div>

      <span className="text-xs text-zinc-500">
        Base Mainnet
      </span>
    </div>
<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
    <p className="text-xs text-zinc-500">TRANSACTIONS</p>
    <p className="mt-2 text-xl font-semibold text-white">
      {transactions.length}
    </p>
  </div>

  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
    <p className="text-xs text-red-400">TOTAL SENT</p>
    <p className="mt-2 text-xl font-semibold text-red-400">
      {totalSent.toFixed(4)}
    </p>
  </div>

  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
    <p className="text-xs text-emerald-400">TOTAL RECEIVED</p>
    <p className="mt-2 text-xl font-semibold text-emerald-400">
      {totalReceived.toFixed(4)}
    </p>
  </div>
</div>
    <div className="mt-6 space-y-3">
      {transactionsLoading ? (
        <p className="text-sm text-zinc-500">
          Loading transactions...
        </p>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No recent Base transactions found.
        </p>
      ) : (
        transactions.slice(0, 5).map((tx) => (
          <div
            key={tx.uniqueId || tx.hash}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4"
          >
            <div>
              <div className="flex items-center gap-2">
  <span
    className={`rounded-full px-2 py-1 text-xs font-medium ${
      tx.from.toLowerCase() === address?.toLowerCase()
        ? "bg-red-500/10 text-red-400"
        : "bg-emerald-500/10 text-emerald-400"
    }`}
  >
    {tx.from.toLowerCase() === address?.toLowerCase()
      ? "Sent"
      : "Received"}
  </span>

  <span className="text-xs text-zinc-500">
  {tx.category === "erc20"
    ? "ERC-20 Token"
    : tx.category === "erc721"
    ? "NFT"
    : tx.category === "external"
    ? "External Transfer"
    : tx.category}
</span>
</div>

              <p className="mt-1 text-xs text-zinc-500">
  {tx.to
    ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
    : "Unknown address"}
</p>

<a
  href={`https://basescan.org/tx/${tx.hash}`}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300"
>
  View transaction ↗
</a>
            </div>

            <div className="text-right">
              <p
  className={`font-medium ${
    tx.from.toLowerCase() === address?.toLowerCase()
      ? "text-red-400"
      : "text-emerald-400"
  }`}
>
  {tx.from.toLowerCase() === address?.toLowerCase() ? "-" : "+"}
  {Number(tx.value).toFixed(4)} {tx.asset || ""}
</p>

              <p className="mt-1 text-xs text-zinc-600">
  {getTimeAgo(tx.metadata?.blockTimestamp)}
</p>
            </div>
          </div>
        ))
      )}{transactions.length > 5 && address && (
  <a
    href={`https://basescan.org/address/${address}`}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-5 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-blue-500/50 hover:bg-white/[0.06] hover:text-white"
  >
    View All Transactions on BaseScan ↗
  </a>
)}
    </div>
  </section>
)}
        {/* WALLET INTELLIGENCE CARD */}

        {isConnected && (

          <section className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>

                <p className="text-sm text-blue-400">
                  WALLET INTELLIGENCE
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Portfolio Overview
                </h2>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">

                  <div>
                    <p className="text-zinc-500">
                      Network
                    </p>

                    <p className="mt-1 text-white">
                      {chain?.name || "Unknown"}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">
                      Native Asset
                    </p>

                    <p className="mt-1 text-white">
                      {balance?.symbol || "ETH"}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">
                      Balance
                    </p>

                    <p className="mt-1 text-white">
                      {formattedBalance}
                    </p>
                  </div>

                </div>

              </div>
<div className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
  <div>
    <p className="text-zinc-500">Activity Level</p>

    <p className="mt-1 font-medium text-blue-400">
      {activityLevel}
    </p>
  </div>

  <div>
    <p className="text-zinc-500">Transactions Loaded</p>

    <p className="mt-1 font-medium text-white">
      {transactions.length}
    </p>
  </div>

  <div>
    <p className="text-zinc-500">Assets Interacted</p>

    <p className="mt-1 font-medium text-white">
      {uniqueAssets.size}
    </p>
  </div>
</div>

              <button
                onClick={analyzePortfolio}
                disabled={loading}
                className="rounded-xl bg-blue-400 px-6 py-3 text-sm font-medium text-black hover:bg-blue-300 disabled:opacity-50"
              >
                {loading
                  ? "Analyzing..."
                  : "Analyze Portfolio"}
              </button>

            </div>

          </section>

        )}


        {/* GOAL FORM */}

        {showGoalForm && (

          <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-emerald-400">
                  NEW FINANCIAL GOAL
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Create a goal
                </h2>
              </div>

              <button
                onClick={() => setShowGoalForm(false)}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Cancel
              </button>

            </div>


            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Goal name (e.g. Buy a house)"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-emerald-500/40"
              />

              <input
                type="number"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder="Target amount"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-emerald-500/40"
              />

              <input
                type="number"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                placeholder="Current savings (optional)"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-emerald-500/40"
              />

              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400 outline-none focus:border-emerald-500/40"
              />

            </div>


            <button
              onClick={addGoal}
              className="mt-5 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-medium text-black hover:bg-emerald-300"
            >
              Create Goal
            </button>

          </section>

        )}
        

{/* FINANCIAL HEALTH SCORE */}

{isConnected && (
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-zinc-500">
          FINANCIAL HEALTH SCORE
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          Your Financial Position
        </h2>
      </div>

      <div className="text-right">
        <p className="text-3xl font-bold text-emerald-400">
          {financialHealthScore}/100
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          Financial Score
        </p>
      </div>

    </div>

    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">

      <div
        className="h-full rounded-full bg-emerald-400 transition-all duration-500"
        style={{
          width: `${financialHealthScore}%`,
        }}
      />

    </div>

    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">

      <div className="rounded-lg bg-black/20 p-3">
        {isConnected ? "✓ Wallet Connected" : "○ Wallet Not Connected"}
      </div>

      <div className="rounded-lg bg-black/20 p-3">
        {detectedAssets > 0
          ? "✓ Portfolio Assets Detected"
          : "○ No Portfolio Assets"}
      </div>

      <div className="rounded-lg bg-black/20 p-3">
        {totalGoals > 0
          ? "✓ Financial Goals Created"
          : "○ No Financial Goals"}
      </div>

      <div className="rounded-lg bg-black/20 p-3">
        {overallGoalProgress > 0
          ? "✓ Savings Progress Started"
          : "○ Start Saving Towards Goals"}
      </div>

    </div>

  </section>
)}

{/* GOALS SUMMARY */}
{/* GOALS SUMMARY */}

{goals.length > 0 && (
  <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-zinc-500">
        Total Goals
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {totalGoals}
      </p>
    </div>


    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-zinc-500">
        Total Target
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {totalGoalTarget.toLocaleString()}
      </p>
    </div>


    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-zinc-500">
        Total Savings
      </p>

      <p className="mt-2 text-2xl font-semibold text-emerald-400">
        {totalGoalSavings.toLocaleString()}
      </p>
    </div>


    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-zinc-500">
        Overall Progress
      </p>

      <p className="mt-2 text-2xl font-semibold text-emerald-400">
        {overallGoalProgress.toFixed(1)}%
      </p>
    </div>

  </section>
)}
        {/* GOALS LIST */}

        {goals.length > 0 && (

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm text-zinc-500">
              YOUR FINANCIAL GOALS
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Progress Overview
            </h2>


            <div className="mt-6 grid gap-4 md:grid-cols-2">

              {goals.map((goal) => {

                const progress = Math.min(
                  (goal.current / goal.target) * 100,
                  100
                );
const remaining = Math.max(
  goal.target - goal.current,
  0
);

const deadlineDate = goal.deadline
  ? new Date(goal.deadline)
  : null;

const today = new Date();

const daysRemaining = deadlineDate
  ? Math.max(
      Math.ceil(
        (deadlineDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      0
    )
  : null;

const monthsRemaining =
  daysRemaining !== null
    ? Math.max(daysRemaining / 30, 1)
    : null;

const monthlySavingsNeeded =
  monthsRemaining !== null
    ? remaining / monthsRemaining
    : null;
                return (

                  <div
                    key={goal.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-5"
                  >

                    <div className="flex items-start justify-between">

                      <div>

                        <h3 className="font-medium text-white">
                          {goal.name}
                        </h3>

                        {goal.deadline && (
                          <p className="mt-1 text-xs text-zinc-500">
                            Target: {goal.deadline}
                          </p>
                        )}

                      </div>


                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>

                    </div>


                    <div className="mt-5 flex justify-between text-sm">
<div className="mt-4 flex gap-2">

  <input
    type="number"
    value={savingAmount}
    onChange={(e) => setSavingAmount(e.target.value)}
    placeholder="Add savings amount"
    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-emerald-500/40"
  />

  <button
    type="button"
    onClick={() => updateGoalSavings(goal.id)}
    className="whitespace-nowrap rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-300"
  >
    Add Savings
  </button>

</div>
                      <span className="text-zinc-400">
                        {goal.current.toLocaleString()}
                      </span>

                      <span className="text-white">
                        {goal.target.toLocaleString()}
                      </span>

                    </div>


                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">

                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>


                    <div className="mt-3 flex justify-between">

                      <p className="text-xs text-zinc-500">
                        Progress
                      </p>

                      <p className="text-xs font-medium text-emerald-400">
                        {progress.toFixed(1)}%
                      </p>
{goal.deadline && (
  <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
<div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">

  <div>
    <p className="text-xs text-zinc-500">
      Remaining
    </p>

    <p className="mt-1 text-sm font-medium text-white">
      {(goal.target - goal.current).toLocaleString()}
    </p>
  </div>

  <div>
    <p className="text-xs text-zinc-500">
      Days Left
    </p>

    <p className="mt-1 text-sm font-medium text-white">
      {goal.deadline
        ? Math.max(
            Math.ceil(
              (new Date(goal.deadline).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            ),
            0
          )
        : "No deadline"}
    </p>
  </div>

</div>
    <div>
      <p className="text-xs text-zinc-500">
        Remaining
      </p>
      <p className="mt-1 text-sm font-medium text-white">
        {remaining.toLocaleString()}
      </p>
    </div>

    <div>
      <p className="text-xs text-zinc-500">
        Days Left
      </p>
      <p className="mt-1 text-sm font-medium text-white">
        {daysRemaining}
      </p>
    </div>

    <div>
      <p className="text-xs text-zinc-500">
        Monthly Needed
      </p>
      <p className="mt-1 text-sm font-medium text-emerald-400">
        {monthlySavingsNeeded
          ? monthlySavingsNeeded.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })
          : "0"}
      </p>
    </div>

  </div>
)}
                    </div>

                  </div>

                );
              })}

            </div>

          </section>

        )}


        {/* MAIN AREA */}

        <section className="mt-6 grid gap-6 lg:grid-cols-3">


          {/* AURA CHAT */}

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


              <div className="flex items-center gap-3">

                {chatHistory.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Clear Chat
                  </button>
                )}

                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  Online
                </div>

              </div>

            </div>


            {/* CHAT HISTORY */}

            {chatHistory.length > 0 && (

              <div className="mt-6 max-h-[450px] space-y-4 overflow-y-auto pr-2">

                {chatHistory.map((chat, index) => (

                  <div
                    key={index}
                    className={
                      chat.role === "user"
                        ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-white px-4 py-3 text-sm text-black"
                        : "mr-auto max-w-[90%] rounded-2xl rounded-tl-sm border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-zinc-300"
                    }
                  >

                    {chat.role === "aura" && (
                      <p className="mb-2 text-xs font-medium text-emerald-400">
                        AURA
                      </p>
                    )}

                    <p className="whitespace-pre-line leading-6">
                      {chat.content}
                    </p>

                  </div>

                ))}


                {loading && (

                  <div className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">

                    <p className="text-xs font-medium text-emerald-400">
                      AURA
                    </p>

                    <p className="mt-2 animate-pulse text-sm text-zinc-400">
                      Thinking...
                    </p>

                  </div>

                )}

                <div ref={chatEndRef} />

              </div>

            )}


            {chatHistory.length === 0 && !loading && (

              <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-4">

                <p className="text-sm text-zinc-500">
                  Ask AURA about your finances, crypto, portfolio,
                  Base blockchain, or financial goals.
                </p>

              </div>

            )}


            {/* INPUT */}

            <div className="mt-5 flex gap-3">

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    askAura();
                  }
                }}
                placeholder="Ask your financial agent..."
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white/30 disabled:opacity-50"
              />

              <button
                onClick={() => askAura()}
                disabled={loading || !message.trim()}
                className="rounded-lg bg-white px-5 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Ask"}
              </button>

            </div>

          </div>


          {/* QUICK ACTIONS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm text-zinc-500">
              QUICK ACTIONS
            </p>

            <div className="mt-5 space-y-3">

              <button
                onClick={analyzePortfolio}
                disabled={loading}
                className="w-full rounded-xl border border-white/10 p-4 text-left transition hover:bg-white/5 disabled:opacity-50"
              >

                <p className="font-medium">
                  Analyze Portfolio
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Analyze connected wallet intelligence
                </p>

              </button>


              <button
   type="button"
onClick={() => {
  console.log("GOAL BUTTON CLICKED");
  setShowGoalForm(true);
}}
className="w-full rounded-xl border border-white/10 p-4 text-left transition hover:bg-white/5"
>
  <p className="font-medium">
    Set Financial Goal
  </p>

  <p className="mt-1 text-xs text-zinc-500">
    Create and track your target
  </p>
</button>


              <button
                onClick={() =>
                  askAura(
                    "Explain the opportunities available on Base blockchain."
                  )
                }
                disabled={loading}
                className="w-full rounded-xl border border-white/10 p-4 text-left transition hover:bg-white/5 disabled:opacity-50"
              >

                <p className="font-medium">
                  Explore Base
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Discover your onchain opportunities
                </p>

              </button>

            </div>

          </div>

        </section>


        {/* ACTIVITY */}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-zinc-500">
                ACTIVITY
              </p>

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
              ? "AURA is monitoring your connected wallet and can provide contextual portfolio intelligence."
              : "Connect your wallet to allow AURA to begin analyzing your onchain financial activity."}

          </div>

        </section>

      </div>

    </main>
  );
}