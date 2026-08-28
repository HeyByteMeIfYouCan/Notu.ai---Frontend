// Shared TypeScript types for the notu.ai application
// These types ensure consistency between frontend and backend

// ============================================
// Base Types
// ============================================

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MeetingStatus =
    | 'pending'
    | 'queued'
    | 'bot_joining'
    | 'recording'
    | 'processing'
    | 'completed'
    | 'failed';
export type MeetingType = 'upload' | 'online' | 'realtime';
export type Platform = 'Google Meet' | 'Upload' | 'Zoom' | 'Microsoft Teams';
export type CollaboratorRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type UserPlan = 'free' | 'pro' | 'enterprise';
export type BoardSource = 'manual' | 'ai';

// ============================================
// User Types
// ============================================

export interface User {
    _id: string;
    id?: string; // Virtual or alias
    googleId: string;
    email: string;
    name: string;
    image?: string;
    plan: UserPlan;
    meetingsCount: number;
    totalTranscriptionMinutes: number;
    preferences: UserPreferences;
    isActive: boolean;
    lastLoginAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserPreferences {
    language: string;
    notificationEmail: boolean;
    autoTranscribe: boolean;
}

export interface UserPublic {
    _id: string;
    name: string;
    email: string;
    image?: string;
}

// ============================================
// Collaborator Types
// ============================================

export interface Collaborator {
    user: UserPublic;
    role: CollaboratorRole;
    joinedAt: string;
}

export interface Participant {
    user: UserPublic;
    role: CollaboratorRole;
    joinedAt: string;
    isOwner: boolean;
}

// ============================================
// Task Types
// ============================================

export interface Task {
    _id: string;
    id: string; // Alias for _id, used in frontend
    userId: string;
    meetingId?: string;
    boardId?: string;
    source: 'ai' | 'manual';
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assignee?: string | UserPublic | null;
    assigneeName?: string;
    labels: string[]; // Array of label names
    order: number;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    // Virtual
    isOverdue?: boolean;
}

export interface TaskCreateInput {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    assignee?: string;
    labels?: string[];
    meetingId?: string;
    boardId?: string;
}

export interface TaskUpdateInput {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    assignee?: string | null;
    labels?: string[];
    order?: number;
}

export interface KanbanData {
    todo: Task[];
    'in-progress': Task[];
    done: Task[];
}

// ============================================
// Board Types
// ============================================

export interface BoardLabel {
    _id?: string;
    id?: string; // Alias
    name: string;
    color: string;
}

export interface Board {
    _id: string;
    userId: string | UserPublic;
    meetingId?: string;
    title: string;
    description?: string;
    source: BoardSource;
    shareToken?: string;
    collaborators: Collaborator[];
    labels: BoardLabel[];
    createdAt: string;
    updatedAt: string;
    // Virtual (set by controller)
    userRole?: CollaboratorRole;
}

export interface BoardCreateInput {
    title: string;
    description?: string;
    source?: BoardSource;
}

export interface BoardUpdateInput {
    title?: string;
    description?: string;
    labels?: BoardLabel[];
}

// ============================================
// Meeting Types
// ============================================

export interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
    speaker: string;
}

/**
 * Sequence-bearing form used while a Google Meet caption is still live.
 * Persistence keeps the four fields above; `sequence` is transport identity.
 */
export interface LiveCaptionSegment extends TranscriptionSegment {
    sequence: number;
}

export interface Speaker {
    speaker: string;
    start: number;
    end: number;
}

export interface MeetingAiActionItem {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate?: string | null;
    assigneeName?: string | null;
    labels: string[];
    status: TaskStatus;
}

export interface MeetingAiNotes {
    summary: string;
    highlights: Record<string, string>;
    conclusion: string;
    actionItems: MeetingAiActionItem[];
    suggestedTitle?: string;
    suggestedDescription?: string;
    tags?: string[];
}

export type RealtimeMeetingState =
    | 'idle'
    | 'requesting_permission'
    | 'starting_session'
    | 'recording'
    | 'paused'
    | 'finalizing'
    | 'ready_to_save'
    | 'saving'
    | 'completed'
    | 'recoverable_error'
    | 'cancelled';

export type BotMeetingStatus =
    | 'pending'
    | 'starting'
    | 'joining'
    | 'bot_joining'
    | 'waiting_admission'
    | 'disabling_media'
    | 'in_meeting'
    | 'bot_in_meeting'
    | 'enabling_captions'
    | 'recording'
    | 'processing'
    | 'leaving'
    | 'completed'
    | 'failed';

export type MeetingFeatureErrorCode =
    | 'SESSION_NOT_FOUND'
    | 'SESSION_MISMATCH'
    | 'SESSION_NOT_ACTIVE'
    | 'ACTIVE_SESSION_EXISTS'
    | 'INVALID_PAYLOAD'
    | 'PERMISSION_DENIED'
    | 'MEDIA_UNAVAILABLE'
    | 'PREVIEW_TOO_LARGE'
    | 'FINAL_AUDIO_TOO_LARGE'
    | 'START_TIMEOUT'
    | 'FINALIZATION_TIMEOUT'
    | 'SOCKET_DISCONNECTED'
    | 'TRANSCRIPTION_FAILED'
    | 'BOT_UNAVAILABLE'
    | 'FINALIZATION_FAILED'
    | 'PERSISTENCE_FAILED';

export interface MeetingFeatureError {
    code?: MeetingFeatureErrorCode;
    error: string;
    sessionId?: string;
    meetingId?: string;
    chunkIndex?: number;
}

export interface RealtimeSessionStartedEvent {
    sessionId: string;
    startedAt: string;
}

export interface RealtimeStartAcknowledgement {
    success: boolean;
    sessionId?: string;
    startedAt?: string;
    resumeToken?: string;
    code?: MeetingFeatureErrorCode;
    error?: string;
}

export interface RealtimeResumeAcknowledgement {
    success: boolean;
    sessionId?: string;
    status?: 'active' | 'processing' | 'completed' | 'error';
    code?: MeetingFeatureErrorCode;
    error?: string;
}

export interface RealtimeChunkAcknowledgement {
    success: boolean;
    accepted: boolean;
    dropped?: boolean;
    sessionId?: string;
    chunkIndex?: number;
    code?: MeetingFeatureErrorCode;
    error?: string;
}

export interface RealtimeFinalizationAcknowledgement {
    success: boolean;
    accepted: boolean;
    sessionId?: string;
    code?: MeetingFeatureErrorCode;
    error?: string;
}

export interface RealtimeFinalizationOptions {
    numSpeakers?: number;
    language?: string;
    enableAiNotes?: boolean;
}

export interface RealtimePreviewEvent {
    sessionId: string;
    text: string;
    chunkIndex: number;
    processingTime?: number;
}

export interface RealtimeAccumulatedEvent {
    sessionId: string;
    text: string;
    chunksProcessed: number;
    duration: number;
}

export interface RealtimeProcessingEvent {
    sessionId: string;
    message: string;
}

export interface RealtimeFinalResult {
    success: true;
    sessionId: string;
    transcript: string;
    segments: TranscriptionSegment[];
    speakers: Record<string, number> | Speaker[];
    numSpeakers: number;
    duration: number;
    processingTime: number;
    language?: string;
    diarizationMethod?: string;
    aiNotes?: MeetingAiNotes | null;
    audioBlob?: Blob;
}

export interface BotStatusEvent {
    meetingId: string;
    status: BotMeetingStatus;
    message?: string;
    chunksProcessed?: number;
    segmentCount?: number;
    duration?: number;
    timestamp?: string;
}

export interface BotCaptionEvent {
    meetingId: string;
    segment: LiveCaptionSegment;
    timestamp?: string;
}

export interface BotCompletedEvent {
    meetingId: string;
    transcript?: string;
    segments?: LiveCaptionSegment[];
    duration?: number;
    reason?: string;
    timestamp?: string;
}

export interface Transcription {
    language?: string;
    transcript?: string;
    segments?: TranscriptionSegment[];
    speakers?: Speaker[];
    summary?: string;
    highlights?: Record<string, string>; // Sub-headers as keys, markdown content as values
    conclusion?: string;
    diarizationMethod?: string;
    numSpeakers?: number;
    processingTime?: number;
}

export interface OriginalFile {
    filename: string;
    originalName?: string;
    mimetype?: string;
    size?: number;
    path?: string;
    uploadedAt?: string;
}

export interface ProcessingMeta {
    jobId?: string;
    queuedAt?: string;
    processingStartedAt?: string;
    lastUpdatedAt?: string;
    sessionId?: string;
    mediaStatus?: 'not_provided' | 'stored' | 'upload_failed';
    mediaError?: string;
}

// ...
export interface TaskCandidate {
    _id?: string;
    id?: string;
    boardId?: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: string;
    assignee?: string | UserPublic | null;
    assigneeName?: string | null;
    labels?: string[];
    status: TaskStatus;
}

export interface Meeting {
    _id: string;
    userId: string | UserPublic;
    title: string;
    description?: string;
    platform: Platform;
    type: MeetingType;
    status: MeetingStatus;
    meetingLink?: string;
    scheduledAt?: string;
    startedAt?: string;
    endedAt?: string;
    duration?: number;
    participantsCount?: number; // Number of participants (legacy field renamed)
    originalFile?: OriginalFile;
    transcription?: Transcription;
    actionItems?: TaskCandidate[]; // AI Candidates
    suggestedTitle?: string;
    isPublic: boolean;
    shareToken?: string;
    collaborators: Collaborator[];
    participants?: Participant[]; // Unified array: owner + collaborators sorted by joinedAt
    tags: string[];
    errorMessage?: string;
    retryCount: number;
    processingMeta?: ProcessingMeta;
    processingLogs?: { message: string; timestamp: string }[];
    summarySnippet?: string;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    // Virtual (set by controller)
    userRole?: CollaboratorRole;
    hasBoard?: boolean;
    boardId?: string;
    fileUrl?: string;
    // Permission flags from controller
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    canManageCollaborators?: boolean;
}

export interface MeetingCreateInput {
    title: string;
    description?: string;
    type: MeetingType;
    platform?: Platform;
    meetingLink?: string;
    scheduledAt?: string;
    tags?: string[];
}

export interface MeetingUpdateInput {
    title?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: Pagination;
    count: number;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Specific Response Types
export interface MeetingsResponse {
    success: boolean;
    meetings: Meeting[];
    pagination: Pagination;
}

export interface MeetingResponse {
    success: boolean;
    meeting: Meeting;
    actionItems?: Task[];
    fileUrl?: string;
}

export interface TasksResponse {
    success: boolean;
    data: Task[];
    count: number;
}

export interface KanbanResponse {
    success: boolean;
    data: KanbanData;
}

export interface BoardsResponse {
    success: boolean;
    data: Board[];
    count: number;
    pagination: Pagination;
}

export interface BoardResponse {
    success: boolean;
    data: Board;
}

export interface StatsData {
    meetings: {
        total: number;
        completed: number;
        pending: number;
        processing: number;
        failed: number;
    };
    totalMinutes: number;
    totalHours: number;
    tasks: {
        todo: number;
        'in-progress': number;
        done: number;
    };
    totalTasks: number;
}

export interface StatsResponse {
    success: boolean;
    data: StatsData;
}

// ============================================
// Analytics Types
// ============================================

export interface TalkTimeData {
    speaker: string;
    words: number;
    talks: number;
    total: number;
}

export interface TopicKeyword {
    name: string;
    color: string;
}

export interface AnalyticsData {
    talkTime: TalkTimeData[];
    topics: TopicKeyword[];
    actionItems?: Task[];
}

export interface AnalyticsResponse {
    success: boolean;
    data: AnalyticsData;
}
