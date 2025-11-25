import React, { useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProfileScreen() {
  const { user, token, logout, updateUser } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // Generate pixel art avatar URLs using DiceBear API
  const avatarSeeds = [
    'Felix', 'Aneka', 'Brooklynn', 'Callie', 'Chance', 'Chester', 
    'Cleo', 'Coco', 'Cuddles', 'Daisy', 'Felix2', 'Fluffy',
    'Garfield', 'George', 'Ginger', 'Gizmo', 'Gracie', 'Harley',
    'Jasper', 'Kiki', 'Kitty', 'Leo', 'Lily', 'Loki'
  ];
  
  const generateAvatarUrl = (seed: string) => {
    return `https://api.dicebear.com/7.x/pixel-art/png?seed=${seed}&size=200&backgroundColor=5B7C99`;
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
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

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permission is required to change profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploading(true);
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const response = await axios.put(
          `${API_URL}/api/users/profile`,
          { profilePic: base64Image },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        updateUser({ profilePic: base64Image });
        Alert.alert('Success', 'Profile picture updated');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploading(false);
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
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={uploading}>
          {user.profilePic ? (
            <Image source={{ uri: user.profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(user.username)}</Text>
            </View>
          )}
          <View style={styles.editIconContainer}>
            <Ionicons name="camera" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIcon}>
              <Ionicons 
                name={user.isPublic ? "eye" : "eye-off"} 
                size={24} 
                color={user.isPublic ? "#4CAF50" : "#FF6B35"} 
              />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>
                {user.isPublic ? "Public Profile" : "Private Profile"}
              </Text>
              <Text style={styles.settingDescription}>
                {user.isPublic 
                  ? "You are visible to others and counted in court player totals"
                  : "You are hidden from others and not counted in player totals"}
              </Text>
            </View>
          </View>
          <Switch
            value={user.isPublic}
            onValueChange={handleTogglePrivacy}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={user.isPublic ? '#FFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="person-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="help-circle-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FFF" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#888',
  },
  section: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  version: {
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
    marginTop: 24,
  },
});
