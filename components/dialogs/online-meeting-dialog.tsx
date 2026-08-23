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

function isValidGoogleMeetUrl(urlStr: string): boolean {
  if (!urlStr || !urlStr.trim()) return false;
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname !== 'meet.google.com') return false;
    const cleanPath = parsed.pathname.replace(/^\/+/, '');
    return cleanPath.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(cleanPath);
  } catch {
    return false;
  }
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
    
    if (!meetingLink.trim()) {
      toast.error("Tempel tautan Google Meet terlebih dahulu.")
      return
    }

    if (!isValidGoogleMeetUrl(meetingLink)) {
      toast.error("Tautan tidak valid. Gunakan format resmi https://meet.google.com/xxx-xxxx-xxx")
      return
    }

    if (!isReady) {
      toast.error("Silakan masuk terlebih dahulu untuk menggunakan fitur bot meeting.")
      return
    }

    setIsLoading(true)
    try {
      const response = await api.createOnlineMeeting({
        title: meetingName.trim() || "Online Meeting",
        meetingLink: meetingLink.trim(),
        platform: 'Google Meet',
      })
      
      const newMeetingId = response.data?.meeting?._id || response.meeting?._id
      if (response.success && response.botStarted !== false && newMeetingId) {
        setActiveMeetingId(newMeetingId)
        toast.success("Notu berhasil bergabung dengan Google Meet.")
        setMode('live')
      } else {
        throw new Error(response.message || "Layanan bot tidak dapat bergabung ke meeting.")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghubungkan Notu ke meeting"
      console.error("Error creating online meeting:", error)
      toast.error(message)
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
      <DialogContent className="overflow-hidden border-[var(--border)] p-0 sm:max-w-[650px]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28" style={{ background: "radial-gradient(ellipse at 78% 0%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 68%)" }} />
        <div className="relative p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-[-0.025em]">
            {mode === 'live' ? "Notu sedang mengikuti meeting" : "Undang Notu ke meeting"}
          </DialogTitle>
          <DialogDescription>
            {mode === 'live' 
              ? "Pantau percakapan secara live di sini, atau buka halaman status kapan saja."
              : "Tempel link Google Meet Anda. Notu akan bergabung dan membantu mencatat percakapan."}
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
                Tempel link Google Meet Anda di bawah ini.
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
              className="h-11 w-full bg-[var(--primary)] text-[var(--primary-foreground)] transition-[background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[color-mix(in_oklch,var(--primary)_90%,black)] motion-reduce:transition-none"
              disabled={isLoading || !isReady}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mohon tunggu, Notu sedang bergabung dengan meeting...
                </>
              ) : (
                "Kirim Notu ke meeting"
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
                Tutup
              </Button>
              <Button onClick={handleGoToDetails}>
                <IconExternalLink className="mr-2 h-4 w-4" />
                Buka status meeting
              </Button>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
