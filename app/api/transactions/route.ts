import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ALCHEMY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Alchemy API key is missing" },
        { status: 500 }
      );
    }

    const url = `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromBlock: "0x0",
            toBlock: "latest",
            fromAddress: address,
            category: ["external", "erc20", "erc721"],
            withMetadata: true,
            excludeZeroValue: true,
            maxCount: "0x0A",
            order: "desc",
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Alchemy API Error:", data.error);

      return NextResponse.json(
        {
          error: data.error.message || "Unable to fetch transactions",
        },
        { status: 500 }
      );
    }

    const transfers = data?.result?.transfers || [];

    return NextResponse.json({
      transactions: transfers,
    });
  } catch (error) {
    console.error("Transaction API Error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch wallet transactions",
      },
      { status: 500 }
    );
  }
}