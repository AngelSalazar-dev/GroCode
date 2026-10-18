"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import ProjectCard from "./ProjectCard"
import { Loader2, Rocket } from "lucide-react"
import { useEffect } from "react"
import { useInView } from "react-intersection-observer"

const fetchProjects = async ({ pageParam = null }) => {
  const { data } = await axios.get(`/api/matchmaking?cursor=${pageParam || ""}`)
  return data
}

export default function MatchmakingFeed() {
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["matchmaking-feed"],
    queryFn: fetchProjects,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gro" />
        <p className="text-muted text-sm font-bold uppercase tracking-widest">Cargando Colaboraciones...</p>
      </div>
    )
  }

  if (status === "error") {
    return <div className="text-center py-20 text-red-500">Error al cargar proyectos.</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Rocket className="w-6 h-6 text-accent-gro" />
        <h2 className="text-2xl font-black">Proyectos de Colaboración</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.pages.map((page) =>
          page.projects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>

      <div ref={ref} className="py-10 flex justify-center">
        {isFetchingNextPage ? (
          <Loader2 className="w-6 h-6 animate-spin text-accent-gro" />
        ) : hasNextPage ? (
          <span className="text-xs text-muted font-bold uppercase">Desliza para cargar más</span>
        ) : (
          <span className="text-xs text-muted font-bold uppercase">Has llegado al final</span>
        )}
      </div>
    </div>
  )
}
