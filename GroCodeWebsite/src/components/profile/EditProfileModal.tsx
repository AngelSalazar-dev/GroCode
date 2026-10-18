"use client"

import { useState, useTransition } from "react"
import { updateProfile } from "@/actions/profile"
import { X, Loader2, User as UserIcon, Link as LinkIcon, MapPin, Save, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const AVATAR_SEEDS = [
  "Felix","Aneka","Luna","Max","Sophie","Jasper","Mia","Leo","Nina","Oscar",
  "Aria","Kai","Zoe","Eli","Nova","Ravi","Iris","Dante","Cleo","Sage",
  "Pixel","Ruby","Coder","Dev","Cloud","Byte","Node","React","Stack","Prisma",
  "Turbo","Swift","Rust","Py","Gofer","Docker","Kube","Git","Linux","Shell",
]

const AVATAR_STYLES = [
  { id: "adventurer", label: "Aventurero" },
  { id: "adventurer-neutral", label: "Neutral" },
  { id: "big-ears", label: "Orejas grandes" },
  { id: "big-ears-neutral", label: "Clásico" },
  { id: "fun-emoji", label: "Emoji" },
  { id: "lorelei", label: "Lorelei" },
]

interface EditProfileModalProps {
  user: {
    id: string
    name: string | null
    image?: string | null
    bio?: string | null
    location?: string | null
    website?: string | null
  }
  onClose: () => void
}

export default function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: user.name ?? "",
    bio: user.bio ?? "",
    location: user.location ?? "",
    website: user.website ?? "",
  })
  const [selectedAvatar, setSelectedAvatar] = useState(user.image ?? "")
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [avatarStyle, setAvatarStyle] = useState("adventurer")
  const [avatarPage, setAvatarPage] = useState(0)

  const currentAvatars = AVATAR_SEEDS.slice(avatarPage * 12, (avatarPage + 1) * 12)

  const getAvatarUrl = (seed: string) =>
    `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${seed}&backgroundColor=transparent`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      await updateProfile({ ...form, image: selectedAvatar })
      onClose()
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="gro-card w-full max-w-lg shadow-2xl my-8"
        >
          <div className="flex items-center justify-between p-6 border-b border-border-gro">
            <h2 className="text-lg font-black tracking-tight">Editar perfil</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Avatar Section */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-muted">Avatar</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-muted/10 border border-border-gro overflow-hidden shrink-0">
                  {selectedAvatar ? (
                    <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-3 text-muted" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="gro-btn !py-2 !px-4 !text-xs font-bold"
                >
                  {showAvatarPicker ? "Cerrar" : "Cambiar avatar"}
                </button>
              </div>

              <AnimatePresence>
                {showAvatarPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-2">
                      {/* Style Selector */}
                      <div className="flex gap-2 flex-wrap">
                        {AVATAR_STYLES.map(style => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setAvatarStyle(style.id)}
                            className={`text-[10px] px-3 py-1.5 rounded-full font-bold transition-all border ${
                              avatarStyle === style.id
                                ? "bg-accent-gro text-background border-accent-gro"
                                : "border-border-gro text-muted hover:text-foreground"
                            }`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>

                      {/* Avatar Grid */}
                      <div className="grid grid-cols-6 gap-2">
                        {currentAvatars.map(seed => {
                          const url = getAvatarUrl(seed)
                          return (
                            <button
                              key={seed}
                              type="button"
                              onClick={() => setSelectedAvatar(url)}
                              className={`w-full aspect-square rounded-xl bg-muted/5 border-2 overflow-hidden transition-all hover:scale-105 ${
                                selectedAvatar === url ? "border-accent-gro shadow-lg" : "border-transparent hover:border-border-gro"
                              }`}
                            >
                              <img src={url} alt={seed} className="w-full h-full object-cover" />
                            </button>
                          )
                        })}
                      </div>

                      {/* Pagination */}
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setAvatarPage(p => Math.max(0, p - 1))}
                          disabled={avatarPage === 0}
                          className="text-xs font-bold text-muted hover:text-foreground disabled:opacity-30"
                        >
                          ← Anteriores
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newSeeds = Array.from({ length: 12 }, () =>
                              `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                            )
                            AVATAR_SEEDS.push(...newSeeds)
                            setAvatarPage(p => p + 1)
                          }}
                          className="text-xs font-bold text-accent-gro hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Generar más
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarPage(p => p + 1)}
                          disabled={(avatarPage + 1) * 12 >= AVATAR_SEEDS.length}
                          className="text-xs font-bold text-muted hover:text-foreground disabled:opacity-30"
                        >
                          Siguientes →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted">Nombre</label>
              <div className="flex items-center gap-3 bg-muted/5 border border-border-gro rounded-xl px-4 focus-within:border-accent-gro transition-all">
                <UserIcon className="w-4 h-4 text-muted shrink-0" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Tu nombre"
                  className="bg-transparent border-none outline-none text-sm py-3 w-full placeholder:text-muted/60"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted">Biografía</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Cuéntale a la comunidad sobre ti..."
                className="w-full bg-muted/5 border border-border-gro rounded-xl py-3 px-4 text-sm focus:border-accent-gro outline-none transition-all resize-none"
              />
              <p className="text-[10px] text-muted/60 text-right">{form.bio.length}/160</p>
            </div>

            {/* Location + Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted">Ubicación</label>
                <div className="flex items-center gap-3 bg-muted/5 border border-border-gro rounded-xl px-4 focus-within:border-accent-gro transition-all">
                  <MapPin className="w-4 h-4 text-muted shrink-0" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="Ciudad, País"
                    className="bg-transparent border-none outline-none text-sm py-3 w-full placeholder:text-muted/60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted">Website</label>
                <div className="flex items-center gap-3 bg-muted/5 border border-border-gro rounded-xl px-4 focus-within:border-accent-gro transition-all">
                  <LinkIcon className="w-4 h-4 text-muted shrink-0" />
                  <input
                    type="url"
                    value={form.website}
                    onChange={e => setForm({ ...form, website: e.target.value })}
                    placeholder="https://tu-sitio.com"
                    className="bg-transparent border-none outline-none text-sm py-3 w-full placeholder:text-muted/60"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 gro-btn !py-3 !rounded-xl font-bold">Cancelar</button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 gro-btn gro-btn-primary !py-3 !rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
