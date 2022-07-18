import { useEffect, useState } from "react";
import { coinbaseWallet, hooks as coinbaseHooks } from "./connectors/coinbase";
import { metaMask, hooks as metaMaskHooks } from "./connectors/metamask";
import { walletConnect, hooks as walletConnectHooks } from "./connectors/walletconnect";
import { MetaMask } from "@web3-react/metamask";
import { CoinbaseWallet } from "@web3-react/coinbase-wallet";
import { WalletConnect } from "@web3-react/walletconnect";
import { Contract, ethers } from "ethers"
import { EVM_ORACLES, NETWORKS } from "./constants"
import ArkNetwork from "../assets/ArkNetwork.json";

export const useETH = (setActiveConnector: (arg: ETHConnector) => void, activeNetwork: number) => {
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
  const [chain, setChain] = useState<number>();

  useEffect(() => {
    if (chain !== undefined || localStorage.getItem('isDisconnected') === 'true') return;
    tryConnection(coinbaseWallet, walletConnect, metaMask);
  }, [coinbaseProvider, walletConnectProvider, metamaskProvider]);

  async function tryConnection(...connectors: ETHConnector[]) {
    for (const connector of connectors) {
      try {
        await connector.connectEagerly();
        const provider = getProvider()?.provider;
        if (provider && provider.request) {
          if (!activeNetwork) return;
          const chainId = await provider.request({ method: "eth_chainId" });
          const name = NETWORKS[activeNetwork]?.name;
          const rpcUrls = NETWORKS[activeNetwork]?.urls;
          try {
            if (activeNetwork !== 1 && activeNetwork !== 5) {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainName: name,
                  chainId: `0x${activeNetwork.toString(16)}`,
                  rpcUrls: rpcUrls,
                }],
              });
            };  
          } catch (e) {
            console.log(e);
          }
          if (chainId) {
            setChain(parseInt(chainId, 16));
            await connect(connector, parseInt(chainId, 16));
            setActiveConnector(connector);
          }
        }
      } catch {}
    }
  }

  useEffect(() => {
    if (localStorage.getItem('isConnected') === 'false') return;
    if (coinbaseAcc) setState({ provider: "coinbase", address: coinbaseAcc });
    else if (walletConnectAcc) setState({ provider: "walletconnect", address: walletConnectAcc });
    else if (metamaskAcc) setState({ provider: "metamask", address: metamaskAcc });
  }, [coinbaseAcc, metamaskAcc, walletConnectAcc]);

  const connect = async (connector: ETHConnector, chainId = 5) => {
    localStorage.setItem('isConnected', 'true');
    await connector.activate(chainId);
    setChain(chainId);
    localStorage.setItem('isDisconnected', 'false');
  }

  async function disconnect() {
    if (!state) return;
    localStorage.setItem('isDisconnected', 'true');

    if (state.provider === "coinbase") tryDisconnect(coinbaseWallet);
    else if (state.provider === "walletconnect") tryDisconnect(walletConnect);
    else if (state.provider === "metamask") tryDisconnect(metaMask);
  }

  async function tryDisconnect(connector: ETHConnector) {
    localStorage.setItem('isConnected', 'false');
    if (connector?.deactivate) {
      await connector.deactivate()
    } else {
      await connector.resetState()
    }

    setState(undefined);
  }

  useEffect(() => {
    (async () => {
      if (!state || !state.provider || !chain) return;
      let provider = getProvider();
      if (!provider) return;

      // load Ark Protocol ETH contract
      const ArkContract = new ethers.Contract(
        EVM_ORACLES[chain],
        // @ts-ignore
        ArkNetwork.abi,
        provider.getSigner().connectUnchecked()
      );

      setContract(ArkContract);

      try {
        // lookup ENS name
        const ensName = await provider.lookupAddress(state.address);

        if (ensName && state) {
          setState((val) => ({
            ...val as State,
            ens: ensName
          }));
        }
      } catch {}
    })();
  }, [state, chain]);

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
    contract,
    getProvider
  };
}

export type ETHConnector = MetaMask | CoinbaseWallet | WalletConnect;

export async function addChain(connector: ETHConnector, chainId: number, network: any) {
  if (!connector.provider) throw new Error("No provider");
  await connector.provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: "0x" + chainId.toString(16),
        chainName: network?.name,
        // nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        rpcUrls: network?.rpcUrls,
      }
    ],
  });

}

export async function addHarmony(connector: ETHConnector) {
  if (!connector.provider) throw new Error("No provider");
  const shardId = 0;
  await connector.provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: "0x" + Number(1666700000 + shardId).toString(16),
        chainName: "Harmony Testnet Shard " + shardId,
        nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        rpcUrls: [`https://api.s${shardId}.b.hmny.io`],
        blockExplorerUrls: ["https://explorer.pops.one/"],
      }
    ],
  });
}
