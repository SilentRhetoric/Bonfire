# Bonfire 🔥

Bonfire is a tool for burning Algorand Standard Assets (ASA). The live web app can be found at [https://thebonfire.app](https://thebonfire.app).

The app utilizes [SolidJS](https://www.solidjs.com) for reactivity, [Vite](https://vitejs.dev) dev tooling, [Tailwind CSS](https://tailwindcss.com) styles, and [daisyUI](https://daisyui.com) components.

This work has been performed with support from the Algorand Foundation xGov Grants Program.

[![Netlify Status](https://api.netlify.com/api/v1/badges/d77b7fd3-cc08-46c6-ae0c-15fce5763f82/deploy-status)](https://app.netlify.com/sites/asa-bonfire/deploys)

## What is Bonfire?

Bonfire is an interface for burning Algorand ASAs in a permissionless, verifiable, and
standardized way per the [ARC-54](https://arc.algorand.foundation/ARCs/arc-0054) standard.

## Why is Bonfire useful?

Standardizing ASA burns enables explorers, DeFi metrics, and other tools in the ecosystem to subtract assets burned here from measures of supply.

## How to use Bonfire

The app displays a list of your ASA holdings.

1. Select the asset rows you want to burn. You can edit the amount if you want to burn less than your total holding of an asset.
2. When your wallet is open and ready to sign the transactions, click the Burn button.
3. Carefully review the transactions in your wallet before signing! Anything burned in the Bonfire cannot be recovered (unless an ASA has clawback enabled).

## When can Bonfire be used?

Anytime you want to permanently burn ASAs Bonfire can help. This could be to clear assets out of an account without sending them back to their creators. Or, if you want to remove assets from available and/or circulating supply, the Bonfire smart contract is the standard place to do so. Note that ASAs with clawback enabled can never be permanently burned.

## Who can use Bonfire?

Anyone! Bonfire is a free and open source interface for the permissionless burning smart
contract. The app runs purely on your browser client and can be installed locally in Chrome
by clicking the "Install Bonfire" button on the right side of the address bar.

## Interface design

The user interface is designed to make it easy for people to burn one or multiple ASAs. For each ASA selected, the app will prepare the necessary transactions. If the Bonfire smart contract has not yet opted into the ASA to be burned, an app call will be added to your transaction group. If the Bonfire smart contract needs additional MBR to cover the opt-in, a payment will be added to your transaction group with just enough Algos to cover the contract's MBR needs. The interface will display reductions in your account's MBR less the cost of burning and the net effect on your available Algo balance after burning.

## Smart contract design

The smart contract used for burning is documented in the [ARC-54](https://arc.algorand.foundation/ARCs/arc-0054) standard. It is an application with a single method that requests the app opt into any ASA. Anyone can call this method at any time for any ASA, and the app will opt in as long as the opt in fee is covered by the caller and the application account has sufficient Algo balance to cover the increased Minimum Balance Requirement (MBR). Note that the smart contract can also be called by other smart contracts, if desired.

The smart contract is deployed with the following IDs on each publish network:

- MainNet: 1257620981
- TestNet: 497806551
- BetaNet: 2019020358

## Pay it forward

It costs 0.1A for the smart contract to opt into each ASA. The interface displays how many extra "logs" are available for burning new assets. You can donate extra "logs" to put on the fire for 0.1A each so that the next person who needs to burn some assets can do so without needing to pay the MBR to the smart contract.
