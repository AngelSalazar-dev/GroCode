"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, Send, Loader2, User } from "lucide-react"
import { motion } from "framer-motion"
import { getChatChannels, getChatMessages, sendMessage } from "@/actions/chat"
import { timeAgo } from "@/lib/timeAgo"

interface ChatPageProps {
  channels: any[]
  currentUserId: string
}

export default function ChatClient({ channels: initialChannels, currentUserId }: ChatPageProps) {
  const [channels] = useState(initialChannels)
  const [selectedChannel, setSelectedChannel] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const selectChannel = async (channel: any) => {
    setSelectedChannel(channel)
    setLoading(true)
    try {
      const msgs = await getChatMessages(channel.id)
      setMessages(msgs)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChannel) return

    setSending(true)
    try {
      const msg = await sendMessage(selectedChannel.id, newMessage)
      setMessages(prev => [...prev, msg])
      setNewMessage("")
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  const getOtherUser = (channel: any) => {
    return channel.users.find((u: any) => u.id !== currentUserId) || channel.users[0]
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Channels Sidebar */}
      <div className="w-80 border-r border-border-gro flex flex-col bg-muted/[0.02]">
        <div className="p-4 border-b border-border-gro">
          <h2 className="font-black text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Mensajes
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {channels.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted/20 mx-auto mb-4" />
              <p className="text-sm text-muted font-medium">No tienes conversaciones</p>
              <p className="text-xs text-muted/60 mt-1">Los chats aparecen cuando aceptas una mentoría</p>
            </div>
          ) : (
            channels.map((channel) => {
              const otherUser = getOtherUser(channel)
              const lastMessage = channel.messages[0]
              return (
                <button
                  key={channel.id}
                  onClick={() => selectChannel(channel)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-muted/5 transition-colors border-b border-border-gro/50 ${
                    selectedChannel?.id === channel.id ? "bg-accent-gro/5" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted/10 overflow-hidden shrink-0">
                    {otherUser.image ? (
                      <img src={otherUser.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-2 text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold truncate">{otherUser.name}</span>
                      {lastMessage && (
                        <span className="text-[10px] text-muted">{timeAgo(lastMessage.createdAt)}</span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-xs text-muted truncate mt-0.5">
                        {lastMessage.sender.name}: {lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border-gro flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted/10 overflow-hidden">
                {getOtherUser(selectedChannel).image ? (
                  <img src={getOtherUser(selectedChannel).image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-2 text-muted" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm">{getOtherUser(selectedChannel).name}</h3>
                <p className="text-[10px] text-muted uppercase tracking-wider">{getOtherUser(selectedChannel).role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted">Envía el primer mensaje</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender.id === currentUserId ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${msg.sender.id === currentUserId ? "order-1" : "order-1"}`}>
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        msg.sender.id === currentUserId 
                          ? "bg-accent-gro text-background" 
                          : "bg-muted/10 text-foreground"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p className={`text-[10px] text-muted mt-1 ${msg.sender.id === currentUserId ? "text-right" : ""}`}>
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border-gro">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-muted/5 border border-border-gro rounded-full px-4 py-3 text-sm focus:outline-none focus:border-accent-gro transition-colors"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-3 bg-accent-gro text-background rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="w-16 h-16 text-muted/20 mx-auto" />
              <p className="text-muted font-medium">Selecciona una conversación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
