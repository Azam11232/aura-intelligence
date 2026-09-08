import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      {
        next: {
          revalidate: 60,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch ETH price");
    }

    const data = await response.json();

    return NextResponse.json({
      ethereum: {
        usd: data.ethereum.usd,
      },
    });
  } catch (error) {
    console.error("Price API Error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch ETH price",
      },
      { status: 500 }
    );
  }
}