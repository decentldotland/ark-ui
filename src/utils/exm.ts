import { NETWORKS, chainNames, chainTickers } from "./constants";

function getChainIdByNetworkKey(networkKey: string) {
  for (let key in NETWORKS) {
    if (NETWORKS[key].networkKey === networkKey) {
      return key;
    }
  }
  return null;
}

/**
Transforms an array of network strings into an object containing network information.
@param {string[]} networks - An array of strings representing networks.
@returns {Object} An object containing network information, with each key corresponding to a network string in the input array.
*/
export function EXMHandleNetworks(networks: string[]) {

  const networkObject = {};

  networks.filter((n) => !(n.includes("DEVNET") || n.includes("TESTNET") || n.includes("FUJI") || n.includes("GOERLI")))
  .map((n) => {
    //@ts-ignore
    networkObject[n] = {
      ark_key: n,
      // @ts-ignore
      name: chainNames[n] ? chainNames[n] : n[0] + (n.slice(1).split('-')[0].toLowerCase()),
      // @ts-ignore
      ticker: chainTickers[n],
      iconURL: '/' + n.split('-')[0].toLowerCase() + '.png', // this will hit Next.js /public folder
      chainId: getChainIdByNetworkKey(n), // only works for EVM networks
    }
  })

  return networkObject
}
