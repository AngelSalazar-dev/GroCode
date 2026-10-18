import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import { getChatChannels } from "@/actions/chat"
import ChatClient from "@/components/chat/ChatClient"

export default async function ChatPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const channels = await getChatChannels()

  return <ChatClient channels={channels} currentUserId={session.user.id} />
}
