"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Map, GitPullRequest, Code2, Database, Layout, Server, Cpu, ShieldCheck, CheckCircle2, ChevronRight, MessageSquarePlus } from "lucide-react"
import Link from "next/link"

const ROADMAP_STEPS = [
  {
    id: 1,
    title: "Fundamentos de la Web",
    desc: "Aprende cómo funciona el internet, navegadores y DNS.",
    icon: Layout,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    status: "completed",
    resources: 12
  },
  {
    id: 2,
    title: "HTML & CSS",
    desc: "Estructura y diseño de páginas web responsivas.",
    icon: Code2,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    status: "in-progress",
    resources: 45
  },
  {
    id: 3,
    title: "JavaScript Avanzado",
    desc: "Lógica, manipulación del DOM, asincronía y APIs.",
    icon: Cpu,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    status: "pending",
    resources: 38
  },
  {
    id: 4,
    title: "Frameworks Frontend (React/Next.js)",
    desc: "Construcción de interfaces interactivas y SSR.",
    icon: Layout,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    status: "pending",
    resources: 60
  },
  {
    id: 5,
    title: "Backend & Bases de Datos",
    desc: "Creación de APIs, autenticación y modelado de datos.",
    icon: Database,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    status: "pending",
    resources: 25
  },
  {
    id: 6,
    title: "Despliegue y DevOps Básicos",
    desc: "CI/CD, Docker, AWS/Vercel y buenas prácticas.",
    icon: Server,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    status: "pending",
    resources: 18
  }
]

export default function RoadmapPage() {
  const [activeStep, setActiveStep] = useState<number | null>(2)

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_var(--color-accent-gro)_0%,transparent_40%)] opacity-[0.03] -z-10" />

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-accent-gro/10 text-accent-gro rounded-2xl flex items-center justify-center border border-accent-gro/20">
              <Map className="w-7 h-7" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Roadmap Comunitario</h1>
            <p className="text-muted text-lg max-w-xl font-medium leading-relaxed">
              La ruta de aprendizaje colaborativa construida y validada por mentores y desarrolladores de GroCode.
            </p>
          </div>
          <button className="gro-btn gro-btn-primary !rounded-full shrink-0 flex items-center gap-2">
            <GitPullRequest className="w-4 h-4" /> Proponer Cambio
          </button>
        </div>

        {/* Roadmap Visualization */}
        <div className="relative pt-8">
          {/* Connecting Line */}
          <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-border-gro hidden md:block" />

          <div className="space-y-6">
            {ROADMAP_STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = activeStep === step.id
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveStep(step.id)}
                  className={`relative flex flex-col md:flex-row gap-6 md:gap-10 group cursor-pointer`}
                >
                  {/* Timeline Node */}
                  <div className="hidden md:flex flex-col items-center z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${isActive ? `scale-110 ${step.bg} ${step.border} shadow-lg` : 'bg-background border-border-gro group-hover:border-muted'}`}>
                      <Icon className={`w-7 h-7 ${isActive ? step.color : 'text-muted'}`} />
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 gro-card p-6 transition-all duration-300 ${isActive ? `border-${step.color.replace('text-','')} shadow-lg bg-muted/5` : 'hover:border-muted/50'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black">{step.title}</h3>
                          {step.status === "completed" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        </div>
                        <p className="text-muted font-medium leading-relaxed">{step.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-background border border-border-gro px-3 py-1.5 rounded-full shrink-0">
                        <span className="text-xs font-bold text-muted">{step.resources} recursos</span>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 pt-6 border-t border-border-gro flex flex-wrap gap-3"
                      >
                        <Link href="/feed" className="gro-btn !py-2 !px-4 !text-xs !rounded-full">Ver recursos</Link>
                        <button className="gro-btn !py-2 !px-4 !text-xs !rounded-full flex items-center gap-2">
                          <MessageSquarePlus className="w-3.5 h-3.5" /> Discutir
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
