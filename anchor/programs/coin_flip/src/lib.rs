use anchor_lang::prelude::*;
use anchor_lang::solana_program::{hash::hashv, program::invoke_signed, system_instruction};

declare_id!("ReplaceWithDeployedProgramId");

const BASIS_POINTS_DENOMINATOR: u64 = 10_000;
const HOUSE_FEE_BPS: u64 = 10;

#[program]
pub mod coin_flip {
    use super::*;

    pub fn initialize_house(
        ctx: Context<InitializeHouse>,
        min_bet_lamports: u64,
        max_bet_lamports: u64,
    ) -> Result<()> {
        require!(min_bet_lamports < max_bet_lamports, CoinFlipError::InvalidBetRange);

        let house = &mut ctx.accounts.house;
        house.admin = ctx.accounts.admin.key();
        house.vault = ctx.accounts.vault.key();
        house.min_bet_lamports = min_bet_lamports;
        house.max_bet_lamports = max_bet_lamports;
        house.treasury_balance = 0;
        house.game_count = 0;
        house.bump = ctx.bumps.house;
        house.vault_bump = ctx.bumps.vault;
        ctx.accounts.vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount_lamports: u64,
        choice: u8,
        client_seed: [u8; 32],
    ) -> Result<()> {
        require!(choice <= 1, CoinFlipError::InvalidChoice);
        require!(
            amount_lamports >= ctx.accounts.house.min_bet_lamports
                && amount_lamports <= ctx.accounts.house.max_bet_lamports,
            CoinFlipError::BetOutOfRange
        );
        require!(!ctx.accounts.game.initialized, CoinFlipError::ReplayAttempt);

        let house = &mut ctx.accounts.house;
        let game = &mut ctx.accounts.game;

        let transfer_ix = system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.vault.key(),
            amount_lamports,
        );

        invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        house.game_count = house.game_count.checked_add(1).ok_or(CoinFlipError::MathOverflow)?;

        game.player = ctx.accounts.player.key();
        game.amount_lamports = amount_lamports;
        game.choice = choice;
        game.result = 255;
        game.payout_lamports = 0;
        game.vrf_seed = client_seed;
        game.randomness_account = ctx.accounts.randomness.key();
        game.settled = false;
        game.claimed = false;
        game.initialized = true;
        game.bump = ctx.bumps.game;
        game.created_slot = Clock::get()?.slot;
        game.nonce = house.game_count;

        emit!(BetPlaced {
            player: game.player,
            game: ctx.accounts.game.key(),
            amount_lamports,
            choice,
            randomness_account: game.randomness_account,
            nonce: game.nonce,
        });

        Ok(())
    }

    pub fn settle_bet(ctx: Context<SettleBet>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(!game.settled, CoinFlipError::AlreadySettled);
        require_keys_eq!(
            ctx.accounts.randomness_account.key(),
            game.randomness_account,
            CoinFlipError::InvalidRandomnessAccount
        );

        let randomness = extract_randomness(
            &ctx.accounts.randomness_account.to_account_info(),
            &game.vrf_seed,
            game.nonce,
        )?;
        let result = randomness[0] & 1;

        game.result = result;
        game.settled = true;

        if result == game.choice {
            let payout = compute_payout(game.amount_lamports)?;
            game.payout_lamports = payout;
            ctx.accounts.house.treasury_balance = ctx
                .accounts
                .house
                .treasury_balance
                .checked_add(game.amount_lamports.checked_mul(2).ok_or(CoinFlipError::MathOverflow)? - payout)
                .ok_or(CoinFlipError::MathOverflow)?;
        } else {
            ctx.accounts.house.treasury_balance = ctx
                .accounts
                .house
                .treasury_balance
                .checked_add(game.amount_lamports)
                .ok_or(CoinFlipError::MathOverflow)?;
        }

        emit!(BetSettled {
            player: game.player,
            game: ctx.accounts.game.key(),
            result,
            payout_lamports: game.payout_lamports,
        });

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.settled, CoinFlipError::GameNotSettled);
        require!(!game.claimed, CoinFlipError::AlreadyClaimed);
        require!(game.payout_lamports > 0, CoinFlipError::NoPayoutAvailable);

        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        require!(vault_balance >= game.payout_lamports, CoinFlipError::InsufficientVaultBalance);

        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= game.payout_lamports;
        **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? += game.payout_lamports;

        game.claimed = true;
        Ok(())
    }

    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, lamports: u64) -> Result<()> {
        require_keys_eq!(ctx.accounts.admin.key(), ctx.accounts.house.admin, CoinFlipError::Unauthorized);
        require!(ctx.accounts.house.treasury_balance >= lamports, CoinFlipError::InsufficientTreasuryBalance);
        require!(ctx.accounts.vault.to_account_info().lamports() >= lamports, CoinFlipError::InsufficientVaultBalance);

        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= lamports;
        **ctx.accounts.admin.to_account_info().try_borrow_mut_lamports()? += lamports;
        ctx.accounts.house.treasury_balance = ctx
            .accounts
            .house
            .treasury_balance
            .checked_sub(lamports)
            .ok_or(CoinFlipError::MathOverflow)?;

        Ok(())
    }
}

fn compute_payout(amount_lamports: u64) -> Result<u64> {
    amount_lamports
        .checked_mul(2)
        .ok_or(CoinFlipError::MathOverflow)?
        .checked_mul(BASIS_POINTS_DENOMINATOR - HOUSE_FEE_BPS)
        .ok_or(CoinFlipError::MathOverflow)?
        .checked_div(BASIS_POINTS_DENOMINATOR)
        .ok_or(CoinFlipError::MathOverflow.into())
}

fn extract_randomness(account: &AccountInfo, seed: &[u8; 32], nonce: u64) -> Result<[u8; 32]> {
    let data = account.try_borrow_data()?;
    require!(data.len() >= 32, CoinFlipError::InvalidRandomnessAccount);

    let digest = hashv(&[&data, seed, &nonce.to_le_bytes()]);
    Ok(digest.to_bytes())
}

#[derive(Accounts)]
pub struct InitializeHouse<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + House::INIT_SPACE,
        seeds = [b"house"],
        bump
    )]
    pub house: Account<'info, House>,
    #[account(
        init,
        payer = admin,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_amount_lamports: u64, _choice: u8, client_seed: [u8; 32])]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [b"house"], bump = house.bump)]
    pub house: Account<'info, House>,
    #[account(mut, seeds = [b"vault"], bump = house.vault_bump)]
    pub vault: Account<'info, Vault>,
    #[account(
        init,
        payer = player,
        space = 8 + Game::INIT_SPACE,
        seeds = [b"game", player.key().as_ref(), &client_seed],
        bump
    )]
    pub game: Account<'info, Game>,
    /// CHECK: VRF provider-specific randomness account verified during settlement.
    pub randomness: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleBet<'info> {
    #[account(mut, seeds = [b"house"], bump = house.bump)]
    pub house: Account<'info, House>,
    #[account(mut, has_one = player, has_one = randomness_account)]
    pub game: Account<'info, Game>,
    /// CHECK: keeper passes the VRF fulfillment account here.
    pub randomness_account: UncheckedAccount<'info>,
    /// CHECK: used only for account relation.
    pub player: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(seeds = [b"house"], bump = house.bump)]
    pub house: Account<'info, House>,
    #[account(mut, seeds = [b"vault"], bump = house.vault_bump)]
    pub vault: Account<'info, Vault>,
    #[account(mut, has_one = player)]
    pub game: Account<'info, Game>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, seeds = [b"house"], bump = house.bump)]
    pub house: Account<'info, House>,
    #[account(mut, seeds = [b"vault"], bump = house.vault_bump)]
    pub vault: Account<'info, Vault>,
}

#[account]
#[derive(InitSpace)]
pub struct House {
    pub admin: Pubkey,
    pub vault: Pubkey,
    pub min_bet_lamports: u64,
    pub max_bet_lamports: u64,
    pub treasury_balance: u64,
    pub game_count: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Game {
    pub player: Pubkey,
    pub randomness_account: Pubkey,
    pub amount_lamports: u64,
    pub payout_lamports: u64,
    pub created_slot: u64,
    pub nonce: u64,
    pub vrf_seed: [u8; 32],
    pub choice: u8,
    pub result: u8,
    pub settled: bool,
    pub claimed: bool,
    pub initialized: bool,
    pub bump: u8,
}

#[event]
pub struct BetPlaced {
    pub player: Pubkey,
    pub game: Pubkey,
    pub amount_lamports: u64,
    pub choice: u8,
    pub randomness_account: Pubkey,
    pub nonce: u64,
}

#[event]
pub struct BetSettled {
    pub player: Pubkey,
    pub game: Pubkey,
    pub result: u8,
    pub payout_lamports: u64,
}

#[error_code]
pub enum CoinFlipError {
    #[msg("Invalid choice.")]
    InvalidChoice,
    #[msg("Bet amount outside allowed range.")]
    BetOutOfRange,
    #[msg("Math overflow.")]
    MathOverflow,
    #[msg("Game already settled.")]
    AlreadySettled,
    #[msg("Game is not settled yet.")]
    GameNotSettled,
    #[msg("No payout available.")]
    NoPayoutAvailable,
    #[msg("Replay attempt detected.")]
    ReplayAttempt,
    #[msg("Payout already claimed.")]
    AlreadyClaimed,
    #[msg("Unauthorized action.")]
    Unauthorized,
    #[msg("Vault balance is insufficient.")]
    InsufficientVaultBalance,
    #[msg("Treasury balance is insufficient.")]
    InsufficientTreasuryBalance,
    #[msg("Invalid randomness account.")]
    InvalidRandomnessAccount,
    #[msg("Invalid bet range.")]
    InvalidBetRange,
}
