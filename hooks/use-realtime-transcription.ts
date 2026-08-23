import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import type {
  MeetingFeatureError,
  RealtimeAccumulatedEvent,
  RealtimeChunkAcknowledgement,
  RealtimeFinalResult,
  RealtimeFinalizationAcknowledgement,
  RealtimeFinalizationOptions,
  RealtimeMeetingState,
  RealtimePreviewEvent,
  RealtimeProcessingEvent,
  RealtimeResumeAcknowledgement,
  RealtimeSessionStartedEvent,
  RealtimeStartAcknowledgement,
} from '@/lib/types';

const START_TIMEOUT_MS = 15000;
const PREVIEW_ACK_TIMEOUT_MS = 35000;
const FINALIZATION_ACK_TIMEOUT_MS = 15000;
const FINALIZATION_RESULT_TIMEOUT_MS = 11 * 60 * 1000;
const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;
const MAX_FINAL_AUDIO_BYTES = 64 * 1024 * 1024;
const MAX_RECORDING_DURATION_SECONDS = 4 * 60 * 60;
const MAX_PREVIEW_COUNT = 720;
const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
] as const;

export interface RealtimeTranscriptSegment {
  chunkIndex: number;
  text: string;
  timestamp: Date;
}

export type FinalTranscriptResult = RealtimeFinalResult;

interface UseRealtimeTranscriptionOptions {
  onPreviewUpdate?: (text: string, chunkIndex: number) => void;
  onAccumulatedUpdate?: (text: string, chunksProcessed: number) => void;
  onFinalResult?: (result: FinalTranscriptResult) => void;
  onError?: (error: string) => void;
  onProcessing?: (message: string) => void;
  previewIntervalMs?: number;
}

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Audio rekaman tidak dapat dibaca.'));
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Audio rekaman tidak dapat dikonversi.'));
        return;
      }
      const separatorIndex = reader.result.indexOf(',');
      if (separatorIndex < 0) {
        reject(new Error('Format audio rekaman tidak valid.'));
        return;
      }
      resolve(reader.result.slice(separatorIndex + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function getSupportedMimeType(): string | null {
  return SUPPORTED_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || null;
}

export function useRealtimeTranscription(options: UseRealtimeTranscriptionOptions = {}) {
  const {
    onPreviewUpdate,
    onAccumulatedUpdate,
    onFinalResult,
    onError,
    onProcessing,
    previewIntervalMs = 5000,
  } = options;

  const [lifecycleState, setLifecycleState] = useState<RealtimeMeetingState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [accumulatedText, setAccumulatedText] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef<RealtimeMeetingState>('idle');
  const sessionIdRef = useRef<string | null>(null);
  const resumeTokenRef = useRef<string | null>(null);
  const sessionDetachedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const finalAudioBlobRef = useRef<Blob | null>(null);
  const finalizationOptionsRef = useRef<RealtimeFinalizationOptions>({ enableAiNotes: true });
  const hasFinalResultRef = useRef(false);
  const chunkIndexRef = useRef(0);
  const mimeTypeRef = useRef('audio/webm');
  const previewInFlightRef = useRef(false);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewAckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transitionTo = useCallback((nextState: RealtimeMeetingState) => {
    stateRef.current = nextState;
    setLifecycleState(nextState);
  }, []);

  const clearTimer = useCallback((timerRef: { current: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | null }) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopMedia = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.stop();
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearRuntimeResources = useCallback(() => {
    clearTimer(durationTimerRef);
    clearTimer(previewTimerRef);
    clearTimer(previewAckTimerRef);
    clearTimer(finalizationTimerRef);
    previewInFlightRef.current = false;
    stopMedia();
  }, [clearTimer, stopMedia]);

  const setRecoverableError = useCallback((message: string) => {
    setError(message);
    transitionTo('recoverable_error');
    onError?.(message);
  }, [onError, transitionTo]);

  const resetState = useCallback(() => {
    clearRuntimeResources();
    sessionIdRef.current = null;
    resumeTokenRef.current = null;
    sessionDetachedRef.current = false;
    setSessionId(null);
    setAccumulatedText('');
    setDuration(0);
    setError(null);
    audioChunksRef.current = [];
    finalAudioBlobRef.current = null;
    finalizationOptionsRef.current = { enableAiNotes: true };
    hasFinalResultRef.current = false;
    chunkIndexRef.current = 0;
    transitionTo('idle');
  }, [clearRuntimeResources, transitionTo]);

  useEffect(() => {
    const socket = getSocket();

    const handleSessionStarted = (data: RealtimeSessionStartedEvent) => {
      if (stateRef.current !== 'starting_session') return;
      sessionIdRef.current = data.sessionId;
      setSessionId(data.sessionId);
    };
    const handlePreview = (data: RealtimePreviewEvent) => {
      if (data.sessionId !== sessionIdRef.current) return;
      onPreviewUpdate?.(data.text, data.chunkIndex);
    };
    const handleAccumulated = (data: RealtimeAccumulatedEvent) => {
      if (data.sessionId !== sessionIdRef.current) return;
      setAccumulatedText(data.text);
      onAccumulatedUpdate?.(data.text, data.chunksProcessed);
    };
    const handleProcessing = (data: RealtimeProcessingEvent) => {
      if (data.sessionId !== sessionIdRef.current) return;
      transitionTo('finalizing');
      onProcessing?.(data.message);
    };
    const handleFinalTranscript = (data: FinalTranscriptResult) => {
      if (data.sessionId !== sessionIdRef.current) return;
      clearTimer(finalizationTimerRef);
      hasFinalResultRef.current = true;
      setError(null);
      const resultWithAudio: FinalTranscriptResult = {
        ...data,
        audioBlob: finalAudioBlobRef.current || undefined,
      };
      transitionTo('ready_to_save');
      onFinalResult?.(resultWithAudio);
    };
    const handleRealtimeError = (data: MeetingFeatureError) => {
      if (data.sessionId && data.sessionId !== sessionIdRef.current) return;
      if (typeof data.chunkIndex === 'number' && ['recording', 'paused'].includes(stateRef.current)) {
        setError(data.error);
        onError?.(data.error);
        return;
      }
      clearTimer(finalizationTimerRef);
      setRecoverableError(data.error);
    };
    const handleCancelled = (data: { sessionId: string }) => {
      if (data.sessionId !== sessionIdRef.current) return;
      resetState();
    };
    const handleDisconnect = () => {
      if (['recording', 'paused', 'starting_session', 'finalizing'].includes(stateRef.current)) {
        if (!finalAudioBlobRef.current && audioChunksRef.current.length > 0) {
          finalAudioBlobRef.current = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        }
        sessionDetachedRef.current = true;
        clearRuntimeResources();
        setRecoverableError('Koneksi realtime terputus. Rekaman tidak dilanjutkan agar hasil tetap konsisten.');
      }
    };

    socket.on('realtime_session_started', handleSessionStarted);
    socket.on('preview_transcript', handlePreview);
    socket.on('accumulated_transcript', handleAccumulated);
    socket.on('realtime_processing', handleProcessing);
    socket.on('final_transcript', handleFinalTranscript);
    socket.on('realtime_error', handleRealtimeError);
    socket.on('realtime_cancelled', handleCancelled);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('realtime_session_started', handleSessionStarted);
      socket.off('preview_transcript', handlePreview);
      socket.off('accumulated_transcript', handleAccumulated);
      socket.off('realtime_processing', handleProcessing);
      socket.off('final_transcript', handleFinalTranscript);
      socket.off('realtime_error', handleRealtimeError);
      socket.off('realtime_cancelled', handleCancelled);
      socket.off('disconnect', handleDisconnect);
    };
  }, [clearRuntimeResources, clearTimer, onAccumulatedUpdate, onError, onFinalResult, onPreviewUpdate, onProcessing, resetState, setRecoverableError, transitionTo]);

  useEffect(() => {
    clearTimer(durationTimerRef);
    if (lifecycleState === 'recording') {
      durationTimerRef.current = setInterval(() => setDuration((value) => value + 1), 1000);
    }
    return () => clearTimer(durationTimerRef);
  }, [clearTimer, lifecycleState]);

  const sendPreviewSnapshot = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId
      || previewInFlightRef.current
      || audioChunksRef.current.length === 0
      || chunkIndexRef.current >= MAX_PREVIEW_COUNT) return;
    const snapshot = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
    if (snapshot.size < 1000 || snapshot.size > MAX_PREVIEW_BYTES) return;

    previewInFlightRef.current = true;
    try {
      const audioData = await readBlobAsBase64(snapshot);
      const socket = getSocket();
      if (!socket.connected) throw new Error('Koneksi realtime terputus.');
      const chunkIndex = chunkIndexRef.current++;
      previewAckTimerRef.current = setTimeout(() => {
        previewInFlightRef.current = false;
        previewAckTimerRef.current = null;
      }, PREVIEW_ACK_TIMEOUT_MS);
      socket.emit('audio_chunk', {
        sessionId: currentSessionId,
        audioData,
        chunkIndex,
        isSnapshot: true,
      }, (ack: RealtimeChunkAcknowledgement) => {
        clearTimer(previewAckTimerRef);
        previewInFlightRef.current = false;
        if (!ack.success && ack.error) setError(ack.error);
      });
    } catch (previewError) {
      previewInFlightRef.current = false;
      setError(previewError instanceof Error ? previewError.message : 'Preview transcript tidak dapat diproses.');
    }
  }, [clearTimer]);

  const waitForSocketConnection = useCallback(async () => {
    const socket = getSocket();
    if (socket.connected) return;
    socket.connect();
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.off('connect', handleConnect);
        reject(new Error('Koneksi realtime belum tersedia. Silakan coba lagi.'));
      }, START_TIMEOUT_MS);
      const handleConnect = () => {
        clearTimeout(timer);
        resolve();
      };
      socket.once('connect', handleConnect);
    });
  }, []);

  const startRecording = useCallback(async (meetingName?: string) => {
    if (stateRef.current !== 'idle' && stateRef.current !== 'recoverable_error') return;
    try {
      setError(null);
      if (!window.isSecureContext) throw new Error('Mikrofon hanya tersedia melalui koneksi HTTPS yang aman.');
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('Browser ini belum mendukung perekaman mikrofon realtime.');
      }
      const mimeType = getSupportedMimeType();
      if (!mimeType) throw new Error('Format rekaman browser tidak didukung. Gunakan browser versi terbaru.');

      transitionTo('requesting_permission');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current = stream;
      mimeTypeRef.current = mimeType;
      await waitForSocketConnection();
      transitionTo('starting_session');

      const socket = getSocket();
      const acknowledgement = await new Promise<RealtimeStartAcknowledgement>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Server belum mengonfirmasi sesi realtime. Silakan coba lagi.')), START_TIMEOUT_MS);
        socket.emit('start_realtime_transcription', { meetingName }, (ack: RealtimeStartAcknowledgement) => {
          clearTimeout(timer);
          resolve(ack);
        });
      });
      if (!acknowledgement.success || !acknowledgement.sessionId) {
        throw new Error(acknowledgement.error || 'Sesi realtime tidak dapat dimulai.');
      }
      sessionIdRef.current = acknowledgement.sessionId;
      if (!acknowledgement.resumeToken) throw new Error('Recovery token realtime tidak diterima.');
      resumeTokenRef.current = acknowledgement.resumeToken;
      sessionDetachedRef.current = false;
      setSessionId(acknowledgement.sessionId);

      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      finalAudioBlobRef.current = null;
      hasFinalResultRef.current = false;
      chunkIndexRef.current = 0;
      setDuration(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        clearRuntimeResources();
        setRecoverableError('Terjadi kendala saat merekam mikrofon. Rekaman dihentikan agar data tetap aman.');
      };
      recorder.start(500);
      transitionTo('recording');
      previewTimerRef.current = setInterval(() => void sendPreviewSnapshot(), previewIntervalMs);
    } catch (startError) {
      clearRuntimeResources();
      const activeSessionId = sessionIdRef.current;
      if (activeSessionId) getSocket().emit('cancel_realtime_transcription', { sessionId: activeSessionId });
      setRecoverableError(startError instanceof Error ? startError.message : 'Perekaman tidak dapat dimulai.');
    }
  }, [clearRuntimeResources, previewIntervalMs, sendPreviewSnapshot, setRecoverableError, transitionTo, waitForSocketConnection]);

  const pauseRecording = useCallback(() => {
    if (stateRef.current !== 'recording' || mediaRecorderRef.current?.state !== 'recording') return;
    mediaRecorderRef.current.pause();
    clearTimer(previewTimerRef);
    transitionTo('paused');
  }, [clearTimer, transitionTo]);

  const resumeRecording = useCallback(() => {
    if (stateRef.current !== 'paused' || mediaRecorderRef.current?.state !== 'paused') return;
    mediaRecorderRef.current.resume();
    previewTimerRef.current = setInterval(() => void sendPreviewSnapshot(), previewIntervalMs);
    transitionTo('recording');
  }, [previewIntervalMs, sendPreviewSnapshot, transitionTo]);

  const ensureSessionResumed = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    const resumeToken = resumeTokenRef.current;
    if (!currentSessionId || !resumeToken) throw new Error('Data recovery session realtime tidak tersedia.');
    const socket = getSocket();
    if (!socket.connected) await waitForSocketConnection();
    const acknowledgement = await new Promise<RealtimeResumeAcknowledgement>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Recovery session realtime tidak dikonfirmasi server.')), START_TIMEOUT_MS);
      socket.emit('resume_realtime_transcription', { sessionId: currentSessionId, resumeToken }, (ack: RealtimeResumeAcknowledgement) => {
        clearTimeout(timer);
        resolve(ack);
      });
    });
    if (!acknowledgement.success) throw new Error(acknowledgement.error || 'Session realtime tidak dapat dipulihkan.');
    sessionDetachedRef.current = false;
  }, [waitForSocketConnection]);

  const sendFinalization = useCallback(async (audioBlob: Blob, finalizationOptions: RealtimeFinalizationOptions) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) throw new Error('Session realtime tidak tersedia.');
    if (audioBlob.size < 1000) throw new Error('Rekaman terlalu singkat untuk diproses.');
    if (audioBlob.size > MAX_FINAL_AUDIO_BYTES) throw new Error('Ukuran rekaman melebihi batas 64 MB.');
    const socket = getSocket();
    if (!socket.connected || sessionDetachedRef.current) await ensureSessionResumed();
    const audioData = await readBlobAsBase64(audioBlob);
    const acknowledgement = await new Promise<RealtimeFinalizationAcknowledgement>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server belum menerima permintaan finalisasi.')), FINALIZATION_ACK_TIMEOUT_MS);
      socket.emit('stop_realtime_transcription', {
        sessionId: currentSessionId,
        audioData,
        options: finalizationOptions,
      }, (ack: RealtimeFinalizationAcknowledgement) => {
        clearTimeout(timer);
        resolve(ack);
      });
    });
    if (!acknowledgement.success || !acknowledgement.accepted) {
      throw new Error(acknowledgement.error || 'Finalisasi rekaman tidak diterima server.');
    }
    clearTimer(finalizationTimerRef);
    finalizationTimerRef.current = setTimeout(() => {
      setRecoverableError('Pembuatan notulen membutuhkan waktu terlalu lama. Rekaman tetap tersedia untuk dicoba kembali.');
    }, FINALIZATION_RESULT_TIMEOUT_MS);
  }, [clearTimer, ensureSessionResumed, setRecoverableError]);

  const stopRecording = useCallback(async (finalizationOptions: RealtimeFinalizationOptions = {}) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !['recording', 'paused'].includes(stateRef.current)) return;
    clearTimer(previewTimerRef);
    transitionTo('finalizing');
    finalizationOptionsRef.current = finalizationOptions;
    try {
      const finalBlob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(audioChunksRef.current, { type: mimeTypeRef.current }));
        if (recorder.state === 'paused') recorder.resume();
        recorder.stop();
      });
      mediaRecorderRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      finalAudioBlobRef.current = finalBlob;
      await sendFinalization(finalBlob, finalizationOptions);
    } catch (stopError) {
      setRecoverableError(stopError instanceof Error ? stopError.message : 'Rekaman tidak dapat difinalisasi.');
    }
  }, [clearTimer, sendFinalization, setRecoverableError, transitionTo]);

  useEffect(() => {
    if (duration >= MAX_RECORDING_DURATION_SECONDS && ['recording', 'paused'].includes(lifecycleState)) {
      void stopRecording({ enableAiNotes: true });
    }
  }, [duration, lifecycleState, stopRecording]);

  const retryFinalization = useCallback(async () => {
    const finalBlob = finalAudioBlobRef.current;
    if (!finalBlob || hasFinalResultRef.current) return;
    setError(null);
    transitionTo('finalizing');
    try {
      await sendFinalization(finalBlob, finalizationOptionsRef.current);
    } catch (retryError) {
      setRecoverableError(retryError instanceof Error ? retryError.message : 'Finalisasi belum berhasil dicoba kembali.');
    }
  }, [sendFinalization, setRecoverableError, transitionTo]);

  const cancelRecording = useCallback(() => {
    clearRuntimeResources();
    const currentSessionId = sessionIdRef.current;
    if (currentSessionId) {
      const cancelSession = async () => {
        try {
          if (sessionDetachedRef.current) await ensureSessionResumed();
          getSocket().emit('cancel_realtime_transcription', { sessionId: currentSessionId });
        } catch {
          // Server-side stale-session cleanup remains the final fallback.
        }
      };
      void cancelSession();
    }
    transitionTo('cancelled');
    resetState();
  }, [clearRuntimeResources, ensureSessionResumed, resetState, transitionTo]);

  const markSaving = useCallback(() => {
    if (hasFinalResultRef.current) transitionTo('saving');
  }, [transitionTo]);
  const markSaveCompleted = useCallback(() => transitionTo('completed'), [transitionTo]);
  const markSaveFailed = useCallback((message: string) => setRecoverableError(message), [setRecoverableError]);

  useEffect(() => () => {
    const currentSessionId = sessionIdRef.current;
    if (currentSessionId && ['recording', 'paused', 'starting_session'].includes(stateRef.current)) {
      getSocket().emit('cancel_realtime_transcription', { sessionId: currentSessionId });
    }
    clearRuntimeResources();
  }, [clearRuntimeResources]);

  const isRecording = lifecycleState === 'recording' || lifecycleState === 'paused';
  const isPaused = lifecycleState === 'paused';
  const isProcessingFinal = lifecycleState === 'finalizing';
  const canRetryFinalization = lifecycleState === 'recoverable_error'
    && Boolean(finalAudioBlobRef.current)
    && !hasFinalResultRef.current;

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    lifecycleState,
    isRecording,
    isPaused,
    isProcessingFinal,
    canRetryFinalization,
    sessionId,
    accumulatedText,
    duration,
    formattedDuration: formatDuration(duration),
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
  };
}
