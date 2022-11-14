import { CoinbaseWallet } from "@web3-react/coinbase-wallet"
import { initializeConnector } from "@web3-react/core"
import { URLS } from "../constants"

export const [coinbaseWallet, hooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: URLS[1][0],
        appName: "Ark Protocol"
      },
    })
);
