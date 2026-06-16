import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";

module.exports = async function deploy(provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);

  const program = anchor.workspace.CoinFlip as anchor.Program;
  const [housePda] = PublicKey.findProgramAddressSync([Buffer.from("house")], program.programId);
  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault")], program.programId);

  await program.methods
    .initializeHouse(
      new anchor.BN(100_000_000),
      new anchor.BN(600_000_000)
    )
    .accounts({
      admin: provider.wallet.publicKey,
      house: housePda,
      vault: vaultPda,
      systemProgram: SystemProgram.programId
    })
    .rpc();
};
