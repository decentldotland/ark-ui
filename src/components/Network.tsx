import { ChangeEventHandler, useEffect, useState } from "react";
import { NETWORKS } from "../utils/constants";
import styled from "styled-components";

const Network = ({ onChange, value, isDisabled }: NetworkProps) => {
  const [theme, setTheme] = useState(NETWORKS[value]?.theme);

  useEffect(() => {
    setTheme(NETWORKS[value]?.theme);
  }, [value]);

  const handleChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setTheme(NETWORKS[Number(e.target.value)].theme);
    onChange(e);
  }

  return (
    <NetworkWrapper color={theme} >
      <NetworkColor color={theme} />
      <NetworkSelect onChange={handleChange} value={value}>
        {Object.keys(NETWORKS).map((key, i) => (
          <option disabled={isDisabled} key={i} value={key}>{NETWORKS[Number(key)].name}</option>
        ))}
      </NetworkSelect>
    </NetworkWrapper>
  );
};

interface NetworkProps {
  value: number;
  isDisabled: boolean;
  onChange: ChangeEventHandler<HTMLSelectElement>;
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

const NetworkSelect = styled.select`
  color: inherit;
  background-color: transparent;
  color: inherint;
  font-weight: 500;
  padding: .5em 0;
  margin: 0;
  font-size: .92rem;
  cursor: pointer;
  transition: all .23s ease-in-out;
`;

export default Network;