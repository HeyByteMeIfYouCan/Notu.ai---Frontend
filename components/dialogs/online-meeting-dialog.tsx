import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IconCopy, IconLoader2, IconExternalLink } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BotLiveTranscript } from "@/components/custom/BotLiveTranscript"

interface OnlineMeetingDialogProps {
  isOpen: boolean
  onClose: () => void
  meetingId?: string | null  // Optional: for reopening existing meeting
}

export function OnlineMeetingDialog({ isOpen, onClose, meetingId }: OnlineMeetingDialogProps) {
  const [meetingName, setMeetingName] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // 'input' = enter details, 'live' = show transcript
  const [mode, setMode] = useState<'input' | 'live'>('input')
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)
  
  const { api, isReady } = useApiWithAuth()
  const router = useRouter()

  // Auto-switch to live mode if reopen with meeting ID
  useEffect(() => {
    if (isOpen && meetingId) {
      setActiveMeetingId(meetingId)
      setMode('live')
    } else if (isOpen && !meetingId) {
      // Reset to input mode for new meeting
      setMode('input')
      setActiveMeetingId(null)
    }
  }, [isOpen, meetingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!meetingLink) {
      toast.error("Silahkan masukkan link meeting")
      return
    }

    if (!isReady) {
      toast.error("Silahkan login terlebih dahulu")
      return
    }

    setIsLoading(true)
    try {
      const response = await api.createOnlineMeeting({
        title: meetingName || "Online Meeting",
        meetingLink: meetingLink,
        platform: 'Google Meet',
      })
      
      const newMeetingId = response.data?.meeting?._id || response.meeting?._id
      if (newMeetingId) {
        setActiveMeetingId(newMeetingId)
        toast.success("Bot berhasil dikirim ke meeting!")
        setMode('live')
        // Do NOT redirect immediately; let user watch live or navigate manually
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error: any) {
      console.error("Error creating online meeting:", error)
      toast.error(error.message || error.response?.data?.error || "Gagal mengirim bot ke meeting")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      if (mode === 'live') {
        // Reset state when closing live view
        setMode('input')
        setActiveMeetingId(null)
        setMeetingName("")
        setMeetingLink("")
      }
      onClose()
    }
  }

  const handleGoToDetails = () => {
    if (activeMeetingId) {
      onClose()
      router.push(`/dashboard/status-meeting?id=${activeMeetingId}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'live' ? "Live Meeting" : "Take Notes From Online Meeting"}
          </DialogTitle>
          <DialogDescription>
            {mode === 'live' 
              ? "Bot is active. You can monitor the transcript here or go to the dashboard." 
              : "Using Online Bot For Google Meet"}
          </DialogDescription>
        </DialogHeader>

        {mode === 'input' ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Input
                placeholder="Nama meeting (opsional)"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Paste URL Google Meet anda disini
              </p>
              <div className="relative">
                <Input
                  placeholder="Meeting link"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => navigator.clipboard.writeText(meetingLink)}
                  type="button"
                  disabled={isLoading}
                >
                  <IconCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[var(--primary)] hover:brightness-90 text-[var(--primary-foreground)]"
              disabled={isLoading || !isReady}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim Bot...
                </>
              ) : (
                "Mulai"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {activeMeetingId && (
              <BotLiveTranscript 
                meetingId={activeMeetingId}
                onComplete={() => {
                  toast.success("Meeting selesai processed")
                }}
              />
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleGoToDetails}>
                <IconExternalLink className="mr-2 h-4 w-4" />
                Go to Details
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
