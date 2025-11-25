import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Court {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  hours: string;
  phoneNumber: string;
  rating: number;
  currentPlayers: number;
  averagePlayers: number;
  image?: string;
}

export default function CourtDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const { user, token, updateUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchCourtDetails();
  }, []);

  useEffect(() => {
    if (user && court) {
      setCheckedIn(user.currentCourtId === court.id);
    }
  }, [user, court]);

  const fetchCourtDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courts/${id}`);
      setCourt(response.data);
    } catch (error) {
      console.error('Error fetching court details:', error);
      Alert.alert('Error', 'Failed to load court details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/courts/${id}/checkin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCheckedIn(true);
      updateUser({ currentCourtId: id as string });
      setCourt(prev => prev ? { ...prev, currentPlayers: response.data.currentPlayers } : null);
      Alert.alert('Success', 'You have checked in to this court!');
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert('Error', 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/courts/${id}/checkout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCheckedIn(false);
      updateUser({ currentCourtId: undefined });
      setCourt(prev => prev ? { ...prev, currentPlayers: response.data.currentPlayers } : null);
      Alert.alert('Success', 'You have checked out');
    } catch (error) {
      console.error('Error checking out:', error);
      Alert.alert('Error', 'Failed to check out');
    }
  };

  const openMaps = () => {
    if (court) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${court.latitude},${court.longitude}`;
      Linking.openURL(url);
    }
  };

  const callCourt = () => {
    if (court) {
      Linking.openURL(`tel:${court.phoneNumber}`);
    }
  };

  const getPlayerColor = (count: number) => {
    if (count === 0) return '#555';
    if (count <= 5) return '#4CAF50';
    if (count <= 15) return '#FFC107';
    if (count <= 25) return '#FF9800';
    return '#F44336';
  };

  const getPlayerStatus = (count: number) => {
    if (count === 0) return 'Empty';
    if (count <= 5) return 'Few players';
    if (count <= 15) return 'Moderate';
    if (count <= 25) return 'Busy';
    return 'Very busy';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!court) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Court not found</Text>
      </View>
    );
  }

  const playerColor = getPlayerColor(court.currentPlayers);
  const playerStatus = getPlayerStatus(court.currentPlayers);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Court Details</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.courtName}>{court.name}</Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.ratingText}>{court.rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>(4.5)</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={20} color="#4A90E2" />
              </View>
              <Text style={styles.infoText}>{court.address}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="time" size={20} color="#4A90E2" />
              </View>
              <Text style={styles.infoText}>{court.hours}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call" size={20} color="#4A90E2" />
              </View>
              <Text style={styles.infoText}>{court.phoneNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Activity</Text>
          
          <View style={[styles.activityBadge, { backgroundColor: playerColor }]}>
            <Ionicons name="people" size={32} color="#FFF" />
            <Text style={styles.playerCountLarge}>{court.currentPlayers}</Text>
            <Text style={styles.playerLabel}>Players Now</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: playerColor }]} />
            <Text style={styles.statusText}>{playerStatus}</Text>
          </View>

          <View style={styles.averageContainer}>
            <Ionicons name="bar-chart-outline" size={20} color="#888" />
            <Text style={styles.averageText}>
              Typically {court.averagePlayers} players at this court
            </Text>
          </View>

          {!user?.isPublic && (
            <View style={styles.privacyNotice}>
              <Ionicons name="eye-off" size={20} color="#FF9800" />
              <Text style={styles.privacyText}>
                You're in private mode. You won't be counted when you check in.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={openMaps}>
            <Ionicons name="navigate" size={24} color="#4A90E2" />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={callCourt}>
            <Ionicons name="call" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {checkedIn ? (
          <TouchableOpacity style={styles.checkOutButton} onPress={handleCheckOut}>
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            <Text style={styles.checkOutButtonText}>Check Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
            <Ionicons name="log-in" size={24} color="#FFF" />
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        )}
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0,
  },
  courtName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  ratingCount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  activityBadge: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  playerCountLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  playerLabel: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 4,
    opacity: 0.95,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  averageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  averageText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9800',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  checkInButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  checkOutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
