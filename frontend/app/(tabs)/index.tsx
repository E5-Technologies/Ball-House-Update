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
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width, height } = Dimensions.get('window');

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

export default function MapScreen() {
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

    return (
      <TouchableOpacity
        style={styles.courtCard}
        onPress={() => router.push(`/court/${item.id}`)}
      >
        <View style={styles.courtHeader}>
          <View style={styles.courtInfo}>
            <Text style={styles.courtName}>{item.name}</Text>
            <Text style={styles.courtAddress}>{item.address}</Text>
          </View>
          {distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={16} color="#4A90E2" />
              <Text style={styles.distanceText}>{distance} mi</Text>
            </View>
          )}
        </View>

        <View style={styles.courtDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#888" />
            <Text style={styles.detailText}>{item.hours}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.detailText}>{item.rating.toFixed(1)}</Text>
          </View>

          <View style={[styles.playerBadge, { backgroundColor: playerColor }]}>
            <Ionicons name="people" size={16} color="#FFF" />
            <Text style={styles.playerCount}>{item.currentPlayers}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courts..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {!IS_WEB && (
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          >
            <Ionicons 
              name={viewMode === 'list' ? 'map' : 'list'} 
              size={24} 
              color="#FFF" 
            />
          </TouchableOpacity>
        )}
      </View>

      {viewMode === 'list' ? (
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
            </View>
          }
        />
      ) : !IS_WEB && MapView ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: location?.coords.latitude || 29.7604,
              longitude: location?.coords.longitude || -95.3698,
              latitudeDelta: 0.2,
              longitudeDelta: 0.2,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {filteredCourts.map(court => renderMapMarker(court))}
          </MapView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.mapPreviewContainer}>
          <View style={styles.mapPreviewHeader}>
            <Ionicons name="map" size={80} color="#FF6B35" />
            <Text style={styles.mapPreviewTitle}>Interactive Map View</Text>
            <Text style={styles.mapPreviewSubtitle}>Available on Mobile Only</Text>
          </View>

          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="location" size={32} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Live Heat Map</Text>
              <Text style={styles.featureDescription}>
                See real-time player counts with color-coded markers
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#4A90E2' }]}>
                <Ionicons name="navigate" size={32} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Your Location</Text>
              <Text style={styles.featureDescription}>
                Find courts near you with distance calculations
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="finger-print" size={32} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Tap to Explore</Text>
              <Text style={styles.featureDescription}>
                Tap markers for instant court details and directions
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="layers" size={32} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Toggle Views</Text>
              <Text style={styles.featureDescription}>
                Switch between map and list views instantly
              </Text>
            </View>
          </View>

          <View style={styles.instructionsCard}>
            <Ionicons name="phone-portrait" size={48} color="#FF6B35" />
            <Text style={styles.instructionsTitle}>View on Mobile</Text>
            <Text style={styles.instructionsText}>
              To experience the interactive map with heat visualization:
            </Text>
            
            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Download <Text style={styles.boldText}>Expo Go</Text> app from App Store or Google Play
                </Text>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Scan the QR code in the development console
                </Text>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  Experience the full interactive map with your location!
                </Text>
              </View>
            </View>

            <View style={styles.mapPreviewBadge}>
              <Ionicons name="basketball" size={24} color="#FF6B35" />
              <Text style={styles.mapPreviewBadgeText}>
                {filteredCourts.length} courts in Houston ready to explore
              </Text>
            </View>
          </View>

          <Text style={styles.webNote}>
            For now, browse courts using the list view above
          </Text>
        </ScrollView>
      )}

      {/* Court Details Modal */}
      <Modal
        visible={showCourtModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCourtModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCourtModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedCourt && (
              <>
                <View style={styles.modalHandle} />
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>{selectedCourt.name}</Text>
                  
                  <View style={styles.modalRating}>
                    <Ionicons name="star" size={20} color="#FFD700" />
                    <Text style={styles.modalRatingText}>{selectedCourt.rating.toFixed(1)}</Text>
                  </View>

                  <View style={styles.modalInfoSection}>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="location" size={20} color="#4A90E2" />
                      <Text style={styles.modalInfoText}>{selectedCourt.address}</Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Ionicons name="time" size={20} color="#4A90E2" />
                      <Text style={styles.modalInfoText}>{selectedCourt.hours}</Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Ionicons name="call" size={20} color="#4A90E2" />
                      <Text style={styles.modalInfoText}>{selectedCourt.phoneNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.modalPlayerSection}>
                    <View style={[
                      styles.modalPlayerBadge, 
                      { backgroundColor: getPlayerColor(selectedCourt.currentPlayers) }
                    ]}>
                      <Ionicons name="people" size={24} color="#FFF" />
                      <Text style={styles.modalPlayerCount}>{selectedCourt.currentPlayers}</Text>
                      <Text style={styles.modalPlayerLabel}>Players</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => handleCourtPress(selectedCourt)}
                  >
                    <Text style={styles.modalButtonText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    paddingHorizontal: 16,
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
  toggleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courtInfo: {
    flex: 1,
  },
  courtName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  courtAddress: {
    fontSize: 14,
    color: '#888',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  courtDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#888',
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 'auto',
  },
  playerCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  mapPreviewContainer: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 80,
  },
  mapPreviewHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mapPreviewTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  mapPreviewSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  instructionsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 15,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  stepsList: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#CCC',
    lineHeight: 22,
    paddingTop: 4,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  mapPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  mapPreviewBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  webNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#555',
    marginTop: -1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.7,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  modalRatingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  modalInfoSection: {
    gap: 16,
    marginBottom: 24,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 16,
    color: '#CCC',
  },
  modalPlayerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalPlayerBadge: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  modalPlayerCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  modalPlayerLabel: {
    fontSize: 14,
    color: '#FFF',
    marginTop: 4,
    opacity: 0.9,
  },
  modalButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
