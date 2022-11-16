import axios from 'axios';
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
import { ACTIVE_NETWORK_STORE, Identity, Address, NETWORKS, TEST_NETWORKS } from "../utils/constants";
import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
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
import Fantom from "../assets/fantom.png"
import Optimism from "../assets/optimism.svg"
import Polygon from "../assets/polygon.webp"
import Arbitrum from "../assets/arbitrum.svg"

const Migrate: NextPage = () => {
  const downloadWalletModal = useModal();
  const ethModal = useModal();
  const [address, connect, disconnect, arconnectError] = useArconnect(downloadWalletModal);

  const [activeNetwork, setActiveNetwork] = useState<number>(1);
  const [previousNetwork, setPreviousNetwork] = useState<number>(1);
  const [networkLoaded, setNetworkLoaded] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  const [status, setStatus] = useState<{ type: StatusType, message: string }>();
  const [activeConnector, setActiveConnector] = useState<ETHConnector>();
  const eth = useETH(setActiveConnector, activeNetwork);

  const [EXMUsers, setEXMUsers] = useState<Identity[]>([]);
  const [legacyUsers, setLegacyUsers] = useState<any>();
  const [verificationReq, setVerificationReq] = useState<string>();
  const [verificationNetwork, setVerificationNetwork] = useState<string>();
  const [eligibleForPOAP, setEligibleForPOAP] = useState<string>(); // users arweave address to interface with poaps
  const [poapURL, setPoapURL] = useState<string>(); // url to claim poap

  // load if already linked or in progress
  const [linkingOverlay, setLinkingOverlay] = useState<"just-linked" | "linked-on-exm" | "linked-on-v1" | "not-linked-on-v1" | "testnets-deprecated">();

  // linking functionality
  const [linkStatus, setLinkStatus] = useState<string>();
  const [linkModal, setLinkModal] = useState<boolean>(true);

  const isTestnet = (req: string | undefined) => Object.keys(TEST_NETWORKS).map((obj: any) => { return TEST_NETWORKS[obj]?.networkKey }).includes(req || "")

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

  // LINKING STATUS
  
  async function link() {
    setStatus(undefined);
    setLinkModal(true);

    if (linkingOverlay === "just-linked" || linkingOverlay === "linked-on-exm") {
      return setStatus({
        type: "error",
        message: "Already linked one of the addresses on this network (EXM)"
      });
    }

    if (!address || !eth.address || !eth.contract) {
      return setStatus({
        type: "error",
        message: "Arweave or Ethereum not connected"
      });
    };

    setLinkingOverlay(undefined);

    try {
      setLinkStatus("Generating a signature...");

      const arconnectPubKey = await window.arweaveWallet.getActivePublicKey();  
      if (!arconnectPubKey) throw new Error("ArConnect public key not found");

      const data = new TextEncoder().encode(`my pubkey for DL ARK is: ${arconnectPubKey}`);
      const signature = await window.arweaveWallet.signature(data, {
        name: "RSA-PSS",
        saltLength: 32,
      });
      const signedBase = Buffer.from(signature).toString("base64");
      console.log("signedBase", signedBase);
      if (!signedBase) throw new Error("ArConnect signature not found");

      let interaction;

      if (!verificationReq && !isTestnet(verificationNetwork)) {
        setTimeout(() => setLinkStatus("Interacting with Ethereum smart contract..."), 1000);

        interaction = await eth.contract.linkIdentity(address);
        await interaction.wait();
      }

      interaction = interaction?.hash || verificationReq;

      console.log(interaction)
      setLinkStatus("Writing to Arweave...");

      const result = await axios.post(`api/exmwrite`, {
        "function": "linkIdentity",
        "caller": address,
        "address": eth.address,
        "network": NETWORKS[activeNetwork].networkKey,
        "jwk_n": arconnectPubKey,
        "sig": signedBase,
        "verificationReq": interaction
      })

      console.log(result);

      setLinkStatus("Re-linked to Ark V2!");
      setStatus({
        type: "success",
        message: "Linked identity"
      });
      setLinkingOverlay("just-linked");
    } catch (e) {
      console.log("Failed to link", e);

      setStatus({
        type: "error",
        message: "Could not link account"
      });
    }

    setLinkStatus(undefined);
  }


  const checkLinkingStatus = async () => {
    if (!address) return;

    try {
      let legacyIdentities;
      if (!legacyUsers) {
        const legacyUsersData = await axios.get('https://ark-api.decent.land/v1/oracle/state');
        legacyIdentities = legacyUsersData.data?.res;
        setLegacyUsers(legacyIdentities);
      } else legacyIdentities = legacyUsers;

      const userOnLegacy: any = legacyIdentities.find((identity: any) =>
        identity.is_verified &&
        identity.arweave_address === address);
      if (userOnLegacy) {
        setEligibleForPOAP(address);
        setLinkingOverlay("linked-on-v1");
      } else {
        setLinkingOverlay("not-linked-on-v1");
      }

      let EXMIdentities = EXMUsers;

      if (EXMUsers?.length === 0) {
        const EXMUsersData = await axios.get('api/exmread');
        EXMIdentities = EXMUsersData.data?.identities;
        setEXMUsers(EXMIdentities);
      }

      const userIsOnEXM = EXMIdentities.find((identity: Identity) =>
        identity.is_verified &&
        identity.arweave_address === address);
        debugger;

      if (userIsOnEXM) return setLinkingOverlay("linked-on-exm");
    } catch { }
  }

  useEffect(() => {
    checkLinkingStatus();
  }, [address, activeNetwork]);

  useEffect(() => {
    (async () => {
      const poapURL = await axios.post(`api/getpoapurl`, {
        "arweave_address": address,
      })
      const url = poapURL.data;
      if (url) setPoapURL(url); 
    })()
  }, [eligibleForPOAP])

  // EVM NETWORK SWITCHING

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
          await checkLinkingStatus();
        }
      }
    })();
  }, [activeNetwork]);



  // DEV MODE FOR EXTRA TESTNETS
  useEffect(() => {
    if (window.location.href.includes("localhost")) {
      setIsDevMode(true)
    }
  }, []);

  return (
    <>
      <TopBanner>
        Connect wallet and switch network to use Ark on Avalanche, BNB, Aurora, and Goerli
      </TopBanner>
      <Head>
        <title>Migrate Your Profile!</title>
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
      <TopSection>
        <TopContent className="max-w-[360px]">
          <Title className='text-xs'>
            Migrate from Ark V1 to Ark V2!
          </Title>
          <Subtitle>
            Ark V1 has been deprecated, but not to worry: you can still re-link your identity to Ark V2 for free.
          </Subtitle>
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
                {arconnectError ? arconnectError : 'Connect'}
              </ConnectButton>
            )}
          </WalletContainer>
          <Spacer y={1.25} />
          <Button secondary fullWidth disabled={!(address && eth.address && linkingOverlay !== "linked-on-exm" && linkingOverlay !== "just-linked" && linkingOverlay !== 'not-linked-on-v1')} onClick={() => link()}>
            {linkStatus && <Loading />}
            {linkStatus || "Re-link to Ark V2"}
          </Button>
          <AnimatePresence>
            {!!linkingOverlay && linkingOverlay !== "linked-on-v1" && linkModal && (
              <LinkingInProgress
                initial="transparent"
                animate="visible"
                exit="transparent"
                variants={opacityAnimation}
                transition={{ duration: 0.23, ease: "easeInOut" }}
              >
                <CloseButton>
                  <Close onClick={() => setLinkModal(false)} />
                </CloseButton>
                <p className="flex flex-col justify-center items-center gap-y-6">
                  {linkingOverlay === "linked-on-exm" && "You've already linked on V2, no need to link again 😃"}
                  {linkingOverlay === "not-linked-on-v1" && "You haven't linked your identity on Ark V1. Feel free to link it on V2 instead!"}
                  {linkingOverlay === "just-linked" && "🥳 Congratulations! You have successfully re-linked your identity to Ark V2!"}                  
                  <Link href="/">
                    <a>
                      <Button>
                        Go To Homepage
                      </Button>
                    </a>
                  </Link>
                </p>
                {/* <p>Tweet a screenshot of this page and <a href="https://twitter.com/decentdotland" className="twitterLink" target="_blank" rel="noopener noreferrer">@decentdotland</a> to be whitelisted for some future rewards. ✨</p> */}
              </LinkingInProgress>
            )}
          </AnimatePresence>
        </IdentityCard>
        <Spacer y={4} />
        {eligibleForPOAP && (
          <IdentityCard>
            <p className="text-[#d3d3d3] text-center font-medium">
              You're eligible to collect your Ark Protocol Early Adopters POAP!
              <div className="my-6"></div>
              <Link href={poapURL || "/"} target="_blank">
                <a>
                  <Button secondary fullWidth>
                    Claim!
                  </Button>
                </a>
              </Link>
            </p>
          </IdentityCard>
        )}
      </Page>
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

const TopBanner = styled.div`
  background-color: #141316;
  color: #f18d1f;
  padding: 1em;
  font-size: 0.9rem;
  text-align: center;
`;

const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  row-gap: 0.5em;
  justify-content: space-between;
  background-color: #1c1e23;
  border-radius: 20px;
  padding: .8rem .75rem;
  cursor: text;
`;

const WalletChainLogo = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: .75rem;
  font-size: 1.1rem;
  color: #fff;
  font-weight: 500;
  width: max-content;
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

const ReadMoreButton = styled(Button)`
  font-size: 0.95rem;
  padding: 0.6rem;
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
  font-size: 0.8rem;
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
  padding-left: 1.5rem;
  padding-right: 1.5rem;

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
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  p {
    padding: 0rem 1rem;
    font-size: 1rem;
    color: ${props => props.theme.secondaryText};
    font-weight: 500;
    text-align: center;
  }
`;

const CloseButton = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 0.5rem;
`;

export default Migrate;
