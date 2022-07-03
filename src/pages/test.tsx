import { useWeb3React } from "@web3-react/core";
import { useContext } from "react"
import connectors from "../utils/connectors"
import { ConnectorContext } from "./_app"

export default function() {
  const { hooks, connector, provider } = useWeb3React();

  return (
    <div>
      <h1>Test</h1>
      <button onClick={async () =>{await connector.activate(5)}}>connect</button>
    </div>
  );
}