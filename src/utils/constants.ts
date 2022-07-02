export const RCP = "https://rpc.goerli.mudit.blog/";
export const NETWORKS: Record<number, { name: string; urls: string[], theme: string }> = {
  1: {
    name: "Mainnet",
    urls: ["https://cloudflare-eth.com/"],
    theme: "73, 71, 178"
  },
  5: {
    name: "Goerli Testnet",
    urls: ["https://rpc.goerli.mudit.blog/"],
    theme: "48, 153, 242"
  },
  1313161555: {
    name: "Aurora-Testnet",
    urls: ["https://testnet.aurora.dev/"],
    theme: "120, 214, 75"
  }
};
export const ARWEAVE_CONTRACT = "qP614umsvOo9Szvl-xqvnXH0xLOg2eKOsLYnKx2l5SA";
export const EVM_ORACLE_ADDRESS = "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A"; // Goerli Testnet

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
