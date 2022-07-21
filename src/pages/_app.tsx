import type { AppProps } from "next/app";
import styled, { ThemeProvider } from "styled-components";
import Footer from "../components/Footer"
import "../styles/globals.css";

function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={{
    //  primary: "17, 157, 121",
      primary: "38, 191, 168",
      secondaryText: "#d3d3d3",
      tertiaryText: "#a3a3a3"
    }}>
      <Gradient />
      <Component {...pageProps} />
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

export default App;
