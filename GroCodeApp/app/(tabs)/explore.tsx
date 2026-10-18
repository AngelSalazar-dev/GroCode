import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Map, ChevronRight, Star, Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import api from "../../lib/api";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function ExploreScreen() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchMentors = useCallback(async () => {
    try {
      // Use the new browse endpoint
      const response = await api.get("/mentorship?browse=true");
      setMentors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching mentors:", error);
      setMentors([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMentors();
  }, [fetchMentors]);

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  // Skeleton placeholder for loading state
  const SkeletonCard = () => (
    <View className="w-[48%] bg-slate-100 dark:bg-slate-900 rounded-[28px] p-4 mb-4 border border-slate-100 dark:border-slate-800">
      <View className="items-center">
        <View className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 mb-3" />
        <View className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-full mb-2" />
        <View className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded-full mb-3" />
        <View className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
      <View className="px-6 py-4">
        <Text className="text-3xl font-black text-slate-900 dark:text-white mb-6">Explore</Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-900 rounded-2xl px-4 py-3 mb-8">
            <Search size={20} color="#94a3b8" />
            <TextInput 
                className="flex-1 ml-3 text-slate-900 dark:text-white font-medium"
                placeholder="Search mentors, roadmaps..."
                placeholderTextColor="#94a3b8"
            />
        </View>

        <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={onRefresh}
                    tintColor="#6366f1"
                    colors={["#6366f1"]}
                />
            }
        >
            {/* Roadmap Card */}
            <Animated.View entering={FadeInUp.delay(100)}>
                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => handlePress("/roadmap")}
                    className="bg-indigo-600 rounded-[32px] p-6 mb-8 shadow-lg shadow-indigo-300 dark:shadow-none"
                >
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 pr-4">
                            <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-3">
                                <Text className="text-white text-[10px] font-black uppercase tracking-widest">Featured</Text>
                            </View>
                            <Text className="text-white text-2xl font-black mb-2">Learning Roadmap</Text>
                            <Text className="text-indigo-100 text-sm leading-5 font-medium">
                                Follow the community-driven path to master modern development.
                            </Text>
                        </View>
                        <View className="bg-white/10 p-4 rounded-3xl">
                            <Map size={32} color="white" />
                        </View>
                    </View>
                    <View className="mt-6 flex-row items-center">
                        <Text className="text-white font-bold mr-2">Start Journey</Text>
                        <ChevronRight size={16} color="white" />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Mentors Section */}
            <View className="mb-6 flex-row justify-between items-center">
                <Text className="text-xl font-black text-slate-900 dark:text-white">Top Mentors</Text>
                <TouchableOpacity>
                    <Text className="text-indigo-600 font-bold">View All</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View className="flex-row flex-wrap justify-between">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </View>
            ) : (
                <View className="flex-row flex-wrap justify-between">
                    {mentors.length > 0 ? mentors.map((mentor: any) => (
                        <TouchableOpacity 
                            key={mentor.id}
                            activeOpacity={0.8}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            className="w-[48%] bg-slate-50 dark:bg-slate-900 rounded-[28px] p-4 mb-4 border border-slate-100 dark:border-slate-800"
                        >
                            <View className="items-center">
                                <View className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 p-1 mb-3">
                                    <View className="w-full h-full rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center overflow-hidden">
                                        <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-2xl">{mentor.name?.[0] ?? "?"}</Text>
                                    </View>
                                </View>
                                <Text className="text-slate-900 dark:text-white font-bold text-center mb-1" numberOfLines={1}>{mentor.name}</Text>
                                <View className="flex-row items-center mb-3">
                                    <Star size={12} color="#eab308" fill="#eab308" />
                                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] ml-1 font-bold">
                                        {mentor._count?.posts ?? 0} posts
                                    </Text>
                                </View>
                                <TouchableOpacity className="bg-indigo-600 px-4 py-2 rounded-full w-full items-center">
                                    <Text className="text-white text-[10px] font-bold">Connect</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )) : (
                        <View className="w-full py-10 items-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                             <Users size={32} color="#94a3b8" />
                             <Text className="text-slate-400 mt-2 font-bold">No mentors found yet</Text>
                             <Text className="text-slate-300 dark:text-slate-600 text-xs mt-1">Seniors will appear here once they join.</Text>
                        </View>
                    )}
                </View>
            )}
            
            <View className="h-20" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
