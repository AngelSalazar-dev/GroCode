export const CHANNELS = [
  { id: "general", label: "general", icon: "🌐", title: "General" },
  { id: "javascript", label: "javascript", icon: "⚡", title: "JavaScript" },
  { id: "typescript", label: "typescript", icon: "🔷", title: "TypeScript" },
  { id: "python", label: "python", icon: "🐍", title: "Python" },
  { id: "react", label: "react", icon: "⚛️", title: "React" },
  { id: "nextjs", label: "next-js", icon: "▲", title: "Next.js" },
  { id: "backend", label: "backend", icon: "🛠️", title: "Back-end" },
  { id: "devops", label: "devops", icon: "🚀", title: "DevOps" },
  { id: "ai-ml", label: "ia-y-ml", icon: "🤖", title: "IA y ML" },
  { id: "career", label: "carrera", icon: "🎯", title: "Carrera" },
  { id: "showoff", label: "muestra-tu-trabajo", icon: "🏆", title: "Muestra tu trabajo" },
] as const

export type ChannelId = (typeof CHANNELS)[number]["id"]

const CHANNEL_IDS = new Set<string>(CHANNELS.map((c) => c.id))

export const DEFAULT_CHANNEL: ChannelId = "general"

export function isValidChannel(value: string | undefined | null): value is ChannelId {
  return !!value && CHANNEL_IDS.has(value)
}

export function getChannel(id: string) {
  return CHANNELS.find((c) => c.id === id) ?? CHANNELS[0]
}
