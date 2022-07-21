import { CloseIcon, LinkIcon } from "@iconicicons/react"
import { arweave, useArconnect } from "../utils/arconnect"
import type { NextPage } from "next";
import Card, { CardSubtitle } from "../components/Card";
import { Modal, useModal } from "../components/Modal";
import { coinbaseWallet } from "../utils/connectors/coinbase";
import { walletConnect } from "../utils/connectors/walletconnect";
import { metaMask } from "../utils/connectors/metamask";
import { addChain, ETHConnector, useETH } from "../utils/eth";
import { formatAddress } from "../utils/format";
import { useEffect, useState } from "react";
import { interactWrite } from "smartweave";
import { ACTIVE_NETWORK_STORE, ARWEAVE_CONTRACT, NETWORKS } from "../utils/constants";
import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import { run } from "ar-gql";
import linkQuery from "../utils/link_query";
import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";
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

const Home: NextPage = () => {
  const downloadWalletModal = useModal();
  const ethModal = useModal();
  const [address, connect, disconnect] = useArconnect(downloadWalletModal);

  const [activeNetwork, setActiveNetwork] = useState<number>(1);
  const [previousNetwork, setPreviousNetwork] = useState<number>(1);
  const [networkLoaded, setNetworkLoaded] = useState<boolean>(false);

  const [status, setStatus] = useState<{ type: StatusType, message: string }>();
  const [activeConnector, setActiveConnector] = useState<ETHConnector>();
  const eth = useETH(setActiveConnector, activeNetwork);

  const [currentTab, setCurrentTab] = useState<number>(1);

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

  // linking functionality
  const [linkStatus, setLinkStatus] = useState<string>();

  async function link() {
    setStatus(undefined);

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
        function: "linkIdentity",
        address: eth.address,
        verificationReq: interaction.hash,
        network: NETWORKS[activeNetwork].networkKey
      }, [
        {
          name: "Protocol-Name",
          value: "Ark-Network"
        },
        {
          name: "Protocol-Action",
          value: "Link-Identity"
        }
      ]);

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
        const res = await fetch("https://thawing-lowlands-08726.herokuapp.com/ark/oracle/state");
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
      <Head>
        <title>Ark</title>
        <link rel="icon" href="/icon.png" />
      </Head>
      <TopSection>
        <ARKLogo>
          <Image style={{borderRadius: '18px'}} src="/arkArt.jpg" width={300} height={300} draggable={false} />
        </ARKLogo>
        <TopContent>
          <Title>
            <ProtocolName>
              Ark
            </ProtocolName>
            Protocol
          </Title>
          <Subtitle>
            The multichain identity protocol for web3 social
          </Subtitle>
          <a href="#faq">
            <Button>
              Read more
            </Button>
          </a>
        </TopContent>
      </TopSection>
      <Page>
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.185, ease: "easeInOut" }}
            >
              <Status type={status.type}>
                <p>
                  <span>{status.type}:</span>
                  {status.message}
                </p>
                <CloseStatusIcon onClick={() => setStatus(undefined)} />
              </Status>
              <Spacer y={1} />
            </motion.div>
          )}
        </AnimatePresence>
        <Modal title="No wallet detected" {...downloadWalletModal.bindings}>
          <DownloadWalletModals>
            You need an Ethereum wallet and ArConnect to use this website.
            <Spacer y={1} />
            If you haven't, you can install wallets here:
            <Spacer y={1} />
            <ProviderWrapper>
              <Image src={`/metamask.png`} width={25} height={25} draggable={false} />
              <InstallWalletURL href="https://metamask.io/download/">MetaMask</InstallWalletURL>.
            </ProviderWrapper>
            <Spacer y={1} />
            <ProviderWrapper>
              <Image src={`/arweave.png`} width={25} height={25} draggable={false} />
              <InstallWalletURL href="https://chrome.google.com/webstore/detail/arconnect/einnioafmpimabjcddiinlhmijaionap">ArConnect</InstallWalletURL>.
            </ProviderWrapper>
          </DownloadWalletModals>
        </Modal>
        <IdentityCard>
          <Spacer y={.25} />
          <CardSubtitle>
            Link identity
          </CardSubtitle>
          <Spacer y={1.25} />
          <WalletContainer>
            <WalletChainLogo>
              <Image src="/arweave.png" width={30} height={30} draggable={false} />
              <ChainName>
                Arweave
                <ChainTicker>
                  Ar
                </ChainTicker>
              </ChainName>
            </WalletChainLogo>
            {(address && <ANS address={address} onClick={() => disconnect()} />) || (
              <ConnectButton
                secondary
                onClick={() => connect()}
              >
                Connect
              </ConnectButton>
            )}
          </WalletContainer>
          <Spacer y={1} />
          <LinkSymbol>
            <LinkIcon />
          </LinkSymbol>
          <Spacer y={1} />
          <WalletContainer>
            <WalletChainLogo>
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
              { activeNetwork === 245022926 && (
                <Image style={{margin: '3px 0 0 0'}} src={Neon} width={30} height={30} draggable={false} />
              )}

              <ChainName>
                {(activeNetwork === 1 || activeNetwork === 5) && "Ethereum"}
                {activeNetwork === 1313161555 && "Aurora"}
                {activeNetwork === 43114 && "Avalanche"}
                {activeNetwork === 56 && "BNB Chain"}
                {activeNetwork === 245022926 && "NEON Testnet"}
                <ChainTicker>
                  {(activeNetwork === 1 || activeNetwork === 5) && "ETH"}
                  {activeNetwork === 43114 && "AVAX"}
                  {activeNetwork === 56 || 245022926 && ""}
                </ChainTicker>
              </ChainName>
            </WalletChainLogo>
            <ConnectButton secondary style={{ textTransform: eth.address ? "none" : undefined }} onClick={() => {
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
            </ConnectButton>
          </WalletContainer>
          <Spacer y={2.5} />
          <Button secondary fullWidth disabled={!(address && eth.address)} onClick={() => link()}>
            {linkStatus && <Loading />}
            {linkStatus || "Link identity"}
          </Button>
          <AnimatePresence>
            {!!linkingOverlay && (
              <LinkingInProgress
                initial="transparent"
                animate="visible"
                exit="transparent"
                variants={opacityAnimation}
                transition={{ duration: 0.23, ease: "easeInOut" }}
              >
                {(linkingOverlay === "linked" && (
                  <p>
                    🥳 Congratulations! You have linked your identity.
                  </p>
                )) || <p>Identity link sent to Arweave.</p>}

                <p>Tweet a screenshot of this page and <a href="https://twitter.com/decentdotland" className="twitterLink" target="_blank" rel="noopener noreferrer">@decentdotland</a> to be whitelisted for some future rewards. ✨</p>
              </LinkingInProgress>
            )}
          </AnimatePresence>
        </IdentityCard>
        <Spacer y={2} />
        <IdentityCard>
          <Tabs>
            <TabWrapper>
              <Tab active={currentTab === 1} onClick={() => setCurrentTab(1)}>
                Create Group
              </Tab>
            </TabWrapper>
            <TabWrapper>
              <Tab active={currentTab === 2} onClick={() => setCurrentTab(2)}>
                Join Group
              </Tab>
            </TabWrapper>
          </Tabs>
          <ContentTitle>
            {currentTab === 1 && 'Create a new token-gated group'}
            {currentTab === 2 && 'Join a token-gated group'}
          </ContentTitle>
          <ComingSoon>
            <ComingSoonText>Token gated groups coming soon!</ComingSoonText>
            <FormWrapper>
              <TGGroupInput disabled placeholder='Group id' />
              <Button secondary disabled>
                {currentTab === 1 ? 'Create' : 'Join'}
              </Button>
            </FormWrapper>
          </ComingSoon>
        </IdentityCard>
        <Spacer y={4} />
        <Permanent href="https://arweave.org" target="_blank" rel="noopener noreferer">
          <Image src="/permanent.svg" width={150} height={75} />
        </Permanent>
        <Spacer id="faq" y={4} />
        <FAQCard>
          <Spacer y={1.5} />
          <Title style={{ textAlign: "center" }}>FAQ</Title>
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
        </FAQCard>
      </Page>
      <Modal title="Choose a wallet" {...ethModal.bindings}>
        <MetamaskButton onClick={() => connectEth(metaMask)} fullWidth>
          <Image src="/metamask.png" width={25} height={25} />
          Metamask
        </MetamaskButton>
        <Spacer y={1} />
        <WalletConnectButton onClick={() => connectEth(walletConnect)} fullWidth>
          <Image src="/walletconnect.png" width={25} height={25} />
          Wallet Connect
        </WalletConnectButton>
        <Spacer y={1} />
        <CoinbaseButton onClick={() => connectEth(coinbaseWallet)} fullWidth>
          <Image src="/coinbase.png" width={25} height={25} />
          Coinbase Wallet
        </CoinbaseButton>
      </Modal>
      {activeConnector ? (
        <Network value={activeNetwork} onChange={(e) => setActiveNetwork((val) => {
          setPreviousNetwork(val);
          return Number(e.target.value);
        })} />
      ) : (
        <></>
      )}
    </>
  );
}

const ARKLogo = styled.div`
  margin-right: 40px;
  @media screen and (max-width: 768px) {
    margin-bottom: 10px;
    margin-right: 0px;
  }
`;

const TopSection = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0;
  overflow: hidden;
  z-index: 0;
  @media screen and (max-width: 768px) {
    flex-direction: column;
  }
`;

const TopContent = styled.div`
  display: flex;
  text-align: center;
  align-items: start;
  flex-direction: column;
  width: max-content;
  @media screen and (max-width: 768px) {
    align-items: center;
  }
`;

const DownloadWalletModals = styled.div`
  text-align: center;
  margin-top: 1rem;
  color: white;
  font-size: 1.2rem;
`;

const ProviderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InstallWalletURL = styled.a`
  margin-left: 0.3rem;
  color: rgb(${props => props.theme.primary});
  text-decoration: none;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: ${props => props.theme.secondaryText};
  line-height: 1.1em;
  margin: 0;
  margin-bottom: .2em;

  @media screen and (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 500;
  color: #fff;
  margin: 0;
  margin-bottom: 2em;

  @media screen and (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const ProtocolName = styled.span`
  color: rgb(${props => props.theme.primary});
`;

const IdentityCard = styled(Card)`
  position: relative;
  width: 420px;
  margin: 0 auto;

  @media screen and (max-width: 768px) {
    width: calc(100% - 2rem);
  }
`;

const Tabs = styled.div`
  display: flex;
  justify-content: center;
`;

const TabWrapper = styled.div`
  margin: 0px 4px;
  cursor: pointer;
  height: 80px;
`;

interface TabProps {
  active: boolean;
}

const Tab = styled.div<TabProps>`
  display: flex;
  items-align: center;
  justify-content: center;
  user-select: none;
  width: 125px;
  font-size: 0.9rem;
  padding: 16px;
  border-radius: 3px;
  color: rgb(${props => props.theme.primary + ", .45)"};
  transition: all .23s ease-in-out;
  ${props => props.active && `
    color: rgb(${props.theme.primary + ", .95)"};
    border-bottom: 8px solid rgb(${props.theme.primary + ", .95)"};
  `}
  &:hover{
    color: rgb(${props => props.theme.primary + ", .75)"};
    border-color: rgb(${props => props.theme.primary + ", .75)"};
  }
`;

const ContentTitle = styled.div`
  color: gray;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1em;
  text-align: center;
`;

const ComingSoon = styled.div`
  position: relative;
  z-index: 5;
`;

const ComingSoonText = styled.div`
  position: absolute;
  user-select: none;
  color: white;
  z-index: 10;
  width: 100%;
  height: 100%;
  font-size: 1.2rem;
  font-weight: 700;
  padding-top: 8px;
  text-align: center;
  backdrop-filter: blur(1px);
  background-color: rgba(0, 0, 0, 0.1);
`;

const TGGroupInput = styled.input`
  width: 100%;
  border: none;
  padding: 16px 11px;
  border-radius: 8px;
  font-size: .9rem;
  margin-right: 1em;
  color: white;
  font-family: monospace;
  cursor: not-allowed;
  background-color: rgb(${props => props.theme.primary + ", .08)"};
  transition: all .18s ease-in-out;
  &:focus {
    box-shadow: 0 0 0 2px rgba(${props => props.theme.primary}, .5);
  }
  @media screen and (max-width: 280px) {
    margin-right: 0;
    width: 90%;
    margin-top: 1em;
    margin-bottom: 2em;
  }
`;

const FormWrapper = styled.div`
  display: flex;
  align-items: center;
  @media screen and (max-width: 280px) {
    flex-direction: column;
  }
`

const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1c1e23;
  border-radius: 20px;
  padding: .8rem .75rem;
  cursor: text;
`;

const WalletChainLogo = styled.div`
  display: flex;
  align-items: center;
  gap: .75rem;
  font-size: 1.1rem;
  color: #fff;
  font-weight: 500;
`;

const ChainName = styled.div`
  font-size: 0.9em;
  display: flex;
  align-items: flex-end;
  gap: .25rem;
`;

const ChainTicker = styled.span`
  font-size: .9em;
  color: ${props => props.theme.secondaryText};
  text-transform: uppercase;
`;

const LinkSymbol = styled.div`
  width: 1.95rem;
  height: 1.95rem;
  border-radius: 10px;
  background-color: #1c1e23;
  color: ${props => props.theme.secondaryText};
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 0 auto;

  svg {
    font-size: 1em;
    width: 1em;
    height: 1em;
  }
`;

const Permanent = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    width: 40vw;
  }
`;

const FAQCard = styled(Card)`
  padding: 0;
  width: 70vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    width: 100%;
  }
`;

const CoinbaseButton = styled(Button)`
  background-color: #fff;
  color: #1652f0;
`;

const WalletConnectButton = styled(Button)`
  background-color: #fff;
  color: #2b6cb0;
`;

const MetamaskButton = styled(Button)`
  background-color: #CD6116;
  color: #fff;
`;

const Status = styled.div<{ type: StatusType }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 12px;
  color: ${props => props.theme.secondaryText};
  border: 2px solid ${props => props.type === "error" ? "#ca0000" : "#00ff00"};
  font-weight: 400;
  width: 50%;
  font-size: 1rem;
  margin: 0 auto;

  p {
    margin: 0;
  }
  
  span {
    font-weight: 500;
    color: ${props => props.type === "error" ? "#ca0000" : "#00ff00"};
    text-transform: uppercase;
    margin-right: .4rem;
  }

  @media screen and (max-width: 720px) {
    width: unset;
  }
`;

const CloseStatusIcon = styled(CloseIcon)`
  font-size: 1.2em;
  width: 1em;
  height: 1em;
  color: ${props => props.theme.secondaryText};
  cursor: pointer;
  transition: all .23s ease-in-out;

  &:hover {
    opacity: .83;
  }

  &:active {
    transform: scale(.93);
  }
`;

const ConnectButton = styled(Button)`
  padding-left: 2.5rem;
  padding-right: 2.5rem;

  @media screen and (max-width: 720px) {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

type StatusType = "error" | "success";

const LinkingInProgress = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(3px);

  p {
    margin: 1rem;
    font-size: 1rem;
    color: ${props => props.theme.secondaryText};
    font-weight: 500;
    text-align: center;
    max-width: 80%;
  }
`;

export default Home;
