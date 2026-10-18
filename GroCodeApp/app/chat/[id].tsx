import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { timeAgo } from "@/lib/timeAgo";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
  }, [id]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/${id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await api.post(`/chat/${id}/messages`, { content: newMessage.trim() });
      setMessages([...messages, response.data]);
      setNewMessage("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender.id === user?.id;

    return (
      <View className={`px-4 py-2 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <View className={`flex-row items-end max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          {!isOwnMessage && (
            <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden mr-2">
              {item.sender.image ? (
                <Image source={{ uri: item.sender.image }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Text className="text-indigo-600 text-xs font-bold">{item.sender.name?.[0]}</Text>
                </View>
              )}
            </View>
          )}
          <View className={`rounded-2xl px-4 py-2 ${isOwnMessage ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
            <Text className={`${isOwnMessage ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              {item.content}
            </Text>
          </View>
        </View>
        <Text className={`text-xs text-slate-400 mt-1 ${isOwnMessage ? 'mr-10' : 'ml-10'}`}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black" edges={['top']}>
      <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900 dark:text-white ml-2">Conversación</Text>
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
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 10 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#94a3b8"
              className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 text-slate-900 dark:text-white mr-2"
              editable={!isSending}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className={`p-2 rounded-full ${newMessage.trim() ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <Send size={20} color={newMessage.trim() ? 'white' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
