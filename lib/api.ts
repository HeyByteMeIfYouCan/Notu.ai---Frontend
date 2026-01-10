import type {
  Meeting,
  MeetingCreateInput,
  MeetingUpdateInput,
  MeetingsResponse,
  MeetingResponse,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TasksResponse,
  KanbanResponse,
  KanbanData,
  Board,
  BoardCreateInput,
  BoardUpdateInput,
  BoardsResponse,
  BoardResponse,
  StatsResponse,
  AnalyticsResponse,
  UserPreferences,
  ApiResponse,
  TaskStatus,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

// Re-export types for consumers
export type {
  Meeting,
  MeetingCreateInput,
  MeetingUpdateInput,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  Board,
  BoardCreateInput,
  BoardUpdateInput,
  KanbanData,
  StatsResponse,
  TasksResponse,
  KanbanResponse,
  MeetingsResponse,
  BoardsResponse,
};

export class ApiError extends Error {
  public status: number;
  public diagnostics?: any;

  constructor(message: string, status = 500, diagnostics?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.diagnostics = diagnostics;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, token, headers = {} } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
      cache: 'no-store', // Ensure fresh data for real-time
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    const data = await response.json();

    if (!response.ok) {
      // Surface structured error to callers (includes diagnostics if present)
      throw new ApiError(data.message || 'API request failed', response.status, data.__llm_diagnostics || data.diagnostics || null);
    }

    return data;
  }

  // Auth endpoints
  async verifyToken(token: string) {
    return this.request('/api/auth/verify', { token });
  }

  async getProfile(token: string) {
    return this.request('/api/auth/profile', { token });
  }

  async updateProfile(token: string, data: { name?: string; preferences?: Partial<UserPreferences> }) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      token,
      body: data,
    });
  }

  // Meeting endpoints
  async getMeetings(token: string, params?: { page?: number; limit?: number; status?: string; type?: string; search?: string; filter?: string }): Promise<MeetingsResponse> {
    let queryString = ''
    if (params) {
      const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      queryString = filtered.length ? '?' + new URLSearchParams(Object.fromEntries(filtered) as Record<string, string>).toString() : ''
    }
    return this.request<MeetingsResponse>(`/api/meetings${queryString}`, { token });
  }

  async getMeeting(token: string, id: string): Promise<MeetingResponse> {
    return this.request(`/api/meetings/${id}`, { token });
  }

  async getMeetingAnalytics(token: string, id: string): Promise<AnalyticsResponse> {
    return this.request(`/api/meetings/${id}/analytics`, { token });
  }

  async createMeeting(token: string, data: MeetingCreateInput): Promise<MeetingResponse> {
    return this.request('/api/meetings', {
      method: 'POST',
      token,
      body: data,
    });
  }

  async createOnlineMeeting(token: string, data: { title: string; meetingLink: string; platform?: string; duration?: number }) {
    return this.request('/api/meetings/online', {
      method: 'POST',
      token,
      body: data,
    });
  }

  async createRealtimeMeeting(token: string, data: {
    title: string;
    description?: string;
    sessionId: string;
    transcript: string;
    segments: Array<{ start: number; end: number; text: string; speaker: string }>;
    speakers?: Record<string, number> | Array<{ speaker: string; start: number; end: number }>;
    numSpeakers?: number;
    duration: number;
    language?: string;
    aiNotes?: {
      summary?: string;
      highlights?: Record<string, string>;
      conclusion?: string;
      actionItems?: any[];
      suggestedTitle?: string;
      suggestedDescription?: string;
      tags?: string[];
    };
    processingTime?: number;
    audioBlob?: Blob; // Optional audio blob to save
  }) {
    // If audio blob is provided, use FormData for multipart upload
    if (data.audioBlob) {
      const formData = new FormData();
      formData.append('audio', data.audioBlob, 'recording.webm');
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      formData.append('sessionId', data.sessionId);
      formData.append('transcript', data.transcript);
      formData.append('segments', JSON.stringify(data.segments));
      if (data.speakers) formData.append('speakers', JSON.stringify(data.speakers));
      if (data.numSpeakers) formData.append('numSpeakers', data.numSpeakers.toString());
      formData.append('duration', data.duration.toString());
      if (data.language) formData.append('language', data.language);
      if (data.aiNotes) formData.append('aiNotes', JSON.stringify(data.aiNotes));
      if (data.processingTime) formData.append('processingTime', data.processingTime.toString());

      const response = await fetch(`${this.baseUrl}/api/meetings/realtime`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new ApiError(result.message || 'API request failed', response.status, result.__llm_diagnostics || result.diagnostics || null);
      }
      return result;
    }

    // Fallback to JSON request without audio
    return this.request('/api/meetings/realtime', {
      method: 'POST',
      token,
      body: data,
    });
  }

  async getMeetingStatus(token: string, id: string) {
    return this.request(`/api/meetings/${id}/status`, { token });
  }

  async retryTranscription(token: string, id: string) {
    return this.request(`/api/meetings/${id}/retry`, {
      method: 'POST',
      token,
    });
  }

  async regenerateAiNotes(token: string, id: string) {
    return this.request(`/api/meetings/${id}/regenerate-ai`, {
      method: 'POST',
      token,
    });
  }

  async updateMeeting(token: string, id: string, data: MeetingUpdateInput): Promise<ApiResponse<Meeting>> {
    return this.request(`/api/meetings/${id}`, {
      method: 'PATCH',
      token,
      body: data,
    });
  }

  async deleteMeeting(token: string, id: string) {
    return this.request(`/api/meetings/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Pin Meetings
  async toggleMeetingPin(token: string, id: string) {
    return this.request(`/api/meetings/${id}/pin`, { method: 'POST', token });
  }

  async getPinnedMeetings(token: string) {
    return this.request('/api/meetings/pinned', { token });
  }

  // Sharing & Collaboration (Meetings)
  async generateMeetingShareLink(token: string, id: string) {
    return this.request(`/api/meetings/${id}/share`, { method: 'POST', token });
  }

  async joinMeeting(token: string, shareToken: string) {
    return this.request(`/api/meetings/join/${shareToken}`, { method: 'POST', token });
  }

  async revokeMeetingShareLink(token: string, id: string) {
    return this.request(`/api/meetings/${id}/share`, { method: 'DELETE', token });
  }

  async updateMeetingCollaboratorRole(token: string, id: string, userId: string, role: string) {
    return this.request(`/api/meetings/${id}/collaborators/${userId}`, {
      method: 'PATCH',
      token,
      body: { role },
    });
  }

  async removeMeetingCollaborator(token: string, id: string, userId: string) {
    return this.request(`/api/meetings/${id}/collaborators/${userId}`, {
      method: 'DELETE',
      token,
    });
  }

  async updateSpeakerName(token: string, id: string, data: { oldSpeakerName: string; newSpeakerName: string; segmentIndex?: number; applyToAll: boolean }) {
    return this.request(`/api/meetings/${id}/segments/speaker`, {
      method: 'PATCH',
      token,
      body: data
    });
  }

  // Ask AI - Chat with meeting context
  async askAI(token: string, meetingId: string, question: string): Promise<{ success: boolean; data: { question: string; answer: string; messageId: string; responseTime: number } }> {
    return this.request(`/api/meetings/${meetingId}/ask`, {
      method: 'POST',
      token,
      body: { question },
    });
  }

  async getChatHistory(token: string, meetingId: string, limit = 50): Promise<{ success: boolean; data: Array<{ _id: string; role: 'user' | 'assistant'; content: string; createdAt: string; userId?: { name: string; image?: string } }> }> {
    return this.request(`/api/meetings/${meetingId}/chat?limit=${limit}`, { token });
  }

  async clearChatHistory(token: string, meetingId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/meetings/${meetingId}/chat`, {
      method: 'DELETE',
      token,
    });
  }

  async exportTranscript(token: string, id: string, format: 'json' | 'txt' | 'srt' | 'vtt' | 'mp3' | 'mp4' = 'txt') {
    const response = await fetch(`${this.baseUrl}/api/meetings/${id}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.message || 'Export failed');
    }
    return response.blob();
  }

  // Task endpoints
  async getTasks(token: string, params?: { status?: string; meetingId?: string; priority?: string }): Promise<TasksResponse> {
    let queryString = ''
    if (params) {
      const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      queryString = filtered.length ? '?' + new URLSearchParams(Object.fromEntries(filtered) as Record<string, string>).toString() : ''
    }
    return this.request<TasksResponse>(`/api/tasks${queryString}`, { token });
  }

  async getKanbanTasks(token: string, boardId?: string): Promise<KanbanResponse> {
    const queryString = boardId ? `?boardId=${boardId}` : '';
    return this.request<KanbanResponse>(`/api/tasks/kanban${queryString}`, { token });
  }

  async getTask(token: string, id: string): Promise<ApiResponse<Task>> {
    return this.request(`/api/tasks/${id}`, { token });
  }

  async createTask(token: string, data: TaskCreateInput): Promise<ApiResponse<Task>> {
    return this.request('/api/tasks', {
      method: 'POST',
      token,
      body: data,
    });
  }

  async updateTask(token: string, id: string, data: TaskUpdateInput): Promise<ApiResponse<Task>> {
    return this.request(`/api/tasks/${id}`, {
      method: 'PATCH',
      token,
      body: data,
    });
  }

  async deleteTask(token: string, id: string) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async reorderTasks(token: string, tasks: { id: string; order: number; status: TaskStatus }[], boardId?: string): Promise<ApiResponse> {
    return this.request('/api/tasks/reorder', {
      method: 'PATCH',
      token,
      body: { tasks, boardId },
    });
  }

  // Analytics endpoints
  async getStats(token: string): Promise<StatsResponse> {
    return this.request<StatsResponse>('/api/analytics/stats', { token });
  }

  async getTrends(token: string, period?: '7d' | '30d' | '90d') {
    const queryString = period ? `?period=${period}` : '';
    return this.request(`/api/analytics/trends${queryString}`, { token });
  }

  async getPlatformStats(token: string) {
    return this.request('/api/analytics/platforms', { token });
  }

  async getRecentActivity(token: string, limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return this.request(`/api/analytics/activity${queryString}`, { token });
  }

  async getGlobalAnalytics(token: string) {
    return this.request('/api/analytics/global', { token });
  }

  async getDetailAnalyticsList(token: string, params?: { page?: number; limit?: number; sortBy?: string; filter?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.filter) queryParams.append('filter', params.filter);
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/api/analytics/meetings${queryString}`, { token });
  }

  async getMeetingDetailAnalytics(token: string, meetingId: string) {
    return this.request(`/api/analytics/meetings/${meetingId}/detail`, { token });
  }

  // Upload endpoint with real progress tracking using XMLHttpRequest
  async uploadFile(token: string, file: File, metadata?: any, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseUrl}/api/upload`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new ApiError(data.message || 'Upload failed', xhr.status));
          }
        } catch (e) {
          reject(new ApiError('Failed to parse response', xhr.status));
        }
      };

      xhr.onerror = () => {
        reject(new ApiError('Network error during upload', 0));
      };

      xhr.onabort = () => {
        reject(new ApiError('Upload cancelled', 0));
      };

      xhr.send(formData);
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }
  // Board endpoints
  async getBoards(token: string, params?: { filter?: string; meetingId?: string; search?: string; page?: number; limit?: number; source?: string }): Promise<BoardsResponse> {
    let queryString = ''
    if (params) {
      const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      queryString = filtered.length ? '?' + new URLSearchParams(Object.fromEntries(filtered) as Record<string, string>).toString() : ''
    }
    return this.request<BoardsResponse>(`/api/boards${queryString}`, { token });
  }

  async getBoard(token: string, id: string): Promise<BoardResponse> {
    return this.request<BoardResponse>(`/api/boards/${id}`, { token });
  }

  async updateBoard(token: string, id: string, data: BoardUpdateInput): Promise<BoardResponse> {
    return this.request<BoardResponse>(`/api/boards/${id}`, {
      method: 'PATCH',
      token,
      body: data
    });
  }

  async createBoardFromMeeting(token: string, meetingId: string) {
    return this.request('/api/boards/from-meeting', {
      method: 'POST',
      token,
      body: { meetingId },
    });
  }

  async createBoard(token: string, data: BoardCreateInput): Promise<BoardResponse> {
    return this.request<BoardResponse>('/api/boards', {
      method: 'POST',
      token,
      body: data,
    });
  }

  async deleteBoard(token: string, id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/api/boards/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Pin Boards
  async toggleBoardPin(token: string, id: string) {
    return this.request(`/api/boards/${id}/pin`, { method: 'POST', token });
  }

  async getPinnedBoards(token: string) {
    return this.request('/api/boards/pinned', { token });
  }

  // Sharing & Collaboration (Boards)
  async generateBoardShareLink(token: string, id: string) {
    return this.request(`/api/boards/${id}/share`, { method: 'POST', token });
  }

  async joinBoard(token: string, shareToken: string) {
    return this.request(`/api/boards/join/${shareToken}`, { method: 'POST', token });
  }

  async revokeBoardShareLink(token: string, id: string) {
    return this.request(`/api/boards/${id}/share`, { method: 'DELETE', token });
  }

  async updateBoardCollaboratorRole(token: string, id: string, userId: string, role: string) {
    return this.request(`/api/boards/${id}/collaborators/${userId}`, {
      method: 'PATCH',
      token,
      body: { role },
    });
  }

  async removeBoardCollaborator(token: string, id: string, userId: string) {
    return this.request(`/api/boards/${id}/collaborators/${userId}`, {
      method: 'DELETE',
      token,
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
