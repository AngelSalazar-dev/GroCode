import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, Heart, MessageCircle, UserPlus, Star, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInRight } from "react-native-reanimated";
import api from "@/lib/api";
import { timeAgo } from "@/lib/timeAgo";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  postId?: string;
  sender?: {
    id: string;
    name: string;
    image: string | null;
  };
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "LIKE":
      return { icon: Heart, color: "#ef4444" };
    case "COMMENT":
      return { icon: MessageCircle, color: "#0ea5e9" };
    case "FOLLOW":
      return { icon: UserPlus, color: "#6366f1" };
    case "MENTORSHIP_REQUEST":
      return { icon: UserPlus, color: "#10b981" };
    case "MENTORSHIP_ACCEPTED":
      return { icon: Star, color: "#eab308" };
    default:
      return { icon: Bell, color: "#64748b" };
  }
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isMarkingAll) return;
    
    setIsMarkingAll(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await api.post("/notifications/mark-all-read");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      Alert.alert("Error", "No se pudieron marcar las notificaciones");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!notification.read) {
      try {
        await api.post(`/notifications/${notification.id}/read`);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    if (notification.postId) {
      router.push(`/post/${notification.postId}` as any);
    } else if (notification.sender?.id) {
      router.push(`/profile/${notification.sender.id}` as any);
    }
  };

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
    const { icon: Icon, color } = getNotificationIcon(item.type);

    return (
      <Animated.View entering={FadeInRight.delay(index * 50)}>
        <TouchableOpacity 
          onPress={() => handleNotificationPress(item)}
          className={`flex-row items-center px-6 py-4 border-b border-slate-50 dark:border-slate-900/50 ${!item.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
        >
          <View 
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={24} color={color} />
          </View>
          
          <View className="flex-1 ml-4">
            <Text className="text-slate-900 dark:text-slate-100 text-sm leading-5">
              {item.message}
            </Text>
            <Text className="text-slate-400 dark:text-slate-600 text-xs mt-1">
              {timeAgo(item.createdAt)}
            </Text>
          </View>

          {!item.read && (
            <View className="w-2 h-2 rounded-full bg-indigo-600 ml-2" />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                <ChevronLeft size={28} color="#64748b" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-900 dark:text-white ml-2">Notificaciones</Text>
        </View>
        <TouchableOpacity onPress={handleMarkAllAsRead} disabled={isMarkingAll}>
            {isMarkingAll ? (
                <ActivityIndicator size="small" color="#6366f1" />
            ) : (
                <Text className="text-indigo-600 font-bold">Marcar todo leído</Text>
            )}
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-slate-50/50 dark:bg-black">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Bell size={64} color="#e2e8f0" />
                <Text className="text-slate-400 dark:text-slate-600 text-lg mt-4 font-medium">No hay notificaciones</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
