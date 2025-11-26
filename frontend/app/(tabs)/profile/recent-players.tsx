import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Colors, BorderRadius, Spacing } from '../../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Player {
  id: string;
  username: string;
  profilePic?: string;
  isConnected?: boolean;
}

export default function RecentPlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchRecentPlayers();
  }, []);

  const fetchRecentPlayers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/network/recent-players`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching recent players:', error);
      Alert.alert('Error', 'Failed to load recent players');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (player: Player) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/network/friend-request`,
        { toUserId: player.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        Alert.alert('Success', `Friend request sent to ${player.username}!`);
        fetchRecentPlayers(); // Refresh the list
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

  const renderPlayer = ({ item }: { item: Player }) => (
    <TouchableOpacity
      style={styles.playerCard}
      onPress={() => router.push({
        pathname: '/(tabs)/profile/user-detail',
        params: { userId: item.id }
      })}
    >
      <View style={styles.playerInfo}>
        {item.profilePic ? (
          <Image source={{ uri: item.profilePic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(item.username)}</Text>
          </View>
        )}
        <View style={styles.playerDetails}>
          <Text style={styles.playerName}>{item.username}</Text>
          {item.isConnected ? (
            <View style={styles.connectionBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.connectionText}>Connected</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={(e) => {
                e.stopPropagation();
                handleSendRequest(item);
              }}
            >
              <Ionicons name="person-add" size={16} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Friend</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading recent players...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="basketball-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No Recent Players</Text>
            <Text style={styles.emptySubtext}>
              Visit courts and meet other players to see them here
            </Text>
          </View>
        }
      />
    </View>
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
  listContent: {
    padding: Spacing.md,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  playerDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  addButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
