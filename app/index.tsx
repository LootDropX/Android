import { Redirect } from 'expo-router';
import { useWallet } from '../src/hooks/useWallet';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Entry point — redirects to the map tab if connected, otherwise to wallet connect.
 */
export default function Index(): React.JSX.Element {
  const { isConnected, isRestoring } = useWallet();

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  if (isConnected) {
    return <Redirect href="/(tabs)/map" />;
  }

  return <Redirect href="/(auth)/connect-wallet" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
