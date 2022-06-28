import { ChevronDownIcon } from "@iconicicons/react"
import { AnimatePresence, motion } from "framer-motion"
import { PropsWithChildren, useState } from "react"
import styled from "styled-components";

const Faq = ({ title, children }: PropsWithChildren<Props>) => {
  const [open, setOpen] = useState(false);

  return (
    <Wrapper>
      <Title onClick={() => setOpen(val => !val)}>
        {title}
        <ExpandIcon open={open}>
          <ChevronDownIcon />
        </ExpandIcon>
      </Title>
      <AnimatePresence>
        {open && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={collapseAnimation}
            transition={{ duration: 0.42, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <Body>
              {children}
            </Body>
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};

const padding = "1rem 2rem";
const collapseAnimation = {
  open: { opacity: 1, height: "auto" },
  collapsed: { opacity: 0, height: 0 }
};

const Wrapper = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.3rem;
  font-weight: 500;
  color: #fff;
  padding: ${padding};
  margin: 0;
  cursor: pointer;
  transition: all .23s ease-in-out;

  &:hover {
    opacity: .82;
  }
`;

const ExpandIcon = styled.span<{ open: boolean; }>`
  display: block;
  width: 1em;
  height: 1em;
  font-size: 1em;
  color: ${props => props.theme.tertiaryText};

  svg {
    width: 1em;
    height: 1em;
    font-size: 1.2em;
    transition: all .23s ease-in-out;

    ${props => props.open && `transform: rotate(180deg);`}
  }
`;

const Body = styled.div`
  padding: ${padding};
  padding-top: .4rem;
  font-size: .93em;
  font-weight: 500;
  color: ${props => props.theme.tertiaryText};
  line-height: 1.3em;
  text-align: justify;
`;

interface Props {
  title: string;
}

export default Faq;