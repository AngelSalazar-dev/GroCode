import Image from "next/image"
import { User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  className?: string
  /** Rendered size in px for next/image; the className controls layout. */
  size?: number
  rounded?: string
}

/**
 * Avatar for user-controlled image URLs.
 *
 * `unoptimized` is deliberate: `User.image` can point at any host (GitHub
 * OAuth, DiceBear, whatever a user typed in the profile editor), so it cannot
 * be guaranteed to match a `remotePatterns` entry. Optimizing through the
 * Next image server would also proxy arbitrary third-party images on demand.
 */
export default function UserAvatar({
  src,
  name,
  className,
  size = 40,
  rounded = "rounded-full",
}: UserAvatarProps) {
  const wrapper = cn(
    "flex items-center justify-center overflow-hidden bg-muted/10 shrink-0",
    rounded,
    className
  )

  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? "Avatar"}
        width={size}
        height={size}
        unoptimized
        className={cn(wrapper, "object-cover")}
      />
    )
  }

  return (
    <div className={cn(wrapper, "text-muted")} aria-label={name ? `Avatar de ${name}` : "Avatar"}>
      {name ? (
        <span className="font-bold text-xs">{name.charAt(0).toUpperCase()}</span>
      ) : (
        <UserIcon className="w-1/2 h-1/2" />
      )}
    </div>
  )
}