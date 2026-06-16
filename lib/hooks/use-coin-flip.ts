"use client";

import { useState } from "react";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getProgram, deriveGamePda, deriveHousePda, deriveVaultPda, solToLamports, SYSTEM_PROGRAM_ID } from "@/lib/solana/program";

export type Choice = "HEADS" | "TAILS";

export type CoinFlipOutcome = {
  amount: number;
  choice: Choice;
  result: Choice;
  outcome: "WIN" | "LOSE";
  payout: number;
  signature: string;
};

type PlayArgs = {
  amount: number;
  choice: Choice;
};

type GameAccount = {
  settled: boolean;
  claimed: boolean;
  choice: number;
  result: number;
  payoutLamports: { toString(): string };
};

export function useCoinFlip() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CoinFlipOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function play({ amount, choice }: PlayArgs) {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }

    setPending(true);
    setError(null);

    try {
      const anchorWallet = wallet as AnchorWallet;
      const program = getProgram(connection, anchorWallet);
      const clientSeed = crypto.getRandomValues(new Uint8Array(32));
      const [housePda] = await deriveHousePda();
      const [vaultPda] = await deriveVaultPda();
      const [gamePda] = await deriveGamePda(wallet.publicKey, clientSeed);
      const randomness = Keypair.generate().publicKey;

      const transaction = (await program.methods
        .placeBet(solToLamports(amount), choice === "HEADS" ? 0 : 1, Array.from(clientSeed))
        .accounts({
          player: wallet.publicKey,
          house: housePda,
          vault: vaultPda,
          game: gamePda,
          randomness,
          systemProgram: SYSTEM_PROGRAM_ID
        })
        .transaction()) as Transaction;

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      const settled = await waitForSettlement(program, gamePda);
      if (!settled) {
        throw new Error("VRF settlement timed out.");
      }

      if (settled.settled && !settled.claimed && Number(settled.payoutLamports.toString()) > 0) {
        const claimTx = (await program.methods
          .claim()
          .accounts({
            player: wallet.publicKey,
            house: housePda,
            vault: vaultPda,
            game: gamePda,
            systemProgram: SYSTEM_PROGRAM_ID
          })
          .transaction()) as Transaction;

        const claimSignature = await wallet.sendTransaction(claimTx, connection);
        await connection.confirmTransaction(claimSignature, "confirmed");
      }

      const payout = Number(settled.payoutLamports.toString()) / 1_000_000_000;
      const outcome: CoinFlipOutcome = {
        amount,
        choice,
        result: settled.result === 0 ? "HEADS" : "TAILS",
        outcome: payout > 0 ? "WIN" : "LOSE",
        payout,
        signature
      };

      setResult(outcome);

      await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          walletAddress: wallet.publicKey.toBase58(),
          betAmount: amount,
          choice,
          result: outcome.result,
          outcome: outcome.outcome,
          payout: outcome.payout,
          signature
        })
      });

      return outcome;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to submit the coin flip right now.");
      return null;
    } finally {
      setPending(false);
    }
  }

  return { error, pending, result, play };
}

async function waitForSettlement(program: ReturnType<typeof getProgram>, gamePda: PublicKey) {
  const gameAccountClient = (program as any).account.game;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const account = (await gameAccountClient.fetchNullable(gamePda)) as GameAccount | null;
    if (account?.settled) {
      return account;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return null;
}
