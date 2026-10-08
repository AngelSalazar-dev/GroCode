import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import NewPostForm from "@/components/feed/NewPostForm"

export const metadata = {
  title: "Compartir recurso - GroCode",
  description: "Publica un recurso o aprendizaje en la comunidad.",
}

export default async function NewPostPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-black tracking-tight mb-8">Compartir Recurso</h1>
      <NewPostForm />
    </div>
  )
}