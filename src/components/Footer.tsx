import styled from "styled-components"

const Footer = () => (
  <Wrapper>
    <Logo>
      <span>Ark</span>
      Protocol
    </Logo>
    <Links>
      <FooterLink href="https://decent.land/" target="_blank" rel="noopener noreferer">
        DecentLand
      </FooterLink>
      <FooterLink href="https://t.me/decentland" target="_blank" rel="noopener noreferer">
        Telegram
      </FooterLink>
      <FooterLink href="https://github.com/decentldotland/ark-network" target="_blank" rel="noopener noreferer">
        GitHub
      </FooterLink>
    </Links>
  </Wrapper>
);

const top_padding = "1.4rem";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${top_padding} 18vw;

  @media screen and (max-width: 1650px) {
    padding: ${top_padding} 12vw;
  }

  @media screen and (max-width: 1300px) {
    padding: ${top_padding} 10vw;
    padding-bottom: 5rem !important;
  }

  @media screen and (max-width: 720px) {
    padding: ${top_padding} 7.4vw;
  }
  @media screen and (max-width: 450px) {
    padding: ${top_padding} 0;
    align-items: center;
    flex-direction: column;
    padding-bottom: 1rem !important;
  }
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.1em;
  color: ${props => props.theme.secondaryText};

  span {
    color: rgb(${props => props.theme.primary});
  }
`;

const Links = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  @media screen and (max-width: 450px) {
    margin-top: 1rem;
    flex-direction: column;
    padding-bottom: 20vw;
  }
`;

const FooterLink = styled.a`
  font-size: .96em;
  font-weight: 500;
  color: ${props => props.theme.tertiaryText};
  text-decoration: none;
  transition: all .23s ease-in-out;

  &:hover {
    color: ${props => props.theme.secondaryText};
  }
`;

export default Footer;