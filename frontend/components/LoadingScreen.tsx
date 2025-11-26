import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/ball_house_logo_5.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
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
  logo: {
    width: width * 0.8,
    height: height * 0.5,
  },
});
