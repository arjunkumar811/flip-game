import { db, getHouseRecord, type HouseRow } from "./db";

export interface HouseState {
  bankroll: number;
  minBet: number;
  maxBet: number;
}

export interface FlipSettlementResult {
  won: boolean;
  choice: "HEADS" | "TAILS";
  result: "HEADS" | "TAILS";
  betAmount: number;
  payout: number;
  netHouseChange: number;
  house: HouseState;
}

export class TreasuryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TreasuryError";
  }
}

/**
 * Converts integer cents to a standard decimal number rounded to 2 decimal places.
 */
function centsToUsdt(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Converts a standard decimal number to integer cents cleanly.
 */
function usdtToCents(usdt: number): number {
  return Math.round(usdt * 100);
}

export class TreasuryService {
  /**
   * Returns current House Bankroll and dynamic betting limits.
   * Formula: maxBet = houseBankroll * 0.05
   */
  public static getHouseState(): HouseState {
    const record = getHouseRecord();
    const bankroll = centsToUsdt(record.bankrollCents);
    const minBet = 1;
    const maxBet = Number((bankroll * 0.05).toFixed(2));

    return {
      bankroll,
      minBet,
      maxBet,
    };
  }

  /**
   * Validates a bet against minBet, maxBet, and house liquidity.
   * Throws TreasuryError with exact message if invalid.
   */
  public static validateBet(betAmount: number): void {
    if (isNaN(betAmount) || betAmount <= 0) {
      throw new TreasuryError("Invalid bet amount.");
    }

    const { bankroll, minBet, maxBet } = this.getHouseState();

    if (betAmount < minBet) {
      throw new TreasuryError(`Minimum bet is currently ${minBet} USDT.`);
    }

    if (betAmount > maxBet) {
      throw new TreasuryError(`Maximum bet is currently ${maxBet} USDT.`);
    }

    // Safety check: ensure house liquidity can cover the net payout (betAmount * 0.98)
    const netPayout = Number((betAmount * 0.98).toFixed(2));
    if (bankroll < netPayout) {
      throw new TreasuryError("House liquidity is temporarily insufficient.");
    }
  }

  /**
   * Executes a coin flip and settles the wager atomically inside a SQLite transaction.
   */
  public static settleFlip(
    betAmount: number,
    choice: "HEADS" | "TAILS",
    forcedOutcome?: "HEADS" | "TAILS" // Optional override for deterministic unit testing
  ): FlipSettlementResult {
    // 1. Validate bet limits and liquidity prior to transaction
    this.validateBet(betAmount);

    const settleTransaction = db.transaction(() => {
      // Re-read house record inside transaction lock to prevent race conditions
      const houseRow = getHouseRecord();
      const currentBankroll = centsToUsdt(houseRow.bankrollCents);
      const currentMaxBet = Number((currentBankroll * 0.05).toFixed(2));

      // Re-verify against race conditions inside transaction
      if (betAmount > currentMaxBet) {
        throw new TreasuryError(`Maximum bet is currently ${currentMaxBet} USDT.`);
      }

      // Determine coin outcome cryptographically (or use deterministic test override)
      let landedResult: "HEADS" | "TAILS";
      if (forcedOutcome) {
        landedResult = forcedOutcome;
      } else {
        const cryptoArray = new Uint32Array(1);
        if (typeof window !== "undefined" && window.crypto) {
          window.crypto.getRandomValues(cryptoArray);
        } else {
          // Node API crypto fallback
          const nodeCrypto = require("crypto");
          nodeCrypto.randomFillSync(cryptoArray);
        }
        landedResult = cryptoArray[0] % 2 === 0 ? "HEADS" : "TAILS";
      }

      const won = choice === landedResult;
      let payout = 0;
      let netHouseChange = 0;

      if (won) {
        // Payout multiplier: 1.98x
        payout = Number((betAmount * 1.98).toFixed(2));
        netHouseChange = Number(-(betAmount * 0.98).toFixed(2));
      } else {
        payout = 0;
        netHouseChange = Number(betAmount.toFixed(2));
      }

      const changeCents = usdtToCents(netHouseChange);
      const newBankrollCents = houseRow.bankrollCents + changeCents;

      // Final safety check inside transaction lock
      if (newBankrollCents < 0) {
        throw new TreasuryError("House liquidity is temporarily insufficient.");
      }

      // Update House record atomically
      db.prepare(`
        UPDATE House
        SET bankrollCents = ?, updatedAt = datetime('now')
        WHERE id = 1
      `).run(newBankrollCents);

      const updatedHouse: HouseState = {
        bankroll: centsToUsdt(newBankrollCents),
        minBet: 1,
        maxBet: Number((centsToUsdt(newBankrollCents) * 0.05).toFixed(2)),
      };

      return {
        won,
        choice,
        result: landedResult,
        betAmount,
        payout,
        netHouseChange,
        house: updatedHouse,
      };
    });

    return settleTransaction();
  }

  /**
   * Admin Endpoint: Deposit funds into the House Treasury.
   */
  public static deposit(amount: number): HouseState {
    if (isNaN(amount) || amount <= 0) {
      throw new TreasuryError("Deposit amount must be positive.");
    }

    const depositTransaction = db.transaction(() => {
      const houseRow = getHouseRecord();
      const newCents = houseRow.bankrollCents + usdtToCents(amount);

      db.prepare(`
        UPDATE House
        SET bankrollCents = ?, updatedAt = datetime('now')
        WHERE id = 1
      `).run(newCents);

      return {
        bankroll: centsToUsdt(newCents),
        minBet: 1,
        maxBet: Number((centsToUsdt(newCents) * 0.05).toFixed(2)),
      };
    });

    return depositTransaction();
  }

  /**
   * Admin Endpoint: Withdraw profits safely without jeopardizing existing betting limits/liquidity.
   */
  public static withdraw(amount: number): HouseState {
    if (isNaN(amount) || amount <= 0) {
      throw new TreasuryError("Withdrawal amount must be positive.");
    }

    const withdrawTransaction = db.transaction(() => {
      const houseRow = getHouseRecord();
      const currentBankroll = centsToUsdt(houseRow.bankrollCents);

      if (amount > currentBankroll) {
        throw new TreasuryError("Insufficient funds in treasury.");
      }

      const remainingBankroll = Number((currentBankroll - amount).toFixed(2));

      // Ensure remaining bankroll can still cover at least minBet * 20 (meaning maxBet >= 1 USDT)
      if (remainingBankroll < 20) {
        throw new TreasuryError(
          "Cannot withdraw: remaining bankroll would be unable to support minimum betting limits."
        );
      }

      const newCents = houseRow.bankrollCents - usdtToCents(amount);

      db.prepare(`
        UPDATE House
        SET bankrollCents = ?, updatedAt = datetime('now')
        WHERE id = 1
      `).run(newCents);

      return {
        bankroll: centsToUsdt(newCents),
        minBet: 1,
        maxBet: Number((centsToUsdt(newCents) * 0.05).toFixed(2)),
      };
    });

    return withdrawTransaction();
  }

  /**
   * Helper for testing/admin to reset bankroll to initial state (500 USDT).
   */
  public static resetTreasury(amountUsdt: number = 500): HouseState {
    db.prepare(`
      UPDATE House
      SET bankrollCents = ?, updatedAt = datetime('now')
      WHERE id = 1
    `).run(usdtToCents(amountUsdt));

    return this.getHouseState();
  }
}
