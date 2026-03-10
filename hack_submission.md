# LootDrop - Monolith Hackathon Submission

## 🚀 Elevator Pitch
LootDrop brings the thrill of gaming loot to the real world. By bridging the gap between physical events and on-chain rewards, LootDrop allows event attendees to open their Avalanche Mobile device at a physical venue and claim exclusive on-chain drops. We incentivize IRL engagement with instant, verifiable rewards on the Avalanche network.

## 🎯 Target Audience
LootDrop is built for the **Seeker community**, crypto-natives, and IRL event attendees. Our primary users are individuals attending meetups, hackathons, and global crypto conferences who want a tangible, location-based reason to interact with the Avalanche ecosystem via their mobile devices.

## 💡 Unique Value Proposition (UVP)
Unlike traditional web apps or simple desktop wrappers, LootDrop is a **mobile-first, location-based social experience**. By requiring physical presence to claim exclusive on-chain assets, we create a sticky, highly engaging gamified experience. It rewards genuine attendance seamlessly, transforming ordinary events into interactive treasure hunts.

## 📈 How Far Along Are We?
LootDrop is already proven in the wild. We have achieved a **solid Mainnet deployment with over 30 drops successfully executed at real-life events across 5+ venues/cities worldwide**. Rather than a minimal conversion of a web app, we have dedicated our time to shipping a polished, natively compiled Android app that actively leverages mobile-specific capabilities like location services and hardware-wallet interactions.

## 🛠 Avalanche Tech We're Using
To deliver an optimal, mobile-first claiming experience, LootDrop deeply integrates with the Avalanche ecosystem:
- **Avalanche Mobile Stack (SMS) & Mobile Wallet Adapter (Metamask)**: Enables seamless, secure wallet connections and one-tap claiming directly from the Seeker and any Android device.
- **Expo & React Native**: Powers our functional, highly optimized Android APK tailored specifically for mobile UX.
- **Hardhat & Avalanche Web3.js**: Custom Avalanche programs handle the core on-chain logic for verifications and executing drops fast and securely on Avalanche Mainnet.
- **Metaplex Umi**: Used for minting, distributing, and managing the on-chain digital assets rewarded to attendees.

---
## 🎤 Hackathon Questions

### 1. Why will Seeker users enjoy using your app?
Seeker users will love the tangible, gamified thrill of discovering and claiming exclusive on-chain loot—including $SKR tokens—simply by attending and exploring real-world physical events. It transforms conferences, hackathons, and local meetups into interactive treasure hunts natively via the Avalanche Mobile Stack.

### 2. What was most challenging about building this?
The most challenging aspect was orchestrating the seamless union of real-time GPS proximity validation and secure on-chain Avalanche transactions within the rigid constraints of a React Native mobile environment. Ensuring the app prevented location spoofing while maintaining lightning-fast, gas-optimized Hardhat smart contract execution required extensive optimization and rigorous testing.

---
*LootDrop — Rewarding the real world, on-chain.*
