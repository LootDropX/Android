/**
 * Seed script — sweeps existing drops and creates 58 realistic drops on Avalanche Devnet + Supabase 
 * for real-life crypto events happening till the end of 2026.
 *
 * Usage:
 *   export $(cat .env | grep -v '^#' | xargs) && npx ts-node scripts/seed-real-events.ts
 */


import { createClient } from '@supabase/supabase-js';

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

function encodeGeohash(lat: number, lng: number, precision = 7): string {
    let idx = 0, bit = 0;
    let evenBit = true;
    let geohash = '';
    let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;

    while (geohash.length < precision) {
        if (evenBit) {
            const mid = (lngMin + lngMax) / 2;
            if (lng >= mid) { idx = idx * 2 + 1; lngMin = mid; }
            else { idx = idx * 2; lngMax = mid; }
        } else {
            const mid = (latMin + latMax) / 2;
            if (lat >= mid) { idx = idx * 2 + 1; latMin = mid; }
            else { idx = idx * 2; latMax = mid; }
        }
        evenBit = !evenBit;
        if (++bit === 5) { geohash += BASE32[idx]; bit = 0; idx = 0; }
    }
    return geohash;
}

function generateRandomOffset(baseCoord: number, maxOffset = 0.005): number {
    const sign = Math.random() > 0.5 ? 1 : -1;
    return baseCoord + (Math.random() * maxOffset * sign);
}

// ── Events ───────────────────────────────────────────────────────────────────
// Base real-world events in 2026
const BASE_EVENTS = [
    { name: 'ETHDenver 2026', lat: 39.7744, lng: -104.9782, end: '2026-03-31T23:59:59Z' },
    { name: 'Paris Blockchain Week', lat: 48.8415, lng: 2.3488, end: '2026-04-15T23:59:59Z' },
    { name: 'Token2049 Dubai', lat: 25.1328, lng: 55.1843, end: '2026-04-30T23:59:59Z' },
    { name: 'Consensus Austin', lat: 30.2644, lng: -97.7397, end: '2026-05-31T23:59:59Z' },
    { name: 'NFC Lisbon', lat: 38.7223, lng: -9.1393, end: '2026-06-15T23:59:59Z' },
    { name: 'Bitcoin 2026 Nashville', lat: 36.1627, lng: -86.7816, end: '2026-07-31T23:59:59Z' },
    { name: 'ETHCC Paris', lat: 48.8415, lng: 2.3488, end: '2026-07-25T23:59:59Z' },
    { name: 'Korea Blockchain Week', lat: 37.5112, lng: 127.0628, end: '2026-09-10T23:59:59Z' },
    { name: 'Token2049 Singapore', lat: 1.2838, lng: 103.8591, end: '2026-09-20T23:59:59Z' },
    { name: 'Avalanche Breakpoint', lat: 1.2935, lng: 103.8572, end: '2026-09-25T23:59:59Z' },
    { name: 'Devcon Bangkok', lat: 13.7251, lng: 100.5599, end: '2026-11-15T23:59:59Z' },
    { name: 'Art Basel Miami', lat: 25.7906, lng: -80.1300, end: '2026-12-10T23:59:59Z' },
];

const NEW_DROPS: any[] = [];
for (let i = 0; i < 58; i++) {
    const base = BASE_EVENTS[i % BASE_EVENTS.length];

    // Vary rarity from 0 to 3
    const rarity = i % 4; // 0=Common, 1=Rare, 2=Epic, 3=Legendary
    let sol = 0.01;
    switch (rarity) {
        case 0: sol = 0.005; break;
        case 1: sol = 0.05; break;
        case 2: sol = 0.25; break;
        case 3: sol = 1.0; break;
    }

    // Set assets: mix of AVAX (0) and SPL_TOKEN (1)
    const assetType = i % 3 === 0 ? 1 : 0; // Every 3rd is SPL_TOKEN for tests

    // Mint address (we can use dummy ones or real devnet USDC) for SPL_TOKENS
    let mintAddress = null;
    if (assetType === 1) {
        // Alternate between USDC and $SKR devnet dummy mints
        mintAddress = i % 2 === 0 ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' : 'SKR1111111111111111111111111111111111111111';
        sol = rarity === 3 ? 100 : (rarity + 1) * 10; // larger numbers for tokens
    }

    NEW_DROPS.push({
        title: `${base.name}${i >= BASE_EVENTS.length ? ` - Zone ${Math.floor(i / BASE_EVENTS.length) + 1}` : ''}`,
        rarity,
        assetType,
        sol,
        mintAddress,
        lat: generateRandomOffset(base.lat, 0.01),
        lng: generateRandomOffset(base.lng, 0.01),
        expiresAt: base.end,
    });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Clean sweep existing drops
    console.log('Sweeping existing drops...');
    const { error: deleteError } = await supabase
        .from('drops')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
        console.error('Failed to sweep existing drops:', deleteError.message);
        return;
    }
    console.log('✓ Successfully cleared existing drops.');

    // 2. Seed 58 new drops
    console.log(`Seeding ${NEW_DROPS.length} drops for 2026 events...`);

    for (const drop of NEW_DROPS) {
        const geohash = encodeGeohash(drop.lat, drop.lng, 7);
        const lamports = drop.assetType === 0 ? Math.round(drop.avax * 1e9) : drop.avax; // Tokens used as raw amount for demo

        const { error } = await supabase.from('drops').insert({
            on_chain_address: `SEED_${Math.random().toString(36).slice(2)}`,
            creator_wallet: 'SeedScript11111111111111111111111111111111',
            title: drop.title,
            description: `A ${['Common', 'Rare', 'Epic', 'Legendary'][drop.rarity]} loot drop for ${drop.title}. Valid until the end of the event.`,
            location: `POINT(${drop.lng} ${drop.lat})`,
            geohash,
            rarity_tier: drop.rarity,
            asset_type: drop.assetType,
            asset_amount: lamports,
            mint_address: drop.mintAddress,
            max_claims: drop.rarity === 3 ? 1 : 10,
            expires_at: drop.expiresAt,
        });

        if (error) {
            console.error(`Failed to seed "${drop.title}":`, error.message);
        } else {
            console.log(`✓ Seeded: ${drop.title} (${['Common', 'Rare', 'Epic', 'Legendary'][drop.rarity]})`);
        }
    }

    console.log('Done!');
}

main().catch(console.error);
