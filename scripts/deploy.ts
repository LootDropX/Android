import { ethers } from "ethers";
import fs from "fs";
import "dotenv/config";

async function main() {
    console.log("Starting deployment...");
    const rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL || process.env.EXPO_PUBLIC_AVAX_RPC_URL;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.AVALANCHE_PRIVATE_KEY as string, provider);

    console.log(`Deploying from account: ${wallet.address}`);

    const artifactJson = fs.readFileSync("./artifacts/contracts/LootDrop.sol/LootDrop.json", "utf8");
    const artifact = JSON.parse(artifactJson);

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`LootDrop deployed to: ${address}`);

    console.log("Waiting for network to confirm...");
    const tx = contract.deploymentTransaction();
    if (tx) {
        await tx.wait(2);
    }
    console.log("Finished!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
