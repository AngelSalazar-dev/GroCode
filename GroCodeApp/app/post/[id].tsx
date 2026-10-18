import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { timeAgo } from "@/lib/timeAgo";
import * as Haptics from "expo-haptics";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string | null;
    role: string;
  };
}

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [id]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/posts/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert("Error", "No se pudieron cargar los comentarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const response = await api.post(`/posts/${id}/comments`, { content: newComment.trim() });
      setComments([response.data, ...comments]);
      setNewComment("");
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el comentario");
    } finally {
      setIsSending(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
      <View className="flex-row">
        <TouchableOpacity 
          onPress={() => router.push(`/profile/${item.author.id}` as any)}
          className="mr-3"
        >
          <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden">
            {item.author.image ? (
              <Image source={{ uri: item.author.image }} className="w-full h-full" transition={200} />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{item.author.name?.[0]}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="font-bold text-slate-900 dark:text-white text-sm mr-2">{item.author.name}</Text>
            <View className={`px-1.5 py-0.5 rounded-full ${item.author.role === 'SENIOR' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
              <Text className={`text-[9px] font-bold ${item.author.role === 'SENIOR' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {item.author.role}
              </Text>
            </View>
          </View>
          <Text className="text-slate-800 dark:text-slate-200 text-sm leading-5">{item.content}</Text>
          <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black" edges={['top']}>
      <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900 dark:text-white ml-2">Comentarios</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="py-20 items-center">
                <Text className="text-slate-400 dark:text-slate-600 text-lg">No hay comentarios aún.</Text>
                <Text className="text-slate-400 dark:text-slate-600 text-sm mt-2">Sé el primero en comentar.</Text>
              </View>
            }
          />
        )}

        <View className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center">
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Escribe un comentario..."
              placeholderTextColor="#94a3b8"
              className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 text-slate-900 dark:text-white mr-2"
              editable={!isSending}
            />
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={!newComment.trim() || isSending}
              className={`p-2 rounded-full ${newComment.trim() ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <Send size={20} color={newComment.trim() ? 'white' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
