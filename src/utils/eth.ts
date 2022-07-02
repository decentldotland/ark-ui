import { useEffect, useState } from "react";
import { coinbaseWallet, hooks as coinbaseHooks } from "./connectors/coinbase";
import { metaMask, hooks as metaMaskHooks } from "./connectors/metamask";
import { walletConnect, hooks as walletConnectHooks } from "./connectors/walletconnect";
import { MetaMask } from "@web3-react/metamask";
import { CoinbaseWallet } from "@web3-react/coinbase-wallet";
import { WalletConnect } from "@web3-react/walletconnect";
import { Contract, ethers } from "ethers"
import { EVM_ORACLE_ADDRESS } from "./constants"
import ArkNetwork from "../assets/ArkNetwork.json";

export const useETH = () => {
  const coinbaseAcc = coinbaseHooks.useAccount();
  const metamaskAcc = metaMaskHooks.useAccount();
  const walletConnectAcc = walletConnectHooks.useAccount();

  const coinbaseProvider = coinbaseHooks.useProvider();
  const walletConnectProvider = walletConnectHooks.useProvider();
  const metamaskProvider = metaMaskHooks.useProvider();

  const [contract, setContract] = useState<Contract>();

  type State = {
    provider: "coinbase" | "walletconnect" | "metamask";
    address: string;
    ens?: string;
  };

  const [state, setState] = useState<State>();

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

  const connect = (connector: ETHConnector, chainId = 5) => connector.activate(chainId);

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

  useEffect(() => {
    (async () => {
      if (!state || !state.provider) return;
      let provider = getProvider();
      if (!provider) return;

      // load Ark Protocol ETH contract
      const ArkContract = new ethers.Contract(
        EVM_ORACLE_ADDRESS,
        // @ts-ignore
        ArkNetwork.abi,
        provider.getSigner().connectUnchecked()
      );

      setContract(ArkContract);

      // lookup ENS name
      const ensName = await provider.lookupAddress(state.address);

      if (ensName && state) {
        setState((val) => ({
          ...val as State,
          ens: ensName
        }));
      }
    })();
  }, [state]);

  function getProvider() {
    if (state?.provider === "coinbase") return coinbaseProvider;
    else if (state?.provider === "walletconnect") return walletConnectProvider;
    else if (state?.provider === "metamask") return metamaskProvider;
    else return undefined;
  }

  return {
    ...state,
    connect,
    disconnect,
    contract
  };
}

export type ETHConnector = MetaMask | CoinbaseWallet | WalletConnect;
