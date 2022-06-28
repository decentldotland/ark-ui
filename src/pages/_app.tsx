import type { AppProps } from "next/app";
import styled, { ThemeProvider } from "styled-components";
import "../styles/globals.css";

function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={{
      primary: "94, 69, 250",
      secondaryText: "#d3d3d3"
    }}>
      <Gradient />
      <Component {...pageProps} />
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
