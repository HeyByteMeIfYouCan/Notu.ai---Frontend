import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IconCopy, IconLoader2, IconExternalLink, IconVideo, IconSparkles } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BotLiveTranscript } from "@/components/custom/BotLiveTranscript"

const NOTU_GOOGLE_ACCOUNT = "lontongrebus3@gmail.com"

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
        toast.success("Notu sedang menuju meeting. Jika belum diundang, host perlu menerima permintaan masuknya.", {
          id: `bot-meeting-${newMeetingId}`,
        })
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
      <DialogContent className="overflow-hidden border-border p-0 sm:max-w-[500px]">
        {mode === 'input' ? (
          <>
            <div className="p-6 pb-4">
              <DialogHeader className="mb-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <IconVideo className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-center text-xl font-semibold tracking-tight">
                  Undang Notu ke meeting
                </DialogTitle>
                <DialogDescription className="text-center mt-1.5 text-sm text-muted-foreground">
                  Tempel link Google Meet Anda. Notu akan bergabung dan mencatat percakapan otomatis.
                </DialogDescription>
              </DialogHeader>

              <div className="mb-6 rounded-lg bg-primary/5 p-4 border border-primary/10">
                <div className="flex items-start gap-3 text-sm text-primary/80">
                  <IconSparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="leading-relaxed font-medium">Notu akan hadir sebagai pencatat meeting, membuat transkrip secara real-time, dan menyiapkan ringkasan untuk Anda.</p>
                </div>
              </div>

              <form id="online-meeting-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Nama meeting
                  </label>
                  <Input
                    placeholder="Contoh: Sync Mingguan (Opsional)"
                    value={meetingName}
                    onChange={(e) => setMeetingName(e.target.value)}
                    disabled={isLoading}
                    className="h-10"
                  />
                </div>

                <div className="rounded-lg border border-border bg-muted/45 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">Akun Google Notu</p>
                      <code className="block truncate text-xs text-muted-foreground">{NOTU_GOOGLE_ACCOUNT}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      className="h-8 shrink-0 px-2 text-xs"
                      onClick={async () => {
                        await navigator.clipboard.writeText(NOTU_GOOGLE_ACCOUNT)
                        toast.success("Email akun Notu sudah disalin.")
                      }}
                      disabled={isLoading}
                    >
                      <IconCopy className="mr-1.5 h-3.5 w-3.5" />
                      Salin email
                    </Button>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Opsional: undang akun ini lewat Google Calendar jika meeting dimulai tanpa host.
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Tautan Google Meet
                  </label>
                  <div className="relative">
                    <img 
                      src="/google-meet.png" 
                      alt="Google Meet" 
                      className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 object-contain" 
                    />
                    <Input
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      disabled={isLoading}
                      required
                      className="h-10 pl-9 pr-10"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => navigator.clipboard.writeText(meetingLink)}
                      type="button"
                      disabled={isLoading}
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="h-10 px-6">
                Batal
              </Button>
              <Button 
                form="online-meeting-form"
                type="submit" 
                className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none"
                disabled={isLoading || !isReady}
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bergabung...
                  </>
                ) : (
                  "Hubungkan Notu"
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <IconSparkles className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-xl font-semibold tracking-tight">
                Notu sedang mengikuti meeting
              </DialogTitle>
              <DialogDescription className="text-center mt-1.5 text-sm text-muted-foreground">
                Pantau percakapan secara live di sini, atau buka halaman status kapan saja.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {activeMeetingId && (
                <BotLiveTranscript
                  meetingId={activeMeetingId}
                />
              )}
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
                <Button variant="outline" onClick={handleClose} className="h-10 px-4">
                  Tutup
                </Button>
                <Button onClick={handleGoToDetails} className="h-10 px-4 shadow-none">
                  <IconExternalLink className="mr-2 h-4 w-4" />
                  Buka status meeting
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
