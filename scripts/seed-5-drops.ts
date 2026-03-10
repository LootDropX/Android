import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import "dotenv/config";
import crypto from "crypto";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS ?? "";
const RPC_URL = process.env.AVALANCHE_FUJI_RPC_URL || process.env.EXPO_PUBLIC_AVAX_RPC_URL;
const PRIVATE_KEY = process.env.AVALANCHE_PRIVATE_KEY ?? "";

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function encodeGeohash(lat: number, lng: number, precision = 7): string {
    let idx = 0, bit = 0;
    let evenBit = true;
    let geohash = "";
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

const EVENTS = [
    { name: "Demo Avalanche Claim Test", lat: 37.77490, lng: -122.41942, sol: 0.0005 }, // Micro-AVAX Drop
];

async function main() {
    console.log("Starting seeding process...");

    if (!CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const artifactJson = fs.readFileSync("./artifacts/contracts/LootDrop.sol/LootDrop.json", "utf8");
    const artifact = JSON.parse(artifactJson);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

    console.log("Connected to contract at:", CONTRACT_ADDRESS);
    console.log("Connected wallet:", wallet.address);

    // Clear existing data for fresh seed if desired
    /*
    const { error: deleteError } = await supabase.from('drops').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) console.error("Could not clean old table data", deleteError);
    */

    for (let i = 0; i < EVENTS.length; i++) {
        const ev = EVENTS[i];

        // Generate true v4 UUID and stringify for the bytes16
        const uuidStr = crypto.randomUUID();
        const hexUuid = "0x" + uuidStr.replace(/-/g, ""); // Standard bytes16 formatting

        const title = ev.name;
        const description = `This is a drop for ${ev.name}`;
        const latInt = Math.round(ev.lat * 1000000);
        const lngInt = Math.round(ev.lng * 1000000);
        const rarityItem = i % 4;
        const assetType = 0; // AVAX
        const assetAmount = ethers.parseEther(ev.sol.toString()); // Parsing as AVAX (18 decimals)
        const maxClaims = rarityItem === 3 ? 1 : 10;

        // expiry 3 days from now
        const expiresAtDate = new Date();
        expiresAtDate.setHours(expiresAtDate.getHours() + 72);
        const expiresAt = Math.floor(expiresAtDate.getTime() / 1000);

        console.log(`Creating drop [${i + 1}/${EVENTS.length}]: ${title} with ${ev.sol} AVAX`);

        try {
            const tx = await contract.createDrop(
                hexUuid,
                title,
                description,
                latInt,
                lngInt,
                rarityItem,
                assetType,
                assetAmount,
                maxClaims,
                expiresAt,
                { value: assetAmount } // sending AVAX
            );
            console.log(`Transaction sent: ${tx.hash}`);
            await tx.wait(1);
            console.log(`Drop verified on EVM.`);

            const geohash = encodeGeohash(ev.lat, ev.lng, 7);

            const { error } = await supabase.from("drops").insert({
                id: uuidStr, // some schemas use a uuid primary key `id`
                on_chain_address: hexUuid, // or store hex block representation
                creator_wallet: wallet.address,
                title,
                description,
                location: `POINT(${ev.lng} ${ev.lat})`,
                geohash,
                rarity_tier: rarityItem,
                asset_type: assetType,
                asset_amount: assetAmount.toString(), // BigInt to string for Supabase bigint handling
                max_claims: maxClaims,
                expires_at: expiresAtDate.toISOString(),
            });

            if (error) {
                console.error(`Failed to push ${title} to Supabase: `, error.message);
            } else {
                console.log(`✓ Seeded ${title} successfully in DB!`);
            }

        } catch (e: any) {
            console.error(`Error processing drop ${title}:`, e.message || e);
        }
    }

    console.log("Done seeding drops!");
}

main().catch(console.error);
