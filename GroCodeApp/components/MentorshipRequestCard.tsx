import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Check, X, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface User {
  id: string;
  name: string;
  image: string | null;
}

interface MentorshipRequestProps {
  request: {
    id: string;
    message: string | null;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    junior: User;
    senior: User;
    createdAt: string;
  };
  isSenior: boolean;
  onUpdateStatus?: (requestId: string, status: "ACCEPTED" | "REJECTED") => void;
}

export default function MentorshipRequestCard({ request, isSenior, onUpdateStatus }: MentorshipRequestProps) {
  const otherUser = isSenior ? request.junior : request.senior;

  const statusConfig = {
    ACCEPTED: { text: "Accepted", textColor: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    REJECTED: { text: "Declined", textColor: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
    PENDING: { text: "Pending", textColor: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  };

  const status = statusConfig[request.status];

  const handleAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUpdateStatus?.(request.id, "ACCEPTED");
  };

  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdateStatus?.(request.id, "REJECTED");
  };

  return (
    <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl mb-4 border border-slate-100 dark:border-slate-800 shadow-sm">
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden mr-3">
          {otherUser.image ? (
            <Image source={{ uri: otherUser.image }} className="w-full h-full" transition={200} />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{otherUser.name?.[0]}</Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-slate-900 dark:text-slate-100 font-bold text-base">{otherUser.name}</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs">
            {isSenior ? "Wants you as a mentor" : "Requested as your mentor"}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${status.bg}`}>
          <Text className={`text-[10px] font-bold ${status.textColor}`}>{status.text}</Text>
        </View>
      </View>

      {request.message && (
        <View className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4">
          <Text className="text-slate-600 dark:text-slate-300 italic">&quot;{request.message}&quot;</Text>
        </View>
      )}

      {isSenior && request.status === "PENDING" && (
        <View className="flex-row space-x-3">
          <TouchableOpacity 
            onPress={handleAccept}
            className="flex-1 bg-indigo-600 py-3 rounded-xl flex-row items-center justify-center"
          >
            <Check size={18} color="white" />
            <Text className="text-white font-bold ml-2">Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDecline}
            className="flex-1 bg-slate-100 dark:bg-slate-800 py-3 rounded-xl flex-row items-center justify-center"
          >
            <X size={18} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 font-bold ml-2">Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View className="flex-row items-center mt-2">
        <Clock size={12} color="#94a3b8" />
        <Text className="text-slate-400 dark:text-slate-600 text-[10px] ml-1">{new Date(request.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );
}
