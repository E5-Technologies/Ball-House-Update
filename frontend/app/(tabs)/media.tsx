import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export default function MediaScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('NBA basketball highlights');
  const { token } = useAuth();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async (query?: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/media/youtube`, {
        params: { query: query || searchQuery },
      });
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    Linking.openURL(url);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchVideos(searchQuery.trim());
    }
  };

  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity style={styles.videoCard} onPress={() => openVideo(item.id)}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.playIconContainer}>
        <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.videoMeta}>
          <Ionicons name="person-circle-outline" size={16} color="#888" />
          <Text style={styles.channelName} numberOfLines={1}>
            {item.channelTitle}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && videos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search basketball videos..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={() => fetchVideos()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>No videos found</Text>
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
  searchContainer: {
    padding: 16,
    flexDirection: 'row',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    borderRadius: 12,
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
  searchButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  videoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelName: {
    fontSize: 14,
    color: '#888',
    flex: 1,
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
});
