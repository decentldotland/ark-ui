import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FC } from 'react';
import Button from './Button';

const RainbowKitButton:FC<any> = () => {

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain;
        return (
          <>
            {(() => {
              if (!connected) {
                return (
                  <div className="w-full" {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      width: 'max-content'
                    },
                    })} 
                    onClick={openConnectModal}
                  >
                    <Button fullWidth>
                      Connect Wallet
                    </Button>
                  </div>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button fullWidth onClick={openChainModal}>
                    Wrong network
                  </Button>
                );
              }
              return (
                <div className="flex justify-between gap-x-3 shrink-0">
                  <Button onClick={openChainModal}>
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 24, height: 24 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>
                  <Button secondary onClick={openAccountModal} type="button">
                    {account.displayName}
                  </Button>
                </div>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  )
}

export default RainbowKitButton;