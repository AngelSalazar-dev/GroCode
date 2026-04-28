"use client"

import Link from "next/link"
import { Code2, Users, Rocket, ArrowRight, Star, ChevronRight, Zap, Shield, Play } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
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
                  <h4 className="text-3xl font-black">500+</h4>
                  <p className="text-sm text-muted font-bold">Mentores verificados</p>
               </div>
               <div>
                  <h4 className="text-3xl font-black">10k+</h4>
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
          <p className="text-muted text-xl font-medium max-w-2xl mx-auto">Únete a más de 5,000 desarrolladores que están acelerando su carrera profesional hoy mismo.</p>
          <div className="flex justify-center pt-4">
            <Link href="/auth/register" className="gro-btn gro-btn-primary !py-5 !px-14 !text-xl !rounded-full shadow-2xl">
              Empezar gratis ahora
            </Link>
          </div>
        </motion.div>
      </section>
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
