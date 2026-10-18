import { createProject } from "@/actions/projects"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import { Rocket, Code, FileText, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewProjectPage() {
  const session = await auth()
  if (!session) redirect("/api/auth/signin")

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <Link 
        href="/collaboration" 
        className="inline-flex items-center gap-2 text-muted hover:text-accent-gro transition-colors mb-8 font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Colaboración
      </Link>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-accent-gro/10 text-accent-gro rounded-2xl flex items-center justify-center border border-accent-gro/20">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Nuevo Proyecto</h1>
          <p className="text-muted text-sm font-medium">Define tu idea y encuentra al equipo ideal</p>
        </div>
      </div>
      
      <form action={createProject} className="space-y-6 bg-card p-8 rounded-3xl border border-border-gro shadow-xl shadow-black/20">
        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-widest text-muted flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Título del Proyecto
          </label>
          <input
            name="title"
            required
            type="text"
            placeholder="Ej: Plataforma de Mentoría con IA"
            className="w-full p-4 border border-border-gro bg-background rounded-2xl focus:ring-2 focus:ring-accent-gro/20 focus:border-accent-gro transition-all outline-none font-medium"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-widest text-muted flex items-center gap-2">
            <Code className="w-3.5 h-3.5" /> Habilidades Requeridas
          </label>
          <input
            name="skills"
            type="text"
            placeholder="React, Prisma, Python, Diseño UI..."
            className="w-full p-4 border border-border-gro bg-background rounded-2xl focus:ring-2 focus:ring-accent-gro/20 focus:border-accent-gro transition-all outline-none font-medium"
          />
          <p className="text-[10px] text-muted italic font-medium px-2">Separa las habilidades con comas.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-widest text-muted flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Descripción y Objetivos
          </label>
          <textarea
            name="description"
            required
            rows={6}
            className="w-full p-4 border border-border-gro bg-background rounded-2xl focus:ring-2 focus:ring-accent-gro/20 focus:border-accent-gro transition-all outline-none resize-none font-medium leading-relaxed"
            placeholder="Describe qué quieres construir, qué perfiles buscas y cuál es el alcance del proyecto..."
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-accent-gro hover:opacity-90 text-background font-black py-4 rounded-2xl transition-all shadow-lg shadow-accent-gro/20 group"
        >
          <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          Publicar Proyecto
        </button>
      </form>
    </div>
  )
}
