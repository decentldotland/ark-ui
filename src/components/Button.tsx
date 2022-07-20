import styled from "styled-components";

const Button = styled.button<{ secondary?: boolean; fullWidth?: boolean; }>`
  color: rgb(${props => props.secondary ? props.theme.primary : "255, 255, 255"});
  background-color: rgba(${props => props.secondary ? props.theme.primary + ", .15" : props.theme.primary + ", 1"});
  border-radius: 12px;
  text-align: center;
  justify-content: center;
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .9rem;
  font-weight: ${props => props.secondary ? "400" : "500"};
  text-transform: capitalize;
  cursor: pointer;
  padding: .5rem ${props => props.fullWidth ? "0" : "0.5rem"};
  width: ${props => props.fullWidth ? "100%" : "auto"};

  ${({ secondary, theme }) => {
    if (secondary) {
      return `
        &:hover {
          background-color: rgba(${theme.primary + ", .12"});
        }
      `;
    } else {
      return `
        transition: all .17s ease-in-out;

        &:hover {
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }
      `;
    }
  }}

  &:disabled {
    opacity: .7;
    cursor: not-allowed;
  }
`;

export default Button;