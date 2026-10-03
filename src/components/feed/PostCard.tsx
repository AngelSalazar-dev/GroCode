"use client"

import { Post, User, Like, Bookmark, Comment } from "@/generated-v2/client"
import { ExternalLink, MessageSquare, Star, GitBranch, MoreHorizontal, Bookmark as BookmarkIcon, Share2, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react"
import { getYouTubeId } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toggleLike, toggleBookmark } from "@/actions/interactions"
import { useState, useTransition } from "react"
import CommentForm from "./CommentForm"

interface PostCardProps {
  post: Post & { 
    author: User, 
    likes?: Like[], 
    bookmarks?: Bookmark[], 
    comments?: (Comment & { user: User })[]
  }
  currentUserId?: string
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [isPendingLike, startLikeTransition] = useTransition()
  const [isPendingBookmark, startBookmarkTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(post.comments || [])

  const youtubeId = post.resourceUrl ? getYouTubeId(post.resourceUrl) : null
  
  const hasLiked = currentUserId && post.likes?.some(l => l.userId === currentUserId)
  const hasBookmarked = currentUserId && post.bookmarks?.some(b => b.userId === currentUserId)
  const likesCount = post.likes?.length || 0
  const commentsCount = post.comments?.length || 0

  const handleLike = () => {
    if (!currentUserId) return
    startLikeTransition(async () => {
      await toggleLike(post.id)
    })
  }

  const handleBookmark = () => {
    if (!currentUserId) return
    startBookmarkTransition(async () => {
      await toggleBookmark(post.id)
    })
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error("Error sharing", e)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="gro-card overflow-hidden group/card"
    >
      <div className="p-6 space-y-6">
        {/* Author Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted/10 border border-border-gro overflow-hidden">
               {post.author.image ? (
                 <img src={post.author.image} alt={post.author.name || ""} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-muted font-bold text-xs">
                   {post.author.name?.charAt(0)}
                 </div>
               )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm hover:text-accent-gro cursor-pointer transition-colors">{post.author.name}</span>
                <span className="w-1 h-1 rounded-full bg-muted/40"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                  {post.author.role}
                </span>
              </div>
              <p className="text-[11px] text-muted font-medium">
                Publicado {new Date(post.createdAt).toLocaleDateString("es-ES", { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-muted/5 rounded-full transition-colors text-muted">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          <p className="text-[15px] text-foreground/90 leading-relaxed font-medium">
            {post.content}
          </p>

          {post.resourceUrl && (
            <div className="rounded-2xl border border-border-gro overflow-hidden bg-muted/5 group-hover/card:border-accent-gro/20 transition-all">
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
                  className="flex items-center gap-4 p-4 hover:bg-accent-gro/5 transition-colors group/link"
                >
                  <div className="w-10 h-10 bg-white dark:bg-black rounded-lg flex items-center justify-center border border-border-gro shadow-sm">
                    <ExternalLink className="w-4 h-4 text-accent-gro" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-accent-gro truncate uppercase tracking-wider">{post.resourceUrl}</p>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Visitar recurso externo</p>
                  </div>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Interaction Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-border-gro/50 mt-4">
          <div className="flex items-center gap-6 mt-4">
             <button 
                onClick={handleLike} 
                disabled={isPendingLike || !currentUserId}
                className={`flex items-center gap-2 transition-colors group/btn ${hasLiked ? "text-amber-500" : "text-muted hover:text-amber-500"}`}
             >
                {isPendingLike ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className={`w-4 h-4 ${hasLiked ? "fill-amber-500" : "group-hover/btn:fill-amber-500"}`} />}
                <span className="text-xs font-bold">{likesCount}</span>
             </button>
<button 
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-muted hover:text-foreground transition-colors group/btn"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-bold">{comments.length}</span>
                {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
             <button 
                onClick={handleBookmark}
                disabled={isPendingBookmark || !currentUserId}
                className={`p-2 rounded-full transition-colors ${hasBookmarked ? "text-accent-gro bg-accent-gro/10" : "text-muted hover:bg-muted/5 hover:text-foreground"}`}
             >
                {isPendingBookmark ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkIcon className={`w-4 h-4 ${hasBookmarked ? "fill-accent-gro" : ""}`} />}
             </button>
             <button 
                onClick={handleShare}
                className="p-2 hover:bg-muted/5 rounded-full text-muted hover:text-foreground transition-colors"
                title="Copiar enlace"
             >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
             </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border-gro/50 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {currentUserId && (
                <CommentForm 
                  postId={post.id} 
                  onCommentAdded={() => {
                    // Refresh comments - in real app would refetch
                    setShowComments(false)
                  }}
                />
              )}
              
              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted/10 border border-border-gro overflow-hidden shrink-0">
                        {comment.user.image ? (
                          <img src={comment.user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted text-[10px] font-bold">
                            {comment.user.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{comment.user.name}</span>
                          <span className="text-[10px] text-muted">
                            {new Date(comment.createdAt).toLocaleDateString("es-ES", { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 mt-0.5">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-2">No hay comentarios aún</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
