import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, RefreshControl, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import api from "../../lib/api";
import PostCard from "../../components/PostCard";
import { Plus, Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchPosts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setError(null);
      const response = await api.get(`/posts?page=${pageNum}&limit=10`);
      const data = response.data;
      const newPosts = Array.isArray(data) ? data : (data?.posts ?? []);
      
      if (append) {
        setPosts((prev: any[]) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(newPosts.length === 10);
      setPage(pageNum);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      if (!append) {
        setError("No se pudieron cargar las publicaciones");
        setPosts([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(1, false);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore && !isLoading) {
      setLoadingMore(true);
      fetchPosts(page + 1, true);
    }
  };

  const handleCreatePost = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/modal");
  };

  const handleLikeChange = (postId: string, liked: boolean, count: number) => {
    setPosts((prev: any[]) => prev.map(p => 
      p.id === postId ? { ...p, _count: { ...p._count, likes: count } } : p
    ));
  };

  const handleBookmarkChange = (postId: string, bookmarked: boolean) => {
    // Bookmark state is handled locally in PostCard
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-black">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black" edges={['top']}>
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">GrowCode</Text>
        <TouchableOpacity 
            onPress={() => router.push("/notifications")}
            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl"
        >
            <Bell size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <FlashList
          data={posts}
          renderItem={({ item }) => (
            <PostCard 
              post={item} 
              currentUserId={user?.id}
              onLikeChange={handleLikeChange}
              onBookmarkChange={handleBookmarkChange}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#4f46e5" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#4f46e5"
            />
          }
          ListEmptyComponent={
            <View className="py-20 items-center">
              {error ? (
                <Text className="text-red-500 text-center">{error}</Text>
              ) : (
                <Text className="text-slate-400 dark:text-slate-600 text-lg">No hay publicaciones aún.</Text>
              )}
            </View>
          }
        />
      </View>

      <TouchableOpacity 
        activeOpacity={0.8}
        className="absolute bottom-8 right-8 w-16 h-16 bg-indigo-600 rounded-full items-center justify-center shadow-xl shadow-indigo-300 dark:shadow-indigo-900/40"
        onPress={handleCreatePost}
      >
        <Plus color="white" size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
