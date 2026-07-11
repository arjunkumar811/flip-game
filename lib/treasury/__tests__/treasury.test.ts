import { describe, it, expect, beforeEach } from "vitest";
import { TreasuryService, TreasuryError } from "../service";

describe("House Treasury (Bankroll Management) System", () => {
  beforeEach(() => {
    // Reset bankroll to initial 500 USDT before each test
    TreasuryService.resetTreasury(500);
  });

  describe("Initial Treasury & Dynamic Limits", () => {
    it("should start with houseBankroll = 500 USDT and maxBet = 25 USDT", () => {
      const state = TreasuryService.getHouseState();
      expect(state.bankroll).toBe(500);
      expect(state.minBet).toBe(1);
      expect(state.maxBet).toBe(25);
    });

    it("should calculate maxBet dynamically as 5% of bankroll", () => {
      TreasuryService.resetTreasury(1000);
      let state = TreasuryService.getHouseState();
      expect(state.bankroll).toBe(1000);
      expect(state.maxBet).toBe(50);

      TreasuryService.resetTreasury(5000);
      state = TreasuryService.getHouseState();
      expect(state.bankroll).toBe(5000);
      expect(state.maxBet).toBe(250);
    });
  });

  describe("Betting Logic & Validation", () => {
    it("should accept valid bets within minBet and maxBet limits", () => {
      expect(() => TreasuryService.validateBet(1)).not.toThrow();
      expect(() => TreasuryService.validateBet(10)).not.toThrow();
      expect(() => TreasuryService.validateBet(25)).not.toThrow();
    });

    it("should reject bets below minBet (1 USDT)", () => {
      expect(() => TreasuryService.validateBet(0.5)).toThrowError(
        new TreasuryError("Minimum bet is currently 1 USDT.")
      );
    });

    it("should reject bets above current maxBet", () => {
      expect(() => TreasuryService.validateBet(26)).toThrowError(
        new TreasuryError("Maximum bet is currently 25 USDT.")
      );
    });
  });

  describe("Coin Flip Settlement Math", () => {
    it("should settle a WIN with 1.98x multiplier and reduce houseBankroll by (bet * 0.98)", () => {
      // Bet = 25, Player wins -> Payout = 49.5, House change = -24.5 -> New Bankroll = 475.50
      const result = TreasuryService.settleFlip(25, "HEADS", "HEADS");
      expect(result.won).toBe(true);
      expect(result.payout).toBe(49.5);
      expect(result.netHouseChange).toBe(-24.5);
      expect(result.house.bankroll).toBe(475.5);
      expect(result.house.maxBet).toBe(23.78); // 475.5 * 0.05
    });

    it("should settle a LOSS and increase houseBankroll by bet amount", () => {
      // Bet = 25, Player loses -> Payout = 0, House change = +25 -> New Bankroll = 525.00
      const result = TreasuryService.settleFlip(25, "HEADS", "TAILS");
      expect(result.won).toBe(false);
      expect(result.payout).toBe(0);
      expect(result.netHouseChange).toBe(25);
      expect(result.house.bankroll).toBe(525);
      expect(result.house.maxBet).toBe(26.25); // 525 * 0.05
    });
  });

  describe("Admin Deposit & Withdraw Endpoints", () => {
    it("should deposit funds and dynamically increase maxBet", () => {
      const updated = TreasuryService.deposit(500); // 500 + 500 = 1000
      expect(updated.bankroll).toBe(1000);
      expect(updated.maxBet).toBe(50);
    });

    it("should safely withdraw profits when liquidity allows", () => {
      TreasuryService.deposit(500); // Now 1000
      const updated = TreasuryService.withdraw(200);
      expect(updated.bankroll).toBe(800);
      expect(updated.maxBet).toBe(40);
    });
  });
});
