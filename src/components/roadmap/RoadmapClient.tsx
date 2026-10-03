"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Map, GitPullRequest, Code2, Database, Layout, Server, Cpu, CheckCircle2, MessageSquarePlus } from "lucide-react"
import Link from "next/link"

interface RoadmapStep {
  id: string
  title: string
  description: string
  color: string
  order: number
  resources: number
}

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  "text-amber-500": { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500" },
  "text-sky-500": { bg: "bg-sky-500/10", border: "border-sky-500/20", text: "text-sky-500" },
  "text-yellow-500": { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-500" },
  "text-cyan-500": { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-500" },
  "text-emerald-500": { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" },
  "text-indigo-500": { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-500" },
}

const stepIcons = [Layout, Code2, Cpu, Layout, Database, Server]

export default function RoadmapClient({ steps }: { steps: RoadmapStep[] }) {
  const [activeStep, setActiveStep] = useState<string | null>(steps[1]?.id || null)

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
            {steps.map((step, index) => {
              const Icon = stepIcons[index] || Code2
              const colorInfo = colorMap[step.color] || { bg: "bg-gray-500/10", border: "border-gray-500/20", text: "text-gray-500" }
              const isActive = activeStep === step.id
              const isCompleted = step.order < 2
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveStep(step.id)}
                  className="relative flex flex-col md:flex-row gap-6 md:gap-10 group cursor-pointer"
                >
                  {/* Timeline Node */}
                  <div className="hidden md:flex flex-col items-center z-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 bg-background border-border-gro group-hover:border-muted">
                      <Icon className={colorInfo.text} />
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 gro-card p-6 transition-all duration-300 ${isActive ? `shadow-lg ${colorInfo.bg}` : 'hover:border-muted/50'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black">{step.title}</h3>
                          {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        </div>
                        <p className="text-muted font-medium leading-relaxed">{step.description}</p>
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