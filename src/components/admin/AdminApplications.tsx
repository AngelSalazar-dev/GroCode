"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ShieldCheck,
  BadgeCheck,
  XCircle,
  ExternalLink,
  Loader2,
  Code2,
  Network,
  Inbox,
} from "lucide-react"
import { reviewSeniorApplication } from "@/actions/admin"
import { getTimeAgo } from "@/components/notifications/NotificationPanel"
import type { AdminApplication } from "@/actions/admin"
import type { ApplicationStatus } from "@/generated-v2/client"

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/20",
  VERIFIED: "bg-sky-500/10 text-sky-700 dark:text-sky-500 border-sky-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-500/20",
  REJECTED: "bg-rose-500/10 text-rose-700 dark:text-rose-500 border-rose-500/20",
}

const FILTERS: { id: ApplicationStatus | null; label: string }[] = [
  { id: null, label: "Todas" },
  { id: "PENDING", label: "Pendientes" },
  { id: "VERIFIED", label: "Verificadas" },
  { id: "APPROVED", label: "Aprobadas" },
  { id: "REJECTED", label: "Rechazadas" },
]

export default function AdminApplications({
  applications,
  statusLabels,
  activeStatus,
  counts,
}: {
  applications: AdminApplication[]
  statusLabels: Record<string, string>
  activeStatus: ApplicationStatus | null
  counts: Record<string, number>
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()

  const handleReview = (id: string, decision: "VERIFIED" | "APPROVED" | "REJECTED") => {
    setError("")
    setBusyId(id)
    startTransition(async () => {
      const result = await reviewSeniorApplication(id, decision)
      setBusyId(null)
      if ("error" in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap border-b border-border-gro">
        {FILTERS.map((f) => {
          const isActive = activeStatus === f.id
          const count =
            f.id === null
              ? Object.values(counts).reduce((a, b) => a + b, 0)
              : (counts[f.id] ?? 0)
          return (
            <Link
              key={f.label}
              href={f.id ? `/admin/applications?status=${f.id}` : "/admin/applications"}
              aria-current={isActive ? "page" : undefined}
              className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                isActive
                  ? "text-accent-gro border-accent-gro"
                  : "text-muted hover:text-foreground border-transparent"
              }`}
            >
              {f.label} <span className="text-muted ml-1">{count}</span>
            </Link>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-500 font-medium">
          {error}
        </p>
      )}

      {applications.length === 0 ? (
        <div className="py-24 text-center space-y-4 gro-card border-dashed bg-transparent">
          <Inbox className="w-12 h-12 text-muted/40 mx-auto" />
          <p className="font-bold">No hay postulaciones en este estado</p>
          <p className="text-muted text-sm">
            Las nuevas postulaciones aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const busy = busyId === app.id
            const isPending = app.status === "PENDING"
            const isVerified = app.status === "VERIFIED"

            return (
              <article key={app.id} className="gro-card p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/profile/${app.user.id}`}
                        className="font-black hover:text-accent-gro transition-colors truncate"
                      >
                        {app.user.name ?? "Sin nombre"}
                      </Link>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          STATUS_STYLE[app.status]
                        }`}
                      >
                        {statusLabels[app.status] ?? app.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">{app.user.email}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Enviada {getTimeAgo(new Date(app.createdAt))}
                      {app.reviewedAt &&
                        ` · Revisada ${getTimeAgo(new Date(app.reviewedAt))}`}
                    </p>
                  </div>

                  {app.user.role === "SENIOR" && (
                    <span className="text-amber-700 dark:text-amber-500 shrink-0" title="Ya es Senior">
                      <BadgeCheck className="w-5 h-5" />
                    </span>
                  )}
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-muted">
                      Experiencia
                    </dt>
                    <dd className="font-medium mt-0.5">
                      {app.yearsOfExperience ?? "—"} años
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-muted">
                      Tecnologías
                    </dt>
                    <dd className="font-medium mt-0.5 break-words">
                      {app.technologies ?? "—"}
                    </dd>
                  </div>
                </dl>

                {app.motivation && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5">
                      Motivación
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
                      {app.motivation}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {app.githubProfile && (
                    <a
                      href={app.githubProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gro-btn !py-1.5 !px-3 !text-[11px] !rounded-full inline-flex items-center gap-1.5"
                    >
                      <Code2 className="w-3 h-3" /> GitHub
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}
                  {app.linkedinProfile && (
                    <a
                      href={app.linkedinProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gro-btn !py-1.5 !px-3 !text-[11px] !rounded-full inline-flex items-center gap-1.5"
                    >
                      <Network className="w-3 h-3" /> LinkedIn
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}
                </div>

                {(isPending || isVerified) && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-border-gro">
                    {isPending && (
                      <button
                        onClick={() => handleReview(app.id, "VERIFIED")}
                        disabled={busy}
                        className="gro-btn !py-2 !px-4 !text-xs !rounded-full inline-flex items-center gap-1.5"
                      >
                        {busy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        Marcar verificada
                      </button>
                    )}

                    {isVerified && (
                      <button
                        onClick={() => handleReview(app.id, "APPROVED")}
                        disabled={busy}
                        className="gro-btn gro-btn-primary !py-2 !px-4 !text-xs !rounded-full inline-flex items-center gap-1.5"
                      >
                        {busy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <BadgeCheck className="w-3.5 h-3.5" />
                        )}
                        Aprobar insignia
                      </button>
                    )}

                    <button
                      onClick={() => handleReview(app.id, "REJECTED")}
                      disabled={busy}
                      className="gro-btn !py-2 !px-4 !text-xs !rounded-full !text-!-700 dark:!text-!-500 hover:bg-rose-500/10 inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rechazar
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}