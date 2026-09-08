import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function getFallbackResponse(
  message: string,
  walletContext?: any,
  goalsContext?: any[]
) {
  const text = message.toLowerCase();
  if (
  goalsContext &&
  goalsContext.length > 0 &&
  (
    text.includes("goal") ||
    text.includes("financial goal") ||
    text.includes("prioritize") ||
    text.includes("priority")
  )
) {
  return `Here are your current financial goals:

${JSON.stringify(goalsContext, null, 2)}

AURA recommendation: Review your goals based on urgency, progress, and importance. Prioritize goals with closer deadlines or the largest remaining gap.`;
}
  if (walletContext) {
    const {
      network,
      nativeAsset,
      balance,
      transactionsLoaded,
      sentTransactions,
      receivedTransactions,
      totalSent,
      totalReceived,
      activityLevel,
      assetsInteracted,
      assetSummary,
    } = walletContext;

   if (
  text.includes("portfolio") ||
  text.includes("wallet") ||
  text.includes("activity")
) {
      return `Here is your current wallet analysis:

Network: ${network}
Native Asset: ${nativeAsset}
Current Balance: ${balance}

Activity Level: ${activityLevel}
Transactions Loaded: ${transactionsLoaded}
Assets Interacted: ${assetsInteracted}
Assets Activity: ${assetSummary ? Object.entries(assetSummary)
  .map(([asset, count]) => `${asset}: ${count} transactions`)
  .join(", ") : "No asset data"}
Sent Transactions: ${sentTransactions}
Received Transactions: ${receivedTransactions}


AURA insight: Your wallet activity is currently classified as ${activityLevel}.`;
    }
  }
  if (text.includes("portfolio") || text.includes("crypto")) {
    return `AURA is currently operating in limited mode because the AI service has reached its temporary free quota.

For portfolio management, focus on:
• Diversification
• Understanding your risk exposure
• Avoiding investments you do not understand
• Keeping track of your assets and transactions

Please try again later for a full AI-powered analysis.`;
  }

  if (
    text.includes("goal") ||
    text.includes("save") ||
    text.includes("financial")
  ) {
    return `AURA is currently operating in limited mode.

A good financial goal should have:
• A clear target amount
• A realistic deadline
• A monthly contribution plan
• Regular progress reviews

Try defining one specific financial goal and breaking it into smaller monthly targets.`;
  }

  return `AURA is temporarily operating in limited mode because the AI service is busy or the free API quota has been reached.

Your message: "${message}"

Please try again later for a full AI-powered response.`;
}

export async function POST(request: Request) {
  let message = "";
let walletContext: any = null;
let goalsContext: any[] = [];

  try {
    const body = await request.json();
message = body.message;
walletContext = body.walletContext || null;
goalsContext = body.goalsContext || [];
console.log("GOALS CONTEXT:", goalsContext);
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `User Wallet Context:
${JSON.stringify(walletContext, null, 2)}

User Financial Goals:
${JSON.stringify(goalsContext, null, 2)}

User Question:
${message}`,
      config: {
        systemInstruction: `You are AURA, an intelligent autonomous financial assistant.

You help users understand personal finance, cryptocurrency,
blockchain, onchain assets, and financial goals.

Be clear, helpful and concise.
Do not promise guaranteed financial returns.`,
      },
    });

    return NextResponse.json({
      reply: response.text || "AURA could not generate a response.",
      mode: "ai",
    });

 } catch (error: any) {
  console.error("Gemini Error:", error);

  return NextResponse.json({
    reply: getFallbackResponse(
      message,
      walletContext,
      goalsContext
    ),
    mode: "limited",
  });
}
}
