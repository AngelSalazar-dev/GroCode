"use client"

import { useState } from "react"
import EditProfileModal from "./EditProfileModal"
import { Pencil } from "lucide-react"

interface ProfileClientSectionProps {
  isOwnProfile: boolean
  user: {
    id: string
    name: string | null
    image?: string | null
    bio?: string | null
    location?: string | null
    website?: string | null
  }
}

export default function ProfileClientSection({ isOwnProfile, user }: ProfileClientSectionProps) {
  const [showModal, setShowModal] = useState(false)

  if (!isOwnProfile) return null

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="gro-btn !rounded-full !py-2.5 !px-6 font-bold text-sm flex items-center gap-2 w-full justify-center"
      >
        <Pencil className="w-4 h-4" />
        Editar perfil
      </button>

      {showModal && (
        <EditProfileModal user={user} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
