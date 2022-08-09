import React, { useState, useEffect } from 'react';
import * as styled from '../pages/styles';
import { StatusType, TelegramStatusType } from "../pages/interfaces";
import CryptoJS from "crypto-js";
import { interactWrite } from "smartweave";
import Button from "./Button";
import { ARWEAVE_CONTRACT, ArkTags, NETWORKS } from '../utils/constants';
import { arweave } from "../utils/arconnect"

export default function TokenGatingForm(args:any) {
  const {eth, address, setLinkStatus, activeNetwork } = args;
  // 1 = Create group, 2 = Join group
  const [currentTab, setCurrentTab] = useState<number>(1);
  const [telegramUsernameInput, setTelegramUsernameInput] = useState<string>();
  const [verifiedIdentities, setVerifiedIdentities] = useState<any[]>([]);
  const [user, setUser] = useState<any>();
  const [groupCreationModal, setGroupCreationModalOpen] = useState<boolean>();
  const [telegramStatus, setTelegramStatus] = useState<{ type: TelegramStatusType, message: string}>();

  useEffect(() => {
    fetch('https://ark-api.decent.land/v1/oracle/state').then(res => res.json()).then(res => {
      const verifiedIdentities = res.res;
      const foundUser = verifiedIdentities.find((user:any, idx:number) => user.arweave_address === address || user.evm_address === eth.address);
      if (!foundUser) return 
      setUser(foundUser);

    })
  }, [address, eth.address]);

  async function handleTelegramUsernameUpload() {
    if (!address || !telegramUsernameInput) return;
    const re = /^[a-z0-9]{5,32}$/i;
  
     if (telegramUsernameInput.length < 5) {
        setTelegramStatus({type: "error", message: "Username too short."});
        return
      } else if (!re.test(telegramUsernameInput)) {
        setTelegramStatus({type: "error", message: "Telegram username is invalid."});
        return
      }
  
      const cipheredUsername = CryptoJS.AES.encrypt(telegramUsernameInput, (address)).toString();
  
      if (currentTab === 1) {
        if (user) {
          setTelegramStatus({type: "info", message: "Coming soon!"});
          setGroupCreationModalOpen(true);
        } else {
          setTelegramStatus({type: "error", message: "You cannot create a group until you verify your identity."});
        }
      }
  
      if (currentTab === 2) {
        try {
          const query:any = {
            function: "linkEvmIdentity",
            telegram_enc: cipheredUsername,
          };
  
          if (!eth || !eth.address) {
            setTelegramStatus({type: "error", message: "Connect an Ethereum wallet"})
            return;
          };
          if (!address) {
            setTelegramStatus({type: "error", message: "Connect an Arweave wallet"});
            return;
          };
          if (user && !(user.evm_address === eth.address) && !(user.arweave_address === address)) {
            setTelegramStatus({type: "error", message: "Address mismatch"});
            return;
          }
          if (!user) {
            setLinkStatus("Linking requried");
            // @ts-ignore
            const interaction = await eth.contract.linkIdentity(address);
            await interaction.wait();
            setLinkStatus("Writing to Arweave...");
            query['address'] = eth.address
            query['verificationReq'] = interaction.hash
            query['network'] = NETWORKS[activeNetwork].networkKey
          };
          setTelegramStatus({type: "info", message: "Linking Telegram..."});
          await interactWrite(arweave, "use_wallet", ARWEAVE_CONTRACT, query, ArkTags);
          setTelegramStatus({type: "success", message: "Telegram Successfully Linked!"});
        } catch {
          setTelegramStatus({type: "error", message: "Something went wrong. Please try again."});
        } 
      }
    };
  
    function handleTelegramInput(e: React.ChangeEvent<HTMLInputElement>) {
      setTelegramUsernameInput(e.target.value)
    }
  

  return (
    <styled.IdentityCard>
      <styled.Tabs>
        <styled.TabWrapper>
          <styled.Tab active={currentTab === 1} onClick={() => setCurrentTab(1)}>
            Create Group
          </styled.Tab>
        </styled.TabWrapper>
        <styled.TabWrapper>
          <styled.Tab active={currentTab === 2} onClick={() => setCurrentTab(2)}>
            Join Group
          </styled.Tab>
        </styled.TabWrapper>
      </styled.Tabs>
      <styled.ContentTitle>
        {currentTab === 1 && 'Create a new token-gated group'}
        {currentTab === 2 && 'Join a token-gated group'}
      </styled.ContentTitle>
      <div style={{color: 'red', fontSize: '1.25rem', fontWeight: '600'}}>{telegramStatus?.type === 'error' ? telegramStatus.message: ''}</div>
      <div style={{color: 'green', fontSize: '1.25rem', fontWeight: '600'}}>{telegramStatus?.type === 'success' ? telegramStatus.message: ''}</div>
      <div style={{color: 'white', fontSize: '1.25rem', fontWeight: '600'}}>{telegramStatus?.type === 'info' ? telegramStatus.message: ''}</div>
      <styled.FormWrapper style={{marginTop: '1rem'}}>
        <div style={{position: 'absolute', left: '6px', top: '0.7rem', color: 'white', fontSize: '1.25rem'}}>@</div>
        <styled.TGGroupInput placeholder='Username' value={telegramUsernameInput || ""} onChange={(e) => handleTelegramInput(e)} />
        <Button secondary onClick={handleTelegramUsernameUpload}>
          {currentTab === 1 ? 'Create' : 'Join'}
        </Button>
        {/* {!!linkingOverlay && linkModal && (
        )} */}
      </styled.FormWrapper>
    </styled.IdentityCard>
  )
};
