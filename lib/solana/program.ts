import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { COIN_FLIP_IDL } from "@/lib/idl/coin_flip";
import { HOUSE_PDA, PROGRAM_ID, VAULT_PDA } from "./constants";

function requirePublicKey(value: PublicKey | null, envName: string) {
  if (!value) {
    throw new Error(`${envName} is missing or invalid. Update your environment variables with deployed Solana addresses.`);
  }

  return value;
}

export function getProgram(connection: Connection, wallet: Wallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed"
  });

  return new Program(COIN_FLIP_IDL, requirePublicKey(PROGRAM_ID, "NEXT_PUBLIC_PROGRAM_ID"), provider);
}

export function solToLamports(amount: number) {
  return new BN(Math.round(amount * 1_000_000_000));
}

export async function deriveHousePda() {
  return [requirePublicKey(HOUSE_PDA, "NEXT_PUBLIC_HOUSE_PDA")] as const;
}

export async function deriveVaultPda() {
  return [requirePublicKey(VAULT_PDA, "NEXT_PUBLIC_VAULT_PDA")] as const;
}

export async function deriveGamePda(player: PublicKey, seed: Uint8Array) {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("game"), player.toBuffer(), seed],
    requirePublicKey(PROGRAM_ID, "NEXT_PUBLIC_PROGRAM_ID")
  );
}

export const SYSTEM_PROGRAM_ID = SystemProgram.programId;
