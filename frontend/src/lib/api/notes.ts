import apiClient from './client'
import type {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  GenerateNoteRequest,
  GenerateNoteResponse,
  AsyncNoteGenerationResponse,
  NoteGenerationTask,
  ApiResponse,
} from '@/types'

// Backend NoteTag format (from API)
interface BackendNoteTag {
  note_id: number
  tag: string
  created_at: string
}

// Backend Note format with NoteTag array
interface BackendNote {
  id: number
  user_id: number
  folder_id: number | null
  title: string
  content: string
  tags: BackendNoteTag[]
  source_conversation_id: number | null
  notion_page_id?: string
  notion_last_sync_at?: string
  created_at: string
  updated_at: string
}

// Convert backend NoteTag[] to frontend string[]
const convertTags = (tags: BackendNoteTag[] | undefined): string[] => {
  if (!tags || !Array.isArray(tags)) return []
  return tags.map(t => t.tag)
}

// Convert backend Note to frontend Note
const convertNote = (note: BackendNote): Note => ({
  ...note,
  tags: convertTags(note.tags),
})

export interface NotesQueryParams {
  folder_id?: number
  tag?: string
  search?: string
  page?: number
  page_size?: number
}

export interface ImportMarkdownResult {
  note: Note
  filename: string
  success: boolean
  error?: string
}

export const notesApi = {
  getAll: async (params?: NotesQueryParams): Promise<Note[]> => {
    const response = await apiClient.get<ApiResponse<BackendNote[]>>('/notes', { params })
    return response.data.data.map(convertNote)
  },

  getById: async (id: number): Promise<Note> => {
    const response = await apiClient.get<ApiResponse<BackendNote>>(`/notes/${id}`)
    return convertNote(response.data.data)
  },

  create: async (data: CreateNoteRequest): Promise<{ note: Note; warning?: string }> => {
    const response = await apiClient.post<ApiResponse<BackendNote>>('/notes', data)
    return {
      note: convertNote(response.data.data),
      warning: response.data.warning
    }
  },

  update: async (id: number, data: UpdateNoteRequest): Promise<{ note: Note; warning?: string }> => {
    const response = await apiClient.put<ApiResponse<BackendNote>>(`/notes/${id}`, data)
    return {
      note: convertNote(response.data.data),
      warning: response.data.warning
    }
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/notes/${id}`)
  },

  generate: async (data: GenerateNoteRequest): Promise<AsyncNoteGenerationResponse> => {
    const response = await apiClient.post<ApiResponse<AsyncNoteGenerationResponse>>(
      '/notes/generate',
      data,
      { timeout: 120000 }
    )
    return response.data.data
  },

  getTask: async (taskId: number): Promise<NoteGenerationTask> => {
    const response = await apiClient.get<ApiResponse<NoteGenerationTask>>(
      `/notes/tasks/${taskId}`
    )
    return response.data.data
  },

  export: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/notes/${id}/export`, {
      responseType: 'blob',
    })
    return response.data
  },

  exportBatch: async (ids: number[]): Promise<Blob> => {
    const response = await apiClient.post('/notes/export', { ids }, {
      responseType: 'blob',
    })
    return response.data
  },

  importMarkdown: async (file: File, folderId?: number): Promise<Note> => {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId !== undefined) {
      formData.append('folder_id', String(folderId))
    }
    const response = await apiClient.post<ApiResponse<BackendNote>>('/notes/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return convertNote(response.data.data)
  },

  batchDeleteNotes: async (ids: number[]): Promise<void> => {
    await apiClient.post('/notes/batch-delete', { ids })
  },

  batchMoveNotes: async (ids: number[], targetFolderId: number | null): Promise<void> => {
    await apiClient.post('/notes/batch-move', { ids, target_folder_id: targetFolderId })
  },

  copyNote: async (id: number): Promise<Note> => {
    const response = await apiClient.post<ApiResponse<BackendNote>>(`/notes/${id}/copy`)
    return convertNote(response.data.data)
  },

  syncNoteToNotion: async (id: number): Promise<void> => {
    await apiClient.post(`/notes/${id}/sync/notion`)
  },
}
