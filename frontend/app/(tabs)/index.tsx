import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

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
  image?: string;
}

export default function CourtsScreen() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    getLocation();
    fetchCourts();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show nearby courts');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchCourts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courts`);
      setCourts(response.data);
    } catch (error) {
      console.error('Error fetching courts:', error);
      Alert.alert('Error', 'Failed to load courts');
    } finally {
      setLoading(false);
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
    if (count <= 5) return 'Light';
    if (count <= 15) return 'Moderate';
    if (count <= 25) return 'Busy';
    return 'Packed';
  };

  const getDistance = (court: Court) => {
    if (!location) return null;
    
    const lat1 = location.coords.latitude;
    const lon1 = location.coords.longitude;
    const lat2 = court.latitude;
    const lon2 = court.longitude;
    
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance.toFixed(1);
  };

  const filteredCourts = courts.filter(court =>
    court.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    court.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCourtItem = ({ item }: { item: Court }) => {
    const distance = getDistance(item);
    const playerColor = getPlayerColor(item.currentPlayers);
    const playerStatus = getPlayerStatus(item.currentPlayers);

    return (
      <TouchableOpacity
        style={[styles.courtCard, { borderLeftColor: playerColor, borderLeftWidth: 4 }]}
        onPress={() => router.push(`/court/${item.id}`)}
      >
        {/* Heat Map Indicator Bar */}
        <View style={[styles.heatBar, { backgroundColor: playerColor }]} />
        
        <View style={styles.courtHeader}>
          <View style={styles.courtInfo}>
            <Text style={styles.courtName}>{item.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.courtAddress}>{item.address}</Text>
          </View>
          {distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={18} color="#4A90E2" />
              <Text style={styles.distanceText}>{distance}</Text>
              <Text style={styles.distanceLabel}>mi</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.courtFooter}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#888" />
            <Text style={styles.detailText}>{item.hours}</Text>
          </View>

          {/* Prominent Heat Map Badge */}
          <View style={[styles.heatMapBadge, { backgroundColor: playerColor }]}>
            <Ionicons name="flame" size={20} color="#FFF" />
            <View style={styles.heatMapInfo}>
              <Text style={styles.heatMapCount}>{item.currentPlayers}</Text>
              <Text style={styles.heatMapLabel}>{playerStatus}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading courts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courts..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCourts}
        renderItem={renderCourtItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchCourts}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="basketball-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>No courts found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Pull down to refresh'}
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
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#FFF',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  courtCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
    overflow: 'hidden',
  },
  heatBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    opacity: 0.8,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courtInfo: {
    flex: 1,
    marginRight: 12,
  },
  courtName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  courtAddress: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  distanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  distanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 4,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#4A90E2',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  courtFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#888',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playerCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  heatMapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  heatMapInfo: {
    alignItems: 'flex-start',
  },
  heatMapCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    lineHeight: 22,
  },
  heatMapLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
});
