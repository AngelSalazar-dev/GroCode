import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import { Role, ApplicationStatus } from "@/generated-v2/client"
import AdminApplications from "@/components/admin/AdminApplications"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Panel de administración",
  robots: { index: false, follow: false },
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Pendiente",
  VERIFIED: "Verificada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()

  // Belt-and-braces: the client component re-checks too, but a server page
  // should never render privileged data to a non-admin.
  if (!session?.user?.id) redirect("/auth/signin")
  if (session.user.role !== Role.ADMIN) redirect("/feed")

  const params = await searchParams
  const requested = params.status?.toUpperCase()
  const status =
    requested && requested in STATUS_LABEL
      ? (requested as ApplicationStatus)
      : undefined

  const [applications, counts] = await Promise.all([
    prisma.seniorApplication.findMany({
      where: status ? { status } : undefined,
      select: {
        id: true,
        status: true,
        yearsOfExperience: true,
        technologies: true,
        githubProfile: true,
        linkedinProfile: true,
        motivation: true,
        createdAt: true,
        reviewedAt: true,
        user: {
          select: { id: true, name: true, email: true, role: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.seniorApplication.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ])

  const countByStatus = counts.reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.status] = row._count._all
      return acc
    },
    {}
  )

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Revisión de postulaciones</h1>
        <p className="text-sm text-muted font-medium">
          Verifica los perfiles de GitHub de los candidatos antes de aprobar la insignia
          de Senior.
        </p>
      </div>

      <AdminApplications
        applications={applications.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          reviewedAt: a.reviewedAt?.toISOString() ?? null,
        }))}
        statusLabels={STATUS_LABEL}
        activeStatus={status ?? null}
        counts={countByStatus}
      />
    </div>
  )
}