import axios from 'axios';
import type { NextPage } from "next";
import RainbowKitButton from '../components/RainbowKitButton';
import { useAccount, useNetwork } from 'wagmi';
import { usePrepareContractWrite, useContractWrite } from 'wagmi';
import { CloseIcon, LinkIcon } from "@iconicicons/react"
import { useArconnect } from "../utils/arconnect"
import NearConnect, { useNear } from "../utils/near";
import Card, { CardSubtitle } from "../components/Card";
import { Modal, useModal, Close } from "../components/Modal";
import { formatAddress } from "../utils/format";
import { useEffect, useState } from "react";
import { ACTIVE_NETWORK_STORE, Identity, Address, NETWORKS } from "../utils/constants";
import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import { useRouter } from 'next/router'
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
import Footer from "../components/Footer";
import Network, { ExoticNetwork } from "../components/Network";
import Toggle from '../components/Toggle';
import { EXMHandleNetworks } from '../utils/exm';
import ArkNetwork from "../assets/ArkNetwork.json";
import { BellAlertIcon } from '@heroicons/react/24/solid';

const Home: NextPage = () => {
  const downloadWalletModal = useModal();
  const { address: ethereumAddress } = useAccount();
  const { chain: currentChain } = useNetwork();
  const [arweaveAddress, connect, disconnect, arconnectError] = useArconnect(downloadWalletModal);

  const [activeNetwork, setActiveNetwork] = useState<number>(1);
  const [activeExoticNetwork, setActiveExoticNetwork] = useState<string>("NEAR-MAINNET");
  const [previousNetwork, setPreviousNetwork] = useState<number>(1);
  const [networkLoaded, setNetworkLoaded] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [EXMState, setEXMState] = useState<any>();
  const [convertedNetworks, setConvertedNetworks] = useState<any>()
  const [EXMObject, setEXMObject] = useState<any>();
  const [status, setStatus] = useState<{ type: StatusType, message: string }>();

  const { config, error } = usePrepareContractWrite({
    address: '0xdE44d3fB118E0f007f2C0D8fFFE98b994383949A',
    abi: ArkNetwork.abi,
    functionName: 'linkIdentity',
    args: [arweaveAddress || ''],
  })
  const { data: ethData, isLoading, isSuccess, write } = useContractWrite(config)

  const { modal, selector, accounts, account, accountId, loading, linkNear, checkNearLinking, getAccount } = useNear();

  // load if already linked or in progress
  const [linkingOverlay, setLinkingOverlay] = useState<"linked" | "address-mismatch">();

  // linking functionality
  const [linkStatus, setLinkStatus] = useState<string>();
  const [linkModal, setLinkModal] = useState<boolean>(true);
  const [isEVM, setIsEVM] = useState<boolean | null>(null);

  const router = useRouter()
  const {evm} = router.query; // returns true or false, or null

  async function link() {
    setStatus(undefined);
    setLinkModal(true);

    if (!!linkingOverlay) {
      return setStatus({
        type: "error",
        message: "Already linked one of the addresses on this network"
      });
    }

    if (!arweaveAddress) {
      return setStatus({
        type: "error",
        message: "Arweave not connected"
      });
    }

    if (isEVM && (!arweaveAddress || !ethereumAddress)) {
      return setStatus({
        type: "error",
        message: "Arweave or Ethereum not connected"
      });
    } else if (!isEVM) {
      if (!arweaveAddress || !accountId) {
        return setStatus({
          type: "error",
          message: "Arweave or NEAR not connected"
        });
      }
    }

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

      setTimeout(() => setLinkStatus("Interacting with the smart contract..."), 1000);

      let EVMInteraction;
      let ExoticInteraction;
      if (isEVM) {
        write?.();
      } else if (!isEVM) {
        // const nearLinkingTXHash = localStorage.getItem("nearLinkingTXHash");
        // const linkedNearAccount = localStorage.getItem("nearAccount");

        // in case EXM is down again, we save the linking TX hash and the linked account in local storage
        //ExoticInteraction = nearLinkingTXHash;
        if (!arweaveAddress) return;
        ExoticInteraction = await linkNear(arweaveAddress);
        if (!ExoticInteraction || !ExoticInteraction?.transaction?.hash) {
          return setStatus({
            type: "error",
            message: "NEAR linking failed, check if you have enough NEAR"
          });
        } else {
          ExoticInteraction = ExoticInteraction?.transaction?.hash;
          localStorage.setItem("nearLinkingTXHash", ExoticInteraction);
          // @ts-ignore
          localStorage.setItem("nearAccount", accountId);  
        }
      }

      const EXMObject: any = {
        "function": "linkIdentity",
        "caller": arweaveAddress,
        "jwk_n": arconnectPubKey,
        "sig": signedBase,
        "address": "",
        "network": "",
        "verificationReq": "",
      }

      if (isEVM) {
        EXMObject.address = ethereumAddress;
        setEXMObject(EXMObject);
        return;
      } else {
        EXMObject.address = accountId;
        EXMObject.network = activeExoticNetwork;
        EXMObject.verificationReq = ExoticInteraction;
      }

      setLinkStatus("Writing to Arweave...");

      console.log(EXMObject)

      const result = await axios.post(`api/exmwrite`, EXMObject);

      console.log(result);

      setLinkStatus("Linked");
      setStatus({
        type: "success",
        message: "Linked identity"
      });
      setLinkingOverlay("linked");
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
    const sendToEXM = async () => {
      if (!currentChain) return;

      const exmObj = {
        ...EXMObject,
        "network": NETWORKS[currentChain.id].networkKey,
        "verificationReq": ethData?.hash,
      }
  
      const result = await axios.post(`api/exmwrite`, exmObj);
      if (result.status === 200) {
        setLinkStatus("Linked");
        setStatus({
          type: "success",
          message: "Linked identity"
        });
        setLinkingOverlay("linked");  
      }
    }
    if (isSuccess) sendToEXM()
  }, [ethData, isSuccess, EXMObject])

  // LINKING STATUS + CHECK EXISTING LINKS

  useEffect(() => {
    // TODO: don't just fetch once; subscribe!
    // checkNearLinking()?.then(value => {
    //   if (value.length > 4) {
    //     setNearLinkingTX(newVal)
    //   }
    // });
  }, [account]);


  useEffect(() => {
    (async () => {
      if (!arweaveAddress) return;

      try {
        if (!arweaveAddress) return setLinkingOverlay(undefined);
        const res = await axios.get('api/exmread');
        const { identities } = res.data;

        // const identityOnArweave = identities.find((identity: Identity) => identity.is_verified && identity.arweave_address === address);
        const identityOnEVM = identities.find((identity: Identity) => identity?.addresses?.find((address: Address) => address.address === ethereumAddress && address.is_verified))
        const identityOnExotic = identities.find((identity: Identity) => identity?.addresses?.find((address: Address) => address.address === accountId && address.is_verified))

        if (isEVM ? !identityOnEVM: !identityOnExotic) return setLinkingOverlay(undefined)
        if (isEVM ? identityOnEVM.arweave_address === arweaveAddress: identityOnExotic.arweave_address === arweaveAddress) {
          setLinkModal(true)
          return setLinkingOverlay('linked')
        } else {
          setLinkModal(true)
          return setLinkingOverlay('address-mismatch')  
        }
      } catch (e) {
        console.log(e)
       }
    })();
  }, [isEVM, arweaveAddress, activeNetwork, activeExoticNetwork]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('api/exmread');
      const data = res.data;
      setEXMState(data)
      const converted = EXMHandleNetworks([...data.evm_networks, ...data.exotic_networks])
      setConvertedNetworks(converted)
    }
    fetchData()
  }, [])

  // DEV MODE FOR EXTRA TESTNETS and other stuff
  useEffect(() => {
    if (window.location.href.includes("localhost")) {
      setIsDevMode(true)
    }
  }, []);

  // TODO: pray to God and re-write this mess
  useEffect(() => {
    const localStorageIsEVM = localStorage.getItem("isEVM")
    if (!localStorageIsEVM) {
      if (evm === "false") {
        setIsEVM(false)
        localStorage.setItem("isEVM", "false")
      } else if (evm === "true") {
        setIsEVM(true)
        localStorage.setItem("isEVM", "true")
      } else {
        setIsEVM(true)
        localStorage.setItem("isEVM", "true")        
      }
      return
    }
    if (evm) {
      if (evm === "false") {
        setIsEVM(false)
      } else if (evm === "true") {
        setIsEVM(true)
      }
    } else {
      if (localStorageIsEVM === "false") {
        setIsEVM(false)
      } else if (localStorageIsEVM === "true") {
        setIsEVM(true)
      }
    }
  }, [evm])

  useEffect(() => {
    if (isEVM === null) return
    if (isEVM) {
      localStorage.setItem("isEVM", "true")
    }
    if (!isEVM) {
      localStorage.setItem("isEVM", "false")
    }
  }, [isEVM])

  const linkButtonIsDisabled = arweaveAddress && isEVM ? (!ethereumAddress || !!linkingOverlay)
    : (!account || !!linkingOverlay);

  const chainInfo = convertedNetworks ? 
    // @ts-ignore
    convertedNetworks[isEVM ? NETWORKS[activeNetwork].networkKey: activeExoticNetwork]
    :
    undefined;

  return (
    <>
      <TopBanner>
        Connect wallet and switch network to use Ark on Avalanche, BNB, Aurora, and more.
      </TopBanner>
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
      <TopSection>
        <ARKLogo>
          <Image className="rounded-2xl" src="/arkArt.jpg" width={300} height={300} priority={true} draggable={false} />
        </ARKLogo>
        <TopContent>
          <Title>
            <ProtocolName>
              Ark
            </ProtocolName>
            Protocol
            <ProtocolName className="text-[46px]">
              <> </>V2
            </ProtocolName>
          </Title>
          <Subtitle>
            The multichain identity protocol for web3 social
          </Subtitle>
          <div className="flex gap-x-5 group text-xl">
            <a href="#faq">
              <ReadMoreButton>
                What is Ark?
              </ReadMoreButton>
            </a>
            <Link href={'/migrate'}>
              <a>
                <SecondaryButton>
                  V1 -&gt; V2 Migration 🛸
                </SecondaryButton>
              </a>
            </Link>
          </div>
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
          <div className="flex justify-between">
            <CardSubtitle>
              Link identity
            </CardSubtitle>
            {linkingOverlay && (
              <button 
                className="bg-[#26bfa8] animate-pulse rounded-full w-2 h-2"
                onClick={() => setLinkModal(true)}
              ></button>
            )}
          </div>
          <Spacer y={1.25} />
          <div className="flex items-center justify-center items-row text-white gap-x-4">
            <div className={`cursor-pointer ${isEVM && ""}`} onClick={() => setIsEVM(true)}>{"EVM"}</div>
            <Toggle enabled={isEVM} setEnabled={setIsEVM} />
            <div className={`cursor-pointer ${!isEVM && ""}`} onClick={() => setIsEVM(false)}>{"NEAR"}</div>
          </div>
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
            {(arweaveAddress && <ANS address={arweaveAddress} onClick={() => disconnect()} />) || (
              <ConnectButton
                secondary
                onClick={() => connect()}
              >
                {arconnectError ? arconnectError : 'Connect'}
              </ConnectButton>
            )}
          </WalletContainer>
          <Spacer y={1} />
          <LinkSymbol>
            <LinkIcon />
          </LinkSymbol>
          <Spacer y={1} />
          <WalletContainer>
            {!isEVM && (
              <WalletChainLogo>
                {chainInfo &&
                  <>
                    <Image src={chainInfo.iconURL} width={30} height={30} draggable={false} />
                    <ChainName>
                      {chainInfo.name}
                      <ChainTicker>
                        {chainInfo.ticker}
                      </ChainTicker>
                    </ChainName>
                  </>
                }
              </WalletChainLogo>

            )}
            {isEVM ?
              <div className="w-full"><RainbowKitButton /></div>
              :
              <NearConnect modal={modal} selector={selector} account={account} accountId={accountId} loading={loading} />
            }
          </WalletContainer>
          <Spacer y={2.5} />
          <Button secondary fullWidth disabled={linkButtonIsDisabled} onClick={() => link()}>
            {linkStatus && <Loading />}
            {linkStatus || "Link identity"}
          </Button>
          <AnimatePresence>
            {!!linkingOverlay && linkModal && (
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
                {(linkingOverlay === "address-mismatch") && (
                  <p>
                    🤔 Looks like this {chainInfo?.name} address has already been connected to arweave address {
                      formatAddress(
                        EXMState?.identities?.find((identity: Identity) => 
                          identity?.addresses?.find((address: Address) => 
                            (isEVM ? (address.address === ethereumAddress) : (address.address === accountId))
                          )
                        ).arweave_address || ""
                      )
                    }
                  </p>
                )}
                {(linkingOverlay === "linked" && (
                  <>
                    <p className="">
                      🥳 Congratulations! You have linked your {chainInfo?.name} address to Ark!
                    </p>
                    <p>Tweet a screenshot of this page at <a 
                        href={`
                          https://twitter.com/intent/tweet?text=I+am+whitelisting+for+the+Arweave+Name+Services+mint+on+Feb+17+with+address+${arweaveAddress}+%21
                        `}
                        className="twitterLink"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >@decentdotland</a> to be whitelisted for some future rewards. ✨</p>
                  </>
                ))}
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
      {!isEVM && (
        <ExoticNetwork onChange={() => setActiveExoticNetwork} value={activeExoticNetwork} isDisabled={false} />
      )}
      <Footer />
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
  visibility: hidden;
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

const SecondaryButton = styled(Button)`
  font-size: 0.95rem;
  padding: 0.47rem;
  background: none;
  color: #fff;
  border: 2px;
  border-style: solid;
  border-color: rgb(${props => props.theme.primary});
  
  &:hover {
    background: rgb(${props => props.theme.primary});
    color: black;
    transition: background-color 100ms linear;
    transition: color 100ms linear;
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
  display: flex;
  flex-direction: column;
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

const CloseButton = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 0.5rem;
`;

export default Home;
