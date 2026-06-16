import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import bs58 from "bs58";
import { Keypair, PublicKey } from "@solana/web3.js";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const secret = JSON.parse(process.env.ADMIN_SECRET_KEY_JSON ?? "[]") as number[];
  const admin = Keypair.fromSecretKey(Uint8Array.from(secret));
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID ?? "");
  const idl = await anchor.Program.fetchIdl(programId, provider);

  if (!idl) {
    throw new Error("IDL not found for configured program id.");
  }

  const program = new anchor.Program(idl, programId, provider);
  const games = await (program.account as any).game.all([
    {
      memcmp: {
        offset: 8 + 32 + 32 + 8 + 8 + 8 + 8 + 32 + 1 + 1,
        bytes: bs58.encode(Uint8Array.from([0]))
      }
    }
  ]);

  for (const row of games) {
    const account = row.account as { player: PublicKey; randomnessAccount: PublicKey };
    await program.methods
      .settleBet()
      .accounts({
        house: new PublicKey(process.env.NEXT_PUBLIC_HOUSE_PDA ?? ""),
        game: row.publicKey,
        randomnessAccount: account.randomnessAccount,
        player: account.player
      })
      .signers([admin])
      .rpc();
  }
}

void main();
