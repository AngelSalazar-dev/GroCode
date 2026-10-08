"use client"

import { ExternalLink, MessageSquare, Star, Bookmark as BookmarkIcon, Share2, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react"
import { getYouTubeId } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toggleLike, toggleBookmark } from "@/actions/interactions"
import { useState, useTransition, useOptimistic } from "react"
import CommentForm from "./CommentForm"
import UserAvatar from "@/components/UserAvatar"

export interface PostCardData {
  id: string
  content: string
  resourceUrl: string | null
  channel: string
  createdAt: Date | string
  author: {
    id: string
    name: string | null
    image: string | null
    role: string
  }
  /**
   * Totals from the server. The full `likes[].userId` / `bookmarks[].userId`
   * lists are no longer sent: they leaked every user's interactions and made
   * viral posts megabytes large.
   */
  _count?: { likes: number; bookmarks: number; comments: number }
  /** Only the viewer's own row, capped at 1. */
  likes: { userId: string }[]
  bookmarks: { userId: string }[]
  comments: {
    id: string
    content: string
    createdAt: Date | string
    user: { id: string; name: string | null; image: string | null; role: string }
  }[]
}

interface PostCardProps {
  post: PostCardData
  currentUserId?: string
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [isPendingLike, startLikeTransition] = useTransition()
  const [isPendingBookmark, startBookmarkTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [error, setError] = useState("")

  // There are two layers, and the difference matters:
  //
  //   confirmed*  -> what the server last confirmed. Seeded from the props and
  //                  then overwritten with the answer the action returns.
  //   optimistic* -> what is painted during the transition, so the button reacts
  //                  before the round trip finishes.
  //
  // Previously the base of useOptimistic was `post.likes` (the props) and the
  // value returned by toggleLike was discarded: `await toggleLike(post.id)`.
  // That works only if revalidation always reaches this client. When it does not
  // -- and on a client-side navigation it often does not -- the optimistic layer
  // settles back to the stale props and the button shows "not liked" while the
  // row is already in the database. The action already tells us the truth, so it
  // gets used now. Same pattern as FollowButton.
  const [confirmedLikes, setConfirmedLikes] = useState(post.likes)
  const [confirmedBookmarks, setConfirmedBookmarks] = useState(post.bookmarks)
  const [syncedLikes, setSyncedLikes] = useState(post.likes)
  const [syncedBookmarks, setSyncedBookmarks] = useState(post.bookmarks)

  // Resync when the server sends a new list. Done during render (React's
  // "adjusting state when props change" pattern) instead of in an effect, which
  // would cost an extra render pass.
  if (post.likes !== syncedLikes) {
    setSyncedLikes(post.likes)
    setConfirmedLikes(post.likes)
  }
  if (post.bookmarks !== syncedBookmarks) {
    setSyncedBookmarks(post.bookmarks)
    setConfirmedBookmarks(post.bookmarks)
  }

  const toggleUserId = (list: { userId: string }[], userId: string) =>
    list.some((l) => l.userId === userId)
      ? list.filter((l) => l.userId !== userId)
      : [...list, { userId }]

  const [optimisticLikes, applyLikeOptimistic] = useOptimistic(
    confirmedLikes,
    (state, userId: string) => toggleUserId(state, userId)
  )
  const [optimisticBookmarks, applyBookmarkOptimistic] = useOptimistic(
    confirmedBookmarks,
    (state, userId: string) => toggleUserId(state, userId)
  )

  // Re-sync local comment state when the server sends a new list.
  const [comments, setComments] = useState(post.comments)
  const [syncedComments, setSyncedComments] = useState(post.comments)
  if (post.comments !== syncedComments) {
    setSyncedComments(post.comments)
    setComments(post.comments)
  }

  const youtubeId = post.resourceUrl ? getYouTubeId(post.resourceUrl) : null
const likedOnServer =
    !!currentUserId && post.likes.some((l) => l.userId === currentUserId)
  const bookmarkedOnServer =
    !!currentUserId && post.bookmarks.some((b) => b.userId === currentUserId)

  const hasLiked =
    !!currentUserId && optimisticLikes.some((l) => l.userId === currentUserId)
  const hasBookmarked =
    !!currentUserId && optimisticBookmarks.some((b) => b.userId === currentUserId)

  // The server total only changes after revalidation, so the viewer's pending
  // toggle is applied as a delta. Without it the number would stay frozen while
  // the button flipped, which reads as a broken like.
  const serverLikes = post._count?.likes ?? (likedOnServer ? 1 : 0)
  const serverBookmarks = post._count?.bookmarks ?? (bookmarkedOnServer ? 1 : 0)

  const likesTotal =
    serverLikes + (hasLiked === likedOnServer ? 0 : hasLiked ? 1 : -1)
  const bookmarksTotal =
    serverBookmarks + (hasBookmarked === bookmarkedOnServer ? 0 : hasBookmarked ? 1 : -1)

  const commentsTotal = post._count?.comments ?? comments.length

  const handleLike = () => {
    if (!currentUserId) return
    setError("")
    startLikeTransition(async () => {
      applyLikeOptimistic(currentUserId)
      try {
const result = await toggleLike(post.id)
      setConfirmedLikes((state) =>
        result.liked
          ? toggleUserId(state, currentUserId)
          : state.filter((l) => l.userId !== currentUserId)
      )
      } catch (err) {
        // Solo se llega aqui si la accion fallo de verdad: confirmedLikes no se
        // toca y la capa optimista revierte sola al terminar la transicion.
        setError(err instanceof Error ? err.message : "No se pudo actualizar")
      }
    })
  }

  const handleBookmark = () => {
    if (!currentUserId) return
    setError("")
    startBookmarkTransition(async () => {
      applyBookmarkOptimistic(currentUserId)
      try {
        const result = await toggleBookmark(post.id)
      setConfirmedBookmarks((state) =>
        result.bookmarked
          ? toggleUserId(state, currentUserId)
          : state.filter((b) => b.userId !== currentUserId)
      )
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar")
      }
    })
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("No se pudo copiar el enlace")
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
            <UserAvatar
              src={post.author.image}
              name={post.author.name}
              size={40}
              className="w-10 h-10 border border-border-gro"
            />
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
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          <p className="text-[15px] text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {post.resourceUrl && (
            <div className="rounded-2xl border border-border-gro overflow-hidden bg-muted/5 group-hover/card:border-accent-gro/20 transition-all">
              {youtubeId ? (
                <div className="aspect-video w-full">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
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
                aria-pressed={hasLiked}
                className={`flex items-center gap-2 transition-colors group/btn ${hasLiked ? "text-amber-700 dark:text-amber-500" : "text-muted hover:text-hover:-700 dark:hover:text-hover:-500"}`}
              >
                {isPendingLike ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Star
                    aria-hidden="true"
                    className={`w-4 h-4 ${hasLiked ? "fill-amber-500" : "group-hover/btn:fill-amber-500"}`}
                  />
                )}
                {/* El nombre accesible sale del contenido, no de un aria-label.
                    Un `aria-label` sobrescribe el texto visible y axe's
                    `label-content-name-mismatch` (WCAG 2.5.3) lo marca aunque
                    incluya la cifra, porque compara el nombre accesible con la
                    etiqueta visual. Con el texto oculto visualmente el nombre
                    ya contiene el contador sin entrar en conflicto. */}
                <span className="sr-only">{hasLiked ? "Quitar" : "Marcar"} me gusta</span>
                <span className="text-xs font-bold">{likesTotal}</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                aria-expanded={showComments}
                aria-controls={`comments-${post.id}`}
                className="flex items-center gap-2 text-muted hover:text-foreground transition-colors group/btn"
              >
                <MessageSquare aria-hidden="true" className="w-4 h-4" />
                <span className="sr-only">
                  {showComments ? "Ocultar" : "Ver"} comentarios
                </span>
                <span className="text-xs font-bold">{commentsTotal}</span>
                {showComments ? (
                  <ChevronUp aria-hidden="true" className="w-3 h-3" />
                ) : (
                  <ChevronDown aria-hidden="true" className="w-3 h-3" />
                )}
              </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
             <button
                onClick={handleBookmark}
                disabled={isPendingBookmark || !currentUserId}
                aria-label={
                  hasBookmarked
                    ? `Quitar de guardados (${bookmarksTotal})`
                    : `Guardar (${bookmarksTotal})`
                }
                aria-pressed={hasBookmarked}
                className={`p-2 min-h-11 min-w-11 flex items-center justify-center rounded-full transition-colors ${hasBookmarked ? "text-accent-gro bg-accent-gro/10" : "text-muted hover:bg-muted/5 hover:text-foreground"}`}
             >
                {isPendingBookmark ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkIcon className={`w-4 h-4 ${hasBookmarked ? "fill-accent-gro" : ""}`} />}
             </button>
             <button
                onClick={handleShare}
                className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-muted/5 rounded-full text-muted hover:text-foreground transition-colors"
                title="Copiar enlace"
                aria-label="Copiar enlace"
             >
                {copied ? <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-500" /> : <Share2 className="w-4 h-4" />}
             </button>
          </div>
        </div>

        {error && <p className="text-xs text-rose-700 dark:text-rose-500 font-medium">{error}</p>}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border-gro/50 overflow-hidden"
            id={`comments-${post.id}`}
          >
            <div className="p-4 space-y-4">
              {currentUserId && (
                <CommentForm
                  postId={post.id}
                  onCommentAdded={(comment) => setComments((prev) => [comment, ...prev])}
                />
              )}

              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <UserAvatar
                        src={comment.user.image}
                        name={comment.user.name}
                        size={28}
                        className="w-7 h-7 border border-border-gro"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{comment.user.name}</span>
                          <span className="text-[10px] text-muted">
                            {new Date(comment.createdAt).toLocaleDateString("es-ES", { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 mt-0.5 break-words">{comment.content}</p>
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
