import apiClient from './client'
import { mockNotesApi } from './mock-data'
import type {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  GenerateNoteRequest,
  GenerateNoteResponse,
  ApiResponse,
} from '@/types'

// Set to true to use mock data, false to use real API
const USE_MOCK = true

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
    if (USE_MOCK) {
      return mockNotesApi.getAll(params)
    }
    const response = await apiClient.get<ApiResponse<Note[]>>('/notes', { params })
    return response.data.data
  },

  getById: async (id: number): Promise<Note> => {
    if (USE_MOCK) {
      return mockNotesApi.getById(id)
    }
    const response = await apiClient.get<ApiResponse<Note>>(`/notes/${id}`)
    return response.data.data
  },

  create: async (data: CreateNoteRequest): Promise<Note> => {
    if (USE_MOCK) {
      return mockNotesApi.create(data)
    }
    const response = await apiClient.post<ApiResponse<Note>>('/notes', data)
    return response.data.data
  },

  update: async (id: number, data: UpdateNoteRequest): Promise<Note> => {
    if (USE_MOCK) {
      return mockNotesApi.update(id, data)
    }
    const response = await apiClient.put<ApiResponse<Note>>(`/notes/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    if (USE_MOCK) {
      return mockNotesApi.delete(id)
    }
    await apiClient.delete(`/notes/${id}`)
  },

  generate: async (data: GenerateNoteRequest): Promise<GenerateNoteResponse> => {
    if (USE_MOCK) {
      // Mock AI generation
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        title: 'AI 生成的笔记',
        content: '<p>这是 AI 根据对话内容自动生成的笔记摘要。</p>',
        tags: ['AI生成'],
      }
    }
    const response = await apiClient.post<ApiResponse<GenerateNoteResponse>>(
      '/notes/generate',
      data
    )
    return response.data.data
  },

  export: async (id: number): Promise<Blob> => {
    if (USE_MOCK) {
      const note = await mockNotesApi.getById(id)
      const markdown = `# ${note.title}\n\n${note.content.replace(/<[^>]*>/g, '')}`
      return new Blob([markdown], { type: 'text/markdown' })
    }
    const response = await apiClient.get(`/notes/${id}/export`, {
      responseType: 'blob',
    })
    return response.data
  },

  exportBatch: async (ids: number[]): Promise<Blob> => {
    if (USE_MOCK) {
      const notes = await Promise.all(ids.map(id => mockNotesApi.getById(id)))
      const content = notes.map(n => `# ${n.title}\n\n${n.content.replace(/<[^>]*>/g, '')}`).join('\n\n---\n\n')
      return new Blob([content], { type: 'text/markdown' })
    }
    const response = await apiClient.post('/notes/export', { ids }, {
      responseType: 'blob',
    })
    return response.data
  },

  // New API functions for redesign
  importMarkdown: async (file: File, folderId?: number): Promise<Note> => {
    if (USE_MOCK) {
      return mockNotesApi.importMarkdown(file, folderId)
    }
    const formData = new FormData()
    formData.append('file', file)
    if (folderId !== undefined) {
      formData.append('folder_id', String(folderId))
    }
    const response = await apiClient.post<ApiResponse<Note>>('/notes/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  batchDeleteNotes: async (ids: number[]): Promise<void> => {
    if (USE_MOCK) {
      return mockNotesApi.batchDeleteNotes(ids)
    }
    await apiClient.post('/notes/batch-delete', { ids })
  },

  batchMoveNotes: async (ids: number[], targetFolderId: number | null): Promise<void> => {
    if (USE_MOCK) {
      return mockNotesApi.batchMoveNotes(ids, targetFolderId)
    }
    await apiClient.post('/notes/batch-move', { ids, target_folder_id: targetFolderId })
  },

  copyNote: async (id: number): Promise<Note> => {
    if (USE_MOCK) {
      return mockNotesApi.copyNote(id)
    }
    const response = await apiClient.post<ApiResponse<Note>>(`/notes/${id}/copy`)
    return response.data.data
  },
}
