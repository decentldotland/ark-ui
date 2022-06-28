import { LinkIcon } from "@iconicicons/react"
import type { NextPage } from "next";
import Card, { CardSubtitle } from "../components/Card";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";
import Button from "../components/Button";
import Page from "../components/Page";
import Spacer from "../components/Spacer"
import Faq from "../components/Faq"

const Home: NextPage = () => {
  const router = useRouter();

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
            <Button secondary style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}>
              Connect ANS
            </Button>
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
            <Button secondary style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}>
              Verify identity
            </Button>
          </WalletContainer>
          <Spacer y={2.5} />
          <Button secondary fullWidth>
            Submit
          </Button>
        </IdentityCard>
        <Spacer y={4} />
        <Permanent href="https://arweave.org">
          <Image src="/permanent.svg" width={150} height={75} />
        </Permanent>
        <Spacer id="faq" y={4} />
        <FAQCard>
          <Spacer y={1.5} />
          <Title style={{ textAlign: "center" }}>F.A.Q.</Title>
          <Spacer y={1.5} />
          <Faq title="A question, is this?">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Animi deleniti consequuntur vero voluptates quaerat ea minima atque qui quam facere laudantium, reiciendis omnis nulla ullam autem aliquid possimus nostrum tempore!
          </Faq>
          <Faq title="A question, is this?">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Animi deleniti consequuntur vero voluptates quaerat ea minima atque qui quam facere laudantium, reiciendis omnis nulla ullam autem aliquid possimus nostrum tempore!
          </Faq>
          <Faq title="A question, is this?">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Animi deleniti consequuntur vero voluptates quaerat ea minima atque qui quam facere laudantium, reiciendis omnis nulla ullam autem aliquid possimus nostrum tempore!
          </Faq>
          <Faq title="A question, is this?">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Animi deleniti consequuntur vero voluptates quaerat ea minima atque qui quam facere laudantium, reiciendis omnis nulla ullam autem aliquid possimus nostrum tempore!
          </Faq>
        </FAQCard>
      </Page>
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
    margin-bottom: .1em;
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
`;

const FAQCard = styled(Card)`
  padding: 0;
  width: 70vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    width: calc(100% - 2rem);
  }
`;

export default Home;
