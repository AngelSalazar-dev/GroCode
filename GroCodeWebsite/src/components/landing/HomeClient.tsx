"use client"

import Link from "next/link"
import { Code2, Users, ArrowRight, Zap, Shield, Mail, Map } from "lucide-react"
import { motion } from "framer-motion"

interface HomeProps {
  stats: {
    mentors: number
    users: number
    posts: number
  }
}

export default function HomeClient({ stats }: HomeProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Video Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 brightness-[0.3]"
        >
          <source src="/Video_Generado_Bajo_Petición.mp4" type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/20 to-background z-[1]" />

        <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2 rounded-full text-white/80 text-xs font-bold uppercase tracking-widest"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Beta v1.0 — Open for developers
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-white"
          >
            Escala tu carrera <br />
            <span className="text-white/80">con mentoría técnica.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-white/70 max-w-2xl mx-auto font-medium"
          >
            La plataforma social definitiva para desarrolladores que buscan mentoría de expertos, recursos de alta calidad y un crecimiento profesional acelerado.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link href="/auth/register" className="gro-btn gro-btn-primary !py-4 !px-10 !text-lg !rounded-full shadow-2xl">
              Empezar ahora
            </Link>
            <Link href="/mentors" className="gro-btn glass !py-4 !px-10 !text-lg !rounded-full border-white/20 text-white hover:bg-white/10 flex items-center gap-2 transition-all">
              Explorar Mentores
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Brand Section */}
      <section className="py-24 px-6 bg-card-gro border-y border-border-gro">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border-gro group">
              <img 
                src="/Logo fondo oscuro.jpg" 
                alt="Brand Identity" 
                className="w-full h-full object-cover dark:block hidden" 
              />
              <img 
                src="/Logo fondo claro.jpg" 
                alt="Brand Identity" 
                className="w-full h-full object-cover block dark:hidden" 
              />
              <div className="absolute inset-0 bg-accent-gro/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 space-y-6"
          >
            <h2 className="text-4xl font-bold tracking-tight">Identidad construida para el éxito.</h2>
            <p className="text-lg text-muted font-medium leading-relaxed">
              En GroCode creemos en la democratización del conocimiento técnico. Nuestra plataforma no es solo un clon de herramientas existentes, sino un ecosistema diseñado para la colaboración real entre Seniors y Juniors.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
               <div>
                  <h4 className="text-3xl font-black">{stats.mentors}+</h4>
                  <p className="text-sm text-muted font-bold">Mentores verificados</p>
               </div>
               <div>
                  <h4 className="text-3xl font-black">{stats.posts}+</h4>
                  <p className="text-sm text-muted font-bold">Recursos compartidos</p>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-[1200px] mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Todo lo que necesitas para crecer.</h2>
            <p className="text-muted text-lg font-medium max-w-2xl mx-auto">Herramientas profesionales diseñadas por desarrolladores para desarrolladores.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureItem 
              icon={<Zap className="w-7 h-7" />}
              title="Recursos Curados"
              description="Accede a enlaces técnicos y tutoriales de alta calidad filtrados por la comunidad y expertos."
              delay={0.1}
            />
            <FeatureItem 
              icon={<Users className="w-7 h-7" />}
              title="Mentoría Directa"
              description="Conecta 1-a-1 con desarrolladores Senior con experiencia real en la industria tecnológica."
              delay={0.2}
            />
            <FeatureItem 
              icon={<Shield className="w-7 h-7" />}
              title="Crecimiento Seguro"
              description="Pasa de Junior a Senior con rutas guiadas y consejos personalizados basados en tu perfil."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Roadmap CTA */}
      <section className="py-24 px-6 bg-card-gro border-y border-border-gro">
        <div className="max-w-[1200px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-12 p-10 rounded-3xl border border-border-gro bg-background"
          >
            <div className="w-20 h-20 rounded-2xl bg-accent-gro/5 flex items-center justify-center shrink-0 border border-border-gro">
              <Map className="w-10 h-10 text-accent-gro" />
            </div>
            <div className="flex-1 space-y-3 text-center md:text-left">
              <h3 className="text-2xl font-black tracking-tight">Roadmap Comunitario</h3>
              <p className="text-muted font-medium max-w-xl">
                Sigue la ruta de aprendizaje diseñada y validada por mentores expertos. Desde los fundamentos hasta DevOps.
              </p>
            </div>
            <Link href="/roadmap" className="gro-btn gro-btn-primary !py-4 !px-8 !rounded-full shrink-0 flex items-center gap-2">
              Ver Roadmap <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-accent-gro)_5%,transparent_60%)] opacity-[0.03] -z-10" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-10"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[1]">¿Listo para elevar <br/> tu nivel de código?</h2>
          <p className="text-muted text-xl font-medium max-w-2xl mx-auto">Únete a más de {stats.users} desarrolladores que están acelerando su carrera profesional hoy mismo.</p>
          <div className="flex justify-center pt-4">
            <Link href="/auth/register" className="gro-btn gro-btn-primary !py-5 !px-14 !text-xl !rounded-full shadow-2xl">
              Empezar gratis ahora
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-gro bg-card-gro">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-accent-gro rounded-lg flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-background" />
                </div>
                <span className="font-black text-xl tracking-tight">GroCode</span>
              </div>
              <p className="text-sm text-muted font-medium leading-relaxed">
                La plataforma de mentoría técnica que conecta Juniors con Seniors para un crecimiento real.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a href="https://github.com/grocode" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted/5 border border-border-gro flex items-center justify-center hover:border-accent-gro hover:bg-accent-gro/5 transition-all">
                  {/* GitHub SVG */}
                  <svg className="w-4 h-4 text-muted" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                </a>
                <a href="https://x.com/grocode" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted/5 border border-border-gro flex items-center justify-center hover:border-accent-gro hover:bg-accent-gro/5 transition-all">
                  {/* X/Twitter SVG */}
                  <svg className="w-4 h-4 text-muted" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="mailto:hola@grocode.dev" className="w-9 h-9 rounded-full bg-muted/5 border border-border-gro flex items-center justify-center hover:border-accent-gro hover:bg-accent-gro/5 transition-all">
                  <Mail className="w-4 h-4 text-muted" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted">Producto</h4>
              <div className="space-y-3">
                <Link href="/feed" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Dashboard</Link>
                <Link href="/mentors" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Mentores</Link>
                <Link href="/roadmap" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Roadmap</Link>
                <Link href="/notifications" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Notificaciones</Link>
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted">Recursos</h4>
              <div className="space-y-3">
                <Link href="/docs" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Documentación</Link>
                <Link href="/blog" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Blog</Link>
                <Link href="/api-docs" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">API Reference</Link>
                <Link href="/changelog" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Changelog</Link>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted">Legal</h4>
              <div className="space-y-3">
                <Link href="/terms" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Términos de servicio</Link>
                <Link href="/privacy" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Privacidad</Link>
                <Link href="/cookies" className="block text-sm font-medium text-foreground/70 hover:text-accent-gro transition-colors">Cookies</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border-gro pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted font-medium">© 2026 GroCode. Todos los derechos reservados.</p>
            <p className="text-xs text-muted/50 font-medium">Hecho con ❤️ para la comunidad de desarrolladores</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureItem({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="gro-card p-10 space-y-8 group hover:-translate-y-2"
    >
      <div className="text-accent-gro bg-muted/5 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-accent-gro group-hover:text-background transition-colors duration-300">
        {icon}
      </div>
      <div className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        <p className="text-muted leading-relaxed font-medium">{description}</p>
      </div>
      <Link href="/feed" className="text-accent-gro hover:underline text-sm font-bold flex items-center gap-1 group/link">
        Más información <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  )
}
