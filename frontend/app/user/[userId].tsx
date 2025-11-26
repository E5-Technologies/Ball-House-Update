import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface UserDetail {
  id: string;
  username: string;
  profilePic?: string;
  isConnected?: boolean;
}

export default function UserDetailScreen() {
  const { userId } = useLocalSearchParams();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    setLoading(true);
    try {
      // Check if user is in connections
      const connectionsResponse = await axios.get(`${API_URL}/api/network/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Check if user is in recent players
      const recentResponse = await axios.get(`${API_URL}/api/network/recent-players`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Find user in either list
      const allUsers = [...connectionsResponse.data, ...recentResponse.data];
      const user = allUsers.find((u: UserDetail) => u.id === userId);
      
      if (user) {
        setUserDetail(user);
      } else {
        Alert.alert('Error', 'User not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
      Alert.alert('Error', 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (userDetail) {
      router.push(`/message/${userDetail.id}`);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!userDetail) return;
    
    try {
      const response = await axios.post(
        `${API_URL}/api/network/friend-request`,
        { toUserId: userDetail.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        Alert.alert('Success', `Friend request sent to ${userDetail.username}!`);
        fetchUserDetail(); // Refresh to update connection status
      } else if (response.data.status === 'already_connected') {
        Alert.alert('Already Connected', response.data.message);
      } else {
        Alert.alert('Info', response.data.message);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading user details...</Text>
      </View>
    );
  }

  if (!userDetail) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#CCC" />
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        {userDetail.profilePic ? (
          <Image source={{ uri: userDetail.profilePic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(userDetail.username)}</Text>
          </View>
        )}
        
        <Text style={styles.username}>{userDetail.username}</Text>
        
        {userDetail.isConnected && (
          <View style={styles.connectionBadge}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.connectionText}>Connected</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSendMessage}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="chatbubble" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.actionButtonText}>Send Message</Text>
        </TouchableOpacity>

        {!userDetail.isConnected && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendFriendRequest}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="person-add" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionButtonText}>Add Friend</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#666" />
          <Text style={styles.infoText}>
            {userDetail.isConnected 
              ? 'You are connected with this player. You can send messages and play together at courts.'
              : 'Send a friend request to connect with this player and coordinate games together.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#F8F8F8',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 4,
  },
  connectionText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  infoSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: '#F8F8F8',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
