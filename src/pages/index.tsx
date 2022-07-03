import { CloseIcon, LinkIcon } from "@iconicicons/react"
import { arweave, useArconnect } from "../utils/arconnect"
import type { NextPage } from "next";
import Card, { CardSubtitle } from "../components/Card";
import { Modal, useModal } from "../components/Modal";
import { coinbaseWallet } from "../utils/connectors/coinbase";
import { walletConnect } from "../utils/connectors/walletconnect";
import { metaMask } from "../utils/connectors/metamask";
import { addHarmony } from "../utils/eth";
import { useWeb3React } from "@web3-react/core"
import { formatAddress } from "../utils/format";
import { useContext, useEffect, useState } from "react";
import { interactWrite } from "smartweave";
import { ACTIVE_NETWORK_STORE, ARWEAVE_CONTRACT, EVM_ORACLES, NETWORKS } from "../utils/constants";
import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import { run } from "ar-gql";
import { getName } from "../utils/connectors";
import { ConnectorContext } from "./_app";
import { ethers } from "ethers";
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
import ArkNetwork from "../assets/ArkNetwork.json";

const Home: NextPage = () => {
  // arweave
  const [address, connect, disconnect] = useArconnect();

  // ethereum
  const web3React = useWeb3React();
  const connector = web3React.hooks.usePriorityConnector();
  const ens = web3React.hooks.usePriorityENSName();
  const account = web3React.hooks.usePriorityAccount();
  const chainId = web3React.hooks.usePriorityChainId();
  const provider = web3React.hooks.usePriorityProvider();

  const { setActiveConnector, activeConnector } = useContext(ConnectorContext);

  // other states
  const [status, setStatus] = useState<{ type: StatusType, message: string }>();
  const ehtModal = useModal();

  // connect to wallet on connector change
  useEffect(() => {
    if (!activeConnector) return;
    console.log(getName(activeConnector));
  }, [activeConnector]);
  /*
  async function connectEth(connector) {
    try {
      await eth.connect(connector, activeNetwork);
      setActiveConnector(connector);
      ehtModal.setState(false);
      setStatus(undefined);
    } catch (e) {
      console.log("Failed to connect", e);
      setStatus({ type: "error", message: "Failed to connect" });
    }
  }*/

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

    if (!address) {
      return setStatus({
        type: "error",
        message: "Connect your Arweave wallet"
      });
    };

    if (!account || !chainId || !provider) {
      return setStatus({
        type: "error",
        message: "Connect your EVM compatible wallet"
      });
    } 

    try {
      setLinkStatus("Loading EVM contract...");
      
      // load Ark Protocol ETH contract
      const contract = new ethers.Contract(
        EVM_ORACLES[chainId],
        // @ts-ignore
        ArkNetwork.abi,
        provider.getSigner().connectUnchecked()
      );

      setLinkStatus("Interacting with EVM contract...");

      const interaction = await contract.linkIdentity(address);
      await interaction.wait();

      setLinkStatus("Writting to Arweave...");

      await interactWrite(arweave, "use_wallet", ARWEAVE_CONTRACT, {
        function: "linkIdentity",
        address: account,
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

  // active network
  const [activeNetwork, setActiveNetwork] = useState<number>(5);
  const [previousNetwork, setPreviousNetwork] = useState<number>(5);
  const [networkLoaded, setNetworkLoaded] = useState<boolean>(false);

  /*useEffect(() => {
    (async () => {
      const stored = localStorage.getItem(ACTIVE_NETWORK_STORE);

      // load saved network
      if (stored && !networkLoaded) {
        setActiveNetwork(Number(stored));
        setNetworkLoaded(true);
      } else {
        // save current network
        localStorage.setItem(ACTIVE_NETWORK_STORE, activeNetwork.toString());

        // reconnect with the new network
        if (account && activeConnector) {
          try {
            await eth.connect(activeConnector, activeNetwork);
          } catch (e: any) {
            if (e.code === 4902) {
              try {
                await addHarmony(activeConnector);
                await eth.connect(activeConnector, activeNetwork);
              } catch {
                setActiveNetwork(previousNetwork);
              }
            } else setActiveNetwork(previousNetwork);
          }
        }
      }
    })();
  }, [activeNetwork]);*/

  // load if already linked or in progress
  const [linkingOverlay, setLinkingOverlay] = useState<"in-progress" | "linked">();

  useEffect(() => {
    (async () => {
      if (!address) return;

      // check if linked
      try {
        const res = await fetch("https://thawing-lowlands-08726.herokuapp.com/ark/oracle/state");
        const { res: cachedState } = await res.clone().json();

        if (cachedState.find((identity: Record<string, any>) => (identity.arweave_address === address || identity.evm_address === account) && identity.ver_req_network === NETWORKS[activeNetwork].networkKey)) {
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
        <TopContent>
          <Title>
            <ProtocolName>
              Ark
            </ProtocolName>
            Protocol
          </Title>
          <Subtitle>
            The crosschain identity protocol for web3 social
          </Subtitle>
          <a href="#faq">
            <Button>
              Read More
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
        <IdentityCard>
          <Spacer y={.25} />
          <CardSubtitle>
            Link Identity
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
                Connect ANS
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
              <Image src="/eth.png" width={30} height={30} draggable={false} />
              <ChainName>
                Ethereum
                <ChainTicker>
                  Eth
                </ChainTicker>
              </ChainName>
            </WalletChainLogo>
            <ConnectButton secondary style={{ textTransform: web3React.isActive ? "none" : undefined }} onClick={() => {
              if (!web3React.isActive) {
                ehtModal.setState(true)
              } else if (connector.deactivate) {
                connector.deactivate();
              }
            }}>
              {(web3React.isActive && (
                <>
                  <Image src={`/${getName(web3React.connector)}.png`} width={25} height={25} draggable={false} />
                  {ens || formatAddress(account, 8)}
                </>
              )) || "Verify identity"}
            </ConnectButton>
          </WalletContainer>
          <Spacer y={2.5} />
          <Button secondary fullWidth disabled={!(address && account)} onClick={() => link()}>
            {linkStatus && <Loading />}
            {linkStatus || "Submit"}
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
                )) || <p>Linking in progress 🤔. Check back later...</p>}
              </LinkingInProgress>
            )}
          </AnimatePresence>
        </IdentityCard>
        <Spacer y={4} />
        <Permanent href="https://arweave.org" target="_blank" rel="noopener noreferer">
          <Image src="/permanent.svg" width={150} height={75} />
        </Permanent>
        <Spacer id="faq" y={4} />
        <FAQCard>
          <Spacer y={1.5} />
          <Title style={{ textAlign: "center" }}>F.A.Q.</Title>
          <Spacer y={1.5} />
          <Faq title="What is Ark Protocol?">
            Ark is a multichain identity linking protocol built to power decent.land, ANS, and any other application or protocol layers that relies on users linking multiple other wallets to one identity on Arweave.
          </Faq>
          <Faq title="Why did you build Ark?">
            decent.land is a collection of social and identity primitives built on Arweave to support the creation of token-gated social networks and groups. The core contracts live on Arweave for permanent storage of any size data, but interact with other chains to build a chain-agnostic way to save your identity and control access to DAO discussions and governance.
            <Spacer y={.5} />
            Ark is our way to verifiable associate any number of Ethereum addresses with an Arweave wallet or ANS profile, and makes it so our other protocols can read token holdings and activity from Ethereum
          </Faq>
          <Faq title="What do I need to start?">
            You need the <a href="https://arconnect.io" target="_blank" rel="noopener noreferrer">ArConnect extension</a> to get an Arweave wallet and sign Arweave transactions. It should have enough AR for the interaction, e.g. 0.01 AR.
            <Spacer y={.5} />
            You need either <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">Metamask</a>, <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">Coinbase Wallet</a> or a Wallet Connect compatible Ethereum wallet extension and a wallet on Ethereum mainnet, with enough ETH for gas, e.g. 0.003 ETH.
            <Spacer y={.5} />
            Connect both wallets on the UI, confirm the transactions, and wait for the data to populate on Arweave.
          </Faq>
          <Faq title="What can I do once my identities are linked with Ark?">
            We are building token-gating protocols for both Telegram and the upcoming decent.land web app. We are also working on aggregation of multichain data for the ANS identity layer, to show activity from any chain on your own ar.page profile.
            <Spacer y={.5} />
            Early Ark adopters may be eligible for future beta testing opportunities as we expand the set of protocols and use cases
          </Faq>
        </FAQCard>
      </Page>
      <Modal title="Choose a wallet" {...ehtModal.bindings}>
        <CoinbaseButton onClick={() => setActiveConnector(coinbaseWallet)} fullWidth>
          <Image src="/coinbase.png" width={25} height={25} />
          Coinbase Wallet
        </CoinbaseButton>
        <Spacer y={1} />
        <WalletConnectButton onClick={() => setActiveConnector(walletConnect)} fullWidth>
          <Image src="/walletconnect.png" width={25} height={25} />
          Wallet Connect
        </WalletConnectButton>
        <Spacer y={1} />
        <MetamaskButton onClick={() => setActiveConnector(metaMask)} fullWidth>
          <Image src="/metamask.png" width={25} height={25} />
          Metamask
        </MetamaskButton>
      </Modal>
      <Network value={activeNetwork} onChange={(e) => setActiveNetwork((val) => {
        setPreviousNetwork(val);
        return Number(e.target.value);
      })} />
    </>
  );
}

const TopSection = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4.5rem 0;
  overflow: hidden;
  z-index: 0;
`;

const TopContent = styled.div`
  display: flex;
  text-align: center;
  align-items: center;
  flex-direction: column;
  width: max-content;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: ${props => props.theme.secondaryText};
  line-height: 1.1em;
  margin: 0;
  margin-bottom: .2em;

  @media screen and (max-width: 720px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 500;
  color: #fff;
  margin: 0;
  margin-bottom: 2em;

  @media screen and (max-width: 720px) {
    font-size: 1rem;
  }
`;

const ProtocolName = styled.span`
  color: rgb(${props => props.theme.primary});
`;

const IdentityCard = styled(Card)`
  position: relative;
  width: 33vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    width: calc(100% - 2rem);
  }
`;

const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1c1e23;
  border-radius: 20px;
  padding: .8rem 1.25rem;
  width: calc(100% - 1.25rem * 2);
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
  display: flex;
  align-items: flex-end;
  gap: .25rem;
`;

const ChainTicker = styled.span`
  font-size: .95em;
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
  background-color: #1652f0;
`;

const WalletConnectButton = styled(Button)`
  background-color: #fff;
  color: #2b6cb0;
`;

const MetamaskButton = styled(Button)`
  background-color: #fff;
  color: #000;
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
    padding-left: 1.1rem;
    padding-right: 1.1rem;
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
    margin: 0;
    font-size: 1rem;
    color: ${props => props.theme.secondaryText};
    font-weight: 500;
    text-align: center;
    max-width: 80%;
  }
`;

export default Home;
