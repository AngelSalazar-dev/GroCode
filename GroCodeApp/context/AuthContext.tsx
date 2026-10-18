import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter, useSegments } from "expo-router";
import { AppState, AppStateStatus } from "react-native";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStorageData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [token, segments, isLoading]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = useCallback((nextState: AppStateStatus) => {
    if (nextState === "active") {
      checkTokenExpiration();
    }
  }, []);

  async function checkTokenExpiration() {
    try {
      const storedToken = await SecureStore.getItemAsync("auth_token");
      if (!storedToken) return;

      const payload = JSON.parse(atob(storedToken.split(".")[1]));
      const expirationTime = payload.exp * 1000;
      
      if (Date.now() >= expirationTime) {
        await logout();
      }
    } catch {
      // Token is invalid, logout
      await logout();
    }
  }

  async function loadStorageData() {
    try {
      const storedToken = await SecureStore.getItemAsync("auth_token");
      const storedUser = await SecureStore.getItemAsync("user_data");

      if (storedToken && storedUser) {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        const expirationTime = payload.exp * 1000;
        
        if (Date.now() < expirationTime) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          await SecureStore.deleteItemAsync("auth_token");
          await SecureStore.deleteItemAsync("user_data");
        }
      }
    } catch (e) {
      // Invalid data, clear storage
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("user_data");
    } finally {
      setIsLoading(false);
    }
  }

  async function login(user: User, token: string) {
    setUser(user);
    setToken(token);
    await SecureStore.setItemAsync("auth_token", token);
    await SecureStore.setItemAsync("user_data", JSON.stringify(user));
  }

  async function updateUser(userData: Partial<User>) {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    await SecureStore.setItemAsync("user_data", JSON.stringify(updatedUser));
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("user_data");
    router.replace("/(auth)/login");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
