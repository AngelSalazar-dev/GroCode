import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, MapPin, Calendar, ShieldCheck, UserPlus, UserCheck, MessageCircle, ExternalLink } from "lucide-react-native";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

interface MentorProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
  reviewsReceived?: Array<{
    id: string;
    rating: number;
    comment: string | null;
    reviewer: { name: string; image: string | null };
  }>;
}

export default function MentorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setProfile(response.data);
      
      if (user?.id && id !== user.id) {
        const [followRes, requestRes] = await Promise.all([
          api.get(`/users/${id}/is-following`).catch(() => ({ data: false })),
          api.get(`/mentorship?seniorId=${id}&status=PENDING`).catch(() => ({ data: null })),
        ]);
        setIsFollowing(followRes.data);
        setHasPendingRequest(!!requestRes.data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "No se pudo cargar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post(`/users/${id}/follow`);
      setIsFollowing(!isFollowing);
      setProfile(prev => prev ? {
        ...prev,
        _count: {
          ...prev._count,
          followers: isFollowing ? prev._count.followers - 1 : prev._count.followers + 1
        }
      } : null);
    } catch (error) {
      Alert.alert("Error", "No se pudo procesar la acción");
    }
  };

  const handleRequestMentorship = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await api.post("/mentorship", { seniorId: id, message: "Me gustaría que fueras mi mentor." });
      setHasPendingRequest(true);
      Alert.alert("Éxito", "Solicitud de mentoría enviada");
    } catch (error: any) {
      const message = error.response?.data?.error || "No se pudo enviar la solicitud";
      Alert.alert("Error", message);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-black">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-black">
        <Text className="text-slate-500">Perfil no encontrado</Text>
      </View>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black" edges={['top']}>
      <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900 dark:text-white ml-2">Perfil</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8 items-center">
          <View className="w-28 h-28 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden mb-4">
            {profile.image ? (
              <Image source={{ uri: profile.image }} className="w-full h-full" transition={200} />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-3xl">{profile.name?.[0]}</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center mb-2">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</Text>
            {profile.role === "SENIOR" && (
              <ShieldCheck size={22} color="#f59e0b" className="ml-2" />
            )}
          </View>

          <Text className="text-slate-500 dark:text-slate-400 mb-1">@{profile.name?.toLowerCase().replace(/\s+/g, '')}</Text>

          <View className={`px-3 py-1 rounded-full mb-4 ${profile.role === 'SENIOR' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
            <Text className={`text-xs font-bold ${profile.role === 'SENIOR' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {profile.role}
            </Text>
          </View>

          {profile.bio && (
            <Text className="text-slate-600 dark:text-slate-300 text-center mb-4 leading-6">{profile.bio}</Text>
          )}

          <View className="flex-row items-center mb-4">
            {profile.location && (
              <View className="flex-row items-center mr-4">
                <MapPin size={14} color="#64748b" />
                <Text className="text-slate-500 text-sm ml-1">{profile.location}</Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Calendar size={14} color="#64748b" />
              <Text className="text-slate-500 text-sm ml-1">
                {new Date(profile.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>

          <View className="flex-row mb-6">
            <View className="items-center mx-4">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">{profile._count.posts}</Text>
              <Text className="text-xs text-slate-500">Posts</Text>
            </View>
            <View className="items-center mx-4">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">{profile._count.followers}</Text>
              <Text className="text-xs text-slate-500">Seguidores</Text>
            </View>
            <View className="items-center mx-4">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">{profile._count.following}</Text>
              <Text className="text-xs text-slate-500">Siguiendo</Text>
            </View>
          </View>

          {!isOwnProfile && user && (
            <View className="flex-row w-full space-x-3">
              <TouchableOpacity
                onPress={handleFollow}
                className={`flex-1 py-3 rounded-2xl flex-row items-center justify-center ${
                  isFollowing 
                    ? "bg-slate-200 dark:bg-slate-800" 
                    : "bg-indigo-600"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={18} color="#64748b" />
                    <Text className="text-slate-600 dark:text-slate-300 font-bold ml-2">Siguiendo</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} color="white" />
                    <Text className="text-white font-bold ml-2">Seguir</Text>
                  </>
                )}
              </TouchableOpacity>

              {profile.role === "SENIOR" && (
                <TouchableOpacity
                  onPress={handleRequestMentorship}
                  disabled={hasPendingRequest}
                  className={`flex-1 py-3 rounded-2xl flex-row items-center justify-center ${
                    hasPendingRequest 
                      ? "bg-slate-200 dark:bg-slate-800" 
                      : "bg-emerald-600"
                  }`}
                >
                  <MessageCircle size={18} color={hasPendingRequest ? "#64748b" : "white"} />
                  <Text className={`font-bold ml-2 ${hasPendingRequest ? "text-slate-600 dark:text-slate-300" : "text-white"}`}>
                    {hasPendingRequest ? "Solicitud Pendiente" : "Solicitar Mentoría"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {profile.reviewsReceived && profile.reviewsReceived.length > 0 && (
          <View className="px-6 pb-8">
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reseñas</Text>
            {profile.reviewsReceived.map((review) => (
              <View key={review.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden mr-2">
                    {review.reviewer.image ? (
                      <Image source={{ uri: review.reviewer.image }} className="w-full h-full" />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Text className="text-indigo-600 text-xs font-bold">{review.reviewer.name?.[0]}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">{review.reviewer.name}</Text>
                  <Text className="text-amber-500 ml-auto">{"⭐".repeat(review.rating)}</Text>
                </View>
                {review.comment && (
                  <Text className="text-slate-600 dark:text-slate-300 text-sm">{review.comment}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
