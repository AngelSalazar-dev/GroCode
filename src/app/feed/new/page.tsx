import { createPost } from "@/actions/posts"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import { Send, Link as LinkIcon, Hash } from "lucide-react"

const CHANNELS = [
  { id: "general", label: "General", icon: "🌐" },
  { id: "javascript", label: "JavaScript", icon: "🟨" },
  { id: "typescript", label: "TypeScript", icon: "🟦" },
  { id: "react", label: "React", icon: "⚛️" },
  { id: "nextjs", label: "Next.js", icon: "▲" },
  { id: "css", label: "CSS / Tailwind", icon: "🎨" },
  { id: "nodejs", label: "Node.js", icon: "🟢" },
  { id: "python", label: "Python", icon: "🐍" },
  { id: "rust", label: "Rust", icon: "🦀" },
  { id: "devops", label: "DevOps", icon: "🔧" },
]

export default async function NewPostPage() {
  const session = await auth()
  if (!session) redirect("/api/auth/signin")

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-black tracking-tight mb-8">Compartir Recurso</h1>
      
      <form action={createPost} className="space-y-6 gro-card p-8">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-muted mb-3">
            ¿Qué quieres compartir?
          </label>
          <textarea
            name="content"
            required
            rows={4}
            className="w-full p-4 bg-muted/5 border border-border-gro rounded-2xl focus:ring-2 focus:ring-accent-gro focus:border-accent-gro transition-all outline-none resize-none text-sm"
            placeholder="Describe el recurso, por qué es útil o qué aprendiste..."
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <Hash className="w-3 h-3" />
            Canal
          </label>
          <select
            name="channel"
            defaultValue="general"
            className="w-full p-4 bg-muted/5 border border-border-gro rounded-2xl focus:ring-2 focus:ring-accent-gro focus:border-accent-gro transition-all outline-none text-sm font-medium"
          >
            {CHANNELS.map(ch => (
              <option key={ch.id} value={ch.id}>
                {ch.icon} {ch.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <LinkIcon className="w-3 h-3" />
            URL del Recurso (opcional)
          </label>
          <input
            type="url"
            name="resourceUrl"
            className="w-full p-4 bg-muted/5 border border-border-gro rounded-2xl focus:ring-2 focus:ring-accent-gro focus:border-accent-gro transition-all outline-none text-sm"
            placeholder="https://youtube.com/... o https://blog.com/..."
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 gro-btn gro-btn-primary !py-4 !rounded-2xl !text-sm"
        >
          <Send className="w-4 h-4" />
          Publicar ahora
        </button>
      </form>
    </div>
  )
}