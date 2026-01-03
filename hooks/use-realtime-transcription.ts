import { useState, useCallback, useRef, useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export interface RealtimeTranscriptSegment {
  chunkIndex: number;
  text: string;
  timestamp: Date;
}

export interface FinalTranscriptResult {
  sessionId: string;
  transcript: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    speaker: string;
  }>;
  speakers: Record<string, number> | Array<{ speaker: string; start: number; end: number }>;
  numSpeakers: number;
  duration: number;
  processingTime: number;
  audioBlob?: Blob; // The recorded audio blob for saving
  aiNotes?: {
    summary: string;
    highlights: Record<string, string>;
    conclusion: string;
    actionItems: any[];
    suggestedTitle?: string;
    suggestedDescription?: string;
    tags?: string[];
  };
}

interface UseRealtimeTranscriptionOptions {
  onPreviewUpdate?: (text: string, chunkIndex: number) => void;
  onAccumulatedUpdate?: (text: string, chunksProcessed: number) => void;
  onFinalResult?: (result: FinalTranscriptResult) => void;
  onError?: (error: string) => void;
  onProcessing?: (message: string) => void;
  previewIntervalMs?: number; // How often to get preview transcription (default: 5000ms)
}

export function useRealtimeTranscription(options: UseRealtimeTranscriptionOptions = {}) {
  const {
    onPreviewUpdate,
    onAccumulatedUpdate,
    onFinalResult,
    onError,
    onProcessing,
    previewIntervalMs = 5000, // 5 seconds between preview snapshots
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessingFinal, setIsProcessingFinal] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [accumulatedText, setAccumulatedText] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkIndexRef = useRef(0);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const socketListenersSetupRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const isRecordingRef = useRef(false);
  const mimeTypeRef = useRef<string>('audio/webm');
  const finalAudioBlobRef = useRef<Blob | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Setup socket listeners
  useEffect(() => {
    if (socketListenersSetupRef.current) return;
    
    const socket = getSocket();
    
    socket.on('realtime_session_started', (data: { sessionId: string; startedAt: string }) => {
      console.log('[Realtime] Session started:', data.sessionId);
      setSessionId(data.sessionId);
    });

    socket.on('preview_transcript', (data: { sessionId: string; text: string; chunkIndex: number }) => {
      console.log('[Realtime] Preview:', data.text.substring(0, 50));
      onPreviewUpdate?.(data.text, data.chunkIndex);
    });

    socket.on('accumulated_transcript', (data: { text: string; chunksProcessed: number; duration: number }) => {
      setAccumulatedText(data.text);
      onAccumulatedUpdate?.(data.text, data.chunksProcessed);
    });

    socket.on('realtime_processing', (data: { message: string }) => {
      setIsProcessingFinal(true);
      onProcessing?.(data.message);
    });

    socket.on('final_transcript', (data: FinalTranscriptResult) => {
      console.log('[Realtime] Final transcript received', data.aiNotes ? 'with AI notes' : 'without AI notes');
      setIsProcessingFinal(false);
      // Attach the stored audio blob to the result
      const resultWithAudio: FinalTranscriptResult = {
        ...data,
        audioBlob: finalAudioBlobRef.current || undefined,
      };
      onFinalResult?.(resultWithAudio);
    });

    socket.on('realtime_error', (data: { error: string }) => {
      console.error('[Realtime] Error:', data.error);
      setError(data.error);
      onError?.(data.error);
    });

    socket.on('realtime_cancelled', () => {
      console.log('[Realtime] Session cancelled');
      resetState();
    });

    socketListenersSetupRef.current = true;

    return () => {
      socket.off('realtime_session_started');
      socket.off('preview_transcript');
      socket.off('accumulated_transcript');
      socket.off('realtime_processing');
      socket.off('final_transcript');
      socket.off('realtime_error');
      socket.off('realtime_cancelled');
      socketListenersSetupRef.current = false;
    };
  }, [onPreviewUpdate, onAccumulatedUpdate, onFinalResult, onError, onProcessing]);

  // Duration timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const resetState = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    setIsProcessingFinal(false);
    setSessionId(null);
    setAccumulatedText('');
    setDuration(0);
    setError(null);
    chunkIndexRef.current = 0;
    audioChunksRef.current = [];
    finalAudioBlobRef.current = null;
    
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  /**
   * Send the current accumulated audio as a preview snapshot.
   * Creates a complete WebM blob from all chunks collected so far.
   */
  const sendPreviewSnapshot = useCallback(() => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId || audioChunksRef.current.length === 0) {
      return;
    }

    // Create a complete blob from all accumulated chunks
    const completeBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
    
    if (completeBlob.size < 1000) {
      console.log('[Realtime] Blob too small, skipping preview');
      return;
    }

    console.log(`[Realtime] Sending preview snapshot: ${(completeBlob.size / 1024).toFixed(1)}KB`);

    // Convert to base64 and send
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const socket = getSocket();
      socket.emit('audio_chunk', {
        sessionId: currentSessionId,
        audioData: base64Data,
        chunkIndex: chunkIndexRef.current++,
        isSnapshot: true, // Flag to indicate this is a complete snapshot
      });
    };
    reader.readAsDataURL(completeBlob);
  }, []);

  const startRecording = useCallback(async (meetingName?: string) => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // Determine best MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      mimeTypeRef.current = mimeType;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });
      mediaRecorderRef.current = mediaRecorder;

      // Clear previous chunks
      audioChunksRef.current = [];
      chunkIndexRef.current = 0;

      // Start socket session
      const socket = getSocket();
      socket.emit('start_realtime_transcription', { meetingName });

      // Collect all audio data (accumulate chunks for complete WebM)
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('[Realtime] MediaRecorder error:', event);
        setError('Recording error occurred');
        onError?.('Recording error occurred');
      };

      // Start recording - collect data every 500ms internally
      mediaRecorder.start(500);
      setIsRecording(true);
      setDuration(0);
      
      // Setup periodic preview snapshots (sends complete accumulated audio)
      previewTimerRef.current = setInterval(() => {
        if (isRecordingRef.current && sessionIdRef.current) {
          sendPreviewSnapshot();
        }
      }, previewIntervalMs);
      
      console.log('[Realtime] Recording started with', mimeType);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      console.error('[Realtime] Start error:', message);
      setError(message);
      onError?.(message);
    }
  }, [previewIntervalMs, onError, sendPreviewSnapshot]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pause preview timer
      if (previewTimerRef.current) {
        clearInterval(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume preview timer
      previewTimerRef.current = setInterval(() => {
        if (isRecordingRef.current && sessionIdRef.current) {
          sendPreviewSnapshot();
        }
      }, previewIntervalMs);
    }
  }, [previewIntervalMs, sendPreviewSnapshot]);

  const stopRecording = useCallback(async (options?: { numSpeakers?: number; enableAiNotes?: boolean }) => {
    if (!mediaRecorderRef.current) return;

    // Stop preview timer
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    // Create a promise to wait for the final data
    const finalDataPromise = new Promise<Blob>((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(new Blob(audioChunksRef.current, { type: mimeTypeRef.current }));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const completeBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        resolve(completeBlob);
      };
    });

    // Stop the MediaRecorder
    mediaRecorderRef.current.stop();
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setIsRecording(false);
    setIsPaused(false);

    // Wait for final data
    const finalBlob = await finalDataPromise;
    console.log(`[Realtime] Final audio blob: ${(finalBlob.size / 1024).toFixed(1)}KB`);
    
    // Store the final blob for later retrieval
    finalAudioBlobRef.current = finalBlob;

    // Send the complete audio for final processing
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const socket = getSocket();
      socket.emit('stop_realtime_transcription', {
        sessionId: sessionIdRef.current,
        audioData: base64Data, // Send complete audio with stop event
        options,
      });
    };
    reader.readAsDataURL(finalBlob);
  }, []);

  const cancelRecording = useCallback(() => {
    // Stop preview timer
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Cancel session
    const socket = getSocket();
    socket.emit('cancel_realtime_transcription', { sessionId: sessionIdRef.current });
    
    resetState();
  }, [resetState]);

  const formatDuration = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    isRecording,
    isPaused,
    isProcessingFinal,
    sessionId,
    accumulatedText,
    duration,
    formattedDuration: formatDuration(duration),
    error,
    
    // Actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    resetState,
  };
}
