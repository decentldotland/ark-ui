import { CloseIcon } from "@iconicicons/react"
import { motion, AnimatePresence } from "framer-motion"
import { MouseEventHandler, PropsWithChildren, useEffect, useState } from "react"
import { opacityAnimation } from "../utils/animations"
import styled from "styled-components"
import Card from "./Card"

export const Modal = ({ open, onClose, children, title }: PropsWithChildren<Props>) => (
  <AnimatePresence>
    {open && (
      <Wrapper
        initial="transparent"
        animate="visible"
        exit="transparent"
        variants={opacityAnimation}
        transition={{ duration: 0.185, ease: "easeInOut" }}
      >
        <ModalOverlay onClick={onClose} />
        <AnimatePresence>
          {open && (
            <BodyWrapper
              initial={{
                y: -45
              }}
              animate={{
                y: 0
              }}
              exit={{
                y: -45
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ModalBody>
                <ModalHeader>
                  <ModalTitle>
                    {title}
                  </ModalTitle>
                  <Close onClick={onClose} />
                </ModalHeader>
                {children}
              </ModalBody>
            </BodyWrapper>
          )}
        </AnimatePresence>
      </Wrapper>
    )}
  </AnimatePresence>
);

interface Props {
  open: boolean;
  onClose: MouseEventHandler<HTMLDivElement | SVGSVGElement>;
  title: string;
}

export function useModal(visibleInitially = false) {
  const [state, setState] = useState(visibleInitially);

  useEffect(() => {
    document.body.style.overflowY = state ? "hidden" : "auto";
  }, [state]);

  return {
    state,
    setState,
    bindings: {
      open: state,
      onClose: () => setState(false)
    }
  };
}

const fillWholePage = `
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const Wrapper = styled(motion.div)`
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  z-index: 10000;
  ${fillWholePage}
`;

const ModalOverlay = styled.div`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1;
  ${fillWholePage}
`;

const BodyWrapper = styled(motion.div)`
  width: max-content;
  height: max-content;
  z-index: 100;
`;

const ModalBody = styled(Card)`
  width: max-content;
  min-width: 33vw;

  @media screen and (max-width: 720px) {
    min-width: unset;
    width: 95vw;
  }
`;

const ModalHeader = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 1rem;
  font-size: 1rem;
`;

const ModalTitle = styled.h1`
  font-size: .9rem;
  color: ${props => props.theme.secondaryText};
  font-weight: 400;
  text-align: center;
  margin: 0;
  text-transform: uppercase;
`;

const Close = styled(CloseIcon)`
  position: absolute;
  right: 0;
  top: 50%;
  font-size: 1.5em;
  width: 1em;
  height: 1em;
  color: ${props => props.theme.tertiaryText};
  cursor: pointer;
  transform: translateY(-50%);
  transition: all .23s ease-in-out;

  &:hover {
    opacity: .8;
  }
`;
