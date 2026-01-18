"use client"

import { IconPlayerPlay, IconPlayerPause, IconPlayerSkipBack, IconPlayerSkipForward } from "@tabler/icons-react"
import { RefObject } from "react"

interface PlaybackControlsProps {
  currentTime: number
  totalDuration: number
  isPlaying: boolean
  isVideoFile: boolean
  togglePlayPause: () => void
  jumpToTimestamp: (time: number) => void
  formatTime: (seconds: number) => string
  videoRef: RefObject<HTMLVideoElement | null>
  audioRef: RefObject<HTMLAudioElement | null>
}

export function PlaybackControls({
  currentTime,
  totalDuration,
  isPlaying,
  isVideoFile,
  togglePlayPause,
  jumpToTimestamp,
  formatTime,
  videoRef,
  audioRef
}: PlaybackControlsProps) {
  const seek = (seconds: number) => {
    const media = videoRef.current || audioRef.current
    if (media) {
      media.currentTime = Math.max(0, Math.min(totalDuration, media.currentTime + seconds))
    }
  }

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    jumpToTimestamp(percentage * totalDuration)
  }

  return (
    <div className="sticky bottom-0 bg-background-2 dark:bg-background border-t px-6 py-3 z-40">
      <div className="flex items-center gap-4 max-w-4xl mx-auto">
        <span className="text-sm text-muted-foreground w-12">{formatTime(currentTime)}</span>
        
        <div className="flex items-center gap-2">
          <button onClick={() => seek(-10)} className="p-1 hover:bg-gray-100 rounded">
            <IconPlayerSkipBack className="h-5 w-5" />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground transition-colors"
          >
            {isPlaying ? <IconPlayerPause className="h-5 w-5" /> : <IconPlayerPlay className="h-5 w-5" />}
          </button>
          
          <button onClick={() => seek(10)} className="p-1 hover:bg-gray-100 rounded">
            <IconPlayerSkipForward className="h-5 w-5" />
          </button>
        </div>

        <div 
          className="flex-1 h-1.5 bg-gray-100 rounded-full relative cursor-pointer group"
          onClick={handleProgressBarClick}
        >
          <div 
            className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all"
            style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full border-2 border-white shadow scale-0 group-hover:scale-100 transition-transform"
            style={{ left: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
          />
        </div>

        <span className="text-sm text-muted-foreground w-12 text-right">{formatTime(totalDuration)}</span>
      </div>
    </div>
  )
}
