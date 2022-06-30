import { CoinbaseWallet } from "@web3-react/coinbase-wallet"
import { initializeConnector } from "@web3-react/core"

export const [coinbaseWallet, hooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: "https://rpc.goerli.mudit.blog/",
        appName: "Ark Protocol"
      },
    })
);
