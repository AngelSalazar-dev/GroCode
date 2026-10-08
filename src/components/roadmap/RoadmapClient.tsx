"use client"

import { useState, useTransition, useOptimistic } from "react"
import { motion } from "framer-motion"
import {
  Map,
  Code2,
  Database,
  Layout,
  Server,
  Cpu,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toggleRoadmapStep } from "@/actions/roadmap"

export interface RoadmapStepData {
  id: string
  title: string
  description: string
  color: string
  order: number
  resources: number
  completed: boolean
  channel: string
}

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  "text-amber-700 dark:text-amber-500": { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-700 dark:text-amber-500" },
  "text-sky-700 dark:text-sky-500": { bg: "bg-sky-500/10", border: "border-sky-500/20", text: "text-sky-700 dark:text-sky-500" },
  "text-yellow-700 dark:text-yellow-500": { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-700 dark:text-yellow-500" },
  "text-cyan-700 dark:text-cyan-500": { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-700 dark:text-cyan-500" },
  "text-emerald-700 dark:text-emerald-500": { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-500" },
  "text-indigo-500": { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-500" },
}

const stepIcons = [Layout, Code2, Cpu, Layout, Database, Server]

export default function RoadmapClient({
  steps,
  completedCount,
  isLoggedIn,
}: {
  steps: RoadmapStepData[]
  completedCount: number
  isLoggedIn: boolean
}) {
  const [activeStep, setActiveStep] = useState<string | null>(steps[0]?.id ?? null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const [optimisticSteps, applyOptimistic] = useOptimistic(
    steps,
    (state, stepId: string) =>
      state.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s))
  )

  const handleToggle = (stepId: string) => {
    if (!isLoggedIn) return
    setError("")
    startTransition(async () => {
      applyOptimistic(stepId)
      const result = await toggleRoadmapStep(stepId)
      if ("error" in result) {
        setError(result.error)
        // Roll back the optimistic flip by re-rendering from server props.
      }
    })
  }

  const total = steps.length
  const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100)

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
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Roadmap Comunitario
            </h1>
            <p className="text-muted text-lg max-w-xl font-medium leading-relaxed">
              La ruta de aprendizaje colaborativa construida y validada por mentores
              y desarrolladores de GroCode.
            </p>
          </div>

          {isLoggedIn && (
            <div className="shrink-0">
              <p className="text-xs font-black uppercase tracking-widest text-muted mb-2">
                Tu progreso
              </p>
              <p className="text-3xl font-black">
                {completedCount}
                <span className="text-muted text-xl">/{total}</span>
              </p>
              <div className="mt-2 w-40 h-2 bg-muted/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-gro transition-all duration-500"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progreso del roadmap"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-500 font-medium">
            {error}
          </p>
        )}

        {/* Roadmap Visualization */}
        <div className="relative pt-8">
          <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-border-gro hidden md:block" />

          <div className="space-y-6">
            {optimisticSteps.map((step, index) => {
              const Icon = stepIcons[index] ?? Code2
              const colorInfo = colorMap[step.color] ?? {
                bg: "bg-gray-500/10",
                border: "border-gray-500/20",
                text: "text-gray-500",
              }
              const isActive = activeStep === step.id

              return (
                <div key={step.id} className="relative flex flex-col md:flex-row gap-6 md:gap-10">
                  {/* Timeline Node */}
                  <div className="hidden md:flex flex-col items-center z-10">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 bg-background ${
                        step.completed ? "border-emerald-500/40" : "border-border-gro"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-700 dark:text-emerald-500" />
                      ) : (
                        <Icon className={colorInfo.text} />
                      )}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div
                    className={`flex-1 gro-card p-6 transition-all duration-300 ${
                      isActive ? `shadow-lg ${colorInfo.bg}` : "hover:border-muted/50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setActiveStep(isActive ? null : step.id)}
                            aria-expanded={isActive}
                            className="text-left text-xl font-black hover:text-accent-gro transition-colors"
                          >
                            {step.title}
                          </button>
                          {step.completed && (
                            <span className="md:hidden">
                              <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-muted font-medium leading-relaxed">
                          {step.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-muted bg-background border border-border-gro px-3 py-1.5 rounded-full">
                          {step.resources} recursos
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggle(step.id)}
                          disabled={!isLoggedIn || isPending}
                          aria-pressed={step.completed}
                          title={
                            isLoggedIn
                              ? step.completed
                                ? "Marcar como pendiente"
                                : "Marcar como completado"
                              : "Inicia sesión para guardar tu progreso"
                          }
                          className={`p-1.5 min-h-11 min-w-11 flex items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed ${
                            step.completed
                              ? "text-emerald-700 dark:text-emerald-500"
                              : "text-muted hover:text-hover:-700 dark:hover:text-hover:-500"
                          }`}
                        >
                          {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : step.completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 pt-6 border-t border-border-gro flex flex-wrap gap-3"
                      >
                        <Link
                          href={`/feed?channel=${step.channel}&page=1`}
                          className="gro-btn !py-2 !px-4 !text-xs !rounded-full inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" /> Ver recursos
                        </Link>
                        <Link
                          href="/mentors"
                          className="gro-btn !py-2 !px-4 !text-xs !rounded-full inline-flex items-center gap-1.5"
                        >
                          Buscar mentor
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}