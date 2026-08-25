import { useState, useCallback, useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import type {
  BotCaptionEvent,
  BotCompletedEvent,
  BotMeetingStatus,
  BotStatusEvent,
  MeetingFeatureError,
} from '@/lib/types';

export interface BotTranscriptSegment {
  chunkIndex: number;
  text: string;
  timestamp: Date;
  isInterim?: boolean;
}

export interface BotSessionStatus {
  status: BotMeetingStatus;
  currentPreview: string;
  chunksProcessed: number;
  duration: number;
  botJoinedAt?: Date;
  lastActivity?: Date;
}

interface UseBotLiveTranscriptionOptions {
  meetingId: string;
  onStatusUpdate?: (status: BotSessionStatus) => void;
  onPreviewUpdate?: (text: string, chunkIndex: number) => void;
  onComplete?: (data: BotCompletedEvent) => void;
  onError?: (error: string) => void;
}

export function useBotLiveTranscription(options: UseBotLiveTranscriptionOptions) {
  const {
    meetingId,
    onStatusUpdate,
    onPreviewUpdate,
    onComplete,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<BotSessionStatus['status']>('pending');
  const [previewText, setPreviewText] = useState('');
  const [segments, setSegments] = useState<BotTranscriptSegment[]>([]);
  const [chunksProcessed, setChunksProcessed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const meetingIdRef = useRef(meetingId);
  const previewTextRef = useRef(previewText);
  const completedMeetingRef = useRef<string | null>(null);
  const callbacksRef = useRef({
    onStatusUpdate,
    onPreviewUpdate,
    onComplete,
    onError,
  });

  // Keep ref in sync
  useEffect(() => {
    meetingIdRef.current = meetingId;
  }, [meetingId]);

  useEffect(() => {
    previewTextRef.current = previewText;
  }, [previewText]);

  useEffect(() => {
    callbacksRef.current = {
      onStatusUpdate,
      onPreviewUpdate,
      onComplete,
      onError,
    };
  }, [onStatusUpdate, onPreviewUpdate, onComplete, onError]);

  // Setup socket listeners
  useEffect(() => {
    if (!meetingId) return;

    const socket = getSocket();
    completedMeetingRef.current = null;

    // Join meeting room to receive events
    socket.emit('join_meeting', meetingId);
    console.log('[Bot] Joined meeting room:', meetingId);

    setIsConnected(socket.connected);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleBotStatus = (data: BotStatusEvent) => {
      if (data.meetingId !== meetingIdRef.current) return;

      console.log('[Bot] Status update:', data.status);
      setStatus(data.status);

      if (data.status === 'failed') {
        const failureMessage = data.message || 'Notu tidak dapat bergabung ke meeting.';
        setError(failureMessage);
      } else if (data.status === 'in_meeting' || data.status === 'recording') {
        setError(null);
      }

      if (data.chunksProcessed !== undefined) {
        setChunksProcessed(data.chunksProcessed);
      }
      if (data.duration !== undefined) {
        setDuration(data.duration);
      }

      callbacksRef.current.onStatusUpdate?.({
        status: data.status,
        currentPreview: previewTextRef.current,
        chunksProcessed: data.chunksProcessed || 0,
        duration: data.duration || 0,
      });
    };

    const handleCaptionAdded = (data: BotCaptionEvent) => {
      if (data.meetingId && data.meetingId !== meetingIdRef.current) return;

      console.log('[Bot] Caption added:', `${data.segment.speaker}: ${data.segment.text.substring(0, 50)}`);
      const fullText = `${data.segment.speaker}: ${data.segment.text}`;

      setSegments((prev) => {
        const isDuplicate = prev.slice(-3).some((seg) => seg.text === fullText);
        if (isDuplicate) {
          return prev;
        }

        const last = prev[prev.length - 1];
        const isSameSpeaker = last && last.text.startsWith(data.segment.speaker);
        const isRecent = last && (new Date().getTime() - new Date(last.timestamp).getTime() < 10000);

        if (isSameSpeaker && isRecent) {
          return [...prev.slice(0, -1), {
            ...last,
            text: fullText,
            chunkIndex: data.segment.sequence,
          }];
        }

        return [...prev, {
          chunkIndex: data.segment.sequence,
          text: fullText,
          timestamp: new Date(),
          isInterim: false,
        }];
      });

      setPreviewText(fullText);
      callbacksRef.current.onPreviewUpdate?.(data.segment.text, data.segment.sequence);
    };

    const handleBotCompleted = (data: BotCompletedEvent) => {
      if (data.meetingId !== meetingIdRef.current) return;
      if (completedMeetingRef.current === data.meetingId) {
        console.log('[Bot] Ignored duplicate completion event:', data.meetingId);
        return;
      }

      completedMeetingRef.current = data.meetingId;
      console.log('[Bot] Session completed');
      setStatus('completed');
      callbacksRef.current.onComplete?.(data);
    };

    const handleBotError = (data: MeetingFeatureError & { meetingId: string }) => {
      if (data.meetingId !== meetingIdRef.current) return;

      console.error('[Bot] Error:', data.error);
      setError(data.error);
      setStatus('failed');
      callbacksRef.current.onError?.(data.error);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('bot_status', handleBotStatus);
    socket.on('caption_added', handleCaptionAdded);
    socket.on('bot_completed', handleBotCompleted);
    socket.on('bot_error', handleBotError);

    // Cleanup
    return () => {
      socket.emit('leave_meeting', meetingId);
      console.log('[Bot] Left meeting room:', meetingId);

      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('bot_status', handleBotStatus);
      socket.off('caption_added', handleCaptionAdded);
      socket.off('bot_completed', handleBotCompleted);
      socket.off('bot_error', handleBotError);
    };
  }, [meetingId]);

  // Get accumulated text from all segments
  const getAccumulatedText = useCallback(() => {
    return segments.map(s => s.text).join(' ');
  }, [segments]);

  return {
    // State
    isConnected,
    status,
    previewText,
    segments,
    chunksProcessed,
    duration,
    error,

    // Actions
    getAccumulatedText,
  };
}
