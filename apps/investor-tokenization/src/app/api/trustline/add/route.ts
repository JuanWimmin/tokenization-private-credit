import * as StellarSDK from "@stellar/stellar-sdk";
import { NextResponse } from "next/server";

const RPC_URL = "https://soroban-testnet.stellar.org";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export async function POST(request: Request) {
  const data = await request.json();
  const { address } = data ?? {};

  if (!address) {
    return NextResponse.json(
      { error: "Missing required field: address" },
      { status: 400 },
    );
  }

  try {
    const server = new StellarSDK.rpc.Server(RPC_URL);
    const sourceAccount = await server.getAccount(address);

    const asset = new StellarSDK.Asset("USDC", USDC_ISSUER);

    const transaction = new StellarSDK.TransactionBuilder(sourceAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: StellarSDK.Networks.TESTNET,
    })
      .addOperation(StellarSDK.Operation.changeTrust({ asset }))
      .setTimeout(300)
      .build();

    return NextResponse.json({
      success: true,
      xdr: transaction.toXDR(),
      message: "Trustline transaction built. Sign with wallet and submit.",
    });
  } catch (error) {
    console.error("Trustline transaction build error:", error);
    return NextResponse.json(
      {
        error: "Failed to build trustline transaction",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
