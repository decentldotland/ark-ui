export const RCP = "https://rpc.goerli.mudit.blog/";
export const NETWORKS: Record<number, {
  name: string;
  urls: string[];
  theme: string;
  networkKey: string; // Ark Protocol identifier for network
}> = {
  1: {
    name: "Ethereum Mainnet",
    networkKey: "ETH-MAINNET",
    urls: ["https://cloudflare-eth.com/"],
    theme: "73, 71, 178"
  },
  5: {
    name: "Goerli Testnet",
    networkKey: "ETH-GOERLI",
    urls: ["https://rpc.goerli.mudit.blog/"],
    theme: "48, 153, 242"
  },
  56: {
    name: "BNB Chain",
    networkKey: "BSC-MAINNET",
    urls: ["https://bscrpc.com"],
    theme: "243, 186, 47"
  },
  43114: {
    name: "Avalanche C-Chain",
    networkKey: "AVALANCHE-MAINNET",
    urls: ["https://api.avax.network/ext/bc/C/rpc"],
    theme: "255, 0, 0"
  },
  // 245022926: {
  //   name: "NEON",
  //   networkKey: "NEON-TESTNET",
  //   urls: ["https://proxy.devnet.neonlabs.org/solana	"],
  //   theme: "245, 26, 250"
  // },
  1313161555: {
    name: "Aurora Testnet",
    networkKey: "AURORA-TESTNET",
    urls: ["https://testnet.aurora.dev/"],
    theme: "120, 214, 75"
  }
};

export const ARWEAVE_CONTRACT = "VWWz1k2u6LnfNLJVCQxVVE3b2ivTVBbgLkMrPe3naoY";
export const EVM_ORACLES: Record<number, string> = {
  1: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  5: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  56: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  43114: "0xE5E0A3380811aD9380F91a6996529da0a262EcD1",
  // 245022926: "",
  1313161555: "0xfb0200C27185185D7DEe0403D5f102ADb59B7c34",
};

export const URLS: { [chainId: number]: string[] } = Object.keys(NETWORKS).reduce<{ [chainId: number]: string[] }>(
  (accumulator, chainId) => {
    const validURLs: string[] = NETWORKS[Number(chainId)].urls;

    if (validURLs.length) {
      accumulator[Number(chainId)] = validURLs
    }

    return accumulator
  },
  {}
);

export const ACTIVE_NETWORK_STORE = "ark_active_network";
