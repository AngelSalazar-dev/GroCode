import { Code2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PlaceholderPageProps {
  title: string
  description: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 bg-accent-gro/10 rounded-2xl flex items-center justify-center mx-auto">
          <Code2 className="w-8 h-8 text-accent-gro" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-muted font-medium">{description}</p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-accent-gro hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
