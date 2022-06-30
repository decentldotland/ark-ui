import { useEffect, useState } from "react";
import { coinbaseWallet, hooks as coinbaseHooks } from "./connectors/coinbase";
import { metaMask, hooks as metaMaskHooks } from "./connectors/metamask";
import { walletConnect, hooks as walletConnectHooks } from "./connectors/walletconnect";
import { MetaMask } from "@web3-react/metamask";
import { CoinbaseWallet } from "@web3-react/coinbase-wallet";
import { WalletConnect } from "@web3-react/walletconnect";

export const useETH = () => {
  const coinbaseAcc = coinbaseHooks.useAccount();
  const metamaskAcc = metaMaskHooks.useAccount();
  const walletConnectAcc = walletConnectHooks.useAccount();

  const [state, setState] = useState<{
    provider: "coinbase" | "walletconnect" | "metamask";
    address: string;
  }>();

  useEffect(() => {
    coinbaseWallet.connectEagerly().catch();
    walletConnect.connectEagerly().catch();
    metaMask.connectEagerly().catch();
  }, []);

  useEffect(() => {
    if (coinbaseAcc) setState({ provider: "coinbase", address: coinbaseAcc });
    else if (walletConnectAcc) setState({ provider: "walletconnect", address: walletConnectAcc });
    else if (metamaskAcc) setState({ provider: "metamask", address: metamaskAcc });
  }, [coinbaseAcc, metamaskAcc, walletConnectAcc]);

  const connect = (connector: ETHConnector) => connector.activate(1);

  return {
    ...state,
    connect
  };
}

export type ETHConnector = MetaMask | CoinbaseWallet | WalletConnect;
