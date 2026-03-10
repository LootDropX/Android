import React from 'react';
import { Button } from '../ui/Button';
import { useWallet } from '../../hooks/useWallet';
import { hapticMedium } from '../ui/Haptic';

export interface ConnectButtonProps {
  /** Optional label override */
  label?: string;
}

/**
 * Triggers the MWA wallet connection flow.
 */
export function ConnectButton({ label = 'Connect Wallet' }: ConnectButtonProps): React.JSX.Element {
  const { connect, isConnected } = useWallet();
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePress = async (): Promise<void> => {
    await hapticMedium();
    setIsLoading(true);
    try {
      await connect();
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected) return <></>;

  return (
    <Button
      label={label}
      variant="primary"
      isLoading={isLoading}
      onPress={handlePress}
    />
  );
}
