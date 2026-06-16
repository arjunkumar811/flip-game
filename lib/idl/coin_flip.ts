import type { Idl } from "@coral-xyz/anchor";

export const COIN_FLIP_IDL: Idl = {
  address: "ReplaceWithDeployedProgramId",
  metadata: {
    name: "coin_flip",
    version: "0.1.0",
    spec: "0.1.0"
  },
  accounts: [
    {
      name: "house",
      discriminator: [155, 89, 46, 156, 123, 102, 5, 179]
    },
    {
      name: "vault",
      discriminator: [211, 8, 232, 43, 2, 152, 117, 119]
    },
    {
      name: "game",
      discriminator: [27, 90, 166, 125, 74, 100, 121, 18]
    }
  ],
  instructions: [
    {
      name: "initializeHouse",
      discriminator: [175, 123, 36, 219, 92, 128, 7, 211],
      accounts: [],
      args: [
        { name: "minBetLamports", type: "u64" },
        { name: "maxBetLamports", type: "u64" }
      ]
    },
    {
      name: "placeBet",
      discriminator: [43, 147, 98, 222, 220, 172, 224, 225],
      accounts: [],
      args: [
        { name: "amountLamports", type: "u64" },
        { name: "choice", type: "u8" },
        { name: "clientSeed", type: { array: ["u8", 32] } }
      ]
    },
    {
      name: "settleBet",
      discriminator: [176, 75, 32, 111, 18, 86, 9, 24],
      accounts: [],
      args: []
    },
    {
      name: "claim",
      discriminator: [62, 198, 214, 193, 213, 159, 108, 210],
      accounts: [],
      args: []
    },
    {
      name: "withdrawTreasury",
      discriminator: [66, 76, 157, 169, 162, 182, 37, 99],
      accounts: [],
      args: [{ name: "lamports", type: "u64" }]
    }
  ],
  types: [
    {
      name: "house",
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "pubkey" },
          { name: "vault", type: "pubkey" },
          { name: "minBetLamports", type: "u64" },
          { name: "maxBetLamports", type: "u64" },
          { name: "treasuryBalance", type: "u64" },
          { name: "gameCount", type: "u64" },
          { name: "bump", type: "u8" },
          { name: "vaultBump", type: "u8" }
        ]
      }
    },
    {
      name: "vault",
      type: {
        kind: "struct",
        fields: [{ name: "bump", type: "u8" }]
      }
    },
    {
      name: "game",
      type: {
        kind: "struct",
        fields: [
          { name: "player", type: "pubkey" },
          { name: "randomnessAccount", type: "pubkey" },
          { name: "amountLamports", type: "u64" },
          { name: "payoutLamports", type: "u64" },
          { name: "createdSlot", type: "u64" },
          { name: "nonce", type: "u64" },
          { name: "vrfSeed", type: { array: ["u8", 32] } },
          { name: "choice", type: "u8" },
          { name: "result", type: "u8" },
          { name: "settled", type: "bool" },
          { name: "claimed", type: "bool" },
          { name: "initialized", type: "bool" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ]
};
