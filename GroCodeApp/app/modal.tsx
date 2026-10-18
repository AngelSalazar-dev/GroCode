import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { X, Send, Image as ImageIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import api from "../lib/api";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreatePostModal() {
  const [content, setContent] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please write something first.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/posts", { content, resourceUrl });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Could not create post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-100 dark:border-slate-800">
          <TouchableOpacity onPress={handleCancel} className="p-2">
            <X size={24} color="#64748b" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900 dark:text-white">New Post</Text>
          <TouchableOpacity 
            onPress={handleCreatePost} 
            disabled={isLoading || !content.trim()}
            className={`px-4 py-2 rounded-full ${content.trim() ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View className="flex-row items-center">
                <Text className={`font-bold ${content.trim() ? 'text-white' : 'text-slate-400'}`}>Post</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-1 p-6">
          <TextInput
            multiline
            autoFocus
            className="text-lg text-slate-900 dark:text-slate-100 h-40"
            placeholder="What's on your mind?"
            placeholderTextColor="#94a3b8"
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />

          <View className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl flex-row items-center">
            <ImageIcon size={20} color="#64748b" />
            <TextInput
              className="flex-1 ml-3 text-slate-900 dark:text-slate-100"
              placeholder="Image URL (optional)"
              placeholderTextColor="#94a3b8"
              value={resourceUrl}
              onChangeText={setResourceUrl}
            />
          </View>
          
          <View className="mt-auto">
             <Text className="text-slate-400 dark:text-slate-600 text-center text-xs">
                Sharing your progress inspires others in the community!
             </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
