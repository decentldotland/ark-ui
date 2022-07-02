import { MouseEventHandler, useEffect, useState } from "react";
import { formatAddress } from "../utils/format";
import styled from "styled-components";
import ColorHash from "color-hash";

const ANS = ({ address, onClick }: { address: string, onClick?: MouseEventHandler<HTMLDivElement> }) => {
  const [avatar, setAvatar] = useState<string>();
  const [label, setLabel] = useState<string>();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://ans-testnet.herokuapp.com/profile/${address}`);
        const ans = await res.json();

        if (!ans) return;
        if (ans.avatar) setAvatar(ans.avatar);
        if (ans.currentLabel) setLabel(ans.currentLabel);
      } catch {}
    })();
  }, [address]);

  return (
    <Wrapper onClick={onClick}>
      {(avatar && (
        <AvatarImage src={`https://arweave.net/${avatar}`} draggable={false} />
      )) || <GradientAvatar input={label || address} />}
      <Label>
        {label ? label + ".ar" : formatAddress(address, 12)}
      </Label>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .55rem 0;
  cursor: pointer;
`;

const Label = styled.span`
  text-transform: none;
  color: rgb(${props => props.theme.primary});
`;

const avatarSize = "28px";

const AvatarImage = styled.img`
  height: ${avatarSize};
  width: ${avatarSize};
  object-fit: cover;
  border-radius: 100%;
`;

const GradientAvatar = ({ input }: { input: string }) => {
  const [color, setColor] = useState("");

  useEffect(() => {
    const colorHash = new ColorHash({ saturation: 0.5 });
    setColor(colorHash.hex(input));
  }, [input]);

  return <FakeAvatar style={{ background: `linear-gradient(120deg, ${color}44, ${color}ff)` }} />
};

const FakeAvatar = styled.div`
  height: ${avatarSize};
  width: ${avatarSize};
  border-radius: 100%;
`;

export default ANS;
