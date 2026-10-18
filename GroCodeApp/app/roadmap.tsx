import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, CheckCircle2, Layout, Code2, Cpu, Database, Server, Map } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

const ROADMAP_STEPS = [
  {
    id: 1,
    title: "Web Fundamentals",
    desc: "Learn how the internet works, browsers, and DNS.",
    icon: Layout,
    color: "#f59e0b",
    status: "completed",
    resources: 12
  },
  {
    id: 2,
    title: "HTML & CSS",
    desc: "Structure and design of responsive web pages.",
    icon: Code2,
    color: "#0ea5e9",
    status: "in-progress",
    resources: 45
  },
  {
    id: 3,
    title: "Advanced JavaScript",
    desc: "Logic, DOM manipulation, async, and APIs.",
    icon: Cpu,
    color: "#eab308",
    status: "pending",
    resources: 38
  },
  {
    id: 4,
    title: "Frontend Frameworks",
    desc: "Building interactive UIs with React/Next.js.",
    icon: Layout,
    color: "#06b6d4",
    status: "pending",
    resources: 60
  },
  {
    id: 5,
    title: "Backend & Databases",
    desc: "API creation, auth, and data modeling.",
    icon: Database,
    color: "#10b981",
    status: "pending",
    resources: 25
  },
  {
    id: 6,
    title: "DevOps Basics",
    desc: "CI/CD, Docker, and deployment best practices.",
    icon: Server,
    color: "#6366f1",
    status: "pending",
    resources: 18
  }
];

export default function RoadmapScreen() {
  const [activeStep, setActiveStep] = useState(2);
  const router = useRouter();

  const handleStepPress = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveStep(id);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={28} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white ml-2">Learning Roadmap</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="mb-8">
            <View className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800">
                <Map size={28} color="#4f46e5" />
            </View>
            <Text className="text-3xl font-black text-slate-900 dark:text-white">Community Roadmap</Text>
            <Text className="text-slate-500 dark:text-slate-400 mt-2 text-base leading-6">
                The collaborative learning path built and validated by GroCode mentors.
            </Text>
        </View>

        <View className="relative">
          {/* Vertical Line */}
          <View className="absolute left-7 top-4 bottom-4 w-[2px] bg-slate-100 dark:bg-slate-800" />

          {ROADMAP_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const isCompleted = step.status === "completed";

            return (
              <Animated.View 
                key={step.id} 
                entering={FadeInDown.delay(index * 100)}
                className="mb-8 flex-row"
              >
                <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => handleStepPress(step.id)}
                    className="flex-row flex-1"
                >
                    <View className="z-10">
                        <View 
                            className={`w-14 h-14 rounded-2xl items-center justify-center border-2 ${isActive ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800 border-transparent'}`}
                            style={isActive ? { borderColor: step.color } : {}}
                        >
                            <Icon size={24} color={isActive ? step.color : '#94a3b8'} />
                        </View>
                    </View>

                    <View className={`flex-1 ml-6 p-5 rounded-3xl border ${isActive ? 'bg-slate-50 dark:bg-slate-900/50 border-indigo-100 dark:border-indigo-900/30 shadow-sm' : 'border-transparent'}`}>
                        <View className="flex-row items-center justify-between mb-1">
                            <View className="flex-row items-center">
                                <Text className={`text-lg font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>{step.title}</Text>
                                {isCompleted && <CheckCircle2 size={16} color="#10b981" className="ml-2" />}
                            </View>
                            <View className="bg-white dark:bg-slate-800 px-2 py-1 rounded-full">
                                <Text className="text-[10px] font-bold text-slate-400">{step.resources} resources</Text>
                            </View>
                        </View>
                        <Text className={`text-sm leading-5 ${isActive ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-700'}`}>{step.desc}</Text>
                        
                        {isActive && (
                            <View className="mt-4 flex-row">
                                <TouchableOpacity 
                                    className="bg-indigo-600 px-4 py-2 rounded-full"
                                    onPress={() => router.push("/(tabs)")}
                                >
                                    <Text className="text-white text-xs font-bold">View Resources</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
