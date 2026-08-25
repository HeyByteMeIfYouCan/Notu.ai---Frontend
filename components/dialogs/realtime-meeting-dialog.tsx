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

const SAVE_TIMEOUT_MS = 60000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (requestError) => {
        clearTimeout(timer)
        reject(requestError)
      },
    )
  })
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
    lifecycleState,
    canRetryFinalization,
    sessionId,
    formattedDuration,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    retryFinalization,
    cancelRecording,
    resetState,
    markSaving,
    markSaveCompleted,
    markSaveFailed,
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
  const isStarting = lifecycleState === 'requesting_permission' || lifecycleState === 'starting_session';
  const isLocked = isRecording || isProcessingFinal || isStarting || isSaving;

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
    markSaving();
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
      
      const response = await withTimeout(api.createRealtimeMeeting(backendToken, {
        title: meetingName || `Realtime Meeting - ${new Date().toLocaleDateString('id-ID')}`,
        sessionId: finalResult.sessionId,
        transcript: finalResult.transcript,
        segments: finalResult.segments,
        speakers: finalResult.speakers,
        numSpeakers: finalResult.numSpeakers,
        duration: finalResult.duration,
        language: 'id',
        aiNotes: finalResult.aiNotes ?? undefined,
        processingTime: finalResult.processingTime,
        audioBlob: finalResult.audioBlob, // Include audio blob for storage
      }), SAVE_TIMEOUT_MS, 'Penyimpanan membutuhkan waktu terlalu lama. Hasil tetap tersedia untuk dicoba kembali.');
      
      console.log('[RealtimeDialog] Save response:', response);
      
      if (response.success && response.data) {
        setSavedMeetingId(response.data.id);
        markSaveCompleted();
        if (response.data.mediaStatus === 'upload_failed') {
          toast.warning('Notulen berhasil disimpan, tetapi audio belum dapat disimpan.');
        } else if (response.data.idempotent) {
          toast.success('Meeting ini sudah tersimpan. Anda akan diarahkan ke hasilnya.');
        } else {
          toast.success('Meeting dan notulennya berhasil disimpan.');
        }
        handleClose();
        router.push(`/dashboard/meeting/${response.data.id}`);
      } else {
        throw new Error(response.message || response.error || 'Failed to save meeting');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save meeting. Please try again.';
      markSaveFailed(message);
      console.error('[RealtimeDialog] Failed to save meeting:', err);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isRecording || canRetryFinalization) {
      cancelRecording();
    } else {
      resetState();
    }
    setMeetingName("");
    setPreviewText("");
    setFinalResult(null);
    setProcessingMessage("");
    setSavedMeetingId(null);
    onClose();
  };

  const handleNewRecording = () => {
    cancelRecording();
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
          "transition-[border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          isLocked && "border-primary/50 ring-2 ring-primary/20"
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
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-6 gap-4 pb-4">
          {/* Header */}
          <DialogHeader className="mb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold tracking-tight">
              Rekam langsung dari mic
            </DialogTitle>
            <DialogDescription className="text-center mt-1.5 text-sm text-muted-foreground">
              {isLocked ? (
                <span className="flex items-center justify-center gap-1 text-primary">
                  <Lock className="h-3.5 w-3.5" />
                  Rekaman sedang berlangsung—selesaikan sebelum menutup
                </span>
              ) : (
                "Silakan berbicara seperti biasa, Notu akan membantu membuat transkrip otomatis."
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Value Proposition Banner (Only shown before recording starts) */}
          {!isRecording && !isProcessingFinal && !isStarting && !finalResult && !canRetryFinalization && (
            <div className="mb-2 rounded-lg bg-primary/5 p-4 border border-primary/10">
              <div className="flex items-start gap-3 text-sm text-primary/80">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="leading-relaxed font-medium">Bicaralah dengan bebas! Notu akan merekam suara Anda, mentranskrip secara real-time, dan membuat notulen.</p>
              </div>
            </div>
          )}
          {/* Meeting Name Input - Only show before recording */}
          {!isRecording && !isProcessingFinal && !isStarting && !finalResult && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-medium text-foreground">
                Nama meeting
              </label>
              <Input
                placeholder="Contoh: Sync Mingguan (Opsional)"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                className="h-10"
              />
            </div>
          )}

          {/* Timer & Status Display */}
          <div className={cn(
            "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border py-10 transition-all duration-500",
            isRecording && !isPaused 
              ? "bg-primary/5 border-primary/30 shadow-[0_0_40px_rgba(var(--primary),0.1)_inset]"
              : isPaused 
                ? "bg-amber-500/5 border-amber-500/30 shadow-[0_0_40px_rgba(var(--amber-500),0.1)_inset]"
                : isProcessingFinal
                  ? "bg-primary/5 border-primary/20"
                  : finalResult
                    ? "bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_40px_rgba(var(--emerald-500),0.1)_inset]"
                    : "bg-muted/30"
          )}>
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Audio Visualizer */}
            {isRecording && !isPaused && (
              <div className="flex items-end gap-1 h-8 mb-3">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-primary transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    style={{
                      height: `${Math.max(4, Math.sin((i + audioLevel / 10) * 0.5) * 20 + audioLevel * 0.2 + 8)}px`,
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Timer */}
            <div className={cn(
              "relative z-10 text-6xl md:text-7xl font-mono tabular-nums font-bold tracking-tighter transition-colors duration-300",

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
                <div className="flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary-foreground" />
                  Sedang merekam
                </div>
              )}
              {isPaused && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-full text-sm font-medium">
                  <Pause className="h-3 w-3" />
                  Rekaman dijeda
                </div>
              )}
              {isStarting && (
                <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {lifecycleState === 'requesting_permission' ? 'Menunggu izin mikrofon' : 'Menyiapkan sesi realtime'}
                </div>
              )}
              {isProcessingFinal && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/80 text-primary-foreground rounded-full text-sm font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {processingMessage || 'Mohon tunggu, Notu sedang merapikan hasilnya...'}
                </div>
              )}
              {finalResult && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-medium">
                  <Check className="h-3 w-3" />
                  Selesai
                </div>
              )}
              {!isRecording && !isProcessingFinal && !isStarting && !finalResult && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-sm">
                  <Mic className="h-3 w-3" />
                  Siap untuk mulai merekam
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
                  Transkrip sementara
                </label>
                {previewText && (
                  <span className="text-xs text-muted-foreground">
                    {previewText.split(' ').length} kata
                  </span>
                )}
              </div>
              <div ref={scrollRef} className="h-[120px] overflow-y-auto rounded-lg border bg-muted/30 p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {previewText || (
                    <span className="text-muted-foreground italic flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Silakan mulai berbicara. Transkrip akan muncul di sini.
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
                  <span>{finalResult.numSpeakers} pembicara</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{Math.round(finalResult.duration)} detik</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>{finalResult.segments.length} segmen</span>
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
                <div className="max-h-[80px] flex-shrink-0 overflow-y-auto rounded-lg border border-primary/20 bg-[color-mix(in_oklch,var(--primary)_7%,var(--card))] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Ringkasan cepat
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
                    {finalResult.aiNotes.summary}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Control Buttons - Separated Footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4 flex-shrink-0">
          {/* Start Recording Button */}
          {!isRecording && !isProcessingFinal && !isStarting && !finalResult && !canRetryFinalization && (
            <>
              <Button type="button" variant="outline" onClick={handleClose} className="h-10 px-6 flex-1 sm:flex-none">
                Batal
              </Button>
              <Button 
                onClick={handleStart}
                className="h-10 px-6 flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none"
              >
                <Mic className="h-4 w-4 mr-2" />
                Mulai rekam sekarang
              </Button>
            </>
          )}

          {isStarting && (
            <Button disabled className="h-10 px-6 w-full sm:w-auto">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {lifecycleState === 'requesting_permission'
                ? 'Mohon izinkan akses mikrofon...'
                : 'Menyiapkan sesi...'}
            </Button>
          )}

          {canRetryFinalization && !finalResult && (
            <div className="flex w-full gap-2 justify-end">
              <Button onClick={handleNewRecording} variant="outline" className="h-10 px-6">
                Batal & Rekam ulang
              </Button>
              <Button
                onClick={retryFinalization}
                className="h-10 px-6 bg-primary text-primary-foreground shadow-none"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Coba buat notulen lagi
              </Button>
            </div>
          )}

          {/* Recording Controls */}
          {isRecording && (
            <div className="flex gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Button 
                onClick={cancelRecording} 
                variant="outline"
                className="h-10 px-4 border-destructive/30 hover:bg-destructive/10 text-destructive"
              >
                <MicOff className="h-4 w-4 mr-2" />
                Batal
              </Button>
              {isPaused ? (
                <Button 
                  onClick={resumeRecording} 
                  variant="outline" 
                  className="h-10 px-6 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                >
                  <Play className="h-4 w-4 mr-2 text-amber-600" />
                  Lanjutkan
                </Button>
              ) : (
                <Button 
                  onClick={pauseRecording} 
                  variant="outline" 
                  className="h-10 px-6 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                >
                  <Pause className="h-4 w-4 mr-2 text-amber-600" />
                  Jeda
                </Button>
              )}
              <Button 
                onClick={handleStop}
                className="h-10 px-6 flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none"
              >
                <Square className="h-3.5 w-3.5 mr-2" />
                Selesai merekam
              </Button>
            </div>
          )}

          {/* Processing State */}
          {isProcessingFinal && (
            <Button disabled className="h-10 px-6 w-full sm:w-auto">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Notulen sedang dibuat...
            </Button>
          )}

          {/* Final Result Actions */}
          {finalResult && (
            <div className="flex gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Button 
                onClick={handleNewRecording} 
                variant="outline" 
                className="h-10 px-6 flex-1 sm:flex-none" 
                disabled={isSaving}
              >
                <Mic className="h-4 w-4 mr-2" />
                Rekam baru
              </Button>
              <Button 
                onClick={handleSaveAndClose} 
                className="h-10 px-6 flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Simpan & Buka notulen
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
