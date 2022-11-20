import { WalletSelectorContextProvider } from "../contexts/WalletSelectorContext";

import React, { Fragment, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { providers, utils } from "near-api-js";
import type {
  AccountView,
  CodeResult,
} from "near-api-js/lib/providers/provider";
import type { Transaction } from "@near-wallet-selector/core";

import { useWalletSelector } from "../contexts/WalletSelectorContext";
import { NEAR_ORACLE } from "./constants";
import { walletConnect } from "./connectors/walletconnect";
import Button from "../components/Button";

const SUGGESTED_DONATION = "0";
const BOATLOAD_OF_GAS = utils.format.parseNearAmount("0.00000000003")!;

const Content: React.FC = () => {
  const { selector, modal, accounts, accountId } = useWalletSelector();
  const [account, setAccount] = useState<any>(null);
  const [messages, setMessages] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const getAccount = useCallback(async (): Promise<any | null> => {
    if (!accountId) {
      return null;
    }

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
  }, [accountId, selector.options]);

  const getMessages = useCallback(() => {
    const { network } = selector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    return provider
      .query<CodeResult>({
        request_type: "call_function",
        account_id: NEAR_ORACLE,
        method_name: "getMessages",
        args_base64: "",
        finality: "optimistic",
      })
      .then((res) => JSON.parse(Buffer.from(res.result).toString()));
  }, [selector]);

  useEffect(() => {
    // TODO: don't just fetch once; subscribe!
    // getMessages().then(setMessages);
  }, []);

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

  const handleSignIn = () => {
    modal.show();
  };

  const handleSignOut = async () => {
    const wallet = await selector.wallet();

    wallet.signOut().catch((err) => {
      console.log("Failed to sign out");
      console.error(err);
    });
  };

  const handleSwitchWallet = () => {
    modal.show();
  };

  const handleSwitchAccount = () => {
    const currentIndex = accounts.findIndex((x) => x.accountId === accountId);
    const nextIndex = currentIndex < accounts.length - 1 ? currentIndex + 1 : 0;

    const nextAccountId = accounts[nextIndex].accountId;

    selector.setActiveAccount(nextAccountId);

    alert("Switched account to " + nextAccountId);
  };

  const addMessages = useCallback(
    async (message: string, donation: string, multiple: boolean) => {
      const { contract } = selector.store.getState();
      const wallet = await selector.wallet();

      if (!multiple) {
        return wallet
          .signAndSendTransaction({
            signerId: accountId!,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  methodName: "addMessage",
                  args: { text: message },
                  gas: BOATLOAD_OF_GAS,
                  deposit: utils.format.parseNearAmount(donation)!,
                },
              },
            ],
          })
          .catch((err) => {
            alert("Failed to add message");
            console.log("Failed to add message");

            throw err;
          });
      }

      const transactions: Array<Transaction> = [];

      for (let i = 0; i < 2; i += 1) {
        transactions.push({
          signerId: accountId!,
          receiverId: contract!.contractId,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "addMessage",
                args: {
                  text: `${message} (${i + 1}/2)`,
                },
                gas: BOATLOAD_OF_GAS,
                deposit: utils.format.parseNearAmount(donation)!,
              },
            },
          ],
        });
      }

      return wallet.signAndSendTransactions({ transactions }).catch((err) => {
        alert("Failed to add messages exception " + err);
        console.log("Failed to add messages");

        throw err;
      });
    },
    [selector, accountId]
  );

  const handleVerifyOwner = async () => {
    const wallet = await selector.wallet();
    try {
      const owner = await wallet.verifyOwner({
        message: "test message for verification",
      });

      if (owner) {
        alert(`Signature for verification: ${JSON.stringify(owner)}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      alert(message);
    }
  };

  const handleSubmit = useCallback(
    async (e: SubmitEvent) => {
      e.preventDefault();

      // TODO: Fix the typing so that target.elements exists..
      // @ts-ignore.
      const { fieldset, message, donation, multiple } = e.target.elements;

      fieldset.disabled = true;

      return addMessages(message.value, donation.value || "0", multiple.checked)
        .then(() => {
          return getMessages()
            .then((nextMessages) => {
              setMessages(nextMessages);
              message.value = "";
              donation.value = SUGGESTED_DONATION;
              fieldset.disabled = false;
              multiple.checked = false;
              message.focus();
            })
            .catch((err) => {
              alert("Failed to refresh messages");
              console.log("Failed to refresh messages");

              throw err;
            });
        })
        .catch((err) => {
          console.error(err);

          fieldset.disabled = false;
        });
    },
    [addMessages, getMessages]
  );

  if (loading) {
    return null;
  }

  if (!account) {
    return (
      <Fragment>
        <div>
          <ConnectButton onClick={handleSignIn}>Connect</ConnectButton>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <div>
        <ConnectButton onClick={handleSignOut}>{accountId}</ConnectButton>
        {/* <button onClick={handleSwitchWallet}>Switch Wallet</button>
        <button onClick={handleVerifyOwner}>Verify Owner</button>
        {accounts.length > 1 && (
          <button onClick={handleSwitchAccount}>Switch Account</button>
        )} */}
      </div>
    </Fragment>
  );
};

const NearConnect = () => {
  return (
    <div>
      {/* @ts-ignore */}
      <WalletSelectorContextProvider>
        <Content />
      </WalletSelectorContextProvider>
    </div>
  );
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
