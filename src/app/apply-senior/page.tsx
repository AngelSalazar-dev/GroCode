"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShieldCheck, Link as LinkIcon, Loader2, ArrowLeft, CheckCircle2, Zap, Users, Trophy, Star, Crown, Sparkles, BadgeCheck, TrendingUp } from "lucide-react"
import Link from "next/link"

const BENEFITS = [
  { icon: Crown, title: "Insignia Verificada", desc: "Tu perfil muestra la insignia de Senior Verificado con prioridad en búsquedas.", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { icon: Users, title: "Solicitudes de Mentoría", desc: "Recibe solicitudes directas de Juniors que quieren aprender de ti.", color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { icon: Trophy, title: "Ranking de Mentores", desc: "Apareces en el Top Mentores del mes basado en tu actividad y reviews.", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { icon: TrendingUp, title: "Analíticas de Impacto", desc: "Métricas exclusivas sobre cuántos devs has ayudado y tu alcance.", color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  { icon: Sparkles, title: "Contenido Destacado", desc: "Tus publicaciones tienen mayor visibilidad en el feed de la comunidad.", color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { icon: Zap, title: "Acceso Anticipado", desc: "Prueba nuevas features de GroCode antes que nadie como beta tester VIP.", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
]

const REQUIREMENTS = [
  "Mínimo 3 años de experiencia profesional en desarrollo de software",
  "Perfil de GitHub con contribuciones verificables",
  "Disposición para mentorear al menos 2 horas por semana",
  "Actitud profesional y constructiva con la comunidad",
]

const VERIFICATION_STEPS = [
  { step: 1, title: "Envía tu solicitud", desc: "Completa el formulario con tu experiencia y enlaces profesionales." },
  { step: 2, title: "Verificación automática", desc: "Nuestro sistema analiza tu perfil de GitHub (actividad, repos, contribuciones)." },
  { step: 3, title: "Revisión del equipo", desc: "Un miembro del equipo GroCode valida tu información en 24-48h." },
  { step: 4, title: "¡Bienvenido, Senior!", desc: "Recibes tu insignia y acceso a todas las funcionalidades premium." },
]

export default function ApplySeniorPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ years: "", github: "", linkedin: "", tech: "", motivation: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.years) errs.years = "Selecciona tu experiencia"
    if (!form.tech.trim()) errs.tech = "Indica tus tecnologías"
    if (!form.github.trim()) errs.github = "Tu GitHub es necesario para la verificación"
    if (!form.motivation.trim()) errs.motivation = "Cuéntanos tu motivación"
    else if (form.motivation.trim().length < 50) errs.motivation = "Al menos 50 caracteres"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    setSubmitted(true)
    setIsLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 max-w-lg">
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-28 h-28 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border-2 border-emerald-500/30">
              <CheckCircle2 className="w-14 h-14" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight">¡Solicitud recibida!</h1>
            <p className="text-muted font-medium leading-relaxed text-lg">
              Estamos verificando tu perfil de GitHub automáticamente. La revisión manual se completará en <strong className="text-foreground">24-48 horas</strong>.
            </p>
          </div>
          <div className="gro-card p-6 text-left space-y-3 max-w-sm mx-auto">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted">Próximos pasos</h3>
            <ul className="space-y-2 text-sm font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Verificación de GitHub iniciada</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-border-gro rounded-full shrink-0" /> Revisión manual del equipo</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-border-gro rounded-full shrink-0" /> Activación de insignia Senior</li>
            </ul>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link href="/feed" className="gro-btn gro-btn-primary !rounded-full !px-8 !py-3">Volver al Feed</Link>
            <Link href="/mentors" className="gro-btn !rounded-full !px-8 !py-3">Ver Mentores</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-16 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_var(--color-accent-gro)_0%,transparent_40%)] opacity-[0.03] -z-10" />

      <div className="max-w-5xl mx-auto space-y-16">
        <Link href="/feed" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al Feed
        </Link>

        {/* Hero */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center border border-amber-500/20 mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">Conviértete en <span className="text-amber-500">Senior Verificado</span></h1>
          <p className="text-xl text-muted font-medium leading-relaxed max-w-2xl mx-auto">
            Comparte tu experiencia con la comunidad, obtén reconocimiento y accede a herramientas exclusivas para mentores.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight text-center">Ventajas exclusivas para Seniors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`gro-card p-6 space-y-4 hover:border-${b.color.replace("text-","")}/30 transition-all`}
                >
                  <div className={`w-12 h-12 ${b.bg} ${b.color} rounded-2xl flex items-center justify-center border ${b.border}`}>
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
          <h2 className="text-2xl font-black tracking-tight text-center">Proceso de verificación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VERIFICATION_STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="gro-card p-6 space-y-3 relative"
              >
                <span className="text-4xl font-black text-accent-gro/10">{s.step}</span>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="gro-card p-5 text-center bg-amber-500/5 border-amber-500/20 max-w-2xl mx-auto">
            <p className="text-sm font-medium text-muted">
              <BadgeCheck className="w-4 h-4 inline text-amber-500 mr-1" />
              La verificación combina <strong className="text-foreground">análisis automático de GitHub</strong> (actividad, repos, commits) con una <strong className="text-foreground">revisión manual</strong> por el equipo. Tiempo promedio: <strong className="text-foreground">24-48 horas</strong>.
            </p>
          </div>
        </div>

        {/* Requirements */}
        <div className="gro-card p-8 space-y-4 max-w-2xl mx-auto">
          <h3 className="text-lg font-black">Requisitos mínimos</h3>
          <ul className="space-y-3">
            {REQUIREMENTS.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-muted">{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Application Form */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-black tracking-tight text-center">Formulario de Postulación</h2>

          <form onSubmit={handleSubmit} className="gro-card p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted">Años de experiencia *</label>
                <select
                  value={form.years}
                  onChange={e => { setForm({ ...form, years: e.target.value }); setErrors(prev => ({ ...prev, years: "" })) }}
                  className={`w-full bg-background border rounded-xl py-3 px-4 text-sm outline-none transition-all ${errors.years ? "border-rose-500" : "border-border-gro focus:border-accent-gro"}`}
                >
                  <option value="" className="bg-background text-foreground">Selecciona</option>
                  <option value="3-5" className="bg-background text-foreground">3 - 5 años</option>
                  <option value="5-8" className="bg-background text-foreground">5 - 8 años</option>
                  <option value="8-12" className="bg-background text-foreground">8 - 12 años</option>
                  <option value="12+" className="bg-background text-foreground">12+ años</option>
                </select>
                {errors.years && <p className="text-[11px] text-rose-500 font-bold">{errors.years}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted">Tecnologías *</label>
                <input
                  placeholder="React, Node.js, Python..."
                  value={form.tech}
                  onChange={e => { setForm({ ...form, tech: e.target.value }); setErrors(prev => ({ ...prev, tech: "" })) }}
                  className={`w-full bg-muted/5 border rounded-xl py-3 px-4 text-sm outline-none transition-all ${errors.tech ? "border-rose-500" : "border-border-gro focus:border-accent-gro"}`}
                />
                {errors.tech && <p className="text-[11px] text-rose-500 font-bold">{errors.tech}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted">URL de GitHub * <span className="text-muted/50 normal-case tracking-normal">(usado para verificación automática)</span></label>
              <div className={`flex items-center gap-3 bg-muted/5 border rounded-xl px-4 transition-all ${errors.github ? "border-rose-500" : "border-border-gro focus-within:border-accent-gro"}`}>
                <LinkIcon className="w-4 h-4 text-muted shrink-0" />
                <input
                  type="url"
                  placeholder="https://github.com/tu-usuario"
                  value={form.github}
                  onChange={e => { setForm({ ...form, github: e.target.value }); setErrors(prev => ({ ...prev, github: "" })) }}
                  className="bg-transparent border-none outline-none text-sm py-3 w-full placeholder:text-muted/60"
                />
              </div>
              {errors.github && <p className="text-[11px] text-rose-500 font-bold">{errors.github}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted">LinkedIn <span className="text-muted/50">(opcional)</span></label>
              <div className="flex items-center gap-3 bg-muted/5 border border-border-gro rounded-xl px-4 focus-within:border-accent-gro transition-all">
                <LinkIcon className="w-4 h-4 text-muted shrink-0" />
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/tu-perfil"
                  value={form.linkedin}
                  onChange={e => setForm({ ...form, linkedin: e.target.value })}
                  className="bg-transparent border-none outline-none text-sm py-3 w-full placeholder:text-muted/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted">¿Por qué quieres ser mentor? *</label>
              <textarea
                rows={4}
                placeholder="Cuéntanos tu experiencia y por qué te gustaría ayudar a otros desarrolladores (mín. 50 caracteres)..."
                value={form.motivation}
                onChange={e => { setForm({ ...form, motivation: e.target.value }); setErrors(prev => ({ ...prev, motivation: "" })) }}
                className={`w-full bg-muted/5 border rounded-xl py-3 px-4 text-sm outline-none transition-all resize-none ${errors.motivation ? "border-rose-500" : "border-border-gro focus:border-accent-gro"}`}
              />
              <div className="flex justify-between">
                {errors.motivation && <p className="text-[11px] text-rose-500 font-bold">{errors.motivation}</p>}
                <p className={`text-[11px] ml-auto ${form.motivation.length >= 50 ? "text-emerald-500" : "text-muted/50"}`}>
                  {form.motivation.length}/50 min
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full gro-btn gro-btn-primary !py-4 !rounded-xl !text-base font-black flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Verificando tu perfil...</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> Enviar Postulación</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
