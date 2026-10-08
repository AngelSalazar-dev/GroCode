"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  ShieldCheck,
  Link as LinkIcon,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Users,
  Trophy,
  Crown,
  Sparkles,
  BadgeCheck,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import {
  applySenior,
  getMySeniorApplication,
  type SeniorApplicationForm,
} from "@/actions/senior-application"
import type { ApplicationStatus } from "@/generated-v2/client"

// Map color strings to static Tailwind classes
/**
 * Benefits list.
 *
 * Every entry here was a promise the product did not keep: there is no ranking
 * (the mentor filter is keyword matching in the browser), no impact analytics,
 * no boosted visibility (the feed sorts by createdAt only) and no beta tester
 * programme. Advertising them cost credibility and misled applicants, so the
 * copy now describes what actually happens on approval.
 */
const BENEFITS = [
  {
    icon: Crown,
    title: "Insignia Verificada",
    desc: "Tu perfil muestra la insignia de Senior Verificado y pasa a formar parte del directorio de mentores.",
    color: "text-amber-700 dark:text-amber-500",
  },
  {
    icon: Users,
    title: "Solicitudes de Mentoría",
    desc: "Recibes solicitudes directas de Juniors que quieren aprender de ti y decides cuáles aceptar.",
    color: "text-indigo-500",
  },
  {
    icon: Trophy,
    title: "Aparecer en /mentores",
    desc: "Tu perfil es visible en el directorio público de mentores de GroCode.",
    color: "text-emerald-700 dark:text-emerald-500",
  },
  {
    icon: TrendingUp,
    title: "Publicar recursos",
    desc: "Comparte tutoriales y enlaces en los canales del feed con el resto de la comunidad.",
    color: "text-sky-700 dark:text-sky-500",
  },
  {
    icon: Sparkles,
    title: "Acompañar a Juniors",
    desc: "Construye tu reputación ayudando a desarrolladores junior que eligen tu perfil como mentor.",
    color: "text-violet-700 dark:text-violet-500",
  },
  {
    icon: Zap,
    title: "Comunidad activa",
    desc: "Forma parte de una comunidad de desarrolladores en crecimiento dentro de GroCode.",
    color: "text-rose-700 dark:text-rose-500",
  },
]

const REQUIREMENTS = [
  "Mínimo 3 años de experiencia profesional en desarrollo de software",
  "Perfil de GitHub con contribuciones verificables",
  "Disposición para mentorear al menos 2 horas por semana",
  "Actitud profesional y constructiva con la comunidad",
]

const VERIFICATION_STEPS = [
  { step: 1, title: "Envía tu solicitud", desc: "Completa el formulario con tu experiencia y enlaces profesionales." },
  { step: 2, title: "Revisión del equipo", desc: "Un miembro del equipo de GroCode valida la información de tu perfil." },
  { step: 3, title: "Insignia Senior", desc: "Al aprobarse, tu rol Senior se activa y tu perfil aparece en /mentors." },
]

const STATUS_COPY: Record<ApplicationStatus, { title: string; body: string }> = {
  PENDING: {
    title: "Postulación en revisión",
    body: "Recibimos tu solicitud. El equipo la revisará y te avisaremos por notificación cuando haya una respuesta.",
  },
  VERIFIED: {
    title: "Perfil verificado",
    body: "Tu información fue verificada. La aprobación final está en curso.",
  },
  APPROVED: {
    title: "¡Ya eres Senior!",
    body: "Tu rol Senior está activo. Tu perfil ya aparece en el directorio de mentores.",
  },
  REJECTED: {
    title: "Postulación no aprobada",
    body: "Por ahora no podemos avanzar con tu solicitud. Puedes actualizarla y enviarla de nuevo.",
  },
}

export default function ApplySeniorPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [existing, setExisting] = useState<Awaited<ReturnType<typeof getMySeniorApplication>>>(null)
  const [checkedExisting, setCheckedExisting] = useState(false)
  const [submittedStatus, setSubmittedStatus] = useState<ApplicationStatus | null>(null)
  const [form, setForm] = useState<SeniorApplicationForm>({
    years: "",
    github: "",
    linkedin: "",
    tech: "",
    motivation: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Prefill from a previous application and detect an in-flight one.
  useEffect(() => {
    void (async () => {
      await Promise.resolve()
      const result = await getMySeniorApplication()
      setExisting(result)
      if (result?.yearsOfExperience) {
        setForm({
          years: result.yearsOfExperience,
          github: result.githubProfile ?? "",
          linkedin: result.linkedinProfile ?? "",
          tech: result.technologies ?? "",
          motivation: result.motivation ?? "",
        })
      }
      setCheckedExisting(true)
    })()
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.years) errs.years = "Selecciona tu experiencia"
    if (!form.tech.trim()) errs.tech = "Indica tus tecnologías"
    if (!form.github.trim()) {
      errs.github = "Tu GitHub es necesario para la verificación"
    } else if (!/^https?:\/\/(www\.)?github\.com\//i.test(form.github.trim())) {
      errs.github = "Introduce la URL de tu perfil de GitHub"
    }
    if (form.linkedin.trim() && !/^https?:\/\/(www\.)?linkedin\.com\//i.test(form.linkedin.trim())) {
      errs.linkedin = "Introduce la URL de tu perfil de LinkedIn"
    }
    if (!form.motivation.trim()) {
      errs.motivation = "Cuéntanos tu motivación"
    } else if (form.motivation.trim().length < 50) {
      errs.motivation = `Al menos 50 caracteres (te faltan ${50 - form.motivation.trim().length})`
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setErrors({})
    setIsLoading(true)

    const result = await applySenior(form)
    setIsLoading(false)

    if ("error" in result) {
      // Server-side errors must be surfaced, not swallowed.
      setErrors({ general: result.error })
      return
    }
    setSubmittedStatus(result.status)
  }

  const activeStatus = submittedStatus ?? existing?.status ?? null
  const isPending = activeStatus === "PENDING" || activeStatus === "VERIFIED"
  const canApply = !activeStatus || activeStatus === "REJECTED"

  if (checkedExisting && isPending) {
    const copy = STATUS_COPY[activeStatus]
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-lg"
        >
          <div className="w-28 h-28 mx-auto rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-500 flex items-center justify-center border-2 border-amber-500/30">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight">{copy.title}</h1>
            <p className="text-muted font-medium leading-relaxed text-lg">{copy.body}</p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link href="/feed" className="gro-btn gro-btn-primary !rounded-full !px-8 !py-3">
              Volver al Feed
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (checkedExisting && activeStatus === "APPROVED") {
    const copy = STATUS_COPY.APPROVED
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-lg"
        >
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-28 h-28 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 rounded-full flex items-center justify-center border-2 border-emerald-500/30">
              <CheckCircle2 className="w-14 h-14" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight">{copy.title}</h1>
            <p className="text-muted font-medium leading-relaxed text-lg">{copy.body}</p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link href="/mentors" className="gro-btn gro-btn-primary !rounded-full !px-8 !py-3">
              Ver el directorio
            </Link>
            <Link href="/feed" className="gro-btn !rounded-full !px-8 !py-3">
              Volver al Feed
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-16 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_var(--color-accent-gro)_0%,transparent_40%)] opacity-[0.03] -z-10" />

      <div className="max-w-5xl mx-auto space-y-16">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al Feed
        </Link>

        {activeStatus === "REJECTED" && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-700 dark:text-amber-500">{STATUS_COPY.REJECTED.title}</p>
              <p className="text-muted mt-1">{STATUS_COPY.REJECTED.body}</p>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-700 dark:text-amber-500 rounded-3xl flex items-center justify-center border border-amber-500/20 mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            Conviértete en <span className="text-amber-700 dark:text-amber-500">Senior Verificado</span>
          </h1>
          <p className="text-xl text-muted font-medium leading-relaxed max-w-2xl mx-auto">
            Comparte tu experiencia con la comunidad, obtén reconocimiento y accede a herramientas exclusivas para mentores.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight text-center">
            Ventajas exclusivas para Seniors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="gro-card p-6 space-y-4 border-b-2 border-border-gro hover:border-accent-gro/30 transition-all"
                >
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-700 dark:text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">{b.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{b.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Verification Process */}
        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight text-center">
            Proceso de verificación
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VERIFICATION_STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="gro-card p-6 space-y-3 relative"
              >
                <span className="text-4xl font-black text-amber-500/10">{s.step}</span>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="gro-card p-5 text-center bg-amber-500/5 border border-amber-500/20 max-w-2xl mx-auto">
            <p className="text-sm font-medium text-muted">
              <BadgeCheck className="w-4 h-4 inline text-amber-700 dark:text-amber-500 mr-1" />
              La verificación la realiza el equipo de GroCode revisando la información
              de tu perfil. Te avisaremos por notificación cuando haya una respuesta.
            </p>
          </div>
        </div>

        {/* Requirements */}
        <div className="gro-card p-8 space-y-4 max-w-2xl mx-auto">
          <h3 className="text-lg font-black">Requisitos mínimos</h3>
          <ul className="space-y-3">
            {REQUIREMENTS.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-amber-700 dark:text-amber-500 shrink-0 mt-0.5" />
                <span className="text-muted">{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Application Form */}
        {canApply && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-black tracking-tight text-center">
              Formulario de Postulación
            </h2>

            <form onSubmit={handleSubmit} className="gro-card p-8 space-y-6" noValidate>
              {errors.general && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-500 text-sm font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="years"
                    className="block text-xs font-black uppercase tracking-wider text-muted"
                  >
                    Años de experiencia *
                  </label>
                  <select
                    id="years"
                    value={form.years}
                    onChange={(e) => {
                      setForm({ ...form, years: e.target.value })
                      setErrors((prev) => ({ ...prev, years: "", general: "" }))
                    }}
                    aria-invalid={!!errors.years}
                    className={`w-full bg-background border rounded-xl py-3 px-4 text-sm outline-none transition-all ${
                      errors.years ? "border-rose-500" : "border-border-gro focus:border-accent-gro"
                    }`}
                  >
                    <option value="">Selecciona</option>
                    <option value="3-5">3 - 5 años</option>
                    <option value="5-8">5 - 8 años</option>
                    <option value="8-12">8 - 12 años</option>
                    <option value="12+">12+ años</option>
                  </select>
                  {errors.years && (
                    <p className="text-[11px] text-rose-700 dark:text-rose-500 font-bold">{errors.years}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="tech"
                    className="block text-xs font-black uppercase tracking-wider text-muted"
                  >
                    Tecnologías *
                  </label>
                  <input
                    id="tech"
                    placeholder="React, Node.js, Python..."
                    value={form.tech}
                    maxLength={500}
                    onChange={(e) => {
                      setForm({ ...form, tech: e.target.value })
                      setErrors((prev) => ({ ...prev, tech: "", general: "" }))
                    }}
                    aria-invalid={!!errors.tech}
                    className={`w-full bg-muted/5 border rounded-xl py-3 px-4 text-sm outline-none transition-all ${
                      errors.tech ? "border-rose-500" : "border-border-gro focus:border-accent-gro"
                    }`}
                  />
                  {errors.tech && (
                    <p className="text-[11px] text-rose-700 dark:text-rose-500 font-bold">{errors.tech}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="github"
                  className="block text-xs font-black uppercase tracking-wider text-muted"
                >
                  URL de GitHub *{" "}
                  <span className="text-muted normal-case tracking-normal">
                    (usado para la revisión)
                  </span>
                </label>
                <div
                  className={`flex items-center gap-3 bg-muted/5 border rounded-xl px-4 transition-all ${
                    errors.github
                      ? "border-rose-500"
                      : "border-border-gro focus-within:border-accent-gro"
                  }`}
                >
                  <LinkIcon className="w-4 h-4 text-muted shrink-0" />
                  <input
                    id="github"
                    type="url"
                    placeholder="https://github.com/tu-usuario"
                    value={form.github}
                    maxLength={300}
                    onChange={(e) => {
                      setForm({ ...form, github: e.target.value })
                      setErrors((prev) => ({ ...prev, github: "", general: "" }))
                    }}
                    aria-invalid={!!errors.github}
                    className="bg-transparent border-none outline-none text-sm py-3 w-full placeholder:text-muted"
                  />
                </div>
                {errors.github && (
                  <p className="text-[11px] text-rose-700 dark:text-rose-500 font-bold">{errors.github}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="linkedin"
                  className="block text-xs font-black uppercase tracking-wider text-muted"
                >
                  LinkedIn <span className="text-muted">(opcional)</span>
                </label>
                <div
                  className={`flex items-center gap-3 bg-muted/5 border rounded-xl px-4 transition-all ${
                    errors.linkedin
                      ? "border-rose-500"
                      : "border-border-gro focus-within:border-accent-gro"
                  }`}
                >
                  <LinkIcon className="w-4 h-4 text-muted shrink-0" />
                  <input
                    id="linkedin"
                    type="url"
                    placeholder="https://www.linkedin.com/in/tu-perfil"
                    value={form.linkedin}
                    maxLength={300}
                    onChange={(e) => {
                      setForm({ ...form, linkedin: e.target.value })
                      setErrors((prev) => ({ ...prev, linkedin: "", general: "" }))
                    }}
                    aria-invalid={!!errors.linkedin}
                    className="bg-transparent border-none outline-none text-sm py-3 w-full placeholder:text-muted"
                  />
                </div>
                {errors.linkedin && (
                  <p className="text-[11px] text-rose-700 dark:text-rose-500 font-bold">{errors.linkedin}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="motivation"
                  className="block text-xs font-black uppercase tracking-wider text-muted"
                >
                  ¿Por qué quieres ser mentor? *
                </label>
                <textarea
                  id="motivation"
                  rows={4}
                  placeholder="Cuéntanos tu experiencia y por qué te gustaría ayudar a otros desarrolladores (mín. 50 caracteres)..."
                  value={form.motivation}
                  maxLength={2000}
                  onChange={(e) => {
                    setForm({ ...form, motivation: e.target.value })
                    setErrors((prev) => ({ ...prev, motivation: "", general: "" }))
                  }}
                  aria-invalid={!!errors.motivation}
                  className={`w-full bg-muted/5 border rounded-xl py-3 px-4 text-sm outline-none transition-all resize-none ${
                    errors.motivation
                      ? "border-rose-500"
                      : "border-border-gro focus:border-accent-gro"
                  }`}
                />
                <div className="flex justify-between">
                  {errors.motivation && (
                    <p className="text-[11px] text-rose-700 dark:text-rose-500 font-bold">{errors.motivation}</p>
                  )}
                  <p
                    className={`text-[11px] ml-auto ${
                      form.motivation.trim().length >= 50
                        ? "text-emerald-700 dark:text-emerald-500"
                        : "text-muted"
                    }`}
                  >
                    {form.motivation.trim().length}/50 min
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full gro-btn gro-btn-primary !py-4 !rounded-xl !text-base font-black flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Enviando postulación...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" /> Enviar Postulación
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}