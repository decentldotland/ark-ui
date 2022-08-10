import styled from "styled-components";
import Card from "../components/Card";
import Button from "../components/Button";
import { motion } from "framer-motion";
import { CloseIcon } from "@iconicicons/react"
import { StatusType } from "./interfaces";

export const ARKLogo = styled.div`
  margin-right: 40px;
  @media screen and (max-width: 768px) {
    margin-bottom: 10px;
    margin-right: 0px;
  }
`;

export const TopSection = styled.div`
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

export const TopContent = styled.div`
  display: flex;
  text-align: center;
  align-items: start;
  flex-direction: column;
  width: max-content;
  @media screen and (max-width: 768px) {
    align-items: center;
  }
`;

export const ARKIdContainer = styled.div`
  margin-top: 1rem;
  color: white;
  border-radius: 5px;
  background-color: rgb(${props => props.theme.primary + ", .09)"};
  padding: 0.8rem 0.5rem;
  align-items: center;
`;

export const DownloadWalletModals = styled.div`
  text-align: center;
  margin-top: 1rem;
  color: white;
  font-size: 1.2rem;
`;

export const ProviderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const InstallWalletURL = styled.a`
  margin-left: 0.3rem;
  color: rgb(${props => props.theme.primary});
  text-decoration: none;
`;

export const Title = styled.h1`
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

export const Subtitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 500;
  color: #fff;
  margin: 0;
  margin-bottom: 2em;

  @media screen and (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

export const ProtocolName = styled.span`
  color: rgb(${props => props.theme.primary});
`;

export const IdentityCard = styled(Card)`
  position: relative;
  width: 420px;
  margin: 0 auto;

  @media screen and (max-width: 768px) {
    width: calc(100% - 2rem);
  }
`;

export const Tabs = styled.div`
  display: flex;
  justify-content: center;
`;

export const TabWrapper = styled.div`
  margin: 0px 4px;
  cursor: pointer;
  height: 80px;
`;

interface TabProps {
  active: boolean;
}

export const Tab = styled.div<TabProps>`
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

export const ContentTitle = styled.div`
  color: gray;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1em;
  text-align: center;
`;

export const TopBanner = styled.div`
  background-color: #141316;
  color: #f18d1f;
  padding: 1em;
  font-size: 0.9rem;
  text-align: center;
`;

export const ComingSoon = styled.div`
  position: relative;
  z-index: 5;
`;

export const ComingSoonText = styled.div`
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

interface AnimatedProgressProps {
  scale: number;
}

export const TGAnimatedProgress = styled.div<AnimatedProgressProps>`
  padding: 5px;
  margin: 0 10px;
  transform: scale(${props => props.scale});
  transition: 0.15s all ease;
`

export const TGGroupInput = styled.input`
  width: 100%;
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

export const FormWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1c1e23;
  border-radius: 20px;
  padding: .8rem .75rem;
  cursor: text;
`;

export const WalletChainLogo = styled.div`
  display: flex;
  align-items: center;
  gap: .75rem;
  font-size: 1.1rem;
  color: #fff;
  font-weight: 500;
`;

export const ChainName = styled.div`
  font-size: 0.9em;
  display: flex;
  align-items: flex-end;
  gap: .25rem;
`;

export const ChainTicker = styled.span`
  font-size: .9em;
  color: ${props => props.theme.secondaryText};
  text-transform: uppercase;
`;

export const LinkSymbol = styled.div`
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

export const Permanent = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    width: 40vw;
  }
`;

export const FAQCard = styled(Card)`
  padding: 0;
  width: 70vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    width: 100%;
  }
`;

export const ReadMoreButton = styled(Button)`
  font-size: 0.95rem;
  padding: 0.6rem;
`;

export const CoinbaseButton = styled(Button)`
  background-color: #fff;
  color: #1652f0;
`;

export const WalletConnectButton = styled(Button)`
  background-color: #fff;
  color: #2b6cb0;
`;

export const MetamaskButton = styled(Button)`
  background-color: #CD6116;
  color: #fff;
`;

export const Status = styled.div<{ type: StatusType }>`
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

export const CloseStatusIcon = styled(CloseIcon)`
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

export const ConnectButton = styled(Button)`
  padding-left: 2.5rem;
  padding-right: 2.5rem;

  @media screen and (max-width: 720px) {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

export const LinkingInProgress = styled(motion.div)`
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

export const CloseButton = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 0.5rem;
`;
