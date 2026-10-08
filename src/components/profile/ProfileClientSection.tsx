"use client"

import { useState } from "react"
import EditProfileModal from "./EditProfileModal"
import { Pencil } from "lucide-react"

interface ProfileClientSectionProps {
  user: {
    id: string
    name: string | null
    image?: string | null
    bio?: string | null
    location?: string | null
    website?: string | null
  }
}

/**
 * Only ever rendered on the viewer's own profile; the parent decides that,
 * so this component no longer needs an `isOwnProfile` prop to hide itself.
 */
export default function ProfileClientSection({ user }: ProfileClientSectionProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="gro-btn !rounded-full !py-2.5 !px-6 font-bold text-sm flex items-center justify-center gap-2 w-full"
      >
        <Pencil className="w-4 h-4" />
        Editar perfil
      </button>

      {showModal && <EditProfileModal user={user} onClose={() => setShowModal(false)} />}
    </>
  )
}