"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"

export default function JoinBoardPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = params
  const { api, isReady } = useApiWithAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isReady && token) {
      const join = async () => {
        try {
          const res = await api.joinBoard(token as string)
          toast.success("Berhasil bergabung dengan board")
          router.push(`/dashboard/kanban/${res.data.boardId}`)
        } catch (err: any) {
          console.error(err)
          setError(err.message || "Gagal bergabung dengan board")
          toast.error("Gagal bergabung")
        }
      }
      join()
    }
  }, [isReady, token, api, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        {!error ? (
          <>
            <IconLoader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
            <h1 className="text-xl font-semibold">Sedang bergabung ke Board...</h1>
            <p className="text-muted-foreground">Mohon tunggu sebentar.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-600">Terjadi Kesalahan</h1>
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
