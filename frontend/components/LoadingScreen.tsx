import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Location Pin Icon */}
        <Ionicons name="location" size={80} color="#4B00FF" style={styles.icon} />
        
        {/* BH Text */}
        <Text style={styles.brandText}>BH</Text>
      </View>
      
      {/* Network Text */}
      <Text style={styles.networkText}>NETWORK</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: -10,
  },
  brandText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  networkText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 4,
  },
});
