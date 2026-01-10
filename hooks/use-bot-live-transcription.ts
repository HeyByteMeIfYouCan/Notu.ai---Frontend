import { useState, useCallback, useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';

export interface BotTranscriptSegment {
  chunkIndex: number;
  text: string;
  timestamp: Date;
  isInterim?: boolean;
}

export interface BotSessionStatus {
  status: 'pending' | 'bot_joining' | 'bot_in_meeting' | 'recording' | 'processing' | 'completed' | 'failed';
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
  onComplete?: (data: { transcript: string; segments: any[]; duration: number }) => void;
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

  const socketListenersSetupRef = useRef(false);
  const meetingIdRef = useRef(meetingId);

  // Keep ref in sync
  useEffect(() => {
    meetingIdRef.current = meetingId;
  }, [meetingId]);

  // Setup socket listeners
  useEffect(() => {
    if (socketListenersSetupRef.current) return;
    if (!meetingId) return;

    const socket = getSocket();

    // Join meeting room to receive events
    socket.emit('join_meeting', meetingId);
    console.log('[Bot] Joined meeting room:', meetingId);

    // Track connection status
    setIsConnected(socket.connected);
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Bot status updates
    socket.on('bot_status', (data: {
      meetingId: string;
      status: BotSessionStatus['status'];
      chunksProcessed?: number;
      duration?: number;
      message?: string;
    }) => {
      if (data.meetingId !== meetingIdRef.current) return;

      console.log('[Bot] Status update:', data.status);
      setStatus(data.status);

      if (data.chunksProcessed !== undefined) {
        setChunksProcessed(data.chunksProcessed);
      }
      if (data.duration !== undefined) {
        setDuration(data.duration);
      }

      onStatusUpdate?.({
        status: data.status,
        currentPreview: previewText,
        chunksProcessed: data.chunksProcessed || 0,
        duration: data.duration || 0,
      });
    });

    // Live preview updates
    socket.on('bot_preview', (data: {
      meetingId: string;
      preview: string;
      chunkIndex: number;
      timestamp: string;
    }) => {
      if (data.meetingId !== meetingIdRef.current) return;

      console.log('[Bot] Preview update:', data.preview.substring(0, 50));
      setPreviewText(data.preview);

      // Add to segments
      setSegments(prev => [...prev, {
        chunkIndex: data.chunkIndex,
        text: data.preview,
        timestamp: new Date(data.timestamp),
      }]);

      onPreviewUpdate?.(data.preview, data.chunkIndex);
    });

    // Live caption updates (from caption scraping)
    socket.on('caption_added', (data: {
      meetingId?: string;
      segment: {
        speaker: string;
        text: string;
        start: number;
        end: number;
      };
    }) => {
      // Check if this caption is for our meeting
      if (data.meetingId && data.meetingId !== meetingIdRef.current) return;

      console.log('[Bot] Caption added:', `${data.segment.speaker}: ${data.segment.text.substring(0, 50)}`);

      // Add caption to segments
      setSegments(prev => [...prev, {
        chunkIndex: data.segment.start,
        text: `${data.segment.speaker}: ${data.segment.text}`,
        timestamp: new Date(),
        isInterim: false,
      }]);

      // Update preview text with latest caption
      setPreviewText(prev => {
        const newText = `${data.segment.speaker}: ${data.segment.text}`;
        return prev ? `${prev}\n${newText}` : newText;
      });

      onPreviewUpdate?.(data.segment.text, data.segment.start);
    });

    // Session complete
    socket.on('bot_completed', (data: {
      meetingId: string;
      transcript: string;
      segments: any[];
      duration: number;
    }) => {
      if (data.meetingId !== meetingIdRef.current) return;

      console.log('[Bot] Session completed');
      setStatus('completed');
      onComplete?.(data);
    });

    // Error handling
    socket.on('bot_error', (data: { meetingId: string; error: string }) => {
      if (data.meetingId !== meetingIdRef.current) return;

      console.error('[Bot] Error:', data.error);
      setError(data.error);
      setStatus('failed');
      onError?.(data.error);
    });

    socketListenersSetupRef.current = true;

    // Cleanup
    return () => {
      // Leave meeting room
      socket.emit('leave_meeting', meetingId);
      console.log('[Bot] Left meeting room:', meetingId);

      socket.off('connect');
      socket.off('disconnect');
      socket.off('bot_status');
      socket.off('bot_preview');
      socket.off('caption_added');
      socket.off('bot_completed');
      socket.off('bot_error');
      socketListenersSetupRef.current = false;
    };
  }, [meetingId, onStatusUpdate, onPreviewUpdate, onComplete, onError, previewText]);

  // Join bot live room
  const joinLiveRoom = useCallback(() => {
    if (!meetingId) return;

    const socket = getSocket();
    socket.emit('join_bot_live', { meetingId });
    setIsConnected(true);
    console.log('[Bot] Joined live room:', meetingId);
  }, [meetingId]);

  // Leave bot live room
  const leaveLiveRoom = useCallback(() => {
    if (!meetingId) return;

    const socket = getSocket();
    socket.emit('leave_bot_live', { meetingId });
    setIsConnected(false);
    console.log('[Bot] Left live room:', meetingId);
  }, [meetingId]);

  // Request current preview
  const requestPreview = useCallback(() => {
    if (!meetingId) return;

    const socket = getSocket();
    socket.emit('get_bot_preview', { meetingId });
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
    joinLiveRoom,
    leaveLiveRoom,
    requestPreview,
    getAccumulatedText,
  };
}
