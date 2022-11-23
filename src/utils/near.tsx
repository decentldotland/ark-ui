
import React, { Fragment, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Buffer } from 'buffer';

import { map, distinctUntilChanged } from "rxjs";
import { providers, utils } from "near-api-js";
import type {
  AccountView,
  CodeResult,
} from "near-api-js/lib/providers/provider";

import type { Transaction, WalletSelector, AccountState } from "@near-wallet-selector/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import {  WalletSelectorModal, setupModal } from "@near-wallet-selector/modal-ui";

import { setupDefaultWallets } from "@near-wallet-selector/default-wallets";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";

import "@near-wallet-selector/modal-ui/styles.css";

import { NEAR_ORACLE } from "./constants";

import Button from "../components/Button";


const SUGGESTED_DONATION = "0";
const BOATLOAD_OF_GAS = utils.format.parseNearAmount("0.00000000003")!;

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

// interface WalletSelectorContextValue {
//   selector: WalletSelector;
//   modal: WalletSelectorModal;
//   accounts: Array<AccountState>;
//   accountId: string | null;
// }

export const useNear = () => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const accountId = accounts.find((account) => account.active)?.accountId || null;

  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: "mainnet",
      debug: true,
      modules: [
        ...(await setupDefaultWallets()),
        setupNearWallet(),
        setupSender(),
        setupMeteorWallet(),
      ],
    });
    const _modal = setupModal(_selector, { contractId: NEAR_ORACLE, theme: "dark" });
    const state = _selector.store.getState();
    setAccounts(state.accounts);

    window.selector = _selector;
    window.modal = _modal;

    setSelector(_selector);
    setModal(_modal);
  }, []);

  const getAccount = useCallback(async (): Promise<any | null> => {
    if (!accountId || !selector) return null;

    const { network } = selector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    return provider
      .query<AccountView>({
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
      })
      .then((data) => ({
        ...data,
        account_id: accountId,
      }));
  }, [accountId, selector?.options]);

  const linkNear = useCallback(
    async (arweave_addr: string, customAccountId='') => {
      if (!accountId || !selector) return;
      // const { contract } = selector.store.getState();
      const wallet = await selector.wallet();
      return wallet
        .signAndSendTransaction({
          signerId: accountId!,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "set_id",
                args: { account_id: customAccountId || accountId, arweave_addr: arweave_addr },
                gas: BOATLOAD_OF_GAS,
                deposit: '0', // utils.format.parseNearAmount(donation)!,
              },
            },
          ],
        })
        .catch((err) => {
          alert("Failed to link account: " + err);
          console.log("Failed to link account: ", err);
          throw err;
        });
    },
    [selector, accountId]
  );

  /**
    * Checks if the user has linked their account on Near
    * @returns {object} The `result` property inside is an array buffer, that if converted is either a null or a 43 (or 45) character-long txid
  */
  const checkNearLinking = useCallback((customAccountId='') => {
    if (!accountId || !selector) return;
    const { network } = selector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    return provider
      .query<CodeResult>({
        request_type: "call_function",
        account_id: NEAR_ORACLE,
        method_name: "get_id",
        args_base64: Buffer.from(JSON.stringify({ account_id: "helloworld.near" || accountId })).toString("base64"),
        finality: "optimistic",
      })
      .catch((err) => {
        throw err;
      })
      .then((res) => {
        console.log(res, String.fromCharCode.apply(null, res.result));
        return String.fromCharCode.apply(null, res.result);
      }); 
  }, [selector]);

  useEffect(() => {
    if (!accountId) {
      return setAccount(null);
    }

    setLoading(true);

    getAccount().then((nextAccount) => {
      setAccount(nextAccount);
      setLoading(false);
    });
  }, [accountId, getAccount]);

  useEffect(() => {
    init().catch((err) => {
      console.error(err);
      alert("Failed to initialise wallet selector");
    });
  }, [init]);

  useEffect(() => {
    if (!selector) {
      return;
    }

    const subscription = selector.store.observable
      .pipe(
        map((state) => state.accounts),
        distinctUntilChanged()
      )
      .subscribe((nextAccounts) => {
        console.log("Accounts Update", nextAccounts);

        setAccounts(nextAccounts);
      });

    return () => subscription.unsubscribe();
  }, [selector]);

  return {modal, selector, accounts, account, accountId, loading, linkNear, checkNearLinking};
};


const NearConnect: React.FC = (props: any) => {
  const { modal, selector, account, accountId, loading } = props;

  const handleSignIn = () => {
    modal?.show();
  };

  const handleSignOut = async () => {
    if (!selector) return;
    const wallet = await selector.wallet();

    wallet.signOut().catch((err) => {
      console.log("Failed to sign out");
      console.error(err);
    });
  };

  // const handleSwitchWallet = () => {
  //   modal?.show();
  // };

  // const handleSwitchAccount = () => {
  //   const currentIndex = accounts.findIndex((x) => x.accountId === accountId);
  //   const nextIndex = currentIndex < accounts.length - 1 ? currentIndex + 1 : 0;

  //   const nextAccountId = accounts[nextIndex].accountId;

  //   selector?.setActiveAccount(nextAccountId);

  //   alert("Switched account to " + nextAccountId);
  // };

  // const handleVerifyOwner = async () => {
  //   if (!selector) return;
  //   const wallet = await selector.wallet();
  //   try {
  //     const owner = await wallet.verifyOwner({
  //       message: "test message for verification",
  //     });

  //     if (owner) {
  //       alert(`Signature for verification: ${JSON.stringify(owner)}`);
  //     }
  //   } catch (err) {
  //     const message =
  //       err instanceof Error ? err.message : "Something went wrong";
  //     alert(message);
  //   }
  // };

  const beautifyAddress = (address: string) => {
    if (!address) return '';
    return address.slice(0, 8) + "..." + address.slice(-8);
  }

  return (
    <div>
      {loading ? (<></>): (
        <>
          {account ? (
            <ConnectButton onClick={handleSignOut}>
              {accountId?.length === 64 ? beautifyAddress(accountId) : accountId}
            </ConnectButton>
          ) : <ConnectButton onClick={handleSignIn}>Connect</ConnectButton>}
        </>
      )}
    </div>
  );
  {/* <button onClick={handleSwitchWallet}>Switch Wallet</button>
  <button onClick={handleVerifyOwner}>Verify Owner</button>
  {accounts.length > 1 && (
    <button onClick={handleSwitchAccount}>Switch Account</button>
  )} */}
};


export default NearConnect;

const ConnectButton = styled(Button)`
  padding-left: 1.5rem;
  padding-right: 1.5rem;

  @media screen and (max-width: 720px) {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;
