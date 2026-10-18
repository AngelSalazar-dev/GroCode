import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { Mail, Lock, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import api from "../../lib/api";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await api.post("/auth/mobile-login", {
        email,
        password,
      });

      await login(response.data.user, response.data.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.error || "Invalid credentials";
      Alert.alert("Login Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 pt-12">
          <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
            <View className="w-20 h-20 bg-indigo-600 rounded-3xl items-center justify-center mb-8 shadow-xl shadow-indigo-300 dark:shadow-indigo-900/40">
                <Text className="text-white text-4xl font-bold">G</Text>
            </View>
            <Text className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-lg mb-12">Login to your GroCode account</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(1000)} className="space-y-6">
            <View>
                <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Email Address</Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-4 border border-slate-100 dark:border-slate-800 focus:border-indigo-500">
                    <Mail size={20} color="#64748b" />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900 dark:text-white"
                        placeholder="name@example.com"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>
            </View>

            <View className="mt-6">
                <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Password</Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-4 border border-slate-100 dark:border-slate-800 focus:border-indigo-500">
                    <Lock size={20} color="#64748b" />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900 dark:text-white"
                        placeholder="••••••••"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>
            </View>

            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleLogin}
                disabled={isLoading}
                className="bg-indigo-600 rounded-2xl py-5 mt-8 flex-row justify-center items-center shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold text-lg mr-2">Sign In</Text>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-8">
                <View className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800" />
                <Text className="mx-4 text-slate-400 dark:text-slate-600 font-medium text-xs">OR CONTINUE WITH</Text>
                <View className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800" />
            </View>

            <TouchableOpacity className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-5 flex-row justify-center items-center">
                <Text className="text-slate-700 dark:text-slate-300 font-bold ml-3">Github</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-12 pb-8">
              <Text className="text-slate-500 dark:text-slate-400">Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text className="text-indigo-600 font-bold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
