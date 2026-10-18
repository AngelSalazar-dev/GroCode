import { createPost } from "@/actions/posts"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import { Send, Link as LinkIcon, Hash } from "lucide-react"

export default async function NewPostPage() {
  const session = await auth()
  if (!session) redirect("/api/auth/signin")

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Compartir Recurso</h1>
      
      <form action={createPost} className="space-y-6 bg-card text-card-foreground p-8 rounded-3xl border border-border-gro shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted" />
            Canal
          </label>
          <select
            name="channel"
            className="w-full p-4 border border-border-gro bg-background rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
          >
            <option value="general">general</option>
            <option value="roadmap">roadmap (propuestas)</option>
            <option value="javascript">javascript</option>
            <option value="typescript">typescript</option>
            <option value="python">python</option>
            <option value="react">react</option>
            <option value="nextjs">next-js</option>
            <option value="backend">backend</option>
            <option value="devops">devops</option>
            <option value="ai-ml">ia-y-ml</option>
            <option value="career">carrera</option>
            <option value="showoff">muestra-tu-trabajo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            ¿Qué quieres compartir?
          </label>
          <textarea
            name="content"
            required
            rows={4}
            className="w-full p-4 border border-border-gro bg-background rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
            placeholder="Describe el recurso, por qué es útil o qué aprendiste..."
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-muted" />
            URL del Recurso (opcional)
          </label>
          <input
            type="url"
            name="resourceUrl"
            className="w-full p-4 border border-border-gro bg-background rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            placeholder="https://youtube.com/... o https://blog.com/..."
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Send className="w-5 h-5" />
          Publicar ahora
        </button>
      </form>
    </div>
  )
}
