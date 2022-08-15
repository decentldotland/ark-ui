import { CloseIcon, LinkIcon } from "@iconicicons/react";
import { arweave, useArconnect } from "../utils/arconnect";
import CryptoJS from "crypto-js";
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
import { 
  ACTIVE_NETWORK_STORE, 
  ARWEAVE_CONTRACT,
  GUILDS_REGISTRY_CONTRACT,
  NETWORKS,
  SUPPORTED_TOKENS,
  ArkTagsLinkEVMIdentity,
  ArkTagsCreateGuild,
  TELEGRAM_BOT_NAME,
  TELEGRAM_USERNAME_REGEX
} from "../utils/constants";

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
import Network, { Select } from "../components/Network";
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
  const [Tokenselected, setTokenselected] = useState<number>(0);
  const [previousNetwork, setPreviousNetwork] = useState<number>(1);

  const [networkLoaded, setNetworkLoaded] = useState<boolean>(false);

  const [status, setStatus] = useState<{ type: StatusType, message: string }>();
  const [telegramStatus, setTelegramStatus] = useState<{ type: TelegramStatusType, message: string}>();
  const [guildCreationStatus, setGuildCreationStatus] = useState<string>();
  const [guildCreationInProgress, setGuildCreationInProgress] = useState<boolean>();
  const [activeConnector, setActiveConnector] = useState<ETHConnector>();
  const eth = useETH(setActiveConnector, activeNetwork);

  // linking functionality
  const [linkStatus, setLinkStatus] = useState<string>();
  const [linkModal, setLinkModal] = useState<boolean>(true);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [previousStep, setPreviousStep] = useState<number>(1);
  const [allowedStep, setAllowedStep] = useState<number>(1);
  const maxSteps = 3;
  const [animateRight, setAnimateRight] = useState<boolean>(true)
  const [instructionsVisible, setInstructionsVisible] = useState<boolean>(false);
  const [telegramUsernameInput, setTelegramUsernameInput] = useState<string>();
  const [verifiedIdentities, setVerifiedIdentities] = useState<any[]>([]);

  const [user, setUser] = useState<any>();
  const [copied, setCopied] = useState<boolean>(false);
  const guildCreationModal = useModal();  

  useEffect(() => {
    fetch('https://ark-api.decent.land/v1/oracle/state').then(res => res.json()).then(res => {
      const verifiedIdentities = res.res;
      const foundUser = verifiedIdentities.find((user:any, idx:number) => user.arweave_address === address || user.evm_address === eth.address);
      if (!foundUser) return 
      setUser(foundUser);
    })
  }, [address, eth.address]);

  useEffect(() => {
    let cb = () => {
      switch (user) {
        case user?.telegram?.is_verified && user?.telegram?.is_evaluated: return 3
        case user?.telegram?.username || linkStatus == 'linked': return 2
        default: return 1
      }
    }

    setPreviousStep(cb())
    setCurrentStep(cb())
    setAllowedStep(cb())
  }, []);

  const encrypt = (string:any, key:any) => {
    return CryptoJS.AES.encrypt(string, key).toString();
  }
  const decrypt = (string:any, key:any) => {
    return CryptoJS.AES.decrypt(string, key).toString(CryptoJS.enc.Utf8);
  }

  async function handleTelegramUsernameUpload() {
    if (!address || !telegramUsernameInput) return;
    const re = TELEGRAM_USERNAME_REGEX;
    let error = null;
    if (telegramUsernameInput.length < 5) error = {type: "error", message: "Username too short."};
    else if (!re.test(telegramUsernameInput)) error = {type: "error", message: "Telegram username is invalid."};
    else if (!eth || !eth.address) error = {type: "error", message: "Connect an Ethereum wallet"}  
    else if (!address) error = {type: "error", message: "Connect an Arweave wallet"};
    else if (user && (!(user.evm_address === eth.address) || !(user.arweave_address === address))) error = {type: "error", message: "Address mismatch"};
    if (error) {
      // @ts-ignore
      setTelegramStatus(error);
      return
    };

    const cipheredUsername = encrypt(telegramUsernameInput, address);
    try {
      const query:any = {
        function: "linkEvmIdentity",
        telegram_enc: cipheredUsername,
      };
      if (!user) {
        setLinkStatus("Interacting with smart contract...");
        // @ts-ignore
        const interaction = await eth.contract.linkIdentity(address);
        await interaction.wait();
        setLinkStatus("Writing to Arweave...");
        query['address'] = eth.address;
        query['verificationReq'] = interaction.hash;
        query['network'] = NETWORKS[activeNetwork].networkKey;
      };
      setTelegramStatus({type: "info", message: "Linking Telegram"});
      await interactWrite(arweave, "use_wallet", ARWEAVE_CONTRACT, query, ArkTagsLinkEVMIdentity);

      setTelegramStatus({type: "success", message: "Telegram Successfully Linked!"});
      setLinkStatus("Linked");
      setStatus({
        type: "success",
        message: "Linked identity"
      });
      setLinkingOverlay("in-progress");
    } catch {
      setTelegramStatus({type: "error", message: "Something went wrong. Please try again."});
    }
    setLinkStatus(undefined);
  };

  function handleTelegramInput(e: React.ChangeEvent<HTMLInputElement>) {
    setTelegramUsernameInput(e.target.value)
  };

  async function handleGuildCreation() {
    console.log('fuck')
    const token_type = SUPPORTED_TOKENS[Tokenselected].key;
    const params = {
      function: "createGuild",
      ...guildCreationValues,
      token_decimals: parseInt(guildCreationValues.token_decimals),
      token_type: token_type,
      token_threshold: parseFloat(guildCreationValues.token_threshold),
    };
    if (!address) {setGuildCreationStatus('How did you do that?')}
    setGuildCreationInProgress(true);
    setGuildCreationStatus('Creating guild...');
    // await interactWrite(arweave, "use_wallet", GUILDS_REGISTRY_CONTRACT, params, ArkTagsCreateGuild);
    setGuildCreationStatus('Guild created!');
    setGuildCreationInProgress(false);
  };
  
  const initialGuildValues = {
    name: "", // "pancakessss"
    description: "", // "we love waffles and a lot of good things but there's a lot of good things so we collect them all"
    token_address: "", // "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82" 
    token_decimals: "", // "18"
    token_type: Tokenselected,
    token_threshold: "", // "0.05"
  };

  const [guildCreationValues, setGuildCreationValues] = useState(initialGuildValues);
  const handleGuildInputs = (e:any) => {
    const { name, value } = e.target;
    const tokenAddressRegex = /^0x[a-fA-F0-9]{1,40}$/;
    const tokenDecimalsRegex = /^[0-9]+[0-9]*$/;
    const tokenThresholdRegex = /(^\d*\.?\d*[0-9]+\d*$)|(^[0-9]+\d*\.\d*$)/;
    if (name === "token_address" && value.length > 0 && value !== '0' && value !== '0x' && !tokenAddressRegex.test(value)) return;
    if (name === "token_decimals" && value.length > 0 && !tokenDecimalsRegex.test(value)) return;
    if (name === "token_threshold" && value.length > 0 && !tokenThresholdRegex.test(value)) return;
    setGuildCreationValues({ ...guildCreationValues, [name]: value });
  };

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
      }, ArkTagsLinkEVMIdentity);

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

  const SliderArgs = {
    initial: { opacity: 0.5, y: 0, x: animateRight? -500: 500 },
    animate: { opacity: 1, y: 0, x: 0 },
    exit: { opacity: 0, y: 0, x: animateRight? -500: 500 },
    transition: { duration: 0.4, ease: "easeInOut" },
  }

  return (
    <>
      <TopBanner>
        Connect wallet and switch network to use Ark on Avalanche, BNB, Aurora, and Goerli
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
            <ReadMoreButton>
              Read more
            </ReadMoreButton>
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
        <Modal title={guildCreationStatus || 'Create a Guild'} {...guildCreationModal.bindings}>
          <DownloadWalletModals>
            {guildCreationStatus === 'Guild created!' ? (
              <FlexContainer>
                <p><GreenText>Name:</GreenText> {guildCreationValues?.name}</p>
                <p><GreenText>Description:</GreenText> {guildCreationValues?.description}</p>
                <p><GreenText>Token Address:</GreenText> {guildCreationValues?.token_address}</p>
                <p><GreenText>Token Decimals:</GreenText> {guildCreationValues?.token_decimals}</p>
                <p><GreenText>Token Type:</GreenText> {SUPPORTED_TOKENS[Tokenselected].key}</p>
                <p><GreenText>Token Threshold:</GreenText> {guildCreationValues?.token_threshold}</p>
                <Button onClick={() => {
                  guildCreationModal.setState(false)
                  setTokenselected(1)
                  setGuildCreationValues({...initialGuildValues, token_type: 1})              
                }}>
                  Perfect!
                </Button>
              </FlexContainer>
            ) : (
              <GuildCreationForm onSubmit={(e)=> {e.preventDefault(); handleGuildCreation(); return false}} >
                <GuildAttributeInput spellCheck={false} placeholder='Name' name='name' required pattern=".{1,100}" value={guildCreationValues?.name} onChange={(e) => handleGuildInputs(e)} />
                <GuildAttributeTextarea spellCheck={false} placeholder='Description (optional)' name='description' value={guildCreationValues?.description} onChange={(e) => handleGuildInputs(e)} />
                <GuildAttributeInput spellCheck={false} placeholder='Token Address' name='token_address' required pattern=".{1,}" value={guildCreationValues?.token_address} onChange={(e) => handleGuildInputs(e)} />
                <GuildAttributeInput spellCheck={false} placeholder='Token Decimals' name='token_decimals' required pattern=".{1,100}" value={guildCreationValues?.token_decimals} onChange={(e) => handleGuildInputs(e)} />
                <Select onChange={(e) => setTokenselected(Number(e.target.value))} idx={Tokenselected} values={SUPPORTED_TOKENS} isDisabled={false} />
                <GuildAttributeInput spellCheck={false} placeholder='Token Threshold' name='token_threshold' required pattern=".{1,100}" value={guildCreationValues?.token_threshold} onChange={(e) => handleGuildInputs(e)} />
                <Button secondary disabled={guildCreationInProgress}>
                  Create
                </Button>
                <div>
                  {guildCreationStatus}
                </div>
              </GuildCreationForm>
            )}
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

              <ChainName>
                {(activeNetwork === 1 || activeNetwork === 5) && "Ethereum"}
                {activeNetwork === 1313161555 && "Aurora"}
                {activeNetwork === 43114 && "Avalanche"}
                {activeNetwork === 56 && "BNB Chain"}
                {activeNetwork === 250 && "Fantom"}
                {activeNetwork === 245022926 && "NEON Testnet"}
                {activeNetwork === 10 && "Optimism"}
                {activeNetwork === 137 && "Polygon"}
                <ChainTicker>
                  {(activeNetwork === 1 || activeNetwork === 10 || activeNetwork === 5) && "ETH"}
                  {activeNetwork === 137 && "MATIC"}
                  {activeNetwork === 250 && "FTM"}
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
          <Button secondary fullWidth disabled={!(address && eth.address && linkingOverlay !== "linked")} onClick={() => link()}>
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
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
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
        <Spacer y={2} />
        <IdentityCard>
          {currentStep === 1 && (
            <AnimatePresence>
              <motion.div {...SliderArgs}>
                <WhiteText>Linking Your Telegram Account</WhiteText>
                <FormWrapper style={{marginTop: '1rem'}}>
                  <div style={{position: 'absolute', left: '8px', top: '0.7rem', color: 'white', fontSize: '1.25rem'}}>@</div>
                  <TGGroupInput spellCheck={false} placeholder='Username' value={telegramUsernameInput || ""} onChange={(e) => handleTelegramInput(e)} />
                  <Button secondary onClick={handleTelegramUsernameUpload} disabled={linkingOverlay == 'in-progress'}>
                    {user?.telegram?.username? "Relink": "Link"}
                  </Button>
                </FormWrapper>
                <div style={{color: 'red', fontSize: '1.25rem', fontWeight: '600'}}>{telegramStatus?.type === 'error' ? telegramStatus.message: ''}</div>
                <div style={{color: 'green', fontSize: '1.25rem', fontWeight: '600'}}>{telegramStatus?.type === 'success' ? telegramStatus.message: ''}</div>
                <div style={{color: 'white', fontSize: '1.25rem', fontWeight: '600'}}>{telegramStatus?.type === 'info' ? telegramStatus.message: ''}</div>
              </motion.div>
            </AnimatePresence>
          )}
          {currentStep === 2 && (
            <AnimatePresence>
              <motion.div {...SliderArgs}>
                <FlexJustifyBetween>
                  <WhiteText>Verifying Telegram Username</WhiteText>
                  <ThemeText onClick={() => setInstructionsVisible(!instructionsVisible)} style={{cursor: 'pointer'}}>
                    Troubleshoot
                  </ThemeText>
                </FlexJustifyBetween>
                <ARKIdContainer>
                  <a href={`https://t.me/${TELEGRAM_BOT_NAME}?start=${user?.identity_id}`}>
                    <Button fullWidth={true}>Verify</Button>
                  </a>
                  {instructionsVisible && (
                    <>
                      <div style={{marginTop: '2rem'}}>
                        {user?.telegram?.username && address && (
                          TELEGRAM_USERNAME_REGEX.test(decrypt(user.telegram.username, address)) && (
                            <div style={{marginBottom: '1rem'}}>Linked Username: <ThemeText>{decrypt(user.telegram.username, address)}</ThemeText></div>
                          )
                        )}
                        <FlexJustifyBetween>
                          <Command style={{margin: '1rem 0', padding: '0.25rem 0', fontSize: '0.75rem'}}>
                            /verify_identity {user?.identity_id}
                          </Command>
                          <Button secondary onClick={() => {
                            navigator.clipboard.writeText("/verify_identity " + user?.identity_id); 
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1000)}
                          }>
                            {copied ? "Copied!" : "Copy"}
                          </Button>
                        </FlexJustifyBetween>
                        Invoke this command at the <a href={`https://t.me/${TELEGRAM_BOT_NAME}`}><ThemeText>Telegram Bot</ThemeText></a>.
                      </div>
                    </>
                  )}
                </ARKIdContainer>
              </motion.div>
            </AnimatePresence>
          )}
          {currentStep === 3 && (
            <AnimatePresence>
              <motion.div {...SliderArgs}>
                <WhiteText>Creating a guild</WhiteText>
                {user?.telegram?.username ? (
                  <FormWrapper style={{marginTop: '1rem'}}>
                    {/* <div style={{position: 'absolute', left: '6px', top: '0.7rem', color: 'white', fontSize: '1.25rem'}}>@</div> */}
                    <TGGroupInput spellCheck={false} placeholder='Name' name='name' required pattern=".{1,100}" value={guildCreationValues?.name} onChange={(e) => handleGuildInputs(e)} />
                    <Button secondary onClick={() => guildCreationModal.setState(true)}>
                      Create
                    </Button>
                  </FormWrapper>
                ) : (
                  <div style={{color: 'white', marginTop: '1rem'}}>In order to create a group, link your Telegram.</div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
          <ProgressDots>
            {Array(maxSteps).fill(0).map((_, i) => <Dot style={{
                // @ts-ignore
                color: currentStep === i+1 && 'white' || (i+1 > currentStep && 'gray')
              }}
              onClick={() => {
                if(allowedStep >= i+1) {
                  if (currentStep - (i+1) < 0) setAnimateRight(false);
                  else if (currentStep - (i+1) > 0) setAnimateRight(true);
                  setCurrentStep(i+1)
                }
              }}>
                {/* {allowedStep >= i+1 ? <span style={{fontSize: '40px'}}>🛸</span>: '·'} */}
                ·
              </Dot>
            )}
          </ProgressDots>
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
      <Network isDisabled={eth.address ? false: true} value={activeNetwork} onChange={(e) => setActiveNetwork((val) => {
        setPreviousNetwork(val);
        return Number(e.target.value);
      })} />
    </>
  );
}

export default Home;

type StatusType = "error" | "success";
type TelegramStatusType = "error" | "info" | "success";

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

const ARKIdContainer = styled.div`
  margin-top: 0.5rem;
  color: white;
  border-radius: 5px;
  background-color: rgb(${props => props.theme.primary + ", .09)"};
  padding: 0.72rem 0.5rem;
  align-items: center;
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

const WhiteText = styled.div`
  color: white;
`;

const ThemeText = styled.span`
  color: rgb(${props => props.theme.primary});
`;

const ContentTitle = styled.div`
  color: gray;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1em;
  text-align: center;
`;

const TopBanner = styled.div`
  background-color: #141316;
  color: #f18d1f;
  padding: 1em;
  font-size: 0.9rem;
  text-align: center;
`;

const ComingSoon = styled.div`
  position: relative;
  z-index: 5;
`;

const FlexJustifyBetween = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: top;
`;

const Command = styled.div`
  border-radius: 2px;
  font-family: monospace;
  color: rgb(${props => props.theme.secondary});
  background-color: rgb(${props => props.theme.primary}, 0.3);
  word-break: break-all;
`;

const ComingSoonText = styled.div`
  position: absolute;
  user-select: none;
  color: white;
  z-index: 10;
  width: 100%;
  height: 100%;
  font-size: 1.5rem;
  font-weight: 700;
  padding-top: 8px;
  text-align: center;
  backdrop-filter: blur(1px);
  background-color: rgba(0, 0, 0, 0.1);
`;

const GreenText = styled.span`
  font-size: 18px;
  color: rgb(${props => props.theme.primary});
`;

const FlexContainer = styled.div`
  max-width: 400px;
  word-break: break-all;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

interface AnimatedProgressProps {
  scale: number;
}

const TGAnimatedProgress = styled.div<AnimatedProgressProps>`
  padding: 5px;
  margin: 0 10px;
  transform: scale(${props => props.scale});
  transition: 0.15s all ease;
`

const TGGroupInput = styled.input`
  width: 75%;
  border: none;
  padding: 16px 30px;
  border-radius: 8px;
  font-size: .9rem;
  margin-right: 1em;
  color: white;
  font-family: monospace;
  background-color: rgb(${props => props.theme.primary + ", .08)"};
  transition: all .18s ease-in-out;
  &:focus {
    box-shadow: 0 0 0 2px rgba(${props => props.theme.primary}, .5);
  }
`;

const GuildAttributeInput = styled.input`
  width: 90%;
  border: none;
  margin-bottom: 1em;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: .9rem;
  color: white;
  font-family: monospace;
  background-color: rgb(${props => props.theme.primary + ", .08)"};
  transition: all .18s ease-in-out;
  &:focus {
    box-shadow: 0 0 0 2px rgba(${props => props.theme.primary}, .5);
  }
`;

const GuildAttributeTextarea = styled.textarea`
  width: 90%;
  height: 100px;
  border: none;
  margin-bottom: 1em;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: .9rem;
  color: white;
  font-family: monospace;
  background-color: rgb(${props => props.theme.primary + ", .08)"};
  transition: all .18s ease-in-out;
  resize: none;
  &:focus {
    box-shadow: 0 0 0 2px rgba(${props => props.theme.primary}, .5);
  }
`;

const GuildCreationForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1em;
`;

const ProgressDots = styled.div`
  text-align: center;
  line-height: 60px;
  height: 45px;
  outline: none;
  user-select: none;

  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

const Dot = styled.span`
  color: rgb(${props => props.theme.primary});
  font-size: 72px;
  cursor: pointer;
`;

const FormWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding-left: 2.5rem;
  padding-right: 2.5rem;

  @media screen and (max-width: 720px) {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

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

const CloseButton = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 0.5rem;
`;
