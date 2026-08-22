"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, useCallback } from "react"
import api from "@/lib/api"

interface User {
  id: string
  email: string
  name: string
  image?: string
  plan: string
}

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false)
    }
  }, [status])

  const user: User | null = useMemo(() => session?.user ? {
    id: (session.user as any).id || "",
    email: session.user.email || "",
    name: session.user.name || "",
    image: session.user.image || undefined,
    plan: (session.user as any).plan || "free",
  } : null, [session])

  const backendToken = (session as any)?.backendToken as string | undefined

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/login" })
  }, [])

  const requireAuth = () => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }

  return {
    user,
    session,
    status,
    isLoading,
    isAuthenticated: status === "authenticated",
    backendToken,
    logout,
    requireAuth,
  }
}

interface AuthApi {
  getMeetings: (params?: { page?: number; limit?: number; status?: string; search?: string; filter?: string }) => Promise<any>
  getMeeting: (id: string) => Promise<any>
  getMeetingAnalytics: (id: string) => Promise<any>
  getMeetingStatus: (id: string) => Promise<any>
  getMeetingStats: () => Promise<any>
  createMeeting: (data: any) => Promise<any>
  createOnlineMeeting: (data: { title: string; meetingLink: string; platform?: string; duration?: number }) => Promise<any>
  updateMeeting: (id: string, data: any) => Promise<any>
  deleteMeeting: (id: string) => Promise<any>
  deleteBoard: (id: string) => Promise<any>
  retryTranscription: (id: string) => Promise<any>
  regenerateAiNotes: (id: string) => Promise<any>
  exportTranscript: (id: string, format: string) => Promise<any>
  generateMeetingShareLink: (id: string) => Promise<any>
  joinMeeting: (shareToken: string) => Promise<any>
  revokeMeetingShareLink: (id: string) => Promise<any>
  updateMeetingCollaboratorRole: (id: string, userId: string, role: string) => Promise<any>
  removeMeetingCollaborator: (id: string, userId: string) => Promise<any>
  updateSpeakerName: (id: string, data: { oldSpeakerName: string; newSpeakerName: string; segmentIndex?: number; applyToAll: boolean }) => Promise<any>
  // Pin Meetings
  toggleMeetingPin: (id: string) => Promise<any>
  getPinnedMeetings: () => Promise<any>
  // Pin Boards
  toggleBoardPin: (id: string) => Promise<any>
  getPinnedBoards: () => Promise<any>
  // Ask AI
  askAI: (meetingId: string, question: string) => Promise<any>
  getChatHistory: (meetingId: string, limit?: number) => Promise<any>
  clearChatHistory: (meetingId: string) => Promise<any>
  // Tasks
  getTasks: (params?: { status?: string; priority?: string; meetingId?: string }) => Promise<any>
  getKanbanTasks: (boardId?: string) => Promise<any>
  getTask: (id: string) => Promise<any>
  createTask: (data: any) => Promise<any>
  updateTask: (id: string, data: any) => Promise<any>
  deleteTask: (id: string) => Promise<any>
  reorderTasks: (tasks: any[], boardId?: string) => Promise<any>
  getStats: () => Promise<any>
  getTrends: (period?: string) => Promise<any>
  getPlatformStats: () => Promise<any>
  getRecentActivity: (limit?: number) => Promise<any>
  uploadFile: (file: File, metadata?: any, onProgress?: (progress: number) => void) => Promise<any>
  getProfile: () => Promise<any>
  updateProfile: (data: { name?: string; preferences?: any }) => Promise<any>
  getBoards: (params?: { filter?: string; meetingId?: string; search?: string; page?: number; limit?: number; source?: string }) => Promise<any>
  getBoard: (id: string) => Promise<any>
  updateBoard: (id: string, data: any) => Promise<any>
  createBoardFromMeeting: (meetingId: string) => Promise<any>
  createBoard: (data: { title: string; description?: string; source?: string }) => Promise<any>
  generateBoardShareLink: (id: string) => Promise<any>
  joinBoard: (shareToken: string) => Promise<any>
  revokeBoardShareLink: (id: string) => Promise<any>
  updateBoardCollaboratorRole: (id: string, userId: string, role: string) => Promise<any>
  removeBoardCollaborator: (id: string, userId: string) => Promise<any>
  // Extended Analytics
  getGlobalAnalytics: () => Promise<any>
  getDetailAnalyticsList: (params?: { page?: number; limit?: number; sortBy?: string; filter?: string; search?: string }) => Promise<any>
  getMeetingDetailAnalytics: (meetingId: string) => Promise<any>
  stopBotSession: (id: string, reason?: string) => Promise<any>
  finalizeBotMeeting: (id: string, options?: any) => Promise<any>
}

export function useApiWithAuth() {
  const { user, backendToken, logout } = useAuth()

  const guard = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    try {
      return await promise
    } catch (error: any) {
      if (error?.message === "Token expired. Please login again." || error?.response?.status === 401 || error?.response?.status === 403) {
        await logout()
      }
      throw error // Re-throw to let components handle other errors if needed
    }
  }, [logout])

  const apiWithToken = useMemo(() => ({
    // Meetings
    getMeetings: (params?: { page?: number; limit?: number; status?: string; search?: string; filter?: string }) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getMeetings(backendToken, params))
    },
    getMeeting: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getMeeting(backendToken, id))
    },
    getMeetingAnalytics: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getMeetingAnalytics(backendToken, id))
    },
    getMeetingStatus: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getMeetingStatus(backendToken, id))
    },
    getMeetingStats: () => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getMeetingStats(backendToken))
    },
    createMeeting: (data: any) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.createMeeting(backendToken, data))
    },
    createOnlineMeeting: (data: { title: string; meetingLink: string; platform?: string; duration?: number }) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.createOnlineMeeting(backendToken, data))
    },
    updateMeeting: (id: string, data: any) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.updateMeeting(backendToken, id, data))
    },
    deleteMeeting: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.deleteMeeting(backendToken, id))
    },
    retryTranscription: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.retryTranscription(backendToken, id))
    },
    regenerateAiNotes: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.regenerateAiNotes(backendToken, id))
    },
    exportTranscript: (id: string, format: 'json' | 'txt' | 'srt' | 'vtt') => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.exportTranscript(backendToken, id, format))
    },
    generateMeetingShareLink: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.generateMeetingShareLink(backendToken, id))
    },
    joinMeeting: (shareToken: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.joinMeeting(backendToken, shareToken))
    },
    revokeMeetingShareLink: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.revokeMeetingShareLink(backendToken, id))
    },
    updateMeetingCollaboratorRole: (id: string, userId: string, role: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.updateMeetingCollaboratorRole(backendToken, id, userId, role))
    },
    removeMeetingCollaborator: (id: string, userId: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.removeMeetingCollaborator(backendToken, id, userId))
    },
    updateSpeakerName: (id: string, data: any) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.updateSpeakerName(backendToken, id, data))
    },

    // Pin Meetings
    toggleMeetingPin: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.toggleMeetingPin(backendToken, id))
    },
    getPinnedMeetings: () => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getPinnedMeetings(backendToken))
    },

    // Pin Boards
    toggleBoardPin: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.toggleBoardPin(backendToken, id))
    },
    getPinnedBoards: () => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getPinnedBoards(backendToken))
    },

    // Ask AI - Chat
    askAI: (meetingId: string, question: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.askAI(backendToken, meetingId, question))
    },
    getChatHistory: (meetingId: string, limit?: number) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getChatHistory(backendToken, meetingId, limit))
    },
    clearChatHistory: (meetingId: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.clearChatHistory(backendToken, meetingId))
    },

    // Tasks
    getTasks: (params?: { status?: string; priority?: string; meetingId?: string }) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getTasks(backendToken, params))
    },
    getKanbanTasks: (boardId?: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getKanbanTasks(backendToken, boardId))
    },
    getTask: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getTask(backendToken, id))
    },
    createTask: (data: any) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.createTask(backendToken, data))
    },
    updateTask: (id: string, data: any) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.updateTask(backendToken, id, data))
    },
    deleteTask: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.deleteTask(backendToken, id))
    },
    reorderTasks: (tasks: any[], boardId?: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.reorderTasks(backendToken, tasks, boardId))
    },

    // Analytics
    getStats: () => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getStats(backendToken))
    },
    getTrends: (period?: '7d' | '30d' | '90d') => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getTrends(backendToken, period))
    },
    getPlatformStats: () => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getPlatformStats(backendToken))
    },
    getRecentActivity: (limit?: number) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getRecentActivity(backendToken, limit))
    },

    // Upload
    uploadFile: (file: File, metadata?: any, onProgress?: (progress: number) => void) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.uploadFile(backendToken, file, metadata, onProgress))
    },

    // Profile
    getProfile: () => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getProfile(backendToken))
    },
    updateProfile: (data: { name?: string; preferences?: any }) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.updateProfile(backendToken, data))
    },
    // Boards
    getBoards: (params?: { filter?: string; meetingId?: string; search?: string; page?: number; limit?: number; source?: string }) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getBoards(backendToken, params))
    },
    getBoard: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getBoard(backendToken, id))
    },
    updateBoard: (id: string, data: any) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.updateBoard(backendToken, id, data))
    },
    createBoardFromMeeting: (meetingId: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.createBoardFromMeeting(backendToken, meetingId))
    },
    createBoard: (data: any) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.createBoard(backendToken, data))
    },
    generateBoardShareLink: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.generateBoardShareLink(backendToken, id))
    },
    joinBoard: (shareToken: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.joinBoard(backendToken, shareToken))
    },
    revokeBoardShareLink: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.revokeBoardShareLink(backendToken, id))
    },
    updateBoardCollaboratorRole: (id: string, userId: string, role: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.updateBoardCollaboratorRole(backendToken, id, userId, role))
    },
    removeBoardCollaborator: (id: string, userId: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.removeBoardCollaborator(backendToken, id, userId))
    },
    deleteBoard: (id: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.deleteBoard(backendToken, id))
    },

    // Extended Analytics
    getGlobalAnalytics: () => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getGlobalAnalytics(backendToken))
    },
    getDetailAnalyticsList: (params?: { page?: number; limit?: number; sortBy?: string; filter?: string; search?: string }) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getDetailAnalyticsList(backendToken, params))
    },
    getMeetingDetailAnalytics: (meetingId: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.getMeetingDetailAnalytics(backendToken, meetingId))
    },
    stopBotSession: (id: string, reason?: string) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.stopBotSession(backendToken, id, reason))
    },
    finalizeBotMeeting: (id: string, options?: any) => {
      if (!backendToken) throw new Error("Not authenticated")
      return guard(api.finalizeBotMeeting(backendToken, id, options))
    },
  }) as AuthApi, [backendToken, guard])

  return {
    api: apiWithToken,
    isReady: !!backendToken,
    user,
  }
}
