import React, { useState } from "react";
import { View, Text, TouchableOpacity, Share, Alert } from "react-native";
import { Image } from "expo-image";
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from "react-native-reanimated";
import { timeAgo } from "@/lib/timeAgo";
import { useRouter } from "expo-router";
import api from "@/lib/api";

interface Author {
  id: string;
  name: string;
  image: string | null;
  role: string;
}

interface PostProps {
  post: {
    id: string;
    content: string;
    resourceUrl: string | null;
    author: Author;
    createdAt: string;
    _count: {
      likes: number;
      comments: number;
      bookmarks: number;
    };
    likes?: Array<{ userId: string }>;
    bookmarks?: Array<{ userId: string }>;
  };
  currentUserId?: string;
  onLikeChange?: (postId: string, liked: boolean, count: number) => void;
  onBookmarkChange?: (postId: string, bookmarked: boolean) => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;

export default function PostCard({ post, currentUserId, onLikeChange, onBookmarkChange }: PostProps) {
  const [liked, setLiked] = useState(currentUserId ? post.likes?.some(l => l.userId === currentUserId) ?? false : false);
  const [bookmarked, setBookmarked] = useState(currentUserId ? post.bookmarks?.some(b => b.userId === currentUserId) ?? false : false);
  const [likesCount, setLikesCount] = useState(post._count?.likes ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const router = useRouter();

  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.98);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  const handleLike = async () => {
    if (isLiking || !currentUserId) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 4 }),
      withSpring(1, { damping: 6 })
    );
    
    const newLiked = !liked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;
    
    setLiked(newLiked);
    setLikesCount(newCount);
    setIsLiking(true);

    try {
      await api.post(`/posts/${post.id}/like`);
      onLikeChange?.(post.id, newLiked, newCount);
    } catch (error) {
      setLiked(!newLiked);
      setLikesCount(likesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking || !currentUserId) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newBookmarked = !bookmarked;
    
    setBookmarked(newBookmarked);
    setIsBookmarking(true);

    try {
      await api.post(`/posts/${post.id}/bookmark`);
      onBookmarkChange?.(post.id, newBookmarked);
    } catch (error) {
      setBookmarked(!newBookmarked);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleComment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/post/${post.id}` as any);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Check out this post on GrowCode: ${post.content.substring(0, 100)}...`,
      });
    } catch (e) {
      // silently fail
    }
  };

  const isImage = post.resourceUrl && IMAGE_EXTENSIONS.test(post.resourceUrl);

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.9}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={animatedStyle}
      className="bg-white dark:bg-slate-900 mb-4 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800"
    >
      {/* Author Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity 
          onPress={() => router.push(`/profile/${post.author.id}` as any)}
          className="flex-row items-center flex-1"
        >
          <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden mr-3">
            {post.author.image ? (
              <Image 
                source={{ uri: post.author.image }} 
                className="w-full h-full" 
                transition={200}
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{post.author.name?.[0]}</Text>
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 dark:text-slate-100 font-bold text-base">{post.author.name}</Text>
            <View className="flex-row items-center">
               <View className={`px-2 py-0.5 rounded-full mr-2 ${post.author.role === 'SENIOR' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                  <Text className={`text-[10px] font-bold ${post.author.role === 'SENIOR' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {post.author.role}
                  </Text>
               </View>
               <Text className="text-slate-400 dark:text-slate-500 text-xs">{timeAgo(post.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} className="p-2">
          <Share2 size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text className="text-slate-800 dark:text-slate-200 text-base leading-6 mb-4">{post.content}</Text>

      {/* Resource Preview */}
      {post.resourceUrl && isImage && (
        <View className="w-full h-52 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
          <Image 
            source={{ uri: post.resourceUrl }} 
            className="w-full h-full" 
            contentFit="cover"
            transition={300}
          />
        </View>
      )}

      {post.resourceUrl && !isImage && (
        <TouchableOpacity 
          onPress={() => Share.share({ url: post.resourceUrl! })}
          className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 mb-4"
        >
          <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-medium" numberOfLines={2}>
            {post.resourceUrl}
          </Text>
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
        <View className="flex-row items-center space-x-6">
          <TouchableOpacity 
            onPress={handleLike}
            className="flex-row items-center"
            disabled={isLiking}
          >
            <Animated.View style={heartAnimStyle}>
              <Heart 
                size={22} 
                color={liked ? "#ef4444" : "#64748b"} 
                fill={liked ? "#ef4444" : "none"} 
              />
            </Animated.View>
            <Text className={`ml-2 font-medium ${liked ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleComment} className="flex-row items-center">
            <MessageCircle size={22} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 ml-2 font-medium">{post._count?.comments ?? 0}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleBookmark} disabled={isBookmarking}>
          <Bookmark 
            size={22} 
            color={bookmarked ? "#6366f1" : "#64748b"} 
            fill={bookmarked ? "#6366f1" : "none"} 
          />
        </TouchableOpacity>
      </View>
    </AnimatedTouchableOpacity>
  );
}
