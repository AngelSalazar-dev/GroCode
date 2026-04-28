"use client"

import Link from "next/link"
import { Code2, Users, Rocket, ArrowRight, Star, ChevronRight, Zap, Shield } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="pt-24 pb-16 px-4 relative">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 space-y-8"
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-github bg-card-github text-xs font-semibold shadow-sm"
            >
              <span className="bg-[#238636] text-white px-2 py-0.5 rounded-full text-[10px]">New</span>
              <span className="text-muted">GroCode 1.0 is now in public beta</span>
              <ChevronRight className="w-3 h-3 text-muted" />
            </motion.div>
            
            <h1 className="text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] text-foreground">
              Where the world <br /> 
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-accent-github bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                builds expertise.
              </motion.span>
            </h1>
            
            <p className="text-xl text-muted max-w-xl font-medium leading-relaxed">
              GroCode is the technical mentorship platform for developers. Connect with experts, share high-quality resources, and accelerate your career.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth/signin" className="gh-button gh-button-primary !py-4 !px-8 !text-lg shadow-xl shadow-success/20 hover:scale-105 transition-transform active:scale-95">
                Sign up for GroCode
              </Link>
              <Link href="/mentors" className="gh-button !py-4 !px-8 !text-lg hover:bg-card-github-hover transition-all flex items-center gap-2 group">
                Browse Mentors
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 3 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex-1 hidden lg:block relative"
          >
            <div className="absolute inset-0 bg-accent-github/10 blur-[100px] rounded-full -z-10" />
            <div className="gh-box p-4 shadow-2xl bg-card-github relative overflow-hidden">
              <div className="border-b border-border-github pb-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="text-[10px] font-mono text-muted tracking-widest uppercase">expert_matching_engine.ts</div>
              </div>
              <motion.pre 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xs font-mono text-accent-github p-4 overflow-hidden leading-relaxed"
              >
                {`function matchMentor(junior: Junior) {
  return seniors.filter(senior => 
    senior.skills.some(skill => 
      junior.goals.includes(skill)
    )
  ).sort(byReputation);
}

// GroCode: Scaling your growth.`}
              </motion.pre>
              <div className="absolute bottom-0 right-0 p-4 opacity-10">
                <Code2 className="w-32 h-32" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-[#f6f8fa] dark:bg-[#0d1117] border-y border-border-github relative">
        <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureItem 
            icon={<Zap className="w-8 h-8" />}
            title="Curated Resources"
            description="High-quality technical links and tutorials shared by the community."
            delay={0.1}
          />
          <FeatureItem 
            icon={<Users className="w-8 h-8" />}
            title="Expert Mentorship"
            description="Direct access to Senior developers with verified industry experience."
            delay={0.2}
          />
          <FeatureItem 
            icon={<Shield className="w-8 h-8" />}
            title="Career Growth"
            description="From Junior to Senior with guided paths and personalized advice."
            delay={0.3}
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-github/5 via-transparent to-transparent -z-10" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center px-4 space-y-8"
        >
          <h2 className="text-4xl lg:text-6xl font-black tracking-tight">Ready to level up your code?</h2>
          <p className="text-muted text-xl font-medium max-w-2xl mx-auto">Join 5,000+ developers shipping better software every day with personalized guidance.</p>
          <div className="flex justify-center pt-4">
            <Link href="/auth/signin" className="gh-button gh-button-primary !py-5 !px-12 !text-xl shadow-2xl hover:scale-105 transition-transform active:scale-95">
              Get started for free
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
      className="space-y-6 group"
    >
      <div className="text-accent-github bg-accent-github/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        <p className="text-muted leading-relaxed font-medium">{description}</p>
      </div>
      <Link href="#" className="text-accent-github hover:underline text-sm font-bold flex items-center gap-1 group/link">
        Learn more <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  )
}
