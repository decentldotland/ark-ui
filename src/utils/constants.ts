export const RCP = "https://rpc.goerli.mudit.blog/";
export const NETWORKS: Record<number, {
  name: string;
  urls: string[];
  theme: string;
  networkKey: string; // Ark Protocol identifier for network
}> = {
  1: {
    name: "Mainnet",
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
  1313161555: {
    name: "Aurora Testnet",
    networkKey: "AURORA-TESTNET",
    urls: ["https://testnet.aurora.dev/"],
    theme: "120, 214, 75"
  }
};
export const ARWEAVE_CONTRACT = "jRGJtaBjfvDJgpQATUiW3mBbB_wp71xrUmeQBalrm3k";
export const EVM_ORACLES: Record<number, string> = {
  1: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  5: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  1313161555: "0xfb0200C27185185D7DEe0403D5f102ADb59B7c34"
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
