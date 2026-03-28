// User types
export interface User {
  id: number
  email: string
  created_at: string
  updated_at: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  code: string
}

export interface AuthResponse {
  token: string
  user: User
}

export type OAuthProvider = 'google' | 'github' | 'microsoft'

export interface OAuthAccount {
  id: number
  user_id: number
  provider: OAuthProvider
  provider_user_id: string
  created_at: string
  updated_at: string
}

export interface OAuthURLResponse {
  auth_url: string
}

export interface OAuthCallbackRequest {
  code: string
  state: string
}

export interface LinkedAccountsResponse {
  accounts: OAuthAccount[]
}

export interface DeleteAccountRequest {
  password?: string
}

// Provider types
export type ProviderType =
  | 'openai'
  | 'volcengine'
  | 'deepseek'
  | 'anthropic'
  | 'google'
  | 'moonshot'
  | 'zhipu'
  | 'custom'

export interface Provider {
  id: string
  name: string
  type: ProviderType
  api_base: string
  models: ProviderModel[]
  created_at: string
  updated_at: string
}

export interface ProviderModel {
  id: string
  provider_id: string
  model_id: string
  display_name: string
  is_default: boolean
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface CreateProviderRequest {
  name: string
  type: ProviderType
  api_base: string
  api_key: string
}

export interface UpdateProviderRequest {
  name?: string
  api_base?: string
  api_key?: string
}

export interface CreateProviderModelRequest {
  model_id: string
  display_name?: string
  is_default?: boolean
}

export interface UpdateProviderModelRequest {
  display_name?: string
  is_default?: boolean
  enabled?: boolean
}

export interface BatchAddProviderModelsRequest {
  models: {
    model_id: string
    display_name?: string
  }[]
  default_model_id?: string
}

export interface AvailableModel {
  id: string
  name: string
  owned_by: string
}

export interface PredefinedModel {
  model_id: string
  display_name: string
}

// Sync models types
export interface SyncModelsRequest {
  add?: {
    model_id: string
    display_name?: string
    is_default?: boolean // Set this model as default (for newly added models)
  }[]
  delete?: string[] // provider_model IDs to delete (hard delete)
  enable?: string[] // provider_model IDs to enable
  disable?: string[] // provider_model IDs to disable
  default_model_id?: string // provider_model ID to set as default
}

export interface SyncModelsResponse {
  models: ProviderModel[]
  added: number
  deleted: number
  updated: number
  enabled: number
  disabled: number
}

// Model types (deprecated - use Provider/ProviderModel instead)
/** @deprecated Use ProviderModel instead */
export interface Model {
  id: number
  user_id: number
  name: string
  api_base: string
  api_key: string
  model_name: string
  is_default: boolean
  created_at: string
  updated_at: string
}

/** @deprecated Use CreateProviderRequest instead */
export interface CreateModelRequest {
  name: string
  api_base: string
  api_key: string
  model_name: string
  is_default?: boolean
}

/** @deprecated Use UpdateProviderRequest instead */
export interface UpdateModelRequest {
  name?: string
  api_base?: string
  api_key?: string
  model_name?: string
  is_default?: boolean
}

// Conversation types
export interface Conversation {
  id: number
  user_id: number
  current_provider_model_id: string | null // Currently selected model (can be switched)
  model_id: string // Snapshot of model_id (e.g., "gpt-4o"), preserved after model deletion
  title: string
  is_saved: boolean
  created_at: string
  updated_at: string
}

export interface ConversationSearchResult {
  id: number
  title: string
  snippet: string
  matched_in: 'title' | 'content'
  rank: number
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
  provider_model_id?: string | null // Model used for this message (assistant messages only)
  model_id?: string // Model ID snapshot (e.g., "gpt-4o"), preserved after model deletion
  created_at: string
}

export interface CreateConversationRequest {
  provider_model_id?: string
  model_id?: string // Model ID snapshot (e.g., "gpt-4o")
  title?: string
}

export interface SendMessageRequest {
  content: string
  stream?: boolean
}

export interface StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: {
      content?: string
      role?: string
    }
    finish_reason: string | null
  }[]
}

// Note types
export interface Note {
  id: number
  user_id: number
  folder_id: number | null
  title: string
  content: string
  tags: string[]
  source_conversation_id: number | null
  created_at: string
  updated_at: string
}

export interface CreateNoteRequest {
  title: string
  content: string
  tags?: string[]
  folder_id?: number
  source_conversation_id?: number
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  tags?: string[]
  folder_id?: number
}

export interface GenerateNoteRequest {
  conversation_id: number
}

export interface GenerateNoteResponse {
  title: string
  content: string
  tags: string[]
}

export interface AsyncNoteGenerationResponse {
  task_id: number
}

export interface NoteGenerationTask {
  id: number
  user_id: number
  conversation_id: number
  status: 'generating' | 'done' | 'failed'
  error_message: string | null
  note_id: number | null
  created_at: string
  updated_at: string
}

// Folder types
export interface Folder {
  id: number
  user_id: number
  name: string
  parent_id: number | null
  created_at: string
  updated_at: string
}

export interface CreateFolderRequest {
  name: string
  parent_id?: number
}

export interface UpdateFolderRequest {
  name?: string
  parent_id?: number
}

// Tag types
export interface Tag {
  name: string
  count: number
}

// API Response types
export interface ApiResponse<T> {
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}

export interface ApiError {
  error: string
  message: string
}

export * from './notification'
