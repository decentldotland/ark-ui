import { ArrowUpIcon } from "@iconicicons/react"
import type { NextPage } from "next";
import Card, { CardSubtitle } from "../components/Card";
import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";
import Button from "../components/Button";
import Page from "../components/Page";
import Spacer from "../components/Spacer"

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Ark</title>
        <link rel="icon" href="/icon.png" />
      </Head>
      <Page>
        <TopSection>
          <ConceptImageWrapper>
            <Image src="/art.jpg" width={1280} height={1280} />
          </ConceptImageWrapper>
          <div>
            <Title>
              <ProtocolName>
                Ark
              </ProtocolName>
              Protocol
            </Title>
            <Subtitle>
              The crosschain identity protocol for web3 social
            </Subtitle>
            <Button>
              Read More
            </Button>
          </div>
        </TopSection>
        <Spacer y={4} />
        <IdentityCard>
          <Spacer y={.25} />
          <CardSubtitle>
            Link Identity
          </CardSubtitle>
          <Spacer y={1.25} />
          <WalletContainer>
            <WalletChainLogo>
              <Image src="/arweave.png" width={30} height={30} />
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
            <ArrowUpIcon />
          </LinkSymbol>
          <Spacer y={1} />
          <WalletContainer>
            <WalletChainLogo>
              <Image src="/eth.png" width={30} height={30} />
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
      </Page>
    </>
  );
}

const TopSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: stretch;
  gap: 3.5rem;
`;

const ConceptImageWrapper = styled.div`
  position: relative;
  width: 16vw;
  height: 16vw;
  border-radius: 10px;
  overflow: hidden;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: ${props => props.theme.secondaryText};
  line-height: 1.1em;
  margin: 0;
  margin-bottom: .2em;
`;

const Subtitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 500;
  color: #fff;
  margin: 0;
  margin-bottom: 2em;
`;

const ProtocolName = styled.span`
  color: rgb(${props => props.theme.primary});
`;

const IdentityCard = styled(Card)`
  width: 33vw;
  margin: 0 auto;
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
  border-radius: 12px;
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

export default Home;
