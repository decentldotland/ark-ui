import { CoinbaseWallet } from "@web3-react/coinbase-wallet"
import { initializeConnector } from "@web3-react/core"
import { RCP } from "../constants"

export const [coinbaseWallet, hooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: RCP,
        appName: "Ark Protocol"
      },
    })
);
