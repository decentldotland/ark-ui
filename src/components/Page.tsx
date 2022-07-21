import { PropsWithChildren } from "react"
import { motion, Variants } from "framer-motion";
import styled from "styled-components";

const top_padding = "1.5rem";

const Page = ({ children }: PropsWithChildren<{}>) => (
  <PageBase variants={fadeUp} initial="hidden" animate="shown">
    {children}
  </PageBase>
);

const PageBase = styled(motion.div)`
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
    padding: ${top_padding} 3.5vw;
  }
`;

const fadeUpTransition = { duration: 0.43, ease: "easeInOut" };

const fadeUp: Variants = {
  hidden: { opacity: 0, translateY: 10, transition: fadeUpTransition },
  shown: { opacity: 1, translateY: 0, transition: fadeUpTransition }
};

export default Page;
