"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useState, useCallback, useEffect, useRef } from "react"
import { useRealtimeTranscription, FinalTranscriptResult } from "@/hooks/use-realtime-transcription"
import { 
  Mic, 
  MicOff, 
  Square, 
  Pause, 
  Play, 
  Loader2, 
  AlertCircle, 
  Check, 
  Lock,
  X,
  Volume2,
  Users,
  Clock,
  Sparkles
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface RealtimeMeetingDialogProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: (result: FinalTranscriptResult, meetingName: string) => void
}

export function RealtimeMeetingDialog({ isOpen, onClose, onComplete }: RealtimeMeetingDialogProps) {
  const [meetingName, setMeetingName] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [finalResult, setFinalResult] = useState<FinalTranscriptResult | null>(null)
  const [processingMessage, setProcessingMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [savedMeetingId, setSavedMeetingId] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { backendToken } = useAuth()
  const router = useRouter()

  // Auto-scroll preview text to bottom
  useEffect(() => {
    if (scrollRef.current && previewText) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [previewText]);

  const handlePreviewUpdate = useCallback((text: string) => {
    setPreviewText(prev => {
      const combined = prev + " " + text;
      return combined.slice(-1500).trim();
    });
  }, []);

  const handleAccumulatedUpdate = useCallback((text: string) => {
    setPreviewText(text);
  }, []);

  const handleFinalResult = useCallback((result: FinalTranscriptResult) => {
    setFinalResult(result);
    onComplete?.(result, meetingName);
  }, [meetingName, onComplete]);

  const handleProcessing = useCallback((message: string) => {
    setProcessingMessage(message);
  }, []);

  const {
    isRecording,
    isPaused,
    isProcessingFinal,
    sessionId,
    formattedDuration,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    resetState,
  } = useRealtimeTranscription({
    onPreviewUpdate: handlePreviewUpdate,
    onAccumulatedUpdate: handleAccumulatedUpdate,
    onFinalResult: handleFinalResult,
    onProcessing: handleProcessing,
    previewIntervalMs: 5000,
  });

  // Simulate audio level animation when recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isRecording, isPaused]);

  // Check if popup should be locked (during recording or processing)
  const isLocked = isRecording || isProcessingFinal;

  const handleStart = async () => {
    setPreviewText("");
    setFinalResult(null);
    setProcessingMessage("");
    setSavedMeetingId(null);
    await startRecording(meetingName || "Realtime Meeting");
  };

  const handleStop = async () => {
    await stopRecording({
      enableAiNotes: true,
    });
  };

  const handleSaveAndClose = async () => {
    if (!finalResult) {
      toast.error('No transcription result available');
      return;
    }
    
    if (!backendToken) {
      toast.error('Please login to save meeting');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('[RealtimeDialog] Saving meeting...', {
        title: meetingName || 'Realtime Meeting',
        sessionId: finalResult.sessionId,
        transcriptLength: finalResult.transcript?.length,
        segmentsCount: finalResult.segments?.length,
        hasAudio: !!finalResult.audioBlob,
        audioSize: finalResult.audioBlob?.size,
        hasAiNotes: !!finalResult.aiNotes,
        aiNotesSummaryLen: finalResult.aiNotes?.summary?.length,
      });
      
      const response = await api.createRealtimeMeeting(backendToken, {
        title: meetingName || `Realtime Meeting - ${new Date().toLocaleDateString('id-ID')}`,
        sessionId: finalResult.sessionId,
        transcript: finalResult.transcript,
        segments: finalResult.segments,
        speakers: finalResult.speakers,
        numSpeakers: finalResult.numSpeakers,
        duration: finalResult.duration,
        language: 'id',
        aiNotes: finalResult.aiNotes,
        processingTime: finalResult.processingTime,
        audioBlob: finalResult.audioBlob, // Include audio blob for storage
      });
      
      console.log('[RealtimeDialog] Save response:', response);
      
      if (response.success && response.data) {
        setSavedMeetingId(response.data.id);
        toast.success('Meeting saved successfully!');
        handleClose();
        router.push(`/dashboard/meeting/${response.data.id}`);
      } else {
        throw new Error(response.message || response.error || 'Failed to save meeting');
      }
    } catch (err: any) {
      console.error('[RealtimeDialog] Failed to save meeting:', err);
      toast.error(err.message || 'Failed to save meeting. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      cancelRecording();
    }
    resetState();
    setMeetingName("");
    setPreviewText("");
    setFinalResult(null);
    setProcessingMessage("");
    setSavedMeetingId(null);
    onClose();
  };

  const handleNewRecording = () => {
    resetState();
    setPreviewText("");
    setFinalResult(null);
    setProcessingMessage("");
    setSavedMeetingId(null);
  };

  // Handle dialog open change - prevent closing when locked
  const handleOpenChange = (open: boolean) => {
    if (!open && isLocked) {
      // Prevent closing - show toast notification
      toast.warning("Recording in progress. Stop recording first to close.", {
        duration: 2000,
      });
      return;
    }
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[650px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden",
          "transition-all duration-300 ease-in-out",
          isLocked && "ring-2 ring-primary/50 shadow-lg shadow-primary/20"
        )}
        onPointerDownOutside={(e) => {
          if (isLocked) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isLocked) {
            e.preventDefault();
            toast.warning("Recording in progress. Stop recording first to close.", {
              duration: 2000,
            });
          }
        }}
        onInteractOutside={(e) => {
          if (isLocked) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <div className={cn(
          "px-6 py-4 border-b transition-colors duration-300",
          isLocked ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30" : "bg-background"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full transition-all duration-300",
                isRecording && !isPaused 
                  ? "bg-primary text-primary-foreground animate-pulse" 
                  : isPaused 
                    ? "bg-amber-500 text-white"
                    : isProcessingFinal
                      ? "bg-primary/80 text-primary-foreground"
                      : "bg-muted"
              )}>
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Realtime Transcription
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {isLocked ? (
                    <span className="flex items-center gap-1 text-primary dark:text-primary">
                      <Lock className="h-3 w-3" />
                      Session in progress - locked
                    </span>
                  ) : (
                    "Record and transcribe live audio"
                  )}
                </DialogDescription>
              </div>
            </div>
            
            {/* Close button - disabled when locked */}
            {/* {!isLocked && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )} */}
            {isLocked && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Locked</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-6 gap-4">
          {/* Meeting Name Input - Only show before recording */}
          {!isRecording && !isProcessingFinal && !finalResult && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-medium text-muted-foreground">
                Meeting Name
              </label>
              <Input
                placeholder="Enter meeting name (optional)"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                className="h-11"
              />
            </div>
          )}

          {/* Timer & Status Display */}
          <div className={cn(
            "flex flex-col items-center justify-center py-6 rounded-xl transition-all duration-300",
            isRecording && !isPaused 
              ? "bg-gradient-to-b from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10" 
              : isPaused 
                ? "bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/20"
                : isProcessingFinal
                  ? "bg-gradient-to-b from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/15"
                  : finalResult
                    ? "bg-gradient-to-b from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/20"
                    : "bg-muted/30"
          )}>
            {/* Audio Visualizer */}
            {isRecording && !isPaused && (
              <div className="flex items-end gap-1 h-8 mb-3">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full transition-all duration-150"
                    style={{
                      height: `${Math.max(4, Math.sin((i + audioLevel / 10) * 0.5) * 20 + audioLevel * 0.2 + 8)}px`,
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Timer */}
            <div className={cn(
              "text-6xl font-mono tabular-nums font-bold tracking-tight transition-colors duration-300",
              isRecording && !isPaused 
                ? "text-primary" 
                : isPaused 
                  ? "text-amber-600 dark:text-amber-500"
                  : isProcessingFinal
                    ? "text-primary/80"
                    : finalResult
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-muted-foreground"
            )}>
              {formattedDuration}
            </div>

            {/* Status Badge */}
            <div className="mt-3 flex items-center gap-2">
              {isRecording && !isPaused && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-primary-foreground" />
                  Recording
                </div>
              )}
              {isPaused && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-full text-sm font-medium">
                  <Pause className="h-3 w-3" />
                  Paused
                </div>
              )}
              {isProcessingFinal && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/80 text-primary-foreground rounded-full text-sm font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {processingMessage || 'Processing...'}
                </div>
              )}
              {finalResult && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-medium">
                  <Check className="h-3 w-3" />
                  Complete
                </div>
              )}
              {!isRecording && !isProcessingFinal && !finalResult && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-sm">
                  <Mic className="h-3 w-3" />
                  Ready to record
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* Live Transcript Preview */}
          {(isRecording || previewText) && !finalResult && (
            <div className="flex flex-col gap-2 flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  Live Preview
                </label>
                {previewText && (
                  <span className="text-xs text-muted-foreground">
                    {previewText.split(' ').length} words
                  </span>
                )}
              </div>
              <div ref={scrollRef} className="h-[120px] overflow-y-auto rounded-lg border bg-muted/30 p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {previewText || (
                    <span className="text-muted-foreground italic flex items-center gap-2">
                      <Mic className="h-4 w-4 animate-pulse" />
                      Start speaking... transcription will appear here
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Final Result Display */}
          {finalResult && (
            <div className="flex flex-col gap-3 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Stats Bar */}
              <div className="flex items-center gap-4 text-sm flex-shrink-0">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{finalResult.numSpeakers} speaker(s)</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{Math.round(finalResult.duration)}s duration</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>{finalResult.segments.length} segments</span>
                </div>
              </div>
              
              {/* Transcript - Fixed height with scroll */}
              <div className="h-[140px] overflow-y-auto rounded-lg border flex-shrink-0">
                <div className="p-4 space-y-3">
                  {finalResult.segments.map((segment, idx) => (
                    <div key={idx} className="text-sm animate-in fade-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                        {segment.speaker}
                      </span>
                      <p className="mt-1 text-muted-foreground leading-relaxed">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* AI Summary */}
              {finalResult.aiNotes?.summary && (
                <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/15 border border-primary/20 rounded-lg flex-shrink-0 max-h-[80px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      AI Summary
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
                    {finalResult.aiNotes.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Control Buttons - Fixed at bottom */}
          <div className="flex gap-3 pt-4 mt-auto border-t bg-background flex-shrink-0">
            {/* Start Recording Button */}
            {!isRecording && !isProcessingFinal && !finalResult && (
              <Button 
                onClick={handleStart}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                size="lg"
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            )}

            {/* Recording Controls */}
            {isRecording && (
              <div className="flex gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                {isPaused ? (
                  <Button 
                    onClick={resumeRecording} 
                    variant="outline" 
                    size="lg"
                    className="h-12 px-6 border-2 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                  >
                    <Play className="h-5 w-5 mr-2 text-amber-600" />
                    Resume
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseRecording} 
                    variant="outline" 
                    size="lg"
                    className="h-12 px-6 border-2 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                  >
                    <Pause className="h-5 w-5 mr-2 text-amber-600" />
                    Pause
                  </Button>
                )}
                <Button 
                  onClick={handleStop}
                  className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  size="lg"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop & Process
                </Button>
                <Button 
                  onClick={cancelRecording} 
                  variant="outline"
                  size="lg"
                  className="h-12 px-4 border-2 border-destructive/30 hover:bg-destructive/10"
                >
                  <MicOff className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            )}

            {/* Processing State */}
            {isProcessingFinal && (
              <Button disabled className="w-full h-12" size="lg">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing transcription...
              </Button>
            )}

            {/* Final Result Actions */}
            {finalResult && (
              <div className="flex gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Button 
                  onClick={handleNewRecording} 
                  variant="outline" 
                  className="flex-1 h-12 border-2" 
                  disabled={isSaving}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  New Recording
                </Button>
                <Button 
                  onClick={handleSaveAndClose} 
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Meeting
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
