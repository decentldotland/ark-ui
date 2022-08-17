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
  10: {
    name: "Optimism",
    networkKey: "OPTIMISM-MAINNET",
    urls: ["https://optimism-mainnet.public.blastapi.io"],
    theme: "255, 0, 0"
  },
  250: {
    name: "Fantom",
    networkKey: "FTM-MAINNET",
    urls: ["https://rpc.ftm.tools"],
    theme: "9, 39, 255"
  },
  137: {
    name: "Polygon",
    networkKey: "POLYGON-MAINNET",
    urls: ["https://polygon-rpc.com"],
    theme: "130, 71, 229"
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

export const SUPPORTED_TOKENS = [
  {key: "BEP20", name: "BEP20", theme: "243, 186, 47"},
  {key: "ERC-ETH", name: "ERC 20 ETH", theme: "73, 71, 178"},
  {key: "ERC-AVAX", name: "ERC20 AVAX", theme: "255, 0, 0"},
  {key: "ERC-FTM", name: "ERC20 FTM", theme: "9, 39, 255"},
  {key: "ERC-POLYGON", name: "ERC20 MATIC", theme: "130, 71, 229"},
  {key: "PST-ANFT", name: "PSTs & aNFTS", theme: "125, 58, 255"}
];

export const ARWEAVE_CONTRACT = "5H5Hj81G5j5P2raDhe5VFU-zkf08KDc588GJ8dtlHTw";
export const GUILDS_REGISTRY_CONTRACT = "F1VhIZ2I4L-Lw3ueT-EMDivLtz6AjDG90jYdf-nwveY";

export const TELEGRAM_BOT_NAME = "fake_ark_network_bot";
export const TELEGRAM_USERNAME_REGEX = /^[a-z0-9]{5,32}$/i;

export const EVM_ORACLES: Record<number, string> = {
  1: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  5: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  56: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  250: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  43114: "0xE5E0A3380811aD9380F91a6996529da0a262EcD1",
  10: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  137: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  // 245022926: "",
  1313161555: "0xfb0200C27185185D7DEe0403D5f102ADb59B7c34",
};

export const ArkTagsLinkEVMIdentity = [
  {
    name: "Protocol-Name",
    value: "Ark-Network"
  },
  {
    name: "Protocol-Action",
    value: "Link-Identity"
  }
];

export const ArkTagsCreateGuild = [
  {
    name: "Protocol-Name",
    value: "Ark-Network"
  },
  {
    name: "Protocol-Action",
    value: "Create-Guild"
  }
];

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

// STORAGE NAMES
export const TELEGRAM_LINKING_STEP = "telegram_linking_step";
export const ACTIVE_NETWORK_STORE = "ark_active_network";
