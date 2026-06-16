import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { SystemProgram } from "@solana/web3.js";

describe("coin_flip", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CoinFlip as Program;

  it("initializes the house account", async () => {
    const [housePda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("house")], program.programId);
    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("vault")], program.programId);

    await program.methods
      .initializeHouse(new anchor.BN(100_000_000), new anchor.BN(600_000_000))
      .accounts({
        admin: provider.wallet.publicKey,
        house: housePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId
      })
      .rpc();

    const house = await program.account.house.fetch(housePda);
    expect(house.minBetLamports.toNumber()).to.equal(100_000_000);
    expect(house.maxBetLamports.toNumber()).to.equal(600_000_000);
  });
});
