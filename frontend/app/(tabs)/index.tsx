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
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

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

export default function CourtsScreen() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [showMap, setShowMap] = useState(false); // Default to list view
  const isWeb = Platform.OS === 'web';
  const [recommendedCourtId, setRecommendedCourtId] = useState<string | null>(null);
  const [predictionConfidence, setPredictionConfidence] = useState<number>(0);
  const [predictionReasoning, setPredictionReasoning] = useState<string>('');
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    getLocation();
    fetchCourts();
    fetchRecommendedCourt();
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

  const fetchRecommendedCourt = async () => {
    try {
      // Get user location for better prediction
      let lat = location?.coords.latitude;
      let lon = location?.coords.longitude;
      
      const url = lat && lon 
        ? `${API_URL}/api/courts/predict/recommended?latitude=${lat}&longitude=${lon}`
        : `${API_URL}/api/courts/predict/recommended`;
      
      const response = await axios.get(url);
      setRecommendedCourtId(response.data.recommendedCourtId);
      setPredictionConfidence(response.data.confidenceScore);
      setPredictionReasoning(response.data.reasoning);
      console.log('Recommended court:', response.data);
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      // Fail silently - recommendation is optional feature
    }
  };

  const getPlayerColor = (count: number) => {
    if (count === 0) return Colors.heatEmpty;
    if (count <= 5) return Colors.heatLow;
    if (count <= 15) return Colors.heatMedium;
    if (count <= 25) return Colors.heatHigh;
    return Colors.heatVeryHigh;
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
    const isRecommended = item.id === recommendedCourtId;

    return (
      <TouchableOpacity
        style={[styles.courtCard, isRecommended && styles.recommendedCard]}
        onPress={() => router.push(`/court/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Recommended Badge */}
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.recommendedText}>Recommended Court</Text>
          </View>
        )}

        {/* Court Details */}
        <View style={styles.courtDetails}>
          <Text style={styles.courtName} numberOfLines={1}>{item.name}</Text>
          
          {/* Rating Row */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= item.rating ? 'star' : 'star-outline'}
                size={12}
                color="#FFD700"
              />
            ))}
            <Text style={styles.ratingText}>({item.rating.toFixed(1)})</Text>
          </View>

          {/* Address */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>{item.address}</Text>
          </View>

          {/* Hours */}
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.hours}</Text>
          </View>

          {/* Average Players */}
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text style={styles.infoText}>Avg: {item.averagePlayers} players</Text>
          </View>

          {/* Distance */}
          {distance && (
            <View style={styles.bottomRow}>
              <Text style={styles.distanceText}>{distance} mi away</Text>
            </View>
          )}
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

  // Map view for mobile
  const renderMapView = () => (
    <View style={styles.container}>
      {/* Toggle between List and Map */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
          onPress={() => setShowMap(false)}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={!showMap ? '#FFF' : '#666'} 
          />
          <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
          onPress={() => setShowMap(true)}
        >
          <Ionicons 
            name="map" 
            size={20} 
            color={showMap ? '#FFF' : '#666'} 
          />
          <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 29.7604,
          longitude: -95.3698,
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Court Markers */}
        {filteredCourts.map((court) => (
          <Marker
            key={court.id}
            coordinate={{
              latitude: court.latitude,
              longitude: court.longitude,
            }}
            onPress={() => setSelectedCourt(court)}
            title={court.name}
            description={`${court.currentPlayers} players`}
          >
            <View style={styles.markerContainer}>
              <View style={styles.mapPlayerBadge}>
                <Text style={styles.playerBadgeText}>{court.currentPlayers}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Bottom Detail Card */}
      {selectedCourt && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={styles.courtImageContainer}>
                <Ionicons name="basketball" size={32} color={Colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{selectedCourt.name}</Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= selectedCourt.rating ? 'star' : 'star-outline'}
                      size={14}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeCardButton}
              onPress={() => setSelectedCourt(null)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.cardText}>{selectedCourt.address}</Text>
            </View>
            <View style={styles.cardRow}>
              <Ionicons name="call-outline" size={16} color="#666" />
              <Text style={styles.cardText}>{selectedCourt.phoneNumber}</Text>
            </View>
            <View style={styles.cardRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.cardText}>{selectedCourt.hours}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.playerCountCard}>
              <Text style={styles.playerCountNumber}>{selectedCourt.currentPlayers}</Text>
              <Text style={styles.playerCountLabel}># of players</Text>
            </View>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => router.push(`/court/${selectedCourt.id}`)}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // List view for web
  const renderListView = () => (
    <View style={styles.container}>
      {/* Toggle between List and Map */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
          onPress={() => setShowMap(false)}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={!showMap ? '#FFF' : '#666'} 
          />
          <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
          onPress={() => setShowMap(true)}
        >
          <Ionicons 
            name="map" 
            size={20} 
            color={showMap ? '#FFF' : '#666'} 
          />
          <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
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

  return showMap ? renderMapView() : renderListView();
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
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    margin: 16,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  searchIcon: {
    marginRight: 8,
    color: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#FFFFFF',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  courtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  recommendedCard: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFD700',
    marginTop: 20,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    textTransform: 'uppercase',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  courtIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courtDetails: {
    flex: 1,
    marginRight: 8,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  playerCountBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  courtAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  distanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  distanceText: {
    fontSize: 12,
    color: '#999',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#4A90E2',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
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
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  playerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#F8F8F8',
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
  // Map View Styles
  map: {
    flex: 1,
    width: '100%',
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  markerContainer: {
    alignItems: 'center',
  },
  mapPlayerBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  playerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  courtImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  closeCardButton: {
    padding: 4,
  },
  cardBody: {
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerCountCard: {
    alignItems: 'center',
  },
  playerCountNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  playerCountLabel: {
    fontSize: 12,
    color: '#666',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
