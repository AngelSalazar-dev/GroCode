import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Search as SearchIcon, X, User, Users } from "lucide-react-native";
import api from "@/lib/api";

interface SearchResult {
  type: "user" | "post";
  id: string;
  name?: string;
  content?: string;
  image?: string | null;
  role?: string;
  author?: {
    id: string;
    name: string;
    image: string | null;
    role: string;
  };
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      const data = response.data;
      
      const formattedResults: SearchResult[] = [];
      
      if (data.users) {
        data.users.forEach((user: any) => {
          formattedResults.push({
            type: "user",
            id: user.id,
            name: user.name,
            image: user.image,
            role: user.role,
          });
        });
      }
      
      if (data.posts) {
        data.posts.forEach((post: any) => {
          formattedResults.push({
            type: "post",
            id: post.id,
            content: post.content,
            author: post.author,
          });
        });
      }
      
      setResults(formattedResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      void search(text);
    }, 500);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
    if (item.type === "user") {
      return (
        <TouchableOpacity
          onPress={() => router.push(`/profile/${item.id}` as any)}
          className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800"
        >
          <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden mr-3">
            {item.image ? (
              <Image source={{ uri: item.image }} className="w-full h-full" transition={200} />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <User size={20} color="#6366f1" />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="font-bold text-slate-900 dark:text-white">{item.name}</Text>
            <View className={`px-2 py-0.5 rounded-full self-start mt-1 ${item.role === 'SENIOR' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
              <Text className={`text-[10px] font-bold ${item.role === 'SENIOR' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {item.role}
              </Text>
            </View>
          </View>
          <Users size={18} color="#94a3b8" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => router.push(`/post/${item.id}` as any)}
        className="px-4 py-3 border-b border-slate-100 dark:border-slate-800"
      >
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden mr-2">
            {item.author?.image ? (
              <Image source={{ uri: item.author.image }} className="w-full h-full" />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Text className="text-indigo-600 text-xs font-bold">{item.author?.name?.[0]}</Text>
              </View>
            )}
          </View>
          <Text className="text-sm font-medium text-slate-900 dark:text-white">{item.author?.name}</Text>
        </View>
        <Text className="text-slate-600 dark:text-slate-300 text-sm" numberOfLines={2}>
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black" edges={['top']}>
      <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
          <SearchIcon size={20} color="#64748b" className="mr-2" />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Buscar personas, posts..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-900 dark:text-white"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} className="ml-2">
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              hasSearched ? (
                <View className="py-20 items-center">
                  <SearchIcon size={48} color="#e2e8f0" />
                  <Text className="text-slate-400 dark:text-slate-600 text-lg mt-4">No se encontraron resultados</Text>
                  <Text className="text-slate-400 dark:text-slate-600 text-sm mt-2">Intenta con otros términos</Text>
                </View>
              ) : (
                <View className="py-20 items-center">
                  <SearchIcon size={48} color="#e2e8f0" />
                  <Text className="text-slate-400 dark:text-slate-600 text-lg mt-4">Busca personas o publicaciones</Text>
                  <Text className="text-slate-400 dark:text-slate-600 text-sm mt-2">Escribe para comenzar a buscar</Text>
                </View>
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
