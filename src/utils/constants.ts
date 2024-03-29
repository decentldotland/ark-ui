import type { AccountView } from "near-api-js/lib/providers/provider";


export const chainNames = {
  'ETH-MAINNET': "Ethereum",
  'BSC-MAINNET': "BNB Chain",
  'FTM': "Fantom",
}

export const chainTickers = {
  "AURORA-MAINNET": "AURORA",
  "BSC-MAINNET": "BNB",
  "ETH-MAINNET": "ETH",
  "EVMOS-MAINNET": "EVMOS",
  "AVALANCHE-MAINNET": "AVAX",
  "FTM-MAINNET": "FTM",
  "OPTIMISM-MAINNET": "ETH",
  "ARBITRUM-MAINNET": "ETH",
  "POLYGON-MAINNET": "MATIC",
  "NEAR-MAINNET": "NEAR",
  "SOLANA-MAINNET": "SOL",
  "TRON-MAINNET": "TRX"
}

export const RCP = "https://rpc.goerli.mudit.blog/";

export interface EVM_NETWORK_UI_INTERFACE {
  name: string;
  urls: string[];
  theme: string;
  networkKey: string; // Ark Protocol identifier for network
  nativeCurrency?: any;
}

// EVM NETWORKS

export const NETWORKS:Record<number, EVM_NETWORK_UI_INTERFACE>  = {
  1: {
    name: "Ethereum Mainnet",
    networkKey: "ETH-MAINNET",
    urls: ["https://cloudflare-eth.com/"],
    theme: "73, 71, 178"
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
  42161: {
    name: "Arbitrum One",
    networkKey: "ARBITRUM-MAINNET",
    urls: ["https://arb1.arbitrum.io/rpc"],
    theme: "40, 160, 240"
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
  9001: {
    name: "Evmos Mainnet",
    networkKey: "EVMOS-MAINNET",
    urls: ["https://eth.bd.evmos.org:8545"],
    theme: "228, 65, 26",
    nativeCurrency: {
      name: "Evmos",
      symbol: "EVMOS",
      decimals: 18  
    }
  }
};

export const TEST_NETWORKS: Record<number, {
  name: string;
  urls: string[];
  theme: string;
  networkKey: string; // Ark Protocol identifier for network
}> = {
  5: {
    name: "Goerli Testnet",
    networkKey: "ETH-GOERLI",
    urls: ["https://rpc.goerli.mudit.blog/"],
    theme: "48, 153, 242"
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

export const EXOTIC_NETWORKS: any = {
  "NEAR-MAINNET": {
    name: "NEAR-MAINNET",
    theme: "125, 125, 125",
    textTheme: "black",
  }
}

export interface Identity {
  addresses?:              Address[];
  arweave_address:         string;
  first_linkage:           number;
  is_verified:             boolean;
  last_modification:       number;
  primary_address:         string;
  public_key:              string;
  unevaluated_addresses?:  string[];
}

export interface Address {
  address:          string;
  ark_key:          "ARWEAVE" | "EVM" | "EXOTIC";
  is_evaluated:     boolean;
  is_verified:      boolean;
  network:          string;
  verification_req: string;
}

export interface Message {
  premium: boolean;
  sender: string;
  text: string;
}

export type Account = AccountView & {
  account_id: string;
};

export const BASE_ARK_API_URL = "https://ark-core.decent.land/";

// https://github.com/decentldotland/ark-protocol#4--resolve-ark-addresses-for-a-given-address
export const RESOLVE_ARK_ADDRESS_URL = BASE_ARK_API_URL + "v2/address/resolve/";

// https://github.com/decentldotland/ark-protocol#7--soark-only-domains
export const RESOLVE_ARK_ADDRESS_TO_DOMAINS_URL = BASE_ARK_API_URL + "/v2/domains/"; // :network/:address

export const ANS_EXM_CONTRACT = "VGWeJLDLJ9ify3ezl9tW-9fhB0G-GIUd60FE-5Q-_VI";


export const POAPS = process.env.ARK_EARLY_SUPPORTER_POAP_URLS

export const ARWEAVE_CONTRACT = "5H5Hj81G5j5P2raDhe5VFU-zkf08KDc588GJ8dtlHTw";
export const EXM_ADDRESS = "Z7JzRRt2iTQWV5LziNhTV6SP51tVKkCf_qrUqtlwzpg";
export const EXM_TOKEN = process.env.EXM_API_TOKEN;
export const EXM_READ_URL = "https://api.exm.dev/read/";
export const EXM_OPEN_READ = `https://${ANS_EXM_CONTRACT}.exm.run`
export const EXM_WRITE_URL = "https://api.exm.dev/api/transactions?token=";

export const EVM_ORACLES: Record<number, string> = {
  1: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  56: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  250: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  43114: "0xE5E0A3380811aD9380F91a6996529da0a262EcD1",
  10: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  42161: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  137: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A",
  // 245022926: "",
  1313161555: "0xfb0200C27185185D7DEe0403D5f102ADb59B7c34",
  9001: "0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A"
};

export const NEAR_ORACLE = "ark_station_1.near";

export const EXOTIC_ORACLES: Record<string, string> = {
  "NEAR": NEAR_ORACLE,
}

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
