const chainNames = {
  'ETH-MAINNET': "Ethereum",
  'BSC-MAINNET': "Binance Chain",
  'FTM': "Fantom",
}

export function EXMHandleNetworks(networks: string[]) {

  const networkObject = {};
  
  networks
  .filter((n) => !(n.includes("DEVNET") || n.includes("TESTNET") || n.includes("FUJI") || n.includes("GOERLI")))
  .map((n) => {
      //@ts-ignore
      networkObject[n] = {
        ark_key: n,
        // @ts-ignore
        name: chainNames[n] ? chainNames[n] : n[0] + (n.slice(1).split('-')[0].toLowerCase()),
        iconURL: '/' + n.split('-')[0].toLowerCase() + '.png', // this will hit Next.js /public folder
      }
    }
  )
  // console.log(networkObject)
  
  return networkObject
}
