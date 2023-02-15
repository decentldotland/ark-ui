import type { AppProps } from "next/app";
import Script from "next/script";
import styled, { ThemeProvider } from "styled-components";
import Header from "../components/Header";
import "../styles/globals.css";
import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultWallets,
  midnightTheme,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { bsc, mainnet, evmos, avalanche, fantom, optimism, arbitrum, polygon, } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import {
  argentWallet, braveWallet, coinbaseWallet, imTokenWallet, injectedWallet, ledgerWallet, metaMaskWallet, omniWallet, rainbowWallet, trustWallet, walletConnectWallet
} from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';

function App({ Component, pageProps }: AppProps) {
  const { chains, provider } = configureChains(
    [bsc, mainnet, evmos, avalanche, fantom, optimism, arbitrum, polygon],
    [publicProvider()]
  );

  const connectors = connectorsForWallets([
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet({ chains }),
        ledgerWallet({ chains }),
        trustWallet({ chains }),
        injectedWallet({ chains }),
        rainbowWallet({ chains }),
      ],
    },
    {
      groupName: 'Others',
      wallets: [
        coinbaseWallet({ chains, appName: 'My RainbowKit App' }),
        braveWallet({ chains }),
        walletConnectWallet({ chains }),
        argentWallet({ chains }),
        omniWallet({ chains }),
        imTokenWallet({ chains }),
      ],
    },
  ]);

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider
  })

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={midnightTheme({
        accentColor: '#26bfa8',
      })}>
        <ThemeProvider theme={{
        //  primary: "17, 157, 121",
          primary: "38, 191, 168",
          secondaryText: "#d3d3d3",
          tertiaryText: "#a3a3a3"
        }}>
          <Script async src="https://www.googletagmanager.com/gtag/js?id=G-8YC0E9HXM6" />
          <Script strategy="beforeInteractive">
            {`
              // Google tag (gtag.js)
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-8YC0E9HXM6');
            `}
          </Script>
          <Header />
          <Gradient />
          <Component {...pageProps} />
        </ThemeProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

const Gradient = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: radial-gradient(50% 50% at 50% 50%, rgba(${props => props.theme.primary}, 0.064) 0, rgba(255, 255, 255, 0) 100%);
  z-index: -1;
  width: 220vw;
  height: 220vh;
  transform: translate(-60vw, -110vh);
`;

export default App;
