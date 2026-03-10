// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LootDrop {
    struct Drop {
        address creator;
        bytes16 uuid;
        string title;
        string description;
        int256 latitude;
        int256 longitude;
        uint8 rarityTier;
        uint8 assetType; // 0 = Native Token (AVAX), 1 = ERC20 (Optional extension)
        uint256 assetAmount;
        uint16 maxClaims;
        uint16 currentClaims;
        uint256 expiresAt;
        bool isActive;
    }

    mapping(bytes16 => Drop) public drops;
    mapping(bytes16 => mapping(address => bool)) public hasClaimed;

    event DropCreated(bytes16 indexed uuid, address indexed creator);
    event DropClaimed(bytes16 indexed uuid, address indexed claimer);
    event DropExpired(bytes16 indexed uuid, address indexed creator);

    function createDrop(
        bytes16 uuid,
        string calldata title,
        string calldata description,
        int256 latitude,
        int256 longitude,
        uint8 rarityTier,
        uint8 assetType,
        uint256 assetAmount,
        uint16 maxClaims,
        uint256 expiresAt
    ) external payable {
        require(!drops[uuid].isActive && drops[uuid].creator == address(0), "Drop already exists");
        require(expiresAt > block.timestamp, "Expiration must be in the future");
        require(maxClaims > 0, "Max claims must be > 0");

        if (assetType == 0) {
            require(msg.value == assetAmount, "Incorrect AVAX amount sent");
        }

        drops[uuid] = Drop({
            creator: msg.sender,
            uuid: uuid,
            title: title,
            description: description,
            latitude: latitude,
            longitude: longitude,
            rarityTier: rarityTier,
            assetType: assetType,
            assetAmount: assetAmount,
            maxClaims: maxClaims,
            currentClaims: 0,
            expiresAt: expiresAt,
            isActive: true
        });

        emit DropCreated(uuid, msg.sender);
    }

    function claimDrop(bytes16 uuid, uint32 distanceCm) external {
        Drop storage drop = drops[uuid];
        require(drop.isActive, "Drop is not active");
        require(block.timestamp <= drop.expiresAt, "Drop has expired");
        require(drop.currentClaims < drop.maxClaims, "Drop fully claimed");
        require(!hasClaimed[uuid][msg.sender], "Already claimed");
        // Implementing simple distance check, configurable via frontend mostly 
        // Or requiring distance limit
        require(distanceCm <= 10000, "Too far away from drop"); // 100m loosely

        hasClaimed[uuid][msg.sender] = true;
        drop.currentClaims++;

        uint256 rewardAmount = drop.assetAmount / drop.maxClaims;

        if (drop.assetType == 0) {
            (bool success, ) = msg.sender.call{value: rewardAmount}("");
            require(success, "Avax transfer failed");
        }

        if (drop.currentClaims == drop.maxClaims) {
            drop.isActive = false;
        }

        emit DropClaimed(uuid, msg.sender);
    }

    function expireDrop(bytes16 uuid) external {
        Drop storage drop = drops[uuid];
        require(drop.isActive, "Drop is not active");
        require(block.timestamp > drop.expiresAt || msg.sender == drop.creator, "Cannot expire yet or not creator");

        drop.isActive = false;

        uint256 remainingClaims = drop.maxClaims - drop.currentClaims;
        if (remainingClaims > 0) {
            uint256 refundAmount = (drop.assetAmount / drop.maxClaims) * remainingClaims;
            if (drop.assetType == 0) {
                (bool success, ) = drop.creator.call{value: refundAmount}("");
                require(success, "Avax refund failed");
            }
        }

        emit DropExpired(uuid, drop.creator);
    }
}
