import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const GEOFENCE_TASK = 'BASKETBALL_COURT_GEOFENCE';
const LOCATION_TRACKING_TASK = 'BACKGROUND_LOCATION_TRACKING';
const GEOFENCE_RADIUS = 75; // meters - about 246 feet, good for basketball court detection
const CHECK_INTERVAL = 30000; // Check every 30 seconds

interface Court {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface GeofenceState {
  currentCourtId: string | null;
  lastCheckTime: number;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Get saved geofence state
async function getGeofenceState(): Promise<GeofenceState> {
  try {
    const state = await AsyncStorage.getItem('geofence_state');
    if (state) {
      return JSON.parse(state);
    }
  } catch (error) {
    console.error('Error reading geofence state:', error);
  }
  return { currentCourtId: null, lastCheckTime: 0 };
}

// Save geofence state
async function saveGeofenceState(state: GeofenceState): Promise<void> {
  try {
    await AsyncStorage.setItem('geofence_state', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving geofence state:', error);
  }
}

// Check user into a court
async function checkInToCourt(courtId: string): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    
    if (!token) {
      console.log('No auth token found, skipping auto check-in');
      return false;
    }

    await axios.post(
      `${apiUrl}/api/courts/${courtId}/checkin`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(`✅ Auto checked-in to court ${courtId}`);
    return true;
  } catch (error) {
    console.error('Error auto checking-in:', error);
    return false;
  }
}

// Check user out of a court
async function checkOutOfCourt(courtId: string): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    
    if (!token) {
      console.log('No auth token found, skipping auto check-out');
      return false;
    }

    await axios.post(
      `${apiUrl}/api/courts/${courtId}/checkout`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(`✅ Auto checked-out of court ${courtId}`);
    return true;
  } catch (error) {
    console.error('Error auto checking-out:', error);
    return false;
  }
}

// Fetch all courts from backend
async function fetchCourts(): Promise<Court[]> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    const response = await axios.get(`${apiUrl}/api/courts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching courts:', error);
    return [];
  }
}

// Process location update and handle geofencing logic
async function processLocationUpdate(location: Location.LocationObject) {
  const { latitude, longitude } = location.coords;
  const state = await getGeofenceState();
  
  // Throttle checks - don't check more than once every 30 seconds
  const now = Date.now();
  if (now - state.lastCheckTime < CHECK_INTERVAL) {
    return;
  }

  // Fetch all courts
  const courts = await fetchCourts();
  if (courts.length === 0) {
    return;
  }

  // Find nearest court within geofence radius
  let nearestCourt: Court | null = null;
  let minDistance = Infinity;

  for (const court of courts) {
    const distance = calculateDistance(
      latitude,
      longitude,
      court.latitude,
      court.longitude
    );

    if (distance < GEOFENCE_RADIUS && distance < minDistance) {
      nearestCourt = court;
      minDistance = distance;
    }
  }

  // Handle geofence transitions
  if (nearestCourt) {
    // User is within a geofence
    if (state.currentCourtId !== nearestCourt.id) {
      // Entering a new court geofence
      if (state.currentCourtId) {
        // Check out of previous court first
        await checkOutOfCourt(state.currentCourtId);
      }
      
      // Check into new court
      const success = await checkInToCourt(nearestCourt.id);
      if (success) {
        await saveGeofenceState({
          currentCourtId: nearestCourt.id,
          lastCheckTime: now,
        });
        console.log(`🏀 Entered geofence of ${nearestCourt.name}`);
      }
    }
  } else {
    // User is not within any geofence
    if (state.currentCourtId) {
      // Exiting current court geofence
      await checkOutOfCourt(state.currentCourtId);
      await saveGeofenceState({
        currentCourtId: null,
        lastCheckTime: now,
      });
      console.log('🚶 Exited all court geofences');
    }
  }

  // Update last check time
  state.lastCheckTime = now;
  await saveGeofenceState(state);
}

// Define the background location tracking task
TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];
      await processLocationUpdate(location);
    }
  }
});

export class GeofencingService {
  // Start background location tracking with geofencing
  static async startGeofencing(): Promise<boolean> {
    try {
      // Check if task is already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        LOCATION_TRACKING_TASK
      );

      if (isRegistered) {
        console.log('Geofencing already running');
        return true;
      }

      // Request permissions
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('Foreground location permission not granted');
        return false;
      }

      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.error('Background location permission not granted');
        return false;
      }

      // Start background location updates
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 25, // Update every 25 meters
        timeInterval: 30000, // Or every 30 seconds
        foregroundService: {
          notificationTitle: 'Ball House',
          notificationBody: 'Tracking your location for automatic court check-ins',
          notificationColor: '#FF6B35',
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });

      console.log('✅ Geofencing started successfully');
      return true;
    } catch (error) {
      console.error('Error starting geofencing:', error);
      return false;
    }
  }

  // Stop background location tracking
  static async stopGeofencing(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        LOCATION_TRACKING_TASK
      );

      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
        console.log('✅ Geofencing stopped');
      }
    } catch (error) {
      console.error('Error stopping geofencing:', error);
    }
  }

  // Check if geofencing is currently running
  static async isGeofencingActive(): Promise<boolean> {
    try {
      return await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK);
    } catch (error) {
      console.error('Error checking geofencing status:', error);
      return false;
    }
  }

  // Get current geofence state
  static async getCurrentState(): Promise<GeofenceState> {
    return await getGeofenceState();
  }

  // Clear geofence state (useful for logout)
  static async clearState(): Promise<void> {
    await saveGeofenceState({ currentCourtId: null, lastCheckTime: 0 });
  }

  // Check permissions status
  static async checkPermissions(): Promise<{
    foreground: boolean;
    background: boolean;
  }> {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();

    return {
      foreground: foreground.status === 'granted',
      background: background.status === 'granted',
    };
  }
}
