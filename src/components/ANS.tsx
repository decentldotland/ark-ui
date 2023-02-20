import { MouseEventHandler, useEffect, useState } from "react";
import { formatAddress } from "../utils/format";
import styled from "styled-components";
import { ANS_EXM_CONTRACT, EXM_OPEN_READ, EXM_READ_URL } from "../utils/constants";

const ANS = ({ address, onClick }: { address: string, onClick?: MouseEventHandler<HTMLDivElement> }) => {
  const [avatar, setAvatar] = useState<string>();
  const [color, setColor] = useState<string>('');
  const [label, setLabel] = useState<string>();

  useEffect(() => {
    (async () => {
      const EXMStateFindOwnerByAddress = (state: any, arweave_address: string) =>
        state.balances.find((balance: any) => balance.address === arweave_address);

      try {
        const res = await fetch(EXM_OPEN_READ);
        const ans = await res.json();

        if (!ans || Object.keys(ans).length === 0) return;
        // if (ans.avatar) setAvatar(ans.avatar);
        const user = EXMStateFindOwnerByAddress(ans, address);
        if (!user) return;
        if (Object.keys(user).length === 0 || (user?.ownedDomains?.length || 0) === 0) return;
        if (user.primary_domain) setLabel(user.primary_domain);
        setColor(user.ownedDomains.find((domain: any) => domain.domain === user.primary_domain).color)
      } catch {}
    })();
  }, [address]);

  return (
    <Wrapper onClick={onClick}>
      {(avatar && (
        <AvatarImage src={`https://arweave.net/${avatar}`} draggable={false} />
      )) || <GradientAvatar color={color} />}
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

const GradientAvatar = ({ color }: { color: string }) => {
  console.log(color)
  return <FakeAvatar style={{ background: `linear-gradient(120deg, ${color}44, ${color}ff)` }} />
};

const FakeAvatar = styled.div`
  height: ${avatarSize};
  width: ${avatarSize};
  border-radius: 100%;
`;

export default ANS;
