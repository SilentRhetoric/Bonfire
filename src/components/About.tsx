import { BONFIRE_APP_IDS } from "../lib/useBonfire"

export default function About() {
  return (
    <div class="prose">
      <h2>About Bonfire</h2>
      <h3>What is Bonfire?</h3>
      <p>
        Bonfire is an interface for burning Algorand Standard Assets (ASA) in a permissionless,
        verifiable, and standardized way per the{" "}
        <a
          href="https://arc.algorand.foundation/ARCs/arc-0054"
          target="_blank"
          aria-label="ARC-54"
        >
          ARC-54
        </a>{" "}
        standard.
      </p>
      <h3>Why is Bonfire useful?</h3>
      <p>
        Standardizing ASA burns enables explorers, DeFi metrics, and other tools in the ecosystem to
        subtract assets burned here from measures of supply.
      </p>
      <h3>How to use Bonfire</h3>
      <p>
        The app displays a list of your ASA holdings that can be burned and are not frozen in your
        account.
      </p>
      <ol>
        <li>
          Select the asset rows you want to burn. You can edit the amount if you want to burn less
          than your total holding of an asset.
        </li>
        <li>When your wallet is open and ready to sign the transactions, click the Burn button.</li>
        <li>
          Carefully review the transactions in your wallet before signing! Anything burned in the
          Bonfire cannot be recovered (unless an ASA has clawback enabled).
        </li>
      </ol>
      <h3>When can Bonfire be used?</h3>
      <p>
        Anytime you want to permanently burn ASAs Bonfire can help. This could be to clear assets
        out of an account without sending them back to their creators. Or, if you want to remove
        assets from available and/or circulating supply (provided they do not have clawback
        enabled), the Bonfire smart contract is the standard place to do so. Note that ASAs with
        clawback enabled can never be permanently burned.
      </p>
      <h3>Who can use Bonfire?</h3>
      <p>
        Anyone! Bonfire is a free and open source interface for the permissionless burning smart
        contract. The app runs purely on your browser client and can be installed locally in Chrome
        by clicking the "Install Bonfire" button on the right side of the address bar.
      </p>
      <h3>Interface design</h3>
      <p>
        The user interface is designed to make it easy for people to burn one or multiple ASAs. For
        each ASA selected, the app will prepare the necessary transactions. If the Bonfire smart
        contract has not yet opted into the ASA to be burned, an app call will be added to your
        transaction group. If the Bonfire smart contract needs additional MBR to cover the opt-in, a
        payment will be added to your transaction group with just enough Algos to cover the
        contract's MBR needs. The interface will display reductions in your account's MBR less the
        cost of burning and the net effect on your available Algo balance after burning.
      </p>
      <h3>Smart contract design</h3>
      <p>
        The smart contract used for burning is documented in the{" "}
        <a
          href="https://arc.algorand.foundation/ARCs/arc-0054"
          target="_blank"
          aria-label="ARC-54"
        >
          ARC-54
        </a>{" "}
        standard. It is an application with a single method that requests the app opt into any ASA.
        Anyone can call this method at any time for any ASA, and the app will opt in as long as the
        opt in fee is covered by the caller and the application account has sufficient Algo balance
        to cover the increased Minimum Balance Requirement (MBR) required to hold the ASA. Note that
        the smart contract can also be called by other smart contracts, if desired.
      </p>
      <p>The smart contract is deployed with the following IDs on each public network:</p>
      <li>MainNet: {BONFIRE_APP_IDS.MainNet}</li>
      <li>TestNet: {BONFIRE_APP_IDS.TestNet}</li>
      <li>BetaNet: {BONFIRE_APP_IDS.BetaNet}</li>
      <h3>Pay it forward</h3>
      <p>
        It costs 0.1A for the smart contract to opt into each ASA. The interface displays how many
        extra "logs" are available for burning new assets. You can donate extra "logs" to put on the
        fire for 0.1A each so that the next person who needs to burn some assets can do so without
        needing to pay the MBR to the smart contract.
      </p>
      <h3>Disclaimer</h3>
      <p>
        Use at your own risk. Always verify in your wallet that each transaction is what you
        expected before signing. Once assets are sent to the smart contract, they can never be
        recovered unless they have clawback enabled. This software is provided under MIT license,
        and the source code is available through the GitHub link in the page footer.
      </p>
      <h3>App Info</h3>
      <p>Version 1.0</p>
    </div>
  )
}
