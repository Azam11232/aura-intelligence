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
        method: "alchemy_getTokenBalances",
        params: [
          address,
          "DEFAULT_TOKENS",
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        {
          error: data.error.message || "Unable to fetch assets",
        },
        { status: 500 }
      );
    }

    const tokenBalances = data?.result?.tokenBalances || [];

    const nonZeroBalances = tokenBalances.filter(
      (token: { tokenBalance?: string }) =>
        token.tokenBalance &&
        token.tokenBalance !== "0x0"
    );

    const assets = await Promise.all(
      nonZeroBalances.map(async (token: {
        contractAddress: string;
        tokenBalance: string;
      }) => {
        const metadataResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "alchemy_getTokenMetadata",
            params: [token.contractAddress],
          }),
        });

        const metadataData = await metadataResponse.json();

        const metadata = metadataData?.result || {};

        const decimals = metadata.decimals || 18;

        const readableBalance =
          Number(token.tokenBalance) /
          Math.pow(10, decimals);

        return {
          contractAddress: token.contractAddress,
          name: metadata.name || "Unknown Token",
          symbol: metadata.symbol || "TOKEN",
          decimals,
          balance: readableBalance,
          logo: metadata.logo || null,
        };
      })
    );

    return NextResponse.json({
      assets,
    });
  } catch (error) {
    console.error("Assets API Error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch portfolio assets",
      },
      { status: 500 }
    );
  }
}