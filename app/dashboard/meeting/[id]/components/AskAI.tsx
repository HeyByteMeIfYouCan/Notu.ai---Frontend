"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconSend, IconLoader2, IconTrash, IconRobot, IconUser } from "@tabler/icons-react"
import { toast } from "sonner"
import { useApiWithAuth, useAuth } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/permissions"

interface ChatMessage {
  _id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  userId?: {
    name: string
    image?: string
  }
}

interface AskAIProps {
  meetingId: string
  userRole?: string
}

export function AskAI({ meetingId, userRole }: AskAIProps) {
  const { api, isReady } = useApiWithAuth()
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingHistory, setIsFetchingHistory] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const canClearHistory = hasPermission(userRole, 'canManageCollaborators')

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isReady || !meetingId) return
      try {
        setIsFetchingHistory(true)
        const response = await api.getChatHistory(meetingId)
        if (response.success && response.data) {
          setMessages(response.data)
        }
      } catch (error) {
        console.error("Error fetching chat history:", error)
      } finally {
        setIsFetchingHistory(false)
      }
    }
    fetchHistory()
  }, [isReady, meetingId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const question = input.trim()
    if (!question || isLoading) return

    setInput("")
    setIsLoading(true)

    // Optimistic update - add user message immediately
    const tempUserMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
      userId: { name: user?.name || 'You' }
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      const response = await api.askAI(meetingId, question)
      if (response.success && response.data) {
        // Replace temp message and add AI response
        setMessages(prev => {
          const filtered = prev.filter(m => m._id !== tempUserMsg._id)
          return [
            ...filtered,
            { ...tempUserMsg, _id: `user-${Date.now()}` },
            {
              _id: response.data.messageId,
              role: 'assistant',
              content: response.data.answer,
              createdAt: new Date().toISOString(),
            }
          ]
        })
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mendapatkan jawaban dari AI")
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id))
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [input, isLoading, meetingId, api, user])

  const handleClearHistory = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus semua riwayat chat?")) return
    
    try {
      await api.clearChatHistory(meetingId)
      setMessages([])
      toast.success("Riwayat chat telah dihapus")
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus riwayat chat")
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  if (isFetchingHistory) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat riwayat chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <IconRobot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Ask AI</h3>
        </div>
        {canClearHistory && messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleClearHistory}
          >
            <IconTrash className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <IconRobot className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-medium mb-2">Tanya AI tentang rapat ini</h4>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ajukan pertanyaan tentang ringkasan, poin-poin penting, atau action items dari rapat ini.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["Apa kesimpulan rapat?", "Siapa yang paling banyak bicara?", "Apa action items utama?"].map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setInput(q)
                    inputRef.current?.focus()
                  }}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconRobot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block ${
                    msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    {user?.image ? (
                      <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <IconUser className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconRobot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI sedang berpikir...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pertanyaan..."
            disabled={isLoading}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconSend className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
