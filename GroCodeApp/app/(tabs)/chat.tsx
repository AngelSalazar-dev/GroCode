import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { timeAgo } from "@/lib/timeAgo";

interface ChatChannel {
  id: string;
  name: string | null;
  createdAt: string;
  participants: Array<{
    user: {
      id: string;
      name: string;
      image: string | null;
    };
  }>;
  messages: Array<{
    content: string;
    createdAt: string;
  }>;
  _count: {
    messages: number;
  };
}

export default function ChatScreen() {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await api.get("/chat");
      setChannels(response.data);
    } catch (error) {
      console.error("Error fetching chat channels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherParticipant = (channel: ChatChannel) => {
    return channel.participants.find(p => p.user.id !== user?.id)?.user;
  };

  const renderChannel = ({ item }: { item: ChatChannel }) => {
    const otherUser = getOtherParticipant(item);
    const lastMessage = item.messages[0];

    return (
      <TouchableOpacity
        onPress={() => router.push(`/chat/${item.id}` as any)}
        className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800"
      >
        <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden mr-3">
          {otherUser?.image ? (
            <Image source={{ uri: otherUser.image }} className="w-full h-full" transition={200} />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{otherUser?.name?.[0]}</Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="font-bold text-slate-900 dark:text-white">{otherUser?.name}</Text>
          {lastMessage && (
            <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1" numberOfLines={1}>
              {lastMessage.content}
            </Text>
          )}
        </View>
        <View className="items-end">
          {lastMessage && (
            <Text className="text-slate-400 dark:text-slate-500 text-xs">{timeAgo(lastMessage.createdAt)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black" edges={['top']}>
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Mensajes</Text>
      </View>

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <FlatList
            data={channels}
            renderItem={renderChannel}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="py-20 items-center">
                <MessageCircle size={48} color="#e2e8f0" />
                <Text className="text-slate-400 dark:text-slate-600 text-lg mt-4">No hay conversaciones</Text>
                <Text className="text-slate-400 dark:text-slate-600 text-sm mt-2">Inicia una conversación con un mentor</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
