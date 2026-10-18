import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { User, Mail, Lock, UserCheck, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import api from "../../lib/api";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"JUNIOR" | "SENIOR">("JUNIOR");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    if (password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post("/auth/register", {
        name,
        email,
        password,
        role,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Account created successfully! Please sign in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") }
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.error || "Registration failed";
      Alert.alert("Error", message);
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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 pt-8">
          <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
            <Text className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Create Account</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-lg mb-10">Join the GrowCode community</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(1000)} className="space-y-5">
            <View>
                <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Full Name</Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-4 border border-slate-100 dark:border-slate-800">
                    <User size={20} color="#64748b" />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900 dark:text-white"
                        placeholder="John Doe"
                        placeholderTextColor="#94a3b8"
                        value={name}
                        onChangeText={setName}
                    />
                </View>
            </View>

            <View className="mt-4">
                <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Email Address</Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-4 border border-slate-100 dark:border-slate-800">
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

            <View className="mt-4">
                <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Password</Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-4 border border-slate-100 dark:border-slate-800">
                    <Lock size={20} color="#64748b" />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900 dark:text-white"
                        placeholder="Create a password"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>
            </View>

            <View className="mt-4">
                <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">I am a...</Text>
                <View className="flex-row space-x-4">
                    <TouchableOpacity 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setRole("JUNIOR");
                        }}
                        className={`flex-1 py-4 rounded-2xl border flex-row items-center justify-center ${role === "JUNIOR" ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"}`}
                    >
                        <Text className={`font-bold ${role === "JUNIOR" ? "text-white" : "text-slate-500"}`}>Junior</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setRole("SENIOR");
                        }}
                        className={`flex-1 py-4 rounded-2xl border flex-row items-center justify-center ${role === "SENIOR" ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"}`}
                    >
                        <Text className={`font-bold ${role === "SENIOR" ? "text-white" : "text-slate-500"}`}>Senior</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleRegister}
                disabled={isLoading}
                className="bg-indigo-600 rounded-2xl py-5 mt-6 flex-row justify-center items-center shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold text-lg mr-2">Create Account</Text>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8 pb-12">
              <Text className="text-slate-500 dark:text-slate-400">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text className="text-indigo-600 font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
