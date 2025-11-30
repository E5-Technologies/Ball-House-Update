import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Colors, BorderRadius, Spacing } from '../../../constants/theme';
import { GeofencingService } from '../../../services/GeofencingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProfileScreen() {
  const { user, token, logout, updateUser } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [networkCount, setNetworkCount] = useState(0);
  const [recentPlayersCount, setRecentPlayersCount] = useState(0);
  const [autoCheckinEnabled, setAutoCheckinEnabled] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(false);

  useEffect(() => {
    fetchNetworkCount();
    fetchRecentPlayersCount();
    checkAutoCheckinStatus();
  }, []);

  const checkAutoCheckinStatus = async () => {
    const isActive = await GeofencingService.isGeofencingActive();
    setAutoCheckinEnabled(isActive);
  };

  const fetchNetworkCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/network/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNetworkCount(response.data.length);
    } catch (error) {
      console.error('Error fetching network count:', error);
    }
  };

  const fetchRecentPlayersCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/network/recent-players`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentPlayersCount(response.data.length);
    } catch (error) {
      console.error('Error fetching recent players count:', error);
    }
  };
  
  // Generate diverse pixel art avatar options - 20 avatars with different races, genders, and styles
  const avatarOptions = [
    { seed: 'avatar1', backgroundColor: 'FFD5B4' },
    { seed: 'avatar2', backgroundColor: 'F1C27D' },
    { seed: 'avatar3', backgroundColor: 'E0AC69' },
    { seed: 'avatar4', backgroundColor: 'C68642' },
    { seed: 'avatar5', backgroundColor: '8D5524' },
    { seed: 'avatar6', backgroundColor: 'FFDBAC' },
    { seed: 'avatar7', backgroundColor: 'F0C8A0' },
    { seed: 'avatar8', backgroundColor: 'D2A679' },
    { seed: 'avatar9', backgroundColor: 'B08862' },
    { seed: 'avatar10', backgroundColor: '704D3A' },
    { seed: 'avatar11', backgroundColor: 'FFE0BD' },
    { seed: 'avatar12', backgroundColor: 'EDB98A' },
    { seed: 'avatar13', backgroundColor: 'D19D6F' },
    { seed: 'avatar14', backgroundColor: 'A17350' },
    { seed: 'avatar15', backgroundColor: '634332' },
    { seed: 'avatar16', backgroundColor: 'FFDFC4' },
    { seed: 'avatar17', backgroundColor: 'E6B88F' },
    { seed: 'avatar18', backgroundColor: 'C99A6E' },
    { seed: 'avatar19', backgroundColor: '9F7A5C' },
    { seed: 'avatar20', backgroundColor: '5C3D2E' },
  ];
  
  const generateAvatarUrl = (seed: string, backgroundColor: string) => {
    return `https://api.dicebear.com/7.x/pixel-art/png?seed=${seed}&size=200&backgroundColor=${backgroundColor}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    try {
      setUploading(true);
      
      const response = await axios.put(
        `${API_URL}/api/users/profile`,
        { avatarUrl: avatarUrl },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      updateUser({ profilePic: avatarUrl, avatarUrl: avatarUrl });
      setShowAvatarModal(false);
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      const response = await axios.put(
        `${API_URL}/api/users/toggle-privacy`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      updateUser({ isPublic: response.data.isPublic });
      Alert.alert(
        'Privacy Updated',
        response.data.isPublic
          ? 'Your profile is now public. You will be counted in court player totals.'
          : 'Your profile is now private. You will not be counted in court player totals.'
      );
    } catch (error) {
      console.error('Error toggling privacy:', error);
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const handleToggleAutoCheckin = async () => {
    if (autoCheckinEnabled) {
      // Disable automatic check-in
      await GeofencingService.stopGeofencing();
      setAutoCheckinEnabled(false);
      Alert.alert(
        'Automatic Check-in Disabled',
        'You will no longer be automatically checked in when you arrive at basketball courts.'
      );
    } else {
      // Enable automatic check-in
      setCheckingPermissions(true);
      
      // Check permissions first
      const permissions = await GeofencingService.checkPermissions();
      
      if (!permissions.foreground || !permissions.background) {
        setCheckingPermissions(false);
        Alert.alert(
          'Location Permission Required',
          'Ball House needs background location permission to automatically check you in when you arrive at a basketball court. Please grant "Allow While Using App" then "Change to Always Allow" in the next screens.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                const success = await GeofencingService.startGeofencing();
                setAutoCheckinEnabled(success);
                setCheckingPermissions(false);
                
                if (!success) {
                  Alert.alert(
                    'Permission Denied',
                    'Background location permission is required for automatic check-ins. You can enable it later in your device settings.'
                  );
                }
              },
            },
          ]
        );
      } else {
        // Permissions already granted, start geofencing
        const success = await GeofencingService.startGeofencing();
        setAutoCheckinEnabled(success);
        setCheckingPermissions(false);
        
        if (success) {
          Alert.alert(
            'Automatic Check-in Enabled',
            'You will be automatically checked in when you arrive within 75 meters of any basketball court. Make sure your profile is set to Public to be counted.'
          );
        }
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={() => setShowAvatarModal(true)} 
            disabled={uploading}
          >
            {user.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(user.username)}</Text>
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="image-outline" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/(tabs)/profile/connections')}
          >
            <Text style={styles.statValue}>{networkCount}</Text>
            <Text style={styles.statLabel}>Network</Text>
          </TouchableOpacity>
          
          <View style={styles.statDivider} />
          
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/(tabs)/profile/recent-players')}
          >
            <Text style={styles.statValue}>{recentPlayersCount}</Text>
            <Text style={styles.statLabel}>Recent Players</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {/* Privacy Toggle */}
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons 
                  name={user.isPublic ? 'globe-outline' : 'lock-closed-outline'} 
                  size={20} 
                  color="#000" 
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Public Profile</Text>
                <Text style={styles.menuSubtitle}>
                  {user.isPublic ? 'You are visible to others' : 'Your profile is private'}
                </Text>
              </View>
            </View>
            <Switch
              value={user.isPublic}
              onValueChange={handleTogglePrivacy}
              trackColor={{ false: '#D1D1D1', true: Colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          {/* Automatic Check-in Toggle */}
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons 
                  name={autoCheckinEnabled ? 'location' : 'location-outline'} 
                  size={20} 
                  color="#000" 
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Automatic Check-in</Text>
                <Text style={styles.menuSubtitle}>
                  {autoCheckinEnabled 
                    ? 'Auto check-in when near courts' 
                    : 'Manually check-in at courts'}
                </Text>
              </View>
            </View>
            <Switch
              value={autoCheckinEnabled}
              onValueChange={handleToggleAutoCheckin}
              disabled={checkingPermissions}
              trackColor={{ false: '#D1D1D1', true: Colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          {/* Edit Profile */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={20} color="#000" />
              </View>
              <Text style={styles.menuTitle}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="settings-outline" size={20} color="#000" />
              </View>
              <Text style={styles.menuTitle}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="help-circle-outline" size={20} color="#000" />
              </View>
              <Text style={styles.menuTitle}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, styles.logoutIconCircle]}>
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              </View>
              <Text style={[styles.menuTitle, styles.logoutText]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* Avatar Selection Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Your Avatar</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAvatarModal(false)}
              >
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select a pixelated character as your profile picture
            </Text>

            <FlatList
              data={avatarOptions}
              keyExtractor={(item) => item.seed}
              numColumns={4}
              contentContainerStyle={styles.avatarGrid}
              renderItem={({ item }) => {
                const avatarUrl = generateAvatarUrl(item.seed, item.backgroundColor);
                return (
                  <TouchableOpacity
                    style={styles.avatarOption}
                    onPress={() => handleSelectAvatar(avatarUrl)}
                    disabled={uploading}
                  >
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarOptionImage}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: '#F8F8F8',
    borderRadius: BorderRadius.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#DDD',
    marginHorizontal: 20,
  },
  menuContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#F8F8F8',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  logoutIconCircle: {
    backgroundColor: '#FFE5E5',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  logoutText: {
    color: '#FF3B30',
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    marginTop: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatarGrid: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  avatarOption: {
    width: '23%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
});
