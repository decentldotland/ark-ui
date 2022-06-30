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
    tryConnection([coinbaseWallet, walletConnect, metaMask]);
  }, []);

  async function tryConnection(connectors: ETHConnector[]) {
    for (const connector of connectors) {
      try {
        await connector.connectEagerly();
      } catch {}
    }
  }

  useEffect(() => {
    if (coinbaseAcc) setState({ provider: "coinbase", address: coinbaseAcc });
    else if (walletConnectAcc) setState({ provider: "walletconnect", address: walletConnectAcc });
    else if (metamaskAcc) setState({ provider: "metamask", address: metamaskAcc });
  }, [coinbaseAcc, metamaskAcc, walletConnectAcc]);

  const connect = (connector: ETHConnector) => connector.activate(5);

  async function disconnect() {
    if (!state) return;

    if (state.provider === "coinbase") tryDisconnect(coinbaseWallet);
    else if (state.provider === "walletconnect") tryDisconnect(walletConnect);
    else if (state.provider === "metamask") tryDisconnect(metaMask);
  }

  async function tryDisconnect(connector: ETHConnector) {
    if (connector?.deactivate) {
      await connector.deactivate()
    } else {
      await connector.resetState()
    }

    setState(undefined);
  }

  return {
    ...state,
    connect,
    disconnect
  };
}

export type ETHConnector = MetaMask | CoinbaseWallet | WalletConnect;
