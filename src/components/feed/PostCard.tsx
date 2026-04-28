"use client"

import { Post, User } from "@prisma/client"
import { ExternalLink, MessageSquare, Star, GitBranch, Bookmark, MoreHorizontal } from "lucide-react"
import { getYouTubeId } from "@/lib/utils"
import { motion } from "framer-motion"

interface PostCardProps {
  post: Post & { author: User }
}

export default function PostCard({ post }: PostCardProps) {
  const youtubeId = post.resourceUrl ? getYouTubeId(post.resourceUrl) : null

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ borderColor: "var(--color-accent-github)" }}
      className="gh-box mb-4 transition-all duration-200"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-muted" />
            <span className="font-semibold text-accent-github hover:underline cursor-pointer">
              {post.author.name}
            </span>
            <span className="text-muted">/</span>
            <span className="font-semibold text-accent-github hover:underline cursor-pointer">
              resource-{post.id.slice(0, 5)}
            </span>
            <span className="text-[10px] border border-border-github px-2 rounded-full text-muted font-medium ml-2">
              Public
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="gh-button text-xs py-1 hover:scale-105 active:scale-95 transition-transform">
              <Star className="w-3 h-3" /> Star
            </button>
            <button className="gh-button text-xs py-1">
               <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground mb-4 leading-normal">
          {post.content}
        </p>

        {/* Resource Preview */}
        {post.resourceUrl && (
          <div className="mt-3 rounded-md border border-border-github overflow-hidden bg-[#f6f8fa] dark:bg-[#0d1117] transition-all hover:border-accent-github/30">
            {youtubeId ? (
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <a 
                href={post.resourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 hover:bg-card-github-hover transition-colors group/link"
              >
                <ExternalLink className="w-4 h-4 text-muted group-hover/link:text-accent-github transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-accent-github truncate">{post.resourceUrl}</p>
                </div>
              </a>
            )}
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-4 flex items-center gap-6 text-xs text-muted font-medium">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span>Technical Resource</span>
          </div>
          <div className="flex items-center gap-1 hover:text-accent-github cursor-pointer transition-colors">
            <Star className="w-3 h-3" />
            <span>12</span>
          </div>
          <div className="flex items-center gap-1 hover:text-accent-github cursor-pointer transition-colors">
             <MessageSquare className="w-3 h-3" />
             <span>8</span>
          </div>
          <div>
            Updated {new Date(post.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
