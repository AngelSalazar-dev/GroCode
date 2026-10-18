import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { Settings, LogOut, MapPin, Globe, Briefcase } from "lucide-react-native";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black" edges={['top']}>
      <ScrollView>
        <View className="bg-white dark:bg-slate-900 px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">Profile</Text>
            <TouchableOpacity className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full">
              <Settings size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <View className="w-32 h-32 rounded-full border-4 border-indigo-50 dark:border-indigo-900/20 p-1 mb-4">
              <View className="w-full h-full rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center overflow-hidden">
                <Text className="text-indigo-600 dark:text-indigo-400 text-4xl font-bold">{user.name[0]}</Text>
              </View>
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</Text>
            <View className="flex-row items-center mt-2 px-3 py-1 bg-indigo-600 rounded-full">
                <Briefcase size={12} color="white" />
                <Text className="text-white text-xs font-bold ml-2">{user.role}</Text>
            </View>
          </View>

          <View className="flex-row justify-around mt-8 border-t border-slate-50 dark:border-slate-800 pt-8">
            <View className="items-center">
                <Text className="text-xl font-bold text-slate-900 dark:text-white">0</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs">Posts</Text>
            </View>
            <View className="items-center">
                <Text className="text-xl font-bold text-slate-900 dark:text-white">0</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs">Followers</Text>
            </View>
            <View className="items-center">
                <Text className="text-xl font-bold text-slate-900 dark:text-white">0</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs">Following</Text>
            </View>
          </View>
        </View>

        <View className="px-6 mt-8">
            <View className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <Text className="text-slate-900 dark:text-white font-bold text-lg mb-4">Account Information</Text>
                
                <View className="space-y-4">
                    <View className="flex-row items-center">
                        <MapPin size={20} color="#94a3b8" />
                        <Text className="text-slate-600 dark:text-slate-400 ml-3">Not set</Text>
                    </View>
                    <View className="flex-row items-center mt-4">
                        <Globe size={20} color="#94a3b8" />
                        <Text className="text-slate-600 dark:text-slate-400 ml-3">{user.email}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity 
                onPress={handleLogout}
                className="mt-8 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-red-50 dark:border-red-900/20 flex-row items-center justify-center"
            >
                <LogOut size={20} color="#ef4444" />
                <Text className="text-red-500 font-bold ml-2">Sign Out</Text>
            </TouchableOpacity>
        </View>
        
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
