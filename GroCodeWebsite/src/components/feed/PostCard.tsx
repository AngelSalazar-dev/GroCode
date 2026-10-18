"use client"

import { Post, User, Like, Bookmark, Comment } from "@/generated-v4/client"
import { ExternalLink, MessageSquare, Star, MoreHorizontal, Bookmark as BookmarkIcon, Share2, Loader2, Check, Pencil, Trash2, X } from "lucide-react"
import { getYouTubeId, timeAgo } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toggleLike, toggleBookmark, addComment } from "@/actions/interactions"
import { deletePost, updatePost } from "@/actions/posts"
import { useState, useTransition } from "react"
import { Send } from "lucide-react"

interface PostCardProps {
  post: Post & { 
    author: User, 
    likes?: Like[], 
    bookmarks?: Bookmark[], 
    comments?: (Comment & { user: User })[],
    _count?: {
      likes: number,
      comments: number,
      bookmarks: number,
    }
  }
  currentUserId?: string
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [isPendingLike, startLikeTransition] = useTransition()
  const [isPendingBookmark, startBookmarkTransition] = useTransition()
  const [isPendingComment, startCommentTransition] = useTransition()
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentContent, setCommentContent] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isPendingEdit, startEditTransition] = useTransition()

  const youtubeId = post.resourceUrl ? getYouTubeId(post.resourceUrl) : null
  
  const hasLiked = currentUserId && post.likes?.some(l => l.userId === currentUserId)
  const hasBookmarked = currentUserId && post.bookmarks?.some(b => b.userId === currentUserId)
  const likesCount = post._count?.likes ?? post.likes?.length ?? 0
  const commentsCount = post._count?.comments ?? post.comments?.length ?? 0

  const isOwner = currentUserId === post.authorId

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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !commentContent.trim()) return
    startCommentTransition(async () => {
      await addComment(post.id, commentContent)
      setCommentContent("")
    })
  }

  const handleDelete = () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta publicación?")) return
    startDeleteTransition(async () => {
      await deletePost(post.id)
    })
  }

  const handleEdit = () => {
    if (!editContent.trim() || editContent.length < 10) return
    startEditTransition(async () => {
      await updatePost(post.id, editContent)
      setIsEditing(false)
    })
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
            <div className="w-10 h-10 rounded-full bg-muted/10 border border-border-gro overflow-hidden shrink-0">
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
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          
          {isOwner && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-muted/5 rounded-full transition-colors text-muted"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 w-40 gro-card shadow-2xl z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => { setIsEditing(true); setShowMenu(false) }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-muted hover:bg-muted/5 hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => { handleDelete(); setShowMenu(false) }}
                        disabled={isPendingDelete}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/5 transition-colors"
                      >
                        {isPendingDelete ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Eliminar
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-muted/5 border border-border-gro rounded-xl p-4 text-sm focus:ring-2 focus:ring-accent-gro/10 focus:border-accent-gro outline-none transition-all min-h-[120px] resize-none"
                placeholder="Edita tu publicación..."
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setIsEditing(false); setEditContent(post.content) }}
                  className="gro-btn !py-1.5 !px-3 !text-xs !rounded-full flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Cancelar
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isPendingEdit || !editContent.trim() || editContent.length < 10}
                  className="gro-btn gro-btn-primary !py-1.5 !px-3 !text-xs !rounded-full flex items-center gap-1"
                >
                  {isPendingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[15px] text-foreground/90 leading-relaxed font-medium">
              {post.content}
            </p>
          )}

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
                  <div className="w-10 h-10 bg-white dark:bg-black rounded-lg flex items-center justify-center border border-border-gro shadow-sm group-hover/link:scale-110 transition-transform">
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
                className={`flex items-center gap-2 transition-all group/btn ${hasLiked ? "text-amber-500" : "text-muted hover:text-amber-500"}`}
             >
                {isPendingLike ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className={`w-4 h-4 transition-transform group-hover/btn:scale-110 ${hasLiked ? "fill-amber-500" : "group-hover/btn:fill-amber-500"}`} />}
                <span className="text-xs font-bold">{likesCount}</span>
             </button>
             <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 transition-colors group/btn ${showComments ? "text-foreground" : "text-muted hover:text-foreground"}`}
             >
                <MessageSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                <span className="text-xs font-bold">{commentsCount}</span>
             </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
             <button 
                onClick={handleBookmark}
                disabled={isPendingBookmark || !currentUserId}
                className={`p-2 rounded-full transition-all ${hasBookmarked ? "text-accent-gro bg-accent-gro/10" : "text-muted hover:bg-muted/5 hover:text-foreground"}`}
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
        
        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border-gro/50 space-y-4">
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-4">
                {post.comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted/10 overflow-hidden shrink-0">
                       {comment.user.image ? (
                         <img src={comment.user.image} alt={comment.user.name || ""} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-muted font-bold text-[10px]">
                           {comment.user.name?.charAt(0)}
                         </div>
                       )}
                    </div>
                    <div className="bg-muted/5 rounded-2xl px-4 py-2 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold">{comment.user.name}</span>
                        <span className="text-[10px] text-muted">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground/90">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted text-center py-2">Sé el primero en comentar.</p>
            )}

            {currentUserId && (
              <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 bg-muted/5 border border-border-gro rounded-full px-4 py-2 text-sm focus:outline-none focus:border-accent-gro transition-colors"
                  disabled={isPendingComment}
                />
                <button
                  type="submit"
                  disabled={isPendingComment || !commentContent.trim()}
                  className="p-2 bg-accent-gro text-background rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
