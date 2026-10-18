import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Save } from "lucide-react-native";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setWebsite(user.website || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    setIsSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const response = await api.put("/users/me", {
        name: name.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
      });
      
      updateUser(response.data);
      Alert.alert("Éxito", "Perfil actualizado correctamente", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      const message = error.response?.data?.error || "No se pudo actualizar el perfil";
      Alert.alert("Error", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black" edges={['top']}>
      <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">Editar Perfil</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isSaving}
          className="p-2"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <Save size={24} color="#4f46e5" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor="#94a3b8"
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white"
            editable={!isSaving}
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Biografía</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Cuéntanos sobre ti..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white h-24"
            editable={!isSaving}
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ubicación</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Ciudad, País"
            placeholderTextColor="#94a3b8"
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white"
            editable={!isSaving}
          />
        </View>

        <View className="mb-8">
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sitio Web</Text>
          <TextInput
            value={website}
            onChangeText={setWebsite}
            placeholder="https://tusitio.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="url"
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white"
            editable={!isSaving}
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={20} color="white" />
              <Text className="text-white font-bold ml-2">Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
