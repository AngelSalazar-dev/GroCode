import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import MentorshipRequestCard from "../../components/MentorshipRequestCard";
import * as Haptics from "expo-haptics";
import { Users, UserCheck } from "lucide-react-native";

interface Mentor {
  id: string;
  name: string;
  image: string | null;
  role: string;
  createdAt: string;
  _count: {
    posts: number;
  };
}

export default function MentorshipScreen() {
  const [activeTab, setActiveTab] = useState<"requests" | "explore">("requests");
  const [requests, setRequests] = useState([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      const response = await api.get("/mentorship");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching mentorship requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMentors = async () => {
    if (mentors.length > 0) return;
    setIsLoadingMentors(true);
    try {
      const response = await api.get("/mentorship?browse=true");
      setMentors(response.data);
    } catch (error) {
      console.error("Error fetching mentors:", error);
    } finally {
      setIsLoadingMentors(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (activeTab === "explore") {
      fetchMentors();
    }
  }, [activeTab]);

  const handleUpdateStatus = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.patch("/mentorship", { requestId, status });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Éxito", `Solicitud ${status === "ACCEPTED" ? "aceptada" : "rechazada"}`);
      fetchRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  const renderMentor = ({ item }: { item: Mentor }) => (
    <TouchableOpacity
      onPress={() => router.push(`/mentor/${item.id}` as any)}
      className="flex-row items-center bg-white dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-slate-100 dark:border-slate-800"
    >
      <View className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden mr-4">
        {item.image ? (
          <Image source={{ uri: item.image }} className="w-full h-full" transition={200} />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">{item.name?.[0]}</Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className="font-bold text-slate-900 dark:text-white text-lg">{item.name}</Text>
        <View className="flex-row items-center mt-1">
          <View className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 mr-2">
            <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">SENIOR</Text>
          </View>
          <Text className="text-slate-500 text-sm">{item._count.posts} posts</Text>
        </View>
      </View>
      <UserCheck size={20} color="#6366f1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black" edges={['top']}>
      <View className="px-6 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Mentoría</Text>
        <Text className="text-slate-500 dark:text-slate-400">Conecta con mentores experimentados</Text>
      </View>

      <View className="flex-row px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => setActiveTab("requests")}
          className={`flex-1 py-2 rounded-xl mr-2 ${activeTab === "requests" ? "bg-indigo-600" : "bg-slate-100 dark:bg-slate-800"}`}
        >
          <Text className={`text-center font-bold ${activeTab === "requests" ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
            Solicitudes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("explore")}
          className={`flex-1 py-2 rounded-xl ${activeTab === "explore" ? "bg-indigo-600" : "bg-slate-100 dark:bg-slate-800"}`}
        >
          <Text className={`text-center font-bold ${activeTab === "explore" ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
            Explorar Mentores
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        {activeTab === "requests" ? (
          isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#4f46e5" />
            </View>
          ) : (
            <FlatList
              data={requests}
              renderItem={({ item }) => (
                <MentorshipRequestCard 
                  request={item} 
                  isSenior={user?.role === "SENIOR"} 
                  onUpdateStatus={handleUpdateStatus}
                />
              )}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={{ padding: 20 }}
              ListEmptyComponent={
                <View className="py-20 items-center">
                  <Text className="text-slate-400 dark:text-slate-600 text-lg">No hay solicitudes</Text>
                </View>
              }
            />
          )
        ) : (
          isLoadingMentors ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#4f46e5" />
            </View>
          ) : (
            <FlatList
              data={mentors}
              renderItem={renderMentor}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20 }}
              ListEmptyComponent={
                <View className="py-20 items-center">
                  <Users size={48} color="#e2e8f0" />
                  <Text className="text-slate-400 dark:text-slate-600 text-lg mt-4">No hay mentores disponibles</Text>
                </View>
              }
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}
