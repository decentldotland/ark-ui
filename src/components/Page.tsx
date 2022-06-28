import styled from "styled-components";

const top_padding = "4rem";

const Page = styled.div`
  position: relative;
  padding: ${top_padding} 18vw;
  min-height: calc(100vh - ${top_padding} * 2);

  @media screen and (max-width: 1650px) {
    padding: ${top_padding} 12vw;
  }

  @media screen and (max-width: 1300px) {
    padding: ${top_padding} 10vw;
  }

  @media screen and (max-width: 720px) {
    padding: ${top_padding} 7.4vw;
  }
`;

export default Page;