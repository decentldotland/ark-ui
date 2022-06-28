import styled from "styled-components";

const Card = styled.div`
  padding: 1rem;
  border-radius: 20px;
  background-color: #121317;
  border: 1px solid #292c34;
  width: max-content;
`;

export const CardSubtitle = styled.p`
  font-size: .9rem;
  color: ${props => props.theme.secondaryText};
  text-transform: uppercase;
  font-weight: 500;
  margin: 0;
`;

export default Card;