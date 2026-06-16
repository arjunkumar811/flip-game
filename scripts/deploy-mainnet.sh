#!/usr/bin/env bash
set -euo pipefail

export ANCHOR_PROVIDER_URL="${ANCHOR_PROVIDER_URL:-https://api.mainnet-beta.solana.com}"
export NEXT_PUBLIC_SOLANA_RPC_URL="${NEXT_PUBLIC_SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"

anchor build
anchor deploy
npx prisma migrate deploy
npx next build
