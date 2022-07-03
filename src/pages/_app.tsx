import { Web3ReactProvider } from "@web3-react/core"
import { createContext, Dispatch, PropsWithChildren, useReducer } from "react";
import { Connector } from "@web3-react/types";
import styled, { ThemeProvider } from "styled-components";
import type { AppProps } from "next/app";
import Footer from "../components/Footer"
import connectors from "../utils/connectors";
import "../styles/globals.css";

function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={{
      primary: "94, 69, 250",
      secondaryText: "#d3d3d3",
      tertiaryText: "#a3a3a3"
    }}>
      <Gradient />
      <ConnectorContext.Consumer>
        {({ activeConnector }) => (
          <Web3ReactProvider connectors={Object.values(connectors)} connectorOverride={activeConnector}>
            <ConnectorProvider>
              <Component {...pageProps} />
            </ConnectorProvider>
          </Web3ReactProvider>
        )}
      </ConnectorContext.Consumer>
      <Footer />
    </ThemeProvider>
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

export const ConnectorContext = createContext<ConnectorContextType>({} as ConnectorContextType);

const ConnectorProvider = ({ children }: PropsWithChildren<{}>) => {
  const [activeConnector, setActiveConnector] = useReducer(
    (state = connectors.walletconnect[0], connector: Connector) => connector || state, 
    connectors.walletconnect[0]
  );

  return (
    <ConnectorContext.Provider value={{ activeConnector, setActiveConnector }}>
      {children}
    </ConnectorContext.Provider>
  );
};

type ConnectorContextType = {
  activeConnector: Connector;
  setActiveConnector: (connector: Connector) => void;
};

export default App;
