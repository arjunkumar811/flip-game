import { PublicKey } from "@solana/web3.js";

export const BET_OPTIONS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6] as const;
export const HOUSE_FEE_BPS = 10;
export const ORAO_RANDOMNESS_ACCOUNT_DISCRIMINATOR = 8;
export const ORAO_RANDOMNESS_OFFSET = 8 + 32 + 32 + 8;

function parsePublicKey(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || /^ReplaceWith/i.test(trimmed)) {
    return null;
  }

  try {
    return new PublicKey(trimmed);
  } catch {
    return null;
  }
}

export const PROGRAM_ID = parsePublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);

export const HOUSE_PDA = parsePublicKey(process.env.NEXT_PUBLIC_HOUSE_PDA);

export const VAULT_PDA = parsePublicKey(process.env.NEXT_PUBLIC_VAULT_PDA);
