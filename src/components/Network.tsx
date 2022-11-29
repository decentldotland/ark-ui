import { ChangeEventHandler, useEffect, useState } from "react";
import { EXOTIC_NETWORKS, NETWORKS, TEST_NETWORKS } from "../utils/constants";
import styled from "styled-components";

const Network = ({ onChange, value, isDisabled, isDevMode }: NetworkProps) => {
  const NEW_NETWORKS = NETWORKS // isDevMode ? {...NETWORKS, ...TEST_NETWORKS}: NETWORKS
  const [theme, setTheme] = useState(NEW_NETWORKS[value]?.theme);

  useEffect(() => {
    setTheme(NEW_NETWORKS[value]?.theme);
  }, [value]);

  const handleChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setTheme(NEW_NETWORKS[Number(e.target.value)].theme);
    onChange(e);
  }

  return (
    <NetworkWrapper color={theme} >
      <NetworkColor color={theme} />
      <NetworkSelect onChange={handleChange} value={value}>
        {Object.keys(NEW_NETWORKS).map((key, i) => (
          <option disabled={isDisabled} key={i} value={key}>{NEW_NETWORKS[Number(key)].name}</option>
        ))}
      </NetworkSelect>
    </NetworkWrapper>
  );
};

export const ExoticNetwork = ({ onChange, value, isDisabled }: ExoticNetworkProps) => {
  // const EXOTIC_NETWORKS = EXOTIC_NETWORKS // isDevMode ? {...NETWORKS, ...TEST_NETWORKS}: NETWORKS
  const [theme, setTheme] = useState(EXOTIC_NETWORKS[value]?.theme);

  useEffect(() => {
    setTheme(EXOTIC_NETWORKS[value]?.theme);
  }, [value]);

  const handleChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setTheme(EXOTIC_NETWORKS[value]?.theme);
    // onChange(e);
  }

  return (
    <NetworkWrapper color={theme} >
      <NetworkColor color={theme} />
      <NetworkSelect exotic onChange={handleChange} value={value}>
        {Object.keys(EXOTIC_NETWORKS).map((key, i) => (
          <option disabled={isDisabled} key={i} value={key}>{EXOTIC_NETWORKS[value]?.name}</option>
        ))}
      </NetworkSelect>
    </NetworkWrapper>
  )
}
interface NetworkProps {
  value: number;
  isDisabled: boolean;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  isDevMode: boolean;
  isEVM?: any;
}

interface ExoticNetworkProps {
  value: string;
  isDisabled: boolean;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  isDevMode?: boolean;
  isEVM?: any;
}

const NetworkWrapper = styled.div<{ color: string }>`
  position: fixed;
  right: 2em;
  bottom: 2em;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: .45rem;
  background-color: rgba(${props => props.color}, .25);
  backdrop-filter: blur(5px);
  border: 1px solid rgb(${props => props.color});
  color: rgb(${props => props.color});
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  width: max-content;
  padding: 0 .85rem;
  transition: all .23s ease-in-out;

  &:hover {
    opacity: .85;
  }
`;

const NetworkColor = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 100%;
  background-color: rgb(${props => props.color});
  transition: all .23s ease-in-out;
`;

const NetworkSelect = styled.select<{ exotic?: any}>`
  color: ${props => props.exotic ? "DarkGray" : "inherit"};
  background-color: transparent;
  font-weight: 500;
  padding: .5em 0;
  margin: 0;
  font-size: .92rem;
  cursor: pointer;
  transition: all .23s ease-in-out;
`;

export default Network;