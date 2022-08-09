import { CloseIcon, LinkIcon } from "@iconicicons/react"
import { arweave, useArconnect } from "../utils/arconnect"
import type { NextPage } from "next";
import Card, { CardSubtitle } from "../components/Card";
import { Modal, useModal, Close } from "../components/Modal";
import { coinbaseWallet } from "../utils/connectors/coinbase";
import { walletConnect } from "../utils/connectors/walletconnect";
import { metaMask } from "../utils/connectors/metamask";
import { addChain, ETHConnector, useETH } from "../utils/eth";
import { formatAddress } from "../utils/format";
import { useEffect, useState } from "react";
import { interactWrite } from "smartweave";
import { ACTIVE_NETWORK_STORE, ARWEAVE_CONTRACT, GUILDS_REGISTRY_CONTRACT, NETWORKS, ArkTags } from "../utils/constants";
import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import { run } from "ar-gql";
import linkQuery from "../utils/link_query";
import Head from "next/head";
import Image from "next/image";
import * as styled from "./styles";
import { StatusType, TelegramStatusType } from "./interfaces";
import TokenGatingForm from "../components/tokenGating";
import Button from "../components/Button";
import Page from "../components/Page";
import Spacer from "../components/Spacer";
import Faq from "../components/Faq";
import ANS from "../components/ANS";
import Loading from "../components/Loading";
import Network from "../components/Network";
import Avalanche from "../assets/avalanche.svg";
import Binance from "../assets/binance.png";
import Neon from "../assets/neon.png";
import Aurora from "../assets/aurora.png";
import Fantom from "../assets/fantom.png"
import Optimism from "../assets/optimism.svg"
import Polygon from "../assets/polygon.webp"

const Home: NextPage = () => {
  const downloadWalletModal = useModal();
  const ethModal = useModal();
  const [address, connect, disconnect] = useArconnect(downloadWalletModal);
  
  const [activeNetwork, setActiveNetwork] = useState<number>(1);
  const [previousNetwork, setPreviousNetwork] = useState<number>(1);

  const [networkLoaded, setNetworkLoaded] = useState<boolean>(false);

  const [status, setStatus] = useState<{ type: StatusType, message: string }>();
  const [telegramStatus, setTelegramStatus] = useState<{ type: TelegramStatusType, message: string}>();
  const [activeConnector, setActiveConnector] = useState<ETHConnector>();
  const eth = useETH(setActiveConnector, activeNetwork);

  // linking functionality
  const [linkStatus, setLinkStatus] = useState<string>();
  const [linkModal, setLinkModal] = useState<boolean>(true);

  // connect to wallet
  async function connectEth(connector: ETHConnector) {
    try {
      await eth.connect(connector, activeNetwork);
      setActiveConnector(connector);
      ethModal.setState(false);
      setStatus(undefined);
      localStorage.setItem('isConnected', 'true');
    } catch (e) {
      ethModal.setState(false);
      downloadWalletModal.setState(true);
    }
  }

  async function link() {
    setStatus(undefined);
    setLinkModal(true);

    if (!!linkingOverlay) {
      return setStatus({
        type: "error",
        message: "Already linked one of the addresses on this network"
      });
    }

    if (!address || !eth.address || !eth.contract) {
      return setStatus({
        type: "error",
        message: "Arweave or Ethereum not connected"
      });
    };

    try {
      setLinkStatus("Interacting with smart contract...");

      const interaction = await eth.contract.linkIdentity(address);
      await interaction.wait();

      setLinkStatus("Writing to Arweave...");

      await interactWrite(arweave, "use_wallet", ARWEAVE_CONTRACT, {
        function: "linkEvmIdentity",
        address: eth.address,
        verificationReq: interaction.hash,
        network: NETWORKS[activeNetwork].networkKey
      }, ArkTags);

      setLinkStatus("Linked");
      setStatus({
        type: "success",
        message: "Linked identity"
      });
      setLinkingOverlay("in-progress");
    } catch (e) {
      console.log("Failed to link", e);

      setStatus({
        type: "error",
        message: "Could not link account"
      });
    }

    setLinkStatus(undefined);
  }

  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem(ACTIVE_NETWORK_STORE);

      // load saved network
      if (stored && !networkLoaded) {
        setActiveNetwork(Number(stored));
        setNetworkLoaded(true);
      } else {
        // save current network and add it to the addressbook
        try {
          localStorage.setItem(ACTIVE_NETWORK_STORE, activeNetwork.toString());
          if (activeNetwork !== 1 && activeNetwork !== 5) {
            const provider = eth.getProvider()?.provider;
            if (!provider) return;
            // @ts-ignore
            if (await provider.request({ method: "eth_chainId" }) === activeNetwork) return;
            // @ts-ignore
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainName: String(NETWORKS[Number(activeNetwork)]?.name),
                chainId: `0x${activeNetwork.toString(16)}`,
                rpcUrls: NETWORKS[Number(activeNetwork)].urls,
              }],
            });
          };
        } catch {
          setActiveNetwork(previousNetwork);
        }

        // reconnect with the new network
        if (eth.address && activeConnector) {
          try {
            await eth.connect(activeConnector, activeNetwork);
          } catch (e: any) {
            if (e.code === 4902) {
              try {
                await addChain(activeConnector, activeNetwork, NETWORKS[activeNetwork]);
                await eth.connect(activeConnector, activeNetwork);
              } catch {
                setActiveNetwork(previousNetwork);
              }
            } else setActiveNetwork(previousNetwork);
          }
        }
      }
    })();
  }, [activeNetwork]);

  // load if already linked or in progress
  const [linkingOverlay, setLinkingOverlay] = useState<"in-progress" | "linked">();

  useEffect(() => {
    (async () => {
      if (!address) return;

      // check if linked
      try {
        const res = await fetch("https://ark-api.decent.land/v1/oracle/state");
        const { res: cachedState } = await res.clone().json();

        if (
          cachedState.find((identity: Record<string, any>) =>
            (identity.arweave_address === address || identity.evm_address === eth.address) && 
            identity.ver_req_network === NETWORKS[activeNetwork].networkKey && 
            identity.is_verified
          )
        ) {
          return setLinkingOverlay("linked");
        }
      } catch {}

      // check if linking is in progress
      try {
        const inProgressQuery = await run(linkQuery, { owner: address, arkContract: ARWEAVE_CONTRACT });

        // filter mining transactions
        // these suggest that a linking is in progress
        const mining = inProgressQuery.data.transactions.edges.filter(({ node }) => !node.block);

        if (mining.length > 0) {
          setLinkingOverlay("in-progress");
        } else {
          setLinkingOverlay(undefined);
        }
      } catch {}
    })();
  }, [address, activeNetwork]);

  return (
    <>
      <styled.TopBanner>
        Connect wallet and switch network to use Ark on Avalanche, BNB, Aurora, and Goerli
      </styled.TopBanner>
      <Head>
        <title>Ark Protocol</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Ark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=yes" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content="https://ark.decent.land/arkArt.jpg" />
        <meta name="twitter:site" content="@decentdotland" />
        <meta name="twitter:title" content="Ark Protocol | decent.land" />
        <meta name="twitter:description" content="The multichain identity protocol for web3 social" />
        <meta name="twitter:url" content="https://ark.decent.land/"></meta>
      </Head>
      <styled.TopSection>
        <styled.ARKLogo>
          <Image style={{borderRadius: '18px'}} src="/arkArt.jpg" width={300} height={300} draggable={false} />
        </styled.ARKLogo>
        <styled.TopContent>
          <styled.Title>
            <styled.ProtocolName>
              Ark
            </styled.ProtocolName>
            Protocol
          </styled.Title>
          <styled.Subtitle>
            The multichain identity protocol for web3 social
          </styled.Subtitle>
          <a href="#faq">
            <styled.ReadMoreButton>
              Read more
            </styled.ReadMoreButton>
          </a>
        </styled.TopContent>
      </styled.TopSection>
      <Page>
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.185, ease: "easeInOut" }}
            >
              <styled.Status type={status.type}>
                <p>
                  <span>{status.type}:</span>
                  {status.message}
                </p>
                <styled.CloseStatusIcon onClick={() => setStatus(undefined)} />
              </styled.Status>
              <Spacer y={1} />
            </motion.div>
          )}
        </AnimatePresence>
        <Modal title="No wallet detected" {...downloadWalletModal.bindings}>
          <styled.DownloadWalletModals>
            You need an Ethereum wallet and ArConnect to use this website.
            <Spacer y={1} />
            If you haven't, you can install wallets here:
            <Spacer y={1} />
            <styled.ProviderWrapper>
              <Image src={`/metamask.png`} width={25} height={25} draggable={false} />
              <styled.InstallWalletURL href="https://metamask.io/download/">MetaMask</styled.InstallWalletURL>.
            </styled.ProviderWrapper>
            <Spacer y={1} />
            <styled.ProviderWrapper>
              <Image src={`/arweave.png`} width={25} height={25} draggable={false} />
              <styled.InstallWalletURL href="https://chrome.google.com/webstore/detail/arconnect/einnioafmpimabjcddiinlhmijaionap">ArConnect</styled.InstallWalletURL>.
            </styled.ProviderWrapper>
          </styled.DownloadWalletModals>
        </Modal>
        <styled.IdentityCard>
          <Spacer y={.25} />
          <CardSubtitle>
            Link identity
          </CardSubtitle>
          <Spacer y={1.25} />
          <styled.WalletContainer>
            <styled.WalletChainLogo>
              <Image src="/arweave.png" width={30} height={30} draggable={false} />
              <styled.ChainName>
                Arweave
                <styled.ChainTicker>
                  Ar
                </styled.ChainTicker>
              </styled.ChainName>
            </styled.WalletChainLogo>
            {(address && <ANS address={address} onClick={() => disconnect()} />) || (
              <styled.ConnectButton
                secondary
                onClick={() => connect()}
              >
                Connect
              </styled.ConnectButton>
            )}
          </styled.WalletContainer>
          <Spacer y={1} />
          <styled.LinkSymbol>
            <LinkIcon />
          </styled.LinkSymbol>
          <Spacer y={1} />
          <styled.WalletContainer>
            <styled.WalletChainLogo>
              {activeNetwork === 1 || activeNetwork === 5 ? (
                <Image src="/eth.png" width={30} height={30} draggable={false} />
              ): activeNetwork === 1313161555 && (
                <Image style={{margin: '3px 0 0 0', borderRadius: '9999px'}} src={Aurora} width={30} height={30} draggable={false} />
              )
              } { activeNetwork === 43114 && (
                <Image style={{margin: '3px 0 0 0'}} src={Avalanche} width={30} height={30} draggable={false} />
              )
              }
              { activeNetwork === 56 && (
                <Image style={{margin: '3px 0 0 0'}} src={Binance} width={30} height={30} draggable={false} />
              )
              }
              { activeNetwork === 250 && (
                <Image style={{margin: '3px 0 0 0'}} src={Fantom} width={30} height={30} draggable={false} />
              )
              }
              { activeNetwork === 245022926 && (
                <Image style={{margin: '3px 0 0 0'}} src={Neon} width={30} height={30} draggable={false} />
              )}
              { activeNetwork === 10 && (
                <Image style={{margin: '3px 0 0 0'}} src={Optimism} width={30} height={30} draggable={false} />
              )}
              { activeNetwork === 137 && (
                <Image style={{margin: '3px 0 0 0'}} src={Polygon} width={30} height={30} draggable={false} />
              )}

              <styled.ChainName>
                {(activeNetwork === 1 || activeNetwork === 5) && "Ethereum"}
                {activeNetwork === 1313161555 && "Aurora"}
                {activeNetwork === 43114 && "Avalanche"}
                {activeNetwork === 56 && "BNB Chain"}
                {activeNetwork === 250 && "Fantom"}
                {activeNetwork === 245022926 && "NEON Testnet"}
                {activeNetwork === 10 && "Optimism"}
                {activeNetwork === 137 && "Polygon"}
                <styled.ChainTicker>
                  {(activeNetwork === 1 || activeNetwork === 10 || activeNetwork === 5) && "ETH"}
                  {activeNetwork === 137 && "MATIC"}
                  {activeNetwork === 250 && "FTM"}
                  {activeNetwork === 43114 && "AVAX"}
                  {activeNetwork === 56 || 245022926 && ""}
                </styled.ChainTicker>
              </styled.ChainName>
            </styled.WalletChainLogo>
            <styled.ConnectButton secondary style={{ textTransform: eth.address ? "none" : undefined }} onClick={() => {
              if (!eth.address) {
                ethModal.setState(true)
              } else {
                eth.disconnect();
              }
            }}>
              {(eth.address && (
                <>
                  <Image src={`/${eth.provider}.png`} width={25} height={25} draggable={false} />
                  {eth.ens || formatAddress(eth.address, 8)}
                </>
              )) || "Connect"}
            </styled.ConnectButton>
          </styled.WalletContainer>
          <Spacer y={2.5} />
          <Button secondary fullWidth disabled={!(address && eth.address && linkingOverlay !== "linked")} onClick={() => link()}>
            {linkStatus && <Loading />}
            {linkStatus || "Link identity"}
          </Button>
          <AnimatePresence>
            {!!linkingOverlay && linkModal && (
              <styled.LinkingInProgress
                initial="transparent"
                animate="visible"
                exit="transparent"
                variants={opacityAnimation}
                transition={{ duration: 0.23, ease: "easeInOut" }}
              >
                <styled.CloseButton>
                  <Close onClick={() => setLinkModal(false)} />
                </styled.CloseButton>
                {(linkingOverlay === "linked" && (
                  <p>
                    🥳 Congratulations! You have linked your identity.
                  </p>
                )) || <p>Identity link sent to Arweave.</p>}
                <p>Tweet a screenshot of this page and <a href="https://twitter.com/decentdotland" className="twitterLink" target="_blank" rel="noopener noreferrer">@decentdotland</a> to be whitelisted for some future rewards. ✨</p>
              </styled.LinkingInProgress>
            )}
          </AnimatePresence>
        </styled.IdentityCard>
        <Spacer y={2} />
        <TokenGatingForm eth={eth} address={address} setLinkStatus={setLinkStatus} activeNetwork={activeNetwork} />
        <Spacer y={4} />
        <styled.Permanent href="https://arweave.org" target="_blank" rel="noopener noreferer">
          <Image src="/permanent.svg" width={150} height={75} />
        </styled.Permanent>
        <Spacer id="faq" y={4} />
        <styled.FAQCard>
          <Spacer y={1.5} />
          <styled.Title style={{ textAlign: "center" }}>FAQ</styled.Title>
          <Spacer y={1.5} />
          <Faq title="What is Ark Protocol?">
            Ark is a multichain identity linking protocol built to power decent.land, ANS, and any other applications that rely on users attesting to their identity on other chains. Example use cases include token gating and social data aggregation. With Ark, users can use their Arweave wallet as a master identity to prove activity on multiple other chains.
          </Faq>
          <Faq title="Who built Ark?">
            Ark was built by the <a href="https://decent.land" target="_blank" rel="noopener noreferrer">decent.land</a> team and is one of the project's core social protocols along with ANS and the Public Square.
          </Faq>
          <Faq title="Why did decent.land build Ark?">
            decent.land is a collection of social and identity primitives built on Arweave to support the creation of token-gated social networks and groups. The core contracts live on Arweave but interact with other chains to build a chain-agnostic way to save your identity and control access to DAO discussions and governance.
            <Spacer y={.5} />
            Ark is our way to verifiably associate any number of Ethereum/EVM chain addresses with an Arweave wallet or ANS profile, and makes it so our other protocols can read token holdings and activity from Ethereum, Avalanche, BNB Chain, Aurora, Polygon, and more.          </Faq>
          <Faq title="What do I need to start?">
            You need the <a href="https://arconnect.io" target="_blank" rel="noopener noreferrer">ArConnect extension</a> to get an Arweave wallet and sign Arweave transactions. It should have enough AR for the interaction, e.g. 0.01 AR.
            <Spacer y={.5} />
            You need either <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">Metamask</a>, <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">Coinbase Wallet</a> or a Wallet Connect compatible Ethereum wallet extension and a wallet on Ethereum mainnet, with enough ETH for gas, e.g. 0.0005 ETH.
            <Spacer y={.5} />
            Connect both wallets on the UI, confirm the transactions, and the data will populate on Arweave.          </Faq>
          <Faq title="What can I do once my identities are linked with Ark?">
            We are building token-gating protocols for both Telegram and the upcoming decent.land web app. We are also working on aggregation of multichain data for the ANS identity layer, to show activity from any chain on your own ar.page profile.
            <Spacer y={.5} />
            Early Ark adopters may be eligible for future beta testing opportunities as we expand the set of protocols and use cases
          </Faq>
          <Faq title="How can I build on Ark Protocol?">If your dApp deals with verifying a user’s identity across chains, or is an Arweave dApp built to work with other L1s, Ark Protocol could be a useful primitive to integrate. 
            <a href="https://github.com/decentldotland/ark-network" target="_blank" rel="noopener noreferrer">
              Check it on GitHub here.
            </a>
          </Faq>
          <Faq title="Why is it called Ark?">
          In the decent.land <a href="https://github.com/decentldotland/ark-network" target="_blank" rel="noopener noreferrer">lore</a>, settlers arrived on the planet on a fleet of arks - spaceships ranging in size from personal craft to floating cities. Like its spacefaring namesake, the Ark Protocol makes connections between distant environments.
          </Faq>
        </styled.FAQCard>
      </Page>
      <Modal title="Choose a wallet" {...ethModal.bindings}>
        <styled.MetamaskButton onClick={() => connectEth(metaMask)} fullWidth>
          <Image src="/metamask.png" width={25} height={25} />
          Metamask
        </styled.MetamaskButton>
        <Spacer y={1} />
        <styled.WalletConnectButton onClick={() => connectEth(walletConnect)} fullWidth>
          <Image src="/walletconnect.png" width={25} height={25} />
          Wallet Connect
        </styled.WalletConnectButton>
        <Spacer y={1} />
        <styled.CoinbaseButton onClick={() => connectEth(coinbaseWallet)} fullWidth>
          <Image src="/coinbase.png" width={25} height={25} />
          Coinbase Wallet
        </styled.CoinbaseButton>
      </Modal>
      <Network isDisabled={eth.address ? false: true} value={activeNetwork} onChange={(e) => setActiveNetwork((val) => {
        setPreviousNetwork(val);
        return Number(e.target.value);
      })} />
    </>
  );
}

export default Home;
