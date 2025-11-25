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
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with spacing

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  isLiked?: boolean;
  likes?: number;
}

interface User {
  id: string;
  username: string;
  profilePic?: string;
}

export default function MediaScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchVideos();
    fetchUsers();
  }, []);

  const fetchVideos = async (query?: string) => {
    setLoading(true);
    try {
      const searchTerm = query || 'NBA basketball highlights';
      const response = await axios.get(`${API_URL}/api/media/youtube`, {
        params: { query: searchTerm },
      });
      
      // Add random like counts for demo
      const videosWithLikes = response.data.map((video: Video) => ({
        ...video,
        likes: Math.floor(Math.random() * 20) + 1
      }));
      
      setVideos(videosWithLikes);
    } catch (error) {
      console.error('Error fetching videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchVideos(searchQuery);
    }
  };

  const toggleLike = (videoId: string) => {
    setLikedVideos((prev) => {
      const newLikes = new Set(prev);
      if (newLikes.has(videoId)) {
        newLikes.delete(videoId);
      } else {
        newLikes.add(videoId);
      }
      return newLikes;
    });
  };

  const handleShare = async (userId: string) => {
    if (!selectedVideo) return;

    try {
      await axios.post(
        `${API_URL}/api/messages/send`,
        {
          receiverId: userId,
          content: `Check out this video: ${selectedVideo.title} - https://youtube.com/watch?v=${selectedVideo.id}`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Success', 'Video shared successfully!');
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing video:', error);
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
    setShowPlayerModal(true);
  };

  const renderVideoCard = ({ item }: { item: Video }) => {
    const isLiked = likedVideos.has(item.id);
    const displayLikes = isLiked ? (item.likes || 0) + 1 : (item.likes || 0);

    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => openVideo(item)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        
        {/* Play Button Overlay */}
        <View style={styles.playButtonOverlay}>
          <Ionicons name="play-circle" size={50} color="white" style={styles.playIcon} />
        </View>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(item.id)}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color="#FF0000"
          />
          <Text style={styles.likeCount}>{displayLikes}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const nbaNewsVideos = videos.slice(0, 2);
  const trendingVideos = videos.slice(2, 6);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Promotional Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Stream Top Sports News!{'\n'}Post & Share Highlights
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            {/* NBA News Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NBA News</Text>
              <View style={styles.videoGrid}>
                {nbaNewsVideos.map((video, index) => (
                  <View key={video.id} style={[styles.videoCardWrapper, index % 2 === 1 && styles.videoCardRight]}>
                    {renderVideoCard({ item: video })}
                  </View>
                ))}
              </View>
            </View>

            {/* Trending Videos Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trending Videos</Text>
              <View style={styles.videoGrid}>
                {trendingVideos.map((video, index) => (
                  <View key={video.id} style={[styles.videoCardWrapper, index % 2 === 1 && styles.videoCardRight]}>
                    {renderVideoCard({ item: video })}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Video Player Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlayerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedVideo?.title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPlayerModal(false)}
              >
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            {selectedVideo && (
              <View style={styles.playerContent}>
                {Platform.OS === 'web' ? (
                  <iframe
                    width="100%"
                    height="250"
                    src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ borderRadius: 8 }}
                  />
                ) : (
                  <View style={styles.nativeVideoPlaceholder}>
                    <TouchableOpacity
                      style={styles.watchOnYouTubeButton}
                      onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${selectedVideo.id}`)}
                    >
                      <Ionicons name="logo-youtube" size={40} color="#FF0000" />
                      <Text style={styles.watchOnYouTubeText}>Watch on YouTube</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.playerInfo}>
                  <Text style={styles.playerTitle}>{selectedVideo.title}</Text>
                  <Text style={styles.playerChannel}>{selectedVideo.channelTitle}</Text>
                </View>

                <View style={styles.playerActions}>
                  <TouchableOpacity
                    style={styles.playerAction}
                    onPress={() => toggleLike(selectedVideo.id)}
                  >
                    <Ionicons
                      name={likedVideos.has(selectedVideo.id) ? 'heart' : 'heart-outline'}
                      size={24}
                      color="#FF0000"
                    />
                    <Text style={styles.playerActionText}>Like</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playerAction}
                    onPress={() => {
                      setShowPlayerModal(false);
                      setTimeout(() => setShowShareModal(true), 300);
                    }}
                  >
                    <Ionicons name="share-outline" size={24} color="#888" />
                    <Text style={styles.playerActionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Video</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowShareModal(false)}
              >
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => handleShare(item.id)}
                >
                  {item.profilePic ? (
                    <Image source={{ uri: item.profilePic }} style={styles.userAvatar} />
                  ) : (
                    <View style={styles.userAvatarPlaceholder}>
                      <Text style={styles.userAvatarText}>
                        {item.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.username}>{item.username}</Text>
                </TouchableOpacity>
              )}
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
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  searchIcon: {
    marginRight: Spacing.sm,
    color: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  banner: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: '#2A2A2A',
    borderRadius: 25,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  videoCardWrapper: {
    width: cardWidth,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  videoCardRight: {
    marginTop: 20,
  },
  videoCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playIcon: {
    opacity: 0.9,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  likeCount: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  loader: {
    marginTop: 50,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
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
    borderBottomColor: '#333',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
  },
  playerContent: {
    padding: 20,
  },
  nativeVideoPlaceholder: {
    height: 250,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  watchOnYouTubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  watchOnYouTubeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  playerInfo: {
    marginTop: 16,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  playerChannel: {
    fontSize: 14,
    color: '#888',
  },
  playerActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 24,
  },
  playerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerActionText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
