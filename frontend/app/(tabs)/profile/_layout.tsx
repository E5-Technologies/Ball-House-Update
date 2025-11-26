import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // Tab navigator already shows header
        }}
      />
      <Stack.Screen
        name="connections"
        options={{
          title: 'My Network',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#000',
        }}
      />
      <Stack.Screen
        name="recent-players"
        options={{
          title: 'Recent Players',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#000',
        }}
      />
      <Stack.Screen
        name="user-detail"
        options={{
          title: 'Player Profile',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#000',
        }}
      />
    </Stack>
  );
}
