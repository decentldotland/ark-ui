import styled, { keyframes } from "styled-components";

export default function Loading() {
  return (
    <AnimationWrapper>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
        <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 9.27455 20.9097 6.80375 19.1414 5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    </AnimationWrapper>
  );
}

const loadingAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const AnimationWrapper = styled.svg`
  width: 1em;
  height: 1em;
  animation: 1.95s linear 0s infinite ${loadingAnimation};
`;
