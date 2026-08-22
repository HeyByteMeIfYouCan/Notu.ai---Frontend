"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { IconVideo, IconLoader2, IconBrandGoogleMeet, IconBrandZoom, IconBrandTeams, IconRobot } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface JoinMeetingModalProps {
  trigger?: React.ReactNode
  onSuccess?: (meetingId: string) => void
}

type Platform = "google_meet" | "zoom" | "teams" | "other"

const platformIcons: Record<Platform, React.ReactNode> = {
  google_meet: <IconBrandGoogleMeet className="h-5 w-5 text-green-500" />,
  zoom: <IconBrandZoom className="h-5 w-5 text-blue-500" />,
  teams: <IconBrandTeams className="h-5 w-5 text-purple-500" />,
  other: <IconVideo className="h-5 w-5 text-gray-500" />,
}

const platformNames: Record<Platform, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  teams: "Microsoft Teams",
  other: "Lainnya",
}

function detectPlatform(url: string): Platform {
  if (url.includes("meet.google.com")) return "google_meet"
  if (url.includes("zoom.us")) return "zoom"
  if (url.includes("teams.microsoft") || url.includes("teams.live")) return "teams"
  return "other"
}

function isValidMeetingUrl(url: string): boolean {
  try {
    new URL(url)
    return url.includes("meet.google.com") || 
           url.includes("zoom.us") || 
           url.includes("teams.microsoft") ||
           url.includes("teams.live")
  } catch {
    return false
  }
}

export function JoinMeetingModal({ trigger, onSuccess }: JoinMeetingModalProps) {
  const { api, isReady } = useApiWithAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [meetingUrl, setMeetingUrl] = useState("")
  const [title, setTitle] = useState("")
  const [duration, setDuration] = useState(60)
  const [isLoading, setIsLoading] = useState(false)

  const platform = meetingUrl ? detectPlatform(meetingUrl) : null
  const isValidUrl = meetingUrl ? isValidMeetingUrl(meetingUrl) : false
  const isGoogleMeet = platform === "google_meet"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isReady) {
      toast.error("Belum siap, silakan coba lagi")
      return
    }

    if (!isValidUrl) {
      toast.error("URL meeting tidak valid")
      return
    }

    if (!isGoogleMeet) {
      toast.error("Saat ini hanya mendukung Google Meet")
      return
    }

    if (!title.trim()) {
      toast.error("Judul meeting harus diisi")
      return
    }

    setIsLoading(true)

    try {
      const response = await api.createOnlineMeeting({
        title: title.trim(),
        meetingLink: meetingUrl.trim(),
        platform: platform,
        duration: duration,
      })

      toast.success("Bot sedang bergabung ke meeting...")
      setOpen(false)
      
      // Reset form
      setMeetingUrl("")
      setTitle("")
      setDuration(60)

      // Navigate to meeting page
      if (response.data?.meeting?._id) {
        onSuccess?.(response.data.meeting._id)
        router.push(`/dashboard/meeting/${response.data.meeting._id}`)
      }
    } catch (error: any) {
      console.error("Failed to join meeting:", error)
      toast.error(error.message || "Gagal bergabung ke meeting")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <IconRobot className="h-4 w-4" />
            Join Online Meeting
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconRobot className="h-5 w-5 text-primary" />
            Join Online Meeting dengan Bot
          </DialogTitle>
          <DialogDescription>
            Masukkan link meeting dan bot akan bergabung untuk merekam dan mentranskrip secara otomatis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul Meeting</Label>
            <Input
              id="title"
              placeholder="Contoh: Standup Meeting Tim Engineering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Meeting URL */}
          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Link Meeting</Label>
            <div className="relative">
              <Input
                id="meetingUrl"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                disabled={isLoading}
                className="pr-24"
              />
              {platform && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {platformIcons[platform]}
                  <span className="text-xs text-muted-foreground">
                    {platformNames[platform]}
                  </span>
                </div>
              )}
            </div>
            {meetingUrl && !isValidUrl && (
              <p className="text-xs text-destructive">URL tidak valid</p>
            )}
            {platform && !isGoogleMeet && (
              <p className="text-xs text-amber-500">
                ⚠️ Saat ini hanya Google Meet yang didukung
              </p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Durasi Maksimal (menit)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              max={180}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Bot akan otomatis keluar setelah durasi ini
            </p>
          </div>

          {/* Platform Support Badge */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <IconBrandGoogleMeet className="h-3 w-3" />
              Google Meet ✓
            </Badge>
            <Badge variant="outline" className="gap-1 opacity-50">
              <IconBrandZoom className="h-3 w-3" />
              Zoom (segera)
            </Badge>
            <Badge variant="outline" className="gap-1 opacity-50">
              <IconBrandTeams className="h-3 w-3" />
              Teams (segera)
            </Badge>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isValidUrl || !isGoogleMeet || !title.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Memulai Bot...
                </>
              ) : (
                <>
                  <IconRobot className="h-4 w-4" />
                  Join dengan Bot
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
