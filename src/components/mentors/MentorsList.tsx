"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Star, MapPin, Building2, Code2, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function MentorsPage({ mentors }: { mentors: any[] }) {
  return (
    <div className="max-w-[1280px] mx-auto py-12 px-4 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-64 space-y-6"
      >
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Filter by type</h3>
          <div className="space-y-1">
            {["All", "Front-end", "Back-end", "DevOps", "AI"].map((type, i) => (
              <motion.div 
                key={type} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-2 rounded-md hover:bg-card-github-hover cursor-pointer text-sm font-medium transition-colors"
              >
                <span>{type}</span>
                <span className="text-[10px] bg-border-github/50 px-1.5 rounded-full text-muted">12</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <div className="flex-1 space-y-4">
        <div className="border-b border-border-github pb-4 mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {mentors.length} mentors <span className="text-muted font-normal">available</span>
          </h1>
          <div className="flex gap-2">
            <button className="gh-button text-xs">Sort: Best match</button>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {mentors.map((mentor, i) => (
              <motion.div 
                key={mentor.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="gh-box p-6 hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border border-border-github shrink-0">
                    <img src={mentor.image || "/logo.png"} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/profile/${mentor.id}`} className="text-xl font-bold text-accent-github hover:underline">
                          {mentor.name}
                        </Link>
                        <p className="text-sm text-muted font-medium italic">senior-dev / mentoring-available</p>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="gh-button text-xs"
                      >
                        Follow
                      </motion.button>
                    </div>

                    <p className="text-sm text-foreground max-w-2xl">
                      Full-stack expert helping Juniors master modern architecture and clean code principles.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted font-medium">
                      <div className="flex items-center gap-1">
                        <Code2 className="w-3 h-3" />
                        React, TypeScript, Node.js
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        GroCode Expert
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Remote
                      </div>
                      <div className="flex items-center gap-1 text-amber-600">
                        <Star className="w-3 h-3 fill-amber-600" />
                        4.9 (24 reviews)
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {mentors.length === 0 && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="py-20 text-center space-y-4 border-2 border-dashed border-border-github rounded-md"
             >
                <Search className="w-12 h-12 text-muted mx-auto" />
                <p className="text-muted">No mentors found matching your criteria.</p>
             </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
