import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import "dotenv/config";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS ?? "";
const RPC_URL = process.env.AVALANCHE_FUJI_RPC_URL || process.env.EXPO_PUBLIC_AVAX_RPC_URL;
const PRIVATE_KEY = process.env.AVALANCHE_PRIVATE_KEY ?? "";

async function main() {
    console.log("Starting claim test...");

    if (!CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const artifactJson = fs.readFileSync("./artifacts/contracts/LootDrop.sol/LootDrop.json", "utf8");
    const artifact = JSON.parse(artifactJson);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

    console.log("Connected to contract at:", CONTRACT_ADDRESS);
    console.log("Claiming from wallet:", wallet.address);

    // Fetch the latest drop from Supabase
    const { data: drops, error } = await supabase
        .from("drops")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

    if (error || !drops || drops.length === 0) {
        throw new Error("Could not fetch a drop from Supabase to test claim.");
    }

    const drop = drops[0];
    const hexUuid = drop.on_chain_address; // This is the UUID required by EVM contract

    console.log(`Found Drop [${drop.title}]: ${hexUuid}`);

    const currentBlockTimestamp = Math.floor(Date.now() / 1000);
    console.log(`Current time: ${currentBlockTimestamp}, Drop Expires At: ${new Date(drop.expires_at).getTime() / 1000}`);

    // Perform contract interaction
    try {
        const distanceCm = 500; // <= 100m (10000 cm) to pass validation
        const tx = await contract.claimDrop(hexUuid, distanceCm);
        console.log(`Claim Transaction sent: ${tx.hash}`);

        await tx.wait(1);
        console.log(`✓ Drop Claimed verified on EVM!`);

        // (Optional) Mark claim in Supabase
        const { error: claimError } = await supabase.from('claims').insert({
            drop_id: drop.id,
            claimer_wallet: wallet.address,
            amount: drop.asset_amount / drop.max_claims, // rough estimate
            distance_meters: distanceCm / 100
        });

        if (claimError) {
            console.log("Info: Could not push to Supabase claims table (might have conflict or rule).", claimError.message);
        } else {
            console.log("✓ Claim marked in Supabase DB!");
        }

    } catch (e: any) {
        console.error(`Error claiming drop ${drop.title}:`, e.message || e);
    }

    console.log("Done test claim!");
}

main().catch(console.error);
